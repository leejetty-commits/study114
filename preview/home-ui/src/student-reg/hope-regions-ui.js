/**
 * 학생 상세등록 — 희망지역 UI
 * 공부방: 행정동|단지 선선택 후 해당 기준만 · 과외: 시만
 * 기본등록 seed와 같은 최종 필드 수정/확장
 */

import { openKakaoPostcode } from '../../../shared/kakao-postcode.js';
import {
  hydrateDualHopeRegions,
  normalizeHopeSlots,
  primaryHopeRegionLabel,
  validateHopeAxisSlots,
} from '../../../shared/student-hope-regions.js';
import {
  addressForComplexId,
  ensureHopeRegionMasters,
  labelForComplexId,
  labelForRegionId,
  listAllComplexes,
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

function complexOptions(selectedId) {
  const list = listAllComplexes();
  return [
    '<option value="">아파트단지 선택</option>',
    ...list.map((c) => {
      const addr = c.address ? ` — ${c.address}` : '';
      return `<option value="${esc(c.id)}" data-region-id="${esc(c.region_id)}" data-address="${esc(c.address || '')}" ${String(selectedId) === String(c.id) ? 'selected' : ''}>${esc(c.label)}${esc(addr)}</option>`;
    }),
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

function resolveStudyBasis(student, studySlots) {
  const saved = student?.preferred_studyroom_region_basis;
  if (saved === 'dong' || saved === 'complex') return saved;
  if (studySlots?.[0]?.complex_id) return 'complex';
  return 'dong';
}

function renderStudySlot(slot, idx, basis) {
  const req = idx === 0 ? 'required' : '';
  if (basis === 'complex') {
    return `
    <div class="p19-hope-slot" data-hope-axis="studyroom" data-hope-slot="${idx}" data-hope-basis="complex">
      <div class="p19-hope-slot__head">
        <strong>공부방 ${idx + 1}${idx === 0 ? ' (필수)' : ' (선택)'} · 아파트단지</strong>
      </div>
      <label class="p19-field p19-field--full">
        <span class="p19-field__label">아파트단지</span>
        <select class="student-form__select" name="studyroom_complex_${idx}" data-hope-field="complex_id" ${req}>
          ${complexOptions(slot.complex_id)}
        </select>
        <span class="p19-field__hint" data-complex-addr="${idx}">${esc(addressForComplexId(slot.complex_id) || '단지 선택 시 주소 표시')}</span>
      </label>
      <input type="hidden" name="studyroom_region_${idx}" data-hope-field="region_id" value="${esc(slot.region_id || '')}" />
    </div>`;
  }
  return `
    <div class="p19-hope-slot" data-hope-axis="studyroom" data-hope-slot="${idx}" data-hope-basis="dong">
      <div class="p19-hope-slot__head">
        <strong>공부방 ${idx + 1}${idx === 0 ? ' (필수)' : ' (선택)'} · 행정동</strong>
      </div>
      <label class="p19-field p19-field--full">
        <span class="p19-field__label">행정동</span>
        <select class="student-form__select" name="studyroom_region_${idx}" data-hope-field="region_id" ${req}>
          ${dongOptions(slot.region_id)}
        </select>
      </label>
      <input type="hidden" name="studyroom_complex_${idx}" data-hope-field="complex_id" value="" />
      <label class="p19-field p19-field--full">
        <span class="p19-field__label">주소검색 · 선택 (선택)</span>
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
        <span class="p19-field__hint">시 단위만 · 구/동/단지 선택 없음</span>
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
  const hope = student?.preferred_lesson_type === 'study_room' ? 'study_room' : 'tutor';
  const basis = resolveStudyBasis(student, study);
  const allowComplex = listAllComplexes().length > 0;
  const effectiveBasis = allowComplex ? basis : 'dong';

  if (hope === 'tutor') {
    return `
    <div class="p19-hope-dual" data-p19-hope-dual data-active-hope="tutor">
      <div class="p19-hope-axis" data-hope-axis-block="tutor">
        <h4 class="p19-hope-axis__title">과외쌤 희망지역</h4>
        <p class="p19-field__hint">시 기준 · 1필수 + 추가 2 · 기본등록 seed와 같은 필드</p>
        ${tutor.map((s, i) => renderTutorSlot(s, i)).join('')}
      </div>
      <label class="p19-field p19-field--full">
        <span class="p19-field__label">지역 보조 메모</span>
        <input class="student-form__input" name="preferred_region_note" value="${esc(student.preferred_region_note || '')}" placeholder="예: 강남권 위주" />
      </label>
    </div>`;
  }

  return `
    <div class="p19-hope-dual" data-p19-hope-dual data-active-hope="study_room">
      <div class="p19-hope-axis" data-hope-axis-block="studyroom">
        <h4 class="p19-hope-axis__title">공부방 희망지역</h4>
        <p class="p19-field__hint">기준 선선택 후 같은 기준으로만 1~3 · 행정동과 단지 혼용 금지</p>
        <div class="p19-chip-group" role="radiogroup" aria-label="지역 기준">
          <label class="p19-chip${effectiveBasis === 'dong' ? ' is-checked' : ''}">
            <input type="radio" name="preferred_studyroom_region_basis" value="dong" ${effectiveBasis === 'dong' ? 'checked' : ''} data-hope-basis-switch />
            <span class="p19-chip__label">행정동 기준</span>
          </label>
          ${
            allowComplex
              ? `<label class="p19-chip${effectiveBasis === 'complex' ? ' is-checked' : ''}">
            <input type="radio" name="preferred_studyroom_region_basis" value="complex" ${effectiveBasis === 'complex' ? 'checked' : ''} data-hope-basis-switch />
            <span class="p19-chip__label">아파트단지 기준</span>
          </label>`
              : '<p class="p19-field__hint">등록된 아파트단지가 없어 행정동 기준만 사용합니다.</p>'
          }
        </div>
        <div data-hope-study-slots>
          ${study.map((s, i) => renderStudySlot(s, i, effectiveBasis)).join('')}
        </div>
      </div>
      <label class="p19-field p19-field--full">
        <span class="p19-field__label">지역 보조 메모</span>
        <input class="student-form__input" name="preferred_region_note" value="${esc(student.preferred_region_note || '')}" placeholder="예: 대치역 도보 10분" />
      </label>
    </div>`;
}

/**
 * @param {HTMLFormElement} form
 * @param {'tutor'|'study_room'} [hopeType]
 */
export function collectDualHopeRegions(form, hopeType = 'tutor') {
  const basis =
    hopeType === 'study_room'
      ? String(form.querySelector('[name="preferred_studyroom_region_basis"]:checked')?.value || 'dong')
      : '';

  const study = [0, 1, 2].map((idx) => {
    if (hopeType !== 'study_room') {
      return {
        region_id: '',
        region_label: '',
        complex_id: '',
        complex_label: '',
        address_text: '',
        scope_type: /** @type {const} */ ('dong'),
        is_primary: idx === 0,
      };
    }
    if (basis === 'complex') {
      const complexId = String(form.querySelector(`[name="studyroom_complex_${idx}"]`)?.value || '').trim();
      const opt = form.querySelector(`[name="studyroom_complex_${idx}"]`)?.selectedOptions?.[0];
      const regionId = String(opt?.dataset?.regionId || form.querySelector(`[name="studyroom_region_${idx}"]`)?.value || '').trim();
      return {
        region_id: regionId,
        region_label: regionId ? labelForRegionId(regionId) : '',
        complex_id: complexId,
        complex_label: complexId ? labelForComplexId(complexId) : '',
        address_text: complexId ? addressForComplexId(complexId) : '',
        scope_type: /** @type {const} */ ('dong'),
        is_primary: idx === 0,
      };
    }
    const regionId = String(form.querySelector(`[name="studyroom_region_${idx}"]`)?.value || '').trim();
    const address = String(form.querySelector(`[name="studyroom_address_${idx}"]`)?.value || '').trim();
    return {
      region_id: regionId,
      region_label: regionId ? labelForRegionId(regionId) : '',
      complex_id: '',
      complex_label: '',
      address_text: address,
      scope_type: /** @type {const} */ ('dong'),
      is_primary: idx === 0,
    };
  });

  const tutor = [0, 1, 2].map((idx) => {
    if (hopeType !== 'tutor') {
      return {
        region_id: '',
        region_label: '',
        complex_id: '',
        complex_label: '',
        address_text: '',
        scope_type: /** @type {const} */ ('city'),
        is_primary: idx === 0,
      };
    }
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

  const studyNorm = normalizeHopeSlots(study);
  const tutorNorm = normalizeHopeSlots(tutor);
  let error = null;
  if (hopeType === 'study_room') {
    error = validateHopeAxisSlots(studyNorm, 'studyroom');
    if (!error && basis === 'complex' && !studyNorm[0]?.complex_id) {
      error = '공부방 희망지역 1번(아파트단지)을 선택해 주세요.';
    }
  } else {
    error = validateHopeAxisSlots(tutorNorm, 'tutor');
  }

  const draft = {
    preferred_studyroom_regions: studyNorm,
    preferred_tutor_regions: tutorNorm,
    preferred_lesson_type: hopeType,
    preferred_studyroom_region_basis: hopeType === 'study_room' ? basis : '',
  };

  return {
    preferred_studyroom_regions: studyNorm,
    preferred_tutor_regions: tutorNorm,
    preferred_region_note: String(form.querySelector('[name="preferred_region_note"]')?.value || '').trim(),
    preferred_studyroom_region_id: studyNorm[0].region_id || '',
    preferred_tutor_region_id: tutorNorm[0].region_id || '',
    preferred_studyroom_complex_id: basis === 'complex' ? studyNorm[0].complex_id || '' : '',
    preferred_studyroom_region_basis: hopeType === 'study_room' ? basis : '',
    region_label: primaryHopeRegionLabel(draft),
    region_id:
      hopeType === 'study_room' ? studyNorm[0].region_id || '' : tutorNorm[0].region_id || '',
    error,
  };
}

/** @param {HTMLElement} root */
export function bindDualHopeRegionsEvents(root) {
  ensureHopeRegionMasters().then(() => {
    /* masters ready */
  });

  root.querySelectorAll('[data-hope-basis-switch]').forEach((el) => {
    el.addEventListener('change', () => {
      const form = root.querySelector('form[data-p19-form="detail"]') || root;
      const basis = form.querySelector('[name="preferred_studyroom_region_basis"]:checked')?.value || 'dong';
      const slotsWrap = root.querySelector('[data-hope-study-slots]');
      if (!slotsWrap) return;
      const empty = [{}, {}, {}].map((_, i) => ({
        region_id: '',
        complex_id: '',
        address_text: '',
        is_primary: i === 0,
      }));
      slotsWrap.innerHTML = empty.map((s, i) => renderStudySlot(s, i, basis)).join('');
      bindStudySlotExtras(root);
    });
  });

  bindStudySlotExtras(root);
}

/** @param {HTMLElement} root */
function bindStudySlotExtras(root) {
  root.querySelectorAll('[data-hope-axis="studyroom"] [data-hope-field="complex_id"]').forEach((sel) => {
    sel.addEventListener('change', () => {
      const slot = sel.closest('[data-hope-slot]');
      const idx = slot?.getAttribute('data-hope-slot');
      const opt = sel.selectedOptions?.[0];
      const regionHidden = slot?.querySelector('[data-hope-field="region_id"]');
      if (regionHidden && opt?.dataset?.regionId) regionHidden.value = opt.dataset.regionId;
      const hint = root.querySelector(`[data-complex-addr="${idx}"]`);
      if (hint) hint.textContent = opt?.dataset?.address || '단지 선택 시 주소 표시';
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
