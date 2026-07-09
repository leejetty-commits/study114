# 닷홈 shared hosting 배포 가이드

**문서 성격:** DB 연결·최소 구동 확인용 (**현재 1차 배포 목표**)  
**기준일:** 2026-07-09  
**도메인:** `http://study114.dothome.co.kr`  
**관련:** [internal/README.md](./README.md) · [00-project-tree-and-key-files.md](./00-project-tree-and-key-files.md) · [01-cafe24-staging-deploy.md](./01-cafe24-staging-deploy.md) (카페24용, 별도 유지)

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
| 프론트 미빌드 | 로컬에서 `npm run build:dothome` 후 `public/` 업로드 |
| PHP URL이 localhost로 남음 | `.htaccess` SetEnv 주석 해제 또는 `config/*.php` 확인 |
| 네이버 지도 안 나옴 | 콘솔에 `http://study114.dothome.co.kr` 허용 도메인 추가 |
| `db.php` 방치 | 테스트 후 **반드시 삭제** |

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

## 4) 빌드 방법 (로컬 PC)

### 4-1. 프론트 빌드 + public 배치

```powershell
cd d:\work\study114
npm run build:dothome
```

동작:
- `preview/.env.dothome.example` → 각 패키지 `.env.production.local`
- `scripts/build-shared-hosting.ps1` 실행 (래퍼: `scripts/build-dothome.ps1`)
- 5개 Vite 빌드 → `public/` 하위에 복사

### 4-2. 네이버 지도 키 넣기 (선택)

빌드 전 `preview/.env.dothome.example` 에서:

```
VITE_NAVER_MAP_CLIENT_ID=<본인 Client ID>
```

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

### 코드에서 읽는 위치

| 파일 | 내용 |
|------|------|
| `preview/shared/naver-map.js` | `import.meta.env.VITE_NAVER_MAP_CLIENT_ID` |
| `preview/.env.dothome.example` | 빌드 시 주입 |
| `preview/home-ui/.env.local` | 로컬 개발용 |

### 네이버 클라우드 콘솔 (수동)

**Maps → study114 앱 → Web 서비스 URL** 에 추가:

```
http://study114.dothome.co.kr
```

로컬 개발용 (유지):

```
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

| 로컬 | FTP 대상 | 필수 |
|------|----------|------|
| `public/*` | `html/` | ✅ |
| `src/` | `src/` | ✅ |
| `config/database.php` | `config/database.php` | ✅ |
| `config/auth.php` 등 | `config/` | ✅ |
| `storage/logs/`, `storage/attachments/` | `storage/` | ✅ (빈 폴더 + 쓰기권한) |
| `sql/schema/` | 업로드 불필요 | phpMyAdmin import용 |

**업로드 안 해도 됨:** `preview/`, `node_modules/`, `docs/`, `docker/`

---

## 9) phpMyAdmin — schema import

1. 닷홈 관리자 → phpMyAdmin → DB `study114` 선택  
2. **가져오기(Import)**  
3. `sql/schema/` 폴더의 파일을 **번호 순**으로 적용  
   - `001_init.sql` 부터 `033_study_room_map_coords.sql` 까지 (34개)  
4. (선택) 검수용 시드: `012_search_dev_seed.sql`, `026_admin_dev_seed.sql` 등

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
| `public/.htaccess` | 카페24 주석 | shared hosting 공통 + 닷홈 SetEnv ✅ |

---

## 12) 예시 파일 목록

| 파일 | 용도 |
|------|------|
| `preview/.env.dothome.example` | 닷홈 빌드 URL·지도 키 |
| `config/dothome.env.example` | PHP 환경변수 참고표 |
| `config/database.php.dothome.example` | DB 연결 → `database.php` 로 복사 |
| `scripts/build-dothome.ps1` | 닷홈 빌드 단축 명령 |
| `scripts/build-shared-hosting.ps1` | 닷홈·카페24 공통 빌드 엔진 |
| `public/api/health/db.php` | DB 연결 테스트 (삭제 필수) |

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-07-09 | 닷홈 study114.dothome.co.kr 기준 최초 작성 |
| 2026-07-09 | internal README·코드베이스 지도와 상호 링크 정리 |
