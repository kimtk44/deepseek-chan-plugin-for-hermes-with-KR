// 빌드 산출물입니다. 직접 고치지 말고 소스(character/, plugin/client.ts, shared/)를 고친 뒤 npm run build 하세요.
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// shared/settings.js
var settings_exports = {};
__export(settings_exports, {
  BODY_TYPES: () => BODY_TYPES,
  OUTFIT_ITEMS: () => OUTFIT_ITEMS
});
module.exports = __toCommonJS(settings_exports);
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BODY_TYPES,
  OUTFIT_ITEMS
});
