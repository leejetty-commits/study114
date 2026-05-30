-- =============================================================================
-- study114 schema 005 — study room DB SSOT align (5장)
-- Apply AFTER 001_init.sql (004 member optional before/after — FK independent)
--
-- ⚠️ study_rooms 등 컬럼 rename·enum 변경. 백업 후 적용.
-- Usage:
--   mysql -u root -p study114 < sql/schema/005_study_room_ssot_align.sql
-- =============================================================================

USE study114;

-- ---------------------------------------------------------------------------
-- study_rooms — 5장 §4
-- ---------------------------------------------------------------------------
-- closed → hidden (enum 변경 전)
UPDATE study_rooms SET status = 'hidden' WHERE status = 'closed';

ALTER TABLE study_rooms
  CHANGE COLUMN name study_room_name VARCHAR(100) NOT NULL COMMENT '공부방명/노출명',
  CHANGE COLUMN description intro_long TEXT NULL COMMENT '상세 소개',
  CHANGE COLUMN address_detail address_text VARCHAR(255) NULL COMMENT '표시용 주소 요약',
  CHANGE COLUMN status profile_status ENUM('draft', 'pending', 'published', 'hidden') NOT NULL DEFAULT 'draft',
  MODIFY COLUMN price_description TEXT NULL COMMENT '가격 설명';

ALTER TABLE study_rooms
  ADD COLUMN operator_display_name VARCHAR(50) NULL COMMENT '운영자 표시명' AFTER study_room_name,
  ADD COLUMN intro_short VARCHAR(255) NULL COMMENT '짧은 소개' AFTER operator_display_name,
  ADD COLUMN lesson_place_type ENUM('home', 'office') NULL COMMENT '재택/교습소' AFTER intro_long,
  ADD COLUMN region_id BIGINT UNSIGNED NULL COMMENT '기본 위치 동' AFTER lesson_place_type,
  ADD COLUMN complex_id BIGINT UNSIGNED NULL COMMENT '기본 위치 단지' AFTER region_id,
  ADD COLUMN latitude DECIMAL(10, 7) NULL COMMENT '지도 위도' AFTER address_text,
  ADD COLUMN longitude DECIMAL(10, 7) NULL COMMENT '지도 경도' AFTER latitude,
  ADD COLUMN capacity_per_time VARCHAR(50) NULL COMMENT '1타임 수업 인원' AFTER longitude,
  ADD COLUMN recruitment_count SMALLINT UNSIGNED NULL COMMENT '모집 인원' AFTER capacity_per_time,
  ADD COLUMN main_subject_note VARCHAR(255) NULL COMMENT '주력과목 요약' AFTER recruitment_count,
  ADD COLUMN teaching_style VARCHAR(255) NULL COMMENT '지도 스타일' AFTER main_subject_note,
  ADD COLUMN weekend_available TINYINT(1) NOT NULL DEFAULT 0 COMMENT '주말 가능' AFTER teaching_style,
  ADD COLUMN one_on_one_available TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1:1 가능' AFTER weekend_available,
  ADD COLUMN career_years SMALLINT UNSIGNED NULL COMMENT '교습 경력(년)' AFTER price_description,
  ADD COLUMN academy_career_years SMALLINT UNSIGNED NULL COMMENT '학원 경력(년)' AFTER career_years,
  ADD COLUMN franchise_flag TINYINT(1) NOT NULL DEFAULT 0 AFTER academy_career_years,
  ADD COLUMN franchise_name VARCHAR(100) NULL AFTER franchise_flag,
  ADD COLUMN education_office_registered TINYINT(1) NOT NULL DEFAULT 0 COMMENT '교육청 등록' AFTER franchise_name,
  ADD COLUMN education_office_reg_no VARCHAR(50) NULL AFTER education_office_registered,
  ADD COLUMN feature_1 VARCHAR(100) NULL AFTER education_office_reg_no,
  ADD COLUMN feature_2 VARCHAR(100) NULL AFTER feature_1,
  ADD COLUMN feature_3 VARCHAR(100) NULL AFTER feature_2,
  ADD COLUMN contact_time_note VARCHAR(255) NULL COMMENT '연락 가능 시간' AFTER feature_3;

ALTER TABLE study_rooms
  ADD CONSTRAINT fk_study_rooms_region FOREIGN KEY (region_id) REFERENCES regions (id),
  ADD CONSTRAINT fk_study_rooms_complex FOREIGN KEY (complex_id) REFERENCES complexes (id);

-- ---------------------------------------------------------------------------
-- study_room_regions — is_primary (5장 §7)
-- ---------------------------------------------------------------------------
ALTER TABLE study_room_regions
  ADD COLUMN is_primary TINYINT(1) NOT NULL DEFAULT 0 COMMENT '대표지역' AFTER complex_id;

-- slot=1 을 대표로 초기화 (기존 데이터)
UPDATE study_room_regions SET is_primary = 1 WHERE slot = 1;

-- ---------------------------------------------------------------------------
-- study_room_subject_targets — 5장 §5
-- ---------------------------------------------------------------------------
ALTER TABLE study_room_subject_targets
  CHANGE COLUMN subject subject_name VARCHAR(50) NOT NULL COMMENT '과목명',
  MODIFY COLUMN school_level ENUM('preschool', 'elementary', 'middle', 'high', 'retake', 'general', 'other') NULL,
  ADD COLUMN grade_band VARCHAR(20) NULL COMMENT '학년대 세부' AFTER school_level,
  ADD COLUMN is_main TINYINT(1) NOT NULL DEFAULT 0 COMMENT '주력과목' AFTER subject_name;

-- ---------------------------------------------------------------------------
-- study_room_images — 5장 §6
-- ---------------------------------------------------------------------------
ALTER TABLE study_room_images
  ADD COLUMN image_type ENUM('cover', 'interior', 'facility', 'other') NOT NULL DEFAULT 'other' COMMENT '이미지 유형' AFTER study_room_id,
  CHANGE COLUMN storage_path image_path VARCHAR(500) NOT NULL COMMENT '업로드 경로';

-- ---------------------------------------------------------------------------
-- facility_masters — 5장 §8
-- ---------------------------------------------------------------------------
ALTER TABLE facility_masters
  CHANGE COLUMN code facility_code VARCHAR(50) NOT NULL,
  CHANGE COLUMN label facility_name VARCHAR(100) NOT NULL;

-- ---------------------------------------------------------------------------
-- study_room_facilities — note (5장 §9)
-- ---------------------------------------------------------------------------
ALTER TABLE study_room_facilities
  ADD COLUMN note VARCHAR(255) NULL COMMENT '시설별 보충' AFTER facility_id;
