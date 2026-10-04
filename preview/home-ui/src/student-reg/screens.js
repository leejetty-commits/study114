import { syncStoredHopeRegionsFromStudent } from '@search-ui/student-saved-region.js';
import { setStoredStudentBranch } from '../../../shared/student-branch-store.js';
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
import { renderRegionCascade, bindRegionCascades, REGION_LIST_ERROR } from '../../../shared/region-cascade.js';
import {
  bindStudentHopeRegion,
  readStudentHopeRegion,
  renderStudentHopeRegion,
} from '../../../shared/study-room-basic-form.js';
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
import { STUDENT_BRANCH_COPY, STUDENT_COUNT_HALT_COPY } from './student-reg-copy.js';
import { getAuthUser } from '../auth-session.js';
import { basicRegisterPathForMe } from '../../../shared/auth-redirect.js';
import { AUTH_UI_BASE } from '../../../shared/preview-links.js';
import './student-basic-fill.css';

const SUPPORT_CONTACT_PATH = '/support/contact';

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
  // 예산 0은 미입력이다. cheonwonInputToWon 이 0 이하를 ''로 돌려주므로 빈칸으로 보낸다(Number('') = 0 금지).
  for (const key of ['preferred_fee_amount', 'preferred_studyroom_fee_amount']) {
    if (key in patch) {
      const won = cheonwonInputToWon(patch[key]);
      patch[key] = won === '' ? '' : Number(won);
    }
  }
  if (patch.lesson_format === 'one_on_one') {
    patch.preferred_student_count_group = 'solo';
    if (form.querySelector('[name="student_gender_group"]')) {
      patch.student_gender_group = '';
    }
  }
  Object.keys(patch).forEach((key) => {
    if (key.startsWith('slot_basis_')) delete patch[key];
  });
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

/** 학생 0명 → 기본정보 입력, 2명 이상 → 운영문의. 임의로 한 명을 골라 열지 않는다. */
export function renderStudentCountHalt() {
  const count = getStudents().filter((s) => s && s.exposure_status !== 'deleted').length;
  if (count === 0) {
    const copy = STUDENT_COUNT_HALT_COPY.zero;
    const basicHref = `${String(AUTH_UI_BASE).replace(/\/$/, '')}/#${basicRegisterPathForMe(getAuthUser())}`;
    return `<section class="mypage-panel p19-panel mypage-empty" data-student-count-halt="zero">
    <p class="mypage-empty__title">${esc(copy.title)}</p>
    <p class="mypage-empty__body">${esc(copy.body)}</p>
    <a href="${esc(basicHref)}" class="btn btn--primary state-card__cta">${esc(copy.cta)}</a>
  </section>`;
  }
  const copy = STUDENT_COUNT_HALT_COPY.many;
  return `<section class="mypage-panel p19-panel mypage-empty" data-student-count-halt="many">
    <p class="mypage-empty__title">${esc(copy.title(count))}</p>
    <p class="mypage-empty__body">${esc(copy.body)}</p>
    <a href="#${SUPPORT_CONTACT_PATH}" class="btn btn--primary state-card__cta" data-p19-nav="${SUPPORT_CONTACT_PATH}">${esc(copy.cta)}</a>
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

/** 저장된 공부방 희망지역을 가입과 같은 카카오 주소검색 칸에 채운다. */
function hopeRegionValues(student) {
  const basis = student.preferred_studyroom_region_basis === 'complex' ? 'complex' : 'dong';
  const slots = Array.isArray(student.preferred_studyroom_regions) ? student.preferred_studyroom_regions : [];
  const slot = slots[0] || {};
  const regionLabel = String(student.preferred_studyroom_region_label || slot.region_label || '').trim();
  const complexName = basis === 'complex'
    ? String(student.preferred_studyroom_complex_label || slot.complex_label || '').trim()
    : '';
  return {
    region_id: student.preferred_studyroom_region_id != null && student.preferred_studyroom_region_id !== ''
      ? String(student.preferred_studyroom_region_id)
      : '',
    region_basis: basis,
    region_label: regionLabel,
    complex_name: complexName,
    complex_label: complexName,
  };
}

/** 과외 희망지역(시·군·구) 선택칸. @param {number} studentId @param {string|number|null|undefined} regionId */
function renderTutorRegionField(studentId, regionId) {
  return tutorCityUnitsReady()
    ? renderRegionCascade({
        idPrefix: `p19_tutor_region_${studentId}`,
        units: getTutorCityUnits(),
        regionId,
        selectClass: 'p19-input p19-select',
        hiddenName: 'preferred_tutor_region_id',
      })
    : `<p class="p19-field__hint">${esc(tutorCityUnitsError() || '지역 목록을 불러오는 중입니다.')}</p>
       <input type="hidden" name="preferred_tutor_region_id" value="" />`;
}

/** @param {import('./store.js').StudentRecord} student */
function renderBasicForm(student) {
  const hope = student.preferred_lesson_type === 'study_room' ? 'study_room' : 'tutor';
  const subjectNames = MAIN_SUBJECT_OPTIONS.map((o) => o.value);
  const subjectValue = subjectNames.includes(student.subject_label) ? student.subject_label : student.subject_label || '';
  const subjectOptions = MAIN_SUBJECT_OPTIONS.map((o) => ({ value: o.value, label: o.label }));
  if (subjectValue && !subjectNames.includes(subjectValue)) {
    subjectOptions.unshift({ value: subjectValue, label: subjectValue });
  }
  const schoolOptions = SCHOOL_LEVEL_FORM_OPTIONS;
  const grade = gradeOptionHtml(student.school_level || '', student.grade_level || '');
  const tutorRegionHtml = renderTutorRegionField(student.id, student.preferred_tutor_region_id);
  const countValue = student.lesson_format === 'one_on_one'
    ? 'solo'
    : student.preferred_student_count_group || '';

  const formBody = `
    <form class="p19-form" data-p19-form="basic" data-p19-basic data-p19-student-id="${student.id}" data-p19-saved-hope="${hope}">
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
            <div data-p19-tutor-region-slot>${tutorRegionHtml}</div>
          </div>
          <label class="p19-field">
            <span class="p19-field__label">예산 (천원)</span>
            ${renderTextInput('preferred_fee_amount', wonToCheonwonInput(student.preferred_fee_amount), { type: 'number', min: 1, step: 1 })}
          </label>
        </div>
        <div data-p19-hope-panel="study_room" ${hope === 'study_room' ? '' : 'hidden'}>
          <div class="p19-field" data-p19-hope-region-slot>${renderStudentHopeRegion(hopeRegionValues(student))}</div>
          <label class="p19-field">
            <span class="p19-field__label">예산 (천원)</span>
            ${renderTextInput('preferred_studyroom_fee_amount', wonToCheonwonInput(student.preferred_studyroom_fee_amount), { type: 'number', min: 1, step: 1 })}
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

/* basic-fill:start */
const BASIC_FILL_SKIP_TYPES = new Set(['hidden', 'radio', 'checkbox', 'button', 'submit', 'reset', 'file', 'image', 'range', 'color']);

/** text·number·select·textarea. 라디오·체크·숨김은 제외. */
function isBasicFillControl(el) {
  const tag = String(el?.tagName || '').toUpperCase();
  if (tag === 'SELECT' || tag === 'TEXTAREA') return true;
  if (tag !== 'INPUT') return false;
  const type = String(el.type || 'text').toLowerCase();
  return !BASIC_FILL_SKIP_TYPES.has(type);
}

function basicFillState(el) {
  return String(el.value ?? '').trim() !== '' ? 'filled' : 'empty';
}

/** 기본정보 칸의 data-fill. 색은 student-basic-fill.css 한곳. 포커스 흰색은 :focus 가 맡는다. */
function paintBasicFillChrome(root) {
  if (!root || typeof root.querySelectorAll !== 'function') return;
  root.querySelectorAll('input, select, textarea').forEach((el) => {
    if (!isBasicFillControl(el)) {
      el.removeAttribute('data-fill');
      return;
    }
    el.setAttribute('data-fill', basicFillState(el));
  });
}

/**
 * 입력·선택은 즉시, 분기 교체·지역 하위칸 갱신은 change 버블에서 폼 전체를 다시 칠한다.
 * 대상 요소의 change 리스너(분기 교체, 시·도 연쇄)가 먼저 값을 바꾼 뒤 이 버블이 돈다.
 */
function bindBasicFillChrome(root) {
  root.addEventListener('input', (e) => {
    const el = e.target;
    if (!isBasicFillControl(el)) return;
    el.setAttribute('data-fill', basicFillState(el));
  });
  root.addEventListener('change', () => {
    paintBasicFillChrome(root);
  });
  paintBasicFillChrome(root);
}
/* basic-fill:end */

/** @param {HTMLElement} slot @param {Record<string, unknown>} [values] */
function mountStudentHopeRegion(slot, values) {
  slot.innerHTML = renderStudentHopeRegion(values || {});
  bindStudentHopeRegionChrome(slot);
}

/** @param {HTMLElement} slot */
function bindStudentHopeRegionChrome(slot) {
  const paint = () => paintBasicFillChrome(slot.closest('form') || slot);
  bindStudentHopeRegion(slot, {
    onApplied() {
      paint();
    },
  });
  paint();
}

/**
 * 주소검색이 비었거나 동·단지 코드가 없으면 null(저장 가능, 빈칸 안내는 저장 후 문구).
 * 검색은 했는데 동·단지를 확정하지 못하면 copy 한곳의 실패 문구를 반환한다. 가짜 id 는 만들지 않는다.
 * @param {ReturnType<typeof readStudentHopeRegion>} hopeRegion
 * @returns {string|null}
 */
function studyRoomHopeIssue(hopeRegion) {
  const copy = STUDENT_BRANCH_COPY.mypage;
  const basis = hopeRegion?.region_basis === 'complex' ? 'complex' : 'dong';
  const regionId = String(hopeRegion?.region_id || '').trim();
  const label = String(hopeRegion?.region_label || '').trim();
  const place = String(hopeRegion?.complex_name || '').trim();
  const hasRegionId = /^[1-9]\d*$/.test(regionId);
  if (basis === 'dong') {
    if (!hasRegionId && !label) return null;
    if (!hasRegionId) return copy.hopeRegionDongMissing;
    return null;
  }
  if (!hasRegionId && !place) return null;
  if (!hasRegionId) return copy.hopeRegionComplexMissing;
  if (!place) return copy.hopeRegionComplexNameMissing;
  return null;
}

/**
 * 교습형태(분기) 변경. 저장된 분기와 다른 쪽으로 바꾸면 확인창을 띄우고, 동의하면 새 분기 지역칸을 비운다.
 * 취소하면 이전 선택으로 되돌린다. 저장된 분기로 돌아오면 저장된 지역을 다시 채운다.
 * 반대 분기 패널은 syncBasic 이 disabled 로 둬 전송하지 않는다.
 * @param {HTMLFormElement} form @param {() => void} syncBasic
 */
function bindLessonTypeChange(form, syncBasic) {
  const select = form.querySelector('[name="preferred_lesson_type"]');
  if (!(select instanceof HTMLSelectElement)) return;
  const studentId = Number(form.dataset.p19StudentId);
  const savedHope = form.getAttribute('data-p19-saved-hope') === 'study_room' ? 'study_room' : 'tutor';
  const savedTutorRegion = form.querySelector('[name="preferred_tutor_region_id"]')?.value || '';
  const savedHopeRegion = readStudentHopeRegion(form) || {};
  let shownHope = savedHope;

  const fillBranchRegion = (hope, restore) => {
    if (hope === 'tutor') {
      const slot = form.querySelector('[data-p19-tutor-region-slot]');
      if (!slot) return;
      slot.innerHTML = renderTutorRegionField(studentId, restore ? savedTutorRegion : '');
      bindRegionCascades(slot, getTutorCityUnits());
      return;
    }
    const slot = form.querySelector('[data-p19-hope-region-slot]');
    if (!slot) return;
    mountStudentHopeRegion(slot, restore ? savedHopeRegion : {});
  };

  select.addEventListener('change', () => {
    const next = select.value === 'study_room' ? 'study_room' : 'tutor';
    if (next === shownHope) return;
    if (next !== savedHope && !window.confirm(STUDENT_BRANCH_COPY.mypage.changeConfirm)) {
      select.value = shownHope;
      return;
    }
    shownHope = next;
    fillBranchRegion(next, next === savedHope);
    syncBasic();
  });
}

/**
 * 기본정보·상세정보 저장 후 안내. 카드·상단 메뉴 반영은 새로고침 뒤라 항상 새로고침을 권한다.
 * @param {boolean} branchChanged @param {Record<string, unknown>|null} saved
 */
function savedNotice(branchChanged, saved) {
  const copy = STUDENT_BRANCH_COPY.mypage;
  const missing = Array.isArray(saved?.basic_missing) ? saved.basic_missing.map(String) : [];
  const lines = [branchChanged ? copy.branchSavedRefresh : copy.savedRefresh];
  if (saved?.exposure_status === 'draft' && missing.length) lines.push(copy.draftMissing(missing.join(', ')));
  if (missing.includes('희망지역')) lines.push(copy.regionEmptyHint);
  return lines.join('\n\n');
}

/** @param {HTMLElement} root @param {() => void} rerender */
export function bindStudentRegEvents(root, rerender) {
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
          panel.querySelectorAll('select, input, textarea').forEach((el) => {
            el.disabled = !on;
          });
        });
        const solo = form.querySelector('[name="lesson_format"]')?.value === 'one_on_one';
        const count = form.querySelector('[name="preferred_student_count_group"]');
        if (count && solo) count.value = 'solo';
      };
      // min=1 위반(0 입력)은 브라우저 말풍선 대신 「예산」 이름으로 안내한다.
      form.querySelectorAll('[name="preferred_fee_amount"], [name="preferred_studyroom_fee_amount"]').forEach((el) => {
        el.addEventListener('invalid', (ev) => {
          ev.preventDefault();
          alert('예산은 1천원 이상으로 입력해 주세요. 0은 입력하지 않은 것으로 봅니다.');
        });
      });
      bindLessonTypeChange(form, syncBasic);
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
      const hopeSlot = form.querySelector('[data-p19-hope-region-slot]');
      if (hopeSlot) bindStudentHopeRegionChrome(hopeSlot);
      bindBasicFillChrome(form);
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
      if (formKind === 'basic' && String(patch.preferred_lesson_type || '') === 'study_room') {
        const hopeRegion = readStudentHopeRegion(form);
        const issue = studyRoomHopeIssue(hopeRegion);
        if (issue) {
          alert(issue);
          return;
        }
        const basis = hopeRegion?.region_basis === 'complex' ? 'complex' : 'dong';
        const regionId = String(hopeRegion?.region_id || '').trim();
        const place = String(hopeRegion?.complex_name || '').trim();
        patch.preferred_studyroom_region_basis = basis;
        patch.preferred_studyroom_region_id = regionId;
        delete patch.complex_name;
        delete patch.complex_address;
        delete patch.preferred_studyroom_complex_id;
        if (basis === 'complex' && place) {
          patch.complex_name = place;
        } else {
          patch.preferred_studyroom_complex_id = '';
        }
      } else if (formKind === 'basic') {
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

      const branchChanged =
        formKind === 'basic' &&
        Boolean(patch.preferred_lesson_type) &&
        patch.preferred_lesson_type !== form.getAttribute('data-p19-saved-hope');

      try {
        const saved = await updateStudent(id, patch);
        if (saved) setStoredStudentBranch(saved.preferred_lesson_type);
        if ((formKind === 'basic' || formKind === 'detail') && saved) syncStoredHopeRegionsFromStudent(saved);
        alert(formKind === 'settings' ? '저장되었습니다.' : savedNotice(branchChanged, saved));
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
