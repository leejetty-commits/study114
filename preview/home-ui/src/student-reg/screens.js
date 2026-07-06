import { authStudentAddUrl } from '../../../shared/student-auth-bridge.js';
import { renderEmptyStateCard } from '../empty-state-copy.js';
import { statusLabel } from '../mypage/preview-data.js';
import {
  LIFECYCLE_FOOTNOTE_REG,
  LIFECYCLE_PUBLISH_CONFIRM_NOTE,
  publishReadinessLabel,
} from '../lifecycle-copy.js';
import { renderBrowseList } from '../exposure-render.js';
import {
  P19_LIST_TABS,
  PHASE_STEPS,
  P19_LIST_HEAD,
  P19_HUB_QUICK_ACTIONS,
  P19_DANGER_ZONE,
  VISIBILITY_OPTIONS,
  P19_PUBLISH,
  P19_SETTINGS_CALLOUT,
} from './student-reg-copy.js';
import {
  parseStudentRegPath,
  studentHubPath,
  studentSectionPath,
  studentListTabPath,
  STUDENT_REG_MENUS,
} from './router.js';
import {
  FORM_OPTIONS,
  formatStudentSummaryLine,
  labelBudget,
  labelLessonTarget,
  labelPlaces,
  labelTeachingStyles,
  studentToExposureRow,
} from './format.js';
import { showEmailVerifyOverlay } from '../email-verify-overlay.js';
import {
  getStudentsByTab,
  getStudent,
  getPublishReadiness,
  publishStudent,
  hideStudent,
  deleteStudent,
  updateStudent,
  getStudentSummaryCounts,
} from './store.js';

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

function renderCheckboxGroup(name, options, selected = [], { required = false } = {}) {
  const sel = new Set(Array.isArray(selected) ? selected : [selected].filter(Boolean));
  return `<div class="p19-chip-group">
    ${options
      .map(
        (o) => `
      <label class="p19-chip${sel.has(o.value) ? ' is-checked' : ''}">
        <input type="checkbox" name="${name}" value="${esc(o.value)}" ${sel.has(o.value) ? 'checked' : ''} ${required && sel.size === 0 ? '' : ''} />
        <span class="p19-chip__label">${esc(o.label)}</span>
      </label>`,
      )
      .join('')}
  </div>`;
}

function renderSelect(name, options, value, { required = false, empty = false } = {}) {
  return `<select name="${name}" class="p19-input p19-select" ${required ? 'required' : ''}>
    ${empty ? '<option value="">선택</option>' : ''}
    ${options
      .map((o) => `<option value="${esc(o.value)}" ${value === o.value ? 'selected' : ''}>${esc(o.label)}</option>`)
      .join('')}
  </select>`;
}

function renderTextInput(name, value, { required = false, placeholder = '', type = 'text', min, max, step } = {}) {
  const attrs = [
    type !== 'text' ? `type="${type}"` : 'type="text"',
    `name="${name}"`,
    'class="p19-input"',
    required ? 'required' : '',
    placeholder ? `placeholder="${esc(placeholder)}"` : '',
    min != null ? `min="${min}"` : '',
    max != null ? `max="${max}"` : '',
    step != null ? `step="${step}"` : '',
    value != null && value !== '' ? `value="${esc(value)}"` : '',
  ]
    .filter(Boolean)
    .join(' ');
  return `<input ${attrs} />`;
}

function renderTextarea(name, value, { rows = 3, placeholder = '' } = {}) {
  return `<textarea name="${name}" class="p19-input p19-textarea" rows="${rows}" placeholder="${esc(placeholder)}">${esc(value || '')}</textarea>`;
}

/** @param {string} title @param {string} [lead] @param {string} body */
function renderFormSection(title, lead, body) {
  return `
    <section class="p19-form-section">
      <header class="p19-form-section__head">
        <h3 class="p19-form-section__title">${esc(title)}</h3>
        ${lead ? `<p class="p19-form-section__lead">${lead}</p>` : ''}
      </header>
      <div class="p19-form-section__body">${body}</div>
    </section>`;
}

/** @param {string} name @param {'private'|'paid_only'|string} value */
function renderVisibilityRadios(name, value) {
  return `<div class="p19-visibility-options" role="radiogroup" aria-label="${esc(name)}">
    ${VISIBILITY_OPTIONS.map(
        (o) => `
      <label class="p19-visibility-option${value === o.value ? ' is-selected' : ''}">
        <input type="radio" name="${name}" value="${esc(o.value)}" ${value === o.value ? 'checked' : ''} />
        <span class="p19-visibility-option__radio" aria-hidden="true"></span>
        <span class="p19-visibility-option__text">
          <span class="p19-visibility-option__label">${esc(o.label)}</span>
          <span class="p19-visibility-option__desc">${esc(o.desc)}</span>
        </span>
      </label>`,
      )
      .join('')}
  </div>`;
}

/** @param {import('./store.js').StudentRecord} student @param {string} activeKey */
function getStepDone(student, activeKey) {
  if (activeKey === 'basic') {
    return !!(student.public_display_name && student.subject_label && student.region_label);
  }
  if (activeKey === 'detail') return !!student.preferred_tutor_gender;
  if (activeKey === 'settings') {
    return !!(student.request_summary || student.special_request_note);
  }
  if (activeKey === 'publish') return student.exposure_status === 'published';
  return false;
}

/** @param {import('./store.js').StudentRecord} student @param {string} activeSection */
function renderPhaseStepper(student, activeSection) {
  if (activeSection === 'hub') return '';
  const stepIndex = PHASE_STEPS.findIndex((s) => s.key === activeSection);
  const progressPct = stepIndex >= 0 ? Math.round(((stepIndex + 1) / PHASE_STEPS.length) * 100) : 0;

  const items = PHASE_STEPS.map((step, i) => {
    const href = studentSectionPath(student.id, /** @type {any} */ (step.key));
    const isActive = activeSection === step.key;
    const isDone = getStepDone(student, step.key);
    const state = isActive ? 'is-active' : isDone ? 'is-done' : '';
    const arrow = i < PHASE_STEPS.length - 1 ? '<span class="p19-stepper__arrow" aria-hidden="true">›</span>' : '';
    return `
      <a href="#${href}" class="p19-stepper__step ${state}" data-p19-nav="${href}">
        <span class="p19-stepper__index">${isDone && !isActive ? '✓' : i + 1}</span>
        <span class="p19-stepper__label">${esc(step.label)}</span>
      </a>${arrow}`;
  }).join('');

  const currentLabel = PHASE_STEPS.find((s) => s.key === activeSection)?.label || '';

  return `
    <div class="p19-stepper-wrap">
      <div class="p19-progress-mobile" role="progressbar" aria-valuenow="${progressPct}" aria-valuemin="0" aria-valuemax="100" aria-label="등록 진행">
        <div class="p19-progress-mobile__track">
          <div class="p19-progress-mobile__fill" style="width: ${progressPct}%"></div>
        </div>
        <span class="p19-progress-mobile__label">${esc(currentLabel)} · ${stepIndex + 1}/${PHASE_STEPS.length}</span>
      </div>
      <nav class="p19-stepper" aria-label="등록 단계">${items}</nav>
    </div>`;
}

/** @param {import('./store.js').StudentRecord} student @param {string} activeSection @param {string} bodyHtml */
function renderStudentShell(student, activeSection, bodyHtml) {
  const readiness = getPublishReadiness(student);
  const navItems = STUDENT_REG_MENUS.map((m) => {
    const href = studentSectionPath(student.id, /** @type {any} */ (m.key));
    const active = activeSection === m.key ? ' is-active' : '';
    return `<a href="#${href}" class="p19-sidebar-nav__link${active}" data-p19-nav="${href}">${esc(m.label)}</a>`;
  }).join('');

  const hubActive = activeSection === 'hub' ? ' is-active' : '';
  const summaryLine = formatStudentSummaryLine(student);
  const readinessText = publishReadinessLabel(readiness.canPublish, readiness.missing.length);

  return `
    <div class="p19-frame">
      <aside class="p19-sidebar" aria-label="자녀 관리">
        <div class="p19-sidebar__top">
          <a href="#/mypage/registrations/students" class="p19-back" data-p19-nav="/mypage/registrations/students">← 목록</a>
          <span class="p19-sidebar__readiness mypage-badge${readiness.canPublish ? ' p19-readiness--ok' : ' p19-readiness--pending'}">${esc(readinessText)}</span>
        </div>
        <div class="p19-student-card">
          <div class="p19-student-card__avatar" aria-hidden="true">${esc((student.public_display_name || '?').charAt(0))}</div>
          <div class="p19-student-card__body">
            <strong class="p19-student-card__name">${esc(student.public_display_name)}</strong>
            <span class="mypage-badge mypage-badge--${student.exposure_status}">${statusLabel(student.exposure_status)}</span>
            <p class="p19-student-card__meta">${esc(summaryLine)}</p>
          </div>
        </div>
        <nav class="p19-sidebar-nav" aria-label="자녀 등록 메뉴">
          <a href="#${studentHubPath(student.id)}" class="p19-sidebar-nav__link p19-sidebar-nav__link--overview${hubActive}" data-p19-nav="${studentHubPath(student.id)}">관리 홈</a>
          ${navItems}
        </nav>
        <div class="p19-sidebar-status" aria-hidden="true">
          <span class="p19-sidebar-status__label">공개 준비</span>
          <span class="p19-sidebar-status__value${readiness.canPublish ? ' is-ready' : ''}">${esc(readinessText)}</span>
        </div>
      </aside>
      <div class="p19-frame__body">
        ${renderPhaseStepper(student, activeSection)}
        ${bodyHtml}
      </div>
    </div>`;
}

/** @param {string} [hint] */
function renderFormFooter(hint, buttonsHtml) {
  return `
    <footer class="p19-form-footer">
      ${hint ? `<p class="p19-form-footer__hint">${hint}</p>` : ''}
      <div class="p19-form-actions">${buttonsHtml}</div>
    </footer>`;
}

/** @param {HTMLFormElement} form */
function parseStudentForm(form) {
  const fd = new FormData(form);
  const patch = {};
  const multi = new Set(['lesson_places', 'teaching_style_badges']);
  for (const [key, val] of fd.entries()) {
    if (multi.has(key)) {
      if (!patch[key]) patch[key] = [];
      patch[key].push(val);
    } else {
      patch[key] = val;
    }
  }
  if (patch.birth_year) patch.birth_year = Number(patch.birth_year);
  if (patch.lessons_per_week) patch.lessons_per_week = Number(patch.lessons_per_week);
  if (patch.minutes_per_lesson) patch.minutes_per_lesson = Number(patch.minutes_per_lesson);
  if (patch.preferred_fee_amount) patch.preferred_fee_amount = Number(patch.preferred_fee_amount);
  if (patch.preferred_studyroom_fee_amount) {
    patch.preferred_studyroom_fee_amount = Number(patch.preferred_studyroom_fee_amount);
  }
  if (patch.lesson_format === 'one_on_one') {
    patch.preferred_student_count_group = 'solo';
    patch.student_gender_group = '';
  }
  return patch;
}

/** @param {string} path */
export function renderStudentRegScreen(path) {
  const route = parseStudentRegPath(path);
  if (!route) return '';

  if (route.screenId === 'P19-01') return renderList(route.listTab || 'all');
  if (!route.studentId) return renderNotFound();

  const student = getStudent(route.studentId);
  if (!student || student.exposure_status === 'deleted') return renderNotFound();

  switch (route.screenId) {
    case 'P19-02':
      return renderHub(student);
    case 'P19-03a':
      return renderBasicForm(student);
    case 'P19-03b':
      return renderDetailForm(student);
    case 'P19-04':
      return renderPublish(student);
    case 'P19-05':
      return renderSettings(student);
    default:
      return renderHub(student);
  }
}

function renderNotFound() {
  return `<section class="mypage-panel p19-panel mypage-empty">
    <p>자녀 정보를 찾을 수 없습니다.</p>
    <a href="#/mypage/registrations/students" class="btn btn--secondary" data-p19-nav="/mypage/registrations/students">목록으로</a>
  </section>`;
}

/** @param {'all'|'draft'|'published'|'hidden'} tab */
function renderList(tab) {
  const students = getStudentsByTab(tab);
  const counts = getStudentSummaryCounts();
  const tabs = P19_LIST_TABS.map((t) => ({
    ...t,
    count:
      t.key === 'all'
        ? counts.published + counts.draft + counts.hidden
        : t.key === 'draft'
          ? counts.draft
          : t.key === 'published'
            ? counts.published
            : counts.hidden,
  }));
  const tabHtml = tabs
    .map(
      (t) =>
        `<a href="#${studentListTabPath(/** @type {any} */ (t.key))}" class="p19-tab${t.key === tab ? ' is-active' : ''}" data-p19-nav="${studentListTabPath(/** @type {any} */ (t.key))}">${esc(t.label)} <span class="p19-tab__count">${t.count}</span></a>`,
    )
    .join('');

  const cards =
    students.length === 0
      ? renderEmptyStateCard(tab === 'all' ? 'students' : 'studentsTab', {
          ctaHref: tab === 'all' ? authStudentAddUrl() : undefined,
        })
      : `<div class="p19-card-grid">
        ${students
          .map(
            (s) => `
          <a href="#${studentHubPath(s.id)}" class="p19-child-card" data-p19-nav="${studentHubPath(s.id)}">
            <div class="p19-child-card__head">
              <strong>${esc(s.public_display_name)}</strong>
              <span class="mypage-badge mypage-badge--${s.exposure_status}">${statusLabel(s.exposure_status)}</span>
            </div>
            <p class="p19-child-card__meta">${esc(formatStudentSummaryLine(s))}</p>
            <span class="p19-child-card__cta">${esc(P19_LIST_HEAD.manageCta)}</span>
          </a>`,
          )
          .join('')}
      </div>`;

  return `
    <section class="mypage-panel p19-panel p19-panel--list">
      <header class="p19-list-head">
        <div>
          <h2 class="p19-list-head__title">${esc(P19_LIST_HEAD.title)}</h2>
          <p class="p19-list-head__lead">${esc(P19_LIST_HEAD.lead)}</p>
        </div>
        <a href="${authStudentAddUrl()}" class="btn btn--primary btn--sm" target="_blank" rel="noopener">${esc(P19_LIST_HEAD.registerCta)}</a>
      </header>
      <div class="p19-tabs" role="tablist">${tabHtml}</div>
      ${cards}
      <p class="p19-list-footnote">${esc(P19_LIST_HEAD.footnoteFirst)}</p>
      <p class="p19-list-footnote">${LIFECYCLE_FOOTNOTE_REG}</p>
    </section>`;
}

/** @param {import('./store.js').StudentRecord} student */
function renderHub(student) {
  const readiness = getPublishReadiness(student);
  let nextCta = '희망 조건을 확인해 주세요.';
  let nextTone = 'info';
  if (student.exposure_status === 'draft' && readiness.canPublish) {
    nextCta = '모든 필수 항목이 채워졌습니다. 미리보기 후 공개할 수 있습니다.';
    nextTone = 'success';
  } else if (student.exposure_status === 'draft') {
    nextCta = `아직 ${readiness.missing.length}개 항목이 필요합니다.`;
    nextTone = 'warn';
  } else if (student.exposure_status === 'published') {
    nextCta = '현재 학생찾기에 노출 중입니다.';
    nextTone = 'success';
  } else if (student.exposure_status === 'hidden') {
    nextCta = '노출이 철회된 상태입니다. 언제든 다시 공개할 수 있습니다.';
    nextTone = 'muted';
  }

  const body = `
    <div class="p19-hub-body">
      <div class="p19-alert p19-alert--${nextTone}">
        <p class="p19-alert__text">${esc(nextCta)}</p>
        ${
          student.exposure_status === 'draft' && !readiness.canPublish
            ? `<ul class="p19-alert__list">${readiness.missing
                .slice(0, 4)
                .map((m) => `<li>${esc(m)}</li>`)
                .join('')}</ul>`
            : ''
        }
      </div>
      <div class="p19-summary-grid">
        <dl class="p19-summary-card">
          <dt>지역</dt><dd>${esc(student.region_label || '—')}</dd>
        </dl>
        <dl class="p19-summary-card">
          <dt>예산</dt><dd>${esc(labelBudget(student))}</dd>
        </dl>
        <dl class="p19-summary-card">
          <dt>수업</dt><dd>${esc(labelLessonTarget(student))}</dd>
        </dl>
        <dl class="p19-summary-card">
          <dt>장소</dt><dd>${esc(labelPlaces(student.lesson_places))}</dd>
        </dl>
      </div>
      <div class="p19-quick-actions">
        ${P19_HUB_QUICK_ACTIONS.map((a) => {
          const href = studentSectionPath(student.id, /** @type {any} */ (a.path));
          const cls = a.primary ? ' p19-quick-action--primary' : '';
          return `<a href="#${href}" class="p19-quick-action${cls}" data-p19-nav="${href}">
          <span class="p19-quick-action__label">${esc(a.label)}</span>
          <span class="p19-quick-action__desc">${esc(a.desc)}</span>
        </a>`;
        }).join('')}
      </div>
      <div class="p19-danger-zone" data-p19-student-id="${student.id}">
        <h3 class="p19-danger-zone__title">${esc(P19_DANGER_ZONE.title)}</h3>
        <p class="p19-danger-zone__lead">${esc(P19_DANGER_ZONE.lead)}</p>
        <div class="p19-danger-zone__actions">
          <button type="button" class="btn btn--secondary btn--sm" data-p19-hide ${student.exposure_status === 'hidden' ? 'disabled' : ''}>${esc(P19_DANGER_ZONE.hideLabel)}</button>
          <button type="button" class="btn btn--ghost btn--sm p19-btn-danger" data-p19-delete>${esc(P19_DANGER_ZONE.deleteLabel)}</button>
        </div>
      </div>
    </div>`;

  return `<section class="mypage-panel p19-panel p19-panel--hub">${renderStudentShell(student, 'hub', body)}</section>`;
}

/** @param {import('./store.js').StudentRecord} student */
function renderBasicForm(student) {
  const isGroup = student.lesson_format === 'group';
  const formBody = `
    <form class="p19-form" data-p19-form="basic" data-p19-student-id="${student.id}">
      ${renderFormSection(
        '표시 · 유형',
        '학생찾기에 보이는 이름과 희망 유형을 설정합니다.',
        `
        <div class="p19-field-grid p19-field-grid--2">
          <label class="p19-field p19-field--full">
            <span class="p19-field__label">공개 표시명 <em class="p19-required">필수</em></span>
            <span class="p19-field__hint">실명 대신 노출되는 이름입니다</span>
            ${renderTextInput('public_display_name', student.public_display_name, { required: true, placeholder: '예: 중2 수학 여학생' })}
          </label>
          <label class="p19-field">
            <span class="p19-field__label">희망 유형</span>
            ${renderSelect('preferred_lesson_type', FORM_OPTIONS.lessonType, student.preferred_lesson_type, { required: true })}
          </label>
        </div>`,
      )}
      ${renderFormSection(
        '지역 · 학년',
        '수업을 받을 지역과 학년 정보입니다.',
        `
        <div class="p19-field-grid p19-field-grid--2">
          <label class="p19-field p19-field--full">
            <span class="p19-field__label">희망 지역</span>
            ${renderTextInput('region_label', student.region_label || '', { required: true, placeholder: '예: 서울 강남구 대치동' })}
          </label>
          <label class="p19-field p19-field--full">
            <span class="p19-field__label">지역 보조 메모</span>
            ${renderTextInput('preferred_region_note', student.preferred_region_note || '', { placeholder: '예: 대치역 도보 10분' })}
          </label>
          <label class="p19-field">
            <span class="p19-field__label">희망 과목</span>
            ${renderTextInput('subject_label', student.subject_label || '', { required: true, placeholder: '예: 수학 · 영어' })}
          </label>
          <label class="p19-field">
            <span class="p19-field__label">학교급</span>
            ${renderSelect('school_level', FORM_OPTIONS.schoolLevel, student.school_level || 'middle')}
          </label>
          <label class="p19-field">
            <span class="p19-field__label">학년</span>
            ${renderTextInput('grade_level', student.grade_level, { required: true, placeholder: '예: 중2' })}
          </label>
        </div>`,
      )}
      ${renderFormSection(
        '학생 정보',
        '관리 화면에서만 사용되며 검색에는 표시명만 노출됩니다.',
        `
        <div class="p19-field-grid p19-field-grid--2">
          <label class="p19-field">
            <span class="p19-field__label">학생 성별</span>
            ${renderSelect('gender', [{ value: 'female', label: '여' }, { value: 'male', label: '남' }], student.gender, { required: true, empty: true })}
          </label>
          <label class="p19-field">
            <span class="p19-field__label">출생연도</span>
            ${renderTextInput('birth_year', student.birth_year || '', { type: 'number', required: true, placeholder: '2012' })}
          </label>
        </div>`,
      )}
      ${renderFormSection(
        '수업 조건',
        '장소·형태·횟수 등 희망 수업 조건을 입력합니다.',
        `
        <div class="p19-field p19-field--full">
          <span class="p19-field__label">희망 수업장소</span>
          ${renderCheckboxGroup('lesson_places', FORM_OPTIONS.lessonPlaces, student.lesson_places, { required: true })}
        </div>
        <div class="p19-field-grid p19-field-grid--2">
          <label class="p19-field">
            <span class="p19-field__label">수업형태</span>
            ${renderSelect('lesson_format', FORM_OPTIONS.lessonFormat, student.lesson_format || 'one_on_one', { required: true })}
          </label>
          <label class="p19-field">
            <span class="p19-field__label">희망 수업인원</span>
            ${renderSelect('preferred_student_count_group', FORM_OPTIONS.studentCount, student.preferred_student_count_group || 'solo', { required: true })}
          </label>
        </div>
        <div class="p19-field p19-field--full ${isGroup ? '' : 'is-muted'}" data-p19-group-only>
          <span class="p19-field__label">그룹 구성</span>
          <span class="p19-field__hint">그룹과외 선택 시에만 입력합니다</span>
          ${renderSelect('student_gender_group', FORM_OPTIONS.genderGroup, student.student_gender_group || '', { empty: true })}
        </div>
        <div class="p19-field-grid p19-field-grid--2">
          <label class="p19-field">
            <span class="p19-field__label">주 횟수</span>
            ${renderTextInput('lessons_per_week', student.lessons_per_week ?? 2, { type: 'number', min: 1, max: 7, required: true })}
          </label>
          <label class="p19-field">
            <span class="p19-field__label">1회 시간 (분)</span>
            ${renderTextInput('minutes_per_lesson', student.minutes_per_lesson ?? 90, { type: 'number', step: 10, required: true })}
          </label>
        </div>`,
      )}
      ${renderFormSection(
        '스타일 · 예산',
        '선호하는 강의 스타일과 월 예산을 입력합니다.',
        `
        <div class="p19-field p19-field--full">
          <span class="p19-field__label">희망 강의스타일</span>
          ${renderCheckboxGroup('teaching_style_badges', FORM_OPTIONS.teachingStyle, student.teaching_style_badges, { required: true })}
        </div>
        <div class="p19-field-grid p19-field-grid--2">
          <label class="p19-field">
            <span class="p19-field__label">수업예산 (과외)</span>
            <div class="p19-input-wrap">
              ${renderTextInput('preferred_fee_amount', student.preferred_fee_amount ?? '', { type: 'number', placeholder: '550000' })}
              <span class="p19-input-suffix">원/월</span>
            </div>
          </label>
          <label class="p19-field">
            <span class="p19-field__label">수업예산 (공부방)</span>
            <div class="p19-input-wrap">
              ${renderTextInput('preferred_studyroom_fee_amount', student.preferred_studyroom_fee_amount ?? '', { type: 'number', placeholder: '420000' })}
              <span class="p19-input-suffix">원/월</span>
            </div>
          </label>
        </div>`,
      )}
      ${renderFormFooter('저장해도 학생찾기에는 노출되지 않습니다. 공개는 미리보기 화면에서 진행합니다.', '<button type="submit" class="btn btn--primary">임시 저장</button>')}
    </form>`;

  return `<section class="mypage-panel p19-panel p19-panel--form">${renderStudentShell(student, 'basic', formBody)}</section>`;
}

/** @param {import('./store.js').StudentRecord} student */
function renderDetailForm(student) {
  const formBody = `
    <form class="p19-form" data-p19-form="detail" data-p19-student-id="${student.id}">
      ${renderFormSection(
        '희망 과외쌤 조건',
        '기본등록과 별도로, 공개 전에 입력하는 상세 항목입니다.',
        `
        <label class="p19-field p19-field--card">
          <span class="p19-field__label">희망 과외쌤 성별</span>
          <span class="p19-field__hint">학생찾기 상세에서 공급자에게 표시됩니다</span>
          ${renderSelect(
            'preferred_tutor_gender',
            [
              { value: 'female', label: '여' },
              { value: 'male', label: '남' },
              { value: 'any', label: '무관' },
            ],
            student.preferred_tutor_gender || '',
            { required: true, empty: true },
          )}
        </label>`,
      )}
      <div class="p19-inline-tip">
        요청문·노출 범위는 <a href="#${studentSectionPath(student.id, 'settings')}" data-p19-nav="${studentSectionPath(student.id, 'settings')}">공개설정</a>에서 관리합니다.
      </div>
      ${renderFormFooter(
        '',
        `<button type="submit" class="btn btn--primary">상세 저장</button>
         <a href="#${studentSectionPath(student.id, 'publish')}" class="btn btn--secondary" data-p19-nav="${studentSectionPath(student.id, 'publish')}">미리보기·공개</a>`,
      )}
    </form>`;

  return `<section class="mypage-panel p19-panel p19-panel--form">${renderStudentShell(student, 'detail', formBody)}</section>`;
}

/** @param {import('./store.js').StudentRecord} student */
function renderSettings(student) {
  const formBody = `
    <form class="p19-form" data-p19-form="settings" data-p19-student-id="${student.id}">
      ${renderFormSection(
        '요청문',
        '공급자에게 전달할 요청 사항입니다. 노출 범위를 따로 설정할 수 있습니다.',
        `
        <label class="p19-field p19-field--full">
          <span class="p19-field__label">요청문</span>
          ${renderTextarea('request_summary', student.request_summary || '', { rows: 4, placeholder: '예: 내신 대비 위주, 숙제량은 적당히…' })}
        </label>
        <div class="p19-field p19-field--full">
          <span class="p19-field__label">요청문 노출 범위</span>
          ${renderVisibilityRadios('request_summary_visibility', student.request_summary_visibility || 'private')}
        </div>`,
      )}
      ${renderFormSection(
        '특이요청',
        '알레르기·학습 특성 등 추가로 전달할 내용입니다.',
        `
        <label class="p19-field p19-field--full">
          <span class="p19-field__label">특이요청</span>
          ${renderTextarea('special_request_note', student.special_request_note || '', { rows: 3, placeholder: '선택 입력' })}
        </label>
        <div class="p19-field p19-field--full">
          <span class="p19-field__label">특이요청 노출 범위</span>
          ${renderVisibilityRadios('special_request_visibility', student.special_request_visibility || 'private')}
        </div>`,
      )}
      <div class="p19-info-callout">
        <strong>${esc(P19_SETTINGS_CALLOUT.title)}</strong>
        <p>${esc(P19_SETTINGS_CALLOUT.body)}</p>
      </div>
      ${renderFormFooter('', '<button type="submit" class="btn btn--primary">저장</button>')}
    </form>`;

  return `<section class="mypage-panel p19-panel p19-panel--form">${renderStudentShell(student, 'settings', formBody)}</section>`;
}

/** @param {import('./store.js').StudentRecord} student */
function renderPublish(student) {
  const r = getPublishReadiness(student);
  const row = studentToExposureRow(student);
  const preview = `
    <div class="p19-search-preview">
      <p class="p19-search-preview__label">${esc(P19_PUBLISH.previewLabel)}</p>
      <div class="p19-search-preview__frame">
        ${renderBrowseList('student', [row], { guest: false })}
      </div>
    </div>`;

  const missingLinks = r.missing.map((m) => {
    const isDetail = m.includes('상세');
    const href = studentSectionPath(student.id, isDetail ? 'detail' : 'basic');
    const label = isDetail ? '상세등록' : '기본등록';
    return `<li class="p19-checklist__item p19-checklist__miss">
      <span class="p19-checklist__icon">△</span>
      <span>${esc(m)}</span>
      <a href="#${href}" data-p19-nav="${href}">${label} →</a>
    </li>`;
  });

  const body = `
    <div class="p19-publish-body">
      ${preview}
      <div class="p19-preview-meta">
        <h3 class="p19-preview-meta__title">${esc(P19_PUBLISH.metaTitle)}</h3>
        <dl class="p19-preview-meta__grid">
          <div><dt>장소</dt><dd>${esc(labelPlaces(student.lesson_places))}</dd></div>
          <div><dt>수업인원</dt><dd>${esc(labelLessonTarget(student))}</dd></div>
          <div><dt>스타일</dt><dd>${esc(labelTeachingStyles(student.teaching_style_badges))}</dd></div>
          <div><dt>요청문</dt><dd>${student.request_summary_visibility === 'paid_only' ? '유료 공급자만' : '비공개'}</dd></div>
        </dl>
      </div>
      <div class="p19-checklist-card">
        <h3 class="p19-checklist-card__title">${esc(P19_PUBLISH.checklistTitle)}</h3>
        <ul class="p19-checklist">
          ${
            r.missing.length
              ? missingLinks.join('')
              : '<li class="p19-checklist__item p19-checklist__ok"><span class="p19-checklist__icon">✓</span><span>필수 항목이 모두 채워졌습니다. 공개할 수 있습니다.</span></li>'
          }
        </ul>
      </div>
      <div class="p19-form-actions p19-form-actions--publish" data-p19-student-id="${student.id}">
        <button type="button" class="btn btn--primary btn--lg" data-p19-publish ${r.canPublish ? '' : 'disabled'}>${esc(P19_PUBLISH.publishCta)}</button>
        ${student.exposure_status === 'hidden' ? `<button type="button" class="btn btn--secondary" data-p19-publish>${esc(P19_PUBLISH.republishCta)}</button>` : ''}
      </div>
      <p class="p19-publish-footnote">${LIFECYCLE_PUBLISH_CONFIRM_NOTE} 공개 후에도 공개설정에서 수정·철회할 수 있습니다.</p>
    </div>`;

  return `<section class="mypage-panel p19-panel p19-panel--publish">${renderStudentShell(student, 'publish', body)}</section>`;
}

/** @param {HTMLElement} root @param {() => void} rerender */
export function bindStudentRegEvents(root, rerender) {
  root.querySelectorAll('[data-p19-nav]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.hash = el.getAttribute('data-p19-nav') || '/mypage/registrations/students';
    });
  });

  const activeTab = root.querySelector('.p19-sidebar-nav__link.is-active');
  if (activeTab && typeof activeTab.scrollIntoView === 'function') {
    requestAnimationFrame(() => {
      activeTab.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
    });
  }

  root.querySelectorAll('[data-p19-form]').forEach((form) => {
    const lessonFormat = form.querySelector('[name="lesson_format"]');
    const groupOnly = form.querySelector('[data-p19-group-only]');
    if (lessonFormat && groupOnly) {
      const sync = () => {
        const isGroup = lessonFormat.value === 'group';
        groupOnly.classList.toggle('is-muted', !isGroup);
      };
      lessonFormat.addEventListener('change', sync);
      sync();
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = Number(form.dataset.p19StudentId);
      const patch = parseStudentForm(form);
      try {
        await updateStudent(id, patch);
        rerender();
      } catch (err) {
        console.warn('[p19]', err);
        alert('저장에 실패했습니다.');
      }
    });

    form.querySelectorAll('.p19-chip input[type="checkbox"]').forEach((input) => {
      input.addEventListener('change', () => {
        input.closest('.p19-chip')?.classList.toggle('is-checked', input.checked);
      });
    });

    form.querySelectorAll('.p19-visibility-option input[type="radio"]').forEach((input) => {
      input.addEventListener('change', () => {
        form.querySelectorAll('.p19-visibility-option').forEach((el) => {
          el.classList.toggle('is-selected', el.querySelector('input')?.checked);
        });
      });
    });
  });

  root.querySelectorAll('[data-p19-publish]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const wrap = btn.closest('[data-p19-student-id]');
      const id = Number(wrap?.dataset.p19StudentId);
      try {
        const result = await publishStudent(id);
        if (!result.ok) {
          alert(`공개 불가:\n${result.missing?.join('\n') || result.reason}`);
          return;
        }
        alert('공개되었습니다. (published)');
        rerender();
      } catch (err) {
        console.warn('[p19]', err);
        if (err?.code === 'email_verify_required') {
          showEmailVerifyOverlay();
          return;
        }
        alert('공개 처리에 실패했습니다.');
      }
    });
  });

  root.querySelectorAll('[data-p19-hide]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = Number(btn.closest('[data-p19-student-id]')?.dataset.p19StudentId);
      if (!confirm('노출을 철회(숨김)하시겠습니까?')) return;
      try {
        await hideStudent(id);
        rerender();
      } catch (err) {
        console.warn('[p19]', err);
        alert('숨김 처리에 실패했습니다.');
      }
    });
  });

  root.querySelectorAll('[data-p19-delete]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = Number(btn.closest('[data-p19-student-id]')?.dataset.p19StudentId);
      if (!confirm('삭제하시겠습니까? (deleted)')) return;
      try {
        await deleteStudent(id);
        window.location.hash = '/mypage/registrations/students';
        rerender();
      } catch (err) {
        console.warn('[p19]', err);
        alert('삭제에 실패했습니다.');
      }
    });
  });
}
