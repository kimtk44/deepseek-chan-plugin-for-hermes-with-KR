// Reducer: hermes.companion.v1 envelopes -> ONE character state (minimal hub).
// Pure: no I/O, no timers, no wall clock. The caller injects `clock()` (seconds) and calls `tick()` on a
// timer; every `ingest()` and `tick()` returns the state messages that became due (usually 0 or 1).
//
// Privacy: this module only ever keeps ids, names and flags from the envelope; it never keeps raw envelopes.

export const PUBLIC_STATES = ['idle', 'working', 'tool', 'waiting_approval', 'waiting_question', 'done', 'failed']

export const DEFAULTS = {
  toolDelayS: 0.3,        // an open tool shows as `tool` only after this long
  waitDelayS: 0.3,        // a human wait shows only after this long (the one recorded approval was auto-cancelled in 5 ms)
  doneBeatS: 4,
  failedBeatS: 5,
  producerDeadS: 30,      // no line from an incarnation for this long => its sessions go idle
  recordTtlS: 30 * 60,    // idle record without events for this long is forgotten
  stuckS: 30 * 60,        // a running turn with no event of its own for this long is given up (longest silent gap inside a
                          // real completed turn: 368 s). A human wait is exempt: approvals may sit for hours.
  afterEndS: 60,          // tool calls under a NEW turn_id, with no turn.start, that begin this soon after a turn.end are post-turn
                          // background work (Hermes's memory review), not a turn: 3 of 3 recorded cases began 5.8-6.8 s after the end,
                          // called only `memory`, and never got a turn.end, so the session read `working` until stuckS (30 min).
  autoSources: ['desktop', 'tui', 'cli'],
  profiles: null,         // null = all profiles
  admitFinite: false,     // rehearsal only: also let finite (one-shot) sessions become primary
  beatMemory: 512,        // remembered turn_ids (exactly one beat per turn_id)
}

const KNOWN_KINDS = new Set([
  'producer.hello', 'producer.register', 'producer.unregister', 'producer.beat', 'producer.bye', 'producer.loss',
  'session.start', 'session.finalize', 'session.reset', 'session.delete',
  'turn.start', 'turn.output', 'turn.end', 'turn.stopped',
  'tool.start', 'tool.end', 'human.wait', 'human.resolved', 'approval.pre', 'approval.post', 'api.error',
  'subagent.start', 'subagent.stop',
])

const str = (v) => (typeof v === 'string' && v ? v : null)

export function createReducer({ clock, options = {} }) {
  const o = { ...DEFAULTS, ...options }
  const autoSources = new Set(o.autoSources)
  const profileFilter = o.profiles ? new Set(o.profiles) : null

  const sessions = new Map()     // session_id -> record
  const producers = new Map()    // incarnation -> { lastSeen, alive, pid }
  const lastPseq = new Map()     // incarnation -> last accepted pseq
  const beaten = new Set()       // turn_ids that already produced a beat (insertion order = age)
  let primary = null             // session_id | null
  let lastKey = null, lastMessage = null, transitions = 0

  const counters = {
    events: 0, by_kind: {}, unknown_kinds: {}, duplicates: 0, stale_turn_end: 0, background_turns: 0, double_end: 0,
    primary_switches: 0, producer_deaths: 0, emitted: 0, emitted_by_state: {}, sessions_seen: 0,
    api_error_ends: 0, stuck_cleared: 0,
  }
  const seenSessions = new Set()

  // ---------------------------------------------------------------- records
  function newRecord(sid) {
    if (!seenSessions.has(sid)) { seenSessions.add(sid); counters.sessions_seen++ }
    return {
      sid, turn: 'idle', turn_id: null, last_end_turn_id: null, last_end_at: -Infinity, bg_turn_id: null,
      open_tools: new Map(), pending: new Map(), beat: null,
      producer: null, source: null, finite: null, profile: null, parent: null,
      last_turn_start: 0, last_event: clock(), fresh: false,
    }
  }
  function touch(env) {
    const s = env.session
    const sid = str(s && s.session_id)
    if (!sid) return null
    let rec = sessions.get(sid)
    const inc = str(env.producer && env.producer.incarnation)
    if (!rec) {
      rec = adopt(sid, s, inc) || newRecord(sid)
      sessions.set(sid, rec)
    }
    rec.last_event = clock()
    rec.fresh = false
    if (inc) rec.producer = inc
    if (str(s.source)) rec.source = s.source
    if (typeof s.finite === 'boolean') rec.finite = s.finite
    if (str(s.profile)) rec.profile = s.profile
    if (str(s.parent_session_id)) rec.parent = s.parent_session_id
    return rec
  }
  // A running session whose id changes mid-turn (compaction / reset): the new id carries the same turn_id.
  function adopt(sid, s, inc) {
    const turnId = str(s && s.turn_id)
    if (!turnId) return null
    for (const rec of sessions.values()) {
      if (rec.turn === 'running' && rec.turn_id === turnId && rec.producer === inc && rec.sid !== sid) {
        moveRecord(rec.sid, sid)
        return sessions.get(sid)
      }
    }
    return null
  }
  function moveRecord(from, to) {
    const rec = sessions.get(from)
    if (!rec || from === to) return
    sessions.delete(from)
    rec.sid = to
    sessions.set(to, rec)
    for (const child of sessions.values()) if (child.parent === from) child.parent = to
    if (primary === from) primary = to
  }
  function dropRecord(sid) {
    sessions.delete(sid)
    for (const [id, rec] of [...sessions]) if (rec.parent === sid) sessions.delete(id)
    if (primary === sid) primary = null
  }
  function clearActivity(rec) {
    rec.turn = 'idle'
    rec.open_tools.clear()
    rec.pending.clear()
  }
  // A tool event implies a running turn even when the turn.start line was never seen (28 of 114 real sessions).
  // Returns false when the tool call belongs to post-turn background work (see afterEndS): it must not show as activity.
  function impliedRunning(rec, turnId) {
    if (!turnId) return
    if (turnId === rec.bg_turn_id) return false
    if (rec.turn === 'idle' && turnId !== rec.last_end_turn_id) {
      if (clock() - rec.last_end_at <= o.afterEndS) { rec.bg_turn_id = turnId; counters.background_turns++; return false }
      rec.turn = 'running'; rec.turn_id = turnId; rec.last_turn_start = clock(); rec.beat = null
      if (rec.api_failed_turn === turnId) { beaten.delete(turnId); rec.api_failed_turn = null }   // the turn went on after all
    } else if (rec.turn === 'running' && rec.turn_id !== turnId) {
      rec.turn_id = turnId
    }
  }

  // ---------------------------------------------------------------- ingest
  function ingest(env) {
    if (!env || typeof env !== 'object' || typeof env.kind !== 'string') return []
    const inc = str(env.producer && env.producer.incarnation)
    const pseq = env.pseq
    if (inc && Number.isFinite(pseq)) {
      const last = lastPseq.get(inc)
      if (last !== undefined && pseq <= last) { counters.duplicates++; return [] }
      lastPseq.set(inc, pseq)
    }
    counters.events++
    counters.by_kind[env.kind] = (counters.by_kind[env.kind] || 0) + 1
    if (!KNOWN_KINDS.has(env.kind)) counters.unknown_kinds[env.kind] = (counters.unknown_kinds[env.kind] || 0) + 1
    if (inc) {
      let p = producers.get(inc)
      if (!p) { p = { lastSeen: 0, alive: true, pid: null }; producers.set(inc, p) }
      p.lastSeen = clock(); p.alive = true
      if (env.kind === 'producer.hello' && env.data && Number.isFinite(env.data.pid)) p.pid = env.data.pid
      if (env.kind === 'producer.bye') killProducer(inc, 'bye')
    }
    if (env.kind === 'producer.loss') handleLoss(env)
    else if (!env.kind.startsWith('producer.')) handleSession(env)
    return evaluate()
  }

  function handleLoss(env) {
    const list = env.data && Array.isArray(env.data.sessions) ? env.data.sessions : []
    for (const sid of list) {
      const rec = sessions.get(sid)
      if (rec) { rec.open_tools.clear(); rec.pending.clear() }   // unknown until its next turn boundary
    }
  }

  function handleSession(env) {
    const d = env.data || {}
    const s = env.session || {}
    const kind = env.kind
    if (kind === 'session.reset') {
      const oldId = str(d.old_session_id) || str(s.session_id)
      const newId = str(d.new_session_id)
      if (oldId && newId && oldId !== newId && sessions.has(oldId)) { moveRecord(oldId, newId); return }
      // new id unknown (the real bridge records `data: {}`): a running turn may continue under a new id with the
      // same turn_id (adopt()); an idle record is simply done.
      const rec = oldId && sessions.get(oldId)
      if (rec && rec.turn !== 'running') dropRecord(oldId)
      return
    }
    if (kind === 'session.finalize' || kind === 'session.delete') {
      const sid = str(s.session_id)
      if (sid) dropRecord(sid)
      return
    }
    if (kind === 'subagent.stop') {
      const child = str(s.session_id)
      if (child) sessions.delete(child)
      return
    }
    const rec = touch(env)
    if (!rec) return                       // session-key-only lines (approval.*, turn.stopped): no state change
    if (kind === 'subagent.start') { rec.fresh = true; return }
    switch (kind) {
      case 'turn.start':
        rec.turn = 'running'; rec.turn_id = str(s.turn_id); rec.last_turn_start = clock(); rec.beat = null; rec.bg_turn_id = null
        break
      case 'tool.start': {
        if (impliedRunning(rec, str(s.turn_id)) === false) break
        const id = str(d.tool_call_id)
        if (id) rec.open_tools.set(id, { name: str(d.tool_name) || 'tool', started: clock() })
        break
      }
      case 'tool.end': {
        const id = str(d.tool_call_id)
        if (id) rec.open_tools.delete(id)
        break
      }
      case 'human.wait': {
        const id = str(d.request_id)
        if (id) { rec.pending.set(id, { kind: str(d.kind) || 'clarify', since: clock() }); rec.beat = null }
        break
      }
      case 'human.resolved': {
        const id = str(d.request_id)
        if (id) rec.pending.delete(id)
        break
      }
      case 'turn.end': endTurn(rec, s, d); break
      case 'api.error': if (d.retryable === false) failTurn(rec, str(s.turn_id)); break
      default: break                       // session.start, turn.output, turn.stopped, retryable api.error, approval.*
    }
  }

  // A non-retryable API error ends the turn as failed. The design takes the verdict from turn.end alone, but the real TUI
  // fires no turn.end after such an error (7 of 7 recorded cases, 404 / 402): without this the session reads `working`
  // for hours. If the turn does go on (a later tool.start with the same turn_id), impliedRunning() revives it.
  function failTurn(rec, turnId) {
    if (rec.turn !== 'running') return
    if (turnId && rec.turn_id && rec.turn_id !== turnId) return
    const id = rec.turn_id || turnId
    clearActivity(rec)
    rec.turn_id = null
    counters.api_error_ends++
    if (rec.parent || !id || beaten.has(id)) return
    beaten.add(id)
    if (beaten.size > o.beatMemory) beaten.delete(beaten.values().next().value)
    rec.api_failed_turn = id
    rec.beat = { kind: 'failed', until: clock() + o.failedBeatS }
  }

  function endTurn(rec, s, d) {
    const turnId = str(s.turn_id)
    const closed = d.session_close === true || !turnId
    if (!closed && rec.turn === 'running' && rec.turn_id && rec.turn_id !== turnId) { counters.stale_turn_end++; return }
    clearActivity(rec)
    rec.turn_id = null
    if (closed) return                     // CLI exit / TUI cleanup: idle, no beat
    rec.last_end_turn_id = turnId
    rec.last_end_at = clock()
    if (d.interrupted === true) return
    const failed = d.failed === true || d.completed === false
    const done = !failed && d.completed === true
    if (!failed && !done) return
    if (rec.parent) return                 // children never produce beats
    if (beaten.has(turnId)) { counters.double_end++; return }
    beaten.add(turnId)
    if (beaten.size > o.beatMemory) beaten.delete(beaten.values().next().value)
    rec.beat = failed ? { kind: 'failed', until: clock() + o.failedBeatS } : { kind: 'done', until: clock() + o.doneBeatS }
  }

  // ---------------------------------------------------------------- derived state
  function killProducer(inc, why) {
    const p = producers.get(inc)
    if (!p) return
    const wasAlive = p.alive
    p.alive = false
    if (wasAlive) counters.producer_deaths++
    for (const rec of sessions.values()) if (rec.producer === inc) clearActivity(rec)
    deaths.push({ producer: inc.slice(0, 8), why, pid: p.pid })
  }
  const deaths = []

  function family(rec) {
    const members = [rec]
    if (!rec.parent) for (const c of sessions.values()) if (c.parent === rec.sid) members.push(c)
    return members
  }

  function derive(rec) {
    const now = clock()
    if (rec.beat && rec.beat.until > now) return { state: rec.beat.kind === 'failed' ? 'failed' : 'done' }
    const members = family(rec)
    let approval = false, question = false, running = false
    let toolName = null, toolStarted = -Infinity
    for (const m of members) {
      for (const p of m.pending.values()) {
        if (now - p.since < o.waitDelayS) continue
        if (p.kind === 'approval' || p.kind === 'sudo') approval = true; else question = true
      }
      if (m.turn === 'running' || m.pending.size || m.open_tools.size || (m !== rec && m.fresh)) running = true
      for (const t of m.open_tools.values()) {
        if (now - t.started >= o.toolDelayS && t.started >= toolStarted) { toolName = t.name; toolStarted = t.started }
      }
    }
    if (approval) return { state: 'waiting_approval' }
    if (question) return { state: 'waiting_question' }
    if (toolName) return { state: 'tool', tool: toolName }
    if (running) return { state: 'working' }
    return { state: 'idle' }
  }

  function eligible(rec) {
    if (rec.parent) return false
    if (!autoSources.has(rec.source)) return false
    if (rec.finite === true && !o.admitFinite) return false
    if (profileFilter && !profileFilter.has(rec.profile)) return false
    const p = rec.producer && producers.get(rec.producer)
    return !!(p && p.alive)
  }
  function best() {
    let pick = null
    for (const rec of sessions.values()) {
      if (rec.last_turn_start > 0 && eligible(rec) && (!pick || rec.last_turn_start > pick.last_turn_start)) pick = rec
    }
    return pick
  }
  function updatePrimary() {
    const cur = primary && sessions.get(primary)
    let next = primary
    if (!cur || !eligible(cur)) {
      const b = best(); next = b ? b.sid : null
    } else if (derive(cur).state === 'idle') {
      const b = best()
      if (b && b.sid !== cur.sid && b.last_turn_start > cur.last_turn_start) next = b.sid
    }
    if (next !== primary) {
      primary = next
      counters.primary_switches++
      primaryChanges.push({ session: next ? next.slice(0, 8) : null })
    }
  }
  const primaryChanges = []
  const stuck = []

  function housekeeping() {
    const now = clock()
    for (const [inc, p] of producers) if (p.alive && now - p.lastSeen > o.producerDeadS) killProducer(inc, 'silent')
    for (const rec of sessions.values()) {
      if (rec.beat && rec.beat.until <= now) rec.beat = null
      if (rec.turn === 'running' && !rec.pending.size && now - rec.last_event > o.stuckS) {
        clearActivity(rec); rec.turn_id = null
        counters.stuck_cleared++
        stuck.push({ session: rec.sid.slice(0, 8), silent_s: Math.round(now - rec.last_event) })
      }
    }
    for (const [sid, rec] of [...sessions]) {
      if (rec.turn === 'idle' && !rec.beat && !rec.open_tools.size && !rec.pending.size && now - rec.last_event > o.recordTtlS) {
        if (![...sessions.values()].some((c) => c.parent === sid)) { sessions.delete(sid); if (primary === sid) primary = null }
      }
    }
  }

  // ---------------------------------------------------------------- output
  function evaluate() {
    housekeeping()
    updatePrimary()
    const rec = primary ? sessions.get(primary) : null
    const d = rec ? derive(rec) : { state: 'idle' }
    const key = `${primary || ''}|${d.state}|${d.tool || ''}`
    if (key === lastKey) return []
    lastKey = key
    const msg = {
      type: 'state', state: d.state, ...(d.tool ? { tool: d.tool } : {}),
      session: primary ? primary.slice(0, 8) : null, source: rec ? rec.source : null, profile: rec ? rec.profile : null,
      transition_id: `t${++transitions}`,
    }
    lastMessage = msg
    counters.emitted++
    counters.emitted_by_state[d.state] = (counters.emitted_by_state[d.state] || 0) + 1
    return [msg]
  }

  return {
    ingest,
    tick: evaluate,
    current: () => lastMessage || (evaluate(), lastMessage),
    /** drain producer deaths / primary changes since the last call (for logging; ids are already shortened) */
    drainNotes() { return { deaths: deaths.splice(0), primary: primaryChanges.splice(0), stuck: stuck.splice(0) } },
    counters: () => ({ ...counters, sessions: sessions.size, producers_alive: [...producers.values()].filter((p) => p.alive).length }),
    primary: () => primary,
    // test / diagnostics only
    _sessions: sessions,
  }
}

/**
 * Run recorded events (already merged in order) through a fresh reducer on a virtual clock.
 * `ticks` advance the clock in `tickS` steps between events so timers (300 ms tool delay, beats, liveness) fire.
 * Returns { timeline: [{ at, ...msg }], counters, reducer }.
 */
export function replayEvents(events, options = {}, { tickS = 0.1, maxIdleTickS = 40, onMessage } = {}) {
  let now = events.length ? events[0].ts : 0
  const reducer = createReducer({ clock: () => now, options })
  const timeline = []
  const push = (msgs) => { for (const m of msgs) { const row = { at: Math.round(now * 1000) / 1000, ...m }; timeline.push(row); if (onMessage) onMessage(row) } }
  push(reducer.tick())
  for (const env of events) {
    const target = Number.isFinite(env.ts) ? Math.max(now, env.ts) : now
    const limit = Math.min(target, now + maxIdleTickS)
    while (now + tickS < limit) { now += tickS; push(reducer.tick()) }
    now = target
    push(reducer.ingest(env))
  }
  // let trailing timers fire
  const end = now + maxIdleTickS
  while (now < end) { now += tickS; push(reducer.tick()) }
  return { timeline, counters: reducer.counters(), reducer, end: now }
}

/**
 * Start-up recovery: replay recent events silently on a virtual clock (the event `ts`, which is wall-clock time on the
 * same machine), then hand the reducer over to `wallClock`. A done/failed beat that already expired by the real "now"
 * is not shown, a producer whose last line is older than producerDeadS is dead (both fall out of the first tick),
 * and an open tool or wait that was live at the last line is kept while its producer is still alive.
 * Returns { reducer, notes } where notes = deaths / primary changes of the replay (to be logged as a summary).
 */
export function recover(events, options, wallClock) {
  let virtual = events.length && Number.isFinite(events[0].ts) ? events[0].ts : null
  const reducer = createReducer({ clock: () => (virtual !== null ? virtual : wallClock()), options })
  for (const env of events) {
    if (Number.isFinite(env.ts) && virtual !== null) virtual = Math.max(virtual, env.ts)
    reducer.ingest(env)
  }
  virtual = null
  reducer.tick()
  return { reducer, notes: reducer.drainNotes() }
}
