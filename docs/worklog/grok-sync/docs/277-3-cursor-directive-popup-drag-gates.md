# 277-3 지시서 — 안내·로그인 막이 팝업 끌기 (비회원 안내, 이용안내 살펴보기, 메일 인증, 동네 인사)

- 브랜치: `cursor/277-3-popup-drag-gates-20261023`
- 기준 커밋: **5c57dcf8** (Merge 277-1). 줄 번호는 모두 5c57dcf8 기준이다.
- 시작 전: `git fetch origin && git merge-base --is-ancestor 5c57dcf8 origin/main && echo OK || echo MISSING` → MISSING이면 멈추고 보고. 줄 번호가 많이 달라졌으면 멈추고 보고.
- 브랜치는 origin/main에서 새로 딴다.
- 공용 함수: `preview/shared/draggable-dialog.js`의 `bindDraggableDialog(dialog, handle)`(:19). **이 파일은 고치지 않는다.**
- import 줄은 277-1 파일을 그대로 본뜬다(예: `preview/home-ui/src/study-room-reg/embedded-panels.js:18`의 `import { bindDraggableDialog } from '../../../shared/draggable-dialog.js';`처럼 상대경로).

종현 결정(2026-10-23 t2398): 모든 팝업을 끌 수 있게 한다. 이 지시서는 안내·막이 팝업이다.

## 1. 이번에 붙일 팝업 (5c57dcf8 기준)
| # | 팝업 | 팝업 뿌리 파일:줄 | 잡는 곳(handle) | 누가 봄 |
|---|---|---|---|---|
| 1 | 비회원 「더 보려면 로그인」 막이 | preview/shared/guest-gate-ui.js:200 (overlay :199) | `#guest-deep-gate-title` h2 | 비회원 |
| 2 | 오른쪽 레일 이용안내 살펴보기 | preview/home-ui/src/right-rail.js:770 (overlay :769) | `#rail-guide-peek-title` h2 | 비회원·모두 |
| 3 | 이용안내 살펴보기 | preview/home-ui/src/guide/screens.js:515 (overlay :514) | `#guide-peek-title` h2 | 비회원·모두 |
| 4 | 메일 인증 안내 | preview/home-ui/src/email-verify-overlay.js:14 | `#email-verify-title` h2 (:15) | 회원(인증 전) |
| 5 | 동네 인사 모아보기 | preview/home-ui/src/neighborhood-greeting-ui.js:360 (openGreetingFeed :352) | `#ng-feed-title`(:397)이 든 줄 | 회원 |
| 6 | 동네 인사 로그인 막이 | 〃 :795 (openGreetingLoginGate :790) | `.ng-unavailable__card`(:798)의 첫 줄 | 비회원 |
| 7 | 동네 인사 알림 | 〃 :859 (showNotice :854) | `.ng-unavailable__card`(:862)의 첫 줄 | 모두 |

## 2. 고칠 파일 (이것만)
1. preview/shared/guest-gate-ui.js
2. preview/home-ui/src/right-rail.js
3. preview/home-ui/src/guide/screens.js
4. preview/home-ui/src/email-verify-overlay.js
5. preview/home-ui/src/neighborhood-greeting-ui.js

- 세 막이(#1~#3)는 같은 클래스 `.guest-gate--deep`를 쓴다. dialog로는 바탕(backdrop)이 아니라 `.guest-gate--deep` 상자를 넘긴다. 바탕을 넘기면 화면 전체가 움직인다.
- #6, #7처럼 제목이 없는 알림 카드는 카드 첫 줄(문구 줄)을 handle로 쓴다. 그것도 어려우면 건너뛰고 보고한다.
- neighborhood-greeting-ui.js의 confirm()은 그대로 둔다(277-7 몫).

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
1. `277-3 feat(dialog): 비회원 막이·이용안내 살펴보기(#1~#3)`
2. `277-3 feat(dialog): 메일 인증·동네 인사(#4~#7)`

## 로컬 확인
- `npm run build`(또는 각 preview 빌드)와 `npm test`·관련 `verify:*` 전부 초록.
- 로컬 미리보기에서 1280px:
  - 표의 팝업을 하나씩 열어 머리줄을 끌면 따라 움직이고, 창 끝 8px에서 멈춘다.
  - 창 크기를 줄이면 안으로 돌아온다.
  - 닫고 다시 열면 가운데에서 열린다.
  - 닫기 버튼을 누르면 끌리지 않고 바로 닫힌다.
- 비회원 창(시크릿 창)에서 #1~#3과 #6을 확인한다.
- 390px: 모두 원래 자리이고 끌리지 않으며, 스크롤도 정상이다.
- 아무 팝업이나 끝까지 끈 1280 스크린샷 2장과 390 스크린샷 1장을 남긴다.

## 보고 (쉬운 말로)
- 커밋 해시와 바꾼 파일:줄
- 표에 결과 칸(됨 / 건너뜀 + 이유)
- 올린 기준선이 있으면 파일:줄, 전→후
- 스크린샷 경로
