// @ts-check
// 캐릭터 외형 설정 항목의 단일 정의. 아래가 모두 여기서 만들어진다:
//   plugin/host.js        설정 스키마 (저장 키·기본값)
//   plugin/client.js      설정 화면 (한국어·영어 이름), 펫 메뉴 값 검증
//   character/index.js    모델 파라미터·켰을 때 대사, 체형 값, 펫 창 설정 패널
//   pet/main.cjs          펫 창 우클릭 메뉴 (빌드가 pet/settings.cjs로 복사)
// 항목을 더하거나 바꿀 때는 이 파일만 고친다.

// key: 설정 저장 키. param/on: 켰을 때 모델 파라미터 값. line: 켤 때 말하는 대사 묶음.
// param·체형 value는 이 Live2D 모델 전용 값 (다른 모델로 바꿀 때 character/model-profile.ts와 함께 고침).
// 호스트(plugin/host.js)가 빌드 없이 Node로 바로 읽는 파일이라 TypeScript인 model-profile.ts를 가져오지 않고 ID를 직접 둠.
export const OUTFIT_ITEMS = [
  { key: 'glasses', ko: '뿔테 안경', en: 'Glasses', param: 'key11', on: 1, line: 'outfit_glasses' },
  { key: 'monocle', ko: '외눈 안경', en: 'Monocle', param: 'key12', on: 1, line: 'outfit_glasses' },
  { key: 'skirt', ko: '치마 길이 바꾸기', en: 'Change skirt length', param: 'Clothes1', on: -1, line: 'outfit_skirt_long' },
  { key: 'chestClothes', ko: '상의 바꾸기', en: 'Change top', param: 'Clothes3', on: 1, line: 'outfit_chest_cover' },
  { key: 'shoesOff', ko: '신발 벗기', en: 'Take off shoes', param: 'Clothes4', on: 1, line: 'outfit_shoes' },
  { key: 'tailHide', ko: '꼬리 숨기기', en: 'Hide tail', param: 'Clothes5', on: -1, line: 'outfit_tail' },
  // 동물귀는 파라미터가 아니라 모델 파트(Part159)의 불투명도로 부드럽게 감춘다 (character/index.js의 earHide)
  { key: 'earHide', ko: '동물귀 숨기기', en: 'Hide animal ears' },
]

// 체형 = 모델 파라미터 Clothes2 값 (기본 0, 체형 1 0.4, 체형 2 꼬마 1)
export const BODY_TYPES = [
  { key: 'default', ko: '기본 체형', en: 'Default', value: 0 },
  { key: 'type1', ko: '체형 1', en: 'Body type 1', value: 0.4 },
  { key: 'type2', ko: '체형 2 (꼬마)', en: 'Body type 2 (chibi)', value: 1 },
]
