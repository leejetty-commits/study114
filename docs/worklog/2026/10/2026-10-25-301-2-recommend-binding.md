# 301-2 추천(👍) 버튼 바인딩

**기준:** origin/main `4dc82319` (301-1-2 병합 후)  
**브랜치:** `cursor/301-2-recommend-binding-20261025`  
**작업일:** 2026-10-25  
**승인:** 이 세션은 자기 커밋을 승인하지 않는다.

## 문제

회원 홈·검색 카드의 👍 버튼은 `data-action="recommend-toggle"` 속성으로 렌더되지만, `bindUserActionEvents()`에 해당 핸들러가 없어 클릭이 무시됐다. 게스트 홈(`guest-sections.js`)과 확대카드(`detail-shell.js`)에만 바인딩이 있었다.

첫 렌더에서 서버 응답의 `recommended` 상태가 버튼에 반영되지 않아, 이전에 추천한 카드도 비활성으로 보였다.

## 고친 방식

### user-actions-ui.js

- `toggleRecommendation`을 `search-api.js`에서 import.
- `bindUserActionEvents()` 안에 `recommend-toggle` 핸들러를 추가. 기존 `guest-sections.js`·`detail-shell.js`와 같은 패턴:
  - 클릭 → `toggleRecommendation(kind, id)` POST → 응답의 `recommend_count`·`recommended`로 숫자·`is-active` 갱신.
- sessionStorage(`study114-recommend-active`) 기반 추천 상태 추적:
  - 토글 응답의 `recommended`로 세트를 갱신 → 리렌더·새로고침 후 `is-active` 유지.
  - 바인딩 시점에 `isRecommendedLocal(kind, id)`로 기존 활성 상태 복원.
  - 최대 200개, 탭 닫으면 초기화(sessionStorage).
- `isRecommendedLocal`을 export해 렌더 시점에도 사용.

### exposure-render.js

- `isRecommendedLocal`을 import.
- `renderItemActions()`에서 로그인 사용자의 추천 버튼에 `is-active` 클래스를 첫 렌더부터 적용.

### guest-sections.js

변경 없음. 게스트 카드는 원래 `login-gate`로 렌더되어 `recommend-toggle` 버튼이 나오지 않음.

## 범위 밖

- 서버 검색 응답에 per-user `recommended` boolean 추가 (새 추천 시스템 금지)
- `detail-shell.js`의 기존 recommend-toggle 바인딩은 이미 동작함 — 건드리지 않음
- 추천 수 변조·hideWhenZero 금지. 서버가 0이면 0.
