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
    <div class="register-photo-block" data-photo-grid>
      ${
        cards
          ? `<div class="register-photo-grid">${cards}</div>`
          : `<p class="register-photo-block__empty">사진을 추가해 주세요. 최대 ${PROMO_IMAGE_SPEC.maxCount}장까지 올릴 수 있습니다.</p>`
      }
      ${
        canAdd
          ? `<div class="register-photo-block__actions">
              <button type="button" class="register-plus-btn" data-action="add-photo">+사진추가</button>
              <span class="register-photo-block__count">${images.length}/${PROMO_IMAGE_SPEC.maxCount}</span>
            </div>`
          : `<p class="register-photo-block__count">홍보사진은 최대 ${PROMO_IMAGE_SPEC.maxCount}장입니다.</p>`
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
/**
 * 사진 고르기 팝업. 숨긴 file input 클릭은 브라우저가 막는 경우가 있어, 보이는 창 안에서 고르게 한다.
 * @returns {Promise<File|null>}
 */
function openPhotoPickDialog() {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'promo-crop-overlay';
    overlay.innerHTML = `
      <div class="promo-crop-dialog register-photo-pick" role="dialog" aria-modal="true" aria-labelledby="photo-pick-title">
        <h3 id="photo-pick-title" class="promo-crop-dialog__title">홍보사진 추가</h3>
        <p class="promo-crop-dialog__hint">JPG · PNG · WebP / 권장 ${PROMO_IMAGE_SPEC.recommended} / 최소 ${PROMO_IMAGE_SPEC.minWidth}×${PROMO_IMAGE_SPEC.minHeight} / 최대 4MB. 아래 칸을 누르거나 파일을 끌어다 놓으세요.</p>
        <label class="register-photo-drop">
          <input class="register-photo-drop__file" type="file" accept="${PROMO_IMAGE_SPEC.accept}" />
          <span class="register-photo-drop__title">클릭해서 사진 고르기</span>
          <span class="register-photo-drop__hint">또는 이 칸에 파일을 놓기</span>
        </label>
        <p class="register-photo-pick__error" data-pick-error hidden></p>
        <div class="promo-crop-dialog__actions">
          <button type="button" class="btn btn--ghost" data-pick-cancel>취소</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const input = overlay.querySelector('.register-photo-drop__file');
    const drop = overlay.querySelector('.register-photo-drop');
    const errEl = overlay.querySelector('[data-pick-error]');

    const finish = (file) => {
      overlay.remove();
      resolve(file);
    };

    const showErr = (msg) => {
      if (!errEl) return;
      errEl.hidden = !msg;
      errEl.textContent = msg || '';
      if (input) input.value = '';
    };

    const takeFile = async (file) => {
      if (!file) return;
      const err = await validatePromoImageFile(file);
      if (err) {
        showErr(err);
        return;
      }
      finish(file);
    };

    overlay.querySelector('[data-pick-cancel]')?.addEventListener('click', () => finish(null));
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) finish(null);
    });
    input?.addEventListener('change', () => {
      takeFile(input.files?.[0] || null);
    });
    drop?.addEventListener('dragover', (e) => {
      e.preventDefault();
      drop.classList.add('is-dragover');
    });
    drop?.addEventListener('dragleave', () => drop.classList.remove('is-dragover'));
    drop?.addEventListener('drop', (e) => {
      e.preventDefault();
      drop.classList.remove('is-dragover');
      takeFile(e.dataTransfer?.files?.[0] || null);
    });
  });
}

export function bindPromoPhotos(root, opts) {
  root.querySelector('[data-action="add-photo"]')?.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if ((registerState.images || []).length >= PROMO_IMAGE_SPEC.maxCount) {
      alert('홍보사진은 최대 5장까지입니다.');
      return;
    }
    const file = await openPhotoPickDialog();
    if (!file) return;

    const crop = await openPromoCropDialog(document.body, { file });
    if (!crop) return;

    if (!registerState.study_room_id) {
      try {
        await opts.persistBeforeUpload();
      } catch (saveErr) {
        alert(saveErr instanceof Error ? saveErr.message : '공부방을 먼저 저장한 뒤 사진을 올려 주세요.');
        return;
      }
    }
    const roomId = registerState.study_room_id;
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
