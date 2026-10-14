# 74 · 회원 메일 정본 — 종류 · 받는 사람 · 보내는 규칙 · 문안 규칙

- 상태: 1단계(첫 일주일 안부 · 마무리 3일 전) **main 반영·배포 2026-10-14** (승인 `c614cb11` → 병합 `2f448d30`). 2단계(관리자 「회원 메일」) **main 반영·배포 2026-10-14** (승인 `28082302` → main `3ad1fdf8`). 3단계(탈퇴 사유 받기 · SQL 080) **main 반영·배포 2026-10-14** (승인 `81510980` → main `c2f00c63`). **SQL 080 운영 적용 완료 2026-10-14 18:59**(사용자, phpMyAdmin — 두 표 확인). **2026-10-14 사용자 결정: 가입 확인·구매 감사만 보내고 나머지 생활 메일 4종은 멈춤, 깨우기 workflow 사용 안 함**(4-0)
- 근거: `docs/worklog/2026/10/2026-10-09-mail-lifecycle.md` (생활 메일 3종) · `docs/worklog/2026/10/2026-10-14-member-mail-4.md` (새 메일 4종 지시·승인 문구) · `2026-10-13-decisions-batch.md`
- 이 문서가 회원 메일 규칙의 정본이다. 메일 종류·조건·한도·문안 규칙을 바꾸면 **코드·검사·이 문서를 같은 커밋에서** 고친다.

## 1. 메일 종류

### 1-1. 계정 메일 — 끌 수 없음

| 메일 | 언제 | 코드 |
|------|------|------|
| 가입 확인 (재전송 포함) | 가입 직후 · 회원이 재전송을 누를 때 | `EmailVerificationService` · 문안 `EmailVerifyMailTemplate` |
| 비밀번호 재설정 | 회원이 요청할 때 | `PasswordResetService` · 문안 `PasswordResetMailTemplate` |

회원 안전을 위한 메일이라 생활 메일 스위치·하루 한도와 관계없이 나간다.

### 1-2. 생활 메일 — 스위치로 끌 수 있음

| 메일 | 언제 | 받는 사람 | 한 번만 (중복 방지 키) |
|------|------|-----------|------------------------|
| 카드 게시 환영 | 기본등록으로 카드가 노출 상태가 된 직후. 게시된 지 24시간이 지난 카드는 다시 저장해도 안 보냄 | 공부방 · 과외쌤 · 학생(학부모) | 카드마다 1회 `lifecycle:card_posted:{역할}:{카드 id}` |
| Prime·Pick 구매 감사 | 지급이 커밋된 직후(연장 포함) | 공부방 · 과외쌤 | 주문마다 1회 `lifecycle:purchase_thanks:{주문번호}` |
| **첫 일주일 안부** | 가입 **7일 이상 10일 미만**, 낮 시간 자동 발송(3절) | 대표 활성 역할이 회원 역할(공부방·과외쌤·학생)인 회원 | 회원마다 1회 `lifecycle:welcome_week:{회원 id}` |
| **Prime·Pick 마무리 3일 전** | 이용권의 `end_exclusive_on` = **오늘 + 3일** (마지막 이용일 = 오늘 + 2일), 낮 시간 자동 발송(3절) | 이용권 주인 | 이용권·끝나는 날마다 1회 `lifecycle:position_ending:{이용권 id}:{end_exclusive_on}` |
| 탈퇴 완료 (사유 받기 포함, 1-4) | 본인 탈퇴 직후. 관리자 강제 탈퇴는 안 보냄 | 탈퇴한 본인(정리 전에 잡아 둔 주소) | 회원마다 1회 `lifecycle:withdraw_farewell:{회원 id}` |

첫 일주일 안부 — 역할·카드 상태별
- 공부방·과외쌤, 노출 중 카드 있음 → 안부(공부방은 공부방 이름, 과외쌤은 과외 지역을 넣음. 지역을 못 읽으면 「근처」).
- 공부방·과외쌤, 카드가 초안뿐이거나 없음 → 「카드 한 장이면 우리 동네에 소개돼요」 등록 안내.
- 공부방·과외쌤, 노출 카드 없이 숨김 등 다른 상태 카드만 있음 → **안 보냄**.
- 학생·학부모 → 안부.

마무리 3일 전 — 조건
- 상품은 `prime` · `pick`만.
- 이용권의 카드가 **본인 카드이고 지금 노출 중일 때만** 보낸다(본문이 「끝나면 베이직으로 이어서 노출」을 약속하므로). `provider_id`가 비어 있는 옛 이용권은 본인 노출 카드 중 첫 번째.
- 연장하면 같은 이용권의 끝나는 날이 늦춰진다 → 새 끝나는 날 3일 전에 **다시 한 번** 안내한다(키에 끝나는 날이 들어감).

### 1-3. Prime·Pick 만료 안내 메일은 「마무리 3일 전」 하나뿐

- 옛 만료 안내 `ProviderReminderService`(끝나기 7·3·1일 전, `position_expiry_d7/d3/d1`)는 **문자·사이트 알림만** 보낸다(`ProviderReminderChannelPolicy`). 메일을 켜도 두 번 가지 않게 채널에서 메일을 뺐다(2026-10-14).
- 같은 서비스의 쪽지권 만료·잔여 안내는 채널에 메일이 남아 있지만 서비스 전체 메일이 꺼져 있다(`DisabledMailTransport`, `reminder_mail_excluded`).

### 1-4. 탈퇴 사유 받기 (SQL `080`)

결정(2026-10-14 사용자): **관리자는 누가 남긴 사유인지 본다.** 「관리자가 알게하고, 그에 맞춘 작업을 진행한다」 — 처음 초안의 「누가 남겼는지 알 수 없게」는 정본 근거 없이 메인이 넣은 것이라 걷어냈다. 회원 번호 보관 **1년**(사용자 선택). 근거·문구 승인: `docs/worklog/2026/10/2026-10-14-member-mail-4.md` §5-7·§5-8.

| 항목 | 규칙 | 코드 |
|------|------|------|
| 탈퇴 화면 | 마이페이지 탈퇴 확인 칸에 「떠나시는 이유를 알려 주시겠어요? (선택)」 + 「고르지 않아도 탈퇴할 수 있어요. 알려 주신 이유는 더 좋은 동네를 만드는 데만 써요.」 **고르지 않아도 탈퇴된다.** 모르는 선택지가 오면 고르지 않은 것으로 보고 탈퇴는 진행. 회원에게 「누가 남겼는지 알 수 없게」라고 약속하지 않는다 | `AccountWithdrawService::withdraw` · `preview/home-ui/src/withdraw-reason-ui.js` |
| 선택지 | 학생·학부모: 좋은 선생님을 찾았어요 / 원하는 선생님·공부방이 없었어요. 공부방: 원생이 충분히 모였어요 / 쪽지(문의)가 오지 않았어요 / 비용이 부담돼요. 과외쌤: 학생을 충분히 만났어요 / 쪽지(문의)가 오지 않았어요 / 비용이 부담돼요. 모두: 쓰기가 불편했어요 / 다른 서비스를 쓰기로 했어요 / 잠시 쉬어 가려고요 / 기타(한 줄) | 서버 `WithdrawReasonService::ROLE_CODES·COMMON_CODES` = 화면 `withdraw-reason-copy.js`(검사가 같은지 본다) |
| 기타 한 줄 | 「기타」일 때만 남긴다. 줄바꿈·제어문자 → 공백, **100자** | `normalizeAnswer` |
| 역할 | 탈퇴 정리(역할 끔) **전에** 대표 활성 역할을 읽는다. 회원 역할이 아니면 빈 값(관리자 모음에서 합계에만) | `MemberMailRole::lookup` |
| 순서 | 탈퇴 정리가 끝난 **뒤** 사유 저장 → 탈퇴 완료 메일. 저장이 실패해도 탈퇴는 끝난 상태 | |
| **회원 번호와 함께 저장** | 사유 표 `withdraw_reasons`: **탈퇴 회원 번호(`user_id`)** · 역할 · 선택지 · 기타 한 줄 · 경로(`withdraw` 탈퇴 화면 / `mail` 메일 링크) · 답한 날(KST). 이메일·연락처는 두지 않는다(탈퇴 때 지워짐). `users`와 외래 키를 걸지 않는다(회원 정리 SQL을 막지 않게) | `sql/schema/080_withdraw_reasons.sql` |
| **회원 번호 1년 보관** | 답한 날로부터 1년이 지나면(딱 1년인 날까지 남김, 다음 날 지움) 회원 번호만 `NULL`로 지운다. 사유·기타 한 줄은 남는다. 회원 메일 cron이 매시간 부른다(실패해도 메일은 보냄). 기한이 지난 메일 링크도 같이 지운다. **개인정보처리방침 「개인정보 보유 및 이용 기간」에 같은 내용**: 「다만 탈퇴할 때 직접 알려 주신 탈퇴 사유는 서비스 개선을 위해 회원 번호와 함께 1년 보관한 뒤 회원 번호를 지웁니다.」 — 기간을 바꾸면 `MEMBER_KEEP`·방침 문구·이 줄을 같이 고친다 | `WithdrawReasonService::MEMBER_KEEP` · `forgetExpired` · `public/api/cron/member-mail.php` · `preview/home-ui/src/policy-copy.js` |
| 메일 — 고른 경우 | 탈퇴 완료 메일에 「떠나시는 이유를 알려 주셔서 고마워요. 꼭 살펴볼게요.」 | `MemberLifecycleMailTemplate::withdrawn` `reason=given` |
| 메일 — 안 고른 경우 | 「혹시 떠나시는 이유를 알려 주실 수 있을까요? 하나만 골라 주시면 돼요. 로그인은 필요 없어요.」 + 버튼 「떠나는 이유 알려 주기」 + 안내 「30일 동안 한 번 쓸 수 있어요」 | `reason=ask` |
| 메일 링크 | `https://study114.net/#/support/leave-reason?t={64자}` — 고객센터 아래 공개 화면, 로그인 없음. **30일**, **한 번만**(저장과 같은 트랜잭션에서 링크 행을 지움). 선택지가 틀리면 링크를 쓰지 않는다 | `WithdrawReasonService::issueLink·peekLink·answerLink` |
| 링크 표 | `withdraw_reason_links`: 링크 값의 **sha256** · 탈퇴 회원 번호 · 역할 · 만료 시각. 원래 값은 메일에만 있다. 답하면 회원 번호·역할을 사유로 옮기고 링크 행을 지운다. 새 링크를 만들 때와 매시간 cron에서 지난 링크를 지운다 | |
| 링크를 만드는 때 | 탈퇴 완료 메일을 **실제로 보낼 때만**(메일 멈춤·받을 주소 없음·생활 메일 전체 꺼짐이면 안 만듦) | `MemberLifecycleMailer::sendWithdrawFarewell` |
| 링크 화면 | 「떠나시는 이유를 알려 주시겠어요?」 + 「하나만 골라 주시면 돼요. 알려 주신 이유는 더 좋은 동네를 만드는 데만 써요.」 보낸 뒤 「알려 주셔서 고마워요. 남겨 주신 한마디로 우리 동네를 더 좋게 만들게요.」 쓸 수 없는 링크(만료·이미 씀·형식 틀림)는 「이 링크는 이미 쓰였거나 30일이 지났어요. 알려 주시려던 마음만으로도 고마워요.」 | `preview/home-ui/src/support/leave-reason.js` |
| API | `GET/POST /api/auth/withdraw-reason.php` — 쓸 수 없는 링크도 **200**(`valid`/`saved` = false, 닷홈 4xx 본문 교체 대비). 선택지 틀림만 422. 링크 값이 글자가 아니면 빈 값으로 본다 | |
| 관리자 모음 | `#/admin/members/withdraw-reasons` 「회원관리 › 탈퇴 사유」(운영자 전원). 안내 「탈퇴한 회원 번호와 가린 이름으로 보여요. 이메일·연락처는 탈퇴 때 지워져 여기에도 없어요.」 최근 30일·90일·1년, 선택지 × 역할 수, 탈퇴 화면/메일 나눔. **알려 준 이유 목록**(기간 안 최근 100건): 답한 날 · 회원 번호 · 이름(탈퇴 때 「김○○」로 가린 `user_profiles` 이름) · 탈퇴일(`users.deleted_at`) · 역할 · 이유 · 한 줄 · 받은 곳. 회원 번호를 지웠거나 회원 행이 없으면 「—」. API `GET /api/admin/withdraw-reasons.php?days=` | `WithdrawReasonService::summary` · `preview/home-ui/src/admin/a28-withdraw-reasons.js` |
| SQL 080 적용 전 | 탈퇴·탈퇴 완료 메일은 그대로. 사유 저장·메일 링크는 조용히 건너뛰고(메일에 사유 문장 없음), 관리자 모음은 503 `schema_missing` | |

## 2. 받는 사람 (모든 생활 메일 공통)

- `users.status = 'active'`, `email_verified_at` 있음, 올바른 이메일 형식.
- 내부 주소 제외: `@users.study114.local`로 끝나는 주소(탈퇴 정리 주소 등), 앞부분이 `oauth_`로 시작하는 주소(이메일을 주지 않은 소셜 가입) — `AccountContactService::isInternalEmail()`.
- 실명으로 부르지 않는다. 호칭은 역할로(원장님 / 선생님 / 학생·학부모님) — `MemberMailRole`. 역할은 대표(`is_primary`) 활성 역할 기준.

## 3. 정해진 시각 메일 보내는 방식 (첫 일주일 안부 · 마무리 3일 전)

| 항목 | 값 | 코드 |
|------|----|------|
| 깨우기 | GitHub Actions `member-mail-cron.yml`가 **KST 9시 7분 ~ 20시 7분 매시간** `POST https://study114.net/api/cron/member-mail.php` | 닷홈에 cron이 없어서 GitHub가 깨운다. schedule은 **main에 있을 때만** 돈다 |
| 키 | 헤더 `X-Cron-Key` = `STUDY114_REPORT_CRON_KEY`(정산 보고서 키 재사용, GitHub Secret → 배포 때 `.htaccess` 주입). 주소(GET)로는 안 받음 | 키 없음·32자 미만·`__`로 시작·`dev-cron-key` → 503, 틀림 → 403 |
| 밤 | 21시 ~ 다음 날 9시에는 보내지 않음 | `MemberMailScheduler::SEND_FROM_HOUR / SEND_UNTIL_HOUR` |
| 순서 | 마무리 3일 전 먼저, 그다음 안부 | |
| 한 번에 | 최대 **30통** · **20초**. 남은 대상은 다음 시간 호출이 잇는다 | `BATCH` · `TIME_BUDGET_SECONDS` |
| 하루 한도 | 오늘(KST 0시부터) 나간 생활 메일(위 5종 모두)이 **60통**이 되면 정해진 시각 메일을 멈춘다. 다음 날 이어 보낸다 | `DAILY_CAP`. 계정 메일은 세지 않는다 |
| 후보 | 한 번에 종류별 최대 100명. 보낼 수 없는 회원(2절)은 **고를 때 SQL에서 뺀다** → 회원이 많아져도 받을 사람이 밀리지 않는다 | `CANDIDATE_LIMIT` · `mailableUserSql()` |
| 중복 | 이미 키가 있는 대상은 고를 때 빠지고, 보내기 직전에 `provider_reminder_dispatches.dedupe_key`(UNIQUE)에 먼저 자리를 잡는다 | `MemberLifecycleMailer::claim()` |
| 실패 | 보내기에 실패하면 자리를 지워 다음 호출이 다시 시도한다 | |
| 놓친 날 | 안부는 7~10일 사이 3일 동안 기회가 있다. 마무리 3일 전은 **그날 하루**만 대상이다(하루 12번 호출 중 한 번이라도 돌면 나간다) | |

Resend 무료 요금제(하루 100통): 생활 메일 60통 + 가입 확인·비밀번호 메일 몫 40통. 유료로 바꾸면 `DAILY_CAP`만 올린다.

생활 메일 중 카드 게시 환영·구매 감사·탈퇴 완료는 일이 일어난 그 자리에서 바로 보낸다. 하루 한도로 막지 않고, 실패해도 등록·결제·탈퇴는 그대로 진행된다(예외를 밖으로 던지지 않음).

## 4. 켜고 끄기

- 생활 메일 전체 스위치: 환경변수 `STUDY114_LIFECYCLE_MAIL` — 설정이 없으면 **켜짐**, `0`이면 5종 모두 끔(`config/auth.php` `lifecycle_mail_enabled`). 사용자가 따로 켤 것은 없다.
- 계정 메일(1-1)은 끌 수 없다.
- 전체 스위치가 꺼져 있으면 종류별 스위치를 켜 두어도 나가지 않는다(관리자 화면에 경고가 뜬다).

### 4-0. 지금 운영 상태 — 가입·결제 때 1회만 (2026-10-14 사용자 결정)

> 이걸 회원가입시와 유료결재시에만 보내는 걸로 일단 하고, 나머지는 그 기능을 꺼 두어라. 알고리즘은 그대로 두고. / 1회만 보낸다.
> (복명복창 뒤 선택) 결제 메일 = 결제(주문)할 때마다 1통 — 연장 결제 때도 1통(지금 방식) / 진행

| 메일 | 상태 | 어떻게 |
|------|------|--------|
| 가입 확인(1-1) | **보냄** — 가입 때 1회(회원이 재전송을 누르면 다시) | 계정 메일, 끌 수 없음 |
| 비밀번호 재설정(1-1) | 보냄 — 회원이 요청할 때만 | 계정 메일, 끌 수 없음 |
| Prime·Pick 구매 감사 | **보냄** — 결제(주문)마다 1통, 연장 포함 | 스위치 켜 둠 |
| 카드 게시 환영 | **멈춤** | 4-1 스위치 「멈추기」(최고관리자) |
| 첫 일주일 안부 | **멈춤** | 4-1 스위치 + 깨우기 끔 |
| 이용 마무리 3일 전 | **멈춤** | 4-1 스위치 + 깨우기 끔 |
| 탈퇴 완료(사유 받기 링크 포함) | **멈춤** — 탈퇴 화면에서 사유 고르기·관리자 「탈퇴 사유」는 그대로 | 4-1 스위치 「멈추기」 |

- 코드·대상 고르기·문안은 **그대로 둔다**(알고리즘 유지). 다시 쓰려면 4-1 스위치를 켜고, 안부·마무리는 깨우기도 다시 켠다.
- 깨우기: GitHub `member-mail-cron` workflow를 **사용 안 함**으로 돌림(2026-10-14 19:5x, `gh workflow disable member-mail-cron.yml` → `disabled_manually`). 다시 켜기: Actions 화면에서 Enable 또는 `gh workflow enable member-mail-cron.yml`. 파일(3절 깨우기)은 그대로라 켜면 바로 그 일정으로 돈다.
- 스위치 값은 운영 DB(`site_settings.member_mail`)에 있다 — 이 문서는 결정을 적고, 실제로 멈췄는지는 관리자 화면에서 본다.
- 다시 켤 때 몰아 보내지 않는 규칙(4-1 「다시 켤 때」)은 그대로 적용된다.

### 4-1. 종류별 스위치 — 관리자 「알림·문자 › 회원 메일」

| 항목 | 규칙 | 코드 |
|------|------|------|
| 위치 | 관리자 `#/admin/notify/member-mail` — 「알림·문자」 메뉴 맨 위. 연습용(미리보기) 화면이 아닌 실제 화면 | `preview/home-ui/src/admin/a28-member-mail.js` |
| 대상 | 생활 메일 5종(1-2) 각각. 계정 메일은 목록에 없다 | `MemberMailSettings::KINDS` |
| 저장 | `site_settings` 한 행 `setting_key = 'member_mail'`, `value_json.kinds.{종류} = {enabled, enabled_at, changed_at, changed_by}`(시각은 KST). **저장한 적 없는 종류는 켜짐** | `src/Mail/MemberMailSettings.php` |
| 테이블 없음 | `site_settings`(SQL `070`)가 없으면 모두 켜짐으로 읽고, 켜고 끄기 저장은 503 `schema_missing` | |
| 누가 | 보기·미리보기·시험 발송 = 운영자 전원. **켜고 끄기 = 최고관리자만**(부관리자는 버튼이 잠기고 서버도 403) | `AdminApi::requireMaster` |
| 멈출 때 | 확인 창을 띄운다. 다시 켤 때는 바로 켠다 | |
| 운영 로그 | 상태가 실제로 바뀔 때만 `admin_operation_logs`에 `member_mail_toggle` 한 줄(같은 상태로 다시 누르면 안 남김) | `MemberMailAdminService::setEnabled` |
| 멈춘 동안 — 바로 보내는 메일 | 카드 게시 환영·구매 감사·탈퇴 완료는 보내지 않고 발송 기록도 남기지 않는다. **다시 켜도 그때 일을 뒤늦게 보내지 않는다** | `MemberLifecycleMailer::guard()` → `skipped:paused` |
| 멈춘 동안 — 정해진 시각 메일 | 멈춘 종류는 대상을 고르지 않는다. 둘 다 멈추면 자동 작업이 `paused`로 끝난다 | `MemberMailScheduler::run()` |
| 다시 켤 때 — 첫 일주일 안부 | 다시 켠 시각 `enabled_at`을 남기고, **가입 7일째가 그 시각 뒤에 된 회원만** 고른다 → 멈춘 동안 쌓인 회원에게 몰아서 보내지 않는다 | `welcomeCandidates(..., enabledSince)` |
| 다시 켤 때 — 마무리 3일 전 | 원래 「그날 하루」만 대상이라 따로 막지 않는다(다시 켠 날 대상만 나간다) | |
| 최근 7일 보낸 수 | 지금부터 7일(168시간) 안에 `provider_reminder_dispatches`에 남은 **메일** 발송 기록 수(종류별) | `MemberMailAdminService::sentLast7Days` |

### 4-2. 미리보기 · 내 메일로 시험 발송

- 미리보기·시험 발송은 **실제 문안 함수를 견본 값으로** 부른다(해솔공부방 · 경기도 수원시 · 역삼동 · 50,000원 · 오늘 기준 날짜). 회원 정보를 읽지 않는다.
- 견본(종류별, 첫 번째가 기본): 카드 게시 환영 = 공부방·과외쌤·학생 / 구매 감사 = 공부방·과외쌤 × Prime·Pick / 첫 일주일 안부 = 공부방·과외쌤·학생·카드 없는 공부방 / 마무리 3일 전 = 공부방·과외쌤 × Prime·Pick / 탈퇴 완료 = 공부방·과외쌤·학생(사유 받기 링크) · 탈퇴할 때 이유를 고른 회원 — 모두 19개(`MemberMailAdminService::VARIANTS`). 탈퇴 완료 견본의 링크 값은 `sample`이라 열면 「쓸 수 없는 링크」로 보인다.
- 미리보기 본문은 스크립트를 막은 iframe(`sandbox=""`)에 그린다.
- 시험 발송은 **로그인한 운영자 계정 이메일로만** 보낸다(주소를 입력받지 않음). 내부 주소(2절)면 보내지 않는다. 시험 발송 버튼은 종류의 기본 견본을 보낸다.
- 제목 앞에 `[시험] `을 붙인다. 회원 발송 기록(`provider_reminder_dispatches`)·하루 한도(3절)에 넣지 않는다. 멈춘 종류도 시험 발송은 된다.
- 운영자 한 명당 **하루(KST) 10번**. 넘으면 429 `test_limit`. 성공한 발송만 `admin_operation_logs`의 `member_mail_test`로 세고, 실패하면(502 `send_failed`) 세지 않는다.
- 닷홈은 4xx 응답 본문을 자기 오류 페이지로 바꾼다 → 화면은 상태 코드(403·429·503)로도 안내 문구를 고른다.

### 4-3. API

`/api/admin/member-mail.php` (관리자 로그인 필요)

| 요청 | 하는 일 |
|------|---------|
| `GET` | 종류별 상태·바꾼 시각·바꾼 사람·최근 7일 보낸 수·견본 목록, 전체 스위치 상태, 수정 가능 여부, 하루 한도, 오늘 남은 시험 발송 수 |
| `PATCH {kind, enabled}` | 켜고 끄기(최고관리자). `enabled`는 true/false만 |
| `POST {action: "preview", kind, variant}` | 미리보기 제목·본문 |
| `POST {action: "test", kind, variant}` | 내 메일로 시험 발송 |

## 5. 문안 규칙

- 제목 머리 `[우동공과]`, 역할 배지, 해요체, 서명 「— 우동공과 드림」, 보내기 전용 바닥글 + 고객센터 1:1 문의 링크(`MemberMailTemplate` 공통 틀).
- 실명 금지(공부방은 공부방 이름만).
- 「공개」 대신 「노출」.
- 과외쌤 메일에 「지도」 금지. 과외쌤 Prime 자리는 「과외쌤 찾기 가장 앞자리」(과외쌤 Prime은 시 단위 노출이라 「우리 동네」를 쓰지 않음 — 2026-10-14 사용자 승인). 공부방 Prime은 「우리 동네 가장 앞자리」, Pick은 「학부모님이 먼저 골라 보는 자리」.
- **광고 효과를 숫자로 보여 주지 않는다**(조회 수·찜 수·쪽지 수 등). 적게 나오면 약점이 드러난다.
- **부정적인 말 금지**(「조용한」「만날 수 없어요」 등). 지금 어디서 소개되는지, 끝나도 잃는 것이 없다는 것만 밝게.
- **재촉·권유 금지**(「곧 자리가 다른 공부방에 열려요」 등). 광고성 메일이 되면 수신 동의·「(광고)」 표기가 필요하다.
- 받침에 맞춰 「을/를」(`MemberLifecycleMailTemplate::objectParticle()`). 한글·숫자로 끝나지 않으면 「을(를)」.
- 승인된 문구 원문: `docs/worklog/2026/10/2026-10-14-member-mail-4.md` 4절 · `2026-10-09-mail-lifecycle.md`.

## 6. 시간대

- 날짜·시각 판단은 모두 KST(`PositionPeriodCalculator::timezone()`).
- `users.created_at`은 DB 기본값으로 들어간다. 이용권 계산(`CURDATE()`)과 같이 운영 DB 시각 = KST를 전제로 한다.
- 발송 기록 `provider_reminder_dispatches.sent_at`은 PHP에서 KST로 직접 넣는다(하루 한도 계산이 DB 시간대에 흔들리지 않게).

## 7. 코드 · 검사

| 무엇 | 파일 |
|------|------|
| 생활 메일 발송·조건·중복 | `src/Mail/MemberLifecycleMailer.php` |
| 생활 메일 문안 | `src/Mail/MemberLifecycleMailTemplate.php` (공통 틀 `src/Mail/MemberMailTemplate.php`) |
| 정해진 시각 메일 고르기·나눠 보내기·한도 | `src/Mail/MemberMailScheduler.php` |
| 자동 작업 주소 (탈퇴 사유 회원 번호 1년 정리 포함) | `public/api/cron/member-mail.php` |
| 깨우기 | `.github/workflows/member-mail-cron.yml` |
| 옛 만료 안내 채널 | `src/Paid/ProviderReminderChannelPolicy.php` |
| 종류별 켜고 끄기 저장 | `src/Mail/MemberMailSettings.php` |
| 관리자 보기·미리보기·시험 발송·운영 로그 | `src/Mail/MemberMailAdminService.php` · API `public/api/admin/member-mail.php` |
| 관리자 화면 | `preview/home-ui/src/admin/a28-member-mail.js` · 문구 `a28-member-mail-copy.js` · 호출 `a28-member-mail-api.js` · `styles/admin-member-mail.css` |
| 검사 — 생활 메일 3종 | `php -d extension=pdo_sqlite scripts/verify-mail-lifecycle.php` |
| 검사 — 정해진 시각 메일·한도·이 문서 | `php -d extension=pdo_sqlite scripts/verify-member-mail-schedule.php` (`npm run verify:member-mail-schedule`) |
| 탈퇴 사유 저장·메일 링크·관리자 모음·1년 정리 | `src/Auth/WithdrawReasonService.php` · SQL `sql/schema/080_withdraw_reasons.sql` · API `public/api/auth/withdraw-reason.php`(링크 화면) · `public/api/admin/withdraw-reasons.php`(관리자) · 개인정보처리방침 `preview/home-ui/src/policy-copy.js` |
| 탈퇴 사유 화면 | 문구·선택지 `preview/home-ui/src/withdraw-reason-copy.js` · 선택 칸 `withdraw-reason-ui.js` · 마이페이지 탈퇴 칸 `mypage/screens.js` · 링크 화면 `support/leave-reason.js` · 관리자 `admin/a28-withdraw-reasons.js` |
| 검사 — 종류별 스위치·미리보기·시험 발송·관리자 화면 | `php -d extension=pdo_sqlite scripts/verify-member-mail-admin.php` (`npm run verify:member-mail-admin`) |
| 검사 — 탈퇴 사유 | `php -d extension=pdo_sqlite scripts/verify-withdraw-reason.php` (`npm run verify:withdraw-reason`) |
| 검사 — 계정 메일 | `php scripts/verify-auth-mail-warm.php` |

다섯 검사는 CI `cur-006-resend.yml`(main 대상 PR, `src/Mail/**` 등 변경 시)에서 돈다.

## 8. 남은 일

- SQL `080` — **운영 적용 완료 2026-10-14 18:59** (사용자, phpMyAdmin. 파일은 사용자 DB 작업 폴더 `d:\work\study114\sql\schema\080_withdraw_reasons.sql` = main 원본 복사. 회원 번호 칸이 들어간 17시 판. `SHOW TABLES`로 두 표 확인). 코드 배포는 main `c2f00c63`(같은 날 17:30) — 그 사이 탈퇴한 회원은 없었다(사용자 확인). 19:06 cron 응답의 `withdraw_reasons`가 null이 아니어서 운영 코드가 표를 읽는 것도 확인. **DB에 SQL을 돌리기 전에 사용자에게 미리 알린다**(2026-10-14 지시).
- 보류(2026-10-14, 4-0 결정으로): 아래 예약 실행 누락 대책(매시 17·43분 + 마무리 2일 전 따라잡기)은 브랜치 `cursor/member-mail-cron-catchup-20261014` 커밋 `00a3fed0`에 구현해 두고 main에 넣지 않았다. 안부·마무리를 다시 켤 때 함께 검토한다.
- (조사 기록) GitHub 예약 실행은 부하 때 **버려질 수 있다**. 2026-10-14 실제로 9:07~19:07 11번 칸 중 2번만 실행(13:46 · 19:06 KST). 첫 일주일 안부는 7~10일 범위라 따라잡지만, **마무리 3일 전은 `end_exclusive_on = 오늘 + 3일` 그날 낮에 한 번도 안 돌면 그 회원은 못 받는다**(`member-mail-cron.yml` 주석 「GitHub가 늦거나 건너뛰어도 다음 호출이 이어 보낸다」는 이 메일에는 그날 안에서만 맞다). 같은 이유로 3절 하루 한도 「다음 날 이어 보낸다」도 마무리 3일 전에는 맞지 않는다 — 그날 60통이 차면 남은 대상은 다음 날 대상이 아니다. 대책 후보·조사 근거는 작업 기록 `2026-10-14-member-mail-4.md` 5-12.
- 별건(미결): `public/api/cron/paid-reminders.php` 키 기본값 `dev-cron-key` 위험(그록봇 204·205).
