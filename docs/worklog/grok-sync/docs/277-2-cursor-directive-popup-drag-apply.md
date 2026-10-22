# 277-2 지시서 — 남은 팝업에 끌어서 옮기기 붙이기

- 기준: 277-1 병합된 main. 브랜치: cursor/277-2-popup-drag-apply-20261021
- **277-1 병합 후 시작.** 마이샵 사진 크게 보기(myshop-render.js:250)는 275 파일이라 이번에 안 함.

## 0-1. 종현에게 물을 것
- 없음. 표의 「제외」는 추천대로 둔다(종현이 아침에 바꾸면 따름).

## 1. 전체 팝업 표 (1e42b27d 기준)
| # | 화면 | 파일:줄 | 모드 | 이번 |
|---|---|---|---|---|
| 1 | 홈 공지·이벤트 팝업 | preview/home-ui/src/home-popup/mount.js:43, :66, :93 | 모두 | 붙임 |
| 2 | 운영 안내 팝업 | preview/home-ui/src/site-ops-chrome.js:109 | 모두 | 붙임 |
| 3 | 더보기 팝업(오른쪽) | preview/home-ui/src/rail-popup.js:249 | 모두 | 붙임 |
| 4 | 비교하기 | preview/home-ui/src/compare-modal.js:180 | 학생 | 붙임 |
| 5 | 찜 목록 | preview/home-ui/src/user-actions-ui.js:102 | 학생 | 붙임 |
| 6 | 후기 보기 | preview/home-ui/src/provider-reviews/sheet.js:239 | 모두 | 붙임 |
| 7 | 쪽지 이용권 안내 | preview/home-ui/src/messages/overlays.js:60 | 회원 | 붙임 |
| 8 | 쪽지 쓰기 | 〃 :170 | 회원 | 붙임 |
| 9 | 쪽지 신고 | 〃 :350 | 회원 | 붙임 |
| 10 | 결제 상세 | preview/home-ui/src/plans/receipt.js:12 | 공부방·과외쌤 | 붙임 |
| 11 | 등록점검 고치기 서랍 | preview/home-ui/src/study-room-reg/registration-check-edit.js:164 | 공부방 | 제외(옆 서랍, 끌기 안 어울림) |
| 12 | 휴대폰 확인 | preview/home-ui/src/study-room-reg/phone-verify-gate.js:71 | 공부방 | 붙임 |
| 13 | 메일 인증 안내 | preview/home-ui/src/email-verify-overlay.js:14 | 회원 | 붙임 |
| 14 | 이용안내 살펴보기 | preview/home-ui/src/guide/screens.js:516 | 비회원·모두 | 붙임 |
| 15 | 가입 완료 안내 | preview/auth-ui/src/screens/signup-complete.js:47 | 가입 직후 | 붙임 |
| 16 | 확대카드 | preview/home-ui/src/detail-decision/detail-shell.js:303-336 (자체 끌기 bindFloatingDrag :161-237, 끌기 막대 :306) | 모두 | 자체 끌기를 공용 함수로 바꿈(막대·모양 그대로) |
| 17 | 마이샵 사진 크게 보기 | preview/home-ui/src/myshop/myshop-render.js:250 | 공부방 공개 | 제외(275 파일, 크게 보기는 끌기 불필요) |
| 18 | 관리자 서랍 | preview/admin/…/a28-screens-shared.js:60 | 관리자 | 제외 |
| 19~22 | 기본정보·상세·사진 자르기 | 277-1 표 | — | 277-1에서 끝 |

- 각 팝업 머리줄(제목 줄)을 handle로 넘긴다. 머리줄이 없는 팝업(예: #2, #13)은 제목 h2가 든 첫 줄 div를 handle로 쓴다. 없으면 표시만 하고 건너뜀.
- import 줄: 각 파일 맨 위에 `import { bindDraggableDialog } from '<상대경로>/shared/draggable-dialog.js'` 추가. home-ui는 기존 4파일과 같은 경로 방식(@shared 별칭 있으면 그것) 사용 — embedded-panels.js의 import 줄을 그대로 본뜬다. auth-ui도 tutor-ui step-basic.js 방식 그대로.
- 다시 열면 가운데: 닫을 때 destroy(), 열 때 bind 새로.

## 2. 하지 않는 것
- 팝업 모양·크기·문구·열고 닫는 조건, 모바일 동작, 표의 「제외」, 275 파일.

## 3. 확인 (1280 · 390)
- 1280: 표에서 「붙임」 하나하나 열어 머리줄 끌기 → 화면 안에서 멈춤 → 닫고 다시 열면 가운데. 확대카드는 끌기 막대로 같은 동작, 위치 기억 없음.
- 390: 모두 원래 자리, 끌리지 않음, 스크롤 정상.
- 쪽지 쓰기 글칸에서 글자 선택(마우스 끌기)할 때 팝업이 안 움직임.
- 로컬 새 테스트 계정만(학생·공부방·과외쌤 각 1개). 쪽지 실제 발송·결제는 하지 않음(결제 상세는 로컬 기존 테스트 기록 없으면 건너뜀).

## 4. 멈출 때
- 팝업이 공용 함수 규칙과 부딪혀 열고 닫는 코드를 크게 바꿔야 할 때 → 그 팝업만 빼고 보고.
- 확대카드 자체 끌기를 바꾸다 카드 안 버튼이 안 눌리면 → 확대카드는 되돌리고 보고.

## 5. 커밋 나누기
1. 277-2 feat(dialog): 홈 공용 팝업(#1~#6, #14)
2. 277-2 feat(dialog): 쪽지·결제·공부방·인증 팝업(#7~#13, #15)
3. 277-2 refactor(dialog): 확대카드 끌기를 공용 함수로(#16)

## 6. 보고
- 커밋 3줄, 표에 결과 칸(됨/건너뜀+이유), 1280 스크린샷 3장(아무 팝업 끝까지 끈 것), 390 1장. 쉬운 말로.
