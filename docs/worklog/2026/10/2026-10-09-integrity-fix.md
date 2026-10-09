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
| 과외쌤 찾기 배너 → 공부방 찾기 | **보류** — 사용자 「더 논의후에 진행」 |
| 공부방 찾기 배너 첫 버튼 | **보류** — 바꿀 내용 미정(같은 배너 묶음, 위와 함께 논의) |
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

## 배포 전 사용자 할 일

- 없음(SQL·환경변수·Secrets·`.htaccess` 변경 없음).
