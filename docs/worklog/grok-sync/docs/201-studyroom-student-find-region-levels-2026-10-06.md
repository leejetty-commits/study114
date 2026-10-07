# 201 · 공부방 학생찾기 지역 2단계(시·군·구 / 동·단지) 결정 (2026-10-06)

- 상태: **결정 기록(문서 정리만)**. 코드 변경·지시문 없음.
- 큐 위치: 보류 묶음 「26번 잔여 + 현재위치·지도·주소필터」에 편입 (docs/190). 현재 순서(158 재배포 → 159 → 학부모→학생 → 162 → 146~180) 변경 없음.
- 대체하는 잠금: [187](187-region-gu-policy-locked-2026-10-01.md) 21행 앞부분 「공부방 희망 학생 찾기 = 같은 동만(구로 넓히지 않음)」, [050](050-home-neighborhood-students-find-ticket.md) §0-2 「학생찾기 기본 = 홍보1 동네」.
- 코드 근거 기준: origin/main `1d48c2c` (읽기 전용 확인).

## 1. 결정 (종현)

범위: **공부방이 공부방 희망 학생을 찾을 때(학생찾기)**.

- 지역 필터는 2단계 중 선택:
  - **상위 1단계 = 시·군·구** (시·군·구는 같은 수준. 경기도 의정부시, ○○광역시 ○○구, 일반구 있는 시는 구, 군). 그 아래 동·읍·면·리·아파트단지 전부 포함(동 행의 sigungu_code 기준).
  - **하위 = 원래 등록 단위** (동·아파트단지).
- 예전 「동·단지 AND(같은 동만)」 잠금은 해제.
- 기본 목록(검색 전 하단 베이직카드) 기준: 홍보1 동 → **홍보1이 속한 시·군·구** 방향.

인용:
- t1453 (18:36): 「주소체계를 가입단계에서 분리해서 입력받을 수 없나? 경기도 의정부시, 광역시 구까지 1단계 즉 시구를 1단계, 2단계 행정동 또는 아파트단지... 이렇게 하면 검색필터를 잡기가 쉽잖아.」
- t1454: 「학생찾기에서 기본으로 밑에 깔리는 베이직카드의 수량이 적은데, 기준을 동이나 아파트단지로 하면 적을거 같아. 그러면 공부방이나 과외쌤의 1단계 필터를 가져와서, 시나 군 단위의 애들로 뿌려주면...」
- t1455: 「나중에 애들 수요가 많아지면 행정동이나, 아파트단지로 필터를 좁혀주더라도...」
- t1464: 시 아래 동, 군 아래 읍·면(리), 구 아래 동.
- t1466 (20:25): 「상위 단위를 시군구까지는 가능한 걸로 하고 하위는 원래 단위까지 할수 있는 것으로 하면되지? 이전에 동 단지까지 and 로 된걸 풀어주면...」
- t1467: 「그래 일단 문서정리를 해보고」

## 2. 미결 (결정 안 됨 — 임의로 정하지 않음)

1. 홈 「우리동네 학생」 탭(050 §0-1, 「검색 전 두 목록 같은 기준」 §0-3)도 시·군·구로 같이 바꿀지.
2. 과외쌤 쪽(과외 희망 = 구 id만, 187)과 과외쌤이 학생 볼 때 — 이번 범위 밖, 변경 없음.
3. 상세검색에서 1단계 기본 선택값(홍보1의 시·군·구로 미리 채울지).
4. 가입 단계 주소 입력 자체를 1·2단계로 나눌지(t1453) — 현재 공부방·공부방 희망 학생은 주소검색 1회로 두 단계를 같이 뽑음. 입력 방식 변경 결정 없음.
5. 「행정동」을 진짜 행정동 코드로 할지(카카오 우편번호에 hcode 없음 · 저장된 동은 대부분 법정동) — 하위 단위는 「원래 등록 단위」로 결정됐으므로 지금은 현행 유지.
6. 26번 잔여(구·라벨 검색 시 프라임/픽 티어 무필터, SearchService.php:1436-1447 roomTierScope)를 이 묶음에서 시·군·구 기준으로 같이 정할지.

## 3. 현재 코드 사실 (origin/main)

- 학생찾기 필터(공부방 진입): 희망 유형 기본 공부방(search-ui/src/search-find-surface.js:834-842). 희망 유형=공부방이면 희망 지역 = 「주소찾기」 읽기전용 칸 → 동 id(`f_preferred_studyroom_region_id`)만 (search-find-surface.js:1885-1897, 1655-1658). 시도→시→구 드롭다운은 희망 유형=과외일 때만(1874-1883) → 결과도 과외 희망 학생.
- 화면 상호 배제: 동 id가 있으면 `preferred_region_id` 삭제 (search-ui/src/search-api.js:65-83).
- 서버:
  - 동 정확 일치: `preferred_studyroom_region_id` → `s.preferred_studyroom_region_id = ?` (src/Search/SearchService.php:955-965, dongRegionId 1304-1325).
  - 시·군·구: `preferred_region_id`(is_selectable 행) → studentGuBaseWhere = `preferred_tutor_region_id = 구 OR preferred_studyroom_region_id IN (그 구 소속 동들)` (SearchService.php:966-970, 174-190). `preferred_lesson_type=study_room`과 함께 보내면 공부방 희망 학생 중 희망 동이 그 구 안에 있는 학생만.
  - 둘 같이 오면 오류 「희망 지역은 한 가지만」 (SearchService.php:962-963).
- 구 소속 동 계산: `LEFT(동.sigungu_code,5) = LEFT(구.official_code,5)`, unit_level='dong' (src/Region/RegionGuLink.php:90-112). 이름 비교 없음.
- 기본 목록(홈 우리동네 학생 = 학생찾기 진입 공유): 홍보1 동 id + `preferred_lesson_type=study_room`, limit 20 (preview/home-ui/src/study-room-home-seed.js:153-157, 198-204).
- 저장: 학생 `preferred_studyroom_region_id`(동)·`preferred_studyroom_complex_id`·`preferred_studyroom_region_basis`. 시·군·구 칸은 따로 없고 동 행의 sigungu_code로 유도 (RegionEnsure.php:39-46 = 카카오 bcode 앞 5자리). 단지는 자기 코드 없이 동 행 id에 묶임 (ComplexEnsure.php:16-43).
- 시·군·구 마스터: 072(unit_level·official_code·is_selectable) + 073 공식 행(선택 256).
- 매칭 정상 확인: 일반구 동(영통구 41117 = 073:131), 구 없는 시(의정부 41150, 073:136), 시의 읍·면(남양주 41360, 073:156), 군의 리(가평 41820, 073:180; 리 이름이 dong_name, bname1 미사용), 개발 시드 동(012_search_dev_seed.sql:14-16).

**→ 스키마 변경 없이 가능. 서버 경로 있음. 바꿀 곳은 화면 쪽.**

## 4. 변경 지점 (구현 시 — 지시문 아님)

1. 학생찾기 상세검색: 희망 유형=공부방일 때도 1단계 시·군·구 선택 제공 + 하위 동·단지(현행 주소찾기) 선택. 둘 중 하나만 보냄.
2. 시·군·구 선택 시 `preferred_region_id`(+`preferred_lesson_type=study_room`) 전송. search-api.js:65-83 배제 규칙은 「동 선택 시에만 동 id」로 유지.
3. 기본 목록: study-room-home-seed.js:198-204 요청을 홍보1 동 id → 홍보1 동이 속한 시·군·구 id로. (홈 탭까지 바꿀지는 미결 §2-1)

## 5. 발견 오류

- **A. 세종 코드 불일치 (확정)**: 선택 가능한 세종 행은 시도 단위 official_code 3600000000(073:125) → 앞 5자리 '36000'. 세종 동은 bcode 앞 5자리 '36110'(073:8 머리말의 3611000000). dongIdsUnderGu 불일치 → 세종 선택 시 공부방 희망 동 0건.
- **B. AddressRegionMatch 이름 폴백 (확정)**: 클라이언트가 region_id 없이 저장할 때 서버가 동 이름으로 기존 행 매칭(src/Region/AddressRegionMatch.php:23-99). 점수 10+시도 5=15로 통과(:75-96) → 시·군·구가 달라도 같은 시도 동명 동이 선택될 수 있음. 정확 이름이 없으면 LIKE 앞부분 일치(:46-56, 예: 역삼동→역삼1동). 사용처: BasicRegisterService.php:614, StudyRoomRegisterService.php:560·1117. 평소엔 화면이 먼저 확정해 region_id를 보내고(study-room-basic-form.js:628-667), 그 요청이 실패할 때만 이 경로.
- **C. 개편 지역 코드 (미확인)**: 073은 2026-07-01 공식 코드(전남광주 12xxx 073:46-73, 인천 새 구 :101-112, 화성 일반구 41591~41597 :170-174). 카카오 bcode가 옛 코드(광주 29xxx·전남 46xxx·인천 28110·화성 41590)를 주거나, 개편 전 만든 동 행이 운영 DB에 남아 있으면 어느 구에도 안 묶임.
- **D. 동명 리 병합 (미확인 영향)**: RegionEnsure findExisting가 이름(시도+시군구+동명)으로 먼저 찾음(RegionEnsure.php:154-176) → 같은 군 안 동명 리는 첫 행으로 합쳐짐. 구 매칭은 정상, 하위 단위 정확도만 영향.

## 6. 확인 항목 (구현 전)

1. 운영 DB: 동 행(unit_level='dong') sigungu_code 앞 5자리 분포 → 073 선택 행 official_code에 안 붙는 행 목록(세종·개편 지역·'00000'·시도+'000').
2. 운영 DB: 단지 기준 공부방 희망 학생에게 `preferred_studyroom_region_id`(단지 소속 동)가 함께 저장돼 있는지.
3. 카카오 우편번호가 개편 지역(인천·전남광주·화성)에서 새 bcode를 주는지 실제 검색으로 확인.

---
## 2026-10-07 추가 검토 — 「공부방찾기」(학생이 공부방을 찾음) 광역검색 × 프리미엄 (미확정, 종현 t1486~t1488)
- 종현 질문: 프리미엄은 행정동·단지 기준 3개, 픽은 개수 제한 없음. 시군구 광역검색을 허용하면 프리미엄이 다 튀어나옴. 광역 허용 vs 말단 필수? 과외쌤찾기는 원래 시군구 기준이라 범위 밖.
- 코드(1d48c2c): 공부방찾기 화면은 주소찾기(동·단지)만, 구 단독 검색 UI 없음(search-find-surface.js:1911-1921). 서버 구 경로는 있음(SearchService.php:492-508). 검색 결과 화면은 한 줄 목록·Prime/Pick 칸 없음(ssot/13:17, search-tier-render.js:343-348). 홈은 프리미엄 3칸(exposure-rules.js:51-64, 회전 없음)·픽 10개 세트 15분 회전.
- 26번 잔여 재확인: 구·라벨 검색이면 프리미엄·픽 판정 범위가 비어 다른 동 구독도 프리미엄으로 표시(SearchService.php:1497-1498, 1583-1617).
- 새로 찾은 오류(잠긴 정책과 어긋남, 라이브 미확인): 라벨 검색이 「…동」 한 단어를 부분 일치로 뽑아 「서울 강동구 천호동」→「강동」, 「서울 성동구 행당동」→「성동」으로 구 전체가 검색될 수 있음, 「대치동」은 대치1·2·4동까지(SearchService.php:1327-1378, node 재현).
- 잠금: 13장 「광역 확장 가능」(ssot/13:15, 127-131), 프리미엄 = 선택 단지·행정동 자리 3개(internal/65:22-23, 68:26·72), 공부방 Prime 3칸 고정·회전 없음(internal/29:19). 구 검색 때 프리미엄 표시 규칙은 잠금 없음.
- 선택지 A 말단 필수 / B 시군구 허용+구 검색 땐 프리미엄 표시 끔 / C 고정 개수 회전 / D 동별 묶음. 우동공과2 의견 = B(근거: 13장 광역 허용과 프리미엄 「그 동·단지 자리」 의미를 둘 다 지킴, 결제자 공정성). 종현 결정 대기. 보류 묶음 「26번 잔여 + 현재위치·지도·주소필터」 소속.
- 2026-10-07 03:1x 정정·재확인(우동공과2 직접 코드 확인, 1d48c2c, 종현 t1490 질의): 공부방찾기 탭(room)은 주소찾기 결과를 주소 DB id로 바꾸지 않고 카카오 글자 라벨(formatLocationDisplay → 「서울 강동구 천호동」, 단지는 「천호동 · 단지명」)을 그대로 보냄(search-find-surface.js:426-444·2670-2695, location-display.js:303-309, search-api.js promoteRegionLabelFilters → region_label). 학생 탭만 confirmStudyroomDong으로 동 id 확정. 서버는 라벨에서 첫 「…동」 토큰을 정규식으로 뽑아 동·구·시도 이름 LIKE %토큰% 부분일치(SearchService.php:1326-1378). 확정 오류: ① 「서울 강동구 천호동」→토큰 「강동」→강동구 전체, 「성동구 ○○동」→「성동」 동일 ② 단지 선택 「천호동 · 단지명」→토큰 「천호동」만 → 단지가 아니라 동 전체 검색. 철회: 「대치동이 대치1·2·4동까지 잡힌다」는 틀림(%대치동%은 대치1동에 안 걸림). 잠긴 방향(종현): 필터 값은 주소 DB의 행정동·단지 중 하나를 골라 그 값만 일치, DB에 없으면 오류.

---
## 2026-10-07 t1495 찾기 3종 주소 단위 통일 방향(종현 제안)

- 상태: **종현 제안 기록 + 코드 대조(읽기 전용)**. 코드 변경·지시문 없음. 큐 순서 변경 없음(보류 묶음 「26번 잔여 + 현재위치·지도·주소필터」 소속).
- 코드 기준: origin/main `1d48c2c` (`/workspace/study114-wt159`). jsdom 재현은 화면 그리기 + 폼 수집까지만(서버 호출 없음).

### A. 종현 원문 (t1495, 03:37 KST)
- 「좋아. 픽과 베이직은 페이지넘버링이 있으니 많아도 상관없지...」(앞 대화의 B안 — 구 검색 = 베이직+픽, 프리미엄은 동·단지 선택 때만 — 에 대한 답)
- 「검색시 주소단위를 통일을 해 보자는 것이 내 생각이야. 공부방찾기, 과외쌤찾기, 학생찾기 모두에 해당돼.」
- 「1단계 광역시도 - 선택가능. 그러나 이걸로는 검색이 안돼. 광역검색 차단.」
- 「2단계 시군구 - 선택가능. 과외쌤은 이미 이걸로 구축되어 있음. 이제 공부방도 광역검색으로 가능하게 한다. 2단계까지는 무조건 설정해야 검색 가능. 공부방에서는 행정동, 아파트단지로 할 것인지 분기가 들어가야 함.」
- 「3단계 행정동, 아파트단지 - 공부방에만 해당됨. 과외쌤에서는 역상되어서 선택이 안되게 해줌. 학생찾기에서는 열어줌. 학생찾기에서도 행정동, 아파트단지로 할 것인지 분기가 들어가야 함.」

### B. 현재 코드 사실 (화면별)

**공부방찾기 (room)**
- 지역 칸 = 「지역(동/단지)」 읽기전용 + 주소찾기 버튼 하나뿐. 시·도/시·군·구 칸 없음 (search-schema.js:27, search-find-surface.js:1911-1921).
- 보내는 값 = 카카오 주소 **글자**: canonicalFromKakao(426-444) → formatLocationDisplay 「서울 강동구 천호동」 / 단지는 「동 · 단지명」(location-display.js:303-309) → 숫자가 아니면 `region_label`(search-api.js:92-99).
- 서버: `region_id`(숫자)면 홍보칸 동 일치, `region_label`이면 첫 「…동」 토큰 LIKE %토큰% 를 동·구·시도 이름에 (SearchService.php:474-490, 1327-1379). 시·군·구 경로 `sigungu_region_id`(492-508)는 있으나 화면에서 보내는 곳은 학생 회원의 저장/선택 위치가 구 단위일 때뿐(search-find-surface.js:370-373).
- 단지 필터 없음: searchRooms에 complex 조건 없음(474-508), roomTierScope는 `complex_id`를 읽지만(1438) 화면이 보내지 않음.
- **지역 비우면 전국 검색**: guPickIncomplete가 room은 항상 통과(2375), 서버는 키가 있을 때만 지역 조건(474-508). jsdom: 지역칸 빈 폼 → 보내는 값 `{}`.
- 분기(행정동/단지) UI 없음. 카카오에서 아파트를 고르면 라벨만 「동 · 단지명」이 될 뿐, 서버 토큰은 앞의 동만(1333-1335).

**과외쌤찾기 (tutor)**
- 시·도 → 시·군(구·군) → 일반구 있으면 구, 3칸 드롭다운 (search-find-surface.js:1900-1909, region-cascade.js:244-297). **동 칸은 없음**(회색 표시도 없음).
- 시·도만 고르면 검색 막음 + 안내 (2373-2401). **아무것도 안 고르면 통과 → 전국 검색**(2373 주석, 서버 744-751은 값 있을 때만).
- 보내는 값 = 선택 단위 DB id `tutor_region_id` (search-api.js:100-105) → `is_selectable=1` 검사(1276-1296) → `tutor_regions.region_id = id`(745-751). 세종은 시·도 고르면 바로 완료(region-cascade.js:120-132, 073:125 `is_selectable=1` 시도행) — 187:2 「세종 1단계」와 같음.
- 티어 범위 = 고른 시·주력과목(1456-1469).

**학생찾기 (student)**
- 「희망 유형」(공부방/과외쌤) 분기 있음 (search-schema.js:70, search-find-surface.js:1750-1773). 기본: 공부방 로그인 → 공부방, 과외쌤 로그인 → 과외(834-853, 1444-1467).
- 희망=과외: 과외쌤찾기와 같은 3칸 드롭다운 → `preferred_region_id`(1874-1883). 시·도만 → 막음, 아무것도 안 고름 → 전국.
- 희망=공부방: 주소찾기 하나 → confirmStudyroomDong이 동 행 **DB id** 확정(614-634) → `preferred_studyroom_region_id` → 서버 동 정확 일치(955-967, 1304-1324). 시·군·구 칸 없음(1885-1897) — t1466 결정(§1) 미구현. 단지 필터 없음(단지는 동 id로 합쳐짐, 서버는 1060 조인만).
- 서버 구 경로: `preferred_region_id` → studentGuBaseWhere(과외 희망 구 = id OR 공부방 희망 동 ∈ 그 구) (966-970, 174-190).

**프리미엄·픽·베이직 / 페이지 번호**
- 검색 결과 화면 = 한 줄 목록, Prime/Pick 칸 없음 (ssot/13:17 잠금, search-tier-render.js:195-254·343-357). **1쪽 20개만 받고 페이지 번호 없음** (search-api.js:125-136 page 1·limit 20, search-find-surface.js:2491). 「검색 결과 N건」은 받은 개수(최대 20)이고 서버 total이 아님 (2500, 2367).
- 홈(티어 문법): 프라임 3칸 고정(공부방, exposure-render.js:693-723 · exposure-rules.js:51-64), 픽 페이지 번호(1119-1145), 베이직 페이지 번호(1180-1204). 게스트 찾기 첫 목록은 최대 200개 받아 페이지 번호(search-find-surface.js:125-126·141-153·183-201).
- 공부방 카드 티어 판정: `region_id`가 있을 때만 그 동 구독으로 한정, `region_label`·`sigungu_region_id` 검색이면 범위 없음 → 다른 동 프리미엄·픽도 그대로 표시 (650-655, 1436-1447, 1497-1498 — 26번 잔여).

**게스트**
- 서버가 비로그인 지역을 덮음: 공부방 = 대치동 동 id, 과외쌤·학생 = 강남구 id. 요청한 지역은 버림 (search.php:61-76, SearchService.php:133-163, RegionGuLink.php:16-28). → 공부방 3단계, 과외쌤·학생 2단계로 고정. 종현 방향(2단계 이상이면 검색)과 부딪히지 않음. 게스트는 단계를 바꿔도 결과가 안 바뀜(187:2·20 잠금 그대로).

### C. 대조표

| 화면 | 단계 | 현재 코드 | 종현 방향 | 차이 · 종류 |
|---|---|---|---|---|
| 공부방 | 1 시·도 | 칸 없음. 지역 비우면 전국 검색 | 고를 수 있음, 이것만으론 검색 불가 | 칸 신설 + 전국 차단 · **새 방향** (ssot/13:131 「구군 → 시/도」 광역 확장 잠금을 바꿈 → 13장 개정 필요) |
| 공부방 | 2 시·군·구 | 칸 없음(서버 경로만 있음 492-508). 필수 아님 | 고를 수 있음 · 필수 | 칸 신설 + 필수 · **새 방향** (ssot/13:15 「광역 확장 가능」과는 맞음) |
| 공부방 | 3 동·단지 | 주소찾기 글자 → LIKE 부분일치 | 열림 | **잠긴 정책과 어긋난 오류**(이미 확정, 위 03:1x 절): 「강동」「성동」→구 전체, 단지→동 전체. 잠금 = 13:35 「지역(동/단지)」·이 문서 78행 「DB 행정동·단지 값만 일치」 |
| 공부방 | 분기 동/단지 | 없음(카카오 결과에 따라 라벨만 바뀜, 서버 단지 조건 없음) | 분기 필요 | **새 방향**(분기 UI) + 단지 검색 자체가 안 되는 건 위 오류 ② |
| 공부방 | 노출 | 검색 결과 한 줄 목록·최대 20·페이지 번호 없음. 구·라벨 검색 때 다른 동 프리미엄 표시 | 구 검색 = 베이직+픽(페이지 번호), 프리미엄은 3단계 그 지역만 | ① 26번 잔여 = **잠긴 정책과 어긋난 오류**(internal/65:22 「선택 단지·행정동의 자리」, 68:26 재고 키 = 행정동\|단지) ② B 표시 규칙 = **새 방향**(구 검색 프리미엄 규칙 잠금 없음) ③ 「페이지 번호가 있다」는 홈·게스트 목록만 사실, 검색 결과 화면엔 없음 → 아래 질문 Q1 |
| 과외쌤 | 1 시·도 | 드롭다운 있음. 시·도만 → 막음. **아무것도 안 고르면 전국** | 이것만으론 검색 불가 | 「아무것도 안 고름」도 막아야 함 · **새 방향**(ssot/13:132 「복수 시 → 광역」 바꿈) |
| 과외쌤 | 2 시·군·구 | 드롭다운 있음, DB id 정확 일치 | 필수 | 일치. 필수화만 · **새 방향** |
| 과외쌤 | 3 동·단지 | 칸 자체 없음 | 회색(역상)으로 보이고 못 고름 | 비활성 칸 신설 · **새 방향**. 과외쌤 지역은 구 id만 저장(187:8·21)이라 고를 수 없게 두는 건 데이터와 맞음 |
| 학생 | 분기 희망 유형 | 있음(공부방/과외) | — | 그대로 |
| 학생 | 1 시·도 | 과외 희망: 드롭다운, 시·도만 막음, 없으면 전국 / 공부방 희망: 칸 없음, 동 없으면 전국 | 이것만으론 검색 불가 | 공부방 희망에 칸 신설 + 전국 차단 · **새 방향** |
| 학생 | 2 시·군·구 | 과외 희망: 있음 / 공부방 희망: 없음(서버 경로 966-970 있음) | 필수 | 공부방 희망 쪽 = **결정됨·미구현**(이 문서 §1, t1466). 필수화 = **새 방향** |
| 학생 | 3 동·단지 | 공부방 희망: 주소찾기 → 동 id 정확 일치. 단지는 동으로 합쳐짐. 과외 희망: 없음 | 열림 + 분기 | 동은 됨. 단지 분기 = **새 방향**. 과외 희망 학생에겐 동 값이 없음(187:21) → Q3 |
| 학생 | 공부방 로그인 첫 검색 | 화면 칸엔 홍보1 동이 보이는데 숨은 동 id가 비어 검색 누르면 `preferred_lesson_type`만 → 전국 (594-601·1885-1897·2416-2433, search-api.js:65-83; jsdom 재현: 「서울 강남구 논현동」 표시, 보낸 값 `{"preferred_lesson_type":"study_room"}`) | 2단계 이상 필수 | **잠긴 정책과 어긋난 오류(신규, 라이브 미확인)**: 050:15 「진입 기본 지역 = 홍보1, 검색 클릭 시 필터 결과로」와 어긋남 |

### D. 기타 확인
- 「역상」: 코드·문서 어디에도 없는 말. 비활성 관례는 있음 = `disabled`(학년 칸이 학교급 전엔 비활성, search-find-surface.js:1811·2733-2737, ssot/13:82 「비활성」). input-fill 규칙은 disabled 칸을 빼고 브라우저 기본 모양을 남김(input-fill.css:3·10-15). 단 docs/194:4 「값이 있는 칸 = 회색 #f3f4f6」이라 회색 비활성과 값 있는 칸이 비슷해 보일 수 있음 → 구현 때 모양 구분 필요(기본안: 기존 disabled 관례).
- 3단계 목록: 동 행은 주소찾기 때 생성(RegionEnsure.php:21-80), 073은 시·군·구까지만. 동 드롭다운을 만들 목록이 DB에 없음. 카카오 라벨은 법정동 우선(search-find-surface.js:428 `bname || hname`), 서버 동 행 이름은 행정동 우선(RegionEnsure.php:86-99) — §2-5 미결 그대로.
- 안내 문구 불일치(잠금 아님): GU_PICK_HINT 「선택이 끝나기 전에는 지역 조건 없이 검색합니다」(490)가 시·도만 골랐을 때 막을 때도 다시 뜸(2397-2400).
- 「검색 결과 N건」 = 받은 개수(최대 20) — 잠금 근거 없는 코드 결함. 구 단위 검색을 열면 20개 넘는 결과가 잘림.
- 세종: 시·도 행 하나가 선택 단위(073:125) → 2단계 완료로 처리됨(187:2 잠금). 학생 공부방 희망 세종 0건은 §5-A 오류 그대로.

### E. 종현 확인이 필요한 것 (미결)
- Q1. B안 적용 화면: 검색 결과 화면은 지금 한 줄 목록·1쪽 20개·페이지 번호 없음(ssot/13:17 잠금). ⓐ 검색 결과에도 픽·베이직 칸 + 페이지 번호(13장 17행 개정) / ⓑ 한 줄 목록 유지 + 페이지 번호만 추가.
- Q2. 구 검색 때 프리미엄 구독 공부방: 목록에서 빼는지 / 베이직(픽이 있으면 픽) 카드로 넣는지. (픽 판정은 그 구 안 동·단지 픽 구독 기준이 기본안)
- Q3. 학생찾기 3단계: 희망 유형=공부방일 때만 열고, 과외 희망일 땐 과외쌤찾기처럼 회색으로 둘지(과외 희망 학생은 구 id만 저장).
- Q4. 3단계 고르는 방식: 지금처럼 주소찾기(기본안) / 목록 선택(동 전체 목록을 새로 만들어야 함).
- B안 자체: t1495 「좋아. 픽과 베이직은…」을 B안 동의로 읽음. 확정 표기는 우동공과2 판단.

### 2026-10-07 03:46 KST 확정 기록 (종현 t1495)
- B안 확정: 「좋아. 픽과 베이직은 페이지넘버링이 있으니 많아도 상관없지」 — 공부방찾기 시·군·구 검색 = 베이직+픽, 프리미엄은 3단계(동·단지) 선택 시 그 지역 3개만.
- 찾기 3종 주소 단위 통일(1단계 시·도 검색 불가, 2단계 시·군·구 필수, 3단계 공부방·학생찾기 열림+행정동/단지 분기, 과외쌤 회색)은 종현 방향으로 기록. 보류 묶음 진행 시 지시서화.
- 제시 기본안(지적 없으면 동의 간주): 구 검색에서 프리미엄 구독 공부방은 베이직(픽 구독 시 픽)으로 노출 / 학생찾기 3단계는 공부방 희망만 열고 과외 희망은 회색 / 3단계 선택은 주소찾기 유지+DB id 정확 일치.
- 질문: 검색 결과 화면은 현재 페이지 번호 없음(최대 20개, ssot/13:17) → 페이지 번호 추가 여부.

### 2026-10-07 03:56 KST 종현 확정 (t1499)
- 「20개 넘는 것은 페이지넘버링 들어가는 것은 전체 통일」 — 찾기 검색 결과 화면 포함 전 목록 20개 초과 시 페이지 번호(ssot/13:17 한 줄 목록·20개 제한 개정 대상).
- 주소 단위 통일 정리본(t1499) 재확인: 1단계 시·도 검색 불가, 2단계 시·군·구 필수(공부방 광역 허용), 3단계 동·단지(공부방·학생찾기 열림+분기, 과외쌤 회색), 공부방찾기 프리미엄은 3단계 설정 시에만 노출.

### 2026-10-07 04:02 KST 종현 확정 (t1500) — 찾기 진입 기본값 정정
- 찾기 페이지 검색필터는 미리 채우지 않는다(내 제안 「홍보1·과외지역1 미리 채움」 철회).
- 진입 시 홍보1(공부방)·과외지역1(과외쌤)을 반영하는 것은 지도·현황박스(통계값)·현재위치만. 과외쌤은 지도 없음. 지도는 공부방찾기에서만 제공.
- 검색하면 그 결과값이 지도·현황박스·현재위치에 반영된다. 현재위치는 검색필터에 입력된 단계까지만 표시.
- 「홍보1 동이 보이는데 전국 검색」 오류는 이 방향(필터 비움+2단계 필수)으로 해소 대상.
- 2026-10-07 04:02 KST 종현(t1501): 「베이직카드는 모든 검색에서 기본으로 나와야 해.」 — 찾기 3종·모든 단계(2단계 시·군·구, 3단계 동·단지) 검색 결과에 베이직카드 기본 노출(공유 메모리 t1299u·t1302u와 같은 방향).
- 2026-10-07 04:12 KST 종현(t1502) 리마인드(잠긴 정책, 재질문 금지): 게스트=대치동/서울시 강남구 그대로, 게스트 카드는 블라인드. 학생 로그인 시 공부방찾기·과외쌤찾기 첫 지도·현황박스·현재위치 기준 = 본인 등록 희망지역(또는 공부방지역)의 시·군·구(라이브 정상, 예: 도봉구). 학생이 과외 선택 시 메인메뉴=과외쌤찾기·학생찾기, 공부방 선택 시=공부방찾기·학생찾기(정상).
- 2026-10-07 04:23 KST 종현(t1507) 정정 확정: 공부방찾기 시·군·구 광역검색 결과는 전체 베이직만(픽·프리미엄 모두 제외 — 입력항목 차이로 별도 알고리즘 필요, 픽만 노출은 형평성 문제). 이전 B안(베이직+픽) 대체. 과외쌤찾기는 시·군·구 기준이라 해당 없음. 공부방찾기 검색 시 현황박스(주소·통계치)와 지도도 검색결과 주소로 갱신.

### 2026-10-07 04:30 KST 종현 지시 (t1508, 「아주 중요」)
- 공부방 모드의 학생찾기에서만 해당: 희망 유형 필터 현재 3개(과외쌤·공부방·과외쌤+공부방) → 2개(과외쌤·공부방)만 유지, 「과외쌤+공부방」 걷어냄.
- 그 뒤 주소 분기는 t1495/t1499 주소 단위 통일 정책(2단계 시·군·구 필수, 3단계 행정동/단지 분기 — 공부방 희망만 열림, 과외 희망은 회색)을 그대로 붙임.
- 우동공과2가 코드 확인 후 의견 제출 예정.
- 2026-10-07 04:32 KST 종현(t1509·t1510 ㅇㅋ): 학생찾기 별도 주소 분기 불필요. 통일된 주소 단위를 그대로 붙이고, 희망 유형 「과외쌤」이면 3단계(행정동·단지) 회색 클릭 불가, 「공부방」이면 3단계 열림.

#### t1508 코드 확인 · 의견 (우동공과2, 2026-10-07 04:4x KST, origin/main `c51d7d2` = `/workspace/study114-wt159ab`, 읽기 전용)
- 결론: 「과외쌤+공부방」(`both`)은 **화면에만 있는 죽은 선택지**. 골라도 바로 이전 값으로 돌아가고, 검색에는 항상 `tutor` 또는 `study_room`만 감(유형 조건 없이 보내지 않음 → 「두 유형 섞임」 검색은 지금 없음). 걷어내는 것 자체는 위험이 거의 없음. 단 정의가 공용이라 **그대로 지우면 과외쌤 모드·게스트 화면에서도 같이 사라짐** → 공부방 모드만이면 역할 조건 한 줄 필요.

**1. 정의·렌더·보내는 값·기본값**
- 정의: `PREFERRED_LESSON_TYPE_LABELS = { tutor:'과외쌤', study_room:'공부방', both:'과외쌤+공부방' }` (preview/search-ui/src/search-enums.js:67-71) → `OPTION_LABELS.preferred_lesson_type`(:113). 필드: search-schema.js:70.
- 렌더: renderField select = 「선택」(빈값) + 위 3개 (search-find-surface.js:1754-1773). 선택값 = resolveStudentSearchHope(state)(1755-1760, 1642-1648). 학생 회원(parent)은 select 대신 숨은 값 고정(1750-1752).
- 기본값: 공부방 모드 = `study_room`(834-842, 1446-1455), 과외쌤 모드 = `tutor`(844-853, 1457-1467). 공부방 모드는 폼 값과 무관하게 `state.studentHopeType`을 덮어씀(2426-2428, 2430-2433, 2447-2453).
- jsdom 재현(화면+이벤트+검색 요청 가로채기): 공부방 모드 옵션 `(빈값)=선택, tutor=과외쌤, study_room=공부방, both=과외쌤+공부방`, 처음 `study_room` → `both` 고르면 화면이 `study_room`으로 되돌아감 → 화면을 `both`/빈값으로 둔 채 검색해도 보낸 값 `{"preferred_lesson_type":"study_room"}`. 과외쌤 모드도 같은 3개, 같은 결과(`tutor`).
- 원인: 변경 핸들러가 `tutor`/`study_room`만 받아 상태를 바꾸고 나머지는 재그리기만(2757-2776, 2773 주석 「both/빈값 … 희망유형 상태만 재렌더」는 실제 동작과 다름). 지역 입력축도 `both`면 과외(시) 축(1650-1659 주석 「과외쌤(·both)=시」).

**2. `both`가 서버까지 가는 유일한 길**
- 손으로 만든 URL `#/search/student?searched=1&f=<{"preferred_lesson_type":"both"}>` 복원 → runFindSearchWithFilters가 비어 있을 때만 채우므로(2447-2453) `both`가 그대로 감(jsdom: 공부방·과외쌤 모드 모두 `{"preferred_lesson_type":"both"}` 전송, 복원 경로 search-page.js:243-250).
- 서버: 값 검증 없이 `s.preferred_lesson_type = 'both'` (SearchService.php:949-951) → DB ENUM('study_room','tutor')(sql/schema/004_member_ssot_align.sql:70)이라 **0건**. 섞임이 아니라 빈 결과.
- 서버의 「값이 비면 전체」(949) 경로는 화면에서 안 탐: 공부방·과외쌤 모드는 항상 유형을 채움(위 1).

**3. 쓰이는 곳 (node_modules·dist 제외 rg)**
- `both`/「과외쌤+공부방」 정의는 search-enums.js:70 한 곳뿐. 주석 search-find-surface.js:1651·2773.
- 같은 select를 그리는 화면: 공부방 모드 학생찾기, **과외쌤 모드 학생찾기**(같은 renderField), **게스트 학생찾기**(select는 보이나 바꾸면 로그인 팝업, search-page.js:350-361). 학생 회원 = 숨은 값(1750-1752). 홈 「우리동네 학생」 = 폼 숨김(provider-home.js:175-181) → select 없음.
- 저장 키: `study114.studentFind.lastHopeType`·URL `?hope=`는 `tutor|study_room`만 받음(student-hope-type.js:7-40). 필터 저장 `study114-find-filters-v1`(682-702)은 검색 결과 필터라 화면에서 `both`가 들어갈 수 없음. URL `f`만 위 2처럼 통과.
- 가입 화면은 별도 정의 2개(「과외쌤 찾기」「공부방 찾기」, auth-ui/src/register-enums.js:3-6) → 영향 없음.
- 검증 스크립트: 3개 선택지·`both`를 검사하는 스크립트 없음. verify-student-branch-two-tabs.mjs:586은 학생 회원 학생찾기에 선택칸 없음만 봄.
- 문서: **ssot/13:182 「preferred_lesson_type = tutor · study_room · both」** ↔ ssot/04:170·DB 004:70 「ENUM('study_room','tutor')」 — 잠긴 문서끼리 어긋남(**잠긴 정책과 어긋난 오류**, 13장 쪽이 DB와 다름). 걷어내면 13:182도 고쳐야 함.

**4. 과외쌤 모드 학생찾기**
- 같은 컴포넌트·같은 3개(+「선택」). 기본 `tutor`, 유형 게이트 없음(844-853, 1457-1467; docs/107:14). `both`는 여기서도 죽은 선택지.
- 분리: renderField는 role을 받음(1740) → select 옵션을 `role === 'study_room'`일 때만 `both` 빼는 조건으로 공부방 모드만 바꿀 수 있음. search-enums.js:70을 지우면 과외쌤 모드·게스트에서도 사라짐(동작 변화는 없음, 보이는 옵션만).

**5. 2개로 줄인 뒤 기본값**
- 근거 있음: docs/050:152 「공부방 로그인 진입 시 희망유형 기본=공부방」, 050:169 「진입 기본은 역할 정합」, 059:36 수락 「희망유형 기본 공부방」, 107:14 「공부방 기본값 공부방 유지」. 코드도 같음(834-842).
- 걸림: t1500(이 문서 166행) 「찾기 페이지 검색필터는 미리 채우지 않는다」. 희망 유형까지 비우면 서버가 유형 조건 없이 전체를 찾음(949) → 「과외쌤+공부방」이 빈값으로 되살아남 + 지역 키 섞임 오류(962-963) 위험.
- 의견(기본안): **희망 유형만 「공부방」 미리 선택**(050:152 근거), 지역 등 나머지는 비움. 「선택」 빈 옵션도 같이 뺌(지금도 골라지지 않는 죽은 옵션). 대안: 유형도 비우고, 고르기 전엔 검색 막기.

**6. 주소 분기 붙일 때 걸리는 점**
- 과외 희망 2단계: 학생 저장값 = 선택 단위(구) id 하나뿐(가입 BasicRegisterService.php:266-270 `requireExplicitRegionId`+`assertSelectable`, 수정 시 반대 분기 값 버림 StudentHubRepository.php:253·268-287). 검색 `preferred_region_id` → is_selectable 검사(1276-1296) → studentGuBaseWhere의 `preferred_tutor_region_id = 구 id`(174-190) + `preferred_lesson_type='tutor'` → **DB id 정확 일치 됨**. 동 값 없음 확인 → 3단계 회색이 데이터와 맞음.
- 공부방 희망 2단계: 서버 경로 있음 — `preferred_region_id` + `study_room` → `preferred_studyroom_region_id IN (그 구 소속 동)`(966-970, RegionGuLink.php:90-112). 화면에 구 칸이 없음(1885-1897) → 새로 붙여야 함. 둘 다 보내면 서버 오류 「희망 지역은 한 가지만」(962-963) → 3단계를 고르면 동(또는 단지)만 보내고 구는 빼야 함(지금 search-api.js:78-82가 동이 있으면 구를 지움 — 재사용 가능). 고른 동이 고른 구 밖이면(주소찾기는 전국) 막는 검사 필요.
- 공부방 희망 3단계 행정동: 주소찾기 → confirmStudyroomDong → 동 id 정확 일치(614-634, 955-967) **됨**.
- 공부방 희망 3단계 단지: **안 됨**. 저장은 단지 id+소속 동 id 둘 다 있음(BasicRegisterService.php:250-265, StudentHubRepository.php:256-258), 그러나 검색에 단지 조건 없음(SearchService.php 949-970, 1060은 조인만), 화면도 단지 id를 확정하는 길이 없음(regions.php는 cities·ensure(동)만, :50·58). → 단지 분기 = 서버 조건 + 단지 id 확정 방법 신설 필요.
- 필터 비움과 충돌하는 지금 코드: 진입 때 홍보1·저장 지역 라벨로 지역칸 채움(859-878, 1850-1857), 유형을 바꾸면 저장된 지역으로 다시 채움(2766-2771). t1500에 맞춰 같이 걷어야 함.
- 2단계 필수 검사: 지금은 공부방 희망이면 검사를 건너뜀(guPickIncomplete 2376) → 공부방 희망도 「구 id 또는 동 id 없으면 검색 막기」로 바꿔야 함.
- 세종: 공부방 희망 + 세종 선택 시 0건(이 문서 §5-A 세종 코드 불일치) — 그대로 남음. 개편 지역 코드(§5-C)도 미확인 그대로.
- 앞선 오류(홍보1 동이 보이는데 전국 검색, 위 t1495 표 마지막 줄): ① 지역칸 미리 채움 제거(t1500) ② 공부방 희망도 2단계 필수 검사 ③ 유형이 비지 않음 — 이 셋이 같이 들어가면 **해소**. ①만 하면 「빈칸 → 전국」으로 남음.

**남는 질문 (확정 안 된 것만)**
- Q-t1508-1. 과외쌤 모드·게스트 학생찾기에도 같은 죽은 선택지가 있음. 지시대로 공부방 모드만 뺄지(기본안), 공용 정의에서 지워 전 모드에서 뺄지.
- Q-t1508-2. 희망 유형도 「필터 비움」 대상인지. 기본안 = 유형만 「공부방」 미리 선택(050:152), 지역 등은 비움.

## t1511 (2026-10-07 04:43 KST) 종현 확정
- 「다같이 빼」: 희망 유형 「과외쌤+공부방」(both) 옵션은 모든 모드에서 제거하고 과외쌤·공부방 2개만 남긴다.
- 3단계 아파트단지 검색: 공부방 가입 때 홍보지역을 아파트단지로 등록하면 단지를 추출하는 알고리즘이 이미 있고 지금도 그렇게 등록된다(종현). 검색은 새로 만들지 말고 이 알고리즘을 재사용한다. 조사 대상: 등록 쪽 단지 추출·저장 코드 → 찾기 필터 연결. 보류 묶음(지도·주소필터)에 편입.

## t1512 단지 추출·검색 코드 확인 (2026-10-07)
- 지시 t1512 (2026-10-07 KST) 종현: 「코드부터 한번 확인을 해봐.」 기준: origin/main c51d7d2 (live), 읽기만 함.

**1. 등록 쪽 단지 추출 (확인됨)**
- 입력 = 카카오(다음) 우편번호 결과뿐. 키워드 검색·아파트 API·단지 목록 없음(study-room-basic-form.js:6 「더미 단지 목록 없이」). 결과 정규화 kakao-postcode.js:106-120 → `buildingName`, `apartment(Y)`, sido·sigungu·sigunguCode·bcode·bname·hname.
- 화면 추출 규칙(3군데가 서로 다름):
  - 공부방 홍보1·2·3 슬롯(단지 선택 시): `complex_name = buildingName` 그대로, `complex_address = 도로명`(study-room-basic-form.js:498-505). apartment 플래그 안 봄.
  - 공부방 사업장(개설)주소: `apartment && buildingName`일 때만 단지(397-401).
  - 학생 공부방 희망(단지): buildingName에 「아파트|단지」 글자가 있어야만 받음(437-442, 450-476). 없으면 「다시 검색」 안내.
- 동 확정: 화면이 `/api/auth/regions.php action=ensure`(region-ensure.js:8-27 → regions.php:58-64 → RegionEnsure::fromKakao, RegionEnsure.php:21-84; hname 우선 = 행정동, 86-98) 호출해 region_id를 받아 슬롯에 넣음(study-room-basic-form.js:627-631, 664-666, 879-881).
- 단지 id 생성 = 서버 저장 때만. `ComplexEnsure::ensure(region_id, name, address)` — complexes에서 (region_id, name) 정확 일치 찾고 없으면 INSERT(ComplexEnsure.php:17-44). 화면이 단지 id를 미리 받는 길 없음.
  - 공부방 가입: BasicRegisterService.php:405-436 → 슬롯 normalizeSignupPromoSlots 684-752(단지명 없으면 주소문자열을 이름으로 717-719, ensure 721) → INSERT study_room_regions 560-578. 엔드포인트 public/api/auth/basic-register.php.
  - 공부방 등록·수정: StudyRoomRegisterService.php:543 → syncSavedRegions 1070-1184(region_id 없으면 AddressRegionMatch→RegionEnsure 1107-1127, 단지 ensure 1128-1137, INSERT 1152-1177). 사업장 단지 resolveComplexId 574-587. 엔드포인트 public/api/study-room/register.php.
  - 학생 가입(공부방 희망·단지): BasicRegisterService.php:250-265(region_id 필수 + 이름으로 ensure). 학생 허브 수정: StudentHubRepository.php:141-146, 296-323(applyNamedStudyRoomComplex). 엔드포인트 basic-register.php / registrations/students.php.
- 과외쌤: 단지 없음. 활동지역 = 선택 단위(시) id만(BasicRegisterService.php:266-270 학생 과외 희망, TutorRegisterService.php:530 assertSelectable; src/Tutor에 complex 없음).

**2. 데이터 (확인됨)**
- complexes(001_init.sql:46-60): id, region_id(소속 동 FK), name, address, is_active. **단지 코드·좌표 칼럼 없음.**
- (a) 공부방 홍보1·2·3: study_room_regions.region_id(동, 필수) + complex_id + region_basis_type('dong'|'complex')(001_init.sql:203-222, 037:112-138). 사업장은 study_rooms.region_id·complex_id·region_basis_type(별개).
- (b) 학생 희망: students.preferred_studyroom_region_id(동) + preferred_studyroom_complex_id + preferred_studyroom_region_basis(004:72·104, 037:53-82).
- 동은 단지와 같이 저장됨(둘 다). 시군구는 따로 칼럼 없음 → region_id → regions 행의 sigungu_code/sigungu_name·dong_code로 읽음(RegionEnsure.php:137-142).

**3. 검색 쪽 (확인됨)**
- 공부방찾기(room): 지역 조건 = region_id(정확) / region_label / sigungu_region_id(SearchService.php:473-508). 찾기 화면은 region_label만 보냄(search-find-surface.js:370-372, 944-946; search-api.js:96-98). 서버 라벨 매칭은 「·」 앞 토큰만 써서 regions 동·구·시 이름 LIKE(1327-1345, 1353-1379). **단지 조건 없음.**
  - 찾기 화면도 주소찾기를 이미 씀(2622, 2671) → `apartment && buildingName`이면 apartmentName 잡아 「동 · 단지」 라벨(426-444, location-display.js:195-203, 303-304). 그러나 검색은 「·」 앞 동 이름으로 LIKE → **단지를 골라도 그 동 이름 전체 결과**(단지 무시).
- 학생찾기 공부방 희망: 주소찾기 → confirmStudyroomDong → 동 id → `s.preferred_studyroom_region_id = 동 id` 정확 일치(search-find-surface.js:614-634, SearchService.php:955-967). 단지 고른 학생도 동 id가 있어 그 동 결과에 섞여 나옴. **단지 조건 없음.** 1055-1096은 표시용 조인만.
- Prime/Pick 티어: 서버가 `filters.complex_id`를 이미 받음 — roomTierScope(1436-1448) → positionScopeSql `region_basis_type='complex' AND complex_id=?`(1495-1531). 단 **배지(티어) 판정 범위만, 목록 행 거르기 아님.** 찾기 화면은 complex_id를 보내지 않음(search-ui에 complex 키 없음, 지역키 목록 217-225).
- 검색 API는 filters를 그대로 넘김(public/api/search/search.php:39-40, 86).
- 판정: 앞서 한 말 「단지 검색 자체가 안 된다」는 **결과로는 맞음**(단지로 좁히는 조건 0). 다만 「전혀 없다」는 부정확 — 화면 단지 추출(주소찾기 apartmentName)과 서버 티어 complex_id 범위는 이미 있음.

**4. 재사용에 필요한 최소 조각 (사실만)**
- 화면: 주소찾기·ensureRegionFromKakao는 이미 연결됨 → 그대로 재사용. 단지 이름 추출 규칙 하나로 맞춰야 함(지금 3개: 슬롯 buildingName 그대로 / 사업장·찾기 apartment=Y / 학생 「아파트|단지」 글자).
- 단지 id 확정 방법 없음: regions.php는 cities·ensure(동)만(:50, :58). ComplexEnsure는 없으면 INSERT라 검색에 쓰면 검색만으로 단지 행이 생김(ComplexEnsure.php:39-44). → 필요: 읽기 전용 조회(region_id + name → complexes.id, 없으면 0건) — 새 action 또는 search 필터(complex_name+region_id)를 서버가 SELECT로 해석.
- 서버 조건 신설: searchRooms에 `study_room_regions.complex_id = ?`(+region_basis_type='complex'), searchStudents에 `s.preferred_studyroom_complex_id = ?`. 공부방찾기 동 분기도 지금은 라벨 LIKE라 단지 때 소속 동 id 정확 일치가 없음.
- 티어: 같은 키를 `complex_id`로 보내면 roomTierScope가 그대로 받음(추가 서버 작업 없음, 공부방 목록만). 학생 목록 티어는 해당 없음.

**모르는 것 (확인 안 됨)**
- 운영 DB complexes 행 수·이름 상태(검색 때 고른 buildingName과 저장 name이 정확히 같아야 매칭됨. 슬롯은 단지명 없으면 주소문자열이 이름으로 저장됨 — StudyRoomRegisterService.php:1131-1133, BasicRegisterService.php:717-719).
- 같은 단지의 동 id 일치: 화면 경로는 둘 다 RegionEnsure(행정동 hname 우선). 서버 폴백 AddressRegionMatch(bname 기준, StudyRoomRegisterService.php:1117)로 저장된 행은 다른 동 id일 수 있음 — 운영 데이터 확인 필요.

## t1514 (2026-10-07 04:51 KST) 종현 확정
- 「단지 이름 규칙 통일 중요해. 근데 기존 db규칙은 죽여줘야 해.」 → 단지 이름 추출 규칙을 하나로 통일하고, 기존 세 규칙(홍보 슬롯 buildingName 그대로 / 사업장 apartment=Y+buildingName / 학생 희망 「아파트·단지」 포함)은 남기지 않고 제거한다. 보류 묶음(지도·주소필터) 작업 범위에 포함.

## t1515 단지 규칙 제거 영향 전체 검사 (2026-10-07)
- 결정 t1514 (2026-10-07 KST) 종현: 단지 이름 추출 규칙을 하나로 합치고 기존 3개 규칙 + 연결된 서버 폴백을 지운다. 지시 t1515: 지우면 다른 코드가 깨지거나 꼬이는 곳이 있는지 전체 검사.
- 기준 origin/main c51d7d2, 읽기만 함. [확인] = 코드로 확인, [추정] = 코드 흐름으로 본 추정.

**(A) 의존 목록**
1. 추출 규칙 본체·직접 호출 [확인]
   - 사업장: study-room-basic-form.js:397-401(apartment=Y+buildingName → region_basis_type·complex_name·complex_address). 이 값이 홍보1 자동 채움으로 넘어감: fillPromo1FromOpening 603-616(openingBasisOf 550-552 → 홍보1 기준) → 영향: **동작 바뀜**(홍보1 기본 기준이 같이 바뀜).
   - 홍보 슬롯: 498-505(buildingName 그대로). 호출 614, 662·666. → 지우면 단지 슬롯 이름 빈값 → 서버에서 슬롯 버려짐(아래 서버 폴백 참고) → **깨짐**(새 규칙으로 바꿔 끼워야 함).
   - 학생 희망: complexPlaceLabel 437-442, applyStudentHopeResult 445-477. 호출 875·881(bindStudentHopeRegion, 쓰는 곳: auth-ui signup-basic.js:525, home-ui student-reg/screens.js:485·634).
   - **목록에 없던 4번째 규칙**: 찾기 화면 canonicalFromKakao search-find-surface.js:427(apartment=Y+buildingName → apartmentName, 호출 2623·2672). 지금 단지명 표시 라벨만 만듦. 합치지 않으면 찾기에서 고른 단지명 ≠ 등록 단지명 → 나중 단지 검색 매칭 어긋남 [추정].
   - 카카오 결과 정규화 kakao-postcode.js:93·118-119: buildingName·apartment 필드 자체. apartment는 buildingExtra(가입 집주소 표시 signup-form.js:218)에도 씀 → 필드는 지우면 안 됨(**깨짐**).
   - 쓰이지 않는 코드: shared/address-region-match.js:45 matchRegion(호출 없음), home-ui student-reg/hope-region-masters.js(import 없음), study-room-ui form-collect.js:228 syncLocationFromForm(호출 없음) → **영향 없음**.
2. 서버 폴백 [확인]
   - StudyRoomRegisterService.php:1131-1133, BasicRegisterService.php:717-719(이름 없으면 주소를 이름으로) → 지우면 이름 빈 단지 슬롯은 complex_id 없음 → 1142-1145 / 723-725에서 슬롯 건너뜀 → 홍보1이면 「홍보지역 1(대표)을 선택해 주세요」(1180-1182 / 747-749) → **깨짐(헷갈리는 문구)**. 화면 검사 validateStudyRoomBasicFields 818-821은 주소만 있어도 통과시키므로 같이 고쳐야 함.
   - StudyRoomRegisterService.php:1117(AddressRegionMatch bname) → 지우면 화면 동 확정 실패 슬롯은 1122 RegionEnsure(행정동 우선)로 감 → 기존 bname 행 대신 새/다른 동 id가 될 수 있음 → **동작 바뀜**(오히려 찾기 화면과 같은 규칙). 같은 bname 패턴이 사업장에도 있음: StudyRoomRegisterService.php:560-567, BasicRegisterService.php:614-622(이번 결정 범위인지 미정).
   - 단지 주소 폴백 `complex_address ?? address_text`(584, 641, 716, 1130)는 이름이 아니라 complexes.address → 지도 중심이 이 값을 씀(아래 4) → 그대로 둬야 함.
   - 학생: registerStudent 250-265(이름 없으면 「아파트단지를 선택해 주세요」), applyNamedStudyRoomComplex StudentHubRepository.php:296-323, StudentBasicCompleteness.php:49-50 → 화면 규칙만 바뀌면 **영향 없음**.
   - 사업장: registerStudyRoom 427-434 — 단지인데 id 못 만들면 조용히 dong으로 내림 → 새 규칙에서 이름이 덜 잡히면 **조용히 동작 바뀜**.
3. 저장값을 다시 읽는 수정 흐름 [확인]
   - 공부방: hydrateRoom 1516-1543이 complex_id·complex_name·complex_address(address_text=단지주소)를 돌려줌 → 폼 hidden 224-230 → 저장 시 complex_id 그대로 → 1098·1128에서 ensure 안 함 → 재저장으로 단지 중복 생기지 않음. 다시 주소검색할 때만 id 비우고(502) ensure.
   - 학생: complex_id를 왕복하지 않음(render 840, read 858, screens.js:663-670) → 저장마다 이름으로 ensure(조회). 이름 = DB 단지명(hopeRegionValues 251-253) → 같은 행 찾음 → 중복 없음.
   - openingDiffersFromPromo1 570-572: 사업장·홍보1 단지명을 글자 비교 → 두 규칙이 한쪽만 바뀌면 「다르다」 안내가 잘못 뜸 [추정].
4. 라벨 「동 · 단지」 만들기·쪼개기 [확인] — 모두 DB 이름(c.name) 기준이라 규칙 삭제로 **영향 없음**. 단, 기존 「주소를 이름으로 저장한 행」은 계속 「동 · 서울특별시 …」로 보임.
   - 만들기: SearchService.php:321-335(카드), 1090-1094(학생 카드), StudyRoomHubRepository.php:209-224·231-244, ProviderTicketRepository.php:215·227, ProviderTicketService.php:282-283(이용권 라벨=단지명), StudyRoomPublicReadService.php:259-298, location-display.js:304·328, student-hope-regions.js:119-124, study-room-basic-form.js:239.
   - 쪼개기: SearchService.php:1333-1335(「·」 앞만 LIKE), location-display.js:113-129(「·」/「|」 뒤를 단지명으로), student-blind-teaser.js:59(게스트: 「·」 앞만), search-map.js:34(dong 없으면 apartmentName).
   - 지도 중심: study-room-home-seed.js:82-111이 단지 슬롯은 complex_address로 지오코딩, 「(주소 미등록)」이면 막음(97-100). ComplexEnsure.php:32도 이 표식을 봄.
5. 단지 id(Prime·Pick·구매) [확인] — 규칙 삭제 자체는 **영향 없음**. 단, 새 규칙이 기존과 다른 이름을 내면 다시 검색한 슬롯이 **새 complex_id**가 됨 → 아래가 기존 id에 묶여 있음:
   - 티어: roomTierScope 1436-1448 → positionScopeSql 1495-1531, 공부방 홈이 complex_id 보냄 study-room-home-seed.js:337-350.
   - 소유 검사: PrimeRegionScope.php:121-141(complex_id 홍보 행 있어야 함), 재고 키 'complex:'+id 82·221.
   - 구매 화면: plans/screens.js:105-123·995·1754·2078-2083, order-blocks.js:42-56·102-112·279-293, paid-api.js:53-54·115, ProviderCheckoutService.php:192, ProviderWaitlistRepository.php:65-73, ProviderTicketService.php:256-290.
   - 테이블: provider_position_subscriptions(065), study_room_exposure_assignments·waitlists(009, FK complexes).
   - → 이미 산 단지 Prime/Pick이 배지·소유 검사에서 빠질 수 있음 [추정].
6. 통계·사이트맵·박스 [확인]: region-stats.php에 단지 없음, 사이트맵 없음, 관리자 a28-screens.js:1170은 표시만 → **영향 없음**.
7. SQL [확인]: 뷰·트리거 없음. complexes에 (region_id,name) UNIQUE 없음(001_init.sql:46-60은 일반 인덱스만). 037은 시드 단지 INSERT + 「(주소 미등록) 이름」 백필.

**(B) 루프·재진입 위험**
- [확인] 무한 루프 없음: 주소 적용·refreshInputFill·kakao 콜백 어디에도 dispatchEvent 없음(input-fill.js, kakao-postcode.js). onRegion은 배열 push만(signup-basic.js:515-530, step-basic.js:277-281, embedded-panels.js:471). 공부방 재저장은 complex_id 왕복이라 ensure 반복 없음.
- [확인+추정] 늦은 응답 덮어쓰기: 주소 적용을 ensure 전·후 두 번 하는데 요청 순번 검사 없음 — 슬롯 662-666, 사업장 643-649, 학생 875-881, 찾기 confirmStudyroomDong 614-634. 주소검색을 빨리 두 번 하면 먼저 보낸 ensure 응답이 나중 선택을 덮을 수 있음(이미 있는 위험).
- [추정] 동시 저장 중복: ComplexEnsure는 SELECT 후 INSERT, UNIQUE 없음 → 같은 단지를 동시에 저장하면 2행. 이름 글자(띄어쓰기) 다르면 별도 행.
- [추정] 학생 희망 단지 행이 is_active=0이면 다음 저장 때 새 행 1번 생김(ComplexEnsure SELECT가 is_active=1만).

**(C) 고쳐야 할 검증 스크립트 [확인]**
- verify-study-room-basic-register-api.mjs:44 — StudyRoomRegisterService의 주석 「사업장/집주소($input)로 빈 홍보지역 2·3을 채우지 않음」(1108, bname 폴백 블록 안) 글자 검사 → 1107-1127 고치면 실패 가능.
- verify-student-mypage-hope-region.mjs: 364(`patch.complex_name = place`), 380-389(hopeRegionComplexNameMissing 문구·return), 403(bindStudentHopeRegion 안 `refreshInputFill(slotEl); opts.onApplied` 2번), 428-429(ComplexEnsure::ensure 호출), 238-262 S1(이름 '한신아파트'로 INSERT — 서버가 이름 기준 ensure 유지하면 통과).
- verify-input-fill-rule.mjs:852-856(study-room-basic-form.js를 HEAD로 되돌리는 변이 검사 — 파일 구조 바뀌면 기대값 다시 맞춰야 함), 208-210 카카오 가짜 결과(buildingName '', apartment 'N').
- 통과 예상(라벨·id만 씀): verify-region-save-rules.mjs:503·507, verify-map-center-by-role.mjs(complex_address·「(주소 미등록)」), verify-tutor-region-label.mjs:57·216(CONCAT " · " SQL 글자), verify-position-region-tier.php, verify-room-promo-region-match.php, verify-basic-exposure-gate.mjs, verify-student-branch-two-tabs.mjs, verify-student-request-text-exposure.php, verify-shop-page.mjs, verify-study-room-box-shape.mjs. e2e 스펙에는 단지 없음.

**(D) 통합 때 최소로 고칠 곳**
1. 새 공용 추출 함수 1개(shared) — 카카오 결과 → 단지명(없으면 빈값).
2. study-room-basic-form.js: 397-401, 437-442, 450-476, 498-505를 새 함수로 바꿈 + validateStudyRoomBasicFields 818-821(단지면 이름 필수).
3. search-find-surface.js:427도 같은 함수(4번째 규칙).
4. 학생 문구: student-reg/screens.js:495-511, auth-ui signup-basic.js:634-646, student-reg-copy.js:57-58 — 새 규칙에 맞는 실패 문구 하나로.
5. 서버: StudyRoomRegisterService.php:1131-1133·1117(+주석 1108), BasicRegisterService.php:717-719. 사업장 bname(560-567, 614-622)은 범위 결정 필요.
6. 스크립트: (C)의 3개.
- 건드리지 말 것: kakao-postcode.js 필드, complex_address 폴백(지도), 라벨 SQL·ComplexEnsure 조회 방식.

**(E) 운영 DB 확인 필요 (모름)**
- complexes 중 name = address(주소가 이름인 행) 수, 「(주소 미등록)」 행 수, 037 시드 단지가 운영에 있는지.
- (region_id, name) 중복, 같은 이름이 다른 region_id에 있는 수.
- study_room_regions: 기준 complex인데 complex_id NULL / dong인데 complex_id 있음. students도 같은 검사.
- complex_id가 걸린 진행 중 Prime/Pick·대기(provider_position_subscriptions, study_room_exposure_assignments·waitlists).
- regions에서 같은 시군구·동 이름이 코드만 다른 행(bcode vs 해시 코드) — 1117 제거 시 동 id 갈림 범위.

## t1519 (2026-10-07 05:00 KST) 종현 확정
- 사업장 주소의 bname(법정동) 예비 경로(StudyRoomRegisterService.php:560-567, BasicRegisterService.php:614-622)도 이번 단지 규칙 통일 때 같이 제거하고 행정동 기준으로 통일한다. 「ㅇㅋ 네 의견에 동의」. t1515 검사 결과의 챙길 5가지(찾기 규칙 포함 4개 통합, 단지 이름 필수 검사, 기존 단지 행 재사용·구독 확인, 검사 스크립트 3개, 늦은 응답 덮어쓰기 방지)도 범위에 포함.
