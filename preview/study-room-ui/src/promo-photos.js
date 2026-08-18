/** 홍보사진 그리드 — 상세1에서 사용, 업로드 API는 기존 유지 */

import { registerState, IMAGE_TYPES } from './state.js';
import {
  PROMO_IMAGE_SPEC,
  validatePromoImageFile,
  openPromoCropDialog,
  uploadPromoImage,
  deletePromoImage,
  updatePromoImageCaption,
} from '../../shared/promo-image.js';

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
}

function previewSrc(img) {
  return img.basic_720_path || img.prime_1280_path || img.image_path || '';
}

function renderPhotoCard(img, idx) {
  const src = previewSrc(img);
  const typeOpts = IMAGE_TYPES.map(
    (t) =>
      `<option value="${t.value}" ${img.image_type === t.value ? 'selected' : ''}>${t.label}</option>`,
  ).join('');
  return `
    <article class="register-photo-card" data-image-id="${esc(img.id || '')}" data-photo-idx="${idx}">
      <div class="register-photo-card__frame">
        ${
          src
            ? `<img src="${esc(src)}" alt="홍보사진 ${idx + 1}" />`
            : '<span class="register-photo-card__empty">미리보기</span>'
        }
      </div>
      <div class="register-photo-card__meta">
        <label class="form-label" for="photo-type-${idx}">사진 구분</label>
        <select class="form-input" id="photo-type-${idx}" data-field="image_type">${typeOpts}</select>
        <label class="form-label" for="photo-caption-${idx}">간단 제목</label>
        <input class="form-input" id="photo-caption-${idx}" type="text" maxlength="80" data-field="caption" placeholder="한 줄 제목 (선택)" value="${esc(img.caption || '')}" />
        <p class="register-hint">${esc(img.name || img.original_filename || '업로드됨')}</p>
        <button type="button" class="btn btn--ghost btn--sm" data-action="remove-photo" data-idx="${idx}">삭제</button>
      </div>
    </article>
  `;
}

export function renderPromoPhotoGrid() {
  const images = Array.isArray(registerState.images) ? registerState.images : [];
  const cards = images.map((img, i) => renderPhotoCard(img, i)).join('');
  const canAdd = images.length < PROMO_IMAGE_SPEC.maxCount;
  return `
    <div class="register-photo-grid" data-photo-grid>
      ${cards}
      ${
        canAdd
          ? `<div class="register-photo-add">
              <input class="register-photo-add__file" type="file" accept="${PROMO_IMAGE_SPEC.accept}" data-action="pick-photo" />
              <span class="register-photo-add__badge">+ 사진 추가</span>
              <span class="register-photo-add__hint">${images.length}/${PROMO_IMAGE_SPEC.maxCount} · 클릭해서 고르기</span>
            </div>`
          : ''
      }
    </div>
  `;
}

export function promoPhotoHint() {
  return `JPG · PNG · WebP / 권장 ${PROMO_IMAGE_SPEC.recommended} / 최소 ${PROMO_IMAGE_SPEC.minWidth}×${PROMO_IMAGE_SPEC.minHeight} / 최대 4MB · 5장. 원본 1장을 올리면 프라임(16:9)과 베이직(1:1) 썸네일을 자동으로 만듭니다.`;
}

export function syncPromoPhotoMeta(root) {
  root?.querySelectorAll('[data-photo-idx]').forEach((card) => {
    const idx = Number(card.getAttribute('data-photo-idx'));
    if (!registerState.images[idx]) return;
    const type = card.querySelector('[data-field="image_type"]')?.value;
    if (type) registerState.images[idx].image_type = type;
    const caption = card.querySelector('[data-field="caption"]')?.value;
    registerState.images[idx].caption = String(caption || '').trim().slice(0, 80);
    registerState.images[idx].sort_order = idx + 1;
  });
}

/**
 * @param {HTMLElement} root
 * @param {{ persistBeforeUpload: () => Promise<void> }} opts
 */
export function bindPromoPhotos(root, opts) {
  root.querySelector('[data-action="pick-photo"]')?.addEventListener('change', async (e) => {
    const input = e.target;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if ((registerState.images || []).length >= PROMO_IMAGE_SPEC.maxCount) {
      alert('홍보사진은 최대 5장까지입니다.');
      return;
    }
    const err = await validatePromoImageFile(file);
    if (err) {
      alert(err);
      return;
    }
    const crop = await openPromoCropDialog(document.body, { file });
    if (!crop) return;

    let roomId = registerState.study_room_id;
    if (!roomId) {
      await opts.persistBeforeUpload();
      roomId = registerState.study_room_id;
    }
    if (!roomId) {
      alert('공부방 정보를 먼저 저장한 뒤 사진을 올려 주세요.');
      return;
    }

    try {
      const hasCover = (registerState.images || []).some((img) => img.image_type === 'cover');
      const image = await uploadPromoImage({
        studyRoomId: Number(roomId),
        file,
        cropX: crop.cropX,
        cropY: crop.cropY,
        imageType: hasCover ? 'interior' : 'cover',
        sortOrder: (registerState.images || []).length + 1,
      });
      registerState.images = [...(registerState.images || []), image];
      window.dispatchEvent(new Event('hashchange'));
    } catch (uploadErr) {
      alert(uploadErr instanceof Error ? uploadErr.message : '사진 업로드에 실패했습니다.');
    }
  });

  root.querySelectorAll('[data-field="caption"]').forEach((el) => {
    el.addEventListener('change', async () => {
      const card = el.closest('[data-photo-idx]');
      const idx = Number(card?.getAttribute('data-photo-idx'));
      const img = registerState.images[idx];
      if (!img?.id || !registerState.study_room_id) return;
      const caption = String(el.value || '').trim().slice(0, 80);
      registerState.images[idx].caption = caption;
      try {
        await updatePromoImageCaption({
          studyRoomId: Number(registerState.study_room_id),
          imageId: Number(img.id),
          caption,
        });
      } catch (capErr) {
        alert(capErr instanceof Error ? capErr.message : '사진 제목을 저장하지 못했습니다.');
      }
    });
  });

  root.querySelectorAll('[data-action="remove-photo"]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const idx = Number(btn.getAttribute('data-idx'));
      const img = registerState.images[idx];
      if (!img) return;
      if (!confirm('이 사진을 삭제할까요?')) return;
      try {
        if (img.id && registerState.study_room_id) {
          await deletePromoImage({
            studyRoomId: Number(registerState.study_room_id),
            imageId: Number(img.id),
          });
        }
        registerState.images.splice(idx, 1);
        window.dispatchEvent(new Event('hashchange'));
      } catch (delErr) {
        alert(delErr instanceof Error ? delErr.message : '사진을 삭제하지 못했습니다.');
      }
    });
  });
}
