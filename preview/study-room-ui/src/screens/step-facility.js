import { registerState, getFacilityOptions, IMAGE_TYPES } from '../state.js';
import { validatePromoUrls } from '../../../shared/promo-links.js';
import { syncFacilityFromForm, syncCareerFromForm } from '../form-collect.js';
import { saveCurrentStep, withSaving } from '../save-flow.js';
import {
  renderRegisterShell,
  renderSectionTitle,
  renderDetailStepNav,
  renderGuideNotice,
  renderRegisterWorkTabs,
  renderPublishStatusBlock,
  bindGlobalEvents,
  navigate,
  withRoomId,
} from '../layout.js';
import {
  PROMO_IMAGE_SPEC,
  validatePromoImageFile,
  openPromoCropDialog,
  uploadPromoImage,
  deletePromoImage,
  updatePromoImageCaption,
} from '../../../shared/promo-image.js';

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
}

function renderFacilityChecks() {
  const options = getFacilityOptions();
  if (!options.length) {
    return '<p class="register-hint">시설 목록을 불러오지 못했습니다. 잠시 후 다시 열어 주세요.</p>';
  }
  return options
    .map((f) => {
      const checked = registerState.facility_ids.includes(f.id);
      return `
      <label class="form-check">
        <input class="form-check__input" type="checkbox" name="facility_ids" value="${f.id}" ${checked ? 'checked' : ''} />
        <span class="form-check__label">${esc(f.facility_name)}</span>
      </label>
    `;
    })
    .join('');
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

function renderPhotoGrid() {
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

export function renderFacility() {
  const s = registerState;
  const content = `
    <form data-form="facility">
      ${renderRegisterWorkTabs('facility')}
      ${renderGuideNotice('상세정보 2/2단계입니다. 비어 있어도 저장한 뒤 등록 완료로 넘어갈 수 있습니다. 공개 여부는 맨 아래 칸에서 고릅니다.')}
      ${renderSectionTitle('경력 · 특징')}
      <div class="register-grid-2">
        <div class="form-group">
          <label class="form-label" for="career_years">교습 경력 (년)</label>
          <input class="form-input" type="number" id="career_years" name="career_years" value="${esc(s.career_years)}" />
        </div>
        <div class="form-group">
          <label class="form-label" for="academy_career_years">학원 경력 (년)</label>
          <input class="form-input" type="number" id="academy_career_years" name="academy_career_years" value="${esc(s.academy_career_years)}" />
        </div>
      </div>
      <div class="register-grid-2">
        <div class="form-group">
          <label class="form-check">
            <input class="form-check__input" type="checkbox" name="franchise_flag" ${s.franchise_flag ? 'checked' : ''} />
            <span class="form-check__label">프랜차이즈</span>
          </label>
          <label class="form-label" for="franchise_name">프랜차이즈명</label>
          <input class="form-input" id="franchise_name" name="franchise_name" value="${esc(s.franchise_name)}" />
        </div>
        <div class="form-group">
          <label class="form-check">
            <input class="form-check__input" type="checkbox" name="education_office_registered" ${s.education_office_registered ? 'checked' : ''} />
            <span class="form-check__label">교육청 등록</span>
          </label>
          <label class="form-label" for="education_office_reg_no">교육청 등록번호</label>
          <input class="form-input" id="education_office_reg_no" name="education_office_reg_no" value="${esc(s.education_office_reg_no)}" />
        </div>
      </div>
      <div class="register-grid-2">
        <div class="form-group">
          <label class="form-label" for="feature_1">특징 1</label>
          <input class="form-input" id="feature_1" name="feature_1" value="${esc(s.feature_1)}" />
        </div>
        <div class="form-group">
          <label class="form-label" for="feature_2">특징 2</label>
          <input class="form-input" id="feature_2" name="feature_2" value="${esc(s.feature_2)}" />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label" for="feature_3">특징 3</label>
        <input class="form-input" id="feature_3" name="feature_3" value="${esc(s.feature_3)}" />
      </div>

      ${renderSectionTitle('시설 · 환경')}
      <div class="register-check-grid mb-4">${renderFacilityChecks()}</div>
      <div class="form-group">
        <label class="form-label" for="facility_note">시설 자유기술</label>
        <textarea class="form-input form-textarea" id="facility_note" name="facility_note" rows="3">${esc(s.facility_note)}</textarea>
      </div>

      ${renderSectionTitle('소셜홍보')}
      <p class="register-hint">연락은 쪽지로만 합니다. 전화번호·이메일은 이 화면과 검색·상세에 올리지 않습니다.</p>
      <div class="register-grid-2">
        <div class="form-group">
          <label class="form-label" for="youtube_url">유튜브 링크</label>
          <input class="form-input" type="url" id="youtube_url" name="youtube_url" placeholder="https://www.youtube.com/..." value="${esc(s.youtube_url)}" />
        </div>
        <div class="form-group">
          <label class="form-label" for="facebook_url">페이스북 링크</label>
          <input class="form-input" type="url" id="facebook_url" name="facebook_url" placeholder="https://www.facebook.com/..." value="${esc(s.facebook_url)}" />
        </div>
        <div class="form-group">
          <label class="form-label" for="instagram_url">인스타그램 링크</label>
          <input class="form-input" type="url" id="instagram_url" name="instagram_url" placeholder="https://www.instagram.com/..." value="${esc(s.instagram_url)}" />
        </div>
      </div>

      ${renderSectionTitle('홍보사진 (0~5장)')}
      <p class="register-hint">JPG · PNG · WebP / 권장 ${PROMO_IMAGE_SPEC.recommended} / 최소 ${PROMO_IMAGE_SPEC.minWidth}×${PROMO_IMAGE_SPEC.minHeight} / 최대 4MB · 5장. 원본 1장을 올리면 프라임(16:9)과 베이직(1:1) 썸네일을 자동으로 만듭니다. 아이폰은 ‘가장 호환성 높은 포맷’ 또는 JPG로 저장해 주세요. 공개하려면 대표 사진 1장 이상이 필요합니다.</p>
      ${renderPhotoGrid()}

      ${renderPublishStatusBlock(s.profile_status, {
        lead: '모두 채운 뒤 공개할지, 지금은 저장만 할지 정하는 칸입니다. 등록 완료 화면에서도 다시 고를 수 있습니다.',
      })}

      ${renderDetailStepNav({
        prevPath: '/register/lesson',
        nextLabel: '등록 완료',
        nextEnabled: true,
      })}
    </form>
  `;
  return renderRegisterShell(content, {
    stepKey: 'facility',
    title: '경력 · 시설',
  });
}

export function bindFacilityEvents(root) {
  bindGlobalEvents(root);
  const form = root.querySelector('[data-form="facility"]');
  const prevBtn = root.querySelector('[data-action="prev"]');
  const nextBtn = root.querySelector('[data-action="next"]');
  const saveBtn = root.querySelector('[data-action="save"]');

  prevBtn?.addEventListener('click', () => navigate(withRoomId('/register/lesson')));

  function syncPhotoMeta() {
    form?.querySelectorAll('[data-photo-idx]').forEach((card) => {
      const idx = Number(card.getAttribute('data-photo-idx'));
      if (!registerState.images[idx]) return;
      const type = card.querySelector('[data-field="image_type"]')?.value;
      if (type) registerState.images[idx].image_type = type;
      const caption = card.querySelector('[data-field="caption"]')?.value;
      registerState.images[idx].caption = String(caption || '').trim().slice(0, 80);
      registerState.images[idx].sort_order = idx + 1;
    });
  }

  async function persistFacility() {
    syncCareerFromForm(form, registerState);
    syncFacilityFromForm(form, registerState);
    syncPhotoMeta();
    const urlErr = validatePromoUrls(registerState);
    if (urlErr) {
      throw new Error(urlErr);
    }
    if (registerState.profile_status === 'published' && !(registerState.images || []).length) {
      throw new Error('공개하려면 홍보사진 1장 이상을 올려 주세요.');
    }
    await saveCurrentStep(registerState, 'career');
    await saveCurrentStep(registerState, 'facility');
    registerState.detailFacilitySaved = true;
  }

  saveBtn?.addEventListener('click', () => {
    withSaving(saveBtn, async () => {
      await persistFacility();
      alert('저장되었습니다.');
      window.dispatchEvent(new Event('hashchange'));
    });
  });

  nextBtn?.addEventListener('click', () => {
    withSaving(nextBtn, async () => {
      await persistFacility();
      registerState.completeNeedsHydrate = true;
      navigate(withRoomId('/register/complete'));
    });
  });

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
      syncCareerFromForm(form, registerState);
      syncFacilityFromForm(form, registerState);
      const saved = await saveCurrentStep(registerState, 'career');
      roomId = saved.study_room_id || registerState.study_room_id;
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

  form?.querySelectorAll('[data-field="caption"]').forEach((el) => {
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
