# dsh-tts

캐릭터의 말풍선 대사를 TTS로 읽어 주는 플러그인입니다. 필요할 때 직접 켜서 사용합니다.
현재는 **오디오 레벨(RMS)에 맞춰 입을 움직이며**, 음소 단위로 맞추는 정밀 립싱크는 아직 지원하지 않습니다.
에이전트 응답 낭독·페르소나·감정 태그·STT는 다루지 않습니다.

- **Host**: `GET /dsh-tts/state`, `POST /dsh-tts/speak` — 표준 OpenAI 호환 `/audio/speech`로 음성을 스트리밍 중계합니다. API 키는 호스트에서만 읽고 브라우저로 넘기지 않습니다.
- **Client** (`lib/client.js`, 빌드 산출물 커밋됨): `dsc:say` 이벤트를 받아 PCM16을 첫 청크부터 재생하고 Analyser RMS로 `window.__dsc.voice({ speaking, level, until })`를 갱신합니다.
- **말풍선 타이밍은 TTS와 무관합니다.** TTS가 꺼져 있거나 오류·지연이 생기면 `voice(null)`을 호출합니다. dsc.js의 숨김 타이머는 그대로 동작합니다.

## deepseek-harness-kr에 포함 (0.1.6부터)

kr 플러그인이 이 디렉터리의 `src/`를 그대로 가져다 씁니다. kr 설정 창의 **말풍선 음성**에서 켜고 URL·API 키·모델·보이스·샘플레이트·추가 파라미터(JSON)를 넣습니다.

- 설정값은 kr 설정의 `tts` 아래에 다음 형식으로 저장됩니다(모두 volatile). 호스트가 요청마다 다시 읽으므로 저장 즉시 적용됩니다. 꺼져 있으면 두 라우트는 404로 답합니다.
- API 키는 Harness 자격 증명 저장소에 `apiKeyEnv` 이름으로 저장됩니다. 호스트는 저장된 키를 먼저 쓰고 없으면 같은 이름의 환경변수를 씁니다.
- 브라우저에서 쓰는 `src/client/`는 kr 빌드(`plugin/build.mjs`)가 kr 번들에 넣습니다.

아래는 kr 없이 이 플러그인만 사용하는 방법입니다. kr과 함께 켜면 같은 라우트가 두 번 등록되므로 둘 중 하나만 쓰세요.

## 옵트인 (단독 사용)

기본값은 `enabled: false`입니다. 꺼져 있으면 **라우트를 등록하지 않습니다**(/state도 404). 클라이언트도 연결하지 않으며 외부 요청을 보내지 않습니다. `baseUrl`이 비어 있을 때도 클라이언트를 연결하지 않습니다.

사용하려면 `cordis.patch.yml` config에 `enabled: true`와 `openai.baseUrl`을 지정합니다. 키는 `apiKeyEnv` 이름의 환경변수 또는 Harness 자격 증명 저장소에 둡니다:

```bash
export DSH_TTS_API_KEY=sk-...
```

## 설정 (기본값)

```yaml
enabled: false
openai:
  baseUrl: ""                # 비어 있으면 동작하지 않음. 예: https://api.openai.com/v1
  model: ""                  # 비우면 요청에서 빼고 서버 기본값 사용
  voice: ""                  # 비우면 요청에서 빼고 서버 기본값 사용
  speed: 1.0                 # 1.0이면 요청에서 생략
  apiKeyEnv: "DSH_TTS_API_KEY" # 자격 증명 참조 이름(저장된 키 → 같은 이름의 환경변수). ""이면 인증 없이 요청
  headers: {}                # 업스트림 추가 헤더 (Authorization은 덮어쓸 수 없음)
  timeoutMs: 30000
  extraBody: {}              # 모델 전용 필드(비이식성). 예: Drama 3 ref_audio/ref_text. 표준 필드가 우선
  textPrefix: ""             # 모델 전용 연출 접두사(비이식성). Drama 3: "[밝고 장난기 있는 20대 여성] "
stream:
  enabled: true              # 스트리밍이 유일한 전송 방식이라 끄면 기능 전체가 꺼짐
  pcmSampleRate: 24000
voiceLines:                  # 대사 종류별 on/off
  reactions: true
  status: false
  mutters: false
  others: true
cache:
  enabled: true              # false로 끌 수 있음(매 발화마다 업스트림 호출)
  maxEntries: 200
  ttlMs: 604800000
  maxCacheBytes: 33554432    # 이보다 큰 오디오는 캐시하지 않음
limits:
  maxCharsPerLine: 300
  maxBytes: 16777216
```

## voice / 모델별 프롬프트

- `openai.voice`는 **표준 OpenAI 필드**이며 값은 엔드포인트마다 다릅니다. `default`처럼 고정되지 않은 이름은 발화마다
  화자가 바뀔 수 있으므로, **서버에 등록된 보이스 id**를 쓰세요. 서버는 등록된 업로드 보이스를
  `<이름>-<해시>`(예: `voice-1a2b3c4d…`)로 노출하며 해시는 업로드한 참조 클립 내용에서 파생된 식별자입니다
  (Fish Audio 클라우드의 `reference_id`에 해당). `GET {baseUrl}/../audio/voices`(서버 루트 `/v1/audio/voices`)로 목록과
  `ref_text`·동의 메타데이터를 확인할 수 있습니다.
- `openai.textPrefix`는 **모델 전용 연출 접두사**입니다(비이식성). Drama 3는 대본 안의 대괄호 지시문으로 연기를
  지시합니다 — `[밝고 장난기 있는 20대 여성, 친구에게 말하듯 편안하게] `처럼 **매 대사 앞에** 붙여 일관된 톤을 만듭니다.
  영어·한국어 등 언어에 제한이 없으며 `[sigh]`·`[pause]` 같은 소리/멈춤도 지원합니다.
  참고: <https://docs.fish.audio/features/text-to-speech/drama-3>
- `openai.extraBody`는 그 밖의 **모델 전용 요청 필드**(예: `ref_audio`, `ref_text`, `language`)를 그대로 병합합니다.

## 라우트 계약

`GET /dsh-tts/state` → 200

```json
{ "enabled": true, "pcmSampleRate": 24000,
  "voiceLines": { "reactions": true, "status": false, "mutters": false, "others": true } }
```

`POST /dsh-tts/speak` body `{ "text": "..." }`

| 상황 | 응답 |
|---|---|
| 잘못된 JSON / 빈 텍스트 / `maxCharsPerLine` 초과 | 400 `{error:{message}}` |
| `baseUrl`이 비어 있음 | 503 `{error:{message}}` |
| `apiKeyEnv`(비어 있지 않음)인데 저장된 키·같은 이름의 env 모두 없음/빈 값 | 503 `{error:{message}}` |
| 캐시 hit | 200 `audio/pcm`, `cache-control: no-store`, `x-cache: hit` |
| 캐시 miss | 200 `audio/pcm` 스트리밍, `x-cache: miss` |
| 업스트림 비 2xx | 그 상태코드 + JSON `{error:{message}}` (오디오 헤더 전에) |
| 플러그인 disabled | 404 (단독: 라우트 미등록 · kr 포함: 라우트가 404로 답함) |

`/dsh-tts/state`는 `baseUrl`이 비어 있으면 `enabled: false`를, 설정값이 잘못되었으면 `{ enabled: false, error }`를 돌려줍니다.

업스트림 요청은 표준 OpenAI 필드 `{ model?, voice?, input, response_format: "pcm", stream_format: "audio", speed? }` +
`Authorization: Bearer`(단, `apiKeyEnv: ""`이면 생략)이며 `openai.extraBody`가 있으면 요청에 합칩니다. 같은 필드가 겹치면 표준 필드가 우선합니다.
`model`·`voice`가 비어 있으면 요청에서 빼므로 서버 기본값이 적용되고 이때는 `extraBody`에 넣은 같은 이름의 값이 그대로 전달됩니다.
`extraBody`는 **모델 전용**입니다 — 예: Drama 3의 `ref_audio`/`ref_text`/`language`/`max_new_tokens`.
`voice`는 엔드포인트가 아는 이름(OpenAI 보이스 또는 서버에 등록된 보이스 id)이어야 하며 `default`처럼 고정되지 않은
이름은 발화마다 화자가 바뀔 수 있습니다.
클라이언트가 연결을 끊으면 업스트림 요청도 중단합니다.

## 빌드 / 테스트

```bash
node build.mjs        # src/client/index.js -> lib/client.js (커밋 대상)
node --test test/     # node:test, 외부 의존성 없음
```

esbuild는 `ESBUILD` 환경변수(경로) → 설치된 `esbuild` 패키지 순서로 찾습니다.
`lib/client.js`는 커밋되어 있으므로 빌드 없이 동작합니다.

## TODO / 후속 작업

- **정밀 립싱크**: 현재는 `AnalyserNode` RMS로 입 벌림만 구동하는 근사 방식입니다.
  실제 음성과 음소 단위로 맞추는 립싱크(비짐/포먼트 분석, 모델별 타이밍)는 후속 작업으로 남겨 두었습니다.
- 보이스 프로필·감정 태그와 문장 단위 스트리밍 최적화도 후속 작업입니다.

## 프라이버시

- 대사 텍스트는 **설정한 엔드포인트로만** 전송됩니다(`openai.baseUrl`). 로컬 로그에는 남기지 않습니다.
- API 키는 호스트 프로세스의 환경변수에서 읽고 브라우저로 전달하지 않습니다.
- 혼잣말(`mutters`)은 모델 추론 요약이 섞일 수 있어 **기본 꺼짐**입니다.
- `/dsh-tts/speak` 응답은 `no-store`이며 캐시는 호스트 메모리에만 존재합니다.
