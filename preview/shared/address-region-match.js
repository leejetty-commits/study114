/**
 * 카카오 우편번호 결과 → regions 마스터(행정동) 매칭
 * 단지 시드(더미) 없이 주소검색만으로 행정동 코드를 찾는다.
 */

function compactSido(value) {
  return String(value || '')
    .replace(/특별자치시|특별자치도|특별시|광역시|자치도/g, '')
    .replace(/도$/, '')
    .replace(/\s+/g, '');
}

function lastToken(label) {
  const parts = String(label || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return parts[parts.length - 1] || '';
}

function firstToken(label) {
  return String(label || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)[0] || '';
}

function dongOf(region) {
  return String(region?.dong_name || lastToken(region?.label)).trim();
}

function sigunguOf(region) {
  return String(region?.sigungu_name || '').replace(/\s+/g, '');
}

function sidoOf(region) {
  return compactSido(region?.sido_name || firstToken(region?.label));
}

/**
 * @param {Array<{id: number|string, label?: string, sido_name?: string, sigungu_name?: string, dong_name?: string}>} regions
 * @param {{ sido?: string, sigungu?: string, bname?: string }} result
 * @returns {{id: number|string, label?: string}|null}
 */
export function matchRegion(regions, result) {
  const dong = String(result?.bname || '').trim();
  if (!dong || !Array.isArray(regions) || regions.length === 0) return null;

  const sidoKey = compactSido(result?.sido);
  const sigunguKey = String(result?.sigungu || '').replace(/\s+/g, '');

  const scored = [];
  regions.forEach((region) => {
    const dongName = dongOf(region);
    if (!dongName) return;
    let score = 0;
    if (dongName === dong) score += 12;
    else if (dongName.startsWith(dong) || dong.startsWith(dongName.replace(/[0-9]+동$/, '동'))) score += 6;
    else return;

    const sidoName = sidoOf(region);
    if (sidoKey && sidoName && sidoName === sidoKey) score += 5;
    const sigunguName = sigunguOf(region);
    if (sigunguKey && sigunguName) {
      if (sigunguName === sigunguKey) score += 5;
      else if (sigunguName.includes(sigunguKey) || sigunguKey.includes(sigunguName)) score += 3;
    }
    scored.push({ region, score });
  });

  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];
  if (!best) return null;
  if (sidoKey && sidoOf(best.region) && sidoOf(best.region) !== sidoKey && best.score < 17) {
    return null;
  }
  return best.region;
}

/**
 * @param {ReturnType<typeof import('./kakao-postcode.js').normalizePostcodeResult>} result
 */
export function displayRoad(result) {
  return [result?.roadAddress, result?.buildingExtra].filter(Boolean).join(' ').trim();
}
