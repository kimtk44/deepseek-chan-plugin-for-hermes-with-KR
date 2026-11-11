// @ts-check
// dsc-hermes host: drives the DeepSeek-chan pet window from Hermes Agent state.
// Starts the pet Electron app and communicates over a local pipe (named pipe on Windows, unix socket elsewhere).
// Protocol: JSON lines. Pet authenticates with a shared secret. Host sends 'open', 'cmd' (outfit, director state),
// and receives 'ready', 'attach', 'config', 'log'. State changes from the hub (or fake timer) drive the director.

import { createRequire } from 'node:module'
import { randomBytes, randomUUID, timingSafeEqual } from 'node:crypto'
import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { mkdtempSync, rmSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { tmpdir, homedir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const { startHub, startFake } = require('./signals.cjs')
const { createDirector, loadLines } = require('./director.cjs')

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * Parse command line arguments
 * @param {string[]} argv
 */
function parseArgs(argv) {
  const args = {
    hub: 'ws://127.0.0.1:9141',
    tokenFile: '',
    fakeSignals: false,
    stepMs: 5000,
    electron: '',
    pet: join(__dirname, '../../pet'),
    assets: join(__dirname, '../../assets'),
    config: join(homedir(), '.config', 'dsc-hermes', 'config.json'),
    trace: false,
    x: NaN,
    y: NaN,
  }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg.startsWith('--')) {
      const eqIndex = arg.indexOf('=')
      if (eqIndex !== -1) {
        const key = arg.slice(2, eqIndex)
        const value = arg.slice(eqIndex + 1)
        setArg(key, value)
      } else {
        const key = arg.slice(2)
        if (key === 'fake-signals' || key === 'trace') {
          setArg(key, 'true')
        } else if (i + 1 < argv.length && !argv[i + 1].startsWith('--')) {
          setArg(key, argv[++i])
        } else {
          setArg(key, 'true')
        }
      }
    }
  }

  function setArg(key, value) {
    switch (key) {
      case 'hub': args.hub = value; break
      case 'token-file': args.tokenFile = value; break
      case 'fake-signals': args.fakeSignals = true; break
      case 'step-ms': args.stepMs = parseInt(value, 10); break
      case 'electron': args.electron = value; break
      case 'pet': args.pet = value; break
      case 'assets': args.assets = value; break
      case 'config': args.config = value; break
      case 'trace': args.trace = true; break
      case 'x': args.x = parseInt(value, 10); break
      case 'y': args.y = parseInt(value, 10); break
    }
  }

  return args
}

/**
 * Resolve the Electron executable path
 * @param {string} cliPath
 * @returns {string}
 */
function resolveElectron(cliPath) {
  if (cliPath) return cliPath
  const envPath = process.env.DSC_HERMES_ELECTRON
  if (envPath) return envPath
  try {
    const electronModule = require('electron')
    if (typeof electronModule === 'string') return electronModule
    if (electronModule.default && typeof electronModule.default === 'string') return electronModule.default
  } catch {}
  console.error('dsc-hermes: cannot find Electron. Provide --electron <path> or set DSC_HERMES_ELECTRON environment variable.')
  process.exit(1)
}

/**
 * Create the pipe endpoint
 * @returns {{ endpoint: string, cleanup: () => void }}
 */
function createEndpoint() {
  if (process.platform === 'win32') {
    const endpoint = `\\\\.\\pipe\\dsc-pet-${process.pid}-${randomUUID()}`
    return { endpoint, cleanup: () => {} }
  } else {
    let root = tmpdir()
    if (root.length > 70) root = '/tmp'
    const dir = mkdtempSync(join(root, 'dsc-pet-'))
    const endpoint = join(dir, 's')
    return { endpoint, cleanup: () => { try { rmSync(dir, { recursive: true, force: true }) } catch {} } }
  }
}

/**
 * Load config file
 * @param {string} file
 * @returns {{ x?: number, y?: number, outfit?: Record<string, any> }}
 */
function loadConfig(file) {
  try {
    if (existsSync(file)) {
      const raw = readFileSync(file, 'utf8')
      return JSON.parse(raw)
    }
  } catch {}
  return {}
}

/**
 * Save config file with debounce
 * @param {string} file
 * @param {object} config
 */
function saveConfig(file, config) {
  const dir = dirname(file)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  writeFileSync(file, JSON.stringify(config, null, 2))
}

function main() {
  const args = parseArgs(process.argv.slice(2))
  const electronPath = resolveElectron(args.electron)

  // Load config
  const config = loadConfig(args.config)
  if (Number.isFinite(args.x) || Number.isFinite(args.y)) {
    if (Number.isFinite(args.x)) config.x = args.x
    if (Number.isFinite(args.y)) config.y = args.y
    saveConfig(args.config, config)
  }
  const x = Number.isFinite(config.x) ? config.x : 120
  const y = Number.isFinite(config.y) ? config.y : 120
  const outfit = config.outfit || {}

  // Create endpoint
  const { endpoint, cleanup: cleanupEndpoint } = createEndpoint()
  const secret = randomBytes(32).toString('hex')

  // State
  let seq = 0
  let opened = false
  let petProcess = null
  let server = null
  let authenticatedSocket = null
  let configDebounceTimer = null

  // Director
  const lines = loadLines(join(args.assets, 'dsc-lines.json'))
  const director = createDirector({ lines })

  /**
   * Send message to pet
   * @param {object} message
   */
  function send(message) {
    if (args.trace) console.log(`-> ${JSON.stringify(message)}`)
    if (authenticatedSocket && !authenticatedSocket.destroyed) {
      authenticatedSocket.write(JSON.stringify(message) + '\n')
    }
  }

  /**
   * Open the pet window
   */
  function open() {
    seq += 1
    send({ type: 'open', from: { k: 1, x, y }, to: { x, y }, follow: false, seq })
    send({ type: 'cmd', list: [['outfit', [outfit]]] })
    const snapshot = director.snapshot()
    if (snapshot.length) send({ type: 'cmd', list: snapshot })
    if (!opened) {
      const hello = director.hello()
      if (hello.length) send({ type: 'cmd', list: hello })
      opened = true
    }
  }

  /**
   * Handle state change from signals
   * @param {string} state
   * @param {any} detail
   */
  function onState(state, detail) {
    try {
      const result = director.transition(state, detail)
      if (result.list.length && opened) {
        send({ type: 'cmd', list: result.list })
      }
    } catch (error) {
      console.error(`dsc-hermes: unknown state "${state}": ${error.message}`)
    }
  }

  // Start signals
  let signals
  if (args.fakeSignals) {
    signals = startFake({ stepMs: args.stepMs, onState })
  } else {
    if (!args.tokenFile) {
      console.error('dsc-hermes: --token-file is required unless --fake-signals is used.')
      process.exit(1)
    }
    let token
    try {
      token = readFileSync(args.tokenFile, 'utf8').trim()
    } catch {
      console.error(`dsc-hermes: cannot read token file: ${args.tokenFile}`)
      process.exit(1)
    }
    signals = startHub({
      url: args.hub,
      token,
      onState,
      onStatus: (s) => console.log('hub:', s && s.status ? s.status : s),
      log: (text) => console.log(text),
    })
  }

  // Create server
  server = createServer((socket) => {
    if (authenticatedSocket) {
      socket.destroy()
      return
    }

    let buffer = ''
    let authenticated = false
    let authTimer = setTimeout(() => {
      if (!authenticated) socket.destroy()
    }, 5000)

    socket.on('data', (chunk) => {
      buffer += chunk.toString('utf8')
      let newlineIndex
      while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, newlineIndex)
        buffer = buffer.slice(newlineIndex + 1)
        if (line.length > 1024 * 1024) {
          socket.destroy()
          return
        }
        if (!line.trim()) continue
        let message
        try {
          message = JSON.parse(line)
        } catch {
          continue
        }

        if (args.trace) console.log(`<- ${JSON.stringify(message && message.type === 'auth' ? { type: 'auth' } : message)}`)

        if (!authenticated) {
          if (message.type === 'auth') {
            const provided = message.secret
            if (typeof provided === 'string' && provided.length === secret.length) {
              const a = Buffer.from(provided)
              const b = Buffer.from(secret)
              if (timingSafeEqual(a, b)) {
                authenticated = true
                clearTimeout(authTimer)
                authenticatedSocket = socket
                server.close()
                send({ type: 'avatar' })
                return
              }
            }
            socket.destroy()
            return
          }
          socket.destroy()
          return
        }

        // Authenticated messages
        switch (message.type) {
          case 'ready':
            open()
            break
          case 'attach':
            open()
            break
          case 'config':
            if (Array.isArray(message.list)) {
              for (const [key, value] of message.list) {
                if (['glasses', 'monocle', 'skirt', 'chestClothes', 'shoesOff', 'tailHide', 'earHide', 'bodyType'].includes(key)) {
                  outfit[key] = value
                }
              }
              if (configDebounceTimer) clearTimeout(configDebounceTimer)
              configDebounceTimer = setTimeout(() => {
                config.outfit = outfit
                saveConfig(args.config, config)
              }, 300)
              send({ type: 'cmd', list: [['outfit', [outfit]]] })
            }
            break
          case 'log':
            console.log(`pet ${message.level}: ${message.text}`)
            break
          default:
            break
        }
      }
    })

    socket.on('data', () => { if (buffer.length > 1024 * 1024) socket.destroy() })   // a line that never ends
    socket.on('error', () => {})
    socket.on('close', () => {
      clearTimeout(authTimer)
      if (authenticatedSocket === socket) {
        authenticatedSocket = null
      }
    })
  })

  server.listen(endpoint, () => {
    // Start pet
    const env = { ...process.env }
    env.DSC_PET_SECRET = secret
    delete env.ELECTRON_RUN_AS_NODE
    delete env.NODE_OPTIONS

    const electronArgs = []
    if (process.env.DSC_HERMES_ELECTRON_ARGS) {
      electronArgs.push(...process.env.DSC_HERMES_ELECTRON_ARGS.split(/\s+/))
    }

    petProcess = spawn(electronPath, [
      ...electronArgs,
      args.pet,
      `--dsc-pipe=${endpoint}`,
      `--dsc-assets=${args.assets}`,
    ], { env, stdio: ['ignore', 'pipe', 'pipe'] })

    console.log(`dsc-hermes host: pet started, hub ${args.fakeSignals ? 'fake' : args.hub}`)
    petProcess.stdout.resume()   // nothing is read from it; an unread pipe would stall the pet once it fills
    petProcess.stderr.on('data', (chunk) => {
      for (const line of chunk.toString('utf8').split('\n')) if (line.trim()) console.log(`pet: ${line.trim()}`)
    })

    petProcess.on('exit', (code) => {
      console.log(`dsc-hermes: pet exited with code ${code}`)
      signals.stop()
      if (server) server.close()
      cleanupEndpoint()
      process.exit(code === 0 ? 0 : 1)
    })

    petProcess.on('error', (error) => {
      console.error(`dsc-hermes: pet error: ${error.message}`)
      signals.stop()
      if (server) server.close()
      cleanupEndpoint()
      process.exit(1)
    })
  })

  // Handle signals
  const shutdown = () => {
    if (petProcess) petProcess.kill()
    signals.stop()
    if (server) server.close()
    cleanupEndpoint()
    process.exit(0)
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

main()
