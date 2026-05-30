/** @typedef {'guest' | 'parent' | 'study_room' | 'tutor'} HomeRole */

/** 지역 데모 — 단지 우선 / 동 fallback */
export const REGIONS = {
  complex: {
    type: 'complex',
    label: '래미안 역삼',
    sub: '서울 강남구 역삼동',
    policy: '단지 우선',
  },
  dong: {
    type: 'dong',
    label: '역삼동',
    sub: '서울 강남구 · 빌라·다세대 포함',
    policy: '동 우선',
  },
};

export const DUMMY_STUDY_ROOMS = [
  { id: 1, name: '역삼 우등생 공부방', subject: '수학·영어', price: '월 35만원~', registered: '2026-05-28', badge: '고정 A' },
  { id: 2, name: '해피러닝 공부방', subject: '국어·과학', price: '월 28만원~', registered: '2026-05-27', badge: '고정 B' },
  { id: 3, name: '스마트 공부방', subject: '영어 전문', price: '월 40만원~', registered: '2026-05-26', badge: '고정 C' },
  { id: 4, name: '맑은공부방', subject: '종합', price: '월 30만원~', registered: '2026-05-25', badge: null },
  { id: 5, name: '드림 공부방', subject: '수학', price: '월 32만원~', registered: '2026-05-24', badge: null },
  { id: 6, name: '새싹 공부방', subject: '초등 종합', price: '월 25만원~', registered: '2026-05-23', badge: null },
  { id: 7, name: '밝은미래 공부방', subject: '중등', price: '월 38만원~', registered: '2026-05-22', badge: null },
];

export const DUMMY_TUTORS = [
  { id: 1, name: '김수학 선생님', subject: '수학', area: '역삼·논현', registered: '2026-05-28' },
  { id: 2, name: '이영어 선생님', subject: '영어', area: '역삼동', registered: '2026-05-27' },
  { id: 3, name: '박국어 선생님', subject: '국어', area: '강남구', registered: '2026-05-26' },
  { id: 4, name: '최과학 선생님', subject: '과학', area: '역삼동', registered: '2026-05-25' },
  { id: 5, name: '정종합 선생님', subject: '종합', area: '서초·강남', registered: '2026-05-24' },
];

export const DUMMY_STUDENTS = [
  { id: 1, name: '김민준', grade: '초5', school: '역삼초', parent: '김우동' },
  { id: 2, name: '김서연', grade: '중1', school: '역삼중', parent: '김우동' },
];

export const MY_STUDY_ROOM = {
  name: '우동공부방 역삼점',
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

/** 상단 3박스 슬롯 라벨 (고정) */
export const SLOT_TOP = ['고정 A', '고정 B', '고정 C'];

/** 중단 5박스 슬롯 라벨 (고정형 시작) */
export const SLOT_MID = ['고정 1', '고정 2', '고정 3', '고정 4', '고정 5'];
