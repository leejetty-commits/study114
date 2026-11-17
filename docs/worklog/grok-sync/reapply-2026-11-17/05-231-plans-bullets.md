# 05. #231 다시 넣기 — 공부방 홈 박스 정렬·유료상품 글머리

대기 가능. 04 뒤. CSS만.

## 목적

#231(`3237f574`): 공부방 홈 상단 박스 2단 줄 위치 조정, 유료상품 화면 문단에 고객센터와 같은 글머리 점.

## 명령

```
git fetch origin
git switch -c work/reapply-231 origin/main
git revert --no-edit 3bb8d42b
npm run build:dothome
```
박스 확인: 충돌 없음.

## 허용 파일

`preview/home-ui/src/styles/home-listings.css`, `preview/home-ui/src/styles/zip-guide.css`, `docs/worklog/2026/11/2026-11-17-study-room-box-plans-bullets.md`, `docs/worklog/2026/11/shots-plans-bullets/*.png`. 기록 1개 `docs/worklog/2026/11/2026-11-17-reapply-231.md`.

## 위험 점검

- 글머리 선택자는 `.home-app--plans-hub`·`.plans-layout` 안의 정해진 문단만. 전역 아님. `display:none`·`!important` 없음.
- `::before`는 `position:absolute` 점 하나. 클릭을 가리지 않는다(문단 왼쪽 여백 안).
- home-listings는 `.home-shell--study_room .my-box__row--*` 격자 위치만.

## 수락(추가)

유료상품 홈·노출상품·쪽지권 화면 PC·모바일: 문단 앞 점, 버튼·링크 클릭 정상. 공부방 홈 박스 2단이 겹치지 않음.

## 공통

- 빌드: `npm run build:dothome`.
- 수락: 00-INDEX 「공통 수락 점검」 전부(공부방·과외쌤·학생 메뉴 실클릭, 멈춤 계측) + 아래 항목.
- 금지: 허용 파일 밖 수정, revert 결과 손질, 충돌 손으로 풀기(나면 멈추고 보고). `main.js` 수정 금지.
- 되돌리기: `git revert -m 1 <이 PR merge 커밋>`으로 새 PR.
