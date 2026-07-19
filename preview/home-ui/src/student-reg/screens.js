import { authStudentAddUrl } from '../../../shared/student-auth-bridge.js';
import {
  dualHopeRegionsReady,
  persistFindDefaultsFromStudent,
  primaryHopeRegionLabel,
} from '../../../shared/student-hope-regions.js';
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
  bindDualHopeRegionsEvents,
  collectDualHopeRegions,
  renderDualHopeRegionsSection,
} from './hope-regions-ui.js';
import { ensureHopeRegionMasters } from './hope-region-masters.js';
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
    return !!student.preferred_lesson_type;
  }
  if (activeKey === 'detail') {
    return dualHopeRegionsReady(student).ok && !!student.preferred_tutor_gender;
  }
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
        <a href="${authStudentAddUrl()}" class="btn btn--primary btn--sm" data-same-tab-href="${authStudentAddUrl()}">${esc(P19_LIST_HEAD.registerCta)}</a>
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
          <dt>대표 희망지역</dt><dd>${esc(primaryHopeRegionLabel(student) || '—')}</dd>
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
  const formBody = `
    <form class="p19-form" data-p19-form="basic" data-p19-student-id="${student.id}">
      ${renderFormSection(
        '기본등록 · 지역 seed',
        '희망 유형은 필수입니다. 지역 1번은 가입 직후 기본등록에서 받으며, 상세에서 같은 필드를 수정·확장합니다.',
        `
        <label class="p19-field">
          <span class="p19-field__label">희망 유형 <em class="p19-required">필수</em></span>
          ${renderSelect('preferred_lesson_type', FORM_OPTIONS.lessonType, student.preferred_lesson_type, { required: true })}
        </label>
        <p class="p19-field__hint">대표 희망지역: <strong>${esc(primaryHopeRegionLabel(student) || '미등록 — auth 기본등록에서 지역 seed 필요')}</strong></p>
        <p class="p19-field__hint">기준: ${esc(student.preferred_studyroom_region_basis || (student.preferred_lesson_type === 'tutor' ? '시' : '—'))}</p>`,
      )}
      ${renderFormFooter(
        '저장해도 학생찾기에 공개되지 않습니다. 다음 단계: 상세등록에서 지역 확장.',
        `<button type="submit" class="btn btn--primary">draft 저장</button>
         <a href="#${studentSectionPath(student.id, 'detail')}" class="btn btn--secondary" data-p19-nav="${studentSectionPath(student.id, 'detail')}">상세등록으로</a>`,
      )}
    </form>`;

  return `<section class="mypage-panel p19-panel p19-panel--form">${renderStudentShell(student, 'basic', formBody)}</section>`;
}

/** @param {import('./store.js').StudentRecord} student */
function renderDetailForm(student) {
  const isGroup = student.lesson_format === 'group';
  const seedSummary = [
    student.preferred_lesson_type &&
      `희망유형: ${FORM_OPTIONS.lessonType.find((o) => o.value === student.preferred_lesson_type)?.label || student.preferred_lesson_type}`,
    primaryHopeRegionLabel(student) && `대표 희망지역: ${primaryHopeRegionLabel(student)}`,
  ]
    .filter(Boolean)
    .join(' · ');

  const formBody = `
    <form class="p19-form" data-p19-form="detail" data-p19-student-id="${student.id}">
      <div class="p19-inline-tip">
        <strong>기본등록 seed</strong> ${esc(seedSummary || '—')}
        · <a href="#${studentSectionPath(student.id, 'basic')}" data-p19-nav="${studentSectionPath(student.id, 'basic')}">기본정보 수정</a>
      </div>
      ${renderFormSection(
        '희망지역 (상세등록 본체)',
        '공부방=행정동/단지 · 과외쌤=시 · 각 축 1필수+추가2 · 홈/찾기는 희망유형 축의 1번을 씁니다.',
        renderDualHopeRegionsSection(student),
      )}
      ${renderFormSection(
        '표시 · 학년',
        '학생찾기 검색/리스트에 쓰이는 핵심 항목입니다.',
        `
        <div class="p19-field-grid p19-field-grid--2">
          <label class="p19-field p19-field--full">
            <span class="p19-field__label">공개 표시명 <em class="p19-required">필수</em></span>
            <span class="p19-field__hint">실명 대신 노출되는 이름입니다</span>
            ${renderTextInput('public_display_name', student.public_display_name, { required: true, placeholder: '예: 중2 수학 여학생' })}
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
        '관리용 · 검색에는 표시명만 노출됩니다.',
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
        '장소·형태·횟수 등 희망 수업 조건입니다.',
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
        '스타일 · 예산 · 과외쌤',
        '검색 비교와 매칭에 쓰입니다.',
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
        </div>
        <label class="p19-field p19-field--card">
          <span class="p19-field__label">희망 과외쌤 성별</span>
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
        '상세등록을 마친 뒤 미리보기에서 학생찾기에 공개할 수 있습니다.',
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
  ensureHopeRegionMasters();
  if (root.querySelector('[data-p19-hope-dual]')) {
    bindDualHopeRegionsEvents(root);
  }

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
      const formKind = form.getAttribute('data-p19-form');
      let patch = parseStudentForm(form);

      if (formKind === 'detail' && form.querySelector('[data-p19-hope-dual]')) {
        const current = getStudent(id);
        const hopeType = current?.preferred_lesson_type === 'study_room' ? 'study_room' : 'tutor';
        const hope = collectDualHopeRegions(form, hopeType);
        if (hope.error) {
          alert(hope.error);
          return;
        }
        // FormData에 슬롯 raw 필드가 섞이지 않게 제거 후 구조화 필드만 저장
        Object.keys(patch).forEach((k) => {
          if (/^(studyroom_|tutor_region_|tutor_)/.test(k) || k.startsWith('studyroom_')) {
            delete patch[k];
          }
        });
        patch = {
          ...patch,
          preferred_studyroom_regions: hope.preferred_studyroom_regions,
          preferred_tutor_regions: hope.preferred_tutor_regions,
          preferred_studyroom_region_id: hope.preferred_studyroom_region_id,
          preferred_tutor_region_id: hope.preferred_tutor_region_id,
          preferred_studyroom_complex_id: hope.preferred_studyroom_complex_id,
          preferred_studyroom_region_basis: hope.preferred_studyroom_region_basis,
          preferred_region_note: hope.preferred_region_note,
          region_label: hope.region_label,
          region_id: hope.region_id ? Number(hope.region_id) || hope.region_id : undefined,
        };
      }

      try {
        const saved = await updateStudent(id, patch);
        if (formKind === 'detail' && saved) persistFindDefaultsFromStudent(saved);
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
