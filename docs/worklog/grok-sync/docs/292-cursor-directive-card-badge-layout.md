# 292 지시서 — 베이직 카드 배지 자리 정리 (New 왼쪽 위 금색, 유료 배지 오른쪽 위, 신뢰 배지 반응 줄로) + 픽 과외쌤 사진 칸 오른쪽 빈자리 없애기

브랜치: `cursor/292-card-badge-layout-20261023`
기준 main: `91edd6f8` (Merge 291)
기준 그림(목업 v3): `/workspace/study114/audits/card-badge-redesign/` (`harness/after.css`, `harness/mock.js`, `overlap-v3.json`, `compare-*-v3.png`)

## 목표
- 베이직 카드(공부방·과외쌤·학생) 사진 위에서 배지가 서로 겹치지 않게 한다.
- 사진 위 학년·대상 배지(`.expo-hcard__badge`)를 뺀다.
- 「New」는 왼쪽 위로 옮긴다. 금색 바탕 #E8B931, 글자 #3A2A00, 테두리 #B88A10. 배지 자체는 그대로 있고 테두리 빛만 1.6초마다 숨쉬듯 바뀐다.
- 유료 배지(Hot·단과·쪽집게·SKY)는 오른쪽 위에 오른쪽 정렬로 두고, 최대 2줄까지 쓴다.
  - 배지마다 1.5px 금속 테두리를 단다: Hot 구리, 단과 은색, 쪽집게 청록·남색, SKY 흰색·하늘색.
  - 7초에 한 번 빛이 약 1.3초 동안 지나간다.
  - 배지 크기는 지금과 같다.
- 신뢰 배지(교육청등록·사업자·경력·증빙 등)는 사진에서 빼서 반응 줄(👍💬♡⇄✉) 왼쪽 빈 곳에 한 줄로 둔다.
  - 자리가 모자라면 그때만 뒤에서부터 「+N」으로 줄인다.
  - 600px 이하에서는 이 줄이 사진 아래까지 왼쪽으로 늘어난다.
  - 반응 줄 자체의 자리는 바꾸지 않는다.
- 학생 베이직 카드에도 같은 규칙으로 New를 단다. `is_new`가 있으면 그것을 쓰고, 없으면 7일 안(`card-visual.js:63-74`)인지로 정한다.
- 픽 과외쌤: 사진 위 정보 칸 오른쪽의 안 쓰는 빈자리를 없앤다. 그래야 390px에서 수업료 칸이 잘리지 않는다.
- 움직임은 `prefers-reduced-motion`이면 모두 끈다.
- 1280·390 두 폭 모두, 배지가 많은 경우까지 서로 겹치는 것이 0이어야 한다.
- 픽·프라임은 위 과외쌤 빈자리 말고는 바꾸지 않는다. 펼친 카드도 범위 밖이다.

## ✅ 종현 결정 완료 (2026-10-23 t2395): 결정: (가) — 대상·학년 값을 카드 본문 항목으로 옮김 (아래 4-2 참고)
학년·대상 배지를 빼면 과외쌤·학생 베이직 카드에서 「대상(중등 등)」과 「학년(중2 등)」 정보가 아예 사라진다.

잠긴 검사 2개가 이 배지가 있다고 기대한다:
- `scripts/verify-card-field-paths-20261009.mjs`
  - :58 `(대상 배지)`를 `.expo-hcard__badge`에서 읽는다.
  - :117 과외쌤은 '중등'을 기대한다.
  - :131 학생은 '중2'를 기대한다.
  - :242 빈 학생 카드는 '—'를 기대한다.
- `scripts/verify-detail-card-all-fields.mjs:197`은 과외쌤 '대상'을 `.expo-hcard__badge`로 찾는다.

이것은 기준선을 올리는 일이 아니라 기대값을 바꾸는 일이라 지금 규칙으로는 Cursor가 멈춰야 한다. 종현이 아래 둘 중 하나를 고른 뒤에 보낸다.
- (가, 추천) 사진 배지는 빼고, 같은 값을 본문 항목으로 옮긴다.
  - 과외쌤은 `renderHcardSlot('대상', grade_band)`, 학생은 `'학년'`으로 넣는다.
  - 위 두 검사가 그 항목에서 값을 읽도록 고치는 것을 이번에만 미리 허용한다. 기대 값('중등', '중2', '—')은 그대로 둔다.
- (나) 학년 정보를 카드에서 정말 없앤다. 위 두 검사에서 해당 기대를 빼는 것을 미리 허용한다.

결정: (가). 두 검사는 값을 읽는 위치만 본문 항목으로 바꾸고, 기대값은 그대로 둔다.

## 0. 앞 지시서 확인 + 277-1과 겹침 확인
1. `git fetch origin && git merge-base --is-ancestor 91edd6f8 origin/main` 으로 확인한다. 실패하면 멈추고 보고한다.
2. 새 브랜치 `cursor/292-card-badge-layout-20261023`는 origin/main에서 딴다.
3. 277-1(`cursor/277-1-popup-drag-shared-20261021`)이 쓰는 파일은 건드리지 않는다:
   - `preview/shared/draggable-dialog.js`
   - `preview/tutor-ui/src/screens/step-basic.js`
   - `preview/study-room-ui/src/screens/step-basic.js`
   - `preview/home-ui/src/study-room-reg/embedded-panels.js`
   - (277-1이 빼둔) `preview/shared/promo-image.js`, `register.css`

   292가 고치는 파일(아래 1~3)은 이 목록과 겹치지 않는다(main 91edd6f8에서 확인함). 작업 중에 위 파일을 고쳐야 하면 멈추고 보고한다.

## 1. 렌더 — `preview/home-ui/src/exposure-render.js`
줄 번호는 main 91edd6f8 기준이다.

- **:256-265 `renderCardBadgeLayers`** 를 다음처럼 바꾼다.
  - promo 줄 하나만 사진 안에 둔다.
    - New를 promo 줄의 **첫 번째 자식**으로 넣고, 클래스는 `card-visual__promo-badge--new`를 그대로 쓴다.
    - promo 줄 클래스에 `card-visual__promo--split`을 더한다.
  - trust 줄은 따로 돌려준다. 예: `{ promo, trust }` 또는 함수를 둘로 나눈다.
- **공부방 베이직 :788-815**
  - :791 `${badgeLayers}` 자리에는 promo만 넣는다.
  - :811 `<div class="expo-hcard__side">`의 첫 자식으로 `<div class="card-visual__trust card-visual__trust--rail">…</div>`를 넣는다.
  - 그다음에 지금의 `.expo-hcard__actions`(:812)가 그대로 온다.
- **과외쌤 베이직**
  - :871 `<span class="expo-hcard__badge">…grade_band…</span>`을 지운다.
  - :872는 promo만 남긴다.
  - :891 side 첫 자식으로 trust rail을 넣는다(:892 actions는 그대로).
  - 4-2 결정이 (가)이면 본문 항목에 `대상`을 넣는다(:838 근처의 `labeled('대상', …)`는 테이블 쪽이니 그대로 두고, hcard 본문에 넣는다).
- **학생 베이직** (손님용 :988-1010, 회원용 :1037-1041)
  - :991 `t.band` 배지와 :1040 `grade_level` 배지를 지운다.
  - 사진 안에 New만 promo 줄로 넣는다. 학생은 유료 배지가 없고(`card-visual.js` 허용 목록이 비어 있음), 신뢰 배지도 없다.
  - New 판정은 `card-visual.js`의 `resolveAutoNewBadge`(:63-74)를 그대로 부른다. 학생 전용으로 새로 짜지 않는다.
  - 4-2가 (가)이면 본문에 `renderHcardSlot('학년', …)`을 넣는다. 손님용은 `t.band`, 회원용은 `grade_level`이다.
- 픽·프라임 렌더(:320-416)는 바꾸지 않는다.

### 학생 New 데이터
- 서버 `src/Search/SearchService.php`의 searchStudents는 :1329-1330에서 `published_at`과 `created_at`을 이미 보낸다. `is_new`는 보내지 않는다.
- 공부방(:790)과 과외쌤(:1053)만 `is_new`를 보낸다.
- `resolveAutoNewBadge`는 `is_new`가 없으면 날짜로 7일을 계산하므로 **서버(API) 변경 없이 된다.** 이번에는 `SearchService.php`를 건드리지 않는다.
- 학생 카드가 다른 곳(홈 목록 등)에서 위 두 날짜가 없는 데이터로 그려지는 것을 발견하면, 서버를 고치지 말고 멈추고 보고한다. 보고에는 어느 API의 어느 줄에 어떤 칸이 필요한지 적는다.

## 2. 카드 배지 모양 — `preview/home-ui/src/card-visual.js` + `preview/home-ui/src/styles/home-listings.css`
- `card-visual.js`
  - :213-222 `renderPromoBadgeRow`: New를 맨 앞에 두는 순서만 바꾼다.
  - :229-234 `renderTrustBadgeRow`: rail용 클래스 옵션을 받게 한다.
  - POLICY(:21-33)와 판정 로직(:63-207)은 바꾸지 않는다.
- `home-listings.css` :1717-1775 (promo·trust 줄과 배지 색)
  - :1724-1733 사진 위 absolute 규칙은 promo만 남긴다. trust bottom(:1733)은 지운다.
  - promo 줄: `display:block; text-align:right;`
  - 배지: `display:inline-block; margin:0 0 .2rem .2rem;`
  - 최대 2줄: `max-height`를 배지 2줄 높이로 잡고 `overflow:hidden`.
  - New 금색 (목업 v2 그대로):
    ```css
    .card-visual__promo--split .card-visual__promo-badge--new{float:left;margin:0 .35rem .2rem 0;background:#E8B931;color:#3A2A00;border:1px solid #B88A10;animation:s114-gold-glow 1.6s ease-in-out infinite}
    @keyframes s114-gold-glow{0%,100%{box-shadow:0 0 0 0 rgba(232,185,49,0);border-color:#B88A10}50%{box-shadow:0 0 0 3px rgba(232,185,49,.55),0 0 8px 2px rgba(232,185,49,.6);border-color:#FFF3C4}}
    ```
  - 유료 배지 금속 테두리 (목업 v3 B안 그대로, 크기 유지를 위해 padding에서 1.5px를 뺀다):
    ```css
    border:1.5px solid transparent;
    background:linear-gradient(var(--bg),var(--bg)) padding-box, linear-gradient(135deg,var(--l1),var(--l2) 50%,var(--l1)) border-box;
    box-shadow:inset 0 1px 0 rgba(255,255,255,.35); position:relative; overflow:hidden;
    padding:calc(.1rem - 1.5px) calc(.4rem - 1.5px);
    ```
    - hot: `--bg:#b45309;--l1:#fcd9a8;--l2:#7c2d12`
    - subject_track: `--l1:#e2e8f0;--l2:#475569`
    - jjokjipge: `--l1:#a5f3fc;--l2:#1e3a8a`
    - sky: `--l1:#fff;--l2:#38bdf8`
    - 그 밖: `--bg:#1d4ed8;--l1:#c7d2fe;--l2:#1e3a8a`
    - 바탕색(`--bg`)은 지금 색 그대로 쓴다.
  - 빛 지나감:
    ```css
    ::after{content:'';position:absolute;top:-2px;bottom:-2px;left:-60%;width:40%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.45),transparent);transform:skewX(-20deg);animation:s114-sweep 7s ease-in-out infinite}
    @keyframes s114-sweep{0%,82%{left:-60%}100%{left:130%}}
    ```
  - 움직임 끄기: `@media (prefers-reduced-motion: reduce)`에서 두 animation을 `none`으로 하고 `::after`는 `display:none`.
  - 펼친 카드나 픽·프라임에서 쓰는 같은 배지 클래스가 바뀌면 안 된다. 새 규칙은 `.expo-hcard` 아래로만 건다. 범위가 넘치면 멈추고 보고한다.

## 3. 반응 줄 + 600px 이하 — `preview/search-ui/src/styles/search-visily.css`
- :504-518 `.expo-hcard__side`는 그대로 두고(이미 `align-items:center`), 아래 rail 규칙을 더한다:
  ```css
  .expo-hcard__side .card-visual__trust--rail{display:flex;flex-wrap:nowrap;gap:.25rem;overflow:hidden;min-width:0;flex:1 1 0;margin:0 .5rem 0 0;align-items:center}
  .card-visual__trust--rail .card-visual__trust-badge{flex:0 0 auto;white-space:nowrap}
  .card-visual__trust--rail .card-visual__trust-more{font-size:.6875rem;color:#4B5563}
  ```
- 「+N」은 작은 JS로 만든다. 그리기가 끝난 뒤와 resize 때, `scrollWidth > clientWidth`인 동안 뒤 배지를 숨기고 숨긴 개수를 `+N`으로 보여준다.
  - 목업 `harness/mock.js`와 같은 방식이다. `exposure-render.js`나 이미 카드 그린 뒤에 도는 곳에 둔다.
  - 이 JS를 둘 자리가 277-1 파일뿐이면 멈추고 보고한다.
- :598 `@media (max-width:720px)` 블록 뒤에 600px 블록을 하나 새로 둔다:
  ```css
  @media (max-width:600px){.expo-hcard__media-wrap{grid-row:1;align-self:start}.expo-hcard__side{grid-column:1/-1}.card-visual__trust--rail{gap:.2rem;margin-right:.35rem}.card-visual__trust--rail .card-visual__trust-badge{padding:.1rem .25rem;letter-spacing:-.02em}}
  ```
- 반응 줄(`.expo-hcard__actions`, :520-537)의 자리와 크기는 바꾸지 않는다.

## 3-1. 픽 과외쌤 오른쪽 빈자리 — `preview/home-ui/src/styles/design-system.css`
- :1111-1113 `.expo-card--pick.expo-card--tutor .expo-media-overlay__bl { right: 3.875rem; }`을 `right: .25rem`으로 바꾼다.
- :1104-1109 (프라임 과외쌤 `right: 4rem`)은 그대로 둔다. 지시는 픽만이다.
- 그 밖의 픽·프라임 CSS는 바꾸지 않는다.

## 4. 잠긴 검사
### 4-1. 미리 허용한 것 (기준선 올리기만)
- `scripts/verify-photo-nofit-square.mjs`
  - :14 `const BASE = '3a39df06'`, :107은 `exposure-render.js` 전체가 BASE와 같은지 본다.
  - BASE를 292 커밋(또는 그 직전 main)으로 올리는 것만 허용한다. :107 비교 코드와 문구는 그대로 둔다.
- 위 말고 기준 커밋(`*_REF`, `BASE`)을 올려야 하는 검사가 나오면, `exposure-render.js`, `card-visual.js`, `home-listings.css`, `search-visily.css`, `design-system.css` 때문일 때만 그 기준값을 올린다. 보고에 파일:줄을 적는다.

### 4-2. 기대값을 바꿔야 하는 검사 — 위 「종현 결정」을 따른다
- `scripts/verify-card-field-paths-20261009.mjs` :58, :117, :131, :242
- `scripts/verify-detail-card-all-fields.mjs` :197
- 결정이 없으면 고치지 말고 멈추고 보고한다.

### 4-3. 그 밖
- 이 밖의 검사가 실패하면 멈추고 보고한다. 예: `verify-card-visual.mjs`, `verify-card-visual-penetration.mjs`, `smoke-paid-badges-proof.mjs`(:139-140 hot·jjokjipge 클래스), `verify-student-mypage-metrics.mjs`(:69-78 CSS 합쳐 읽음), `verify-guest-baseline-map-cards.mjs`.
- 비교 코드나 예외를 바꾸는 것, 검사를 끄거나 건너뛰는 것은 금지한다.

## 5. 새 검사 스크립트 — `scripts/verify-card-badge-layout.mjs` + package.json `verify:card-badge-layout`
- Playwright로 미리보기(로컬 vite 빌드나 하네스)만 연다. 라이브 사이트는 열지 않는다.
- 폭 1280과 390 각각, 보통 카드와 배지 많은 카드로 확인한다. 배지 많은 카드는 Hot·단과·쪽집게·SKY, 신뢰 4개 이상, New를 모두 단 것이다.
- 확인할 것:
  1. 공부방·과외쌤·학생 베이직 사진 안에 `.expo-hcard__badge`가 0개
  2. New가 promo 줄 첫 자식이고 왼쪽 위에 있으며 배경색이 rgb(232,185,49)
  3. 유료 배지가 사진 오른쪽 위 절반 안에 있고, 줄 수(서로 다른 top 값)가 2 이하
  4. 신뢰 배지가 `.expo-hcard__side` 안에 있고(사진 안은 0개), 한 줄(top 값 하나)이며, 넘치면 `+N`
  5. 서로 안 겹침: 목업 mock.js의 겹침 검사 선택자를 그대로 쓴다(`.card-visual__promo-badge, .card-visual__trust-badge, .expo-overlay-val, .expo-overlay-bl-grid__cell, .card-stats, .item-actions, .expo-hcard__badge, .card-visual__trust-more, .expo-hcard__slogan, .expo-hcard__meta`). 서로 겹치는 사각형이 0개이고, 잘림(scrollWidth > clientWidth + 1)도 0개
  6. `reducedMotion: 'reduce'`에서 New와 유료 배지의 `animation-name`이 none이고, `::after`가 display none
  7. 픽 과외쌤 `.expo-media-overlay__bl`의 right가 0.25rem(4px)이고, 390에서 수업료 칸이 잘리지 않음
  8. 픽·프라임(공부방·과외쌤)의 HTML이 main 91edd6f8로 그린 것과 같음. 픽 과외쌤 CSS는 위 한 줄 말고 같아야 한다.
  9. 학생 New: `is_new` 없이 `published_at`이 3일 전이면 New가 있고, 10일 전이면 없음
- 변조 확인: New를 오른쪽으로 되돌리거나 trust를 사진 안으로 되돌리면 이 검사가 실패하는지 본다.

## 6. 테스트·보고
- 새 테스트 계정만 쓴다. 기존 데이터는 지우지 않는다. 라이브 사이트는 열지 않는다.
- 모든 검사가 초록이어야 한다.
- 브랜치에만 push한다. merge, force-push, `git add -A`는 금지다. 파일은 하나씩 add한다.
- 이 지시서, docs, 체크리스트는 commit하지 않는다.
- 범위 밖이 필요하면 멈추고 보고한다.

### 보고에 적을 것
- 커밋 해시, 바꾼 파일:줄
- 올린 기준선(파일:줄, 전→후)
- 4-2를 어떻게 처리했는지
- 1280·390, 보통·많음 스크린샷 경로
- 새 검사 결과(겹침 0, 잘림 0)
- 277-1 파일을 건드리지 않았다는 확인
