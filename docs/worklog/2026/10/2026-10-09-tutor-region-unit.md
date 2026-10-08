# 2026-10-09 과외지역 단위 1단계 (입력·저장·표기 원천) + 2단계 (찾기)

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
| ~~`sql/ops/2026-10-09-wipe-member-accounts.sql`~~ | 관리자 제외 회원 계정 삭제 초안 (작성만) → **2단계 커밋에서 `git rm`** (사용자가 관리자 콘솔로 직접 삭제 완료, 12절) |
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
| 손님 기준(location-display) | 과외쌤 기준 id 없으면 강남구 id로 보충 | 보충하지 않음(서버 단위 id만). 표기는 2단계에서 「서울특별시」로(14절) |
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

## 7. 2단계(찾기) 할 일 — 1단계 때 금지 파일이라 손대지 않음 (→ 2단계에서 처리, 12~17절)

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
2. 회원 계정 삭제: **사용자가 관리자 콘솔로 직접 삭제 완료(00:33)**. 남은 회원 jetty@naver.com(마스터·공부방), leejetty@gmail.com(관리자·학생). 삭제 SQL 초안은 2단계 커밋에서 지움.
3. **1단계와 2단계(찾기)는 같이 배포.** 두 단계 모두 이 브랜치에 있다(1단계 `dad3d2e` + 2단계 커밋). 1단계만 나가면 찾기 화면 과외쌤 탭·과외 희망 학생 탭이 구 id를 보내 서버가 거절한다.
4. 환경변수·Secrets·`.htaccess` 변경 없음.

## 9. SQL 요약

- `078_tutor_unit_gwangju.sql`: `regions`에 (`sido_code '12'`, `sido_name '전남광주통합특별시'`, `sigungu_code '12200'`, `sigungu_name '광주'`, `unit_level 'sigungu'`, `official_code NULL`, `is_selectable 0`, `is_active 1`) 1행을 `WHERE NOT EXISTS`로 멱등 INSERT + 확인 SELECT. `is_selectable 0`이라 공부방 구 목록·검색에 안 나온다. 되돌리기 DELETE 주석 포함.
- 회원 계정 삭제 SQL 초안(`sql/ops/2026-10-09-wipe-member-accounts.sql`)은 폐기·삭제(사용자가 관리자 콘솔로 직접 삭제 완료, 00:33).

## 10. 미확인

- 실제 브라우저·운영 사이트 확인 안 함(작업 브랜치, 미배포).
- 078 SQL은 실행하지 않음(운영 DB 구조는 sql/schema 파일 기준으로만 확인).
- 관리자 화면 `AdminExposureRepository::regionDisplayExpr`가 세종을 두 번 표기 — 이번 범위 밖.
- `scripts/capture-student-mypage-shots.mjs`(캡처 도구, 게이트 아님)는 여전히 `cities`만 흉내 냄.
- `verify-tutor-registration-check-frame.mjs` 실패는 main과 같은 기존 실패(등록점검 파일, 이번 금지 범위).

## 11. 검수·승인 (1단계 `dad3d2e`)

| 항목 | 상태 |
|---|---|
| 독립 검수 | 대기 |
| 사용자 승인 | 대기 |

---

# 2단계 (찾기)

## 12. 지시서 원문 (2단계)

수신 2026-10-09 00:48 (UTC+9)

````text
수고했다. 이어서 2단계(찾기)를 같은 worktree `d:\work\study114\.wt\tutor-region-unit`, 같은 브랜치 `cursor/tutor-region-unit-20261009`에서 새 커밋으로 진행하라. `dad3d2e`는 독립 리뷰 중이니 amend 금지.

## 먼저: 계정 삭제 SQL 폐기
사용자가 관리자 콘솔에서 일반 회원을 직접 다 지웠다(2026-10-09 00:33 「회원은 관리자 2개만 남아 있어.」). 남은 회원: jetty@naver.com(마스터·공부방), leejetty@gmail.com(관리자·학생). `ops@dev.local`은 정지됐고 다른 브랜치(`cursor/remove-dev-operator-20261009`)에서 `*@dev.local` 보호·대체 처리를 코드에서 제거 중이다. 따라서 `sql/ops/2026-10-09-wipe-member-accounts.sql`은 필요 없으니 `git rm`으로 지우고, worklog의 배포 전 할 일에서 계정 삭제 항목을 빼고 「사용자가 관리자 콘솔로 직접 삭제 완료(00:33)」로 바꿔라.

## 2단계 범위 (네가 worklog 7절에 적은 5개 그대로)
사용자 규칙(원문): 「공부방찾기는 기존대로, 과외쌤찾기는 광역시 검색가능, 도는 시나 군까지 입력해야 검색가능.」
1. 과외쌤찾기 탭 `search-find-surface.js`: `tutor_units` 기준 선택(광역시·세종은 시·도만으로 검색 가능, 도·전남광주는 시·군 선택해야 검색 가능). 구 단계 없음. 공부방찾기는 기존 동작 그대로(바이트 단위로 바뀌지 않게, 공부방 분기 diff 0 확인).
2. 공부방 모드의 과외쌤 탭 `studentFeedFilters`: 구·동 id → 과외 단위 id로 올려서 `tutor_region_id`.
3. 현재 위치·GPS·`canonicalFromKakao`: 과외 축이면 `tutorUnitIdForAddress`로 단위 id.
4. 확대카드 `coarseRegionForGuest`: 「서울특별시」가 「—」로 바뀌지 않게(과외 단위 라벨은 그대로 보여 줌). `tutor-detail.js`, `exposure-render.js` 해당 줄.
5. 손님 기준 라벨 `location-display.js` `GUEST_BASE_TUTOR_LABEL`·`guestTutorLabel`·`loadGuestBaseline`: 과외 축 손님 기준은 「서울특별시」.

## 겹침 주의
다른 브랜치 `cursor/remove-samples-20261009`(리뷰 중, 아직 main 아님)가 `search-find-surface.js`(약 137, 180, 2495행 샘플 블록), `exposure-render.js`(샘플 도장·샘플 아이템), `search-tier-render.js`를 고쳤다. 너는 샘플 관련 줄을 건드리지 말고 지역 로직만 고쳐서, 나중에 두 브랜치를 합칠 때 충돌이 작게 하라. 작업 끝에 `git merge-tree $(git merge-base HEAD origin/cursor/remove-samples-20261009) HEAD origin/cursor/remove-samples-20261009` 등으로 충돌 예상 파일·구간을 보고하라(실제 merge는 하지 마라).

## 금지
베이직카드 항목(정본 73)·저장 버그·샘플 제거는 이번에 고치지 마라(발견 시 보고만). SQL·env·.htaccess 변경 금지(078은 이미 있음). `git add -A` 금지, main push·merge 금지.

## 검사
새 게이트 `verify-tutor-region-unit`에 2단계 항목 추가(과외쌤찾기: 서울 시·도만으로 검색 가능 / 경기도만으로는 불가 / 경기도 수원시 가능 / 전남광주 광주 가능, GPS 강남구 → 서울특별시, 손님 라벨 서울특별시, 확대카드 「—」 아님, 공부방찾기 강남구 그대로). 기존 지역 검사 30개, deploy.yml 게이트 8개, `build:dothome`. main에서도 실패하는 건 구분. 가능하면 vite dev + 실제 PHP로 과외쌤찾기 화면 확인, 불가하면 미실행+사유.

## 기록
worklog `2026-10-09-tutor-region-unit.md`에 이 지시 원문, 2단계 변경 파일·함수, 화면별 전/후, 검사 표, 충돌 예상 보고. 파일명 지정 stage, 새 커밋, push.

보고: 새 커밋 hash, 파일별 1줄, 검사 표, 충돌 예상, 배포 전 사용자 할 일, 미확인.
````

## 13. 2단계 바꾼 파일·함수

| 파일 | 함수·위치 | 변경 |
|---|---|---|
| `sql/ops/2026-10-09-wipe-member-accounts.sql` | — | `git rm` (사용자가 관리자 콘솔로 직접 삭제 완료 00:33) |
| `preview/search-ui/src/search-find-surface.js` | import | `tutor-unit-cascade.js`에서 `TUTOR_UNIT_LIST_ERROR`, `bindTutorUnitCascades`, `normalizeTutorUnits`, `renderTutorUnitCascade`, `tutorUnitIdForAddress`, `tutorUnitIdFromLabel`, `tutorUnitLabelFromId` |
| 〃 | `bootFindTutorUnits`(새), `whenFindCitiesReady(tab)` | 과외 축 목록 `regions.php?action=tutor_units`를 따로 받음. 공부방 탭은 `cities`만 기다림(그대로) |
| 〃 | `isTutorUnitAxis`, `tutorUnitFindId`, `axisFindRegionId`, `axisRegionLabel`, `findPickHint`, `tutorUnitIdForPlace`, `tutorUnitCanonical`, `liftTutorPlace` (새) | 과외 축 = 과외쌤 탭 + 학생 탭(과외 희망). 위치(id·라벨·시도/시군구·원문)를 단위로 올림. 도만 있으면 단위 없음 |
| 〃 | `renderTutorUnitField`(새), `renderField`(`tutor_region_id`, `preferred_region` 과외 희망) | 과외 축은 시·도 → (도·전남광주만) 시·군 2칸. 구 칸 없음. 안내 「광역시는 시·도, 도는 시·군까지 선택해 주세요」. 공부방 희망 학생은 `renderGuCascadeField` 그대로 |
| 〃 | `studentFeedFilters` | 과외 축이면 현재 위치(구·동)를 단위 id로 올려 `tutor_region_id`/`preferred_region_id` |
| 〃 | `canonicalFromKakao`, `applyCanonicalLocation`, `canonicalRegionLabel` | 과외 축이면 주소찾기·저장 라벨·URL 라벨을 단위로 올림(손님 제외) |
| 〃 | `bootFindGpsIfNeeded` | 과외 축이면 역지오코딩 결과를 `tutorUnitCanonical`로 단위로. 못 찾으면 `gps-skip no-tutor-unit` |
| 〃 | `dropLegacyLessonRegionFilters`, `restoreFindSearch` | 복원 id를 단위 판정(학생은 희망 분기별) |
| 〃 | `regionLabelFromFilters`, `studentLabelFromFilters`, `rememberedGuId`, `rememberGuId`, `cascadePick` | 축별 id·라벨(`axisFindRegionId`, `axisRegionLabel`) |
| 〃 | `renderStep3Field` (비활성 문구), `renderTutorRegionHint` | 「광역시·시·군까지입니다」, 「해당 광역시·시·군의 과외쌤 목록」 |
| 〃 | `runFindSearch`, `runFindSearchWithFilters`, `refreshSearchedLabelWhenCitiesReady` | 안내 문구·목록 대기를 축별로 |
| 〃 | `bindFindSurfaceEvents`, `guestServerPlace`, `bootGuestFindSurface`, `bootStudentFindFeed` | `region-cascade.js` 바인딩은 `tutor_unit` 칸을 빼고, 단위 칸은 `bindTutorUnitCascades`. 손님 학생 탭은 `base.student` |
| `preview/search-ui/src/screens/search-page.js` | 검색 복원, 손님 현재 위치 | `whenFindCitiesReady(tab)`, 손님 학생 탭 `base.student` |
| `preview/shared/location-display.js` | `GUEST_BASE_TUTOR_LABEL`, `GUEST_BASE_STUDENT_LABEL`(새), `guestStudentLabel`(← `guestTutorLabel`), `loadGuestBaseline` | 손님 과외쌤 기준 표기 「서울특별시」. 학생 기준은 「서울시 강남구」 그대로(서버 학생 축 = 강남구) |
| `preview/home-ui/src/guest-sections.js` | `guestAxisText`, 학생 섹션 라벨 | 학생 섹션은 `base.student` |
| `preview/shared/tutor-unit-cascade.js` | `isTutorUnitLabel`(새) | 목록 없이 글자로 과외 단위 표기인지 판정 |
| `preview/home-ui/src/student-blind-teaser.js` | `coarseRegionForGuest` | 과외 단위 표기면 그대로 반환 |
| `scripts/verify-tutor-region-unit.mjs` | 1부 검색 2건, 4부(새) | 4부 = 실제 `search-find-surface.js` 하위 실행(14·15절) |
| `scripts/verify-guest-baseline-map-cards.mjs` | P4·P1·P11 | 과외쌤 표기 단언 「서울시 강남구」 → 「서울특별시」, 학생 「서울시 강남구」 단언 추가 |
| `scripts/verify-hold-find-address.mjs` | S1 | 과외쌤 탭 늦은 목록 = `tutor_units`(서울특별시)로 교체. 같은 「목록 전 숫자 → 목록 뒤 라벨」 단언 유지 |

4번(확대카드)은 `tutor-detail.js`·`exposure-render.js`를 고치지 않고 두 파일이 부르는 `coarseRegionForGuest` 한 곳에서 처리했다. 두 파일 모두 `cursor/remove-samples-20261009`가 고친 파일이라 충돌을 피하려는 것이고, 같은 함수를 쓰는 `detail-utils.js`·`studyroom-detail.js`·학생 티저에도 같이 적용된다. 동 단위 공부방 라벨 결과는 main과 같다(게이트로 확인).

## 14. 화면별 전/후 (2단계)

| 화면 | 전 | 후 |
|---|---|---|
| 과외쌤 찾기 지역칸 | `cities` 시·도 → 시·군·구. 「시·군·구까지 선택해 주세요」. 서울은 구까지 골라야 검색 | 시·도 → (도·전남광주만) 시·군. 서울·세종 등 광역시는 시·도만으로 검색. 경기도만 고르면 검색 안 하고 「광역시는 시·도, 도는 시·군까지 선택해 주세요」 |
| 과외쌤 찾기 결과·현재 위치 | 「서울특별시 강남구」, `tutor_region_id` = 구 id (1단계 서버는 거절) | 「서울특별시」·「경기도 수원시」·「전남광주통합특별시 광주」, `tutor_region_id` = 단위 id |
| 학생 찾기(과외 희망) | 구 단위 | 과외쌤 찾기와 같은 단위 2칸 |
| 학생 찾기(공부방 희망)·공부방 찾기 | 구 + 동(3단계) | **변경 없음** (origin/main 모듈과 폼 HTML·검색 요청·현재 위치·주소 비교 같음) |
| 공부방 회원의 과외쌤 탭 피드 | 현재 위치 구·동 id 그대로 `tutor_region_id` | 단위 id로 올려서 보냄 |
| GPS·주소찾기 (과외 축) | 「서울시 강남구」 | 「서울특별시」(강남구 대치동), 「경기도 수원시」(영통구 매탄동) |
| 손님 과외쌤 기준 표기 | 「서울시 강남구」 | 「서울특별시」. 손님 학생 표기는 「서울시 강남구」 그대로 |
| 손님 확대카드·상세 과외지역 | 「서울특별시」 → 「—」, 「경상북도 안동시」 → 「안동」 | 과외 단위 표기는 그대로. 동 라벨(공부방)은 main과 같음 |

## 15. 검사 표 (2단계)

### 15-1. 새 게이트 `verify-tutor-region-unit` (127 통과, 1단계 93 + 2단계 34)

| 항목 | 결과 |
|---|---|
| 서버: `tutor_region_id` = 경기도 수원시 단위 / 전남광주 광주 단위 통과 (실제 PHP, sqlite 073+078) | 통과 |
| 과외쌤 찾기 지역칸 = 시·도·시·군 2칸, 구 칸 없음, 안내 문구 | 통과 |
| 서울: 시·도만으로 검색(`tutor_region_id` = 서울 단위), 현재 위치 서울특별시 | 통과 |
| 경기도만: 검색 요청 0건 + 시·군 안내 | 통과 |
| 경기도 수원시: 검색, 현재 위치 경기도 수원시 | 통과 |
| 전남광주 광주: 검색(078 행), 현재 위치 전남광주통합특별시 광주 | 통과 |
| GPS 강남구 대치동 → 서울특별시(단위 id), 화면 라벨 서울특별시 / 영통구 매탄동 → 경기도 수원시 / 학생(과외 희망) → 서울특별시 | 통과 |
| 손님 기준 과외쌤 서울특별시 · 학생 서울시 강남구 · 공부방 대치동, 손님 과외쌤 찾기 현재 위치 서울특별시 | 통과 |
| 확대카드 서울특별시·세종특별자치시·경기도 수원시·전남광주통합특별시 광주·경상북도 안동시 그대로(「—」 아님), 상세 본문 서울특별시 | 통과 |
| 공부방·동 라벨 손님 표기 = origin/main `coarseRegionForGuest` | 통과 |
| 공부방 찾기 강남구(공부방 회원·손님), 지역 없음, 학생(공부방 희망) 강남구: 폼 HTML·검색 요청·현재 위치·주소 = origin/main 모듈 | 통과 |
| 공부방 찾기 `sigungu_region_id` = 강남구 id 그대로, GPS 강남구 대치동 = origin/main | 통과 |

공부방 비교 단언이 실제로 차이를 잡는지 확인: `axisRegionLabel` 공부방 분기에 일부러 글자를 바꾸면 2건 실패 → 되돌림.

### 15-2. 기존 지역 검사 30개 (+ 새 게이트)

| 스크립트 | main | 2단계 후 | 비고 |
|---|---|---|---|
| verify-region-save-rules.mjs | 통과 | 통과 50 | |
| verify-tutor-region-label.mjs | 통과 | 통과 115 | |
| verify-mypage-account-region.mjs | 통과 | 통과 41 | |
| verify-location-ssot.mjs | 통과 | 통과 | |
| verify-tutor-home-student-tab.mjs | 통과 | 통과 63 | |
| verify-student-mypage-hope-region.mjs | 통과 | 통과 75 | |
| verify-position-region-tier.mjs | 통과 | 통과 | |
| verify-student-branch-two-tabs.mjs | 통과 | 통과 162 | |
| verify-guest-baseline-map-cards.mjs | 통과 | 통과 77 | 단언 교체(13절) |
| verify-hold-find-address.mjs | 통과 | 통과 | S1 교체(13절) |
| verify-tutor-signup-seed.mjs | 통과 | 통과 | |
| verify-tutor-box-real-values.mjs | 통과 | 통과 49 | |
| verify-student-location-flow.mjs | 통과 | 통과 189 | |
| verify-region-sido-canonical.mjs | 통과 | 통과 | |
| verify-student-home-tutor-tier.mjs | 통과 | 통과 24 | |
| verify-tutor-draft-reuse.mjs | 통과 | 통과 10 | |
| verify-student-count-halt-and-gate.mjs | 통과 | 통과 28 | |
| verify-tutor-register-same-tab.mjs | 통과 | 통과 | |
| verify-tutor-lesson-optional-step.mjs | 통과 | 통과 | |
| verify-tutor-mypage-frame-ia.mjs | 통과 | 통과 | |
| **verify-tutor-registration-check-frame.mjs** | **실패 3** | **실패 3** | main과 같은 기존 실패(render: publish wrap / page: CTA after board / copy: BASIC kicker). 지역과 무관 |
| verify-tutor-inquiries-settings.mjs | 통과 | 통과 | |
| verify-study-room-inquiries-samples.mjs | 통과 | 통과 | |
| verify-neighborhood-greeting-history.mjs | 통과 | 통과 65 | |
| verify-neighborhood-welcome.php | 통과 | 통과 | |
| verify-position-region-tier.php | 통과 | 통과 | |
| verify-room-promo-region-match.php | 통과 | 통과 | |
| verify-pick-region-ownership.php | 통과 | 통과 | |
| verify-prime-region-ownership.php | 통과 | 통과 | |
| verify-student-request-text-exposure.php | 통과 | 통과 | |
| verify-tutor-region-unit.mjs (새) | — | 통과 127 | |

### 15-3. deploy.yml 게이트 8개 + 빌드

| 게이트 | 결과 |
|---|---|
| `scripts/php-syntax-check.sh` | 통과 |
| `npm run verify:board-acl:js` | 통과 |
| `verify-board-channel-acl.php` | 통과 |
| `compare-board-acl-matrix.mjs` | 통과 |
| `npm run verify:shop-page` | 통과 |
| `scripts/check-no-committed-secrets.sh` | 통과 |
| `npm run verify:tutor-inquiries-settings` | 통과 |
| `npm run verify:study-room-inquiries-samples` | 통과 |
| `npm run build:dothome` | 성공. `public/assets/index-*.js`·`public/search/assets/index-*.js`에 새 안내 문구 포함. 산출물 커밋 안 함 |

### 15-4. vite dev + 실제 PHP 화면 확인

**미실행.** 사유: 이 PC에 MySQL이 없고(127.0.0.1:3306 닫힘, mysqld 프로세스 없음) `config/database.php`도 없다. `Connection`은 MySQL 전용이라 PHP API가 뜨지 않는다. 설정 파일·DB를 새로 만드는 것은 env/설정 변경이고 가짜 데이터가 필요해 금지 범위다. 대신 4부가 실제 `search-find-surface.js`·`location-display.js`·`tutor-detail.js` 모듈을 실제 PHP(sqlite 073+078)가 만든 단위 목록으로 돌린다(브라우저 API만 흉내).

## 16. 충돌 예상 (`origin/cursor/remove-samples-20261009`, 실제 merge 안 함)

`git merge-tree <merge-base> <2단계 트리> origin/cursor/remove-samples-20261009`와 `git merge-tree --write-tree --name-only --messages`로 확인(merge-base `bc76015`). **충돌 0건(충돌 표시 0, `--write-tree` 종료 0).** 양쪽이 고친 6개 파일은 모두 자동 병합된다.

| 파일 | 이 브랜치 구간(base 기준 행) | samples 브랜치 구간 | 판단 |
|---|---|---|---|
| `preview/search-ui/src/search-find-surface.js` | 59~2838 사이 지역 로직 40여 곳 | 137, 180, 2495 (샘플 블록) | 자동 병합. 가장 가까운 곳: 우리 100/212 ↔ 137·180, 우리 2200/2678 ↔ 2495. 병합 결과 `node --check` 통과 |
| `preview/home-ui/src/guest-sections.js` | 35, 179 | 108, 151, 195~199 | 자동 병합. 179 ↔ 195가 16행 차이로 가장 가깝다. 병합 결과 `node --check` 통과 |
| `scripts/verify-guest-baseline-map-cards.mjs` | 97~337 | 2, 374~389 | 자동 병합. 병합 결과 `node --check` 통과 |
| `scripts/verify-student-branch-two-tabs.mjs` | 155~419 (1단계) | 517~620 | 자동 병합 |
| `scripts/verify-student-mypage-metrics.mjs` | 136~443 (1단계) | 74 | 자동 병합 |
| `package.json` | 40 (1단계 스크립트 1줄) | 48 | 자동 병합 |

`exposure-render.js`·`search-tier-render.js`·`tutor-detail.js`는 이 브랜치가 건드리지 않았다. samples 브랜치가 지운 샘플 파일 10개는 이 브랜치가 건드리지 않았다.

## 17. 배포 전 사용자 할 일 · 발견 보고 · 미확인 (2단계)

배포 전 사용자 할 일:

1. 운영 phpMyAdmin에서 `sql/schema/078_tutor_unit_gwangju.sql` 적용(1단계와 같음, 이번에 SQL 변경 없음).
2. 1단계 `dad3d2e`와 2단계 커밋을 **같이** 배포.
3. 회원 계정 삭제는 사용자가 관리자 콘솔로 직접 삭제 완료(00:33) — 할 일 없음.
4. 환경변수·Secrets·`.htaccess` 변경 없음.

발견 보고(고치지 않음):

- `coarseRegionForGuest`는 공부방 카드(`exposure-render` 769)·`studyroom-detail.js`도 쓴다. 공부방 라벨이 동 없이 정확히 「서울특별시」·「경기도 수원시」 모양이면 전에는 「—」·「수원시권」, 이제는 그대로 나온다. 동이 있는 공부방 라벨은 main과 같다(게이트 확인).
- GPS로 올린 광역시 위치(「서울특별시」)는 저장 후 새로고침 때 `normalizeLocation`이 GPS 넓은 지명이라 버려 다시 GPS를 돈다(기존 GPS 규칙). 결과는 같은 단위.
- `runFindSearchWithFilters`를 구 id로 직접 부르면 그대로 서버로 간다. 화면 경로(선택칸·URL 복원·저장값)는 단위만 남기고, 서버도 거절한다.
- 베이직카드(정본 73)·저장 버그는 이번 작업 중 새로 본 것 없음.

미확인:

- 실제 브라우저·운영 사이트 확인 안 함(15-4).
- 손님 홈 학생 섹션 표기(「서울시 강남구」)는 서버 학생 축(강남구)에 맞춰 둠 — 학생 축 단위화는 이번 범위 밖.

## 18. 검수·승인 (2단계 커밋)

| 항목 | 상태 |
|---|---|
| 독립 검수 | 대기 |
| 사용자 승인 | 대기 |

## 19. 2단계 독립 리뷰 결과·반영

수신 2026-10-09 01:20 (UTC+9)

````text
2단계 독립 리뷰(다른 모델) 결과 「조건부 승인 권고」, 127/0 통과, 높음·중간 없음. 같은 worktree·브랜치에서 새 커밋으로(amend 금지):

1. main 반영: 견본 제거가 승인되어 main이 `6b37357`로 앞섰다(`cursor/remove-samples-20261009` fast-forward). `git fetch origin` 후 `git merge origin/main`(merge 커밋, rebase 금지). 충돌이 나면 양쪽 의도를 모두 살려 해결하고 보고.
2. F-1 [낮음, 조건]: `student-blind-teaser.js:61` `coarseRegionForGuest`의 `isTutorUnitLabel` 통과 분기가 공부방 카드(`exposure-render.js` 공부방 렌더러 ~769, 846 등)에도 적용됨 → "공부방 축 불변" 위반. 최소 수정: `coarseRegionForGuest(label, kind)`로 kind를 받아 `kind === 'tutor'`(과외 축)일 때만 통과시키고, 공부방 호출부는 기존 동작(main과 동일)이 되게. 모든 호출부를 grep해 kind를 명시하라(기본값은 공부방=기존 동작 쪽이 안전). 게이트에 "공부방 라벨 「경기도 수원시」·「서울특별시」는 main과 같은 결과" 단언 추가.
3. 검사: merge 후 `verify-tutor-region-unit`, `verify-no-sample-data`(main에서 온 것), 기존 지역 검사 30개, deploy.yml 게이트 8개, `build:dothome`. main에서도 실패하는 건 구분.
4. worklog에 「2단계 독립 리뷰 결과·반영」 절(판정, F-1 처리, merge 결과) 추가. 파일명 지정 stage, 커밋, push.
보고: merge 커밋·수정 커밋 hash, 충돌 여부, 파일별 1줄, 검사 표.
````

### 19-1. 판정

- 2단계 `5a9ce03` 독립 리뷰(다른 모델): **조건부 승인 권고**, 게이트 127/0, 높음·중간 지적 없음. 조건 = F-1(낮음).

### 19-2. main 반영 (merge)

- `git fetch origin` → `git merge --no-ff origin/main`(`6b37357`, 견본 제거 포함). rebase 안 함.
- merge 커밋 **`60af084`**. **충돌 0건**(2단계 때 예상과 같음: `package.json`, `guest-sections.js`, `search-find-surface.js`, `verify-guest-baseline-map-cards.mjs`, `verify-student-branch-two-tabs.mjs`, `verify-student-mypage-metrics.mjs` 자동 병합).
- merge 직전 worktree에 이 세션이 만들지 않은 미커밋 변경이 있었다: 48개 파일 줄끝(CRLF→LF)만 바뀜 + `src/Registration/StudentHubRepository.php` 1줄(`tutorUnitRegion` → `officialRegion`, 1단계 수정을 되돌리는 변형). 리뷰 중 변형 시험이 남은 것으로 보고 `tmp-tru/stray-worktree-changes.patch`(커밋 안 함)에 백업한 뒤 HEAD 내용으로 되돌렸다. 내용은 HEAD와 같음을 해시로 확인했다.

### 19-3. F-1 처리

| 파일 | 변경 |
|---|---|
| `preview/home-ui/src/student-blind-teaser.js` | `coarseRegionForGuest(locationLabel, kind = 'study_room')` — `kind === 'tutor'`일 때만 과외 단위 표기 통과. 기본값은 공부방 축(= main). `guestStudentRegionKind(item)`(새): 학생 `preferred_lesson_type === 'tutor'`면 `'tutor'`, 그 밖은 `'study_room'`. `guestStudentTeaserFields`가 사용 |
| `preview/home-ui/src/exposure-render.js` | `renderBasicStudyRoomRow` → `'study_room'`, `renderBasicTutorRow` → `'tutor'`, `renderBasicStudentRow` → `guestStudentRegionKind(item)` |
| `preview/home-ui/src/detail-decision/tutor-detail.js` | `'tutor'` |
| `preview/home-ui/src/detail-decision/studyroom-detail.js` | `'study_room'` |
| `preview/home-ui/src/detail-decision/detail-utils.js` | 공부방 분기 `'study_room'`, 과외쌤 분기 `'tutor'` |

호출부 8곳(grep) 모두 kind 명시. 학생 카드는 과외 희망 학생의 지역 라벨이 1단계부터 과외 단위(「서울특별시」)라 과외 축으로 넘긴다. 공부방 희망 학생은 main과 같다.

게이트 추가(`verify-tutor-region-unit`, 127 → 134): 공부방 라벨 「경기도 수원시」·「서울특별시」(+세종·안동시 등 14개) 손님 표기 = origin/main, kind 생략 = origin/main, 손님 공부방 상세 「서울특별시」 = main, 학생 카드(공부방 희망) = main, 학생 카드(과외 희망) 서울특별시 그대로, 호출부 8곳 kind 명시.

### 19-4. 검사 (merge + F-1 후)

| 검사 | 결과 |
|---|---|
| `verify-tutor-region-unit` | 통과 134/0 |
| `verify-no-sample-data` (main에서 온 것) | 통과 (415 파일) |
| 기존 지역 검사 30개 | 29 통과. `verify-tutor-registration-check-frame` 실패 2건(render: publish wrap / page: CTA after board) — **origin/main `6b37357`에서도 같은 2건 실패**(임시 worktree로 확인 후 제거). 지역과 무관 |
| deploy.yml 게이트 8개 | 모두 통과 |
| `build:dothome` | 성공. 산출물 커밋 안 함 |

### 19-5. 검수·승인 (리뷰 반영 커밋)

| 항목 | 상태 |
|---|---|
| 독립 검수 | 대기 |
| 사용자 승인 | 대기 |
