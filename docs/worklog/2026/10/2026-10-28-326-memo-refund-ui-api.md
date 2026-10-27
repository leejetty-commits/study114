# 326 — 쪽지권 환불 신청 UI + API

- **과제:** 326
- **날짜:** 2026-10-28
- **브랜치:** `cursor/326-refund-apply-20261028`
- **RESTORE_BASE:** `c67c0a75` (325 merged main tip)
- **지시서:** 이 세션 사용자 메시지 (326 지시서 전문)

## 지시 요점

325(환불 기반)가 main에 머지된 상태에서, 실제 환불 신청 흐름 구현:
- API: 자격확인(GET) · 신청(POST submit + txn/freeze) · 철회(POST withdraw)
- 자동승인(PG HOLD): requested → approved 즉시 전환
- 관리자 차단: 환불 진행 중 팩 remaining 수정 불가
- 결제내역 UI: 탭(쪽지권/노출) · 확장행 · 환불 액션 박스
- verify 2개 · 문서 갱신

## 변경 파일

### 신규
| 파일 | 설명 |
|------|------|
| `src/Paid/RefundService.php` | 자격확인·신청(txn+freeze)·철회·관리자차단 |
| `src/Paid/RefundRepository.php` | provider_refund_requests CRUD |
| `public/api/paid/refund.php` | GET 자격 · POST submit · POST withdraw |
| `scripts/verify-refund-apply.mjs` | 55항목 정적 verify |
| `scripts/verify-refund-history-ui.mjs` | 45항목 UI verify |

### 수정
| 파일 | 변경 |
|------|------|
| `src/Admin/AdminCommerceService.php` | ticket_remaining 보정 시 환불 진행 중 차단 |
| `preview/home-ui/src/paid-api.js` | refund endpoint + fetch 3함수 |
| `preview/home-ui/src/mypage/mypage-copy.js` | REFUND_REASON_CHOICES · REFUND_STATUS_LABELS · REFUND_COPY |
| `preview/home-ui/src/plans/history-mock.js` | invalidateHistoryCache · normalizeStatus |
| `preview/home-ui/src/plans/screens.js` | 결제내역 탭·확장행·환불 액션 전면 리디자인 |
| `docs/ssot/18c-memo-ticket-refund-lock.md` | 326 섹션 추가 |

## verify 결과

- `verify-refund-apply.mjs`: **55 passed, 0 failed**
- `verify-refund-history-ui.mjs`: **45 passed, 0 failed**
- `verify-refund-foundation.mjs` (325 불변): **34 passed, 0 failed**
- `verify:shop-page`: **71 passed, 0 failed**

## 핵심 설계 결정

1. **remaining 보존**: `reason_text` JSON (`frozen_remaining`, `used_count`) — 전용 컬럼 없이 기존 필드 활용
2. **소비 경로 제외**: `remaining=0` → 기존 WHERE(`remaining > 0`)로 자동 제외, 별도 플래그 불필요
3. **자동승인**: dev_mock PG이므로 requested → approved 즉시 전환. 실 PG 환불은 327

## 배포 전 사용자 할 일

- 없음 (083 SQL은 325에서 이미 적용)

## 검수 대기

- 커밋·PR은 오너 지시 후에만
