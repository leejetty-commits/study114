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
