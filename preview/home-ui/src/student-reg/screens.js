import { persistFindDefaultsFromStudent } from '../../../shared/student-hope-regions.js';
import { renderStudentBasicSelfCard } from '../exposure-render.js';
import { renderStudentProfileRead } from './profile-read.js';
import {
  parseStudentRegPath,
  studentHubPath,
  studentSectionPath,
  STUDENT_REG_TOP_TABS,
  isStudentLegacyEntryPath,
} from './router.js';
import { getParentStudentProfilePath } from '../mypage/router.js';
import { FORM_OPTIONS, studentToExposureRow } from './format.js';
import { ensureHopeRegionMasters, getHopeRegionMasters, labelForRegionId, listAllComplexes, listCityOptions } from './hope-region-masters.js';
import { renderRegionCascade, bindRegionCascades, REGION_LIST_ERROR } from '../../../shared/region-cascade.js';
import {
  ensureTutorCityUnits,
  getTutorCityUnits,
  tutorCityUnitsError,
  tutorCityUnitsReady,
} from '../tutor-reg/city-units.js';
import { MAIN_SUBJECT_OPTIONS } from '../../../shared/main-subjects.js';
import { cheonwonInputToWon, wonToCheonwonInput } from '../../../shared/fee-cheonwon.js';
import { lessonDurationOptions, lessonDurationSelectValue } from '../../../shared/lesson-duration-options.js';
import { lessonWeeklyOptions, lessonWeeklySelectValue } from '../../../shared/lesson-weekly-options.js';
import { SCHOOL_LEVEL_FORM_OPTIONS, gradeOptionHtml, isGradeSelectDisabled } from '../../../shared/school-grade.js';
import { getStudents, getStudent, updateStudent } from './store.js';

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
  const current = String(value ?? '');
  return `<select name="${name}" class="p19-input p19-select" ${required ? 'required' : ''}>
    ${empty ? '<option value="">선택</option>' : ''}
    ${options
      .map((o) => `<option value="${esc(o.value)}" ${current === String(o.value) ? 'selected' : ''}>${esc(o.label)}</option>`)
      .join('')}
  </select>`;
}

function renderTextInput(name, value, { required = false, placeholder = '', type = 'text', min, max, step, maxlength } = {}) {
  const attrs = [
    type !== 'text' ? `type="${type}"` : 'type="text"',
    `name="${name}"`,
    'class="p19-input"',
    required ? 'required' : '',
    placeholder ? `placeholder="${esc(placeholder)}"` : '',
    min != null ? `min="${min}"` : '',
    max != null ? `max="${max}"` : '',
    step != null ? `step="${step}"` : '',
    maxlength != null ? `maxlength="${maxlength}"` : '',
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

/** @param {import('./store.js').StudentRecord} student @param {string} activeSection @param {string} bodyHtml */
function renderStudentShell(student, activeSection, bodyHtml) {
  const section = ['hub', 'basic', 'detail', 'settings'].includes(activeSection) ? activeSection : 'hub';
  const tabs = STUDENT_REG_TOP_TABS.map((t) => {
    const href = t.key === 'hub' ? studentHubPath(student.id) : studentSectionPath(student.id, /** @type {any} */ (t.key));
    const active = section === t.key;
    return `<a href="#${href}" class="mp-room__tab${active ? ' is-active' : ''}" data-p19-nav="${href}">${esc(t.label)}</a>`;
  }).join('');

  return `
    <div class="mp-room">
      <header class="mp-room__head">
        <nav class="mp-room__tabs" aria-label="내 등록">${tabs}</nav>
      </header>
      <div class="mp-room__body">${bodyHtml}</div>
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
  if (patch.preferred_fee_amount) patch.preferred_fee_amount = Number(cheonwonInputToWon(patch.preferred_fee_amount));
  if (patch.preferred_studyroom_fee_amount) {
    patch.preferred_studyroom_fee_amount = Number(cheonwonInputToWon(patch.preferred_studyroom_fee_amount));
  }
  if (patch.lesson_format === 'one_on_one') {
    patch.preferred_student_count_group = 'solo';
    if (form.querySelector('[name="student_gender_group"]')) {
      patch.student_gender_group = '';
    }
  }
  return patch;
}

/** @param {string} path */
export function renderStudentRegScreen(path) {
  const route = parseStudentRegPath(path);
  if (!route) return '';

  if (route.screenId === 'P19-01' || route.screenId === 'P19-04') {
    return renderSingleProfileEntry();
  }
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
    case 'P19-05':
      return renderSettings(student);
    default:
      return renderHub(student);
  }
}

export function renderStudentCountHalt() {
  const count = getStudents().filter((s) => s && s.exposure_status !== 'deleted').length;
  return `<section class="mypage-panel p19-panel mypage-empty">
    <p>이 계정의 학생이 ${count}명이라 내 등록을 열지 않았습니다. 학생은 1명이어야 합니다.</p>
  </section>`;
}

/** 목록·공개 탭은 그리지 않고, 학생 1명이면 마이프로필로 보낸다. */
function renderSingleProfileEntry() {
  const dest = getParentStudentProfilePath();
  if (!dest) return renderStudentCountHalt();
  queueMicrotask(() => {
    const hashPath = (window.location.hash.slice(1) || '').split('?')[0];
    const p = hashPath.startsWith('/') ? hashPath : `/${hashPath}`;
    if (isStudentLegacyEntryPath(p)) window.location.replace(`#${dest}`);
  });
  const studentId = Number(dest.split('/').pop());
  const student = getStudent(studentId);
  if (!student || student.exposure_status === 'deleted') return renderStudentCountHalt();
  return renderHub(student);
}

function renderNotFound() {
  return `<section class="mypage-panel p19-panel mypage-empty">
    <p>학생 정보를 찾을 수 없습니다.</p>
    <a href="#/mypage" class="btn btn--secondary" data-p19-nav="/mypage">마이프로필</a>
  </section>`;
}

/** @param {import('./store.js').StudentRecord} student */
function renderHub(student) {
  const body = `
    <div class="p19-hub-body">
      <div class="p19-myprofile__card">${renderStudentBasicSelfCard(studentToExposureRow(student))}</div>
      ${renderStudentProfileRead(student)}
    </div>`;

  return `<section class="mypage-panel mp-room-panel">${renderStudentShell(student, 'hub', body)}</section>`;
}

/** @param {string|number|null|undefined} selectedId @param {string} [selectedLabel] */
function basicRegionOptions(selectedId, selectedLabel) {
  const id = selectedId != null && selectedId !== '' ? String(selectedId) : '';
  const options = listCityOptions().map((c) => ({ value: String(c.id), label: c.label }));
  const regions = getHopeRegionMasters().regions.map((r) => ({ value: String(r.id), label: r.label }));
  const merged = [...options];
  regions.forEach((r) => {
    if (!merged.some((o) => o.value === r.value)) merged.push(r);
  });
  if (id && !merged.some((o) => o.value === id)) {
    merged.unshift({ value: id, label: selectedLabel || labelForRegionId(id) || id });
  }
  return merged;
}

/** @param {import('./store.js').StudentRecord} student */
function renderBasicForm(student) {
  const hope = student.preferred_lesson_type === 'study_room' ? 'study_room' : 'tutor';
  const basis = student.preferred_studyroom_region_basis === 'complex' ? 'complex' : 'dong';
  const subjectNames = MAIN_SUBJECT_OPTIONS.map((o) => o.value);
  const subjectValue = subjectNames.includes(student.subject_label) ? student.subject_label : student.subject_label || '';
  const subjectOptions = MAIN_SUBJECT_OPTIONS.map((o) => ({ value: o.value, label: o.label }));
  if (subjectValue && !subjectNames.includes(subjectValue)) {
    subjectOptions.unshift({ value: subjectValue, label: subjectValue });
  }
  const schoolOptions = SCHOOL_LEVEL_FORM_OPTIONS;
  const grade = gradeOptionHtml(student.school_level || '', student.grade_level || '');
  const tutorUnits = getTutorCityUnits();
  const tutorRegionHtml = tutorCityUnitsReady()
    ? renderRegionCascade({
        idPrefix: `p19_tutor_region_${student.id}`,
        units: tutorUnits,
        regionId: student.preferred_tutor_region_id,
        selectClass: 'p19-input p19-select',
        hiddenName: 'preferred_tutor_region_id',
      })
    : `<p class="p19-field__hint">${esc(tutorCityUnitsError() || '지역 목록을 불러오는 중입니다.')}</p>
       <input type="hidden" name="preferred_tutor_region_id" value="" />`;
  const studyRegion = basicRegionOptions(student.preferred_studyroom_region_id, student.region_label);
  const complexes = listAllComplexes().map((c) => ({
    value: String(c.id),
    label: c.address ? `${c.label} — ${c.address}` : c.label,
  }));
  const countValue = student.lesson_format === 'one_on_one'
    ? 'solo'
    : student.preferred_student_count_group || '';

  const formBody = `
    <form class="p19-form" data-p19-form="basic" data-p19-basic data-p19-student-id="${student.id}">
      ${renderFormSection(
        '기본정보',
        '카드에 보이는 기본 항목입니다.',
        `
        <label class="p19-field">
          <span class="p19-field__label">표시명</span>
          ${renderTextInput('public_display_name', student.public_display_name || '', { maxlength: 40 })}
        </label>
        <label class="p19-field">
          <span class="p19-field__label">학교급</span>
          ${renderSelect('school_level', schoolOptions, student.school_level || '', { empty: true })}
        </label>
        <label class="p19-field">
          <span class="p19-field__label">학년</span>
          <select name="grade_level" class="p19-input p19-select" ${grade.disabled ? 'disabled' : ''}>${grade.html}</select>
        </label>
        <label class="p19-field">
          <span class="p19-field__label">희망 유형</span>
          ${renderSelect('preferred_lesson_type', FORM_OPTIONS.lessonType, hope, { required: true })}
        </label>
        <div data-p19-hope-panel="tutor" ${hope === 'tutor' ? '' : 'hidden'}>
          <div class="p19-field">
            <span class="p19-field__label">희망지역</span>
            ${tutorRegionHtml}
          </div>
          <label class="p19-field">
            <span class="p19-field__label">예산 (천원)</span>
            ${renderTextInput('preferred_fee_amount', wonToCheonwonInput(student.preferred_fee_amount), { type: 'number', min: 0, step: 1 })}
          </label>
        </div>
        <div data-p19-hope-panel="study_room" ${hope === 'study_room' ? '' : 'hidden'}>
          <label class="p19-field">
            <span class="p19-field__label">희망지역 기준</span>
            ${renderSelect('preferred_studyroom_region_basis', [
              { value: 'dong', label: '행정동 기준' },
              { value: 'complex', label: '아파트단지 기준' },
            ], basis)}
          </label>
          <label class="p19-field" data-p19-basis-panel="dong" ${basis === 'dong' ? '' : 'hidden'}>
            <span class="p19-field__label">희망지역</span>
            ${renderSelect('preferred_studyroom_region_id', studyRegion, student.preferred_studyroom_region_id != null ? String(student.preferred_studyroom_region_id) : '', { empty: true })}
          </label>
          <label class="p19-field" data-p19-basis-panel="complex" ${basis === 'complex' ? '' : 'hidden'}>
            <span class="p19-field__label">희망지역</span>
            ${renderSelect('preferred_studyroom_complex_id', complexes, student.preferred_studyroom_complex_id != null ? String(student.preferred_studyroom_complex_id) : '', { empty: true })}
          </label>
          <label class="p19-field">
            <span class="p19-field__label">예산 (천원)</span>
            ${renderTextInput('preferred_studyroom_fee_amount', wonToCheonwonInput(student.preferred_studyroom_fee_amount), { type: 'number', min: 0, step: 1 })}
          </label>
        </div>
        <label class="p19-field">
          <span class="p19-field__label">희망과목</span>
          ${renderSelect('subject_label', subjectOptions, subjectValue, { empty: true })}
        </label>
        <label class="p19-field">
          <span class="p19-field__label">수업형태</span>
          ${renderSelect('lesson_format', FORM_OPTIONS.lessonFormat, student.lesson_format || '', { empty: true })}
        </label>
        <label class="p19-field">
          <span class="p19-field__label">수업인원</span>
          ${renderSelect('preferred_student_count_group', FORM_OPTIONS.studentCount, countValue, { empty: true })}
        </label>
        <label class="p19-field p19-field--full">
          <span class="p19-field__label">한 줄 요청문</span>
          ${renderTextInput('request_summary', student.request_summary || '', { maxlength: 200 })}
        </label>`,
      )}
      ${renderFormFooter('', '<button type="submit" class="btn btn--primary">저장</button>')}
    </form>`;

  return `<section class="mypage-panel mp-room-panel">${renderStudentShell(student, 'basic', formBody)}</section>`;
}

/** @param {string} label @param {string} hint @param {string} control */
function renderDetailField(label, hint, control) {
  return `
    <div class="student-detail-field">
      <span class="student-detail-label">${esc(label)}</span>
      <span class="student-detail-hint">${esc(hint)}</span>
      ${control}
    </div>`;
}

/** @param {import('./store.js').StudentRecord} student */
function renderDetailForm(student) {
  const formBody = `
    <form class="p19-form student-detail-form" data-p19-form="detail" data-p19-student-id="${student.id}">
      <header class="student-detail-head">
        <h2 class="student-detail-title">학생 상세정보</h2>
        <p class="student-detail-lead">입력데이터가 맞을수록 더 적합한 과외쌤, 공부방을 만날 수 있습니다.</p>
      </header>
      ${renderDetailField(
        '희망지역 추가값',
        '기본정보에 적은 희망지역 외에 더 알리고 싶은 지역입니다.',
        renderTextInput('preferred_region_note', student.preferred_region_note || '', {
          placeholder: '예: 대치동 주변',
          maxlength: 255,
        }),
      )}
      ${renderDetailField(
        '희망 수업장소',
        '수업이 이루어지면 좋은 장소입니다.',
        renderCheckboxGroup('lesson_places', FORM_OPTIONS.lessonPlaces, student.lesson_places),
      )}
      <div class="student-detail-grid">
        ${renderDetailField(
          '주 회수',
          '일주일에 원하는 수업 횟수입니다.',
          renderSelect('lessons_per_week', lessonWeeklyOptions(student.lessons_per_week), lessonWeeklySelectValue(student.lessons_per_week), { empty: true }),
        )}
        ${renderDetailField(
          '1회 수업시간',
          '한 번 수업의 길이입니다.',
          renderSelect('minutes_per_lesson', lessonDurationOptions(student.minutes_per_lesson), lessonDurationSelectValue(student.minutes_per_lesson), { empty: true }),
        )}
      </div>
      ${renderDetailField(
        '희망 강의스타일',
        '마음에 드는 수업 방식을 고릅니다.',
        renderCheckboxGroup('teaching_style_badges', FORM_OPTIONS.teachingStyle, student.teaching_style_badges),
      )}
      <div class="student-detail-grid">
        ${renderDetailField(
          '희망 과외쌤 성별',
          '과외쌤 성별 선호입니다.',
          renderSelect(
            'preferred_tutor_gender',
            [
              { value: 'female', label: '여' },
              { value: 'male', label: '남' },
              { value: 'any', label: '무관' },
            ],
            student.preferred_tutor_gender || '',
            { empty: true },
          ),
        )}
        ${renderDetailField(
          '학생 성별',
          '학생의 성별입니다.',
          renderSelect(
            'gender',
            [
              { value: 'female', label: '여' },
              { value: 'male', label: '남' },
            ],
            student.gender || '',
            { empty: true },
          ),
        )}
      </div>
      ${renderDetailField(
        '출생연도',
        '태어난 해를 네 자리로 적습니다.',
        renderTextInput('birth_year', student.birth_year || '', {
          type: 'number',
          min: 1900,
          max: 2100,
          placeholder: '2012',
        }),
      )}
      ${renderDetailField(
        '특이요청사항',
        '매칭에 도움이 되는 요청입니다.',
        renderTextarea('special_request_note', student.special_request_note || '', {
          rows: 3,
          placeholder: '예: 저녁 시간, 개념부터 천천히',
        }),
      )}
      ${renderFormFooter('', '<button type="submit" class="btn btn--primary">저장</button>')}
    </form>`;

  return `<section class="mypage-panel mp-room-panel student-detail-screen">${renderStudentShell(student, 'detail', formBody)}</section>`;
}

/** @param {import('./store.js').StudentRecord} student */
function renderSettings(student) {
  const status = student.memo_status === 'paused' ? 'paused' : 'open';
  const body = `
    <form class="p19-form" data-p19-form="settings" data-p19-memo-shell data-p19-student-id="${student.id}">
      <div class="p21-inq">
        <p class="p21-inq__lead">쪽지 수신</p>
        <div class="p21-inq-choices" role="radiogroup" aria-label="쪽지 수신">
          <label class="p21-inq-choice${status === 'open' ? ' is-selected' : ''}">
            <input type="radio" name="memo_status" value="open" ${status === 'open' ? 'checked' : ''} />
            <span>받음</span>
          </label>
          <label class="p21-inq-choice${status === 'paused' ? ' is-selected' : ''}">
            <input type="radio" name="memo_status" value="paused" ${status === 'paused' ? 'checked' : ''} />
            <span>안 받음</span>
          </label>
        </div>
      </div>
      ${renderFormFooter('', '<button type="submit" class="btn btn--primary">저장</button>')}
    </form>`;

  return `<section class="mypage-panel mp-room-panel">${renderStudentShell(student, 'settings', body)}</section>`;
}

/** @param {HTMLElement} root @param {() => void} rerender */
export function bindStudentRegEvents(root, rerender) {
  ensureHopeRegionMasters();
  ensureTutorCityUnits().then((loaded) => {
    if (loaded) rerender();
  });

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

    if (form.getAttribute('data-p19-form') === 'basic') {
      const syncBasic = () => {
        const hope = form.querySelector('[name="preferred_lesson_type"]')?.value || 'tutor';
        form.querySelectorAll('[data-p19-hope-panel]').forEach((panel) => {
          const on = panel.getAttribute('data-p19-hope-panel') === hope;
          panel.hidden = !on;
          panel.querySelectorAll('select,input').forEach((el) => {
            el.disabled = !on;
          });
        });
        const basis = form.querySelector('[name="preferred_studyroom_region_basis"]')?.value || 'dong';
        form.querySelectorAll('[data-p19-basis-panel]').forEach((panel) => {
          const on = hope === 'study_room' && panel.getAttribute('data-p19-basis-panel') === basis;
          panel.hidden = !on;
          panel.querySelectorAll('select,input').forEach((el) => {
            el.disabled = !on;
          });
        });
        const solo = form.querySelector('[name="lesson_format"]')?.value === 'one_on_one';
        const count = form.querySelector('[name="preferred_student_count_group"]');
        if (count && solo) count.value = 'solo';
      };
      form.querySelector('[name="preferred_lesson_type"]')?.addEventListener('change', syncBasic);
      form.querySelector('[name="preferred_studyroom_region_basis"]')?.addEventListener('change', syncBasic);
      form.querySelector('[name="lesson_format"]')?.addEventListener('change', syncBasic);
      const schoolLevel = form.querySelector('[name="school_level"]');
      const gradeLevel = form.querySelector('[name="grade_level"]');
      schoolLevel?.addEventListener('change', () => {
        if (!(schoolLevel instanceof HTMLSelectElement) || !(gradeLevel instanceof HTMLSelectElement)) return;
        const next = gradeOptionHtml(schoolLevel.value, '');
        gradeLevel.disabled = next.disabled;
        gradeLevel.innerHTML = next.html;
      });
      syncBasic();
      const tutorPanel = form.querySelector('[data-p19-hope-panel="tutor"]');
      if (tutorPanel) bindRegionCascades(tutorPanel, getTutorCityUnits());
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = Number(form.dataset.p19StudentId);
      const formKind = form.getAttribute('data-p19-form');
      let patch = parseStudentForm(form);
      if (formKind === 'settings') {
        const picked = patch.memo_status;
        if (picked !== 'open' && picked !== 'paused') {
          alert('저장에 실패했습니다.');
          return;
        }
        patch = { memo_status: picked };
      }
      if (formKind === 'basic' && String(patch.preferred_lesson_type || '') !== 'study_room') {
        if (!tutorCityUnitsReady()) {
          alert(tutorCityUnitsError() || REGION_LIST_ERROR);
          return;
        }
        const regionId = String(patch.preferred_tutor_region_id || '').trim();
        const picker = form.querySelector('[data-p19-hope-panel="tutor"] [data-region-cascade]');
        const started = Boolean(picker?.querySelector('[data-field="region_sido"]')?.value);
        if (!/^\d+$/.test(regionId)) {
          alert(started ? '희망지역을 끝까지 선택해 주세요.' : '희망지역을 선택해 주세요.');
          return;
        }
      }
      if (formKind === 'basic' && patch.lesson_format === 'one_on_one') {
        patch.preferred_student_count_group = 'solo';
      }
      if (formKind === 'basic' && isGradeSelectDisabled(String(patch.school_level || ''))) {
        patch.grade_level = '';
      }
      if (formKind === 'detail') {
        if (!patch.lesson_places) patch.lesson_places = [];
        if (!patch.teaching_style_badges) patch.teaching_style_badges = [];
      }

      try {
        const saved = await updateStudent(id, patch);
        if (formKind === 'detail' && saved) persistFindDefaultsFromStudent(saved);
        alert('저장되었습니다.');
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

    form.querySelectorAll('.p21-inq-choice input[type="radio"]').forEach((input) => {
      input.addEventListener('change', () => {
        form.querySelectorAll('.p21-inq-choice').forEach((el) => {
          el.classList.toggle('is-selected', !!el.querySelector('input')?.checked);
        });
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

}
