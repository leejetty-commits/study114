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
