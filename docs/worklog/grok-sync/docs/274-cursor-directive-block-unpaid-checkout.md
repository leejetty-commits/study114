# 274 결제 확인 없는 「구매 완료」 막기 — 실결제 연동 전까지 (긴급)

> **상태: 확정 (2026-10-20 종현 승인).** 이 문서에 적힌 것만 한다. 아래 「허용 파일」 밖은 손대지 않는다.
> **긴급.** 272-1·273과 따로 진행한다. 273과 겹치는 파일이 있으므로 **274를 먼저 병합**한다(1장).

- 작업 번호: 274
- 날짜: 2026-10-20
- 브랜치 이름: `cursor/274-block-unpaid-checkout`
- 박스 사본: `/workspace/study114/handoffs/274-cursor-directive-block-unpaid-checkout.md`
- 저장소 경로: `docs/worklog/grok-sync/docs/274-cursor-directive-block-unpaid-checkout.md`
- 기준 코드: `origin/main` `ade824be`
- 모델: **grok-4.7 high만** 쓴다. fast 모델 금지.
- 요약: 지금은 결제대행(PG) 연동이 없다. 그런데 `/api/paid/checkout.php`의 `action:'complete'`(`ProviderCheckoutService::completeOrder`)가 주문을 「결제 완료」로 바꾸고 픽·프라임·HOT·쪽지권을 그대로 지급한다. 공급자 계정이면 누구나 돈을 내지 않고 받을 수 있다. 실결제 확인이 생길 때까지 **운영에서는 완료·지급을 거절**하고, 로컬·테스트 서버에서만 명시적으로 켠다.

> 쉬운 말 안내: 지금은 계산대에 돈통이 없는데 「계산 끝」 버튼만 누르면 물건을 가져갈 수 있습니다. 진짜 계산기(결제)를 달 때까지 「계산 끝」 버튼을 잠그고, 손님에게는 「결제 기능을 준비하고 있어요」라고 안내합니다. 연습용 가게(테스트 서버)에서만 버튼을 켭니다.

---

## 0. 결정 (종현 확정)

| # | 항목 | 확정값 |
|---|---|---|
| 1 | 운영 동작 | `action:'complete'`는 **주문을 결제 완료로 바꾸지 않고, 지급도 하지 않는다.** 거절 응답만 준다. |
| 2 | 켜는 방법 | **환경변수 하나**로만 켠다: `STUDY114_PAID_MOCK_COMPLETE=1`. 값이 없거나 `1`이 아니면 **거절**(fail closed). |
| 3 | 설정 파일에 기대지 않기 | 배포는 `public/`·`src/`만 올리고 `config/`는 올리지 않는다. 그래서 **서버 설정을 바꾸지 않아도 안전해야 한다.** `config/app.php`의 `env`는 값이 없으면 `'local'`이 되므로(`config/app.php:7`) **이 판단에 쓰지 않는다.** `src/` 안에서 `getenv('STUDY114_PAID_MOCK_COMPLETE')`를 직접 읽는다. |
| 4 | 관리자 예외 | 만들지 않는다. 플래그 하나만 쓴다(경로를 단순하게). 관리자 지급이 필요하면 별도 지시. |
| 5 | 화면 | `/plans` 결제 단계에서 완료를 부르지 않고 안내를 보인다: 「결제 기능을 준비하고 있어요. 곧 열릴 예정이에요」. 개발 용어 없이. |
| 6 | 주문 만들기(create) | 지금처럼 둔다. 결제 대기(`pending`) 주문만 남고 지급은 없다. 대기 주문 정리는 이번 범위 아님(보고만). |

### 0-1. 조사 결과 (`ade824be`)

| 구분 | 파일:줄 | 내용 |
|---|---|---|
| 완료 API | `public/api/paid/checkout.php:25-31` | `action === 'complete'`면 `completeOrder($userId, $orderRef)` 호출. 공급자 로그인만 확인(`PaidApi::requireProvider`) |
| 결제 완료 처리 | `src/Paid/ProviderCheckoutService.php:347` `completeOrder` → `:408` `markPaid($orderRef)` | 결제대행 확인 없이 `pending` → `paid` |
| 지급 | 같은 파일 `:414`, `:488` `fulfill()`(`:712`) → `:743`·`:829` `addTicketPack`, `:805` `extendPositionSubscription`, `:807` `addPositionSubscription`, `:852` `grantFromOrder` | 쪽지권·픽/프라임·연장·HOT 배지 지급 |
| 저장소 | `src/Paid/ProviderCheckoutRepository.php:179` `markPaid` | `paid`로 바꾸는 유일한 함수 |
| 다른 경로 | `rg "markPaid\(\|->fulfill\(\|addPositionSubscription\(\|extendPositionSubscription\(\|addTicketPack\(\|grantFromOrder\("` | **위 `completeOrder` 한 곳뿐.** 예외: `scripts/smoke-paid-badges-live.php:43,47`(직접 `grantFromOrder`, CLI 스크립트, 웹에서 못 부름) |
| 결제대행 | `rg -i "toss\|portone\|iamport\|kcp\|inicis\|nicepay" src public` | 없음 |
| 화면 | `preview/home-ui/src/paid-api.js:133-138` `completePaidCheckout` → `preview/home-ui/src/plans/screens.js:2056` | 주문 만든 뒤 바로 완료 호출, 성공 화면·구매이력 행 추가 |
| 운영 확인 | `curl https://study114.net/api/paid/checkout.php` (손님 GET) | 401 (서버 기본 HTML). 로그인 공급자 POST 동작은 확인 못 함 |
| CI | `.github/workflows/paid-catalog-pr-a.yml`, `paid-ticket-pr-b.yml` → `scripts/verify-paid-pr-b-integration.php`, `verify-pick-region-ownership.php` 등이 완료·지급을 쓴다 | 플래그를 켜야 계속 통과한다 |

---

## 1. 시작 조건

1. `git fetch` 후 `ade824be`가 최신 `origin/main`의 조상인지 확인한다. 아니면 보고한다.
2. 최신 `origin/main`에서 `cursor/274-block-unpaid-checkout`을 만든다. 같은 이름이 있으면 멈추고 보고한다.
3. `git status` 깨끗. **push까지만. `main` 병합·배포·force-push 금지.**
4. 병합 순서: **274 → 273.** 273 작업자는 274 병합 뒤 `main`에서 시작한다. 겹치는 파일: `ProviderCheckoutService.php`, `PaidApi.php`, `plans/screens.js`, `paid-api.js`.

---

## 2. 작업 환경

- Cursor PC에는 PHP·로컬 API가 없다. Cursor는 **코드 + `npm run build` + vite-node 검증 + PHP 검증 스크립트 작성**까지 하고 push한다. PHP는 고친 함수 원문을 보고서에 붙인다.
- 실제 동작 확인(5-2)은 **우동공과2가 테스트 서버에서** 플래그 끔·켬 둘 다 한다.

---

## 3. 수정

### 3-1. 서버: 완료·지급 잠금

- 새 함수 하나: `src/Paid/PaidCheckoutGate.php` (새 파일, 이름은 바꿔도 됨)
  - `public static function mockCompleteAllowed(): bool { return getenv('STUDY114_PAID_MOCK_COMPLETE') === '1'; }`
  - `$_ENV`·`$_SERVER`·`study114_env` 등 다른 출처를 같이 볼 필요가 있으면 **모두 정확히 `'1'`일 때만** 허용하고, 그 판단을 보고한다. 값 없음·`'0'`·`'true'`·빈 문자열은 모두 거절.
- `ProviderCheckoutService::completeOrder` **맨 앞**(트랜잭션 시작 전)에서 검사한다. 허용이 아니면 아무것도 바꾸지 않고 예외를 던진다.
  - 이미 `paid`이고 지급 성공한 주문을 다시 조회하는 경우도 같이 거절한다(운영엔 그런 주문이 없어야 정상, 있으면 보고).
- `checkout.php`의 `action === 'complete'` 분기에서도 `completeOrder` 부르기 **전에** 같은 검사를 한 번 더 한다(이중 잠금). 거절 응답:
  - 상태 코드 **403**, `ok:false`, `error:'payment_not_available'`, `message:'결제 기능을 준비하고 있어요. 곧 열릴 예정이에요'`
  - 형식은 기존 `PaidApi::fail`을 그대로 쓴다.
- `fulfill()`·`markPaid()`는 `completeOrder` 안에서만 불리므로 따로 잠그지 않는다. 다만 **새로 다른 곳에서 부르게 되면 같은 검사를 거쳐야 한다**는 주석을 `fulfill` 위에 한 줄 남긴다.
- `create`(주문 만들기)는 바꾸지 않는다.

### 3-2. 화면: 안내

- `preview/home-ui/src/paid-api.js` `completePaidCheckout`: 서버가 `payment_not_available`을 주면 그 사실을 알 수 있는 오류(예: `err.code = 'payment_not_available'`)로 돌려준다.
- `preview/home-ui/src/plans/screens.js` 결제 단계(2030-2110행 부근):
  - 완료가 `payment_not_available`로 거절되면 **실패 화면이 아니라 안내 화면**을 보인다: 「결제 기능을 준비하고 있어요. 곧 열릴 예정이에요」.
  - **구매이력 행을 추가하지 않는다**(`appendHistoryRow` 안 부름). 「결제 완료」·성공 표시를 하지 않는다.
  - 안내 아래 버튼은 「유료상품으로 돌아가기」 등 기존 문구 재사용(톤다운 버튼, 디자인통일매뉴얼 003 §2·§2-1).
  - 화면에 `order_ref`·`pending`·`mock`·영어 오류 코드 노출 금지.
- 화면에서 미리 막을지(완료 버튼 자체를 숨김)는 선택. 하려면 서버 응답(예: `status.php` 등)에 기대지 말고 **완료 거절을 받은 뒤 안내**로 충분하다. 새 API를 만들지 않는다.

### 3-3. 로컬·CI·테스트 서버

- `.github/workflows/paid-catalog-pr-a.yml`, `.github/workflows/paid-ticket-pr-b.yml`의 `env:`에 `STUDY114_PAID_MOCK_COMPLETE: "1"`을 추가한다. 완료·지급을 쓰는 다른 워크플로가 있으면 같은 방법으로 추가하고 보고한다.
- `docker/docker-compose.dev.yml` `api` 서비스 `environment`에 `STUDY114_PAID_MOCK_COMPLETE: "1"` 추가(로컬 개발용).
- **`public/.htaccess`에는 절대 넣지 않는다**(배포되는 파일).
- 새 PHP 검사 `scripts/verify-paid-complete-gate.php`:
  - 플래그 없음 / `'0'` / `'true'` / `''`일 때 `completeOrder` 거절, 주문 상태 `pending` 유지, `provider_position_subscriptions`·`provider_ticket_packs`·`provider_paid_badges` 행 수 변화 0.
  - `'1'`일 때 지금처럼 완료·지급.
  - `putenv`로 바꿔 가며 확인.
- 새 vite-node 검사 `scripts/verify-paid-complete-gate.mjs`:
  - `checkout.php`·`completeOrder`에 검사 호출이 있음
  - 화면에 안내 문구 있음
  - 거절 때 `appendHistoryRow` 안 부름
  - `.htaccess`에 플래그 없음

### 3-4. 하지 않는 것

- 결제대행 연동, 가격·재고·노출·카드 로직 변경 금지.
- 이미 있는 `paid`·`pending` 주문 데이터 수정·삭제 금지(필요하면 보고).
- 관리자 지급 기능 새로 만들기 금지.
- `config/*.php` 변경 금지(배포 안 됨, 기대지 않음).

---

## 4. 기대 결과

- 운영(플래그 없음): 로그인한 공급자가 `create` → `complete`를 바로 호출해도 **403 `payment_not_available`**, 주문은 `pending`, 지급 행 0.
- 화면: 결제 단계에서 「결제 기능을 준비하고 있어요. 곧 열릴 예정이에요」 안내, 구매이력·성공 표시 없음.
- 로컬·테스트 서버(플래그 `1`): 지금과 똑같이 완료·지급.
- CI 통과 유지.

---

## 5. 검수 (하나라도 실패면 멈추고 보고)

### 5-1. Cursor (필수)

- `home-ui` `npm run build` 통과.
- `node scripts/verify-paid-complete-gate.mjs`(또는 `npx vite-node`) 통과.
- 기존 통과 유지: `verify:paid-pr-a`, `verify:paid-renewal`, `verify:paid-catalog`, `verify:paid-pricing`(JS 부분), `verify:cur-006-*` 중 유료 관련. 원래 실패는 main 비교 목록으로.
- push 후 GitHub Actions `paid-catalog-pr-a`, `paid-ticket-pr-b` 결과 링크(플래그 켠 상태로 통과해야 함).
- 아래 명령 출력을 붙인다.

```bash
git diff --stat origin/main...HEAD
rg -n "STUDY114_PAID_MOCK_COMPLETE" -g '!node_modules'
rg -n "markPaid\(|->fulfill\(" src public
rg -n "STUDY114_PAID_MOCK_COMPLETE" public/.htaccess   # 0건
```

### 5-2. 우동공과2 테스트 서버 (병합 전 필수, 실결제 없음)

| # | 조건 | 확인 | 기대 |
|---|---|---|---|
| 1 | 플래그 **없음** | 공급자 로그인 → API `create`(픽) → `complete` 직접 호출 | 403 `payment_not_available`, 주문 `pending`, `provider_position_subscriptions` 새 행 0 |
| 2 | 플래그 없음 | 같은 방법으로 쪽지권(묶음·즉시)·HOT 배지 | 모두 거절, `provider_ticket_packs`·`provider_paid_badges` 새 행 0 |
| 3 | 플래그 없음 | `/plans` 화면에서 결제 단계 진행 | 안내 문구, 구매이력 행 없음, 개발 용어 없음, 1280·390 넘침 없음 |
| 4 | 플래그 `0`·`true`·빈 값 | 1번 반복 | 모두 거절 |
| 5 | 플래그 `1` | 1·2·3번 반복 | 지금처럼 완료·지급·성공 화면 |
| 6 | 손님(로그아웃) | `POST /api/paid/checkout.php` `action:complete` | 401 또는 403, 변화 없음 |

- 각 행마다 요청·응답(상태 코드·`error`), DB 행 수 전/후를 표로 보고.

### 5-3. 배포 뒤 종현 읽기 전용 확인 (운영, 구매·가입 없이)

1. 손님: 아래 명령의 상태 코드가 **401 또는 403**이고 `ok:true`가 아니면 정상. (서버 기본 401 HTML이어도 정상)

   ```bash
   curl -s -o /dev/null -w "%{http_code}\n" -X POST https://study114.net/api/paid/checkout.php -H 'Content-Type: application/json' -d '{"action":"complete","order_ref":"x"}'
   ```

2. 공급자(기존 시험 계정이 있을 때만, 브라우저 개발자 도구 콘솔에서 로그인 상태로):

   ```js
   fetch('/api/paid/checkout.php',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'complete',order_ref:'x'})}).then(r=>r.status+' '+r.statusText).then(console.log)
   ```

   - **403**(`payment_not_available`)이면 정상.
   - 「주문을 찾을 수 없습니다」(400대)가 나오면 잠금이 배포되지 않은 것이므로 바로 알린다.
   - 잠금이 주문 조회보다 먼저 돌아야 하므로, 없는 주문번호로도 403이 나와야 한다(3-1).

---

## 6. 금지 범위

1. 허용 파일(7장) 밖 수정 금지.
2. 결제대행·가격·재고·노출·카드 로직 변경 금지.
3. 플래그를 `public/`(특히 `.htaccess`)·`config/`에 넣기 금지.
4. 운영 DB 주문·구독 데이터 수정 금지.
5. `git add -A` 금지, force-push 금지, `main` 병합·배포 금지.

---

## 7. 허용 파일

| # | 파일 | 바뀔 것 |
|---|---|---|
| 1 | `src/Paid/PaidCheckoutGate.php` (새 파일) | 플래그 판단 함수 |
| 2 | `src/Paid/ProviderCheckoutService.php` | `completeOrder` 맨 앞 검사, `fulfill` 위 주석 1줄 |
| 3 | `public/api/paid/checkout.php` | `complete` 분기 앞 검사·403 응답 |
| 4 | `src/Paid/PaidApi.php` | 오류 형식 연결이 필요할 때만 |
| 5 | `preview/home-ui/src/paid-api.js` | `payment_not_available` 구분 |
| 6 | `preview/home-ui/src/plans/screens.js` | 결제 단계 안내 화면, 구매이력 미추가 |
| 7 | `.github/workflows/paid-catalog-pr-a.yml`, `.github/workflows/paid-ticket-pr-b.yml` | `env`에 플래그 `"1"` |
| 8 | `docker/docker-compose.dev.yml` | `api` 환경변수에 플래그 `"1"` |
| 9 | `scripts/verify-paid-complete-gate.php`, `scripts/verify-paid-complete-gate.mjs` (새 파일) | 5-1 검사 |
| 10 | `package.json` | `verify:paid-complete-gate` 스크립트 1줄 |
| 11 | 완료·지급을 쓰는 기존 검증 스크립트·e2e (`scripts/verify-paid-pr-b-integration.php`, `verify-pick-region-ownership.php`, `e2e/p18-d-checkout.spec.js`, `e2e/p18-pr-b-browser.spec.js`, `scripts/smoke-paid-badges-proof.mjs`, `scripts/verify-signup-home-fix-20261009.mjs`) | 플래그 켜기(`putenv`) 또는 실행 안내 주석만. 검사 내용을 약하게 하지 않는다 |

- 그 밖의 파일이 필요하면 멈추고 보고한다(8장).

---

## 8. 멈추고 보고할 때

1. 허용 파일 밖을 고쳐야 할 때.
2. `completeOrder` 말고 결제 완료·지급을 하는 경로를 새로 찾았을 때(경로와 파일:줄 보고, 같은 잠금 제안).
3. 플래그를 `getenv`로 읽을 수 없는 서버 구조가 의심될 때(예: 운영에서 환경변수가 이미 `1`로 잡혀 있을 가능성).
4. 운영 DB에 이미 `paid` 주문이나 결제 없이 생긴 구독 행이 있을 것 같을 때(조회 SQL만 제안, 수정 금지).
5. CI가 플래그를 켜도 실패할 때.
6. 화면 안내 때문에 다른 유료 화면(내 상품·구매이력)이 깨질 때.

---

## 9. 작업 순서와 커밋 나누기

1. 시작 조건(1장) → 브랜치.
2. 커밋 (예시):
   - `274-1 fix(paid): 실결제 확인 전에는 구매 완료·지급을 거절한다` (1·2·3·4번)
   - `274-2 fix(plans): 결제 단계에 결제 준비 중 안내를 보인다` (5·6번)
   - `274-3 test(paid): 완료 잠금 검증과 CI·로컬 플래그` (7·8·9·10·11번)
3. 빌드·검증(5-1) → 파일 이름으로 add → `git push origin cursor/274-block-unpaid-checkout` → **멈춤.**
4. 우동공과2 테스트 서버 확인(5-2) → 종현 병합·배포 → 종현 읽기 전용 확인(5-3).

---

## 10. 완료 보고 형식

1. 커밋: 브랜치, 해시 전부(순서대로), 시작 기준 `origin/main` 해시.
2. 바뀐 파일:줄. PHP는 고친 함수 원문.
3. 다른 결제·지급 경로 검색 결과(`rg` 출력).
4. 검증·CI 결과 요약과 Actions 링크.
5. 범위 확인 문장: 「7장 밖 파일, 결제대행·가격·재고·노출·카드 로직, `config/`, `public/.htaccess`, 운영 데이터는 건드리지 않았습니다.」
6. 상태: push까지 했고 병합·배포는 하지 않았다. 5-2는 우동공과2 테스트 서버 확인 대기.
