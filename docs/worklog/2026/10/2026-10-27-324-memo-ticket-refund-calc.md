# 324 — 쪽지권 환불 계산기 작업 기록

**날짜:** 2026-10-27
**브랜치:** `cursor/324-memo-ticket-refund-calc-20261027`
**base:** `ced272ee` (origin/main, 323完)

---

## 지시서 원문 요약

- `MemoTicketRefundCalculator::calculate(array $in, DateTimeImmutable $now): array`
- 순수 계산 전용 (PDO·API·PG 호출 금지)
- 500/2250/4000 세트 기준 환불표 구현
- 판정 규칙 8개 (7일/사용횟수/1회권/자격/상한/만료/alias/정본 우선)
- verify 스크립트 · SSOT 문서 · internal · grok-sync · worklog

## 수정 파일

| 파일 | 변경 |
|------|------|
| `src/Paid/MemoTicketRefundCalculator.php` | 신규 — 환불 계산기 클래스 |
| `scripts/verify-memo-ticket-refund.php` | 신규 — 30+ 케이스 자동 검증 |
| `docs/ssot/18c-memo-ticket-refund-lock.md` | 신규 — 환불표·판정규칙 정본 |
| `docs/internal/70-memo-ticket-refund-calculator.md` | 신규 — 내부 설계 메모 |
| `docs/ssot/18-paid-services-rough.md` | §17 #4에 18c 링크 추가 |
| `docs/ssot/18b-paid-catalog-placeholder.md` | 상단에 실가격 정본 경고 추가 |
| `docs/worklog/grok-sync/docs/324-cursor-directive-memo-ticket-refund-calc.md` | grok-sync 노트 |

## 검수

- [ ] `php scripts/verify-memo-ticket-refund.php` — 로컬 PHP 없어 CI 확인 필요
- [ ] commit/push — 사용자 지시 대기
- [ ] PR 생성 — 사용자 지시 대기

## 위험도

- **낮음**: 순수 계산 클래스, 기존 코드 변경 없음, DB/API/PG 연동 없음
- docs 수정은 최소 (한 줄 링크, 경고 문구)
