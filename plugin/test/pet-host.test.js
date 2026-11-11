import test from 'node:test'
import { readSource } from './source.mjs'
import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { execFile } from 'node:child_process'
import { createServer } from 'node:http'
import { once } from 'node:events'
import { PassThrough } from 'node:stream'
import { lstat, mkdtemp, mkdir, readdir, readFile, rm, stat, symlink, utimes, writeFile } from 'node:fs/promises'
import { connect } from 'node:net'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { promisify } from 'node:util'
import { createEndpoint, createPetHandler, createPetManager, electronExecutable, lowerPriority, macBundle, prepareRuntime, restorePriority, PET_PATH } from '../pet-host.js'

test('pet runtime reuses the DSH Electron files and replaces only the app folder', async () => {
  const root = await mkdtemp(join(tmpdir(), 'dsh-kr-pet-'))
  try {
    const dsh = join(root, 'DeepSeek Harness'), app = join(root, 'pet'), base = join(root, 'runtime')
    await mkdir(join(dsh, 'locales'), { recursive: true }); await mkdir(join(dsh, 'resources'), { recursive: true }); await mkdir(app)
    await writeFile(join(dsh, 'DeepSeek Harness.exe'), 'exe'); await writeFile(join(dsh, 'ffmpeg.dll'), 'dll')
    await writeFile(join(dsh, 'locales', 'ko.pak'), 'ko'); await writeFile(join(dsh, 'resources', 'app.asar'), 'dsh app')
    await writeFile(join(dsh, 'Uninstall DeepSeek Harness.exe'), 'un')
    await writeFile(join(app, 'main.cjs'), 'v1')
    const bin = await prepareRuntime(join(dsh, 'DeepSeek Harness.exe'), base, app)
    assert.equal(bin, join(base, 'electron', 'dsc-pet.exe'))
    assert.equal(await readFile(bin, 'utf8'), 'exe')
    assert.equal(await readFile(join(base, 'electron', 'locales', 'ko.pak'), 'utf8'), 'ko')
    assert.equal(await readFile(join(base, 'electron', 'resources', 'app', 'main.cjs'), 'utf8'), 'v1')
    // DSH 앱(app.asar)·제거 프로그램·원래 이름의 실행 파일은 가져오지 않음
    await assert.rejects(stat(join(base, 'electron', 'resources', 'app.asar')))
    await assert.rejects(stat(join(base, 'electron', 'Uninstall DeepSeek Harness.exe')))
    await assert.rejects(stat(join(base, 'electron', 'DeepSeek Harness.exe')))
    // 같은 실행 파일이면 런타임은 그대로 두고 펫 앱만 새로 넣음
    await writeFile(join(app, 'main.cjs'), 'v2')
    await prepareRuntime(join(dsh, 'DeepSeek Harness.exe'), base, app)
    assert.equal(await readFile(join(base, 'electron', 'resources', 'app', 'main.cjs'), 'utf8'), 'v2')
  } finally { await rm(root, { recursive: true, force: true }) }
})

test('pet executable comes from the DSH desktop host environment', () => {
  assert.equal(electronExecutable({ DSH_DESKTOP_NODE_EXECUTABLE: 'C:/dsh.exe' }, {}, 'node'), 'C:/dsh.exe')
  assert.equal(electronExecutable({}, { electron: '44' }, 'C:/e.exe'), 'C:/e.exe')
  assert.equal(electronExecutable({}, {}, 'node'), null)
})

test('pet manager is unsupported without Windows desktop Electron and never spawns', async () => {
  let spawned = false
  const pet = createPetManager({ assets: 'x', exe: null, platform: 'win32', spawnImpl: () => { spawned = true } })
  await pet.warm(); await pet.open({}); pet.send([['say', ['hi']]]); pet.hide()
  assert.deepEqual(pet.status(), { supported: false, state: 'none', seq: undefined, events: [] })
  assert.equal(spawned, false)
  assert.equal(createPetManager({ assets: 'x', exe: 'C:/dsh.exe', platform: 'darwin' }).status().supported, false)
})

test('pet routes reject unauthenticated requests and expose status and commands', async () => {
  const calls = []
  const pet = { status: (drain = true) => ({ supported: true, state: 'hidden', events: drain ? [{ type: 'shown' }] : [] }),
    warm: async () => calls.push('warm'), open: async (b) => calls.push(['open', b]), send: (l) => calls.push(['send', l]), hide: () => calls.push('hide') }
  let allow = false
  const server = createServer(createPetHandler(pet, () => (allow ? undefined : 401)))
  server.listen(0, '127.0.0.1'); await once(server, 'listening')
  const url = 'http://127.0.0.1:' + server.address().port + PET_PATH
  try {
    assert.equal((await fetch(url + '/poll')).status, 401)
    assert.equal((await fetch(url + '/open', { method: 'POST', body: '{}' })).status, 401)
    assert.deepEqual(calls, [])
    allow = true
    assert.deepEqual(await (await fetch(url + '/poll')).json(), { supported: true, state: 'hidden', events: [{ type: 'shown' }] })
    assert.equal((await fetch(url + '/poll', { method: 'DELETE' })).status, 405)
    assert.equal((await fetch(url + '/nope', { method: 'POST', body: '{}' })).status, 404)
    const opened = await fetch(url + '/open', { method: 'POST', body: JSON.stringify({ from: { x: 1, y: 2, k: 1 }, to: { x: 3, y: 4, k: 1 } }) })
    assert.deepEqual((await opened.json()).events, [])   // POST는 쌓인 알림을 비우지 않음
    await fetch(url + '/send', { method: 'POST', body: JSON.stringify({ list: [['say', ['안녕']]] }) })
    await fetch(url + '/warm', { method: 'POST' }); await fetch(url + '/hide', { method: 'POST' })
    assert.deepEqual(calls, [['open', { from: { x: 1, y: 2, k: 1 }, to: { x: 3, y: 4, k: 1 } }], ['send', [['say', ['안녕']]]], 'warm', 'hide'])
  } finally { server.closeAllConnections(); await new Promise((r) => server.close(r)) }
})

test('pet route without a connection guard refuses everything', async () => {
  const server = createServer(createPetHandler({ status: () => ({}) }))
  server.listen(0, '127.0.0.1'); await once(server, 'listening')
  try { assert.equal((await fetch('http://127.0.0.1:' + server.address().port + PET_PATH + '/poll')).status, 503) }
  finally { server.closeAllConnections(); await new Promise((r) => server.close(r)) }
})

test('pet process exit is reported and the manager can start again', async () => {
  const root = await mkdtemp(join(tmpdir(), 'dsh-kr-pet-'))
  try {
    const dsh = join(root, 'dsh'), app = join(root, 'pet')
    await mkdir(dsh); await mkdir(app)
    await writeFile(join(dsh, 'DeepSeek Harness.exe'), 'exe'); await writeFile(join(app, 'main.cjs'), '')
    const children = []
    const spawnImpl = (bin, args, opts) => { const c = new EventEmitter(); c.kill = () => c.emit('exit'); c.args = args; c.opts = opts; children.push(c); return c }
    const pet = createPetManager({ assets: 'A', exe: join(dsh, 'DeepSeek Harness.exe'), platform: 'win32', base: join(root, 'rt'), app, spawnImpl })
    await pet.warm()
    assert.equal(children.length, 1)
    assert.ok(children[0].args.some((a) => a === '--dsc-assets=A'))
    assert.equal(children[0].opts.windowsHide, false)
    assert.equal(pet.status().state, 'starting')
    await pet.open({ seq: 3, from: { k: 1, x: 0, y: 0 }, to: { k: 1, x: 0, y: 0 } })
    children[0].emit('exit')
    // 종료 알림에는 마지막 회차 번호가 붙음 (창 안 쪽이 이전 회차 알림을 가려낼 수 있게)
    assert.deepEqual(pet.status(), { supported: true, state: 'none', seq: 3, events: [{ type: 'closed', seq: 3 }] })
    await pet.warm()
    assert.equal(children.length, 2)
    children[0].emit('exit')   // 이미 바뀐 이전 프로세스의 늦은 종료는 지금 프로세스 상태를 지우지 않음
    assert.equal(pet.status().state, 'starting')
    pet.dispose()
  } finally { await rm(root, { recursive: true, force: true }) }
})

test('pet manager does not spawn when disposed while preparing the runtime', async () => {
  const root = await mkdtemp(join(tmpdir(), 'dsh-kr-pet-'))
  try {
    const dsh = join(root, 'dsh'), app = join(root, 'pet')
    await mkdir(dsh); await mkdir(app)
    await writeFile(join(dsh, 'DeepSeek Harness.exe'), 'exe'); await writeFile(join(app, 'main.cjs'), '')
    let spawned = 0
    const pet = createPetManager({ assets: 'A', exe: join(dsh, 'DeepSeek Harness.exe'), platform: 'win32', base: join(root, 'rt'), app, spawnImpl: () => { spawned++; return new EventEmitter() } })
    const warming = pet.warm()
    pet.dispose()
    await assert.rejects(warming)
    assert.equal(spawned, 0)
  } finally { await rm(root, { recursive: true, force: true }) }
})

// ---------- macOS ----------
const posixOnly = { skip: process.platform === 'win32' && 'unix 소켓은 POSIX 에서만 시험' }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const exists = (path) => stat(path).then(() => true, () => false)

/** 가짜 DSH.app: 실행 파일 스텁, 서명된 Frameworks, 큰 리소스(app.asar·runtime) */
async function fakeDshApp(root) {
  const app = join(root, 'DeepSeek Harness.app'), contents = join(app, 'Contents')
  await mkdir(join(contents, 'MacOS'), { recursive: true }); await mkdir(join(contents, 'Resources', 'runtime'), { recursive: true })
  await mkdir(join(contents, 'Frameworks', 'Electron Framework.framework', 'Versions', 'A'), { recursive: true })
  await writeFile(join(contents, 'MacOS', 'DeepSeek Harness'), 'stub')
  await writeFile(join(contents, 'Frameworks', 'Electron Framework.framework', 'Versions', 'A', 'Electron Framework'), 'framework')
  await symlink('Versions/A/Electron Framework', join(contents, 'Frameworks', 'Electron Framework.framework', 'Electron Framework'))
  await writeFile(join(contents, 'Info.plist'), 'plist'); await writeFile(join(contents, 'PkgInfo'), 'APPL????')
  await writeFile(join(contents, 'Resources', 'icon.icns'), 'icon'); await writeFile(join(contents, 'Resources', 'app.asar'), 'dsh app')
  await writeFile(join(contents, 'Resources', 'runtime', 'big.bin'), 'runtime')
  return join(contents, 'MacOS', 'DeepSeek Harness')
}

/** 실제 /bin/cp 는 쓰되(클론 옵션만 뺌) plutil·xattr·codesign 은 호출만 기록하는 실행기 */
function recorder({ failClone = false, failRemove = false } = {}) {
  const calls = [], runner = async (cmd, args) => {
    calls.push([cmd, ...args])
    if (cmd === '/bin/cp') {
      if (failClone && args[0] === '-cR') throw new Error('clone unsupported')
      await promisify(execFile)('/bin/cp', ['-R', ...args.slice(1)])
    }
    if (failRemove && args[0] === '-remove') throw new Error('No value at that key path')
  }
  return { calls, runner }
}

test('macBundle recognizes only executables inside an .app bundle', () => {
  assert.equal(macBundle('/Applications/DeepSeek Harness.app/Contents/MacOS/DeepSeek Harness'), '/Applications/DeepSeek Harness.app')
  assert.equal(macBundle('C:/Users/me/AppData/Local/Programs/DeepSeek Harness/DeepSeek Harness.exe'), null)
  assert.equal(macBundle('/usr/local/bin/node'), null)
  assert.equal(macBundle(null), null)
})

test('pet manager supports darwin only for an .app bundle executable', () => {
  const bundleExe = '/Applications/DeepSeek Harness.app/Contents/MacOS/DeepSeek Harness'
  assert.equal(createPetManager({ assets: 'x', exe: bundleExe, platform: 'darwin' }).status().supported, true)
  assert.equal(createPetManager({ assets: 'x', exe: '/usr/local/bin/node', platform: 'darwin' }).status().supported, false)
  assert.equal(createPetManager({ assets: 'x', exe: null, platform: 'darwin' }).status().supported, false)
  assert.equal(createPetManager({ assets: 'x', exe: bundleExe, platform: 'linux' }).status().supported, false)
  assert.equal(createPetManager({ assets: 'x', exe: 'C:/dsh.exe', platform: 'win32' }).status().supported, true)
})

test('mac pet runtime clones a small ad-hoc signed bundle and keeps the pet app outside the signature', posixOnly, async () => {
  const root = await mkdtemp(join(tmpdir(), 'dsh-kr-pet-'))
  try {
    const exe = await fakeDshApp(root), app = join(root, 'pet'), base = join(root, 'runtime'), out = join(base, 'electron', 'DeepSeekChanPet.app')
    await mkdir(app); await writeFile(join(app, 'main.cjs'), 'v1')
    const { calls, runner } = recorder({ failRemove: true })
    const bin = await prepareRuntime(exe, base, app, runner)
    assert.equal(bin, join(out, 'Contents', 'MacOS', 'DeepSeek Harness'))
    assert.equal(await readFile(bin, 'utf8'), 'stub')
    assert.equal(await readFile(join(out, 'Contents', 'Frameworks', 'Electron Framework.framework', 'Versions', 'A', 'Electron Framework'), 'utf8'), 'framework')
    assert.equal((await lstat(join(out, 'Contents', 'Frameworks', 'Electron Framework.framework', 'Electron Framework'))).isSymbolicLink(), true)
    assert.equal(await readFile(join(out, 'Contents', 'Resources', 'icon.icns'), 'utf8'), 'icon')
    // 큰 리소스(app.asar·runtime)와 원래 앱은 가져오지 않음, 스텁은 고정 package.json (펫 앱을 .app 밖에서 불러옴)
    assert.equal(await exists(join(out, 'Contents', 'Resources', 'app.asar')), false)
    assert.equal(await exists(join(out, 'Contents', 'Resources', 'runtime')), false)
    const stub = JSON.parse(await readFile(join(out, 'Contents', 'Resources', 'app', 'package.json'), 'utf8'))
    assert.equal(join(out, 'Contents', 'Resources', 'app', stub.main), join(base, 'electron', 'pet-app', 'main.cjs'))
    assert.equal(await readFile(join(base, 'electron', 'pet-app', 'main.cjs'), 'utf8'), 'v1')
    // Info.plist 수정(없는 키 제거 오류는 무시) 뒤 사본만 서명. 서명이 마지막
    const plist = join(out, 'Contents', 'Info.plist')
    assert.deepEqual(calls.filter(([cmd]) => cmd !== '/bin/cp'), [
      ['/usr/bin/plutil', '-replace', 'CFBundleIdentifier', '-string', 'com.deepseek.dsh.dsc-pet', plist],
      ['/usr/bin/plutil', '-replace', 'LSUIElement', '-bool', 'true', plist],
      ['/usr/bin/plutil', '-remove', 'ElectronAsarIntegrity', plist],
      ['/usr/bin/plutil', '-remove', 'CFBundleURLTypes', plist],
      ['/usr/bin/xattr', '-dr', 'com.apple.quarantine', out],
      ['/usr/bin/codesign', '--force', '-s', '-', out],
    ])
    assert.ok(calls.filter(([cmd]) => cmd === '/bin/cp').every(([, flag]) => flag === '-cR'))
    // 원본 앱은 건드리지 않음 (plist 내용 그대로)
    assert.equal(await readFile(join(dirname(dirname(exe)), 'Info.plist'), 'utf8'), 'plist')
    // 같은 실행 파일이면 .app 은 그대로(다시 서명 안 함), 펫 앱만 새로 넣음
    await writeFile(join(app, 'main.cjs'), 'v2')
    const again = recorder()
    await prepareRuntime(exe, base, app, again.runner)
    assert.deepEqual(again.calls, [])
    assert.equal(await readFile(join(base, 'electron', 'pet-app', 'main.cjs'), 'utf8'), 'v2')
    // DSH 가 업데이트되어 실행 파일이 바뀌면 처음부터 다시 만듦
    await utimes(exe, new Date(), new Date(Date.now() + 5000))
    const rebuilt = recorder()
    await prepareRuntime(exe, base, app, rebuilt.runner)
    assert.ok(rebuilt.calls.some(([cmd]) => cmd === '/usr/bin/codesign'))
  } finally { await rm(root, { recursive: true, force: true }) }
})

test('mac pet runtime falls back to a plain copy when APFS clone is unavailable', posixOnly, async () => {
  const root = await mkdtemp(join(tmpdir(), 'dsh-kr-pet-'))
  try {
    const exe = await fakeDshApp(root), app = join(root, 'pet')
    await mkdir(app); await writeFile(join(app, 'main.cjs'), '')
    const { calls, runner } = recorder({ failClone: true })
    const bin = await prepareRuntime(exe, join(root, 'runtime'), app, runner)
    assert.equal(await readFile(bin, 'utf8'), 'stub')
    assert.ok(calls.some(([cmd, flag]) => cmd === '/bin/cp' && flag === '-R'))
  } finally { await rm(root, { recursive: true, force: true }) }
})

test('mac pet runtime stops at a failed signature and does not leave a stamp', posixOnly, async () => {
  const root = await mkdtemp(join(tmpdir(), 'dsh-kr-pet-'))
  try {
    const exe = await fakeDshApp(root), app = join(root, 'pet'), base = join(root, 'runtime')
    await mkdir(app)
    const runner = async (cmd, args) => { if (cmd === '/usr/bin/codesign') throw new Error('codesign failed'); if (cmd === '/bin/cp') await promisify(execFile)('/bin/cp', ['-R', ...args.slice(1)]) }
    await assert.rejects(prepareRuntime(exe, base, app, runner), /codesign failed/)
    assert.equal(await exists(join(base, 'electron', 'dsc-pet.stamp')), false)
  } finally { await rm(root, { recursive: true, force: true }) }
})

test('pet endpoint is a named pipe on Windows and a short private unix socket path elsewhere', async () => {
  const pipe = await createEndpoint('win32')
  assert.match(pipe.path, /^\\\\\.\\pipe\\dsc-pet-\d+-[0-9a-f-]{36}$/)
  await pipe.cleanup()
  if (process.platform === 'win32') return
  const unix = await createEndpoint('darwin')
  try {
    assert.ok(Buffer.byteLength(unix.path) < 104)
    assert.equal((await stat(dirname(unix.path))).mode & 0o777, 0o700)
  } finally { await unix.cleanup() }
  assert.equal(await exists(dirname(unix.path)), false)
  const long = await createEndpoint('darwin', '/tmp/' + 'x'.repeat(90).replace(/x/g, 'a'))
  assert.ok(long.path.startsWith('/tmp/dsc-pet-') && Buffer.byteLength(long.path) < 104)   // tmp 경로가 길면 /tmp 로 대신
  await long.cleanup()
})

test('mac pet process gets a unix socket, accepts one connection and cleans up on exit', posixOnly, async () => {
  const launches = []
  const spawnImpl = (bin, args, opts) => { const c = new EventEmitter(); c.kill = () => c.emit('exit'); launches.push({ bin, args, opts, c }); return c }
  const exe = '/Applications/DeepSeek Harness.app/Contents/MacOS/DeepSeek Harness'
  let avatarSetting = '/models/a'
  const pet = createPetManager({ assets: 'A', exe, platform: 'darwin', base: 'B', app: 'P', spawnImpl, prepare: async (e, b, a) => { assert.deepEqual([e, b, a], [exe, 'B', 'P']); return '/pet/bin' }, avatarDir: () => avatarSetting })
  const old = { ...process.env }; process.env.ELECTRON_RUN_AS_NODE = '1'; process.env.__CFBundleIdentifier = 'com.deepseek.dsh'
  try { await pet.warm() } finally { process.env = old }
  const [{ bin, args, opts, c }] = launches
  assert.equal(bin, '/pet/bin')   // 펫은 직접 띄우고 우선순위는 띄운 뒤 -p 로 낮춤 (시작부터 건 백그라운드는 풀리지 않음)
  const sockPath = args.find((a) => a.startsWith('--dsc-pipe=')).slice('--dsc-pipe='.length)
  assert.ok(args.includes('--dsc-assets=A'))
  assert.deepEqual(opts.stdio, ['ignore', 'pipe', 'pipe']); assert.equal('windowsHide' in opts, false)
  for (const key of ['ELECTRON_RUN_AS_NODE', 'NODE_OPTIONS', '__CFBundleIdentifier']) assert.equal(key in opts.env, false)
  // 펫이 연결해 ready 를 보내면 hidden, 호스트가 보내는 메시지는 한 줄씩 JSON 으로 도착 (3D 모델 설정이 open보다 먼저)
  const socket = connect(sockPath); await once(socket, 'connect')
  const received = []; socket.setEncoding('utf8'); socket.on('data', (d) => received.push(d))
  socket.write(JSON.stringify({ type: 'auth', secret: opts.env.DSC_PET_SECRET }) + '\n')
  socket.write(JSON.stringify({ type: 'ready' }) + '\n'); await sleep(100)
  assert.equal(pet.status().state, 'hidden')
  await pet.open({ seq: 2, from: { k: 1, x: 1, y: 2 }, to: { k: 1, x: 3, y: 4 } }); await sleep(100)
  const lines = () => received.join('').trim().split('\n').map((line) => JSON.parse(line))
  assert.deepEqual(lines(), [{ type: 'avatar', dir: '', outline: 'smooth' }, { type: 'open', from: { k: 1, x: 1, y: 2 }, to: { k: 1, x: 3, y: 4 }, follow: false, seq: 2 }], '창 안이 3D가 아니면 폴더 없이(Live2D)')
  // 따라오기: 커서가 몸을 잡은 자리(grab)도 그대로 전달해야 펫 창에서 잡은 위치가 유지됨
  received.length = 0
  await pet.open({ seq: 3, from: { k: 1, x: 1, y: 2 }, to: { k: 1, x: 1, y: 2 }, follow: true, grab: { x: 136, y: 146 } }); await sleep(100)
  assert.deepEqual(lines().map((m) => m.type), ['open'], '3D 설정이 그대로면 다시 보내지 않음')
  assert.deepEqual(lines()[0].grab, { x: 136, y: 146 })
  // 창 안이 3D면 지금 폴더 설정을 open보다 먼저 보내고, 폴더 설정이 바뀌면 다음 open 때 다시 보냄
  received.length = 0
  await pet.open({ seq: 4, avatar: { enabled: true, outline: 'model' } }); await sleep(100)
  assert.deepEqual(lines().map((m) => m.type), ['avatar', 'open'])
  assert.deepEqual(lines()[0], { type: 'avatar', dir: '/models/a', outline: 'model' })
  received.length = 0; avatarSetting = '/models/b'
  await pet.open({ seq: 5, avatar: { enabled: true, outline: 'model' } }); await sleep(100)
  assert.deepEqual(lines()[0], { type: 'avatar', dir: '/models/b', outline: 'model' })
  // 붙은 뒤에는 소켓이 닫혀 다른 프로세스는 연결할 수 없음
  const late = connect(sockPath); await once(late, 'error')
  socket.destroy(); c.emit('exit'); await sleep(50)
  assert.equal(await exists(dirname(sockPath)), false)
  assert.deepEqual(pet.status().events.map((e) => e.type), ['closed'])
})

test('mac pet runtime is removed when disposed while preparing', posixOnly, async () => {
  let release
  const before = new Set(await socketDirs())
  const prepare = () => new Promise((resolve) => { release = resolve })
  const pet = createPetManager({ assets: 'A', exe: '/Applications/X.app/Contents/MacOS/X', platform: 'darwin', prepare, spawnImpl: () => { throw new Error('should not spawn') } })
  const warming = pet.warm()
  while (!release) await sleep(10)
  const [sockDir] = (await socketDirs()).filter((dir) => !before.has(dir))
  assert.equal(await exists(sockDir), true)
  pet.dispose(); release('/pet/bin')
  await assert.rejects(warming)
  await sleep(50)
  assert.equal(await exists(sockDir), false)
})

async function socketDirs() {
  return (await readdir(tmpdir())).filter((n) => n.startsWith('dsc-pet-')).map((n) => join(tmpdir(), n))
}

test('펫 페이지와 assets는 한 출처(dscpet://assets)라 Core 계산 Worker를 만들 수 있다', async () => {
  const html = await readFile(new URL('../../pet/index.html', import.meta.url), 'utf8')
  const main = await readFile(new URL('../../pet/main.cjs', import.meta.url), 'utf8')
  assert.ok(!html.includes('dscpet://'), '페이지가 다른 출처(dscpet://app)를 가리키면 Worker 생성이 SecurityError로 막힌다')
  assert.match(main, /loadURL\(`dscpet:\/\/assets\$\{OWN\}\/index\.html`\)/)
})

test('펫 창이 숨으면 페이지에 그리기 중지를 알리고, 페이지는 그리기를 멈춘 채 대기한다', async () => {
  const main = await readFile(new URL('../../pet/main.cjs', import.meta.url), 'utf8')
  const dsc = readSource(new URL('../../character/index.ts', import.meta.url))
  assert.match(main, /toPage\(\{ type: 'power', on: false \}\)/)
  assert.match(dsc, /power: onPetPower,/)   // 펫 창 메시지 처리표
  assert.match(dsc, /처음엔 숨은 채 대기/)
})

test('숨은 펫 창은 배치 루프와 PIXI 시스템 티커가 프레임마다 깨우지 않고, open 이 오면 다시 돈다', async () => {
  const dsc = readSource(new URL('../../character/index.ts', import.meta.url))
  // 상호작용 매니저의 Ticker.system 구독은 루프가 쉬는 동안만 끄고, 깨울 때 되돌린다 (autoInteract: false 라 쓰지 않음)
  // 시스템 티커 구독은 Live2D 렌더러(character/rig-live2d.ts)가 갖고, 창 안 코드는 rig.systemTicker로 씀
  assert.match(readSource(new URL('../../character/rig-live2d.ts', import.meta.url)), /const systemTicker = \(on\) => \{ try \{ app\.renderer\.plugins\.interaction\.useSystemTicker = on; \} catch \{\} \};/)
  assert.match(dsc, /const wakeRaf = \(\) => \{ if \(rafIdle\) \{ rafIdle = false; systemTicker\(true\); requestAnimationFrame\(raf\); \} \};/)
  assert.match(readSource(new URL('../../character/rig-live2d.ts', import.meta.url)), /autoInteract: false/)
  // 숨은 펫(petPower=false)은 루프를 다음 프레임에 이어 가지 않는다
  assert.match(dsc, /if \(PET \? !petPower : link\.open\) \{ rafIdle = true; systemTicker\(false\); return; \}\n\s*requestAnimationFrame\(raf\);/)
  // power on·open 은 루프를 다시 깨운다
  assert.match(dsc, /petPower = !!message\.on;\s*setRender\(petPower\);\s*if \(petPower\) wakeRaf\(\);/)
  assert.match(dsc, /const onPetOpen = \(message\) => \{\n\s*petPower = true;\s*setRender\(true\);\s*wakeRaf\(\);/)
})

test('펫 창이 대신 보여 주는 동안 창 안 캐릭터는 배치 루프를 쉬고, 붙을 자리는 150ms 틱이 직접 계산한다', async () => {
  const dsc = readSource(new URL('../../character/index.ts', import.meta.url))
  // 매 프레임 homePose(레이아웃 읽기)를 하던 저장 경로 제거: 링크 검사가 homePose 보다 먼저
  assert.ok(!dsc.includes('link.home'), '매 프레임 저장하던 link.home 이 남아 있으면 안 된다')
  assert.match(dsc, /if \(link\.open \|\| link\.follow\?\.shown\) \{ setRender\(false\);[^\n]*\n\s*return false;/)   // placeBlocked()의 마지막 검사
  assert.match(dsc, /if \(placeBlocked\(\)\) return;\n\s*const now = performance\.now\(\);\n\s*const home = homePose\(\);/)
  assert.match(dsc, /const dockSpot = dockTarget\(homePose\(\)\)/)
  // link.open 을 끄는 두 곳(연결의 leave, 캔버스 다시 표시)에서 루프를 깨운다
  const petLink = await readFile(new URL('../../character/pet-link.ts', import.meta.url), 'utf8')
  assert.match(petLink, /link\.open = false; link\.opening = 0; link\.queue = \[\];\n\s*deps\.onLeave\(\);/)
  assert.match(dsc, /onLeave: \(\) => petLinkLeave\(\)/)
  assert.match(dsc, /const petLinkLeave = \(\) => \{\n\s*wakeRaf\(\);/)
  assert.match(dsc, /link\.open = false; link\.follow = null; link\.opening = 0; try \{ link\.post\("hide"\); \} catch \{\} \}\n\s*wakeRaf\(\);\n\s*place\(\);/)
  // link.open = false 를 대입하는 곳은 이 두 곳뿐이어야 한다 (새 경로가 생기면 wakeRaf 도 필요)
  assert.equal(dsc.match(/link\.open = false/g).length + petLink.match(/link\.open = false/g).length, 2)
})

test('펫 프로세스의 커서 확인 타이머는 창이 보이는 동안만 돈다', async () => {
  const main = await readFile(new URL('../../pet/main.cjs', import.meta.url), 'utf8')
  assert.ok(!/^setInterval\(checkCursor/m.test(main), '숨은 동안에도 30ms마다 깨우는 전역 타이머가 없어야 한다')
  assert.match(main, /win\.on\('show', \(\) => watchCursor\(true\)\)/)
  assert.match(main, /win\.on\('hide', \(\) => watchCursor\(false\)\)/)
  assert.match(main, /const watchCursor = \(on\) => \{ clearInterval\(cursorTimer\); cursorTimer = on \? setInterval\(checkCursor, 30\) : null \}/)
})

test('펫 창 따라오기: 커서는 펫 프로세스가 직접 읽어 페이지로 보내고, 창 안 캐릭터는 위치를 HTTP로 보내지 않는다', async () => {
  const main = await readFile(new URL('../../pet/main.cjs', import.meta.url), 'utf8')
  const dsc = readSource(new URL('../../character/index.ts', import.meta.url))
  assert.match(main, /case 'track': track\(!!message\.on, message\.grab, message\.off\)/)
  assert.match(main, /placer\.place\(cursor\.x - grabPoint\.x - bodyOffset\.x, cursor\.y - grabPoint\.y - bodyOffset\.y\)[\s\S]*toPage\(\{ type: 'cursor'/)   // 창은 커서를 읽는 즉시 여기서 옮김 (페이지 왕복 없음)
  assert.ok(!/win\.setPosition\(/.test(main), '창 이동은 모두 placer로: setPosition 한 번으로 끝내면 배율이 다른 모니터에서 어긋난 채 남는다')
  assert.match(main, /case 'move': placer\.place\(message\.x, message\.y(?:, message\.walk === true)?\)/)
  assert.ok(!/win\.setSize\(/.test(main), '창 크기도 placer로: setSize 로 바꾸면 다음 이동이 고정 크기로 되돌린다')
  assert.match(main, /case 'fit': \{[\s\S]*?placer\.resize\(w, h\)/)
  assert.match(dsc, /petTracking/)   // 따라오는 동안 페이지는 창을 옮기지 않음
  assert.match(main, /screen\.getCursorScreenPoint\(\)[\s\S]*toPage\(\{ type: 'cursor'/)
  assert.match(dsc, /grab: \{ x: drag\.pending\?\.ox \?\? 0/)
  assert.ok(!dsc.includes('["follow", item]'), '따라오는 동안 위치를 HTTP로 보내면 왕복 지연만큼 끊긴다')
})

test('lowerPriority: 띄운 프로세스를 -b -p 로 낮추고, 실패해도 던지지 않는다', async () => {
  const calls = []
  await lowerPriority(42, async (cmd, args) => { calls.push([cmd, ...args]) })
  assert.deepEqual(calls, [['/usr/sbin/taskpolicy', '-b', '-p', '42']])
  await lowerPriority(42, async () => { throw new Error('nope') })
})

test('restorePriority: 주 프로세스와 자식의 백그라운드를 풀고, 실패해도 던지지 않는다', async () => {
  const calls = []
  const runner = async (cmd, args) => { calls.push([cmd, ...args]); if (cmd === '/usr/bin/pgrep') return { stdout: '11\n12\n' }; if (args[2] === '12') throw new Error('gone'); return { stdout: '' } }
  await restorePriority(10, runner)
  assert.deepEqual(calls.filter((c) => c[0] === '/usr/sbin/taskpolicy').map((c) => c[3]).sort(), ['10', '11', '12'])
  await restorePriority(10, async () => { throw new Error('nope') })
})

test('웜업: 시작 인사·작업 중에는 미루고 한가할 때 숨긴 펫을 미리 띄운다', async () => {
  // 미루기·재시도·warm 요청은 plugin/test/pet-link.test.js가 실행해 확인하고, 여기서는 '한가함'의 기준만 확인한다
  const dsc = readSource(new URL('../../character/index.ts', import.meta.url))
  assert.match(dsc, /idle: \(\) => intro\.phase === "done" && !running && !document\.hidden/)
  const petLink = await readFile(new URL('../../character/pet-link.ts', import.meta.url), 'utf8')
  assert.match(petLink, /setTimeout\(warmUp, 5000\)/)
})

test('ready가 오지 않으면 시간 제한 뒤 펫을 끝내고 오류를 알리며, 다음 시도에서 다시 띄운다', async () => {
  const root = await mkdtemp(join(tmpdir(), 'dsc-pet-timeout-'))
  try {
    const children = []
    const spawnImpl = () => { const c = new EventEmitter(); c.killed = false; c.kill = () => { c.killed = true }; children.push(c); return c }
    const pet = createPetManager({ assets: 'A', exe: 'C:/dsh/DeepSeek Harness.exe', platform: 'win32', base: root, prepare: async () => 'bin', spawnImpl, readyTimeout: 80 })
    await pet.warm()
    assert.equal(pet.status(false).state, 'starting')
    await sleep(150)
    assert.equal(children[0].killed, true)
    const status = pet.status()
    assert.equal(status.state, 'none')
    assert.deepEqual(status.events.map((e) => e.type), ['error'])
    await pet.warm()
    assert.equal(children.length, 2)   // 다음 끌기·웜업에서 다시 띄움
    pet.dispose()
  } finally { await rm(root, { recursive: true, force: true }) }
})

test('펫 창 우클릭 메뉴: 설정·크기 프리셋·돌아가기·숨기기·소품·체형을 담고 상태를 페이지에서 받는다', async () => {
  const main = await readFile(new URL('../../pet/main.cjs', import.meta.url), 'utf8')
  for (const label of ['설정…', '크기', 'Harness로 돌아가기', '캐릭터 잠시 숨기기', '소품·옷', '체형']) assert.ok(main.includes(label), label)
  assert.match(main, /toPage\(\{ type: 'panel', open: true \}\)/)
  assert.match(main, /toPage\(\{ type: 'size', ratio: sizeRatio \}\)/)
  assert.match(main, /toHost\(\{ type: 'config', list: \[\['character', false\]\] \}\)/)
  assert.match(main, /case 'state':/)   // 메뉴 체크 표시용 상태는 호스트로 넘기지 않는다
  assert.match(main, /MENU_SIZES = \[0\.75, 1, 1\.25, 1\.5\]/)
})

test('펫 창 크기: 기본(머리 맞춤) 대비 배율로 기억하고, 패널·휠·메뉴가 같은 값을 쓴다', async () => {
  const dsc = readSource(new URL('../../character/index.ts', import.meta.url))
  assert.match(dsc, /const PET_SIZE_KEY = "dsc-pet-size"/)
  assert.match(dsc, /function petClampK\(k\)/)
  assert.match(dsc, /Math\.min\(petKFit\(\), Math\.max\(PET_K_MIN, n\)\)/)
  assert.match(dsc, /petPendingRatio = message\.follow \? ratio : null/)   // 따라오는 중엔 놓을 때 배율을 맞춤
  assert.match(dsc, /petSetRatio\(Number\(slider\.value\) \/ 100, 0\)/)
  assert.match(dsc, /else \{ petRememberRatio\(petRatio\(\)\); petSyncMenu\(\); renderPetPanel\(\); \}/)
  assert.match(dsc, /function petPanelBox\(body\)/)   // 패널 영역도 클릭을 받도록 hitbox에 더함
  assert.match(dsc, /petPanel\.contains\(e\.target\)/)
  assert.match(dsc, /onConfig: \(key, value\) => onSetting\?\.\(key, value\)/)   // 펫 창 메뉴 값 → 플러그인 설정 (처리 규칙은 pet-link.test.js)
  assert.match(dsc, /PET\s*\.send\(\{ type: "fit", w: fitW, h: fitH \}\)/)   // 타입 단언(!)이 지워진 자리의 공백 허용   // 패널/캐릭터에 맞춰 창 크기
})

test('펫 창 설정 패널: 값을 설정 저장소로 넘기고 이 플러그인이 아는 키만 반영한다', async () => {
  const client = await readFile(new URL('../../plugin/client.ts', import.meta.url), 'utf8')
  // 펫 창 메뉴 값은 createCharacter의 onSetting으로 받아 저장한다 (window 전역 없음)
  assert.match(client, /startCharacter\(feature, link, applyPetConfig\)/)
  assert.match(client, /createCharacter\(\{ base: ROOT, life, prefs: link\.initialPrefs\(\), onSetting \}\)/)
  assert.match(client, /PET_CONFIG_KEYS = new Set\(\[\.\.\.OUTFIT_FIELDS\.map/)
  assert.match(client, /'bodyType', 'character'/)
})

test('펫 진단: 표준 오류 꼬리(8KB)·종료 코드·신호를 종료 알림에 싣고, 표준 출력은 계속 비운다', async () => {
  const children = []
  const spawnImpl = (bin, args, opts) => {
    const c = new EventEmitter(); c.kill = () => {}; c.opts = opts
    c.stdout = new PassThrough(); c.stderr = new PassThrough(); children.push(c); return c
  }
  const pet = createPetManager({ assets: 'A', exe: 'C:/dsh/DeepSeek Harness.exe', platform: 'win32', base: 'B', prepare: async () => 'bin', spawnImpl })
  await pet.warm()
  const [first] = children
  assert.deepEqual(first.opts.stdio, ['ignore', 'pipe', 'pipe'])
  assert.equal(first.stdout.readableFlowing, true, '읽는 쪽이 없으면 파이프가 차서 펫이 멈춘다')
  first.stderr.write('x'.repeat(9000)); first.stderr.write('END')
  await sleep(10)
  first.emit('exit', 1, null)
  assert.deepEqual(pet.status().events, [], '표준 오류를 끝까지 읽은 뒤 알린다')
  first.stderr.end(); await sleep(20)
  const [closed] = pet.status().events
  assert.equal(closed.type, 'closed'); assert.equal(closed.code, 1); assert.equal('signal' in closed, false)
  assert.equal(closed.stderr.length, 8192); assert.ok(closed.stderr.endsWith('xEND'))
  await pet.warm()
  children[1].stderr.end(); await sleep(20)
  children[1].emit('exit', null, 'SIGKILL')
  assert.deepEqual(pet.status().events, [{ type: 'closed', seq: undefined, signal: 'SIGKILL' }])
  pet.dispose()
})

test('펫 진단: 인증 실패는 기록(log) 알림으로 쌓고, 펫이 보낸 log 메시지도 그대로 전달한다', async () => {
  const win = process.platform === 'win32'
  let opts, args
  const spawnImpl = (bin, list, options) => { args = list; opts = options; const c = new EventEmitter(); c.kill = () => {}; return c }
  const pet = createPetManager({ assets: 'A', exe: win ? 'C:/dsh/DeepSeek Harness.exe' : '/Applications/X.app/Contents/MacOS/X', platform: win ? 'win32' : 'darwin',
    base: 'B', prepare: async () => 'bin', spawnImpl, readyTimeout: 60000 })
  await pet.warm()
  const pipe = args.find((a) => a.startsWith('--dsc-pipe=')).slice('--dsc-pipe='.length)
  const intruder = connect(pipe); intruder.on('error', () => {}); await once(intruder, 'connect')
  intruder.write(JSON.stringify({ type: 'auth', secret: 'wrong' }) + '\n'); await once(intruder, 'close')
  const socket = connect(pipe); await once(socket, 'connect')
  socket.write(JSON.stringify({ type: 'auth', secret: opts.env.DSC_PET_SECRET }) + '\n')
  socket.write(JSON.stringify({ type: 'log', level: 'error', text: 'pet renderer gone: crashed (exit code 5)', seq: 2 }) + '\n'); await sleep(100)
  const logs = pet.status().events.filter((e) => e.type === 'log')
  assert.deepEqual(logs, [{ type: 'log', level: 'warn', text: 'pet authentication failed' }, { type: 'log', level: 'error', text: 'pet renderer gone: crashed (exit code 5)', seq: 2 }])
  socket.destroy(); pet.dispose()
})

test('펫 창 진단 연결: 경고·오류 콘솔·렌더러 종료·불러오기 실패를 호스트로 보내고, DevTools는 별도 창으로 연다', async () => {
  const main = await readFile(new URL('../../pet/main.cjs', import.meta.url), 'utf8')
  for (const event of ['console-message', 'render-process-gone', 'did-fail-load', 'devtools-opened']) assert.match(main, new RegExp(`win\\.webContents\\.on\\('${event}'`))
  assert.match(main, /toHost\(\{ type: 'log', level, text: line \}\)/)
  assert.match(main, /if \(reopeningDevTools\) \{ reopeningDevTools = false; return \}/)   // 스스로 다시 연 경우는 건너뜀 (반복 없음)
  assert.match(main, /contents\.closeDevTools\(\)[\s\S]*?contents\.openDevTools\(\{ mode: 'detach' \}\)/)
  assert.match(main, /win\.setIgnoreMouseEvents\(true, \{ forward: true \}\)/)   // 클릭 통과는 그대로
})
