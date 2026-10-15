# study114 공부방 모드 코드 점검 (읽기 전용)

- 기준: `origin/main` **118b6558** (worktree `/workspace/audit-wt`). 코드 수정·push 없음.
- 대상 역할: `role_type=study_room_owner` → navRole `study_room` → boardRole `supply-room`.
- 검색 범위: `preview/{home-ui,shared,search-ui,study-room-ui,auth-ui}/src`, `public/api`, `src/`. docs·node_modules·vendor·dist 제외. 결제 로직 시험 제외.
- 등급: **오류** = 기능이 틀리게 동작 / **미흡** = 규칙 위반이나 위험 / **참고** = 정리 권장.
- 한계: 정적 읽기만 했고 브라우저로 돌려 보지 않았습니다. 응답 필드 대조는 공부방 핵심 경로(등록 허브·유료 상태)만 표본으로 봤습니다.

---

## 0. 요약 (상위 이슈)

| # | 등급 | 내용 | 위치 |
|---|---|---|---|
| 1 | 미흡 | 「학부모」 단독 표기가 공부방 화면에 여러 곳 남음 (쪽지설정 안내 3줄, 등록 수업 안내 placeholder, 유료상품 비교표, 고객센터 자료·FAQ) | 3-2절 |
| 2 | 미흡 | 「학생/학부모 고민방」(빗금) 표기 잔존. 확정 표기 「학생·학부모 고민방」(218-10, 작업지시 232)이 main에 아직 반영되지 않음 | `concern/copy.js:45`, `board-engine-copy.js:436,440`, `board-channel-acl.js:140` |
| 3 | 미흡 | 상태 라벨 함수가 모르는 값을 받으면 영문 enum을 그대로 화면에 반환함 (`draft`·`basic_only`·`hidden` 등) | 3-1절 |
| 4 | 미흡 | `#/messages` 판정 함수(`isMessagesRoute`)는 있는데 `renderScreen`에 처리 분기가 없음. 앱 안에서 해시만 바뀌면 비회원 홈이 그려짐 | `state.js:197,913`, `main.js:127-132,165-270` |
| 5 | 미흡 | 섹션 제목 아래 간격이 0~24px로 제각각임. 공부방 홈 픽/베이직 구분 간격(32px)은 학생 홈에만 적용됨 | 4절 |
| 6 | 참고 | API 경로는 프런트 호출 78개가 모두 `public/api`에 있음. 메서드 불일치·누락 0건 | 2절 |

「원장」: 화면 문구에 남은 9건은 모두 218-8 확정 예외 목록과 일치합니다. 위반 0건.
역할 가드: 공부방을 잘못 막거나 여는 곳은 찾지 못했습니다(1-3절).

---

## 1. 라우팅

### 1-1. 공부방 모드 도달 가능 해시 경로

| 구간 | 경로 | 처리 위치 |
|---|---|---|
| 가입 (auth-ui) | `#/signup/terms` → `/signup/role` → `/signup/form` → `/signup/verify-email` → `/signup/account-contact` → `/signup/basic` → `/signup/complete`, 그 밖에 `/login` `/find-id` `/find-password` `/reset-password` `/signup/extra` | `auth-ui/src/layout.js:20-33` |
| 기본등록·상세 (study-room-ui) | `#/register/basic` `/register/location` `/register/lesson` `/register/facility` `/register/complete` (`?room_id=`) | `study-room-ui/src/state.js:17-`, `layout.js:295-297` |
| 홈 | `#/study-room` (탭은 상태값 `studyRoomTab`, 해시 변화 없음) | `state.js:68-73`, `screens/study-room.js:138-175` |
| 찾기 (search-ui) | `/search/#/search/room`, `/search/student` (`find_tutor` 숨김) | `search-ui/src/state.js:38-44`, `shared/site-nav-config.js:118-128,265` |
| 커뮤니티 | `#/community` `/community/{director,tutor,parent,solved}[/new|/:id]`, 레거시 `/concern/*` | `concern/router.js:20-41` |
| 자료실 | `#/library` `/library/{templates,guides}` `/library/{room-info,tutor-tips,student-tips}[/new|/:key[/edit]]`, `#/support/library[/templates|/guides]` | `library/library-router.js:40-50`, `support/router.js:38-40` |
| 마이페이지 | `/mypage/registrations/study-rooms[/tab/:t|/:id[/basic|detail|detail2|inquiries|publish|submission]]`, `/mypage/messages[...]` `/recent` `/student-review` `/wishlist` `/contact` `/plans` `/plans/my` `/plans/history` `/submission-docs` `/submission-board/*` `/account`. `/mypage` `/mypage/home` `/mypage/registrations` `/mypage/registrations/students`는 공부방 첫 허브로 보냄 | `mypage/router.js:59-131`, `state.js:726-741`, `study-room-reg/router.js:26-80` |
| 카탈로그(유료) | `#/plans` `/plans/positions` `/plans/access` `/plans/checkout` `/plans/result`. `/plans/my`·`/plans/history`는 `/mypage/plans/*`로 보냄 | `plans/router.js:8-36` |
| 공개 마이샵 | `#/myshop/study-room/:id` | `myshop/router.js:31` |
| 기타 | `/guide/*` `/support/*` `/policy/*` `/promo/*` `/register-intro/room`(로그인 시 돌려보냄) | 각 router |

### 1-2. 죽은 경로·처리 없는 경로·없는 경로로 가는 링크

| 등급 | 내용 | 위치 |
|---|---|---|
| 미흡 | `isMessagesRoute()`가 `#/messages`를 `'messages'` 화면으로 판정하지만, `renderScreen()`에 messages 분기가 없고 `SCREENS`에도 키가 없음. 결국 `SCREENS.guest`가 그려짐. 리다이렉트(`bootstrapMessagesRoute`)는 첫 부트 때만 돌고(`main.js:294`) hashchange 때는 돌지 않음. 그래서 앱 안에서 주소창이나 링크로 `#/messages`가 되면 공부방 회원에게 비회원 홈이 보임. `SCREEN_META.messages`(`state.js:81`)도 죽은 항목 | `state.js:197-201,913`, `main.js:127-132,165-270,356-366` |
| 참고 | `shared/site-chrome.js:177` `handlers.navigateHome`을 넘기는 호출자가 하나도 없음. 다른 SPA의 유틸 메뉴는 항상 전체 이동(`goSameTab`)으로 동작. 지금은 정상 동작하지만 죽은 분기 | `shared/site-chrome.js:177,193,224` |
| 참고 | 레거시 별칭으로 링크가 남아 있음: `#/guide/registration`, `#/guide/saved-contact`, `#/guide/safety`. 별칭 표가 받아 줘서 동작은 하지만, 주석은 "새 별칭은 늘리지 않는다" | `right-rail.js:571,617,623,629,630,635,636`, `right-rail-store.js:95`, `board-engine-copy.js:260-261`, `policy-copy.js:237` / 별칭 `guide/router.js:7-20` |
| 참고 | `#/community/admission`은 관리자 입력칸 placeholder에만 있고 실제 게시판 slug가 아님(slug는 director·tutor·parent·solved). 운영자가 그대로 저장하면 `normalizeCommunityPath`가 null을 줘서 기본 게시판으로 떨어짐 | `admin/a28-screens-bind.js:767`, `concern/copy.js:28-52` |
| 참고 | `student-wishlist-state.js` 전체가 어디서도 import되지 않음(죽은 모듈) | `student-wishlist-state.js:25,30,43` |
| 참고 | 등록 단계 이름이 화면마다 다름: 마이페이지 탭 「상세정보1/상세정보2」, 등록 SPA 「상세정보1단계/2단계」, 단계 표 「공부방·교습소 상세」 | `study-room-reg/router.js:136-137`, `study-room-ui/src/layout.js:296-297`, `study-room-ui/src/state.js:19` |
| 참고 | 홈 마이박스 버튼 「쪽지 후기함」과 메뉴 「쪽지·후기함」의 가운뎃점 불일치 | `screens/study-room.js:82` vs `shared/site-nav-config.js:44`, `mypage/router.js:60` |

수집한 해시 링크 문자열(약 110종)은 모두 위 라우터의 정규화 함수에 걸렸습니다. 위 항목 말고는 갈 곳이 없는 링크를 찾지 못했습니다(`#/path`는 주석 예시).

### 1-3. 역할 가드

- `guardRoleHomeAccess`: `study_room` → `#/study-room`만 허용하고, 다른 역할 홈은 자기 홈으로 보냄. 정상 (`shared/route-access.js` 하단 `ROLE_HOME_SCREEN_ROLE`).
- GNB: 공부방은 `find_tutor`·`register_tutor`만 숨김. 찾기 탭은 room·student. 정상 (`site-nav-config.js:118-128,265-272`).
- 유료상품: `canAccessPlansHub`·`canAccessPlansAccountRoutes`에 study_room 포함. 정상 (`site-nav-config.js:226,234`).
- 게시판 hydrate: 세션 role_type `study_room_owner`가 그대로 넘어가도 `mapNavRoleToBoardRole`이 `supply-room`으로 바꿔 줌. 정상 (`board/board-backend.js:96-100`, `board-engine-copy.js:169`).
- 서버: `registrations/study-rooms.php`가 `requireRole('study_room_owner')`, `paid/status.php`가 `requireProvider`. 정상.
- **잘못 막거나 여는 가드는 찾지 못했습니다.**

---

## 2. API

### 2-1. 공부방 모드 프런트 호출 → 서버 파일

| 기능 | 프런트 | 서버 | 메서드(프런트/서버) |
|---|---|---|---|
| 세션 | `auth-session.js` | `api/auth/me.php` | GET / GET |
| 가입·기본등록 | auth-ui `auth-api.js` | `auth/signup.php`, `auth/basic-register.php`, `auth/email/*`, `auth/phone/*`, `auth/account-contact.php`, `auth/regions.php` | POST·GET 일치 |
| 상세등록 | study-room-ui | `study-room/register.php`, `study-room/promo-image.php` | POST(·PATCH/DELETE) 일치 |
| 등록 허브(마이페이지) | `registrations-api.js:41-55` | `registrations/study-rooms.php` | GET·PATCH / GET·PATCH |
| 쪽지·후기함 | `messages-api.js` | `messages/threads.php`, `attachments.php`, `entitlements.php` | GET·POST·PATCH 일치 |
| 찜·비교·최근·관심 학생 | `handoff-api.js` | `handoff/favorites.php`, `compare.php`, `recent.php`, `student-reviews.php`, `recommendations.php` | GET·POST·DELETE 일치 |
| 찾기 | `search-ui/src/search-api.js:154`, `shared/location-display.js:695` | `search/search.php`, `search/region-stats.php` | POST / POST |
| 공개 마이샵 | — | `study-room/public.php` | GET |
| 후기 | `provider-reviews/store.js:22` | `reviews/index.php` | GET·POST |
| 커뮤니티·자료실·공지 | `concern/store.js`, `board/board-api.js`, `library/info-board-store.js` | `board/posts.php`, `comments.php`, `reactions.php`, `reports.php`, `attachments/*`, `concern-hot.php` | GET·POST·DELETE 일치 |
| 유료 | `paid-api.js`, `provider-status.js` | `paid/status.php`, `catalog.php`, `checkout.php`, `history.php`, `roi.php`, `notices.php`, `waitlist.php` | 일치 |
| 고객센터 | `support/support-api.js` | `support/tickets.php`, `notices.php` | GET·POST·PATCH 일치 |
| 홈 부속 | — | `home-popups.php`, `site/public-settings.php`, `neighborhood-greeting(s|-card).php` | GET(·POST) |

- **없는 엔드포인트 0건**: 프런트에 리터럴로 적힌 `/api/...` 78개가 모두 `public/api`에 있습니다.
- **메서드 불일치**: 공부방 경로에서는 0건. (참고: 관리자 `admin/site-settings-store.js:291`의 `PUT`은 관리자 범위라 이번에 대조하지 않았습니다.)

### 2-2. 응답 필드 대조 (표본)

| 등급 | 내용 | 위치 |
|---|---|---|
| 참고 | 등록 허브 PATCH: 서버가 받는 action은 `inquiry_status` 하나뿐(그 밖은 422). 프런트도 그 하나만 보냄. 일치. 다만 프런트 타입에는 `waiting_only`가 있는데 서버 허용값은 `open/paused/capacity_full`. 화면에서 보내는 경로는 없지만, 타입 주석과 서버가 어긋나 있음 | `src/Registration/StudyRoomHubService.php:44-56`, `study-room-reg/store.js:17,194-207` |
| 참고 | 유료 상태: 프런트가 읽는 `exposure·slots·metrics·days·tickets·cold_memo·can_cold_memo·tier`가 서버에 모두 있음. 다만 `exposure`가 없을 때 프런트 고정 문구 「베이직 노출 이용중 - 무료광고」로 채움. 서버 실패를 정상처럼 보이게 할 수 있음 | `provider-status.js:55-59`, `src/Paid/ProviderStatusService.php:67-83` |

### 2-3. 서버를 부르지 않는 기능

| 등급 | 내용 | 위치 |
|---|---|---|
| 참고 | 예전에 지적한 `provider-reviews/store.js` apiMode 문제는 **해결됨**: 배포 빌드(`import.meta.env.PROD`)에서는 항상 서버를 씀 | `provider-reviews/store.js:24-31` |
| 참고 | 홈 오른쪽 레일 슬롯 정의는 content-config API가 꺼지면 sessionStorage로 내려감(일반 회원은 읽기만 하므로 영향 작음) | `right-rail-store.js:168-176,340` |
| 참고 | 등록 허브·쪽지는 API 활성화가 실패해도 apiMode가 true로 남아 로컬에 저장되지 않음(fail-closed). 정상 | `registrations-backend.js:34-37`, `messages-backend.js:32-40` |

---

## 3. 개발 용어·호칭

### 3-1. 영문 키·enum이 화면에 그대로 나갈 수 있는 곳

| 등급 | 내용 | 위치 |
|---|---|---|
| 미흡 | `profileStatusLabel`·`detailStatusLabel`이 모르는 값을 받으면 `return raw`. 등록 요약에 `pending_review` 같은 영문이 나갈 수 있음 | `study-room-ui/src/summary.js:115,124` |
| 미흡 | 단지(complex) 마스터를 못 받으면 단지 **숫자 id**를 그대로 표시 | `study-room-ui/src/summary.js:45` (과목 등도 `:38` `hit?.label || raw`) |
| 미흡 | `detailStatusLabel` → `LABELS[status] || status` | `home-ui/src/study-room-reg/format.js:27` |
| 미흡 | 노출·프로필 상태 라벨이 `|| key` / `|| status`로 떨어지고, 기본값이 영문 `'draft'` | `home-ui/src/lifecycle-copy.js:65,71,76` |
| 미흡 | 유료 배지 라벨 `|| code` | `home-ui/src/plans/badge-options.js:56` |
| 미흡 | 학생 인원·성별 그룹 라벨 `|| code` (학생찾기 카드) | `home-ui/src/exposure-format.js:186,204` |
| 미흡 | 제출자료 상태 `|| status` | `home-ui/src/mypage/preview-data.js:260` |
| 참고 | 게시판 소개가 없을 때 제목을 **board key 그대로** 씀(`title: key`) | `home-ui/src/board-channel-acl.js:246-251` |
| 참고 | 등록 목록 탭 주소에 `not_ready`·`hidden` 같은 enum이 들어감. 주소에만 있고 화면 라벨은 별도 | `study-room-reg/router.js:30` |

공부방 화면 문자열에 `study_room`·`supply-room`·슬롯 키·`TODO`·`undefined`가 직접 들어간 곳은 없었습니다. 남은 위험은 위의 라벨 함수가 원값으로 떨어지는 경우입니다. 권장: 모든 라벨 함수의 마지막 반환값을 「—」나 한국어 일반 문구로 바꾸기.

### 3-2. 「학부모」 단독 사용 (규칙: 「학생」, 꼭 필요하면 「학생(학부모)」, 예외는 「학생·학부모 고민방」)

**공부방이 직접 보는 화면 — 미흡**
| 위치 | 현재 문구 |
|---|---|
| `home-ui/src/study-room-reg/study-room-reg-copy.js:75` | 지금 **학부모** 쪽지를 받을지 확인하고… |
| `home-ui/src/study-room-reg/study-room-reg-copy.js:89` | 켜면 **학부모**가 쪽지로 문의할 수 있어요. |
| `home-ui/src/study-room-reg/study-room-reg-copy.js:99` | **학부모**의 문의를 받기 시작하려면 휴대폰 검증이… |
| `study-room-ui/src/screens/step-lesson.js:177` | (placeholder) 이 수업에 대해 **학부모**에게 알리고 싶은 내용… |
| `home-ui/src/plans/store-ui.js:125` | **학부모** 선연락 · 답장 |
| `home-ui/src/plans/store-ui.js:141` | **학부모** 문의 수신 · 답장 |
| `home-ui/src/concern/copy.js:30` | 공부방 운영·모집·**학부모** 응대 (공부방 고민방 roleHint) |
| `home-ui/src/board-channel-acl.js:146` | 공부방 운영·모집·**학부모** 응대에 대한 고민… |
| `home-ui/src/home-marketing-banner.js:96` | **학부모** 과금 없이… |
| `home-ui/src/provider-reviews/copy.js:59` | 이용자(**학부모/학생**)만 |
| `home-ui/src/myshop/return-snapshot.js:281` | **학부모** 홈으로 돌아가기 |

**공통 화면(고객센터·이용안내·약관 등) — 미흡**
`support/support-copy.js:63,107,109,116,118,157,261,262,302`, `guide/screens.js:281,288`, `guide/copy.js:89,248,253,353,408`, `concern/copy.js:75`, `board-channel-store.js:24`(라벨 「학부모」).

**「학생·학부모」(고민방 아님) — 미흡 (규칙상 「학생」 또는 「학생(학부모)」)**
`guide/screens.js:197,212,280,363,383,570,602,603`, `guide/copy.js:64,154,248,518,523,643,654,655`, `support/support-copy.js:215`, `plans/screens.js:1147`, `concern/copy.js:84`(kicker), `board-channel-acl.js:142`, `home-marketing-banner.js:99`(alt).

**「학생/학부모」 빗금 — 미흡 (232 미반영)**
`concern/copy.js:14,45`, `board-engine-copy.js:436,440`, `board-channel-acl.js:140`, `policy-copy.js:22,104,144`(232에서 「학생·학부모」로 확정), `admin-red-line-copy.js:15`.

(제외: 관리자 `admin/**`, 주석, 과외쌤 전용 `tutor-reg/*`. 과외쌤 쪽 `tutor-reg/inquiries-copy.js:11`, `tutor-reg/format.js:170`에도 같은 문제가 있음 — 참고.)

### 3-3. 「원장」

`preview/**`(.js/.html, 주석 제외)에서 9건이 나왔고, 모두 218-8 확정 예외(t1583)입니다:
`shared/study-room-basic-form.js:305,809`, `study-room-ui/src/summary.js:148`, `study-room-ui/src/screens/step-basic.js:90`, `auth-ui/src/screens/signup-basic.js:273`, `study-room-reg/myshop-render.js:155`, `promo/study-room-content.js:77`, `promo/catalog.js:22`, `admin/a28-copy.js:574`(문서에는 566행, 줄만 밀림). **위반 0건.** (PHP 서버 문구는 218-8과 같이 범위 밖.)

---

## 4. 간격 (제안만)

토큰은 이미 있습니다: `--space-1…20` (4·8·12·16·20·24·32·40·48px, `styles/tokens.css:109-119`). 그런데 공부방 화면 CSS는 대부분 rem 직접값(0.2/0.35/0.45/0.65/0.85/1.15/1.35rem 등)과 px를 섞어 씁니다.

### 4-1. 같은 종류 블록 사이 간격이 제각각

| 화면 | 블록 사이 | 위치 |
|---|---|---|
| 공부방 홈 섹션 | 20px (`--space-5`) | `home.css:543` `.home-section`, `home.css:1391` `.content-section` |
| 공부방 홈 마지막 섹션 | 16px | `home.css:1397` |
| 학생 홈 픽/베이직 구분 | 32px + 선 + 32px (**학생 홈만**) | `home-listings.css:318-331` (`.home-shell--parent` 한정) |
| 마이샵 섹션 | 21.6px (1.35rem) | `myshop.css:19` |
| 마이페이지 공부방 허브 | 20px (1.25rem) | `mypage-ops.css:1239-1243` `.mp-room` |
| 허브 안 진행률 → 다음 | 16px / 체크리스트 아래 20px | `mypage-ops.css:1343`, `:1438` |
| 마이페이지 공통 카드 | 16px | `mypage-ops.css:1821` `.mp-card-stack` |
| 쪽지·후기함 헤더 아래 | 24px | `mypage-ops.css:1950` `.msg-hub` |
| 등록점검 보드 | 16px | `registration-check.css:240-243` `.rc-board` |

### 4-2. 제목 아래 간격(제목→본문)이 0~24px

| 제목 | 아래 간격 | 위치 |
|---|---|---|
| `.section-heading` (공통) | 16px | `design-system.css:102` |
| `.section-heading--basic` | **0** | `home-listings.css:205` |
| `.section-title-bar--basic` | 4px (0.25rem) | `home-listings.css:211` |
| `.home-section__head` | 8px | `home.css:549` |
| `.mypage-content__head` | 24px | `mypage-ops.css:247` |
| `.mypage-home-section__head` | 16px | `mypage-ops.css:460` |
| `.mp-card__title` | 16px | `mypage-ops.css:1836` |
| `.shop-sec__title` (마이샵 h2) | 13.6px (0.85rem) | `myshop.css:293` |
| `.rc-block__title` | 10.4px (0.65rem) | `registration-check.css:99` |
| `.rc-section__head` | 7.2px / `[data-rc-page]` 5.6px | `registration-check.css:259`, `:685`, `:836` |
| `.mp-room__checklist-head`, `__overview-head` (h3) | 8px | `mypage-ops.css:1443`, `:1594` |
| `.rc-subsection__title` | 3.2px (0.2rem) | `registration-check.css:753`, `:911` |

### 4-3. 큰 제목 위 간격이 일반 블록 간격보다 좁은 곳

| 등급 | 내용 | 위치 |
|---|---|---|
| 미흡 | 공부방 홈 베이직 제목줄: 위 12px(`padding-top: --space-3`), 아래 4px. 그런데 일반 섹션끼리는 20px이고, 학생 홈의 같은 구분은 32px | `home-listings.css:301-303`, `:211`, 비교 `:318-331` |
| 미흡 | 등록점검 하위 제목 `.rc-subsection` 위 12px < 보드 블록 사이 16px | `registration-check.css:745,896` vs `:243` |
| 미흡 | 쪽지 목록 그룹 라벨 위 16px·아래 4px < 헤더 아래 24px | `mypage-ops.css:1977` vs `:1950` |
| 참고 | 마이샵 h2 아래 13.6px가 섹션 안 패딩 18.4px보다 작아 제목이 본문 쪽보다 위 섹션에 붙어 보임 | `myshop.css:197-200`, `:293` |

### 4-4. 제안 간격 체계 (토큰만 사용, 4px 배수)

| 용도 | 값 | 토큰 |
|---|---|---|
| 줄 단위(라벨↔값, 제목↔설명) | 4px | `--space-1` |
| 제목 → 본문 (소제목 h3·블록 제목) | 8px | `--space-2` |
| 제목 → 본문 (섹션 제목 h2) | 12px | `--space-3` |
| 같은 섹션 안 카드·블록 사이 | 16px | `--space-4` |
| 섹션 사이 (선 없음) | 24px | `--space-6` |
| 섹션 사이 (구분선, 선 양쪽 같게) | 32px | `--space-8` |
| 페이지 헤더 → 첫 섹션 | 24px | `--space-6` |

원칙: ① **제목 위 간격 ≥ 바로 앞 블록 간격**(제목은 아래 본문에 붙임). ② 같은 역할의 블록은 화면이 달라도 같은 토큰. ③ 학생 홈의 `--tier-section-gap: 2rem`을 공부방·과외쌤 홈 픽/베이직 구분에도 같이 씀. ④ rem 직접값은 가장 가까운 토큰으로 맞춤(0.65→8px, 0.85→12px, 1.35→24px 등). 바꿀지는 별도 결정이 필요합니다.
