# 190 · Cursor — 동네인사 저장·내리기 알림 (로컬)

- 작성: 2026-09-29 · 우동공과2
- 선행: 173 ACCEPT · 185/186 ACCEPT(로컬)
- push · build:dothome · Notion **금지**
- 홈 UX(지도 아래 5줄·팝업)는 **후속 191** — 이 티켓 범위 밖

## 배경

`neighborhood-greeting-ui.js` 저장/내리기 성공 시 `rerender()`만 하고 성공 피드백이 없음. 186 기본등록과 같이 **폼 안 짧은 성공 문구**가 필요.

## Must

1. 서버 저장(`publishGreeting`) **성공 후** 폼 안에 초록/성공 톤으로 **「저장되었습니다」** (alert/confirm 팝업 금지 · 186과 동일 결).
2. 내리기(`unpublishGreeting`) 성공 후 **「내렸습니다」** (또는 동일 톤 짧은 문구 한 줄).
3. 실패 시 기존 `data-ng-error` 유지. 성공 문구와 에러가 동시에 보이지 않게.
4. 성공 문구는 수 초 후 자동 사라지거나, 다음 입력/재저장 시 갱신. 화면 전환 강제 금지.
5. 가입 직후 모달 「인사 올리기」성공에도 동일 피드백(해당 경로 있으면).

## Allowlist

- `preview/home-ui/src/neighborhood-greeting-ui.js`
- 필요 시 해당 CSS만 (`home-listings.css` 또는 greeting 전용)

## Forbid

- 홈 레일 위치/지도아래 UX 변경 (→191)
- 173 서버 소유권·localStorage-only 성공 회귀
- 강제 독촉·미작성 뱃지
- commit / push / build:dothome / Notion

## 스모크

1. 공부방·과외쌤 마이 동네인사 저장 → 「저장되었습니다」 보임
2. 내리기 → 성공 문구 보임
3. 실패 → 에러만, 성공 문구 없음

## 커밋 예 (수락 후)

`fix(home): show neighborhood greeting save and unpublish feedback`
로컬만.
