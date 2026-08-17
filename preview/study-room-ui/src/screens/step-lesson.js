import { registerState, SCHOOL_LEVELS, LESSON_OPERATION_TYPES, CAPACITY_PER_TIME_OPTIONS, emptySubject } from '../state.js';
import { syncLessonFromForm } from '../form-collect.js';
import { saveAndNavigate, saveCurrentStep, withSaving } from '../save-flow.js';
import {
  renderRegisterShell,
  renderSectionTitle,
  renderDetailStepNav,
  renderGuideNotice,
  mypageRegistrationsUrl,
  bindGlobalEvents,
  navigate,
  skipToSummary,
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
  const content = `
    <form data-form="lesson">
      ${renderGuideNotice('상세등록 1단계입니다. 수업·가격을 채운 뒤 저장하세요. 저장이 끝나야 다음 단계로 갈 수 있습니다. 지금은 건너뛰고 나중에 마이페이지에서 이어도 됩니다.')}
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
        ${(s.subjects.length ? s.subjects : [emptySubject()]).map((sub, i) => renderSubjectRow(sub, i)).join('')}
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
      <a class="register-mypage-link" href="${mypageRegistrationsUrl()}">이름·위치 등 기본정보는 마이페이지에서 수정</a>
      ${renderDetailStepNav({
        prevPath: '/register/basic',
        nextLabel: '다음: 경력·시설',
        nextEnabled: Boolean(
          registerState.detailLessonSaved ||
            registerState.detail_completion_status === 'expanded_in_progress' ||
            registerState.detail_completion_status === 'expanded_complete',
        ),
      })}
    </form>
  `;
  return renderRegisterShell(content, {
    stepKey: 'lesson',
    title: '수업 · 가격',
    subtitle: '상세등록 1/2 · 학생·학부모에게 보이는 수업 정보를 적어 주세요.',
  });
}

function lessonSaveGuard() {
  if (!String(registerState.main_subject_note || '').trim()) {
    return '주력과목을 선택해 주세요.';
  }
  if (!Number(registerState.price_amount)) {
    return '월 대표 금액을 1원 이상 입력해 주세요.';
  }
  const hasSubject = (registerState.subjects || []).some((s) => String(s.subject_name || '').trim());
  if (!hasSubject) {
    return '대상 과목을 1개 이상 입력해 주세요.';
  }
  return '';
}

export function bindLessonEvents(root) {
  bindGlobalEvents(root);
  const form = root.querySelector('[data-form="lesson"]');
  const nextBtn = root.querySelector('[data-action="next"]');
  const prevBtn = root.querySelector('[data-action="prev"]');
  const saveBtn = root.querySelector('[data-action="save"]');

  prevBtn?.addEventListener('click', () => navigate('/register/basic'));
  root.querySelector('[data-action="skip-detail"]')?.addEventListener('click', () => skipToSummary());

  saveBtn?.addEventListener('click', () => {
    withSaving(saveBtn, async () => {
      syncLessonFromForm(form, registerState);
      const missing = lessonSaveGuard();
      if (missing) throw new Error(missing);
      await saveCurrentStep(registerState, 'lesson');
      registerState.detailLessonSaved = true;
      alert('저장되었습니다.');
      window.dispatchEvent(new Event('hashchange'));
    });
  });

  nextBtn?.addEventListener('click', () => {
    if (nextBtn.disabled) {
      alert('먼저 저장해 주세요. 저장 후에 다음 단계로 갈 수 있습니다.');
      return;
    }
    withSaving(nextBtn, async () => {
      syncLessonFromForm(form, registerState);
      const missing = lessonSaveGuard();
      if (missing) throw new Error(missing);
      await saveAndNavigate(registerState, 'lesson', '/register/facility');
    });
  });

  root.querySelector('[data-action="add-subject"]')?.addEventListener('click', () => {
    registerState.subjects.push(emptySubject());
    window.dispatchEvent(new Event('hashchange'));
  });
}
