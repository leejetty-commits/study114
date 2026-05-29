-- =============================================================================
-- study114 initial schema (DDL only)
-- MySQL 8.x | utf8mb4 | PHP 8.2 project
--
-- Scope:
--   members, regions, study rooms (+ images, subject targets, facilities)
-- Tutor schema: deferred (see TODO at bottom)
--
-- Usage:
--   mysql -u root -p < sql/schema/001_init.sql
-- =============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE DATABASE IF NOT EXISTS study114
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE study114;

-- ---------------------------------------------------------------------------
-- 5) regions — 행정동 마스터
-- ---------------------------------------------------------------------------
CREATE TABLE regions (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  sido_code     VARCHAR(10)     NOT NULL COMMENT '시도 코드',
  sido_name     VARCHAR(50)     NOT NULL,
  sigungu_code  VARCHAR(10)     NOT NULL COMMENT '시군구 코드',
  sigungu_name  VARCHAR(50)     NOT NULL,
  dong_code     VARCHAR(10)     NOT NULL COMMENT '동 코드',
  dong_name     VARCHAR(50)     NOT NULL,
  is_active     TINYINT(1)      NOT NULL DEFAULT 1,
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_regions_dong_code (dong_code),
  KEY idx_regions_sigungu (sigungu_code),
  KEY idx_regions_sido (sido_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='행정동 단위 지역 마스터';

-- ---------------------------------------------------------------------------
-- 6) complexes — 아파트·단지 (단지 우선, 없으면 동)
-- ---------------------------------------------------------------------------
CREATE TABLE complexes (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  region_id     BIGINT UNSIGNED NOT NULL COMMENT '소속 동(FK)',
  name          VARCHAR(100)    NOT NULL,
  address       VARCHAR(255)    NULL,
  is_active     TINYINT(1)      NOT NULL DEFAULT 1,
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_complexes_region (region_id),
  KEY idx_complexes_name (name),
  CONSTRAINT fk_complexes_region
    FOREIGN KEY (region_id) REFERENCES regions (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='아파트·단지 마스터';

-- ---------------------------------------------------------------------------
-- 1) users — 공통 회원 (학부모 기준, 학생/학부모 통합 축)
-- ---------------------------------------------------------------------------
CREATE TABLE users (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email             VARCHAR(255)    NOT NULL,
  password_hash     VARCHAR(255)    NOT NULL,
  status            ENUM('active', 'inactive', 'withdrawn') NOT NULL DEFAULT 'active',
  email_verified_at DATETIME        NULL,
  last_login_at     DATETIME        NULL,
  created_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_users_email (email),
  KEY idx_users_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='회원 계정 (1차 가입 주체: 학부모)';

-- ---------------------------------------------------------------------------
-- 2) user_profiles — 기본 주소 / 활동 주소 분리
-- ---------------------------------------------------------------------------
CREATE TABLE user_profiles (
  user_id                 BIGINT UNSIGNED NOT NULL,
  name                    VARCHAR(50)     NOT NULL,
  phone                   VARCHAR(20)     NULL,
  phone_verified_at       DATETIME        NULL,
  -- 기본 주소 (거주)
  home_region_id          BIGINT UNSIGNED NULL COMMENT '거주 동',
  home_complex_id         BIGINT UNSIGNED NULL COMMENT '거주 단지 (있으면 단지 우선)',
  home_address_detail     VARCHAR(255)    NULL COMMENT '거주 상세주소',
  -- 활동 주소
  activity_region_id      BIGINT UNSIGNED NULL COMMENT '활동 동',
  activity_complex_id     BIGINT UNSIGNED NULL COMMENT '활동 단지 (있으면 단지 우선)',
  activity_address_detail VARCHAR(255)    NULL COMMENT '활동 상세주소',
  created_at              DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at              DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  KEY idx_user_profiles_home_region (home_region_id),
  KEY idx_user_profiles_home_complex (home_complex_id),
  KEY idx_user_profiles_activity_region (activity_region_id),
  KEY idx_user_profiles_activity_complex (activity_complex_id),
  CONSTRAINT fk_user_profiles_user
    FOREIGN KEY (user_id) REFERENCES users (id),
  CONSTRAINT fk_user_profiles_home_region
    FOREIGN KEY (home_region_id) REFERENCES regions (id),
  CONSTRAINT fk_user_profiles_home_complex
    FOREIGN KEY (home_complex_id) REFERENCES complexes (id),
  CONSTRAINT fk_user_profiles_activity_region
    FOREIGN KEY (activity_region_id) REFERENCES regions (id),
  CONSTRAINT fk_user_profiles_activity_complex
    FOREIGN KEY (activity_complex_id) REFERENCES complexes (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='회원 프로필 (기본·활동 주소 분리)';

-- ---------------------------------------------------------------------------
-- 3) user_roles — 복수 역할 (공부방·과외 동시 가능, tutor는 추후 사용)
-- ---------------------------------------------------------------------------
CREATE TABLE user_roles (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id    BIGINT UNSIGNED NOT NULL,
  role       ENUM('member', 'study_room_owner', 'tutor') NOT NULL,
  granted_at DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_user_roles (user_id, role),
  KEY idx_user_roles_role (role),
  CONSTRAINT fk_user_roles_user
    FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='회원 역할';

-- ---------------------------------------------------------------------------
-- 4) students — 학부모 1명 아래 자녀 N명 (별도 로그인 없음)
-- ---------------------------------------------------------------------------
CREATE TABLE students (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id      BIGINT UNSIGNED NOT NULL COMMENT '보호자(학부모) users.id',
  name         VARCHAR(50)     NOT NULL,
  school_level ENUM('elementary', 'middle', 'high', 'other') NOT NULL,
  grade        TINYINT UNSIGNED NULL COMMENT '학년 (학교급별 1~6 등)',
  school_name  VARCHAR(100)    NULL,
  sort_order   TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '자녀 표시 순서',
  created_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_students_user (user_id, sort_order),
  CONSTRAINT fk_students_user
    FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='학부모 소속 자녀';

-- ---------------------------------------------------------------------------
-- 11) facility_masters — 공부방 시설 체크형 마스터
-- ---------------------------------------------------------------------------
CREATE TABLE facility_masters (
  id         SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code       VARCHAR(50)       NOT NULL,
  label      VARCHAR(100)      NOT NULL,
  sort_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  is_active  TINYINT(1)        NOT NULL DEFAULT 1,
  created_at DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_facility_masters_code (code),
  KEY idx_facility_masters_active (is_active, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='공부방 시설·환경 마스터 (체크형)';

-- ---------------------------------------------------------------------------
-- 7) study_rooms — 공부방 본문
--    지역은 study_room_regions(최대 3)로 관리
--    시설 자유기술: facility_note / 체크: study_room_facilities
-- ---------------------------------------------------------------------------
CREATE TABLE study_rooms (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id           BIGINT UNSIGNED NOT NULL COMMENT '등록 회원(운영자)',
  name              VARCHAR(100)    NOT NULL COMMENT '공부방명',
  description       TEXT            NULL COMMENT '소개',
  price_amount      INT UNSIGNED    NULL COMMENT '월 기준 대표 금액(원)',
  price_description VARCHAR(255)    NULL COMMENT '설명형 가격 텍스트',
  facility_note     TEXT            NULL COMMENT '시설·환경 자유기술',
  address_detail    VARCHAR(255)    NULL COMMENT '공부방 상세주소 (노출 정책은 앱에서 결정)',
  contact_phone     VARCHAR(20)     NULL,
  status            ENUM('draft', 'published', 'hidden', 'closed') NOT NULL DEFAULT 'draft',
  published_at      DATETIME        NULL,
  created_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at        DATETIME        NULL,
  PRIMARY KEY (id),
  KEY idx_study_rooms_user (user_id),
  KEY idx_study_rooms_status_published (status, published_at),
  KEY idx_study_rooms_price (status, price_amount),
  CONSTRAINT fk_study_rooms_user
    FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='공부방';

-- ---------------------------------------------------------------------------
-- 8) study_room_regions — 공부방 노출·검색 지역 (공부방당 최대 3건)
--    complex_id 있음 → 단지 우선 / 없음 → region_id(동) 기준
-- ---------------------------------------------------------------------------
CREATE TABLE study_room_regions (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  study_room_id BIGINT UNSIGNED NOT NULL,
  slot        TINYINT UNSIGNED NOT NULL COMMENT '1~3 (공부방당 최대 3개)',
  region_id   BIGINT UNSIGNED NOT NULL COMMENT '동 (필수)',
  complex_id  BIGINT UNSIGNED NULL COMMENT '단지 (선택, 있으면 우선)',
  created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_study_room_regions_slot (study_room_id, slot),
  KEY idx_study_room_regions_region (region_id),
  KEY idx_study_room_regions_complex (complex_id),
  KEY idx_study_room_regions_room (study_room_id),
  CONSTRAINT chk_study_room_regions_slot
    CHECK (slot BETWEEN 1 AND 3),
  CONSTRAINT fk_study_room_regions_room
    FOREIGN KEY (study_room_id) REFERENCES study_rooms (id) ON DELETE CASCADE,
  CONSTRAINT fk_study_room_regions_region
    FOREIGN KEY (region_id) REFERENCES regions (id),
  CONSTRAINT fk_study_room_regions_complex
    FOREIGN KEY (complex_id) REFERENCES complexes (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='공부방-지역 매핑 (최대 3)';

-- ---------------------------------------------------------------------------
-- 9) study_room_subject_targets — 공부방 대상 과목·학교급
-- ---------------------------------------------------------------------------
CREATE TABLE study_room_subject_targets (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  study_room_id BIGINT UNSIGNED NOT NULL,
  subject      VARCHAR(50)     NOT NULL COMMENT '과목 (예: math, english, 국어)',
  school_level ENUM('elementary', 'middle', 'high', 'other') NULL COMMENT '대상 학교급',
  created_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_study_room_subject_targets (study_room_id, subject, school_level),
  KEY idx_study_room_subject_targets_subject (subject, school_level),
  CONSTRAINT fk_study_room_subject_targets_room
    FOREIGN KEY (study_room_id) REFERENCES study_rooms (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='공부방 대상 과목';

-- ---------------------------------------------------------------------------
-- 10) study_room_images — 공부방 이미지 (0~5장, sort_order 1~5)
-- ---------------------------------------------------------------------------
CREATE TABLE study_room_images (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  study_room_id     BIGINT UNSIGNED NOT NULL,
  sort_order        TINYINT UNSIGNED NOT NULL COMMENT '1~5',
  storage_path      VARCHAR(500)    NOT NULL COMMENT '저장 경로 또는 URL',
  original_filename VARCHAR(255)    NULL,
  created_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_study_room_images_order (study_room_id, sort_order),
  KEY idx_study_room_images_room (study_room_id),
  CONSTRAINT chk_study_room_images_sort
    CHECK (sort_order BETWEEN 1 AND 5),
  CONSTRAINT fk_study_room_images_room
    FOREIGN KEY (study_room_id) REFERENCES study_rooms (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='공부방 이미지 (최대 5장)';

-- ---------------------------------------------------------------------------
-- 12) study_room_facilities — 공부방 시설 체크형 (M:N)
-- ---------------------------------------------------------------------------
CREATE TABLE study_room_facilities (
  study_room_id BIGINT UNSIGNED   NOT NULL,
  facility_id   SMALLINT UNSIGNED NOT NULL,
  created_at    DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (study_room_id, facility_id),
  KEY idx_study_room_facilities_facility (facility_id),
  CONSTRAINT fk_study_room_facilities_room
    FOREIGN KEY (study_room_id) REFERENCES study_rooms (id) ON DELETE CASCADE,
  CONSTRAINT fk_study_room_facilities_facility
    FOREIGN KEY (facility_id) REFERENCES facility_masters (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='공부방-시설 선택 (체크형)';

-- ---------------------------------------------------------------------------
-- TODO: tutors schema (과외쌤 — 추후 확정)
--   예상 테이블: tutors, tutor_subjects, tutor_regions
--   user_roles.role = 'tutor' 는 위 스키마 확정 시 함께 사용
-- ---------------------------------------------------------------------------

SET FOREIGN_KEY_CHECKS = 1;
