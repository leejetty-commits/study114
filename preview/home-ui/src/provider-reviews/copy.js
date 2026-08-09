/**
 * 공급자 후기(provider reviews) copy — 학생 검토함(student-review)·커뮤니티 해결후기와 분리
 */

/** @type {Record<'consultation'|'experience', string>} */
export const REVIEW_ORIGIN_LABELS = {
  consultation: '상담만 했어요',
  experience: '이용/수업 경험이 있어요',
};

export const COMMON_POINT_TAGS = ['설명이 쉬워요', '상담이 편해요', '응답이 빨라요', '아이와 잘 맞아요'];
export const STUDY_ROOM_POINT_TAGS = ['동선이 편해요', '분위기가 안정적이에요', '관리가 꼼꼼해요'];
export const TUTOR_POINT_TAGS = ['개념 설명이 잘해요', '숙제 관리가 좋아요', '시간 약속이 정확해요'];

/** @param {'study_room'|'tutor'} providerType */
export function pointTagsForProvider(providerType) {
  const extra = providerType === 'tutor' ? TUTOR_POINT_TAGS : STUDY_ROOM_POINT_TAGS;
  return [...COMMON_POINT_TAGS, ...extra];
}

export const PROVIDER_REVIEW_COPY = {
  sectionTitle: '후기',
  guestTeaser: '로그인 후 후기를 확인할 수 있습니다.',
  writeCta: '후기 남기기',
  writeTitle: '후기 남기기',
  originQuestion: '어떤 경험이었나요?',
  tagsQuestion: '좋았던 점을 골라주세요 (1~3개)',
  bodyPlaceholder: '상담이나 이용 경험에서 좋았던 점을 짧게 적어주세요.',
  submit: '후기 등록',
  replyLabel: '공급자 답글',
  replyCta: '답글 남기기',
  replyPlaceholder: '감사 인사나 운영 안내를 짧게 남겨 주세요. (연락처·외부링크 금지)',
  replySubmit: '답글 등록',
  empty: '아직 등록된 후기가 없습니다.',
  bodyMin: 20,
  bodyMax: 300,
  replyMax: 200,
  /** 학생 검토함과 혼동 방지 */
  notStudentReviewNote: '이 후기는 학부모·학생이 남긴 이용 후기입니다. (학생 검토함과 다릅니다)',
};

/** @param {string|null|undefined} reason */
export function writeBlockedMessage(reason) {
  if (reason === 'login') return '로그인 후 후기를 남길 수 있습니다.';
  if (reason === 'owner') return '본인 프로필에는 후기를 남길 수 없습니다.';
  if (reason === 'role') return '학부모/학생 역할로 로그인한 뒤 후기를 남길 수 있습니다.';
  if (reason === 'already_written') return '이미 이 대상에 후기를 남겼습니다.';
  if (reason === 'no_thread') return '쪽지로 상담한 뒤에 후기를 남길 수 있습니다.';
  return '지금은 후기를 남길 수 없습니다.';
}
