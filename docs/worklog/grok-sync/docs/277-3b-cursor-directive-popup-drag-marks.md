# 277-3b 지시서 — 끌기 예외 표시 ② (쪽지·인사 권유·휴대폰 확인·후기·마이샵 사진)

- 브랜치: `cursor/277-3b-popup-drag-marks-20261023`
- 기준 커밋: **7562ee43** (main). 줄 번호는 모두 7562ee43 기준. main이 더 새로우면 그 main으로 하고 줄 번호를 다시 확인한다.
- 시작 전: `git fetch origin && git merge-base --is-ancestor 7562ee43 origin/main && echo OK || echo MISSING` → MISSING이면 멈추고 보고.
- **277-2가 main에 머지된 뒤에 시작한다.** `preview/shared/dialog-drag-auto.js`가 origin/main에 없으면 멈추고 보고.
- 브랜치는 origin/main에서 새로 딴다.
- B 예외 표시가 파일 11개라 한도(6개) 때문에 277-3a(6개)·277-3b(5개)로 나눴다. 두 지시서는 파일이 겹치지 않아 순서 상관없다.

## 1. 이번에 붙일 표시 (7562ee43 기준)
| # | 팝업 | role 붙은 곳 파일:줄 | 붙일 표시 |
|---|---|---|---|
| 1 | 쪽지 로그인 막이 | preview/home-ui/src/messages/overlays.js:60 | `.msg-overlay__panel`(:62)에 `data-drag-box` + 머리줄이 없으니 `.msg-overlay__screen-id` 줄(:64)에 `data-drag-handle` |
| 2 | 쪽지 쓰기 | 〃 :170 | `.msg-overlay__panel`(:172)에 `data-drag-box` + `.msg-overlay__screen-id` 줄(:174)에 `data-drag-handle` |
| 3 | 쪽지 신고 (특수, 제목 연결 없음) | 〃 :350 | `.msg-overlay__panel`(:352)에 `data-drag-box` + `.msg-overlay__screen-id` 줄(:354)에 `data-drag-handle` |
| 4 | 회원가입 끝 「동네에 인사할까요?」 | preview/auth-ui/src/screens/signup-complete.js:47 | `.ng-prompt-modal__card`(:48)에 `data-drag-box`. 제목 `#ng-prompt-title` :49 |
| 5 | 휴대폰 확인 | preview/home-ui/src/study-room-reg/phone-verify-gate.js:68 (바탕 :67) | `.p20-phone-verify-modal__panel`(:71)에 `data-drag-box` + 제목 h2(:72)에 `data-drag-handle`(aria-labelledby가 없음) |
| 6 | 후기 | preview/home-ui/src/provider-reviews/sheet.js:239 | `.review-sheet__panel`(:240)에 `data-drag-box`. `header.review-sheet__head` :241이 자동으로 잡힌다 |
| 7 | 마이샵 사진 크게 보기 (특수) | preview/home-ui/src/study-room-reg/myshop-render.js:247 (`hidden`으로 켜고 끔, role 없음) | 먼저 1280에서 화면 전체를 덮는지 본다. **화면 전체면 `data-no-drag`**를 붙이고 보고한다(끌 상자가 없음). 작은 상자면 `.shop-lightbox`에 `data-drag-box`. 닫기 버튼만 있고 제목이 없으므로, 잡을 줄을 새로 만들어야 하면 멈추고 보고한다 |

## 2. 고칠 파일 (이것만, 5개)
1. preview/home-ui/src/messages/overlays.js
2. preview/auth-ui/src/screens/signup-complete.js
3. preview/home-ui/src/study-room-reg/phone-verify-gate.js
4. preview/home-ui/src/provider-reviews/sheet.js
5. preview/home-ui/src/study-room-reg/myshop-render.js

## 커밋 나누기
1. `277-3b feat(dialog): 쪽지 팝업 끌기 표시(#1~#3)`
2. `277-3b feat(dialog): 인사 권유·휴대폰 확인·후기·마이샵 사진 끌기 표시(#4~#7)`

## 붙이는 방법
- 바탕형: role="dialog"가 바탕에 붙어 있으면, 안쪽 상자에 `data-drag-box`를 붙인다. 잡을 곳은 277-2 자동 규칙이 찾는다(`header`·`__head` → `aria-labelledby` 제목 줄). 못 찾으면 그 제목 줄에 `data-drag-handle`을 붙인다.
- 속성만 붙인다. 팝업 구조·클래스·문구·role·aria는 바꾸지 않는다. **CSS는 고치지 않는다.**
- import나 `bindDraggableDialog` 직접 부르기는 하지 않는다(277-2 자동 파일이 한다).

## 공통 규칙 (277-1과 같음)
- 끌기는 데스크톱(721px 이상 + 마우스)에서 제목 줄을 잡을 때만 된다. 창 안쪽 8px. 창 크기를 바꾸면 안으로 돌아온다. 닫기·입력칸·링크는 끌기를 시작하지 않는다. 390px은 원래 자리 그대로. 닫으면 떼고, 다시 열면 가운데.

## 금지
- merge, force-push, `git add -A` 금지. 파일은 하나씩 `git add <파일>`.
- 이 지시서, docs, 체크리스트는 commit/push 하지 마라.
- 「고칠 파일」 밖이 필요하면(범위 밖, 277-2 자동 파일 고치기 포함) 멈추고 보고한다.
- 292 파일은 건드리지 않는다: `exposure-render.js`, `card-visual.js`, `home-listings.css`, `search-visily.css`, `design-system.css`, `scripts/verify-card-badge-layout.mjs`.
- 277-1 파일(`draggable-dialog.js`, 두 `step-basic.js`, `embedded-panels.js`, `promo-image.js`)과 277-2 파일(`dialog-drag-auto.js`, 5개 `main.js`), 확대카드 `detail-shell.js`는 건드리지 않는다.
- confirm()/prompt()는 그대로 둔다(277-7 몫).
- 새 테스트 계정만 쓴다. 기존 데이터는 지우지 않는다. 라이브 사이트는 열지 않는다. 쪽지 실제 발송·결제·회원 삭제는 하지 않는다.
- 모든 검사 초록. 잠긴 검사가 이 파일들 때문에 실패하면 기준 커밋(`*_REF`/`BASE`) 올리기만 허용. 비교 코드·예외 바꾸기, 검사 끄기·건너뛰기 금지. 그 밖의 실패는 멈추고 보고.

## 로컬 확인
- 각 preview 빌드, `npm test`, 관련 `verify:*` 전부 초록. `scripts/verify-rail-info-banners.mjs`(:799, :1199)와 `scripts/verify-home-news-row.mjs`(:732)도 꼭 돌린다.
- 1280px: 표의 팝업을 하나씩 열어, **바탕은 그대로이고 안쪽 상자만** 머리줄로 끌리는지, 8px에서 멈추는지, 창을 줄이면 돌아오는지, 닫았다 열면 가운데인지, 닫기 버튼은 바로 닫히는지 본다. 비회원 팝업은 시크릿 창으로 본다.
- 390px: 모두 원래 자리, 끌리지 않음, 스크롤 정상.
- 1280 스크린샷 2장, 390 스크린샷 1장.

## 보고 (쉬운 말로)
- 커밋 해시, 바꾼 파일:줄
- 표에 결과 칸(됨 / 건너뜀 + 이유)
- 올린 기준선이 있으면 파일:줄, 전→후
- 스크린샷 경로
