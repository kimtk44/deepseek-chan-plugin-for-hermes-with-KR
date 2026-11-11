# companion hub (minimal, P0b reduced)

A small resident service: it follows the bridge's record folder (`~/.local/state/hermes-companion/raw-*.jsonl`, read-only),
reduces the events to **one** character state for the primary session, and pushes it over a token-protected WebSocket to the
desktop overlay. The bridge stays in record mode; the "send mode" of the design is not part of this version.

States on the wire: `idle working tool waiting_approval waiting_question done failed` (`offline` is the overlay's own judgment).

| file | role |
|---|---|
| `reducer.mjs` | pure state machine (injected clock): session records, state priority, beats, primary selection, producer liveness, `replayEvents`, `recover` |
| `tail.mjs` | record-folder follower (inode-tracked, rotation-safe, partial-line safe) and `loadRecovery` |
| `server.mjs` | HTTP + WS, Bearer auth, `hb` + ping every 15 s, `/health`, token file checks |
| `hub.mjs` | CLI entry; start-up recovery then live |
| `tools/companion-tail.mjs` | subscribe and print every message with the receive time |
| `tools/replay.mjs` | feed recorded files through the reducer on a virtual clock, print the timeline and totals |
| `test/` | `node --test test/*.test.mjs` (fixture in `test/fixtures/`, golden timelines next to it) |

## Run

```
cd hermes && npm install
node hub.mjs --token-file <file> [--bind 127.0.0.1] [--port 9141] [--raw-dir <dir>]
             [--auto-sources desktop,tui,cli] [--profiles a,b] [--recover-minutes 120] [--rehearsal-admit-finite]
```

The token file must be mode 0600 and hold at least 32 characters, otherwise the hub exits with code 2.
Protocol: `Authorization: Bearer <token>` on the upgrade (401 otherwise); then `{"type":"welcome","epoch"}` and the current
`{"type":"state","state","tool?","session","source","profile","transition_id","epoch"}`; later state messages as they change;
`{"type":"hb","epoch"}` every 15 s. `GET /health` -> `{"ok":true,"service":"companion-hub","v":1}`; other plain HTTP -> 426.

## Behaviour notes

- **Ingest.** Files are listed every 1 s, followed files are stat-ed every 100 ms. A file is tracked by dev:ino and read through
  an open fd, so a rotation (`raw-<inc>.jsonl` -> `raw-<inc>.NNNN.jsonl`) loses nothing. Files idle for 1 h stop being polled and
  are re-followed when they grow. Duplicates are dropped per incarnation by `pseq`.
- **Start-up recovery.** Files modified in the last 2 h are replayed (merged by `ts`) on a virtual clock, silently; afterwards
  the wall clock takes over: expired beats are gone, a producer silent for more than 30 s is dead.
- **Reducer rules** are listed at the top of `reducer.mjs`; deviations from the design that the real records forced:
  - a `tool.start` for a session without a seen `turn.start` implies a running turn (28 of 114 recorded sessions);
  - ... except right after a turn has ended: tool calls under a new `turn_id`, with no `turn.start`, that begin within 60 s of a
    `turn.end` are post-turn background work and never show as activity. 3 of 3 recorded cases began
    5.8-6.8 s after the end, called only `memory` and never got a `turn.end`; before this rule the session read `working` for
    30 minutes each time (twice on 2026-11-11). Counter `background_turns`;
  - the real bridge records `session.reset` with empty data, so a reset of a running turn is followed by `turn_id`: an event
    for an unknown session id that carries the same `turn_id` as a running record continues that record;
  - `tool.start` lines with an empty `tool_call_id` (nested tools) are ignored.
- **Privacy.** Logs and wire messages contain only state names, tool names, the first 8 characters of a session id, source,
  profile, counters and peer addresses. Raw envelopes are never logged.

## Rehearsal tools

```
node tools/replay.mjs [--dir test/fixtures] [--no-timeline] [--admit-finite]
node tools/companion-tail.mjs --url ws://127.0.0.1:9141 --token-file <file> [--quiet-hb] [--exit-after 30]
```
