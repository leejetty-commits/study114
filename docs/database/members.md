# 공통 회원 DB

학생·학부모 **통합 축**, 가입·계정 주체는 **학부모** 기준.  
자녀(`students`)는 별도 로그인 없이 학부모 계정에 종속.

DDL: [sql/schema/001_init.sql](../../sql/schema/001_init.sql)

---

## users

로그인·계정 식별.

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|------|------|------|--------|------|
| id | BIGINT UNSIGNED | NO | AUTO | PK |
| email | VARCHAR(255) | NO | | 로그인 ID, UNIQUE |
| password_hash | VARCHAR(255) | NO | | bcrypt (`password_hash()`) |
| status | ENUM | NO | active | active, inactive, withdrawn |
| email_verified_at | DATETIME | YES | NULL | 이메일 인증 (2차) |
| last_login_at | DATETIME | YES | NULL | |
| created_at | DATETIME | NO | CURRENT_TIMESTAMP | |
| updated_at | DATETIME | NO | CURRENT_TIMESTAMP | ON UPDATE |

### 인덱스

- `uk_users_email (email)`
- `idx_users_status (status)`

---

## user_profiles

회원 프로필. `users` 와 **1:1**.  
**기본 주소(거주)** 와 **활동 주소** 를 분리 저장.

| 컬럼 | 타입 | NULL | 설명 |
|------|------|------|------|
| user_id | BIGINT UNSIGNED | NO | PK, FK → users.id |
| name | VARCHAR(50) | NO | 실명 또는 표시명 |
| phone | VARCHAR(20) | YES | 휴대폰 |
| phone_verified_at | DATETIME | YES | 휴대폰 인증 (2차) |
| home_region_id | BIGINT UNSIGNED | YES | FK → regions.id (거주 동) |
| home_complex_id | BIGINT UNSIGNED | YES | FK → complexes.id (거주 단지) |
| home_address_detail | VARCHAR(255) | YES | 거주 상세주소 |
| activity_region_id | BIGINT UNSIGNED | YES | FK → regions.id (활동 동) |
| activity_complex_id | BIGINT UNSIGNED | YES | FK → complexes.id (활동 단지) |
| activity_address_detail | VARCHAR(255) | YES | 활동 상세주소 |
| created_at | DATETIME | NO | |
| updated_at | DATETIME | NO | |

### 주소 노출 규칙

단지·동 공통 정책 ([04-location-policy.md](../04-location-policy.md)):

- `*_complex_id` 가 있으면 **단지 우선**
- 없으면 `*_region_id`(동) 기준

### 인덱스

- `idx_user_profiles_home_region (home_region_id)`
- `idx_user_profiles_home_complex (home_complex_id)`
- `idx_user_profiles_activity_region (activity_region_id)`
- `idx_user_profiles_activity_complex (activity_complex_id)`

---

## user_roles

한 회원의 **복수 역할**. 공부방 운영자·과외쌤 역할 동시 보유 가능.

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|------|------|------|--------|------|
| id | BIGINT UNSIGNED | NO | AUTO | PK |
| user_id | BIGINT UNSIGNED | NO | | FK → users.id |
| role | ENUM | NO | | member, study_room_owner, tutor |
| granted_at | DATETIME | NO | CURRENT_TIMESTAMP | 역할 부여 시각 |

### 운영 규칙

- 가입 완료 시 `member` 자동 부여
- 공부방 최초 등록 시 `study_room_owner` 추가
- `tutor` — 과외 DDL 확정 후 사용 ([tutors.md](tutors.md))

### 인덱스

- `uk_user_roles (user_id, role)` UNIQUE
- `idx_user_roles_role (role)`

---

## students

학부모(`users`) 소속 **자녀**. 학부모 1명 아래 **N명** 가능. 별도 로그인 없음.

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|------|------|------|--------|------|
| id | BIGINT UNSIGNED | NO | AUTO | PK |
| user_id | BIGINT UNSIGNED | NO | | FK → users.id (보호자) |
| name | VARCHAR(50) | NO | | 자녀 이름 |
| school_level | ENUM | NO | | elementary, middle, high, other |
| grade | TINYINT UNSIGNED | YES | NULL | 학년 (학교급별 1~6 등) |
| school_name | VARCHAR(100) | YES | NULL | 학교명 |
| sort_order | TINYINT UNSIGNED | NO | 0 | 자녀 표시 순서 |
| created_at | DATETIME | NO | CURRENT_TIMESTAMP | |
| updated_at | DATETIME | NO | CURRENT_TIMESTAMP | ON UPDATE |

### 인덱스

- `idx_students_user (user_id, sort_order)`

---

## 관계 요약

```
users (1)
 ├── user_profiles (0..1)
 ├── user_roles (1..N)     member | study_room_owner | tutor
 ├── students (0..N)       학부모당 자녀 여러 명
 └── study_rooms (0..N)    study_room_owner 와 연동
```

과외 프로필(`tutors`)은 현재 DDL 미포함 — `user_roles.tutor` 컬럼만 예약.

## FK

| 자식 | 부모 | ON DELETE |
|------|------|-----------|
| user_profiles.user_id | users.id | RESTRICT |
| user_profiles.home_region_id | regions.id | RESTRICT |
| user_profiles.home_complex_id | complexes.id | RESTRICT |
| user_profiles.activity_region_id | regions.id | RESTRICT |
| user_profiles.activity_complex_id | complexes.id | RESTRICT |
| user_roles.user_id | users.id | RESTRICT |
| students.user_id | users.id | RESTRICT |
