/**
 * 탈퇴 사유 받기 문구·선택지 (승인 2026-10-14 · docs/worklog/2026/10/2026-10-14-member-mail-4.md §4-③ · 안내 문구는 §5-8에서 다시 승인)
 * 규칙 정본: docs/internal/74-member-mail-lock.md §1-4 · 서버 선택지: src/Auth/WithdrawReasonService.php
 */
export const WITHDRAW_REASON_COPY = {
  title: '떠나시는 이유를 알려 주시겠어요? (선택)',
  lead: '고르지 않아도 탈퇴할 수 있어요. 알려 주신 이유는 더 좋은 동네를 만드는 데만 써요.',
  otherPlaceholder: '한 줄로 적어 주세요',

  pageTitle: '떠나시는 이유를 알려 주시겠어요?',
  pageLead: '하나만 골라 주시면 돼요. 알려 주신 이유는 더 좋은 동네를 만드는 데만 써요.',
  submit: '보내기',
  sending: '보내는 중…',
  done: '알려 주셔서 고마워요. 남겨 주신 한마디로 우리 동네를 더 좋게 만들게요.',
  invalid: '이 링크는 이미 쓰였거나 30일이 지났어요. 알려 주시려던 마음만으로도 고마워요.',
  loading: '잠시만요.',
  failed: '보내지 못했어요. 잠시 뒤 다시 시도해 주세요.',
  pickOne: '이유를 하나 골라 주세요.',
  home: '우동공과 홈으로',
};

export const WITHDRAW_REASON_OTHER = 'other';

/** 역할별 선택지 (화면 순서) */
export const WITHDRAW_REASON_ROLE_CODES = {
  student: ['found_teacher', 'no_match'],
  study_room: ['enough_students', 'no_inquiry', 'cost'],
  tutor: ['enough_students', 'no_inquiry', 'cost'],
};

/** 모두에게 보이는 선택지 (역할별 선택지 뒤) */
export const WITHDRAW_REASON_COMMON_CODES = ['inconvenient', 'other_service', 'taking_break', WITHDRAW_REASON_OTHER];

const LABELS = {
  found_teacher: '좋은 선생님을 찾았어요',
  no_match: '원하는 선생님·공부방이 없었어요',
  enough_students: '원생·학생을 충분히 만났어요',
  no_inquiry: '쪽지(문의)가 오지 않았어요',
  cost: '비용이 부담돼요',
  inconvenient: '쓰기가 불편했어요',
  other_service: '다른 서비스를 쓰기로 했어요',
  taking_break: '잠시 쉬어 가려고요',
  other: '기타 (한 줄로 적어 주세요)',
};

const ROLE_LABELS = {
  study_room: { enough_students: '원생이 충분히 모였어요' },
  tutor: { enough_students: '학생을 충분히 만났어요' },
};

/** @param {string} role study_room | tutor | student | '' @param {string} code */
export function withdrawReasonLabel(role, code) {
  return ROLE_LABELS[role]?.[code] || LABELS[code] || code;
}

/** @param {string} role @returns {string[]} 이 역할에게 보이는 선택지. 역할을 모르면 공통 선택지만 */
export function withdrawReasonCodes(role) {
  return [...(WITHDRAW_REASON_ROLE_CODES[role] || []), ...WITHDRAW_REASON_COMMON_CODES];
}
