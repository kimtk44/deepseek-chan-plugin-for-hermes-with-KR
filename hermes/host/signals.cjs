// @ts-check
// Signal sources: --fake-signals (timer) and --hub <ws url> (the hub or the replay server; --hub-replay is an alias; token auth).
// Both call onState(state, detail). The hub token stays in this (main) process only.

/** fake cycle: every `stepMs` the next state */
const FAKE_CYCLE = [
  ['working'], ['tool', { tool: 'terminal' }], ['waiting_approval'], ['waiting_question'], ['done'],
  ['working'], ['tool', { tool: 'read_file' }], ['failed'], ['offline'], ['idle'],
]

/** @param {{ stepMs: number, onState: (state: string, detail: any) => void }} options */
function startFake({ stepMs, onState }) {
  let index = 0, loops = 0
  const tick = () => {
    const [state, detail] = FAKE_CYCLE[index]
    onState(state, { ...(detail || {}), transition_id: `fake-${loops}-${index}`, session: 'fake', epoch: 'fake' })
    index = (index + 1) % FAKE_CYCLE.length
    if (index === 0) loops++
  }
  const timer = setInterval(tick, stepMs)
  setTimeout(tick, 300)
  return { stop: () => clearInterval(timer) }
}

/**
 * Hub client. Liveness: once the hub has sent a `{type:'hb'}` (the real hub does every 15 s; the replay server never does),
 * any message counts as alive and `watchdogMs` (45 s) of silence closes the socket, which takes the
 * normal close path (offline + reconnect). If the close handshake does not finish within `closeGraceMs` (dead link) the
 * close path is run by hand and the old socket is ignored.
 * @param {{ url: string, token: string, onState: (state: string, detail: any) => void,
 *   onStatus: (status: string, detail?: any) => void, log: (kind: string, detail?: any) => void,
 *   watchdogMs?: number, checkMs?: number, closeGraceMs?: number }} options
 */
function startHub({ url, token, onState, onStatus, log, watchdogMs = 45000, checkMs = 5000, closeGraceMs = 3000 }) {
  let ws = null, stopped = false, retry = 0, everConnected = false, timer = null, watchdog = null, graceTimer = null
  const connect = () => {
    if (stopped) return
    onStatus('connecting', { attempt: retry })
    let socket
    try {
      // Node/undici WebSocket (Electron main) accepts a non-standard `headers` init — browsers cannot do this,
      // which is why the token lives here and not in the renderer.
      socket = ws = new WebSocket(url, /** @type {any} */ ({ headers: { Authorization: `Bearer ${token}` } }))
    } catch (error) { log('hub.error', String(error)); return schedule() }
    let welcomed = false, lastRx = Date.now(), sawHb = false, closed = false
    const handleClose = (code, reason) => {
      if (closed) return
      closed = true; clearInterval(watchdog); clearTimeout(graceTimer)
      log('hub.close', { code, reason, welcomed })
      onStatus(everConnected ? 'offline' : 'unreachable', { code })
      schedule()
    }
    socket.addEventListener('message', (event) => {
      if (closed) return
      lastRx = Date.now()
      let message; try { message = JSON.parse(String(event.data)) } catch { return }
      if (message.type === 'hb') sawHb = true
      else if (message.type === 'welcome') { welcomed = true; retry = 0; everConnected = true; onStatus('connected', { epoch: message.epoch }) }
      else if (message.type === 'state' && welcomed) onState(message.state, message)
    })
    socket.addEventListener('close', (event) => handleClose(event.code, event.reason))
    socket.addEventListener('error', () => {})
    clearInterval(watchdog)
    watchdog = setInterval(() => {
      if (closed || !sawHb || Date.now() - lastRx <= watchdogMs) return
      clearInterval(watchdog)
      log('hub.watchdog', { silentMs: Date.now() - lastRx })
      try { socket.close(4000, 'watchdog') } catch {}
      graceTimer = setTimeout(() => handleClose(4000, 'watchdog'), closeGraceMs)
    }, checkMs)
  }
  const schedule = () => { if (stopped) return; clearTimeout(timer); const ms = Math.min(5000, 1000 * 2 ** retry++); timer = setTimeout(connect, ms) }
  connect()
  return { stop: () => { stopped = true; clearTimeout(timer); clearInterval(watchdog); clearTimeout(graceTimer); try { ws && ws.close() } catch {} } }
}

/**
 * Decide the signal source from argv values and the saved config.json `hub`.
 *  --hub <ws url> (new name) or --hub-replay <ws url> (alias): use it and save it; `--hub none`: clear the saved one and
 *  fall back to fake; no flag: use the saved `hub`; --fake-signals forces the fake cycle; no URL anywhere => fake.
 * `save`: string = write config.hub, null = delete config.hub, undefined = leave config alone.
 * @param {{ hub?: string, hubReplay?: string, fake?: boolean, saved?: string }} input
 * @returns {{ mode: 'fake' | 'hub', url: string, save: string | null | undefined, from: string, warning?: string }}
 */
function resolveHubSource({ hub = '', hubReplay = '', fake = false, saved = '' } = {}) {
  const given = String(hub || hubReplay || '').trim()
  const savedUrl = typeof saved === 'string' ? saved.trim() : ''
  /** @type {string} */ let url = '', from = 'none'
  /** @type {string | null | undefined} */ let save
  let warning
  if (given.toLowerCase() === 'none') { save = null; from = 'cleared' }
  else if (given) {
    if (/^wss?:\/\/\S+$/i.test(given)) { url = given; save = given; from = hub ? '--hub' : '--hub-replay' }
    else warning = `ignored --hub value (not a ws:// or wss:// URL): ${given.slice(0, 80)}`
  }
  if (!url && !given && /^wss?:\/\/\S+$/i.test(savedUrl)) { url = savedUrl; from = 'config.json' }
  if (!url && !given && savedUrl && !/^wss?:\/\/\S+$/i.test(savedUrl)) warning = 'saved hub in config.json is not a ws:// or wss:// URL; using fake signals'
  const mode = fake || !url ? 'fake' : 'hub'
  return { mode, url, save, from, ...(warning ? { warning } : {}) }
}

/**
 * negative auth probe: connect once with a wrong token; expect no welcome within 5 s
 * @param {string} url @returns {Promise<{ rejected: boolean, how: string }>}
 */
function probeBadToken(url) {
  return new Promise((resolve) => {
    let done = false
    const finish = (rejected, how) => { if (done) return; done = true; clearTimeout(timer); try { ws.close() } catch {} ; resolve({ rejected, how }) }
    const ws = new WebSocket(url, /** @type {any} */ ({ headers: { Authorization: 'Bearer wrong-token-probe-0000000000' } }))
    ws.addEventListener('message', (event) => { try { if (JSON.parse(String(event.data)).type === 'welcome') finish(false, 'welcome received with a wrong token') } catch {} })
    ws.addEventListener('close', (event) => finish(true, `closed code=${event.code}`))
    ws.addEventListener('error', () => finish(true, 'connection error (handshake refused)'))
    const timer = setTimeout(() => finish(true, 'no welcome within 5 s'), 5000)
  })
}

module.exports = { startFake, startHub, probeBadToken, resolveHubSource, FAKE_CYCLE }
