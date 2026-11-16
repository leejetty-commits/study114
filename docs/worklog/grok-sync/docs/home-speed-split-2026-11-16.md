# 홈 첫 화면 로딩 속도 개선 지시서 (2026-11-16)

기준: origin/main cde20e8c 이후 최신. 새 .wt 워크트리, 새 브랜치 `work/home-speed-split-2026-11-16`.
목표: 게스트 홈(`#/guest`)의 첫 글자 표시 시간 단축. 지금 관건은 홈 로딩 속도다.

## 배경 (11-15 측정)
- 엔트리 `assets/index-*.js` 1,318,589B (gzip 368,711). 로그인 후 화면 144모듈을 떼면 엔트리 약 50.7% 감소 추정.
- 첫 HTML은 빈 `<div id="app">`. 스크립트 실행 후에도 세션·게시판·고객센터 요청이 끝나야 글자를 그림.
- KT망은 Cloudflare LAX 경유라 왕복이 길다. 받는 양과 기다리는 요청 수를 줄이는 게 핵심.
- 로컬 브랜치 `work/entry-lazy-screens-2026-11-15`(미커밋)가 있으면 참고만 하고, 이 지시서 기준으로 새로 한다.

## 범위 (이 순서로, 묶음마다 커밋)
### 1단계: 화면 단위 dynamic import
`main.js`에서 아래 화면의 정적 import를 라우트 진입 시 `import()`로 바꾼다. 기존 `loadAdminScreen` 방식과 같게.
1. plans (`plans/index.js` 등. `plans/router.js`의 `PLANS_REDIRECTS` 표는 엔트리에 둔다)
2. mypage (`mypage/index.js`)
3. 역할 홈 parent·study-room·tutor 화면, 그리고 search-find-* (게스트는 안 씀)
4. 등록 화면: study-room-reg, tutor-reg, student-reg, study-room-ui·tutor-ui 등록 단계, `shared/study-room-basic-form.js`
5. messages, myshop(공개 마이샵 포함 여부는 측정 후 판단), provider-reviews inbox, submission-board, 탈퇴 사유 UI
- 엔트리에 남길 것: 게스트 홈·레이아웃·노출 카드(`exposure-render.js`)·우측 레일, 해시 판별·라우터, `auth-session`, `admin-fetch`(콘솔 2차 비밀번호 게이트), `route-access`, 팝업·ops 크롬.
- 각 화면 진입 중에는 기존 로딩 표시(또는 가벼운 "불러오는 중") 사용. 빈 화면 깜빡임 금지.

### 2단계: 조각 로딩 실패 대비
- 배포 직후 옛 조각 요청 실패(`Failed to fetch dynamically imported module`, `vite:preloadError`) 시 1회만 자동 새로고침(sessionStorage 플래그로 무한 루프 방지).
- 배포는 FTP 덮어쓰기라 옛 assets가 남는다. 배포 설정에 assets 삭제 옵션을 추가하지 말 것.

### 3단계: 게스트 셸 먼저 그리기
- 비로그인 판정 전이라도 게스트 홈 셸(히어로·레이아웃)을 먼저 그리고, `me.php`·게시판·고객센터·공지 응답은 뒤에서 채운다.
- 로그인 사용자로 판정되면 기존대로 역할 홈으로 전환. 이때 게스트 화면이 잠깐 보였다 바뀌는 것은 허용하되, 로그인 사용자에게 게스트 전용 버튼을 눌러 잘못 이동되는 일은 없어야 한다.

### 4단계: 관리자 진입 정리 (속도에 도움 될 때만)
- 종현 승인: 홈 화면(상단 등)에 있는 「관리자 콘솔」 진입을 없애고 마이페이지의 「관리자 콘솔」 배지로만 들어가게 해도 된다.
- 엔트리에 남은 admin 모듈(`a28-copy.js`, `site-settings-store.js`, `admin-backend.js`, `admin-api.js`)을 관리자 진입·관리자 사용자일 때만 불러오게 할 수 있으면 한다. `site-settings-store.js`의 공개 설정처럼 게스트가 쓰는 부분은 별도 가벼운 파일로 분리.
- `admin/router.js` 경로 판별과 `admin-fetch.js` 2차 비밀번호 게이트는 동작을 바꾸지 않는다. 콘솔 진입 시에만 2차 비밀번호를 묻는 규칙 유지.

### 하지 않을 것
- 프레임워크 교체, 서버 렌더링, 호스팅·배포 방식 변경.
- 인증·권한·2차 비밀번호·결제·환불 로직 변경. 라우트 주소 변경.
- CSS 분할(`cssCodeSplit: false` 유지). 지도 SDK 지연은 이번 범위 밖.
- 머지·force push·reset --hard·stash drop. 운영 SQL 없음.

## 수락 기준
1. 빌드 후 엔트리 index-*.js 크기(원본·gzip) 전후 표. 목표: 원본 40% 이상 감소.
2. 게스트 홈 첫 글자까지 시간 전후 비교(Chrome 성능 탭, Fast 4G·CPU 4x 감속, 시크릿 3회 평균).
3. 회귀 점검(로컬 PHP API 포함 Docker 환경): 비회원 홈·찾기·유료상품·FAQ / 학생·공부방·과외쌤 로그인→역할 홈·마이페이지·등록·쪽지·구매이력 / 관리자 로그인→마이페이지 배지→2차 비밀번호→콘솔. 콘솔 오류 0건.
4. 옛 조각 실패 시뮬레이션(조각 파일 이름 바꿔 요청 실패) → 1회 새로고침으로 복구되는지.
5. PC·모바일(390) 스크린샷: 게스트 홈, 역할 홈 3개, 마이페이지, 관리자 진입.
6. 작업 기록 `docs/worklog/2026/11/2026-11-16-home-speed-split.md`.

## 보고
새 브랜치 tip, PR 번호(PR만 열고 머지 금지), 수락 기준 1~4 숫자, 바뀐 파일 목록, 남은 위험.
