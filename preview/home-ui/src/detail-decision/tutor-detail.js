import {
  formatTutorFeeCard,
  formatTutorLessonPlaces,
  formatTeachingStyleBadges,
  formatUniversityStatus,
  formatCareerYearBand,
  formatTutorStudentTarget,
  formatGender,
} from '../exposure-format.js';
import { renderMedia } from '../exposure-render.js';
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
    ? coarseRegionForGuest(item.location_label, 'tutor')
    : item.location_label || '—';
  const features = [item.feature_1, item.feature_2, item.feature_3].filter(Boolean).join(' · ') || '—';
  // 학교란은 학부 대학명·학과만 — university_note 대체 금지 (미니카드 오버레이와 동일)
  const school = [item.university_name, item.major_name].filter(Boolean).join(' ') || '—';
  const docCount = item.verification_doc_count ?? (item.proof_document_available ? 1 : 0);

  return `
    <section class="p24-section">
      <h3 class="p24-section__title">핵심 조건</h3>
      <dl class="p24-dl">
        <dt>사진</dt><dd>${renderMedia(item.image_path, item.tutor_display_name, 'pick')}</dd>
        <dt>성별</dt><dd>${esc(formatGender(item.gender))}</dd>
        <dt>과목</dt><dd>${esc(item.main_subject_note || '—')}</dd>
        <dt>과외지역</dt><dd>${esc(locationLabel)}</dd>
        <dt>수업장소</dt><dd>${esc(formatTutorLessonPlaces(item.lesson_places))}</dd>
        <dt>대상</dt><dd>${esc(item.grade_band || '—')}</dd>
        <dt>원생수</dt><dd>${esc(formatTutorStudentTarget(item))}</dd>
        <dt>수업료</dt><dd>${esc(formatTutorFeeCard(item))}</dd>
        <dt>일정</dt><dd>${esc(isGuest ? '로그인 후 확인' : schedule)}</dd>
        <dt>특징</dt><dd>${esc(features)}</dd>
        <dt>슬로건</dt><dd>${esc(item.slogan || '—')}</dd>
        <dt>제출자료</dt><dd>${esc(docCount ? `${docCount}개 공개` : '—')}</dd>
        <dt>주교재</dt><dd>${esc(item.main_material_note || '—')}</dd>
        <dt>강의스타일</dt><dd>${esc(isGuest ? '로그인 후 확인' : formatTeachingStyleBadges(item.teaching_style_badges, 3))}</dd>
        <dt>학적상태</dt><dd>${esc(isGuest ? '로그인 후 확인' : formatUniversityStatus(item.university_status))}</dd>
        <dt>학교·학과</dt><dd>${esc(isGuest ? '로그인 후 확인' : school)}</dd>
        <dt>경력</dt><dd>${esc(formatCareerYearBand(item.career_year_band))}</dd>
        <dt>소개</dt><dd>${esc(item.intro_short || '—')}</dd>
      </dl>
    </section>
    ${reviewSectionPlaceholder()}
    ${isGuest ? '' : renderPromoLinksSection(item, esc)}`;
}
