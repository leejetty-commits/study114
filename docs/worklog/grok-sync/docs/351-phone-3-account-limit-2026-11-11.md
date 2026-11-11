# 351 같은 휴대폰 번호로 가입 최대 3계정 제한 (2026-11-11)

- 작성: 우동공과3 · 실행·1차 셀프검수: Cursor · 최종검수: 우동공과3
- 브랜치: `work/351-phone-3-account-limit`
- 선행: **357 완료 후** (`TestAccountAllowlist`·`STUDY114_TEST_ACCOUNT_EMAILS`가 main에 있을 것)

## 대상
가입·연락처 저장 시 휴대폰 번호 검증 서버 코드.
- `src/Auth/SignupService.php` — `register()` 38~42줄(phone 정규화), `ensureEmailAvailable()` 133줄 근처 패턴 참고
- `src/Auth/AccountContactService.php` — `save()` 44~78줄, `upsertPhone()` 152줄 (OAuth 가입 후 연락처 입력·번호 변경 경로)
- `src/Auth/PhoneVerificationService.php` — `sendOtp()` 52줄, `verifyOtp()` 112줄 (OTP 단계에서 미리 막을지 판단용)
- `src/Auth/PhoneNormalizer.php` — `digits()` 정규화 재사용
- 엔드포인트: `public/api/auth/signup.php`, `public/api/auth/account-contact.php`, `public/api/auth/phone/send-otp.php`
- 참고: 탈퇴 시 `src/Auth/AccountWithdrawService.php` 236~243줄이 `user_profiles.phone`을 비움

## 범위
1. 서버 한 곳에 판정 함수 신설: 예) `src/Auth/PhoneAccountLimit.php` — `countActiveAccounts(PDO, string $phoneDigits, ?int $excludeUserId): int`, 상수 `MAX_ACCOUNTS_PER_PHONE = 3`.
   - 셈: `user_profiles.phone = ?`(digits 정규화) AND `users.status <> 'withdrawn'`. 자기 자신(번호 변경 시)은 제외.
   - **테스트 계정 허용목록 제외 (357·358과 동일 env):** `STUDY114_TEST_ACCOUNT_EMAILS`의 정확한 이메일 계정은
     (a) **3개 카운트에 넣지 않고**, (b) **가입·연락처·OTP 차단에서도 제외**한다.
     판정은 `Study114\Auth\TestAccountAllowlist`(357)만 사용. 새 env 이름을 만들지 않는다.
2. 적용 지점 (모두 같은 함수 호출):
   - `SignupService::register()` — insert 전에 검사. 이미 3개면 거절. (가입 이메일이 허용목록이면 제한 검사 스킵)
   - `AccountContactService::save()` — 새 번호 저장 전 검사 (자기 계정 제외 · 허용목록 계정 스킵).
   - `PhoneVerificationService::sendOtp()` — OTP 보내기 전에 검사해 문자 비용 낭비 방지 (판정 결과만, 문자 미발송 · 허용목록 스킵).
3. 사용자 문구 (그대로 사용):
   「이 휴대폰 번호로는 이미 3개의 계정이 가입되어 있어요. 한 번호로는 최대 3개 계정까지 만들 수 있어요. 기존 계정으로 로그인하시거나, 아이디가 기억나지 않으시면 아이디 찾기를 이용해 주세요.」
   - 응답: HTTP 409(또는 기존 가입 오류와 같은 규칙의 422 — 현행 규칙을 따르고 보고), 코드 `phone_account_limit`.
   - 프론트는 기존 오류 표시 경로로 문구만 보여줌 (새 UI 금지).
4. 동시성: 같은 번호로 동시에 가입 요청 2건 → 트랜잭션 안에서 `SELECT ... FOR UPDATE` 또는 동등 방식으로 4번째 생성 방지. 방식과 한계 보고.

## 탈퇴 계정 정책 — ⚠ 종현 확인 필요
- **우동공과3 권장: 탈퇴 계정은 세지 않는다.** 이유: 탈퇴 시 번호가 이미 지워지고(`AccountWithdrawService.php:237`), 정상 재가입을 막지 않기 위해.
- 악용(탈퇴→재가입 반복) 우려가 있으면 별도 티켓으로 「탈퇴 후 N일 재가입 제한」을 검토 (이번 범위 아님).
- Cursor는 권장안대로 구현하되, 상수/분기 한 곳에서 바꿀 수 있게 둔다.

## 필수
- 회귀 테스트 스크립트 추가: `scripts/verify-phone-account-limit.php` (기존 `scripts/verify-*.php` 형식). 케이스: 0·1·2개 → 가입 성공, 3개 → 거절, 탈퇴 1개 포함 3개 → 성공(권장안), 번호 변경 시 자기 제외, OTP 단계 거절, 다른 번호 형식(010-1234-5678 / 01012345678) 동일 취급.
- 기존 가입 관련 verify 전부 통과 (`npm run verify:auth-mail-warm` 등 가입 경로를 건드리는 스크립트 목록을 찾아 실행).
- 로컬 DB에서만 실험. 운영 DB 조회 금지.

## 금지
- 운영 DB에 인덱스·컬럼 추가 금지 (필요하면 `sql/schema/085_*.sql` 초안만 만들고 적용 금지, 보고에 「종현 승인 필요」 표시).
- 휴대폰 번호 원문을 로그에 남기지 않음 (마스킹 `PhoneVerificationService::maskPhone` 사용).
- 가입 화면 레이아웃 변경 금지.
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
1. 로컬에서 같은 번호로 계정 3개 생성 → 4번째 가입 시도 → 문구·HTTP 상태 캡처.
2. curl로 `POST /api/auth/signup.php` 4번째 호출 결과(HTTP 상태, `code`) 기록. 비밀번호는 보고에서 `***`로 가림.
3. 390·1920 폭 가입 화면에서 오류 문구 노출 스크린샷 (레이아웃 변화 없음 확인).
4. 탈퇴 계정 포함 케이스, 번호 변경 케이스 결과 기록.

### 셀프검수 체크리스트 (Cursor가 채움: PASS/FAIL + 근거)
| # | 항목 | 결과 | 근거(테스트 출력·스크린샷·curl) |
|---|---|---|---|
| 1 | 판정 함수 1곳, 3개 지점이 모두 그 함수 호출 | | 파일:줄 |
| 2 | 4번째 가입 거절, 문구 원문 일치 | | |
| 3 | OTP 단계에서 문자 미발송으로 거절 | | |
| 4 | 탈퇴 계정 미산정(권장안) | | |
| 5 | 번호 변경 시 자기 계정 제외 | | |
| 6 | 동시 요청 4번째 생성 안 됨 | | |
| 7 | 신규 verify PASS 수 / 기존 verify 전부 PASS | | |
| 8 | 번호 원문 로그 없음 | | grep 결과 |
| 9 | 1920 레이아웃 0px 변화 | | 스크린샷 비교 |
| 10 | 공통 금지 위반 없음 | | |

## 보고
짧게: 변경 파일, 응답 코드 결정, 동시성 방식, 체크리스트, 종현 확인 필요 항목(탈퇴 정책).
## 최종검수 패키지 (우동공과3에게 넘길 것)
보고 맨 끝에 아래 형식 그대로 붙인다.
```
[최종검수 패키지 — <번호>]
브랜치 / 커밋: work/<번호>-<slug> / <hash>
변경 파일: (경로 목록, 파일별 +/- 줄 수: git diff --stat main...HEAD)
diff 요약: (파일별 1~2줄, 무엇을 왜)
테스트: (명령 → PASS n / FAIL n, 기존 회귀 포함)
스크린샷: (경로 목록, 폭 표기 1920·390 등)
API 확인: (curl 요청 → HTTP 상태, 응답 요지)
셀프검수 체크리스트: (아래 표 채운 것)
미해결·종현 결정 필요: (없으면 「없음」)
```
