# 363 관리자 콘솔 2차 비밀번호 (2026-11-11)

- 작성: 우동공과3 · 실행·1차 셀프검수: Cursor · **최종검수: 우동공과3 직접** (보안 작업 — 우동공과3가 우회·잠금·해시를 직접 재현 검증함)
- 브랜치: `work/363-admin-console-2nd-password`
- 선행: main 최신 (`e573b4e` PR #160 머지 이후 `git pull`). 361 보안 전수검사 **앞**에 넣는다(361이 새 게이트를 포함해 점검하도록).
- 정본: 노션 [관리자 기능 · 운영실 정본](https://app.notion.com/p/3f39d518fe778147a495d580ca873e5c) 「잠금 · 콘솔 2차 비번 (2026-10-28)」, [관리자콘솔 2차 비번 작업체크리스트](https://app.notion.com/p/4079d518fe7781e8993df3bc3a0aefce). 아래 잠금 규칙이 코드·카피와 다르면 이 지시서·정본이 우선.

### 잠금 규칙 (2026-10-28 종현 확정 · 변경 금지)
- 최고관리자는 공부방 모드와 **같은 소셜 계정**. 콘솔 전용 계정 분리 없음(이미 038 dual-capability).
- **콘솔 진입 시에만** 2차 비밀번호를 한 번 더 받는다. 공부방·마이페이지 이용에는 묻지 않는다.
- 조합: **정확히 6자** = 영문 2자(대문자 1 + 소문자 1) + 숫자 2 + 특수문자 2.
- 실패 **5회** 후 잠금. 공개 “비번 찾기/메일 재설정” **없음**. 초기화는 종현만 닷홈·DB(또는 SSH CLI)에서.
- 기존 `users.must_change_password`(부마스터 임시 로그인 비번, 8~14자)와 **섞지 않는다**. 2차 비번은 콘솔 잠금해제 전용.

## 대상

### 서버 (강제 지점 — UI만으로 끝내면 안 됨)
- `src/Admin/AdminApi.php` — 현재 `requireAdmin()`은 로그인 + `hasAdminCapability` + 이메일 인증만 본다. **모든** `public/api/admin/*`가 여기를 탄다(현재 19개). 여기에 콘솔 해제 검사를 한 곳에서 붙인다.
- 신규 `src/Admin/AdminConsolePasswordService.php` — 검증·해시·실패 카운트·잠금·세션 플래그·변경. 판정은 이 파일 한 곳.
- 신규 `public/api/admin/console-unlock.php` — 상태 조회(GET) · 잠금해제(POST) · (해제된 뒤에만) 변경(POST `action=change`).
- 기존 19개 엔드포인트는 `requireAdmin()`이 해제까지 요구하도록 바꿔서 **개별 파일을 하나씩 고치지 않아도 되게** 한다. 예외는 아래 범위 2항.
- `src/Auth/AuthSession.php` — 콘솔 해제 플래그(시각)를 세션에 읽고 쓰기. `logout()`이 `$_SESSION['auth']`를 지우므로 로그아웃 시 해제도 같이 풀린다(유지). 로그인 수명(7일)은 바꾸지 않음.
- `src/Admin/AdminOperationLogRepository.php` — 기존 `insert()` 재사용. `action_kind`는 `VARCHAR(50)`이라 ENUM 변경 없음.
- `src/Admin/AdminRoleService.php` — 권한 판정은 현행 유지. 2차 비번 로직을 여기 넣지 않음.
- `public/api/auth/me.php` — 관리자일 때만 `console_unlocked`(bool) 추가. 비관리자에게는 키 생략. 로그인 비밀번호·해시 노출 금지.
- 마이그레이션 초안: `sql/schema/085_admin_console_auth.sql` (현재 마지막 번호는 `084_student_prime_match_opt_in.sql`. **085 사용. 운영 적용 금지**).
- 최초 설정 CLI: `scripts/admin-console-password-set.php` (stdin으로만 비번을 받음. argv·환경변수·로그에 평문 금지).
- 종현용 운영 절차: `docs/internal/31-admin-console-password-ops.md` (재설정 SQL + CLI 사용법. **평문·예시 비번·해시 원문 금지**).

### 프론트 (새 잠금해제 화면만)
- `preview/home-ui/src/admin/admin-guard.js` — 잠금해제 게이트 렌더(안내 카피, 남은 횟수, 잠금 안내). 기존 `renderMustChangePasswordGate()`는 건드리지 않음.
- `preview/home-ui/src/admin/index.js` — 렌더 순서: 비관리자 거부 → `must_change_password` 게이트 → **2차 비번 게이트** → 콘솔 본문. 게이트 중에는 `bindA28ScreenEvents`를 부르지 않음(메뉴 API 호출 방지).
- `preview/home-ui/src/admin/shell.js` — 잠금해제 화면은 사이드바·브레드크럼 없이 `renderAdminDeniedFrame`과 같은 틀(데이터 API가 안 뜨게). 셸 레이아웃 숫자는 변경 금지.
- `preview/home-ui/src/admin/admin-permissions.js` — 권한 표는 읽기만. 2차 비번 판정을 프론트에 두지 않음.
- `preview/home-ui/src/auth-session.js` — `console_unlocked` 플래그 읽기(서버 값만).
- `preview/home-ui/src/main.js` — `#/admin` 진입은 기존 `isAdminUser()` 분기 유지. 잠금해제 여부는 `renderAdmin()` 안에서 처리. 관리자 외 라우트 변경 금지.
- `preview/home-ui/src/styles/home-admin.css` — **새 클래스만 추가**(예: `.admin-console-unlock-form`). 기존 `.admin-state`·`.admin-must-change-form`·셸 규칙의 값 변경 금지.
- `preview/shared/route-access.js` — `#/admin`이 guest 공개가 아닌 현행 유지. 수정 필요 없으면 손대지 않음.

### 참고만 (수정 금지)
- `src/Admin/AdminOperatorService.php`, `public/api/admin/operators.php` — 부마스터 **로그인** 비번 발급·리셋. 콘솔 2차 비번과 별개. 이번 티켓에서 로그인 비번을 2차 비번으로 쓰지 않음.
- `src/Auth/LoginRateLimiter.php` — 사이트 로그인 제한. 콘솔 실패 카운트는 DB에 두고 이 파일을 재사용하지 않음.

## 범위

1. **저장 (해시만, 평문 금지)**
   - 새 테이블 `admin_console_auth`:
     - `user_id` PK, `users.id` FK `ON DELETE CASCADE`
     - `password_hash` VARCHAR(255) NOT NULL — `password_hash($pw, PASSWORD_DEFAULT)` / `password_verify()`
     - `fail_count` UNSIGNED INT NOT NULL DEFAULT 0
     - `locked_until` DATETIME NULL (UTC 저장, 표시는 KST)
     - `updated_at` DATETIME
   - **`users.password_hash`를 쓰지 않음.** 최고관리자 소셜 계정 로그인 비번과 부마스터 로그인 비번을 덮거나 재사용하면 안 된다.
   - 행이 없으면 「미설정」. 웹에서 최초 설정하는 화면은 만들지 않음.

2. **서버 강제**
   - `AdminApi::requireAdmin()` 끝에 콘솔 해제 검사를 기본으로 넣는다. 해제되지 않으면 HTTP **403**, `error=console_unlock_required` (비로그인 401, 비관리자 403 `forbidden`은 현행 유지).
   - **예외**(해제 없이 `requireAdmin()`만): 신규 `console-unlock.php`의 GET(상태)·POST(잠금해제). 상태 API는 잠금·남은 횟수·미설정 여부만 돌려주고, 해시·실패 원장은 안 내려줌.
   - `requireMaster()` 등 나머지 권한 검사는 해제 검사 **다음**에 그대로 동작.
   - 크론·내부 스크립트가 `public/api/admin/*`를 세션 없이 부르는 경로가 있으면 보고만 하고, 비밀 헤더로 우회를 새로 만들지 않음(현행 `settlement-report.php`·`member-mail.php`도 `requireAdmin()`).

3. **세션 해제 플래그**
   - `$_SESSION['auth']['console_unlocked_at']` (unix time). 슬라이딩 유휴: 해제된 `/api/admin/*` 호출이 성공할 때마다 갱신.
   - **권장 유휴 30분.** 만료 시 플래그만 지우고 사이트 로그인은 유지. 다시 게이트. ⚠ 종현 결정(권장안대로 구현, 상수 한 곳).
   - 로그아웃·세션 무효화 시 해제 플래그도 사라짐.

4. **실패·잠금 (서버 저장, 쿠키만 지워서 리셋 불가)**
   - 실패는 `admin_console_auth.fail_count`에 사용자 단위로 증가(IP 버킷 추가하지 않음).
   - 5회 실패 시 `locked_until` 설정. **권장: 15분 잠금, 잠금 만료 또는 성공 시 카운트 0.** 당일 차단은 공개 재설정이 없어 가혹하므로 이번엔 쓰지 않음. ⚠ 종현 결정.
   - 잠금 중 시도는 검증하지 않고 403 `error=console_locked`, 남은 시각만.
   - 응답 메시지에 남은 횟수를 넣되, 맞는지/틀린지 외의 계정 존재 여부는 추가로 드러내지 않음.

5. **최초 설정 (웹 없음 · 종현만)**
   - `php scripts/admin-console-password-set.php --email <주소>` (또는 `--user-id`). 비번은 **숨긴 stdin** 두 번(확인). 규칙 검사 후 해시 저장, 실패 카운트·잠금 해제.
   - 성공 출력은 `user_id`·이메일 마스킹·`updated`만. 평문·해시 출력 금지. argv에 비번 옵션 금지.
   - 닷홈에 PHP CLI가 없으면 같은 문서에 「종현 PC에서 stdin으로 해시만 만들어 UPDATE」절차를 적음. 해시 생성 명령도 평문이 히스토리에 안 남기게 stdin만.

6. **변경·비상 초기화**
   - 변경: 콘솔 해제 후에만, 본인 계정, 기존 2차 비번 확인 + 새 비번·확인. `console-unlock.php` POST `action=change`.
   - 재설정: `docs/internal/31-admin-console-password-ops.md`에 SQL(해당 `user_id` 행 DELETE 또는 hash 갱신 + `fail_count=0`, `locked_until=NULL`)과 CLI 재실행. 웹·메일 경로 없음.
   - 비상코드(금고) 구현은 **이번 범위 밖**(아래 결정). 문서에 「비밀번호 관리앱에 2차 비번을 보관」한 줄만.

7. **UX (새 화면만)**
   - `#/admin` 진입 시, 관리자 세션이어도 미해제면 게이트. 카피 요지:
     - 제목: 「운영 콘솔 잠금」
     - 안내: 「콘솔에 들어가려면 2차 비밀번호 6자가 필요해요. (영문 대문자 1 · 소문자 1 · 숫자 2 · 특수문자 2)」
     - 실패: 남은 횟수 표시.
     - 잠금: 「5번 틀려 잠시 잠겼어요. ○○:○○(Asia/Seoul)에 다시 시도해 주세요. 풀리지 않으면 종현에게 문의해 주세요.」
     - 미설정: 「2차 비밀번호가 아직 설정되지 않았어요. 종현이 서버에서 설정한 뒤에 사용할 수 있어요.」
   - 특수문자 허용 집합(권장, 상수 1곳): `!@#$%^&*?` — 6자 조합이 아니면 클라이언트·서버 모두 거절(서버가 정본).
   - 입력 칸 `type=password`, `autocomplete="off"` (또는 `current-password`). 스크린샷에 입력값이 보이면 안 됨(빈 칸 또는 마스킹만).

8. **감사 로그** (비번·해시 금지, IP는 넣어도 됨)
   - `action_kind`: `console_unlock_ok` / `console_unlock_fail` / `console_locked` / `console_password_change` / `console_password_set`
   - `target_type=admin_console`, `target_id=해당 user_id`, `reversible=false`, `user_notified=false`.

9. **운영 적용 순서** (코드에 넣지 말고 보고·ops 문서에 명시)
   1) 머지·Deploy to dothome  
   2) 종현이 운영에 `085` SQL 적용  
   3) 곧바로 SSH 또는 PC 해시 + SQL로 **자신의** 2차 비번 설정  
   4) 콘솔 잠금해제 확인  
   - 코드가 먼저 나가면 미설정 계정은 콘솔이 막힌다(의도된 fail-closed). 우회 env 스위치는 만들지 않음(운영 `.env` 변경 금지와 맞춤).
   - 이번 지시에서 운영 SQL·CLI는 실행하지 않음. 로컬 Docker에만 적용·검증.

## 종현 결정 (권장안대로 구현, 상수 한 곳에서 바꿀 수 있게)

| # | 항목 | 우동공과3 권장 | 이유 |
|---|---|---|---|
| A | 유휴 만료 | **30분 슬라이딩** | 사이트 세션은 7일이라, 콘솔만 짧게 잠그는 것이 핵심. 절대 상한은 두지 않음. |
| B | 5회 실패 후 잠금 | **15분**, 만료·성공 시 카운트 0 | 정본의 「약 10~15분」. 당일 차단은 공개 재설정이 없어 실수 시 운영이 멈춤. |
| C | 적용 대상 | **`admin_level`이 있는 모든 계정**(최고관리자·부마스터) | 세션 탈취 시 부마스터 API도 같이 막아야 함. 각자 자신의 2차 비번. |
| D | 비상코드(금고) | **이번엔 구현하지 않음** | SSH·DB 초기화면 충분. 코드 경로를 늘리지 않음. 비번은 비밀번호 관리앱에 보관. |
| E | 특수문자 집합 | `!@#$%^&*?` | CLI·SQL에서 따옴표·공백·백슬래시 사고를 줄임. |

## 필수
- 검증 스크립트 `scripts/verify-admin-console-password.php` (기존 `scripts/verify-*.php`의 `check()`/`PASS`/`FAIL` 형식). 로컬 Docker DB + 테스트 계정만.
  - 규칙 검사(짧은 비번, 대문자만, 특수문자 부족 등 거절).
  - 해시 저장 후 맞으면 해제, 틀리면 횟수 증가.
  - 해제 없이 `GET/POST /api/admin/members.php`(또는 `session.php` 외 기존 API) → 403 `console_unlock_required`.
  - 비로그인 → 401, 일반 회원 세션 → 403 `forbidden` (해제 메시지 아님).
  - 5회 실패 → `console_locked`, 6번째도 잠금 유지.
  - 잠금 만료 후 재시도 허용(테스트에서는 `locked_until`을 과거로 넣는 픽스처).
  - 로그아웃 후 같은 세션 쿠키로 관리자 API → 해제 무효.
  - 미설정 계정 → 403 `console_password_unset`, 웹 설정 경로 없음.
  - 변경 성공·기존 비번 틀리면 거절.
  - 로그·스크립트 출력에 평문·해시 없음(`grep`으로 확인).
- 기존 관리자 관련 verify 회귀: `scripts/verify-admin-registration-list.php`, `scripts/verify-admin-162-settlement.php`, `scripts/verify-member-mail-admin.php` 등 관리자 verify 전부 PASS.
- 로컬에서만 085 적용. 운영 DB·운영 `.env`·CSP 변경 없음.
- 스크린샷: `docs/worklog/2026/11/shots-363/` — 390·1280, 입력값 비가시. 게이트 / 실패(남은 횟수) / 잠금 / 해제 후 운영 홈 / (있으면) 변경 폼.

## 금지
- 웹 최초 설정 화면, 메일·SMS 재설정, 임시 우회 쿼리·헤더·env 스위치 추가 금지.
- `users.password_hash`·로그인 비번을 2차 비번으로 재사용 금지.
- 비밀번호·해시·세션 원문을 문서·커밋·채팅·로그·스크린샷·verify 출력에 남기지 않음.
- 운영 DB에 085 적용 금지, 운영 `.env`/CSP/`public/.htaccess` 변경 금지. SQL 초안만 추가.
- 개인정보 암호화 작업 금지(정본 선행 순서상 이 티켓 다음 단계, 이번 범위 밖).
- 기존 관리자 셸·메뉴·운영 홈을 1px라도 바꾸지 않음(새 게이트 화면만 추가).
## 공통 금지 (모든 지시서 공통 · 생략 불가)
- force push, `reset --hard`, `stash drop` 금지.
- 운영 `.env`·운영 DB 쓰기는 종현 승인 없이 금지 (SELECT 조회도 운영은 승인 후).
- 키·비밀번호·토큰·세션값을 문서·커밋·로그·보고에 쓰지 않음 (테스트 계정 비밀번호 포함).
- 데스크톱 레이아웃은 1px도 바뀌면 안 됨 (데스크톱이 대상인 지시서만 예외, 그때도 대상 화면 외 0px).
- 기본 카드는 가로형 유지.
- 프로모 잠금 손대지 않음: 배너 로고, 팝업 헤더 로고, `preview/home-ui/src/promo-video-config.js`, `preview/home-ui/src/right-rail.js`·`preview/home-ui/src/styles/home-right-rail.css`의 프로모 부분.
- 개인정보 암호화 작업 금지.
- 커밋까지만. push·PR·머지는 우동공과3 최종검수 후 종현 승인으로.
- 브랜치는 `D:\work\study114` 안에서 `work/<번호>-<slug>`로 생성 (main 최신 pull 후).
- 범위 밖에서 발견한 버그는 고치지 말고 보고서 「발견 목록」에만 적음.

## 확인 (셀프검수 방법)
1. 로컬 Docker DB에 085 적용 → CLI로 테스트 관리자 계정에 2차 비번 설정(평문 보고 금지).
2. 관리자 로그인 후 해제 없이 curl `GET /api/admin/members.php` → 403 `console_unlock_required`. `GET /api/admin/console-unlock.php` → 200, `unlocked: false`.
3. POST 잠금해제 성공 후 같은 members 요청 → 200. 일반 회원·비로그인 우회는 401/403.
4. 잘못된 비번 5회 → 잠금, 화면·API 메시지 확인. 잠금 중 올바른 비번도 거절.
5. 390·1280 스크린샷(게이트·실패·잠금·해제 후 홈). 셸·사이드바는 해제 후 화면에서 기존과 1px 차이 없는지 비교.
6. `rg`으로 커밋 대상에 비번 평문·`password_hash(` 결과 문자열이 없는지 확인.

### 셀프검수 체크리스트 (Cursor가 채움: PASS/FAIL + 근거)
| # | 항목 | 결과 | 근거(테스트 출력·스크린샷·curl) |
|---|---|---|---|
| 1 | `requireAdmin()` 한 곳에서 해제 강제, 예외는 unlock GET/POST뿐 | | 파일:줄, 19개 경로 대조 |
| 2 | 해제 없이 /api/admin/* → 403 `console_unlock_required` | | curl |
| 3 | 비로그인 401, 일반 회원 403 `forbidden` | | curl |
| 4 | 5회 실패 잠금, 만료 후 재시도, 쿠키 삭제로 카운트 리셋 안 됨 | | verify |
| 5 | 해시 `password_hash`/`password_verify`, `users.password_hash` 미사용 | | 파일:줄 |
| 6 | CLI stdin 설정, 웹 최초 설정 없음, 미설정 시 콘솔 차단 | | |
| 7 | 로그아웃 시 해제 플래그 소멸, 유휴 30분 만료 | | |
| 8 | 감사 로그 5종, 비번·해시 미기재 | | grep |
| 9 | 기존 must-change 게이트·로그인 비번 플로우 diff 최소(동작 유지) | | |
| 10 | 새 verify PASS, 기존 관리자 verify 전부 PASS | | 명령·건수 |
| 11 | 390·1280 샷, 입력값 비가시, 해제 후 셸 1px 변화 없음 | | shots-363/ |
| 12 | 운영 DB·.env·CSP 변경 0, 평문 비번 커밋 0 | | |
| 13 | 공통 금지 위반 없음 | | |

## 보고
변경 파일, 085 SQL 요지(컬럼만), 해제 검사 예외 목록, verify 결과, 스크린샷 경로, 운영 적용 순서(SQL → 비번 설정 → 콘솔 확인). ⚠ 종현 결정 A~E는 권장안 적용 여부를 한 줄로. 운영 적용·비번 설정은 종현이 머지 후 직접.
보고 문서: `docs/worklog/2026/11/2026-11-11-363-admin-console-2nd-password.md`
## 최종검수 패키지 (우동공과3에게 넘길 것)
보고 맨 끝에 아래 형식 그대로 붙인다.
```
[최종검수 패키지 — 363]
브랜치 / 커밋: work/363-admin-console-2nd-password / <hash>
변경 파일: (경로 목록, 파일별 +/- 줄 수: git diff --stat main...HEAD)
diff 요약: (파일별 1~2줄, 무엇을 왜)
테스트: (명령 → PASS n / FAIL n, 기존 회귀 포함)
스크린샷: (경로 목록, 폭 표기 1280·390)
API 확인: (curl 요청 → HTTP 상태, 응답 요지 — 비번·세션 원문 가림)
셀프검수 체크리스트: (아래 표 채운 것)
미해결·종현 결정 필요: (A 유휴 30분 / B 잠금 15분 / C 부마스터 포함 / D 비상코드 보류 / E 특수문자 집합 — 권장안과 다르면 명시)
```
