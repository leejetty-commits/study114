-- study114 schema verification (4·5장 SSOT)
USE study114;

SELECT 'study_rooms columns' AS check_group;
SHOW COLUMNS FROM study_rooms LIKE 'study_room_name';
SHOW COLUMNS FROM study_rooms LIKE 'profile_status';
SHOW COLUMNS FROM study_rooms LIKE 'region_id';

SELECT 'study_room_regions' AS check_group;
SHOW COLUMNS FROM study_room_regions LIKE 'is_primary';

SELECT 'study_room_subject_targets' AS check_group;
SHOW COLUMNS FROM study_room_subject_targets LIKE 'subject_name';
SHOW COLUMNS FROM study_room_subject_targets LIKE 'is_main';

SELECT 'facility_masters' AS check_group;
SHOW COLUMNS FROM facility_masters LIKE 'facility_code';
SELECT facility_code, facility_name FROM facility_masters ORDER BY sort_order;

SELECT 'user_roles' AS check_group;
SHOW COLUMNS FROM user_roles LIKE 'role_type';

SELECT 'handoff basket (25§부록 B)' AS check_group;
SHOW TABLES LIKE 'user_favorites';
SHOW TABLES LIKE 'user_compare_items';
SHOW TABLES LIKE 'user_recent_views';
SHOW TABLES LIKE 'provider_student_reviews';
SHOW COLUMNS FROM user_recent_views LIKE 'last_route';
SHOW COLUMNS FROM provider_student_reviews LIKE 'provider_role';
