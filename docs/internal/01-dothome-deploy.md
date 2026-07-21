# 닷홈 shared hosting 배포 가이드

**문서 성격:** DB 연결·최소 구동 확인용 (**현재 1차 배포 목표**)  
**기준일:** 2026-07-10  
**도메인:** `http://study114.dothome.co.kr`  
**관련:** [internal/README.md](./README.md) · [00-project-tree-and-key-files.md](./00-project-tree-and-key-files.md) · [01-cafe24-staging-deploy.md](./01-cafe24-staging-deploy.md) (카페24용, 별도 유지) · Cursor 규칙 `.cursor/rules/study114-workflow.mdc`

---

## 1) 요약 — 지금 당장 알아둘 것

### 가장 중요한 설정값

| 항목 | 값 |
|------|-----|
| 사이트 URL | `http://study114.dothome.co.kr` |
| 웹루트 (FTP) | `/hosting/study114/html` |
| PHP | 8.2 |
| DB 호스트 | `localhost` |
| DB 이름 | `study114` |
| DB 사용자 | `study114` |
| DB 비밀번호 | **본인이 설정한 값** (파일에 직접 입력, git 제외) |

### 지금 당장 막힐 수 있는 위험요소

| 위험 | 대응 |
|------|------|
| `config/database.php` 없음 | `database.php.dothome.example` 복사 후 비밀번호 입력 |
| DB 스키마 미적용 | phpMyAdmin에서 `sql/schema/*.sql` 순서대로 import |
| **로컬만 빌드·수정** | GitHub에 push하지 않으면 Actions 배포 안 됨 → [§4-A GitHub Actions](#4-a-github-actions-자동배포-권장) |
| **`VITE_NAVER_MAP_CLIENT_ID` Variable 미설정** | repo Settings → Variables → Actions에 등록 후 workflow 재실행 |
| **빌드 산출물 gitignore** | `public/index.html`, `public/assets/index-*` 등은 Git 미추적 → **CI에서 빌드 후 FTP** |
| PHP URL이 localhost로 남음 | `.htaccess` SetEnv 또는 `config/*.php` 확인 |
| `.htaccess` mod_expires 오류 | `ExpiresActive`·짝 없는 `</IfModule>` → 사이트 전체 500 → [§3-1 안전 `.htaccess`](#3-1-htaccess-안전-최소본) |
| 네이버 지도 안 나옴 | 빌드 키 반영 + 콘솔 허용 URL → [§7 네이버 지도](#7-네이버-지도--사람이-할-일) |
| `db.php` 방치 | 테스트 후 **반드시 삭제** |
| **`src/`·`config/` 미배치** | `html/` 밖 형제 폴더 필요 — Actions는 `public/`만 올림 → [§8 FTP](#8-ftp-업로드-체크리스트) |

---

## 2) 웹루트 배치 — 3가지 시나리오 비교

| 방식 | 구조 | 판단 |
|------|------|------|
| **① public 내용 → html/** | `/hosting/study114/html/` = repo `public/` | **✅ 권장** |
| ② html/public 유지 | `/hosting/study114/html/public/` | ❌ `index.php`가 `src/`를 못 찾음 |
| ③ src를 html 안에 | 보안·경로 모두 불리 | ❌ 비권장 |

### 권장 최종 트리 (닷홈 FTP)

```
/hosting/study114/
├── html/                          ← repo public/ 내용 전부
│   ├── index.php                  ← PHP MVC 진입
│   ├── index.html                 ← home-ui 빌드 결과
│   ├── .htaccess
│   ├── api/
│   │   ├── health/db.php          ← ⚠️ 테스트 후 삭제
│   │   └── …
│   ├── assets/                    ← MVC css + SPA 빌드 자산
│   ├── auth/                      ← auth-ui SPA
│   ├── search/                    ← search-ui SPA
│   └── register/
│       ├── room/                  ← study-room-ui SPA
│       └── tutor/                 ← tutor-ui SPA
├── src/                           ← repo src/ (html 밖)
├── config/
│   └── database.php               ← 서버에서 생성 (gitignore)
└── storage/
    ├── logs/
    └── attachments/               ← 쓰기 권한 필요
```

> `index.php`는 `dirname(__DIR__).'/src/bootstrap.php'`를 읽습니다.  
> 즉 **`src/`는 `html/`과 같은 깊이(형제 폴더)** 여야 합니다.

### 3-1. `.htaccess` 안전 최소본

닷홈 shared hosting에서 **사이트 전체 500**을 낸 사례: `mod_expires` 블록에서 `<IfModule>`이 주석과 한 줄에 붙고, 짝 없는 `</IfModule>`만 남는 패턴.

**운영 권장:** `public/.htaccess`는 rewrite + `DirectoryIndex`만 유지. 아래는 **넣지 않음**.

- `ExpiresActive` / `ExpiresByType` (닷홈에서 `mod_expires` 허용 불명확)
- 주석과 `<IfModule>`을 한 줄에 작성

`SetEnv` 블록은 OAuth·PHP URL 확인 단계에서만 **별도 블록**으로 추가.

---

## 3-2) 작업 원칙 (배포 실수 방지)

Cursor 에이전트 규칙: `.cursor/rules/study114-workflow.mdc` (팀 공유용으로 Git 추적)

| 원칙 | 요약 |
|------|------|
| 로컬 수정 ≠ GitHub 반영 | `git add` → `commit` → `push` 없으면 Actions 배포 안 됨 |
| VITE env는 새로고침으로 반영 안 됨 | env 수정 → **빌드** → 산출물 배포 |
| Actions 초록불 ≠ 최신 로컬 반영 | 마지막 **push된 커밋** 기준 성공 |
| 완료 보고 | 수정 파일 · 빌드 여부 · `git status` · commit hash · push · 사이트 확인 |

**기본 순서:** 수정 → 빌드 → `git status` → commit → push → Actions 확인 → 실제 사이트 확인

---

## 3) SPA 경로 (카페24와 동일 — 닷홈에서도 유지 가능)

| 앱 | URL 예 | Vite `base` |
|----|--------|-------------|
| home-ui | `http://study114.dothome.co.kr/#/guest` | `/` |
| auth-ui | `.../auth/#/login` | `/auth/` |
| search-ui | `.../search/#/search/room` | `/search/` |
| study-room-ui | `.../register/room/#/register/basic` | `/register/room/` |
| tutor-ui | `.../register/tutor/#/register/basic` | `/register/tutor/` |

**충돌 분리:** `/auth/login` = PHP MVC · `/auth/#/login` = auth-ui SPA  
→ `public/.htaccess`가 이미 분리해 둠 (Apache 2.4 / 닷홈 호환)

---

## 4) 빌드·배포 방법

### 4-A. GitHub Actions 자동배포 (권장)

**파일:** `.github/workflows/deploy.yml`  
**트리거:** `main` 브랜치 push

```
checkout
  → Guard: scripts/check-no-committed-secrets.sh (.htaccess 실값 커밋 차단)
  → Node 20
  → GitHub Variable VITE_NAVER_MAP_CLIENT_ID → preview/.env.dothome.example 패치
  → GitHub Secrets OAUTH_* → public/.htaccess placeholder 주입
  → pwsh scripts/build-dothome.ps1
  → public/assets/index-*.js에 Client ID 포함 검증
  → FTP: ./public/ → /hosting/study114/html/ · ./src/ → /hosting/study114/src/
```

| GitHub 설정 | 이름 | 용도 |
|-------------|------|------|
| Secret | `FTP_PASSWORD` | 닷홈 FTP 비밀번호 |
| Secret | `OAUTH_NAVER_CLIENT_ID` / `OAUTH_NAVER_CLIENT_SECRET` | 네이버 소셜 로그인 |
| Secret | `OAUTH_KAKAO_REST_API_KEY` / `OAUTH_KAKAO_CLIENT_SECRET` | 카카오 소셜 로그인 |
| Secret | `OAUTH_GOOGLE_CLIENT_ID` / `OAUTH_GOOGLE_CLIENT_SECRET` | 구글 소셜 로그인 |
| Secret | `STUDY114_MAIL_PROBE_KEY` (선택) | 메일 프로브 키 |
| Variable | `VITE_NAVER_MAP_CLIENT_ID` | 네이버 지도 Client ID (빌드 시 JS 번들에 박힘) |

OAuth Secret 또는 지도 Variable 미설정 시 workflow는 **해당 Inject 단계**에서 실패한다.  
**금지:** `public/.htaccess`에 OAuth 실값 커밋 — placeholder(`__OAUTH_*__`)만 허용. 상세: [31-oauth-secret-incident.md](31-oauth-secret-incident.md)

**Actions가 배포하는 것:** `public/` 전체 (빌드 후 SPA 번들 + `api/` + `index.php` + `.htaccess`)  
**Actions가 배포하는 것:** `public/` → `html/` · **`src/` → `/hosting/study114/src/`** (형제 폴더)  
**Actions가 배포하지 않는 것:** `config/`(특히 `database.php`), `storage/` → [§8 수동 FTP](#8-ftp-업로드-체크리스트)

### 4-B. 로컬 빌드 (수동 FTP·검증용)

```powershell
cd d:\work\study114
npm run build:dothome
```

### 4-C. `build:dothome` 입출력

**입력**

| 구분 | 경로 |
|------|------|
| env 템플릿 | `preview/.env.dothome.example` → 각 패키지 `.env.production.local` |
| Vite 패키지 5개 | `preview/home-ui`, `auth-ui`, `search-ui`, `study-room-ui`, `tutor-ui` |
| 공유 소스 | `preview/shared/*` (`naver-map.js`, `preview-links.js` 등) |
| base 경로 | 스크립트가 패키지별 `VITE_BASE_PATH` 주입 |

**출력 (`public/` 갱신)**

| 패키지 | base | 출력 | 동작 |
|--------|------|------|------|
| home-ui | `/` | `public/index.html`, `public/assets/*` | assets **병합** (css/brand 유지) |
| auth-ui | `/auth/` | `public/auth/` | 폴더 **전체 교체** |
| search-ui | `/search/` | `public/search/` | 폴더 **전체 교체** |
| study-room-ui | `/register/room/` | `public/register/room/` | 폴더 **전체 교체** |
| tutor-ui | `/register/tutor/` | `public/register/tutor/` | 폴더 **전체 교체** |

**빌드가 건드리지 않음:** `public/api/`, `public/index.php`, `public/.htaccess`, `public/assets/css/`, `public/assets/brand/`

**Git 추적:** 빌드 산출물(`public/index.html`, `public/auth/`, `public/search/`, `public/register/`, `public/assets/index-*`)은 `.gitignore` 대상 → **repo에 커밋하지 않음**. CI 빌드 후 FTP가 정식 경로.

### 4-D. 네이버 지도 키

| 환경 | 설정 위치 |
|------|-----------|
| **CI (권장)** | GitHub Variable `VITE_NAVER_MAP_CLIENT_ID` |
| 로컬 빌드 | `preview/.env.dothome.example`에 직접 입력 |
| 로컬 dev | `preview/home-ui/.env.local` |

`VITE_*` 값은 **빌드 시점**에 JS에 박힘. `.env`만 고치고 새로고침해도 운영 사이트에 반영되지 않음.

---

## 5) DB 설정 — 어떤 방식이 맞나?

| 방식 | 닷홈 적합도 | 설명 |
|------|-------------|------|
| **① `config/database.php` 서버에서 직접 생성** | **✅ 가장 단순·안전** | 비밀번호를 git에 안 올림 |
| ② env만으로 구성 | △ | 닷홈은 `.env` 자동 로드 없음 → `.htaccess` SetEnv 필요 |

### 권장 절차 (비전문가용)

```powershell
# 로컬에서 (비밀번호는 아직 placeholder)
copy config\database.php.dothome.example config\database.php
```

1. `config/database.php` 를 메모장으로 열기  
2. `__DOTHOME_DB_PASSWORD__` → 실제 DB 비밀번호로 교체  
3. FTP로 `config/database.php` 업로드 (**git commit 하지 않음**)

PDO는 `localhost:3306` + `utf8mb4` 로 연결 (`src/Database/Connection.php`).

---

## 6) PHP URL / OAuth / 세션 / CORS

### 닷홈에서 써야 하는 값

| 변수 | 값 |
|------|-----|
| `STUDY114_API_BASE` | `http://study114.dothome.co.kr` |
| `STUDY114_HOME_UI` | `http://study114.dothome.co.kr` |
| `STUDY114_AUTH_UI` | `http://study114.dothome.co.kr/auth` |
| `STUDY114_APP_ENV` | `production` |
| `STUDY114_DEBUG` | `0` |

### 적용 방법 (둘 중 하나)

**A) `.htaccess` SetEnv (권장)** — `public/.htaccess` 하단 주석 해제:

```apache
<IfModule mod_env.c>
  SetEnv STUDY114_API_BASE http://study114.dothome.co.kr
  SetEnv STUDY114_HOME_UI http://study114.dothome.co.kr
  SetEnv STUDY114_AUTH_UI http://study114.dothome.co.kr/auth
  SetEnv STUDY114_APP_ENV production
  SetEnv STUDY114_DEBUG 0
</IfModule>
```

**B) 참고용 목록** — `config/dothome.env.example`

### OAuth Redirect URI (콘솔에 사람이 등록)

```
http://study114.dothome.co.kr/api/auth/oauth/callback.php?provider=naver
http://study114.dothome.co.kr/api/auth/oauth/callback.php?provider=kakao
http://study114.dothome.co.kr/api/auth/oauth/callback.php?provider=google
```

### 세션 / 쿠키 / CORS

| 항목 | 현재 코드 | 닷홈 단일 도메인 |
|------|-----------|------------------|
| 세션 | `cookie_samesite=Lax`, httponly | ✅ 추가 설정 불필요 |
| 쿠키 domain | 미지정 (현재 호스트) | ✅ `study114.dothome.co.kr` 자동 |
| CORS | 일부 API `Access-Control-Allow-Origin: *` | ✅ **같은 도메인**이면 브라우저가 CORS 검사 안 함 |
| API 호출 | 프론트가 `/api/...` 상대경로 | ✅ 빌드 후 같은 도메인이면 OK |

> OAuth·지도는 **절대 URL**이 필요하므로 SetEnv 또는 빌드 env가 중요합니다.

---

## 7) 네이버 지도 — 사람이 할 일

### 장애 판단 순서

| 증상 | 원인 후보 |
|------|-----------|
| 사이트 500 / 전체 미노출 | `.htaccess` 등 서버 설정 |
| `[설정 필요] VITE_NAVER_MAP_CLIENT_ID` | 빌드에 키 미반영 (또는 서버에 옛 JS) |
| 문구 없는데 지도만 안 뜸 | 허용 도메인·SDK URL·F12 Console 오류 |

### 코드에서 읽는 위치

| 파일 | 내용 |
|------|------|
| `preview/shared/naver-map.js` | `import.meta.env.VITE_NAVER_MAP_CLIENT_ID` |
| `preview/.env.dothome.example` | 빌드 시 주입 |
| `preview/home-ui/.env.local` | 로컬 개발용 |

### 네이버 클라우드 콘솔 (수동)

**콘솔:** https://console.ncloud.com/maps/application

**Maps → study114 앱 → Web 서비스 URL** 에 추가:

```
http://study114.dothome.co.kr
https://study114.dothome.co.kr
```

로컬 개발용 (유지):

```
http://localhost:5174
http://127.0.0.1:5174
http://127.0.0.1:5176
```

### HTTPS 적용 후

콘솔에 추가:

```
https://study114.dothome.co.kr
```

그리고:
- `preview/.env.dothome.example` 의 `http://` → `https://` 교체 후 **재빌드**
- `.htaccess` SetEnv 도 `https://` 로 교체
- OAuth 콘솔에도 `https://` redirect URI 추가

---

## 8) FTP 업로드 체크리스트

### 자동 (GitHub Actions — `main` push)

| 로컬 (CI 빌드 후) | FTP 대상 | 비고 |
|-------------------|----------|------|
| `public/*` | `/hosting/study114/html/` | 프론트 번들·API·`.htaccess`·`index.php` |
| `src/*` | `/hosting/study114/src/` | PHP 앱 (`html/` 형제) |

### 수동 (최초 1회 또는 설정 변경 시)

| 로컬 | FTP 대상 | 필수 |
|------|----------|------|
| `config/database.php` | `/hosting/study114/config/database.php` | ✅ (git 제외, 서버 전용) |
| `config/auth.php` 등 | `/hosting/study114/config/` | ✅ |
| `storage/logs/`, `storage/attachments/` | `/hosting/study114/storage/` | ✅ (빈 폴더 + 쓰기권한) |
| `sql/schema/` | 업로드 불필요 | phpMyAdmin import용 |

### 배포 제외 (서버에 올리지 않음)

| 폴더 | 이유 |
|------|------|
| `docs/`, `docs/ssot/` | 설계·내부 문서 |
| `backups/` | 로컬 백업 |
| `.cursor/` | Cursor 에이전트 규칙 (규칙 파일만 Git 추적) |
| `preview/` | Vite 소스·`node_modules` |
| `e2e/`, `test-results/` | 테스트 |
| `sql/` | DB 스크립트 (파일 배포 아님) |
| `scripts/`, `docker/`, `legacy/` | 개발·CI 전용 |
| `node_modules/`, `.git/`, `.github/` | 의존성·Git 메타 |

> **참고:** `src/`는 Actions가 `main` push 시 FTP 배포. `config/`·`storage/`는 여전히 수동.

**업로드 안 해도 됨:** `preview/`, `node_modules/`, `docs/`, `docker/`

---

## 9) phpMyAdmin — schema import

1. 닷홈 관리자 → phpMyAdmin → DB `study114` 선택  
2. **가져오기(Import)**  
3. `sql/schema/` 폴더의 파일을 **번호 순**으로 적용  
   - `001_init.sql` 부터 `035_content_config_definitions.sql` 까지  
   - 이미 운영 중인 DB라면 **증분만**: `034_board_operational_channels.sql` → `035_content_config_definitions.sql`  
4. (선택) 검수용 시드: `012_search_dev_seed.sql`, `026_admin_dev_seed.sql` 등

> **자동 적용(1회, 완료됨 2026-07-17):** 서버 PDO 멱등 마이그레이션으로 notice/faq/safe-guide seed · channel/slot 정의 적용 완료.  
> 이후 재적용은 관리자 `POST /api/admin/content/migrate.php` body `{"confirm":"apply-034-035"}` (idempotent).  
> 임시 `public/api/health/migrate-034-035.php` 는 **삭제됨**.

> 파일이 많으면 `001_init.sql` 먼저 → 나머지를 순서대로.

---

## 10) 업로드 후 테스트 순서

| 순서 | URL / 작업 | 기대 결과 |
|------|------------|-----------|
| 1 | `http://study114.dothome.co.kr/api/health/db.php` | `{"ok":true,...}` |
| 2 | **db.php 삭제** | — |
| 3 | `http://study114.dothome.co.kr/` | home-ui 메인 (또는 `#/guest` 수동) |
| 4 | `.../#/guest` | 비회원 화면 |
| 5 | `.../search/#/search/room` | 검색 화면 |
| 6 | `POST .../api/search/search.php` | JSON 200 (스키마 적용 후) |
| 7 | `.../auth/#/login` | auth-ui |
| 8 | `.../auth/login` | PHP MVC 로그인 (선택) |

---

## 11) 찾아낸 하드코딩 / 환경 의존 목록

| 파일 | 상태 | 닷홈 대응 |
|------|------|-----------|
| `preview/shared/preview-links.js` | 로컬 `127.0.0.1:517x` 폴백 | 빌드 시 `VITE_*_UI_BASE` 로 덮음 ✅ |
| `preview/*/vite.config.js` | dev proxy `127.0.0.1:8080` | 로컬 전용, 배포 무관 ✅ |
| `config/auth.php`, `oauth.php`, `paid.php` | getenv + localhost 폴백 | SetEnv 또는 서버 설정 필요 |
| `config/app.php` | ~~localhost 하드코딩~~ | getenv 로 변경 ✅ |
| `preview/.env.staging.example` | 카페24 URL | 카페24용 유지, 닷홈과 분리 |
| `public/.htaccess` | 닷홈 안전 최소본 (rewrite만) | mod_expires 제거 ✅ |
| `.github/workflows/deploy.yml` | CI 빌드 + `public/` FTP | Variable `VITE_NAVER_MAP_CLIENT_ID` 필요 |

---

## 12) 예시 파일 목록

| 파일 | 용도 |
|------|------|
| `preview/.env.dothome.example` | 닷홈 빌드 URL·지도 키 |
| `config/dothome.env.example` | PHP 환경변수 참고표 |
| `config/database.php.dothome.example` | DB 연결 → `database.php` 로 복사 |
| `scripts/build-dothome.ps1` | 닷홈 빌드 단축 명령 |
| `scripts/build-shared-hosting.ps1` | 닷홈·카페24 공통 빌드 엔진 |
| `.github/workflows/deploy.yml` | CI: build:dothome → FTP `public/` |
| `.cursor/rules/study114-workflow.mdc` | Cursor 작업 원칙 (배포·빌드 실수 방지) |
| `public/api/health/db.php` | DB 연결 테스트 (삭제 필수) |

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-07-09 | 닷홈 study114.dothome.co.kr 기준 최초 작성 |
| 2026-07-09 | internal README·코드베이스 지도와 상호 링크 정리 |
| 2026-07-17 | 034/035(운영형 채널·슬롯 정의) 증분 적용 · `/api/health/migrate-034-035.php` 1회 적용 후 삭제 |
