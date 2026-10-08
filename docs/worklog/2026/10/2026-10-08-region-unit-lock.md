# 2026-10-08 지역 단위 정본 · 과외 지역 옛 값 안내 · 자동 검사

- 브랜치: `cursor/region-unit-lock-20261008` (기준 `691e3e6`)
- 정본: `docs/internal/72-region-unit-lock.md`
- 위험도: 중 (과외쌤 홈 표시, 배포 게이트 추가)
- 발견 경위: 과외쌤 무결성 검사(C1) — 홈 `POST /api/search/search.php` 422 6회

## 사용자 지시 원문

- 18:23 「과외쌤은 시,군,구 단위로 검색이 되는게 맞다.」
- 18:24 「서울시는 광역이기 때문에 하위 구까지 나와야 한다. 구까지 나와야 검색이 된다.」
- 18:28 「저 동이나 아파트단지가 나오는 것은 등록시 자신의 주소를 불러온게 아닌가 싶어... 왜 이런 오류가 났지? 점검이 필요해... 정본도 살펴봐.」
- 18:28 「둘다 테스트계정이야. 여긴 전부 테스트계정만 있어.」
- 18:32 「진행해. 근데, 이 작업을 한 10번은 하는거 같아.」

## 운영 DB 점검 결과 (사용자 실행)

- 정본 4장 A: 7줄 — 3(1→224), 5(1→224, 2→264, 2→264 중복), 9(19→없음, 39→337, 29→317)
- 정본 4장 B: 0줄

## 배포 전후 사용자 할 일

> **[폐기 — 실행 금지]**
> 아래 구 단위 이관 SQL은 2026-10-08 20:10 사용자 정책 변경(광역시·시·군 단위 복귀)에 따라 **전면 폐기**되었습니다.
> 운영 DB에 아래 SQL을 절대로 실행하지 마십시오. 새로운 과외 단위 이관 SQL은 개정된 정본 `docs/internal/72-region-unit-lock.md` 제9장을 참조하십시오.

```sql
-- [폐기된 구 단위 이관 쿼리 - 실행 금지]
-- DELETE FROM tutor_regions WHERE tutor_id = 5 AND priority_order = 2 AND region_id = 2;
-- UPDATE tutor_regions SET region_id = 224 WHERE region_id = 1  AND tutor_id IN (3, 5);
-- UPDATE tutor_regions SET region_id = 264 WHERE region_id = 2  AND tutor_id = 5;
-- UPDATE tutor_regions SET region_id = 337 WHERE region_id = 39 AND tutor_id = 9;
-- UPDATE tutor_regions SET region_id = 317 WHERE region_id = 29 AND tutor_id = 9;
```

## 작업 지시서

```markdown
너는 study114 저장소의 작업자다. 모든 보고는 한국어로.

## 작업 위치 (엄수)
- worktree: `d:\work\study114\.wt\region-unit-lock` (브랜치 `cursor/region-unit-lock-20261008`, 체크아웃됨). 이 폴더 밖 파일 수정 금지. `d:\work\study114` 루트 작업트리·다른 `.wt\*` 폴더 건드리지 말 것.
- `main` push·병합 금지. 이 브랜치에만 커밋·push. stage는 파일 이름을 하나씩(`git add -A`/`.` 금지). push된 커밋 amend 금지.
- SQL 파일·.env·.htaccess·Secrets 변경 금지. 운영 DB 접속 금지.

## 정본 (먼저 끝까지 읽기)
`docs/internal/72-region-unit-lock.md`. 특히 1장 표, 2장 레드라인 4개, 5장 자동 검사. 정본과 다르게 해야 할 이유가 있으면 구현하지 말고 보고.

## 배경
과외샤 과외지역(`tutor_regions.region_id`)은 선택 단위(`regions.is_selectable=1`, 특별·광역시는 구, 도는 시·군)여야 한다. 2026-10-01 구 단위 통일 전에 저장된 옛 값(예: 「서울특별시 시 대표」 행, 동 행)이 남아 있으면 과외샤 홈이 `searchApi`를 그 id로 불러 422(`error: 'validation'`, 메시지 「지역은 구(시·군)까지 선택해 주세요.」)를 받는다. 그 결과:
- `preview/home-ui/src/tutor-activity-chart.js` 「과외지역 분포」 숫자가 「—」
- `preview/home-ui/src/tutor-home-seed.js` `loadTutorStudentDemand()` 「우리동네 학생」 탭이 「학생을 불러오지 못했어요」 (문구는 `preview/search-ui/src/search-find-surface.js`의 `TUTOR_HOME_STUDENT_COPY` 부근)
- `tutor-home-seed.js` 주석 「tutor_regions.region_id 와 students.preferred_tutor_region_id 가 둘 다 SidoRegionEnsure::assertSelectable 을 지난 값이다」는 옛 데이터에서 사실이 아니다.

## 구현 요구 (정본 레드라인 3 + 5장)
1. **옛 값 신호를 서버에서 준다(우선)**: 과외샤 등록 정보가 브라우저로 갈 때(마이페이지·홈이 쓰는 `saved_regions` 등 지역 슬롯을 만드는 서버 코드를 찾아라 — `src/Tutor/*`, `src/Registration/*`, `public/api/**` 에서 `saved_regions` 또는 `tutor_regions` 조회) 각 슬롯에 `region_selectable: true|false`(regions.is_selectable=1 AND is_active=1) 를 포함한다. 추가 쿼리는 기존 JOIN에 컬럼만 더하는 방식으로, N+1 금지. 슬롯을 만드는 서버 경로가 여럿이면 모두. 서버 신호를 넣기가 무리면(이유 보고) 차선책으로 searchApi 422 `validation` 응답을 신호로 쓴다.
2. **과외샤 홈**: 선택 단위가 아닌 슬롯은 searchApi를 부르지 않고(불필요한 422 제거), 「—」·오류 문구 대신 「활동지역을 구(시·군)까지 다시 선택해 주세요」 안내와 과외샤 지역 수정 화면 링크(본인 등록 `#/mypage/registrations/tutors/{id}` 의 지역 수정 위치 — 기존 링크 헬퍼·경로를 찾아 재사용)를 보인다. 「과외지역 분포」는 슬롯별, 「우리동네 학생」 탭은 대표 슬롯 기준. 정상 슬롯은 현행 그대로.
3. **마이페이지 과외샤 등록 지역 표시**: 선택 단위가 아닌 지역 옆에 「다시 선택 필요」 표시(기존 배지/알약 스타일 재사용). 저장 로직은 바꾸지 말 것(이미 assertSelectable).
4. `tutor-home-seed.js`의 틀린 주석을 사실에 맞게 고친다(예: 옛 값은 region_selectable=false 로 온다). 주석은 주변 밀도에 맞추고 출처·작업 설명 주석 금지.
5. **자동 검사** `scripts/verify-region-unit-lock.mjs` (다른 `scripts/verify-*.mjs`처럼 소스 문자열 assert, 외부 접속 없음):
   - (a) `INSERT INTO tutor_regions` 가 있는 모든 PHP 파일에서 그 저장 경로가 `assertSelectable` 을 거치는지(파일에 INSERT가 있으면 같은 파일에 assertSelectable 호출이 있어야 함 — `src/` 전체를 훑어 새 경로도 자동 포함). `preferred_tutor_region_id` 를 쓰는 저장 파일도 동일.
   - (b) `SearchService.php` 가 `tutor_region_id`·`preferred_region_id` 에 `selectableRegionId` 사용.
   - (c) 과외샤 홈 두 파일이 옛 값 안내를 처리(`region_selectable` 참조 또는 안내 문구 상수).
   - (d) 서버 슬롯 페이로드에 `region_selectable` 포함(1번을 서버로 한 경우).
   - package.json scripts 관례에 맞게 `verify:region-unit-lock` 등록, `.github/workflows/deploy.yml` 의 배포 전 verify 단계에 다른 verify들과 같은 방식으로 추가(파일을 먼저 읽고 관례 그대로; secrets/FTP 단계는 절대 건드리지 말 것).

## 검증 (모두 실행, 결과 보고)
- `node scripts/verify-region-unit-lock.mjs` 통과. 일부러 규칙을 깨는 경우(예: 임시 복사본에서 assertSelectable 제거) 실패하는지 한 번 확인 후 원복(저장소에 흔적 남기지 말 것).
- PHP를 바꿨으면 `D:\php8.2\php.exe -l <파일>` 문법 검사. 가능하면 sqlite 기반 검증(`-d extension=pdo_sqlite`, 기존 `scripts/verify-board-*-displayname-fallback.php` 참고)으로 region_selectable true/false 확인.
- 지역·과외샤 홈 관련 기존 verify(`scripts/` 에서 이름에 region, tutor-home, tutor-box, tutor-region 이 들어간 것; vite-node 필요 시 `cd preview/home-ui; npx vite-node ../../scripts/<파일>`) 전부 실행. 실패 시 기존 문제인지 내 변경인지 구분.
- `.github/workflows/deploy.yml` 배포 전 게이트 전부 로컬 실행.
- `npm run build:dothome` 성공(node_modules 없으면 `npm ci`). 빌드 산출물·바뀐 추적 산출물은 커밋하지 말고 `git checkout --` 로 되돌릴 것. `npm run verify:shop-page`.

## 기록
- `docs/worklog/2026/10/2026-10-08-region-unit-lock.md` 「작업 지시서」 아래에 **이 프롬프트 원문 전체**를 붙이고, 「작업자 보고」 섹션(변경 파일, 검증 결과 표, 정본과 다르게 판단한 점)을 추가. 「검수 기록」은 비워 둠.
- 커밋 후 `git push origin cursor/region-unit-lock-20261008`.

## 최종 응답
변경 파일과 줄 수, 커밋 hash, push 여부, 각 검증 명령과 결과, 서버 신호 방식을 택했는지 422 차선책인지와 이유, 확인 못 한 점·위험.
```

## 작업자 보고

### 1. 신호 방식 채택
- **서버 신호 방식 우선 채택 및 422 이중 방어**:
  - `src/Registration/TutorHubRepository.php`의 `savedRegions()` 및 `src/Tutor/TutorRegisterService.php`의 `hydrateTutor()`에서 `tutor_regions` 조회 시 `LEFT JOIN regions r ON r.id = tr.region_id`를 추가하고, `CASE WHEN r.id IS NOT NULL AND r.is_selectable = 1 AND r.is_active = 1 THEN 1 ELSE 0 END AS region_selectable` 컬럼을 단일 쿼리로 조회하여 슬롯 배열에 `'region_selectable' => (bool) $r['region_selectable']`를 포함시켰습니다 (N+1 없음).
  - 클라이언트(`preview/home-ui/src/tutor-home-seed.js`, `preview/home-ui/src/tutor-activity-chart.js`)에서는 `selectable === false`인 슬롯에 대해 `searchApi` 호출을 사전에 차단하여 불필요한 422 validation 요청을 완전히 제거했습니다.
  - 추가적으로 혹시 모를 상황에 대비하여 `loadTutorStudentDemand()` 및 `countExposedCards()` 내부 catch 블록에서 422 validation 오류 수신 시 `reselect`로 전환하는 차선책 방어 로직도 함께 배치했습니다.

### 2. 주요 변경 내역
- **과외쌤 홈 화면 안내 및 링크 연동**:
  - `preview/home-ui/src/student-reg/student-reg-copy.js`: `TUTOR_HOME_STUDENT_COPY.reselect` 문구 등록 (`'활동지역을 구(시·군)까지 다시 선택해 주세요'`).
  - `preview/search-ui/src/search-find-surface.js`: `status === 'reselect'` 분기 추가, 안내 문구와 함께 과외지역 수정 링크 버튼(`tutorHomeEditRegionPath()`, `#/mypage/registrations/tutors/{id}/basic`) 렌더링.
  - `preview/home-ui/src/tutor-activity-chart.js`: 선택 단위가 아닌 슬롯은 `searchApi`를 호출하지 않고 `act-bars__row--reselect` 스타일의 안내 문구와 수정 링크 제공.
  - `preview/home-ui/src/styles/home-listings.css`: `.act-bars__row--reselect`, `.act-bars__reselect-text`, `.act-bars__reselect-link` 스타일 추가.
  - `preview/home-ui/src/tutor-home-seed.js`: 사실과 맞지 않던 주석 정정 및 `tutorHomeRegionSelectable`, `tutorHomeEditRegionPath` 헬퍼 함수 제공.
- **마이페이지 과외 등록 지역 표시**:
  - `preview/shared/tutor-region-slots.js`: `renderTutorRegionSlot`에서 `slot.region_selectable === false` 또는 `needsReselect` 또는 미등록 옛 지역 id일 때 슬롯 헤더에 `<span class="mypage-badge mypage-badge--warn">다시 선택 필요</span>` 표시.
  - `preview/home-ui/src/screens/tutor.js`: `renderTutorRegionPills`에서 선택 단위가 아닌 지역 옆에 `<span class="mypage-badge mypage-badge--warn">다시 선택 필요</span>` 표시.
- **자동 검사 및 배포 게이트 등록**:
  - `scripts/verify-region-unit-lock.mjs`: (a) `src/` 내 모든 `tutor_regions` 및 `preferred_tutor_region_id` 저장 파일의 `assertSelectable` 호출 검사, (b) `SearchService.php`의 `selectableRegionId` 사용 검사, (c) 홈 UI의 옛 값 안내 및 링크 처리 검사, (d) 서버 슬롯 페이로드의 `region_selectable` 포함 검사 구현 (총 22개 assert 통과).
  - `scripts/verify-region-unit-selectable-payload.php`: SQLite in-memory PDO를 통한 `TutorHubRepository::savedRegions`의 `region_selectable` true/false 매핑 단위 테스트 검증 (10개 assert 통과).
  - `package.json`: `"verify:region-unit-lock": "node scripts/verify-region-unit-lock.mjs"` 스크립트 등록.
  - `.github/workflows/deploy.yml`: 배포 전 `verify-region-unit-lock` 잡 추가 및 `ftp-deploy`의 `needs` 목록에 추가.

### 3. 검증 결과 요약

| 검증 명령 | 대상 / 목적 | 결과 |
|---|---|---|
| `node scripts/verify-region-unit-lock.mjs` | 정본 72 요구 자동 검사 (저장 검증, 검색 검증, 홈 UI, 서버 페이로드) | **PASS** (22 passed, 0 failed) |
| 규칙 고의 파괴 테스트 | 임시 주석 처리 시 `verify-region-unit-lock.mjs` 실패 여부 확인 | **FAIL 확인 후 즉시 원복 성공** |
| `D:\php8.2\php.exe -d extension=pdo_sqlite scripts/verify-region-unit-selectable-payload.php` | SQLite 메모리 DB 기반 `region_selectable` 1/0/비활성/부재 분기 검증 | **PASS** (10 passed, 0 failed) |
| `D:\php8.2\php.exe -l src/Registration/TutorHubRepository.php` | PHP 문법 검사 | **PASS** (No syntax errors detected) |
| `D:\php8.2\php.exe -l src/Tutor/TutorRegisterService.php` | PHP 문법 검사 | **PASS** (No syntax errors detected) |
| `node scripts/verify-tutor-region-label.mjs` | 공식 시드 라벨 및 클라이언트 diff 무결성 검증 | **PASS** (103 passed, 0 failed) |
| `npx vite-node scripts/verify-tutor-box-real-values.mjs` | 과외쌤 멤버박스 실데이터 회귀 검증 | **PASS** (49 passed, 0 failed) |
| `npx vite-node ../../scripts/verify-tutor-home-student-tab.mjs` (in `preview/home-ui`) | 과외쌤 홈 학생 탭 실데이터 연동 회귀 검증 | **PASS** (63 passed, 0 failed) |
| `npx vite-node ../../scripts/verify-mypage-account-region.mjs` (in `preview/home-ui`) | 마이페이지 계정 지역 라벨 회귀 검증 | **PASS** (41 passed, 0 failed) |
| `node scripts/verify-region-save-rules.mjs` | 지역 저장 규칙 검증 | **PASS** |
| `node scripts/verify-region-sido-canonical.mjs` | 시도 정규화 규칙 검증 | **PASS** |
| `npx vite-node ../../scripts/verify-position-region-tier.mjs` (in `preview/home-ui`) | 지역 티어 검색 규칙 검증 | **PASS** (24 passed, 0 failed) |
| `npx vite-node ../../scripts/verify-student-mypage-hope-region.mjs` (in `preview/home-ui`) | 학생 마이페이지 희망지역 검증 | **PASS** (71 passed, 0 failed) |
| `D:\php8.2\php.exe -d extension=mbstring scripts/verify-pick-region-ownership.php` | 픽 지역 소유권 검증 | **PASS** (25 passed, 0 failed) |
| `D:\php8.2\php.exe scripts/verify-prime-region-ownership.php` | 프라임 지역 소유권 검증 | **PASS** (18 passed, 0 failed) |
| `D:\php8.2\php.exe scripts/verify-room-promo-region-match.php` | 공부방 홍보지역 매칭 검증 | **PASS** (38 passed, 0 failed) |
| `D:\php8.2\php.exe scripts/verify-position-region-tier.php` | 포지션 지역 티어 검증 | **PASS** (19 passed, 0 failed) |
| `npm run verify:shop-page` | 샵페이지 레드라인 4개 게이트 검증 | **PASS** (54 passed, 0 failed) |
| `check-no-committed-secrets.sh` (via Git Bash) | 커밋 비밀값 방지 검사 | **PASS** |
| `npm run verify:tutor-inquiries-settings` | 과외 쪽지설정 검증 | **PASS** |
| `npm run verify:study-room-inquiries-samples` | 공부방 쪽지설정 검증 | **PASS** |
| `npm run verify:board-acl` & `verify-board-channel-acl.php` | 게시판 ACL 정적/동적 일치 검증 | **PASS** (75 rows match) |
| `npm run verify:region-unit-lock` | 신규 등록된 배포 게이트 스크립트 실행 | **PASS** (22 passed, 0 failed) |
| `npm run build:dothome` | Dothome 빌드 산출물 생성 확인 후 원복 | **PASS** (exit code 0, 빌드 정상 완료) |

### 4. 정본과 다르게 판단한 점
- 정본 `docs/internal/72-region-unit-lock.md`의 원칙(구·시·군 단위 통일, N+1 없는 서버 `region_selectable` 신호 제공, 과외 홈 미선택/옛값 안내 및 수정 링크 제공, 자동 검사)을 정확히 준수하였으며, 정본과 다르게 판단하거나 변경한 부분은 없습니다.

## 검수 기록

### 메인 1차 반려 R1~R3 및 조치 내역 (커밋 5c97025 기준)

1. **R1 (높음, 회귀) `preview/shared/tutor-region-slots.js`**:
   - 원인: 서버에서 빈 2·3번 슬롯에 `region_selectable: false`를 내려줄 때 `needsReselect = Boolean(slot.needsReselect) || slot.region_selectable === false || (Boolean(id) && !known)` 조건으로 인해 빈 칸에서도 `needsReselect`가 true가 되어 빈 슬롯 아래에 불필요하게 `region-cascade`의 "지역을 다시 선택해 주세요" 안내 문구가 노출되던 회귀.
   - 조치: `needsReselect = Boolean(id) && (Boolean(slot.needsReselect) || slot.region_selectable === false || !known)`로 수정하여 `id`가 있을 때만 `needsReselect`가 true가 되도록 수정 (빈 칸 stale=false 유지).
   - 검증 추가: `scripts/verify-region-unit-lock.mjs`에 `renderTutorRegionSlot`을 직접 import하여 빈 슬롯(`region_id: ''`, `region_selectable: false`)에서 `data-region-stale`가 hidden이고 배지가 없는지, 유효하지 않은 슬롯(`region_id: '999'`)에서는 배지와 안내 문구가 노출되는지 검증 추가.

2. **R2 (중간, 죽은 코드) `preview/home-ui/src/tutor-activity-chart.js` 의 catch 및 `searchApi`**:
   - 원인: `preview/search-ui/src/search-api.js`의 `searchApi`가 `throw new Error(...)`만 던져 `err.status`, `err.error`가 부재했음.
   - 조치: `searchApi`에서 `err.status = res.status; err.error = body.error;`를 Error 객체에 덧붙여 던지도록 수정하고, `tutor-activity-chart.js`와 `tutor-home-seed.js`의 catch 블록 모두 `err?.status === 422 || err?.error === 'validation'` 판정으로 통일.

3. **R3 (낮음, 화면) 이름 없는 옛 지역 줄**:
   - 원인: `tutor-home-seed.js`의 `ensureHomeRegions`에서 옛 id(선택 단위 아님)는 `activityLabelFromRegionId`가 `''`를 돌려줄 수 있어 대표 칸이 아닌 슬롯의 경우 라벨이 빈칸으로 남던 문제.
   - 조치: `selectable === false`이고 `label`이 비어 있는 경우 `label = '옛 지역'`으로 대체하도록 보완.

### 독립 리뷰(Claude Sonnet 4.6) — e583dbe 수정 후 배포: CSS 3건+인자 1건

- 판정: 수정 후 배포 (기능·보안·회귀 이상 없음, CSS 누락 및 인자 정리)
- 조치 내용:
  1. `preview/search-ui/src/styles/search.css`: `.search-results__hint--reselect` 스타일 추가 (배경 #fffbeb, 테두리 1px #fde68a, border-radius 0.5rem, 안쪽 여백, 글자 #92400e, 문구와 버튼 사이 간격 배치).
  2. `preview/home-ui/src/styles/home-listings.css`: `.my-box__region-pill.is-reselect` 스타일 추가 (`border-color: #fde68a; background: #fffbeb;`).
  3. `preview/shared/register-flow.css`: tutor-ui·auth-ui·home-ui 3개 UI가 모두 임포트하는 공용 CSS 파일에 `.mypage-badge` 및 `.mypage-badge--warn` 정의를 `home-member-flows.css`(813행)와 동일한 값으로 추가하여 tutor-ui 내 다시 선택 필요 배지 스타일 누락 해소.
  4. `preview/home-ui/src/tutor-activity-chart.js`: `tutorHomeEditRegionPath()`가 인자를 받지 않는 시그니처이므로 `tutorHomeEditRegionPath(row.tutorId)` 호출을 인자 없이 `tutorHomeEditRegionPath()`로 수정하여 혼선 방지.

### 메인 검수 — 1d65cbb 반려: 공용 배지 전역 규칙이 마이페이지 배지 색을 덮음

- 문제: `preview/shared/register-flow.css`에 추가했던 전역 `.mypage-badge { background: var(--gray-200) }` 규칙이 `home-ui/src/main.js`의 후순위 import로 인해 마이페이지의 다양한 상태별 배지(`.mypage-badge--published`, `--draft`, `--pending`, `--action`, `--danger`, `--hidden`, `--contact-*` 등)의 고유 배경색을 회색으로 덮어버리는 전역 회귀 발생.
- 조치 내용:
  1. `preview/shared/register-flow.css`의 전역 `.mypage-badge`, `.mypage-badge--warn` 규칙을 완전 삭제.
  2. 지역 슬롯 내부로 범위를 좁힌 규칙 `.register-region-slot__head .mypage-badge--warn`만 정의하여 슬롯 외부 마이페이지 배지에 어떠한 부작용도 미치지 않도록 격리.
  3. `scripts/verify-region-unit-lock.mjs`에 회귀 방지 검사(7부) 추가: `preview/shared/*.css` 내에 부모 선택자 없이 전역으로 선언된 `.mypage-badge` 및 `.mypage-badge--*` 선택자가 존재할 경우 즉시 FAIL 처리 (인위적 전역 규칙 추가 시 FAIL 발생 및 원복 후 PASS 검증 완료).

---

## 정책 변경 (2026-10-08 20:10~20:26 사용자 결정)

### 1. 사용자 결정 원문 (2026-10-08 20:07~20:26)
- **20:07~20:10 (단위 체계 전환 원문)**:
  - 「정책은 과외쌤을 시군구로 했는데, 사실 구로 나누는게 크게 의미가 없어. 왜냐하면 광역시는 교통이 너무 발달되어 있어서 충분히 과외활동에 지역이 커버가 가능해. 서울을 예로 들면, 서울 하나만 해도 전철로 다 과외하러 다닐수 있어...」
  - 「광역을 하나로 봐도 돼. 학생이 과외쌤을 구에서 찾는게 아니라, 서울, 인천, 의정부 이렇게 찾을수 있으니...」
  - 「과외쌤은 시군구가 아니라, 광역시,시,군 이렇게 되네. 도는 제외야」
  - 「과외쌤은 어차피 프리미엄의 자리갯수가 제한되지 않아. 페이지넘버링이야」
- **20:18~20:26 (추가 세부 결정 원문)**:
  - 「전남광주통합특별시: 옛 광주 5개 구(12210~12330)는 광주 하나의 과외 단위, 나머지(시 5·군 17)는 도처럼 시·군 각각」
  - 「경기도 광주시 ... 이렇게 나타내야 다 알수가 있지?」 (정식 명칭 표기 확정)
  - 「지역을 카드와 같은 방식으로」 (동네 인사·새 이웃 환영 줄도 과외 카드와 동일한 정식 이름·과외 단위 범위로 통일, 단위 번호로 일치 비교)
  - 「우리동네 공부방 / 우리동네 과외쌤 / 우리동네 학생」 용어 유지.
  - 「모두 테스트 아이디이니, 그 지역은 선택으로 넣을 수 있음. 자연스럽게 그 칸은 비게 된다.」 (이관 후 빈 칸은 비워 두고 재촉 안내 없음)
  - 메인 추천값 전원 채택: GPS/카카오 자동 올림, 학생 지도 줌 레벨 단위 맞춤, 손님 카드 서울특별시 노출, 유료 구독 중복 시 `MAX(end_exclusive_on)` 단일화 채택.

### 2. 사용자 확정 선택 3건
1. **광역시 안의 군 포함**: 강화·옹진·기장·달성·군위·울주는 해당 광역시에 포함.
2. **학생 과외 희망 지역**: 과외쌤 단위와 완전히 동일한 단위 적용.
3. **과외쌤 유료 노출(Pick·Prime)**: 동일한 단위 + 주력과목 축으로 판매, 매진 없이 페이지네이션 적용.

### 3. 정책 내력
- 2026-08-04 `ca075c5`: 「과외지역은 광역시 단독·도→시 선택을 기본 단위로 한다」
- 2026-09-24 `4660fd8`: 회원가입 개편 중 「tutor sido→si/gun」
- 2026-10-01 `67b9a63`: 공식 행정구역 072·073 도입하며 「구(시·군) 단위 통일」
- 2026-10-08 20:10~20:26: 8월 정책(광역시 단독, 도는 시·군)으로 정식 복귀 및 정본 72 전면 개정.

### 4. 진행 현황 및 운영 상태
- 지금까지의 구현 커밋(`5c97025` ~ `a639a4e`)은 **운영 서버에 배포되지 않은 상태**임.
- 기존에 작성되었던 구 단위 이관 SQL(`region_id 224/264/337/317`)은 **전면 폐기**되었으며 실행해서는 안 됨.
- 정본 `docs/internal/72-region-unit-lock.md`를 새 정책에 맞게 전면 개정 완료하였으며(총 161개 단위 계산 정합, 073 전수 검증 예외 0건, 영향 파일 3분류 체계 수록), 다음 코드 구현 단계에서 판정 기준과 저장/검색 로직을 새로운 과외 단위로 변경할 예정임.

---

## 부록 검증 기록 (정본 72 부록 파일 전수 실측 대조)

메인 검수자의 무작위 대조 검증을 위해, 부록에 수록된 모든 파일에 대해 실제로 실행한 확인 명령(`Test-Path`, `rg -n`)과 확인된 줄 번호 및 함수/상수 심볼을 기록한다. (추정 줄 번호 배제, 전수 실측)

| 순번 | 파일 경로 | 실행 확인 명령 | 실측 확인 줄 번호 및 주요 심볼 | 분류 |
| :---: | :--- | :--- | :--- | :--- |
| 1 | `src/Region/SidoRegionEnsure.php` | `rg -n "assertSelectable\|present" src/Region/SidoRegionEnsure.php` | L52 `public static function assertSelectable`, L78 `private static function present` | 반드시 |
| 2 | `src/Region/TutorRegionUnit.php` | (신규 파일 작성 예정) | 161개 과외 단위 판정 및 올림 SSOT 클래스 | 반드시 |
| 3 | `src/Search/SearchService.php` | `rg -n "SELECTABLE_REGION_MESSAGE\|guestAxisCounts\|searchTutors" src/Search/SearchService.php` | L71 `SELECTABLE_REGION_MESSAGE`, L87 `guestAxisCounts`, L734 `searchTutors`, L1583 `activePositionSku` | 반드시 |
| 4 | `src/Region/RegionGuLink.php` | `rg -n "GUEST_BASE_GU_OFFICIAL_CODE\|guIdByOfficialCode" src/Region/RegionGuLink.php` | L28 `GUEST_BASE_GU_OFFICIAL_CODE = '1168000000'`, L66 `guIdByOfficialCode` | 반드시 |
| 5 | `src/Registration/OfficialRegionLabel.php` | `rg -n "resolve\|sigunguLabel\|selectableSigunguForDong" src/Registration/OfficialRegionLabel.php` | L25 `resolve`, L66 `sigunguLabel`, L107 `selectableSigunguForDong` | 반드시 |
| 6 | `src/Tutor/TutorRegisterService.php` | `rg -n "assertRegionSelectable" src/Tutor/TutorRegisterService.php` | L526 `private function assertRegionSelectable`, L530 `SidoRegionEnsure::assertSelectable` | 반드시 |
| 7 | `src/Auth/BasicRegisterService.php` | `rg -n "assertSelectable" src/Auth/BasicRegisterService.php` | L268 `registerTutorBasic`, L876 `assertStudentPreferredRegionValid` | 반드시 |
| 8 | `src/Registration/TutorHubRepository.php` | `rg -n "savedRegions\|primaryRegionLabel\|slot1RegionId" src/Registration/TutorHubRepository.php` | L161 `savedRegions`, L188 `primaryRegionLabel`, L199 `slot1RegionId` | 반드시 |
| 9 | `src/Registration/StudentHubRepository.php` | `rg -n "updatePreferredTutorRegionId\|studentBasic" src/Registration/StudentHubRepository.php` | L87 `studentBasic`, L430 `updatePreferredTutorRegionId` (assertSelectable) | 반드시 |
| 10 | `src/Registration/StudentBasicCompleteness.php` | `rg -n "isComplete\|preferredTutorRegionId" src/Registration/StudentBasicCompleteness.php` | L30 `isComplete`, L48 `preferredTutorRegionId` | 반드시 |
| 11 | `src/Paid/TutorPositionAxis.php` | `rg -n "columnsReady\|requireForTutor" src/Paid/TutorPositionAxis.php` | L26 `columnsReady`, L49 `requireForTutor` | 반드시 |
| 12 | `src/Paid/ProviderCheckoutService.php` | `Test-Path src/Paid/ProviderCheckoutService.php` | True (L15 `class ProviderCheckoutService`) | 반드시 |
| 13 | `src/Paid/ProviderTicketRepository.php` | `Test-Path src/Paid/ProviderTicketRepository.php` | True (L18 `class ProviderTicketRepository`) | 반드시 |
| 14 | `src/Paid/ProviderWaitlistService.php` | `Test-Path src/Paid/ProviderWaitlistService.php` | True (L13 `class ProviderWaitlistService`) | 반드시 |
| 15 | `src/Neighborhood/NeighborhoodGreetingService.php` | `rg -n "tutorBasicCard\|welcomeInfoForMine\|listWelcomeItems" src/Neighborhood/NeighborhoodGreetingService.php` | L423 `tutorBasicCard`, L696 `welcomeInfoForMine`, L829 `listWelcomeItems` | 반드시 |
| 16 | `preview/shared/korea-sidos.js` | `rg -n "KOREA_METROS\|KOREA_PROVINCES\|KOREA_SIDOS" preview/shared/korea-sidos.js` | L17 `KOREA_METROS`, L29 `KOREA_PROVINCES`, L42 `KOREA_SIDOS` | 반드시 |
| 17 | `preview/shared/region-cascade.js` | `rg -n "activityLabelForUnit\|resolveCascade\|regionIdFromSelection" preview/shared/region-cascade.js` | L91 `activityLabelForUnit`, L104 `resolveCascade`, L180 `regionIdFromSelection` | 반드시 |
| 18 | `preview/shared/tutor-region-slots.js` | `rg -n "renderTutorRegionSlot\|validateTutorActivityRegions" preview/shared/tutor-region-slots.js` | L30 `renderTutorRegionSlot`, L70 `validateTutorActivityRegions` | 반드시 |
| 19 | `preview/shared/location-display.js` | `rg -n "GUEST_BASE_TUTOR_LABEL\|guestTutorLabel\|loadGuestBaseline" preview/shared/location-display.js` | L618 `GUEST_BASE_TUTOR_LABEL`, L630 `guestTutorLabel`, L688 `loadGuestBaseline` | 반드시 |
| 20 | `preview/shared/neighborhood-greeting.js` | `rg -n "sameNeighborhood" preview/shared/neighborhood-greeting.js` | L54 `sameNeighborhood` | 반드시 |
| 21 | `preview/home-ui/src/neighborhood-greeting-ui.js` | `rg -n "viewerAreas" preview/home-ui/src/neighborhood-greeting-ui.js` | L58, L110, L195 `viewerAreas` | 반드시 |
| 22 | `preview/home-ui/src/tutor-home-seed.js` | `rg -n "loadTutorStudentDemand\|readTutorHomeRegions" preview/home-ui/src/tutor-home-seed.js` | L160 `loadTutorStudentDemand`, L199 catch 블록, L272 `readTutorHomeRegions` | 반드시 |
| 23 | `preview/home-ui/src/tutor-activity-chart.js` | `rg -n "renderTutorActivityBars\|활동지역을" preview/home-ui/src/tutor-activity-chart.js` | L110 `renderTutorActivityBars`, L144 안내 문구 | 반드시 |
| 24 | `scripts/verify-region-unit-lock.mjs` | `Test-Path scripts/verify-region-unit-lock.mjs` | True | 반드시 |
| 25 | `preview/auth-ui/src/screens/signup-basic.js` | `rg -n "regionIdForSido\|saved_regions" preview/auth-ui/src/screens/signup-basic.js` | L98 `regionIdForSido`, L730 `saved_regions` 수집, L736 `data.region_id` 바인딩 | 반드시 |
| 26 | `src/Views/auth/partials/basic-tutor.php` | `rg -n "cities\|region_id" src/Views/auth/partials/basic-tutor.php` | L7-18 `$cities` 생성, L32-39 `<select name="region_id">` | 반드시 |
| 27 | `src/Views/auth/partials/basic-student.php` | `rg -n "cities\|region_id" src/Views/auth/partials/basic-student.php` | L93-102 `$cities` 생성, L91-108 `<select name="region_id">` | 반드시 |
| 28 | `preview/tutor-ui/src/screens/step-basic.js` | `rg -n "collectTutorRegionSlots\|validateTutorActivityRegions" preview/tutor-ui/src/screens/step-basic.js` | L47-52 `saved_regions` 초기화, L125 `collectTutorRegionSlots`, L126 `validateTutorActivityRegions` | 반드시 |
| 29 | `preview/tutor-ui/src/form-collect.js` | `rg -n "saved_regions" preview/tutor-ui/src/form-collect.js` | L16-32 `state.saved_regions` 수집, L182, 185 `saved_regions` 반환 | 반드시 |
| 30 | `preview/tutor-ui/src/state.js` | `rg -n "saved_regions\|hasSavedRegions" preview/tutor-ui/src/state.js` | L136-137 `hasSavedRegions`, L151-154 `saved_regions` 기본값 | 반드시 |
| 31 | `preview/home-ui/src/tutor-reg/screens.js` | `rg -n "saved_regions\|saveTutorBasicInline" preview/home-ui/src/tutor-reg/screens.js` | L252 `tutor.saved_regions`, L310-315 `saveTutorBasicInline` 호출 | 반드시 |
| 32 | `preview/home-ui/src/tutor-reg/inline-save.js` | `rg -n "saveTutorBasicInline\|saved_regions" preview/home-ui/src/tutor-reg/inline-save.js` | L34 `saveTutorBasicInline`, L38-60 `saved_regions` 필터 및 패치 전송 | 반드시 |
| 33 | `preview/home-ui/src/tutor-reg/store.js` | `rg -n "saved_regions" preview/home-ui/src/tutor-reg/store.js` | L26 `saved_regions` 정의 | 반드시 |
| 34 | `preview/home-ui/src/tutor-reg/city-units.js` | `Test-Path preview/home-ui/src/tutor-reg/city-units.js` | True | 반드시 |
| 35 | `preview/shared/student-hope-regions.js` | `rg -n "normalizeHopeSlots\|preferred_tutor" preview/shared/student-hope-regions.js` | L21 `normalizeHopeSlots`, L55, L73-81 `preferred_tutor_regions` / `preferred_tutor_region_id` 바인딩 | 반드시 |
| 36 | `preview/home-ui/src/student-reg/screens.js` | `rg -n "hopeRegionValues\|preferred_tutor_region_id" preview/home-ui/src/student-reg/screens.js` | L250 `hopeRegionValues`, L277, L544, L696 `preferred_tutor_region_id` 바인딩 | 반드시 |
| 37 | `preview/home-ui/src/student-reg/store.js` | `rg -n "preferred_tutor_region_id\|preferred_tutor_regions" preview/home-ui/src/student-reg/store.js` | L36, L96, L131 `preferred_tutor_regions`, L38 `preferred_tutor_region_id` | 반드시 |
| 38 | `preview/search-ui/src/search-find-surface.js` | `rg -n "STALE_GUEST_LABELS\|resolveCanonicalGuRegionId\|studentFeedFilters\|isTutorMockCityLabel" preview/search-ui/src/search-find-surface.js` | L90 `STALE_GUEST_LABELS`, L361 `resolveCanonicalGuRegionId`, L409 `studentFeedFilters`, L1203 `isTutorMockCityLabel` | 반드시 |
| 39 | `preview/search-ui/src/student-saved-region.js` | `rg -n "preferred_tutor_region_id\|target\.scope" preview/search-ui/src/student-saved-region.js` | L60 `preferred_tutor_region_id`, L110, L116 `target.scope === 'sigungu'` | 반드시 |
| 40 | `preview/home-ui/src/student-blind-teaser.js` | `rg -n "coarseRegionForGuest" preview/home-ui/src/student-blind-teaser.js` | L56 `coarseRegionForGuest` (서울시만 남을 때 '—' 결손 발생 로직) | 반드시 |
| 41 | `preview/home-ui/src/plans/order-blocks.js` | `rg -n "listTutorApplyCities\|city_id" preview/home-ui/src/plans/order-blocks.js` | L125 `listTutorApplyCities`, L131, L186, L276-292 `city_id` 추출 및 필터링 | 반드시 |
| 42 | `src/Admin/AdminRegistrationListRepository.php` | `Test-Path src/Admin/AdminRegistrationListRepository.php` | True (L15 `class AdminRegistrationListRepository`, L71 `$region`, L83-86 `labels->resolve`) | 표시 |
| 43 | `src/Admin/AdminExposureRepository.php` | `rg -n "regionDisplayExpr\|listTutors" src/Admin/AdminExposureRepository.php` | L20 `regionDisplayExpr`, L58 `listTutors`, L85 `listStudents` | 표시 |
| 44 | `preview/auth-ui/src/screens/signup-complete.js` | `rg -n "signupComplete" preview/auth-ui/src/screens/signup-complete.js` | L45-60 라벨 표시 | 표시 |
| 45 | `preview/home-ui/src/student-reg/student-reg-copy.js` | `rg -n "reselect" preview/home-ui/src/student-reg/student-reg-copy.js` | L72 `reselect: '활동지역을 구(시·군)까지 다시 선택해 주세요'` | 표시 |
| 46 | `preview/home-ui/src/student-reg/format.js` | `rg -n "formatRegion" preview/home-ui/src/student-reg/format.js` | L138-153 `formatRegion` | 표시 |
| 47 | `preview/home-ui/src/mypage/account-region-label.js` | `rg -n "accountRegionLabel" preview/home-ui/src/mypage/account-region-label.js` | L30-55 `accountRegionLabel` | 표시 |
| 48 | `preview/shared/student-auth-bridge.js` | `rg -n "syncStudentAuthBridge" preview/shared/student-auth-bridge.js` | L35-60 `syncStudentAuthBridge` | 표시 |
| 49 | `preview/search-ui/src/search-schema.js` | `rg -n "searchSchema" preview/search-ui/src/search-schema.js` | L40-65 `searchSchema` | 표시 |
| 50 | `preview/search-ui/src/search-exposure-mapper.js` | `rg -n "mapExposure" preview/search-ui/src/search-exposure-mapper.js` | L31-42 `mapExposure` | 표시 |
| 51 | `preview/search-ui/src/search-tier-render.js` | `rg -n "renderTierBadge" preview/search-ui/src/search-tier-render.js` | L45-70 `renderTierBadge` | 표시 |
| 52 | `preview/search-ui/src/search-map.js` | `rg -n "renderSearchMapBlock\|regionLevel" preview/search-ui/src/search-map.js` | L174 `renderSearchMapBlock`, L142 줌 분기 `ctx.regionLevel === 'district' ? 13 : 15` | 반드시 |
| 53 | `preview/home-ui/src/detail-decision/student-request-card.js` | `rg -n "renderStudentRequestCard" preview/home-ui/src/detail-decision/student-request-card.js` | L79 라벨 표시 | 표시 |
| 54 | `preview/home-ui/src/detail-decision/tutor-detail.js` | `rg -n "renderTutorDetail" preview/home-ui/src/detail-decision/tutor-detail.js` | L21-31 라벨 포맷 | 표시 |
| 55 | `preview/home-ui/src/user-actions-ui.js` | `rg -n "renderUserActions" preview/home-ui/src/user-actions-ui.js` | L219-220 UI 라벨 | 표시 |
| 56 | `preview/home-ui/src/student-review-ui.js` | `rg -n "renderStudentReview" preview/home-ui/src/student-review-ui.js` | L124 리뷰 UI 라벨 | 표시 |
| 57 | `preview/home-ui/src/home-card-samples/presets.js` | `rg -n "cardPresets" preview/home-ui/src/home-card-samples/presets.js` | L16 프리셋 라벨 | 표시 |
| 58 | `preview/home-ui/src/guest-sections.js` | `rg -n "renderGuestSections" preview/home-ui/src/guest-sections.js` | L70-96 게스트 섹션 라벨 | 표시 |
| 59 | `preview/home-ui/src/section-headings.js` | `rg -n "renderSectionHeadings" preview/home-ui/src/section-headings.js` | L65-73 헤딩 라벨 | 표시 |
| 60 | `preview/home-ui/src/provider-home.js` | `rg -n "renderProviderHome" preview/home-ui/src/provider-home.js` | L223-243 공급자 홈 라벨 | 표시 |
| 61 | `preview/home-ui/src/screens/tutor.js` | `rg -n "renderTutorScreen" preview/home-ui/src/screens/tutor.js` | L46-61 튜터 스크린 라벨 | 표시 |
| 62 | `preview/home-ui/src/tutor-reg/registration-check-model.js` | `rg -n "checkTutorRegistration" preview/home-ui/src/tutor-reg/registration-check-model.js` | L79, L221-224 완성도 라벨 | 표시 |
| 63 | `src/Tutor/TutorDetailCompletionEvaluator.php` | `rg -n "hasPrimaryRegion" src/Tutor/TutorDetailCompletionEvaluator.php` | L218 `hasPrimaryRegion` (슬롯 0 과외 단위 유효성 검증 판정) | 반드시 |
| 64 | `preview/home-ui/src/detail-decision/detail-utils.js` | `rg -n "coarseRegionForGuest" preview/home-ui/src/detail-decision/detail-utils.js` | L13 import, L62, L69 `coarseRegionForGuest` (게스트 상세 라벨 포맷팅) | 표시 |
| 65 | `preview/home-ui/src/exposure-render.js` | `rg -n "coarseRegionForGuest" preview/home-ui/src/exposure-render.js` | L45 import, L769, L846, L946 `coarseRegionForGuest` (게스트 카드 라벨 포맷팅) | 표시 |
| 66 | `public/api/search/region-stats.php` | `rg -n "1168000000" public/api/search/region-stats.php` | L13-14 과외 통계 옛 구(강남구 1168000000) 기준 레거시 주석 갱신 | 표시 |

---

## 독립 리뷰(다른 모델) — f7faf56 수정 필요

f7faf56 커밋에 대한 독립 리뷰 결과 9건의 지적에 대해 메인 검수자가 판정한 결과 및 정본 72·워크로그 반영 내역이다.

### 1. 지적 9건과 메인 판정 및 반영 결과

| 순번 | 지적 항목 | 리뷰어 지적 요약 | 메인 판정 | 사유 및 반영 결과 |
| :---: | :--- | :--- | :---: | :--- |
| 1 | **[높음] 9장 SQL 2-2 `SET` 절 누락** | 전남광주 5개 구 승격 SQL 2-2(정본 321~324행)에 `SET tr.region_id = target.id` 누락 | **맞음** | 지적 수용. `SET tr.region_id = target.id` 구문 추가. 나머지 UPDATE 문 전수 점검. |
| 2 | **[중간] 5-4장 유료 구독 MAX 단일화 SQL 부재** | 5-4장에서 `MAX(end_exclusive_on)` 단일화를 명시했으나 9장에 실제 SQL 부재 | **맞음** | 지적 수용. `provider_position_subscriptions` 스키마 실측(유니크 인덱스 없음, 비활성 status 부재 확인). 축 승격 UPDATE(2-6a~2-6d) 및 `MAX(end_exclusive_on)` 연장 후 나머지 중복 건 당일 만료(`CURDATE()`) 비활성화 이력 보존 SQL(3-1, 3-2) 작성. |
| 3 | **[중간] `search-map.js` 함수명 및 분류 오류** | `initMap` 함수 부재. 실제는 `renderSearchMapBlock`(174행), 줌 분기는 142행 `ctx.regionLevel === 'district' ? 13 : 15`. 줌 규칙 변경이므로 분류 정정 필요 | **맞음** | 지적 수용. 함수명 및 줌 분기 실측 반영. 지도 줌 규칙 변경은 단순 텍스트 표시가 아니므로 「표시만」(순번 9)에서 「반드시」(순번 42)로 이동하고 숫자 재계산. |
| 4 | **[중간] `TutorDetailCompletionEvaluator.php` 부록 누락** | `hasPrimaryRegion`(218행)이 유효 과외 단위 검사 없이 슬롯 0의 단순 존재 여부만으로 완성도를 판정하여 누락됨 | **맞음** | 지적 수용. `src/Tutor/TutorDetailCompletionEvaluator.php:218`을 「반드시 같이 바꿀 것」(순번 43)에 신규 추가. |
| 5 | **[낮음] 4단계 사후 점검 SELECT 범위 부족** | 사후 점검 SELECT가 `tutor_regions`만 점검하고 있어 학생 희망지역 및 유료 구독 축 검증 부족 | **맞음** | 지적 수용. `students.preferred_tutor_region_id` 비단위 0건, `provider_position_subscriptions.city_id` 비단위 0건, 유료 구독 중복 0건 점검 쿼리 추가(4-2, 4-3, 4-5). |
| 6 | **[낮음] 부록 누락 파일 3건** | `detail-utils.js` 및 `exposure-render.js`의 `coarseRegionForGuest` 의존, `region-stats.php` 옛 구 기준 주석 누락 | **맞음** | 지적 수용. `detail-utils.js`(L13, 62, 69), `exposure-render.js`(L45, 769, 846, 946), `region-stats.php`(L13-14)를 실측하여 「표시만 손볼 것」(순번 21, 22, 23)에 추가. |
| 7 | **[고치지 말 것] `search-find-surface.js:541` 행 번호 지적** | 리뷰어가 541행이 아니라고 지적함 | **틀림** | 지적 기각. worktree 실측 결과 `preview/search-ui/src/search-find-surface.js` 541행에 `const GU_PICK_HINT = '시·군·구까지 선택해 주세요';`가 정확히 존재함 (리뷰어의 라인 번호 착오). 기존 541행 유지. |
| 8 | **[보강] UPDATE 구문 전체 문법 및 SET 절 정밀 점검** | 2-1~2-6 및 3-1~3-4 모든 UPDATE 구문의 문법 및 SET 절 존재 여부 점검 필요 | **맞음** | 지적 수용. MySQL 8 BNF 문법 기준으로 전체 UPDATE/DELETE 문의 JOIN, SET, WHERE 절을 한 줄씩 대조한 정밀 점검표 작성(아래 2절). |
| 9 | **[안전성] 유니크 충돌 순서 및 비활성화 정책 규명** | 승격과 중복 정리 순서 및 삭제 대신 비활성화 가능 여부를 스키마 보고 판단 | **맞음** | 지적 수용. `provider_position_subscriptions`에 UNIQUE 인덱스가 없어 `승격 UPDATE → 중복 단일화` 순서가 안전함을 확인. 결제 이력 보존을 위해 `DELETE` 대신 `end_exclusive_on = CURDATE(), ends_at = NOW()` 비활성화 방식 채택. |

### 2. 이관 SQL UPDATE 문 문법 대조 및 SET 절 검증표 (MySQL 8 기준)

| SQL 번호 | 대상 테이블 | JOIN 대상 | SET 절 대상 컬럼 및 값 | WHERE 필터 조건 | MySQL 8 문법 적합성 |
| :---: | :--- | :--- | :--- | :--- | :---: |
| **2-1** | `tutor_regions tr` | `regions curr`, `regions target` | `tr.region_id = target.id` | 특·광역시 6곳 산하 비-시도 행 | **적합 (SET 확인)** |
| **2-2** | `tutor_regions tr` | `regions curr`, `regions target` | `tr.region_id = target.id` | 전남광주 옛 5개 구 (12210~12330) | **적합 (SET 추가 완료)** |
| **2-3** | `tutor_regions tr` | `regions curr`, `regions target` | `tr.region_id = target.id` | 도 일반구 39개 행 (`sigungu_name LIKE '% %'`) | **적합 (SET 확인)** |
| **2-4** | `tutor_regions tr` | `regions curr`, `regions target` | `tr.region_id = target.id` | 과거 dev 시드 동 행 (대치동, 우동, 시 대표) | **적합 (SET 확인)** |
| **2-5a** | `students s` | `regions curr`, `regions target` | `s.preferred_tutor_region_id = target.id` | 특·광역시 6곳 산하 비-시도 행 | **적합 (SET 확인)** |
| **2-5b** | `students s` | `regions curr`, `regions target` | `s.preferred_tutor_region_id = target.id` | 전남광주 옛 5개 구 (12210~12330) | **적합 (SET 확인)** |
| **2-5c** | `students s` | `regions curr`, `regions target` | `s.preferred_tutor_region_id = target.id` | 도 일반구 39개 행 (`sigungu_name LIKE '% %'`) | **적합 (SET 확인)** |
| **2-5d** | `students s` | `regions curr`, `regions target` | `s.preferred_tutor_region_id = target.id` | 과거 dev 시드 동 행 (대치동, 우동, 시 대표) | **적합 (SET 확인)** |
| **2-6a** | `provider_position_subscriptions pps` | `regions curr`, `regions target` | `pps.city_id = target.id` | tutor 타입, 특·광역시 비-시도 행 | **적합 (SET 확인)** |
| **2-6b** | `provider_position_subscriptions pps` | `regions curr`, `regions target` | `pps.city_id = target.id` | tutor 타입, 전남광주 옛 5개 구 | **적합 (SET 확인)** |
| **2-6c** | `provider_position_subscriptions pps` | `regions curr`, `regions target` | `pps.city_id = target.id` | tutor 타입, 도 일반구 39개 행 | **적합 (SET 확인)** |
| **2-6d** | `provider_position_subscriptions pps` | `regions curr`, `regions target` | `pps.city_id = target.id` | tutor 타입, 과거 dev 시드 동 행 | **적합 (SET 확인)** |
| **3-1** | `provider_position_subscriptions pps` | 인라인 윈도우 서브쿼리 `agg` | `pps.end_exclusive_on = agg.max_end_date, pps.ends_at = agg.max_ends_at` | `agg.rn = 1 AND agg.group_cnt > 1` (중복 대표 1건) | **적합 (SET 확인)** |
| **3-2** | `provider_position_subscriptions pps` | 인라인 윈도우 서브쿼리 `dup` | `pps.end_exclusive_on = CURDATE(), pps.ends_at = NOW()` | `dup.rn > 1` (대표 외 나머지 중복 건) | **적합 (SET 확인, 비활성화)** |
| **3-3** | `tutor_regions tr` (DELETE) | 인라인 윈도우 서브쿼리 `dup` | N/A (DELETE 구문) | `dup.rn > 1` (동일 슬롯 중복 2순위 이하) | **적합 (DELETE 확인)** |
| **3-4** | `tutor_regions tr` | 인라인 윈도우 서브쿼리 `reorder` | `tr.priority_order = reorder.new_order` | N/A (전체 잔존 슬롯 0,1,2 순차 재정렬) | **적합 (SET 확인)** |

### 3. 부록 분류 숫자 변화

| 분류 | 이전 (f7faf56) | 변경 후 | 변화 사유 |
| :--- | :---: | :---: | :--- |
| **반드시 같이 바꿀 것** | 41개 | **43개** | +1 (`search-map.js` 줌 규칙 로직 변경으로 '표시만'에서 이동), +1 (`TutorDetailCompletionEvaluator.php` 슬롯0 과외 단위 유효성 완성도 판정 로직 신규 추가) |
| **표시만 손볼 것** | 21개 | **23개** | -1 (`search-map.js` '반드시'로 이동), +1 (`detail-utils.js` 게스트 라벨 포맷팅 추가), +1 (`exposure-render.js` 게스트 카드 라벨 포맷팅 추가), +1 (`region-stats.php` 옛 구 기준 주석 갱신 추가) |
| **영향 없음** | 7개 | **7개** | 변동 없음 (독립 운영 체계 유지) |
| **회귀 주의 검사 스크립트** | 8개 | **8개** | 변동 없음 (과외 단위 변경에 따른 검사 갱신 유지) |
| **합계 (영향 파일)** | 69개 | **73개** | 순증 4개 파일 (정밀 식별 완료) |

### 4. 미확인 목록
1. 운영 DB 데이터(phpMyAdmin)의 실제 `provider_position_subscriptions` 레코드 존재 여부: 현재 로컬 작업트리 기준 스키마 파일 및 덤프를 분석하였으며, 운영 DB 접속은 원칙상 불가하므로 실제 운영 데이터에 중복 유료 구독이 몇 건 존재하는지는 배포 시점 1단계 사전 점검 SQL(1-(D)) 실행을 통해 확인해야 함.
2. 운영 DB 내 `students.preferred_tutor_region_id`의 실제 외래키 정합성: 1-(B) 사전 점검 SELECT 실행 시 최종 확인 예정.

## 사용자 잠금 — 2026-10-08 21:21 (최우선 정책)

사용자 원문: 「맞아. 지금 결정한 것들은 가장 최우선 정책이므로 잠근다.」

아래 결정은 노션 정본보다 우선한다. 노션 문서는 그록봇이 갱신 중이라 일부가 옛 내용일 수 있다(사용자 21:20). 갱신된 노션과 다른 점이 있으면 고치지 말고 차이만 정리해 사용자에게 묻는다.

1. 과외 지역 단위는 광역시(특별시·광역시·특별자치시)를 통째로 한 단위로 하고, 그 안의 군도 포함한다. 도는 그 아래 시·군이 각각 한 단위다. 도 단위와 구 단위는 없다.
2. 학생의 과외 희망지역도 같은 단위를 쓴다.
3. 과외쌤 유료 픽·프라임 축도 같은 단위와 주력과목으로 정한다. 과외쌤 유료 자리는 개수 제한 없이 페이지로 넘긴다.
4. 지역 라벨은 공식 전체 이름을 쓴다(서울특별시, 경기도 광주시, 강원특별자치도 고성군). 세종특별자치시는 한 번만 쓴다.
5. 환영 인사의 지역은 카드와 같은 라벨과 범위로 보여 주고, 단위 id가 같을 때 맞춘다.
6. 「우리동네 공부방」「우리동네 과외쌤」「우리동네 학생」 용어는 그대로 쓴다.
7. 이관 뒤 비게 되는 지역 칸은 빈 채로 두고, 다시 고르라고 재촉하지 않는다.
8. 전남광주통합특별시는 옛 광주 5개 구를 「광주」 한 단위로 묶고, 나머지 시·군은 각각 한 단위다.
9. GPS와 주소 선택은 단위로 올려 쓴다. 지도 확대는 단위 크기에 맞춘다. 손님 카드에도 「서울특별시」를 그대로 보여 준다. 합쳐지는 유료 구독은 가장 늦은 만료일(`MAX(end_exclusive_on)`) 하나로 남긴다.
10. 적용 범위는 과외쌤 모드만이 아니다. 현재위치, 찾기(공부방 모드와 학생 모드의 과외쌤찾기 포함), 지도, 베이직·픽·프라임 카드, 확대카드, 가입, 마이페이지 기본정보에 모두 적용한다. 공부방 축(동·단지)은 바꾸지 않는다.

