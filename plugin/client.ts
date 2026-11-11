// DSH 페이지 쪽 플러그인 진입점. 캐릭터·테마·번역·설정 화면을 기능별 수명으로 붙이고 뗀다.
// plugin/build.mjs가 이 파일을 묶어 lib/client.js(DSH 모듈 로더 형식)로 만든다.
import React from 'react'
import { name as PLUGIN_ID } from '../package.json'
import { createCharacter } from '../character/index.ts'
import { createLifetime } from '../character/lifetime.ts'
import { log } from '../character/log.ts'
import * as ttsClient from '../plugins/dsh-tts/src/client/index.js'
import KOREAN_DICTIONARIES from './locales.ko.json'
import { OUTFIT_ITEMS, BODY_TYPES as BODY_TYPE_ITEMS } from '../shared/settings.js'
import type { Lifetime } from '../character/lifetime.ts'
import type { CharacterApi, CharacterPrefs } from '../character/types.ts'
import type { ConfigForm, CredentialService, DshContext, InstallOutcome, PluginManager, RemoteError } from './dsh-types.ts'

/** 이 플러그인의 설정값 (스키마는 plugin/host.js). 소품·옷 키는 OUTFIT_ITEMS에서 오므로 이름으로도 읽는다 */
interface PluginSettings {
  [field: string]: unknown
  character?: boolean
  mobileCharacter?: boolean
  intro?: boolean
  appIcon?: boolean
  theme?: boolean
  translation?: boolean
  bodyType?: string
  extraLines?: boolean
  idleSleep?: boolean
  idleSleepMinutes?: number | string
  characterToggleKey?: string
  petToggleKey?: string
  canvasToggle?: boolean
  canvasToggleKey?: string
  dragKey?: string
  avatarModelDir?: string
  avatarOutline?: string
  avatarBrowScale?: number | string
  avatarBrowSmooth?: number | string
  avatarAo?: boolean
  avatarAoStrength?: number | string
  tts?: TtsSettings
}
/** 말풍선 음성 설정 (plugins/dsh-tts 설정과 같은 모양) */
interface TtsSettings {
  enabled?: boolean
  openai?: {
    baseUrl?: string; model?: string; voice?: string; extraBody?: Record<string, unknown>; headers?: Record<string, string>
    textPrefix?: string; timeoutMs?: number; apiKeyEnv?: string
  }
  stream?: { pcmSampleRate?: number }
  voiceLines?: Record<string, boolean>
  cache?: { enabled?: boolean }
}
/** 단축키 해석에 쓰는 키 입력 (KeyboardEvent·React 키 이벤트·테스트의 일반 객체) */
interface KeyInput { key: string; ctrlKey?: boolean; altKey?: boolean; shiftKey?: boolean; metaKey?: boolean }
/** 녹음 중 키 입력 하나에 대한 동작 (shortcutKeyDown·dragKeyDown) */
type RecordKeyAction = { action: 'leave' } | { action: 'cancel' } | { action: 'clear' } | { action: 'wait'; held: string }
type ShortcutKeyAction = RecordKeyAction | { action: 'save'; combo: string }
type DragKeyAction = RecordKeyAction | { action: 'save'; key: string }

const ROOT = '/deepseek-harness-kr/assets/'
const SLOT = '__deepseekHarnessKrDispose'
const ENTRY_ID = 'deepseek-harness-kr'
// 소품·옷 (데스크톱 펫 메뉴와 같은 항목, 세숫대야·앞으로 숙이기는 뺌)과 체형
const OUTFIT_FIELDS = OUTFIT_ITEMS.map(({ key, ko, en }) => [key, ko, en])
const BODY_TYPES = BODY_TYPE_ITEMS.map(({ key, ko, en }) => [key, ko, en])
// 이 두 화면에서는 창 안 캐릭터만 숨긴다 (대화 화면과 바깥 펫 창은 그대로).
// 패널 id는 URL이 아니라 layout 서비스의 activePanelId로 판정한다.
const HIDDEN_IN_WINDOW_PANELS = new Set<string | undefined>(['plugins', 'schedules'])
/** 지금 열린 패널에서 창 안 캐릭터를 숨길지 여부 */
const panelHidesInWindowCharacter = (activePanelId: string | undefined) => HIDDEN_IN_WINDOW_PANELS.has(activePanelId)
/**
 * 절전 전 대기 시간(분)을 0.5~60 범위로 정리. 숫자가 아니면 1
 * @param value 설정값(없으면 1)
 */
const sleepMinutes = (value: number | string | undefined) => {
  const n = Number(value ?? 1)
  return Number.isFinite(n) ? Math.min(60, Math.max(0.5, n)) : 1
}
/**
 * 숫자 설정값을 범위 안으로 정리. 숫자가 아니면 기본값
 * @param value 설정값 @param min·max 범위 @param fallback 기본값
 */
const inRange = (value: number | string | undefined, min: number, max: number, fallback: number) => {
  const n = Number(value ?? fallback)
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback
}
/** 3D 눈썹 움직임 세기(배율 0~2, 기본 1) @param value 설정값 */
const browScale = (value: number | string | undefined) => inRange(value, 0, 2, 1)
/** 3D 눈썹 부드럽게 따라가는 시간(ms 0~300, 기본 80) @param value 설정값 */
const browSmoothMs = (value: number | string | undefined) => inRange(value, 0, 300, 80)
/** 3D 구운 AO 세기(0~1, 기본 0.6) @param value 설정값 */
const aoStrength = (value: number | string | undefined) => inRange(value, 0, 1, 0.6)
// ---------- 단축키 ----------
// 설정 칸을 눌러 원하는 키 조합을 그대로 눌러 등록하고, 실제 입력도 같은 규칙으로 해석한다.
const SHORTCUT_HINT_ID = 'deepseek-harness-kr-shortcut-hint'
const PET_SHORTCUT_HINT_ID = 'deepseek-harness-kr-pet-shortcut-hint'
const DRAG_HINT_ID = 'deepseek-harness-kr-drag-hint'
const CANVAS_HINT_ID = 'deepseek-harness-kr-canvas-hint'
const MODIFIER_KEYS = new Set(['Control', 'Shift', 'Alt', 'Meta', 'AltGraph', 'CapsLock'])
const MODIFIER_ALIASES = new Map<string, 'ctrl' | 'shift' | 'alt' | 'meta'>([
  ['ctrl', 'ctrl'], ['control', 'ctrl'],
  ['shift', 'shift'],
  ['alt', 'alt'], ['option', 'alt'],
  ['meta', 'meta'], ['cmd', 'meta'], ['command', 'meta'], ['win', 'meta'], ['windows', 'meta'],
])
/** 지금 기기의 macOS·iOS 여부 (Meta 키를 Cmd로 표시할지 판단) */
const isMacPlatform = () => /Mac|iPhone|iPad|iPod/i.test(typeof navigator === 'object' && navigator ? String(navigator.platform || navigator.userAgent || '') : '')
/** 문자열 키의 저장·비교용 토큰 변환. Space·+는 이름으로 바꿔 '+' 구분자와 겹침 방지 */
const shortcutKeyToken = (key: string | undefined) => {
  const text = String(key ?? '')
  if (text === ' ') return 'space'
  if (text === '+') return 'plus'
  return text.toLowerCase()
}
/**
 * 저장된 문자열("Ctrl+Shift+D")의 비교용 조합 변환
 * @returns 수식 키 여부와 키 토큰. 키가 없으면(수식 키만) null
 */
function parseShortcut(value: unknown) {
  const combo = { ctrl: false, shift: false, alt: false, meta: false, key: '' }
  for (const raw of String(value ?? '').split('+')) {
    const token = raw.trim()
    if (!token) continue
    const modifier = MODIFIER_ALIASES.get(token.toLowerCase())
    if (modifier) combo[modifier] = true
    else combo.key = shortcutKeyToken(token)
  }
  return combo.key ? combo : null
}
/**
 * 실제 키 입력의 저장용 문자열 변환
 * @returns "Ctrl+Shift+D" 같은 문자열. 수식 키만 눌렀으면 ''
 */
function shortcutFromEvent(event: KeyInput) {
  const key = String(event?.key ?? '')
  if (!key || MODIFIER_KEYS.has(key)) return ''
  const parts: string[] = []
  if (event.ctrlKey) parts.push('Ctrl')
  if (event.altKey) parts.push('Alt')
  if (event.shiftKey) parts.push('Shift')
  if (event.metaKey) parts.push(isMacPlatform() ? 'Cmd' : 'Meta')
  parts.push(key === ' ' ? 'Space' : key === '+' ? 'Plus' : key.length === 1 ? key.toUpperCase() : key)
  return parts.join('+')
}
/**
 * 키 입력과 저장된 단축키의 일치 여부. 수식 키 구성까지 정확히 같아야 일치
 * @param value 저장된 단축키 문자열
 */
function matchesShortcut(value: unknown, event: KeyInput | null | undefined) {
  const combo = parseShortcut(value)
  if (!combo || !event) return false
  return combo.ctrl === !!event.ctrlKey && combo.alt === !!event.altKey && combo.shift === !!event.shiftKey
    && combo.meta === !!event.metaKey && combo.key === shortcutKeyToken(event.key)
}
/** 지금 누르고 있는 수식 키 표시 문자열 ("Ctrl+Shift" 등, 녹음 중 안내용) */
const heldModifiers = (event: KeyInput) => {
  const parts: string[] = []
  if (event.ctrlKey) parts.push('Ctrl')
  if (event.altKey) parts.push('Alt')
  if (event.shiftKey) parts.push('Shift')
  if (event.metaKey) parts.push(isMacPlatform() ? 'Cmd' : 'Meta')
  return parts.join('+')
}
/**
 * 단축키 녹음 중 키 입력 하나의 동작 변환. 화면 없이도 검사할 수 있는 순수 함수
 * leave: 탭은 포커스를 옮기도록 그냥 둠 · cancel: Esc · clear: Backspace/Delete · wait: 수식 키만 · save: 조합 완성
 */
function shortcutKeyDown(event: KeyInput): ShortcutKeyAction {
  if (event.key === 'Tab') return { action: 'leave' }
  if (event.key === 'Escape') return { action: 'cancel' }
  if (event.key === 'Backspace' || event.key === 'Delete') return { action: 'clear' }
  const combo = shortcutFromEvent(event)
  return combo ? { action: 'save', combo } : { action: 'wait', held: heldModifiers(event) }
}

// 이동 키는 단일 키만 쓴다: 수식 키 하나는 떼는 순간(wait → keyup에서 저장), 그 밖의 키 하나는 누르는 순간 저장.
const MODIFIER_LABELS = new Map([['Control', 'Ctrl'], ['Alt', 'Alt'], ['Shift', 'Shift'], ['Meta', isMacPlatform() ? 'Cmd' : 'Meta']])
const DRAG_KEY_LABELS = new Map([[' ', 'Space'], ['+', 'Plus']])
/**
 * 이동 키 녹음 중 키 입력 하나의 동작 변환. 단일 키만 등록
 * 수식 키 하나는 wait로 두었다가 keyup에서 저장, 그 밖의 키 하나는 누르는 순간 save
 */
function dragKeyDown(event: KeyInput): DragKeyAction {
  if (event.key === 'Tab') return { action: 'leave' }
  if (event.key === 'Escape') return { action: 'cancel' }
  if (event.key === 'Backspace' || event.key === 'Delete') return { action: 'clear' }
  const modifier = MODIFIER_LABELS.get(event.key)
  if (modifier) return { action: 'wait', held: modifier }
  // 수식 키와 다른 키를 함께 누르면(조합) 이동 키로 쓰지 않는다 — 수식 키 하나만 떼어 저장하게 둔다
  if (event.ctrlKey || event.altKey || event.shiftKey || event.metaKey) return { action: 'wait', held: heldModifiers(event) }
  const key = String(event.key ?? '')
  if (!key) return { action: 'wait', held: '' }
  const label = DRAG_KEY_LABELS.get(key) ?? (key.length === 1 ? key.toUpperCase() : key)
  return { action: 'save', key: label }
}

/**
 * 플러그인 assets의 스타일시트 연결. 수명이 끝나면 제거
 * @param file assets 폴더 안 파일 이름
 */
function stylesheet(life: Lifetime, file: string) {
  const link = document.createElement('link')
  link.rel = 'stylesheet'; link.href = ROOT + file
  document.head.appendChild(link)
  life.add(() => link.remove())
}

/**
 * DSH 화면 요소(입력 카드·보내기·새 세션 버튼)에 dsc- 클래스 표시. 화면이 바뀌면 프레임마다 한 번 다시 표시
 * 수명이 끝나면 이 기능이 붙인 클래스만 제거
 */
function mountLayout(life: Lifetime) {
  const owned = new Map<Element, Set<string>>()
  /** 요소에 클래스 추가와 붙인 기록 (원래 있던 클래스는 기록하지 않음) */
  const mark = (node: Element, name: string) => {
    if (node.classList.contains(name)) return
    node.classList.add(name)
    if (!owned.has(node)) owned.set(node, new Set())
    owned.get(node)!.add(name)
  }
  /** 지금 화면의 대상 요소 전체 표시 */
  const tag = () => {
    document.querySelectorAll('[class*="_card"]').forEach((node) => {
      if (node.closest('[class*="_root"]') && node.querySelector('[class*="_input"]')) mark(node, 'dsc-composer')
    })
    document.querySelectorAll('button[aria-label="메시지 보내기"], button[aria-label="Send message"]').forEach((node) => mark(node, 'dsc-send'))
    document.querySelectorAll('button[class*="_newSession"]').forEach((node) => mark(node, 'dsc-newsession'))
  }
  tag()
  let queued = false
  life.observe(() => {
    if (queued) return
    queued = true
    life.frame(() => { queued = false; tag() })
  }).observe(document.body, { childList: true, subtree: true })
  life.add(() => { for (const [node, names] of owned) for (const name of names) node.classList.remove(name) })
}

/** 파스텔 테마 스타일시트 연결. 뗄 때 DSH 테마의 색 구성에 맞춰 data-ds-dark-theme 속성 복원 */
function mountTheme(ctx: DshContext, life: Lifetime) {
  stylesheet(life, 'theme.css')
  life.add(() => {
    if (ctx.theme.getTheme().active.colorScheme === 'dark') document.body.setAttribute('data-ds-dark-theme', '')
    else document.body.removeAttribute('data-ds-dark-theme')
  })
}

/** 한국어 언어팩 연결: 줄바꿈 스타일, 한국어 언어 항목(없을 때만), 네임스페이스별 사전 등록 */
function mountTranslation(ctx: DshContext, life: Lifetime) {
  stylesheet(life, 'korean.css')   // 한국어 화면 줄바꿈 (낱말 중간에서 끊지 않음)
  if (!ctx.locale.getLocale().locales.some((locale) => locale.id.toLowerCase() === 'ko')) {
    life.add(ctx.locale.addLanguage({ id: 'ko', label: '한국어', fallback: 'en' }))
  }
  for (const [namespace, dictionary] of Object.entries(KOREAN_DICTIONARIES)) {
    life.add(ctx.locale.register(namespace, 'ko', dictionary))
  }
}

/**
 * 캐릭터 연결 생성. 설정값·패널 숨김 상태를 들고 있다가, 캐릭터 기능이 켜지면 넘겨주고 바뀔 때마다 전달
 * 단축키·설정 화면은 이 객체를 통해서만 캐릭터 호출 (window 전역 미사용). apply마다 하나씩 생성
 */
function createCharacterLink() {
  let character: CharacterApi | null = null, prefs: CharacterPrefs = {}, pageHidden = false
  return {
    /** 지금 붙어 있는 캐릭터 API (없으면 null) */
    get character() { return character },
    /** 마지막으로 받은 캐릭터 설정값 */
    get prefs() { return prefs },
    /** 지금 패널 때문에 창 안 캐릭터를 숨기는 중인지 여부 */
    get pageHidden() { return pageHidden },
    /**
     * 캐릭터 API 연결
     * @returns 떼는 함수. 그사이 다른 캐릭터가 붙었으면 건드리지 않음
     */
    attach(next: CharacterApi) { character = next; return () => { if (character === next) character = null } },
    /** 설정값 보관과 붙어 있는 캐릭터에 전달 */
    setPrefs(next: CharacterPrefs) { prefs = next; character?.setPrefs(next) },
    /** 패널 숨김 상태 변경. 바뀌었을 때만 캐릭터에 전달 */
    setPageHidden(next: boolean) {
      if (pageHidden === next) return
      pageHidden = next
      character?.setPrefs({ pageHidden })
    },
    /** 캐릭터가 처음 뜰 때 쓸 설정값 (설정값 + 패널 숨김 상태) */
    initialPrefs() { return { ...prefs, pageHidden } },
  }
}
type CharacterLink = ReturnType<typeof createCharacterLink>

/** 플러그인 설정값 → 캐릭터가 읽는 값 변환 (순수 함수) */
function characterPrefs(value: PluginSettings) {
  return {
    // 캐릭터는 매 프레임 이 값을 읽어 소품·옷·체형을 바로 바꾼다 (다시 띄우지 않음)
    outfit: Object.fromEntries([...OUTFIT_FIELDS.map(([field]) => [field, value[field] === true]), ['bodyType', value.bodyType || 'default']]),
    // 절전: 캐릭터의 상태 감시 인터벌이 읽음
    sleep: { enabled: value.idleSleep !== false, minutes: sleepMinutes(value.idleSleepMinutes) },
    // 시작 등장 연출 여부: 캐릭터가 처음 뜰 때 읽는다 (끄면 가운데 인사 없이 바로 제자리에)
    intro: { enabled: value.intro !== false },
    // 모바일(터치 전용) 화면에서 캐릭터를 숨길지: 캐릭터가 매 프레임 읽는다 (기본 표시)
    mobile: { enabled: value.mobileCharacter !== false },
    // 실험: 3D 모델 폴더가 있으면 창 안 캐릭터를 3D 렌더러로 (캐릭터가 처음 뜰 때만 읽음). 눈썹 세기·부드러움은 매 프레임 읽음
    avatar: { enabled: typeof value.avatarModelDir === 'string' && value.avatarModelDir.trim() !== '', outline: value.avatarOutline === 'model' ? 'model' as const : 'smooth' as const,
      browScale: browScale(value.avatarBrowScale), browSmooth: browSmoothMs(value.avatarBrowSmooth) / 1000,
      // 구운 AO: 켜기는 처음 뜰 때만, 세기는 매 프레임 읽음
      ao: value.avatarAo === true, aoStrength: aoStrength(value.avatarAoStrength) },
    // 캐릭터 이동 보조 키: 포인터 이벤트마다 읽는다. 빈 문자열이면 '이동 키 없음'
    drag: { key: value.dragKey ?? 'Alt' },
    // '대사 ex': 켜면 assets/dsc-lines-ex.json의 대사를 덮어쓴다 (기본 꺼짐)
    extra: { enabled: value.extraLines === true },
  }
}

/**
 * 창 안 캐릭터 띄우기와 캐릭터 연결에 붙이기. 수명이 끝나면 함께 정리
 * @param onSetting 바깥 펫 창 메뉴·설정 패널이 바꾼 설정값을 받는 함수
 */
function startCharacter(life: Lifetime, link: CharacterLink, onSetting: (key: string, value: unknown) => void) {
  stylesheet(life, 'character.css')
  const character = createCharacter({ base: ROOT, life, prefs: link.initialPrefs(), onSetting })
  life.add(link.attach(character))
}
// ---------- 플러그인 업데이트 ----------
// 설치 주소(GitHub)의 package.json 버전과 설치된 버전을 비교하고, Harness 플러그인 관리자의
// installBundle(설치할 때와 같은 기능)을 같은 설치 주소로 다시 불러 최신 커밋을 받는다.

/**
 * GitHub 설치 주소 해석 (github:owner/repo#ref, https·ssh·git+ 주소)
 * @returns { owner, repo, ref }. GitHub이 아니면 null
 */
function githubSource(spec: string | null) {
  if (typeof spec !== 'string') return null
  const text = spec.trim()
  const short = text.match(/^github:([\w.-]+)\/([\w.-]+?)(?:\.git)?(?:#(.+))?$/i)
  const full = text.match(/^(?:git\+)?(?:https?:\/\/|ssh:\/\/git@|git@)github\.com[/:]([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?(?:#(.+))?$/i)
  const match = short || full
  return match ? { owner: match[1], repo: match[2], ref: match[3] || null } : null
}

/**
 * "1.2.3" 형식 버전 비교. 뒤에 붙은 -rc 등은 같은 번호의 정식 버전보다 낮게 취급
 * @returns 앞이 크면 양수, 같으면 0, 뒤가 크면 음수
 */
function compareVersions(left: string | null | undefined, right: string | null | undefined) {
  /** 버전 문자열 → 숫자 부분 목록과 - 뒤 꼬리표(없으면 null) */
  const parse = (version: string | null | undefined) => {
    const [core, prerelease] = String(version ?? '').trim().replace(/^v/i, '').split('-', 2)
    return { nums: core.split('.').map((n) => parseInt(n, 10) || 0), pre: prerelease ?? null }
  }
  const x = parse(left), y = parse(right)
  for (let i = 0; i < Math.max(x.nums.length, y.nums.length, 3); i++) {
    const difference = (x.nums[i] ?? 0) - (y.nums[i] ?? 0)
    if (difference) return difference
  }
  if (x.pre === y.pre) return 0
  if (x.pre === null) return 1
  if (y.pre === null) return -1
  return x.pre < y.pre ? -1 : 1
}

const PENDING_KEY = 'deepseek-harness-kr:update'
/** 제거 → 다시 설치 업데이트 동안 localStorage에 남겨 두는 요청 (새 화면이 이어받는다) */
interface PendingUpdate { requestId?: unknown; from?: string | null; to?: string | null; source?: string; at?: number }
const browserStorage = {
  /** 남겨 둔 업데이트 요청 읽기 (없거나 읽지 못하면 null) */
  read(): PendingUpdate | null { try { return JSON.parse(window.localStorage.getItem(PENDING_KEY) || 'null') } catch { return null } },
  /** 업데이트 요청 남기기 (저장소를 못 쓰면 무시) */
  write(value: PendingUpdate) { try { window.localStorage.setItem(PENDING_KEY, JSON.stringify(value)) } catch {} },
  /** 남겨 둔 업데이트 요청 지우기 */
  clear() { try { window.localStorage.removeItem(PENDING_KEY) } catch {} },
}

/** 업데이트 화면 상태. phase마다 updateSection이 안내 문구를 고른다 */
type UpdatePhase = 'unavailable' | 'checking' | 'current' | 'available' | 'confirm' | 'updating' | 'updated' | 'restart'
  | 'unsupported' | 'pinned' | 'check-failed' | 'update-failed'
interface UpdateSnapshot { phase: UpdatePhase; current?: string | null; latest?: string | null; source?: string | null; error?: string; from?: string | null }

/**
 * 플러그인 업데이트 상태 관리 생성 (확인 → 확인 요청 → 실제 업데이트). 늦게 끝난 이전 요청은 generation으로 무시
 * @param fetch package.json을 받을 fetch (테스트에서 바꿔 끼움)
 * @param storage 업데이트 요청을 남겨 둘 저장소
 * @param now 지금 시각(ms) 함수
 */
function createUpdater({ fetch: fetchImpl = (...args: Parameters<typeof fetch>) => window.fetch(...args), storage = browserStorage, now = () => Date.now() }: { fetch?: typeof fetch; storage?: typeof browserStorage; now?: () => number } = {}) {
  const listeners = new Set<() => void>()
  let manager: PluginManager | null = null, generation = 0
  let snapshot: UpdateSnapshot = { phase: 'unavailable' }
  /** 상태 일부 갱신과 구독자 알림 */
  const set = (patch: Partial<UpdateSnapshot>) => { snapshot = { ...snapshot, ...patch }; for (const fn of [...listeners]) fn() }
  /** 오류 → 화면에 보일 문구 (message, code, 문자열 순) */
  const message = (error: { message?: string; code?: string } | null | undefined) => (error && (error.message || error.code || String(error))) || ''
  /** 설치 결과의 실패 사유 문구 ("code: diagnostic", 없으면 'failed') */
  const failure = (value: { error?: RemoteError } | undefined) => [value?.error?.code, value?.error?.diagnostic].filter(Boolean).join(': ') || 'failed'
  /**
   * 이전 화면이 시작한 업데이트(자기 자신을 지웠다 다시 설치)가 끝나 새 버전이 뜬 경우 결과 이어받기
   * 15분이 지난 요청은 버림
   * @param mine 이 확인 요청의 generation
   * @returns 결과를 이어받았거나 더 새 요청이 생겼으면 true
   */
  const resume = async (mine: number) => {
    const pending = storage.read()
    if (!pending || typeof pending.requestId !== 'string') return false
    if (now() - (pending.at || 0) > 15 * 60 * 1000) { storage.clear(); return false }
    if (snapshot.current && pending.to && compareVersions(snapshot.current, pending.to) >= 0) {
      storage.clear(); set({ phase: 'updated', from: pending.from, error: '' }); return true
    }
    const waited = await manager!.waitForInstall?.(pending.requestId)
    if (mine !== generation) return true
    if (waited?.ok && waited.value) {
      storage.clear()
      const outcome = waited.value
      set(outcome.application === 'failed' ? { phase: 'update-failed', error: failure(outcome) } : { phase: 'updated', from: pending.from, error: '' })
      return true
    }
    storage.clear()
    return false
  }
  /** 설치된 버전과 설치 주소(GitHub)의 최신 버전 확인 */
  const check = async () => {
    const mine = ++generation
    if (!manager) { set({ phase: 'unavailable' }); return }
    set({ phase: 'checking', error: '' })
    try {
      const listed = await manager.listBundles()
      if (mine !== generation) return
      if (!listed?.ok) throw new Error(message(listed?.error) || 'listBundles failed')
      const row = listed.value.find((item) => item.name === PLUGIN_ID)
      const current = row?.version ?? null, source = row?.source ?? null
      const github = githubSource(source)
      if (!github) { set({ phase: 'unsupported', current, latest: null, source }); return }
      if (github.ref && /^[0-9a-f]{7,40}$/i.test(github.ref)) { set({ phase: 'pinned', current, latest: null, source }); return }
      const url = `https://raw.githubusercontent.com/${github.owner}/${github.repo}/${encodeURIComponent(github.ref || 'HEAD')}/package.json`
      const response = await fetchImpl(url, { cache: 'no-store' })
      if (mine !== generation) return
      if (!response.ok) throw new Error('HTTP ' + response.status)
      const latest = (await response.json())?.version
      if (mine !== generation) return
      if (typeof latest !== 'string') throw new Error('no version in package.json')
      set({ current, latest, source })
      if (await resume(mine)) return
      if (mine !== generation) return
      set({ phase: compareVersions(latest, current) > 0 ? 'available' : 'current' })
    } catch (error) {
      if (mine === generation) set({ phase: 'check-failed', error: message(error as Error) })
    }
  }
  /** 설치 결과(application)에 맞는 상태 반영 */
  const settle = (value: InstallOutcome) => {
    if (value.application === 'applied' || value.application === 'overridden') set({ phase: 'updated', from: snapshot.current })
    else if (value.application === 'restart-required') set({ phase: 'restart' })
    else if (value.application === 'cancelled') set({ phase: 'available', error: 'cancelled' })
    else set({ phase: 'update-failed', error: failure(value) })
  }
  /** 1단계: 업데이트 확인 요청 (새 버전이 있을 때만) */
  const update = () => { if (manager && snapshot.phase === 'available' && snapshot.source) set({ phase: 'confirm', error: '' }) }
  /** 확인 요청 취소 */
  const cancel = () => { if (snapshot.phase === 'confirm') set({ phase: 'available' }) }
  /**
   * 2단계: 실제 업데이트. 먼저 같은 주소로 다시 설치하고, Harness가 '이미 설치됨'으로 막으면
   * 공식 플러그인 업데이트와 같은 방식(제거 → 다시 설치)으로 진행. 설정은 프로필에 따로 보존
   */
  const confirm = async () => {
    if (!manager || snapshot.phase !== 'confirm' || !snapshot.source) return
    const mine = ++generation, pluginManager = manager, source = snapshot.source
    const requestId = PLUGIN_ID + '-update-' + now()
    set({ phase: 'updating', error: '' })
    try {
      let result = await pluginManager.installBundle(source, { enabled: true, requestId })
      if (!result?.ok) throw new Error(message(result?.error) || 'installBundle failed')
      if (result.value.application === 'failed' && result.value.error?.code === 'already-installed') {
        storage.write({ requestId, from: snapshot.current, to: snapshot.latest, source, at: now() })
        const removed = await pluginManager.removeBundle(PLUGIN_ID)
        if (!removed?.ok) throw new Error(message(removed?.error) || 'removeBundle failed')
        if (removed.value.application === 'failed' || removed.value.error) { storage.clear(); throw new Error(failure(removed.value)) }
        // 이 시점에 이 화면은 내려갔을 수 있다. 설치 요청은 그대로 보낸다.
        result = await pluginManager.installBundle(source, { enabled: true, requestId })
        if (!result?.ok) throw new Error(message(result?.error) || 'installBundle failed')
      }
      storage.clear()
      if (mine === generation) settle(result.value)
    } catch (error) {
      if (mine === generation) set({ phase: 'update-failed', error: message(error as Error) })
    }
  }
  return {
    /** 상태 변경 구독 (돌려준 함수로 해제) */
    subscribe(fn: () => void) { listeners.add(fn); return () => listeners.delete(fn) },
    /** 지금 업데이트 상태 */
    getSnapshot: () => snapshot,
    /** 플러그인 관리자 연결과 바로 확인 시작 */
    attach(next: PluginManager) { manager = next; check() },
    /** 플러그인 관리자 연결 해제. 진행 중이던 요청 결과는 무시 */
    detach() { manager = null; generation++; set({ phase: 'unavailable' }) },
    check,
    update,
    cancel,
    confirm,
  }
}
type Updater = ReturnType<typeof createUpdater>

// ---------- 말풍선 음성 (TTS) ----------
// 재생·입 모양 코드는 plugins/dsh-tts/src/client 원본을 그대로 가져다 쓴다(모듈 수준 상태는 콘솔 경고 중복 억제 목록뿐).

const DEFAULT_KEY_REF = 'DSH_TTS_API_KEY'

/** 말풍선 음성 연결. 이 기능이 붙어 있는 동안만 dsc:say 수신. 늦게 끝난 초기화는 feature.add가 바로 정리 */
function mountTts(feature: Lifetime) {
  ttsClient.apply({
    /** 음성 클라이언트가 붙인 것을 이 기능의 수명에 등록 */
    effect: (fn: () => () => void) => feature.add(fn()) })
    .catch((error) => console.warn('DeepSeek짱 음성:', error))
}

/**
 * 설정이 바뀌었을 때 음성 기능을 다시 붙일지 정하는 값. 캐릭터가 꺼져 있으면 읽을 말풍선이 없어 null
 * @returns 연결에 영향을 주는 값의 JSON 문자열. 음성을 쓰지 않으면 null
 */
function ttsSignature(value: PluginSettings) {
  const tts = value.tts
  if (value.character === false || tts?.enabled !== true || !tts.openai?.baseUrl) return null
  return JSON.stringify([tts.openai.baseUrl, tts.stream?.pcmSampleRate, tts.voiceLines])
}

/** API 키 저장 상태 (키 값은 들고 있지 않음) */
interface KeySnapshot { available: boolean; configured: boolean; source: string | null }
/**
 * 음성 API 키 저장소 생성. 키는 Harness credentials에 저장하고, 화면은 "설정됨" 여부만 알 뿐 값은 받지 않음
 * 늦게 끝난 이전 조회는 generation으로 무시
 */
function createKeyStore() {
  const listeners = new Set<() => void>()
  let remote: CredentialService | null = null, ref = DEFAULT_KEY_REF, generation = 0
  let snapshot: KeySnapshot = { available: false, configured: false, source: null }
  /** 상태 교체와 구독자 알림 */
  const set = (next: KeySnapshot) => { snapshot = next; for (const fn of [...listeners]) fn() }
  /** 지금 저장 이름(ref)의 키 저장 여부 다시 조회 */
  const refresh = async () => {
    const mine = ++generation
    if (!remote || !ref) { set({ available: !!remote, configured: false, source: null }); return }
    try {
      const response = await remote.describe([ref])
      if (mine !== generation) return
      const view = response?.ok ? response.value?.[ref] : undefined
      set({ available: true, configured: view?.configured === true, source: view?.source ?? null })
    } catch { if (mine === generation) set({ available: true, configured: false, source: null }) }
  }
  return {
    /** 상태 변경 구독 (돌려준 함수로 해제) */
    subscribe(fn: () => void) { listeners.add(fn); return () => listeners.delete(fn) },
    /** 지금 키 저장 상태 */
    getSnapshot: () => snapshot,
    /** 지금 키 저장 이름 (credentials 참조 이름) */
    get ref() { return ref },
    /**
     * 키 저장 이름 변경. 바뀌었을 때만 다시 조회
     * @param next 설정의 apiKeyEnv 값. 문자열이 아니면 기본 이름
     */
    setRef(next: unknown) { const name = typeof next === 'string' ? next : DEFAULT_KEY_REF; if (name !== ref) { ref = name; refresh() } },
    /** credentials 서비스 연결과 조회 */
    attach(next: CredentialService) { remote = next; refresh() },
    /** credentials 서비스 연결 해제. 진행 중이던 조회 결과는 무시 */
    detach() { remote = null; generation++; set({ available: false, configured: false, source: null }) },
    /** 다른 곳에서 바뀐 키가 지금 저장 이름이면 다시 조회 */
    changed(name: string) { if (name === ref) refresh() },
    /**
     * 키 값 저장 후 상태 다시 조회
     * @returns 저장했으면 true, 저장소가 없거나 거부했으면 false
     */
    async save(value: string) {
      if (!remote || !ref) return false
      const response = await remote.set(ref, value)
      await refresh()
      return response?.ok !== false
    },
  }
}
type KeyStore = ReturnType<typeof createKeyStore>

const sectionStyle: React.CSSProperties = { display: 'grid', gap: 10, borderTop: '1px solid rgba(127,127,127,.25)', paddingTop: 14 }
const fieldStyle: React.CSSProperties = { display: 'grid', gap: 4 }
const inputStyle: React.CSSProperties = { width: '100%', boxSizing: 'border-box' }

/** TtsField 속성. commit은 저장 후 문제가 있으면 안내 문구 반환 */
interface TtsFieldProps {
  label: string; hint?: string; value?: string; placeholder?: string; disabled?: boolean; multiline?: boolean
  type?: string; min?: number; max?: number; step?: number
  commit(draft: string): string | undefined | Promise<string>
}

/** 음성 설정 글 입력 칸. 입력 중에는 초안을 들고 있다가, 포커스를 벗어나거나 Enter(여러 줄 칸 제외)를 누르면 저장 */
function TtsField({ label, hint, value, placeholder, disabled, multiline, type, min, max, step, commit }: TtsFieldProps) {
  const shown = value ?? ''
  const [draft, setDraft] = React.useState(shown)
  const [error, setError] = React.useState('')
  React.useEffect(() => { setDraft(shown); setError('') }, [shown])
  /** 초안이 바뀌었을 때만 저장하고 안내 문구 표시 */
  const save = async () => {
    if (draft === shown) return
    const problem = await commit(draft)
    setError(problem || '')
  }
  /** 한 줄 칸에서 Enter를 누르면 포커스를 빼 저장 */
  const onKeyDown = (event: React.KeyboardEvent<HTMLElement>) => { if (!multiline && event.key === 'Enter') event.currentTarget.blur() }
  const input = React.createElement(multiline ? 'textarea' : 'input', {
    style: inputStyle, value: draft, placeholder, disabled, type: multiline ? undefined : (type || 'text'), rows: multiline ? 3 : undefined,
    min, max, step, spellCheck: false,
      /** 입력값을 초안에 반영 */
      onChange: (event: { target: HTMLInputElement }) => setDraft(event.target.value), onBlur: save, onKeyDown,
  })
  return React.createElement('label', { style: fieldStyle },
    React.createElement('span', null, label),
    input,
    hint ? React.createElement('small', { style: { opacity: 0.7 } }, hint) : null,
    error ? React.createElement('small', { role: 'alert' }, error) : null)
}

/**
 * JSON 칸 해석. 객체만 받고 빈 칸은 {}
 * @returns 성공이면 { value }, 객체가 아니면 { error: 안내 문구 }
 */
function parseJsonObject(text: string, ko: boolean) {
  const trimmed = text.trim()
  if (trimmed === '') return { value: {} }
  try {
    const value = JSON.parse(trimmed)
    if (value && typeof value === 'object' && !Array.isArray(value)) return { value }
  } catch {}
  return { error: ko ? '{ "이름": 값 } 형식의 JSON 객체를 입력해 주세요.' : 'Enter a JSON object such as { "name": value }.' }
}

/** 음성 API 키 입력 칸. 저장 여부만 표시하고, 저장한 뒤에는 입력값 비움 */
function TtsKeyField({ keys, ko, disabled }: { keys: KeyStore; ko: boolean; disabled: boolean }) {
  const key = React.useSyncExternalStore((fn) => keys.subscribe(fn), () => keys.getSnapshot(), () => keys.getSnapshot())
  const [draft, setDraft] = React.useState('')
  const [message, setMessage] = React.useState('')
  /** 화면 언어에 맞는 문구 선택 */
  const t = (korean: string, english: string) => (ko ? korean : english)
  const status = !key.available ? t('Harness 자격 증명 저장소에 연결되지 않았습니다.', 'The Harness credential store is unavailable.')
    : key.configured ? t('저장됨', 'Saved') + (key.source ? ' (' + key.source + ')' : '')
      : t('저장된 키가 없습니다. 키 없이 쓰는 로컬 서버라면 비워 두세요.', 'No key saved · leave empty for local servers that need none')
  /** 입력한 키 저장 (빈 칸이면 무시) */
  const save = async () => {
    if (!draft.trim()) return
    setMessage('')
    try { setMessage(await keys.save(draft.trim()) ? '' : t('키를 저장하지 못했습니다.', 'Could not save the key.')) } catch { setMessage(t('키를 저장하지 못했습니다.', 'Could not save the key.')) }
    setDraft('')
  }
  return React.createElement('label', { style: fieldStyle },
    React.createElement('span', null, t('API 키', 'API key')),
    React.createElement('div', { style: { display: 'flex', gap: 8, alignItems: 'center' } },
      React.createElement('input', { type: 'password', autoComplete: 'off', style: { ...inputStyle, flex: '1 1 auto', minWidth: 0 }, value: draft, disabled: disabled || !key.available || !keys.ref, placeholder: key.configured ? '••••••••' : '',
        /** 입력값을 초안에 반영 */
        onChange: (event) => setDraft(event.target.value) }),
      React.createElement('button', { type: 'button', style: { flex: '0 0 auto', whiteSpace: 'nowrap' }, disabled: disabled || !key.available || !draft.trim(), onClick: save }, t('저장', 'Save'))),
    React.createElement('small', { role: 'status', style: { opacity: 0.7 } }, status),
    message ? React.createElement('small', { role: 'alert' }, message) : null)
}

const VOICE_LINES = [
  ['reactions', '반응 (인사·시작·완료·오류)', 'Reactions (greeting, start, done, error)'],
  ['status', '도구 사용 상태', 'Tool status'],
  ['mutters', '혼잣말 (추론 요약이 섞일 수 있음)', 'Mutters (may include reasoning summaries)'],
  ['others', '그 밖의 대사 (터치 반응 등)', 'Other lines (touch reactions, …)'],
]

const groupStyle: React.CSSProperties = { display: 'grid', gap: 10, borderTop: '1px dashed rgba(127,127,127,.2)', paddingTop: 10 }
const groupTitleStyle: React.CSSProperties = { fontSize: '0.85em', fontWeight: 600, opacity: 0.75 }
const toggleRow: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }

/** 소제목과 구분선으로 묶은 한 덩어리 */
function ttsGroup(title: string, ...children: React.ReactNode[]) {
  return React.createElement('div', { role: 'group', 'aria-label': title, style: groupStyle },
    React.createElement('span', { style: groupTitleStyle }, title), ...children)
}

/**
 * 말풍선 음성 설정 구역. 값은 설정 폼 mutate로 tts 아래 경로에 바로 저장
 * @param writable 설정을 쓸 수 있는지 여부 (mutate가 없는 Harness에서도 비활성)
 * @param tts 지금 음성 설정값
 */
function TtsSection({ form, keys, ko, writable, tts }: { form: ConfigForm<PluginSettings>; keys: KeyStore; ko: boolean; writable?: boolean; tts?: TtsSettings }) {
  const [error, setError] = React.useState('')
  /** 화면 언어에 맞는 문구 선택 */
  const t = (korean: string, english: string) => (ko ? korean : english)
  const settings = tts ?? {}, openai = settings.openai ?? {}
  const off = !writable || typeof form.mutate !== 'function'
  /**
   * 음성 설정 한 값 저장
   * @param path tts 아래 경로 (예: ['openai', 'baseUrl'])
   * @returns 저장했으면 '', 실패하면 안내 문구
   */
  const write = async (path: string[], value: unknown) => {
    setError('')
    try {
      if (await form.mutate!([{ op: 'set', path: ['tts', ...path], value }])) return ''
    } catch {}
    const failed = t('설정을 저장하지 못했습니다.', 'Could not save settings.')
    setError(failed)
    return failed
  }
  /** 글 입력 칸 (앞뒤 공백을 지워 저장) */
  const text = (path: string[], label: string, extra: Partial<TtsFieldProps> = {}) => React.createElement(TtsField, { key: path.join('.'), label, disabled: off,
    /** 앞뒤 공백을 지운 초안 저장 */
    commit: (draft: string) => write(path, draft.trim()), ...extra })
  /** JSON 객체 입력 칸 (여러 줄, 비어 있는 객체는 빈 칸으로 표시) */
  const json = (path: string[], label: string, value: unknown, placeholder: string, hint?: string) => text(path, label, {
    multiline: true, placeholder, hint, value: value && Object.keys(value).length ? JSON.stringify(value, null, 2) : '',
    /** JSON 객체로 해석되면 저장, 아니면 안내 문구 */
    commit: (draft: string) => { const parsed = parseJsonObject(draft, ko); return parsed.error ? parsed.error : write(path, parsed.value) },
  })
  /** 정수 입력 칸 (min~extra.max 범위만 저장) */
  const number = (path: string[], label: string, value: unknown, min: number, extra: Partial<TtsFieldProps> = {}) => text(path, label, {
    type: 'number', min, max: extra.max, step: 1, value: value === undefined ? '' : String(value), ...extra,
    /** 범위 안 정수면 저장, 아니면 안내 문구 */
    commit: (draft: string) => { const n = Number(draft); return Number.isInteger(n) && n >= min && n <= (extra.max ?? Infinity) ? write(path, n) : t(min + '~' + extra.max + ' 범위의 정수를 입력해 주세요.', 'Enter a whole number from ' + min + ' to ' + extra.max + '.') },
  })
  /**
   * 시간 입력 칸. 화면에서는 초, 저장은 ms
   * @param ms 저장된 값(ms)
   */
  const seconds = (path: string[], label: string, ms: number | undefined) => text(path, label, {
    type: 'number', min: 1, max: 600, step: 0.001, value: ms === undefined ? '' : String(ms / 1000),
    /** 1~600초면 ms로 바꿔 저장, 아니면 안내 문구 */
    commit: (draft: string) => { const n = Number(draft); return Number.isFinite(n) && n >= 1 && n <= 600 ? write(path, Math.round(n * 1000)) : t('1~600초 사이의 값을 입력해 주세요.', 'Enter 1 to 600 seconds.') },
  })
  /** 켜고 끄는 확인란 (바꾸는 즉시 저장) */
  const check = (path: string[], label: string, checked: boolean) => React.createElement('label', { key: path.join('.'), style: toggleRow },
    React.createElement('span', null, label),
    React.createElement('input', { type: 'checkbox', checked, disabled: off,
      /** 확인 상태 저장 */
      onChange: (event) => write(path, event.target.checked) }))
  const serverDefault = t('비워 두면 서버 기본값 사용', 'Empty = server default')
  return React.createElement('section', { 'aria-label': t('말풍선 음성', 'Speech bubble voice'), style: sectionStyle },
    React.createElement('div', { style: toggleRow },
      React.createElement('strong', null, t('말풍선 음성', 'Speech bubble voice')),
      React.createElement('input', { type: 'checkbox', 'aria-label': t('말풍선을 소리 내어 읽기', 'Read speech bubbles aloud'), checked: settings.enabled === true, disabled: off,
        /** 음성 켜기·끄기 저장 */
        onChange: (event) => write(['enabled'], event.target.checked) })),
    settings.enabled === true && !openai.baseUrl ? React.createElement('p', { role: 'status', style: { margin: 0 } }, t('음성을 들으려면 API 주소를 입력해 주세요.', 'Enter an API address to hear speech.')) : null,
    ttsGroup(t('연결', 'Connection'),
      text(['openai', 'baseUrl'], t('API 주소', 'API address'), { value: openai.baseUrl, placeholder: 'https://api.openai.com/v1', hint: t('/v1까지 포함한 주소를 입력합니다 (OpenAI 호환 TTS).', 'Up to /v1 (OpenAI-compatible TTS)') }),
      React.createElement(TtsKeyField, { key: 'key', keys, ko, disabled: off })),
    ttsGroup(t('목소리', 'Voice'),
      text(['openai', 'model'], t('모델', 'Model'), { value: openai.model, placeholder: serverDefault }),
      text(['openai', 'voice'], t('목소리 ID', 'Voice ID'), { value: openai.voice, placeholder: serverDefault }),
      number(['stream', 'pcmSampleRate'], t('샘플레이트 (Hz)', 'Sample rate (Hz)'), settings.stream?.pcmSampleRate, 8000, { max: 48000, hint: t('서버가 보내는 오디오와 샘플레이트가 같아야 합니다 (OpenAI 24000 · Fish 44100).', 'Must match the audio the server sends (OpenAI 24000 · Fish 44100)') })),
    ttsGroup(t('읽을 대사', 'Lines to read'),
      ...VOICE_LINES.map(([field, koLabel, enLabel]) => check(['voiceLines', field], ko ? koLabel : enLabel, settings.voiceLines?.[field] === true))),
    React.createElement('details', { style: groupStyle },
      React.createElement('summary', { style: groupTitleStyle }, t('고급', 'Advanced')),
      React.createElement('div', { style: { display: 'grid', gap: 10, paddingTop: 4 } },
        json(['openai', 'extraBody'], t('추가 요청 값 (JSON)', 'Extra request values (JSON)'), openai.extraBody, '{ "speed": 1.1 }',
          t('요청 본문에 추가할 값입니다. input·response_format·stream_format은 플러그인이 지정하며 모델과 목소리는 위에 입력한 ID를 우선합니다.', 'Merged into the request body. The plugin sets input, response_format and stream_format; the model and voice ID above win.')),
        json(['openai', 'headers'], t('추가 헤더 (JSON)', 'Extra headers (JSON)'), openai.headers, '{ "X-Example": "value" }'),
        text(['openai', 'textPrefix'], t('대사 앞 문구', 'Line prefix'), { value: openai.textPrefix, placeholder: '[밝고 장난스럽게] ', hint: t('모든 대사 앞에 붙일 문구입니다 (예: Drama 3 연기 지시).', 'Prepended to every line (e.g. Drama 3 directions)') }),
        seconds(['openai', 'timeoutMs'], t('응답 대기 시간 (초)', 'Response timeout (seconds)'), openai.timeoutMs),
        check(['cache', 'enabled'], t('같은 대사의 음성 재사용 (캐시)', 'Reuse audio for repeated lines (cache)'), settings.cache?.enabled !== false),
        text(['openai', 'apiKeyEnv'], t('API 키 저장 이름', 'API key name'), { value: openai.apiKeyEnv ?? DEFAULT_KEY_REF, hint: t('저장된 키를 먼저 쓰고, 없으면 같은 이름의 환경변수를 씁니다. 비우면 인증 없이 요청합니다.', 'A saved key is used first, then the environment variable of the same name. Empty sends no authorization.') }))),
    React.createElement('p', { style: { margin: 0, opacity: 0.7 } }, t('AI로 만든 음성을 사용합니다. 이 기능을 켜면 대사가 위 주소로 전송되며 서비스에 따라 요금이 청구될 수 있습니다.', 'This is an AI-generated voice. When on, lines are sent to the address above, and the service may charge for them.')),
    error ? React.createElement('p', { role: 'alert' }, error) : null)
}

/** 플러그인 업데이트 구역. 업데이트 상태(phase)마다 안내 문구와 버튼 선택 */
function updateSection(updater: Updater, ko: boolean) {
  const snapshot = updater.getSnapshot()
  /** 화면 언어에 맞는 문구 선택 */
  const t = (korean: string, english: string) => (ko ? korean : english)
  const versions = [snapshot.current && t('현재 ' + snapshot.current, 'Installed ' + snapshot.current), snapshot.latest && t('최신 ' + snapshot.latest, 'Latest ' + snapshot.latest)].filter(Boolean).join(' · ')
  const text = {
    unavailable: t('Harness 플러그인 관리자에 연결되지 않아 업데이트를 확인할 수 없습니다.', 'Plugin manager is unavailable, so updates cannot be checked.'),
    checking: t('업데이트 확인 중…', 'Checking for updates…'),
    current: t('최신 버전입니다.', 'You are up to date.'),
    available: t('새 버전이 있습니다.', 'A new version is available.'),
    confirm: t('업데이트 중에는 플러그인이 잠시 꺼집니다. 새 버전이 켜져도 설정은 유지됩니다. 실패하면 Plugins → + Add plugin에서 같은 GitHub 주소로 다시 추가해 주세요.',
      'The plugin turns off briefly and comes back as the new version. Settings are kept. If it fails, add the same GitHub address again from Plugins → + Add plugin.'),
    updating: t('업데이트 중입니다. 창을 닫지 마세요.', 'Updating… keep this window open.'),
    updated: t('업데이트했습니다.' + (snapshot.from ? ' (' + snapshot.from + ' → ' + (snapshot.current || snapshot.latest) + ')' : ''), 'Updated.' + (snapshot.from ? ' (' + snapshot.from + ' → ' + (snapshot.current || snapshot.latest) + ')' : '')),
    restart: t('업데이트했습니다. Harness를 다시 시작하면 새 버전이 적용됩니다.', 'Updated. Restart Harness to use the new version.'),
    unsupported: t('GitHub 주소로 설치한 경우에만 여기서 업데이트할 수 있습니다.', 'Updates here work only for plugins installed from a GitHub address.'),
    pinned: t('특정 커밋으로 고정한 설치는 여기서 업데이트할 수 없습니다.', 'This install is pinned to a commit, so it is not updated here.'),
    'check-failed': t('업데이트를 확인하지 못했습니다.', 'Could not check for updates.'),
    'update-failed': t('업데이트하지 못했습니다.', 'Update failed.'),
  }[snapshot.phase] ?? ''
  const busy = snapshot.phase === 'checking' || snapshot.phase === 'updating'
  /** 업데이트 구역의 버튼 하나 */
  const button = (label: string, onClick: () => void, disabled: boolean) => React.createElement('button', { type: 'button', onClick, disabled }, label)
  return React.createElement('section', { 'aria-label': t('업데이트', 'Updates'), style: { display: 'grid', gap: 8, paddingTop: 12, borderTop: '1px solid #8881' } },
    React.createElement('strong', null, t('업데이트', 'Updates')),
    versions ? React.createElement('span', { style: { opacity: 0.7 } }, versions) : null,
    React.createElement('p', { role: 'status', style: { margin: 0 } }, text, snapshot.error ? ' (' + snapshot.error + ')' : ''),
    React.createElement('div', { style: { display: 'flex', gap: 8 } },
      snapshot.phase === 'available' ? button(t('업데이트', 'Update'), () => updater.update(), busy) : null,
      snapshot.phase === 'confirm' ? button(t('계속', 'Continue'), () => updater.confirm(), false) : null,
      snapshot.phase === 'confirm' ? button(t('취소', 'Cancel'), () => updater.cancel(), false) : null,
      !['unavailable', 'updated', 'restart', 'confirm', 'updating'].includes(snapshot.phase)
        ? button(t('다시 확인', 'Check again'), () => updater.check(), busy) : null))
}

/** 단축키·이동 키 입력 칸의 공통 속성. onChange는 새 값 저장 ('' = 지움) */
interface KeyFieldProps {
  label: string; hintId: string; hint: string; value?: string; ariaLabel: string; ko: boolean
  disabled?: boolean; inactive?: boolean; onChange(value: string): unknown
}

/**
 * 단축키 입력 칸. 칸을 눌러 두면 누른 키 조합을 그대로 저장. Esc 취소 · Backspace/Delete 지우기 · Tab은 포커스 이동
 * @param control 입력 칸 바로 왼쪽에 둘 요소 (있으면 label 대신 div로 묶음)
 * @param inactive true면 흐리게 표시 (기능이 꺼져 있을 때)
 */
function ShortcutField({ label, control, hintId, hint, value, placeholder, ariaLabel, ko, disabled, inactive, onChange }: KeyFieldProps & { control?: React.ReactNode; placeholder?: string }) {
  const [recording, setRecording] = React.useState(false)
  const [held, setHeld] = React.useState('')
  /** 녹음 중 키 입력 처리 (shortcutKeyDown의 동작대로) */
  const capture = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const action = shortcutKeyDown(event)
    /** 녹음 끝내기 */
    const stop = () => { setRecording(false); setHeld('') }
    if (action.action === 'leave') { stop(); return }
    event.preventDefault()
    event.stopPropagation()
    const target = event.currentTarget
    if (action.action === 'cancel') { stop(); target.blur(); return }
    if (action.action === 'clear') { stop(); void onChange(''); target.blur(); return }
    if (action.action === 'wait') { setHeld(action.held); return }
    stop(); void onChange(action.combo); target.blur()
  }
  return React.createElement(React.Fragment, null,
    React.createElement(control ? 'div' : 'label', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24, rowGap: 8 } },
      React.createElement('span', { style: { opacity: inactive ? 0.55 : 1 } }, label),
      React.createElement('span', { style: { display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' } },
        control ?? null,
        React.createElement('input', {
          type: 'text',
          readOnly: true,
          'aria-label': ariaLabel,
          'aria-describedby': hintId,
          placeholder: recording ? (ko ? '키를 누르세요…' : 'Press keys…') : placeholder,
          style: { width: 150, cursor: disabled ? 'default' : 'pointer', textAlign: 'center', borderColor: recording ? '#7aa7ff' : undefined, opacity: inactive ? 0.45 : 1 },
          value: recording ? held : (value ?? ''),
          disabled,
          /** 칸에 들어오면 녹음 시작 (비활성이면 무시) */
          onFocus: () => { if (disabled) return; setRecording(true); setHeld('') },
          /** 칸을 벗어나면 녹음 끝 */
          onBlur: () => { setRecording(false); setHeld('') },
          onKeyDown: capture,
        }))),
    hint ? React.createElement('p', { id: hintId, style: { margin: 0, opacity: inactive ? 0.45 : 0.7 } }, hint) : null)
}

/**
 * 이동 키 입력 칸. 수식 키 하나 또는 일반 키 하나를 그대로 등록. Esc 취소 · Backspace/Delete 지우기 · Tab은 포커스 이동
 * @param inactive true면 흐리게 표시 (캐릭터가 꺼져 있을 때)
 */
function DragKeyField({ label, hintId, hint, value, ariaLabel, ko, disabled, inactive, onChange }: KeyFieldProps) {
  const [recording, setRecording] = React.useState(false)
  const [held, setHeld] = React.useState('')
  /** 녹음 끝내기 */
  const stop = () => { setRecording(false); setHeld('') }
  /** 녹음 중 키 누름 처리 (dragKeyDown의 동작대로) */
  const capture = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const action = dragKeyDown(event)
    if (action.action === 'leave') { stop(); return }
    event.preventDefault()
    event.stopPropagation()
    const target = event.currentTarget
    if (action.action === 'cancel') { stop(); target.blur(); return }
    if (action.action === 'clear') { stop(); void onChange(''); target.blur(); return }
    if (action.action === 'wait') { setHeld(action.held); return }
    stop(); void onChange(action.key); target.blur()
  }
  /** 수식 키는 떼는 순간 저장 (다른 키와 조합하지 않는 단일 키) */
  const release = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const modifier = MODIFIER_LABELS.get(event.key)
    if (!modifier || !recording) return
    stop(); void onChange(modifier); event.currentTarget.blur()
  }
  return React.createElement(React.Fragment, null,
    React.createElement('label', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24, rowGap: 8 } },
      React.createElement('span', { style: { opacity: inactive ? 0.55 : 1 } }, label),
      React.createElement('input', {
        type: 'text',
        readOnly: true,
        'aria-label': ariaLabel,
        'aria-describedby': hintId,
        placeholder: recording ? (ko ? '키를 누르세요…' : 'Press a key…') : '',
        style: { width: 150, cursor: disabled ? 'default' : 'pointer', textAlign: 'center', borderColor: recording ? '#7aa7ff' : undefined, opacity: inactive ? 0.45 : 1 },
        value: recording ? held : (value ?? ''),
        disabled,
        /** 칸에 들어오면 녹음 시작 (비활성이면 무시) */
        onFocus: () => { if (disabled) return; setRecording(true); setHeld('') },
        /** 칸을 벗어나면 녹음 끝 */
        onBlur: () => { setRecording(false); setHeld('') },
        onKeyDown: capture,
        onKeyUp: release,
      })),
    React.createElement('p', { id: hintId, style: { margin: 0, opacity: inactive ? 0.45 : 0.7 } }, hint))
}

/** 캔버스만 숨김 상태를 설정 화면에도 표시 (설정(캐릭터와 말풍선)이 꺼진 것과 혼동 방지). 600ms마다 상태 확인 */
function CanvasHiddenNotice({ ko, link }: { ko: boolean; link: CharacterLink }) {
  /** 지금 캔버스를 숨긴 상태인지 여부 */
  const read = () => link.character?.canvasHidden() === true
  const [hidden, setHidden] = React.useState(read)
  React.useEffect(() => {
    const id = setInterval(() => setHidden(read()), 600)
    return () => clearInterval(id)
  }, [])
  if (!hidden) return null
  return React.createElement('div', { role: 'status', style: { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10, opacity: 0.9 } },
    React.createElement('span', null, ko ? '캐릭터 설정은 켜져 있지만 화면에서는 잠시 숨겨져 있습니다.' : 'The canvas is hidden right now (the character setting is still on).'),
    React.createElement('button', { type: 'button',
      /** 캔버스 다시 표시 */
      onClick: () => { try { link.character?.toggleCanvas?.() } catch {} setHidden(false) } },
      ko ? '다시 표시' : 'Show again'))
}

/**
 * 플러그인 목록의 설정 화면 컴포넌트 생성 (apply마다 만든 폼·업데이트·키 저장소·캐릭터 연결을 묶음)
 * @returns plugins.row.config 슬롯에 등록할 컴포넌트
 */
function settingsPage(ctx: DshContext, form: ConfigForm<PluginSettings>, updater: Updater, keys: KeyStore, link: CharacterLink) {
  /**
   * 기능 켜고 끄기·소품·체형·절전·단축키·음성·업데이트 설정 화면
   * @param view 'summary'면 한 줄 요약만 표시
   */
  return function FeatureSettings({ view }: { view?: string }) {
    const state = React.useSyncExternalStore((fn) => form.subscribe(fn), () => form.getSnapshot(), () => form.getSnapshot())
    const locale = React.useSyncExternalStore((fn) => ctx.locale.subscribe(fn), () => ctx.locale.getLocale(), () => ctx.locale.getLocale())
    React.useSyncExternalStore((fn) => updater.subscribe(fn), () => updater.getSnapshot(), () => updater.getSnapshot())
    const [error, setError] = React.useState('')
    const [pending, setPending] = React.useState(false)
    const ko = locale.active.toLowerCase().startsWith('ko')
    if (view === 'summary') return React.createElement('span', null, ko ? '캐릭터 · 테마 · 한국어' : 'Character · Theme · Korean')
    if (state.status !== 'ready') return React.createElement('p', { role: 'status' }, ko ? '설정을 불러오는 중입니다.' : 'Loading settings…')
    const fields = [
      ['character', ko ? '캐릭터와 말풍선' : 'Character and speech bubbles'],
      ['mobileCharacter', ko ? '모바일에서도 캐릭터 표시' : 'Show character on mobile'],
      ['intro', ko ? '시작할 때 등장 연출' : 'Intro on startup'],
      ['appIcon', ko ? '앱 아이콘 (Windows·macOS)' : 'App icon (Windows, macOS)'],
      ['theme', ko ? '파스텔 테마' : 'Pastel theme'],
      ['translation', ko ? '한국어 언어팩' : 'Korean language pack'],
    ]
    /**
     * 설정 한 값 저장. 쓸 수 없는 상태면 무시하고, 저장하는 동안 다른 칸 비활성
     * @param checked 저장할 값 (스위치면 켜짐 여부, 그 밖에는 값 자체)
     */
    const change = async (field: string, checked: unknown) => {
      const current = form.getSnapshot()
      if (current.status !== 'ready' || !current.writable) return
      setError(''); setPending(true)
      try {
        if (!await form.set(field, checked)) setError(ko ? '설정을 저장하지 못했습니다.' : 'Could not save settings.')
      } catch { setError(ko ? '설정을 저장하지 못했습니다.' : 'Could not save settings.') }
      finally { setPending(false) }
    }
    const row: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }
    const off = !state.writable || pending
    /** 소품·옷 한 항목 스위치 (기본 꺼짐) */
    const outfitSwitch = ([field, label]: string[]) => React.createElement('label', { key: field, style: row },
      React.createElement('span', null, label),
      React.createElement('input', { type: 'checkbox', checked: state.value?.[field] === true, disabled: off,
        /** 켜짐 여부 저장 */
        onChange: (event) => change(field, event.target.checked) }))
    const bodyType = state.value?.bodyType || 'default'
    const shortcutValue = state.value?.characterToggleKey ?? 'Ctrl+Shift+D'
    const petShortcutValue = state.value?.petToggleKey ?? 'Ctrl+Shift+P'
    const characterOn = state.value?.character !== false
    const canvasToggle = state.value?.canvasToggle === true
    const canvasKeyValue = state.value?.canvasToggleKey ?? 'Ctrl+Shift+H'
    const dragKey = state.value?.dragKey ?? 'Alt'
    return React.createElement('div', { style: { display: 'grid', gap: 16 } },
      ...fields.map(([field, label]) => React.createElement('label', { key: field, style: row },
        React.createElement('span', null, label),
        React.createElement('input', { type: 'checkbox', role: 'switch', checked: state.value?.[field] !== false, disabled: off,
          /** 켜짐 여부 저장 */
          onChange: (event) => change(field, event.target.checked) }))),
      React.createElement('label', { style: row },
        React.createElement('span', null, ko ? '대사 ex' : 'Extra dialogue'),
        React.createElement('input', { type: 'checkbox', role: 'switch', checked: state.value?.extraLines === true, disabled: off,
          /** 켜짐 여부 저장 */
          onChange: (event) => change('extraLines', event.target.checked) })),
      React.createElement('p', { style: { opacity: 0.7 } }, ko ? '설정은 바꾸는 즉시 저장되고 적용됩니다. 화면 언어는 설정 → 일반 설정 → 언어에서 한국어로 바꿀 수 있습니다.' : 'Changes apply and save immediately. Select Korean under Settings → General → Language.'),
      React.createElement('section', { 'aria-label': ko ? '소품·옷' : 'Accessories and outfit', style: { display: 'grid', gap: 10, borderTop: '1px solid rgba(127,127,127,.25)', paddingTop: 14 } },
        React.createElement('strong', null, ko ? '소품·옷' : 'Accessories and outfit'),
        ...OUTFIT_FIELDS.map(([field, koLabel, enLabel]) => outfitSwitch([field, ko ? koLabel : enLabel]))),
      React.createElement('section', { 'aria-label': ko ? '체형' : 'Body type', style: { display: 'grid', gap: 10, borderTop: '1px solid rgba(127,127,127,.25)', paddingTop: 14 } },
        React.createElement('strong', null, ko ? '체형' : 'Body type'),
        ...BODY_TYPES.map(([value, koLabel, enLabel]) => React.createElement('label', { key: value, style: { display: 'flex', alignItems: 'center', gap: 10 } },
          React.createElement('input', { type: 'radio', name: 'deepseek-harness-kr-body', checked: bodyType === value, disabled: off,
            /** 고른 체형 저장 */
            onChange: () => change('bodyType', value) }),
          React.createElement('span', null, ko ? koLabel : enLabel)))),
      React.createElement('section', { 'aria-label': ko ? '절전' : 'Power saving', style: { display: 'grid', gap: 10, borderTop: '1px solid rgba(127,127,127,.25)', paddingTop: 14 } },
        React.createElement('strong', null, ko ? '절전' : 'Power saving'),
        React.createElement('label', { style: row },
          React.createElement('span', null, ko ? '입력이 없으면 잠시 쉬기 (화면 밖으로 나가 그리기 중단)' : 'Rest when idle (leaves the screen and stops rendering)'),
          React.createElement('input', { type: 'checkbox', role: 'switch', checked: state.value?.idleSleep !== false, disabled: off,
            /** 절전 켜짐 여부 저장 */
            onChange: (event) => change('idleSleep', event.target.checked) })),
        React.createElement('label', { style: row },
          React.createElement('span', null, ko ? '쉬기 전 대기 시간 (분)' : 'Idle minutes before resting'),
          React.createElement('input', { type: 'number', min: 0.5, max: 60, step: 0.5, style: { width: 90 }, value: sleepMinutes(state.value?.idleSleepMinutes), disabled: off,
            /** 대기 시간(분)을 범위 안으로 정리해 저장 */
            onChange: (event) => change('idleSleepMinutes', sleepMinutes(event.target.value)) }))),
      React.createElement('section', { 'aria-label': ko ? '3D 모델 (실험)' : '3D model (experimental)', style: { display: 'grid', gap: 10, borderTop: '1px solid rgba(127,127,127,.25)', paddingTop: 14 } },
        React.createElement('strong', null, ko ? '3D 모델 (실험)' : '3D model (experimental)'),
        React.createElement('p', { style: { margin: 0, opacity: 0.7 } }, ko ? 'avatar.json과 모델 파일이 있는 폴더를 지정하면 캐릭터를 3D로 표시합니다. 바깥 펫 창에도 적용됩니다. 비워 두면 기본 캐릭터를 사용합니다. 화면을 새로 불러오면 적용됩니다.' : 'Set a folder with avatar.json and the model to draw the character in 3D (including the outside pet window). Empty uses the default character. Applies on reload.'),
        React.createElement('label', { style: row },
          React.createElement('span', null, ko ? '모델 폴더' : 'Model folder'),
          React.createElement('input', { type: 'text', style: { flex: 1, maxWidth: 360 }, defaultValue: state.value?.avatarModelDir ?? '', placeholder: 'D:\\models\\avatar', disabled: off,
            /** 입력을 마치면 폴더 경로 저장 */
            onBlur: (event: React.FocusEvent<HTMLInputElement>) => { if (event.target.value !== (state.value?.avatarModelDir ?? '')) change('avatarModelDir', event.target.value.trim()) } })),
        React.createElement('label', { style: row },
          React.createElement('span', null, ko ? '외곽선 법선' : 'Outline normals'),
          React.createElement('select', { value: state.value?.avatarOutline === 'model' ? 'model' : 'smooth', disabled: off,
            /** 고른 외곽선 법선 저장 */
            onChange: (event: React.ChangeEvent<HTMLSelectElement>) => change('avatarOutline', event.target.value) },
            React.createElement('option', { value: 'smooth' }, ko ? '매끄러운 법선 (기본)' : 'Smoothed normals (default)'),
            React.createElement('option', { value: 'model' }, ko ? '모델 제공 외곽선' : 'Model-provided outline'))),
        React.createElement('label', { style: row },
          React.createElement('span', null, ko ? '눈썹 움직임 세기 (배, 0~2)' : 'Eyebrow motion strength (x, 0-2)'),
          React.createElement('input', { type: 'number', min: 0, max: 2, step: 0.05, style: { width: 90 }, value: browScale(state.value?.avatarBrowScale), disabled: off,
            /** 눈썹 세기를 범위 안으로 정리해 저장 */
            onChange: (event) => change('avatarBrowScale', browScale(event.target.value)) })),
        React.createElement('label', { style: row },
          React.createElement('span', null, ko ? '눈썹 움직임 부드럽게 (ms, 0~300)' : 'Eyebrow motion smoothing (ms, 0-300)'),
          React.createElement('input', { type: 'number', min: 0, max: 300, step: 10, style: { width: 90 }, value: browSmoothMs(state.value?.avatarBrowSmooth), disabled: off,
            /** 눈썹 부드러움 시간을 범위 안으로 정리해 저장 */
            onChange: (event) => change('avatarBrowSmooth', browSmoothMs(event.target.value)) })),
        React.createElement('label', { style: row },
          React.createElement('span', null, ko ? '앰비언트 오클루전 (없으면 자동으로 생성)' : 'Ambient occlusion (generated if the model has none)'),
          React.createElement('input', { type: 'checkbox', checked: state.value?.avatarAo === true, disabled: off,
            /** AO 굽기 켜짐 여부 저장 */
            onChange: (event) => change('avatarAo', event.target.checked) })),
        React.createElement('label', { style: row },
          React.createElement('span', null, ko ? '앰비언트 오클루전 세기 (0~1)' : 'Ambient occlusion strength (0-1)'),
          React.createElement('input', { type: 'number', min: 0, max: 1, step: 0.05, style: { width: 90 }, value: aoStrength(state.value?.avatarAoStrength), disabled: off,
            /** AO 세기를 범위 안으로 정리해 저장 */
            onChange: (event) => change('avatarAoStrength', aoStrength(event.target.value)) }))),
      React.createElement('section', { 'aria-label': ko ? '캐릭터와 말풍선 단축키' : 'Shortcuts - Character and speech bubbles', style: { display: 'grid', gap: 10, borderTop: '1px solid rgba(127,127,127,.25)', paddingTop: 14 } },
        React.createElement('strong', null, ko ? '캐릭터와 말풍선 단축키' : 'Shortcuts - Character and speech bubbles'),
        React.createElement('p', { id: SHORTCUT_HINT_ID, style: { margin: 0, opacity: 0.7 } },
          ko ? '입력 칸을 누른 뒤 원하는 키 조합을 누르세요. Esc로 취소하고 Backspace로 지웁니다.'
            : 'Click the field, then press the keys you want. Esc cancels, Backspace clears.'),
        React.createElement(ShortcutField, {
          label: ko ? '캐릭터와 말풍선 켜기·끄기 단축키 (비우면 사용 안 함)' : 'Character and speech bubbles setting toggle shortcut (empty to disable)',
          hintId: characterOn ? SHORTCUT_HINT_ID : SHORTCUT_HINT_ID + '-off',   // 꺼짐 안내는 별도 id (문서에 같은 id 두 개 금지)
          hint: characterOn ? '' : (ko ? '캐릭터와 말풍선이 꺼져 있어도 이 단축키로 다시 켤 수 있습니다.' : 'This shortcut still turns the character back on while it is off.'),
          value: shortcutValue,
          placeholder: 'Ctrl+Shift+D',
          ariaLabel: ko ? '캐릭터와 말풍선 켜기·끄기 단축키 입력' : 'Record character and speech bubbles toggle shortcut',
          ko, disabled: off,
          /** 녹음한 캐릭터 토글 단축키 저장 */
          onChange: (combo: string) => change('characterToggleKey', combo),
        }),
        React.createElement(DragKeyField, {
          label: ko ? '캐릭터 이동 키 (누른 채 끌기)' : 'Move character key (hold while dragging)',
          hintId: DRAG_HINT_ID,
          hint: !characterOn
            ? (ko ? '캐릭터와 말풍선이 꺼져 있을 때는 사용할 수 없습니다.' : 'Unavailable while the character and speech bubbles are off.')
            : (ko ? '캐릭터를 끌어 옮기는 동안 누를 키를 지정합니다. 수식 키(Alt·Ctrl·Shift·Cmd)나 일반 키 중 하나를 등록하세요. 비워 두면 마우스 왼쪽·오른쪽 버튼을 함께 누른 채 끌어 옮깁니다.'
              : 'Hold this key while dragging to move the character. Record one modifier (Alt, Ctrl, Shift, Cmd) or one other key. Empty needs both buttons.'),
          value: dragKey,
          ariaLabel: ko ? '캐릭터 이동 키 입력' : 'Record drag key',
          ko, disabled: off || !characterOn, inactive: !characterOn,
          /** 녹음한 이동 키 저장 */
          onChange: (key: string) => change('dragKey', key),
        }),
        // 캔버스만 숨김/표시: 캐릭터 설정을 끄는 것이 아니라 그리기만 멈춘다. 스위치를 단축키 칸 바로 왼쪽에 둔다.
        React.createElement(ShortcutField, {
          label: ko ? '캔버스만 숨김/표시 단축키 (비우면 사용 안 함)' : 'Hide/show canvas shortcut (empty to disable)',
          control: React.createElement('input', {
            type: 'checkbox', role: 'switch',
            'aria-label': ko ? '캔버스만 숨김/표시 사용' : 'Enable canvas hide/show',
            checked: canvasToggle,
            disabled: off || !characterOn,
            /** 캔버스 숨김 단축키 사용 여부 저장 */
            onChange: (event) => change('canvasToggle', event.target.checked),
          }),
          hintId: CANVAS_HINT_ID,
          hint: !characterOn
            ? (ko ? '캐릭터와 말풍선이 꺼져 있을 때는 사용할 수 없습니다. 캐릭터를 켜면 다시 쓸 수 있습니다.'
              : 'Unavailable while the character and speech bubbles are off. Turn the character on to use it again.')
            : (ko ? '왼쪽 스위치로 이 단축키의 사용 여부를 정합니다. 단축키를 누르면 캐릭터 설정은 켜 둔 채 캔버스만 숨기거나 다시 표시합니다. 숨겨진 동안에는 그리기만 멈춥니다.'
              : 'The switch enables this shortcut. The shortcut does not turn the character or speech-bubble setting off; it only hides and shows the canvas by pausing drawing.'),
          value: canvasKeyValue,
          placeholder: 'Ctrl+Shift+H',
          ariaLabel: ko ? '캔버스 숨김/표시 단축키 입력' : 'Record canvas hide/show shortcut',
          ko, disabled: off || !canvasToggle || !characterOn, inactive: !canvasToggle || !characterOn,
          /** 녹음한 캔버스 숨김 단축키 저장 */
          onChange: (combo: string) => change('canvasToggleKey', combo),
        }),
        React.createElement(CanvasHiddenNotice, { ko, link }),
        React.createElement(ShortcutField, {
          label: ko ? '펫 창 내보내기·돌아오기 단축키 (비우면 사용 안 함)' : 'Pet window shortcut (empty to disable)',
          hintId: PET_SHORTCUT_HINT_ID,
          hint: !characterOn
            ? (ko ? '캐릭터와 말풍선이 꺼져 있을 때는 사용할 수 없습니다.' : 'Unavailable while the character and speech bubbles are off.')
            : (ko ? '캐릭터를 바깥 펫 창으로 내보내고 다시 불러옵니다.'
              : 'Moves the character out to the pet window and back.'),
          value: petShortcutValue,
          placeholder: 'Ctrl+Shift+P',
          ariaLabel: ko ? '펫 창 단축키 입력' : 'Record pet window shortcut',
          ko, disabled: off || !characterOn, inactive: !characterOn,
          /** 녹음한 펫 창 단축키 저장 */
          onChange: (combo: string) => change('petToggleKey', combo),
        })),
      error ? React.createElement('p', { role: 'alert' }, error) : null,
      React.createElement(TtsSection, { form, keys, ko, writable: state.writable, tts: state.value?.tts }),
      updateSection(updater, ko))
  }
}

/** 시작 후 호스트 진단 상태를 읽을 때까지 기다리는 시간 (앱 아이콘 적용에 걸리는 시간보다 넉넉히) */
const HOST_STATUS_DELAY_MS = 15000

/**
 * 호스트 진단 상태 한 번 조회 후 실패만 콘솔 경고. 조회 자체가 안 되면 디버그 로그만
 * @param fetchImpl 시험용 fetch 대체
 */
async function reportHostStatus(fetchImpl: typeof fetch = (...args) => window.fetch(...args)) {
  try {
    const response = await fetchImpl('/deepseek-harness-kr/status', { cache: 'no-store' })
    if (!response.ok) { log.debug('호스트 상태 조회 실패: HTTP', response.status); return }
    const status = await response.json() as { appIcon?: { reason: string; message?: string } | null }
    const problem = status?.appIcon
    if (problem) log.warnOnce('app-icon:' + problem.reason + ':' + (problem.message ?? ''), '앱 아이콘 적용 실패:', problem.reason, problem.message ?? '')
  } catch (error) {
    log.debug('호스트 상태 조회 실패:', (error as Error)?.message ?? error)
  }
}

/**
 * 플러그인 화면 쪽 시작. 같은 페이지에 남은 이전 apply를 먼저 정리하고, 설정값에 맞춰 기능별 수명을 붙이고 뗌
 * 설정 화면·단축키·펫 창 설정 반영·업데이트·음성 키 저장소 연결
 */
function apply(ctx: DshContext) {
  window[SLOT]?.()
  const life = createLifetime()
  const features = new Map<string, Lifetime>()
  /**
   * 기능 하나를 켜짐 여부에 맞춰 붙이거나 떼기. 이미 맞으면 그대로, 붙이다 실패하면 정리 후 다시 던짐
   * @param mount 기능을 붙이는 함수 (enabled가 true일 때만 필요)
   */
  const reconcile = (name: string, enabled: boolean, mount?: (feature: ReturnType<typeof createLifetime>) => void) => {
    if (enabled === features.has(name)) return
    if (!enabled) { features.get(name)!.dispose(); features.delete(name); return }
    const feature = createLifetime()
    features.set(name, feature)
    try { mount!(feature) } catch (error) { feature.dispose(); features.delete(name); throw error }
  }
  life.add(() => { for (const feature of [...features.values()].reverse()) feature.dispose(); features.clear() })
  /** 이 apply가 붙인 것 전체 정리. 그사이 다른 apply가 자리를 차지했으면 무시 */
  const dispose = () => {
    if (window[SLOT] !== dispose) return
    life.dispose()
    delete window[SLOT]
  }
  window[SLOT] = dispose
  ctx.effect(() => dispose, 'deepseek-harness-kr: client')
  try {
    const form: ConfigForm<PluginSettings> = ctx.configForms.get(ENTRY_ID)
    const updater = createUpdater()
    const keys = createKeyStore()
    const link = createCharacterLink()
    links.set(ctx, link)
    const PET_CONFIG_KEYS = new Set([...OUTFIT_FIELDS.map(([field]) => field), 'bodyType', 'character'])
    /**
     * 바깥 펫 창의 우클릭 메뉴·설정 패널이 보내는 값의 설정 반영. 이 플러그인이 아는 키만 수용
     * bodyType은 알려진 체형만, 그 밖의 키는 true/false만 저장
     */
    const applyPetConfig = (key: string, value: unknown) => {
      if (typeof key !== 'string' || !PET_CONFIG_KEYS.has(key)) return
      const next = key === 'bodyType'
        ? (BODY_TYPES.some(([type]) => type === value) ? value : null)
        : (typeof value === 'boolean' ? value : null)
      if (next === null) return
      try {
        const result = form.set(key, next)
        if (result && typeof result.catch === 'function') result.catch(() => {})
      } catch {}
    }
    // 플러그인/자동화 패널에서 창 안 캐릭터만 숨긴다. 바깥 펫 창에는 hide/leave 같은 명령을 보내지 않는다.
    // 숨김 상태는 이 apply의 link가 들고 있어, 다른 플러그인 인스턴스의 정리가 이 인스턴스 상태를 지우지 못한다.
    let panelOwner: object | null = null
    if (typeof ctx.inject === 'function') {
      ctx.inject(['layout'], (scope) => {
        const panelInfo = scope.layout?.panelInfo
        if (!panelInfo || typeof panelInfo.getSnapshot !== 'function' || typeof panelInfo.subscribe !== 'function') return
        // layout이 다시 주입되면 새 구독이 주인이 된다. 늦게 온 옛 구독의 정리는 새 상태를 지우지 않는다.
        const owner = {}
        panelOwner = owner
        /** 지금 열린 패널에 맞춰 창 안 캐릭터 숨김 상태 갱신 (이 구독이 주인일 때만) */
        const syncPanelVisibility = () => {
          if (panelOwner !== owner) return
          link.setPageHidden(panelHidesInWindowCharacter(panelInfo.getSnapshot()?.activePanelId))
        }
        syncPanelVisibility()
        const off = panelInfo.subscribe(syncPanelVisibility)
        scope.effect(() => () => {
          off?.()
          if (panelOwner !== owner) return
          panelOwner = null
          link.setPageHidden(false)
        }, 'deepseek-harness-kr: in-window character visibility')
      })
    }
    // 플러그인 관리자는 선택적으로 연결: 없어도 캐릭터·테마·번역은 그대로 동작한다.
    if (typeof ctx.inject === 'function') {
      ctx.inject(['remote', 'remote.pluginManager'], (scope) => {
        updater.attach(scope.remote.pluginManager)
        scope.effect(() => () => updater.detach(), 'deepseek-harness-kr: updater')
      })
      // 음성 API 키 저장소도 선택적: 없으면 키 칸만 비활성화된다.
      ctx.inject(['remote', 'remote.credentials'], (scope) => {
        keys.attach(scope.remote.credentials)
        const off = typeof scope.remote.$on === 'function' ? scope.remote.$on('credentials/reference-updated', (ref: string) => keys.changed(ref)) : null
        scope.effect(() => () => { off?.(); keys.detach() }, 'deepseek-harness-kr: voice key')
      })
    }
    life.add(() => updater.detach())
    life.add(() => keys.detach())
    let ttsKey: string | null = null
    /** 음성 연결에 영향을 주는 설정이 바뀌었을 때만 음성 기능을 떼었다 다시 붙임 */
    const syncTts = (value: PluginSettings) => {
      const next = ttsSignature(value)
      if (next === ttsKey) return
      ttsKey = next
      reconcile('tts', false)
      if (next !== null) reconcile('tts', true, mountTts)
    }
    /** 설정값에 맞춰 번역·화면 표시·테마·캐릭터·음성 기능 붙이고 떼기 (설정이 바뀔 때마다) */
    const sync = () => {
      const snapshot = form.getSnapshot()
      if (snapshot.status !== 'ready') return
      const value: PluginSettings = snapshot.value ?? {}
      reconcile('translation', value.translation !== false, (feature) => mountTranslation(ctx, feature))
      reconcile('layout', value.character !== false || value.theme !== false, mountLayout)
      reconcile('theme', value.theme !== false, (feature) => mountTheme(ctx, feature))
      // 설정값을 먼저 정해 두어야 캐릭터가 처음 붙을 때 같은 값으로 시작한다
      link.setPrefs(characterPrefs(value))
      reconcile('character', value.character !== false, (feature) => startCharacter(feature, link, applyPetConfig))
      keys.setRef(value.tts?.openai?.apiKeyEnv ?? DEFAULT_KEY_REF)
      syncTts(value)
      // 캔버스 숨김 기능을 끄면 숨겨 둔 캔버스를 다시 표시 (기능을 되돌렸을 때)
      if (value.canvasToggle !== true && link.character?.canvasHidden() === true) link.character.toggleCanvas?.()
    }
    life.add(form.subscribe(sync))
    // 앱 아이콘은 호스트가 PowerShell·osascript로 몇 초 뒤에 적용하므로, 시작하고 잠시 뒤 결과를 한 번 받아 실패만 콘솔에 남김
    life.timeout(() => { void reportHostStatus() }, HOST_STATUS_DELAY_MS)
    let lastToggleAt = -Infinity, togglePending = false
    /**
     * 단축키로 캐릭터 토글: 설정의 character 스위치 뒤집기 (설정 화면과 같은 저장소·같은 마운트/정리 경로)
     * 키를 떼는 이벤트를 놓쳐도 다음 누름이 막히지 않도록, 누른 시각 기준으로만 연타 방지(150ms)
     */
    const toggleListener = async (event: KeyboardEvent) => {
      if (event.repeat) return
      const snapshot = form.getSnapshot()
      const combo = snapshot.value?.characterToggleKey ?? 'Ctrl+Shift+D'
      if (!parseShortcut(combo)) return
      // 텍스트 입력 중엔 발동하지 않게 (글자를 지우는 Shift+화살표 같은 조합 보호)
      const el = event.target as HTMLElement | null
      if (el && (el.isContentEditable || /^(input|textarea|select)$/i.test(el.tagName))) return
      if (!matchesShortcut(combo, event)) return
      event.preventDefault()
      if (togglePending || snapshot.status !== 'ready' || !snapshot.writable) return
      const now = Number(event.timeStamp) || performance.now()
      if (now - lastToggleAt < 150) return
      lastToggleAt = now
      togglePending = true
      try {
        if (!await form.set('character', snapshot.value?.character === false)) console.warn('캐릭터 설정 저장 실패')
      } catch { console.warn('캐릭터 설정 저장 실패') }
      finally { togglePending = false }
    }
    life.listen(window, 'keydown', toggleListener)
    let lastPetToggleAt = -Infinity
    /** 단축키로 바깥 펫 창으로 내보내기·돌아오기 (창 안 캐릭터가 노출한 토글 호출). 연타 방지 150ms */
    const petToggleListener = (event: KeyboardEvent) => {
      if (event.repeat) return
      const snapshot = form.getSnapshot()
      const combo = snapshot.value?.petToggleKey ?? 'Ctrl+Shift+P'
      const toggle = link.character?.togglePet
      if (!toggle || !parseShortcut(combo)) return
      // 텍스트 입력 중엔 발동하지 않게 (글자를 지우는 Shift+화살표 같은 조합 보호)
      const el = event.target as HTMLElement | null
      if (el && (el.isContentEditable || /^(input|textarea|select)$/i.test(el.tagName))) return
      if (!matchesShortcut(combo, event)) return
      event.preventDefault()
      if (snapshot.status !== 'ready') return
      const now = Number(event.timeStamp) || performance.now()
      if (now - lastPetToggleAt < 150) return
      lastPetToggleAt = now
      try { toggle() } catch { console.warn('펫 창 토글 실패') }
    }
    life.listen(window, 'keydown', petToggleListener)
    let lastCanvasToggleAt = -Infinity
    /**
     * 캔버스만 숨김/표시 단축키: 설정에서 켠 사람만 동작. 입력창에 포커스가 있어도 수식 키 조합이면 실행(글자를 쓰지 않음)
     * 키를 떼는 이벤트(keyup)를 놓쳐도 다음 누름이 막히지 않도록, 누른 시각 기준으로만 연타 방지(150ms)
     */
    const canvasToggleListener = (event: KeyboardEvent) => {
      if (event.repeat) return
      const snapshot = form.getSnapshot()
      if (snapshot.status !== 'ready' || snapshot.value?.canvasToggle !== true) return
      const combo = snapshot.value?.canvasToggleKey ?? 'Ctrl+Shift+H'
      const toggle = link.character?.toggleCanvas
      const parsed = parseShortcut(combo)
      if (!toggle || !parsed) return
      if (!matchesShortcut(combo, event)) return
      const el = event.target as HTMLElement | null
      const inInput = el && (el.isContentEditable || /^(input|textarea|select)$/i.test(el.tagName))
      if (inInput && !(parsed.ctrl || parsed.alt || parsed.meta)) return
      event.preventDefault()
      const now = Number(event.timeStamp) || performance.now()
      if (now - lastCanvasToggleAt < 150) return   // 같은 누름의 중복/아주 빠른 연타만 무시
      lastCanvasToggleAt = now
      try { toggle() } catch { console.warn('캔버스 숨김 토글 실패') }
    }
    life.listen(window, 'keydown', canvasToggleListener)
    life.add(ctx.slots.inject('plugins.row.config', () => ctx.slots.register({
      name: 'plugins.row.config', key: PLUGIN_ID + '#' + ENTRY_ID,
    }, settingsPage(ctx, form, updater, keys, link))))
    sync()
  } catch (error) { dispose(); throw error }
}

// apply(ctx)마다 만든 캐릭터 연결 (테스트가 ctx로 찾아 상태를 확인하거나 가짜 캐릭터를 붙인다)
const links = new WeakMap<DshContext, CharacterLink>()

export const inject = ['locale', 'theme', 'configForms', 'slots']
export { apply }
// 테스트용
export const internals = { githubSource, compareVersions, createUpdater, createKeyStore, ttsSignature, parseJsonObject, parseShortcut, shortcutFromEvent, shortcutKeyDown, dragKeyDown, matchesShortcut, panelHidesInWindowCharacter, characterPrefs,
  /** apply(ctx)가 만든 캐릭터 연결 */
  linkOf: (ctx: DshContext) => links.get(ctx) }
