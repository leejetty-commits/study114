/**
 * 학생 상세등록 — 공부방/과외 희망지역 1~3 UI
 */

import { openKakaoPostcode } from '../../../shared/kakao-postcode.js';
import {
  hydrateDualHopeRegions,
  normalizeHopeSlots,
  primaryHopeRegionLabel,
  validateDualHopeRegions,
} from '../../../shared/student-hope-regions.js';
import {
  complexesForRegion,
  ensureHopeRegionMasters,
  labelForComplexId,
  labelForRegionId,
  listCityOptions,
  getHopeRegionMasters,
} from './hope-region-masters.js';

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
}

function dongOptions(selectedId) {
  const { regions } = getHopeRegionMasters();
  return [
    '<option value="">행정동 선택</option>',
    ...regions.map(
      (r) =>
        `<option value="${esc(r.id)}" ${String(selectedId) === String(r.id) ? 'selected' : ''}>${esc(r.label)}</option>`,
    ),
  ].join('');
}

function complexOptions(regionId, selectedId) {
  const list = complexesForRegion(regionId);
  return [
    '<option value="">— 동 기준 (단지 없음) —</option>',
    ...list.map(
      (c) =>
        `<option value="${esc(c.id)}" ${String(selectedId) === String(c.id) ? 'selected' : ''}>${esc(c.label)}</option>`,
    ),
  ].join('');
}

function cityOptions(selectedId, selectedLabel) {
  const cities = listCityOptions();
  const sel = String(selectedId || '');
  const selLabel = String(selectedLabel || '');
  return [
    '<option value="">시 선택</option>',
    ...cities.map((c) => {
      const selected =
        String(c.id) === sel || (!sel && selLabel && c.label === selLabel) ? 'selected' : '';
      return `<option value="${esc(c.id)}" data-city-label="${esc(c.label)}" ${selected}>${esc(c.label)}</option>`;
    }),
  ].join('');
}

function renderStudySlot(slot, idx) {
  const req = idx === 0 ? 'required' : '';
  return `
    <div class="p19-hope-slot" data-hope-axis="studyroom" data-hope-slot="${idx}">
      <div class="p19-hope-slot__head">
        <strong>공부방 ${idx + 1}${idx === 0 ? ' (필수)' : ' (선택)'}</strong>
      </div>
      <div class="p19-field-grid p19-field-grid--2">
        <label class="p19-field">
          <span class="p19-field__label">행정동</span>
          <select class="student-form__select" name="studyroom_region_${idx}" data-hope-field="region_id" ${req}>
            ${dongOptions(slot.region_id)}
          </select>
        </label>
        <label class="p19-field">
          <span class="p19-field__label">아파트단지</span>
          <select class="student-form__select" name="studyroom_complex_${idx}" data-hope-field="complex_id">
            ${complexOptions(slot.region_id, slot.complex_id)}
          </select>
        </label>
      </div>
      <label class="p19-field p19-field--full">
        <span class="p19-field__label">주소검색 · 선택 (선택)</span>
        <span class="p19-field__hint">행정동/단지 선택 후 필요하면 주소를 검색해 보완합니다</span>
        <div class="p19-hope-address-row">
          <input
            class="student-form__input"
            type="text"
            name="studyroom_address_${idx}"
            data-hope-field="address_text"
            value="${esc(slot.address_text || '')}"
            placeholder="도로명·지번 요약"
            readonly
          />
          <button type="button" class="btn btn--secondary btn--sm" data-hope-address-search="${idx}">주소검색</button>
        </div>
      </label>
    </div>`;
}

function renderTutorSlot(slot, idx) {
  const req = idx === 0 ? 'required' : '';
  return `
    <div class="p19-hope-slot" data-hope-axis="tutor" data-hope-slot="${idx}">
      <div class="p19-hope-slot__head">
        <strong>과외쌤 ${idx + 1}${idx === 0 ? ' (필수)' : ' (선택)'}</strong>
      </div>
      <label class="p19-field p19-field--full">
        <span class="p19-field__label">활동 시</span>
        <span class="p19-field__hint">시 단위만 · 구/동 선택은 없습니다</span>
        <select class="student-form__select" name="tutor_region_${idx}" data-hope-field="region_id" ${req}>
          ${cityOptions(slot.region_id, slot.region_label)}
        </select>
      </label>
    </div>`;
}

/**
 * @param {import('./store.js').StudentRecord} student
 */
export function renderDualHopeRegionsSection(student) {
  const { preferred_studyroom_regions: study, preferred_tutor_regions: tutor } =
    hydrateDualHopeRegions(student);

  return `
    <div class="p19-hope-dual" data-p19-hope-dual>
      <div class="p19-hope-axis" data-hope-axis-block="studyroom">
        <h4 class="p19-hope-axis__title">공부방 희망지역</h4>
        <p class="p19-field__hint">행정동/아파트단지 · 1필수 + 추가 2 · 같은 축 중복 불가</p>
        ${study.map((s, i) => renderStudySlot(s, i)).join('')}
      </div>
      <div class="p19-hope-axis" data-hope-axis-block="tutor">
        <h4 class="p19-hope-axis__title">과외쌤 희망지역</h4>
        <p class="p19-field__hint">시 기준만 · 1필수 + 추가 2 · 같은 축 중복 불가</p>
        ${tutor.map((s, i) => renderTutorSlot(s, i)).join('')}
      </div>
      <label class="p19-field p19-field--full">
        <span class="p19-field__label">지역 보조 메모</span>
        <input
          class="student-form__input"
          name="preferred_region_note"
          value="${esc(student.preferred_region_note || '')}"
          placeholder="예: 대치역 도보 10분"
        />
      </label>
    </div>`;
}

/**
 * @param {HTMLFormElement} form
 * @param {'tutor'|'study_room'} [hopeType]
 */
export function collectDualHopeRegions(form, hopeType = 'tutor') {
  const study = [0, 1, 2].map((idx) => {
    const regionId = String(form.querySelector(`[name="studyroom_region_${idx}"]`)?.value || '').trim();
    const complexId = String(form.querySelector(`[name="studyroom_complex_${idx}"]`)?.value || '').trim();
    const address = String(form.querySelector(`[name="studyroom_address_${idx}"]`)?.value || '').trim();
    return {
      region_id: regionId,
      region_label: regionId ? labelForRegionId(regionId) : '',
      complex_id: complexId,
      complex_label: complexId ? labelForComplexId(complexId) : '',
      address_text: address,
      scope_type: /** @type {const} */ ('dong'),
      is_primary: idx === 0,
    };
  });

  const tutor = [0, 1, 2].map((idx) => {
    const select = form.querySelector(`[name="tutor_region_${idx}"]`);
    const regionId = String(select?.value || '').trim();
    const opt = select?.selectedOptions?.[0];
    const cityLabel = opt?.dataset?.cityLabel || opt?.textContent || '';
    return {
      region_id: regionId,
      region_label: regionId ? String(cityLabel).trim() : '',
      complex_id: '',
      complex_label: '',
      address_text: '',
      scope_type: /** @type {const} */ ('city'),
      is_primary: idx === 0,
    };
  });

  const error = validateDualHopeRegions(study, tutor);
  const studyNorm = normalizeHopeSlots(study);
  const tutorNorm = normalizeHopeSlots(tutor);
  const draft = {
    preferred_studyroom_regions: studyNorm,
    preferred_tutor_regions: tutorNorm,
    preferred_lesson_type: hopeType,
  };

  return {
    preferred_studyroom_regions: studyNorm,
    preferred_tutor_regions: tutorNorm,
    preferred_region_note: String(form.querySelector('[name="preferred_region_note"]')?.value || '').trim(),
    preferred_studyroom_region_id: studyNorm[0].region_id || '',
    preferred_tutor_region_id: tutorNorm[0].region_id || '',
    preferred_studyroom_complex_id: studyNorm[0].complex_id || '',
    region_label: primaryHopeRegionLabel(draft),
    region_id:
      hopeType === 'study_room' ? studyNorm[0].region_id || '' : tutorNorm[0].region_id || '',
    error,
  };
}

/** @param {HTMLElement} root */
export function bindDualHopeRegionsEvents(root) {
  ensureHopeRegionMasters().then(() => {
    root.querySelectorAll('[data-hope-axis="studyroom"][data-hope-slot]').forEach((slot) => {
      const regionSel = slot.querySelector('[data-hope-field="region_id"]');
      const complexSel = slot.querySelector('[data-hope-field="complex_id"]');
      if (!regionSel || !complexSel) return;
      const current = complexSel.value;
      const opts = complexOptions(regionSel.value, current);
      if (complexSel.innerHTML !== opts) complexSel.innerHTML = opts;
    });
  });

  root.querySelectorAll('[data-hope-axis="studyroom"] [data-hope-field="region_id"]').forEach((sel) => {
    sel.addEventListener('change', () => {
      const slot = sel.closest('[data-hope-slot]');
      const complexSel = slot?.querySelector('[data-hope-field="complex_id"]');
      if (complexSel) complexSel.innerHTML = complexOptions(sel.value, '');
    });
  });

  root.querySelectorAll('[data-hope-address-search]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const idx = btn.getAttribute('data-hope-address-search');
      const input = root.querySelector(`[name="studyroom_address_${idx}"]`);
      try {
        await openKakaoPostcode((result) => {
          if (input) {
            input.value = [result.roadAddress, result.buildingExtra].filter(Boolean).join(' ').trim();
          }
        });
      } catch (err) {
        alert(err instanceof Error ? err.message : '주소 검색을 열 수 없습니다.');
      }
    });
  });
}
