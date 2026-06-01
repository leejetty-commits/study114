/** @typedef {'guest' | 'parent' | 'study_room' | 'tutor'} HomeRole */

/** auth-ui 프리뷰 (2장) */
export const AUTH_UI_BASE = 'http://localhost:5173';

export {
  EXPOSURE_STUDY_ROOMS,
  EXPOSURE_TUTORS,
  EXPOSURE_STUDENTS,
  DUMMY_STUDY_ROOMS,
  DUMMY_TUTORS,
  DUMMY_STUDENT_REQUESTS,
} from './exposure-data.js';

/** 비회원 데모 고정 지역 — 9장 §4-1 */
export const GUEST_DEMO_REGION = {
  dong: '대치동',
  gu: '강남구',
  city: '서울',
  full: '서울 강남구 대치동',
  metro: '강남·서초·송파 권역',
  policy: '동 우선 · 빌라·다세대 포함',
};

export const REGIONS = {
  complex: {
    type: 'complex',
    label: '대치 래미안',
    sub: '서울 강남구 대치동',
    policy: '단지 우선',
  },
  dong: {
    type: 'dong',
    label: GUEST_DEMO_REGION.dong,
    sub: `${GUEST_DEMO_REGION.city} ${GUEST_DEMO_REGION.gu} · 빌라·다세대 포함`,
    policy: '동 우선',
  },
};

export const GUEST_REGION_STATS = {
  studyRooms: 47,
  tutors: 62,
  studentRequests: 128,
  updated: '2026-06-01',
};

export const DUMMY_STUDENTS = [
  { id: 1, name: '김민준', grade: '초5', school: '대치초', parent: '김우동' },
  { id: 2, name: '김서연', grade: '중1', school: '대치중', parent: '김우동' },
];

export const MY_STUDY_ROOM = {
  name: '우동공부방 대치점',
  status: '운영중',
  views: 128,
  inquiries: 5,
  registered: '2026-04-10',
};

export const MY_TUTOR = {
  name: '김우동 선생님',
  subject: '수학·영어',
  status: '프로필 공개',
  views: 64,
  registered: '2026-04-15',
};

export const SLOT_PRIME = ['Prime A', 'Prime B', 'Prime C'];
export const SLOT_PICK_ROW = ['Pick 1', 'Pick 2', 'Pick 3', 'Pick 4', 'Pick 5'];
export const SLOT_TOP = SLOT_PRIME;
export const SLOT_MID = SLOT_PICK_ROW;

export const AD_FALLBACKS = {
  premium: {
    tag: '프리미엄',
    title: '우리동네 상단 노출',
    desc: 'Prime·Pick 슬롯 — 상세등록 완료 전제',
    cta: '상품 안내',
    action: 'ad-premium',
  },
  partner: {
    tag: '제휴',
    title: '지역 학원·교육 브랜드',
    desc: '광고 슬롯',
    cta: '광고 문의',
    action: 'ad-inquiry',
  },
  public: {
    tag: '안내',
    title: '우동공과 이용 가이드',
    desc: '등록·비교검색 안내',
    cta: '이용 안내',
    action: 'ad-guide',
  },
};
