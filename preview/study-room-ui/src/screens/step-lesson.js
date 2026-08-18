import {
  registerState,
  SCHOOL_LEVELS,
  GRADE_OPTIONS,
  WEEKDAY_OPTIONS,
  TEACHING_STYLE_OPTIONS,
  LESSON_OPERATION_TYPES,
  CAPACITY_PER_TIME_OPTIONS,
  DAILY_LESSON_MINUTES,
  WEEKLY_LESSON_COUNTS,
  emptyClass,
  getSubjectOptions,
} from '../state.js';
import { syncLessonFromForm } from '../form-collect.js';
import { saveAndNavigate, saveCurrentStep, withSaving } from '../save-flow.js';
import {
  renderRegisterShell,
  renderSectionTitle,
  renderDetailStepNav,
  bindGlobalEvents,
  navigate,
  basicOverviewPath,
} from '../layout.js';
import { MAIN_SUBJECT_OPTIONS } from '../../../shared/main-subjects.js';
import { renderPromoPhotoGrid, promoPhotoHint, bindPromoPhotos, syncPromoPhotoMeta } from '../promo-photos.js';

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
}

function starLabel(forId, text) {
  const forAttr = forId ? ` for="${forId}"` : '';
  return `<label class="form-label form-label--required"${forAttr}>${text}</label>`;
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

function renderSelectOptions(list, selected, placeholder) {
  const value = String(selected || '');
  const known = list.some((o) => o.value === value);
  return [
    `<option value="">${placeholder}</option>`,
    ...list.map(
      (o) =>
        `<option value="${esc(o.value)}" ${value === o.value ? 'selected' : ''}>${esc(o.label)}</option>`,
    ),
    !known && value ? `<option value="${esc(value)}" selected>${esc(value)}</option>` : '',
  ].join('');
}

function renderWeekdayChecks(selected, fieldName) {
  const set = new Set((selected || []).map(String));
  return WEEKDAY_OPTIONS.map(
    (d) => `
      <label class="form-check">
        <input class="form-check__input" type="checkbox" data-field="${fieldName}" value="${d.value}" ${set.has(d.value) ? 'checked' : ''} />
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

function renderClassCard(row, idx, total) {
  const known = lessonSubjectOptions().some((o) => o.value === row.subject_name);
  const selectVal = known ? row.subject_name : '';
  const customVal = known ? row.subject_custom || '' : row.subject_custom || row.subject_name || '';
  return `
    <article class="register-class-card" data-class-idx="${idx}">
      <div class="register-class-card__head">
        <h3 class="register-class-card__title">수업 ${idx + 1}</h3>
        ${
          total > 1
            ? `<button type="button" class="btn btn--ghost btn--sm" data-action="remove-class" data-idx="${idx}">수업 삭제</button>`
            : ''
        }
      </div>
      <div class="form-group">
        <label class="form-label">수업명</label>
        <input class="form-input" data-field="class_name" value="${esc(row.class_name)}" placeholder="예: 중등 수학 정규" />
      </div>
      <div class="register-grid-2">
        <div class="form-group">
          <label class="form-label">대상</label>
          <select class="form-input" data-field="school_level">
            ${renderSelectOptions(SCHOOL_LEVELS, row.school_level, '대상 선택')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">학년</label>
          <select class="form-input" data-field="grade_band">
            ${renderSelectOptions(GRADE_OPTIONS, row.grade_band, '학년 선택')}
          </select>
        </div>
      </div>
      <div class="register-grid-2">
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
      </div>
      <div class="form-group">
        <span class="form-label">출석요일</span>
        <div class="register-weekday-row">${renderWeekdayChecks(row.attendance_days, 'attendance_days')}</div>
      </div>
      <div class="register-grid-2">
        <div class="form-group">
          <label class="form-label">주횟수</label>
          <select class="form-input" data-field="lessons_per_week">
            ${renderSelectOptions(WEEKLY_LESSON_COUNTS, row.lessons_per_week, '선택')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">월 수업료</label>
          <input class="form-input" data-field="monthly_fee" value="${esc(row.monthly_fee)}" placeholder="예: 35만원" />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">수업료 설명</label>
        <input class="form-input" data-field="fee_note" value="${esc(row.fee_note)}" placeholder="예: 주 2회 기준" />
      </div>
      <div class="form-group">
        <label class="form-label">수업 참고사항</label>
        <textarea class="form-input form-textarea" data-field="lesson_note" rows="3" placeholder="이 수업에 대해 학부모에게 알리고 싶은 내용을 적어 주세요.">${esc(row.lesson_note)}</textarea>
      </div>
    </article>
  `;
}

/** 픽·프라임 카드 항목은 *만. 저장·공개는 막지 않는다. */
export function lessonSaveGuard() {
  return '';
}

export function renderLesson() {
  const s = registerState;
  const classes = Array.isArray(s.classes) && s.classes.length ? s.classes : [emptyClass()];
  const content = `
    <form data-form="lesson">
      ${renderSectionTitle('공부방·교습소 소개')}
      <div class="form-group">
        ${starLabel('', '수업운영방식')}
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
      <div class="register-grid-3">
        <div class="form-group">
          ${starLabel('capacity_per_time', '타임별 원생수')}
          <select class="form-input" id="capacity_per_time" name="capacity_per_time">
            <option value="">선택</option>
            ${CAPACITY_PER_TIME_OPTIONS.map(
              (o) =>
                `<option value="${o.value}" ${s.capacity_per_time === o.value ? 'selected' : ''}>${o.label}</option>`,
            ).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="minutes_per_lesson">1일 평균 수업시간</label>
          <select class="form-input" id="minutes_per_lesson" name="minutes_per_lesson">
            ${renderSelectOptions(DAILY_LESSON_MINUTES, s.minutes_per_lesson, '선택')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="lessons_per_week">주당 평균 수업회수</label>
          <select class="form-input" id="lessons_per_week" name="lessons_per_week">
            ${renderSelectOptions(WEEKLY_LESSON_COUNTS, s.lessons_per_week, '선택')}
          </select>
        </div>
      </div>
      <div class="register-grid-3">
        <div class="form-group">
          ${starLabel('monthly_fee_manwon', '월 평균 수업료')}
          <div class="register-fee-manwon">
            <input class="form-input" id="monthly_fee_manwon" name="monthly_fee_manwon" value="${esc(s.monthly_fee_manwon)}" placeholder="숫자" inputmode="decimal" />
            <span class="register-fee-manwon__unit">만원</span>
          </div>
        </div>
        <div class="form-group">
          <span class="form-label">결제</span>
          <div class="form-row">
            <label class="form-check">
              <input class="form-check__input" type="checkbox" name="card_payment_available" ${s.card_payment_available ? 'checked' : ''} />
              <span class="form-check__label">카드결제 여부</span>
            </label>
            <label class="form-check">
              <input class="form-check__input" type="checkbox" name="cash_receipt_available" ${s.cash_receipt_available ? 'checked' : ''} />
              <span class="form-check__label">현금영수증 여부</span>
            </label>
          </div>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">지도 스타일</label>
        <div class="register-check-grid">${renderStyleChecks(s.teaching_style_ids)}</div>
      </div>
      <div class="form-group">
        <label class="form-label" for="teaching_style_note">지도 스타일 추가설명</label>
        <textarea class="form-input form-textarea" id="teaching_style_note" name="teaching_style_note" rows="2" placeholder="추가로 전하고 싶은 지도 방식을 적어 주세요.">${esc(s.teaching_style_note)}</textarea>
      </div>
      <div class="form-group">
        <span class="form-label">추가</span>
        <div class="form-row">
          <label class="form-check">
            <input class="form-check__input" type="checkbox" name="weekend_available" ${s.weekend_available ? 'checked' : ''} />
            <span class="form-check__label">주말 가능</span>
          </label>
          <label class="form-check">
            <input class="form-check__input" type="checkbox" name="correction_available" ${s.correction_available ? 'checked' : ''} />
            <span class="form-check__label">첨삭식</span>
          </label>
          <label class="form-check">
            <input class="form-check__input" type="checkbox" name="one_on_one_available" ${s.one_on_one_available ? 'checked' : ''} />
            <span class="form-check__label">1:1 가능</span>
          </label>
        </div>
      </div>
      <div class="form-group">
        ${starLabel('intro_short', '한 줄 소개')}
        <input class="form-input" id="intro_short" name="intro_short" maxlength="80" value="${esc(s.intro_short)}" placeholder="프라임 카드에 보이는 한 줄입니다." />
      </div>
      <div class="form-group">
        <label class="form-label" for="intro_long">공부방·교습소 소개와 자랑</label>
        <textarea class="form-input form-textarea register-intro-long" id="intro_long" name="intro_long" rows="8" placeholder="공부방·교습소를 소개하고 자랑해 주세요.">${esc(s.intro_long)}</textarea>
      </div>

      ${starLabel('', '홍보사진')}
      <p class="register-hint">${promoPhotoHint()}</p>
      ${renderPromoPhotoGrid()}

      ${renderSectionTitle('수업상세')}
      <p class="register-hint mb-4">수업 하나를 하나의 그룹으로 적습니다. 「수업 추가」로 아래로 늘릴 수 있습니다.</p>
      <div data-classes-list>
        ${classes.map((row, i) => renderClassCard(row, i, classes.length)).join('')}
      </div>
      <button type="button" class="btn btn--secondary btn--sm register-add-btn" data-action="add-class">수업 추가</button>

      ${renderDetailStepNav({
        prevPath: '/register/basic',
        nextLabel: '다음: 경력·시설',
        nextEnabled: true,
      })}
    </form>
  `;
  return renderRegisterShell(content, {
    stepKey: 'lesson',
    title: '공부방·교습소 상세',
    subtitle: '필수정보는 입력을 꼭 해주세요',
  });
}

function persistForm(form) {
  if (form) {
    syncLessonFromForm(form, registerState);
    syncPromoPhotoMeta(form);
  }
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

  saveBtn?.addEventListener('click', () => {
    withSaving(saveBtn, async () => {
      persistForm(form);
      await saveCurrentStep(registerState, 'lesson');
      registerState.detailLessonSaved = true;
      alert('저장되었습니다.');
      window.dispatchEvent(new Event('hashchange'));
    });
  });

  nextBtn?.addEventListener('click', () => {
    withSaving(nextBtn, async () => {
      persistForm(form);
      await saveAndNavigate(registerState, 'lesson', '/register/facility');
      registerState.detailLessonSaved = true;
    });
  });

  root.querySelector('[data-action="add-class"]')?.addEventListener('click', () => {
    persistForm(form);
    if (!Array.isArray(registerState.classes)) registerState.classes = [];
    registerState.classes.push(emptyClass());
    window.dispatchEvent(new Event('hashchange'));
  });

  root.querySelectorAll('[data-action="remove-class"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      persistForm(form);
      const idx = Number(btn.getAttribute('data-idx'));
      registerState.classes.splice(idx, 1);
      if (!registerState.classes.length) registerState.classes.push(emptyClass());
      window.dispatchEvent(new Event('hashchange'));
    });
  });

  bindPromoPhotos(root, {
    persistBeforeUpload: async () => {
      persistForm(form);
      await saveCurrentStep(registerState, 'lesson');
    },
  });
}
