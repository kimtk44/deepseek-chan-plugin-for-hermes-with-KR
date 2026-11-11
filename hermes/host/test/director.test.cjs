// A1.6-style expectations: director cmd lists per transition (director table).
const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { createDirector, loadLines, FALLBACK_LINES } = require('../director.cjs')

const LINES = FALLBACK_LINES

const fns = (list) => list.map(([fn, args]) => `${fn}(${JSON.stringify(args)})`)

test('hello only after the first open (the pet greeting + sway)', () => {
  const d = createDirector()
  assert.deepEqual(d.hello(), [['say', [LINES.hello, 5800, false, 'reaction']], ['play', ['sway', 2300]]])
  assert.deepEqual(d.hello(), [])
})

test('idle -> working entry', () => {
  const d = createDirector()
  assert.deepEqual(d.transition('working').list, [
    ['setExp', ['loading', true]], ['say', [LINES.start, 2500, false, 'reaction']], ['setMood', ['work']], ['play', ['nod', 1300]]])
})

test('working -> tool says tool line, with 1.5 s cooldown; tool -> working sends nothing', () => {
  let t = 0
  const d = createDirector({ now: () => t })
  d.transition('working')
  assert.deepEqual(d.transition('tool', { tool: 'terminal' }).list, [['say', [LINES['tool.terminal'], 0, false, 'status']]])
  assert.deepEqual(d.transition('working').list, [])
  t = 1000
  assert.deepEqual(d.transition('tool', { tool: 'read_file' }).list, [])   // inside cooldown
  t = 2600
  assert.deepEqual(d.transition('tool', { tool: 'read_file' }).list, [['say', [LINES['tool.read_file'], 0, false, 'status']]])
})

test('working -> waiting_approval -> waiting_question -> working', () => {
  const d = createDirector()
  d.transition('working')
  assert.deepEqual(d.transition('waiting_approval').list, [
    ['setExp', ['sweat', true]], ['setExp', ['squint', false]], ['say', [LINES.approval, 0, false, 'reaction']], ['setMood', ['wait']], ['play', ['tilt', 1800]]])
  assert.deepEqual(d.transition('waiting_question').list, [
    ['setExp', ['sweat', false]], ['setExp', ['squint', true]], ['say', [LINES.question, 0, false, 'reaction']], ['setMood', ['wait']], ['play', ['tilt', 1800]]])
  assert.deepEqual(d.transition('working').list, [['setExp', ['sweat', false]], ['setExp', ['squint', false]], ['setMood', ['work']], ['hush', []]])
})

test('working -> done and working -> failed', () => {
  const d = createDirector()
  d.transition('working')
  assert.deepEqual(d.transition('done').list, [
    ['setExp', ['loading', false]], ['flashExp', ['heart', 4000]], ['flashExp', ['blush', 4000]], ['say', [LINES.done, 4000, false, 'reaction']], ['setMood', ['idle']], ['play', ['laugh', 1700]]])
  assert.deepEqual(d.transition('idle').list, [])
  d.transition('working')
  assert.deepEqual(d.transition('failed').list, [
    ['setExp', ['loading', false]], ['flashExp', ['tears', 5000]], ['flashExp', ['dizzy', 2500]], ['say', [LINES.error, 5000, false, 'reaction']], ['setMood', ['sad', 5000]], ['play', ['droop', 2000]]])
})

test('waiting -> done clears sweat/squint first', () => {
  const d = createDirector()
  d.transition('working'); d.transition('waiting_question')
  assert.deepEqual(fns(d.transition('done').list).slice(0, 3), ['setExp(["sweat",false])', 'setExp(["squint",false])', 'setExp(["loading",false])'])
})

test('interrupted: working -> idle and waiting (with loading) -> idle', () => {
  const d = createDirector()
  d.transition('working')
  const interrupted = [['setExp', ['loading', false]], ['setExp', ['sweat', false]], ['setExp', ['squint', false]], ['hush', []], ['setMood', ['idle']]]
  assert.deepEqual(d.transition('idle').list, interrupted)
  d.transition('working'); d.transition('waiting_approval')
  assert.deepEqual(d.transition('idle').list, interrupted)
  d.transition('waiting_approval')   // from idle: no loading held
  assert.deepEqual(d.transition('idle').list, [['setExp', ['sweat', false]], ['setExp', ['squint', false]], ['setMood', ['idle']]])
})

test('offline and recovery replays the returning state entry', () => {
  const d = createDirector()
  d.transition('working')
  assert.deepEqual(d.transition('offline').list, [['setExp', ['dark', true]], ['say', [LINES.offline, 0, true, 'other']]])
  assert.deepEqual(d.transition('offline').list, [])
  const back = d.transition('waiting_approval').list
  assert.deepEqual(fns(back).slice(0, 3), ['setExp(["dark",false])', 'hush([])', 'setExp(["sweat",true])'])
  d.transition('offline')
  assert.deepEqual(fns(d.transition('idle').list), ['setExp(["dark",false])', 'hush([])', 'setExp(["loading",false])', 'setExp(["sweat",false])', 'setExp(["squint",false])', 'hush([])', 'setMood(["idle"])'])
})

test('speak flag only for reaction states', () => {
  const d = createDirector()
  assert.equal(d.transition('working').speak, true)
  assert.equal(d.transition('tool', { tool: 'terminal' }).speak, false)
  assert.equal(d.transition('offline').speak, false)
  assert.equal(d.transition('done').speak, true)
})

test('loadLines: text and tool lines come from the JSON, missing file falls back', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dsc-lines-'))
  const file = path.join(dir, 'lines.json')
  fs.writeFileSync(file, JSON.stringify({
    "text": { "hello": "H", "start": "S", "approval": "A", "question": "Q", "done": "D", "error": "E" },
    "tools": { "명령 실행": "T-terminal", "편집": "T-patch" }
  }))

  const lines = loadLines(file)
  assert.equal(lines.hello, 'H')
  assert.equal(lines.done, 'D')
  assert.equal(lines['tool.terminal'], 'T-terminal')
  assert.equal(lines['tool.patch'], 'T-patch')
  assert.equal(lines['tool.read_file'], FALLBACK_LINES['tool.read_file'])
  assert.equal(lines.offline, FALLBACK_LINES.offline)

  assert.deepEqual(loadLines(path.join(os.tmpdir(), 'no-such-dsc-lines.json')), FALLBACK_LINES)

  const d = createDirector({ lines })
  const list = d.transition('working').list
  assert.ok(list.some((c) => JSON.stringify(c) === JSON.stringify(['say', ['S', 2500, false, 'reaction']])))
})
