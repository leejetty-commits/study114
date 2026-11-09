/** 우측 레일 홍보영상. id는 11자 유튜브 ID만. 비어 있으면 슬롯을 그리지 않는다. */
export const PROMO_VIDEOS = {
  study_room: { id: 'op-Cudsweew', title: '공부방 홍보영상' },
  tutor: { id: '', title: '과외쌤 홍보영상' },
};

/** @param {unknown} id */
export function isValidYoutubeId(id) {
  return /^[A-Za-z0-9_-]{11}$/.test(String(id ?? ''));
}
