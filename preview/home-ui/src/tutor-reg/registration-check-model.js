/**
 * 과외쌤 등록점검 view model — TutorRecord SSOT만 읽는다.
 */

import { formatTutorFeeCard } from '../exposure-format.js';
import { TUTOR_PLACE_LABELS, UNIVERSITY_STATUS_LABELS } from '../tutor-enums.js';
import { tutorSectionPath, tutorHubPath } from './router.js';
import { tutorToExposureRow } from './format.js';
import {
  TRC_COPY,
  TRC_PICK_FIELD_IDS,
  TRC_PRIME_FIELD_IDS,
  TRC_REQUIRED_FIELD_IDS,
  TRC_PROMO_MISSING_DEFS,
} from './registration-check-copy.js';

const REQUIRED_SET = new Set(TRC_REQUIRED_FIELD_IDS);

function blank(v) {
  return String(v ?? '').trim();
}

function textStatus(v) {
  return blank(v) ? 'filled' : 'empty';
}

function row(id, label, value, status) {
  return {
    id,
    label,
    value: blank(value) ? String(value) : '',
    status,
    required: REQUIRED_SET.has(id),
  };
}

function lessonPlacesLabel(tutor) {
  const places = Array.isArray(tutor.lesson_places) ? tutor.lesson_places : [];
  return places.map((p) => TUTOR_PLACE_LABELS[p] || p).filter(Boolean).join(' · ');
}

function teachingStyleLabel(tutor) {
  const badges = Array.isArray(tutor.teaching_style_badges) ? tutor.teaching_style_badges : [];
  return badges.join(' · ');
}

function studentTargetLabel(tutor) {
  const parts = [tutor.student_gender_group, tutor.student_count_group].filter(blank);
  return parts.join(' · ');
}

function universityLabel(tutor) {
  return [tutor.university_name, tutor.major_name].filter(blank).join(' · ');
}

/** @param {import('./store.js').TutorRecord} tutor */
function fieldOkMap(tutor) {
  return {
    display_name: !!blank(tutor.tutor_display_name),
    main_subject: !!(tutor.has_primary_subject && blank(tutor.main_subject_note)),
    primary_region: !!(tutor.has_primary_region && blank(tutor.primary_region_label)),
    profile_image: !!tutor.has_profile_image,
    intro_short: !!blank(tutor.intro_short),
    intro_long: !!blank(tutor.intro_long),
    fee: !!tutor.preferred_fee_amount,
    lesson_places: !!tutor.has_lesson_places,
    feature_1: !!blank(tutor.feature_1),
    teaching_style: (Array.isArray(tutor.teaching_style_badges) ? tutor.teaching_style_badges : []).length > 0,
    student_target: !!(blank(tutor.student_gender_group) || blank(tutor.student_count_group)),
    university: !!blank(tutor.university_name),
    detail_complete: tutor.detail_completion_status === 'expanded_complete',
    education_doc: !!tutor.education_doc_submitted,
  };
}

function remainingCount(okMap, ids) {
  return ids.filter((id) => !okMap[id]).length;
}

function missingForTier(okMap, ids, tutorId) {
  return ids
    .filter((id) => !okMap[id])
    .map((id) => {
      const def = TRC_PROMO_MISSING_DEFS.find((d) => d.id === id);
      if (!def) return null;
      const section = def.section === 'basic' ? 'basic' : 'detail';
      return {
        id,
        label: def.label,
        hint: def.hint,
        href: `#${tutorSectionPath(tutorId, section)}`,
        section: def.section,
      };
    })
    .filter(Boolean);
}

/** @param {import('./store.js').TutorRecord} tutor */
function buildBoard(tutor) {
  const places = lessonPlacesLabel(tutor);
  const styles = teachingStyleLabel(tutor);
  const target = studentTargetLabel(tutor);
  const uni = universityLabel(tutor);
  const fee = tutor.preferred_fee_amount ? formatTutorFeeCard(tutor) : '';
  const uniStatus = UNIVERSITY_STATUS_LABELS[tutor.university_status] || tutor.university_status || '';

  return [
    {
      id: 'basic',
      title: TRC_COPY.board.sections.basic,
      variant: 'plain',
      editSection: 'basic',
      rows: [
        row('display_name', '표시명', tutor.tutor_display_name, textStatus(tutor.tutor_display_name)),
        row('main_subject', '주력과목', tutor.main_subject_note, textStatus(tutor.main_subject_note)),
        row(
          'primary_region',
          '대표 활동 시',
          tutor.primary_region_label || tutor.location_label,
          tutor.has_primary_region && blank(tutor.primary_region_label || tutor.location_label) ? 'filled' : 'empty',
        ),
        row('grade_band', '대상', tutor.grade_band, textStatus(tutor.grade_band)),
        row('fee_basic', '과외비 요약', fee, textStatus(fee)),
      ],
    },
    {
      id: 'detail',
      title: TRC_COPY.board.sections.detail,
      variant: 'detail',
      editSection: 'detail',
      rows: [
        row('intro_short', '한 줄 소개', tutor.intro_short, textStatus(tutor.intro_short)),
        row('intro_long', '상세 소개', tutor.intro_long, textStatus(tutor.intro_long)),
        row('profile_image', '프로필 사진', tutor.has_profile_image ? '등록됨' : '', tutor.has_profile_image ? 'filled' : 'empty'),
        row('lesson_places', '강의장소', places, textStatus(places)),
        row('fee', '과외비', fee, textStatus(fee)),
        row('lessons_per_week', '주당 횟수', tutor.lessons_per_week, textStatus(tutor.lessons_per_week)),
        row('minutes_per_lesson', '1회 시간(분)', tutor.minutes_per_lesson, textStatus(tutor.minutes_per_lesson)),
        row('teaching_style', '강의스타일', styles, textStatus(styles)),
        row('student_target', '학생구성', target, textStatus(target)),
        row(
          'detail_complete',
          '상세등록 상태',
          tutor.detail_completion_status === 'expanded_complete' ? '완료' : tutor.detail_completion_status || '',
          tutor.detail_completion_status === 'expanded_complete' ? 'filled' : 'empty',
        ),
      ],
    },
    {
      id: 'detail2',
      title: TRC_COPY.board.sections.detail2,
      variant: 'detail',
      editSection: 'detail',
      rows: [
        row('feature_1', '경력특징 1', tutor.feature_1, textStatus(tutor.feature_1)),
        row('feature_2', '경력특징 2', tutor.feature_2, textStatus(tutor.feature_2)),
        row('feature_3', '경력특징 3', tutor.feature_3, textStatus(tutor.feature_3)),
        row('university', '학교·학과', uni, textStatus(uni)),
        row('university_status', '학적상태', uniStatus, textStatus(uniStatus)),
        row(
          'education_doc',
          '학력 제출자료',
          tutor.education_doc_submitted ? (tutor.education_doc_public ? '제출·공개' : '제출') : '',
          tutor.education_doc_submitted ? 'filled' : 'empty',
        ),
        row(
          'career_doc',
          '경력 제출자료',
          tutor.career_doc_submitted ? '제출' : '',
          tutor.career_doc_submitted ? 'filled' : 'empty',
        ),
        row('contact_time_note', '연락 가능 시간', tutor.contact_time_note, textStatus(tutor.contact_time_note)),
      ],
    },
  ];
}

/**
 * @param {import('./store.js').TutorRecord} tutor
 * @param {{ canPublish?: boolean, missing?: string[] }} [readiness]
 */
export function buildTutorRegistrationCheckModel(tutor, readiness = {}) {
  const okMap = fieldOkMap(tutor);
  const pickLeft = remainingCount(okMap, TRC_PICK_FIELD_IDS);
  const primeLeft = remainingCount(okMap, TRC_PRIME_FIELD_IDS);
  const board = buildBoard(tutor);
  const checklistRows = board.filter((sec) => sec.variant === 'detail').flatMap((sec) => sec.rows);
  const filledRows = checklistRows.filter((r) => r.status === 'filled').length;
  const pct = checklistRows.length ? Math.round((filledRows / checklistRows.length) * 100) : 0;

  return {
    tutorId: tutor.id,
    copy: TRC_COPY,
    previewItem: tutorToExposureRow(tutor),
    readiness,
    hubPath: tutorHubPath(tutor.id),
    header: {
      title: TRC_COPY.title,
      lead: TRC_COPY.lead,
      badges: [
        {
          id: 'basic',
          label: TRC_COPY.badges.basicReg,
          value: TRC_COPY.badges.basicDone,
          tone: 'ok',
        },
        {
          id: 'pick',
          value: pickLeft ? TRC_COPY.badges.pickNeed(pickLeft) : TRC_COPY.badges.pickReady,
          tone: pickLeft ? 'warn' : 'ok',
          layout: 'sentence',
        },
        {
          id: 'prime',
          value: primeLeft ? TRC_COPY.badges.primeNeed(primeLeft) : TRC_COPY.badges.primeReady,
          tone: primeLeft ? 'warn' : 'ok',
          layout: 'sentence',
        },
        {
          id: 'progress',
          label: TRC_COPY.badges.progress,
          value: `${pct}%`,
          tone: pct >= 80 ? 'ok' : 'neutral',
        },
      ],
    },
    promo: {
      ...TRC_COPY.promo,
      pickMissing: missingForTier(okMap, TRC_PICK_FIELD_IDS, tutor.id),
      primeMissing: missingForTier(okMap, TRC_PRIME_FIELD_IDS, tutor.id),
    },
    board,
    counts: { filledRows, totalRows: checklistRows.length, pct, pickLeft, primeLeft },
  };
}

/** @param {number} tutorId @param {'basic'|'detail'} section */
export function tutorRegistrationCheckTabHref(tutorId, section) {
  return `#${tutorSectionPath(tutorId, section)}`;
}
