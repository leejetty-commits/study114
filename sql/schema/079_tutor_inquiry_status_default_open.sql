-- =============================================================================
-- 079 — 새 과외쌤의 쪽지 수신 처음 값을 open(쪽지 받음)으로 (2026-10-14 종현 결정)
-- Actions는 이 SQL을 실행하지 않는다. 운영 phpMyAdmin에서 적용한다.
-- 앞으로 새로 생기는 tutors 행의 기본값만 바뀐다. 이미 있는 과외쌤의 값은 그대로다.
-- 선행: 064_tutor_inquiry_status.sql (inquiry_status 컬럼)
-- =============================================================================

USE study114;

SET NAMES utf8mb4;

ALTER TABLE tutors
  MODIFY COLUMN inquiry_status ENUM('open','paused','not_accepting') NOT NULL DEFAULT 'open'
  COMMENT '과외쌤 쪽지 수신: open=받는 중(기본), paused=잠시 쉼(일시 중단), not_accepting=신규 학생 안 받음(신규 모집 닫힘)';
