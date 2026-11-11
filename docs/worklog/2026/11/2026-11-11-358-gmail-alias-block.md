# 358 — Gmail 별칭 가입 차단 + TEST_ACCOUNT_EMAILS 배선

**브랜치:** `work/358-gmail-alias-block`  
**기준:** `origin/main` (`7a6e54d8` · #166 머지 후)  
**일시:** 2026-11-11  
**작업 폴더:** `D:\work\study114\.wt\work-358-gmail-alias-block`

## 선행 확인

- #166(357) 머지 `7a6e54d8` · Deploy `43018576397` **success**
- 351 PR #167 push 완료(머지 대기)

## 구현

| 파일 | 내용 |
|------|------|
| `EmailNormalizer::canonical` | Gmail만 +·점·googlemail 통일 |
| `GmailAliasAvailability` | SQL 중복 검사 · 허용목록 스킵 · op log |
| Signup / AccountContact / OAuth | assert + allowlist 로그 |
| `public/.htaccess` | `STUDY114_TEST_ACCOUNT_EMAILS` placeholder(따옴표) |
| `deploy.yml` | Secret **선택** 주입(비어 있어도 배포 가능) |
| `check-no-committed-secrets.sh` | 해당 키 placeholder 검사 |
| `sql/schema/085_users_email_canonical_draft.sql` | 초안만 · 적용 금지 |
| `scripts/verify-gmail-alias-block.php` | 회귀 |

### 거절 문구 / 응답

지시서 원문 · 기존 가입과 같이 `InvalidArgumentException` → API **422**.

### 기존 별칭 중복 조회 SQL 초안 (실행 금지)

```sql
SELECT
  REPLACE(SUBSTRING_INDEX(SUBSTRING_INDEX(LOWER(TRIM(email)), '@', 1), '+', 1), '.', '') AS gmail_local,
  GROUP_CONCAT(id ORDER BY id) AS user_ids,
  GROUP_CONCAT(email ORDER BY id) AS emails,
  COUNT(*) AS cnt
FROM users
WHERE status <> 'withdrawn'
  AND SUBSTRING_INDEX(LOWER(TRIM(email)), '@', -1) IN ('gmail.com', 'googlemail.com')
GROUP BY gmail_local
HAVING cnt > 1;
```

---

## 테스트

```
php scripts/verify-gmail-alias-block.php → 26 PASS
php scripts/verify-auth-mail-warm.php → 466 PASS
php scripts/verify-test-card-hide.php → 22 PASS
```

curl·스크린샷: 로컬 HTTP 미기동 · 레이아웃 변경 0 → verify로 대체.

---

## 셀프검수 체크리스트

| # | 항목 | 결과 | 근거 |
|---|---|---|---|
| 1 | canonical 규칙 Gmail만 | PASS | naver dots 유지 · gmail 통합 |
| 2 | 가입·OAuth 두 경로 적용 | PASS | Signup+AccountContact+OAuth |
| 3 | 거절 문구 원문 | PASS | verify MESSAGE exact |
| 4 | 허용목록 예외 + 로그 | PASS | assert skip · op log 1 |
| 5 | 하드코딩 0 | PASS | example/test1 only in verify |
| 6 | 스키마 변경 0 (085 초안만) | PASS | draft SQL |
| 7 | 기존 verify PASS | PASS | auth-mail 466 · test-card 22 |
| 8 | 레이아웃 0 | PASS | 프론트 미변경 |

---

## 운영 (종현)

1. GitHub Secret `STUDY114_TEST_ACCOUNT_EMAILS` = `a@…,b@…` (없으면 빈 주입·무동작)
2. 358 머지·Deploy 후 SetEnv 반영 확인
3. ⚠ 다른 도메인 + 처리 / email_canonical 컬럼 전환은 보류(권장: 현행 SQL)

---

```
[최종검수 패키지 — 358]
브랜치 / 커밋: work/358-gmail-alias-block / (커밋 후 기입)
변경 파일: (커밋 후 diff --stat)
diff 요약:
- EmailNormalizer canonical · GmailAliasAvailability
- Signup/AccountContact/OAuth 적용
- htaccess·deploy·check-no-committed-secrets 배선
- 085 draft · verify-gmail-alias-block
테스트: verify-gmail-alias-block 26 PASS; auth-mail 466; test-card 22
스크린샷: 생략(레이아웃 0)
API 확인: 로컬 curl 미실행 → verify 동등
셀프검수 체크리스트: 1~8 PASS
미해결·종현 결정 필요: 타 도메인 별칭·canonical 컬럼; Secret 실값 입력
```
