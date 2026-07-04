import { authStudentAddUrl } from '../../../shared/student-auth-bridge.js';
import { statusLabel } from '../mypage/preview-data.js';
import { renderBrowseList } from '../exposure-render.js';
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
      <label class="p19-chip">
        <input type="checkbox" name="${name}" value="${esc(o.value)}" ${sel.has(o.value) ? 'checked' : ''} ${required && sel.size === 0 ? '' : ''} />
        <span>${esc(o.label)}</span>
      </label>`,
      )
      .join('')}
  </div>`;
}

function renderSelect(name, options, value, { required = false, empty = false } = {}) {
  return `<select name="${name}" class="form-input" ${required ? 'required' : ''}>
    ${empty ? '<option value="">선택</option>' : ''}
    ${options
      .map((o) => `<option value="${esc(o.value)}" ${value === o.value ? 'selected' : ''}>${esc(o.label)}</option>`)
      .join('')}
  </select>`;
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
  const tabs = [
    { key: 'all', label: '전체', count: counts.published + counts.draft + counts.hidden },
    { key: 'draft', label: '저장목록', count: counts.draft },
    { key: 'published', label: '공개중', count: counts.published },
    { key: 'hidden', label: '숨김', count: counts.hidden },
  ];

  const tabHtml = tabs
    .map(
      (t) =>
        `<a href="#${studentListTabPath(/** @type {any} */ (t.key))}" class="p19-tab${t.key === tab ? ' is-active' : ''}" data-p19-nav="${studentListTabPath(/** @type {any} */ (t.key))}">${esc(t.label)} <span class="p19-tab__count">${t.count}</span></a>`,
    )
    .join('');

  const cards =
    students.length === 0
      ? `<p class="mypage-empty">해당 상태의 자녀가 없습니다.</p>`
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
            <span class="p19-child-card__id">P19-02 관리</span>
          </a>`,
          )
          .join('')}
      </div>`;

  return `
    <section class="mypage-panel p19-panel">
      <p class="mypage-lead">19장 · <strong>자녀 카드</strong> · draft → 상세 → 공개 체험</p>
      <div class="p19-tabs" role="tablist">${tabHtml}</div>
      ${cards}
      <div class="p19-list-actions">
        <a href="${authStudentAddUrl()}" class="btn btn--secondary btn--sm" target="_blank" rel="noopener">+ 자녀 추가 (auth-ui basic-register)</a>
      </div>
      <p class="mypage-note">P19-01 · 첫 자녀=가입 시 auth-ui · 2명째+=기본등록 API 후 이 목록에 합류</p>
    </section>`;
}

/** @param {import('./store.js').StudentRecord} student */
function renderHubNav(student, activeSection) {
  return `
    <nav class="p19-hub-nav" aria-label="자녀 관리 메뉴">
      ${STUDENT_REG_MENUS.map((m) => {
        const href = studentSectionPath(student.id, /** @type {any} */ (m.key));
        const active = activeSection === m.key ? ' is-active' : '';
        return `<a href="#${href}" class="p19-hub-nav__link${active}" data-p19-nav="${href}">${esc(m.label)} <span class="p19-hub-nav__id">${m.screenId}</span></a>`;
      }).join('')}
      <a href="#${studentListTabPath('draft')}" class="p19-hub-nav__link p19-hub-nav__link--muted" data-p19-nav="${studentListTabPath('draft')}">저장목록</a>
      <a href="#${studentListTabPath('published')}" class="p19-hub-nav__link p19-hub-nav__link--muted" data-p19-nav="${studentListTabPath('published')}">공개중 관리</a>
    </nav>`;
}

/** @param {import('./store.js').StudentRecord} student */
function renderHub(student) {
  const readiness = getPublishReadiness(student);
  let nextCta = '희망 조건을 확인하세요.';
  if (student.exposure_status === 'draft' && readiness.canPublish) {
    nextCta = '미리보기 후 공개할 수 있습니다.';
  } else if (student.exposure_status === 'draft') {
    nextCta = `미완료: ${readiness.missing.slice(0, 3).join(', ')}${readiness.missing.length > 3 ? '…' : ''}`;
  } else if (student.exposure_status === 'published') {
    nextCta = '학생찾기에 노출 중입니다.';
  } else if (student.exposure_status === 'hidden') {
    nextCta = '노출 철회 상태 — 재공개 가능';
  }

  return `
    <section class="mypage-panel p19-panel">
      <div class="p19-hub-head">
        <a href="#/mypage/registrations/students" class="p19-back" data-p19-nav="/mypage/registrations/students">← 자녀 목록</a>
        <div class="p19-hub-head__title">
          <h2 class="p19-hub-head__name">${esc(student.public_display_name)}</h2>
          <span class="mypage-badge mypage-badge--${student.exposure_status}">${statusLabel(student.exposure_status)}</span>
        </div>
        <p class="p19-hub-head__cta">${esc(nextCta)}</p>
      </div>
      ${renderHubNav(student, 'hub')}
      <dl class="mypage-dl">
        <dt>요약</dt><dd>${esc(formatStudentSummaryLine(student))}</dd>
        <dt>지역</dt><dd>${esc(student.region_label || '—')}</dd>
        <dt>예산</dt><dd>${esc(labelBudget(student))}</dd>
        <dt>공개 준비</dt><dd>${readiness.canPublish ? '○ 공개 가능' : `△ ${esc(readiness.missing.join(', '))}`}</dd>
      </dl>
      <div class="p19-form-actions">
        <a href="#${studentSectionPath(student.id, 'basic')}" class="btn btn--primary btn--sm" data-p19-nav="${studentSectionPath(student.id, 'basic')}">기본등록</a>
        <a href="#${studentSectionPath(student.id, 'detail')}" class="btn btn--secondary btn--sm" data-p19-nav="${studentSectionPath(student.id, 'detail')}">상세등록</a>
        <a href="#${studentSectionPath(student.id, 'publish')}" class="btn btn--secondary btn--sm" data-p19-nav="${studentSectionPath(student.id, 'publish')}">미리보기·공개</a>
      </div>
      <div class="p19-danger-zone" data-p19-student-id="${student.id}">
        <p class="mypage-subhead">P19-06 숨김·삭제</p>
        <button type="button" class="btn btn--secondary btn--sm" data-p19-hide ${student.exposure_status === 'hidden' ? 'disabled' : ''}>노출 철회 (숨김)</button>
        <button type="button" class="btn btn--secondary btn--sm" data-p19-delete>삭제</button>
      </div>
    </section>`;
}

/** @param {import('./store.js').StudentRecord} student */
function renderBasicForm(student) {
  const isGroup = student.lesson_format === 'group';
  return `
    <section class="mypage-panel p19-panel">
      ${renderHubHeader(student)}
      ${renderHubNav(student, 'basic')}
      <p class="mypage-lead">14§4-1 · 19§5-1 기본등록 — 공개 전 필수</p>
      <form class="p19-form" data-p19-form="basic" data-p19-student-id="${student.id}">
        <label class="p19-field"><span>공개 표시명</span><input type="text" name="public_display_name" value="${esc(student.public_display_name)}" class="form-input" required /></label>
        <label class="p19-field"><span>희망 유형</span>${renderSelect('preferred_lesson_type', FORM_OPTIONS.lessonType, student.preferred_lesson_type, { required: true })}</label>
        <label class="p19-field"><span>희망 지역</span><input type="text" name="region_label" value="${esc(student.region_label || '')}" class="form-input" required /></label>
        <label class="p19-field"><span>지역 보조 메모</span><input type="text" name="preferred_region_note" value="${esc(student.preferred_region_note || '')}" class="form-input" /></label>
        <label class="p19-field"><span>희망 과목</span><input type="text" name="subject_label" value="${esc(student.subject_label || '')}" class="form-input" placeholder="예: 수학 · 영어" required /></label>
        <div class="p19-field-row">
          <label class="p19-field"><span>학교급</span>${renderSelect('school_level', FORM_OPTIONS.schoolLevel, student.school_level || 'middle')}</label>
          <label class="p19-field"><span>학년</span><input type="text" name="grade_level" value="${esc(student.grade_level)}" class="form-input" required /></label>
        </div>
        <div class="p19-field-row">
          <label class="p19-field"><span>학생 성별</span>${renderSelect('gender', [{ value: 'female', label: '여' }, { value: 'male', label: '남' }], student.gender, { required: true, empty: true })}</label>
          <label class="p19-field"><span>출생연도</span><input type="number" name="birth_year" value="${esc(student.birth_year || '')}" class="form-input" required /></label>
        </div>
        <div class="p19-field"><span>희망 수업장소</span>${renderCheckboxGroup('lesson_places', FORM_OPTIONS.lessonPlaces, student.lesson_places, { required: true })}</div>
        <label class="p19-field"><span>수업형태</span>${renderSelect('lesson_format', FORM_OPTIONS.lessonFormat, student.lesson_format || 'one_on_one', { required: true })}</label>
        <div class="p19-field ${isGroup ? '' : 'is-muted'}" data-p19-group-only>
          <span>그룹 구성 (그룹과외)</span>${renderSelect('student_gender_group', FORM_OPTIONS.genderGroup, student.student_gender_group || '', { empty: true })}</div>
        <label class="p19-field"><span>희망 수업인원</span>${renderSelect('preferred_student_count_group', FORM_OPTIONS.studentCount, student.preferred_student_count_group || 'solo', { required: true })}</label>
        <div class="p19-field-row">
          <label class="p19-field"><span>주 횟수</span><input type="number" name="lessons_per_week" min="1" max="7" value="${esc(student.lessons_per_week ?? 2)}" class="form-input" required /></label>
          <label class="p19-field"><span>1회 시간(분)</span><input type="number" name="minutes_per_lesson" step="10" value="${esc(student.minutes_per_lesson ?? 90)}" class="form-input" required /></label>
        </div>
        <div class="p19-field"><span>희망 강의스타일</span>${renderCheckboxGroup('teaching_style_badges', FORM_OPTIONS.teachingStyle, student.teaching_style_badges, { required: true })}</div>
        <div class="p19-field-row">
          <label class="p19-field"><span>수업예산 (과외)</span><input type="number" name="preferred_fee_amount" value="${esc(student.preferred_fee_amount ?? '')}" class="form-input" /></label>
          <label class="p19-field"><span>수업예산 (공부방)</span><input type="number" name="preferred_studyroom_fee_amount" value="${esc(student.preferred_studyroom_fee_amount ?? '')}" class="form-input" /></label>
        </div>
        <div class="p19-form-actions">
          <button type="submit" class="btn btn--primary">임시 저장 (draft)</button>
        </div>
      </form>
    </section>`;
}

/** @param {import('./store.js').StudentRecord} student */
function renderDetailForm(student) {
  return `
    <section class="mypage-panel p19-panel">
      ${renderHubHeader(student)}
      ${renderHubNav(student, 'detail')}
      <p class="mypage-lead">19§5-2 상세등록 · <code>preferred_tutor_gender</code>는 기본등록 아님 (13§5)</p>
      <form class="p19-form" data-p19-form="detail" data-p19-student-id="${student.id}">
        <label class="p19-field"><span>희망 과외쌤 성별</span>
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
        </label>
        <p class="mypage-note">요청문·visibility는 <a href="#${studentSectionPath(student.id, 'settings')}" data-p19-nav="${studentSectionPath(student.id, 'settings')}">공개설정 (P19-05)</a></p>
        <div class="p19-form-actions">
          <button type="submit" class="btn btn--primary">상세 저장</button>
          <a href="#${studentSectionPath(student.id, 'publish')}" class="btn btn--secondary" data-p19-nav="${studentSectionPath(student.id, 'publish')}">미리보기·공개</a>
        </div>
      </form>
    </section>`;
}

/** @param {import('./store.js').StudentRecord} student */
function renderSettings(student) {
  return `
    <section class="mypage-panel p19-panel">
      ${renderHubHeader(student)}
      ${renderHubNav(student, 'settings')}
      <p class="mypage-lead">19§6 · 13§8 · 18장 — 학부모 과금 없음 · <code>paid_only</code>=공급자 유료 열람</p>
      <form class="p19-form" data-p19-form="settings" data-p19-student-id="${student.id}">
        <label class="p19-field"><span>요청문</span><textarea name="request_summary" class="form-input" rows="3" placeholder="리스트 기본 미노출">${esc(student.request_summary || '')}</textarea></label>
        <label class="p19-field"><span>요청문 공개 (visibility)</span>${renderSelect('request_summary_visibility', FORM_OPTIONS.visibility, student.request_summary_visibility || 'private')}</label>
        <label class="p19-field"><span>특이요청</span><textarea name="special_request_note" class="form-input" rows="2">${esc(student.special_request_note || '')}</textarea></label>
        <label class="p19-field"><span>특이요청 공개</span>${renderSelect('special_request_visibility', FORM_OPTIONS.visibility, student.special_request_visibility || 'private')}</label>
        <div class="mypage-info-box p19-visibility-hint">
          <p><strong>private</strong> — 학생찾기 리스트·무료 공급자 상세에 미노출</p>
          <p><strong>paid_only</strong> — 유료 공급자만 열람 (포인트/월정액 · 18b)</p>
        </div>
        <div class="p19-form-actions">
          <button type="submit" class="btn btn--primary">저장</button>
        </div>
      </form>
    </section>`;
}

/** @param {import('./store.js').StudentRecord} student */
function renderPublish(student) {
  const r = getPublishReadiness(student);
  const row = studentToExposureRow(student);
  const preview = `
    <div class="p19-search-preview">
      <p class="p19-search-preview__label">13§7-4 학생찾기 행 (이미지 없음 · 비교 없음)</p>
      ${renderBrowseList('student', [row], { guest: false })}
    </div>`;

  const missingLinks = r.missing.map((m) => {
    if (m.includes('상세')) return `<li class="p19-checklist__miss">△ ${esc(m)} → <a href="#${studentSectionPath(student.id, 'detail')}" data-p19-nav="${studentSectionPath(student.id, 'detail')}">상세등록</a></li>`;
    return `<li class="p19-checklist__miss">△ ${esc(m)} → <a href="#${studentSectionPath(student.id, 'basic')}" data-p19-nav="${studentSectionPath(student.id, 'basic')}">기본등록</a></li>`;
  });

  return `
    <section class="mypage-panel p19-panel">
      ${renderHubHeader(student)}
      ${renderHubNav(student, 'publish')}
      <h3 class="mypage-subhead">학생찾기 미리보기</h3>
      ${preview}
      <dl class="mypage-dl p19-preview-meta">
        <dt>장소</dt><dd>${esc(labelPlaces(student.lesson_places))}</dd>
        <dt>수업인원</dt><dd>${esc(labelLessonTarget(student))}</dd>
        <dt>스타일</dt><dd>${esc(labelTeachingStyles(student.teaching_style_badges))}</dd>
        <dt>요청문 노출</dt><dd>${student.request_summary_visibility === 'paid_only' ? '유료 공급자만' : '비공개'}</dd>
      </dl>
      <ul class="p19-checklist">
        ${r.missing.length ? missingLinks.join('') : '<li class="p19-checklist__ok">○ 기본+상세 필수 항목 충족 — 공개 가능</li>'}
      </ul>
      <div class="p19-form-actions" data-p19-student-id="${student.id}">
        <button type="button" class="btn btn--primary" data-p19-publish ${r.canPublish ? '' : 'disabled'}>공개하기 (published)</button>
        ${student.exposure_status === 'hidden' ? '<button type="button" class="btn btn--secondary" data-p19-publish>재공개</button>' : ''}
      </div>
      <p class="mypage-note">P19-04 · 공급자 메모 버튼은 16·18장 (유료 게이트)</p>
    </section>`;
}

/** @param {import('./store.js').StudentRecord} student */
function renderHubHeader(student) {
  return `
    <div class="p19-hub-head p19-hub-head--compact">
      <a href="#${studentHubPath(student.id)}" class="p19-back" data-p19-nav="${studentHubPath(student.id)}">← ${esc(student.public_display_name)}</a>
      <span class="mypage-badge mypage-badge--${student.exposure_status}">${statusLabel(student.exposure_status)}</span>
    </div>`;
}

/** @param {HTMLElement} root @param {() => void} rerender */
export function bindStudentRegEvents(root, rerender) {
  root.querySelectorAll('[data-p19-nav]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.hash = el.getAttribute('data-p19-nav') || '/mypage/registrations/students';
    });
  });

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

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = Number(form.dataset.p19StudentId);
      const patch = parseStudentForm(form);
      updateStudent(id, patch);
      rerender();
    });
  });

  root.querySelectorAll('[data-p19-publish]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const wrap = btn.closest('[data-p19-student-id]');
      const id = Number(wrap?.dataset.p19StudentId);
      const result = publishStudent(id);
      if (!result.ok) {
        alert(`공개 불가:\n${result.missing?.join('\n') || result.reason}`);
        return;
      }
      alert('공개되었습니다. (published)');
      rerender();
    });
  });

  root.querySelectorAll('[data-p19-hide]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = Number(btn.closest('[data-p19-student-id]')?.dataset.p19StudentId);
      if (!confirm('노출을 철회(숨김)하시겠습니까?')) return;
      hideStudent(id);
      rerender();
    });
  });

  root.querySelectorAll('[data-p19-delete]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = Number(btn.closest('[data-p19-student-id]')?.dataset.p19StudentId);
      if (!confirm('삭제하시겠습니까? (deleted)')) return;
      deleteStudent(id);
      window.location.hash = '/mypage/registrations/students';
      rerender();
    });
  });
}
