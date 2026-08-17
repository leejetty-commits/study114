/**
 * 공부방 기본정보 입력 — 가입 기본등록과 현황 수정 팝업이 같은 레이아웃을 쓴다.
 *
 * 필수 5: 공부방명 · 주력과목 · 원장 성별 · 사업장주소 · 홍보지역 1곳
 * 선택: 집주소 · 홍보 2·3
 * 주소칸은 카카오 우편번호(더미 단지 목록 없이 호출).
 */

import { openKakaoPostcode } from './kakao-postcode.js';
import { displayRoad, matchRegion } from './address-region-match.js';
import { renderMainSubjectSelect } from './main-subjects.js';

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function blank(v) {
  return String(v ?? '').trim();
}

function defaultSlots(saved) {
  const slots = Array.isArray(saved) ? saved.map((row) => ({ ...row })) : [];
  while (slots.length < 3) {
    slots.push({
      region_id: '',
      complex_id: '',
      region_basis_type: 'dong',
      is_primary: slots.length === 0,
      address_text: '',
      complex_name: '',
      complex_address: '',
      region_label: '',
    });
  }
  if (!slots.some((s) => s.is_primary)) slots[0].is_primary = true;
  return slots.slice(0, 3);
}

function slotDisplay(slot) {
  const basis = slot.region_basis_type === 'complex' ? 'complex' : 'dong';
  if (basis === 'complex') {
    const name = blank(slot.complex_name) || blank(slot.complex_label);
    const addr = blank(slot.complex_address) || blank(slot.address_text);
    if (name && addr) return `${name} · ${addr}`;
    return name || addr;
  }
  return blank(slot.region_label) || blank(slot.address_text);
}

function slotFilled(slot) {
  const basis = slot.region_basis_type === 'complex' ? 'complex' : 'dong';
  if (basis === 'complex') {
    return Boolean(blank(slot.complex_id) || blank(slot.complex_name));
  }
  return Boolean(blank(slot.region_id));
}

function renderGender(options, selected) {
  const list = Array.isArray(options) ? options : [];
  return `
    <div class="form-radio-group" role="radiogroup">
      ${list
        .map(
          (t) => `
      <label class="form-radio">
        <input type="radio" name="gender" value="${esc(t.value)}" ${selected === t.value ? 'checked' : ''} required />
        <span class="form-radio__label">${esc(t.label)}</span>
      </label>`,
        )
        .join('')}
    </div>`;
}

function renderAddressBlock({
  key,
  label,
  required,
  zipName,
  addressName,
  zip,
  address,
  hint,
  extraHint,
}) {
  return `
    <div class="form-group form-address" data-address-pick="${esc(key)}">
      <label class="form-label${required ? ' form-label--required' : ''}">${esc(label)}${required ? '' : ' (선택)'}</label>
      <div class="form-address__zip-row">
        <input class="form-input" type="text" name="${esc(zipName)}" value="${esc(zip)}" placeholder="우편번호" readonly ${required ? 'required' : ''} aria-label="우편번호" />
        <button type="button" class="btn btn--secondary" data-address-search="${esc(key)}">주소 검색</button>
      </div>
      <input class="form-input" type="text" name="${esc(addressName)}" value="${esc(address)}" placeholder="도로명 주소 (검색으로 입력)" readonly ${required ? 'required' : ''} />
      ${hint ? `<p class="form-hint">${hint}</p>` : ''}
      ${extraHint || ''}
      <p class="form-hint" data-jibun-hint hidden></p>
    </div>`;
}

function renderPromoSlot(slot, idx) {
  const basis = slot.region_basis_type === 'complex' ? 'complex' : 'dong';
  const req = idx === 0;
  return `
    <div class="register-region-slot${slot.is_primary ? ' is-primary' : ''}" data-region-slot="${idx}">
      <div class="form-row" style="align-items:center;margin-bottom:var(--space-2);">
        <strong>홍보지역 ${idx + 1}${req ? ' (필수)' : ' (선택)'}</strong>
        <label class="form-check" style="margin-left:auto;">
          <input class="form-check__input" type="radio" name="is_primary" value="${idx}" ${slot.is_primary ? 'checked' : ''} />
          <span class="form-check__label">대표지역</span>
        </label>
      </div>
      <div class="chip-group" data-slot-basis-group>
        <label class="chip">
          <input type="radio" name="slot_basis_${idx}" value="dong" class="chip__input" ${basis === 'dong' ? 'checked' : ''} />
          <span class="chip__label">행정동</span>
        </label>
        <label class="chip">
          <input type="radio" name="slot_basis_${idx}" value="complex" class="chip__input" ${basis === 'complex' ? 'checked' : ''} />
          <span class="chip__label">아파트단지</span>
        </label>
      </div>
      <div class="form-address__zip-row" style="margin-top:var(--space-2);">
        <input
          class="form-input"
          type="text"
          data-field="address_display"
          value="${esc(slotDisplay(slot))}"
          placeholder="${req ? '주소 검색으로 입력' : '주소 검색 (선택)'}"
          readonly
        />
        <button type="button" class="btn btn--secondary" data-address-search="slot-${idx}">주소 검색</button>
      </div>
      <input type="hidden" data-field="region_id" value="${esc(slot.region_id || '')}" />
      <input type="hidden" data-field="complex_id" value="${esc(slot.complex_id || '')}" />
      <input type="hidden" data-field="region_basis_type" value="${esc(basis)}" />
      <input type="hidden" data-field="complex_name" value="${esc(slot.complex_name || '')}" />
      <input type="hidden" data-field="complex_address" value="${esc(slot.complex_address || slot.address_text || '')}" />
      <input type="hidden" data-field="region_label" value="${esc(slot.region_label || '')}" />
      <input type="hidden" data-field="address_text" value="${esc(slot.address_text || '')}" />
      <p class="form-hint" data-slot-resolved>${esc(slotDisplay(slot) ? (basis === 'complex' ? '아파트단지' : '행정동') + ' · ' + slotDisplay(slot) : '칸마다 행정동 또는 아파트단지를 고른 뒤 주소 검색으로 입력합니다.')}</p>
    </div>`;
}

/**
 * @param {{
 *   values?: Record<string, unknown>,
 *   genderOptions?: {value:string,label:string}[],
 * }} opts
 */
export function renderStudyRoomBasicFields(opts = {}) {
  const v = opts.values || {};
  const genderOptions = opts.genderOptions || [
    { value: 'male', label: '남' },
    { value: 'female', label: '여' },
  ];
  const slots = defaultSlots(v.saved_regions);

  return `
    <div class="register-basic-fields" data-study-room-basic-form>
      <div class="form-group">
        <label class="form-label form-label--required" for="study_room_name">공부방명</label>
        <input class="form-input" id="study_room_name" name="study_room_name" value="${esc(v.study_room_name || '')}" required />
      </div>
      <div class="form-group">
        <label class="form-label form-label--required" for="main_subject_note">주력과목 1개</label>
        <select class="form-input" id="main_subject_note" name="main_subject_note" required>
          ${renderMainSubjectSelect(v.main_subject_note || v.main_subjects?.[0] || '', { includeEmpty: true, emptyLabel: '과목 선택' })}
        </select>
      </div>
      <div class="form-group form-group--full">
        <span class="form-label form-label--required">원장 성별</span>
        <p class="form-hint">계정 프로필 성별과 같습니다. 여기서 바꾸면 과외쌤·마이페이지 표시도 함께 바뀝니다.</p>
        ${renderGender(genderOptions, v.gender || '')}
      </div>

      ${renderAddressBlock({
        key: 'home',
        label: '집주소',
        required: false,
        zipName: 'home_address_zip',
        addressName: 'home_address',
        zip: v.home_address_zip || '',
        address: v.home_address || '',
        hint: '계정·연락용입니다. 검색·지도·홍보에는 쓰지 않습니다.',
      })}

      ${renderAddressBlock({
        key: 'business',
        label: '사업장주소',
        required: true,
        zipName: 'address_zip',
        addressName: 'address_text',
        zip: v.address_zip || '',
        address: v.address_text || '',
        hint: '사업장주소가 지도에 나타납니다.',
        extraHint: `
          <input type="hidden" name="region_id" value="${esc(v.region_id || '')}" />
          <input type="hidden" name="complex_id" value="${esc(v.complex_id || '')}" />
          <input type="hidden" name="region_basis_type" value="${esc(v.region_basis_type || 'dong')}" />
          <input type="hidden" name="complex_name" value="${esc(v.complex_name || '')}" />
          <input type="hidden" name="complex_address" value="${esc(v.complex_address || '')}" />
          <input type="hidden" name="address_sido" value="${esc(v.address_sido || '')}" />
          <input type="hidden" name="address_sigungu" value="${esc(v.address_sigungu || '')}" />
          <input type="hidden" name="address_bname" value="${esc(v.address_bname || '')}" />
          <p class="form-hint" data-region-hint>${esc(v.region_label || '')}</p>
        `,
      })}

      <div class="form-group" data-promo-regions>
        <span class="form-label form-label--required">홍보지역</span>
        <p class="form-hint">3칸을 유지합니다. <strong>1곳은 필수</strong>, 2·3곳은 선택입니다. 빈 칸은 그대로 두고, 칸마다 행정동 또는 아파트단지를 고릅니다. 대표는 1곳만 지정하세요.</p>
        <div data-saved-regions>
          ${slots.map((slot, i) => renderPromoSlot(slot, i)).join('')}
        </div>
      </div>
    </div>
  `;
}

function setHint(el, text) {
  if (!el) return;
  el.hidden = !text;
  el.textContent = text || '';
}

function applyBusinessResult(root, result, region) {
  const zip = root.querySelector('[name="address_zip"]');
  const addr = root.querySelector('[name="address_text"]');
  const regionId = root.querySelector('[name="region_id"]');
  const complexId = root.querySelector('[name="complex_id"]');
  const basis = root.querySelector('[name="region_basis_type"]');
  const complexName = root.querySelector('[name="complex_name"]');
  const complexAddress = root.querySelector('[name="complex_address"]');
  const sido = root.querySelector('[name="address_sido"]');
  const sigungu = root.querySelector('[name="address_sigungu"]');
  const bname = root.querySelector('[name="address_bname"]');
  const regionHint = root.querySelector('[data-region-hint]');
  const jibun = root.querySelector('[data-address-pick="business"] [data-jibun-hint]');

  const road = displayRoad(result);
  if (zip) zip.value = result.zonecode;
  if (addr) addr.value = road;
  if (sido) sido.value = result.sido;
  if (sigungu) sigungu.value = result.sigungu;
  if (bname) bname.value = result.bname;
  if (regionId) regionId.value = region ? String(region.id) : '';
  const isApt = Boolean(result.apartment && result.buildingName);
  if (basis) basis.value = isApt ? 'complex' : 'dong';
  if (complexName) complexName.value = isApt ? result.buildingName : '';
  if (complexAddress) complexAddress.value = isApt ? road : '';
  if (complexId && !isApt) complexId.value = '';
  if (regionHint) {
    regionHint.textContent = region
      ? `행정동: ${region.label || result.bname}${isApt ? ` · 단지: ${result.buildingName}` : ''}`
      : '';
  }
  if (result.jibunAddress) {
    const prefix = result.convertedFromJibun ? '지번 → 도로명 변환됨' : '지번 참고';
    setHint(jibun, `${prefix}: ${result.jibunAddress}`);
  } else {
    setHint(jibun, '');
  }
}

function applyHomeResult(root, result) {
  const zip = root.querySelector('[name="home_address_zip"]');
  const addr = root.querySelector('[name="home_address"]');
  const jibun = root.querySelector('[data-address-pick="home"] [data-jibun-hint]');
  if (zip) zip.value = result.zonecode;
  if (addr) addr.value = displayRoad(result);
  if (result.jibunAddress) {
    const prefix = result.convertedFromJibun ? '지번 → 도로명 변환됨' : '지번 참고';
    setHint(jibun, `${prefix}: ${result.jibunAddress}`);
  } else {
    setHint(jibun, '');
  }
}

function applySlotResult(slotEl, result, region, basis) {
  const road = displayRoad(result);
  const regionId = slotEl.querySelector('[data-field="region_id"]');
  const complexId = slotEl.querySelector('[data-field="complex_id"]');
  const basisEl = slotEl.querySelector('[data-field="region_basis_type"]');
  const complexName = slotEl.querySelector('[data-field="complex_name"]');
  const complexAddress = slotEl.querySelector('[data-field="complex_address"]');
  const regionLabel = slotEl.querySelector('[data-field="region_label"]');
  const addressText = slotEl.querySelector('[data-field="address_text"]');
  const display = slotEl.querySelector('[data-field="address_display"]');
  const resolved = slotEl.querySelector('[data-slot-resolved]');

  if (basisEl) basisEl.value = basis;
  if (regionId) regionId.value = region ? String(region.id) : '';
  if (regionLabel) regionLabel.value = region?.label || result.bname || '';
  if (addressText) addressText.value = road;

  if (basis === 'complex') {
    if (complexName) complexName.value = result.buildingName;
    if (complexAddress) complexAddress.value = road;
    if (complexId) complexId.value = '';
    const text = `${result.buildingName}${road ? ` · ${road}` : ''}`;
    if (display) display.value = text;
    if (resolved) resolved.textContent = `아파트단지 · ${text}`;
  } else {
    if (complexName) complexName.value = '';
    if (complexAddress) complexAddress.value = '';
    if (complexId) complexId.value = '';
    const text = region?.label || result.bname || road;
    if (display) display.value = text;
    if (resolved) resolved.textContent = `행정동 · ${text}`;
  }
}

function clearSlot(slotEl) {
  slotEl.querySelectorAll('[data-field]').forEach((el) => {
    if (el.getAttribute('data-field') === 'region_basis_type') return;
    el.value = '';
  });
  const resolved = slotEl.querySelector('[data-slot-resolved]');
  if (resolved) resolved.textContent = '칸마다 행정동 또는 아파트단지를 고른 뒤 주소 검색으로 입력합니다.';
}

function slotBasisOf(slotEl) {
  return slotEl.querySelector('input[name^="slot_basis_"]:checked')?.value || 'dong';
}

/**
 * @param {HTMLElement} root
 * @param {{ regions?: Array<{id:number,label:string}> }} opts
 */
export function bindStudyRoomBasicFields(root, opts = {}) {
  const form = root.matches?.('[data-study-room-basic-form]')
    ? root
    : root.querySelector('[data-study-room-basic-form]') || root;
  const regions = () => opts.regions || [];

  async function search(kind) {
    await openKakaoPostcode((result) => {
      if (kind === 'home') {
        applyHomeResult(form, result);
        return;
      }
      if (kind === 'business') {
        const region = matchRegion(regions(), result);
        if (!region) {
          alert('이 주소의 행정동을 목록에서 찾지 못했습니다. 다른 주소를 검색해 주세요.');
        }
        applyBusinessResult(form, result, region);
        return;
      }
      const m = String(kind).match(/^slot-(\d+)$/);
      if (!m) return;
      const slotEl = form.querySelector(`[data-region-slot="${m[1]}"]`);
      if (!slotEl) return;
      const basis = slotBasisOf(slotEl);
      const region = matchRegion(regions(), result);
      if (!region) {
        alert('이 주소의 행정동을 목록에서 찾지 못했습니다. 다른 주소를 검색해 주세요.');
        return;
      }
      if (basis === 'complex') {
        if (!result.buildingName) {
          const useDong = confirm(
            '이 주소는 아파트 단지명이 없습니다. 행정동 기준으로 저장할까요?',
          );
          if (!useDong) return;
          const dongRadio = slotEl.querySelector('input[value="dong"]');
          if (dongRadio) dongRadio.checked = true;
          applySlotResult(slotEl, result, region, 'dong');
          return;
        }
      }
      applySlotResult(slotEl, result, region, basis);
    });
  }

  form.querySelectorAll('[data-address-search]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      try {
        await search(btn.getAttribute('data-address-search') || '');
      } catch (err) {
        alert(err instanceof Error ? err.message : '주소 검색을 열 수 없습니다.');
      }
    });
  });

  form.querySelectorAll('[data-region-slot] input[name^="slot_basis_"]').forEach((el) => {
    el.addEventListener('change', () => {
      const slotEl = el.closest('[data-region-slot]');
      if (!slotEl) return;
      const basisEl = slotEl.querySelector('[data-field="region_basis_type"]');
      if (basisEl) basisEl.value = el.value;
      clearSlot(slotEl);
      if (basisEl) basisEl.value = el.value;
    });
  });
}

/**
 * @param {HTMLElement} root
 */
export function collectStudyRoomBasicFields(root) {
  const wrap = root.matches?.('[data-study-room-basic-form]')
    ? root
    : root.querySelector('[data-study-room-basic-form]') || root;
  const htmlForm = wrap instanceof HTMLFormElement ? wrap : wrap.closest?.('form');
  const fd = htmlForm instanceof HTMLFormElement ? new FormData(htmlForm) : null;
  const get = (name) => {
    if (fd) return String(fd.get(name) ?? '');
    const checked = wrap.querySelector(`[name="${name}"]:checked`);
    if (checked) return String(checked.value ?? '');
    return String(wrap.querySelector(`[name="${name}"]`)?.value ?? '');
  };

  const primaryIdx = Number(wrap.querySelector('input[name="is_primary"]:checked')?.value ?? 0);
  const saved_regions = [];
  wrap.querySelectorAll('[data-region-slot]').forEach((slotEl, idx) => {
    const basis = slotBasisOf(slotEl);
    saved_regions.push({
      region_id: slotEl.querySelector('[data-field="region_id"]')?.value || '',
      complex_id: slotEl.querySelector('[data-field="complex_id"]')?.value || '',
      region_basis_type: basis,
      is_primary: idx === primaryIdx,
      complex_name: slotEl.querySelector('[data-field="complex_name"]')?.value || '',
      complex_address: slotEl.querySelector('[data-field="complex_address"]')?.value || '',
      region_label: slotEl.querySelector('[data-field="region_label"]')?.value || '',
      address_text: slotEl.querySelector('[data-field="address_text"]')?.value || '',
    });
  });

  return {
    study_room_name: get('study_room_name'),
    main_subject_note: get('main_subject_note'),
    gender: get('gender'),
    home_address: get('home_address'),
    home_address_zip: get('home_address_zip'),
    address_text: get('address_text'),
    address_zip: get('address_zip'),
    region_id: get('region_id'),
    complex_id: get('complex_id'),
    region_basis_type: get('region_basis_type') || 'dong',
    complex_name: get('complex_name'),
    complex_address: get('complex_address'),
    address_sido: get('address_sido'),
    address_sigungu: get('address_sigungu'),
    address_bname: get('address_bname'),
    saved_regions,
  };
}

/**
 * @param {ReturnType<typeof collectStudyRoomBasicFields>} data
 * @returns {string|null}
 */
export function validateStudyRoomBasicFields(data) {
  if (!blank(data.study_room_name)) return '공부방명을 입력해 주세요.';
  if (!blank(data.main_subject_note)) return '주력과목을 선택해 주세요.';
  if (!['male', 'female'].includes(blank(data.gender))) return '원장 성별을 선택해 주세요.';
  if (!blank(data.address_text)) return '사업장주소를 검색해 주세요.';
  if (!blank(data.region_id)) {
    return '사업장주소의 행정동을 찾지 못했습니다. 주소 검색으로 다시 선택해 주세요.';
  }

  const slots = Array.isArray(data.saved_regions) ? data.saved_regions : [];
  const filledIdx = slots.map((s, i) => (slotFilled(s) ? i : -1)).filter((i) => i >= 0);
  if (!filledIdx.length) return '홍보지역을 1곳 이상 선택해 주세요.';

  for (const i of filledIdx) {
    const slot = slots[i];
    if (!blank(slot.region_id)) {
      return `홍보지역 ${i + 1}의 행정동을 찾지 못했습니다. 주소 검색으로 다시 선택해 주세요.`;
    }
    if (slot.region_basis_type === 'complex' && !blank(slot.complex_id) && !blank(slot.complex_name)) {
      return `홍보지역 ${i + 1}의 아파트단지를 주소 검색으로 선택해 주세요.`;
    }
  }

  let primaryIdx = slots.findIndex((s) => s.is_primary);
  if (!filledIdx.includes(primaryIdx)) primaryIdx = filledIdx[0];
  data.saved_regions = slots.map((s, i) => ({ ...s, is_primary: i === primaryIdx }));
  return null;
}

export function applyStudyRoomBasicToState(state, data) {
  Object.assign(state, {
    study_room_name: data.study_room_name,
    main_subject_note: data.main_subject_note,
    gender: data.gender,
    home_address: data.home_address,
    home_address_zip: data.home_address_zip,
    address_text: data.address_text,
    address_zip: data.address_zip,
    region_id: data.region_id,
    complex_id: data.complex_id,
    region_basis_type: data.region_basis_type,
    complex_name: data.complex_name,
    complex_address: data.complex_address,
    address_sido: data.address_sido,
    address_sigungu: data.address_sigungu,
    address_bname: data.address_bname,
    saved_regions: data.saved_regions,
  });
}
