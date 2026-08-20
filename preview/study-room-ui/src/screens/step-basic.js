import { registerState, PERSONAL_GENDER_OPTIONS, apiMasters, getRegions, getComplexes, isRoomBasicComplete } from '../state.js';
import { applyRoomToState } from '../form-collect.js';
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
import {
  renderStudyRoomBasicFields,
  bindStudyRoomBasicFields,
  collectStudyRoomBasicFields,
  validateStudyRoomBasicFields,
  applyStudyRoomBasicToState,
  lessonPlaceNameLabel,
  formatPrimaryAudienceLabel,
} from '../../../shared/study-room-basic-form.js';
import { bindDraggableDialog } from '../../../shared/draggable-dialog.js';

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

function blank(v) {
  return String(v ?? '').trim();
}

function genderLabel(value) {
  return PERSONAL_GENDER_OPTIONS.find((o) => o.value === value)?.label || blank(value);
}

function regionLabel(id, fallback = '') {
  if (!id) return fallback;
  return getRegions().find((r) => String(r.id) === String(id))?.label || fallback || String(id);
}

function complexLabel(slot) {
  const name = blank(slot?.complex_name);
  const addr = blank(slot?.complex_address);
  if (name && addr) return `${name} (${addr})`;
  if (name) return name;
  if (!slot?.complex_id) return addr;
  const c = getComplexes().find((x) => String(x.id) === String(slot.complex_id));
  if (!c) return addr || String(slot.complex_id);
  return c.address ? `${c.label} (${c.address})` : c.label;
}

function exposureLines(s) {
  const slots = Array.isArray(s.saved_regions) ? s.saved_regions.slice(0, 3) : [];
  while (slots.length < 3) slots.push({});
  return slots.map((slot, i) => {
    const basis = slot.region_basis_type || 'dong';
    const text =
      basis === 'complex'
        ? complexLabel(slot)
        : blank(slot.region_label) || regionLabel(slot.region_id);
    const mark = slot.is_primary ? '대표' : `${i + 1}`;
    return `${mark} · ${String(text || '').trim()}`;
  });
}

let basicEditOpen = false;

function isBasicEditRequested() {
  if (!isRegisterEditMode()) return false;
  const edit = getHashQuery().get('edit');
  return edit === '1' || edit === 'basic' || edit === 'location';
}

/**
 * 공란 규칙
 * - 저장 필수: 교습형태, 이름, 주대상, 주력과목, 원장성별, 슬로건, 집주소, 사업장주소, 홍보지역 1곳
 * - 저장 선택: 홍보지역 2·3칸
 * - 홍보지역은 항상 3칸. 빈 칸은 자리를 유지하고 앞으로 당기지 않음.
 */
function overviewRows() {
  const s = registerState;
  const exposures = exposureLines(s);
  return [
    { label: '교습형태', value: s.lesson_place_type === 'academy' ? '교습소' : s.lesson_place_type === 'study_room' ? '공부방' : '' },
    { label: lessonPlaceNameLabel(s.lesson_place_type), value: s.study_room_name },
    { label: '주대상', value: formatPrimaryAudienceLabel(s.primary_school_levels) },
    { label: '주력과목', value: s.main_subject_note },
    { label: '원장성별', value: genderLabel(s.gender) },
    { label: '슬로건', value: s.slogan },
    { label: '집주소', value: [s.home_address, s.home_address_line2].filter((x) => String(x || '').trim()).join(' ') },
    { label: '사업장주소', value: [s.address_text, s.address_line2].filter((x) => String(x || '').trim()).join(' ') },
    {
      label: '홍보지역',
      value: exposures.join('\n'),
      multiline: true,
    },
  ];
}

/** @param {{ editAction?: string }} [opts] */
export function renderBasicOverviewBoard(opts = {}) {
  const editAction = opts.editAction || 'edit-basic';
  return `
    <div class="register-overview">
      <div class="register-overview__toolbar">
        <button type="button" class="register-phase__tag is-active register-overview__edit-badge" data-action="${editAction}">기본정보 수정</button>
        <p class="register-overview__lead">수정이 필요하면 눌러 주세요.</p>
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

export function renderBasicEditModal() {
  return `
    <div class="register-edit-overlay" data-basic-edit-overlay>
      <div class="register-edit-dialog" role="dialog" aria-modal="true" aria-labelledby="basic-edit-title">
        <div class="register-edit-dialog__head">
          <h2 id="basic-edit-title" class="register-edit-dialog__title">기본정보 수정</h2>
          <button type="button" class="register-edit-dialog__close" data-action="cancel-edit" aria-label="닫기">×</button>
        </div>
        <form data-form="basic-all" class="register-edit-dialog__body">
          ${renderStudyRoomBasicFields({
            values: registerState,
            genderOptions: PERSONAL_GENDER_OPTIONS,
          })}
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

/** 기본정보 현황 — 필수 5항목 + 집주소(선택) 현황판 */
function renderBasicOverview() {
  if (sessionStorage.getItem('study114_open_basic_edit') === '1') {
    sessionStorage.removeItem('study114_open_basic_edit');
    basicEditOpen = true;
  }
  if (isBasicEditRequested()) basicEditOpen = true;
  document.body.classList.toggle('register-edit-open', basicEditOpen);
  const content = `
    ${renderBasicOverviewBoard()}
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
  bindDraggableDialog(
    overlay.querySelector('.register-edit-dialog'),
    overlay.querySelector('.register-edit-dialog__head'),
  );
  bindStudyRoomBasicFields(form || overlay, {
    getRegions,
    onRegion(region) {
      if (!apiMasters.regions.some((r) => String(r.id) === String(region.id))) {
        apiMasters.regions.push(region);
      }
    },
  });

  document.removeEventListener('keydown', onEditEscape);
  document.addEventListener('keydown', onEditEscape);

  const saveBtn = overlay.querySelector('[data-action="save-basic-all"]');
  saveBtn?.addEventListener('click', () => {
    withSaving(saveBtn, async () => {
      const formEl = overlay.querySelector('[data-form="basic-all"]');
      const data = collectStudyRoomBasicFields(formEl);
      const err = validateStudyRoomBasicFields(data);
      if (err) {
        alert(err);
        return;
      }
      applyStudyRoomBasicToState(registerState, data);
      await saveAndNavigate(registerState, 'basic_all', null);
      try {
        const room = await loadRoom(registerState.study_room_id);
        if (room) applyRoomToState(registerState, room);
      } catch {
        /* 저장은 됐으므로 현황은 현재 state로 표시 */
      }
      registerState.basicComplete = isRoomBasicComplete(registerState);
      closeBasicEdit();
    }).catch(() => {
      /* withSaving이 이미 alert. 실패 시 팝업을 닫지 않는다. */
    });
  });
}
