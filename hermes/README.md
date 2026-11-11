# Hermes Agent에서 DeepSeek짱 쓰기 (실험)

이 실험은 기존 DeepSeek짱의 펫 윈도우(`pet/`)와 캐릭터 코드, 모델(`assets/`)을 그대로 사용합니다. `hermes/` 폴더는 Hermes Agent 세션의 상태를 펫에게 전달하기 위한 세 가지 작은 부분으로 구성됩니다. 이 모드에서는 DeepSeek Harness가 필요하지 않습니다. 메인 플러그인과 별도로 유지 관리되는 실험입니다.

```text
Hermes Agent --(hooks)--> bridge plugin --(JSONL files)--> hub --(WebSocket, token)--> host --(local pipe)--> pet window
```

| 폴더 | 역할 |
| :--- | :--- |
| `hermes/bridge/companion_bridge/` | Hermes 플러그인 (Python). 라이프사이클 훅(세션 시작, 턴, 도구 호출, 승인/질문 대기)을 관찰하고 `~/.local/state/hermes-companion/raw-*.jsonl`에 최소한의 이벤트를 줄 단위로 추가합니다. ID, 종류, 도구 이름, 플래그만 기록하며 프롬프트, 응답, 도구 인자, 승인 텍스트는 절대 기록하지 않습니다. Hermes의 동작을 차단하거나 변경하지 않습니다. |
| `hermes/hub/` | Node 서비스. 해당 파일들을 추적하여 모든 세션을 하나의 캐릭터 상태(`idle`, `working`, `tool`, `waiting_approval`, `waiting_question`, `done`, `failed`)로 축소하고, 토큰으로 보호된 WebSocket(기본 `127.0.0.1:9141`)을 통해 전송합니다. |
| `hermes/host/` | Node 프로그램. Harness 플러그인과 동일한 방식(로컬 파이프, 줄당 JSON 객체 하나)으로 펫 윈도우(Electron)를 시작하고, 허브에 연결하여 각 상태를 펫의 명령(표정, 말풍선 문구, 동작)으로 변환합니다. 문구는 `assets/dsc-lines.json`에서 가져옵니다. |

| 상태 | 캐릭터 동작 |
| :--- | :--- |
| working | 로딩 표정, "시작" 문구, 고개 끄덕임 |
| tool | 도구 문구를 포함한 짧은 상태 말풍선 (1.5초에 최대 1회) |
| waiting_approval | 땀 표정 + "승인" 문구, 응답까지 유지 |
| waiting_question | 눈 가늘게 뜨는 표정 + "질문" 문구 |
| done | 하트/홍조, "완료" 문구, 웃음 |
| failed | 눈물, "오류" 문구, 축 처짐 |
| hub unreachable | 어두운 표정 + 오프라인 문구 |

## 요구 사항

- Node 22.19 이상
- 플러그인 지원이 있는 Hermes Agent
- Electron (`hermes/` 내부에서 `npm install`로 설치하거나, `--electron` 또는 `DSC_HERMES_ELECTRON`으로 기존 Electron 실행 파일을 지정)
- 현재까지 Linux (xvfb)에서만 테스트되었습니다. Windows와 macOS는 Harness 플러그인과 동일한 파이프 프로토콜을 사용하지만 이 호스트에서는 테스트되지 않았습니다.

## 설정

1. `hermes` 폴더로 이동하여 의존성을 설치합니다.
   ```bash
   cd hermes && npm install
   ```

2. 브리지 플러그인을 설치합니다. `hermes/bridge/companion_bridge`를 `~/.hermes/plugins/companion-bridge` (또는 프로필의 `plugins/` 폴더)로 복사한 후 활성화합니다.
   ```bash
   hermes plugins enable companion-bridge
   ```

3. 토큰 파일을 생성합니다. 최소 32자리의 랜덤 문자를 포함하고 권한은 0600으로 설정합니다.
   ```bash
   mkdir -p ~/.config/dsc-hermes
   head -c 32 /dev/urandom | base64 > ~/.config/dsc-hermes/hub.token && chmod 600 ~/.config/dsc-hermes/hub.token
   ```

4. 허브를 실행합니다.
   ```bash
   node hub/hub.mjs --token-file ~/.config/dsc-hermes/hub.token
   ```

5. 호스트를 실행합니다.
   ```bash
   node host/host.mjs --token-file ~/.config/dsc-hermes/hub.token
   ```

Hermes 없이 테스트하려면 `--fake-signals` 옵션을 사용하면 모든 상태를 순환합니다.
```bash
node host/host.mjs --fake-signals
```

## 호스트 옵션

| 옵션 | 설명 |
| :--- | :--- |
| `--hub <ws url>` | 허브 WebSocket 주소 (기본 `ws://127.0.0.1:9141`) |
| `--token-file <file>` | 인증 토큰 파일 경로 |
| `--fake-signals` | 가짜 신호로 상태 순환 |
| `--step-ms <n>` | 상태 전환 간격 (밀리초) |
| `--electron <path>` | Electron 실행 파일 경로 |
| `--pet <dir>` | 펫 폴더 경로 |
| `--assets <dir>` | 에셋 폴더 경로 |
| `--config <file>` | 설정 파일 경로 (기본 `~/.config/dsc-hermes/config.json`) |
| `--x <n> --y <n>` | 펫 표시 위치 (저장됨) |

## 다른 머신에서 허브와 펫 사용

허브는 기본적으로 `127.0.0.1`에 바인딩됩니다. `--bind <address>` 옵션을 사용하면 사설 네트워크에 노출할 수 있습니다. 토큰이 유일한 보호 수단이므로 인터넷에 노출하지 마세요. 호스트에서는 `--hub ws://<address>:9141`을 사용합니다.

## 한계

- 펫 위치는 `--x/--y`로 설정되며, 드래그 후 위치는 기억되지 않습니다.
- 펫 메뉴의 "Harness로 돌아가기"는 단순히 펫을 다시 엽니다.
- 음성(TTS), 3D 모델, "ex" 문구는 이 모드에 연결되어 있지 않습니다.
- 모든 세션은 하나의 캐릭터 상태를 공유합니다 (허브가 주요 세션을 선택).

## 테스트

- 허브와 호스트: `cd hermes && npm test`
- 브리지: `python3 -m pytest hermes/bridge/test` (테스트 중 2개는 Hermes 체크아웃과 그 파이썬 의존성이 있어야 통과합니다)

## 라이선스

MIT. 저장소의 나머지 부분과 동일합니다. Live2D 모델과 Cubism Core는 자체 약관을 따릅니다 (NOTICE.md 참고).
