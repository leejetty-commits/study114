import {
  formatMonthlyWon,
  formatLessonOperationType,
  formatLessonPlace,
} from '../exposure-format.js';
import { esc, inquiryStatusLabel } from './detail-utils.js';

/** @param {object} item @param {string} viewer */
export function renderStudyRoomDetailBody(item, viewer) {
  const fitHint =
    viewer === 'parent'
      ? '<p class="p24-fit p24-fit--hint">자녀 학년·과목·예산과 맞는지 확인하세요.</p>'
      : '';

  return `
    ${fitHint}
    <section class="p24-section">
      <h3 class="p24-section__title">핵심 조건</h3>
      <dl class="p24-dl">
        <dt>과목</dt><dd>${esc(item.main_subject_note || '—')}</dd>
        <dt>대상 학년</dt><dd>${esc(item.grade_band || '—')}</dd>
        <dt>위치</dt><dd>${esc(item.location_label || '—')}</dd>
        <dt>수업장소</dt><dd>${esc(formatLessonPlace(item.lesson_place_type))}</dd>
        <dt>수업형태</dt><dd>${esc(formatLessonOperationType(item.lesson_operation_type))}</dd>
        <dt>정원</dt><dd>${esc(item.capacity_per_time || '—')}</dd>
        <dt>월 수강료</dt><dd>${esc(formatMonthlyWon(item.price_amount))}</dd>
        <dt>상담 수용</dt><dd>${esc(inquiryStatusLabel(item.inquiry_status))}</dd>
      </dl>
    </section>
    <section class="p24-section">
      <h3 class="p24-section__title">소개 · 시설</h3>
      <p class="p24-intro">${esc(item.intro_short || item.slogan || item.feature_1 || '—')}</p>
      <dl class="p24-dl p24-dl--compact">
        <dt>특징</dt><dd>${esc([item.feature_1, item.feature_2, item.feature_3].filter(Boolean).join(' · ') || '—')}</dd>
        <dt>시설</dt><dd>${esc(item.facility_summary || '—')}</dd>
        <dt>교육청 등록</dt><dd>${item.education_office_registered ? '공개' : '미공개'}</dd>
      </dl>
    </section>`;
}
