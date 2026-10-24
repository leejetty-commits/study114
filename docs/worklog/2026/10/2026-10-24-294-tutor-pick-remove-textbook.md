# 294 과외쌤 픽 카드에서 주교재 줄 빼기

**과제 ID:** 294  
**브랜치:** `cursor/294-tutor-pick-remove-textbook-20261024`  
**작업일:** 2026-10-25  
**기준:** `origin/main` `41119bde`

## 지시서 요지

과외쌤 픽 카드에서만 「주교재」 줄을 뺀다. 정보 칸(대표사진·배지·슬로건·행동 제외)은 픽 14 → 13, 프라임 15(소개·주교재 포함)는 그대로. 프라임 572줄 주교재는 유지. 베이직 10은 그대로.

세기 기준은 화면 줄이 아니라 정보 칸이다. 화면 줄로 세면 프라임이 12라서, 사용자 확인 후 정보 칸으로 진행했다.

## 정보 칸

| 카드 | 이전 | 이후 |
| --- | --- | --- |
| 베이직 | 10 | 10 |
| 픽 | 14 | 13 (주교재 없음, 소개 없음) |
| 프라임 | 15 | 15 (소개·주교재 포함) |

픽 13: 위치, 학적상태, 학교·학과, 경력, 과외비(주회·분 포함), 성명, 제출자료, 대상, 과목, 수업장소, 원생수, 특징, 강의스타일.

프라임 15: 픽 13 + 주교재 + 소개.

## 수정

| 파일 | 내용 |
| --- | --- |
| `preview/home-ui/src/exposure-render.js` | 픽 갈래(`stack`) 주교재 한 줄 삭제. 프라임 갈래 주교재는 유지(삭제 후 571줄) |
| `scripts/verify-card-field-paths-20261009.mjs` | 픽 기대값에서 주교재 제거. 정보 칸 13·15 단언 추가. 프라임 기대값의 주교재는 유지 |
| `scripts/verify-room-card-slots-20261009.mjs` | 픽 빈 카드는 주교재 칸 없음. 프라임 빈 카드는 주교재 「—」 |
| `scripts/verify-tutor-search-fields.mjs` | 픽 카드 단언에서 주교재 값 제거, 주교재 줄 없음 확인. 프라임·확대카드 주교재 단언은 유지 |
| `docs/internal/73-tutor-basic-card-lock.md` | 주교재 표시 카드를 프라임만으로. 픽 목록에서 주교재 삭제. 정보 칸 13·15 |
| `docs/ssot/11-main-exposure-and-compare.md` | 픽은 주교재 제외 13칸. 프라임은 주교재 유지 15칸 |
| `docs/worklog/2026/10/screenshots/294-tutor-pick.png` | 값을 채운 픽 카드 |
| `docs/worklog/2026/10/screenshots/294-tutor-prime.png` | 값을 채운 프라임 카드 |

`docs/internal/47-study-room-home-card-map.md` 는 과외쌤 픽 수·주교재 목록이 없어 고치지 않았다.

범위 밖이라 고치지 않은 단언: `docs/internal/48-tutor-home-card-map.md` 상세 2단계 픽 노출 칸에 주교재가 남아 있다.

## 확인

| 검사 | 결과 |
| --- | --- |
| `node --check` (`exposure-render.js`, 고친 `.mjs` 3개) | 통과 |
| `verify-card-field-paths-20261009.mjs` | 픽·프라임 경로 통과. 정보 칸 13·15 통과. 공부방 소개·과외쌤 확대카드 성별·원생수 11건은 이번 수정과 무관한 기존 실패 |
| `verify-room-card-slots-20261009.mjs` | 80 passed, 0 failed |
| `verify-tutor-search-fields` | 픽 주교재 줄 없음·프라임 주교재 유지 통과. `searchRooms` 본문 비교 1건은 기존 실패 |
| `verify:detail-card-all-fields` | 117 passed, 25 failed. 282 작업기록의 main 기준(117/25, 과외쌤 확대카드 원생수·성별)과 같다 |
| `verify:pickprime-purchase-gate` | ok |
| `verify:card-badge-layout` | 렌더 함수가 `91edd6f8` 과 다르다는 1건 실패. 공부방 함수는 282에서 이미 달라졌고, 이번 픽 주교재 삭제가 과외쌤 함수 차이에 더해진다. 배지 배치 항목은 통과 |

개발 서버 `http://127.0.0.1:5194/294-card-check.html` (작업 트리, 값은 화면용으로 채움). 확인 뒤 임시 페이지는 지웠다.

- 픽: 정보 칸 13, 「—」 없음, 주교재·소개 없음
- 프라임: 정보 칸 15, 「—」 없음, 주교재 「개념원리」, 소개 있음

## 승인

| 커밋 | 승인자 | 일시 |
| --- | --- | --- |
| (이번 커밋) | 승인 대기 | |
