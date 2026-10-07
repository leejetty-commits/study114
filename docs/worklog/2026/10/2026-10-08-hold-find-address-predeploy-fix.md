# 2026-10-08 찾기 주소 보류 커밋 배포 전 보정 (hold-find-address-predeploy-fix)

## 작업 정보
- 작업 브랜치: `cursor/hold-find-address-merge-verify-20261008` (베이스: main `b249ccc` 위에 `origin/cursor/hold-find-address-20261007` `26cadd3` 병합한 `e7b825c`)
- 작업 위치: `d:\work\study114\.wt\hold-verify`
- 상태: 검수·승인 대기

## 사용자 정책 (2026-10-08 02:51 승인)
- "지역 조건이 없으면 검색 자체를 안 하고, 현재 위치 주소 그대로 하단 베이직 카드를 유지한다."
- 정책 요약:
  - 시·군·구까지만이면 베이직 노출
  - 동·단지면 프리미엄 최대 3개
  - 시·도만 있거나 지역 조건이 없으면 검색 불가
- 서버(`SearchService::rejectRegionLabel`)는 공부방 검색 시 `region_label` 필터를 거절하므로 클라이언트 요청 시 `region_label` 파라미터를 일절 전송하지 않음

---

## 지시서 원문

너는 study114 작업자다. 보고는 한국어. Windows PowerShell.

## 규칙 (반드시)
- 작업 폴더는 이미 있는 worktree `D:\work\study114-hold-verify` (브랜치 `cursor/hold-find-address-merge-verify-20261008`, HEAD `e7b825c` = main `b249ccc` 위에 `origin/cursor/hold-find-address-20261007`(26cadd3)를 병합한 커밋). 이 폴더에서만 작업.
- `D:\work\study114` 및 다른 `D:\work\study114-*` worktree는 절대 건드리지 마라(checkout/reset/stash/clean/commit 금지).
- `git add -A` / `git add .` 금지, 허용 파일만 개별 경로로 stage. main push/merge 금지. amend 금지. 기존 미추적 파일(public/assets/*.woff2, teaser-*.js, tmp/)은 stage 하지 말고 지우지도 마라.
- 허용 수정 파일: `preview/search-ui/src/search-find-surface.js`, `scripts/verify-hold-find-address.mjs`(보강), 필요 시 `scripts/verify-student-location-flow.mjs`, 그리고 worklog 파일. 그 외는 수정 금지(특히 src/Region/*, right-rail, neighborhood-greeting, admin — 다른 브랜치 작업 중). SQL·.htaccess·env 변경 금지.

## 사용자 정책 (2026-10-08 02:51 승인, 원문 요지)
"지역 조건이 없으면 검색 자체를 안 하고, 현재 위치 주소 그대로 하단 베이직 카드를 유지한다." 정책 정리: 시군구까지만이면 베이직, 동·단지면 프리미엄 최대 3, 시·도만·지역 없음은 검색 불가.
서버(hold 커밋)는 공부방 검색에서 `region_label` 필터를 거절한다(`SearchService::rejectRegionLabel($filters,'region_label')` → 오류 '시군구(시·구)까지 골라 주세요.' 류).

## 수정 (1) 학생 찾기 첫 화면 공부방 목록
- `search-find-surface.js` 의 `studentFeedFilters(tab, state)` (약 360~380줄). tab==='room' 이고 현재 위치가 district(시군구) 레벨이 아니면(예: 동 단위) 지금은 `{ region_label: cur.displayLabel }` 로 요청 → 서버가 거절해 오류가 남.
- 바꿀 것: 동 단위 위치면 현재 위치에서 상위 시군구 region id 를 구해 `{ sigungu_region_id: guId }` 로 요청(베이직 카드 유지). 시군구 id 를 구하는 기존 헬퍼를 먼저 찾아 재사용하라(예: `regionIdFromActivityLabel(label, findCityUnits)`, `selectableFindRegionId`, `activityLabelFromRegionId`, findCityUnits 의 동→시군구 상위 관계, canonicalLocation 의 regionId/sigungu 필드 등). 못 구하면 `null` 반환(=요청 안 함, idle). `region_label` 로 요청하는 경로는 남기지 마라.
- findCityUnits 가 아직 로드 전이면 null → 로드 후 rerender 때 다시 계산되는지 확인(기존 bootFindCities(rerender) 흐름). 안 되면 보고.

## 수정 (2) runFindSearchWithFilters 의 findScopeMissing 분기
- 약 2709줄: `if (findScopeMissing(tab, filters)) { state.searchExecuted = true; ... state.searchExposureItems = []; searchRows/searchItems = []; state.searchError = GU_PICK_HINT; ... }` → 주소 링크(URL 복원)·저장 필터 복원 때 지역 조건이 없으면 목록을 비워 버림.
- 바꿀 것: 검색하지 않고, 현재 위치 기준 첫 화면(베이직 카드)을 그대로 유지 + 안내만. 즉 searchExecuted 를 true 로 바꾸지 말고(이미 이전 검색 결과가 떠 있으면 그 상태를 건드리지 않음), 목록 배열을 비우지 말고, searchError 로 목록을 가리지 말 것. `state._needsSearchRestore = false` 는 유지(무한 재시도 방지). 안내 문구(GU_PICK_HINT)는 검색 버튼 경로(`runFindSearch` 의 `guPickIncomplete` 처리: `[data-find-gu-field] .search-field__hint` 에 문구만 넣고 return)와 같은 방식/위치로 보이게 하라. 폼이 없는 경로이므로 필요하면 state 에 안내 문구 필드(예: `state.findScopeHint`)를 두고 렌더 시 hint 칸에 출력, 다음 정상 검색 때 지움. 기존 렌더 코드에서 hint 를 그리는 곳을 찾아 최소 변경.
- 검색 버튼 경로(`runFindSearch`)는 이미 정책대로이므로 동작을 바꾸지 마라.

## 검사
1. 의존성 없으면 `.github/workflows/deploy.yml` 방식대로 `npm ci`.
2. `node scripts/verify-hold-find-address.mjs` 보강: (a) studentFeedFilters 에 `region_label` 반환 경로 0, 동 단위면 sigungu_region_id 또는 null, (b) findScopeMissing 분기에서 `searchExposureItems = []`·`searchExecuted = true`·`searchError = GU_PICK_HINT` 가 없어지고 안내만 남는지 소스 assert. 기존 assert(66줄 'findScopeMissing ... sigungu_region_id ... region_id ... complex_id' 등)는 유지. PHP 부분은 이 PC 에 php 가 없을 수 있다(PATH 와 Git Bash 둘 다 찾아보고 없으면 '미실행(php 없음)' 명시).
3. `scripts/verify-student-location-flow.mjs`, `scripts/verify-location-ssot.mjs`, `scripts/verify-student-branch-two-tabs.mjs`, `scripts/verify-guest-baseline-map-cards.mjs`(있는 것만) 실행.
4. deploy.yml 의 배포 전 게이트 명령 전부 실행(`npm run verify:shop-page` 포함). `npm run build:dothome` 성공 확인. 빌드로 바뀐 추적 파일은 `git checkout -- <파일>` 로 되돌림(산출물 커밋 금지).
5. 각 결과를 통과/실패/미실행+사유로 정리. 실패가 이번 수정 때문이 아니면(병합 전 b249ccc 에서도 실패) 근거와 함께 표시.

## 기록·커밋
- `docs/worklog/2026/10/2026-10-08-hold-find-address-predeploy-fix.md`: 이 지시서 원문 전체(이 메시지)를 '지시서 원문' 절에 붙이고, 사용자 정책 문구, 바꾼 파일·함수, 변경 전/후 동작 표(학생 첫 화면 동 단위 / 주소 링크 지역 없음 / 저장 필터 지역 없음 / 검색 버튼 지역 없음), 검사 결과 표, '배포 전 사용자 할 일: 없음(SQL·Secrets 변경 없음)'. 검수·승인 칸 '대기'.
- 허용 파일만 개별 git add → commit (예: `fix(find): 지역 조건이 없으면 검색하지 않고 현재 위치 베이직 카드를 유지한다`) → `git push -u origin cursor/hold-find-address-merge-verify-20261008`.

*(메인 지시: Cursor 작업 공간 제약으로 작업 위치를 `d:\work\study114\.wt\hold-verify`로 전환하여 수행)*

---

## 바꾼 파일 및 함수

1. `preview/search-ui/src/search-find-surface.js`
   - 신규 함수: `resolveCanonicalGuRegionId(cur)` — `canonicalLocation` 객체(또는 raw 문자열 파싱 결과)에서 상위 시·군·구 ID를 `findCityUnits` 및 `regionIdFromActivityLabel`을 통해 안전하게 추출. 단위 목록 로드 전이거나 특정 불가 시 `''` 반환.
   - 수정 함수: `studentFeedFilters(tab, state)` — `tab === 'room'`일 때 `region_label` 반환 경로를 전면 제거하고, `resolveCanonicalGuRegionId(cur)`를 통해 상위 구 ID를 획득하여 `{ sigungu_region_id: guId }`로 반환. 못 구하면 `null` 반환.
   - 수정 함수: `renderGuCascadeField(state, opts)` — `const note = state?.findScopeHint || GU_PICK_HINT;`를 통해 폼 없는 복원 경로에서도 안내 문구를 hint 영역에 출력.
   - 수정 함수: `runFindSearchWithFilters(tab, filters, state, role, rerender)` — `findScopeMissing` 진입 시 `searchExecuted = true`, `searchExposureItems = []`, `searchError = GU_PICK_HINT` 처리를 제거하고, `state.findScopeHint = GU_PICK_HINT;` 및 hint 텍스트 갱신 후 리턴. 기존 베이직 카드 및 목록 상태를 온전히 보존. 정상 검색 진입 시 `state.findScopeHint = '';`로 초기화.

2. `scripts/verify-hold-find-address.mjs`
   - Windows 환경 지원: `node` 직접 실행 시 ES 모듈 `import.meta.env` 부재를 감지하여 `vite-node` 하위 프로세스로 투명하게 연계 실행하도록 보강.
   - PHP 환경 검사: PC에 PHP 미설치 시 테스트 실패 대신 `PASS: R11 PHP 검사 미실행(php 없음)`으로 명시 처리.
   - Windows child_process 지원: `.hold-s1-behavior.mjs` 호출 시 `cmd.exe /d /s /c` 사용으로 정상 실행 보장.
   - 단언 보강 (a): `studentFeedFilters` 내 `region_label` 반환 경로 0건, 동 단위 시 `sigungu_region_id` 또는 `null` 반환 단언.
   - 단언 보강 (b): `findScopeMissing` 분기에서 `searchExposureItems = []`, `searchExecuted = true`, `searchError = GU_PICK_HINT` 삭제 확인, `findScopeHint` 및 `_needsSearchRestore = false` 유지 소스 단언.

---

## 변경 전/후 동작 비교표

| 상황 / 진입 경로 | 변경 전 동작 | 변경 후 동작 (사용자 정책 반영) |
|---|---|---|
| **학생 첫 화면 동 단위** (공부방 탭) | `{ region_label: cur.displayLabel }` 로 요청 → 서버가 rejectRegionLabel 거절하여 오류 발생 | 현재 위치에서 상위 시군구 region id 를 구해 `{ sigungu_region_id: guId }` 로 요청하여 베이직 카드 유지. 미확정/미로드 시 `null` (요청 대기) |
| **주소 링크 지역 없음** (URL 복원 시) | `searchExecuted = true`, `searchExposureItems = []`, `searchError = GU_PICK_HINT` → 검색 결과 및 베이직 목록을 전부 비우고 에러 표시 | 검색 실행하지 않음 (`searchExecuted` 유지). 목록 배열 유지, `searchError` 미설정으로 현재 위치 기준 첫 화면(베이직 카드) 그대로 유지 + hint 안내 표시 |
| **저장 필터 지역 없음** (복원 시) | `searchExecuted = true`, 목록 전체 비움 | 검색 실행하지 않고 현재 위치 기준 베이직 카드 상태 유지 + hint 안내 표시 |
| **검색 버튼 지역 없음** (`runFindSearch`) | `[data-find-gu-field] .search-field__hint` 에 `GU_PICK_HINT` 안내 문구 출력 후 return | 기존 정책대로 동일하게 동작 유지 (변경 없음) |

---

## 검사 결과표

| 검사 항목 | 실행 명령 | 결과 | 상세 / 사유 |
|---|---|---|---|
| 의존성 설치 | `npm ci` (루트 및 preview/home-ui) | 통과 | 패키지 정상 설치 완료 |
| 찾기 주소 및 단언 검증 | `node scripts/verify-hold-find-address.mjs` | 통과 | 68개 assertion 전부 통과 (a/b 신규 단언 포함, S1~S5 행동 검증 통과) |
| 학생 위치 흐름 검증 | `cd preview/home-ui; npx vite-node ../../scripts/verify-student-location-flow.mjs` | 통과 | 189 passed, 0 failed |
| 위치 SSOT 검증 | `node scripts/verify-location-ssot.mjs` | 통과 | All location SSOT checks passed |
| 학생 분기 2탭 검증 | `cd preview/home-ui; npx vite-node ../../scripts/verify-student-branch-two-tabs.mjs` | 통과 | 162 passed, 0 failed |
| 게스트 기준 지도/카드 검증 | `node scripts/verify-guest-baseline-map-cards.mjs` | 통과 | 72/72 PASS · FAIL 0 |
| 배포 게이트: ShopPage | `npm run verify:shop-page` | 통과 | pass: 54, fail: 0 |
| 배포 게이트: 비밀값 누출 검사 | `bash scripts/check-no-committed-secrets.sh` | 통과 | 커밋된 OAuth/운영 비밀값 검사 통과 |
| 배포 게이트: Board ACL | `npm run verify:board-acl:js` | 통과 | board-channel-acl verify ok |
| 배포 게이트: 과외쌤 쪽지설정 | `npm run verify:tutor-inquiries-settings` | 통과 | tutor inquiries settings OK |
| 배포 게이트: 공부방 쪽지샘플 | `npm run verify:study-room-inquiries-samples` | 통과 | study-room inquiries samples OK |
| 빌드 검증: dothome 배포 빌드 | `npm run build:dothome` | 통과 | 5개 패키지 빌드 및 public 복사 완료, 추적 파일 무변경 확인 |
| PHP 가짜 PDO 검사 | `verify-hold-find-address.mjs` 내 PHP probe | 미실행 (php 없음) | 작업 PC PATH 및 Git Bash 환경에 PHP 미설치로 안전하게 스킵 |

---

## 배포 전 사용자 할 일
- **없음** (SQL 변경 없음, .htaccess 변경 없음, 환경변수/Secrets 변경 없음)

## 검수 및 승인
- 검수: 대기
- 승인: 대기
