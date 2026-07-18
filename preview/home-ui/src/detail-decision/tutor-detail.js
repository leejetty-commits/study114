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

  const fitHint =
    viewer === 'parent'
      ? '<p class="p24-fit p24-fit--hint">희망 과목·지역·예산과 맞는지 확인하세요.</p>'
      : isGuest
        ? '<p class="p24-fit p24-fit--hint">비로그인 · 활동 지역은 동/권역만 · 쪽지는 로그인 후</p>'
        : '';

  return `
    ${fitHint}
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
      </dl>
    </section>
    <section class="p24-section">
      <h3 class="p24-section__title">소개 · 신뢰</h3>
      <p class="p24-intro">${esc(item.intro_short || item.feature_1 || '—')}</p>
      <dl class="p24-dl p24-dl--compact">
        <dt>학력</dt><dd>${esc(isGuest ? '로그인 후 확인' : formatUniversitySummary(item))}</dd>
        <dt>경력</dt><dd>${esc(formatCareerYearBand(item.career_year_band))}</dd>
        <dt>제출자료</dt><dd>${item.proof_document_available ? '공개' : '미공개'}</dd>
      </dl>
    </section>
    ${isGuest ? '' : renderPromoLinksSection(item, esc)}`;
}
