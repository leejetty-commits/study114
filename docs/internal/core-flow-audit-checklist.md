# Study114 핵심 플로우 점검 체크리스트

**기준일:** 2026-07-10  
**라운드:** 1 (진입/라우팅 + Auth 1차)  
**운영 URL:** http://study114.dothome.co.kr

---

## A. 오늘 점검 범위

- [1단계] 진입/라우팅 기본 점검 (home-ui hash routes)
- [2단계] 인증(Auth) 기능 점검 — API·세션·소셜로그인 설정 상태
- 운영 사이트 실측 (curl + 페이지 fetch)
- 로컬 e2e 스모크 (`e2e/core-flow-routing.spec.js`, `e2e/core-flow-auth.spec.js`)

미포함 (다음 라운드): [3] 가입/기본등록 저장, [4] 검색 플로우, [5] 상세/행동, [6] 쪽지, [7] 마이페이지

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
| 이메일 로그인 (로컬 API) | dev 계정 로그인 | Docker API DB `Access denied for user 'study114'` → 500 | env/config | **BLOCKER** (로컬만) |
| 소셜 버튼 UI | 3종 노출 | 운영 auth UI에 네이버/카카오/Google 버튼 존재 | UI만 있음 | **PARTIAL** |
| 소셜 OAuth start | provider redirect | 운영: 302 → `127.0.0.1:5173/#/login?oauth_error=소셜 로그인 설정이 완료되지 않았습니다` | env/config + redirect | **BLOCKER** |
| OAuth provider 키 | 콘솔·env 등록 | `OAUTH_*` 미설정 (`config/oauth.php` 빈 값) | env/config | **BLOCKER** |
| OAuth 오류 redirect URL | 운영 auth URL | `STUDY114_AUTH_UI` 미설정 → localhost 폴백 | env/config | **BLOCKER** (수정 준비됨) |
| 회원가입 API | JSON 201 | 운영: 전체 필드 payload → 201, `user_id`·세션 쿠키 발급 | — | **OK** (운영) |
| 이메일 인증 | verify 후 플래그 | 운영 dev 계정 `email_verified:true` 확인 | — | **PARTIAL** (플로우 E2E 미검) |

**소셜로그인 상세 (운영 실측):**

```
GET /api/auth/oauth/start.php?provider=naver
→ 302 Location: http://127.0.0.1:5173/#/login?oauth_error=소셜 로그인 설정이 완료되지 않았습니다...
```

- 버튼: **있음**
- provider 설정: **없음** (`OAUTH_NAVER_CLIENT_ID` 등)
- redirect URI (코드 기준): `http://study114.dothome.co.kr/api/auth/oauth/callback.php?provider=*` — 콘솔 등록 필요
- callback 복귀: **미검증** (start 단계에서 차단)
- 실패 지점: `OAuthService::isConfigured()` false + `authUiBase()` localhost

---

## C. 발견된 치명 문제 (Blocker)

| # | 문제 | 영향 | 상태 |
|---|------|------|------|
| B1 | 운영 PHP `STUDY114_*` env 미설정 | OAuth 오류·성공 redirect가 localhost로 향함 | **수정 파일 준비** (`public/.htaccess` SetEnv) — **배포 전** |
| B2 | OAuth provider 키 미설정 | 소셜 로그인 전면 불가 | **서버/콘솔 작업 필요** (코드만으로 해결 불가) |
| B3 | 로컬 Docker API DB 인증 실패 | 로컬에서 login/signup API 500 | **로컬 env** (`config/database.php` 또는 compose) |

---

## D. 수정한 파일 목록

| 파일 | 변경 내용 |
|------|-----------|
| `public/.htaccess` | `STUDY114_API_BASE` / `HOME_UI` / `AUTH_UI` SetEnv 추가 (OAuth redirect localhost 문제) |
| `e2e/core-flow-routing.spec.js` | [1단계] 라우팅 스모크 테스트 신규 |
| `e2e/core-flow-auth.spec.js` | [2단계] Auth API 스모크 테스트 신규 |
| `docs/internal/core-flow-audit-checklist.md` | 본 체크리스트 |

---

## E. 빌드/배포 여부

| 항목 | 결과 |
|------|------|
| `npm run build:dothome` | **미실행** (이번 턴은 `.htaccess`·e2e·문서만 변경) |
| git status | `public/.htaccess` + e2e 2개 + checklist 수정 (uncommitted) |
| commit | **없음** (사용자 요청 전) |
| push | **없음** |
| GitHub Actions | `gh` CLI 미설치 — **미확인** (마지막 커밋 `acfc8ee`) |

> `.htaccess`는 `public/`에 포함되므로 **push 후 Actions FTP 배포**가 되어야 운영 OAuth redirect 수정이 반영됩니다.

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

1. **commit + push** — `.htaccess` SetEnv 반영 (OAuth redirect localhost 수정)
2. **닷홈 서버** — `OAUTH_NAVER_*`, `OAUTH_KAKAO_*`, `OAUTH_GOOGLE_*` SetEnv 또는 닷홈 패널 등록
3. **로컬 Docker** — `study114-api-dev` DB 비밀번호 정합 (`config/database.php` ↔ compose)
4. **[2단계 잔여]** 회원가입 API 운영 E2E · auth-ui 화면→API 연결 Playwright
5. **[3단계]** 역할 선택 → basic-register 저장까지
6. **[4단계]** 홈 → 검색 → 상세 클릭 연결
7. **보안** — `/api/health/db.php` 운영 서버에서 삭제

---

## 상태 범례

- **OK** — 기대 플로우 동작 확인
- **BLOCKER** — 핵심 플로우 중단, 우선 복구
- **PARTIAL** — UI 또는 일부 API만 동작
- **HOLD** — 아직 미검증
