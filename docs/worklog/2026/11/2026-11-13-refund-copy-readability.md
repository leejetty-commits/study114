# 환불 안내 가독성 — 쪽지권·노출상품 (2026-11-13)

- 지시 정본: `origin/docs/refund-copy-readability-2026-11-13` 의 `docs/worklog/grok-sync/docs/refund-copy-readability-2026-11-13.md` (`1397ec42`)
- 기준: origin/main `5ebf19ff` (PR #206)
- 브랜치: `work/refund-copy-readability`
- 워크트리: `D:\work\study114\.wt\work-refund-copy-readability`
- **머지 안 함**

## 지시 원문

최신 main에서 브랜치를 만들고, 위 그록 문서를 그대로 따라 쪽지권·노출상품 환불 안내 문구만 단락·목록으로 나눈다. 금액·조건·계산 로직은 바꾸지 않는다. 커밋·PR까지 하고 머지하지 않는다. force push 금지, 실시간 매칭 금지.

## 한 일

자세한 안내만 `preview/home-ui/src/refund-policy-copy.js`에서 단락과 목록으로 나눴다. 화면은 `renderRefundDetailHtml('access'|'position')`를 쓴다. 항목 글자만 이스케이프하고 `ul.refund-policy-list`는 렌더 함수가 만든다. `ul.refund-breakdown`(예정액)과 클래스를 구분했다.

- 쪽지권: 도입 + 「상품별 환불 금액」 + 「알아 두실 점」. 「결제가 완료된 주문만 신청하실 수 있어요」 유지. 완료 문장은 확정문 「실제 입금이 끝나야 「환불 완료」로 바뀌어요.」
- 노출: 도입 + 「조건별 환불 금액」 + 「알아 두실 점」. 356 문장 `REFUND_LATER_EXTENSION_DENY`는 목록 한 칸에 원문 그대로. 완료 문장은 원문 「실제 입금이 끝나기 전에는 「환불 완료」로 보여 드리지 않아요.」
- 접힘 제목 「환불·소멸 안내」「환불·만료 안내」「환불 규정 자세히」는 그대로.
- 짧은 안내, FAQ 짧은 답, 탈퇴 한 줄, 확인창, 18c·18d, PHP 계산은 그대로.

## 확인

- 문구 모양 검사 `PASS 24` (tmp 스크립트, 커밋하지 않음)
- `verify-refund-history-ui.mjs` PASS 73 / FAIL 0
- `verify-refund-apply.mjs` PASS 111 / FAIL 0
- `verify-paid-renewal.mjs` PASS 38 / FAIL 0
- `verify-refund-foundation.mjs` PASS 27 / FAIL 7 — 아래 발견 목록. 이번 문구와 무관한 옛 문자열 검사라 고치지 않음.

## 화면

로컬 API(`127.0.0.1:8080`)가 없어 상품 화면 셸이 비었다. 캡처는 상품·구매이력 화면이 쓰는 같은 HTML과 `plans-store.css`를 연 상태다. 운영 FAQ는 `https://study114.net/#/support/faq/plans` 실화면이다.

캡처: `docs/worklog/2026/11/refund-copy-readability-captures/`

- `acc-access-1280.png` · `acc-access-390.png`
- `acc-position-1280.png` · `acc-position-390.png`
- `acc-history-access-1280.png` · `acc-history-access-390.png`
- `acc-history-position-1280.png` · `acc-history-position-390.png`
- `faq-live-1280.png`

## 발견 목록 (범위 밖 · 미수정)

1. `scripts/verify-refund-foundation.mjs` D5·D6·D8·D9·D10·E1·E2가 실패한다. order-blocks에 남아 있지 않은 옛 문장(「7일 이내」「1회 즉시권: 7일 이내 미발송 시 전액」「시작 전: 전액 환불」 등)을 파일 안에서 찾는다. 이번 변경 전과 같다.
2. 로컬 미리보기 셸은 API 8080이 꺼져 상품·FAQ 화면이 비었다. 목록 모양은 같은 렌더 결과로 캡처했다.
3. 운영 FAQ 보드는 `faq-1`~`faq-6`만 있고 `faq-19`는 없다. 「유료상품 환불과 과외비 환불은 같나요?」시드 답은 보드에 덮이지 않는다. 운영 페이지 본문에 시드 문장(「다릅니다. 쪽지권·노출상품 환불은…」)이 있다.

## 셀프검수

| # | 항목 | 결과 |
|---|------|------|
| 1 | 쪽지권 확정 모양·숫자·「결제 완료 주문만」 | PASS |
| 2 | 노출 공식·0원·배지·쪽지·356 원문 | PASS |
| 3 | 짧은 안내·FAQ·탈퇴·확인창·18c·18d·계산 미변경 | PASS |
| 4 | 고객 문구에 개발용어 없음 | PASS |
| 5 | 목록이 점 목록으로 보임 (1280·390) | PASS |

## [최종검수 패키지 — 환불 안내 가독성]

해시는 이 기록을 커밋한 뒤 보고에 적는다. PR은 만들고 머지하지 않는다.
