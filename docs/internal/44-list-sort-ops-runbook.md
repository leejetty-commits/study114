# 정렬·추천·SKY — 운영 반영 런북 & Rollback

작성: 2026-08-16  
대상: `041_list_sort_counters` · `042_user_recommendations` · 목록 정렬/추천 API  
관련: [42](42-list-sort-db-audit.md) · [43](43-list-sort-service-verification.md)

---

## 1. 운영 반영 고정 순서 (반드시 이 순서)

| 순 | 작업 | 완료 기준 |
|----|------|-----------|
| 1 | **운영 DB 백업** | phpMyAdmin Export(퀵·SQL) 또는 테이블 dump 파일 확보 |
| 2 | **코드 배포** | `main` push → Actions Deploy success → 사이트 새 JS 번들 확인 |
| 3 | **041/042 적용** | phpMyAdmin Import 또는 `POST /api/admin/content/migrate.php` `{"confirm":"apply-041"}` (`seed_demo` 금지) |
| 4 | **verify SQL** | `sql/schema/041_list_sort_counters.verify.sql` + 아래 §5 스냅샷 보관 |
| 5 | **API 스모크** | room/tutor/student sort · recommendations GET ready |
| 6 | **운영 브라우저 수동 검증** | §6 체크리스트 |
| 7 | **이상 시 rollback** | §2~§4 |

> 이번(2026-08-16) 실제 수행: DB 적용이 배포보다 앞선 케이스. 이후부터는 **위 고정 순서**를 따른다.

---

## 2. 코드 rollback 절차

1. GitHub에서 직전 정상 Deploy 커밋 확인 (예: 문제 전 `a277873` 등)
2. `git revert`로 문제 커밋을 되돌리거나, 직전 태그/커밋을 `main`에 재배포
3. Actions Deploy success 확인
4. 사이트에서 JS 번들 해시가 바뀌었는지 확인 (강력 새로고침)
5. API 스모크: room search 200 · recommendations 존재 여부

주의: 코드만 롤백하고 DB 041/042를 남겨도 **대체로 안전**(여분 컬럼/테이블).  
반대로 DB만 롤백하고 새 코드가 남아 있으면 추천 API는 `ready=false`/500, 검색은 0 fallback 가능 → **불일치 시 §4**.

---

## 3. DB 041/042 rollback 절차

### 041 (`recommend_count`)
```sql
-- 롤백 전: 값 백업(선택)
SELECT id, recommend_count FROM study_rooms;
SELECT id, recommend_count FROM tutors;

ALTER TABLE study_rooms DROP COLUMN recommend_count;
ALTER TABLE tutors DROP COLUMN recommend_count;
```

### 042 (`user_recommendations`)
```sql
-- 롤백 시 추천 이력 삭제됨
DROP TABLE IF EXISTS user_recommendations;
```

### 주의
- DROP COLUMN/TABLE은 **되돌리기 어려움** → 반드시 사전 Export
- 041만 남기고 042만 DROP 하면 추천 쓰기는 깨지고 정렬 카운터만 남음
- 운영에서 `seed_demo`로 채운 값은 실추천이 아님 → 롤백 시 함께 사라짐

### 롤백 후 검증
```sql
SHOW COLUMNS FROM study_rooms LIKE 'recommend_count';  -- 빈 결과
SHOW COLUMNS FROM tutors LIKE 'recommend_count';
SHOW TABLES LIKE 'user_recommendations';               -- 빈 결과
```

---

## 4. 코드↔DB 버전 불일치 복구 순서

| 증상 | 추정 | 복구 |
|------|------|------|
| 검색 200 · recommend 전부 0 · ready=false | 코드新 / DB舊 | **DB에 041/042 적용** (코드 롤백 비권장) |
| recommendations 404 | 코드舊 / DB新 또는 미배포 | **재배포** |
| recommendations 500 “DB 미적용” | 코드新 / DB舊 | **041/042 적용** |
| room 500 (컬럼 없음) | 구코드 하드 SELECT | **新코드 배포**(columnCache) |
| 정렬 UI만 mock처럼 보임 | Home Basic live 실패 | 네트워크/API 확인 · mock 금지 정책 확인 |

복구 원칙: **먼저 맞추고 싶은 쪽(보통 DB 스키마를 코드에 맞춤) → 스모크 → 브라우저**.

---

## 5. 백업 파일 위치 / 복구 / 검증

| 항목 | 내용 |
|------|------|
| 위치 | 운영자 PC `다운로드` 등 (닷홈 Export). 저장 시 `study114-YYYYMMDD-HHMM.sql` 권장 |
| 보관 | 로컬 안전한 폴더 + (가능하면) 팀 공유. Git에는 **올리지 않음** |
| 복구 | phpMyAdmin Import로 해당 SQL 재적용(전체 덮어쓰기 위험 — 가능하면 문제 테이블만) |
| 검증 | `SHOW TABLES` · 핵심 테이블 COUNT · 로그인/검색 스모크 |

verify SQL 결과 스냅샷 보관 위치:  
`docs/internal/verify-snapshots/` (예: `041-ops-YYYYMMDD.md`)

tutor 노출 진단 SQL: `sql/schema/041_ops_tutor_exposure_diagnose.sql`

---

## 6. 배포 후 확인 체크리스트

### API
- [ ] `POST /api/search/search.php` room latest/recommend/review → 200
- [ ] room/student `sort=sky` → 응답 `sort=latest`
- [ ] tutor latest/recommend/sky/review → 200 (건수는 데이터 의존)
- [ ] `GET /api/handoff/recommendations.php` → `status.ready=true`
- [ ] `POST` 비로그인 → 401

### 브라우저
- [ ] Home Basic 정렬 바 · live 데이터( mock 아님 )
- [ ] 찾기결과 서버 정렬
- [ ] 추천 토글(로그인) count 반영
- [ ] Prime/Pick 구역 이상 없음
- [ ] 새 JS 번들 / 강력 새로고침

### 로그
- [ ] 닷홈 PHP error log에 search/recommend 500 없음
- [ ] Actions Deploy 초록

---

## 7. 이번 라운드 기록 (2026-08-16)

| 항목 | 값 |
|------|------|
| 배포 커밋 | `38958ee` (수정) / 기능 `c98c00b` |
| Actions | Deploy #146 success |
| 운영 DB 041/042 | phpMyAdmin 적용 확인(컬럼·테이블 SHOW) |
| recommendations ready | true (API) |
| room 500 | 해소(API 200) |

---

## 8. tutor expanded_complete · 검색 0건 후속

상세: [45-tutor-expanded-complete-ssot.md](45-tutor-expanded-complete-ssot.md)

배포 후 운영 순서:

1. `POST /api/admin/content/migrate.php` `{"confirm":"recompute-tutor-detail"}` (최고관리자)
2. `sql/schema/041_ops_tutor_exposure_diagnose.sql` 재실행 → `miss_*` 확인
3. 필드 미충족 published tutor는 **소유자 상세등록 보강** (status 수동 UPDATE 금지)
4. 검색 `type=tutor` total>0 · Home Basic · sky/recommend 재검증
