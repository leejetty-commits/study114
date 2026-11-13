/**
 * 홍보사진 — 원본 1장 업로드 후 서버가 Prime(16:9)·Basic(1:1) 파생본을 만든다.
 * 클라이언트는 형식·용량 검증과 초점(크롭) 1회 조정만 담당한다.
 * 작아도 거절하지 않는다 — 서버가 키운다. 픽셀 숫자는 사용자에게 보여 주지 않는다.
 */

import { bindDraggableDialog } from './draggable-dialog.js';

export const PROMO_IMAGE_SPEC = {
  accept: 'image/jpeg,image/png,image/webp',
  acceptExt: ['jpg', 'jpeg', 'png', 'webp'],
  maxBytes: 4 * 1024 * 1024,
  /** 업로드 전 브라우저 축소 긴 변 상한 */
  clientLongEdge: 2560,
  /** 소프트 안내 기준(거절 아님). 서버도 같은 기준으로 soft_small 판정. */
  minWidth: 800,
  minHeight: 600,
  maxCount: 5,
  recommended: '또렷한 사진',
};

export const PROMO_SOFT_SMALL_HINT = '작은 사진은 확대되어 화질이 좋지 않을 수 있어요. 그래도 올릴 수 있어요.';

function extOf(name) {
  const m = String(name || '')
    .toLowerCase()
    .match(/\.([a-z0-9]+)$/);
  return m ? m[1] : '';
}

/**
 * @param {File} file
 * @returns {Promise<{ width: number, height: number }>}
 */
export function readImageSize(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;
      URL.revokeObjectURL(url);
      resolve({ width, height });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('이미지를 읽을 수 없습니다. JPG, PNG, WebP만 올려 주세요.'));
    };
    img.src = url;
  });
}

/**
 * @param {File} file
 * @returns {Promise<string>} 오류 메시지. 통과면 빈 문자열.
 * 용량 초과는 거절하지 않는다 — shrinkPromoImageForUpload로 줄인 뒤 올린다.
 */
export async function validatePromoImageFile(file) {
  if (!file) return '파일을 선택해 주세요.';
  const ext = extOf(file.name);
  if (ext === 'heic' || ext === 'heif' || String(file.type || '').includes('heic') || String(file.type || '').includes('heif')) {
    return '이 형식은 아직 지원하지 않아요. JPG나 PNG로 바꿔 올려 주세요.';
  }
  const mimeOk =
    !file.type || ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.type);
  const extOk = PROMO_IMAGE_SPEC.acceptExt.includes(ext);
  if (!mimeOk && !extOk) {
    return 'JPG, PNG, WebP 파일만 올릴 수 있어요.';
  }
  try {
    const { width, height } = await readImageSize(file);
    if (width < 1 || height < 1) {
      return '이미지를 확인할 수 없어요.';
    }
  } catch (err) {
    return err instanceof Error ? err.message : '이미지를 확인할 수 없어요.';
  }
  return '';
}

/**
 * 긴 변 clientLongEdge·용량 maxBytes 이하로 브라우저에서 줄인다(JPEG/WebP).
 * 이미 작으면 원본 File을 그대로 돌려준다.
 * @param {File} file
 * @returns {Promise<File>}
 */
export async function shrinkPromoImageForUpload(file) {
  const maxEdge = PROMO_IMAGE_SPEC.clientLongEdge;
  const maxBytes = PROMO_IMAGE_SPEC.maxBytes;
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('이미지를 읽을 수 없어요.'));
      el.src = url;
    });
    const sw = img.naturalWidth || img.width;
    const sh = img.naturalHeight || img.height;
    const long = Math.max(sw, sh);
    const needResize = long > maxEdge || file.size > maxBytes;
    if (!needResize) {
      return file;
    }
    const scale = long > maxEdge ? maxEdge / long : 1;
    const tw = Math.max(1, Math.round(sw * scale));
    const th = Math.max(1, Math.round(sh * scale));
    const canvas = document.createElement('canvas');
    canvas.width = tw;
    canvas.height = th;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('이미지 캔버스를 만들 수 없어요.');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, tw, th);

    const preferWebp = String(file.type || '').includes('webp') || extOf(file.name) === 'webp';
    const mime = preferWebp && typeof canvas.toBlob === 'function' ? 'image/webp' : 'image/jpeg';
    const baseName = (file.name || 'photo').replace(/\.[^.]+$/, '') || 'photo';
    const outName = `${baseName}.${mime === 'image/webp' ? 'webp' : 'jpg'}`;

    let quality = 0.86;
    /** @type {Blob|null} */
    let blob = null;
    for (let i = 0; i < 8; i++) {
      blob = await new Promise((resolve) => {
        canvas.toBlob((b) => resolve(b), mime, quality);
      });
      if (!blob) break;
      if (blob.size <= maxBytes || quality <= 0.45) break;
      quality = Math.max(0.45, quality - 0.1);
    }
    if (!blob) {
      const dataUrl = canvas.toDataURL(mime, quality);
      const bin = atob(dataUrl.split(',')[1] || '');
      const arr = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      blob = new Blob([arr], { type: mime });
    }
    return new File([blob], outName, { type: mime, lastModified: Date.now() });
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * 작아도 업로드는 통과. 소프트 안내 문구만 돌려준다(픽셀 숫자 없음).
 * @param {File} file
 * @returns {Promise<string>}
 */
export async function softHintPromoImageFile(file) {
  try {
    const { width, height } = await readImageSize(file);
    if (width < PROMO_IMAGE_SPEC.minWidth || height < PROMO_IMAGE_SPEC.minHeight) {
      return PROMO_SOFT_SMALL_HINT;
    }
  } catch {
    return '';
  }
  return '';
}

/**
 * @param {HTMLElement} host
 * @param {{ file: File, cropX?: number, cropY?: number }} opts
 * @returns {Promise<{ cropX: number, cropY: number } | null>}
 */
export function openPromoCropDialog(host, opts) {
  const file = opts.file;
  let cropX = Number.isFinite(opts.cropX) ? opts.cropX : 0.5;
  let cropY = Number.isFinite(opts.cropY) ? opts.cropY : 0.5;
  const url = URL.createObjectURL(file);

  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'promo-crop-overlay';
    overlay.innerHTML = `
      <div class="promo-crop-dialog" role="dialog" aria-modal="true" aria-labelledby="promo-crop-title">
        <h3 id="promo-crop-title" class="promo-crop-dialog__title">썸네일 위치 조정</h3>
        <p class="promo-crop-dialog__hint">프라임(16:9)은 사진 전체가 들어갑니다. 베이직(1:1) 정사각에 보일 가운데만 사진을 눌러 골라 주세요.</p>
        <div class="promo-crop-dialog__previews">
          <div class="promo-crop-frame promo-crop-frame--prime" data-crop-prime>
            <img class="promo-crop-blur" alt="" src="${url}" draggable="false" />
            <img class="promo-crop-contain" alt="" src="${url}" draggable="false" />
            <span class="promo-crop-frame__label">프라임 16:9</span>
          </div>
          <div class="promo-crop-frame promo-crop-frame--basic" data-crop-basic>
            <img alt="" src="${url}" draggable="false" />
            <span class="promo-crop-spot" data-crop-spot></span>
            <span class="promo-crop-frame__label">베이직 1:1</span>
          </div>
        </div>
        <div class="promo-crop-dialog__actions">
          <button type="button" class="btn btn--ghost" data-crop-cancel>취소</button>
          <button type="button" class="btn btn--primary" data-crop-ok>이 위치로 올리기</button>
        </div>
      </div>
    `;
    const mount = document.body || host;
    mount.appendChild(overlay);
    bindDraggableDialog(
      overlay.querySelector('.promo-crop-dialog'),
      overlay.querySelector('.promo-crop-dialog__title'),
    );

    const basic = overlay.querySelector('[data-crop-basic]');
    const spot = overlay.querySelector('[data-crop-spot]');
    const basicImg = basic?.querySelector('img');

    const applyPos = () => {
      const pos = `${Math.round(cropX * 100)}% ${Math.round(cropY * 100)}%`;
      if (basicImg) basicImg.style.objectPosition = pos;
      if (spot) {
        spot.style.left = `${cropX * 100}%`;
        spot.style.top = `${cropY * 100}%`;
      }
    };
    applyPos();

    const onPoint = (ev) => {
      if (!basic) return;
      const rect = basic.getBoundingClientRect();
      const x = ('clientX' in ev ? ev.clientX : ev.touches?.[0]?.clientX) - rect.left;
      const y = ('clientY' in ev ? ev.clientY : ev.touches?.[0]?.clientY) - rect.top;
      cropX = Math.min(1, Math.max(0, x / rect.width));
      cropY = Math.min(1, Math.max(0, y / rect.height));
      applyPos();
    };
    basic?.addEventListener('click', onPoint);
    basic?.addEventListener('pointerdown', onPoint);

    const finish = (result) => {
      URL.revokeObjectURL(url);
      overlay.remove();
      resolve(result);
    };
    overlay.querySelector('[data-crop-cancel]')?.addEventListener('click', () => finish(null));
    overlay.querySelector('[data-crop-ok]')?.addEventListener('click', () => finish({ cropX, cropY }));
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) finish(null);
    });
  });
}

/**
 * @param {{ studyRoomId: number, file: File, cropX: number, cropY: number, imageType?: string, sortOrder?: number, caption?: string, replaceImageId?: number }} input
 */
export async function uploadPromoImage(input) {
  const fd = new FormData();
  fd.append('study_room_id', String(input.studyRoomId));
  fd.append('file', input.file);
  fd.append('crop_x', String(input.cropX));
  fd.append('crop_y', String(input.cropY));
  fd.append('image_type', input.imageType || 'cover');
  if (input.sortOrder) fd.append('sort_order', String(input.sortOrder));
  if (input.caption) fd.append('caption', String(input.caption).slice(0, 80));
  if (input.replaceImageId) fd.append('replace_image_id', String(input.replaceImageId));

  const res = await fetch('/api/study-room/promo-image.php', {
    method: 'POST',
    credentials: 'include',
    body: fd,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    throw new Error(data.message || '사진 업로드에 실패했습니다.');
  }
  return data.image;
}

/**
 * @param {{ studyRoomId: number, imageId: number, cropX: number, cropY: number }} input
 */
export async function recropPromoImage(input) {
  const res = await fetch('/api/study-room/promo-image.php', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'recrop',
      study_room_id: input.studyRoomId,
      image_id: input.imageId,
      crop_x: input.cropX,
      crop_y: input.cropY,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    throw new Error(data.message || '썸네일 위치를 다시 적용하지 못했습니다.');
  }
  return data.image;
}

/**
 * @param {{ studyRoomId: number, imageId: number, caption: string }} input
 */
export async function updatePromoImageCaption(input) {
  const res = await fetch('/api/study-room/promo-image.php', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'caption',
      study_room_id: input.studyRoomId,
      image_id: input.imageId,
      caption: String(input.caption || '').slice(0, 80),
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    throw new Error(data.message || '사진 제목을 저장하지 못했습니다.');
  }
  return data.image;
}

/**
 * @param {{ studyRoomId: number, imageId: number }} input
 */
export async function deletePromoImage(input) {
  const res = await fetch('/api/study-room/promo-image.php', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'delete',
      study_room_id: input.studyRoomId,
      image_id: input.imageId,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    throw new Error(data.message || '사진을 삭제하지 못했습니다.');
  }
}
