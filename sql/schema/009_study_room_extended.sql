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
