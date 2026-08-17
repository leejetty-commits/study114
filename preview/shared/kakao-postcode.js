/**
 * 카카오(Daum) 우편번호 — 주소 자동완성 · 지번→도로명 매핑
 * Key 불필요 · https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js
 *
 * 페이지 안 레이어는 검색 입력 때 줄어드는 문제가 있어, OS 팝업으로 연다.
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
 * @returns {{
 *   zonecode: string,
 *   roadAddress: string,
 *   jibunAddress: string,
 *   convertedFromJibun: boolean,
 *   buildingExtra: string,
   *   sido: string,
   *   sigungu: string,
   *   sigunguCode: string,
   *   bcode: string,
   *   bname: string,
   *   hname: string,
   *   buildingName: string,
   *   apartment: boolean,
   * }}
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

  return {
    zonecode,
    roadAddress,
    jibunAddress,
    convertedFromJibun,
    buildingExtra,
    sido: String(data.sido || '').trim(),
    sigungu: String(data.sigungu || '').trim(),
    sigunguCode: String(data.sigunguCode || '').trim(),
    bcode: String(data.bcode || '').trim(),
    bname: String(data.bname || data.hname || '').trim(),
    hname: String(data.hname || '').trim(),
    buildingName: String(data.buildingName || '').trim(),
    apartment: String(data.apartment || '').toUpperCase() === 'Y',
  };
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

  const width = Number(options.width) > 0 ? Number(options.width) : 500;
  const height = Number(options.height) > 0 ? Number(options.height) : 600;
  const left = Math.round(
    (window.screenX || 0) + Math.max(0, ((window.outerWidth || window.innerWidth) - width) / 2),
  );
  const top = Math.round(
    (window.screenY || 0) + Math.max(0, ((window.outerHeight || window.innerHeight) - height) / 2),
  );

  new Postcode({
    oncomplete(data) {
      Promise.resolve(onComplete(normalizePostcodeResult(data))).catch((err) => {
        window.alert(err instanceof Error ? err.message : '주소를 적용하지 못했습니다.');
      });
    },
    width,
    height,
  }).open({
    popupTitle: '주소 검색',
    popupKey: 'study114-postcode',
    left,
    top,
  });
}
