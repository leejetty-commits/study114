# 이웃 팝업 들여쓰기 · 구매이력 버튼 안내 · 안내글 글머리 · 퀵매칭 Event 겹침 (2026-11-15)

- 작성: 우동공과3 · 실행: Cursor · 최종검수: 우동공과3 / 종현
- 기준: origin/main `0526ef203c9aff17fe2f636169e7d305295b7b40`
- 브랜치: **`work/popup-bullets-event-2026-11-15`** (위 main에서 새로 만듦)
- 한 PR, 한 작업. **PR만 열고 보고. 머지 금지.**
- 종현 결정(t2001u): 남은 작업 2번(이웃 팝업)·7번(구매이력 안내·콘텐츠 글머리)·8번(Event 겹침)을 같이 진행.
- **DB·SQL 변경 없음.** 서버(PHP)·API·결제·환불 로직 변경 없음. 화면 문구·마크업·CSS만.

## 0. 항목별 파일과 겹침

| 항목 | 바꿀 파일 |
|---|---|
| A 이웃 팝업 들여쓰기 | `preview/home-ui/src/neighborhood-greeting-ui.js`(팝업 항목 마크업만), `preview/home-ui/src/styles/neighborhood-greeting.css` |
| B 구매이력 버튼 안내 | `preview/home-ui/src/plans/screens-orders.js`(`renderPlansHistory` 안), `preview/home-ui/src/mypage/mypage-copy.js`(문구 상수 추가), `preview/home-ui/src/styles/mypage-ops.css`(330 블록 아래 추가) |
| C 안내글 글머리 | `preview/home-ui/src/styles/zip-guide.css`(맨 아래 추가). 빈 상태 문구 제외용 클래스가 필요하면 `preview/home-ui/src/guide/screens.js`, `preview/home-ui/src/support/screens.js`에 클래스만 추가 |
| D 퀵매칭 Event 겹침 | `preview/home-ui/src/styles/mypage-quick-match.css`만 |
| 공통 | 작업 기록 1개(`docs/worklog/2026/11/` 아래) |

겹침: **네 항목이 같은 파일을 고치지 않는다.** B의 `mypage-ops.css`는 첫 줄에서 `mypage-quick-match.css`를 `@import` 하지만, D는 `mypage-quick-match.css`만 고치고 B는 `mypage-ops.css` 본문만 고치므로 충돌 없음. C는 `.guide-app`·`.support-app` 안에만 적용되므로 마이페이지(B·D)·홈 팝업(A)에 닿지 않는다. 순서는 A → B → C → D, 항목마다 커밋 1개 권장.

---

## A. 동네 인사 팝업 인삿말 들여쓰기

원 지시서: `docs/worklog/grok-sync/docs/neighbor-popup-indent-2026-11-14.md` (브랜치 `docs/payment-result-popup-2026-11-14`, `98fbfb4e`). **그 지시서 내용을 그대로 따른다.** 아래는 요약과 main 재확인 결과.

### A-1. 위치 재확인 (origin/main `0526ef20`)

원 지시서 기준(`efc881f7`) 이후 `neighborhood-greeting-ui.js`, `neighborhood-greeting.css`, `home-news-copy.js`는 **바뀌지 않았다**(main.js만 10줄 추가, CSS 연결 줄 20은 그대로). 줄 번호 그대로 유효:

| 파일:줄 | 내용 |
|---|---|
| `neighborhood-greeting-ui.js:353` | `openGreetingFeed()` |
| `neighborhood-greeting-ui.js:376-382` | **팝업 항목 마크업(여기만 손봄)** — `.ng-feed__item` > `.ng-feed__who`(배지+이름) + `.ng-feed__body` |
| `neighborhood-greeting-ui.js:211` | 배지 글자(새 이웃/과외쌤/공부방) |
| `neighborhood-greeting-ui.js:428` | `closest('[data-ng-feed-name]')` 클릭 — 속성 유지 필수 |
| `neighborhood-greeting.css:153` `.ng-feed__who` · `:160` `.ng-feed__kind` · `:177` `.ng-feed__body` · `:86,95` `.ng-feed__name` | 팝업 CSS |

### A-2. 바꿀 것

- 항목을 **배지 칸 / (이름+본문) 칸** 두 칸 그리드로 나눈다. 예: `.ng-feed__item { display:grid; grid-template-columns:auto 1fr; column-gap:0.4rem; align-items:start; }`, 둘째 칸 `min-width:0`.
- 인삿말 왼쪽 = 그 항목 **이름 첫 글자** 왼쪽. 줄바꿈된 둘째 줄도 같은 세로선. 배지 너비가 달라도 각 항목이 자기 배지 너비만큼만 들여 쓴다. **고정 `padding-left` 금지.**
- 480px 이하에서도 같은 그리드(본문을 배지 아래로 내리지 말 것).
- `data-kind`, `data-ng-feed-name`, `data-ng-kind`, `data-ng-reg`, 문구, 배지 색·크기 유지.

### A-3. 건드리지 말 것

홈 칸 레일(`.ng-rail__*`, `greetingCellBody`), 인사 API·정렬·페이지, 카드 열기·로그인 게이트·ESC·닫기, 인사 작성 화면(`.ng-editor`), 다른 홈 팝업.

### A-4. 수락 기준

1. 팝업 각 항목에서 인삿말 첫 줄·다음 줄의 왼쪽이 이름 첫 글자 왼쪽과 같다(개발자 도구 `getBoundingClientRect().left` 차이 1px 이내). 보고에 「새 이웃」·「과외쌤」 항목 값 2쌍을 적는다.
2. 배지 너비가 다른 항목이 한 팝업에 있어도 각자 자기 배지 기준.
3. 이름 누르면 카드 열림, 이전·다음·닫기·ESC 정상.
4. 390px에서도 1~2 성립. 홈 칸 레일 한 줄 배치 그대로.

---

## B. 구매이력 「내역·진행상황·종료·소멸」 버튼 안내

### B-1. 지금 화면 (코드 확인)

- 화면: 마이페이지 「구매이력」(`#/mypage/plans`, 공부방·과외쌤만). `mypage/screens.js:925`가 `renderPlansHistory()`를 부른다. `#/plans/history`(`plans/screens.js:970`)도 같은 함수.
- `plans/screens-orders.js:155-198` `renderPlansHistory()` — 위에 탭 2개 「쪽지권」「노출상품」, 아래 `.plans-history-layout`(195줄)에 행 목록.
- 각 행 오른쪽에 버튼 4개(`:342-345`): **내역 · 진행상황 · 종료 · 소멸.** 해당하지 않으면 흐린(disabled) 버튼. (네 개는 탭이 아니라 **행마다 있는 버튼**이다.)
- 버튼이 켜지는 조건 `resolveV3Cells()` `:253-306`, 눌렀을 때 내용 `:368`(내역) · `:440`(진행상황) · `:510`(종료) · `:520`(소멸):
  - **내역**: 결제가 확인된 상품이면 켜짐. 상품·금액·결제일, 쪽지권은 「사용 N회 / 남은 N회」. 환불 가능하면 「환불 신청」 버튼.
  - **진행상황**: 환불 신청 중·승인·반려·환불 완료일 때만 켜짐. 「신청 → 검토 중 → 승인 → 환불 완료」 단계, 반려면 사유. 완료 전에는 「환불 철회」 가능.
  - **종료**: 남은 횟수가 0회일 때(만료·환불과 무관하게 다 쓴 경우)만 켜짐. 「남은 0회 → 종료」.
  - **소멸**: 사용기한이 지났을 때 켜짐. 「남은 N회 → 소멸 (환불 대상 아님)」. 쪽지권 사용기한은 구매일부터 120일, 지나면 남은 횟수 소멸·환불액 0·연장 없음(`plans/screens.js:749-750`).
- 빈 상태(`:200-236`)는 흐린 예시 행 + 안내. 예시 행에도 같은 버튼 4개가 흐리게 보인다.

### B-2. 바꿀 것

1. `mypage/mypage-copy.js`의 `HISTORY_EMPTY_COPY` 아래에 문구 상수 `HISTORY_GUIDE_COPY`를 추가하고 `screens-orders.js` 22줄 import에 넣는다.
2. `renderPlansHistory()`에서 `.plans-history-layout` div **바로 아래**(같은 `section` 안)에 안내 상자를 넣는다. 두 탭 모두, 내역이 있을 때와 빈 상태 모두 보인다. 학생·게스트 분기(157-163줄)는 그대로라 거기엔 안 나온다.
3. 마크업 예:

```html
<div class="plans-hist-guide" aria-label="버튼 안내">
  <p class="plans-hist-guide__title">버튼 안내</p>
  <dl class="plans-hist-guide__list">
    <div><dt>내역</dt><dd>…</dd></div>
    <div><dt>진행상황</dt><dd>…</dd></div>
    <div><dt>종료</dt><dd>…</dd></div>
    <div><dt>소멸</dt><dd>…</dd></div>
  </dl>
  <p class="plans-hist-guide__note">…</p>
</div>
```

4. CSS는 `mypage-ops.css`의 「330 구매이력 빈 상태」 블록 뒤에 추가. 행보다 눈에 덜 띄게: 연한 회색 배경(`#f9fafb`) 또는 위쪽 1px 선, 글자 13px·`#4b5563`, `dt`는 굵게(행 버튼과 같은 낱말), 줄간격 1.5. 390px에서는 `dt`와 `dd`가 위아래로 쌓여도 됨.

### B-3. 문구 (그대로 넣기)

- 제목: **버튼 안내**
- **내역** — 결제한 상품과 금액, 결제일을 볼 수 있어요. 쪽지권은 사용한 횟수와 남은 횟수도 함께 나와요. 환불할 수 있는 상품이면 여기서 환불 신청을 할 수 있어요.
- **진행상황** — 환불을 신청하면 「신청 → 검토 중 → 승인 → 환불 완료」 중 어디까지 왔는지 보여 드려요. 환불이 끝나기 전에는 신청을 철회할 수 있고, 반려되면 그 이유도 여기서 볼 수 있어요.
- **종료** — 쪽지권을 모두 사용해서 남은 횟수가 0회가 된 상품이에요.
- **소멸** — 사용기한이 지나 끝난 상품이에요. 남은 횟수가 있었다면 함께 사라지고, 환불되지 않아요.
- 맺음: 흐리게 보이는 버튼은 지금 그 상품에 해당하지 않는다는 뜻이에요.

### B-4. 건드리지 말 것

`resolveV3Cells` 조건, 버튼 이름·순서, 패널 내용, 환불 신청·철회 동작, 환불 규정 문구(`refund-policy-copy.js`), 결제 API.

### B-5. 수락 기준

1. 「쪽지권」「노출상품」 두 탭 모두 목록 아래에 「버튼 안내」 상자가 보이고 문구가 B-3과 글자 하나 다르지 않다.
2. 빈 상태(예시 행 + 「아직 결제한 내역이 없어요」)에서도 안내가 보이고, 빈 상태 CTA 버튼보다 아래에 있다.
3. 행 버튼·패널·환불 신청 동작이 바뀌지 않았다.
4. 학생 계정 `#/mypage/plans`에는 나오지 않는다.

---

## C. 안내·FAQ·이용안내 본문 글머리 기호

### C-1. 문제

이용안내·고객센터 본문 문단이 제목(`.section-head` h2, 약관 `h3`) 바로 아래에서 기호 없이 시작해, 제목과 본문의 경계가 약해 보인다. 문장을 하나하나 고치지 말고 **본문 칸 범위 CSS 한 묶음**으로 문단 앞에 작은 기호를 붙인다.

### C-2. 대상 컨테이너 (코드 확인)

- 이용안내: 앱 클래스 `.guide-app`(`guide/shell.js:31`), 본문 칸 `.guide-frame__body`(`guide/shell.js:19`).
- 고객센터(FAQ·공지·약관·운영문의): `.support-app`(`support/shell.js:35`), 본문 칸 `.sup-frame__body`(`support/shell.js:23`).
- 이미 공용 규칙이 `zip-guide.css:534` `:is(.guide-app, .concern-app, .support-app) .section-lead`에 있다. 고민방(`.concern-app`)은 **이번 범위 밖**.

글머리를 붙일 문단:

| 선택자 | 어디 |
|---|---|
| `:is(.guide-frame__body, .sup-frame__body) > p.section-lead` | 각 섹션 제목 아래 설명 문단(guide/screens.js 17곳, support/screens.js 8곳) |
| `.guide-frame__body > p:not([class])` | 이용안내 안내 글 본문(`guideParas`, guide/screens.js:26-31, 렌더 :78) |
| `.support-app .faq-item__a > p` | FAQ 답(support/screens.js:58-63 `bodyHtml`, :248) |
| `.guide-app .guide-faq-item__a-body` | 이용안내 안 FAQ 답(guide/screens.js:146) |
| `.support-app .doc-section > p` | 약관·정책 각 조항 제목(h3) 아래 문단(support/screens.js:397) |

붙이지 않을 것: 히어로(`.support-hero`, `guideHero`) 문단, 카드 안 문단(`.situation-card p`, `.card` 안 `.doc-article > p` 요약), `ul`/`li`(이미 목록), 버튼 줄, 입력 폼 안내(`.sup-field`, `.sup-note`), 빈 상태 한 줄(「이 주소의 안내 글이 없습니다.」 guide/screens.js:56, 「등록된 질문이 없습니다.」 support/screens.js:263, 「등록된 공지가 없습니다.」 :311, 「마이페이지의 내 문의 내역으로 이동합니다.」 :140). 빈 상태 4줄은 `section-lead--plain` 클래스를 더해 제외한다(문구는 그대로).

### C-3. CSS (zip-guide.css 맨 아래에 추가)

```css
/* 안내글 글머리 (2026-11-15) — 이용안내·고객센터 본문 문단 */
:is(.guide-app, .support-app) {
  --s114-bullet-size: 4px;
  --s114-bullet-color: var(--uds-muted, #9ca3af);
}
:is(.guide-frame__body, .sup-frame__body) > p.section-lead:not(.section-lead--plain),
.guide-app .guide-frame__body > p:not([class]),
.support-app .faq-item__a > p,
.guide-app .guide-faq-item__a-body,
.support-app .doc-section > p {
  position: relative;
  padding-left: 0.9em;               /* 줄바꿈된 둘째 줄도 첫 글자에 맞춤(내어쓰기) */
}
:is(.guide-frame__body, .sup-frame__body) > p.section-lead:not(.section-lead--plain)::before,
.guide-app .guide-frame__body > p:not([class])::before,
.support-app .faq-item__a > p::before,
.guide-app .guide-faq-item__a-body::before,
.support-app .doc-section > p::before {
  content: "";
  position: absolute;
  left: 0.15em;
  top: 0.72em;                        /* 첫 줄 가운데 높이 */
  width: var(--s114-bullet-size);
  height: var(--s114-bullet-size);
  background: var(--s114-bullet-color);
  border-radius: 1px;                 /* 작은 네모. 가운뎃점으로 바꾸면 50% */
}
```

- 기호는 **CSS로만** 그린다. 문구에 「·」「▪」 글자를 넣지 말 것(복사·검색·읽어 주기 기능에 섞이지 않게).
- 기존 `margin`·글자 크기·색은 그대로. `top` 값은 실제 줄높이에 맞춰 첫 줄 가운데에 오도록 조정 가능.
- 기호 모양 기본값은 **작은 네모(4px)**. 종현이 가운뎃점(동그라미)을 고르면 `border-radius: 50%` 한 줄만 바뀐다.

### C-4. 수락 기준

1. 이용안내 홈·찾기 안내·등록 안내·안전 가이드·안내 글 상세(`#/guide/a/…`), 고객센터 FAQ(답 펼침)·약관·정책·운영문의 화면에서 위 대상 문단 앞에 같은 기호가 보인다.
2. 문단이 두 줄 이상이면 둘째 줄이 기호 아래가 아니라 첫 글자 아래에서 시작한다.
3. 히어로·카드·목록·버튼·빈 상태 한 줄에는 기호가 없다. 고민방·홈·마이페이지 화면은 1px도 바뀌지 않는다.
4. 문구(텍스트) diff 없음. `section-lead--plain` 클래스 추가만 허용.

---

## D. 마이페이지 「실시간 퀵매칭 서비스」 메뉴 Event 겹침

### D-1. 원인 (코드 확인)

- 메뉴 정의 `mypage/router.js:90-97`: `labelLines: ['실시간 퀵매칭', '서비스']`, `icon: 'event'`.
- `mypage/shell.js:105-112`: 프라임이면 `is-qm is-prime`(금색), 아니면 `is-qm is-muted`(회색). `icon === 'event'`이면 아이콘 자리에 `<span class="qm-nav__event">Event</span>`를 **항상** 넣는다.
- 메뉴 줄은 그리드 `grid-template-columns: 1.25rem 1fr`(`mypage-ops-shell.css:120-123`). 아이콘 칸은 1.25rem(약 20px)인데 `.qm-nav__event`(`mypage-quick-match.css:7-21`)는 `min-width: 2.4rem` + `margin-right: 0.35rem`라 **첫 칸을 넘쳐 둘째 칸 「실시간」 글자 위에 겹친다.** 480px 이하(`mypage-ops-shell.css:683-693`)도 같은 그리드.

### D-2. 바꿀 것 (`mypage-quick-match.css`만)

```css
.mypage-nav__link.is-qm {
  grid-template-columns: auto minmax(0, 1fr);   /* Event 칸을 글자 길이만큼 */
}
.qm-nav__event {
  /* 기존 값 유지 + 아래만 변경 */
  min-width: 0;
  margin-right: 0;          /* 간격은 그리드 gap이 맡음 */
  align-self: start;        /* 두 줄 라벨의 첫 줄 「실시간 퀵매칭」 높이에 맞춤 */
  margin-top: 0.1em;
  white-space: nowrap;
}
```

- 이 메뉴 하나만 칸 너비가 바뀐다. 다른 메뉴 줄의 그리드·아이콘·구분선은 그대로.
- Event 글자·테두리·크기(10px)·색 상속(`color: inherit`)은 그대로라, 프라임이면 금색 Event, 아니면 회색 Event.
- **`shell.js`·`router.js`는 건드리지 않는다.** 프라임 판정(`prime_active`), Event 항상 표시, 두 줄 라벨, 활성(is-active) 색 규칙 그대로.

### D-3. 수락 기준

1. 1280px 왼쪽 메뉴, 390px 메뉴(2열) 모두 Event 상자와 「실시간」 글자가 겹치지 않고, 그 사이에 다른 메뉴의 아이콘-글자 간격과 같은 틈이 있다.
2. Event는 두 줄 라벨의 첫 줄 높이에 있다.
3. 프라임 계정은 메뉴 글자·Event가 금색, 비프라임은 회색. 두 경우 모두 Event가 보인다.
4. 그 메뉴를 눌러 활성일 때도 겹치지 않는다.
5. 다른 마이페이지 메뉴 줄은 위치·크기 변화 없음(스크린샷 비교).

---

## 공통: 스크린샷 (PR에 첨부, 각 390px·1280px)

| # | 화면 | 확인할 것 |
|---|---|---|
| A | 홈 → 동네 인사 「더보기」 팝업 | 『테』 정렬, 배지 너비 다른 두 항목, 두 줄 인삿말 |
| B1 | 공부방 또는 과외쌤 → 마이페이지 → 구매이력 「쪽지권」 탭(내역 있음) | 목록 아래 「버튼 안내」 |
| B2 | 같은 화면 「노출상품」 탭 또는 빈 상태 | 빈 상태 CTA 아래 안내 |
| C1 | 이용안내 안내 글 상세 1개 | 문단 글머리·두 줄 내어쓰기 |
| C2 | 고객센터 FAQ(답 펼침) | 답 문단 글머리 |
| C3 | 고객센터 약관·정책 | 조항 h3 아래 문단 글머리 |
| D1 | 프라임 계정 마이페이지 메뉴 | 금색 Event, 겹침 없음 |
| D2 | 비프라임 계정 마이페이지 메뉴 | 회색 Event, 겹침 없음 |

바꾸기 전 스크린샷도 A·D는 1장씩(1280px) 첨부.

## 공통: 확인 명령

```bash
git fetch origin && git switch -c work/popup-bullets-event-2026-11-15 origin/main   # 시작 시 main = 0526ef20 확인
cd preview/home-ui && npm run build                                                # 빌드 오류 0
cd ../.. && node scripts/verify-neighborhood-greeting-history.mjs                  # 기존 검증 통과
git diff --stat origin/main...HEAD                                                 # 0절 표의 파일 + 작업 기록만
git diff origin/main...HEAD -- src public/api migrations                           # 비어 있어야 함(서버·DB 변경 없음)
```

## 보고 형식

PR 번호·브랜치 tip 해시, 항목별 바뀐 파일, A의 left 값 2쌍, 스크린샷 링크, 빌드·검증 결과, 「발견 목록」(범위 밖 문제는 고치지 말고 적기).

## 공통 금지

- PR만 열고 보고. **머지·배포 금지.** force push·`reset --hard`·`stash drop` 금지.
- **PR #198은 건드리지 않는다**(리베이스·머지·코멘트 포함).
- 운영 DB·SQL 없음. 키·비밀번호·세션값·테스트 계정 비밀번호를 문서·커밋·PR·보고에 쓰지 않는다.
- 사용자 화면 문구에 개발 용어(API, 서버, 상태값 영문 등) 넣지 않는다.
- 0절 표 밖 파일 수정 금지(작업 기록 제외).

## 열린 질문 (종현 결정)

1. C 글머리 모양: **작은 네모(기본)** / 가운뎃점(동그라미). 정하지 않으면 작은 네모로 진행.
2. C 범위에 약관·정책 조항 문단(`.doc-section > p`)을 넣을지. 기본은 **넣음**.
3. D: Event 칸을 넓히면 이 메뉴 글자만 다른 메뉴보다 약 1rem 오른쪽에서 시작한다. 기본은 이 방식(겹침 해결 우선).
