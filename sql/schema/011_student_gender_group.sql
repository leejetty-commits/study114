-- =============================================================================
-- study114 schema 011 — students.student_gender_group (13장 §5 · §6)
-- Apply AFTER 004_member_ssot_align.sql
-- 그룹과외 선택 시 남/여/남여 구성 — students.gender 와 별도
-- =============================================================================

USE study114;

ALTER TABLE students
  ADD COLUMN student_gender_group ENUM('male', 'female', 'mixed') NULL
    COMMENT '그룹과외 시 희망 구성 (남/여/남여)' AFTER lesson_format;
