# 결제 결과 화면 디자인 개선 (2026-11-14)

- 작성: 우동공과3 · 실행: Cursor · 최종검수: 우동공과3
- 기준: origin/main `efc881f7`
- 화면: 유료상품 › 결제 결과 (`#/plans/result`, P18-07)
- 브랜치: `work/payment-result-design-2026-11-14` (main 최신 pull 후 새로 만듦)
- **규칙: 새 브랜치에서 PR만 열고 보고. 머지·force push·운영 SQL 금지.**

## 1. 배경

결제가 끝나면 `#/plans/result`에 결과 화면이 나온다. 노출권(프라임)과 쪽지권이 **같은 함수** `renderPlansResult()`를 쓴다.

지금 화면은 `mypage-info-box` 안에 문장을 `<p>`로 한 줄씩 쌓아 둔 목록이다. 2026-11-14 저녁 노출권 테스트에서 종현님이 확인한 실제 내용은 아래와 같다(금액·날짜는 그날 결제 건 기준, 참고용).

- 결제 완료
- 주문번호 `dev-6cd2b43848addcd1` (`<code>`)
- Prime 노출 · 2개월
- 적용 프로필: …
- 적용 지역: …
- 이용 기간 … ~ …
- 홍보 배지 · Hot
- 배지 소계 …원
- 결제금액 …원
- 노출상품 환불 짧은 안내 문장
- 버튼: 구매이력 보기 / 운영 화면으로 / 상품센터

글이 한 줄씩 나열만 되어 있어 무엇이 얼마인지, 결제가 끝났다는 느낌이 약하다. 이 작업은 **보이는 배치와 CSS만** 다듬는다. 결제·완료·환불 계산, API, 저장값, 문구 상수 내용은 그대로 둔다.

## 2. 정확한 위치 (origin/main `efc881f7`)

| 파일:줄 | 내용 |
|---|---|
| `preview/home-ui/src/plans/screens-orders.js:668-733` | `renderPlansResult()` — 결과 화면 전체를 그리는 함수. **여기 HTML만 손본다.** |
| `preview/home-ui/src/plans/screens-orders.js:670` | `getCheckoutResult()`로 세션 결과를 읽음 |
| `preview/home-ui/src/plans/screens-orders.js:671-692` | 결과 없음·`unavailable` 안내. **이 두 분기는 그대로 둔다.** |
| `preview/home-ui/src/plans/screens-orders.js:694-704` | `ok`, 운영 화면 주소(`backOp`), 배지 줄 조립 |
| `preview/home-ui/src/plans/screens-orders.js:706-732` | 성공·실패·취소·대기 본문. 지금 `<p>` 나열 + `mypage-actions-row` |
| `preview/home-ui/src/plans/screens-orders.js:709` | 제목: `orderStatusLabel(success면 'paid', 아니면 status)` → 「결제 완료」 등 |
| `preview/home-ui/src/plans/screens-orders.js:710` | `주문번호 <code>${result.orderRef}</code>` — `dev-`가 붙은 **저장값 그대로** 출력 |
| `preview/home-ui/src/plans/screens-orders.js:711-717` | 상품·옵션, 프로필, 지역, 이용 기간, 배지, 배지 소계, 결제금액 |
| `preview/home-ui/src/plans/screens-orders.js:718-722` | 환불 짧은 안내. 기간·배지가 있으면 `POSITION_REFUND_SHORT`, 없으면 `MEMO_TICKET_REFUND_SHORT` |
| `preview/home-ui/src/plans/screens-orders.js:723` | 노출상품 무료 쪽지 N회 안내(있을 때만) |
| `preview/home-ui/src/plans/screens-orders.js:724` | `result.message`(실패·취소 메시지) |
| `preview/home-ui/src/plans/screens-orders.js:726-730` | 버튼. 성공: 구매이력 보기(primary) · 운영 화면으로 · 상품센터. 실패 등: 구매이력 보기 · 다시 결제 · 상품센터 |
| `preview/home-ui/src/plans/screens.js:972` | 경로 `#/plans/result` → `renderPlansResult()` |
| `preview/home-ui/src/plans/router.js:23,62` | 경로 `/plans/result` = P18-07, 화면 제목 「결제 결과」 |
| `preview/home-ui/src/plans/checkout-session.js:42-59,82-95` | `PlansResultState`와 `setCheckoutResult` / `getCheckoutResult` (sessionStorage `study114-plans-result`) |
| `preview/home-ui/src/plans/screens.js:1445-1476,1483-1506` | 성공 시 결과에 넣는 필드(`orderRef`, `chargeKrw`, `badgeSaleKrw`, `startedOn` 등). **쓰지 말 것.** |
| `preview/home-ui/src/plans/runtime-config.js:319-321` | `formatKrw` — `12,000원` 형식. 그대로 호출 |
| `preview/home-ui/src/refund-policy-copy.js:16-21` | `MEMO_TICKET_REFUND_SHORT`, `POSITION_REFUND_SHORT`. **글자 하나 바꾸지 말 것** |
| `preview/home-ui/src/mypage/mypage-copy.js:53-62` | `ORDER_STATUS_LABELS` (결제 완료·대기·실패·취소) |
| `preview/home-ui/src/plans/badge-options.js:55-56` | `badgeDisplayName` |
| `src/Paid/ProviderCheckoutService.php:223` | 주문번호 생성: `$orderRef = 'dev-' . bin2hex(random_bytes(8));` — **저장값 자체에 `dev-`가 들어 있음** |
| `src/Paid/Pg/PortOneCheckout.php:101-106` | 포트원 paymentId: `'pay_' . $orderRef` (예: `pay_dev-6cd2b43848addcd1`) |

관련 CSS(직접 고치기보다 **새 클래스**를 추가할 것):

| 파일:줄 | 내용 |
|---|---|
| `preview/home-ui/src/styles/home-member-flows-account.css:1238` | 전역 `.mypage-info-box` (패딩·회색 배경). **이 선택자를 바꾸지 말 것** |
| `preview/home-ui/src/styles/home-member-flows.css:860` | 전역 `.mypage-actions-row` |
| `preview/home-ui/src/styles/mypage-ops-shell.css:637-645` | 마이페이지 안 버튼 `min-height: 2.5rem` |
| `preview/home-ui/src/styles/plans-theme.css:8-23` | 유료상품 색 토큰 (`--plans-primary #266bc4`, `--plans-ok #3f7545`, `--plans-muted #766f64`, `--plans-line #e6dfd4` 등) |
| `preview/home-ui/src/styles/plans-store.css` | 유료상품 전용 스타일을 넣는 곳. **새 결과 화면 CSS는 여기에 `.plans-result`로만 추가** |

쪽지권도 같은 화면이다. 기간·배지가 없으면 해당 줄을 그리지 않고, 환불 안내는 `MEMO_TICKET_REFUND_SHORT`가 나온다. 별도 컴포넌트가 아니다.

## 3. 바꿀 것

`renderPlansResult()`의 성공·실패·취소·대기 본문(706-732줄)만 새 마크업으로 바꾼다. 값·조건·버튼 주소는 지금과 같다.

### 3-1. 전체 뼈대

`<section class="mypage-panel plans-result">` 로 감싼다. 실패·취소·대기는 추가로 `plans-result--fail`(또는 지금처럼 내부 박스에 `is-warn`)를 붙인다.

구성 순서:

1. **상태 머리** — 체크 아이콘(성공만) + 상태 글자(「결제 완료」 등, `orderStatusLabel` 그대로) + **큰 결제금액**(`formatKrw(result.chargeKrw)`, 금액이 있을 때만)
2. **주문번호** — 머리 아래, 작은 흐린 글씨. 라벨은 「주문번호」
3. **정보 카드** — 왼쪽 라벨, 오른쪽 값. 그룹을 얇은 줄로 나눈다
4. **환불 안내** — 흐린 작은 글씨 상자
5. **노출상품 무료 쪽지 안내**(있을 때만, 723줄 문구 그대로)
6. **실패·취소 메시지**(`result.message`, 있을 때만)
7. **버튼 줄**

### 3-2. 주문번호와 `dev-` (중요)

`order_ref`는 화면용 접두어가 아니다. 서버가 `'dev-' + 16진수`로 **저장하고**, 포트원 paymentId도 `pay_` + 그 값을 쓴다. 구매이력·환불 API도 이 문자열을 그대로 쓴다.

그래서 **화면에 `dev-`를 떼지 않는다.** 주문번호는 저장값 전체를, 작은 흐린 글씨로 「주문번호 dev-……」처럼 보여 준다. `<code>` 고정폭은 빼도 된다.

- `result.orderRef` 문자열 자체를 바꾸지 말 것
- `setCheckoutResult` / sessionStorage / 서버 / 포트원 paymentId를 손대지 말 것
- 표시용으로 `dev-`를 잘라 내는 헬퍼를 만들지 말 것 (나중에 조회·고객 안내에 혼선이 난다)

### 3-3. 정보 카드 행

값이 있는 줄만 그린다. 빈 값은 줄을 만들지 않는다. 배지가 없으면 「홍보 배지 없음」도 **그리지 않는다**(지금 704줄의 빈 배지 문구는 없앤다).

그룹 1 — 상품·기간

- 상품: `productName` + (있으면) ` · optionLabel` (지금 711줄과 같음)
- 이용 기간: `startedOn ~ endsOn` (둘 중 하나라도 있을 때만)
- 홍보 배지: 배지가 있을 때만 이름(`badgeDisplayName`). 여러 개면 지금처럼 여러 줄 또는 한 줄에 나열

그룹 2 — 적용

- 적용 프로필: `providerLabel` 있을 때만
- 적용 지역: `regionLabel` 있을 때만

그룹 3 — 금액

- 상품 금액: 배지 소계가 있고(`badgeSaleKrw != null`이고 배지가 1개 이상) `chargeKrw`도 있을 때만. 값은 `chargeKrw - badgeSaleKrw`를 `formatKrw`로. **계산은 화면용이며, 새 필드를 저장하지 말 것.** 음수가 나오면 이 줄은 생략하고 발견 목록에 적는다.
- 배지 소계: 지금 716줄과 같은 조건
- 결제금액: `chargeKrw`가 있을 때만. **이 줄만 글자를 굵게**, 카드 안에서 가장 강조

라벨 너비는 고정(예: 6.5rem)으로 맞춰 값이 오른쪽 끝(또는 라벨 오른쪽)에 가지런히 서게 한다. `dl/dt/dd` 또는 그리드를 써도 된다. 이미 있는 `.mypage-dl`을 참고만 하고, 전역 `.mypage-dl` 자체는 바꾸지 말 것.

### 3-4. 머리·아이콘·환불 상자·버튼

- 성공 머리: 초록 계열 체크(인라인 SVG, 약 28–32px, 색은 `--plans-ok #3f7545`). 새 이미지 파일을 넣지 말 것. 상태 글자는 중간 크기, 금액은 크게(약 1.75–2rem, 굵게). 머리와 금액을 한 덩어리로 보이게.
- 실패·취소·대기: 체크 아이콘 없음. 상태 글자 + (있으면) 금액. 배경은 지금 `is-warn` 톤(`--plans-warn` / `--plans-warn-line`)을 이 화면에만 적용.
- 환불 문구: 상수 문자열 그대로. 작은 글씨(`0.8125rem` 전후), 흐린 색(`--plans-muted`), 연한 배경·테두리의 작은 상자. 카드 안 맨 아래 또는 카드 바로 아래.
- 버튼: 주소·`data-nav` / `data-plans-nav` / 표시 조건은 727-730줄 그대로.
  - 「구매이력 보기」만 `btn btn--primary`
  - 나머지(`운영 화면으로`, `상품센터`, `다시 결제`)는 `btn btn--secondary`
  - 같은 높이(최소 40px 또는 `2.5rem`). 넓은 화면은 한 줄, 세로 가운데.
  - **480px 이하**에서는 세로로 쌓고, 너비는 꽉 채우되 높이는 같게.

### 3-5. 시안 (HTML 골격)

아래는 시안이다. 클래스 이름은 같은 뜻이라면 조금 달라도 된다. 값 조립 방식은 2장의 기존 줄을 따른다.

```html
<section class="mypage-panel plans-result">
  <header class="plans-result__hero">
    <!-- 성공일 때만 체크 SVG -->
    <p class="plans-result__status">결제 완료</p>
    <p class="plans-result__amount">97,377원</p>
    <p class="plans-result__order">주문번호 dev-6cd2b43848addcd1</p>
  </header>

  <div class="plans-result__card">
    <dl class="plans-result__rows">
      <div class="plans-result__row"><dt>상품</dt><dd>Prime 노출 · 2개월</dd></div>
      <div class="plans-result__row"><dt>이용 기간</dt><dd>2026-11-14 ~ 2027-01-13</dd></div>
    </dl>
    <dl class="plans-result__rows">
      <div class="plans-result__row"><dt>적용 프로필</dt><dd>…</dd></div>
      <div class="plans-result__row"><dt>적용 지역</dt><dd>…</dd></div>
      <div class="plans-result__row"><dt>홍보 배지</dt><dd>Hot</dd></div>
    </dl>
    <dl class="plans-result__rows plans-result__rows--amount">
      <div class="plans-result__row"><dt>상품 금액</dt><dd>…원</dd></div>
      <div class="plans-result__row"><dt>배지 소계</dt><dd>…원</dd></div>
      <div class="plans-result__row plans-result__row--total"><dt>결제금액</dt><dd>97,377원</dd></div>
    </dl>
  </div>

  <p class="plans-result__refund">노출상품 환불은 시작 전이면 전액, 시작 후면 남은 기간을 실결제액 기준으로 일할 계산해 드려요. 배지는 함께 회수됩니다.</p>
  <!-- 무료 쪽지 안내, result.message 는 있을 때만 -->

  <div class="plans-result__actions mypage-actions-row">
    <a href="#/mypage/plans" class="btn btn--primary" data-nav="/mypage/plans">구매이력 보기</a>
    <a class="btn btn--secondary" data-nav="…">운영 화면으로</a>
    <a href="#/plans" class="btn btn--secondary" data-plans-nav="/plans">상품센터</a>
  </div>
</section>
```

넓은 화면 시안(텍스트):

```
┌─────────────────────────────────────────────┐
│  ✓  결제 완료                               │
│     97,377원                                │
│     주문번호  dev-6cd2b43848addcd1          │
├─────────────────────────────────────────────┤
│  상품              Prime 노출 · 2개월        │
│  이용 기간         2026-11-14 ~ 2027-01-13   │
│  ─────────────────────────────────────────  │
│  적용 프로필       (프로필 이름)             │
│  적용 지역         (지역)                    │
│  홍보 배지         Hot                       │
│  ─────────────────────────────────────────  │
│  상품 금액         00,000원                  │
│  배지 소계         00,000원                  │
│  결제금액          97,377원     ← 굵게       │
├─────────────────────────────────────────────┤
│  환불 안내 (작은 흐린 상자)                   │
├─────────────────────────────────────────────┤
│ [구매이력 보기]  [운영 화면으로]  [상품센터]  │
└─────────────────────────────────────────────┘
```

480px 이하에서는 카드 행은 그대로 라벨 왼쪽·값 오른쪽을 유지하고, 버튼만 세로로 쌓는다.

CSS는 `preview/home-ui/src/styles/plans-store.css` 맨 아래에 `.plans-result …` 블록으로만 추가한다. 색은 `plans-theme` 토큰을 쓴다. 전역 `.mypage-info-box`, `.mypage-actions-row`, `.btn` 정의는 바꾸지 말 것.

## 4. 바꾸지 말 것

- 결제 생성·완료·웹훅·환불 API, `ProviderCheckoutService`, `PortOneCheckout`, 주문번호 생성, paymentId 규칙
- `setCheckoutResult` / `getCheckoutResult` 필드, sessionStorage 키, `orderRef` 문자열
- `formatKrw` 출력 형식, `orderStatusLabel` 사전, `badgeDisplayName`
- `POSITION_REFUND_SHORT` · `MEMO_TICKET_REFUND_SHORT` 문구 (한 글자도)
- 환불 안내를 고르는 조건(718-722줄의 기간·배지 유무)
- 버튼의 주소, `data-nav` / `data-plans-nav`, 성공 때 「운영 화면으로」·실패 때 「다시 결제」를 나누는 조건, `backOp` 계산
- 결과 없음(671-678)·`unavailable`(681-691) 분기 문구와 동작
- 구매이력(`renderPlansHistory`), 영수증(`receipt.js`), 체크아웃 화면, 결제 창(포트원) 디자인
- 전역 마이페이지·버튼 CSS, 데스크톱 다른 화면 레이아웃

## 5. 수락 기준

1. 노출권(배지 있는 성공 건) 결과 화면이 3-1~3-4 뼈대와 같다. 머리(체크+상태+큰 금액), 흐린 주문번호(앞에 `dev-`가 **남아 있음**), 카드 3그룹, 환불 상자, 버튼 세 개가 보인다.
2. 쪽지권 성공 건도 같은 컴포넌트로 보인다. 이용 기간·배지·배지 소계·상품 금액 줄은 없고, 환불 상자는 쪽지권 짧은 안내가 나온다. 「구매이력 보기」는 primary.
3. 실패·취소 화면은 체크 아이콘이 없고 경고 톤이며, 「다시 결제」가 있고 「운영 화면으로」는 없다. 기존 `result.message`가 그대로 보인다.
4. 화면에 보이는 숫자·날짜·상품명·프로필·지역·배지 이름·환불 문장이 바꾸기 전과 같다(배치만 다름). 주문번호는 저장값 전체.
5. 버튼 높이가 서로 같다. 480px 이하에서는 버튼이 세로로 쌓인다. 카드 행은 좁은 화면에서도 라벨 왼쪽·값 오른쪽.
6. 결제 생성·완료 API 호출, 구매이력 목록, 환불 신청 동작이 이 PR에서 바뀌지 않는다(결과 화면 HTML/CSS와 작업 기록만 diff에 있는 것이 이상적).
7. 스크린샷(PR 또는 보고에 첨부):
   - 바꾸기 전: 지금 `<p>` 나열 화면(넓은 폭). 이미 종현님 캡처가 있으면 그걸 써도 된다.
   - 바꾼 뒤: 노출권 성공 넓은 폭(1280 전후), 노출권 성공 480px, 쪽지권 성공 넓은 폭. 가능하면 실패 화면 1장.
8. 보고에 바꾼 파일, 주문번호에서 `dev-`를 떼지 않았다는 확인, 스크린샷 목록, 로컬 확인 방법을 적는다.

로컬에서 실제 결제를 다시 할 필요는 없다. 개발자 도구로 `sessionStorage.setItem('study114-plans-result', JSON.stringify({...}))` 한 뒤 `#/plans/result`를 열어도 된다. 보고에 쓴 예시 JSON(금액은 가상, 키·비밀번호 없음)을 적는다.

## 6. 열린 질문

- 없음. 주문번호의 `dev-`는 표시에서도 유지한다(3-2).

## 공통 금지

- 새 브랜치에서 PR만 열고 보고. **머지·force push·운영 SQL 금지.** `reset --hard`, `stash drop` 금지.
- 키·비밀번호·세션값·포트원 비밀키를 문서·커밋·보고에 쓰지 않음.
- 범위 밖 버그는 고치지 말고 「발견 목록」에만.
- 데스크톱에서 이 화면이 아닌 레이아웃을 1px도 변경하지 말 것.
