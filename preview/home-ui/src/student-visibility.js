/**
 * 학생 요청문/특이요청 열람 권한
 *
 * 요청문·특이요청 원문은 유료 공급자(픽·프라임 등)·관리자·학생 본인만 본다.
 * 그 외에는 서버가 원문을 빈 문자열로 내려보낸다. 블라인드(실명·전화·상세주소)는 유지.
 * 학생 피어는 비교범위(구조화)만.
 */

import { PERMISSION_DENIED_COPY } from './empty-state-copy.js';
import { isProviderPaid } from './messages/permissions.js';

/**
 * @param {string} [viewer]
 * @returns {boolean}
 */
export function isPaidProviderViewer(viewer) {
  if (viewer === 'admin') return true;
  if (viewer !== 'tutor' && viewer !== 'study_room') return false;
  return isProviderPaid();
}

function isProviderViewer(viewer) {
  return viewer === 'tutor' || viewer === 'study_room' || viewer === 'admin';
}

/**
 * @param {{ id?: number }} student
 * @param {{ viewer?: string }} [opts]
 */
export function getStudentProtectedVisibility(student, opts = {}) {
  const viewer = opts.viewer;
  const provider = isProviderViewer(viewer);
  return {
    requestSummary: provider,
    specialRequest: provider,
    isPaidProvider: isPaidProviderViewer(viewer),
  };
}

/** 무료 공급자 — 서버가 요청문·특이요청 원문을 빈 문자열로 보낼 때 */
export const EXPOSURE_PROVIDER_REQUEST_GATE_COPY = {
  title: '요청문은 노출 상품 이용 중인 공부방·과외쌤에게 보여요',
  body: '픽·프라임을 이용하면 학생이 남긴 요청문과 특이요청을 볼 수 있어요',
};

/** 학생 피어 열람 — 구조화 조건만 */
export const PEER_STUDENT_REQUEST_GATE_COPY = {
  title: '요청문은 비교 열람 범위가 아닙니다',
  body: '다른 학생의 요청문·특이요청사항은 노출 상품을 이용 중인 공부방·과외쌤만 볼 수 있어요. 금액·지역·과목 등 구조화 조건만 비교하세요.',
};

export const PAID_GATE_MESSAGE = PERMISSION_DENIED_COPY.paid.body;

/** 베이직 카드 「한 줄 요청」「특이요청」 칸 — 볼 수 없는 사람에게 보이는 잠금 문구 */
export const STUDENT_REQUEST_CARD_LOCK = {
  nonProvider: '선생님만 보기',
  unpaidProvider: '픽·프라임 이용 시 보기',
};
