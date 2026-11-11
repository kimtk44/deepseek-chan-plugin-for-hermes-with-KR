// Test helper: a reducer on a fake clock with envelope builders.
import { createReducer } from '../reducer.mjs'

export function rig(options = {}) {
  let now = 1000
  const reducer = createReducer({ clock: () => now, options })
  const pseqs = new Map()
  const out = []   // every emitted message, with the fake time
  const emit = (msgs) => { for (const m of msgs) out.push({ at: now, ...m }) }
  const api = {
    reducer, out,
    get now() { return now },
    /** advance the fake clock, ticking every 50 ms like the hub timer (faster than the real 100 ms) */
    advance(seconds) {
      const end = now + seconds
      while (now + 0.05 < end - 1e-9) { now += 0.05; emit(reducer.tick()) }
      now = end; emit(reducer.tick())
    },
    send(kind, { sid = 's1000001', turn = 't1', source = 'desktop', finite = null, profile = 'p', inc = 'inc1', data = {}, parent = null, session = undefined, pseq = undefined } = {}) {
      const next = pseq ?? (pseqs.get(inc) || 0) + 1
      pseqs.set(inc, Math.max(pseqs.get(inc) || 0, next))
      const env = { v: 'hermes.companion.v1', producer: { incarnation: inc }, pseq: next, ts: now, kind, data,
        session: session !== undefined ? session : (sid ? { session_id: sid, turn_id: turn, source, finite, profile, parent_session_id: parent } : null) }
      emit(reducer.ingest(env))
    },
    states: () => out.map((m) => m.state + (m.tool ? `:${m.tool}` : '')),
    last: () => out[out.length - 1],
    state: () => reducer.current().state,
    msg: () => reducer.current(),
  }
  return api
}
