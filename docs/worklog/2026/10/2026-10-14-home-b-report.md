# 작업 B 리포트 — 이달의 베스트 빨강 띠·팝업 + 0건 빈 팝업 (218-4 · 218-7)

작성: Cursor 메인 에이전트, 2026-10-14. 지시서 `docs/design/home-banner-rail-2026-10-14/222-cursor-directive-B.md`. 기준 main `ddcee2d2` (`f167481`의 뒤). 218-6·218-8은 손대지 않음.

## 브랜치

- 브랜치: `cursor/home-b-best-red-20261014`
- 커밋: `ed4d6a1f990f52f4a0e5ba8b52503321d33ba386` (`ed4d6a1f`)
- main 병합: 하지 않음. 검수·승인 전.

## 1절 행 번호

고치기 전 `origin/main`에서 R1–R8이 지시서와 같았다. R5 파일 끝은 904행 `}`. 멈추지 않고 진행.

## 바꾼 파일과 줄

허용 2개만. `renderBestSection` 밖과 `railStateBody`는 그대로.

1. `preview/home-ui/src/right-rail.js` — `renderBestSection` 안 (기존 489행부터). 0건이고 받기가 끝났을 때만 띠·빈 문구를 `data-concern-best-open` 버튼으로. 글이 있으면 띠는 `div` 그대로.
2. `preview/home-ui/src/styles/home-right-rail.css`
   - `.live-rail-slot--best`만 `--rail-tone-hot` (`#BE123C`). 고민방 칸은 보라 그대로.
   - `concern-best` 팝업만 같은 빨강. `concern-room` 팝업은 보라 그대로.
   - 파일 끝에 `.live-rail-best__open` (버튼 폭·빈 문구 여백·초점 링).

## 직접 잰 값 (24칸)

로컬 `http://127.0.0.1:5183`. 같은 포트에서 고치기 전(main)과 고친 뒤를 재어 띠 위치·레일 순서를 비교했다. 0건은 `concern-hot.php?view=best`의 `boards: {}`, 글 있음은 방마다 반응 9인 글 1개.

공통 (24칸 모두):

| 항목 | 고친 뒤 |
|---|---|
| 베스트 띠 배경 | `rgb(190, 18, 60)` |
| 제목 글자 | `rgb(255, 255, 255)`, 대비 **6.29:1** |
| 띠 위치·크기 | main과 같음. 1280 `1026/221/34`, 1023 `34/956/34`, 390 `18/355/34` |
| 레일 맨 위 | 베스트 |
| 레일 순서 | main과 같은 문자열. 공부방·과외쌤·비회원 `best│room×3│field│action│info×3`, 학생 `best│room│field│action│info` |
| 고민방 칸 띠 | `rgb(109, 40, 217)` |
| 베스트 팝업 머리 | `rgb(190, 18, 60)` |

0건 (12칸):

| 모드 | 여는 방 | 팝업 제목 |
|---|---|---|
| 공부방 | `concern-director` | 공부방 고민방 · 이달의 베스트 |
| 과외쌤 | `concern-tutor` | 과외쌤 고민방 · 이달의 베스트 |
| 학생 | `concern-parent` | 학생/학부모 고민방 · 이달의 베스트 |
| 비회원 | `concern-parent` | 학생/학부모 고민방 · 이달의 베스트 |

띠와 빈 문구 둘 다 `button` + `data-concern-best-open`. 빈 문구 「이달의 베스트, 아직 글이 미도착중...」, 「게시판에서 보기」가 있다. Enter·Space로 열리고, Esc 뒤 초점은 띠 버튼(`live-rail-slot__band live-rail-best__open`). 초점 링은 `solid 2px rgb(28, 25, 23)`, `:focus-visible` 참.

글 있음 (12칸): 띠는 `div`. 줄 클릭 시 `concern-best` 팝업, 머리띠만 빨강. 본문에 「글을 불러오는 중 길이 막혔어요…」가 같이 보이는데, 팝업이 따로 부르는 주소를 흉내 내지 않아서이고 main도 같다.

고치기 전 main: 띠·팝업 `rgb(109, 40, 217)`, 0건 클릭 시 팝업 없음.

## 그림

`docs/worklog/2026/10/img/`

- `2026-10-14-home-b-empty-popup-1280-studyroom.png`
- `2026-10-14-home-b-empty-popup-390-studyroom.png`
- `2026-10-14-home-b-posts-popup-1280-studyroom.png`
- `2026-10-14-home-b-posts-popup-390-studyroom.png`
- `2026-10-14-home-b-focus-ring-1280.png`

## 지시와 다르게 한 점

- 이 PC에 Python이 없어, 지시서 스크립트와 같은 페이지·폭·로그인·베스트 흉내를 Node Playwright + 설치된 Chrome으로 재었다.
- 베스트 칸이 보일 때까지 기다린 뒤 500ms를 더 뒀다. 고정 1800ms만 쓰지 않았다.
- 그림은 브랜치 커밋에 넣지 않고 이 리포트와 함께 main 기록에 넣었다. 브랜치 커밋은 허용 파일 2개만 있다.

## 확인하지 못한 항목

- 운영 사이트. 이 브랜치는 main에 합치지 않았고 배포하지 않았다.
- 받는 중·실패 화면은 따로 흉내 내지 않았다. 버튼은 `status === 'ready'`이고 0건일 때만 그린다.
- 글 있음 팝업의 본문 불러오기는 지시서대로 고치지 않았다.
