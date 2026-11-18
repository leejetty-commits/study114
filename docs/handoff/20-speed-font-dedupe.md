# 20 — 홈 속도: SemiBold 폰트 빼기 · 첫 화면 중복 요청 없애기 — Cursor 작업 지시서

- 작성: 2026-11-19 04:50 (KST) · 우동공과3
- 코드 기준: `origin/main` **ce7e0ccd** (PR #271 머지). 0단계에서 `git fetch` 후 다시 확인한다.
- 종현 승인: 2026-11-19 「ㅇㅋ 진행하자」 (A 폰트 + B 중복 요청만).
- 원칙: **지금 돌아가는 화면은 바꾸지 않는다.** 줄이는 것은 받는 파일과 같은 요청의 반복뿐이다.
- **하지 않는 것:** 지도 늦게 불러오기(#235에서 되돌림), CSS 분리, 레일 요청 미루기, 서로 다른 목록 요청 합치기.

---

## 오늘 운영 측정 (2026-11-19 04:10 KST, 비로그인 홈, 박스)

- 첫 방문 전체 1.81 MB. 폰트 3개 806,632 B (Regular 267,096 · **SemiBold 268,752** · Bold 270,784).
- 모바일(느린 4G 가정) FCP 3.089초, LCP 4.455초.
- API 요청 23개, 그중 19개가 FCP 전.

## 확인된 사실 (origin/main ce7e0ccd + 운영 요청 추적 2026-11-19 04:40 KST)

### A. 폰트
- `preview/shared/fonts/pretendard.css`: 400(:2-8) · **600(:10-16, `Pretendard-SemiBold.subset.woff2`)** · 700(:18-24) 세 블록.
- 이 CSS는 `preview/home-ui/src/styles/tokens.css:6` 한 곳에서만 불러오고, 홈·찾기·가입·공부방·과외쌤 다섯 앱이 모두 tokens.css를 쓴다.
- SemiBold woff2를 부르는 곳은 pretendard.css:15 한 곳뿐(`scripts/`의 jsdelivr 주소 3개는 스크린샷 도구라 무관).
- 600 사용: `font-weight: 600`이 **309회 / 46개 파일**(`origin/main` 의 `preview` 기준, JS 인라인 2줄: `signup-terms.js:65`, `confirm-dialog.js:52`. 초기 기재 314회/50파일/6줄은 오기, Cursor 0단계 2026-11-19 정정), 그리고 `var(--fw-semibold)` 21회 / 3개 파일(`design-system.css`, `home-right-rail.css`, `udx-std-apply.css`). `--fw-semibold: 600`은 `tokens.css:105`.
- 참고: 700은 368회, 500은 56회, 400은 25회.
- 운영 홈에서 SemiBold 파일이 실제로 받아진다(`/assets/Pretendard-SemiBold.subset-*.woff2`, 200).
- 앞선 예: 지시서 10 G에서 Medium(500)을 같은 방식으로 뺐다(500 → 400 파일로 그려짐).

### A. 정하는 방법 (기본안)
- **600은 Bold(700) 파일로 그린다.** Regular(400)로 그리면 브라우저가 가짜 굵게(합성)를 만들어 더 지저분해진다.
- 방법: 600 블록을 지우고, 700 블록을 `font-weight: 600 700;`(범위)로 바꾼다. 결과적으로 600 글자는 Bold 글꼴로 나온다(블록만 지워도 CSS 규칙상 700으로 가지만, 범위로 적어 뜻을 분명히 한다).
- `preview/shared/fonts/Pretendard-SemiBold.subset.woff2`는 지운다(10 G와 같음). 빌드 산출물 이름이 해시라 옛 CSS가 옛 파일을 찾는 일은 없다.
- 309곳의 `font-weight: 600` 규칙은 **고치지 않는다.**
- 위험: 600 글자(메뉴·버튼·카드 제목 등)가 조금 더 굵고 넓어진다. 그래서 줄바꿈·말줄임이 새로 생기는지 스크린샷으로 본다.

### B. 중복 요청 (운영 비로그인 홈, 요청 추적으로 확인)
1. **공지 `GET /api/board/posts.php?board_key=notice&view=home&limit=3` — 2번.**
   - ① `preview/home-ui/src/home-news-row.js:30-34` `noticeLoader` → `support/notice-store.js:84-87` `fetchHomeViewNotices(3)` (홈 공지 칸).
   - ② `preview/home-ui/src/main.js:195-211` `hydrateNotices()` → `board/board-backend.js:183-190` `hydrateNoticeHome()` (마이페이지 공지 줄 캐시 `getNoticeHomePosts`).
   - 두 요청이 **겹쳐서** 나간다(데스크톱 637ms·642ms 시작, 끝나기 전).
2. **동네 인사 `GET /api/neighborhood-greetings.php` — 2번.**
   - ① `home-news-row.js:160-170` `refreshGreetings` → `neighborhood-greeting-ui.js:145-150` `fetchGreetings` (`greetingLoader`, 60초 캐시) — 홈 칸.
   - ② `main.js:730-734` `pullNeighborhoodGreetings()` → `neighborhood-greeting-ui.js:33-35` → `preview/shared/neighborhood-greeting-store.js:237-250` `pullGreetingsFromApi` (localStorage 저장, 마이페이지 인사 편집이 읽음).
   - ②는 ①이 **끝난 뒤** 나간다(데스크톱 ① 639→949ms, ② 1192ms 시작). 그래서 「진행 중 요청 같이 기다리기」만으로는 안 줄고, 같은 세션 주인의 신선한(60초 안) 응답을 다시 써야 한다.
3. **찾기 `POST /api/search/search.php` 3번은 중복이 아니다.** 본문이 `tab: room / tutor / student`로 서로 다른 목록이다. **건드리지 않는다.**
4. 참고(범위 밖): `posts.php?board_key=notice&view=center`, `posts.php?board_key=notice`(view 없음), `/api/support/notices.php`는 주소·조건이 달라 같은 요청이 아니다. 이번에 건드리지 않는다.

### B. 고치는 방향 (0단계에서 Cursor가 확정해 보고)
- 공지: `board-backend.js`와 `notice-store.js` 안에서 `view=home&limit=3` 요청을 **하나의 진행 중 요청으로 같이 쓴다.** `fetchHomeViewNotices`는 지금처럼 실패 시 예외를 던지고, `hydrateNoticeHome`은 지금처럼 삼킨다. 끝난 뒤에는 공유하지 않는다(다음 새로고침은 새로 받는다). 로그인·로그아웃·역할 변경(`resetNoticeCaches` 포함) 때는 공유 중인 요청을 버린다.
- 인사: `pullNeighborhoodGreetings()`가 `greetingLoader`의 같은 세션 주인·60초 안 응답(원본 items)을 다시 써서 localStorage에 쓴다. 신선한 값이 없을 때만 요청한다. `changed`가 true면 다시 그리는 지금 동작은 그대로.
- `main.js`는 고치지 않는다(`scripts/verify-mypage-notice-top.mjs:76-84`가 `hydrateNotices` 모양을 검사한다).

---

## 0단계 — 먼저 진단만 하고 보고한 뒤 작업

승인 전에는 아무것도 고치지 않는다.

1. `git fetch` 후 `origin/main` 커밋을 적는다. ce7e0ccd가 아니면 위 줄 번호를 다시 본다.
2. 「확인된 사실」을 한 줄씩 「확인됨 / 다름(파일:줄)」으로 보고한다. 특히:
   - 600 사용 횟수(309회/46파일, var 21회/3파일).
   - 로컬 빌드 홈(비로그인)에서 공지 home·인사 요청이 2번씩인지와 각 출처(호출 스택).
   - search.php 3번의 본문이 서로 다른지.
3. B의 고칠 방법(함수 이름·바뀌는 줄)을 짧게 적어 보고한다.
4. 「허용 파일」 밖(특히 `main.js`)을 고쳐야 할 것 같거나, 하나라도 불확실하면 **즉시 멈추고 보고**한다.
5. 보고 형식: 「확인됨 / 다름(파일:줄) / 멈춤 사유 / 고칠 방법」. 종현 승인 뒤 작업한다.

---

## 허용 파일 (이 8개만)

| # | 파일 | 종류 |
|---|---|---|
| 1 | `preview/shared/fonts/pretendard.css` | 수정 — 600 블록 삭제, 700 블록 `600 700` |
| 2 | `preview/shared/fonts/Pretendard-SemiBold.subset.woff2` | 삭제 |
| 3 | `preview/home-ui/src/board/board-backend.js` | 수정 — 공지 home 요청 공유 |
| 4 | `preview/home-ui/src/support/notice-store.js` | 수정 — 공유 요청 사용 |
| 5 | `preview/home-ui/src/neighborhood-greeting-ui.js` | 수정 — 인사 응답 다시 쓰기 |
| 6 | `preview/shared/neighborhood-greeting-store.js` | 수정 — 받은 items를 저장하는 함수(요청 없이) |
| 7 | `preview/home-ui/src/home-news-row.js` | 수정 — 꼭 필요할 때만(0단계에서 필요 여부 보고) |
| 8 | `docs/worklog/2026/11/2026-11-19-20-speed-font-dedupe.md` | 새 작업 기록 |

**손대지 않는 것:** `preview/home-ui/src/main.js`, 다른 모든 CSS·JS(600 규칙 309곳 포함), `tokens.css`, Bold·Regular woff2, `public/**`, `src/**`(PHP), `scripts/**`, `.github/workflows/*`, `docs/internal/perf/home-initial-load-plan.md`.
- `docs/internal/perf/home-initial-load-plan.md`는 **main에 없고 docs 브랜치에만 있다.** 1.1·1.2 갱신은 머지 뒤 봇이 docs 브랜치에서 한다.

---

## 수락 기준

1. 운영 홈(비로그인)에서 `Pretendard-SemiBold` 파일 요청이 **0번**. 폰트 요청은 Regular·Bold 2개.
2. 폰트 404 없음(홈·찾기·가입·마이페이지).
3. 비로그인 홈에서 `posts.php?board_key=notice&view=home&limit=3` **1번**, `neighborhood-greetings.php` **1번**.
4. search.php는 지금처럼 3번(room·tutor·student).
5. 동작 그대로: 홈 공지 칸 3줄, 공지 팝업, 동네 인사 칸·팝업, 마이페이지 공지 줄, 마이페이지 인사 편집이 전과 같다. 로그인·로그아웃·역할 전환 뒤에도 새 세션 값으로 다시 받는다.
6. 스크린샷 전/후 나란히: 홈(비로그인), 찾기(공부방·과외쌤·학생), 마이페이지(공부방·과외쌤·학생 각 1장). 제목·버튼·메뉴가 굵게 바뀌는 것 말고 줄바꿈·잘림·겹침이 새로 생기지 않는다. 생기면 멈추고 보고한다.
7. 로컬 검사: `scripts/verify-home-news-row.mjs`, `scripts/verify-mypage-notice-top.mjs` 통과.
8. Verify bundle: 기존 실패 4개(Hide inquiry bundle, Tutor search fields, Tutor basic required, Student hope hidden required)는 원래 있던 것이다. **새 실패 이름이 생기면 머지하지 않고 보고한다.**

---

## 마무리

1. 바뀐 파일이 「허용 파일」과 같은지 `git diff --name-status origin/main...HEAD`로 확인해 보고한다. 7번을 안 고쳤으면 7개.
2. 커밋 → PR → 머지 → 배포(Cursor). 보고: PR 번호, main 머지 커밋, Deploy to dothome run 번호.
3. 배포 뒤 Cloudflare 캐시는 봇이 비운다(Cursor는 하지 않는다). 그 뒤 봇이 운영 요청 수·폰트 크기·LCP를 다시 잰다.

## 작업 기록 (`docs/worklog/2026/11/2026-11-19-20-speed-font-dedupe.md`)

- 0단계 보고 요약, 바뀐 파일, 600 → Bold 결정과 이유, 중복 요청 2건의 출처와 고친 방법, 전/후 요청 수, 스크린샷 경로, PR·머지·배포 번호.
