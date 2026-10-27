RESTORE_BASE = `b80f7da3e813841a1cd76caef77e5ffe0e46465c`

원복 절차:
1) 미커밋 코드: `git restore --source=HEAD -- preview/home-ui/src/plans/screens.js preview/home-ui/src/styles/plans-store.css preview/home-ui/src/styles/plans-theme.css`
2) 잘못된 커밋: `git reset --hard b80f7da3e813841a1cd76caef77e5ffe0e46465c` (push 후 force-push 금지 → 보고)

# 319 — 요금제(Pick/Prime) 구매 준비 완료 게이트

- **과제:** 319
- **브랜치:** `cursor/319-plans-purchase-ready-mute-20261027`
- **base:** `b80f7da3` (318 병합 후 main)

## 조사 결과 — 함수명 목록

| 함수 | 역할 |
|------|------|
| `tierPurchaseGate()` | tier 캐시 읽기 → blocked/phase/lines |
| `getEligibility()` | 프로필 + tier + 지역 종합 → canBuy/missing |
| `renderPositionCard()` | 카드 렌더 (class·CTA·period) |
| `renderPlansPositions()` | storefront 전체 (배지·요약·CTA) |
| `scheduleTierCheckHydrate()` | 서버 tier 조회, 캐시에 이전 pick/prime 보존 |
| `readTierCheck()` | 캐시 읽기 |

## 게이트 설계

`isProductReady(profile, productCode, role)` 1개:
- `getEligibility()` 호출 → canBuy 확인
- loading 중 이전 캐시 확인 → 이전 ready면 유지(깜빡임 방지)
- 반환: `{ ready, reason, label, phase, registerCheckHref }`
- 적용: 카드 class · 클릭 · 요약 · 배지 · CTA (positions만)

## 319b — 검수 미달 고침

tip `127e5bcf` 검수(우동공과3 t565) 후 미달 3건 수정:

1. **자동 선택 제거**: `selectedCode = query.product || ''` (products[0]/'prime' 폴백 삭제), `selectedOption` query.option 기반만, `isSelectedOffer` index===0 분기 삭제
2. **요약 게이트**: `summaryReady = selectedProduct && selectedOption && selectedReadiness.ready` → false면 플레이스홀더(미선택/—), CTA 비활성
3. **사유 표시**: periodReason에 지역 사유 뒤 readiness.label / '확인 중' / '준비 미완료' 표시
