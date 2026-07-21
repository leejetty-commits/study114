import {
  STUDENT_COUNT_LABELS,
  STUDENT_PLACE_LABELS,
  TEACHING_STYLE_LABELS,
  VISIBILITY_LABELS,
  LESSON_FORMAT_LABELS,
  STUDENT_GENDER_GROUP_LABELS,
} from '../student-enums.js';
import {
  getStudentProtectedVisibility,
  getRequestViewGateState,
  REQUEST_VIEW_GATE_COPY,
  FREE_PROVIDER_REQUEST_GATE_COPY,
  PEER_STUDENT_REQUEST_GATE_COPY,
} from '../student-visibility.js';
import { renderPermissionStateCard } from '../empty-state-copy.js';
import { esc } from './detail-utils.js';

/**
 * @param {string} label
 * @param {string} content
 * @param {boolean} visible
 * @param {string} visibility
 * @param {number} studentId
 * @param {{ isPaidProvider?: boolean, viewer?: string }} [opts]
 */
function renderProtectedBlock(label, content, visible, visibility, studentId, opts = {}) {
  if (visible) {
    return `
    <div class="p24-protected p24-protected--open">
      <span class="p24-protected__label">${esc(label)}</span>
      <p>${esc(content || '—')}</p>
    </div>`;
  }

  if (visibility === 'private') {
    const card = renderPermissionStateCard('not_public');
    return `
    <div class="p24-protected p24-protected--blocked">
      <span class="p24-protected__label">${esc(label)}</span>
      ${card}
    </div>`;
  }

  // paid_only — 학부모 피어: 공급자 유료 게이트 대신 비교범위 안내
  if (opts.viewer === 'parent') {
    const copy = PEER_STUDENT_REQUEST_GATE_COPY;
    return `
    <div class="p24-protected p24-protected--blocked">
      <span class="p24-protected__label">${esc(label)}</span>
      <div class="state-card state-card--permission">
        <strong class="state-card__title">${esc(copy.title)}</strong>
        <p class="state-card__body">${esc(copy.body)}</p>
      </div>
    </div>`;
  }

  // paid_only — 무료: 유료등록 게이트만 (1-A). 유료: 열람권 게이트
  if (!opts.isPaidProvider) {
    const copy = FREE_PROVIDER_REQUEST_GATE_COPY;
    return `
    <div class="p24-protected p24-protected--blocked">
      <span class="p24-protected__label">${esc(label)}</span>
      <div class="state-card state-card--permission">
        <strong class="state-card__title">${esc(copy.title)}</strong>
        <p class="state-card__body">${esc(copy.body)}</p>
        <div class="p24-protected__actions">
          <a href="#/mypage/plans" class="btn btn--primary btn--sm" data-mypage-nav="/mypage/plans">${esc(copy.ctaPlans)}</a>
        </div>
      </div>
    </div>`;
  }

  const gate = getRequestViewGateState();
  const unlockBtn = gate.hasTickets
    ? `<button type="button" class="btn btn--primary btn--sm" data-p24-action="unlock-request" data-student-id="${studentId}">${esc(REQUEST_VIEW_GATE_COPY.ctaUnlock)}</button>`
    : '';
  const plansLink = `<a href="#/mypage/plans" class="btn btn--secondary btn--sm" data-mypage-nav="/mypage/plans">${esc(REQUEST_VIEW_GATE_COPY.ctaPlans)}</a>`;

  return `
    <div class="p24-protected p24-protected--blocked">
      <span class="p24-protected__label">${esc(label)}</span>
      <div class="state-card state-card--permission">
        <strong class="state-card__title">${esc(REQUEST_VIEW_GATE_COPY.title)}</strong>
        <p class="state-card__body">${esc(REQUEST_VIEW_GATE_COPY.body)}</p>
        <p class="mypage-muted">열람권 잔여: <strong>${gate.ticketsRemaining}</strong>회</p>
        <div class="p24-protected__actions">${unlockBtn}${plansLink}</div>
      </div>
    </div>`;
}

/** @param {object} student @param {string} viewer */
export function renderStudentRequestBody(student, viewer) {
  const vis = getStudentProtectedVisibility(student, { viewer });
  const studentId = student.id;
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

  const fitHint =
    viewer === 'tutor'
      ? '<p class="p24-fit p24-fit--hint">내 수업 조건과 맞는지 프로필·지역을 확인하세요.</p>'
      : viewer === 'parent'
        ? '<p class="p24-fit p24-fit--hint">시장 비교용 열람입니다. 표시명은 마스킹되며 쪽지·연락처는 열리지 않습니다.</p>'
        : '';

  const providerHint =
    viewer === 'tutor' || viewer === 'study_room' || viewer === 'admin'
      ? `<p class="p24-sub-hint">요청문 ${VISIBILITY_LABELS[student.request_summary_visibility] || '비공개'}
        · 특이요청 ${VISIBILITY_LABELS[student.special_request_visibility] || '비공개'}
        ${vis.isPaidProvider ? `· 열람권 ${getRequestViewGateState().ticketsRemaining}회` : '· 유료등록 필요'}</p>`
      : '';

  return `
    ${fitHint}
    <section class="p24-section">
      <h3 class="p24-section__title">핵심 조건</h3>
      <dl class="p24-dl">
        <dt>학년</dt><dd>${esc(student.grade_level || '—')}</dd>
        <dt>지역</dt><dd>${esc(student.location_label || '—')}</dd>
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
    </section>
    <section class="p24-section">
      <h3 class="p24-section__title">요청 · 특이사항</h3>
      ${renderProtectedBlock('요청문', student.request_summary, vis.requestSummary, student.request_summary_visibility || 'private', studentId, { isPaidProvider: vis.isPaidProvider, viewer })}
      ${renderProtectedBlock('특이요청사항', student.special_request_note, vis.specialRequest, student.special_request_visibility || 'private', studentId, { isPaidProvider: vis.isPaidProvider, viewer })}
      ${providerHint}
    </section>`;
}
