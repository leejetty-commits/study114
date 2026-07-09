# Study114 핵심 플로우 점검 체크리스트

**기준일:** 2026-07-10  
**라운드:** 8 (BLOCKER — src FTP 자동화 · OAuth 키 사람 작업)  
**운영 URL:** http://study114.dothome.co.kr

---

## A. 오늘 점검 범위

- [6단계] 마이페이지 — 찜 · 비교 · 최근열람 (로컬 e2e)
- [4단계] 홈 → 검색 → 상세 플로우 (guest/parent · 로컬 브라우저 실측) — **완료**
- 로컬 e2e: `e2e/core-flow-mypage.spec.js` (4케이스) · `e2e/core-flow-search-detail.spec.js` (8케이스)

미포함 (다음 라운드): **BLOCKER** — OAuth 키 (사람) · `src/` FTP는 Actions에 추가됨 (push 후 확인)

### [4단계] 홈 → 검색 → 상세 (라운드 4)

| # | 플로우 | 역할 | 분류 | 결과 | 상태 |
|---|--------|------|------|------|------|
| 4-1 | `#/guest` GNB 공부방찾기 노출 | guest | 화면 | `nav.home-gnb` · 공부방찾기 링크 | **OK** |
| 4-2 | GNB 클릭 → search-ui 새 탭 | guest | 라우트 | `:5176/#/search/room?role=guest` | **OK** |
| 4-3 | guest 홈 카드 클릭 → 상세 모달 | guest | 상세 연결 | `#p24-detail-modal` · 카드 `[data-provider-id]` 클릭 | **OK** |
| 4-4 | guest 상세 → 로그인 CTA | guest | 상세 연결 | `로그인하고 문의하기` → auth-ui | **OK** |
| 4-5 | search-ui region feed → 상세 | guest | 라우트+상세 | `#/search/room?role=guest` · 카드 클릭 | **OK** |
| 4-6 | search-ui 검색 실행 → reset | guest | 화면 | submit → `.search-results--executed` → reset | **OK** |
| 4-7 | parent `#/parent` 인라인 찾기 → 상세 | parent | 화면+상세 | `[data-search-form]` · 카드 클릭 | **OK** |
| 4-8 | parent 상세 찜 토글 | parent | API+상세 | handoff ON · 라벨 변경 · 토스트 | **OK** |
| 4-9 | parent 상세 비교 → compare-bar | parent | API+상세 | 모달 `비교 담김` · `.compare-bar` 노출 | **OK** |
| 4-10 | parent 상세 → 쪽지 compose | parent | 상세 연결 | `상담/쪽지 보내기` → `[data-overlay="compose"]` | **OK** |
| 4-11 | search-ui parent · 상세 → 최근열람 | parent | API+라우트 | tutor 상세 후 `#/mypage/recent` 기록 | **OK** |

**e2e:** `core-flow-search-detail.spec.js` **8/8 통과** (로컬 :5174 · :5176 · API :8080)

**주의 (비교):** handoff compare가 3/3 가득 찬 상태면 상세 모달에서 추가 비교가 거부됨(토스트). e2e는 `beforeEach`에서 compare 초기화 후 통과. 일반 플로우는 **OK**.

**코드 관찰 (이번 단계 BLOCKER 아님):**

- `search-handoff.js`의 `data-action="search-open-detail"` — import/핸들러 없음 (dead code). 실제 상세 진입은 **카드 클릭** (`bindDetailDecisionEvents`) 경로.
- guest 카드 찜/비교는 `data-action="login-gate"` (`guest-sections.js`) — 로그인 유도만.

**운영 src/ 미동기화:** **PARTIAL** 유지 — study_room/tutor basic-register 운영 최종 확정은 별도 src/ 동기화 필요. **4단계 진행 차단 아님.**

---

## A-legacy. 이전 라운드 요약 (1~3)

- [1단계] 라우팅 8/8 OK · [2단계] Auth API OK (OAuth 키 **BLOCKER**) · [3단계] signup→basic-register 5/5 OK

### [3단계] 회원가입 → 기본등록 저장 (라운드 3)

| 항목 | 역할 | 결과 | 상태 |
|------|------|------|------|
| signup API | student / study_room / tutor | 로컬 e2e 3/3 통과 | **OK** |
| basic-register API | student / study_room / tutor | DB 저장 + `kind`/`id` 반환 | **OK** |
| auth-ui 화면 플로우 | student | 약관→역할→가입폼→기본등록→완료 e2e 통과 | **OK** |
| 완료 후 홈 분기 | student → `#/parent` | 새 탭 home-ui 진입 확인 | **OK** |

**수정한 버그 (확정):**

1. `signup-form.js` — `esc is not defined` → 가입폼 화면 미렌더 (**BLOCKER** 해소)
2. `ProfileGenderSync.php` — 동일 gender UPDATE 시 rowCount 0 오판 → study_room/tutor basic-register 실패 (**BLOCKER** 해소)

---

## B. 단계별 점검 결과

### [1단계] 진입/라우팅 기본 점검

| 라우트 | 기대 | 실제 (로컬 :5174) | 운영 | 상태 |
|--------|------|-------------------|------|------|
| `#/guest` | 비회원 홈 | Playwright 8/8 통과, `#app` 렌더 | 메인 HTML 정상 | **OK** |
| `#/parent` | 학부모 홈 | 통과 | (미브라우저) | **OK** (로컬) |
| `#/study-room` | 공부방 홈 | 통과 | — | **OK** (로컬) |
| `#/tutor` | 과외쌤 홈 | 통과 | — | **OK** (로컬) |
| `#/support` | 고객센터 | 통과 | — | **OK** (로컬) |
| `#/mypage` | 마이페이지 | 통과 | — | **OK** (로컬) |
| `#/library` | 자료실 | 통과 | — | **OK** (로컬) |
| 빈 hash | `#/guest` 리다이렉트 | 통과 | — | **OK** |
| `/auth/` SPA | 로그인 UI | — | 페이지·폼·소셜 버튼 노출 | **OK** |
| `/search/` SPA | 검색 UI | — | 공부방 탭·피드 렌더 | **OK** |

**실패 지점:** 없음 (1단계 범위)

**원인 확인:** hash 라우터(`preview/home-ui/src/state.js`) + SPA fallback(`.htaccess`) 정상 연결.

---

### [2단계] 인증(Auth) 기능 점검

| 항목 | 기대 | 실제 | 분류 | 상태 |
|------|------|------|------|------|
| 이메일 로그인 API | JSON 200 + 세션 | 운영: `guardian1@dev.local` 로그인 200, `role_type: guardian_student` | — | **OK** (운영) |
| 세션 유지 (`me.php`) | 로그인 후 authenticated | 운영: `authenticated:true`, `email_verified:true` | — | **OK** (운영) |
| 로그아웃 | JSON 200 | 운영: `{"ok":true,"logged_out":true}` | — | **OK** (운영) |
| 비로그인 me | authenticated:false | 운영·로컬 모두 확인 | — | **OK** |
| 이메일 로그인 (로컬 API) | dev 계정 로그인 | compose DB env 수정 후 e2e **5/5 통과** | — | **OK** (로컬) |
| 소셜 버튼 UI | 3종 노출 | 운영 auth UI에 네이버/카카오/Google 버튼 존재 | UI만 있음 | **PARTIAL** |
| 소셜 OAuth start | provider redirect | 운영: 302 → `study114.dothome.co.kr/auth/#/login?oauth_error=…` (키 미설정) | env/config | **PARTIAL** |
| OAuth provider 키 | 콘솔·env 등록 | `OAUTH_*` 미설정 — naver/kakao/google 동일 | env/config | **BLOCKER** |
| OAuth 오류 redirect URL | 운영 auth URL | SetEnv 배포 후 localhost 폴백 **해소** (`7fef1a1`) | — | **OK** |
| 회원가입 API | JSON 201 | 운영: 전체 필드 payload → 201, `user_id`·세션 쿠키 발급 | — | **OK** (운영) |
| 이메일 인증 | verify 후 플래그 | 운영 dev 계정 `email_verified:true` 확인 | — | **PARTIAL** (플로우 E2E 미검) |

**소셜로그인 상세 (운영 실측):**

```
GET /api/auth/oauth/start.php?provider=naver|kakao|google
→ 302 Location: http://study114.dothome.co.kr/auth/#/login?oauth_error=소셜 로그인 설정이 완료되지 않았습니다...
```

- 버튼: **있음**
- provider 설정: **없음** (`OAUTH_*` env 비어 있음)
- redirect URI (코드 기준): `http://study114.dothome.co.kr/api/auth/oauth/callback.php?provider=*` — 콘솔 등록 필요
- callback 복귀: **미검증** (start 단계에서 차단)
- 실패 지점: `OAuthService::isConfigured()` false (키 미설정). redirect URL 문제는 **해소됨**

---

## C. 발견된 치명 문제 (Blocker)

| # | 문제 | 영향 | 상태 |
|---|------|------|------|
| B1 | ~~운영 PHP `STUDY114_*` env 미설정~~ | OAuth redirect localhost | **OK** — `.htaccess` SetEnv 배포됨 (`7fef1a1`, GHA #15) |
| B2 | OAuth provider 키 미설정 | 소셜 로그인 전면 불가 | **BLOCKER** — 닷홈 SetEnv + 콘솔 등록 필요 |
| B3 | ~~로컬 Docker API DB 인증 실패~~ | 로컬 login/signup API 500 | **OK** — `docker-compose.dev.yml`에 `STUDY114_DB_*` 명시 |

### Provider별 설정 상태 (라운드 2)

| Provider | Client ID/Key | Client Secret | Redirect URI (코드 생성) | 콘솔 등록 | 상태 |
|----------|---------------|---------------|--------------------------|-----------|------|
| Naver | `OAUTH_NAVER_CLIENT_ID` 비어 있음 | `OAUTH_NAVER_CLIENT_SECRET` 비어 있음 | `http://study114.dothome.co.kr/api/auth/oauth/callback.php?provider=naver` | 미확인 | **미설정** |
| Kakao | `OAUTH_KAKAO_REST_API_KEY` 비어 있음 | (선택) `OAUTH_KAKAO_CLIENT_SECRET` | `http://study114.dothome.co.kr/api/auth/oauth/callback.php?provider=kakao` | 미확인 | **미설정** |
| Google | `OAUTH_GOOGLE_CLIENT_ID` 비어 있음 | `OAUTH_GOOGLE_CLIENT_SECRET` 비어 있음 | `http://study114.dothome.co.kr/api/auth/oauth/callback.php?provider=google` | 미확인 | **미설정** |

**공통 env (운영):**

| 변수 | 코드 기대값 | 운영 상태 |
|------|-------------|-----------|
| `STUDY114_API_BASE` | `http://study114.dothome.co.kr` | **OK** (`.htaccess` SetEnv) |
| `STUDY114_HOME_UI` | `http://study114.dothome.co.kr` | **OK** |
| `STUDY114_AUTH_UI` | `http://study114.dothome.co.kr/auth` | **OK** |

**로컬 개발 redirect URI** (`STUDY114_API_BASE=http://127.0.0.1:8080`):

- `http://127.0.0.1:8080/api/auth/oauth/callback.php?provider=naver|kakao|google`

---

## D. 수정한 파일 목록

| 파일 | 변경 내용 |
|------|-----------|
| `public/.htaccess` | `STUDY114_API_BASE` / `HOME_UI` / `AUTH_UI` SetEnv 추가 (OAuth redirect localhost 문제) |
| `e2e/core-flow-routing.spec.js` | [1단계] 라우팅 스모크 테스트 신규 |
| `e2e/core-flow-signup-basic.spec.js` | [3단계] signup → basic-register |
| `e2e/core-flow-search-detail.spec.js` | [4단계] 홈 → 검색 → 상세 |
| `docs/internal/core-flow-audit-checklist.md` | 본 체크리스트 |

---

## E. 빌드/배포 여부

| 항목 | 결과 |
|------|------|
| 라운드 3 commit | `8b7a510` — signup-form esc, ProfileGenderSync, signup e2e, build |
| GitHub Actions | **Deploy to dothome #17** — commit `8b7a510` |
| 라운드 4 | e2e `core-flow-search-detail.spec.js` 추가 · **미 commit** |
| `npm run build:dothome` | 라운드 4 **미실행** (프론트 변경 없음) |

### 로컬 DB 복구 원인 (확정)

- `config/database.php`(gitignore)가 **닷홈 계정** `study114` / DB `study114` 로 설정됨
- Docker compose는 `STUDY114_DB_*` 미주입 → 닷홈 기본값으로 로컬 MySQL 접속 시도 → `Access denied`
- **조치:** `docker-compose.dev.yml`에 `study114_dev` / `root` / `study114dev` 명시

---

## F. 운영 사이트 검증 결과

| URL/기능 | 결과 |
|----------|------|
| http://study114.dothome.co.kr/ | **OK** — guest 홈·피드·지도 영역 렌더 |
| http://study114.dothome.co.kr/auth/ | **OK** — 로그인 폼·소셜 버튼 |
| http://study114.dothome.co.kr/search/ | **OK** — 검색 UI 진입 |
| POST `/api/auth/login.php` | **OK** — dev 학부모 계정 |
| GET `/api/auth/me.php` (로그인 후) | **OK** — 세션·역할·이메일인증 플래그 |
| POST `/api/auth/logout.php` | **OK** |
| GET `/api/auth/oauth/start.php` | **BLOCKER** — 미설정 + localhost redirect |
| `/api/health/db.php` | **노출 중** — DB 연결 성공 JSON (삭제 권장) |

---

## G. 다음 단계 (권장 순서)

> **한 줄 결론:** 운영 실측으로 제품 수정분(쪽지·마이페이지)을 먼저 닫고 → OAuth 키 · 운영 `src/` 동기화 BLOCKER 처리.

### 1순위 — 닷홈 운영 실측 (라운드 7 · **완료 7/7 OK**)

로컬 검증 완료분을 운영에서 확인. **7/7 OK → [5]+[6] 검증 완료로 묶음** (아래 J).

| # | 확인 항목 | 로컬 | 운영 |
|---|-----------|------|------|
| M1 | 쪽지 compose → **thread 진입 · 본문 표시** (크래시 없음) | OK (`a2ba727`) | **OK** (1.9s) |
| M2 | 상세 모달 → compose 전송 후 **모달 닫힘** | OK | **OK** (1.9s) |
| M3 | 차단 후 **`차단됨` 배너** · 답장 불가 | OK | **OK** (1.8s) |
| M4 | **받은/보낸** 탭 필터 (parent 보낸 쪽지 → 보낸 탭) | OK | **OK** (1.8s) |
| P1 | 마이페이지 **recent** 연동 | OK (4/4) | **OK** (1.7s) |
| P2 | 마이페이지 **wishlist** 연동 | OK | **OK** (재실행 1.8s · 1차 suite close 타임아웃 플레이크) |
| P3 | **compare** (상세·API·parent compare-bar) | OK | **OK** (1.9s) |

**운영 전제:** https://study114.dothome.co.kr · `guardian1@dev.local` · Actions run #19–20 success

**실측 URL:** `/#/parent` · `/#/mypage/messages/inbox|sent` · `/#/mypage/wishlist|recent`

### 2순위 — 검증 완료 묶음 ✅

- **[5단계] 쪽지** — 로컬 9/9 + **운영 M1–M4 OK** → **완료**
- **[6단계] 마이페이지** — 로컬 4/4 + **운영 P1–P3 OK** → **완료**

### 3순위 — 기존 BLOCKER (라운드 8)

| # | BLOCKER | 상태 | 조치 |
|---|---------|------|------|
| B2 | OAuth provider 키 | **BLOCKER 유지** — 키 발급은 사람 작업 (아래 K) | 콘솔 등록 + 닷홈 `SetEnv OAUTH_*` |
| B4 | 운영 `src/` 미동기화 | **해소 진행** — Actions에 `src/` FTP 단계 추가 | `main` push 후 GHA 확인 |
| — | `/api/health/db.php` | 별도 | 운영 삭제 |

---

## K. [라운드 8] BLOCKER 정리

### K-1. 운영 `src/` 동기화

**원인:** GitHub Actions는 기존에 `public/`만 FTP → `/hosting/study114/src/`는 수동. `ProfileGenderSync.php` 등 PHP 수정이 운영에 안 올라감.

**조치:** `.github/workflows/deploy.yml`에 `Deploy src/ via FTP` 단계 추가  
- local: `./src/` → server: `/hosting/study114/src/`

**검증 (push 후):**
1. Actions 초록불 (public + src 두 FTP step)
2. 운영 study_room/tutor basic-register — gender 동일값 재제출 시 실패하지 않음 (로컬에서 `8b7a510`으로 해소된 버그)

### K-2. OAuth provider 키 (사람 작업 · 코드만으로 완료 불가)

**현재 운영:** `oauth/start.php` → 302 `oauth_error=소셜 로그인 설정이 완료되지 않았습니다` (키 없음 확인됨)

**사람이 할 일 (순서):**

1. **콘솔 앱 등록** — Redirect URI 각각 등록  
   - `http://study114.dothome.co.kr/api/auth/oauth/callback.php?provider=naver`  
   - `http://study114.dothome.co.kr/api/auth/oauth/callback.php?provider=kakao`  
   - `http://study114.dothome.co.kr/api/auth/oauth/callback.php?provider=google`  
   - (HTTPS 전환 시 `https://` URI도 추가)
2. **닷홈 `html/.htaccess`에 SetEnv 추가** (git에 시크릿 넣지 않음 · 서버만)  
   ```
   SetEnv OAUTH_NAVER_CLIENT_ID ...
   SetEnv OAUTH_NAVER_CLIENT_SECRET ...
   SetEnv OAUTH_KAKAO_REST_API_KEY ...
   SetEnv OAUTH_GOOGLE_CLIENT_ID ...
   SetEnv OAUTH_GOOGLE_CLIENT_SECRET ...
   ```
3. **검증:** `GET /api/auth/oauth/start.php?provider=naver` → provider 로그인 페이지로 302 (auth 오류 페이지 아님)

**참고:** `config/oauth.env.example` · `config/dothome.env.example`

---

## J. [라운드 7] 닷홈 운영 실측

**일시:** 2026-07-10 · **URL:** https://study114.dothome.co.kr  
**계정:** `guardian1@dev.local` · **자동화:** `e2e/ops-round7-dothome.spec.js`  
**결과: 7/7 OK → [5]+[6] 검증 완료**

| # | 항목 | 결과 | 메모 |
|---|------|------|------|
| M1 | 쪽지 compose → thread · 본문 | **OK** | ~1.9s |
| M2 | compose 후 모달 닫힘 | **OK** | `#p24-detail-modal` count 0 |
| M3 | 차단됨 배너 · 답장 불가 | **OK** | |
| M4 | 보낸 쪽지 → 보낸 탭 | **OK** | 받은 탭 1번째 아님(설계대로) |
| P1 | 마이페이지 recent | **OK** | 상세 제목 노출 |
| P2 | 마이페이지 wishlist | **OK** | 7케이스 일괄 실행 시 close 타임아웃 1회 → 단독 재실행 PASS |
| P3 | compare (상세·API·compare-bar) | **OK** | compare-bar parent 홈에서 확인 |

---

## H. [5단계] 쪽지 플로우 (라운드 5 · 로컬)

**e2e:** `e2e/core-flow-messages.spec.js` (9케이스) · 헬퍼 `e2e/helpers/messages-flow.js`
**최종 기록 (라운드 5 + H-1/H-2/H-3): 9/9 통과, 핵심 버그 2건 해결, e2e 보강 2건**

| # | 케이스 | 결과 | 비고 |
|---|--------|------|------|
| 1 | guest 상세 → 로그인 CTA (auth 새 탭) | **OK** | |
| 2 | guest 쪽지함 비로그인 (데모 스레드) | **OK** | PARTIAL 성격 — 데모 데이터, API 아님. **정책 변경 예정:** 비회원은 로그인 유도만 |
| 3 | parent compose → 전송 → thread 진입 | **OK** | thread 본문 버그 수정 후 통과 |
| 4 | 전송 후 API threads · inbox 목록 | **OK** | H-3: e2e 탭·assertion 수정 후 통과 (2.6s) |
| 5 | thread 답장 전송 | **OK** | 상세 모달 미닫힘 수정 후 통과 (5.4s) |
| 6 | 보관함(archive) 빈 상태 | **OK** | |
| 7 | 차단 후 답장 불가 · 종료 배너 | **OK** | H-1 분리 확인 후 H-2 e2e 수정 · PASS (2.5s) |
| 8 | tutor 무료 · 학생 상세 → 쪽지권 게이트 | **OK** | |
| 9 | 로그인 → parent 상세 → 첫 쪽지 전송 | **OK** | |

### 해결 완료 — thread 본문 미표시 버그

**증상:** parent compose 전송 후 API 저장(POST 200)·URL 이동(`#/mypage/messages/thread/{id}`)은 정상이었으나, thread 화면에 방금 보낸 본문이 표시되지 않고 브라우저 탭이 응답 불가 → 크래시.

**원인:** `preview/home-ui/src/messages/screens.js`의 `bindMessagesScreenEvents()`가 렌더마다 `ensureThreadDetail().then(rerender)`를 무조건 실행 → **무한 렌더 루프**.

**수정:** `lastAutoHydratedThreadId` 가드로 threadId당 1회만 하이드레이션·rerender.

**수정 파일:** `preview/home-ui/src/messages/screens.js`, `preview/home-ui/src/messages-backend.js`(캐시 키 정규화 보조)

### 해결 완료 — 상세 모달(`#p24-detail-modal`) 미닫힘

**증상:** compose 전송 후 thread 화면으로 이동해도 배경 공부방 상세 모달이 남아, 답장/차단 버튼 클릭을 가로챔.

**원인:** `[data-p24-action="memo"]` 클릭 시 compose만 열고 `closeDetailModal()` 미호출.

**수정:** memo 클릭 시 `closeDetailModal()` 선행 호출.

**수정 파일:** `preview/home-ui/src/detail-decision/detail-shell.js`

**검증:** 케이스 5(답장 전송) **PASS** (5.4s)

### H-1 완료 — 차단 케이스 분리 확인

**판정:** 제품 버그 아님. 기존 실패 원인 = 로컬 dev DB 차단 상태 누적(thread 1 · guardian1 `is_blocked=1`). 깨끗한 상태에서 차단 흐름·답장 제한 정상. e2e assertion 문구 불일치(`차단된 대화입니다` vs 실제 `차단됨`)는 별도.

### H-2 완료 — 차단 e2e 보강

- `prepBlockThreadE2e()` — guardian1 · study_room 1 차단 상태 초기화 (`e2e/helpers/admin-api.js`)
- assertion `차단됨` + 차단 버튼 enabled 사전 확인 (`e2e/core-flow-messages.spec.js`)
- **검증:** 케이스 7 **PASS** (2.5s)

### H-3 완료 — inbox(4번) 케이스 분리 확인

**판정:** 제품 버그 아님. parent compose 후 thread는 `initiatedByMe=true`·읽음 처리 → 받은 탭 필터(`!initiatedByMe || unread`)에서 **제외**됨. thread 7(상대 발신·미읽)이 받은 탭 1번째로 보인 것은 **정상 동작**. 기존 실패 = e2e가 받은 탭 1번째 행을 기대한 **assertion 설계 오류** + thread 1 차단 상태 누적(부수).

**수정:** `prepBlockThreadE2e()` 선행 · 목록 확인을 **보낸 탭** + thread id 행 지정 (`e2e/core-flow-messages.spec.js`)

**검증:** 케이스 4 **PASS** (2.6s)

### e2e·헬퍼 (commit: `a2ba727`)

- `e2e/core-flow-messages.spec.js` — 차단·inbox(sent) fixture·assertion
- `e2e/helpers/messages-flow.js` — tutor assertion strict mode 수정, dialog 핸들러 방어
- `e2e/helpers/admin-api.js` — `prepBlockThreadE2e()`

---

## I. [6단계] 마이페이지 (라운드 6 · 로컬)

**e2e:** `e2e/core-flow-mypage.spec.js` (4케이스) · 헬퍼 `e2e/helpers/mypage-flow.js`
**결과: 4/4 통과**

| # | 케이스 | 결과 | 비고 |
|---|--------|------|------|
| 1 | 상세 찜 → `#/mypage/wishlist` 노출 + favorites API | **OK** | 2.0s |
| 2 | 상세 비교 → compare-bar + compare API count | **OK** | 2.0s |
| 3 | 찜 목록 `비교` 버튼 → API + parent 홈 compare-bar | **OK** | compare-bar는 마이페이지 본문 미렌더(탐색 화면 전용) |
| 4 | search-ui tutor 상세 → `#/mypage/recent` + recent API | **OK** | 2.1s |

**코드 관찰 (BLOCKER 아님):** `compare-bar`는 `parent.js`·`tutor.js` 탐색 홈에만 포함. 마이페이지 찜에서 비교 담기 후 바는 parent 홈 이동 시 노출.

### e2e·헬퍼 (commit: `32ea694`)

- `e2e/core-flow-mypage.spec.js`
- `e2e/helpers/mypage-flow.js`

---

## 상태 범례

- **OK** — 기대 플로우 동작 확인
- **BLOCKER** — 핵심 플로우 중단, 우선 복구
- **PARTIAL** — UI 또는 일부 API만 동작
- **HOLD** — 아직 미검증
