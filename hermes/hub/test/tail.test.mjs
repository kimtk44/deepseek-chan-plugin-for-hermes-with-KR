import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { loadRecovery, RecordFollower, parseName } from '../tail.mjs'
import { recover } from '../reducer.mjs'

const INC = 'a'.repeat(32), INC2 = 'b'.repeat(32)
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'hub-tail-'))
const line = (inc, pseq, kind, extra = {}) => JSON.stringify({ v: 'hermes.companion.v1', producer: { incarnation: inc }, pseq, ts: Date.now() / 1000, session: null, kind, data: {}, ...extra }) + '\n'
const until = async (fn, ms = 3000) => { const t = Date.now(); while (Date.now() - t < ms) { if (fn()) return true; await new Promise((r) => setTimeout(r, 10)) } return false }
const follow = (dir, onEvent, extra = {}) => { const f = new RecordFollower({ dir, onEvent, pollMs: 15, scanMs: 40, ...extra }); f.start(); return f }

test('parseName', () => {
  assert.deepEqual(parseName(`raw-${INC}.jsonl`), { incarnation: INC, part: Infinity })
  assert.deepEqual(parseName(`raw-${INC}.0003.jsonl`), { incarnation: INC, part: 3 })
  assert.equal(parseName('raw-xyz.jsonl'), null); assert.equal(parseName('notes.txt'), null)
})

test('follows appended lines, keeps a partial trailing line until its newline', async () => {
  const dir = tmp(), seen = []
  const file = path.join(dir, `raw-${INC}.jsonl`)
  fs.writeFileSync(file, line(INC, 1, 'producer.hello'))
  const f = follow(dir, (e) => seen.push(e.pseq))
  assert.ok(await until(() => seen.length === 1))
  const l2 = line(INC, 2, 'producer.beat')
  fs.appendFileSync(file, l2.slice(0, 20))
  await new Promise((r) => setTimeout(r, 120))
  assert.deepEqual(seen, [1])                       // partial: nothing yet
  fs.appendFileSync(file, l2.slice(20) + line(INC, 3, 'producer.beat'))
  assert.ok(await until(() => seen.length === 3)); assert.deepEqual(seen, [1, 2, 3])
  f.stop()
})

test('discovers new files after start and never opens for writing', async () => {
  const dir = tmp(), seen = []
  const f = follow(dir, (e) => seen.push(e.producer.incarnation.slice(0, 1)))
  fs.writeFileSync(path.join(dir, `raw-${INC}.jsonl`), line(INC, 1, 'producer.hello'))
  fs.writeFileSync(path.join(dir, `raw-${INC2}.jsonl`), line(INC2, 1, 'producer.hello'))
  fs.writeFileSync(path.join(dir, 'ignored.txt'), 'x\n')
  assert.ok(await until(() => seen.length === 2)); assert.deepEqual(seen.sort(), ['a', 'b'])
  f.stop()
  const src = fs.readFileSync(new URL('../tail.mjs', import.meta.url), 'utf8')
  assert.ok(!/openSync\([^)]*'(?:w|a|r\+|a\+)'/.test(src) && !/writeFileSync|appendFileSync|createWriteStream|unlinkSync/.test(src))
})

test('rotation by rename: the unread tail of the renamed file is still consumed, then the new live file from 0', async () => {
  const dir = tmp(), seen = []
  const live = path.join(dir, `raw-${INC}.jsonl`)
  fs.writeFileSync(live, line(INC, 1, 'producer.hello'))
  const f = follow(dir, (e) => seen.push(e.pseq))
  assert.ok(await until(() => seen.length === 1))
  // writer appends, then rotates before the follower looked again (same sequence as RecordSender._write/_rotate)
  fs.appendFileSync(live, line(INC, 2, 'producer.beat') + line(INC, 3, 'producer.beat'))
  fs.renameSync(live, path.join(dir, `raw-${INC}.0001.jsonl`))
  fs.writeFileSync(live, line(INC, 4, 'producer.beat'))
  assert.ok(await until(() => seen.length === 4)); assert.deepEqual(seen, [1, 2, 3, 4])
  fs.appendFileSync(live, line(INC, 5, 'producer.beat'))
  assert.ok(await until(() => seen.length === 5))
  await new Promise((r) => setTimeout(r, 200))
  assert.deepEqual(seen, [1, 2, 3, 4, 5])           // the renamed file was not read twice
  assert.ok(f.stats.rotations >= 1)
  f.stop()
})

test('a cold (old) file is not read at start but is followed once it changes', async () => {
  const dir = tmp(), seen = []
  const file = path.join(dir, `raw-${INC}.jsonl`)
  fs.writeFileSync(file, line(INC, 1, 'producer.hello') + line(INC, 2, 'producer.beat'))
  const old = new Date(Date.now() - 5 * 3600 * 1000); fs.utimesSync(file, old, old)
  const rec = loadRecovery(dir, { sinceMs: 2 * 3600 * 1000 })
  assert.equal(rec.events.length, 0); assert.equal(rec.known.length, 1)
  const f = follow(dir, (e) => seen.push(e.pseq), { known: rec.known })
  await new Promise((r) => setTimeout(r, 150)); assert.deepEqual(seen, [])
  fs.appendFileSync(file, line(INC, 3, 'producer.beat'))
  assert.ok(await until(() => seen.length === 1)); assert.deepEqual(seen, [3])
  f.stop()
})

test('recovery then follow: no event lost or doubled across the hand-over', async () => {
  const dir = tmp(), seen = []
  const file = path.join(dir, `raw-${INC}.jsonl`)
  const l2 = line(INC, 2, 'producer.beat')
  fs.writeFileSync(file, line(INC, 1, 'producer.hello') + l2.slice(0, 30))   // pseq 2 is partial at recovery time
  const rec = loadRecovery(dir, {})
  assert.deepEqual(rec.events.map((e) => e.pseq), [1])
  const f = follow(dir, (e) => seen.push(e.pseq), { known: rec.known })
  fs.appendFileSync(file, l2.slice(30) + line(INC, 3, 'producer.beat'))
  assert.ok(await until(() => seen.length === 2)); assert.deepEqual(seen, [2, 3])
  f.stop()
})

test('recovery merges rotated parts in order and interleaves producers by ts', () => {
  const dir = tmp()
  const mk = (inc, pseq, ts) => JSON.stringify({ producer: { incarnation: inc }, pseq, ts, kind: 'producer.beat', session: null, data: {} }) + '\n'
  const now = Date.now() / 1000
  fs.writeFileSync(path.join(dir, `raw-${INC}.0001.jsonl`), mk(INC, 1, now - 50) + mk(INC, 2, now - 40))
  fs.writeFileSync(path.join(dir, `raw-${INC}.jsonl`), mk(INC, 3, now - 30))
  fs.writeFileSync(path.join(dir, `raw-${INC2}.jsonl`), mk(INC2, 1, now - 45) + mk(INC2, 2, now - 35))
  const rec = loadRecovery(dir, {})
  assert.deepEqual(rec.events.map((e) => `${e.producer.incarnation[0]}${e.pseq}`), ['a1', 'b1', 'a2', 'b2', 'a3'])
})

test('bad lines are counted and skipped', () => {
  const dir = tmp(); let bad = 0
  fs.writeFileSync(path.join(dir, `raw-${INC}.jsonl`), line(INC, 1, 'producer.hello') + 'not json\n' + line(INC, 2, 'producer.beat'))
  const rec = loadRecovery(dir, { onBad: () => bad++ })
  assert.equal(rec.events.length, 2); assert.equal(bad, 1)
})

test('start-up recovery re-bases timers: expired beat gone, live beat kept, dead producer cleared', () => {
  const now = 5000
  const ev = (inc, pseq, ts, kind, session, data = {}) => ({ producer: { incarnation: inc }, pseq, ts, kind, session, data })
  const s = (sid, turn) => ({ session_id: sid, turn_id: turn, source: 'desktop', finite: null, profile: 'p' })
  const ok = { completed: true, failed: false, interrupted: false }
  // A: turn ended 10 s ago (4 s beat long over). B: turn ended 2 s ago (beat alive 2 more s). C: tool open on a producer silent for 60 s.
  const A = [ev('A', 1, now - 20, 'turn.start', s('aaaaaaaa1', 'ta')), ev('A', 2, now - 10, 'turn.end', s('aaaaaaaa1', 'ta'), ok)]
  const B = [ev('B', 1, now - 8, 'turn.start', s('bbbbbbbb1', 'tb')), ev('B', 2, now - 2, 'turn.end', s('bbbbbbbb1', 'tb'), ok), ev('B', 3, now - 1, 'producer.beat', null)]
  const C = [ev('C', 1, now - 70, 'turn.start', s('cccccccc1', 'tc')), ev('C', 2, now - 65, 'tool.start', s('cccccccc1', 'tc'), { tool_name: 'terminal', tool_call_id: '1' })]
  const events = [...A, ...B, ...C].sort((x, y) => x.ts - y.ts)
  let wall = now
  const { reducer } = recover(events, {}, () => wall)
  assert.equal(reducer.current().state, 'done'); assert.equal(reducer.current().session, 'bbbbbbbb')   // B's live beat is shown
  assert.equal(reducer._sessions.get('cccccccc1').open_tools.size, 0)                                       // C's producer is dead
  wall += 2.1; reducer.tick(); assert.equal(reducer.current().state, 'idle')
  // a hub restart in the middle of a tool keeps it (producer still beating)
  const D = [ev('D', 1, now - 3, 'turn.start', s('dddddddd1', 'td')), ev('D', 2, now - 2, 'tool.start', s('dddddddd1', 'td'), { tool_name: 'terminal', tool_call_id: '1' }), ev('D', 3, now - 0.5, 'producer.beat', null)]
  const r2 = recover(D, {}, () => now).reducer
  assert.equal(r2.current().state, 'tool'); assert.equal(r2.current().tool, 'terminal')
})

test('a recently modified file known from recovery is followed immediately (first line not delayed by the 1 s listing)', async () => {
  const dir = tmp(), lat = []
  const file = path.join(dir, `raw-${INC}.jsonl`)
  fs.writeFileSync(file, line(INC, 1, 'producer.hello'))
  const rec = loadRecovery(dir, {})
  const f = new RecordFollower({ dir, known: rec.known, pollMs: 20, scanMs: 5000, onEvent: () => lat.push(Date.now()) })
  f.start()
  const t0 = Date.now()
  fs.appendFileSync(file, line(INC, 2, 'producer.beat'))
  assert.ok(await until(() => lat.length === 1, 1000))
  assert.ok(lat[0] - t0 < 300, `latency ${lat[0] - t0} ms`)
  f.stop()
})
