# 2026-10-09 무결성 점검 남은 문제 수정 (1차)

- 브랜치: `cursor/integrity-fix-20261009` (기준 `origin/main` `74f3e395`)
- 근거 보고: `2026-10-08-integrity-studyroom-mode.md`(A 손님·B 원장), `2026-10-08-integrity-tutor-mode.md`(C 과외쌤), `2026-10-09-integrity-recheck.md`(재확인)
- 배포: **안 함.** 사용자 승인 후.

## 지시 원문

```text
(15:07 무렵) 없는 공부방 번호로 들어가면 「소개를 불러오는 중…」에서 멈춤 ===> 수정해야 함. '공부방 번호'가 뭘 의미해? 없음으로 나와야 함.
고민방을 주소로 바로 열면 로그인했어도 손님 화면이 나옴 ===> 수정 대상. 우회로 보안 뚫림.
고객센터 관리 화면(공지·티켓)이 원장·과외쌤에게도 열림 ====> 보안 구멍. 수정대상
과외쌤이 주소로 학생·공부방 등록 화면에 들어갈 수 있음 =====> 수정대상
공부방 찾기 배너의 첫 버튼이 「과외쌤 찾기」===> 바로 잡을 것
과외쌤 찾기 배너가 과외쌤에게 막힌 공부방 찾기로 보냄 ====> 자세히 설명요함.
브라우저 탭 제목이 「…프리뷰」====> 뭐가 나와야 정상이지?
해결후기 「로그인한 회원 회원에게」====> 수정요망
모바일 제출함 표가 화면 밖으로 넘침 ====> 수정요망
제출함 화면에서 사이드바에 현재 메뉴 표시 없음 ====> 어디에 있는 제출함인가? 설명요함
모바일 고민방 설명이 단어 중간에서 줄바꿈 ====> 가로폭에 못들어가서 아래로 줄바꿈 된것이 아닌가?
손님 401, 회원 403 오류 표시 (기능 영향 없음) ====> 왜 생겼는지? 코드 잔재이거나 버그이면 수정요함.
과외쌤 기본정보 저장 때 지역도 같이 저장됨 ====> 기본정보에 과외지역1은 필수이고, 2, 3은 선택이야. 맞는데 무엇이 잘못인가?

(15:32) 2. 자기역할에 맞는 고민방에 쓰기 권한이 있어.
3. 이건 지금 누구모드에서 일어나고 있는 일이니? 공부방, 과외쌤, 학생 중에서? 더 논의후에 진행
4. 동의
5. 이런거 실제 사이트에서 하나도 없다. 예전에 이미 다 걷어내고 제거했다. 넌 뭘 보면서 얘기하나? 찾을려고도 하지마. 없어.
6. 수정요망
7. 문서로 확인하지 말고, 코드로 확인해.
일단 위의 것을 순서대로 작업하고 나에게 보고한다.
```

## 범위

| 항목 | 처리 |
|---|---|
| 없는 공부방 번호 → 「없음」 | 수정 |
| 고민방 주소로 바로 열기 → 손님 화면 | 수정 |
| 고객센터 관리 화면이 관리자 아닌 회원에게 열림 | 수정 |
| 과외쌤이 학생·공부방 등록 화면 진입 | 수정(역할마다 자기 등록 화면만) |
| 「로그인한 회원 회원에게」 | 수정 |
| 탭 제목 「프리뷰」 | 수정(사용자 동의 제안표) |
| 고민방 설명 단어 중간 줄바꿈 | 수정 |
| 콘솔 401·403 | 원인 코드 확인 후 수정 |
| 과외쌤 찾기 배너 「우리동네 공부방 찾기」 버튼 | **제거**(16:08 사용자 지시, 아래 2차) |
| 공부방 찾기 배너 「우리동네 과외쌤 찾기」 버튼 | **제거**(16:35 사용자 선택, 아래 3차) |
| 제출함 표 넘침·사이드바 | **제외** — 사용자 지시 |
| 과외쌤 기본정보·지역 함께 저장 | 문제 없음으로 닫음 |

## 바꾼 것

| 파일 | 내용 |
|---|---|
| `preview/home-ui/src/myshop/public-shell.js` | 서버 결과·예비 데이터가 둘 다 없으면 로딩 문구를 기존 「이 공부방 소개를 찾을 수 없습니다.」 카드로 바꿈 |
| `preview/home-ui/src/concern/store.js` | 고민방 목록·글 캐시에 받은 역할을 저장하고, 지금 역할과 다르면 캐시를 쓰지 않고 다시 받음. 원인: 주소로 바로 열면 로그인 확인 전(손님)으로 목록을 받아 두고, 로그인 확인 뒤에도 그 손님 목록(제목만)을 그대로 씀. `auth:login` 이벤트는 코드 어디에서도 보내지 않아(`auth-session.js`에 `auth:profile`·`auth:logout`만) 로그인 시 캐시를 비우는 방식으로는 못 고침 |
| `preview/home-ui/src/support/screens.js`, `support/index.js` | `/support/admin/*`는 관리자(`isAdminUser`)만 관리 화면·이벤트, 아니면 「운영자 전용 화면이에요」 안내 |
| `preview/home-ui/src/support/support-backend.js` | 부트 때 공지만 받음. 운영 전체 문의 목록은 관리자 문의 관리 화면이 들어갈 때 받음(`admin-screens.js` 267행, 기존) |
| `preview/home-ui/src/mypage/screens.js` | 학생 등록=학생, 공부방 등록=공부방, 과외쌤 등록=과외쌤만. 다른 역할이면 내 등록(`getDefaultMypagePath`)으로 돌려보냄 |
| `preview/home-ui/src/board-channel-acl.js`, `concern/screens.js` | `boardAudienceText()` — 대상 이름이 「회원」으로 끝나면 「회원」을 다시 붙이지 않음 |
| `preview/{home,search,auth,study-room,tutor}-ui/index.html` | 탭 제목·설명에서 「프리뷰」 제거 |
| `preview/home-ui/src/styles/home-community.css` | 고민방 본문 `word-break: keep-all; overflow-wrap: break-word;` |
| `scripts/verify-integrity-fix-20261009.mjs` | 이번 수정 확인 38개 |

## 콘솔 401·403 원인 (코드 확인)

- `support-backend.js` 옛 40행: 부트(`main.js` 425행 `activateSupportApi`)에서 누구에게나 `hydrateSupportCache()` → `fetchTickets('')` → `GET /api/support/tickets.php`(조건 없음).
- `public/api/support/tickets.php` 35~36행: 조건 없는 GET은 `SupportApi::requireAdmin()` → 손님 401, 일반 회원 403.
- 이 목록(`ticketsCache`)을 쓰는 곳은 `ticket-store.js` 127행 `listTickets()` → 호출처는 `admin-screens.js` 146행(관리자 문의 관리)뿐. → 부트 요청은 잔재.

## 검수

| 검사 | 결과 |
|---|---|
| `node scripts/verify-integrity-fix-20261009.mjs` | 38 통과 |
| `npm run build:dothome` | 통과 |
| `npm run verify:shop-page` | 통과 |
| `node scripts/verify-no-sample-data.mjs` | 통과 |
| `scripts/check-no-committed-secrets.sh`(Git Bash) | 통과 |
| 관련 기존 검사 17개 | 9개 통과. 실패 8개(`compare-board-acl-matrix`, `run-verify-board-acl`, `verify-home-news-row`, `verify-input-fill-rule`, `verify-mypage-account-region`, `verify-mypage-notice-top`, `verify-student-mypage-metrics`, `verify-wishlist-card-zoom-screen`)는 **main(`74f3e395`)에서도 같은 항목으로 실패**(실패 줄 비교 차이 0, `verify-input-fill-rule`은 같은 환경 worktree에서 274 통과·8 실패 동일) |
| 브라우저(빌드 결과, API 없는 로컬 서버) | 없는 공부방 999999 → 「이 공부방 소개를 찾을 수 없습니다.」 / 손님 `#/support/admin/notices` → 운영자 전용 안내, 관리 폼 없음 / 부트·손님 홈 `tickets.php` 요청 0건 / 고민방 본문 `word-break: keep-all` / 탭 제목 5개 새 이름 |

## 미확인

- 로그인 상태 재현(고민방 주소로 바로 열기 → 글쓰기 버튼, 과외쌤 → 학생 등록 주소 → 돌려보냄): 로컬에 로그인 서버가 없어 코드·정적 검사로만 확인. 배포 뒤 운영에서 확인 필요.
- 참고: `build:dothome`이 앱마다 `npm install`을 돌림. 이 worktree의 `preview/home-ui/node_modules`는 본 폴더 것을 가리키는 연결(junction)이라, 본 폴더 `preview/home-ui/node_modules`(Git 추적 안 함)에 설치가 반영됐을 수 있음.

## 2차 (16:08)

지시 원문:

```text
지워도 돼. 과외쌤배너에 있는 '우리동네 공부방 찾기'는 잘못된 것이니, 이 배지를 제거해. 이 작업하고 일괄 배포하자
```

- `preview/home-ui/src/home-marketing-banner.js` `search_tutor` 배너 버튼에서 「우리동네 공부방 찾기」 삭제, 「홈으로」만 남김. 과외쌤 찾기 화면을 보는 모든 역할에 같음.
- 확인 스크립트에 3개 추가(41개).
- 「지워도 돼」 = 비교용 임시 작업 폴더 `.wt\base-fix-compare` 삭제 승인.
- 배포 범위: 이 브랜치(무결성 1·2차). 편지 메일(`cursor/mail-lifecycle-20261009`)은 운영 DB 표 확인(배포 전 사용자 할 일)이 남아 이번 배포에 넣지 않음.

## 배포 (16:11)

- `main` = `afb725fd` (`--no-ff` 병합 2개: 이 브랜치 `9523f742` → 병합 `721a917c`, 인수인계 `c4dde0f7` → 병합 `afb725fd`). 병합 결과와 이 브랜치의 차이는 인수인계 문서·규칙 파일 3개뿐.
- Actions 7개 성공: Deploy to dothome `37897570099`(1분 43초), Verify bundle, ShopPage gate, Board ACL gate, Tutor lesson step gate, Tutor register same-tab, Tutor mypage frame IA.
- 운영 확인(`https://study114.net`, 손님, 읽기만, Cursor 브라우저):
  - `#/myshop/study-room/999999` → 「이 공부방 소개를 찾을 수 없습니다.」, `tickets.php` 요청 0
  - `#/support/admin/notices` → 「운영자 전용 화면이에요」
  - `search/#/search/tutor` → 배너 버튼 「홈으로」 하나, 탭 제목 「우동공과 — 공부방·과외쌤 찾기」, `tickets.php` 요청 0
  - `#/community/director` → 본문 `word-break: keep-all`, 「공부방 운영·모집·학부모 응대」 한 줄
  - 메인 탭 제목 「우동공과 — 우리동네 공부방·과외쌤」
- 운영 미확인: 로그인 상태 2건(고민방 주소로 바로 열기 → 글쓰기 버튼, 다른 역할 등록 화면 → 돌려보내기). 계정 정보는 채팅·도구에 넣지 않으므로 사용자 확인 필요.

## 3차 (16:35) — 공부방 찾기 배너 첫 버튼

지시 원문:

```text
(16:28) 공부방찾기 배너 첫 번째 버튼: 논의하기로 하고 미뤄 둔 상태예요.===> 이게 뭔지 상세히 보고하라
(16:35, 선택 질문) 공부방찾기 배너의 「우리동네 과외쌤 찾기」 버튼을 어떻게 할까요? → 「과외쌤찾기 배너와 똑같이 제거 — 「홈으로」만 남김」
```

- 원인(코드 확인): 공부방 찾기 화면을 보는 사람은 손님·운영자·공부방 원장·공부방 분기 학생(`preview/shared/site-nav-config.js` 104–150). 이 중 원장(121 `find_tutor: 'hide'`)과 공부방 분기 학생(149)은 과외쌤 찾기가 막혀 있어, 버튼을 누르면 `search-role-access.js` 89–91이 공부방 찾기로 되돌림 — 누르면 아무 일도 없는 버튼. 2차에서 지운 과외쌤 찾기 배너 버튼과 같은 구조.
- `preview/home-ui/src/home-marketing-banner.js` `search_room` 버튼을 「홈으로」 하나로. 쓰는 곳이 없어진 `searchUiUrl` import 제거.
- 확인: `scripts/verify-integrity-fix-20261009.mjs`에 10번(공부방 찾기 배너) 추가 → 44 pass. `node --check` 통과.
- 배포(16:33, 사용자 「배포 안한 것이 있으면 하도록 하라」 → 선택 「편지 메일 + 기록 문서 모두 배포」): `main` `97bdd9bd` = 편지 메일(`cursor/mail-lifecycle-20261009`) + 이 브랜치 `9d73dd48` + 인수인계·무결성 재확인 기록. 병합 결과에서 편지 메일 검사 446 pass(`-d extension=pdo_sqlite` 필요), A단계 메일 검사 417 pass, 비밀값 검사 통과. Actions 9개 성공(Deploy to dothome `37899635871`).
- 운영 확인(손님): `search/#/search/room` 배너 버튼 「홈으로」 하나.
- 운영 DB(16:45, 사용자 phpMyAdmin): `SHOW TABLES LIKE 'provider_reminder_dispatches'` → 있음. 편지 메일용 SQL 실행 불필요.
- 고민방 팝업 「게시판에서 보기」 이동 안 됨(16:27 사용자 제보, 홈 우측 레일): 손님으로 운영 홈에서 눌러 보면 `#/community/parent`로 이동(정상). 코드상 과외쌤 홈도 같은 링크. 16:47 사용자 「모두 해결됐어」 — 코드 수정 없음. 원인은 미확인(제보 시각이 16:11·16:33 배포 사이라 옛 화면 파일이었을 가능성).

## 배포 전 사용자 할 일

- 없음(SQL·환경변수·Secrets·`.htaccess` 변경 없음).
