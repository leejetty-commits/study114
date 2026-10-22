# 277-1 지시서 — 팝업 끌어서 옮기기: 공용 함수 + 이미 끌리는 팝업 맞추기

- 기준: origin/main aff249a1 (2026-10-23 줄 번호 다시 확인함). 브랜치: cursor/277-1-popup-drag-shared-20261021
- 시작 전: `git fetch origin && git merge-base --is-ancestor aff249a1 origin/main && echo OK || echo MISSING` → MISSING이면 멈추고 보고. 줄 번호는 main에서 다시 확인, 많이 달라졌으면 멈추고 보고.
- **291(프라임 contain+흐림)이 지금 작업 중.** 291 파일은 고치지 않는다: src/Media/PromoImageProcessor.php, src/Media/PromoImageSpec.php, preview/shared/promo-image.js, preview/study-room-ui/src/styles/register.css, preview/home-ui/src/tutor-reg/profile-photos.js. 고쳐야 하면 멈추고 보고.
- 마이샵 사진 크게 보기(myshop-render.js)는 이번에 안 함.
- 277-2(나머지 팝업 붙이기)는 277-1 병합 후 시작.

## 0-1. 종현에게 물을 것
- 없음. (확대카드 p24 끌기 막대는 지금 화면 그대로 두고 함수만 바꾸는 것을 추천 — 277-2 표 참고)

## 1. 규칙
- 데스크톱만: `matchMedia('(min-width: 721px) and (pointer: fine)')`가 참일 때만 끌기. 390 폭·손가락 화면은 지금처럼 가운데 고정.
- 제목 부분(머리줄)을 잡고 끈다. 머리줄 안 버튼·입력칸(닫기 X 등)은 끌기 시작 안 함.
- 화면 밖으로 못 나감: 팝업 전체가 창 안(가장자리 8px)에 있어야 함. 창보다 크면 위·왼쪽 8px에 붙임. 창 크기 바뀌면 다시 안으로.
- 다시 열면 가운데: 닫을 때 위치 기억 안 함. 열 때마다 inline left/top/transform을 지우고 원래 가운데 배치.

## 2. 공용 함수 (하나만)
- preview/shared/draggable-dialog.js `bindDraggableDialog(dialog, handle, options)`
  - 지금: 96px만 보이면 화면 밖 허용, 데스크톱 판별 없음, 다시 열 때 가운데 복귀 없음 → 위 규칙으로 바꾼다.
  - 반환값: `{ reset(), destroy() }` 추가. reset = 가운데 복귀, destroy = 이벤트 해제(resize 포함).
  - options.handleSelector 기본값 없음(지금 호출과 같게 handle 요소 받음).
- 같은 파일 안에 `isDesktopDragEnabled()` 내보내기.

## 3. 허용 파일 (지금 bindDraggableDialog를 부르는 곳 — 호출 줄만 맞춤)
| 화면 | 파일:줄 | 모드 |
|---|---|---|
| 과외쌤 기본정보 고치기 | preview/tutor-ui/src/screens/step-basic.js:182 (bind :313) | 과외쌤 |
| 공부방 기본정보 고치기 | preview/study-room-ui/src/screens/step-basic.js:172 (bind :272) | 공부방 |
| 사진 자르기 | preview/shared/promo-image.js:88 (bind :110-113) | 공부방·과외쌤 — **고치지 않음(291 파일)**. 지금 호출 `bindDraggableDialog(dialog, title)` 그대로 새 규칙이 적용되게 공용 함수 쪽에서 맞춤. 열 때마다 새로 만드는 창이라 reset 불필요 |
| 공부방 상세 고치기(홈 안) | preview/home-ui/src/study-room-reg/embedded-panels.js (bind :463-466) | 공부방 |
| 공용 함수 | preview/shared/draggable-dialog.js 전체 | — |
| 머리줄 커서 | 이미 다 있음: tutor-ui/src/styles/register.css:125, study-room-ui/src/styles/register.css:229·:820(`cursor: move`) → **css 고치지 않음**(study-room-ui register.css는 291 파일) | — |
- 반환값을 안 받는 지금 호출도 그대로 동작해야 함(promo-image.js 때문).
- import 줄: 위 4파일(tutor step-basic.js:29, study-room step-basic.js:24, embedded-panels.js:18, promo-image.js:6)의 `import { bindDraggableDialog } from '…/draggable-dialog.js'` 그대로(이름 안 바꿈).

## 4. 하지 않는 것
- 새 팝업에 붙이기(277-2), 확대카드 p24(detail-shell.js) 바꾸기, 팝업 모양·크기·문구, 모바일 동작, 관리자 화면.

## 5. 확인 (1280 · 390)
- 1280: 4개 팝업 머리줄 잡고 끌기 → 가장자리에서 멈춤(4방향), 닫고 다시 열면 가운데. 창 줄이면 안으로 들어옴. X 버튼은 바로 닫힘.
- 390(모바일 모드): 끌리지 않음, 원래 자리.
- 사진 자르기 안 끌기 영역(자르는 틀)은 팝업이 같이 안 움직임.
- 로컬 새 테스트 계정만. 운영·라이브 쓰기 금지.

## 6. 멈출 때
- 어떤 팝업이 열 때 다시 만들지 않고 숨김만 해서 reset 위치를 못 잡을 때 → 그 팝업 이름·줄 보고하고 나머지 진행.
- 291 파일(위 5개)을 고쳐야 할 때 → 멈추고 보고.
- css를 고쳐야 할 때 → 멈추고 보고.

## 7. 커밋 나누기
1. 277-1 fix(dialog): 끌기 공용 함수 — 데스크톱만, 화면 안, 다시 열면 가운데
2. 277-1 fix(dialog): 기존 3개 팝업 호출을 새 함수에 맞춤(promo-image.js 제외)

## 7-1. 지키기
- 브랜치에만 push. merge·force-push·`git add -A` 금지. 고친 파일만 `git add <파일>`. 모든 검사 초록. 잠금 검사는 기준 커밋(REF) 올리기만 허용, 비교 코드·예외 변경·끄기·건너뛰기 금지. docs 커밋 금지.

## 8. 보고
- 커밋 2줄, 파일:줄, 1280에서 네 방향 끝까지 끈 스크린샷 1장씩(한 팝업), 390 1장. 쉬운 말로.
