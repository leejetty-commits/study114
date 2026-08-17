import {
  registerState,
  SCHOOL_LEVELS,
  GRADE_OPTIONS,
  WEEKDAY_OPTIONS,
  TEACHING_STYLE_OPTIONS,
  LESSON_OPERATION_TYPES,
  CAPACITY_PER_TIME_OPTIONS,
  emptySubject,
  emptyPriceItem,
  getSubjectOptions,
} from '../state.js';
import { syncLessonFromForm } from '../form-collect.js';
import { saveAndNavigate, saveCurrentStep, withSaving } from '../save-flow.js';
import {
  renderRegisterShell,
  renderSectionTitle,
  renderDetailStepNav,
  renderGuideNotice,
  bindGlobalEvents,
  navigate,
  skipToSummary,
  basicOverviewPath,
} from '../layout.js';
import { MAIN_SUBJECT_OPTIONS, renderMainSubjectSelect } from '../../../shared/main-subjects.js';

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
}

function lessonSubjectOptions() {
  const fromDb = getSubjectOptions();
  return fromDb.length ? fromDb : MAIN_SUBJECT_OPTIONS;
}

function renderSubjectSelect(selected) {
  const value = String(selected || '').trim();
  const opts = lessonSubjectOptions();
  const known = opts.some((o) => o.value === value);
  return [
    '<option value="">과목 선택</option>',
    ...opts.map(
      (o) =>
        `<option value="${esc(o.value)}" ${value === o.value ? 'selected' : ''}>${esc(o.label)}</option>`,
    ),
    !known && value ? `<option value="${esc(value)}" selected>${esc(value)}</option>` : '',
  ].join('');
}

function renderSubjectRow(sub, idx) {
  const known = lessonSubjectOptions().some((o) => o.value === sub.subject_name);
  const selectVal = known ? sub.subject_name : '';
  const customVal = known ? sub.subject_custom || '' : sub.subject_custom || sub.subject_name || '';
  const levelOpts = [
    `<option value="">학교급 선택</option>`,
    ...SCHOOL_LEVELS.map(
      (l) =>
        `<option value="${l.value}" ${sub.school_level === l.value ? 'selected' : ''}>${l.label}</option>`,
    ),
  ].join('');
  const gradeOpts = [
    `<option value="">학년 선택</option>`,
    ...GRADE_OPTIONS.map(
      (g) =>
        `<option value="${esc(g.value)}" ${sub.grade_band === g.value ? 'selected' : ''}>${g.label}</option>`,
    ),
    !GRADE_OPTIONS.some((g) => g.value === sub.grade_band) && sub.grade_band
      ? `<option value="${esc(sub.grade_band)}" selected>${esc(sub.grade_band)}</option>`
      : '',
  ].join('');
  return `
    <div class="register-subject-row" data-subject-idx="${idx}">
      <div class="form-group">
        <label class="form-label">학교급</label>
        <select class="form-input" data-field="school_level">${levelOpts}</select>
      </div>
      <div class="form-group">
        <label class="form-label">학년</label>
        <select class="form-input" data-field="grade_band">${gradeOpts}</select>
      </div>
      <div class="form-group">
        <label class="form-label">과목</label>
        <select class="form-input" data-field="subject_select">
          ${renderSubjectSelect(selectVal)}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">과목 직접입력</label>
        <input class="form-input" data-field="subject_custom" value="${esc(customVal)}" placeholder="목록에 없으면 직접 입력" />
      </div>
      <label class="form-check">
        <input class="form-check__input" type="checkbox" data-field="is_main" ${sub.is_main ? 'checked' : ''} />
        <span class="form-check__label">주력</span>
      </label>
      <button type="button" class="btn btn--ghost btn--sm" data-action="remove-subject" data-idx="${idx}">과목 삭제</button>
    </div>
  `;
}

function renderPriceRow(row, idx) {
  return `
    <div class="register-price-row" data-price-idx="${idx}">
      <div class="form-group">
        <label class="form-label">수업내역</label>
        <input class="form-input" data-field="price_item" value="${esc(row.item)}" placeholder="예: 중등 수학" />
      </div>
      <div class="form-group">
        <label class="form-label">월 수업료</label>
        <input class="form-input" data-field="price_fee" value="${esc(row.fee)}" placeholder="예: 35만원" />
      </div>
      <div class="form-group">
        <label class="form-label">수업료 설명</label>
        <input class="form-input" data-field="price_note" value="${esc(row.note)}" placeholder="예: 주 2회 기준" />
      </div>
      <button type="button" class="btn btn--ghost btn--sm" data-action="remove-price" data-idx="${idx}">삭제</button>
    </div>
  `;
}

function renderWeekdayChecks(selected) {
  const set = new Set((selected || []).map(String));
  return WEEKDAY_OPTIONS.map(
    (d) => `
      <label class="form-check">
        <input class="form-check__input" type="checkbox" name="attendance_days" value="${d.value}" ${set.has(d.value) ? 'checked' : ''} />
        <span class="form-check__label">${d.label}</span>
      </label>`,
  ).join('');
}

function renderStyleChecks(selected) {
  const set = new Set((selected || []).map(String));
  return TEACHING_STYLE_OPTIONS.map(
    (s) => `
      <label class="form-check">
        <input class="form-check__input" type="checkbox" name="teaching_style_ids" value="${s.id}" ${set.has(s.id) ? 'checked' : ''} />
        <span class="form-check__label">${s.label}</span>
      </label>`,
  ).join('');
}

export function lessonSaveGuard() {
  if (!String(registerState.lesson_operation_type || '').trim()) {
    return '수업운영형태를 선택해 주세요.';
  }
  if (!String(registerState.capacity_per_time || '').trim()) {
    return '타임별 원생수를 선택해 주세요.';
  }
  if (!String(registerState.main_subject_note || '').trim()) {
    return '주력과목을 선택해 주세요.';
  }
  const named = (registerState.subjects || []).filter((s) => String(s.subject_name || '').trim());
  if (!named.length) {
    return '대상 과목을 1개 이상 입력해 주세요.';
  }
  if (named.some((s) => !String(s.school_level || '').trim())) {
    return '대상 과목의 학교급을 선택해 주세요.';
  }
  const hasPrice = (registerState.price_items || []).some(
    (p) => String(p.item || '').trim() || String(p.fee || '').trim(),
  );
  if (!hasPrice && !Number(registerState.price_amount)) {
    return '가격 항목을 1개 이상 입력해 주세요.';
  }
  return '';
}

export function renderLesson() {
  const s = registerState;
  const subjects = s.subjects.length ? s.subjects : [emptySubject()];
  const prices = s.price_items?.length ? s.price_items : [emptyPriceItem()];
  const nextEnabled = true;
  const content = `
    <form data-form="lesson">
      ${renderGuideNotice('상세정보 1단계입니다. 수업·가격을 채운 뒤 다음으로 진행하세요. 지금은 건너뛰고 마이페이지에서 이어서 해도 됩니다.')}
      ${renderSectionTitle('수업 정보')}
      <div class="form-group">
        <label class="form-label">수업운영형태</label>
        <div class="form-radio-group" role="radiogroup">
          ${LESSON_OPERATION_TYPES.map(
            (t) => `
          <label class="form-radio">
            <input type="radio" name="lesson_operation_type" value="${t.value}" ${s.lesson_operation_type === t.value ? 'checked' : ''} />
            <span class="form-radio__label">${t.label}</span>
          </label>`,
          ).join('')}
        </div>
      </div>
      <div class="register-grid-2">
        <div class="form-group">
          <label class="form-label" for="capacity_per_time">타임별 원생수</label>
          <select class="form-input" id="capacity_per_time" name="capacity_per_time">
            <option value="">선택</option>
            ${CAPACITY_PER_TIME_OPTIONS.map(
              (o) =>
                `<option value="${o.value}" ${s.capacity_per_time === o.value ? 'selected' : ''}>${o.label}</option>`,
            ).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="recruitment_count">모집 인원</label>
          <input class="form-input" type="number" id="recruitment_count" name="recruitment_count" value="${esc(s.recruitment_count)}" />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label" for="main_subject_note">주력과목</label>
        <select class="form-input" id="main_subject_note" name="main_subject_note">
          ${renderMainSubjectSelect(s.main_subject_note)}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">지도 스타일</label>
        <div class="register-check-grid">${renderStyleChecks(s.teaching_style_ids)}</div>
      </div>
      <div class="form-group">
        <label class="form-label" for="teaching_style_note">지도 스타일 설명</label>
        <textarea class="form-input form-textarea" id="teaching_style_note" name="teaching_style_note" rows="2" placeholder="추가로 전하고 싶은 지도 방식을 적어 주세요.">${esc(s.teaching_style_note)}</textarea>
      </div>
      <div class="form-row">
        <label class="form-check">
          <input class="form-check__input" type="checkbox" name="weekend_available" ${s.weekend_available ? 'checked' : ''} />
          <span class="form-check__label">주말 가능</span>
        </label>
        <label class="form-check">
          <input class="form-check__input" type="checkbox" name="one_on_one_available" ${s.one_on_one_available ? 'checked' : ''} />
          <span class="form-check__label">1:1 가능</span>
        </label>
      </div>

      ${renderSectionTitle('대상 · 과목')}
      <p class="register-hint mb-4">과목을 추가하거나 행에서 삭제할 수 있습니다. 학년은 하나만 선택합니다.</p>
      <div data-subjects-list>
        ${subjects.map((sub, i) => renderSubjectRow(sub, i)).join('')}
      </div>
      <button type="button" class="btn btn--secondary btn--sm mt-4" data-action="add-subject">+ 과목 추가</button>

      <div class="register-grid-2 register-schedule-price">
        <section class="register-pane">
          ${renderSectionTitle('수업 요일')}
          <div class="form-group">
            <span class="form-label">출석일</span>
            <div class="register-weekday-row">${renderWeekdayChecks(s.attendance_days)}</div>
          </div>
          <div class="form-group">
            <span class="form-label">주횟수</span>
            <div class="register-inline-fields">
              <span>주</span>
              <input class="form-input register-inline-fields__num" type="number" min="1" name="lessons_per_week" value="${esc(s.lessons_per_week)}" />
              <span>일,</span>
              <span>1일</span>
              <input class="form-input register-inline-fields__num" type="number" min="1" name="minutes_per_lesson" value="${esc(s.minutes_per_lesson)}" />
              <span>분 수업</span>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label" for="lesson_note">수업참고사항</label>
            <textarea class="form-input form-textarea" id="lesson_note" name="lesson_note" rows="4" placeholder="수업 운영과 관련해 학부모에게 알리고 싶은 내용을 적어 주세요.">${esc(s.lesson_note)}</textarea>
          </div>
        </section>
        <section class="register-pane">
          ${renderSectionTitle('가격')}
          <div data-price-list>
            ${prices.map((row, i) => renderPriceRow(row, i)).join('')}
          </div>
          <button type="button" class="btn btn--secondary btn--sm mt-4" data-action="add-price">+ 가격 항목 추가</button>
        </section>
      </div>

      ${renderDetailStepNav({
        prevPath: '/register/basic',
        nextLabel: '다음: 경력·시설',
        nextEnabled,
      })}
    </form>
  `;
  return renderRegisterShell(content, {
    stepKey: 'lesson',
    title: '수업 · 가격',
    subtitle: '상세정보 1/2 · 학생·학부모에게 보이는 수업 정보를 적어 주세요.',
  });
}

function persistForm(form) {
  if (form) syncLessonFromForm(form, registerState);
}

export function bindLessonEvents(root) {
  bindGlobalEvents(root);
  const form = root.querySelector('[data-form="lesson"]');
  const nextBtn = root.querySelector('[data-action="next"]');
  const prevBtn = root.querySelector('[data-action="prev"]');
  const saveBtn = root.querySelector('[data-action="save"]');

  const refreshNext = () => {
    persistForm(form);
  };

  form?.addEventListener('input', refreshNext);
  form?.addEventListener('change', refreshNext);
  refreshNext();

  prevBtn?.addEventListener('click', () => navigate(basicOverviewPath()));
  root.querySelector('[data-action="skip-detail"]')?.addEventListener('click', () => skipToSummary());

  saveBtn?.addEventListener('click', () => {
    withSaving(saveBtn, async () => {
      persistForm(form);
      const missing = lessonSaveGuard();
      if (missing) throw new Error(missing);
      await saveCurrentStep(registerState, 'lesson');
      registerState.detailLessonSaved = true;
      alert('저장되었습니다.');
      window.dispatchEvent(new Event('hashchange'));
    });
  });

  nextBtn?.addEventListener('click', () => {
    withSaving(nextBtn, async () => {
      persistForm(form);
      const missing = lessonSaveGuard();
      if (missing) throw new Error(missing);
      await saveAndNavigate(registerState, 'lesson', '/register/facility');
      registerState.detailLessonSaved = true;
    });
  });

  root.querySelector('[data-action="add-subject"]')?.addEventListener('click', () => {
    persistForm(form);
    registerState.subjects.push(emptySubject());
    window.dispatchEvent(new Event('hashchange'));
  });

  root.querySelectorAll('[data-action="remove-subject"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      persistForm(form);
      const idx = Number(btn.getAttribute('data-idx'));
      registerState.subjects.splice(idx, 1);
      window.dispatchEvent(new Event('hashchange'));
    });
  });

  root.querySelector('[data-action="add-price"]')?.addEventListener('click', () => {
    persistForm(form);
    if (!Array.isArray(registerState.price_items)) registerState.price_items = [];
    registerState.price_items.push(emptyPriceItem());
    window.dispatchEvent(new Event('hashchange'));
  });

  root.querySelectorAll('[data-action="remove-price"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      persistForm(form);
      const idx = Number(btn.getAttribute('data-idx'));
      registerState.price_items.splice(idx, 1);
      window.dispatchEvent(new Event('hashchange'));
    });
  });
}
