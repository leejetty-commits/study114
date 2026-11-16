# 홈 첫 화면 지도 깜빡임 · 홈↔공부방찾기 재로딩 줄이기 (2026-11-16)

기준: origin/main `913ca8a9` (PR #224 머지 뒤). 브랜치는 origin/main에서 새로 딴다. PR만 올린다.
권장 브랜치: `work/home-cache-fix-2026-11-16`

## 배경 (종현 운영 확인, PR #224 배포 뒤)
1. 과외쌤으로 로그인하면 홈에 지도가 잠깐 보였다가 과외쌤 홈으로 바뀐다. 과외쌤 홈은 지도를 불러올 일이 없다.
2. 공부방 홈에는 지도 위 박스가 없다. 공부방찾기 지도에는 있다.
3. 공부방찾기에 들어가면 지역설정값이 늦게 뜬다. 홈 → 찾기 → 홈 → 찾기로 오가면 매번 공부방 박스·지도·지역값을 다시 받는다. 체감상 2배 느려졌다.

## 원인 (파일:줄, 913ca8a9 기준)

### 1. 과외쌤(학생·공부방도 같음) 로그인 직후 게스트 지도가 먼저 그려짐 — #224 때문 (확인됨)
- 로그인하면 `#/tutor?welcome=1`로 이동한다: `preview/auth-ui/src/screens/login.js:155` (`withLoginWelcome`, `preview/shared/login-welcome.js:15-25`).
- `getCurrentScreen()`은 해시 쿼리를 떼지 않고 `ROUTES[path]`를 찾는다. 그래서 `'/tutor?welcome=1'`이 `'guest'`가 된다: `preview/home-ui/src/state.js:947-949`.
- #224(3a77299b)에서 `shouldPaintBeforeSession()`이 guest일 때 `false`에서 `true`로 바뀌었다: `preview/home-ui/src/main.js:277-278` (이전 cde20e8c의 `main.js:192`는 `return false`). 그래서 세션 전에 게스트 홈이 그려진다(`main.js:624-625`). 게스트 바인드가 네이버 지도, 기준지역, 지역 통계를 부른다: `preview/home-ui/src/guest-sections.js:260, 284, 290`.
- `welcome=1`은 세션 확인 뒤에만 지워진다(`main.js:652` → `login-welcome.js:31-52` replaceState). 그다음 render가 과외쌤 홈을 그린다. 그래서 지도가 잠깐 보였다가 바뀐다.
- 해시 없이 `/`로 들어온 로그인 사용자도 같은 일을 겪는다. `hash || '/guest'`로 guest가 그려지고, 세션 뒤 `main.js:697-706`에서 역할 홈으로 옮겨진다.
- 이전(cde20e8c)에는 guest를 세션 전에 그리지 않아서 지도가 보이지 않았다.
- 부작용: 공부방·학생 로그인 때도 게스트 지도 SDK와 게스트 API가 세션 API와 대역을 나눠 쓴다. 첫 화면이 느려지는 원인 가운데 하나로 추정한다.

### 2. 공부방 홈 「지도 위 박스」 — #224와 무관, 2026-10-05부터 의도된 배치 (확인됨)
- 홈에서는 지도 배너를 일부러 숨긴다: `preview/search-ui/src/search-find-surface.js:314` `hideMapBanner: variant === 'home' && studyRoomPromoMap`. `search-map.js:156`은 이 값이 참이면 `aside.hero-map__banner`를 그리지 않는다.
- 같은 값은 지도 밖 오른쪽 「지역 요약」 카드로 그린다: `preview/home-ui/src/screens/study-room.js:103-134` (`renderStudyRoomAreaCard`, 박스 오른쪽, `tutor-home-split`). 이 카드는 '내' 탭에서만 보인다(`study-room.js:139, 151`).
- 결정 기록: `docs/worklog/grok-sync/docs/193-study-room-box-match-tutor-investigation-2026-10-02.md:632, 645`. 사이트오류-23에서 현황 카드를 지도 안(absolute)에서 박스 오른쪽 칸으로 옮겼고, 커밋 7fb4c87로 2026-10-05에 배포했다.
- #224 diff(cde20e8c..913ca8a9)는 search-find-surface.js, search-map.js, study-room.js를 건드리지 않았다.
- → 코드 수정 없음. 종현이 「지도 위에 다시 올리기」를 원하면 별도 결정이 필요하다(이번 작업 범위 밖).

### 3. 홈↔공부방찾기마다 다시 받음 — 대부분 #224 전부터 있던 구조, #224가 한 단계를 더함
- 홈(`/`)과 찾기(`/search/`)는 서로 다른 SPA다. GNB 「공부방찾기」는 `external: true`로 페이지를 통째로 새로 연다: `preview/shared/preview-links.js:108-109`, `preview/home-ui/src/layout.js:625-627` (`goSameTab`). 그래서 이동할 때마다 JS 메모리 캐시(`study-room-home-seed.js:398-418`의 `bootPromise/liveKey` 등)가 처음부터 다시 만들어진다. (#224 전에도 같음, 확인됨)
- 페이지를 열 때마다 `initAuthSession`이 `/api/auth/me.php`를 받는다(`auth-session.js:125`). 그 뒤 `hydrateSessionDependencies`가 아래 요청을 **차례로 await**한다(`auth-session.js:244-258`).
  1. handoff(`/api/handoff/favorites|compare|recent|student-reviews.php`)와 provider(`/api/paid/status.php`, `/api/paid/notices.php`)
  2. messages(`/api/messages/threads.php`, `entitlements.php`)
  3. registrations(`/api/registrations/study-rooms.php`). 지역설정값(홍보1·저장지역)이 여기서 온다.
  4. exposure(찾기 첫 진입에서는 뒤로 미룸)

  지역값이 맨 뒤에 오고, 끝나면 `auth:session-hydrated`로 화면 전체를 다시 그린다(`home-ui/src/main.js:621-623`, `search-ui/src/main.js:128-131`, `auth-session.js:290-292`). 지도 마운트도 innerHTML로 새로 만들어진다. 그다음 홈은 `searchApi`(`/api/search/search.php`)와 ROI(`/api/paid/roi.php`, `study-room-home-seed.js:358`)를 또 받는다. 찾기는 `/api/search/search.php`를 받는다. (#224 전에도 같음, 확인됨)
- #224 추가분: 역할 홈 화면 코드가 별도 조각이 됐다(`main.js:100-102, 220-224`). 이 조각은 세션 확인 뒤에야 import된다(`main.js:418, 427-428`). 그래서 홈 진입 때 me.php → 조각 받기 → 그리기 → 지역/목록 API 순서로 왕복이 한 번 늘었다. 1번의 게스트 지도 선로딩도 대역을 같이 쓴다. 「2배」 체감은 이 두 가지와 원래 순차 구조가 겹친 결과로 추정한다(실측 없음).

## 고칠 것

### (a) 세션 확인 전 게스트 지도 그리지 않기 (필수)
1. `getCurrentScreen()`(`state.js:947-949`)이 해시 쿼리(`?welcome=1` 등)를 떼고 `ROUTES`를 찾게 한다(`path.split('?')[0]`). 그러면 `#/tutor?welcome=1`이 바로 tutor가 되어 세션 전 게스트 셸을 그리지 않는다. `getCurrentScreen`을 쓰는 다른 곳도 같은 기준이 되는지 확인한다.
2. guest 화면이라도 「로그인했던 흔적」 힌트가 있으면 세션 전에 게스트 지도를 그리지 않는다. 대신 지도가 없는 중립 셸(헤더 + 회색 스켈레톤)만 그린다.
   - 힌트: 로그인·세션 성공 때 `localStorage['study114.last-role']`에 역할 문자열만 저장한다(`tutor|study_room_owner|guardian_student|admin`). 로그아웃·비로그인 판정 때 지운다. 토큰·이메일·ID 같은 개인정보나 비밀은 넣지 않는다.
   - 힌트가 없는 진짜 손님은 지금처럼 게스트 셸을 먼저 그린다(#224 속도 이득 유지).
   - 힌트가 있으면 역할 홈 조각을 me.php와 **동시에** 미리 받아 둔다(`ROLE_SCREEN_LOADERS[hint]()` 호출만, 그리기는 세션 뒤).
3. 과외쌤·학생 홈에서는 게스트 지도 바인드(`guest-sections.js:284`)와 게스트 통계 API가 한 번도 실행되지 않아야 한다.

### (b) 공부방 홈 지도 위 박스
- 코드 변경 없음. 2026-10-05 결정(193 문서 632·645줄)대로 오른쪽 「지역 요약」 카드가 있다. '내' 탭에서 카드가 보이는지만 회귀로 확인한다.

### (c) 지역설정값·홈 공부방 박스 캐시 (페이지를 넘어가도 유지)
홈과 찾기는 다른 페이지라 JS 메모리 store만으로는 유지되지 않는다. 그래서 **sessionStorage 스냅샷 + 메모리 store** 두 층으로 만든다.
1. 공유 모듈(예: `preview/shared/session-snapshot.js`)을 만든다.
   - 키: `study114.snap.v1`. 값: `{ user_id, role_type, saved_at, registrations: {studyRooms|tutors|students 응답}, providerStatus, roomHomeList?: {key, items, at}, roi?: {roomId, data, at} }`.
   - 비밀번호·토큰·2차 비번·결제키는 넣지 않는다. 이미 화면에 보이는 등록/지역 데이터만 넣는다.
2. 페이지를 열면 me.php 응답의 `user_id`·`role_type`이 스냅샷과 같을 때만 스냅샷으로 먼저 그린다. 그다음 뒤에서 다시 받아 바뀐 경우에만 다시 그린다(stale-while-revalidate).
   - 홈 공부방 목록과 ROI는 TTL 3분 안이면 다시 받지 않는다.
   - registrations는 늘 뒤에서 다시 받는다(정합성 우선).
3. 무효화
   - 로그아웃(`auth-session.js` logout), `auth:role-change`, 세션 user_id나 role 불일치 → 스냅샷 삭제
   - 등록·지역 저장 성공(study-rooms/tutors/students POST·PUT 성공 콜백) → 해당 부분 삭제 또는 갱신
4. `hydrateSessionDependencies`(`auth-session.js:244-258`)에서 registrations를 맨 앞으로 옮기거나 provider·messages와 `Promise.all`로 병렬화한다. 서로 의존하지 않는지 먼저 확인한다. 의존이 있으면 registrations만 먼저 받는다.
5. `auth:session-hydrated` 전체 재렌더(`home-ui/src/main.js:621`, `search-ui/src/main.js:128`)는 데이터가 실제로 바뀐 경우에만 하게 한다. 지도 마운트가 다시 만들어지지 않게 한다.
6. 같은 페이지 안의 메모리 캐시(`study-room-home-seed.js` `bootPromise/liveKey`)는 그대로 두고, 스냅샷으로 초기값만 채운다.

## 수락기준
- 과외쌤·학생: 로그인(`?welcome=1` 포함)과 `/` 직접 진입 모두 게스트 지도가 0프레임도 보이지 않는다. Network에 네이버 지도 SDK와 게스트 통계 요청이 없다.
- 비로그인 손님: 지금처럼 게스트 홈이 세션 전에 먼저 보인다(#224 이득 유지).
- 공부방: 홈 → 공부방찾기 → 홈 → 공부방찾기에서 두 번째 진입부터 지역값·공부방 박스가 즉시(스냅샷) 보인다. `/api/search/search.php`·`/api/paid/roi.php` 재요청은 TTL 안에서 0회다. 왕복별 요청 목록(전/후)을 표로 남긴다.
- 지역 저장 직후 홈·찾기에 새 값이 바로 반영된다(옛 스냅샷이 남지 않는다).
- 로그아웃 뒤 다른 역할 계정으로 로그인하면 이전 계정 값이 한 번도 보이지 않는다.
- 콘솔 오류 0. 빌드 성공. entry 크기가 #224 수준(약 652kB)보다 늘지 않는다.

## 회귀 범위
- 공부방 홈('내' 탭 박스 + 오른쪽 지역 요약 카드, 다른 탭), 과외쌤 홈, 학생 홈, 비로그인 게스트 홈
- 공부방찾기·과외쌤찾기·학생찾기(로그인/비로그인), 지역 변경·저장
- 마이페이지 배지 → 관리자 콘솔 진입(2차 비번 화면까지)
- 로그아웃 → 다른 역할 로그인 전환
- 390px 모바일 폭 1회

## 금지
- 머지 금지(종현 확인 뒤 Cursor가 머지). force push, reset --hard, stash drop 금지.
- 운영 SQL 없음. DB 변경 없음. 비밀(키·비번·토큰)은 코드·문서·커밋·스냅샷에 넣지 않는다.
- 프레임워크 교체 금지. dirty worktree 건드리지 않음. PR #198 머지 금지.

## 보고 항목
- PR 번호·브랜치·tip SHA
- 바꾼 파일 목록과 각 요지
- 수락기준별 통과 여부, 왕복 Network 요청표(전/후), 과외쌤 로그인 첫 프레임 스크린샷
- entry·역할 조각 크기(전/후)
- 남은 위험(예: 스냅샷 무효화 누락 가능 지점)
