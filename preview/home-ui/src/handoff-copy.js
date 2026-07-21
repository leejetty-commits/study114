/**
 * 25장 — Handoff copy · Compare Bar · Empty/Max · 찜 라벨
 * docs/ssot/25-decision-handoff-layer.md §9 · §14
 * Empty/Max 정본(신규): docs/ssot/29-empty-error-permission-ux.md · empty-state-copy.js
 */

import { getCompareMaxCopy } from './empty-state-copy.js';

/** @param {number} count @param {number} max */
export function compareRibbonText(count, max) {
  return `비교 중 ${count}/${max}`;
}

/** @param {number} count @param {number} max */
export function compareToastAdded(count, max) {
  return `비교에 추가됨 · ${count}/${max}`;
}

/** @param {number} count @param {number} max */
export function compareOpenCta(count, max) {
  return `비교 ${count}/${max} 열기`;
}

/** Source Route return CTA 라벨 (25§4-4 · §6 2차) */
export const RETURN_CTA = {
  wishlist: '찜 목록으로',
  studentReview: '찜 목록 열기',
};

export const WISH_TOAST = {
  added: '찜했습니다',
  removed: '찜을 해제했습니다',
};

/** @param {number} max */
export function compareBarHint(max) {
  return `⇄로 선택 · 최대 ${max}개`;
}

export const COMPARE_BAR_LABELS = {
  open: '비교하기',
  clear: '비우기',
};

export const WISH_LABELS = {
  add: '찜하기',
  remove: '찜 해제',
};

/** @param {number} max */
export function compareErrorMax(max) {
  const { body } = getCompareMaxCopy(max);
  return body;
}

export const COMPARE_ERROR_INELIGIBLE =
  '비교 필수 항목을 충족하지 않아 담을 수 없습니다.';

export const COMPARE_ERROR_MIXED_KIND =
  '공부방과 과외쌤은 서로 다른 기준으로 비교해야 합니다.';

export const COMPARE_ERROR_STUDENT =
  '학생 정보 보호를 위해 학생은 비교할 수 없습니다.';

/** @deprecated empty-state-copy.js `getEmptyCopy` / `getCompareMaxCopy` 사용 */
export function getHandoffEmptyLine(key) {
  const map = {
    wishlist: '아직 찜한 후보가 없습니다. 검색에서 마음에 드는 후보를 저장해 보세요.',
    recent: '최근에 본 후보가 없습니다.',
    compareNeedOneMore: '비교하려면 후보를 하나 더 담아주세요.',
    studentReview: '아직 찜한 학생이 없습니다. 마음에 드는 의뢰를 저장해 두세요.',
  };
  return map[key] || '';
}

/** 25§10 Lifecycle-aware basket */
export const LIFECYCLE_BASKET = {
  profileStopped: '현재 공개가 중지된 대상입니다',
};

/** P21-05 ↔ P25-S10 딥링크 배너 · CTA */
export const HANDOFF_DEEPLINK = {
  reviewFlow: '찜하기 → 찜 목록 → 쪽지 준비/보내기',
  reviewFromAccess: '학생 접근·쪽지에서 이동했습니다. 찜해 둔 학생에게 쪽지를 이어가세요.',
  reviewFromExposure: '노출·상담에서 이동했습니다. 찜해 둔 학생에게 상담·쪽지를 이어가세요.',
  accessFromReview: '찜 목록에서 이동했습니다. 쪽지 가능 여부와 남은 메모권을 확인하세요.',
  reviewBridgeLead: '찜해 둔 학생을 다시 보고 쪽지를 준비합니다.',
  reviewBridgeCta: '찜 목록 열기',
  providerRegCtaTutor: '학생 접근·쪽지',
  providerRegCtaStudyRoom: '노출·상담',
};

/** Provider lane — P25-S10 (UI 라벨은 찜, 내부 경로는 student-review 유지) */
export const STUDENT_REVIEW = {
  listTitle: '관심 학생',
  addCta: '찜하기',
  removeCta: '찜 해제',
  itemLabelTutor: '관심학생',
  itemLabelStudyRoom: '상담후보',
  toastAdded: '찜했습니다',
  toastRemoved: '찜을 해제했습니다',
  note: '관심 있는 학생을 저장해 두고, 준비가 되었을 때 쪽지를 이어가세요.',
  lifecycleHidden: '현재 공개가 중지된 의뢰입니다',
};

/** @param {'tutor'|'study_room'} role */
export function studentReviewItemLabel(role) {
  return role === 'study_room' ? STUDENT_REVIEW.itemLabelStudyRoom : STUDENT_REVIEW.itemLabelTutor;
}

/** 25§6 resume token — 최근열람 · 상세 Entry Context Ribbon */
export const RESUME_ROUTE_LABELS = {
  search: '검색에서',
  parent: '학부모 홈에서',
  detail: '상세에서',
  wishlist: '찜 목록에서',
  mypage: '마이페이지에서',
  'student-review': '찜 목록에서',
};

export const RESUME_ACTION_LABELS = {
  view_detail: '상세 열람',
  wish_add: '찜함',
  compare_add: '비교 담음',
  review_add: '찜함',
};

/** 25§2차 판단 스티커 — basket 행 */
export const DECISION_STICKER = {
  wish: '찜',
  compare: '비교',
  review: '찜',
};

/** 24·25§2차 문의 전 체크리스트 (상세 모달) */
export const PRE_CONTACT_CHECKLIST = {
  title: '문의 전 확인',
  study_room_parent: ['상담 수용 상태를 확인했습니다', '비용·학년대를 다시 봤습니다'],
  tutor_parent: ['과외비·수업 방식을 확인했습니다', '활동 지역을 맞췄습니다'],
  student_tutor: ['찜·요청 조건을 확인했습니다', '메모권·잔여 횟수를 확인했습니다'],
  student_study_room: ['찜·요청 조건을 확인했습니다', '상담 수용 상태를 확인했습니다'],
};
