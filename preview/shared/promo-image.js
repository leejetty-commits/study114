/**
 * 홍보사진 — 원본 1장 업로드 후 서버가 Prime(16:9)·Basic(1:1) 파생본을 만든다.
 * 클라이언트는 형식·용량·최소 크기 검증과 초점(크롭) 1회 조정만 담당한다.
 */

export const PROMO_IMAGE_SPEC = {
  accept: 'image/jpeg,image/png,image/webp',
  acceptExt: ['jpg', 'jpeg', 'png', 'webp'],
  maxBytes: 4 * 1024 * 1024,
  minWidth: 1200,
  minHeight: 900,
  maxCount: 5,
  recommended: '1600×1200 이상',
};

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
 */
export async function validatePromoImageFile(file) {
  if (!file) return '파일을 선택해 주세요.';
  const ext = extOf(file.name);
  const mimeOk = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.type);
  const extOk = PROMO_IMAGE_SPEC.acceptExt.includes(ext);
  if (!mimeOk && !extOk) {
    return 'JPG, PNG, WebP 파일만 올릴 수 있습니다.';
  }
  if (file.size > PROMO_IMAGE_SPEC.maxBytes) {
    return '파일 용량은 4MB 이하여야 합니다.';
  }
  try {
    const { width, height } = await readImageSize(file);
    if (width < PROMO_IMAGE_SPEC.minWidth || height < PROMO_IMAGE_SPEC.minHeight) {
      return `최소 ${PROMO_IMAGE_SPEC.minWidth}×${PROMO_IMAGE_SPEC.minHeight} 픽셀 이상이어야 합니다. (현재 ${width}×${height})`;
    }
  } catch (err) {
    return err instanceof Error ? err.message : '이미지를 확인할 수 없습니다.';
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
        <p class="promo-crop-dialog__hint">사진을 눌러 잘릴 중심을 고르세요. 프라임(16:9)과 베이직(1:1)에 함께 적용됩니다. 이번 한 번만 맞추면 됩니다.</p>
        <div class="promo-crop-dialog__previews">
          <div class="promo-crop-frame promo-crop-frame--prime" data-crop-prime>
            <img alt="" src="${url}" draggable="false" />
            <span class="promo-crop-spot" data-crop-spot></span>
            <span class="promo-crop-frame__label">프라임 16:9</span>
          </div>
          <div class="promo-crop-frame promo-crop-frame--basic" data-crop-basic>
            <img alt="" src="${url}" draggable="false" />
            <span class="promo-crop-frame__label">베이직 1:1</span>
          </div>
        </div>
        <div class="promo-crop-dialog__actions">
          <button type="button" class="btn btn--ghost" data-crop-cancel>취소</button>
          <button type="button" class="btn btn--primary" data-crop-ok>이 위치로 올리기</button>
        </div>
      </div>
    `;
    host.appendChild(overlay);

    const prime = overlay.querySelector('[data-crop-prime]');
    const basic = overlay.querySelector('[data-crop-basic]');
    const spot = overlay.querySelector('[data-crop-spot]');
    const primeImg = prime?.querySelector('img');
    const basicImg = basic?.querySelector('img');

    const applyPos = () => {
      const pos = `${Math.round(cropX * 100)}% ${Math.round(cropY * 100)}%`;
      if (primeImg) primeImg.style.objectPosition = pos;
      if (basicImg) basicImg.style.objectPosition = pos;
      if (spot) {
        spot.style.left = `${cropX * 100}%`;
        spot.style.top = `${cropY * 100}%`;
      }
    };
    applyPos();

    const onPoint = (ev) => {
      const rect = prime.getBoundingClientRect();
      const x = ('clientX' in ev ? ev.clientX : ev.touches?.[0]?.clientX) - rect.left;
      const y = ('clientY' in ev ? ev.clientY : ev.touches?.[0]?.clientY) - rect.top;
      cropX = Math.min(1, Math.max(0, x / rect.width));
      cropY = Math.min(1, Math.max(0, y / rect.height));
      applyPos();
    };
    prime?.addEventListener('click', onPoint);
    prime?.addEventListener('pointerdown', onPoint);

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
 * @param {{ studyRoomId: number, file: File, cropX: number, cropY: number, imageType?: string, sortOrder?: number }} input
 */
export async function uploadPromoImage(input) {
  const fd = new FormData();
  fd.append('study_room_id', String(input.studyRoomId));
  fd.append('file', input.file);
  fd.append('crop_x', String(input.cropX));
  fd.append('crop_y', String(input.cropY));
  fd.append('image_type', input.imageType || 'cover');
  if (input.sortOrder) fd.append('sort_order', String(input.sortOrder));

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
