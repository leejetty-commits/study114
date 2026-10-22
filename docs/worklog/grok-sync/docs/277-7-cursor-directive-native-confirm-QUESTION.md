# 277-7 (보내기 전 종현 결정 필요) — 브라우저 기본 확인창(confirm·prompt·alert)

- 브랜치(정해지면): `cursor/277-7-confirm-dialog-shared-20261023`
- 기준 커밋: 5c57dcf8

## 왜 따로인가
- `window.confirm()`, `prompt()`, `alert()`는 브라우저가 그리는 창이라 **어떤 코드로도 끌 수 없다.**
- 끌려면 우리 페이지 안 팝업(예: `preview/shared/confirm-dialog.js`의 `s114Confirm()`)으로 바꿔야 한다. 이 함수는 공용 끌기 함수를 쓴다.
- 그런데 지금 코드는 `if (!confirm(...)) return;`처럼 답을 바로 받는다. 바꾸면 기다리는(async) 방식이 되어, 부르는 곳마다 흐름이 바뀐다. 위험하고 양이 많다.

## 양 (5c57dcf8, preview·src, node_modules 빼고)
- confirm 39개, prompt 6개, alert 180개
- confirm·prompt가 있는 파일:
  - preview/home-ui/src/admin/a28-screens-bind.js 29
  - preview/study-room-ui/src/layout.js 2
  - preview/home-ui/src/support/admin-screens.js 2
  - preview/home-ui/src/provider-reviews/inbox.js 2
  - 1개씩: preview/tutor-ui/src/layout.js, preview/study-room-ui/src/promo-photos.js, preview/home-ui/src/submission-board/submission-screens.js, preview/home-ui/src/student-reg/screens.js, preview/home-ui/src/provider-reviews/sheet.js, preview/home-ui/src/neighborhood-greeting-ui.js, preview/home-ui/src/messages/screens.js, preview/home-ui/src/admin/a28-member-mail.js, preview/auth-ui/src/screens/signup-complete.js, preview/auth-ui/src/screens/signup-basic.js
- alert이 많은 파일: a28-screens-bind.js(68), signup-basic.js(12), promo-photos.js(7), support/admin-screens.js(6), student-reg/screens.js(7) 등

## 종현에게 물을 것
- (가, 추천) confirm·prompt 45개만 공용 페이지 안 확인창으로 바꾼다.
  - 277-7: 공용 `confirm-dialog.js`와 회원·사용자 화면 파일
  - 277-8: 관리자 파일
  - 파일 6~8개씩 나누고, 277-2~277-6 병합 뒤에 한다(같은 파일을 만지므로).
  - alert은 그대로 둔다.
- (나) alert 180개까지 모두 바꾼다. 지시서 5~6개가 더 필요하다.
- (다) 브라우저 기본 창은 끌기 대상에서 뺀다.
