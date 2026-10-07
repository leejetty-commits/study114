/**
 * 카카오 주소 결과에서 아파트단지 이름만 뽑는다.
 * apartment 가 불리언 true 이고 buildingName 을 trim 한 값이 있을 때만 그 이름.
 * @param {{ apartment?: boolean|string, buildingName?: string }|null|undefined} result
 * @returns {string}
 */
export function complexNameFromKakao(result) {
  const name = String(result?.buildingName || '').trim();
  if (result?.apartment === true && name !== '') return name;
  return '';
}
