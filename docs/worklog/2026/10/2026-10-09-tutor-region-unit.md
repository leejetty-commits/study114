# 2026-10-09 과외지역 단위 1단계 (입력·저장·표기 원천)

- 브랜치: `cursor/tutor-region-unit-20261009` (기준 `origin/main`)
- worktree: `d:\work\study114\.wt\tutor-region-unit`
- 작업자: Cursor 하위 에이전트 (작업자 세션은 자기 작업을 검수·승인하지 않는다)
- 검수: **대기**
- 승인: **대기** (사용자, 커밋 hash 단위)

## 1. 지시서 원문

수신 2026-10-09 00:13 (UTC+9)

````text
너는 study114 작업자다. 보고는 한국어. Windows PowerShell(한글 출력 전 `[Console]::OutputEncoding=[Text.Encoding]::UTF8`). PHP: `D:\php8.2\php.exe -d extension=pdo_sqlite`.

## 규칙 (반드시)
- 새 worktree에서만: `cd d:\work\study114; git fetch origin; git worktree add .wt/tutor-region-unit -b cursor/tutor-region-unit-20261009 origin/main`. 다른 폴더는 절대 건드리지 마라.
- `git add -A`/`.` 금지, 파일명 stage, amend 금지, main push·merge 금지. 작업 브랜치만 push. 빌드 산출물 커밋 금지.
- SQL은 **파일로 작성만**(실행 금지), .htaccess·env·Secrets 금지.
- **이번에 손대지 말 파일**(다른 작업이 수정 중): `preview/search-ui/src/search-find-surface.js`, `search-tier-render.js`, `search-exposure-mapper.js`, `search-provider-self.js`, `preview/home-ui/src/exposure-render.js`, `exposure-data.js`, `exposure-bridge.js`, `home-card-samples/*`, `guest-gate-ui.js`, `detail-decision/*`, 등록점검·쪽지설정 파일. 이 파일에 바꿔야 할 게 있으면 「2단계(찾기) 할 일」 목록으로 보고만.
- 기본정보 항목(특징·슬로건 등 필수화)과 저장 버그는 다음 작업. 이번엔 지역만.

## 사용자 정책 (최우선 잠금 2026-10-08 21:21 + 2026-10-09 00:12 사용자 원문)
「공부방가입, 과외쌤가입, 학생가입 단계의 주소나 홍보지역, 과외지역 알고리즘만 점검하면 돼. 공부방은 변함없어. 과외쌤만 광역시인정, 도는 시까지 입력단계... 학생은 기존분기 공부방이냐 과외샘이냐에 따라 공부방은 기존대로, 과외샘은 광역시나 도의 시나, 군까지... 공부방찾기는 기존대로, 과외쌤찾기는 광역시 검색가능, 도는 시나 군까지 입력해야 검색가능. 마이페이지에서도 과외지역 변경하려면 기본정보에서 수정하는 곳에서, 광역시 또는 도의 시나 군까지 입력.」
잠금 요지:
- 과외 단위 = 광역시 전체(특별시·광역시·특별자치시. 그 안의 구·군 모두 포함, 예: 인천 강화군·부산 기장군·대구 군위군도 그 광역시) 또는 도의 시·군. 도 단위·구 단위 없음. 일반구 있는 시(수원·성남·안양·부천·안산·고양·용인·화성·청주·천안·포항·창원·전주)는 시 전체가 한 단위.
- 세종특별자치시는 1단계로 끝, 표기 한 번.
- 전남광주통합특별시(sido_code 12): 옛 광주 5개 구(12210·12240·12270·12300·12330)는 「광주」 한 단위(새 행 sigungu_code '12200', sigungu_name '광주', official_code NULL), 나머지 시·군은 각각. 도처럼 2단계(전남광주통합특별시 → 광주/순천시/…).
- 표기 = 공식 전체 이름: 「서울특별시」, 「경기도 수원시」, 「강원특별자치도 고성군」, 「전남광주통합특별시 광주」, 「세종특별자치시」.
- 공부방 축(동·단지, regions.is_selectable 기반 구 단위 검색)은 절대 바꾸지 마라. `is_selectable`은 공부방 축과 공유되므로 값을 바꾸지 말고, 과외 단위 판정은 별도 코드(예: `src/Region/TutorRegionUnit.php` + JS 짝)로.
- **학생 공부방 희망지역은 구 단위 유지** — `students.preferred_region_id`가 두 분기에 공유되는지 확인하고, 과외 분기만 과외 단위로.
- **기존 계정은 전부 삭제하고 다시 만든다.** 옛 데이터(구·동 값) 호환 코드, 이관 SQL, 「다시 선택해 주세요」 폴백 화면을 만들지 마라. 새 규칙에 맞지 않는 값은 서버가 거절하면 끝.
- 견본·가짜 데이터 금지(별도 작업에서 제거 중).

## 범위 (이번 작업 = 1단계: 입력·저장·표기 원천)
참고 문서: 브랜치 `origin/cursor/region-unit-lock-20261008`의 `docs/internal/72-region-unit-lock.md` (부록에 파일·함수 목록). 단 그 문서의 이관 SQL·옛 데이터 호환 부분은 **무시**(계정 전체 삭제로 대체됨). `git show origin/cursor/region-unit-lock-20261008:docs/internal/72-region-unit-lock.md`로 읽어라.
1. 서버: 과외 단위 판정 모듈(PHP) + 단위 목록 API(광역시 1단계 / 도→시·군 2단계 / 전남광주 2단계). 현재 과외지역 목록을 주는 API·`cities` 엔드포인트를 찾아 과외용을 바꾸되, 공부방이 같은 API를 쓰면 분리.
2. 서버 저장 검사: 과외쌤 가입(`BasicRegisterService::registerTutorBasic` 등), 마이페이지 기본정보 저장(`TutorRegisterService` 지역 저장), 학생 과외 희망지역(`assertStudentPreferredRegionValid` 등), `SidoRegionEnsure` 문구 → 과외 단위만 허용.
3. 서버 검색 입력 검사: `SearchService` 과외쌤 검색·학생(과외 희망) 검색이 과외 단위 id를 받아 그 단위와 정확히 일치하는 카드를 찾게(현재 `selectableRegionId`는 is_selectable=1만 허용해 광역시·상위 시를 거절). 공부방 검색 경로는 그대로. 프라임·픽 축(단위+주력과목)도 같은 단위 id.
4. 서버 표기: 과외 단위 라벨(공식 전체 이름) 한 곳에서 만들기. 카드·동네인사·마이페이지가 쓰는 서버 라벨 함수(`OfficialRegionLabel`, `TutorHubRepository` 슬롯1 라벨, `NeighborhoodGreetingService`의 `sigungu_name <> ''` 조건 등)를 과외 축만 교체.
5. 화면: 과외쌤 가입 과외지역 3칸(`preview/auth-ui/src/screens/signup-basic.js`, `preview/shared/tutor-region-slots.js`), 학생 가입 과외 희망지역, 마이페이지 과외쌤 기본정보 과외지역(`preview/home-ui/src/tutor-reg/screens.js` 366-385 문구 「구가 있는 곳은 구까지 고릅니다」 포함), 학생 마이페이지 과외 희망지역(`student-reg/screens.js` 265), tutor-ui 기본등록(`preview/tutor-ui/src/screens/step-basic.js`), `preview/shared/korea-sidos.js`의 activityLabelFromRegionId/regionIdFromActivityLabel, 과외쌤 홈 `tutor-home-seed.js`·`tutor-activity-chart.js` 문구. 입력 방식: 1단계 시·도 선택 → 광역시·세종이면 끝, 도·전남광주면 2단계 시·군. 3단계(구) 없음.
6. SQL 파일(작성만): `sql/schema/078_tutor_unit_gwangju.sql` — 12200 광주 행 1개 멱등 INSERT. 그리고 별도 파일로 `sql/ops/2026-10-09-wipe-member-accounts.sql` 초안: **관리자 계정을 남기고** 회원(공부방·과외쌤·학생) 계정과 그 등록 데이터를 지우는 SQL. 스키마의 FK(ON DELETE CASCADE 여부)를 실제로 확인해 순서를 짜고, 관리자 판별 기준(테이블·컬럼)을 근거와 함께 적어라. 실행 전 건수 확인 SELECT 포함. 결제·정산 테이블 처리는 「사용자 확인 필요」으로 표시만.

## 검사
- 기존 verify 스크립트 중 구 단위를 기대하는 과외 축 단언은 새 규칙으로 바꾼다(지우지만 말 것).
- 새 게이트 `scripts/verify-tutor-region-unit.mjs`: 예시 주소표 기반 — 서울 강남구→서울특별시, 수원시 영통구→경기도 수원시, 경기도 광주시→경기도 광주시(광역시 오인 금지), 전남광주 광산구→전남광주통합특별시 광주, 순천시→전남광주통합특별시 순천시, 인천 강화군→인천광역시, 부산 기장군→부산광역시, 세종→세종특별자치시(한 번), 강원 고성군→강원특별자치도 고성군; 서버 저장이 구·동·도 행을 거절; 공부방 구 단위 검색은 그대로 통과. PHP는 sqlite로 073 시드를 올려 실제 실행.
- deploy.yml 배포 전 게이트 전부 + `npm run build:dothome`. 실패가 main에서도 나는지 구분.

## 기록·커밋
- `docs/worklog/2026/10/2026-10-09-tutor-region-unit.md`: 지시서 원문 전체, 바꾼 파일·함수, 화면별 변경 전/후, 검사 표, 「2단계(찾기) 할 일」 목록(금지 파일에서 바꿔야 할 것: 과외쌤찾기 탭 시·도 단독 허용, 공부방 모드 과외쌤 탭, 확대카드, 현재위치·GPS 단위 올림, 손님 「서울특별시」 등 파일·함수·줄), 배포 전 사용자 할 일(078 SQL, 계정 삭제 SQL), 검수·승인 '대기'.
- 허용 파일만 개별 add → commit → `git push -u origin cursor/tutor-region-unit-20261009`.

## 보고
커밋 hash, 바꾼 파일 목록, 검사 결과 표, 예시 주소표 결과, 2단계 할 일 목록, SQL 두 파일 요약(관리자 판별 근거 포함), 미확인.
````

## 2. 과외 단위 규칙 (코드 기준)

- 판정 모듈: `src/Region/TutorRegionUnit.php` (PHP) ↔ `preview/shared/tutor-unit-cascade.js` (JS 짝). `is_selectable`은 읽지도 바꾸지도 않는다.
- 단위 행:
  - 광역 시·도 행(`unit_level='sido'`, `sigungu_name=''`, 시도 코드 11·26·27·28·30·31) → 「서울특별시」 등 1단계.
  - 세종(`unit_level='sido'`, official 3600000000, `sigungu_name='세종특별자치시'`) → 「세종특별자치시」 1단계, 이름 한 번.
  - 도(41·43·44·47·48·50·51·52)와 전남광주(12)의 `unit_level='sigungu'` 시·군 행 중 이름에 공백이 없는 행(일반구 「수원시 영통구」 제외) → 「경기도 수원시」 등 2단계.
  - 전남광주 「광주」(078 새 행, `sigungu_code '12200'`, official NULL) → 「전남광주통합특별시 광주」.
- 올림(`unitIdForRegion`): 광역시의 구·군·동 → 그 광역시 행, 일반구·그 동 → 시 행, 옛 광주 5개 구·그 동 → 12200 행, 도의 시·군·동 → 그 시·군.
- 거절: 도 행, 구 행(광역시 구·일반구·광주 구), 동 행, 없는 id → `과외지역은 목록에서 광역시 또는 도의 시·군을 선택해 주세요.`

## 3. 바꾼 파일·함수

### 새 파일

| 파일 | 내용 |
|---|---|
| `src/Region/TutorRegionUnit.php` | `isUnitRow`, `labelFromRow`, `present`, `listUnits`, `fetchRow`, `isUnitId`, `assertUnit`, `labelForId`, `unitIdForRegion`, `findUnit` |
| `preview/shared/tutor-unit-cascade.js` | `normalizeTutorUnits`, `listTutorSidoOptions`, `listTutorUnitsInSido`, `resolveTutorCascade`, `tutorSelectionFromRegionId`, `tutorUnitLabelFromId`, `tutorUnitIdFromLabel`, `tutorUnitIdForAddress`, `renderTutorUnitCascade`, `syncTutorUnitCascade`, `bindTutorUnitCascades` |
| `sql/schema/078_tutor_unit_gwangju.sql` | 「광주」 단위 행 1개 멱등 INSERT (작성만) |
| `sql/ops/2026-10-09-wipe-member-accounts.sql` | 관리자 제외 회원 계정 삭제 초안 (작성만) |
| `scripts/verify-tutor-region-unit.mjs` | 새 게이트 (`npm run verify:tutor-region-unit`) |

### 서버

| 파일 | 함수 | 변경 |
|---|---|---|
| `public/api/auth/regions.php` | (본문) | `action=tutor_units` 추가(단위 목록). `cities`는 그대로(공부방·찾기 화면이 사용) |
| `src/Auth/BasicRegisterService.php` | `listTutorUnits`(새), `normalizeTutorSignupRegions`, 학생 과외 희망지역 검사 | 과외지역 3칸·학생 과외 희망지역을 `TutorRegionUnit::assertUnit`으로 |
| `src/Tutor/TutorRegisterService.php` | 마이페이지 기본정보 지역 저장·마스터 | 단위 목록(`tutor_units`) 제공, 저장 시 `assertUnit` |
| `src/Registration/StudentHubRepository.php` | 과외 분기 희망지역 검사, `tutorUnitRegion`(새) | 과외 분기만 단위, 공부방 분기는 구 그대로 |
| `src/Region/SidoRegionEnsure.php` | `assertSelectable` 삭제 | 과외 저장 검사를 단위 모듈로 이동 |
| `src/Registration/OfficialRegionLabel.php` | `sigunguLabel` 삭제 | 과외 라벨은 `TutorRegionUnit::labelForId` 한 곳 |
| `src/Registration/TutorHubRepository.php` | 슬롯1 라벨 | `TutorRegionUnit::labelForId` |
| `src/Neighborhood/NeighborhoodGreetingService.php` | 과외쌤 동네 이름 | `sigungu_name <> ''` 조건 → `TutorRegionUnit::labelFromRow` |
| `src/Paid/ProviderTicketRepository.php` | 과외쌤 자리 라벨 | `labelForId` |
| `src/Paid/TutorPositionAxis.php` | 축 라벨 | `labelForId` (프라임·픽 = 단위+주력과목) |
| `src/Search/SearchService.php` | `tutorUnitRegionId`(새), `studentRegionId`(새), `isSelectableRegion`(새), `studentGuBaseWhere`, `guestAxisLabels`, 과외쌤·학생(과외 희망) 검색, 손님 기준 수 | 과외쌤 검색·학생 과외 희망 검색은 단위 id만 받고 정확히 일치. 손님 학생 수는 `guest_tutor_unit_id`. **공부방 검색(`searchRooms`)은 main과 동일** |
| `src/Controllers/AuthController.php` | 가입 화면 데이터 | 과외 단위 목록 전달 |
| `src/Views/auth/partials/basic-tutor.php`, `basic-student.php` | 서버 렌더 가입 폼 | 단위 목록·문구 |

### 화면 (JS)

| 파일 | 함수 |
|---|---|
| `preview/shared/tutor-region-slots.js` | `getCityUnits`, `renderTutorRegionSlot`, `bindTutorRegionSlotEvents`, `syncTutorRegionSlotIds`, `collectTutorRegionSlots`, `validateTutorActivityRegions` → 단위 2단계 |
| `preview/shared/korea-sidos.js` | `activityLabelFromRegionId`, `regionIdFromActivityLabel`, `activityLabelForUnit` → 단위 모듈 재수출 |
| `preview/auth-ui/src/auth-api.js` | `fetchRegions`(`tutor_units` 읽기), `signupApi` |
| `preview/auth-ui/src/main.js`, `state.js` | `init`, `signupState`, `resetSignupState` |
| `preview/auth-ui/src/screens/signup-basic.js` | `savedStudentTutorRegionId`, `regionIdForSido`, `renderStudentBasic`, `renderTutorBasic`, `bindSignupBasicEvents` |
| `preview/tutor-ui/src/main.js`, `state.js`, `screens/step-basic.js` | `loadMasters`, `apiMasters`, `getRegions`, `ensureThreeSlots`, `renderBasic`, `bindBasicEvents` |
| `preview/home-ui/src/tutor-reg/city-units.js` | `getTutorCityUnits`, `retryTutorCityUnits`, `applyCities`, `readCitiesPayload`, `fetchCitiesOnce`, `ensureTutorCityUnits` → `tutor_units` |
| `preview/home-ui/src/tutor-reg/screens.js` | `renderBasicForm` (문구) |
| `preview/home-ui/src/student-reg/screens.js` | `hopeRegionValues`, `renderTutorRegionField`, `bindLessonTypeChange`, `bindStudentRegEvents` |
| `preview/home-ui/src/mypage/account-region-label.js` | `primaryTutorRegionId`, `tutorClientLabel` |
| `preview/home-ui/src/tutor-home-seed.js` | `getTutorStudentFeedStatus` 주석 |
| `preview/home-ui/src/tutor-activity-chart.js` | `countExposedCards` (학생 축 필터 `preferred_lesson_type: 'tutor'` + 단위 id) |
| `preview/shared/location-display.js` | `loadGuestBaseline` (손님 과외쌤 기준 id를 구 id로 채우지 않음) |
| `preview/shared/student-hope-regions.js` | 주석만 |

### 검사 스크립트 (구 단위 단언 → 단위 단언으로 교체, 삭제 없음)

`verify-region-save-rules.mjs`, `verify-tutor-region-label.mjs`, `verify-tutor-home-student-tab.mjs`, `verify-tutor-signup-seed.mjs`, `verify-tutor-draft-reuse.mjs`, `verify-neighborhood-welcome.php`, `verify-position-region-tier.php`, `verify-guest-baseline-map-cards.mjs`, `verify-mypage-account-region.mjs`, `verify-student-mypage-hope-region.mjs`, `verify-student-branch-two-tabs.mjs`, `verify-student-location-flow.mjs`, `verify-student-mypage-metrics.mjs`, `package.json`(스크립트 1줄).

## 4. 화면별 변경 전/후

| 화면 | 전 | 후 |
|---|---|---|
| 과외쌤 가입 과외지역 3칸 (`auth-ui` signup-basic + tutor-region-slots) | 시·도 → 시·군·구 2~3단계. 「구가 있는 곳은 구까지, 없는 곳은 시·군까지 고릅니다」. 강남구·영통구 저장 | 시·도 → (도·전남광주만) 시·군. 「광역시·세종은 시·도 선택으로 끝나고, 도는 시·군까지 고릅니다.」. 서울특별시·경기도 수원시 저장, 구·동·도 서버 거절 |
| 과외쌤 가입 서버 렌더 폼 (`basic-tutor.php`) | `cities` 기준 시 목록 | `tutor_units` 기준 단위 목록 |
| 학생 가입 과외 희망지역 (`signup-basic` 학생, `basic-student.php`) | 시·도 / 시·군·구 | 과외 분기: 단위 2단계. 공부방 분기: 그대로(구) |
| 과외쌤 마이페이지 기본정보 (`tutor-reg/screens.js`) | 「구가 있는 곳은 구까지 고릅니다.」, 「시 목록을 연결하는 중입니다.」 | 「광역시는 시 전체, 도는 시·군까지 고릅니다.」, 「과외지역 목록을 불러오는 중입니다.」 |
| 학생 마이페이지 과외 희망지역 (`student-reg/screens.js`) | 시·군·구 3단계, 「희망지역을 끝까지 선택해 주세요.」 | 단위 2단계, 「희망지역의 시·군을 선택해 주세요.」. 공부방 희망지역은 구 그대로 |
| tutor-ui 기본등록 (`step-basic.js`) | 「과외지역(시 단위)… 광역시는 그 자체, 도는 시까지」, 「기본 단위는 「시」입니다.」 | 「광역시는 시 전체, 도는 시·군까지 선택합니다.」, 「광역시는 시 전체, 도는 시·군 단위입니다.」 |
| 마이페이지 계정 지역 라벨 (`account-region-label.js`) | 구 라벨 「서울 강남구」 | 단위 라벨 「서울특별시」 |
| 과외쌤 홈 학생 탭·활동 차트 (`tutor-home-seed.js`, `tutor-activity-chart.js`) | 학생 축 수를 구 id로 셈 | 과외 희망 학생 + 단위 id로 셈 |
| 동네 인사 (서버) | 「강남구에 새로 오신 과외쌤」 | 「서울특별시에 새로 오신 과외쌤이에요.」 |
| 손님 기준(location-display) | 과외쌤 기준 id 없으면 강남구 id로 보충 | 보충하지 않음(서버 단위 id만). **표기 「서울시 강남구」는 그대로 → 2단계** |
| 공부방 가입·찾기·공부방 희망지역 | — | 변경 없음 (`searchRooms`·`region-cascade.js` main과 동일을 새 게이트가 확인) |

## 5. 검사 표

실행 환경: worktree, Node(vite-node), `D:\php8.2\php.exe -d extension=pdo_sqlite -d extension=mbstring`, Git Bash. 기준(main) = 같은 worktree에서 변경 전 `origin/main` 상태로 실행.

### 5-1. 지역 관련 verify (main 대비)

| 스크립트 | main | 변경 후 | 비고 |
|---|---|---|---|
| verify-tutor-region-unit.mjs (새) | — | 통과 93 | 예시 주소표·거절·공부방 구 검색 |
| verify-region-save-rules.mjs | 통과 | 통과 50 | 구 44·도 55 거절 단언 추가 |
| verify-tutor-region-label.mjs | 통과 | 통과 115 | 라벨 단언 → 서울특별시 / 경기도 수원시 |
| verify-mypage-account-region.mjs | 통과 | 통과 41 | |
| verify-location-ssot.mjs | 통과 | 통과 | |
| verify-tutor-home-student-tab.mjs | 통과 | 통과 63 | |
| verify-student-mypage-hope-region.mjs | 통과 | 통과 75 | 구·동 거절 S2b 추가 |
| verify-position-region-tier.mjs | 통과 | 통과 | |
| verify-student-branch-two-tabs.mjs | 통과 | 통과 162 | |
| verify-guest-baseline-map-cards.mjs | 통과 | 통과 77 | 통계 실패 시 과외쌤 기준 null 추가 |
| verify-hold-find-address.mjs | 통과 | 통과 | |
| verify-tutor-signup-seed.mjs | 통과 | 통과 | |
| verify-tutor-box-real-values.mjs | 통과 | 통과 | |
| verify-student-location-flow.mjs | 통과 | 통과 189 | |
| verify-region-sido-canonical.mjs | 통과 | 통과 | |
| verify-student-home-tutor-tier.mjs | 통과 | 통과 | |
| verify-tutor-draft-reuse.mjs | 통과 | 통과 10 | |
| verify-student-count-halt-and-gate.mjs | 통과 | 통과 | |
| verify-tutor-register-same-tab.mjs | 통과 | 통과 | |
| verify-tutor-lesson-optional-step.mjs | 통과 | 통과 | |
| verify-tutor-mypage-frame-ia.mjs | 통과 | 통과 | |
| **verify-tutor-registration-check-frame.mjs** | **실패** | **실패** | main과 같은 3건(render: publish wrap / page: CTA after board / copy: BASIC kicker). 등록점검 파일 = 이번 금지 범위, 지역과 무관 |
| verify-neighborhood-greeting-history.mjs | 통과 | 통과 | |
| verify-neighborhood-welcome.php | 통과 | 통과 | 서울특별시 인사 |
| verify-position-region-tier.php | 통과 | 통과 19 | |
| verify-room-promo-region-match.php | 통과 | 통과 | 공부방 축 |
| verify-pick-region-ownership.php | 통과 | 통과 | |
| verify-prime-region-ownership.php | 통과 | 통과 | |
| verify-student-request-text-exposure.php | 통과 | 통과 | |
| verify-student-mypage-metrics.mjs (playwright) | — | 통과 | 단위 cascade 있음 / `[data-gu-wrap]` 없음 |
| verify-tutor-mypage-route-integrity | — | OK | |

### 5-2. deploy.yml 배포 전 게이트 + 빌드 (변경 후)

| 게이트 | 결과 |
|---|---|
| `scripts/php-syntax-check.sh` | 통과 (310 파일) |
| `npm run verify:board-acl:js` | 통과 |
| `verify-board-channel-acl.php` | 통과 |
| `compare-board-acl-matrix.mjs` | 통과 |
| `npm run verify:shop-page` | 통과 |
| `scripts/check-no-committed-secrets.sh` | 통과 |
| `npm run verify:tutor-inquiries-settings` | 통과 |
| `npm run verify:study-room-inquiries-samples` | 통과 |
| `npm run build:dothome` | 성공. 번들에 `action=tutor_units` 포함. 산출물(`public/assets/*`)은 커밋하지 않음 |

## 6. 예시 주소표 결과 (새 게이트, sqlite + 073 시드 + 078 두 번 실행)

| 입력 주소 | 서버 단위 라벨 | 화면(JS) | 결과 |
|---|---|---|---|
| 서울 강남구 | 서울특별시 | 같은 id | 통과 |
| 수원시 영통구 | 경기도 수원시 | 같은 id | 통과 |
| 경기도 광주시 | 경기도 광주시 (광역시 오인 없음) | 같은 id | 통과 |
| 전남광주 광산구 | 전남광주통합특별시 광주 | 같은 id | 통과 |
| 순천시 | 전남광주통합특별시 순천시 | 같은 id | 통과 |
| 인천 강화군 | 인천광역시 | 같은 id | 통과 |
| 부산 기장군 | 부산광역시 | 같은 id | 통과 |
| 세종 | 세종특별자치시 (한 번) | 같은 id | 통과 |
| 강원 고성군 | 강원특별자치도 고성군 (경남 고성군과 구분) | 같은 id | 통과 |

그 밖에 같은 게이트에서 확인:

- 시드 284행, 078 실행 뒤 광주 행 1개(두 번 실행해도 1개), `is_selectable` 개수 078 전후 같음(256).
- 단위 라벨에 「…구」로 끝나는 것·도 단독 없음. 세종 1개, 광역시 7개, 일반구 시 12곳+화성은 시 한 단위.
- 거절: 강남구, 영통구, 광산구, 강화군 행, 경기도 행, 강원 행, 전남광주 시·도 행, 대치동, 매탄동, 없는 id. 가입 3칸 정규화도 구·동·도·2번 칸 구 거절.
- 검색: 과외쌤 탭은 단위만, 학생(과외 희망)은 단위만, 학생(공부방 희망)·공부방 축은 강남구 그대로 통과(서울 단위·광주 078 행은 공부방 축에서 거절). `searchRooms` 본문 main과 동일.
- 화면: 시·도 16개, 서울·세종 1단계 완료, 경기도 2단계, 2단계에 구 없음, 전남광주 2단계에 광주. 렌더 HTML에 `region_gu` 없음. 목록 비면 오류 문구.

## 7. 2단계(찾기) 할 일 — 이번 금지 파일이라 손대지 않음

**1단계와 2단계는 같이 배포해야 한다.** 지금 찾기 화면은 과외쌤 탭·학생(과외 희망) 탭에 `cities` 기준 구 id를 보내고, 서버는 이제 구 id를 거절한다(`지역은 광역시 또는 도의 시·군으로 선택해 주세요.`).

### 7-1. 과외쌤찾기 탭: 시·도 단독(광역시) 허용, 도는 시·군까지 — `preview/search-ui/src/search-find-surface.js`

| 줄 | 함수·위치 | 할 일 |
|---|---|---|
| 54-59 | import (`activityLabelFromRegionId`, `normalizeCities` from `region-cascade.js`) | 과외쌤 탭·과외 희망 학생 탭은 `tutor-unit-cascade.js`(`normalizeTutorUnits`, `tutorUnitLabelFromId`, `renderTutorUnitCascade`, `bindTutorUnitCascades`) 사용 |
| 540 | `GU_PICK_HINT` '시·군·구까지 선택해 주세요' | 과외 축 문구: 광역시는 시·도, 도는 시·군까지 |
| 567-598 | `bootFindCities` (`/api/auth/regions.php?action=cities`, `normalizeCities`) | 과외 축용 `action=tutor_units` 목록을 따로 받기 |
| 610-614 | `selectableFindRegionId` | 과외 축은 단위 목록 기준으로 판정(지금은 `cities` 구 행만 통과 → 광역시 시·도 단독 불가) |
| 622-640 | `dropLegacyLessonRegionFilters` | `tutor_region_id`·`preferred_region_id` 단위 판정 |
| 1010-1022 | `restoreFindSearch` | 복원 id를 단위로 |
| 1395-1440, 1469-1484 | `regionLabelFromFilters`, `studentLabelFromFilters` | 단위 라벨(`tutorUnitLabelFromId`) |
| 1775-1815 | `rememberedGuId`, `rememberGuId`, `cascadePick`, `cascadePickForTutor`, `cascadePickForStudent` | 단위 선택 상태 |
| 1830 | `renderStep3Field` placeholder '시·군·구까지입니다' | 과외 축에는 3단계 없음 문구 |
| 1940-1960 | `renderGuCascadeField` (`renderRegionCascade` + `findCityUnits`) | 과외 축은 `renderTutorUnitCascade` |
| 2200 | `renderTutorRegionHint` '해당 시·구의 과외쌤 목록' | 「광역시 / 도의 시·군」 문구 |
| 2632-2637 | `guPickIncomplete` | 과외 축은 단위 hidden 값 기준 |
| 2827-2850 | `bindFindSurfaceEvents` (`bindRegionCascades(root, findCityUnits)`, change 핸들러 L2835 `selectableFindRegionId`, L2838 라벨) | 과외 축은 `bindTutorUnitCascades` + 단위 id·라벨 |

### 7-2. 공부방 모드(학생 공부방 희망)·공부방 회원의 과외쌤 탭

| 파일·줄 | 함수 | 할 일 |
|---|---|---|
| `search-find-surface.js` 408-428 (L424-426) | `studentFeedFilters` | 공부방 희망 학생의 현재 위치는 구·동 id라 과외쌤 탭에 그대로 보내면 거절됨 → `tutor_region_id`는 단위로 올려서 보냄 |
| `search-find-surface.js` 1225-1252 | `regionFeedContext` | 탭 전환 때 과외쌤 탭 지역 = 단위 |

### 7-3. 현재 위치·GPS 단위 올림

| 파일·줄 | 함수 | 할 일 |
|---|---|---|
| `search-find-surface.js` 1071-1139 (L1107 `reverseGeocodeCoords`, L1126 `applyCanonicalLocation`) | GPS 부트 | 과외 축이면 역지오코딩 시·도·시군구를 `tutorUnitIdForAddress(sido, sigungu, units)`(`preview/shared/tutor-unit-cascade.js` L148)로 단위 id로 올림 |
| `search-find-surface.js` 476-496 | `canonicalFromKakao` | 주소 찾기 결과도 과외 축은 단위로 |
| `search-find-surface.js` 360 | `resolveCanonicalGuRegionId` | 공부방 축 전용으로 유지, 과외 축 분리 |

### 7-4. 확대카드(상세)·카드 지역 표기

| 파일·줄 | 함수 | 할 일 |
|---|---|---|
| `preview/home-ui/src/detail-decision/tutor-detail.js` 20-31 | 과외지역 `dd` | 손님은 `coarseRegionForGuest(item.location_label)` → 「서울특별시」가 「—」로 나옴. 과외 단위 라벨은 손님에게도 그대로(또는 시·도) 보이게 |
| `preview/home-ui/src/exposure-render.js` 769-770, 846-847, 946-947 | 카드 렌더 | 같은 `coarseRegionForGuest` 사용 → 과외 축 분기 |
| `preview/home-ui/src/student-blind-teaser.js` 56-72 | `coarseRegionForGuest` | (금지 파일은 아니나 위 금지 파일들이 소비자) 「서울특별시」→「—」, 「경기도 수원시」→「수원시권」. 과외 단위용 손님 표기 규칙 필요 |
| `preview/search-ui/src/search-exposure-mapper.js` 31-42, 64, 115, 150 | `normalizeApiRegionLabel` | 서버 `region_label`이 단위 라벨로 바뀜. tutor 축 `toDisplayLabel`은 그대로 통과(확인함), 별도 손질 불필요 여부만 2단계에서 확인 |

### 7-5. 손님 「서울특별시」

| 파일·줄 | 함수 | 할 일 |
|---|---|---|
| `preview/shared/location-display.js` 618 | `GUEST_BASE_TUTOR_LABEL = '서울시 강남구'` | 「서울특별시」로 (이 파일은 금지 아님. 단 소비자가 금지 파일이라 2단계와 같이 바꿈) |
| `preview/shared/location-display.js` 630-635, 701-716 | `guestTutorLabel`, `loadGuestBaseline` | 과외 표기를 `cities` 구 행 조합 대신 단위 라벨(서버 `axes.tutor` = 「서울특별시」)로 |
| `preview/home-ui/src/exposure-render.js` 351, 363 | 손님 카드 `location_label` | `readGuestBaseline().tutor` 값 바뀜 확인 |
| `preview/shared/guest-gate-ui.js` | 손님 안내 | 과외 지역 문구 확인 |

## 8. 배포 전 사용자 할 일

1. **운영 phpMyAdmin에서 `sql/schema/078_tutor_unit_gwangju.sql` 적용** (072·073 선행). 적용 전에는 전남광주 「광주」 단위가 없어 옛 광주 구 주소는 단위를 못 찾는다. 두 번 실행해도 1행.
2. **`sql/ops/2026-10-09-wipe-member-accounts.sql` 검토 후 단계별 실행** (먼저 DB 백업).
   - 0단계 SELECT로 남길 관리자·건수 확인 → 1단계 대상 표 → 2~5·7단계 트랜잭션 → 확인 SELECT → COMMIT/ROLLBACK → 8단계 정리.
   - 「사용자 확인 필요」: 6단계 결제·정산(6-A 결제 기록 남기고 회원 표시만 지움 / 6-B 결제 기록까지 삭제 / 둘 다 안 함), 게시판 글·댓글·반응·신고, 1:1 문의(user_id NULL로 남음), 겸직 관리자의 등록 카드, 업로드 파일·동네 인사 JSON(DB 밖).
3. **1단계(이 브랜치)와 2단계(찾기)는 같이 배포.** 1단계만 나가면 찾기 화면 과외쌤 탭·과외 희망 학생 탭이 구 id를 보내 서버가 거절한다.
4. 환경변수·Secrets·`.htaccess` 변경 없음.

## 9. SQL 두 파일 요약

- `078_tutor_unit_gwangju.sql`: `regions`에 (`sido_code '12'`, `sido_name '전남광주통합특별시'`, `sigungu_code '12200'`, `sigungu_name '광주'`, `unit_level 'sigungu'`, `official_code NULL`, `is_selectable 0`, `is_active 1`) 1행을 `WHERE NOT EXISTS`로 멱등 INSERT + 확인 SELECT. `is_selectable 0`이라 공부방 구 목록·검색에 안 나온다. 되돌리기 DELETE 주석 포함.
- `2026-10-09-wipe-member-accounts.sql`: 관리자를 남기고 회원·등록 데이터 삭제 초안.
  - 관리자 판정(하나라도 맞으면 남김): ① `users.admin_level IS NOT NULL` (036_admin_level_and_must_change.sql, `AdminRoleService` 「등급 정본」) ② `user_roles.role_type='admin'` (001_init, 036 백필) ③ 코드 보호 이메일 `jetty@naver.com`·`*@dev.local` (`src/Admin/AdminRoleService.php` 26-33·66, `AdminMemberDeleteService::isProtectedOperator`).
  - 순서 근거: `AdminMemberDeleteService` 삭제 순서 + sql/schema 001~077 FK 확인(RESTRICT: user_profiles·user_roles·students·study_rooms·tutors / CASCADE 자식 표 / SET NULL: provider_profile_views.viewer_user_id·support_tickets.user_id / FK 없는 target 참조는 직접 삭제, 남는 카드 추천 수 보정).
  - 결제·정산(6단계)은 「사용자 확인 필요」로 주석 처리. 071 적용 여부를 0-3 SELECT로 확인.

## 10. 미확인

- 실제 브라우저·운영 사이트 확인 안 함(작업 브랜치, 미배포).
- SQL 두 파일은 실행하지 않음(운영 DB 구조와 FK 이름은 sql/schema 파일 기준으로만 확인).
- 결제·정산 처리 방식은 사용자 결정 필요.
- 관리자 화면 `AdminExposureRepository::regionDisplayExpr`가 세종을 두 번 표기 — 이번 범위 밖.
- `scripts/capture-student-mypage-shots.mjs`(캡처 도구, 게이트 아님)는 여전히 `cities`만 흉내 냄.
- `verify-tutor-registration-check-frame.mjs` 실패는 main과 같은 기존 실패(등록점검 파일, 이번 금지 범위).

## 11. 검수·승인

| 항목 | 상태 |
|---|---|
| 독립 검수 | 대기 |
| 사용자 승인 | 대기 |
