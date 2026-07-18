import {
  formatMonthlyWon,
  formatLessonOperationType,
  formatLessonPlace,
} from '../exposure-format.js';
import { esc, inquiryStatusLabel } from './detail-utils.js';
import { coarseRegionForGuest } from '../student-blind-teaser.js';
import { renderPromoLinksSection } from '../../../shared/promo-links.js';

/** @param {object} item @param {string} viewer */
export function renderStudyRoomDetailBody(item, viewer) {
  const isGuest = viewer === 'guest';
  const locationLabel = isGuest
    ? coarseRegionForGuest(item.location_label)
    : item.location_label || '—';
  const fitHint =
    viewer === 'parent'
      ? '<p class="p24-fit p24-fit--hint">자녀 학년·과목·예산과 맞는지 확인하세요.</p>'
      : isGuest
        ? '<p class="p24-fit p24-fit--hint">비로그인 · 위치는 동/권역만 표시 · 문의는 로그인 후</p>'
        : '';

  const mapBlock = isGuest
    ? `<p class="p24-map-guest-note">정확한 위치·지도 핀은 로그인 후 확인할 수 있습니다. (현재: ${esc(locationLabel)})</p>`
    : `<details class="p24-map-accordion" data-study-room-map data-map-variant="detail" data-region-label="${esc(item.location_label || '')}" data-allow-fallback="true">
      <summary class="p24-map-accordion__summary">위치 지도</summary>
      <div class="p24-map-accordion__body">
        <div class="naver-map-mount-host naver-map-mount-host--detail" data-naver-map-mount data-detail-map-for="${esc(String(item.id ?? ''))}"></div>
      </div>
    </details>`;

  return `
    ${fitHint}
    <section class="p24-section">
      <h3 class="p24-section__title">핵심 조건</h3>
      <dl class="p24-dl">
        <dt>과목</dt><dd>${esc(item.main_subject_note || '—')}</dd>
        <dt>대상 학년</dt><dd>${esc(item.grade_band || '—')}</dd>
        <dt>위치</dt><dd>${esc(locationLabel)}</dd>
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
        <dt>시설</dt><dd>${esc(isGuest ? '로그인 후 확인' : item.facility_summary || '—')}</dd>
        <dt>교육청 등록</dt><dd>${item.education_office_registered ? '공개' : '미공개'}</dd>
      </dl>
    </section>
    ${mapBlock}
    ${isGuest ? '' : renderPromoLinksSection(item, esc)}`;
}
