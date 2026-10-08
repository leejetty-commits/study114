/**
 * 22장 — 등록·노출 lifecycle 공통 원칙 (횡단 copy · UI 라벨). 기본등록 완료 = 노출, 숨김은 관리자만.
 * SSOT: docs/ssot/22-platform-lifecycle-principles.md
 */

/** @typedef {'draft'|'published'|'hidden'|'pending'} ProfileStatusKey */
/** @typedef {'draft'|'published'|'hidden'|'deleted'} ExposureStatusKey */

/** t1504. 숨김 카드 주인 마이페이지 한 줄. 다시 켜는 버튼은 없다. */
export const ADMIN_HIDE_OWNER_LINE =
  '이 카드는 지금 홈·찾기에서 숨김 처리되었습니다. 궁금한 점은 고객센터 운영문의로 남겨 주세요.';

export const ADMIN_HIDE_CONTACT_PATH = '/support/contact?category=unhide_request';

const ADMIN_HIDE_CONTACT_LABEL = '고객센터 운영문의';

/** @param {boolean} hidden */
export function renderAdminHideOwnerLine(hidden) {
  if (!hidden) return '';
  const href = `#${ADMIN_HIDE_CONTACT_PATH}`;
  return `<p class="mp-admin-hide-line" data-admin-hide-line>${ADMIN_HIDE_OWNER_LINE} <a class="btn btn--secondary btn--sm" href="${href}" data-nav="${ADMIN_HIDE_CONTACT_PATH}">${ADMIN_HIDE_CONTACT_LABEL}</a></p>`;
}

export const PROFILE_STATUS_LABELS = {
  draft: '저장중',
  published: '노출중',
  /** 회원 배지. 관리자 화면 라벨(숨김)은 AdminExposure·a28 copy가 따로 가진다. */
  hidden: '관리자 숨김',
  /** @deprecated 22§3 */
  pending: '저장중',
};

export const EXPOSURE_STATUS_LABELS = {
  draft: '저장중',
  published: '노출중',
  /** 회원 배지. 관리자 화면 라벨(숨김)은 AdminExposure·a28 copy가 따로 가진다. */
  hidden: '관리자 숨김',
  deleted: '삭제',
};

export const FORBIDDEN_LIFECYCLE_UI_TERMS = [
  '검토중',
  '심사 대기',
  '심사',
  '검수',
  '반려',
  '승인 대기',
  '검증 완료',
  '검증 반려',
  '인증쌤',
  '플랫폼 심사 통과',
  'pending 심사',
  '검수 대기',
  '신뢰도 점수',
  '인증됨',
  '플랫폼 확인 완료',
  '운영자 확인 완료',
  '공식 인증',
  '플랫폼 보증',
];

/** @param {string} [status] */
export function normalizeProfileStatus(status) {
  if (status === 'pending') return 'draft';
  return status || 'draft';
}

/** @param {string} [status] */
export function profileStatusLabel(status) {
  const key = normalizeProfileStatus(status);
  return PROFILE_STATUS_LABELS[/** @type {ProfileStatusKey} */ (key)] || key || '—';
}

/** @param {string} [status] */
export function exposureStatusLabel(status) {
  return EXPOSURE_STATUS_LABELS[/** @type {ExposureStatusKey} */ (status)] || status || '—';
}

/** @param {number} publicCount */
export function formatSubmissionDocPublicLabel(publicCount) {
  if (!publicCount) return '—';
  return `제출자료 ${publicCount}개 공개`;
}

/** @param {number} publicTrustCount @param {number} publicDocCount */
export function formatTrustInfoStrip(publicTrustCount, publicDocCount) {
  const parts = [];
  if (publicTrustCount > 0) parts.push(`신뢰정보 ${publicTrustCount}개 공개`);
  if (publicDocCount > 0) parts.push(`제출자료 ${publicDocCount}개 공개`);
  if (!parts.length) return '공개된 신뢰정보 없음';
  return parts.join(' · ');
}

export function formatProofDocumentPublic(proof_document_available) {
  return proof_document_available ? '공개함' : '—';
}

export function formatVerificationDocCountPublic(item) {
  const n = item?.verification_doc_count ?? (item?.proof_document_available ? 1 : 0);
  if (!n) return '—';
  return formatSubmissionDocPublicLabel(n);
}

export const LIFECYCLE_FOOTNOTE_REG =
  '22장 · 운영자 심사·반려 없음 · 기본등록을 마치면 카드가 바로 노출됩니다.';

export const LIFECYCLE_FOOTNOTE_SUBMISSION =
  '22장 · 승인·반려·검수중 UI 없음 · 공개된 자료를 보고 직접 판단합니다.';

export const TRUST_PLATFORM_DISCLAIMER =
  '제출자료는 등록자가 공개한 참고 정보입니다. 우동공과는 해당 서류를 인증하거나 보증하지 않으며, 중요한 서류는 필요한 경우 발급기관 기준으로 직접 다시 확인해 주세요.';

export const SUBMISSION_DOCS_LEAD =
  '제출 여부와 공개 범위만 표시하며 플랫폼이 심사하거나 반려하지 않습니다.';
