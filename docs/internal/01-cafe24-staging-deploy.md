# 카페24 스테이징 배포 설정

**문서 성격:** 카페24 스테이징 참고용 (현재 1차 배포 목표는 **닷홈** → [01-dothome-deploy.md](./01-dothome-deploy.md))  
**기준일:** 2026-07-09  
**스테이징 URL:** `https://study114new.mycafe24.com`  
**관련:** [internal/README.md](./README.md) · [00-project-tree-and-key-files.md](./00-project-tree-and-key-files.md) · `scripts/build-staging.ps1` · `scripts/build-shared-hosting.ps1`

---

## 0. 카페24 계정 정보

| 항목 | 값 |
|------|-----|
| 도메인 | `study114new.mycafe24.com` |
| FTP 아이디 | `study114new` |
| PHP | **8.2** |
| DB | **MariaDB 10.x** (`localhost:3306`) |
| DB user | `study114new` |
| DB name | **`__CAFE24_DB_NAME__`** (관리자 화면 확인 후 교체) |
| DB password | 카페24 DB 생성 시 설정값 |
| 스팸쉴드 | **사용 안 함** (1차) |

**STG_BASE:** `https://study114new.mycafe24.com`

---

## 1. 서버 디렉터리 구조 (FTP)

카페24 계정 루트 기준. **웹 document root = `www/`** (= repo `public/` 내용).

```
study114new/                 # FTP 계정 루트
├── www/                     # ★ document root ← public/ 업로드
│   ├── index.php
│   ├── index.html           # home-ui 빌드 (build:staging)
│   ├── .htaccess
│   ├── api/
│   ├── assets/              # MVC css + SPA 빌드 자산 병합
│   ├── auth/                # auth-ui SPA
│   ├── search/              # search-ui SPA
│   └── register/
│       ├── room/            # study-room-ui SPA
│       └── tutor/           # tutor-ui SPA
├── src/                     # PHP 애플리케이션 (www 밖)
├── config/                  # database.php 등 (www 밖)
└── storage/                 # 로그·첨부 (www 밖, 쓰기 권한)
```

> `index.php`는 `dirname(__DIR__).'/src/bootstrap.php'`를 참조하므로 **`src/`는 `www/`와 형제 폴더**여야 한다.

---

## 2. URL·경로 매핑

| 앱 | 로컬 dev | 스테이징 URL | Vite `base` |
|----|----------|--------------|-------------|
| home-ui | `:5174` | `https://study114new.mycafe24.com/` | `/` |
| auth-ui | `:5173` | `.../auth/#/login` | `/auth/` |
| search-ui | `:5176` | `.../search/#/search/room` | `/search/` |
| study-room-ui | `:5175` | `.../register/room/#/register/basic` | `/register/room/` |
| tutor-ui | `:5177` | `.../register/tutor/#/register/basic` | `/register/tutor/` |
| PHP API | `:8080/api` | `.../api/*.php` | — |
| PHP MVC | `:8080/auth/login` | `.../auth/login` (hash 없음) | — |

**경로 충돌 주의:** `/auth/login` = PHP MVC · `/auth/#/login` = auth-ui SPA. `.htaccess`가 분리한다.

---

## 3. 로컬 빌드 → public 배치

### 3-1. 한 번에 빌드

```powershell
npm run build:staging
# 내부: scripts/build-staging.ps1 → build-shared-hosting.ps1 호출
.\scripts\build-staging.ps1
```

스크립트 동작:
1. `preview/.env.staging.example` → 각 패키지 `.env.production.local`
2. 패키지별 `VITE_BASE_PATH` 설정 후 `vite build`
3. `dist/` → `public/` 하위 경로 복사 (api·index.php·`assets/css/auth` 보존)

### 3-2. 수동 빌드 (참고)

| 패키지 | `VITE_BASE_PATH` | 복사 대상 |
|--------|------------------|-----------|
| home-ui | `/` | `public/` (index.html + assets 병합) |
| auth-ui | `/auth/` | `public/auth/` |
| search-ui | `/search/` | `public/search/` |
| study-room-ui | `/register/room/` | `public/register/room/` |
| tutor-ui | `/register/tutor/` | `public/register/tutor/` |

---

## 4. 환경변수

### 4-1. 프론트 (Vite 빌드 시)

**템플릿:** `preview/.env.staging.example`

| 변수 | 스테이징 값 |
|------|-------------|
| `VITE_HOME_UI_BASE` | `https://study114new.mycafe24.com` |
| `VITE_AUTH_UI_BASE` | `https://study114new.mycafe24.com/auth` |
| `VITE_SEARCH_UI_BASE` | `https://study114new.mycafe24.com/search` |
| `VITE_STUDY_ROOM_UI_BASE` | `https://study114new.mycafe24.com/register/room` |
| `VITE_TUTOR_UI_BASE` | `https://study114new.mycafe24.com/register/tutor` |
| `VITE_NAVER_MAP_CLIENT_ID` | study114 앱 Client ID |

**읽는 코드:** `preview/shared/preview-links.js` · `preview/shared/naver-map.js`

### 4-2. 백엔드 (PHP 런타임)

**템플릿:** `config/staging.env.example` · `config/database.php.cafe24-staging.example`

```powershell
copy config\database.php.cafe24-staging.example config\database.php
# DB 이름·비밀번호 교체 후 FTP로 config/ 업로드
```

| 변수 | 스테이징 값 |
|------|-------------|
| `STUDY114_API_BASE` | `https://study114new.mycafe24.com` |
| `STUDY114_HOME_UI` | `https://study114new.mycafe24.com` |
| `STUDY114_AUTH_UI` | `https://study114new.mycafe24.com/auth` |
| DB host | `localhost` |
| DB user | `study114new` |
| DB name | `__CAFE24_DB_NAME__` |

---

## 5. `.htaccess` (public/.htaccess)

| 규칙 | 동작 |
|------|------|
| 실제 파일 존재 | `api/*.php`, 정적 자산 직접 서빙 |
| `/auth/login` 등 MVC 경로 | `index.php` |
| `/auth/`, `/search/`, `/register/*/` | 각 SPA `index.html` |
| 나머지 (API 제외) | home-ui `index.html` |
| `DirectoryIndex` | `index.html` → `index.php` |

---

## 6. FTP 업로드 대상

| 로컬 | FTP 대상 | 비고 |
|------|----------|------|
| `public/*` | `www/` | 빌드 후 업로드 |
| `src/` | `src/` | www 밖 |
| `config/database.php` | `config/database.php` | 서버에서 생성·gitignore |
| `config/*.php` (database 제외) | `config/` | auth·oauth·storage 등 |
| `storage/` | `storage/` | 빈 폴더 + 쓰기 권한 |
| `sql/schema/` | (로컬 유지) | phpMyAdmin으로 1회 적용 |

**업로드 불필요:** `preview/`, `node_modules/`, `docker/`, `e2e/`, `docs/`

---

## 7. 외부 콘솔 등록

### 네이버 Maps — 허용 Web 서비스 URL 추가

```
https://study114new.mycafe24.com
```

로컬 개발 URL(`127.0.0.1:5174` 등)은 유지.

### OAuth Redirect URI

```
https://study114new.mycafe24.com/api/auth/oauth/callback.php?provider=naver
https://study114new.mycafe24.com/api/auth/oauth/callback.php?provider=kakao
https://study114new.mycafe24.com/api/auth/oauth/callback.php?provider=google
```

---

## 8. 배포 순서

1. 카페24 DB 이름 확인 → `config/database.php` 작성
2. `npm run build:staging`
3. 네이버 Maps·OAuth 스테이징 URL 등록
4. FTP 업로드 (`www/`, `src/`, `config/`, `storage/`)
5. phpMyAdmin: `sql/schema/*.sql` 순서 적용
6. 스모크 체크 (§9)

---

## 9. 스모크 체크리스트

- [ ] `https://study114new.mycafe24.com/#/guest` — 메인·지도
- [ ] GNB 공부방찾기 → `/search/#/search/room`
- [ ] GNB 가입 → `/auth/#/signup/terms`
- [ ] `POST /api/search/search.php` 200
- [ ] 이메일 로그인 · `me.php`
- [ ] `/auth/login` PHP MVC 화면 (선택)

---

## 10. 구현 상태

| 항목 | 상태 |
|------|------|
| `vite.config.js` base | ✅ `preview/shared/vite-base.mjs` |
| `public/.htaccess` | ✅ shared hosting 공통 (닷홈·카페24) |
| `scripts/build-shared-hosting.ps1` | ✅ |
| `scripts/build-staging.ps1` | ✅ (위 스크립트 래퍼) |
| `preview-links.js` env | ✅ |
| localhost 하드코딩 (앱 JS) | ✅ |
| DB 이름 확정 | ⏳ 카페24 화면 확인 필요 |

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-07-09 | 최초 작성 |
| 2026-07-09 | study114new.mycafe24.com 반영 · base/htaccess/build 스크립트 완료 |
| 2026-07-09 | build-shared-hosting.ps1 분리 · 닷홈 1차 목표로 문서 역할 조정 |
