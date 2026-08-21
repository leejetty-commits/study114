import {
  formatTutorFeeCard,
  formatTutorLessonPlaces,
  formatTeachingStyleBadges,
  formatUniversitySummary,
  formatCareerYearBand,
  formatTutorStudentTarget,
} from '../exposure-format.js';
import { esc } from './detail-utils.js';
import { coarseRegionForGuest } from '../student-blind-teaser.js';
import { renderPromoLinksSection } from '../../../shared/promo-links.js';
import { reviewSectionPlaceholder } from '../provider-reviews/ui.js';

/** @param {object} item @param {string} viewer */
export function renderTutorDetailBody(item, viewer) {
  const isGuest = viewer === 'guest';
  const schedule =
    item.lessons_per_week && item.minutes_per_lesson
      ? `주 ${item.lessons_per_week}회 · ${item.minutes_per_lesson}분`
      : '—';
  const locationLabel = isGuest
    ? coarseRegionForGuest(item.location_label)
    : item.location_label || '—';
  const features = [item.feature_1, item.feature_2, item.feature_3].filter(Boolean).join(' · ') || '—';

  return `
    <section class="p24-section">
      <h3 class="p24-section__title">핵심 조건</h3>
      <dl class="p24-dl">
        <dt>과목</dt><dd>${esc(item.main_subject_note || '—')}</dd>
        <dt>활동 지역</dt><dd>${esc(locationLabel)}</dd>
        <dt>수업장소</dt><dd>${esc(formatTutorLessonPlaces(item.lesson_places))}</dd>
        <dt>대상</dt><dd>${esc(formatTutorStudentTarget(item))}</dd>
        <dt>수업료</dt><dd>${esc(formatTutorFeeCard(item))}</dd>
        <dt>일정</dt><dd>${esc(isGuest ? '로그인 후 확인' : schedule)}</dd>
        <dt>강의스타일</dt><dd>${esc(isGuest ? '로그인 후 확인' : formatTeachingStyleBadges(item.teaching_style_badges, 3))}</dd>
        <dt>특징</dt><dd>${esc(features)}</dd>
        <dt>학력</dt><dd>${esc(isGuest ? '로그인 후 확인' : formatUniversitySummary(item))}</dd>
        <dt>경력</dt><dd>${esc(formatCareerYearBand(item.career_year_band))}</dd>
      </dl>
    </section>
    ${reviewSectionPlaceholder()}
    ${isGuest ? '' : renderPromoLinksSection(item, esc)}`;
}
