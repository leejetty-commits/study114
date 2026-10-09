# 2026-10-09 우동공과 편지 B단계 — 카드 게시 환영 · Prime/Pick 구매 감사 · 탈퇴 완료 메일

- 브랜치: `cursor/mail-lifecycle-20261009` (기준 `origin/main` `606a65e` + A단계 커밋 `d9fd4fd3`·`ad6cd7c7` 옮겨 옴)
- worktree: `d:\work\study114\.wt\mail-lifecycle`
- 작업: Cursor 메인 에이전트. 승인은 사용자만(커밋 hash 단위). 배포·main 병합은 사용자 승인 뒤.
- 앞 단계: `docs/worklog/2026/10/2026-10-09-auth-mail-warm.md` (가입 확인·비밀번호 재설정, 공통 틀 `MemberMailTemplate`)

## 1. 지시 원문

```text
(2026-10-09) 1번 기획해서 진행하고 보고하고, 스스로 검수까지 완벽해. 그 다음에 2번을 실행하고 추후 보고해.
(2026-10-09) 나에게 어떻게 작업을 하겠다 먼저 선보고를 하고 작업을 해야지.
(2026-10-09) 메일 작업(1번) 진행 계획 ===> 제안대로 순서대로 진행해. 검수까지 완벽하게 한후 보고해. 배포는 내 승인후에 한다.
```

선보고에서 제안하고 「제안대로」로 받은 결정:

| 항목 | 결정 |
|------|------|
| 보낼 메일 | 카드 게시 환영(공부방·과외쌤·학생) · Prime/Pick 구매 감사(공부방·과외쌤, 새로·연장) · 탈퇴 완료 |
| 중복 방지 | 새 SQL 없이 기존 `provider_reminder_dispatches`(032, `dedupe_key` UNIQUE) 재사용 |
| 탈퇴 사유 받기 | 이번에 안 함 — 별도 과제(화면·API·저장 표 필요) |
| 관리자 강제 탈퇴 | 메일 안 보냄 |
| 끄고 켜기 | 관리자 메뉴 대신 환경변수 `STUDY114_LIFECYCLE_MAIL` (기본 켜짐, `0`이면 끔) |
| 문안 | 2026-10-08 18:00 초안 기준. 실명 금지(공부방 이름만), 「공개」 대신 「노출」, 과외쌤에 「지도」 금지, Prime 3자리 상자는 공부방만, 구현 안 된 7일 뒤 편지 약속 삭제 |

## 2. 확인한 사실 (코드 근거)

- 기본등록 완료 = 카드 노출: 공부방 `StudyRoomBasicExposure::syncProfileStatus`(홍보지역 1 있으면 `published`), 과외쌤 `TutorBasicFields::syncProfileStatus`(필수 8개면 `published`), 학생 `students.exposure_status = 'published'`. `published_at`은 `COALESCE(published_at, NOW())` → **처음 노출된 시각**.
- 기본등록 저장은 세 역할 모두 `register*()` 안에서 커밋한 뒤 돌아온다(`BasicRegisterService.php` 공부방 469–470·597–599, 과외쌤 780–781·816–818, 학생 353·374·392).
- 결제: `ProviderCheckoutService::completeOrder` Prime·Pick(`product_kind = position`) 분기는 지급 후 커밋(`$paymentCommitted = true`) → 응답 payload. 이미 지급된 주문을 다시 부르면 앞쪽 `isFulfillmentSucceeded` 분기로 바로 돌아간다(메일 연결 안 함).
- 주문 스냅샷: 공부방 `prime_region{region_basis_type, region_id, complex_id}`, 과외쌤 `tutor_axis{city_label, subject_label}`.
- Prime 자리 수: `PrimeRegionScope::CAPACITY = 3`, 공부방 전용(과외쌤 유료 자리는 제한 없음 — 정본 72).
- 탈퇴: `AccountWithdrawService::withdraw` → `runPurge`(트랜잭션) → `purgeWithdrawnAccount`가 이메일을 `withdrawn.{id}.{hex}@users.study114.local`로 바꾸고 역할을 끈다 → **정리 전에 주소·역할을 잡아 둬야 한다**. 관리자 강제 탈퇴(`AdminMemberService`)는 `purgeWithdrawnAccount`를 직접 부른다.
- 탈퇴 후 카드 숨김: `src/Visibility/WithdrawnOwnerSql.php`. Prime·Pick 종료: `endActivePositionSubscriptions`(오늘 자).
- 마이페이지 메뉴: `/mypage/registrations` = 「내 등록」, `/mypage/plans` = 「구매이력」 (`preview/home-ui/src/mypage/router.js` 62–91). 쪽지 받기 설정 이름 = 「쪽지설정」 (`study-room-reg-copy.js` 74, `tutor-reg/router.js` 119).
- 받는 사람 조건: 가입완료 = `users.email_verified_at` (`EmailVerificationGate`). 내부 주소 판정 `AccountContactService::isInternalEmail`.

## 3. 설계

- `src/Mail/MemberLifecycleMailTemplate.php` — 문안. `cardPosted(role, ctx)`, `purchaseThanks(role, ctx)`, `withdrawn(role, ctx)`. 회원 입력값(공부방 이름)은 줄바꿈·제어문자 제거 + 40자 제한(제목 헤더 주입 방지), HTML은 공통 틀이 escape.
- `src/Mail/MemberMailTemplate.php` — 선택 항목 2개 추가: `highlight`(제목 + 목록, 버튼 위 역할색 상자 — Prime 3자리용), `notes_title`(회색 안내 상자 제목). 안 쓰면 A단계 출력과 같다.
- `src/Mail/MemberLifecycleMailer.php` — 발송 규칙.
  - 진입점: `afterBasicRegister`, `afterPositionPurchase`, `captureWithdrawSnapshot` + `sendWithdrawFarewell`. **어떤 예외도 밖으로 던지지 않는다**(결과 코드 `sent` / `skipped:*` / `failed` / `error`).
  - 중복 방지: 보내기 전에 `provider_reminder_dispatches`에 `INSERT IGNORE`로 자리를 잡고(1행 들어갔을 때만 발송), 발송 실패·예외면 그 행을 지운다. 표가 없으면 오류 → **안 보냄**.
  - 키: `lifecycle:card_posted:{역할}:{카드id}`, `lifecycle:purchase_thanks:{order_ref}`, `lifecycle:withdraw_farewell:{user_id}`. `channel = email`, `reminder_kind = lifecycle_*`.
  - 받는 사람: `status = active` + 이메일 확인 완료 + 내부 주소 아님.
  - 카드 게시: 그 카드가 본인 것 + 지금 `published` + 처음 노출된 지 24시간 이내(예전에 노출된 카드를 기본등록에서 다시 저장해도 환영 메일 안 감).
  - 구매 감사: `prime`/`pick` + 공부방/과외쌤 + 지급 성공(`fulfilled = true`)일 때만.
  - 탈퇴: 정리 전 주소·역할 확보 → 정리(커밋) → 발송. 정리가 실패하면 안 보냄.
- 연결(각각 try/catch로 감쌈 — 메일 문제로 등록·결제·탈퇴가 실패하지 않음):
  - `BasicRegisterService::register` 성공 뒤 `notifyCardPosted`
  - `ProviderCheckoutService::completeOrder` Prime·Pick 지급 커밋 뒤 `notifyPositionPurchase` (생성자 마지막에 선택 인자 `?MemberLifecycleMailer` 추가 — 기존 호출 호환)
  - `AccountWithdrawService::withdraw` (본인 탈퇴만)
- `config/auth.php` `lifecycle_mail_enabled` = `STUDY114_LIFECYCLE_MAIL` ≠ `'0'` (기본 켜짐).

## 4. 문안 (구현본)

공통: 제목 머리 `[우동공과]`, 역할 배지, 서명 「— 우동공과 드림」, 보내기 전용 바닥글 + 고객센터 1:1 문의 링크(A단계 공통 틀).

### 4-1. 카드 게시 환영 (버튼 「내 … 카드 보기」 → `/mypage/registrations`)

| 역할 | 제목 | 배지 |
|------|------|------|
| 공부방 | `[우동공과] {공부방 이름}, 오늘부터 우리 동네 지도에 올랐어요` (이름 없으면 「원장님의 공부방」) | 공부방 원장님 · 카드 게시 |
| 과외쌤 | `[우동공과] 과외쌤 선생님, 첫 수업의 문이 열렸어요` | 과외쌤 선생님 · 카드 게시 |
| 학생·학부모 | `[우동공과] 학생·학부모님, 공부 카드가 올라갔어요` | 학생·학부모님 · 카드 게시 |

- 공부방 본문: 「{이름}의 카드가 우동공과에 게시되었어요. 이제 근처 학부모님과 학생이 지도와 찾기에서 원장님의 공부방을 만나요.」 「좋은 수업은 이미 하고 계시니, 알리는 일은 저희가 함께할게요.」 / 안내 「첫인상을 한 단계 올리는 세 가지」: 대표 사진 · 수업 소개 · 쪽지설정 + 「카드 내용은 마이페이지 「내 등록」에서 언제든 고칠 수 있어요.」
- 과외쌤 본문: 「오늘부터 {과외 지역 단위, 예 서울특별시}의 학생과 학부모님이 선생님을 만날 수 있어요.」(지역 못 읽으면 생략) 「가르치는 일의 설렘, 처음 그대로 응원할게요.」 / 안내 「먼저 눈에 띄는 카드의 공통점」: 과목·학년 · 지역 · 쪽지설정. **「지도」 없음.**
- 학생 본문: 「이제 근처 과외쌤과 공부방이 카드를 보고 쪽지로 먼저 인사를 건넬 수 있어요.」 / 안내 「안심하세요」: 전화번호·상세 주소는 다른 회원에게 보이지 않음 · 대화는 쪽지로만 시작 · 「내 등록」에서 수정.

### 4-2. Prime·Pick 구매 감사 (버튼 「구매이력에서 확인하기」 → `/mypage/plans`)

| 경우 | 제목 |
|------|------|
| Prime 새로 | `[우동공과] {원장님/선생님}, Prime 자리에 오르셨어요. 진심으로 고맙습니다` |
| Pick 새로 | `[우동공과] {원장님/선생님}, 한 걸음 앞에 서셨어요. 고맙습니다` |
| 연장 | `[우동공과] {원장님/선생님}, {Prime/Pick} 기간을 이어 가 주셔서 고맙습니다` |

- 요약 줄: 「Prime 노출 1개월 · 2026년 10월 9일 ~ 2026년 11월 8일 · 50,000원 결제 완료」
- 공부방 Prime: 「Prime은 우리 동네의 가장 앞자리예요. 학부모님이 동네를 열었을 때 가장 먼저 만나는 얼굴, 이제 {공부방 이름}이에요.」 + **강조 상자 「Prime, 이 동네 단 3자리」**: 「{동 또는 단지 이름}에서 단 3곳만 앉을 수 있는 자리예요.」 「학부모님이 동네를 열면 가장 앞줄에서 먼저 만나요.」 「이용 기간이 끝날 때까지 그 자리는 원장님 몫이에요.」 (3 = `PrimeRegionScope::CAPACITY`를 검증 스크립트가 대조)
- 과외쌤 Prime: 「Prime은 {서울특별시 · 수학} 과외쌤 찾기에서 가장 앞쪽에 소개되는 자리예요.」 — 3자리 상자 없음.
- Pick: 「Pick은 학부모님이 「먼저 골라 보는」 자리예요. {과외: 지역 · 과목에서} 비슷한 카드들 사이에서 {공부방 이름의/선생님의} 카드가 한 걸음 앞에 서요.」
- 안내 「이 기간을 가장 빛나게 쓰는 법」: 대표 사진 최신으로 · 쪽지설정 확인 · 첫 문의 하루 안에 답장 · 「결제 내역은 마이페이지 「구매이력」에서 언제든 볼 수 있어요.」

### 4-3. 탈퇴 완료 (버튼 없음)

- 제목 `[우동공과] 그동안 우동공과와 함께해 주셔서 고맙습니다`, 배지 「{역할} · 탈퇴 완료」(역할 모르면 「탈퇴 완료」)
- 본문: 「그동안 고마웠어요.」 「{2026년 10월 9일 오후 8시 5분}에 탈퇴가 완료되었어요.」 「아이들의 공부가 계속되는 한, 우리 동네 어딘가에서 다시 만나길 바라요.」
- 안내 「정리된 내용」: 노출되던 카드는 다른 회원에게 안 보임 · 이용 중이던 Prime·Pick은 오늘 자로 끝남 · 같은 이메일로 새로 가입 가능(이전 기록은 되살릴 수 없음) · 「직접 탈퇴하지 않으셨다면, 같은 이메일로 다시 가입한 뒤 고객센터 1:1 문의로 바로 알려 주세요.」

## 5. 검증

| 검사 | 결과 |
|------|------|
| `php -d extension=pdo_sqlite scripts/verify-mail-lifecycle.php` (신규) | **446 통과 / 0 실패** — 문안 11변형, 금지어(승인·인증·할인·광고·공개·7일·로그인하기·데모 등), 버튼 주소, 이름 줄바꿈 제거·HTML escape, 발송 규칙(sqlite: 중복 차단·초안·남의 카드·3일 전 카드·미확인 이메일·내부 주소·스위치 끔·실패 시 기록 삭제·예외 격리·표 없으면 안 보냄·탈퇴 주소 확보 순서), 연결 지점(정적), 로그에 본문·주소 원문 없음 |
| `php -d extension=pdo_sqlite scripts/verify-auth-mail-warm.php` (A단계) | 423 / 0 — 공통 틀 확장 후에도 그대로 |
| `php -l` 변경·신규 PHP 8개 | 오류 없음 |
| `node scripts/verify-no-sample-data.mjs` | OK |
| `npm run verify:shop-page` | 통과 |
| `scripts/check-no-committed-secrets.sh` (Git Bash) | OK |
| 연결된 서비스 관련 node 검사: account-context · basic-exposure-gate · cur-006-email-verify-inventory · paid-pr-a(85) · paid-renewal(38) · tutor-region-unit(135) · tutor-signup-seed · hold-find-address | 모두 통과 |
| `vite-node`로: cur-006-post-verify-role · remove-publish(57) · tutor-basic-required(PHP 부분은 `-d extension=mbstring`) | 모두 통과 |
| 두 메일 검사를 mbstring 켠 상태(CI와 같음)로 다시 | 446 / 423 통과 |

미리보기(저장소 밖): `%TEMP%\study114-mail-preview\lifecycle-index.html` (+ `lifecycle-*.html` / `.txt`)

CI: `.github/workflows/cur-006-resend.yml`에 「Lifecycle mail」 단계 추가, `pdo_sqlite` 확장 명시, 변경 파일 경로 추가. `package.json` `verify:mail-lifecycle`.

미확인(운영 DB 없이 못 봄): 운영에 `provider_reminder_dispatches` 표가 있는지, 실제 Resend 발송·Gmail 표시.

## 6. 배포 전 사용자 할 일

1. **운영 phpMyAdmin에서 표 확인**: `SHOW TABLES LIKE 'provider_reminder_dispatches';` — 없으면 `sql/schema/032_provider_reminders.sql`의 그 표 부분 적용. 없으면 생활 메일은 **보내지지 않을 뿐** 등록·결제·탈퇴는 정상.
2. (선택) 메일을 잠시 끄려면 `.htaccess`에 `SetEnv STUDY114_LIFECYCLE_MAIL 0`. 기본은 켜짐이라 아무것도 안 하면 보낸다.
3. 새 SQL·Secrets 없음.

## 7. 남은 것 / 알려 둘 것

- **탈퇴한 사람의 연락 경로가 없음**: 고객센터 1:1 문의는 로그인 필요(`preview/home-ui/src/support/nav.js` 10), 공개 연락 메일은 자리표시 `support@udonggong.example`(`support-copy.js` 408). 그래서 탈퇴 메일은 「같은 이메일로 다시 가입한 뒤 1:1 문의」로 안내했다. 로그인 없이 받는 연락 주소를 정하면 문안을 바꾼다 — 사용자 결정.
- 카드 게시 메일은 **기본등록 경로만**. 마이페이지 수정으로 처음 노출되는 경우는 보내지 않는다(다음 과제 후보).
- 메일은 요청 처리 중에 바로 보낸다(가입 확인 메일과 같은 방식). Resend가 느리면 그만큼 응답이 늦어진다(최대 `resend_timeout` 20초).
- 7일 뒤 편지 · 만료 D-3 메일 · 탈퇴 사유 받기 · 관리자 화면 스위치: 이번 범위 밖.
- A단계 학생 가입 확인 메일에 「공개되지 않아요」가 남아 있다(정보 보호 뜻). 「공개→노출」 정리 질문과 같이 결정.

## 8. 커밋

| hash | 내용 |
|------|------|
| `d9fd4fd3` · `ad6cd7c7` | A단계(가입 확인·비밀번호 재설정) — 이 브랜치로 옮겨 옴 |
| `8ac48e3d` | B단계 코드·검증·CI·이 기록 |
| (이 커밋) | 이 기록에 hash 적기 |

승인 대기: 사용자 승인 전 main 병합·배포 없음.
