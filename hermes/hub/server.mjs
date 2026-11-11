// HTTP + WebSocket front of the hub. Protocol = overlay/tools/hub-replay-server.mjs plus {type:'hb'}:
//   upgrade needs `Authorization: Bearer <token>` (timing-safe) else HTTP 401;
//   server -> client JSON text frames: {type:'welcome', epoch}, {type:'state', ...}, {type:'hb', epoch}.
// Logs never contain the token or envelope content: only peers, counters and what the caller passes to log().
import { createServer } from 'node:http'
import { readFileSync, statSync } from 'node:fs'
import { timingSafeEqual, randomBytes } from 'node:crypto'
import { WebSocketServer } from 'ws'

export const MIN_TOKEN_LENGTH = 32

/** Read the token file; throws (caller exits) when it is short or readable by group/other. */
export function readTokenFile(file) {
  const st = statSync(file)
  if (st.mode & 0o077) throw new Error(`token file ${file} is group/world accessible (mode ${(st.mode & 0o777).toString(8)}); chmod 600`)
  const token = readFileSync(file, 'utf8').trim()
  if (token.length < MIN_TOKEN_LENGTH) throw new Error(`token in ${file} is shorter than ${MIN_TOKEN_LENGTH} characters`)
  return token
}

export function createHubServer({ bind = '127.0.0.1', port = 9141, token, getCurrent, log = () => {}, pingMs = 15000, deadMs = 45000, epoch = randomBytes(4).toString('hex') }) {
  if (!token || token.length < MIN_TOKEN_LENGTH) throw new Error('token too short')
  const expected = Buffer.from(token)
  const authorized = (req) => {
    const header = String(req.headers.authorization || '')
    const given = Buffer.from(header.startsWith('Bearer ') ? header.slice(7) : '')
    return given.length === expected.length && timingSafeEqual(given, expected)
  }
  const peerOf = (req) => `${req.socket.remoteAddress}:${req.socket.remotePort}`
  const stats = { connects: 0, rejects: 0, broadcasts: 0, terminated: 0 }

  const http = createServer((req, res) => {
    if (req.method === 'GET' && (req.url || '').split('?')[0] === '/health') {
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ ok: true, service: 'companion-hub', v: 1 }))
      return
    }
    res.writeHead(426, { 'content-type': 'text/plain', upgrade: 'websocket' })
    res.end('upgrade required')
  })
  const wss = new WebSocketServer({ noServer: true })
  http.on('upgrade', (req, socket, head) => {
    const peer = peerOf(req)
    if (!authorized(req)) {
      stats.rejects++
      log('reject', { peer, reason: 'bad token' })
      socket.write('HTTP/1.1 401 Unauthorized\r\nConnection: close\r\nContent-Length: 0\r\n\r\n')
      socket.destroy()
      return
    }
    wss.handleUpgrade(req, socket, head, (ws) => {
      ws.peer = peer
      ws.lastPong = Date.now()
      ws.on('pong', () => { ws.lastPong = Date.now() })
      ws.on('message', () => { ws.lastPong = Date.now() })   // any client traffic is also liveness
      ws.on('error', () => {})
      ws.on('close', () => { log('disconnect', { peer, clients: wss.clients.size }) })
      stats.connects++
      ws.send(JSON.stringify({ type: 'welcome', epoch }))
      const current = getCurrent()
      if (current) ws.send(JSON.stringify({ ...current, epoch }))
      log('connect', { peer, clients: wss.clients.size })
    })
  })

  const beat = setInterval(() => {
    const now = Date.now()
    for (const ws of wss.clients) {
      if (now - ws.lastPong > deadMs) { stats.terminated++; log('terminate', { peer: ws.peer, reason: 'no pong' }); ws.terminate(); continue }
      if (ws.readyState !== 1) continue
      try { ws.ping(); ws.send(JSON.stringify({ type: 'hb', epoch })) } catch {}
    }
  }, pingMs)
  beat.unref?.()

  return {
    epoch, stats,
    listen: () => new Promise((resolve, reject) => {
      http.once('error', reject)
      http.listen(port, bind, () => { http.off('error', reject); resolve(http.address()) })
    }),
    broadcast(message) {
      const text = JSON.stringify({ ...message, epoch })
      stats.broadcasts++
      for (const ws of wss.clients) if (ws.readyState === 1) ws.send(text)
    },
    clients: () => wss.clients.size,
    close: () => new Promise((resolve) => {
      clearInterval(beat)
      for (const ws of wss.clients) ws.terminate()
      wss.close(() => http.close(() => resolve()))
      http.closeAllConnections?.()
    }),
  }
}
