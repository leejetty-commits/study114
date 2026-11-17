# 04. #230 다시 넣기 — 공부방 홈 알약을 두 탭이 같이 기억

대기 가능. 03 뒤.

## 목적

#230(`9b4b5d52`): 홈에서 고른 알약 동을 「우리동네 공부방」·「우리동네 학생」 탭이 같이 쓰고, 탭을 오가도 유지(sessionStorage `study114.studyRoomHomePromoIndex`). 로그아웃 때 지움.

## 명령

```
git fetch origin
git switch -c work/reapply-230 origin/main
git revert --no-edit 815b7ff2
npm run build:dothome
```
박스 확인: 01~03 위 충돌 없음. 02의 수정 블록과 겹치지 않음. 02 수정 + #230 파일로 모의 실행해도 무한 다시 그리기 없음.

## 허용 파일

`preview/home-ui/src/{auth-session.js,provider-home.js,screens/study-room.js,study-room-home-seed.js}`, `preview/search-ui/src/{search-find-place.js,search-find-surface.js}`, `preview/shared/chrome-session.js`, `docs/worklog/2026/11/2026-11-17-study-room-promo-tab-memory.md`. 기록 1개 `docs/worklog/2026/11/2026-11-17-reapply-230.md`.

## 위험 점검

- `renderStudyRoom`이 그릴 때 sessionStorage를 읽기만 한다. 다시 그리기 없음.
- `bootStudyRoomStudentDemand`: 키가 같으면 기존 promise 반환. 반복 없음.
- **동작 주의:** `studentUseHomePick`은 한 번 켜지면 안 꺼진다. 그래서 홈을 한 번 연 뒤에는 공부방의 **학생찾기**도 대표 동 대신 고른 알약 동으로 뜬다. 코드 주석(「학생찾기 진입은 대표 동」)과 다르다. 이번엔 그대로 넣고, 수락 5에서 확인만 한다. 대표 동이 맞으면 별도 PR로 고친다(이 지시서에서 고치지 않는다).
- capture·preventDefault·hashchange 없음.

## 수락(추가)

1. 공부방 홈에서 홍보2 알약 → 「우리동네 학생」 탭 → 같은 동.
2. 탭을 오가도 알약 유지. F5 뒤에도 유지.
3. 로그아웃 → 다시 로그인 → 대표 알약.
4. 다른 알약 누르면 바뀜.
5. 홍보2를 고른 채 학생찾기 메뉴 → 지역이 대표 동인지 홍보2 동인지 기록(결정은 종현).

## 공통

- 빌드: `npm run build:dothome`.
- 수락: 00-INDEX 「공통 수락 점검」 전부(공부방·과외쌤·학생 메뉴 실클릭, 멈춤 계측) + 아래 항목.
- 금지: 허용 파일 밖 수정, revert 결과 손질, 충돌 손으로 풀기(나면 멈추고 보고). `main.js` 수정 금지.
- 되돌리기: `git revert -m 1 <이 PR merge 커밋>`으로 새 PR.
