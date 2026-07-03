import {
  STUDENT_COUNT_LABELS,
  STUDENT_PLACE_LABELS,
  TEACHING_STYLE_LABELS,
  VISIBILITY_LABELS,
  LESSON_FORMAT_LABELS,
  STUDENT_GENDER_GROUP_LABELS,
} from './student-enums.js';
import {
  getStudentProtectedVisibility,
  PAID_GATE_MESSAGE,
} from './student-visibility.js';
import { previewState } from './state.js';
import { startFirstMemoFlow } from './messages/compose-flow.js';

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
      <p class="student-form__hint">SSOT 4장 · 14장 — 수업예산 라벨 통일, 내부 저장 분기</p>
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
          <span class="student-form__db">students.preferred_fee_amount</span>
        </label>
        <label class="student-form__field">
          <span class="student-form__label">수업예산 (공부방)</span>
          <input name="preferred_studyroom_fee_amount" type="number" class="student-form__input" value="${esc(String(v.preferred_studyroom_fee_amount))}" />
          <span class="student-form__db">students.preferred_studyroom_fee_amount</span>
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
      <button type="button" class="btn btn--primary btn--sm" data-action="save-student-preview">저장 (프리뷰)</button>
    </section>
  `;
}

function renderProtectedBlock(label, content, visible) {
  if (!visible) {
    return `
      <div class="student-detail__protected student-detail__protected--blocked">
        <span class="student-detail__protected-label">${esc(label)}</span>
        <p class="student-detail__protected-msg">${PAID_GATE_MESSAGE}</p>
      </div>
    `;
  }
  return `
    <div class="student-detail__protected student-detail__protected--open">
      <span class="student-detail__protected-label">${esc(label)}</span>
      <p>${esc(content || '—')}</p>
    </div>
  `;
}

/** 학생 상세 모달 (공급자 권한 반영) */
export function renderStudentDetailModal(student) {
  if (!student) return '';
  const sub = previewState.providerSubscription;
  const vis = getStudentProtectedVisibility(student, sub);
  const places = (student.lesson_places || [])
    .map((p) => STUDENT_PLACE_LABELS[p] || p)
    .join(' · ');
  const styles = (student.teaching_style_badges || [])
    .map((b) => TEACHING_STYLE_LABELS[b] || b)
    .join(' · ');
  const budget =
    student.preferred_lesson_type === 'study_room'
      ? student.preferred_studyroom_fee_amount
      : student.preferred_fee_amount;

  return `
    <div class="modal-overlay" id="student-detail-modal" role="dialog" aria-modal="true">
      <div class="modal student-detail">
        <header class="modal__head">
          <h2>${esc(student.public_display_name)} · 상세</h2>
          <button type="button" class="modal__close" data-action="close-student-detail" aria-label="닫기">×</button>
        </header>
        <div class="modal__body">
          <p class="student-detail__meta">${esc(student.grade_level || '—')} · ${esc(student.location_label || '—')}</p>
          <dl class="student-detail__dl">
            <dt>희망 과목</dt><dd>${esc(student.subject_label || '—')}</dd>
            <dt>희망 수업장소</dt><dd>${esc(places || '—')}</dd>
            <dt>수업형태</dt><dd>${esc(LESSON_FORMAT_LABELS[student.lesson_format] || '—')}</dd>
            ${
              student.lesson_format === 'group'
                ? `<dt>그룹 구성</dt><dd>${esc(STUDENT_GENDER_GROUP_LABELS[student.student_gender_group] || '—')}</dd>
            <dt>희망 수업인원</dt><dd>${esc(STUDENT_COUNT_LABELS[student.preferred_student_count_group] || '—')}</dd>`
                : `<dt>희망 수업인원</dt><dd>단독</dd>`
            }
            <dt>희망 강의스타일</dt><dd>${esc(styles || '—')}</dd>
            <dt>수업예산</dt><dd>${budget != null ? `${Number(budget).toLocaleString('ko-KR')}원` : '—'}</dd>
          </dl>
          ${renderProtectedBlock('요청문', student.request_summary, vis.requestSummary)}
          ${renderProtectedBlock('특이요청사항', student.special_request_note, vis.specialRequest)}
          <p class="student-detail__sub-hint">
            공급자 구독: <strong>${sub === 'paid' ? '유료' : '무료'}</strong>
            · 요청문 ${VISIBILITY_LABELS[student.request_summary_visibility] || '비공개'}
            · 특이요청 ${VISIBILITY_LABELS[student.special_request_visibility] || '비공개'}
          </p>
        </div>
        <footer class="modal__foot">
          <button type="button" class="btn btn--secondary btn--sm" data-action="student-memo"
            ${sub !== 'paid' ? `title="${PAID_GATE_MESSAGE}"` : ''}>
            메모 보내기
          </button>
          <button type="button" class="btn btn--primary btn--sm" data-action="close-student-detail">닫기</button>
        </footer>
      </div>
    </div>
  `;
}

export function bindStudentDetailEvents(root, { onRerender } = {}) {
  root.querySelectorAll('[data-action="open-student-detail"]').forEach((el) => {
    el.addEventListener('click', () => {
      const id = Number(el.dataset.studentId);
      const student = window.__STUDENT_PREVIEW_POOL?.find((s) => s.id === id);
      if (!student) return;
      const wrap = document.createElement('div');
      wrap.innerHTML = renderStudentDetailModal(student);
      const modal = wrap.firstElementChild;
      document.body.appendChild(modal);
      modal.querySelector('[data-action="close-student-detail"]')?.addEventListener('click', () => modal.remove());
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
      });
      modal.querySelector('[data-action="student-memo"]')?.addEventListener('click', () => {
        startFirstMemoFlow({
          kind: 'student',
          targetId: student.id,
          targetName: student.public_display_name || '학생',
          student,
          structuredLine: `${student.grade_level || '—'} · 희망 과외 · 대치동`,
        });
      });
    });
  });

  root.querySelectorAll('[data-provider-subscription]').forEach((el) => {
    el.addEventListener('click', () => {
      previewState.providerSubscription = el.dataset.providerSubscription;
      onRerender?.();
    });
  });
}
