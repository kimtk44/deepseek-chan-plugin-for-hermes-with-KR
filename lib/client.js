// 빌드 산출물입니다. 직접 고치지 말고 소스(character/, plugin/client.ts, shared/)를 고친 뒤 npm run build 하세요.
window.__ModuleLoader__.load({ id: "deepseek-harness-kr", factory: (require) => {
var module = { exports: {} }; var exports = module.exports;
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name2 in all)
    __defProp(target, name2, { get: all[name2], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// plugin/client.ts
var client_exports = {};
__export(client_exports, {
  apply: () => apply2,
  inject: () => inject,
  internals: () => internals
});
module.exports = __toCommonJS(client_exports);
var import_react = __toESM(require("react"), 1);

// package.json
var name = "deepseek-harness-kr";

// shared/settings.js
var OUTFIT_ITEMS = [
  { key: "glasses", ko: "뿔테 안경", en: "Glasses", param: "key11", on: 1, line: "outfit_glasses" },
  { key: "monocle", ko: "외눈 안경", en: "Monocle", param: "key12", on: 1, line: "outfit_glasses" },
  { key: "skirt", ko: "치마 길이 바꾸기", en: "Change skirt length", param: "Clothes1", on: -1, line: "outfit_skirt_long" },
  { key: "chestClothes", ko: "상의 바꾸기", en: "Change top", param: "Clothes3", on: 1, line: "outfit_chest_cover" },
  { key: "shoesOff", ko: "신발 벗기", en: "Take off shoes", param: "Clothes4", on: 1, line: "outfit_shoes" },
  { key: "tailHide", ko: "꼬리 숨기기", en: "Hide tail", param: "Clothes5", on: -1, line: "outfit_tail" },
  // 동물귀는 파라미터가 아니라 모델 파트(Part159)의 불투명도로 부드럽게 감춘다 (character/index.js의 earHide)
  { key: "earHide", ko: "동물귀 숨기기", en: "Hide animal ears" }
];
var BODY_TYPES = [
  { key: "default", ko: "기본 체형", en: "Default", value: 0 },
  { key: "type1", ko: "체형 1", en: "Body type 1", value: 0.4 },
  { key: "type2", ko: "체형 2 (꼬마)", en: "Body type 2 (chibi)", value: 1 }
];

// character/layout.ts
var HOME_GAP = 8;
var BUBBLE_ROOM = 78;
var SHOW_K = 0.42;
var MIN_SHOW_K = 0.18;
var MOBILE_ABOVE_SCALE = 0.3;
var homeLayout = ({ vp, r, maxK, W, visW, H, visH, minK, allowAbove = true }) => {
  const rightX = (k2) => vp.left + vp.w - 4 - (W + visW) / 2 * k2;
  const bottomY = (k2) => vp.top + vp.h - H * k2;
  const fit = (k2, above) => {
    const cap = above ? Math.min(maxK, (r.top - vp.top - HOME_GAP) / H) : Math.min(maxK, (vp.w - HOME_GAP) / visW);
    const want = k2 * (above ? MOBILE_ABOVE_SCALE : 1);
    const scale = Math.max(MIN_SHOW_K, Math.min(cap, want));
    return above ? { k: scale, x: rightX(scale), y: r.top - HOME_GAP - H * scale, above: true } : { k: scale, x: rightX(scale), y: bottomY(scale), above: false };
  };
  if (!r) {
    const k2 = maxK;
    return { k: k2, x: rightX(k2), y: bottomY(k2), above: false };
  }
  const sideK = Math.min(maxK, Math.max((vp.w - (r.right - vp.left) - HOME_GAP) / visW, (vp.h - (r.bottom - vp.top) - (allowAbove ? 4 : 10)) / visH));
  if (!allowAbove) return { k: sideK, x: rightX(sideK), y: bottomY(sideK), above: false };
  const aboveRoom = r.top - vp.top - HOME_GAP - BUBBLE_ROOM;
  const aboveK = Math.min(maxK, aboveRoom / H, (vp.w - HOME_GAP) / visW);
  if (sideK >= Math.min(minK, maxK)) return fit(sideK, false);
  if (aboveK >= MIN_SHOW_K) return fit(aboveK, true);
  const k = Math.min(maxK, MIN_SHOW_K);
  return { k, x: rightX(k), y: bottomY(k), above: false, noSafe: true };
};
var bubbleLayout = ({ vp, headX, headTop, bw, bh, r, above, tail = BUBBLE_TAIL }) => {
  const clampX = (left) => Math.min(Math.max(vp.left + HOME_GAP, left), Math.max(vp.left + HOME_GAP, vp.left + vp.w - bw - HOME_GAP));
  const clampY = (top) => Math.min(Math.max(vp.top + HOME_GAP, top), Math.max(vp.top + HOME_GAP, vp.top + vp.h - bh - HOME_GAP));
  const hit = (left, top) => !!r && left < r.right && left + bw > r.left && top < r.bottom && top + bh > r.top;
  const aboveTop = clampY(headTop - bh - 10);
  const aboveLeft = clampX(headX + tail - bw);
  if (!hit(aboveLeft, aboveTop) || above) return { left: aboveLeft, top: aboveTop, side: false };
  const below = r.bottom + HOME_GAP, sideLeft = clampX(vp.left + vp.w - bw - HOME_GAP);
  if (below + bh <= vp.top + vp.h - HOME_GAP) return { left: sideLeft, top: clampY(below), side: true };
  return { left: aboveLeft, top: aboveTop, side: false };
};
var BUBBLE_TAIL = 55;
var bubbleTail = (bubbleWidth) => Math.min(BUBBLE_TAIL, Math.round((bubbleWidth || 2 * BUBBLE_TAIL) / 2) + 2);
var tailRight = ({ noseX, width, margin = HOME_GAP, tail = BUBBLE_TAIL }) => Math.max(margin, width - (noseX + tail));
var tailLeft = ({ noseX, bw, width, margin = HOME_GAP, tail = BUBBLE_TAIL }) => Math.min(
  Math.max(margin, noseX - (bw - tail)),
  Math.max(margin, width - bw - margin)
);
var INTRO_BUBBLE = { font: 22, padY: 14, padX: 24, maxWidth: 560 };
var REST_BUBBLE = { font: 13, padY: 9, padX: 14 };
var introBubbleSize = (progress, restMaxWidth) => {
  const p = Math.min(1, Math.max(0, progress));
  const mix = (from, to) => from + (to - from) * p;
  return {
    font: mix(INTRO_BUBBLE.font, REST_BUBBLE.font),
    padY: mix(INTRO_BUBBLE.padY, REST_BUBBLE.padY),
    padX: mix(INTRO_BUBBLE.padX, REST_BUBBLE.padX),
    maxWidth: mix(INTRO_BUBBLE.maxWidth, restMaxWidth)
  };
};

// character/chord.ts
var CHORD_GRACE_MS = 150;
var chordDown = (chord, button, buttons, now) => {
  if (button !== 0 && button !== 2) return chord;
  const other = button === 0 ? 2 : 1;
  if (buttons & other) return chord;
  return { at: now, button, valid: false };
};
var chordWithinGrace = (chord, button, buttons, now, graceMs = CHORD_GRACE_MS) => {
  if (!chord || chord.valid !== true || !Number.isFinite(chord.at)) return false;
  if (button === chord.button) return false;
  const firstBit = chord.button === 0 ? 1 : chord.button === 2 ? 2 : 0;
  const secondBit = button === 0 ? 1 : button === 2 ? 2 : 0;
  if (!firstBit || !secondBit) return false;
  if (!(buttons & firstBit) || !(buttons & secondBit)) return false;
  const firstAt = chord.at;
  return now >= firstAt && now - firstAt <= graceMs;
};
var chordUp = (chord, buttons) => (buttons & 3) === 0 ? { at: null, button: null, valid: false } : chord;

// character/motion.ts
var clamp = (value, lo, hi) => Math.max(lo, Math.min(hi, value));
var hash = (n) => {
  const scaled = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return scaled - Math.floor(scaled);
};
var valueNoise = (t) => {
  const i = Math.floor(t), fraction = t - i, weight = fraction * fraction * (3 - 2 * fraction);
  return (hash(i) * (1 - weight) + hash(i + 1) * weight) * 2 - 1;
};
var noise = (t, seed) => valueNoise(t + seed * 17.31) * 0.72 + valueNoise(t * 2.3 + seed * 5.17) * 0.28;
var S = () => ({ x: 0, v: 0 });
var spring = (state, target, dt, stiffness, damping) => {
  const n = Math.max(1, Math.ceil(dt / 8e-3)), step = dt / n;
  for (let i = 0; i < n; i++) {
    state.v += ((target - state.x) * stiffness - state.v * damping) * step;
    state.x += state.v * step;
  }
  return state.x;
};
var sstep = (x) => {
  x = Math.max(0, Math.min(1, x));
  return x * x * x * (x * (x * 6 - 15) + 10);
};
var holdCurve = (progress, riseEnd = 0.35, fallStart = 0.7) => progress < riseEnd ? sstep(progress / riseEnd) : progress > fallStart ? sstep((1 - progress) / (1 - fallStart)) : 1;
function addGesture(gestureOut, name2, progress, direction) {
  const envelope = Math.sin(Math.PI * progress);
  switch (name2) {
    case "nod":
      gestureOut.pitch -= Math.abs(Math.sin(progress * Math.PI * 4)) * 11 * envelope;
      gestureOut.bodyY -= Math.abs(Math.sin(progress * Math.PI * 4)) * 3 * envelope;
      break;
    // 끄덕끄덕 (몸도 살짝 따라 숙임)
    case "tilt":
      gestureOut.roll += 15 * envelope * direction;
      gestureOut.bodyZ += 6 * envelope * direction;
      gestureOut.smile += envelope;
      break;
    // 고개 갸웃
    case "lean": {
      const hold = holdCurve(progress, 0.3, 0.72);
      gestureOut.lean -= 12 * hold;
      gestureOut.pitch += 4 * hold;
      gestureOut.roll += 8 * hold * direction;
      gestureOut.bodyX += 4 * hold * direction;
      gestureOut.smile += 0.7 * hold;
      break;
    }
    // 다가와 들여다보기: 몸은 앞으로, 턱은 살짝 들어 화면을 봄
    case "sway":
      gestureOut.bodyZ += Math.sin(progress * Math.PI * 6) * 9 * envelope;
      gestureOut.roll += Math.sin(progress * Math.PI * 6) * 6 * envelope;
      gestureOut.bodyX += Math.sin(progress * Math.PI * 6) * 5 * envelope;
      gestureOut.smile += envelope;
      break;
    // 흔들흔들 (몸도 좌우로 → 가슴·머리카락 좌우 출렁임)
    case "bounce":
      gestureOut.bodyY += Math.abs(Math.sin(progress * Math.PI * 4)) * 8 * envelope;
      gestureOut.bodyZ += Math.sin(progress * Math.PI * 4) * 6 * envelope;
      gestureOut.smile += envelope;
      break;
    // 신나서 통통
    case "droop":
      gestureOut.pitch -= 14 * envelope;
      gestureOut.bodyY -= 6 * envelope;
      break;
    case "flinch": {
      const impact = progress < 0.15 ? progress / 0.15 : 1 - (progress - 0.15) / 0.85;
      gestureOut.pitch -= 7 * impact;
      gestureOut.bodyY -= 3 * impact;
      break;
    }
    // 움찔
    case "bonk": {
      const impact = progress < 0.08 ? progress / 0.08 : Math.pow(1 - (progress - 0.08) / 0.92, 2);
      gestureOut.pitch -= 22 * impact;
      gestureOut.bodyY -= 9 * impact;
      gestureOut.roll += 7 * impact * direction;
      gestureOut.eyeClose += 0.6 * impact;
      break;
    }
    // 냄비에 맞음: 순간 푹 숙였다가 천천히 고개를 듦
    case "laugh":
      gestureOut.eyeSmile += envelope;
      gestureOut.eyeClose += envelope * 0.85;
      gestureOut.smile += envelope;
      {
        const bodyHold = holdCurve(progress, 0.25, 0.65), headHold = holdCurve(Math.max(0, progress - 0.08) / 0.92, 0.3, 0.6);
        gestureOut.lean -= 10 * bodyHold;
        gestureOut.pitch -= 9 * headHold - (progress > 0.7 ? 3 * Math.sin(Math.PI * (progress - 0.7) / 0.3) : 0);
        gestureOut.roll += 7 * bodyHold * direction;
      }
      gestureOut.bodyY += Math.abs(Math.sin(progress * Math.PI * 7)) * 7 * envelope;
      gestureOut.mouth += 0.45 * envelope;
      break;
  }
}
var blinkClose = (elapsed) => elapsed < 0.07 ? elapsed / 0.07 : elapsed < 0.1 ? 1 : elapsed < 0.22 ? 1 - (elapsed - 0.1) / 0.12 : 0;
var seg = (start, end, x) => clamp((x - start) / (end - start), 0, 1);
var coverForearm = (raise) => raise < 0.25 ? 0.15 * sstep(raise / 0.25) : raise < 0.45 ? 0.15 + 0.55 * seg(0.25, 0.45, raise) : raise < 0.8 ? 0.7 + 0.19 * sstep(seg(0.45, 0.8, raise)) : 0.89 - 0.03 * sstep(seg(0.8, 1, raise));

// character/harness-signals.ts
var TOOLS = {
  "명령 실행": "명령 실행 중…",
  "코드": "코드 돌리는 중…",
  "읽기": "파일 읽는 중…",
  "이미지 읽기": "그림 보는 중…",
  "편집": "코드 고치는 중…",
  "쓰기": "파일 쓰는 중…",
  "검색": "찾아보는 중…",
  "파일 내용 검색": "찾아보는 중…",
  "파일 찾기": "파일 찾는 중…",
  "웹 검색": "검색하는 중…",
  "웹페이지 가져오기": "웹페이지 보는 중…",
  "하위 에이전트 만들기": "도우미 부르는 중…",
  "팀원 만들기": "도우미 부르는 중…",
  "워크플로 실행": "워크플로 돌리는 중…",
  // 영어 화면
  "Bash": "명령 실행 중…",
  "Pwsh": "명령 실행 중…",
  "Code": "코드 돌리는 중…",
  "Read": "파일 읽는 중…",
  "Read image": "그림 보는 중…",
  "Edit": "코드 고치는 중…",
  "Write": "파일 쓰는 중…",
  "Search": "찾아보는 중…",
  "Grep": "찾아보는 중…",
  "Glob": "파일 찾는 중…",
  "Fetch": "웹페이지 보는 중…",
  "Create subagent": "도우미 부르는 중…",
  "Create teammate": "도우미 부르는 중…",
  "Run workflow": "워크플로 돌리는 중…"
};
var UI = {
  stop: 'button[aria-label="생성 중지"], button[aria-label="Stop generating"]',
  approval: '[aria-label="승인 상세"], [aria-label="Approval details"]',
  turnError: ["이번 턴 실행 실패", "This turn failed"]
};
function readStatus(doc) {
  const running = !!doc.querySelector(UI.stop);
  const waiting = doc.querySelector(UI.approval + ', [class*="Zf6DNq_card"]') ? "approval" : doc.querySelector('[data-question-reply], [data-question-key], [class*="Nksazq_card"], [class*="wnLwla_card"]') ? "question" : null;
  return { running, waiting };
}
function scanAddedNode(node, { running }) {
  const found = { error: false, tool: null };
  if (node.nodeType !== 1) return found;
  const element = node;
  const t = element.textContent || "";
  if (t.length < 400 && UI.turnError.some((phrase) => t.includes(phrase))) found.error = true;
  if (running && t.length < 200) {
    const leaves = element.children.length === 0 ? [element] : element.querySelectorAll("span, div");
    for (const el of leaves) {
      if (el.children.length) continue;
      const label = (el.textContent || "").trim();
      if (TOOLS[label]) {
        found.tool = TOOLS[label];
        break;
      }
    }
  }
  return found;
}
function readThought(doc) {
  const live = [...doc.querySelectorAll('[class*="VJlF5q_summary"][data-streaming]')].map((e) => (e.textContent || "").trim()).filter(Boolean).pop();
  if (live) return live;
  const groupTitle = [...doc.querySelectorAll('button[data-process-activity="thinking"][aria-expanded="false"] [data-shimmer] > span:first-child')].pop();
  if (groupTitle) {
    const t = groupTitle.textContent || "", i = t.indexOf(" · ");
    if (i >= 0 && t.slice(i + 3).trim()) return t.slice(i + 3).trim();
  }
  const body = [...doc.querySelectorAll('[class*="VJlF5q_thinkBody"]')].pop();
  if (!body) return "";
  const paragraphs = (body.innerText || "").split(/\n\s*\n/).map((paragraph) => paragraph.trim()).filter(Boolean);
  return paragraphs.length > 1 ? paragraphs[paragraphs.length - 2].split("\n")[0] : "";
}
var VERB = {
  is: "are",
  was: "were",
  has: "have",
  wants: "want",
  needs: "need",
  asks: "ask",
  asked: "asked",
  said: "said",
  says: "say",
  likes: "like",
  prefers: "prefer",
  seems: "seem",
  mentioned: "mentioned",
  requested: "requested"
};
var vtuberize = (text) => text.replace(/\b(the|this) user's\b/gi, (match) => match[0] === "T" ? "Your" : "your").replace(/\b(the|this) user (\w+)/gi, (_match, article, word) => {
  const you = article[0] === article[0].toUpperCase() ? "You" : "you";
  return you + " " + (VERB[word.toLowerCase()] || word);
}).replace(/\b(the|this) user\b/gi, (match) => match[0] === match[0].toUpperCase() ? "You" : "you");
function thoughtLine(summary, random = Math.random) {
  const t = summary.replace(/[*_`#>]+/g, "").replace(/\s+/g, " ").trim().replace(/^(?:[-•]|\d+[.)])\s+/, "").replace(/^\([^)]{1,30}\):?\s*/, "");
  const hangul = (t.match(/[가-힣]/g) || []).length;
  const latin = (t.match(/[A-Za-z]/g) || []).length;
  const first = (t.match(/^.{4,}?[.!?。…](\s|$)/) || [t])[0].trim();
  if (hangul >= 4 && latin <= hangul * 0.35)
    return first.length > 42 ? first.slice(0, 40).trim() + "…" : first;
  const words = first.split(" ").filter((word) => /[A-Za-z]{2,}/.test(word)).length;
  const symbols = (first.match(/[{}()\[\];=<>\/\\|$@]/g) || []).length;
  if (latin < 12 || words < 3 || hangul > latin * 0.1 || symbols > first.length * 0.04 || first.includes("://")) return null;
  let line = vtuberize(first);
  const hmm = random() < 0.3 ? "Hmm… " : "";
  const max = 64 - hmm.length;
  if (line.length > max) {
    const cut = line.slice(0, max - 2), lastSpace = cut.lastIndexOf(" ");
    line = (lastSpace > 30 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:]+$/, "") + "…";
  }
  if ((line.match(/"/g) || []).length % 2) line = line.slice(0, line.lastIndexOf('"')).replace(/[\s,;:]+$/, "") + "…";
  return hmm + line;
}

// character/log.ts
var PREFIX = "[deepseek-chan-plugin-for-dsh]";
var DEBUG_KEY = "deepseek-chan-plugin-for-dsh:debug";
var switchOn = (storage) => {
  try {
    return storage()?.getItem(DEBUG_KEY) === "1";
  } catch {
    return false;
  }
};
function createLogger(output = console, storage = () => globalThis.localStorage) {
  const seen = /* @__PURE__ */ new Set();
  const debugOn = switchOn(storage);
  return {
    warnOnce(key, ...args) {
      if (seen.has(key)) return;
      seen.add(key);
      output.warn(PREFIX, ...args);
    },
    // console.debug는 DevTools 기본 수준(Verbose 꺼짐)에서 안 보여 log로 남김
    debug(...args) {
      if (debugOn) output.log(PREFIX, ...args);
    }
  };
}
var log = createLogger();

// character/pet-link.ts
function createPetLink(deps) {
  const { url, fetch: fetch2, setTimeout: setTimeout2, setInterval: setInterval2, requestAnimationFrame: requestAnimationFrame2, now = () => performance.now(), log: log2 = log } = deps;
  const link = { open: false, opening: 0, supported: false, queue: [], last: "", polling: false, voiceSent: null, follow: null, boot: true, petState: "none", peek: 0, seq: 0 };
  link.relay = (name2, args) => {
    if (link.open || link.follow?.shown) link.queue.push([name2, args]);
  };
  link.post = (path, body = {}) => {
    deps.onUse();
    if ((path === "warm" || path === "open") && deps.avatar) body = { ...body, avatar: deps.avatar() };
    return fetch2(url + path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }).then((response) => response.ok ? response.json() : postRefused(path, response)).then((reply) => {
      if (reply?.state) link.petState = path === "hide" && reply.state === "shown" ? "hidden" : reply.state;
      return reply;
    }).catch((error) => {
      const reason = String(error?.message ?? error);
      log2.warnOnce(`post:${path}:${reason}`, `펫 요청 오류 (${path}):`, reason);
      return null;
    });
  };
  const postRefused = async (path, response) => {
    const reply = await response.json().catch(() => null);
    const reason = typeof reply?.error === "string" ? reply.error : "";
    log2.warnOnce(`post:${path}:${response.status}:${reason}`, `펫 요청 실패 (${path}): HTTP ${response.status}`, reason);
    return null;
  };
  const report = (event) => {
    const stderr = event.stderr ? ["\n" + String(event.stderr)] : [];
    if (event.type === "error") log2.warnOnce(`error:${event.message}`, "펫 창 오류:", event.message, ...stderr);
    else if (event.type === "closed" && ((event.code ?? 0) !== 0 || event.signal)) {
      const exit = [event.code !== void 0 && `code ${event.code}`, event.signal && `signal ${event.signal}`].filter(Boolean).join(", ");
      log2.warnOnce(`closed:${exit}`, `펫 프로세스 비정상 종료 (${exit}):`, ...stderr);
    } else if (event.type === "log") log2.warnOnce(`log:${event.text}`, `펫 창 ${event.level}:`, event.text);
  };
  link.enter = () => {
    const already = !!link.follow?.shown;
    link.open = true;
    link.opening = 0;
    link.last = "";
    deps.onUse();
    deps.onEnter();
    if (!already) link.queue.push(...deps.snapshot());
    link.queue.push(...deps.dragMessages());
  };
  link.leave = () => {
    if (!link.open) {
      link.opening = 0;
      return;
    }
    link.open = false;
    link.opening = 0;
    link.queue = [];
    deps.onLeave();
    requestAnimationFrame2(() => {
      if (!link.open && !link.follow) link.post("hide");
    });
  };
  const onShown = () => {
    if (!link.follow) {
      if (link.opening) link.enter();
      return;
    }
    if (!link.follow.shown) {
      link.follow.shown = true;
      link.queue.push(...deps.snapshot());
    }
  };
  const onHidden = () => {
    if (link.open) link.leave();
    else if (link.follow?.shown) link.follow.shown = false;
  };
  const onConfig = (list) => {
    if (!Array.isArray(list)) return;
    for (const pair of list) if (Array.isArray(pair) && pair.length === 2 && typeof pair[0] === "string") {
      try {
        deps.onConfig(pair[0], pair[1]);
      } catch {
      }
    }
  };
  const handle = (event) => {
    report(event);
    if (event.seq !== void 0 && event.seq !== link.seq) return;
    if (event.type === "shown") onShown();
    else if (event.type === "attach" || event.type === "closed" || event.type === "error") {
      link.follow = null;
      link.leave();
    } else if (event.type === "hidden") onHidden();
    else if (event.type === "config") onConfig(event.list);
  };
  link.poll = () => {
    if (link.polling) return;
    link.polling = true;
    fetch2(url + "poll", { cache: "no-store" }).then((response) => response.ok ? response.json() : null).then((status) => {
      link.polling = false;
      if (!status) return;
      link.supported = !!status.supported;
      link.petState = status.state || "none";
      if (link.boot && Number.isInteger(status.seq)) link.seq = Math.max(link.seq, status.seq);
      for (const event of status.events || []) handle(event);
      if (link.boot && status.state === "shown" && !link.open) {
        if (Number.isInteger(status.seq)) link.seq = status.seq;
        link.enter();
      }
      link.boot = false;
    }).catch((error) => {
      link.polling = false;
      log2.debug("펫 상태 조회 실패:", error);
    });
  };
  link.tick = () => {
    if (link.opening && now() - link.opening > 15e3) link.opening = 0;
    if (!link.open && !link.opening && !link.follow) return;
    if (link.open || link.follow) {
      const { dock, outfit, avatar } = deps.dockState();
      const sig = JSON.stringify([dock, outfit, avatar]);
      if (sig !== link.last) {
        link.last = sig;
        link.queue.push(["dock", [dock]], ["outfit", [outfit]]);
        if (avatar !== void 0) link.queue.push(["avatar", [avatar]]);
      }
      const dragNow = deps.dragKey();
      if (dragNow !== link.dragMod) {
        link.dragMod = dragNow;
        link.queue.push(["drag", [dragNow]]);
      }
      if (link.queue.length) {
        const list = link.queue;
        link.queue = [];
        link.post("send", { list });
      }
    }
    link.poll();
  };
  link.start = () => {
    if (!url) return;
    link.poll();
    const warmUp = (tries = 0) => {
      if (link.open || link.follow || link.supported && link.petState !== "none") return;
      if (!link.supported) {
        link.poll();
        if (tries < 8) setTimeout2(() => warmUp(tries + 1), 3e3);
        return;
      }
      if (!deps.idle()) {
        setTimeout2(() => warmUp(tries), 3e3);
        return;
      }
      (globalThis.requestIdleCallback || ((callback) => setTimeout2(callback, 0)))(() => {
        if (link.petState === "none") link.post("warm");
      }, { timeout: 5e3 });
    };
    setTimeout2(warmUp, 5e3);
    setInterval2(link.tick, 150);
    setInterval2(() => {
      const voice = deps.voice();
      if (!link.open || voice === link.voiceSent) return;
      link.voiceSent = voice;
      link.post("send", { list: [["voice", [voice]]] });
    }, 60);
  };
  link.toggle = () => {
    if (deps.hidden()) return;
    if (link.open) {
      link.leave();
      return;
    }
    if (link.follow?.shown) {
      link.opening = 0;
      link.post("hide");
      return;
    }
    if (!url) return;
    if (link.petState === "shown") {
      link.enter();
      return;
    }
    const pose = deps.openPose();
    link.opening = now();
    link.post("open", { from: pose, to: pose, seq: ++link.seq });
  };
  return link;
}

// character/speech.ts
var JUNG = "AEAEOEOEOAEEOUOEIUUII";
var latinVowel = (letter) => {
  const lower2 = letter.toLowerCase();
  return lower2 === "a" ? "A" : lower2 === "e" ? "E" : lower2 === "o" ? "O" : lower2 === "u" ? "U" : "I";
};
function addWord(word, syl, random) {
  let first = true, prevVowel = false;
  for (const letter of word) {
    const code = letter.charCodeAt(0);
    if (code >= 44032 && code <= 55203) {
      syl.push({ v: JUNG[Math.floor((code - 44032) % 588 / 28)], d: 0.15 + random() * 0.05, amp: 0.65 + random() * 0.35, stress: first });
      first = false;
    } else if (/[aeiouy]/i.test(letter)) {
      if (!prevVowel) {
        syl.push({ v: latinVowel(letter), d: 0.13 + random() * 0.05, amp: 0.55 + random() * 0.35, stress: first });
        first = false;
      }
      prevVowel = true;
      continue;
    } else if (/[.,!?…~。，！？]/.test(letter)) syl.push({ v: null, d: letter === "," || letter === "，" ? 0.12 : 0.24 });
    else if (/[0-9]/.test(letter)) {
      syl.push({ v: "A", d: 0.12, amp: 0.7, stress: first });
      first = false;
    }
    prevVowel = false;
  }
}
function parseSyllables(text, ms, random = Math.random) {
  const syl = [];
  for (const part of String(text).split(/(\s+)/)) {
    if (/^\s+$/.test(part)) {
      syl.push({ v: null, d: 0.07 });
      continue;
    }
    addWord(part, syl, random);
  }
  let total = syl.reduce((sum, item) => sum + item.d, 0);
  const limit = (ms || 3e3) / 1e3 * 0.92;
  if (total > limit && total > 0) {
    const k = limit / total;
    for (const item of syl) item.d *= k;
    total = limit;
  }
  return { syl, total };
}

// character/model-profile.ts
var MODEL_FILES = {
  model: "model/model.model3.json",
  // 모델 정의 (텍스처·물리·모션 참조)
  moc: "model/model.moc3",
  // Core Worker가 같은 모델을 따로 불러올 moc3
  idleMotionGroup: "Idle"
  // model3.json의 대기 모션 그룹 이름
};
var PARAMS = {
  // 머리·몸 (VBridger식 리깅: 아래 입력 값을 모델 물리가 늦게 따라가며 몸·머리카락을 움직임)
  headTurn: "AngleX",
  // 고개 좌우 돌림 (물리 입력)
  headTilt: "AngleY",
  // 고개 위아래 끄덕임 (물리 입력)
  headRoll: "AngleZ",
  // 고개 옆으로 갸웃 (물리 입력)
  headTurnDirect: "ParamAngleX",
  // 고개 좌우 돌림 직접 값 (물리 출력 자리, 머리카락 물리 입력)
  headTiltDirect: "ParamAngleY",
  // 고개 위아래 직접 값
  headRollDirect: "ParamAngleZ",
  // 고개 갸웃 직접 값
  bodyShiftX: "PositionX",
  // 몸 좌우 이동
  bodyShiftY: "PositionY",
  // 몸 위아래 이동
  bodyShiftZ: "PositionZ",
  // 몸 앞뒤 이동
  bodyLean: "LeanInput",
  // 몸 앞으로 숙임
  breath: "ParamBreath",
  // 숨쉬기
  // 눈·눈썹 (귀가 눈썹을 따라 움직임)
  eyeLookX: "ParamEyeBallX",
  // 눈동자 좌우
  eyeLookY: "ParamEyeBallY",
  // 눈동자 위아래
  eyeOpenLeft: "ParamEyeLOpen",
  // 왼눈 뜸
  eyeOpenRight: "ParamEyeROpen",
  // 오른눈 뜸
  eyeSmile: "EyeSmile",
  // 눈웃음
  browRaiseLeft: "ParamBrowLY",
  // 왼눈썹 높이
  browRaiseRight: "ParamBrowRY",
  // 오른눈썹 높이
  browInnerRaise: "BrowInnerUp",
  // 곤란한 눈썹 (안쪽 끝 올림)
  frown: "Angry",
  // 찡그린 얼굴 (삐짐)
  frownSecondary: "Angry2",
  // 찡그린 얼굴 둘째 겹 (삐짐)
  // 입
  mouthOpen: "ParamMouthOpenY",
  // 입 벌림
  jawOpen: "JawOpen",
  // 턱 벌림
  mouthClosed: "ParamSilence",
  // 다문 입 (말하지 않는 정도)
  mouthForm: "ParamMouthForm",
  // 입 모양 (웃음 쪽이 +)
  mouthSmileLeft: "MouthSmile_L",
  // 왼쪽 입꼬리 올림
  mouthSmileRight: "MouthSmile_R",
  // 오른쪽 입꼬리 올림
  cheekPuff: "CheeckPuff",
  // 볼 부풀리기 (삐짐)
  mouthPucker: "Mouthpucker",
  // 입 삐죽 (삐짐)
  mouthVowel: { A: "ParamA", I: "ParamI", U: "ParamU", E: "ParamE", O: "ParamO" },
  // 모음 입 모양 (말풍선 음성의 모음 키와 같은 이름)
  // 왼팔 가슴 가리기
  armFrontPose: "Movement2",
  // 몸 앞용 팔 그림으로 바꿈
  upperArmLeft: "Param62",
  // 왼 위팔 들기
  upperArmDepthLeft: "Param59",
  // 왼 위팔 원근 (아래팔보다 먼저)
  forearmLeft: "Param60",
  // 왼 아래팔 들기
  wristLeft: "Param61",
  // 왼 손목 꺾임
  // 가슴 물리 (끌어올리기·끌어당기기, 물리 계산 뒤에 더함)
  chestSwayVertical: ["ChestY1", "ChestY2", "ChestY3", "ChestY4"],
  // 가슴 위아래 흔들림
  chestSwayHorizontal: ["ChestX1", "ChestX2", "ChestX3"],
  // 가슴 좌우 흔들림
  // 소품·체형 (나머지 소품 파라미터는 shared/settings.js의 OUTFIT_ITEMS)
  basinProp: "key10",
  // 세숫대야 소품 (머리를 천천히 쓸어내리면)
  bodyType: "Clothes2"
  // 체형 (0 기본, 0.4 체형 1, 1 꼬마. 값은 shared/settings.js의 BODY_TYPES)
};
var CHEST_DRAG_SIGN = 1;
var VOWEL_EYE_SAFE = { I: 0.45, E: 0.45 };
var PARTS = {
  animalEars: "Part159",
  // 동물귀 (파라미터가 아니라 파트 불투명도로 감춤)
  chestCenter: ["Part88", "Part86"]
  // 가슴 메시 (보이는 가슴의 가운데를 터치 판정 기준으로 씀)
};
var PART_REGIONS = {
  Part99: "head",
  Part47: "head",
  Part155: "head",
  Part156: "head",
  Part161: "head",
  Part64: "head",
  Part66: "head",
  Part10: "head",
  Part8: "head",
  Part127: "arm",
  Part94: "arm",
  Part68: "arm",
  Part93: "arm",
  Part117: "arm",
  Part54: "arm",
  Part42: "arm",
  Part114: "leg",
  Part97: "lower",
  Part107: "lower",
  Part125: "lower",
  Part126: "lower",
  Part89: "waist",
  Part85: "chestpart",
  Part88: "chestpart",
  Part136: "tail"
};
var EXPRESSION_FILES = {
  loading: "model/exp/loading.exp3.json",
  // 작업 중 표시
  heart: "model/exp/heart.exp3.json",
  // 하트 눈
  blush: "model/exp/blush.exp3.json",
  // 홍조
  sweat: "model/exp/sweat.exp3.json",
  // 식은땀
  dizzy: "model/exp/dizzy.exp3.json",
  // 빙글빙글 눈
  tears: "model/exp/tears.exp3.json",
  // 눈물
  squint: "model/exp/squint.exp3.json",
  // >< 눈
  smug: "model/exp/smug.exp3.json",
  // 얄미운 눈
  dark: "model/exp/dark.exp3.json"
  // 어두운 얼굴 (정색)
};
var EYE_SWAP_EXPRESSIONS = ["heart", "squint", "smug", "dizzy"];
var BEHAVIORS = [
  "deepseek-chan.pot",
  "deepseek-chan.basin",
  "deepseek-chan.sulk",
  "deepseek-chan.chest",
  "deepseek-chan.lower",
  "deepseek-chan.outfit-lines"
];
var GEOMETRY = {
  bustCut: 0.47,
  // 상반신 잘림선(허리): 전신 높이 중 위에서부터의 비율 (창 안은 이 위만 보임)
  noseOffset: 0.055,
  // 코(얼굴) 가운데: 상반신 가로 중심에서 오른쪽으로 상반신 폭 대비 거리 (말풍선 꼬리 기준)
  headBottom: 0.3,
  // 터치: 머리로 치는 아래 끝 (전신 높이 비율)
  chestBottom: 0.4,
  // 터치: 가슴과 아랫배·허리 아래의 경계 (전신 높이 비율)
  coverArmBottom: 0.45,
  // 터치: 가슴을 가린 팔을 가슴으로 치는 아래 끝 (전신 높이 비율)
  chestCenterX: 0.45,
  // 터치: 가슴 타원 가운데 x (전신 폭 비율)
  chestCenterY: 0.295,
  // 터치: 가슴 타원 가운데 y (전신 높이 비율)
  chestRadiusX: 0.13,
  // 터치: 가슴 타원 가로 반지름 (전신 폭 비율)
  chestRadiusY: 0.045,
  // 터치: 가슴 타원 세로 반지름 (전신 높이 비율)
  chibiHeadBottom: 0.45
  // 꼬마 모습 터치: 보이는 그림 위에서부터 머리로 치는 비율
};

// character/hit.ts
function meshBounds(vertices) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (let i = 0; i < vertices.length; i += 2) {
    if (vertices[i] < x0) x0 = vertices[i];
    if (vertices[i] > x1) x1 = vertices[i];
    if (vertices[i + 1] < y0) y0 = vertices[i + 1];
    if (vertices[i + 1] > y1) y1 = vertices[i + 1];
  }
  return [x0, y0, x1, y1];
}
function meshHit(vertices, indices, uvs, px, py, alphaAt) {
  for (let i = 0; i < indices.length; i += 3) {
    const cornerA = indices[i] * 2, cornerB = indices[i + 1] * 2, cornerC = indices[i + 2] * 2;
    const det = (vertices[cornerB + 1] - vertices[cornerC + 1]) * (vertices[cornerA] - vertices[cornerC]) + (vertices[cornerC] - vertices[cornerB]) * (vertices[cornerA + 1] - vertices[cornerC + 1]);
    if (Math.abs(det) < 1e-9) continue;
    const weightA = ((vertices[cornerB + 1] - vertices[cornerC + 1]) * (px - vertices[cornerC]) + (vertices[cornerC] - vertices[cornerB]) * (py - vertices[cornerC + 1])) / det;
    const weightB = ((vertices[cornerC + 1] - vertices[cornerA + 1]) * (px - vertices[cornerC]) + (vertices[cornerA] - vertices[cornerC]) * (py - vertices[cornerC + 1])) / det;
    const weightC = 1 - weightA - weightB;
    if (weightA < 0 || weightB < 0 || weightC < 0) continue;
    if (alphaAt(weightA * uvs[cornerA] + weightB * uvs[cornerB] + weightC * uvs[cornerC], weightA * uvs[cornerA + 1] + weightB * uvs[cornerB + 1] + weightC * uvs[cornerC + 1]) > 40) return true;
  }
  return false;
}

// character/gaze.ts
var DEFAULT_GAZE = {
  rangePx: [600, 500],
  headShare: [0.85, 0.8],
  headDeg: [22, 13],
  headSpring: [38, 9.5],
  eyeLimit: [0.45, 0.3],
  eyeSpring: [900, 55],
  eyeSpringCalm: [420, 42],
  bone: { gain: [0.6, 0.5, 0.5], follow: 7, neckShare: 0.4, eyeDeg: [18, 14] },
  responsiveness: 1
};

// character/rig-live2d.ts
var FEATURES = /* @__PURE__ */ new Set(["bodyType", "earHide"]);
async function loadLive2DScripts(load) {
  if (!window.Live2DCubismCore) await load("vendor/live2dcubismcore.min.js");
  if (!window.PIXI) await load("vendor/pixi.min.js");
  if (!window.PIXI.live2d) await load("vendor/cubism4.patched.js");
}
async function createLive2DRig({ base, life, pet, prefs, canvas, W, H, chestDrag }) {
  const BASE = base;
  const app = new PIXI.Application({ view: canvas, width: W, height: H, sharedTicker: false, autoStart: false, backgroundAlpha: 0, antialias: true, autoDensity: true, resolution: (devicePixelRatio || 1) * 1.5 });
  const systemTicker = (on) => {
    try {
      app.renderer.plugins.interaction.useSystemTicker = on;
    } catch {
    }
  };
  life.add(() => app.destroy(true, { children: true }));
  const model = await PIXI.live2d.Live2DModel.from(BASE + MODEL_FILES.model, { autoUpdate: false, autoInteract: false, idleMotionGroup: MODEL_FILES.idleMotionGroup });
  if (life.stopped) {
    model.destroy();
    return null;
  }
  app.stage.addChild(model);
  app.ticker.add(() => model.update(Math.min(app.ticker.deltaMS, 100)), void 0, PIXI.UPDATE_PRIORITY.HIGH);
  const internalModel = model.internalModel, core = internalModel.coreModel;
  internalModel.eyeBlink = void 0;
  internalModel.breath = void 0;
  const setParam = (id, value, weight = 1) => core.setParameterValueById(id, value, weight);
  const addParam = (id, value, weight = 1) => core.addParameterValueById(id, value, weight);
  const multiplyParam = (id, value, weight = 1) => core.multiplyParameterValueById(id, value, weight);
  const paramRange = (id) => {
    const i = core.getParameterIndex(id);
    if (i < 0) return null;
    const min = core.getParameterMinimumValue(i), max = core.getParameterMaximumValue(i);
    return Number.isFinite(min) && Number.isFinite(max) ? { id, min, max } : null;
  };
  if (internalModel.physics) {
    const evaluate = internalModel.physics.evaluate;
    const chestParams = PARAMS.chestSwayVertical.map(paramRange).filter((found) => !!found);
    const chestXParams = PARAMS.chestSwayHorizontal.map(paramRange).filter((found) => !!found);
    internalModel.physics.evaluate = function(...args) {
      const result = evaluate.apply(this, args);
      const lift = chestDrag.lift.x * CHEST_DRAG_SIGN, shift = chestDrag.shift.x * CHEST_DRAG_SIGN;
      if (lift) for (const chestParam of chestParams) addParam(chestParam.id, lift * (lift > 0 ? chestParam.max : -chestParam.min));
      if (shift) for (const chestParam of chestXParams) addParam(chestParam.id, shift * (shift > 0 ? chestParam.max : -chestParam.min) * 0.9);
      return result;
    };
  }
  const WHOLE_BODY = !!pet;
  core.update();
  const cubismModel = core.getModel();
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const each = (fn) => {
    for (let i = 0; i < cubismModel.drawables.count; i++) {
      if (cubismModel.drawables.opacities[i] < 0.01) continue;
      const vertices = internalModel.getDrawableVertices(i);
      for (let j = 0; j < vertices.length; j += 2) fn(vertices[j], vertices[j + 1]);
    }
  };
  each((x, y) => {
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  });
  const cutY = minY + (maxY - minY) * GEOMETRY.bustCut;
  let bustMinX = Infinity, bustMaxX = -Infinity;
  each((x, y) => {
    if (y < cutY) {
      bustMinX = Math.min(bustMinX, x);
      bustMaxX = Math.max(bustMaxX, x);
    }
  });
  const bustScale = Math.min(W * 0.98 / (bustMaxX - bustMinX), H * 0.95 / (cutY - minY));
  const fullScale = Math.min(W * 0.98 / (maxX - minX), H * 0.95 / (maxY - minY));
  const PET_HEAD_RATIO = bustScale / fullScale;
  const PET_K_MIN = 0.45, PET_BUBBLE = 150;
  const PET_K_MAX = Math.max(1.2, ((typeof screen !== "undefined" && screen.availHeight ? screen.availHeight : 1080) - PET_BUBBLE) / H);
  const BUST_CX = (bustMinX + bustMaxX) / 2, FULL_CX = (minX + maxX) / 2;
  const WAIST_PET = H * 0.05 + (cutY - minY) * fullScale;
  const WAIST_WIN = H * 0.05 + (cutY - minY) * bustScale;
  const WAIST_PCT = WAIST_PET / H * 100;
  const bodyWidth = WHOLE_BODY ? maxX - minX : bustMaxX - bustMinX;
  const modelScale = WHOLE_BODY ? fullScale : bustScale;
  const HEAD_GAIN = bustScale / modelScale;
  model.scale.set(modelScale);
  model.x = W / 2 - ((WHOLE_BODY ? minX : bustMinX) + bodyWidth / 2) * modelScale;
  model.y = H * 0.05 - minY * modelScale;
  setParam(PARAMS.bodyType, 1);
  core.update();
  let chibiMinY = Infinity, chibiMaxY = -Infinity, chibiMinX = Infinity, chibiMaxX = -Infinity;
  each((x, y) => {
    chibiMinY = Math.min(chibiMinY, y);
    chibiMaxY = Math.max(chibiMaxY, y);
    chibiMinX = Math.min(chibiMinX, x);
    chibiMaxX = Math.max(chibiMaxX, x);
  });
  setParam(PARAMS.bodyType, 0);
  core.update();
  const baseY = model.y;
  const CHIBI_WIDTH = Number.isFinite(chibiMinX) && chibiMaxX > chibiMinX ? (chibiMaxX - chibiMinX) * modelScale : bodyWidth * modelScale;
  const WALK_BODY_WIDTH = Math.max(1, Math.min(bodyWidth * modelScale, CHIBI_WIDTH));
  const chibiDrop = Math.max(0, H * 0.99 - chibiMaxY * modelScale - baseY);
  const chibiHeadDrop = (chibiMinY - minY) * modelScale + chibiDrop;
  const noseModelX = BUST_CX + (bustMaxX - bustMinX) * GEOMETRY.noseOffset;
  (() => {
    const drawables2 = cubismModel.drawables, drawableCount = drawables2.count;
    const localUpdate = () => Object.getPrototypeOf(cubismModel).update.call(cubismModel);
    let w;
    try {
      w = new Worker(BASE + "dsc-core-worker.js");
    } catch {
      return;
    }
    life.add(() => {
      try {
        w.terminate();
      } catch {
      }
    });
    let lo = Infinity, hi = 0;
    for (let i = 0; i < drawableCount; i++) {
      const positions = drawables2.vertexPositions[i];
      lo = Math.min(lo, positions.byteOffset);
      hi = Math.max(hi, positions.byteOffset + positions.byteLength);
    }
    const offsets = Array.from(drawables2.vertexPositions, (positions) => positions.byteOffset - lo).join();
    const vertexBytes = new Uint8Array(drawables2.vertexPositions[0].buffer, lo, hi - lo);
    let ready = false, busy = false, result = null, spare = null;
    const stop = () => {
      ready = false;
      delete cubismModel.update;
      try {
        w.terminate();
      } catch {
      }
    };
    const apply3 = (buf) => {
      const bytes = new Uint8Array(buf);
      let offset = 0;
      vertexBytes.set(bytes.subarray(0, vertexBytes.length));
      offset += vertexBytes.length;
      drawables2.opacities.set(new Float32Array(buf, offset, drawableCount));
      offset += drawableCount * 4;
      drawables2.drawOrders.set(new Int32Array(buf, offset, drawableCount));
      offset += drawableCount * 4;
      drawables2.renderOrders.set(new Int32Array(buf, offset, drawableCount));
      offset += drawableCount * 4;
      drawables2.multiplyColors.set(new Float32Array(buf, offset, drawableCount * 4));
      offset += drawableCount * 16;
      drawables2.screenColors.set(new Float32Array(buf, offset, drawableCount * 4));
      offset += drawableCount * 16;
      drawables2.dynamicFlags.set(bytes.subarray(offset, offset + drawableCount));
    };
    w.onerror = (event) => {
      log.debug("Core Worker 오류, 메인 계산으로 전환:", event.message);
      stop();
    };
    w.onmessage = (e) => {
      const message = e.data;
      if (message.type === "ready") {
        if (message.count === drawableCount && message.params === cubismModel.parameters.count && message.parts === cubismModel.parts.count && message.offs.join() === offsets) ready = true;
        else {
          log.debug("Core Worker 모델 불일치, 메인 계산으로 전환");
          stop();
        }
      } else if (message.type === "frame") {
        result = message.buf;
        busy = false;
      } else if (message.type === "fail") {
        log.debug("Core Worker 실패, 메인 계산으로 전환:", message.message ?? "(사유 없음)");
        stop();
      }
    };
    cubismModel.update = () => {
      if (!ready) return localUpdate();
      if (result) {
        apply3(result);
        spare = result;
        result = null;
      }
      if (!busy) {
        const paramCount = cubismModel.parameters.count, inputs = new Float32Array(paramCount + cubismModel.parts.count);
        inputs.set(cubismModel.parameters.values);
        inputs.set(cubismModel.parts.opacities, paramCount);
        const transfer = [inputs.buffer];
        if (spare) transfer.push(spare);
        w.postMessage({ type: "frame", inp: inputs.buffer, out: spare }, transfer);
        spare = null;
        busy = true;
      }
    };
    w.postMessage({ type: "init", url: BASE + MODEL_FILES.moc });
  })();
  const expressionParams = {};
  await Promise.all(Object.entries(EXPRESSION_FILES).map(async ([expName, file]) => {
    try {
      expressionParams[expName] = (await (await fetch(BASE + file)).json()).Parameters || [];
    } catch (error) {
      log.debug("표정 파일 로드 실패:", expName, error);
      expressionParams[expName] = [];
    }
  }));
  if (life.stopped) return null;
  const EAR_PART_ID = PARTS.animalEars;
  const earPartIndexFor = (ids, id) => {
    if (!ids) return -1;
    const found = Array.from(ids).indexOf(id);
    return found >= 0 ? found : -1;
  };
  const earPartIndex = earPartIndexFor(cubismModel.parts && cubismModel.parts.ids, EAR_PART_ID);
  const earDrawables = [];
  if (earPartIndex >= 0) {
    for (let i = 0; i < cubismModel.drawables.count; i++) if (cubismModel.drawables.parentPartIndices[i] === earPartIndex) earDrawables.push(i);
  }
  const earSet = new Set(earDrawables);
  const earVisible = (opacity, flags) => opacity >= 0.05 && (flags & 1) !== 0;
  const earBaseVisible = new Map(earDrawables.map((i) => [i, earVisible(cubismModel.drawables.opacities[i], cubismModel.drawables.dynamicFlags[i])]));
  const earOpacityValue = (w) => Math.max(0, Math.min(1, 1 - w));
  const earOpacityStep = (w, on, dt) => Math.min(1, Math.max(0, w + ((on ? 1 : 0) - w) * Math.min(1, dt * 6)));
  const applyEarOpacity = (parts2, index, w) => {
    if (!parts2 || !parts2.opacities || index < 0) return false;
    parts2.opacities[index] = earOpacityValue(w);
    return true;
  };
  let earWeight = (prefs.outfit || {}).earHide ? 1 : 0;
  const earHitVisible = (i) => earWeight > 5e-3 ? earBaseVisible.get(i) === true : earVisible(cubismModel.drawables.opacities[i], cubismModel.drawables.dynamicFlags[i]);
  const drawables = cubismModel.drawables, parts = cubismModel.parts;
  const drawRegion = Array.from({ length: drawables.count }, (_, i) => {
    for (let part = drawables.parentPartIndices[i]; part >= 0; part = parts.parentIndices[part]) if (PART_REGIONS[parts.ids[part]]) return PART_REGIONS[parts.ids[part]];
    return null;
  });
  const chestDraw = [];
  for (let i = 0; i < drawables.count; i++) for (let part = drawables.parentPartIndices[i]; part >= 0; part = parts.parentIndices[part]) if (PARTS.chestCenter.includes(parts.ids[part])) {
    chestDraw.push(i);
    break;
  }
  const chestCenter = () => {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const i of chestDraw) {
      if (drawables.opacities[i] < 0.05) continue;
      const vertices = internalModel.getDrawableVertices(i);
      for (let j = 0; j < vertices.length; j += 2) {
        x0 = Math.min(x0, vertices[j]);
        x1 = Math.max(x1, vertices[j]);
        y0 = Math.min(y0, vertices[j + 1]);
        y1 = Math.max(y1, vertices[j + 1]);
      }
    }
    return x0 === Infinity ? null : { x: (x0 + x1) / 2, y: (y0 + y1) / 2 };
  };
  const chestBase = chestCenter();
  const bodyBounds = { minX, minY, w: maxX - minX, h: maxY - minY };
  const ALPHA_SIZE = 512;
  let alphaMaps = null;
  const buildAlpha = () => {
    alphaMaps = model.textures.map((t) => {
      try {
        const alphaCanvas = life.own(document.createElement("canvas"), (node) => node.remove());
        alphaCanvas.width = alphaCanvas.height = ALPHA_SIZE;
        const ctx = alphaCanvas.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(t.baseTexture.resource.source, 0, 0, ALPHA_SIZE, ALPHA_SIZE);
        const pixels = ctx.getImageData(0, 0, ALPHA_SIZE, ALPHA_SIZE).data, alpha = new Uint8Array(ALPHA_SIZE * ALPHA_SIZE);
        for (let i = 0; i < alpha.length; i++) alpha[i] = pixels[i * 4 + 3];
        return alpha;
      } catch {
        return null;
      }
    });
  };
  const alphaAt = (textureIndex, u, v) => {
    const alphaMap = alphaMaps[textureIndex];
    if (!alphaMap) return 255;
    return alphaMap[Math.min(ALPHA_SIZE - 1, Math.max(0, Math.floor((1 - v) * ALPHA_SIZE))) * ALPHA_SIZE + Math.min(ALPHA_SIZE - 1, Math.max(0, Math.floor(u * ALPHA_SIZE)))];
  };
  const touchable = (i) => earSet.has(i) ? earHitVisible(i) : !(drawables.opacities[i] < 0.05 || !(drawables.dynamicFlags[i] & 1));
  const DPR = (devicePixelRatio || 1) * 1.5;
  const metrics = {
    W,
    H,
    visW: bodyWidth * modelScale,
    noseX: model.x + noseModelX * model.scale.x,
    chibiHeadDrop,
    walkBodyWidth: WALK_BODY_WIDTH,
    waistPet: WAIST_PET,
    waistWin: WAIST_WIN,
    waistPct: WAIST_PCT,
    petHeadRatio: PET_HEAD_RATIO,
    headGain: HEAD_GAIN,
    petKMin: PET_K_MIN,
    petKMax: PET_K_MAX,
    petBubble: PET_BUBBLE,
    petBustOffset: (BUST_CX - FULL_CX) * fullScale
  };
  return {
    metrics,
    behaviors: BEHAVIORS,
    gaze: DEFAULT_GAZE,
    adultAllowed: true,
    supports: (feature) => FEATURES.has(feature),
    set: setParam,
    add: addParam,
    multiply: multiplyParam,
    expressionNames: () => Object.keys(expressionParams),
    expression(name2, w) {
      for (const entry of expressionParams[name2] || []) {
        if (entry.Blend === "Multiply") multiplyParam(entry.Id, entry.Value, w);
        else if (entry.Blend === "Add") addParam(entry.Id, entry.Value, w);
        else setParam(entry.Id, entry.Value, w);
      }
    },
    earHide(on, dt) {
      const earWas = earWeight;
      earWeight = earOpacityStep(earWeight, on, dt);
      if (earPartIndex >= 0) {
        if (earWeight > 5e-3) applyEarOpacity(cubismModel.parts, earPartIndex, earWeight);
        else if (earWas > 5e-3) cubismModel.parts.opacities[earPartIndex] = 1;
      }
    },
    bodyShape(weight) {
      model.y = baseY + chibiDrop * clamp(weight, 0, 1);
    },
    onFrame(fn) {
      internalModel.motionManager.expressionManager = {
        /** 정리할 것 없음 (Live2D 표정 매니저 자리 채우기용) */
        destroy() {
        },
        /** 한 프레임의 절차 애니메이션 (Live2D 모델 갱신 중 표정 매니저 자리에서 불림) */
        update: fn
      };
    },
    pick(x, y) {
      if (!alphaMaps) buildAlpha();
      const px = (x - model.x) / model.scale.x, py = (y - model.y) / model.scale.y;
      let best = -1, bestOrder = -Infinity;
      for (let i = 0; i < drawables.count; i++) {
        if (!touchable(i)) continue;
        const order = drawables.renderOrders[i];
        if (order <= bestOrder) continue;
        const vertices = internalModel.getDrawableVertices(i);
        const [x0, y0, x1, y1] = meshBounds(vertices);
        if (px < x0 || px > x1 || py < y0 || py > y1) continue;
        if (meshHit(vertices, drawables.indices[i], drawables.vertexUvs[i], px, py, (u, v) => alphaAt(drawables.textureIndices[i], u, v))) {
          best = i;
          bestOrder = order;
        }
      }
      return best;
    },
    touchShape(x, y, drawable) {
      const scale = model.scale.x, currentChest = chestCenter();
      const shiftX = currentChest && chestBase ? currentChest.x - chestBase.x : 0, shiftY = currentChest && chestBase ? currentChest.y - chestBase.y : 0;
      const ratioX = (x - model.x - (bodyBounds.minX + shiftX) * scale) / (bodyBounds.w * scale);
      const ratioY = (y - model.y - (bodyBounds.minY + shiftY) * scale) / (bodyBounds.h * scale);
      const inChest = Math.pow((ratioX - GEOMETRY.chestCenterX) / GEOMETRY.chestRadiusX, 2) + Math.pow((ratioY - GEOMETRY.chestCenterY) / GEOMETRY.chestRadiusY, 2) <= 1;
      return { part: drawRegion[drawable], ratioY, inChest };
    },
    chibiRegion(y) {
      let y0 = Infinity, y1 = -Infinity;
      for (let i = 0; i < drawables.count; i++) {
        if (drawables.opacities[i] < 0.05) continue;
        const vertices = internalModel.getDrawableVertices(i);
        for (let j = 1; j < vertices.length; j += 2) {
          if (vertices[j] < y0) y0 = vertices[j];
          if (vertices[j] > y1) y1 = vertices[j];
        }
      }
      return ((y - model.y) / model.scale.y - y0) / (y1 - y0) < GEOMETRY.chibiHeadBottom ? "head" : "body";
    },
    setResolution(k) {
      const res = DPR * Math.max(1, k);
      if (app.renderer.resolution === res) return;
      app.renderer.resolution = res;
      app.renderer.resize(W, H);
    },
    resetClock() {
      app.ticker.lastTime = performance.now();
    },
    tick(time) {
      app.ticker.update(time);
    },
    systemTicker
  };
}

// character/behavior.ts
var EVENTS = {
  /** 머리를 누른 채 빠르게 쓸어내림 */
  headStrokeFast: "touch.head.stroke.fast",
  /** 머리를 누른 채 천천히 쓸어내림 */
  headStrokeSlow: "touch.head.stroke.slow",
  /** 머리 탭이 8초 안에 세 번째 (맡은 행동이 없으면 평소 머리 탭) */
  headRepeat: "touch.head.repeat",
  /** 가슴 부위 탭 (맡은 행동이 없으면 가슴 부위는 몸으로 침) */
  chestTap: "touch.chest.tap",
  /** 가슴을 누른 채 위로 끌기. phase = start → move… → end(놓음) 또는 cancel(집기로 넘어감) */
  chestPull: "touch.chest.pull",
  /** 아랫배(치마) 부위 탭 (맡은 행동이 없으면 몸으로 침) */
  lowerTap: "touch.lower.tap",
  /** 소품·옷·체형을 켠 순간. concept = 소품 정의(shared/settings.js line)가 정한 대사 콘셉트 */
  outfitChange: "outfit.change"
};
var TAGS = {
  /** 행동이 자기 연출 중: 대기 몸짓·산책·소품 대사·가슴 끌기 같은 자율 동작을 하지 않음 */
  busy: "busy",
  /** 정면을 똑바로 봄: 시선을 고정하고 얼굴·몸 흔들림을 거의 멈춤 */
  stare: "gaze.stare",
  /** 부끄럽지만 좋아서 입꼬리가 올라간 "헤~" 입과 곤란한 눈썹 */
  shySmile: "face.shy",
  /** 팔이 몸 앞에서 가슴을 가리는 중: 그 팔을 누르면 가슴 터치로 봄 */
  armCover: "pose.arm-cover"
};
var NO_BLEND = { weight: 0, eye: 0, peek: 0 };
function createBehaviors(defs, ids, ctx, { allowAdult = true, warn = () => {
} } = {}) {
  const byId = new Map(defs.map((def) => [def.id, def]));
  const enabled = [];
  for (const id of new Set(ids)) {
    const def = byId.get(id);
    if (!def) {
      warn(`알 수 없는 행동: ${id}`);
      continue;
    }
    if (def.adult && !allowAdult) {
      warn(`성적 표현을 허용하지 않는 모델이라 끔: ${id}`);
      continue;
    }
    enabled.push({ def, instance: def.create(ctx) });
  }
  const owners = /* @__PURE__ */ new Map();
  for (const { instance } of enabled) for (const [key, handler] of Object.entries(instance.on)) {
    if (!handler) continue;
    owners.set(key, [...owners.get(key) || [], handler]);
  }
  const handlers = /* @__PURE__ */ new Map();
  for (const [key, list] of owners) {
    if (list.length === 1) handlers.set(key, list[0]);
    else warn(`이벤트를 둘 이상의 행동이 맡음 (기본 반응으로 처리): ${key}`);
  }
  const slots = (slot) => enabled.map(({ instance }) => instance.frame?.[slot]).filter((fn) => !!fn);
  const frameSlots = { start: slots("start"), motion: slots("motion"), face: slots("face"), params: slots("params") };
  const touchedFns = enabled.map(({ instance }) => instance.touched?.bind(instance)).filter((fn) => !!fn);
  const noMotion = {};
  const blends = enabled.map(({ instance }) => instance.blend?.bind(instance)).filter((fn) => !!fn);
  return {
    ids: enabled.map(({ def }) => def.id),
    has: (key) => handlers.has(key),
    dispatch(key, event) {
      const handler = handlers.get(key);
      if (!handler) return false;
      handler(event);
      return true;
    },
    frame(slot, frame, motion = noMotion) {
      for (const fn of frameSlots[slot]) fn(frame, motion);
    },
    touched(region, now) {
      for (const fn of touchedFns) fn(region, now);
    },
    blend(motion, frame) {
      let best = NO_BLEND;
      for (const fn of blends) {
        const result = fn(motion, frame);
        if (result && result.weight > best.weight) best = result;
      }
      return best;
    },
    tagged: (tag, now) => enabled.some(({ instance }) => !!instance.tags && instance.tags(now).includes(tag))
  };
}
function createTimeline(timeout, clear) {
  return (steps) => {
    const ids = steps.map((step) => timeout(step.do, step.at));
    return { cancel() {
      for (const id of ids) clear(id);
    } };
  };
}

// character/behaviors/deepseek-chan/sulk.ts
var SULKING = "sulking";
var SULK_MS = 15e3;
var STARE_MS = 4300;
var SULK_CHIN = 10;
var PEEK_RISE = 550;
var PEEK_HOLD = 450;
var PEEK_SNAP = 150;
var POUT = [[PARAMS.cheekPuff, 0.5], [PARAMS.mouthPucker, 0.3], [PARAMS.frown, 0.5], [PARAMS.frownSecondary, 0.5]];
var sulk = {
  id: "deepseek-chan.sulk",
  create(ctx) {
    let start = -1e9, until = 0, stareUntil = 0, dir = 1, yaw = 0, roll = 0;
    let peeks = [];
    let weight = 0, peek = 0;
    return {
      on: {
        [EVENTS.headRepeat]: ({ now }) => {
          ctx.resetTapCounters();
          ctx.clearExp(["dark", "smug"]);
          ctx.cancelGesture();
          start = now;
          until = now + SULK_MS;
          ctx.lockInput(SULK_MS);
          dir = Math.random() < 0.5 ? 1 : -1;
          yaw = roll = 0;
          peeks = [0, 1, 2].map((i) => ({ at: 2800 + i * 4e3 + (Math.random() - 0.5) * 1e3, flip: Math.random() < 0.6, done: false }));
          ctx.speak("head_sulk", 4e3);
          ctx.flashExp("blush", SULK_MS);
          ctx.timeline([{ at: SULK_MS, do: () => {
            stareUntil = ctx.now() + STARE_MS;
            ctx.speak("head_after", 4e3);
          } }]);
        }
      },
      /** 0.35초에 턱을 들고 고개를 홱 돌리고, 끝나기 1.2초 전부터 천천히 돌아옴 */
      blend(motion, { now, dt }) {
        weight = now < until ? Math.min(sstep((now - start) / 350), sstep((until - now) / 1200)) : 0;
        peek = 0;
        if (weight <= 0) return null;
        const elapsed = now - start;
        for (const event of peeks) {
          const since = elapsed - event.at;
          if (since < 0 || since > PEEK_RISE + PEEK_HOLD + PEEK_SNAP) continue;
          if (since >= PEEK_RISE + PEEK_HOLD && !event.done) {
            event.done = true;
            if (event.flip) dir = -dir;
          }
          peek = since < PEEK_RISE ? sstep(since / PEEK_RISE) : since < PEEK_RISE + PEEK_HOLD ? 1 : 1 - sstep((since - PEEK_RISE - PEEK_HOLD) / PEEK_SNAP);
        }
        const away = 1 - 0.75 * peek, turnRate = Math.min(1, dt * 14);
        yaw += (-24 * dir * away - yaw) * turnRate;
        roll += (-8 * dir * away - roll) * turnRate;
        motion.yaw = motion.yaw * (1 - weight) + yaw * weight;
        motion.roll = motion.roll * (1 - weight) + roll * weight;
        motion.pitch = motion.pitch * (1 - weight) + SULK_CHIN * (1 - 0.6 * peek) * weight;
        motion.bodyX = motion.bodyX * (1 - weight) + yaw / 6 * weight;
        motion.smile *= 1 - weight;
        motion.eyeSmileAdd *= 1 - weight;
        const eye = dir * (-0.45 + 0.85 * Math.min(1, peek * 1.8));
        return { weight, eye, peek };
      },
      frame: {
        /** 볼 부풀리기·입 삐죽·찡그린 눈썹 (몰래 볼 땐 조금 풀림) */
        face: () => {
          if (weight > 0.01) for (const [id, eased] of POUT) ctx.addParam(id, weight * (1 - eased * peek));
        }
      },
      tags: (now) => [...now < until ? [TAGS.busy, SULKING] : [], ...now < stareUntil ? [TAGS.stare] : []]
      // 풀린 직후 다시 삐지면 둘 다
    };
  }
};

// character/behaviors/deepseek-chan/basin.ts
var HEAD_COVERED = "head.covered";
var basin = {
  id: "deepseek-chan.basin",
  create(ctx) {
    let until = 0, weight = 0;
    return {
      on: {
        [EVENTS.headStrokeSlow]: ({ now }) => {
          ctx.markTouched();
          ctx.resetTapCounters();
          until = now + 1e4;
          ctx.speak("basin_on", 3800);
        }
      },
      frame: {
        params: ({ now, dt }) => {
          weight += ((now < until ? 1 : 0) - weight) * Math.min(1, dt * 4);
          if (weight > 5e-3) ctx.addParam(PARAMS.basinProp, weight);
        }
      },
      tags: (now) => now < until ? [HEAD_COVERED] : []
    };
  }
};

// character/behaviors/deepseek-chan/chest.ts
var chest = {
  id: "deepseek-chan.chest",
  adult: true,
  create(ctx) {
    const shy = { count: 0, last: -1e9, cooldownUntil: 0 };
    let touchLeanUntil = 0, touchLean = 0, shyUntil = 0;
    const cover = { until: 0, start: -1e9, q: 0 };
    let pulling = false, target = 0, shiftTarget = 0, longTimer = 0;
    const shake = { x: 0, y: 0, acc: 0, last: 0, next: 0 };
    const { lift, shift } = ctx.chestDrag;
    const coverChest = (ms) => {
      const now = ctx.now();
      if (now >= cover.until) cover.start = now;
      cover.until = Math.max(cover.until, now + ms);
    };
    const onTap = ({ now }) => {
      if (now < shy.cooldownUntil || now - shy.last < 180) return;
      if (now - shy.last > 8e3) shy.count = 0;
      shy.last = now;
      shy.count++;
      if (shy.count <= 4) {
        if (now < touchLeanUntil || Math.random() < 0.16) touchLeanUntil = now + 3e3;
        ctx.speak(shy.count <= 1 ? "chest1" : "chest2", 4e3);
        if (shy.count >= 2) shyUntil = now + 4e3;
        if (shy.count >= 3) coverChest(2600);
      } else {
        touchLeanUntil = 0;
        shy.count = 0;
        shy.cooldownUntil = now + 6e3;
        ctx.lockInput(6e3);
        ctx.shiver();
        ctx.speak("chest3", 3e3);
        shyUntil = now + 6e3;
        coverChest(6e3);
        ctx.timeline([{ at: 3e3, do: () => ctx.speak("chest_calm", 2800) }]);
      }
    };
    const armLong = () => {
      clearInterval(longTimer);
      const startedAt = ctx.now();
      shake.acc = 0;
      shake.last = 0;
      shake.next = startedAt + 3e3;
      longTimer = ctx.life.interval(() => {
        if (!pulling) {
          clearInterval(longTimer);
          longTimer = 0;
          return;
        }
        const now = ctx.now();
        if (now < shake.next) return;
        if (now - shake.last > 500 || shake.acc < 30) return;
        ctx.speak(now - startedAt >= 4e3 ? "chest_pull_dizzy" : "chest_pull_long", 4e3);
        shake.acc = 0;
        shake.next = now + 3e3;
      }, 300);
    };
    const stopPull = () => {
      pulling = false;
      target = 0;
      shiftTarget = 0;
      clearInterval(longTimer);
    };
    const onPull = ({ now, phase, dx = 0, dy = 0 }) => {
      if (phase === "start") {
        pulling = true;
        shy.count = 0;
        ctx.resetTapCounters();
        cover.until = 0;
        ctx.markTouched();
        ctx.speak("chest_pull", 3e3);
        armLong();
        ctx.flashExp("squint", 400);
        ctx.flashExp("blush", 400);
      }
      if (phase === "start" || phase === "move") {
        const curK = ctx.scale(), up = Math.max(0, -dy / curK);
        target = 1 - Math.exp(-up / 85);
        shiftTarget = clamp(dx / (curK * 110), -1, 1) * (0.45 + 0.55 * Math.min(1, target * 1.4));
        const moved = Math.hypot(dx - shake.x, dy - shake.y);
        shake.x = dx;
        shake.y = dy;
        if (moved > 1) {
          shake.acc += moved;
          shake.last = now;
        }
      } else if (phase === "end") {
        stopPull();
        const dropped = Math.max(0, lift.x);
        lift.v = Math.min(0, lift.v) - dropped * 2.5;
        ctx.speak("chest_drop", 3500);
        ctx.shiver();
        coverChest(3e3);
        ctx.lockInput(2500);
        ctx.markTouched();
      } else stopPull();
    };
    return {
      on: { [EVENTS.chestTap]: onTap, [EVENTS.chestPull]: onPull },
      touched: (region) => {
        if (region !== "chest") shy.count = 0;
      },
      frame: {
        /** 가슴 끌기 스프링: 끄는 동안 민첩하게 따라가고, 놓으면 출렁이며 잦아듦 */
        start: ({ dt }) => {
          spring(lift, pulling ? target : 0, dt, pulling ? 820 : 200, pulling ? 40 : 6);
          spring(shift, pulling ? shiftTarget : 0, dt, pulling ? 700 : 220, pulling ? 42 : 7);
          if (!pulling && Math.abs(shift.x) < 1e-4 && Math.abs(shift.v) < 1e-3) shift.x = shift.v = 0;
          if (!pulling && Math.abs(lift.x) < 1e-4 && Math.abs(lift.v) < 1e-3) lift.x = lift.v = 0;
          if (pulling) {
            ctx.flashExp("squint", 400);
            ctx.flashExp("blush", 400);
            ctx.markTouched();
          }
        },
        /** 가슴 터치 때 가끔 앞으로 숙임 */
        motion: ({ now, dt }, motion) => {
          touchLean += ((now < touchLeanUntil ? -30 : 0) - touchLean) * Math.min(1, dt * 4);
          motion.lean += touchLean;
        },
        /** 왼손 가슴 가리기 진행(올리는 데 0.38초, 내릴 땐 같은 길을 거꾸로)과 팔 파라미터 쓰기 */
        params: ({ now, dt, seconds }) => {
          const leaning = now < touchLeanUntil || touchLean < -2;
          const want = now >= cover.start && now < cover.until && ctx.bodyWeight() < 0.5 && !ctx.displaced() && !leaning;
          const coverBefore = cover.q;
          cover.q = clamp(cover.q + (want ? 1 : -1) * dt / 0.38, 0, 1);
          if (cover.q > 0) {
            const coverAmount = cover.q;
            const forearm = coverForearm(coverAmount);
            const breath = Math.sin(seconds * Math.PI * 2 * 0.4) * 0.02 * sstep(seg(0.8, 1, coverAmount));
            const velocity = (cover.q - coverBefore) / Math.max(dt, 1e-3);
            ctx.setParam(PARAMS.armFrontPose, 1);
            ctx.addParam(PARAMS.upperArmLeft, 0.034 * sstep(coverAmount));
            ctx.addParam(PARAMS.upperArmDepthLeft, 0.48 * sstep(seg(0, 0.6, coverAmount)));
            ctx.addParam(PARAMS.forearmLeft, forearm + breath);
            ctx.addParam(PARAMS.wristLeft, clamp(velocity * 0.06, -0.2, 0.2) * Math.sin(Math.PI * coverAmount));
          }
        }
      },
      tags: (now) => [...now < shyUntil ? [TAGS.shySmile] : [], ...cover.q > 0.3 ? [TAGS.armCover] : []]
    };
  }
};

// character/behaviors/deepseek-chan/lower.ts
var lower = {
  id: "deepseek-chan.lower",
  adult: true,
  create(ctx) {
    const low = { count: 0, last: -1e9, cooldownUntil: 0 };
    const onTap = ({ now }) => {
      if (ctx.displaced() || now < low.cooldownUntil || now - low.last < 180) return;
      if (now - low.last > 8e3) low.count = 0;
      low.last = now;
      low.count++;
      if (low.count <= 2) ctx.speak("lower1", 4e3);
      else if (low.count <= 4) ctx.speak("lower2", 4e3);
      else {
        low.count = 0;
        low.cooldownUntil = now + 14e3;
        ctx.shiver();
        ctx.speak("lower3", 900);
        ctx.timeline([{ at: 900, do: () => ctx.flee(() => ctx.speak("lower_after", 4e3)) }]);
      }
    };
    return {
      on: { [EVENTS.lowerTap]: onTap },
      touched: (region) => {
        if (region !== "lower") low.count = 0;
      }
    };
  }
};

// character/behaviors/deepseek-chan/outfit-lines.ts
var outfitLines = {
  id: "deepseek-chan.outfit-lines",
  create(ctx) {
    return { on: { [EVENTS.outfitChange]: ({ concept }) => {
      if (concept) ctx.speak(concept, 4e3);
    } } };
  }
};

// character/behaviors/deepseek-chan/pot.ts
var POT_SVG = '<svg viewBox="0 0 140 100" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="dscPotBody" x1="0" x2="1"><stop offset="0" stop-color="#7d8794"/><stop offset=".35" stop-color="#e3e8ee"/><stop offset=".6" stop-color="#b8c0ca"/><stop offset="1" stop-color="#6c7580"/></linearGradient></defs><rect x="2" y="34" width="26" height="10" rx="5" fill="#3d434b"/><rect x="112" y="34" width="26" height="10" rx="5" fill="#3d434b"/><path d="M22 30 H118 V78 Q118 96 100 96 H40 Q22 96 22 78 Z" fill="url(#dscPotBody)" stroke="#4b525b" stroke-width="3"/><ellipse cx="70" cy="30" rx="50" ry="10" fill="#d7dde4" stroke="#4b525b" stroke-width="3"/><ellipse cx="70" cy="30" rx="40" ry="6" fill="#59616b"/><path d="M38 48 Q44 70 40 86" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".55" fill="none"/></svg>';
var impactSvg = (guarded) => {
  const points = [];
  for (let i = 0; i < 20; i++) {
    const radius = i % 2 ? 22 : 46, angle = i / 20 * Math.PI * 2 - Math.PI / 2;
    points.push((50 + Math.cos(angle) * radius).toFixed(1) + "," + (50 + Math.sin(angle) * radius).toFixed(1));
  }
  const fill = guarded ? "#f1f5f9" : "#ffe14d", stroke = guarded ? "#64748b" : "#ea580c", core = guarded ? "#ffffff" : "#fff7c2";
  let rays = "";
  for (let i = 0; i < 8; i++) {
    const angle = i / 8 * Math.PI * 2 + 0.2, cos = Math.cos(angle), sin = Math.sin(angle);
    rays += `<line x1="${(50 + cos * 50).toFixed(1)}" y1="${(50 + sin * 50).toFixed(1)}" x2="${(50 + cos * 62).toFixed(1)}" y2="${(50 + sin * 62).toFixed(1)}" stroke="${stroke}" stroke-width="4" stroke-linecap="round"/>`;
  }
  return `<svg viewBox="-14 -14 128 128" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">${rays}<polygon points="${points.join(" ")}" fill="${fill}" stroke="${stroke}" stroke-width="4" stroke-linejoin="round"/><circle cx="50" cy="50" r="12" fill="${core}"/></svg>`;
};
var audioCtx = null;
var impactSound = (guarded) => {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const audio = audioCtx, t = audio.currentTime, out = audio.createGain();
    out.gain.value = 0.22;
    out.connect(audio.destination);
    const tone = (freq, dur, vol, type = "sine", drop = 1) => {
      const oscillator = audio.createOscillator(), gainNode = audio.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(freq, t);
      if (drop !== 1) oscillator.frequency.exponentialRampToValueAtTime(freq * drop, t + dur);
      gainNode.gain.setValueAtTime(vol, t);
      gainNode.gain.exponentialRampToValueAtTime(1e-4, t + dur);
      oscillator.connect(gainNode);
      gainNode.connect(out);
      oscillator.start(t);
      oscillator.stop(t + dur + 0.02);
    };
    const noise2 = (dur, vol, highpassHz) => {
      const noiseBuffer = audio.createBuffer(1, Math.ceil(audio.sampleRate * dur), audio.sampleRate), samples = noiseBuffer.getChannelData(0);
      for (let i = 0; i < samples.length; i++) samples[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / samples.length, 3);
      const src = audio.createBufferSource(), filter = audio.createBiquadFilter(), gainNode = audio.createGain();
      src.buffer = noiseBuffer;
      filter.type = "highpass";
      filter.frequency.value = highpassHz;
      gainNode.gain.value = vol;
      src.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(out);
      src.start(t);
    };
    if (guarded) {
      noise2(0.05, 0.7, 2500);
      for (const [freq, dur, vol] of [[640, 1.1, 0.5], [1370, 0.9, 0.35], [2230, 0.7, 0.25], [3150, 0.5, 0.15]]) tone(freq, dur, vol, "sine", 0.995);
    } else {
      noise2(0.07, 0.8, 900);
      tone(190, 0.28, 0.9, "triangle", 0.45);
      tone(470, 0.35, 0.35, "sine", 0.9);
      tone(1130, 0.22, 0.18, "sine", 0.95);
    }
  } catch {
  }
};
var pot = {
  id: "deepseek-chan.pot",
  create(ctx) {
    const potHit = (x, y) => {
      ctx.markTouched();
      ctx.resetTapCounters();
      const guarded = ctx.tagged(HEAD_COVERED);
      ctx.lockInput(guarded ? 1200 : 3200);
      const curK = ctx.scale(), w = Math.max(64, 150 * curK), h = w * 100 / 140;
      const pot2 = ctx.life.own(document.createElement("div"), (node) => node.remove());
      pot2.style.cssText = `position:fixed;left:${x - w / 2}px;top:${y - h * 0.9}px;width:${w}px;height:${h}px;z-index:40;pointer-events:none;will-change:transform,opacity`;
      pot2.innerHTML = POT_SVG;
      document.body.append(pot2);
      const fall = y + h + 20, animMs = 1250;
      const anim = pot2.animate([
        { transform: `translateY(${-fall}px) rotate(-14deg)`, offset: 0, easing: "cubic-bezier(.5,0,1,.6)" },
        { transform: "translateY(0) rotate(0deg) scale(1.12,.86)", offset: 0.4, easing: "ease-out" },
        // 쾅
        guarded ? { transform: `translate(${w * 0.45}px,${-h * 1.6}px) rotate(60deg)`, offset: 0.66, easing: "ease-in" } : { transform: `translate(${w * 0.25}px,${-h * 0.6}px) rotate(32deg)`, offset: 0.62, easing: "ease-in" },
        { transform: `translate(${w * 0.7}px,${h * 0.9}px) rotate(85deg)`, opacity: 0, offset: 1 }
      ], { duration: animMs, fill: "forwards" });
      anim.onfinish = () => pot2.remove();
      ctx.timeline([{ at: animMs * 0.4, do: () => {
        const hitK = ctx.scale(), burstSize = Math.max(60, 130 * hitK), burst = ctx.life.own(document.createElement("div"), (node) => node.remove());
        burst.style.cssText = `position:fixed;left:${x - burstSize / 2}px;top:${y - h * 0.9 - burstSize / 2}px;width:${burstSize}px;height:${burstSize}px;z-index:41;pointer-events:none`;
        burst.innerHTML = impactSvg(guarded);
        document.body.append(burst);
        burst.animate([{ transform: "scale(.2) rotate(-20deg)", opacity: 0 }, { transform: "scale(1.15) rotate(5deg)", opacity: 1, offset: 0.25 }, { transform: "scale(1.3) rotate(10deg)", opacity: 0 }], { duration: 620, fill: "forwards" }).onfinish = () => burst.remove();
        impactSound(guarded);
        if (guarded) {
          ctx.play("flinch", 600);
          ctx.speak("pot_guard", 3e3);
          return;
        }
        ctx.play("bonk", 1100);
        ctx.shiver();
        ctx.speak("pot_hit", 3e3);
        ctx.flashExp("dizzy", 2800);
      } }]);
    };
    return { on: { [EVENTS.headStrokeFast]: ({ x, y }) => potHit(x, y) } };
  }
};

// character/behaviors/index.ts
var BUILTIN_BEHAVIORS = [pot, basin, sulk, chest, lower, outfitLines];

// character/pet-walk.ts
var walkAreaValid = (area) => !!area && [area.l, area.t, area.r, area.b].every((value) => Number.isFinite(value)) && area.r > area.l && area.b > area.t;
var sameWalkArea = (first, second) => !!first && !!second && first.l === second.l && first.t === second.t && first.r === second.r && first.b === second.b;
var walkDisplayArea = (display) => {
  const workArea = display && display.workArea;
  if (!workArea || ![workArea.x, workArea.y, workArea.width, workArea.height].every((value) => Number.isFinite(value))) return null;
  const area = { l: workArea.x, t: workArea.y, r: workArea.x + workArea.width, b: workArea.y + workArea.height };
  return walkAreaValid(area) ? area : null;
};
var walkBodySpan = ({ x, k, canvasW, bodyW }) => {
  const width = Math.max(1, Math.min(bodyW, canvasW * k)), side = (canvasW * k - width) / 2;
  return { l: x + side, r: x + side + width, width, side };
};
var planWalkOut = ({ area, x, k, canvasW, bodyW, speed = 320 }) => {
  const span = walkBodySpan({ x, k, canvasW, bodyW });
  const left = Math.max(0, span.l - area.l), right = Math.max(0, area.r - span.r);
  const near = left <= right ? -1 : 1;
  const minRun = Math.max(speed * 1.5, span.width * 1.2, 240);
  const dir = left >= minRun || right <= left ? -1 : 1;
  const run = dir < 0 ? left : right;
  const fadeWanted = Math.max(56, Math.min(180, span.width * 0.8));
  const fade = Math.max(1, Math.min(fadeWanted, run * 0.75));
  const overshoot = Math.max(6, Math.min(24, span.width * 0.08));
  return { dir, near, left, right, minRun, run, fade, overshoot, travel: run + overshoot, body: span.width, bodyL: span.l, bodyR: span.r };
};
var walkSafePose = ({ area, x, y, k, canvasW, canvasH, bodyW }) => {
  const span = walkBodySpan({ x, k, canvasW, bodyW });
  const minX = area.l - span.side, maxX = area.r - span.side - span.width;
  const minY = area.t - canvasH * k * 0.05, maxY = area.b - canvasH * k;
  return { k, x: Math.min(Math.max(x, minX), Math.max(minX, maxX)), y: Math.min(Math.max(y, minY), Math.max(minY, maxY)) };
};
var planWalkReturn = ({ area, dir, x, k, canvasW, bodyW }) => {
  const span = walkBodySpan({ x, k, canvasW, bodyW });
  const entry = Math.max(8, Math.min(64, span.width * 0.3));
  const startX = dir > 0 ? area.l - entry - span.side : area.r + entry - canvasW * k + span.side;
  const from = startX - x;
  const fadeWanted = Math.max(56, Math.min(180, span.width * 0.8));
  return { from, startX, entry, fade: Math.max(1, Math.min(fadeWanted, Math.abs(from) * 0.6)) };
};
var walkOutAlpha = (traveled, run, fade) => {
  const progress = Math.max(0, Math.min(1, (run - traveled) / Math.max(1, fade)));
  return progress * progress * (3 - 2 * progress);
};
var walkInAlpha = (traveled, fade) => {
  const progress = Math.max(0, Math.min(1, traveled / Math.max(1, fade)));
  return progress * progress * (3 - 2 * progress);
};
var walkClipInset = ({ area, screenX: screenX2, screenY: screenY2, width, height, pad = 12 }, out = { left: 0, top: 0, right: 0, bottom: 0, any: false }) => {
  out.left = area.l > screenX2 - pad ? Math.max(0, Math.ceil(area.l - screenX2) + pad) : 0;
  out.top = area.t > screenY2 - pad ? Math.max(0, Math.ceil(area.t - screenY2) + pad) : 0;
  out.right = area.r < screenX2 + width + pad ? Math.max(0, Math.ceil(screenX2 + width - area.r) + pad) : 0;
  out.bottom = area.b < screenY2 + height + pad ? Math.max(0, Math.ceil(screenY2 + height - area.b) + pad) : 0;
  out.any = out.left > 0 || out.top > 0 || out.right > 0 || out.bottom > 0;
  return out;
};
var walkEasePetOut = (progress) => {
  const ramp = 0.1;
  return progress < ramp ? progress * progress / (ramp * (2 - ramp)) : (2 * progress - ramp) / (2 - ramp);
};

// character/index.ts
function createCharacter({ base, life, pet = null, prefs: initialPrefs = {}, onSetting = null }) {
  const BASE = base;
  const mergeStrings = (dst, src) => {
    if (!src || typeof src !== "object") return;
    for (const [k, v] of Object.entries(src)) if (typeof v === "string" && v) dst[k] = v;
  };
  const mergeLines = (data) => {
    if (!data || typeof data !== "object") return;
    const d = data;
    mergeStrings(TEXT, d.text);
    if (!d.lines || typeof d.lines !== "object") return;
    for (const [k, arr] of Object.entries(d.lines)) {
      if (!Array.isArray(arr)) continue;
      const list = arr.filter((v) => typeof v === "string" && !!v);
      if (list.length) LINES[k] = list;
    }
  };
  const linesLoad = (async () => {
    try {
      const res = await fetch(BASE + "dsc-lines.json");
      if (res.ok) mergeLines(await res.json());
    } catch {
    }
  })();
  const prefs = { ...initialPrefs };
  const hooks = {};
  let petUsed = false;
  const previousDsc = window.__dsc;
  life.add(() => {
    if (window.__dsc !== previousDsc) {
      if (previousDsc === void 0) delete window.__dsc;
      else window.__dsc = previousDsc;
    }
    document.documentElement.classList.remove("dsc-hover", "dsc-grabbing");
    if (petUsed) {
      try {
        fetch(new URL("../pet/hide", new URL(BASE, location.href)).href, { method: "POST", keepalive: true }).catch(() => {
        });
      } catch {
      }
    }
  });
  const setTimeout2 = life.timeout, setInterval2 = life.interval, requestAnimationFrame2 = life.frame;
  const addEventListener = (type, fn, options) => life.listen(window, type, fn, options);
  const MutationObserver = function(fn) {
    return life.observe(fn);
  };
  const TEXT = {};
  const LINES = {};
  let baseLines = null;
  let baseText = null;
  let extraLoaded = false, extraLoading = false;
  const snapshotBase = () => {
    if (baseLines) return;
    baseLines = { ...LINES };
    baseText = { ...TEXT };
  };
  const loadExtra = async () => {
    if (life.stopped || extraLoaded || extraLoading) return;
    extraLoading = true;
    try {
      await linesLoad;
      snapshotBase();
      const res = await fetch(BASE + "dsc-lines-ex.json");
      const data = res.ok ? await res.json() : null;
      if (life.stopped || !prefs.extra?.enabled) return;
      mergeLines(data);
      extraLoaded = true;
    } catch {
    } finally {
      extraLoading = false;
    }
  };
  const restoreBase = () => {
    if (!baseLines || !baseText) return;
    for (const k of Object.keys(LINES)) delete LINES[k];
    Object.assign(LINES, baseLines);
    for (const k of Object.keys(TEXT)) delete TEXT[k];
    Object.assign(TEXT, baseText);
    extraLoaded = false;
  };
  const ready = (fn) => document.body ? fn() : addEventListener("DOMContentLoaded", fn, { once: true });
  ready(() => {
    let running = false, lastError = -1e9, lastToolSay = 0, waitingKind = null;
    const listeners = { tool: null };
    const scanAdded = (node) => {
      const found = scanAddedNode(node, { running: running && !!listeners.tool });
      if (found.error) lastError = performance.now();
      if (found.tool) listeners.tool(found.tool);
    };
    if (!pet) new MutationObserver((records) => {
      for (const record of records) for (const n of record.addedNodes) scanAdded(n);
    }).observe(document.body, { childList: true, subtree: true });
    const load = (src) => new Promise((ok, fail) => {
      const script = life.own(document.createElement("script"), (node) => node.remove());
      script.src = BASE + src;
      script.onload = ok;
      script.onerror = () => fail(new Error(src));
      document.head.appendChild(script);
    });
    (async () => {
      const AVATAR = prefs.avatar?.enabled === true;
      if (AVATAR) {
        if (!window.DscRigThree) await load("vendor/rig-three.js").catch((error) => log.warnOnce("rig-three", "3D 렌더러를 불러오지 못했습니다:", error));
      } else if (!window.Live2DCubismCore || !window.PIXI || !window.PIXI.live2d) await loadLive2DScripts(load);
      if (life.stopped) return;
      const W = 300, H = 300;
      const canvas = life.own(document.createElement("canvas"), (node) => node.remove());
      canvas.id = "dsc-stage";
      const bubble = life.own(document.createElement("div"), (node) => node.remove());
      bubble.id = "dsc-bubble";
      document.body.append(canvas, bubble);
      const dragLift = { x: 0, v: 0 };
      const dragShift = { x: 0, v: 0 };
      let chestFrom = null, chestPulling = false;
      const rig = AVATAR ? await (window.DscRigThree?.createThreeRig({ base: new URL(pet ? "__avatar/" : "../avatar/", new URL(BASE, location.href)).href, life, canvas, W, H, pet: !!pet, outlineNormals: prefs.avatar?.outline, tuning: () => prefs.avatar }).catch((error) => {
        log.warnOnce("rig-three-load", "3D 모델을 불러오지 못했습니다 (avatarModelDir·avatar.json 확인):", error);
        return null;
      }) ?? null) : await createLive2DRig({ base: BASE, life, pet, prefs, canvas, W, H, chestDrag: { lift: dragLift, shift: dragShift } });
      if (!rig) return;
      const setParam = rig.set, addParam = rig.add, systemTicker = rig.systemTicker;
      const GAZE = rig.gaze;
      const {
        visW,
        noseX: noseCanvasX,
        chibiHeadDrop,
        walkBodyWidth: WALK_BODY_WIDTH,
        waistPet: WAIST_PET,
        waistWin: WAIST_WIN,
        waistPct: WAIST_PCT,
        petHeadRatio: PET_HEAD_RATIO,
        headGain: HEAD_GAIN,
        petKMin: PET_K_MIN,
        petKMax: PET_K_MAX,
        petBubble: PET_BUBBLE,
        petBustOffset
      } = rig.metrics;
      await linesLoad;
      if (life.stopped) return;
      snapshotBase();
      if (prefs.extra?.enabled) await loadExtra();
      if (life.stopped) return;
      const weight = {}, hold = {}, until = {};
      const OUTFIT_PARAMS = OUTFIT_ITEMS.filter((item) => item.param).map((item) => [item.key, item.param, item.on]);
      const OUTFIT_LINE = Object.fromEntries(OUTFIT_ITEMS.filter((item) => item.line).map((item) => [item.key, item.line]));
      const OUTFIT_LINE_OFF = { skirt: "outfit_skirt_short", chestClothes: "outfit_chest_open" };
      const BODY_VALUE = Object.fromEntries(BODY_TYPES.map((body) => [body.key, body.value]));
      const outfitWeight = {};
      for (const [key] of OUTFIT_PARAMS) outfitWeight[key] = (prefs.outfit || {})[key] ? 1 : 0;
      let bodyWeight = BODY_VALUE[(prefs.outfit || {}).bodyType] || 0, outfitPrev = null, outfitTalk = null;
      const PET = pet;
      const PET_URL = PET ? null : (() => {
        try {
          return new URL("../pet/", new URL(BASE, location.href)).href;
        } catch {
          return null;
        }
      })();
      const link = createPetLink({
        url: PET_URL,
        /** 전역 fetch 호출 (window에 묶인 채로 부르도록 감쌈) */
        fetch: (...args) => fetch(...args),
        setTimeout: setTimeout2,
        setInterval: setInterval2,
        requestAnimationFrame: requestAnimationFrame2,
        /** 펫 창 사용 기록 (플러그인이 내려갈 때 펫 창을 숨길지 판단) */
        onUse: () => {
          petUsed = true;
        },
        /** 펫 창 메뉴에서 바꾼 설정을 플러그인 설정에 저장하도록 전달 */
        onConfig: (key, value) => onSetting?.(key, value),
        /** 펫 창이 열려 창 안 캐릭터가 물러날 때 */
        onEnter: () => petLinkEnter(),
        /** 펫 창이 닫혀 창 안 캐릭터가 돌아올 때 */
        onLeave: () => petLinkLeave(),
        /** 펫 창에 넘길 지금 상태 */
        snapshot: () => petLinkSnapshot(),
        /** 끌어서 넘기는 동안 펫 창에 보낼 메시지 */
        dragMessages: () => petLinkDragMessages(),
        /** 펫 창이 붙을 자리 */
        dockState: () => petLinkDock(),
        /** 지금 끌기 상태의 비교용 키 */
        dragKey: () => dragKeyRaw(),
        /** 외부 음성 상태 */
        voice: () => voiceState,
        /** 펫 창도 같은 렌더러로: 3D 모델 사용 여부·외곽선 (창 안 캐릭터가 처음 뜰 때 정한 값) */
        avatar: () => ({ enabled: AVATAR, outline: prefs.avatar?.outline }),
        /** 시작 연출이 끝났고 작업 중이 아니며 화면이 보이는 상태 여부 */
        idle: () => intro.phase === "done" && !running && !document.hidden,
        /** 캔버스만 숨김 상태 여부 */
        hidden: () => hidden,
        /** 펫 창을 열 때 쓸 화면 좌표 자리 */
        openPose: () => petOpenScreenPose()
      });
      const relay = link.relay;
      const EYE_EXP = EYE_SWAP_EXPRESSIONS;
      const clearOtherEyes = (name2) => {
        if (EYE_EXP.includes(name2)) {
          for (const e of EYE_EXP) if (e !== name2) {
            until[e] = 0;
            hold[e] = false;
          }
        }
      };
      const setExp = (name2, on) => {
        relay("setExp", [name2, on]);
        if (on) clearOtherEyes(name2);
        hold[name2] = on;
      };
      const flashExp = (name2, ms) => {
        relay("flashExp", [name2, ms]);
        clearOtherEyes(name2);
        until[name2] = performance.now() + ms;
      };
      const gestureState = { name: null, start: 0, dur: 0, dir: 1 };
      const play = (name2, dur) => {
        relay("play", [name2, dur]);
        rig.gesture?.(name2, dur);
        gestureState.name = name2;
        gestureState.start = performance.now();
        gestureState.dur = dur;
        gestureState.dir = Math.random() < 0.5 ? -1 : 1;
        if (BOB_KICK[name2]) bobKick(BOB_KICK[name2]);
      };
      const BOB_KICK = { bounce: 60, laugh: 50, nod: -45 };
      let mood = "idle", moodUntil = 0, nextIdleGesture = performance.now() + 6e3;
      const setMood = (moodName, ms = 0) => {
        relay("setMood", [moodName, ms]);
        mood = moodName;
        moodUntil = ms ? performance.now() + ms : 0;
      };
      const pose = { lean: 0, headZ: 0, headY: 0, bodyY: 0, swayAmp: 0 };
      let shiverStarted = -1e9;
      let shiverBobAt = 0, shiverBobSign = 1;
      let happyMouth = 0;
      let stareWeight = 0;
      const visH = H * 0.95;
      let coarseMql = null;
      const coarsePointer = () => {
        if (typeof matchMedia !== "function") return false;
        if (!coarseMql) coarseMql = matchMedia("(hover: none) and (pointer: coarse)");
        return coarseMql.matches;
      };
      const mobileHidden = () => !!prefs.mobile && prefs.mobile.enabled === false && coarsePointer();
      const keyboardOpen = () => {
        const visualVp = typeof visualViewport !== "undefined" && visualViewport ? visualViewport : null;
        if (!visualVp || visualVp.scale !== 1) return false;
        return innerHeight - visualVp.height > 120 || visualVp.offsetTop > 4;
      };
      const typingActive = () => coarsePointer() && keyboardOpen();
      const viewport = () => {
        const visualVp = typeof visualViewport !== "undefined" && visualViewport ? visualViewport : null;
        return visualVp ? { w: visualVp.width, h: visualVp.height, top: visualVp.offsetTop, left: visualVp.offsetLeft } : { w: innerWidth, h: innerHeight, top: 0, left: 0 };
      };
      const layoutViewport = () => coarsePointer() ? viewport() : { w: innerWidth, h: innerHeight, top: 0, left: 0 };
      let curK = 1, fleeX = 0;
      const free = { on: false, x: 0, y: 0, k: 1, anim: null, mode: null, applied: true };
      const drag = { pending: null, on: false, x: 0, y: 0, samples: [] };
      let chord = { at: null, button: null, valid: false };
      let rightPress = null;
      let mouseButtons = 0;
      const carry = { vx: 0, vy: 0 };
      const shown = { k: 1, x: 0, y: 0 };
      const petDisplay = { id: "", area: null, scaleFactor: 0, request: 0, answered: 0, at: 0, displays: null };
      let petBounds = null;
      const requestPetDisplay = (at) => {
        if (!PET) return;
        const id = ++petDisplay.request;
        const point = displayPoint(at);
        try {
          PET.send({ type: "display", request: id, point });
        } catch (error) {
          log.debug("펫 표시장치 요청 실패:", error);
        }
        return id;
      };
      const displayPoint = (at) => {
        if (at && Number.isFinite(at.x) && Number.isFinite(at.y)) return at;
        if (!Number.isFinite(shown.x) || !Number.isFinite(shown.y)) return void 0;
        const k = Number.isFinite(curK) && curK > 0 ? curK : 1;
        return { x: shown.x + W * k / 2, y: shown.y + H * k * 0.5 };
      };
      let touchHold = 0;
      let petDock = null, petDocked = false, snapProgress = 0;
      const PET_SIZE_KEY = "dsc-pet-size";
      let petPanel = null, petPanelOpen = false, petPanelWin = { w: 0, h: 0 };
      let petBaseK = 1, petPendingRatio = null, petSizeTimer = 0, petMenuSig = "";
      const FREE_KEY = "dsc-free-pos";
      const FREE_KEY_MOBILE = "dsc-free-pos-mobile";
      const freeMode = () => coarsePointer() ? "mobile" : "desktop";
      const freeStorageKey = (mode) => mode === "mobile" ? FREE_KEY_MOBILE : FREE_KEY;
      const freeToRatio = () => {
        free.fx = (free.x + W * free.k / 2) / innerWidth;
        free.fy = (free.y + H * free.k) / innerHeight;
      };
      if (!PET) try {
        const mode = freeMode();
        const saved = JSON.parse(localStorage.getItem(freeStorageKey(mode)) || "null");
        if (saved && isFinite(saved.fx) && isFinite(saved.fy) && saved.k > 0 && (!saved.mode || saved.mode === mode)) {
          Object.assign(free, { on: true, fx: saved.fx, fy: saved.fy, k: saved.k, mode, applied: true });
        }
      } catch {
      }
      const saveFree = (fromPose = true) => {
        if (PET || free.applied === false) return;
        if (free.on && fromPose) freeToRatio();
        try {
          const mode = free.mode || freeMode();
          const key = freeStorageKey(mode);
          if (free.on) localStorage.setItem(key, JSON.stringify({ mode, fx: +free.fx.toFixed(4), fy: +free.fy.toFixed(4), k: +free.k.toFixed(3) }));
          else localStorage.removeItem(key);
        } catch {
        }
      };
      const walk = {
        phase: "",
        face: 0,
        dir: -1,
        out: 0,
        timers: [],
        slideId: 0,
        lastTouch: 0,
        next: performance.now() + (180 + Math.random() * 180) * 1e3,
        plan: null,
        area: null,
        base: null,
        displayId: "",
        displayRequest: 0,
        alpha: 1,
        opacityApplied: false,
        returnFade: 0,
        recoverTimer: 0,
        safeHold: false,
        faceDir: null,
        recover: null
      };
      let walkCheck = null;
      const intro = { phase: "center", start: performance.now(), moveStart: 0, from: null, kc: 1 };
      const veil = life.own(document.createElement("div"), (node) => node.remove());
      veil.style.cssText = "position:fixed;inset:0;z-index:29;background:radial-gradient(circle at 50% 55%,var(--dsc-veil1,#ffffffd9),var(--dsc-veil2,#eef0ffcc) 70%);backdrop-filter:blur(8px);opacity:0;transition:none;cursor:pointer";
      document.body.append(veil);
      veil.addEventListener("pointerdown", () => {
        if (intro.phase === "center") intro.skip = true;
      });
      const setRes = (k) => rig.setResolution(k);
      const ease = (progress) => progress < 0 ? 0 : progress > 1 ? 1 : progress * progress * (3 - 2 * progress);
      const findCard = () => document.querySelector(".dsc-composer") || [...document.querySelectorAll('[class*="_card"]')].find((e) => e.closest('[class*="_root"]') && e.querySelector('[class*="_input"]'));
      const cardRect = (card) => {
        const rect = card.getBoundingClientRect();
        if (rect.width) return rect;
        const seat = card.closest('[class*="composerSeat"]');
        for (const alt of seat ? seat.querySelectorAll('[class*="_card"]') : []) {
          if (alt === card) continue;
          const altRect = alt.getBoundingClientRect();
          if (altRect.width) return altRect;
        }
        return null;
      };
      const homePose = () => {
        const card = findCard();
        const viewArea = layoutViewport();
        const maxK = Math.min(PET_K_MAX / PET_HEAD_RATIO, viewArea.h * 0.92 / visH);
        const cardBox = card ? cardRect(card) : null;
        const pose2 = homeLayout({ vp: viewArea, r: cardBox, maxK, W, visW, H, visH, minK: SHOW_K, allowAbove: coarsePointer() });
        return { k: pose2.k, x: pose2.x + fleeX, y: pose2.y, card, r: cardBox, above: pose2.above, noSafe: !!pose2.noSafe, vp: viewArea };
      };
      const centerPose = () => {
        const viewArea = layoutViewport();
        const k = Math.min(viewArea.h * 0.74 / visH, viewArea.w * 0.55 / visW, 3.2);
        return { k, x: viewArea.left + viewArea.w / 2 - W * k / 2, y: viewArea.top + viewArea.h - H * k };
      };
      const introOff = !!prefs.intro && prefs.intro.enabled === false;
      if (!introOff) {
        intro.kc = centerPose().k;
        setRes(intro.kc);
      }
      const skipIntro = () => {
        if (intro.phase === "done") return;
        intro.phase = "done";
        setRes(1);
        veil.remove();
        canvas.style.opacity = "";
        bubble.style.left = "";
        bubble.style.fontSize = "";
        bubble.style.padding = "";
      };
      if (PET || introOff) skipIntro();
      const bodyRect = (x, y, k) => {
        const side = (W - visW) / 2 * k;
        return { l: x + side, t: y + H * 0.05 * k, r: x + W * k - side, b: y + H * k };
      };
      const easeOut = (progress) => 1 - Math.pow(1 - progress, 3);
      const easeBack = (progress) => {
        const overshoot = 1.25, fromEnd = progress - 1;
        return 1 + (overshoot + 1) * fromEnd * fromEnd * fromEnd + overshoot * fromEnd * fromEnd;
      };
      const area = () => PET ? { l: screen.availLeft, t: screen.availTop, r: screen.availLeft + screen.availWidth, b: screen.availTop + screen.availHeight } : { l: 0, t: 0, r: innerWidth, b: innerHeight };
      const keepIn = (candidate, limit) => {
        const bounds = limit || area(), side = (W - visW) / 2 * candidate.k;
        return { k: candidate.k, x: Math.min(Math.max(candidate.x, bounds.l - side), bounds.r - W * candidate.k + side), y: Math.min(Math.max(candidate.y, bounds.t - H * candidate.k * 0.05), bounds.b - H * candidate.k * 0.3) };
      };
      const screenOf = (x, y) => {
        const border = (outerWidth - innerWidth) / 2;
        return { x: screenX + border + x, y: screenY + Math.max(0, outerHeight - innerHeight - border) + y };
      };
      const dockTarget = (home) => home.k >= SHOW_K || home.above || home.noSafe ? home : { k: SHOW_K, x: innerWidth - 4 - (W + visW) / 2 * SHOW_K + fleeX, y: innerHeight - H * SHOW_K };
      const bodyOut = (candidate, entering = true) => {
        const side = (W - visW) / 2 * candidate.k, edge = visW * candidate.k * (entering ? 0.15 : -0.02), low = entering ? 0.5 : 0.8;
        return candidate.x + side < -edge || candidate.x + W * candidate.k - side > innerWidth + edge || candidate.y < -edge || candidate.y + H * candidate.k * low > innerHeight;
      };
      const inWindow = (candidate, w) => {
        const side = (W - visW) / 2 * candidate.k, edge = visW * candidate.k * 0.02;
        return candidate.x + side >= w.l + edge && candidate.x + W * candidate.k - side <= w.r - edge && candidate.y >= w.t + edge && candidate.y + H * candidate.k * 0.8 <= w.b;
      };
      const finishFreeAnim = (anim, to) => {
        free.anim = null;
        if (anim.snap && !PET) {
          free.on = false;
          saveFree();
        } else {
          Object.assign(free, { on: true, x: to.x, y: to.y, k: to.k });
          saveFree();
        }
        if (anim.snap && PET) {
          petDocked = true;
          PET.send({ type: "attach" });
        }
        if (PET) {
          petSyncMenu();
          renderPetPanel();
        }
      };
      const freeAnimPose = (anim, home, now) => {
        const progress = Math.min(1, (now - anim.t0) / anim.ms), to = anim.snap ? (PET ? petDock : dockTarget(home)) || anim.from : anim.to;
        const e = anim.snap ? easeBack(progress) : easeOut(progress), scaleEase = easeOut(progress);
        const target = to;
        const pose2 = { k: anim.from.k + (target.k - anim.from.k) * scaleEase, x: anim.from.x + (target.x - anim.from.x) * e, y: anim.from.y + (target.y - anim.from.y) * e };
        if (anim.snap) snapProgress = scaleEase;
        if (progress >= 1) finishFreeAnim(anim, target);
        return pose2;
      };
      const freeWindowPose = (home) => {
        if (!isFinite(free.fx) || !isFinite(free.fy)) freeToRatio();
        const floor = coarsePointer() ? MIN_SHOW_K : SHOW_K;
        const baseK = coarsePointer() && home.r ? home.k : free.k;
        const k = Math.max(floor, Math.min(baseK, Math.min(1.25, innerHeight * 0.45 / visH)));
        return { k, x: free.fx * innerWidth - W * k / 2, y: free.fy * innerHeight - H * k };
      };
      const walkDockPose = { k: 1, x: 0, y: 0 };
      const petWalkClipOn = () => walking() || walk.phase === "recover" || walk.safeHold && walkAreaValid(walk.area);
      const petWalkPose = () => {
        if (!PET) return null;
        let pose2;
        if (walk.base && walking()) pose2 = walk.base;
        else if (walk.phase === "recover") pose2 = free;
        else if (walk.safeHold && !free.anim) {
          const limit = walkAreaValid(walk.area) ? walk.area : petDisplay.area;
          if (!walkAreaValid(limit)) return null;
          pose2 = keepIn(free, limit);
        } else return null;
        walkDockPose.k = pose2.k;
        walkDockPose.x = pose2.x + fleeX;
        walkDockPose.y = pose2.y;
        return walkDockPose;
      };
      const dockPose = (home, now) => {
        snapProgress = 0;
        if (drag.on) return { k: free.k, x: drag.x, y: drag.y };
        const walkPose = petWalkPose();
        if (walkPose) return walkPose;
        if (free.anim) return freeAnimPose(free.anim, home, now);
        const currentMode = freeMode();
        if (!PET && free.on && free.mode && free.mode !== currentMode) {
          free.applied = false;
          return dockTarget(home);
        }
        free.applied = true;
        if (!free.on) return dockTarget(home);
        const kept = keepIn(PET ? free : freeWindowPose(home));
        return { k: kept.k, x: kept.x + fleeX, y: kept.y };
      };
      const GLIDE = 0.066;
      const release = (vx, vy, touch = false) => {
        const k = free.k, from = { k, x: drag.x, y: drag.y }, glided = { k, x: from.x + vx * GLIDE, y: from.y + vy * GLIDE };
        const home = PET ? petDock : dockTarget(homePose());
        const mid = (at, scale) => [at.x + W * scale / 2, at.y + H * scale * 0.5];
        const [px, py] = mid(glided, k);
        const outside = !PET && bodyOut(glided);
        const backIn = !PET || !home?.win || inWindow(glided, home.win);
        const snapRange = touch ? Math.max(80, visW * k * 0.35) : Math.max(140, visW * k * 0.7);
        const snap = !outside && backIn && !!home && Math.hypot(px - mid(home, home.k)[0], py - mid(home, home.k)[1]) < snapRange;
        if (Math.hypot(vx, vy) > 2600) flashExp("dizzy", 1500);
        if (outside && link.supported) {
          const fromScreen = screenOf(from.x, from.y), toScreen = screenOf(glided.x, glided.y);
          link.opening = performance.now();
          link.post("open", { from: { k, x: fromScreen.x, y: fromScreen.y }, to: { k, x: toScreen.x, y: toScreen.y }, seq: ++link.seq });
        }
        free.on = true;
        if (snap) {
          free.anim = { t0: performance.now(), ms: 650, from, to: null, snap: true };
          return;
        }
        const to = keepIn(glided);
        let target = to;
        if (PET && petPendingRatio != null) {
          target = keepIn(petSizedPose(glided, k, petPendingRatio));
          petPendingRatio = null;
        }
        if (target.x !== from.x || target.y !== from.y || target.k !== from.k) free.anim = { t0: performance.now(), ms: 300, from, to: target, snap: false };
        else {
          free.anim = null;
          Object.assign(free, { x: from.x, y: from.y, k });
          saveFree();
        }
      };
      let lastPlaceKey = "";
      let hidden = false;
      let pageHiddenApplied = false;
      const pageHiddenNow = () => !PET && prefs.pageHidden === true;
      let petPower = !PET;
      let lastClip = "";
      let lastMask = "", lastMaskComposite = "";
      const petWin = { x: NaN, y: NaN };
      let petWinSize = { w: 0, h: 0 };
      let petTracking = false, petGrab = null;
      let petBox = "";
      const movePet = (pose2) => {
        const cx = (innerWidth - W * pose2.k) / 2, cy = innerHeight - H * pose2.k;
        const winX = Math.round(pose2.x - cx), winY = Math.round(pose2.y - cy);
        if (petTracking) petWin.x = petWin.y = NaN;
        else if (winX !== petWin.x || winY !== petWin.y || walk.phase === "recover") {
          petWin.x = winX;
          petWin.y = winY;
          PET.move(winX, winY, walking() || walk.phase === "recover");
        }
        return { x: cx, y: cy };
      };
      let renderOn = true;
      const setRender = (on) => {
        if (renderOn === on) return;
        renderOn = on;
        if (!on) return;
        rig.resetClock();
        wakeRaf();
      };
      const hideCharacter = () => {
        canvas.style.display = bubble.style.display = "none";
      };
      const placeBlocked = () => {
        if (hidden) {
          hideCharacter();
          return true;
        }
        if (pageHiddenNow()) {
          hideForPage();
          return true;
        }
        if (pageHiddenApplied) {
          pageHiddenApplied = false;
          veil.style.opacity = "";
          veil.style.pointerEvents = "";
          lastPlaceKey = "";
          wakeRaf();
        }
        if (mobileHidden() || typingActive()) {
          skipIntro();
          setRender(false);
          hideCharacter();
          veil.style.opacity = "0";
          veil.style.pointerEvents = "none";
          lastPlaceKey = "";
          return true;
        }
        if (link.open || link.follow?.shown) {
          setRender(false);
          hideCharacter();
          lastPlaceKey = "";
          return true;
        }
        return false;
      };
      const introPose = (home, dock, now) => {
        let { k, x, y } = dock;
        let introOn = intro.phase !== "done", veilOpacity = 0, introProgress = 0;
        if (introOn && !intro.begun) {
          if (home.card && !intro.cardAt) intro.cardAt = now;
          if (!(intro.cardAt && now - intro.cardAt > 300) && now - intro.start < 8e3) {
            veil.style.opacity = "1";
            veil.style.pointerEvents = "none";
            return null;
          }
          intro.begun = true;
          intro.start = now;
        }
        if (introOn) {
          const center = centerPose();
          if (intro.phase === "center") {
            veilOpacity = 1;
            k = center.k;
            x = center.x;
            y = center.y;
            if (intro.skip) {
              intro.phase = "move";
              intro.moveStart = now;
              intro.from = center;
            }
          } else {
            const progress = ease((now - intro.moveStart) / 900);
            veilOpacity = 1 - progress;
            introProgress = progress;
            k = intro.from.k + (dock.k - intro.from.k) * progress;
            x = intro.from.x + (dock.x - intro.from.x) * progress;
            y = intro.from.y + (dock.y - intro.from.y) * progress;
            if (progress >= 1) {
              intro.phase = "done";
              introOn = false;
              setRes(1);
              veil.remove();
              bubble.style.left = "";
              bubble.style.fontSize = "";
              bubble.style.padding = "";
            }
          }
          veil.style.opacity = String(veilOpacity);
          veil.style.pointerEvents = intro.phase === "center" ? "auto" : "none";
          canvas.style.opacity = intro.phase === "center" ? String(ease((now - intro.start) / 300)) : "";
        }
        return { k, x, y, introOn, introProgress };
      };
      const applyWalkOpacity = (walkNow) => {
        if (walkNow) {
          canvas.style.opacity = String(Math.max(0, Math.min(1, Number.isFinite(walk.alpha) ? walk.alpha : 1)));
          walk.opacityApplied = true;
        } else if (walk.opacityApplied) {
          canvas.style.opacity = "";
          walk.opacityApplied = false;
        }
      };
      const petBodyAway = () => walking() || walk.phase === "recover" || fleeX !== 0;
      const placePetWindow = (dock, k, walkNow) => {
        const { x, y } = movePet(dock);
        applyWalkOpacity(walkNow);
        const needW = Math.ceil(W * k) + 24, needH = Math.ceil(H * k) + PET_BUBBLE;
        const panelW = petPanelOpen && petPanel ? Math.ceil(petPanel.offsetWidth) + 24 : 0;
        const panelH = petPanelOpen && petPanel ? Math.ceil(petPanel.offsetHeight) + 24 : 0;
        const fitW = Math.max(needW, panelW), fitH = Math.max(needH, panelH);
        if (fitW !== petWinSize.w || fitH !== petWinSize.h) {
          petWinSize.w = fitW;
          petWinSize.h = fitH;
          PET.send({ type: "fit", w: fitW, h: fitH });
        }
        if (petPanelOpen && (innerWidth !== petPanelWin.w || innerHeight !== petPanelWin.h)) {
          petPanelWin = { w: innerWidth, h: innerHeight };
          fitPetPanel();
        }
        const bodyBox = bodyRect(x, y, k), body = petBodyAway() ? null : { l: Math.round(bodyBox.l), t: Math.round(bodyBox.t), r: Math.round(bodyBox.r), b: Math.round(bodyBox.b) };
        const hitBox = petPanelBox(body);
        const sig = JSON.stringify(hitBox);
        if (sig !== petBox) {
          petBox = sig;
          PET.send({ type: "hitbox", box: hitBox });
        }
        return { x, y };
      };
      const walkClipSpec = { area: { l: 0, t: 0, r: 0, b: 0 }, screenX: 0, screenY: 0, width: 0, height: 0 };
      const walkClip = { left: 0, top: 0, right: 0, bottom: 0, any: false };
      const petWalkClip = (k, x, y) => {
        const area2 = walk.area;
        if (!walkAreaValid(area2)) return "";
        const border = (outerWidth - innerWidth) / 2;
        const domX = screenX + border + x, domY = screenY + Math.max(0, outerHeight - innerHeight - border) + y;
        const fresh = !!petBounds && performance.now() - petBounds.at < 2e3;
        const nativeX = fresh ? petBounds.x + x : domX, nativeY = fresh ? petBounds.y + y : domY;
        const left = Math.min(domX, nativeX), top = Math.min(domY, nativeY);
        const right = Math.max(domX + W * k, nativeX + W * k), bottom = Math.max(domY + H * k, nativeY + H * k);
        walkClipSpec.area = area2;
        walkClipSpec.screenX = left;
        walkClipSpec.screenY = top;
        walkClipSpec.width = right - left;
        walkClipSpec.height = bottom - top;
        const inset = walkClipInset(walkClipSpec, walkClip);
        return inset.any ? `inset(${inset.top}px ${inset.right}px ${inset.bottom}px ${inset.left}px)` : "";
      };
      const updateCardClip = (home, introOn, k, x, y, walkNow) => {
        const seat = !introOn && home.card && home.card.closest('[class*="composerSeat"]');
        const popup = seat && seat.querySelector('[class*="_card"]:not(.dsc-composer)');
        let clip = "";
        if (popup) {
          const popupRect = popup.getBoundingClientRect(), popupStyle = getComputedStyle(popup), canvasWidth = W * k, canvasHeight = H * k;
          const left = popupRect.left - x, top = popupRect.top - y, right = popupRect.right - x, bottom = popupRect.bottom - y;
          if (right > 0 && bottom > 0 && left < canvasWidth && top < canvasHeight) {
            const radius = (value) => Math.min(parseFloat(value) || 0, popupRect.width / 2, popupRect.height / 2);
            const fixed = (n) => +n.toFixed(2);
            const topLeftRadius = radius(popupStyle.borderTopLeftRadius), topRightRadius = radius(popupStyle.borderTopRightRadius), bottomRightRadius = radius(popupStyle.borderBottomRightRadius), bottomLeftRadius = radius(popupStyle.borderBottomLeftRadius);
            clip = `path(evenodd, "M0 0H${fixed(canvasWidth)}V${fixed(canvasHeight)}H0Z M${fixed(left + topLeftRadius)} ${fixed(top)}H${fixed(right - topRightRadius)}A${fixed(topRightRadius)} ${fixed(topRightRadius)} 0 0 1 ${fixed(right)} ${fixed(top + topRightRadius)}V${fixed(bottom - bottomRightRadius)}A${fixed(bottomRightRadius)} ${fixed(bottomRightRadius)} 0 0 1 ${fixed(right - bottomRightRadius)} ${fixed(bottom)}H${fixed(left + bottomLeftRadius)}A${fixed(bottomLeftRadius)} ${fixed(bottomLeftRadius)} 0 0 1 ${fixed(left)} ${fixed(bottom - bottomLeftRadius)}V${fixed(top + topLeftRadius)}A${fixed(topLeftRadius)} ${fixed(topLeftRadius)} 0 0 1 ${fixed(left + topLeftRadius)} ${fixed(top)}Z")`;
          }
        } else if (walkNow) clip = petWalkClip(k, x, y);
        if (clip !== lastClip) {
          canvas.style.clipPath = clip;
          lastClip = clip;
        }
      };
      const canvasMask = ({ winBox, petFade, fade, x, y }) => {
        if (winBox && petFade > 1e-3) {
          const origin = screenOf(0, 0), outsideAlpha = (1 - petFade).toFixed(3);
          const left = (winBox.l - origin.x - x).toFixed(1), right = (winBox.r - origin.x - x).toFixed(1);
          const top = (winBox.t - origin.y - y).toFixed(1), bottom = (winBox.b - origin.y - y).toFixed(1);
          return {
            mask: `linear-gradient(to right, rgba(0,0,0,${outsideAlpha}) 0 ${left}px, #000 ${left}px ${right}px, rgba(0,0,0,${outsideAlpha}) ${right}px 100%), linear-gradient(to bottom, rgba(0,0,0,${outsideAlpha}) 0 ${top}px, #000 ${top}px ${bottom}px, rgba(0,0,0,${outsideAlpha}) ${bottom}px 100%)`,
            maskComposite: "intersect"
          };
        }
        if (petFade > 1e-3) {
          const alpha = (1 - petFade).toFixed(3), fadeFrom = Math.max(0, WAIST_PCT - 2.5).toFixed(2), fadeTo = Math.min(100, WAIST_PCT + 2.5).toFixed(2);
          return { mask: `linear-gradient(to bottom, #000 0 ${fadeFrom}%, rgba(0,0,0,${alpha}) ${fadeTo}% 100%)`, maskComposite: "" };
        }
        return { mask: fade > 0 ? `linear-gradient(to bottom, #000 calc(100% - ${fade}px), transparent)` : "", maskComposite: "" };
      };
      const applyCanvasMask = (spec) => {
        const { mask, maskComposite } = canvasMask(spec);
        if (mask !== lastMask || maskComposite !== lastMaskComposite) {
          canvas.style.maskImage = canvas.style.webkitMaskImage = mask;
          canvas.style.maskComposite = maskComposite || "add";
          canvas.style.webkitMaskComposite = maskComposite === "intersect" ? "source-in" : "source-over";
          lastMask = mask;
          lastMaskComposite = maskComposite;
        }
      };
      const fitTail = () => {
        const t = bubbleTail(bubble.offsetWidth);
        bubble.style.setProperty("--dsc-tail-c", t - 2 + "px");
        return t;
      };
      const placeIntroBubble = ({ k, noseX, headTop, vp, introProgress }) => {
        const restMaxWidth = coarsePointer() ? Math.min(Math.max(150, visW * k * 1.1), vp.w - 16) : Math.max(150, visW * k * 1.1);
        const size = introBubbleSize(introProgress, restMaxWidth);
        bubble.style.right = "auto";
        bubble.style.fontSize = size.font + "px";
        bubble.style.padding = `${size.padY}px ${size.padX}px`;
        bubble.style.maxWidth = size.maxWidth + "px";
        const bubbleWidth = bubble.offsetWidth, bubbleHeight = bubble.offsetHeight, tail = fitTail();
        if (!coarsePointer()) {
          bubble.style.left = tailLeft({ noseX, bw: bubbleWidth, width: innerWidth, tail }) + "px";
          bubble.style.top = Math.max(8, headTop - bubbleHeight - 6) + "px";
          return;
        }
        const clampY = (top) => Math.min(Math.max(vp.top + HOME_GAP, top), Math.max(vp.top + HOME_GAP, vp.top + vp.h - bubbleHeight - HOME_GAP));
        bubble.style.left = vp.left + tailLeft({ noseX: noseX - vp.left, bw: bubbleWidth, width: vp.w, tail }) + "px";
        bubble.style.top = clampY(Math.max(vp.top + HOME_GAP, headTop - bubbleHeight - 6)) + "px";
      };
      const placeDesktopBubble = ({ k, noseX, headTop, home }) => {
        const card = home.card;
        bubble.style.left = "auto";
        bubble.style.maxWidth = Math.max(150, visW * k * 1.1) + "px";
        const tail = fitTail();
        bubble.style.right = tailRight({ noseX, width: innerWidth, tail }) + "px";
        bubble.style.top = Math.max(8, headTop - bubble.offsetHeight - 10) + "px";
        if (!(card && home.r)) return;
        const cardBox = home.r, bubbleLeft = bubble.offsetLeft, bubbleTop = bubble.offsetTop, bubbleBox = { left: bubbleLeft, top: bubbleTop, right: bubbleLeft + bubble.offsetWidth, bottom: bubbleTop + bubble.offsetHeight };
        if (!(bubbleBox.left < cardBox.right && bubbleBox.right > cardBox.left && bubbleBox.top < cardBox.bottom && bubbleBox.bottom > cardBox.top)) return;
        const belowCard = cardBox.bottom + 8;
        if (belowCard + bubble.offsetHeight <= innerHeight - HOME_GAP) bubble.style.top = belowCard + "px";
        else {
          bubble.style.maxWidth = Math.min(Math.max(150, visW * k * 1.1), innerWidth - 16) + "px";
          bubble.style.top = Math.max(8, Math.min(innerHeight - bubble.offsetHeight - HOME_GAP, headTop - bubble.offsetHeight - 10)) + "px";
        }
      };
      const placeMobileBubble = ({ k, noseX, headTop, vp, home }) => {
        const card = home.card;
        bubble.style.right = "auto";
        bubble.style.maxWidth = Math.min(Math.max(150, visW * k * 1.1), vp.w - 16) + "px";
        const placement = bubbleLayout({ vp, headX: noseX, headTop, bw: bubble.offsetWidth, bh: bubble.offsetHeight, r: card && home.r ? home.r : null, above: home.above, tail: fitTail() });
        bubble.style.left = placement.left + "px";
        bubble.style.top = placement.top + "px";
        if (placement.side && !home.above) bubble.classList.add("side");
      };
      const placeKeyOf = ({ k, x, y, vp, home, noseX, fade, petFade, winBox, walkNow }) => {
        const cardBox = home.r;
        return [
          k,
          x,
          y,
          vp.left,
          vp.top,
          vp.w,
          vp.h,
          fleeX,
          Math.round(bodyWeight * 40),
          cardBox && cardBox.left,
          cardBox && cardBox.right,
          cardBox && cardBox.top,
          cardBox && cardBox.bottom,
          Math.round(noseX / 3),
          home.above ? 1 : 0,
          bubble.textContent,
          bubble.className.replace(/\bside\b/g, "").trim(),
          fade,
          Math.round(petFade * 60),
          walkPlaceKey(walkNow),
          winBox ? [winBox.l, winBox.t, winBox.r, winBox.b].join(",") : ""
        ].join("|");
      };
      const walkPlaceKey = (walkNow) => {
        if (!walkNow) return "";
        const area2 = walk.area, bounds = petBounds;
        return `${walk.phase},${Math.round(walk.alpha * 100)},${area2 ? `${area2.l},${area2.t},${area2.r},${area2.b}` : ""},${bounds ? `${Math.round(bounds.x)},${Math.round(bounds.y)}` : ""}`;
      };
      const fadeAmounts = (k, y) => {
        const lift = PET ? 0 : Math.max(0, innerHeight - (y + H * k));
        const fade = PET ? 0 : Math.round(Math.max(0, Math.min(lift, H * k * 0.18)) * (1 - Math.min(1, Math.max(0, bodyWeight))));
        const petFade = PET ? Math.min(1, Math.max(0, petDocked ? 1 : snapProgress)) : 0;
        return { fade, petFade };
      };
      const showAt = (introOn, k, home) => {
        const show = introOn || k >= SHOW_K || home.above && k >= MIN_SHOW_K;
        canvas.style.display = bubble.style.display = show ? "block" : "none";
        setRender(show && (!PET || petPower));
        return show;
      };
      const petWinBox = () => PET && petDock && petDock.win ? petDock.win : null;
      const placeBubble = (introOn, spot) => {
        if (introOn) placeIntroBubble(spot);
        else if (!coarsePointer() && !spot.home.above) placeDesktopBubble(spot);
        else placeMobileBubble(spot);
      };
      const place = () => {
        if (placeBlocked()) return;
        const now = performance.now();
        const home = homePose();
        const dock = dockPose(home, now);
        const pose2 = introPose(home, dock, now);
        if (!pose2) return;
        let { k, x, y } = pose2;
        const { introOn, introProgress } = pose2;
        if (!showAt(introOn, k, home)) return;
        if (curK !== k) {
          curK = k;
          setRes(k);
        }
        shown.k = k;
        shown.x = x;
        shown.y = y;
        const walkNow = PET ? petWalkClipOn() : false;
        if (PET) ({ x, y } = placePetWindow(dock, k, walkNow));
        updateCardClip(home, introOn, k, x, y, walkNow);
        const { fade, petFade } = fadeAmounts(k, y);
        const winBox = petWinBox();
        const noseX = x + noseCanvasX * k;
        const viewArea = home.vp || viewport();
        const placeKey = introOn ? "" : placeKeyOf({ k, x, y, vp: viewArea, home, noseX, fade, petFade, winBox, walkNow });
        if (placeKey && placeKey === lastPlaceKey) return;
        lastPlaceKey = placeKey;
        applyCanvasMask({ winBox, petFade, fade, x, y });
        canvas.style.width = W * k + "px";
        canvas.style.height = H * k + "px";
        if (fleeX !== 0) bubble.style.display = "none";
        canvas.style.left = x + "px";
        canvas.style.top = y + "px";
        const headTop = y + (H * 0.05 + chibiHeadDrop * Math.min(1, Math.max(0, bodyWeight))) * k;
        bubble.classList.remove("side");
        const spot = { k, noseX, headTop, vp: viewArea, home, introProgress };
        placeBubble(introOn, spot);
      };
      const hideChipVisible = ({ pet: pet2 = PET, isHidden = hidden, mobileHiddenNow = mobileHidden() } = {}) => !pet2 && isHidden && !mobileHiddenNow && !pageHiddenNow();
      let placeErrorWarned = false;
      let rafIdle = false;
      const wakeRaf = () => {
        if (rafIdle) {
          rafIdle = false;
          systemTicker(true);
          requestAnimationFrame2(raf);
        }
      };
      const raf = (time) => {
        if (rafIdle) {
          systemTicker(false);
          return;
        }
        if (hidden) {
          syncHideChip();
        } else if (SLEEP.state !== "asleep") {
          try {
            place();
            placeErrorWarned = false;
          } catch (error) {
            if (!placeErrorWarned) {
              placeErrorWarned = true;
              console.warn("캐릭터 배치 실패:", error);
            }
          }
        }
        if (renderOn) rig.tick(time);
        if (!PET && pageHiddenNow()) {
          rafIdle = true;
          systemTicker(false);
          return;
        }
        if (rafIdle) {
          systemTicker(false);
          return;
        }
        if (PET ? !petPower : link.open) {
          rafIdle = true;
          systemTicker(false);
          return;
        }
        requestAnimationFrame2(raf);
      };
      requestAnimationFrame2(raf);
      let bubbleTimer = 0;
      let lastSayAt = 0;
      let lastSayText = "";
      const hideBubble = (delay) => {
        bubbleTimer = setTimeout2(() => {
          if (voiceState?.speaking === true) {
            hideBubble(250);
            return;
          }
          bubble.classList.remove("show");
        }, delay);
      };
      const say = (text, ms = 3500, mutter = false, kind) => {
        if (typeof text !== "string" || !text) return;
        relay("say", [text, ms, mutter, kind]);
        bubble.textContent = text;
        bubble.classList.add("show");
        lastSayText = text;
        bubble.classList.toggle("mutter", mutter);
        lastSayAt = performance.now();
        startTalk(text, ms || 3e3, mutter);
        clearTimeout(bubbleTimer);
        if (ms) hideBubble(ms);
        kind = kind || (mutter ? "mutter" : "other");
        try {
          window.dispatchEvent(new CustomEvent("dsc:say", { detail: { text, ms, kind } }));
        } catch {
        }
      };
      const hush = () => {
        relay("hush", []);
        clearTimeout(bubbleTimer);
        bubble.classList.remove("show");
      };
      let hideChip = null;
      const showHideChip = () => {
        if (hideChip || !hideChipVisible()) return;
        hideChip = life.own(document.createElement("button"), (node) => node.remove());
        hideChip.type = "button";
        hideChip.id = "dsc-hide-chip";
        hideChip.textContent = "숨긴 캐릭터 다시 표시";
        hideChip.addEventListener("click", () => setHidden(false));
        document.body.append(hideChip);
      };
      const clearHideChip = () => {
        if (hideChip) {
          hideChip.remove();
          hideChip = null;
        }
      };
      const syncHideChip = () => {
        if (hideChipVisible()) showHideChip();
        else clearHideChip();
      };
      const hideForPage = () => {
        pageHiddenApplied = true;
        canvas.style.display = bubble.style.display = "none";
        veil.style.opacity = "0";
        veil.style.pointerEvents = "none";
        setRender(false);
        clearHideChip();
        lastPlaceKey = "";
        systemTicker(false);
      };
      const restoreFromPage = () => {
        if (PET) return;
        const applied = pageHiddenApplied;
        pageHiddenApplied = false;
        if (!applied) {
          syncHideChip();
          return;
        }
        veil.style.opacity = "";
        veil.style.pointerEvents = "";
        systemTicker(true);
        if (!hidden && SLEEP.state !== "asleep") {
          canvas.style.display = bubble.style.display = "";
          lastPlaceKey = "";
          wakeRaf();
          try {
            place();
          } catch (error) {
            console.warn("캐릭터 배치 실패:", error);
          }
        } else {
          canvas.style.display = bubble.style.display = "none";
          setRender(false);
          wakeRaf();
        }
        syncHideChip();
      };
      const syncPageHidden = () => {
        if (PET) return;
        if (pageHiddenNow()) hideForPage();
        else restoreFromPage();
      };
      if (!PET) hooks.syncPageHidden = syncPageHidden;
      if (pageHiddenNow()) hideForPage();
      const setHidden = (next) => {
        if (PET || hidden === next) return hidden;
        hidden = next;
        if (hidden) {
          drag.pending = null;
          drag.on = false;
          strokeFrom = null;
          chestFrom = null;
          hush();
          canvas.style.display = bubble.style.display = "none";
          veil.style.display = "none";
          document.documentElement.classList.remove("dsc-hover", "dsc-grabbing");
          setRender(false);
          if (link.open || link.follow) {
            link.opening = 0;
            try {
              link.post("hide");
            } catch {
            }
          }
          showHideChip();
        } else {
          clearHideChip();
          veil.style.display = "";
          bubble.style.display = "";
          canvas.style.display = "";
          lastPlaceKey = "";
          if (SLEEP.state === "asleep" || SLEEP.state === "leaving") {
            clearTimeout(sleepTimer);
            sleepTimer = 0;
            cancelSleepSlide?.();
            cancelSleepSlide = null;
            SLEEP.state = "active";
            fleeX = 0;
            SLEEP.lastActive = performance.now();
          }
          setRender(true);
          if (link.open || link.follow) {
            link.open = false;
            link.follow = null;
            link.opening = 0;
            try {
              link.post("hide");
            } catch {
            }
          }
          wakeRaf();
          place();
          requestAnimationFrame2(() => {
            if (!hidden && !link.open && !link.follow && canvas.style.display === "none") lastPlaceKey = "";
          });
          setTimeout2(() => {
            if (!hidden && !link.open && !link.follow) {
              lastPlaceKey = "";
              place();
            }
          }, 350);
        }
        return hidden;
      };
      if (!PET) {
        hooks.toggleCanvas = () => setHidden(!hidden);
        hooks.canvasHidden = () => hidden;
      }
      let mouseX = innerWidth / 2, mouseY = innerHeight / 2, lastMove = 0;
      addEventListener("mousemove", (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        lastMove = performance.now();
      }, { passive: true });
      const headLookX = S(), headLookY = S(), eyeLookX = S(), eyeLookY = S();
      const bob = S();
      const bobKick = (velocity) => {
        bob.v += velocity;
      };
      let energy = 0.6;
      const attention = { x: 0, y: 0.05, next: 0 };
      const pickAttention = (now, talking) => {
        let spot;
        const chance = Math.random();
        if (talking) spot = chance < 0.85 ? [0, 0.05] : [-0.5, 0.1];
        else if (mood === "work") spot = chance < 0.55 ? [-0.75, 0.12] : chance < 0.75 ? [-0.55, -0.3] : chance < 0.9 ? [0, 0.05] : [0.35, 0.3];
        else if (mood === "wait") spot = chance < 0.7 ? [0, 0.05] : [-0.7, 0.05];
        else if (mood === "sad") spot = chance < 0.6 ? [0.1, -0.45] : [-0.3, -0.3];
        else spot = chance < 0.4 ? [0, 0.05] : chance < 0.6 ? [-0.7, 0.1] : [(Math.random() - 0.5) * 1.2, (Math.random() - 0.4) * 0.7];
        attention.x = spot[0] + (Math.random() - 0.5) * 0.12;
        attention.y = spot[1] + (Math.random() - 0.5) * 0.1;
        attention.next = now + (talking ? 2500 : mood === "work" ? 1200 : 1500) + Math.random() * 3e3;
        if (Math.random() < 0.35) blink.next = Math.min(blink.next, now + 60);
        if (Math.random() < 0.3) browKick = Math.max(browKick, 0.25);
      };
      let talk = null;
      const startTalk = (text, ms, quiet) => {
        const { syl, total } = parseSyllables(text, ms);
        talk = { syl, t0: performance.now(), total, quiet };
      };
      const VOWELS = ["A", "I", "U", "E", "O"];
      const VOWEL_PARAMS = PARAMS.mouthVowel;
      const vowel = { A: 0, I: 0, U: 0, E: 0, O: 0 };
      let mouthOpen = 0, talkSway = 0, browKick = 0, browValue = 0, nodKick = 0, lastStressIndex = -1;
      let voiceState = null;
      const look = { x: 0, y: 0 };
      const pose1 = { lean: 0, headZ: 0, headY: 0, bodyY: 0 };
      const gestureSprings = {};
      const GESTURE_SPRING = {
        yaw: [90, 19],
        pitch: [90, 19],
        roll: [90, 19],
        // 고개: 약 0.42초에 안정
        bodyX: [55, 14.8],
        bodyY: [55, 14.8],
        bodyZ: [55, 14.8],
        lean: [48, 13.8],
        // 몸통: 약 0.5~0.6초
        smile: [40, 12.6],
        eyeSmile: [40, 12.6],
        eyeClose: [40, 12.6],
        mouth: [40, 12.6]
        // 팔·표정: 약 0.65초
      };
      for (const channel in GESTURE_SPRING) gestureSprings[channel] = { x: 0, v: 0 };
      let blink = { next: performance.now() + 2e3, start: -1e9, double: false }, lastFrameAt = performance.now();
      const frameContext = (now, dt) => {
        const introCalm = intro.phase !== "done";
        const seconds = now / 1e3;
        if (voiceState && voiceState.until && now > voiceState.until) voiceState = null;
        const talking = voiceState?.speaking === true || bubble.classList.contains("show") && fleeX === 0;
        const muttering = talking && bubble.classList.contains("mutter");
        if (moodUntil && now > moodUntil) {
          mood = "idle";
          moodUntil = 0;
        }
        const laughing = gestureState.name === "laugh";
        return { now, dt, seconds, introCalm, talking, muttering, laughing };
      };
      const updateEnergy = ({ dt, talking, muttering, laughing }) => {
        const energyTarget = (mood === "sad" ? 0.35 : mood === "wait" ? 0.55 : mood === "work" ? 0.75 : 0.6) + (talking && !muttering ? 0.35 : 0) + (laughing ? 0.5 : 0);
        energy += (energyTarget - energy) * Math.min(1, dt * 1.5);
      };
      const updateGaze = ({ now, dt, introCalm, talking, muttering }) => {
        let targetX, targetY;
        if (behaviors.tagged(TAGS.stare, now)) {
          targetX = 0;
          targetY = 0.05;
        } else if (muttering) {
          targetX = 0.4;
          targetY = 0.38;
        } else if (talking && introCalm) {
          targetX = attention.x * 0.25;
          targetY = 0.05 + attention.y * 0.2;
        } else if (now - lastMove < 2500 && !talking) {
          const rect = canvas.getBoundingClientRect();
          targetX = clamp((mouseX - (rect.left + rect.width / 2)) / GAZE.rangePx[0], -1, 1);
          targetY = clamp((rect.top + rect.height * 0.25 - mouseY) / GAZE.rangePx[1], -1, 1);
        } else {
          if (now > attention.next || !introCalm && talking && Math.abs(attention.x) > 0.3 && Math.random() < dt * 2) pickAttention(now, talking);
          targetX = attention.x;
          targetY = attention.y;
        }
        const [eyeStiffness, eyeDamping] = introCalm ? GAZE.eyeSpringCalm : GAZE.eyeSpring;
        const [headStiffness, headDamping] = GAZE.headSpring;
        spring(eyeLookX, targetX, dt, eyeStiffness, eyeDamping);
        spring(eyeLookY, targetY, dt, eyeStiffness, eyeDamping);
        spring(headLookX, targetX * GAZE.headShare[0], dt, headStiffness, headDamping);
        spring(headLookY, targetY * GAZE.headShare[1], dt, headStiffness, headDamping);
        look.x = headLookX.x;
        look.y = headLookY.x;
      };
      const stressKick = (introCalm) => {
        if (!introCalm) browKick = Math.max(browKick, 0.35 + Math.random() * 0.35);
        else if (Math.random() < 0.35) browKick = Math.max(browKick, 0.2 + Math.random() * 0.15);
        if (Math.random() < 0.45) nodKick = Math.max(nodKick, 0.6 + Math.random() * 0.5);
      };
      const talkOpen = (now, introCalm) => {
        const current = talk;
        let t = (now - current.t0) / 1e3;
        if (t >= current.total) {
          talk = null;
          return 0;
        }
        let i = 0;
        while (i < current.syl.length && t > current.syl[i].d) {
          t -= current.syl[i].d;
          i++;
        }
        const syllable = current.syl[i];
        if (!(syllable && syllable.v)) return 0;
        const progress = t / syllable.d, envelope = Math.pow(Math.sin(Math.PI * Math.min(1, progress)), 0.7);
        const open = envelope * syllable.amp * (current.quiet ? 0.3 : 1);
        vowel[syllable.v] = Math.max(vowel[syllable.v], open);
        if (syllable.stress && i !== lastStressIndex) {
          lastStressIndex = i;
          if (!current.quiet) stressKick(introCalm);
        }
        return open;
      };
      const updateSpeech = ({ now, dt, introCalm }) => {
        let open = 0;
        for (const key of VOWELS) vowel[key] *= Math.max(0, 1 - dt * 14);
        if (talk) open = talkOpen(now, introCalm);
        if (voiceState?.speaking) {
          open = clamp(voiceState.level, 0, 1) * 0.9;
          if (voiceState.vowels) for (const key of VOWELS) vowel[key] = Math.max(vowel[key] * 0.4, clamp(voiceState.vowels[key] || 0, 0, 1));
        }
        mouthOpen += (open - mouthOpen) * Math.min(1, dt * 16);
        browKick *= Math.max(0, 1 - dt * (introCalm ? 2 : 3.5));
        browValue = introCalm ? browValue + (browKick - browValue) * Math.min(1, dt * 5) : browKick;
        nodKick *= Math.max(0, 1 - dt * 5);
      };
      const updateMoodPose = (dt) => {
        const goal = { lean: 0, headZ: 0, headY: 0, bodyY: 0 };
        if (mood === "work") {
          goal.lean = -7;
          goal.headY = -5;
        }
        if (mood === "wait") {
          goal.lean = -9;
          goal.headZ = 8;
          goal.headY = 3;
        }
        if (mood === "sad") {
          goal.headY = -10;
          goal.bodyY = -5;
        }
        const followRate = Math.min(1, dt * 2.2);
        for (const key of Object.keys(goal)) {
          pose1[key] += (goal[key] - pose1[key]) * followRate;
          pose[key] += (pose1[key] - pose[key]) * followRate;
        }
      };
      const baseMotion = ({ now, dt, seconds, talking, muttering }) => {
        const motion = { yaw: headLookX.x * GAZE.headDeg[0] + noise(seconds * 0.33, 1) * 6 * energy };
        motion.pitch = headLookY.x * GAZE.headDeg[1] + noise(seconds * 0.41, 2) * 4.5 * energy + pose.headY - nodKick * 4 - mouthOpen * 1.5;
        motion.roll = noise(seconds * 0.27, 3) * 7.5 * energy - headLookX.x * headLookY.x * 7 + pose.headZ;
        const staring = behaviors.tagged(TAGS.stare, now);
        stareWeight += ((staring ? 1 : 0) - stareWeight) * Math.min(1, dt * 6);
        talkSway += ((talking && !muttering && !staring ? 1 : 0) - talkSway) * Math.min(1, dt * 2.5);
        motion.swayYaw = Math.sin(seconds * Math.PI * 2 * 0.31 + 1.3) * 4.5 * talkSway;
        motion.swayPitch = Math.sin(seconds * Math.PI * 2 * 0.47 + 0.6) * 1.5 * talkSway;
        if (talkSway > 0.01) {
          motion.roll += Math.sin(seconds * Math.PI * 2 * 0.55) * 4 * talkSway;
          motion.yaw += motion.swayYaw;
          motion.pitch += motion.swayPitch;
        }
        motion.bodyX = headLookX.x * 8 + noise(seconds * 0.17, 4) * 5 * energy;
        motion.bodyZ = motion.roll * 0.5 + noise(seconds * 0.21, 5) * 3 * energy;
        spring(bob, 0, dt, 70, 6);
        motion.bodyY = pose.bodyY + Math.sin(seconds * 2 * Math.PI / 3.6) * 1.8 + clamp(bob.x, -14, 14);
        motion.lean = pose.lean;
        motion.smile = 0;
        motion.eyeSmileAdd = 0;
        motion.eyeClose = 0;
        motion.mouthAdd = 0;
        if (mood === "work") motion.bodyZ += Math.sin(seconds * 2.1) * 1.2;
        return motion;
      };
      const applyGesture = (motion, { now, dt }) => {
        const gestureOut = { yaw: 0, pitch: 0, roll: 0, bodyX: 0, bodyY: 0, bodyZ: 0, lean: 0, smile: 0, eyeSmile: 0, eyeClose: 0, mouth: 0 };
        if (gestureState.name) {
          const progress = (now - gestureState.start) / gestureState.dur;
          if (progress >= 1) {
            gestureState.name = null;
            nextIdleGesture = Math.max(nextIdleGesture, now + 2500 + Math.random() * 3500);
          } else addGesture(gestureOut, gestureState.name, progress, gestureState.dir);
        }
        for (const channel of Object.keys(gestureOut)) {
          const springParams = GESTURE_SPRING[channel];
          spring(gestureSprings[channel], gestureOut[channel], dt, springParams[0], springParams[1]);
        }
        motion.yaw += gestureSprings.yaw.x;
        motion.pitch += gestureSprings.pitch.x;
        motion.roll += gestureSprings.roll.x;
        motion.bodyX += gestureSprings.bodyX.x;
        motion.bodyY += gestureSprings.bodyY.x;
        motion.bodyZ += gestureSprings.bodyZ.x;
        motion.lean += gestureSprings.lean.x;
        motion.smile += gestureSprings.smile.x;
        motion.eyeSmileAdd += gestureSprings.eyeSmile.x;
        motion.eyeClose += gestureSprings.eyeClose.x;
        motion.mouthAdd += gestureSprings.mouth.x;
        if (!gestureState.name && mood === "idle" && now > nextIdleGesture && !behaviors.tagged(TAGS.busy, now)) {
          const chance = Math.random();
          const pick = chance < 0.3 ? "tilt" : chance < 0.5 ? "sway" : chance < 0.72 ? "lean" : chance < 0.88 ? "nod" : "laugh";
          play(pick, pick === "lean" ? 2600 : pick === "sway" ? 2300 : pick === "laugh" ? 1500 : 1800);
          nextIdleGesture = now + 7e3 + Math.random() * 9e3;
        }
      };
      const applyTouchAndShiver = (motion, frame) => {
        const { now } = frame;
        behaviors.frame("motion", frame, motion);
        const shiverSec = (now - shiverStarted) / 1e3;
        if (shiverSec >= 0 && shiverSec < 5) {
          const tremor = Math.sin(shiverSec * Math.PI * 2 * 8) * Math.min(1, shiverSec / 0.2) * Math.pow(1 - shiverSec / 5, 1.5);
          motion.bodyZ -= tremor * 3;
          motion.roll += tremor * 2;
          if (now > shiverBobAt) {
            bobKick((shiverBobSign = -shiverBobSign) * 40 * Math.pow(1 - shiverSec / 5, 1.5));
            shiverBobAt = now + 170 + Math.random() * 90;
          }
        }
      };
      const applyWalk = (motion, { now, dt, seconds }) => {
        if (fleeX !== 0 && !walk.phase) motion.bodyZ += Math.sin(seconds * 16) * 8;
        const faceTo = walk.phase === "out" ? walk.dir : walk.phase === "in" ? walk.faceDir == null ? -walk.dir : walk.faceDir : 0;
        walk.face += (faceTo - walk.face) * Math.min(1, dt * 5);
        const facing = Math.abs(walk.face);
        if (facing > 0.01) {
          const stepPhase = seconds * Math.PI * 2 * 1.8, faceDirection = walk.face;
          motion.yaw = motion.yaw * (1 - facing) + 22 * faceDirection;
          motion.pitch -= 2 * facing;
          motion.roll += Math.sin(stepPhase) * 2.5 * facing;
          motion.bodyX += 6 * faceDirection;
          motion.bodyY += Math.abs(Math.sin(stepPhase)) * 6 * facing;
          motion.bodyZ += Math.sin(stepPhase) * 4 * facing;
        }
        if (walkCheck) walkCheck(now);
      };
      const applyCarry = (motion, { now, dt }) => {
        const lastSample = drag.samples.length ? drag.samples[drag.samples.length - 1][0] : 0;
        if (!drag.on || now - lastSample > 60) {
          const decay = Math.max(0, 1 - dt * 5);
          carry.vx *= decay;
          carry.vy *= decay;
        }
        const carryVx = clamp(carry.vx / 1600, -1, 1), carryVy = clamp(carry.vy / 1600, -1, 1);
        if (Math.abs(carryVx) + Math.abs(carryVy) > 2e-3) {
          motion.bodyX -= carryVx * 16;
          motion.bodyZ -= carryVx * 14;
          motion.roll -= carryVx * 12;
          motion.yaw += carryVx * 8;
          motion.bodyY -= carryVy * 12;
          motion.pitch += carryVy * 10;
        }
      };
      const writeHeadBody = (motion) => {
        if (stareWeight > 0.01) {
          const k = 1 - stareWeight * 0.92;
          motion.yaw = headLookX.x * GAZE.headDeg[0] * (1 - stareWeight) + (motion.yaw - headLookX.x * GAZE.headDeg[0]) * k;
          motion.pitch *= k;
          motion.roll *= k;
          motion.bodyX *= k;
          motion.bodyZ *= k;
        }
        motion.yaw = clamp(motion.yaw, -30, 30);
        motion.pitch = clamp(motion.pitch, -30, 30);
        motion.roll = clamp(motion.roll, -30, 30);
        for (const [id, value] of [
          [PARAMS.headTurn, motion.yaw],
          [PARAMS.headTilt, motion.pitch],
          [PARAMS.headRoll, motion.roll],
          [PARAMS.headTurnDirect, motion.yaw],
          [PARAMS.headTiltDirect, motion.pitch],
          [PARAMS.headRollDirect, motion.roll],
          [PARAMS.bodyShiftX, clamp(motion.bodyX, -30, 30)],
          [PARAMS.bodyShiftY, clamp(motion.bodyY, -30, 30)],
          [PARAMS.bodyShiftZ, clamp(motion.bodyZ, -30, 30)],
          [PARAMS.bodyLean, clamp(motion.lean, -30, 30)]
        ]) addParam(id, value);
      };
      const writeEyes = (motion, { seconds }, { weight: blendWeight, eye: blendEye }) => {
        addParam(PARAMS.eyeLookX, clamp(((eyeLookX.x - headLookX.x) * 0.9 + headLookX.x * 0.2) * 0.6, -GAZE.eyeLimit[0], GAZE.eyeLimit[0]) * (1 - blendWeight) + blendEye * blendWeight - motion.swayYaw / 30 * (1 - blendWeight));
        addParam(PARAMS.eyeLookY, clamp(((eyeLookY.x - headLookY.x) * 0.9 + headLookY.x * 0.2) * 0.6 - motion.swayPitch / 30, -GAZE.eyeLimit[1], GAZE.eyeLimit[1]));
        setParam(PARAMS.breath, 0.5 + 0.5 * Math.sin(seconds * 2 * Math.PI / 3.6));
      };
      const writeBrows = ({ seconds }) => {
        const brow = browValue + noise(seconds * 0.5, 7) * 0.12 + (mood === "wait" ? 0.25 : mood === "sad" ? -0.3 : 0) - 0.15 * happyMouth;
        if (happyMouth > 0.01) addParam(PARAMS.browInnerRaise, 0.55 * happyMouth);
        addParam(PARAMS.browRaiseLeft, clamp(brow, -1, 1));
        addParam(PARAMS.browRaiseRight, clamp(brow + noise(seconds * 0.6, 8) * 0.06, -1, 1));
        if (browValue > 0.15) addParam(PARAMS.browInnerRaise, Math.min(1, browValue * 0.6));
      };
      const writeMouth = (motion, frame, { weight: blendWeight }) => {
        const { now, dt, seconds } = frame;
        const openNow = clamp(mouthOpen + motion.mouthAdd + 0.14 * happyMouth, 0, 1);
        if (openNow > 0.01) {
          setParam(PARAMS.mouthOpen, openNow * 0.9);
          addParam(PARAMS.jawOpen, openNow * 0.45);
          setParam(PARAMS.mouthClosed, 1 - openNow);
          for (const key of VOWELS) if (vowel[key] > 0.01) addParam(VOWEL_PARAMS[key], Math.min(1, vowel[key]) * (VOWEL_EYE_SAFE[key] || 1));
          if (motion.mouthAdd > 0.01) addParam(PARAMS.mouthVowel.A, motion.mouthAdd * 0.8);
        }
        happyMouth += ((behaviors.tagged(TAGS.shySmile, now) ? 1 : 0) - happyMouth) * Math.min(1, dt * 5);
        const baseSmile = (mood === "sad" ? 0 : mood === "wait" ? 0.15 : 0.35) * (1 - blendWeight) + 0.2 * happyMouth;
        behaviors.frame("face", frame);
        addParam(PARAMS.mouthForm, clamp(baseSmile + motion.smile * 0.4, -1, 1));
        addParam(PARAMS.mouthSmileLeft, clamp(baseSmile + motion.smile * 0.5 + 0.3 * happyMouth, 0, 1));
        addParam(PARAMS.mouthSmileRight, clamp(baseSmile + motion.smile * 0.5 + noise(seconds * 0.3, 9) * 0.05, 0, 1));
        const eyeSmile = clamp((mood === "sad" ? 0 : 0.12) + motion.smile * 0.35 + motion.eyeSmileAdd, 0, 1);
        if (eyeSmile > 0.01) addParam(PARAMS.eyeSmile, eyeSmile);
      };
      const writeBlink = (motion, { now, laughing }) => {
        if (now >= blink.next && !laughing) {
          blink.start = now;
          blink.next = blink.double ? now + 2e3 + Math.random() * 4e3 : Math.random() < 0.18 ? now + 260 : now + 2e3 + Math.random() * 4e3;
          blink.double = !blink.double && blink.next - now < 400;
        }
        const sinceBlink = (now - blink.start) / 1e3;
        const eyeOpen = clamp((mood === "work" ? 0.92 : 0.97) * (1 - blinkClose(sinceBlink)) * (1 - motion.eyeClose), 0, 1.2);
        setParam(PARAMS.eyeOpenLeft, eyeOpen);
        setParam(PARAMS.eyeOpenRight, eyeOpen);
      };
      const writeExpressions = ({ now, dt }) => {
        for (const name2 of rig.expressionNames()) {
          const target = hold[name2] || (until[name2] || 0) > now ? 1 : 0;
          const EYE_SWAP = EYE_EXP.includes(name2);
          if (EYE_SWAP && weight[name2] > 0.5 !== target > 0.5) {
            blink.start = now - 0.07 * 1e3;
            blink.next = Math.max(blink.next, now + 1500);
          }
          const w = weight[name2] = EYE_SWAP ? target : (weight[name2] || 0) + (target - (weight[name2] || 0)) * Math.min(1, dt * 6);
          if (w < 0.01) continue;
          rig.expression(name2, w);
        }
      };
      const writeOutfitParams = (outfit, dt) => {
        for (const [key, id, value] of OUTFIT_PARAMS) {
          const w = outfitWeight[key] = (outfitWeight[key] || 0) + ((outfit[key] ? 1 : 0) - (outfitWeight[key] || 0)) * Math.min(1, dt * 6);
          if (w > 5e-3) addParam(id, value * w);
        }
      };
      const writeEarHide = (outfit, dt) => rig.earHide(outfit.earHide === true, dt);
      const writeBodyShape = (outfit, dt) => {
        const walkingBody = walk.phase === "out" || walk.phase === "away" || walk.phase === "in" || SLEEP.state === "leaving" || SLEEP.state === "waking";
        bodyWeight += ((walkingBody ? 1 : BODY_VALUE[outfit.bodyType] || 0) - bodyWeight) * Math.min(1, dt * 4);
        if (bodyWeight > 2e-3) addParam(PARAMS.bodyType, bodyWeight);
        rig.bodyShape(bodyWeight);
      };
      const talkOutfitChange = (outfit) => {
        if (outfitPrev && outfitTalk) {
          for (const [key] of OUTFIT_PARAMS) {
            if (outfit[key] && !outfitPrev[key]) outfitTalk(OUTFIT_LINE[key]);
            else if (!outfit[key] && outfitPrev[key] && OUTFIT_LINE_OFF[key]) outfitTalk(OUTFIT_LINE_OFF[key]);
          }
          if ((outfit.bodyType || "default") !== (outfitPrev.bodyType || "default")) outfitTalk("body_" + (outfit.bodyType || "default"));
        }
        outfitPrev = { ...outfit };
      };
      const writeOutfit = ({ dt }) => {
        const outfit = prefs.outfit || {};
        writeOutfitParams(outfit, dt);
        writeEarHide(outfit, dt);
        writeBodyShape(outfit, dt);
        talkOutfitChange(outfit);
      };
      rig.onFrame(() => {
        const now = performance.now(), dt = Math.min(0.05, (now - lastFrameAt) / 1e3);
        lastFrameAt = now;
        behaviors.frame("start", { now, dt, seconds: now / 1e3 });
        const frame = frameContext(now, dt);
        updateEnergy(frame);
        updateGaze(frame);
        updateSpeech(frame);
        updateMoodPose(dt);
        const motion = baseMotion(frame);
        applyGesture(motion, frame);
        applyTouchAndShiver(motion, frame);
        applyWalk(motion, frame);
        applyCarry(motion, frame);
        const blend = behaviors.blend(motion, frame);
        writeHeadBody(motion);
        writeEyes(motion, frame, blend);
        writeBrows(frame);
        writeMouth(motion, frame, blend);
        writeBlink(motion, frame);
        writeExpressions(frame);
        behaviors.frame("params", frame);
        writeOutfit(frame);
      });
      const EXP_NAME = { "홍조": "blush", "><": "squint", "하트": "heart", "얄미운": "smug", "식은땀": "sweat", "어두운": "dark", "눈물": "tears", "어지럼": "dizzy" };
      const lastLine = {};
      const speak = (key, ms = 3500) => {
        const list = LINES[key];
        if (!list) return;
        const candidates = [];
        for (let i = 0; i < list.length; i++) {
          if (list.length > 1 && i === lastLine[key]) continue;
          const raw = list[i], tagMatch = raw.match(/^\[([^\]]+)\]\s*/);
          const text2 = tagMatch ? raw.slice(tagMatch[0].length) : raw;
          if (text2 === lastSayText) continue;
          candidates.push({ i, text: text2, exp: tagMatch ? tagMatch[1] : "" });
        }
        if (!candidates.length) return;
        const pick = candidates[Math.floor(Math.random() * candidates.length)];
        lastLine[key] = pick.i;
        for (const n of pick.exp.split(",")) {
          const e = EXP_NAME[n.trim()];
          if (e) flashExp(e, ms);
        }
        const text = pick.text;
        say(text, ms);
      };
      outfitTalk = (key) => {
        const now = performance.now();
        if (fleeX === 0 && !behaviors.tagged(TAGS.busy, now)) behaviors.dispatch(EVENTS.outfitChange, { now, x: 0, y: 0, concept: key });
      };
      const behaviorContext = {
        life,
        scale: () => curK,
        timeline: createTimeline(setTimeout2, (id) => clearTimeout(id)),
        now: () => performance.now(),
        play,
        speak,
        flashExp,
        cancelGesture: () => {
          gestureState.name = null;
        },
        clearExp: (names) => {
          for (const name2 of names) until[name2] = 0;
        },
        shiver: () => {
          shiverStarted = performance.now();
        },
        lockInput: (ms) => {
          inputLockedUntil = performance.now() + ms;
        },
        markTouched: () => {
          walk.lastTouch = performance.now();
        },
        resetTapCounters: () => {
          clicks = [];
          headClicks = [];
        },
        tagged: (tag) => behaviors.tagged(tag, performance.now()),
        addParam: (id, value) => addParam(id, value),
        setParam: (id, value) => setParam(id, value),
        bodyWeight: () => bodyWeight,
        displaced: () => fleeX !== 0,
        chestDrag: { lift: dragLift, shift: dragShift },
        flee: (onBack) => flee(onBack)
      };
      const behaviors = createBehaviors(BUILTIN_BEHAVIORS, rig.behaviors, behaviorContext, { allowAdult: rig.adultAllowed, warn: (message) => log.warnOnce(`behavior:${message}`, "캐릭터 행동:", message) });
      const regionByShape = (region, ratioY, inChest) => {
        if (region === "head" && ratioY > GEOMETRY.headBottom) region = null;
        if (region === "arm" && behaviors.tagged(TAGS.armCover, performance.now()) && ratioY < GEOMETRY.coverArmBottom) return "chest";
        if (region === "arm" || region === "leg" || region === "head") return region;
        if (inChest) return "chest";
        if (region === "lower") return "lower";
        if (region === "waist") return ratioY > GEOMETRY.chestBottom ? "lower" : "chest";
        if (region === null && ratioY < GEOMETRY.headBottom) return "head";
        return ratioY < GEOMETRY.chestBottom ? "chest" : "body";
      };
      const touchRegion = (x, y, drawable) => {
        if (bodyWeight > 0.5) return rig.chibiRegion(y);
        const shape = rig.touchShape(x, y, drawable), region = regionByShape(shape.part, shape.ratioY, shape.inChest);
        if (region === "chest") return behaviors.has(EVENTS.chestTap) ? region : "body";
        if (region === "lower") return behaviors.has(EVENTS.lowerTap) ? region : "body";
        return region;
      };
      const UI_HIT = 'button, a[href], input, textarea, select, summary, [contenteditable="true"], [class*="composerSeat"] [class*="_card"]';
      const hitAt = (cx, cy) => {
        if (canvas.style.display === "none" || fleeX !== 0) return null;
        const rect = canvas.getBoundingClientRect();
        if (cx < rect.left || cx > rect.right || cy < rect.top || cy > rect.bottom) return null;
        if (document.elementFromPoint(cx, cy)?.closest(UI_HIT)) return null;
        const x = (cx - rect.left) / curK, y = (cy - rect.top) / curK;
        const drawable = rig.pick(x, y);
        return drawable >= 0 ? [x, y, drawable] : null;
      };
      let clicks = [], headClicks = [], spamAt = -1e9, inputLockedUntil = 0;
      const nearSide = () => {
        const areaRect = area(), centerX = shown.x - fleeX + W * curK / 2;
        return centerX - areaRect.l < areaRect.r - centerX ? -1 : 1;
      };
      const outDistance = (dir) => {
        const areaRect = area(), x = shown.x - fleeX;
        return dir < 0 ? -(x + W * curK - areaRect.l + 20) : areaRect.r - x + 20;
      };
      const FLEE_DIST = 300, FLEE_OUT_MS = 700, FLEE_IN_MS = 900, FLEE_HIDE_MS = 1e4;
      let fleeFade = 1;
      const fleeSlide = (from, to, ms, done) => {
        const startedAt = performance.now();
        const step = () => {
          const progress = Math.min(1, (performance.now() - startedAt) / ms), e = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
          fleeX = from + (to - from) * e;
          if (progress < 1) requestAnimationFrame2(step);
          else done && done();
        };
        requestAnimationFrame2(step);
      };
      const flee = (onBack) => {
        if (drag.pending || drag.on || link.open || link.follow) return;
        hush();
        if (!PET) {
          const off = outDistance(nearSide());
          fleeSlide(Math.sign(off) * 0.01, off, 700, () => setTimeout2(() => fleeSlide(off, 0, 1100, () => {
            fleeX = 0;
            setTimeout2(onBack, 400);
          }), 1e4));
          return;
        }
        const dist = nearSide() * Math.max(FLEE_DIST, W * curK * 0.5);
        const finish = () => {
          fleeX = 0;
          fleeFade = 1;
          canvas.style.opacity = "";
          setTimeout2(onBack, 400);
        };
        const runIn = () => {
          const inStartedAt = performance.now();
          const step = () => {
            if (drag.pending || drag.on) return finish();
            const progress = Math.min(1, (performance.now() - inStartedAt) / FLEE_IN_MS);
            fleeX = dist * (1 - progress * progress * (3 - 2 * progress));
            fleeFade = progress * progress * (3 - 2 * progress);
            canvas.style.opacity = String(Math.min(1, fleeFade));
            if (progress < 1) requestAnimationFrame2(step);
            else finish();
          };
          requestAnimationFrame2(step);
        };
        const outStartedAt = performance.now();
        const runOut = () => {
          const progress = Math.min(1, (performance.now() - outStartedAt) / FLEE_OUT_MS);
          fleeX = dist * (1 - Math.pow(1 - progress, 3));
          fleeFade = Math.max(0, 1 - Math.pow(progress, 1.5));
          canvas.style.opacity = String(fleeFade);
          if (progress < 1) requestAnimationFrame2(runOut);
          else setTimeout2(runIn, FLEE_HIDE_MS);
        };
        requestAnimationFrame2(runOut);
      };
      const WALK_SPEED = 320;
      const walkEase = (progress) => {
        const ramp = 0.12, rampNorm = 2 * ramp * (1 - ramp);
        return progress < ramp ? progress * progress / rampNorm : progress > 1 - ramp ? 1 - (1 - progress) * (1 - progress) / rampNorm : (progress - ramp / 2) / (1 - ramp);
      };
      const walkLater = (fn, ms) => {
        const id = setTimeout2(() => {
          walk.timers = walk.timers.filter((t) => t !== id);
          fn();
        }, ms);
        walk.timers.push(id);
        return id;
      };
      const updateWalkAlpha = (from) => {
        if (!PET) return;
        if (walk.plan && walk.phase === "out") walk.alpha = walkOutAlpha(Math.abs(fleeX - from), walk.plan.run, walk.plan.fade);
        else if (walk.phase === "in" && walk.returnFade > 0) walk.alpha = walkInAlpha(Math.abs(fleeX - from), walk.returnFade);
      };
      const slide = (from, to, done) => {
        let startedAt = performance.now(), started = !(PET && walk.phase === "in");
        const ms = Math.abs(to - from) / WALK_SPEED * 1e3, id = ++walk.slideId;
        let cancelled = false;
        const step = () => {
          if (cancelled || id !== walk.slideId) return;
          if (!started) {
            startedAt = performance.now();
            started = true;
          }
          const progress = ms ? Math.min(1, (performance.now() - startedAt) / ms) : 1;
          const eased = PET && walk.phase === "out" ? walkEasePetOut(progress) : walkEase(progress);
          fleeX = from + (to - from) * eased;
          updateWalkAlpha(from);
          if (progress < 1) requestAnimationFrame2(step);
          else done();
        };
        requestAnimationFrame2(step);
        return () => {
          cancelled = true;
        };
      };
      const clearWalkVisual = () => {
        clearTimeout(walk.recoverTimer);
        walk.recoverTimer = 0;
        walk.plan = null;
        walk.area = null;
        walk.base = null;
        walk.displayId = "";
        walk.displayRequest = 0;
        walk.alpha = 1;
        walk.returnFade = 0;
        walk.safeHold = false;
        walk.faceDir = null;
        walk.recover = null;
        if (walk.opacityApplied) {
          canvas.style.opacity = "";
          walk.opacityApplied = false;
        }
        lastPlaceKey = "";
      };
      const cancelWalk = () => {
        if (walk.phase !== "ready") return;
        for (const t of walk.timers) clearTimeout(t);
        walk.timers = [];
        walk.slideId++;
        walk.phase = "";
        walk.dir = -1;
        clearWalkVisual();
      };
      const startRecoverFade = () => {
        if (walk.phase !== "recover" || !walk.recover) return;
        walk.recover = null;
        clearTimeout(walk.recoverTimer);
        walk.recoverTimer = 0;
        const startedAt = performance.now(), ms = 520;
        const step = () => {
          if (walk.phase !== "recover") return;
          const progress = Math.min(1, (performance.now() - startedAt) / ms);
          walk.alpha = progress * progress * (3 - 2 * progress);
          if (progress < 1) requestAnimationFrame2(step);
          else {
            walk.phase = "";
            walk.alpha = 1;
            walk.opacityApplied = false;
            canvas.style.opacity = "";
            walk.faceDir = null;
            walk.safeHold = true;
            lastPlaceKey = "";
          }
        };
        requestAnimationFrame2(step);
      };
      const confirmRecoverBounds = () => {
        if (walk.phase !== "recover" || !walk.recover || !petBounds) return;
        const target = walk.recover;
        if (Math.abs(petBounds.x - target.x) <= 2 && Math.abs(petBounds.y - target.y) <= 2 && Math.abs(petBounds.width - target.width) <= 2 && Math.abs(petBounds.height - target.height) <= 2) startRecoverFade();
      };
      const recoverWalk = (area2) => {
        if (!PET) return;
        for (const t of walk.timers) clearTimeout(t);
        clearTimeout(walk.recoverTimer);
        walk.timers = [];
        walk.slideId++;
        walk.plan = null;
        walk.base = null;
        walk.returnFade = 0;
        walk.recover = null;
        walk.safeHold = false;
        const baseX = shown.x - fleeX, baseY = shown.y, k = Number.isFinite(shown.k) && shown.k > 0 ? shown.k : free.k || 1;
        fleeX = 0;
        walk.phase = "recover";
        walk.alpha = 0;
        walk.opacityApplied = true;
        canvas.style.opacity = "0";
        lastPlaceKey = "";
        walk.area = walkAreaValid(area2) ? area2 : null;
        if (!walk.area) return;
        const safe = walkSafePose({ area: walk.area, x: baseX, y: baseY, k, canvasW: W, canvasH: H, bodyW: visW * k });
        free.anim = null;
        free.on = true;
        free.x = safe.x;
        free.y = safe.y;
        free.k = safe.k;
        free.applied = true;
        const cx = (innerWidth - W * safe.k) / 2, cy = innerHeight - H * safe.k;
        walk.recover = { x: Math.round(safe.x - cx), y: Math.round(safe.y - cy), width: innerWidth, height: innerHeight };
        try {
          place();
        } catch (error) {
          log.debug("산책 복구 배치 실패:", error);
        }
        walk.recoverTimer = setTimeout2(() => {
          if (walk.phase === "recover") startRecoverFade();
        }, 1200);
      };
      const recordPetDisplay = (display, area2, request) => {
        petDisplay.id = display.id != null ? String(display.id) : "";
        petDisplay.area = area2;
        petDisplay.scaleFactor = Number(display.scaleFactor) || 0;
        petDisplay.at = performance.now();
        const answer = Number.isFinite(request) ? request : display.request;
        if (Number.isFinite(answer)) petDisplay.answered = Math.max(petDisplay.answered, answer);
      };
      const departureDisplay = (list) => list && walk.displayId ? list.find((item) => String(item.id) === walk.displayId) : null;
      const holdSafeArea = (area2, changed, fixedArea) => {
        if (!changed) {
          walk.area = fixedArea || area2;
          return;
        }
        if (fixedArea) {
          if (!sameWalkArea(fixedArea, walk.area)) recoverWalk(fixedArea);
          return;
        }
        walk.displayId = petDisplay.id;
        recoverWalk(area2);
      };
      const followWalkDisplay = (area2, list, fixedArea) => {
        if (fixedArea) {
          if (!sameWalkArea(fixedArea, walk.area)) recoverWalk(fixedArea);
          return;
        }
        const removed = !!list && !!walk.displayId;
        const legacyMoved = !!walk.displayId && petDisplay.id !== walk.displayId;
        if (removed || legacyMoved) {
          walk.displayId = petDisplay.id;
          recoverWalk(area2);
          return;
        }
        if (!sameWalkArea(area2, walk.area)) recoverWalk(area2);
      };
      const walkDisplayChange = (area2, changed, list, fixedArea) => {
        if (walk.phase === "recover") recoverWalk(fixedArea || area2);
        else if (walk.safeHold) holdSafeArea(area2, changed, fixedArea);
        else if (changed && walk.phase && walk.phase !== "ready") followWalkDisplay(area2, list, fixedArea);
      };
      const applyPetDisplay = (display, changed, request, displays) => {
        const area2 = walkDisplayArea(display);
        if (!area2) return;
        recordPetDisplay(display, area2, request);
        if (!PET) return;
        const list = Array.isArray(displays) ? displays : null;
        if (list) petDisplay.displays = list;
        const fixed = departureDisplay(list);
        walkDisplayChange(area2, changed, list, fixed ? walkDisplayArea(fixed) : null);
      };
      const walkBack = () => {
        if (walk.phase !== "away") return;
        for (const t of walk.timers) clearTimeout(t);
        walk.timers = [];
        if (PET) {
          petWalkBack();
          return;
        }
        walk.phase = "in";
        walk.dir = 1;
        slide(outDistance(1), 0, () => {
          fleeX = 0;
          walk.phase = "";
          walkLater(() => {
            if (!walk.phase) speak("walk_back", 3500);
          }, 450);
        });
      };
      const departureDisplayGone = () => {
        const removed = !!(petDisplay.displays && walk.displayId && !departureDisplay(petDisplay.displays));
        const legacyMoved = !petDisplay.displays && !!(walk.displayId && petDisplay.id && petDisplay.id !== walk.displayId);
        return removed || legacyMoved;
      };
      const finishPetWalkBack = () => {
        fleeX = 0;
        walk.phase = "";
        walk.alpha = 1;
        walk.opacityApplied = false;
        canvas.style.opacity = "";
        walk.plan = null;
        walk.area = null;
        walk.base = null;
        walk.displayId = "";
        walk.returnFade = 0;
        walk.faceDir = null;
        lastPlaceKey = "";
        walkLater(() => {
          if (!walk.phase) speak("walk_back", 3500);
        }, 450);
      };
      const petWalkBack = () => {
        const area2 = walkAreaValid(walk.area) ? walk.area : walkAreaValid(petDisplay.area) ? petDisplay.area : null;
        if (!area2 || departureDisplayGone()) {
          recoverWalk(area2);
          return;
        }
        walk.area = area2;
        walk.phase = "in";
        const dir = walk.plan ? walk.plan.dir : walk.dir;
        walk.dir = dir;
        walk.faceDir = dir;
        const k = Number.isFinite(shown.k) && shown.k > 0 ? shown.k : curK;
        const plan = planWalkReturn({ area: area2, dir, x: shown.x - fleeX, k, canvasW: W, bodyW: WALK_BODY_WIDTH * k });
        walk.returnFade = plan.fade;
        walk.alpha = 0;
        walk.opacityApplied = true;
        canvas.style.opacity = "0";
        lastPlaceKey = "";
        fleeX = plan.from;
        try {
          place();
        } catch (error) {
          log.debug("산책 복귀 배치 실패:", error);
        }
        slide(plan.from, 0, finishPetWalkBack);
      };
      const startWalk = () => {
        if (SLEEP.state !== "active") return;
        if (PET && petPanelOpen) return;
        walk.phase = "ready";
        walk.dir = -1;
        walk.faceDir = null;
        walk.plan = null;
        walk.area = null;
        walk.base = null;
        walk.displayId = "";
        walk.alpha = 1;
        walk.returnFade = 0;
        walk.safeHold = false;
        walk.recover = null;
        if (PET) walk.displayRequest = requestPetDisplay() ?? 0;
        speak("walk_out", 2200);
        walkLater(() => {
          walk.phase = "out";
          hush();
          walkLater(() => {
            if (PET) {
              petWalkDepart();
              return;
            }
            walk.out = outDistance(walk.dir);
            slide(0, walk.out, () => {
              walk.phase = "away";
              walkLater(walkBack, 8e3 + Math.random() * 6e3);
            });
          }, 700);
        }, 2300);
      };
      const homeInsideArea = (area2, x, y, k) => {
        const home = walkBodySpan({ x, k, canvasW: W, bodyW: visW * k });
        return home.l >= area2.l - 12 && home.r <= area2.r + 12 && y + H * k * 0.05 >= area2.t - 12 && y + H * k <= area2.b + 12;
      };
      const departureWorkArea = () => {
        const fresh = walk.displayRequest > 0 && petDisplay.answered >= walk.displayRequest && petDisplay.at > 0 && performance.now() - petDisplay.at < 5e3;
        return fresh && walkAreaValid(petDisplay.area) ? petDisplay.area : null;
      };
      const petWalkDepart = () => {
        if (petPanelOpen) {
          walk.phase = "";
          walk.dir = -1;
          clearWalkVisual();
          return;
        }
        const area2 = departureWorkArea();
        if (!area2) {
          walk.phase = "";
          walk.dir = -1;
          clearWalkVisual();
          return;
        }
        const x = shown.x, y = shown.y, k = Number.isFinite(shown.k) && shown.k > 0 ? shown.k : curK;
        if (!homeInsideArea(area2, x, y, k)) {
          recoverWalk(area2);
          return;
        }
        const plan = planWalkOut({ area: area2, x, k, canvasW: W, bodyW: WALK_BODY_WIDTH * k, speed: WALK_SPEED });
        walk.plan = plan;
        walk.area = area2;
        walk.base = { k, x, y };
        walk.displayId = petDisplay.id || "";
        walk.dir = plan.dir;
        walk.out = plan.travel * plan.dir;
        walk.alpha = 1;
        walk.opacityApplied = false;
        lastPlaceKey = "";
        slide(0, walk.out, () => {
          walk.phase = "away";
          walk.alpha = 0;
          walk.opacityApplied = true;
          canvas.style.opacity = "0";
          walkLater(walkBack, 8e3 + Math.random() * 6e3);
        });
      };
      const walkMoodBusy = (now) => intro.phase !== "done" || mood !== "idle" || running || !!waitingKind || behaviors.tagged(TAGS.busy, now) || now < inputLockedUntil || fleeX !== 0;
      const walkInputBusy = () => !!(drag.pending || drag.on || free.anim || link.open || link.opening || link.follow);
      const walkRecentlyActive = (now) => bubble.classList.contains("show") || now - walk.lastTouch < 6e4 || now - lastSayAt < 15e3 || document.hidden;
      walkCheck = (now) => {
        if (SLEEP.state !== "active") return;
        if (walk.phase === "away" && running) return walkBack();
        if (walk.phase || now < walk.next) return;
        walk.next = now + 3e4;
        if (walkMoodBusy(now) || walkInputBusy() || walkRecentlyActive(now)) return;
        walk.next = now + (240 + Math.random() * 240) * 1e3;
        startWalk();
      };
      const SLEEP = { enabled: true, minutes: 1, lastActive: performance.now(), state: "active" };
      let sleepTimer = 0, cancelSleepSlide = null;
      const SLEEP_OFF = () => innerWidth - (canvas.getBoundingClientRect().left - fleeX) + 40;
      const startWake = () => {
        if (SLEEP.state !== "asleep" && SLEEP.state !== "leaving") return;
        clearTimeout(sleepTimer);
        sleepTimer = 0;
        cancelSleepSlide?.();
        cancelSleepSlide = null;
        if (link.open || link.follow?.shown) {
          SLEEP.state = "active";
          fleeX = 0;
          return;
        }
        hush();
        SLEEP.state = "waking";
        setRender(true);
        place();
        slide(fleeX, 0, () => {
          fleeX = 0;
          SLEEP.state = "active";
          SLEEP.lastActive = performance.now();
          if (!running && !waitingKind) speak("sleep_back", 3500);
        });
      };
      const sleepActivity = () => {
        if (hidden) return;
        SLEEP.lastActive = performance.now();
        startWake();
      };
      for (const t of PET ? [] : ["pointerdown", "pointermove", "mousedown", "keydown", "wheel", "touchstart"]) addEventListener(t, sleepActivity, { passive: true, capture: true });
      const sleepGo = () => {
        if (hidden || PET || drag.on || drag.pending || free.anim || SLEEP.state !== "active" || intro.phase !== "done" || fleeX !== 0 || walk.phase) return;
        if (link.open || link.follow?.shown) {
          SLEEP.lastActive = performance.now();
          return;
        }
        SLEEP.state = "leaving";
        speak("sleep_out", 2600);
        sleepTimer = setTimeout2(() => {
          sleepTimer = 0;
          if (SLEEP.state !== "leaving") return;
          hush();
          cancelSleepSlide = slide(fleeX, SLEEP_OFF(), () => {
            cancelSleepSlide = null;
            SLEEP.state = "asleep";
            canvas.style.display = bubble.style.display = "none";
            setRender(false);
          });
        }, 2500);
      };
      const HEAD_SULK_AT = 3;
      const onTouch = (x, y, drawable) => {
        const now = performance.now();
        if (now < inputLockedUntil) return;
        walk.lastTouch = now;
        const region = touchRegion(x, y, drawable);
        behaviors.touched(region, now);
        if (region === "chest" || region === "lower") {
          clicks = [];
          headClicks = [];
          behaviors.dispatch(region === "chest" ? EVENTS.chestTap : EVENTS.lowerTap, { now, x, y });
          return;
        }
        clicks = clicks.filter((t) => now - t < 3e3);
        clicks.push(now);
        if (clicks.length >= 6) {
          clicks = [];
          headClicks = [];
          spamAt = now;
          return speak("spam", 3e3);
        }
        if (running && Math.random() < 0.5) return speak("working");
        if (region === "head") {
          if (now - spamAt < 1e4) {
            spamAt = -1e9;
            return speak("makeup");
          }
          headClicks = headClicks.filter((t) => now - t < 8e3);
          headClicks.push(now);
          if (headClicks.length >= HEAD_SULK_AT && behaviors.dispatch(EVENTS.headRepeat, { now, x, y })) return;
          return speak("head");
        }
        if (region === "arm") return speak("arm");
        if (region === "leg") return speak("leg");
        play("sway", 1600);
        speak("body");
      };
      const POT_MS = 130;
      let swallowClick = false, strokeFrom = null;
      const pointerPoint = (e) => PET ? [e.screenX, e.screenY] : [e.clientX, e.clientY];
      const overBody = (cx, cy) => {
        if (canvas.style.display === "none" || fleeX !== 0) return false;
        const canvasRect = canvas.getBoundingClientRect(), body = bodyRect(canvasRect.left, canvasRect.top, curK);
        return cx >= body.l && cx <= body.r && cy >= body.t && cy <= body.b;
      };
      const walking = () => walk.phase === "out" || walk.phase === "away" || walk.phase === "in";
      const canPullChest = (now) => bodyWeight <= 0.5 && fleeX === 0 && !walk.phase && intro.phase === "done" && !drag.on && !link.opening && !behaviors.tagged(TAGS.busy, now);
      const releaseChest = () => {
        chestFrom = null;
        if (!chestPulling) return;
        chestPulling = false;
        behaviors.dispatch(EVENTS.chestPull, { now: performance.now(), x: 0, y: 0, phase: "end" });
      };
      const armChordGrab = (e, pointerId = e.pointerId) => {
        if (chestPulling) {
          chestPulling = false;
          behaviors.dispatch(EVENTS.chestPull, { now: performance.now(), x: 0, y: 0, phase: "cancel" });
        }
        strokeFrom = null;
        chestFrom = null;
        if (!drag.pending) {
          const [px, py] = pointerPoint(e);
          drag.pending = { id: pointerId, sx: px, sy: py, h: null, ox: px - shown.x, oy: py - shown.y };
        }
        chord.valid = true;
        if (PET) PET.press(true);
        try {
          e.preventDefault();
          e.stopPropagation();
        } catch {
        }
        swallowClick = true;
      };
      const rightStart = (e, id = e.pointerId ?? rightPress?.id) => {
        if (PET && petPanelOpen && petPanel && petPanel.contains(e.target)) return null;
        if (walking()) return null;
        if (intro.phase !== "done" || fleeX !== 0 || link.opening) return null;
        const h = hitAt(e.clientX, e.clientY);
        if (!h && !(PET && overBody(e.clientX, e.clientY))) return null;
        return { at: performance.now(), hit: true, id };
      };
      const chordButtonsMoved = (e, now) => {
        const mask = e.buttons & 3, prev = mouseButtons;
        mouseButtons = mask;
        if (mask !== 3 || prev === 3) return false;
        if (prev === 2) {
          if (!rightPress?.hit) return false;
          armChordGrab(e, rightPress.id ?? e.pointerId);
          return true;
        }
        if (prev === 1) {
          if (!chordWithinGrace(chord, 2, mask, now)) return false;
          armChordGrab(e, drag.pending?.id ?? e.pointerId);
          return true;
        }
        return false;
      };
      const rightButtonDown = (e, nowDown) => {
        if (e.button === 2) {
          rightPress = rightStart(e);
          if ((e.buttons & 3) === 3 && rightPress) armChordGrab(e, e.pointerId);
        }
        if (e.buttons & 1 && chordWithinGrace(chord, e.button, e.buttons, nowDown)) armChordGrab(e);
      };
      const armHeadOrChest = (e, h) => {
        const head = !!h && performance.now() >= inputLockedUntil && touchRegion(h[0], h[1], h[2]) === "head";
        const stroke = head && (behaviors.has(EVENTS.headStrokeFast) || behaviors.has(EVENTS.headStrokeSlow));
        if (stroke) strokeFrom = { x: e.clientX, y: e.clientY, t: performance.now(), h };
        else if (!head && h && behaviors.has(EVENTS.chestPull) && canPullChest(performance.now()) && touchRegion(h[0], h[1], h[2]) === "chest") chestFrom = { x: e.clientX, y: e.clientY, id: e.pointerId, h };
        return stroke;
      };
      const armTouchHold = (e) => {
        clearTimeout(touchHold);
        touchHold = setTimeout2(() => {
          if (!drag.pending || drag.pending.id !== e.pointerId || drag.pending.touchStroke) return;
          drag.pending.touchGrab = true;
          strokeFrom = null;
          chestFrom = null;
          if (PET) PET.press(true);
        }, TOUCH.grabMs);
      };
      const preparePetOnPress = () => {
        if (link.supported && link.petState === "none") link.post("warm");
        else if (!PET && link.petState === "shown" && !link.open && !link.follow) link.post("hide");
      };
      life.listen(document, "pointerdown", (e) => {
        if (hidden) return;
        const nowDown = performance.now();
        mouseButtons = e.buttons & 3;
        chord = chordDown(chord, e.button, e.buttons, nowDown);
        if (e.button !== 0) {
          rightButtonDown(e, nowDown);
          return;
        }
        if (chestFrom) {
          e.preventDefault();
          e.stopPropagation();
          swallowClick = true;
          return;
        }
        swallowClick = false;
        strokeFrom = null;
        if (PET && petPanelOpen && petPanel && petPanel.contains(e.target)) return;
        if (walking()) return;
        const h = hitAt(e.clientX, e.clientY);
        if (!h && !(PET && overBody(e.clientX, e.clientY))) return;
        e.preventDefault();
        e.stopPropagation();
        swallowClick = true;
        const head = armHeadOrChest(e, h);
        if (intro.phase !== "done" || fleeX !== 0 || link.opening) {
          if (h && !head) onTouch(h[0], h[1], h[2]);
          return;
        }
        const [px, py] = pointerPoint(e);
        drag.pending = { id: e.pointerId, sx: px, sy: py, h, ox: px - shown.x, oy: py - shown.y };
        chord.valid = true;
        if (e.pointerType === "touch") armTouchHold(e);
        if (PET) PET.press(true);
        preparePetOnPress();
      }, true);
      life.listen(document, "mousedown", (e) => {
        if (hidden) return;
        const now = performance.now();
        if (e.button === 2) {
          if (!(e.buttons & 1)) rightPress = rightStart(e);
          if (e.buttons & 1 && chordWithinGrace(chord, 2, e.buttons, now)) armChordGrab(e, rightPress?.id ?? e.pointerId);
          return;
        }
        if (e.button !== 0) return;
        if (e.buttons & 2 && rightPress?.hit && Number.isFinite(rightPress.id) && !drag.pending && !drag.on) {
          chord = chordDown(chord, 0, e.buttons, now);
          const [px, py] = pointerPoint(e);
          drag.pending = { id: rightPress.id, sx: px, sy: py, h: null, ox: px - shown.x, oy: py - shown.y };
          chord.valid = true;
          if (PET) PET.press(true);
          try {
            e.preventDefault();
            e.stopPropagation();
          } catch {
          }
          swallowClick = true;
        }
      }, true);
      life.listen(document, "mouseup", (e) => {
        if (e.button === 2) rightPress = null;
      }, true);
      const strokeKind = (stroke, e) => {
        const dy = e.clientY - stroke.y, dx = Math.abs(e.clientX - stroke.x);
        if (performance.now() - stroke.t < POT_MS) return dy > 55 && dy > dx * 1.2 ? "pot" : null;
        return dy > 40 && dy > dx * 0.8 ? "basin" : null;
      };
      const dragKeyRaw = () => String(prefs.drag?.key ?? "Alt").trim();
      const dragKeyToken = () => {
        const text = dragKeyRaw().toLowerCase();
        if (!text || text === "none") return "";
        if (text === "alt" || text === "option") return "alt";
        if (text === "ctrl" || text === "control") return "ctrl";
        if (text === "shift") return "shift";
        if (text === "meta" || text === "cmd" || text === "command" || text === "win" || text === "windows") return "meta";
        return text === "space" ? " " : text === "plus" ? "+" : text;
      };
      const pressedKeys = /* @__PURE__ */ new Set();
      const DRAG_MODIFIER_TOKENS = /* @__PURE__ */ new Set(["alt", "ctrl", "shift", "meta"]);
      const relayDragKey = (token, on) => {
        if (PET || !link.open || !token || DRAG_MODIFIER_TOKENS.has(token)) return;
        if (dragKeyToken() !== token) return;
        try {
          link.post("send", { list: [["dragheld", [token, on]]] });
        } catch {
        }
      };
      const rememberKey = (e, on) => {
        const token = String(e && e.key || "").toLowerCase();
        if (!token) return;
        if (on) pressedKeys.add(token);
        else pressedKeys.delete(token);
        relayDragKey(token, on);
      };
      addEventListener("keydown", (e) => rememberKey(e, true));
      addEventListener("keyup", (e) => rememberKey(e, false));
      addEventListener("blur", () => pressedKeys.clear());
      const dragKeyHeld = (e) => {
        if ((e.buttons & 1) !== 1) return false;
        const token = dragKeyToken();
        if (!token) return false;
        if (token === "alt") return !!e.altKey;
        if (token === "ctrl") return !!e.ctrlKey;
        if (token === "shift") return !!e.shiftKey;
        if (token === "meta") return !!e.metaKey;
        return pressedKeys.has(token);
      };
      const TOUCH = { grabMs: 320, movePx: 14, verticalPx: 8 };
      const touchGesture = ({ dx = 0, dy = 0, heldMs = 0, grabMs = TOUCH.grabMs, movePx = TOUCH.movePx, verticalPx = TOUCH.verticalPx }) => {
        if (Math.hypot(dx, dy) > movePx && Math.abs(dx) > Math.abs(dy) * 1.2) return "grab";
        if (Math.abs(dy) > verticalPx || Math.hypot(dx, dy) > movePx) return "stroke";
        return heldMs >= grabMs ? "grab" : "wait";
      };
      const classifyTouchMove = (e) => {
        if (!(e.pointerType === "touch" && drag.pending && !drag.pending.touchGrab && !drag.pending.touchStroke && e.pointerId === drag.pending.id)) return;
        const dx = e.clientX - drag.pending.sx, dy = e.clientY - drag.pending.sy;
        const gesture = touchGesture({ dx, dy });
        if (gesture === "wait") return;
        clearTimeout(touchHold);
        if (gesture === "grab") drag.pending.touchGrab = true;
        else drag.pending.touchStroke = true;
      };
      const chestMove = (e) => {
        const from = chestFrom, dy = e.clientY - from.y, dx = e.clientX - from.x, now = performance.now();
        if (!chestPulling) {
          if (dy < -12 && Math.abs(dy) > Math.abs(dx) && canPullChest(now)) {
            chestPulling = true;
            drag.pending = null;
            behaviors.dispatch(EVENTS.chestPull, { now, x: from.x, y: from.y, phase: "start", dx, dy });
          } else if (Math.hypot(dx, dy) >= 6 && !(dy < 0 && Math.abs(dy) > Math.abs(dx))) chestFrom = null;
          else {
            e.preventDefault();
            return true;
          }
        } else behaviors.dispatch(EVENTS.chestPull, { now, x: from.x, y: from.y, phase: "move", dx, dy });
        if (!chestPulling) return false;
        e.preventDefault();
        e.stopPropagation();
        swallowClick = true;
        return true;
      };
      const strokeMove = (e) => {
        const stroke = strokeFrom, kind = strokeKind(stroke, e), now = performance.now();
        const key = kind === "pot" ? EVENTS.headStrokeFast : kind === "basin" ? EVENTS.headStrokeSlow : null;
        if (key && behaviors.has(key)) {
          strokeFrom = null;
          if (drag.pending) {
            drag.pending = null;
            if (PET) PET.press(false);
          }
          behaviors.dispatch(key, { now, x: stroke.x, y: stroke.y });
          return true;
        }
        if (now - stroke.t >= POT_MS && !behaviors.has(EVENTS.headStrokeSlow)) {
          strokeFrom = null;
          return false;
        }
        const dy = e.clientY - stroke.y, dx = Math.abs(e.clientX - stroke.x);
        if (!drag.pending || Math.hypot(dx, dy) < 6 || dy > 0 && dy > dx * 0.8) return true;
        strokeFrom = null;
        return false;
      };
      const beginCarry = (e, pending, px, py, now) => {
        cancelWalk();
        drag.on = true;
        drag.touch = e.pointerType === "touch" || !!(pending && pending.touchGrab);
        drag.samples = [];
        free.anim = null;
        free.k = shown.k;
        free.mode = freeMode();
        free.applied = true;
        petDocked = false;
        walk.safeHold = false;
        walk.area = null;
        walk.displayId = "";
        try {
          document.documentElement.setPointerCapture(e.pointerId);
        } catch {
        }
        document.documentElement.classList.add("dsc-grabbing");
        until.sweat = Infinity;
        walk.lastTouch = now;
        if (PET) {
          petGrab = { x: pending.ox, y: pending.oy };
          petTracking = true;
          drag.x = px - pending.ox;
          drag.y = py - pending.oy;
          drag.samples = [[now, px, py]];
          PET.send({ type: "track", on: true, grab: petGrab, off: { x: (innerWidth - W * free.k) / 2, y: innerHeight - H * free.k } });
        }
      };
      const carryMove = (e, pending) => {
        strokeFrom = null;
        chestFrom = null;
        const [px, py] = pointerPoint(e), now = performance.now();
        if (!drag.on) beginCarry(e, pending, px, py, now);
        if (PET && petTracking) {
          e.preventDefault();
          return;
        }
        drag.x = px - pending.ox;
        drag.y = py - pending.oy;
        drag.samples.push([now, px, py]);
        while (drag.samples.length > 2 && now - drag.samples[0][0] > 100) drag.samples.shift();
        const [t0, x0, y0] = drag.samples[0], dt = Math.max(16, now - t0) / 1e3;
        carry.vx += ((px - x0) / dt - carry.vx) * 0.5;
        carry.vy += ((py - y0) / dt - carry.vy) * 0.5;
        if (!PET) followPet(now);
        e.preventDefault();
      };
      const carryHeld = (e) => {
        const touchGrab = !!(drag.pending && drag.pending.touchGrab && e.pointerId === drag.pending.id);
        const both = (e.buttons & 3) === 3 || touchGrab || dragKeyHeld(e);
        return both;
      };
      life.listen(document, "pointermove", (e) => {
        if (hidden) return;
        if (PET && petPanelOpen && petPanel && petPanel.contains(e.target)) return;
        if (e.pointerType !== "touch") chordButtonsMoved(e, performance.now());
        classifyTouchMove(e);
        const both = carryHeld(e);
        if (chestFrom && !both && e.pointerId === chestFrom.id && chestMove(e)) return;
        if (strokeFrom && !both && strokeMove(e)) return;
        const pending = drag.pending;
        if (!pending || e.pointerId !== pending.id) return;
        if (e.buttons === 0) return endDrag(e, false);
        if (!both) {
          if (drag.on) endDrag(e, false);
          return;
        }
        carryMove(e, pending);
      }, true);
      const followPet = (now) => {
        if (!link.supported || link.open) return;
        const k = free.k;
        const out = bodyOut({ k, x: drag.x, y: drag.y });
        const screenPos = screenOf(drag.x, drag.y), pose2 = { k, x: screenPos.x, y: screenPos.y };
        if (!link.follow) {
          if (!out) return;
          if (link.petState !== "hidden") {
            if (now - link.peek > 250) {
              link.peek = now;
              if (link.petState === "none") link.post("warm");
              else link.poll();
            }
            return;
          }
          link.follow = { shown: false };
          link.last = "";
          link.post("open", { from: pose2, to: pose2, follow: true, grab: { x: drag.pending?.ox ?? 0, y: drag.pending?.oy ?? 0 }, seq: ++link.seq });
        }
      };
      const finishFollow = (vx, vy) => {
        const follow = link.follow;
        link.follow = null;
        link.queue = [];
        lastPlaceKey = "";
        const outside = bodyOut({ k: free.k, x: drag.x + vx * GLIDE, y: drag.y + vy * GLIDE }, !follow.shown);
        if (outside && follow.shown) {
          link.post("send", { list: [["release", [vx, vy]]] });
          link.enter();
          return true;
        }
        if (!outside) link.post("hide");
        return false;
      };
      const endDrag = (e, cancel) => {
        const pending = drag.pending;
        if (!pending || e.pointerId !== pending.id) return;
        clearTimeout(touchHold);
        drag.pending = null;
        strokeFrom = null;
        if (PET) PET.press(false);
        if (!drag.on) {
          if (!cancel && pending.h) onTouch(pending.h[0], pending.h[1], pending.h[2]);
          return;
        }
        drag.on = false;
        if (PET && petTracking) {
          petTracking = false;
          petGrab = null;
          PET.send({ type: "track", on: false });
        }
        try {
          document.documentElement.releasePointerCapture(e.pointerId);
        } catch {
        }
        document.documentElement.classList.remove("dsc-grabbing");
        until.sweat = performance.now() + 400;
        const moving = performance.now() - drag.samples[drag.samples.length - 1][0] < 80;
        const vx = moving ? carry.vx : 0, vy = moving ? carry.vy : 0;
        if (link.follow && finishFollow(vx, vy)) return;
        release(vx, vy, drag.touch);
      };
      life.listen(document, "pointerup", (e) => {
        if (hidden) return;
        mouseButtons = e.buttons & 3;
        chord = chordUp(chord, e.buttons);
        if (chestFrom && e.pointerId === chestFrom.id) {
          const dragged = chestPulling;
          releaseChest();
          if (dragged) {
            if (PET) PET.press(false);
            return;
          }
        }
        const stroke = strokeFrom;
        strokeFrom = null;
        if (drag.pending) return endDrag(e, false);
        if (stroke) onTouch(stroke.h[0], stroke.h[1], stroke.h[2]);
      }, true);
      addEventListener("blur", () => {
        mouseButtons = 0;
        chord = chordUp(chord, 0);
        rightPress = null;
        releaseChest();
        if (drag.pending) endDrag({ pointerId: drag.pending.id }, !drag.on);
      });
      life.listen(document, "pointercancel", (e) => {
        mouseButtons = 0;
        chord = chordUp(chord, e.buttons);
        rightPress = null;
        if (chestFrom && e.pointerId === chestFrom.id) {
          const wasDragging = chestPulling;
          releaseChest();
          if (wasDragging && PET) PET.press(false);
        }
        endDrag(e, true);
      }, true);
      for (const type of ["pointerup", "mousedown", "mouseup", "click", "dblclick"]) {
        life.listen(document, type, (e) => {
          if (!swallowClick) return;
          e.preventDefault();
          e.stopPropagation();
          if (type === "click" || type === "dblclick") setTimeout2(() => {
            if (!chestFrom) swallowClick = false;
          }, 0);
        }, true);
      }
      let hoverCheck = 0;
      life.listen(document, "mousemove", (e) => {
        if (hidden) return;
        const now = performance.now();
        if (now - hoverCheck < 80) return;
        hoverCheck = now;
        if (PET && petPanelOpen && petPanel && petPanel.contains(e.target)) {
          document.documentElement.classList.remove("dsc-hover");
          return;
        }
        const over = !walking() && !!hitAt(e.clientX, e.clientY);
        document.documentElement.classList.toggle("dsc-hover", over);
      }, { passive: true });
      life.listen(document, "contextmenu", (e) => {
        if (hidden) return;
        if (drag.pending || drag.on) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        if (!PET) {
          if (coarsePointer() && overBody(e.clientX, e.clientY)) {
            e.preventDefault();
            e.stopPropagation();
          }
          return;
        }
        e.preventDefault();
        if (!petPanelOpen && !walking() && overBody(e.clientX, e.clientY)) PET.menu();
      }, true);
      const touchOnBody = (e) => {
        const t = e.touches && e.touches[0];
        return !!t && !PET && hitAt(t.clientX, t.clientY) !== null;
      };
      life.listen(document, "touchstart", (e) => {
        if (touchOnBody(e)) e.preventDefault();
      }, { passive: false, capture: true });
      life.listen(document, "touchmove", (e) => {
        if (drag.on || drag.pending) e.preventDefault();
      }, { passive: false, capture: true });
      const wheelResizes = (e) => (PET || !coarsePointer()) && free.applied && intro.phase === "done" && free.on && overBody(e.clientX, e.clientY);
      life.listen(document, "wheel", (e) => {
        if (hidden) return;
        if (PET && petPanelOpen && petPanel && petPanel.contains(e.target)) return;
        if (!wheelResizes(e)) return;
        e.preventDefault();
        e.stopPropagation();
        if (drag.on || free.anim || walk.phase || fleeX !== 0) return;
        const kMin = PET ? PET_K_MIN : SHOW_K, kMax = PET ? PET_K_MAX : Math.min(1.25, innerHeight * 0.45 / visH);
        const fromK = Math.min(free.k, kMax), k = Math.min(kMax, Math.max(kMin, fromK * Math.exp(-e.deltaY * 12e-4)));
        if (k === fromK) return;
        if (PET) {
          free.x += W * (fromK - k) / 2;
          free.y += H * (fromK - k);
        }
        free.k = k;
        if (!PET) saveFree(false);
        else {
          petRememberRatio(petRatio());
          petSyncMenu();
          renderPetPanel();
        }
      }, { capture: true, passive: false });
      const PET_OUTFIT_ROWS = OUTFIT_ITEMS.map((item) => [item.key, item.ko]);
      const PET_BODY_ROWS = BODY_TYPES.map((body) => [body.key, body.ko]);
      function petKFit() {
        return Math.min(PET_K_MAX, (screen.availHeight - PET_BUBBLE) / H, (screen.availWidth - 40) / W);
      }
      function petClampK(k) {
        const n = Number(k);
        return Number.isFinite(n) ? Math.min(petKFit(), Math.max(PET_K_MIN, n)) : null;
      }
      function petRatio() {
        return petBaseK > 0 ? free.k / petBaseK : 1;
      }
      function petRatioBounds() {
        const minR = Math.max(0.05, PET_K_MIN / petBaseK);
        return { minR, maxR: Math.max(minR + 0.01, petKFit() / petBaseK) };
      }
      function petLoadRatio() {
        if (!PET) return 1;
        try {
          const n = parseFloat(localStorage.getItem(PET_SIZE_KEY) || "");
          return Number.isFinite(n) && n >= 0.1 && n <= 8 ? n : 1;
        } catch {
          return 1;
        }
      }
      function petRememberRatio(ratio) {
        if (!PET || !Number.isFinite(ratio) || ratio <= 0) return;
        clearTimeout(petSizeTimer);
        petSizeTimer = setTimeout2(() => {
          try {
            localStorage.setItem(PET_SIZE_KEY, String(+ratio.toFixed(3)));
          } catch {
          }
        }, 250);
      }
      function petSizedPose(pose2, fromK, ratio) {
        if (ratio == null) return pose2;
        const k = petClampK(petBaseK * ratio);
        if (k == null || Math.abs(k - fromK) < 1e-3) return pose2;
        return { k, x: pose2.x + W * (fromK - k) / 2, y: pose2.y + H * (fromK - k) };
      }
      function petSyncMenu() {
        if (!PET) return;
        const outfit = prefs.outfit || {};
        const sig = JSON.stringify([+petRatio().toFixed(3), outfit]);
        if (sig === petMenuSig) return;
        petMenuSig = sig;
        PET.send({ type: "state", value: { size: +petRatio().toFixed(3), outfit } });
      }
      function petPanelBox(body) {
        if (!PET || !petPanelOpen || !petPanel) return body;
        const rect = petPanel.getBoundingClientRect();
        const box = { l: Math.round(rect.left), t: Math.round(rect.top), r: Math.round(rect.right), b: Math.round(rect.bottom) };
        return body ? { l: Math.min(body.l, box.l), t: Math.min(body.t, box.t), r: Math.max(body.r, box.r), b: Math.max(body.b, box.b) } : box;
      }
      function petSetRatio(ratio, ms) {
        const k = petClampK(petBaseK * ratio);
        if (k == null || drag.on) return;
        const from = free.on && shown.k ? { k: shown.k, x: shown.x, y: shown.y } : { k: free.k, x: free.x, y: free.y };
        if (Math.abs(k - from.k) >= 1e-3) {
          const x = from.x + W * (from.k - k) / 2, y = from.y + H * (from.k - k);
          if (free.on) {
            if (ms > 0) free.anim = { t0: performance.now(), ms, from, to: { k, x, y }, snap: false };
            else {
              free.anim = null;
              free.x = x;
              free.y = y;
              free.k = k;
            }
          } else free.k = k;
        }
        petRememberRatio(k / petBaseK);
        petSyncMenu();
        renderPetPanel();
      }
      function renderPetPanel() {
        if (!petPanel) return;
        const { minR, maxR } = petRatioBounds();
        const minPercent = Math.max(5, Math.ceil(minR * 100)), maxPercent = Math.max(minPercent + 1, Math.floor(maxR * 100));
        const percent = Math.min(maxPercent, Math.max(minPercent, Math.round(petRatio() * 100)));
        const slider = petPanel.querySelector("[data-size-slider]");
        if (slider) {
          if (slider.min !== String(minPercent)) slider.min = String(minPercent);
          if (slider.max !== String(maxPercent)) slider.max = String(maxPercent);
          if (slider.value !== String(percent)) slider.value = String(percent);
        }
        const out = petPanel.querySelector("[data-size-value]");
        if (out) out.textContent = percent + "%";
        const outfit = prefs.outfit || {};
        for (const input of petPanel.querySelectorAll("[data-outfit]")) input.checked = outfit[input.dataset.outfit] === true;
        const body = outfit.bodyType || "default";
        for (const input of petPanel.querySelectorAll("[data-body]")) input.checked = input.value === body;
      }
      function createPetPanel() {
        const root = life.own(document.createElement("div"), (node) => node.remove());
        root.id = "dsc-pet-panel";
        root.setAttribute("role", "dialog");
        root.setAttribute("aria-label", "캐릭터 설정");
        root.innerHTML = [
          '<div class="dsc-panel-head"><strong>설정</strong><button type="button" class="dsc-panel-close" data-close aria-label="닫기">×</button></div>',
          '<section class="dsc-panel-section"><div class="dsc-panel-row"><span>크기 <small>기본 대비</small></span><output data-size-value>100%</output></div>',
          '<input type="range" min="50" max="200" step="1" data-size-slider aria-label="캐릭터 크기"></section>',
          '<section class="dsc-panel-section"><div class="dsc-panel-sub">소품·옷</div>',
          ...PET_OUTFIT_ROWS.map(([key, label]) => `<label class="dsc-panel-check"><input type="checkbox" data-outfit="${key}"> ${label}</label>`),
          "</section>",
          '<section class="dsc-panel-section"><div class="dsc-panel-sub">체형</div>',
          ...PET_BODY_ROWS.map(([value, label]) => `<label class="dsc-panel-check"><input type="radio" name="dsc-pet-body" value="${value}" data-body> ${label}</label>`),
          "</section>",
          '<section class="dsc-panel-section dsc-panel-actions"><button type="button" data-hide>캐릭터 잠시 숨기기</button></section>'
        ].join("");
        document.body.append(root);
        root.addEventListener("click", (e) => {
          if (e.target.closest("[data-close]")) closePetPanel();
        });
        const slider = root.querySelector("[data-size-slider]");
        slider.addEventListener("input", () => petSetRatio(Number(slider.value) / 100, 0));
        for (const input of root.querySelectorAll("[data-outfit]")) input.addEventListener("change", () => PET.send({ type: "config", list: [[input.dataset.outfit, input.checked]] }));
        for (const input of root.querySelectorAll("[data-body]")) input.addEventListener("change", () => {
          if (input.checked) PET.send({ type: "config", list: [["bodyType", input.value]] });
        });
        root.querySelector("[data-hide]").addEventListener("click", () => {
          closePetPanel();
          PET.send({ type: "config", list: [["character", false]] });
        });
        return root;
      }
      function fitPetPanel() {
        if (!petPanel) return;
        const rect = petPanel.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const left = Math.max(0, screen.availLeft - screenX), top = Math.max(0, screen.availTop - screenY);
        const right = Math.min(innerWidth, screen.availLeft + screen.availWidth - screenX);
        const bottom = Math.min(innerHeight, screen.availTop + screen.availHeight - screenY);
        const x = Math.max(left + 4, Math.min(right - rect.width - 4, (left + right - rect.width) / 2));
        const y = Math.max(top + 4, Math.min(bottom - rect.height - 4, (top + bottom - rect.height) / 2));
        petPanel.style.left = Math.round(x) + "px";
        petPanel.style.top = Math.round(y) + "px";
        petPanel.style.transform = "none";
      }
      function openPetPanel(focus) {
        if (!PET) return;
        if (!petPanel) petPanel = createPetPanel();
        renderPetPanel();
        petPanel.classList.add("show");
        petPanelOpen = true;
        const room = Number(screen?.availHeight) > 0 ? Math.round(screen.availHeight - 48) : 560;
        petPanel.style.maxHeight = Math.max(260, Math.min(560, room)) + "px";
        petPanelWin = { w: innerWidth, h: innerHeight };
        fitPetPanel();
        const slider = focus === "size" && petPanel.querySelector("[data-size-slider]");
        if (slider) slider.focus({ preventScroll: true });
        petSyncMenu();
      }
      function closePetPanel() {
        if (!petPanel) return;
        petPanelOpen = false;
        petPanelWin = { w: 0, h: 0 };
        petPanel.classList.remove("show");
      }
      listeners.tool = (text) => {
        const now = performance.now();
        if (waitingKind || now - lastToolSay < 1500) return;
        lastToolSay = now;
        say(text, 0, false, "status");
      };
      let lastThought = "", lastMutterAt = 0;
      const mutterCheck = () => {
        const raw = readThought(document);
        if (!raw || raw === lastThought) return;
        lastThought = raw;
        const now = performance.now();
        if (now - lastMutterAt < 6e3 || now - lastSayAt < 2500) return;
        const line = thoughtLine(raw);
        if (!line) return;
        lastMutterAt = now;
        say(line, Math.min(5200, Math.max(3800, 1500 + line.length * 55)), true);
        if (Math.random() < 0.35) play("tilt", 1600);
      };
      if (!PET) setTimeout2(() => {
        if (!link.open) {
          say(TEXT.hello, 5800, false, "reaction");
          play("sway", 2300);
        }
      }, 700);
      if (life.stopped) return;
      window.__dsc = {
        // 확인용
        say,
        play,
        setMood,
        flashExp,
        /** 삐침 중 여부 */
        sulking: () => behaviors.tagged(SULKING, performance.now()),
        /** 산책 시작(산책·도망 중이 아니면) 후 산책 단계 */
        walk: () => {
          if (!walk.phase && fleeX === 0) startWalk();
          return walk.phase;
        },
        /** 지금 산책 단계 */
        walking: () => walk.phase,
        /** 절전 상태 */
        sleep: () => SLEEP.state,
        /** 창 좌표 자리의 몸 부위 이름, 그림 밖이면 null */
        regionAt: (cx, cy) => {
          const h = hitAt(cx, cy);
          return h && touchRegion(h[0], h[1], h[2]);
        },
        /** 도망·산책으로 옆으로 비켜난 거리(px, + 오른쪽 · - 왼쪽) */
        fleeX: () => fleeX,
        /** 보이는 말풍선 문구, 없으면 빈 문자열 */
        bubble: () => bubble.classList.contains("show") ? bubble.textContent : "",
        lines: TEXT,
        /** 외부 음성 상태 설정. speaking이 false거나 null이면 해제 */
        voice: (state) => {
          voiceState = state && state.speaking !== false ? state : null;
        }
      };
      const petLinkEnter = () => {
        skipIntro();
        free.anim = null;
        drag.pending = null;
        drag.on = false;
        setRender(false);
      };
      const petLinkLeave = () => {
        wakeRaf();
        SLEEP.state = "active";
        SLEEP.lastActive = performance.now();
        free.on = false;
        free.anim = null;
        saveFree();
        lastPlaceKey = "";
        if (!hidden) setRender(true);
      };
      const petLinkSnapshot = () => {
        const left = moodUntil ? Math.max(1, moodUntil - performance.now()) : 0;
        const list = [...Object.keys(hold).map((name2) => ["setExp", [name2, !!hold[name2]]]), ["setMood", [mood, left]]];
        if (!bubble.classList.contains("show")) list.push(["hush", []]);
        return list;
      };
      const petLinkDragMessages = () => {
        const list = [["drag", [dragKeyRaw()]]];
        const dragToken = dragKeyToken();
        if (dragToken && !DRAG_MODIFIER_TOKENS.has(dragToken)) list.push(["dragheld", [dragToken, pressedKeys.has(dragToken)]]);
        return list;
      };
      const petLinkDock = () => {
        const dockSpot = dockTarget(homePose()), dockSpotScreen = screenOf(dockSpot.x - fleeX, dockSpot.y);
        const petK = dockSpot.k * PET_HEAD_RATIO;
        const bustCenterX = dockSpotScreen.x + W * dockSpot.k / 2;
        const waistY = dockSpotScreen.y + dockSpot.k * WAIST_WIN;
        const topLeft = screenOf(0, 0), bottomRight = screenOf(innerWidth, innerHeight);
        const dock = {
          k: +petK.toFixed(3),
          x: Math.round(bustCenterX - petK * (W / 2 + petBustOffset)),
          y: Math.round(waistY - petK * WAIST_PET),
          win: { l: Math.round(topLeft.x), t: Math.round(topLeft.y), r: Math.round(bottomRight.x), b: Math.round(bottomRight.y) }
        };
        return { dock, outfit: prefs.outfit || {}, avatar: AVATAR ? { browScale: prefs.avatar?.browScale, browSmooth: prefs.avatar?.browSmooth } : void 0 };
      };
      const petOpenScreenPose = () => {
        const pose2 = SLEEP.state === "active" && shown.k > 0 ? { k: shown.k, x: shown.x, y: shown.y } : dockTarget(homePose());
        const screenPos = screenOf(pose2.x, pose2.y);
        return { k: pose2.k, x: screenPos.x, y: screenPos.y };
      };
      link.start();
      if (!PET) hooks.togglePet = link.toggle;
      if (PET) {
        const local = { say, play, setMood, flashExp, setExp, hush };
        const onPetCursor = (message) => {
          if (!drag.on || !petGrab) return;
          const now = performance.now();
          drag.x = message.x - petGrab.x;
          drag.y = message.y - petGrab.y;
          drag.samples.push([now, message.x, message.y]);
          while (drag.samples.length > 2 && now - drag.samples[0][0] > 100) drag.samples.shift();
          const [t0, x0, y0] = drag.samples[0], dt = Math.max(16, now - t0) / 1e3;
          carry.vx += ((message.x - x0) / dt - carry.vx) * 0.5;
          carry.vy += ((message.y - y0) / dt - carry.vy) * 0.5;
        };
        const onPetPower = (message) => {
          if (!message.on) {
            petTracking = false;
            petGrab = null;
            closePetPanel();
            for (const t of walk.timers) clearTimeout(t);
            walk.timers = [];
            walk.slideId++;
            walk.phase = "";
            walk.dir = -1;
            fleeX = 0;
            clearWalkVisual();
          }
          petPower = !!message.on;
          setRender(petPower);
          if (petPower) wakeRaf();
          if (petPower) requestPetDisplay();
        };
        const onPetBounds = (message) => {
          const bounds = message.bounds;
          if (bounds && [bounds.x, bounds.y, bounds.width, bounds.height].every((value) => Number.isFinite(value))) petBounds = { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height, at: performance.now() };
          confirmRecoverBounds();
        };
        const onPetOpen = (message) => {
          petPower = true;
          setRender(true);
          wakeRaf();
          for (const t of walk.timers) clearTimeout(t);
          walk.timers = [];
          walk.slideId++;
          walk.phase = "";
          fleeX = 0;
          clearWalkVisual();
          petBounds = null;
          drag.pending = null;
          PET.press(false);
          closePetPanel();
          petDocked = false;
          free.on = true;
          Object.assign(free, message.from);
          petGrab = message.follow ? message.grab || { x: 0, y: 0 } : null;
          petTracking = !!message.follow;
          const kFrom = Number(message.from.k) || 1;
          const kBase = Math.min(petKFit(), Math.max(PET_K_MIN, kFrom * HEAD_GAIN));
          petBaseK = kBase;
          const ratio = petLoadRatio();
          petPendingRatio = message.follow ? ratio : null;
          const kApply = message.follow ? kBase : petClampK(kBase * ratio);
          if (kApply !== kFrom) {
            const kDelta = kFrom - kApply;
            free.x += W * kDelta / 2;
            free.y += H * kDelta;
            free.k = kApply;
            if (petGrab) petGrab = { x: petGrab.x * kApply / kFrom, y: petGrab.y * kApply / kFrom };
          }
          const pose2 = { k: free.k, x: free.x, y: free.y }, to = { k: kApply, x: message.to.x + W * (kFrom - kApply) / 2, y: message.to.y + H * (kFrom - kApply) };
          PET.send({ type: "track", on: !!message.follow, grab: petGrab, off: { x: (innerWidth - W * pose2.k) / 2, y: innerHeight - H * pose2.k } });
          drag.on = !!message.follow;
          drag.x = pose2.x;
          drag.y = pose2.y;
          drag.samples = [[performance.now(), pose2.x + (petGrab?.x ?? 0), pose2.y + (petGrab?.y ?? 0)]];
          free.anim = message.follow ? null : { t0: performance.now(), ms: 300, from: pose2, to: keepIn(to), snap: false };
          until.sweat = message.follow ? Infinity : 0;
          movePet(pose2);
          PET.send({ type: "placed" });
          requestPetDisplay({ x: pose2.x + W * pose2.k / 2, y: pose2.y + H * pose2.k * 0.5 });
          petSyncMenu();
        };
        const onPetHome = () => {
          closePetPanel();
          if (petDock) free.anim = { t0: performance.now(), ms: 650, from: { ...shown }, to: null, snap: true };
          else PET.send({ type: "attach" });
        };
        const releaseFromHost = (vx, vy) => {
          petGrab = null;
          petTracking = false;
          PET.send({ type: "track", on: false });
          drag.on = false;
          until.sweat = performance.now() + 400;
          release(vx, vy);
        };
        const PET_COMMANDS = {
          /** 소품·옷 설정 반영 */
          outfit: (args) => {
            prefs.outfit = args[0];
            renderPetPanel();
            petSyncMenu();
          },
          /** 3D 모델 조절값(눈썹 세기·부드러움) 반영. 모델 사용 여부·외곽선은 시작 설정 그대로 */
          avatar: (args) => {
            const value = args[0];
            if (value && typeof value === "object") prefs.avatar = { ...prefs.avatar, browScale: value.browScale, browSmooth: value.browSmooth };
          },
          /** 붙을 자리 갱신 */
          dock: (args) => {
            petDock = args[0];
          },
          /** 외부 음성 상태 반영 */
          voice: (args) => {
            voiceState = args[0];
          },
          /** 창 안 캐릭터와 같은 이동 키 설정 */
          drag: (args) => {
            prefs.drag = { key: args[0] };
          },
          /** 포커스 없는 펫 창에 일반 이동 키의 눌림 상태 전달 */
          dragheld: (args) => {
            if (args[1]) pressedKeys.add(args[0]);
            else pressedKeys.delete(args[0]);
          },
          /** 창 안 캐릭터가 창 밖에서 놓음(던질 속도 vx·vy) */
          release: (args) => {
            if (drag.on) releaseFromHost(args[0], args[1]);
          }
        };
        const onPetCommands = (message) => {
          for (const [fn, args] of message.list || []) {
            if (Object.hasOwn(PET_COMMANDS, fn)) PET_COMMANDS[fn](args);
            else if (Object.hasOwn(local, fn) && Array.isArray(args)) local[fn](...args);
          }
        };
        const PET_MESSAGES = {
          cursor: onPetCursor,
          power: onPetPower,
          /** pet/main.cjs: 현재 표시장치 DIP workArea (산책 출발 시 고정). request·displays는 top-level로 옴 */
          display: (message) => applyPetDisplay(message.display, !!message.changed, message.request, message.displays),
          bounds: onPetBounds,
          /** 우클릭 메뉴: 설정(또는 크기) 패널 열기 */
          panel: (message) => openPetPanel(message.focus),
          /** 우클릭 메뉴: 정해진 배율로 (기본 대비) */
          size: (message) => petSetRatio(Number(message.ratio), 220),
          open: onPetOpen,
          home: onPetHome,
          cmd: onPetCommands
        };
        PET.on((message) => {
          if (Object.hasOwn(PET_MESSAGES, message.type)) PET_MESSAGES[message.type](message);
        });
        petPower = false;
        setRender(false);
        PET.send({ type: "ready" });
        requestPetDisplay();
      }
      const readSleepPrefs = () => {
        const sleepPrefs = prefs.sleep || {};
        SLEEP.enabled = !PET && sleepPrefs.enabled !== false;
        const minutes = Number(sleepPrefs.minutes);
        SLEEP.minutes = Number.isFinite(minutes) ? Math.min(60, Math.max(0.5, minutes)) : 1;
      };
      const reactToWaiting = (kind) => {
        if (kind === waitingKind) return;
        waitingKind = kind;
        setExp("sweat", kind === "approval");
        setExp("squint", kind === "question");
        if (kind) {
          say(TEXT[kind], 0, false, "reaction");
          setMood("wait");
          play("tilt", 1800);
        } else {
          setMood(running ? "work" : "idle");
          if (running) hush();
        }
      };
      const reactToFinish = () => {
        if (running) return;
        if (performance.now() - lastError < 8e3) {
          flashExp("tears", 5e3);
          flashExp("dizzy", 2500);
          say(TEXT.error, 5e3, false, "reaction");
          setMood("sad", 5e3);
          play("droop", 2e3);
        } else {
          flashExp("heart", 4e3);
          flashExp("blush", 4e3);
          say(TEXT.done, 4e3, false, "reaction");
          setMood("idle");
          play("laugh", 1700);
        }
      };
      const reactToRunning = (nowRunning) => {
        if (nowRunning && !running) {
          running = true;
          lastError = -1e9;
          setExp("loading", true);
          if (!waitingKind) {
            say(TEXT.start, 2500, false, "reaction");
            setMood("work");
            play("nod", 1300);
          }
        } else if (!nowRunning && running) {
          running = false;
          setExp("loading", false);
          setTimeout2(reactToFinish, 600);
        }
      };
      const sleepDue = () => SLEEP.enabled && SLEEP.state === "active" && !running && !waitingKind && !document.hidden && performance.now() - SLEEP.lastActive > SLEEP.minutes * 6e4 && performance.now() - lastSayAt > 5e3 && !bubble.classList.contains("show");
      if (!PET) setInterval2(() => {
        const { running: nowRunning, waiting: kind } = readStatus(document);
        readSleepPrefs();
        if (nowRunning || kind || !SLEEP.enabled) sleepActivity();
        if (SLEEP.state === "asleep") return;
        if (nowRunning && !waitingKind && !kind) mutterCheck();
        reactToWaiting(kind);
        reactToRunning(nowRunning);
        if (sleepDue()) sleepGo();
      }, 400);
    })().catch((e) => console.warn("DeepSeek짱 캐릭터 로드 실패:", e));
  });
  return {
    /** 플러그인 설정 변경 반영. 패널 숨김(pageHidden)이 바뀌면 바로 숨김/복구 */
    setPrefs(next) {
      const pageChanged = "pageHidden" in next && next.pageHidden !== prefs.pageHidden;
      Object.assign(prefs, next);
      if (pageChanged) hooks.syncPageHidden?.();
      if ("extra" in next) {
        if (next.extra?.enabled && !extraLoaded) void loadExtra();
        else if (!next.extra?.enabled && extraLoaded) restoreBase();
      }
    },
    /** 펫 창 토글 함수. 모델이 준비되기 전에는 null (단축키는 이때 키 입력을 가로채지 않음) */
    get togglePet() {
      return hooks.togglePet || null;
    },
    /** 창 안 캐릭터 숨기기·보이기 토글 함수. 모델이 준비되기 전과 펫 창에서는 null */
    get toggleCanvas() {
      return hooks.toggleCanvas || null;
    },
    /** 창 안 캐릭터 숨김 여부 */
    canvasHidden: () => hooks.canvasHidden?.() === true
  };
}

// character/lifetime.ts
function createLifetime() {
  let stopped = false;
  const cleanups = [];
  const timers = /* @__PURE__ */ new Set(), intervals = /* @__PURE__ */ new Set(), frames = /* @__PURE__ */ new Set();
  const add = (cleanup) => {
    if (stopped) cleanup();
    else cleanups.push(cleanup);
  };
  const timeout = (fn, ms, ...args) => {
    if (stopped) return 0;
    const id = window.setTimeout(() => {
      timers.delete(id);
      if (!stopped) fn(...args);
    }, ms);
    timers.add(id);
    return id;
  };
  const interval = (fn, ms, ...args) => {
    if (stopped) return 0;
    const id = window.setInterval(() => {
      if (!stopped) fn(...args);
    }, ms);
    intervals.add(id);
    return id;
  };
  const frame = (fn) => {
    if (stopped) return 0;
    const id = window.requestAnimationFrame((time) => {
      frames.delete(id);
      if (!stopped) fn(time);
    });
    frames.add(id);
    return id;
  };
  const listen = (target, type, fn, options) => {
    if (stopped) return;
    target.addEventListener(type, fn, options);
    add(() => target.removeEventListener(type, fn, options));
  };
  const observe = (fn) => {
    const observer = new window.MutationObserver((...args) => {
      if (!stopped) fn(...args);
    });
    add(() => observer.disconnect());
    return observer;
  };
  const own = (value, cleanup) => {
    add(() => cleanup(value));
    return value;
  };
  return {
    add,
    timeout,
    interval,
    frame,
    listen,
    observe,
    own,
    /** 정리 여부 */
    get stopped() {
      return stopped;
    },
    /** 타이머·프레임 취소 뒤 정리 함수를 등록 역순으로 실행 (한 번만, 실패는 경고만) */
    dispose() {
      if (stopped) return;
      stopped = true;
      for (const id of timers) window.clearTimeout(id);
      for (const id of intervals) window.clearInterval(id);
      for (const id of frames) window.cancelAnimationFrame(id);
      for (const cleanup of cleanups.reverse()) {
        try {
          cleanup();
        } catch (error) {
          console.warn("DeepSeek짱 cleanup:", error);
        }
      }
    }
  };
}

// plugins/dsh-tts/src/client/core.js
function pcm16ToFloat32(int16) {
  const out = new Float32Array(int16.length);
  for (let index = 0; index < int16.length; index += 1) out[index] = int16[index] / 32768;
  return out;
}
function carryOddByte(prev, chunk) {
  const head = prev instanceof Uint8Array ? prev : new Uint8Array(0);
  const tail = chunk instanceof Uint8Array ? chunk : new Uint8Array(chunk);
  let bytes = tail;
  if (head.length > 0) {
    bytes = new Uint8Array(head.length + tail.length);
    bytes.set(head, 0);
    bytes.set(tail, head.length);
  }
  const usable = bytes.length - bytes.length % 2;
  const aligned = new Int16Array(usable / 2);
  const view = new DataView(bytes.buffer, bytes.byteOffset, usable);
  for (let index = 0; index < aligned.length; index += 1) aligned[index] = view.getInt16(index * 2, true);
  return { aligned, rest: bytes.subarray(usable) };
}
var ChunkScheduler = class {
  constructor({ audioContext, destination, lead = 0.06 } = {}) {
    this.audioContext = audioContext;
    this.destination = destination;
    this.lead = lead;
    this.sources = /* @__PURE__ */ new Set();
    this.nextStart = 0;
    this.stopped = false;
    this.ended = false;
    this.onIdle = null;
  }
  /** Schedule whole PCM16 samples at sampleRate; returns their start time. */
  add(int16, sampleRate) {
    if (this.stopped || int16.length === 0) return null;
    const buffer = this.audioContext.createBuffer(1, int16.length, sampleRate);
    buffer.getChannelData(0).set(pcm16ToFloat32(int16));
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.destination);
    const startAt = Math.max(this.nextStart, this.audioContext.currentTime + this.lead);
    source.start(startAt);
    this.nextStart = startAt + buffer.duration;
    this.sources.add(source);
    source.onended = () => {
      this.sources.delete(source);
      if (this.ended && this.sources.size === 0) this.onIdle?.();
    };
    return startAt;
  }
  /** Mark the stream ended; returns the time the last queued sample ends. */
  finish() {
    this.ended = true;
    if (this.sources.size === 0) this.onIdle?.();
    return this.nextStart;
  }
  /** Stop and forget every queued buffer (barge-in or teardown). */
  stop() {
    this.stopped = true;
    for (const source of this.sources) {
      try {
        source.stop();
      } catch {
      }
      try {
        source.disconnect();
      } catch {
      }
    }
    this.sources.clear();
    this.nextStart = 0;
  }
  /** Audio-clock time at which the last scheduled sample ends. */
  get endTime() {
    return this.nextStart;
  }
  /** True while at least one scheduled buffer has not played out. */
  get active() {
    return this.sources.size > 0;
  }
};

// plugins/dsh-tts/src/client/index.js
var STATE_ROUTE = "/dsh-tts/state";
var SPEAK_ROUTE = "/dsh-tts/speak";
var SAY_EVENT = "dsc:say";
var VOICE_FLOOR_MS = 250;
var LEAD_SECONDS = 0.06;
var FIRST_CHUNK_LIMIT_MS = 1500;
var TIMEOUT = Symbol("dsh-tts timeout");
var LOG_PREFIX = "[deepseek-chan-plugin-for-dsh]";
var warned = /* @__PURE__ */ new Set();
function warnOnce(key, ...args) {
  if (warned.has(key)) return;
  warned.add(key);
  console.warn(LOG_PREFIX, ...args);
}
async function warnSpeakRefused(response) {
  const body = await Promise.resolve(response.json?.()).catch(() => null);
  const reason = String(body?.error?.message ?? "");
  warnOnce("speak:" + response.status + ":" + reason, "TTS 요청 실패: HTTP " + response.status, reason);
}
function kindAllowed(lines, kind) {
  if (kind === "reaction") return lines.reactions === true;
  if (kind === "status") return lines.status === true;
  if (kind === "mutter") return lines.mutters === true;
  return lines.others === true;
}
async function readState() {
  try {
    const response = await fetch(STATE_ROUTE, { cache: "no-store" });
    if (!response.ok) return null;
    const state = await response.json();
    if (typeof state?.error === "string") warnOnce("state:" + state.error, "TTS 설정 오류:", state.error);
    if (state?.enabled !== true || typeof state.pcmSampleRate !== "number") return null;
    return state;
  } catch {
    return null;
  }
}
async function readChunk(reader, deadline, controller) {
  let timer = 0;
  const timeout = new Promise((resolve) => {
    timer = setTimeout(() => resolve(TIMEOUT), Math.max(0, deadline - performance.now()));
  });
  const read = reader.read().catch(() => ({ done: true, value: void 0 }));
  const result = await Promise.race([read, timeout]);
  clearTimeout(timer);
  if (result === TIMEOUT) {
    controller.abort();
    return null;
  }
  return result.done ? null : result.value;
}
async function apply(ctx) {
  const state = await readState();
  if (state === null) return;
  let audioContext = null;
  let playback = null;
  const voice = (value) => {
    try {
      window.__dsc?.voice?.(value);
    } catch {
    }
  };
  const getAudioContext = () => {
    if (audioContext !== null) return audioContext;
    const Ctor = globalThis.AudioContext ?? globalThis.webkitAudioContext;
    if (typeof Ctor !== "function") return null;
    try {
      audioContext = new Ctor();
    } catch {
      audioContext = null;
    }
    return audioContext;
  };
  function clearMeter(session) {
    if (session.frame !== 0) cancelAnimationFrame(session.frame);
    session.frame = 0;
  }
  function teardown(session) {
    clearMeter(session);
    if (session.watchdog !== 0) {
      clearTimeout(session.watchdog);
      session.watchdog = 0;
    }
    session.scheduler?.stop();
    session.scheduler = null;
    try {
      session.analyser?.disconnect();
    } catch {
    }
    session.analyser = null;
  }
  function stopPlayback() {
    const session = playback;
    if (session === null) return;
    playback = null;
    try {
      session.controller.abort();
    } catch {
    }
    teardown(session);
    voice(null);
  }
  function startMeter(session) {
    const analyser = session.analyser;
    const samples = new Float32Array(analyser.fftSize);
    const tick = () => {
      if (playback !== session) return;
      let sum = 0;
      analyser.getFloatTimeDomainData(samples);
      for (let index = 0; index < samples.length; index += 1) sum += samples[index] * samples[index];
      const level = Math.min(1, Math.sqrt(sum / samples.length) * 4);
      voice({ speaking: true, level, until: performance.now() + VOICE_FLOOR_MS });
      session.frame = requestAnimationFrame(tick);
    };
    session.frame = requestAnimationFrame(tick);
  }
  function release(session) {
    if (playback !== session) return;
    playback = null;
    teardown(session);
    voice(null);
  }
  function endStream(session) {
    if (playback !== session) return;
    const scheduler = session.scheduler;
    scheduler.onIdle = () => release(session);
    if (!scheduler.active) {
      release(session);
      return;
    }
    const remaining = Math.max(0, scheduler.endTime - session.audio.currentTime);
    session.watchdog = setTimeout(() => release(session), remaining * 1e3 + 1e3);
  }
  async function speak(detail) {
    stopPlayback();
    const text = typeof detail.text === "string" ? detail.text.trim() : "";
    if (text.length === 0) return;
    const ms = Number(detail.ms) > 0 ? Number(detail.ms) : 0;
    const startedAt = performance.now();
    const controller = new AbortController();
    const session = {
      controller,
      analyser: null,
      scheduler: null,
      audio: null,
      frame: 0,
      watchdog: 0,
      ms
    };
    playback = session;
    const deadline = startedAt + (ms > 0 ? Math.min(ms, FIRST_CHUNK_LIMIT_MS) : FIRST_CHUNK_LIMIT_MS);
    try {
      const response = await fetch(SPEAK_ROUTE, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text }),
        signal: controller.signal
      });
      if (!response.ok) await warnSpeakRefused(response);
      if (!response.ok || response.body === null) throw new Error("dsh-tts: speak failed with " + response.status);
      const audio = getAudioContext();
      if (audio === null) throw new Error("dsh-tts: no AudioContext");
      session.audio = audio;
      if (playback !== session) return;
      try {
        await audio.resume();
      } catch {
      }
      if (playback !== session) return;
      const analyser = audio.createAnalyser();
      analyser.fftSize = 512;
      analyser.connect(audio.destination);
      const scheduler = new ChunkScheduler({ audioContext: audio, destination: analyser, lead: LEAD_SECONDS });
      session.analyser = analyser;
      session.scheduler = scheduler;
      const reader = response.body.getReader();
      let chunk = await readChunk(reader, deadline, controller);
      if (chunk === null) throw new Error("dsh-tts: no audio before the bubble deadline");
      let rest = new Uint8Array(0);
      let metered = false;
      while (chunk !== null) {
        const split = carryOddByte(rest, chunk);
        rest = split.rest;
        if (split.aligned.length > 0) {
          scheduler.add(split.aligned, state.pcmSampleRate);
          if (!metered) {
            metered = true;
            startMeter(session);
          }
        }
        const next = await reader.read();
        chunk = next.done ? null : next.value;
      }
      scheduler.finish();
      endStream(session);
    } catch {
      teardown(session);
      if (playback === session) {
        playback = null;
        voice(null);
      }
    }
  }
  function onSay(event) {
    const detail = event?.detail;
    if (!detail || typeof detail.text !== "string") return;
    if (!kindAllowed(state.voiceLines ?? {}, detail.kind)) return;
    void speak(detail);
  }
  ctx.effect(() => {
    window.addEventListener(SAY_EVENT, onSay);
    return () => {
      window.removeEventListener(SAY_EVENT, onSay);
      stopPlayback();
      try {
        audioContext?.close();
      } catch {
      }
      audioContext = null;
    };
  }, "dsh-tts: speech playback");
}

// plugin/locales.ko.json
var locales_ko_default = {
  common: {
    ok: "확인",
    cancel: "취소",
    close: "닫기",
    copy: "복사",
    copied: "복사됨",
    "codeBlock.title": "코드 블록",
    "codeBlock.wrap": "자동 줄바꿈",
    "codeBlock.unwrap": "자동 줄바꿈 해제",
    "copy.failed": "복사 실패",
    "copy.value": "값 복사",
    "copy.json": "JSON 복사",
    "copy.path": "속성 경로 복사",
    "copy.prettyJson": "서식 있는 JSON 복사",
    "copy.compactJson": "압축 JSON 복사",
    "copy.optionsHint": "{action}. 오른쪽 클릭으로 복사 방식을 고를 수 있습니다",
    retry: "다시 시도",
    loading: "불러오는 중…",
    "load.failed": "불러오기 실패",
    submit: "제출",
    submitting: "제출 중…",
    next: "다음",
    previous: "이전",
    skip: "건너뛰기",
    delete: "삭제",
    edit: "편집",
    save: "저장",
    search: "검색",
    more: "더 보기",
    collapse: "접기",
    expand: "펼치기",
    back: "뒤로",
    "brand.localBuild": "DSH 로컬 빌드",
    "workspace.defaultName": "기본 작업 공간",
    unknown: "알 수 없음",
    none: "없음",
    truncated: "잘림",
    "json.label": "JSON",
    "markdown.footnotes": "각주",
    "markdown.truncatedCharacters": "… 잘림, 총 {total}자",
    "number.thousand": "{value}K",
    "number.million": "{value}M"
  },
  "settings.locale": {
    "language.title": "언어"
  },
  "settings.agentPreset": {
    modeExplanation: "모드 설명",
    howToUse: "사용 방법",
    guideSections: "도움말",
    guideExampleTask: "예시 작업",
    guideCopy: "복사",
    guideCopied: "복사됨",
    guideFootnotes: "각주",
    guideStandardIntro: "새 작업에서 ‘표준 모드’를 선택하고 작업 목표, 관련 파일 위치, 완료 기준을 적어 주세요.",
    guideStandardExplanation: "### 작동 방식\n\n에이전트가 도구를 직접 호출해 파일을 읽고 쓰며 자료를 찾고 터미널 명령을 실행합니다. 스킬, 계획, 목표, 하위 에이전트, 워크플로, 컨텍스트 압축 같은 기능이 들어 있습니다.\n\n### 언제 고르나\n\n일상적인 프로그래밍, 파일 처리, 자료 정리는 여기서 시작하면 됩니다. 표준 모드도 스크립트를 작성하고 파일을 일괄 처리할 수 있습니다. PTC는 도구를 호출하는 방식이 다릅니다. 일괄 작업을 할 때 반드시 PTC를 선택할 필요는 없습니다.",
    guideStandardUsage: "### 문제 하나 고치기\n\n> 검색 폼을 연속으로 두 번 제출하면 결과가 사라집니다. 원인을 찾아 고치고 관련 테스트를 실행한 뒤, 원인과 수정 내용을 설명해 주세요.\n\n예상 결과: 코드 수정, 관련 테스트 결과, 문제 원인 설명.\n\n### 프로젝트 자료 정리\n\n> 프로젝트의 Markdown 기록을 읽고 이미 내린 결론과 아직 확인이 필요한 문제를 정리한 뒤 해당 파일 링크를 붙여 주세요.\n\n예상 결과: 출처가 달린 요약. 원문으로 돌아가 확인하기 쉽습니다.",
    guidePtcIntro: "새 작업에서 ‘PTC 모드’를 선택하고 입력 파일, 처리 규칙, 출력 형식을 적어 주세요. 코드는 에이전트가 작성합니다.",
    guidePtcExplanation: "### 도구를 호출하는 방식\n\nPTC는 Programmatic Tool Calling, 즉 프로그램으로 도구를 호출하는 방식입니다. 현재 기본 프리셋에서는 에이전트가 run_code로 TypeScript 프로그램을 작성하고 생성된 도구 SDK로 호출합니다. 프로그램에서 반복, 조건 분기, 오류 처리를 구성하고 함께 실행할 호출을 정할 수 있습니다.\n\n### 어떤 결과가 모델에 전달되나\n\n도구가 돌려준 데이터는 먼저 프로그램에서 필터링하거나 계산·병합합니다. 처리한 결과는 출력이나 반환값으로 모델에 전달됩니다. 이미지 결과는 따로 첨부됩니다. 프로그램 안의 도구 호출도 그대로 기록되고 도구 권한도 똑같이 적용됩니다.\n\n### 표준 모드와의 차이\n\n두 모드 모두 프로그래밍과 파일 일괄 처리를 할 수 있습니다. 표준 모드는 각 도구를 모델에 직접 제공하고 PTC는 모델이 코드로 도구 호출을 구성합니다. 현재 PTC 프리셋에서는 workflow 도구가 꺼져 있습니다. 속도와 토큰 사용량은 작업 내용과 결과 처리 방식에 따라 달라집니다.",
    guidePtcUsage: "### 설정 파일 일괄 검사\n\n> configs/ 아래 모든 JSON 파일을 schema.json 기준으로 검사해 빠진 필드와 잘못된 값을 찾아 주세요. 문제마다 CSV 한 줄로 적고 읽지 못한 파일도 보고서에 넣은 뒤 나머지 파일을 계속 검사하세요. 원본 파일은 그대로 두세요.\n\n예상 결과: 문제 요약과 CSV 보고서. 프로그램은 여러 파일에 같은 검사를 하고 파일 하나가 실패해도 처리한 뒤 결과를 모읍니다.\n\n### 오류 로그 요약\n\n> logs/ 아래 로그를 분석해 서비스별·오류 유형별 횟수를 세고 가장 많이 나온 오류 10가지를 유형마다 예시 하나씩과 함께 나열해 주세요. 전체 통계는 CSV로 따로 저장하세요.\n\n예상 결과: 자주 나는 오류 요약과 전체 통계표. 중간 데이터는 프로그램에서 먼저 모은 뒤 요약만 모델에 넘길 수 있습니다.",
    guideMinimalIntro: "새 작업을 만들 때 ‘최소 모드’를 고르세요. 비교 테스트를 할 때는 모델, 권한, 작업 입력, 작업 공간 시작 상태를 똑같이 맞추세요.",
    guideMinimalExplanation: "### 남아 있는 기능\n\n상태가 유지되는 셸과 read_image 도구를 제공하며 고정된 시스템 프롬프트를 씁니다. 이미지를 읽으려면 이미지 입력을 지원하는 모델이 필요합니다. 컨텍스트가 한도에 가까워지면 오래된 기록을 자동으로 압축하고 에이전트가 쉬고 있을 때 /compact로 직접 압축할 수 있습니다. 기본 프리셋은 스킬과 계획을 불러오지 않고 표준 실행 컨텍스트도 넣지 않습니다.\n\n### 언제 고르나\n\n실험과 비교 테스트의 기준으로 쓰기 좋습니다. 에이전트는 여전히 터미널 명령으로 파일을 읽고 쓰거나 스크립트를 실행할 수 있습니다. 다만 긴 작업을 관리하는 내장 보조 기능은 없습니다. 도구가 적다고 초보자에게 더 쉬운 것은 아닙니다.",
    guideMinimalUsage: "### 기본 수정 능력 비교\n\n> 이 프로젝트의 테스트를 실행해 실패 원인을 찾고 최소한으로 고친 뒤 관련 테스트를 다시 실행해 결과를 보고해 주세요.\n\n표준 모드와 최소 모드로 같은 작업 공간 상태에서 이 작업을 각각 실행해 완료 여부, 도구 호출, 최종 수정을 비교하세요. 최소 모드는 터미널 명령으로 이 작업들을 합니다.",
    guideCordisIntro: "새 작업에서 ‘창작 모드’를 선택하고 추가할 기능, 사용할 곳, 동작 확인 방법을 적어 주세요.",
    guideCordisExplanation: "### 무엇을 만들 수 있나\n\n창작 모드는 표준 작업 도구에 더해 실행 중 검사, 영구 플러그인 관리, Cordis 플러그인과 에이전트 프리셋 개발 안내를 제공합니다. 플러그인을 작성해 기능이나 화면을 추가할 수도 있고 도구와 프롬프트를 조합해 특정 작업에 맞는 모드를 만들 수도 있습니다.\n\n### 플러그인과 모드의 관계\n\n플러그인은 DSH에 도구, 서비스 연결, 화면 진입점 같은 기능을 더합니다. 모드는 에이전트 프리셋 하나로, 작업에서 쓸 도구를 고르고 에이전트의 작업 방식을 정합니다. 직접 만든 플러그인을 사용자 모드에서 쓸 수도 있습니다.\n\n### 결과를 적용하는 방법\n\n에이전트에게 설치와 실제 동작 확인까지 맡길 수 있습니다. 수정 내용에 따라 플러그인이 바로 불러와질 수도 있고 재시작이 필요할 수도 있습니다. 새로 만든 모드는 새 작업을 만들 때 고릅니다.",
    guideCordisUsage: "### 화면 하나 추가하기\n\n> 사이드바에 ‘프로젝트 노트’ 메뉴를 추가하는 DSH 플러그인을 만들어 주세요. 현재 작업 공간의 Markdown 파일을 나열하고 누르면 내용을 미리 볼 수 있게 해 주세요. 설치하고 페이지가 열리는지 확인까지 해 주세요.\n\n예상 결과: 사이드바 메뉴와 미리보기 페이지가 있는 플러그인, 그리고 적용하려면 남은 단계.\n\n### 도구 하나 추가하기\n\n> 프로젝트 테스트 보고서를 읽어 실패한 케이스를 요약하는 도구를 제공하는 플러그인을 만들어 주세요. 도구를 등록하고 예시 보고서로 호출 결과를 확인해 주세요.\n\n예상 결과: 호출할 수 있는 새 도구와 예시 호출 한 번의 확인 결과.\n\n### 나만의 모드 만들기\n\n> 표준 모드를 바탕으로 ‘코드 리뷰’ 모드를 만들어 주세요. 잠재적 오류와 빠진 테스트를 먼저 살피고 파일과 줄 번호를 짚어 주고 파일을 고치기 전에는 먼저 물어보게 해 주세요. 고를 수 있는 프리셋으로 저장해 주세요.\n\n예상 결과: 새 작업에서 고를 수 있는 사용자 모드. 리뷰 요구사항은 에이전트의 행동을 안내하며 실제로 할 수 있는 작업은 권한 설정이 정합니다.",
    builtInGroup: "기본 제공",
    customGroup: "사용자 지정",
    sectionIntro: "에이전트의 도구와 작업 방식을 고릅니다. 일상 작업은 ‘표준 모드’, DSH 기능 확장은 ‘창작 모드’를 쓰세요.",
    seatHint: "새 작업에 쓸 에이전트 프리셋 선택",
    headerHint: "이 작업의 에이전트 프리셋(작업 시작 때 정해짐)",
    nav: "에이전트 프리셋",
    setDefault: "새 작업 기본값으로 설정",
    view: "설정 보기",
    presetStandardName: "표준 모드",
    presetStandardDescription: "코드, 파일, 자료를 다루는 대부분의 작업에 맞습니다. 에이전트가 필요에 따라 검색, 편집, 터미널 같은 도구를 씁니다.",
    presetPtcName: "PTC 모드",
    presetPtcDescription: "표준 모드의 모든 기능을 포함합니다. 도구를 대량으로 호출하고 결과를 추려 정리하거나 중복을 제거해 통계와 요약을 만드는 작업에 더 알맞습니다.",
    presetMinimalName: "최소 모드",
    presetMinimalDescription: "에이전트가 터미널과 이미지 읽기 도구만 쓰고 컨텍스트 압축을 지원합니다. 기본 성능을 시험하고 비교하기에 좋습니다.",
    presetCordisName: "창작 모드",
    presetCordisDescription: "대화로 DSH를 맞춤 설정합니다. 에이전트에게 플러그인 제작을 맡겨 기능이나 화면을 추가하고 도구와 프롬프트를 조합해 나만의 모드를 만들 수도 있습니다.",
    inUse: "새 작업 기본값",
    noDescription: "설명이 없습니다.",
    brokenBadge: "불러오기 실패",
    switchRefused: "‘{name}’(으)로 바꿀 수 없습니다: {reason}",
    standardUnavailable: "표준 모드를 쓸 수 없습니다. 이 모드를 복구하거나 쓸 수 있는 다른 모드를 고르세요.",
    close: "닫기",
    creatorDraft: "에이전트와 함께 프리셋 만들기",
    createPlugin: "에이전트에게 플러그인 제작 맡기기",
    createPluginDescription: "창작 모드로 들어가 나만의 DSH 플러그인 만들기",
    createPluginChecking: "창작 모드 사용 가능 여부 확인 중",
    createPluginUnavailable: "잠시 쓸 수 없습니다. 메뉴를 다시 열어 시도하세요",
    createPluginMissing: "현재 설정에는 창작 모드가 없습니다"
  },
  approval: {
    waiting: "승인 대기 중",
    "detail.aria": "승인 상세",
    escalation: "도구 {toolName}이(가) 현재 권한을 넘어서는 실행을 요청합니다",
    reject: "거부",
    allowOnce: "한 번 허용",
    allow: "허용",
    allowAlways: "항상 허용"
  },
  chat: {
    "message.stepProcess.thinking": "요청 분석 중",
    "message.stepProcess.read": "파일 읽는 중",
    "message.stepProcess.readImage": "이미지 읽는 중",
    "message.stepProcess.write": "파일 쓰는 중",
    "message.stepProcess.search": "코드 검색 중",
    "message.stepProcess.edit": "파일 편집 중",
    "message.stepProcess.commands": "명령 실행 중",
    "message.stepProcess.code": "코드 실행 중",
    "message.stepProcess.webSearch": "웹 검색 중",
    "message.stepProcess.webFetch": "웹페이지 여는 중",
    "message.stepProcess.subagents": "하위 에이전트 조율 중",
    "message.stepProcess.plan": "계획 업데이트 중",
    "message.stepProcess.questions": "사용자 조작을 기다리는 중",
    "message.stepProcess.tools": "도구 호출 중",
    "message.stepProcess.prepare.read": "파일 읽을 준비 중",
    "message.stepProcess.prepare.readImage": "이미지 읽을 준비 중",
    "message.stepProcess.prepare.write": "파일 쓸 준비 중",
    "message.stepProcess.prepare.search": "코드 검색 준비 중",
    "message.stepProcess.prepare.edit": "파일 편집 준비 중",
    "message.stepProcess.prepare.commands": "명령 실행 준비 중",
    "message.stepProcess.prepare.code": "코드 실행 준비 중",
    "message.stepProcess.prepare.webSearch": "웹 검색 준비 중",
    "message.stepProcess.prepare.webFetch": "웹페이지 열 준비 중",
    "message.stepProcess.prepare.subagents": "하위 에이전트 조율 준비 중",
    "message.stepProcess.prepare.plan": "계획 업데이트 준비 중",
    "message.stepProcess.prepare.questions": "질문 준비 중",
    "message.stepProcess.prepare.tools": "도구 호출 준비 중",
    "message.stepProcess.done.thinking": "분석 완료",
    "message.stepProcess.done.read": "파일 읽음",
    "message.stepProcess.done.readImage": "이미지 읽음",
    "message.stepProcess.done.write": "파일 씀",
    "message.stepProcess.done.search": "코드 검색함",
    "message.stepProcess.done.edit": "파일 수정함",
    "message.stepProcess.done.commands": "명령 실행함",
    "message.stepProcess.done.code": "코드 실행함",
    "message.stepProcess.done.webSearch": "웹 검색함",
    "message.stepProcess.done.webFetch": "웹페이지 열어 봄",
    "message.stepProcess.done.subagents": "하위 에이전트 조율함",
    "message.stepProcess.done.plan": "계획 업데이트함",
    "message.stepProcess.done.questions": "사용자에게 질문함",
    "message.stepProcess.done.tools": "도구 호출함",
    "message.stepProcess.joinTwo": "{first}, {second}",
    "message.stepProcess.comma": ", ",
    "message.stepProcess.sharedPrefix": "",
    "message.stepProcess.more": "{title} 외",
    "message.trigger.request": "실행 요청 받음",
    "message.trigger.goal": "목표 계속 실행",
    "message.trigger.agent": "작업 메시지 받음",
    "message.trigger.team": "팀 메시지 받음",
    "message.trigger.subagent": "하위 작업 상태 업데이트",
    "message.trigger.github": "GitHub 이벤트 받음",
    "message.trigger.webhook": "외부 이벤트 받음",
    "message.trigger.schedule": "자동화 작업",
    "message.trigger.job": "백그라운드 작업 상태 업데이트",
    "message.trigger.plugin": "플러그인 상태 업데이트",
    "message.trigger.explanation": "이 알림으로 이번 답변이 시작되었습니다.",
    "message.turnProcess.worked": "완료",
    "message.turnProcess.took": "완료, 소요 시간 ",
    "message.turnProcess.failed": "처리 실패",
    "view.chat": "대화",
    "image.open": "크게 보기",
    "image.loading": "이미지 불러오는 중…",
    "image.failed": "이미지를 미리 볼 수 없습니다",
    "image.dialog": "이미지 미리보기",
    "image.close": "이미지 미리보기 닫기",
    "number.groupSeparator": ",",
    "duration.compactSeconds": "{seconds}초",
    "duration.compactMinutes": "{minutes}분 {seconds}초",
    "duration.milliseconds": "{milliseconds}ms",
    "stats.counts": "{turns}턴 {steps}단계",
    "stats.cacheHit": "캐시 적중 {percent}%",
    "stats.dialog.title": "세션 통계",
    "stats.dialog.usageTitle": "토큰 사용량",
    "stats.dialog.llmTime": "모델 소요 시간",
    "stats.dialog.toolTime": "도구 호출 소요 시간",
    "stats.dialog.ttft": "첫 토큰 평균(TTFT)",
    "stats.dialog.speed": "출력 속도(TPS)",
    "chat.loadingHistory": "기록 불러오는 중…",
    "chat.loadError": "기록 불러오기 실패: {message}({code})",
    "chat.loadOlder": "이전 기록 더 불러오기",
    "chat.toBottom": "맨 아래로",
    "chat.deepDiving": "생각하는 중",
    "chat.deepDivingFor": "생각하는 중, {duration} 경과 ···",
    "chat.turnNavigation.label": "턴 이동",
    "chat.turnNavigation.jump": "{turn}번째 턴으로 이동",
    "chat.turnNavigation.jumpLoad": "불러와서 {turn}번째 턴으로 이동",
    "chat.turnNavigation.turn": "{turn}번째 턴",
    "settings.performance.title": "성능과 사용량",
    "settings.performance.description": "성능·사용량 정보를 얼마나 자세히 보여 줄지 선택",
    "settings.performance.compact": "간단히",
    "settings.performance.detailed": "자세히",
    "settings.links.title": "웹 링크 열기 방식",
    "settings.links.description": "대화 속 웹 링크를 열 위치",
    "settings.links.sidebar": "앱 안 사이드바",
    "settings.links.newTab": "기본 브라우저",
    "settings.transcript.title": "작업 단계 표시",
    "settings.transcript.description": "도구 호출 내용을 얼마나 자세히 볼지 선택",
    "settings.collapse.title": "작업 단계 접는 시점",
    "settings.collapse.description": "작업 단계를 언제 자동으로 접을지 선택",
    "settings.collapse.completion": "답변이 끝난 뒤",
    "settings.collapse.nextInput": "다음 새 메시지가 도착할 때",
    "settings.transcript.compact": "간단히",
    "settings.transcript.standard": "표준",
    "settings.transcript.detailed": "자세히",
    "settings.transcript.verbose": "모두 펼치기",
    "fileOpen.title": "파일을 열 수 없습니다",
    "fileOpen.unknown": "이 파일을 열 수 없습니다",
    "message.extraBlock": "추가 콘텐츠 블록",
    "message.systemPrompt": "시스템 프롬프트",
    "message.systemPromptUpdate": "시스템 프롬프트 업데이트",
    "message.toolAdded": "도구 추가됨: {name}",
    "message.toolRemoved": "도구 제거됨: {name}",
    "message.toolsAdded": "추가: {names}",
    "message.toolsAddedCount": "{count}개 추가",
    "message.toolsChanged": "{added}개 추가, {removed}개 제거",
    "message.toolsRemoved": "제거: {names}",
    "message.toolsRemovedCount": "{count}개 제거",
    "message.toolsUpdated": "도구가 업데이트됨",
    "message.contextInjection": "컨텍스트 주입",
    "message.contextRecall": "세션 간 불러오기",
    "message.referenceSummary": "참조한 세션 · {labels}",
    "message.referenceSeparator": "、",
    "message.context.instructions.loaded": "불러옴",
    "message.context.instructions.added": "추가됨",
    "message.context.instructions.updated": "업데이트됨",
    "message.context.instructions.removed": "제거됨",
    "message.context.catalog.replaced": "목록 교체",
    "message.context.catalog.more": "…{count}개 더 있음",
    "message.context.snapshot.supersedes": "이전 스냅샷을 대체함",
    "message.context.relay.from": "세션 {session}에서 가져옴",
    "message.context.recall.counts": "{retained}개 유지 · {omitted}개 생략",
    "message.context.recall.truncated": "잘림",
    "message.compaction": "컨텍스트가 압축됨",
    "message.compaction.running": "압축 중…",
    "message.compaction.completed": "기록 {items}개 압축함(약 {tokens}토큰)",
    "message.compaction.expand": "눌러서 압축 요약 보기",
    "message.compaction.unavailable": "압축 요약을 볼 수 없습니다",
    "message.compaction.commandTitle": "compact",
    "message.think": "생각",
    "message.unknownSurface": "알 수 없는 surface 이벤트: {type}",
    "message.unknownBlock": "알 수 없는 콘텐츠 블록",
    "message.turnProcess.toolCalls.one": "도구 호출 {count}회",
    "message.turnProcess.toolCalls.other": "도구 호출 {count}회",
    "message.turnProcess.messages.one": "메시지 {count}개",
    "message.turnProcess.messages.other": "메시지 {count}개",
    "message.turnProcess.subagents.one": "하위 에이전트 {count}개",
    "message.turnProcess.subagents.other": "하위 에이전트 {count}개",
    "message.turnProcess.thoughtForAWhile": "생각함",
    "message.turnProcess.separator": " · ",
    "message.stopped": "중지됨",
    "message.branch": "새 대화로 분기",
    "message.branchUnavailable": "완료된 턴의 마지막 메시지에서만 분기할 수 있습니다",
    "message.retry.active": "모델 요청 다시 시도 중",
    "message.retry.cancelled": "모델 요청 재시도 취소됨",
    "message.retry.started": "모델 요청 다시 시도함",
    "message.retry.scheduled": "모델 요청 재시도 대기 중",
    "message.retry.status": "{label}（{retry}/{maximum}） · {seconds}s",
    "message.retry.delay": "재시도 대기 시간: ",
    "message.retry.failure": "실패 원인: ",
    "message.failure.auth": "API 키가 올바르지 않습니다",
    "message.taskStopped": "작업 중지됨",
    "message.failure.accountSignedOut": "DeepSeek에서 로그아웃해 작업이 중지되었습니다.",
    "message.failure.interrupted": "이번 턴이 끝나기 전에 DSH 프로세스가 종료되었습니다(강제 종료, 충돌, 종료 시간 초과 등). 다시 시작한 뒤 미완료 상태인 이번 턴을 중단했습니다. 끝나지 않은 도구 호출의 결과는 알 수 없습니다.",
    "message.failure.accountSignInRequired": "먼저 DeepSeek에 로그인하고 요청 주소가 계정 인증을 지원하는지 확인하세요.",
    "message.failure.quota": "현재 요청의 사용 한도를 모두 썼습니다",
    "message.turnError": "이번 턴 실행 실패",
    "message.maxTokens": "출력 토큰 한도에 도달했습니다",
    "message.maxTokens.hint": "답변이 잘렸습니다. 지금까지의 답변은 대화에 남아 있습니다. ‘계속’이라고 보내면 모델이 이어서 출력합니다.",
    "message.tokensPerSecond": "{tps} tok/s",
    "message.turnUsage.title": "이번 턴 사용량",
    "message.turnUsage.consumed": "사용량 {total}",
    "message.turnUsage.model": "공급자 / 모델",
    "message.turnUsage.cacheHit": "캐시 적중",
    "message.turnUsage.input": "캐시되지 않은 입력",
    "message.turnUsage.cacheRead": "캐시 읽기",
    "message.turnUsage.cacheWrite": "캐시 쓰기",
    "message.turnUsage.output": "출력",
    "message.turnUsage.reasoning": "(그중 추론 {tokens})",
    "message.turnUsage.count": "{count} tok",
    "duration.secondUnit": "초",
    "duration.minuteUnit": "분",
    "duration.hourUnit": "시간",
    "command.running": "실행 중…",
    "command.failed": "명령 실패",
    "command.done": "완료",
    "command.title": "명령",
    "row.running": "실행 중",
    "row.failed": "실패",
    "json.truncated": "… 잘림, 총 {total}자",
    "clock.md": "{m}월 {d}일",
    "clock.ymd": "{y}년 {m}월 {d}일",
    "settings.foldedReplies.title": "접은 뒤 남길 답변",
    "settings.foldedReplies.description": "작업 단계를 접을 때 계속 보여 줄 어시스턴트 답변 선택",
    "settings.foldedReplies.all": "모든 답변",
    "settings.foldedReplies.final": "최종 답변만"
  },
  command: {
    "section.add": "추가",
    "section.commands": "명령",
    "label.goal": "목표",
    "label.plan": "계획",
    "label.feedback": "피드백",
    "label.compact": "압축",
    "label.permission": "권한",
    "label.export": "로그 내려받기",
    "description.goal": "장기 작업 목표 설정 또는 보기",
    "description.plan": "계획 모드 들어가기/나가기",
    "description.feedback": "현재 세션에 대한 피드백 보내기",
    "description.compact": "위 대화 내용 압축",
    "description.permission": "권한 프리셋 바꾸기(샌드박스 모드와 승인 정책)",
    "description.export": "현재 세션 내용을 ZIP으로 내보내기",
    "token.goal": "목표",
    "token.plan": "계획",
    "token.feedback": "피드백",
    "token.compact": "압축",
    "token.permission": "권한",
    "token.export": "내보내기",
    "search.placeholder": "검색…",
    "search.aria": "옵션 필터",
    "status.loading": "옵션 불러오는 중…",
    "status.applying": "적용 중…",
    "status.empty": "옵션 없음",
    "overlay.aria": "/{command} 옵션",
    "listbox.aria": "/{command} 일치 항목",
    "notice.attachmentsUnsupported": "/{command}에는 첨부를 쓸 수 없습니다. 먼저 첨부를 빼 주세요"
  },
  conversation: {
    "shortcut.newline": "줄바꿈",
    "shortcut.complementary": "반대 방식(대기열/끼어들기)으로 보내기",
    "shortcut.slash": "명령 메뉴 열기",
    "shortcut.mention": "참조 메뉴 열기",
    "hint.plan": "작업을 설명하면 계획을 만듭니다",
    "hint.goal": "목표를 입력하면 에이전트가 계속 작업합니다",
    "hint.goal.active": "목표를 진행하고 있습니다. edit(수정), pause(일시 중지), resume(계속), clear(지우기)를 입력할 수 있습니다",
    "placeholder.plan": "작업을 설명하면 계획을 만듭니다",
    "placeholder.default": "메시지를 보내거나 작업을 만드세요. /로 명령, @로 파일이나 대화",
    "placeholder.unavailable": "세션을 쓸 수 없습니다",
    "placeholder.parentOffline": "상위 세션이 오프라인이라 메시지를 보낼 수 없습니다. 실행 중인 작업은 멈출 수 있습니다",
    "placeholder.hero": "만들고 싶은 것을 설명하세요. /로 명령, @로 파일이나 대화",
    "placeholder.workspace": "작업 공간을 골라 시작하세요",
    "placeholder.steerQueue": "Cmd/Ctrl+Enter로 대기 중인 메시지를 모두 끼어들어 보내기",
    "input.commands": "파일 추가 또는 명령 실행",
    "input.file": "파일",
    "input.stop": "생성 중지",
    "input.send": "메시지 보내기",
    "input.send.queue": "대기열에 넣어 보내기",
    "input.send.steer": "끼어들어 보내기",
    "attachment.pending": "보낼 첨부",
    "attachment.scrollLeft": "첨부 왼쪽으로 스크롤",
    "attachment.scrollRight": "첨부 오른쪽으로 스크롤",
    "attachment.dropTitle": "파일이나 이미지를 여기로 끌어다 놓아 추가하세요",
    "attachment.dropDesc": "이미지 제한: 최대 {count}장, 장당 {size}",
    "attachment.dropBlocked": "지금은 파일이나 이미지를 추가할 수 없습니다",
    "attachment.directoryDesktopOnly": "폴더는 데스크톱 앱에서만 추가할 수 있습니다. 브라우저에서는 파일을 하나씩 추가하세요",
    "attachment.pathUnavailable": "폴더 경로를 가져오지 못했습니다. 다시 끌어다 놓으세요",
    "attachment.pathUnsupported": "경로에 참조할 수 없는 문자가 있습니다. 이름을 바꾼 뒤 다시 시도하세요",
    "image.pending": "보낼 이미지",
    "image.openOriginal": "원본 보기",
    "image.openOriginalLabel": "{label}, 눌러서 원본 보기",
    "image.remove": "이미지 {name} 제거",
    "image.original": "원본",
    "image.label": "이미지",
    "image.loadFailed": "이미지를 불러오지 못했습니다. 눌러서 다시 시도",
    "image.loading": "이미지 불러오는 중…",
    "image.preview": "원본 미리보기",
    "image.closePreview": "원본 미리보기 닫기",
    "image.unsupportedType": "PNG, JPG, WebP, GIF 이미지만 지원합니다",
    "image.tooMany": "메시지 하나에 이미지는 최대 {count}장까지 추가할 수 있습니다",
    "image.fileTooLarge": "이미지 한 장은 {size}를 넘을 수 없습니다",
    "image.totalTooLarge": "이미지 전체 크기가 {size}를 넘습니다. 일부 이미지를 빼 주세요",
    "image.tooManyPixels": "이미지 해상도가 너무 큽니다. 줄인 뒤 다시 시도하세요",
    "image.dimensionTooLarge": "이미지 가로·세로는 {size}px를 넘을 수 없습니다. 줄인 뒤 다시 시도하세요",
    "image.modelUnsupported": "현재 모델은 이미지를 지원하지 않습니다. 이미지를 지원하는 모델로 바꾸세요",
    "image.sendFailed": "이미지 보내기 실패({reason}). 이미지를 다시 추가한 뒤 시도하세요",
    "file.pending": "보낼 파일",
    "file.remove": "파일 {name} 제거",
    "file.uploading": "올리는 중…",
    "file.uploadFailed": "올리기 실패. 눌러서 다시 시도",
    "file.retry": "{name} 다시 올리기",
    "file.stillUploading": "파일을 올리는 중입니다. 끝난 뒤 보내 주세요",
    "file.sessionUnavailable": "세션을 쓸 수 없어 파일을 올릴 수 없습니다",
    "file.notStaged": "파일이 아직 올라가지 않았습니다. 다시 추가한 뒤 시도하세요",
    "file.label": "파일",
    "context.aria": "컨텍스트 {percent} 사용",
    "context.used": "컨텍스트 사용량",
    "context.system": "시스템 프롬프트",
    "context.tools": "도구 정의",
    "context.messages": "대화 메시지",
    "settings.enter.title": "작업 중일 때 보내기 동작",
    "settings.enter.description": "에이전트가 실행 중일 때 Enter 키와 보내기 버튼이 동작하는 방식입니다. Cmd/Ctrl+Enter를 누르면 반대 방식으로 보냅니다",
    "settings.enter.queue": "대기열에 넣어 보내기",
    "settings.enter.steer": "끼어들어 보내기",
    "hero.headline": "아직 가 보지 않은 곳을 탐험하세요",
    "hero.preview": "미리보기판",
    "hero.chooseWorkspace": "작업 공간 선택",
    "session.hierarchy": "세션 계층",
    "session.moreViews": "다른 보기",
    "todo.title": "작업",
    "todo.progress.done": "{done}개 완료",
    "todo.progress.active": "{active}개 진행 중",
    "todo.progress.pending": "{pending}개 대기",
    "todo.status.completed": "완료",
    "todo.status.inProgress": "진행 중",
    "todo.status.pending": "처리 대기",
    "todo.rowTitle": "작업 목록 업데이트",
    "tool.title.createGoal": "목표 만들기",
    "tool.title.getGoal": "목표 보기",
    "tool.title.updateGoal": "목표 업데이트",
    "tool.preparing.content": "{kilobytes}KB",
    "tool.title.createSchedule": "예약 작업 만들기",
    "tool.title.listSchedules": "예약 작업 보기",
    "tool.title.deleteSchedule": "예약 작업 삭제",
    "tool.title.updateSchedule": "예약 작업 수정",
    "detail.state": "상태",
    "detail.todo.completed": "완료",
    "detail.todo.in_progress": "진행 중",
    "detail.todo.pending": "처리 대기",
    "detail.todo.empty": "작업 목록이 비어 있습니다",
    "todo.diff.initial": "첫 기록",
    "todo.diff.compare": "지난 목록과 비교",
    "todo.diff.unavailable": "이전 목록을 볼 수 없습니다",
    "todo.diff.noChanges": "목록에 변화가 없습니다",
    "todo.diff.added": "{count}개 추가",
    "todo.diff.updated": "{count}개 업데이트",
    "todo.diff.removed": "{count}개 제거",
    "todo.diff.unchanged": "{count}개 변화 없음",
    "todo.diff.addedItem": "추가",
    "todo.diff.updatedItem": "상태 변경",
    "todo.diff.movedItem": "순서 조정",
    "todo.diff.removedItem": "제거",
    "detail.goal.empty": "목표 없음",
    "detail.goal.active": "진행 중",
    "detail.goal.disarmed": "계속하기 대기 중",
    "detail.goal.paused": "일시 중지됨",
    "detail.goal.blocked": "막힘",
    "detail.goal.complete": "완료",
    "detail.goal.rounds": "실행 턴",
    "detail.goal.reason": "막힌 이유",
    "detail.days": "{count}일",
    "detail.hours": "{count}시간",
    "detail.minutes": "{count}분",
    "detail.seconds": "{count}초",
    "detail.schedule.once": "한 번",
    "detail.schedule.every": "{interval}마다",
    "detail.schedule.when": "예정 시간",
    "detail.schedule.frequency": "반복",
    "detail.schedule.scheduled": "실행 대기 중",
    "detail.schedule.overdue": "예정 시간이 지났습니다. 세션이 다시 열리기를 기다리고 있습니다",
    "detail.schedule.empty": "예약 작업 없음",
    "detail.schedule.deleted": "삭제됨",
    "detail.schedule.count": "예약 작업 {count}개",
    "detail.schedule.daily": "매일 {time}({zone})",
    "detail.schedule.weekly": "매주 {days} {time}({zone})",
    "detail.schedule.cron": "Cron {expression}（{zone}）",
    "detail.weekday.1": "월",
    "detail.weekday.2": "화",
    "detail.weekday.3": "수",
    "detail.weekday.4": "목",
    "detail.weekday.5": "금",
    "detail.weekday.6": "토",
    "detail.weekday.7": "일",
    "detail.weekday.join": "、",
    "tool.title.inspectProviders": "검사 공급자 확인",
    "tool.title.queryRuntime": "런타임 조회",
    "tool.title.inspectPlugins": "동적 플러그인 확인",
    "tool.title.workflow": "워크플로 실행",
    "tool.title.ralph": "반복 워크플로 실행",
    "tool.title.readEvent": "이벤트 읽기",
    "tool.title.searchEvents": "이벤트 검색",
    "tool.title.traceEvent": "이벤트 추적",
    "tool.title.searchSessions": "세션 검색",
    "tool.title.traceSession": "세션 추적",
    "tool.title.listModels": "사용 가능한 모델 보기",
    "tool.title.subagent": "하위 에이전트 만들기",
    "tool.title.listAgents": "하위 에이전트 보기",
    "tool.title.sendMessage": "메시지 보내기",
    "tool.title.interruptAgent": "에이전트 중단",
    "tool.title.listJobs": "백그라운드 작업 보기",
    "tool.title.readJob": "작업 출력 읽기",
    "tool.title.killJob": "백그라운드 작업 취소",
    "tool.title.openTerminal": "터미널 만들기",
    "tool.title.readTerminal": "터미널 읽기",
    "tool.title.listTerminals": "터미널 보기",
    "tool.title.signalTerminal": "터미널 신호 보내기",
    "tool.title.closeTerminal": "터미널 닫기",
    "tool.title.lsp": "코드 심볼 조회",
    "tool.title.findDefinition": "정의 찾기",
    "tool.title.findReferences": "참조 찾기",
    "tool.title.findImplementation": "구현 찾기",
    "tool.title.hoverSymbol": "심볼 정보 보기",
    "tool.title.spawnTeammate": "팀원 만들기",
    "tool.title.createTeamTask": "팀 작업 만들기",
    "tool.title.getTeamTask": "팀 작업 읽기",
    "tool.title.updateTeamTask": "팀 작업 업데이트",
    "tool.title.listTeamTasks": "팀 작업 보기",
    "tool.title.waitAgent": "하위 에이전트 기다리기",
    "detail.recordedResult": "호출 결과",
    "detail.empty": "결과 없음",
    "detail.none": "없음",
    "detail.yes": "예",
    "detail.no": "아니요",
    "detail.moreInInspect": "{count}개 더 있습니다. ‘보기’에서 읽을 수 있습니다",
    "detail.status.running": "실행 중",
    "detail.status.idle": "대기 중",
    "detail.status.ready": "준비됨",
    "detail.status.inactive": "실행 안 함",
    "detail.status.provisioning": "준비 중",
    "detail.status.failed": "실패",
    "detail.status.completed": "완료",
    "detail.status.deleted": "삭제됨",
    "detail.status.killed": "취소됨",
    "detail.status.accepted": "접수됨",
    "detail.status.queued": "대기열에 등록됨",
    "detail.status.exited": "종료됨",
    "detail.field.id": "ID",
    "detail.field.revision": "버전",
    "detail.field.platform": "플랫폼",
    "detail.field.provider": "공급자",
    "detail.field.model": "모델",
    "detail.field.role": "역할",
    "detail.field.context": "컨텍스트",
    "detail.field.owner": "담당자",
    "detail.field.ready": "시작 가능",
    "detail.field.dependencies": "선행 작업",
    "detail.field.writeScopes": "파일 범위",
    "detail.field.warnings": "경고",
    "detail.field.diagnostics": "진단",
    "detail.field.methods": "메서드",
    "detail.field.inputSchema": "입력 스키마",
    "detail.field.outputSchema": "출력 스키마",
    "detail.field.currentPackage": "현재 패키지",
    "detail.field.nextPackage": "실행 대기 패키지",
    "detail.field.latestRun": "최근 실행",
    "detail.field.packages": "버전 패키지",
    "detail.field.registrations": "등록 항목",
    "detail.field.props": "속성",
    "detail.field.data": "데이터",
    "detail.field.source": "출처",
    "detail.field.content": "내용",
    "detail.field.message": "메시지",
    "detail.field.messageId": "메시지 ID",
    "detail.field.root": "루트 노드",
    "detail.field.pid": "프로세스 ID",
    "detail.field.type": "유형",
    "detail.field.time": "시간",
    "detail.field.seq": "이벤트 번호",
    "detail.field.turn": "턴",
    "detail.field.step": "단계",
    "detail.field.callId": "호출 ID",
    "detail.field.agents": "시작한 에이전트 수",
    "detail.field.result": "결과",
    "detail.field.parent": "상위",
    "detail.field.depth": "계층",
    "detail.field.exitCode": "종료 코드",
    "detail.field.signal": "신호",
    "detail.field.previousStatus": "중단 전 상태",
    "detail.field.agent": "에이전트 ID",
    "detail.field.job": "작업 ID",
    "detail.field.task": "작업 내용",
    "detail.field.processGroup": "프로세스 그룹",
    "detail.field.availability": "사용 가능 상태",
    "detail.field.bestMatch": "가장 관련 있는 이벤트",
    "detail.field.target": "대상 이벤트",
    "detail.field.surface": "기록 상태",
    "detail.agents.count": "에이전트 {count}개",
    "detail.jobs.count": "백그라운드 작업 {count}개",
    "detail.terminals.count": "터미널 {count}개",
    "detail.tasks.count": "팀 작업 {count}개",
    "detail.tasks.nextPage": "작업이 더 있습니다. 다음 페이지 위치: {cursor}",
    "detail.locations.count": "위치 {count}곳",
    "detail.location": "{line}행 {column}열",
    "detail.receipt.delivered": "메시지 전달됨",
    "detail.receipt.interrupt": "중단 요청함",
    "detail.receipt.started": "시작됨",
    "detail.receipt.cancel": "취소 요청함",
    "detail.receipt.alreadyFinished": "이미 완료됨",
    "detail.receipt.signal": "신호 보냄",
    "detail.receipt.closed": "닫힘",
    "detail.receipt.closing": "닫는 중",
    "detail.wait.noProgress": "실행 중인 하위 에이전트가 없습니다",
    "detail.wait.title": "하위 에이전트 상태",
    "detail.wait.timeout": "대기 시간 초과",
    "detail.wait.changed": "변화 감지됨",
    "detail.agent.reply": "에이전트 응답",
    "detail.models.title": "사용 가능한 모델",
    "detail.output.lines": "{begin}–{end}행 / 전체 {total}행",
    "detail.output.truncated": "출력이 잘림",
    "detail.providers.count": "검사 공급자 {count}개",
    "detail.plugins.count": "동적 플러그인 {count}개",
    "detail.workflow.script": "워크플로 스크립트",
    "detail.ralph.reportedComplete": "에이전트가 완료를 보고함",
    "detail.ralph.reportedBlocker": "에이전트가 작업을 막는 문제를 보고함",
    "detail.ralph.limit": "턴 한도에 도달함",
    "detail.report.nextSteps": "남은 할 일",
    "detail.trace.replacedBy": "다음으로 대체됨",
    "detail.trace.replacementChain": "대체 체인",
    "detail.trace.replaces": "대체된 이벤트",
    "detail.trace.sources": "참조 출처",
    "detail.trace.derived": "파생 이벤트",
    "detail.trace.ancestors": "상위 세션",
    "detail.trace.descendants": "하위 세션",
    "detail.matches.count": "일치 {count}개",
    "detail.matches.capped": "결과 한도에 도달했습니다. 검색 범위를 좁혀 보세요",
    "detail.event.neighbors": "앞뒤 이벤트",
    "todo.completed": "{done}/{total} 완료",
    "command.attachmentsUnsupported": "/{command}에는 첨부를 쓸 수 없습니다. 먼저 첨부를 빼 주세요",
    "ask.rowTitle": "질문",
    "ask.waiting": "답변 기다리는 중",
    "ask.pending": "작업은 계속 진행 중입니다. 지금도 답변할 수 있습니다",
    "ask.pendingDetail": "대기 중인 질문은 입력창에서 계속 답할 수 있습니다",
    "ask.reopen": "답변",
    "ask.review": "답변 보기",
    "ask.closed": "끝남",
    "ask.closedDetail": "이 질문은 끝났습니다. 결과는 아래 대화를 보세요",
    "ask.cancelled": "취소됨",
    "ask.cancelledDetail": "이번 턴이 취소되어 답변을 제출하지 않았습니다",
    "ask.interrupted": "중단됨",
    "ask.interruptedDetail": "이번 턴이 중단되어 답변을 제출하지 않았습니다",
    "ask.answered": "{answered}/{total} 답변함",
    "ask.skipped": "답하지 않음",
    "bash.running": "실행 중",
    "bash.failed": "실패",
    "bash.stopped": "중지됨",
    "row.running": "실행 중",
    "row.preparing": "호출 준비 중",
    "row.failed": "실패",
    "row.stopped": "중지됨",
    "row.commandArguments": "명령 인자",
    "row.input": "입력",
    "row.output": "출력",
    "row.inspect": "보기",
    "row.imageSize": "{width}x{height}px, {bytes}바이트",
    "row.imageSizeDownscaled": "{width}x{height}px({originalWidth}x{originalHeight}px에서 축소), {bytes}바이트",
    "tool.title.search": "검색",
    "tool.title.read": "읽기",
    "tool.title.bash": "명령 실행",
    "tool.title.write": "쓰기",
    "tool.title.edit": "편집",
    "tool.title.code": "코드",
    "tool.title.generic": "도구 호출",
    "tool.title.inspect": "Cordis 환경 조회",
    "tool.title.runCordis": "Cordis 플러그인 실행",
    "tool.title.stopCordis": "Cordis 플러그인 중지",
    "tool.title.removeCordis": "Cordis 플러그인 제거",
    "tool.title.pwsh": "명령 실행",
    "tool.title.readImage": "이미지 읽기",
    "tool.title.grep": "파일 내용 검색",
    "tool.title.glob": "파일 찾기",
    "tool.title.webSearch": "웹 검색",
    "tool.title.webFetch": "웹페이지 가져오기",
    "tool.autoReviewRejected": "자동 검토에서 거부됨",
    "tool.autoReviewNotExecuted": "도구를 실행하지 않았습니다. 이유: {reason}",
    "tool.autoReviewReasonFallback": "자동 검토에서 이 작업을 허용하지 않았습니다",
    "diff.collapseAria": "차이 접기",
    "diff.expandAria": "나머지 차이 {count}줄 펼치기",
    "diff.expandRest": "… 나머지 {count}줄",
    "read.window": "{shown} / {total}줄 표시",
    "read.collapseAria": "내용 접기",
    "read.expandAria": "나머지 {count}줄 펼치기",
    "read.expandRest": "… 나머지 {count}줄",
    "search.paths": "경로 {shown}개",
    "search.paths.truncated": "전체 {total}개 중 경로 {shown}개 표시",
    "search.matches": "일치 {shown}곳 · 파일 {files}개",
    "search.matches.truncated": "전체 {total}곳 중 {shown}곳 표시 · 파일 {files}개",
    "search.noResults": "결과 없음",
    "search.collapseAria": "결과 접기",
    "search.expandAria": "나머지 결과 {count}줄 펼치기",
    "search.expandRest": "… 나머지 {count}줄",
    "web.noResults": "결과를 찾지 못했습니다",
    "web.sourcesTruncated": "출처 목록이 잘림",
    "web.http": "HTTP",
    "web.contentTruncated": "내용이 잘림",
    "details.running": "실행 중…",
    "queue.count": "대기 중인 메시지 {n}개",
    "queue.sending": "보내는 중…",
    "queue.image": "대기 중인 메시지 이미지",
    "queue.file": "대기 중인 파일 {name}",
    "queue.edit": "대기 중인 메시지 편집",
    "queue.edit.unsupported": "텍스트가 아닌 내용이 있어 아직 편집할 수 없습니다",
    "queue.save": "대기 중인 메시지 저장",
    "queue.cancelEdit": "편집 취소",
    "queue.remove": "대기 중인 메시지 삭제",
    "queue.steer": "끼어들어 보내기",
    "queue.steer.unavailable": "실행 중일 때만 끼어들어 보낼 수 있습니다",
    "error.sessionInUse": "이 세션을 다른 곳에서 사용 중입니다. 다른 DSH(dsh web, 데스크톱 앱 등)가 실행 중이면 종료한 뒤 다시 시도하세요.",
    "queue.editFailed": "편집하지 못했습니다. 메시지가 이미 전송 중일 수 있습니다.",
    "queue.removeFailed": "삭제하지 못했습니다. 메시지가 이미 전송 중일 수 있습니다.",
    "queue.steerFailed": "끼어들어 보내기에 실패했습니다. 다시 시도하세요.",
    "terminal.signal": "신호 {signal}",
    "terminal.exitCode": "종료 코드 {code}",
    "terminal.noExitCode": "정상적으로 종료되지 않음",
    "terminal.commandLine": "명령 {n}번째 줄",
    "terminal.running": "실행 중",
    "terminal.failed": "실패",
    "terminal.done": "완료",
    "terminal.noOutput": "출력 없음",
    "terminal.collapseAria": "출력 접기",
    "terminal.expandAria": "나머지 출력 {n}줄 펼치기",
    "terminal.expandRest": "… 나머지 {n}줄",
    "terminal.sendInput": "(입력 보냄)",
    "terminal.session": "터미널 {sessionId}",
    "quote.remove": "인용 제거",
    "input.sending": "메시지 보내는 중",
    "tool.title.viewSchedule": "예약 작업 조회",
    "tool.title.editSchedule": "예약 작업 편집",
    "detail.schedule.active": "켜짐",
    "detail.schedule.paused": "일시 중지됨",
    "detail.schedule.ended": "종료됨",
    "detail.schedule.custom": "사용자 지정",
    "tool.title.applyPatch": "패치 적용"
  },
  cordis: {
    "row.defineTitle": "Cordis 플러그인 등록",
    "a11y.preparing": "Cordis 도구 호출 준비 중",
    "row.runTitle": "Cordis 플러그인 실행",
    "row.updateTitle": "Cordis 플러그인 업데이트",
    "row.stopTitle": "Cordis 플러그인 중지",
    "row.removeTitle": "Cordis 플러그인 제거",
    "purpose.missing": "(용도 미입력)",
    "status.idle": "활성화 대기",
    "status.awaitingApproval": "승인 대기",
    "status.failed": "실행 실패",
    "status.clientPending": "클라이언트 활성화 대기",
    "status.running": "실행 중",
    "status.removed": "제거됨",
    "status.superseded": "업데이트 있음",
    "run.removed": "패키지가 더 이상 없습니다",
    "run.superseded": "새 실행 카드가 아래에 있습니다",
    "panel.hint": "왼쪽 아래 설정 위에 있는 Cordis 패널에서 실행을 제어합니다",
    "panel.plugins.aria": "Cordis 플러그인",
    "panel.approvals.aria": "Cordis 승인",
    "panel.trigger": "Cordis 플러그인",
    "panel.runningCount": "{count}개 실행 중",
    "panel.title": "Cordis 플러그인",
    "panel.empty": "아직 등록한 플러그인이 없습니다",
    "panel.loading": "읽는 중…",
    "panel.readFailed": "플러그인 목록 읽기 실패: {message}",
    "panel.group.current": "현재 세션",
    "panel.group.others": "다른 세션",
    "panel.version": "버전",
    "panel.current": "현재: {packageId}",
    "panel.next": "전환 대기: {packageId}",
    "action.approve": "허용",
    "action.approveOnce": "이 버전만 허용",
    "action.approvePlugin": "이 플러그인의 이후 버전도 허용",
    "action.decline": "거부",
    "action.run": "실행",
    "action.stop": "중지",
    "action.remove": "제거",
    "action.retry": "다시 시도",
    "action.rollback": "되돌리기",
    "action.inspect": "보기",
    "render.failedAbdicated": "{slot} 렌더링 실패, 기본 화면으로 되돌렸습니다: ",
    "render.failedHeld": "{slot} 렌더링 실패: ",
    "a11y.defining": "플러그인 정의 중",
    "a11y.failed": "정의 실패",
    "a11y.stopped": "정의 중단됨",
    "body.source": "플러그인 코드",
    "body.hostCode": "호스트",
    "body.clientCode": "클라이언트",
    "body.output": "결과",
    "body.copy": "복사",
    "body.copied": "복사됨"
  },
  deliverables: {
    "presented.nativeUnavailable": "이 파일은 호스트에서 열 수 있는 경로가 없습니다. 사이드바에서 미리 보세요",
    "presented.revealError": "파일 탐색기에서 위치를 표시하지 못했습니다. 다시 시도하세요",
    "presented.directoryError": "파일이 있는 폴더를 열 수 없습니다. 다시 시도하세요",
    "presented.directoryOpening": "파일이 있는 폴더 여는 중…",
    "presented.directoryOpened": "파일이 있는 폴더를 열도록 요청했습니다",
    "presented.revealed": "파일 탐색기에서 위치를 표시하도록 요청했습니다",
    "presented.revealing": "파일 탐색기에서 위치 표시 중…",
    "presented.unavailable": "이 호스트에는 데스크톱이 없어 외부 프로그램으로 파일이나 폴더를 열 수 없습니다. 파일은 사이드바에서 미리 볼 수 있습니다",
    "presented.retry": "다시 시도",
    "presented.hostError": "호스트 데스크톱 정보를 읽을 수 없습니다",
    "presented.preview": "사이드바에서 미리보기",
    "presented.previewButton": "사이드바에서 {name} 열기",
    "presented.previewCard": "사이드바에서 {name} 미리보기",
    "presented.all": "전체 파일 {count}개",
    "presented.expandAria": "결과 파일 {count}개 모두 펼치기",
    "presented.collapse": "접기",
    "presented.collapseAria": "결과 파일 목록 접기",
    "presented.opening": "여는 중…",
    "presented.opened": "열기 요청함",
    "presented.error": "열기 실패. 눌러서 다시 시도",
    "presented.file": "파일",
    "row.title": "결과 파일",
    "row.running": "전달 중",
    "row.preparing": "전달 준비 중",
    "row.ok": "전달됨",
    "row.error": "전달 실패",
    "row.stopped": "중단됨",
    "row.inspect": "호출 보기",
    "changes.title": "파일 {count}개 편집함",
    "changes.singleTitle": "{name} 편집함",
    "changes.added": "+{count}",
    "changes.deleted": "-{count}",
    "changes.binary": "바이너리",
    "changes.openReview": "사이드바에서 이번 턴 변경 보기",
    "changes.all": "전체 파일 {count}개",
    "changes.expandAria": "변경된 파일 {count}개 모두 펼치기",
    "changes.collapse": "접기",
    "changes.collapseAria": "변경된 파일 목록 접기",
    "changes.oversized": "너무 큼",
    "changes.viewDiff": "{name}의 변경 보기",
    "review.title": "{turn}번째 턴 변경",
    "review.selectFile": "볼 파일 선택",
    "review.split": "좌우 비교로 바꾸기",
    "review.unified": "한 열로 비교하기",
    "review.splitAria": "좌우 비교",
    "review.wrap": "자동 줄바꿈 켜기",
    "review.nowrap": "자동 줄바꿈 끄기",
    "review.wrapAria": "자동 줄바꿈",
    "review.openFile": "사이드바에서 파일 전체 열기",
    "review.openFileAria": "사이드바에서 {name} 열기",
    "diff.loading": "변경 읽는 중…",
    "diff.missing": "이번 턴의 변경 내용은 더 이상 볼 수 없습니다",
    "diff.error": "변경을 읽을 수 없습니다",
    "diff.binary": "바이너리 파일이라 변경을 보여 줄 수 없습니다",
    "diff.oversized": "파일이 너무 커서 변경을 보여 줄 수 없습니다",
    "diff.created": "이번 턴에 새로 만든 파일",
    "diff.deleted": "이번 턴에 삭제한 파일",
    "diff.unchanged": "양쪽 내용이 같습니다",
    "diff.coarse": "줄 단위 비교 시간이 초과되어 파일 전체가 교체된 것으로 표시합니다",
    "diff.truncated": "앞쪽 {count}줄만 표시"
  },
  entryCustomization: {
    install: "플러그인 더 둘러보기",
    create: "나만의 플러그인 만들기",
    "createPrompt.sidebar": "왼쪽 사이드바 메뉴가 있는 DSH 플러그인을 만들어 주세요.",
    "createPrompt.conversation": "DSH 세션 보기 플러그인을 만들어 주세요.",
    "createPrompt.rightbar": "오른쪽 사이드바 메뉴가 있는 DSH 플러그인을 만들어 주세요."
  },
  goal: {
    "phase.active": "진행 중인 목표",
    "phase.active.disarmed": "일시 중지된 목표",
    "phase.paused": "일시 중지된 목표",
    "phase.blocked": "막힌 목표",
    "objective.aria": "목표 내용",
    "commandInput.aria": "명령 입력",
    "action.save": "목표 저장",
    "action.cancel": "편집 취소",
    "action.pause": "목표 일시 중지",
    "action.resume": "목표 다시 시작",
    "action.edit": "목표 편집",
    "action.clear": "목표 지우기"
  },
  "slash.menu": {
    command: "명령",
    skill: "스킬",
    subagent: "하위 에이전트",
    loading: "불러오는 중…",
    "drill.aria": "폴더로 들어가기",
    "drill.hint": "폴더로 들어가기",
    "drill.key": "Tab",
    "crumbs.aria": "폴더 이동",
    "suggestions.aria": "추천 후보 띄우기"
  },
  job: {
    "count.live.one": "백그라운드 작업 {count}개 실행 중",
    "count.live.other": "백그라운드 작업 {count}개 실행 중",
    "count.idle.one": "백그라운드 작업 {count}개",
    "count.idle.other": "백그라운드 작업 {count}개",
    "list.aria": "백그라운드 작업",
    "section.live": "진행 중",
    "section.settledCount": "{count}개 종료",
    "section.clear": "비우기",
    "row.expandAria": "{label} 실시간 출력 펼치기",
    "row.collapseAria": "{label} 실시간 출력 접기",
    "kill.stop": "작업 {label} 중지",
    "kill.confirm": "한 번 더 누르면 중지합니다",
    "kill.confirmAction": "중지 확인",
    "kill.failed": "중지 실패",
    "status.running": "실행 중",
    "status.stopping": "중지하는 중",
    "status.completed": "완료",
    "status.killed": "취소됨",
    "status.failed": "실패함",
    "duration.seconds": "{seconds}초",
    "duration.minutes": "{minutes}분 {seconds}초",
    "duration.hours": "{hours}시간 {minutes}분",
    "duration.title.live": "{duration} 동안 실행 중",
    "duration.title.done": "소요 시간 {duration}",
    "output.gap": "……이전 출력은 버렸습니다……",
    "output.error": "실시간 출력 스트림이 끊겼습니다: {error}",
    "terminal.signal": "신호 {signal}",
    "terminal.exitCode": "종료 코드 {code}",
    "terminal.noExitCode": "정상적으로 종료되지 않음",
    "terminal.commandLine": "명령 {n}번째 줄",
    "terminal.running": "실행 중",
    "terminal.failed": "실패함",
    "terminal.done": "완료",
    "terminal.copy": "복사",
    "terminal.copied": "복사됨",
    "terminal.noOutput": "(출력 없음)",
    "terminal.collapse": "접기",
    "terminal.collapseAria": "출력 접기",
    "terminal.expand": "나머지 {n}줄 펼치기",
    "terminal.expandAria": "접힌 출력 {n}줄 펼치기"
  },
  "shortcuts.layout": {
    toggle: "왼쪽 사이드바 펼치기/접기"
  },
  feedback: {
    "action.like": "좋은 답변",
    "action.likeActive": "표시 취소",
    "action.dislike": "문제 있는 답변",
    "action.dislikeActive": "표시 취소",
    "dialog.title": "피드백 보내기",
    "dialog.categories": "피드백 분류",
    "dialog.detail": "피드백 내용",
    "dialog.hint": "의견을 자세히 적어 주세요. 현재 대화 로그가 함께 전송됩니다",
    "category.task-result": "작업 결과",
    "category.instruction-following": "지시 이해와 수행",
    "category.product-interaction": "제품 기능과 사용성",
    "category.service-stability": "안정성과 속도",
    "category.resource-cost": "자원 사용과 비용",
    "category.security-privacy-permission": "보안·개인정보·권한",
    "category.other": "기타",
    "toast.recorded": "피드백 감사합니다",
    "error.conflict": "다른 곳에서 피드백이 수정되어 최신 내용을 표시합니다",
    "error.load": "피드백 상태를 불러오지 못했습니다",
    "error.generic": "피드백을 저장하지 못했습니다",
    "error.noteTooLarge": "설명이 너무 깁니다. 줄인 뒤 보내 주세요"
  },
  model: {
    "provider.account": "DeepSeek 계정",
    "command.label": "모델",
    "command.description": "이 세션에서 쓸 모델 선택",
    "option.loadError": "목록 불러오기 실패: {message}",
    "trigger.fallback": "모델을 고르세요",
    "trigger.loading": "모델 불러오는 중…",
    "trigger.selectAria": "모델을 고르세요",
    "trigger.aria": "모델 선택, 현재 {model}",
    "trigger.ariaEffort": "모델 선택, 현재 {model}, 추론 수준 {effort}",
    "menu.aria": "모델과 추론 수준",
    "menu.model": "모델",
    "menu.effort": "추론 수준",
    "effort.providerDefault": "공급자 기본값",
    "status.loading": "모델 목록 새로 고치는 중…",
    "error.action": "모델 작업 실패: {message}",
    "error.sessionInUse": "이 세션을 다른 곳에서 사용 중입니다. 다른 DSH(dsh web, 데스크톱 앱 등)가 실행 중이면 종료한 뒤 다시 시도하세요.",
    "action.reload": "다시 불러오기",
    "warning.groupLoad": "{name} 불러오기 실패: {message}",
    "search.placeholder": "모델 검색…",
    "search.clear": "검색 지우기",
    "search.empty": "일치하는 모델이 없습니다.",
    "empty.models": "쓸 수 있는 모델이 없습니다",
    "empty.efforts": "현재 모델은 추론 수준 설정을 지원하지 않습니다."
  },
  "open-in-app": {
    "open.title": "{app}에서 열기",
    "path.appDefault": "{app}(기본)",
    "path.appsError": "앱 목록을 가져올 수 없습니다",
    "shortcut.busy": "작업 공간 여는 중",
    "shortcut.unavailable": "현재 작업 공간이나 로컬 앱을 쓸 수 없습니다",
    "open.tooltip": "로컬에서 열기",
    "path.open": "열기",
    "path.more": "다른 방법으로 열기",
    "path.reveal": "파일 위치 보기",
    "path.openError": "열기 실패. 다시 시도하세요",
    "path.revealError": "파일 위치를 보여 줄 수 없습니다. 다시 시도하세요",
    "app.cursor": "Cursor",
    "app.vscode": "VS Code",
    "app.vscodeinsiders": "VS Code Insiders",
    "app.windsurf": "Windsurf",
    "app.zed": "Zed",
    "app.sublimetext": "Sublime Text",
    "app.xcode": "Xcode",
    "app.androidstudio": "Android Studio",
    "app.intellij": "IntelliJ IDEA",
    "app.pycharm": "PyCharm",
    "app.webstorm": "WebStorm",
    "app.phpstorm": "PhpStorm",
    "app.goland": "GoLand",
    "app.rider": "Rider",
    "app.rustrover": "RustRover",
    "app.fork": "Fork",
    "app.sourcetree": "Sourcetree",
    "app.github": "GitHub Desktop",
    "app.tower": "Tower",
    "app.gitkraken": "GitKraken",
    "app.smartgit": "SmartGit",
    "app.sublimemerge": "Sublime Merge",
    "app.ghostty": "Ghostty",
    "app.warp": "Warp",
    "app.iterm": "iTerm2",
    "app.kitty": "kitty",
    "app.windowsterminal": "Windows Terminal",
    "app.gitbash": "Git Bash",
    "app.gnometerminal": "GNOME Terminal",
    "app.konsole": "Konsole",
    "app.finder": "Finder",
    "app.explorer": "파일 탐색기",
    "app.filemanager": "파일 관리자",
    "app.terminal": "터미널",
    "menu.openInSidebar": "사이드바에서 열기",
    "menu.openInFloat": "떠 있는 패널에서 열기",
    "menu.finder": "Finder에서 보기",
    "menu.reveal": "폴더에서 보기",
    "menu.defaultApp": "기본 앱으로 열기",
    "menu.external": "외부 브라우저에서 열기",
    "menu.copyLink": "링크 주소 복사",
    "menu.copyPath": "파일 경로 복사",
    "menu.copyDirectoryPath": "폴더 경로 복사",
    "menu.copied": "복사됨",
    "menu.copyFailed": "복사하지 못했습니다. 복사할 내용을 확인한 뒤 다시 시도하세요.",
    "path.opened": "다른 기기에서 열었습니다",
    "path.revealed": "다른 기기에서 파일 위치를 표시했습니다"
  },
  "permission.access": {
    mode: "접근 모드, 현재: {name}",
    close: "닫기",
    "preset.readOnly": "보기만 가능",
    "preset.workspaceWrite": "작업 공간 안에서 수정",
    "preset.fullAccess": "전체 권한",
    "confirm.title": "전체 권한을 켤까요?",
    "confirm.description": "전체 권한을 켜면 에이전트가 확인을 요청하는 단계가 줄어듭니다. 민감한 작업, 파일 수정, 외부 명령을 포함해 더 많은 작업을 바로 실행할 수 있으므로 믿을 수 있는 작업에만 사용하세요.",
    "confirm.acknowledge": "위험을 이해했고 계속하겠습니다",
    "confirm.cancel": "취소",
    "confirm.enable": "전체 권한 켜기",
    "auto.label": "자동 검토",
    "auto.badge": "EXP",
    "auto.description": "샌드박스 없이 실행하는 실험 기능입니다. 기본 도구 호출과 PTC 내부 호출마다 같은 모델이 먼저 검토합니다.",
    "auto.confirm.title": "자동 검토(실험)를 켤까요?",
    "auto.confirm.description": "자동 검토는 샌드박스를 쓰지 않습니다. 기본 도구 호출과 PTC 내부 호출마다 현재 에이전트와 같은 모델이 먼저 검토합니다. 거부된 호출은 사용자가 승인하거나 거부합니다. 아직 실험 기능이라 잘못 허용하거나 거부할 수 있으며 토큰을 더 사용합니다.",
    "auto.confirm.acknowledge": "이 위험을 이해했고 계속하겠습니다",
    "auto.confirm.enable": "자동 검토 켜기"
  },
  "settings.permission": {
    title: "권한",
    description: "새 세션의 기본 권한 모드 선택",
    loading: "불러오는 중",
    unavailable: "쓸 수 없음",
    "preset.readOnly": "보기만 가능",
    "preset.workspaceWrite": "작업 공간 안에서 수정",
    "preset.fullAccess": "전체 권한",
    "confirm.title": "전체 권한을 켤까요?",
    "confirm.description": "전체 권한을 켜면 새 세션에서 확인을 요청하는 단계가 줄어듭니다. 민감한 작업, 파일 수정, 외부 명령을 포함해 더 많은 작업을 바로 실행할 수 있으므로 믿을 수 있는 작업에만 사용하세요.",
    "confirm.acknowledge": "위험을 이해했고 계속하겠습니다",
    "confirm.cancel": "취소",
    "confirm.enable": "전체 권한 켜기"
  },
  plan: {
    "chip.label": "계획",
    "preview.title": "계획",
    "preview.document": "계획 · Markdown",
    "preview.action": "열기",
    "preview.open": "사이드바에서 계획 열기",
    "preview.full": "전체 보기",
    "preview.openNamed": "계획 열기: {title}",
    "preview.loading": "계획 읽는 중…",
    "preview.failed": "계획을 읽을 수 없습니다",
    "preview.invalidAddress": "계획 주소가 올바르지 않습니다",
    "preview.historyUnavailable": "세션 기록을 읽을 수 없습니다",
    "preview.notFound": "이 계획을 찾지 못했습니다",
    "preview.unavailable": "계획 미리보기를 쓸 수 없습니다",
    "preview.expired": "임시 계획 미리보기가 만료되었습니다. 아직 승인을 기다리는 카드에서 다시 여세요.",
    "chip.on.aria": "계획 모드가 켜져 있습니다. 누르면 끕니다",
    "chip.on.title": "계획 모드 켜짐 — 눌러서 끄기(/plan off)",
    "chip.exitFailed": "계획 모드를 끄지 못했습니다"
  },
  pluginManager: {
    panel: "플러그인",
    title: "플러그인",
    intro: "플러그인 설치, 활성화, 설정",
    infoLabel: "플러그인 설명",
    infoDescription: "공식 플러그인을 설정하거나 다른 플러그인을 설치·관리합니다. 기본 제공 플러그인 목록과 실행 상태는 ‘설정 → 기본 제공 플러그인’에서 확인할 수 있습니다",
    loading: "플러그인 읽는 중…",
    error: "네트워크 문제로 플러그인을 모두 읽지 못했을 수 있습니다",
    unavailable: "이 배포에는 관리할 프로필이 없어 플러그인을 설치하거나 켜고 끌 수 없습니다.",
    retry: "다시 시도",
    refresh: "새로 고침",
    refreshError: "새로 고침 실패. 다시 시도하세요",
    empty: "설치한 플러그인이 없습니다.",
    addPlugin: "플러그인 추가",
    chooseAddMethod: "플러그인 추가 방법 선택",
    installExisting: "서드파티 플러그인 설치",
    installExistingDescription: "npm 패키지, Git 저장소, 로컬 폴더를 지원합니다",
    restartNotice: "변경을 적용하려면 DSH를 다시 시작하세요. {reason}",
    restartReasonNoHmr: "이 프로필은 시작할 때만 변경을 적용합니다.",
    restartReasonPackageMoved: "설치된 플러그인 패키지가 다른 폴더를 가리키거나, 변경이 DSH 설치에 포함된 패키지를 대체했습니다. 다른 위치에서 설치하기 전에 먼저 제거하세요.",
    restartReasonHostModule: "DSH가 직접 불러온 모듈과 관련된 변경입니다.",
    restartReasonUnmanagedPlugin: "플러그인 목록에서 관리하지 않는 플러그인과 관련된 변경입니다.",
    restartReasonModuleComparison: "DSH가 불러온 플러그인을 디스크의 파일과 비교할 수 없습니다.",
    overriddenNotice: "{name}은(는) 저장됐지만 우선순위가 더 높은 설정에 덮여 지금은 적용되지 않습니다",
    bundlesTitle: "설치한 플러그인",
    basicTitle: "기본 제공 플러그인 설정",
    extensionsTitle: "실험적 플러그인",
    moreTitle: "실험적 플러그인",
    moreAction: "더 보기",
    tabsLabel: "플러그인 보기",
    installedTab: "설치됨",
    statusProblem: "이상",
    statusBeta: "실험적",
    reasonLabel: "원인",
    metadataError: "패키지 메타 정보 오류: {error}",
    previewAlt: "{name} 기능 미리보기",
    previewUnavailable: "기능 그림을 보여 줄 수 없습니다",
    versionTag: "v{version}",
    partsLabel: "포함된 구성 요소",
    sourceTitle: "출처 정보",
    sourceSpec: "코드 출처",
    sourceBuiltIn: "기본 제공",
    sourceVersion: "현재 버전",
    partsEmpty: "이 플러그인 패키지에는 구성 요소가 없습니다.",
    partsCountTotal: "총 {count}개",
    partsCountRunning: "{count}개 실행 중",
    partsCountOff: "{count}개 꺼짐",
    partOff: "꺼짐",
    partsCountFailed: "{count}개 이상",
    partsFilter: "구성 요소 필터",
    partsFilterEmpty: "일치하는 구성 요소가 없습니다.",
    partToggle: "구성 요소 {name} 켜기",
    rowPhasePending: "의존성 대기 중",
    rowPhaseLoading: "불러오는 중",
    rowPhaseActive: "실행 중",
    rowPhaseFailed: "이상",
    rowPhaseUnloading: "제거 중",
    enableToggle: "{name} 켜기",
    openDetail: "{name} 보기",
    backToList: "플러그인으로 돌아가기",
    crumbRoot: "플러그인",
    backToPackage: "{name} 화면으로 돌아가기",
    configureRow: "{name} 설정",
    rowStateIdle: "실행 안 함",
    uninstall: "제거",
    uninstallLabel: "{name} 제거",
    installTitle: "플러그인 추가",
    installDescription: "플러그인 패키지 이름, GitHub 저장소 주소, 로컬 폴더 경로를 입력하세요.",
    installSpecLabel: "패키지 이름 또는 주소",
    installSpecPlaceholder: "예: dsh-plugin-whale-pet",
    installGuideToggle: "플러그인 설치 안내와 예시",
    installGuideHide: "안내 접기",
    installGuideIdTitle: "플러그인 npm 패키지 이름 입력",
    installGuideIdExample: "dsh-plugin-whale-pet",
    installGuideIdHint: "npm 패키지 이름(dsh-xxx 또는 @작성자/플러그인이름)을 입력하세요. 커뮤니티 플러그인 README의 설치 명령에서 dsh plugin add 또는 pnpm add 뒤에 적힌 이름입니다.",
    installGuideExampleLabel: "예시: ",
    installGitTemplateHint: "실제 Git 저장소 주소로 바꾸세요",
    installPathTemplateHint: "이 PC의 실제 플러그인 폴더 경로로 바꾸세요",
    installGuideFill: "예시 넣기",
    installGuideFillAria: "예시 {example} 넣기",
    installGuideSafety: "플러그인 출처를 믿을 수 있는지 확인하세요. 플러그인은 이 PC에서 사용자 권한으로 실행되며 출처가 불분명한 플러그인은 DeepSeek Harness를 망가뜨리거나 데이터를 읽고 빼돌릴 수 있습니다.",
    installUpgradeNotice: "필요할 때 설치하는 공식 플러그인은 버전이 DSH와 다르면 ‘업데이트’가 나타납니다. 다른 플러그인은 먼저 제거한 뒤 새 버전을 설치하세요.",
    registryToggle: "설치 소스",
    registryLegend: "플러그인을 내려받을 npm 소스",
    registryDefault: "기본 설치 소스",
    registryOfficial: "npm 공식 레지스트리",
    registryNpmmirror: "중국 본토 미러",
    registryCustom: "사용자 지정 주소",
    registryCustomPlaceholder: "https://npm.example.com/",
    registryCustomHint: "http:// 또는 https://로 시작하는 사내망·비공개 npm 소스 주소를 입력하세요. 로그인이 필요하면 이 PC의 ~/.npmrc에 자격 증명을 설정하세요.",
    registryCustomInvalid: "http:// 또는 https://로 시작하는 주소를 입력하세요",
    registryListSeparator: "、",
    sentenceSeparator: "",
    installRun: "설치",
    installChecking: "확인하는 중…",
    installConfirmedTitle: "플러그인 설치",
    installConfirmedRefused: "이 플러그인을 설치할 수 없습니다",
    installProblemInvalid: "패키지 이름이나 주소를 인식할 수 없습니다: {reason}",
    installProblemInstalled: "이미 설치된 플러그인입니다. 업그레이드하려면 제거한 뒤 다시 설치하세요",
    installProblemShipped: "이 플러그인은 DSH에 포함되어 있습니다. 새 버전을 쓰려면 DSH를 업데이트하세요",
    installProblemNotFound: "관련 플러그인을 찾지 못했습니다",
    installProblemNotPackage: "경로가 없거나 올바른 플러그인 패키지가 아닙니다",
    installProblemNotBundle: "이 패키지에는 번들 선언이 없어 플러그인으로 설치할 수 없습니다: {reason}",
    installProblemNetwork: "플러그인 소스에 연결할 수 없습니다. 네트워크를 확인한 뒤 다시 시도하세요",
    installProblemNetworkAll: "모든 설치 소스에 연결할 수 없습니다(시도함: {registries}). 네트워크나 프록시 설정을 확인하거나 설치 소스를 바꾸세요",
    installProblemUnknown: "플러그인 정보를 가져올 수 없습니다: {reason}",
    installingTitle: "플러그인 설치 중…",
    installedTitle: "설치됨",
    statusNotInstalled: "설치 안 됨",
    statusMissingFiles: "패키지를 쓸 수 없음",
    statusUpdateAvailable: "업데이트 가능",
    sourceNotInstalled: "설치 안 됨",
    sourceTargetSpec: "현재 DSH에 맞는 출처",
    sourceTargetVersion: "현재 DSH에 맞는 버전",
    update: "업데이트",
    updateLabel: "{name} 업데이트",
    installFailedTitle: "플러그인 설치 실패",
    installGithubFailedTitle: "GitHub에 접속할 수 없습니다",
    installGithubTimeoutTitle: "GitHub 연결 시간 초과",
    installGithubFailedDescription: "다른 설치 출처를 시도해 보세요.",
    installUseGithubMirror: "중국 미러로 바꾸기",
    installTryAnotherWay: "다른 방법 시도",
    installPackageLabel: "플러그인 패키지 이름",
    installEdit: "편집",
    installEditAria: "편집으로 돌아가기",
    installCancelAndEdit: "설치 취소하고 편집으로 돌아가기",
    installApplyingCancellationError: "취소 요청이 확인되지 않았습니다. 설치가 마무리 단계이므로 결과를 기다려 주세요. {reason}",
    installReconcile: "설치 상태 확인",
    installUnknownTitle: "설치 결과를 가져오지 못했습니다",
    installUnknownDescription: "백엔드에 이 설치 작업이 없습니다. 플러그인 목록을 확인한 뒤 다시 설치하세요.",
    installResultUnconfirmed: "설치 결과를 받지 못했습니다. 설치 상태를 확인하세요. {reason}",
    installAwaitingAcceptance: "백엔드가 설치 요청을 접수하기를 기다리고 있습니다. 접수되면 취소를 자동으로 다시 시도합니다.",
    installBackgroundUnknown: "설치 결과를 가져오지 못했습니다. 플러그인 목록을 확인하세요.",
    installCancel: "설치 취소",
    installCloseCancels: "설치 취소하고 닫기",
    installViewTask: "설치 작업 보기",
    installUnconfirmedTitle: "설치 상태가 아직 확인되지 않음",
    installBackgroundDone: "플러그인 설치가 끝났습니다. 설치 결과를 볼 수 있습니다.",
    installBackgroundFailed: "플러그인 설치에 실패했습니다. 설치 상세를 볼 수 있습니다.",
    installBackgroundUnconfirmed: "설치 상태가 아직 확인되지 않았습니다. 설치 작업에서 자세한 내용을 확인하세요.",
    installBackgroundApplying: "설치가 마무리 단계라 취소할 수 없습니다. 진행 상황은 계속 확인할 수 있습니다.",
    installStarting: "설치 준비 중…",
    installCancelling: "설치 중지하는 중…",
    installApplying: "설정 적용 중입니다. 잠시 기다리세요…",
    installCancelledShort: "취소됨",
    installCancelled: "설치를 취소했습니다. 플러그인은 켜지지 않았고 내려받은 파일은 남아 있을 수 있습니다",
    installCancelUnconfirmed: "설치가 멈췄는지 아직 확인되지 않았습니다. 취소를 다시 시도하거나 설치 결과를 기다리세요. {reason}",
    installEnableNow: "바로 켜기",
    installDetailsShow: "설치 상세 보기",
    installDetailsHide: "설치 상세 접기",
    installVersion: "버전 {version}",
    installSubjectPath: "로컬 폴더",
    installSubjectGit: "Git 저장소",
    installSubjectTarball: "압축 파일",
    installLocation: "설치 위치: {dir}",
    installRetry: "다시 시도",
    installChangeRegistry: "설치 소스 바꾸기",
    installAttempt: "{previous}을(를) 쓸 수 없어 {registry}(으)로 다시 시도합니다(소스 {total}개 중 {index}번째)",
    installAttemptBadge: "{index}번째 · {registry}",
    installFailureNetwork: "네트워크 연결 실패",
    installFailureNetworkAll: "모든 설치 소스에 연결할 수 없습니다(시도함: {registries}). 네트워크나 프록시 설정을 확인하거나 설치 소스를 바꾼 뒤 다시 시도하세요.",
    installFailureNetworkHost: "{host}에 연결할 수 없습니다. GitHub 주소와 .tgz 직접 링크는 설치 소스를 거치지 않으므로 이 PC에서 바로 접속되거나 프록시가 설정되어 있어야 합니다. 이 플러그인이 npm에도 올라와 있다면 패키지 이름을 대신 넣으세요.",
    installFailureNotFound: "관련 플러그인을 찾지 못했습니다",
    installFailureNoMatchingVersion: "일치하는 버전이 없습니다",
    installFailureDiskFull: "디스크 공간이 부족해 설치를 멈췄습니다",
    installFailurePermission: "쓰기 권한이 없어 설치할 수 없습니다",
    installFailureBuildBlocked: "의존성의 설치 스크립트를 허용해야 계속할 수 있습니다",
    installFailureBuildBlockedManual: "의존성의 설치 스크립트를 pnpm이 막았습니다. 프로필의 pnpm-workspace.yaml에 있는 allowBuilds에서 허용한 뒤 다시 시도하세요",
    installFailureIntegrity: "내려받은 설치 패키지 검증에 실패했습니다",
    installFailureTimeout: "설치 시간 초과",
    installFailurePnpmMissing: "pnpm을 찾지 못해 설치할 수 없습니다",
    installFailureGeneric: "설치 중 오류가 발생했습니다. 설치 상세에서 원인을 확인하세요",
    terminalCommandLine: "명령 {n}번째 줄",
    terminalRunning: "실행 중",
    terminalFailed: "실패",
    terminalDone: "완료",
    terminalCopy: "복사",
    terminalCopied: "복사됨",
    terminalNoOutput: "출력 없음",
    terminalCollapseAria: "출력 접기",
    terminalCollapse: "접기",
    terminalExpandAria: "나머지 출력 {n}줄 펼치기",
    terminalExpand: "… 나머지 {n}줄",
    terminalExitCode: "종료 코드 {code}",
    terminalSignal: "신호 {signal}",
    terminalNoExitCode: "정상적으로 종료되지 않음",
    installDoneNothing: "설치 완료. 새로 추가된 의존성은 없습니다.",
    installDoneRestart: "설치했습니다. 불러오려면 DSH를 다시 시작하세요. {reason}",
    installDoneApproved: "설치 스크립트 실행을 허용함: {names}",
    installDoneOtherVersion: "pnpm 공급망 보안 정책(minimumReleaseAge)에 따라 공개된 지 정해진 기간이 지나지 않은 버전은 자동으로 설치하지 않습니다. 그래서 이번에는 최신 버전 {version}이 아니라 {installed}을(를) 설치했습니다. 새로 공개된 버전은 아직 관찰 기간을 거치지 않아 발견되지 않은 악성 코드나 결함이 있을 수 있습니다. 꼭 {version}이 필요하면 현재 버전을 제거한 뒤 {exact}로 버전을 지정해 설치하세요.",
    installApprovalTitle: "설치 스크립트 허용 필요",
    installApprovalDescription: "아래 패키지에 설치 스크립트가 포함되어 있습니다. pnpm은 기본적으로 이 스크립트를 실행하지 않습니다.",
    installApprovalConsequence: "허용하면 스크립트가 이 PC에서 사용자 권한으로 실행됩니다. 허용은 현재 프로필에 저장되어 다시 묻지 않습니다.",
    installApprovalCaution: "이 패키지들을 믿을 때만 허용하세요.",
    installApproveAndRetry: "이 스크립트를 허용하고 다시 시도",
    installClose: "완료",
    close: "닫기",
    cancel: "취소",
    confirmUninstallTitle: "‘{name}’을(를) 제거할까요?",
    confirmUninstallDescription: "제거하면 이 플러그인이 제공하던 기능이 사라집니다.",
    confirmUninstall: "제거",
    failedEnable: "켜기 실패: {reason}",
    failedDisable: "끄기 실패: {reason}",
    failedUninstall: "제거 실패: {reason}",
    failedRowEnable: "구성 요소 켜기 실패: {reason}",
    failedRowDisable: "구성 요소 끄기 실패: {reason}",
    reasonManagementRequired: "플러그인 관리에 필요해 끄거나 제거할 수 없습니다",
    reasonUnaddressable: "현재 프로필의 패치로는 이 항목을 하나로 식별할 수 없습니다",
    reasonUnknownPlugin: "이 플러그인을 찾을 수 없습니다",
    reasonInvalidSpec: "올바른 패키지 이름이나 주소를 입력하세요",
    reasonAlreadyInstalled: "이미 설치된 패키지입니다. 다른 버전을 설치하려면 먼저 제거하세요",
    reasonAmbiguousInstall: "의존성 변경 내역에서 설치된 패키지를 확인할 수 없습니다",
    reasonNotBundle: "이 패키지에는 번들 선언이 없어 플러그인으로 관리할 수 없습니다",
    reasonNotRemovable: "이 패키지는 현재 프로필에 속하지 않거나 플러그인 관리에 필요한 구성 요소입니다",
    reasonStopProfile: "이 프로필은 HMR이 꺼져 있습니다. 사용 중인 패키지는 멈춘 뒤 dsh plugin으로 제거하세요",
    reasonBundleInUse: "다른 설정에서 이 번들의 구성 요소를 사용 중입니다. 해당 구성 요소를 먼저 끄세요",
    reasonStaleApproval: "허용 대기 중인 설치 스크립트 목록이 바뀌었습니다. 새로 고치려면 다시 설치하세요",
    reasonIncompatibleVersion: "{plugin}은(는) DSH {runtime}과(와) 호환되지 않습니다(요구 사항: {requirements}). 실행하면 충돌하거나 데이터가 사라질 수 있습니다.",
    reasonIncompatibleVersionUnnamed: "이 플러그인은 현재 DSH 버전과 호환되지 않습니다. 실행하면 충돌하거나 데이터가 사라질 수 있습니다.",
    reasonIncompatibleInstall: "현재 DSH와 호환되는 플러그인 버전을 설치하세요.",
    reasonIncompatibleInstalled: "제거한 뒤 현재 DSH와 호환되는 버전을 다시 설치하세요.",
    reasonOperationError: "호스트가 오류를 보고했습니다",
    applyingChange: "{name}에 변경 사항 적용 중",
    installBundledTitle: "이 플러그인은 DSH에 포함되어 있습니다",
    installBundledDescription: "따로 내려받지 않고 바로 켤 수 있습니다",
    versionsTitle: "버전",
    versionsRecheck: "다시 확인",
    versionsChecking: "업데이트 확인 중",
    versionsAvailable: "{version} 버전으로 업데이트 가능",
    versionsPublished: "{date} 공개",
    versionsLatest: "최신 버전",
    versionsCheckedAt: "마지막 확인: {time}",
    versionsBlocked: "새 버전을 쓰려면 DSH를 업데이트해야 합니다",
    versionsBlockedDetail: "{version}에는 {peers}이(가) 필요하지만 현재 DSH는 {runtime}입니다",
    versionsNoneInstallable: "바로 설치할 수 있는 새 버전이 없습니다",
    versionsNoneInstallableDetail: "새 버전이 지원 중단 또는 사전 공개 상태이거나 번들 선언이 없습니다. 목록을 펼쳐 확인하세요",
    versionsFailedNetwork: "설치 소스에 연결할 수 없습니다",
    versionsFailedOther: "업데이트를 확인할 수 없습니다",
    versionsDetails: "자세히",
    versionsNewerCount: "새 버전 {count}개",
    versionsCollapse: "접기",
    versionsInstalledTag: "설치됨",
    versionsPrereleaseTag: "사전 공개",
    versionsDeprecatedTag: "지원 중단",
    versionsNeedsDsh: "{peers} 필요",
    versionsNotBundle: "이 버전에는 번들 선언이 없어 설치할 수 없습니다",
    versionsUpdateLabel: "{version} 버전으로 업데이트",
    versionsRegistry: "설치 소스",
    versionsCheckedAtLabel: "확인 시각",
    versionsFallbackTag: "대체",
    versionsFallbackHint: "{registry}에 연결할 수 없어 대체 설치 소스에서 목록을 가져왔습니다",
    versionsPrimaryTag: "우선",
    versionsShowPrerelease: "사전 공개 버전 표시",
    versionsOmitted: "설치된 버전보다 새로운 버전이 {count}개 더 있지만 목록에 표시하지 않았습니다",
    versionsProblemNetwork: "연결 불가",
    versionsProblemNotFound: "찾을 수 없음",
    versionsProblemUnknown: "실패",
    updatesAvailable: "업데이트 가능: {count}개",
    updatesNone: "모든 플러그인이 최신 버전입니다",
    updatesFailed: "일부 플러그인의 업데이트를 확인하지 못했습니다",
    updateTitle: "{name} 업데이트",
    updateSource: "설치 소스",
    updateDescription: "업데이트하면 {from}에서 {to}(으)로 바뀝니다. 플러그인이 잠시 멈출 수 있으며 설치에 실패하면 {from}을(를) 유지하거나 다시 설치합니다.",
    updateRunning: "업데이트 중",
    updateStepChecking: "{version} 확인",
    updateStepRemoving: "{version} 중지 및 제거",
    updateStepInstalling: "{registry}에서 {version} 설치",
    updateStepRestoring: "{version} 다시 설치",
    updateDone: "{version} 버전으로 업데이트했습니다",
    updateDoneDetail: "새 버전이 실행 중입니다.",
    updateRestart: "{version}을(를) 설치했습니다. 다시 시작하면 적용됩니다",
    updateRefused: "{version} 버전으로 업데이트할 수 없습니다",
    updateRemoveFailed: "{version}을(를) 제거하지 못했습니다",
    updateRestored: "업데이트 실패. {version} 버전으로 되돌렸습니다",
    updateRestoredDetail: "{to} 설치에 실패해 {from}을(를) 다시 설치했습니다.",
    updateKept: "{version} 버전으로 업데이트하지 못했습니다",
    updateKeptDetail: "{from}은(는) 제거되지 않았으며 계속 사용됩니다. {reason}",
    updateBroken: "업데이트 실패. 플러그인이 설치되어 있지 않습니다",
    updateBrokenDetail: "{to} 설치에 실패했고 {from} 재설치도 실패했습니다. ‘플러그인 추가’에서 {name}을(를) 다시 설치하세요.",
    updateLost: "업데이트 결과를 알 수 없습니다",
    updateLostDetail: "DSH와의 연결이 끊겼습니다: {reason}. 플러그인 목록을 새로 고쳐 설치된 버전을 확인하세요.",
    updateOutput: "설치 출력 보기",
    updateFinish: "완료",
    installDetailsNoOutput: "설치 상세에 터미널 출력이 전달되지 않았습니다",
    installLogPath: "전체 로그: {path}",
    installFailedEnabling: "설치는 끝났지만 플러그인을 켜지 못했습니다",
    reasonUnsupportedPlatform: "이 플러그인은 DSH가 실행 중인 운영 체제를 지원하지 않습니다.",
    detailTitle: "상세 정보",
    detailLoading: "상세 정보 읽는 중",
    detailTooLarge: "상세 정보가 크기 제한을 넘어 불러오지 않았습니다.",
    detailNetwork: "상세 정보 출처에 연결할 수 없습니다.",
    detailInvalid: "플러그인이 선언한 상세 정보 파일이 올바르지 않습니다.",
    detailFailed: "상세 정보를 읽을 수 없습니다.",
    detailFootnotes: "각주"
  },
  pluginMarket: {
    title: "둘러보기",
    refresh: "새로 고침",
    loading: "인덱스 읽는 중",
    retry: "다시 시도",
    close: "닫기",
    cancel: "취소",
    emptyTitle: "아직 플러그인 인덱스가 없습니다",
    emptyDescription: "플러그인 인덱스를 추가하면 여기서 플러그인을 둘러보고 설치할 수 있습니다",
    addFirstSource: "인덱스 소스 추가",
    sourcesFailed: "인덱스 소스를 읽을 수 없습니다",
    manageSources: "인덱스 소스 관리…",
    marketMenu: "플러그인 인덱스 바꾸기, 현재 {market}",
    sourcesTitle: "인덱스 소스",
    sourcesDescription: "플러그인 인덱스는 인덱스 파일의 URL로 제공됩니다. ‘둘러보기’에는 여기에 등록한 인덱스의 플러그인이 표시됩니다",
    sourcesLabel: "추가한 인덱스 소스",
    sourceUrl: "인덱스 URL",
    sourcePlaceholder: "https://example.com/index.json",
    addSource: "추가",
    removeSource: "제거",
    removeSourceNamed: "{url} 제거",
    sourcesTrust: "인덱스는 제3자가 제공합니다. 믿을 수 있는 출처만 추가하세요. 그 안의 플러그인은 설치하면 사용자 권한으로 실행됩니다",
    sourceInvalid: "http 또는 https 주소를 쓰고 사용자 이름, 비밀번호, # 조각은 넣지 마세요",
    sourceDuplicate: "이미 추가한 인덱스 소스입니다",
    sourceUnavailable: "현재 환경에서는 인덱스 소스를 저장할 수 없습니다",
    sourceFailed: "인덱스 소스를 저장할 수 없습니다",
    readFailed: "이 인덱스를 읽을 수 없습니다",
    readInvalid: "이 인덱스의 형식이 올바르지 않습니다",
    readChanged: "불러오는 동안 인덱스가 바뀌었습니다",
    search: "플러그인 검색",
    filter: "태그",
    filterCount: "태그 · {count}",
    sortBy: "정렬: {sort}",
    sortRelevance: "가장 잘 맞는 순",
    sortDefault: "기본 순서",
    sortPublished: "공개일",
    switchToAscending: "오름차순으로",
    switchToDescending: "내림차순으로",
    categoriesLabel: "분류",
    allCategories: "전체",
    emptyIndex: "이 인덱스에는 플러그인이 없습니다",
    noMatches: "조건에 맞는 플러그인이 없습니다",
    showMore: "더 보기",
    entryMeta: "{version} · {date}",
    entryMetaAuthor: "{version} · {author} · {date}",
    openEntry: "{name} 보기",
    install: "설치",
    installTitle: "{name} 설치",
    installVersionTitle: "{name} {version} 설치",
    openInstalled: "설치됨에서 {name} 보기",
    statusInstalled: "설치됨",
    statusUpdate: "새 버전 있음",
    statusProvided: "DSH에 포함",
    incompatible: "이 버전은 현재 DSH {runtime}과(와) 호환되지 않습니다. DSH {range}가 필요합니다",
    noCompatibleVersion: "현재 DSH {runtime}과(와) 호환되는 버전이 없습니다",
    exempted: "이 버전은 현재 DSH와 호환되지 않지만 호환성 예외를 설정해 두었습니다",
    backToList: "둘러보기",
    factSource: "출처",
    factPackage: "패키지",
    factRegistry: "레지스트리",
    factRepository: "저장소",
    factCommit: "커밋",
    factDirectory: "폴더",
    factPublished: "공개일",
    factAuthor: "작성자",
    factHomepage: "홈페이지",
    factSourceCode: "소스 코드",
    factCategory: "분류",
    factLabels: "태그",
    factMarket: "플러그인 인덱스",
    versionsTitle: "버전",
    versionsLabel: "{name}의 버전",
    versionDefault: "추천",
    versionInstalled: "현재 설치됨",
    versionIncompatible: "호환 안 됨",
    versionExempted: "예외 처리됨",
    versionPrerelease: "사전 공개",
    confirmTitle: "‘{name}’을(를) 설치할까요?",
    installTrust: "플러그인은 이 PC에서 사용자 권한으로 실행됩니다. 출처를 믿을 수 있는지 확인하세요",
    detailTitle: "상세 정보",
    detailLoading: "상세 정보 읽는 중",
    detailTooLarge: "상세 정보나 해당 저장소가 크기 제한을 넘어 불러오지 못했습니다",
    detailNetwork: "상세 정보 출처에 연결할 수 없습니다",
    detailDenied: "상세 정보 저장소에 접근할 수 없습니다. Git 자격 증명을 확인하세요",
    detailGitUnavailable: "상세 정보를 읽으려면 Git이 필요하지만 실행할 수 없습니다. Git을 설치한 뒤 다시 시도하세요",
    detailInvalid: "플러그인이 선언한 상세 정보 파일이 올바르지 않습니다",
    detailFailed: "상세 정보를 읽을 수 없습니다",
    footnotes: "각주"
  },
  reference: {
    "section.files": "파일과 폴더",
    "section.subagents": "하위 에이전트",
    "section.sessions": "대화",
    "candidate.noCwd": "(작업 폴더 없음)",
    "crumb.root": "작업 공간",
    "fileOpen.title": "파일을 열 수 없습니다",
    "fileOpen.failed": "“{path}”을(를) 열 수 없습니다. 다시 시도하거나 이 안내를 닫으세요",
    "fileOpen.close": "닫기",
    "fileOpen.retry": "다시 시도",
    "time.now": "방금",
    "time.minutes": "{n}분",
    "time.hours": "{n}시간",
    "time.days": "{n}일",
    "time.months": "{n}개월",
    "time.years": "{n}년"
  },
  "schedule.catalog": {
    "trigger.label": "알림",
    "list.loading": "알림 불러오는 중…",
    "list.error": "알림을 불러올 수 없습니다.",
    "list.retry": "다시 시도",
    "delete.action": "삭제",
    "delete.pending": "삭제하는 중…",
    "delete.label": "알림 삭제: {title}",
    "list.open": "알림 상세 열기: {title}",
    "trigger.one": "알림 {count}개",
    "trigger.other": "알림 {count}개",
    "list.aria": "활성 알림",
    "list.nextRun": "다음 실행",
    "frequency.once": "한 번",
    "frequency.every": "{value}{unit}마다 한 번",
    "time.locale": "ko-KR",
    "time.utcPrefix": "UTC",
    "frequency.daily": "매일 {time}({timeZone})",
    "frequency.dailyLocal": "매일 {time}",
    "frequency.weekly": "매주 {weekdays} {time}({timeZone})",
    "frequency.weeklyLocal": "매주 {weekdays} {time}",
    "frequency.cron": "Cron {expression}（{timeZone}）",
    "frequency.cronLocal": "Cron {expression}",
    "frequency.cronRule": "{rule}（{timeZone}）",
    "cron.list.join": "、",
    "cron.part.join": " ",
    "cron.weekday.name": "{weekday}요일",
    "cron.weekday.range": "{from}~{to}",
    "cron.months": "（{months}）",
    "cron.day.every": "매일{months}",
    "cron.day.weekdays": "{weekdays}{months}",
    "cron.day.monthDays": "매월 {days}일{months}",
    "cron.day.both": "매월 {days}일 또는 {weekdays}{months}",
    "cron.day.bothStarred": "매월 {days}일이면서 {weekdays}{months}",
    "cron.hours.range": "{from} ~ {to}",
    "cron.hours.list": "{hours}",
    "cron.time.everyMinute": "매분",
    "cron.time.everyMinutes": "{step}분마다",
    "cron.time.joinedEveryMinute": "매분",
    "cron.time.joinedEveryMinutes": "{step}분마다",
    "cron.time.everyHour": "매시간",
    "cron.time.joinedEveryHour": "매시간",
    "cron.time.everyNHours": "{count}시간마다",
    "cron.time.joinedEveryNHours": "{count}시간마다",
    "cron.time.hourlyAt": "매시 {minutes}분",
    "cron.time.joinedHourlyAt": "매시 {minutes}분",
    "cron.time.hoursEveryMinute": "{hours}시 매분",
    "cron.time.hoursEveryMinutes": "{hours}시 동안 {step}분마다",
    "cron.time.at": "{times}",
    "cron.time.hoursAt": "{hours}시 {minutes}분",
    "frequency.weekday.join": "、",
    "frequency.weekday.1": "월",
    "frequency.weekday.2": "화",
    "frequency.weekday.3": "수",
    "frequency.weekday.4": "목",
    "frequency.weekday.5": "금",
    "frequency.weekday.6": "토",
    "frequency.weekday.7": "일",
    "unit.day.one": "일",
    "unit.day.other": "일",
    "unit.hour.one": "시간",
    "unit.hour.other": "시간",
    "unit.minute.one": "분",
    "unit.minute.other": "분",
    "unit.second.one": "초",
    "unit.second.other": "초",
    "relative.now": "지금 실행 시각",
    "relative.future": "{value}{unit} 후",
    "relative.overdue": "{value}{unit} 지남",
    "mark.aria": "자동화 작업 {count}개",
    "hover.more": "작업 {count}개 더 있음",
    "frequency.hostMonthly": "매월 {days}일(또는 말일) {time}",
    "frequency.hostDailyInterval": "{interval}일마다 {time}",
    "frequency.hostWeeklyInterval": "{interval}주마다 {weekdays} {time}",
    "frequency.hostMonthlyInterval": "{interval}개월마다 {days}일(또는 말일) {time}",
    "frequency.hostZone": "{rule}({timeZone})",
    "frequency.hostCustom": "사용자 지정"
  },
  "schedule.manager": {
    panel: "자동화 작업",
    title: "자동화 작업",
    "new.action": "새로 만들기",
    "list.label": "작업 목록",
    "list.nextPrefix": "다음 예정 시간: ",
    "list.loading": "작업 불러오는 중…",
    "list.error": "작업을 불러올 수 없습니다",
    "list.retry": "다시 시도",
    "list.empty": "아직 자동화 작업이 없습니다. 세션에서 만든 작업이 여기 표시됩니다",
    "list.emptyInactive": "끝난 자동화 작업이 없습니다",
    "list.noMatches": "일치하는 자동화 작업이 없습니다",
    "search.label": "작업 검색",
    "search.placeholder": "자동화 작업 검색",
    "search.clear": "검색 지우기",
    "empty.action": "새 자동화 작업",
    "statusFilter.label": "작업 상태",
    "statusFilter.all": "전체",
    "status.active": "켜짐",
    "status.inactive": "끝남",
    "detail.label": "작업 상세",
    "detail.close": "상세 닫기",
    "detail.more": "자동화 작업 메뉴",
    "detail.nextRun": "다음 실행",
    "detail.tabs": "작업 상세 보기",
    "detail.rule": "규칙",
    "detail.records": "작업 실행 기록",
    "delivery.empty": "작업 실행 기록이 없습니다",
    "delivery.loading": "작업 실행 기록 불러오는 중…",
    "delivery.error": "작업 실행 기록을 불러올 수 없습니다",
    "delivery.notFound": "작업을 더 이상 쓸 수 없습니다",
    "delivery.cursorError": "기록이 업데이트됨",
    "delivery.retry": "다시 시도",
    "delivery.refresh": "새로 고침",
    "delivery.loadMore": "더 불러오기",
    "delivery.expand": "펼치기",
    "delivery.collapse": "접기",
    "delivery.pruned": "이전 실행 기록은 정리되었습니다",
    "delivery.retention": "보관 규칙",
    "delivery.retentionBounds": "작업마다 최근 {days}일 안의 실행 기록을 최대 {records}개까지 보관합니다.",
    "delivery.retentionExplanation": "새 기록이 생기면 범위를 벗어난 오래된 기록은 자동으로 정리됩니다. 기록을 정리해도 작업은 계속 실행됩니다.",
    "detail.name": "자동화 작업 이름",
    "detail.instruction": "자동화 작업 내용",
    "detail.status": "상태",
    "detail.next": "다음 예정 시간",
    "detail.frequency": "알림 빈도",
    "detail.id": "작업 ID",
    "detail.session": "연결된 세션",
    "detail.openSession": "연결된 세션: 원래 세션 열기",
    "detail.openSessionTitle": "연결된 세션 {title}: 원래 세션 열기",
    "detail.sessionLoading": "원래 세션 정보 불러오는 중",
    "detail.sessionArchived": "원래 세션이 보관됨",
    "detail.sessionUnavailable": "원래 세션을 지금 쓸 수 없습니다",
    "detail.missing": "작업을 더 이상 쓸 수 없습니다. 삭제됐을 수 있습니다",
    "delivery.label": "저장된 작업 실행 기록",
    "frequency.once": "한 번만",
    "frequency.every": "{value}{unit}마다",
    "time.locale": "ko-KR",
    "time.utcPrefix": "UTC",
    "frequency.daily": "매일 {time}({timeZone})",
    "frequency.dailyLocal": "매일 {time}",
    "frequency.weekly": "매주 {weekdays} {time}({timeZone})",
    "frequency.weeklyLocal": "매주 {weekdays} {time}",
    "frequency.cron": "Cron {expression}（{timeZone}）",
    "frequency.cronLocal": "Cron {expression}",
    "frequency.cronRule": "{rule}（{timeZone}）",
    "cron.list.join": "、",
    "cron.part.join": " ",
    "cron.weekday.name": "{weekday}요일",
    "cron.weekday.range": "{from}~{to}",
    "cron.months": "（{months}）",
    "cron.day.every": "매일{months}",
    "cron.day.weekdays": "{weekdays}{months}",
    "cron.day.monthDays": "매월 {days}일{months}",
    "cron.day.both": "매월 {days}일 또는 {weekdays}{months}",
    "cron.day.bothStarred": "매월 {days}일이면서 {weekdays}{months}",
    "cron.hours.range": "{from} ~ {to}",
    "cron.hours.list": "{hours}",
    "cron.time.everyMinute": "매분",
    "cron.time.everyMinutes": "{step}분마다",
    "cron.time.joinedEveryMinute": "매분",
    "cron.time.joinedEveryMinutes": "{step}분마다",
    "cron.time.everyHour": "매시간",
    "cron.time.joinedEveryHour": "매시간",
    "cron.time.everyNHours": "{count}시간마다",
    "cron.time.joinedEveryNHours": "{count}시간마다",
    "cron.time.hourlyAt": "매시 {minutes}분",
    "cron.time.joinedHourlyAt": "매시 {minutes}분",
    "cron.time.hoursEveryMinute": "{hours}시 매분",
    "cron.time.hoursEveryMinutes": "{hours}시 동안 {step}분마다",
    "cron.time.at": "{times}",
    "cron.time.hoursAt": "{hours}시 {minutes}분",
    "frequency.weekday.join": "、",
    "frequency.weekday.1": "월",
    "frequency.weekday.2": "화",
    "frequency.weekday.3": "수",
    "frequency.weekday.4": "목",
    "frequency.weekday.5": "금",
    "frequency.weekday.6": "토",
    "frequency.weekday.7": "일",
    "unit.day.one": "일",
    "unit.day.other": "일",
    "unit.hour.one": "시간",
    "unit.hour.other": "시간",
    "unit.minute.one": "분",
    "unit.minute.other": "분",
    "unit.second.one": "초",
    "unit.second.other": "초",
    "relative.now": "지금 실행 시각",
    "relative.future": "{value}{unit} 후",
    "relative.overdue": "{value}{unit} 지남",
    "timing.date": "날짜",
    "timing.time": "시간",
    "timing.hour": "시",
    "timing.minute": "분",
    "timing.second": "초",
    "timing.prevMonth": "지난달",
    "timing.nextMonth": "다음 달",
    "timing.zone": "시간대",
    "timing.zoneSearch": "UTC 오프셋, IANA 식별자, 도시 검색",
    "timing.zoneNoResults": "일치하는 시간대가 없습니다",
    "timing.interval": "반복 간격",
    "timing.intervalIncrease": "간격 늘리기",
    "timing.intervalDecrease": "간격 줄이기",
    "timing.unit.hour": "시간",
    "timing.unit.minute": "분",
    "timing.unit.second": "초",
    "timing.intervalHint.hour": "최소 1시간입니다. 작업을 만들거나 규칙을 마지막으로 수정한 시점부터 간격을 계산하며 시간대와는 관계없습니다",
    "timing.intervalHint.minute": "최소 1분입니다. 작업을 만들거나 규칙을 마지막으로 수정한 시점부터 간격을 계산하며 시간대와는 관계없습니다",
    "timing.intervalHint.second": "최소 60초입니다. 작업을 만들거나 규칙을 마지막으로 수정한 시점부터 간격을 계산하며 시간대와는 관계없습니다",
    "timing.zoneNoStored": "한 번만 실행하는 작업은 실행 시각만 저장하고 시간대는 저장하지 않습니다. 날짜와 시간은 선택한 시간대로 환산해 표시합니다",
    "timing.inactive": "끝난 작업은 읽기 전용이라 시간을 고칠 수 없습니다",
    "timing.conflict": "편집하는 동안 작업이 바뀌었습니다. 초안은 남겨 두었습니다. 새로 고친 뒤 편집을 취소하고 편집기를 다시 열어 최신 규칙을 수정하세요",
    "timing.notFound": "지금은 이 작업을 사용할 수 없습니다. 초안은 남겨 두었으니 취소를 눌러 편집기를 닫으세요",
    "timing.subagentSession": "하위 에이전트 세션은 알림을 받을 수 없습니다",
    "timing.invalid": "올바른 날짜와 시간을 입력하거나 시간 칸을 확인하세요",
    "timing.invalidZone": "올바른 IANA 시간대를 입력하세요. 예: Asia/Seoul",
    "timing.notFuture": "현재보다 나중의 날짜와 시간을 고르세요",
    "timing.invalidInterval": "1분 이상의 간격을 입력하세요",
    "timing.invalidInterval.hour": "1시간 이상의 간격을 입력하세요",
    "timing.invalidInterval.minute": "1분 이상의 간격을 입력하세요",
    "timing.invalidInterval.second": "60초 이상의 간격을 입력하세요",
    "timing.error": "시간 수정이 저장됐는지 확인할 수 없습니다. 초안은 남겨 두었으니 다시 시도하기 전에 작업을 확인하세요",
    "rule.title": "실행 시간",
    "rule.repeat": "반복",
    "rule.weekday": "요일",
    "rule.weekdayOption": "{weekday}요일",
    "rule.unsaved": "저장하지 않은 수정이 있습니다",
    "rule.save": "수정 저장",
    "rule.saving": "저장 중…",
    "rule.cancel": "취소",
    "rule.invalidTitle": "작업 이름은 120자 이하로 입력하세요",
    "rule.invalidPrompt": "작업 내용을 입력하세요",
    "rule.once": "한 번만",
    "rule.everyMinutes": "N분마다",
    "rule.everyHours": "N시간마다",
    "rule.everySeconds": "N초마다",
    "rule.daily": "매일",
    "rule.weekdays": "월~금",
    "rule.weekly": "매주",
    "rule.cron": "사용자 지정",
    "rule.cronLabel": "Cron 표현식",
    "rule.cronInvalid": "5개 필드로 된 cron 표현식을 입력하세요. 예: 0 9 * * 1-5",
    "cronForm.frequency": "빈도",
    "cronForm.monthly": "매월",
    "cronForm.weekly": "매주",
    "cronForm.daily": "매일",
    "cronForm.dates": "다음 날짜에",
    "cronForm.dateOption": "{day}일",
    "cronForm.atMinute": "몇 분에",
    "cronForm.minuteIncrease": "분 늘리기",
    "cronForm.minuteDecrease": "분 줄이기",
    "rule.zone.system": "(시스템)",
    "rule.error.conflict": "저장하기 전에 작업이 바뀌었습니다. 저장된 규칙을 보여 주고 있으니 다시 시도하세요",
    "rule.error.notFound": "이 작업은 지금 쓸 수 없습니다",
    "rule.error.unknown": "규칙이 업데이트됐는지 확인할 수 없습니다. 저장된 규칙을 보여 주고 있습니다",
    "delete.action": "작업 삭제",
    "delete.title": "이 작업을 삭제할까요?",
    "delete.description": "작업이 더 이상 실행되지 않고 저장된 실행 기록도 함께 삭제됩니다. 원래 세션과 메시지는 남고 이미 대기열에 들어간 메시지는 취소되지 않습니다.",
    "delete.confirm": "삭제 확인",
    "delete.cancel": "취소",
    "delete.close": "삭제 확인 닫기",
    "delete.pending": "삭제하는 중…",
    "toast.deleted": "작업이 삭제됨",
    "toast.deleteFailed": "작업을 삭제할 수 없습니다",
    "card.open": "열기",
    "card.openLabel": "작업 상세 열기: {title}",
    "card.deleted": "삭제됨",
    "tool.invoked": "{name} 호출함",
    "host.create": "만들기",
    "host.createMethod": "만드는 방법 선택",
    "host.chatCreate": "세션에서 만들기",
    "host.createPrompt": "요구 사항에 맞춰 자동화 작업을 만들어 주세요.",
    "host.manualCreate": "직접 만들기",
    "host.closeCreate": "만들기 양식 닫기",
    "host.creating": "만드는 중…",
    "host.createError": "작업을 만들지 못했습니다. 입력한 내용은 그대로 있으니 다시 시도하세요.",
    "host.notFuture": "현재보다 나중의 실행 시각을 고르세요. 다시 시작하기 전에 작업 시간을 수정하세요",
    "host.invalidRule": "규칙과 시간대를 확인하세요",
    "host.target": "실행할 곳",
    "host.targetNewOnce": "새 세션을 만들어 계속 사용",
    "host.targetNew": "실행할 때마다 새 세션",
    "host.latestConversation": "가장 최근 실행 세션",
    "host.currentConversation": "지금 연결된 세션",
    "host.targetNewOnceHelp": "처음 실행할 때 세션을 만들고 이후에도 계속 사용합니다",
    "host.targetNewHelp": "실행할 때마다 세션을 따로 만듭니다",
    "host.project": "연결된 작업 공간",
    "host.defaultProject": "기본 작업 공간",
    "host.ungrouped": "그룹 없음",
    "host.interval": "간격",
    "host.monthDay": "날짜(일)",
    "host.customRule": "직접 설정",
    "host.newSessionInterval": "최소 실행 간격: {interval}",
    "host.limitsLoading": "실행 간격 제한 불러오는 중",
    "host.limitsError": "실행 간격 제한을 불러오지 못했습니다. 저장하기 전에 다시 시도하세요.",
    "host.pause": "일시 중지",
    "host.resume": "다시 시작",
    "host.run": "지금 실행",
    "host.runAfterInterval": "최소 실행 간격이 아직 지나지 않았습니다. {time}부터 ‘지금 실행’을 사용할 수 있습니다.",
    "host.saveError": "저장하지 못했습니다. 수정한 내용은 그대로 있으니 다시 시도하세요.",
    "host.conflict": "이 작업이 다른 곳에서 바뀌었습니다. 최신 값을 내 수정과 함께 검토하거나 수정을 버리세요.",
    "host.reapply": "내 수정과 함께 검토",
    "host.runError": "작업을 대기열에 넣지 못했습니다. 다시 시도하세요.",
    "host.executionPending": "이 작업은 대기 중이거나 실행 중이거나 방금 전달된 상태입니다. 잠시 뒤 다시 시도하세요.",
    "host.executionActive": "이 작업은 대기 중이거나 실행 중입니다. 세션에서 관리하세요.",
    "host.sessionAfterFirstRun": "만들기 대기 중",
    "status.paused": "일시 중지됨",
    "status.ended": "끝남",
    "host.openDeliverySession": "세션 열기",
    "host.frequency.monthly": "매월",
    "host.frequency.advanced": "직접 설정",
    "list.emptyActive": "켜진 자동화 작업이 없습니다",
    "list.emptyPaused": "일시 중지된 자동화 작업이 없습니다",
    "detail.namePlaceholder": "예: 매일 읽을거리 요약",
    "detail.instructionPlaceholder": "할 일과 결과를 적어 주세요.\n예: 읽을거리 목록을 출처 링크와 함께 요약해 줘.",
    "frequency.hostMonthly": "매월 {days}일 {time}, 또는 말일",
    "frequency.hostDailyInterval": "{interval}일마다 {time}",
    "frequency.hostWeeklyInterval": "{interval}주마다 {weekdays} {time}",
    "frequency.hostMonthlyInterval": "{interval}개월마다 {days}일 {time}, 또는 말일",
    "frequency.hostZone": "{rule}({timeZone})",
    "frequency.hostCustom": "직접 설정",
    "rule.invalid": "직접 설정한 규칙을 고치거나, 다른 반복 방식을 고르거나, 에이전트에게 고쳐 달라고 하세요.",
    "rule.invalidInterval": "간격에는 1 이상의 정수를 입력하세요.",
    "rule.requiredWeekday": "요일을 하나 이상 고르세요.",
    "rule.invalidMonthDay": "1에서 31 사이의 날짜를 입력하세요.",
    "rule.invalidTime": "선택한 시간대에 있는 올바른 날짜와 시간을 고르세요.",
    "rule.invalidZone": "올바른 시간대를 고르세요.",
    "rule.tooComplex": "이 규칙은 너무 잦거나 복잡합니다. 반복 방식을 고르거나 에이전트에게 단순하게 바꿔 달라고 하세요.",
    "list.more": "작업 메뉴 더 보기",
    "clear.action": "끝난 작업 모두 지우기",
    "clear.title": "끝난 작업 {count}개를 지울까요?",
    "clear.description": "이 작업들과 저장된 실행 기록이 영구히 삭제됩니다. 켜져 있거나 일시 중지된 작업, 원래 세션, 대기열의 메시지는 그대로 남습니다.",
    "clear.confirm": "작업 지우기",
    "clear.pending": "지우는 중…",
    "clear.close": "지우기 확인 닫기",
    "toast.cleared.one": "끝난 작업 {count}개를 지웠습니다.",
    "toast.cleared.other": "끝난 작업 {count}개를 지웠습니다.",
    "toast.clearedNone": "종료된 작업이 없어 지울 항목이 없습니다.",
    "toast.clearFailed": "작업을 지우지 못했습니다."
  },
  secretMask: {
    "secret.reveal": "키 보기",
    "secret.hide": "키 숨기기"
  },
  "settings.account": {
    modelSignInRequired: "현재 모델을 쓸 수 없습니다. 로그인한 뒤 다시 시도하세요",
    sessionExpired: "로그인 정보가 만료되었습니다. 다시 로그인하세요",
    onboardingArtworkLocale: "zh",
    onboardingWelcome: "환영합니다",
    onboardingBrand: "DeepSeek Harness",
    onboardingIntroduction: "DeepSeek Harness는 로컬 폴더를 작업 공간으로 사용합니다. 여러 도구로 이 PC의 파일을 읽고 쓰며 자료 검색·정리, 문서·표 작성, 코드 작성, 문제 해결 같은 작업을 합니다.",
    onboardingStart: "설정 시작",
    onboardingCredit: "사용 한도 준비",
    onboardingCreditDescription: "DeepSeek Harness는 작업 중 모델과 도구가 사용한 토큰 양만큼 한도를 차감합니다. 작업 도중 멈추지 않도록 미리 한도를 충전하세요. 잔액은 에이전트가 실제로 작업할 때만 사용됩니다.",
    onboardingTopUp: "충전하기",
    onboardingLater: "다음",
    onboardingFundedTopUp: "충전하기",
    onboardingPurposePrefix: "어떤 일을",
    onboardingPurposeSuffix: "도와드릴까요?",
    onboardingPurposeDescription: "선택에 따라 화면과 도구를 사용자의 작업 방식에 맞게 조정합니다.",
    onboardingOffice: "사무와 창작",
    onboardingOfficeDescription: "문서 편집, 데이터 정리, 프레젠테이션 만들기 등",
    onboardingDevelopment: "코드와 개발",
    onboardingDevelopmentDescription: "코드 수정, 문제 디버깅, 명령 실행, 프로젝트 파일 관리 등",
    onboardingContinue: "계속",
    onboardingProcess: "작업 과정을 얼마나 자세히 볼까요?",
    onboardingProcessDescription: "작업 과정을 표시하는 방식만 바뀝니다. DeepSeek Harness의 작업 능력에는 영향이 없습니다.",
    onboardingCompact: "결과 중심",
    onboardingCompactDescription: "결과만 보고 화면을 깔끔하게 유지",
    onboardingStandard: "핵심 내용",
    onboardingStandardDescription: "결과 우선, 중요한 단계와 핵심 작업만 표시",
    onboardingDetailed: "전체 과정",
    onboardingDetailedDescription: "전체 작업 과정을 표시해 디버깅과 문제 해결에 활용",
    onboardingEnter: "앱으로 들어가기",
    onboardingBack: "이전",
    onboardingSkip: "건너뛰기",
    onboardingSkipTitle: "설정을 건너뛸까요?",
    onboardingSkipDescription: "언제든 설정 → 일반 설정에서 작업 과정, 성능·사용량 표시 방식을 바꾸거나 코드 작업 도구를 켤 수 있습니다.",
    onboardingKeepSetting: "설정 계속하기",
    onboardingNoCreditTitle: "충전을 잠시 건너뛸까요?",
    onboardingNoCreditDescription: "사용할 수 있는 한도가 없으면 DeepSeek Harness는 새 작업을 시작할 수 없습니다. 나중에 설정 → 계정과 잔액에서 충전할 수 있습니다.",
    onboardingUnderstood: "알겠습니다",
    onboardingGoTopUp: "충전하러 가기",
    onboardingSaveFailed: "설정을 저장하지 못했습니다. 다시 시도하세요.",
    onboardingRetry: "다시 시도",
    onboardingLoading: "설정 불러오는 중…",
    close: "닫기",
    addApiKey: "API 키 추가",
    retry: "다시 로그인",
    loginTitle: "시작하기",
    loginDescription: "DeepSeek 계정에 로그인하거나 API 키를 추가하면 바로 쓸 수 있습니다. 프로젝트와 파일은 이 PC에 저장됩니다.",
    browserTitle: "로그인 기다리는 중",
    browserPrompt: "새 페이지가 자동으로 열리지 않았나요? ",
    copyLink: "로그인 링크 복사",
    copiedLink: "링크 복사됨",
    copyFailed: "복사 실패",
    browserDescription: "한 뒤 로그인 페이지를 직접 열어 로그인하세요.",
    timeoutTitle: "로그인 시간 초과",
    timeoutDescription: "다시 로그인한 뒤 계속하세요.",
    failureTitle: "로그인 실패",
    platformFailed: "작업을 끝내지 못했습니다. 다시 시도하세요",
    platformRetry: "다시 시도",
    loading: "불러오는 중…",
    backToHarness: "DeepSeek Harness로 돌아가기",
    settings: "설정",
    contactUs: "의견 보내기",
    menu: "계정 메뉴",
    nav: "계정과 잔액",
    signedIn: "DeepSeek에 로그인됨",
    signedOut: "로그인 안 됨",
    signIn: "로그인",
    signOut: "로그아웃",
    signOutUnknownDescription: "지금은 작업 상태를 확인할 수 없습니다. 로그아웃하면 이 계정을 쓰는 작업이 중단될 수 있습니다. 계속할까요?",
    signOutDescription: "로그아웃해도 데이터는 사라지지 않고 이 계정으로 다시 로그인할 수 있습니다.",
    signOutRunningDescription: "지금 실행 중인 작업이 있습니다. ‘로그아웃’을 누르면 작업이 중단됩니다. 바로 로그아웃할까요?",
    cancel: "취소",
    open: "브라우저 열기",
    initializing: "로그인 시작하는 중…",
    waiting: "브라우저에서 계속하세요",
    completing: "로그인 마무리하는 중…",
    expired: "로그인이 만료되었습니다. 다시 시도하세요.",
    failed: "작업을 끝내지 못했습니다. 다시 시도하세요.",
    noResponse: "작업을 끝내지 못했습니다. 네트워크 문제일 수 있으니 연결 상태를 확인한 뒤 다시 시도하세요",
    settingsSignedOutTitle: "DeepSeek Harness 계정에 로그인하지 않았습니다",
    settingsSignedOutDescription: "DeepSeek Harness 계정에 로그인하고 전용 API 키 받기",
    signInDescription: "DeepSeek 계정에 로그인해 시작하세요",
    profileUnavailable: "계정 정보를 지금 볼 수 없습니다",
    balance: "충전 잔액",
    bonusBalance: "보너스 잔액",
    balanceUnavailable: "오픈 플랫폼에서 보기",
    balanceSignedOut: "로그인 후 보기",
    accountInfo: "계정 정보 더 보기",
    more: "더 보기",
    usage: "사용량 조회",
    topUp: "충전",
    quotaTitle: "사용할 수 있는 잔액이 없습니다",
    quotaDescription: "사용할 수 있는 한도가 없으면 DeepSeek Harness는 새 작업을 시작할 수 없습니다. 지금 충전할까요? 나중에 설정 → 계정과 잔액에서 충전할 수도 있습니다.",
    quotaTopUp: "충전하기",
    bonusNoticeTitle: "보너스가 들어왔습니다"
  },
  "settings.agentLoop": {
    title: "에이전트 루프",
    description: "에이전트의 도구 호출 방식을 설정합니다.",
    maxParallel: "병렬 도구 호출 수",
    maxParallelHint: "한 단계에서 병렬 실행이 가능한 도구 호출을 동시에 몇 개까지 실행할지 정합니다.",
    overridden: "덮어씀",
    reset: "기본값 복원",
    readOnly: "이 배포의 설정은 읽기 전용입니다.",
    unavailable: "플러그인을 불러오지 않은 상태라 설정할 수 없습니다.",
    save: "저장",
    saving: "저장 중…",
    saveFailed: "설정값이 적용되지 않았습니다. 다시 수정할 수 있도록 입력 내용은 남겨 두었습니다.",
    invalidNumber: "숫자를 입력하세요. 비워 두면 기본값을 씁니다."
  },
  settings: {
    trigger: "설정",
    "shortcut.open": "설정 열기",
    "desktop.update.available": "새 버전",
    "desktop.update.checking": "업데이트 확인 중…",
    "desktop.update.progress": "{percent}%",
    "desktop.update.verifying": "업데이트 파일 검증 중…",
    "desktop.update.installing": "재시작 준비 중…",
    "desktop.update.ready": "설치하고 재시작",
    "desktop.update.retry": "업데이트 다시 시도",
    "desktop.update.versionDetail": "{label}：{version}",
    "desktop.update.downloadDetail": "업데이트 내려받는 중: {percent}%\n대상 버전: {version}",
    "desktop.update.checkFailed": "업데이트 확인에 실패했습니다. 잠시 뒤 다시 시도하세요.",
    "desktop.update.downloadFailed": "업데이트 내려받기에 실패했습니다. 다시 시도하세요.",
    "desktop.update.installFailed": "업데이트 설치에 실패했습니다. 잠시 뒤 다시 시도하세요.",
    "desktop.update.checkNetworkFailed": "업데이트 확인에 실패했습니다. 네트워크 연결을 확인한 뒤 다시 시도하세요.",
    "desktop.update.downloadNetworkFailed": "업데이트 내려받기에 실패했습니다. 네트워크 연결을 확인한 뒤 다시 시도하세요.",
    "desktop.update.installNetworkFailed": "업데이트 설치에 실패했습니다. 네트워크 연결을 확인한 뒤 다시 시도하세요.",
    "desktop.update.stopFailed": "작업을 안전하게 멈추지 못해 업데이트를 설치하지 않았습니다. 잠시 뒤 다시 시도하세요.",
    "desktop.update.tasksChanged": "새 작업이 실행되기 시작했습니다. 작업을 멈추고 업데이트할지 다시 확인하세요.",
    "desktop.update.tasksUnavailable": "작업 상태를 확인할 수 없습니다. 작업 공간이 준비된 뒤 업데이트를 다시 시도하세요.",
    title: "설정",
    close: "닫기",
    openDocument: "설정 파일 열기",
    "openDocument.error": "설정 파일을 열 수 없습니다",
    "general.nav": "일반 설정",
    "general.currentVersion": "현재 버전: {version}",
    "developerTools.title": "코드 작업 보기 표시",
    "developerTools.error": "저장 실패. 다시 시도하세요",
    "developerTools.description": "켜면 실행 기록과 이번 턴의 코드 차이를 표시하고 모든 에이전트 프리셋을 선택할 수 있습니다",
    "connection.error": "연결 이상. 새로 고쳐 다시 시도",
    "connection.connecting": "다시 연결하는 중",
    "connection.connected": "연결됨",
    "connection.reconnect": "연결 이상. 눌러서 바로 다시 연결",
    "connection.restart": "연결이 끊겨 다시 시도하는 중. 눌러서 바로 다시 연결",
    "hostRelease.title": "서비스 버전 변경",
    "hostRelease.description": "서비스 버전이 바뀌어 이 페이지의 실시간 업데이트를 멈췄습니다. 새로 고치면 새 버전을 불러옵니다.",
    "hostRelease.service": "서비스",
    "hostRelease.page": "페이지",
    "hostRelease.unknown": "확인 안 됨",
    "hostRelease.reload": "새로 고쳐 새 버전 불러오기",
    "hostRelease.later": "나중에",
    "desktop.update.fullscreenTimeout": "전체 화면을 나가지 못했습니다. 전체 화면을 나간 뒤 업데이트를 다시 시도하세요."
  },
  "settings.models": {
    nav: "모델",
    deepSeekAccount: "DeepSeek 계정",
    title: "모델",
    intro: "각 공급자의 API 키를 넣으면 그 모델을 쓸 수 있습니다.",
    edit: "편집",
    editProvider: "{provider} 편집",
    remove: "삭제",
    removeProvider: "{provider} 삭제",
    deleteTitle: "{provider}을(를) 삭제할까요?",
    deleteDescription: "{provider}을(를) 삭제하면 설정이 지워집니다. 별도로 관리하는 자격 증명이 있다면 그대로 남습니다.",
    deleteDescriptionWithCredential: "{provider}을(를) 삭제하면 설정과 저장된 API 키가 지워집니다.",
    deleteConfirm: "{provider} 삭제",
    deleting: "{provider} 삭제하는 중…",
    add: "모델 공급자 추가",
    addMode: "추가 방법",
    addCatalog: "서드파티 모델 공급자",
    addCustom: "사용자 지정 모델 API",
    addCatalogHint: "기본 목록에서 OpenAI, Anthropic, Kimi 같은 공급자를 골라 API 키를 넣으면 바로 쓸 수 있습니다.",
    addCustomHint: "중계 서버, 직접 띄운 서버, 그 밖에 OpenAI / Anthropic 프로토콜과 호환되는 API에 연결합니다. API 주소, 프로토콜, 모델을 입력해야 합니다.",
    addCatalogExhausted: "목록의 공급자를 모두 추가했습니다.",
    addCustomUnavailable: "쓸 수 있는 API 프로토콜이 없습니다.",
    provider: "공급자",
    close: "닫기",
    cancel: "취소",
    apply: "저장",
    applying: "저장 중…",
    savedProvider: "{provider} 저장됨.",
    credentialConfigured: "API 키 설정됨",
    credentialMissing: "API 키 없음",
    accountSignedIn: "로그인됨",
    readOnly: "현재 배포의 설정 문서는 읽기 전용입니다.",
    loadFailed: "공급자 목록을 불러오지 못했습니다",
    conflict: "이 카드를 열어 둔 동안 다른 곳에서 설정이 바뀌었습니다. 닫았다가 다시 열어 현재 값으로 편집하세요.",
    retry: "다시 시도",
    keyInput: "API 키",
    keyReveal: "키 보기",
    keyHide: "키 숨기기",
    keyPlaceholder: "API 키 입력",
    keyPlaceholderFallback: "비워 두면 환경 인증 사용({hint})",
    keyPlaceholderSaved: "비워 두면 저장된 자격 증명 사용",
    keyFallbackMissing: "환경 변수를 찾지 못했습니다. API 키를 입력하거나 환경 변수 {hint}를 설정하세요.",
    keyFallbackDetected: "환경 변수 찾음({hint})",
    keyFallbackDetectedHidden: "환경 변수 찾음",
    keyFallbackUnchecked: "환경 자격 증명 상태를 아직 확인하지 못함",
    keyHelp: "저장된 자격 증명을 먼저 사용합니다. 여기 표시되는 환경 대체 값의 순서는 {env}입니다. 출처는 실행 환경, $cwd/.env, $DSH_HOME/.env 순입니다.",
    authHelp: "인증 안내",
    customized: "사용자 지정 설정",
    baseUrl: "API 주소",
    baseUrlDefault: "기본 주소 없음",
    baseUrlEnvironment: "공급자 주소 설정: {env}",
    baseUrlConfigured: "공급자가 주소를 설정",
    baseUrlPlaceholder: "{url}",
    deepSeekBaseUrl: "https://api.deepseek.com/anthropic(기본적으로 환경 변수 DEEPSEEK_BASE_URL 사용)",
    deepSeekEndpointHint: "Anthropic Messages 프로토콜과 호환되는 API 주소를 입력하세요.",
    models: "모델 목록",
    modelsInherited: "어댑터 기본 모델 사용 중",
    modelsCustomized: "모델 목록 사용자 지정됨",
    resetModels: "기본 모델 복원",
    model: "모델",
    modelId: "모델 ID",
    modelName: "표시 이름",
    modelNamePlaceholder: "비워 두면 모델 ID 사용",
    contextWindow: "컨텍스트 창",
    contextWindowPlaceholder: "공급자 기본값 사용",
    maxTokens: "최대 출력 토큰 수",
    maxTokensPlaceholder: "공급자 기본값 사용",
    modelAdvanced: "모델 옵션",
    modelInputTypes: "입력 유형",
    modelInputText: "텍스트",
    modelInputImage: "이미지",
    modelReasoning: "추론 수준",
    modelReasoningLevel: "단계",
    modelReasoningValue: "API 파라미터 값",
    modelReasoningHelp: "추론 수준 안내",
    modelReasoningHelpText: "API 파라미터 값은 요청의 추론 강도 필드(예: OpenAI의 reasoning_effort)에 들어갑니다. 기본값은 단계 이름과 같으며 다른 값을 써야 한다면 모델 공급자의 API 문서를 따르세요. Off는 추론을 끄는 단계라 파라미터 값을 비워 둘 수 있습니다. 설정에 이미 적힌 값은 그대로 전송됩니다.",
    modelReasoningNeedsLevel: "Off 외의 단계를 하나 이상 추가하세요. 추론이 필요 없으면 추론 수준을 끄세요.",
    modelReasoningValueRequired: "Off 외의 단계에는 API 파라미터 값을 모두 입력해야 합니다. 빈 문자열은 사용할 수 없습니다.",
    modelReasoningAdd: "단계 추가",
    modelReasoningRemove: "단계 삭제",
    modelReasoningOffValuePlaceholder: "생각 끄기",
    addModel: "모델 추가",
    removeModel: "모델 삭제",
    modelsEmpty: "모델 선택기에 아무 모델도 표시되지 않습니다. 목록에 없는 ID도 직접 보낼 수는 있습니다.",
    keyBlank: "API 키를 입력하세요. 비워 두면 저장된 키를 그대로 씁니다.",
    keyBlankNew: "API 키를 입력하세요. 이 공급자가 다른 방식으로 인증한다면 비워 둬도 됩니다.",
    keyIllegalCharacters: "API 키 형식이 잘못되었습니다. 확인해 주세요.",
    modelIdRequired: "모델 ID는 비워 둘 수 없습니다.",
    modelIdDuplicate: "모델 ID가 중복될 수 없습니다.",
    modelNameInvalid: "표시 이름은 비워 둘 수 없습니다.",
    modelContextInvalid: "컨텍스트 창은 양수여야 합니다. 예: 131072, 256K, 1M.",
    modelMaxTokensInvalid: "최대 출력 토큰 수는 양수여야 합니다. 예: 8192, 64K, 1M.",
    advancedHint: "나머지 항목은 cordis.patch.yml에 있습니다. 해당 부분을 직접 편집하세요.",
    modelCapacityInvalid: "용량은 숫자여야 하며 K 또는 M을 붙일 수 있습니다.",
    modelDuplicate: "모델 ID는 한 번씩만 쓸 수 있습니다.",
    fetchModels: "사용 가능한 모델 가져오기",
    fetching: "모델 목록 가져오는 중…",
    fetchNeedsBaseUrl: "먼저 API 주소를 입력한 뒤 가져오세요.",
    fetchEmpty: "이 공급자에서 모델 목록을 받지 못했습니다. 직접 추가하세요.",
    fetchTitle: "추가할 모델 선택",
    fetchDescription: "모델 공급자가 제공하는 목록에서 추가할 모델을 선택하세요.",
    fetchSearch: "모델 검색",
    fetchNoMatches: "일치하는 모델이 없습니다.",
    fetchSelectAll: "모두 선택",
    fetchDeselectAll: "모두 선택 해제",
    fetchAdopt: "선택한 항목 추가",
    customTag: "사용자 지정",
    customRoute: "공급자 ID",
    customRouteHint: "소문자로 시작하는 식별자로, 요청에서 이 공급자를 구분하고 자격 증명 이름을 만드는 데 쓰입니다.",
    customRouteInvalid: "소문자로 시작해야 하며 그 뒤로 소문자, 숫자, 하이픈을 쓸 수 있습니다.",
    customRouteTaken: "이미 이 ID를 쓰는 공급자가 있습니다.",
    customDisplayName: "표시 이름",
    customApi: "API 프로토콜",
    customApiUnset: "선택 안 함",
    protocolOpenAiCompletions: "OpenAI Chat Completions",
    protocolOpenAiResponses: "OpenAI Responses",
    protocolAnthropicMessages: "Anthropic Messages",
    customNeedsBaseUrl: "사용자 지정 모델 API에는 API 주소가 필요합니다.",
    customBaseUrlInvalid: "올바른 HTTP 또는 HTTPS 주소를 입력하세요.",
    customNeedsModels: "사용자 지정 모델 API에는 모델이 하나 이상 있어야 합니다.",
    customBaseUrlPlaceholder: "https://gateway.example/v1",
    customAnthropicBaseUrlPlaceholder: "https://gateway.example",
    settingsPathUnresolvable: "설정 경로를 해석할 수 없습니다",
    create: "공급자 만들기",
    creating: "만드는 중…",
    welcomeTitle: "미리보기판 안내",
    welcomeBody: "DeepSeek Harness 0.2 버전은 아직 미리보기 단계입니다. 다듬을 부분이 많아 개발자와 사용자 여러분의 의견을 기다립니다. 새 데스크톱 앱은 일반 사용자를 대상으로 하며 개발자용 고급 기능은 설정에서 켤 수 있습니다. DeepSeek Harness의 기능과 플러그인 API는 당분간 빠르게 바뀌고 점차 안정될 예정입니다.\n\n전 세계 사용자와 개발자가 오픈 소스를 재사용하고 조합하며 지능의 한계를 함께 탐구하고자 합니다. DeepSeek Harness로 아이디어를 구현하고 커뮤니티와 함께 플러그인 생태계를 넓혀 주세요.",
    welcomeContinue: "계속",
    welcomeError: "확인 상태를 지금 저장할 수 없습니다. 다시 시도하세요.",
    onboardingTitle: "API 키를 추가해 시작하세요",
    onboardingDescription: "DeepSeek 공식 모델을 설정하면 바로 쓸 수 있습니다.",
    onboardingLater: "나중에 설정",
    onboardingSave: "저장하고 계속",
    onboardingSaving: "저장 중…",
    keyRequired: "API 키를 입력한 뒤 계속하세요.",
    reorderModel: "모델 순서 바꾸기",
    reorderModelHelp: "끌어서 순서를 바꾸거나 위아래 화살표 키를 쓰세요.",
    fetchKeepOne: "모델을 하나 이상 선택하세요."
  },
  "settings.pluginInventory": {
    tab: "플러그인 목록",
    loading: "플러그인 읽는 중…",
    clientSyncing: "이 페이지의 플러그인 동기화 중…",
    clientSyncFailed: "이 페이지의 플러그인을 동기화하지 못했습니다. 서버의 활성화 상태는 그대로입니다.",
    clientSyncRetry: "이 페이지 동기화 다시 시도",
    error: "지금은 플러그인을 읽을 수 없습니다.",
    metadataError: "패키지 메타 정보 오류: {error}",
    retry: "다시 시도",
    search: "플러그인 검색",
    empty: "플러그인이 없습니다.",
    emptySearch: "일치하는 플러그인이 없습니다.",
    presetTitle: "세션 플러그인",
    presetSubtitle: "에이전트 프리셋에 따라 세션별로 구성",
    switcherLabel: "볼 에이전트 프리셋 선택",
    presetOptionDefault: "{name}(기본)",
    presetOptionBroken: "{name}(불러오기 실패)",
    globalTitle: "전역 플러그인",
    globalSubtitle: "시스템과 모든 세션이 함께 씀",
    presetProvidedDetail: "전역에서는 꺼져 있으며 에이전트 프리셋이 세션별로 제공",
    enabledIn: "켜진 곳",
    matchesInOtherPresets: "다른 프리셋에도 일치하는 항목 {count}개가 있습니다: ",
    enabledTag: "켜짐",
    disabledTag: "꺼짐",
    conditionalTag: "조건부 켜짐",
    presetEnabledTag: "프리셋에서 켜짐",
    failedTag: "시작 실패",
    moduleLabel: "전체 이름",
    fromPreset: "출처",
    condition: "끄는 조건",
    configuration: "설정 상태",
    runtime: "실행 상태",
    unobserved: "실행 안 함",
    pending: "의존성 대기 중",
    loadingPhase: "불러오는 중",
    active: "실행 중",
    failed: "시작 실패",
    unloading: "제거 중"
  },
  "settings.plugins": {
    nav: "기본 제공 플러그인",
    title: "기본 제공 플러그인",
    intro: "기본 배포에 포함된 플러그인 목록 보기",
    tabs: "플러그인 보기",
    empty: "이 배포에는 열려 있는 플러그인 보기가 없습니다."
  },
  "settings.sessionLog": {
    title: "공식 모델 API를 쓸 때 세션 로그 올리기",
    description: "DeepSeek 모델과 제품 개선에 도움",
    saved: "설정 저장됨",
    failed: "설정을 저장할 수 없습니다"
  },
  "settings.shell": {
    title: "터미널",
    description: "명령 하나의 최대 실행 시간과 출력량을 제한합니다.",
    timeoutMs: "명령 시간 제한(밀리초)",
    timeoutMsHint: "명령 하나의 최대 실행 시간입니다. 이 시간을 넘으면 종료합니다.",
    maxOutputBytes: "스트림당 출력 한도(바이트)",
    maxOutputBytesHint: "한도를 넘는 출력은 버리지 않고 임시 파일에 저장합니다.",
    overridden: "덮어씀",
    reset: "기본값 복원",
    readOnly: "이 배포의 설정은 읽기 전용입니다.",
    unavailable: "플러그인을 불러오지 않은 상태라 설정할 수 없습니다.",
    save: "저장",
    saving: "저장 중…",
    saveFailed: "설정값이 적용되지 않았습니다. 다시 수정할 수 있도록 입력 내용은 남겨 두었습니다.",
    invalidNumber: "숫자를 입력하세요. 비워 두면 기본값을 씁니다."
  },
  "settings.subagent": {
    overridden: "덮어씀",
    reset: "기본값 복원",
    readOnly: "이 배포의 설정은 읽기 전용입니다.",
    unavailable: "플러그인을 불러오지 않은 상태라 설정할 수 없습니다.",
    save: "저장",
    saving: "저장 중…",
    saveFailed: "설정값이 적용되지 않았습니다. 다시 수정할 수 있도록 입력 내용은 남겨 두었습니다.",
    subagentTitle: "하위 에이전트",
    subagentDescription: "하위 에이전트의 재귀 깊이, 개수, 모델을 설정합니다.",
    subagentLimitsTitle: "실행 제한",
    subagentMaxDepth: "최대 재귀 깊이",
    subagentDepthHelpLabel: "최대 재귀 깊이 안내",
    subagentDepthHelp: "에이전트가 하위 에이전트를 몇 단계까지 만들 수 있는지 제한합니다.",
    subagentDepthZero: "하위 에이전트 끄기",
    subagentDepthOne: "주 에이전트만 하위 에이전트를 만들 수 있음",
    subagentDepthOverride: "도구에 최대 재귀 깊이가 따로 설정되어 있으면 그 설정을 따릅니다.",
    subagentMaxActive: "하위 에이전트 동시 실행 한도",
    subagentCapacityHelpLabel: "하위 에이전트 동시 실행 한도 안내",
    subagentCapacityHelp: "같은 주 에이전트 아래 모든 단계의 하위 에이전트를 합친 동시 유지 한도입니다(주 에이전트 제외). 한도에 도달하면 새 시작 요청을 거부합니다.",
    subagentDepthInvalid: "0 이상의 정수를 입력하세요.",
    subagentCapacityInvalid: "1 이상의 정수를 입력하세요.",
    subagentModelSelectionTitle: "모델 선택",
    subagentModelSelectionToggle: "에이전트가 하위 에이전트의 모델을 고르도록 허용",
    subagentModelSelectionChoose: "켜면 에이전트가 아래에 허용된 모델 중에서 하위 에이전트별로 공급자, 모델, 추론 강도를 고를 수 있습니다. 새 세션에만 적용됩니다.",
    subagentModelSelectionAllowed: "에이전트가 고를 수 있는 모델",
    subagentModelSelectionLoading: "모델 불러오는 중…",
    subagentModelSelectionLoadFailed: "모델을 불러올 수 없습니다.",
    subagentModelSelectionRetry: "다시 시도",
    subagentModelSelectionPartial: "일부 모델 공급자를 지금 불러올 수 없습니다. 저장된 선택 항목은 삭제할 수 있습니다.",
    subagentModelSelectionUnavailable: "지금 쓸 수 없음",
    subagentModelSelectionUnavailableGroup: "저장됐지만 지금 쓸 수 없음",
    subagentModelSelectionEmpty: "지금 모델을 알려 주는 공급자가 없습니다.",
    subagentModelSelectionRequired: "저장하기 전에 모델을 하나 이상 고르세요.",
    subagentModelSelectionConflict: "다른 곳에서 설정이 바뀌었습니다. 수정을 버리고 다시 시도하세요.",
    subagentModelSelectionOff: "끄면 하위 에이전트는 설정된 기본 모델을 사용하거나 상위 에이전트의 모델을 물려받습니다. 선택한 모델 목록은 유지됩니다."
  },
  "settings.webSearch": {
    title: "웹 검색",
    description: "DeepSeek의 검색 공급자를 설정합니다.",
    useSearchApi: "새 웹 검색 API 사용",
    useSearchApiHint: "기본은 꺼져 있고 검색은 DeepSeek Messages로 처리합니다. 새 웹 검색 API의 기능과 요금은 다음을 참고하세요: ",
    searchGuide: "웹 검색·가져오기 안내",
    searchGuideUrl: "https://api-docs.deepseek.com/zh-cn/guides/search",
    apiKey: "API 키",
    apiKeyHint: "설정 파일에 쓰지 않습니다. 비워 두면 현재 키를 유지합니다.",
    apiKeySet: "키가 설정되어 있습니다.",
    apiKeyUnset: "키가 설정되지 않았습니다. DeepSeek 계정 모델을 쓰는 대화만 기본 주소로 검색할 수 있습니다.",
    baseUrl: "Messages API 기본 주소",
    baseUrlHint: "API 접두어를 포함한 주소를 입력하세요(예: https://api.deepseek.com/anthropic/v1). 요청할 때 /messages를 붙입니다. 비워 두면 기본값으로 돌아갑니다.",
    searchApiBaseUrl: "Search / Fetch API 기본 주소",
    searchApiBaseUrlHint: "API 접두어를 포함한 주소를 입력하세요(예: https://api.deepseek.com/v1/tools). 요청할 때 /search 또는 /fetch를 붙입니다. 비워 두면 기본값으로 돌아갑니다.",
    maxUses: "요청당 최대 검색 횟수",
    maxUsesHint: "보조 모델이 Messages 요청 한 번에 할 수 있는 최대 검색 횟수입니다. Messages API에만 적용됩니다.",
    count: "검색당 결과 수",
    countHint: "검색어 하나당 받는 결과 개수입니다. 1–50 사이 정수이며 기본값은 10입니다. 검색 호출 횟수를 정하는 설정은 아닙니다. web_search가 남기는 출처 수는 자체 결과 한도를 넘지 않습니다.",
    overridden: "덮어씀",
    reset: "기본값 복원",
    readOnly: "이 배포의 설정은 읽기 전용입니다.",
    unavailable: "플러그인을 불러오지 않은 상태라 설정할 수 없습니다.",
    save: "저장",
    saving: "저장 중…",
    saveFailed: "설정값이 적용되지 않았습니다. 다시 수정할 수 있도록 입력 내용은 남겨 두었습니다.",
    invalidNumber: "숫자를 입력하세요. 비워 두면 기본값을 씁니다.",
    invalidCount: "1–50 사이 정수를 입력하세요. 비워 두면 기본값을 씁니다."
  },
  shortcuts: {
    "edit-label": "{command} 단축키 바꾸기",
    record: "단축키를 누르세요",
    "record-help": "조합 키를 떼면 저장됩니다. Tab으로 작업 전환, Esc로 입력 끝내기.",
    "web-help": "브라우저에서 쓸 수 있는 조합: Mod+/, Mod+Shift+,, Mod+Shift+.. Mod는 Mac에서 Command, 다른 시스템에서 Ctrl입니다.",
    "unsupported-key": "이 키는 아직 지원하지 않습니다.",
    reserved: "시스템이나 텍스트 편집 기능에서 사용하는 키 조합입니다.",
    "modifier-required": "Command, Ctrl, Alt 보조 키를 함께 누르세요.",
    "too-many-keys": "보조 키가 아닌 키는 두 개까지만 함께 누를 수 있습니다. 뗀 뒤 다시 시도하세요.",
    "macos-web-help": "Command+/, Command+,, Command+백슬래시, Control+백틱, Command+Option+키, Command+Shift+키로 설정할 수 있습니다. 서로 다른 보조 키 3~4개 조합도 됩니다. 브라우저나 시스템이 쓰는 조합은 페이지까지 전달되지 않을 수 있습니다.",
    "windows-web-help": "Ctrl+/, Ctrl+,, Ctrl+Alt+키, Ctrl+Shift+키로 설정할 수 있습니다. 서로 다른 보조 키 3~4개 조합도 됩니다. 브라우저나 시스템이 쓰는 조합은 페이지까지 전달되지 않을 수 있습니다.",
    "unsupported-browser": "이 브라우저는 이 조합을 아직 지원하지 않습니다.",
    conflict: "‘{commands}’에서 이미 사용하는 키 조합입니다",
    saved: "바뀜",
    clear: "제거",
    "retry-save": "저장 다시 시도",
    reset: "기본값 복원",
    "reset-all": "모두 기본값으로",
    "modified-count": "{count}개 사용자 지정됨",
    "reset-title": "단축키를 모두 기본값으로 되돌릴까요?",
    "reset-description": "현재 플랫폼의 기본 단축키로 되돌립니다. 바꾸거나 지운 단축키가 모두 돌아오며 다른 플랫폼에는 영향이 없습니다.",
    cancel: "취소",
    "reset-saved": "기본 단축키로 되돌렸습니다",
    "close-confirmation": "확인 닫기",
    "reset-failed": "기본값 복원에 실패했습니다. 원래 단축키는 그대로이니 다시 시도하세요.",
    review: "최신 설정을 확인했습니다",
    stale: "단축키 설정이나 쓸 수 있는 명령이 바뀌었습니다. 최신 키 배치를 확인한 뒤 저장하세요.",
    "write-failed": "저장에 실패했습니다. 원래 단축키와 현재 초안은 그대로이니 다시 시도하세요.",
    "not-ready": "단축키가 아직 준비되지 않았습니다. 잠시 뒤 다시 시도하세요.",
    read: "{location}을(를) 읽을 수 없습니다. 접근 권한을 확인한 뒤 {reload}하세요.",
    invalid: "{location}의 단축키 설정이 손상되었습니다. 먼저 백업하고 고친 뒤 {reload}하세요.",
    future: "{location}의 단축키 설정은 더 새로운 버전에서 만들어졌습니다. Harness를 업그레이드한 뒤 다시 시도하세요.",
    "web-document": "현재 사이트 로컬 저장소의 dsh.keybindings.v1",
    "desktop-document": "userData/keybindings.json",
    "web-reload": "페이지 새로 고침",
    "desktop-reload": "Harness 다시 시작",
    "using-defaults": "지금은 기본 키 배치를 씁니다.",
    "using-accepted": "마지막으로 읽어 온 키 배치를 계속 씁니다.",
    "native-failed": "데스크톱 키 입력 보호를 켤 수 없습니다. 닫은 뒤 다시 시도하세요.",
    "global-hint": "어디서나 불러와 보기",
    "clear-search": "검색 지우기",
    title: "단축키",
    open: "단축키 빠른 보기",
    settings: "단축키",
    view: "단축키 편집",
    description: "사용 가능한 단축키와 입력 동작 확인·편집",
    search: "단축키 검색",
    close: "단축키 닫기",
    application: "앱 동작",
    input: "메시지 입력",
    menus: "메뉴와 팝업",
    approval: "승인 영역",
    unbound: "단축키 없음",
    empty: "일치하는 단축키가 없습니다",
    move: "메뉴 선택 이동",
    select: "메뉴 항목 선택",
    dismiss: "메뉴나 맨 위 팝업 닫기"
  },
  sidebar: {
    "session.new": "새 세션",
    "session.new.label": "새 세션",
    "toggle.open": "사이드바 열기",
    "toggle.collapse": "사이드바 접기",
    "panels.label": "전역 패널",
    "panels.more": "더 보기",
    "navigation.label": "탐색",
    "version.copied": "버전 복사됨"
  },
  sidebarBrowser: {
    "type.label": "브라우저",
    "guide.title": "브라우저",
    "guide.description": "웹 둘러보기",
    "shortcut.noSession": "먼저 세션을 여세요",
    "address.placeholder": "HTTP(S) 주소 입력",
    "address.changed": "URL이 바뀌었습니다",
    back: "뒤로",
    forward: "앞으로",
    reload: "새로 고침",
    go: "이동",
    external: "시스템 브라우저에서 열기",
    "sandbox.disable": "샌드박스 제한 끄기",
    "sandbox.enable": "샌드박스 제한 다시 켜기",
    "sandbox.warning": "샌드박스 제한이 꺼졌습니다. 페이지가 앱 전체를 이동시키고 다운로드, 모달 대화상자, 입력 잠금을 쓸 수 있습니다.",
    start: "HTTP(S) 주소를 입력해 둘러보기 시작",
    loading: "여는 중…",
    "restore.previous": "마지막으로 연 곳",
    "restore.action": "페이지 복원",
    "error.empty": "주소를 입력하세요.",
    "error.invalid": "주소가 올바르지 않거나 너무 깁니다.",
    "error.protocol": "HTTP와 HTTPS 주소만 지원합니다. 로컬 파일은 문서 미리보기를 쓰세요.",
    "error.credentials": "주소에 사용자 이름이나 비밀번호를 넣을 수 없습니다.",
    "error.application-origin": "내장 브라우저에서 DSH 앱 자체를 열 수는 없습니다.",
    "load.failed": "페이지를 불러오지 못했습니다. 새로 고쳐 다시 시도하거나 시스템 브라우저에서 여세요.",
    "load.failed.detail": "페이지를 불러오지 못했습니다({code}): {description}",
    "address.unknown": "페이지가 이동했습니다. 지금 방식으로는 새 URL을 읽을 수 없습니다."
  },
  sidebarFiles: {
    "shortcut.noSession": "먼저 세션을 고르세요",
    "type.label": "파일",
    "guide.title": "작업 공간 파일",
    "guide.description": "세션 작업 공간의 파일 둘러보기",
    loading: "읽는 중…",
    empty: "빈 폴더",
    truncated: "항목이 너무 많아 일부만 보여 줍니다.",
    noWorkspace: "이 세션에는 작업 공간 폴더가 없습니다.",
    reload: "다시 읽기",
    autoRefresh: "자동 새로 고침",
    "autoRefresh.enable": "자동 새로 고침 켜기",
    "autoRefresh.disable": "자동 새로 고침 끄기",
    "entry.other": "파일이나 폴더가 아니라 열 수 없습니다.",
    "error.notFound": "이 폴더가 없습니다. 옮겨졌거나 삭제됐을 수 있습니다.",
    "error.outsideWorkspace": "이 폴더는 작업 공간 밖에 있어 사이드바에서 읽지 않습니다.",
    "error.notDirectory": "폴더가 아닙니다.",
    "error.unavailable": "읽기 실패: {message}",
    "entry.noViewer": "이 파일을 열 수 있는 뷰어가 없습니다.",
    "navigator.show": "파일 트리 보기",
    "navigator.hide": "파일 트리 숨기기",
    "navigator.resize": "파일 트리 너비 조정"
  },
  sidebarRight: {
    "command.close": "현재 페이지/창 닫기",
    "command.refresh": "현재 페이지 새로 고침",
    "command.noRefresh": "현재 페이지는 새로 고칠 수 없습니다",
    "command.toggle": "오른쪽 사이드바 펼치기/접기",
    "command.fullscreen": "패널 전체 화면/나가기",
    "command.noSession": "먼저 세션을 고르세요",
    "command.noFocus": "먼저 오른쪽 패널에 포커스를 두세요",
    "command.stale": "페이지가 바뀌었습니다. 다시 포커스를 두세요",
    "command.collapsed": "먼저 오른쪽 사이드바를 펼치세요",
    "command.float": "떠 있는 패널에서는 이 동작을 할 수 없습니다",
    "command.empty": "먼저 페이지를 여세요",
    "command.budget": "패널은 최대 두 칸까지 나눌 수 있습니다",
    "command.width": "폭이 좁습니다. 사이드바를 넓힌 뒤 나누세요",
    "chrome.expand": "사이드바 열기",
    "chrome.expandAria": "오른쪽 사이드바 열기",
    "chrome.collapse": "사이드바 접기",
    "chrome.collapseAria": "오른쪽 사이드바 접기",
    "chrome.toFullscreen": "전체 화면",
    "chrome.exitFullscreen": "전체 화면 나가기",
    "dock.emptyPane": "빈 패널",
    "dock.splitPane": "화면 나누기",
    "dock.splitPaneDisabled": "패널은 최대 두 칸까지 나눌 수 있습니다",
    "dock.splitPaneNarrow": "폭이 좁습니다. 사이드바를 넓힌 뒤 나누세요",
    "dock.closeTab": "닫기",
    "dock.addTab": "새 탭",
    "dock.dockFloat": "사이드바로 되돌리기",
    "dock.closeFloat": "닫기",
    "dock.drop.center": "여기로 옮기기",
    "dock.drop.left": "왼쪽으로 나누기",
    "dock.drop.right": "오른쪽으로 나누기",
    "dock.drop.top": "위로 나누기",
    "dock.drop.bottom": "아래로 나누기",
    "tab.guide.title": "시작",
    "tab.guide.more": "도구 더 보기",
    "tab.unavailable": "이 콘텐츠는 아직 표시할 수 없습니다.",
    "menu.close": "닫기",
    "menu.closeOthers": "다른 탭 닫기",
    "menu.closeRight": "오른쪽 탭 닫기"
  },
  sidebarTerminal: {
    "shortcut.noSession": "먼저 세션을 고르세요",
    recoveryFailed: "터미널 복원 실패: {message}",
    retryRecovery: "터미널 복원 다시 시도",
    shell: "셸 선택",
    shellLoading: "셸 읽는 중…",
    shellEmpty: "쓸 수 있는 셸이 없습니다",
    description: "세션 작업 공간에서 명령 실행",
    title: "터미널",
    new: "새 터미널",
    loading: "터미널 환경 읽는 중…",
    creating: "시작하는 중…",
    connecting: "연결하는 중…",
    disconnected: "연결이 끊겼습니다.",
    reconnect: "다시 연결",
    readonly: "이 페이지는 지금 읽기 전용입니다.",
    control: "입력 가져오기",
    closed: "터미널이 닫혔습니다.",
    exited: "프로세스 종료({code})",
    failed: "터미널 오류: {message}",
    rename: "터미널 이름",
    unavailable: "쓸 수 없음",
    retry: "다시 시도",
    cleanupFailed: "터미널 ‘{title}’을(를) 끝내지 못했습니다: {message}",
    missingTerminal: "이 터미널은 더 이상 없습니다. 새 터미널을 여세요.",
    inputFull: "입력 버퍼가 가득 찼습니다. 다시 연결한 뒤 시도하세요.",
    attachmentEnded: "터미널 연결이 끝났습니다. 다시 연결하세요.",
    invalidOutput: "터미널 화면 전송에 문제가 있습니다. 다시 연결하세요.",
    terminalLimit: "터미널 개수 한도에 도달했습니다. 쓰지 않는 터미널을 닫은 뒤 다시 시도하세요. 종료된 터미널도 개수에 들어갑니다."
  },
  skill: {
    "row.title": "스킬 불러오기",
    "row.running": "스킬 불러오는 중",
    "row.preparing": "스킬 불러올 준비 중",
    "row.failed": "스킬 불러오기 실패",
    "row.stopped": "스킬 불러오기 중단됨",
    "row.instructions": "설명",
    "row.inspect": "보기",
    "menu.userOnly": "사용자 전용"
  },
  subagent: {
    "duration.seconds": "{seconds}초",
    "duration.minutes": "{minutes}분 {seconds}초",
    "duration.hours": "{hours}시간 {minutes}분 {seconds}초",
    "duration.days": "{days}일",
    "duration.daysHours": "{days}일 {hours}시간",
    "duration.months": "약 {months}개월",
    "duration.monthsDays": "약 {months}개월 {days}일",
    "duration.years": "약 {years}년",
    "duration.yearsMonths": "약 {years}년 {months}개월",
    "duration.exactDays": "{days}일 {hours}시간 {minutes}분 {seconds}초",
    "duration.exactTitle": "총 활동 시간: {duration}",
    "tokens.thousand": "{value}K",
    "tokens.million": "{value}M",
    "tokens.total": "{value} tok",
    "loading.label": "하위 에이전트 불러오는 중…",
    "load.error": "하위 에이전트를 불러올 수 없습니다",
    "catalog.migrationRequired": "마이그레이션 필요",
    retry: "다시 시도",
    "mode.external": "외부 작업",
    "mode.oneShot": "일회성",
    "mode.continuable": "이어서 대화 가능",
    "mode.unknown": "모드 알 수 없음",
    "readonly.unknown.body": "하위 세션을 읽어야 대화를 이어갈 수 있는지 확인할 수 있습니다.",
    "activity.running": "실행 중",
    "activity.completed": "완료",
    "activity.inactive": "실행 중이 아님",
    "branch.collapse": "{label}의 하위 에이전트 접기",
    "branch.expand": "{label}의 하위 에이전트 펼치기",
    "count.total.one": "하위 에이전트 {count}개",
    "count.total.other": "하위 에이전트 {count}개",
    "count.running.one": "하위 에이전트 {count}개, 실행 중",
    "count.running.other": "하위 에이전트 {count}개, 실행 중",
    "switcher.aria": "하위 에이전트 전환: {title}",
    "tree.aria": "하위 에이전트 세션",
    "open.sidebar": "사이드바에서 열기",
    "open.sidebar.aria": "사이드바에서 {label} 열기",
    "sidebar.chat": "채팅",
    "readonly.oneShot.title": "일회성 하위 에이전트 기록",
    "readonly.title": "이 하위 에이전트는 잠시 읽기 전용입니다",
    "readonly.oneShot.body": "일회성 작업은 이어서 메시지를 보낼 수 없습니다. 여기서 전체 실행 기록을 볼 수 있습니다.",
    "readonly.body": "상위 세션이 지금 온라인이 아닙니다. 상위 세션을 다시 열면 메시지를 계속 보낼 수 있습니다.",
    "open.floatWindow": "떠 있는 패널에서 열기"
  },
  "settings.theme": {
    "appearance.title": "모양",
    "appearance.light": "밝게",
    "appearance.dark": "어둡게",
    "appearance.system": "시스템 설정 따르기",
    "fontSize.text.title": "글자 크기",
    "fontSize.text.description": "세션 내용의 글자 크기에만 적용됩니다",
    "fontSize.text.increase": "글자 크게",
    "fontSize.text.decrease": "글자 작게",
    "fontSize.code.title": "코드 글자 크기",
    "fontSize.code.description": "코드 블록, 인라인 코드, 도구 출력에 쓰입니다",
    "fontSize.code.increase": "코드 글자 크게",
    "fontSize.code.decrease": "코드 글자 작게",
    "fontSize.terminal.title": "터미널 글자 크기",
    "fontSize.terminal.description": "사이드바 터미널에 쓰입니다",
    "fontSize.terminal.increase": "터미널 글자 크게",
    "fontSize.terminal.decrease": "터미널 글자 작게",
    "fontSize.unit": "px",
    "fontFamily.text.title": "본문 글꼴",
    "fontFamily.text.description": "화면과 세션 본문에 쓰입니다. 여러 글꼴은 쉼표로 구분하고 비워 두면 기본 글꼴을 씁니다",
    "fontFamily.code.title": "코드 글꼴",
    "fontFamily.code.description": "코드 블록, 인라인 코드, 도구 출력에 쓰입니다. 여러 글꼴은 쉼표로 구분하고 비워 두면 기본 글꼴을 씁니다",
    "fontFamily.terminal.title": "터미널 글꼴",
    "fontFamily.terminal.description": "사이드바 터미널에 쓰입니다. 여러 글꼴은 쉼표로 구분하고 비워 두면 기본 글꼴을 씁니다",
    "fontFamily.placeholder": "기본",
    "fontSize.more": "글꼴 설정 더 보기"
  },
  trajectory: {
    "view.trajectory": "실행 기록",
    "toolbar.aria": "실행 기록 도구 모음",
    "toolbar.duration": "소요 시간",
    "toolbar.useActualDuration": "실제 시간 비율로 보기",
    "toolbar.useEqualWidth": "동작을 같은 폭으로 보기",
    "toolbar.actualTime": "실제 시간",
    "toolbar.turns": "턴",
    "toolbar.expandTurns": "모든 턴 펼치기",
    "toolbar.collapseTurns": "모든 턴 접기",
    "toolbar.calls": "호출",
    "toolbar.expandCalls": "모든 호출 펼치기",
    "toolbar.collapseCalls": "모든 호출 접기",
    "toolbar.search": "실행 기록 검색",
    "toolbar.searchPlaceholder": "검색",
    "kind.system": "시스템",
    "kind.user": "사용자",
    "kind.context": "컨텍스트",
    "kind.compacted": "압축됨",
    "kind.message": "메시지",
    "kind.assistant": "어시스턴트",
    "kind.tool": "도구",
    "kind.subtool": "하위 도구",
    "kind.sub": "하위 항목",
    "column.input": "입력",
    "column.output": "출력",
    "column.think": "생각",
    "column.time": "시간",
    "column.model": "모델",
    "column.tools": "도구",
    "turn.label": "{turn}번째 턴",
    "section.betweenTurns": "턴 사이",
    "group.message": "메시지",
    "group.step": "{step}단계",
    "group.compaction": "압축 {seq}",
    "status.failed": "실패",
    "status.pending": "기다리는 중",
    "status.completed": "완료",
    "timing.notAvailable": "쓸 수 없음",
    "timing.notRecorded": "기록 안 됨",
    "timing.stepStartUnavailable": "단계 시작 시간 없음",
    "timing.firstTokenUnavailable": "첫 토큰 시간 없음",
    "timing.usageUnavailable": "사용량 없음",
    "timing.outputTokensUnavailable": "출력 토큰 수 없음",
    "timing.durationTooShort": "시간이 너무 짧음",
    "timing.showLocalTime": "현지 시간 보기",
    "timing.showUnixTimestamp": "Unix 타임스탬프 보기",
    "timing.started": "시작 시간",
    "timing.totalDuration": "총 소요 시간",
    "timing.ttft": "첫 토큰 지연",
    "timing.generation": "생성",
    "timing.throughput": "처리량",
    "timing.duration": "소요 시간",
    "timing.source": "시간 측정 출처",
    "timing.sessionTimestamps": "세션 타임스탬프",
    "timing.sessionTimestampsRunning": "세션 타임스탬프(실행 중)",
    "timing.request": "요청 시간 측정",
    "unit.milliseconds": "{value}ms",
    "unit.seconds": "{value}초",
    "unit.tokens": "{value} tok",
    "unit.tokensPerSecond": "{value} tok/s",
    "usage.tokens": "토큰",
    "usage.reasoning": "추론",
    "usage.content": "내용",
    "usage.notReported": "사용량 보고 없음",
    "usage.input": "입력",
    "usage.cached": "캐시 읽기",
    "usage.cacheCreated": "캐시 쓰기",
    "usage.other": "기타",
    "usage.output": "출력",
    "usage.thisRequest": "이번 요청",
    "usage.sessionCumulative": "세션 누적",
    "options.notRecorded": "기록된 옵션 없음",
    "options.json": "요청 옵션 JSON",
    "source.unknown": "알 수 없음",
    "source.user": "사용자",
    "source.plugin": "플러그인",
    "source.pluginNamed": "플러그인 · {plugin}",
    "source.goal": "목표",
    "source.goalRound": "목표 · {round}회차",
    "source.notRecorded": "기록된 출처 없음",
    "source.messageJson": "메시지 출처 JSON",
    "tab.summary": "개요",
    "tab.rawOutput": "원본 출력",
    "tab.preview": "미리보기",
    "tab.raw": "원본 내용",
    "tab.source": "출처",
    "tab.payload": "인자",
    "tab.result": "결과",
    "tab.schema": "스키마",
    "tab.timing": "시간 측정",
    "tab.diff": "차이",
    "tab.systemPrompt": "시스템 프롬프트",
    "tab.tools": "도구",
    "tab.options": "옵션",
    "tab.usage": "사용량",
    "record.toolCallOnly": "(도구 호출만)",
    "record.noContent": "내용 없음",
    "record.noPayload": "인자 기록 없음",
    "record.noResult": "결과 기록 없음",
    "record.noOutput": "출력 없음",
    "record.schemaUnavailable": "스키마를 쓸 수 없음",
    "record.parameters": "인자",
    "record.resultJson": "결과 JSON",
    "record.json": "JSON",
    "record.parametersJson": "인자 JSON",
    "record.namedParametersJson": "{name} 인자 JSON",
    "record.payloadJson": "인자 JSON",
    "record.outputJson": "결과 JSON",
    "record.thinking": "생각",
    "record.wrapLines": "자동 줄바꿈",
    "code.source": "코드",
    "code.output": "출력",
    "code.copySource": "코드 복사",
    "code.copyOutput": "출력 복사",
    "code.originalJson": "원본 JSON",
    "code.running": "실행 중…",
    "record.systemPromptMissing": "이번 요청에는 시스템 프롬프트가 없습니다",
    "record.toolsMissing": "이번 요청에는 도구가 없습니다",
    "record.systemPrompt": "시스템 프롬프트",
    "record.tools": "도구",
    "block.openSummary": "{index}번째 블록의 도구 호출 개요 열기",
    "block.openSummaryTitle": "도구 호출 개요 열기",
    "block.label": "블록 #{index} {type}",
    "history.loadingTrajectory": "실행 기록 불러오는 중…",
    "history.loadingEarlier": "이전 기록 불러오는 중…",
    "history.loadingEarlierAria": "이전 기록 불러오는 중…",
    "history.loadEarlier": "이전 기록 불러오기",
    "history.clickToLoadEarlier": "눌러서 이전 기록 불러오기",
    "request.label": "요청 #{request}",
    "request.labelCompaction": "요청 #{request} · 압축",
    "request.compaction": "압축 · {section}",
    "request.compactionPurpose": "압축",
    "request.retryProgress": "{retry}/{maximum}",
    "request.collapsedSummary": "접힌 {kind} 개요, {summary}",
    "request.collapsedTurn": "턴",
    "request.collapsedAssistant": "어시스턴트",
    "request.rowAria": "{request}{kind}, {content}",
    "request.rowPrefix": "요청 {request}, ",
    "request.rowAriaCompaction": "요청 {request}, 압축",
    "request.noContent": "내용 없음",
    "summary.toolCalls.one": "도구 호출 {count}개",
    "summary.toolCalls.other": "도구 호출 {count}개",
    "summary.steps.one": "단계 {count}개",
    "summary.steps.other": "단계 {count}개",
    "details.event": "이벤트 상세",
    "details.resize": "이벤트 상세 너비 조정",
    "details.resizeTitle": "끌어서 크기를 조절하세요. 더블클릭하면 기본값으로 되돌립니다.",
    "details.close": "상세 닫기",
    "details.status": "상태",
    "details.purpose": "용도",
    "details.provider": "공급자",
    "details.model": "모델",
    "details.toolCalls": "도구 호출",
    "details.subtoolCalls": "하위 도구 호출",
    "details.error": "오류",
    "details.lastAttemptError": "지난 시도 오류",
    "details.failure.auth": "API 키가 올바르지 않습니다",
    "details.retry": "다시 시도",
    "details.retryDelay": "재시도 대기 시간",
    "details.result": "결과",
    "details.compacted": "압축됨",
    "details.assistantMessage": "어시스턴트 메시지",
    "details.source": "출처",
    "details.hierarchy": "계층",
    "details.toolCall": "도구 호출",
    "timeline.aria": "실행 기록 타임라인",
    "timeline.overviewAria": "타임라인 개요. 가로로 끌면 이벤트에 초점을 맞춥니다",
    "timeline.noTimingData": "시간 데이터 없음",
    "timeline.total": "총 {duration}",
    "timeline.started": "{time} 시작",
    "timeline.ttftDecoding": "첫 토큰 {ttft} · 디코딩 {decoding}",
    "layout.compacting": "컨텍스트 압축 중…",
    "layout.compactionFailed": "컨텍스트 압축 실패",
    "layout.compacted": "컨텍스트가 압축됨",
    "layout.toolCallOnly": "도구 호출만",
    "attachment.list": "첨부",
    "attachment.imageName": "이미지 {index}",
    "layout.imageCount": "이미지 ×{count}",
    "layout.fileAttachments": "파일 ×{count}",
    "layout.initialSystemPrompt": "처음 시스템 프롬프트",
    "layout.systemPromptUpdated": "시스템 프롬프트가 업데이트됨",
    "layout.toolsUpdated": "도구가 업데이트됨",
    "layout.toolAdded": "도구 추가됨: {name}",
    "layout.toolRemoved": "도구 제거됨: {name}",
    "layout.toolUpdateNotice": "도구가 업데이트됨",
    "layout.toolsAdded": "추가: {names}",
    "layout.toolsAddedCount": "{count}개 추가",
    "layout.toolsChanged": "{added}개 추가, {removed}개 제거",
    "layout.toolsRemoved": "제거: {names}",
    "layout.toolsRemovedCount": "{count}개 제거",
    "layout.systemPromptAndToolsUpdated": "시스템 프롬프트와 도구가 업데이트됨",
    "layout.compactionInterrupted": "컨텍스트 압축이 끝나기 전에 중단되었습니다.",
    "toolbar.subCalls": "하위 호출",
    "toolbar.expandSubCalls": "모든 하위 호출 펼치기",
    "toolbar.collapseSubCalls": "모든 하위 호출 접기",
    "record.rawResult": "원본 결과",
    "record.renderedResult": "렌더링된 결과",
    "record.rawResultUnavailable": "원본 결과는 실시간 도구 호출에서만 볼 수 있습니다",
    "request.collapsedTool": "하위 호출"
  },
  question: {
    "error.incomplete": "먼저 이 질문을 마쳐 주세요.",
    "error.unanswered": "선택지를 고르거나 직접 답을 적어 주세요.",
    "error.unavailable": "지금은 제출할 수 없습니다. 잠시 뒤 다시 시도하세요.",
    "error.resubmit": "답변이 전달되지 않았고 작업은 계속되었습니다. 한 번 더 제출해 주세요.",
    "status.sent": "답변은 보냈지만 패널을 닫지 못했습니다.",
    "wait.takeTime": "천천히 답하기",
    "wait.countdown": "{seconds}초 뒤 작업 계속",
    "wait.paused": "일시 중지 · {seconds}초 남음",
    "wait.held": "답할 때까지 계속 기다립니다",
    "wait.continued": "작업은 계속 진행 중입니다. 지금도 답변할 수 있습니다",
    "review.status": "답변함",
    "review.skipped": "앞서 건너뛴 질문입니다.",
    "reply.label": "앞서 기다리던 질문에 답하기",
    "reply.open": "질문 상세 펼치기",
    "reply.close": "질문 상세 접기",
    "reply.answerLabel": "답변: ",
    "reply.skipped": "건너뜀",
    "nav.prev": "이전 질문",
    "nav.next": "다음 질문",
    "nav.minimize": "질문 카드 접기",
    "nav.maximize": "질문 카드 펼치기",
    "nav.cancel": "질문 묶음 전체 포기",
    "nav.close": "질문 패널 접기(도구 호출에서 다시 열 수 있음)",
    "option.recommended": "추천",
    "custom.placeholder": "답을 입력하세요",
    "action.skip": "건너뛰기",
    "action.next": "다음 질문",
    "plan.header": "계획 검토 대기",
    "plan.approve": "실행 동의",
    "plan.decline": "거부",
    "plan.discuss": "수정 요청",
    "text.expand": "펼치기",
    "text.collapse": "접기"
  },
  workflowRun: {
    "run.title": "{name}",
    "run.members.one": "멤버 {count}명",
    "run.members.other": "멤버 {count}명",
    "run.empty": "시작한 멤버 없음",
    "phase.unassigned": "단계 없음",
    "phase.empty": "빈 단계 이름",
    "statusCount.running": "{count}개 실행 중",
    "statusCount.completed": "{count}개 완료",
    "statusCount.failed": "{count}개 실패",
    "statusCount.cancelled": "{count}개 취소",
    "statusCount.interrupted": "{count}개 중단",
    "member.empty": "빈 멤버 이름",
    "member.open": "{name} 열기",
    "status.running": "실행 중",
    "status.completed": "완료",
    "status.failed": "실패",
    "status.cancelled": "취소됨",
    "status.interrupted": "중단됨"
  },
  workspace: {
    "defaultWorkspace.failed": "기본 작업 공간을 만들 수 없습니다. ‘작업 공간 선택’으로 폴더를 고르세요",
    "draft.workspaceRequired": "먼저 작업 공간을 고르세요",
    "draft.initializationFailed": "지금은 초안을 넣을 수 없습니다. 잠시 뒤 다시 시도하세요",
    "group.ungrouped": "그룹 없음",
    "session.new": "새 세션",
    "session.untitled": "이름 없음",
    "shortcut.noSession": "먼저 세션을 고르세요",
    "shortcut.noPicker": "폴더 선택기를 쓸 수 없습니다",
    "shortcut.directoryBusy": "작업 공간을 고르거나 추가하는 중",
    "shortcut.noCompletedTurn": "현재 세션에는 끝난 턴이 없습니다",
    "shortcut.forkFailed": "세션을 분기할 수 없습니다. 다시 시도하세요",
    "section.workspaces": "작업 공간",
    "section.sessions": "세션",
    "viewOptions.label": "보기 옵션",
    "groupBy.label": "그룹 방식",
    "groupBy.workspace": "작업 공간별",
    "groupBy.workspaceTree": "작업 공간 트리별",
    "groupBy.flat": "한 목록",
    "orderBy.label": "정렬 방식",
    "orderBy.manual": "직접 정렬",
    "orderBy.updated": "최근 업데이트 순",
    "filterBy.label": "세션 필터",
    "viewOptions.hideArchived": "보관된 항목 숨기기",
    "viewOptions.showArchived": "모든 대화(보관 포함)",
    "viewOptions.onlyArchived": "보관된 항목만",
    "sessions.expand": "나머지 세션 {n}개 펼치기",
    "sessions.collapse": "접기",
    "empty.none": "세션이 없습니다",
    "empty.noneArchived": "보관된 세션이 없습니다",
    "empty.viewOthers": "다른 세션 보기",
    "empty.noMatches": "일치하는 결과 없음",
    "workspace.add": "작업 공간 추가",
    "search.sessions.aria": "세션 검색",
    "search.placeholder": "세션 이름 검색",
    "search.clear": "검색 지우기",
    "search.results.aria": "검색 결과",
    "search.pending": "세션 기록 검색 중…",
    "search.noMatches": "일치하는 세션 없음",
    "search.hasMore": "앞의 {n}개 결과만 보여 줍니다. 검색 범위를 좁혀 보세요.",
    "menu.addWorkspace": "작업 공간 추가…",
    "picker.loading": "작업 공간 불러오는 중…",
    "conflict.named": "“{name}”이라는 작업 공간이 이미 있습니다.",
    "folderError.title": "폴더를 열 수 없습니다",
    "folderError.retry": "다시 고르기",
    rename: "이름 바꾸기",
    "rename.workspace.title": "작업 공간 이름 바꾸기",
    "rename.session.title": "세션 이름 바꾸기",
    "field.workspaceName": "작업 공간 이름",
    "field.sessionName": "세션 이름",
    "delete.workspace": "작업 공간 삭제",
    "delete.desc": "“{name}”을(를) 작업 공간 목록에서 제거합니다. 폴더와 세션 기록은 유지되며 해당 세션은 ‘그룹 없음’ 아래에 표시됩니다.",
    "delete.pending": "작업 공간 삭제하는 중…",
    "menu.fork": "세션 분기",
    "menu.archiveSession": "세션 보관",
    "menu.unarchiveSession": "보관 해제",
    "menu.deleteSession": "세션 삭제",
    "delete.session.confirm": "“{title}” 세션을 삭제할까요?\n\n목록에서 바로 사라지고 기록 파일은 다음에 Harness를 켤 때 휴지통으로 옮겨집니다.",
    "menu.pinSession": "세션 고정",
    "menu.unpinSession": "고정 해제",
    "menu.sessionId": "세션 ID 복사",
    "toast.sessionIdCopied": "세션 ID 복사됨",
    "toast.sessionIdCopyFailed": "복사 실패. 다시 시도하세요",
    "row.archived": "보관됨",
    "row.pinned": "고정됨",
    "toast.archivedNotOpenable": "보관된 대화는 지금 볼 수 없습니다. 보관을 해제한 뒤 보세요",
    "toast.archived": "세션을 보관했습니다. ",
    "toast.stoppedAndArchived": "중지하고 보관했습니다. ",
    "archive.confirm.title": "이 세션을 중지하고 보관할까요?",
    "archive.confirm.desc": "“{title}”에 진행 중인 작업이 있습니다. 보관하면 먼저 이 작업들을 멈춥니다. 나중에 사이드바 필터 ‘모든 대화(보관 포함)’에서 세션을 복원할 수 있지만 멈춘 작업이 자동으로 이어지지는 않습니다.",
    "archive.confirm.activity": "멈출 작업",
    "archive.confirm.turn": "진행 중인 턴",
    "archive.confirm.subagents.one": "실행 중인 하위 에이전트 {n}개: {names}",
    "archive.confirm.subagents.other": "실행 중인 하위 에이전트 {n}개: {names}",
    "archive.confirm.jobs.one": "백그라운드 작업 {n}개: {names}",
    "archive.confirm.jobs.other": "백그라운드 작업 {n}개: {names}",
    "archive.confirm.schedules.one": "예약 알림 {n}개: {names}",
    "archive.confirm.schedules.other": "예약 알림 {n}개: {names}",
    "archive.confirm.other.one": "그 밖의 작업 {n}개({kind})",
    "archive.confirm.other.other": "그 밖의 작업 {n}개({kind})",
    "archive.confirm.listSeparator": "、",
    "archive.confirm.action": "중지하고 보관",
    "archive.confirm.pending": "중지하고 보관하는 중…",
    "toast.archivedUndo": "실행 취소",
    "toast.archivedOr": "또는",
    "toast.archivedFilter": "보관된 세션 필터",
    "toast.pinFailed": "고정 실패. 잠시 뒤 다시 시도하세요",
    "toast.unpinFailed": "고정 해제 실패. 잠시 뒤 다시 시도하세요",
    "toast.createFailed": "새 세션 만들기 실패: {message}",
    "toast.forkRequiresOpen": "먼저 원래 세션을 열어 마이그레이션을 끝낸 뒤 분기하세요",
    "toast.openForkSource": "원래 세션 열기",
    "sessions.count.one": "세션 {n}개",
    "sessions.count.other": "세션 {n}개",
    "actions.workspace.aria": "작업 공간 “{name}” 메뉴",
    "actions.session.aria": "세션 “{name}” 메뉴",
    "actions.archive": "세션 보관",
    "actions.unarchive": "보관 해제",
    "actions.pin": "세션 고정",
    "actions.unpin": "고정 해제",
    "actions.newSession": "새 세션",
    "actions.newSession.aria": "“{name}”에 새 세션 만들기",
    "status.running": "진행 중",
    "status.subagentsRunning.one": "하위 에이전트 {n}개 실행 중",
    "status.subagentsRunning.other": "하위 에이전트 {n}개 실행 중",
    "status.idle": "대기 중",
    "status.waitingApproval": "승인 대기 중",
    "status.planReview": "계획 검토 대기",
    "status.waitingAnswer": "답변 기다리는 중",
    "status.compact.approval": "승인 대기",
    "status.compact.planReview": "계획 검토 대기",
    "status.compact.answer": "답변 대기",
    "status.completed": "완료",
    "hover.created": "{time}에 만듦",
    "hover.copied": "복사됨",
    "date.ymd": "{y}년 {m}월 {d}일",
    "time.now": "방금",
    "time.minutes": "{n}분",
    "time.hours": "{n}시간",
    "time.days": "{n}일",
    "time.months": "{n}개월",
    "time.years": "{n}년",
    "time.ago": "{t} 전"
  },
  "agent-team": {
    trigger: "에이전트 팀",
    loading: "팀 불러오는 중…",
    unavailable: "팀을 지금 쓸 수 없습니다",
    failure: "팀의 영구 기록 형식이 올바르지 않습니다: {message}",
    empty: "공유 작업이 없습니다. 대화로 만들 수 있습니다",
    roster: "멤버",
    tasks: "공유 작업",
    model: "모델",
    open: "멤버 세션 열기",
    current: "현재 세션",
    owner: "담당자",
    unowned: "배정 안 됨",
    blockedBy: "의존성",
    writeScopes: "쓰기 범위",
    ready: "시작 가능",
    blocked: "의존성 때문에 막힘",
    "task.expand": "펼치기",
    "task.collapse": "접기",
    "memberStatus.running": "실행 중",
    "memberStatus.inactive": "실행 안 함",
    "memberStatus.provisioning": "준비 중",
    "memberStatus.failed": "실패",
    "status.pending": "처리 대기",
    "status.in_progress": "진행 중",
    "status.completed": "완료"
  },
  cotTranslation: {
    provider: "번역 서비스",
    google: "Google",
    bing: "Bing",
    deepseekAccount: "DeepSeek Flash · 계정(유료)",
    deepseekOfficial: "DeepSeek Flash · 공식 API(유료)",
    providerUnavailableOption: "{provider} — 쓸 수 없음",
    providerUnavailable: "이 서비스는 지금 쓸 수 없습니다. DeepSeek 계정이나 공식 API를 설정하거나, 쓸 수 있는 번역 서비스를 고르세요",
    paidNotice: "캐시되지 않은 내용 조각마다 선택한 계정이나 공식 API 자격 증명으로 유료 DeepSeek Flash 요청을 한 번씩 보냅니다. 다시 펼치면 저장된 번역을 사용합니다. 서비스·언어·원문·요청 설정을 바꾸면 새 유료 요청이 나갈 수 있습니다",
    anonymousNotice: "Bing과 Google 번역은 로그인이나 API 키 없이 사용할 수 있습니다. 다만 익명 API라 요청을 거부하거나 제한할 수 있습니다",
    targetLanguage: "대상 언어",
    targetLanguageHint: "auto는 화면 언어를 씁니다. 언어 코드를 직접 넣을 수도 있습니다. 예: ko, en, ja",
    privacy: "펼친 생각 내용이 고른 번역 서비스로 전송되며 비공개 코드나 대화 내용이 들어 있을 수 있습니다.",
    translation: "번역 보기",
    original: "원문 보기",
    retry: "다시 시도",
    failed: "번역을 쓸 수 없어 원문을 보여 줍니다",
    translating: "생각 내용 번역 중",
    invalidProvider: "번역 서비스를 고르세요",
    invalidLanguage: "auto 또는 언어 코드를 입력하세요. 예: ko, en, ja",
    overridden: "덮어씀",
    reset: "기본값 복원",
    unavailable: "번역 설정을 지금 쓸 수 없습니다",
    readOnly: "이 배포의 설정은 읽기 전용입니다",
    saveFailed: "설정값이 적용되지 않았습니다. 다시 수정할 수 있도록 입력 내용은 남겨 두었습니다",
    save: "저장",
    saving: "저장 중…",
    copy: "복사",
    copied: "복사됨",
    codeTitle: "코드 블록",
    wrap: "자동 줄바꿈",
    unwrap: "줄바꿈 안 함",
    footnotes: "각주"
  },
  "voice-input": {
    dictate: "받아쓰기",
    "setupPrompt.title": "음성 입력을 쓰려면 설치가 필요합니다",
    "setupPrompt.body": "음성 입력 플러그인이 켜졌습니다. 처음 쓸 때는 이 PC에 인식 모델을 내려받아 준비해야 합니다. 플러그인 상세 페이지에서 필요한 공간, 메모리, 시간을 확인한 뒤 설치를 시작하세요.",
    "setupPrompt.later": "나중에",
    "setupPrompt.open": "설치하러 가기",
    "setupPrompt.trigger": "음성 입력 안내 열기",
    "setupPrompt.details": "음성 플러그인 설정으로 가기",
    "setupPrompt.unavailableTitle": "음성 인식이 아직 준비되지 않았습니다",
    "setupPrompt.unavailableBody": "음성 플러그인 상세 페이지에서 인식 서비스 상태, 준비 진행 상황, 오류 정보를 확인하세요",
    "setup.local": "DSH가 실행되는 PC에 로컬 모델을 내려받습니다. Python이나 컴파일 도구는 필요 없습니다.",
    "setup.disk": "디스크 공간",
    "setup.diskValue": "모델, 런타임, 다운로드 캐시를 포함해 약 {gb}GB의 여유 공간을 권장합니다",
    "setup.memory": "메모리",
    "setup.memoryValue": "모델을 불러오면 약 {gb}GB를 사용하며 음성을 인식할 때는 더 필요할 수 있습니다",
    "setup.time": "첫 준비",
    "setup.timeValue": "네트워크와 PC 성능에 따라 약 {min}–{max}분",
    "setup.estimateNote": "위 값은 추정치이며 네트워크가 느리면 더 걸릴 수 있습니다. 내려받은 자료는 재사용하며 기본적으로 사용하지 않을 때는 모델이 차지한 메모리를 반환합니다.",
    "step.check": "로컬 자료 확인",
    "step.model": "음성 인식 모델 준비",
    "step.vad": "음성 감지 모델 준비",
    "step.verify": "모델 파일 검증",
    "step.load": "{name} 불러오기",
    "stepStatus.pending": "시작 안 함",
    "stepStatus.running": "진행 중",
    "stepStatus.complete": "완료",
    "stepStatus.failed": "실패",
    "stepStatus.cancelled": "취소됨",
    "short.downloading": "내려받는 중",
    "short.failed": "준비 실패",
    retryRecording: "다시 녹음",
    preparationSteps: "준비 단계",
    prepare: "내려받아 준비",
    retryPrepare: "준비 다시 시도",
    cancelPrepare: "준비 취소",
    downloadProgress: "다운로드 진행",
    downloadBytes: "다운로드: {completed} / {total}MB, {percent}%",
    downloadUnknown: "{completed}MB 내려받음",
    elapsed: "{seconds}초 기다림",
    preparationFailed: "준비 실패: {message}",
    "download.network": "{resource}을(를) 내려받을 수 없습니다: 다운로드 서버 연결 실패.",
    "download.dns": "{resource}을(를) 내려받을 수 없습니다: 다운로드 주소를 해석할 수 없음.",
    "download.timeout": "{resource} 다운로드 시간 초과.",
    "download.certificate": "{resource}을(를) 내려받을 수 없습니다: 보안 연결 인증서 검증 실패.",
    "download.http": "{resource}을(를) 내려받을 수 없습니다: 다운로드 서버가 HTTP {status}을(를) 반환함.",
    "download.integrity": "{resource} 다운로드가 불완전하거나 파일 검증에 실패했습니다.",
    "download.storage": "{resource}을(를) 저장할 수 없습니다: 디스크 공간이 부족하거나 쓰기 권한이 없습니다.",
    "download.unknown": "{resource} 준비 실패.",
    "downloadAdvice.network": "DSH가 실행되는 PC에서 다운로드 출처와 모델 다운로드 서버에 접속할 수 있는지 확인하세요. 프록시가 필요하면 그 PC에서 설정한 뒤 다시 시도하세요.",
    "downloadAdvice.dns": "DSH가 실행되는 PC의 DNS와 프록시 설정을 확인하고 다운로드 출처의 도메인을 해석할 수 있는지 확인한 뒤 다시 시도하세요.",
    "downloadAdvice.timeout": "DSH가 실행되는 PC의 네트워크나 프록시 연결을 확인하고 잠시 뒤 다시 시도하세요. 내려받아 검증된 파일은 남아 있습니다.",
    "downloadAdvice.certificate": "DSH가 실행되는 PC의 시스템 시간, 신뢰할 수 있는 인증서, 프록시 설정을 확인한 뒤 다시 시도하세요.",
    "downloadAdvice.http": "다운로드 주소에 접속할 수 있는지, 프록시가 다운로드 서버에 제대로 연결되는지 확인하세요. 잠시 뒤 다시 시도할 수도 있습니다.",
    "downloadAdvice.integrity": "다운로드를 다시 시도하세요. 이미 검증을 마친 다른 파일은 남아 있습니다.",
    "downloadAdvice.storage": "DSH가 실행되는 PC의 남은 디스크 공간과 모델 폴더의 쓰기 권한을 확인한 뒤 다시 시도하세요.",
    "downloadAdvice.unknown": "DSH가 실행되는 PC의 네트워크, 디스크 공간, 모델 폴더 권한을 확인한 뒤 다시 시도하세요.",
    downloadSource: "다운로드 출처: {source}",
    sourceChoice: "모델 다운로드 소스",
    sourceAuto: "자동 선택(추천)",
    sourceHuggingFace: "Hugging Face",
    sourceMirror: "HF-Mirror(중국 미러)",
    sourceAutoHelp: "응답이 빠른 소스를 먼저 쓰고 다운로드에 실패하면 다른 소스를 자동으로 시도합니다.",
    sourceManualHelp: "고른 소스에서만 내려받습니다. 내려받아 검증된 파일은 다시 씁니다.",
    downloadCode: "오류 코드: {code}",
    reconnecting: "음성 서비스에 연결하는 중…",
    "preparation.unprepared": "처음 쓸 때는 로컬 인식 모델을 내려받아야 합니다.",
    "preparation.checking": "로컬 자료 확인 중…",
    "preparation.loading": "{name} 불러오는 중…",
    "preparation.waking": "로컬 음성 깨우는 중…",
    "preparation.ready": "로컬 음성이 준비되었습니다.",
    "preparation.standby": "로컬 자료가 준비되었습니다. 녹음할 때 모델이 자동으로 깨어납니다.",
    "preparation.cancelled": "준비를 취소했습니다. 이미 내려받은 파일은 남아 있습니다.",
    "preparation.cancelling": "준비 취소하는 중…",
    cloudReady: "클라우드 음성 인식이 준비되었습니다.",
    discard: "인식한 글 버리기",
    transcribingShort: "인식 중…",
    wakingShort: "깨우는 중…",
    provider: "인식 서비스",
    language: "인식 언어",
    inputDevice: "입력 장치",
    systemMicrophone: "시스템 기본",
    systemMicrophoneNamed: "시스템 기본({name})",
    unnamedSelectedMicrophone: "마이크",
    unnamedMicrophone: "마이크 {number}",
    inputLevel: "마이크 입력 레벨",
    deviceUnavailable: "쓸 수 없음",
    deviceMissing: "마이크를 쓸 수 없습니다. 다른 입력 장치를 고르세요",
    auto: "자동 인식",
    zh: "중국어",
    en: "영어",
    yue: "광둥어",
    ja: "일본어",
    ko: "한국어",
    start: "녹음 시작",
    stop: "멈추고 인식",
    cancel: "취소",
    insert: "글 넣기",
    loading: "인식 서비스 읽는 중…",
    requesting: "마이크 사용을 허용해 주세요…",
    recording: "녹음 중…",
    interrupted: "녹음이 끊겼습니다. 다시 시도하세요.",
    local: "음성은 DSH가 실행되는 PC에서 인식합니다. 모델을 내려받아야 할 때는 그 PC에서 고른 다운로드 소스와 파일 서버에 접속할 수 있어야 합니다. 프록시가 필요하면 그 PC에서 설정하세요.",
    cloud: "음성이 고른 클라우드 서비스로 전송됩니다.",
    empty: "음성을 인식하지 못했습니다",
    cancelled: "음성 입력을 취소했습니다.",
    conflict: "초안이 바뀌었습니다. 인식한 글은 남겨 두었으니 지금 커서 위치에 넣을 수 있습니다.",
    failed: "음성 인식 실패: {message}",
    unavailable: "이 브라우저는 녹음을 지원하지 않습니다. 마이크를 지원하는 브라우저를 쓰세요.",
    permission: "마이크 권한이 꺼져 있습니다. 브라우저와 시스템 설정에서 허용하세요.",
    tooLarge: "녹음이 서비스 한도를 넘었습니다. 짧게 줄여 다시 시도하세요.",
    es: "스페인어",
    fr: "프랑스어",
    de: "독일어",
    ru: "러시아어",
    pt: "포르투갈어"
  },
  "session-inspector": {
    "tab.title": "세션 데이터 진단",
    "tab.description": "사이드바에서 현재 세션의 원본 로그와 대화 그룹 데이터 분석",
    "view.presentation": "표시 형식",
    "view.sessionLog": "원본 데이터",
    "view.chatNode": "대화 그룹",
    "picker.pick": "대화 패널에서 요소 고르기",
    "picker.cancel": "고르기 취소(Esc)",
    "picker.instructions": "왼쪽 대화에 마우스를 올려 미리 보고 클릭해서 선택하세요. Esc를 누르면 취소합니다.",
    "picker.noMatch": "현재 표에 일치하는 기록이 없습니다. 다른 요소를 고르거나 Esc로 취소하세요.",
    "picker.noChat": "먼저 메인 영역에서 현재 세션의 대화를 여세요.",
    "table.id": "번호",
    "table.type": "유형",
    "filter.title": "유형 필터",
    "filter.input": "유형 키워드",
    "filter.placeholder": "유형 일부를 입력하세요. 예: delta",
    "filter.help": "기본적으로 키워드가 포함된 항목(*키워드*)을 찾습니다. Enter로 적용하고 Esc로 취소합니다.",
    "filter.candidates": "유형 후보",
    "filter.loading": "후보 찾는 중…",
    "filter.failed": "유형 후보를 가져올 수 없습니다.",
    "filter.noCandidates": "일치하는 후보는 없지만 입력한 키워드로 필터를 적용할 수 있습니다.",
    "filter.clear": "비우기",
    "filter.cancel": "취소",
    "filter.apply": "필터 확인",
    "filter.context": "일치한 기록의 상위 컨텍스트",
    "table.location": "T/S",
    "table.time": "시간(UTC)",
    "table.data": "데이터",
    "table.older": "이전 기록 더 불러오기",
    "table.loading": "불러오는 중…",
    "table.latest": "최신 따라가기",
    "table.empty": "기록 없음",
    "table.raw": "원본 데이터",
    "table.rawError": "이 기록은 직렬화할 수 없습니다. 다른 기록을 골라 계속 보세요.",
    "table.resizeDetails": "원본 데이터 패널 높이 조정",
    "table.close": "닫기",
    "table.expand": "하위 행 펼치기",
    "table.collapse": "하위 행 접기",
    "table.removed": "이 기록은 제거됐거나 정산되었습니다. 현재 기록을 고르세요.",
    "object.node": "Node",
    "object.nodeData": "Node Data",
    "object.group": "Group",
    "object.groupData": "Group Data",
    "object.turn": "Turn",
    "object.turnData": "Turn Data",
    "object.step": "Step",
    "object.stepData": "Step Data",
    "object.accessor": "[Getter / Setter, 실행 안 함]",
    "object.empty": "빈 값",
    "object.absent": "[빈 슬롯]",
    "object.properties": "기타 속성",
    "object.more": "더 보기",
    "object.navigation": "원본 데이터 이동"
  },
  "session-log-download": {
    "header.more": "작업 더 보기",
    "menu.download": "세션 로그 내려받기",
    "menu.feedback": "피드백",
    "dialog.preparingTitle": "세션 내보내는 중",
    "dialog.preparingDescription": "현재 세션, 하위 세션, 첨부를 담은 ZIP 파일을 준비하는 중입니다.",
    "dialog.successTitle": "세션 ZIP 파일 다운로드 시작",
    "dialog.successDescription": "브라우저가 세션 ZIP 파일을 내려받는 중입니다.",
    "dialog.errorTitle": "세션 내보내기 실패",
    "dialog.close": "닫기",
    "dialog.commandFailed": "세션 내보내기를 시작할 수 없습니다.",
    "menu.copyMarkdown": "세션을 Markdown으로 복사",
    "toast.copied": "세션을 Markdown으로 복사했습니다.",
    "toast.preparationFailed": "복사할 세션을 읽지 못했습니다. 다시 시도하세요.",
    "toast.clipboardFailed": "클립보드에 쓰지 못했습니다. 클립보드 권한을 확인한 뒤 다시 시도하세요."
  },
  actionCards: {
    expandBrief: "더 보기",
    collapseBrief: "접기",
    dismiss: "나중에",
    dismissed: "닫음",
    replaced: "대체됨",
    unavailable: "이 작업을 쓸 수 없습니다. ‘플러그인’에서 해당 플러그인을 확인하세요.",
    transport: "결과를 확인할 수 없습니다. 다시 연결한 뒤 카드를 확인하고 다시 시도하세요.",
    "row.title": "작업 카드",
    "row.preparing": "카드 준비 중",
    "row.running": "제안 중",
    "row.ok": "제안함",
    "row.error": "표시 안 됨",
    "row.stopped": "중단됨",
    "row.inspect": "호출 보기"
  },
  creationRecommendations: {
    heading: "맞춤 페이지",
    location: "추가할 위치",
    creationInfo: "제작 방식과 토큰 사용량",
    creationMethod: "창작 모드로 새 페이지를 만들며 언제든지 제거할 수 있습니다.",
    creationCost: "만드는 데 시간이 걸리고 토큰을 많이 사용할 수 있습니다.",
    creationBackground: "‘만들기’를 누르면 백그라운드에서 시작됩니다. 여기서 계속 대화할 수 있습니다.",
    initialContent: "초기 내용",
    expandContent: "내용 모두 보기",
    collapseContent: "내용 접기",
    "sidebar-right": "오른쪽 사이드바",
    page: "세션 탭",
    "sidebar-left": "전역 페이지",
    custom: "직접 입력",
    "sidebar-rightHint": "이 대화와 함께 보기",
    pageHint: "대화, 실행 기록 옆에 열기",
    "sidebar-leftHint": "왼쪽 사이드바에서 열기",
    customHint: "원하는 위치를 설명하세요",
    customLabel: "어디에 표시할까요?",
    customPlaceholder: "예: 왼쪽 사이드바 항목을 누르면 전체 화면 달력이 열림",
    create: "만들기",
    starting: "시작하는 중…",
    dismiss: "나중에",
    retry: "다시 만들기",
    keep: "유지",
    undo: "실행 취소",
    restore: "복원",
    restoring: "복원하는 중…",
    scope: "언제든지 제거할 수 있습니다",
    dismissed: "건너뜀",
    replaced: "대체됨",
    creating: "백그라운드에서 만드는 중",
    cancel: "만들기 취소",
    cancelling: "취소하는 중…",
    installing: "설치 중…",
    sourceRetained: "실행 취소해도 소스 파일은 원래 작업 공간의 .dsh-created-plugins/ 폴더에 남습니다.",
    installed: "설치됨",
    kept: "유지함",
    removed: "제거됨",
    failed: "만들지 못했습니다. 다시 시도하세요.",
    interrupted: "만들기가 중단되었습니다. 다시 시도하세요.",
    unconfirmed: "결과를 확인하지 못했습니다. 다시 시도해 확인하세요.",
    "invalid-location": "위치를 고르거나 1,000자 이내로 설명하세요.",
    "restart-required": "변경을 저장했습니다. 적용하려면 DSH를 다시 시작하세요.",
    overridden: "다른 설정이 이 변경을 덮어씁니다.",
    cancelled: "취소됨",
    applicationFailed: "마지막 변경이 적용되지 않았습니다. ‘플러그인’에서 확인하세요.",
    applicationCancelled: "마지막 변경이 취소되었습니다.",
    transport: "결과를 확인하지 못했습니다. 다시 연결한 뒤 카드를 확인하고 다시 시도하세요.",
    unknown: "이 추천은 더 이상 쓸 수 없습니다.",
    unavailable: "지금은 이 작업을 할 수 없습니다. ‘플러그인’에서 플러그인을 확인하세요.",
    "access-denied": "이 연결로는 플러그인을 변경할 수 없습니다.",
    "not-live-root": "이 카드를 쓰려면 원래 대화를 여세요.",
    closing: "제작 플러그인을 중지하는 중입니다. 다시 불러온 뒤 시도하세요.",
    "read-only": "이 세션은 보기만 가능합니다. 페이지를 만들려면 권한 프리셋을 바꾸세요.",
    "source-missing": "페이지 파일이 사라졌습니다. 새 제안을 요청하세요."
  },
  documentHtml: {
    title: "HTML",
    frame: "HTML 문서 미리보기",
    loading: "문서 렌더링 중…",
    failed: "이 HTML 문서를 미리 볼 수 없습니다."
  },
  documentMarkdown: {
    "viewer.label": "Markdown",
    "code.copy": "복사",
    "code.copied": "복사됨",
    footnotes: "각주"
  },
  fileActions: {
    "menu.finder": "Finder에서 보기",
    "menu.reveal": "폴더에서 보기",
    "menu.saveAs": "다른 이름으로 저장…",
    "menu.copied": "복사됨",
    "menu.copyImage": "이미지 복사",
    "menu.download": "내려받기",
    "menu.saveFailed": "저장하지 못했습니다. 원본과 저장 위치를 확인한 뒤 다시 시도하세요.",
    "menu.copyFailed": "복사하지 못했습니다. 복사할 내용을 확인한 뒤 다시 시도하세요.",
    "menu.saved": "저장됨",
    "menu.downloadStarted": "내려받기 시작됨",
    "menu.downloaded": "내려받기 완료",
    "path.revealError": "파일 위치를 보여 줄 수 없습니다. 다시 시도하세요"
  },
  fileDrag: {
    failed: "드래그하지 못했습니다. 다시 시도하세요."
  },
  forgePanel: {
    "review.startReview": "검토 시작",
    "review.githubActions": "GitHub 댓글 옵션",
    "review.publishing": "게시 중…",
    "review.submitting": "제출 중…",
    "review.close": "닫기",
    "review.pending": "처리 대기",
    "review.quoted": "입력창에 추가됨",
    "review.yourComment": "내 댓글",
    "review.outdated": "코드 변경됨",
    "review.done": "완료",
    "review.addComment": "댓글 추가",
    "diff.resizeFileTree": "파일 트리 너비 조정",
    "diff.fileTree": "파일 트리",
    "diff.showFileTreeLeft": "파일 트리를 왼쪽에 표시",
    "diff.moveFileTreeRight": "파일 트리를 오른쪽으로 이동",
    "guide.title": "코드 검토와 변경 사항",
    "guide.description": "코드 변경 사항과 이 세션의 변경 요청을 검토합니다",
    "diff.hideFileTree": "파일 트리 숨기기",
    "review.range": "{range}에 댓글 달기",
    "review.comment": "댓글 남기기…",
    "review.cancel": "취소",
    "review.addToInput": "입력창에 추가",
    "review.publish": "댓글 하나 게시",
    "review.queue": "검토에 추가",
    "review.selectLine": "{line}번 줄 선택",
    "review.inputFailed": "입력창이 아직 참조를 받을 수 없습니다. 잠시 뒤 다시 시도하세요.",
    "review.saveFailed": "검토 초안을 저장하지 못했습니다. 브라우저 저장소를 확인하고 다시 시도하세요.",
    "review.unknown": "제출 결과를 알 수 없습니다. 다시 게시하기 전에 GitHub를 확인하세요.",
    "review.submit": "검토 제출",
    "review.summary": "검토 요약…",
    "review.approve": "승인",
    "review.requestChanges": "수정 요청",
    "review.summaryRequired": "수정을 요청하려면 검토 요약을 입력하세요.",
    "review.commentOnly": "댓글",
    "review.drafts": "대기 중인 댓글({count})",
    "review.edit": "편집",
    "review.remove": "삭제",
    "review.stale": "PR에 새 커밋이 있습니다. 새로 고친 뒤 댓글을 달 줄을 다시 선택하세요.",
    "review.published": "GitHub에 게시됨",
    "review.submitted": "검토 제출됨",
    "review.failed": "제출 실패: {message}",
    "review.unsupported": "이 코드 호스트는 검토 제출을 지원하지 않습니다.",
    "review.loadFailed": "검토 초안을 읽을 수 없습니다. 브라우저 저장소를 확인하세요.",
    "review.recheck": "GitHub에서 보기",
    "review.confirmRetry": "확인함, 다시 제출 허용",
    "tab.title": "변경 요청",
    "header.label": "이 세션의 변경 요청",
    "header.attention": "이 세션의 변경 요청에 확인이 필요합니다",
    "checkout.worktree": "워크트리",
    "checkout.worktreeFrom": "워크트리 · {base}에서 분기",
    "checkout.project": "프로젝트 폴더",
    "checkout.detached": "브랜치에 있지 않음",
    "checkout.restore": "복원",
    "checkout.copyWorktreePath": "워크트리 경로 복사",
    "checkout.copyProjectPath": "프로젝트 폴더 경로 복사",
    "checkout.none": "이 폴더는 Git 저장소가 아닙니다",
    "checkout.failed": "Git 정보를 읽을 수 없습니다",
    "changes.title": "이 세션의 변경 요청 · {count}",
    "changes.empty": "이 세션에는 아직 변경 요청이 없습니다",
    "changes.emptyHint": "이 세션에서 만들거나 조회·편집·체크아웃한 변경 요청을 표시합니다. 현재 브랜치나 푸시한 브랜치에 열려 있는 변경 요청도 표시됩니다",
    "changes.local.title": "로컬 변경 사항",
    "changes.local.refs": "{head} → {base}",
    "changes.local.files": "파일 {count}개",
    "changes.local.viewAria": "이 세션의 변경 사항 보기: 파일 {count}개, {added}줄 추가, {deleted}줄 삭제",
    "changes.local.create": "변경 요청 만들기",
    "changes.local.prompt": "이 세션의 변경 사항으로 변경 요청을 만들어 주세요",
    "signin.title": "변경 요청 상태를 보려면 {host}에 로그인하세요",
    "signin.copy": "로그인 명령 복사",
    "signin.unavailable": "{host}의 변경 요청을 읽을 수 없습니다: {message}",
    refresh: "상태 새로 고침",
    retry: "다시 시도",
    "stream.failed": "변경 요청 패널을 불러오지 못했습니다",
    "change.number": "#{number}",
    "change.stateAria": "변경 요청 상태: {state}",
    "change.state.open": "열림",
    "change.state.blocked": "확인 필요",
    "change.state.draft": "초안",
    "change.state.merged": "병합됨",
    "change.state.closed": "닫힘",
    "change.state.unknown": "알 수 없음",
    "list.worktree": "별도 워크트리에 있음",
    "list.stateChecks": "{state} · {checks}",
    "list.more": "변경 요청 {count}개 더",
    "change.expand": "{name} 펼치기",
    "change.collapse": "{name} 접기",
    "change.ci.none": "검사 없음",
    "change.ci.running": "검사 실행 중",
    "change.ci.passed": "검사 통과",
    "change.ci.failed": "검사 {count}개 실패",
    "change.ci.cancelled": "검사 {count}개 취소됨",
    "change.ci.failedUnlisted": "검사 실패",
    "change.checks.failed": "{count}개 실패",
    "change.checks.running": "{count}개 실행 중",
    "change.checks.passed": "{count}개 통과",
    "change.checks.cancelled": "{count}개 취소됨",
    "change.checks.other": "기타 {count}개",
    "change.checks.truncated": "검사 {count}개를 불러왔습니다. 추가로 불러올 검사가 있습니다",
    "change.checks.loading": "검사 더 불러오는 중",
    "change.checks.loadFailed": "검사를 더 불러오지 못했습니다: {message}",
    "change.checks.retry": "검사 불러오기 다시 시도",
    "change.check.running": "실행 중",
    "change.check.queued": "대기열에 등록됨",
    "change.flag.changesRequested": "수정 요청됨",
    "change.flag.conflicting": "충돌",
    "change.flag.draft": "초안",
    "change.failure.unavailable": "변경 요청 상태를 읽을 수 없습니다",
    "change.failure.notFound": "변경 요청이 없거나 접근할 수 없습니다",
    "change.failure.unauthenticated": "상태를 읽으려면 로그인하세요",
    "change.unserved": "이 코드 호스트에서는 아직 변경 요청 상태를 지원하지 않습니다",
    "change.view": "브라우저에서 열기",
    "change.copy": "변경 요청 링크 복사",
    "change.viewChangesAria": "{name}의 변경 사항 보기: {added}줄 추가, {deleted}줄 삭제",
    "change.remove": "이 세션에서 제거",
    "change.removeAria": "이 세션에서 {name} 제거",
    "change.row.checks": "검사",
    "change.row.review": "검토",
    "change.row.merge": "병합",
    "change.row.changes": "변경 사항",
    "change.review.approved": "승인됨",
    "change.review.changesRequested": "수정 요청됨",
    "change.review.required": "검토 필요",
    "change.review.none": "검토 요청 없음",
    "change.review.threads": "{review} · 미해결 {count}개",
    "change.merge.mergeable": "충돌 없음",
    "change.merge.conflicting": "{base}와(과) 충돌",
    "change.merge.unknown": "충돌 확인 중",
    "change.mergedTo": "{base}에 병합됨",
    "change.markReady": "검토 준비 완료",
    "change.merge": "병합",
    "change.mergeTitle": "{name}을(를) {base}에 병합",
    "change.mergeMethod.squash": "스쿼시 후 병합",
    "change.mergeMethod.merge": "병합 커밋 만들기",
    "change.mergeMethod.rebase": "리베이스 후 병합",
    "change.mergeNote.squash": "모든 커밋을 하나로 합칩니다",
    "change.mergeNote.merge": "모든 커밋을 유지하고 병합 커밋을 추가합니다",
    "change.mergeNote.rebase": "각 커밋을 {base} 위에 다시 적용합니다",
    "change.mergeConfirm": "병합 확인",
    "change.mergeChanged": "새 커밋이 들어왔습니다. 병합 메뉴를 다시 열기 전에 확인하세요.",
    "diff.tab": "변경 사항",
    "diff.tabNumbered": "#{number}의 변경 사항",
    "diff.scope.branch": "브랜치",
    "diff.scope.uncommitted": "커밋 안 됨",
    "diff.scope.unstaged": "스테이징 안 됨",
    "diff.scope.staged": "스테이징됨",
    "diff.scopeNote.branch": "{base}와(과) 비교, 커밋 안 된 변경 사항 포함",
    "diff.scopeNote.uncommitted": "HEAD와 비교, 추적하지 않는 파일 포함",
    "diff.scopeNote.unstaged": "인덱스와 비교, 추적하지 않는 파일 포함",
    "diff.scopeNote.staged": "인덱스를 HEAD와 비교",
    "diff.allFiles": "전체 파일 {count}개",
    "diff.filterFiles": "파일 필터…",
    "diff.noMatchingFiles": "일치하는 파일 없음",
    "diff.refresh": "변경 사항 새로 고침",
    "diff.expandAll": "모든 파일 펼치기",
    "diff.collapseAll": "모든 파일 접기",
    "diff.split": "나란히 보기",
    "diff.unified": "한 열로 보기",
    "diff.splitAria": "나란히",
    "diff.wrap": "긴 줄 자동 줄바꿈 켜기",
    "diff.nowrap": "긴 줄 자동 줄바꿈 끄기",
    "diff.wrapAria": "자동 줄바꿈",
    "diff.unchanged": "변경 없는 줄 {count}개",
    "diff.unchangedRest": "나머지 변경 없는 줄",
    "diff.newFile": "새 파일",
    "diff.deletedFile": "삭제됨",
    "diff.renamed": "{from}에서 이름 바뀜",
    "diff.renamedPath": "{from} → {path}",
    "diff.badgeUncommitted": "커밋 안 됨",
    "diff.binary": "바이너리 파일이라 변경 사항을 표시할 수 없습니다",
    "diff.binaryLabel": "바이너리",
    "diff.largeCollapsed": "큰 파일: 변경된 줄 {count}개 접힘",
    "diff.fileTooLarge": "파일이 너무 커서 표시할 수 없습니다",
    "diff.error": "변경 사항을 읽을 수 없습니다",
    "diff.tooLarge": "변경 사항이 너무 커서 여기에 표시할 수 없습니다",
    "diff.filterConfigFailed": "Git 필터 설정을 모두 읽지 못해 비교를 실행하지 않았습니다. Git 설정과 출력 한도를 확인한 뒤 다시 시도하세요.",
    "diff.viewInBrowser": "브라우저에서 보기",
    "diff.noForkPoint": "이 브랜치의 분기점을 찾지 못했습니다. 다른 범위를 고르세요",
    "diff.empty": "변경 사항 없음",
    "diff.omitted": "추적하지 않는 파일 {count}개가 더 있지만 목록에 표시하지 않았습니다",
    "diff.stale": "로컬 브랜치에 푸시하지 않은 커밋이 {count}개 있습니다. 여기 표시된 것은 변경 요청의 변경 사항입니다",
    "diff.moreActions": "{name} 작업 더 보기",
    "diff.copyPath": "경로 복사",
    "diff.openFileInBrowser": "브라우저에서 파일 보기",
    "diff.openFileInSidebar": "사이드바에서 전체 파일 열기",
    "time.now": "방금",
    "time.minutes": "{n}분 전",
    "time.hours": "{n}시간 전",
    "time.days": "{n}일 전",
    "time.months": "{n}개월 전",
    "time.years": "{n}년 전",
    "time.finished": "{state} · {time}",
    "duration.seconds": "{seconds}초",
    "duration.minutes": "{minutes}분 {seconds}초",
    "duration.hours": "{hours}시간 {minutes}분",
    "worktree.label": "새 워크트리",
    "worktree.hint": "이 세션을 별도 워크트리에서 실행합니다. 메시지를 보내면 선택한 브랜치를 기준으로 새 브랜치를 만듭니다. 여기서 하는 변경과 커밋은 프로젝트 폴더에 영향을 주지 않습니다",
    "worktree.blocked.outside-writable-root": "이 작업 공간의 Git 데이터가 쓰기 가능한 폴더 밖에 있어(작업 공간 자체가 워크트리인 경우 등) 아직 워크트리를 쓸 수 없습니다",
    "worktree.blocked.read-only": "‘보기만 가능’ 세션에서는 워크트리를 쓸 수 없습니다",
    "worktree.base": "{branch}에서 분기",
    "worktree.baseHead": "현재 HEAD에서 분기",
    "worktree.baseMenu": "기준 브랜치",
    "worktree.currentBranch": "현재",
    "worktree.currentBranchTip": "현재 브랜치: {branch}",
    "worktree.detachedTip": "브랜치에 있지 않음 · {commit}",
    "creation.title": "워크트리 만드는 중",
    "creation.failed": "워크트리를 만들지 못했습니다",
    "creation.prepare": "브랜치 만들기",
    "creation.checkout": "파일 체크아웃",
    "creation.details": "자세한 정보",
    "creation.branch": "브랜치",
    "creation.base": "기준",
    "creation.head": "현재 HEAD",
    "creation.error": "원인",
    "creation.skip": "워크트리 없이 계속",
    "creation.cancel": "취소",
    "creation.stopped": "워크트리 만들기를 중지했습니다",
    "creation.retry": "다시 시도",
    "creation.waiting": "워크트리가 만들어지면 메시지를 보냅니다",
    "missing.title": "워크트리를 쓸 수 없습니다",
    "missing.unknown": "워크트리 복원이 끝나지 않아 {branch} 브랜치를 확인할 수 없습니다. 복원 오류를 해결하고 다시 시도하거나 프로젝트에서 계속하세요.",
    "missing.kept": "{branch} 브랜치의 워크트리를 원래 위치에 복원할 수 있습니다. 제거 전의 커밋 안 된 변경 사항은 되살릴 수 없습니다",
    "missing.recreated": "{branch} 브랜치도 제거되었습니다. 복원하면 워크트리가 시작된 커밋에서 브랜치를 다시 만들며 이후 커밋과 커밋 안 된 변경 사항은 포함되지 않습니다",
    "missing.restore": "워크트리 복원",
    "missing.leave": "프로젝트에서 계속",
    "missing.waiting": "워크트리를 복원하거나 프로젝트에서 계속하면 메시지를 보냅니다",
    "restoration.title": "워크트리 복원 중",
    "restoration.prepare": "워크트리 준비",
    "branch.worktree": "워크트리({base}에서 분기): {path}",
    "branch.linked": "워크트리: {path}",
    "branch.project": "프로젝트 폴더: {path}",
    "branch.missing": "워크트리를 쓸 수 없음: {path}",
    "toast.removed": "이 세션에서 {name}을(를) 제거했습니다",
    "toast.undo": "실행 취소",
    "toast.undoFailed": "실행 취소 실패",
    "toast.removeFailed": "제거 실패",
    "toast.refreshFailed": "새로 고침 실패",
    "toast.copied": "링크 복사됨",
    "toast.copyFailed": "복사 실패",
    "toast.branchesFailed": "브랜치를 읽을 수 없습니다",
    "toast.worktreeFailed": "워크트리 옵션을 바꿀 수 없습니다",
    "toast.worktreeStarted": "이 세션은 이미 시작되어 더 이상 워크트리를 쓸 수 없습니다",
    "toast.restored": "워크트리를 복원했습니다",
    "toast.restoreFailed": "워크트리를 복원하지 못했습니다: {message}",
    "toast.leaveFailed": "프로젝트 폴더로 전환하지 못했습니다. 다시 시도하세요",
    "toast.markedReady": "{name}을(를) 검토 준비 완료로 표시했습니다",
    "toast.markReadyFailed": "검토 준비 완료로 표시하지 못했습니다: {message}",
    "toast.merged": "{name}을(를) 병합했습니다",
    "toast.mergeFailed": "병합하지 못했습니다: {message}",
    "toast.mergeStale": "{name}에 새 커밋이 있습니다. 병합하기 전에 확인하세요",
    "toast.pathCopied": "경로 복사됨",
    "toast.expandFailed": "변경 없는 줄을 표시하지 못했습니다: {message}",
    "toast.expandStale": "변경 사항을 읽은 뒤 파일이 바뀌었습니다. 펼치기 전에 새로 고치세요",
    "toast.prompted": "보냄: {text}",
    "toast.promptFailed": "메시지를 보내지 못했습니다"
  },
  liveshare: {
    "header.action": "공유",
    "inputOrigin.sharedSession": "공유된 세션에서 [{subjectId}]",
    "dialog.title": "세션 공유",
    "dialog.done": "완료",
    "dialog.shareLink": "공유 링크",
    "dialog.sessionMode": "세션 권한",
    "dialog.sessionMode.view": "보기만 가능",
    "dialog.sessionMode.write": "작업 공간 안에서 수정",
    "dialog.sessionMode.hint.view": "보기만 가능: 보는 사람은 공유 범위 안에서 파일과 세션 기록을 읽고 세션에 메시지를 보낼 수 있지만 모든 도구는 읽기 전용 샌드박스에서 실행되어 어떤 파일도 쓸 수 없습니다.",
    "dialog.sessionMode.hint.write": "작업 공간 안에서 수정: 보는 사람은 제한된 쓰기 가능 샌드박스에서 작업합니다. 쓰기 상한 안에서 공유 범위의 파일을 수정할 수 있고 그 범위를 벗어난 읽기와 쓰기는 거부되며 전역 설정, 자격 증명, 다른 세션에는 접근할 수 없습니다.",
    "dialog.allowsFork": "보는 사람이 세션을 분기하도록 허용",
    "dialog.allowsForkHint": "분기한 세션은 원본 세션과 같은 권한을 유지합니다.",
    "dialog.sessionMode.notGranted": "이 Harness가 세션 권한을 회신하지 않았습니다. 공유하는 쪽의 이전 빌드를 업그레이드해야 공유에 세션 권한을 담을 수 있습니다.",
    "dialog.permissions": "공유 권한",
    "dialog.permissions.save": "변경 사항 저장",
    "dialog.permissions.saving": "저장하는 중…",
    "dialog.permissions.saved": "공유 권한과 플러그인 엔드포인트를 저장했습니다.",
    "dialog.permissions.failed": "공유 권한을 저장하지 못했습니다. 다시 시도하세요.",
    "dialog.permissions.partial": "세션 권한은 업데이트했지만 플러그인 엔드포인트는 저장하지 못했습니다. 다시 시도하세요.",
    "dialog.permissions.modeUnsupported": "이 Harness가 세션 권한을 알려 주지 않아 여기서 바꿀 수 없습니다.",
    "dialog.permissions.unsaved": "저장하지 않은 변경 사항이 있습니다.",
    "dialog.permissions.discard": "저장하지 않은 변경 사항이 있습니다. ‘완료’를 다시 누르면 버려집니다.",
    "dialog.capabilities": "플러그인 엔드포인트",
    "dialog.capabilities.description": "이 공유에 적용할 등급을 고르세요. 저장 시점에 플러그인이 선언한 엔드포인트에 해당 등급을 적용합니다. 나중에 추가된 엔드포인트는 공유되지 않습니다.",
    "dialog.capabilities.none": "보는 사람에게 열지 않음",
    "dialog.capabilities.count": "보는 사람에게 열린 엔드포인트: {count}개",
    "dialog.capabilities.tier.none": "쓸 수 없음",
    "dialog.capabilities.tier.read": "읽기 전용",
    "dialog.capabilities.tier.write": "쓰기 가능",
    "dialog.capabilities.summary.read": "읽기 전용 · 엔드포인트 {count}개",
    "dialog.capabilities.summary.write": "쓰기 가능 · 읽기 전용 {readable}개 + 쓰기 가능 {writable}개",
    "dialog.capabilities.stale": "저장된 선택 항목이 어느 등급과도 완전히 일치하지 않습니다. 다시 저장하면 선택한 등급으로 바뀝니다.",
    "dialog.capabilities.noReadable": "읽기 전용 엔드포인트를 제공하는 플러그인이 없어 ‘읽기 전용’을 고를 수 없습니다.",
    "dialog.capabilities.noWritable": "쓰기 가능 엔드포인트를 제공하는 플러그인이 없어 ‘쓰기 가능’을 고를 수 없습니다.",
    "dialog.capabilities.writeHint": "공유된 세션에서 쓰기를 허용해야 쓰기 가능 엔드포인트를 사용할 수 있습니다. 쓰기 가능한 공유에서는 되돌릴 수 없는 변경이 발생할 수 있습니다.",
    "dialog.capabilities.empty": "지금 공유할 엔드포인트를 선언한 플러그인이 없습니다.",
    "dialog.capabilities.createFailed": "공유는 만들었지만 플러그인 엔드포인트는 저장하지 못했습니다. ‘공유 권한’에서 다시 시도하세요.",
    "dialog.linkHelp": "이 패널을 닫아도 공유는 멈추지 않습니다.",
    "dialog.copyFailed": "링크를 복사하지 못했습니다. 공유 링크를 선택해 직접 복사하세요.",
    "dialog.diagnostics": "연결 상세 정보",
    "dialog.accessUnavailable": "이 공유의 접근 정보를 볼 수 없습니다. 기존 권한은 그대로입니다.",
    "dialog.selectedCount": "확인된 선택 인원: {count}명.",
    "dialog.deploymentAccess": "배포에서 허가한 계정: {count}개. 선택 외에 다른 접근 규칙도 적용됩니다.",
    "dialog.selectedRetired": "이 공유는 이전의 ‘특정 동료’ 범위를 유지합니다. 새 공유에서는 위의 두 가지 방식만 고를 수 있습니다.",
    "dialog.description": "{title}의 읽기 전용 Liveshare 링크를 만듭니다",
    "dialog.relay": "공유 서비스 주소",
    "dialog.relaySaved": "저장했습니다. 새 공유는 이 주소를 씁니다.",
    "dialog.relayInvalid": "http:// 또는 https://로 시작하는 전체 주소를 입력하세요.",
    "dialog.relayCurrent": "현재 주소",
    "dialog.relayUnset": "설정된 주소 없음",
    "dialog.relaySource.unset": "설정 안 됨",
    "dialog.relaySource.saved": "저장된 주소",
    "dialog.relayVerified": "이 주소에서 인증됨",
    "dialog.relayUnverified": "이 주소에서 인증 안 됨",
    "dialog.relayReverify": "주소가 바뀌었습니다. 새 주소에서 다시 로그인하세요.",
    "dialog.relayUnsavedHint": "이 주소는 아직 저장되지 않았습니다. 저장해야 적용됩니다.",
    "dialog.identity.expired": "로그인이 만료되었습니다. 공유를 만들기 전에 다시 로그인하세요.",
    "dialog.identity.unverified": "로그인하지 않아 공유를 만들 수 없습니다.",
    "dialog.identity.relayChanged": "다른 Relay 주소에 로그인되어 있습니다. 이 주소에서 다시 로그인하세요.",
    "dialog.identity.unknown": "지금은 로그인 상태를 확인할 수 없습니다. 잠시 뒤 다시 시도하세요. 로그인하기 전에는 공유가 만들어지지 않습니다.",
    "dialog.identity.retry": "다시 시도",
    "dialog.identity.verify": "로그인",
    "dialog.identity.reverify": "다시 로그인",
    "dialog.identity.verifyBlocked": "로그인하기 전에 주소를 저장하고 연결 상태를 확인하세요.",
    "dialog.identity.loginOpening": "로그인 시작하는 중…",
    "dialog.identity.loginWaiting": "열린 창에서 로그인을 마치세요.",
    "dialog.identity.loginVerifying": "로그인 결과 확인하는 중…",
    "dialog.identity.loginDone": "로그인했습니다. 계정 상태를 읽는 중입니다.",
    "dialog.identity.loginCancelled": "로그인을 취소했습니다. 자격 증명은 저장되지 않았습니다.",
    "dialog.identity.loginExpired": "이 로그인은 만료되었습니다. 다시 시작하세요.",
    "dialog.identity.loginMismatch": "현재 요청과 일치하지 않는 로그인 응답이라 무시했습니다.",
    "dialog.identity.loginReplayed": "이미 사용된 로그인입니다. 다시 시작하세요.",
    "dialog.identity.loginUnavailable": "로그인을 시작할 수 없습니다. Relay를 쓸 수 없거나 이 주소가 로그인을 지원하지 않습니다.",
    "dialog.identity.loginBlocked": "로그인 창을 열 수 없습니다(브라우저가 차단했을 수 있습니다). 팝업을 허용하고 다시 시도하세요.",
    "dialog.identity.loginFailed": "로그인을 마치지 못했습니다. 다시 시도하세요.",
    "dialog.identity.expires": "{time}까지 유효",
    "dialog.identity.renewed": "부여된 권한 범위 안에서 자동으로 갱신되었습니다.",
    "dialog.identity.relayUnsupported": "이 주소의 Relay는 아직 신원 확인을 지원하지 않습니다. 공유를 만들기 전에 업그레이드하세요. 이 페이지는 익명 공유를 만들지 않습니다.",
    "dialog.expiry": "만료",
    "dialog.expiry.never": "만료 없음",
    "dialog.expiry.hour": "1시간 후",
    "dialog.expiry.day": "24시간 후",
    "dialog.expiry.week": "7일 후",
    "dialog.expiry.until": "{time}까지",
    "dialog.linkSharing": "링크 공유",
    "dialog.help": "이 세션만 공유합니다. 보는 사람이 할 수 있는 일은 세션 권한에 따라 정해지며 ‘공유 관리’에서 언제든 공유를 멈출 수 있습니다.",
    "dialog.mode.open": "링크가 있는 조직 내 모든 사람",
    "dialog.mode.selected": "특정 동료",
    "dialog.expiry.clear": "만료되지 않음",
    "dialog.create": "공유 만들기",
    "dialog.creating": "만드는 중…",
    "dialog.cancel": "취소",
    "dialog.copy": "링크 복사",
    "dialog.copied": "복사됨",
    "dialog.manage": "공유 관리",
    "dialog.hostUnavailable": "DSH Liveshare 공유 서비스에 연결할 수 없습니다.",
    "dialog.testing": "공유 서비스에 연결하는 중…",
    "dialog.testOk": "Relay 연결 정상",
    "dialog.testWarn": "Relay HTTP에는 연결되지만 등록이 끝나지 않았고 Host가 원인을 알려 주지 않았습니다. 공유는 그대로 만들 수 있으며 게이트웨이가 다시 시도합니다.",
    "dialog.testFail": "Relay 연결에 실패했습니다(Host가 원인을 알려 주지 않았습니다).",
    "dialog.addressHint": "먼저 공유 서비스 주소를 저장하세요.",
    "dialog.connectivityChecking": "공유 서비스 주소가 응답하는지 확인하는 중…",
    "dialog.permissionChecking": "이 Host가 이 주소에 게시할 수 있는지 확인하는 중…",
    "dialog.permissionOk": "로그인했습니다. 이 Host에서 공유를 게시할 수 있습니다.",
    "dialog.permissionPending": "공유를 만들려면 먼저 이 주소를 확인해야 합니다.",
    "dialog.permissionFailed": "권한 확인을 마치지 못했습니다(Host가 원인을 알려 주지 않았습니다).",
    "dialog.outgoing": "내가 공유함",
    "dialog.noOutgoing": "공유한 세션이 없습니다",
    "dialog.share.online": "온라인",
    "dialog.share.offline": "오프라인",
    "dialog.open": "열기",
    "dialog.stop": "공유 중지",
    "dialog.stopFailed": "공유를 중지하지 못했습니다. 다시 시도하세요.",
    "manage.title": "공유 관리",
    "manage.open": "관리",
    "manage.cancelShare": "공유 취소",
    "manage.description": "모든 공유의 온라인 상태와 접근 범위를 확인합니다.",
    "manage.stop.title": "공유를 중지할까요?",
    "manage.stop.description": "게시된 링크가 즉시 작동하지 않으며 보고 있던 사람은 모두 접근 권한을 잃습니다.",
    "manage.stop.acknowledge": "게시된 링크가 즉시 작동하지 않게 된다는 것을 이해했습니다",
    "manage.identityExpired": "로그인이 만료되어 새 공유를 만들 수 없습니다. 기존에 게시한 공유는 영향을 받지 않으며 링크 복사와 관리도 계속할 수 있습니다.",
    "manage.loading": "공유 불러오는 중…",
    "manage.empty": "공유한 세션이 없습니다.",
    "manage.unavailable": "공유를 불러오지 못했습니다. 마지막으로 확인한 상태를 보여 줍니다.",
    "manage.refresh": "다시 불러오기",
    "manage.history": "기록",
    "manage.historyLoading": "기록 불러오는 중…",
    "manage.historyFailed": "기록을 불러오지 못했습니다. 다시 시도하세요.",
    "manage.expiresAt": "{time} 만료",
    "manage.expiredAt": "{time}에 만료됨",
    "manage.sessionMode": "세션 권한",
    "manage.sessionModeSwitch": "“{title}”의 세션 권한",
    "manage.allowsForkSwitch": "보는 사람이 “{title}”을(를) 분기할 수 있는지 여부",
    "manage.sessionModeUnsupported": "이 Harness가 세션 권한을 알려 주지 않아 여기서 설정할 수 없습니다.",
    "manage.sessionModeFailed": "세션 권한을 저장하지 못했습니다. 다시 시도하세요.",
    "manage.capabilities": "플러그인 엔드포인트",
    "manage.audit.shareCreate": "공유 만듦",
    "manage.audit.accessRequest": "보기 권한 요청함",
    "manage.audit.accessApproved": "요청 승인됨",
    "manage.audit.accessGrant": "보기 권한 부여됨",
    "manage.audit.accessRevoke": "보기 권한 회수됨",
    "manage.audit.shareStop": "공유 중지됨",
    "manage.done": "완료",
    "viewer.title": "Liveshare 읽기 전용 세션",
    "viewer.sharedBy": "{owner} 님이 공유 · {title}",
    "viewer.readonlyNote": "보기만 가능: 이 세션에 작업을 시킬 수는 있지만 공유 범위 안의 파일만 읽을 수 있고 아무것도 수정할 수 없습니다.",
    "viewer.writeUnavailableNote": "공유한 사람이 쓰기를 허용했지만 지금은 이 세션에 작업을 시킬 수 없습니다. 준비가 끝나면 보낼 수 있습니다.",
    "viewer.model.title": "이 세션이 실행되는 모델로, 세션을 공유한 사람이 골랐습니다",
    "viewer.model.locked": "보는 사람은 모델을 바꿀 수 없습니다",
    "viewer.permission.title": "이 공유에 적용된 세션 권한으로, 공유한 사람이 설정했습니다",
    "viewer.permission.locked": "보는 사람이 직접 바꿀 수 없습니다",
    "viewer.permission.unconfirmed": "아직 확인되지 않음",
    "viewer.transcriptLabel": "세션 내용(읽기 전용)",
    "viewer.role.user": "사용자",
    "viewer.role.assistant": "어시스턴트",
    "viewer.role.tool": "도구",
    "viewer.loading": "세션에 연결하는 중…",
    "viewer.empty": "이 세션에는 아직 표시할 내용이 없습니다.",
    "viewer.reconnecting": "연결이 끊겨 다시 시도하는 중…",
    "viewer.offline": "공유가 오프라인입니다. 자동으로 다시 연결됩니다.",
    "viewer.retry": "지금 다시 시도",
    "viewer.expired": "이 공유는 만료되어 더 이상 접근할 수 없습니다. 공유한 사람에게 다시 공유해 달라고 요청하세요.",
    "viewer.revoked": "공유한 사람이 공유를 중지했거나 접근 권한을 회수했습니다.",
    "viewer.reauthenticate": "로그인이 만료되었습니다. 다시 로그인하세요.",
    "viewer.reauthenticateAction": "다시 로그인",
    "viewer.status.connecting": "공유에 연결하는 중…",
    "viewer.status.invalid": "이 링크가 올바르지 않거나 해당 공유가 삭제되었습니다.",
    "viewer.status.invalidHint": "링크가 온전한지 확인하거나 공유한 사람에게 새 링크를 요청하세요.",
    "viewer.status.offline": "공유한 사람이 지금 오프라인입니다. 이 페이지는 자동으로 다시 연결됩니다.",
    "viewer.status.offlineHint": "잠시 기다리거나 ‘다시 시도’를 누르세요. 계속 오프라인이면 공유한 사람에게 문의하세요.",
    "viewer.status.stopped": "공유한 사람이 이 공유를 중지했습니다.",
    "viewer.status.stoppedHint": "계속 접근해야 하면 공유한 사람에게 다시 켜 달라고 요청하세요.",
    "viewer.status.expired": "이 공유는 만료되었습니다.",
    "viewer.status.expiredHint": "공유한 사람에게 세션을 다시 공유해 달라고 요청하세요.",
    "viewer.status.reauthenticate": "로그인이 만료되었습니다.",
    "viewer.status.unavailable": "지금은 공유 서비스를 쓸 수 없습니다. 다시 시도하는 중입니다.",
    "viewer.status.unavailableHint": "잠시 뒤 다시 시도하세요. 계속 쓸 수 없으면 나중에 다시 방문하세요.",
    "viewer.action.reload": "다시 불러오기",
    "viewer.action.retry": "다시 시도",
    "viewer.action.signIn": "다시 로그인",
    "viewer.action.directory": "공유 목록으로 돌아가기",
    "viewer.expiresAt": "{time}까지 접근 가능",
    "viewer.picker.ownerUnknown": "공유한 사람 알 수 없음",
    "viewer.picker.version": "DSH",
    "viewer.picker.groupCount": "공유 {count}개",
    "viewer.picker.online": "온라인",
    "viewer.picker.offline": "오프라인",
    "viewer.picker.subjectLabel": "주체 …{label}",
    "viewer.picker.historical": "인증되지 않은 기록",
    "viewer.picker.historicalNote": "신원 인증 도입 전에 만든 공유입니다. 기존 접근 권한은 유지됩니다.",
    "viewer.brand": "LiveShare",
    "viewer.home": "LiveShare 홈으로 돌아가기",
    "viewer.sharedByShort": "{owner} 님이 공유",
    "viewer.relayVersion": "relay {release}",
    "viewer.refused": "liveshare: {subject} 요청이 {status}(으)로 거부되었습니다",
    "viewer.relayAnswered": "liveshare: Relay가 {status}(으)로 응답했습니다",
    "viewer.relaySilent": "liveshare: Relay가 {subject}에 아무 응답도 하지 않았습니다",
    "viewer.unreachable": "liveshare: {subject} 요청이 Relay에 닿지 않아 다시 시도하는 중",
    "viewer.noAnswer": "응답 없음",
    "viewer.row.fork": "세션 분기",
    "viewer.row.forkSource": "“{title}”에서 분기함",
    "viewer.row.branchRefused": "분기를 완료하지 못했습니다: {reason}",
    "viewer.sharePath.unavailable": "이 페이지에서는 작업 공간 파일을 열 수 없습니다. 공유는 파일 내용이 아니라 파일 경로만 전달합니다.",
    "viewer.reason.fork-not-permitted": "공유한 사람이 이 세션의 분기를 허용하지 않습니다",
    "viewer.reason.fork-not-implemented": "이 배포는 아직 분기를 지원하지 않습니다",
    "viewer.reason.write-not-implemented": "이 배포는 아직 쓰기를 지원하지 않습니다",
    "viewer.reason.share-not-found": "해당 공유가 더 이상 없습니다",
    "viewer.reason.share-stopped": "공유가 중지되었습니다",
    "viewer.reason.share-expired": "공유가 만료되었습니다",
    "viewer.reason.source-session-mismatch": "분기 요청이 공유된 세션과 다른 세션을 지정했습니다",
    "viewer.reason.fork-operation-conflict": "이 분기 요청이 이전 요청과 다른 접두사를 지정해 새 세션을 만들지 않았습니다",
    "viewer.reason.fork-enforcement-failed": "분기 세션은 만들었지만 샌드박스 제한을 적용하지 못해 쓸 수 없습니다",
    "viewer.reason.mode-view": "공유한 사람이 이 공유를 보기만 가능으로 설정했습니다",
    "viewer.reason.unconfirmed": "이 공유의 현재 상태를 확인할 수 없어, 확인될 때까지 읽기 전용으로 유지됩니다",
    "viewer.reason.fork-viewer-unknown": "Relay가 신원을 확인하지 않아 분기를 만들 수 없습니다",
    "viewer.reason.fork-unknown-child": "이 세션은 공유에서 분기한 세션이 아닙니다",
    "viewer.reason.fork-viewer-mismatch": "이 분기는 다른 사람의 것입니다",
    "viewer.reason.fork-source-revoked": "이 분기의 원본 공유가 더 이상 활성 상태가 아닙니다",
    "viewer.reason.fork-ceiling-uninstalled": "이 Host에 읽기 전용 실행 제한이 설치되지 않았습니다",
    "viewer.reason.fork-prepare-failed": "Host가 이 분기를 준비하지 못해 이 작업을 실행하지 않았습니다",
    "viewer.reason.share-not-writable": "공유한 사람이 이 세션에 쓰기를 허용하지 않습니다",
    "viewer.reason.source-write-unavailable": "이 Host가 공유된 세션을 제한할 수 없어 세션에 작업을 시킬 수 없습니다",
    "viewer.reason.prompt-identity-missing": "이 전송에 요청자를 식별할 정보가 없어 Host가 실행하지 않았습니다",
    "viewer.reason.viewer-not-authorized": "이 계정은 더 이상 이 공유에 접근할 수 없습니다",
    "viewer.reason.liveshare/read-only": "이 세션은 보유한 공유 범위 밖에 있어 쓰지 않았습니다"
  },
  messageQuotes: {
    "quote.add": "텍스트 인용"
  },
  pluginRecommendations: {
    heading: "추천 플러그인",
    official: "공식",
    detailsFor: "상세 보기: {title}",
    "version-error": "이 플러그인은 현재 DSH 버전과 호환되지 않습니다. DSH를 업데이트한 뒤 다시 시도하세요.",
    "management-error": "플러그인을 켜지 못했습니다. 상세 정보에서 오류를 확인한 뒤 다시 시도하세요.",
    enable: "켜기",
    dismiss: "나중에",
    working: "처리 중…",
    scope: "켜면 모든 대화에서 쓸 수 있습니다",
    enabled: "켜짐",
    "already-enabled": "‘플러그인’에서 이미 선택되어 있습니다. 상세 정보에서 실행 상태를 확인하세요.",
    dismissed: "건너뜀",
    replaced: "대체됨",
    "restart-required": "저장했습니다. 적용하려면 DSH를 다시 시작하세요.",
    failed: "켜지 못했습니다. 다시 시도하거나 ‘플러그인’에서 확인하세요.",
    retry: "켜기 다시 시도",
    unconfirmed: "플러그인이 켜졌는지 확인하지 못했습니다. 다시 시도해 확인하세요.",
    "lookup-failed": "이 플러그인의 상세 정보를 불러오지 못했습니다. 다시 시도하세요.",
    retryLookup: "다시 시도",
    unavailable: "지금은 이 플러그인을 켤 수 없습니다. ‘플러그인’에서 확인하세요.",
    unknown: "이 추천을 쓸 수 없습니다. 대화를 다시 여세요.",
    "access-denied": "이 프로필을 변경할 권한이 없습니다.",
    "not-live-root": "이 추천은 원래 대화에서 사용하세요.",
    closing: "서비스를 다시 불러오는 중입니다. 잠시 뒤 다시 시도하세요.",
    transport: "결과를 확인하지 못했습니다. 새로 고친 뒤 다시 시도하세요."
  },
  sidebarCodePreview: {
    title: "코드",
    copy: "복사",
    copied: "복사됨"
  },
  sidebarDocumentPreview: {
    loading: "문서 렌더링 중…",
    loadMore: "더 불러오기",
    changed: "파일이 바뀌었습니다. 현재는 변경 전 내용을 표시하고 있습니다.",
    reloadNow: "다시 불러오기",
    reload: "파일 다시 읽기",
    autoRefresh: "자동 새로 고침",
    "autoRefresh.enable": "자동 새로 고침 켜기",
    "autoRefresh.disable": "자동 새로 고침 끄기",
    "wrap.enable": "자동 줄바꿈 켜기",
    "wrap.disable": "자동 줄바꿈 끄기",
    "wrap.aria": "자동 줄바꿈",
    openWith: "열기 방식",
    "viewer.text": "일반 텍스트",
    resourceUnavailable: "파일 리소스 서비스를 쓸 수 없습니다.",
    rendererUnavailable: "{name} 미리보기를 쓸 수 없습니다.",
    unsupportedFile: "이 파일 형식은 아직 미리 볼 수 없습니다.",
    "error.notFound": "파일이 없습니다. 옮겨졌거나 삭제됐을 수 있습니다.",
    "error.tooLarge": "이 페이지는 {limit} 제한을 넘어 읽을 수 없습니다.",
    "error.notText": "이 파일 형식은 아직 미리 볼 수 없습니다.",
    "error.notRegularFile": "일반 파일이 아니라 표시할 내용이 없습니다.",
    "error.unavailable": "읽기 실패: {message}",
    retry: "다시 시도"
  },
  sidebarExcel: {
    title: "스프레드시트",
    language: "ko-KR",
    loading: "문서 렌더링 중…",
    invalid: "이 스프레드시트를 열 수 없습니다. 형식, 내용, 암호 보호 여부를 확인하세요.",
    tooLarge: "이 통합 문서는 미리보기 크기 제한을 넘습니다.",
    timeout: "통합 문서 열기 시간이 초과되었습니다. 더 작은 파일로 시도하세요.",
    encoding: "이 텍스트 인코딩을 읽을 수 없습니다. 파일을 UTF-8 또는 BOM이 있는 UTF-16으로 저장한 뒤 다시 시도하세요.",
    formulaWarning: "이 통합 문서에는 수식이 있습니다. 표시된 계산 결과가 누락되거나 정확하지 않을 수 있습니다.",
    unsupportedNotice: "이 미리보기는 통합 문서의 {features}을(를) 지원하지 않습니다. 전체 내용을 보려면 시스템 앱에서 여세요.",
    charts: "차트",
    images: "이미지",
    shapes: "도형",
    conditionalFormatting: "조건부 서식",
    featureSeparator: ", ",
    retry: "다시 시도"
  },
  sidebarImage: {
    zoomControls: "배율 조절",
    zoomMenu: "배율 선택",
    zoomOut: "축소",
    zoomIn: "확대",
    zoomFitWidth: "너비에 맞추기",
    zoomValue: "{percent}%",
    title: "이미지",
    preview: "이미지 미리보기: {name}",
    loading: "문서 렌더링 중…",
    failed: "이 이미지를 표시할 수 없습니다.",
    unsupported: "이미지 미리보기에는 전체 파일 내용이 필요합니다."
  },
  sidebarOffice: {
    title: "Office 문서",
    loading: "문서 렌더링 중…",
    retry: "다시 시도",
    viewMissingFonts: "없는 글꼴 {count}개. 눌러서 보기",
    missingFontsTitle: "없는 글꼴",
    missingFontsDescription: "이 미리보기에서 쓸 수 없는 글꼴입니다. 텍스트와 레이아웃이 원본 문서와 다를 수 있습니다.",
    missingFontsCount: "글꼴 {count}개",
    closeDetails: "글꼴 상세 닫기",
    unavailable: "Office 미리보기를 쓸 수 없습니다. DeepSeek Harness를 실행하는 컴퓨터에서 문서 미리보기 서비스를 켜세요.",
    invalid: "이 Office 파일은 미리 볼 수 없습니다. 파일이 손상됐거나, 암호로 보호되어 있거나, 확장자가 잘못됐을 수 있습니다.",
    tooLarge: "Office 파일 또는 변환된 PDF가 미리보기 크기 제한을 넘습니다. 파일 크기를 줄이거나 미리보기 설정을 조정하세요.",
    failed: "Office 문서를 미리 볼 수 있는 PDF로 변환하지 못했습니다. 파일을 확인하고 다시 시도하세요.",
    timeout: "Office 변환 시간이 초과되었습니다. 다시 시도하세요.",
    busy: "Office 미리보기가 사용 중입니다. 잠시 뒤 다시 시도하세요.",
    changed: "읽는 동안 파일이 바뀌었습니다. 미리보기를 다시 여세요."
  },
  sidebarPdf: {
    zoomControls: "배율 조절",
    zoomMenu: "배율 선택",
    zoomOut: "축소",
    zoomIn: "확대",
    zoomFitWidth: "너비에 맞추기",
    zoomValue: "{percent}%",
    title: "PDF",
    pageImage: "PDF {page}페이지",
    loading: "문서 렌더링 중…",
    rendering: "페이지 렌더링 중…",
    failed: "PDF를 표시할 수 없습니다: {message}",
    password: "암호가 필요한 PDF입니다. 암호로 보호된 파일은 미리 볼 수 없습니다.",
    workerFailed: "PDF 렌더링 프로세스를 계속할 수 없습니다. 다시 시도하세요.",
    unsupported: "PDF 미리보기에는 전체 파일 내용이 필요합니다.",
    retry: "다시 시도"
  },
  stats: {
    "view.stats": "통계",
    "column.scope": "턴 / 단계",
    "column.scope.title": "턴 행에는 해당 턴의 합계가 표시됩니다. 행을 클릭하면 단계를 펼치거나 접을 수 있습니다",
    "column.prompt": "트리거",
    "column.prompt.title": "이 턴을 시작한 계기: 사용자 프롬프트는 텍스트를, 자동화는 출처 배지를 표시합니다",
    "trigger.agent-message": "에이전트 메시지",
    "trigger.team-message": "팀 메시지",
    "trigger.schedule": "예약 작업",
    "trigger.webhook": "웹훅",
    "trigger.tool-jobs": "백그라운드 작업",
    "trigger.cordis-host-runner": "플러그인 실행",
    "trigger.subagent-settled": "하위 에이전트 완료",
    "trigger.goal": "목표 실행 턴",
    "trigger.context": "컨텍스트 깨우기",
    "trigger.other": "자동 실행 턴",
    "column.did": "실행 내용",
    "column.did.title": "이 단계에서 호출한 도구와 호출 횟수. 도구 호출이 없는 단계는 답변 텍스트를 미리 보여 줍니다",
    "column.context": "컨텍스트",
    "column.context.title": "입력 토큰(usage) + 캐시 읽기 + 캐시 쓰기",
    "column.output": "출력",
    "column.output.title": "이 단계의 usage 출력 토큰",
    "column.cache": "캐시 적중",
    "column.cache.title": "캐시 읽기 ÷ (입력 + 캐시 읽기 + 캐시 쓰기): 프롬프트 중 캐시에서 제공된 비율",
    "cache.detail": "캐시 읽기 {read} · 입력 {input} · 캐시 쓰기 {write}",
    "column.ttft": "첫 토큰",
    "column.ttft.title": "단계 시작부터 첫 출력 조각까지(TTFT)",
    "column.model": "모델 소요 시간",
    "column.model.title": "단계 시작부터 응답 확정까지(첫 토큰 지연 포함)",
    "column.tps": "출력 속도",
    "column.tps.title": "출력 토큰 ÷ 생성 시간(초) (TPS, tok/s)",
    "column.tool": "도구 호출 소요 시간",
    "column.tool.title": "단계 내 각 도구 호출부터 결과를 받을 때까지 걸린 시간의 합입니다. 결과가 없는 호출은 제외합니다",
    "column.time": "총 소요 시간",
    "column.time.title": "하늘색은 첫 토큰, 파란색은 생성, 주황색은 도구 호출, 회색은 그 밖의 시간입니다. 막대 길이는 제곱근 척도로 표시합니다. 단계는 같은 턴 안에서, 턴은 턴끼리 비교하세요",
    "turn.label": "턴 {turn}",
    "step.label": "단계 {step}",
    "step.toggle.aria": "단계 {step}의 도구 상세 펼치기 또는 접기",
    "step.partial": "시작 시간 알 수 없음",
    "step.started.title": "{time}에 단계 시작",
    "compaction.label": "압축",
    "compaction.running": "압축 중…",
    "compaction.shadowed": "이전 기록 {tokens}토큰 정리됨",
    "compaction.summary": "요약 {chars}자",
    "compaction.title": "압축 실행은 따로 표시되며 턴의 단계 합계에서 제외됩니다",
    "event.show": "이벤트 행 보기(압축 포함)",
    "context.delta.show": "컨텍스트 변화량 보기",
    "context.delta.title": "턴 안에서 직전에 측정된 단계 대비 프롬프트 변화량. 음수는 컨텍스트가 줄었다는 뜻입니다(예: 압축 후)",
    "event.request-header": "요청 헤더",
    "event.system-prompt": "시스템 프롬프트",
    "event.tool-set": "도구 세트 변경",
    "event.context-prune": "컨텍스트 정리",
    "event.request-context": "요청 컨텍스트",
    "event.model-retry": "모델 재시도",
    "event.model-attempt": "모델 시도",
    "event.context-refresh": "컨텍스트 새로 고침",
    "event.approval": "승인",
    "event.context.detail": "{provider} / {model} · 프롬프트 모드 {mode}",
    "event.retry.detail": "재시도 {retry} · 대기 {delay}",
    "event.attempt.detail": "확정된 메시지가 없는 모델 시도",
    "event.refresh.detail": "{source} · {chars}자",
    "event.approval.detail": "{tool} · {status}",
    "event.source.runtime": "런타임 컨텍스트",
    "event.source.time": "시간 컨텍스트",
    "event.approval.asked": "대기 중",
    "event.approval.allowed": "한 번 허용됨",
    "event.approval.rejected": "거부됨",
    "event.approval.cancelled": "취소됨",
    "event.approval.unavailable": "쓸 수 없음",
    "event.title": "단계가 아닌 이벤트 행: 턴의 단계 합계에서 제외되는 요청, 프롬프트, 도구 세트, 재시도, 컨텍스트 새로 고침, 승인, 정리 변경",
    "event.reason.initial": "처음",
    "event.reason.resume": "다시 시작",
    "event.reason.change": "변경",
    "event.reason.series": "새 시리즈",
    "event.header.detail": "{reason} · 도구 {tools}개",
    "event.series": "새 시리즈",
    "event.system.append": "추가",
    "event.system.replace": "교체",
    "event.system.clear": "비우기",
    "event.system.detail": "{action} · {chars}자",
    "event.tools.added": "{tools} 추가됨",
    "event.tools.removed": "{tools} 제거됨",
    "event.prune.detail": "{tokens}토큰 정리됨",
    "step.partial.title": "현재 이벤트 범위에 이 단계의 시작·종료 이벤트가 없습니다(탭 재연결 중 잘렸거나 범위가 다시 구성됨). 따라서 첫 토큰, 모델 시간, 총 시간을 계산할 시작점을 알 수 없습니다. 탭을 다시 불러오면 전체 범위에서 다시 구성합니다",
    "state.running": "실행 중",
    "state.interrupted": "중단됨",
    "state.cacheMiss": "캐시 미적중",
    "state.cacheMiss.title": "프롬프트가 캐시에 거의 적중하지 않았습니다. 보통 재시작이나 세션 재개 후 첫 요청이며 입력 전체 가격으로 과금됩니다",
    "state.aborted": "미확정",
    "state.aborted.title": "확정된 응답 없이 단계가 끝났습니다(보통 취소 또는 실패)",
    unknown: "기록 안 됨",
    partial: "도구 호출 {count}건에 아직 결과가 없습니다. 표시된 시간은 현재까지 확인된 최소 소요 시간입니다",
    empty: "현재 범위에 측정할 수 있는 단계가 없습니다.",
    loadOlder: "이전 기록 더 불러오기",
    "loadOlder.loading": "이전 턴 불러오는 중…",
    "loadOlder.done": "기록의 처음에 도달했습니다",
    "loadOlder.failed": "불러오기 실패. 다시 시도",
    summary: "턴 {turns}개 · 단계 {steps}개",
    "table.showTotals": "합계 행 보기",
    "contextMode.label": "컨텍스트 기준",
    "contextMode.latest": "최신",
    "contextMode.latest.title": "턴 행에 마지막으로 측정된 단계의 프롬프트 크기(최종 컨텍스트)를 표시합니다. 합계 행은 누적값을 유지합니다",
    "contextMode.cumulative": "누적",
    "contextMode.cumulative.title": "턴 행에 턴의 모든 단계 프롬프트 크기 합(누적 처리량)을 표시합니다. 합계 행은 누적값을 유지합니다",
    "totals.full": "세션 전체 합계",
    "totals.full.title": "전체 세션의 합계. 총 시간은 모델 시간 + 도구 시간입니다(턴 사이 간격 제외)",
    "totals.window": "현재 범위 합계",
    "totals.window.title": "이 범위에 불러온 턴의 합계. 컨텍스트 칸은 모든 단계의 누적값입니다",
    "expand.all": "모두 펼치기",
    "collapse.all": "모두 접기",
    "turn.expand": "펼치기",
    "turn.collapse": "접기",
    "turn.toggle.title": "이 턴의 단계 펼치기 또는 접기",
    "turn.toggle.aria": "턴 {turn} 펼치기 또는 접기",
    "did.answer": "답변",
    "did.working": "생성 중",
    "did.aborted": "답변 없음",
    "did.more": "{count}개 더",
    "did.rest": "호출 {count}건 더",
    "did.title": "호출 {calls}건: {tools}",
    "did.retry": "{count}회 재시도",
    "did.lines": "{lines}줄",
    "did.lines.unit": "줄",
    "did.chars": "{chars}자",
    "did.output": "→ {chars}자",
    "did.total": "이 단계의 도구 출력 {chars}자. 다음 프롬프트에 포함됩니다",
    "detail.show": "상세",
    "detail.hide": "접기",
    "detail.title": "이 행을 클릭하면 도구 상세를 펼치거나 접습니다",
    "detail.calls": "도구 호출 {count}건",
    "detail.answer": "답변",
    "detail.answer.truncated": "답변이 길어 처음 16,000자만 보관합니다",
    "detail.code.title": "코드 블록",
    "detail.code.wrap": "자동 줄바꿈",
    "detail.code.unwrap": "줄바꿈 안 함",
    "detail.footnotes": "각주",
    "detail.copy": "복사",
    "detail.copy.title": "이 텍스트 복사",
    "detail.copied": "복사됨",
    "detail.copyFailed": "복사 실패",
    "detail.chars": "{chars}자",
    "detail.lines": "{lines}줄",
    "detail.file": "파일",
    "detail.diff": "변경",
    "detail.emptyBody": "이 호출은 텍스트를 남기지 않았습니다",
    "detail.hidden": "호출 {count}건은 목록에 표시하지 않습니다(단계당 최대 {limit}건)",
    "detail.args": "원본 인자",
    "detail.wrap": "줄바꿈",
    "detail.wrap.title": "긴 줄을 가로로 스크롤하지 않고 줄바꿈합니다",
    "detail.raw.title": "원본 JSON 인자 보기",
    "detail.lineCap": "전체 {total}줄 중 처음 {shown}줄 표시",
    "detail.truncated": "너무 길어 처음 {chars}자만 보관합니다",
    "tool.failed": "{count}건 실패",
    "tool.failed.title": "이 단계의 도구 호출 {count}건이 오류 결과를 반환했습니다",
    "bar.ttft": "첫 토큰 {value}",
    "bar.gen": "생성 {value}",
    "bar.tool": "도구 호출 {value}",
    "bar.rest": "기타 {value}",
    "bar.wall": "총 {value}",
    "bar.running": "아직 실행 중이므로 경과 시간을 표시합니다",
    "bar.gap": "이전 단계 이후 간격 {value}",
    "bar.start": "{clock} 시작",
    "turn.started": "이 턴은 {time}에 시작했습니다",
    "turn.images": "이미지 {count}개",
    "imagePreview.hint": "마우스를 올리거나 포커스하면 이 턴의 이미지를 미리 봅니다. 클릭하면 전체 이미지를 엽니다",
    "imagePreview.dialog": "이미지 미리보기",
    "imagePreview.open": "이미지 {count}개 중 {index}번째 보기",
    "imagePreview.alt": "이미지 {index}",
    "imagePreview.loading": "이미지 불러오는 중…",
    "imagePreview.failed": "이미지를 불러오지 못했습니다",
    "imagePreview.retry": "다시 시도",
    "imagePreview.close": "이미지 미리보기 닫기",
    "steps.total": "단계 {total}개",
    "steps.tail": "최근 {limit}개만",
    "steps.all": "단계 {total}개 모두 보기",
    "steps.filter": "{tool}만",
    "steps.clear": "필터 지우기",
    "steps.matched": "{tool}을(를) 사용한 단계 {count}개"
  },
  contextMenu: {
    failed: "작업을 완료하지 못했습니다. 다시 시도하세요."
  },
  "directory-browser": {
    "browser.title": "작업 공간 폴더 선택",
    "browser.home": "홈",
    "browser.newFolder": "새 폴더",
    "browser.folderName": "폴더 이름",
    "browser.createIn": '"{name}" 안에 새 폴더',
    "browser.untitledFolder": "이름 없는 폴더",
    "browser.create": "만들기",
    "browser.cancel": "취소",
    "browser.open": "열기",
    "browser.editPath": "경로 직접 입력",
    "browser.loading": "불러오는 중…",
    "browser.truncated": "폴더가 너무 많아 앞부분만 표시합니다.",
    "browser.showHidden": "숨김 파일 표시"
  }
};

// plugin/client.ts
var ROOT = "/deepseek-harness-kr/assets/";
var SLOT = "__deepseekHarnessKrDispose";
var ENTRY_ID = "deepseek-harness-kr";
var OUTFIT_FIELDS = OUTFIT_ITEMS.map(({ key, ko, en }) => [key, ko, en]);
var BODY_TYPES2 = BODY_TYPES.map(({ key, ko, en }) => [key, ko, en]);
var HIDDEN_IN_WINDOW_PANELS = /* @__PURE__ */ new Set(["plugins", "schedules"]);
var panelHidesInWindowCharacter = (activePanelId) => HIDDEN_IN_WINDOW_PANELS.has(activePanelId);
var sleepMinutes = (value) => {
  const n = Number(value ?? 1);
  return Number.isFinite(n) ? Math.min(60, Math.max(0.5, n)) : 1;
};
var inRange = (value, min, max, fallback) => {
  const n = Number(value ?? fallback);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};
var browScale = (value) => inRange(value, 0, 2, 1);
var browSmoothMs = (value) => inRange(value, 0, 300, 80);
var aoStrength = (value) => inRange(value, 0, 1, 0.6);
var SHORTCUT_HINT_ID = "deepseek-harness-kr-shortcut-hint";
var PET_SHORTCUT_HINT_ID = "deepseek-harness-kr-pet-shortcut-hint";
var DRAG_HINT_ID = "deepseek-harness-kr-drag-hint";
var CANVAS_HINT_ID = "deepseek-harness-kr-canvas-hint";
var MODIFIER_KEYS = /* @__PURE__ */ new Set(["Control", "Shift", "Alt", "Meta", "AltGraph", "CapsLock"]);
var MODIFIER_ALIASES = /* @__PURE__ */ new Map([
  ["ctrl", "ctrl"],
  ["control", "ctrl"],
  ["shift", "shift"],
  ["alt", "alt"],
  ["option", "alt"],
  ["meta", "meta"],
  ["cmd", "meta"],
  ["command", "meta"],
  ["win", "meta"],
  ["windows", "meta"]
]);
var isMacPlatform = () => /Mac|iPhone|iPad|iPod/i.test(typeof navigator === "object" && navigator ? String(navigator.platform || navigator.userAgent || "") : "");
var shortcutKeyToken = (key) => {
  const text = String(key ?? "");
  if (text === " ") return "space";
  if (text === "+") return "plus";
  return text.toLowerCase();
};
function parseShortcut(value) {
  const combo = { ctrl: false, shift: false, alt: false, meta: false, key: "" };
  for (const raw of String(value ?? "").split("+")) {
    const token = raw.trim();
    if (!token) continue;
    const modifier = MODIFIER_ALIASES.get(token.toLowerCase());
    if (modifier) combo[modifier] = true;
    else combo.key = shortcutKeyToken(token);
  }
  return combo.key ? combo : null;
}
function shortcutFromEvent(event) {
  const key = String(event?.key ?? "");
  if (!key || MODIFIER_KEYS.has(key)) return "";
  const parts = [];
  if (event.ctrlKey) parts.push("Ctrl");
  if (event.altKey) parts.push("Alt");
  if (event.shiftKey) parts.push("Shift");
  if (event.metaKey) parts.push(isMacPlatform() ? "Cmd" : "Meta");
  parts.push(key === " " ? "Space" : key === "+" ? "Plus" : key.length === 1 ? key.toUpperCase() : key);
  return parts.join("+");
}
function matchesShortcut(value, event) {
  const combo = parseShortcut(value);
  if (!combo || !event) return false;
  return combo.ctrl === !!event.ctrlKey && combo.alt === !!event.altKey && combo.shift === !!event.shiftKey && combo.meta === !!event.metaKey && combo.key === shortcutKeyToken(event.key);
}
var heldModifiers = (event) => {
  const parts = [];
  if (event.ctrlKey) parts.push("Ctrl");
  if (event.altKey) parts.push("Alt");
  if (event.shiftKey) parts.push("Shift");
  if (event.metaKey) parts.push(isMacPlatform() ? "Cmd" : "Meta");
  return parts.join("+");
};
function shortcutKeyDown(event) {
  if (event.key === "Tab") return { action: "leave" };
  if (event.key === "Escape") return { action: "cancel" };
  if (event.key === "Backspace" || event.key === "Delete") return { action: "clear" };
  const combo = shortcutFromEvent(event);
  return combo ? { action: "save", combo } : { action: "wait", held: heldModifiers(event) };
}
var MODIFIER_LABELS = /* @__PURE__ */ new Map([["Control", "Ctrl"], ["Alt", "Alt"], ["Shift", "Shift"], ["Meta", isMacPlatform() ? "Cmd" : "Meta"]]);
var DRAG_KEY_LABELS = /* @__PURE__ */ new Map([[" ", "Space"], ["+", "Plus"]]);
function dragKeyDown(event) {
  if (event.key === "Tab") return { action: "leave" };
  if (event.key === "Escape") return { action: "cancel" };
  if (event.key === "Backspace" || event.key === "Delete") return { action: "clear" };
  const modifier = MODIFIER_LABELS.get(event.key);
  if (modifier) return { action: "wait", held: modifier };
  if (event.ctrlKey || event.altKey || event.shiftKey || event.metaKey) return { action: "wait", held: heldModifiers(event) };
  const key = String(event.key ?? "");
  if (!key) return { action: "wait", held: "" };
  const label = DRAG_KEY_LABELS.get(key) ?? (key.length === 1 ? key.toUpperCase() : key);
  return { action: "save", key: label };
}
function stylesheet(life, file) {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = ROOT + file;
  document.head.appendChild(link);
  life.add(() => link.remove());
}
function mountLayout(life) {
  const owned = /* @__PURE__ */ new Map();
  const mark = (node, name2) => {
    if (node.classList.contains(name2)) return;
    node.classList.add(name2);
    if (!owned.has(node)) owned.set(node, /* @__PURE__ */ new Set());
    owned.get(node).add(name2);
  };
  const tag = () => {
    document.querySelectorAll('[class*="_card"]').forEach((node) => {
      if (node.closest('[class*="_root"]') && node.querySelector('[class*="_input"]')) mark(node, "dsc-composer");
    });
    document.querySelectorAll('button[aria-label="메시지 보내기"], button[aria-label="Send message"]').forEach((node) => mark(node, "dsc-send"));
    document.querySelectorAll('button[class*="_newSession"]').forEach((node) => mark(node, "dsc-newsession"));
  };
  tag();
  let queued = false;
  life.observe(() => {
    if (queued) return;
    queued = true;
    life.frame(() => {
      queued = false;
      tag();
    });
  }).observe(document.body, { childList: true, subtree: true });
  life.add(() => {
    for (const [node, names] of owned) for (const name2 of names) node.classList.remove(name2);
  });
}
function mountTheme(ctx, life) {
  stylesheet(life, "theme.css");
  life.add(() => {
    if (ctx.theme.getTheme().active.colorScheme === "dark") document.body.setAttribute("data-ds-dark-theme", "");
    else document.body.removeAttribute("data-ds-dark-theme");
  });
}
function mountTranslation(ctx, life) {
  stylesheet(life, "korean.css");
  if (!ctx.locale.getLocale().locales.some((locale) => locale.id.toLowerCase() === "ko")) {
    life.add(ctx.locale.addLanguage({ id: "ko", label: "한국어", fallback: "en" }));
  }
  for (const [namespace, dictionary] of Object.entries(locales_ko_default)) {
    life.add(ctx.locale.register(namespace, "ko", dictionary));
  }
}
function createCharacterLink() {
  let character = null, prefs = {}, pageHidden = false;
  return {
    /** 지금 붙어 있는 캐릭터 API (없으면 null) */
    get character() {
      return character;
    },
    /** 마지막으로 받은 캐릭터 설정값 */
    get prefs() {
      return prefs;
    },
    /** 지금 패널 때문에 창 안 캐릭터를 숨기는 중인지 여부 */
    get pageHidden() {
      return pageHidden;
    },
    /**
     * 캐릭터 API 연결
     * @returns 떼는 함수. 그사이 다른 캐릭터가 붙었으면 건드리지 않음
     */
    attach(next) {
      character = next;
      return () => {
        if (character === next) character = null;
      };
    },
    /** 설정값 보관과 붙어 있는 캐릭터에 전달 */
    setPrefs(next) {
      prefs = next;
      character?.setPrefs(next);
    },
    /** 패널 숨김 상태 변경. 바뀌었을 때만 캐릭터에 전달 */
    setPageHidden(next) {
      if (pageHidden === next) return;
      pageHidden = next;
      character?.setPrefs({ pageHidden });
    },
    /** 캐릭터가 처음 뜰 때 쓸 설정값 (설정값 + 패널 숨김 상태) */
    initialPrefs() {
      return { ...prefs, pageHidden };
    }
  };
}
function characterPrefs(value) {
  return {
    // 캐릭터는 매 프레임 이 값을 읽어 소품·옷·체형을 바로 바꾼다 (다시 띄우지 않음)
    outfit: Object.fromEntries([...OUTFIT_FIELDS.map(([field]) => [field, value[field] === true]), ["bodyType", value.bodyType || "default"]]),
    // 절전: 캐릭터의 상태 감시 인터벌이 읽음
    sleep: { enabled: value.idleSleep !== false, minutes: sleepMinutes(value.idleSleepMinutes) },
    // 시작 등장 연출 여부: 캐릭터가 처음 뜰 때 읽는다 (끄면 가운데 인사 없이 바로 제자리에)
    intro: { enabled: value.intro !== false },
    // 모바일(터치 전용) 화면에서 캐릭터를 숨길지: 캐릭터가 매 프레임 읽는다 (기본 표시)
    mobile: { enabled: value.mobileCharacter !== false },
    // 실험: 3D 모델 폴더가 있으면 창 안 캐릭터를 3D 렌더러로 (캐릭터가 처음 뜰 때만 읽음). 눈썹 세기·부드러움은 매 프레임 읽음
    avatar: {
      enabled: typeof value.avatarModelDir === "string" && value.avatarModelDir.trim() !== "",
      outline: value.avatarOutline === "model" ? "model" : "smooth",
      browScale: browScale(value.avatarBrowScale),
      browSmooth: browSmoothMs(value.avatarBrowSmooth) / 1e3,
      // 구운 AO: 켜기는 처음 뜰 때만, 세기는 매 프레임 읽음
      ao: value.avatarAo === true,
      aoStrength: aoStrength(value.avatarAoStrength)
    },
    // 캐릭터 이동 보조 키: 포인터 이벤트마다 읽는다. 빈 문자열이면 '이동 키 없음'
    drag: { key: value.dragKey ?? "Alt" },
    // '대사 ex': 켜면 assets/dsc-lines-ex.json의 대사를 덮어쓴다 (기본 꺼짐)
    extra: { enabled: value.extraLines === true }
  };
}
function startCharacter(life, link, onSetting) {
  stylesheet(life, "character.css");
  const character = createCharacter({ base: ROOT, life, prefs: link.initialPrefs(), onSetting });
  life.add(link.attach(character));
}
function githubSource(spec) {
  if (typeof spec !== "string") return null;
  const text = spec.trim();
  const short = text.match(/^github:([\w.-]+)\/([\w.-]+?)(?:\.git)?(?:#(.+))?$/i);
  const full = text.match(/^(?:git\+)?(?:https?:\/\/|ssh:\/\/git@|git@)github\.com[/:]([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?(?:#(.+))?$/i);
  const match = short || full;
  return match ? { owner: match[1], repo: match[2], ref: match[3] || null } : null;
}
function compareVersions(left, right) {
  const parse = (version) => {
    const [core, prerelease] = String(version ?? "").trim().replace(/^v/i, "").split("-", 2);
    return { nums: core.split(".").map((n) => parseInt(n, 10) || 0), pre: prerelease ?? null };
  };
  const x = parse(left), y = parse(right);
  for (let i = 0; i < Math.max(x.nums.length, y.nums.length, 3); i++) {
    const difference = (x.nums[i] ?? 0) - (y.nums[i] ?? 0);
    if (difference) return difference;
  }
  if (x.pre === y.pre) return 0;
  if (x.pre === null) return 1;
  if (y.pre === null) return -1;
  return x.pre < y.pre ? -1 : 1;
}
var PENDING_KEY = "deepseek-harness-kr:update";
var browserStorage = {
  /** 남겨 둔 업데이트 요청 읽기 (없거나 읽지 못하면 null) */
  read() {
    try {
      return JSON.parse(window.localStorage.getItem(PENDING_KEY) || "null");
    } catch {
      return null;
    }
  },
  /** 업데이트 요청 남기기 (저장소를 못 쓰면 무시) */
  write(value) {
    try {
      window.localStorage.setItem(PENDING_KEY, JSON.stringify(value));
    } catch {
    }
  },
  /** 남겨 둔 업데이트 요청 지우기 */
  clear() {
    try {
      window.localStorage.removeItem(PENDING_KEY);
    } catch {
    }
  }
};
function createUpdater({ fetch: fetchImpl = (...args) => window.fetch(...args), storage = browserStorage, now = () => Date.now() } = {}) {
  const listeners = /* @__PURE__ */ new Set();
  let manager = null, generation = 0;
  let snapshot = { phase: "unavailable" };
  const set = (patch) => {
    snapshot = { ...snapshot, ...patch };
    for (const fn of [...listeners]) fn();
  };
  const message = (error) => error && (error.message || error.code || String(error)) || "";
  const failure = (value) => [value?.error?.code, value?.error?.diagnostic].filter(Boolean).join(": ") || "failed";
  const resume = async (mine) => {
    const pending = storage.read();
    if (!pending || typeof pending.requestId !== "string") return false;
    if (now() - (pending.at || 0) > 15 * 60 * 1e3) {
      storage.clear();
      return false;
    }
    if (snapshot.current && pending.to && compareVersions(snapshot.current, pending.to) >= 0) {
      storage.clear();
      set({ phase: "updated", from: pending.from, error: "" });
      return true;
    }
    const waited = await manager.waitForInstall?.(pending.requestId);
    if (mine !== generation) return true;
    if (waited?.ok && waited.value) {
      storage.clear();
      const outcome = waited.value;
      set(outcome.application === "failed" ? { phase: "update-failed", error: failure(outcome) } : { phase: "updated", from: pending.from, error: "" });
      return true;
    }
    storage.clear();
    return false;
  };
  const check = async () => {
    const mine = ++generation;
    if (!manager) {
      set({ phase: "unavailable" });
      return;
    }
    set({ phase: "checking", error: "" });
    try {
      const listed = await manager.listBundles();
      if (mine !== generation) return;
      if (!listed?.ok) throw new Error(message(listed?.error) || "listBundles failed");
      const row = listed.value.find((item) => item.name === name);
      const current = row?.version ?? null, source = row?.source ?? null;
      const github = githubSource(source);
      if (!github) {
        set({ phase: "unsupported", current, latest: null, source });
        return;
      }
      if (github.ref && /^[0-9a-f]{7,40}$/i.test(github.ref)) {
        set({ phase: "pinned", current, latest: null, source });
        return;
      }
      const url = `https://raw.githubusercontent.com/${github.owner}/${github.repo}/${encodeURIComponent(github.ref || "HEAD")}/package.json`;
      const response = await fetchImpl(url, { cache: "no-store" });
      if (mine !== generation) return;
      if (!response.ok) throw new Error("HTTP " + response.status);
      const latest = (await response.json())?.version;
      if (mine !== generation) return;
      if (typeof latest !== "string") throw new Error("no version in package.json");
      set({ current, latest, source });
      if (await resume(mine)) return;
      if (mine !== generation) return;
      set({ phase: compareVersions(latest, current) > 0 ? "available" : "current" });
    } catch (error) {
      if (mine === generation) set({ phase: "check-failed", error: message(error) });
    }
  };
  const settle = (value) => {
    if (value.application === "applied" || value.application === "overridden") set({ phase: "updated", from: snapshot.current });
    else if (value.application === "restart-required") set({ phase: "restart" });
    else if (value.application === "cancelled") set({ phase: "available", error: "cancelled" });
    else set({ phase: "update-failed", error: failure(value) });
  };
  const update = () => {
    if (manager && snapshot.phase === "available" && snapshot.source) set({ phase: "confirm", error: "" });
  };
  const cancel = () => {
    if (snapshot.phase === "confirm") set({ phase: "available" });
  };
  const confirm = async () => {
    if (!manager || snapshot.phase !== "confirm" || !snapshot.source) return;
    const mine = ++generation, pluginManager = manager, source = snapshot.source;
    const requestId = name + "-update-" + now();
    set({ phase: "updating", error: "" });
    try {
      let result = await pluginManager.installBundle(source, { enabled: true, requestId });
      if (!result?.ok) throw new Error(message(result?.error) || "installBundle failed");
      if (result.value.application === "failed" && result.value.error?.code === "already-installed") {
        storage.write({ requestId, from: snapshot.current, to: snapshot.latest, source, at: now() });
        const removed = await pluginManager.removeBundle(name);
        if (!removed?.ok) throw new Error(message(removed?.error) || "removeBundle failed");
        if (removed.value.application === "failed" || removed.value.error) {
          storage.clear();
          throw new Error(failure(removed.value));
        }
        result = await pluginManager.installBundle(source, { enabled: true, requestId });
        if (!result?.ok) throw new Error(message(result?.error) || "installBundle failed");
      }
      storage.clear();
      if (mine === generation) settle(result.value);
    } catch (error) {
      if (mine === generation) set({ phase: "update-failed", error: message(error) });
    }
  };
  return {
    /** 상태 변경 구독 (돌려준 함수로 해제) */
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    /** 지금 업데이트 상태 */
    getSnapshot: () => snapshot,
    /** 플러그인 관리자 연결과 바로 확인 시작 */
    attach(next) {
      manager = next;
      check();
    },
    /** 플러그인 관리자 연결 해제. 진행 중이던 요청 결과는 무시 */
    detach() {
      manager = null;
      generation++;
      set({ phase: "unavailable" });
    },
    check,
    update,
    cancel,
    confirm
  };
}
var DEFAULT_KEY_REF = "DSH_TTS_API_KEY";
function mountTts(feature) {
  apply({
    /** 음성 클라이언트가 붙인 것을 이 기능의 수명에 등록 */
    effect: (fn) => feature.add(fn())
  }).catch((error) => console.warn("DeepSeek짱 음성:", error));
}
function ttsSignature(value) {
  const tts = value.tts;
  if (value.character === false || tts?.enabled !== true || !tts.openai?.baseUrl) return null;
  return JSON.stringify([tts.openai.baseUrl, tts.stream?.pcmSampleRate, tts.voiceLines]);
}
function createKeyStore() {
  const listeners = /* @__PURE__ */ new Set();
  let remote = null, ref = DEFAULT_KEY_REF, generation = 0;
  let snapshot = { available: false, configured: false, source: null };
  const set = (next) => {
    snapshot = next;
    for (const fn of [...listeners]) fn();
  };
  const refresh = async () => {
    const mine = ++generation;
    if (!remote || !ref) {
      set({ available: !!remote, configured: false, source: null });
      return;
    }
    try {
      const response = await remote.describe([ref]);
      if (mine !== generation) return;
      const view = response?.ok ? response.value?.[ref] : void 0;
      set({ available: true, configured: view?.configured === true, source: view?.source ?? null });
    } catch {
      if (mine === generation) set({ available: true, configured: false, source: null });
    }
  };
  return {
    /** 상태 변경 구독 (돌려준 함수로 해제) */
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    /** 지금 키 저장 상태 */
    getSnapshot: () => snapshot,
    /** 지금 키 저장 이름 (credentials 참조 이름) */
    get ref() {
      return ref;
    },
    /**
     * 키 저장 이름 변경. 바뀌었을 때만 다시 조회
     * @param next 설정의 apiKeyEnv 값. 문자열이 아니면 기본 이름
     */
    setRef(next) {
      const name2 = typeof next === "string" ? next : DEFAULT_KEY_REF;
      if (name2 !== ref) {
        ref = name2;
        refresh();
      }
    },
    /** credentials 서비스 연결과 조회 */
    attach(next) {
      remote = next;
      refresh();
    },
    /** credentials 서비스 연결 해제. 진행 중이던 조회 결과는 무시 */
    detach() {
      remote = null;
      generation++;
      set({ available: false, configured: false, source: null });
    },
    /** 다른 곳에서 바뀐 키가 지금 저장 이름이면 다시 조회 */
    changed(name2) {
      if (name2 === ref) refresh();
    },
    /**
     * 키 값 저장 후 상태 다시 조회
     * @returns 저장했으면 true, 저장소가 없거나 거부했으면 false
     */
    async save(value) {
      if (!remote || !ref) return false;
      const response = await remote.set(ref, value);
      await refresh();
      return response?.ok !== false;
    }
  };
}
var sectionStyle = { display: "grid", gap: 10, borderTop: "1px solid rgba(127,127,127,.25)", paddingTop: 14 };
var fieldStyle = { display: "grid", gap: 4 };
var inputStyle = { width: "100%", boxSizing: "border-box" };
function TtsField({ label, hint, value, placeholder, disabled, multiline, type, min, max, step, commit }) {
  const shown = value ?? "";
  const [draft, setDraft] = import_react.default.useState(shown);
  const [error, setError] = import_react.default.useState("");
  import_react.default.useEffect(() => {
    setDraft(shown);
    setError("");
  }, [shown]);
  const save = async () => {
    if (draft === shown) return;
    const problem = await commit(draft);
    setError(problem || "");
  };
  const onKeyDown = (event) => {
    if (!multiline && event.key === "Enter") event.currentTarget.blur();
  };
  const input = import_react.default.createElement(multiline ? "textarea" : "input", {
    style: inputStyle,
    value: draft,
    placeholder,
    disabled,
    type: multiline ? void 0 : type || "text",
    rows: multiline ? 3 : void 0,
    min,
    max,
    step,
    spellCheck: false,
    /** 입력값을 초안에 반영 */
    onChange: (event) => setDraft(event.target.value),
    onBlur: save,
    onKeyDown
  });
  return import_react.default.createElement(
    "label",
    { style: fieldStyle },
    import_react.default.createElement("span", null, label),
    input,
    hint ? import_react.default.createElement("small", { style: { opacity: 0.7 } }, hint) : null,
    error ? import_react.default.createElement("small", { role: "alert" }, error) : null
  );
}
function parseJsonObject(text, ko) {
  const trimmed = text.trim();
  if (trimmed === "") return { value: {} };
  try {
    const value = JSON.parse(trimmed);
    if (value && typeof value === "object" && !Array.isArray(value)) return { value };
  } catch {
  }
  return { error: ko ? '{ "이름": 값 } 형식의 JSON 객체를 입력해 주세요.' : 'Enter a JSON object such as { "name": value }.' };
}
function TtsKeyField({ keys, ko, disabled }) {
  const key = import_react.default.useSyncExternalStore((fn) => keys.subscribe(fn), () => keys.getSnapshot(), () => keys.getSnapshot());
  const [draft, setDraft] = import_react.default.useState("");
  const [message, setMessage] = import_react.default.useState("");
  const t = (korean, english) => ko ? korean : english;
  const status = !key.available ? t("Harness 자격 증명 저장소에 연결되지 않았습니다.", "The Harness credential store is unavailable.") : key.configured ? t("저장됨", "Saved") + (key.source ? " (" + key.source + ")" : "") : t("저장된 키가 없습니다. 키 없이 쓰는 로컬 서버라면 비워 두세요.", "No key saved · leave empty for local servers that need none");
  const save = async () => {
    if (!draft.trim()) return;
    setMessage("");
    try {
      setMessage(await keys.save(draft.trim()) ? "" : t("키를 저장하지 못했습니다.", "Could not save the key."));
    } catch {
      setMessage(t("키를 저장하지 못했습니다.", "Could not save the key."));
    }
    setDraft("");
  };
  return import_react.default.createElement(
    "label",
    { style: fieldStyle },
    import_react.default.createElement("span", null, t("API 키", "API key")),
    import_react.default.createElement(
      "div",
      { style: { display: "flex", gap: 8, alignItems: "center" } },
      import_react.default.createElement("input", {
        type: "password",
        autoComplete: "off",
        style: { ...inputStyle, flex: "1 1 auto", minWidth: 0 },
        value: draft,
        disabled: disabled || !key.available || !keys.ref,
        placeholder: key.configured ? "••••••••" : "",
        /** 입력값을 초안에 반영 */
        onChange: (event) => setDraft(event.target.value)
      }),
      import_react.default.createElement("button", { type: "button", style: { flex: "0 0 auto", whiteSpace: "nowrap" }, disabled: disabled || !key.available || !draft.trim(), onClick: save }, t("저장", "Save"))
    ),
    import_react.default.createElement("small", { role: "status", style: { opacity: 0.7 } }, status),
    message ? import_react.default.createElement("small", { role: "alert" }, message) : null
  );
}
var VOICE_LINES = [
  ["reactions", "반응 (인사·시작·완료·오류)", "Reactions (greeting, start, done, error)"],
  ["status", "도구 사용 상태", "Tool status"],
  ["mutters", "혼잣말 (추론 요약이 섞일 수 있음)", "Mutters (may include reasoning summaries)"],
  ["others", "그 밖의 대사 (터치 반응 등)", "Other lines (touch reactions, …)"]
];
var groupStyle = { display: "grid", gap: 10, borderTop: "1px dashed rgba(127,127,127,.2)", paddingTop: 10 };
var groupTitleStyle = { fontSize: "0.85em", fontWeight: 600, opacity: 0.75 };
var toggleRow = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24 };
function ttsGroup(title, ...children) {
  return import_react.default.createElement(
    "div",
    { role: "group", "aria-label": title, style: groupStyle },
    import_react.default.createElement("span", { style: groupTitleStyle }, title),
    ...children
  );
}
function TtsSection({ form, keys, ko, writable, tts }) {
  const [error, setError] = import_react.default.useState("");
  const t = (korean, english) => ko ? korean : english;
  const settings = tts ?? {}, openai = settings.openai ?? {};
  const off = !writable || typeof form.mutate !== "function";
  const write = async (path, value) => {
    setError("");
    try {
      if (await form.mutate([{ op: "set", path: ["tts", ...path], value }])) return "";
    } catch {
    }
    const failed = t("설정을 저장하지 못했습니다.", "Could not save settings.");
    setError(failed);
    return failed;
  };
  const text = (path, label, extra = {}) => import_react.default.createElement(TtsField, {
    key: path.join("."),
    label,
    disabled: off,
    /** 앞뒤 공백을 지운 초안 저장 */
    commit: (draft) => write(path, draft.trim()),
    ...extra
  });
  const json = (path, label, value, placeholder, hint) => text(path, label, {
    multiline: true,
    placeholder,
    hint,
    value: value && Object.keys(value).length ? JSON.stringify(value, null, 2) : "",
    /** JSON 객체로 해석되면 저장, 아니면 안내 문구 */
    commit: (draft) => {
      const parsed = parseJsonObject(draft, ko);
      return parsed.error ? parsed.error : write(path, parsed.value);
    }
  });
  const number = (path, label, value, min, extra = {}) => text(path, label, {
    type: "number",
    min,
    max: extra.max,
    step: 1,
    value: value === void 0 ? "" : String(value),
    ...extra,
    /** 범위 안 정수면 저장, 아니면 안내 문구 */
    commit: (draft) => {
      const n = Number(draft);
      return Number.isInteger(n) && n >= min && n <= (extra.max ?? Infinity) ? write(path, n) : t(min + "~" + extra.max + " 범위의 정수를 입력해 주세요.", "Enter a whole number from " + min + " to " + extra.max + ".");
    }
  });
  const seconds = (path, label, ms) => text(path, label, {
    type: "number",
    min: 1,
    max: 600,
    step: 1e-3,
    value: ms === void 0 ? "" : String(ms / 1e3),
    /** 1~600초면 ms로 바꿔 저장, 아니면 안내 문구 */
    commit: (draft) => {
      const n = Number(draft);
      return Number.isFinite(n) && n >= 1 && n <= 600 ? write(path, Math.round(n * 1e3)) : t("1~600초 사이의 값을 입력해 주세요.", "Enter 1 to 600 seconds.");
    }
  });
  const check = (path, label, checked) => import_react.default.createElement(
    "label",
    { key: path.join("."), style: toggleRow },
    import_react.default.createElement("span", null, label),
    import_react.default.createElement("input", {
      type: "checkbox",
      checked,
      disabled: off,
      /** 확인 상태 저장 */
      onChange: (event) => write(path, event.target.checked)
    })
  );
  const serverDefault = t("비워 두면 서버 기본값 사용", "Empty = server default");
  return import_react.default.createElement(
    "section",
    { "aria-label": t("말풍선 음성", "Speech bubble voice"), style: sectionStyle },
    import_react.default.createElement(
      "div",
      { style: toggleRow },
      import_react.default.createElement("strong", null, t("말풍선 음성", "Speech bubble voice")),
      import_react.default.createElement("input", {
        type: "checkbox",
        "aria-label": t("말풍선을 소리 내어 읽기", "Read speech bubbles aloud"),
        checked: settings.enabled === true,
        disabled: off,
        /** 음성 켜기·끄기 저장 */
        onChange: (event) => write(["enabled"], event.target.checked)
      })
    ),
    settings.enabled === true && !openai.baseUrl ? import_react.default.createElement("p", { role: "status", style: { margin: 0 } }, t("음성을 들으려면 API 주소를 입력해 주세요.", "Enter an API address to hear speech.")) : null,
    ttsGroup(
      t("연결", "Connection"),
      text(["openai", "baseUrl"], t("API 주소", "API address"), { value: openai.baseUrl, placeholder: "https://api.openai.com/v1", hint: t("/v1까지 포함한 주소를 입력합니다 (OpenAI 호환 TTS).", "Up to /v1 (OpenAI-compatible TTS)") }),
      import_react.default.createElement(TtsKeyField, { key: "key", keys, ko, disabled: off })
    ),
    ttsGroup(
      t("목소리", "Voice"),
      text(["openai", "model"], t("모델", "Model"), { value: openai.model, placeholder: serverDefault }),
      text(["openai", "voice"], t("목소리 ID", "Voice ID"), { value: openai.voice, placeholder: serverDefault }),
      number(["stream", "pcmSampleRate"], t("샘플레이트 (Hz)", "Sample rate (Hz)"), settings.stream?.pcmSampleRate, 8e3, { max: 48e3, hint: t("서버가 보내는 오디오와 샘플레이트가 같아야 합니다 (OpenAI 24000 · Fish 44100).", "Must match the audio the server sends (OpenAI 24000 · Fish 44100)") })
    ),
    ttsGroup(
      t("읽을 대사", "Lines to read"),
      ...VOICE_LINES.map(([field, koLabel, enLabel]) => check(["voiceLines", field], ko ? koLabel : enLabel, settings.voiceLines?.[field] === true))
    ),
    import_react.default.createElement(
      "details",
      { style: groupStyle },
      import_react.default.createElement("summary", { style: groupTitleStyle }, t("고급", "Advanced")),
      import_react.default.createElement(
        "div",
        { style: { display: "grid", gap: 10, paddingTop: 4 } },
        json(
          ["openai", "extraBody"],
          t("추가 요청 값 (JSON)", "Extra request values (JSON)"),
          openai.extraBody,
          '{ "speed": 1.1 }',
          t("요청 본문에 추가할 값입니다. input·response_format·stream_format은 플러그인이 지정하며 모델과 목소리는 위에 입력한 ID를 우선합니다.", "Merged into the request body. The plugin sets input, response_format and stream_format; the model and voice ID above win.")
        ),
        json(["openai", "headers"], t("추가 헤더 (JSON)", "Extra headers (JSON)"), openai.headers, '{ "X-Example": "value" }'),
        text(["openai", "textPrefix"], t("대사 앞 문구", "Line prefix"), { value: openai.textPrefix, placeholder: "[밝고 장난스럽게] ", hint: t("모든 대사 앞에 붙일 문구입니다 (예: Drama 3 연기 지시).", "Prepended to every line (e.g. Drama 3 directions)") }),
        seconds(["openai", "timeoutMs"], t("응답 대기 시간 (초)", "Response timeout (seconds)"), openai.timeoutMs),
        check(["cache", "enabled"], t("같은 대사의 음성 재사용 (캐시)", "Reuse audio for repeated lines (cache)"), settings.cache?.enabled !== false),
        text(["openai", "apiKeyEnv"], t("API 키 저장 이름", "API key name"), { value: openai.apiKeyEnv ?? DEFAULT_KEY_REF, hint: t("저장된 키를 먼저 쓰고, 없으면 같은 이름의 환경변수를 씁니다. 비우면 인증 없이 요청합니다.", "A saved key is used first, then the environment variable of the same name. Empty sends no authorization.") })
      )
    ),
    import_react.default.createElement("p", { style: { margin: 0, opacity: 0.7 } }, t("AI로 만든 음성을 사용합니다. 이 기능을 켜면 대사가 위 주소로 전송되며 서비스에 따라 요금이 청구될 수 있습니다.", "This is an AI-generated voice. When on, lines are sent to the address above, and the service may charge for them.")),
    error ? import_react.default.createElement("p", { role: "alert" }, error) : null
  );
}
function updateSection(updater, ko) {
  const snapshot = updater.getSnapshot();
  const t = (korean, english) => ko ? korean : english;
  const versions = [snapshot.current && t("현재 " + snapshot.current, "Installed " + snapshot.current), snapshot.latest && t("최신 " + snapshot.latest, "Latest " + snapshot.latest)].filter(Boolean).join(" · ");
  const text = {
    unavailable: t("Harness 플러그인 관리자에 연결되지 않아 업데이트를 확인할 수 없습니다.", "Plugin manager is unavailable, so updates cannot be checked."),
    checking: t("업데이트 확인 중…", "Checking for updates…"),
    current: t("최신 버전입니다.", "You are up to date."),
    available: t("새 버전이 있습니다.", "A new version is available."),
    confirm: t(
      "업데이트 중에는 플러그인이 잠시 꺼집니다. 새 버전이 켜져도 설정은 유지됩니다. 실패하면 Plugins → + Add plugin에서 같은 GitHub 주소로 다시 추가해 주세요.",
      "The plugin turns off briefly and comes back as the new version. Settings are kept. If it fails, add the same GitHub address again from Plugins → + Add plugin."
    ),
    updating: t("업데이트 중입니다. 창을 닫지 마세요.", "Updating… keep this window open."),
    updated: t("업데이트했습니다." + (snapshot.from ? " (" + snapshot.from + " → " + (snapshot.current || snapshot.latest) + ")" : ""), "Updated." + (snapshot.from ? " (" + snapshot.from + " → " + (snapshot.current || snapshot.latest) + ")" : "")),
    restart: t("업데이트했습니다. Harness를 다시 시작하면 새 버전이 적용됩니다.", "Updated. Restart Harness to use the new version."),
    unsupported: t("GitHub 주소로 설치한 경우에만 여기서 업데이트할 수 있습니다.", "Updates here work only for plugins installed from a GitHub address."),
    pinned: t("특정 커밋으로 고정한 설치는 여기서 업데이트할 수 없습니다.", "This install is pinned to a commit, so it is not updated here."),
    "check-failed": t("업데이트를 확인하지 못했습니다.", "Could not check for updates."),
    "update-failed": t("업데이트하지 못했습니다.", "Update failed.")
  }[snapshot.phase] ?? "";
  const busy = snapshot.phase === "checking" || snapshot.phase === "updating";
  const button = (label, onClick, disabled) => import_react.default.createElement("button", { type: "button", onClick, disabled }, label);
  return import_react.default.createElement(
    "section",
    { "aria-label": t("업데이트", "Updates"), style: { display: "grid", gap: 8, paddingTop: 12, borderTop: "1px solid #8881" } },
    import_react.default.createElement("strong", null, t("업데이트", "Updates")),
    versions ? import_react.default.createElement("span", { style: { opacity: 0.7 } }, versions) : null,
    import_react.default.createElement("p", { role: "status", style: { margin: 0 } }, text, snapshot.error ? " (" + snapshot.error + ")" : ""),
    import_react.default.createElement(
      "div",
      { style: { display: "flex", gap: 8 } },
      snapshot.phase === "available" ? button(t("업데이트", "Update"), () => updater.update(), busy) : null,
      snapshot.phase === "confirm" ? button(t("계속", "Continue"), () => updater.confirm(), false) : null,
      snapshot.phase === "confirm" ? button(t("취소", "Cancel"), () => updater.cancel(), false) : null,
      !["unavailable", "updated", "restart", "confirm", "updating"].includes(snapshot.phase) ? button(t("다시 확인", "Check again"), () => updater.check(), busy) : null
    )
  );
}
function ShortcutField({ label, control, hintId, hint, value, placeholder, ariaLabel, ko, disabled, inactive, onChange }) {
  const [recording, setRecording] = import_react.default.useState(false);
  const [held, setHeld] = import_react.default.useState("");
  const capture = (event) => {
    const action = shortcutKeyDown(event);
    const stop = () => {
      setRecording(false);
      setHeld("");
    };
    if (action.action === "leave") {
      stop();
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    const target = event.currentTarget;
    if (action.action === "cancel") {
      stop();
      target.blur();
      return;
    }
    if (action.action === "clear") {
      stop();
      void onChange("");
      target.blur();
      return;
    }
    if (action.action === "wait") {
      setHeld(action.held);
      return;
    }
    stop();
    void onChange(action.combo);
    target.blur();
  };
  return import_react.default.createElement(
    import_react.default.Fragment,
    null,
    import_react.default.createElement(
      control ? "div" : "label",
      { style: { display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 24, rowGap: 8 } },
      import_react.default.createElement("span", { style: { opacity: inactive ? 0.55 : 1 } }, label),
      import_react.default.createElement(
        "span",
        { style: { display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" } },
        control ?? null,
        import_react.default.createElement("input", {
          type: "text",
          readOnly: true,
          "aria-label": ariaLabel,
          "aria-describedby": hintId,
          placeholder: recording ? ko ? "키를 누르세요…" : "Press keys…" : placeholder,
          style: { width: 150, cursor: disabled ? "default" : "pointer", textAlign: "center", borderColor: recording ? "#7aa7ff" : void 0, opacity: inactive ? 0.45 : 1 },
          value: recording ? held : value ?? "",
          disabled,
          /** 칸에 들어오면 녹음 시작 (비활성이면 무시) */
          onFocus: () => {
            if (disabled) return;
            setRecording(true);
            setHeld("");
          },
          /** 칸을 벗어나면 녹음 끝 */
          onBlur: () => {
            setRecording(false);
            setHeld("");
          },
          onKeyDown: capture
        })
      )
    ),
    hint ? import_react.default.createElement("p", { id: hintId, style: { margin: 0, opacity: inactive ? 0.45 : 0.7 } }, hint) : null
  );
}
function DragKeyField({ label, hintId, hint, value, ariaLabel, ko, disabled, inactive, onChange }) {
  const [recording, setRecording] = import_react.default.useState(false);
  const [held, setHeld] = import_react.default.useState("");
  const stop = () => {
    setRecording(false);
    setHeld("");
  };
  const capture = (event) => {
    const action = dragKeyDown(event);
    if (action.action === "leave") {
      stop();
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    const target = event.currentTarget;
    if (action.action === "cancel") {
      stop();
      target.blur();
      return;
    }
    if (action.action === "clear") {
      stop();
      void onChange("");
      target.blur();
      return;
    }
    if (action.action === "wait") {
      setHeld(action.held);
      return;
    }
    stop();
    void onChange(action.key);
    target.blur();
  };
  const release = (event) => {
    const modifier = MODIFIER_LABELS.get(event.key);
    if (!modifier || !recording) return;
    stop();
    void onChange(modifier);
    event.currentTarget.blur();
  };
  return import_react.default.createElement(
    import_react.default.Fragment,
    null,
    import_react.default.createElement(
      "label",
      { style: { display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 24, rowGap: 8 } },
      import_react.default.createElement("span", { style: { opacity: inactive ? 0.55 : 1 } }, label),
      import_react.default.createElement("input", {
        type: "text",
        readOnly: true,
        "aria-label": ariaLabel,
        "aria-describedby": hintId,
        placeholder: recording ? ko ? "키를 누르세요…" : "Press a key…" : "",
        style: { width: 150, cursor: disabled ? "default" : "pointer", textAlign: "center", borderColor: recording ? "#7aa7ff" : void 0, opacity: inactive ? 0.45 : 1 },
        value: recording ? held : value ?? "",
        disabled,
        /** 칸에 들어오면 녹음 시작 (비활성이면 무시) */
        onFocus: () => {
          if (disabled) return;
          setRecording(true);
          setHeld("");
        },
        /** 칸을 벗어나면 녹음 끝 */
        onBlur: () => {
          setRecording(false);
          setHeld("");
        },
        onKeyDown: capture,
        onKeyUp: release
      })
    ),
    import_react.default.createElement("p", { id: hintId, style: { margin: 0, opacity: inactive ? 0.45 : 0.7 } }, hint)
  );
}
function CanvasHiddenNotice({ ko, link }) {
  const read = () => link.character?.canvasHidden() === true;
  const [hidden, setHidden] = import_react.default.useState(read);
  import_react.default.useEffect(() => {
    const id = setInterval(() => setHidden(read()), 600);
    return () => clearInterval(id);
  }, []);
  if (!hidden) return null;
  return import_react.default.createElement(
    "div",
    { role: "status", style: { display: "flex", alignItems: "center", flexWrap: "wrap", gap: 10, opacity: 0.9 } },
    import_react.default.createElement("span", null, ko ? "캐릭터 설정은 켜져 있지만 화면에서는 잠시 숨겨져 있습니다." : "The canvas is hidden right now (the character setting is still on)."),
    import_react.default.createElement(
      "button",
      {
        type: "button",
        /** 캔버스 다시 표시 */
        onClick: () => {
          try {
            link.character?.toggleCanvas?.();
          } catch {
          }
          setHidden(false);
        }
      },
      ko ? "다시 표시" : "Show again"
    )
  );
}
function settingsPage(ctx, form, updater, keys, link) {
  return function FeatureSettings({ view }) {
    const state = import_react.default.useSyncExternalStore((fn) => form.subscribe(fn), () => form.getSnapshot(), () => form.getSnapshot());
    const locale = import_react.default.useSyncExternalStore((fn) => ctx.locale.subscribe(fn), () => ctx.locale.getLocale(), () => ctx.locale.getLocale());
    import_react.default.useSyncExternalStore((fn) => updater.subscribe(fn), () => updater.getSnapshot(), () => updater.getSnapshot());
    const [error, setError] = import_react.default.useState("");
    const [pending, setPending] = import_react.default.useState(false);
    const ko = locale.active.toLowerCase().startsWith("ko");
    if (view === "summary") return import_react.default.createElement("span", null, ko ? "캐릭터 · 테마 · 한국어" : "Character · Theme · Korean");
    if (state.status !== "ready") return import_react.default.createElement("p", { role: "status" }, ko ? "설정을 불러오는 중입니다." : "Loading settings…");
    const fields = [
      ["character", ko ? "캐릭터와 말풍선" : "Character and speech bubbles"],
      ["mobileCharacter", ko ? "모바일에서도 캐릭터 표시" : "Show character on mobile"],
      ["intro", ko ? "시작할 때 등장 연출" : "Intro on startup"],
      ["appIcon", ko ? "앱 아이콘 (Windows·macOS)" : "App icon (Windows, macOS)"],
      ["theme", ko ? "파스텔 테마" : "Pastel theme"],
      ["translation", ko ? "한국어 언어팩" : "Korean language pack"]
    ];
    const change = async (field, checked) => {
      const current = form.getSnapshot();
      if (current.status !== "ready" || !current.writable) return;
      setError("");
      setPending(true);
      try {
        if (!await form.set(field, checked)) setError(ko ? "설정을 저장하지 못했습니다." : "Could not save settings.");
      } catch {
        setError(ko ? "설정을 저장하지 못했습니다." : "Could not save settings.");
      } finally {
        setPending(false);
      }
    };
    const row = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24 };
    const off = !state.writable || pending;
    const outfitSwitch = ([field, label]) => import_react.default.createElement(
      "label",
      { key: field, style: row },
      import_react.default.createElement("span", null, label),
      import_react.default.createElement("input", {
        type: "checkbox",
        checked: state.value?.[field] === true,
        disabled: off,
        /** 켜짐 여부 저장 */
        onChange: (event) => change(field, event.target.checked)
      })
    );
    const bodyType = state.value?.bodyType || "default";
    const shortcutValue = state.value?.characterToggleKey ?? "Ctrl+Shift+D";
    const petShortcutValue = state.value?.petToggleKey ?? "Ctrl+Shift+P";
    const characterOn = state.value?.character !== false;
    const canvasToggle = state.value?.canvasToggle === true;
    const canvasKeyValue = state.value?.canvasToggleKey ?? "Ctrl+Shift+H";
    const dragKey = state.value?.dragKey ?? "Alt";
    return import_react.default.createElement(
      "div",
      { style: { display: "grid", gap: 16 } },
      ...fields.map(([field, label]) => import_react.default.createElement(
        "label",
        { key: field, style: row },
        import_react.default.createElement("span", null, label),
        import_react.default.createElement("input", {
          type: "checkbox",
          role: "switch",
          checked: state.value?.[field] !== false,
          disabled: off,
          /** 켜짐 여부 저장 */
          onChange: (event) => change(field, event.target.checked)
        })
      )),
      import_react.default.createElement(
        "label",
        { style: row },
        import_react.default.createElement("span", null, ko ? "대사 ex" : "Extra dialogue"),
        import_react.default.createElement("input", {
          type: "checkbox",
          role: "switch",
          checked: state.value?.extraLines === true,
          disabled: off,
          /** 켜짐 여부 저장 */
          onChange: (event) => change("extraLines", event.target.checked)
        })
      ),
      import_react.default.createElement("p", { style: { opacity: 0.7 } }, ko ? "설정은 바꾸는 즉시 저장되고 적용됩니다. 화면 언어는 설정 → 일반 설정 → 언어에서 한국어로 바꿀 수 있습니다." : "Changes apply and save immediately. Select Korean under Settings → General → Language."),
      import_react.default.createElement(
        "section",
        { "aria-label": ko ? "소품·옷" : "Accessories and outfit", style: { display: "grid", gap: 10, borderTop: "1px solid rgba(127,127,127,.25)", paddingTop: 14 } },
        import_react.default.createElement("strong", null, ko ? "소품·옷" : "Accessories and outfit"),
        ...OUTFIT_FIELDS.map(([field, koLabel, enLabel]) => outfitSwitch([field, ko ? koLabel : enLabel]))
      ),
      import_react.default.createElement(
        "section",
        { "aria-label": ko ? "체형" : "Body type", style: { display: "grid", gap: 10, borderTop: "1px solid rgba(127,127,127,.25)", paddingTop: 14 } },
        import_react.default.createElement("strong", null, ko ? "체형" : "Body type"),
        ...BODY_TYPES2.map(([value, koLabel, enLabel]) => import_react.default.createElement(
          "label",
          { key: value, style: { display: "flex", alignItems: "center", gap: 10 } },
          import_react.default.createElement("input", {
            type: "radio",
            name: "deepseek-harness-kr-body",
            checked: bodyType === value,
            disabled: off,
            /** 고른 체형 저장 */
            onChange: () => change("bodyType", value)
          }),
          import_react.default.createElement("span", null, ko ? koLabel : enLabel)
        ))
      ),
      import_react.default.createElement(
        "section",
        { "aria-label": ko ? "절전" : "Power saving", style: { display: "grid", gap: 10, borderTop: "1px solid rgba(127,127,127,.25)", paddingTop: 14 } },
        import_react.default.createElement("strong", null, ko ? "절전" : "Power saving"),
        import_react.default.createElement(
          "label",
          { style: row },
          import_react.default.createElement("span", null, ko ? "입력이 없으면 잠시 쉬기 (화면 밖으로 나가 그리기 중단)" : "Rest when idle (leaves the screen and stops rendering)"),
          import_react.default.createElement("input", {
            type: "checkbox",
            role: "switch",
            checked: state.value?.idleSleep !== false,
            disabled: off,
            /** 절전 켜짐 여부 저장 */
            onChange: (event) => change("idleSleep", event.target.checked)
          })
        ),
        import_react.default.createElement(
          "label",
          { style: row },
          import_react.default.createElement("span", null, ko ? "쉬기 전 대기 시간 (분)" : "Idle minutes before resting"),
          import_react.default.createElement("input", {
            type: "number",
            min: 0.5,
            max: 60,
            step: 0.5,
            style: { width: 90 },
            value: sleepMinutes(state.value?.idleSleepMinutes),
            disabled: off,
            /** 대기 시간(분)을 범위 안으로 정리해 저장 */
            onChange: (event) => change("idleSleepMinutes", sleepMinutes(event.target.value))
          })
        )
      ),
      import_react.default.createElement(
        "section",
        { "aria-label": ko ? "3D 모델 (실험)" : "3D model (experimental)", style: { display: "grid", gap: 10, borderTop: "1px solid rgba(127,127,127,.25)", paddingTop: 14 } },
        import_react.default.createElement("strong", null, ko ? "3D 모델 (실험)" : "3D model (experimental)"),
        import_react.default.createElement("p", { style: { margin: 0, opacity: 0.7 } }, ko ? "avatar.json과 모델 파일이 있는 폴더를 지정하면 캐릭터를 3D로 표시합니다. 바깥 펫 창에도 적용됩니다. 비워 두면 기본 캐릭터를 사용합니다. 화면을 새로 불러오면 적용됩니다." : "Set a folder with avatar.json and the model to draw the character in 3D (including the outside pet window). Empty uses the default character. Applies on reload."),
        import_react.default.createElement(
          "label",
          { style: row },
          import_react.default.createElement("span", null, ko ? "모델 폴더" : "Model folder"),
          import_react.default.createElement("input", {
            type: "text",
            style: { flex: 1, maxWidth: 360 },
            defaultValue: state.value?.avatarModelDir ?? "",
            placeholder: "D:\\models\\avatar",
            disabled: off,
            /** 입력을 마치면 폴더 경로 저장 */
            onBlur: (event) => {
              if (event.target.value !== (state.value?.avatarModelDir ?? "")) change("avatarModelDir", event.target.value.trim());
            }
          })
        ),
        import_react.default.createElement(
          "label",
          { style: row },
          import_react.default.createElement("span", null, ko ? "외곽선 법선" : "Outline normals"),
          import_react.default.createElement(
            "select",
            {
              value: state.value?.avatarOutline === "model" ? "model" : "smooth",
              disabled: off,
              /** 고른 외곽선 법선 저장 */
              onChange: (event) => change("avatarOutline", event.target.value)
            },
            import_react.default.createElement("option", { value: "smooth" }, ko ? "매끄러운 법선 (기본)" : "Smoothed normals (default)"),
            import_react.default.createElement("option", { value: "model" }, ko ? "모델 제공 외곽선" : "Model-provided outline")
          )
        ),
        import_react.default.createElement(
          "label",
          { style: row },
          import_react.default.createElement("span", null, ko ? "눈썹 움직임 세기 (배, 0~2)" : "Eyebrow motion strength (x, 0-2)"),
          import_react.default.createElement("input", {
            type: "number",
            min: 0,
            max: 2,
            step: 0.05,
            style: { width: 90 },
            value: browScale(state.value?.avatarBrowScale),
            disabled: off,
            /** 눈썹 세기를 범위 안으로 정리해 저장 */
            onChange: (event) => change("avatarBrowScale", browScale(event.target.value))
          })
        ),
        import_react.default.createElement(
          "label",
          { style: row },
          import_react.default.createElement("span", null, ko ? "눈썹 움직임 부드럽게 (ms, 0~300)" : "Eyebrow motion smoothing (ms, 0-300)"),
          import_react.default.createElement("input", {
            type: "number",
            min: 0,
            max: 300,
            step: 10,
            style: { width: 90 },
            value: browSmoothMs(state.value?.avatarBrowSmooth),
            disabled: off,
            /** 눈썹 부드러움 시간을 범위 안으로 정리해 저장 */
            onChange: (event) => change("avatarBrowSmooth", browSmoothMs(event.target.value))
          })
        ),
        import_react.default.createElement(
          "label",
          { style: row },
          import_react.default.createElement("span", null, ko ? "앰비언트 오클루전 (없으면 자동으로 생성)" : "Ambient occlusion (generated if the model has none)"),
          import_react.default.createElement("input", {
            type: "checkbox",
            checked: state.value?.avatarAo === true,
            disabled: off,
            /** AO 굽기 켜짐 여부 저장 */
            onChange: (event) => change("avatarAo", event.target.checked)
          })
        ),
        import_react.default.createElement(
          "label",
          { style: row },
          import_react.default.createElement("span", null, ko ? "앰비언트 오클루전 세기 (0~1)" : "Ambient occlusion strength (0-1)"),
          import_react.default.createElement("input", {
            type: "number",
            min: 0,
            max: 1,
            step: 0.05,
            style: { width: 90 },
            value: aoStrength(state.value?.avatarAoStrength),
            disabled: off,
            /** AO 세기를 범위 안으로 정리해 저장 */
            onChange: (event) => change("avatarAoStrength", aoStrength(event.target.value))
          })
        )
      ),
      import_react.default.createElement(
        "section",
        { "aria-label": ko ? "캐릭터와 말풍선 단축키" : "Shortcuts - Character and speech bubbles", style: { display: "grid", gap: 10, borderTop: "1px solid rgba(127,127,127,.25)", paddingTop: 14 } },
        import_react.default.createElement("strong", null, ko ? "캐릭터와 말풍선 단축키" : "Shortcuts - Character and speech bubbles"),
        import_react.default.createElement(
          "p",
          { id: SHORTCUT_HINT_ID, style: { margin: 0, opacity: 0.7 } },
          ko ? "입력 칸을 누른 뒤 원하는 키 조합을 누르세요. Esc로 취소하고 Backspace로 지웁니다." : "Click the field, then press the keys you want. Esc cancels, Backspace clears."
        ),
        import_react.default.createElement(ShortcutField, {
          label: ko ? "캐릭터와 말풍선 켜기·끄기 단축키 (비우면 사용 안 함)" : "Character and speech bubbles setting toggle shortcut (empty to disable)",
          hintId: characterOn ? SHORTCUT_HINT_ID : SHORTCUT_HINT_ID + "-off",
          // 꺼짐 안내는 별도 id (문서에 같은 id 두 개 금지)
          hint: characterOn ? "" : ko ? "캐릭터와 말풍선이 꺼져 있어도 이 단축키로 다시 켤 수 있습니다." : "This shortcut still turns the character back on while it is off.",
          value: shortcutValue,
          placeholder: "Ctrl+Shift+D",
          ariaLabel: ko ? "캐릭터와 말풍선 켜기·끄기 단축키 입력" : "Record character and speech bubbles toggle shortcut",
          ko,
          disabled: off,
          /** 녹음한 캐릭터 토글 단축키 저장 */
          onChange: (combo) => change("characterToggleKey", combo)
        }),
        import_react.default.createElement(DragKeyField, {
          label: ko ? "캐릭터 이동 키 (누른 채 끌기)" : "Move character key (hold while dragging)",
          hintId: DRAG_HINT_ID,
          hint: !characterOn ? ko ? "캐릭터와 말풍선이 꺼져 있을 때는 사용할 수 없습니다." : "Unavailable while the character and speech bubbles are off." : ko ? "캐릭터를 끌어 옮기는 동안 누를 키를 지정합니다. 수식 키(Alt·Ctrl·Shift·Cmd)나 일반 키 중 하나를 등록하세요. 비워 두면 마우스 왼쪽·오른쪽 버튼을 함께 누른 채 끌어 옮깁니다." : "Hold this key while dragging to move the character. Record one modifier (Alt, Ctrl, Shift, Cmd) or one other key. Empty needs both buttons.",
          value: dragKey,
          ariaLabel: ko ? "캐릭터 이동 키 입력" : "Record drag key",
          ko,
          disabled: off || !characterOn,
          inactive: !characterOn,
          /** 녹음한 이동 키 저장 */
          onChange: (key) => change("dragKey", key)
        }),
        // 캔버스만 숨김/표시: 캐릭터 설정을 끄는 것이 아니라 그리기만 멈춘다. 스위치를 단축키 칸 바로 왼쪽에 둔다.
        import_react.default.createElement(ShortcutField, {
          label: ko ? "캔버스만 숨김/표시 단축키 (비우면 사용 안 함)" : "Hide/show canvas shortcut (empty to disable)",
          control: import_react.default.createElement("input", {
            type: "checkbox",
            role: "switch",
            "aria-label": ko ? "캔버스만 숨김/표시 사용" : "Enable canvas hide/show",
            checked: canvasToggle,
            disabled: off || !characterOn,
            /** 캔버스 숨김 단축키 사용 여부 저장 */
            onChange: (event) => change("canvasToggle", event.target.checked)
          }),
          hintId: CANVAS_HINT_ID,
          hint: !characterOn ? ko ? "캐릭터와 말풍선이 꺼져 있을 때는 사용할 수 없습니다. 캐릭터를 켜면 다시 쓸 수 있습니다." : "Unavailable while the character and speech bubbles are off. Turn the character on to use it again." : ko ? "왼쪽 스위치로 이 단축키의 사용 여부를 정합니다. 단축키를 누르면 캐릭터 설정은 켜 둔 채 캔버스만 숨기거나 다시 표시합니다. 숨겨진 동안에는 그리기만 멈춥니다." : "The switch enables this shortcut. The shortcut does not turn the character or speech-bubble setting off; it only hides and shows the canvas by pausing drawing.",
          value: canvasKeyValue,
          placeholder: "Ctrl+Shift+H",
          ariaLabel: ko ? "캔버스 숨김/표시 단축키 입력" : "Record canvas hide/show shortcut",
          ko,
          disabled: off || !canvasToggle || !characterOn,
          inactive: !canvasToggle || !characterOn,
          /** 녹음한 캔버스 숨김 단축키 저장 */
          onChange: (combo) => change("canvasToggleKey", combo)
        }),
        import_react.default.createElement(CanvasHiddenNotice, { ko, link }),
        import_react.default.createElement(ShortcutField, {
          label: ko ? "펫 창 내보내기·돌아오기 단축키 (비우면 사용 안 함)" : "Pet window shortcut (empty to disable)",
          hintId: PET_SHORTCUT_HINT_ID,
          hint: !characterOn ? ko ? "캐릭터와 말풍선이 꺼져 있을 때는 사용할 수 없습니다." : "Unavailable while the character and speech bubbles are off." : ko ? "캐릭터를 바깥 펫 창으로 내보내고 다시 불러옵니다." : "Moves the character out to the pet window and back.",
          value: petShortcutValue,
          placeholder: "Ctrl+Shift+P",
          ariaLabel: ko ? "펫 창 단축키 입력" : "Record pet window shortcut",
          ko,
          disabled: off || !characterOn,
          inactive: !characterOn,
          /** 녹음한 펫 창 단축키 저장 */
          onChange: (combo) => change("petToggleKey", combo)
        })
      ),
      error ? import_react.default.createElement("p", { role: "alert" }, error) : null,
      import_react.default.createElement(TtsSection, { form, keys, ko, writable: state.writable, tts: state.value?.tts }),
      updateSection(updater, ko)
    );
  };
}
var HOST_STATUS_DELAY_MS = 15e3;
async function reportHostStatus(fetchImpl = (...args) => window.fetch(...args)) {
  try {
    const response = await fetchImpl("/deepseek-harness-kr/status", { cache: "no-store" });
    if (!response.ok) {
      log.debug("호스트 상태 조회 실패: HTTP", response.status);
      return;
    }
    const status = await response.json();
    const problem = status?.appIcon;
    if (problem) log.warnOnce("app-icon:" + problem.reason + ":" + (problem.message ?? ""), "앱 아이콘 적용 실패:", problem.reason, problem.message ?? "");
  } catch (error) {
    log.debug("호스트 상태 조회 실패:", error?.message ?? error);
  }
}
function apply2(ctx) {
  window[SLOT]?.();
  const life = createLifetime();
  const features = /* @__PURE__ */ new Map();
  const reconcile = (name2, enabled, mount) => {
    if (enabled === features.has(name2)) return;
    if (!enabled) {
      features.get(name2).dispose();
      features.delete(name2);
      return;
    }
    const feature = createLifetime();
    features.set(name2, feature);
    try {
      mount(feature);
    } catch (error) {
      feature.dispose();
      features.delete(name2);
      throw error;
    }
  };
  life.add(() => {
    for (const feature of [...features.values()].reverse()) feature.dispose();
    features.clear();
  });
  const dispose = () => {
    if (window[SLOT] !== dispose) return;
    life.dispose();
    delete window[SLOT];
  };
  window[SLOT] = dispose;
  ctx.effect(() => dispose, "deepseek-harness-kr: client");
  try {
    const form = ctx.configForms.get(ENTRY_ID);
    const updater = createUpdater();
    const keys = createKeyStore();
    const link = createCharacterLink();
    links.set(ctx, link);
    const PET_CONFIG_KEYS = /* @__PURE__ */ new Set([...OUTFIT_FIELDS.map(([field]) => field), "bodyType", "character"]);
    const applyPetConfig = (key, value) => {
      if (typeof key !== "string" || !PET_CONFIG_KEYS.has(key)) return;
      const next = key === "bodyType" ? BODY_TYPES2.some(([type]) => type === value) ? value : null : typeof value === "boolean" ? value : null;
      if (next === null) return;
      try {
        const result = form.set(key, next);
        if (result && typeof result.catch === "function") result.catch(() => {
        });
      } catch {
      }
    };
    let panelOwner = null;
    if (typeof ctx.inject === "function") {
      ctx.inject(["layout"], (scope) => {
        const panelInfo = scope.layout?.panelInfo;
        if (!panelInfo || typeof panelInfo.getSnapshot !== "function" || typeof panelInfo.subscribe !== "function") return;
        const owner = {};
        panelOwner = owner;
        const syncPanelVisibility = () => {
          if (panelOwner !== owner) return;
          link.setPageHidden(panelHidesInWindowCharacter(panelInfo.getSnapshot()?.activePanelId));
        };
        syncPanelVisibility();
        const off = panelInfo.subscribe(syncPanelVisibility);
        scope.effect(() => () => {
          off?.();
          if (panelOwner !== owner) return;
          panelOwner = null;
          link.setPageHidden(false);
        }, "deepseek-harness-kr: in-window character visibility");
      });
    }
    if (typeof ctx.inject === "function") {
      ctx.inject(["remote", "remote.pluginManager"], (scope) => {
        updater.attach(scope.remote.pluginManager);
        scope.effect(() => () => updater.detach(), "deepseek-harness-kr: updater");
      });
      ctx.inject(["remote", "remote.credentials"], (scope) => {
        keys.attach(scope.remote.credentials);
        const off = typeof scope.remote.$on === "function" ? scope.remote.$on("credentials/reference-updated", (ref) => keys.changed(ref)) : null;
        scope.effect(() => () => {
          off?.();
          keys.detach();
        }, "deepseek-harness-kr: voice key");
      });
    }
    life.add(() => updater.detach());
    life.add(() => keys.detach());
    let ttsKey = null;
    const syncTts = (value) => {
      const next = ttsSignature(value);
      if (next === ttsKey) return;
      ttsKey = next;
      reconcile("tts", false);
      if (next !== null) reconcile("tts", true, mountTts);
    };
    const sync = () => {
      const snapshot = form.getSnapshot();
      if (snapshot.status !== "ready") return;
      const value = snapshot.value ?? {};
      reconcile("translation", value.translation !== false, (feature) => mountTranslation(ctx, feature));
      reconcile("layout", value.character !== false || value.theme !== false, mountLayout);
      reconcile("theme", value.theme !== false, (feature) => mountTheme(ctx, feature));
      link.setPrefs(characterPrefs(value));
      reconcile("character", value.character !== false, (feature) => startCharacter(feature, link, applyPetConfig));
      keys.setRef(value.tts?.openai?.apiKeyEnv ?? DEFAULT_KEY_REF);
      syncTts(value);
      if (value.canvasToggle !== true && link.character?.canvasHidden() === true) link.character.toggleCanvas?.();
    };
    life.add(form.subscribe(sync));
    life.timeout(() => {
      void reportHostStatus();
    }, HOST_STATUS_DELAY_MS);
    let lastToggleAt = -Infinity, togglePending = false;
    const toggleListener = async (event) => {
      if (event.repeat) return;
      const snapshot = form.getSnapshot();
      const combo = snapshot.value?.characterToggleKey ?? "Ctrl+Shift+D";
      if (!parseShortcut(combo)) return;
      const el = event.target;
      if (el && (el.isContentEditable || /^(input|textarea|select)$/i.test(el.tagName))) return;
      if (!matchesShortcut(combo, event)) return;
      event.preventDefault();
      if (togglePending || snapshot.status !== "ready" || !snapshot.writable) return;
      const now = Number(event.timeStamp) || performance.now();
      if (now - lastToggleAt < 150) return;
      lastToggleAt = now;
      togglePending = true;
      try {
        if (!await form.set("character", snapshot.value?.character === false)) console.warn("캐릭터 설정 저장 실패");
      } catch {
        console.warn("캐릭터 설정 저장 실패");
      } finally {
        togglePending = false;
      }
    };
    life.listen(window, "keydown", toggleListener);
    let lastPetToggleAt = -Infinity;
    const petToggleListener = (event) => {
      if (event.repeat) return;
      const snapshot = form.getSnapshot();
      const combo = snapshot.value?.petToggleKey ?? "Ctrl+Shift+P";
      const toggle = link.character?.togglePet;
      if (!toggle || !parseShortcut(combo)) return;
      const el = event.target;
      if (el && (el.isContentEditable || /^(input|textarea|select)$/i.test(el.tagName))) return;
      if (!matchesShortcut(combo, event)) return;
      event.preventDefault();
      if (snapshot.status !== "ready") return;
      const now = Number(event.timeStamp) || performance.now();
      if (now - lastPetToggleAt < 150) return;
      lastPetToggleAt = now;
      try {
        toggle();
      } catch {
        console.warn("펫 창 토글 실패");
      }
    };
    life.listen(window, "keydown", petToggleListener);
    let lastCanvasToggleAt = -Infinity;
    const canvasToggleListener = (event) => {
      if (event.repeat) return;
      const snapshot = form.getSnapshot();
      if (snapshot.status !== "ready" || snapshot.value?.canvasToggle !== true) return;
      const combo = snapshot.value?.canvasToggleKey ?? "Ctrl+Shift+H";
      const toggle = link.character?.toggleCanvas;
      const parsed = parseShortcut(combo);
      if (!toggle || !parsed) return;
      if (!matchesShortcut(combo, event)) return;
      const el = event.target;
      const inInput = el && (el.isContentEditable || /^(input|textarea|select)$/i.test(el.tagName));
      if (inInput && !(parsed.ctrl || parsed.alt || parsed.meta)) return;
      event.preventDefault();
      const now = Number(event.timeStamp) || performance.now();
      if (now - lastCanvasToggleAt < 150) return;
      lastCanvasToggleAt = now;
      try {
        toggle();
      } catch {
        console.warn("캔버스 숨김 토글 실패");
      }
    };
    life.listen(window, "keydown", canvasToggleListener);
    life.add(ctx.slots.inject("plugins.row.config", () => ctx.slots.register({
      name: "plugins.row.config",
      key: name + "#" + ENTRY_ID
    }, settingsPage(ctx, form, updater, keys, link))));
    sync();
  } catch (error) {
    dispose();
    throw error;
  }
}
var links = /* @__PURE__ */ new WeakMap();
var inject = ["locale", "theme", "configForms", "slots"];
var internals = {
  githubSource,
  compareVersions,
  createUpdater,
  createKeyStore,
  ttsSignature,
  parseJsonObject,
  parseShortcut,
  shortcutFromEvent,
  shortcutKeyDown,
  dragKeyDown,
  matchesShortcut,
  panelHidesInWindowCharacter,
  characterPrefs,
  /** apply(ctx)가 만든 캐릭터 연결 */
  linkOf: (ctx) => links.get(ctx)
};
return module.exports;
} });
