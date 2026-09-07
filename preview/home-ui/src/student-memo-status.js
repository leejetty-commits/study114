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
