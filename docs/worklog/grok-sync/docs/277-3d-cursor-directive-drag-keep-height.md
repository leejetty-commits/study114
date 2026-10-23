# 277-3d 지시서: 끌기 시작할 때 팝업 높이가 커지지 않게 (draggable-dialog.js 한 줄)

종현 확정 2026-10-23 t2418. 기준: main 22ae8df6 (277-3c 병합). 없으면 멈추고 보고.
브랜치: `cursor/277-3d-drag-keep-height-20261023` (이 브랜치에만 push. merge·force-push·git add -A 금지)

## 문제
로그인 확대카드 머리줄을 누르는 순간 카드 세로 길이가 브라우저 높이만큼 늘어난다.
원인: `preview/shared/draggable-dialog.js:71` `pin()`이 `dialog.style.maxHeight`를 `innerHeight − 16px`로 덮어써,
CSS의 원래 최대 높이(예: `.p24-modal` `max-height: min(92vh, 720px)`, home-member-flows.css:7)가 풀린다.

## 고칠 곳 (허용 범위: 이것뿐)
| 파일 | 줄 | 바꿀 내용 |
|---|---|---|
| preview/shared/draggable-dialog.js | :71 (pin 안 maxHeight 한 줄) | 누르기 직전 계산된 max-height(getComputedStyle)와 `innerHeight − 16px`(최소 160) 중 **작은 쪽**을 넣는다. 계산값이 `none`이면 지금처럼 `innerHeight − 16px`. |

- 같은 `pin()` 안에서 계산용 변수 1~3줄 추가는 허용.

## 금지 범위
- 다른 모든 파일 (dialog-drag-auto.js, detail-shell.js, 모든 CSS, 277-1·3a·3b 파일, 테스트·기준 이미지, main.js).
- draggable-dialog.js 안 다른 줄 (place, reset, EDGE, 이벤트, 721px 조건).
- 위 밖이 필요하면 **멈추고 보고**. 검수 때 목록 밖 파일이 바뀌면 불합격.

## 합격 기준 (Cursor가 직접 돌려 숫자·스크린샷으로 증명)
Edge 1280×800, 스크롤 막대 보이는 상태.
1. 로그인 공부방 확대카드, 과외쌤 확대카드: 머리줄 누르기 전후 `offsetHeight` 같음(±1px). 끌어서 오른쪽 끝 1272·위 8에서 멈춤. 끌다 바깥에서 놓아도 안 닫힘. 다시 열면 가운데.
2. 277-1 팝업 4개(과외쌤 기본정보 수정, 공부방 기본정보 수정, 홈 안 공부방 상세, 사진 자르기): 누르기 전후 높이 같음.
3. 내용이 짧은 팝업(공지 팝업 등 1개): 높이 같음.
4. 브라우저 높이를 600으로 줄였을 때 긴 카드는 600−16 안에 들어오고 안에서 스크롤됨.
5. 390: 끌리지 않고 제자리 그대로.
6. 비회원 학생 확대카드: 기존 자기 끌기 그대로.

스크린샷: `1280-room-before.png`, `1280-room-after-drag.png`, `1280-tutor-after-drag.png`, `1280-tutor-edit-after-drag.png`, `600h-room-after-drag.png`, `390-room.png`.
각 경우 누르기 전·후 offsetHeight 숫자 표로 보고.

빌드 5개, verify-home-news-row, verify-rail-info-banners(기존 실패 2건만 허용), CI 결과 첨부.
