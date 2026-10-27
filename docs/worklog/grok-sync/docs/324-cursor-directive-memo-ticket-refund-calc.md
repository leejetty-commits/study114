# 324 — 쪽지권 환불 계산기 (커서 지시서)

**날짜:** 2026-10-27
**티켓:** 324
**상태:** 코드 완료 · push/PR 대기

---

## 변경 요약

- `src/Paid/MemoTicketRefundCalculator.php` 신규 — 순수 계산 (PDO·API·PG 없음)
- `scripts/verify-memo-ticket-refund.php` 신규 — 30+ 케이스 자동 검증
- `docs/ssot/18c-memo-ticket-refund-lock.md` 신규 — 환불표·판정규칙 정본
- `docs/internal/70-memo-ticket-refund-calculator.md` 신규 — 내부 설계 메모
- `docs/ssot/18-paid-services-rough.md` 최소 수정 — §17 #4에 18c 링크
- `docs/ssot/18b-paid-catalog-placeholder.md` 최소 수정 — 상단에 실가격 정본 경고

## 환불표

| 상품 | 조건 | 환불액(₩) |
|------|------|----------:|
| 1회 | 7일 이내 · 미발송 | 500 |
| 1회 | 발송 완료 / 7일 경과 | 0 |
| 5회권 | 사용0 | 2250 |
| 5회권 | 사용1 | 1125 |
| 5회권 | 사용2 | 750 |
| 5회권 | 사용3+ / 7일 경과 / 만료 | 0 |
| 10회권 | 사용0 | 4000 |
| 10회권 | 사용1~3 | 2000 |
| 10회권 | 사용4 | 1300 |
| 10회권 | 사용5+ / 7일 경과 / 만료 | 0 |

## 정본 원칙

코드 상수 = 정본. 옛 문서의 6개월·1000/4500/8000 추종 금지.
