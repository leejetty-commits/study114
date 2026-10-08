# 047 · 공부방 로그인 홈 — 프라임/베이직 점유(6)

- 작성일: 2026-09-24 (KST)
- 출처: 종현 추가 오류 6 · 무과금인데 프라임 카드
- 선행: [044](044-studyroom-home-promo1-memberbox-ticket.md) · [046](046-studyroom-home-mapbox-detailsearch-ticket.md) (권장 순서 044→046→047)
- 상태: **로컬 수락** → [055](055-studyroom-home-047-acceptance.md) (로컬만 · push/`build:dothome` **금지**)
- 병행: 044·046·043과 **커밋 섞지 말 것**

---

## 0. 한 줄

유료 상품을 안 산 공부방이 **프라임 카드**에 걸리면 안 된다. 무과금은 **하단 우동공과 베이직공부방**에만. 프라임 빈칸은 빈 홍보카드.

---

## 1. 재현

- 공부방 로그인 · **가능동베스트3** · 유료(프라임/픽) **미구매**
- 홈 프라임 슬롯에 자기 방 카드 노출
- 기대: 프라임 = 빈 홍보(EMPTY) · 자기 방 = 베이직 목록만

---

## 2. 원인 (코드)

| 경로 | 원인 |
|------|------|
| Preview self | `search-provider-self.js` `PREVIEW_OWN_STUDY_ROOM_ID=1` + seed → **`exposure_tier: 'prime'` 하드코드**. `getRegionFeed`가 self면 region pool 스킵 |
| 데모 채움 | `getPrimeOccupied` / `demo_prime_filled` default **1** (`runtime-config.js`) — explicit prime 없으면 published 앞에서 채움 |
| 서버 Search | `SearchService::resolveExposureTier`: `index < 3 && detail_completion_status === 'expanded_complete'` → prime. **유료 position/order 미참조** |
| 프론트 계약 | `search-exposure-mapper.js`: `position_sku`/`sku` 없으면 **basic**. PHP·self가 계약을 깨뜨림 |

---

## 3. 목표 UX (잠금)

1. **무과금** 공부방 → **베이직만**. 프라임·픽 카드에 자기 방 **0**.
2. 프라임 슬롯에 유료 점유 없으면 → **빈 홍보카드** (`renderEmptyPrimePromo` 등 기존 EMPTY).
3. 프라임/픽 부여 = **실 유료 entitlement** (`position_sku` / active paid order). 인덱스·상세완료·self 하드코드·로그인 경로 `demo_prime_filled` **금지**.
4. 게스트 데모 채움은 **게스트만** (로그인 실데이터 경로 0).

### 제외

- 046 맵박스·상세검색
- 044 멤버박스
- 과외쌤 홍보1 전역(후속)
- SKU/결제 UI 신설 · 가격표 개편
- push / `build:dothome`

---

## 4. 구현 방향 (가설 · Cursor가 검증)

1. `getProviderSelfFeed`: tier = 실 entitlement/sku. 없으면 `basic`. id=1 시드 제거 → 로그인 room id (044와 충돌 시 044 결과 재사용).
2. `SearchService::resolveExposureTier`: 유료 점유 기준. 인덱스 규칙 삭제.
3. `demo_prime_filled`: 로그인/실데이터 경로 0 또는 guest-only.
4. JS mapper 계약과 PHP 정렬 확인.

---

## 5. Allowlist (예상)

```
preview/search-ui/src/search-provider-self.js
preview/home-ui/src/exposure-rules.js
preview/home-ui/src/plans/runtime-config.js
preview/search-ui/src/search-exposure-mapper.js   # 계약 확인·최소
src/Search/SearchService.php                     # resolveExposureTier
(+ 필요 최소) paid order/sku 조회 헬퍼 기존 재사용
```

**금지:** 046 맵카피, 상세검색 hide, signup WIP, 게스트 시드 전면 삭제, 044 멤버박스 재작업.

---

## 6. 스모크

가능동베스트3 · 유료 미구매 · 홍보1 가능동:

1. 프라임 슬롯에 자기 방 **0** · EMPTY 홍보 또는 빈 슬롯
2. 베이직 목록에 자기 방 **1+**
3. 맵 공부방 N(046 후) = 베이직 total과 일치
4. (가능하면) 유료 프라임 점유 계정/시드로 프라임 1칸 점유 스모크 분리 보고
5. 게스트 홈 데모 프라임 채움 동작 유지 여부 보고

---

## 7. Cursor 붙여넣기 블록

```
[티켓 047 · 공부방 홈 프라임/베이직 점유(6)]

범위: 스크린샷 6만. 3·4=046. 044 멤버박스 금지.
push / build:dothome / 043·044·046 커밋 혼합 금지. 로컬만.
권장 순서: 044 → 046 → 047.

재현: 가능동베스트3 · 유료 미구매인데 프라임 카드 노출.
기대: 프라임=EMPTY · 자기방=베이직만.

원인(확정):
- search-provider-self.js self feed exposure_tier:'prime' 하드코드 + id=1
- demo_prime_filled:1 로그인 경로 채움
- SearchService::resolveExposureTier 인덱스+상세완료 → prime (결제 무시)
- mapper는 sku 없으면 basic — 서버/self가 계약 파괴

해야 할 일:
1) self tier = 실 position_sku/유료 order. 없으면 basic. id=1 시드 제거→로그인 room.
2) PHP resolveExposureTier = 유료 점유만. 인덱스 규칙 삭제.
3) demo_prime_filled 로그인/실데이터 0 또는 guest-only.
4) 무과금 → 프라임0 · 베이직1+ · EMPTY 프라임 홍보.

함정: 044 self id 교체와 겹치면 재사용. 게스트 데모 유지. 046 count는 베이직 total.

스모크: 무과금 프라임0 / 베이직포함 / (가능시)유료점유 / 게스트데모.
보고: 파일·sku판정식·PHP변경·제외범위.
```
