/**
 * 과외쌤 프로필 사진 — 최대 3장 (마이페이지 편집기).
 * 1번 = 대표(BASIC/PICK/PRIME 카드). 업로드 시 베이직(1:1)·프라임(16:9) 파생본을 만든다.
 * 검사·리사이즈·업로드는 shared/tutor-profile-photo.js (가입·tutor-ui 와 공통).
 */

import { openPromoCropDialog } from '../../../shared/promo-image.js';
import {
  TUTOR_PROFILE_PHOTO_SPEC,
  tutorProfilePhotoHint,
  validateTutorProfilePhoto,
  ensureTutorProfilePhotoMinSize,
  processTutorProfilePhoto,
  readProfileImageApiResult,
  uploadTutorProfilePhotoApi,
  dataUrlToJpegFile,
} from '../../../shared/tutor-profile-photo.js';
import { isRegistrationsApiMode, hydrateRegistrationsCache, patchTutorInCache } from '../registrations-backend.js';
import { getTutor, updateTutor } from './store.js';

export {
  TUTOR_PROFILE_PHOTO_SPEC,
  tutorProfilePhotoHint,
  validateTutorProfilePhoto,
  ensureTutorProfilePhotoMinSize,
  processTutorProfilePhoto,
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
  const data = await readProfileImageApiResult(res);
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
  const data = await readProfileImageApiResult(res);
  if (!data.ok) {
    throw new Error(data.message || '사진을 삭제하지 못했습니다.');
  }
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
            <button type="button" class="btn btn--ghost btn--sm" data-photo-action="remove" data-idx="${idx}" ${images.length <= 1 ? 'disabled title="프로필 사진은 1장 이상 있어야 합니다."' : ''}>삭제</button>
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
    let prepared = file;
    try {
      prepared = await ensureTutorProfilePhotoMinSize(file);
    } catch (e) {
      alert(e instanceof Error ? e.message : '사진을 준비하지 못했습니다.');
      return;
    }
    const crop = await openPromoCropDialog(document.body, { file: prepared });
    if (!crop) return;

    try {
      const local = await processTutorProfilePhoto(prepared, crop.cropX, crop.cropY);
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
          if (images.length <= 1) {
            alert('프로필 사진은 기본정보 필수 항목이라 1장은 남겨야 합니다. 새 사진을 먼저 올린 뒤 지워 주세요.');
            return;
          }
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
