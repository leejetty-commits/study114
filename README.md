# study114 (우동공과)

우리 동네 공부방·과외 정보 플랫폼. PHP 8.2 + MySQL 8 기준.

## 1차 범위

- 가입 방식
- 공통 회원 DB
- 공부방 등록 DB
- 과외쌤 등록 DB

상품 설계·결제·만 14세 미만 분기는 1차 제외.

## 문서

| 문서 | 설명 |
|------|------|
| [docs/01-project-overview.md](docs/01-project-overview.md) | 프로젝트 원칙·범위 |
| [docs/02-folder-structure.md](docs/02-folder-structure.md) | 폴더 구조 |
| [docs/03-registration.md](docs/03-registration.md) | 가입 방식 |
| [docs/04-location-policy.md](docs/04-location-policy.md) | 지역·단지 정책 |
| [docs/database/README.md](docs/database/README.md) | DB 설계 개요 |
| [sql/schema/001_init.sql](sql/schema/001_init.sql) | 통합 DDL 초안 |

## 로컬 개발 (예정)

```bash
# DB 생성
mysql -u root -p < sql/schema/001_init.sql
```

## 배포

로컬 개발 후 `study114.net` 서버로 이전 예정.
