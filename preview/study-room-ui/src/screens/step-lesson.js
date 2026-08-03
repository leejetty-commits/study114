import { registerState, SCHOOL_LEVELS, LESSON_OPERATION_TYPES, CAPACITY_PER_TIME_OPTIONS, emptySubject } from '../state.js';
import { syncLessonFromForm, syncCareerFromForm } from '../form-collect.js';
import { saveAndNavigate, withSaving } from '../save-flow.js';
import {
  renderRegisterShell,
  renderSectionTitle,
  renderNavButtons,
  renderGuideNotice,
  mypageRegistrationsUrl,
  bindGlobalEvents,
  navigate,
} from '../layout.js';
import { renderMainSubjectSelect } from '../../../shared/main-subjects.js';

function renderSubjectRow(sub, idx) {
  const levelOpts = SCHOOL_LEVELS.map(
    (l) =>
      `<option value="${l.value}" ${sub.school_level === l.value ? 'selected' : ''}>${l.label}</option>`,
  ).join('');
  return `
    <div class="register-subject-row" data-subject-idx="${idx}">
      <div class="form-group">
        <label class="form-label">학교급</label>
        <select class="form-input" data-field="school_level">${levelOpts}</select>
      </div>
      <div class="form-group">
        <label class="form-label">학년대</label>
        <input class="form-input" data-field="grade_band" value="${sub.grade_band}" placeholder="예: 중1~2" />
      </div>
      <div class="form-group">
        <label class="form-label">과목</label>
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
  const prevPath = s.basicComplete ? null : '/register/location';
  const content = `
    <form data-form="lesson">
      ${renderGuideNotice('상세등록 1단계입니다. 수업·가격과 경력·특징을 한 화면에서 채운 뒤 다음으로 넘어가세요.')}
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
            ${CAPACITY_PER_TIME_OPTIONS.map(
              (o) =>
                `<option value="${o.value}" ${s.capacity_per_time === o.value ? 'selected' : ''}>${o.label}</option>`,
            ).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="recruitment_count">모집 인원</label>
          <input class="form-input" type="number" id="recruitment_count" name="recruitment_count" value="${s.recruitment_count}" />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label" for="main_subject_note">주력과목</label>
        <select class="form-input" id="main_subject_note" name="main_subject_note">
          ${renderMainSubjectSelect(s.main_subject_note)}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label" for="teaching_style">지도 스타일</label>
        <input class="form-input" id="teaching_style" name="teaching_style" value="${s.teaching_style}" />
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
      <p class="register-hint mb-4">필요하면 과목을 더 추가할 수 있습니다.</p>
      <div data-subjects-list>
        ${s.subjects.map((sub, i) => renderSubjectRow(sub, i)).join('')}
      </div>
      <button type="button" class="btn btn--secondary btn--sm mt-4" data-action="add-subject">+ 과목 추가</button>

      ${renderSectionTitle('가격')}
      <div class="form-group">
        <label class="form-label form-label--required" for="price_amount">월 대표 금액 (원)</label>
        <input class="form-input" type="number" id="price_amount" name="price_amount" value="${s.price_amount}" placeholder="350000" />
      </div>
      <div class="form-group">
        <label class="form-label" for="price_description">가격 설명</label>
        <textarea class="form-input form-textarea" id="price_description" name="price_description" rows="3">${s.price_description}</textarea>
      </div>

      ${renderSectionTitle('경력 · 특징')}
      <div class="register-grid-2">
        <div class="form-group">
          <label class="form-label" for="career_years">교습 경력 (년)</label>
          <input class="form-input" type="number" id="career_years" name="career_years" value="${s.career_years}" />
        </div>
        <div class="form-group">
          <label class="form-label" for="academy_career_years">학원 경력 (년)</label>
          <input class="form-input" type="number" id="academy_career_years" name="academy_career_years" value="${s.academy_career_years}" />
        </div>
      </div>
      <div class="form-group">
        <label class="form-check">
          <input class="form-check__input" type="checkbox" name="franchise_flag" ${s.franchise_flag ? 'checked' : ''} />
          <span class="form-check__label">프랜차이즈</span>
        </label>
      </div>
      <div class="form-group">
        <label class="form-label" for="franchise_name">프랜차이즈명</label>
        <input class="form-input" id="franchise_name" name="franchise_name" value="${s.franchise_name}" />
      </div>
      <div class="form-group">
        <label class="form-check">
          <input class="form-check__input" type="checkbox" name="education_office_registered" ${s.education_office_registered ? 'checked' : ''} />
          <span class="form-check__label">교육청 등록</span>
        </label>
      </div>
      <div class="form-group">
        <label class="form-label" for="education_office_reg_no">교육청 등록번호</label>
        <input class="form-input" id="education_office_reg_no" name="education_office_reg_no" value="${s.education_office_reg_no}" />
      </div>
      <div class="register-grid-2">
        <div class="form-group">
          <label class="form-label" for="feature_1">특징 1</label>
          <input class="form-input" id="feature_1" name="feature_1" value="${s.feature_1}" />
        </div>
        <div class="form-group">
          <label class="form-label" for="feature_2">특징 2</label>
          <input class="form-input" id="feature_2" name="feature_2" value="${s.feature_2}" />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label" for="feature_3">특징 3</label>
        <input class="form-input" id="feature_3" name="feature_3" value="${s.feature_3}" />
      </div>
      <a class="register-mypage-link" href="${mypageRegistrationsUrl()}">이름·위치 등 기본정보는 마이페이지에서 수정</a>
      ${renderNavButtons(prevPath, '다음: 시설·연락')}
    </form>
  `;
  return renderRegisterShell(content, {
    stepKey: 'lesson',
    title: '수업 · 경력',
    subtitle: '상세등록 1/2 · 학생·학부모에게 보이는 정보를 적어 주세요.',
  });
}

export function bindLessonEvents(root) {
  bindGlobalEvents(root);
  const nextBtn = root.querySelector('[data-action="next"]');
  const prevBtn = root.querySelector('[data-action="prev"]');
  prevBtn?.addEventListener('click', () => navigate('/register/location'));
  nextBtn?.addEventListener('click', () => {
    withSaving(nextBtn, async () => {
      const form = root.querySelector('[data-form="lesson"]');
      syncLessonFromForm(form, registerState);
      syncCareerFromForm(form, registerState);
      await saveAndNavigate(registerState, 'lesson', null);
      await saveAndNavigate(registerState, 'career', '/register/facility');
    });
  });

  root.querySelector('[data-action="add-subject"]')?.addEventListener('click', () => {
    registerState.subjects.push(emptySubject());
    window.dispatchEvent(new Event('hashchange'));
  });
}
