import {
  STUDENT_COUNT_LABELS,
  STUDENT_PLACE_LABELS,
  TEACHING_STYLE_LABELS,
  VISIBILITY_LABELS,
  LESSON_FORMAT_LABELS,
  STUDENT_GENDER_GROUP_LABELS,
} from './student-enums.js';

function esc(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderVisibilitySelect(name, value) {
  return `
    <label class="student-form__field">
      <span class="student-form__label">${name === 'request_summary_visibility' ? '요청문 공개' : '특이요청 공개'}</span>
      <select name="${name}" class="student-form__select">
        <option value="private" ${value === 'private' ? 'selected' : ''}>${VISIBILITY_LABELS.private}</option>
        <option value="paid_only" ${value === 'paid_only' ? 'selected' : ''}>${VISIBILITY_LABELS.paid_only}</option>
      </select>
    </label>
  `;
}

/** 학생 등록/수정 미리보기 폼 (4장 visibility 포함) */
export function renderStudentRegisterForm(student = {}) {
  const v = {
    request_summary_visibility: student.request_summary_visibility || 'private',
    special_request_visibility: student.special_request_visibility || 'private',
    request_summary: student.request_summary || '',
    special_request_note: student.special_request_note || '',
    preferred_lesson_type: student.preferred_lesson_type || 'tutor',
    grade_level: student.grade_level || '',
    preferred_fee_amount: student.preferred_fee_amount ?? '',
    preferred_studyroom_fee_amount: student.preferred_studyroom_fee_amount ?? '',
  };
  return `
    <section class="student-form" id="student-register-preview">
      <h3 class="student-form__title">자녀 기본등록 (프리뷰)</h3>
      <p class="student-form__hint">수업 유형에 맞는 월 예산을 보여드려요.</p>
      <div class="student-form__grid">
        <label class="student-form__field">
          <span class="student-form__label">희망 유형</span>
          <select name="preferred_lesson_type" class="student-form__select">
            <option value="tutor" ${v.preferred_lesson_type === 'tutor' ? 'selected' : ''}>과외쌤</option>
            <option value="study_room" ${v.preferred_lesson_type === 'study_room' ? 'selected' : ''}>공부방</option>
          </select>
        </label>
        <label class="student-form__field">
          <span class="student-form__label">학교급/학년</span>
          <input name="grade_level" class="student-form__input" value="${esc(v.grade_level)}" placeholder="예: 중2" />
        </label>
        <label class="student-form__field">
          <span class="student-form__label">수업예산 (과외)</span>
          <input name="preferred_fee_amount" type="number" class="student-form__input" value="${esc(String(v.preferred_fee_amount))}" />
          <span class="student-form__db">과외 희망 예산</span>
        </label>
        <label class="student-form__field">
          <span class="student-form__label">수업예산 (공부방)</span>
          <input name="preferred_studyroom_fee_amount" type="number" class="student-form__input" value="${esc(String(v.preferred_studyroom_fee_amount))}" />
          <span class="student-form__db">공부방 희망 예산</span>
        </label>
      </div>
      <label class="student-form__field student-form__field--full">
        <span class="student-form__label">요청문</span>
        <textarea name="request_summary" class="student-form__textarea" rows="2">${esc(v.request_summary)}</textarea>
      </label>
      ${renderVisibilitySelect('request_summary_visibility', v.request_summary_visibility)}
      <label class="student-form__field student-form__field--full">
        <span class="student-form__label">특이요청사항</span>
        <textarea name="special_request_note" class="student-form__textarea" rows="2">${esc(v.special_request_note)}</textarea>
      </label>
      ${renderVisibilitySelect('special_request_visibility', v.special_request_visibility)}
      <button type="button" class="btn btn--primary btn--sm" data-action="save-student-preview">미리보기 저장</button>
    </section>
  `;
}

/** @deprecated P24 detail-decision으로 이관 — bindStudentDetailEvents는 detail-decision/index.js 사용 */
export { bindStudentDetailEvents } from './detail-decision/index.js';
