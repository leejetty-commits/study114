# B2·B3 · 「한 번호 3계정」·「이메일 별칭 가입 금지」 구현 상태 (2026-11-14)

- 작성: 우동공과3 · 기준: origin/main `efc881f7` · 읽기 전용 확인
- 결론: **둘 다 main에 들어가 있다(11-11 작업 351·358).** 새 코딩 지시서는 필요 없다. 다만 운영 화면에서는 거절 문구가 안 보인다(H3 때문). H3를 고치면 같이 해결된다.

## B2 · 한 휴대폰 번호로 최대 3계정 — 구현됨
- 규칙: `src/Auth/PhoneAccountLimit.php:15` `MAX_ACCOUNTS_PER_PHONE = 3`, `:21` 탈퇴 계정은 세지 않음, `:42-59` 테스트 허용목록 이메일은 세지 않음.
- 적용 위치:
  - 일반 가입 `src/Auth/SignupService.php:93` (가입 트랜잭션 안, FOR UPDATE)
  - 소셜 가입 후 연락처 저장 `src/Auth/AccountContactService.php:62`
  - 문자 인증번호 보내기 전 `src/Auth/PhoneVerificationService.php:86`
  - API 응답 `public/api/auth/signup.php:71-77`, `public/api/auth/account-contact.php:76-78` → 422 `phone_account_limit`
- 거절 문구(`PhoneAccountLimit.php:25`): 「이 휴대폰 번호로는 이미 3개의 계정이 가입되어 있어요. …」
- 기록: `docs/worklog/2026/11/2026-11-11-351-phone-3-account-limit.md`, 지시서 `docs/worklog/grok-sync/docs/351-phone-3-account-limit-2026-11-11.md`

## B3 · 이메일 별칭 가입 금지 — Gmail만 구현됨 (결정대로)
- 규칙: `src/Auth/EmailNormalizer.php:20-41` Gmail(`gmail.com`·`googlemail.com`)만 `+뒤` 제거·점 제거·도메인 통일. 다른 도메인은 소문자·공백 제거만.
- 중복 검사: `src/Auth/GmailAliasAvailability.php:25-60` (탈퇴 계정 제외, 테스트 허용목록 제외, 스키마 변경 없이 SQL 비교)
- 적용 위치: 일반 가입 `SignupService.php:91`, 소셜 `OAuthService.php:418`, 연락처 저장 `AccountContactService.php:84`
- 거절 문구(`GmailAliasAvailability.php:17`): 「이미 가입된 이메일과 같은 Gmail 주소예요. …」
- 358 지시서의 결정: 「네이버·다음 등 + 별칭 처리 여부는 종현 확인 필요, 권장: 이번엔 Gmail만」 → Gmail만 구현됨.

## 운영에서 보이는지 (중요)
- 운영 `POST /api/auth/signup.php` 오류 응답은 **422 text/html**(닷홈이 JSON을 HTML로 바꿈, 2026-11-14 확인).
- 그래서 4번째 가입이나 Gmail 별칭 가입은 **막히기는 하지만**, 화면에는 위 문구 대신 「입력값을 확인해 주세요.」(`preview/auth-ui/src/auth-api.js:48-53` 기본 문구)만 나온다.
- 해결: H3 지시서(`sec-H3-api-error-soft200-2026-11-14.md`)에 `signup.php`·`account-contact.php`·`auth-api.js`를 넣어 두었다.

## 남은 빈틈 (종현 결정 · 코딩 지시 아님)
- Q1. 가입 때 휴대폰은 번호 모양만 본다(`SignupService.php:38-42`). 문자 인증(OTP)이나 본인확인이 가입 필수가 아니어서, 남의 번호나 지어낸 번호로 3계정 제한을 피할 수 있다. 반대로 남이 내 번호로 3개를 먼저 만들면 나는 가입이 막힌다. → 본인확인(088, `work/365-identity-design`, 미병합) 도입 때 같이 정할 일.
- Q2. 네이버·다음·아웃룩 등 다른 메일의 `+` 별칭도 막을지. 지금은 Gmail만. (네이버는 `+` 별칭을 지원하지 않는 것으로 알려져 있어 실제 위험은 Gmail·아웃룩 쪽이 크다 — 확인 필요.)
- Q3. 일회용 메일(10분 메일 등) 도메인 차단. 지금은 관리자 설정 `bannedEmails`(가입에서만 사용, `SignupService.php:32`)에 손으로 넣는 방법만 있다.
- Q4. 운영 GitHub Secret `STUDY114_TEST_ACCOUNT_EMAILS`가 들어가 있는지(비어 있어도 배포는 됨, `deploy.yml:118,191-196`). 비어 있으면 테스트 계정도 3계정·별칭 제한을 받는다.
