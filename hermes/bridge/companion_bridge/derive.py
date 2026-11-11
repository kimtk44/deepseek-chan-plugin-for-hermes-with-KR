"""Hook -> event derivation. Pure functions, no Hermes imports.

Two stages so the hook callback stays tiny:
  pick(hook, kwargs)   -- on the hook thread: copy only whitelisted raw fields (no I/O).
  derive(hook, picked) -- on the writer thread: kind, session identity, data.

Payload minimisation: tool args/results, user messages, responses and approval
command/prompt text never leave pick(); only the fields below are copied.
"""

from __future__ import annotations

from typing import Any, Optional

ENVELOPE_VERSION = "hermes.companion.v1"

# hook -> (kind, identity fields, data fields). Identity fields are copied to `session`,
# data fields to `data`. Order of HOOKS is the registration order.
_TABLE: dict[str, tuple[str, tuple[str, ...], tuple[str, ...]]] = {
    "on_session_start": ("session.start", ("session_id", "platform"), ()),
    "pre_llm_call": ("turn.start", ("session_id", "turn_id", "platform"), ("platform", "is_first_turn")),
    "post_llm_call": ("turn.output", ("session_id", "turn_id"), ()),
    "pre_tool_call": ("tool.start", ("session_id", "turn_id"), ("tool_name", "tool_call_id")),
    "post_tool_call": ("tool.end", ("session_id", "turn_id"), ("tool_call_id", "status", "duration_ms")),
    "on_human_input_request": ("human.wait", ("session_id", "session_key", "platform"), ("kind", "request_id")),
    "on_human_input_resolved": ("human.resolved", ("session_id", "session_key", "platform"),
                                ("request_id", "outcome")),
    "pre_approval_request": ("approval.pre", ("session_key",), ("surface",)),
    "post_approval_response": ("approval.post", ("session_key",), ("surface", "choice", "decided_by")),
    "api_request_error": ("api.error", ("session_id", "turn_id"), ("status_code", "retryable")),
    "on_session_end": ("turn.end", ("session_id", "turn_id", "platform"),
                       ("completed", "failed", "interrupted", "turn_exit_reason")),
    "agent_loop_stopped": ("turn.stopped", ("session_key", "platform"), ("reason", "platform")),
    "on_session_finalize": ("session.finalize", ("session_id",), ()),
    "on_session_reset": ("session.reset", ("session_id", "old_session_id", "new_session_id"),
                         ("old_session_id", "new_session_id")),
    "on_session_delete": ("session.delete", ("session_id",), ()),
    "subagent_start": ("subagent.start", ("parent_session_id", "child_session_id"),
                       ("parent_session_id", "child_session_id", "child_role")),
    "subagent_stop": ("subagent.stop", ("parent_session_id", "child_session_id"),
                      ("parent_session_id", "child_session_id", "child_role", "child_status")),
}

HOOKS: tuple[str, ...] = tuple(_TABLE)

# Raw fields pick() copies per hook: identity + data + the observer schema version.
PICK_FIELDS: dict[str, tuple[str, ...]] = {
    hook: tuple(dict.fromkeys((*ident, *data, "telemetry_schema_version")))
    for hook, (_kind, ident, data) in _TABLE.items()
}

MAX_STR = 128  # bound every copied string; whitelisted fields are ids / enums / names
_SCALARS = (bool, int, float)


def _clean(value: Any) -> Any:
    if value is None or isinstance(value, _SCALARS):
        return value
    if isinstance(value, str):
        return value[:MAX_STR]
    return None  # non-scalar values are never forwarded


def pick(hook: str, kwargs: dict[str, Any]) -> dict[str, Any]:
    """Hot-path copy of the whitelisted fields (strings are not truncated here; derive() does)."""
    get = kwargs.get
    return {f: get(f) for f in PICK_FIELDS.get(hook, ())}


def kind_for(hook: str) -> Optional[str]:
    entry = _TABLE.get(hook)
    return entry[0] if entry else None


def derive(hook: str, picked: dict[str, Any]) -> tuple[str, dict[str, Any], dict[str, Any]]:
    """Return (kind, identity, data) for one hook firing.

    identity keys: session_id, session_key, turn_id, parent_session_id, platform (platform is
    consumed by the caller for source classification and not copied into the envelope).
    """
    kind, _ident, data_fields = _TABLE[hook]
    g = picked.get
    ident: dict[str, Any] = {
        "session_id": _clean(g("session_id")) or None,
        "session_key": _clean(g("session_key")) or None,
        "turn_id": _clean(g("turn_id")) or None,
        "parent_session_id": None,
        "platform": _clean(g("platform")) or None,
    }
    if hook in ("subagent_start", "subagent_stop"):
        ident["session_id"] = _clean(g("child_session_id")) or None
        ident["parent_session_id"] = _clean(g("parent_session_id")) or None
    elif hook == "on_session_reset" and not ident["session_id"]:
        ident["session_id"] = _clean(g("new_session_id")) or None
    data = {f: _clean(g(f)) for f in data_fields if g(f) is not None}
    if hook == "on_session_end" and not ident["turn_id"]:
        # C5: an on_session_end without turn_id is a session close (CLI exit / TUI cleanup),
        # not the end of a user turn -- the hub must not fire a done/failed beat for it.
        data["session_close"] = True
    return kind, ident, data


def envelope(*, producer: dict[str, Any], pseq: int, ts: float, kind: str,
             session: Optional[dict[str, Any]], data: dict[str, Any],
             observer: Optional[str] = None, diag: Optional[dict[str, Any]] = None) -> dict[str, Any]:
    env: dict[str, Any] = {
        "v": ENVELOPE_VERSION,
        "observer": observer,
        "producer": producer,
        "pseq": pseq,
        "ts": ts,
        "session": session,
        "kind": kind,
        "data": data,
    }
    if diag is not None:
        env["diag"] = diag
    return env
