#!/usr/bin/env node
// Feed recorded files through the reducer on a virtual clock and print the state timeline + totals.
//   node tools/replay.mjs [--dir <raw dir>] [--no-timeline] [--tick 0.1] [--admit-finite] [--auto-sources a,b] [--profiles a,b]
// Default dir = ~/.local/state/hermes-companion (opened read-only). Never prints more than state names, tool names,
// 8-char session ids, source, profile and counters.
import os from 'node:os'
import path from 'node:path'
import { loadRecovery } from '../tail.mjs'
import { replayEvents } from '../reducer.mjs'

const args = process.argv.slice(2)
const opt = (name, fallback) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : fallback }
const dir = opt('dir', path.join(os.homedir(), '.local', 'state', 'hermes-companion'))
const options = { admitFinite: args.includes('--admit-finite') }
if (opt('auto-sources', '')) options.autoSources = opt('auto-sources', '').split(',')
if (opt('profiles', '')) options.profiles = opt('profiles', '').split(',')
let bad = 0
const { events, filesRead } = loadRecovery(dir, { sinceMs: Infinity, onBad: () => { bad++ } })
const t0 = events.length ? events[0].ts : 0
const timeline = !args.includes('--no-timeline')
const started = performance.now()
const { counters } = replayEvents(events, options, {
  tickS: Number(opt('tick', '0.1')),
  onMessage: timeline ? (m) => console.log(`${(m.at - t0).toFixed(3).padStart(12)}  ${m.state.padEnd(17)} ${(m.tool || '').padEnd(14)} ${String(m.session).padEnd(8)} ${String(m.source).padEnd(8)} ${m.profile}`) : undefined,
})
console.log(JSON.stringify({ files: filesRead, events: events.length, bad_lines: bad, wall_ms: Math.round(performance.now() - started), ...counters }, null, 2))
