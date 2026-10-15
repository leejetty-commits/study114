# 2026-10-16 234c-3c 찾기 첫 진입 roi.php를 목록 뒤로

기준: `main` `2d9be387`. 브랜치 `cursor/find-roi-later-20261016`. `main`에는 넣지 않는다.

## 지시 요지

찾기 첫 진입의 `roi.php`가 어디서 나가고 어디에 쓰이는지 코드 전에 적는다. 카드·지도·레일에 필요 없으면 목록 뒤에 보내거나, 그 값을 쓰는 화면을 열 때 보낸다. 필요하면 멈추고 이유만 보고한다.

## 출처 (수정 전)

`preview/search-ui/src/screens/search-page.js` 240행 `bootStudyRoomHome(rerender)`. 조건은 로그인·이메일 인증된 공부방 회원이 공부방찾기(`tab === 'room'`)일 때.

그 함수 `preview/home-ui/src/study-room-home-seed.js` 361행 `ensureLifetimeViews(room?.id)`가 목록 `search.php`와 `Promise.all`로 같이 나간다. 요청은 `paid-api.js` 33행 `fetchRoiSummary(7, id)` → `GET /api/paid/roi.php?days=7&study_room_id=<내 공부방 id>`. 응답 `lifetime_views`는 `readStudyRoomMemberBox().views`에 들어가고, 화면은 홈 `screens/study-room.js` 97행 내 현황의 「조회」칸이다.

과외쌤찾기는 `bootTutorHome`(`tutor-home-seed.js` 309행 `fetchRoiSummary(7)`)을 부르지 않는다. 그 호출은 홈 `screens/tutor.js` 161행뿐이다. 학생찾기도 `roi.php`를 부르지 않는다.

## 판단

찾기 첫 화면의 카드·지도·레일은 이 값을 읽지 않는다. 그래서 공부방찾기만 목록이 끝난 뒤에 보낸다. 홈이 이 함수를 먼저 부르면 예전처럼 목록과 같이 받는다. 서버·과외쌤찾기·학생찾기·레일·노출 풀은 그대로다.

## 요청 순서

| 경우 | 바꾸기 전 | 바꾼 뒤 |
|---|---|---|
| 로그인 공부방, 공부방찾기 | 목록 `search.php`와 `roi.php`가 겹침 | 목록이 끝난 뒤 `roi.php` 1건. 겹치지 않음 |
| 로그인, 과외쌤찾기·학생찾기 | `roi.php` 0 | 0 |
| 비회원 | 0 | 0 |
| 확인 실패, 마지막 로그인이 공부방 | 목록과 `roi.php`가 겹침 | 목록 뒤 `roi.php` 1건 |
| 확인 실패, 남겨 둔 로그인 없음 | 0 | 0 |

카드 id·등급은 같은 응답에서 `11:basic,12:pick,13:prime`. 조회 숫자 128도 같다. 검사 `scripts/verify-find-roi-later.mjs` OK 19.

## 검수

이 세션은 자기 작업을 승인하지 않는다.
