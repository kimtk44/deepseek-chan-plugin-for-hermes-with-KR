"""companion-bridge: record-only Hermes observer plugin for hermes-companion (P0a).

Rules this module keeps:
  1. every callback is wrapped in a bare ``try/except Exception`` and returns ``None``;
  2. ``pre_tool_call`` does one ``put_nowait`` (via RecordSender.offer) -- no I/O, no lazy
     import, no first-call init, no log output, never block/modify;
  3. ``pre_llm_call`` returns ``None`` (a str/dict would inject context into the user message);
  4. all initialisation (queue, thread, Hermes helper imports) happens in ``register(ctx)``.

Multiplexed gateways hold one plugin manager per profile and reload them; each load
imports this package under a different module name and evicts the old one. The sender therefore
lives in a process-wide registry module outside the ``hermes_plugins.*`` namespace, and
``register()`` creates it at most once per process (idempotent). The profile is read per event.
"""

from __future__ import annotations

import atexit
import os
import sys
import threading
import types
from pathlib import Path
from typing import Any, Callable, Optional

from . import derive as _derive
from . import sender as _sender

__version__ = "0.1.0"

RUNTIME_MODULE = "hermes_companion_bridge_runtime"  # outside hermes_plugins.* -> never evicted
RAW_DIR_ENV = "HERMES_COMPANION_RAW_DIR"
QUEUE_MAX_ENV = "HERMES_COMPANION_QUEUE_MAX"
FINALIZE_FLUSH_S = 0.2


def _runtime() -> types.ModuleType:
    rt = sys.modules.get(RUNTIME_MODULE)
    if rt is None:
        fresh = types.ModuleType(RUNTIME_MODULE, "hermes-companion process-wide sender registry")
        fresh.lock = threading.RLock()
        fresh.sender = None
        fresh.live = 0
        fresh.registers = 0
        fresh.atexit_installed = False
        fresh.fork_hook_installed = False
        fresh.config = {}
        rt = sys.modules.setdefault(RUNTIME_MODULE, fresh)  # atomic: concurrent loaders share one
    return rt


def _config_from(ctx: Any) -> dict[str, Any]:
    raw_dir = os.environ.get(RAW_DIR_ENV) or ""
    if not raw_dir and ctx is not None:
        try:
            raw_dir = str(ctx.get_config("raw_dir", "") or "")
        except Exception:
            raw_dir = ""
    try:
        queue_max = int(os.environ.get(QUEUE_MAX_ENV) or _sender.DEFAULT_QUEUE_MAX)
    except ValueError:
        queue_max = _sender.DEFAULT_QUEUE_MAX
    return {"raw_dir": Path(os.path.expanduser(raw_dir)) if raw_dir else _sender.default_raw_dir(),
            "queue_max": max(1, queue_max)}


def ensure_sender(ctx: Any = None) -> "_sender.RecordSender":
    """Process-wide singleton; the first caller's config wins."""
    rt = _runtime()
    with rt.lock:
        s = rt.sender
        if s is not None and s.pid == os.getpid():
            return s
        cfg = rt.config or _config_from(ctx)
        rt.config = cfg
        s = _sender.RecordSender(cfg["raw_dir"], queue_max=cfg["queue_max"],
                                 classifier=_sender.make_classifier(), plugin_version=__version__)
        rt.sender = s
        if not rt.atexit_installed:
            atexit.register(_atexit_flush)
            rt.atexit_installed = True
        if not rt.fork_hook_installed and hasattr(os, "register_at_fork"):
            os.register_at_fork(after_in_child=_after_fork_child)
            rt.fork_hook_installed = True
        return s


def _after_fork_child() -> None:
    # The writer thread does not survive fork. Starting threads here is unsafe, so drop the
    # sender; the next non-pre_tool_call hook (or register) in the child builds a new one.
    try:
        rt = sys.modules.get(RUNTIME_MODULE)
        if rt is not None:
            rt.sender = None
            rt.lock = threading.RLock()
    except Exception:
        pass


def _atexit_flush() -> None:
    # Short-lived processes (cron, oneshot): give the writer up to 300 ms to drain.
    try:
        rt = sys.modules.get(RUNTIME_MODULE)
        s = getattr(rt, "sender", None)
        if s is not None and s.pid == os.getpid():
            s.close(_sender.ATEXIT_FLUSH_S, reason="exit")
    except Exception:
        pass


# --- callbacks ---------------------------------------------------------------------------------

def _make_callback(hook: str) -> Callable[..., None]:
    rt_name = RUNTIME_MODULE
    modules = sys.modules
    lazy = hook != "pre_tool_call"  # pre_tool_call never initialises anything
    # Gateway and one-shot CLI exit through os._exit (gateway/run.py _exit_after_graceful_shutdown,
    # hermes_cli/main.py _exit_after_oneshot), so atexit never runs there. Turn end kicks the
    # writer; session finalize (unbounded, last-chance hook) waits briefly for the drain.
    kick = hook == "on_session_end"
    drain_wait = FINALIZE_FLUSH_S if hook == "on_session_finalize" else 0.0

    def _callback(**kwargs: Any) -> None:
        try:
            s = modules[rt_name].sender
            if s is None and lazy:
                s = ensure_sender()
            if s is not None:
                s.offer(hook, kwargs)
                if kick:
                    s.kick()
                elif drain_wait:
                    s.flush(drain_wait)
        except Exception:
            pass
        return None

    _callback.__name__ = f"companion_{hook}"
    _callback.__qualname__ = _callback.__name__
    return _callback


CALLBACKS: dict[str, Callable[..., None]] = {hook: _make_callback(hook) for hook in _derive.HOOKS}


def _already_registered(ctx: Any) -> bool:
    hooks = getattr(getattr(ctx, "_manager", None), "_hooks", None)
    if not isinstance(hooks, dict):
        return False
    return any(cb is CALLBACKS[h] for h in _derive.HOOKS for cb in hooks.get(h, ()))


def register(ctx: Any) -> None:
    try:
        rt = _runtime()
        s = ensure_sender(ctx)
        if _already_registered(ctx):
            return  # same manager, same module load: registering twice would double events
        for hook in _derive.HOOKS:
            ctx.register_hook(hook, CALLBACKS[hook])
        try:
            profile = ctx.profile_name
        except Exception:
            profile = None
        with rt.lock:
            rt.live += 1
            rt.registers += 1
            live, registers = rt.live, rt.registers
        s.control("producer.register", {"profile": profile, "live": live, "registers": registers,
                                        "module": __name__})
        try:
            ctx.on_unload(lambda: _on_unload(profile))
        except Exception:
            pass
    except Exception:
        pass  # never fail the plugin load path


def _on_unload(profile: Optional[str]) -> None:
    try:
        rt = _runtime()
        with rt.lock:
            rt.live = max(0, rt.live - 1)
            live = rt.live
        s = rt.sender
        if s is not None:
            # Managers are reloaded often under multiplex_profiles; the sender keeps running.
            s.control("producer.unregister", {"profile": profile, "live": live})
    except Exception:
        pass
