/** @deprecated 기본정보 주소칸은 shared/study-room-basic-form.js 로 통합됨 */
export function renderLocationFields() {
  return '';
}

export function bindLocationFieldEvents() {
  return { currentBasis: () => 'dong' };
}

export function validateLocationFields() {
  return null;
}
