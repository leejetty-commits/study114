# 351 — 같은 휴대폰 번호 가입 최대 3계정

**브랜치:** `work/351-phone-3-account-limit` (기반: 357 `565ed4c2` — `TestAccountAllowlist` 필요)  
**일시:** 2026-11-11  
**작업 폴더:** `D:\work\study114\.wt\work-351-phone-3-account-limit`

## 지시 요점

- 같은 번호 활성 계정 최대 3 · 탈퇴는 세지 않음 · 허용목록은 카운트·차단 제외
- 적용: Signup / AccountContact / sendOtp (문자 전)
- 커밋만 · push는 승인 후

---

## 구현

| 파일 | 역할 |
|------|------|
| `src/Auth/PhoneAccountLimit.php` | `countActiveAccounts` · `assertUnderLimit` · `MAX=3` · `COUNT_WITHDRAWN=false` |
| `src/Auth/PhoneAccountLimitException.php` | 문구·`phone_account_limit` |
| `SignupService::register` | insert 전 assert (`FOR UPDATE`, 허용목록 이메일 스킵) |
| `AccountContactService::save` | upsert 전 assert (자기 제외 · 허용목록 스킵 · `FOR UPDATE`) |
| `PhoneVerificationService::sendOtp` | SMS 전 assert → `PhoneVerificationException(phone_account_limit)` |
| `public/api/auth/signup.php` · `account-contact.php` | 422 + `error=phone_account_limit` |
| `scripts/verify-phone-account-limit.php` | Fake PDO 회귀 |

### 응답 코드

기존 가입 검증과 동일 **HTTP 422**, `error: phone_account_limit`, 문구 지시서 원문.

### 동시성

가입·연락처 저장 트랜잭션 안에서 `SELECT … FOR UPDATE` 후 카운트.  
한계: InnoDB·동일 phone 행이 있을 때만 잠금. 0건이면 gap lock에 의존(격리 수준·인덱스에 따름). 완전 직렬화는 phone 전용 lock 테이블이 필요하나 이번 범위·DDL 금지로 현행 방식.

### 탈퇴 정책

`PhoneAccountLimit::COUNT_WITHDRAWN = false` (한 곳에서 전환 가능). 종현 확인 권장안 채택.

---

## 테스트

```
php scripts/verify-phone-account-limit.php → 23 PASS / 0 FAIL
php scripts/verify-auth-mail-warm.php → passed=466 failed=0
php scripts/verify-test-card-hide.php → 22 PASS (357 회귀)
```

curl·스크린샷: 로컬 MySQL/HTTP 미기동 · 프론트 레이아웃 변경 0 → verify·파일검사로 대체.

---

## 셀프검수 체크리스트

| # | 항목 | 결과 | 근거 |
|---|---|---|---|
| 1 | 판정 함수 1곳, 3지점 호출 | PASS | `PhoneAccountLimit` · Signup/Contact/OTP |
| 2 | 4번째 거절·문구 원문 | PASS | verify MESSAGE exact |
| 3 | OTP 문자 미발송 거절 | PASS | assert before `$this->sms->sendOtp` · code 매핑 |
| 4 | 탈퇴 미산정 | PASS | verify withdrawn not counted |
| 5 | 번호 변경 자기 제외 | PASS | verify exclude self |
| 6 | 동시 요청 4번째 방지 | PASS* | `FOR UPDATE` in txn (*실부하 race 미실행) |
| 7 | 신규/기존 verify | PASS | 23 / auth-mail 466 / test-card 22 |
| 8 | 번호 원문 로그 없음 | PASS | PhoneAccountLimit에 error_log 없음 |
| 9 | 1920 레이아웃 0 | PASS | 프론트/CSS 미변경 |
| 10 | 공통 금지 위반 없음 | PASS | 운영 DB·시크릿·force push 없음 |

---

## 발견 목록

- 없음 (범위 외 수정 없음)

---

```
[최종검수 패키지 — 351]
브랜치 / 커밋: work/351-phone-3-account-limit / 9e78c686
변경 파일: 9 files, +556/−1 (351 단독; 브랜치는 357 tip 기반)
  docs/worklog/2026/11/2026-11-11-351-phone-3-account-limit.md (+90)
  public/api/auth/account-contact.php (+3)
  public/api/auth/signup.php (+8)
  scripts/verify-phone-account-limit.php (+299)
  src/Auth/AccountContactService.php (+15)
  src/Auth/PhoneAccountLimit.php (+97)
  src/Auth/PhoneAccountLimitException.php (+21)
  src/Auth/PhoneVerificationService.php (+22/−1)
  src/Auth/SignupService.php (+2)
diff 요약:
- PhoneAccountLimit(+Exception): 3계정 판정·탈퇴/허용목록 제외
- Signup/AccountContact/OTP + API: 422 phone_account_limit
- verify-phone-account-limit.php
테스트: verify-phone-account-limit 23 PASS; auth-mail-warm 466 PASS; test-card-hide 22 PASS
스크린샷: 레이아웃 0 → 생략
API 확인: 로컬 curl 미실행 → verify 동등
셀프검수 체크리스트: 1~10 PASS (*6은 FOR UPDATE 구현, race E2E 미실행)
미해결·종현 결정 필요: 탈퇴 미산정 확정 여부(권장안 적용); 351 PR은 357(#166) 머지 후
```
