# 277-3a 지시서: 끌기 표시 ① (바탕 있는 팝업 8개)

- 브랜치: `cursor/277-3a-popup-drag-marks-20261023` (origin/main에서 새로 만든다)
- 기준 커밋: **260fbcf6** (Merge 277-2). 아래 줄 번호는 모두 260fbcf6에서 직접 확인했다.
- **시작 조건**: `git fetch origin && git merge-base --is-ancestor 260fbcf6 origin/main && echo OK || echo MISSING`. MISSING이 나오면 멈추고 보고한다.
- main이 260fbcf6보다 새로우면 아래 줄 번호를 다시 확인한다. 3줄 넘게 밀렸으면 고치기 전에 보고한다.

## 왜 하나
277-2 자동 끌기(`preview/shared/dialog-drag-auto.js`)는 화면 전체를 덮는 바탕을 끌지 않는다(:58 clientWidth/Height 비교). 그래서 바탕에 `role="dialog"`가 붙은 팝업은 지금 **아예 끌리지 않는다.** 안쪽 상자에 "여기를 끈다" 표시를 붙여야 끌린다.

**중요(260fbcf6 코드 확인)**: 잡을 곳을 찾는 `findHandle(box)`(:33-49)는 `aria-labelledby`를 **안쪽 상자에서** 읽는다. 그런데 아래 팝업들은 `aria-labelledby`가 바깥 바탕에 있다. 그래서 제목이 저절로 잡히지 않는다. **8개 모두 제목 줄에 `data-drag-handle`을 직접 붙인다.**

## 1. 붙일 표시 (260fbcf6 기준)
| # | 팝업 | role 붙는 줄 | `data-drag-box` 붙일 곳 | `data-drag-handle` 붙일 곳 |
|---|---|---|---|---|
| 1 | 비회원 「더 보려면 로그인」 | preview/shared/guest-gate-ui.js:200 | `.guest-gate--deep` :205 | 제목 `h2#guest-deep-gate-title` :206 |
| 2 | 오른쪽 레일 이용안내 살펴보기 | preview/home-ui/src/right-rail.js:770 | `.guest-gate--deep` :775 | `h2#rail-guide-peek-title` :776 |
| 3 | 이용안내 살펴보기 | preview/home-ui/src/guide/screens.js:515 | `.guest-gate--deep` :520 | `h2#guide-peek-title` :521 |
| 4 | 동네 인사 모아보기 | preview/home-ui/src/neighborhood-greeting-ui.js:360 | `.ng-feed__card` :396 | `h2#ng-feed-title` :397 |
| 5 | 동네 인사 로그인 막이 | 같은 파일 :795 | `.ng-unavailable__card` :798 | 첫 줄 `<p>` :799 |
| 6 | 동네 인사 알림 | 같은 파일 :859 | `.ng-unavailable__card` :862 | 첫 줄 `<p>` :863 (닫기 버튼 :864에는 붙이지 않는다) |
| 7 | 「이 카드를 벗어납니다」 | preview/home-ui/src/detail-decision/detail-utils.js:228 | `.p24-leave-confirm__panel` :232 | `h3#p24-leave-title` :234 |
| 8 | 운영 팝업 | preview/home-ui/src/site-ops-chrome.js:109 | `.ops-chrome__popup-panel` :111 | `h2#ops-popup-title` :112 |

## 2. 허용 범위 (이 6개 파일만, 속성 추가만)
1. `preview/shared/guest-gate-ui.js`: :205-206
2. `preview/home-ui/src/right-rail.js`: :775-776
3. `preview/home-ui/src/guide/screens.js`: :520-521
4. `preview/home-ui/src/neighborhood-greeting-ui.js`: :396-397, :798-799, :862-863
5. `preview/home-ui/src/detail-decision/detail-utils.js`: :232-234 (이동 확인 팝업만)
6. `preview/home-ui/src/site-ops-chrome.js`: :111-112

허용 범위 안에서도 **속성 이름만 더한다.** 태그·클래스·문구·role·aria·이벤트는 그대로 둔다.

## 3. 금지 범위
- `preview/shared/dialog-drag-auto.js`, `preview/shared/draggable-dialog.js` (277-2에서 끝남)
- `preview/home-ui/src/detail-decision/detail-shell.js` (확대카드 본체, 자기 끌기가 따로 있다)
- `detail-utils.js` 안의 다른 함수 (`renderUncroppedPhoto` 등 사진 부분)
- 모든 CSS 파일, 277-1에서 직접 붙인 4곳, 277-3b 파일 5개(overlays.js, signup-complete.js, phone-verify-gate.js, sheet.js, myshop-render.js)
- 검사 스크립트·기준 사진, `main.js` import, `bindDraggableDialog` 직접 부르기

## 4. 멈춤 규칙
- 위 6개 밖의 파일을 고쳐야 할 것 같으면 **고치지 말고 멈추고 보고**한다.
- 표시를 붙였는데도 끌리지 않으면(자동 파일을 고쳐야 할 것 같으면) 멈추고 보고한다.
- 표의 요소가 그 줄에 없으면 멈추고 보고한다.

## 5. 검수 규칙
- `git diff --name-only origin/main...HEAD`에 위 6개 밖 파일이 하나라도 있으면 **자동 불합격**.
- 바뀐 줄이 `data-drag-box` 또는 `data-drag-handle` 속성 추가가 아니면 불합격.

## 6. 합격 기준 (8개 팝업 각각)
1. **1280, 세로 스크롤바가 보이는 페이지**: 제목 줄을 잡고 끌면 안쪽 상자만 움직인다. 오른쪽 끝은 스크롤바 앞(약 1257px)에서 멈춘다.
2. **화면 전체 바탕은 절대 안 움직인다** (바탕을 잡고 끌어도 제자리. 어두운 막도 그대로 화면 전체를 덮는다).
3. 버튼·링크·입력칸을 눌러 끌어도 끌기가 시작되지 않고, 버튼은 원래대로 동작한다.
4. 닫았다 다시 열면 가운데로 돌아온다.
5. **390**: 끌리지 않고 원래 자리에 있다.
6. 로그인 상태: #1~#3은 비회원, #4~#6은 비회원(#5)·학생 로그인(#4·#6), #7은 확대카드에서 다른 카드로 이동할 때, #8은 관리자가 켠 운영 팝업(비회원 화면).
7. 콘솔 빨간 오류 0. CI(Verify bundle) 성공.

## 7. 증거 스크린샷 (`277-3a-번호-상태.png`)
- 팝업마다: `-1280-scroll-before`, `-1280-scroll-dragged`(오른쪽 끝까지 끈 상태 + 측정값), `-1280-backdrop-try`(바탕을 끌어 본 뒤), `-1280-reopen`, `-390` → 8 × 5 = 40장
- #6 닫기 버튼 눌러 끌어 본 뒤 1장, #1 「로그인」 버튼 눌러 끌어 본 뒤 1장
- 각 팝업 1280 측정값 표: innerWidth, clientWidth, 상자 left·오른쪽 끝

## 커밋 나누기
1. `277-3a feat(dialog): 비회원 막이·이용안내 살펴보기 끌기 표시(#1~#3)`
2. `277-3a feat(dialog): 동네 인사·이동 확인·운영 팝업 끌기 표시(#4~#8)`
