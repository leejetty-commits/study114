/**
 * 학생 쪽지 수신 — exposure_status(공개)와 분리.
 * 공부방 inquiry_status의 open/paused에 대응.
 */

/** @param {string|null|undefined} status */
export function isStudentMemoReceiving(status) {
  return status === 'open';
}

/** @param {object} item */
export function studentMemoContactLabel(item) {
  if (item?.exposure_status !== 'published') {
    return { ok: false, label: '공개 중이 아님' };
  }
  if (!isStudentMemoReceiving(item?.memo_status ?? 'open')) {
    return { ok: false, label: '지금은 쪽지 안 받음' };
  }
  return { ok: true, label: '쪽지 받는 중' };
}

/** 학생 쪽지설정(P19-05) 화면 문구 — 과외쌤 쪽지설정 말투와 같게 (287) */
export const STUDENT_MEMO_SETTINGS_COPY = {
  lead: '선생님·공부방이 나에게 쪽지를 보낼 수 있는지 정해요.',
  badgeReceiving: '지금은 쪽지 받는 중',
  badgeClosed: '지금은 쪽지 안 받음',
};

/** @param {string|null|undefined} status 저장된 memo_status */
export function studentMemoSettingsBadge(status) {
  const on = isStudentMemoReceiving(status ?? 'open');
  return {
    on,
    label: on ? STUDENT_MEMO_SETTINGS_COPY.badgeReceiving : STUDENT_MEMO_SETTINGS_COPY.badgeClosed,
  };
}
