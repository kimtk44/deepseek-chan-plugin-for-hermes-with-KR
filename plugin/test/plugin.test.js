import { createRequire } from 'node:module'
import { readSource } from './source.mjs'
import { renderToStaticMarkup } from 'react-dom/server'
import React from 'react'
const require = createRequire(import.meta.url)
import test, { after } from 'node:test'
import assert from 'node:assert/strict'
import { readFile, mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { createServer } from 'node:http'
import { once } from 'node:events'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import vm from 'node:vm'
import { JSDOM } from 'jsdom'
import { apply as hostApply, createAssetHandler, ASSET_PATH, AVATAR_PATH, Config, readLive, STATUS_PATH } from '../host.js'
import { AVATAR_CACHE_PATH } from '../avatar-cache.js'
import { PET_PATH } from '../pet-host.js'

const packageName = JSON.parse(await readFile(new URL('../../package.json', import.meta.url), 'utf8')).name
const bundle = await readFile(new URL('../../lib/client.js', import.meta.url), 'utf8')
// 한국어 사전 네임스페이스 수 (plugin/locales.ko.json)
const KO_NAMESPACES = Object.keys(JSON.parse(await readFile(new URL('../locales.ko.json', import.meta.url), 'utf8'))).length
// 캐릭터와 플러그인 화면은 createCharacter API로만 통신한다. window에 남은 캐릭터 통신용 전역(__dsc 디버그 핸들 제외)을 모은다
const dscGlobals = (window) => Object.keys(window).filter((key) => key.startsWith('__dsc'))

test('source build preserves sleep code and matches the committed bundle', async () => {
  const character = await readFile(new URL('../../assets/dsc.js', import.meta.url), 'utf8')
  execFileSync(process.execPath, ['plugin/build.mjs'], { cwd: fileURLToPath(new URL('../../', import.meta.url)) })
  assert.equal(await readFile(new URL('../../lib/client.js', import.meta.url), 'utf8'), bundle)
  assert.equal(await readFile(new URL('../../assets/dsc.js', import.meta.url), 'utf8'), character, '커밋된 assets/dsc.js도 소스에서 다시 만든 결과와 같아야 한다')
  assert.match(bundle, /speak\("sleep_out"/)
  assert.match(bundle, /speak\("sleep_back"/)
  const { lines } = JSON.parse(await readFile(new URL('../../assets/dsc-lines.json', import.meta.url), 'utf8'))
  assert.ok(lines.sleep_out?.length && lines.sleep_back?.length, '절전 대사는 assets/dsc-lines.json에 있다')
  assert.match(bundle, /["']절전["'] : ["']Power saving["']/)
  assert.match(bundle, /sharedTicker: false/)
  assert.match(bundle, /autoUpdate: false/)
  assert.match(bundle, /model.update\(Math.min\(app.ticker.deltaMS, 100\)\)/)
})

test('sleep cancels departures, protects intro and wakes for waiting cards', async () => {
  const source = readSource(new URL('../../character/index.ts', import.meta.url))
  // 번들은 esbuild가 다시 찍어 들여쓰기·이름이 달라지므로 소스 구간을 실행한다 (번들이 소스와 같은지는 위 빌드 재현 테스트가 확인)
  for (const code of [source]) {
    let now = 100000, timerId = 0, poll, stopped = false, card = null, working = false
    const timers = new Map(), frames = [], events = new Map(), lines = []
    const context = vm.createContext({
      performance: { now: () => now }, innerWidth: 1000,
      setTimeout: (fn) => { timers.set(++timerId, fn); return timerId },
      clearTimeout: (id) => timers.delete(id),
      requestAnimationFrame: (fn) => frames.push(fn), setInterval: (fn) => { poll = fn },
      addEventListener: (type, fn, options) => { assert.equal(options.capture, true); events.set(type, fn) },
      canvas: { style: {}, getBoundingClientRect: () => ({ left: 700 }) },
      bubble: { style: {}, classList: { contains: () => false } },
      app: { ticker: { get started() { return !stopped }, start: () => { stopped = false }, stop: () => { stopped = true } } },
      setRender: (on) => { stopped = !on },   // 배치 코드가 쓰는 상태 기반 티커 제어 (테스트에선 stopped 로만 확인)
      document: { hidden: false, querySelector: (selector) => selector === 'stop' ? working : selector.includes(card) && card },
      prefs: { sleep: { enabled: true, minutes: 0.5 } },
      PET: false, drag: {}, free: {}, link: {},
      // 화면 읽기(character/harness-signals.js)는 따로 검사하고, 여기서는 그 결과만 흉내 낸다
      readStatus: () => ({ running: working, waiting: card === 'approval' ? 'approval' : card ? 'question' : null }), intro: { phase: 'center' }, walk: { phase: '', slideId: 0, timers: [] },
      speak: (line) => lines.push(line), say: (line) => lines.push(line), hush() {}, place() {},
      setExp() {}, setMood() {}, play() {}, mutterCheck() {}, flashExp() {},
      TEXT: { approval: 'approval', question: 'question' },
    })
    vm.runInContext('let fleeX = 0, hidden = false, running = false, waitingKind = null, lastSayAt = 0, lastError = 0;', context)
    vm.runInContext(code.slice(code.indexOf('      const WALK_SPEED'), code.indexOf('      const walkBack')), context)
    vm.runInContext(code.slice(code.indexOf('      const SLEEP ='), code.indexOf('      const HEAD_SULK_AT')), context)
    // 작업 상태 확인 주기와 그 단계 함수(절전 설정 읽기·대기·작업 반응·절전 판정)를 함께 실행한다
    const pollStart = code.indexOf('      const readSleepPrefs = () => {')
    vm.runInContext(code.slice(pollStart, code.indexOf('      }, 400);', pollStart) + '      }, 400);'.length), context)
    const read = (s) => vm.runInContext(s, context)
    const frame = () => { now += 500; frames.splice(0).forEach((fn) => fn()) }
    const depart = () => { const pending = [...timers.values()]; timers.clear(); pending.forEach((fn) => fn()) }
    read('sleepGo()'); assert.equal(read('SLEEP.state'), 'active')
    read('intro.phase = "done"; sleepGo()'); assert.equal(timers.size, 1)
    events.get('pointerdown')(); assert.equal(timers.size, 0)
    frame(); assert.equal(read('SLEEP.state'), 'active'); assert.equal(read('fleeX'), 0)
    read('sleepGo()'); depart(); frame()
    const halfway = read('fleeX'); assert(halfway > 0)
    events.get('pointermove')(); assert.equal(read('fleeX'), halfway)
    frame(); frame(); assert.equal(read('fleeX'), 0); assert.equal(read('SLEEP.state'), 'active')
    for (const trigger of ['work', 'disable', 'approval', 'data-question-reply']) {
      read('sleepGo()')
      if (trigger === 'work') working = true
      else if (trigger === 'disable') context.prefs.sleep.enabled = false
      else card = trigger
      poll(); assert.equal(read('SLEEP.state'), 'waking')
      assert.equal(timers.size, 0)
      frame(); working = false; card = null; context.prefs.sleep.enabled = true; poll()
      timers.clear()
    }
    for (const waiting of ['approval', 'data-question-reply']) {
      read('sleepGo()'); depart(); frame(); frame(); frame(); frame()
      assert.equal(read('SLEEP.state'), 'asleep'); assert.equal(stopped, true)
      card = waiting; poll()
      assert.equal(read('SLEEP.state'), 'waking'); assert.equal(stopped, false)
      const expected = waiting === 'approval' ? 'approval' : 'question'
      assert.equal(read('waitingKind'), expected); assert.equal(lines.at(-1), expected)
      frame(); frame(); frame(); frame()
      assert.equal(lines.at(-1), expected)
      card = null; poll()
    }
  }
})

test('sleep preserves free placement, blocks dragging and never sleeps while the pet is outside', async () => {
  const code = readSource(new URL('../../character/index.ts', import.meta.url))
  for (const petPage of [false, true]) {
    let now = 0, stopped = false, listeners = 0
    const frames = [], timers = [], lines = []
    const context = vm.createContext({
      PET: petPage, innerWidth: 1000, innerHeight: 800, W: 200, H: 400, SHOW_K: 0.1, visH: 400, MIN_SHOW_K: 0.18, coarsePointer: () => false, freeMode: () => 'desktop',
      performance: { now: () => now }, requestAnimationFrame: (fn) => frames.push(fn),
      setTimeout: (fn) => { timers.push(fn); return timers.length }, clearTimeout() {},
      addEventListener() { listeners++ },
      drag: {}, free: { on: true, k: 0.8, fx: 0.3, fy: 0.6, applied: true }, link: {},
      walk: { phase: '', timers: [], slideId: 0 }, intro: { phase: 'done' },
      canvas: { style: {}, getBoundingClientRect: () => ({ left: 220 }) }, bubble: { style: {} },
      app: { ticker: { get started() { return !stopped }, start() { stopped = false }, stop() { stopped = true } } },
      setRender: (on) => { stopped = !on },   // 배치 코드가 쓰는 상태 기반 티커 제어 (테스트에선 stopped 로만 확인)
      keepIn: (q) => q, speak: (line) => lines.push(line), hush() {}, place() {},
    })
    const run = (s) => vm.runInContext(s, context)
    run('let fleeX = 0, hidden = false, running = false, waitingKind = null, snapP = 0;')
    run(code.slice(code.indexOf('      const WALK_SPEED'), code.indexOf('      const walkBack')))
    run(code.slice(code.indexOf('      const SLEEP ='), code.indexOf('      const HEAD_SULK_AT')))
    // 자유 위치 계산 단계(애니메이션 끝·미끄러짐·창 비율 자리)와 dockPose를 함께 실행한다
    run(code.slice(code.indexOf('      const finishFreeAnim ='), code.indexOf('      const GLIDE =')))
    assert.equal(listeners, petPage ? 0 : 6)
    if (petPage) { run('sleepGo()'); assert.equal(run('SLEEP.state'), 'active'); assert.equal(stopped, false); continue }
    for (const guard of ['drag.on', 'drag.pending', 'free.anim']) {
      run(guard + ' = true; sleepGo()'); assert.equal(run('SLEEP.state'), 'active'); run(guard + ' = false')
    }
    const before = JSON.stringify(context.free), home = run('JSON.stringify(dockPose({}, 0))')
    run('sleepGo()'); timers.splice(0).forEach((fn) => fn())
    now += 5000; frames.splice(0).forEach((fn) => fn())
    assert.equal(run('SLEEP.state'), 'asleep'); assert.equal(stopped, true)
    assert.ok(run('dockPose({}, 0).x') > 1000)
    run('sleepActivity()'); now += 5000; frames.splice(0).forEach((fn) => fn())
    assert.equal(run('SLEEP.state'), 'active'); assert.equal(stopped, false)
    assert.equal(run('JSON.stringify(dockPose({}, 0))'), home); assert.equal(JSON.stringify(context.free), before)
    const count = lines.length
    run('link.open = true; sleepGo()'); assert.equal(stopped, false); assert.equal(run('SLEEP.state'), 'active')   // 펫 창으로 꺼내 둔 동안엔 절전 안 함
    assert.equal(lines.length, count); assert.equal(timers.length, 0)
  }
})

test('disabling the character during dragging clears grabbing state', () => {
  const h = clientHarness()
  try {
    const ctx = h.ctx(); h.client.apply(ctx)
    h.dom.window.document.documentElement.classList.add('dsc-grabbing', 'dsc-hover')
    h.form.update({ character: false })
    assert.equal(h.dom.window.document.documentElement.classList.contains('dsc-grabbing'), false)
    assert.equal(h.dom.window.document.documentElement.classList.contains('dsc-hover'), false)
    ctx.dispose()
  } finally { h.dom.window.close() }
})

function clientHarness(initial = {}, status = 'ready', { layout } = {}) {
  const dom = new JSDOM('<!doctype html><html><head></head><body data-ds-dark-theme></body></html>', { url: 'http://127.0.0.1/', runScripts: 'outside-only', pretendToBeVisual: true })
  let client, resolveModel, appDestroyed = 0, appCreated = 0
  const pending = new Promise((resolve) => { resolveModel = resolve })
  dom.window.Live2DCubismCore = {}
  dom.window.PIXI = {
    Application: class { constructor() { appCreated++ } destroy() { appDestroyed++ } },
    live2d: { Live2DModel: { from: () => pending } },
  }
  dom.window.__ModuleLoader__ = { load({ id, factory }) { assert.equal(id, packageName, 'browser module ID must match its package name'); client = factory(require) } }
  dom.window.eval(bundle)
  const languages = new Map([['en', {}], ['zh', {}]])
  const dictionaries = new Map()
  let selected = 'en'
  const subscriptions = new Set(), pages = new Map()
  let snapshot = { status, value: initial, writable: true, revision: 0 }
  const mutations = []
  const form = {
    getSnapshot: () => snapshot,
    subscribe(fn) { subscriptions.add(fn); return () => subscriptions.delete(fn) },
    update(value, status = 'ready') { snapshot = { ...snapshot, status, value, revision: snapshot.revision + 1 }; for (const fn of [...subscriptions]) fn() },
    async set(field, value) { form.update({ ...snapshot.value, [field]: value }); return true },
    async mutate(ops) {
      const next = structuredClone(snapshot.value ?? {})
      for (const op of ops) {
        mutations.push(op)
        const parent = op.path.slice(0, -1).reduce((node, key) => (node[key] ??= {}), next)
        parent[op.path.at(-1)] = op.value
      }
      form.update(next); return true
    },
  }
  const ctx = () => {
    const cleanups = []
    return {
      effect(fn) { const cleanup = fn(); cleanups.push(cleanup); return cleanup },
      configForms: { get(id) { assert.equal(id, 'deepseek-harness-kr'); return form } },
      slots: {
        inject(name, fn) { assert.equal(name, 'plugins.row.config'); return fn() },
        register(definition, component) {
          pages.set(definition.key, component)
          return () => { if (pages.get(definition.key) === component) pages.delete(definition.key) }
        },
      },
      locale: {
        subscribe() { return () => {} },
        getLocale: () => ({ active: selected, locales: [...languages.keys()].map((id) => ({ id })) }),
        addLanguage({ id }) { languages.set(id, {}); return () => languages.delete(id) },
        register(ns, id, dictionary) {
          const key = ns + '/' + id
          if (dictionaries.has(key)) throw new Error('duplicate ' + key)
          dictionaries.set(key, dictionary)
          return () => dictionaries.delete(key)
        },
        setLocale(id) { selected = id },
      },
      theme: { getTheme: () => ({ active: { colorScheme: 'dark' } }) },
      inject(services, fn) {
        if (!layout || !services.includes('layout')) return
        const scopeCleanups = []
        fn({
          layout,
          effect(callback) {
            const cleanup = callback()
            scopeCleanups.push(cleanup)
            return cleanup
          },
        })
        cleanups.push(() => { for (const cleanup of scopeCleanups.reverse()) cleanup() })
      },
      dispose() { for (const cleanup of cleanups.reverse()) cleanup() },
    }
  }
  return { dom, client, ctx, languages, dictionaries, resolveModel, form, mutations, pages, get appCreated() { return appCreated }, get appDestroyed() { return appDestroyed }, get selected() { return selected } }
}

test('character shortcut debounces, guards permissions/failures and disposes', async () => {
  const h = clientHarness({ character: false, theme: false, translation: false })
  try {
    let calls = 0, mode = 'ok', writable = true
    const snapshot = h.form.getSnapshot
    h.form.getSnapshot = () => ({ ...snapshot(), writable })
    h.form.set = async () => {
      calls++
      if (mode === 'throw') throw new Error('save failed')
      return mode !== 'false'
    }
    let warnings = 0
    h.dom.window.console.warn = () => { warnings++ }
    const ctx = h.ctx(); h.client.apply(ctx)
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
    const key = async (extra = {}, target = h.dom.window) => {
      const event = new h.dom.window.KeyboardEvent('keydown', { key: 'D', code: 'KeyD', ctrlKey: true, shiftKey: true, bubbles: true, cancelable: true, ...extra })
      target.dispatchEvent(event)
      await new Promise((resolve) => setImmediate(resolve))
      return event
    }
    assert.equal((await key()).defaultPrevented, true); assert.equal(calls, 1)
    await key(); assert.equal(calls, 1)   // 150ms 안 연타는 무시
    await key({ repeat: true }); assert.equal(calls, 1)
    await wait(180); await key(); assert.equal(calls, 2)
    writable = false; await wait(180); await key(); assert.equal(calls, 2)
    writable = true
    h.form.update({}, 'loading'); await wait(180); await key(); assert.equal(calls, 2)
    h.form.update({ character: false, theme: false, translation: false })
    const input = h.dom.window.document.createElement('input')
    h.dom.window.document.body.append(input)
    await wait(180); await key({}, input); assert.equal(calls, 2)   // 입력 중엔 무시
    await key({ metaKey: true }); assert.equal(calls, 2)            // 다른 조합은 무시
    for (mode of ['false', 'throw']) { await wait(180); await key() }
    assert.equal(warnings, 2)
    let resolveSave
    h.form.set = () => { calls++; return new Promise((resolve) => { resolveSave = resolve }) }
    await wait(180); await key(); const pendingCalls = calls
    await wait(180); await key(); assert.equal(calls, pendingCalls)   // 저장 중엔 무시
    resolveSave(true); await new Promise((resolve) => setImmediate(resolve))
    await wait(180); await key(); assert.equal(calls, pendingCalls + 1)
    resolveSave(true); await new Promise((resolve) => setImmediate(resolve))
    ctx.dispose()
    await wait(180); await key(); assert.equal(calls, pendingCalls + 1)
    assert.deepEqual(dscGlobals(h.dom.window), [])
  } finally { h.dom.window.close() }
})

test('shortcut parsing and key capture share one spelling', () => {
  const h = clientHarness({ character: false, theme: false, translation: false })
  try {
    const { parseShortcut, shortcutFromEvent, matchesShortcut } = h.client.internals
    // 같은 키워드로 만든 객체라도 평가한 창(jsdom)이 달라 프로토타입이 다르므로 이쪽 창 객체로 옮겨 비교한다.
    const combo = (value) => ({ ...parseShortcut(value) })
    assert.deepEqual(combo('Ctrl+Shift+D'), { ctrl: true, shift: true, alt: false, meta: false, key: 'd' })
    assert.deepEqual(combo('shift+alt+f1'), { ctrl: false, shift: true, alt: true, meta: false, key: 'f1' })
    assert.deepEqual(combo(' Cmd + Space '), { ctrl: false, shift: false, alt: false, meta: true, key: 'space' })
    assert.equal(parseShortcut('Ctrl+Shift'), null, 'modifier keys alone are not a shortcut')
    assert.equal(parseShortcut(''), null)
    assert.equal(shortcutFromEvent({ key: 'd', ctrlKey: true, shiftKey: true }), 'Ctrl+Shift+D')
    assert.equal(shortcutFromEvent({ key: 'F1', altKey: true }), 'Alt+F1')
    assert.equal(shortcutFromEvent({ key: ' ', ctrlKey: true }), 'Ctrl+Space')
    assert.equal(shortcutFromEvent({ key: '+', ctrlKey: true }), 'Ctrl+Plus')
    assert.equal(shortcutFromEvent({ key: 'Control', ctrlKey: true }), '')
    assert.equal(shortcutFromEvent({}), '')
    assert.match(shortcutFromEvent({ key: 'd', metaKey: true }), /^(Cmd|Meta)\+D$/)
    const pressed = (key, extra = {}) => ({ key, ctrlKey: false, altKey: false, shiftKey: false, metaKey: false, ...extra })
    assert.equal(matchesShortcut('Ctrl+Shift+D', pressed('D', { ctrlKey: true, shiftKey: true })), true)
    assert.equal(matchesShortcut('Ctrl+Shift+D', pressed('d', { ctrlKey: true, shiftKey: true })), true)
    assert.equal(matchesShortcut('Ctrl+Shift+D', pressed('D', { ctrlKey: true })), false)
    assert.equal(matchesShortcut('Ctrl+Shift+D', pressed('D', { ctrlKey: true, shiftKey: true, altKey: true })), false)
    assert.equal(matchesShortcut('cmd+d', pressed('d', { metaKey: true })), true)
    assert.equal(matchesShortcut('Ctrl+Space', pressed(' ', { ctrlKey: true })), true)
    assert.equal(matchesShortcut('Ctrl+Plus', pressed('+', { ctrlKey: true })), true)
    assert.equal(matchesShortcut('', pressed('d')), false)
    assert.equal(matchesShortcut('Ctrl+Shift', pressed('Shift', { ctrlKey: true, shiftKey: true })), false)
  } finally { h.dom.window.close() }
})

test('shortcut recorder turns each recorded key into one action', () => {
  const h = clientHarness({ character: false, theme: false, translation: false })
  try {
    const { shortcutKeyDown } = h.client.internals
    const action = (event) => ({ ...shortcutKeyDown(event) })
    assert.deepEqual(action({ key: 'Tab' }), { action: 'leave' }, 'Tab moves focus instead of becoming a shortcut')
    assert.deepEqual(action({ key: 'Escape' }), { action: 'cancel' })
    assert.deepEqual(action({ key: 'Backspace' }), { action: 'clear' })
    assert.deepEqual(action({ key: 'Delete' }), { action: 'clear' })
    assert.deepEqual(action({ key: 'd', ctrlKey: true, shiftKey: true }), { action: 'save', combo: 'Ctrl+Shift+D' })
    assert.deepEqual(action({ key: ' ', ctrlKey: true }), { action: 'save', combo: 'Ctrl+Space' })
    assert.deepEqual(action({ key: 'Control', ctrlKey: true }), { action: 'wait', held: 'Ctrl' })
    assert.deepEqual(action({ key: 'Shift', ctrlKey: true, shiftKey: true }), { action: 'wait', held: 'Ctrl+Shift' })
  } finally { h.dom.window.close() }
})

test('settings page records the shortcut by pressing keys instead of typing it', () => {
  const h = clientHarness({ character: false, theme: false, translation: false, characterToggleKey: 'Ctrl+Shift+D' })
  try {
    const ctx = h.ctx(); h.client.apply(ctx)
    const Page = h.pages.get(packageName + '#deepseek-harness-kr')
    const html = renderToStaticMarkup(React.createElement(Page, { view: 'page' }))
    assert.match(html, /aria-label="Record character and speech bubbles toggle shortcut"/)
    assert.match(html, /Character and speech bubbles setting toggle shortcut/)
    assert.match(html, /readonly=""/)
    assert.match(html, /value="Ctrl\+Shift\+D"/)
    assert.match(html, /id="deepseek-harness-kr-shortcut-hint"/)
    assert.match(html, /Click the field, then press the keys you want/)
    ctx.dispose()
  } finally { h.dom.window.close() }
})

test('shortcut hint id stays unique and the character-off guidance uses its own id', () => {
  for (const character of [true, false]) {
    const h = clientHarness({ character, theme: false, translation: false })
    try {
      const ctx = h.ctx(); h.client.apply(ctx)
      const Page = h.pages.get(packageName + '#deepseek-harness-kr')
      const html = renderToStaticMarkup(React.createElement(Page, { view: 'page' }))
      assert.equal((html.match(/id="deepseek-harness-kr-shortcut-hint"/g) || []).length, 1, '안내 id는 문서에 하나만 있어야 한다')
      const off = (html.match(/id="deepseek-harness-kr-shortcut-hint-off"/g) || []).length
      assert.equal(off, character ? 0 : 1, '꺼짐 안내는 별도 id로 한 번만')
      if (!character) assert.match(html, /This shortcut still turns the character back on while it is off/)
      ctx.dispose()
    } finally { h.dom.window.close() }
  }
})

test('empty drag key stays empty so both buttons are required again', () => {
  const h = clientHarness({ character: true, theme: false, translation: false, dragKey: '' })
  try {
    const ctx = h.ctx(); h.client.apply(ctx)
    assert.equal(h.client.internals.linkOf(ctx).prefs.drag.key, '', '빈 값이 Alt로 되돌아가면 안 된다')
    const Page = h.pages.get(packageName + '#deepseek-harness-kr')
    const html = renderToStaticMarkup(React.createElement(Page, { view: 'page' }))
    assert.match(html, /aria-label="Record drag key"[^>]*value=""/)
    assert.match(html, /Empty needs both buttons/)
    ctx.dispose()
  } finally { h.dom.window.close() }
})

test('drag key, pet window shortcut and canvas toggle are configurable and defaulted', () => {
  const defaults = readLive(Config({}))
  assert.equal(defaults.dragKey, 'Alt')
  assert.equal(defaults.petToggleKey, 'Ctrl+Shift+P')
  assert.equal(defaults.canvasToggle, false)
  assert.equal(defaults.canvasToggleKey, 'Ctrl+Shift+H')
  assert.equal(defaults.earHide, false)
  const custom = readLive(Config({ dragKey: 'F', petToggleKey: '', canvasToggle: true, canvasToggleKey: 'H', earHide: true }))
  assert.equal(custom.dragKey, 'F')
  assert.equal(custom.petToggleKey, '')
  assert.equal(custom.canvasToggle, true)
  assert.equal(custom.canvasToggleKey, 'H')
  assert.equal(custom.earHide, true)
})

test('drag key recorder accepts one modifier or one ordinary key', () => {
  const h = clientHarness()
  try {
    const { dragKeyDown } = h.client.internals
    const action = (event) => ({ ...dragKeyDown(event) })
    assert.deepEqual(action({ key: 'Tab' }), { action: 'leave' })
    assert.deepEqual(action({ key: 'Escape' }), { action: 'cancel' })
    assert.deepEqual(action({ key: 'Backspace' }), { action: 'clear' })
    assert.deepEqual(action({ key: 'Delete' }), { action: 'clear' })
    assert.deepEqual(action({ key: 'Control' }), { action: 'wait', held: 'Ctrl' })
    assert.deepEqual(action({ key: 'Alt' }), { action: 'wait', held: 'Alt' })
    assert.deepEqual(action({ key: 'f' }), { action: 'save', key: 'F' })
    assert.deepEqual(action({ key: ' ' }), { action: 'save', key: 'Space' })
    assert.deepEqual(action({ key: 'Enter' }), { action: 'save', key: 'Enter' })
    assert.deepEqual(action({ key: 'c', ctrlKey: true }), { action: 'wait', held: 'Ctrl' })
    assert.deepEqual(action({ key: 'f', shiftKey: true }), { action: 'wait', held: 'Shift' })
  } finally { h.dom.window.close() }
})

test('settings page exposes the drag key and pet window shortcut', () => {
  const h = clientHarness({ character: true, theme: false, translation: false, dragKey: 'Alt', petToggleKey: 'Ctrl+Shift+P' })
  try {
    const ctx = h.ctx(); h.client.apply(ctx)
    const Page = h.pages.get(packageName + '#deepseek-harness-kr')
    const html = renderToStaticMarkup(React.createElement(Page, { view: 'page' }))
    assert.match(html, /Move character key \(hold while dragging\)/)
    assert.match(html, /aria-label="Record drag key"/)
    assert.match(html, /value="Alt"/)
    assert.match(html, /id="deepseek-harness-kr-drag-hint"/)
    assert.match(html, /aria-label="Record pet window shortcut"/)
    assert.match(html, /value="Ctrl\+Shift\+P"/)
    assert.match(html, /id="deepseek-harness-kr-pet-shortcut-hint"/)
    assert.match(html, /aria-label="Enable canvas hide\/show"/)
    assert.match(html, /Hide\/show canvas shortcut \(empty to disable\)/)
    assert.match(html, /aria-label="Record canvas hide\/show shortcut"/)
    assert.match(html, /value="Ctrl\+Shift\+H"/)
    assert.match(html, /id="deepseek-harness-kr-canvas-hint"/)
    // 공통 안내는 '단축키 - 캐릭터와 말풍선' 제목 바로 뒤, 첫 항목(설정 토글 단축키) 앞에 한 번만 나온다
    const hintAt = html.indexOf('Click the field, then press the keys you want')
    const firstFieldAt = html.indexOf('Record character and speech bubbles toggle shortcut')
    assert.ok(hintAt > 0 && hintAt < firstFieldAt)
    // 비활성화되는 줄들(이동 키·캔버스·펫 창)보다 설정 토글 단축키가 위에 온다
    assert.ok(firstFieldAt < html.indexOf('Record drag key'))
    assert.ok(firstFieldAt < html.indexOf('Record canvas hide/show shortcut'))
    assert.ok(firstFieldAt < html.indexOf('Record pet window shortcut'))
    assert.equal((html.match(/Click the field, then press the keys you want/g) || []).length, 1)
    // 스위치가 꺼져 있으면 캔버스 단축키 칸은 비활성 모양(disabled)이다
    assert.match(html, /aria-label="Record canvas hide\/show shortcut"[^>]*disabled=""/)
    // 캔버스 단축키는 '캐릭터와 말풍선 설정 토글' 바로 다음, 펫 창 앞에 온다
    const charAt = html.indexOf('Record character and speech bubbles toggle shortcut')
    const canvasAt = html.indexOf('Record canvas hide/show shortcut')
    const petAt = html.indexOf('Record pet window shortcut')
    assert.ok(charAt > 0 && charAt < canvasAt && canvasAt < petAt)
    // 스위치는 단축키 칸 바로 왼쪽(같은 줄의 입력 바로 앞)에 온다
    assert.ok(html.indexOf('Enable canvas hide/show') < canvasAt)
    assert.match(html, /Enable canvas hide\/show[^]{0,400}?Record canvas hide\/show shortcut/)
    ctx.dispose()
  } finally { h.dom.window.close() }
})

test('canvas shortcut row is disabled while the character setting is off', () => {
  const h = clientHarness({ character: false, theme: false, translation: false, canvasToggle: true, canvasToggleKey: 'Ctrl+Shift+H' })
  try {
    const ctx = h.ctx(); h.client.apply(ctx)
    const Page = h.pages.get(packageName + '#deepseek-harness-kr')
    const html = renderToStaticMarkup(React.createElement(Page, { view: 'page' }))
    assert.match(html, /Unavailable while the character and speech bubbles are off/)
    assert.match(html, /aria-label="Record drag key"[^>]*disabled=""/)
    assert.match(html, /aria-label="Record pet window shortcut"[^>]*disabled=""/)
    assert.match(html, /aria-label="Record canvas hide\/show shortcut"[^>]*disabled=""/)
    assert.match(html, /aria-label="Enable canvas hide\/show"[^>]*disabled=""/)
    // 캐릭터를 다시 켤 수 있는 토글 단축키는 계속 활성
    assert.match(html, /aria-label="Record character and speech bubbles toggle shortcut"(?![^>]*disabled="")/)
    assert.match(html, /This shortcut still turns the character back on while it is off/)
    ctx.dispose()
  } finally { h.dom.window.close() }
})

test('settings page explains a hidden canvas instead of implying the setting is off', () => {
  const h = clientHarness({ character: true, theme: true, translation: true, canvasToggle: true })
  try {
    const ctx = h.ctx(); h.client.apply(ctx)
    // 모델이 준비된 캐릭터 대신 숨김 상태만 알려 주는 가짜 캐릭터를 붙인다
    h.client.internals.linkOf(ctx).attach({ setPrefs() {}, canvasHidden: () => true, toggleCanvas: () => {} })
    const Page = h.pages.get(packageName + '#deepseek-harness-kr')
    const html = renderToStaticMarkup(React.createElement(Page, { view: 'page' }))
    assert.match(html, /The canvas is hidden right now \(the character setting is still on\)/)
    assert.match(html, /Show again/)
    ctx.dispose()
  } finally { h.dom.window.close() }
})

test('pet window shortcut calls the toggle the character exposes', () => {
  const h = clientHarness({ character: false, theme: false, translation: false, petToggleKey: 'Ctrl+Shift+P' })
  try {
    const ctx = h.ctx(); h.client.apply(ctx)
    let calls = 0
    h.client.internals.linkOf(ctx).attach({ setPrefs() {}, canvasHidden: () => false, togglePet: () => { calls++ } })
    const press = (extra = {}, target = h.dom.window) => {
      const event = new h.dom.window.KeyboardEvent('keydown', { key: 'P', code: 'KeyP', ctrlKey: true, shiftKey: true, bubbles: true, cancelable: true, ...extra })
      target.dispatchEvent(event)
      return event
    }
    assert.equal(press().defaultPrevented, true)
    assert.equal(calls, 1)
    press({ repeat: true })   // 키를 계속 누르고 있어도 한 번만
    assert.equal(calls, 1)
    press({ shiftKey: false })   // 다른 조합은 무시
    assert.equal(calls, 1)
    const input = h.dom.window.document.createElement('input')
    h.dom.window.document.body.append(input)
    press({}, input)   // 입력 칸 안에서는 무시
    assert.equal(calls, 1)
    ctx.dispose()
  } finally { h.dom.window.close() }
})

test('canvas shortcut only runs when enabled and works inside the composer', async () => {
  const h = clientHarness({ character: false, theme: false, translation: false, canvasToggle: true, canvasToggleKey: 'Ctrl+Shift+H' })
  try {
    const ctx = h.ctx(); h.client.apply(ctx)
    let calls = 0
    h.client.internals.linkOf(ctx).attach({ setPrefs() {}, canvasHidden: () => false, toggleCanvas: () => { calls++ } })
    const fire = (type, extra = {}, target = h.dom.window) => {
      const event = new h.dom.window.KeyboardEvent(type, { key: 'H', code: 'KeyH', ctrlKey: true, shiftKey: true, bubbles: true, cancelable: true, ...extra })
      target.dispatchEvent(event)
      return event
    }
    const press = (extra = {}, target = h.dom.window) => {
      const event = fire('keydown', extra, target)
      const releaseEvent = fire('keyup', extra, target)
      return { event, releaseEvent }
    }
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
    assert.equal(press().event.defaultPrevented, true)
    assert.equal(calls, 1)
    await wait(180)   // 누른 시각 기준 연타 방지(150ms) 밖으로
    const input = h.dom.window.document.createElement('textarea')
    h.dom.window.document.body.append(input)
    press({}, input)   // 수식 키 조합은 입력창 안에서도 동작
    assert.equal(calls, 2)
    press({ shiftKey: false })   // 다른 조합은 무시
    assert.equal(calls, 2)
    await wait(180)
    h.form.update({ ...h.form.getSnapshot().value, canvasToggle: false })
    press()
    assert.equal(calls, 2)   // 기능을 끄면 단축키가 동작하지 않음
    ctx.dispose()
  } finally { h.dom.window.close() }
})

test('pet window settings panel is tall enough to avoid a needless scrollbar', async () => {
  const css = await readFile(new URL('../../assets/character.css', import.meta.url), 'utf8')
  assert.match(css, /#dsc-pet-panel \{[^}]*max-height: 560px/)
  assert.doesNotMatch(css, /#dsc-pet-panel \{[^}]*max-height: 440px/)
})

test('solid bubble tail raises its opening so the border edge does not show as a line', async () => {
  // 말풍선이 소수 픽셀 위치에 놓이면 테두리 위쪽 가장자리가 꼬리 입구에 가는 가로줄로 비친다 (점선 꼬리와 같은 방식)
  const css = await readFile(new URL('../../assets/character.css', import.meta.url), 'utf8')
  const tail = css.match(/#dsc-bubble::after \{[^}]*\}/)[0]
  assert.match(tail, /clip-path: polygon\(100% 0, 12px 2px, 12px 1\.29px, 1\.29px 12px, 2px 12px, 0 100%, 100% 100%\)/)
})

test('character source supports modifier drag and a pet window toggle', async () => {
  const source = readSource(new URL('../../character/index.ts', import.meta.url))
  for (const code of [source, bundle]) {
    assert.match(code, /const both = \(e\.buttons & 3\) === 3 \|\| touchGrab \|\| dragKeyHeld\(e\)/)
    assert.match(code, /hooks\.togglePet = link\.toggle/)
    assert.match(code, /const list\s*= \[\["drag", \[dragKeyRaw\(\)\]\]\];/)   // 펫 창이 보이기 시작할 때 이동 키를 보낸다 (petLinkDragMessages)
    assert.match(code, /hooks\.toggleCanvas = \(\) => setHidden\(!hidden\)/)
    assert.match(code, /id = "dsc-hide-chip"/)
  }
  // 펫 창은 창 안 캐릭터가 보낸 이동 키와 키 눌림 상태를 받는다 (번들은 esbuild가 줄을 바꿔 찍어 소스로 확인)
  assert.match(source, /drag: \(args\) => \{ prefs\.drag = \{ key: args\[0\] \}; \}/)
  assert.match(source, /dragheld: \(args\) =>/)
  // 펫 창 설정 패널 항목은 공용 정의에서 만든다
  assert.match(source, /const PET_OUTFIT_ROWS = OUTFIT_ITEMS\.map\(/)
})

test('outfit and body items come from one shared definition everywhere', async () => {
  const shared = await import('../../shared/settings.js')
  const keys = shared.OUTFIT_ITEMS.map((item) => item.key)
  assert.ok(keys.includes('earHide'))
  // 호스트 설정 스키마: 항목마다 끔 기본값, 체형은 정의된 값만
  const defaults = readLive(Config({}))
  for (const key of keys) assert.equal(defaults[key], false, key)
  assert.equal(defaults.bodyType, 'default')
  assert.throws(() => Config({ bodyType: 'type3' }))
  // 설정 화면·캐릭터 값: 같은 항목 + 체형
  const h = clientHarness({ character: false, theme: false, translation: false })
  try {
    const prefs = h.client.internals.characterPrefs({ glasses: true })
    assert.deepEqual(Object.keys(prefs.outfit), [...keys, 'bodyType'])
    assert.equal(prefs.outfit.glasses, true)
  } finally { h.dom.window.close() }
  // 펫 Electron 메뉴용 산출물도 같은 정의 (빌드가 만든 pet/settings.cjs)
  const pet = require('../../pet/settings.cjs')
  assert.deepEqual(pet.OUTFIT_ITEMS, shared.OUTFIT_ITEMS)
  assert.deepEqual(pet.BODY_TYPES, shared.BODY_TYPES)
  const main = await readFile(new URL('../../pet/main.cjs', import.meta.url), 'utf8')
  assert.match(main, /require\('\.\/settings\.cjs'\)/)
  assert.match(main, /const MENU_OUTFIT = OUTFIT_ITEMS\.map\(/)
})
test('sleep minutes are bounded in schema and client settings', () => {
  assert.equal(Config.dict.idleSleepMinutes.meta.min, 0.5)
  assert.equal(Config.dict.idleSleepMinutes.meta.max, 60)
  assert.equal(Config.dict.idleSleepMinutes.meta.default, 1)
  const h = clientHarness({ character: false, theme: false, translation: false })
  try {
    const ctx = h.ctx(); h.client.apply(ctx)
    for (const [value, expected] of [[undefined, 1], [NaN, 1], [Infinity, 1], [-1, 0.5], [0.5, 0.5], [60, 60], [100, 60]]) {
      h.form.update({ character: false, theme: false, translation: false, idleSleepMinutes: value })
      assert.equal(h.client.internals.linkOf(ctx).prefs.sleep.minutes, expected)
    }
    ctx.dispose()
  } finally { h.dom.window.close() }
})

test('client registers Korean independently, mounts once, and rolls back on disable during model load', async () => {
  const h = clientHarness()
  try {
    const first = h.ctx()
    h.client.apply(first)
    assert(h.languages.has('ko'))
    assert.equal(h.selected, 'en', 'installation must not overwrite the user language')
    assert.equal(h.dictionaries.size, KO_NAMESPACES)
    assert.equal(h.dictionaries.get('settings.theme/ko')['appearance.title'], '모양')
    assert.equal(h.dom.window.document.querySelectorAll('#dsc-stage').length, 1)
    assert.equal(h.dom.window.document.querySelectorAll('link').length, 3)   // character.css, theme.css, korean.css
    first.dispose()
    assert.equal(h.dom.window.document.querySelectorAll('#dsc-stage, #dsc-bubble, link').length, 0)
    assert.equal(h.dictionaries.size, 0)
    assert(!h.languages.has('ko'))
    assert(h.dom.window.document.body.hasAttribute('data-ds-dark-theme'))
    assert.equal(h.appDestroyed, 1)
    let modelDestroyed = 0
    h.resolveModel({ destroy() { modelDestroyed++ } })
    await new Promise((resolve) => setImmediate(resolve))
    assert.equal(modelDestroyed, 1, 'late model completion must be disposed')
    assert.equal(h.dom.window.__dsc, undefined)
    assert.deepEqual(dscGlobals(h.dom.window), [])
  } finally { h.dom.window.close() }
})

test('plugin and automation panels hide only the in-window character and clean up', () => {
  let activePanelId = null
  const listeners = new Set()
  const layout = {
    panelInfo: {
      getSnapshot: () => ({ activePanelId }),
      subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn) },
    },
  }
  const select = (id) => {
    activePanelId = id
    for (const fn of [...listeners]) fn()
  }
  const h = clientHarness({ character: false, theme: false, translation: false }, 'ready', { layout })
  try {
    const ctx = h.ctx()
    h.client.apply(ctx)
    const link = h.client.internals.linkOf(ctx)
    assert.equal(link.pageHidden, false)
    select('plugins')
    assert.equal(link.pageHidden, true, 'plugins panel must hide the in-window character')
    select(null)
    assert.equal(link.pageHidden, false, 'conversation must restore the in-window character')
    select('schedules')
    assert.equal(link.pageHidden, true, 'automation panel must hide the in-window character')
    select('plugins')
    ctx.dispose()
    assert.equal(link.pageHidden, false, 'unloading the plugin must clear the panel override')
    assert.equal(listeners.size, 0, 'the layout subscription must be released')
    assert.deepEqual(dscGlobals(h.dom.window), [])
  } finally { h.dom.window.close() }
})

test('a stale panel-visibility disposer does not clear a reinjected instance state', () => {
  let activePanelId = 'plugins'
  const listeners = new Set()
  const layout = {
    panelInfo: {
      getSnapshot: () => ({ activePanelId }),
      subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn) },
    },
  }
  const h = clientHarness({ character: false, theme: false, translation: false }, 'ready', { layout })
  try {
    const first = h.ctx()
    h.client.apply(first)
    assert.equal(h.client.internals.linkOf(first).pageHidden, true)
    const second = h.ctx()
    h.client.apply(second)
    const link = h.client.internals.linkOf(second)
    assert.equal(link.pageHidden, true)
    first.dispose()
    assert.equal(link.pageHidden, true, 'the old instance must not reset the new instance override')
    assert.equal(listeners.size, 1, 'only the old subscription is released')
    second.dispose()
    assert.equal(link.pageHidden, false)
    assert.equal(listeners.size, 0)
  } finally { h.dom.window.close() }
})


test('reinjection takes over without duplicate dictionaries or stale disposer removing the new instance', () => {
  const h = clientHarness()
  try {
    const first = h.ctx(), second = h.ctx()
    h.client.apply(first)
    h.client.apply(second)
    first.dispose()
    assert.equal(h.dom.window.document.querySelectorAll('#dsc-stage').length, 1)
    assert.equal(h.dictionaries.size, KO_NAMESPACES)
    second.dispose()
    assert.equal(h.dom.window.document.querySelectorAll('#dsc-stage').length, 0)
    assert.equal(h.dictionaries.size, 0)
  } finally { h.dom.window.close() }
})

test('a conflicting dictionary fails cleanly without removing someone else\'s language or translation', () => {
  const h = clientHarness()
  try {
    h.languages.set('ko', {})
    h.dictionaries.set('common/ko', { external: true })
    assert.throws(() => h.client.apply(h.ctx()), /duplicate/)
    assert(h.languages.has('ko'))
    assert.equal(h.dictionaries.size, 1)
    assert.equal(h.dom.window.document.querySelectorAll('link, #dsc-stage').length, 0)
  } finally { h.dom.window.close() }
})

test('Host asset route serves only its files and unregisters with the plugin', async () => {
  const root = await mkdtemp(join(tmpdir(), 'dsh-kr-test-'))
  let server
  try {
    await mkdir(join(root, 'assets'))
    await writeFile(join(root, 'assets', 'model.json'), '{"ok":true}')
    await writeFile(join(root, 'outside.json'), '{"secret":true}')
    server = createServer(createAssetHandler(join(root, 'assets')))
    server.listen(0, '127.0.0.1'); await once(server, 'listening')
    const url = 'http://127.0.0.1:' + server.address().port
    const asset = await fetch(url + ASSET_PATH + '/model.json')
    assert.equal(asset.status, 200)
    assert.deepEqual(await asset.json(), { ok: true })
    assert.equal((await fetch(url + ASSET_PATH + '/model.json', { method: 'HEAD' })).headers.get('content-length'), '11')
    // 조건부 요청: 같은 자산을 다시 받을 때 304로 본문을 생략한다(파일이 바뀌면 200).
    const etag = asset.headers.get('etag')
    assert.match(etag, /^"[0-9a-f]+-[0-9a-f]+"$/)
    const notModified = await fetch(url + ASSET_PATH + '/model.json', { headers: { 'if-none-match': etag } })
    assert.equal(notModified.status, 304)
    assert.equal(await notModified.text(), '')
    assert.equal((await fetch(url + ASSET_PATH + '/model.json', { headers: { 'if-none-match': '"0-0"' } })).status, 200)
    assert.equal((await fetch(url + ASSET_PATH + '/%2e%2e%2foutside.json')).status, 404)
    assert.equal((await fetch(url + ASSET_PATH + '/..%5coutside.json')).status, 404)
    assert.equal((await fetch(url + ASSET_PATH + '/model.json', { method: 'POST' })).status, 405)
    assert.equal((await fetch(url + ASSET_PATH + '/%zz')).status, 400)
    const registrations = new Map(), disposers = [], icons = []
    const applyIcon = async (options) => { icons.push(options.enabled); return {} }
    hostApply({ effect(fn) { disposers.push(fn()) }, webServer: { register(route) { registrations.set(route.path, route); return () => registrations.delete(route.path) } } }, undefined, { applyIcon })
    assert.deepEqual(icons, [true], 'app icon defaults to on, through the injected function only')
    assert.equal(registrations.get(ASSET_PATH).kind, 'prefix')
    assert.deepEqual([...registrations.keys()].sort(), [ASSET_PATH, AVATAR_PATH, AVATAR_CACHE_PATH, STATUS_PATH, PET_PATH, '/dsh-tts/speak', '/dsh-tts/state'].sort())
    for (const dispose of disposers) dispose()
    assert.equal(registrations.size, 0)
  } finally {
    if (server) { server.closeAllConnections(); await new Promise((resolve) => server.close(resolve)) }
    assert(resolve(root).startsWith(resolve(tmpdir()) + '\\') || resolve(root).startsWith(resolve(tmpdir()) + '/'))
    await rm(root, { recursive: true, force: true })
  }
})

test('all eight combinations mount only the selected features', () => {
  for (const character of [false, true]) for (const theme of [false, true]) for (const translation of [false, true]) {
    const h = clientHarness({ character, theme, translation })
    try {
      const ctx = h.ctx(); h.client.apply(ctx)
      const doc = h.dom.window.document
      assert.equal(!!doc.querySelector('#dsc-stage'), character)
      assert.equal(!!doc.querySelector('link[href$="character.css"]'), character)
      assert.equal(!!doc.querySelector('link[href$="theme.css"]'), theme)
      assert.equal(h.languages.has('ko'), translation)
      assert.equal(!!doc.querySelector('link[href$="korean.css"]'), translation, '한국어 줄바꿈은 번역 기능과 함께 켜지고 꺼진다')
      assert.equal(h.dictionaries.size, translation ? KO_NAMESPACES : 0)
      assert.equal(doc.body.hasAttribute('data-ds-dark-theme'), true, 'theme and character keep the app dark mode')
      assert.equal(h.pages.size, 1, 'settings remain available even when every feature is off')
      ctx.dispose()
    } finally { h.dom.window.close() }
  }
})

test('live changes preserve unrelated features and dispose character resources independently', async () => {
  const h = clientHarness()
  try {
    const ctx = h.ctx(); h.client.apply(ctx)
    const doc = h.dom.window.document, canvas = doc.querySelector('#dsc-stage')
    await h.form.set('theme', false)
    assert.equal(doc.querySelector('#dsc-stage'), canvas)
    assert(doc.body.hasAttribute('data-ds-dark-theme'))
    assert.equal(h.appDestroyed, 0)
    await h.form.set('translation', false)
    assert.equal(h.dictionaries.size, 0)
    assert(!doc.querySelector('link[href$="korean.css"]'))
    assert.equal(doc.querySelector('#dsc-stage'), canvas)
    await h.form.set('character', false)
    assert.equal(h.appDestroyed, 1)
    assert.equal(doc.querySelectorAll('link, #dsc-stage, #dsc-bubble').length, 0)
    await h.form.set('theme', true)
    assert(!doc.querySelector('#dsc-stage'))
    assert(doc.querySelector('link[href$="theme.css"]'))
    assert.equal(h.appCreated, 1)
    await h.form.set('character', true)
    assert(doc.querySelector('#dsc-stage'))
    assert.equal(h.appCreated, 2)
    ctx.dispose()
    assert.equal(h.pages.size, 0)
  } finally { h.dom.window.close() }
})

test('한국어 줄바꿈은 한국어 화면에서만 낱말 중간을 끊지 않고, 긴 글자는 넘치지 않게 자른다', async () => {
  const css = await readFile(new URL('../../assets/korean.css', import.meta.url), 'utf8')
  const rule = css.match(/html:lang\(ko\) body \{([^}]*)\}/)
  assert(rule, 'DSH가 넣는 <html lang>으로 한국어 화면만 고른다')
  assert.match(rule[1], /word-break: keep-all;/)
  assert.match(rule[1], /overflow-wrap: break-word;/)
  assert.doesNotMatch(css.replace(/\/\*[\s\S]*?\*\//g, ''), /text-wrap/, '검토 결과 text-wrap: pretty는 쓰지 않음')
})

test('stored disabled values do not flash features while configuration is loading', () => {
  const h = clientHarness(undefined, 'loading')
  try {
    const ctx = h.ctx(); h.client.apply(ctx)
    assert.equal(h.dom.window.document.querySelectorAll('link, #dsc-stage').length, 0)
    h.form.update({ character: false, theme: false, translation: false })
    assert.equal(h.appCreated, 0)
    assert.equal(h.dictionaries.size, 0)
    ctx.dispose()
  } finally { h.dom.window.close() }
})

test('plugin settings page exposes feature and power saving switches', () => {
  const h = clientHarness({ character: true, theme: false, translation: false })
  try {
    const ctx = h.ctx(); h.client.apply(ctx)
    const Page = h.pages.get(packageName + '#deepseek-harness-kr')
    assert(Page)
    const html = renderToStaticMarkup(React.createElement(Page, { view: 'page' }))
    assert.equal((html.match(/role="switch"/g) || []).length, 9)
    assert.equal((html.match(/<input type="checkbox" role="switch" checked=""/g) || []).length, 5)
    assert.match(html, /Character and speech bubbles/)
    assert.match(html, /Show character on mobile/)
    assert.match(html, /Intro on startup/)
    assert.match(html, /App icon \(Windows, macOS\)/)
    assert.match(html, /Pastel theme/)
    assert.match(html, /Korean language pack/)
    assert.match(html, /Extra dialogue/)
    assert.match(html, /aria-label="Power saving"/)
    assert.match(html, /aria-label="Shortcuts - Character and speech bubbles"/)
    assert.match(html, /min="0.5" max="60"/)
    ctx.dispose()
  } finally { h.dom.window.close() }
})

test('settings page offers accessories, outfit and body type, and shares them with the character', async () => {
  const h = clientHarness({ character: false, theme: false, translation: false, glasses: true, bodyType: 'type2' })
  try {
    const ctx = h.ctx(); h.client.apply(ctx)
    const Page = h.pages.get(packageName + '#deepseek-harness-kr')
    const html = renderToStaticMarkup(React.createElement(Page, { view: 'page' }))
    assert.match(html, /aria-label="Accessories and outfit"/)
    for (const label of ['Glasses', 'Monocle', 'Change skirt length', 'Change top', 'Take off shoes', 'Hide tail', 'Hide animal ears']) assert.match(html, new RegExp(label))
    assert.doesNotMatch(html, /basin|Lean forward/i)
    assert.equal((html.match(/type="radio"/g) || []).length, 3)
    assert.match(html, /type="radio" name="deepseek-harness-kr-body" checked=""[^>]*\/><span>Body type 2 \(chibi\)/)
    const link = h.client.internals.linkOf(ctx)
    const outfit = () => ({ ...link.prefs.outfit })
    assert.deepEqual(outfit(), { glasses: true, monocle: false, skirt: false, chestClothes: false, shoesOff: false, tailHide: false, earHide: false, bodyType: 'type2' })
    // 붙어 있는 캐릭터에도 같은 값이 전달된다
    const sent = []
    link.attach({ setPrefs: (next) => { if (next.outfit) sent.push(next.outfit.bodyType) }, canvasHidden: () => false })
    await h.form.set('bodyType', 'type1')
    assert.equal(outfit().bodyType, 'type1')
    assert.deepEqual(sent, ['type1'])
    await h.form.set('earHide', true)
    assert.equal(outfit().earHide, true, '귀 숨김 설정이 캐릭터(아웃핏)로 동기화되어야 한다')
    await h.form.set('earHide', false)
    assert.equal(outfit().earHide, false)
    ctx.dispose()
    assert.deepEqual(dscGlobals(h.dom.window), [])
  } finally { h.dom.window.close() }
})

test('core worker is registered for termination when the plugin unloads', async () => {
  const source = readSource(new URL('../../character/rig-live2d.ts', import.meta.url))   // Core Worker는 Live2D 렌더러가 띄움
  assert.match(source, /new Worker\(BASE \+ "dsc-core-worker\.js"\); \} catch \{ return; \}\s*life\.add\(\(\) => \{ try \{ w\.terminate\(\);? \} catch \{\} \}\)/)
  assert.match(bundle, /w\.terminate\(\)/)
})

test('update source parsing and version comparison', () => {
  const h = clientHarness()
  const { compareVersions } = h.client.internals
  const githubSource = (spec) => { const r = h.client.internals.githubSource(spec); return r && { ...r } }
  assert.deepEqual(githubSource('git+https://github.com/noire113-dev/deepseek-harness-kr.git'), { owner: 'noire113-dev', repo: 'deepseek-harness-kr', ref: null })
  assert.deepEqual(githubSource('github:someone/fork#dev'), { owner: 'someone', repo: 'fork', ref: 'dev' })
  assert.deepEqual(githubSource('git+ssh://git@github.com/a/b.git#v1'), { owner: 'a', repo: 'b', ref: 'v1' })
  assert.equal(githubSource('C:/plugins/deepseek-harness-kr'), null)
  assert.equal(githubSource('git+file:///C:/x/y'), null)
  assert.equal(githubSource(undefined), null)
  assert(compareVersions('0.1.3', '0.1.2') > 0)
  assert(compareVersions('0.2.0', '0.1.10') > 0)
  assert.equal(compareVersions('0.1.2', '0.1.2'), 0)
  assert(compareVersions('0.1.2', '0.1.3') < 0)
  assert(compareVersions('0.1.3', '0.1.3-rc.1') > 0)
  h.dom.window.close()
})

function fakeManager({ version = '0.1.2', source = 'git+https://github.com/noire113-dev/deepseek-harness-kr.git', install, remove } = {}) {
  const calls = []
  return {
    calls,
    async listBundles() { return { ok: true, value: [{ name: 'other', version: '9.9.9' }, { name: 'deepseek-harness-kr', version, source }] } },
    async installBundle(spec, options) { calls.push(['install', spec, options]); return install ? install(spec, options, calls) : { ok: true, value: { application: 'restart-required', restartReason: 'no-hmr', changed: true } } },
    async removeBundle(name) { calls.push(['remove', name]); return remove ? remove(name) : { ok: true, value: { application: 'applied', changed: true } } },
    async waitForInstall() { return { ok: true, value: null } },
  }
}
const settle = () => new Promise((resolve) => setTimeout(resolve, 0))
const memoryStorage = () => { let v = null; return { read: () => v, write: (x) => { v = x }, clear: () => { v = null }, get value() { return v } } }
const remoteVersion = (version) => async () => ({ ok: true, status: 200, json: async () => ({ version }) })

test('updater asks for confirmation, then updates through installBundle with the installed source', async () => {
  const h = clientHarness(); after(() => h.dom.window.close())
  const { createUpdater } = h.client.internals
  const urls = []
  const updater = createUpdater({ storage: memoryStorage(), fetch: async (url) => { urls.push(url); return { ok: true, status: 200, json: async () => ({ version: '0.1.3' }) } } })
  const manager = fakeManager()
  updater.attach(manager); await settle()
  assert.deepEqual(urls, ['https://raw.githubusercontent.com/noire113-dev/deepseek-harness-kr/HEAD/package.json'])
  assert.equal(updater.getSnapshot().phase, 'available')
  assert.equal(updater.getSnapshot().current, '0.1.2')
  assert.equal(updater.getSnapshot().latest, '0.1.3')
  updater.update()
  assert.equal(updater.getSnapshot().phase, 'confirm')
  assert.equal(manager.calls.length, 0, 'nothing runs before confirmation')
  updater.cancel()
  assert.equal(updater.getSnapshot().phase, 'available')
  updater.update(); await updater.confirm()
  assert.deepEqual(manager.calls.map((c) => c[0]), ['install'])
  assert.equal(manager.calls[0][1], 'git+https://github.com/noire113-dev/deepseek-harness-kr.git')
  assert.equal(manager.calls[0][2].enabled, true)
  assert.equal(updater.getSnapshot().phase, 'restart')
  updater.update(); await updater.confirm()
  assert.equal(manager.calls.length, 1, 'no second install after the update finished')
})

test('updater removes and reinstalls when Harness refuses to reinstall an installed bundle', async () => {
  const h = clientHarness(); after(() => h.dom.window.close())
  const { createUpdater } = h.client.internals
  const storage = memoryStorage(), seen = []
  const manager = fakeManager({
    install: async (spec, options, calls) => {
      seen.push(storage.value)
      return calls.filter((c) => c[0] === 'install').length === 1
        ? { ok: true, value: { application: 'failed', error: { code: 'already-installed' } } }
        : { ok: true, value: { application: 'applied', changed: true } }
    },
  })
  const updater = createUpdater({ storage, fetch: remoteVersion('0.1.3') })
  updater.attach(manager); await settle()
  updater.update(); await updater.confirm()
  assert.deepEqual(manager.calls.map((c) => c[0]), ['install', 'remove', 'install'])
  assert.equal(manager.calls[1][1], 'deepseek-harness-kr')
  assert.equal(manager.calls[0][2].requestId, manager.calls[2][2].requestId)
  assert.equal(seen[1]?.to, '0.1.3', 'pending update is saved before the bundle is removed')
  assert.equal(storage.value, null)
  assert.equal(updater.getSnapshot().phase, 'updated')
  const stopped = createUpdater({ storage: memoryStorage(), fetch: remoteVersion('0.1.3') })
  const blocked = fakeManager({ install: async () => ({ ok: true, value: { application: 'failed', error: { code: 'already-installed' } } }), remove: async () => ({ ok: true, value: { application: 'failed', error: { code: 'stop-profile' } } }) })
  stopped.attach(blocked); await settle(); stopped.update(); await stopped.confirm()
  assert.deepEqual(blocked.calls.map((c) => c[0]), ['install', 'remove'], 'a refused removal does not reinstall')
  assert.equal(stopped.getSnapshot().phase, 'update-failed')
  assert.match(stopped.getSnapshot().error, /stop-profile/)
})

test('a reloaded plugin picks up the result of the update the previous instance started', async () => {
  const h = clientHarness(); after(() => h.dom.window.close())
  const { createUpdater } = h.client.internals
  const storage = memoryStorage()
  storage.write({ requestId: 'r1', from: '0.1.0', to: '0.1.2', source: 'x', at: Date.now() })
  const updater = createUpdater({ storage, fetch: remoteVersion('0.1.2') })
  updater.attach(fakeManager({ version: '0.1.2' })); await settle()
  assert.equal(updater.getSnapshot().phase, 'updated')
  assert.equal(updater.getSnapshot().from, '0.1.0')
  assert.equal(storage.value, null)
  const stale = memoryStorage()
  stale.write({ requestId: 'r2', from: '0.1.0', to: '0.1.2', source: 'x', at: Date.now() - 60 * 60 * 1000 })
  const later = createUpdater({ storage: stale, fetch: remoteVersion('0.1.2') })
  later.attach(fakeManager({ version: '0.1.0' })); await settle()
  assert.equal(later.getSnapshot().phase, 'available', 'an old pending record is ignored')
  assert.equal(stale.value, null)
})

test('updater reports current, unsupported, pinned, failures and a missing manager without installing', async () => {
  const h = clientHarness(); after(() => h.dom.window.close())
  const { createUpdater } = h.client.internals
  const run = async (options, manager) => { const u = createUpdater({ storage: memoryStorage(), ...options }); u.attach(manager); await settle(); return u }
  assert.equal((await run({ fetch: remoteVersion('0.1.2') }, fakeManager())).getSnapshot().phase, 'current')
  assert.equal((await run({ fetch: remoteVersion('0.1.1') }, fakeManager())).getSnapshot().phase, 'current', 'older remote is not an update')
  assert.equal((await run({ fetch: remoteVersion('9.0.0') }, fakeManager({ source: 'C:/local/deepseek-harness-kr' }))).getSnapshot().phase, 'unsupported')
  assert.equal((await run({ fetch: remoteVersion('9.0.0') }, fakeManager({ source: 'git+https://github.com/a/b.git#6675ac2616c3' }))).getSnapshot().phase, 'pinned')
  const offline = await run({ fetch: async () => ({ ok: false, status: 404 }) }, fakeManager())
  assert.equal(offline.getSnapshot().phase, 'check-failed')
  assert.match(offline.getSnapshot().error, /404/)
  const failing = await run({ fetch: remoteVersion('0.1.3') }, fakeManager({ install: async () => ({ ok: true, value: { application: 'failed', error: { code: 'network', diagnostic: 'offline' } } }) }))
  failing.update(); await failing.confirm()
  assert.equal(failing.getSnapshot().phase, 'update-failed')
  assert.match(failing.getSnapshot().error, /network: offline/)
  const none = createUpdater({ storage: memoryStorage(), fetch: remoteVersion('9.0.0') })
  await none.check(); none.update(); await none.confirm()
  assert.equal(none.getSnapshot().phase, 'unavailable')
  const detached = await run({ fetch: remoteVersion('0.1.3') }, fakeManager())
  detached.detach(); detached.update(); await detached.confirm()
  assert.equal(detached.getSnapshot().phase, 'unavailable')
})

test('settings page shows the update section and still works without the plugin manager', () => {
  const h = clientHarness({ character: true, theme: true, translation: true })
  try {
    const ctx = h.ctx(); h.client.apply(ctx)
    const Page = h.pages.get(packageName + '#deepseek-harness-kr')
    const html = renderToStaticMarkup(React.createElement(Page, { view: 'page' }))
    assert.match(html, /aria-label="Updates"/)
    assert.match(html, /Plugin manager is unavailable/)
    assert.equal((html.match(/role="switch"/g) || []).length, 9)
    assert.match(html, /Extra dialogue/)
    ctx.dispose()
  } finally { h.dom.window.close() }
})

// ---------- 말풍선 음성 (TTS) ----------

test('voice settings default to off with no endpoint, model or voice', () => {
  const tts = readLive(Config({}).tts)
  assert.equal(tts.enabled, false)
  assert.deepEqual([tts.openai.baseUrl, tts.openai.model, tts.openai.voice], ['', '', ''])
  assert.equal(tts.openai.apiKeyEnv, 'DSH_TTS_API_KEY')
  assert.equal(tts.stream.pcmSampleRate, 24000)
  assert.deepEqual(tts.voiceLines, { reactions: true, status: false, mutters: false, others: true })
})

test('Host speech routes read live settings and stay 404 while disabled', async () => {
  const live = (value) => ({ get: () => value, set(next) { value = next } })
  const enabled = live(false), baseUrl = live(''), rate = live(24000)
  const routes = new Map(), disposers = []
  hostApply({ connection: { requestRejection: () => undefined }, effect(fn) { disposers.push(fn()) }, webServer: { register(route) { routes.set(route.path, route.handler); return () => {} } } },
    { tts: { enabled, openai: { baseUrl, apiKeyEnv: live('') }, stream: { pcmSampleRate: rate } } }, { applyIcon: async () => ({}) })
  const server = createServer((req, res) => (routes.get(req.url) ?? ((_, r) => r.writeHead(404).end()))(req, res))
  server.listen(0, '127.0.0.1'); await once(server, 'listening')
  const url = 'http://127.0.0.1:' + server.address().port
  try {
    assert.equal((await fetch(url + '/dsh-tts/state')).status, 404)
    enabled.set(true)
    assert.equal((await (await fetch(url + '/dsh-tts/state')).json()).enabled, false, 'on without a URL stays detached')
    baseUrl.set('http://127.0.0.1:9/v1'); rate.set(44100)
    assert.deepEqual(await (await fetch(url + '/dsh-tts/state')).json(), { enabled: true, pcmSampleRate: 44100, voiceLines: { reactions: true, status: false, mutters: false, others: true } })
  } finally { server.closeAllConnections(); await new Promise((resolve) => server.close(resolve)); disposers.forEach((dispose) => dispose?.()) }
})

/** 음성(/dsh-tts/) 요청인지. 캐릭터가 받는 대사 파일(assets/dsc-lines.json) 요청은 음성과 상관없어 세지 않는다 */
const voiceUrl = (url) => String(url).startsWith('/dsh-tts/')

function voiceFetch(h) {
  const calls = []
  h.dom.window.fetch = async (url, init) => {
    if (voiceUrl(url)) calls.push(init?.body ? [url, JSON.parse(init.body).text] : [url])
    if (url === '/dsh-tts/state') return { ok: true, status: 200, json: async () => ({ enabled: true, pcmSampleRate: 24000, voiceLines: { reactions: true, others: true } }) }
    return { ok: false, status: 503, body: null }
  }
  return calls
}

test('voice attaches with the character, a URL and the switch, and follows setting changes', async () => {
  const h = clientHarness({ tts: { enabled: false, openai: { baseUrl: 'http://tts/v1' } } })
  try {
    const calls = voiceFetch(h)
    const ctx = h.ctx(); h.client.apply(ctx)
    const say = (text) => h.dom.window.dispatchEvent(new h.dom.window.CustomEvent('dsc:say', { detail: { text, ms: 0, kind: 'reaction' } }))
    await settle()
    assert.equal(calls.length, 0, 'nothing is requested while the switch is off')
    await h.form.mutate([{ op: 'set', path: ['tts', 'enabled'], value: true }])
    await settle()
    assert.deepEqual(calls, [['/dsh-tts/state']])
    say('안녕'); await settle()
    assert.deepEqual(calls.at(-1), ['/dsh-tts/speak', '안녕'])
    await h.form.mutate([{ op: 'set', path: ['tts', 'stream', 'pcmSampleRate'], value: 44100 }])
    await settle()
    assert.equal(calls.filter(([url]) => url === '/dsh-tts/state').length, 2, 'a playback setting change re-reads the state')
    await h.form.mutate([{ op: 'set', path: ['tts', 'openai', 'model'], value: 'x' }])
    await settle()
    assert.equal(calls.filter(([url]) => url === '/dsh-tts/state').length, 2, 'request-only settings need no reattach')
    await h.form.set('character', false)
    const before = calls.length
    say('들리면 안 됨'); await settle()
    assert.equal(calls.length, before, 'no character, no voice')
    ctx.dispose()
  } finally { h.dom.window.close() }
})

test('voice disposed before its state arrives never starts listening', async () => {
  const h = clientHarness({ tts: { enabled: true, openai: { baseUrl: 'http://tts/v1' } } })
  try {
    let release
    const calls = []
    h.dom.window.fetch = (url) => { if (voiceUrl(url)) calls.push(url); return url === '/dsh-tts/state' ? new Promise((resolve) => { release = resolve }) : Promise.resolve({ ok: false, status: 503, body: null }) }
    const ctx = h.ctx(); h.client.apply(ctx)
    ctx.dispose()
    release({ ok: true, status: 200, json: async () => ({ enabled: true, pcmSampleRate: 24000, voiceLines: { reactions: true } }) })
    await settle(); await settle()
    h.dom.window.dispatchEvent(new h.dom.window.CustomEvent('dsc:say', { detail: { text: 'late', ms: 0, kind: 'reaction' } }))
    await settle()
    assert.deepEqual(calls, ['/dsh-tts/state'])
  } finally { h.dom.window.close() }
})

test('settings page shows the voice section without needing a YAML edit', () => {
  const h = clientHarness({ tts: { enabled: true, openai: { baseUrl: '', extraBody: { speed: 1.1 }, timeoutMs: 30000 } } })
  try {
    const ctx = h.ctx(); h.client.apply(ctx)
    const Page = h.pages.get(packageName + '#deepseek-harness-kr')
    const html = renderToStaticMarkup(React.createElement(Page, { view: 'page' }))
    assert.match(html, /aria-label="Speech bubble voice"/)
    for (const label of ['Read speech bubbles aloud', 'API address', 'API key', 'Model', 'Voice ID', 'Sample rate \\(Hz\\)', 'Extra request values \\(JSON\\)', 'Advanced', 'Extra headers \\(JSON\\)', 'Line prefix', 'Response timeout \\(seconds\\)', 'API key name']) assert.match(html, new RegExp(label))
    for (const group of ['Connection', 'Voice', 'Lines to read']) assert.match(html, new RegExp('role="group" aria-label="' + group + '"'))
    assert.match(html, /min="8000" max="48000" step="1"/)
    assert.match(html, /min="1" max="600" step="0.001"/)
    assert.match(html, /Response timeout \(seconds\)<\/span><input[^>]*value="30"/, 'timeout is shown in seconds')
    assert.ok(html.indexOf('Extra request values') > html.indexOf('<summary'), 'extra request values live under Advanced')
    assert.match(html, /Enter an API address to hear speech/)
    assert.match(html, /&quot;speed&quot;: 1.1/)
    assert.match(html, /AI-generated voice/)
    assert.match(html, /credential store is unavailable/)
    assert.match(html, /type="password"/)
    assert.equal((html.match(/role="switch"/g) || []).length, 9, 'feature, mobile, intro, icon, extra lines, sleep and canvas switches are present')
    assert.match(html, /Extra dialogue/)
    ctx.dispose()
  } finally { h.dom.window.close() }
})

test('voice helpers: JSON objects only, attach signature, and a key store that never holds the value', async () => {
  const h = clientHarness(); after(() => h.dom.window.close())
  const { parseJsonObject, ttsSignature, createKeyStore } = h.client.internals
  assert.deepEqual({ ...parseJsonObject('  ', false).value }, {})
  assert.equal(parseJsonObject('{"speed":1.2}', false).value.speed, 1.2)
  for (const bad of ['[1]', '"x"', '{bad', 'null']) assert.ok(parseJsonObject(bad, false).error, bad)
  const on = { tts: { enabled: true, openai: { baseUrl: 'http://a' } } }
  assert.notEqual(ttsSignature(on), null)
  assert.equal(ttsSignature({ ...on, character: false }), null)
  assert.equal(ttsSignature({ tts: { enabled: true, openai: { baseUrl: '' } } }), null)
  assert.equal(ttsSignature({ tts: { ...on.tts, enabled: false } }), null)
  const stored = new Map()
  const remote = {
    async describe(refs) { return { ok: true, value: Object.fromEntries(refs.map((ref) => [ref, { configured: stored.has(ref), source: stored.has(ref) ? 'store' : undefined, writable: true }])) } },
    async set(ref, value) { stored.set(ref, value); return { ok: true } },
  }
  const keys = createKeyStore()
  assert.equal(keys.getSnapshot().available, false)
  assert.equal(await keys.save('sk-1'), false, 'no store, nothing saved')
  keys.attach(remote); await settle()
  assert.equal(keys.getSnapshot().configured, false)
  assert.equal(await keys.save('sk-secret'), true)
  assert.deepEqual({ ...keys.getSnapshot() }, { available: true, configured: true, source: 'store' })
  assert.equal(stored.get('DSH_TTS_API_KEY'), 'sk-secret')
  assert.doesNotMatch(JSON.stringify(keys.getSnapshot()), /sk-secret/)
  keys.setRef('OTHER_KEY'); await settle()
  assert.equal(keys.getSnapshot().configured, false)
  keys.detach()
  assert.equal(keys.getSnapshot().available, false)
})
