-- =============================================================================
-- study114 schema 004 — member DB SSOT align (4장)
-- Apply AFTER 001_init.sql (+ 002 if already applied)
--
-- ⚠️ students 테이블은 001과 구조가 다릅니다. 운영 DB가 있으면 백업 후 적용.
-- Usage:
--   mysql -u root -p study114 < sql/schema/004_member_ssot_align.sql
-- =============================================================================

USE study114;

-- ---------------------------------------------------------------------------
-- users — status enum · deleted_at (4장 §4)
-- ---------------------------------------------------------------------------
ALTER TABLE users
  MODIFY COLUMN status ENUM('active', 'pending', 'blocked', 'withdrawn') NOT NULL DEFAULT 'active',
  ADD COLUMN deleted_at DATETIME NULL COMMENT '탈퇴/비활성 추적' AFTER updated_at;

-- ---------------------------------------------------------------------------
-- user_profiles — 4장 §5 컬럼 정합
-- (002 적용済み 가정: gender, birth_date, address, sms_consent 등 존재)
-- ---------------------------------------------------------------------------
ALTER TABLE user_profiles
  CHANGE COLUMN name real_name VARCHAR(50) NOT NULL COMMENT '실명',
  CHANGE COLUMN address address_line1 VARCHAR(255) NULL COMMENT '기본 주소 (1차 UI address)',
  ADD COLUMN address_zip VARCHAR(10) NULL COMMENT '우편번호' AFTER birth_date,
  ADD COLUMN address_line2 VARCHAR(255) NULL COMMENT '상세 주소' AFTER address_line1,
  ADD COLUMN default_region_id BIGINT UNSIGNED NULL COMMENT '기본 동 FK' AFTER address_line2,
  ADD COLUMN default_complex_id BIGINT UNSIGNED NULL COMMENT '기본 단지 FK' AFTER default_region_id,
  CHANGE COLUMN sms_consent sms_opt_in TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'SMS 수신',
  CHANGE COLUMN email_consent email_opt_in TINYINT(1) NOT NULL DEFAULT 0 COMMENT '이메일 수신',
  CHANGE COLUMN safe_number_use safe_number_opt_in TINYINT(1) NOT NULL DEFAULT 0 COMMENT '안전번호 확장';

-- FK (regions/complexes 존재 시)
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
-- students — 4장 §7 전면 재정의 (001 단순 스키마 대체)
-- ---------------------------------------------------------------------------
DROP TABLE IF EXISTS student_subject_targets;
DROP TABLE IF EXISTS students;

CREATE TABLE students (
  id                              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  guardian_user_id                BIGINT UNSIGNED NOT NULL COMMENT '학부모 users.id',
  student_name                    VARCHAR(50)     NOT NULL COMMENT '원본 이름 비공개',
  public_display_name             VARCHAR(50)     NULL COMMENT '블라인드 공개명',
  request_title                   VARCHAR(200)    NULL,
  request_summary                 TEXT            NULL,
  gender                          ENUM('male', 'female') NULL,
  birth_year                      SMALLINT        NULL,
  school_name                     VARCHAR(100)    NULL,
  grade_level                     VARCHAR(20)     NULL,
  school_track                    VARCHAR(50)     NULL,
  preferred_lesson_type           ENUM('study_room', 'tutor') NULL,
  preferred_region_id             BIGINT UNSIGNED NULL,
  preferred_complex_id            BIGINT UNSIGNED NULL,
  preferred_tutor_gender          ENUM('male', 'female', 'any') NULL,
  preferred_fee_amount            INT UNSIGNED    NULL,
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
  sort_order                      TINYINT UNSIGNED NOT NULL DEFAULT 0,
  created_at                      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at                      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_students_guardian (guardian_user_id, sort_order),
  KEY idx_students_exposure (exposure_status, published_at),
  KEY idx_students_preferred_region (preferred_region_id),
  KEY idx_students_preferred_complex (preferred_complex_id),
  CONSTRAINT fk_students_guardian FOREIGN KEY (guardian_user_id) REFERENCES users (id),
  CONSTRAINT fk_students_preferred_region FOREIGN KEY (preferred_region_id) REFERENCES regions (id),
  CONSTRAINT fk_students_preferred_complex FOREIGN KEY (preferred_complex_id) REFERENCES complexes (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='학부모 소속 자녀 + 과외등록 (4장)';

CREATE TABLE student_subject_targets (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  student_id   BIGINT UNSIGNED NOT NULL,
  school_level ENUM('preschool', 'elementary', 'middle', 'high', 'general', 'other') NOT NULL,
  subject_name VARCHAR(50)     NOT NULL,
  is_primary   TINYINT(1)      NOT NULL DEFAULT 0,
  created_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_sst_student (student_id),
  KEY idx_sst_subject (subject_name, school_level),
  CONSTRAINT fk_sst_student FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='학생 희망과목 (4장)';
