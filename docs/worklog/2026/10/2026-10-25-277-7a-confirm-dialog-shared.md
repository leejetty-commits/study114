# 277-7a — 공용 확인창 + 사용자 화면 6곳

**기준:** main `7115824e`  
**브랜치:** `cursor/277-7a-confirm-dialog-shared-20261025`  
**작업일:** 2026-10-25

## 바꾼 곳

| 파일 | 줄 | 전 | 후 | async 변경 |
|---|---|---|---|---|
| `messages/screens.js` | 331 | `confirm(BLOCK_THREAD_COPY.confirm)` | `s114Confirm(…, {danger:true})` | 이미 async |
| `provider-reviews/inbox.js` | 208 | `confirm('이 작성자의 추가 후기를…')` | `s114Confirm(…, {danger:true})` | 이미 async |
| `provider-reviews/inbox.js` | 241 | `confirm('이 후기를 삭제할까요?…')` | `s114Confirm(…, {danger:true})` | 이미 async |
| `provider-reviews/sheet.js` | 336 | `confirm('이 후기를 삭제할까요?…')` | `s114Confirm(…, {danger:true})` | 이미 async |
| `submission-board/submission-screens.js` | 395 | `window.confirm('이 제출을 삭제할까요?')` | `s114Confirm(…, {danger:true})` | 이미 async |
| `study-room-ui/src/promo-photos.js` | 193 | `confirm('이 사진을 삭제할까요?')` | `s114Confirm(…, {danger:true})` | 이미 async |

## 새 파일

`preview/shared/confirm-dialog.js` — `s114Confirm`, `s114Prompt`(7b용 미리) export.
- `role="dialog"` + `.s114-confirm__head` → `dialog-drag-auto.js` 자동 끌기 부착
- Esc=취소, Enter=확인, 바탕 클릭=취소, 초점 복귀, textContent만
- 스타일 `<style data-s114-confirm>` 1회 주입, z-index 1300
- 큐: 동시 호출 시 앞이 닫힌 뒤 다음 열림

## 남은 곳

- **7a-L (잠금, 종현 OK 전):** signup-basic.js(1), signup-complete.js(1), neighborhood-greeting-ui.js(1), student-reg/screens.js(1), study-room-ui/layout.js(2), tutor-ui/layout.js(1) — 7곳
- **7b (관리자):** a28-screens-bind.js(29), a28-member-mail.js(1), support/admin-screens.js(2) — 32곳
- **alert:** (가)안 — 그대로

## 수동 확인 방법

1. 찾기 로그인 → 쪽지 → 차단/삭제 확인창이 페이지 안 대화상자로 뜨는지
2. 후기 시트 → 후기 삭제 확인
3. 제출 게시판 → 삭제 확인
4. 공부방 등록 → 홍보사진 삭제 확인
5. 대화상자를 끌 수 있는지 (dialog-drag-auto.js 자동)

Node 없음 — Playwright 검수는 그록봇.
