-- =============================================================================
-- study114 schema 038 — dual-capability admin (시장 역할 유지 + admin_level)
-- 닷홈: DualCapabilityAdminMigrateService / health migrate-038 로 적용
-- =============================================================================
-- 정책:
--   1) users.admin_level = super_admin
--   2) 시장 역할 is_primary=1 유지 (study_room_owner / tutor / guardian_student)
--   3) admin role 은 is_primary=0 (secondary)
--   4) oauth 내부 auth email 변경 금지 — 표시명만 정리
-- =============================================================================

SET NAMES utf8mb4;

-- 적용은 PHP 서비스가 멱등 처리 (계정 존재 확인 · provider 유지)
SELECT '038 dual-capability admin — apply via DualCapabilityAdminMigrateService' AS note;
