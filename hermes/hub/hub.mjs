#!/usr/bin/env node
// companion hub (minimal): follow the bridge record folder -> reducer -> WebSocket.
//   node hub.mjs --token-file <file> [--bind 127.0.0.1] [--port 9141] [--raw-dir ~/.local/state/hermes-companion]
//                [--auto-sources desktop,tui,cli] [--profiles a,b] [--recover-minutes 120]
//                [--rehearsal-admit-finite]   (rehearsal only: finite one-shot sessions may become primary)
// Logs JSON lines on stdout. Never logs raw envelopes: only state names, tool names, 8-char session ids, source, profile, counters, peers.
import os from 'node:os'
import path from 'node:path'
import { recover } from './reducer.mjs'
import { loadRecovery, RecordFollower } from './tail.mjs'
import { createHubServer, readTokenFile } from './server.mjs'

const args = process.argv.slice(2)
const opt = (name, fallback) => { const i = args.indexOf(`--${name}`); return i >= 0 && i + 1 < args.length ? args[i + 1] : fallback }
const flag = (name) => args.includes(`--${name}`)
const list = (v) => (v ? v.split(',').map((s) => s.trim()).filter(Boolean) : null)

const log = (kind, detail = {}) => console.log(JSON.stringify({ t: new Date().toISOString(), kind, ...detail }))

const BIND = opt('bind', '127.0.0.1'), PORT = Number(opt('port', '9141'))
const RAW_DIR = opt('raw-dir', path.join(process.env.XDG_STATE_HOME && path.isAbsolute(process.env.XDG_STATE_HOME) ? process.env.XDG_STATE_HOME : path.join(os.homedir(), '.local', 'state'), 'hermes-companion'))
const TOKEN_FILE = opt('token-file', '')
const RECOVER_MS = Number(opt('recover-minutes', '120')) * 60 * 1000

let token
try {
  if (!TOKEN_FILE) throw new Error('--token-file is required')
  token = readTokenFile(TOKEN_FILE)
} catch (error) { log('refuse', { reason: String(error.message || error) }); process.exit(2) }

const reducerOptions = { admitFinite: flag('rehearsal-admit-finite') }
if (list(opt('auto-sources', ''))) reducerOptions.autoSources = list(opt('auto-sources', ''))
if (list(opt('profiles', ''))) reducerOptions.profiles = list(opt('profiles', ''))

// ---- start-up recovery: replay recent files silently on a virtual clock, then continue on the wall clock ----
let bad = 0
const onBad = () => { bad++ }
const rec = loadRecovery(RAW_DIR, { sinceMs: RECOVER_MS, onBad })
const { reducer, notes: startup } = recover(rec.events, reducerOptions, () => Date.now() / 1000)
log('recovered', { producer_deaths: startup.deaths.length, primary_changes: startup.primary.length, files: rec.filesRead, events: rec.events.length, bad, state: reducer.current().state, session: reducer.current().session })

const server = createHubServer({ bind: BIND, port: PORT, token, getCurrent: () => reducer.current(), log })

function publish(messages) {
  for (const m of messages) {
    server.broadcast(m)
    log('state', { state: m.state, ...(m.tool ? { tool: m.tool } : {}), session: m.session, source: m.source, profile: m.profile, transition_id: m.transition_id, clients: server.clients() })
  }
  const notes = reducer.drainNotes()
  for (const d of notes.deaths) log('producer.dead', d)
  for (const p of notes.primary) log('primary', p)
  for (const x of notes.stuck) log('stuck.cleared', x)
}
const follower = new RecordFollower({ dir: RAW_DIR, known: rec.known, onBad, log, onEvent: (env) => publish(reducer.ingest(env)) })
const timer = setInterval(() => publish(reducer.tick()), 100)
const counters = setInterval(() => log('counters', { ...reducer.counters(), bad_lines: bad, tail: follower.stats, server: server.stats, clients: server.clients() }), 60000)

try {
  const addr = await server.listen()
  log('listening', { bind: addr.address, port: addr.port, epoch: server.epoch, raw_dir_files: rec.known.length })
} catch (error) { log('listen.error', { reason: String(error.message || error) }); process.exit(3) }
follower.start()

const shutdown = async (sig) => {
  log('shutdown', { signal: sig })
  clearInterval(timer); clearInterval(counters); follower.stop()
  await server.close()
  process.exit(0)
}
process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
