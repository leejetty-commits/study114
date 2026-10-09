import {
  formatMonthlyWon,
  formatLessonOperationType,
  formatLessonPlace,
  formatStudyRoomCapacity,
} from '../exposure-format.js';
import { renderMedia, listingImage } from '../exposure-render.js';
import { esc, studyRoomParentInquiryLine } from './detail-utils.js';
import { coarseRegionForGuest } from '../student-blind-teaser.js';
import { renderPromoLinksSection } from '../../../shared/promo-links.js';
import { reviewSectionPlaceholder } from '../provider-reviews/ui.js';

/** @param {object} item @param {string} viewer */
export function renderStudyRoomDetailBody(item, viewer) {
  const isGuest = viewer === 'guest';
  const locationLabel = isGuest
    ? coarseRegionForGuest(item.location_label, 'study_room')
    : item.location_label || '—';

  // 별도 소개 에세이·fitHint 안내 박스 금지 — 카드 잠금 필드만 핵심 조건에 확장
  const features = [item.feature_1, item.feature_2, item.feature_3].filter(Boolean).join(' · ') || '—';

  const mapBlock = isGuest
    ? `<p class="p24-map-guest-note">위치 핀은 로그인 후 · 현재 ${esc(locationLabel)}</p>`
    : `<details class="p24-map-accordion" data-study-room-map data-map-variant="detail" data-region-label="${esc(item.location_label || '')}" data-geocode-region="true" data-member-map="true" data-allow-fallback="true">
      <summary class="p24-map-accordion__summary">위치 지도</summary>
      <div class="p24-map-accordion__body">
        <div class="naver-map-mount-host naver-map-mount-host--detail" data-naver-map-mount data-detail-map-for="${esc(String(item.id ?? ''))}"></div>
      </div>
    </details>`;

  return `
    <section class="p24-section">
      <h3 class="p24-section__title">핵심 조건</h3>
      <dl class="p24-dl">
        <dt>사진</dt><dd>${renderMedia(listingImage(item, 'pick'), item.study_room_name, 'pick', { roomDefault: true })}</dd>
        <dt>과목</dt><dd>${esc(item.main_subject_note || '—')}</dd>
        <dt>대상</dt><dd>${esc(item.grade_band || '—')}</dd>
        <dt>위치</dt><dd>${esc(locationLabel)}</dd>
        <dt>교습형태</dt><dd>${esc(formatLessonPlace(item.lesson_place_type))}</dd>
        <dt>수업운영방식</dt><dd>${esc(formatLessonOperationType(item.lesson_operation_type))}</dd>
        <dt>원생수</dt><dd>${esc(formatStudyRoomCapacity(item.capacity_per_time))}</dd>
        <dt>월 수강료</dt><dd>${esc(formatMonthlyWon(item.price_amount))}</dd>
        <dt>슬로건</dt><dd>${esc(item.slogan || '—')}</dd>
        <dt>특징</dt><dd>${esc(features)}</dd>
        <dt>소개</dt><dd>${esc(item.intro_short || '—')}</dd>
        <dt>쪽지 문의</dt><dd>${esc(studyRoomParentInquiryLine(item.inquiry_status))}</dd>
      </dl>
    </section>
    ${mapBlock}
    ${reviewSectionPlaceholder()}
    ${isGuest ? '' : renderPromoLinksSection(item, esc)}`;
}
