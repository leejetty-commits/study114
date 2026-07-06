/**
 * 22장 — 등록·공개 lifecycle 공통 원칙 (횡단 copy · UI 라벨)
 * SSOT: docs/ssot/22-platform-lifecycle-principles.md
 */

/** @typedef {'draft'|'published'|'hidden'|'pending'} ProfileStatusKey */
/** @typedef {'draft'|'published'|'hidden'|'deleted'} ExposureStatusKey */

export const PROFILE_STATUS_LABELS = {
  draft: '저장중',
  published: '공개중',
  hidden: '숨김',
  /** @deprecated 22§3 */
  pending: '저장중',
};

export const EXPOSURE_STATUS_LABELS = {
  draft: '저장중',
  published: '공개중',
  hidden: '숨김',
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

/** @param {boolean} canPublish @param {number} [missingCount] */
export function publishReadinessLabel(canPublish, missingCount = 0) {
  if (canPublish) return '공개 가능';
  return missingCount > 0 ? `공개 준비 미완료 · ${missingCount}항목` : '공개 준비 미완료';
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
  '22장 · 운영자 심사·반려 없음 · 공개는 당사자가 직접 전환합니다.';

export const LIFECYCLE_FOOTNOTE_SUBMISSION =
  '22장 · 승인·반려·검수중 UI 없음 · 공개된 자료를 보고 직접 판단합니다.';

export const LIFECYCLE_PUBLISH_CONFIRM_DIRECT =
  '플랫폼 심사 없이 제가 직접 공개합니다 (22장)';

export const LIFECYCLE_PUBLISH_CONFIRM_NOTE =
  '공개 confirm은 운영자 심사가 아니라 당사자 본인의 자기확인입니다.';

export const TRUST_PLATFORM_DISCLAIMER =
  '제출자료는 등록자가 공개한 참고 정보입니다. 우동공과는 해당 서류를 인증하거나 보증하지 않으며, 중요한 서류는 필요한 경우 발급기관 기준으로 직접 다시 확인해 주세요.';

export const SUBMISSION_DOCS_LEAD =
  'P15-10 · 21장 — 제출 여부·공개 범위만 표시 · 플랫폼 심사·반려 없음';

export const REGISTER_UI_PROFILE_STATUS_OPTIONS = [
  { value: 'draft', label: 'draft · 저장중' },
  { value: 'published', label: 'published · 공개 (운영센터에서도 확인 권장)' },
];
