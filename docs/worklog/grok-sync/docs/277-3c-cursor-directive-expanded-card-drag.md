# 277-3c 지시서 — 확대카드 끌기 (로그인 상태)

- 브랜치: `cursor/277-3c-expanded-card-drag-20261023` (origin/main에서 새로 딴다)
- 기준 커밋: **d9511b89f749ddb8ef655c42bee3dd56de1e4faf** (main, 277-3a 합친 뒤). 줄 번호는 모두 이 커밋 기준이다.
- 시작 전: `git fetch origin && git merge-base --is-ancestor d9511b89 origin/main && echo OK || echo MISSING` → MISSING이면 멈추고 보고. main이 더 새로우면 그 main으로 하되, 아래 줄 번호를 다시 확인하고 보고에 적는다.

## 왜 하나
- 종현 결정(2026-10-23):
  1. 로그인 상태의 확대카드도 데스크톱에서 끌려야 한다.
  2. 끌다가 카드 바깥에서 손을 놓아도 **닫히면 안 된다** ("안닫혀야 해").
- 지금 확대카드의 자기 끌기(`detail-shell.js:161-237`)는 비회원일 때만 켜진다(:293, :352). 그런데 공부방·과외쌤 확대카드는 비회원이면 열리지 않는다(:243-244). 그래서 실제로 보는 확대카드는 끌기가 없다.
- 로그인 상태 확대카드는 화면 전체를 덮는 바탕(:296-301)이라, 277-2 자동 끌기가 일부러 건너뛴다. 안쪽 상자에 표시가 없기 때문이다.
- 지금은 머리줄을 누른 채 바깥에서 놓으면 :393-396의 "바탕을 누르면 닫기"가 돌아서 확대카드가 닫힌다.

## 1. 고칠 파일 (이것 하나만)
`preview/home-ui/src/detail-decision/detail-shell.js`

| 줄 | 할 일 |
|---|---|
| :303 | 확대카드 상자 `<div class="modal p24-modal…">`에 **비회원이 아닐 때만** `data-drag-box` 속성을 더한다. (`floating`이 거짓일 때만) |
| :313 | 머리줄 `<header class="modal__head p24-modal__head">`에 **비회원이 아닐 때만** `data-drag-handle` 속성을 더한다. 비회원일 때 붙는 `data-p24-drag-handle`은 그대로 둔다. |
| :393-396 | 바탕 누르면 닫기: **누름이 바탕에서 시작하고 바탕에서 끝났을 때만** 닫는다. 확대카드 안에서 누르기 시작해 바깥에서 놓으면 닫지 않는다. 방법: 같은 `if (!floating)` 안에서 `wrap`에 `pointerdown`을 달아 `e.target === wrap`인지 기억하고, `click`에서 그 기억과 `e.target === wrap`이 둘 다 참일 때만 `closeDetailModal()`을 부른다. |

- 끌기 동작(8px 안쪽, 390 고정, 다시 열면 가운데, 버튼은 끌기 안 함)은 277-2 자동 끌기와 공용 함수가 한다. **새 끌기 코드를 만들지 않는다.** `bindDraggableDialog`를 직접 부르지도 않는다.
- 위 표 말고는 한 글자도 바꾸지 않는다. 태그·클래스·문구·role·aria·다른 이벤트는 그대로.

## 2. 금지
- 비회원 끌기: `bindFloatingDrag` :161-237, 끌기 막대 :306(-311), 부르는 곳 :352
- `preview/shared/dialog-drag-auto.js`, `preview/shared/draggable-dialog.js`
- 모든 CSS 파일 (`home-listings.css` 포함)
- 277-1에서 직접 붙인 4곳 (`tutor-ui/src/screens/step-basic.js`, `study-room-ui/src/screens/step-basic.js`, `home-ui/src/study-room-reg/embedded-panels.js`, `shared/promo-image.js`)
- 277-3a 파일 6개, 277-3b 파일 5개
- 검사 스크립트, 기준 사진, `main.js` import
- merge, force-push, `git add -A` 금지. `git add preview/home-ui/src/detail-decision/detail-shell.js`만.
- 이 지시서와 docs는 commit/push 하지 않는다.

**멈춤 규칙:** 다른 파일이나 위 표에 없는 변경이 필요하면 멈추고 보고한다. 다른 파일이 바뀌었거나 표에 없는 변경이 있으면 그것만으로 **불합격**이다.

## 3. 커밋
1. `277-3c feat(detail): 로그인 확대카드 끌기 표시 + 끌다 바깥에서 놓아도 안 닫힘`

## 4. 합격 기준
1280 (스크롤 막대가 보이는 긴 페이지에서 시작. 확대카드가 열리면 스크롤이 잠겨 막대가 사라질 수 있다. 열기 전·후 `innerWidth`, `document.documentElement.clientWidth` 값을 보고에 적는다), 로그인 상태에서 공부방·과외쌤 확대카드 **각각**:
- 머리줄을 끌면 확대카드 상자만 움직이고, 회색 바탕은 그대로다(바탕 위치 0,0 / 너비 그대로).
- 왼쪽·위, 오른쪽·아래로 끝까지 끌면 보이는 화면 안쪽 8px에서 멈춘다(숫자를 적는다).
- 끌다가 확대카드 바깥에서 놓아도 닫히지 않는다.
- 바탕을 그냥 한 번 누르면 전처럼 닫힌다.
- 닫기 버튼은 바로 닫힌다. 머리줄 안의 버튼·링크는 끌기를 시작하지 않는다.
- 닫았다 다시 열면 가운데에서 열린다.
- 끌기 붙임은 상자 한 곳뿐이다(`[data-drag-bound]` 1개).

390:
- 확대카드는 원래 자리 그대로이고 끌리지 않는다. 스크롤은 정상이다. 바탕 누르면 닫기도 전과 같다.

비회원 학생 확대카드:
- 전처럼 자기 끌기(끌기 막대)만 되고, `data-drag-bound`가 붙지 않는다(두 번 붙지 않음).

검사:
- 미리보기 5개(auth·home·search·study-room·tutor) 빌드 성공.
- `verify-home-news-row` 226건 모두 통과.
- `verify-rail-info-banners` 실패는 main에서도 실패하는 2건(`search_blocked_paint_refreshes_rail`, `e_no_literal_copy_in_screen_files`)뿐.
- CI 초록.

## 5. 스크린샷 (5장)
1. `1280-room-dragged.png` — 공부방 확대카드를 끌어 옮긴 모습 (바탕 그대로)
2. `1280-tutor-dragged.png` — 과외쌤 확대카드를 끌어 옮긴 모습
3. `1280-released-outside.png` — 끌다 바깥에서 놓은 뒤에도 열려 있는 모습
4. `390-room.png` — 390 원래 자리
5. `1280-guest-student.png` — 비회원 학생 확대카드, 자기 끌기 막대

## 6. 보고 (쉬운 말로)
- 커밋 해시, 바꾼 줄(파일:줄)
- 위 합격 기준 항목별 결과와 숫자
- 스크린샷 경로
