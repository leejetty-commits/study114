/**
 * 과외쌤 활동형 시각화 — 지도 대신 활동지역 1~3 공급/수요 막대
 * 데이터: 프론트 시드 EXPOSURE_* + filterTutorsByRegion / filterStudentsByRegion
 */

import { EXPOSURE_TUTORS, EXPOSURE_STUDENTS } from './exposure-data.js';
import { MOCK_TUTOR_REGIONS } from '@search-ui/search-schema.js';
import {
  filterTutorsByRegion,
  filterStudentsByRegion,
} from '@search-ui/search-region-feed.js';

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
}

/**
 * @param {{ hopeType?: 'tutor'|'study_room'|null }} [opts]
 * @returns {Array<{ index: number, id: string, label: string, primary: boolean, tutorCount: number, studentCount: number }>}
 */
export function getTutorActivityRegionStats(opts = {}) {
  const hopeType = opts.hopeType ?? 'tutor';
  return MOCK_TUTOR_REGIONS.map((region, index) => {
    const tutors = filterTutorsByRegion(EXPOSURE_TUTORS, region.label);
    let students = filterStudentsByRegion(EXPOSURE_STUDENTS, region.label);
    if (hopeType === 'tutor' || hopeType === 'study_room') {
      students = students.filter(
        (s) =>
          s.preferred_lesson_type === hopeType || s.preferred_lesson_type === 'both',
      );
    }
    return {
      index,
      id: region.id,
      label: region.label,
      primary: Boolean(region.primary),
      tutorCount: tutors.length,
      studentCount: students.length,
    };
  });
}

/**
 * @param {{ activeIndex?: number, interactive?: boolean }} [opts]
 */
export function renderTutorActivityBars(opts = {}) {
  const activeIndex = Number.isFinite(opts.activeIndex) ? Number(opts.activeIndex) : 0;
  const interactive = opts.interactive !== false;
  const rows = getTutorActivityRegionStats({ hopeType: 'tutor' });
  const maxVal = Math.max(1, ...rows.flatMap((r) => [r.tutorCount, r.studentCount]));

  const body = rows
    .map((row) => {
      const tPct = Math.round((row.tutorCount / maxVal) * 100);
      const sPct = Math.round((row.studentCount / maxVal) * 100);
      const active = row.index === activeIndex ? ' is-active' : '';
      const tag = interactive ? 'button' : 'div';
      const attrs = interactive
        ? `type="button" data-tutor-region="${row.index}"`
        : `role="listitem"`;
      return `
      <${tag} class="act-bars__row${active}" ${attrs} aria-pressed="${row.index === activeIndex}">
        <span class="act-bars__region">${esc(row.label)}${row.primary ? '<em>대표</em>' : ''}</span>
        <span class="act-bars__pair">
          <span class="act-bars__metric" title="과외쌤">
            <span class="act-bars__track"><span class="act-bars__fill act-bars__fill--tutor" style="width:${tPct}%"></span></span>
            <span class="act-bars__num"><span class="act-bars__key">과외쌤</span> ${row.tutorCount}</span>
          </span>
          <span class="act-bars__metric" title="학생수요">
            <span class="act-bars__track"><span class="act-bars__fill act-bars__fill--student" style="width:${sPct}%"></span></span>
            <span class="act-bars__num"><span class="act-bars__key">학생수요</span> ${row.studentCount}</span>
          </span>
        </span>
      </${tag}>`;
    })
    .join('');

  return `
    <div class="act-bars" data-tutor-activity-bars aria-label="활동지역별 과외쌤·학생 수요">
      <div class="act-bars__legend" aria-hidden="true">
        <span class="act-bars__swatch act-bars__swatch--tutor"></span>과외쌤
        <span class="act-bars__swatch act-bars__swatch--student"></span>학생수요
      </div>
      <div class="act-bars__list" role="list">
        ${body}
      </div>
      <p class="act-bars__note">시드 노출 데이터 기준 · 과목 필터 미반영</p>
    </div>`;
}
