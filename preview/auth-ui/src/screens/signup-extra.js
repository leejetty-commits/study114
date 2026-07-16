import { signupState } from '../state.js';
import { renderAuthShell, renderStepIndicator, renderRoleBadge, bindGlobalEvents, navigate } from '../layout.js';
import { parseHashQuery } from '../../../shared/preview-links.js';
import { resolvePostLoginUrl } from '../../../shared/auth-redirect.js';

function esc(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** @param {string} label */
function parseRegionParts(label) {
  const parts = String(label || '')
    .replace(/\s*\(API 로딩 중\)\s*$/, '')
    .trim()
    .split(/\s+/);
  return {
    sido: parts[0] || '',
    gugun: parts[1] || '',
    dong: parts.slice(2).join(' ') || '',
  };
}

function buildRegionIndex(regions) {
  /** @type {Map<string, Map<string, Array<{id:number,label:string,dong:string}>>>} */
  const tree = new Map();
  regions.forEach((r) => {
    const { sido, gugun, dong } = parseRegionParts(r.label);
    if (!sido || !gugun) return;
    if (!tree.has(sido)) tree.set(sido, new Map());
    const gMap = tree.get(sido);
    if (!gMap.has(gugun)) gMap.set(gugun, []);
    gMap.get(gugun).push({ id: r.id, label: r.label, dong });
  });
  return tree;
}

function defaultSlots() {
  const saved = signupState.extraRegister?.activity_regions;
  if (Array.isArray(saved) && saved.length) {
    while (saved.length < 3) {
      saved.push({ sido: '', gugun: '', region_id: '', is_primary: false });
    }
    return saved.slice(0, 3);
  }
  return [
    { sido: '', gugun: '', region_id: '', is_primary: true },
    { sido: '', gugun: '', region_id: '', is_primary: false },
    { sido: '', gugun: '', region_id: '', is_primary: false },
  ];
}

function renderSlot(slot, idx, tree) {
  const sidos = [...tree.keys()];
  const guguns = slot.sido && tree.has(slot.sido) ? [...tree.get(slot.sido).keys()] : [];
  const dongs =
    slot.sido && slot.gugun && tree.get(slot.sido)?.get(slot.gugun)
      ? tree.get(slot.sido).get(slot.gugun)
      : [];

  return `
    <div class="extra-region-slot" data-region-slot="${idx}">
      <div class="form-row" style="align-items:center;margin-bottom:var(--space-2);">
        <strong>활동 지역 ${idx + 1}</strong>
        <div style="margin-left:auto;display:flex;gap:0.5rem;align-items:center;">
          <button type="button" class="btn btn--ghost btn--sm" data-action="move-up" data-idx="${idx}" ${idx === 0 ? 'disabled' : ''}>▲</button>
          <button type="button" class="btn btn--ghost btn--sm" data-action="move-down" data-idx="${idx}" ${idx === 2 ? 'disabled' : ''}>▼</button>
          <label class="form-check">
            <input type="radio" name="is_primary" value="${idx}" ${slot.is_primary ? 'checked' : ''} />
            <span class="form-check__label">대표</span>
          </label>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="sido-${idx}">시·도</label>
          <select class="form-input" name="sido_${idx}" id="sido-${idx}" data-field="sido">
            <option value="">선택</option>
            ${sidos.map((s) => `<option value="${esc(s)}" ${slot.sido === s ? 'selected' : ''}>${esc(s)}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="gugun-${idx}">구·군</label>
          <select class="form-input" name="gugun_${idx}" id="gugun-${idx}" data-field="gugun">
            <option value="">선택</option>
            ${guguns.map((g) => `<option value="${esc(g)}" ${slot.gugun === g ? 'selected' : ''}>${esc(g)}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label" for="region-${idx}">동·세부 (선택)</label>
        <select class="form-input" name="region_id_${idx}" id="region-${idx}" data-field="region_id">
          <option value="">구·군 단위로 저장</option>
          ${dongs
            .map(
              (d) =>
                `<option value="${d.id}" ${String(slot.region_id) === String(d.id) ? 'selected' : ''}>${esc(d.dong || d.label)}</option>`,
            )
            .join('')}
        </select>
      </div>
    </div>
  `;
}

export function renderSignupExtra() {
  const role = signupState.role || 'tutor';
  if (role !== 'tutor' && role !== 'study_room') {
    navigate('/signup/complete');
    return renderAuthShell('<p>추가입력은 공부방·과외쌤만 해당합니다.</p>');
  }

  const regions =
    signupState.regions.length > 0
      ? signupState.regions
      : [{ id: 1, label: '서울특별시 강남구 대치동' }];
  const tree = buildRegionIndex(regions);
  const slots = defaultSlots();
  const oauthMode = parseHashQuery().from === 'oauth';

  const content = `
    ${oauthMode ? '' : renderStepIndicator(5)}
    <div class="panel auth-shell__card--wide">
      <h1 class="auth-heading">추가입력</h1>
      <p class="auth-subheading mb-6">대표 활동 지역을 최대 3곳까지 시·구 단위로 선택하세요. 순서는 ▲▼로 바꿀 수 있으며, 가입 후 마이페이지에서도 변경할 수 있습니다.</p>
      ${renderRoleBadge(role)}
      <form data-form="signup-extra" class="basic-register mt-6">
        ${slots.map((slot, i) => renderSlot(slot, i, tree)).join('')}
        <p class="form-note mt-4">대표 지역 1곳은 반드시 지정해 주세요. 비워 둔 슬롯은 저장되지 않습니다.</p>
        <div class="actions-stack">
          <button type="submit" class="btn btn--primary btn--block">추가입력 완료</button>
          <button type="button" class="btn btn--secondary btn--block" data-nav="/signup/basic">이전</button>
        </div>
      </form>
    </div>
  `;

  return renderAuthShell(content, {
    wide: true,
    showBack: true,
    backPath: '/signup/basic',
    backLabel: '기본등록',
  });
}

function readSlots(form) {
  return [...form.querySelectorAll('[data-region-slot]')].map((el, idx) => ({
    sido: el.querySelector('[data-field="sido"]')?.value || '',
    gugun: el.querySelector('[data-field="gugun"]')?.value || '',
    region_id: el.querySelector('[data-field="region_id"]')?.value || '',
    is_primary: form.querySelector(`input[name="is_primary"][value="${idx}"]`)?.checked || false,
  }));
}

function rebuildForm(root, slots) {
  signupState.extraRegister = { ...(signupState.extraRegister || {}), activity_regions: slots };
  root.innerHTML = renderSignupExtra();
  bindSignupExtraEvents(root);
}

export function bindSignupExtraEvents(root) {
  bindGlobalEvents(root);
  const form = root.querySelector('[data-form="signup-extra"]');
  if (!form) return;

  const regions =
    signupState.regions.length > 0
      ? signupState.regions
      : [{ id: 1, label: '서울특별시 강남구 대치동' }];
  const tree = buildRegionIndex(regions);

  form.querySelectorAll('[data-region-slot]').forEach((slotEl) => {
    const sidoSel = slotEl.querySelector('[data-field="sido"]');
    const gugunSel = slotEl.querySelector('[data-field="gugun"]');
    const regionSel = slotEl.querySelector('[data-field="region_id"]');

    sidoSel?.addEventListener('change', () => {
      const sido = sidoSel.value;
      const guguns = sido && tree.has(sido) ? [...tree.get(sido).keys()] : [];
      gugunSel.innerHTML =
        `<option value="">선택</option>` +
        guguns.map((g) => `<option value="${esc(g)}">${esc(g)}</option>`).join('');
      regionSel.innerHTML = `<option value="">구·군 단위로 저장</option>`;
    });

    gugunSel?.addEventListener('change', () => {
      const sido = sidoSel.value;
      const gugun = gugunSel.value;
      const dongs = sido && gugun && tree.get(sido)?.get(gugun) ? tree.get(sido).get(gugun) : [];
      regionSel.innerHTML =
        `<option value="">구·군 단위로 저장</option>` +
        dongs
          .map((d) => `<option value="${d.id}">${esc(d.dong || d.label)}</option>`)
          .join('');
    });
  });

  form.querySelectorAll('[data-action="move-up"], [data-action="move-down"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.idx);
      const slots = readSlots(form);
      const target = btn.dataset.action === 'move-up' ? idx - 1 : idx + 1;
      if (target < 0 || target > 2) return;
      const tmp = slots[idx];
      slots[idx] = slots[target];
      slots[target] = tmp;
      rebuildForm(root, slots);
    });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const slots = readSlots(form).filter((s) => s.sido && s.gugun);
    if (!slots.length) {
      alert('활동 지역을 1곳 이상 선택해 주세요.');
      return;
    }
    if (!slots.some((s) => s.is_primary)) {
      slots[0].is_primary = true;
    }
    if (slots.filter((s) => s.is_primary).length > 1) {
      let seen = false;
      slots.forEach((s) => {
        if (s.is_primary && seen) s.is_primary = false;
        else if (s.is_primary) seen = true;
      });
    }

    signupState.extraRegister = {
      ...(signupState.extraRegister || {}),
      activity_regions: slots,
    };

    // 기본등록 데이터에 대표 region_id도 반영 (API 호환)
    const role = signupState.role || 'tutor';
    const primary = slots.find((s) => s.is_primary) || slots[0];
    if (signupState.basicRegister?.[role]) {
      signupState.basicRegister[role].region_id = primary.region_id || '';
      signupState.basicRegister[role].activity_regions = slots;
      signupState.basicRegister[role].region_label = [primary.sido, primary.gugun]
        .filter(Boolean)
        .join(' ');
    }

    if (parseHashQuery().from === 'oauth') {
      const roleType = role === 'study_room' ? 'study_room_owner' : 'tutor';
      window.location.href = resolvePostLoginUrl(roleType);
      return;
    }
    navigate('/signup/complete');
  });
}
