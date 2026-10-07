# 046 · 공부방 로그인 홈 — 맵박스(3)·상세검색 제거(4)

- 작성일: 2026-09-24 (KST)
- 출처: 종현 추가 오류 3·4 · 3.4 「상태」제거 확정
- 선행: [044](044-studyroom-home-promo1-memberbox-ticket.md) 홍보1 시드(가능하면 044 먼저)
- 후속: [047](047-studyroom-home-prime-basic-occupancy-ticket.md) 프라임/베이직 점유(6)
- 대칭: 메뉴 공부방찾기 위치·맵 = [051](051-studyroom-find-promo1-mapbox-ticket.md) (046 맵 컴포넌트 공유)
- 상태: **수락** → [052](052-studyroom-home-mapbox-046-acceptance.md) · push/`build:dothome` **금지**
- 병행: 044·047·043과 **커밋 섞지 말 것**

---

## 0. 한 줄

공부방 로그인 홈의 **맵 요약 박스**를 홍보1(가능동)·실베이직 갯수·카피로 고치고, 홈에 있는 **상세검색 폼을 제거**한다. 프라임 오점유(6)는 **047**.

---

## 1. 재현

- 역할: 공부방 로그인 · 방명 **가능동베스트3** · 홍보1 **의정부 가능동**
- 맵 박스: 동 「대치동」·카피 고정문구·「공부방 1」·「상태/지역」·「N곳 하단목록과 동일」
- 홈에 **상세검색** 폼이 공부방찾기와 동일하게 노출 (과외 홈은 이미 숨김)

---

## 2. 원인 (코드)

| # | 증상 | 원인 |
|---|------|------|
| 3.1 | 대치동 | `resolveActiveRegionLabel` room 폴백 `MOCK_REGIONS.room` · self `location_label` 시드 · 홍보1 미시드(044와 동일 함정) |
| 3.2 | 카피 | `search-map.js` `provider_room` sub 고정: 「검색·지역 결과가 반영된 공부방 현황입니다」 |
| 3.3 | 공부방 1 | count = `items.length`(프라임 포함). 베이직 `getBasicPool` total과 불일치 가능 |
| 3.4 | 상태/지역 | `<dt>상태</dt>` = 피드 모드(`검색`\|`지역`) — 상품 상태 아님 |
| 3.5 | 하단목록과 동일 | `countNote = \`${n}곳 · 하단 목록과 동일\`` |
| 4 | 상세검색 | `provider-home.js` `hideSearchForm`이 **과외 homeSelf만** true. 공부방은 `renderCompactFindForm` 노출 |

컴포넌트: `renderSearchMapBlock` → `renderFloatMap` (`bannerStyle: 'provider_room'`) · `preview/search-ui/src/search-map.js`  
홈: `provider-home.js` → `renderCompactFindForm`

---

## 3. 목표 UX (잠금)

### 3-A. 맵 요약 박스 (③)

| # | 요구 |
|---|------|
| 3.1 | 동 라벨 = **홍보1** (예: 가능동 / 의정부 가능동 표시 규칙과 044 SSOT 동일). 게스트 대치동 데모 **유지** |
| 3.2 | sub 카피 = 「{홍보1동} … 입니다」형태 (대치·검색결과 고정문구 금지) |
| 3.3 | 「공부방 N」= **우동공과 베이직공부방 목록 total** (`getBasicPool` length / 페이지네이션 total). 화면 카드 수(페이지 size)와 달라도 **전체 N은 동일**. `items.length`(프라임 포함) 금지 |
| 3.4 | **「상태」칸 제거**. status/지역 dl **통째 제거**. 대체 필드 넣지 말 것(문의·홍보지역은 상단 멤버박스) |
| 3.5 | 「N곳 · 하단 목록과 동일」**제거**. 안내: 「우리동네의 공부방은 하단의 '우동공과 베이직공부방' 목록입니다」 |

### 3-B. 상세검색 제거 (④)

공부방 `homeSelf`에서도 `hideSearchForm: true` (과외와 대칭).  
맵·프라임/픽/베이직 티어 블록은 **유지**.

### 3-C. 제외

- ⑥ 프라임/베이직 점유 → **047**
- 044 멤버박스·배지·조회
- 과외쌤 홈 홍보1 전역 → **후속 점검** (이번 티켓 금지)
- 지도 라이브러리 교체 · 게스트 대치 시드 전면 삭제
- push / `build:dothome` · 043/044/047 커밋 혼합

---

## 4. 구현 방향 (가설 · Cursor가 검증)

1. `search-map.js` `renderFloatMap` `provider_room`: dong/sub/count/countNote/상태dl 수정.
2. count 소스는 베이직 pool total과 동일 함수/필드 공유.
3. `provider-home.js` `renderProviderHomeBody`: `role === 'study_room' && homeSelf`에도 hideSearchForm.
4. 홍보1 라벨이 find state에 없으면 044 시드를 **재사용·의존** (개설·hub `region_label` 금지).

---

## 5. Allowlist (예상 · 작업 전 확정 보고)

```
preview/search-ui/src/search-map.js
preview/home-ui/src/provider-home.js
preview/search-ui/src/search-find-surface.js   # hide/seed 최소만
(+ 044와 공유 시) 홍보1 → activeRegionLabel 헬퍼만
```

**금지:** `SearchService.php` 티어, `demo_prime_filled`, self `exposure_tier` 프라임 하드코드(→047), auth/signup WIP, exposure 대치 시드 전면 삭제.

---

## 6. 스모크

공부방 로그인(가능동베스트3 / 홍보1=의정부 가능동), **044 반영 가정**:

1. 맵 동 = 가능동(홍보1). 대치동 **0**
2. 카피 「가능동 … 입니다」
3. 「상태」·「지역」모드 dl **0**
4. 「하단 목록과 동일」문구 **0**. 3.5 안내 문구 존재
5. 홈 **상세검색** 폼 **0**. 공부방찾기에는 상세검색 **유지**
6. 맵 「공부방 N」= 하단 베이직 목록 **total**(페이지 total).  
   **주의:** 047 전이면 무과금이 프라임에 남아 N이 어긋날 수 있음 → 보고에 명시. 권장 순서 **044 → 046 → 047**
7. 게스트 홈 대치동 데모 유지

---

## 7. Cursor 붙여넣기 블록

```
[티켓 046 · 공부방 홈 맵박스(3)·상세검색 제거(4)]

범위: 스크린샷 3·4만. 6(프라임)=047. 044 멤버박스 금지.
push / build:dothome / 043·044·047 커밋 혼합 금지. 로컬만.
권장 순서: 044 → 046 → 047.

재현: 가능동베스트3 / 홍보1 의정부 가능동.
맵: 대치동·고정카피·공부방1·상태/지역·하단목록과동일.
홈: 상세검색 폼 노출(과외는 숨김).

원인:
- search-map.js provider_room: MOCK/시드 대치, sub고정, count=items.length, 상태=모드플래그, countNote
- provider-home.js hideSearchForm 과외만

해야 할 일:
1) 맵 동=홍보1(가능동). 게스트 대치 유지. hub region_label(개설우선) 금지.
2) 카피 「가능동 … 입니다」
3) 공부방 N = 베이직목록 total(getBasicPool/페이지 total). items.length 금지.
4) 「상태」및 status/지역 dl 통째 제거. 대체 필드 넣지 말 것.
5) 「N곳·하단목록과동일」제거 → 「우리동네의 공부방은 하단의 '우동공과 베이직공부방' 목록입니다」
6) 공부방 homeSelf hideSearchForm true(과외 대칭). 맵·티어 목록 유지.

함정: 047 전 count 스모크 어긋남 가능→보고. 과외쌤 홍보1 전역=후속(이번 금지).

스모크: 동=가능동 / 상태0 / 상세검색홈0 / 찾기상세검색유지 / 게스트대치유지.
보고: 파일목록·N계산식·044의존·제외(6).
```
