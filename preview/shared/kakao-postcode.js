/**
 * 카카오(Daum) 우편번호 — 주소 자동완성 · 지번→도로명 매핑
 * Key 불필요 · https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js
 *
 * OS 팝업은 비동기 스크립트 로드 뒤 window.open이 막히고,
 * 막히면 레이어가 기본정보 수정창(오렌지) 안에 끼어 잘린다.
 * 그래서 항상 문서 최상단의 옮길 수 있는 레이어에 embed 한다.
 */

import { bindDraggableDialog } from './draggable-dialog.js';

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

function ensurePostcodeStyle() {
  if (document.getElementById('study114-postcode-style')) return;
  const style = document.createElement('style');
  style.id = 'study114-postcode-style';
  style.textContent = `
    .study114-postcode-overlay {
      position: fixed;
      inset: 0;
      z-index: 5000;
      background: rgb(15 23 42 / 0.42);
    }
    .study114-postcode-dialog {
      position: fixed;
      z-index: 5001;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background: #fff;
      border-radius: 0.85rem;
      border: 1px solid #cbd5e1;
      box-shadow: 0 1.25rem 3rem rgb(15 23 42 / 0.28);
    }
    .study114-postcode-dialog__head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      flex: 0 0 auto;
      padding: 0.65rem 0.85rem;
      background: #1e293b;
      color: #fff;
      cursor: move;
      touch-action: none;
      user-select: none;
    }
    .study114-postcode-dialog__title {
      margin: 0;
      font-size: 0.95rem;
      font-weight: 700;
    }
    .study114-postcode-dialog__close {
      border: 0;
      background: rgb(255 255 255 / 0.16);
      width: 1.85rem;
      height: 1.85rem;
      border-radius: 999px;
      color: #fff;
      font-size: 1.2rem;
      line-height: 1;
      cursor: pointer;
      touch-action: auto;
    }
    .study114-postcode-dialog__body {
      flex: 1 1 auto;
      min-height: 0;
      background: #fff;
    }
  `;
  document.head.appendChild(style);
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

  ensurePostcodeStyle();
  document.getElementById('study114-postcode-overlay')?.remove();

  const width = Math.min(Number(options.width) > 0 ? Number(options.width) : 480, Math.max(280, window.innerWidth - 24));
  const height = Math.min(
    Number(options.height) > 0 ? Number(options.height) : 620,
    Math.max(360, window.innerHeight - 24),
  );
  const left = Math.max(12, Math.round((window.innerWidth - width) / 2));
  const top = Math.max(12, Math.round((window.innerHeight - height) / 2));

  const overlay = document.createElement('div');
  overlay.id = 'study114-postcode-overlay';
  overlay.className = 'study114-postcode-overlay';
  overlay.innerHTML = `
    <div class="study114-postcode-dialog" role="dialog" aria-modal="true" aria-labelledby="study114-postcode-title">
      <div class="study114-postcode-dialog__head">
        <p id="study114-postcode-title" class="study114-postcode-dialog__title">주소 검색</p>
        <button type="button" class="study114-postcode-dialog__close" data-postcode-close aria-label="닫기">×</button>
      </div>
      <div class="study114-postcode-dialog__body"></div>
    </div>
  `;
  document.body.appendChild(overlay);

  const dialog = overlay.querySelector('.study114-postcode-dialog');
  const head = overlay.querySelector('.study114-postcode-dialog__head');
  const wrap = overlay.querySelector('.study114-postcode-dialog__body');
  if (!(dialog instanceof HTMLElement) || !(head instanceof HTMLElement) || !(wrap instanceof HTMLElement)) {
    overlay.remove();
    throw new Error('주소 검색 창을 열지 못했습니다.');
  }
  dialog.style.left = `${left}px`;
  dialog.style.top = `${top}px`;
  dialog.style.width = `${width}px`;
  dialog.style.height = `${height}px`;

  const cleanup = () => overlay.remove();
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) cleanup();
  });
  overlay.querySelector('[data-postcode-close]')?.addEventListener('click', cleanup);
  bindDraggableDialog(dialog, head, { zIndex: 5001 });
  wrap.style.height = `${Math.max(280, height - (head.getBoundingClientRect().height || 48))}px`;

  new Postcode({
    oncomplete(data) {
      cleanup();
      Promise.resolve(onComplete(normalizePostcodeResult(data))).catch((err) => {
        window.alert(err instanceof Error ? err.message : '주소를 적용하지 못했습니다.');
      });
    },
    onclose() {
      cleanup();
    },
    width: '100%',
    height: '100%',
  }).embed(wrap);
}
