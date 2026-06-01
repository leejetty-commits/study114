# 5장 — 공부방 등록 DB 및 상세정보 구조

**상태: 잠금**  
**역할:** Cursor가 **공부방 등록·상세** 테이블/컬럼을 만들 때 보는 **DB SSOT**  
**전제:** [2장 §6](02-registration-and-member-db.md#6-공부방-등록-db-잠금-개념)  
**DDL:** [001_init.sql](../../sql/schema/001_init.sql) → [005_study_room_ssot_align.sql](../../sql/schema/005_study_room_ssot_align.sql)

---

## 1. 목적

공부방은 단순 회원정보가 아니라, **학부모가 비교·판단할 수 있는 샵 상세 구조**로 설계한다.

**1차에서도 공부방 등록은 얕게 만들지 않는다.**

---

## 2. 설계 원칙

| # | 원칙 |
|---|------|
| 1 | 회원정보와 **분리된 독립 프로필** |
| 2 | 가격 = **숫자형 + 설명형** |
| 3 | 시설/환경 = **체크형 + 자유기술형** |
| 4 | 지역 = **단지 우선 · 없으면 동**(빌라 포함) |
| 5 | 공부방 **정보** vs **광고/노출권** **분리** |
| 6 | **기본 위치**(`study_rooms`) vs **저장/노출 지역**(`study_room_regions`) **분리** |

---

## 3. 핵심 테이블

| 테이블 | 역할 |
|--------|------|
| `study_rooms` | 공부방 기본 프로필 · 핵심 샵 정보 |
| `study_room_subject_targets` | 대상/과목 매핑 · 학년대별 |
| `study_room_regions` | 활동/노출 지역 · **최대 3 · 대표 1** |
| `study_room_images` | 사진 · 대표/내부/시설/기타 |
| `facility_masters` | 시설 **체크형** 마스터 |
| `study_room_facilities` | 공부방 ↔ 시설 매핑 |

후기: **§11-4** — 1차 방향만 잠금, DDL은 `study_room_reviews` (TODO)

---

## 4. study_rooms

| 컬럼 | 타입 | NULL | 설명 |
|------|------|------|------|
| id | BIGINT UNSIGNED | NO | PK |
| user_id | BIGINT UNSIGNED | NO | FK → users · 운영 회원 |
| study_room_name | VARCHAR(100) | NO | 공부방명 / 노출명 |
| operator_display_name | VARCHAR(50) | YES | 운영자 표시명 |
| intro_short | VARCHAR(255) | YES | 짧은 소개 |
| intro_long | TEXT | YES | 상세 소개 |
| lesson_place_type | ENUM('home','office') | YES | 재택 / 교습소 |
| region_id | BIGINT UNSIGNED | YES | FK · **기본 위치** 동 |
| complex_id | BIGINT UNSIGNED | YES | FK · **기본 위치** 단지 |
| address_text | VARCHAR(255) | YES | 표시용 주소 요약 |
| latitude | DECIMAL(10,7) | YES | 지도 |
| longitude | DECIMAL(10,7) | YES | 지도 |
| capacity_per_time | VARCHAR(50) | YES | 1타임 수업 인원 |
| recruitment_count | SMALLINT UNSIGNED | YES | 모집 인원 |
| main_subject_note | VARCHAR(255) | YES | 주력과목 요약 |
| teaching_style | VARCHAR(255) | YES | 지도 스타일 |
| weekend_available | TINYINT(1) | NO | default 0 · 주말 가능 |
| one_on_one_available | TINYINT(1) | NO | default 0 · 1:1 가능 |
| price_amount | INT UNSIGNED | YES | **월 기준 대표 금액(원)** · 비교/정렬 |
| price_description | TEXT | YES | 가격 설명·특이사항 |
| career_years | SMALLINT UNSIGNED | YES | 교습 경력(년) |
| academy_career_years | SMALLINT UNSIGNED | YES | 학원 경력(년) |
| franchise_flag | TINYINT(1) | NO | default 0 |
| franchise_name | VARCHAR(100) | YES | 프랜차이즈명 |
| education_office_registered | TINYINT(1) | NO | default 0 · 교육청 등록 |
| education_office_reg_no | VARCHAR(50) | YES | 등록번호 |
| feature_1 | VARCHAR(100) | YES | 특징 1 |
| feature_2 | VARCHAR(100) | YES | 특징 2 |
| feature_3 | VARCHAR(100) | YES | 특징 3 |
| contact_time_note | VARCHAR(255) | YES | 연락 가능 시간 |
| contact_phone | VARCHAR(20) | YES | 문의 전화 |
| facility_note | TEXT | YES | 시설/환경 **자유기술** |
| profile_status | ENUM | NO | `draft` · `pending` · `published` · `hidden` |
| published_at | DATETIME | YES | |
| deleted_at | DATETIME | YES | soft delete |
| created_at / updated_at | DATETIME | NO | |

### 4-1. 001 → 5장 컬럼 매핑

| 001 | 5장 |
|-----|-----|
| `name` | `study_room_name` |
| `description` | `intro_long` (+ `intro_short` 추가) |
| `address_detail` | `address_text` |
| `status` | `profile_status` (+ `pending`) |

---

## 5. study_room_subject_targets

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | BIGINT UNSIGNED | PK |
| study_room_id | FK | |
| school_level | ENUM | `preschool` · `elementary` · `middle` · `high` · `retake` · `general` · `other` |
| grade_band | VARCHAR(20) | YES · 학년대 세부 |
| subject_name | VARCHAR(50) | 과목명 |
| is_main | TINYINT(1) | 주력과목 |

> 001: `subject` → `subject_name`, `school_level` enum 확장, `is_main` 추가

---

## 6. study_room_images

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | BIGINT UNSIGNED | PK |
| study_room_id | FK | |
| image_type | ENUM | `cover` · `interior` · `facility` · `other` |
| image_path | VARCHAR(500) | 업로드 경로 |
| sort_order | SMALLINT UNSIGNED | 1~5 |

### 6-1. 이미지 (§11-1)

- **0~5장** · 없어도 등록 가능
- 대표/내부/시설 **혼합** 운영

> 001: `storage_path` → `image_path`, `image_type` 추가

---

## 7. study_room_regions

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | BIGINT UNSIGNED | PK |
| study_room_id | FK | |
| region_id | FK | 노출/활동 **동** |
| complex_id | FK | YES · **단지** |
| is_primary | TINYINT(1) | **대표지역** (1개만 true) |
| slot | TINYINT | 1~3 · 최대 3건 (001 유지) |

### 7-1. 지역 규칙 (§9 잠금)

| 구분 | 용도 |
|------|------|
| `study_rooms.region_id/complex_id` | **공부방 기본 위치** |
| `study_room_regions` | 로그인 후 **지도/핀/메인 노출** 저장 지역 |

- **최대 3** 지역 · **대표 1** (`is_primary`)
- 사용자가 다른 저장 지역 선택 → **대표지역 변경** → 이후 노출 기준 전환
- `complex_id` 있음 → **단지 우선** · 없으면 **동**(빌라 포함)

---

## 8. facility_masters

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | SMALLINT UNSIGNED | PK |
| facility_code | VARCHAR(50) | UNIQUE · e.g. aircon, ventilation |
| facility_name | VARCHAR(100) | 표시명 |
| sort_order | SMALLINT | |
| is_active | TINYINT(1) | |

> 001: `code`→`facility_code`, `label`→`facility_name`

### 8-1. 1차 체크 항목 (§11-3 권장 ~5개)

- 냉난방 · 환기 · 화장실/위생 · 통학/주차 · CCTV/안전 또는 상담/대기공간  
- 나머지 → `facility_note`

---

## 9. study_room_facilities

| 컬럼 | 타입 | 설명 |
|------|------|------|
| study_room_id | FK | PK 복합 |
| facility_id | FK | |
| note | VARCHAR(255) | YES · 시설별 보충 |

---

## 10. 노출·가격·광고 (§9)

| 항목 | 규칙 |
|------|------|
| `price_amount` | 검색·정렬·비교용 **월 대표(원)** (§11-2) |
| `price_description` | 수업 구조·과목별 차이·특이사항 |
| 체크형 | `facility_masters` + `study_room_facilities` |
| 자유기술 | `facility_note` |
| 프리미엄 박스·리스트·광고 | **공부방 DB와 분리**된 노출 정책 |

**예:** 주 2회 월 35만 → `price_amount=350000`, 상세는 `price_description`

---

## 11. 1차 잠금 결론

- [x] 공부방 = 1차 **핵심 축**
- [x] 샵 **상세 페이지** 수준 DB
- [x] 가격 숫자+설명 · 시설 체크+자유기술
- [x] 기본 위치 vs 저장 지역 **분리**
- [x] 저장 지역 **최대 3 · 대표 1**
- [x] 단지 우선 / 없으면 동
- [x] 정보 vs 광고권 **분리**

---

## 12. 추가 잠금 (§11)

### 11-1. 이미지 0~5장

### 11-2. price_amount = **월 기준 원** · description 보완

### 11-3. 시설 체크 **~5개** + facility_note

### 11-4. 후기 (1차 방향 · DDL TODO)

| 포함 | 제외(1차) |
|------|-----------|
| 후기 텍스트 | 비추천/싫어요 |
| 추천/도움돼요 | |
| 신고 + 관리자 검수/숨김 | |

→ `study_room_reviews`, `study_room_review_helpful` (추후)

### 11-5. 엑셀 반영

구조는 반영 · 1차 **오픈 기능 선별**: 퀵매칭·에스크로·복잡 유료상품 **미포함**

---

## 13. ER

```
study_rooms (1)
 ├── study_room_regions (0..3, is_primary x1)
 ├── study_room_subject_targets (0..N)
 ├── study_room_images (0..5)
 └── study_room_facilities (0..N) → facility_masters
```

---

## 14. 001 gap · DDL

| 파일 | 설명 |
|------|------|
| [001_init.sql](../../sql/schema/001_init.sql) | 초안 · 5장과 **다수 불일치** |
| [003_study_room_fields.sql](../../sql/schema/003_study_room_fields.sql) | **폐기** — 005로 대체 |
| **[005_study_room_ssot_align.sql](../../sql/schema/005_study_room_ssot_align.sql)** | **5장 정합** |

**충돌 시 5장 SSOT 우선.**

---

## 15. 등록 2단계 · Prime/Pick · 유튜브 (잠금 · 8장과 동형)

| 단계 | UI·DB 성격 | 노출 |
|------|------------|------|
| **기본등록** | 최소 항목(명칭·위치 등) | **일반 리스트** 가능 |
| **상세등록** | 소개·과목·가격·이미지·시설·연락·**youtube_url** 1개 등 | 누구나 **이어서** 가능 |

| 등급 | 조건 |
|------|------|
| **Prime / Pick** | **상세등록 완료** 필수 · 노출권(§10) 별도 |
| **Local List** | 기본등록만으로 가능 |

- `youtube_url`: **상세등록** · 외부 YouTube 링크 **1개** · 직접 업로드 없음 · 1차 UI는 썸네일+버튼 수준
- 상세등록을 **등급 구매자만** 막지 않음

---

## 16. 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-05-31 | 5장 초안 (2장 매핑) |
| 2026-05-31 | Notion 5장 원문 전면 반영 · 005 migration |
| 2026-06-01 | 기본/상세 2단계 · Prime/Pick 조건 · youtube_url 잠금 |
