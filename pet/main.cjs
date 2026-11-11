// 바깥 펫 창 (DSH의 Electron 실행 파일로 도는 작은 앱)
// - 투명·테두리 없음·항상 위 창 하나에 assets/dsc.js 를 펫 모드로 띄운다. 캐릭터 위에서만 클릭을 받고 나머지는 뒤 화면으로 통과.
// - 플러그인 호스트와 JSON 한 줄씩 주고받는다 (Windows 이름 있는 파이프 · macOS unix 소켓, 둘 다 net.connect(경로)). 연결이 끊기면(DSH 종료) 함께 끝난다.
const { app, BrowserWindow, Menu, ipcMain, net, protocol, screen } = require('electron')
const path = require('node:path')
const { connect } = require('node:net')
const { pathToFileURL } = require('node:url')
const { createPlacer } = require('./placement.cjs')
const { chooseProfile, profileInUse } = require('./profile.cjs')
// 소품·옷·체형 항목: 빌드가 shared/settings.js에서 만든 pet/settings.cjs (펫 앱 폴더째 런타임으로 복사된다)
const { OUTFIT_ITEMS, BODY_TYPES } = require('./settings.cjs')
// 3D 모델 폴더: 호스트가 보낸 폴더를 dscpet://assets/__avatar/ 로 내준다 (페이지는 시작할 때 dsc-config로 3D 여부를 받음)
const { AVATAR_PREFIX, normalizeAvatar, avatarKey, avatarBoot, resolveInside } = require('./avatar.cjs')

/** 명령줄 인자 `--이름=값`의 값 (없으면 빈 문자열) */
const arg = (name) => { const hit = process.argv.find((option) => option.startsWith(`--${name}=`)); return hit ? hit.slice(name.length + 3) : '' }
const PIPE = arg('dsc-pipe'), ASSETS = arg('dsc-assets'), APP = __dirname
const OWN = '/__app'   // dscpet://assets 아래에서 이 앱 폴더를 가리키는 경로
const WIN_W = 820, WIN_H = 1160   // 전신(최대 990px = 300×3.3배)과 머리 위 말풍선 자리가 들어가는 크기
// 우클릭 메뉴. 체크 표시는 페이지가 보내 주는 현재 상태({ size, outfit })로 그린다.
// size = 기본(머리 크기 맞춤) 크기 대비 배율
const MENU_SIZES = [0.75, 1, 1.25, 1.5]
const MENU_OUTFIT = OUTFIT_ITEMS.map((item) => [item.key, item.ko])
const MENU_BODY = BODY_TYPES.map((body) => [body.key, body.ko])
let menuState = { size: 1, outfit: {} }

const MAC = process.platform === 'darwin'
const SECRET = process.env.DSC_PET_SECRET
delete process.env.DSC_PET_SECRET
// 호스트는 표준 오류 꼬리를 종료 알림에 실어 DSH 창 콘솔에 보여 준다
if (!PIPE || !ASSETS || !SECRET) { process.stderr.write('dsc-pet: missing --dsc-pipe, --dsc-assets or DSC_PET_SECRET\n'); app.exit(1) }
app.setName('DeepSeekChan Pet')
if (MAC) {
  app.setActivationPolicy('accessory')                 // Dock·앱 전환기에 안 나타남 (번들 Info.plist 의 LSUIElement 와 겹쳐 둠)
  app.commandLine.appendSwitch('use-mock-keychain')    // 사본(ad-hoc 서명)이 DSH 의 키체인 항목을 건드려 암호 창이 뜨는 일 방지
}
// 프로필(캐시·로컬 저장소): macOS 는 DSH 와 따로 둔 pet-profile, 그 밖은 기본(appData/DeepSeekChan Pet).
// 다른 DSH 가 띄운 펫이 이미 쓰는 중이면 번호 붙은 폴더로. 쓰는 중 판별 = 다른 프로세스의 LevelDB 잠금(Windows, 예전 펫 포함)·
// 단일 인스턴스 잠금 링크(macOS·Linux, 잠그기 전에 확인) 또는 단일 인스턴스 잠금 실패 (잠금은 userData 폴더마다 하나라 동시에 뜨는 새 펫끼리도 갈림)
// macOS 는 잠금을 한 번 못 잡으면 다른 폴더를 잡아도 ready 가 오지 않아(실측) 멈춘 채 남으므로, 그때는 바로 끝내고 호스트가 다음 시도에 다시 띄우게 한다
if (!app.commandLine.hasSwitch('user-data-dir')) {
  const base = MAC ? path.join(app.getPath('appData'), 'deepseek-harness-kr', 'pet-profile') : app.getPath('userData')
  /** 프로필 폴더 잡기: 다른 프로세스가 쓰는 폴더는 건너뛰고, 아니면 그 폴더의 단일 인스턴스 잠금 @param {string} directory */
  const claimProfile = (directory) => {
    if (profileInUse(directory)) return false
    app.setPath('userData', directory)
    if (app.requestSingleInstanceLock()) return true
    if (MAC) { process.stderr.write(`dsc-pet: profile lock failed: ${directory}\n`); app.exit(1) }
    return false
  }
  app.setPath('userData', chooseProfile(base, claimProfile))
}
protocol.registerSchemesAsPrivileged([{ scheme: 'dscpet', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true } }])

let win = null, socket = null, buffer = ''
// 창 이동은 모두 여기로: 위치·크기를 함께 지시하고 멈춘 뒤 실제 자리를 확인해 맞춤 (배율이 다른 모니터를 넘나들 때 어긋남 방지)
const placer = createPlacer(() => win, { width: WIN_W, height: WIN_H,
  /** 산책 중 이동을 지시한 직후 실제 창 bounds를 페이지에 알림 (페이지가 clip 기준으로 씀) */
  onPlace: (placed) => toPage({ type: 'bounds', bounds: placed.getBounds() }) })
// 지금 회차 번호(창 안 캐릭터가 펫 창을 열 때마다 올림). 보이기·숨기·붙기 알림에 붙여, 이전 회차 알림과 섞이지 않게 함
let seq
/** 호스트로 메시지 보내기 (회차 번호가 있으면 seq 를 붙임, 연결이 끊겼으면 버림) */
const toHost = (message) => { if (socket && !socket.destroyed) socket.write(JSON.stringify(seq === undefined ? message : { ...message, seq }) + '\n') }
// 진단 기록: 펫 창의 경고·오류는 호스트를 거쳐 DSH 창 콘솔에 나온다. 같은 내용은 한 번만, 서로 다른 내용은 100개까지
const LOG_LIMIT = 500, sentLogs = new Set()
/**
 * 호스트로 진단 기록 보내기 (500자까지 자름)
 * @param {'warn' | 'error'} level @param {unknown} text
 */
function logToHost(level, text) {
  const line = String(text).slice(0, LOG_LIMIT)
  if (sentLogs.has(line) || sentLogs.size >= 100) return
  sentLogs.add(line)
  toHost({ type: 'log', level, text: line })
}
/** 펫 창 콘솔 줄 중 경고·오류만 호스트로 (event.level·message 형식. 위치 인자는 Electron이 폐기 예정이라 받지 않음) */
function forwardConsole(event) {
  if (event.level === 'warning' || event.level === 'error') logToHost(event.level === 'error' ? 'error' : 'warn', event.message)
}
// 펫 창은 클릭이 뒤로 통과해 창에 붙은 DevTools를 쓸 수 없으므로 별도 창으로 다시 연다. 스스로 다시 연 경우는 건너뛰어 반복 없음
let reopeningDevTools = false
/** 펫 창에 열린 DevTools를 닫고 별도 창(detach)으로 다시 열기 */
function detachDevTools() {
  if (reopeningDevTools) { reopeningDevTools = false; return }
  const contents = win.webContents
  contents.closeDevTools()
  setTimeout(() => { if (win.isDestroyed()) return; reopeningDevTools = true; contents.openDevTools({ mode: 'detach' }) }, 0)
}
// 페이지가 'ready'를 보내기 전에 온 메시지는 모아 두었다가 넘김 (첫 실행 때 open이 사라지지 않게)
let pageReady = false
const pending = []
/** 페이지로 메시지 보내기 (ready 전이면 pending 에 모아 둠) */
const toPage = (message) => { if (!win || win.isDestroyed()) return; if (pageReady) win.webContents.send('dsc', message); else pending.push(message) }
/** file 이 root 폴더 안(root 자신은 제외)인지 여부 */
const inside = (root, file) => { const rel = path.relative(root, file); return !!rel && !rel.startsWith('..') && !path.isAbsolute(rel) }
// 현재 펫이 놓인 화면의 DIP 좌표를 페이지에 알려 줌. DOM screen.avail*는 배율이 다른 모니터에서 창 좌표와
// 어긋날 수 있어, 외부 펫 산책은 출발할 때 이 값(Electron screen의 workArea)을 고정해 쓴다.
/** 페이지로 보낼 표시장치 정보 (id·배율·bounds·workArea, DIP) */
const displayView = (display) => {
  const bounds = display.bounds, workArea = display.workArea
  return { id: String(display.id), scaleFactor: display.scaleFactor,
    bounds: { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height },
    workArea: { x: workArea.x, y: workArea.y, width: workArea.width, height: workArea.height } }
}
/** 지금 펫이 놓인 표시장치: point(화면 DIP)가 있으면 그 점에서 가장 가까운 화면, 없으면 창 bounds와 가장 많이 겹치는 화면 (창이 없으면 null) */
const currentDisplay = (point) => {
  if (!win || win.isDestroyed()) return null
  return point && Number.isFinite(point.x) && Number.isFinite(point.y)
    ? screen.getDisplayNearestPoint({ x: Math.round(point.x), y: Math.round(point.y) })
    : screen.getDisplayMatching(win.getBounds())
}
/**
 * 페이지에 현재 표시장치와 전체 표시장치 목록 알리기
 * @param changed 표시장치 구성 변경(추가·제거·해상도·배율) 알림이면 true @param point 기준 점 (화면 DIP) @param request 페이지 요청 번호 (응답 짝 맞춤)
 */
const sendDisplay = (changed = false, point, request) => {
  const display = currentDisplay(point)
  if (display) toPage({ type: 'display', display: displayView(display), changed: changed || undefined, request,
    displays: screen.getAllDisplays().map(displayView) })
}
/** 펫 창 숨기기: 클릭 받기 끄기·호스트에 hidden 알림(보이던 경우), 따라오기 멈춤, 페이지 그리기 중지, 코드가 바뀌었으면 새로 불러오기 */
const hide = () => { clearTimeout(attachTimer); if (win && !win.isDestroyed() && win.isVisible()) { win.hide(); setAccept(false); toHost({ type: 'hidden' }) } track(false); toPage({ type: 'power', on: false }); reloadIfStale() }
// 붙은 뒤 창 안 캐릭터가 이어받을 때까지 기다리는 시간 (그 안에 호스트가 hide를 보내면 그때 숨음)
const ATTACH_WAIT = 1000
let attachTimer = null
// 클릭 받기: 평소엔 뒤 화면으로 통과시키고, 커서가 캐릭터 몸 영역(box, 창 안 좌표) 안이거나 누르고 끄는 중(force)일 때만 받음.
// 커서 위치는 여기서 직접 읽음 (Windows에서 클릭 통과 중 마우스 이동 전달(forward)이 창을 옮긴 뒤 끊겨 다시 못 집는 일이 있어서)
let box = null, force = false, accepting = false
/** 클릭 받기 켜고 끄기 (바뀔 때만) @param on true면 클릭 받음, false면 뒤 화면으로 통과 */
function setAccept(on) { if (on !== accepting && win && !win.isDestroyed()) { accepting = on; win.setIgnoreMouseEvents(!on, { forward: true }) } }
/** 커서 위치로 클릭 받기 판정: 창이 보이고 누르는 중이거나 커서가 몸 영역 안이면 받음 */
function checkCursor() {
  if (!win || win.isDestroyed() || !win.isVisible()) return setAccept(false)
  if (force) return setAccept(true)
  if (!box) return setAccept(false)
  const cursor = screen.getCursorScreenPoint(), bounds = win.getBounds()
  setAccept(cursor.x >= bounds.x + box.l && cursor.x <= bounds.x + box.r && cursor.y >= bounds.y + box.t && cursor.y <= bounds.y + box.b)
}
// 커서 확인은 창이 보이는 동안만 30ms마다 (숨은 동안엔 클릭을 받을 일이 없음). 창이 만들어진 뒤 show/hide 이벤트로 켜고 끈다
let cursorTimer = null
/** 커서 확인 타이머(30ms 간격) 켜고 끄기 */
const watchCursor = (on) => { clearInterval(cursorTimer); cursorTimer = on ? setInterval(checkCursor, 30) : null }
// 따라오기: 창 안 캐릭터가 끌어낼 때 창 위치는 여기서 커서를 읽는 즉시 옮김 (페이지로 보내 다음 프레임에 계산해 되돌려 받으면
// 프레임마다 위치가 밀리거나 건너뛰어 끊겨 보임). 페이지에는 몸 흔들림 계산용으로 커서만 알려 줌. grab = 커서가 몸을 잡은 자리, off = 창 안 몸 왼쪽 위 좌표
let tracker = null
/**
 * 따라오기 켜고 끄기 (켜면 4ms마다 커서를 읽어 창을 옮김, 이미 켜져 있으면 그대로)
 * @param on true면 시작, false면 멈춤 @param grab 커서가 몸을 잡은 자리 @param off 창 안 몸 왼쪽 위 좌표
 */
function track(on, grab, off) {
  if (!on) { clearInterval(tracker); tracker = null; return }
  if (tracker) return
  const grabPoint = { x: Number(grab?.x) || 0, y: Number(grab?.y) || 0 }, bodyOffset = { x: Number(off?.x) || 0, y: Number(off?.y) || 0 }
  let last = ''
  /** 커서가 움직였을 때만 창 옮기기와 페이지에 커서 위치 알리기 */
  const tick = () => {
    if (!win || win.isDestroyed()) return
    const cursor = screen.getCursorScreenPoint(), key = `${cursor.x},${cursor.y}`
    if (key === last) return
    last = key
    placer.place(cursor.x - grabPoint.x - bodyOffset.x, cursor.y - grabPoint.y - bodyOffset.y)
    toPage({ type: 'cursor', x: cursor.x, y: cursor.y })
  }
  tick()   // 창을 보이기 전에 먼저 커서 자리로 (잠깐 엉뚱한 자리에 떠 보이지 않게)
  tracker = setInterval(tick, 4)
}
// 캐릭터 코드(assets/dsc.js)가 바뀌면(플러그인 업데이트·재설치) 숨어 있을 때 페이지를 새로 불러옴. 떠 있는 동안 바뀌면 다음에 숨을 때.
// (펫 프로세스는 DSH가 꺼질 때까지 남아 있어서, 안 그러면 창 안 캐릭터만 새 코드로 돌고 펫 창은 옛 코드로 돎)
let stale = false
/** 캐릭터 코드가 바뀌었고 창이 숨어 있으면 페이지를 캐시 없이 새로 불러오기 */
function reloadIfStale() { if (stale && win && !win.isDestroyed() && !win.isVisible()) { stale = false; pageReady = false; win.webContents.reloadIgnoringCache() } }
require('node:fs').watchFile(path.join(ASSETS, 'dsc.js'), { interval: 2000 }, (now, before) => { if (now.mtimeMs !== before.mtimeMs) { stale = true; reloadIfStale() } })
// 숨기라는 말을 받은 뒤 늦게 온 '자리 잡음(placed)'으로 다시 보이지 않게, 마지막 지시가 open인지 기억함
let wanted = false
// 3D 모델 설정: known = 호스트가 한 번이라도 알려 줌, bootedKey = 지금 페이지가 시작할 때 받은 설정 (다르면 숨어 있을 때 새로 불러옴)
let avatar = normalizeAvatar(null), avatarKnown = false, bootedKey = null
const avatarWaiters = []
const AVATAR_WAIT = 3000   // 호스트가 설정을 안 보내면(예전 호스트) 이 시간 뒤 Live2D로 시작
/** 호스트가 보낸 3D 모델 설정 반영: 처음이면 기다리던 페이지에 알려 주고, 페이지가 받은 것과 달라졌으면 새로 불러오기 예약 */
function setAvatar(message) {
  avatar = normalizeAvatar(message); avatarKnown = true
  for (const resolve of avatarWaiters.splice(0)) resolve()
  if (bootedKey !== null && avatarKey(avatar) !== bootedKey) { stale = true; reloadIfStale() }
}
/** 페이지 시작 설정 (호스트 설정이 올 때까지 최대 AVATAR_WAIT 기다림) */
async function pageConfig() {
  if (!avatarKnown) await new Promise((resolve) => { avatarWaiters.push(resolve); setTimeout(resolve, AVATAR_WAIT) })
  bootedKey = avatarKey(avatar)
  return { avatar: avatarBoot(avatar) }
}

/** 호스트 메시지 처리: hide 는 여기서 숨김, open 은 회차 기억 뒤 페이지로, 그 밖(cmd)은 페이지로 */
const fromHost = (message) => {
  if (message.type === 'avatar') return setAvatar(message)
  if (message.type === 'hide') { wanted = false; return hide() }
  if (message.type === 'open') { wanted = true; seq = message.seq; clearTimeout(attachTimer) }
  toPage(message)   // open · cmd
}

app.whenReady().then(() => {
  // dscpet://assets/… = 플러그인 assets, dscpet://assets/__app/… = 이 앱 폴더 (페이지와 assets가 한 출처여야 Core 계산 Worker를 만들 수 있음)
  protocol.handle('dscpet', async (request) => {
    const url = new URL(request.url), pathname = decodeURIComponent(url.pathname), own = pathname.startsWith(OWN + '/')
    if (pathname.startsWith(AVATAR_PREFIX)) {   // 3D 모델 폴더 (폴더 실제 경로 안쪽만)
      const file = await resolveInside(avatar.dir, pathname.slice(AVATAR_PREFIX.length))
      return file ? net.fetch(pathToFileURL(file).toString()) : new Response('', { status: 404 })
    }
    const root = own ? APP : ASSETS
    const file = path.join(root, own ? pathname.slice(OWN.length) : pathname)
    if (!inside(root, file)) return new Response('', { status: 404 })
    return net.fetch(pathToFileURL(file).toString())
  })
  win = new BrowserWindow({
    width: WIN_W, height: WIN_H, show: false, frame: false, transparent: true, backgroundColor: '#00000000',
    resizable: false, maximizable: false, minimizable: false, fullscreenable: false, skipTaskbar: true, hasShadow: false, alwaysOnTop: true,
    title: 'DeepSeekChan',
    // macOS: 기본 창은 메뉴 막대 아래로 위치가 눌려 캐릭터와 창이 어긋남(enableLargerThanScreen 으로 해제), 포커스를 가져가지 않고 첫 클릭도 바로 받음
    ...(MAC ? { enableLargerThanScreen: true, focusable: false, acceptFirstMouse: true } : {}),
    webPreferences: { preload: path.join(APP, 'preload.cjs'), contextIsolation: true, sandbox: true, nodeIntegration: false, backgroundThrottling: false },
  })
  if (MAC) {   // 전체 화면 앱·모든 Spaces 위. skipTransformProcessType: LSUIElement 앱이라 프로세스 유형 전환(Dock 깜빡임) 불필요
    win.setAlwaysOnTop(true, 'screen-saver')
    win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true, skipTransformProcessType: true })
  }
  win.setIgnoreMouseEvents(true, { forward: true })   // 처음엔 클릭 통과 (accepting = false)
  // 표시장치 구성이 바뀌면(제거·해상도·배율) 페이지가 산책 중 clip을 즉시 갱신하거나 안전하게 복귀할 수 있게 알림
  for (const name of ['display-added', 'display-removed', 'display-metrics-changed']) screen.on(name, () => sendDisplay(true))
  win.on('show', () => watchCursor(true))   // showInactive 도 show 를 보냄 (Windows 실측)
  win.on('hide', () => watchCursor(false))
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  win.webContents.on('will-navigate', (event) => event.preventDefault())
  win.webContents.on('console-message', forwardConsole)
  win.webContents.on('render-process-gone', (_event, details) => logToHost('error', `pet renderer gone: ${details.reason} (exit code ${details.exitCode})`))
  win.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => logToHost('error', `pet page failed to load: ${errorCode} ${errorDescription} ${validatedURL}`))
  win.webContents.on('devtools-opened', detachDevTools)
  win.loadURL(`dscpet://assets${OWN}/index.html`)
  ipcMain.handle('dsc-config', (event) => (event.sender === win.webContents ? pageConfig() : null))
  ipcMain.on('dsc', (event, message) => {
    if (event.sender !== win.webContents || !message || typeof message.type !== 'string') return
    switch (message.type) {
      // | 0: Math.round 결과가 -0이면 Electron이 정수로 받지 못해 오류 창을 띄움
      // walk=true일 때만 실제 bounds를 페이지에 회신 (4ms drag tick마다 IPC가 늘지 않게)
      case 'move': placer.place(message.x, message.y, message.walk === true); return
      // 산책 출발 화면을 고정하기 위한 현재 표시장치 정보 (point = 캐릭터 몸 중심의 화면 DIP 좌표)
      case 'display': sendDisplay(false, message.point, message.request); return
      case 'track': track(!!message.on, message.grab, message.off); return
      case 'press': force = !!message.on; checkCursor(); return   // 누르고 있는 동안은 커서가 몸 밖이어도 늘 받음
      case 'hitbox': box = message.box && ['l', 't', 'r', 'b'].every((side) => Number.isFinite(message.box[side])) ? message.box : null; checkCursor(); return
      // 캐릭터 크기에 맞춰 창 크기 조절 (화면 작업 영역 안으로만 제한). 배율 상한이 없어져 창도 함께 커져야 한다
      case 'fit': {
        const workArea = screen.getPrimaryDisplay().workAreaSize
        const w = Math.min(Math.round(Number(message.w)), workArea.width), h = Math.min(Math.round(Number(message.h)), workArea.height)
        if (!Number.isFinite(w) || !Number.isFinite(h) || w < 80 || h < 80) return
        placer.resize(w, h)   // 크기도 placer 로: 이후 이동(place)이 이 크기를 유지하고, 배율이 다른 모니터에서도 확인함
        return
      }
      // 이미 보이는 중이어도(따라오기 회차에서 바로 던지기 회차로 넘어간 경우) 지금 회차로 shown을 다시 알림
      case 'placed': if (wanted) { if (!win.isVisible()) win.showInactive(); toHost({ type: 'shown' }) } return
      case 'menu': {
        const size = Number(menuState.size) || 1, outfit = menuState.outfit || {}
        Menu.buildFromTemplate([
          { label: '설정…',
            /** 설정 패널 열기 */
            click: () => toPage({ type: 'panel', open: true }) },
          { label: '크기', submenu: [
            ...MENU_SIZES.map((sizeRatio) => ({ label: `${Math.round(sizeRatio * 100)}%`, type: 'radio', checked: Math.abs(size - sizeRatio) < 0.02,
              /** 고른 배율로 크기 바꾸기 */
              click: () => toPage({ type: 'size', ratio: sizeRatio }) })),
            { type: 'separator' },
            { label: '슬라이더로 조절…',
              /** 크기 슬라이더로 설정 패널 열기 */
              click: () => toPage({ type: 'panel', open: true, focus: 'size' }) },
          ] },
          { type: 'separator' },
          { label: 'Harness로 돌아가기',
            /** 창 안으로 돌아가기 */
            click: () => toPage({ type: 'home' }) },
          { label: '캐릭터 잠시 숨기기',
            /** 호스트에 캐릭터 설정 끄기 요청 */
            click: () => toHost({ type: 'config', list: [['character', false]] }) },
          { type: 'separator' },
          { label: '소품·옷', submenu: MENU_OUTFIT.map(([key, label]) => ({ label, type: 'checkbox', checked: outfit[key] === true,
            /** 호스트에 이 소품·옷 설정 뒤집기 요청 */
            click: () => toHost({ type: 'config', list: [[key, outfit[key] !== true]] }) })) },
          { label: '체형', submenu: MENU_BODY.map(([value, label]) => ({ label, type: 'radio', checked: (outfit.bodyType || 'default') === value,
            /** 호스트에 이 체형으로 바꾸기 요청 */
            click: () => toHost({ type: 'config', list: [['bodyType', value]] }) })) },
        ]).popup({ window: win })
        return
      }
      // 페이지가 보낸 현재 상태 (메뉴 체크 표시용). 호스트로 넘기지 않는다.
      case 'state': if (message.value && typeof message.value === 'object') menuState = { size: Number(message.value.size) || menuState.size, outfit: message.value.outfit && typeof message.value.outfit === 'object' ? message.value.outfit : menuState.outfit }; return
      // 제자리에 붙음: 창 안 캐릭터가 이 알림을 받아(최대 150ms 조회 간격) 다시 그린 프레임에 hide를 보내 올 때까지 그대로 보여 준다.
      // 바로 숨기면 그 사이 어디에도 캐릭터가 없어 깜빡인다(실측 60~180ms). 붙은 자리는 창 안 캐릭터 자리와 같아 겹쳐도 티가 거의 안 남
      // 창 안 쪽이 답하지 않으면(화면을 닫는 중 등) ATTACH_WAIT 뒤 스스로 숨는다
      case 'attach': wanted = false; toHost(message); clearTimeout(attachTimer); attachTimer = setTimeout(hide, ATTACH_WAIT); return
      case 'ready': pageReady = true; for (const queued of pending.splice(0)) win.webContents.send('dsc', queued); toHost(message); return
      default: toHost(message)
    }
  })

  socket = connect(PIPE)
  // 연결 대기 중에도 인증을 첫 메시지로 예약한다.
  socket.write(JSON.stringify({ type: 'auth', secret: SECRET }) + '\n')
  socket.setEncoding('utf8')
  socket.on('data', (chunk) => {
    buffer += chunk
    if (Buffer.byteLength(buffer) > 1024 * 1024) { socket.destroy(); return }
    for (let i; (i = buffer.indexOf('\n')) >= 0;) {
      const line = buffer.slice(0, i); buffer = buffer.slice(i + 1)
      let message; try { message = JSON.parse(line) } catch { continue }
      if (message && typeof message.type === 'string') fromHost(message)
    }
  })
  socket.on('close', () => app.quit())
  socket.on('error', () => app.quit())
})
app.on('window-all-closed', () => app.quit())
