/**
 * 공부방 쪽지설정 비교용 가상 BASIC 카드 — 홈 실카드 렌더러에 넣을 풀데이터.
 * 사용자 미완성 공부방을 샘플로 쓰지 않는다.
 */

export const STUDY_ROOM_CARD_SAMPLE_IMAGE = '/assets/brand/room-card-default-basic.svg';

/**
 * @param {boolean} receiving
 */
export function buildStudyRoomInquirySampleItem(receiving) {
  return {
    id: receiving ? 'p20-inq-open' : 'p20-inq-closed',
    study_room_name: '강남 수학 공부방',
    location_label: '서울 강남구',
    main_subject_note: '수학',
    grade_band: '중·고',
    price_amount: 350000,
    intro_short: '한 타임에 약점 유형만 반복합니다',
    slogan: '한 타임에 약점만 반복합니다',
    feature_1: '내신 클리닉',
    feature_2: '주말 가능',
    feature_3: '소수 정원',
    career_years: 8,
    education_office_registered: true,
    business_registration_available: true,
    proof_document_available: true,
    verification_doc_count: 2,
    weekend_available: true,
    one_on_one_available: false,
    lesson_place_type: 'office',
    lesson_operation_type: 'group_by_time_slot',
    capacity_per_time: '6명',
    facility_summary: '화이트보드 · 개별 좌석',
    profile_status: 'published',
    compare_eligible: true,
    image_path: STUDY_ROOM_CARD_SAMPLE_IMAGE,
    image_path_basic: STUDY_ROOM_CARD_SAMPLE_IMAGE,
    recommend_count: 22,
    review_count: 9,
    wish_count: 14,
    compare_count: 3,
    message_count: receiving ? 5 : 0,
    published_at: '2025-10-12T09:00:00+09:00',
    inquiry_status: receiving ? 'open' : 'paused',
  };
}
