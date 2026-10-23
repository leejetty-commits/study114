# 047 · 공부방 로그인 홈 — 프라임/베이직 점유

**작성:** 2026-09-24 (KST)  
**상태:** LOCKED — Cursor 구현 티켓  
**범위:** screenshot item ⑥만 포함. 046의 맵/상세검색 및 044와 커밋 분리  
**선행/분리:** 046과 별도 커밋, 044와 별도 커밋

---

## §0 한 줄

무과금 공부방의 프라임 오점유를 제거하고, 프라임 슬롯은 유료 점유만 허용하며 베이직 목록과 빈 프로모션 슬롯을 분리한다. 046과 커밋 분리.

## §1 재현

로그인 계정 **가능동베스트3**에서 확인한다.

- 홍보1: **의정부 가능동**
- 유료 프라임 상품: **미구매(무과금)**
- 현상: 무과금인데 로그인 홈에 프라임 카드/프라임 노출로 점유되고, 베이직으로만 나와야 하는 공부방이 프라임 자리를 차지한다.

## §2 원인 (코드)

- `preview/search-ui/src/search-provider-self.js`에서 `exposure_tier`를 prime으로 하드코딩하는 self 경로가 있다.
- 로그인 real path에서 `demo_prime_filled:1`이 demo/prime slot을 채우는 값으로 남아 있다.
- PHP `SearchService::resolveExposureTier`가 paid SKU/주문 entitlement가 아니라 `index + detail_completion`만으로 tier를 결정한다.
- mapper는 `position_sku`가 있으면 prime/pick 위치를 기대하고, 없으면 basic으로 해석한다. 현재 계약이 유료 점유를 보장하지 못해 무과금 self가 prime으로 올라간다.

## §3 잠금 UX

### 6.1 무과금 self

- 무과금 공부방은 **ONLY 베이직 목록**에 나온다.
- 무과금 공부방은 prime slot/card를 점유하지 않는다.

### 6.2 프라임 슬롯

- 빈 프라임 슬롯은 **empty promo card**로 남긴다.
- 실제 프라임/pick 점유는 paid `position_sku`와 유효한 order/entitlement가 있을 때만 가능하다.
- detail completion만으로 유료 entitlement를 대신하지 않는다.

### 6.3 하드코드/demo 제거

- 로그인된 real path에서 self prime hardcode를 제거한다.
- 로그인된 real path에서 `demo_prime_filled:1`로 prime을 채우지 않는다.
- guest demo seed 삭제는 이 티켓의 목표가 아니며, guest path는 기존 의도대로 보존한다.

## §4 구현 방향 (가설; Cursor가 코드 확인 후 확정)

1. `search-provider-self.js`에서 self payload가 `exposure_tier: prime`을 강제로 넣는 지점을 찾고 제거한다. tier는 서버/paid entitlement contract를 따른다.
2. `demo_prime_filled:1`의 적용 범위를 확인한다. 로그인 real path에서는 false/미적용이어야 하며, guest demo seed 동작은 함부로 삭제하지 않는다.
3. PHP `SearchService::resolveExposureTier`를 paid entitlement 중심으로 고친다. 유효한 paid `position_sku`와 order/상품 상태가 있을 때만 prime/pick을 반환하고, 아니면 basic을 반환한다.
4. `detail_completion`, `index`, `published`는 노출 가능성/완성도 조건일 수 있지만 paid SKU를 대체하는 prime 자격으로 사용하지 않는다.
5. mapper의 `position_sku` contract를 확인한다. paid prime/pick일 때만 SKU를 전달하고, 그 외에는 null/없음과 basic tier가 일치해야 한다.
6. empty prime slots가 empty promo card로 렌더링되는지 확인하되, 046 맵박스/검색 폼은 수정하지 않는다.
7. 실제 DB/order schema 이름은 기존 code contract를 확인해 사용한다. 추측으로 새 컬럼/스키마를 만들지 않는다.

## §5 Allowlist / 금지

### Allowlist

- `preview/search-ui/src/search-provider-self.js`
- `SearchService::resolveExposureTier`를 정의한 기존 PHP 파일 1개 및 그 메서드의 직접 mapper/DTO contract
- `demo_prime_filled`를 로그인 real path에 주입하는 최소 기존 fixture/route (필요 시)
- item ⑥의 기존 테스트/fixture 한정
- 문서: 이 티켓 파일, `docs/README.md`, 그리고 존재할 경우 044 status-only cross-reference 한 줄

### 금지

- `preview/search-ui/src/search-map.js`, `preview/home-ui/src/provider-home.js` 수정 (046 범위)
- 044 member box/locked text 수정
- guest demo seed 전면 삭제
- paid 없는 prime fallback, self prime hardcode, `demo_prime_filled:1` real-path 유지
- detail completion/index를 paid entitlement처럼 취급
- 무관한 schema migration, signup/auth WIP
- 043/044/046과 섞는 변경
- build/deploy, 특히 `build:dothome`, push, commit

## §6 함정

1. `exposure_tier=prime` 하드코드는 UI 표시값이 아니라 점유 결과를 왜곡할 수 있으므로 self real path에서 제거한다.
2. `demo_prime_filled:1`은 guest/demo와 로그인 real path를 분리해서 처리한다. guest demo 삭제로 우회하지 않는다.
3. `SearchService::resolveExposureTier`에서 `index + detail_completion`은 prime 결제 증명이 아니다.
4. `position_sku`가 없으면 mapper는 basic이어야 하며, 빈 문자열/임의 SKU를 만들어 prime처럼 보이게 하지 않는다.
5. paid order의 상태/기간/대상 공부방을 확인한다. 단순히 sku 문자열만 있으면 유효하다고 보지 않는다.
6. 빈 prime slot은 누락/에러 카드가 아니라 empty promo card여야 한다.
7. 046의 맵 count/지역/상세검색을 이 티켓에서 고치지 않는다.
8. 044가 홍보1/member box를 이미 seed했다면 중복 seed를 만들지 않는다.
9. PHP↔JS contract를 함께 확인하되, 직접 관련 없는 API/schema는 건드리지 않는다.
10. 완료 후 046/044 변경이 working tree에 섞이지 않았는지 확인한다.

## §7 Cursor 붙여넣기 블록

```text
# 047 · 공부방 로그인 홈 — 프라임/베이직 점유 (LOCKED)

## 목표
무과금 공부방이 로그인 홈에서 프라임 자리를 점유하는 오류를 제거한다.
이 티켓은 screenshot item ⑥만 구현한다.
046(맵박스·상세검색) 및 044(member box)와 별도 커밋이다.

## 재현 계정/현상
- 계정/공부방: 가능동베스트3
- 홍보1: 의정부 가능동
- 프라임 유료 상품: 미구매(무과금)
- 현재: 무과금인데 프라임 카드/프라임 slot 점유처럼 보임
- 기대: 무과금은 basic 목록에만, prime slot은 empty promo card

## 잠금 UX (반드시 지킬 것)
1. 무과금 공부방은 ONLY 베이직 목록에 나온다.
2. 무과금 공부방은 prime slot/card를 점유하지 않는다.
3. prime/pick 점유는 유효한 paid `position_sku` 및 해당 order/entitlement가 있을 때만 허용한다.
4. paid entitlement가 없으면 prime slot은 empty promo card다.
5. 로그인 real path에서 self prime hardcode를 제거한다.
6. 로그인 real path에서 `demo_prime_filled:1`로 prime을 채우지 않는다.
7. guest demo seed 삭제는 하지 않는다.
8. detail completion/index만으로 paid prime 자격을 만들지 않는다.

## 우선 확인할 파일/계약
- `preview/search-ui/src/search-provider-self.js`
- `exposure_tier` self hardcode
- `demo_prime_filled:1`의 로그인 real-path 주입 지점
- PHP `SearchService::resolveExposureTier`
- paid order/entitlement와 `position_sku` mapper/DTO contract

## 구현 지침
1. self real path의 `exposure_tier: prime` 하드코드를 제거하고 서버/paid contract 결과만 사용한다.
2. `demo_prime_filled:1`은 로그인 real path에 적용되지 않게 한다. guest demo path는 유지한다.
3. `SearchService::resolveExposureTier`는 유효한 paid position SKU + order/entitlement일 때만 prime/pick을 반환한다. 그 외는 basic이다.
4. `index`, `detail_completion`, `published`는 노출/완성도 조건이지 paid prime entitlement의 대체물이 아니다.
5. mapper는 paid prime/pick에만 `position_sku`를 내보내고, 없으면 basic과 일치시킨다.
6. empty prime slot은 empty promo card로 유지한다.
7. 실제 DB/order 계약을 읽고 최소 변경한다. 추측으로 schema를 추가하지 않는다.

## Allowlist
- `preview/search-ui/src/search-provider-self.js`
- `SearchService::resolveExposureTier` 정의 PHP 파일 1개
- 해당 메서드의 직접 mapper/DTO contract
- `demo_prime_filled` 로그인 real path fixture/route의 최소 파일
- item ⑥ 테스트/fixture
- 이 티켓 문서와 `docs/README.md`

## 절대 금지
- `search-map.js`, `provider-home.js` 수정 (046 범위)
- 044 member box/locked text 수정
- guest demo seed 전면 삭제
- paid 없는 prime fallback 또는 임의 position_sku 생성
- detail completion/index를 paid entitlement로 취급
- 무관한 schema migration, signup/auth WIP
- 043/044/046과 혼합
- `npm run build:dothome`, deploy, push, commit

## 함정
1. UI의 prime label만 바꾸지 말고 tier 결정 source를 고친다.
2. guest demo와 로그인 real path를 분리한다.
3. resolveExposureTier에서 index+detail_completion은 결제 증명이 아니다.
4. position_sku 없음/빈 문자열은 basic이어야 한다.
5. order 상태/기간/대상 공부방을 검증한다.
6. empty prime slot은 empty promo card다.
7. 046의 맵/상세검색은 수정하지 않는다.
8. 044 seed를 중복 생성하지 않는다.
9. PHP↔JS contract를 확인하되 무관한 API/schema를 건드리지 않는다.
10. working tree에서 044/046 혼입을 확인한다.

## Smoke / 완료 조건
- 가능동베스트3 무과금: basic 목록에만 존재
- 같은 계정: prime slot을 점유하지 않음
- 빈 prime slot: empty promo card
- 유효한 paid position_sku/order fixture: prime/pick 정상 점유
- detail completion만 있는 무과금: basic 유지
- guest demo: 기존 의도 유지
- `demo_prime_filled:1`이 로그인 real path를 채우지 않음
- mapper의 position_sku와 tier가 paid entitlement와 일치
- 046 맵/홈 파일 변경 없음
- push/commit/build:dothome 없음

## 결과 보고
변경 파일, paid/basic fixture별 smoke 결과, guest demo 보존, 046/044 미변경을 요약한다.
```
