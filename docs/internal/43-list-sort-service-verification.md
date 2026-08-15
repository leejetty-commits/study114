# 서비스 반영 완료 보고 — 정렬/카운트/SKY (실DB 기준)

작성: 2026-08-16  
기준: preview가 아니라 **실제 DB + API + 화면**  
원칙: fallback=미완료 · SQL파일만=미완료 · UI만=미완료

---

## ① 실제 DB 반영 완료 여부

| 환경 | 040 provider_reviews | 041 recommend_count | 042 user_recommendations | 판정 |
|------|----------------------|---------------------|--------------------------|------|
| **로컬 Docker `study114_dev`** | 적용·존재 확인 (COUNT 시드 2) | 적용·verify 통과 | 적용·존재 확인 | **완료** |
| **운영 닷홈 `study114`** | 미확인(후기 API 미프로브) / 검색은 테이블 없으면 0 fallback | **미적용** (코드 fallback 경로) | **미적용** | **미완료** |

로컬 적용 방법(실행됨):
```powershell
docker compose -f docker/docker-compose.dev.yml up -d
.\scripts\apply-schema-dev.ps1   # 001~042 포함
docker exec study114-api-dev php /app/scripts/smoke-list-sort-local.php
```

운영 적용 절차(아직 실행 전):
1. 본 코드 push → Actions 배포
2. DB 백업(phpMyAdmin export)
3. 최고관리자 `POST /api/admin/content/migrate.php` `{"confirm":"apply-041"}`  
   → 041 컬럼 + 042 테이블 (seed_demo 없이)
4. 또는 phpMyAdmin: `040`(없으면) → `041` → `042`
5. `041_list_sort_counters.verify.sql` 실행
6. 검색 `sort=recommend|sky|review` 스모크

---

## ② 실제 서비스 동작 완료 여부

### 로컬 (검증됨)

| 기능 | 결과 |
|------|------|
| tutor `sort=sky` | 서울대(id=1)가 부산대보다 앞 · recommend 낮아도 SKY 우선 |
| tutor `sort=recommend` | recommend_count DESC |
| room/student `sort=sky` | **latest로 정규화** (서버 방어) |
| 추천 토글 API | `RecommendService.toggle` → DB count 변경 확인 |
| Home Basic 화면 | Vite `:5174` + Chrome: 정렬 셀렉트 3개 · tutor 정렬 변경 시 **서버 API 재조회** (`sort=sky`/`recommend`) |
| 추천 버튼 | 비회원 `login-gate` · 로그인 시 `recommend-toggle` |

브라우저 스모크 로그 요약:
- `api_body ... sort":"sky"` / `sort":"recommend"` 확인
- `browser_smoke_ok`

### 운영 (미완료)

| 기능 | 결과 |
|------|------|
| room 검색 전 탭 | **HTTP 500** (배포 코드가 `grade_band`/`latitude` 하드 SELECT · 스키마 불일치) |
| tutor 검색 | 200 but total=0 (데이터/상세완료 조건) |
| student 검색 | 200 · 잘못된 sort도 200(화이트리스트→latest) |
| 041/042 | 미적용 |

이번 코드에서 room 500 원인 방어 추가: `latitude`/`longitude`/`grade_band` columnCache.

---

## ③ UI만 있고 실DB/운영 미반영인 항목

| 항목 | 상태 | fallback 숨김? |
|------|------|----------------|
| 운영 041 recommend_count | 미완료 | **예** (검색이 0으로 조용히 동작) |
| 운영 042 추천 쓰기 | 미완료 | 배포 전 API 없음 |
| 운영 040 후기 테이블 | 불명→미완료 취급 | 검색 review는 0 fallback / Reviews API는 하드실패 가능 |
| Home Basic mock 풀 | live 실패 시에만 잔존 | **예** (API 실패 시 mock으로 보이는 정렬) |
| wish/compare/message 카운트 숫자 | UI 자리표시 | 실DB 카운트 아님 |

---

## ④ 지금 당장 반영해야 할 DB 작업

1. **운영**: 백업 → `apply-041`(041+042) 또는 SQL 040→041→042  
2. **운영**: verify SQL  
3. **로컬**: 이미 001~042 fresh apply 완료

---

## ⑤ 지금 당장 반영해야 할 서버 작업

1. push/배포: `SearchService` 좌표·grade_band 방어 · `RecommendService` · migrate 041+042  
2. 운영 migrate 실행  
3. (데이터) 과외쌤 `detail_completion_status=expanded_complete` 없으면 목록 0건 — 시드/실데이터 점검

---

## ⑥ 지금 당장 반영해야 할 화면/연결 작업

1. `build:dothome` + 배포 (home-basic-live · recommend 버튼 · bridge)  
2. 운영 사이트에서 tutor Basic/찾기결과 정렬 수동 확인  
3. 로그인 후 추천 토글 → 새로고침 후에도 count 유지 확인

---

## ⑦ 최종 판정

| 범위 | 판정 |
|------|------|
| **로컬 실서비스 경로** | **부분완료 → 기능검증 완료에 근접** (DB+API+브라우저 확인). 단 mock 폴백 경로는 남아 있음 |
| **운영 실서비스** | **미완료** |
| **전체 목표(“실서비스에서 제대로”)** | **미완료** |

### 운영 반영 전 필수 3개
1. 코드 배포(좌표/`grade_band` 방어 + 추천 API + Home live 정렬)  
2. 운영 DB에 **041+042**(및 필요 시 040) 적용 + verify  
3. 운영에서 room 검색 500 해소 및 tutor `sort=sky`/`recommend` + Home Basic 정렬 화면 확인

### fallback으로 숨겨진 미완료 (별도)
- 운영에서 recommend_count 컬럼 없어도 검색 200 + 전부 0  
- Home Basic API 실패 시 EXPOSURE mock 클라 정렬로 “되는 것처럼” 보임

---

## 이번 세션 수정·추가 파일

- `sql/schema/041_*.sql` / `041_*.verify.sql` / `042_user_recommendations.sql`
- `src/Admin/ListSortCountersMigrateService.php` (042 포함)
- `public/api/admin/content/migrate.php`
- `src/Handoff/RecommendService.php` · `HandoffApi::optionalAuth`
- `public/api/handoff/recommendations.php`
- `src/Search/SearchService.php` (lat/lng/grade_band 방어)
- `preview/home-ui/src/home-basic-live.js` · `guest-sections.js` · `screens/guest.js` · `search-api.js` · `exposure-render.js` · `exposure-bridge.js`
- `scripts/apply-schema-dev.ps1` · `scripts/smoke-list-sort-local.php` · `scripts/browser-sort-smoke.mjs`
- `docs/internal/42-list-sort-db-audit.md` · 본 문서

빌드: 미실행(로컬 Vite만) · commit/push: 미실행
