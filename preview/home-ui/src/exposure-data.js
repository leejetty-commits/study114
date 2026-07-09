/**
 * 11장 노출용 더미 — 키는 실DB(5·4장) 또는 8장 설계 컬럼명만 사용
 * 표시 문자열은 exposure-format.js에서 생성
 */

import { studyRoomBadges, tutorBadges } from './exposure-format.js';

function expandSeed(seed, count, dateKey, idPrefix = '') {
  const out = [];
  for (let i = 0; i < count; i++) {
    const base = seed[i % seed.length];
    const day = String(Math.max(1, 30 - (i % 28))).padStart(2, '0');
    const dateVal = `2026-05-${day}`;
    out.push({
      ...base,
      id: i + 1,
      [dateKey]: dateVal,
      ...(base.study_room_name
        ? { study_room_name: `${base.study_room_name}${idPrefix && i >= seed.length ? ` ${Math.floor(i / seed.length) + 1}` : ''}` }
        : {}),
      ...(base.tutor_display_name
        ? { tutor_display_name: `${base.tutor_display_name}${idPrefix && i >= seed.length ? `·${(i % seed.length) + 1}` : ''}` }
        : {}),
      ...(base.public_display_name
        ? { public_display_name: `${base.public_display_name}${i >= seed.length ? String.fromCharCode(65 + (i % 26)) : ''}` }
        : {}),
    });
  }
  return out;
}

const STUDY_ROOM_SEED = [
  { study_room_name: '대치 우등생 공부방', location_label: '대치동 · 대치 래미안', latitude: 37.4965, longitude: 127.0602, main_subject_note: '수학·영어', grade_band: '중1~2', price_amount: 420000, intro_short: '소규모 밀착·학부모 리포트', feature_1: '개별 피드백', feature_2: '자습 병행', career_years: 12, education_office_registered: true, weekend_available: true, one_on_one_available: true, lesson_place_type: 'office', capacity_per_time: '4~6명', facility_summary: '냉난방·환기·CCTV', youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', facebook_url: 'https://www.facebook.com/', profile_status: 'published', compare_eligible: true },
  { study_room_name: '스마트러닝 대치점', location_label: '대치동', latitude: 37.4938, longitude: 127.0648, main_subject_note: '국어·과학', grade_band: '초4~6', price_amount: 380000, intro_short: '창의 융합 중심 소그룹', feature_1: '실험 수업', feature_2: '독서 코칭', career_years: 8, education_office_registered: true, weekend_available: false, one_on_one_available: false, lesson_place_type: 'office', capacity_per_time: '6~8명', facility_summary: '환기·주차', profile_status: 'published', compare_eligible: true },
  { study_room_name: '맑은공부 대치센터', location_label: '대치동 · 빌라', latitude: 37.4952, longitude: 127.0589, main_subject_note: '영어 전문', grade_band: '중·고', price_amount: 450000, intro_short: '영어 원어민 코치 상주', feature_1: 'Speaking 집중', feature_2: '내신+수능', career_years: 15, education_office_registered: true, weekend_available: true, one_on_one_available: true, lesson_place_type: 'office', capacity_per_time: '5명', facility_summary: '냉난방·화장실', profile_status: 'published', compare_eligible: true },
  { study_room_name: '드림스터디 대치', location_label: '대치동', latitude: 37.4926, longitude: 127.0615, main_subject_note: '종합', grade_band: '초등', price_amount: 350000, feature_1: '방과후 케어', career_years: 5, education_office_registered: false, weekend_available: true, one_on_one_available: false, lesson_place_type: 'office', capacity_per_time: '8명', facility_summary: '대기공간', profile_status: 'published', compare_eligible: true },
  { study_room_name: '새싹 공부방', location_label: '대치동', latitude: 37.4941, longitude: 127.0633, main_subject_note: '초등 종합', grade_band: '초1~3', price_amount: 320000, feature_1: '기초 학습', career_years: 6, education_office_registered: true, weekend_available: false, one_on_one_available: false, lesson_place_type: 'home', capacity_per_time: '3~4명', facility_summary: '—', profile_status: 'draft', compare_eligible: false },
  { study_room_name: '밝은미래 학원형', location_label: '도곡동', latitude: 37.4888, longitude: 127.0472, main_subject_note: '중등', grade_band: '중3', price_amount: 400000, feature_1: '내신 대비', career_years: 9, education_office_registered: true, weekend_available: true, one_on_one_available: false, lesson_place_type: 'office', capacity_per_time: '10명', facility_summary: '냉난방', profile_status: 'published', compare_eligible: true },
  { study_room_name: '하늘빛 공부방', location_label: '대치동', latitude: 37.4971, longitude: 127.0598, main_subject_note: '수학', grade_band: '중2', price_amount: 360000, feature_1: '문제풀이', career_years: 7, education_office_registered: false, weekend_available: true, one_on_one_available: true, lesson_place_type: 'office', capacity_per_time: '4명', facility_summary: '환기', profile_status: 'published', compare_eligible: true },
  { study_room_name: '온누리 스터디', location_label: '대치동', latitude: 37.4933, longitude: 127.0576, main_subject_note: '논술·국어', grade_band: '고1', price_amount: 330000, feature_1: '논술 첨삭', career_years: 11, education_office_registered: true, weekend_available: false, one_on_one_available: false, lesson_place_type: 'office', capacity_per_time: '6명', facility_summary: 'CCTV', profile_status: 'draft', compare_eligible: true },
  { study_room_name: '플러스 대치', location_label: '대치동', latitude: 37.4958, longitude: 127.0655, main_subject_note: '영어·수학', grade_band: '초6', price_amount: 390000, feature_1: '양과목 패키지', career_years: 4, education_office_registered: true, weekend_available: true, one_on_one_available: false, lesson_place_type: 'office', capacity_per_time: '5명', facility_summary: '주차', profile_status: 'published', compare_eligible: true },
  { study_room_name: '아이빌 공부방', location_label: '개포동', latitude: 37.4895, longitude: 127.0668, main_subject_note: '초등', grade_band: '초4', price_amount: 300000, feature_1: '돌봄+학습', career_years: 3, education_office_registered: false, weekend_available: true, one_on_one_available: false, lesson_place_type: 'home', capacity_per_time: '4명', facility_summary: '—', profile_status: 'hidden', compare_eligible: false },
  { study_room_name: '채움 학습실', location_label: '대치동', latitude: 37.4919, longitude: 127.0629, main_subject_note: '중·고 종합', grade_band: '고2', price_amount: 440000, feature_1: '자기주도', career_years: 10, education_office_registered: true, weekend_available: true, one_on_one_available: true, lesson_place_type: 'office', capacity_per_time: '12명', facility_summary: '냉난방·환기', profile_status: 'published', compare_eligible: true },
  { study_room_name: '해오름 공부방', location_label: '대치동', latitude: 37.4968, longitude: 127.0639, main_subject_note: '과학·수학', grade_band: '중1', price_amount: 370000, feature_1: '실험·개념', career_years: 6, education_office_registered: true, weekend_available: false, one_on_one_available: false, lesson_place_type: 'office', capacity_per_time: '6명', facility_summary: '환기', profile_status: 'published', compare_eligible: true },
  { study_room_name: '미래탐구소', location_label: '대치동', latitude: 37.4949, longitude: 127.0564, main_subject_note: '코딩·수학', grade_band: '중·고', price_amount: 480000, feature_1: '프로젝트', feature_2: '코딩대회', career_years: 5, education_office_registered: true, weekend_available: true, one_on_one_available: true, lesson_place_type: 'office', capacity_per_time: '5명', facility_summary: 'PC실', profile_status: 'published', compare_eligible: true },
];

const TUTOR_SEED = [
  { tutor_display_name: '김수학', main_subject_note: '수학', location_label: '대치·도곡', preferred_fee_amount: 480000, lessons_per_week: 2, minutes_per_lesson: 90, fee_basis_type: 'monthly_by_weekly_schedule', career_year_band: 'y7_10', intro_short: '중·고 수학 전문', feature_1: '내신 1등급 다수', feature_2: '대치동 거주', student_gender_group: 'mixed', student_count_group: 'solo', university_name: '서울대학교', major_name: '수학과', university_status: 'graduated', proof_document_available: true, lesson_places: ['student_home_visit', 'public_place'], teaching_style_badges: ['meticulous', 'concept_focus'], youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', instagram_url: 'https://www.instagram.com/', profile_status: 'published', compare_eligible: true },
  { tutor_display_name: '이영어', main_subject_note: '영어', location_label: '대치동', preferred_fee_amount: 440000, lessons_per_week: 2, minutes_per_lesson: 60, career_year_band: 'y4_6', intro_short: '회화·문법 병행', feature_1: 'IELTS 지도', student_gender_group: 'female', student_count_group: 'solo', university_name: '연세대학교', major_name: '영어영문학과', university_status: 'graduated', proof_document_available: true, lesson_places: ['student_home_visit'], teaching_style_badges: ['passion', 'kind'], profile_status: 'published', compare_eligible: true },
  { tutor_display_name: '박국어', main_subject_note: '국어', location_label: '강남구', preferred_fee_amount: 400000, lessons_per_week: 1, minutes_per_lesson: 120, career_year_band: 'y10_plus', intro_short: '논술·독서 밀착', feature_1: '논술 특화', student_gender_group: 'male', student_count_group: 'two', university_name: '이화여자대학교', major_name: '국어국문학과', university_status: 'graduated', proof_document_available: false, lesson_places: ['public_place'], teaching_style_badges: ['concept_focus'], profile_status: 'draft', compare_eligible: true },
  { tutor_display_name: '최과학', main_subject_note: '과학', location_label: '대치·역삼', preferred_fee_amount: 420000, lessons_per_week: 2, minutes_per_lesson: 90, career_year_band: 'y1_3', intro_short: '실험·개념 병행', feature_1: '물화생', student_gender_group: 'mixed', student_count_group: 'solo', university_name: '서울대학교', major_name: '의예과', university_status: 'enrolled', proof_document_available: true, lesson_places: ['student_home_visit', 'tutor_home'], teaching_style_badges: ['advanced_focus'], profile_status: 'published', compare_eligible: true },
  { tutor_display_name: '정종합', main_subject_note: '종합', location_label: '서초·강남', preferred_fee_amount: 560000, lessons_per_week: 3, minutes_per_lesson: 60, career_year_band: 'y10_plus', intro_short: '전과목 밀착 관리', feature_1: '전과목', student_gender_group: 'mixed', student_count_group: 'two', university_name: '고려대학교', major_name: '교육학과', university_status: 'graduated', proof_document_available: true, lesson_places: ['student_home_visit', 'public_place'], teaching_style_badges: ['meticulous', 'from_basics'], profile_status: 'published', compare_eligible: true },
  { tutor_display_name: '한논술', main_subject_note: '논술', location_label: '대치동', preferred_fee_amount: 520000, lessons_per_week: 2, minutes_per_lesson: 90, career_year_band: 'y4_6', intro_short: '인문논술 집중', feature_1: '인문논술', student_gender_group: 'female', student_count_group: 'solo', university_name: '서강대학교', major_name: '인문학과', university_status: 'graduated', proof_document_available: true, lesson_places: ['public_place'], teaching_style_badges: ['solution_focus'], profile_status: 'published', compare_eligible: true },
  { tutor_display_name: '오영어', main_subject_note: '영어', location_label: '도곡·대치', preferred_fee_amount: 360000, lessons_per_week: 2, minutes_per_lesson: 50, career_year_band: 'y1_3', intro_short: '초등 영어 기초', feature_1: '초등 영어', student_gender_group: 'mixed', student_count_group: 'solo', university_name: '한국외국어대학교', major_name: '영어교육과', university_status: 'graduated', proof_document_available: false, lesson_places: ['student_home_visit'], teaching_style_badges: ['kind'], profile_status: 'hidden', compare_eligible: false },
  { tutor_display_name: '윤수학', main_subject_note: '수학', location_label: '강남·서초', preferred_fee_amount: 500000, lessons_per_week: 2, minutes_per_lesson: 120, career_year_band: 'y7_10', intro_short: '고등 수학 심화', feature_1: '고등 수학', student_gender_group: 'male', student_count_group: 'solo', university_name: 'KAIST', major_name: '전산학과', university_status: 'graduated', proof_document_available: true, lesson_places: ['student_home_visit', 'public_place'], teaching_style_badges: ['advanced_focus', 'solution_focus'], profile_status: 'published', compare_eligible: true },
  { tutor_display_name: '임코딩', main_subject_note: '코딩', location_label: '대치동', preferred_fee_amount: 600000, lessons_per_week: 2, minutes_per_lesson: 90, career_year_band: 'y1_3', intro_short: '파이썬·알고리즘', feature_1: '파이썬', student_gender_group: 'mixed', student_count_group: 'solo', university_name: '서울대학교', major_name: '컴퓨터공학부', university_status: 'graduated', proof_document_available: true, lesson_places: ['public_place', 'tutor_home'], teaching_style_badges: ['passion'], profile_status: 'published', compare_eligible: true },
  { tutor_display_name: '조초등', main_subject_note: '초등 종합', location_label: '대치·개포', preferred_fee_amount: 380000, lessons_per_week: 2, minutes_per_lesson: 60, career_year_band: 'y4_6', intro_short: '창의·기초 학습', feature_1: '창의수학', student_gender_group: 'mixed', student_count_group: 'two', university_name: '이화여자대학교', major_name: '초등교육과', university_status: 'graduated', proof_document_available: false, lesson_places: ['student_home_visit'], teaching_style_badges: ['from_basics', 'kind'], profile_status: 'published', compare_eligible: true },
  { tutor_display_name: '강중등', main_subject_note: '중등', location_label: '송파·강남', preferred_fee_amount: 450000, lessons_per_week: 2, minutes_per_lesson: 90, career_year_band: 'y4_6', intro_short: '중2·3 내신', feature_1: '중2·3', student_gender_group: 'mixed', student_count_group: 'three', university_name: '서울교육대학교', major_name: '수학교육과', university_status: 'graduated', proof_document_available: true, lesson_places: ['student_home_visit', 'public_place'], teaching_style_badges: ['meticulous'], profile_status: 'published', compare_eligible: true },
  { tutor_display_name: '신입시', main_subject_note: '입시', location_label: '대치동', preferred_fee_amount: 720000, lessons_per_week: 3, minutes_per_lesson: 120, career_year_band: 'y10_plus', intro_short: '수능 전략·모의', feature_1: '수능', student_gender_group: 'mixed', student_count_group: 'solo', university_name: null, major_name: null, university_note: '대입 컨설턴트', university_status: null, proof_document_available: true, lesson_places: ['public_place'], teaching_style_badges: ['solution_focus'], profile_status: 'published', compare_eligible: true },
  { tutor_display_name: '류음악', main_subject_note: '음악', location_label: '강남구', preferred_fee_amount: 320000, lessons_per_week: 1, minutes_per_lesson: 60, career_year_band: 'y1_3', intro_short: '피아노·이론', feature_1: '피아노', student_gender_group: 'female', student_count_group: 'solo', university_name: '서울대학교', major_name: '음악대학', university_status: 'graduated', proof_document_available: false, lesson_places: ['tutor_home'], teaching_style_badges: ['kind'], profile_status: 'published', compare_eligible: true },
];

const STUDENT_SEED = [
  { public_display_name: '맑은하늘', grade_level: '중2', gender: 'male', location_label: '대치동', subject_label: '수학·영어', preferred_lesson_type: 'tutor', preferred_fee_amount: 550000, preferred_studyroom_fee_amount: 420000, lessons_per_week: 2, minutes_per_lesson: 90, lesson_format: 'one_on_one', lesson_places: ['student_home', 'public_place'], preferred_student_count_group: 'solo', teaching_style_badges: ['meticulous', 'concept_focus'], request_summary: '주 2회 저녁, 내신 대비 희망', request_summary_visibility: 'paid_only', special_request_note: '수학 기초가 약해 보충 필요', special_request_visibility: 'private', exposure_status: 'published' },
  { public_display_name: '초등왕', grade_level: '초5', gender: 'female', location_label: '대치동 · 대치 래미안', subject_label: '종합', preferred_lesson_type: 'study_room', preferred_fee_amount: 400000, preferred_studyroom_fee_amount: 380000, lesson_places: ['study_room'], lesson_format: 'group', student_gender_group: 'mixed', preferred_student_count_group: 'two', teaching_style_badges: ['kind', 'from_basics'], request_summary: '공부방 병행 희망', request_summary_visibility: 'private', special_request_note: '', special_request_visibility: 'private', exposure_status: 'published' },
  { public_display_name: '과학탐구', grade_level: '고1', gender: 'male', location_label: '서울시 도곡', subject_label: '과학', preferred_lesson_type: 'tutor', preferred_fee_amount: 600000, preferred_studyroom_fee_amount: null, lesson_places: ['student_home'], preferred_student_count_group: 'solo', teaching_style_badges: ['advanced_focus'], request_summary: '물리·화학 과외', request_summary_visibility: 'paid_only', special_request_note: '주말 오전 선호', special_request_visibility: 'paid_only', exposure_status: 'published' },
  { public_display_name: '영어마스터', grade_level: '초3', gender: 'female', location_label: '개포동', subject_label: '영어', preferred_lesson_type: 'tutor', preferred_fee_amount: 450000, preferred_studyroom_fee_amount: 350000, lesson_places: ['student_home', 'study_room'], preferred_student_count_group: 'solo', teaching_style_badges: ['passion'], request_summary: '파닉스부터', request_summary_visibility: 'private', special_request_note: null, special_request_visibility: 'private', exposure_status: 'draft' },
  { public_display_name: '논술준비', grade_level: '중3', gender: 'female', location_label: '서울시 역삼', subject_label: '국어', preferred_lesson_type: 'tutor', preferred_fee_amount: 500000, preferred_studyroom_fee_amount: null, lesson_places: ['public_place'], preferred_student_count_group: 'two', teaching_style_badges: ['concept_focus', 'solution_focus'], request_summary: '논술·독서', request_summary_visibility: 'paid_only', special_request_note: '내신 논술 집중', special_request_visibility: 'private', exposure_status: 'published' },
  { public_display_name: '수학집중', grade_level: '초6', gender: 'male', location_label: '대치동', subject_label: '수학', preferred_lesson_type: 'study_room', preferred_fee_amount: 480000, preferred_studyroom_fee_amount: 400000, lesson_places: ['study_room', 'public_place'], lesson_format: 'group', student_gender_group: 'male', preferred_student_count_group: 'three', teaching_style_badges: ['meticulous'], request_summary: '중등 선행', request_summary_visibility: 'private', special_request_note: '', special_request_visibility: 'private', exposure_status: 'published' },
];

const INQUIRY_CYCLE = ['open', 'open', 'waiting_only', 'capacity_full', 'paused'];

function enrichStudyRoom(r) {
  const lesson_place_type =
    r.lesson_place_type === 'office' ? 'academy' : r.lesson_place_type === 'home' ? 'study_room' : r.lesson_place_type;
  const id = r.id ?? 1;
  return {
    ...r,
    lesson_place_type,
    inquiry_status: r.inquiry_status || INQUIRY_CYCLE[(id - 1) % INQUIRY_CYCLE.length],
    lesson_operation_type: r.lesson_operation_type || 'group_by_time_slot',
    slogan: r.slogan || r.feature_1 || null,
    image_path: null,
    badges: studyRoomBadges(r),
    recommend_count: (id % 7) + 2,
    wish_count: (id % 15) + 3,
    message_count: id % 6,
    compare_count: (id % 4) + 1,
    review_count: id % 5 === 0 ? 0 : (id % 12) + 1,
  };
}

function enrichTutor(t) {
  const id = t.id ?? 1;
  return {
    ...t,
    slogan: t.slogan || t.feature_1 || null,
    main_material_note: t.main_material_note || null,
    verification_doc_count: t.verification_doc_count ?? (t.proof_document_available ? 3 : 0),
    image_path: null,
    badges: tutorBadges(t),
    recommend_count: (id % 9) + 1,
    wish_count: (id % 11) + 2,
    message_count: (id % 5) + 1,
    compare_count: (id % 3) + 1,
    review_count: id % 4 === 0 ? 0 : (id % 8) + 1,
  };
}

function enrichStudent(s) {
  const id = s.id ?? 1;
  return {
    ...s,
    lessons_per_week: s.lessons_per_week ?? 2,
    minutes_per_lesson: s.minutes_per_lesson ?? 90,
    image_path: null,
    recommend_count: id % 4,
    wish_count: id % 7,
    message_count: (id % 4) + 1,
    compare_count: 0,
    review_count: 0,
  };
}

export const EXPOSURE_STUDY_ROOMS = expandSeed(STUDY_ROOM_SEED, 28, 'registered_at').map(enrichStudyRoom);
export const EXPOSURE_TUTORS = expandSeed(TUTOR_SEED, 28, 'registered_at').map(enrichTutor);
export const EXPOSURE_STUDENTS = expandSeed(STUDENT_SEED, 28, 'published_at').map(enrichStudent);

if (typeof window !== 'undefined') {
  window.__STUDENT_PREVIEW_POOL = EXPOSURE_STUDENTS;
}

/** @deprecated */
export const DUMMY_STUDY_ROOMS = EXPOSURE_STUDY_ROOMS;
export const DUMMY_TUTORS = EXPOSURE_TUTORS;
export const DUMMY_STUDENT_REQUESTS = EXPOSURE_STUDENTS.map((s) => ({
  id: s.id,
  title: s.request_summary,
  grade: s.grade_level,
  area: s.location_label,
  subject: s.subject_label,
  posted: s.published_at,
  status: s.exposure_status,
}));
