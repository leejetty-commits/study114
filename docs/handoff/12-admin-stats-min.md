# 12 — 관리자 「통계」 최소판 (/admin/stats) — Cursor 작업 지시서

- 작성: 2026-11-19 (KST) · 우동공과3
- 코드 기준: `origin/main` **8b52282c** (PR #265 머지). 시작 전에 `git fetch` 후 main이 달라졌으면 0단계에서 보고한다.
- 종현 결정(2026-11-19 00:30 KST, 확정)
  1. 「통계」 메뉴는 **맨 첫 줄**(`A28_MENU[0]`, 「운영 홈」 위). 단 `/admin` 첫 화면은 **계속 운영 홈**.
  2. 결제는 **경로별(pg_provider)** 로 나눠 본다.
  3. **최고관리자(super_admin)만**. 부마스터는 메뉴도 안 보이고 API도 403.
- 성격: 읽기 전용 집계. **스키마 변경·새 표·인덱스·트리거 없음.** 기존 「보고서」(`/admin/settlement`)는 손대지 않는다.
- 같이 쓰는 확인용 SQL: `docs/handoff/12-admin-stats-verify.sql` (종현이 phpMyAdmin에서 직접 실행, 화면 숫자와 대조)

---

## 0단계 — 먼저 진단만 하고 보고한 뒤 작업

코드를 고치기 전에 아래를 확인하고 **한 번 보고**한다. 하나라도 다르면 멈추고 보고한다.

1. `git fetch` 후 `origin/main`이 8b52282c인지. 아니면 아래 「확인된 코드 사실」의 줄 번호가 맞는지 다시 본다.
2. 아래 「허용 파일」 밖의 파일을 고쳐야 할 것 같으면 **즉시 멈추고 보고**한다(고치지 않는다).
3. 다음을 코드에서 직접 확인해 한 줄씩 보고한다.
   - `/admin` 첫 화면은 `getDefaultAdminPath()`가 정한다. `A28_MENU` 순서와는 관계없다.
   - 메뉴 숨김과 경로 차단은 `canAccessAdminMenu(menuId)`와 `SUB_MASTER_BLOCKED_MENUS`로 된다.
   - 서버의 최고관리자 전용 검사는 기존 `AdminApi::requireMaster($auth)`를 쓴다.
   - `TestAccountAllowlist::userIds($pdo)`가 있고 env `STUDY114_TEST_ACCOUNT_EMAILS`를 읽는다.
   - `ReportPeriod::toStorage()`, `dbOffsetMinutes()`, `storageToKst()`, `measuredTz()`가 있다.
   - 아래 「쓰는 표·칼럼」이 코드의 기존 쿼리에서 쓰이는 이름과 같다.
4. 보고 형식은 「확인됨 / 다름(파일:줄) / 멈춤 사유」로 한다.

---

## 확인된 코드 사실 (origin/main 8b52282c)

### 첫 화면(랜딩)
- `preview/home-ui/src/admin/route-match.js:72-74`: `getDefaultAdminPath()`는 `'/admin'`을 그대로 돌려준다. 메뉴 배열을 보지 않는다.
- `preview/home-ui/src/state.js:685-711` (`bootstrapAdminRoute`): 맨 `/admin`, `/admin/`, 모르는 `/admin/*`는 모두 `getDefaultAdminPath()`로 보낸다. `state.js:924-930` `getAdminPath()`의 기본값도 같다.
- `preview/home-ui/src/admin/index.js:27`: `normalizeAdminPath(path) || '/admin'`.
- `preview/home-ui/src/admin/router.js:34-46` `findAdminNavLeaf`: 못 찾으면 `path === '/admin'` 항목으로 돌아간다(배열 [0]이 아니다).
- `preview/home-ui/src/auth-session.js:64-69` `ROLE_HOME`에는 admin이 없다(명시 진입만).
- **결론:** `A28_MENU` 맨 앞에 「통계」를 넣어도 랜딩은 운영 홈 그대로다. **`route-match.js`의 `getDefaultAdminPath()`와 `state.js`는 고치지 않는다.**

### 부마스터 차단 (화면)
- `preview/home-ui/src/admin/admin-permissions.js:22`: `SUB_MASTER_BLOCKED_MENUS = ['permissions', 'settings', 'system']`.
- `admin-permissions.js:51-56` `canAccessAdminMenu`: super_admin이면 전부 허용하고, 부마스터는 위 목록에 있으면 거부한다.
- `preview/home-ui/src/admin/shell.js:66`, `:76`: 사이드바는 `canAccessAdminMenu(menuId || id)`로 거른다. 목록에 넣으면 **메뉴가 안 보인다.**
- `preview/home-ui/src/admin/admin-guard.js:13-19` `canAccessAdminPath`, `index.js:34-36`: 주소로 직접 들어와도 `renderAdminAccessGate`(「접근 제한」)가 뜬다.
- `preview/home-ui/src/admin/a28-screens.js:614-633` `renderHub`: 운영 홈 카드도 `canAccessAdminMenu`로 거른다. 부마스터는 운영 홈에서도 통계 카드가 안 보인다.
- `a28-screens.js:1580`: 권한 화면은 `SUB_MASTER_BLOCKED_MENUS`를 `A28_MENU_ID_LABELS`로 보여 준다. 그래서 라벨 `stats: '통계'`도 넣는다.

### 부마스터 차단 (서버)
- `src/Admin/AdminApi.php:92-110` `requireAdmin()`: 운영자 권한, 가입 완료, **콘솔 2차 비밀번호**(`$console = true` 기본)를 검사한다.
- `src/Admin/AdminApi.php:113-119` `requireMaster(array $auth)`: `AdminRoleService::isSuperAdmin`이 아니면 403 「최고관리자 권한이 필요합니다.」를 준다.
- 같은 패턴을 쓰는 곳: `public/api/admin/site-settings.php:21-22`, `home-popups.php:24`, `members-bulk-delete.php:14`.
- **새 helper를 만들지 않는다.** 그래서 `admin-permissions.js` 한 줄 말고는 권한용으로 더 고칠 파일이 없다.
- `src/Admin/AdminRoleService.php:135-149` `canAccessMenu()`에도 같은 3개 목록이 있다. 하지만 어디서도 호출하지 않는다(rg 확인). **손대지 않는다.**

### 테스트 계정·시간
- `src/Auth/TestAccountAllowlist.php:19-43`: 이메일 목록은 config `auth.test_account_emails`에서 읽는다(`config/auth.php:48` → env `STUDY114_TEST_ACCOUNT_EMAILS`). **DB에는 목록이 없다.**
- `TestAccountAllowlist.php:60-81` `userIds(PDO)`는 `list<int>`를 돌려준다. 목록이 비어 있으면 `[]`이다.
- 제외 SQL 패턴은 `src/Visibility/TestOwnerVisibility.php:53-60`과 같다(정수 id를 `NOT IN (...)`에 붙이고, 비어 있으면 조건 없음).
- `src/Report/ReportPeriod.php`
  - `:18-21`: KST(`PositionPeriodCalculator::BUSINESS_TZ`).
  - `:75-92` `toStorage($kst, 'db')`: KST 경계를 DB 저장 시각으로 바꾼다.
  - `:94-103` `dbOffsetMinutes()`
  - `:119-134` `storageToKst($stored, 'db', $offset, $phpTz)`
  - `:110-117` `measuredTz()`
- `users.created_at`, `study_rooms.created_at`, `tutors.created_at`, `provider_payment_orders.created_at`은 DB 기본값(`CURRENT_TIMESTAMP`)으로 채운다(`SignupService.php:165` INSERT에 created_at 없음). 그래서 변환할 때 source는 `'db'`이다.
- 활성 노출 구독은 기존 코드 전부가 `CURDATE() < end_exclusive_on`으로 판정한다. 남은 일수는 `DATEDIFF(end_exclusive_on, CURDATE())`이다(`src/Paid/ProviderReminderRepository.php:23-27`). 같은 식을 그대로 쓴다.

### 결제 경로
- `src/Paid/Pg/PgProvider.php:13-14`: `pg_provider` 값은 `'dev_mock'`, `'portone_test'` 두 가지다. 지금 운영 결제는 전부 이 둘 중 하나다.
- `provider_payment_orders.provider_type` (056)은 **산 계정의 종류**(`study_room`, `tutor`, NULL)이다. 결제 경로가 아니다. 그래서 D표는 **경로 = `pg_provider`**, 상품 = `product_kind`, 구매 계정 = `provider_type`의 세 축으로 나눈다.
- `status` ENUM (083): `pending`, `paid`, `failed`, `cancelled`, `refund_requested`, `refunded`.
- 환불 확정액: `provider_refund_requests.refund_won` (`status = 'refunded'`), `order_ref`로 연결한다.
- `product_kind` ENUM: `position`, `count`, `badge_addon`.
- `provider_payment_orders.user_id`는 회원 삭제 뒤 NULL일 수 있다(071).

---

## 허용 파일 (이 밖은 고치지 않는다)

| 구분 | 파일 | 할 일 |
|---|---|---|
| 새 파일 | `src/Admin/AdminStatsRepository.php` | 집계 쿼리(읽기 전용) |
| 새 파일 | `public/api/admin/stats.php` | GET 엔드포인트, requireAdmin과 requireMaster |
| 새 파일 | `preview/home-ui/src/admin/a28-stats.js` | 화면 렌더, 바인드, fetch |
| 수정 | `preview/home-ui/src/admin/a28-copy.js` | `A28_MENU[0]`에 통계를 넣고 `A28_MENU_ID_LABELS.stats` |
| 수정 | `preview/home-ui/src/admin/route-match.js` | `ADMIN_ROUTE_PATHS`에 `'/admin/stats'`만 추가 |
| 수정 | `preview/home-ui/src/admin/a28-screens.js` | import 1줄, `renderA28Screen` 분기 1줄 |
| 수정 | `preview/home-ui/src/admin/a28-screens-bind.js` | import 1줄, bind 분기 1줄 |
| 수정 (마스터 전용, 확인됨) | `preview/home-ui/src/admin/admin-permissions.js` | `SUB_MASTER_BLOCKED_MENUS`에 `'stats'` 추가(22행), 이것만 |
| 작업 기록 | `docs/worklog/2026/11/2026-11-19-admin-stats-min.md` | 작업 기록 1개 |

- CSS 새 파일이나 CSS 수정은 없다. `a28-stats.js`에서 `import '../styles/admin-member-mail.css';`를 쓴다(`a28-withdraw-reasons.js:2`와 같다).
- 사용자 화면, `shared/`, `state.js`, `router.js`, `shell.js`, `admin-guard.js`, `AdminRoleService.php`, 보고서 파일은 **수정 금지**이다.

---

## 공통 제외 규칙 (모든 집계)

**살아 있는 실제 회원** (별칭 `u`):

```sql
u.status <> 'withdrawn' AND u.deleted_at IS NULL
AND u.admin_level IS NULL
AND NOT EXISTS (SELECT 1 FROM user_roles ra WHERE ra.user_id = u.id AND ra.role_type = 'admin')
AND u.id NOT IN (<TestAccountAllowlist::userIds($pdo)>)   -- 목록이 비면 이 줄 생략
```

- 테스트 id는 `TestAccountAllowlist::userIds($pdo)`로 **요청당 1번** 받는다. `(int)`로 바꿔 `implode(',')`한다. prepare 자리표시자를 쓰지 않는다(TestOwnerVisibility와 같은 방식).
- 카드, 구독, 후보는 **카드 주인**이 위 조건을 통과해야 센다.
  - 공부방: `study_rooms.user_id`
  - 과외쌤: `tutors.user_id`
  - 학생: `students.guardian_user_id`
  - 구독: `provider_position_subscriptions.user_id`
- **결제(A-6, D)만 예외**: 테스트와 운영자 주문은 빼지만, 탈퇴하거나 삭제된 회원(user_id NULL 포함)의 결제는 **넣는다**. 실제로 받은 돈이기 때문이다. 이 규칙을 화면 도움말에 한 줄로 적는다.

**카드 등록 판정** (기존 `src/Registration/BasicCardRegisteredQuery.php:105-128`의 `where()`에서 기간 조건만 뺀 것)

이 파일은 고치지 않고, AdminStatsRepository 안에 같은 조건을 쓴다.

- 공부방: `sr.deleted_at IS NULL AND EXISTS (SELECT 1 FROM study_room_regions r WHERE r.study_room_id = sr.id AND r.slot = 1 AND r.region_id IS NOT NULL AND r.region_id <> 0)`
- 과외쌤: `EXISTS (SELECT 1 FROM tutor_regions r WHERE r.tutor_id = t.id AND r.priority_order = 0 AND r.region_id IS NOT NULL AND r.region_id <> 0)` (tutors에는 deleted_at이 없다. 기존과 같다.)
- 학생: `s.published_at IS NOT NULL AND s.deleted_at IS NULL`
- `profile_status`와 `exposure_status`로는 거르지 않는다(숨김도 등록으로 센다. 기존과 같다).

**대표 지역**: `BasicCardRegisteredQuery.php:266-273` `representativeRegionExpr()`와 같은 식이다.
- 공부방: `study_room_regions.slot = 1`
- 과외쌤: `tutor_regions.priority_order = 0`
- 학생: `preferred_lesson_type`에 따라 `preferred_tutor_region_id` 또는 `preferred_studyroom_region_id`
- 시·도는 `regions.sido_name` **저장값 그대로** 묶는다(약칭 변환 없음). NULL이거나 regions에 행이 없으면 「미분류」이다.
- 학생 추가 희망 지역(087 `*_extra_id`)은 넣지 않는다.

**활성 노출(유료 이용 중)**: `provider_position_subscriptions`에서 `sku_code IN ('prime','pick') AND CURDATE() < end_exclusive_on`.
- 카드 단위는 `(provider_type, provider_id)`이다.
- `provider_id`가 NULL인 옛 행은 카드로 잇지 못한다. 시·도 표에서는 「미분류」, 상단에서는 「카드 미지정 n건」으로 따로 센다.

**돈**: DB와 API는 **원**(정수) 그대로 둔다. 화면에서만 `천원`으로 바꾼다.
- `(won / 1000).toLocaleString('ko-KR', { maximumFractionDigits: 1 }) + '천원'`
- 예: 2,250원은 「2.3천원」, 0원은 「0천원」.

---

## API — `public/api/admin/stats.php`

- 뼈대는 `public/api/admin/withdraw-reasons.php`와 같다(헤더, CORS, OPTIONS 처리 그대로).
- 순서:

```php
AdminApi::run(static function (): void {
    $auth = AdminApi::requireAdmin();      // 콘솔 2차 비밀번호 포함(기본값 true)
    AdminApi::requireMaster($auth);        // 부마스터 403
    if (AdminApi::method() !== 'GET') { AdminApi::fail(405, 'method_not_allowed', 'GET만 허용됩니다.'); }
    $days = AdminApi::queryInt('days', 14);
    if (!in_array($days, [7, 14, 30], true)) { AdminApi::fail(422, 'validation', 'days는 7, 14, 30만 가능합니다.'); }
    AdminApi::ok((new AdminStatsRepository(Connection::get()))->summary($days, new DateTimeImmutable('now', new DateTimeZone('Asia/Seoul'))));
});
```

- POST, PATCH, 내보내기 엔드포인트는 만들지 않는다.

**응답 모양** (숫자는 int, 돈은 원):

```json
{
  "ok": true,
  "generated_at": "2026-11-19 10:00",          // KST
  "days": 14,
  "top": {
    "members_total": 0,
    "signups_today": 0,
    "cards": { "study_room": 0, "tutor": 0, "student": 0 },
    "paid_in_use": { "cards": 0, "prime": 0, "pick": 0, "unlinked_rows": 0 },
    "candidates": { "free_cards": 0, "expiring_cards": 0, "no_card_members": 0 },
    "payments": { "count": 0, "amount_won": 0 }
  },
  "signups": [ { "date": "2026-11-06", "study_room": 0, "tutor": 0, "student": 0, "none": 0, "total": 0 } ],
  "regions": {
    "rows": [ { "sido": "서울특별시", "study_room": 0, "tutor": 0, "student": 0, "prime": 0, "pick": 0 } ],
    "unclassified": { "study_room": 0, "tutor": 0, "student": 0, "prime": 0, "pick": 0 },
    "total": { "study_room": 0, "tutor": 0, "student": 0, "prime": 0, "pick": 0 }
  },
  "payments": [ { "pg_provider": "portone_test", "product_kind": "count", "provider_type": "tutor",
                  "paid_count": 0, "paid_won": 0,
                  "refund_requested_count": 0, "refund_requested_won": 0,
                  "refunded_count": 0, "refunded_won": 0, "refund_won": 0 } ],
  "candidates": {
    "free_cards": { "total": 0, "items": [ { "role": "study_room", "name": "", "region": "", "signed_up_on": "2026-11-01" } ] },
    "expiring":   { "total": 0, "items": [ { "role": "tutor", "name": "", "region": "", "sku": "prime", "days_left": 3, "signed_up_on": "2026-11-01" } ] },
    "no_card":    { "study_room_owner": 0, "tutor": 0, "guardian_student": 0 }
  }
}
```

- 이메일, 전화, 실명(`user_profiles.real_name`), user_id, 카드 id는 **응답에 넣지 않는다.**
- `name`은 카드 표시명만 쓴다: 공부방 `study_rooms.study_room_name`, 과외쌤 `tutors.tutor_display_name`.

---

## 집계 정의 — `src/Admin/AdminStatsRepository.php`

- `namespace Study114\Admin; final class AdminStatsRepository { public function __construct(private readonly PDO $pdo) {} public function summary(int $days, DateTimeImmutable $now): array }`
- 시간 처리는 `Study114\Report\ReportPeriod`만 쓴다(새 시간 유틸 금지).
- SELECT만 쓴다. INSERT, UPDATE, DELETE, DDL, `information_schema`, `PREPARE`는 없다.

### A. 상단 카드 6개
1. **전체 회원**: 살아 있는 실제 회원 수.
2. **오늘 가입**: 위 회원 중 `u.created_at >= toStorage(오늘 KST 00:00,'db') AND u.created_at < toStorage(내일 KST 00:00,'db')`.
3. **등록 카드**: 공부방, 과외쌤, 학생 각각의 등록 카드 수(카드 주인 제외 규칙 적용). 한 칸에 「공부방 n · 과외쌤 n · 학생 n」.
4. **유료 이용 중**
   - 활성 prime이나 pick이 있는 카드 수는 `COUNT(DISTINCT provider_type, provider_id)`, `provider_id IS NOT NULL`.
   - 아랫줄에 「프라임 n · 픽 n」(sku별 DISTINCT 카드).
   - `unlinked_rows > 0`이면 「카드 미지정 n건」.
5. **유료 전환 후보**: `free_cards + expiring_cards`(두 집합은 겹치지 않는다. 하나는 활성 구독이 없고, 하나는 있다). 아랫줄에 「카드 없는 역할 회원 n명」(c).
6. **누적 결제**
   - `status IN ('paid','refund_requested','refunded')`인 건수와 `SUM(amount_won)`. 기간 없이 전체 누적이다.
   - 제외: 주문 user_id가 테스트 id이거나 운영자(admin_level, admin 역할)이면 뺀다. user_id NULL은 넣는다.
   - 화면 표시는 「n건 · x천원」.

### B. 역할별 일별 가입
- 기간 버튼은 7, 14, 30일이고 기본은 14일이다. 범위는 `오늘 KST 00:00 - (days-1)일` 이상, `내일 KST 00:00` 미만이다(toStorage 'db').
- 역할은 **대표 역할 1개**이다: `(SELECT r.role_type FROM user_roles r WHERE r.user_id = u.id AND r.is_primary = 1 AND r.status = 'active' ORDER BY r.id LIMIT 1)` (`src/Auth/LoginService.php:36` 조인 조건과 같고, 중복 대표 역할 대비로 LIMIT 1). 열은 `study_room_owner→공부방`, `tutor→과외쌤`, `guardian_student→학생`이고, 대표 역할이 없으면 「역할 미선택」(`none`)이다.
- 날짜 묶기는 **PHP에서** 한다. 범위 안 행의 `created_at`을 `storageToKst($v,'db',$offset,$phpTz)`로 바꾼 뒤 앞 10자로 묶는다(`$offset`, `$phpTz`는 `measuredTz()`로 1번 받는다). SQL `DATE()`나 `CONVERT_TZ`는 쓰지 않는다.
- 가입이 0인 날도 행으로 채운다. 오래된 날이 위에 오게 정렬하고, 맨 아래에 합계 행을 둔다.

### C. 시·도 표
- 행은 `regions.sido_name`, 열은 공부방 카드, 과외쌤 카드, 학생 카드, 프라임 이용 중, 픽 이용 중이다.
- 프라임과 픽은 **구독의 카드(provider_type, provider_id)의 대표 지역 시·도**로 센다(구독의 노출 지역 칼럼 065/066이 아니다). 같은 카드에 같은 sku가 여러 행이면 1로 센다.
- 정렬은 `sido_name` 오름차순이다. 그 아래 **「미분류」 행**(지역 NULL, regions에 없음, provider_id NULL 구독), 맨 아래 **「합계」 행**.
- 조사 자료(지역 조사 수, 연락처)는 **넣지 않는다.**

### D. 결제 요약 (경로별)
- `GROUP BY o.pg_provider, o.product_kind, o.provider_type`이고, 대상은 `o.status IN ('paid','refund_requested','refunded')`이다. 제외 규칙은 A-6과 같다.
- 열
  - 결제 완료 건수, 금액: `status='paid'`
  - **환불 요청** 건수, 금액: `status='refund_requested'`
  - **환불 완료** 건수, 결제 금액: `status='refunded'`
  - 환불 확정액: `SUM(rr.refund_won)`, `LEFT JOIN provider_refund_requests rr ON rr.order_ref = o.order_ref AND rr.status = 'refunded'`
- 라벨
  - 경로: `dev_mock`은 「모의 결제」, `portone_test`는 「포트원 테스트」, 그 밖의 값은 원래 값 그대로.
  - 상품: `position`은 「노출상품(프라임·픽)」, `count`는 「쪽지권」, `badge_addon`은 「배지」.
  - 구매 계정: `study_room`은 「공부방」, `tutor`는 「과외쌤」, NULL은 「—」.
- 경로별 소계 행과 전체 합계 행을 둔다. 금액은 화면에서 천원으로 바꾼다.
- `pending`, `failed`, `cancelled`는 세지 않는다. 표 아래에 한 줄로 적는다.

### E. 유료 전환 후보 (이름, 지역, 가입일만)
- (a) **무료 카드**
  - 대상: 등록된 공부방과 과외쌤 카드 중 `NOT EXISTS (활성 prime/pick WHERE s.provider_type = '<role>' AND s.provider_id = 카드 id)`.
  - total은 전체 수이고, items는 **최대 50행**이다. 가입일 최신순으로 정렬한다.
  - 열: 역할, 카드 이름, 지역(대표 지역 `sido_name + ' ' + sigungu_name`), 가입일(카드 주인 `users.created_at`을 KST 날짜로).
- (b) **곧 끝나는 유료**
  - 대상: 활성 구독 중 `DATEDIFF(end_exclusive_on, CURDATE()) BETWEEN 1 AND 7`. 카드(provider_type, provider_id)별로 가장 빨리 끝나는 1행만 쓴다.
  - total과 최대 50행. 정렬은 남은 일수 오름차순이다.
  - 열: 역할, 카드 이름, 지역, 상품(프라임/픽), 남은 일수, 가입일.
- (c) **카드 없는 역할 회원**: **숫자만** 센다(명단 없음). 살아 있는 실제 회원 중 `user_roles.status = 'active'`인 역할별로 센다.
  - `study_room_owner`: 등록된 공부방 카드가 없다.
  - `tutor`: 등록된 과외쌤 카드가 없다.
  - `guardian_student`: 등록된 학생 카드가 없다.
- 이메일, 전화, 실명, 내보내기(엑셀/CSV), 복사 버튼은 **없다.**

---

## 화면 — `preview/home-ui/src/admin/a28-stats.js`

- 본보기: `a28-withdraw-reasons.js`(같은 구조).

```js
import { adminFetch, adminHttpStatus } from './admin-fetch.js';
import '../styles/admin-member-mail.css';
import { esc, renderPanel } from './a28-screens-shared.js';
export const STATS_PATH = '/admin/stats';
export function renderStats() { /* renderPanel('통계', 'A28-STATS', `<div data-stats-root>…</div>`, { lead }) */ }
export function bindStats(root) { /* data-stats-root · dataset.bound 가드 · seq 가드 · load(days) */ }
```

- 위에서부터 A부터 E 순서로 그린다.
  - 상단 6개: `<div class="sup-admin-hub">` 안에 `<div class="sup-admin-hub__card">` + `__title`(라벨) + `__desc`(숫자). 기존 클래스만 쓴다.
  - 표: `member-mail__table-wrap` > `table.sup-admin-table.member-mail__table`, 숫자 칸은 `member-mail__num`.
  - 기간 버튼: `member-mail__actions` 안에 `btn btn--secondary btn--sm` + `aria-pressed`. 누르면 `?days=` 로 다시 부른다.
- 오류 문구는 상태 코드로 고른다(닷홈 4xx 대응, `a28-withdraw-reasons.js:130-134` `errorText`와 같다).
  - 401, 403: 「최고관리자만 볼 수 있어요.」
  - 그 밖: 「불러오지 못했어요. 잠시 뒤 다시 열어 주세요.」
- 상단 도움말 한 줄: 「테스트 계정·운영자·탈퇴 회원은 빼고 셉니다. 결제는 탈퇴 회원 것도 포함해요. 금액은 천원 단위예요.」
- 기존 「보고서」(`/admin/settlement`)와 겹치는 결제 숫자는 **기준이 다를 수 있다**. 보고서는 `status='paid'`만 세고, 테스트 계정 제외가 없다. 화면에 이 설명은 넣지 않고, 작업 기록에만 적는다.

### 메뉴·라우트 연결
- `a28-copy.js` `A28_MENU` **맨 앞**(index 0, 지금의 `hub` 앞)에 넣는다.

```js
{
  id: 'stats',
  label: '통계',
  path: '/admin/stats',
  menuId: 'stats',
  masterOnly: true,
  help: '실제 회원 기준 가입·카드·유료 이용·결제를 한눈에 봅니다.',
  screenId: 'A28-STATS',
},
```

  - 「운영 홈」 항목은 지우거나 옮기지 않는다(그대로 [1]이 된다).
  - `A28_MENU_ID_LABELS`에 `stats: '통계',`를 추가한다.
- `route-match.js`: `ADMIN_ROUTE_PATHS`에 `'/admin/stats',`만 추가한다. `getDefaultAdminPath()`는 **그대로** `'/admin'`.
- `admin-permissions.js:22`: `['permissions', 'settings', 'system', 'stats']`.
- `a28-screens.js`
  - `import { STATS_PATH, renderStats } from './a28-stats.js';`
  - `renderA28Screen`: `else if (path === STATS_PATH) body = renderStats();`
- `a28-screens-bind.js`
  - `import { STATS_PATH, bindStats } from './a28-stats.js';`
  - `bindA28ScreenEvents`: `if (path === STATS_PATH) bindStats(root);`

---

## 수락 기준
1. 최고관리자는 사이드바 맨 위에 「통계」가 보이고, 그 아래가 「운영 홈」이다. 클릭하면 `/admin/stats`로 간다.
2. `#/admin`, `/admin`으로 들어가면 **운영 홈**이 뜬다(통계가 아니다).
3. 부마스터
   - 사이드바와 운영 홈 카드에 통계가 없다.
   - `#/admin/stats`로 직접 들어가면 「접근 제한」이 뜬다.
   - `GET /api/admin/stats.php`는 **403**.
   - 권한 화면의 「부마스터 금지 메뉴」에 「통계」가 보인다.
4. 콘솔 2차 비밀번호가 잠긴 상태로 API를 부르면 기존 콘솔 게이트 응답(`requireAdmin` 기본)이 온다.
5. `days=7|14|30`만 허용하고, 그 밖의 값은 422이다.
6. 화면 숫자는 `12-admin-stats-verify.sql` 결과와 같다(A1~A6, B, C, D). 종현이 대조한다.
7. 응답, 화면에 이메일, 전화, 실명, user_id가 없고 내보내기 버튼도 없다.
8. 금액은 전부 「천원」으로 표시한다.
9. 기존 회귀 스크립트(최고관리자 시뮬레이션)가 그대로 통과한다.
   - `npx vite-node scripts/verify-admin-preview-labels.mjs`
   - `npx vite-node scripts/verify-admin-162-settlement.mjs`
   - `npx vite-node scripts/verify-admin-registration-list.mjs`
   - 실행 명령은 각 스크립트 머리 주석에 적힌 그대로이다.
   - 실패하면 고치지 말고 보고한다(스크립트는 허용 파일이 아니다).
10. `cd preview/home-ui && npm run build`(`vite build`)가 통과한다. 사용자 엔트리 번들 크기는 그대로이다(통계는 admin 지연 청크 안에 들어간다).

## 마지막 확인 — 바뀐 파일 = 허용 목록
- `git diff --name-only origin/main...HEAD`의 결과가 위 「허용 파일」 9개와 **정확히 같아야** 한다. 남는 파일이나 빠진 파일이 있으면 머지 전에 보고한다.
- 작업 기록에 다음을 적는다.
  - 0단계 보고 요약
  - 바뀐 파일 목록
  - 수락 기준 1~10 결과
  - 보고서와 기준이 다른 점(결제 status, 테스트 제외)
- 운영 SQL 실행, 스키마 변경, 새 표는 없다. PR #198은 머지하지 않는다.

## 열린 점 (이번 범위 밖, 기록만)
- 구독 `provider_id` NULL 옛 행의 처리(지금은 「미분류」, 「카드 미지정」으로 센다).
- 학생 추가 희망 지역(087)을 지역 표에 넣을지.
- 삭제된 테스트 계정의 주문(user_id NULL)은 테스트 제외에 걸리지 않는다. 16c 정리 SQL로 지운 뒤 숫자를 다시 본다.
