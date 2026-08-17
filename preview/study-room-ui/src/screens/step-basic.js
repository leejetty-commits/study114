import { registerState, PERSONAL_GENDER_OPTIONS, getRegions, getComplexes } from '../state.js';
import { syncBasicFromForm, syncLocationFromForm, applyRoomToState } from '../form-collect.js';
import { saveAndNavigate, withSaving } from '../save-flow.js';
import { loadRoom } from '../register-api.js';
import {
  renderRegisterShell,
  bindGlobalEvents,
  navigate,
  isRegisterEditMode,
  getHashQuery,
  basicOverviewPath,
  withRoomId,
} from '../layout.js';
import { renderMainSubjectSelect } from '../../../shared/main-subjects.js';
import {
  renderLocationFields,
  bindLocationFieldEvents,
  validateLocationFields,
} from '../location-fields.js';

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

function blank(v) {
  return String(v ?? '').trim();
}

function genderLabel(value) {
  return PERSONAL_GENDER_OPTIONS.find((o) => o.value === value)?.label || blank(value);
}

function regionLabel(id) {
  if (!id) return '';
  return getRegions().find((r) => String(r.id) === String(id))?.label || String(id);
}

function complexLabel(id) {
  if (!id) return '';
  const c = getComplexes().find((x) => String(x.id) === String(id));
  if (!c) return String(id);
  return c.address ? `${c.label} (${c.address})` : c.label;
}

function exposureLines(s) {
  const slots = Array.isArray(s.saved_regions) ? s.saved_regions.slice(0, 3) : [];
  while (slots.length < 3) slots.push({});
  return slots.map((slot, i) => {
    const basis = slot.region_basis_type || s.region_basis_type || 'dong';
    const text =
      basis === 'complex' ? complexLabel(slot.complex_id) : regionLabel(slot.region_id);
    const mark = slot.is_primary ? '대표' : `${i + 1}`;
    return `${mark} · ${String(text || '').trim()}`;
  });
}

function primaryLocationText(s) {
  const basis = s.region_basis_type === 'complex' ? 'complex' : 'dong';
  if (basis === 'complex') return complexLabel(s.complex_id) || regionLabel(s.region_id);
  return regionLabel(s.region_id);
}

let basicEditOpen = false;

function isBasicEditRequested() {
  if (!isRegisterEditMode()) return false;
  const edit = getHashQuery().get('edit');
  return edit === '1' || edit === 'basic' || edit === 'location';
}

/**
 * 공란 규칙
 * - 저장 필수: 공부방명, 주력과목, 원장 성별, 현재위치, 홍보지역 1곳 이상
 * - 저장 선택: 주소 요약, 홍보지역 2·3칸
 * - 홍보지역은 항상 3칸. 빈 칸은 자리를 유지하고 앞으로 당기지 않음.
 * - 표시: 값이 없으면 빈 칸(is-empty). 더미 문구·대시 문자를 넣지 않음.
 */
function overviewRows() {
  const s = registerState;
  const exposures = exposureLines(s);
  const locationText = primaryLocationText(s);
  return [
    { label: '공부방명', value: s.study_room_name },
    { label: '주력과목', value: s.main_subject_note },
    { label: '원장 성별', value: genderLabel(s.gender) },
    { label: '현재위치', value: locationText },
    {
      label: '홍보지역',
      value: exposures.join('\n'),
      multiline: true,
    },
    { label: '주소 요약', value: s.address_text },
  ];
}

function renderOverviewBoard() {
  return `
    <div class="register-overview">
      <div class="register-overview__toolbar">
        <p class="register-overview__lead">수정이 필요하면 눌러 주세요.</p>
        <button type="button" class="btn btn--secondary" data-action="edit-basic">기본정보 수정</button>
      </div>
      <dl class="register-overview__dl">
        ${overviewRows()
          .map((row) => {
            const empty = !String(row.value ?? '').trim();
            const valueHtml = row.multiline
              ? esc(blank(row.value)).replace(/\n/g, '<br />')
              : esc(blank(row.value));
            return `
          <div class="register-overview__row${empty ? ' is-empty' : ''}">
            <dt>${esc(row.label)}</dt>
            <dd><span>${valueHtml}</span></dd>
          </div>`;
          })
          .join('')}
      </dl>
    </div>
  `;
}

function renderBasicFields() {
  const s = registerState;
  return `
        <div class="register-basic-fields">
          <div class="form-group">
            <label class="form-label form-label--required" for="study_room_name">공부방명</label>
            <input class="form-input" id="study_room_name" name="study_room_name" value="${esc(s.study_room_name)}" required />
          </div>
          <div class="form-group">
            <label class="form-label form-label--required" for="main_subject_note">주력과목 1개</label>
            <select class="form-input" id="main_subject_note" name="main_subject_note" required>
              ${renderMainSubjectSelect(s.main_subject_note)}
            </select>
          </div>
          <div class="form-group form-group--full">
            <span class="form-label form-label--required">원장 성별</span>
            <p class="register-hint">계정 프로필 성별과 같습니다. 여기서 바꾸면 과외쌤·마이페이지 표시도 함께 바뀝니다.</p>
            <div class="form-radio-group" role="radiogroup">
              ${PERSONAL_GENDER_OPTIONS.map(
                (t) => `
              <label class="form-radio">
                <input type="radio" name="gender" value="${t.value}" ${s.gender === t.value ? 'checked' : ''} required />
                <span class="form-radio__label">${t.label}</span>
              </label>`,
              ).join('')}
            </div>
          </div>
        </div>
  `;
}

function renderBasicEditModal() {
  return `
    <div class="register-edit-overlay" data-basic-edit-overlay>
      <div class="register-edit-dialog" role="dialog" aria-modal="true" aria-labelledby="basic-edit-title">
        <div class="register-edit-dialog__head">
          <h2 id="basic-edit-title" class="register-edit-dialog__title">기본정보 수정</h2>
          <button type="button" class="register-edit-dialog__close" data-action="cancel-edit" aria-label="닫기">×</button>
        </div>
        <form data-form="basic-all" class="register-edit-dialog__body">
          ${renderBasicFields()}
          ${renderLocationFields(registerState)}
        </form>
        <div class="register-edit-dialog__foot">
          <button type="button" class="btn btn--secondary" data-action="cancel-edit">취소</button>
          <button type="button" class="btn btn--primary" data-action="save-basic-all">저장</button>
        </div>
      </div>
    </div>
  `;
}

function onEditEscape(e) {
  if (e.key === 'Escape') closeBasicEdit();
}

function closeBasicEdit() {
  document.removeEventListener('keydown', onEditEscape);
  basicEditOpen = false;
  if (isBasicEditRequested()) {
    navigate(basicOverviewPath());
    return;
  }
  window.dispatchEvent(new Event('hashchange'));
}

function openBasicEdit() {
  basicEditOpen = true;
  window.dispatchEvent(new Event('hashchange'));
}

/** 기본정보 현황 — 필수 6항목 현황판 */
function renderBasicOverview() {
  if (sessionStorage.getItem('study114_open_basic_edit') === '1') {
    sessionStorage.removeItem('study114_open_basic_edit');
    basicEditOpen = true;
  }
  if (isBasicEditRequested()) basicEditOpen = true;
  document.body.classList.toggle('register-edit-open', basicEditOpen);
  const content = `
    ${renderOverviewBoard()}
    ${basicEditOpen ? renderBasicEditModal() : ''}
  `;

  return renderRegisterShell(content, {
    stepKey: 'basic',
    title: '공부방 기본정보 현황',
    headingActions: `<span class="register-heading-row__lead">이어서</span><button type="button" class="btn btn--primary" data-action="to-detail">상세정보 등록하기</button>`,
  });
}

export function renderBasic() {
  return renderBasicOverview();
}

export function bindBasicEvents(root) {
  bindGlobalEvents(root);

  root.querySelector('[data-action="to-detail"]')?.addEventListener('click', () => {
    registerState.basicComplete = true;
    navigate(withRoomId('/register/lesson'));
  });

  root.querySelector('[data-action="edit-basic"]')?.addEventListener('click', () => {
    openBasicEdit();
  });

  const overlay = root.querySelector('[data-basic-edit-overlay]');
  if (!overlay) return;

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeBasicEdit();
  });

  overlay.querySelectorAll('[data-action="cancel-edit"]').forEach((btn) => {
    btn.addEventListener('click', () => closeBasicEdit());
  });

  const form = overlay.querySelector('[data-form="basic-all"]');
  bindLocationFieldEvents(form || overlay);

  document.removeEventListener('keydown', onEditEscape);
  document.addEventListener('keydown', onEditEscape);

  const saveBtn = overlay.querySelector('[data-action="save-basic-all"]');
  saveBtn?.addEventListener('click', () => {
    withSaving(saveBtn, async () => {
      const formEl = overlay.querySelector('[data-form="basic-all"]');
      syncBasicFromForm(formEl, registerState);
      syncLocationFromForm(formEl, registerState);
      if (!String(registerState.study_room_name || '').trim()) {
        alert('공부방명을 입력해 주세요.');
        return;
      }
      if (!String(registerState.main_subject_note || '').trim()) {
        alert('주력과목을 선택해 주세요.');
        return;
      }
      if (!['male', 'female'].includes(String(registerState.gender || ''))) {
        alert('원장 성별을 선택해 주세요.');
        return;
      }
      const locErr = validateLocationFields(formEl, registerState);
      if (locErr) {
        alert(locErr);
        return;
      }
      if (!String(registerState.lesson_place_type || '').trim()) {
        registerState.lesson_place_type = 'study_room';
      }
      await saveAndNavigate(registerState, 'basic_all', null);
      try {
        const room = await loadRoom(registerState.study_room_id);
        if (room) applyRoomToState(registerState, room);
      } catch {
        /* 저장은 됐으므로 현황은 현재 state로 표시 */
      }
      registerState.basicComplete = Boolean(
        String(registerState.study_room_name || '').trim() &&
          (String(registerState.region_id || '').trim() ||
            (registerState.saved_regions || []).some((r) => String(r?.region_id || r?.complex_id || '').trim())),
      );
      closeBasicEdit();
    }).catch(() => {
      /* withSaving이 이미 alert. 실패 시 팝업을 닫지 않는다. */
    });
  });
}
