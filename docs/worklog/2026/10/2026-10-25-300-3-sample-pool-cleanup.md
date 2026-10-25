# 300-3 견본 정리 — 표본 풀 직접 조회 걷어내기 + 견본 흔적 정리

**기준:** main `e99a86b8` (300-2R 병합 tip)  
**브랜치:** `cursor/300-3-sample-pool-cleanup-20261025`  
**작업일:** 2026-10-25

## 근거

300-2에서 만든 공용 조회(`exposure-lookup.js` → `provider-item-registry.js`)를 쓰지 않고 표본 배열(`EXPOSURE_STUDENTS`)만 직접 보는 곳이 2곳 있었다. 표본 밖 학생 카드가 바구니(resolveBasketItem)·검토 목록(getStudentReviewItems)에서 사라졌다.

## Step 1 — 표본 직접 조회 목록

| 파일 | 참조 | 분류 |
|---|---|---|
| `exposure-data.js` | 배열 선언 | 정상 |
| `exposure-bridge.js` | 표본 채우기/비우기 | 정상 |
| `exposure-lookup.js` | 공용 조회 풀 (study_room/tutor) | 정상 |
| `detail-decision/index.js` | `resolveDetailItem` 내 | 정상 |
| `handoff-lifecycle.js:81` | `EXPOSURE_STUDENTS.find(...)` | **수정** |
| `student-review-store.js:47` | `EXPOSURE_STUDENTS.find(...)` | **수정** |
| `myshop/public-resolve.js:70` | `EXPOSURE_STUDY_ROOMS.find(...)` | **보고만** (마이샵 범위 밖) |

예상 밖 파일 없음.

## Step 2 — 학생 직접 조회를 공용 조회로

두 파일 모두 `EXPOSURE_STUDENTS.find(...) || lookupRegisteredProviderItem('student', id)` 순서로 변경.

- 조회 순서: 표본(`EXPOSURE_STUDENTS`) → 찾기 화면 결과(registered lookup) → sessionStorage(레지스트리 기억)
- 학생이 레지스트리에 기억되는 경로:
  - `openDetailDecision({kind:'student'})` → `rememberProviderItem('student', item)`
  - `search-page.js` `registerProviderItemLookup` → `findSearchStudentItem` (조회 성공 시 자동 기억)
- 못 찾으면 기존처럼 `null` 반환 (가짜 카드 금지).

## Step 3 — 낡은 견본 설명 정리

- `exposure-rules.js` 43행: `demo_prime_filled 는 게스트 시드 전용` 삭제 → `유료 업체만`
- `29-exposure-gnb-decisions.md` 76행: `demo_prime_tutor_pool` → 취소선 + `2026-10-09 삭제됨` 표기
- `EXPOSURE-REPORT.md`: `exposure-data.js` 설명을 `빈 그릇, exposure-bridge가 채움, 표본 밖은 공용 조회`로 갱신. 실DB 연결 상태 반영.
- `exposure-data.js` 맨 위 주석: `표본 밖 카드는 exposure-lookup → provider-item-registry 공용 조회` 한 줄 추가.
- `git grep demo_prime -- preview` = 0건 ✓

## 범위 밖으로 남긴 것

- `myshop/public-resolve.js` `EXPOSURE_STUDY_ROOMS.find(...)` — 마이샵은 300-2부터 범위 밖. `public.php` API가 먼저라 정상 경로는 이미 동작.
- `REAL_DB_CAP` 값·`exposure-bridge.js` 미변경
- `provider-item-registry.js` 동작 미변경
- `plans/history-mock.js`·promo mock CSS·홈팝업 demo 미리보기 — 이름만 mock, 이번 대상 아님

Node 없음 — `scripts/verify-no-sample-data.mjs`·Playwright는 그록봇 검수.
