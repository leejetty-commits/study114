-- =============================================================================
-- study114 schema 002 — user_profiles signup fields (SSOT 2장)
-- Apply after 001_init.sql
--
-- Usage:
--   mysql -u root -p study114 < sql/schema/002_profile_signup_fields.sql
-- =============================================================================

USE study114;

ALTER TABLE user_profiles
  ADD COLUMN gender           ENUM('male', 'female') NULL COMMENT '성별 (2장 잠금)' AFTER name,
  ADD COLUMN birth_date       DATE                   NULL COMMENT '생년월일 (2장 잠금)' AFTER gender,
  ADD COLUMN address          VARCHAR(500)           NULL COMMENT '1차 단일 주소 (UI name=address)' AFTER phone,
  ADD COLUMN sms_consent      TINYINT(1)             NOT NULL DEFAULT 0 COMMENT '문자 수신 동의' AFTER address,
  ADD COLUMN email_consent    TINYINT(1)             NOT NULL DEFAULT 0 COMMENT '이메일 수신 동의' AFTER sms_consent,
  ADD COLUMN safe_number_use  TINYINT(1)             NOT NULL DEFAULT 0 COMMENT '안전번호 사용 (확장 포인트)' AFTER email_consent;

-- =============================================================================
-- DEPRECATED — use 005_study_room_ssot_align.sql (SSOT 5장)
-- =============================================================================
-- This file is kept for history only. Do not apply after 005.

-- =============================================================================
-- study114 schema 003 — subject_masters (5장 §5-1 · 4장 §3)
-- Apply AFTER 001_init.sql (+ 002 optional)
-- =============================================================================

USE study114;

CREATE TABLE subject_masters (
  id                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  subject_group_code VARCHAR(20)     NOT NULL COMMENT '전과목/영어/수학/국어/과탐/사탐/한자/기타',
  subject_name       VARCHAR(50)     NOT NULL COMMENT '세부 과목명 또는 표시명',
  parent_subject_id  BIGINT UNSIGNED NULL COMMENT '상위 과목 FK',
  sort_order         SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  is_active          TINYINT(1)      NOT NULL DEFAULT 1,
  created_at         DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_subject_masters_group (subject_group_code, sort_order),
  KEY idx_subject_masters_parent (parent_subject_id),
  CONSTRAINT fk_subject_masters_parent
    FOREIGN KEY (parent_subject_id) REFERENCES subject_masters (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='공통 과목 마스터 (공부방/과외쌤/학생)';

-- 상위 8그룹 + 대표 과목 최소 시드
INSERT INTO subject_masters (subject_group_code, subject_name, parent_subject_id, sort_order, is_active) VALUES
  ('all', '전과목', NULL, 1, 1),
  ('english', '영어', NULL, 2, 1),
  ('english', '영어회화', 2, 1, 1),
  ('english', '영어문법', 2, 2, 1),
  ('math', '수학', NULL, 3, 1),
  ('math', '수학(중등)', 5, 1, 1),
  ('math', '수학(고등)', 5, 2, 1),
  ('korean', '국어', NULL, 4, 1),
  ('korean', '국어문법', 8, 1, 1),
  ('science', '과탐', NULL, 5, 1),
  ('science', '물리', 10, 1, 1),
  ('science', '화학', 10, 2, 1),
  ('social', '사탐', NULL, 6, 1),
  ('social', '한국사', 13, 1, 1),
  ('hanja', '한자', NULL, 7, 1),
  ('other', '기타', NULL, 8, 1),
  ('other', '코딩', 16, 1, 1);

-- =============================================================================
-- study114 schema 004 — member DB SSOT align (4장 · 2026-07)
-- Apply AFTER 001_init.sql (+ 002, 003)
-- =============================================================================

USE study114;

-- ---------------------------------------------------------------------------
-- users — status enum · deleted_at (4장 §4)
-- ---------------------------------------------------------------------------
ALTER TABLE users
  MODIFY COLUMN status ENUM('active', 'pending', 'blocked', 'withdrawn') NOT NULL DEFAULT 'active',
  ADD COLUMN deleted_at DATETIME NULL COMMENT '탈퇴/비활성 추적' AFTER updated_at;

-- ---------------------------------------------------------------------------
-- user_profiles — 4장 §5
-- ---------------------------------------------------------------------------
ALTER TABLE user_profiles
  CHANGE COLUMN name real_name VARCHAR(50) NOT NULL COMMENT '실명',
  CHANGE COLUMN address address_line1 VARCHAR(255) NULL COMMENT '기본 주소',
  ADD COLUMN address_zip VARCHAR(10) NULL COMMENT '우편번호' AFTER birth_date,
  ADD COLUMN address_line2 VARCHAR(255) NULL COMMENT '상세 주소' AFTER address_line1,
  ADD COLUMN default_region_id BIGINT UNSIGNED NULL COMMENT '기본 동 FK' AFTER address_line2,
  ADD COLUMN default_complex_id BIGINT UNSIGNED NULL COMMENT '기본 단지 FK' AFTER default_region_id,
  CHANGE COLUMN sms_consent sms_opt_in TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'SMS 수신',
  CHANGE COLUMN email_consent email_opt_in TINYINT(1) NOT NULL DEFAULT 0 COMMENT '이메일 수신',
  CHANGE COLUMN safe_number_use safe_number_opt_in TINYINT(1) NOT NULL DEFAULT 0 COMMENT '안전번호 확장';

ALTER TABLE user_profiles
  ADD CONSTRAINT fk_user_profiles_default_region
    FOREIGN KEY (default_region_id) REFERENCES regions (id),
  ADD CONSTRAINT fk_user_profiles_default_complex
    FOREIGN KEY (default_complex_id) REFERENCES complexes (id);

-- ---------------------------------------------------------------------------
-- user_roles — role_type · is_primary · status (4장 §6)
-- ---------------------------------------------------------------------------
ALTER TABLE user_roles
  MODIFY COLUMN role ENUM('member', 'guardian_student', 'study_room_owner', 'tutor', 'admin') NOT NULL;

UPDATE user_roles SET role = 'guardian_student' WHERE role = 'member';

ALTER TABLE user_roles
  CHANGE COLUMN role role_type ENUM('guardian_student', 'study_room_owner', 'tutor', 'admin') NOT NULL,
  ADD COLUMN is_primary TINYINT(1) NOT NULL DEFAULT 0 COMMENT '대표 역할' AFTER role_type,
  ADD COLUMN status ENUM('active', 'inactive') NOT NULL DEFAULT 'active' AFTER is_primary;

-- ---------------------------------------------------------------------------
-- students — 4장 §7 (school_name·sort_order 제외)
-- ---------------------------------------------------------------------------
DROP TABLE IF EXISTS student_preferred_teaching_style_badges;
DROP TABLE IF EXISTS student_preferred_lesson_places;
DROP TABLE IF EXISTS student_subject_targets;
DROP TABLE IF EXISTS students;

CREATE TABLE students (
  id                              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  guardian_user_id                BIGINT UNSIGNED NOT NULL COMMENT '학부모 users.id',
  student_name                    VARCHAR(50)     NOT NULL COMMENT '원본 이름 비공개',
  public_display_name             VARCHAR(50)     NULL COMMENT '블라인드 공개명',
  request_title                   VARCHAR(200)    NULL,
  request_summary                 TEXT            NULL,
  request_summary_visibility      ENUM('private', 'paid_only') NOT NULL DEFAULT 'private',
  special_request_note            TEXT            NULL,
  special_request_visibility      ENUM('private', 'paid_only') NOT NULL DEFAULT 'private',
  gender                          ENUM('male', 'female') NULL,
  birth_year                      SMALLINT        NULL,
  grade_level                     VARCHAR(20)     NULL,
  school_track                    VARCHAR(50)     NULL,
  preferred_lesson_type           ENUM('study_room', 'tutor') NULL,
  preferred_studyroom_region_id   BIGINT UNSIGNED NULL,
  preferred_studyroom_complex_id  BIGINT UNSIGNED NULL,
  preferred_tutor_region_id       BIGINT UNSIGNED NULL,
  preferred_region_note           VARCHAR(255)    NULL,
  preferred_tutor_gender          ENUM('male', 'female', 'any') NULL,
  preferred_student_count_group   ENUM('solo', 'two', 'three', 'four_plus') NULL,
  preferred_fee_amount            INT UNSIGNED    NULL COMMENT '과외쌤 맥락 수업예산',
  preferred_studyroom_fee_amount  INT UNSIGNED    NULL COMMENT '공부방 맥락 수업예산',
  lessons_per_week                SMALLINT UNSIGNED NULL,
  minutes_per_lesson              SMALLINT UNSIGNED NULL,
  lesson_format                   ENUM('one_on_one', 'group') NULL,
  academic_level_note             TEXT            NULL,
  preferred_style_note            VARCHAR(255)    NULL,
  preferred_school_note           VARCHAR(255)    NULL,
  preferred_academic_background_note VARCHAR(255) NULL,
  expected_tutoring_period_note   VARCHAR(255)    NULL,
  required_document_note          VARCHAR(255)    NULL,
  contact_time_note               VARCHAR(255)    NULL,
  feature_1                       VARCHAR(100)    NULL,
  feature_2                       VARCHAR(100)    NULL,
  feature_3                       VARCHAR(100)    NULL,
  exposure_status                 ENUM('draft', 'published', 'hidden', 'deleted') NOT NULL DEFAULT 'draft',
  published_at                    DATETIME        NULL,
  deleted_at                      DATETIME        NULL,
  created_at                      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at                      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_students_guardian (guardian_user_id, created_at),
  KEY idx_students_exposure (exposure_status, published_at),
  KEY idx_students_studyroom_region (preferred_studyroom_region_id),
  KEY idx_students_tutor_region (preferred_tutor_region_id),
  CONSTRAINT fk_students_guardian FOREIGN KEY (guardian_user_id) REFERENCES users (id),
  CONSTRAINT fk_students_studyroom_region FOREIGN KEY (preferred_studyroom_region_id) REFERENCES regions (id),
  CONSTRAINT fk_students_studyroom_complex FOREIGN KEY (preferred_studyroom_complex_id) REFERENCES complexes (id),
  CONSTRAINT fk_students_tutor_region FOREIGN KEY (preferred_tutor_region_id) REFERENCES regions (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='학부모 소속 자녀 + 과외등록 (4장)';

CREATE TABLE student_subject_targets (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  student_id        BIGINT UNSIGNED NOT NULL,
  school_level      ENUM('preschool', 'elementary', 'middle', 'high', 'n_su', 'general', 'other') NOT NULL,
  subject_master_id BIGINT UNSIGNED NULL,
  subject_name      VARCHAR(50)     NOT NULL,
  is_primary        TINYINT(1)      NOT NULL DEFAULT 0,
  created_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_sst_student (student_id),
  KEY idx_sst_subject (subject_name, school_level),
  CONSTRAINT fk_sst_student FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE,
  CONSTRAINT fk_sst_subject_master FOREIGN KEY (subject_master_id) REFERENCES subject_masters (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='학생 희망과목 (4장 §7-1)';

CREATE TABLE student_preferred_lesson_places (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  student_id BIGINT UNSIGNED NOT NULL,
  place_type ENUM('student_home', 'study_room', 'public_place') NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_student_place (student_id, place_type),
  CONSTRAINT fk_splp_student FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='학생 희망 수업장소 (4장 §7-1-1)';

CREATE TABLE student_preferred_teaching_style_badges (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  student_id    BIGINT UNSIGNED NOT NULL,
  badge_name    ENUM('passion', 'meticulous', 'kind', 'from_basics', 'advanced_focus', 'concept_focus', 'solution_focus') NOT NULL,
  display_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_sptsb_student (student_id, display_order),
  CONSTRAINT fk_sptsb_student FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='학생 희망 강의스타일 배지 (4장 §7-1-2)';

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
  ADD COLUMN slogan VARCHAR(255) NULL COMMENT '한줄 슬로건' AFTER operator_display_name,
  ADD COLUMN intro_short VARCHAR(255) NULL COMMENT '짧은 소개' AFTER slogan,
  ADD COLUMN lesson_place_type ENUM('academy', 'study_room') NULL COMMENT '교습소/공부방' AFTER intro_long,
  ADD COLUMN lesson_operation_type ENUM('group_by_time_slot', 'time_slot_mixed_grade', 'individual_visit') NULL COMMENT '수업운영형태' AFTER lesson_place_type,
  ADD COLUMN region_id BIGINT UNSIGNED NULL COMMENT '기본 위치 동' AFTER lesson_operation_type,
  ADD COLUMN complex_id BIGINT UNSIGNED NULL COMMENT '기본 위치 단지' AFTER region_id,
  ADD COLUMN latitude DECIMAL(10, 7) NULL COMMENT '지도 위도' AFTER address_text,
  ADD COLUMN longitude DECIMAL(10, 7) NULL COMMENT '지도 경도' AFTER latitude,
  ADD COLUMN capacity_per_time ENUM('one_to_four', 'five_to_eight', 'nine_plus') NULL COMMENT '타임별 원생수' AFTER longitude,
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
  ADD COLUMN contact_time_note VARCHAR(255) NULL COMMENT '연락 가능 시간' AFTER feature_3,
  ADD COLUMN detail_completion_status ENUM('basic_only', 'expanded_in_progress', 'expanded_complete') NOT NULL DEFAULT 'basic_only' COMMENT '기본/상세등록 상태' AFTER profile_status;

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
  MODIFY COLUMN school_level ENUM('preschool', 'elementary', 'middle', 'high', 'n_su', 'general', 'other') NULL,
  ADD COLUMN grade_band VARCHAR(20) NULL COMMENT '학년대 세부' AFTER school_level,
  ADD COLUMN subject_master_id BIGINT UNSIGNED NULL COMMENT '과목 마스터 FK' AFTER grade_band,
  ADD COLUMN is_main TINYINT(1) NOT NULL DEFAULT 0 COMMENT '주력과목' AFTER subject_name,
  ADD CONSTRAINT fk_srst_subject_master FOREIGN KEY (subject_master_id) REFERENCES subject_masters (id);

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

-- =============================================================================
-- study114 schema 006 — facility_masters seed (5장 §11-3 권장 ~5개)
-- Apply AFTER 005_study_room_ssot_align.sql
-- =============================================================================

-- Apply: mysql ... study114_dev < this file (USE 생략 — DB는 CLI 인자)

INSERT INTO facility_masters (facility_code, facility_name, sort_order, is_active) VALUES
  ('aircon',      '냉난방',           1, 1),
  ('ventilation', '환기',             2, 1),
  ('restroom',    '화장실/위생',      3, 1),
  ('parking',     '통학/주차 편의',   4, 1),
  ('safety',      'CCTV/안전관리',    5, 1)
ON DUPLICATE KEY UPDATE
  facility_name = VALUES(facility_name),
  sort_order = VALUES(sort_order),
  is_active = VALUES(is_active);

-- =============================================================================
-- study114 schema 007 — SSOT 4·5장 불일치 보정
-- Apply AFTER 001~006 on study114_dev (Docker MySQL 8.4)
--
-- Usage:
--   docker cp sql/schema/007_schema_ssot_fix.sql study114-mysql-dev:/tmp/
--   docker exec study114-mysql-dev sh -c "mysql -uroot -pstudy114dev --default-character-set=utf8mb4 study114_dev < /tmp/007_schema_ssot_fix.sql"
-- =============================================================================

-- USE study114_dev;

-- ---------------------------------------------------------------------------
-- user_roles — 4장 §6: granted_at → created_at
-- ---------------------------------------------------------------------------
ALTER TABLE user_roles
  CHANGE COLUMN granted_at created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- ---------------------------------------------------------------------------
-- user_profiles — 4장 §5: 001 잔존 home_* / activity_* 제거
-- ---------------------------------------------------------------------------
ALTER TABLE user_profiles
  DROP FOREIGN KEY fk_user_profiles_home_region,
  DROP FOREIGN KEY fk_user_profiles_home_complex,
  DROP FOREIGN KEY fk_user_profiles_activity_region,
  DROP FOREIGN KEY fk_user_profiles_activity_complex;

ALTER TABLE user_profiles
  DROP INDEX idx_user_profiles_home_region,
  DROP INDEX idx_user_profiles_home_complex,
  DROP INDEX idx_user_profiles_activity_region,
  DROP INDEX idx_user_profiles_activity_complex;

ALTER TABLE user_profiles
  DROP COLUMN home_region_id,
  DROP COLUMN home_complex_id,
  DROP COLUMN home_address_detail,
  DROP COLUMN activity_region_id,
  DROP COLUMN activity_complex_id,
  DROP COLUMN activity_address_detail;

-- =============================================================================
-- study114 schema 008 — tutors DB SSOT align (8장 · 2026-07)
-- Apply AFTER 004_member_ssot_align.sql
-- =============================================================================

USE study114;

CREATE TABLE tutors (
  id                           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id                      BIGINT UNSIGNED NOT NULL,
  tutor_display_name           VARCHAR(50)     NOT NULL COMMENT '노출용 이름',
  slogan                       VARCHAR(255)    NULL,
  intro_short                  VARCHAR(255)    NULL,
  intro_long                   TEXT            NULL,
  student_gender_group         ENUM('male', 'female', 'mixed') NULL,
  student_count_group          ENUM('solo', 'two', 'three', 'four_plus') NULL,
  age_band                     ENUM('early_20s', 'late_20s', 'early_30s', 'late_30s', 'early_40s', 'late_40s', 'over_50') NULL,
  lesson_place_note            VARCHAR(255)    NULL,
  preferred_student_level_note VARCHAR(255)    NULL,
  main_subject_note            VARCHAR(255)    NULL,
  main_material_note           VARCHAR(255)    NULL,
  teaching_style               VARCHAR(255)    NULL,
  lesson_frequency_note        VARCHAR(255)    NULL,
  preferred_fee_amount         INT UNSIGNED    NULL COMMENT '월 대표 과외비',
  career_year_band             ENUM('y1_3', 'y4_6', 'y7_10', 'y10_plus') NULL,
  fee_basis_type               ENUM('monthly_by_weekly_schedule', 'monthly_by_total_sessions') NULL,
  lessons_per_week             SMALLINT UNSIGNED NULL,
  monthly_session_count        SMALLINT UNSIGNED NULL,
  minutes_per_lesson           SMALLINT UNSIGNED NULL,
  fee_description              TEXT            NULL,
  university_note              VARCHAR(255)    NULL,
  university_name              VARCHAR(100)    NULL,
  major_name                   VARCHAR(100)    NULL,
  university_status            ENUM('enrolled', 'leave', 'completed', 'graduated') NULL,
  proof_document_available     TINYINT(1)      NOT NULL DEFAULT 0,
  verification_badge_visible   TINYINT(1)      NOT NULL DEFAULT 0,
  feature_1                    VARCHAR(100)    NULL,
  feature_2                    VARCHAR(100)    NULL,
  feature_3                    VARCHAR(100)    NULL,
  contact_time_note            VARCHAR(255)    NULL,
  default_student_feed_mode    VARCHAR(50)     NULL,
  profile_status               ENUM('draft', 'pending', 'published', 'hidden') NOT NULL DEFAULT 'draft',
  created_at                   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at                   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_tutors_user (user_id),
  KEY idx_tutors_status (profile_status),
  CONSTRAINT fk_tutors_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='과외쌤 프로필 (8장)';

CREATE TABLE tutor_subject_targets (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tutor_id          BIGINT UNSIGNED NOT NULL,
  school_level      ENUM('preschool', 'elementary', 'middle', 'high', 'n_su', 'general', 'other') NULL,
  grade_band        VARCHAR(20)     NULL,
  subject_master_id BIGINT UNSIGNED NULL,
  subject_name      VARCHAR(50)     NOT NULL,
  is_primary        TINYINT(1)      NOT NULL DEFAULT 0,
  created_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_tst_tutor (tutor_id),
  CONSTRAINT fk_tst_tutor FOREIGN KEY (tutor_id) REFERENCES tutors (id) ON DELETE CASCADE,
  CONSTRAINT fk_tst_subject_master FOREIGN KEY (subject_master_id) REFERENCES subject_masters (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE tutor_regions (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tutor_id       BIGINT UNSIGNED NOT NULL,
  region_id      BIGINT UNSIGNED NOT NULL,
  scope_type     ENUM('city', 'district', 'metro') NOT NULL DEFAULT 'city',
  priority_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  is_primary     TINYINT(1)      NOT NULL DEFAULT 0,
  created_at     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_tr_tutor (tutor_id, priority_order),
  CONSTRAINT fk_tr_tutor FOREIGN KEY (tutor_id) REFERENCES tutors (id) ON DELETE CASCADE,
  CONSTRAINT fk_tr_region FOREIGN KEY (region_id) REFERENCES regions (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE tutor_lesson_places (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tutor_id   BIGINT UNSIGNED NOT NULL,
  place_type ENUM('student_home_visit', 'public_place', 'tutor_home') NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_tutor_place (tutor_id, place_type),
  CONSTRAINT fk_tlp_tutor FOREIGN KEY (tutor_id) REFERENCES tutors (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE tutor_images (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tutor_id   BIGINT UNSIGNED NOT NULL,
  image_type ENUM('profile', 'intro', 'proof_aux', 'other') NOT NULL DEFAULT 'other',
  image_path VARCHAR(500)    NOT NULL,
  sort_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  created_at DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_ti_tutor (tutor_id, sort_order),
  CONSTRAINT fk_ti_tutor FOREIGN KEY (tutor_id) REFERENCES tutors (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE tutor_teaching_style_badges (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tutor_id      BIGINT UNSIGNED NOT NULL,
  badge_name    ENUM('passion', 'meticulous', 'kind', 'from_basics', 'advanced_focus', 'concept_focus', 'solution_focus') NOT NULL,
  display_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_ttsb_tutor (tutor_id, display_order),
  CONSTRAINT fk_ttsb_tutor FOREIGN KEY (tutor_id) REFERENCES tutors (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE tutor_verification_documents (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tutor_id      BIGINT UNSIGNED NOT NULL,
  document_type ENUM('enrollment', 'graduation', 'grades', 'career', 'identity', 'other') NOT NULL,
  document_path VARCHAR(500)    NOT NULL,
  review_status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  review_note   VARCHAR(255)    NULL,
  reviewed_at   DATETIME        NULL,
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_tvd_tutor (tutor_id),
  CONSTRAINT fk_tvd_tutor FOREIGN KEY (tutor_id) REFERENCES tutors (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- study114 schema 009 — study room extended (5장 §11-10)
-- Apply AFTER 005_study_room_ssot_align.sql
-- =============================================================================

USE study114;

-- 상세등록 YouTube (5장 §11-8) — study_rooms 확장 컬럼
ALTER TABLE study_rooms
  ADD COLUMN youtube_url VARCHAR(500) NULL COMMENT '상세등록 외부 YouTube URL 1개' AFTER facility_note;

CREATE TABLE study_room_verification_documents (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  study_room_id    BIGINT UNSIGNED NOT NULL,
  document_type    ENUM('education_office', 'business_registration', 'franchise_proof', 'career_proof', 'other') NOT NULL,
  file_path        VARCHAR(500)    NOT NULL,
  masked_file_path VARCHAR(500)    NULL,
  review_status    ENUM('pending', 'approved', 'rejected', 'expired') NOT NULL DEFAULT 'pending',
  review_note      VARCHAR(255)    NULL,
  reviewed_at      DATETIME        NULL,
  created_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_srvd_room (study_room_id, review_status),
  CONSTRAINT fk_srvd_room FOREIGN KEY (study_room_id) REFERENCES study_rooms (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='공부방 증빙 문서 (5장 §11-10-2)';

CREATE TABLE study_room_badges (
  id                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  study_room_id      BIGINT UNSIGNED NOT NULL,
  badge_code         ENUM('education_office', 'business_registration', 'franchise_proof', 'career_proof', 'other') NOT NULL,
  source_document_id BIGINT UNSIGNED NULL,
  display_order      SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  is_active          TINYINT(1)      NOT NULL DEFAULT 1,
  created_at         DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_srb_room (study_room_id, display_order),
  CONSTRAINT fk_srb_room FOREIGN KEY (study_room_id) REFERENCES study_rooms (id) ON DELETE CASCADE,
  CONSTRAINT fk_srb_document FOREIGN KEY (source_document_id) REFERENCES study_room_verification_documents (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='공부방 검수 배지 (5장 §11-10-3)';

CREATE TABLE study_room_exposure_assignments (
  id                       BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  study_room_id            BIGINT UNSIGNED NOT NULL,
  exposure_type            ENUM('prime', 'pick', 'basic') NOT NULL,
  region_basis_type        ENUM('complex', 'dong') NOT NULL DEFAULT 'dong',
  region_id                BIGINT UNSIGNED NULL,
  complex_id               BIGINT UNSIGNED NULL,
  slot_group               VARCHAR(50)     NULL,
  slot_index               SMALLINT UNSIGNED NULL,
  priority_order           SMALLINT UNSIGNED NULL,
  time_block_code          VARCHAR(50)     NULL,
  starts_at                DATETIME        NULL,
  ends_at                  DATETIME        NULL,
  renewal_window_starts_at DATETIME        NULL,
  renewal_window_ends_at   DATETIME        NULL,
  renewal_notice_sent_at   DATETIME        NULL,
  payment_status           ENUM('pending', 'paid', 'expired', 'cancelled') NOT NULL DEFAULT 'pending',
  payment_completed_at     DATETIME        NULL,
  exposure_status          ENUM('scheduled', 'active', 'ended', 'paused') NOT NULL DEFAULT 'scheduled',
  created_at               DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_srea_room (study_room_id, exposure_type, exposure_status),
  CONSTRAINT fk_srea_room FOREIGN KEY (study_room_id) REFERENCES study_rooms (id) ON DELETE CASCADE,
  CONSTRAINT fk_srea_region FOREIGN KEY (region_id) REFERENCES regions (id),
  CONSTRAINT fk_srea_complex FOREIGN KEY (complex_id) REFERENCES complexes (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Prime/Pick 노출 편성 (5장 §11-10-4)';

CREATE TABLE study_room_exposure_waitlists (
  id                      BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  study_room_id           BIGINT UNSIGNED NOT NULL,
  exposure_type           ENUM('prime', 'pick') NOT NULL,
  region_basis_type       ENUM('complex', 'dong') NOT NULL DEFAULT 'dong',
  region_id               BIGINT UNSIGNED NULL,
  complex_id              BIGINT UNSIGNED NULL,
  slot_group              VARCHAR(50)     NULL,
  waitlist_window_starts_at DATETIME      NULL,
  waitlist_window_ends_at DATETIME        NULL,
  registered_at           DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  open_notice_sent_at     DATETIME        NULL,
  payment_status          ENUM('registered', 'notified', 'paid', 'expired', 'cancelled') NOT NULL DEFAULT 'registered',
  payment_completed_at    DATETIME        NULL,
  PRIMARY KEY (id),
  KEY idx_srew_room (study_room_id, exposure_type),
  CONSTRAINT fk_srew_room FOREIGN KEY (study_room_id) REFERENCES study_rooms (id) ON DELETE CASCADE,
  CONSTRAINT fk_srew_region FOREIGN KEY (region_id) REFERENCES regions (id),
  CONSTRAINT fk_srew_complex FOREIGN KEY (complex_id) REFERENCES complexes (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='노출 예약대기 (5장 §11-10-5)';

-- =============================================================================
-- study114 schema 010 — tutor extended (8장 §11-8·§11-9)
-- Apply AFTER 008_tutors.sql
-- =============================================================================

USE study114;

ALTER TABLE tutors
  ADD COLUMN detail_completion_status ENUM('basic_only', 'expanded_in_progress', 'expanded_complete') NOT NULL DEFAULT 'basic_only' COMMENT '기본/상세등록' AFTER profile_status,
  ADD COLUMN youtube_url VARCHAR(500) NULL COMMENT '상세등록 YouTube URL 1개' AFTER contact_time_note;

-- =============================================================================
-- study114 schema 011 — students.student_gender_group (13장 §5 · §6)
-- Apply AFTER 004_member_ssot_align.sql
-- 그룹과외 선택 시 남/여/남여 구성 — students.gender 와 별도
-- =============================================================================

USE study114;

ALTER TABLE students
  ADD COLUMN student_gender_group ENUM('male', 'female', 'mixed') NULL
    COMMENT '그룹과외 시 희망 구성 (남/여/남여)' AFTER lesson_format;

-- =============================================================================
-- study114 schema 012 — search dev seed (13장 검색 API 로컬 검증용)
-- Apply AFTER 011_student_gender_group.sql
-- =============================================================================

USE study114;

SET NAMES utf8mb4;

-- bcrypt for dev password "password" (Laravel test hash)
SET @pw := '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';

INSERT INTO regions (sido_code, sido_name, sigungu_code, sigungu_name, dong_code, dong_name) VALUES
  ('11', '서울특별시', '11680', '강남구', '11680101', '대치동'),
  ('26', '부산광역시', '26350', '해운대구', '26350101', '우동'),
  ('26', '부산광역시', '26350', '해운대구', '26350102', '센텀동');

INSERT INTO complexes (region_id, name) VALUES
  (1, '은마아파트'),
  (3, '센텀자이');

INSERT INTO users (email, password_hash, status) VALUES
  ('room-owner1@dev.local', @pw, 'active'),
  ('room-owner2@dev.local', @pw, 'active'),
  ('room-owner3@dev.local', @pw, 'active'),
  ('tutor-owner1@dev.local', @pw, 'active'),
  ('tutor-owner2@dev.local', @pw, 'active'),
  ('guardian1@dev.local', @pw, 'active');

INSERT INTO user_profiles (user_id, real_name, gender, birth_date, phone, address_line1) VALUES
  (1, '김운영', 'male', '1980-03-01', '010-1111-0001', '서울 강남구'),
  (2, '이운영', 'female', '1985-06-15', '010-1111-0002', '부산 해운대구'),
  (3, '박운영', 'male', '1978-11-20', '010-1111-0003', '부산 해운대구'),
  (4, '최튜터', 'male', '1992-01-10', '010-2222-0001', '서울 강남구'),
  (5, '정튜터', 'female', '1994-07-22', '010-2222-0002', '부산 해운대구'),
  (6, '한학부', 'female', '1988-09-05', '010-3333-0001', '부산 해운대구');

INSERT INTO user_roles (user_id, role_type, is_primary, status) VALUES
  (1, 'study_room_owner', 1, 'active'),
  (2, 'study_room_owner', 1, 'active'),
  (3, 'study_room_owner', 1, 'active'),
  (4, 'tutor', 1, 'active'),
  (5, 'tutor', 1, 'active'),
  (6, 'guardian_student', 1, 'active');

INSERT INTO study_rooms (
  user_id, study_room_name, intro_short, main_subject_note, teaching_style,
  lesson_place_type, lesson_operation_type,
  region_id, complex_id, price_amount,
  weekend_available, one_on_one_available, education_office_registered,
  capacity_per_time, career_years, franchise_flag, detail_completion_status,
  profile_status, published_at
) VALUES
  (1, '대치 Prime 수학 공부방', '소수정예 · 숙제관리', '중등·고등 수학', '개념+심화',
   'study_room', 'group_by_time_slot',
   1, 1, 480000,
   1, 1, 1,
   'one_to_four', 8, 0, 'expanded_complete',
   'published', NOW()),
  (2, '우동 Pick 영어 공부방', '발음교정', '초등·중등 영어', '회화 중심',
   'academy', 'time_slot_mixed_grade',
   2, NULL, 320000,
   0, 0, 0,
   'five_to_eight', 5, 0, 'expanded_in_progress',
   'published', NOW()),
  (3, '센텀 Basic 국어 공부방', '독해 중심', '초등·중등 국어', '독해·문법',
   'study_room', 'individual_visit',
   3, 2, 220000,
   1, 0, 0,
   'one_to_four', 3, 0, 'basic_only',
   'published', NOW());

INSERT INTO study_room_regions (study_room_id, slot, region_id, complex_id, is_primary) VALUES
  (1, 1, 1, 1, 1),
  (2, 1, 2, NULL, 1),
  (3, 1, 3, 2, 1);

INSERT INTO study_room_subject_targets (study_room_id, subject_name, school_level, subject_master_id, is_main) VALUES
  (1, '수학', 'middle', 5, 1),
  (1, '수학', 'high', 5, 0),
  (2, '영어', 'elementary', 2, 1),
  (2, '영어', 'middle', 2, 0),
  (3, '국어', 'elementary', 8, 1),
  (3, '국어', 'middle', 8, 0);

INSERT INTO study_room_facilities (study_room_id, facility_id) VALUES
  (1, 1),
  (1, 5);

INSERT INTO tutors (
  user_id, tutor_display_name, preferred_fee_amount, university_name, major_name,
  career_year_band, lessons_per_week, minutes_per_lesson,
  student_gender_group, student_count_group, age_band, university_status,
  profile_status
) VALUES
  (4, '대치 Prime 수학', 600000, '서울대', '수학과', 'y7_10', 2, 90, 'mixed', 'solo', 'early_30s', 'graduated', 'published'),
  (5, '우동 Pick 영어', 400000, '연세대', '영어영문학과', 'y4_6', 2, 60, 'female', 'two', 'late_20s', 'graduated', 'published');

INSERT INTO tutor_regions (tutor_id, region_id, scope_type, priority_order, is_primary) VALUES
  (1, 1, 'city', 0, 1),
  (2, 2, 'city', 0, 1);

INSERT INTO tutor_subject_targets (tutor_id, subject_name, school_level, subject_master_id, is_primary) VALUES
  (1, '수학', 'middle', 5, 1),
  (1, '수학', 'high', 5, 0),
  (2, '영어', 'elementary', 2, 1),
  (2, '영어', 'middle', 2, 0);

INSERT INTO tutor_lesson_places (tutor_id, place_type) VALUES
  (1, 'student_home_visit'),
  (1, 'public_place'),
  (2, 'student_home_visit');

INSERT INTO tutor_teaching_style_badges (tutor_id, badge_name, display_order) VALUES
  (1, 'meticulous', 0),
  (1, 'concept_focus', 1),
  (2, 'kind', 0),
  (2, 'passion', 1);

INSERT INTO students (
  guardian_user_id, student_name, public_display_name,
  gender, grade_level, preferred_lesson_type,
  preferred_studyroom_region_id, preferred_studyroom_complex_id,
  preferred_tutor_region_id,
  preferred_fee_amount, preferred_studyroom_fee_amount,
  lessons_per_week, minutes_per_lesson,
  lesson_format, student_gender_group, preferred_student_count_group,
  exposure_status, published_at
) VALUES
  (6, '김맑음', '맑은하늘', 'male', '중2', 'tutor',
   NULL, NULL, 2,
   550000, NULL,
   2, 90, 'one_on_one', NULL, NULL,
   'published', NOW()),
  (6, '이초등', '초등왕', 'female', '초5', 'study_room',
   3, 2, NULL,
   NULL, 380000,
   2, 60, 'group', 'mixed', 'two',
   'published', NOW());

INSERT INTO student_subject_targets (student_id, subject_name, school_level, subject_master_id, is_primary) VALUES
  (1, '수학', 'middle', 5, 1),
  (1, '영어', 'middle', 2, 0),
  (2, '국어', 'elementary', 8, 0),
  (2, '수학', 'elementary', 5, 1);

INSERT INTO student_preferred_lesson_places (student_id, place_type) VALUES
  (1, 'student_home'),
  (2, 'study_room');

INSERT INTO student_preferred_teaching_style_badges (student_id, badge_name, display_order) VALUES
  (1, 'from_basics', 0),
  (2, 'kind', 0);

-- =============================================================================
-- study114 schema 013 — 25장 부록 B Handoff basket DDL
-- favorite · compare · recent_view · student_review
-- Apply AFTER 012_search_dev_seed.sql
-- SSOT: docs/ssot/25-decision-handoff-layer.md 부록 B
-- Preview bridge: preview/home-ui/src/*-store.js · user-actions-state.js
-- =============================================================================

USE study114;

SET NAMES utf8mb4;

-- ---------------------------------------------------------------------------
-- user_favorites — P15-06 찜 · P25-03 (학생 ✕)
-- ---------------------------------------------------------------------------
CREATE TABLE user_favorites (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id      BIGINT UNSIGNED NOT NULL COMMENT 'users.id · 학부모 등',
  target_type  ENUM('study_room', 'tutor') NOT NULL,
  target_id    BIGINT UNSIGNED NOT NULL COMMENT 'study_rooms.id | tutors.id',
  created_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_user_favorites (user_id, target_type, target_id),
  KEY idx_user_favorites_user (user_id, target_type, created_at),
  CONSTRAINT fk_user_favorites_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='25장 §5 찜 · compare_session과 별개';

-- ---------------------------------------------------------------------------
-- user_compare_items — P25-03 비교 후보 (max 3 / kind · 혼합 ✕)
-- ---------------------------------------------------------------------------
CREATE TABLE user_compare_items (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id      BIGINT UNSIGNED NOT NULL,
  target_type  ENUM('study_room', 'tutor') NOT NULL,
  target_id    BIGINT UNSIGNED NOT NULL,
  sort_order   TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '0~2 · 담은 순서',
  created_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_user_compare (user_id, target_type, target_id),
  KEY idx_user_compare_list (user_id, target_type, sort_order),
  CONSTRAINT fk_user_compare_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='25장 §5 compare_session 영속 basket';

-- ---------------------------------------------------------------------------
-- user_recent_views — P15-07 최근열람 · resume token
-- ---------------------------------------------------------------------------
CREATE TABLE user_recent_views (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id         BIGINT UNSIGNED NOT NULL,
  target_type     ENUM('study_room', 'tutor', 'student') NOT NULL,
  target_id       BIGINT UNSIGNED NOT NULL,
  title_snapshot  VARCHAR(120)    NOT NULL DEFAULT '' COMMENT '목록 표시용 스냅샷',
  last_route      VARCHAR(32)     NULL COMMENT 'search|detail|wishlist|mypage|student-review',
  last_action     VARCHAR(32)     NOT NULL DEFAULT 'view_detail' COMMENT 'view_detail|wish_add|compare_add|review_add',
  viewed_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_user_recent (user_id, target_type, target_id),
  KEY idx_user_recent_feed (user_id, viewed_at DESC),
  CONSTRAINT fk_user_recent_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='25장 §6 · P15-07 · max 30건 앱 prune';

-- ---------------------------------------------------------------------------
-- provider_student_reviews — P25-S10 학생 검토함
-- ---------------------------------------------------------------------------
CREATE TABLE provider_student_reviews (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  provider_user_id BIGINT UNSIGNED NOT NULL COMMENT 'tutor | study_room_owner users.id',
  student_id       BIGINT UNSIGNED NOT NULL COMMENT 'students.id',
  provider_role    ENUM('tutor', 'study_room') NOT NULL,
  saved_at         DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_provider_student_review (provider_user_id, student_id),
  KEY idx_provider_review_feed (provider_user_id, saved_at DESC),
  CONSTRAINT fk_psr_provider
    FOREIGN KEY (provider_user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_psr_student
    FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='25장 §8 · 찜·비교와 별개 · max 50건 앱 prune';

-- =============================================================================
-- study114 schema 014 — 16장 P16 쪽지 thread · message DDL
-- Apply AFTER 013_handoff_basket.sql
-- SSOT: docs/ssot/16-messages-structure-proposal.md 부록 A · §6-3 thread 재사용
-- Preview bridge: preview/home-ui/src/messages/thread-store.js
-- =============================================================================

USE study114;

SET NAMES utf8mb4;

-- ---------------------------------------------------------------------------
-- message_threads — 1:1 thread · participant pair + context (§6-3 재사용 키)
-- ---------------------------------------------------------------------------
CREATE TABLE message_threads (
  id                      BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  participant_low_user_id BIGINT UNSIGNED NOT NULL COMMENT 'min(user_a, user_b)',
  participant_high_user_id BIGINT UNSIGNED NOT NULL COMMENT 'max(user_a, user_b)',
  context_kind            ENUM('student', 'study_room', 'tutor') NOT NULL,
  context_id              BIGINT UNSIGNED NOT NULL COMMENT 'students.id | study_rooms.id | tutors.id',
  context_label           VARCHAR(80)     NOT NULL DEFAULT '',
  peer_display_name       VARCHAR(80)     NOT NULL DEFAULT '' COMMENT '상대 표시명 스냅샷',
  scope_badge             VARCHAR(80)     NOT NULL DEFAULT '',
  scope_hint              VARCHAR(255)    NOT NULL DEFAULT '',
  show_request_in_panel   TINYINT(1)      NOT NULL DEFAULT 0,
  request_summary         TEXT            NULL,
  structured_line         VARCHAR(255)    NOT NULL DEFAULT '',
  initiated_by_user_id    BIGINT UNSIGNED NOT NULL,
  last_message_preview    VARCHAR(120)    NOT NULL DEFAULT '',
  updated_at              DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at              DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_message_thread_context (
    context_kind, context_id, participant_low_user_id, participant_high_user_id
  ),
  KEY idx_message_threads_low (participant_low_user_id, updated_at DESC),
  KEY idx_message_threads_high (participant_high_user_id, updated_at DESC),
  CONSTRAINT fk_message_threads_low
    FOREIGN KEY (participant_low_user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_message_threads_high
    FOREIGN KEY (participant_high_user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_message_threads_initiator
    FOREIGN KEY (initiated_by_user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='16장 P16 thread · context+participant pair 재사용';

-- ---------------------------------------------------------------------------
-- messages — thread 본문
-- ---------------------------------------------------------------------------
CREATE TABLE messages (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  thread_id       BIGINT UNSIGNED NOT NULL,
  sender_user_id  BIGINT UNSIGNED NOT NULL,
  body            TEXT            NOT NULL,
  created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_messages_thread (thread_id, created_at),
  CONSTRAINT fk_messages_thread
    FOREIGN KEY (thread_id) REFERENCES message_threads (id) ON DELETE CASCADE,
  CONSTRAINT fk_messages_sender
    FOREIGN KEY (sender_user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='16장 P16 메시지 본문';

-- ---------------------------------------------------------------------------
-- message_thread_reads — 읽음 (미읽 dot · inbox 탭)
-- ---------------------------------------------------------------------------
CREATE TABLE message_thread_reads (
  thread_id   BIGINT UNSIGNED NOT NULL,
  user_id     BIGINT UNSIGNED NOT NULL,
  read_at     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (thread_id, user_id),
  CONSTRAINT fk_mtr_thread
    FOREIGN KEY (thread_id) REFERENCES message_threads (id) ON DELETE CASCADE,
  CONSTRAINT fk_mtr_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='16장 P16 읽음 시각';

-- ---------------------------------------------------------------------------
-- dev seed — 학부모→공부방1 선연락 샘플 (012_search_dev_seed 이후)
-- ---------------------------------------------------------------------------
INSERT INTO message_threads (
  participant_low_user_id, participant_high_user_id,
  context_kind, context_id,
  context_label, peer_display_name,
  scope_badge, scope_hint,
  show_request_in_panel, structured_line,
  initiated_by_user_id, last_message_preview
) VALUES (
  1, 6,
  'study_room', 1,
  '공부방 상세', '대치 Prime 수학 공부방',
  '공개 프로필', '학부모 선연락 · 답장 free',
  0, '중2 · 수학 · 대치동 · 주 2회 희망',
  6, '대치동 중2 수학 공부방 상담 가능할까요?'
);

INSERT INTO messages (thread_id, sender_user_id, body) VALUES
  (1, 6, '안녕하세요, 대치동 중2 수학 공부방 상담 가능할까요? 주 2회 희망합니다.');

INSERT INTO message_thread_reads (thread_id, user_id, read_at) VALUES
  (1, 6, NOW());

-- =============================================================================
-- study114 schema 015 — 16장 P16 마무리 (entitlement · moderation)
-- Apply AFTER 014_messages.sql
-- SSOT: 16§7 P16-04 · 16§5 신고/차단 · 보관함(1차 탭)
-- =============================================================================

USE study114;

SET NAMES utf8mb4;

-- ---------------------------------------------------------------------------
-- provider_entitlements — P16-04 콜드 메모 · P18 placeholder
-- ---------------------------------------------------------------------------
CREATE TABLE provider_entitlements (
  user_id           BIGINT UNSIGNED NOT NULL,
  subscription_tier ENUM('free', 'paid') NOT NULL DEFAULT 'free',
  cold_memo_allowed TINYINT(1)      NOT NULL DEFAULT 0 COMMENT '콜드 메모 허용',
  memo_credits      INT UNSIGNED    NOT NULL DEFAULT 0 COMMENT '쪽지권 잔여 횟수 (레거시 컬럼명)',
  updated_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  CONSTRAINT fk_provider_entitlements_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='16§7 · 18장 entitlement placeholder';

INSERT INTO provider_entitlements (user_id, subscription_tier, cold_memo_allowed, memo_credits) VALUES
  (1, 'free', 0, 0),
  (2, 'free', 0, 0),
  (3, 'free', 0, 0),
  (4, 'free', 0, 0),
  (5, 'paid', 1, 10);

-- ---------------------------------------------------------------------------
-- message_thread_participant_state — 보관 · 차단 · 신고 (참가자별)
-- ---------------------------------------------------------------------------
CREATE TABLE message_thread_participant_state (
  thread_id      BIGINT UNSIGNED NOT NULL,
  user_id        BIGINT UNSIGNED NOT NULL,
  is_archived    TINYINT(1)      NOT NULL DEFAULT 0,
  is_blocked     TINYINT(1)      NOT NULL DEFAULT 0,
  block_reason   VARCHAR(120)    NULL,
  reported_at    DATETIME        NULL,
  report_reason  VARCHAR(50)     NULL,
  updated_at     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (thread_id, user_id),
  CONSTRAINT fk_mtps_thread
    FOREIGN KEY (thread_id) REFERENCES message_threads (id) ON DELETE CASCADE,
  CONSTRAINT fk_mtps_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='16§5 신고/차단 · 보관함(참가자별)';

-- =============================================================================
-- study114 schema 016 — 20장 inquiry_status · 등록 허브 API 보강
-- Apply AFTER 015_messages_p16_finish.sql
-- SSOT: docs/ssot/20-study-room-registration-management.md §4-3
-- =============================================================================

USE study114;

SET NAMES utf8mb4;

ALTER TABLE study_rooms
  ADD COLUMN inquiry_status ENUM('open', 'paused', 'capacity_full', 'waiting_only')
    NOT NULL DEFAULT 'open'
    COMMENT '20장 상담 수용 상태'
    AFTER profile_status;

UPDATE study_rooms SET inquiry_status = 'open' WHERE id IN (1, 2);
UPDATE study_rooms SET inquiry_status = 'waiting_only' WHERE id = 3;

-- tutors — published_at (students·study_rooms 와 동일 패턴)
ALTER TABLE tutors
  ADD COLUMN published_at DATETIME NULL COMMENT '최초 공개 시각' AFTER profile_status;

UPDATE tutors SET published_at = updated_at WHERE profile_status = 'published' AND published_at IS NULL;

-- =============================================================================
-- study114 schema 017 — P17 고객센터 공지 · 운영 문의 티켓
-- Apply AFTER 016_registration_hub.sql
-- =============================================================================

USE study114;

SET NAMES utf8mb4;

CREATE TABLE support_notices (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  notice_key      VARCHAR(50) NOT NULL,
  notice_date     DATE NOT NULL,
  title           VARCHAR(200) NOT NULL,
  body_json       JSON NOT NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_support_notices_key (notice_key),
  KEY idx_support_notices_date (notice_date, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='고객센터 공지';

CREATE TABLE support_tickets (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  ticket_no       VARCHAR(30) NOT NULL,
  email           VARCHAR(190) NOT NULL,
  category        ENUM('bug', 'policy', 'account', 'other') NOT NULL,
  role_type       ENUM('guest', 'parent', 'study_room', 'tutor') NOT NULL DEFAULT 'guest',
  body            TEXT NOT NULL,
  status          ENUM('open', 'in_progress', 'closed') NOT NULL DEFAULT 'open',
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_support_tickets_no (ticket_no),
  KEY idx_support_tickets_email (email),
  KEY idx_support_tickets_status (status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='고객센터 운영 문의 티켓';

INSERT INTO support_notices (notice_key, notice_date, title, body_json) VALUES
  (
    'notice-001',
    '2026-07-01',
    '고객센터·안전과외 가이드 1차 오픈 (프리뷰)',
    JSON_ARRAY(
      '고객센터 좌측 메뉴·게시판형 FAQ/공지·안전과외 아코디언 UI를 프리뷰에 반영했습니다.',
      '1차는 정적 콘텐츠이며, 후순위에 관리자 게시판 연동 예정입니다.'
    )
  ),
  (
    'notice-002',
    '2026-06-15',
    '쪽지함 프리뷰(16a) 안내',
    JSON_ARRAY(
      '회원 간 공식 접촉은 쪽지함(16장)을 이용합니다.',
      '운영 문의는 고객센터 운영 문의 채널과 별도입니다.'
    )
  );

-- =============================================================================
-- study114 schema 018 — 소셜 로그인 (네이버 · 카카오 · 구글)
-- Apply AFTER 004_member_ssot_align.sql
-- =============================================================================

USE study114;

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS user_oauth_accounts (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id           BIGINT UNSIGNED NOT NULL,
  provider          ENUM('naver', 'kakao', 'google') NOT NULL,
  provider_user_id  VARCHAR(128)    NOT NULL COMMENT '공급자 고유 ID',
  provider_email    VARCHAR(255)    NULL,
  profile_json      JSON            NULL COMMENT '원본 프로필 스냅샷(참고)',
  linked_at         DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_oauth_provider_user (provider, provider_user_id),
  KEY idx_oauth_user (user_id),
  CONSTRAINT fk_oauth_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='소셜 로그인 연동 (한국 3축)';

-- =============================================================================
-- study114 schema 019 — 소셜 신규 가입 회원구분 대기
-- Apply AFTER 018_user_oauth_accounts.sql
-- =============================================================================

USE study114;

SET NAMES utf8mb4;

ALTER TABLE users
  ADD COLUMN oauth_role_pending TINYINT(1) NOT NULL DEFAULT 0
    COMMENT 'oauth signup role pick pending'
    AFTER email_verified_at;

-- =============================================================================
-- study114 schema 020 — 인증 토큰 (비밀번호 재설정 · 이메일 인증)
-- Apply AFTER 019_oauth_role_pending.sql
-- SSOT: 9장 부록 §16-2 · §16-5
-- =============================================================================

USE study114;

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS auth_tokens (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id     BIGINT UNSIGNED NOT NULL,
  token_hash  CHAR(64)        NOT NULL COMMENT 'SHA-256 hex',
  purpose     ENUM('password_reset', 'email_verify') NOT NULL,
  expires_at  DATETIME        NOT NULL,
  used_at     DATETIME        NULL,
  created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_auth_token_hash (token_hash),
  KEY idx_auth_tokens_user_purpose (user_id, purpose),
  KEY idx_auth_tokens_expires (expires_at),
  CONSTRAINT fk_auth_tokens_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='일회성 인증 토큰';

-- =============================================================================
-- study114 schema 021 — P23 게시판 엔진 (board_posts)
-- Apply AFTER 020_auth_policy_tokens.sql
-- =============================================================================

SET NAMES utf8mb4;

CREATE TABLE board_posts (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  board_key       VARCHAR(50) NOT NULL,
  post_key        VARCHAR(80) NOT NULL,
  author_user_id  BIGINT UNSIGNED NULL,
  author_role     ENUM('guest', 'parent', 'study_room', 'tutor', 'admin', 'system') NOT NULL DEFAULT 'system',
  status          ENUM('draft', 'submitted', 'published', 'hidden') NOT NULL DEFAULT 'draft',
  title           VARCHAR(200) NOT NULL,
  description     TEXT NULL,
  memo            TEXT NULL,
  category_id     VARCHAR(50) NULL,
  file_label      VARCHAR(255) NULL,
  meta_json       JSON NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_board_posts_key (board_key, post_key),
  KEY idx_board_posts_board (board_key, status, updated_at),
  KEY idx_board_posts_author (board_key, author_role, updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='게시판 엔진 통합 게시물 (다운로드형·제출형)';

INSERT INTO board_posts (board_key, post_key, author_role, status, title, description, file_label, meta_json) VALUES
  (
    'library',
    'lib-1',
    'system',
    'published',
    '안전과외 체크리스트 (학부모용)',
    '첫 상담 전 확인할 질문 목록',
    'safe-prep-checklist.pdf',
    JSON_OBJECT('format', 'PDF', 'section', 'library', 'audience', JSON_ARRAY('all', 'parent'))
  ),
  (
    'library',
    'lib-2',
    'system',
    'published',
    '공부방 상담 수용 안내 템플릿',
    '상담 가능·정원 마감 안내 문구 예시',
    'room-inquiry-template.docx',
    JSON_OBJECT('format', 'DOCX', 'section', 'library', 'audience', JSON_ARRAY('study_room'))
  ),
  (
    'library-template',
    'tpl-1',
    'system',
    'published',
    '과외 첫 수업 안내 양식',
    '학부모·학생에게 보낼 첫 안내 메모',
    'tutor-first-lesson.hwp',
    JSON_OBJECT('format', 'HWP', 'section', 'templates', 'audience', JSON_ARRAY('tutor'))
  ),
  (
    'library-template',
    'tpl-2',
    'system',
    'published',
    '학습 요청 조건 정리표',
    '자녀 등록 전 희망 조건 메모용',
    'student-request-sheet.xlsx',
    JSON_OBJECT('format', 'XLSX', 'section', 'templates', 'audience', JSON_ARRAY('parent'))
  ),
  (
    'library-guide-pdf',
    'pdf-1',
    'system',
    'published',
    '안전과외 가이드 — 선지급 주의 (PDF)',
    'P17-03 safe/prepay 요약본',
    'safe-prepay-guide.pdf',
    JSON_OBJECT('format', 'PDF', 'section', 'guides', 'audience', JSON_ARRAY('all'))
  ),
  (
    'library-guide-pdf',
    'pdf-2',
    'system',
    'published',
    '제출자료 안내 — 발급기관 재확인',
    '22·28장 톤 · 플랫폼 인증 아님',
    'submission-doc-notice.pdf',
    JSON_OBJECT('format', 'PDF', 'section', 'guides', 'audience', JSON_ARRAY('study_room', 'tutor'))
  );

INSERT INTO board_posts (board_key, post_key, author_role, status, title, description, category_id, file_label, memo, created_at, updated_at) VALUES
  (
    'submission',
    'sub-seed-1',
    'tutor',
    'published',
    '학력 증명서 사본',
    '과외 프로필 등록 시 참고용으로 제출한 학력 증빙입니다.',
    'education',
    'education-cert.pdf',
    'tutor-ui 등록과 동일 항목',
    '2026-06-20 00:00:00',
    NOW()
  ),
  (
    'submission',
    'sub-seed-2',
    'tutor',
    'submitted',
    '경력 확인 서류',
    '경력 항목 보완용 첨부.',
    'education',
    'career-proof.jpg',
    '',
    NOW(),
    NOW()
  ),
  (
    'submission',
    'sub-seed-room-1',
    'study_room',
    'published',
    '시설 안전 점검 체크리스트',
    '공부방 시설 안전 점검 기록.',
    'facility',
    'safety-checklist.pdf',
    '',
    '2026-06-15 00:00:00',
    NOW()
  );

-- =============================================================================
-- study114 schema 022 — A28 운영 로그 · 제출자료 내부 확인
-- Apply AFTER 021_board_engine.sql
-- =============================================================================

SET NAMES utf8mb4;

ALTER TABLE board_posts
  ADD COLUMN internal_memo TEXT NULL COMMENT 'A28 내부 메모 (사용자 미노출)' AFTER memo;

CREATE TABLE admin_operation_logs (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  log_key         VARCHAR(40) NOT NULL,
  acted_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  operator_id     VARCHAR(100) NOT NULL,
  target_type     VARCHAR(50) NOT NULL,
  target_id       VARCHAR(100) NOT NULL,
  action_kind     VARCHAR(50) NOT NULL,
  reason_category VARCHAR(50) NULL,
  detail_memo     TEXT NULL,
  reversible      TINYINT(1) NOT NULL DEFAULT 1,
  revert_history  JSON NULL,
  user_notified   TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uq_admin_operation_logs_key (log_key),
  KEY idx_admin_logs_target (target_type, target_id, acted_at),
  KEY idx_admin_logs_acted (acted_at, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='A28 운영 조치 로그 (28§9)';

-- =============================================================================
-- study114 schema 023 — 외부 홍보 링크 (facebook · instagram)
-- youtube_url 은 009/010 에 이미 존재
-- Apply AFTER 022_admin_ops.sql
-- =============================================================================

SET NAMES utf8mb4;

ALTER TABLE study_rooms
  ADD COLUMN facebook_url VARCHAR(500) NULL COMMENT '상세등록 Facebook URL 1개' AFTER youtube_url,
  ADD COLUMN instagram_url VARCHAR(500) NULL COMMENT '상세등록 Instagram URL 1개' AFTER facebook_url;

ALTER TABLE tutors
  ADD COLUMN facebook_url VARCHAR(500) NULL COMMENT '상세등록 Facebook URL 1개' AFTER youtube_url,
  ADD COLUMN instagram_url VARCHAR(500) NULL COMMENT '상세등록 Instagram URL 1개' AFTER facebook_url;

-- =============================================================================
-- study114 schema 024 — A28-04 신고 처리 큐
-- Apply AFTER 023_promo_social_links.sql
-- =============================================================================

SET NAMES utf8mb4;

CREATE TABLE admin_reports (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  report_key      VARCHAR(30) NOT NULL,
  kind            VARCHAR(50) NOT NULL,
  target_type     VARCHAR(50) NOT NULL,
  target_id       VARCHAR(100) NOT NULL,
  target_label    VARCHAR(200) NULL,
  reason          TEXT NOT NULL,
  status          ENUM('open', 'protect', 'resolved', 'dismissed') NOT NULL DEFAULT 'open',
  internal_memo   TEXT NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_admin_reports_key (report_key),
  KEY idx_admin_reports_status (status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='A28 신고 처리 큐 (문의 티켓과 분리)';

INSERT INTO admin_reports (report_key, kind, target_type, target_id, target_label, reason, status, created_at) VALUES
  ('RPT-101', '허위 정보', 'tutor', '12', 'tutor #12', '활동 지역 불일치 신고', 'open', '2026-07-05 10:00:00'),
  ('RPT-102', '안전 이슈', 'thread', '8', 'thread #8', '부적절 접촉 의심', 'protect', '2026-07-06 14:30:00');

-- =============================================================================
-- study114 schema 025 — submission 보드 첨부 (board_post_attachments)
-- Apply AFTER 024_admin_reports.sql
-- =============================================================================

SET NAMES utf8mb4;

CREATE TABLE board_post_attachments (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  board_key       VARCHAR(50) NOT NULL,
  post_key        VARCHAR(80) NOT NULL,
  attachment_key  VARCHAR(40) NOT NULL DEFAULT 'primary',
  original_name   VARCHAR(255) NOT NULL,
  storage_path    VARCHAR(500) NOT NULL COMMENT 'attachments_root 기준 상대경로',
  mime_type       VARCHAR(100) NOT NULL,
  size_bytes      INT UNSIGNED NOT NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_board_post_attachment (board_key, post_key, attachment_key),
  KEY idx_board_post_attachments_post (board_key, post_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='게시판 첨부 (1차: submission primary 1개)';

-- =============================================================================
-- study114 schema 026 — admin dev operator (A28 운영자 로컬 검증)
-- Apply AFTER 025_board_post_attachments.sql
-- =============================================================================

SET NAMES utf8mb4;

-- bcrypt for dev password "password" (Laravel test hash)
SET @pw := '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';

INSERT INTO users (email, password_hash, status) VALUES
  ('ops@dev.local', @pw, 'active');

INSERT INTO user_profiles (user_id, real_name, gender, birth_date, phone, address_line1) VALUES
  (LAST_INSERT_ID(), '내부운영', 'male', '1985-01-01', '010-9999-0001', '내부');

INSERT INTO user_roles (user_id, role_type, is_primary, status)
SELECT id, 'admin', 1, 'active' FROM users WHERE email = 'ops@dev.local' LIMIT 1;

-- =============================================================================
-- study114 schema 027 — 18a P18-02 ROI (조회·찜·비교 담김)
-- Apply AFTER 026_admin_dev_seed.sql
-- SSOT: docs/ssot/18-paid-services-rough.md §6 · P18-02
-- =============================================================================

USE study114;

SET NAMES utf8mb4;

-- ---------------------------------------------------------------------------
-- provider_profile_views — 공급자 프로필 조회 (ROI views)
-- ---------------------------------------------------------------------------
CREATE TABLE provider_profile_views (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  target_type     ENUM('study_room', 'tutor') NOT NULL,
  target_id       BIGINT UNSIGNED NOT NULL,
  viewer_user_id  BIGINT UNSIGNED NULL COMMENT '비로그인 NULL',
  viewed_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_ppviews_target_time (target_type, target_id, viewed_at),
  KEY idx_ppviews_viewer (viewer_user_id, viewed_at),
  CONSTRAINT fk_ppviews_viewer
    FOREIGN KEY (viewer_user_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='18a · P18-02 조회 — user_recent_views와 별도 집계';

-- dev: 기존 최근열람에서 study_room/tutor view_detail 백필
INSERT INTO provider_profile_views (target_type, target_id, viewer_user_id, viewed_at)
SELECT target_type, target_id, user_id, viewed_at
FROM user_recent_views
WHERE target_type IN ('study_room', 'tutor')
  AND last_action = 'view_detail';

-- =============================================================================
-- study114 schema 028 — 18b 횟수권 · 기간형 포지션
-- Apply AFTER 027_provider_roi.sql
-- SSOT: 18§19 · 18b
-- =============================================================================

USE study114;

SET NAMES utf8mb4;

-- ---------------------------------------------------------------------------
-- provider_ticket_packs — 쪽지권 · 요청문 열람권 (FIFO · 6개월)
-- ---------------------------------------------------------------------------
CREATE TABLE provider_ticket_packs (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id         BIGINT UNSIGNED NOT NULL,
  ticket_type     ENUM('memo', 'request_view') NOT NULL,
  pack_size       INT UNSIGNED    NOT NULL COMMENT '구매 당시 회차',
  remaining       INT UNSIGNED    NOT NULL,
  purchased_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at      DATETIME        NOT NULL,
  source          VARCHAR(32)     NOT NULL DEFAULT 'manual' COMMENT 'manual | payment | migration',
  PRIMARY KEY (id),
  KEY idx_ticket_packs_user (user_id, ticket_type, expires_at, id),
  CONSTRAINT fk_ticket_packs_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='18b · 횟수권 묶음';

-- ---------------------------------------------------------------------------
-- provider_position_subscriptions — Prime / Pick 기간형
-- ---------------------------------------------------------------------------
CREATE TABLE provider_position_subscriptions (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id         BIGINT UNSIGNED NOT NULL,
  sku_code        ENUM('prime', 'pick') NOT NULL,
  period_days     INT UNSIGNED    NOT NULL,
  starts_at       DATETIME        NOT NULL,
  ends_at         DATETIME        NOT NULL,
  source          VARCHAR(32)     NOT NULL DEFAULT 'manual',
  created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_position_user_ends (user_id, ends_at),
  CONSTRAINT fk_position_subs_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='18b · Prime/Pick 기간형';

-- dev: 기존 memo_credits → 쪽지권 팩 (6개월)
INSERT INTO provider_ticket_packs (user_id, ticket_type, pack_size, remaining, purchased_at, expires_at, source)
SELECT user_id, 'memo', memo_credits, memo_credits, NOW(), DATE_ADD(NOW(), INTERVAL 6 MONTH), 'migration'
FROM provider_entitlements
WHERE memo_credits > 0;

-- dev: tutor-owner1 (user 4) — 쪽지권 5회 · Pick 2주
INSERT INTO provider_ticket_packs (user_id, ticket_type, pack_size, remaining, purchased_at, expires_at, source)
VALUES (4, 'memo', 5, 5, NOW(), DATE_ADD(NOW(), INTERVAL 6 MONTH), 'manual');

INSERT INTO provider_position_subscriptions (user_id, sku_code, period_days, starts_at, ends_at, source)
VALUES (4, 'pick', 14, NOW(), DATE_ADD(NOW(), INTERVAL 14 DAY), 'manual');

-- dev: @dev.local 계정 이메일 인증 완료 (E2E·로컬 행동 게이트)
USE study114;

UPDATE users
SET email_verified_at = COALESCE(email_verified_at, NOW()),
    updated_at = NOW()
WHERE email LIKE '%@dev.local'
  AND status = 'active';

-- =============================================================================
-- study114 schema 030 — 18c 요청문 열람 잠금 해제 (학생당 1회 차감)
-- Apply AFTER 029_dev_email_verified.sql
-- SSOT: 18§19 · 13§8
-- =============================================================================

USE study114;

SET NAMES utf8mb4;

CREATE TABLE provider_request_unlocks (
  id                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  provider_user_id   BIGINT UNSIGNED NOT NULL,
  student_id         BIGINT UNSIGNED NOT NULL,
  unlocked_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_provider_student_unlock (provider_user_id, student_id),
  KEY idx_unlock_student (student_id),
  CONSTRAINT fk_request_unlock_provider
    FOREIGN KEY (provider_user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_request_unlock_student
    FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='18c · paid_only 요청문 학생당 1회 열람';

-- dev: tutor-owner1 (user 4) — 요청문 열람권 5회
INSERT INTO provider_ticket_packs (user_id, ticket_type, pack_size, remaining, purchased_at, expires_at, source)
VALUES (4, 'request_view', 5, 5, NOW(), DATE_ADD(NOW(), INTERVAL 6 MONTH), 'manual');

-- dev: student 1 — paid_only 요청문 (P24 · E2E)
UPDATE students
SET request_summary_visibility = 'paid_only',
    request_summary = COALESCE(NULLIF(request_summary, ''), '주 2회 저녁, 내신 대비 희망')
WHERE id = 1;

-- =============================================================================
-- study114 schema 031 — 18d PG 더미 주문 (dev mock)
-- Apply AFTER 030_provider_request_unlocks.sql
-- SSOT: 18§12 · 18b
-- =============================================================================

USE study114;

SET NAMES utf8mb4;

CREATE TABLE provider_payment_orders (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id         BIGINT UNSIGNED NOT NULL,
  order_ref       VARCHAR(36)     NOT NULL,
  product_id      VARCHAR(32)     NOT NULL,
  variant_label   VARCHAR(32)     NOT NULL,
  product_kind    ENUM('position', 'count', 'badge_addon') NOT NULL,
  amount_won      INT UNSIGNED    NOT NULL DEFAULT 10,
  status          ENUM('pending', 'paid', 'failed', 'cancelled') NOT NULL DEFAULT 'pending',
  pg_provider     VARCHAR(32)     NOT NULL DEFAULT 'dev_mock',
  created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  paid_at         DATETIME        NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_payment_order_ref (order_ref),
  KEY idx_payment_orders_user (user_id, created_at DESC),
  CONSTRAINT fk_payment_orders_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='18d · PG 더미 주문';

-- 18d — 만료·소진 시스템 안내 (온사이트 · 발송 dedupe)

CREATE TABLE provider_system_notices (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id      BIGINT UNSIGNED NOT NULL,
  notice_kind  VARCHAR(64)     NOT NULL COMMENT 'position_expiry_7d · memo_remaining_1 등',
  dedupe_key   VARCHAR(191)    NOT NULL,
  title        VARCHAR(200)    NOT NULL,
  body         TEXT            NOT NULL,
  action_href  VARCHAR(500)    NULL,
  is_read      TINYINT(1)      NOT NULL DEFAULT 0,
  created_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_provider_notice_dedupe (dedupe_key),
  KEY idx_provider_notice_user (user_id, is_read, created_at),
  CONSTRAINT fk_provider_notice_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='15§1-1 시스템 안내 · 유료 만료·소진';

CREATE TABLE provider_reminder_dispatches (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id        BIGINT UNSIGNED NOT NULL,
  channel        ENUM('email','sms','onsite') NOT NULL,
  reminder_kind  VARCHAR(64)     NOT NULL,
  dedupe_key     VARCHAR(191)    NOT NULL,
  sent_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_provider_dispatch_dedupe (dedupe_key),
  KEY idx_provider_dispatch_user (user_id, sent_at),
  CONSTRAINT fk_provider_dispatch_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='메일·문자·온사이트 중복 발송 방지';

-- =============================================================================
-- study114 schema 033 — 공부방 대표 좌표 (지도 1차 · 부록 지도 API)
-- Apply AFTER 012_search_dev_seed.sql
-- =============================================================================

USE study114;

UPDATE study_rooms SET latitude = 37.4965, longitude = 127.0602 WHERE id = 1;
UPDATE study_rooms SET latitude = 35.1638, longitude = 129.1641 WHERE id = 2;
UPDATE study_rooms SET latitude = 35.1698, longitude = 129.1318 WHERE id = 3;

