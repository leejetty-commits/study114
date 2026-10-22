# 277-4 지시서 — 회원 팝업 끌기 (쪽지, 결제 상세, 휴대폰 확인, 가입 완료, 등록점검 서랍, 마이샵 사진 크게 보기)

- 브랜치: `cursor/277-4-popup-drag-member-20261023`
- 기준 커밋: **5c57dcf8** (Merge 277-1). 줄 번호는 모두 5c57dcf8 기준이다.
- 시작 전: `git fetch origin && git merge-base --is-ancestor 5c57dcf8 origin/main && echo OK || echo MISSING` → MISSING이면 멈추고 보고. 줄 번호가 많이 달라졌으면 멈추고 보고.
- 브랜치는 origin/main에서 새로 딴다.
- 공용 함수: `preview/shared/draggable-dialog.js`의 `bindDraggableDialog(dialog, handle)`(:19). **이 파일은 고치지 않는다.**
- import 줄은 277-1 파일을 그대로 본뜬다(예: `preview/home-ui/src/study-room-reg/embedded-panels.js:18`의 `import { bindDraggableDialog } from '../../../shared/draggable-dialog.js';`처럼 상대경로).

종현 결정(2026-10-23 t2398): 모든 팝업을 끌 수 있게 한다. 이 지시서는 회원·가입·등록 쪽 팝업이다. 예전에 「제외」였던 등록점검 서랍과 마이샵 사진 크게 보기도 이번에는 넣는다(275는 main에 병합됨, 0b7c7bde).

## 1. 이번에 붙일 팝업 (5c57dcf8 기준)
| # | 팝업 | 팝업 뿌리 파일:줄 | 잡는 곳(handle) | 누가 봄 |
|---|---|---|---|---|
| 1 | 쪽지 이용권 안내 | preview/home-ui/src/messages/overlays.js:60 | `.msg-overlay__panel`(:62) 안 제목 줄 `.msg-overlay__screen-id` :64 | 회원 |
| 2 | 쪽지 쓰기 | 〃 :170 | `.msg-overlay__panel`(:172)의 제목 줄 | 회원 |
| 3 | 쪽지 신고 | 〃 :350 | 패널의 제목 줄 | 회원 |
| 4 | 결제 상세 | preview/home-ui/src/plans/receipt.js:12 | `.plans-receipt__head` :13 | 공부방·과외쌤 |
| 5 | 휴대폰 확인 | preview/home-ui/src/study-room-reg/phone-verify-gate.js:68 (overlay :67) | `.p20-phone-verify-modal__title`(:72)이 든 줄 | 공부방 |
| 6 | 가입 완료 「동네에 인사할까요?」 | preview/auth-ui/src/screens/signup-complete.js:47 | `#ng-prompt-title`(:49)이 든 줄 | 가입 직후 |
| 7 | 등록점검 고치기 서랍 | preview/home-ui/src/study-room-reg/registration-check-edit.js:164 | `.rc-drawer__head` :165 | 공부방 |
| 8 | 마이샵 사진 크게 보기 | preview/home-ui/src/study-room-reg/myshop-render.js:247 (여는 곳 :265-283) | 머리줄이 없으므로 사진 `img`(:249)를 handle로, 사진 상자를 dialog로 | 공부방 마이샵 공개 화면 |

## 2. 고칠 파일 (이것만)
1. preview/home-ui/src/messages/overlays.js
2. preview/home-ui/src/plans/receipt.js
3. preview/home-ui/src/study-room-reg/phone-verify-gate.js
4. preview/auth-ui/src/screens/signup-complete.js
5. preview/home-ui/src/study-room-reg/registration-check-edit.js
6. preview/home-ui/src/study-room-reg/myshop-render.js

- 쪽지 쓰기 글칸에서 글자를 마우스로 선택할 때 팝업이 움직이면 안 된다(textarea는 공용 함수가 막는다. 확인만 한다).
- 서랍(#7)과 사진 크게 보기(#8)가 CSS 없이는 움직이지 않으면(예: 화면 전체를 덮는 상자), 그 팝업만 건너뛰고 보고한다. CSS는 고치지 않는다.
- 이 파일들의 confirm()·alert()는 그대로 둔다(277-7 몫).

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
1. `277-4 feat(dialog): 쪽지 팝업 3개(#1~#3)`
2. `277-4 feat(dialog): 결제·휴대폰·가입완료(#4~#6)`
3. `277-4 feat(dialog): 등록점검 서랍·마이샵 사진 크게 보기(#7~#8)`

## 로컬 확인
- `npm run build`(또는 각 preview 빌드)와 `npm test`·관련 `verify:*` 전부 초록.
- 로컬 미리보기에서 1280px:
  - 표의 팝업을 하나씩 열어 머리줄을 끌면 따라 움직이고, 창 끝 8px에서 멈춘다.
  - 창 크기를 줄이면 안으로 돌아온다.
  - 닫고 다시 열면 가운데에서 열린다.
  - 닫기 버튼을 누르면 끌리지 않고 바로 닫힌다.
- 쪽지 쓰기는 실제로 보내지 않는다. 열고 끌고 닫기만 한다.
- 결제 상세는 로컬에 테스트 결제 기록이 있을 때만 확인한다. 없으면 건너뛰고 보고한다.
- 390px: 모두 원래 자리이고 끌리지 않으며, 스크롤도 정상이다.
- 아무 팝업이나 끝까지 끈 1280 스크린샷 2장과 390 스크린샷 1장을 남긴다.

## 보고 (쉬운 말로)
- 커밋 해시와 바꾼 파일:줄
- 표에 결과 칸(됨 / 건너뜀 + 이유)
- 올린 기준선이 있으면 파일:줄, 전→후
- 스크린샷 경로
