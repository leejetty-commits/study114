# 67 · 유료상품 리뉴얼 통합 라우팅/API 재점검 보고서

기준 시점: 2026-09-14 · 브랜치 `feat/paid-renewal-storefront` (+ 본 점검 최소 수정)  
정본: 34-1 · 34 · 가격 체크리스트 · UDX-STD-001(참조) · UDX-20 · UDX-60 · 9장(역할 노출)

---

## 1. 한줄 결론

핵심 구매·대기·배지·쪽지권 API 가드는 서버에서 대체로 막히지만, **주문요약 CTA가 지역 미정·Prime 만석·묶음권 잠금을 무시하던 P1 UX 누수 3건**을 이번 점검에서 최소 수정했다. 지역별 Prime 3자리 서버 SSOT는 여전히 임시 전역 ≤3 게이트(HOLD).

---

## 2. 총평

| 축 | 판정 | 근거 요약 |
|---|---|---|
| 라우팅 | **PASS** | `#/plans/positions`·`access` 독립 URL · `/plans/my`→`/mypage/plans/my` 리다이렉트 (`router.js`) |
| API | **PASS** (조건부) | checkout badge/bundle/pack · waitlist study_room+prime 가드 확인. position **지역**은 서버 미검증(HOLD) |
| role guard | **PASS** | waitlist.php tutor/pick 422 · assertRoomPrimeAvailable study_room+prime only · badge role allow |
| summary | **PASS*** | 표시=카탈로그파생 · 확정=`PaidCatalog::quote`. *CTA 가드 수정 후 |
| my 반영 | **PASS** | waitlist fetch/cancel on `#/mypage/plans/my` · history API |
| direct URL 방어 | **PASS*** | query 기본값·서버 거부. *프론트 CTA 가드 보강 |

\* = 본 점검 최소 수정 반영 후.

---

## 3. 인벤토리

### 3-1. Route

| URL | 화면 | Query | 비고 |
|---|---|---|---|
| `#/plans` | 홈 | provider_* | |
| `#/plans/positions` | 노출상품 | product, option, badges, provider_* | |
| `#/plans/access` | 쪽지권 | option, provider_* | 지역 query 없음 |
| `#/plans/checkout` | 결제확인 | draft(sessionStorage) | |
| `#/plans/result` | 결과 | — | |
| `#/plans/my` | → mypage | redirect | |
| `#/mypage/plans/my` | 내 상품·대기 | provider_* | 운영 허브 |
| `#/mypage/plans/history` | 결제내역 | — | |

역할: `profiles.js:getPlansEffectiveRole` (auth role_type · 미리보기 보정).

### 3-2. 상태 전달

| 값 | 생성 | 전달 | 서버 검증 |
|---|---|---|---|
| role/provider | auth + resolveSelectedProfile | draft.providerType/Id | requireProviderContext |
| product/term | query + select | draft.productCode/apiVariant | PaidCatalog::quote |
| badge_codes | query `badges` / checkbox | draft.badgeCodes → body | normalizeBadgeCodesForBundle max2 |
| region | apply radio (UI) | **draft 미포함** | waitlist만 slot_group · **position create 미검증** |
| waitlist | CTA | waitlist.php | study_room+prime |
| ticket | query option | variant | MemoTicketPolicy + hasActivePaidMemoPack |
| order summary 표시 | screens 파생 | — | 결제 SSOT=서버 quote |

### 3-3. API

| Endpoint | Method | Guard | 실패 |
|---|---|---|---|
| `/api/paid/checkout.php` | POST create/complete | requireProvider · badge_addon 거부 · pack conflict · prime full | InvalidArgument / PaidConflict |
| `/api/paid/waitlist.php` | GET/POST | study_room · prime only | 422 |
| `/api/paid/status.php` | GET | requireProvider | slots/tickets |
| `/api/paid/catalog.php` | GET | optional provider_type | |
| `/api/paid/history.php` | GET | requireProvider | |

### 3-4. 파일 역할 (1줄)

| 파일 | 역할 |
|---|---|
| `plans/router.js` | hash 경로·리다이렉트·query 파서 |
| `plans/screens.js` | positions/access/checkout/my 렌더·이벤트·CTA 가드 |
| `plans/order-blocks.js` | 적용대상 readiness · 주문요약 · 구매전확인 |
| `plans/store-ui.js` | 배지 max2 UI |
| `plans/slot-inventory.js` | 공부방 Prime 3칸만 |
| `plans/checkout-session.js` | draft sessionStorage |
| `paid-api.js` | checkout/waitlist 클라이언트 |
| `checkout.php` / `ProviderCheckoutService.php` | 결제 생성·fulfill·가드 |
| `PaidBadgeRepository.php` | badge_codes 정규화 |
| `waitlist.php` / Waitlist* | 예약대기 |
| `ProviderTicketService.php` | status slots · pick inventory:false |
| `mypage/screens.js` | `#/mypage/plans/my` 재고·대기 호스트 |
| `scripts/verify-paid-renewal.mjs` | 정적 증빙 |

---

## 4. 이슈 목록

### P1-1 · 주문요약 CTA가 지역 미정에도 활성
- **재현:** 지역 없는 공부방 프로필 → `#/plans/positions` → 주문요약「구매하기」활성
- **기대:** 기간·구매 CTA 비활성 (잠금1)
- **실제(수정 전):** 카드 경고만 · CTA 활성 → checkout 진입 가능
- **원인:** `renderPlansPositions` `ctaDisabled`가 role/profile만 검사 · buy click region 미검사
- **수정:** `getApplyTargetReadiness` + `orderCtaDisabled` · 기간 select disabled · buy click `data-region-ready=0` return
- **수정 여부:** ✅
- **TC:** C-2.2 · C-9.7

### P1-2 · Prime 만석인데 주문요약「구매하기」활성
- **재현:** slots.remaining=0 · 카드는「예약대기만」 · 요약 CTA는 구매
- **기대:** 요약도 구매 불가 / 대기만
- **원인:** soldOut이 카드에만 반영
- **수정:** `roomPrimeSoldOut` → ctaDisabled · buy click `is-soldout` return · CTA 라벨「예약대기만 가능」
- **수정 여부:** ✅
- **TC:** C-2.5 · C-7

### P1-3 · 활성 묶음권 + stale `?option=5회` 시 요약 CTA 우회
- **재현:** activePaidPack · URL에 5회 option · 카드 비활성인데 요약이 그 option 표시·구매 시도
- **기대:** 5/10 선택 불가 · 1회로 정규화 또는 CTA 비활성
- **원인:** selectedOpt가 query를 packLock 무시하고 채택
- **수정:** selectedOpt 정규화 · `selectedPackLocked` · buy click disabled ticket 버튼 차단
- **수정 여부:** ✅ (서버 `assertMemoPurchaseAllowed`는 기존 PASS)
- **TC:** C-6.5–7 · C-9.9

### P2-1 · 내 상품「이용중 포지션」내부 용어
- **원인:** `renderPlansMy` 카피
- **수정:** 「이용중 노출상품」
- **수정 여부:** ✅ · TC C-1.5

### P2-2 · 과외 가이드「매진」표현
- **수정:** 「재고·예약대기 UI가 없습니다」로 완화
- **수정 여부:** ✅

### HOLD-1 · Prime 전역 active ≤3 vs 지역별 3자리 SSOT
- **증거:** `ProviderTicketRepository::countActiveStudyRoomPrimes` 지역 필터 없음 · UI 카피는「선택 지역」
- **조치:** 정책 발명 없이 HOLD · 문서 66·본 보고서 잔여 리스크
- **서버 region 미전송:** position create에 region 없음 — 프론트만 정책 정렬. 지역 SSOT 도입 시 서버 가드 필수.

### HOLD-2 · 이용기간 중 배지 교체 UI
- 단독 badge_addon create는 서버 거부(PASS). 재구매(연장) 시 번들은 허용(정본). 중도 전용 UI 없음(PASS).

---

## 5. 수정 내역

| 파일 | 변경 |
|---|---|
| `order-blocks.js` | `getApplyTargetReadiness` export · readiness 단일화 |
| `screens.js` | order CTA/기간/buy 가드 · access pack 정규화 · 포지션→노출상품 · 매진 카피 |
| `verify-paid-renewal.mjs` | 가드·용어 정적 검사 추가 |

최소 범위: 진입점(요약 CTA·click)·apply readiness 공통 함수만. 서버 지역 스키마/전역 게이트는 미확정 SSOT라 손대지 않음.

---

## 6. 검증 내역

### 수동(코드 경로 재현)

| ID | 시나리오 | 결과 | 근거 |
|---|---|---|---|
| C-1.1–2 | positions/access 분리 | PASS | router + nav chips |
| C-1.3 | refresh query 유지 | PASS | hash query SSOT |
| C-1.5 | 포지션 용어 | PASS* | 수정 후 |
| C-2.1 | roomPrimeOnly | PASS | renderPositionCard |
| C-2.2/5 | 지역·만석 CTA | PASS* | 수정 후 |
| C-2.6 | Pick 살펴보기 | PASS | 문자열 부재 |
| C-2.9–11 | waitlist 가드·문구 | PASS | waitlist.php · 전역게이트 HOLD |
| C-3 | Pick 5×2·대기 없음 | PASS | pickPreview · roomPrimeOnly |
| C-4 | tutor 슬롯/대기 없음 | PASS | slots=null tutor · API 422 |
| C-5 | badge max2·단독거부 | PASS | normalize + createOrder |
| C-6 | access 독립·묶음·1회 | PASS* | 서버+프론트 수정 |
| C-7 | summary SSOT | PASS | quote 서버 |
| C-8 | waitlist my | PASS | fetch/cancel |
| C-9.* | 비정상 조합 | PASS/HOLD | 표 §G |

### 자동 verify

```text
npm run verify:paid-renewal  → 기대 PASS 증가분 포함
node --check plans/screens.js · order-blocks.js
```

---

## 7. 남은 리스크

1. 지역별 Prime 3자리 DB SSOT 미연동 (전역 ≤3)  
2. position checkout에 region payload/검증 없음 (프론트만 정책)  
3. Phase 4: 기간카드 높이 · UDX-60 모바일  
4. 머지 후 Actions + study114.net 실계정 스모크 필요  
5. 로컬 worktree와 `fix/cur-006` 작업 트리 혼재 — PR은 `feat/paid-renewal-storefront`만

---

## 8. 최종 판정

**조건부 머지 가능** (`feat/paid-renewal-storefront`)

이유:
1. 배지·대기·묶음권 **서버 가드**는 정본과 일치하고 입증됨.  
2. P1 UX 누수(요약 CTA)는 본 점검에서 차단.  
3. 지역별 재고 SSOT는 HOLD이나, 문서화·프론트 정책 정렬로 즉시 사고 범위는 축소.

### 머지 전 필수 체크
1. [ ] `npm run verify:paid-renewal`  
2. [ ] 공부방: 지역 없음 → 구매 CTA 비활성  
3. [ ] 공부방: Prime 만석 → 대기 등록 → my 목록 → 취소  
4. [ ] 공부방 Pick / 과외쌤: 점유판·대기 DOM 0  
5. [ ] badges=3종 URL → UI max2 · 서버 거부 메시지  
6. [ ] 활성 묶음권: 5/10 비활성 · 1회 가능 · 직접 POST 서버 conflict  
7. [ ] Actions deploy 후 `#/plans/positions`·`access` 실사이트 스모크  

---

## G. 놓치면 안 되는 결론

### 1) 지금 즉시 고쳐야 하는 라우팅/API 문제
- ~~주문요약 CTA 지역/만석/묶음권 누수~~ → **본 커밋에서 수정**
- 추가 즉시 P0 API 결함: **없음** (badge_addon·waitlist·pack 서버 가드 확인)

### 2) Phase 4 / 머지 전으로 넘겨도 되는 문제
- 지역별 Prime 3자리 SSOT (전역 게이트 HOLD)  
- position create region 서버 검증 (스키마 연동 후)  
- 기간카드 동일 높이 · UDX-60  

### 3) 프론트는 막지만 서버가 안 막는 문제
- **지역/주력과목 미정 position 구매** — 서버 region 미검증 (프론트 CTA로 보완; SSOT 후 서버 필수)  
- 공개 readiness(상세등록) — UI eligibility만, 서버 ownership 중심  

### 4) 서버는 막지만 프론트 UX가 틀렸던 문제
- Prime 만석·묶음권 stale option — **수정함**  
- 지역 미정 요약 CTA — **수정함**  

### 5) 정본 문구 vs UI
- 「포지션」내 상품 표기 — **수정함**  
- UI「선택 지역 3자리」vs 서버 전역 ≤3 — **문서 HOLD** (카피 과장 리스크 잔존)  

### 6) main 머지 전 최소 스모크
1. positions / access URL 분리·새로고침  
2. room Prime 빈칸 구매 → checkout create 금액=서버  
3. room Prime 만석 → waitlist → my → cancel  
4. tutor/pick: waitlist 버튼·API 호출 없음  
5. badge 2개 번들 create · badge_addon 단독 422/에러  
6. pack 활성 5/10 차단 · 1회 checkout  
7. 배포 후 번들 해시·콘솔 에러 0  
