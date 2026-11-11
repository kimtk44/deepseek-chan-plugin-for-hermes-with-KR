"""P0a record-mode unit tests: no model, no :8080, no Hermes process required."""

import contextvars
import importlib.util
import os
import stat
import sys
import threading
from pathlib import Path

import pytest

import companion_bridge as cb
from companion_bridge import derive
from companion_bridge.sender import RecordSender

from conftest import REPO, read_lines

CANARY = "CANARY-7f3a-unit"

# One representative payload per hook, salted with secrets in the fields we must NOT forward.
SAMPLES = {
    "on_session_start": dict(session_id="s1", model="m", platform="cli"),
    "pre_llm_call": dict(session_id="s1", turn_id="t1", user_message=CANARY, conversation_history=[CANARY],
                         is_first_turn=True, model="m", platform="desktop", sender_id=CANARY),
    "post_llm_call": dict(session_id="s1", turn_id="t1", user_message=CANARY, assistant_response=CANARY),
    "pre_tool_call": dict(tool_name="terminal", args={"command": CANARY}, task_id="k", session_id="s1",
                          tool_call_id="c1", turn_id="t1", api_request_id="a1"),
    "post_tool_call": dict(tool_name="terminal", args={"command": CANARY}, result=CANARY, session_id="s1",
                           tool_call_id="c1", turn_id="t1", status="ok", duration_ms=12,
                           error_message=CANARY),
    "on_human_input_request": dict(kind="approval", request_id="r1", session_id="s1", session_key="k1",
                                   platform="cli", prompt=CANARY),
    "on_human_input_resolved": dict(kind="approval", request_id="r1", session_id="s1", session_key="k1",
                                    platform="cli", prompt=CANARY, outcome="approved"),
    "pre_approval_request": dict(command=CANARY, description=CANARY, pattern_key="p", session_key="k1",
                                 surface="cli"),
    "post_approval_response": dict(command=CANARY, description=CANARY, session_key="k1", surface="smart",
                                   choice="once", decided_by="aux_llm"),
    "api_request_error": dict(session_id="s1", turn_id="t1", status_code=429, retryable=True,
                              error={"message": CANARY}, request={"messages": [CANARY]}),
    "on_session_end": dict(session_id="s1", task_id="k", turn_id="t1", completed=True, failed=False,
                           interrupted=False, turn_exit_reason="final_response", model="m", platform="desktop"),
    "agent_loop_stopped": dict(session_key="k1", platform="telegram", reason="stop",
                               invalidation_reason=CANARY),
    "on_session_finalize": dict(session_id="s1", platform="cli"),
    "on_session_reset": dict(session_id="s2", old_session_id="s1", new_session_id="s2", reason="new_session"),
    "on_session_delete": dict(session_id="s1", reason="delete", profile="default"),
    "subagent_start": dict(parent_session_id="s1", parent_turn_id="t1", child_session_id="c-s",
                           child_role="leaf", child_goal=CANARY),
    "subagent_stop": dict(parent_session_id="s1", child_session_id="c-s", child_role="leaf",
                          child_summary=CANARY, child_status="completed", tool_call_history=[CANARY],
                          duration_ms=5),
}

EXPECTED = {  # hook -> (kind, data keys)
    "on_session_start": ("session.start", set()),
    "pre_llm_call": ("turn.start", {"platform", "is_first_turn"}),
    "post_llm_call": ("turn.output", set()),
    "pre_tool_call": ("tool.start", {"tool_name", "tool_call_id"}),
    "post_tool_call": ("tool.end", {"tool_call_id", "status", "duration_ms"}),
    "on_human_input_request": ("human.wait", {"kind", "request_id"}),
    "on_human_input_resolved": ("human.resolved", {"request_id", "outcome"}),
    "pre_approval_request": ("approval.pre", {"surface"}),
    "post_approval_response": ("approval.post", {"surface", "choice", "decided_by"}),
    "api_request_error": ("api.error", {"status_code", "retryable"}),
    "on_session_end": ("turn.end", {"completed", "failed", "interrupted", "turn_exit_reason"}),
    "agent_loop_stopped": ("turn.stopped", {"reason", "platform"}),
    "on_session_finalize": ("session.finalize", set()),
    "on_session_reset": ("session.reset", {"old_session_id", "new_session_id"}),
    "on_session_delete": ("session.delete", set()),
    "subagent_start": ("subagent.start", {"parent_session_id", "child_session_id", "child_role"}),
    "subagent_stop": ("subagent.stop", {"parent_session_id", "child_session_id", "child_role", "child_status"}),
}


def _sender(raw_dir, **kw):
    return RecordSender(raw_dir, start=False, **kw)


def _events(lines):
    return [e for e in lines if not e["kind"].startswith("producer.")]


# --- envelope ----------------------------------------------------------------------------------

def test_envelope_shape(raw_dir):
    s = _sender(raw_dir)
    s.offer("pre_tool_call", {**SAMPLES["pre_tool_call"], "telemetry_schema_version": "hermes.observer.v1"})
    s.close()
    lines = read_lines(raw_dir)
    assert [e["kind"] for e in lines] == ["producer.hello", "tool.start", "producer.bye"]
    for e in lines:
        assert set(e) >= {"v", "observer", "producer", "pseq", "ts", "session", "kind", "data"}
        assert e["v"] == "hermes.companion.v1"
        assert e["producer"] == {"incarnation": s.incarnation, "host": s.host, "pid": os.getpid()}
    assert [e["pseq"] for e in lines] == [1, 2, 3]
    ev = lines[1]
    assert ev["observer"] == "hermes.observer.v1"
    assert set(ev["session"]) == {"session_id", "session_key", "turn_id", "parent_session_id", "source",
                                  "finite", "profile", "kanban_task"}
    assert ev["session"]["session_id"] == "s1" and ev["session"]["turn_id"] == "t1"
    assert ev["data"] == {"tool_name": "terminal", "tool_call_id": "c1"}
    assert lines[0]["session"] is None and lines[0]["data"]["incarnation"] == s.incarnation
    assert (raw_dir / f"raw-{s.incarnation}.jsonl").exists()


def test_raw_file_is_0600_and_dir_0700(raw_dir):
    s = _sender(raw_dir)
    s.close()
    f = raw_dir / f"raw-{s.incarnation}.jsonl"
    assert stat.S_IMODE(f.stat().st_mode) == 0o600
    assert stat.S_IMODE(raw_dir.stat().st_mode) == 0o700


def test_rotation(raw_dir):
    s = _sender(raw_dir, rotate_bytes=2000)
    for i in range(60):
        s.offer("pre_tool_call", {**SAMPLES["pre_tool_call"], "tool_call_id": f"c{i}"})
        s._drain_once(block=False)
    s.close()
    parts = sorted(raw_dir.glob(f"raw-{s.incarnation}*.jsonl"))
    assert len(parts) > 2
    assert all(p.stat().st_size <= 2000 for p in parts)
    assert all(stat.S_IMODE(p.stat().st_mode) == 0o600 for p in parts)
    assert len(_events(read_lines(raw_dir))) == 60


# --- derivation --------------------------------------------------------------------------------

@pytest.mark.parametrize("hook", sorted(EXPECTED))
def test_derivation_table(raw_dir, hook):
    s = _sender(raw_dir)
    s.offer(hook, SAMPLES[hook])
    s.close()
    (ev,) = _events(read_lines(raw_dir))
    kind, keys = EXPECTED[hook]
    assert ev["kind"] == kind
    assert set(ev["data"]) == keys
    assert ev["diag"]["hook"] == hook


def test_table_covers_manifest():
    manifest = (REPO / "companion_bridge" / "plugin.yaml").read_text()
    declared = [l.strip()[2:] for l in manifest.splitlines() if l.strip().startswith("- ")]
    assert declared == list(derive.HOOKS) == list(EXPECTED)


def test_identity_rules(raw_dir):
    s = _sender(raw_dir)
    for hook in ("subagent_start", "pre_approval_request", "on_human_input_request", "on_session_reset"):
        s.offer(hook, SAMPLES[hook])
    s.close()
    sub, appr, human, reset = _events(read_lines(raw_dir))
    assert sub["session"]["session_id"] == "c-s" and sub["session"]["parent_session_id"] == "s1"
    assert appr["session"]["session_id"] is None and appr["session"]["session_key"] == "k1"
    assert human["session"]["session_id"] == "s1" and human["session"]["session_key"] == "k1"
    assert reset["session"]["session_id"] == "s2"


def test_session_end_without_turn_id_is_session_close(raw_dir):
    s = _sender(raw_dir)
    s.offer("on_session_end", dict(session_id="s1", completed=False, interrupted=True))  # cli_shutdown shape
    s.offer("on_session_end", SAMPLES["on_session_end"])
    s.close()
    close, end = _events(read_lines(raw_dir))
    assert close["kind"] == "turn.end" and close["data"]["session_close"] is True
    assert close["session"]["turn_id"] is None
    assert "session_close" not in end["data"] and end["session"]["turn_id"] == "t1"


def test_no_secret_reaches_the_record(raw_dir):
    s = _sender(raw_dir)
    for hook, kw in SAMPLES.items():
        s.offer(hook, kw)
    s.close()
    blob = "".join(p.read_text() for p in raw_dir.glob("raw-*.jsonl"))
    assert CANARY not in blob
    assert len(_events(read_lines(raw_dir))) == len(SAMPLES)


def test_non_scalar_and_long_values_are_bounded(raw_dir):
    s = _sender(raw_dir)
    s.offer("pre_tool_call", dict(tool_name="x" * 1000, tool_call_id={"nested": CANARY}, session_id=object()))
    s.close()
    (ev,) = _events(read_lines(raw_dir))
    assert len(ev["data"]["tool_name"]) == derive.MAX_STR
    assert ev["data"]["tool_call_id"] is None and ev["session"]["session_id"] is None


def test_platform_cached_from_turn_start_for_tool_events(raw_dir):
    seen = []
    s = _sender(raw_dir, classifier=lambda platform: seen.append(platform) or {"source": platform})
    s.offer("pre_llm_call", SAMPLES["pre_llm_call"])
    s.offer("pre_tool_call", SAMPLES["pre_tool_call"])
    s.close()
    assert seen == ["desktop", "desktop"]
    assert [e["session"]["source"] for e in _events(read_lines(raw_dir))] == ["desktop", "desktop"]


def test_classifier_runs_in_the_hook_context(raw_dir):
    """Session-scoped values set on the hook thread are visible to the writer-side classifier."""
    var = contextvars.ContextVar("fake_session_source", default="unset")
    s = RecordSender(raw_dir, classifier=lambda platform: {"source": var.get()})

    def hook_thread():
        var.set("desktop")
        s.offer("pre_tool_call", SAMPLES["pre_tool_call"])

    t = threading.Thread(target=hook_thread)
    t.start(); t.join()
    s.close(1.0)
    (ev,) = _events(read_lines(raw_dir))
    assert ev["session"]["source"] == "desktop"
    assert var.get() == "unset"


# --- accounting / loss ---------------------------------------------------------------------------

def test_queue_overflow_writes_loss_marker(raw_dir):
    s = _sender(raw_dir, queue_max=4)
    for i in range(10):
        s.offer("pre_tool_call", {**SAMPLES["pre_tool_call"], "session_id": f"s{i % 3}", "tool_call_id": f"c{i}"})
    assert s.stats()["dropped_full"] == 6
    s.close()
    lines = read_lines(raw_dir)
    loss = [e for e in lines if e["kind"] == "producer.loss"]
    assert len(loss) == 1 and loss[0]["data"]["dropped"] == 6
    assert set(loss[0]["data"]["sessions"]) <= {"s0", "s1", "s2"} and loss[0]["data"]["sessions"]
    kinds = [e["kind"] for e in lines]
    assert kinds.index("producer.loss") < kinds.index("tool.start")  # marker precedes the next events
    st = s.stats()
    assert st["received"] == 10 and st["recorded"] == 4 and st["dropped"] == 6
    assert st["received"] == st["recorded"] + st["dropped"]
    bye = lines[-1]
    assert bye["kind"] == "producer.bye" and bye["data"]["received"] == 10


def test_write_failure_counts_as_dropped(tmp_path):
    blocker = tmp_path / "not-a-dir"
    blocker.write_text("x")
    s = _sender(blocker / "raw")  # mkdir under a file fails
    s.offer("pre_tool_call", SAMPLES["pre_tool_call"])
    s.close()
    st = s.stats()
    assert st["received"] == 1 and st["recorded"] == 0 and st["dropped_write"] == 1


def test_threaded_accounting(raw_dir):
    s = RecordSender(raw_dir, queue_max=64)
    def burst():
        for i in range(500):
            s.offer("pre_tool_call", SAMPLES["pre_tool_call"])
    threads = [threading.Thread(target=burst) for _ in range(8)]
    for t in threads: t.start()
    for t in threads: t.join()
    s.close(5.0)
    st = s.stats()
    assert st["received"] == 4000
    assert st["received"] == st["recorded"] + st["dropped"]
    assert len(_events(read_lines(raw_dir))) == st["recorded"]


# --- register / singleton ----------------------------------------------------------------------

class FakeManager:
    def __init__(self):
        self._hooks = {}


class FakeCtx:
    def __init__(self, manager=None, profile="default"):
        self._manager = manager or FakeManager()
        self.profile_name = profile
        self.unloads = []

    def register_hook(self, name, callback, **_):
        self._manager._hooks.setdefault(name, []).append(callback)

    def on_unload(self, fn):
        self.unloads.append(fn)

    def get_config(self, key, default=None):
        return default


def test_register_is_idempotent_and_singleton(fresh_runtime, raw_dir):
    a, b = FakeCtx(profile="default"), FakeCtx(profile="explore")
    cb.register(a)
    s1 = sys.modules[cb.RUNTIME_MODULE].sender
    cb.register(b)
    cb.register(a)  # same manager again: no duplicate callbacks
    assert sys.modules[cb.RUNTIME_MODULE].sender is s1
    assert all(len(a._manager._hooks[h]) == 1 for h in derive.HOOKS)
    assert set(a._manager._hooks) == set(derive.HOOKS)
    assert sys.modules[cb.RUNTIME_MODULE].live == 2
    for fn in a.unloads + b.unloads:
        fn()
    assert sys.modules[cb.RUNTIME_MODULE].live == 0
    assert sys.modules[cb.RUNTIME_MODULE].sender is s1  # reloads do not tear the sender down
    s1.flush()
    kinds = [e["kind"] for e in read_lines(raw_dir)]
    assert kinds.count("producer.hello") == 1
    assert kinds.count("producer.register") == 2 and kinds.count("producer.unregister") == 2


def _load_as(module_name):
    """Import the plugin package the way hermes_cli/plugins_loader.py does for a second profile."""
    import types
    parent = module_name.rpartition(".")[0]
    if parent not in sys.modules:  # plugins_loader.py creates the hermes_plugins namespace the same way
        ns = types.ModuleType(parent)
        ns.__path__ = []
        sys.modules[parent] = ns
    pkg_dir = REPO / "companion_bridge"
    spec = importlib.util.spec_from_file_location(module_name, pkg_dir / "__init__.py",
                                                  submodule_search_locations=[str(pkg_dir)])
    mod = importlib.util.module_from_spec(spec)
    mod.__package__ = module_name
    sys.modules[module_name] = mod
    spec.loader.exec_module(mod)
    return mod


def test_singleton_across_module_loads(fresh_runtime, raw_dir):
    names = ["hermes_plugins_test.companion_bridge", "hermes_plugins_test.companion_bridge__home_abc"]
    try:
        m1, m2 = (_load_as(n) for n in names)
        assert m1 is not m2 and m1.CALLBACKS["pre_tool_call"] is not m2.CALLBACKS["pre_tool_call"]
        c1, c2 = FakeCtx(profile="default"), FakeCtx(profile="explore")
        m1.register(c1)
        m2.register(c2)
        s = sys.modules[cb.RUNTIME_MODULE].sender
        # evict the first load (a manager reload) -- the sender survives and both callbacks feed it
        for n in list(sys.modules):
            if n.startswith(names[0]) and not n.startswith(names[1]):
                sys.modules.pop(n)
        c1._manager._hooks["pre_tool_call"][0](**SAMPLES["pre_tool_call"])
        c2._manager._hooks["pre_tool_call"][0](**SAMPLES["pre_tool_call"])
        assert sys.modules[cb.RUNTIME_MODULE].sender is s
        s.flush()
        assert s.stats()["received"] == 2 and s.stats()["recorded"] == 2
    finally:
        for n in list(sys.modules):
            if n.startswith("hermes_plugins_test"):
                sys.modules.pop(n)


# --- callbacks never raise, never return -------------------------------------------------------

def test_callbacks_return_none(fresh_runtime, raw_dir):
    ctx = FakeCtx()
    cb.register(ctx)
    for hook, kw in SAMPLES.items():
        assert ctx._manager._hooks[hook][0](**kw) is None


def test_no_exception_escapes_callbacks(fresh_runtime, raw_dir, monkeypatch):
    ctx = FakeCtx()
    cb.register(ctx)
    s = sys.modules[cb.RUNTIME_MODULE].sender

    def boom(*a, **k):
        raise RuntimeError("boom")

    monkeypatch.setattr(s, "offer", boom)
    for hook, kw in SAMPLES.items():
        assert ctx._manager._hooks[hook][0](**kw) is None
    monkeypatch.undo()
    # registry gone entirely
    rt = sys.modules.pop(cb.RUNTIME_MODULE)
    try:
        for hook, kw in SAMPLES.items():
            assert ctx._manager._hooks[hook][0](**kw) is None
    finally:
        sys.modules[cb.RUNTIME_MODULE] = rt
    # hostile payload values
    class Evil:
        def __str__(self): raise RuntimeError
        def __eq__(self, o): raise RuntimeError
        __hash__ = None
    assert ctx._manager._hooks["pre_tool_call"][0](tool_name=Evil(), session_id=Evil(), args=Evil()) is None
    assert ctx._manager._hooks["pre_tool_call"][0]() is None
    s.flush()


def test_register_never_raises(fresh_runtime, raw_dir):
    class BrokenCtx:
        def register_hook(self, *a, **k):
            raise RuntimeError("nope")
    assert cb.register(BrokenCtx()) is None
    assert cb.register(None) is None


def test_pre_tool_call_does_not_initialise(fresh_runtime, raw_dir):
    ctx = FakeCtx()
    cb.register(ctx)
    sys.modules[cb.RUNTIME_MODULE].sender.close(1.0)
    sys.modules[cb.RUNTIME_MODULE].sender = None  # e.g. after fork
    ctx._manager._hooks["pre_tool_call"][0](**SAMPLES["pre_tool_call"])
    assert sys.modules[cb.RUNTIME_MODULE].sender is None
    ctx._manager._hooks["pre_llm_call"][0](**SAMPLES["pre_llm_call"])
    assert sys.modules[cb.RUNTIME_MODULE].sender is not None


# --- Hermes-backed (skipped without a Hermes checkout + its deps) --------------------------------

def _hermes_importable():
    from conftest import HERMES_SRC
    if HERMES_SRC not in sys.path and Path(HERMES_SRC).is_dir():
        sys.path.insert(0, HERMES_SRC)
    try:
        import hermes_cli.plugins_dispatch  # noqa: F401
        import agent.session_source  # noqa: F401
        return True
    except Exception:
        return False


@pytest.mark.skipif(not _hermes_importable(), reason="Hermes checkout/deps not importable")
def test_hermes_dispatch_fail_closed_never_triggered(fresh_runtime, raw_dir):
    """Our callbacks through the real PluginDispatchMixin: no block directive, no results."""
    from hermes_cli.plugins import PluginManager
    pm = PluginManager(scope_key=str(raw_dir.parent / "home"))
    for hook in derive.HOOKS:
        pm._hooks.setdefault(hook, []).append(cb.CALLBACKS[hook])
    cb.ensure_sender()
    for hook, kw in SAMPLES.items():
        assert pm.invoke_hook(hook, **kw) == []
    s = sys.modules[cb.RUNTIME_MODULE].sender
    s.flush()
    st = s.stats()
    assert st["received"] == len(SAMPLES) == st["recorded"]
    evs = _events(read_lines(raw_dir))
    tool = next(e for e in evs if e["kind"] == "tool.start")
    assert tool["observer"] == "hermes.observer.v1"
    assert tool["diag"]["thread"] == "worker"  # pre_tool_call ran on a bounded hook worker


@pytest.mark.skipif(not _hermes_importable(), reason="Hermes checkout/deps not importable")
def test_hermes_session_scope_visible_in_bounded_worker(fresh_runtime, raw_dir):
    """C1 check: session_source_for / finite_turn_required see the caller's session scope even
    though pre_tool_call runs on a timeout worker (plugins_dispatch.py contextvars.copy_context)."""
    from gateway.session_context import clear_session_vars, set_session_vars
    from gateway.session_finite import finite_turn_scope
    from hermes_cli.plugins import PluginManager
    pm = PluginManager(scope_key=str(raw_dir.parent / "home"))
    for hook in derive.HOOKS:
        pm._hooks.setdefault(hook, []).append(cb.CALLBACKS[hook])
    cb.ensure_sender()

    def turn(source, finite):
        tokens = set_session_vars(platform="", source=source, session_id="sx")
        try:
            with finite_turn_scope(finite):
                pm.invoke_hook("pre_tool_call", **SAMPLES["pre_tool_call"])
        finally:
            clear_session_vars(tokens)

    t = threading.Thread(target=turn, args=("desktop", False)); t.start(); t.join()
    t = threading.Thread(target=turn, args=("cli", True)); t.start(); t.join()
    pm.invoke_hook("pre_tool_call", **SAMPLES["pre_tool_call"])  # no scope bound
    s = sys.modules[cb.RUNTIME_MODULE].sender
    s.flush()
    a, b, c = _events(read_lines(raw_dir))
    assert (a["session"]["source"], a["session"]["finite"], a["diag"]["cv_source"]) == ("desktop", False, True)
    assert (b["session"]["source"], b["session"]["finite"]) == ("cli", True)
    assert c["session"]["finite"] is None and c["diag"]["cv_source"] is False
    assert all(e["diag"]["thread"] == "worker" for e in (a, b, c))


def test_session_end_kicks_and_finalize_drains(fresh_runtime, raw_dir):
    """Hermes hard-exits (os._exit) after turns, so the plugin cannot rely on atexit."""
    ctx = FakeCtx()
    cb.register(ctx)
    s = sys.modules[cb.RUNTIME_MODULE].sender
    s.poll_interval = 30.0  # without a kick nothing would be written for 30 s
    import time
    time.sleep(0.1)  # let the writer enter its (long) wait
    ctx._manager._hooks["pre_tool_call"][0](**SAMPLES["pre_tool_call"])
    ctx._manager._hooks["on_session_end"][0](**SAMPLES["on_session_end"])
    deadline = time.monotonic() + 2
    while time.monotonic() < deadline and s.stats()["recorded"] < 2:
        time.sleep(0.01)
    assert s.stats()["recorded"] == 2
    ctx._manager._hooks["on_session_finalize"][0](**SAMPLES["on_session_finalize"])
    assert s.stats()["recorded"] == 3  # finalize returned only after the drain
