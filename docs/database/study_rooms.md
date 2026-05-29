# 공부방 DB

홈 핵심 콘텐츠. 지역·가격·시설·이미지·과목 대상을 분리 테이블로 관리.  
DDL: [sql/schema/001_init.sql](../../sql/schema/001_init.sql)

---

## study_rooms

공부방 본문. **지역은 `study_room_regions` 로 분리** (공부방당 최대 3건).

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|------|------|------|--------|------|
| id | BIGINT UNSIGNED | NO | AUTO | PK |
| user_id | BIGINT UNSIGNED | NO | | FK → users.id (등록·운영 회원) |
| name | VARCHAR(100) | NO | | 공부방명 |
| description | TEXT | YES | NULL | 소개 |
| price_amount | INT UNSIGNED | YES | NULL | **월 기준 대표 금액(원)** |
| price_description | VARCHAR(255) | YES | NULL | **설명형** 가격 텍스트 |
| facility_note | TEXT | YES | NULL | 시설·환경 **자유기술** |
| address_detail | VARCHAR(255) | YES | NULL | 공부방 상세주소 (노출 정책은 앱) |
| contact_phone | VARCHAR(20) | YES | NULL | 문의 전화 |
| status | ENUM | NO | draft | draft, published, hidden, closed |
| published_at | DATETIME | YES | NULL | 게시 시각 |
| created_at | DATETIME | NO | CURRENT_TIMESTAMP | |
| updated_at | DATETIME | NO | CURRENT_TIMESTAMP | ON UPDATE |
| deleted_at | DATETIME | YES | NULL | soft delete |

### 가격

- `price_amount`: 월 기준 대표 금액. 정렬·필터에 사용
- `price_description`: "월 30만~", "과목별 상이", "협의" 등 자유 텍스트
- 둘 다 NULL 가능. 동시 입력 가능
- `price_unit` enum **없음** — 금액 단위는 월 고정

### 인덱스

- `idx_study_rooms_user (user_id)`
- `idx_study_rooms_status_published (status, published_at)`
- `idx_study_rooms_price (status, price_amount)`

---

## study_room_regions

공부방 **노출·검색 지역** 매핑. 공부방당 **slot 1~3** (최대 3개).

| 컬럼 | 타입 | NULL | 설명 |
|------|------|------|------|
| id | BIGINT UNSIGNED | NO | PK |
| study_room_id | BIGINT UNSIGNED | NO | FK → study_rooms.id |
| slot | TINYINT UNSIGNED | NO | 1~3 (`CHECK`) |
| region_id | BIGINT UNSIGNED | NO | FK → regions.id (동, **필수**) |
| complex_id | BIGINT UNSIGNED | YES | FK → complexes.id (단지, 선택) |
| created_at | DATETIME | NO | |
| updated_at | DATETIME | NO | |

### 지역 노출 규칙

- `complex_id` 있음 → **단지 우선** 노출·필터
- `complex_id` NULL → `region_id`(동) 기준
- 단지 선택 시에도 `region_id`는 해당 단지 소속 동으로 **항상 저장** (조회 단순화)

### 제약

- `CHECK (slot BETWEEN 1 AND 3)`
- `uk_study_room_regions_slot (study_room_id, slot)` UNIQUE — slot당 1건, 최대 3건

### 인덱스

- `idx_study_room_regions_region (region_id)`
- `idx_study_room_regions_complex (complex_id)`
- `idx_study_room_regions_room (study_room_id)`

### FK

- `study_room_id` → `study_rooms.id` **ON DELETE CASCADE**

---

## study_room_subject_targets

공부방 **대상 과목·학교급** (다중).

| 컬럼 | 타입 | NULL | 설명 |
|------|------|------|------|
| id | BIGINT UNSIGNED | NO | PK |
| study_room_id | BIGINT UNSIGNED | NO | FK → study_rooms.id |
| subject | VARCHAR(50) | NO | 과목 (예: math, english, 국어) |
| school_level | ENUM | YES | elementary, middle, high, other |
| created_at | DATETIME | NO | |

### 제약

- `uk_study_room_subject_targets (study_room_id, subject, school_level)` UNIQUE

### 인덱스

- `idx_study_room_subject_targets_subject (subject, school_level)`

### FK

- `study_room_id` → `study_rooms.id` **ON DELETE CASCADE**

---

## study_room_images

공부방 이미지. **0~5장** (`sort_order` 1~5).

| 컬럼 | 타입 | NULL | 설명 |
|------|------|------|------|
| id | BIGINT UNSIGNED | NO | PK |
| study_room_id | BIGINT UNSIGNED | NO | FK → study_rooms.id |
| sort_order | TINYINT UNSIGNED | NO | 1~5 (`CHECK`) |
| storage_path | VARCHAR(500) | NO | 저장 경로 또는 URL |
| original_filename | VARCHAR(255) | YES | 원본 파일명 |
| created_at | DATETIME | NO | |

### 제약

- `CHECK (sort_order BETWEEN 1 AND 5)`
- `uk_study_room_images_order (study_room_id, sort_order)` UNIQUE
- 0장 허용 — row 없음. 5장 초과는 앱·DB 양쪽에서 방지

### 인덱스

- `idx_study_room_images_room (study_room_id)`

### FK

- `study_room_id` → `study_rooms.id` **ON DELETE CASCADE**

---

## facility_masters

시설·환경 **체크형** 마스터. 시드 데이터는 **별도 단계**에서 추가 예정.

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|------|------|------|--------|------|
| id | SMALLINT UNSIGNED | NO | AUTO | PK |
| code | VARCHAR(50) | NO | | UNIQUE (wifi, parking, …) |
| label | VARCHAR(100) | NO | | 화면 표시명 |
| sort_order | SMALLINT UNSIGNED | NO | 0 | 정렬 |
| is_active | TINYINT(1) | NO | 1 | 사용 여부 |
| created_at | DATETIME | NO | CURRENT_TIMESTAMP | |
| updated_at | DATETIME | NO | CURRENT_TIMESTAMP | ON UPDATE |

### 인덱스

- `uk_facility_masters_code (code)`
- `idx_facility_masters_active (is_active, sort_order)`

---

## study_room_facilities

공부방 ↔ 시설 **M:N (체크형)**.

| 컬럼 | 타입 | NULL | 설명 |
|------|------|------|------|
| study_room_id | BIGINT UNSIGNED | NO | FK → study_rooms.id |
| facility_id | SMALLINT UNSIGNED | NO | FK → facility_masters.id |
| created_at | DATETIME | NO | |

### PK

- `(study_room_id, facility_id)`

### 인덱스

- `idx_study_room_facilities_facility (facility_id)`

### FK

- `study_room_id` → `study_rooms.id` **ON DELETE CASCADE**
- `facility_id` → `facility_masters.id` RESTRICT

---

## 시설 입력 구조

| 방식 | 저장 위치 |
|------|-----------|
| 체크형 | `facility_masters` + `study_room_facilities` |
| 자유기술 | `study_rooms.facility_note` |

---

## 공부방 관련 테이블 관계

```
study_rooms (1)
 ├── study_room_regions (0..3)        slot 1~3
 ├── study_room_subject_targets (0..N)
 ├── study_room_images (0..5)         sort_order 1~5
 └── study_room_facilities (0..N)     ↔ facility_masters
```

## 검색·목록 (참고)

| 필터 | 테이블·컬럼 |
|------|-------------|
| 동 | study_room_regions.region_id |
| 단지 | study_room_regions.complex_id |
| 과목 | study_room_subject_targets.subject |
| 학교급 | study_room_subject_targets.school_level |
| 월 가격 | study_rooms.price_amount |
| 상태 | study_rooms.status = published |

홈·목록 URL (추후): `/`, `/study-rooms`, `/study-rooms/{id}`
