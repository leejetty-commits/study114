# 046 · 공부방 로그인 홈 — 맵박스·상세검색 제거

**작성:** 2026-09-24 (KST)  
**상태:** LOCKED — Cursor 구현 티켓  
**범위:** screenshot items ③·④ (3.1–3.5 + 4)만 포함. item ⑥ 프라임/베이직 점유는 별도 047.  
**선행/분리:** 044와 커밋 분리, 047과 커밋 분리

---

## §0 한 줄

맵 요약 박스 홍보1/실갯수/카피를 고정하고 홈 상세검색을 제거한다. 044와 커밋 분리.

## §1 재현

로그인 계정 **가능동베스트3**에서 확인한다.

- 홍보1: **의정부 가능동**
- 유료 프라임 상품: **미구매(무과금)**
- 현상: 로그인 공부방 홈에 프라임 카드가 보이고, 맵이 **대치동**, 맵 공부방 수가 **1**, 홈에 상세검색이 노출된다.

## §2 원인 (코드 가설)

### 3.1–3.5 맵/히어로 박스

- `preview/search-ui/src/search-map.js`의 `renderFloatMap`에서 `provider_room` 맵 데이터를 조합한다.
- 맵 지역이 `MOCK_REGIONS.room` 또는 self의 `location_label`에서 잡히므로, 홍보1(가능동)이 아니라 대치동 같은 guest/demo 지역이 로그인 self 맵에 남는다.
- 맵 숫자가 `items.length`로 계산되어 현재 페이지의 표시 행 수에 종속된다. 하단 베이직 목록의 source인 `getBasicPool()` 및 그 pagination total과 다른 값이 된다.
- `상태/지역` `dl`은 실제 사업자 상태/지역 지표가 아니라 feed mode flag를 표시한다. 따라서 「상태」와 그 mode-flag 쌍 자체가 잘못된 노출이다.
- `countNote`가 기존 카피와 숫자 의미를 다시 덧붙여 홍보1/실갯수와 충돌한다.

### 4 상세검색

- `preview/home-ui/src/provider-home.js`의 `hideSearchForm` 조건이 tutor에만 적용된다.
- `renderCompactFindForm`가 공부방 `homeSelf`에도 detail search를 렌더링하여, 이미 있는 「공부방찾기」와 중복된다.

## §3 잠금 UX

### 3.1 맵 동네

- 로그인 self 공부방 홈의 맵 동네는 **홍보1 = 가능동**이다.
- 비로그인 guest의 대치동 demo/seed 동작은 유지한다. guest demo seed를 삭제하거나 재설계하지 않는다.

### 3.2 보조 카피

- 맵 박스 보조 카피는 **「가능동 … 입니다」** 방향으로 고정한다.
- self의 홍보1/대표 지역을 사용하며 guest 문구와 섞지 않는다.

### 3.3 맵 숫자

- 숫자는 `items.length`가 아니라 **basic 목록 TOTAL**이어야 한다.
- 기준은 `getBasicPool().length` 또는 API가 제공하는 pagination total 중 실제 하단 베이직 목록과 동일한 값이다.
- page size 때문에 화면에 현재 행이 일부만 보여도 맵 숫자는 전체 total을 유지한다.

### 3.4 상태/지역 제거

- 맵 박스에서 「상태」를 **REMOVE**한다.
- mode-flag인 「상태/지역」 `dl` pair 전체도 **REMOVE**한다.
- 대체 지표를 넣지 않는다. 문의상태와 홍보지역은 044의 top member box 영역이며 맵 박스에 복제하지 않는다.

### 3.5 하단 목록 힌트

- 「N곳 하단목록과 동일」을 제거한다.
- 승인 카피를 그대로 사용한다: **「우리동네의 공부방은 하단의 '우동공과 베이직공부방' 목록입니다」**

### 4 홈 상세검색

- `study_room`의 로그인 `homeSelf`에서는 detail search form을 숨긴다. tutor와 대칭인 동작이어야 한다.
- search/find 화면 자체의 검색 폼까지 숨기지 않는다. `homeSelf`에 한정한다.

### 제외·후속

- 과외쌤 홈 홍보1 전역 = 후속 점검. 이 티켓은 공부방 홈만 다룬다.

## §4 구현 방향 (가설; Cursor가 코드 확인 후 확정)

1. `renderFloatMap`의 `provider_room` 분기를 먼저 확인하고, 로그인 self에서는 홍보1/primary region의 동네를 단일 source로 사용한다. `MOCK_REGIONS.room`은 guest 경로에만 남긴다.
2. 맵 박스의 count source를 하단 베이직 목록의 `getBasicPool`/pagination total과 연결한다. 화면 slice나 `items.length`를 total로 사용하지 않는다. existing API contract가 total을 제공하면 그 값을 우선하고, 없을 때만 동일 pool length를 쓴다.
3. 맵 박스 markup에서 `상태`와 `상태/지역` `dl`을 삭제하고, 그 자리에 새 field/metric을 추가하지 않는다. `countNote` 및 구 카피를 승인 문구로 교체한다.
4. self 데이터가 없거나 guest인 경로의 기존 fallback은 보존하되, self에 guest mock을 덮어쓰지 않도록 분기 순서를 확인한다.
5. `provider-home.js`의 `hideSearchForm`에 `study_room && homeSelf` 조건을 대칭적으로 추가하고, find/search route 및 tutor 동작은 건드리지 않는다.
6. item ⑥의 `exposure_tier`, `demo_prime_filled`, PHP `SearchService::resolveExposureTier`는 이 티켓에서 수정하지 않는다. 해당 작업은 047로 넘긴다.

## §5 Allowlist / 금지

### Allowlist

- `preview/search-ui/src/search-map.js`
- `preview/home-ui/src/provider-home.js`
- 위 두 파일이 실제로 import하는 **맵 박스/홈 검색의 최소 formatter 또는 fixture** (동일 동작을 입증할 때만)
- 필요 시 해당 UI의 기존 테스트/fixture 한정
- 문서: 이 티켓 파일, `docs/README.md`, 그리고 존재할 경우 044의 status-only cross-reference 한 줄

### 금지

- PHP `SearchService::resolveExposureTier`, `search-provider-self.js`, `position_sku`, `demo_prime_filled` 수정 (047 범위)
- 044 member box, 문의상태, 홍보지역 작업 또는 044 locked text 재작성
- 맵 라이브러리 교체/재작성, guest demo seed 삭제
- signup/auth WIP, DB schema/API 계약의 무관한 변경
- 프라임 슬롯/결제/주문 로직 변경
- build/deploy, 특히 `build:dothome`, push, commit
- 043/044/047과 섞는 변경

## §6 함정

1. `hub regionLabel`과 `location_label`은 같은 의미라고 가정하지 말고, self 맵은 홍보1/primary region source를 확인한다.
2. guest 대치동 demo는 유지 대상이다. 로그인 self에만 guest demo가 누수되지 않게 한다.
3. `count !== items.length`: 현재 page rows와 basic 목록 total을 구분한다.
4. `상태/지역`은 실제 상태/지역 field가 아니라 feed mode flag다. 제거 후 비슷한 이름의 대체 field를 만들지 않는다.
5. self preview는 find/search route에도 쓰일 수 있다. detail search를 숨길 대상은 `study_room homeSelf`뿐이다.
6. PHP↔JS contract를 item ⑥ 작업과 섞지 않는다.
7. `demo_prime_filled:1`은 047에서 다룬다. 046에서 prime card 노출을 고치려 하지 않는다.
8. pagination total은 하단 베이직 목록과 맵이 같은 source를 사용해야 한다.
9. 044가 이미 홍보1을 seed했다면 중복 seed를 만들지 말고 기존 값/contract를 재사용한다.
10. 완료 후 047, 044 변경이 working tree에 섞이지 않았는지 확인한다.

## §7 Cursor 붙여넣기 블록

```text
# 046 · 공부방 로그인 홈 — 맵박스·상세검색 제거 (LOCKED)

## 목표
로그인 공부방 homeSelf의 맵/히어로 박스와 상세검색 중복 노출을 고친다.
이 티켓은 screenshot items ③·④(3.1–3.5 + 4)만 구현한다.
item ⑥ 프라임/베이직 점유는 별도 티켓 047이며 절대 섞지 않는다.
044 member box와도 별도 커밋이다.

## 재현 계정/현상
- 계정/공부방: 가능동베스트3
- 홍보1: 의정부 가능동
- 프라임 유료 상품: 미구매(무과금)
- 로그인 홈에서 맵이 대치동으로 보임
- 맵 공부방 수가 1로 보임
- 하단 basic 목록 total과 맵 숫자가 다를 수 있음
- detail search가 공부방찾기와 중복 노출됨

## 잠금 UX (반드시 지킬 것)
1. 로그인 self 맵 동네는 홍보1(가능동)이다. guest 대치동 demo는 유지한다.
2. 보조 카피는 「가능동 … 입니다」 방향이다.
3. 맵 숫자는 `items.length`가 아니다. 하단 베이직 목록의 전체 total, 즉 `getBasicPool().length` 또는 동일 API pagination total이어야 한다. page size로 잘린 visible rows를 세지 않는다.
4. 맵 박스의 「상태」를 제거한다. mode-flag인 「상태/지역」 dl pair도 통째로 제거한다. 대체 field/metric을 추가하지 않는다. 문의상태와 홍보지역은 044 top member box 영역이다.
5. 「N곳 하단목록과 동일」은 제거하고 아래 승인 문구를 사용한다.
   「우리동네의 공부방은 하단의 '우동공과 베이직공부방' 목록입니다」
6. `study_room` 로그인 `homeSelf`에서는 detail search form을 숨긴다. tutor와 대칭이지만 search/find 화면의 폼까지 숨기지 않는다.
후속 제외: 과외쌤 홈 홍보1 전역 = 후속 점검. 이 티켓은 공부방 홈만 다룬다.

## 우선 확인할 파일/경로
- route: study_room login home / `homeSelf`
- `preview/search-ui/src/search-map.js` — `renderFloatMap`, `provider_room`
- `preview/home-ui/src/provider-home.js` — `hideSearchForm`, `renderCompactFindForm`
- `MOCK_REGIONS.room`, self `location_label`, `hub regionLabel`
- `getBasicPool`, pagination total, `items.length`, `countNote`

## 구현 지침
1. `renderFloatMap`에서 self와 guest source를 분리한다. self는 홍보1/primary region, guest는 기존 demo fallback.
2. 맵 count는 하단 basic list와 같은 pool/total source를 사용한다. `items.length`를 total로 쓰지 않는다.
3. 맵 markup에서 「상태」 및 「상태/지역」 dl pair를 삭제하고, 승인 카피 외 새 metric은 추가하지 않는다.
4. `provider-home.js`에서 `study_room && homeSelf`일 때만 compact/detail search를 숨긴다. tutor와 기존 find/search route를 회귀시키지 않는다.
5. 기존 API/fixture contract를 확인하고 최소 변경만 한다.

## Allowlist
- `preview/search-ui/src/search-map.js`
- `preview/home-ui/src/provider-home.js`
- 위 파일이 직접 사용하는 최소 맵 formatter/fixture/test만 필요 시
- 이 티켓 문서와 `docs/README.md`

## 절대 금지
- `search-provider-self.js`, `exposure_tier`, `demo_prime_filled`, `position_sku`, PHP `SearchService::resolveExposureTier` 수정 (047 범위)
- 044 member box/locked text 수정
- guest demo seed 삭제, 맵 라이브러리 rewrite
- signup/auth WIP, schema/API 무관 변경
- 043/044/047 작업과 혼합
- `npm run build:dothome`, deploy, push, commit

## 함정
1. hub regionLabel과 self location_label을 임의로 우선하지 말고 홍보1 source를 확인한다.
2. guest 대치동 demo를 삭제하지 않는다.
3. count와 visible items를 혼동하지 않는다.
4. 상태/지역 mode flag를 다른 이름의 지표로 되살리지 않는다.
5. self preview가 find에도 쓰일 수 있으므로 homeSelf 범위만 숨긴다.
6. pagination total을 맵/하단이 공유해야 한다.
7. `demo_prime_filled:1`은 047에서만 처리한다.
8. 완료 뒤 working tree가 044/047과 섞이지 않았는지 확인한다.

## Smoke / 완료 조건
- 로그인 가능동베스트3: 맵 동네가 가능동, 카피가 「가능동 … 입니다」
- guest: 기존 대치동 demo 유지
- 맵 count === 하단 베이직 목록 전체 total; page size와 무관
- 맵에 「상태」 및 「상태/지역」 dl이 없음
- 승인 힌트 문구가 정확히 표시됨
- study_room homeSelf에서 detail search 없음
- tutor home과 search/find route의 검색 동작은 회귀 없음
- item ⑥ 파일/PHP 변경 없음
- push/commit/build:dothome 없음

## 결과 보고
변경 파일, smoke 결과, 그리고 047로 넘긴 item ⑥ 미변경을 요약한다.
```


