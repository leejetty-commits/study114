/**
 * 카카오(Daum) 우편번호 — 주소 자동완성 · 지번→도로명 매핑
 * Key 불필요 · https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js
 */

const SCRIPT_SRC = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';

/** @type {Promise<void>|null} */
let loadPromise = null;

function getPostcodeCtor() {
  const w = /** @type {any} */ (window);
  return w.kakao?.Postcode || w.daum?.Postcode || null;
}

/** @returns {Promise<void>} */
export function loadKakaoPostcode() {
  if (getPostcodeCtor()) {
    return Promise.resolve();
  }
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('우편번호 스크립트 로드 실패')));
      if (getPostcodeCtor()) resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => {
      if (!getPostcodeCtor()) {
        reject(new Error('우편번호 서비스를 초기화하지 못했습니다.'));
        return;
      }
      resolve();
    };
    script.onerror = () => reject(new Error('우편번호 스크립트 로드 실패'));
    document.head.appendChild(script);
  });

  return loadPromise;
}

/**
 * 지번 선택 시에도 도로명 우선 저장 (autoRoadAddress로 변환).
 * @param {Record<string, string>} data
 * @returns {{ zonecode: string, roadAddress: string, jibunAddress: string, convertedFromJibun: boolean, buildingExtra: string }}
 */
export function normalizePostcodeResult(data) {
  const zonecode = String(data.zonecode || '').trim();
  const jibunAddress = String(data.jibunAddress || data.autoJibunAddress || '').trim();
  let roadAddress = String(data.roadAddress || '').trim();
  let convertedFromJibun = false;

  if (!roadAddress && data.autoRoadAddress) {
    roadAddress = String(data.autoRoadAddress).trim();
    convertedFromJibun = true;
  }
  if (!roadAddress && data.userSelectedType === 'J' && data.autoRoadAddress) {
    roadAddress = String(data.autoRoadAddress).trim();
    convertedFromJibun = true;
  }
  if (!roadAddress) {
    // 도로명 미매핑 극히 드문 경우 — 선택한 기본 주소 사용
    roadAddress = String(data.address || jibunAddress).trim();
  }

  let buildingExtra = '';
  const bname = String(data.bname || '');
  if (bname && /[동로가]$/.test(bname)) {
    buildingExtra = bname;
  }
  if (data.buildingName && data.apartment === 'Y') {
    buildingExtra += (buildingExtra ? `, ${data.buildingName}` : data.buildingName);
  }
  if (buildingExtra) {
    buildingExtra = ` (${buildingExtra})`;
  }

  if (data.userSelectedType === 'J' && data.roadAddress) {
    // 지번을 골랐지만 도로명이 있으면 도로명으로 저장
    roadAddress = String(data.roadAddress).trim();
    convertedFromJibun = true;
  }

  return { zonecode, roadAddress, jibunAddress, convertedFromJibun, buildingExtra };
}

/**
 * @param {(result: ReturnType<typeof normalizePostcodeResult>) => void} onComplete
 * @param {{ width?: number|string, height?: number|string }=} options
 */
export async function openKakaoPostcode(onComplete, options = {}) {
  await loadKakaoPostcode();
  const Postcode = getPostcodeCtor();
  if (!Postcode) {
    throw new Error('우편번호 서비스를 사용할 수 없습니다.');
  }

  new Postcode({
    oncomplete(data) {
      onComplete(normalizePostcodeResult(data));
    },
    width: options.width ?? '100%',
    height: options.height ?? '100%',
  }).open({ popupTitle: '주소 검색' });
}
