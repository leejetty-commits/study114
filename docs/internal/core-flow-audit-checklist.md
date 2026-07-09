# Study114 핵심 플로우 점검 체크리스트

**기준일:** 2026-07-10  
**라운드:** 4 (홈 → 검색 → 상세 플로우)  
**운영 URL:** http://study114.dothome.co.kr

---

## A. 오늘 점검 범위

- [4단계] 홈 → 검색 → 상세 플로우 (guest/parent · 로컬 브라우저 실측)
- 로컬 e2e: `e2e/core-flow-search-detail.spec.js` (8케이스)

미포함 (다음 라운드): [5] 쪽지 완결, [6] 마이페이지, 운영 실측(4단계)

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

## G. 다음 단계

1. **닷홈 서버** — `OAUTH_*` SetEnv + 콘솔 redirect URI 등록 (기존 **BLOCKER**)
2. **운영 src/ 동기화** — `ProfileGenderSync.php` 등 PHP `src/` FTP/배포 (study_room/tutor basic-register 운영 확정)
3. **[5단계]** 쪽지 발송·수신·스레드 완결 플로우
4. **[6단계]** 마이페이지 (찜·비교·최근열람 운영 실측)
5. **보안** — `/api/health/db.php` 운영 삭제 (별도 라운드)

---

## 상태 범례

- **OK** — 기대 플로우 동작 확인
- **BLOCKER** — 핵심 플로우 중단, 우선 복구
- **PARTIAL** — UI 또는 일부 API만 동작
- **HOLD** — 아직 미검증
