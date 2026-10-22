# 277-5 지시서 — 확대카드 끌기를 공용 함수로 + 확대카드 「벗어납니다」 확인창 끌기

- 브랜치: `cursor/277-5-popup-drag-expanded-card-20261023`
- 기준 커밋: **5c57dcf8** (Merge 277-1). 줄 번호는 모두 5c57dcf8 기준이다.
- 시작 전: `git fetch origin && git merge-base --is-ancestor 5c57dcf8 origin/main && echo OK || echo MISSING` → MISSING이면 멈추고 보고. 줄 번호가 많이 달라졌으면 멈추고 보고.
- 브랜치는 origin/main에서 새로 딴다.
- 공용 함수: `preview/shared/draggable-dialog.js`의 `bindDraggableDialog(dialog, handle)`(:19). **이 파일은 고치지 않는다.**
- import 줄은 277-1 파일을 그대로 본뜬다(예: `preview/home-ui/src/study-room-reg/embedded-panels.js:18`의 `import { bindDraggableDialog } from '../../../shared/draggable-dialog.js';`처럼 상대경로).

종현 결정(2026-10-23 t2398): 모든 팝업을 끌 수 있게 한다. 확대카드는 이미 자기만의 끌기(bindFloatingDrag)가 있다. 이것을 공용 함수로 바꿔서 규칙(8px, 창 크기, 390, 다시 열면 가운데)을 맞춘다. 이름은 항상 「확대카드」라고 쓴다.

## 1. 이번에 붙일 팝업 (5c57dcf8 기준)
| # | 팝업 | 팝업 뿌리 파일:줄 | 잡는 곳(handle) | 누가 봄 |
|---|---|---|---|---|
| 1 | 확대카드 | preview/home-ui/src/detail-decision/detail-shell.js:300 (wrap, openDetailModal :242, 자체 끌기 bindFloatingDrag :161-237, 호출 :352) | 지금 끌기 막대 `.p24-modal__dragbar`(data-p24-drag-handle, :306). 떠 있는 확대카드가 아니면(:303 floating 아님) 지금처럼 막대 없음. 그때는 `.modal` 머리줄을 handle로 | 모두 |
| 2 | 「이 카드를 벗어납니다」 확인창 | preview/home-ui/src/detail-decision/detail-utils.js:228 (confirmLeaveDetailCard :215) | `.p24-leave-confirm__title`(:234)이 든 줄 | 모두 |

## 2. 고칠 파일 (이것만)
1. preview/home-ui/src/detail-decision/detail-shell.js
2. preview/home-ui/src/detail-decision/detail-utils.js

## 주의 (292와 겹치는 CSS)
- 확대카드 끌기 막대 CSS는 `home-listings.css:2150-2185`(292 파일)와 `search-ui/src/styles/handoff-bridge.css:126-150`에 있다. **CSS는 고치지 않는다.**
- 지금 CSS는 끄는 동안 `.p24-modal--floating.is-dragging`(home-listings.css:2161)을 쓴다. 공용 함수는 `is-dragging`을 붙이지 않으므로, detail-shell.js에서 pointerdown·pointerup 때 이 클래스를 붙였다 떼는 것으로 지금 모양을 지킨다.
- 그래도 CSS를 바꿔야 하면 멈추고 보고한다. 그때는 292 병합 뒤에 다시 한다.
- 확대카드 안 버튼(찜·쪽지·닫기 등)이 안 눌리게 되면 #1은 되돌리고 보고한다.
- 「위치 기억 없음」: 닫고 다시 열면 가운데에서 열린다. 지금 위치를 저장하는 코드가 있으면 그 동작만 공용 규칙에 맞춘다. 저장 코드를 지워야 하면 지우기 전에 보고에 적는다.

## 공통 규칙 (277-1과 같음)
- 끌기는 데스크톱(창 너비 721px 이상 + 마우스)에서만, **제목 줄(머리줄)**을 잡을 때만 된다.
- 팝업은 창 안쪽 8px 안에 머문다. 창 크기를 바꾸면 안으로 다시 들어온다(공용 함수가 함).
- 닫기 버튼·입력칸·링크를 누를 때는 끌기가 시작되지 않는다(공용 함수가 함).
- 390px(모바일)에서는 원래 자리에 그대로 있고 끌리지 않는다.
- 팝업을 열 때 `bindDraggableDialog`를 부르고, 닫을 때 돌려받은 `destroy()`를 부른다. 다시 열면 가운데에서 시작한다(위치를 기억하지 않는다).
- 머리줄이 없는 팝업은 제목(h2/h3)이 든 첫 줄 요소를 handle로 쓴다. 그것도 없으면 그 팝업은 건너뛰고 보고에 적는다.
- 팝업의 모양·크기·문구·열고 닫는 조건, 모바일 동작은 바꾸지 않는다.
- **CSS는 고치지 않는다.** 꼭 필요하면 멈추고 보고한다.

## 금지
- merge, force-push, `git add -A` 금지. 파일은 하나씩 `git add <파일>`로 올린다.
- 이 지시서, docs, 체크리스트는 commit하지 않는다.
- 아래 「고칠 파일」 밖의 파일이 필요하면(범위 밖) 멈추고 보고한다.
- 292 파일은 건드리지 않는다: `exposure-render.js`, `card-visual.js`, `home-listings.css`, `search-visily.css`, `design-system.css`, `scripts/verify-card-badge-layout.mjs`.
- 277-1 파일은 건드리지 않는다: `preview/shared/draggable-dialog.js`, 두 `step-basic.js`, `study-room-reg/embedded-panels.js`, `preview/shared/promo-image.js`.
- 새 테스트 계정만 쓴다. 기존 데이터는 지우지 않는다. 라이브 사이트는 열지 않는다. 쪽지 실제 발송·결제·회원 삭제는 하지 않는다.
- 모든 검사가 초록이어야 한다. 잠긴 검사가 이 파일들 때문에 실패하면, 기준 커밋(`*_REF`/`BASE`) 올리기만 허용한다. 비교 코드·예외를 바꾸거나 검사를 끄거나 건너뛰는 것은 금지다. 그 밖의 실패는 멈추고 보고한다.

## 커밋 나누기
1. `277-5 refactor(dialog): 확대카드 끌기를 공용 함수로(#1)`
2. `277-5 feat(dialog): 확대카드 벗어남 확인창(#2)`

## 로컬 확인
- `npm run build`(또는 각 preview 빌드)와 `npm test`·관련 `verify:*` 전부 초록.
- 로컬 미리보기에서 1280px:
  - 표의 팝업을 하나씩 열어 머리줄을 끌면 따라 움직이고, 창 끝 8px에서 멈춘다.
  - 창 크기를 줄이면 안으로 돌아온다.
  - 닫고 다시 열면 가운데에서 열린다.
  - 닫기 버튼을 누르면 끌리지 않고 바로 닫힌다.
- 확대카드를 막대로 끌고, 막대의 「×」를 누르면 끌리지 않고 닫힌다.
- 확대카드 안에서 다른 화면 링크를 눌러 #2 확인창이 뜨면, 그것도 끈다.
- 390px: 모두 원래 자리이고 끌리지 않으며, 스크롤도 정상이다.
- 아무 팝업이나 끝까지 끈 1280 스크린샷 2장과 390 스크린샷 1장을 남긴다.

## 보고 (쉬운 말로)
- 커밋 해시와 바꾼 파일:줄
- 표에 결과 칸(됨 / 건너뜀 + 이유)
- 올린 기준선이 있으면 파일:줄, 전→후
- 스크린샷 경로
