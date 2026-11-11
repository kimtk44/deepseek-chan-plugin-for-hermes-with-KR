'use strict'
const test = require('node:test')
const assert = require('node:assert/strict')
const { WebSocketServer } = require('ws')
const { startHub, probeBadToken, resolveHubSource } = require('../signals.cjs')

test('resolveHubSource: --hub, alias, saved, none, fake, nothing', () => {
  assert.deepEqual(resolveHubSource({}), { mode: 'fake', url: '', save: undefined, from: 'none' })
  assert.deepEqual(resolveHubSource({ hub: 'ws://h:1' }), { mode: 'hub', url: 'ws://h:1', save: 'ws://h:1', from: '--hub' })
  assert.deepEqual(resolveHubSource({ hubReplay: 'ws://r:2' }), { mode: 'hub', url: 'ws://r:2', save: 'ws://r:2', from: '--hub-replay' })
  assert.equal(resolveHubSource({ hub: 'ws://a:1', hubReplay: 'ws://b:2' }).url, 'ws://a:1')                 // --hub wins over the alias
  assert.deepEqual(resolveHubSource({ saved: 'wss://s:3' }), { mode: 'hub', url: 'wss://s:3', save: undefined, from: 'config.json' })
  assert.equal(resolveHubSource({ hub: 'ws://new:1', saved: 'ws://old:2' }).url, 'ws://new:1')               // command line beats saved
  const none = resolveHubSource({ hub: 'none', saved: 'ws://old:2' })
  assert.deepEqual(none, { mode: 'fake', url: '', save: null, from: 'cleared' })
  assert.equal(resolveHubSource({ hub: 'NONE' }).save, null)
  const fake = resolveHubSource({ fake: true, saved: 'ws://old:2' })
  assert.equal(fake.mode, 'fake'); assert.equal(fake.save, undefined)                                      // forced fake does not touch the saved hub
  assert.equal(resolveHubSource({ fake: true, hub: 'ws://x:1' }).mode, 'fake')
})

test('resolveHubSource: junk URLs are ignored with a warning, never saved', () => {
  const bad = resolveHubSource({ hub: 'http://x:1', saved: 'ws://old:2' })
  assert.equal(bad.mode, 'fake'); assert.equal(bad.save, undefined); assert.match(bad.warning, /not a ws/)
  const savedBad = resolveHubSource({ saved: 'garbage' })
  assert.equal(savedBad.mode, 'fake'); assert.match(savedBad.warning, /saved hub/)
})

function server(onConnection) {
  return new Promise((resolve) => {
    const wss = new WebSocketServer({ port: 0, host: '127.0.0.1' })
    wss.on('connection', onConnection)
    wss.on('listening', () => resolve({ wss, url: `ws://127.0.0.1:${wss.address().port}` }))
  })
}
const until = async (fn, ms = 4000) => { const t = Date.now(); while (Date.now() - t < ms) { if (fn()) return true; await new Promise((r) => setTimeout(r, 10)) } return false }
function client(url, extra = {}) {
  const log = { states: [], status: [], logs: [] }
  const hub = startHub({ url, token: 'x'.repeat(40), onState: (s, d) => log.states.push([s, d]), onStatus: (s) => log.status.push(s), log: (k, d) => log.logs.push(k), ...extra })
  return { hub, log }
}

test('startHub: welcome then state; hb counts as liveness and a silent hub is cut after the watchdog window', async () => {
  let conns = 0
  const { wss, url } = await server((ws) => {
    conns++
    ws.send(JSON.stringify({ type: 'welcome', epoch: 'e1' })); ws.send(JSON.stringify({ type: 'hb', epoch: 'e1' }))
    ws.send(JSON.stringify({ type: 'state', state: 'working', session: 'abcdefgh', transition_id: 't1', epoch: 'e1' }))
    // then silence (the socket stays open: a half-dead link)
  })
  const { hub, log } = client(url, { watchdogMs: 300, checkMs: 50, closeGraceMs: 200 })
  assert.ok(await until(() => log.status.includes('connected') && log.states.length === 1))
  assert.equal(log.states[0][0], 'working')
  assert.ok(await until(() => log.status.includes('offline')), 'watchdog closed the socket -> offline')
  assert.ok(log.logs.includes('hub.watchdog'))
  assert.ok(await until(() => conns >= 2, 6000), 'reconnected')
  hub.stop(); wss.close()
})

test('startHub: states arriving keep the watchdog quiet; a hub that never sends hb is never cut (replay server)', async () => {
  const timers = []
  const { wss, url } = await server((ws) => {
    ws.send(JSON.stringify({ type: 'welcome', epoch: 'r' }))
    let n = 0
    timers.push(setInterval(() => ws.send(JSON.stringify({ type: 'state', state: n % 2 ? 'working' : 'idle', session: 'x', transition_id: `t${n++}`, epoch: 'r' })), 60))
    ws.on('close', () => timers.forEach(clearInterval))
  })
  const quiet = await server((ws) => { ws.send(JSON.stringify({ type: 'welcome', epoch: 'q' })) })   // no hb, no states
  const a = client(url, { watchdogMs: 200, checkMs: 40 }), b = client(quiet.url, { watchdogMs: 200, checkMs: 40 })
  await new Promise((r) => setTimeout(r, 900))
  assert.ok(a.log.states.length >= 8); assert.ok(!a.log.status.includes('offline'))
  assert.ok(b.log.status.includes('connected')); assert.ok(!b.log.status.includes('offline')); assert.ok(!b.log.logs.includes('hub.watchdog'))
  const c = client(url, { watchdogMs: 200, checkMs: 40 })     // sanity: same server, fresh client
  await until(() => c.log.states.length > 0)
  for (const x of [a, b, c]) x.hub.stop()
  timers.forEach(clearInterval); wss.close(); quiet.wss.close()
})

test('startHub: hb keeps a state-less connection alive past the watchdog window', async () => {
  let t
  const { wss, url } = await server((ws) => {
    ws.send(JSON.stringify({ type: 'welcome', epoch: 'h' })); ws.send(JSON.stringify({ type: 'hb', epoch: 'h' }))
    t = setInterval(() => ws.send(JSON.stringify({ type: 'hb', epoch: 'h' })), 80)
    ws.on('close', () => clearInterval(t))
  })
  const { hub, log } = client(url, { watchdogMs: 250, checkMs: 40 })
  await new Promise((r) => setTimeout(r, 900))
  assert.ok(log.status.includes('connected')); assert.ok(!log.status.includes('offline'))
  hub.stop(); clearInterval(t); wss.close()
})

test('probeBadToken sees a refused handshake as rejected', async () => {
  const http = require('node:http')
  const srv = http.createServer().listen(0, '127.0.0.1')
  srv.on('upgrade', (_req, socket) => { socket.write('HTTP/1.1 401 Unauthorized\r\nConnection: close\r\nContent-Length: 0\r\n\r\n'); socket.destroy() })
  await new Promise((r) => srv.on('listening', r))
  const result = await probeBadToken(`ws://127.0.0.1:${srv.address().port}`)
  assert.equal(result.rejected, true)
  srv.close()
})
