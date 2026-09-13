/**
 * 과외쌤 프로필 사진 — 최대 3장.
 * 1번 = 대표(BASIC/PICK/PRIME 카드). 업로드 시 베이직(1:1)·프라임(16:9) 파생본을 만든다.
 */

import {
  validatePromoImageFile,
  openPromoCropDialog,
  readImageSize,
  PROMO_IMAGE_SPEC,
} from '../../../shared/promo-image.js';
import { isRegistrationsApiMode, hydrateRegistrationsCache, patchTutorInCache } from '../registrations-backend.js';
import { getTutor, updateTutor } from './store.js';

export const TUTOR_PROFILE_PHOTO_SPEC = {
  maxCount: 3,
  accept: PROMO_IMAGE_SPEC.accept,
  acceptExt: PROMO_IMAGE_SPEC.acceptExt,
  maxBytes: PROMO_IMAGE_SPEC.maxBytes,
  /** 카드·얼굴 프레임용 — 정사각에 가깝게 */
  minWidth: 800,
  minHeight: 800,
  recommended: '1200×1200 이상',
  basicSize: 720,
  /** 서버 업로드용 (원본 대신 보내 닷홈 메모리·용량 부담 감소) */
  uploadSize: 1200,
  primeWidth: 1280,
  primeHeight: 720,
  jpegQuality: 0.82,
};

const FILE_INPUT_ID = 'p21-profile-photo-file';

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
}

/** @param {import('./store.js').TutorRecord|null|undefined} tutor */
export function normalizeTutorProfileImages(tutor) {
  const raw = Array.isArray(tutor?.profile_images) ? tutor.profile_images : [];
  return raw
    .filter((img) => img && (img.basic_720_path || img.image_path || img.prime_1280_path))
    .slice(0, TUTOR_PROFILE_PHOTO_SPEC.maxCount)
    .map((img, i) => ({
      id: img.id ?? `local-${i + 1}`,
      name: img.name || img.original_filename || '',
      image_path: img.image_path || img.basic_720_path || '',
      basic_720_path: img.basic_720_path || img.image_path || '',
      prime_1280_path: img.prime_1280_path || img.image_path || '',
      crop_x: Number.isFinite(Number(img.crop_x ?? img.crop_offset_x))
        ? Number(img.crop_x ?? img.crop_offset_x)
        : 0.5,
      crop_y: Number.isFinite(Number(img.crop_y ?? img.crop_offset_y))
        ? Number(img.crop_y ?? img.crop_offset_y)
        : 0.5,
      sort_order: i + 1,
      image_type: i === 0 ? 'profile' : 'intro',
    }));
}

/** @param {ReturnType<typeof normalizeTutorProfileImages>[number]|null|undefined} img */
export function tutorPhotoPreviewSrc(img) {
  return img?.basic_720_path || img?.image_path || img?.prime_1280_path || '';
}

/** 카드 노출용 — 1번 사진 */
export function tutorCardImagePaths(tutor) {
  const first = normalizeTutorProfileImages(tutor)[0];
  if (!first) {
    return { image_path: '', image_path_basic: '', image_path_prime: '' };
  }
  return {
    image_path: first.prime_1280_path || first.basic_720_path || first.image_path || '',
    image_path_basic: first.basic_720_path || first.image_path || '',
    image_path_prime: first.prime_1280_path || first.image_path || '',
  };
}

export function tutorProfilePhotoHint() {
  const s = TUTOR_PROFILE_PHOTO_SPEC;
  return `JPG · PNG · WebP / 권장 ${s.recommended} / 최소 ${s.minWidth}×${s.minHeight} / 파일 최대 4MB · ${s.maxCount}장. 올리면 베이직 카드용 정사각(${s.basicSize}×${s.basicSize})과 프라임용 16:9(${s.primeWidth}×${s.primeHeight})로 자동 리사이즈합니다. 왼쪽(1번)이 대표 사진입니다.`;
}

/**
 * @param {File} file
 * @returns {Promise<string>} 오류 메시지. 통과면 빈 문자열.
 */
export async function validateTutorProfilePhoto(file) {
  const base = await validatePromoImageFile(file);
  if (base) return base;
  try {
    const { width, height } = await readImageSize(file);
    if (width < TUTOR_PROFILE_PHOTO_SPEC.minWidth || height < TUTOR_PROFILE_PHOTO_SPEC.minHeight) {
      return `최소 ${TUTOR_PROFILE_PHOTO_SPEC.minWidth}×${TUTOR_PROFILE_PHOTO_SPEC.minHeight} 픽셀 이상이어야 합니다. (현재 ${width}×${height})`;
    }
  } catch (err) {
    return err instanceof Error ? err.message : '이미지를 확인할 수 없습니다.';
  }
  return '';
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {number} quality
 */
function canvasToJpegDataUrl(canvas, quality) {
  return canvas.toDataURL('image/jpeg', quality);
}

/**
 * @param {CanvasImageSource} img
 * @param {number} sw
 * @param {number} sh
 * @param {number} cropX
 * @param {number} cropY
 * @param {number} tw
 * @param {number} th
 */
function cropResizeToCanvas(img, sw, sh, cropX, cropY, tw, th) {
  const target = tw / th;
  const src = sw / Math.max(1, sh);
  let cw;
  let ch;
  if (src > target) {
    cw = Math.round(sh * target);
    ch = sh;
  } else {
    cw = sw;
    ch = Math.round(sw / target);
  }
  const maxX = Math.max(0, sw - cw);
  const maxY = Math.max(0, sh - ch);
  const sx = Math.round(Math.min(maxX, Math.max(0, maxX * cropX)));
  const sy = Math.round(Math.min(maxY, Math.max(0, maxY * cropY)));
  const canvas = document.createElement('canvas');
  canvas.width = tw;
  canvas.height = th;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('이미지 캔버스를 만들 수 없습니다.');
  ctx.drawImage(img, sx, sy, cw, ch, 0, 0, tw, th);
  return canvas;
}

/**
 * @param {File} file
 * @param {number} cropX
 * @param {number} cropY
 */
export async function processTutorProfilePhoto(file, cropX, cropY) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('이미지를 읽을 수 없습니다.'));
      el.src = url;
    });
    const sw = img.naturalWidth || img.width;
    const sh = img.naturalHeight || img.height;
    const cx = Number.isFinite(cropX) ? cropX : 0.5;
    const cy = Number.isFinite(cropY) ? cropY : 0.5;
    const q = TUTOR_PROFILE_PHOTO_SPEC.jpegQuality;
    const basic = cropResizeToCanvas(
      img,
      sw,
      sh,
      cx,
      cy,
      TUTOR_PROFILE_PHOTO_SPEC.basicSize,
      TUTOR_PROFILE_PHOTO_SPEC.basicSize,
    );
    const upload = cropResizeToCanvas(
      img,
      sw,
      sh,
      cx,
      cy,
      TUTOR_PROFILE_PHOTO_SPEC.uploadSize,
      TUTOR_PROFILE_PHOTO_SPEC.uploadSize,
    );
    const prime = cropResizeToCanvas(
      img,
      sw,
      sh,
      cx,
      cy,
      TUTOR_PROFILE_PHOTO_SPEC.primeWidth,
      TUTOR_PROFILE_PHOTO_SPEC.primeHeight,
    );
    const basicUrl = canvasToJpegDataUrl(basic, q);
    const uploadUrl = canvasToJpegDataUrl(upload, q);
    const primeUrl = canvasToJpegDataUrl(prime, q);
    return {
      name: file.name || 'profile.jpg',
      basic_720_path: basicUrl,
      prime_1280_path: primeUrl,
      upload_1200_path: uploadUrl,
      image_path: basicUrl,
      crop_x: cx,
      crop_y: cy,
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * @param {number} tutorId
 * @param {ReturnType<typeof normalizeTutorProfileImages>} images
 */
async function persistProfileImages(tutorId, images) {
  const next = images.slice(0, TUTOR_PROFILE_PHOTO_SPEC.maxCount).map((img, i) => ({
    ...img,
    sort_order: i + 1,
    image_type: i === 0 ? 'profile' : 'intro',
  }));
  const patch = {
    profile_images: next,
    has_profile_image: next.length > 0,
  };
  if (isRegistrationsApiMode()) {
    patchTutorInCache(tutorId, patch);
  } else {
    updateTutor(tutorId, patch);
  }
  return next;
}

async function readApiError(res) {
  const text = await res.text();
  try {
    const data = JSON.parse(text);
    if (data && typeof data === 'object') return data;
  } catch {
    /* HTML ErrorDocument 등으로 JSON이 아닐 수 있음 */
  }
  return {
    ok: false,
    error: 'http',
    message: `업로드 실패 (HTTP ${res.status}). 서버 응답을 읽지 못했습니다. 잠시 후 다시 시도해 주세요.`,
  };
}

/**
 * @param {number} tutorId
 * @param {File} file
 * @param {{ cropX: number, cropY: number }} crop
 */
async function uploadTutorProfilePhotoApi(tutorId, file, crop) {
  const fd = new FormData();
  fd.append('action', 'upload');
  fd.append('tutor_id', String(tutorId));
  fd.append('file', file, file.name || 'profile.jpg');
  fd.append('crop_x', String(crop.cropX));
  fd.append('crop_y', String(crop.cropY));
  const res = await fetch('/api/tutor/profile-image.php', {
    method: 'POST',
    credentials: 'include',
    body: fd,
  });
  const data = await readApiError(res);
  // 닷홈은 오류도 HTTP 200 + ok:false 로 올 수 있음
  if (!data.ok) {
    throw new Error(data.message || '프로필 사진 업로드에 실패했습니다.');
  }
  return data.image;
}

/**
 * @param {number} tutorId
 * @param {number[]} orderedIds
 */
async function reorderTutorProfilePhotosApi(tutorId, orderedIds) {
  const res = await fetch('/api/tutor/profile-image.php', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'reorder',
      tutor_id: tutorId,
      image_ids: orderedIds,
    }),
  });
  const data = await readApiError(res);
  if (!data.ok) {
    throw new Error(data.message || '사진 순서를 저장하지 못했습니다.');
  }
  return data.images || [];
}

/**
 * @param {number} tutorId
 * @param {number|string} imageId
 */
async function deleteTutorProfilePhotoApi(tutorId, imageId) {
  const res = await fetch('/api/tutor/profile-image.php', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'delete',
      tutor_id: tutorId,
      image_id: imageId,
    }),
  });
  const data = await readApiError(res);
  if (!data.ok) {
    throw new Error(data.message || '사진을 삭제하지 못했습니다.');
  }
}

/** dataURL → File (서버가 원본 수신 실패할 때 JPEG 파생본 재시도용) */
async function dataUrlToJpegFile(dataUrl, name) {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return new File([blob], name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' });
}

/** @param {import('./store.js').TutorRecord} tutor */
export function renderTutorProfilePhotoEditor(tutor) {
  const images = normalizeTutorProfileImages(tutor);
  const canAdd = images.length < TUTOR_PROFILE_PHOTO_SPEC.maxCount;
  const cards = images
    .map((img, idx) => {
      const src = tutorPhotoPreviewSrc(img);
      const isCover = idx === 0;
      return `
      <article class="p21-photos__card${isCover ? ' is-cover' : ''}" data-photo-id="${esc(img.id)}" data-photo-idx="${idx}">
        <div class="p21-photos__frame">
          ${src ? `<img src="${esc(src)}" alt="프로필 사진 ${idx + 1}" />` : '<span class="p21-photos__empty">미리보기</span>'}
          ${isCover ? '<span class="p21-photos__badge">대표</span>' : `<span class="p21-photos__badge p21-photos__badge--muted">${idx + 1}</span>`}
        </div>
        <div class="p21-photos__meta">
          <div class="p21-photos__ops">
            <button type="button" class="btn btn--ghost btn--sm" data-photo-action="left" data-idx="${idx}" ${idx === 0 ? 'disabled' : ''}>←</button>
            <button type="button" class="btn btn--ghost btn--sm" data-photo-action="right" data-idx="${idx}" ${idx >= images.length - 1 ? 'disabled' : ''}>→</button>
            ${
              !isCover
                ? `<button type="button" class="btn btn--secondary btn--sm" data-photo-action="cover" data-idx="${idx}">대표로</button>`
                : ''
            }
            <button type="button" class="btn btn--ghost btn--sm" data-photo-action="remove" data-idx="${idx}">삭제</button>
          </div>
        </div>
      </article>`;
    })
    .join('');

  return `
    <div class="p21-photos" data-p21-photos data-tutor-id="${esc(tutor.id)}">
      <p class="p21-photos__hint">${esc(tutorProfilePhotoHint())}</p>
      ${
        cards
          ? `<div class="p21-photos__grid">${cards}</div>`
          : `<p class="p21-photos__none">아직 올린 사진이 없습니다. 최대 ${TUTOR_PROFILE_PHOTO_SPEC.maxCount}장까지 올릴 수 있습니다.</p>`
      }
      ${
        canAdd
          ? `<div class="p21-photos__actions">
              <label class="btn btn--secondary" for="${FILE_INPUT_ID}">
                <input id="${FILE_INPUT_ID}" class="p21-photos__file" type="file" accept="${TUTOR_PROFILE_PHOTO_SPEC.accept},image/*" />
                + 사진 추가
              </label>
              <span class="p21-photos__count">${images.length}/${TUTOR_PROFILE_PHOTO_SPEC.maxCount}</span>
            </div>`
          : `<p class="p21-photos__count">프로필 사진은 최대 ${TUTOR_PROFILE_PHOTO_SPEC.maxCount}장입니다.</p>`
      }
    </div>`;
}

/**
 * @param {HTMLElement} root
 * @param {{ tutorId: number, rerender: () => void }} opts
 */
export function bindTutorProfilePhotos(root, opts) {
  const box = root.querySelector('[data-p21-photos]');
  if (!box) return;
  const tutorId = Number(opts.tutorId || box.getAttribute('data-tutor-id') || 0);
  if (!tutorId) return;

  const refresh = () => opts.rerender();

  const loadImages = () => normalizeTutorProfileImages(getTutor(tutorId));

  const applyOrder = async (next) => {
    if (isRegistrationsApiMode()) {
      const ids = next.map((img) => Number(img.id)).filter((n) => Number.isFinite(n) && n > 0);
      if (ids.length === next.length) {
        const images = await reorderTutorProfilePhotosApi(tutorId, ids);
        await persistProfileImages(
          tutorId,
          (images.length ? images : next).map((img, i) => ({
            id: img.id,
            name: img.name || img.original_filename || '',
            image_path: img.image_path || img.basic_720_path,
            basic_720_path: img.basic_720_path || img.image_path,
            prime_1280_path: img.prime_1280_path || img.image_path,
            crop_x: img.crop_x ?? img.crop_offset_x ?? 0.5,
            crop_y: img.crop_y ?? img.crop_offset_y ?? 0.5,
            sort_order: i + 1,
            image_type: i === 0 ? 'profile' : 'intro',
          })),
        );
        await hydrateRegistrationsCache().catch(() => {});
        refresh();
        return;
      }
    }
    await persistProfileImages(tutorId, next);
    refresh();
  };

  box.querySelector(`#${FILE_INPUT_ID}`)?.addEventListener('change', async (ev) => {
    const input = /** @type {HTMLInputElement} */ (ev.target);
    const file = input.files?.[0] || null;
    input.value = '';
    if (!file) return;
    const images = loadImages();
    if (images.length >= TUTOR_PROFILE_PHOTO_SPEC.maxCount) {
      alert(`프로필 사진은 최대 ${TUTOR_PROFILE_PHOTO_SPEC.maxCount}장까지입니다.`);
      return;
    }
    const err = await validateTutorProfilePhoto(file);
    if (err) {
      alert(err);
      return;
    }
    const crop = await openPromoCropDialog(document.body, { file });
    if (!crop) return;

    try {
      const local = await processTutorProfilePhoto(file, crop.cropX, crop.cropY);
      let uploaded = null;
      if (isRegistrationsApiMode()) {
        // 원본 2~4MB 대신 1200px JPEG만 올려 서버 GD 메모리·용량 부담을 줄인다.
        const uploadFile = await dataUrlToJpegFile(
          local.upload_1200_path || local.basic_720_path,
          local.name || 'profile.jpg',
        );
        uploaded = await uploadTutorProfilePhotoApi(tutorId, uploadFile, crop);
      }
      const merged = [
        ...images,
        {
          id: uploaded?.id ?? `local-${Date.now()}`,
          name: uploaded?.name || local.name,
          image_path: uploaded?.basic_720_path || uploaded?.image_path || local.basic_720_path,
          basic_720_path: uploaded?.basic_720_path || uploaded?.image_path || local.basic_720_path,
          prime_1280_path: uploaded?.prime_1280_path || local.prime_1280_path,
          crop_x: crop.cropX,
          crop_y: crop.cropY,
          sort_order: images.length + 1,
          image_type: images.length === 0 ? 'profile' : 'intro',
        },
      ];
      await persistProfileImages(tutorId, merged);
      if (isRegistrationsApiMode()) {
        await hydrateRegistrationsCache().catch(() => {});
        const after = normalizeTutorProfileImages(getTutor(tutorId));
        if (!after.length && merged.length) {
          await persistProfileImages(tutorId, merged);
        }
      }
      refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : '사진 업로드에 실패했습니다.');
    }
  });

  box.querySelectorAll('[data-photo-action]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const action = btn.getAttribute('data-photo-action');
      const idx = Number(btn.getAttribute('data-idx'));
      const images = loadImages();
      if (!Number.isFinite(idx) || idx < 0 || idx >= images.length) return;
      try {
        if (action === 'remove') {
          const target = images[idx];
          if (isRegistrationsApiMode() && Number(target.id) > 0) {
            await deleteTutorProfilePhotoApi(tutorId, Number(target.id));
            await hydrateRegistrationsCache().catch(() => {});
          }
          const next = images.filter((_, i) => i !== idx);
          await persistProfileImages(tutorId, next);
          refresh();
          return;
        }
        if (action === 'left' && idx > 0) {
          const next = images.slice();
          [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
          await applyOrder(next);
          return;
        }
        if (action === 'right' && idx < images.length - 1) {
          const next = images.slice();
          [next[idx + 1], next[idx]] = [next[idx], next[idx + 1]];
          await applyOrder(next);
          return;
        }
        if (action === 'cover' && idx > 0) {
          const next = images.slice();
          const [picked] = next.splice(idx, 1);
          next.unshift(picked);
          await applyOrder(next);
        }
      } catch (e) {
        alert(e instanceof Error ? e.message : '사진 처리에 실패했습니다.');
      }
    });
  });
}
