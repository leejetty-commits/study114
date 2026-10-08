/**
 * 학생 마이프로필 — 입력값 열람 전용.
 * 과외쌤 renderTutorProfileRead와 같은 리스트. 수정은 기본정보·상세정보 이동만.
 */

import '../styles/tutor-profile-read.css';
import { primaryHopeRegionLabel } from '../../../shared/student-hope-regions.js';
import { studentSectionPath } from './router.js';
import { LESSON_FORMAT_LABELS } from '../student-enums.js';
import { labelBudget, labelLessonTarget, labelPlaces, labelTeachingStyles } from './format.js';
import { lessonDurationLabel } from '../../../shared/lesson-duration-options.js';
import { lessonWeeklyLabel } from '../../../shared/lesson-weekly-options.js';

const LESSON_TYPE_LABELS = { tutor: '과외', study_room: '공부방' };
const TUTOR_GENDER_LABELS = { female: '여', male: '남', any: '무관' };
const STUDENT_GENDER_LABELS = { female: '여', male: '남' };

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
}

function display(v) {
  const text = String(v ?? '').trim();
  if (!text || text === '—') return '';
  return text;
}

function weeklyLabel(student) {
  return lessonWeeklyLabel(student?.lessons_per_week);
}

function minutesLabel(student) {
  return lessonDurationLabel(student?.minutes_per_lesson);
}

function lessonShapeLabel(student) {
  const format = LESSON_FORMAT_LABELS[student?.lesson_format] || '';
  const target = display(labelLessonTarget(student));
  return [format, target].filter(Boolean).join(' · ');
}

/**
 * @param {import('./store.js').StudentRecord} student
 * @returns {{ id: string, title: string, editSection: 'basic'|'detail', rows: { label: string, value: string }[] }[]}
 */
export function buildStudentProfileReadSections(student) {
  const s = student && typeof student === 'object' ? student : {};
  return [
    {
      id: 'basic',
      title: '기본정보',
      editSection: 'basic',
      rows: [
        { label: '표시명', value: display(s.public_display_name) },
        { label: '희망 유형', value: LESSON_TYPE_LABELS[s.preferred_lesson_type] || '' },
        { label: '희망지역', value: display(primaryHopeRegionLabel(s) || s.region_label) },
        { label: '과목', value: display(s.subject_label) },
        { label: '학년', value: display(s.grade_level) },
        { label: '수업형태/인원', value: lessonShapeLabel(s) },
        { label: '예산', value: display(labelBudget(s)) },
        { label: '한 줄 요청문', value: display(s.request_summary) },
      ],
    },
    {
      id: 'detail',
      title: '상세정보',
      editSection: 'detail',
      rows: [
        { label: '희망지역 추가값', value: display(s.preferred_region_note) },
        { label: '희망 수업장소', value: display(labelPlaces(s.lesson_places)) },
        { label: '주 회수', value: weeklyLabel(s) },
        { label: '1회 수업시간', value: minutesLabel(s) },
        { label: '희망 강의스타일', value: display(labelTeachingStyles(s.teaching_style_badges)) },
        { label: '희망 과외쌤 성별', value: TUTOR_GENDER_LABELS[s.preferred_tutor_gender] || '' },
        { label: '학생 성별', value: STUDENT_GENDER_LABELS[s.gender] || '' },
        { label: '출생연도', value: s.birth_year ? String(s.birth_year) : '' },
        { label: '특이요청사항', value: display(s.special_request_note) },
      ],
    },
  ];
}

export const STUDENT_PROFILE_LEAD_COPY =
  '입력한 정보를 그대로 확인합니다. 각 항목의 수정을 누르면 바로 고칠 수 있어요.';
// 2안: '입력한 정보가 그대로 보입니다. 고칠 내용은 카드 오른쪽 위 수정에서 바꿀 수 있어요.'

/**
 * @param {import('./store.js').StudentRecord} student
 * @param {string} [cardPreviewHtml]
 */
export function renderStudentProfileRead(student, cardPreviewHtml = '') {
  const name = display(student?.public_display_name) || '학생 프로필';
  const basicHref = studentSectionPath(student.id, 'basic');
  const detailHref = studentSectionPath(student.id, 'detail');
  const sections = buildStudentProfileReadSections(student)
    .map((sec) => {
      const editHref = studentSectionPath(student.id, sec.editSection);
      const rows = sec.rows
        .map(
          (r) => `
        <div class="p21-profile__row">
          <dt class="p21-profile__label">${esc(r.label)}</dt>
          <dd class="p21-profile__value${r.value ? '' : ' is-empty'}">${r.value ? esc(r.value) : '미입력'}</dd>
        </div>`,
        )
        .join('');
      return `
      <section class="p21-profile__section" data-profile-section="${esc(sec.id)}">
        <header class="p21-profile__section-head">
          <h3 class="p21-profile__section-title">${esc(sec.title)}</h3>
          <a class="p21-profile__edit" href="#${editHref}" data-p19-nav="${editHref}">수정</a>
        </header>
        <dl class="p21-profile__list">${rows}</dl>
      </section>`;
    })
    .join('');

  return `
    <div class="p21-profile" data-p19-profile>
      <article class="p21-profile__section p21-profile__section--summary">
        ${cardPreviewHtml ? `<div class="p21-profile__preview-wrap">${cardPreviewHtml}</div>` : ''}
        <h2 class="p21-profile__name">${esc(name)}</h2>
        <p class="p21-profile__lead">${STUDENT_PROFILE_LEAD_COPY}</p>
      </article>
      ${sections}
    </div>`;
}
