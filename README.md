# study114 (우동공과)

우리 동네 공부방·과외 정보 플랫폼. PHP 8.2 + MySQL 8 기준.

## 1차 범위

- 가입 방식 · 공통 회원 DB · 공부방 등록 DB · 과외쌤 등록 DB

상품 설계·결제·만 14세 미만 분기는 1차 제외.

## Cursor — SSOT 시작점

**[docs/ssot/README.md](docs/ssot/README.md)** — 한 줄: **2+4+5장 DB → 9장 메인 UI → 10장 순서**

| 장 | 문서 | 용도 |
|----|------|------|
| 2장 | [02-registration-and-member-db.md](docs/ssot/02-registration-and-member-db.md) | 가입·회원 **개념** |
| 4장 | [04-member-db-and-role-profiles.md](docs/ssot/04-member-db-and-role-profiles.md) | **회원/역할/지역 DB** |
| 5장 | [05-study-room-db.md](docs/ssot/05-study-room-db.md) | **공부방 DB** |
| 9장 | [09-main-screen-roles.md](docs/ssot/09-main-screen-roles.md) | 메인 4종 UI |
| 10장 | [10-phase1-execution-plan.md](docs/ssot/10-phase1-execution-plan.md) | 실행 순서 |

## UI 프리뷰

| 패키지 | URL |
|--------|-----|
| [preview/auth-ui/](preview/auth-ui/) | http://localhost:5173 |
| [preview/home-ui/](preview/home-ui/) | http://localhost:5174 |
| [preview/study-room-ui/](preview/study-room-ui/) | http://localhost:5175 |
| [preview/search-ui/](preview/search-ui/) | http://localhost:5176 |

## PHP MVC (로컬 API)

Docker `study114-api-dev` · 포트 **8080**

| 경로 | 용도 |
|------|------|
| http://localhost:8080/auth/login | 로그인 (MVC) |
| http://localhost:8080/auth/signup/terms | 가입 플로우 |
| http://localhost:8080/api/auth/signup.php | 가입 JSON API |
| http://localhost:8080/api/auth/login.php | 로그인 JSON API |
| http://localhost:8080/api/search/search.php | 검색 JSON API |

dev 시드 로그인: `guardian1@dev.local` / `password`

## DB (로컬) — study114_dev

**MySQL 8.4 (Docker)** · 호스트 포트 **3307** (기존 MariaDB 3306과 충돌 회피)

```powershell
docker compose -f docker/docker-compose.dev.yml up -d
# 최초 1회 또는 스키마 재적용
.\scripts\apply-schema-dev.ps1
# 테이블 확인
.\scripts\verify-schema-dev.ps1
```

| 항목 | 값 |
|------|-----|
| DB명 | `study114_dev` |
| root 비밀번호 | `study114dev` |
| 포트 | `3307` |

## 배포

로컬 개발 후 `study114.net` 서버로 이전 예정.
