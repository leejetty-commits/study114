/**
 * 등록점검 — 가벼운 항목 드로어 + 대표사진 1장 팝업
 * 기존 입력 탭 전체를 모달에 넣지 않는다.
 *
 * 저장: 저장 직전 DB 최신값을 다시 불러온 뒤, 수정 필드만 merge → step 저장.
 */

import { registerState } from '@study-room-ui/state.js';
import { saveCurrentStep } from '@study-room-ui/save-flow.js';
import {
  validatePromoImageFile,
  openPromoCropDialog,
  uploadPromoImage,
} from '../../../shared/promo-image.js';
import { hydrateRegistrationsCache, isRegistrationsApiMode } from '../registrations-backend.js';
import { ensureEmbeddedRegister } from './embedded-panels.js';
import { RC_COPY } from './registration-check-copy.js';
import {
  RC_LIGHT_FIELDS,
  TEACHING_STYLE_OPTIONS,
  registrationCheckTabHref,
} from './registration-check-model.js';

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
}

function closeLayer(el) {
  el?.remove();
}

function currentValue(field) {
  const def = RC_LIGHT_FIELDS[field];
  if (!def) return '';
  if (field === 'teaching_style') return registerState.teaching_style_ids || [];
  return registerState[field];
}

/** @returns {Record<string, unknown>} */
function readLightPatch(field, form) {
  const def = RC_LIGHT_FIELDS[field];
  if (!def) return {};
  if (def.type === 'styles') {
    const ids = [...form.querySelectorAll('input[name="teaching_style_ids"]:checked')].map((el) => el.value);
    return {
      teaching_style_ids: ids,
      teaching_style: ids
        .map((id) => TEACHING_STYLE_OPTIONS.find((o) => o.id === id)?.label || '')
        .filter(Boolean)
        .join(', '),
    };
  }
  if (def.type === 'bool') {
    const raw = form.querySelector(`[name="${field}"]`)?.value;
    if (raw === '1') return { [field]: true };
    if (raw === '0') return { [field]: false };
    return { [field]: null };
  }
  if (def.type === 'number') {
    const n = String(form.querySelector(`[name="${field}"]`)?.value || '').trim();
    const patch = { [field]: n };
    if (field === 'monthly_fee_manwon' && n) {
      const man = Number(n);
      if (Number.isFinite(man) && man > 0) patch.price_amount = man * 10000;
    }
    return patch;
  }
  return { [field]: String(form.querySelector(`[name="${field}"]`)?.value || '').trim() };
}

/**
 * DB 최신 상태 위에 patch만 얹어 저장 — 다른 필드 빈값 덮어쓰기 방지
 * @param {number} roomId
 * @param {string} field
 * @param {HTMLFormElement} form
 */
async function saveLightFieldSafe(roomId, field, form) {
  const def = RC_LIGHT_FIELDS[field];
  if (!def) throw new Error('알 수 없는 항목입니다.');
  const patch = readLightPatch(field, form);

  await ensureEmbeddedRegister(roomId, { force: true });
  if (Number(registerState.study_room_id) !== Number(roomId)) {
    throw new Error('공부방 정보를 다시 불러오지 못했습니다.');
  }

  Object.assign(registerState, patch);
  await saveCurrentStep(registerState, def.step);

  if (isRegistrationsApiMode()) {
    try {
      await hydrateRegistrationsCache();
    } catch {
      /* keep */
    }
  }
  // 저장 결과로 화면·후속 편집 기준을 맞춤
  await ensureEmbeddedRegister(roomId, { force: true });
}

function fieldControl(field) {
  const def = RC_LIGHT_FIELDS[field];
  const val = currentValue(field);
  if (def.type === 'textarea') {
    return `<textarea class="p19-input p19-textarea" name="${esc(field)}" rows="${def.rows || 3}" maxlength="${def.max || 200}">${esc(val || '')}</textarea>`;
  }
  if (def.type === 'number') {
    return `
      <div class="rc-drawer__num">
        <input class="p19-input" type="number" name="${esc(field)}" value="${esc(val || '')}" min="${def.min || 0}" max="${def.max || 999}" inputmode="numeric" />
        ${def.suffix ? `<span>${esc(def.suffix)}</span>` : ''}
      </div>`;
  }
  if (def.type === 'select') {
    const opts = (def.options || [])
      .map((o) => `<option value="${esc(o.value)}" ${String(val) === String(o.value) ? 'selected' : ''}>${esc(o.label)}</option>`)
      .join('');
    return `<select class="p19-input" name="${esc(field)}"><option value="">선택</option>${opts}</select>`;
  }
  if (def.type === 'bool') {
    const on = val === true || val === 1 || val === '1';
    const off = val === false || val === 0 || val === '0';
    return `
      <select class="p19-input" name="${esc(field)}">
        <option value="" ${!on && !off ? 'selected' : ''}>선택</option>
        <option value="1" ${on ? 'selected' : ''}>예</option>
        <option value="0" ${off ? 'selected' : ''}>아니오</option>
      </select>`;
  }
  if (def.type === 'styles') {
    const ids = new Set((Array.isArray(val) ? val : []).map(String));
    return `
      <div class="rc-drawer__chips">
        ${TEACHING_STYLE_OPTIONS.map(
          (o) => `
          <label class="rc-chip">
            <input type="checkbox" name="teaching_style_ids" value="${esc(o.id)}" ${ids.has(o.id) ? 'checked' : ''} />
            <span>${esc(o.label)}</span>
          </label>`,
        ).join('')}
      </div>`;
  }
  return `<input class="p19-input" type="text" name="${esc(field)}" value="${esc(val || '')}" maxlength="${def.max || 80}" />`;
}

function openDrawer(roomId, field, rerender) {
  const def = RC_LIGHT_FIELDS[field];
  if (!def) return;
  closeLayer(document.querySelector('[data-rc-drawer]'));
  const wrap = document.createElement('div');
  wrap.className = 'rc-drawer';
  wrap.setAttribute('data-rc-drawer', field);
  const hintHtml = def.hint
    ? `<p class="rc-drawer__hint">${esc(def.hint)}</p>`
    : '';
  wrap.innerHTML = `
    <div class="rc-drawer__backdrop" data-rc-drawer-close></div>
    <aside class="rc-drawer__panel" role="dialog" aria-modal="true" aria-labelledby="rc-drawer-title">
      <header class="rc-drawer__head">
        <h3 id="rc-drawer-title">${esc(def.label)}</h3>
        <button type="button" class="rc-icon-btn" data-rc-drawer-close aria-label="닫기">×</button>
      </header>
      <form class="rc-drawer__body" data-rc-drawer-form>
        <label class="p19-field">
          <span class="p19-field__label">${esc(def.label)}</span>
          ${fieldControl(field)}
        </label>
        ${hintHtml}
        <p class="rc-drawer__error is-hidden" data-rc-drawer-error role="alert"></p>
        <div class="rc-drawer__actions">
          <button type="button" class="btn btn--ghost" data-rc-drawer-close>${esc(RC_COPY.drawer.cancel)}</button>
          <button type="submit" class="btn btn--primary" data-rc-drawer-save>${esc(RC_COPY.drawer.save)}</button>
        </div>
      </form>
    </aside>`;
  document.body.appendChild(wrap);

  let saving = false;
  const form = /** @type {HTMLFormElement} */ (wrap.querySelector('[data-rc-drawer-form]'));
  const errEl = wrap.querySelector('[data-rc-drawer-error]');
  const setError = (msg) => {
    if (!errEl) return;
    if (!msg) {
      errEl.textContent = '';
      errEl.classList.add('is-hidden');
      return;
    }
    errEl.textContent = msg;
    errEl.classList.remove('is-hidden');
  };
  const setBusy = (busy) => {
    saving = busy;
    wrap.classList.toggle('is-saving', busy);
    wrap.querySelectorAll('[data-rc-drawer-close], [data-rc-drawer-save]').forEach((el) => {
      /** @type {HTMLButtonElement} */ (el).disabled = busy;
    });
    form?.querySelectorAll('input, textarea, select').forEach((el) => {
      /** @type {HTMLInputElement} */ (el).disabled = busy;
    });
    const saveBtn = wrap.querySelector('[data-rc-drawer-save]');
    if (saveBtn) saveBtn.textContent = busy ? RC_COPY.drawer.saving : RC_COPY.drawer.save;
  };

  const close = () => {
    if (saving) return;
    document.removeEventListener('keydown', onKey);
    closeLayer(wrap);
  };
  wrap.querySelectorAll('[data-rc-drawer-close]').forEach((el) => el.addEventListener('click', close));
  const onKey = (e) => {
    if (e.key === 'Escape') close();
  };
  document.addEventListener('keydown', onKey);

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (saving) return;
    setError('');
    setBusy(true);
    try {
      await saveLightFieldSafe(roomId, field, form);
      saving = false;
      document.removeEventListener('keydown', onKey);
      closeLayer(wrap);
      rerender();
    } catch (err) {
      const msg =
        err instanceof Error && err.message
          ? `${RC_COPY.drawer.failPrefix}: ${err.message}`
          : RC_COPY.drawer.failPrefix;
      setError(msg);
      setBusy(false);
    }
  });
}

async function openCoverModal(roomId, rerender) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/jpeg,image/png,image/webp,image/*';
  input.addEventListener('change', async () => {
    const file = input.files?.[0];
    input.remove();
    if (!file) return;
    const err = await validatePromoImageFile(file);
    if (err) {
      alert(err);
      return;
    }
    const crop = await openPromoCropDialog(document.body, { file });
    if (!crop) return;
    try {
      await ensureEmbeddedRegister(roomId, { force: true });
      const id = Number(registerState.study_room_id || roomId);
      if (!id) {
        alert('공부방 정보를 먼저 저장한 뒤 사진을 올려 주세요.');
        return;
      }
      const image = await uploadPromoImage({
        studyRoomId: id,
        file,
        cropX: crop.cropX,
        cropY: crop.cropY,
        imageType: 'cover',
        sortOrder: 1,
      });
      const rest = (registerState.images || []).filter(
        (img) => img.image_type !== 'cover' && !img.is_system_default,
      );
      registerState.images = [image, ...rest];
      if (isRegistrationsApiMode()) {
        try {
          await hydrateRegistrationsCache();
        } catch {
          /* keep */
        }
      }
      await ensureEmbeddedRegister(roomId, { force: true });
      rerender();
    } catch (uploadErr) {
      alert(uploadErr instanceof Error ? uploadErr.message : '사진 업로드에 실패했습니다.');
    }
  });
  document.body.appendChild(input);
  input.click();
}

/** @param {HTMLElement} root @param {() => void} rerender */
export function bindRegistrationCheckEvents(root, rerender) {
  const page = root.querySelector('[data-rc-page]');
  if (!page) return;
  const roomId = Number(page.getAttribute('data-rc-room-id'));

  page.querySelectorAll('[data-rc-light]').forEach((btn) => {
    btn.addEventListener('click', () => {
      openDrawer(roomId, btn.getAttribute('data-rc-light') || '', rerender);
    });
  });

  page.querySelectorAll('[data-rc-heavy]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const section = /** @type {'basic'|'detail'|'detail2'} */ (btn.getAttribute('data-rc-heavy') || 'detail');
      window.location.hash = registrationCheckTabHref(roomId, section).slice(1);
    });
  });

  page.querySelectorAll('[data-rc-cover]').forEach((btn) => {
    btn.addEventListener('click', () => openCoverModal(roomId, rerender));
  });

  page.querySelector('[data-rc-plans]')?.addEventListener('click', (e) => {
    e.preventDefault();
    const href = page.querySelector('[data-rc-plans]')?.getAttribute('href') || '#/plans';
    window.location.hash = href.replace(/^#/, '');
  });
}
