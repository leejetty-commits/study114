-- =============================================================================
-- study114 schema 012 — search dev seed (13장 검색 API 로컬 검증용)
-- Apply AFTER 011_student_gender_group.sql
-- =============================================================================

USE study114;

SET NAMES utf8mb4;

-- bcrypt for dev password "password" (Laravel test hash)
SET @pw := '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';

INSERT INTO regions (sido_code, sido_name, sigungu_code, sigungu_name, dong_code, dong_name) VALUES
  ('11', '서울특별시', '11680', '강남구', '11680101', '대치동'),
  ('26', '부산광역시', '26350', '해운대구', '26350101', '우동'),
  ('26', '부산광역시', '26350', '해운대구', '26350102', '센텀동');

INSERT INTO complexes (region_id, name, address) VALUES
  (1, '은마아파트', '서울특별시 강남구 대치동 316'),
  (3, '센텀자이', '부산광역시 해운대구 센텀동로 99');

INSERT INTO users (email, password_hash, status) VALUES
  ('room-owner1@dev.local', @pw, 'active'),
  ('room-owner2@dev.local', @pw, 'active'),
  ('room-owner3@dev.local', @pw, 'active'),
  ('tutor-owner1@dev.local', @pw, 'active'),
  ('tutor-owner2@dev.local', @pw, 'active'),
  ('guardian1@dev.local', @pw, 'active');

INSERT INTO user_profiles (user_id, real_name, gender, birth_date, phone, address_line1) VALUES
  (1, '김운영', 'male', '1980-03-01', '010-1111-0001', '서울 강남구'),
  (2, '이운영', 'female', '1985-06-15', '010-1111-0002', '부산 해운대구'),
  (3, '박운영', 'male', '1978-11-20', '010-1111-0003', '부산 해운대구'),
  (4, '최튜터', 'male', '1992-01-10', '010-2222-0001', '서울 강남구'),
  (5, '정튜터', 'female', '1994-07-22', '010-2222-0002', '부산 해운대구'),
  (6, '한학부', 'female', '1988-09-05', '010-3333-0001', '부산 해운대구');

INSERT INTO user_roles (user_id, role_type, is_primary, status) VALUES
  (1, 'study_room_owner', 1, 'active'),
  (2, 'study_room_owner', 1, 'active'),
  (3, 'study_room_owner', 1, 'active'),
  (4, 'tutor', 1, 'active'),
  (5, 'tutor', 1, 'active'),
  (6, 'guardian_student', 1, 'active');

INSERT INTO study_rooms (
  user_id, study_room_name, intro_short, main_subject_note, teaching_style,
  lesson_place_type, lesson_operation_type,
  region_id, complex_id, price_amount,
  weekend_available, one_on_one_available, education_office_registered,
  capacity_per_time, career_years, franchise_flag, detail_completion_status,
  profile_status, published_at
) VALUES
  (1, '대치 Prime 수학 공부방', '소수정예 · 숙제관리', '중등·고등 수학', '개념+심화',
   'study_room', 'group_by_time_slot',
   1, 1, 480000,
   1, 1, 1,
   'one_to_four', 8, 0, 'expanded_complete',
   'published', NOW()),
  (2, '우동 Pick 영어 공부방', '발음교정', '초등·중등 영어', '회화 중심',
   'academy', 'time_slot_mixed_grade',
   2, NULL, 320000,
   0, 0, 0,
   'five_to_eight', 5, 0, 'expanded_in_progress',
   'published', NOW()),
  (3, '센텀 Basic 국어 공부방', '독해 중심', '초등·중등 국어', '독해·문법',
   'study_room', 'individual_visit',
   3, 2, 220000,
   1, 0, 0,
   'one_to_four', 3, 0, 'basic_only',
   'published', NOW());

INSERT INTO study_room_regions (study_room_id, slot, region_id, complex_id, is_primary) VALUES
  (1, 1, 1, 1, 1),
  (2, 1, 2, NULL, 1),
  (3, 1, 3, 2, 1);

INSERT INTO study_room_subject_targets (study_room_id, subject_name, school_level, subject_master_id, is_main) VALUES
  (1, '수학', 'middle', 5, 1),
  (1, '수학', 'high', 5, 0),
  (2, '영어', 'elementary', 2, 1),
  (2, '영어', 'middle', 2, 0),
  (3, '국어', 'elementary', 8, 1),
  (3, '국어', 'middle', 8, 0);

INSERT INTO study_room_facilities (study_room_id, facility_id) VALUES
  (1, 1),
  (1, 5);

INSERT INTO tutors (
  user_id, tutor_display_name, preferred_fee_amount, university_name, major_name,
  career_year_band, lessons_per_week, minutes_per_lesson,
  student_gender_group, student_count_group, age_band, university_status,
  profile_status
) VALUES
  (4, '대치 Prime 수학', 600000, '서울대', '수학과', 'y7_10', 2, 90, 'mixed', 'solo', 'early_30s', 'graduated', 'published'),
  (5, '우동 Pick 영어', 400000, '연세대', '영어영문학과', 'y4_6', 2, 60, 'female', 'two', 'late_20s', 'graduated', 'published');

INSERT INTO tutor_regions (tutor_id, region_id, scope_type, priority_order, is_primary) VALUES
  (1, 1, 'city', 0, 1),
  (2, 2, 'city', 0, 1);

INSERT INTO tutor_subject_targets (tutor_id, subject_name, school_level, subject_master_id, is_primary) VALUES
  (1, '수학', 'middle', 5, 1),
  (1, '수학', 'high', 5, 0),
  (2, '영어', 'elementary', 2, 1),
  (2, '영어', 'middle', 2, 0);

INSERT INTO tutor_lesson_places (tutor_id, place_type) VALUES
  (1, 'student_home_visit'),
  (1, 'public_place'),
  (2, 'student_home_visit');

INSERT INTO tutor_teaching_style_badges (tutor_id, badge_name, display_order) VALUES
  (1, 'meticulous', 0),
  (1, 'concept_focus', 1),
  (2, 'kind', 0),
  (2, 'passion', 1);

INSERT INTO students (
  guardian_user_id, student_name, public_display_name,
  gender, grade_level, preferred_lesson_type,
  preferred_studyroom_region_id, preferred_studyroom_complex_id,
  preferred_tutor_region_id,
  preferred_fee_amount, preferred_studyroom_fee_amount,
  lessons_per_week, minutes_per_lesson,
  lesson_format, student_gender_group, preferred_student_count_group,
  exposure_status, published_at
) VALUES
  (6, '김맑음', '맑은하늘', 'male', '중2', 'tutor',
   NULL, NULL, 2,
   550000, NULL,
   2, 90, 'one_on_one', NULL, NULL,
   'published', NOW()),
  (6, '이초등', '초등왕', 'female', '초5', 'study_room',
   3, 2, NULL,
   NULL, 380000,
   2, 60, 'group', 'mixed', 'two',
   'published', NOW());

INSERT INTO student_subject_targets (student_id, subject_name, school_level, subject_master_id, is_primary) VALUES
  (1, '수학', 'middle', 5, 1),
  (1, '영어', 'middle', 2, 0),
  (2, '국어', 'elementary', 8, 0),
  (2, '수학', 'elementary', 5, 1);

INSERT INTO student_preferred_lesson_places (student_id, place_type) VALUES
  (1, 'student_home'),
  (2, 'study_room');

INSERT INTO student_preferred_teaching_style_badges (student_id, badge_name, display_order) VALUES
  (1, 'from_basics', 0),
  (2, 'kind', 0);
