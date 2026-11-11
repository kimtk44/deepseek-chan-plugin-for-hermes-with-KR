import test from 'node:test'
import assert from 'node:assert/strict'
import { rig } from './rig.mjs'
import { PUBLIC_STATES } from '../reducer.mjs'

const ok = { completed: true, failed: false, interrupted: false, turn_exit_reason: 'text_response(finish_reason=stop)' }

test('idle at start, public states only', () => {
  const r = rig()
  assert.equal(r.state(), 'idle')
  assert.equal(r.msg().session, null)
  r.send('turn.start'); r.send('tool.start', { data: { tool_name: 'terminal', tool_call_id: 'c1' } }); r.advance(1)
  r.send('turn.end', { data: ok }); r.advance(6)
  for (const m of r.out) assert.ok(PUBLIC_STATES.includes(m.state), m.state)
})

test('state table: working -> tool -> working -> done -> idle', () => {
  const r = rig()
  r.send('turn.start'); assert.equal(r.state(), 'working')
  r.send('tool.start', { data: { tool_name: 'terminal', tool_call_id: 'c1' } })
  assert.equal(r.state(), 'working')          // tool younger than 300 ms
  r.advance(0.31); assert.equal(r.state(), 'tool'); assert.equal(r.msg().tool, 'terminal')
  r.send('tool.end', { data: { tool_call_id: 'c1', status: 'ok' } }); assert.equal(r.state(), 'working')
  r.send('turn.end', { data: ok }); assert.equal(r.state(), 'done')
  r.advance(3.9); assert.equal(r.state(), 'done')
  r.advance(0.2); assert.equal(r.state(), 'idle')
  assert.deepEqual(r.states(), ['working', 'tool:terminal', 'working', 'done', 'idle'])
})

test('message shape: session is 8 chars, source, profile, unique transition ids', () => {
  const r = rig()
  r.send('turn.start', { sid: 'abcdefghijklmnop', source: 'tui', profile: 'default' })
  const m = r.last()
  assert.equal(m.session, 'abcdefgh'); assert.equal(m.source, 'tui'); assert.equal(m.profile, 'default')
  assert.match(m.transition_id, /^t\d+$/)
  assert.equal(new Set(r.out.map((x) => x.transition_id)).size, r.out.length)
  assert.deepEqual(Object.keys(m).sort(), ['at', 'profile', 'session', 'source', 'state', 'transition_id', 'type'])
})

test('done beat 4 s, failed beat 5 s', () => {
  const r = rig()
  r.send('turn.start'); r.send('turn.end', { data: ok }); r.advance(3.95); assert.equal(r.state(), 'done'); r.advance(0.1); assert.equal(r.state(), 'idle')
  r.send('turn.start', { turn: 't2' }); r.send('turn.end', { turn: 't2', data: { completed: false, failed: true, interrupted: false } })
  assert.equal(r.state(), 'failed'); r.advance(4.9); assert.equal(r.state(), 'failed'); r.advance(0.2); assert.equal(r.state(), 'idle')
})

test('a beat is cut by the next turn.start and by human.wait', () => {
  const r = rig({ waitDelayS: 0 })
  r.send('turn.start'); r.send('turn.end', { data: ok }); r.advance(1)
  r.send('turn.start', { turn: 't2' }); assert.equal(r.state(), 'working')
  r.send('turn.end', { turn: 't2', data: ok }); assert.equal(r.state(), 'done')
  r.send('human.wait', { turn: null, data: { kind: 'approval', request_id: 'r1' } }); assert.equal(r.state(), 'waiting_approval')
  r.send('human.resolved', { turn: null, data: { request_id: 'r1', outcome: 'once' } })
  r.advance(0.2); assert.equal(r.state(), 'idle')     // the beat did not come back after the wait
})

test('tool delay 300 ms; a tool that ends earlier never shows tool', () => {
  const r = rig()
  r.send('turn.start')
  r.send('tool.start', { data: { tool_name: 'read_file', tool_call_id: 'c1' } }); r.advance(0.25)
  r.send('tool.end', { data: { tool_call_id: 'c1' } }); r.advance(1)
  assert.ok(!r.states().includes('tool:read_file'))
  r.send('tool.start', { data: { tool_name: 'read_file', tool_call_id: 'c2' } }); r.advance(0.29)
  assert.equal(r.state(), 'working'); r.advance(0.02); assert.equal(r.state(), 'tool')
})

test('parallel tools: tool name is the most recently started open tool, then falls back', () => {
  const r = rig()
  r.send('turn.start')
  r.send('tool.start', { data: { tool_name: 'a', tool_call_id: '1' } }); r.advance(0.1)
  r.send('tool.start', { data: { tool_name: 'b', tool_call_id: '2' } }); r.advance(0.31)
  assert.equal(r.msg().tool, 'b')
  r.send('tool.end', { data: { tool_call_id: '2' } }); assert.equal(r.msg().tool, 'a')
  r.send('tool.end', { data: { tool_call_id: '1' } }); assert.equal(r.state(), 'working')
})

test('waiting priority: approval/sudo over clarify over tool; clears on resolve', () => {
  const r = rig({ waitDelayS: 0 })
  r.send('turn.start')
  r.send('tool.start', { data: { tool_name: 't', tool_call_id: '1' } }); r.advance(0.4); assert.equal(r.state(), 'tool')
  r.send('human.wait', { data: { kind: 'clarify', request_id: 'q' } }); assert.equal(r.state(), 'waiting_question')
  r.send('human.wait', { data: { kind: 'sudo', request_id: 's' } }); assert.equal(r.state(), 'waiting_approval')
  r.send('human.resolved', { data: { request_id: 's' } }); assert.equal(r.state(), 'waiting_question')
  r.send('human.resolved', { data: { request_id: 'q' } }); assert.equal(r.state(), 'tool')
})

test('failed beat outranks waiting; done outranks waiting only while it lasts', () => {
  const r = rig({ waitDelayS: 0 })
  r.send('turn.start'); r.send('turn.end', { data: { completed: false, failed: true, interrupted: false } })
  assert.equal(r.state(), 'failed')
  r.send('human.wait', { turn: null, data: { kind: 'approval', request_id: 'x' } })   // cuts the beat
  assert.equal(r.state(), 'waiting_approval')
})

test('turn.end flag combinations', () => {
  const r = rig()
  // max iterations: completed=false, failed=false, interrupted=false -> failed
  r.send('turn.start'); r.send('turn.end', { data: { completed: false, failed: false, interrupted: false, turn_exit_reason: 'max_iterations_reached(120/120)' } })
  assert.equal(r.state(), 'failed'); r.advance(6)
  // interrupted -> idle, no beat
  r.send('turn.start', { turn: 't2' }); r.send('turn.end', { turn: 't2', data: { completed: false, failed: false, interrupted: true } })
  assert.equal(r.state(), 'idle'); r.advance(0.2)
  // session close (no turn_id, data.session_close) -> idle, no beat
  r.send('turn.start', { turn: 't3' }); r.send('turn.end', { turn: null, data: { completed: false, interrupted: true, session_close: true } })
  assert.equal(r.state(), 'idle')
  assert.deepEqual(r.states().filter((s) => s === 'failed' || s === 'done'), ['failed'])
})

test('session close without session_close flag but without turn_id is also not a beat', () => {
  const r = rig()
  r.send('turn.start'); r.send('turn.end', { turn: null, data: { completed: true, failed: false, interrupted: false } })
  assert.equal(r.state(), 'idle')
})

test('exactly one beat per turn_id (duplicate turn.end, even from a second incarnation)', () => {
  const r = rig()
  r.send('turn.start'); r.send('turn.end', { data: ok }); r.advance(5); assert.equal(r.state(), 'idle')
  r.send('turn.end', { data: ok })                                   // duplicate (same producer, new pseq)
  r.send('turn.end', { data: ok, inc: 'inc2' })                      // same turn_id via another incarnation
  assert.equal(r.state(), 'idle')
  assert.equal(r.states().filter((s) => s === 'done').length, 1)
  assert.equal(r.reducer.counters().double_end, 2)
})

test('a tool event implies a running turn when turn.start was never seen', () => {
  const r = rig()
  r.send('tool.start', { turn: 'tx', data: { tool_name: 'terminal', tool_call_id: 'c1' } }); assert.equal(r.state(), 'working')
  r.send('tool.end', { turn: 'tx', data: { tool_call_id: 'c1' } }); r.advance(0.5); assert.equal(r.state(), 'working')   // not idle between tools
  r.send('turn.end', { turn: 'tx', data: ok }); assert.equal(r.state(), 'done')
  r.send('tool.end', { turn: 'tx', data: { tool_call_id: 'late' } })   // late line of the finished turn does not restart it
  assert.equal(r.state(), 'done')
})

test('tool.start with an empty tool_call_id (nested tool) is ignored', () => {
  const r = rig()
  r.send('turn.start'); r.send('tool.start', { turn: null, data: { tool_name: 'terminal', tool_call_id: '' } }); r.advance(1)
  assert.equal(r.state(), 'working')
})

test('dedup by pseq per incarnation; unknown kinds counted and ignored', () => {
  const r = rig()
  r.send('turn.start', { pseq: 5 })
  r.send('turn.end', { data: ok, pseq: 5 })        // same pseq: dropped
  r.send('turn.end', { data: ok, pseq: 4 })        // older: dropped
  assert.equal(r.state(), 'working')
  r.send('turn.end', { data: ok, pseq: 6 }); assert.equal(r.state(), 'done')
  r.send('something.new', { pseq: 7 })
  const c = r.reducer.counters()
  assert.equal(c.duplicates, 2); assert.equal(c.unknown_kinds['something.new'], 1)
  r.send('turn.start', { inc: 'other', pseq: 1, turn: 't9' }); assert.equal(r.state(), 'working')   // other incarnation has its own sequence
})

test('no-state-change kinds', () => {
  const r = rig()
  r.send('turn.start')
  const before = r.out.length
  r.send('approval.pre', { session: { session_id: null, session_key: 'k' }, data: { surface: 'smart' } })
  r.send('approval.post', { session: { session_id: null, session_key: 'k' }, data: { surface: 'smart', choice: 'once' } })
  r.send('turn.output'); r.send('api.error', { data: { status_code: 500, retryable: true } }); r.send('turn.stopped', { session: null }); r.send('session.start')
  assert.equal(r.out.length, before); assert.equal(r.state(), 'working')
})

// ---------------------------------------------------------------- primary selection
test('finite one-shot never becomes primary; unlisted sources neither', () => {
  const r = rig()
  r.send('turn.start', { sid: 'oneshot01', source: 'cli', finite: true, turn: 'a' }); assert.equal(r.state(), 'idle')
  r.send('turn.start', { sid: 'kanban001', source: 'kanban', finite: true, turn: 'b' }); assert.equal(r.state(), 'idle')
  r.send('turn.start', { sid: 'cron0001', source: 'cron', finite: false, turn: 'c' }); assert.equal(r.state(), 'idle')
  r.send('turn.start', { sid: 'oneshot02', source: 'oneshot', finite: null, turn: 'd' }); assert.equal(r.state(), 'idle')
  r.send('turn.start', { sid: 'desk0001', source: 'desktop', turn: 'e' }); assert.equal(r.msg().session, 'desk0001')
  r.send('turn.end', { sid: 'oneshot01', source: 'cli', finite: true, turn: 'a', data: ok })
  assert.equal(r.msg().session, 'desk0001'); assert.equal(r.state(), 'working')
})

test('admitFinite (rehearsal) and autoSources / profiles options', () => {
  const r = rig({ admitFinite: true, autoSources: ['desktop', 'tui', 'cli', 'oneshot'] })
  r.send('turn.start', { sid: 'oneshot01', source: 'oneshot', finite: true }); assert.equal(r.msg().session, 'oneshot0')
  const p = rig({ profiles: ['keep'] })
  p.send('turn.start', { sid: 'aaaaaaaa1', profile: 'other' }); assert.equal(p.state(), 'idle')
  p.send('turn.start', { sid: 'bbbbbbbb1', profile: 'keep', turn: 'x' }); assert.equal(p.msg().session, 'bbbbbbbb')
})

test('primary: most recent turn.start wins, switch only when the current one is idle', () => {
  const r = rig()
  r.send('turn.start', { sid: 'aaaaaaaa1', turn: 'a1' }); assert.equal(r.msg().session, 'aaaaaaaa')
  r.advance(1)
  r.send('turn.start', { sid: 'bbbbbbbb1', turn: 'b1', source: 'tui' })
  assert.equal(r.msg().session, 'aaaaaaaa')                      // A is working: no switch
  r.advance(1)
  r.send('turn.end', { sid: 'aaaaaaaa1', turn: 'a1', data: ok }); assert.equal(r.state(), 'done')
  r.advance(3.9); assert.equal(r.msg().session, 'aaaaaaaa')      // done beat still active: no switch
  r.advance(0.2)
  assert.equal(r.msg().session, 'bbbbbbbb'); assert.equal(r.state(), 'working')   // idle -> follow B
  assert.equal(r.reducer.counters().primary_switches, 2)
})

test('primary follows session.reset with a new id, and an id change inside a running turn', () => {
  const r = rig()
  r.send('turn.start', { sid: 'oldoldold', turn: 'T' })
  r.send('session.reset', { sid: 'oldoldold', turn: null, data: { old_session_id: 'oldoldold', new_session_id: 'newnewnew' } })
  assert.equal(r.reducer.primary(), 'newnewnew'); assert.equal(r.state(), 'working')
  // the real bridge records session.reset with data {}: the running turn continues under a new id with the same turn_id
  const q = rig()
  q.send('turn.start', { sid: 'oldoldold', turn: 'T' })
  q.send('session.reset', { sid: 'oldoldold', turn: null, data: {} })
  assert.equal(q.reducer.primary(), 'oldoldold')                 // still running: kept for adoption
  q.send('tool.start', { sid: 'newnewnew', turn: 'T', data: { tool_name: 'x', tool_call_id: '1' } })
  assert.equal(q.reducer.primary(), 'newnewnew'); assert.equal(q.state(), 'working')
  q.send('turn.end', { sid: 'newnewnew', turn: 'T', data: ok }); assert.equal(q.state(), 'done')
  // reset of an idle session drops it
  const z = rig()
  z.send('turn.start', { sid: 'oldoldold', turn: 'T' }); z.send('turn.end', { sid: 'oldoldold', turn: 'T', data: ok }); z.advance(5)
  z.send('session.reset', { sid: 'oldoldold', turn: null, data: {} }); assert.equal(z.reducer.primary(), null)
})

test('primary dropped on finalize / delete, re-picked from the rest; none eligible = idle', () => {
  const r = rig()
  r.send('turn.start', { sid: 'aaaaaaaa1', turn: 'a' }); r.advance(1)
  r.send('turn.start', { sid: 'bbbbbbbb1', turn: 'b' })
  r.send('session.finalize', { sid: 'aaaaaaaa1', turn: null })
  assert.equal(r.msg().session, 'bbbbbbbb'); assert.equal(r.state(), 'working')
  r.send('session.delete', { sid: 'bbbbbbbb1', turn: null })
  assert.equal(r.state(), 'idle'); assert.equal(r.msg().session, null)
})

test('producer.bye and 30 s silence clear a stuck tool / wait; resting sessions are unaffected', () => {
  const r = rig({ waitDelayS: 0 })
  r.send('turn.start', { sid: 'stuck0001', inc: 'p1', turn: 'a' })
  r.send('tool.start', { sid: 'stuck0001', inc: 'p1', turn: 'a', data: { tool_name: 'terminal', tool_call_id: '1' } })
  r.send('human.wait', { sid: 'stuck0001', inc: 'p1', turn: null, data: { kind: 'approval', request_id: 'q' } })
  assert.equal(r.state(), 'waiting_approval')
  r.advance(29.9); assert.equal(r.state(), 'waiting_approval')
  r.advance(0.2); assert.equal(r.state(), 'idle')                       // 30 s without a line
  assert.equal(r.reducer.counters().producer_deaths, 1)
  assert.equal(r.reducer.drainNotes().deaths.length, 1)
  // bye clears at once
  const b = rig()
  b.send('turn.start', { inc: 'p2' }); b.send('tool.start', { inc: 'p2', data: { tool_name: 't', tool_call_id: '1' } }); b.advance(0.5); assert.equal(b.state(), 'tool')
  b.send('producer.bye', { inc: 'p2', session: null }); assert.equal(b.state(), 'idle')
  // a resting session on a silent producer stays idle: the only output is the primary leaving (state idle, session null)
  const c = rig()
  c.send('turn.start', { inc: 'p3' }); c.send('turn.end', { inc: 'p3', data: ok }); c.advance(5)
  const n = c.out.length; c.advance(60)
  assert.equal(c.out.length, n + 1); assert.equal(c.last().state, 'idle'); assert.equal(c.last().session, null)
  assert.ok(!c.states().slice(n).includes('failed'))
})

test('beats keep a producer alive; a dead producer re-picks another session', () => {
  const r = rig()
  r.send('turn.start', { sid: 'aaaaaaaa1', inc: 'p1', turn: 'a' }); r.advance(1)
  r.send('turn.start', { sid: 'bbbbbbbb1', inc: 'p2', turn: 'b' })
  for (let i = 0; i < 6; i++) { r.advance(10); r.send('producer.beat', { inc: 'p2', session: null }) }
  assert.equal(r.reducer.counters().producer_deaths, 1)           // p1 died (silent), p2 alive
  assert.equal(r.msg().session, 'bbbbbbbb'); assert.equal(r.state(), 'working')
})

test('child roll-up: child tool / wait / busy count toward the parent; children never beat', () => {
  const r = rig({ waitDelayS: 0 })
  r.send('turn.start', { sid: 'parent001', turn: 'p' })
  r.send('subagent.start', { sid: 'child0001', parent: 'parent001', turn: null, source: 'subagent' })
  r.send('tool.end', { sid: 'parent001', turn: 'p', data: { tool_call_id: 'none' } })
  r.send('tool.start', { sid: 'child0001', turn: 'c', source: 'subagent', data: { tool_name: 'web_search', tool_call_id: 'k1' } })
  r.advance(0.4); assert.equal(r.state(), 'tool'); assert.equal(r.msg().tool, 'web_search')
  r.send('human.wait', { sid: 'child0001', turn: null, source: 'subagent', data: { kind: 'approval', request_id: 'cq' } })
  assert.equal(r.state(), 'waiting_approval')
  r.send('human.resolved', { sid: 'child0001', turn: null, data: { request_id: 'cq' } })
  r.send('tool.end', { sid: 'child0001', turn: 'c', data: { tool_call_id: 'k1' } }); assert.equal(r.state(), 'working')
  r.send('turn.end', { sid: 'child0001', turn: 'c', source: 'subagent', data: ok })     // child end: no beat
  assert.equal(r.state(), 'working')
  r.send('subagent.stop', { sid: 'child0001', parent: 'parent001', turn: null })
  r.send('turn.end', { sid: 'parent001', turn: 'p', data: ok }); assert.equal(r.state(), 'done')
  assert.equal(r.states().filter((s) => s === 'done').length, 1)
  // a child is never a primary candidate
  assert.equal(r.reducer.primary(), 'parent001')
})

test('a fresh child with no events yet keeps the parent working while the parent turn idles', () => {
  const r = rig()
  r.send('turn.start', { sid: 'parent001', turn: 'p' })
  r.send('subagent.start', { sid: 'child0001', parent: 'parent001', turn: null, source: 'subagent' })
  assert.equal(r.state(), 'working')
})

test('producer.loss clears the listed sessions open tools / waits (unknown until the next boundary)', () => {
  const r = rig()
  r.send('turn.start', { sid: 'lossy0001', turn: 'a' })
  r.send('tool.start', { sid: 'lossy0001', turn: 'a', data: { tool_name: 'terminal', tool_call_id: '1' } }); r.advance(0.4); assert.equal(r.state(), 'tool')
  r.send('producer.loss', { session: null, data: { sessions: ['lossy0001'], dropped: 3 } })
  assert.equal(r.state(), 'working')
  r.send('turn.end', { sid: 'lossy0001', turn: 'a', data: ok }); assert.equal(r.state(), 'done')   // next boundary restores the normal path
})

test('idle record TTL forgets a resting session after 30 minutes', () => {
  const r = rig()
  r.send('turn.start'); r.send('turn.end', { data: ok }); r.advance(5)
  assert.equal(r.reducer._sessions.size, 1)
  r.advance(30 * 60 + 1); assert.equal(r.reducer._sessions.size, 0)
})

test('turn.end for an older turn than the running one is ignored', () => {
  const r = rig()
  r.send('turn.start', { turn: 'new' })
  r.send('turn.end', { turn: 'old', data: ok })
  assert.equal(r.state(), 'working'); assert.equal(r.reducer.counters().stale_turn_end, 1)
})

test('non-retryable api.error ends the turn as failed (the real TUI sends no turn.end after it); retryable changes nothing', () => {
  const r = rig()
  r.send('turn.start', { source: 'tui' })
  r.send('api.error', { source: 'tui', data: { status_code: 503, retryable: true } })
  assert.equal(r.state(), 'working')
  r.send('api.error', { source: 'tui', data: { status_code: 404, retryable: false } })
  assert.equal(r.state(), 'failed')
  r.advance(5.1); assert.equal(r.state(), 'idle')
  r.send('turn.end', { source: 'tui', data: { completed: false, failed: true, interrupted: false } })   // a late turn.end: no second beat
  assert.equal(r.state(), 'idle')
  assert.deepEqual(r.states(), ['working', 'failed', 'idle'])
  assert.equal(r.reducer.counters().api_error_ends, 1)
})

test('a turn that goes on after a non-retryable api.error is revived and still gets its own beat', () => {
  const r = rig()
  r.send('turn.start'); r.send('api.error', { data: { status_code: 402, retryable: false } })
  assert.equal(r.state(), 'failed')
  r.send('tool.start', { data: { tool_name: 'terminal', tool_call_id: 'c1' } })      // same turn_id t1: it was not over
  assert.equal(r.state(), 'working')
  r.send('tool.end', { data: { tool_call_id: 'c1' } }); r.send('turn.end', { data: ok })
  assert.equal(r.state(), 'done')
})

test('a running turn with no event of its own for 30 minutes is given up; a human wait is exempt', () => {
  const r = rig()
  const beat = () => r.send('producer.beat', { sid: null })
  r.send('turn.start')
  for (let i = 0; i < 179; i++) { r.advance(10); beat() }                            // 29 min 50 s of producer beats only
  assert.equal(r.state(), 'working')
  r.advance(10); beat(); r.advance(10); beat()
  assert.equal(r.state(), 'idle')
  assert.equal(r.reducer.counters().stuck_cleared, 1)
  assert.equal(r.reducer.drainNotes().stuck.length, 1)
  r.send('turn.start', { turn: 't2' }); r.send('human.wait', { turn: 't2', data: { kind: 'approval', request_id: 'q1' } })
  for (let i = 0; i < 200; i++) { r.advance(10); beat() }                            // 33 min waiting for the human
  assert.equal(r.state(), 'waiting_approval')
})

test('a human wait resolved within 300 ms never shows (auto-cancelled approvals); a real one shows after the delay', () => {
  const r = rig()
  r.send('turn.start')
  r.send('human.wait', { data: { kind: 'approval', request_id: 'q1' } })
  assert.equal(r.state(), 'working')
  r.advance(0.005); r.send('human.resolved', { data: { request_id: 'q1', outcome: 'cancelled' } })
  r.advance(1)
  assert.deepEqual(r.states(), ['working'])
  r.send('human.wait', { data: { kind: 'approval', request_id: 'q2' } })
  r.advance(0.31); assert.equal(r.state(), 'waiting_approval')
})

test('post-turn background tool calls (new turn_id, no turn.start, right after a turn.end) are not a turn', () => {
  const r = rig()
  r.send('turn.start', { turn: 't1' }); r.advance(5)
  r.send('turn.end', { turn: 't1', data: { completed: true } }); r.advance(5)
  assert.deepEqual(r.states(), ['working', 'done', 'idle'])
  // memory review: about 6 s after the end, its own turn_id, never a turn.end
  r.send('tool.start', { turn: 'bg1', data: { tool_name: 'memory', tool_call_id: 'm1' } }); r.advance(0.1)
  r.send('tool.end', { turn: 'bg1', data: { tool_call_id: 'm1', status: 'ok' } }); r.advance(120)
  r.send('tool.start', { turn: 'bg1', data: { tool_name: 'memory', tool_call_id: 'm2' } }); r.advance(2)   // same background id, later than afterEndS
  r.send('tool.end', { turn: 'bg1', data: { tool_call_id: 'm2', status: 'ok' } }); r.advance(60)
  assert.deepEqual(r.states().slice(0, 3), ['working', 'done', 'idle'])
  assert.equal(r.states().slice(3).every((st) => st === 'idle'), true)   // (the silent test producer is given up meanwhile: idle again, never working / tool)
  assert.equal(r.reducer.counters().background_turns, 1)
  // the next real turn is unaffected
  r.send('turn.start', { turn: 't2' }); r.advance(1)
  r.send('tool.start', { turn: 't2', data: { tool_name: 'terminal', tool_call_id: 'x1' } }); r.advance(1)
  assert.deepEqual(r.states().slice(-2), ['working', 'tool:terminal'])
})

test('a tool call without turn.start long after the last end (or with no end before it) still implies a running turn', () => {
  const r = rig()
  r.send('turn.start', { turn: 't1' }); r.advance(2)
  r.send('turn.end', { turn: 't1', data: { completed: true } }); r.advance(61)
  r.send('tool.start', { turn: 't9', data: { tool_name: 'terminal', tool_call_id: 'a1' } }); r.advance(1)
  assert.equal(r.state(), 'tool')
  const q = rig()
  q.send('tool.start', { turn: 't9', data: { tool_name: 'terminal', tool_call_id: 'a1' } }); q.advance(1)
  assert.equal(q.state(), 'tool')
})
