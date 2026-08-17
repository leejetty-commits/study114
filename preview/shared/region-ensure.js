/**
 * 카카오 우편번호 결과 → regions 마스터에 동이 없으면 추가한다.
 * 전국 동을 미리 시드하지 않고, 검색으로 고른 동만 적재한다.
 *
 * @param {ReturnType<typeof import('./kakao-postcode.js').normalizePostcodeResult>} result
 * @returns {Promise<{id:number|string,label:string,dong_name?:string,sido_name?:string,sigungu_name?:string}>}
 */
export async function ensureRegionFromKakao(result) {
  const res = await fetch('/api/auth/regions.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      action: 'ensure',
      sido: result?.sido || '',
      sigungu: result?.sigungu || '',
      sigungu_code: result?.sigunguCode || '',
      bcode: result?.bcode || '',
      bname: result?.bname || '',
      hname: result?.hname || '',
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!data?.ok || !data.region?.id) {
    throw new Error(data?.message || '이 주소의 행정동을 저장하지 못했습니다. 다른 주소를 검색해 주세요.');
  }
  return data.region;
}
