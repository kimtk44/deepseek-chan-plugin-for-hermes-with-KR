// Record-folder follower (bridge record mode: one raw-<incarnation>.jsonl per producer, rotated by os.replace to
// raw-<incarnation>.<NNNN>.jsonl at 10 MB). Read-only: files are only ever opened with O_RDONLY.
//
//  - loadRecovery(): read every file modified recently (or all), merge per-incarnation streams by `ts`.
//  - RecordFollower: poll the folder (new files, 1 s) and the hot files (appended bytes, 100 ms). A file is tracked by
//    dev:ino and read through an open fd, so the unread tail of a rotated file is still consumed after the rename.
import fs from 'node:fs'
import path from 'node:path'

const NAME = /^raw-([0-9a-f]+)(?:\.(\d{4}))?\.jsonl$/
export const parseName = (name) => { const m = NAME.exec(name); return m ? { incarnation: m[1], part: m[2] ? Number(m[2]) : Infinity } : null }
const keyOf = (st) => `${st.dev}:${st.ino}`

/** Split a Buffer into complete lines. Returns { lines: string[], rest: Buffer }. */
function splitLines(buf) {
  const lines = []
  let start = 0
  for (;;) {
    const nl = buf.indexOf(0x0a, start)
    if (nl < 0) break
    if (nl > start) lines.push(buf.toString('utf8', start, nl))
    start = nl + 1
  }
  return { lines, rest: start ? buf.subarray(start) : buf }
}

function parseLines(lines, onBad) {
  const out = []
  for (const line of lines) {
    try { const env = JSON.parse(line); if (env && typeof env === 'object') out.push(env); else onBad() } catch { onBad() }
  }
  return out
}

function readAll(fd, from, to) {
  const size = to - from
  if (size <= 0) return Buffer.alloc(0)
  const buf = Buffer.allocUnsafe(size)
  let got = 0
  while (got < size) {
    const n = fs.readSync(fd, buf, got, size - got, from + got)
    if (n <= 0) break
    got += n
  }
  return buf.subarray(0, got)
}

/**
 * Read recent files and merge them into one ordered event list.
 * Per incarnation: parts ascending, live file last, original line order kept (ts can step back by a few ms).
 * Across incarnations: k-way merge on the head event's ts.
 * Returns { events, known: [{ key, path, offset }] } - `known` covers EVERY file so a follower can resume exactly
 * where the recovery stopped (older, unread files resume at their current end).
 */
export function loadRecovery(dir, { sinceMs = 2 * 3600 * 1000, nowMs = Date.now(), onBad = () => {} } = {}) {
  let names = []
  try { names = fs.readdirSync(dir) } catch { return { events: [], known: [], filesRead: 0 } }
  const known = []
  const byInc = new Map()
  let filesRead = 0
  for (const name of names) {
    const meta = parseName(name)
    if (!meta) continue
    const full = path.join(dir, name)
    let fd
    try { fd = fs.openSync(full, 'r') } catch { continue }
    try {
      const st = fs.fstatSync(fd)
      if (!st.isFile()) continue
      const recent = nowMs - st.mtimeMs <= sinceMs
      let offset = st.size
      if (recent) {
        const buf = readAll(fd, 0, st.size)
        const { lines, rest } = splitLines(buf)
        offset = buf.length - rest.length   // stop at the last complete line; the follower picks the partial one up
        const events = parseLines(lines, onBad)
        filesRead++
        if (!byInc.has(meta.incarnation)) byInc.set(meta.incarnation, [])
        byInc.get(meta.incarnation).push({ part: meta.part, events })
      }
      known.push({ key: keyOf(st), path: full, offset })
    } finally { fs.closeSync(fd) }
  }
  const streams = []
  for (const parts of byInc.values()) {
    parts.sort((a, b) => a.part - b.part)
    streams.push(parts.flatMap((p) => p.events))
  }
  const heads = streams.map(() => 0)
  const events = []
  for (;;) {
    let pick = -1, pickTs = Infinity
    for (let i = 0; i < streams.length; i++) {
      const e = streams[i][heads[i]]
      if (e === undefined) continue
      const ts = Number.isFinite(e.ts) ? e.ts : 0
      if (ts < pickTs) { pickTs = ts; pick = i }
    }
    if (pick < 0) break
    events.push(streams[pick][heads[pick]++])
  }
  return { events, known, filesRead }
}

export class RecordFollower {
  /**
   * @param {{ dir: string, onEvent: (env: object) => void, known?: {key,path,offset}[], pollMs?: number, scanMs?: number,
   *   hotMs?: number, onBad?: () => void, log?: (kind: string, detail?: object) => void, nowMs?: () => number }} opts
   */
  constructor({ dir, onEvent, known = [], pollMs = 100, scanMs = 1000, hotMs = 3600 * 1000, onBad = () => {}, log = () => {}, nowMs = Date.now }) {
    Object.assign(this, { dir, onEvent, pollMs, scanMs, hotMs, onBad, log, nowMs })
    this.files = new Map()   // key -> { key, path, fd, offset, buf, hot, mtimeMs }
    for (const k of known) this.files.set(k.key, { key: k.key, path: k.path, fd: null, offset: k.offset, buf: Buffer.alloc(0), hot: false, mtimeMs: 0 })
    this.stats = { lines: 0, bytes: 0, rotations: 0, files: 0, hot: 0, errors: 0 }
    this.pollTimer = null; this.scanTimer = null
  }

  start() {
    this.scan()
    this.pollTimer = setInterval(() => this.poll(), this.pollMs)
    this.scanTimer = setInterval(() => this.scan(), this.scanMs)
    this.pollTimer.unref?.(); this.scanTimer.unref?.()
  }

  stop() {
    clearInterval(this.pollTimer); clearInterval(this.scanTimer)
    for (const f of this.files.values()) this.closeFd(f)
  }

  closeFd(f) { if (f.fd !== null) { try { fs.closeSync(f.fd) } catch {} f.fd = null } }

  /** list the folder: discover new files, re-heat changed ones, cool old ones */
  scan() {
    let names
    try { names = fs.readdirSync(this.dir) } catch { return }
    const now = this.nowMs()
    for (const name of names) {
      if (!NAME.test(name)) continue
      const full = path.join(this.dir, name)
      let st
      try { st = fs.statSync(full) } catch { continue }
      if (!st.isFile()) continue
      const key = keyOf(st)
      let f = this.files.get(key)
      if (!f) {
        // new file: read from 0 (the bridge writes whole lines, so nothing earlier can be missed)
        f = { key, path: full, fd: null, offset: 0, buf: Buffer.alloc(0), hot: false, mtimeMs: st.mtimeMs }
        this.files.set(key, f)
        this.open(f)
        continue
      }
      f.path = full   // renamed by a rotation: same inode, new name
      f.mtimeMs = st.mtimeMs
      // a file modified within the hot window is followed at once (so the first line after a hub start is not delayed by
      // the 1 s listing); an older one is re-followed as soon as it grows
      if (!f.hot && (st.size > f.offset + f.buf.length || now - st.mtimeMs <= this.hotMs)) this.open(f)
    }
    this.stats.files = this.files.size
  }

  open(f) {
    if (f.fd !== null) return
    try { f.fd = fs.openSync(f.path, 'r'); f.hot = true } catch (error) { this.stats.errors++; f.hot = false; return }
    this.readFd(f)
  }

  /** read appended bytes of one file */
  readFd(f) {
    if (f.fd === null) return
    let size
    try { size = fs.fstatSync(f.fd).size } catch { this.stats.errors++; return }
    const have = f.offset + f.buf.length
    if (size < have) { f.offset = 0; f.buf = Buffer.alloc(0) }   // truncated in place (never seen from the bridge)
    const from = f.offset + f.buf.length
    if (size <= from) return
    const chunk = readAll(f.fd, from, size)
    this.stats.bytes += chunk.length
    const { lines, rest } = splitLines(f.buf.length ? Buffer.concat([f.buf, chunk]) : chunk)
    f.offset = from + chunk.length - rest.length
    f.buf = Buffer.from(rest)
    for (const env of parseLines(lines, this.onBad)) { this.stats.lines++; this.onEvent(env) }
  }

  poll() {
    const now = this.nowMs()
    let hot = 0, rotated = false
    for (const f of this.files.values()) {
      if (!f.hot) continue
      hot++
      this.readFd(f)
      let pathIno = null
      try { pathIno = keyOf(fs.statSync(f.path)) } catch {}
      if (pathIno !== f.key) {
        // the live file was renamed away (rotation): its tail was just drained through the fd; stop following it
        this.readFd(f)
        this.closeFd(f); f.hot = false; f.buf = Buffer.alloc(0)
        this.stats.rotations++; rotated = true
        this.log('rotation', { file: path.basename(f.path) })
        continue
      }
      let mtime = f.mtimeMs
      try { mtime = fs.fstatSync(f.fd).mtimeMs; f.mtimeMs = mtime } catch {}
      if (now - mtime > this.hotMs) { this.closeFd(f); f.hot = false }
    }
    this.stats.hot = hot
    if (rotated) this.scan()   // pick up the fresh live file without waiting for the 1 s listing
  }
}
