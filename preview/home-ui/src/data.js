/** @typedef {'guest' | 'parent' | 'study_room' | 'tutor'} HomeRole */

import { AUTH_UI_BASE as AUTH_UI_BASE_SSOT } from '../../shared/preview-links.js';

/** auth-ui 프리뷰 (2장) — SSOT: preview-links.js */
export const AUTH_UI_BASE = AUTH_UI_BASE_SSOT;

export {
  EXPOSURE_STUDY_ROOMS,
  EXPOSURE_TUTORS,
  EXPOSURE_STUDENTS,
  DUMMY_STUDY_ROOMS,
  DUMMY_TUTORS,
  DUMMY_STUDENT_REQUESTS,
} from './exposure-data.js';

export const SLOT_PRIME = ['대표 노출 1', '대표 노출 2', '대표 노출 3'];
export const SLOT_PICK_ROW = ['추천 노출 1', '추천 노출 2', '추천 노출 3', '추천 노출 4', '추천 노출 5'];
export const SLOT_TOP = SLOT_PRIME;
export const SLOT_MID = SLOT_PICK_ROW;

export const AD_FALLBACKS = {
  premium: {
    tag: '프리미엄',
    title: '우리동네 상단 노출',
    desc: '대표·추천 노출 — 상세등록 완료 후 이용',
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
