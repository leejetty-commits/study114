# 190b · Cursor — 가입 직후 동네인사 모달 저장 피드백 (로컬)

- 작성: 2026-09-29 · 우동공과2
- 선행: 190 ACCEPT (마이 폼)
- push · build:dothome · Notion **금지**

## Must

1. `preview/auth-ui/src/screens/signup-complete.js` 「인사 올리기」성공 시 모달 안에 **「저장되었습니다」** (alert 금지).
2. 성공 직후 **`goRoleHome()` 호출하지 않음**. 모달에 머문다.
3. 「건너뛰기」는 기존처럼 역할 홈으로 이동 유지.
4. 실패는 모달 내 에러만. 성공·에러 동시 표시 금지.
5. 사용자가 모달을 닫거나 「홈으로」류가 있으면 그때 홈. (없으면 성공 후 닫기/홈 버튼 하나 추가 가능 — 강제 자동 이동 금지)

## Allowlist

- `preview/auth-ui/src/screens/signup-complete.js`
- 필요 시 관련 CSS만

## Forbid

- 홈 레일·지도 UX · 190 마이 폼 회귀 · commit/push/build:dothome
