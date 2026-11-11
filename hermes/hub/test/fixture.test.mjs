import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { loadRecovery } from '../tail.mjs'
import { replayEvents } from '../reducer.mjs'

const DIR = new URL('./fixtures/', import.meta.url).pathname
const rows = (options) => {
  const { events } = loadRecovery(DIR, { sinceMs: Infinity })
  const t0 = events[0].ts
  const { timeline, counters } = replayEvents(events, options)
  return { events, counters, timeline: timeline.map((m) => [Number((m.at - t0).toFixed(3)), m.state, m.tool || null, m.session, m.source, m.profile]) }
}
const golden = (name) => JSON.parse(fs.readFileSync(path.join(DIR, name), 'utf8'))
const only = (r) => r.timeline.map((x) => x[1] + (x[2] ? ':' + x[2] : ''))

test('fixture coverage: turn, tools, approval wait, max-iterations, finite one-shot, session close', () => {
  const { events, counters } = rows({})
  const kinds = new Set(events.map((e) => e.kind))
  for (const k of ['turn.start', 'tool.start', 'tool.end', 'human.wait', 'human.resolved', 'approval.pre', 'approval.post', 'turn.end', 'turn.output']) assert.ok(kinds.has(k), k)
  const ends = events.filter((e) => e.kind === 'turn.end')
  assert.ok(ends.some((e) => e.data.completed === true))
  assert.ok(ends.some((e) => e.data.completed === false && e.data.failed === false && e.data.interrupted === false && /max_iterations/.test(e.data.turn_exit_reason)))
  assert.ok(ends.some((e) => e.data.session_close === true))
  assert.ok(events.some((e) => e.session && e.session.finite === true && e.session.source === 'cli'))
  assert.ok(events.some((e) => e.session && e.session.source === 'tui'))
  assert.equal(counters.unknown_kinds && Object.keys(counters.unknown_kinds).length, 0)
})

test('fixture is anonymised: no real host, no raw session id shape, no real pid/incarnation pattern', () => {
  for (const f of fs.readdirSync(DIR).filter((n) => n.endsWith('.jsonl'))) {
    const text = fs.readFileSync(path.join(DIR, f), 'utf8')
    assert.ok(!/20261\d{3}_\d{6}/.test(text), f)
    for (const l of text.split('\n').filter(Boolean)) {
      const e = JSON.parse(l)
      assert.match(e.producer.host, /^host-[0-9a-f]{6}$/)
      assert.ok(!('diag' in e))
      if (e.session && e.session.session_id) assert.match(e.session.session_id, /^s[0-9a-f]{20}$/)
    }
  }
})

test('golden timeline (default options): finite one-shot never shown, the 5 ms auto-cancelled approval never shown, cli max-iterations = failed', () => {
  const r = rows({})
  assert.deepEqual(r.timeline, golden('expected-timeline.json'))
  const s = only(r)
  assert.ok(!s.includes('waiting_approval') && s.includes('failed') && s.includes('done'))
  assert.ok(!r.timeline.some((x) => x[4] === 'cli' && x[1] === 'done'))      // the finite one-shot's done is not shown
})

test('the recorded approval wait is seen by the reducer when the wait delay is off', () => {
  assert.ok(only(rows({ waitDelayS: 0 })).includes('waiting_approval'))
})

test('golden timeline with admitFinite (rehearsal flag): the finite one-shot (started during the tui turn) becomes primary only once the tui session is idle', () => {
  const r = rows({ admitFinite: true })
  assert.deepEqual(r.timeline, golden('expected-timeline-admit-finite.json'))
  const i = r.timeline.findIndex((x) => x[4] === 'cli')
  assert.equal(r.timeline[i - 1][4], 'tui'); assert.equal(r.timeline[i - 1][1], 'done'); assert.equal(r.timeline[i][1], 'idle')   // switched right after the done beat
})
