# 213 · 보류 묶음(찾기 주소 통일·단지·bname) — 재작업지시서 (2026-10-07)

- **작성:** 2026-10-07 07:5x KST, 우동공과2 (t1523 야간 위임 — **배포 직전까지만**)
- **근거:** [212](212-hold-bundle-work-order-2026-10-07.md) §검수 결과 (2026-10-07, ab68b05) — 판정 **보완 필요**
- **발송:** 우동공과2가 함. 이 문서만으로 자동 발송하지 않음. 클라우드 에이전트 미접촉.

> 아래 블록 전체를 클라우드 에이전트에 그대로 전달.

````
# [보류 묶음] 찾기 주소 통일 — 재작업지시서 (ab68b05 보완)

## 0. 규칙 (어기면 불합격)
- 저장소 leejetty-commits/study114. 브랜치 **`cursor/hold-find-address-20261007`** 그대로(tip `ab68b05`). 시작: `git fetch origin && git rev-parse origin/main origin/cursor/hold-find-address-20261007` 결과를 보고 첫 줄에 적기(11b0c0d / ab68b05 기대. 다르면 적고 진행).
- **새 커밋만 추가해서 push.** `--amend`·force push·rebase·리셋 금지. PR 만들기·main push·머지·배포·운영 DB 접속·SQL(SELECT 포함) 금지. 다른 브랜치(숨김·162·159-c) 손대지 말 것. 도구가 PR을 자동으로 만들면 번호만 보고.
- **허용 파일(§2) 밖 1줄이라도 수정 = 불합격.** 파일 안에서도 「무엇만」 밖 금지. 무관 정리·이름 바꾸기·포맷만 고치기 금지.
- 212의 잠금·금지(§0·§4·§9)는 전부 그대로 유효. 「학부모」 카피 0 · `saveFacility` 숨김 줄 0 · ComplexEnsure 검색 INSERT 0 · LIKE 0 · 홈 시군구 전환 0.
- rg는 `-g '!node_modules' -g '!dist'`.
- 결과 = **한국어 · 마지막 메시지 하나**(§5).

## 1. 고칠 것 (전부 이번에 끝냄 · 미루기 금지)

### R1 — 게스트 지역 고정 우회 막기 (잠긴 정책)
- `src/Search/SearchService.php` `guestScopedFilters` unset 목록(`:135-138`)에 `'complex_id'`, `'preferred_studyroom_complex_id'` **2개만 추가**. 다른 줄 변경 0.
- 결과: 게스트는 단지 키를 보내도 공부방 = 대치동 목록, 학생 = 서울시 강남구 목록 그대로.

### R2 — 단지 WHERE는 `region_id`가 없을 때만
- `SearchService.php:502-510` 단지 EXISTS 조건을 **`region_id` 필터가 없을 때만** 붙인다(`region_id`+`complex_id` = 홈·찾기 진입 목록: 목록 소속은 region_id, complex_id는 티어 키 — 기존 계약). `roomTierScope`·`guOnly`·다른 분기 변경 0.
- 찾기 화면은 단지면 이미 region_id를 지우므로(`search-api.js settleRoomAddressFilters`) 화면 동작 변화 없음.

### R3 — 검색 후 현재위치·현황박스·지도·결과 칩·URL region = 검색 필터 단계 (잠긴 정책 t1500·t1507)
- 공부방찾기 검색 실행 후:
  - 구(시군구)만 → 현재위치·현황박스 제목·지도 중심·결과 칩·URL `region` = 그 시군구 라벨(예: 「서울시 강남구」, 세종 = 「세종」 포함 라벨).
  - 3단계 동 → 그 동 라벨 / 단지 → 「동 · 단지명」(기존 표시 규칙).
  - **검색 실행 뒤에는 홍보1 폴백(`memberRepresentativeRaw`) 금지.** 원인 줄: `search-find-surface.js:1354`(구 라벨을 공부방 축 `canonicalRegionLabel`에 넣음) → `:1241-1245` 폴백. 구 라벨은 과외쌤 경로처럼 시군구 표시 경로(`applyGuDisplayLabel` 계열 재사용)로 적용.
- 학생찾기(공부방 로그인·과외쌤 로그인)도 검색 후 같은 규칙(구=구 라벨, 3단계=동/단지)인지 확인하고 어긋나면 같은 방식으로.
- **바꾸지 말 것:** 진입(검색 전) 현재위치 = 공부방 홍보1 / 과외쌤 과외지역1 / 학생 로그인 희망지역 시군구(t1502) · 게스트 대치동/서울시 강남구 · 초기화 뒤 진입 상태로 복귀 · 필터 칸 미리채움 0.

### R4 — `verify-room-promo-region-match.php` 갱신 (Fatal 해소, 완화 금지)
- `:455-458` region_label 케이스를 **「region_label → InvalidArgumentException(검증 422)」 단언**으로 바꾼다(예외 메시지 = `지역은 구(시·군)까지 선택해 주세요.`). 나머지 단언(region_id·sigungu·게스트·소속 동 없음·소스 주석)은 **삭제·완화 0**.
- `:494` 「라벨 매칭 주석은 홍보 칸」: R9로 `applyRegionLabelMatch`를 지우면 `searchRooms` 지역 주석(`SearchService.php:475`)에 `홍보 칸 study_room_regions.region_id 만` 문자열이 남도록 주석 문구만 맞춤.
- (+R2 회귀 막기) 같은 파일에 `{region_id:100, complex_id:X}` → `{region_id:100}`과 같은 id 집합 단언 1개 추가.

### R5 — `verify-study-room-basic-register-api.mjs` 범위 밖 수정 되돌리기
- `:45`·`:52`·`:53`·`:58` **4줄을 11b0c0d 원문 그대로** 되돌림(중복 차단 단언은 원래대로 `svc`(BasicRegisterService) 대상, 문구 3단언 원문). 212로 추가한 4단언(AddressRegionMatch::match 0 ×2, `$cname = $caddr` 0 ×2)과 주석 문자열 유지 단언은 **유지**.
- 결과는 「기존 실패 4건(11b0c0d와 같은 이름) + hold 4단언 PASS」로 정직하게 보고. 기존 4건을 고치려고 다른 파일·문구를 바꾸지 말 것(별건).

### R6 — 3단계 미확정·대기·단지 없음이면 검색 막기 (201 「DB에 없으면 오류」)
- `search-find-surface.js` 3단계 bag(공부방·학생 희망=공부방): `applyStep3FromKakao`(`:1803-1856`)에 **대기 표시**(pending)를 두고, 응답 전·`unconfirmed`(단지 없음·동 확정 실패)일 때 `runFindSearch`(`:2579-2598`)가 **요청 0**으로 막고 3단계 칸 안내를 보인다. 시군구로 넓혀 검색하지 말 것.
- 3단계를 비우면(라디오 전환·초기화) 구 검색은 정상.

### R7 — 검색 응답 순번 가드
- `runFindSearchWithFilters`(`:2675-2707`)에 요청 순번을 두고, 응답·오류·finally 적용 직전 최신 순번일 때만 상태를 바꾼다(페이지 클릭 `:2944-2960`·검색 버튼·URL 복원 모두 같은 함수). 다른 구조 변경 0.

### R8 — 늦은 ensure 가드를 호출부까지
- `confirmStudyroomDong`이 「최신 응답이었는지」를 돌려주고, 호출부(`:2829-2838` 변경 버튼, `:2924-2932` 3단계 주소찾기)는 **최신일 때만** bag(dongId·display·unconfirmed)을 갱신. `if (studyroomDongSeq)`(항상 참) 삭제.

### R9 — 죽은 코드 삭제 (이번 변경이 남긴 것만)
- `search-find-surface.js`: `find-region-address`/`find-hope-address` 핸들러 `:2853-2900` 통째(렌더 요소 0) · `renderedStudyroomDongId` `:601` · `STUDYROOM_ADDRESS_HINT` `:494` · `studentCascadeRegionId` `:1858` · `:2587` 안내 대상 선택자를 새 3단계 칸(`[data-find-step3="open"] .search-field__hint`)으로 교체(R6 안내와 합쳐도 됨).
- `student-hope-type.js:38` 중복 줄 삭제.
- `SearchService.php` `regionLabelToken`(`:1356`)·`applyRegionLabelMatch`(`:1382`) 삭제(호출 0 확인 후). `rejectRegionLabel` 유지.
- 삭제 전 각 이름 rg로 호출 0 확인하고 보고.

### R10 — 3단계 안내 문구
- `:1772-1774`: 단지 분기 미확정 = 「등록된 아파트단지가 없습니다. 주소찾기로 다시 선택해 주세요.」, 행정동 분기 미확정 = 기존 `DONG_RETRY_HINT`(「동을 다시 선택해 주세요」).

### R11 — `verify-hold-find-address.mjs` 행동 단언 추가 (문자열만으로 끝내지 말 것)
- PHP 가짜 PDO(기존 `verify-position-region-tier.php`·`verify-room-promo-region-match.php` 방식 재사용, 실제 DB 접속 0)로 최소 아래 단언을 추가, fail 0:
  1. 게스트 `guestScopedFilters('student', {preferred_lesson_type:study_room, preferred_studyroom_complex_id:N})` 결과에 complex 키 0 · `preferred_region_id` = 강남구 id. room도 `complex_id` 0.
  2. `searchRooms` `{sigungu_region_id}` → 모든 item `exposure_tier=basic`·`position_sku=null`.
  3. `{complex_id}`만 → SQL에 `srr_cx.complex_id` 있음 / `{region_id, complex_id}` → SQL에 `srr_cx` 없음(R2).
  4. `{region_label}` → 예외.
  5. 학생 `{preferred_lesson_type:study_room, preferred_region_id:구}` → SQL에 `preferred_lesson_type = 'study_room'` + 동 IN.
  6. `RegionGuLink::dongIdsUnderGu(세종 36000 행)` → 36110 동 포함.
- 화면 쪽: `guPickIncomplete`·`findScopeMissing` 단언은 함수 본문을 잘라서(`slice`) 확인(지금 `:39` 정규식은 함수 뒤 아무 `return true;`에나 걸림).

### R12 — ssot/13 문구 (문구만)
- `docs/ssot/13-search-page-fields.md` §2 표(`:26-28` 「내 기본 지역(동/단지)·내 기본 시·내 영업권 지역」 자동값) → 「필터 비움 · 진입 현재위치·지도·현황만 기본(공부방=홍보1, 과외쌤=과외지역1)」 취지로.
- §7-3 표(`:130-134` 「구군 → 시/도」·「복수 시 → 광역」·「복수 → 광역」) → 「1시·도 단독 검색 불가 / 2시군구 필수(공부방 구=베이직만) / 3동·단지(공부방·학생 열림·과외 비활성)」와 맞게. 다른 절 변경 0.

## 2. 허용 파일 (이 밖 = 불합격)
- `src/Search/SearchService.php` — R1 2키 · R2 조건 · R9 두 메서드 삭제 · R4 주석 문구만
- `preview/search-ui/src/search-find-surface.js` — R3 · R6 · R7 · R8 · R9 · R10
- `preview/search-ui/src/screens/search-page.js` — R3에 꼭 필요할 때만(현재위치 표시)
- `preview/shared/location-display.js` — R3에 꼭 필요할 때만(시군구 표시 1곳, 표시만)
- `preview/search-ui/src/student-hope-type.js` — R9 1줄
- `scripts/verify-room-promo-region-match.php` — R4
- `scripts/verify-study-room-basic-register-api.mjs` — R5(4줄 원복만)
- `scripts/verify-hold-find-address.mjs` — R11
- `docs/ssot/13-search-page-fields.md` — R12
- **수정 금지(그대로 통과해야 함):** `scripts/verify-position-region-tier.mjs`·`.php`, 나머지 verify 전부, `StudyRoomRegisterService.php`·`BasicRegisterService.php`·`regions.php`·`RegionGuLink.php`·`study-room-basic-form.js`·`search-api.js`·홈 파일.

## 3. 금지
- 212 §4·§9 전부 · `saveFacility` · `form-collect.js` · TutorRegisterService · a28/settlement/076/077 · 상품 `provider_type=both`.
- 게스트 기준(대치동/서울시 강남구)·`search.php:61-76` 변경.
- 시군구 밖 3단계 막기(C11) 구현 — 종현 결정 전 금지.
- 페이지 번호 URL 보존(C13) 추가 금지.
- 검사 삭제·완화·기대값을 현재 코드에 맞춰 바꾸기(R4 지정 1케이스·R5 원복 제외).

## 4. 숫자 합격 기준 (전·후 숫자로 보고)
1. 게스트 API: 학생 `{study_room, 단지=다른 시군구 단지}` 결과 id 집합 = 게스트 학생 `{}` 결과와 **동일**, 강남구 밖 카드 **0**. 공부방 `{complex_id:대치동 밖 단지}` 결과 = 게스트 공부방 `{}`와 **동일**.
2. `{region_id:D, complex_id:C}` 결과 = `{region_id:D}` 결과(같은 id 집합·같은 total). `{complex_id:C}`만 → 다른 complex 카드 **0**.
3. 공부방 구 검색 후 화면의 「현재위치」 전부·현황박스 제목·결과 칩·URL `region`에 시군구 이름 포함 · 홍보1 라벨 문자열 **0**. 세종 검색 후 「세종」 포함. 초기화 후 = 홍보1(진입과 같음). 게스트 = 대치동/서울시 강남구 · 「위치를 선택해 주세요」 **0**.
4. 3단계 대기·미확정·단지 없음 상태에서 검색 버튼 → `search.php` 요청 **0** + 안내 1.
5. 페이지 2 → 1 연속 클릭에서 2쪽 응답을 늦게 돌려도(가짜 지연) 화면 = 1쪽 항목 · 활성 번호 1.
6. rg(`-g '!node_modules' -g '!dist'`) `find-region-address|find-hope-address|renderedStudyroomDongId|STUDYROOM_ADDRESS_HINT|studentCascadeRegionId|applyRegionLabelMatch|regionLabelToken` = **0**, `if (studyroomDongSeq)` = **0**.
7. 검사(전 ab68b05 → 후):
   - verify-position-region-tier.mjs **24/0**, .php **19/0** (수정 없이)
   - verify-room-promo-region-match.php exit 0, FAIL **0**, PASS ≥ **36**
   - verify-study-room-basic-register-api: FAIL **4**(11b0c0d와 같은 4개 이름) + hold 4단언 PASS
   - verify-hold-find-address: fail **0**, R11 행동 단언 ≥ **6** 추가
   - verify-student-mypage-hope-region 71/0 · verify-region-save-rules 46/0 · verify-basic-exposure-gate 24/0 · verify-tutor-region-label 103/0 · verify-guest-baseline-map-cards 72/0 · verify-input-fill-rule FAIL **3**(같은 3부 변이 3건만) — 숫자 유지
   - php -l 변경 PHP 전부 OK · vite build 5패키지 OK
8. `git diff --stat ab68b05..HEAD` = §2 파일만 · `saveFacility` 줄 diff **0** · 「학부모」 추가 **0** · `git diff 11b0c0d..HEAD -- search.php` **0**.

## 5. 보고 형식 (한국어, 마지막 메시지 하나)
① origin/main SHA · 시작 tip(ab68b05) · 새 tip SHA · 새 커밋 목록 · push 여부 · PR 0
② R1~R12 한 줄씩(파일:줄, 무엇을 바꿨나)
③ `git diff --stat ab68b05..HEAD` + 허용 밖 0 증명 + `saveFacility` diff 0
④ 숫자 기준 1~8 전·후(1~5는 어떻게 쟀는지 — 가짜 PDO/jsdom/로컬 서버 중 무엇)
⑤ 검사 출력 요약(명령·PASS/FAIL 숫자). 기존 실패는 이름까지
⑥ 스크린샷: 로컬 preview로 (a) 공부방 강남구 검색 후 현재위치·현황박스 (b) 3단계 미확정 안내 — **저장소 밖 경로**와 함께, 가능하면 base64·첨부로 실물 전달(지난번 `/tmp`만 적어 증거 공백). 불가면 이유
⑦ 위험·막힘
⑧ `git status -sb` · tip SHA
````

---

## §발송·검수 메모 (우동공과2)
- 2026-10-07 07:5x: 212 §검수 결과(ab68b05 보완 필요)에 따라 작성. **미발송** · 클라우드 미접촉 · git 무변경. 발송은 우동공과2(또는 종현 재지시). 배포 직전 정지.
- 재검수 때: 복제 DB `study114_holdrev`(박스 3307) + `/workspace/review/hold/probe-api.sh`·`probe-ui*.mjs` 재사용.
