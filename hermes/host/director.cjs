// @ts-check
// director: hub (or fake) final state -> the pet `cmd` lists.
// Ported from the in-window reactions (character/harness-signals.ts: reactToWaiting / reactToRunning / reactToFinish).
// Pure module: no Electron, clock injected, so `node --test` covers it.

const fs = require('node:fs')

/** Built-in fallback lines (Korean) */
const FALLBACK_LINES = {
  hello: '안녕하세요, 주인님!',
  start: '알겠어요! 시작할게요',
  approval: '확인이 필요해요!',
  question: '여쭤볼 게 있어요!',
  done: '다 했어요!',
  error: '앗, 문제가 생겼어요…',
  offline: '서버와 연결이 끊겼어요… 돌아오면 알려 드릴게요',
  'tool.terminal': '명령 실행 중…',
  'tool.execute_code': '코드 돌리는 중…',
  'tool.read_file': '파일 읽는 중…',
  'tool.write_file': '파일 쓰는 중…',
  'tool.patch': '코드 고치는 중…',
  'tool.search_files': '찾아보는 중…',
  'tool.web_search': '검색하는 중…',
  'tool.web_extract': '웹페이지 보는 중…',
  'tool.delegate_task': '도우미 부르는 중…',
  'tool.default': '도구 쓰는 중…',
}

const TOOL_LABELS = {
  terminal: '명령 실행',
  execute_code: '코드',
  read_file: '읽기',
  write_file: '쓰기',
  patch: '편집',
  search_files: '검색',
  web_search: '웹 검색',
  web_extract: '웹페이지 가져오기',
  delegate_task: '하위 에이전트 만들기',
}

/**
 * Loads lines from a JSON file.
 * @param {string} file
 * @returns {Record<string, string>}
 */
function loadLines(file) {
  try {
    const raw = fs.readFileSync(file, 'utf8')
    const data = JSON.parse(raw)
    const lines = { ...FALLBACK_LINES }

    if (data.text) {
      for (const key of ['hello', 'start', 'approval', 'question', 'done', 'error']) {
        if (data.text[key]) lines[key] = data.text[key]
      }
    }

    if (data.tools) {
      for (const [toolName, label] of Object.entries(TOOL_LABELS)) {
        if (data.tools[label]) {
          lines[`tool.${toolName}`] = data.tools[label]
        }
      }
    }

    return lines
  } catch (e) {
    return { ...FALLBACK_LINES }
  }
}

const STATES = ['idle', 'working', 'tool', 'waiting_approval', 'waiting_question', 'done', 'failed', 'offline']
const WAITING = new Set(['waiting_approval', 'waiting_question'])
const BUSY = new Set(['working', 'tool'])
/** states with a spoken reaction (TTS kind = reaction) */
const SPEAKS = new Set(['working', 'waiting_approval', 'waiting_question', 'done', 'failed'])
const TOOL_COOLDOWN_MS = 1500

/**
 * @param {{ now?: () => number, lines?: Record<string, string> }} [options]
 */
function createDirector({ now = () => Date.now(), lines = FALLBACK_LINES } = {}) {
  let state = 'idle'
  let beforeOffline = 'idle'
  let loadingHeld = false
  let lastToolSay = -Infinity
  let helloSent = false

  /** @param {string} name */
  const isWaiting = (name) => WAITING.has(name)

  /** @param {string | undefined} name */
  const toolLine = (name) => lines[`tool.${name}`] || lines['tool.default']

  /** tool bubble: only when not waiting and 1.5 s after the previous one */
  const toolSay = (tool) => {
    const t = now()
    if (t - lastToolSay < TOOL_COOLDOWN_MS) return []
    lastToolSay = t
    return [['say', [toolLine(tool), 0, false, 'status']]]
  }
  const enterWorking = () => { loadingHeld = true; return [['setExp', ['loading', true]], ['say', [lines.start, 2500, false, 'reaction']], ['setMood', ['work']], ['play', ['nod', 1300]]] }
  const enterWaiting = (to) => {
    const approval = to === 'waiting_approval'
    return [['setExp', ['sweat', approval]], ['setExp', ['squint', !approval]], ['say', [approval ? lines.approval : lines.question, 0, false, 'reaction']], ['setMood', ['wait']], ['play', ['tilt', 1800]]]
  }
  const exitWaiting = () => [['setExp', ['sweat', false]], ['setExp', ['squint', false]]]
  const enterDone = () => { loadingHeld = false; return [['setExp', ['loading', false]], ['flashExp', ['heart', 4000]], ['flashExp', ['blush', 4000]], ['say', [lines.done, 4000, false, 'reaction']], ['setMood', ['idle']], ['play', ['laugh', 1700]]] }
  const enterFailed = () => { loadingHeld = false; return [['setExp', ['loading', false]], ['flashExp', ['tears', 5000]], ['flashExp', ['dizzy', 2500]], ['say', [lines.error, 5000, false, 'reaction']], ['setMood', ['sad', 5000]], ['play', ['droop', 2000]]] }
  const interrupted = () => { loadingHeld = false; return [['setExp', ['loading', false]], ['setExp', ['sweat', false]], ['setExp', ['squint', false]], ['hush', []], ['setMood', ['idle']]] }

  /**
   * cmd list for prev -> next (no offline handling here)
   * @param {string} prev @param {string} next @param {string | undefined} tool
   * @returns {any[]}
   */
  function step(prev, next, tool) {
    if (next === prev) return next === 'tool' ? toolSay(tool) : []
    const fromBusy = BUSY.has(prev), fromWait = isWaiting(prev)
    switch (next) {
      case 'working':
        if (fromBusy) return []                                                    // tool -> working: nothing
        if (fromWait) return [...exitWaiting(), ['setMood', ['work']], ['hush', []]]
        return enterWorking()                                                       // idle / done / failed -> working
      case 'tool':
        if (prev === 'working') return toolSay(tool)
        if (fromWait) return [...exitWaiting(), ['setMood', ['work']], ['hush', []], ...toolSay(tool)]
        return [...enterWorking(), ...toolSay(tool)]
      case 'waiting_approval':
      case 'waiting_question':
        return enterWaiting(next)                                                   // also waiting_X -> waiting_Y
      case 'done':
        return [...(fromWait ? exitWaiting() : []), ...enterDone()]
      case 'failed':
        return [...(fromWait ? exitWaiting() : []), ...enterFailed()]
      case 'idle':
        if (fromBusy || (fromWait && loadingHeld)) return interrupted()           // aborted / stale
        if (fromWait) return [...exitWaiting(), ['setMood', ['idle']]]
        return []                                                                   // done / failed beats end by themselves
      default:
        return []
    }
  }

  return {
    LINES: lines,
    get state() { return state },
    /** cmd list after the first `open` only (not after re-opens from a renderer reload) */
    hello() { if (helloSent) return []; helloSent = true; return [['say', [lines.hello, 5800, false, 'reaction']], ['play', ['sway', 2300]]] },
    /** hold expressions + mood for the current state, sent after every re-open (a reloaded page starts blank) */
    snapshot() {
      const base = state === 'offline' ? beforeOffline : state
      const list = [['setExp', ['loading', loadingHeld]], ['setExp', ['sweat', base === 'waiting_approval']], ['setExp', ['squint', base === 'waiting_question']],
        ['setExp', ['dark', state === 'offline']], ['setMood', [BUSY.has(base) ? 'work' : isWaiting(base) ? 'wait' : 'idle']]]
      if (state === 'offline') list.push(['say', [lines.offline, 0, true, 'other']])
      else if (isWaiting(base)) list.push(['say', [base === 'waiting_approval' ? lines.approval : lines.question, 0, false, 'reaction']])
      return list
    },
    /**
     * @param {string} next one of STATES @param {{ tool?: string }} [detail]
     * @returns {{ list: any[], from: string, to: string, speak: boolean }}
     */
    transition(next, detail = {}) {
      if (!STATES.includes(next)) throw new Error(`unknown state ${next}`)
      const from = state
      /** @type {any[]} */
      let list
      if (next === 'offline') {
        if (from === 'offline') return { list: [], from, to: next, speak: false }
        beforeOffline = from
        list = [['setExp', ['dark', true]], ['say', [lines.offline, 0, true, 'other']]]
      } else if (from === 'offline') {
        list = [['setExp', ['dark', false]], ['hush', []], ...step(beforeOffline, next, detail.tool)]
      } else {
        list = step(from, next, detail.tool)
      }
      state = next
      return { list, from, to: next, speak: from !== next && SPEAKS.has(next) }
    },
  }
}

module.exports = { createDirector, loadLines, FALLBACK_LINES, STATES }
