# 04 · Cursor 작업지시서 — 전역 버튼 톤 다운 (2026-10-09)

- **작성:** 2026-10-10 00:14 KST (우동공과2)
- **결정 근거:** 종현 확정 2026-10-09 23:57 — 색 B안 + 납작2 · 기본안 2개(모바일 누르는 영역 44 / 폼 최종 제출·결제 제외). 정본 수치 = `02-디자인안.md` §1, 결정 기록 = `study114-ds/docs/217-global-button-tone-2026-10-09.md`
- **절차 (종현 잠금):** 점검지시(§A) → 점검 보고 → 검수 → 작업지시(§B, 소작업 1→2→3) → 수행결과 보고 → 재작업 → 검수완료 → 종현 보고 → **종현 승인 후 배포**
- **발송:** 우동공과2가 함. 이 문서만으로 자동 발송하지 않음.
- 소작업은 **같은 브랜치에서 순서대로**, 소작업마다 커밋 1개 + 보고. 앞 소작업 검수 합격 전에는 다음 소작업 시작 금지.

> 아래 블록 전체를 Cursor에 그대로 전달.

````
# [전역 버튼 톤] 일상 파란 버튼 톤 다운 (B색 + 납작2) — 작업지시서

## 0. 규칙 (어기면 불합격)
- 저장소: leejetty-commits/study114.
- **기준 = origin/main `a69170e`** (2026-10-09 23:23 KST).
  시작: `git fetch origin && git rev-parse origin/main` 결과를 첫 줄에 적기. a69170e가 아니면 그 SHA를 적고, 아래 파일:줄(특히 `tokens.css:168`, `udx-std-apply.css` 끝 줄 788)이 달라졌는지 확인한 뒤 진행.
- **브랜치 1개:** `cursor/global-button-tone-20261009` — origin/main에서 분기. 이 브랜치에만 커밋·push.
- **금지:** PR 만들기, main push·머지, 배포, 운영 DB 접속, `--amend`, force push, push한 커밋 rebase, 다른 브랜치 손대기.
- **허용 파일(§1) 밖 1줄이라도 수정 = 불합격.** 허용 파일 안에서도 지정한 줄 밖 수정 금지.
- **JS·PHP·HTML 수정 0.** 클래스 이름(`btn btn--primary btn--sm` 등) 바꾸기·추가 금지 — 기존 verify 스크립트가 클래스 문자열을 검사함.
- **기존 CSS 규칙 삭제·수정 금지** (제외 버튼이 기존 값을 그대로 써야 함). 새 규칙은 `udx-std-apply.css` **맨 끝에 덧붙이기만**.
- 구조 재설계·무관 정리·이름 바꾸기·포맷만 고치기·기능 추가 금지. 「죽은 CSS 정리」도 금지(별건).
- `--brand-blue`·`--btn-h`·`--btn-h-compact`·`--btn-search-*`·`--input-h` 등 **기존 토큰 값 변경 금지** (링크·탭·입력칸·우측 레일이 같이 바뀜).
- rg는 반드시 `-g '!node_modules' -g '!dist'`.
- 용어: **학생**(학부모 금지·화면 카피). 내부 키 `parent`는 유지.
- 막히면 「막힘 + 이유 + 풀 방법」 + 나머지는 끝까지. 결과 = **한국어 · 마지막 메시지 하나**.

## 1. 허용 파일 (이 3개만 — 밖 = 불합격)
| # | 파일 | 무엇만 | 소작업 |
|---|---|---|---|
| F1 | `preview/home-ui/src/styles/tokens.css` | `:root` 안 **168줄(`--input-h`) 바로 다음에 토큰 14줄 추가**만 | 1 |
| F2 | `preview/home-ui/src/styles/udx-std-apply.css` | **788줄(파일 끝) 뒤에 블록 덧붙이기**만 (기존 1–788줄 변경 0) | 2, 3 |
| F3 | `scripts/verify-global-button-tone.mjs` | **새 파일** (검사 스크립트) | 3 |

참고(수정 금지 — 원인 파악용): `design-system.css:442-453`, `product-chrome.css:44-54`, `mypage-ops.css:533-550,615-619`, `zip-bridge.css:174-214`, `zip-guide.css:575-579`, `udx-std-apply.css:58-117,221-237,561-575`, `home-listings.css:356-367`.
이 파일들은 모든 SPA(home-ui·search-ui·study-room-ui·tutor-ui·auth-ui)가 `udx-std-apply.css`를 **마지막 공통 파일**로 불러오기 때문에 고치지 않아도 된다(`preview/*/src/main.js`).

---

## §A. 점검 (코드 수정 0 — 보고만)
A-1. 기준 SHA, `tokens.css:160-170`, `udx-std-apply.css:780-788` 원문을 붙여 보고.
A-2. 프리뷰를 띄워(home-ui 5174 등) 아래 「화면 목록」의 버튼을 1280 / 390에서 `getComputedStyle`로 측정해 **현재값 표**(글자·높이·바탕·글자색·radius·좌우 padding) 보고. 우동공과2 실측(아래 §C 「현재」 열)과 다르면 차이만 따로 적기.
A-3. 제외 목록(§B-2 주석)에 해당하는 버튼이 화면 목록 안에서 어떤 것인지 file:line으로 대조 보고. 목록에 없는데 「폼 최종 제출·결제」로 보이는 버튼이 있으면 file:line으로 보고(추가 판단은 우동공과2·종현).
A-4. 점검 단계에서는 **커밋하지 않는다.**

---

## §B. 작업

### 소작업 1/3 — 토큰 추가 (F1) · 화면 변화 0
`preview/home-ui/src/styles/tokens.css` 168줄 `  --input-h: 2.75rem; /* 44 */` **바로 다음 줄**에 아래를 그대로 추가:

```css
  /* 2026-10-09 전역 버튼 톤 (종현 확정: B색 + 납작2) — docs/217 */
  --btn-tone-bg: #729fd9; /* 5.62:1 with --btn-tone-fg */
  --btn-tone-fg: #0b2545;
  --btn-tone-hover: #6797d6; /* 5.11:1 */
  --btn-tone-active: #5c8fd3; /* 4.63:1 */
  --btn-strong-bg: var(--brand-blue); /* 폼 최종 제출·결제 (제외) */
  --btn-strong-hover: var(--brand-blue-dark);
  --btn-strong-fg: #ffffff;
  --btn-tone-h: 30px; /* 기본·카드 안 */
  --btn-tone-h-sm: 26px; /* 작은·머리 */
  --btn-tone-fs: 14px;
  --btn-tone-pad: 14px;
  --btn-tone-pad-sm: 12px;
  --btn-tone-radius: 6px;
  --btn-tone-hit: 44px; /* 모바일 누르는 영역 */
```

합격: 화면 목록 전 버튼의 계산값이 §A-2 현재값과 **완전히 같음**(토큰 정의만 추가). `git diff --stat` = F1 1파일 +15줄 이내.
커밋: `style(tokens): 전역 버튼 톤 토큰 추가 (2026-10-09 종현 확정, 화면 변화 없음)`

### 소작업 2/3 — 데스크톱 크기·색 + 정렬 select (F2 덧붙이기 1)
`preview/home-ui/src/styles/udx-std-apply.css` **맨 끝(788줄 뒤)에 빈 줄 1개 + 아래 블록을 그대로** 붙인다. 글자 하나 바꾸지 말 것(선택자 목록 포함).

```css
/* ═══════════════════════════════════════════════════════════════════════
   2026-10-09 전역 버튼 톤 (종현 확정: B색 + 납작2) — study114-ds docs/217
   - 위쪽 기존 버튼 규칙은 지우지 않는다. 제외 버튼(폼 최종 제출·결제·홍보 배너)은 그 값을 그대로 쓴다.
   - 아래 규칙은 제외 목록이 아닌 버튼만 덮는다. :not(:where(…))는 특이도 0 → 기존 선택자와 특이도 동일, 뒤에 있어서 이김.
   - 제외 목록 (12개 — 바꿀 때는 이 블록 안 모든 :not(:where(…)) 목록을 똑같이 바꾼다):
     .btn--block · button[type=submit]:not(.btn--search) · .p19-form-actions .btn · [data-action=save|save-basic-all|save-detail|next]
     · [data-plans-pay] · .plans-order-summary__cta · .plans-card__cta · .home-mkt__cta · .home-app--role-parent .mp-room .btn
   ═══════════════════════════════════════════════════════════════════════ */

/* (1) 크기 — 기본 30 */
.btn:not(:where(.btn--block, button[type='submit']:not(.btn--search), .p19-form-actions .btn, [data-action='save'], [data-action='save-basic-all'], [data-action='save-detail'], [data-action='next'], [data-plans-pay], .plans-order-summary__cta, .plans-card__cta, .home-mkt__cta, .home-app--role-parent .mp-room .btn)),
.uds-theme .btn:not(:where(.btn--block, button[type='submit']:not(.btn--search), .p19-form-actions .btn, [data-action='save'], [data-action='save-basic-all'], [data-action='save-detail'], [data-action='next'], [data-plans-pay], .plans-order-summary__cta, .plans-card__cta, .home-mkt__cta, .home-app--role-parent .mp-room .btn)),
.guest-gate__actions .btn:not(:where(.btn--block, button[type='submit']:not(.btn--search), .p19-form-actions .btn, [data-action='save'], [data-action='save-basic-all'], [data-action='save-detail'], [data-action='next'], [data-plans-pay], .plans-order-summary__cta, .plans-card__cta, .home-mkt__cta, .home-app--role-parent .mp-room .btn)) {
  min-height: var(--btn-tone-h);
  padding-block: 0;
  padding-inline: var(--btn-tone-pad);
  border-radius: var(--btn-tone-radius) !important;
  font-size: var(--btn-tone-fs);
  font-weight: var(--fw-semibold, 600);
  line-height: 1;
}

/* (2) 검색 30 (최소 폭 72는 기존 규칙 유지) */
.btn--search:not(:where(.btn--block, button[type='submit']:not(.btn--search), .p19-form-actions .btn, [data-action='save'], [data-action='save-basic-all'], [data-action='save-detail'], [data-action='next'], [data-plans-pay], .plans-order-summary__cta, .plans-card__cta, .home-mkt__cta, .home-app--role-parent .mp-room .btn)),
.search-find-bar .btn--primary:not(:where(.btn--block, button[type='submit']:not(.btn--search), .p19-form-actions .btn, [data-action='save'], [data-action='save-basic-all'], [data-action='save-detail'], [data-action='next'], [data-plans-pay], .plans-order-summary__cta, .plans-card__cta, .home-mkt__cta, .home-app--role-parent .mp-room .btn)),
.find-toolbar .btn--primary:not(:where(.btn--block, button[type='submit']:not(.btn--search), .p19-form-actions .btn, [data-action='save'], [data-action='save-basic-all'], [data-action='save-detail'], [data-action='next'], [data-plans-pay], .plans-order-summary__cta, .plans-card__cta, .home-mkt__cta, .home-app--role-parent .mp-room .btn)) {
  min-height: var(--btn-tone-h);
  padding-block: 0;
}

/* (3) 작은·머리 26 */
.btn--sm:not(:where(.btn--block, button[type='submit']:not(.btn--search), .p19-form-actions .btn, [data-action='save'], [data-action='save-basic-all'], [data-action='save-detail'], [data-action='next'], [data-plans-pay], .plans-order-summary__cta, .plans-card__cta, .home-mkt__cta, .home-app--role-parent .mp-room .btn)),
.btn--compact:not(:where(.btn--block, button[type='submit']:not(.btn--search), .p19-form-actions .btn, [data-action='save'], [data-action='save-basic-all'], [data-action='save-detail'], [data-action='next'], [data-plans-pay], .plans-order-summary__cta, .plans-card__cta, .home-mkt__cta, .home-app--role-parent .mp-room .btn)),
.uds-theme .btn--sm:not(:where(.btn--block, button[type='submit']:not(.btn--search), .p19-form-actions .btn, [data-action='save'], [data-action='save-basic-all'], [data-action='save-detail'], [data-action='next'], [data-plans-pay], .plans-order-summary__cta, .plans-card__cta, .home-mkt__cta, .home-app--role-parent .mp-room .btn)),
.mypage-next-action .btn:not(:where(.btn--block, button[type='submit']:not(.btn--search), .p19-form-actions .btn, [data-action='save'], [data-action='save-basic-all'], [data-action='save-detail'], [data-action='next'], [data-plans-pay], .plans-order-summary__cta, .plans-card__cta, .home-mkt__cta, .home-app--role-parent .mp-room .btn)),
.mypage-layout .mypage-actions-row .btn:not(:where(.btn--block, button[type='submit']:not(.btn--search), .p19-form-actions .btn, [data-action='save'], [data-action='save-basic-all'], [data-action='save-detail'], [data-action='next'], [data-plans-pay], .plans-order-summary__cta, .plans-card__cta, .home-mkt__cta, .home-app--role-parent .mp-room .btn)) {
  min-height: var(--btn-tone-h-sm);
  padding-inline: var(--btn-tone-pad-sm);
  font-size: var(--btn-tone-fs);
}

/* (4) 카드 안 버튼 30 (「유료상품 보기」 btn--sm이어도 30) */
.expo-card .btn:not(:where(.btn--block, button[type='submit']:not(.btn--search), .p19-form-actions .btn, [data-action='save'], [data-action='save-basic-all'], [data-action='save-detail'], [data-action='next'], [data-plans-pay], .plans-order-summary__cta, .plans-card__cta, .home-mkt__cta, .home-app--role-parent .mp-room .btn)),
.slot-card .btn:not(:where(.btn--block, button[type='submit']:not(.btn--search), .p19-form-actions .btn, [data-action='save'], [data-action='save-basic-all'], [data-action='save-detail'], [data-action='next'], [data-plans-pay], .plans-order-summary__cta, .plans-card__cta, .home-mkt__cta, .home-app--role-parent .mp-room .btn)),
.browse-row .btn:not(:where(.btn--block, button[type='submit']:not(.btn--search), .p19-form-actions .btn, [data-action='save'], [data-action='save-basic-all'], [data-action='save-detail'], [data-action='next'], [data-plans-pay], .plans-order-summary__cta, .plans-card__cta, .home-mkt__cta, .home-app--role-parent .mp-room .btn)),
.btn--detail:not(:where(.btn--block, button[type='submit']:not(.btn--search), .p19-form-actions .btn, [data-action='save'], [data-action='save-basic-all'], [data-action='save-detail'], [data-action='next'], [data-plans-pay], .plans-order-summary__cta, .plans-card__cta, .home-mkt__cta, .home-app--role-parent .mp-room .btn)) {
  min-height: var(--btn-tone-h);
  padding-inline: var(--btn-tone-pad);
}

/* (6) 색 — 일반 채움 (B안). 기존 !important 규칙(design-system·product-chrome·mypage-ops)보다 특이도 높음 */
.btn.btn--primary:not(:where(.btn--block, button[type='submit']:not(.btn--search), .p19-form-actions .btn, [data-action='save'], [data-action='save-basic-all'], [data-action='save-detail'], [data-action='next'], [data-plans-pay], .plans-order-summary__cta, .plans-card__cta, .home-mkt__cta, .home-app--role-parent .mp-room .btn)) {
  background: var(--btn-tone-bg) !important;
  border-color: var(--btn-tone-bg) !important;
  color: var(--btn-tone-fg) !important;
}
.btn.btn--primary:not(:where(.btn--block, button[type='submit']:not(.btn--search), .p19-form-actions .btn, [data-action='save'], [data-action='save-basic-all'], [data-action='save-detail'], [data-action='next'], [data-plans-pay], .plans-order-summary__cta, .plans-card__cta, .home-mkt__cta, .home-app--role-parent .mp-room .btn)):hover {
  background: var(--btn-tone-hover) !important;
  border-color: var(--btn-tone-hover) !important;
  filter: none;
}
.btn.btn--primary:not(:where(.btn--block, button[type='submit']:not(.btn--search), .p19-form-actions .btn, [data-action='save'], [data-action='save-basic-all'], [data-action='save-detail'], [data-action='next'], [data-plans-pay], .plans-order-summary__cta, .plans-card__cta, .home-mkt__cta, .home-app--role-parent .mp-room .btn)):active {
  background: var(--btn-tone-active) !important;
  border-color: var(--btn-tone-active) !important;
}

/* (8) 정렬 select 「최신순」 — 데스크톱 30·14px / 모바일 44·16px(iOS 확대 방지) */
select.list-sort-bar__select {
  min-height: var(--btn-tone-h);
  height: var(--btn-tone-h);
  padding-block: 0;
  font-size: var(--btn-tone-fs);
  border-radius: var(--btn-tone-radius);
}
```

커밋: `style(button): 일반 버튼 톤 다운 — 30/26·14px·#729FD9/#0B2545, 폼 제출·결제 제외`

### 소작업 3/3 — 모바일 높이 유지 + 누르는 영역 44 + 검사 스크립트 (F2 덧붙이기 2, F3)
B-3-1. 소작업 2 블록 **바로 뒤에** 그대로 붙인다:

```css
/* (5) 모바일 — 보이는 높이 유지 (기존 44 규칙을 같은 특이도로 덮음) */
@media (max-width: 768px) {
  .btn:not(:where(.btn--block, button[type='submit']:not(.btn--search), .p19-form-actions .btn, [data-action='save'], [data-action='save-basic-all'], [data-action='save-detail'], [data-action='next'], [data-plans-pay], .plans-order-summary__cta, .plans-card__cta, .home-mkt__cta, .home-app--role-parent .mp-room .btn)),
  .btn--search:not(:where(.btn--block, button[type='submit']:not(.btn--search), .p19-form-actions .btn, [data-action='save'], [data-action='save-basic-all'], [data-action='save-detail'], [data-action='next'], [data-plans-pay], .plans-order-summary__cta, .plans-card__cta, .home-mkt__cta, .home-app--role-parent .mp-room .btn)),
  .expo-card .btn:not(:where(.btn--block, button[type='submit']:not(.btn--search), .p19-form-actions .btn, [data-action='save'], [data-action='save-basic-all'], [data-action='save-detail'], [data-action='next'], [data-plans-pay], .plans-order-summary__cta, .plans-card__cta, .home-mkt__cta, .home-app--role-parent .mp-room .btn)),
  .slot-card .btn:not(:where(.btn--block, button[type='submit']:not(.btn--search), .p19-form-actions .btn, [data-action='save'], [data-action='save-basic-all'], [data-action='save-detail'], [data-action='next'], [data-plans-pay], .plans-order-summary__cta, .plans-card__cta, .home-mkt__cta, .home-app--role-parent .mp-room .btn)),
  .uds-theme .btn:not(:where(.btn--block, button[type='submit']:not(.btn--search), .p19-form-actions .btn, [data-action='save'], [data-action='save-basic-all'], [data-action='save-detail'], [data-action='next'], [data-plans-pay], .plans-order-summary__cta, .plans-card__cta, .home-mkt__cta, .home-app--role-parent .mp-room .btn)),
  .guest-gate__actions .btn:not(:where(.btn--block, button[type='submit']:not(.btn--search), .p19-form-actions .btn, [data-action='save'], [data-action='save-basic-all'], [data-action='save-detail'], [data-action='next'], [data-plans-pay], .plans-order-summary__cta, .plans-card__cta, .home-mkt__cta, .home-app--role-parent .mp-room .btn)) {
    min-height: var(--btn-tone-h);
  }
  .btn--sm:not(:where(.btn--block, button[type='submit']:not(.btn--search), .p19-form-actions .btn, [data-action='save'], [data-action='save-basic-all'], [data-action='save-detail'], [data-action='next'], [data-plans-pay], .plans-order-summary__cta, .plans-card__cta, .home-mkt__cta, .home-app--role-parent .mp-room .btn)),
  .btn--compact:not(:where(.btn--block, button[type='submit']:not(.btn--search), .p19-form-actions .btn, [data-action='save'], [data-action='save-basic-all'], [data-action='save-detail'], [data-action='next'], [data-plans-pay], .plans-order-summary__cta, .plans-card__cta, .home-mkt__cta, .home-app--role-parent .mp-room .btn)),
  .uds-theme .btn--sm:not(:where(.btn--block, button[type='submit']:not(.btn--search), .p19-form-actions .btn, [data-action='save'], [data-action='save-basic-all'], [data-action='save-detail'], [data-action='next'], [data-plans-pay], .plans-order-summary__cta, .plans-card__cta, .home-mkt__cta, .home-app--role-parent .mp-room .btn)),
  .mypage-next-action .btn:not(:where(.btn--block, button[type='submit']:not(.btn--search), .p19-form-actions .btn, [data-action='save'], [data-action='save-basic-all'], [data-action='save-detail'], [data-action='next'], [data-plans-pay], .plans-order-summary__cta, .plans-card__cta, .home-mkt__cta, .home-app--role-parent .mp-room .btn)) {
    min-height: var(--btn-tone-h-sm);
  }
}
@media (max-width: 480px) {
  :is(.guide-app, .concern-app, .support-app) .cta-row .btn:not(:where(.btn--block, button[type='submit']:not(.btn--search), .p19-form-actions .btn, [data-action='save'], [data-action='save-basic-all'], [data-action='save-detail'], [data-action='next'], [data-plans-pay], .plans-order-summary__cta, .plans-card__cta, .home-mkt__cta, .home-app--role-parent .mp-room .btn)),
  :is(.guide-app, .concern-app, .support-app) .slim-cta .btn:not(:where(.btn--block, button[type='submit']:not(.btn--search), .p19-form-actions .btn, [data-action='save'], [data-action='save-basic-all'], [data-action='save-detail'], [data-action='next'], [data-plans-pay], .plans-order-summary__cta, .plans-card__cta, .home-mkt__cta, .home-app--role-parent .mp-room .btn)) {
    min-height: var(--btn-tone-h);
    padding-inline: var(--btn-tone-pad);
  }
}

/* (7) 모바일 누르는 영역 ≥44 — 투명 레이어, 레이아웃 이동 없음 */
@media (max-width: 768px) {
  :where(.btn) {
    position: relative;
  }
  .btn::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    top: 50%;
    height: max(100%, var(--btn-tone-hit));
    transform: translateY(-50%);
  }
}

/* (8-m) 정렬 select 모바일 — 44·16px(iOS 확대 방지) */
@media (max-width: 768px) {
  select.list-sort-bar__select {
    min-height: var(--input-h);
    height: var(--input-h);
    font-size: var(--fs-3);
  }
}
```

B-3-2. `scripts/verify-global-button-tone.mjs` 새로 만든다 (Playwright, 저장소에 이미 있는 `@playwright/test`의 `chromium` 사용. 새 패키지 설치 금지).
- 입력: 환경변수 `HOME_URL`(기본 `http://127.0.0.1:5174`), `SEARCH_URL`, `ROOM_URL`, `AUTH_URL`(각 SPA dev 서버). 서버를 스스로 띄우지 않음 — 안 떠 있으면 「SKIP + 이유」로 실패 처리(exit 1).
- §C 「화면 목록」의 각 화면을 **1280×900, 390×844**로 열고, 지정 버튼을 **카피 텍스트**로 찾아 `getComputedStyle` 측정.
- §C 합격 기준 C-1~C-8을 항목별 `ok/fail`로 출력, 마지막 줄 `PASS n / FAIL m`. FAIL ≥1이면 exit 1.
- 대비는 계산된 `background-color`·`color`로 WCAG 상대휘도 공식 계산(소수 둘째 자리).
- 로그인이 필요한 화면(공부방 홈 머리 박스, 마이페이지 내부)은 `page.route('**/api/auth/me.php')` 등으로 세션을 흉내 내거나, 불가하면 「수동 확인 필요」로 출력(이 항목은 FAIL로 세지 않되 보고에 명시).
커밋: `style(button): 모바일 누르는 영역 44 + verify-global-button-tone`

---

## §C. 화면 목록 · 숫자형 합격 기준

### 화면 목록 (전수 확인 — 1280 / 390 각각)
| # | 화면 (SPA · 경로) | 확인 버튼 (카피 · file:line) | 기대 |
|---|---|---|---|
| 1 | home-ui `#/guest` | 유료상품 보기 (`home-ui/src/exposure-render.js:570,603`) — 프라임 3칸·픽 5칸 전부 | 채움 30 |
| 2 | home-ui `#/guest` | 로그인 / 회원가입 (`guest-sections.js:233-234`) | 채움 26 / 흰 26 |
| 3 | home-ui `#/guest` | 정렬 「최신순」 select (`shared/list-sort.js:259`) | 30·14px / 모바일 44·16px |
| 4 | home-ui `#/guest` | 지도 히어로 「OO동 공부방·과외쌤 찾기」 (`hero-map__cta`) | 채움 색 · 높이 30 · **글자 12px 유지**(전용 규칙) |
| 5 | home-ui `#/study-room` (공부방 로그인) | 마이페이지 / 쪽지 후기함 (`screens/study-room.js:82-83`) · 유료상품 보기 | 채움 26 / 흰 26 · 30 |
| 6 | home-ui `#/tutor` (과외쌤 로그인) | 마이페이지 / 쪽지 후기함 (`screens/tutor.js:96-97`) | 26 |
| 7 | search-ui `#/search/room`, `#/search/tutor` | 초기화 / 검색 (`search-find-surface.js:2560-2561`) · 주소찾기 · 최신순 | 흰 30 / 채움 30(폭 ≥72, 상세검색은 104 유지) · 26 · 30 |
| 8 | home-ui 홈 지역바 | 지역 변경 / 검색 (`layout.js:271-272`) | 흰 26 / 채움 26 (btn--sm) |
| 9 | home-ui `#/support` | 자주 묻는 질문 (`support/screens.js:201`) / 운영문의 남기기 (`:202`) · tip 운영문의 남기기 (`:253`, sm) | 채움 30 / 흰 30 / 채움 26 |
| 10 | home-ui `#/support/contact` (비로그인 안내) | 운영문의 남기기 / 회원가입 (`support/screens.js:98-99`) | 채움 30 / 흰 30 |
| 11 | home-ui `#/guide` 및 하위 | 공부방 찾기 시작 / 과외쌤 찾기 시작 (`guide/screens.js:96-98`) · 찜한 공부방·과외쌤 보기 / 쪽지함 보기 (`:462-463`) · 운영문의 / 고객센터 가기 (`:642-643`) | 채움 30 / 흰 30 |
| 12 | home-ui `#/mypage` (비로그인 안내) | 로그인하고 마이페이지 열기 / 회원가입 (`shared/guest-gate-ui.js:71-72`) | 채움 30 / 흰 30 |
| 13 | study-room-ui·tutor-ui 등록 안내 (비로그인) | 로그인 후 등록 이어하기 / 회원가입 (`guest-gate-ui.js:71-72`, 카피 `:106`) | 채움 30 / 흰 30 |
| 14 | home-ui 마이페이지 (로그인) | 「다음 할 일」·액션 줄 버튼, 새 운영문의 남기기 (`mypage-ops.css:533,615` 대상) | 26 |
| 15 | home-ui `#/plans` | 노출상품 보기 (`plans/screens.js:1271`, sm) | 채움 26 |
| **제외 확인** | | | **변화 0** |
| X1 | auth-ui `#/login`, `#/signup/*`, `#/find-id`, `#/find-password` | 로그인·다음·가입정보 저장 등 `btn--block` | #266BC4·#FFF·44·16px·radius 8 그대로 |
| X2 | home-ui `#/support/contact` (로그인) | 운영문의 남기기 **제출** (`support/screens.js:352`) | 그대로 (#266BC4·40·16px) |
| X3 | home-ui 쪽지 | 전송 (`messages/screens.js:229`) | 그대로 |
| X4 | home-ui 등록·마이페이지 폼 | 저장·상세정보 저장·표시명 저장 (`student-reg/screens.js:362`, `study-room-reg/screens.js:350,419`, `tutor-reg/screens.js:424,533`, `mypage/screens.js:1017,1084`) | 그대로 |
| X5 | study-room-ui·tutor-ui 등록 단계 | 저장·다음 (`[data-action=save|save-basic-all|save-detail|next]`) | 그대로 |
| X6 | home-ui `#/plans/checkout` 등 | 결제하기 (`plans/screens.js:1537`), 주문 CTA (`order-blocks.js:417`), 상품 카드 CTA (`screens.js:658,792`) | 그대로 |
| X7 | search-ui 상단 홍보 배너 | 홈으로 등 `.home-mkt__cta` | 그대로 (44·16px) |
| X8 | 쪽지 탭 활성 `.msg-tab.is-active` | — | 그대로 |

### 합격 기준 (숫자)
- **C-1 높이:** 화면 목록 1–15의 대상 버튼 `getBoundingClientRect().height` = 채움·기본·카드 **30.0 ±0.5**, 작은(`.btn--sm`)·머리 **26.0 ±0.5** — 1280·390 둘 다. (flex/grid로 늘어나는 곳은 늘어난 원인 file:line 보고)
- **C-2 글자:** `font-size` = **14px**, `font-weight` = **600**, `line-height` = **14px**(=1). 예외: #4 히어로 12px. select #3은 1280 14px / 390 16px.
- **C-3 모양:** `border-radius` = **6px**. 좌우 padding = 기본 **14px** / 작은 **12px** (예외: 검색 상세검색 20px, 히어로 8px, 검색 결과 카드 안 버튼(handoff-bridge) 기존 값 — 보고만).
- **C-4 색(채움):** `background-color` = **rgb(114, 159, 217)**, `color` = **rgb(11, 37, 69)**; hover = **rgb(103, 151, 214)**; 누름 = **rgb(92, 143, 211)**. 흰 테두리 버튼 색은 §A-2 현재값과 같음.
- **C-5 대비:** 계산된 글자/바탕 대비 **≥ 4.5 : 1** (기대 5.62 / hover 5.11 / 누름 4.63). 4.5 미만 1개라도 = 불합격.
- **C-6 모바일 누르는 영역(390):** 대상 버튼마다 `getComputedStyle(el,'::after').height` **≥ 44px** 이고, 버튼 가운데 x에서 `y = 가운데 ± 21px` 두 점의 `document.elementFromPoint(...)`가 그 버튼(또는 자손)이어야 함. 다른 버튼에 가려지거나 부모 `overflow:hidden`으로 잘리는 곳은 목록으로 보고(개수·file:line).
- **C-7 레이아웃:** 390에서 `document.documentElement.scrollWidth ≤ 390`(가로 넘침 0). 버튼 줄이 2줄로 꺾이는 곳이 새로 생기면 보고.
- **C-8 제외 변화 0:** X1–X8 버튼의 바탕·글자색·높이·글자·radius·padding이 §A-2 현재값과 **완전히 같음**(1280·390).
- **C-9 범위:** `git diff --name-only origin/main...HEAD` = F1·F2·F3 **딱 3개**. F2는 788줄 뒤 덧붙임만(`git diff -U0`에서 `@@ -788` 이전 hunk 0). JS·PHP 변경 0.
- **C-10 기존 검사 통과(전부, 실행 로그 마지막 줄 첨부):**
  - `npm run verify:shop-page`
  - `npm run verify:card-visual`
  - `cd preview/home-ui && npx vite-node ../../scripts/verify-study-room-box-shape.mjs`
  - `npx vite-node scripts/verify-hide-inquiry-bundle.mjs`
  - `cd preview/home-ui && npx --yes vite-node ../../scripts/verify-home-news-row.mjs`
  - `npx --prefix preview/home-ui vite-node scripts/verify-input-fill-rule.mjs`
  - `node scripts/verify-global-button-tone.mjs` (새 스크립트) → **FAIL 0**
  - 각 SPA `npm run build`(home-ui·search-ui·study-room-ui·tutor-ui·auth-ui) 성공
- **C-11 화면 목록 전수 캡처:** 1–15, X1–X8 각각 1280·390 전/후 캡처 경로 첨부(없으면 그 항목 불합격).

### 이번에 하지 않는 것 (손대면 불합격)
- 히어로 CTA 글자 크기, 검색 상세 폭 104, 검색 결과 카드 안 버튼 padding, 학생 마이페이지(`student-mypage-stage5b.css`)·폼 맥락 하드코딩 크기, PHP 구 auth CSS(`public/assets/css/auth/*` 주황), 고객센터 히어로 흰 버튼(`zip-bridge.css:243`), 탭·칩·뱃지, focus 링·disabled 새 디자인, 죽은 CSS 정리.

## 6. 보고 형식 (마지막 메시지 하나)
1. 기준 SHA · 브랜치 · 커밋 3개 SHA
2. `git diff --stat`
3. 합격 기준 C-1~C-11 표 (항목 · 결과 · 근거 숫자/로그)
4. 화면 목록 전/후 측정표 (1280·390)
5. 막힘·수동 확인 항목
6. 다음 단계: **종현 승인 전 main push·머지·배포 하지 않음** 명시
````

---

## 우동공과2 메모 (Cursor에 보내지 않음)

- §C 「현재」 실측(1280): 유료상품 보기 16px/40/#266BC4/#FFF/8 · 로그인·회원가입(띠) 16px/40 · 최신순 16px/44 · 초기화 16px/44 · 검색 16px/40/폭104 · 자주 묻는 질문 16px/44 · 공부방 찾기 시작 16px/44 · 게스트 안내판 14px/44 · 로그인(auth 제출) 16px/44. 390은 전부 44.
- 같은 블록을 프리뷰 끝에 주입한 실측(`sim/sim-after.css`) 결과: 위 화면 전부 기대값 일치, 제외 버튼 9종 합성 테스트 **변화 0** 확인(2026-10-10 00:10 KST).
- 블록 원문: `sim/proposed-tokens.css`, `sim/proposed-udx-block-part1.css`(소작업 2), `sim/proposed-udx-block-part2.css`(소작업 3).
- 브라우저 지원: `:not()` 안 복합 선택자·`:where()`·`max()` — Chrome 88+, Safari 14+, Firefox 84+.
