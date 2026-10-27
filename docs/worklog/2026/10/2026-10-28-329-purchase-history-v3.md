# 329 — 구매이력(#/mypage/plans) 환불 목록 UI 시안 v3

- **지시:** t667 시안 v3 — 상단 칩(결제내역/환불 신청/신청 현황) 제거, 행 기반 통합 목록, 셀 분할(내역/환불/진행상황/종료/소멸), 인라인 펼침
- **브랜치:** `cursor/329-purchase-history-v3-20261028`
- **RESTORE_BASE:** `07382301`
- **범위:** 프론트엔드 전용. 서버·DB·계산 알고리즘 변경 없음.

## 변경 파일

| 파일 | 변경 |
|---|---|
| `preview/home-ui/src/plans/screens.js` | `renderPlansHistory` v3 행 목록 교체, `renderHistV3Row`·`renderV3Panel`·`resolveV3Cells` 신규, 기존 `renderHistoryRow`·`renderExpandedRow` 제거, `expandedOrderRef` → `openCell`, 셀 토글·환불·철회 이벤트 v3 배선 |
| `preview/home-ui/src/mypage/screens.js` | `/mypage/plans`·`/mypage/plans/history` → `renderPlansV3` (v3 통합 목록) |
| `preview/home-ui/src/styles/mypage-ops.css` | v3 행 CSS: `.plans-hist-row`, `.plans-hist-row__bar/info/acts/panel`, 상태배지, 진행단계, 900px 반응형, 240px 칸 박스 |
| `scripts/verify-329-purchase-history-v3.mjs` | 329 전용 정적 검증 56항 |
| `scripts/verify-refund-history-ui.mjs` | B1–B5, D2, G4 → v3 구조 기준으로 업데이트 |
| `scripts/verify-refund-apply.mjs` | F6, F11 → v3 구조 기준으로 업데이트 |

## 검증 결과

- `verify-329-purchase-history-v3`: **56/56 pass**
- `verify-refund-history-ui`: **62/62 pass**
- `verify-refund-apply`: **111/111 pass**
- `verify:shop-page`: **pass**
- `build:dothome`: **성공**

## PG HOLD 준수

- `refunded` 상태 표시 없음 (PG 실환불 미구현)
- 프론트 금액 계산 없음 (서버 값 표시만)
- 서버 파일 변경 없음

## 329b 승인 보류 수정 (같은 tip 브랜치)

1. 카피 「내 상품」→「구매이력」 (order-blocks / hub-home / screens / router 제목)
2. 리다이렉트: `/plans/history`→`/mypage/plans`, `/mypage/plans/history`→`/mypage/plans` (MYPAGE_LEGACY_ALIASES)
3. PG HOLD: `isRefundDone`·「환불 완료」패널·진행단계 `refunded` 제거 (승인까지만)

### 스샷·실측
- 구현: `audits/329b-impl-shots/{01..04}-{d1000,m390}.png`
- 시안: `audits/refund-history-mockups-v3-2026-10-28/.../shots/`
- 1000px acts width: **240px** (measure.json)

## 커밋 대기

오너 지시 후 커밋/push.
