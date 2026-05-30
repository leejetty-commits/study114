# 폴더 구조 제안

PHP 8.2 MVC-lite 구조. 1차는 설계·스키마 중심이며, 애플리케이션 코드는 점진적으로 채운다.

```
study114/
├── README.md
├── docs/
│   ├── ssot/                      # ★ SSOT (2·4·5·9·10장)
│   │   ├── README.md              # Cursor 시작점
│   │   ├── 02-registration-and-member-db.md
│   │   ├── 04-member-db-and-role-profiles.md
│   │   ├── 05-study-room-db.md
│   │   ├── 09-main-screen-roles.md
│   │   └── 10-phase1-execution-plan.md
│   ├── 01-project-overview.md
│   ├── 02-folder-structure.md
│   ├── 03-registration.md         # 2장 요약
│   ├── 04-location-policy.md
│   └── database/
├── preview/                       # UI 프리뷰 (Vite)
│   └── auth-ui/                   # 2장 인증/가입
├── public/
│   ├── index.php                  # 프론트 컨트롤러
│   └── assets/
│       ├── css/
│       ├── js/
│       └── images/
├── config/                        # 환경별 설정 (gitignore 대상 가능)
│   ├── app.php
│   └── database.php.example
├── src/
│   ├── Core/                      # Router, DB, View 등 공통
│   ├── Controllers/
│   │   ├── HomeController.php
│   │   ├── AuthController.php
│   │   ├── StudyRoomController.php
│   │   └── TutorController.php
│   ├── Models/
│   │   ├── User.php
│   │   ├── Student.php
│   │   ├── StudyRoom.php
│   │   └── Tutor.php
│   ├── Services/                  # 비즈니스 로직
│   └── Views/
│       ├── layouts/
│       ├── home/
│       ├── auth/
│       ├── study_rooms/
│       └── tutors/
├── sql/
│   ├── schema/                    # DDL (버전별 통합 또는 분리)
│   │   └── 001_init.sql
│   └── seeds/                     # 마스터·테스트 데이터 (추후)
│       └── master_facilities.sql
├── storage/                       # 로그, 캐시, 업로드 (gitignore)
│   └── logs/
├── tests/                         # PHPUnit (추후)
└── .gitignore
```

## URL·페이지 확장 구조

| 경로 | 1차 | 비고 |
|------|-----|------|
| `/` | 홈 (공부방 중심) | 공부방 목록·검색 진입 |
| `/study-rooms` | 공부방 목록·검색 | 지역·단지 필터 |
| `/study-rooms/{id}` | 공부방 상세 | |
| `/study-rooms/register` | 공부방 등록 | 로그인 필요 |
| `/tutors` | 과외쌤 목록·기본 검색 | |
| `/tutors/{id}` | 과외쌤 상세 | |
| `/tutors/register` | 과외쌤 등록 | 로그인 필요 |
| `/auth/login` | 로그인 | |
| `/auth/register` | 회원가입 | 학부모 기준 |
| `/mypage` | 내 등록 관리 | 공부방·과외 통합 |

라우팅은 `src/Core/Router.php`에서 prefix 그룹으로 확장한다.

## 설정·배포

- **로컬**: `config/database.php` (example 복사)
- **study114.net**: document root → `public/`
- DB 마이gration: 1차는 `sql/schema/*.sql` 수동 적용, 이후 migration 도구 검토

## gitignore 권장

```
/config/database.php
/storage/
/vendor/
.env
```
