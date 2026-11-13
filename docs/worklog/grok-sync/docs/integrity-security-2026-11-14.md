# study114(우동공과) 출시 전 무결성·보안 점검 보고서

- 작성: 2026-11-14 05:00 KST (Asia/Seoul)
- 기준 코드: origin/main `efc881f7` (PR #215 병합. 점검 중 04:39 KST에 배포 43494244597 성공. #215는 구매이력 화면 JS·CSS만 바꿈)
- 대상 운영: https://study114.net
- 방식: 읽기 전용. 코드 정적 점검 + 운영 비로그인 GET. 코드 수정·푸시·PR·SQL 없음. 주문·결제·쪽지·환불을 만드는 요청 없음.
- 비밀값은 이 문서에 적지 않았다.

## 한 줄 결론

**블로커는 없다. 다만 실결제로 바꾸기 전에 높음 3건은 꼭 고쳐야 한다.** (결제 후 지급 실패 시 돈만 빠지는 경로, 옛 로그인 주소의 횟수 제한 우회, 운영 서버가 API 오류 내용을 지우는 문제)

| 블로커 | 높음 | 중간 | 낮음 |
|---|---|---|---|
| 0 | 3 | 6 | 9 |

추정(확인 필요) 3건은 따로 적었다(개수에 넣지 않음).

---

## 높음

### H1 · 결제는 됐는데 지급이 막히면, 돈만 빠지고 구매이력에도 안 보인다 (확인됨: 코드)
- **무엇:** 포트원 결제가 PAID인데 완료 처리 중 충돌이 나면 주문이 `pending`으로 남는다. 자동 취소(환불)가 없다.
  - 쪽지 묶음권: 주문 만들 때는 "사용 중인 묶음권"만 본다. 결제 전 주문 두 개를 만들 수 있다. 둘 다 결제하면 두 번째는 완료 때 막힌다.
  - Prime: 주문 만들 때 자리를 잡아 두지 않는다. 마지막 자리를 두 곳이 동시에 결제하면 늦은 쪽이 완료 때 막힌다.
  - 이미 `paid`인데 다른 묶음권이 먼저 켜진 경우 `fulfillment=failed`가 된다. 이때 환불 신청은 `pack_not_found`로 거절된다.
- **증거:**
  - `src/Paid/ProviderCheckoutService.php:509-511`: pending이면서 활성 묶음권이 있으면 PaidConflictException을 던진다.
  - 같은 파일 `:910-911`: Prime 자리가 다 차면 예외를 던진다. `:538-545`에서 롤백되어 pending으로 남는다.
  - 같은 파일 `:1158-1166`: 주문 만들 때는 활성 묶음권만 본다. pending 주문은 보지 않는다.
  - `src/Paid/ProviderCheckoutRepository.php:334`: 구매이력은 `paid/refund_requested/refunded`만 보여 준다(PR #212). 그래서 pending은 안 보인다.
  - `public/api/paid/portone-webhook.php:110-115`: 실패하면 500을 돌려준다. 포트원은 다시 보내지만 다시 실패한다.
  - `src/Paid/RefundService.php:121-131`: 묶음권이 없으면 `pack_not_found`로 거절한다.
  - 결제 완료 경로에는 포트원 취소 호출이 없다. 취소는 환불 신청과 CLI에서만 한다.
- **왜 중요:** 손님은 돈을 냈는데 받은 것이 없고, 화면에도 기록이 없다. 운영자는 포트원 콘솔에서 손으로 찾아 취소해야 한다. 실결제에서는 민원과 분쟁이 된다.
- **손질:** 완료 단계 충돌이 PAID 뒤에 나면 그 자리에서 전액을 자동 취소하고 주문을 `cancelled`로 둔다. 또는 같은 프로필의 pending 묶음권 주문은 하나만 만들게 한다. 구매이력에 "결제 취소됨" 줄을 보여 준다.

### H2 · 옛 PHP 로그인 주소(`POST /auth/login`)는 로그인 횟수 제한을 거치지 않는다 (확인됨: 코드 + 운영)
- **무엇:** SPA용 `/api/auth/login.php`에는 이메일 5회·IP 15회 제한이 있다. 옛 MVC 경로 `AuthController::loginSubmit`에는 이 제한도 CSRF 토큰도 없다. 이 경로는 운영에 그대로 살아 있다.
- **증거:**
  - `src/Controllers/AuthController.php:33-50`: 제한기 호출이 없다.
  - `src/routes/web.php:15`: `->post('/auth/login', ...)`
  - `public/.htaccess:16`: `/auth/login`을 index.php로 보낸다.
  - 운영: `GET https://study114.net/auth/login` → 200, `<form method="post" action="/auth/login">`이 나온다.
  - 운영: 없는 이메일로 `POST /auth/login` 1회 → 302 `/auth/login`. PHP가 직접 처리한다.
  - 비교: `public/api/auth/login.php:42`에는 `LoginRateLimiter`가 있다.
- **왜 중요:** 관리자를 포함한 모든 계정의 비밀번호를 횟수 제한 없이 계속 대입해 볼 수 있다. 관리자 2단계 인증도 아직 없다(M5).
- **손질:** SPA가 쓰지 않는 옛 `/auth/login`·`/auth/signup/*` POST 경로를 지운다. 남겨야 하면 loginSubmit에도 `LoginRateLimiter`를 붙인다.

### H3 · 운영 서버(닷홈)가 API 오류 응답의 JSON을 HTML로 바꿔서, 결제·쪽지·인증 안내가 화면에 안 뜬다 (확인됨: 운영 + 코드)
- **무엇:** 4xx 응답이 오면 닷홈 ErrorDocument가 본문을 Apache 기본 HTML로 덮어쓴다. 화면 코드는 `err.code`(paid_gate, email_verify_required, tier_fields_missing 등)를 보고 안내창을 띄우는데, 그 코드가 사라진다. 사용자는 "HTTP 422" 같은 글만 본다.
- **증거 (운영 응답 코드 · Content-Type):**
  - `/api/messages/threads.php` → 401 text/html "401 Unauthorized"
  - `/api/board/posts.php?board=nonexistent` → 422 text/html "Unknown Reason"
  - `/api/auth/logout.php` GET → 405 text/html
  - 서명 없는 웹훅 POST → 400 text/html
  - JSON을 기대하는 화면 코드:
    - `preview/home-ui/src/paid-api.js:20-31`: `res.json()`이 실패하면 빈 객체가 된다.
    - `messages/screens.js:426-427`, `messages/overlays.js:311-317`
    - `plans/screens.js:1508`, `plans/screens-orders.js:131`, `email-verify-overlay.js:76`
  - 이미 이 문제를 피해 간 곳(200 + ok:false): `public/api/tutor/profile-image.php:16-29`, `public/api/auth/withdraw-reason.php`. paid/*·messages/*·board/*는 아직 4xx를 그대로 쓴다.
- **왜 중요:** 쪽지권이 없을 때 구매 안내창이 안 뜨고, 이메일 미인증 안내도 안 뜬다. 결제 직전 필수항목 누락 안내도 안 나온다. 결제 확인이 실패해도(422·502) 이유가 안 보인다.
- **손질:** 공통 `fail()`(PaidApi·MessagesApi·Board Api·AdminApi)을 profile-image처럼 "HTTP 200 + ok:false + error 코드"로 바꾼다. 또는 `/api/`에서 ErrorDocument를 끌 수 있는지 닷홈에 묻는다.

---

## 중간

### M1 · 로그인할 때 세션 번호를 새로 만들지 않는다 (세션 고정) (확인됨: 코드 + 운영)
- **증거:**
  - 저장소 전체에 `session_regenerate_id`가 0건이다.
  - `src/Auth/AuthSession.php:59-89`: login은 기존 세션에 auth만 넣는다.
  - `:91-95`: logout은 auth만 지우고 세션은 그대로 둔다.
  - 운영: 임의로 만든 `PHPSESSID`를 보내면 새 쿠키를 주지 않고 그대로 받는다(strict mode 꺼짐).
- **왜 중요:** 누가 피해자 브라우저에 세션 번호를 심을 수 있으면, 피해자가 로그인한 뒤 그 세션을 같이 쓸 수 있다.
- **손질:** login()에서 `session_regenerate_id(true)`를 부르고, `session.use_strict_mode=1`을 켠다. logout에서는 세션을 없애고 새로 만든다.

### M2 · 배포가 암호화 안 된 FTP로 비밀값을 보낸다 (확인됨: 코드)
- **증거:** `.github/workflows/deploy.yml`의 FTP 두 단계가 모두 `protocol: ftp`다. 배포 때 `.htaccess`에 OAuth·Resend·PortOne API·웹훅 시크릿을 넣은 뒤 FTP로 올린다. FTP 비밀번호도 평문으로 간다.
- **왜 중요:** 네트워크 중간에서 엿들으면 모든 키를 얻을 수 있다. 실결제로 바꾼 뒤에는 PortOne API 시크릿으로 결제 취소까지 할 수 있다.
- **손질:** 닷홈이 FTPS를 지원하면 `protocol: ftps`로 바꾼다(지원 여부는 추정 상태). 지원하지 않으면, 실결제 키를 넣기 전에 배포 방식을 바꾸거나 키를 자주 바꾼다.

### M3 · phpMyAdmin이 우리 도메인으로 공개되어 있다 (확인됨: 운영)
- **증거:** `https://study114.net/myadmin/` → 200 phpMyAdmin 로그인 화면. `https://study114.dothome.co.kr/myadmin/`도 200.
- **왜 중요:** DB 계정 비밀번호를 누구나 대입해 볼 수 있는 창구다.
- **손질:** Cloudflare WAF 규칙으로 `study114.net/myadmin*`을 막는다(종현 IP만 허용). 평소에는 닷홈 주소로만 쓴다. DB 비밀번호는 길게 유지한다.

### M4 · 가입·아이디 찾기에 횟수 제한이 없다 (확인됨: 코드)
- **증거:**
  - `public/api/auth/signup.php`: 제한기가 없다.
  - `src/Auth/SignupService.php:38-42`: 휴대폰은 번호 모양만 검사하고, 실제 인증은 하지 않는다.
  - 가입할 때마다 인증 메일이 나간다.
  - `src/Auth/FindIdService.php:12-34`: 이름과 휴대폰을 넣으면 가린 이메일 목록을 돌려준다. 제한이 없다.
- **왜 중요:**
  - 가짜 계정을 대량으로 만들 수 있다.
  - 남의 이메일 주소로 우리 메일이 나가게 할 수 있다(Resend 평판 문제).
  - "이 사람이 이 번호로 가입했는지"를 계속 조회할 수 있다.
- **손질:** `LoginRateLimiter` 방식의 IP 제한을 signup·find-id·password/forgot에 붙인다. 필요하면 Turnstile을 단다.

### M5 · 관리자 2단계 인증이 없다 (확인됨: 코드 · 기존 과제)
- **증거:** `src/Admin/AdminApi.php:89-100`: 세션과 DB 등급만 본다. "콘솔 2차 비번" 체크리스트(노션)는 아직 손대지 않았다.
- **왜 중요:** H2와 겹치면 관리자 비밀번호 하나가 사이트 전체 권한이 된다.
- **손질:** 기존 체크리스트 순서대로 2차 비번 → 우회 차단을 진행한다. 그 전에 H2부터 막는다.

### M6 · 서버의 `config/` 폴더는 자동 배포가 아니라서 저장소와 달라질 수 있다 (확인됨: 코드 · 서버 내용은 미확인)
- **증거:**
  - `deploy.yml`은 `public/`과 `src/`만 FTP로 올린다.
  - `docs/internal/01-dothome-deploy.md:153,367`에 "config/·storage/는 수동"이라고 적혀 있다.
  - 최근 `config/` 변경: 11-07 #109(cron 키), #110(첨부 서명키), 11-11 #350(메일 보내는 사람 이름), #357(config/auth.php).
- **왜 중요:** cron·첨부 서명키는 코드에서도 약한 값을 거절하므로 보안 구멍은 아니다. 다만 메일 표시 이름 같은 설정은 서버 파일이 옛것이면 반영이 안 된다.
- **손질:** 서버 `config/*.php`(database.php 제외)를 저장소와 한 번 비교한다. 비밀값이 없는 config 파일은 배포 단계에 넣는다.

---

## 낮음

### L1 · 운영 CORS가 localhost·127.0.0.1·http:// 출처에 로그인 정보까지 허용한다 (확인됨: 운영)
- **증거:** `Origin: http://localhost:5173`, `http://127.0.0.1:8080`, `http://study114.net`에 `Access-Control-Allow-Origin`과 `Allow-Credentials: true`가 그대로 돌아온다. 코드는 `src/bootstrap.php:123-145, 225-252`.
- **왜/손질:** SameSite=Lax 쿠키 덕분에 실제 위험은 작다. 운영(APP_ENV=production)에서는 localhost와 http 출처를 빼는 것이 맞다.

### L2 · 500 오류 응답에 서버 예외 문구를 그대로 넣는다 (확인됨: 코드)
- **증거:**
  - `src/Paid/PaidApi.php:620-621`
  - `src/Admin/AdminApi.php:120-122`
  - `public/api/auth/signup.php` 마지막 catch
  - `public/api/messages/attachments.php:48-50`
- **왜/손질:** 지금은 닷홈이 오류 본문을 지워서 가려진다(5xx도 가려지는지는 추정). H3를 고쳐 200 응답으로 바꾸면 SQL 문구나 경로가 밖으로 보일 수 있다. 그때 함께 일반 문구로 바꾼다.

### L3 · 게시판의 관리자 판정이 세션에 저장된 등급을 본다 (확인됨: 코드)
- **증거:**
  - `src/Board/BoardPostService.php:238, 295, 360`
  - `src/Board/ConcernService.php:300, 380`
  - 모두 `!empty($auth['admin_level'])`로 판정한다. 관리자 API는 매번 DB를 다시 본다.
- **왜/손질:** 운영자 권한을 빼도 세션이 남은 최대 7일 동안 글 삭제·숨김을 할 수 있다. `AdminRoleService::hasAdminCapability`로 바꾼다.

### L4 · 보안 헤더 부족 (확인됨: 운영)
- CSP의 `script-src`에 `'unsafe-inline'`이 있다.
- `Referrer-Policy`·`Permissions-Policy`가 없다.
- HSTS에 preload가 없다.
- 있는 것: HSTS(includeSubDomains), X-Frame-Options SAMEORIGIN, nosniff, CSP frame-ancestors.
- 손질: Cloudflare 규칙에 두 헤더를 더한다. inline 스크립트는 나중에 줄인다.

### L5 · `GET /auth/logout`만으로 로그아웃된다 (확인됨: 운영 302)
- 다른 사이트가 링크나 이미지로 로그아웃시킬 수 있다. 피해는 작다. 옛 MVC 경로를 지울 때(H2) 같이 정리한다.

### L6 · 관리자 설정 중 실제로는 동작하지 않는 항목 (확인됨: 코드)
- **증거:**
  - `bannedWords`, `notifyOnReport`, `notifyOnTicket`, `notifyOnNewProvider`, `notifyEmails`, `supportHours`는 저장만 되고, 읽어서 쓰는 코드가 0곳이다(`SiteSettingsService` 밖).
  - `bannedEmails`는 가입에서만 쓴다(`SignupService.php:32`).
  - `config/app.php`의 `debug`(기본값 '1')를 읽는 코드가 없다.
  - 운영 public-settings에서 `terms`·`privacy`는 null이다.
- **왜/손질:** 운영자는 "금칙어를 넣었으니 막힌다"고 믿을 수 있다. 화면에서 빼거나, 기능을 붙인다.

### L7 · 요청 처리 중에 DB 구조를 바꾸는 코드가 있다 (확인됨: 코드)
- **증거:**
  - `src/StudyRoom/StudyRoomRegisterService.php:787`
  - `src/StudyRoom/StudyRoomLessonDetailStore.php:502`
  - `src/Media/PromoImageService.php`(ensureColumns): `ALTER TABLE ... ADD COLUMN`을 실행한다.
  - 기능 대부분이 `information_schema` 조회(50곳)로 "컬럼이 있으면 쓰고, 없으면 조용히 끈다"는 방식이다.
- **왜/손질:** 운영 DB 구조가 sql/ 파일과 달라질 수 있다. 빠진 마이그레이션이 있어도 오류 없이 기능만 꺼진다. 그 ALTER들을 번호 SQL로 옮긴다.

### L8 · 포트원 쪽 취소 웹훅을 무시한다 (확인됨: 코드)
- **증거:** `public/api/paid/portone-webhook.php:91-99`: Paid 계열이 아니면 200으로 무시한다.
- **왜/손질:** 포트원 콘솔에서 직접 취소하면 우리 DB는 계속 `paid`이고, 쪽지권·노출도 그대로 남는다. `Transaction.Cancelled`를 받아 상태를 맞춘다.

### L9 · 결제 안 된 pending 주문을 정리하지 않는다 (확인됨: 코드)
- **증거:** 주문 `status`를 `failed`나 `cancelled`로 바꾸는 코드가 없다(ProviderCheckoutRepository·Service).
- **왜/손질:** 창을 닫은 주문이 계속 쌓인다. 자리·재고를 잡지는 않으므로 피해는 작다. 일정 시간이 지난 pending은 cron으로 정리한다. H1 손질과 같이 한다.

---

## 추정 (확인 필요 · 개수 미포함)

1. **090·091 SQL이 운영 DB에 들어갔는지.** 090이 빠졌으면 포트원 주문에 `pg_payment_id`가 저장되지 않는다(`ProviderCheckoutRepository.php` insertPending의 다른 갈래). 그러면 완료 검증이 "주문에 paymentId가 없습니다"로 항상 실패한다(`PortOneCheckout.php:32-35`). 종현이 phpMyAdmin에서 아래 읽기 전용 쿼리로 확인할 수 있다.
   - `SHOW COLUMNS FROM provider_payment_orders LIKE 'pg_payment_id';`
   - `SHOW COLUMNS FROM provider_refund_requests LIKE 'pg_cancel_id';`
   - `SHOW TABLES LIKE 'provider_pg_cancel_ops_log';`
2. **웹훅 시크릿이 운영에 들어가 있는지.** 서명 없는 POST가 503(시크릿 없음)이 아니라 400이었다. 그래서 들어가 있는 것으로 보인다. 본문이 HTML로 바뀌어 정확한 사유는 못 봤다.
3. **FTPS 지원 여부(M2), 원서버 IP 직접 접속으로 Cloudflare 우회가 되는지.** 박스 네트워크 프록시 때문에 확인하지 못했다. 원서버로 직접 오면 `CF-Connecting-IP`를 위조해 IP 제한을 피할 수 있는 구조다(`bootstrap.php:50-60, 83-97`).

참고(결함 아님):
- 실결제 전환에는 코드 변경이 필요하다. `PgProvider`가 `portone_test`만 알아본다(`src/Paid/Pg/PgProvider.php:17-28`).
- 088(본인확인)은 아직 병합 안 된 브랜치(`work/365-identity-design`)에만 있다. 074·086 번호는 비어 있다.

---

## 통과한 것 (확인됨)

**결제 금액·조작**
- 금액은 서버 카탈로그로만 계산한다. 클라이언트가 보낸 금액·할인은 받지 않는다(`ProviderCheckoutService.php:85-89`).
- 운영 카탈로그 가격은 쪽지권 1회 500, 5회권 2250, 10회권 4000이다. 환불표와 맞는다.

**완료 검증**
- 주문 주인을 확인한다.
- 포트원 단건 조회로 PAID·금액·KRW를 확인한다.
- 보낸 paymentId가 주문과 다르면 거절한다(`Pg/PortOneCheckout.php:30-57`).

**가짜 완료 스위치**
- `STUDY114_PAID_MOCK_COMPLETE`는 값이 '1'일 때만 열린다.
- 운영 `.htaccess`와 배포에는 없다. CI 검증 워크플로 두 개에만 있다.

**웹훅**
- Standard Webhooks HMAC 서명과 ±5분 시각을 검사한다. 시크릿이 없으면 503으로 거절한다.
- 검증 뒤에도 포트원을 다시 조회해 확인한다.
- 운영에 서명 없는 POST → 400(상태 변화 없음).

**중복 처리(멱등)**
- 주문 행을 잠근다(FOR UPDATE).
- 상태를 검사하고, 묶음권 중복을 막는다(`packExistsForOrderRef`). 즉시권은 `sent`인지 확인한다.
- `pg_payment_id`에 유니크 키가 있다(090).

**환불표**
- 10회권 4000/2000/2000/2000/1300/0, 5회권 2250/1125/750/0, 7×24시간 기준(`MemoTicketRefundCalculator.php:27-56`).

**이중 환불 방지**
- 주문 행을 잠그고, `paid`일 때만 신청할 수 있다.
- `uk_refund_order_ref`(083)로 주문당 환불 요청은 하나다.
- 철회한 주문은 다시 환불할 수 없다.
- 취소 금액은 남은 금액 이하로만 허용한다. 포트원 취소 뒤 DB가 실패하면 따로 로그에 남긴다(091).

**IDOR(남의 것 보기·바꾸기)**
- paid/*: 공급자 역할을 요구하고, user_id는 세션에서만 가져온다.
- refund·complete: 주문 주인을 확인한다.
- 쪽지: thread와 사용자를 함께 조회한다. 첨부는 `findAttachmentForUser`로 확인한다.
- 등록 API: 서비스가 userId로 거른다.
- 쪽지권 차감: 프로필 소유를 확인한다(`ProviderTicketRepository.php:347-358`).
- 11-02 로그인 점검 결과(thread_id 주입 404, 타역할 403)와 맞는다.

**관리자 API**
- 매 요청마다 DB의 admin_level을 다시 본다.
- 운영에서 비로그인은 401이다(11-02 점검: 비관리자 403).

**쿠키**
- 운영 `PHPSESSID`에 Secure, HttpOnly, SameSite=Lax가 붙는다.

**CSRF**
- SameSite=Lax와 JSON 본문 방식이라 다른 사이트에서 보낸 POST에는 쿠키가 실리지 않는다.
- 상태를 바꾸는 GET은 L5(로그아웃) 말고는 찾지 못했다.

**업로드**
- MIME은 서버가 판별하고, getimagesize와 재인코딩을 거친다. 확장자는 서버가 정한다.
- `public/uploads/.htaccess`가 PHP 실행을 막는다. 운영에서 `/uploads/` 목록은 403이다.

**노출 파일 (운영)**
- `.git/HEAD`, `.git/config`, `.env`, `src/`, `config/`, `sql/`, `docs/`, `composer.*`, `package.json`, `vendor/`, `storage/`, `backup.zip`, `phpinfo.php`, `error_log`, `.DS_Store`: 모두 SPA 첫 화면(652바이트)만 나온다. 내용이 노출되지 않는다.
- `/.htaccess`는 403이다. `/api/`, `/assets/` 목록은 403이다.

**.htaccess 자리표시**
- 배포 단계에서 치환되지 않은 자리표시가 남으면 배포를 멈춘다.
- 운영 메인 JS에 `__..__` 자리표시나 비밀키 형태의 문자열이 없다.

**프런트 번들**
- 운영의 SPA 5개 진입 파일 해시가 박스에서 main `efc881f7`을 빌드한 결과와 같다.
  - 홈 `index-DMZi777V.js` / `style-DI1assQ7.css`
  - auth, search, register/room, register/tutor

**DB 구조 정합**
- PHP의 모든 INSERT·UPDATE 컬럼과 참조 테이블이 sql/schema 마이그레이션에 있다(테이블 77개 파싱, 불일치 0).

**SQL 인젝션**
- 모두 prepared statement를 쓴다. 문자열로 끼워 넣는 테이블·컬럼 이름은 상수나 화이트리스트다.

**XSS**
- 쪽지 본문·표시명, 게시판·고민방·고객센터 본문, 슬로건이 `esc()` 뒤에 출력된다(정적 점검 · 휴리스틱 검색에서 이스케이프 없는 사용자 필드 0).

**OAuth**
- return_to의 열린 리다이렉트를 막는다. state는 hash_equals로 비교한다.

**cron**
- 헤더 키, 32자 이상, 기본값 금지가 걸려 있다. GET은 405다.

**저장소 이력 비밀값**
- 1,923개 커밋에서 실키 패턴(Resend re_, whsec_, AWS, GitHub 토큰, 개인키 등)이 없다.
- 로컬 개발 DB 비밀번호(`study114dev`, `test`)만 예시 파일과 CI에 있다.

---

## 이번에 못 한 것

- **로그인 GET 점검.**
  - room-audit `secrets.env`의 공부방 계정 3개(s1·s2·b1)가 비밀번호 오류로 거절됐다. 실패 4회, 계정당 2회 이하.
  - 과외·학생 계정은 Vault에만 있고, 이번 실행에는 브라우저가 없어 쓰지 못했다.
  - 그래서 로그인 상태의 IDOR·CSRF는 코드와 11-02 점검 결과로 대신했다.
- **서버의 PHP·config 실제 내용과 DB 상태.** 읽을 방법이 없어 위 추정 1·M6으로 남겼다.
- 점검 중 운영에 남긴 흔적:
  - 실패한 로그인 4회(테스트 계정)
  - 없는 이메일로 옛 `/auth/login` POST 1회
  - 서명 없는 웹훅 POST 1회
  - 임의 세션 번호 1개
  - 모두 주문·결제·쪽지·환불을 만들지 않는다.

## 손질 순서 제안

1. H2(옛 로그인 경로 삭제) → 2. H3(공통 fail을 200+ok:false로) → 3. H1(PAID 뒤 충돌은 자동 취소, pending 묶음권 하나만) → 4. M1(세션 재발급) → 5. M3(phpMyAdmin 차단, Cloudflare만 손보면 됨) → 6. 추정 1(090·091 SHOW 확인) → 나머지는 실결제 전환 전.
