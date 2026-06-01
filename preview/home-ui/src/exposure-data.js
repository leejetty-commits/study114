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
      ...(base.display_name
        ? { display_name: `${base.display_name}${idPrefix && i >= seed.length ? `·${(i % seed.length) + 1}` : ''}` }
        : {}),
      ...(base.public_display_name
        ? { public_display_name: `${base.public_display_name}${i >= seed.length ? String.fromCharCode(65 + (i % 26)) : ''}` }
        : {}),
    });
  }
  return out;
}

const STUDY_ROOM_SEED = [
  { study_room_name: '대치 우등생 공부방', location_label: '대치동 · 대치 래미안', main_subject_note: '수학·영어', grade_band: '중1~2', price_amount: 420000, intro_short: '소규모 밀착·학부모 리포트', feature_1: '개별 피드백', feature_2: '자습 병행', career_years: 12, education_office_registered: true, weekend_available: true, one_on_one_available: true, lesson_place_type: 'office', capacity_per_time: '4~6명', facility_summary: '냉난방·환기·CCTV', profile_status: 'published', compare_eligible: true },
  { study_room_name: '스마트러닝 대치점', location_label: '대치동', main_subject_note: '국어·과학', grade_band: '초4~6', price_amount: 380000, intro_short: '창의 융합 중심 소그룹', feature_1: '실험 수업', feature_2: '독서 코칭', career_years: 8, education_office_registered: true, weekend_available: false, one_on_one_available: false, lesson_place_type: 'office', capacity_per_time: '6~8명', facility_summary: '환기·주차', profile_status: 'published', compare_eligible: true },
  { study_room_name: '맑은공부 대치센터', location_label: '대치동 · 빌라', main_subject_note: '영어 전문', grade_band: '중·고', price_amount: 450000, intro_short: '영어 원어민 코치 상주', feature_1: 'Speaking 집중', feature_2: '내신+수능', career_years: 15, education_office_registered: true, weekend_available: true, one_on_one_available: true, lesson_place_type: 'office', capacity_per_time: '5명', facility_summary: '냉난방·화장실', profile_status: 'published', compare_eligible: true },
  { study_room_name: '드림스터디 대치', location_label: '대치동', main_subject_note: '종합', grade_band: '초등', price_amount: 350000, feature_1: '방과후 케어', career_years: 5, education_office_registered: false, weekend_available: true, one_on_one_available: false, lesson_place_type: 'office', capacity_per_time: '8명', facility_summary: '대기공간', profile_status: 'published', compare_eligible: true },
  { study_room_name: '새싹 공부방', location_label: '대치동', main_subject_note: '초등 종합', grade_band: '초1~3', price_amount: 320000, feature_1: '기초 학습', career_years: 6, education_office_registered: true, weekend_available: false, one_on_one_available: false, lesson_place_type: 'home', capacity_per_time: '3~4명', facility_summary: '—', profile_status: 'pending', compare_eligible: false },
  { study_room_name: '밝은미래 학원형', location_label: '도곡동', main_subject_note: '중등', grade_band: '중3', price_amount: 400000, feature_1: '내신 대비', career_years: 9, education_office_registered: true, weekend_available: true, one_on_one_available: false, lesson_place_type: 'office', capacity_per_time: '10명', facility_summary: '냉난방', profile_status: 'published', compare_eligible: true },
  { study_room_name: '하늘빛 공부방', location_label: '대치동', main_subject_note: '수학', grade_band: '중2', price_amount: 360000, feature_1: '문제풀이', career_years: 7, education_office_registered: false, weekend_available: true, one_on_one_available: true, lesson_place_type: 'office', capacity_per_time: '4명', facility_summary: '환기', profile_status: 'published', compare_eligible: true },
  { study_room_name: '온누리 스터디', location_label: '대치동', main_subject_note: '논술·국어', grade_band: '고1', price_amount: 330000, feature_1: '논술 첨삭', career_years: 11, education_office_registered: true, weekend_available: false, one_on_one_available: false, lesson_place_type: 'office', capacity_per_time: '6명', facility_summary: 'CCTV', profile_status: 'pending', compare_eligible: true },
  { study_room_name: '플러스 대치', location_label: '대치동', main_subject_note: '영어·수학', grade_band: '초6', price_amount: 390000, feature_1: '양과목 패키지', career_years: 4, education_office_registered: true, weekend_available: true, one_on_one_available: false, lesson_place_type: 'office', capacity_per_time: '5명', facility_summary: '주차', profile_status: 'published', compare_eligible: true },
  { study_room_name: '아이빌 공부방', location_label: '개포동', main_subject_note: '초등', grade_band: '초4', price_amount: 300000, feature_1: '돌봄+학습', career_years: 3, education_office_registered: false, weekend_available: true, one_on_one_available: false, lesson_place_type: 'home', capacity_per_time: '4명', facility_summary: '—', profile_status: 'published', compare_eligible: false },
  { study_room_name: '채움 학습실', location_label: '대치동', main_subject_note: '중·고 종합', grade_band: '고2', price_amount: 440000, feature_1: '자기주도', career_years: 10, education_office_registered: true, weekend_available: true, one_on_one_available: true, lesson_place_type: 'office', capacity_per_time: '12명', facility_summary: '냉난방·환기', profile_status: 'published', compare_eligible: true },
  { study_room_name: '해오름 공부방', location_label: '대치동', main_subject_note: '과학·수학', grade_band: '중1', price_amount: 370000, feature_1: '실험·개념', career_years: 6, education_office_registered: true, weekend_available: false, one_on_one_available: false, lesson_place_type: 'office', capacity_per_time: '6명', facility_summary: '환기', profile_status: 'published', compare_eligible: true },
  { study_room_name: '미래탐구소', location_label: '대치동', main_subject_note: '코딩·수학', grade_band: '중·고', price_amount: 480000, feature_1: '프로젝트', feature_2: '코딩대회', career_years: 5, education_office_registered: true, weekend_available: true, one_on_one_available: true, lesson_place_type: 'office', capacity_per_time: '5명', facility_summary: 'PC실', profile_status: 'published', compare_eligible: true },
];

const TUTOR_SEED = [
  { display_name: '김수학', main_subject_note: '수학', location_label: '대치·도곡', preferred_fee_amount: 60000, career_years: 10, intro_short: '중·고 수학 전문', feature_1: '내신 1등급 다수', feature_2: '대치동 거주', gender: 'male', lesson_format: 'one_on_one', education_background_note: '서울대 수학과', verification_available: true, profile_status: 'published', compare_eligible: true },
  { display_name: '이영어', main_subject_note: '영어', location_label: '대치동', preferred_fee_amount: 55000, career_years: 7, intro_short: '회화·문법 병행', feature_1: 'IELTS 지도', gender: 'female', lesson_format: 'one_on_one', education_background_note: '해외대 졸', verification_available: true, profile_status: 'published', compare_eligible: true },
  { display_name: '박국어', main_subject_note: '국어', location_label: '강남구', preferred_fee_amount: 50000, career_years: 12, intro_short: '논술·독서 밀착', feature_1: '논술 특화', gender: 'male', lesson_format: 'one_on_one', education_background_note: '국어교육과', verification_available: false, profile_status: 'pending', compare_eligible: true },
  { display_name: '최과학', main_subject_note: '과학', location_label: '대치·역삼', preferred_fee_amount: 55000, career_years: 5, intro_short: '실험·개념 병행', feature_1: '물화생', gender: 'female', lesson_format: 'one_on_one', education_background_note: '의대 재학', verification_available: true, profile_status: 'published', compare_eligible: true },
  { display_name: '정종합', main_subject_note: '종합', location_label: '서초·강남', preferred_fee_amount: 70000, career_years: 15, intro_short: '전과목 밀착 관리', feature_1: '전과목', gender: 'male', lesson_format: 'group', education_background_note: 'SKY', verification_available: true, profile_status: 'published', compare_eligible: true },
  { display_name: '한논술', main_subject_note: '논술', location_label: '대치동', preferred_fee_amount: 65000, career_years: 8, intro_short: '인문논술 집중', feature_1: '인문논술', gender: 'female', lesson_format: 'one_on_one', education_background_note: '인문대', verification_available: true, profile_status: 'published', compare_eligible: true },
  { display_name: '오영어', main_subject_note: '영어', location_label: '도곡·대치', preferred_fee_amount: 50000, career_years: 4, intro_short: '초등 영어 기초', feature_1: '초등 영어', gender: 'female', lesson_format: 'one_on_one', education_background_note: '영어교육과', verification_available: false, profile_status: 'pending', compare_eligible: false },
  { display_name: '윤수학', main_subject_note: '수학', location_label: '강남·서초', preferred_fee_amount: 60000, career_years: 9, intro_short: '고등 수학 심화', feature_1: '고등 수학', gender: 'male', lesson_format: 'one_on_one', education_background_note: '공대', verification_available: true, profile_status: 'published', compare_eligible: true },
  { display_name: '임코딩', main_subject_note: '코딩', location_label: '대치동', preferred_fee_amount: 75000, career_years: 3, intro_short: '파이썬·알고리즘', feature_1: '파이썬', gender: 'male', lesson_format: 'one_on_one', education_background_note: '컴공', verification_available: true, profile_status: 'published', compare_eligible: true },
  { display_name: '조초등', main_subject_note: '초등 종합', location_label: '대치·개포', preferred_fee_amount: 45000, career_years: 6, intro_short: '창의·기초 학습', feature_1: '창의수학', gender: 'female', lesson_format: 'one_on_one', education_background_note: '초등교육', verification_available: false, profile_status: 'published', compare_eligible: true },
  { display_name: '강중등', main_subject_note: '중등', location_label: '송파·강남', preferred_fee_amount: 55000, career_years: 7, intro_short: '중2·3 내신', feature_1: '중2·3', gender: 'male', lesson_format: 'one_on_one', education_background_note: '사범대', verification_available: true, profile_status: 'published', compare_eligible: true },
  { display_name: '신입시', main_subject_note: '입시', location_label: '대치동', preferred_fee_amount: 80000, career_years: 20, intro_short: '수능 전략·모의', feature_1: '수능', gender: 'male', lesson_format: 'one_on_one', education_background_note: '대입 컨설턴트', verification_available: true, profile_status: 'published', compare_eligible: true },
  { display_name: '류음악', main_subject_note: '음악', location_label: '강남구', preferred_fee_amount: 40000, career_years: 5, intro_short: '피아노·이론', feature_1: '피아노', gender: 'female', lesson_format: 'one_on_one', education_background_note: '음대', verification_available: false, profile_status: 'published', compare_eligible: true },
];

const STUDENT_SEED = [
  { public_display_name: '맑은하늘', grade_level: '중2', gender: 'male', location_label: '대치동', subject_label: '수학·영어', preferred_fee_amount: 55000, request_summary: '주 2회 저녁, 내신 대비 희망', exposure_status: 'published' },
  { public_display_name: '초등왕', grade_level: '초5', gender: 'female', location_label: '대치동', subject_label: '종합', preferred_fee_amount: 40000, request_summary: '공부방 병행 희망', exposure_status: 'published' },
  { public_display_name: '과학탐구', grade_level: '고1', gender: 'male', location_label: '도곡동', subject_label: '과학', preferred_fee_amount: 60000, request_summary: '물리·화학 과외', exposure_status: 'published' },
  { public_display_name: '영어마스터', grade_level: '초3', gender: 'female', location_label: '개포동', subject_label: '영어', preferred_fee_amount: 45000, request_summary: '파닉스부터', exposure_status: 'draft' },
  { public_display_name: '논술준비', grade_level: '중3', gender: 'female', location_label: '역삼동', subject_label: '국어', preferred_fee_amount: 50000, request_summary: '논술·독서', exposure_status: 'published' },
  { public_display_name: '수학집중', grade_level: '초6', gender: 'male', location_label: '대치동', subject_label: '수학', preferred_fee_amount: 48000, request_summary: '중등 선행', exposure_status: 'published' },
  { public_display_name: '고딩스터디', grade_level: '고2', gender: 'male', location_label: '서초동', subject_label: '영어·수학', preferred_fee_amount: 65000, request_summary: '수능 대비', exposure_status: 'published' },
  { public_display_name: '돌봄학습', grade_level: '초4', gender: 'female', location_label: '삼성동', subject_label: '종합', preferred_fee_amount: 42000, request_summary: '방과후 돌봄', exposure_status: 'published' },
  { public_display_name: '실험좋아', grade_level: '중1', gender: 'male', location_label: '잠실동', subject_label: '과학', preferred_fee_amount: 50000, request_summary: '실험 중심', exposure_status: 'draft' },
  { public_display_name: '입시전략', grade_level: '고3', gender: 'male', location_label: '대치동', subject_label: '수학', preferred_fee_amount: 80000, request_summary: '수능 킬러', exposure_status: 'published' },
  { public_display_name: '기초탄탄', grade_level: '초2', gender: 'female', location_label: '청담동', subject_label: '국어·수학', preferred_fee_amount: 38000, request_summary: '기초 학습', exposure_status: 'published' },
  { public_display_name: '코딩키즈', grade_level: '중2', gender: 'male', location_label: '송파동', subject_label: '코딩', preferred_fee_amount: 70000, request_summary: '파이썬 입문', exposure_status: 'published' },
];

function enrichStudyRoom(r) {
  return {
    ...r,
    image_path: null,
    badges: studyRoomBadges(r),
    review_count: r.id % 5 === 0 ? 0 : (r.id % 12) + 1,
  };
}

function enrichTutor(t) {
  return {
    ...t,
    image_path: null,
    badges: tutorBadges(t),
    review_count: t.id % 4 === 0 ? 0 : (t.id % 8) + 1,
    _source: 'design_dummy',
  };
}

function enrichStudent(s) {
  return { ...s, image_path: null };
}

export const EXPOSURE_STUDY_ROOMS = expandSeed(STUDY_ROOM_SEED, 28, 'registered_at').map(enrichStudyRoom);
export const EXPOSURE_TUTORS = expandSeed(TUTOR_SEED, 28, 'registered_at').map(enrichTutor);
export const EXPOSURE_STUDENTS = expandSeed(STUDENT_SEED, 28, 'published_at').map(enrichStudent);

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
