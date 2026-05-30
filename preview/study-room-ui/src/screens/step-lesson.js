import { registerState, SCHOOL_LEVELS, emptySubject } from '../state.js';
import {
  renderRegisterShell,
  renderSectionTitle,
  renderNavButtons,
  bindGlobalEvents,
  bindFormNav,
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
      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="capacity_per_time">1타임 인원</label>
          <span class="field-db-name">capacity_per_time</span>
          <input class="form-input" id="capacity_per_time" name="capacity_per_time" value="${s.capacity_per_time}" />
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
  bindFormNav(root, '/register/location', '/register/career');

  root.querySelector('[data-action="add-subject"]')?.addEventListener('click', () => {
    registerState.subjects.push(emptySubject());
    window.dispatchEvent(new Event('hashchange'));
  });
}
