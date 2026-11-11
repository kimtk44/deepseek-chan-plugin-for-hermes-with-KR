import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import WebSocket from 'ws'
import { createHubServer, readTokenFile } from '../server.mjs'

const TOKEN = 'a'.repeat(40)
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'hub-srv-'))
const tokenFile = (dir, content, mode) => { const f = path.join(dir, 'hub.token'); fs.writeFileSync(f, content, { mode }); fs.chmodSync(f, mode); return f }

async function start(extra = {}) {
  let current = { type: 'state', state: 'working', session: 'abcdefgh', source: 'tui', profile: 'default', transition_id: 't1' }
  const srv = createHubServer({ port: 0, token: TOKEN, getCurrent: () => current, ...extra })
  const addr = await srv.listen()
  return { srv, port: addr.port, setCurrent: (c) => { current = c } }
}
const connect = (port, token) => new Promise((resolve) => {
  const ws = new WebSocket(`ws://127.0.0.1:${port}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
  const msgs = []
  ws.on('message', (d) => msgs.push(JSON.parse(String(d))))
  ws.on('open', () => resolve({ ws, msgs, status: 101 }))
  ws.on('unexpected-response', (_q, res) => resolve({ ws, msgs, status: res.statusCode }))
  ws.on('error', () => {})
})
const until = async (fn, ms = 3000) => { const t = Date.now(); while (Date.now() - t < ms) { if (fn()) return true; await new Promise((r) => setTimeout(r, 10)) } return false }

test('missing or wrong token => 401; good token => welcome then the current state', async () => {
  const { srv, port } = await start()
  assert.equal((await connect(port, null)).status, 401)
  assert.equal((await connect(port, 'b'.repeat(40))).status, 401)
  assert.equal((await connect(port, TOKEN.slice(0, -1))).status, 401)      // prefix of the token
  const c = await connect(port, TOKEN)
  assert.equal(c.status, 101)
  assert.ok(await until(() => c.msgs.length >= 2))
  assert.equal(c.msgs[0].type, 'welcome'); assert.match(c.msgs[0].epoch, /^[0-9a-f]{8}$/)
  assert.equal(c.msgs[1].type, 'state'); assert.equal(c.msgs[1].state, 'working'); assert.equal(c.msgs[1].epoch, c.msgs[0].epoch)
  assert.equal(srv.stats.rejects, 3)
  c.ws.terminate(); await srv.close()
})

test('broadcast reaches connected clients with the epoch; a restart has a new epoch', async () => {
  const a = await start(), b = await start()
  assert.notEqual(a.srv.epoch, b.srv.epoch)
  const c = await connect(a.port, TOKEN); await until(() => c.msgs.length >= 2)
  a.srv.broadcast({ type: 'state', state: 'done', session: 'abcdefgh', transition_id: 't2' })
  assert.ok(await until(() => c.msgs.length >= 3)); assert.equal(c.msgs[2].state, 'done'); assert.equal(c.msgs[2].epoch, a.srv.epoch)
  c.ws.terminate(); await a.srv.close(); await b.srv.close()
})

test('hb: application message and ping frame every interval', async () => {
  const { srv, port } = await start({ pingMs: 40, deadMs: 5000 })
  const c = await connect(port, TOKEN)
  let pings = 0; c.ws.on('ping', () => pings++)
  assert.ok(await until(() => c.msgs.filter((m) => m.type === 'hb').length >= 2))
  assert.ok(pings >= 2); assert.equal(c.msgs.find((m) => m.type === 'hb').epoch, srv.epoch)
  c.ws.terminate(); await srv.close()
})

test('a client that never answers a ping is terminated after the dead window', async () => {
  const { srv, port } = await start({ pingMs: 30, deadMs: 120 })
  const c = await connect(port, TOKEN)
  c.ws._receiver.removeAllListeners('ping')      // keep the socket open but stop auto-pong
  c.ws.pong = () => {}
  c.ws.on('ping', () => {})
  c.ws._socket.pause?.()                          // stop reading: no pong is produced
  assert.ok(await until(() => srv.stats.terminated >= 1, 3000))
  c.ws.terminate(); await srv.close()
})

test('/health shape without auth; any other plain HTTP => 426', async () => {
  const { srv, port } = await start()
  const h = await fetch(`http://127.0.0.1:${port}/health`)
  assert.equal(h.status, 200); assert.deepEqual(await h.json(), { ok: true, service: 'companion-hub', v: 1 })
  assert.equal((await fetch(`http://127.0.0.1:${port}/`)).status, 426)
  assert.equal((await fetch(`http://127.0.0.1:${port}/v1/state`)).status, 426)
  assert.equal((await fetch(`http://127.0.0.1:${port}/health`, { method: 'POST' })).status, 426)
  await srv.close()
})

test('the token and envelopes never reach the log callback', async () => {
  const lines = []
  const { srv, port } = await start({ log: (k, d) => lines.push(JSON.stringify({ k, ...d })) })
  const c = await connect(port, TOKEN); await connect(port, 'nope'.repeat(10))
  await until(() => c.msgs.length >= 2); c.ws.terminate(); await srv.close()
  assert.ok(lines.length >= 2)
  assert.ok(!lines.join('\n').includes(TOKEN))
})

test('readTokenFile refuses a short token and a group/world readable file', () => {
  const dir = tmp()
  assert.equal(readTokenFile(tokenFile(dir, TOKEN + '\n', 0o600)), TOKEN)
  assert.throws(() => readTokenFile(tokenFile(dir, 'short-token', 0o600)), /shorter than 32/)
  assert.throws(() => readTokenFile(tokenFile(dir, TOKEN, 0o640)), /group\/world/)
  assert.throws(() => readTokenFile(tokenFile(dir, TOKEN, 0o604)), /group\/world/)
  assert.throws(() => createHubServer({ token: 'short', getCurrent: () => null }), /too short/)
})

test('hub.mjs exits 2 and does not listen on a short token or a world-readable token file', () => {
  const dir = tmp(), hub = new URL('../hub.mjs', import.meta.url).pathname
  const run = (file) => spawnSync(process.execPath, [hub, '--token-file', file, '--port', '0', '--raw-dir', dir], { encoding: 'utf8', timeout: 5000 })
  const a = run(tokenFile(dir, 'short', 0o600)); assert.equal(a.status, 2); assert.match(a.stdout, /refuse/)
  const b = run(tokenFile(dir, TOKEN, 0o644)); assert.equal(b.status, 2); assert.match(b.stdout, /refuse/)
  const c = spawnSync(process.execPath, [hub, '--port', '0', '--raw-dir', dir], { encoding: 'utf8', timeout: 5000 }); assert.equal(c.status, 2)
})
