# 357 — 테스트 카드 숨김 (공개 목록·검색 서버 한 곳)

**브랜치:** `work/357-test-card-hide`  
**기준:** `origin/main` (`d6d6d922`)  
**일시:** 2026-11-11  
**작업 폴더:** `D:\work\study114\.wt\work-357-test-card-hide`  
**선행 push:** 354 `work/354-resend-gate-region-check` @ `47bbbe69` (원격 동기 확인)

## 지시 요점

- 테스트 계정 식별 = env `STUDY114_TEST_ACCOUNT_EMAILS` (정확한 이메일, 소문자 비교)
- 운영 DB 변경 없음 · 실이메일 하드코딩 금지
- 비회원·일반 → 테스트 주인 카드 숨김 / 테스트 계정 로그인 → 전부 보임
- 카운터·쪽지·추천·관리자·상세 직접 URL = 그대로
- 커밋만 · push는 승인 후
- 351 지시서에 허용목록 제외(카운트·가입 차단) 반영

---

## 0. 현재 「테스트」표시 방식 (확인)

- main에 `is_test` / 테스트 전용 컬럼 **없음**
- 카드 이름에 「테스트」문자열 매칭 **쓰지 않음** (오탐 위험)
- **판정:** 카드 주인 `users.email`이 `STUDY114_TEST_ACCOUNT_EMAILS` 허용목록에 있으면 테스트 카드

---

## 구현

| 역할 | 파일 |
|------|------|
| 허용목록 | `src/Auth/TestAccountAllowlist.php` — `emails()` / `contains()` / `userIds(PDO)` |
| config | `config/auth.php` — `test_account_emails` ← env (기본 `''`) |
| SQL 조각 | `src/Visibility/TestOwnerVisibility.php` — `bindViewer` + `sql($pdo, 'alias.col')` |
| 검색 목록 | `SearchService::searchRooms/Tutors/Students` — `WithdrawnOwnerSql` 옆 |
| API 바인딩 | `public/api/search/search.php`, `neighborhood-greetings.php`, `neighborhood-greeting-card.php` |
| 동네인사 | `NeighborhoodGreetingService` 공개 목록·카드 owner 필터 |
| verify | `scripts/verify-test-card-hide.php` (Fake PDO, pdo_sqlite 불필요) |

### 적용한 공개 쿼리

1. `SearchService::searchRooms` — `sr.user_id`
2. `SearchService::searchTutors` — `t.user_id`
3. `SearchService::searchStudents` — `s.guardian_user_id`
4. `NeighborhoodGreetingService` — 공개 리스트/카드 owner 조건

### 의도적으로 미적용

- `region-stats.php` / guest·prime **카운터** (지시: 카운터 그대로)
- `StudyRoomPublicReadService` / `PromoChannelPublicRead` **상세** (직접 URL 현행)
- `AdminExposureRepository` / `TutorDetailRecomputeService`
- `BoardPostRepository` — 게시글은 검색 카드가 아님 → **범위 외** (발견 목록)

### 351 지시서 반영

`docs/worklog/grok-sync/docs/351-phone-3-account-limit-2026-11-11.md`

- 선행 = 357 완료 후
- 허용목록 이메일은 (a) 3개 카운트 제외 (b) 가입·연락처·OTP 차단 제외

---

## 테스트

```
D:\php8.2\php.exe scripts\verify-test-card-hide.php
→ 22 passed, 0 failed
```

회귀:

```
verify-tutor-search-fields.php → 36 PASS / 0 FAIL
verify-student-search-fields.php → 9 PASS / 0 FAIL
verify-neighborhood-welcome.php → 로컬 PHP에 pdo_sqlite 없음(기존 스크립트 제약, 본 과제 무관)
```

curl E2E·스크린샷: 로컬 HTTP+세션 환경 미기동 → **서버 단위 verify로 대체**. 레이아웃 파일 0건 변경 → 1920·390 레이아웃 변화 0.

---

## 셀프검수 체크리스트

| # | 항목 | 결과 | 근거 |
|---|---|---|---|
| 1 | 현재 테스트 표시 방식 확인 | PASS | `is_test` 컬럼 없음 → env 허용목록 이메일=주인 |
| 2 | 판정 함수·SQL 조각 각 1곳 | PASS | `TestAccountAllowlist.php` · `TestOwnerVisibility.php` |
| 3 | 적용한 공개 쿼리 목록 | PASS | rooms/tutors/students + neighborhood (위 표) |
| 4 | 비회원·일반 회원 숨김 | PASS | verify: guest/member → `NOT IN (10,11)` |
| 5 | 테스트 계정 보임 | PASS | verify: test viewer → `1=1` |
| 6 | 관리자 보임, 카운터·쪽지·추천 diff 0 | PASS | Admin/region-stats/count·primeMatch에 TestOwner 미삽입 |
| 7 | env 비면 무동작 | PASS | verify: empty → `1=1` |
| 8 | 하드코딩 이메일 0 | PASS | grep · config 기본 `''` · example.com만 verify |
| 9 | 레이아웃 변화 0 (1920·390) | PASS | 프론트/CSS 미변경 (서버 SQL만) |

---

## 운영 적용 시 (종현)

- SetEnv / Secrets: `STUDY114_TEST_ACCOUNT_EMAILS=email1@…,email2@…` (정확한 이메일, 쉼표 구분)
- 코드·문서·커밋에 실값 넣지 않음
- 운영 DB DDL **없음**

## 종현 결정 필요

- 판정 기준: **env 허용목록 채택** (이름 매칭·DB 컬럼 안 씀)
- `region-stats` 숫자에서 테스트 카드 제외: **기본 유지(빼지 않음)** — 변경 원하면 별 티켓

## 발견 목록 (범위 외)

- `BoardPostRepository`는 `WithdrawnOwnerSql`만 사용. 게시글을 테스트 카드로 숨길지는 제품 판단 필요(이번 미적용).
- 로컬 `D:\php8.2`에 `pdo_sqlite` 없음 → 일부 기존 verify(sqlite) 불가.

---

```
[최종검수 패키지 — 357]
브랜치 / 커밋: work/357-test-card-hide / adf2558b
변경 파일: 11 files, +563/−9 (git diff --stat origin/main...HEAD)
  config/auth.php (+6)
  docs/worklog/2026/11/2026-11-11-357-test-card-hide.md (+132)
  docs/worklog/grok-sync/docs/351-phone-3-account-limit-2026-11-11.md (+11/−4)
  public/api/neighborhood-greeting-card.php (+5)
  public/api/neighborhood-greetings.php (+10/−1)
  public/api/search/search.php (+4)
  scripts/verify-test-card-hide.php (+223)
  src/Auth/TestAccountAllowlist.php (+80)
  src/Neighborhood/NeighborhoodGreetingService.php (+15/−4)
  src/Search/SearchService.php (+4)
  src/Visibility/TestOwnerVisibility.php (+82)
diff 요약:
- config/auth.php: test_account_emails env 키
- src/Auth/TestAccountAllowlist.php: 허용목록 1곳
- src/Visibility/TestOwnerVisibility.php: 뷰어 바인딩·SQL 조각
- SearchService·NeighborhoodGreetingService·search/neighborhood API: 공개 목록에 적용
- scripts/verify-test-card-hide.php: 검증
- 351 지시서: 허용목록 카운트·차단 제외
테스트: php scripts/verify-test-card-hide.php → PASS 22 / FAIL 0; tutor-search 36 PASS; student-search 9 PASS
스크린샷: 레이아웃 변경 0 → 생략(서버 전용)
API 확인: 로컬 세션 curl 미실행 → verify SQL 동등 확인으로 대체
셀프검수 체크리스트: 위 표 1~9 PASS
미해결·종현 결정 필요: 운영에 STUDY114_TEST_ACCOUNT_EMAILS 값 입력; region-stats 제외 여부는 현행 유지
```
