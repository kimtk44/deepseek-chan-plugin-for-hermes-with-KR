# 인포그래픽 광고 다시 만들기

Harness 화면을 캡처하는 대신 캐릭터를 직접 렌더링한 광고 영상의 원본입니다.

- `index.html` : 장면·자막·설명선·캐릭터 연기 시간표 (모든 애니메이션은 녹화 시계 기준)
- `DeepSeekHarness_인포그래픽.mp4` : 최종 영상 (57초, 1920×1080)
- `stage.js` : 캐릭터 무대 (Harness 인앱 펫과 같은 모델·3판 움직임). `node build-stage.cjs`로 다시 만듭니다
- `assets/` : 저장소에 없음. 저장소 루트의 `../assets/`(플러그인 공통 캐릭터 자산)를 이 폴더의 `assets/`로 복사합니다
- 렌더링: `npx electron@45 record.cjs index.html 57 frames` (Electron 45, 프레임을 frames/ 에 저장)
- 영상: `ffmpeg -framerate 30 -i frames/f%05d.jpg -c:v libx264 -crf 16 -pix_fmt yuv420p out.mp4`
