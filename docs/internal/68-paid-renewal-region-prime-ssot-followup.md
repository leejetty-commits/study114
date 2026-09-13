# 68 · 유료상품 region / 공부방 Prime 지역별 3자리 SSOT 후속

기준: `feat/paid-renewal-storefront` · baseline `2c6d14a` · 본 후속 커밋  
정본: 34-1 → 34 → 18 → 9 → UDX(참조)

---

## 1. 한줄 결론

공부방 Prime의 **적용 지역을 거래 SSOT로 승격**했다. create/complete/waitlist가 `region_basis_type + region_id|complex_id`를 서버에서 필수 검증하고, 재고는 **지역 스코프 활성 ≤3**(schema `065`)로 계산한다. Pick/tutor에는 미적용. **운영 DB에 065 미적용 시 create는 명시 거부(fail-closed).**

---

## 2. 이번 작업 범위

포함: region 입력·검증 · 지역별 Prime 재고 · waitlist/create/status 정렬 · draft/summary/body · verify · 본 보고서  
제외: UI 대공사 · Pick/tutor 정책 변경 · 배지 신규 · 배포 실행

---

## 3. 정본 기준 요약

| 원칙 | 반영 |
|---|---|
| 공부방 Prime만 재고·대기 | room+prime만 scope 검증 |
| 재고 키 = 선택 행정동\|단지 | `dong:region_id` / `complex:complex_id` |
| 슬롯 번호 선택 없음 | 자동 배정 유지 · UI 라디오는 지역만 |
| Pick/tutor 순환 | inventory false · waitlist 거부 유지 |
| 결제 직전 서버 재검증 | create+complete 모두 region 재검증·재고 재확인 |

---

## 4. 구조 인벤토리 (요약)

| 경로 | 역할 |
|---|---|
| `#/plans/positions` | 노출상품 · 지역 라디오(id) · 주문요약 |
| `#/plans/access` | 쪽지권 (region 없음) |
| `#/plans/checkout` | draft → create body |
| `#/mypage/plans/my` | 대기 목록 |
| `checkout.php` | region_* 파싱 → createOrder |
| `waitlist.php` | study_room+prime · scope normalize |
| `status.php` | optional region qs → slots.prime |
| `PrimeRegionScope` | normalize / own / count / inventory |
| `065_…sql` | position 구독 region 컬럼 |

---

## 5. region 흐름 분석

| 단계 | before | after |
|---|---|---|
| UI | 라벨 라디오만 | `data-region-basis/id/complex-id` |
| query | 없음 | `region_basis_type`, `region_id`, `complex_id` |
| draft | 없음 | region* 필드 |
| summary | 지역 행 약함 | 「적용 지역」행 + CTA 가드 |
| create body | 미전송 | region_* 전송 |
| server | 미검증 | normalize + 소유(study_room_regions) + 재고 |
| persistence | 미저장 | subscription region 컬럼 + snapshot.prime_region |
| waitlist | label/slot_group 폴백 | id 필수 · 소유 검증 · 잔여>0이면 대기 거부 |
| status slots | 전역 count | 지역 scope inventory (065 시) |

**판정:** region은 이제 **거래용 값**. 라벨만으로는 create/waitlist 불가.

---

## 6. Prime 지역별 재고 SSOT

| 항목 | 내용 |
|---|---|
| Canonical key | `region_basis_type` + (`dong`→`region_id` \| `complex`→`complex_id`) |
| Capacity | 3 / key (`PrimeRegionScope::CAPACITY`) |
| Count SQL | `provider_position_subscriptions` where prime+study_room+active+scope |
| 스키마 | `065_provider_position_region_scope.sql` |
| 레거시 전역 count | deprecate · create 경로에서 사용 안 함 |
| 065 미적용 | create → 422 스키마 안내 · status → `legacy_global_until_065` 메타 |
| 기존 NULL region 행 | 지역 count에 **미포함**(과소 점유 가능) — 백필 HOLD |

---

## 7. 수정 파일

- `sql/schema/065_provider_position_region_scope.sql` (new)
- `src/Paid/PrimeRegionScope.php` (new)
- `src/Paid/ProviderCheckoutService.php`
- `src/Paid/ProviderTicketRepository.php`
- `src/Paid/ProviderTicketService.php`
- `src/Paid/ProviderWaitlistService.php`
- `src/Paid/ProviderStatusService.php`
- `src/Paid/ProviderUsageService.php`
- `public/api/paid/checkout.php`
- `public/api/paid/status.php`
- `preview/home-ui/src/plans/order-blocks.js`
- `preview/home-ui/src/plans/screens.js`
- `preview/home-ui/src/plans/checkout-session.js`
- `preview/home-ui/src/paid-api.js`
- `preview/home-ui/src/provider-status.js`
- `scripts/verify-paid-renewal.mjs`
- `docs/internal/68-paid-renewal-region-prime-ssot-followup.md`

---

## 8. 이슈 before / after

### P0 · room Prime region 서버 미검증
- **재현:** region 없이 POST checkout create prime
- **기대:** 4xx · 적용 지역 선택 안내
- **before:** 통과 가능(전역 게이트만)
- **after:** `requireRoomPrimeRegionScope` 필수
- **최소성:** 공통 helper + create/complete 진입점만

### P0 · 전역 ≤3 vs 지역별 3자리
- **before:** `countActiveStudyRoomPrimes()` 전역
- **after:** `countActiveStudyRoomPrimesInScope` · 065 컬럼
- **검증:** A지역 만석 ≠ B지역 차단(코드 경로)

### P1 · waitlist label-only
- **before:** slot_group 문자열 폴백
- **after:** id normalize + 소유 검증 · 잔여>0이면 대기 거부

### P1 · summary/draft/body 불일치
- **after:** draft·create·summary 동일 region 필드

---

## 9. 테스트 / verify

```
npm run verify:paid-renewal  → PASS 38 / FAIL 0
node --check screens.js order-blocks.js paid-api.js provider-status.js
```

수동 스모크(운영 065 적용 후):
1. room Prime region 미선택 → CTA 비활성 · create 거부  
2. 지역 A 잔여>0 → 구매  
3. 지역 A used=3 → 만석·대기  
4. 지역 B → 구매 가능(전역 3과 무관)  
5. Pick/tutor waitlist 불가  
6. badge max-2 · badge_addon · pack 5/10 · 1회 회귀  

---

## 10. 남은 HOLD / 리스크

1. **운영 phpMyAdmin에 schema 065 미적용 시** create 불가 — 배포 전 필수  
2. 기존 region NULL 구독 행 백필 없음  
3. preview `saved_regions` 없는 옛 캐시는 regionReady=false(의도)  
4. held/임시확보 TTL은 정본 미확정 — 미구현  
5. Actions/실사이트 스모크 미실행  

---

## 11. 머지 가능 여부

**조건부 머지 가능**

조건:
1. 운영(또는 스테이징) DB에 `065_provider_position_region_scope.sql` 적용  
2. `npm run verify:paid-renewal` PASS  
3. 수동 스모크 1–5 통과  

---

## 12. 배포 전 스모크

1. 065 컬럼 존재 확인 (`region_basis_type` on subscriptions)  
2. room Prime region 없이 create → 에러 문구  
3. 유효 region create → snapshot.prime_region · DB row scope  
4. 동 지역 used=3 → conflict · waitlist 등록  
5. 타 지역 구매 가능  
6. Pick/tutor inventory UI·waitlist 0  
7. access 쪽지권 회귀  
8. badge 번들 회귀  
9. status?region_id= 시 slots.prime.inventory_key  
10. 배포 후 콘솔 에러 0  

---

## G. 최종 결론 섹션

### A. 이번 브랜치에서 해결된 것
- room Prime **region 서버 필수 검증**  
- **지역별 ≤3** 재고 SSOT(065 + PrimeRegionScope)  
- waitlist/create/complete/status/summary/draft **동일 키**  
- Pick/tutor 누수 차단 유지  

### B. HOLD
- 065 운영 적용 · 레거시 NULL 행 백필 · held TTL · Phase 4 polish  

### C. 머지
- **조건부 가능** (065 적용이 게이트)  

### D. 조건
- DB 065 + verify + 지역 A/B 스모크  

### E. 배포 전 체크
- 위 §12  

### F. 정본 100% 미일치
- 임시확보(held)·연장 우선권 자동배정 세부 · 레거시 데이터 백필  

### G. 후속 PR
- NULL region 백필 스크립트 · held 재고 포함 규칙 · UDX-60 모바일  
