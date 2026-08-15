# 정렬 기능 DB 실반영 + 겉구현/DB 미적용 전수 점검 보고서

작성일: 2026-08-16  
범위: `041_list_sort_counters` · 목록 정렬(SKY/추천/후기) · `sql/schema` vs 코드 정합성  
원칙: SQL 파일 존재 ≠ DB 반영 · fallback(0) ≠ 완료 · preview 완료 ≠ 운영 완료

---

## ① 041 마이그레이션 상태

### 파일 상태
| 파일 | 역할 |
|------|------|
| `sql/schema/041_list_sort_counters.sql` | 멱등 `ADD COLUMN recommend_count` (study_rooms / tutors) · `INT UNSIGNED NOT NULL DEFAULT 0` |
| `sql/schema/041_list_sort_counters.verify.sql` | 적용 후 검증 + SKY 비정규명 후보 추출 |
| `src/Admin/ListSortCountersMigrateService.php` | 닷홈 PDO 멱등 적용 |
| `public/api/admin/content/migrate.php` | GET `list_sort_041` · POST `confirm=apply-041` (`seed_demo` 옵션) |

### 설계 판단
- **기본값 0 / NULL 불가** → 기존 row는 ADD 시 전부 0. NULL 이상값 없음.
- **인덱스**: 1차 불필요. 공개 목록 규모가 커지면 `(profile_status, recommend_count)` 복합 검토.
- **데모 시드**: SQL/API 기본 경로에서 **제외**. 로컬만 `seed_demo=true` 또는 verify 주석 UPDATE.
- **sky_flag**: 만들지 않음 (정책 유지).

### 실제 DB 적용 여부
| 환경 | 상태 |
|------|------|
| 로컬 MySQL | **미확인/미적용 가정** (에이전트 환경에 mysql CLI·루트 `.env` DB 접속 없음) |
| 닷홈/운영 | **미적용** (041 파일만 존재 · migrate 엔드포인트는 이번에 추가 · 아직 실행 전) |

### 적용 필요 작업
1. 코드 push 후 운영에 `ListSortCountersMigrateService` 배포
2. 최고관리자로 `POST /api/admin/content/migrate.php` `{"confirm":"apply-041"}`  
   또는 phpMyAdmin에서 `041_list_sort_counters.sql` import
3. `041_list_sort_counters.verify.sql` 실행
4. 검색 API `sort=recommend` / tutor `sort=sky` 스모크

### 적용 후 검증 방법
- verify SQL 전체
- `GET .../migrate.php` → `list_sort_041.ready === true`
- `POST /api/search/search.php` body에 `sort: recommend` → 500 없이 `recommend_count` 필드
- tutor `sort: sky` → SKY `university_name` 그룹이 앞 · 동일 그룹 내 `recommend_count` DESC

---

## ② 이번 기능의 실제 완료 수준

| 항목 | 상태 | 근거 |
|------|------|------|
| UI | **완료** | 찾기결과·Home Basic 정렬 바 · tutor만 SKY 옵션 |
| 클라이언트 정렬 | **부분완료** | `list-sort.js` 정책 일치. Home은 **메모리 풀 전체 정렬 후 slice** (실DB 전수 아님) |
| 서버 정렬 | **부분완료** | `SearchService` whitelist·ORDER BY 구현. 컬럼 없으면 **0 fallback** |
| DB 스키마 | **미완료** | 041 **미실행** |
| 운영 데이터 | **미완료** | `recommend_count` 실측 없음 · **추천 쓰기 API 없음** · 후기는 040 테이블 의존 |

요약: **보이는 정렬 UX는 동작하나, 추천순의 운영 의미는 아직 성립하지 않음.**

---

## ③ “겉구현/DB 미적용” 전수 점검 결과

### A. 이번 정렬 건 (핵심)

| 항목명 | 관련 파일 | 실제 누락 | 위험도 | 수정 필요 |
|--------|-----------|-----------|--------|-----------|
| `recommend_count` 컬럼 | `041_*.sql` · `SearchService.php` | DB 미적용 · API는 0 fallback | **P1** (+ fallback 표시) | 041 적용 |
| 추천 카운터 **쓰기** | UI 엄지 · `user-actions-state.js` | DB UPDATE/API **전무** · 찜만 localStorage | **P1** | 별도 작업 (카운터 증가 API) |
| `provider_reviews` 후기순 | `040_*.sql` · `SearchService` · `Reviews/` | 테이블 없으면 COUNT=0 fallback | **P1** (040 미적용 시) | 040 적용 여부 운영 확인 |
| SKY `university_name` | PHP/JS 동일 화이트리스트 | 비정규 학교명은 SKY 제외(필터 아님) | **P2** | 데이터 정리 작업으로 분리 |
| Home Basic vs 찾기 | `exposure-render` · `search-tier-render` | Home=클라 풀 정렬 · 찾기=서버 정렬 | **P1** | 정책 문서화 또는 Home도 서버 정렬 |
| exposure-bridge 필드 | `exposure-bridge.js` | university/recommend/review 미매핑이었음 | **P2** | **보정함** |

### B. 스키마 파일 vs 코드 (유사 패턴)

| 항목명 | migration | 코드 | 분류 | 위험도 | 비고 |
|--------|-----------|------|------|--------|------|
| 034/035 content | `034`·`035` | `ContentSchemaMigrateService` | 둘 다 있음(운영 적용 이력 문서화) | P2 | migrate API 존재 |
| 036 admin_level | `036` | `AdminAccountSchemaMigrateService` | 둘 다 있음 | P1 | 미적용 시 권한 fallback |
| 037 region_basis | `037` | migrate + `BasicRegisterService` columnExists | 코드 방어 있음 | P1 | 미적용 시 기준 타입 저장 스킵 가능 |
| 038 dual-admin | `038` | `DualCapabilityAdminMigrateService` | 둘 다 있음 | P2 | |
| 039 Prime/Pick 기간 | `039` | **PHP 기간 로직 약함** · preview `position_sku` 시드 | **코드/DB 둘 다 불완전** | P1 | 기간 캘린더 SSOT vs 실제 노출 엔진 분리 미완 |
| 040 provider_reviews | `040` | `Reviews/` · Search COUNT | 코드 있음 · DB 적용 불명 | **P0/P1** | 후기 API는 테이블 없으면 **하드 실패** 가능(검색만 fallback) |
| 041 recommend_count | `041` | Search fallback | **코드만 · DB 미적용** | P1 | 본 보고서 대상 |
| 033 map coords | `033` | Search latitude · map JS | 운영 적용 여부에 지도 품질 좌우 | P1 | |
| wish/compare/message **카운트 UI** | (카운터 컬럼 없음) | `exposure-render` 0 기본 | **UI만** | P2 | 완성이 아닌 자리표시 |
| rest-schema.sql | 통합본 | 신규 환경용 | DB만/문서 | P2 | 운영 증분과 혼동 주의 |

### C. Fallback으로 가려진 항목 (별도)

1. `SearchService::recommendCountExpr` → 컬럼 없으면 `'0'`
2. `SearchService::reviewCountExpr` → 테이블 없으면 `'0'`
3. Home Basic mock `recommend_count` 시드 → 실DB와 무관하게 “정렬되는 것처럼” 보임
4. `BasicRegisterService` 037 컬럼 없으면 basis 저장 생략

---

## ④ 즉시 해야 할 DB 작업

### 로컬에서 실행할 SQL
```bash
# 040이 없다면 먼저
mysql -u ... -p study114 < sql/schema/040_provider_reviews.sql
mysql -u ... -p study114 < sql/schema/041_list_sort_counters.sql
mysql -u ... -p study114 < sql/schema/041_list_sort_counters.verify.sql
```
(데모 시드가 필요하면 verify 파일 상단 주석 UPDATE만 별도 실행)

### 운영(닷홈) 반영 절차
1. **백업**: phpMyAdmin → DB export (또는 테이블 `study_rooms`/`tutors` 구조+데이터). ALTER만이라 위험 낮지만 **백업 권장**.
2. 코드 배포(push → Actions)로 migrate 서비스 반영.
3. 최고관리자 세션으로:
   ```http
   POST /api/admin/content/migrate.php
   {"confirm":"apply-041"}
   ```
   (운영에서 `seed_demo` **넣지 말 것**)
4. 대안: phpMyAdmin Import `041_list_sort_counters.sql`
5. verify SQL 실행 · 검색 API 스모크
6. `GET migrate.php`에서 `list_sort_041.ready` 확인

### 백업 필요 여부
- **권장(예)**. DDL은 ADD COLUMN만 · 롤백은 컬럼 DROP으로 가능하나 운영 습관상 사전 export.

### 검증 SQL
→ `sql/schema/041_list_sort_counters.verify.sql` 전문.

---

## ⑤ 코드 수정 필요 사항

| 구분 | 상태 | 내용 |
|------|------|------|
| 041 멱등 SQL + migrate API | **이번에 추가** | 운영 적용 경로 확보 |
| exposure-bridge 정렬 필드 | **이번에 보정** | `university_name` · `recommend_count` · `review_count` · `published_at` |
| 서버 방어(sort whitelist) | **이미 있음** | room에 `sky` → `latest` · tutor만 sky 허용 |
| Home Basic 구조 | **남은 이슈** | 전체 실DB 정렬이 아님 · 브리지 cap(방3/쌤2/생2) + mock 혼합 |
| 추천 쓰기 경로 | **미착수** | 컬럼만 있어도 추천순은 전부 0(또는 데모시드) |
| 후기순 COUNT | **유지 결론** | 상관 서브쿼리 · SELECT에 포함 · **row 중복 없음**. 캐시 컬럼 **당장 불필요** |
| 문서 001~040만 언급 | **후속** | `00-project-tree`·deploy 문서에 041 반영 권장 |

### 후기순 결론
**현재는 `provider_reviews` COUNT 기반 유지.**  
조인 확대가 아니라 스칼라 서브쿼리라 목록 row 폭증 없음. 규모 커지면 `review_count` 캐시 컬럼을 P2로 검토.

### SKY 데이터
판정은 `university_name` exact(+짧은 표기)만. note/대학원 미사용 확인됨.  
비정규값(`서울대학교 인문대` 등)은 **코드 수정이 아니라** verify SQL 6번으로 목록 뽑은 뒤 **데이터 정리 작업**.

---

## ⑥ 최종 결론

### 지금 상태가 진짜 완료인가?
**아니다.** UI·서버 ORDER BY·클라 정렬은 들어가 있으나 **041 DB 미적용 + 추천 쓰기 부재 + Home/찾기 정렬 경로 불일치**로 운영 의미는 불완전.

### “보이는 구현만” 남은가?
**예.** fallback 0 · mock 시드 · Home 클라이언트 재정렬이 “되는 것처럼” 보이게 함.

### 운영 반영 전 반드시 할 것 3개
1. **041 적용** (migrate API 또는 phpMyAdmin) + verify SQL
2. **040 `provider_reviews` 존재 확인** (후기순·후기 API)
3. **추천순 운영 의미 결정**: (a) 당분간 0 정렬 허용을 명시하거나 (b) 카운터 쓰기 API를 별도 티켓으로 착수

---

## P0 / P1 / P2 우선순위

### P0
- 040 미적용 상태에서 후기 **작성/조회 API** 호출 → SQL 에러 가능 (검색 sort=review는 0으로 조용히 통과)

### P1
- 041 미적용 → 추천순·SKY 2차키 전부 동일(0)
- 추천 카운터 쓰기 경로 없음
- Home Basic ≠ 찾기결과 서버 정렬 철학
- 037/033 등 지역·지도 컬럼 운영 미적용 시 기능 왜곡 (별도 확인)

### P2
- SKY 비정규 `university_name` 데이터 정리
- `review_count` 캐시 컬럼
- wish/message/compare 카운트 실DB화
- 039 기간 캘린더와 실노출 엔진 정합
- 내부 문서 schema 상한 040→041

---

## 지금 바로 해야 할 것 체크리스트

- [ ] 로컬: 040·041 import + verify SQL
- [ ] 운영: DB 백업
- [ ] 코드 커밋/push (migrate 서비스 포함) — **사용자 요청 시**
- [ ] 운영: `POST migrate.php` `apply-041` (`seed_demo` 없이)
- [ ] `list_sort_041.ready` 확인
- [ ] 검색 `sort=recommend` / tutor `sort=sky` / `sort=review` 스모크
- [ ] 040 테이블 존재 여부 확인
- [ ] (후속) 추천 쓰기 API 티켓 생성
- [ ] (후속) Home Basic 서버 정렬 여부 정책 결정

---

## 이번 세션 수정 파일 목록

1. `sql/schema/041_list_sort_counters.sql` — 멱등 ADD · 시드 분리
2. `sql/schema/041_list_sort_counters.verify.sql` — 신규
3. `src/Admin/ListSortCountersMigrateService.php` — 신규
4. `public/api/admin/content/migrate.php` — apply-041
5. `preview/home-ui/src/exposure-bridge.js` — 정렬 필드 매핑
6. `docs/internal/42-list-sort-db-audit.md` — 본 보고서
