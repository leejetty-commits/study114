# 214 · 보류 묶음(찾기 주소 통일) — 2차 재작업지시서 (2026-10-07)

- **작성:** 2026-10-07 09:2x KST, 우동공과2 (t1523 야간 위임 — **배포 직전까지만**)
- **근거:** [212](212-hold-bundle-work-order-2026-10-07.md) §재검수 결과 (2026-10-07, 06f9dc5) — 판정 **보완 필요** (E1~E6)
- **발송:** 우동공과2가 함. 이 문서만으로 자동 발송하지 않음. 클라우드 에이전트 미접촉.

> 아래 블록 전체를 클라우드 에이전트에 그대로 전달.

````
# [보류 묶음] 찾기 주소 통일 — 2차 재작업지시서 (06f9dc5 보완)

## 0. 규칙 (어기면 불합격)
- 저장소 leejetty-commits/study114. 브랜치 **`cursor/hold-find-address-20261007`** 그대로(tip `06f9dc5`). 시작: `git fetch origin && git rev-parse origin/main origin/cursor/hold-find-address-20261007` 결과를 보고 첫 줄에(11b0c0d / 06f9dc5 기대).
- **새 커밋만 추가해서 push.** `--amend`·force push·rebase·리셋 금지. PR·main push·머지·배포·운영 DB·SQL(SELECT 포함) 금지. 숨김·162·159-c 브랜치 손대지 말 것.
- **허용 파일(§2) 밖 1줄이라도 수정 = 불합격.** 파일 안에서도 「무엇만」 밖 금지. 무관 정리·이름 바꾸기·포맷 금지.
- 212·213의 잠금·금지 전부 유효(「학부모」 0 · `saveFacility` 0 · 검색 INSERT 0 · LIKE 0 · 게스트 기준 대치동/서울시 강남구 · `search.php` 0).
- 213 R1~R12로 고친 것은 되돌리지 말 것(숫자 기준 6에서 다시 잼).
- rg는 `-g '!node_modules' -g '!dist'`. 결과 = **한국어 · 마지막 메시지 하나**(§5).

## 1. 고칠 것

### S1 — 복원 검색(새로고침·공유 URL·뒤로가기) 뒤에도 현재위치 = 검색 단계 (잠긴 정책 t1500·t1507)
- 지금: 구 검색 후 새로고침하면 목록은 강남구 21건인데 현재위치·칩·현황박스·URL `region`이 홍보1로 돌아감(공부방찾기, 공부방 로그인 학생찾기). 과외쌤찾기는 「현재위치 27」(숫자 id, 11b0c0d부터 같은 원인).
- 원인: `screens/search-page.js:244-251` 복원 검색이 시군구 단위 목록 `findCityUnits`(`search-find-surface.js:498`, 비동기 로드 `:529`)보다 먼저 돌아 `regionLabelFromFilters`(`:1330-1350`)의 `activityLabelFromRegionId(guId, findCityUnits)`(`:1342`)가 빈 값 → 공부방 축 홍보1 폴백 / 과외 축 raw id.
- 고칠 방향(둘 중 하나, 구조 변경 최소): (a) 복원 검색 실행 전에 단위 목록 로드를 기다린다, 또는 (b) 단위 목록 로드가 끝났을 때 `state.searchExecuted`면 `regionLabelFromFilters`를 다시 적용하고 rerender·`syncFindHashState`. 3단계(동·단지) 복원은 기존 bag/필터 규칙대로.
- 숫자 id가 현재위치·칩·URL `region`에 나오는 일 0.
- **바꾸지 말 것:** 검색 전 진입 표시(공부방 홍보1 / 과외쌤 과외지역1 / 학생 희망지역) · 게스트 · 초기화.

### S2 — `verify-student-location-flow.mjs` (e) 갱신 (새 실패 해소, 완화 금지)
- 지금 187/2(`(e) 카카오 우편번호 열림`, `(e) 공부방 찾기 = 고른 동…`) — 지운 `find-region-address` 핸들러를 가짜 root로 부름(`:640-690`, `:654`).
- (e) 블록**만** 새 흐름으로: 공부방 탭 `[data-action="find-step3-address"]`(행정동) → 검색 실행 → 현재위치 = 고른 동(시도 정식 이름 규칙은 지금 표시 규칙에 맞게, 단 「경기 의정부시」 약칭 0 단언 유지). 나머지 (e) 단언(저장 선택 `find-canonical` 미기록 · 학생 임시값 미오염 · 서버 저장 지역 그대로 · 탭 이동 URL에 주소 미전파 · 학생 찾기 = 서버 저장 · 분기 리다이렉트)은 **전부 유지**. 단언 개수 감소 0.
- 결과 **189 이상 / 0 FAIL**.

### S3 — `location-display.js`는 「시군구 표시」만 (공유 규칙 원복)
- `preview/shared/location-display.js:234-241`(`normalizeLocation`에서 `apartmentName = displayLabel`) **삭제**. `apartmentName`·`level`·`regionKey`는 11b0c0d와 같아야 함.
- `:318-321` 광역 폴백은 **시·도+시군구가 함께 있을 때만**(예: 「서울특별시 강남구」, 「경기도 의정부시」) 표시. 시·도 단독(「서울특별시」「경기도」)은 '' 유지. 예외 1개: 세종(「세종특별자치시」, 시군구 단위가 없음)은 표시.
- 현황박스 제목은 `preview/search-ui/src/search-map.js` `parseRegionParts`(`:34`) **1줄만**: 동·단지가 없고 시군구 단계면 displayLabel을 제목으로(예: `canonical.dong || canonical.apartmentName || (canonical.level === 'district' || 세종 ? canonical.displayLabel : '')` 취지).
- GPS: `search-find-surface.js:1055-1058` 「broad-region-only」 건너뛰기가 공부방 축에서 동·단지 없는 결과도 건너뛰도록 조건 추가(11b0c0d 동작 복귀). `:1074-1075` 저장 희망지역 기록 경로 변경 0.
- `placeCaption`(`:331-343`)을 고쳐야 하면 공부방 축 「시·도+시군구」 표시 1분기만.

### S4 — 3단계 동 검색 뒤 표기 한 가지로
- `search-find-surface.js:1851` 동 분기 `bag.display`를 공부방 축 표시 규칙(동, 예: 「대치동」)에 맞춰 제목 줄 현재위치·툴바 현재위치·칩·URL `region`·현황박스가 **같은 문자열**. 단지 분기(「대치동 · 은마아파트」)는 그대로.

### S5 — 막힌 검색은 표시를 바꾸지 않음
- `runFindSearch` 3단계 막힘(`:2606-2620`)·`runFindSearchWithFilters` 막힘(`:2658-2669`): 요청 0 + 3단계 안내는 유지하되, 현재위치·현황박스·칩·URL `region`·목록은 **막기 전 그대로**(동 실패·단지 미등록·대기 셋 다 같게). 지금은 동 실패만 시군구 라벨로 바뀜.

### S6 — 검사 단언 추가 (`verify-hold-find-address.mjs`)
- S3 잠금: `formatLocationDisplay`/`normalizeLocation` 표본 — 공부방 축 「서울특별시」·「경기도」 displayLabel '' · 「서울특별시 강남구」 displayLabel 「서울특별시 강남구」 + `apartmentName` '' + regionKey `서울특별시|강남구` · 「세종특별자치시」 표시 · 과외 축 변화 0.
- S1: 복원 경로가 단위 목록 로드 뒤 라벨을 계산하는지(행동 또는 함수 본문 slice 단언).
- 문자열 grep만으로 끝내지 말 것(가능하면 jsdom/가짜 fetch로 행동).

## 2. 허용 파일 (이 밖 = 불합격)
- `preview/search-ui/src/search-find-surface.js` — S1 · S3(GPS 조건만) · S4 · S5
- `preview/search-ui/src/screens/search-page.js` — S1에 꼭 필요할 때만(복원 호출부)
- `preview/shared/location-display.js` — S3
- `preview/search-ui/src/search-map.js` — S3 `parseRegionParts` 1줄
- `scripts/verify-student-location-flow.mjs` — S2 (e) 블록만
- `scripts/verify-hold-find-address.mjs` — S6
- **수정 금지(그대로 통과):** `SearchService.php` · `verify-location-ssot.mjs` · `verify-position-region-tier.*` · `verify-room-promo-region-match.php` · `verify-study-room-basic-register-api.mjs` · 나머지 verify · 홈 파일 · `region-cascade.js` · `search-api.js`.

## 3. 금지
- 212 §4·§9, 213 §3 전부.
- **초기화 무한 재렌더(`resetFindSurface`의 `form.reset()` ↔ reset 리스너)** — 11b0c0d부터 있는 별건. 이번에 고치지 말 것(종현 결정 C16). 측정 때 초기화는 첫 프레임만 보면 됨.
- 현황박스 숫자(현재 쪽 수 vs 전체) 변경 금지(C17).
- 게스트 문구·로그인 구 표기(「서울특별시 강남구」) 변경 금지(C18).

## 4. 숫자 합격 기준 (전 06f9dc5 → 후)
1. 구(강남구) 검색 → 새로고침 6초 뒤: 공부방찾기·공부방 로그인 학생찾기(희망=공부방)·과외쌤찾기 각각 현재위치 전부·칩·현황박스 제목(공부방)·URL `region` = 「서울특별시 강남구」, 홍보1 문자열 **0**, 숫자 id **0**, 목록 건수 = 새로고침 전. 단위 목록 API를 ≥1초 늦춰도 같음. 세종 검색 후 새로고침 = 「세종특별자치시」.
2. verify-student-location-flow **≥189 / 0 FAIL**, (e) 단언 수 감소 0.
3. location-display 표본(최소: 서울특별시 강남구 / 서울시 강남구 / 서울특별시 / 세종특별자치시 / 경기도 의정부시 / 경기도 / 대치동 · 은마아파트 / 서울 강남구 대치동 / 강남구 × room·tutor 축): 11b0c0d 대비 바뀌는 값 = 공부방 축 「시·도+시군구」·세종 displayLabel(및 placeCaption)뿐. `apartmentName`·`level`·`regionKey` 변화 **0**. 시·도 단독 displayLabel ''. GPS 공부방 축 동 없는 결과 → 건너뜀(적용·저장 0).
4. 3단계 동 검색 뒤 제목 줄·툴바·칩·URL `region`·현황박스 제목의 지역 문자열 **1종류**.
5. 막힌 검색 3종(동 실패·단지 미등록·대기): search.php **0** · 막기 전/후 현재위치·URL `region`·목록 건수 **동일** · 안내 1.
6. 213 숫자 유지: 게스트 학생 `{study_room, 다른 시군구 단지}` = 게스트 `{}` · 게스트 공부방 `{complex_id:타지역}` = 게스트 `{}` · `{region_id, complex_id}` = `{region_id}` · 구 검색 전부 basic · 21건 → 2쪽 · 단지 미등록/대기/동 실패 요청 0 · 구만 검색 요청 1 · 페이지 경쟁 1쪽.
7. 검사: verify-hold-find-address fail 0(S6 단언 추가) · verify-position-region-tier.mjs 24/0 · .php 19/0 · verify-room-promo-region-match 38/0 · verify-study-room-basic-register-api 27P/4F(같은 4개 이름) · verify-student-mypage-hope-region 71/0 · verify-region-save-rules 46/0 · verify-basic-exposure-gate 24/0 · verify-tutor-region-label 103/0 · verify-guest-baseline-map-cards 72/0 · **verify-location-ssot 14/0** · verify-input-fill-rule FAIL 3(같은 3부 변이) · php -l · vite build 5패키지.
8. `git diff --stat 06f9dc5..HEAD` = §2 파일만 · `saveFacility` 0 · 「학부모」 추가 0 · `search.php` 0 · `SearchService.php` 0.

## 5. 보고 형식 (한국어, 마지막 메시지 하나)
① origin/main SHA · 시작 tip(06f9dc5) · 새 tip · 새 커밋 목록 · push 여부 · PR 0
② S1~S6 한 줄씩(파일:줄, 무엇을)
③ `git diff --stat 06f9dc5..HEAD` + 허용 밖 0 + `saveFacility` 0
④ 숫자 기준 1~8 전·후 + 잰 방법(가짜 응답이면 그렇다고 명시, 1·5는 실제 지연 주입)
⑤ 검사 **전부**(§4-7 목록 하나도 빼지 말 것) 명령·PASS/FAIL 숫자, 기존 실패는 이름까지
⑥ 스크린샷: (a) 구 검색 후 새로고침 화면 (b) 3단계 동 검색 후 (c) 막힌 검색 전·후 — **서로 다른 파일**(같은 바이트면 같다고 적기), 저장소 밖 경로, 가능하면 첨부
⑦ 위험·막힘
⑧ `git status -sb` · tip SHA
````

---

## §발송·검수 메모 (우동공과2)
- 2026-10-07 09:2x: 212 §재검수 결과(06f9dc5 보완 필요)에 따라 작성. **미발송** · 클라우드 미접촉 · git 무변경. 배포 직전 정지.
- 재재검수 때: 복제 DB `study114_holdrev` + `/workspace/review/hold/probe-re.mjs`·`probe-reload.mjs`·`probe-cx.mjs`·`probe-reset.mjs`·`ld-diff.mjs` 재사용. 비교 워크트리 `study114-wt-hold-ab`(ab68b05).
