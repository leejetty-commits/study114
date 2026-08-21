/**
 * 공급자 후기 copy — 지시문 1 잠금값을 화면이 바꾸지 않는다.
 * student-review(관심 학생)·커뮤니티 해결후기와 분리
 */

/** @type {Record<'consultation'|'experience', string>} */
export const REVIEW_ORIGIN_LABELS = {
  consultation: '상담만 했어요',
  experience: '이용/수업 경험이 있어요',
};

export const STUDY_ROOM_POINT_TAGS = [
  '공간이 깔끔해요',
  '분위기가 편안해요',
  '상담이 친절해요',
  '답변이 빨라요',
  '정보가 실제와 비슷해요',
  '동네 접근이 편해요',
];

export const TUTOR_POINT_TAGS = [
  '설명이 쉬워요',
  '꼼꼼해요',
  '숙제 관리가 좋아요',
  '학생을 잘 봐줘요',
  '전문성이 느껴져요',
  '피드백이 빨라요',
];

/** 하위 호환 — 공통 칩은 쓰지 않고 도메인 태그로만 분기 */
export const COMMON_POINT_TAGS = [];

/** @param {'study_room'|'tutor'} providerType */
export function pointTagsForProvider(providerType) {
  return providerType === 'tutor' ? [...TUTOR_POINT_TAGS] : [...STUDY_ROOM_POINT_TAGS];
}

export const REVIEW_POLICY = {
  maxCreates: 3,
  sheetLimit: 5,
  shopTeaserLimit: 3,
  snippetLen: 48,
  bodyMin: 20,
  bodyMax: 300,
  tagsMin: 1,
  tagsMax: 3,
  pageSize: 10,
};

export const PROVIDER_REVIEW_COPY = {
  sectionTitle: '후기',
  sheetSubtitle: '실제 이용자들이 남긴 이야기',
  guestTeaser: null,
  writeCta: '후기 남기기',
  manageCta: '내 후기 관리하기',
  closedCta: '현재는 새 후기를 받지 않아요',
  ineligibleCta: '후기 작성은 쪽지(상담/문의) 경험 후 가능해요',
  blockedCta: '이 대상에는 더 이상 후기를 남길 수 없어요',
  moreCta: '후기 더보기',
  writeTitle: '후기 남기기',
  writeGateMemoCta: '쪽지 보내고 이어가기',
  manageTitle: '내 후기 관리',
  originQuestion: '어떤 경험이었나요?',
  tagsQuestion: '좋았던 점을 골라주세요 (1~3개)',
  tagsHint: '선택한 태그만 후기와 함께 저장됩니다.',
  bodyLabel: '후기 본문',
  bodyPlaceholder: '상담이나 이용 경험에서 좋았던 점을 짧게 적어주세요.',
  publicConsent: '이 후기를 공개하는 데 동의합니다',
  submit: '후기 등록',
  saveEdit: '수정 저장',
  hideCta: '비공개',
  unhideCta: '공개로 전환',
  deleteCta: '삭제',
  empty: '아직 등록된 후기가 없습니다.',
  shopEmpty: '아직 등록된 후기가 없어요',
  emptyEligible: '첫 후기를 남겨 보세요.',
  bodyMin: REVIEW_POLICY.bodyMin,
  bodyMax: REVIEW_POLICY.bodyMax,
  inboxHub: '후기함',
  inboxWritten: '내가 쓴 후기',
  inboxReceived: '내가 관리하는 후기',
  inboxEmptyWritten: '아직 남긴 후기가 없어요. 카드의 후기 수에서 증언을 읽고 자격이 되면 남길 수 있어요.',
  inboxEmptyReceived: '아직 받은 후기가 없어요. 공개된 후기가 생기면 여기에서 모아서 볼 수 있어요.',
  blockCta: '후기차단',
  unblockCta: '후기차단 해제',
  writeOpenCta: '후기 받기',
  writeCloseCta: '새 후기 닫기',
  quotaHint: '이 대상에는 후기를 최대 3회까지 남길 수 있어요. 삭제한 후기도 횟수에 포함됩니다.',
};

/** 지시문 2 상태 문구 — cta_kind 매핑 */
export function ctaLabel(ctaKind) {
  if (ctaKind === 'write') return PROVIDER_REVIEW_COPY.writeCta;
  if (ctaKind === 'manage') return PROVIDER_REVIEW_COPY.manageCta;
  if (ctaKind === 'closed') return PROVIDER_REVIEW_COPY.closedCta;
  if (ctaKind === 'blocked') return PROVIDER_REVIEW_COPY.blockedCta;
  if (ctaKind === 'none') return '';
  return PROVIDER_REVIEW_COPY.ineligibleCta;
}

/** @param {string|null|undefined} reason */
export function writeBlockedMessage(reason) {
  if (reason === 'login' || reason === 'role' || reason === 'no_thread') {
    return PROVIDER_REVIEW_COPY.ineligibleCta;
  }
  if (reason === 'owner') return '본인 프로필에는 후기를 남길 수 없습니다.';
  if (reason === 'already_written') return PROVIDER_REVIEW_COPY.manageCta;
  if (reason === 'closed') return PROVIDER_REVIEW_COPY.closedCta;
  if (reason === 'quota') return '이 대상에는 후기를 더 남길 수 없습니다. (최대 3회)';
  if (reason === 'blocked') return PROVIDER_REVIEW_COPY.blockedCta;
  return PROVIDER_REVIEW_COPY.ineligibleCta;
}

/** @param {string} body */
export function reviewSnippet(body) {
  const text = String(body || '').trim();
  if (text.length <= REVIEW_POLICY.snippetLen) return text;
  return `${text.slice(0, REVIEW_POLICY.snippetLen)}…`;
}
