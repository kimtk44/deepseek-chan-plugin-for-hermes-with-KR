#!/usr/bin/env node
// Subscribe to a hub and print every message with the local receive time (acceptance tool).
//   node tools/companion-tail.mjs --url ws://127.0.0.1:9141 --token-file hub.token [--exit-after 30] [--quiet-hb]
import { readFileSync } from 'node:fs'
import WebSocket from 'ws'

const args = process.argv.slice(2)
const opt = (name, fallback) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : fallback }
const url = opt('url', 'ws://127.0.0.1:9141')
const token = readFileSync(opt('token-file', ''), 'utf8').trim()
const exitAfter = Number(opt('exit-after', '0'))
const quietHb = args.includes('--quiet-hb')
const ws = new WebSocket(url, { headers: { Authorization: `Bearer ${token}` } })
ws.on('unexpected-response', (_req, res) => { console.log(JSON.stringify({ rx: Date.now() / 1000, error: `HTTP ${res.statusCode}` })); process.exit(1) })
ws.on('error', (e) => { console.log(JSON.stringify({ rx: Date.now() / 1000, error: String(e.message) })); process.exit(1) })
ws.on('ping', () => console.log(JSON.stringify({ rx: Date.now() / 1000, type: 'ping-frame' })))
ws.on('message', (data) => {
  const rx = Date.now() / 1000
  let m; try { m = JSON.parse(String(data)) } catch { return }
  if (quietHb && m.type === 'hb') return
  console.log(JSON.stringify({ rx, ...m }))
})
ws.on('close', (code) => { console.log(JSON.stringify({ rx: Date.now() / 1000, closed: code })); process.exit(0) })
if (exitAfter) setTimeout(() => { ws.close(); setTimeout(() => process.exit(0), 200) }, exitAfter * 1000)
