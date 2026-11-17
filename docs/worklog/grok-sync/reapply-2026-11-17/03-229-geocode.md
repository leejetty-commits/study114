# 03. #229 다시 넣기 — 회원 지도 지오코딩 시군구 폴백

대기 가능. 02(#228) 머지 뒤(같은 함수 `geocodeMemberLabel`을 고친다. 02 없이 하면 충돌).

## 목적

#229(`46c1fed9`): 동 질의가 비면 센텀동 특례 대신 시·군·구로 낮춰 한 번 더 찾는다. 질의가 3단어 이상일 때만.

## 명령

```
git fetch origin
git switch -c work/reapply-229 origin/main
git revert --no-edit 738fc840
npm run build:dothome
```
박스 확인: 01·02 위 충돌 없음.

## 허용 파일

`preview/shared/naver-map.js`, `docs/worklog/2026/11/2026-11-17-study-room-pills-map.md`. 기록 1개 `docs/worklog/2026/11/2026-11-17-reapply-229.md`.

## 위험 점검

지오코딩 최대 2번, 반복·리스너·전역 CSS 없음. 센텀동은 이제 해운대구 중심으로 뜬다(우동 센텀 특례 없어짐). 02에서 센텀동 지도가 센텀 쪽에 뜨던 것이 구 중심으로 바뀌는 게 정상이다.

## 수락(추가)

테스트 부산공부방: 우동·중동 지도 그대로, 센텀동은 해운대구 중심 지도. 없는 동이면 「못 찾음」 문구.

## 공통

- 빌드: `npm run build:dothome`.
- 수락: 00-INDEX 「공통 수락 점검」 전부(공부방·과외쌤·학생 메뉴 실클릭, 멈춤 계측) + 아래 항목.
- 금지: 허용 파일 밖 수정, revert 결과 손질, 충돌 손으로 풀기(나면 멈추고 보고). `main.js` 수정 금지.
- 되돌리기: `git revert -m 1 <이 PR merge 커밋>`으로 새 PR.
