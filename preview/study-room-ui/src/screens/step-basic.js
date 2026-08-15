import { registerState, PERSONAL_GENDER_OPTIONS, getRegions, getComplexes } from '../state.js';
import { syncBasicFromForm } from '../form-collect.js';
import { saveAndNavigate, withSaving } from '../save-flow.js';
import {
  renderRegisterShell,
  renderNavButtons,
  renderGuideNotice,
  mypageRegistrationsUrl,
  bindGlobalEvents,
  navigate,
  isRegisterEditMode,
  getHashQuery,
} from '../layout.js';
import { renderMainSubjectSelect } from '../../../shared/main-subjects.js';

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

function blank(v) {
  const s = String(v ?? '').trim();
  return s || '—';
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
  const slots = Array.isArray(s.saved_regions) ? s.saved_regions : [];
  const lines = slots
    .map((slot, i) => {
      const basis = slot.region_basis_type || s.region_basis_type || 'dong';
      const text =
        basis === 'complex'
          ? complexLabel(slot.complex_id)
          : regionLabel(slot.region_id);
      if (!String(text || '').trim()) return null;
      const mark = slot.is_primary ? '대표' : `${i + 1}`;
      return `${mark} · ${text}`;
    })
    .filter(Boolean);
  return lines;
}

function primaryLocationText(s) {
  const basis = s.region_basis_type === 'complex' ? 'complex' : 'dong';
  if (basis === 'complex') return complexLabel(s.complex_id) || regionLabel(s.region_id);
  return regionLabel(s.region_id);
}

function isBasicEditRequested() {
  if (!isRegisterEditMode()) return false;
  const edit = getHashQuery().get('edit');
  return edit === '1' || edit === 'basic';
}

/** 기본등록 현황 — 기본정보+위치를 한 페이지에 펼침 */
function renderBasicOverview() {
  const s = registerState;
  const exposures = exposureLines(s);
  const locationText = primaryLocationText(s);
  const filled = Boolean(String(s.study_room_name || '').trim() && locationText);

  const rows = [
    { label: '공부방명', value: s.study_room_name, edit: '/register/basic?edit=basic' },
    { label: '주력과목', value: s.main_subject_note, edit: '/register/basic?edit=basic' },
    { label: '원장 성별', value: genderLabel(s.gender), edit: '/register/basic?edit=basic' },
    { label: '위치', value: locationText, edit: '/register/location?edit=location' },
    {
      label: '노출 지역',
      value: exposures.length ? exposures.join('\n') : '',
      edit: '/register/location?edit=location',
      multiline: true,
    },
    { label: '주소 요약', value: s.address_text, edit: '/register/location?edit=location' },
  ];

  const content = `
    <div class="register-overview">
      <p class="register-overview__lead">
        기본등록에 저장된 내용입니다. 수정이 필요할 때만 해당 항목을 고치고, 바로 상세등록으로 이어가세요.
      </p>
      <dl class="register-overview__dl">
        ${rows
          .map((row) => {
            const empty = !String(row.value ?? '').trim();
            const valueHtml = row.multiline
              ? esc(blank(row.value)).replace(/\n/g, '<br />')
              : esc(blank(row.value));
            return `
          <div class="register-overview__row${empty ? ' is-empty' : ''}">
            <dt>${esc(row.label)}</dt>
            <dd>
              <span>${valueHtml}</span>
              <a href="#${row.edit}" data-nav="${row.edit}">${empty ? '채우기' : '수정'}</a>
            </dd>
          </div>`;
          })
          .join('')}
      </dl>
      <div class="register-nav register-nav--overview">
        <a class="btn btn--secondary" href="#/register/basic?edit=basic" data-nav="/register/basic?edit=basic">기본정보 수정</a>
        <a class="btn btn--secondary" href="#/register/location?edit=location" data-nav="/register/location?edit=location">위치·노출 수정</a>
        <button type="button" class="btn btn--primary" data-action="to-detail">
          ${filled ? '상세등록 이어하기' : '상세등록으로 (빈칸은 나중에)'}
        </button>
      </div>
      <a class="register-mypage-link" href="${mypageRegistrationsUrl()}">마이페이지 · 내 등록에서 관리</a>
    </div>
  `;

  return renderRegisterShell(content, {
    stepKey: 'basic',
    title: '공부방 기본등록 현황',
    subtitle: '이름·과목·위치를 한눈에 보고, 상세등록으로 바로 이동합니다.',
  });
}

function renderBasicForm() {
  const s = registerState;
  const content = `
    <form data-form="basic">
      ${renderGuideNotice('기본정보만 수정합니다. 저장 후 현황으로 돌아갑니다.')}
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
      ${renderNavButtons('/register/basic', '저장하고 현황으로')}
    </form>
  `;
  return renderRegisterShell(content, {
    stepKey: 'basic',
    title: '기본정보 수정',
    subtitle: '공부방명·주력과목·원장 성별을 수정합니다.',
  });
}

export function renderBasic() {
  if (isBasicEditRequested()) return renderBasicForm();
  return renderBasicOverview();
}

export function bindBasicEvents(root) {
  bindGlobalEvents(root);

  root.querySelector('[data-action="to-detail"]')?.addEventListener('click', () => {
    registerState.basicComplete = true;
    navigate('/register/lesson');
  });

  const nextBtn = root.querySelector('[data-action="next"]');
  const prevBtn = root.querySelector('[data-action="prev"]');
  prevBtn?.addEventListener('click', () => navigate('/register/basic'));

  nextBtn?.addEventListener('click', () => {
    withSaving(nextBtn, async () => {
      syncBasicFromForm(root.querySelector('[data-form="basic"]'), registerState);
      if (!String(registerState.main_subject_note || '').trim()) {
        alert('주력과목을 선택해 주세요.');
        return;
      }
      await saveAndNavigate(registerState, 'basic', '/register/basic');
      registerState.basicComplete = Boolean(
        String(registerState.study_room_name || '').trim() &&
          (String(registerState.region_id || '').trim() ||
            (registerState.saved_regions || []).some((r) => String(r?.region_id || '').trim())),
      );
    });
  });
}
