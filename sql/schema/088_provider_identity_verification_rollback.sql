-- =============================================================================
-- 088 rollback — 닷홈 phpMyAdmin 평문
-- information_schema·PREPARE 없음. 088을 적용한 DB에서 한 번만 실행한다.
-- 순서: 백업표로 inquiry_status 복구 → 기본값 MODIFY 원복 → UNIQUE 2개 DROP
--       → 5칸 DROP → 백업표 DROP
-- 복구는 백업된 행 중 아직 paused 인 것만 inquiry_status_was 로 되돌린다.
-- 088 이후 다른 값으로 바꾼 행은 그대로 둔다. 원래 paused 였던 행은 백업에 없다.
-- Actions는 실행하지 않는다. 다시 실행하면 인덱스·컬럼이 없어 실패한다.
-- =============================================================================

USE study114;

SET NAMES utf8mb4;

-- 1) 백업표 기준 inquiry_status 복구
UPDATE study_rooms sr
  INNER JOIN _088_backup_study_rooms_inquiry b ON b.id = sr.id
   SET sr.inquiry_status = b.inquiry_status_was
 WHERE sr.inquiry_status = 'paused';

UPDATE tutors t
  INNER JOIN _088_backup_tutors_inquiry b ON b.id = t.id
   SET t.inquiry_status = b.inquiry_status_was
 WHERE t.inquiry_status = 'paused';

-- 2) 기본값 원복 (067 공부방 open · 079 과외쌤 open)
ALTER TABLE study_rooms
  MODIFY COLUMN inquiry_status ENUM('open', 'paused', 'capacity_full', 'waiting_only')
    NOT NULL DEFAULT 'open'
    COMMENT '쪽지 수신 상태 (공개와 독립)';

ALTER TABLE tutors
  MODIFY COLUMN inquiry_status ENUM('open','paused','not_accepting') NOT NULL DEFAULT 'open'
  COMMENT '과외쌤 쪽지 수신: open=받는 중(기본), paused=잠시 쉼(일시 중단), not_accepting=신규 학생 안 받음(신규 모집 닫힘)';

-- 3) UNIQUE 2개 DROP
ALTER TABLE user_profiles
  DROP INDEX uq_user_profiles_identity_ci_hash,
  DROP INDEX uq_user_profiles_identity_tx_id;

-- 4) 5칸 DROP
ALTER TABLE user_profiles
  DROP COLUMN identity_name,
  DROP COLUMN identity_tx_id,
  DROP COLUMN identity_provider,
  DROP COLUMN identity_verified_at,
  DROP COLUMN identity_ci_hash;

-- 5) 백업표 DROP
DROP TABLE _088_backup_study_rooms_inquiry;
DROP TABLE _088_backup_tutors_inquiry;

SELECT '088 rollback: inquiry restored from backup; defaults open; identity columns dropped' AS migration_note;
