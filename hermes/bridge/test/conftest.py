import os
import sys
from pathlib import Path

import pytest

REPO = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO))

# Optional: a Hermes checkout for the integration-flavoured tests (skipped when absent).
HERMES_SRC = os.environ.get("HERMES_AGENT_SRC", str(Path.home() / ".hermes" / "hermes-agent"))

import companion_bridge  # noqa: E402
from companion_bridge import sender as sender_mod  # noqa: E402


@pytest.fixture
def raw_dir(tmp_path, monkeypatch):
    d = tmp_path / "raw"
    monkeypatch.setenv(companion_bridge.RAW_DIR_ENV, str(d))
    return d


@pytest.fixture
def fresh_runtime(raw_dir):
    """Drop the process-wide registry before and after a test (closing any sender it made)."""
    def _drop():
        rt = sys.modules.pop(companion_bridge.RUNTIME_MODULE, None)
        s = getattr(rt, "sender", None)
        if s is not None:
            s.close(1.0, reason="test")
    _drop()
    yield
    _drop()


def read_lines(raw_dir):
    import json
    out = []
    for p in sorted(Path(raw_dir).glob("raw-*.jsonl")):
        out.extend(json.loads(line) for line in p.read_text().splitlines() if line)
    return out
