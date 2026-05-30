-- SSOT schema audit for study114_dev
USE study114_dev;

SELECT '=== TABLES ===' AS section;
SHOW TABLES;

SELECT '=== users ===' AS section;
SHOW CREATE TABLE users\G
SHOW COLUMNS FROM users;

SELECT '=== user_profiles ===' AS section;
SHOW CREATE TABLE user_profiles\G
SHOW COLUMNS FROM user_profiles;

SELECT '=== user_roles ===' AS section;
SHOW CREATE TABLE user_roles\G
SHOW COLUMNS FROM user_roles;

SELECT '=== students ===' AS section;
SHOW CREATE TABLE students\G

SELECT '=== student_subject_targets ===' AS section;
SHOW CREATE TABLE student_subject_targets\G

SELECT '=== study_rooms ===' AS section;
SHOW CREATE TABLE study_rooms\G

SELECT '=== study_room_regions ===' AS section;
SHOW CREATE TABLE study_room_regions\G

SELECT '=== study_room_subject_targets ===' AS section;
SHOW CREATE TABLE study_room_subject_targets\G

SELECT '=== study_room_images ===' AS section;
SHOW CREATE TABLE study_room_images\G

SELECT '=== facility_masters ===' AS section;
SHOW CREATE TABLE facility_masters\G

SELECT '=== study_room_facilities ===' AS section;
SHOW CREATE TABLE study_room_facilities\G

SELECT '=== regions ===' AS section;
SHOW CREATE TABLE regions\G

SELECT '=== complexes ===' AS section;
SHOW CREATE TABLE complexes\G
