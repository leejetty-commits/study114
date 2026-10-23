# 277-3b 지시서: 끌기 표시 ② (쪽지·인사 권유·휴대폰 확인·후기·마이샵 사진)

- 브랜치: `cursor/277-3b-popup-drag-marks-20261023` (origin/main에서 새로 만든다)
- 기준 커밋: **260fbcf6**. 아래 줄 번호는 모두 260fbcf6에서 직접 확인했다.
- **시작 조건**: **277-3a가 main에 병합된 뒤에 시작한다.** `git fetch origin && git merge-base --is-ancestor 260fbcf6 origin/main && git log origin/main --oneline | grep -q "277-3a" && echo OK || echo MISSING`. MISSING이 나오면 멈추고 보고한다.
- 277-3a는 이 지시서 파일을 건드리지 않으므로 줄 번호는 그대로일 것이다. 3줄 넘게 밀렸으면 고치기 전에 보고한다.

## 왜 하나
277-3a와 같다. 바탕에 `role="dialog"`가 붙은 팝업은 지금 끌리지 않는다. `findHandle`(dialog-drag-auto.js:33-49)은 `aria-labelledby`를 안쪽 상자에서 읽으므로, **제목 줄에 `data-drag-handle`을 직접 붙인다.** 단, 후기(#6)는 상자 안에 `<header>`가 있어 저절로 잡힌다.

## 1. 붙일 표시 (260fbcf6 기준)
| # | 팝업 | role 붙는 줄 | `data-drag-box` 붙일 곳 | `data-drag-handle` 붙일 곳 |
|---|---|---|---|---|
| 1 | 쪽지 로그인 막이 | preview/home-ui/src/messages/overlays.js:60 | `.msg-overlay__panel` :62 | `.msg-overlay__screen-id` 줄 :64 |
| 2 | 쪽지 쓰기 | 같은 파일 :170 | `.msg-overlay__panel` :172 | `.msg-overlay__screen-id` 줄 :174 |
| 3 | 쪽지 신고 (제목 연결 없음) | 같은 파일 :350 | `.msg-overlay__panel` :352 | `.msg-overlay__screen-id` 줄 :354 |
| 4 | 가입 끝 「동네에 인사할까요?」 | preview/auth-ui/src/screens/signup-complete.js:47 | `.ng-prompt-modal__card` :48 | `h2#ng-prompt-title` :49 |
| 5 | 휴대폰 확인 | preview/home-ui/src/study-room-reg/phone-verify-gate.js:68 | `.p20-phone-verify-modal__panel` :71 | 제목 `h2` :72 |
| 6 | 후기 | preview/home-ui/src/provider-reviews/sheet.js:239 | `.review-sheet__panel` :240 | 붙이지 않는다 (`header.review-sheet__head` :241이 저절로 잡힌다) |
| 7 | 마이샵 사진 크게 보기 (role 없음, `hidden`으로 켜고 끈다) | preview/home-ui/src/study-room-reg/myshop-render.js:247 | 아래 규칙 | 아래 규칙 |

**#7 규칙 (먼저 보고, 필요하면 멈춤)**: 먼저 1280에서 사진 창(`.shop-lightbox`)이 화면 전체를 덮는지 측정한다.
- 화면 전체를 덮으면 `.shop-lightbox`(:247)에 `data-no-drag`만 붙이고 측정값을 보고한다.
- 작은 상자면 `data-drag-box`를 붙인다. 잡을 줄이 없으므로(닫기 버튼 :248과 사진 :249뿐) **새 줄을 만들어야 하면 멈추고 보고한다.** 닫기 버튼이나 사진에 handle을 붙이지 않는다.
- 참고: `.shop-lightbox`에는 role이 없어서 자동 파일이 지금은 이 창을 아예 찾지 않는다(`POPUP_SELECTOR` :9). 그러니 아무것도 붙이지 않아도 지금 동작은 같다.

## 2. 허용 범위 (이 5개 파일만, 속성 추가만)
1. `preview/home-ui/src/messages/overlays.js`: :62, :64, :172, :174, :352, :354
2. `preview/auth-ui/src/screens/signup-complete.js`: :48-49
3. `preview/home-ui/src/study-room-reg/phone-verify-gate.js`: :71-72
4. `preview/home-ui/src/provider-reviews/sheet.js`: :240만 (:408 「불러오는 중」 상자는 건드리지 않는다)
5. `preview/home-ui/src/study-room-reg/myshop-render.js`: :247만

## 3. 금지 범위
- 277-3a 파일 6개, `dialog-drag-auto.js`, `draggable-dialog.js`, `detail-shell.js`
- 쪽지 보내기·신고 동작, 후기 저장, 휴대폰 인증 동작, 가입 흐름
- 마이샵 사진 순서·크기·넘기기 (`myshop-render.js` :265-283 열기/닫기 코드 포함)
- 모든 CSS, 문구·클래스·role·aria, 검사 스크립트·기준 사진

## 4. 멈춤 규칙
- 5개 밖의 파일을 고쳐야 할 것 같으면 **고치지 말고 멈추고 보고**한다.
- #7에서 잡을 줄을 새로 만들어야 하면 멈추고 보고한다.
- 표시를 붙였는데 끌리지 않거나 표의 요소가 그 줄에 없으면 멈추고 보고한다.

## 5. 검수 규칙
- `git diff --name-only origin/main...HEAD`에 위 5개 밖 파일이 하나라도 있으면 **자동 불합격**.
- 바뀐 줄이 `data-drag-box`·`data-drag-handle`·`data-no-drag` 속성 추가가 아니면 불합격.

## 6. 합격 기준 (#1~#6 각각, #7은 보고 내용)
1. **1280, 세로 스크롤바가 보이는 페이지**: 표시한 줄을 잡고 끌면 안쪽 상자만 움직이고, 오른쪽 끝은 스크롤바 앞(약 1257px)에서 멈춘다.
2. **화면 전체 바탕은 절대 안 움직인다.**
3. 버튼·입력칸(쪽지 글칸, 휴대폰 번호칸, 후기 글칸·별점)을 눌러 끌어도 끌기가 시작되지 않는다. 글자 입력과 선택도 원래대로 된다.
4. 닫았다 다시 열면 가운데로 돌아온다.
5. **390**: 끌리지 않고 원래 자리에 있다.
6. 로그인 상태: #1 비회원, #2·#3 학생 로그인, #4 새 가입 직후, #5 공부방 등록 중, #6 학생 로그인(후기 쓰기)과 공부방·과외쌤(후기 보기).
7. 동작 확인: 쪽지 1통 보내기, 후기 1개 저장, 휴대폰 확인 창 열고 닫기가 전처럼 끝까지 된다.
8. #7: 1280 측정값(창 너비·높이, clientWidth/Height)과 고른 방법을 보고하고, 사진 열기·닫기·넘기기가 전과 같다.
9. 콘솔 빨간 오류 0. CI 성공.

## 7. 증거 스크린샷 (`277-3b-번호-상태.png`)
- #1~#6마다: `-1280-scroll-before`, `-1280-scroll-dragged`(측정값 포함), `-1280-backdrop-try`, `-1280-reopen`, `-390` → 6 × 5 = 30장
- `-2-textarea-drag-try`, `-5-input-drag-try`, `-6-star-drag-try`
- 쪽지 보낸 뒤 화면, 후기 저장 뒤 화면
- #7: `-7-lightbox-1280`(측정값 포함), `-7-lightbox-390`

## 커밋 나누기
1. `277-3b feat(dialog): 쪽지 팝업 끌기 표시(#1~#3)`
2. `277-3b feat(dialog): 인사 권유·휴대폰 확인·후기·마이샵 사진 끌기 표시(#4~#7)`
