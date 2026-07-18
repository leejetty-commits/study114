import { registerState, SCHOOL_LEVELS, LESSON_OPERATION_TYPES, CAPACITY_PER_TIME_OPTIONS, emptySubject } from '../state.js';
import { syncLessonFromForm } from '../form-collect.js';
import { saveAndNavigate, withSaving } from '../save-flow.js';
import {
  renderRegisterShell,
  renderSectionTitle,
  renderNavButtons,
  bindGlobalEvents,
  bindFormNav,
  navigate,
} from '../layout.js';

function renderSubjectRow(sub, idx) {
  const levelOpts = SCHOOL_LEVELS.map(
    (l) =>
      `<option value="${l.value}" ${sub.school_level === l.value ? 'selected' : ''}>${l.label}</option>`
  ).join('');
  return `
    <div class="register-subject-row" data-subject-idx="${idx}">
      <div class="form-group">
        <label class="form-label">학교급</label>
        <select class="form-input" data-field="school_level">${levelOpts}</select>
      </div>
      <div class="form-group">
        <label class="form-label">학년대</label>
        <span class="field-db-name">grade_band</span>
        <input class="form-input" data-field="grade_band" value="${sub.grade_band}" placeholder="예: 중1~2" />
      </div>
      <div class="form-group">
        <label class="form-label">과목 마스터 ID</label>
        <span class="field-db-name">subject_master_id</span>
        <input class="form-input" data-field="subject_master_id" value="${sub.subject_master_id || ''}" placeholder="003 subject_masters" />
      </div>
      <div class="form-group">
        <label class="form-label">과목</label>
        <span class="field-db-name">subject_name</span>
        <input class="form-input" data-field="subject_name" value="${sub.subject_name}" />
      </div>
      <label class="form-check">
        <input class="form-check__input" type="checkbox" data-field="is_main" ${sub.is_main ? 'checked' : ''} />
        <span class="form-check__label">주력</span>
      </label>
    </div>
  `;
}

export function renderLesson() {
  const s = registerState;
  const content = `
    <form data-form="lesson">
      ${renderSectionTitle('수업 정보')}
      <div class="form-group">
        <label class="form-label">수업운영형태</label>
        <span class="field-db-name">lesson_operation_type</span>
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
      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="capacity_per_time">타임별 원생수</label>
          <span class="field-db-name">capacity_per_time</span>
          <select class="form-input" id="capacity_per_time" name="capacity_per_time">
            ${CAPACITY_PER_TIME_OPTIONS.map(
              (o) =>
                `<option value="${o.value}" ${s.capacity_per_time === o.value ? 'selected' : ''}>${o.label}</option>`,
            ).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="recruitment_count">모집 인원</label>
          <span class="field-db-name">recruitment_count</span>
          <input class="form-input" type="number" id="recruitment_count" name="recruitment_count" value="${s.recruitment_count}" />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label" for="main_subject_note">주력과목 요약</label>
        <span class="field-db-name">main_subject_note</span>
        <input class="form-input" id="main_subject_note" name="main_subject_note" value="${s.main_subject_note}" />
        <p class="form-note">기본등록 seed와 같은 최종 필드입니다.</p>
      </div>
      <div class="form-group">
        <label class="form-label" for="teaching_style">지도 스타일</label>
        <span class="field-db-name">teaching_style</span>
        <input class="form-input" id="teaching_style" name="teaching_style" value="${s.teaching_style}" />
      </div>
      <div class="form-row">
        <label class="form-check">
          <input class="form-check__input" type="checkbox" name="weekend_available" ${s.weekend_available ? 'checked' : ''} />
          <span class="form-check__label">주말 가능</span>
          <span class="field-db-name">weekend_available</span>
        </label>
        <label class="form-check">
          <input class="form-check__input" type="checkbox" name="one_on_one_available" ${s.one_on_one_available ? 'checked' : ''} />
          <span class="form-check__label">1:1 가능</span>
          <span class="field-db-name">one_on_one_available</span>
        </label>
      </div>

      ${renderSectionTitle('대상 · 과목')}
      <p class="register-hint mb-4">study_room_subject_targets · 행 추가는 API 연동 시</p>
      <div data-subjects-list>
        ${s.subjects.map((sub, i) => renderSubjectRow(sub, i)).join('')}
      </div>
      <button type="button" class="btn btn--secondary btn--sm mt-4" data-action="add-subject">+ 과목 추가</button>

      ${renderSectionTitle('가격')}
      <div class="form-group">
        <label class="form-label form-label--required" for="price_amount">월 대표 금액 (원)</label>
        <span class="field-db-name">price_amount</span>
        <input class="form-input" type="number" id="price_amount" name="price_amount" value="${s.price_amount}" placeholder="350000" />
        <p class="register-hint">검색·정렬·비교용 대표값 (5장 §11-2)</p>
      </div>
      <div class="form-group">
        <label class="form-label" for="price_description">가격 설명</label>
        <span class="field-db-name">price_description</span>
        <textarea class="form-input form-textarea" id="price_description" name="price_description" rows="3">${s.price_description}</textarea>
      </div>

      ${renderNavButtons('/register/location', '다음: 경력·특징')}
    </form>
  `;
  return renderRegisterShell(content, {
    step: 3,
    title: '수업 · 대상 · 가격',
    subtitle: '숫자형 + 설명형 가격 (5장 §10)',
  });
}

export function bindLessonEvents(root) {
  bindGlobalEvents(root);
  const nextBtn = root.querySelector('[data-action="next"]');
  const prevBtn = root.querySelector('[data-action="prev"]');
  prevBtn?.addEventListener('click', () => navigate('/register/location'));
  nextBtn?.addEventListener('click', () => {
    withSaving(nextBtn, async () => {
      syncLessonFromForm(root.querySelector('[data-form="lesson"]'), registerState);
      await saveAndNavigate(registerState, 'lesson', '/register/career');
    });
  });

  root.querySelector('[data-action="add-subject"]')?.addEventListener('click', () => {
    registerState.subjects.push(emptySubject());
    window.dispatchEvent(new Event('hashchange'));
  });
}
