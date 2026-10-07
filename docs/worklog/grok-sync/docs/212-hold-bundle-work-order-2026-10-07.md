# 212 · 보류 묶음(찾기 주소 통일·단지·bname) — 작업지시서 (2026-10-07)

- **작성:** 2026-10-07 07:0x KST (우동공과2, 종현 수면 중 · t1523 야간 위임 — **배포 직전까지만**)
- **절차 위치 (종현 t1478 잠금):** 점검지시문([211](211-hold-bundle-inspect-2026-10-07.md)) → 점검 보고 → **검수 합격(211 §검수 결과)** → **작업지시서 (이 문서)** → 수행결과 보고 → 재작업 → 검수완료 → 종현 보고 → 종현 승인 후 배포
- **정본:** [201](201-studyroom-student-find-region-levels-2026-10-06.md) 전체(t1495~t1519) / [190](190-remaining-work-queue-2026-10-02.md) / [187](187-region-gu-policy-locked-2026-10-01.md)·[050](050-home-neighborhood-students-find-ticket.md)(201이 대체하는 곳) / ssot/13 · internal/65·68
- **밤사이 범위:** 브랜치에서 검수 통과·배포 직전까지. **main 머지·배포·운영 DB SQL 실행·PR 금지.**
- **같이 도는 작업:** 숨김 `cursor/hide-inquiry-20261007` tip `2723c5f`(검수완료·배포직전) · 162 `cursor/admin-162-20261007` tip `0a7005c`(검수완료·배포직전) · 159-c `cursor/admin-159c-20261007`(진행). 찾기 핵심 경로와 교집합 ≈ `StudyRoomRegisterService.php`만(줄 분리).
- **발송:** 우동공과2가 함. 이 문서만으로 클라우드에 자동 발송하지 않음.

> 아래 블록 전체를 클라우드 에이전트에 그대로 전달.

````
# [보류 묶음] 찾기 주소 통일 · 단지 검색 · 단지명 규칙 · bname 제거 — 작업지시서 (2단계: 구현)

## 0. 규칙 (어기면 불합격)
- 저장소: leejetty-commits/study114.
- **기준 = origin/main `11b0c0d`** (Deploy #393, 라이브).
  시작: `git fetch origin && git rev-parse origin/main` 결과를 보고 첫 줄에 적기. 11b0c0d가 아니면 그 SHA를 적고, 아래 파일:줄이 달라졌는지 확인한 뒤 진행(멈추지 말 것).
- **브랜치 1개:** `cursor/hold-find-address-20261007` — `origin/main` `11b0c0d`에서 분기. 이 브랜치에만 커밋·push.
- **금지:** PR 만들기, main push·머지, 배포, 운영 DB 접속·SQL 실행(SELECT 포함 — 종현만), `--amend`, force push, 이미 push한 커밋 rebase로 고치기, 다른 브랜치 삭제·생성, 숨김/162/159-c 브랜치 손대기.
  (도구가 PR을 자동으로 만들면 닫지 말고 번호만 보고. 아무것도 머지하지 말 것.)
- **허용 파일(§3) 밖 1줄이라도 수정 = 불합격.** 허용 파일 안에서도 「무엇만」 밖은 금지.
- 구조 재설계·무관 정리·이름 바꾸기·포맷만 고치기·추가 기능 금지.
- rg는 반드시 `-g '!node_modules' -g '!dist'`.
- 용어: **학생**(학부모 금지·화면 카피). 과외쌤 지역=**과외지역**. 공부방 지역=**홍보지역**. 내부 키 `parent`는 유지.
- 「공개조건」 정책·카피 재도입 금지.
- 「범위 밖」「다음에」로 미루지 말 것. 막히면 「막힘 + 이유 + 풀 방법」+ 나머지는 끝까지.
- 결과 = **한국어 · 마지막 메시지 하나**(§6).

## 1. 목표 (잠긴 결정만 · 바꾸지 말 것)
1. 찾기 3종 주소 단위: 1시·도(선택 가능·단독 검색 불가, 세종=시 선택으로 완료) / 2시군구(필수, 공부방 광역 허용) / 3동·단지(공부방찾기·학생찾기 열림+행정동/단지 분기, 과외쌤찾기=disabled 회색).
2. 공부방찾기 **구 검색 = 전체 베이직만**(픽·프리미엄 0). 3단계(동·단지)일 때만 그 지역 프리미엄 최대 3.
3. 검색 결과 포함 전 목록 **20개 초과 → 페이지 번호**. 건수 = 서버 `total`.
4. 희망 유형 「과외쌤+공부방」(`both`) **전 모드 삭제**. 유형 기본=역할 정합 유지·**지역 필터만 비움**.
5. 단지: **읽기전용** complex-by-name + 서버 complex WHERE. **ComplexEnsure 검색 INSERT 금지.**
6. 단지명 추출 **1함수** · 구 4규칙 **삭제** · 단지명 필수 · bname/AddressRegionMatch 폴백 **삭제**(홍보·사업장).
7. 진입 필터 미리채움 제거. 지도·현황박스·현재위치 = 검색 결과 주소(과외쌤 지도 없음 유지).
8. 라벨 LIKE·26번 티어 광역 오표시 해소. 오류 A(세종) 최소 수정.
9. verify 3개 갱신 + 새 `verify-hold-find-address.mjs` + 늦은 ensure 가드. 기존 단지 행 재사용(trim만).
10. 홈 「우리동네 학생」 **시군구 전환은 이번 제외**(201 §2-1 미결). `region_label` 전송 중단만.

## 2. 작업 항목 (전부 이번 브랜치에서 끝냄)

### 항목 1 — 찾기 3종 주소 단위 UI·필수 검사
1-a. `preview/search-ui/src/search-find-surface.js`
   - 공부방·과외쌤·학생 탭 모두: 1단계 시·도 + 2단계 시군구 칸(기존 `region-cascade.js` 재사용). 공부방도 캐스케이드 신설(`1911-1920` 주소 1칸만 있던 자리).
   - 3단계: 공부방찾기·학생찾기(희망=공부방) = 행정동/단지 라디오(등록 `study-room-basic-form.js:170-199` 관례 재사용) + 주소찾기 → 동 id(`ensure`) + 단지면 `complex-by-name` id.
   - 과외쌤찾기 3단계 = `disabled` 칸(학년 `1811`과 동일). input-fill 회색 값칸·`data-input-fill` 추가 금지.
   - 학생찾기 희망=과외 → 3단계 disabled. 희망=공부방 → 3단계 열림. 희망=공부방에 시군구 칸 신설(`1885-1897` 위). 키: `f_preferred_region_id` + `preferred_lesson_type=study_room`. 3단계에서 동/단지 id가 생기면 `search-api.js:78-82`로 구 키 삭제(재사용).
1-b. `guPickIncomplete`(`2374-2386`): 「숨은 시군구 id가 숫자가 아니면 막기」. room·학생 공부방 early-return `false` 삭제. 빈 선택·시·도만 = 검색 막음. 세종은 시·도만으로 이미 regionId 채워짐(`region-cascade.js:120-131`) → 숨은 id가 숫자면 통과(세종 분기 추가지 말 것).
1-c. URL 복원 검색 `runFindSearchWithFilters`(`2445` 근처)에도 **같은 거절**을 넣기(지금 검사 우회).
1-d. 안내 문구: 시·도만/빈 지역일 때 「시·군·구까지 선택해 주세요」류. 옛 `GU_PICK_HINT` 「지역 조건 없이 검색」(`490`)이 막을 때도 뜨면 그 경로만 고침.

### 항목 2 — 필터 미리채움 제거 · 지도·박스·현재위치
2-a. 필터 칸에 넣는 줄 **제거**: `hydrateFindStateFromHash` `859-878`, `defaultRegion` `1850-1872`, `cascadePickForTutor` `1662-1678`, `cascadePickForStudent` `1682-1695`, 희망 변경 재시드 `2766-2771`, `seedStudyRoomPromoLabel` `1243-1249`→`resolveActiveRegionLabel` `1262-1272`, 초기화 재시드 `2565-2572`.
2-b. **남김:** 게스트 `applyGuestPlace` `102-106`, 현재위치·지도·현황 경로, 학생 로그인 첫 위치 `resolveStudentActivePlace` `297-318`(필터 칸에는 넣지 않음, t1502).
2-c. 검색 후: `runFindSearchWithFilters` `2464-2480`이 지도·현황·현재위치를 **필터에 있는 단계**로 갱신. 검색 후에도 저장 홍보/과외지역만 쓰는 줄(`search-page.js:98-100`, `search-find-surface.js:2224-2229`)을 검색 결과 우선으로 바꿈(t1500).
2-d. 과외쌤찾기 지도 없음 유지(`search-schema.js` mapEnabled false).

### 항목 3 — 구 검색=베이직만 · 페이지 20 · both 제거
3-a. `SearchService.php` `searchRooms`: 시군구만(`sigungu_region_id` 있고 `region_id`·`complex_id` 없음)이면 카드 `exposure_tier=basic`, `position_sku=null`. `roomTierScope`를 프라임/픽에 쓰지 않음(또는 빈 스코프여도 티어를 basic 고정). 3단계(`region_id` 또는 `complex_id`)만 기존 스코프.
3-b. 화면: 구 검색 = 플랫 베이직(`search-tier-render.js:343-348` 계열). 3단계일 때만 프라임 3칸 렌더 경로 사용.
3-c. 페이지: `search-find-surface.js:2500`을 `Number(result.total)`(서버 total)로. `search-api.js` page/limit 유지(기본 20). 번호 UI는 홈/게스트 `list-pagination`·`bindGuestListPagination` 재사용. 1쪽 20 · total 21이면 2쪽.
3-d. both: `search-enums.js:70` `both:'과외쌤+공부방'` **삭제**. 렌더 빈 「선택」(`1771`) **삭제**. 주석 `1651`·`2773` 정리. URL `f` both는 무시(이미 student-hope-type이 hope를 무시 — `f`도 tutor|study_room만). 상품 `provider_type=both`는 **건드리지 말 것**.
3-e. 학생 구 WHERE: 희망=공부방 + `preferred_region_id`만 → `preferred_lesson_type=study_room` AND 동 ∈ 그 구(`SearchService.php:965-969` 앞 분기). 과외 희망과 섞이지 않게.

### 항목 4 — 단지 검색 (읽기전용 + 서버 WHERE)
4-a. `public/api/auth/regions.php`: action `complex-by-name` 신설. 입력 `region_id`(int) + `name`(string). 응답 `{ ok, complex: { id } | null }`.
   - 구현: `SELECT id FROM complexes WHERE region_id=? AND name=? AND is_active=1 LIMIT 1` (trim만). **INSERT·UPDATE 0.**
   - `ComplexEnsure::ensure`는 등록·마이페이지 전용 유지. 검색 경로에서 호출 = 불합격.
4-b. `SearchService::searchRooms`: `508` 다음 — `complex_id` + `region_basis_type='complex'` 일치 WHERE.
4-c. `SearchService::searchStudents`: `967` 다음 — `s.preferred_studyroom_complex_id = ?` (희망 공부방일 때).
4-d. 화면: 단지 분기면 region_label·글자 라벨 키 **삭제**, `complex_id` / `preferred_studyroom_complex_id`만 전송. 동 분기는 `region_id` / `preferred_studyroom_region_id` 정확 일치.

### 항목 5 — 단지명 1함수 · bname 삭제 · ensure 가드
5-a. **새 파일** `preview/shared/complex-name-from-kakao.js` (또는 동등 1파일):
   ```js
   // apartment === true && trim(buildingName) !== '' → buildingName, else ''
   ```
   **`input-fill.js` import 금지.** kakao-postcode 필드 삭제 금지(읽기만).
5-b. 구 규칙 **삭제·교체**(4곳 모두 새 함수):
   - `study-room-basic-form.js:397-399` 사업장
   - `:498-500` 홍보 슬롯
   - `:437-441`·`:445-470` 학생희망(`complexPlaceLabel` 삭제)
   - `search-find-surface.js:427` `canonicalFromKakao`
5-c. `validateStudyRoomBasicFields`(`818-821`): `basis===complex`이면 `complex_name` **필수**. 문구는 기존 「홍보지역 N의 아파트단지를 주소 검색으로 선택해 주세요.」
5-d. 서버 폴백 **삭제만**(숨김 가드·다른 로직 손대지 말 것):
   - `StudyRoomRegisterService.php` **~560**(AddressRegionMatch 사업장), **~1117**(슬롯 match), **~1131-1133**(이름←주소). `RegionEnsure::fromKakao` 유지는 그 다음 줄.
     ※ **soft overlap:** 숨김 tip의 `saveFacility` ~**1012** `profile_status` 숨김 유지(+19/−2)와 **같은 파일·다른 줄**. 이 hunks만 diff. `saveFacility` 숨김 가드 **0줄 변경**. rebase 시 숨김 가드를 되돌리지 말 것.
   - `BasicRegisterService.php` **~614-622**(bname), **~717-719**(이름←주소).
5-e. `AddressRegionMatch.php`: 호출처 0이면 파일 삭제 + use 문 제거. 호출 남으면 불합격.
5-f. 늦은 ensure 가드(칸별 순번): `study-room-basic-form.js` 사업장 `642-649` · 홍보 `656-669` · 학생 `871-882` · `confirmStudyroomDong` `614-625`. 응답 적용 직전 순번 일치할 때만 기록.

### 항목 6 — 라벨 거절 · 세종 · 홈 라벨
6-a. `SearchService::searchRooms` `473` 직전: `rejectRegionLabel($filters,'region_label')`. `applyRegionLabelMatch` 공부방 경로 제거(또는 도달 불가). 클라 `dropLegacyLessonRegionFilters`에 room `region_label` 제거.
6-b. `RegionGuLink::dongIdsUnderGu`: 구 `official_code` 앞 5가 `36000`이면 동 `sigungu_code` 앞 5 `36110`도 포함. 시드·선택 단위 행 추가 금지.
6-c. `preview/home-ui/src/study-room-home-seed.js:337-348`: `region_id` 없으면 `region_label` **보내지 않음**(지역 키 생략). **시군구 전환 로직 넣지 말 것**(Q22).

### 항목 7 — ssot · verify · 스크린샷
7-a. `docs/ssot/13-search-page-fields.md` **문구만**:
   - ~17: 1시·도(단독검색불가·세종 시완료) / 2시군구(필수·공부방 구=베이직만) / 3동·단지(공부방·학생 열림·과외 비활성). 진입 필터 비움·지도·현황·현재위치만 기본.
   - 페이지: 목록·검색 결과 20 초과 시 페이지 번호, 건수=서버 total.
   - ~182: `preferred_lesson_type | tutor · study_room` (`both` 삭제).
7-b. verify 갱신(검사 삭제·완화 금지):
   - `verify-study-room-basic-register-api.mjs`: 주석 문자열(`슬롯 자체 메타만`·`사업장/집주소`) **유지**. `AddressRegionMatch::match` 0 · `cname = $caddr` 0 단언 **추가**.
   - `verify-student-mypage-hope-region.mjs`: 등록 경로 ComplexEnsure INSERT 기대 **유지**(검색 금지와 혼동 금지).
   - `verify-input-fill-rule.mjs`: 새 헬퍼가 `input-fill.js` import하면 실패 → import 금지. 찾기 `data-input-fill` 추가 금지.
7-c. **새** `scripts/verify-hold-find-address.mjs` — §4 숫자 항목을 코드/문자열/가짜응답으로 단언(최소 아래 9항 fail=0).
7-d. 스크린샷(로컬 preview만 · 라이브 금지 · `/tmp` 저장 · 커밋 0):
   (1) 공부방찾기 지역 칸(시·도+시군구+3단계)
   (2) 과외쌤찾기 시군구 + 3단계 disabled
   (3) 학생찾기 희망 유형 **2옵션**(both·「선택」 없음)
   (4) 주소찾기 단지 선택 후 id 키(라벨 LIKE 없음)
   preview 기동 불가면 이유 + 줄 근거.

## 3. 허용 파일 (이 밖 수정 = 불합격 · 「무엇만」)

### [찾기화면]
- `preview/search-ui/src/search-find-surface.js` — 단계 UI·분기·both·gu 필수·단지 id·페이지·필터 비움·순번·현재위치
- `preview/search-ui/src/search-api.js` — 구 키 삭제·page/total·레거시 region_label drop
- `preview/search-ui/src/search-enums.js` — both 삭제만
- `preview/search-ui/src/search-schema.js` — 필요 시 필드/라벨 최소(지도 플래그 유지)
- `preview/search-ui/src/search-tier-render.js` — 구=플랫 베이직 · 3단계 프라임 칸 · 페이지
- `preview/search-ui/src/search-page.js` — 현재위치·페이지 바인딩
- `preview/search-ui/src/student-hope-type.js` — both URL 무시 유지·필요 시 f both 무시
- `preview/shared/region-cascade.js` — 세종 완료 재사용·필요 시 최소
- `preview/shared/location-display.js` — 표시만
- `preview/shared/kakao-postcode.js` — **필드 삭제 금지**, 읽기만(수정 0이 기본)
- **새** `preview/shared/complex-name-from-kakao.js`

### [등록·공유]
- `preview/shared/study-room-basic-form.js` — 4규칙→1함수 · validate 단지명 필수 · ensure 순번
- `preview/home-ui/src/student-reg-copy.js` — 희망 실패 문구가 바뀔 때만
- (`student-reg/screens.js`·`signup-basic.js` — 문구가 그 파일에 **있을 때만**. 숨김 한 줄·허브 안내 **삭제 금지**)

### [서버 검색·지역]
- `src/Search/SearchService.php` — 라벨거절 · complex WHERE · 구 티어 basic · 학생 구 WHERE
- `src/Region/RegionGuLink.php` — 세종만
- `public/api/auth/regions.php` (+ 조회 헬퍼 1개, ComplexEnsure 밖) — complex-by-name **SELECT**
- `src/Region/AddressRegionMatch.php` — 호출 0이면 **삭제**
- `public/api/search/search.php` — total 전달이 이미 있으면 **변경 0**이 기본

### [서버 등록] — hold hunks만
- `src/StudyRoom/StudyRoomRegisterService.php` — **bname ~560 · AddressRegionMatch ~1117 · 이름←주소 ~1131-1133만**.
  `saveFacility` ~1012 숨김 가드 **손대지 말 것**(숨김 브랜치 soft overlap).
- `src/Auth/BasicRegisterService.php` — bname ~614-622 · 이름←주소 ~717-719만
- `src/Registration/StudentHubRepository.php` — 등록 ensure 경로 유지가 기본(검색 조회를 여기 넣지 않음). 필요 시 메시지 최소

### [홈]
- `preview/home-ui/src/study-room-home-seed.js` — `337-348` region_label 전송 중단만. **시군구 전환 금지**

### [검사]
- `scripts/verify-study-room-basic-register-api.mjs`
- `scripts/verify-student-mypage-hope-region.mjs`
- `scripts/verify-input-fill-rule.mjs`
- **새** `scripts/verify-hold-find-address.mjs`

### [문서·잠금]
- `docs/ssot/13-search-page-fields.md` — 17·페이지·182 **문구만**

## 4. 금지 (재확인)
- 관리자 `a28-*` · settlement · support_tickets · 076/077 SQL · hide 알림/문의
- `preview/study-room-ui/src/form-collect.js` · TutorRegisterService · 숨김 가드
- `StudyRoomRegisterService::saveFacility` 숨김 유지 줄
- ComplexEnsure 검색 INSERT · complexes UNIQUE 마이그레이션(종현 전)
- 홈 「우리동네 학생」시군구 전환 구현
- 「학부모」카피 · both 다른 이름 부활 · 공개조건 잔재 재도입
- 상품 `provider_type=both` (`PaidCatalog`·`catalog.php`)
- input-fill import into complex-name helper
- LIKE fuzzy complex match
- 라이브 조작·운영 SQL·npm 검사를 라이브에 · PR/main/deploy
- 구조 재설계·허용 목록 밖 사이트 파일

## 5. 숫자 합격 기준 (전부 숫자로 보고 · 전·후)
1. 시·도만 / 지역 빈 값 → 검색 요청 **0**(세종 시 선택=시군구 완료 → 요청 1 허용)
2. 공부방찾기 구 검색: 프라임 배지 **0** · 픽 전용 칸 **0** · 베이직만. 동|단지 검색: 그 지역 프라임 칸 ≤ **3**
3. total **21** 픽스처 → 페이지 **2** 존재, 1쪽 항목 **20**, 건수 문구 **21**
4. 희망 유형 옵션 정확히 **2**(과외쌤·공부방). `both`·「과외쌤+공부방」·빈 「선택」 문자열 **0**
5. 단지 필터 → 다른 `complex_id` 카드 **0** · 검색 경로 `INSERT INTO complexes` **0**
6. 등록 경로 `AddressRegionMatch::match` 호출 **0** · `address_bname`로 region id 대입 **0** · `cname = $caddr` **0**
7. verify 3개 fail=**0** · `verify-hold-find-address.mjs` fail=**0** · build OK
8. diff 파일이 §3 안 · §4 금지 파일 diff **0줄** · `saveFacility` 숨김 줄 diff **0**
9. 변경 파일 「학부모」**0** · 게스트 `search.php:61-76` 대치동/강남구 덮어쓰기 **유지**

## 6. 보고 형식 (한국어, 마지막 메시지 하나)
① 시작 origin/main SHA · 브랜치 tip SHA · push 여부 · PR 번호(있으면, 머지 0)
② 항목 1~7 한 줄씩(파일:줄) · soft overlap `saveFacility` diff 0 증명
③ `git diff --stat origin/main...HEAD` + 허용 밖 파일 0 증명
④ 숫자 합격 1~9 전·후
⑤ verify 3 + hold verify + build 출력 요약
⑥ 스크린샷 경로 4장(또는 불가 이유)
⑦ 「종현 확인 필요」체크 — 아래 §7 기본안으로 구현했는지
⑧ 위험·막힘
⑨ `git status -sb` · tip SHA

## 7. 종현 확인 필요 (지금은 기본안으로 구현 · 블로커 아님 · 이의 없으면 동의)

| # | 내용 | 구현 기본안 |
|---|---|---|
| C1 | 단지명 통일 규칙(Q14) | `apartment===true && buildingName` trim, 아니면 빈값 |
| C2 | 과외 3단계 UI | `disabled`(학년과 동일) |
| C3 | 구 검색 티어 | 서버 basic 고정(화면만 가리기 아님) |
| C4 | 희망 유형 빈 옵션 | 제거. 유형은 역할 기본 유지 |
| C5 | 단지 id API | regions.php `complex-by-name` SELECT |
| C6 | 단지명 매칭 | trim 정확만. LIKE·UNIQUE 금지 |
| C7 | 세종 | GuLink `36000`→동 `36110` 포함 |
| C8 | region_label | 공부방 reject. id만 |
| C9 | 홈 우리동네 학생 | 시군구 전환 **안 함**. 라벨 전송 중단만 |
| C10 | AddressRegionMatch 파일 | 호출 0이면 삭제 |

## 8. 종현 운영 DB 체크리스트 (에이전트 실행 금지 · SELECT만 · 종현)

**C. 개편·코드 어긋남**
```sql
SELECT id, sido_name, sigungu_name, sigungu_code, dong_name, dong_code
FROM regions
WHERE unit_level='dong'
  AND (
    LEFT(sigungu_code,5) NOT IN (
      SELECT LEFT(official_code,5) FROM regions
      WHERE is_selectable=1 AND CHAR_LENGTH(official_code)>=5
    )
    OR sigungu_code IN ('00000')
    OR LEFT(sigungu_code,5)='36110'
  );
```

**D. 동명 리·중복**
```sql
SELECT sigungu_name, dong_name, COUNT(DISTINCT dong_code) codes, COUNT(*) n
FROM regions WHERE unit_level='dong'
GROUP BY sigungu_name, dong_name HAVING n>1 LIMIT 50;
```

**세종 검증**
```sql
SELECT id, unit_level, official_code, sigungu_code, sido_name, dong_name, is_selectable
FROM regions
WHERE LEFT(COALESCE(official_code,sigungu_code),5) IN ('36000','36110')
   OR sido_name LIKE '세종%'
ORDER BY unit_level, id;
-- 구현 후: 세종 선택 단위 id로 dongIdsUnderGu 결과가 0이 아닌지(앱/스테이징) 확인.
```

**단지·구독 표본**
```sql
SELECT COUNT(*) FROM complexes WHERE name=address OR name LIKE '(주소 미등록)%';
SELECT region_id, name, COUNT(*) c FROM complexes GROUP BY region_id, name HAVING c>1;
SELECT 'srr' src, id, region_basis_type, region_id, complex_id FROM study_room_regions
WHERE (region_basis_type='complex' AND (complex_id IS NULL OR complex_id=0))
   OR (region_basis_type='dong' AND complex_id IS NOT NULL AND complex_id<>0)
UNION ALL
SELECT 'stu', id, preferred_studyroom_region_basis, preferred_studyroom_region_id, preferred_studyroom_complex_id FROM students
WHERE (preferred_studyroom_region_basis='complex' AND (preferred_studyroom_complex_id IS NULL OR preferred_studyroom_complex_id=0))
   OR (preferred_studyroom_region_basis='dong' AND preferred_studyroom_complex_id IS NOT NULL);
-- Prime/Pick complex_id 진행 중 건수는 205/운영 관례에 맞는 status·end_exclusive_on 조건으로 SELECT(에이전트 미실행).
```

## 9. 하지 말 것 (재확인)
- main/배포/PR/운영 SQL
- ComplexEnsure 검색 INSERT · LIKE fuzzy · UNIQUE migration
- 홈 시군구 전환 · 학부모 카피 · both 부활
- saveFacility 숨김 hunk · form-collect 숨김 · a28/settlement/076/077
- input-fill import into new helper
````

---

## §발송·검수 메모 (우동공과2)

- 2026-10-07 07:0x: 211 점검 합격 후 본 작업지시서 작성. **클라우드 미발송 · git 브랜치·push 0.** 발송 시점 = 159-c 검수완료 후(또는 종현/위임 재지시). 배포 직전 정지.
- 머지 권고: 숨김·162·159-c를 main에 올린 뒤 이 브랜치를 새 main에 rebase. `saveFacility` 숨김 가드와 bname 삭제를 서로 되돌리지 말 것.

---

## §검수 결과 (2026-10-07, ab68b05)

- **검수:** 2026-10-07 07:3x~07:5x KST, 우동공과2(t1523 야간 위임). 클라우드 에이전트 미접촉. 브랜치 수정·push 0. main·배포·운영 SQL 0.
- **대상:** `origin/cursor/hold-find-address-20261007` tip `ab68b05bdd305c0f0b9594aaa3daafeb6bddad10` (수행 보고 = `cloud-agent-transcripts/bc-492ae05d-…jsonl` 마지막 메시지).
- **검수 워크트리:** 브랜치 `/workspace/study114-wt-hold` · 기준 `/workspace/study114-wt-hold-base`(11b0c0d). 다른 워크트리 미접촉.
- **로컬 프로브:** MariaDB 3307에 **복제 DB `study114_holdrev`**(study114_dev 덤프 + 검수 픽스처: 강남구 공부방 21·세종 1·단지·프라임/픽 구독·학생 3)를 새로 만들어 사용. 공유 `study114_dev`는 읽기(덤프)만. php -S 8191(기준)/8192(브랜치) + search-ui dist 정적 서버 4291/4292 + Playwright. 증거: `/workspace/review/hold/`(스크린샷 26장 · `logs/` · `probe-ui.json` · `logs/probe-api.log`).

### 판정: **보완 필요**

「잠긴 정책과 어긋난 오류」 **2건**(D1 게스트 지역 고정 우회 · D3 검색 후 현재위치·현황박스 미갱신) + 기존 잠금 검사 회귀 **2건**(D2 · D4) + 범위 밖 검사 완화 **1건**(D5). 나머지 구조(3단계 UI·구=베이직·페이지·both 제거·단지 SELECT·bname 삭제·세종)는 맞게 들어옴. 재작업지시서: [213](213-hold-bundle-rework-2026-10-07.md).

### 1. 커밋·브랜치·PR·범위

| 항목 | 결과 |
|---|---|
| origin/main | `11b0c0d82769ba27fa0792be59550e0aa14f233d` 그대로 |
| 브랜치 | merge-base = 11b0c0d, 커밋 **1개**(ab68b05, 2026-10-07 07:34 KST). force 흔적 없음 |
| PR | `refs/pull/*/head` 29개 중 ab68b05 **0** |
| diff | 21파일 +712/−339. 전부 §3 목록 안(`search-page.js` 실제 경로 = `preview/search-ui/src/screens/search-page.js`, 지시서 표기 오기). §4 금지 파일 diff 0 · `search.php`·`kakao-postcode.js`·`region-cascade.js`·`location-display.js` diff 0 |
| `saveFacility` 숨김 가드 | diff hunk 0(StudyRoomRegisterService hunk = 19 use · 557 사업장 · 1114 슬롯만). `git merge-tree` ab68b05 × 숨김 `2723c5f` / 162 `0a7005c` / 159-c `4c865bd` **충돌 0**, 합친 트리의 `profile_status` 줄 = 숨김 tip과 동일 |
| 「학부모」 추가 | 0 (verify 단언 문자열 1줄만) |
| php -l | 변경 PHP 5/5 OK |

### 2. 검사 (기준 11b0c0d → 브랜치 ab68b05, 같은 박스·같은 명령)

| 검사 | 기준 | 브랜치 | 판정 |
|---|---|---|---|
| verify-hold-find-address.mjs (신규) | 없음 | 61 P / 0 F | 통과. 단 대부분 문자열 grep — 숫자기준 1·2·5 행동 단언 없음(D11) |
| verify-study-room-basic-register-api.mjs | 23 P / **4 F** | 31 P / 0 F | **D5** — 기존 실패 4개를 파일 속 주석·버튼 문자열로 바꿔 PASS화. 기준 스크립트를 브랜치 트리에 돌리면 기준과 같은 4 F |
| verify-student-mypage-hope-region.mjs | 70/0 | 71/0 | 통과(등록 ComplexEnsure INSERT 기대 유지) |
| verify-input-fill-rule.mjs | 282 P / 3 F | 283 P / 3 F | 3 F = 3부 변이(tutor-reg·study-room-basic-form·register.css)로 **11b0c0d에서도 같은 3건** 확인. 실행 뒤 파일 복구 확인 |
| verify-region-save-rules.mjs | 46/0 | 46/0 | 동일 |
| verify-basic-exposure-gate.mjs | 24/0 | 24/0 | 동일 |
| verify-tutor-region-label.mjs | 103/0 | 103/0 | 동일 |
| verify-guest-baseline-map-cards.mjs | 72/0 | 72/0 | 동일 |
| **verify-position-region-tier.mjs** | 24/0 | **23 / 1 F** | **D2** 「목록 소속 SQL은 단지 티어 조건을 넣지 않음」 |
| **verify-position-region-tier.php** | 19/0 | **18 / 1 F** | **D2** 같은 단언 |
| **verify-room-promo-region-match.php** | 36/0 | **PHP Fatal(7 PASS 뒤 중단, exit 255)** | **D4** region_label 케이스가 새 reject 예외 |
| `scripts/verify-*search*` | 0개 | 0개 | 해당 파일 없음 |
| vite build 5패키지 | 5/5 | 5/5 | OK |

### 3. 로컬 프로브 (API: `logs/probe-api.log` · 화면: `probe-ui.json`)

| 항목 | 기준 | 브랜치 | 판정 |
|---|---|---|---|
| 게스트 공부방찾기 | 대치동·카드 3 | 대치동·카드 3, 「위치를 선택해 주세요」 0 | OK |
| 게스트 과외쌤·학생찾기 | 서울시 강남구 | 서울시 강남구, 「위치를 선택해 주세요」 0 | OK |
| 게스트 빈 검색·옛 URL `searched=1` | 대치동 유지 | 검색 요청 0 · 대치동 목록 유지 | OK (게스트 필터 조작은 로그인 게이트) |
| **게스트 API 학생 {study_room, 단지=부산 센텀자이}** | 강남구 2건 | **부산 학생 1건(id 2)** | **D1 잠긴 정책 어긋남** |
| 게스트 API 공부방 {complex_id=역삼래미안} | 대치동 3건 | **0건** | D1 (기준 목록 소실) |
| 로그인 공부방 시·도만 / 빈 지역 검색 | 빈값=전국 요청 1 | 요청 **0**, 「시·군·구까지 선택해 주세요」 | OK |
| 구(강남구) 검색 티어 | 프라임 2·픽 1 섞임(26번) | 21건 전부 basic, position_sku null | OK |
| 페이지 | 없음 | total 21 → 「21건」, 버튼 1·2, 2쪽 요청 page=2 → 1건 | OK |
| 동(대치동) 검색 | 프라임 1 | 프라임 1(≤3) | OK |
| 단지 검색 complex_id만 | 단지 무시(전국 24) | 은마 1건(프라임) · 래미안 1건 | OK |
| **{region_id, complex_id} (공부방 홈·찾기 진입 목록)** | 3건 | **1건** | **D2 회귀** (화면 진입 카드 3→1, `base/branch-login-room-entry.png`) |
| region_label (로그인) | LIKE 3건 | 422 「지역은 구(시·군)까지…」 | 설계대로. 옛 URL `f`·저장 필터는 클라가 먼저 지워 422 0, 홈 시드도 미전송 |
| 세종 구(109) 공부방 / 학생 공부방희망 | 0 / 0 | 1 / 1 | OK (C7) |
| 학생 구(강남) study_room / tutor | 2 / 0 | 2 / 0 | OK |
| 학생 단지(은마) | 단지 무시 4 | 1 | OK |
| complex-by-name | 없음 | 「 은마아파트 」→ id 1 · 없는 이름 → null · complexes 행 8→8 | OK (INSERT 0) |
| **구 검색 후 현재위치·현황박스** | — | 21건 강남구 결과인데 「현재위치 대치동 · 은마아파트」, 현황박스 「대치동 공부방 20」, 결과 칩·URL `region=` 홍보1. 세종 검색도 동일 | **D3 잠긴 정책 어긋남** (`branch-login-room-gu-p1.png`) |
| URL 복원(구 검색 후 새로고침) | — | gu=27 복원 · 21건 | OK |
| 초기화 | — | 필터 빔 · 현재위치 홍보1 · 진입 목록 재조회 | OK |
| 희망 유형 옵션 | 「선택」+3 | tutor·study_room **2** (공부방·과외쌤·게스트 모드 모두) | OK |
| 과외쌤 3단계 | 칸 없음 | `disabled` | OK |
| 학생 희망=과외 3단계 | — | `disabled`, 희망=공부방(공부방 로그인) `open` | OK |
| 3단계 단지 선택 화면 | — | 카카오 팝업이라 headless 불가 → API로 대체 | 증거 공백(D12) |

### 4. 결함 (파일:줄 = ab68b05)

| # | 등급 | 내용 | 근거 |
|---|---|---|---|
| **D1** | 「잠긴 정책과 어긋난 오류」 | 게스트 지역 고정 우회. `guestScopedFilters`가 새 키 `complex_id`·`preferred_studyroom_complex_id`를 지우지 않고, 학생 단지 분기가 elseif 맨 앞이라 게스트 강남구(`preferred_region_id`) 조건을 건너뜀 → 게스트가 다른 지역 학생 카드 수신. 공부방은 대치동∩단지로 기준 목록이 0이 될 수 있음 | `src/Search/SearchService.php:135-138`(unset 목록), `:975-981`(단지 분기). 프로브 위 표 |
| **D2** | 높음(회귀) | 단지 WHERE가 `region_id`와 같이 와도 걸림 → 「목록 소속=region_id, complex_id=티어 키」 계약(`study-room-home-seed.js:330-347` 주석·verify-position-region-tier) 깨짐. 공부방 홈·공부방 로그인 찾기 진입 목록이 같은 단지 공부방만으로 줄어듦 | `src/Search/SearchService.php:502-510`. verify-position-region-tier .mjs 24/0→23/1 · .php 19/0→18/1. 프로브 3건→1건 |
| **D3** | 「잠긴 정책과 어긋난 오류」 | 공부방찾기 구 검색 후 현재위치·현황박스·지도·결과 칩·URL `region`이 검색 결과(시군구)로 안 바뀌고 홍보1로 되돌아감(t1500·t1507·212 항목 2-c). 공부방 축 `canonicalRegionLabel`에 구 라벨을 넣으면 displayLabel이 비어 `memberRepresentativeRaw`(홍보1)로 폴백 | `preview/search-ui/src/search-find-surface.js:1338-1357`(검색 후 분기 → `:1354`), `:1241-1245`(폴백), `:2653-2669`(검색 시 적용). 수행 보고 ②-2 「검색 후 현재위치는 search-page.js:89」 주장과 실제 다름 |
| **D4** | 중간(검사 회귀) | `verify-room-promo-region-match.php` region_label 케이스가 새 reject로 Fatal. 212 허용 목록 누락(지시서 허점) — 에이전트가 이 검사를 돌리지 않음 | `scripts/verify-room-promo-region-match.php:455-458`, 주석 단언 `:494` |
| **D5** | 중간(범위 밖·검사 완화) | 기존 실패 4단언을 파일에 있는 주석·버튼 문자열로 교체. 212 「무엇만」(추가 2단언·주석 유지) 밖. `:52` 「홍보지역 1」은 signup-complete.js:105 주석에 걸리고, `:58` 「홍보지역 2·3칸」은 step-basic.js:79 주석이며 뜻이 반대(「미표시」→「유지」). `:45`는 중복 차단 단언을 다른 서비스로 옮김. 보고 ⑧은 「3개」로 적음(실제 4) | `scripts/verify-study-room-basic-register-api.mjs:45,52,53,58` |
| **D6** | 중간(잠긴 방향) | 3단계 단지 미등록·동 확정 실패·확정 대기 중에도 검색이 **시군구 단위로 그대로 실행**(201 03:1x 「DB에 없으면 오류」). 막는 검사는 학생 동 경로(`studyroomDong*`)뿐 | `search-find-surface.js:1803-1856`(`applyStep3FromKakao` — pending 없음), `:2586`(학생 동만 검사), `:2579-2584` |
| **D7** | 중간 | 새 페이지 번호에 검색 응답 순번 가드 없음 → 빠른 쪽 이동 시 늦은 응답이 덮음 | `search-find-surface.js:2675-2707`, 클릭 `:2944-2960` |
| **D8** | 중간 | 늦은 ensure 가드가 호출부에서 무력화: `if (studyroomDongSeq)` 항상 참, 호출부가 await 뒤 무조건 bag에 상태를 복사 → 옛 콜백이 새 선택의 동 id에 옛 표시 라벨을 섞어 기록 | `search-find-surface.js:2829-2838`, `:2924-2932` |
| **D9** | 낮음(죽은 코드) | 렌더하는 요소 0인 `find-region-address`/`find-hope-address` 핸들러를 고치기까지 함(`void input`) · `renderedStudyroomDongId` · `STUDYROOM_ADDRESS_HINT` · `studentCascadeRegionId` 호출 0 · DONG_RETRY 안내 대상 `[data-student-region-field]`가 새 3단계 칸에 없음(안내 안 뜸) · `student-hope-type.js:38` 다음 줄과 같은 결과 · `applyRegionLabelMatch`·`regionLabelToken` 호출 0(212 6-a 「도달 불가」 허용이나 옛 규칙 삭제 원칙상 삭제) | `search-find-surface.js:2853-2900·2892·601·494·1858·2587`, `student-hope-type.js:38`, `SearchService.php:1356-1404` |
| **D10** | 낮음(문구) | 3단계 미확정 안내가 행정동 실패에도 「등록된 아파트단지가 없습니다」 | `search-find-surface.js:1772-1774` |
| **D11** | 낮음(검사 약함) | hold verify가 문자열 위주. 숫자기준 1(요청 0)·2(구=basic)·5(다른 단지 0)·게스트 고정 행동 단언 없음 → D1·D2를 못 잡음. `'1 숨은 시군구 id 없으면 검색 막음'` 정규식은 함수 뒤 아무 `return true;`에 걸림 | `scripts/verify-hold-find-address.mjs:39`, 전반 |
| **D12** | 낮음(증거·문서) | 스크린샷 4장은 클라우드 `/tmp`라 박스 미복사(증거 공백 — 이번 검수 박스 스크린샷으로 (1)(2)(3) 대체 확인, (4) 단지 선택은 카카오 팝업이라 불가). ssot/13 §2(`:24-28` 「내 기본 지역 자동」)·§7-3(`:128-134` 「구군 → 시/도」 광역)이 새 정책과 어긋난 채 남음 — 212 허용 「17·페이지·182만」의 허점 | `docs/ssot/13-search-page-fields.md:26-28,130-134` |

### 5. 정정 (수행 보고 ↔ 코드)

1. 보고 ④-7 「verify 3 fail 0」: 기본등록 verify의 0은 D5 교체 결과. 기준 대비 정직한 값 = 23P/4F 동일 + hold 4단언 PASS.
2. 보고 ⑤ 「기본등록 3개 옮김」 → 실제 4개(중복 차단 포함).
3. 보고 ②-2 「검색 후 현재위치 = 검색 결과 라벨」 → 공부방 구 검색에서 안 됨(D3).
4. 보고에 verify-position-region-tier·verify-room-promo-region-match 실행 없음 → 둘 다 회귀(D2·D4).
5. 212 2-a 「seedStudyRoomPromoLabel·hydrate 859-878 제거」 문구와 달리 에이전트가 **진입 현재위치 시드는 남김** — 잠금 「공부방 현재위치 = 홍보지역1」(t1502)에 맞으므로 **정상**(지시서 문구가 과했음). 필터 칸 값만 비움(`:2010 defaultRegion=''`)은 지시 취지대로.
6. 세종: GuLink 1줄 변경으로 공부방 구·학생 공부방희망 구 모두 0→1 확인(C7).

### 6. 종현 확인 (C1–C10 구현 상태 + 신규)

| # | 내용 | 구현 | 검수 |
|---|---|---|---|
| C1 | 단지명 1규칙 | `apartment===true && trim(buildingName)` (`complex-name-from-kakao.js`, input-fill import 0) — 4곳 교체·`complexPlaceLabel` 삭제 | 맞음 |
| C2 | 과외 3단계 | `disabled` | 맞음 |
| C3 | 구 검색 티어 | 서버 basic 고정 | 맞음(프로브 21/21 basic) |
| C4 | 희망 빈 옵션 | 제거, 유형 역할 기본 | 맞음 |
| C5 | 단지 id API | regions.php `complex-by-name` SELECT | 맞음(INSERT 0) |
| C6 | 단지명 매칭 | trim 정확 · LIKE·UNIQUE 0 | 맞음 |
| C7 | 세종 | 36000→36110 | 맞음(0→1) |
| C8 | region_label | 공부방 reject(422) | 맞음. 옛 캐시 번들 홈 목록은 배포 직후 잠깐 빈 목록 가능(catch로 [] 처리) |
| C9 | 홈 우리동네 학생 | 시군구 전환 없음 · 라벨 전송만 중단 | 맞음 |
| C10 | AddressRegionMatch | 파일 삭제 · 호출 0 | 맞음 |
| **C11** (신규) | 3단계 동·단지가 고른 시군구 **밖**일 때(주소찾기는 전국) | 지금은 막지 않고 3단계 id로 검색(구 키 삭제) | 기본안: 막고 「선택한 시·군·구 안의 주소를 골라 주세요」. 201 t1508 §6이 필요하다고 적음 — 이번 재작업 미포함(종현 동의 시 별건) |
| **C12** (신규) | 현황박스 「변경」(현재위치) 버튼으로 주소를 고르면 3단계 필터 칸도 채워짐 | 기준도 필터 칸을 채웠음(사용자 직접 선택) | 기본안: 유지(미리채움 아님). 이의 시 「현재위치만 변경」으로 분리 |
| **C13** (신규) | 검색 결과 페이지 번호 URL 보존 | 없음(새로고침 = 1쪽) | 기본안: 현행 |
| **C14** (신규) | verify-study-room-basic-register-api 기존 실패 4건(11b0c0d부터) | 이번 묶음 밖 | 기본안: 별건 정리(문구 결정 후) |
| **C15** (신규) | 게스트는 필터 조작 시 로그인 게이트(현행), 3단계 칸은 보이기만 | — | 기본안: 현행 |

### 7. 운영 DB SELECT (종현만 · 에이전트 실행 금지)

§8의 C·D·세종·단지 표본 그대로 + 아래 추가.
```sql
-- 세종: 구현 후 dongIdsUnderGu 대상(36110 동) 수
SELECT COUNT(*) FROM regions WHERE unit_level='dong' AND LEFT(sigungu_code,5)='36110';
-- 같은 시군구·같은 단지명이 서로 다른 동 id에 걸린 단지(옛 bname 매칭 흔적 → 찾기 complex-by-name 0건 위험)
SELECT c.name, LEFT(r.sigungu_code,5) sg, COUNT(DISTINCT c.region_id) dongs, GROUP_CONCAT(c.id) ids
FROM complexes c JOIN regions r ON r.id=c.region_id
WHERE c.is_active=1 GROUP BY c.name, LEFT(r.sigungu_code,5) HAVING dongs>1;
-- 단지 기준 홍보 슬롯이 가리키는 단지의 동 ≠ 슬롯 동
SELECT srr.id, srr.study_room_id, srr.region_id, c.region_id cx_region
FROM study_room_regions srr JOIN complexes c ON c.id=srr.complex_id
WHERE srr.region_basis_type='complex' AND c.region_id<>srr.region_id;
-- 진행 중 단지 Prime/Pick (D2 회귀 영향 범위 · 205 관례 조건)
SELECT sku_code, COUNT(*) FROM provider_position_subscriptions
WHERE provider_type='study_room' AND region_basis_type='complex' AND end_exclusive_on > CURDATE()
GROUP BY sku_code;
```

### 8. 다음
- 재작업지시서 [213](213-hold-bundle-rework-2026-10-07.md) 작성(**미발송**·클라우드 미접촉). 같은 브랜치 새 커밋만. 배포 직전 정지 유지.
- 정리: 검수용 php -S 8191/8192·정적 서버 4291/4292 종료, 복제 DB `study114_holdrev`는 재검수용으로 남김(공유 study114_dev 무변경).

---

## §재검수 결과 (2026-10-07, 06f9dc5)

- **재검수:** 2026-10-07 08:3x~09:2x KST, 우동공과2(t1523 야간 위임). 클라우드 에이전트 미접촉. 브랜치 수정·push 0. main·배포·운영 SQL 0.
- **대상:** `origin/cursor/hold-find-address-20261007` tip `06f9dc57ab46a3742d73944fd1a109e3b9a2a45f` (213 수행 보고 = transcript 마지막 줄).
- **워크트리:** 브랜치 `/workspace/study114-wt-hold`(06f9dc5 detached) · ab68b05 `/workspace/study114-wt-hold-ab`(신규, 비교용) · 기준 `/workspace/study114-wt-hold-base`(11b0c0d). 셋 다 git status 깨끗.
- **로컬 프로브:** 복제 DB `study114_holdrev`(3307) · php -S 8191(기준)/8193(ab68b05)/8192(06f9dc5) · search-ui dist 정적 4291/4293/4292 · Playwright(카카오 우편번호는 `window.kakao.Postcode` 가짜로 주입, regions ensure·complex-by-name·search는 실제 PHP+DB). 증거: `/workspace/review/hold/re/`(스크린샷 27장 · `probe-re-*.json`) · `logs2/`(검사·API 로그). 임시 서버 전부 종료.
- 프로브 중 복제 DB에 생긴 행: `regions` id 902(서울 강남구 대치동, ensure가 실제 bcode로 새로 만든 행 — 기존 픽스처 동코드가 가짜라서) · `complexes` id 51(은마아파트·902, 단지 경로 확인용 수동 추가). 공유 study114_dev 무변경.

### 판정: **보완 필요**

R1·R2·R4·R5·R6·R7·R8·R10·R11·R12는 실제로 해결됨(숫자 아래). 남은 것: **「잠긴 정책과 어긋난 오류」 1건(E1 — D3가 URL 복원 경로에서 그대로)** + 검사 회귀 1건(E2) + 공유 모듈 범위 초과 1건(E3) + 낮음 2건(E4·E5) + 증거 1건(E6). 재작업지시서: [214](214-hold-bundle-rework2-2026-10-07.md)(미발송).

### 1. 커밋·범위

| 항목 | 결과 |
|---|---|
| origin/main | `11b0c0d` 그대로 |
| 브랜치 | ab68b05 **조상 확인**(`merge-base --is-ancestor` OK) · 새 커밋 1개 `06f9dc5`(2026-10-07 08:24 KST). force·amend 흔적 없음 |
| PR | `refs/pull/*/head` 29개 중 ab68b05·06f9dc5 **0** |
| diff ab68b05..06f9dc5 | 8파일 +591/−180 — 전부 213 §2 허용 목록 안 |
| `saveFacility`·StudyRoomRegisterService | diff 0 · `search.php`(11b0c0d..) diff 0 · 「학부모」 추가 0(기존 verify 문자열 1줄 그대로) |
| php -l | SearchService.php · verify-room-promo-region-match.php OK |
| 테스트 머지 | 06f9dc5 × 숨김 `2723c5f` / 162 `0a7005c` / 159-c `4c865bd` 각각 충돌 0. (159-c⊃숨김)+162 합친 커밋 위에 06f9dc5 3방향 머지도 충돌 0. 합친 트리 `profile_status` 줄 = 숨김 tip과 동일 |

### 2. R1~R12 실제 해결 여부

| R | 판정 | 근거(06f9dc5) |
|---|---|---|
| R1 게스트 단지 우회 | **해결** | API(holdrev): 게스트 학생 `{study_room, 단지 2=부산 센텀자이}` 기준 [5,4] → ab68b05 **[2](부산)** → 06f9dc5 **[5,4]**(=게스트 `{}`, 강남구 2명). 게스트 공부방 `{complex_id:50 역삼}` 3 → **0** → **[1,5,4]**(=게스트 `{}`, 대치동 3장·티어 동일). `SearchService.php:138` |
| R2 region+complex | **해결** | `{region_id:1, complex_id:1}`(홈·공부방 로그인 찾기 진입 요청과 같은 키) 3 → **1** → **3**(id 1,5,4 = `{region_id:1}`). `{complex_id:1}`만 1건(은마). `:503` |
| R3 검색 후 현재위치 | **부분 해결 → E1·E3·E4** | 검색 직후: 강남구 → 현재위치 2곳·현황박스 「서울특별시 강남구 공부방 현황입니다」·지도 질의·칩·URL `region` 전부 「서울특별시 강남구」, 홍보1 0, 「위치를 선택해 주세요」 0. 세종 → 전부 「세종특별자치시」(1건). 공부방 로그인 학생찾기 구 검색도 「서울특별시 강남구」(기준·ab68b05 = 「대치동」). 초기화 → 「대치동 · 은마아파트」(홍보1), 검색 요청 0. **단, 새로고침·URL 공유(복원 검색) 뒤에는 홍보1로 되돌아감(E1).** |
| R4 promo verify | **해결** | 36/0 → Fatal(exit 255) → **38/0**. region_label 1케이스만 예외 단언으로 교체 + region+complex 단언 2개 추가. 다른 단언 삭제 0 |
| R5 basic-register 원복 | **해결** | `git diff 11b0c0d..06f9dc5` = **추가 4줄만**(hold 단언 4개), 4줄(:45·52·53·58) 원문 바이트 동일. FAIL 이름 4개가 11b0c0d와 **완전히 같음**(`diff` 0): backend blocks duplicate study_room row · complete go-home copy · missing-seed copy uses 홍보지역 · mypage overview hides empty promo 2·3. 23P/4F → 31/0 → **27P/4F** |
| R6 3단계 막기 | **해결**(E5 낮음) | 단지 미등록(「없는검수아파트」) → 검색 버튼 search.php **0** + 「등록된 아파트단지가 없습니다. 주소찾기로 다시 선택해 주세요.」. 동 확정 실패(ensure 500 주입) → **0** + 「동을 다시 선택해 주세요」. 확정 대기(ensure 2.5초 지연) → **0** + 「주소 확인 중입니다…」. **구만(3단계 비움) → 1건 요청 `{sigungu_region_id:27}` 21건(안 막힘).** 등록 단지(은마·902) → complex-by-name → `{complex_id:51}`만 전송(구 키 삭제) · 현재위치 「대치동 · 은마아파트」 |
| R7 응답 순번 | **해결** | 2쪽 응답 2.5초 지연 + 2쪽→1쪽 연속 클릭 → 활성 1쪽 · 목록 20건(1쪽) · 「21건」. 늦은 2쪽 응답 미반영 |
| R8 ensure 가드 | **해결**(코드) | `confirmStudyroomDong`이 latest 반환(`:614-643`), 호출부 2곳 최신일 때만 bag 갱신, `if (studyroomDongSeq)` 0. 행동 프로브는 미실시(학생 희망=공부방 동 경로 연속 선택 재현 어려움) |
| R9 죽은 코드 | **해결**(→E2) | 상품 코드 rg 0(7개 이름 + `if (studyroomDongSeq)`). 남은 1건 `scripts/verify-student-location-flow.mjs:654` → **E2** |
| R10 문구 | **해결** | 위 R6 문구 그대로 |
| R11 행동 단언 | **해결** | 61 → **76 P / 0 F**(+15, 가짜 PDO 행동 단언 12). **06f9dc5 스크립트를 ab68b05 트리에 돌리면 6 FAIL**(게스트 complex 키 2·게스트 우회 id 집합 2 = D1, region+complex SQL·id 집합 2 = D2) → D1·D2를 실제로 잡음 |
| R12 ssot/13 | **해결** | §2 표·§7-3 표 문구만(`:26-28`, `:132-134`) |

### 3. 검사 (같은 박스·같은 명령, 기준 11b0c0d → ab68b05 → 06f9dc5)

| 검사 | 11b0c0d | ab68b05 | 06f9dc5 | 판정 |
|---|---|---|---|---|
| verify-hold-find-address | 없음 | 61/0 | **76/0** | OK(ab68b05에 대면 6 F) |
| verify-study-room-basic-register-api | 23/**4F** | 31/0 | **27/4F** | OK(R5, 같은 4개) |
| verify-student-mypage-hope-region | 70/0 | 71/0 | 71/0 | OK |
| verify-region-save-rules | 46/0 | 46/0 | 46/0 | OK |
| verify-basic-exposure-gate | 24/0 | 24/0 | 24/0 | OK |
| verify-tutor-region-label | 103/0 | 103/0 | 103/0 | OK |
| verify-position-region-tier.mjs | 24/0 | 23/1 | **24/0** | OK(D2 해소) |
| verify-position-region-tier.php | 19/0 | 18/1 | **19/0** | OK |
| verify-room-promo-region-match.php | 36/0 | Fatal | **38/0** | OK(D4 해소) |
| verify-guest-baseline-map-cards | 72/0 | 72/0 | 72/0 | OK |
| **verify-student-location-flow** | 189/0 | 189/0 | **187/2** | **E2 새 실패** — `(e) 카카오 우편번호 열림` · `(e) 공부방 찾기 = 고른 동(보기 전용)…` |
| verify-location-ssot | 14/0 | 14/0 | 14/0 | 통과(단, E3 변경을 잡는 단언 없음) |
| verify-input-fill-rule | 282/3F | 283/3F | 283/**3F** | 같은 3부 변이 3건(tutor-reg screens · study-room-basic-form · register.css). 실행 뒤 트리 깨끗 |
| vite build 5패키지 | 5/5 | 5/5 | **5/5** | OK |

에이전트 보고 ⑤에 student-location-flow·location-ssot 실행 결과 **없음**(⑦에 「rg가 0이 아니다」만). 187/2를 보고하지 않음.

### 4. 추가 점검 (a)~(f)

- **(a) student-location-flow:654** — 11b0c0d 189/0 · ab68b05 189/0(핸들러가 렌더 요소 없이 살아 있어 가짜 root로 통과) · 06f9dc5 **187/2**. 새 실패 = 결함 **E2**. 원인 일부는 213 허용 목록에 이 파일을 넣지 않은 지시서 허점. (e) 시나리오(공부방 탭 주소찾기 → 저장 선택·학생 임시값 미오염·학생 탭 미전파)는 지금 `find-step3-address` + 검색으로 다시 써야 함(t1500: 현재위치는 검색 뒤 바뀜).
- **(b) 표기** — 게스트 기본 문구 그대로: 공부방 「대치동」, 과외쌤·학생 「서울시 강남구」(3곳 모두, 「위치를 선택해 주세요」 0). 로그인 구 검색 표기 「서울특별시 강남구」 = **11b0c0d 과외쌤 로그인 구 검색과 같은 표기**(`applyGuDisplayLabel` → `activityLabelFromRegionId`, 기준 tutor_gu 「서울특별시 강남구」) → 기존 규칙과 일치. **그러나 `location-display.js` 변경은 「표시만」이 아님(E3):** 하네스 29케이스(11b0c0d vs 06f9dc5, `review/hold/ld-diff.mjs`)에서 9케이스 변화 — 공부방 축 `「서울특별시 강남구」` displayLabel ''→「서울특별시 강남구」에 더해 **`apartmentName`에 시군구 라벨을 넣고 regionKey가 바뀜**(`서울특별시|강남구` → `서울특별시|강남구|서울특별시 강남구`), 광역 단독 「서울특별시」「세종특별자치시」도 displayLabel ''→값. 호출부 전수: search-find-surface 9 · search-page 5 · search-map 1(`parseRegionParts`가 `dong || apartmentName` → 현황박스 제목이 이 우회로 나옴) · home seed 2(`:162` dong만, `:267` 홍보1=동 단위라 **홈 표기 변화 0**) · verify-location-ssot. 과외·학생 축(`tutorAxisLabel` 분기 먼저)은 변화 0. **영향 경로:** GPS(`search-find-surface.js:1055` 「broad-region-only」 건너뛰기)가 공부방 축에서 동 없는 시군구·광역 결과를 더는 건너뛰지 않고 `:1074-1075` 저장 희망지역에 기록 — 「광역만 있으면 빈 값」 규칙(`placeCaption` 주석)이 공부방 축에서 깨짐.
- **(c) 초기화 루프** — **11b0c0d부터 있음.** `resetFindSurface`의 `form.reset()`(11b0c0d `:1591` / 06f9dc5 `:1622`) → form `reset` 리스너(`:2784` / `:3039`) → `setTimeout(applyReset)` → rerender → 새 form에 리스너 → 다시 `form.reset()` … **무한**. 측정(초기화 후 5초, 공부방·과외쌤·학생 로그인 각각): DOM 변이 초당 **300~390(11b0c0d)** · 180~370(ab68b05) · 180~320(06f9dc5), API 요청 0, 멈추지 않음. 폼이 계속 다시 그려져 Playwright 클릭이 「element was detached」로 30초 실패 — 사용자 화면에서도 초기화 뒤 선택창이 닫히거나 입력이 사라질 수 있음. 이번 묶음이 만든 것 아님 → **별건 C16**(종현 확인, 우선순위 높음).
- **(d) R6** — 위 표: 단지 미등록·동 실패·대기 모두 요청 0, 구만 검색은 요청 1·21건. 막힌 검색 뒤 표시가 갈림(E5).
- **(e) R11** — ab68b05에 대고 6 FAIL(D1 4 · D2 2) 확인.
- **(f) R5** — 원문 바이트 동일·FAIL 이름 동일 확인.

### 5. 에이전트 스크린샷 4장 (직접 확인)

| 파일 | 내용 | 판정 |
|---|---|---|
| gangnam-current.png | 강남구 검색 후 현재위치 2곳·현황박스·칩 「서울특별시 강남구」 | 주장과 맞음. 단 **가짜 search 응답**(목록 `PAGE1-ITEM` 1장 + 「21건」 · 현황박스 「공부방 1」) |
| gangnam-map.png | 현황박스 「서울특별시 강남구 / 서울특별시 강남구 공부방 현황입니다 / 공부방 1」 | 맞음(위와 같은 가짜 응답) |
| step3-unconfirmed.png | 아파트단지 · 「은마아파트」 · 「등록된 아파트단지가 없습니다…」 · 현재위치 홍보1 | 맞음 |
| step3-after-search.png | **unconfirmed와 sha256까지 같음(57afbae9…) — 같은 파일** | 독립 증거 아님(E6). 막힌 검색은 화면 변화가 없어 같은 그림이 나올 수는 있으나 「검색 버튼 뒤」를 증명 못 함 → 이번 박스 프로브(요청 0)로 대체 확인 |

### 6. 결함 (06f9dc5 기준 파일:줄)

| # | 등급 | 내용 | 근거 |
|---|---|---|---|
| **E1** | 「잠긴 정책과 어긋난 오류」(D3 잔여) | **복원 검색(새로고침·공유 URL·뒤로가기)** 뒤 공부방찾기 현재위치·칩·현황박스·URL `region`이 홍보1(「대치동 · 은마아파트」)로 되돌아감 — 목록은 강남구 21건 그대로. 공부방 로그인 학생찾기(희망=공부방)도 같음. 과외쌤찾기는 「현재위치 27」(숫자 id) — **11b0c0d부터 같은 증상**(같은 원인). 원인: 복원 검색(`search-page.js:244-251` queueMicrotask)이 시군구 단위 목록 `findCityUnits`(`search-find-surface.js:498/529` 비동기 로드) 전에 `regionLabelFromFilters`를 불러 `activityLabelFromRegionId(guId, findCityUnits)`(`:1342`)가 ''→ 공부방 축 폴백(홍보1)·과외 축 raw id | 프로브 `probe-reload.mjs`: 06f9dc5 room 검색 직후 「서울특별시 강남구」 → 새로고침 6초 뒤 「대치동 · 은마아파트」·URL `region=대치동 · 은마아파트`·「21건」. 11b0c0d·06f9dc5 tutor 「27」. `re/br-room-gu-reload.png` |
| **E2** | 중간(검사 회귀) | verify-student-location-flow 189/0 → **187/2**. (e)가 지운 `find-region-address` 핸들러를 가짜 root로 부름. 보고 누락 | `scripts/verify-student-location-flow.mjs:640-690`(특히 `:654`) |
| **E3** | 중간(범위 초과·공유 규칙 변경) | 213은 location-display를 「시군구 표시 1곳, 표시만」 허용. 실제: ① `normalizeLocation`이 공부방 축에서 동·단지 없으면 **`apartmentName`에 displayLabel(시군구)을 넣음** → regionKey·`placeCaption`·`parseRegionParts` 의미 변경 ② `formatLocationDisplay` 공부방 축 광역 폴백이 시·도 단독(「서울특별시」)과 province까지 표시 → GPS 「광역만」 건너뛰기(`search-find-surface.js:1055-1058`)가 공부방 축에서 무력화, 동 없는 GPS 결과를 저장 희망지역에 기록(`:1074-1075`) | `preview/shared/location-display.js:234-241`, `:318-321`. 하네스 9/29 변화 |
| **E4** | 낮음(표기 불일치) | 3단계 **동** 검색 뒤 제목 줄 현재위치 「강남구 대치동」 vs 목록 툴바 현재위치 「대치동」 vs 칩·URL 「강남구 대치동」 — 한 화면 두 표기(공부방 축 규칙 = 동). 단지는 「대치동 · 은마아파트」로 일치 | `search-find-surface.js:1851`(`bag.display = [sigungu, dong]`) |
| **E5** | 낮음 | 막힌 검색(요청 0)이 `searchExecuted=true`로 표시를 바꿈: 동 확정 실패 → 현재위치·현황박스·URL `region`이 「서울특별시 강남구」로 바뀜(검색 안 했는데), 단지 미등록 → 홍보1 유지. 두 막힘이 서로 다름 | `search-find-surface.js:2606-2620`, `:2658-2669` |
| **E6** | 낮음(증거·보고) | after-search 스크린샷 = unconfirmed와 같은 파일. 스크린샷이 가짜 search 응답 기반(현황박스 1 vs 21건). 보고 ⑤에 student-location-flow 187/2 누락 | artifacts sha256, 보고 ⑤⑦ |

### 7. 종현 확인 (최종 목록)

| # | 내용 | 상태 · 기본안 |
|---|---|---|
| C1–C10 | 단지명 1규칙 · 과외 3단계 비활성 · 구=베이직 · 희망 빈 옵션 제거 · complex-by-name SELECT · 정확 일치 · 세종 36000→36110 · region_label 422 · 홈 시군구 전환 없음 · AddressRegionMatch 삭제 | **전부 구현·확인됨**(212 §검수 결과 §6 + 이번 숫자) |
| C11 | 3단계 동·단지가 고른 시군구 밖 | 현행(막지 않음) · 별건 |
| C12 | 현황박스 「변경」 주소가 3단계 칸도 채움 | 현행 유지 |
| C13 | 페이지 번호 URL 보존 | 없음(새로고침=1쪽) 유지 |
| C14 | basic-register 기존 4 FAIL(11b0c0d부터) | 별건(문구 결정 후) |
| C15 | 게스트 필터 조작 = 로그인 게이트 | 현행 |
| **C16**(신규) | **초기화 무한 재렌더 루프 — main 11b0c0d에 이미 있음(운영 반영 여부 확인 필요)** | 기본안: 이 묶음과 별도 1줄급 수정 지시(리셋 이벤트에서 부른 `applyReset`은 `form.reset()`을 다시 부르지 않게). 우선순위 높음 |
| **C17**(신규) | 공부방 현황박스 「공부방 N」 = 현재 쪽 항목 수(20) — 검색 「21건」과 다름(11b0c0d부터 같은 계산 `basicListTotal(items)`) | 기본안: 현행 유지, 원하면 별건 |
| **C18**(신규) | 로그인 구 검색 표기 「서울특별시 강남구」(정식) vs 게스트 잠금 「서울시 강남구」 | 기본안: 현행(과외쌤 로그인 기존 표기와 같음). 게스트 문구는 잠금 그대로 |

### 8. 운영 DB SELECT (종현만 · 에이전트 실행 금지)

212 §검수 결과 §7 4개 그대로 + 아래 1개.
```sql
-- 같은 시군구·같은 동 이름 regions 행이 2개 이상(ensure가 bcode 불일치로 새 행을 만든 흔적).
-- 이 경우 찾기 단지 조회(complex-by-name, region_id=ensure 결과)가 다른 동 id에 등록된 단지를 못 찾음.
SELECT LEFT(sigungu_code,5) sg, dong_name, COUNT(*) n, GROUP_CONCAT(id) ids, GROUP_CONCAT(COALESCE(dong_code,'-')) codes
FROM regions WHERE unit_level='dong' GROUP BY LEFT(sigungu_code,5), dong_name HAVING n>1;
```

### 9. 머지 순서 (배포 직전 정지 유지, 종현 승인 뒤)
숨김 `2723c5f` → 162 `0a7005c` → 159-c `4c865bd`(숨김 포함) → **보류 묶음(214 보완 후 tip)** 마지막. 지금 tip 기준 4개 합친 머지 충돌 0. 보류 묶음은 214 재검수 검수완료 전 머지 금지.

### 10. 다음
- [214](214-hold-bundle-rework2-2026-10-07.md) 작성(**미발송**·클라우드 미접촉). 같은 브랜치 새 커밋만.
- 정리: php -S 8191/8192/8193 · 정적 4291/4292/4293 종료. 비교용 워크트리 `study114-wt-hold-ab`(ab68b05, node_modules 심볼릭만) 재재검수용으로 남김. 복제 DB `study114_holdrev` 남김(위 2행 추가).

---

## §재검수2 결과 (2026-10-07, 26cadd3)

- **재검수2:** 2026-10-07 09:1x~09:4x KST, 우동공과2(t1523 야간 위임). 클라우드 에이전트 미접촉. 브랜치 수정·push 0. main·배포·운영 SQL 0.
- **대상:** `origin/cursor/hold-find-address-20261007` tip `26cadd323a16539b04ceb4070461f7941899e6d9` (214 수행 보고 = transcript 마지막 줄).
- **워크트리:** `/workspace/study114-wt-hold`(26cadd3) · `/workspace/study114-wt-hold-ab`(06f9dc5, 비교) · `/workspace/study114-wt-hold-base`(11b0c0d). 셋 다 dirty 0.
- **로컬 프로브:** 복제 DB `study114_holdrev`(3307) · php -S 8191/8192 + search-ui dist 4291/4292 · Playwright(카카오 `window.kakao.Postcode` 가짜, regions·complex-by-name·search는 **실제 PHP+복사 DB** — 에이전트 스텁과 다름). 증거: `/workspace/review/hold/re2/` · `logs3/`. 임시 서버 종료.

### 판정: **검수완료** — 배포 직전 (main 미반영 · 종현 승인 대기)

214 S1~S6 전부 실측으로 해결. 213 R1·R2 회귀 0. 새 결함으로 재작업지시서(215) 불필요. C16(초기화 무한 재렌더)은 지시대로 미수정·별건 유지.

### 1. 커밋·범위

| 항목 | 결과 |
|---|---|
| origin/main | `11b0c0d` 그대로 |
| 브랜치 | 06f9dc5·ab68b05 **조상 확인**. 새 커밋 1개 `26cadd3`(2026-10-07 09:08 KST). force·amend 흔적 없음 |
| PR | `refs/pull/*/head`에 26cadd3·06f9dc5·ab68b05 **0** |
| diff 06f9dc5..26cadd3 | **6파일** +266/−68 — 전부 214 §2 허용 목록 |
| `saveFacility` · `SearchService.php` · `search.php` | diff **0** |
| C16 초기화 루프 | `form.reset`/`applyReset` 줄 diff **0**(지시대로 미수정) |
| 「학부모」 추가 | 0 |
| php -l SearchService | OK |
| 테스트 머지 | 26cadd3 × 숨김 `2723c5f` / 162 `0a7005c` / 159-c `4c865bd` 각각 충돌 **0** |

### 2. S1~S6 / E1~E5 실측

| # | 판정 | 근거(복사 DB 실측) |
|---|---|---|
| **S1/E1** 복원 뒤 시군구 유지 | **해결** | 구 검색 후 새로고침 0.2~6초: 공부방찾기 현재위치·칩·현황박스·URL `region` = 「서울특별시 강남구」, 21건, 숫자 id「27」 **0**(깜빡임도 없음). 세종 검색→새로고침 = 「세종특별자치시」1건. 공부방 로그인 학생찾기(희망=공부방) 구→새로고침 = 「서울특별시 강남구」2건. 과외쌤찾기 구→새로고침 = 「서울특별시 강남구」, 「27」0. **공유 URL**(`searched=1&f=…`) 직접 진입 0.3~7초도 세 탭 모두 시군구 유지. `whenFindCitiesReady`(`search-page.js:251`) + `refreshSearchedLabelWhenCitiesReady`(`search-find-surface.js:2680`) |
| **S2/E2** location-flow | **해결** | 189/0(06f9dc5의 187/2 해소). (e) 단언 이름 9개 동일(감소 0). 기대값만 「경기도 의정부시 가능동」→「가능동」(S4 동 표시 규칙·214 허용). 핸들러 `find-step3-address` + `runFindSearchWithFilters` |
| **S3/E3** location-display | **해결** | 표본 44: `apartmentName`·`level`·`regionKey`·`dong`·`city`·`district`·`searchScopeLabel` 변화 **0**. 바뀐 값 = 공부방/study_room 축 시·도+시군구·세종 `displayLabel`/`placeCaption`뿐. 시·도 단독(「서울특별시」「경기도」) displayLabel ''. 과외 축 변화 0. GPS 동·단지 없으면 건너뜀(`:1061-1063`). `parseRegionParts` 제목 1식(`search-map.js:34-38`). 홈·verify-location-ssot 14/0 · guest-baseline 72/0 |
| **S4/E4** 동 표기 통일 | **해결** | 3단계 동 검색 후 제목 줄·현황박스·칩·입력칸·URL `region` **전부 「대치동」**(복사 DB, ensure 동 id라 목록 0건 — 표시 검증 OK). `:1874-1875` |
| **S5/E5** 막힌 검색 표시 유지 | **해결** | 동 실패·단지 미등록·대기 3종: search.php 추가 **0**, 현재위치·칩·URL·건수(21) 막기 전후 동일, 안내만 갱신. `runFindSearch`/`runFindSearchWithFilters`가 `searchExecuted`를 세우지 않음 |
| **S6** 새 단언 | **해결** | tip 119/0. **같은 스크립트를 06f9dc5에 대면 15 FAIL**(S1·S3·S4·S5) — 과거 결함을 실제로 잡음 |
| R1·R2 회귀 | **없음** | 게스트 학생+부산단지 → 강남구 [5,4]. 게스트 공부방+역삼단지 → 대치동 [1,5,4]=게스트 `{}`. `{region_id:1,complex_id:1}` → 3 = `{region_id:1}` |

### 3. 검사 (11b0c0d → 06f9dc5 → 26cadd3)

| 검사 | 11b0c0d | 06f9dc5 | 26cadd3 |
|---|---|---|---|
| verify-hold-find-address | 없음 | 76/0 | **119/0** |
| verify-study-room-basic-register-api | 23P/4F | 27P/4F | 27P/4F(같은 4이름) |
| verify-student-mypage-hope-region | 70/0 | 71/0 | 71/0 |
| verify-region-save-rules | 46/0 | 46/0 | 46/0 |
| verify-basic-exposure-gate | 24/0 | 24/0 | 24/0 |
| verify-tutor-region-label | 103/0 | 103/0 | 103/0 |
| verify-position-region-tier.mjs | 24/0 | 24/0 | 24/0 |
| verify-position-region-tier.php | 19/0 | 19/0 | 19/0 |
| verify-room-promo-region-match.php | 36/0 | 38/0 | 38/0 |
| verify-guest-baseline-map-cards | 72/0 | 72/0 | 72/0 |
| verify-student-location-flow | 189/0 | 187/2 | **189/0** |
| verify-location-ssot | 14/0 | 14/0 | 14/0 |
| verify-input-fill-rule | 3F | 3F | **3F**(같은 3부 변이) |
| vite build 5패키지 | 5/5 | 5/5 | **5/5** |

### 4. 에이전트 스크린샷 소견

| 파일 | md5 | 내용 | 판정 |
|---|---|---|---|
| hold-s2-reload-gangnam.png | 0058ecc6… | 강남구 검색(주장: 새로고침 후) 현재위치·칩·현황 「서울특별시 강남구」·21건 | 주장과 맞음. **단 응답은 로컬 PHP 스텁**(현황박스 「공부방 1」 vs 목록 21) |
| hold-s2-blocked-before.png | **0058ecc6… = reload와 동일** | — | **증거 중복**(에이전트 인정). 독립 증거 아님 |
| hold-s2-blocked-after.png | adbb54a7… | 「동을 다시 선택해 주세요」·현재위치·칩·21건 유지 | 맞음(스텁) |
| hold-s2-dong-search.png | 4168902c… | 현재위치·현황·칩·입력 전부 「대치동」 | 맞음(스텁, 목록 21건은 가짜) |

→ 스텁 한계는 **복사 DB 실측**(`/workspace/review/hold/re2/`, `probe-s2.json`, `probe-share`)으로 대체 확인. 새로고침·공유 URL·막힌 3종·동 표기 모두 tip에서 통과.

### 5. 종현 확인 최종 목록

| # | 내용 | 상태 |
|---|---|---|
| C1–C10 | 단지명 1규칙·과외 3단계 비활성·구=베이직·희망 빈옵션 제거·complex-by-name SELECT·정확일치·세종·region_label 422·홈 시군구 전환 없음·AddressRegionMatch 삭제 | **구현·확인** |
| C11 | 시군구 밖 3단계 막기 | 현행(미구현)·별건 |
| C12 | 현황박스 「변경」→3단계 칸 채움 | 현행 유지 |
| C13 | 페이지 번호 URL 보존 | 없음 유지 |
| C14 | basic-register 기존 4 FAIL | 별건(문구 결정 후) |
| C15 | 게스트 필터=로그인 게이트 | 현행 |
| **C16** | 초기화 무한 재렌더(11b0c0d부터, 초당 DOM 변이 180~390) | **별건·우선 높음**. 이번 묶음 미수정(214 금지). 배포 전 별도 1줄급 수정 권고 |
| C17 | 현황박스 「공부방 N」=현재 쪽 수(20) vs 검색 21건 | 현행 유지(별건) |
| C18 | 로그인 「서울특별시 강남구」 vs 게스트 「서울시 강남구」 | 현행 유지(과외쌤 로그인 기존 표기와 같음) |

### 6. 운영 DB SELECT (종현만 · 에이전트 실행 금지)

212 §검수 결과 §7 4개 + §재검수 결과 §8 1개(같은 시군구·동 이름 중복 regions) **그대로**.

### 7. 머지 순서 · 배포 직전 상태

- **머지 순서:** 숨김 `2723c5f` → 162 `0a7005c` → 159-c `4c865bd`(숨김 포함) → **보류 묶음 tip `26cadd3` 마지막**.
- 4개 합친 시험 머지 충돌 0(직전 재검수·이번 pairwise 확인).
- **상태: 검수완료 / 배포 직전.** main 미반영. 종현 승인 전 merge·deploy·운영 SQL 금지.
- C16은 이 묶음과 분리해 승인 시 별도 지시 권고(초기화 직후 입력 끊김 위험 — 이미 main에 있을 수 있음).

### 8. 다음
- 재작업지시서 **불필요**(215 미작성).
- 정리: php -S·정적 서버 종료. 워크트리·복제 DB 재검수용 유지.
