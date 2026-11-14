# 이웃 팝업 들여쓰기 · 구매이력 버튼 안내 · 안내글 글머리 · 퀵매칭 Event (2026-11-15)

- 지시: `docs/worklog/grok-sync/docs/popup-bullets-event-2026-11-15.md` (브랜치 `docs/popup-bullets-event-2026-11-15`)
- 기준: `origin/main` `8f57af0a`에서 `work/popup-bullets-event-2026-11-15`를 새로 만듦
- DB·SQL·서버·API·결제 변경 없음. 머지·배포 없음.

## 항목

| 항목 | 파일 |
|---|---|
| A 이웃 팝업 들여쓰기 | `preview/home-ui/src/neighborhood-greeting-ui.js`, `preview/home-ui/src/styles/neighborhood-greeting.css` |
| B 구매이력 버튼 안내 | `preview/home-ui/src/plans/screens-orders.js`, `preview/home-ui/src/mypage/mypage-copy.js`, `preview/home-ui/src/styles/mypage-ops.css` |
| C 안내글 글머리 | `preview/home-ui/src/styles/zip-guide.css`, `preview/home-ui/src/guide/screens.js`, `preview/home-ui/src/support/screens.js` |
| D 퀵매칭 Event | `preview/home-ui/src/styles/mypage-quick-match.css` |

글머리 모양은 작은 네모(4px). 약관 조항 문단은 범위에 넣음. Event 칸은 글자 너비.

## 확인

- `preview/home-ui` `npm run build`: 오류 0 (vite 기존 chunk 크기 경고만).
- `node scripts/verify-neighborhood-greeting-history.mjs`는 Vite 별칭 때문에 모듈을 열지 못한다. `vite-node`로 돌리면 삭제 확인 직전까지 단언이 통과하고, 그다음 `document.createElement`가 없어 멈춘다. 삭제 확인은 이번 팝업 마크업과 다른 기존 경로다.
- `git diff origin/main...HEAD -- src public/api migrations` 비어 있음.
- 화면: `docs/worklog/2026/11/shots-popup-bullets/`. 로컬 인사 목록이 비어 팝업은 같은 마크업·CSS로 샘플 두 줄을 띄웠다. 구매이력·프라임 메뉴는 로그인 없이 같은 CSS로 샘플을 띄웠다. 이용안내·FAQ·약관은 프리뷰 화면 그대로다.

## 수락 측정

- 팝업 1280: 새 이웃 이름·본문 줄 left 482.3 / 482.3. 과외쌤 480.1 / 480.1.
- 팝업 390: 새 이웃 94.3 / 94.3. 과외쌤 92.1 / 92.1.
- Event 1280·390: 배지와 「실시간」이 겹치지 않고 간격 8px. 다른 메뉴 아이콘 간격도 8px. 프라임 글자색 `#b8860b`, 비프라임 `#9a948a`.
