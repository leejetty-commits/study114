# 277-3a 지시서 — 끌기 예외 표시 ① (바탕형 팝업: 안내·막이·동네 인사·확대카드 이동 확인·운영 팝업)

- 브랜치: `cursor/277-3a-popup-drag-marks-20261023`
- 기준 커밋: **7562ee43** (main). 줄 번호는 모두 7562ee43 기준. main이 더 새로우면 그 main으로 하고 줄 번호를 다시 확인한다.
- 시작 전: `git fetch origin && git merge-base --is-ancestor 7562ee43 origin/main && echo OK || echo MISSING` → MISSING이면 멈추고 보고.
- **277-2가 main에 머지된 뒤에 시작한다.** `preview/shared/dialog-drag-auto.js`가 origin/main에 없으면 멈추고 보고.
- 브랜치는 origin/main에서 새로 딴다.
- B 예외 표시가 파일 11개라 한도(6개) 때문에 277-3a(6개)·277-3b(5개)로 나눴다. 두 지시서는 파일이 겹치지 않아 순서 상관없다.

## 1. 이번에 붙일 표시 (7562ee43 기준)
| # | 팝업 | role 붙은 곳 파일:줄 | 붙일 표시 |
|---|---|---|---|
| 1 | 비회원 「더 보려면 로그인」 | preview/shared/guest-gate-ui.js:200 (바탕 `.guest-deep-gate-overlay` :199) | 안쪽 `.guest-gate--deep`(:205)에 `data-drag-box` |
| 2 | 오른쪽 레일 이용안내 살펴보기 | preview/home-ui/src/right-rail.js:770 (바탕 :769) | 안쪽 `.guest-gate--deep`(:775)에 `data-drag-box` |
| 3 | 이용안내 살펴보기 | preview/home-ui/src/guide/screens.js:515 (바탕 :514) | 안쪽 `.guest-gate--deep`(:520)에 `data-drag-box` |
| 4 | 동네 인사 모아보기 | preview/home-ui/src/neighborhood-greeting-ui.js:360 | `.ng-feed__card`(:396)에 `data-drag-box`. 제목 `#ng-feed-title` :397이 카드 직접 자식이라 자동으로 잡힌다 |
| 5 | 동네 인사 로그인 막이 (특수) | 〃 :795 | `.ng-unavailable__card`(:798)에 `data-drag-box` + 제목이 없으니 카드 첫 줄 `<p>`(:799)에 `data-drag-handle` |
| 6 | 동네 인사 알림 (특수) | 〃 :859 | `.ng-unavailable__card`(:862)에 `data-drag-box` + 첫 줄 `<p>`(:863)에 `data-drag-handle` |
| 7 | 「이 카드를 벗어납니다」 | preview/home-ui/src/detail-decision/detail-utils.js:228 | `.p24-leave-confirm__panel`(:232)에 `data-drag-box`. 제목 `#p24-leave-title` :234 |
| 8 | 운영 팝업 | preview/home-ui/src/site-ops-chrome.js:109 (바탕 `.ops-chrome__popup-backdrop` :110) | `.ops-chrome__popup-panel`(:111)에 `data-drag-box`. 제목 h2 `.ops-chrome__popup-title` :112 |

## 2. 고칠 파일 (이것만, 6개)
1. preview/shared/guest-gate-ui.js
2. preview/home-ui/src/right-rail.js
3. preview/home-ui/src/guide/screens.js
4. preview/home-ui/src/neighborhood-greeting-ui.js
5. preview/home-ui/src/detail-decision/detail-utils.js (확대카드 본체 `detail-shell.js`가 아니다)
6. preview/home-ui/src/site-ops-chrome.js

## 커밋 나누기
1. `277-3a feat(dialog): 비회원 막이·이용안내 살펴보기 끌기 상자 표시(#1~#3)`
2. `277-3a feat(dialog): 동네 인사·이동 확인·운영 팝업 끌기 표시(#4~#8)`

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
