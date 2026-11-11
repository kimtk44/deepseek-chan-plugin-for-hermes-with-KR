# DeepSeek쟝 Plugin for DSH with KR

> `deepseek-harness-kr`의 저장소명과 프로젝트명이 바뀌었습니다. 설치와 설정은 그대로 유지됩니다.

[DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)에 한국어 화면과 Live2D 버튜버 **DeepSeek짱**을 더하는 DSH 플러그인입니다.

![DeepSeek짱 소개 영상](docs/preview.gif)

<details>
<summary><b>소개 영상</b></summary>

https://github.com/user-attachments/assets/7e7a96cc-efc8-416d-89a0-f574fdcda690

</details>

## 주요 기능

- 얼굴을 추적하듯 눈이 먼저 움직이고 고개가 뒤따릅니다. 가슴과 머리카락은 물리 엔진에 맞춰 흔들립니다
- 작업 상태에 따라 반응합니다: 시작 → 생각 중(혼잣말) → 도구 사용 → 승인 대기(식은땀) → 완료(하트 눈) / 실패(눈물)
- 말풍선 글자의 모음에 맞춰 입을 움직입니다. 한글 ㅏㅔㅣㅗㅜ와 영어 a·e·i·o·u를 구분합니다
- 클릭한 부위에 따라 반응하고 마우스를 따라 눈과 고개를 움직입니다
- 반응이 끝나면 0.4~0.6초에 걸쳐 부드럽게 대기 자세로 돌아옵니다
- 가끔 꼬마 모습으로 산책을 다녀오고 입력이 없으면 절전합니다
- 안경, 치마 길이, 상의, 신발, 꼬리, 동물귀를 바꾸고 기본·체형 1·꼬마 중 체형을 고를 수 있습니다
- 모바일(터치 전용) 화면에서도 캐릭터가 나타납니다. 화면이 좁으면 입력창 위로 비켜 섭니다
- 플러그인·자동화 화면에서는 창 안 캐릭터와 말풍선을 잠시 숨깁니다. 대화 화면으로 돌아오면 원래 표시 상태로 돌아옵니다. 이미 창 밖으로 꺼낸 독립 펫은 그대로 남습니다.
- 캐릭터를 Harness 창 밖으로 꺼내 다른 앱 위에 띄울 수 있습니다 — [바깥 펫 창](#바깥-펫-창)
- 가지고 있는 FBX·VRM 3D 모델로 캐릭터를 표시할 수 있습니다(베타). 바깥 펫 창에도 같은 모델이 적용됩니다 — [3D 모델](#3d-모델-beta)
- 대사 ex 파일로 상황별 대사를 바꿀 수 있습니다(실험적 기능) — [대사 ex](#대사-ex-실험적)
- 파스텔 테마는 Harness의 밝은 모드·다크 모드 설정을 따릅니다. 좁은 화면에서 겹쳐 뜨는 왼쪽 드로어와 오른쪽 전체화면 패널에는 불투명 배경을 씁니다
- 한국어 언어팩은 UI 번역 73개 네임스페이스를 포함합니다. 한국어·영어 화면을 지원합니다
- 말풍선 음성(TTS)은 필요할 때 켤 수 있습니다 — [말풍선 음성](#말풍선-음성-tts-옵트인)
- 설정 창에서 기능을 켜고 끄거나 단축키를 지정하고 업데이트할 수 있습니다 — [플러그인 설정](#플러그인-설정)

## 플러그인으로 설치

프로젝트 표시명은 **DeepSeek쟝 Plugin for DSH with KR**입니다. 기존 설치·설정과 호환되도록 패키지명과 플러그인 ID는 `deepseek-harness-kr`를 유지합니다.

DSH Desktop 앱과 브라우저 Web UI에서 사용할 수 있습니다. 텍스트 CLI/TUI와 headless 환경은 지원하지 않습니다.

### Harness에서 설치

1. Harness의 **Plugins**에서 **+ Add plugin** 버튼을 클릭합니다.
2. **Add Plugin** 창에 아래 GitHub 주소를 입력해 설치·활성화합니다.

   ```text
   git+https://github.com/noire113-dev/deepseek-chan-plugin-for-dsh-with-KR.git
   ```

3. 한국어가 자동 선택되지 않으면 **Settings → General → Language**에서 **한국어**를 선택합니다.

앱에서 설치한 플러그인은 현재 사용 중인 프로필에 적용됩니다. 별도의 Node/npm 설치는 필요하지 않습니다.
플러그인은 DSH 사용자 프로필에 설치되어 앱 업데이트 후에도 남습니다. 비활성화하면 캐릭터·테마·번역 등록이 해제됩니다.

### 업데이트

플러그인 설정 화면에서 바로 업데이트할 수 있습니다.

1. **플러그인**(Plugins)에서 이 플러그인의 상세 페이지를 열고 **포함된 구성 요소**(Components) 아래의 **deepseek-harness-kr**를 클릭해 설정 창을 엽니다.
2. 아래쪽 **업데이트** 칸에서 설치한 GitHub 주소의 최신 버전을 확인합니다. 새 버전이 있으면 **업데이트**를 누르고 안내를 확인한 뒤 **계속**을 누릅니다.
3. 플러그인이 잠시 꺼졌다가 새 버전으로 다시 켜집니다. 캐릭터·테마·한국어 설정은 그대로 남습니다. 업데이트에 실패해 플러그인이 목록에서 사라졌다면 **플러그인 추가**(+ Add plugin)에서 같은 GitHub 주소로 다시 추가하세요.

업데이트 칸은 GitHub 주소로 설치한 경우에만 동작합니다. 포크에서 설치했다면 그 포크의 최신 버전을 확인합니다.

## 사용법

### 캐릭터 조작

- **옮기기**: 왼쪽·오른쪽 버튼을 **함께** 누른 채 끌어 옮깁니다. 어느 쪽이든 첫 버튼을 누르고 약 **150ms 안에** 다른 버튼을 누르면 캐릭터가 집힙니다(좌→우·우→좌 모두). 더 늦게 눌렀다면 두 버튼을 함께 누른 채 움직여 집을 수 있습니다. 설정한 **이동 키**(기본 `Alt`/`Option`)를 누른 채 왼쪽 드래그로도 옮길 수 있습니다. 바깥 펫 창에서도 같습니다 — [바깥 펫 창](#바깥-펫-창)
- **머리**를 누른 채 **위로/아래로** 쓸면 속도에 따라 다르게 반응합니다
- **가슴**을 누른 채 **위로** 끌고 그 상태로 **좌우로** 흔들 수 있습니다
- **치마**를 여러 번 만지면 반응합니다
- 몸 위에서 **휠**을 돌려 크기를 조절합니다
- 펫 창 **우클릭**: 설정 패널 · 크기 · Harness로 돌아가기
- 단축키(설정에서 비우면 사용 안 함): 캐릭터와 말풍선 켜기·끄기 `Ctrl+Shift+D`, 펫 창 내보내기·돌아오기 `Ctrl+Shift+P`, 캔버스만 숨김/표시 `Ctrl+Shift+H`(기본 꺼짐)

### 바깥 펫 창

캐릭터를 **왼쪽·오른쪽 버튼을 함께 누르거나 이동 키를 누른 채** 끌어 보세요. 몸이 Harness 창 밖으로 15% 넘게 나가면 다른 앱 위에 항상 떠 있는 투명한 펫 창으로 옮겨집니다. 말풍선·몸짓·표정·음성 입 모양이 그대로 이어지고 창 안에서는 상반신만 보이던 캐릭터가 펫 창에서는 **다리·신발까지 전신**으로 그려집니다.

- 캐릭터 몸을 클릭하면 펫이 반응하고 나머지 영역을 클릭하면 뒤 화면으로 전달됩니다. 끌어서 옮기고 제자리 근처에 놓으면 다시 Harness 창에 붙습니다. Harness를 끄면 펫 창도 함께 종료됩니다.
- **단축키로 내보내기·돌아오기**: 기본 `Ctrl+Shift+P`. 한 번 누르면 캐릭터가 바깥 펫 창으로 나가고 다시 누르면 창 안 기본 자리로 돌아옵니다. 캔버스를 숨긴 상태에서는 단축키가 동작하지 않습니다(먼저 복구).
- **우클릭 메뉴**: `설정…`(크기 슬라이더·소품·옷·체형) · `크기`(75·100·125·150%) · `Harness로 돌아가기` · `캐릭터 잠시 숨기기` · `소품·옷` · `체형`
- 바꾼 크기는 다음에 꺼내거나 Harness를 다시 켜도 유지됩니다. 창에 붙을 때는 원래 자리의 크기로 돌아갑니다.
- 설정에 3D 모델 폴더를 넣었으면 펫 창도 같은 3D 모델을 전신으로 그립니다. 폴더나 외곽선 설정을 바꾸면 펫 창이 숨어 있을 때 새로 불러옵니다.
- **외부 펫 산책**은 출발한 모니터 안에서만 진행합니다. 왼쪽 거리가 부족하면 더 넓은 오른쪽으로 방향을 바꿉니다. 선택한 경계까지 걸어간 뒤 마지막 구간에서 자연스럽게 사라집니다. 잠시 후 같은 모니터의 반대 경계에서 나타나 원래 자리로 돌아옵니다. 산책 도중 모니터가 제거되거나 작업 영역이 바뀌면 안전한 영역으로 복구합니다.
- **Desktop 앱의 Windows·macOS(Apple silicon)에서만 동작합니다.** 브라우저 Web UI와 그 외 환경에서는 창 안에서 끌어 옮기는 것까지만 됩니다.
- 별도 설치는 필요 없습니다. 처음 끌어낼 때 기다리지 않도록 한가할 때 펫 전용 런타임을 미리 만듭니다. Harness가 업데이트되면 자동으로 다시 만듭니다. 폴더를 지워도 안전합니다.
  - Windows: `%LOCALAPPDATA%\deepseek-harness-kr\pet-runtime`
  - macOS: `~/Library/Application Support/deepseek-harness-kr/pet-runtime`

## 플러그인 설정

**플러그인**(Plugins)에서 이 플러그인의 상세 페이지를 연 뒤 **포함된 구성 요소**(Components) 아래의 **deepseek-harness-kr**를 클릭하면 설정 창이 열립니다. 여기서 다음 기능을 각각 켜고 끌 수 있습니다.

<!-- 첫 칸 글자 사이에 보이지 않는 단어 결합 문자(U+2060)가 있어 단어 단위로만 줄바꿈됩니다. 항목을 고칠 때도 유지해 주세요. -->
| 설정 | 기능 |
|---|---|
| 캐⁠릭⁠터⁠와 말⁠풍⁠선 | Live2D 캐릭터, 표정·터치 반응과 말풍선 |
| 모⁠바⁠일⁠에⁠서⁠도 캐⁠릭⁠터 표⁠시 | 터치 전용 화면에서도 캐릭터를 보여 줌 (기본값 켜짐). 끄면 모바일에서 캐릭터와 복구 칩을 표시하지 않습니다 |
| 시⁠작⁠할 때 등⁠장 연⁠출 | 켜면 화면 가운데에서 크게 인사하고 제자리로 이동, 끄면 처음부터 오른쪽 아래에 뜸 (기본값 켜짐) |
| 앱 아⁠이⁠콘 | DeepSeek짱 아이콘으로 바꿈. 끄면 원래 아이콘으로 되돌림 (기본값 켜짐, 시작할 때와 업데이트 후 적용). **Windows**는 데스크톱·시작 메뉴 바로가기 아이콘(창·작업 표시줄 아이콘은 그대로), **macOS**는 Finder에서 보이는 앱 아이콘(앱에 사용자 지정 아이콘을 붙임, 실행 파일·서명은 그대로) |
| 파⁠스⁠텔 테⁠마 | 배경·색상·입력창 스타일. 밝은 모드와 다크 모드 모두 지원 (모드는 Harness 설정 → 모양에서 선택) |
| 한⁠국⁠어 언⁠어⁠팩 | 한국어 UI 번역 등록 |
| 소⁠품⁠·⁠옷 | 뿔테 안경, 외눈 안경, 치마 길이 바꾸기, 상의 바꾸기, 신발 벗기, 꼬리 숨기기, 동물귀 숨기기 (기본값 꺼짐) |
| 체⁠형 | 기본 체형, 체형 1, 체형 2(꼬마) 중 선택 (기본값 기본 체형) |
| 절⁠전 | 입력이 없을 때 캐릭터를 화면 밖으로 내보내고 렌더링 멈춤 (기본값 켜짐, 대기 시간 0.5~60분, 기본 1분) |
| 이⁠동 키 | 캐릭터를 집어 옮길 때 누르고 있어야 하는 키 (기본값 `Alt`/`Option`). 수식 키 하나 또는 일반 키 하나를 등록하고 비우면 왼쪽·오른쪽 버튼을 함께 눌러야 합니다 |
| 단⁠축⁠키 | 캐릭터와 말풍선 설정을 켜고 끄는 단축키 (기본값 `Ctrl+Shift+D`). 칸을 누른 뒤 원하는 키 조합을 그대로 누르면 등록됩니다 (Esc 취소 · Backspace로 지우기 · Space/+ 키 지원) |
| 펫 창 단⁠축⁠키 | 캐릭터를 바깥 펫 창으로 내보내고 다시 불러오는 단축키 (기본값 `Ctrl+Shift+P`, 비우면 사용 안 함) |
| 캔⁠버⁠스⁠만 숨⁠김⁠/⁠표⁠시 | 왼쪽 스위치를 켠 사람만 쓰는 단축키 (기본값 꺼짐, `Ctrl+Shift+H`). 캐릭터 설정은 켜 둔 채 캔버스만 잠시 숨기고 표시합니다(그리기만 멈춤). 숨긴 동안 화면 오른쪽 아래의 **‘숨긴 캐릭터 다시 표시’** 칩으로 되돌릴 수 있습니다 |
| 말⁠풍⁠선 음⁠성 | 말풍선 대사를 TTS로 읽기 (기본값 꺼짐) — [말풍선 음성](#말풍선-음성-tts-옵트인) 참고 |
| 3⁠D 모⁠델 (실⁠험) | 모델 폴더, 외곽선 법선, 눈썹 움직임 세기·부드러움, 앰비언트 오클루전과 세기. 폴더를 비우면 기본 Live2D 캐릭터 (기본값 비어 있음) — [3D 모델](#3d-모델-beta) 참고 |
| 대⁠사 ex | 켜면 `assets/dsc-lines-ex.json`에 적은 상황의 대사로 기본 대사를 바꿈 (기본값 꺼짐) — [대사 ex](#대사-ex-실험적) 참고 |

캐릭터·테마·한국어는 기본으로 켜져 있습니다. 설정을 바꾸면 즉시 적용되고 현재 프로필에 저장됩니다. 한국어 표시 언어는 **설정 → 일반 설정 → 언어**(Settings → General → Language)에서 선택합니다.

## 말풍선 음성 (TTS, 옵트인)

0.1.6부터 말풍선 음성(`plugins/dsh-tts`)이 이 플러그인에 포함됩니다. 설정 창의 **말풍선 음성** 칸에서 바로 켜고 설정할 수 있습니다. YAML을 고칠 필요가 없습니다.

- OpenAI 호환 `/audio/speech` API로 음성을 스트리밍 재생하고 소리 크기(RMS)에 맞춰 캐릭터 입을 움직입니다. 음소 단위 정밀 립싱크는 아직 지원하지 않습니다.
- 기본값은 **꺼짐**이고 주소·모델·보이스도 미리 정해 두지 않습니다. 꺼져 있거나 URL이 비어 있으면 외부로 아무 요청도 보내지 않습니다.
- 설정 창에서 바꾼 값은 저장 즉시 다음 대사부터 적용됩니다. TTS가 꺼져 있거나 실패해도 말풍선은 평소대로 표시됩니다.

<!-- 앞 두 칸 글자 사이에 보이지 않는 단어 결합 문자(U+2060)가 있어 단어 단위로만 줄바꿈됩니다. 항목을 고칠 때도 유지해 주세요. -->
| 묶음 | 칸 | 설명 |
|---|---|---|
| (⁠제⁠목 줄⁠) | 말⁠풍⁠선 음⁠성 스⁠위⁠치 | 켜고 끄기 |
| 연⁠결 | A⁠P⁠I 주⁠소 | OpenAI 호환 주소(`/v1`까지). 예: `https://api.openai.com/v1`, Fish Audio `https://api.fish.audio/compat/v1`, 로컬 서버 `http://127.0.0.1:8000/v1` |
| 연⁠결 | A⁠P⁠I 키 | Harness 자격 증명 저장소에 저장되며 화면에는 저장 여부만 보입니다. 키가 필요 없는 로컬 서버라면 비워 둡니다 |
| 목⁠소⁠리 | 모⁠델 · 목⁠소⁠리 I⁠D | 비우면 요청에서 빼고 서버 기본값을 씁니다. OpenAI처럼 모델이 필수인 서버는 채워야 합니다 |
| 목⁠소⁠리 | 샘⁠플⁠레⁠이⁠트 (⁠H⁠z⁠) | 서버가 보내는 오디오와 같아야 합니다. OpenAI 24000, Fish 44100(또는 추가 요청 값에 `"sample_rate": 24000`) |
| 읽⁠을 대⁠사 | 4⁠종 | 반응·도구 상태·혼잣말·그 밖의 대사를 각각 켜고 끄기. 혼잣말은 모델 추론 요약이 섞일 수 있어 기본 꺼짐 |
| 고⁠급 | 추⁠가 요⁠청 값 (⁠J⁠S⁠O⁠N⁠) | 요청 본문에 합쳐지는 값. 예: `{ "speed": 1.1 }`, `{ "instructions": "밝게" }`. `input`·`response_format`·`stream_format`은 플러그인이 정합니다 |
| 고⁠급 | 그 밖⁠의 항⁠목 | 추가 헤더(JSON), 대사 앞 문구(예: Drama 3 연기 지시), 응답 대기 시간(초), 캐시, API 키 저장 이름 |

- API 키는 키 참조 이름(기본 `DSH_TTS_API_KEY`)으로 찾습니다. 저장된 키를 먼저 쓰고 없으면 같은 이름의 환경변수를 씁니다. 키는 브라우저로 넘어가지 않습니다.
- 켜면 말풍선 대사가 설정한 URL로 전송되고 사용하는 서비스에 따라 요금이 나올 수 있습니다. AI가 만든 음성이라는 점을 듣는 사람에게 알려 주세요(OpenAI 이용 정책).
- OpenAI의 `gpt-4o-mini-tts`·`tts-1`·`tts-1-hd`는 2027-01-06에 종료될 예정입니다.

라우트 설명은 [`plugins/dsh-tts/README.md`](plugins/dsh-tts/README.md)를 참고하세요. `dsh-tts`를 단독 row로 등록해 두었다면 해당 row를 지우고 설정 창으로 옮겨 주세요. kr 플러그인과 같은 라우트를 사용하기 때문입니다.

## 3D 모델 (beta)

0.9.0부터 기본 Live2D 캐릭터 대신 직접 가진 3D 모델로 캐릭터를 그릴 수 있습니다([#27](https://github.com/noire113-dev/deepseek-chan-plugin-for-dsh-with-KR/pull/27)). 같은 동작 코드가 모델을 움직이므로 작업 상태 반응·시선·말풍선 입 모양·바깥 펫 창은 그대로 이어집니다.

- 지원 형식은 **FBX**와 **VRM(0.x·1.0)** 입니다. 다른 확장자는 지원 형식을 알려 주는 경고를 냅니다.
- 모델 파일은 저장소·배포물에 들어 있지 않습니다. 설정에 지정한 로컬 폴더에서만 읽고, 폴더 밖 파일은 읽지 않습니다. 모델의 이용 약관은 직접 확인해 주세요.
- 3D 모델에는 기본 반응만 적용되고, 냄비·세숫대야·삐짐 같은 DeepSeek짱 고유 행동은 `avatar.json`의 `behaviors`로 켜야 동작합니다 — [캐릭터 고유 행동](#캐릭터-고유-행동)
- 모델 폴더를 비워 두면(기본값) 3D 렌더러를 불러오지 않으며, Live2D 캐릭터는 이전과 똑같이 동작합니다.

### 설정 방법

1. 모델 폴더를 하나 만들고 모델 파일(`.vrm` 또는 `.fbx`)과 `avatar.json`을 넣습니다.
2. 플러그인 설정의 **3D 모델 (실험)** 구역에서 **모델 폴더**에 그 폴더의 절대 경로를 넣고 화면을 새로 불러옵니다. 비우면 기본 Live2D 캐릭터로 돌아갑니다.
3. 같은 구역에서 외곽선 법선, 눈썹 움직임 세기·부드러움, 앰비언트 오클루전(모델에 AO 맵이 없으면 자동으로 구워 캐시)과 세기를 조절할 수 있습니다.

**VRM**은 사람형 뼈·표정·흔들림 뼈를 파일에서 읽으므로 한 줄이면 됩니다.

```json
{ "model": "MyAvatar.vrm" }
```

**FBX**는 모델마다 뼈·모프 이름이 달라 대응표를 적어야 합니다. 주요 항목:

| 항목 | 내용 |
|---|---|
| `model` | 모델 파일 이름 |
| `bones` | 사람형 뼈(hips, spine, chest, neck, head, 팔·눈 등) → 모델 뼈 이름 |
| `channels` | 동작 채널(눈 깜빡임, 입 모양, 눈썹 등) → 모프 이름·세기 |
| `expressions` | 표정 이름 → 모프 세기 |
| `materials` | 재질별 텍스처(바탕·그늘·AO 맵 등)·그리는 순서 |
| `springs` | 흔들림 뼈 시작점·강도·충돌체 |
| `animations` | 대기·몸짓 애니메이션 클립 |
| `outline`, `light`, `rim`, `faceSdf` | 외곽선·조명·림·얼굴 그림자 |
| `orientation` | 모델 방향(기본은 사람형 뼈로 자동 정규화) |
| `render` | 안티에일리어싱(`"msaa"` 기본, `"taa"`)·렌더 배율 |
| `behaviors` | 켤 DeepSeek짱 고유 행동 목록(기본은 없음) |
| `gaze` | 시선 반응성 — [시선 반응성](#시선-반응성) |

VRM에서도 위 항목을 적으면 기본값을 덮어씁니다(예: `gaze`, `channelSmooth`, `ao`). 더 자세한 예시와 스크린샷은 [PR #27](https://github.com/noire113-dev/deepseek-chan-plugin-for-dsh-with-KR/pull/27)을 참고하세요.

## 대사 ex (실험적)

설정의 **대사 ex** 스위치(기본값 꺼짐)를 켜면 `assets/dsc-lines-ex.json`에 적은 대사가 기본 대사를 대신합니다.

- 파일의 `lines`에 적은 상황 키만 통째로 바뀌고, 적지 않은 상황은 기본 대사(`assets/dsc-lines.json`)를 그대로 씁니다. 끄면 기본 대사로 돌아갑니다.
- 파일이 깨진 JSON이면 무시하고 기본 대사로 동작합니다. ex 파일에는 길이 제한(26자)과 중복 검사를 적용하지 않습니다.
- 파일 형식과 텍스트 대사 묶음을 변환하는 방법은 [`docs/ex-lines-guide.md`](docs/ex-lines-guide.md)에 있습니다(`tools/convert-part-lines.mjs`).
- 플러그인을 업데이트하면 `assets/` 폴더가 교체되어 **직접 고친 ex 파일이 덮어써질 수 있습니다.** 따로 보관해 두세요.

## 호환성

- 지원하는 DSH 버전은 0.2.1-rc.5 이상 0.3 미만입니다. 0.8.0 구조 개편은 Windows DSH 0.2.2와 macOS DSH 0.2.2-rc.1의 격리 프로필에서 실제 동작을 확인했습니다([#26](https://github.com/noire113-dev/deepseek-chan-plugin-for-dsh-with-KR/pull/26)).
- 작업 상태와 추론 문구는 화면의 DOM 구조로 감지합니다. DSH 업데이트가 DOM 구조나 플러그인 API를 바꾸면 호환성 수정이 필요할 수 있습니다.
- Electron 네이티브 메뉴·업데이트/복구 창, 패키지 메타데이터 설명과 일부 하드코딩 문구는 언어팩의 번역 대상이 아닙니다.
- 펫 창의 크기 자동 조절과 복귀 연출은 Windows에서 검증했습니다. macOS에서는 화면 배치에 따라 창 위치가 어긋날 수 있습니다.
- 3D 렌더링 시스템은 beta입니다. 펫 창에서 창 안으로 끌어 붙일 때 몇 프레임 튈 수 있습니다(Live2D 때부터 있던 구조, 후속 수정 예정).

## 개발

### 폴더 구성

| 폴더 | 내용 |
|---|---|
| `plugin/` · `package.json` | DSH 플러그인: 호스트·설정 화면(`plugin/client.ts`)·한국어 번역(`plugin/locales.ko.json`)·빌드와 테스트 |
| `character/` | 인앱 캐릭터 TypeScript 소스(고유 행동은 `character/behaviors/`). 빌드하면 `assets/dsc.js`와 `lib/client.js`가 만들어집니다 |
| `assets/` | 빌드된 캐릭터 코드(`dsc.js`)·3D 렌더러 번들(`vendor/rig-three.js`), 대사(`dsc-lines.json`·`dsc-lines-ex.json`)와 Live2D 모델·테마·배경 |
| `docs/` | 대사 추가 가이드(`dialogue-guide.md`)·대사 ex 변환 가이드(`ex-lines-guide.md`)·소개 이미지 |
| `tools/` | 대사 파일 검사기(`check-lines.mjs`)·대사 ex 변환기(`convert-part-lines.mjs`) |
| `lib/` | 빌드된 플러그인 클라이언트(`client.js`) |
| `pet/` | 바깥 펫 창(Electron) 코드 |
| `shared/` | 캐릭터·설정 화면·펫 메뉴가 함께 쓰는 소품·체형 정의 |
| `plugins/dsh-tts/` | 말풍선 음성(TTS) 원본 코드. 0.1.6부터 kr 플러그인에 포함되어 설정 창에서 켭니다 |
| `infographic/` | 소개 영상 최종본과 제작 파일 |

### 빌드와 테스트

```powershell
npm ci
npm run locales     # 설치된 DSH 영어 사전과 비교해 빠진 번역 보고 (todo·merge는 plugin/locales.mjs 참고)
npm run build
npm run typecheck   # TypeScript 타입 검사 (출력 없음)
npm test
```

캐릭터·설정 화면 소스는 TypeScript(`character/*.ts`, `plugin/client.ts`)이고 호스트·펫 메인은 Node가 직접 읽는 JavaScript(`// @ts-check`)입니다. 빌드는 `character/`의 캐릭터 코드와 `plugin/locales.ko.json`으로 플러그인 클라이언트(`lib/client.js`)와 펫 창용 `assets/dsc.js`를 생성합니다. 한국어 번역의 원본은 `plugin/locales.ko.json`입니다. 설정 스키마는 DSH의 `@deepseek-ai/schemastery`를 사용합니다.
빌드된 `lib/client.js`와 `assets/`를 저장소에 포함하므로 Git 주소로 설치할 때 빌드 스크립트를 실행하지 않습니다.
캐릭터 코드·번역·자산을 수정하면 `npm run build`를 실행하고 생성물도 함께 커밋하세요.
사용자가 보게 되는 변경이면 `package.json`의 `version`도 올려 주세요. 플러그인(Plugins) 화면의 버전 표시로 새 버전인지 구분할 수 있습니다.
동작을 바꾸지 않는 리팩터링은 `npm run trace:diff -- <기준 커밋 체크아웃> [--pet]`으로 캐릭터 동작이 프레임마다 같은지 비교할 수 있습니다(기본 테스트에는 들어 있지 않음).

### 대사 수정

대사는 `assets/dsc-lines.json` 한 파일에 있고 런타임에 읽어 오므로 **대사만 고칠 때는 빌드가 필요 없습니다.** 상황 키·태그·길이 규칙은 [`docs/dialogue-guide.md`](docs/dialogue-guide.md)를 따르고, 고친 뒤에는 검사기를 통과시켜 주세요.

```powershell
node tools/check-lines.mjs
```

검사기는 `assets/dsc-lines.json` 전용이며 대사 ex 파일은 검사하지 않습니다 — [대사 ex](#대사-ex-실험적)

### Live2D 모델과 렌더러

이 Live2D 모델의 파일 경로·파라미터·파츠·표정·치수는 `character/model-profile.ts`에 모여 있습니다. 소품·체형 파라미터는 `shared/settings.js`에 있습니다.

동작 코드(`character/index.ts`)는 `character/rig.ts`의 `AvatarRig` 인터페이스를 통해 모델을 움직입니다(`set`·`add`·`multiply`, 표정, 터치 판정, 프레임 진행 등). Live2D 구현은 `character/rig-live2d.ts`, 3D 구현은 `character/rig-three.ts`(FBX)·`character/rig-vrm.ts`(VRM)에 있습니다. 3D 구현은 Live2D 파라미터 이름을 의미 채널로 받아 `avatar.json`의 대응표에 따라 뼈·모프에 적용합니다.

3D 렌더러 번들(`assets/vendor/rig-three.js`)은 3D 모델을 쓸 때만 불러옵니다. 셰이더는 자체 툰 셰이더(`character/toon-material.ts`)를 씁니다.

### 캐릭터 고유 행동

냄비·세숫대야·삐짐·가슴·아랫배 반응·소품 대사 같은 DeepSeek짱 고유 행동은 `character/behaviors/`에 있습니다. 켤 행동은 모델 프로필에 지정합니다. Live2D는 `character/model-profile.ts`의 `BEHAVIORS`, 3D는 `avatar.json`의 `behaviors`를 쓰며 3D의 기본 목록은 비어 있습니다. 목록에 없는 행동의 입력은 평소 탭·끌기 같은 기본 반응으로 처리합니다. 성적 표현이 든 행동(가슴·아랫배)은 VRM 메타가 금지하거나 `avatar.json`에 `"adultAllowed": false`가 있으면 꺼집니다.

### 시선 반응성

눈과 고개가 마우스나 시선 목표를 따라가는 범위·각도·빠르기는 `character/gaze.ts`의 시선 프로필에 모여 있습니다. 기본값은 Live2D 모델에 맞춰져 있습니다. 3D 모델은 `avatar.json`의 `gaze`에 바꿀 값만 적으면 됩니다. 예를 들어 `"gaze": { "responsiveness": 1.5, "headDeg": [30, 18], "bone": { "gain": [0.9, 0.7, 0.5] } }`처럼 씁니다. `responsiveness`는 커서를 조금만 움직여도 시선이 최대로 움직이고 빠르게 따라오도록 하는 배율입니다. `headDeg`·`bone.gain`·`bone.eyeDeg`·`eyeLimit`은 고개·눈이 도는 크기입니다.

### ASAR 패치·포터블 (지원 종료)

예전 방식에 쓰던 ASAR 패치 파일과 포터블 빌드 스크립트(`harness/`)는 저장소에서 삭제했습니다. 필요하면 git 기록에서 찾을 수 있습니다.

## 라이선스

- 이 저장소의 코드: MIT (`LICENSE`)
- 포함된 제3자 구성 요소와 그림: `NOTICE.md`

## 만든 사람

- [@noire113-dev](https://github.com/noire113-dev) — 기획, 테스트, 배경 그림
- [Claude](https://claude.ai) (Anthropic, Claude Code) — 한국어화·인앱 캐릭터 코드, 패치·빌드 도구, 소개 영상 제작, PR 검증·릴리즈
- [Codex](https://openai.com/codex) (OpenAI) — 이슈·PR 작업 계획, 코드 검수, 문서 정리
- [DeepSeek](https://www.deepseek.com) (DeepSeek V4.1 Flash 1017) — 버그 수정, PR 통합·기능 구현, 자동 테스트
- [Opus](https://claude.ai) (Anthropic, Claude Opus) — 기능 통합·릴리즈 작업
- Gemma 4 26B A4B heretic — 대사 ex 작성
- Live2D 모델 원작: Kamiya_Ryoko (VGen @KAMIYA) — `NOTICE.md` 참고

### 기여해 주신 분

- [@conankun](https://github.com/conankun) — 말풍선 TTS와 오디오 기반 입 모양 플러그인 `plugins/dsh-tts` ([#2](https://github.com/noire113-dev/deepseek-chan-plugin-for-dsh-with-KR/pull/2)), 말풍선 꼬리를 얼굴 가운데로 정렬 ([#20](https://github.com/noire113-dev/deepseek-chan-plugin-for-dsh-with-KR/pull/20))
- [@shortstories](https://github.com/shortstories) — Harness 플러그인 메뉴에서 바로 설치하는 방식, 캐릭터·테마·한국어 개별 설정 ([#3](https://github.com/noire113-dev/deepseek-chan-plugin-for-dsh-with-KR/pull/3))
- [@TraceofLight](https://github.com/TraceofLight) — macOS(Apple silicon) 적용 스크립트 ([#4](https://github.com/noire113-dev/deepseek-chan-plugin-for-dsh-with-KR/pull/4)), 승인·질문 카드가 캐릭터에 가려지던 문제 수정 ([#6](https://github.com/noire113-dev/deepseek-chan-plugin-for-dsh-with-KR/pull/6)), Live2D 렌더링 최적화와 시작 시 끊김 완화 ([#7](https://github.com/noire113-dev/deepseek-chan-plugin-for-dsh-with-KR/pull/7)), 말풍선 음성 내장·말풍선 꼬리·캐릭터 자유 위치와 바깥 펫 창 ([#12](https://github.com/noire113-dev/deepseek-chan-plugin-for-dsh-with-KR/pull/12)), 펫 창 대기 오버헤드 감소·짧은 말풍선 꼬리·혼합 배율 모니터 위치 수정 ([#24](https://github.com/noire113-dev/deepseek-chan-plugin-for-dsh-with-KR/pull/24)), 캐릭터 코드 TypeScript 모듈 개편·인트로와 창 크기 변경 중 사라짐 수정·한국어 번역 보강·macOS 앱 아이콘 ([#26](https://github.com/noire113-dev/deepseek-chan-plugin-for-dsh-with-KR/pull/26)), 3D 렌더링 시스템(beta)·캐릭터 행동 시스템·펫 창 3D ([#27](https://github.com/noire113-dev/deepseek-chan-plugin-for-dsh-with-KR/pull/27))
- [@iwannagit](https://github.com/iwannagit) — 파스텔 테마 다크 모드 지원 ([#5](https://github.com/noire113-dev/deepseek-chan-plugin-for-dsh-with-KR/pull/5)), 절전모드와 캐릭터 켜기·끄기 단축키 ([#11](https://github.com/noire113-dev/deepseek-chan-plugin-for-dsh-with-KR/pull/11))
- [@0x2b-or-0xd4](https://github.com/0x2b-or-0xd4) — 단축키를 문자 입력 대신 키 녹음으로 지정 ([#14](https://github.com/noire113-dev/deepseek-chan-plugin-for-dsh-with-KR/pull/14)), 바깥 펫 창 우클릭 메뉴·설정 패널과 크기 조절 ([#16](https://github.com/noire113-dev/deepseek-chan-plugin-for-dsh-with-KR/pull/16)), 캐릭터 이동 키·펫 창·캔버스 단축키 ([#21](https://github.com/noire113-dev/deepseek-chan-plugin-for-dsh-with-KR/pull/21))
- [@ByungHyun21](https://github.com/ByungHyun21) — 자산 응답 캐시(ETag·304)로 새로고침 속도 개선, 질문 카드 감지를 안정적인 data 속성으로 수정 ([#17](https://github.com/noire113-dev/deepseek-chan-plugin-for-dsh-with-KR/pull/17)), 모바일 입력창·키보드 회피 ([#19](https://github.com/noire113-dev/deepseek-chan-plugin-for-dsh-with-KR/pull/19)), 모바일 패널 배경 수정 ([#23](https://github.com/noire113-dev/deepseek-chan-plugin-for-dsh-with-KR/pull/23)), 동물귀 숨기기 제안 ([#22](https://github.com/noire113-dev/deepseek-chan-plugin-for-dsh-with-KR/issues/22))
- [@mayoxz](https://github.com/mayoxz) — 설치본 아이콘 모듈 누락 제보와 원인 분석 ([#18](https://github.com/noire113-dev/deepseek-chan-plugin-for-dsh-with-KR/issues/18))

기능과 개선 사항을 보내 주신 모든 분께 감사드립니다.
