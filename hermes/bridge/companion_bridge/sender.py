"""Record-mode sender: one bounded FIFO + one daemon writer thread.

The hook thread only calls :meth:`RecordSender.offer` (one ``put_nowait``). Everything else --
session classification, JSON encoding, file I/O, rotation, beats -- runs on the writer thread.
Session-scoped values (contextvars) are read on the writer thread inside the hook's captured
``contextvars.Context`` so they reflect the turn that fired the hook.

Accounting: ``received == recorded + dropped`` once the queue is drained, where
``dropped = dropped_full + dropped_write + dropped_build``. Producer-generated lines (hello, beat,
loss, bye, register) are not counted as received.
"""

from __future__ import annotations

import contextvars
import json
import logging
import os
import queue
import socket
import threading
import time
import uuid
from collections import OrderedDict
from pathlib import Path
from typing import Any, Callable, Optional

from . import derive as _derive

logger = logging.getLogger("hermes_plugins.companion_bridge")

DEFAULT_QUEUE_MAX = 4096
DEFAULT_ROTATE_BYTES = 10 * 1024 * 1024
DEFAULT_MAX_PARTS = 50
BEAT_INTERVAL_S = 10.0
POLL_INTERVAL_S = 0.05
ATEXIT_FLUSH_S = 0.3
_BATCH_MAX = 8  # small batches: the writer holds the GIL ~0.15 ms at a time
_PLATFORM_CACHE_MAX = 2048
_LOSS_SESSIONS_MAX = 256


def default_raw_dir() -> Path:
    base = os.environ.get("XDG_STATE_HOME") or ""
    root = Path(base) if os.path.isabs(base) else Path.home() / ".local" / "state"
    return root / "hermes-companion"


# --- session classification (runs on the writer thread, inside the hook's context) -----------

def _hermes_classifier() -> Callable[[Optional[str]], dict[str, Any]]:
    """Bind the Hermes helpers once (import cost paid in register(), never on a hook thread)."""
    from agent.session_source import session_source_for
    from gateway.session_finite import finite_turn_required
    from hermes_cli.profiles import current_profile_name
    try:
        from agent.delegation_context import owned_kanban_task
    except Exception:  # older Hermes
        owned_kanban_task = None  # type: ignore[assignment]
    try:
        from gateway import session_context as _sc
        _var_map = getattr(_sc, "_VAR_MAP", {})
        _unset = getattr(_sc, "_UNSET", object())
    except Exception:
        _var_map, _unset = {}, object()
    try:
        from hermes_constants import get_hermes_home_override
    except Exception:
        get_hermes_home_override = lambda: None  # noqa: E731
    # current_profile_name() resolves paths (~100 us of realpath syscalls). Its inputs are the
    # context-local home override and three env vars, so memoise on exactly those.
    profile_cache: dict[tuple, Optional[str]] = {}
    env = os.environ

    def profile_name() -> Optional[str]:
        key = (get_hermes_home_override(), env.get("HERMES_HOME"), env.get("HERMES_PROFILE_NAME"),
               env.get("HERMES_PROFILE"))
        try:
            return profile_cache[key]
        except KeyError:
            if len(profile_cache) > 64:
                profile_cache.clear()
            value = profile_cache[key] = current_profile_name("default")
            return value

    src_var = _var_map.get("HERMES_SESSION_SOURCE")
    sid_var = _var_map.get("HERMES_SESSION_ID")

    def classify(platform: Optional[str]) -> dict[str, Any]:
        out: dict[str, Any] = {}
        try:
            out["source"] = session_source_for(platform)
        except Exception:
            out["source"] = None
        try:
            out["finite"] = finite_turn_required()
        except Exception:
            out["finite"] = None
        try:
            out["profile"] = profile_name()
        except Exception:
            out["profile"] = None
        try:
            task = owned_kanban_task() if owned_kanban_task else ""
            out["kanban_task"] = task or (os.environ.get("HERMES_KANBAN_TASK") or "").strip() or None
            out["kanban_owned"] = bool(task)
        except Exception:
            out["kanban_task"], out["kanban_owned"] = None, False
        # Diagnostics: were the session-scoped values visible as contextvars?
        out["cv_source"] = bool(src_var is not None and src_var.get() is not _unset)
        out["cv_session_id"] = bool(sid_var is not None and sid_var.get() is not _unset)
        out["env_source"] = "HERMES_SESSION_SOURCE" in os.environ
        return out

    return classify


def _null_classifier(platform: Optional[str]) -> dict[str, Any]:
    return {"source": platform or None, "finite": None, "profile": None, "kanban_task": None,
            "kanban_owned": False, "cv_source": False, "cv_session_id": False,
            "env_source": "HERMES_SESSION_SOURCE" in os.environ}


def make_classifier() -> Callable[[Optional[str]], dict[str, Any]]:
    try:
        return _hermes_classifier()
    except Exception:
        return _null_classifier


# --- sender --------------------------------------------------------------------------------------

class RecordSender:
    def __init__(self, raw_dir: Optional[Path] = None, *, queue_max: int = DEFAULT_QUEUE_MAX,
                 rotate_bytes: int = DEFAULT_ROTATE_BYTES, max_parts: int = DEFAULT_MAX_PARTS,
                 beat_interval: float = BEAT_INTERVAL_S, poll_interval: float = POLL_INTERVAL_S,
                 classifier: Optional[Callable[[Optional[str]], dict[str, Any]]] = None,
                 plugin_version: str = "", start: bool = True) -> None:
        self.incarnation = uuid.uuid4().hex
        self.pid = os.getpid()
        self.host = socket.gethostname()
        self.started_at = time.time()
        self.producer = {"incarnation": self.incarnation, "host": self.host, "pid": self.pid}
        self.raw_dir = Path(raw_dir) if raw_dir else default_raw_dir()
        self.path = self.raw_dir / f"raw-{self.incarnation}.jsonl"
        self.rotate_bytes = rotate_bytes
        self.max_parts = max_parts
        self.beat_interval = beat_interval
        self.poll_interval = poll_interval
        self.plugin_version = plugin_version
        self._classify = classifier or _null_classifier
        self._q: "queue.Queue[tuple]" = queue.Queue(maxsize=queue_max)
        self._lock = threading.Lock()  # counters + loss set (offer side)
        self.received = 0
        self.dropped_full = 0
        self.recorded = 0
        self.dropped_write = 0
        self.dropped_build = 0
        self.write_errors = 0
        self._lost_sessions: set[str] = set()
        self._lost_count = 0
        self._pseq = 0
        self._platform_by_session: "OrderedDict[str, str]" = OrderedDict()
        self._fd: Optional[int] = None
        self._size = 0
        self._part = 0
        self._stop = threading.Event()
        self._wake = threading.Event()  # kick(): drain now instead of at the next poll
        self._pending_ctl: list[tuple[str, dict[str, Any]]] = []  # control lines from other threads
        self._ctl_lock = threading.Lock()
        self._thread: Optional[threading.Thread] = None
        self._bye_reason = "exit"
        self.control("producer.hello", {"incarnation": self.incarnation, "pid": self.pid,
                                        "started_at": self.started_at, "plugin_version": plugin_version,
                                        "mode": "record"})
        if start:
            self.start()

    # -- hot path ---------------------------------------------------------------------------------
    def offer(self, hook: str, kwargs: dict[str, Any]) -> None:
        """Called on the hook thread. One put_nowait; never raises, never blocks, no I/O."""
        item = (hook, time.time(), _derive.pick(hook, kwargs), contextvars.copy_context(),
                threading.current_thread().name)
        with self._lock:
            self.received += 1
        try:
            self._q.put_nowait(item)
        except queue.Full:
            sid = item[2].get("session_id") or item[2].get("child_session_id")
            with self._lock:
                self.dropped_full += 1
                self._lost_count += 1
                if isinstance(sid, str) and sid and len(self._lost_sessions) < _LOSS_SESSIONS_MAX:
                    self._lost_sessions.add(sid)

    # -- control ------------------------------------------------------------------------------------
    def control(self, kind: str, data: dict[str, Any]) -> None:
        """Queue a producer-level line (written by the writer thread; never counted as received)."""
        with self._ctl_lock:
            self._pending_ctl.append((kind, data))

    def stats(self) -> dict[str, int]:
        with self._lock:
            return {"received": self.received, "recorded": self.recorded,
                    "dropped": self.dropped_full + self.dropped_write + self.dropped_build,
                    "dropped_full": self.dropped_full, "dropped_write": self.dropped_write,
                    "dropped_build": self.dropped_build, "queued": self._q.qsize()}

    def start(self) -> None:
        if self._thread is None or not self._thread.is_alive():
            self._thread = threading.Thread(target=self._run, name="companion-bridge-writer", daemon=True)
            self._thread.start()

    def close(self, timeout: float = ATEXIT_FLUSH_S, reason: str = "exit") -> None:
        """Drain what fits in ``timeout``, then write producer.bye and stop the writer."""
        self._bye_reason = reason
        self._stop.set()
        self._wake.set()
        t = self._thread
        if t is not None and t.is_alive() and t is not threading.current_thread():
            t.join(timeout)
        elif t is None:
            self._finish()  # never started (tests): write synchronously

    def _finish(self) -> None:
        while self._q.qsize():
            self._drain_once(block=False)
        self.control("producer.bye", {"reason": self._bye_reason, **self.stats()})
        self._drain_once(block=False)
        self._close_fd()

    def kick(self) -> None:
        """Ask the writer to drain now (turn end). Cheap: one Event.set()."""
        self._wake.set()

    def flush(self, timeout: float = 2.0) -> bool:
        """Wait until the queue and control lines are written (tests; on_session_finalize)."""
        self._wake.set()
        deadline = time.monotonic() + timeout
        while time.monotonic() < deadline:
            with self._ctl_lock:
                ctl = bool(self._pending_ctl)
            if self._q.unfinished_tasks == 0 and not ctl:
                return True
            time.sleep(0.002)
        return False

    # -- writer thread ------------------------------------------------------------------------------
    def _run(self) -> None:
        # Poll, do not block on the queue: a blocking get() wakes this thread on every put and
        # makes it contend for the GIL with the hook threads.
        next_beat = time.monotonic() + self.beat_interval
        while True:
            self._wake.wait(self.poll_interval)
            self._wake.clear()
            stopping = self._stop.is_set()
            try:
                self._drain_once(block=False)
                while self._q.qsize():
                    time.sleep(0.0002)  # really hand the GIL to hook threads between batches
                    self._drain_once(block=False)
            except Exception:  # the writer must survive anything
                logger.debug("companion-bridge writer iteration failed", exc_info=True)
            if time.monotonic() >= next_beat:
                next_beat = time.monotonic() + self.beat_interval
                self.control("producer.beat", self._beat_data())
            if stopping:
                try:
                    self._finish()
                except Exception:
                    logger.debug("companion-bridge final drain failed", exc_info=True)
                return

    def _beat_data(self) -> dict[str, Any]:
        return {"uptime_s": round(time.time() - self.started_at, 1), **self.stats()}

    def _drain_once(self, block: bool, timeout: float = 0.0) -> None:
        items: list[tuple] = []
        if block:
            try:
                items.append(self._q.get(timeout=timeout) if timeout > 0 else self._q.get_nowait())
            except queue.Empty:
                pass
        while len(items) < _BATCH_MAX:
            try:
                items.append(self._q.get_nowait())
            except queue.Empty:
                break
        lines: list[bytes] = []
        with self._ctl_lock:
            ctl, self._pending_ctl = self._pending_ctl, []
        for kind, data in ctl:
            lines.append(self._encode(kind, None, data))
        with self._lock:
            lost, lost_n = self._lost_sessions, self._lost_count
            self._lost_sessions, self._lost_count = set(), 0
        if lost_n:
            lines.append(self._encode("producer.loss", None, {"sessions": sorted(lost), "dropped": lost_n}))
        event_lines: list[bytes] = []
        built_fail = 0
        for item in items:
            try:
                event_lines.append(self._build(item))
            except Exception:
                built_fail += 1
        ok = self._write(lines + event_lines) if (lines or event_lines) else True
        with self._lock:
            self.dropped_build += built_fail
            if ok:
                self.recorded += len(event_lines)
            else:
                self.dropped_write += len(event_lines)
        for _ in items:
            self._q.task_done()

    def _next_pseq(self) -> int:
        self._pseq += 1
        return self._pseq

    def _encode(self, kind: str, session: Optional[dict[str, Any]], data: dict[str, Any],
                ts: Optional[float] = None, observer: Optional[str] = None,
                diag: Optional[dict[str, Any]] = None) -> bytes:
        env = _derive.envelope(producer=self.producer, pseq=self._next_pseq(),
                               ts=round(ts if ts is not None else time.time(), 6), kind=kind,
                               session=session, data=data, observer=observer, diag=diag)
        return (json.dumps(env, separators=(",", ":"), ensure_ascii=False) + "\n").encode("utf-8")

    def _build(self, item: tuple) -> bytes:
        hook, ts, picked, ctx, thread_name = item
        kind, ident, data = _derive.derive(hook, picked)
        sid = ident["session_id"]
        platform = ident.pop("platform")
        if hook in ("pre_llm_call", "on_session_end", "on_session_start") and sid and platform:
            cache = self._platform_by_session
            cache[sid] = platform
            cache.move_to_end(sid)
            while len(cache) > _PLATFORM_CACHE_MAX:
                cache.popitem(last=False)
        elif sid and not platform:
            platform = self._platform_by_session.get(sid)
        cls = ctx.run(self._classify, platform)
        session = {"session_id": sid, "session_key": ident["session_key"], "turn_id": ident["turn_id"],
                   "parent_session_id": ident["parent_session_id"], "source": cls.get("source"),
                   "finite": cls.get("finite"), "profile": cls.get("profile"),
                   "kanban_task": cls.get("kanban_task")}
        diag = {"hook": hook, "thread": "worker" if thread_name.startswith("hermes-hook-") else "caller",
                "cv_source": cls.get("cv_source"), "cv_session_id": cls.get("cv_session_id"),
                "env_source": cls.get("env_source"), "kanban_owned": cls.get("kanban_owned")}
        observer = picked.get("telemetry_schema_version")
        return self._encode(kind, session, data, ts=ts,
                            observer=observer if isinstance(observer, str) else None, diag=diag)

    # -- file ----------------------------------------------------------------------------------------
    def _open(self) -> None:
        self.raw_dir.mkdir(mode=0o700, parents=True, exist_ok=True)
        fd = os.open(self.path, os.O_WRONLY | os.O_CREAT | os.O_APPEND, 0o600)
        try:
            os.fchmod(fd, 0o600)
        except OSError:
            pass
        self._fd = fd
        self._size = os.fstat(fd).st_size

    def _close_fd(self) -> None:
        if self._fd is not None:
            try:
                os.close(self._fd)
            except OSError:
                pass
            self._fd = None

    def _rotate(self) -> None:
        self._close_fd()
        self._part += 1
        os.replace(self.path, self.raw_dir / f"raw-{self.incarnation}.{self._part:04d}.jsonl")
        old = self._part - self.max_parts
        if old >= 1:
            try:
                os.unlink(self.raw_dir / f"raw-{self.incarnation}.{old:04d}.jsonl")
            except OSError:
                pass

    def _write(self, lines: list[bytes]) -> bool:
        try:
            if self._fd is None:
                self._open()
            blob = b"".join(lines)
            if self._size and self._size + len(blob) > self.rotate_bytes:
                self._rotate()
                self._open()
            view = memoryview(blob)
            while view:
                n = os.write(self._fd, view)  # type: ignore[arg-type]
                view = view[n:]
            self._size += len(blob)
            return True
        except Exception:
            self.write_errors += 1
            self._close_fd()
            logger.debug("companion-bridge record write failed", exc_info=True)
            return False
