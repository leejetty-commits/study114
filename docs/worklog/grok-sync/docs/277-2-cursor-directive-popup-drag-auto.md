# 277-2 지시서 — 팝업 끌기 자동으로 붙이기 (한 곳에서)

- 브랜치: `cursor/277-2-popup-drag-auto-20261023`
- 기준 커밋: **7562ee43** (main). 줄 번호는 모두 7562ee43 기준이다. main이 더 새로우면 그 main으로 하되, 줄 번호를 다시 확인한다.
- 시작 전: `git fetch origin && git merge-base --is-ancestor 7562ee43 origin/main && echo OK || echo MISSING` → MISSING이면 멈추고 보고. 277-1 머지(5c57dcf8)도 같은 방법으로 확인한다.
- 브랜치는 origin/main에서 새로 딴다.

종현 결정(2026-10-23): 팝업마다 따로 붙이지 않고, **한 곳에서 자동으로** 끌기를 붙인다. 이번 지시서가 그 한 곳이다. 예외 표시는 277-3a·277-3b에서 한다.

## 1. 고칠 파일 (이것만, 7개)
1. **새 파일** `preview/shared/dialog-drag-auto.js`
2. `preview/shared/draggable-dialog.js` (붙였다는 표시 한 줄만)
3. `preview/auth-ui/src/main.js` — 마지막 import 줄(:27) 아래에 한 줄
4. `preview/home-ui/src/main.js` — 마지막 import 줄(:125) 아래에 한 줄 (관리자 화면도 home-ui 안에 있어서 여기로 함께 된다)
5. `preview/search-ui/src/main.js` — :27 아래
6. `preview/study-room-ui/src/main.js` — :43 아래
7. `preview/tutor-ui/src/main.js` — :44 아래

넣을 한 줄은 `import '../../shared/dialog-drag-auto.js';` 하나다(5개 main.js가 모두 `../../shared/` 경로를 이미 쓴다).

확대카드 파일(`preview/home-ui/src/detail-decision/detail-shell.js`)은 **고치지 않는다.** 자동 파일 안에서 `[data-p24-drag-handle]`이 든 팝업을 건너뛰게 한다(아래 2-4).

## 2. 자동 파일이 하는 일 (`dialog-drag-auto.js`)
1. `document.body`에 MutationObserver 하나를 단다. 지켜볼 것은 childList·subtree, 그리고 attributes 중 `hidden`·`class`·`open`이다.
2. 팝업 찾기: `[role="dialog"]`, `[data-drag-box]`, `dialog` 요소.
3. **움직일 상자** 정하기:
   - 안에 `[data-drag-box]`가 있으면 그 요소. 팝업 자신에 `data-drag-box`가 있으면 팝업 자신.
   - 없으면 팝업 자신.
   - 화면 전체를 덮는 바탕(backdrop)은 추측으로 고르지 않는다. 바탕형은 277-3a/3b에서 `data-drag-box`를 붙인다.
4. **건너뛰기** (아무것도 안 붙인다):
   - 팝업이나 그 조상에 `data-no-drag`가 있을 때.
   - 안에 `[data-p24-drag-handle]`가 있을 때. 확대카드는 자기 끌기(`detail-shell.js:161-237`, 부르는 곳 :352, 끌기 줄 :306)가 있다.
   - 상자에 `data-drag-bound`가 이미 있을 때. 277-1에서 직접 붙인 4곳(`tutor-ui/src/screens/step-basic.js:319`, `study-room-ui/src/screens/step-basic.js:278`, `home-ui/src/study-room-reg/embedded-panels.js:471`, `shared/promo-image.js:111`)이 여기에 해당한다.
   - 잡을 곳(아래 5)을 못 찾을 때.
5. **잡을 곳(handle)** 정하는 순서:
   1. 상자 안의 `[data-drag-handle]`
   2. 상자 안의 첫 `header`, 또는 클래스 하나가 정확히 `__head`나 `__header`로 끝나는 요소. `review-sheet__headline` 같은 비슷한 이름은 아니다.
   3. `aria-labelledby`가 가리키는 제목. 상자의 직접 자식이면 그 제목 자체, 아니면 제목이 든 상자의 직접 자식 줄.
   4. 그 밖에는 건너뛴다(보고에 적는다).
6. 붙이기는 `bindDraggableDialog(상자, 잡을곳)`(`draggable-dialog.js:19`)를 그대로 부른다. 끌기 규칙은 이 함수가 한다. **새 끌기 코드를 따로 만들지 않는다.**
7. **다시 열면 가운데**:
   - 팝업이 숨겨질 때(`hidden` 생김, display none, `open` 빠짐) 돌려받은 `reset()`을 부른다.
   - 다시 보일 때도 가운데에서 시작해야 한다.
   - 팝업이 문서에서 빠지면 `destroy()`. 공용 함수 :121도 이미 한다.
8. 한 상자에는 한 번만 붙인다. WeakMap으로 기억한다.
9. 페이지를 처음 열 때 이미 있는 팝업도 한 번 훑는다.
10. 지켜보기는 가볍게 한다. 바뀐 노드 안에서만 `querySelectorAll`로 찾고, 한 번에 모아서(requestAnimationFrame이나 microtask) 처리한다.

## 3. `draggable-dialog.js` 고칠 점 (이것만)
- `bindDraggableDialog`가 붙일 때 `dialog.dataset.dragBound = '1'`을 넣는다. :26 `bar.classList.add(...)` 근처에 넣는다.
- `destroy()` 때 이 표시를 지운다.
- 다른 줄(규칙·EDGE·z-index·resize)은 바꾸지 않는다.

## 공통 규칙 (277-1과 같음)
- 끌기는 데스크톱(창 너비 721px 이상 + 마우스, `DESKTOP_DRAG_QUERY`)에서만, 제목 줄을 잡을 때만 된다.
- 창 안쪽 8px 안에 머문다. 창 크기를 바꾸면 안으로 다시 들어온다.
- 닫기 버튼·입력칸·링크를 누를 때는 끌기가 시작되지 않는다.
- 390px에서는 원래 자리 그대로이고 끌리지 않는다.
- 닫으면 떼고, 다시 열면 가운데에서 열린다.
- 팝업의 모양·크기·문구·열고 닫는 조건은 바꾸지 않는다. **CSS는 고치지 않는다.** 꼭 필요하면 멈추고 보고한다.

## 정식 속성 (이번에 정한다)
- `data-no-drag`: 이 팝업은 자동 끌기를 하지 않는다.
- `data-drag-box`: 이 요소를 움직인다(바탕이 아니라 안쪽 상자).
- `data-drag-handle`: 여기를 잡고 끈다.
- 자동 파일 맨 위 주석에 이 세 가지를 짧게 적는다.

## 금지
- merge, force-push, `git add -A` 금지. 파일은 하나씩 `git add <파일>`로 올린다.
- 이 지시서, docs, 체크리스트는 commit/push 하지 마라.
- 위 7개 밖의 파일이 필요하면(범위 밖) 멈추고 보고한다.
- 292 파일은 건드리지 않는다: `exposure-render.js`, `card-visual.js`, `home-listings.css`, `search-visily.css`, `design-system.css`, `scripts/verify-card-badge-layout.mjs`. 확대카드 끌기 CSS(`home-listings.css:2150-2185`)도 292 파일이라 건드리지 않는다. 확대카드 JS는 `detail-shell.js`이고 292 파일이 아니지만, 이번에는 고치지 않는다.
- 277-1 파일 중 `draggable-dialog.js`는 위 3의 표시 한 줄만 허용한다. 두 `step-basic.js`, `embedded-panels.js`, `promo-image.js`는 건드리지 않는다.
- confirm()/prompt()는 그대로 둔다(277-7 몫).
- 새 테스트 계정만 쓴다. 기존 데이터는 지우지 않는다. 라이브 사이트는 열지 않는다. 쪽지 실제 발송·결제·회원 삭제는 하지 않는다.
- 모든 검사가 초록이어야 한다. 잠긴 검사가 이 파일들 때문에 실패하면 기준 커밋(`*_REF`/`BASE`) 올리기만 허용한다. 비교 코드·예외를 바꾸거나 검사를 끄거나 건너뛰는 것은 금지다. 그 밖의 실패는 멈추고 보고한다.

## 커밋 나누기
1. `277-2 feat(dialog): 자동 끌기 파일 + draggable-dialog 표시`
2. `277-2 feat(dialog): 5개 앱 main.js에 자동 끌기 연결`

## 로컬 확인
- 각 preview 빌드, `npm test`, 관련 `verify:*`가 전부 초록이어야 한다.
- 반드시 `scripts/verify-rail-info-banners.mjs`(특히 :799, :1199의 `#rail-popup [role="dialog"]` 확인)와 `scripts/verify-home-news-row.mjs`(:732)를 돌려 초록인지 본다.
- 1280px에서 확인한다.
  - 자동으로 끌려야 하는 팝업:
    - 홈 공지·이벤트·광고 팝업 (`home-popup/mount.js:43`, `:66`, `:93`)
    - 레일 팝업 (`rail-popup.js:249`)
    - 비교 (`compare-modal.js:180`)
    - 찜 (`user-actions-ui.js:102`)
    - 결제 상세 (`plans/receipt.js:12`)
    - 등록 확인 서랍 (`registration-check-edit.js:164`)
    - 메일 인증 (`email-verify-overlay.js:14`)
    - 관리자 모달 (`a28-screens-bind.js:281`, `:370`)과 관리자 서랍 (`a28-screens-shared.js:60`)
  - 각각 머리줄을 끌면 따라 움직이고 8px에서 멈춘다. 창을 줄이면 안으로 돌아온다. 닫았다 열면 가운데에서 열린다. 닫기 버튼은 바로 닫힌다.
  - 확대카드는 전과 똑같이 자기 끌기만 되어야 한다(두 번 붙지 않음).
  - 277-1의 4곳도 전과 똑같아야 한다.
- 390px: 모두 원래 자리이고 끌리지 않으며, 스크롤도 정상이다.
- 바탕형 팝업(비회원 막이 등)은 이번에는 **안 끌려야 정상**이다(277-3a/3b 몫). 화면 전체가 움직이면 실패다.
- 1280 스크린샷 2장, 390 스크린샷 1장을 남긴다.

## 보고 (쉬운 말로)
- 커밋 해시, 바꾼 파일:줄
- 자동으로 끌리게 된 팝업 / 건너뛴 팝업(+이유) 목록
- 올린 기준선이 있으면 파일:줄, 전→후
- 스크린샷 경로
