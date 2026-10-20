/**
 * 과외쌤 등록점검 view model — TutorRecord SSOT만 읽는다.
 * Basic / Pick 추가 / Prime 추가는 입력 화면 배지가 아니라 여기서만 가른다.
 */

import { formatTutorFeeCard } from '../exposure-format.js';
import { lessonDurationLabel } from '../../../shared/lesson-duration-options.js';
import { lessonWeeklyLabel } from '../../../shared/lesson-weekly-options.js';
import { tutorBlankPath, tutorSectionPath, tutorHubPath } from './router.js';
import { tutorToExposureRow } from './format.js';
import {
  TRC_COPY,
  TRC_BASIC_FIELD_IDS,
  TRC_PICK_FIELD_IDS,
  TRC_PRIME_FIELD_IDS,
  TRC_BOARD_BASIC_FIELDS,
  TRC_BOARD_REQUIRED_IDS,
  TRC_PROMO_MISSING_DEFS,
} from './registration-check-copy.js';
import { tutorBasicOkMap, tutorBasicValuesFromRecord } from '../../../shared/tutor-basic-fields.js';
import { SCHOOL_LEVEL_FORM_LABELS } from '../../../shared/school-grade.js';
import {
  TUTOR_DETAIL_FIELDS,
  TUTOR_DETAIL_GROUP_CAREER,
  TUTOR_DETAIL_GROUP_LESSON,
  TUTOR_DETAIL_GROUP_PHOTO,
  TUTOR_DETAIL_GROUP_PROMO,
  tutorDetailFieldFocus,
  tutorDetailFieldText,
  tutorDetailTabForFocus,
} from '../../../shared/tutor-detail-fields.js';
import { TUTOR_PRIME_IDS, tutorTierMissing } from '../../../shared/pickprime-requirements.js';

function blank(v) {
  return String(v ?? '').trim();
}

function row(id, label, value, status, extra) {
  const more = extra && typeof extra === 'object' ? extra : {};
  return {
    id,
    label,
    value: blank(value) ? String(value) : '',
    status,
    required: TRC_BOARD_REQUIRED_IDS.has(id),
    note: more.note ? String(more.note) : '',
    editHref: more.editHref ? String(more.editHref) : '',
  };
}

function feeBasisOk(tutor) {
  const v = blank(tutor?.fee_basis_type);
  return v === 'monthly_by_weekly_schedule' || v === 'monthly_by_total_sessions';
}

function scheduleOk(tutor) {
  const weekly = Number(tutor?.lessons_per_week) > 0;
  const monthly = Number(tutor?.monthly_session_count) > 0;
  if (blank(tutor?.fee_basis_type) === 'monthly_by_total_sessions') return monthly;
  return weekly;
}

function minutesOk(tutor) {
  return Number(tutor?.minutes_per_lesson) > 0;
}

/** 기본정보 항목은 shared/tutor-basic-fields.js, 픽·프라임은 pickprime-requirements.js. */
/** @param {import('./store.js').TutorRecord} tutor */
export function tutorFieldOkMap(tutor) {
  const t = tutor && typeof tutor === 'object' ? tutor : {};
  const missing = new Set(tutorTierMissing(t, 'prime').map((item) => item.id));
  /** @type {Record<string, boolean>} */
  const tierOk = {};
  for (const id of TUTOR_PRIME_IDS) tierOk[id] = !missing.has(id);
  return {
    fee_basis: feeBasisOk(t),
    schedule: scheduleOk(t),
    university: !!blank(t.university_name),
    lesson_places: !!t.has_lesson_places || (Array.isArray(t.lesson_places) && t.lesson_places.length > 0),
    profile_image: !!t.has_profile_image,
    feature_1: !!blank(t.feature_1),
    student_target: !!(blank(t.student_gender_group) || blank(t.student_count_group)),
    ...tierOk,
    ...tutorBasicOkMap(tutorBasicValuesFromRecord(t)),
  };
}

/** 기본카드 = 기본정보 8개. 다 채우면 노출 (정본 73 0절). 상세 항목은 노출 조건이 아니다. */
function basicIdsForTutor() {
  return [...TRC_BASIC_FIELD_IDS];
}

/** 등록점검 항목 id → 입력 화면 data-trc-field (항목이 칸 하나가 아닐 때만) */
const TRC_FOCUS_FIELD = {
  intro: 'intro_long',
  student_gender_group: 'student_target',
};

/** @param {import('./store.js').TutorRecord} tutor @param {{ id: string, section?: string, focus?: string }} def */
function defHref(tutor, def) {
  if (def.section === 'basic') return tutorRegistrationCheckTabHref(tutor.id, 'basic', def.focus || def.id);
  let focus = TRC_FOCUS_FIELD[def.focus] || TRC_FOCUS_FIELD[def.id] || def.focus || def.id;
  if (def.id === 'schedule' || def.focus === 'schedule') {
    focus = tutor?.fee_basis_type === 'monthly_by_total_sessions' ? 'monthly_session_count' : 'lessons_per_week';
  }
  return tutorRegistrationCheckTabHref(tutor.id, tutorDetailTabForFocus(focus), focus);
}

function remainingCount(okMap, ids) {
  return ids.filter((id) => !okMap[id]).length;
}

/**
 * @param {Record<string, boolean>} okMap
 * @param {string[]} ids
 * @param {import('./store.js').TutorRecord} tutor
 */
function missingForTier(okMap, ids, tutor) {
  return ids
    .filter((id) => !okMap[id])
    .map((id) => {
      const def = TRC_PROMO_MISSING_DEFS.find((d) => d.id === id);
      if (!def) return null;
      return {
        id,
        label: def.label,
        hint: def.hint,
        href: defHref(tutor, def),
        section: def.section,
      };
    })
    .filter(Boolean);
}

function firstMissing(okMap, ids) {
  const id = ids.find((key) => !okMap[key]);
  if (!id) return null;
  return TRC_PROMO_MISSING_DEFS.find((d) => d.id === id) || { id, label: id };
}

function hashQuery(opts = {}) {
  const params = new URLSearchParams();
  if (opts.returnRegistrationCheck) params.set('return', 'registration-check');
  if (opts.focus) params.set('focus', String(opts.focus));
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

/** @param {number} tutorId @param {'basic'|'detail'|'detail2'} section @param {string} [focusId] */
export function tutorRegistrationCheckTabHref(tutorId, section, focusId) {
  if (!Number(tutorId)) return `#${tutorBlankPath(section)}`;
  return `#${tutorSectionPath(tutorId, section)}${hashQuery({
    returnRegistrationCheck: true,
    focus: focusId || undefined,
  })}`;
}

function sectionSummary(sec) {
  const rows = Array.isArray(sec?.rows) ? sec.rows : [];
  const total = rows.length;
  const filled = rows.filter((r) => r.status === 'filled').length;
  const missingRows = rows.filter((r) => r.status !== 'filled');
  const requiredMissing = missingRows.filter((r) => r.required);
  const shortage = requiredMissing.length;
  const missLabels = requiredMissing.slice(0, 2).map((r) => r.label);
  const extra = requiredMissing.length - missLabels.length;
  const nameList = extra > 0
    ? `${missLabels.join(', ')} ${TRC_COPY.board.missMore(extra)}`
    : missLabels.join(', ');
  const requiredComplete = shortage === 0 && rows.some((r) => r.required);
  return {
    filled,
    total,
    missing: shortage,
    requiredMissing: shortage,
    missLabels,
    line: shortage > 0 ? TRC_COPY.board.filledLine(filled, total, shortage) : `완료 ${filled}/${total}`,
    sub: shortage > 0
      ? (nameList ? `${TRC_COPY.board.missPrefix}: ${nameList}` : '')
      : requiredComplete
        ? TRC_COPY.board.allRequiredOk
        : '',
  };
}

function weeklyLabel(tutor) {
  return lessonWeeklyLabel(tutor?.lessons_per_week);
}

function flattenBoardRows(sec) {
  if (Array.isArray(sec?.children) && sec.children.length) {
    return sec.children.flatMap((child) => child.rows || []);
  }
  return Array.isArray(sec?.rows) ? sec.rows : [];
}

function withSummary(sec) {
  const summary = sectionSummary({ ...sec, rows: flattenBoardRows(sec) });
  const children = Array.isArray(sec.children)
    ? sec.children.map((child) => ({ ...child, summary: sectionSummary(child) }))
    : undefined;
  return { ...sec, children, summary };
}

/** @param {import('./store.js').TutorRecord} tutor */
function buildBoard(tutor) {
  const fee = Number(tutor?.preferred_fee_amount) > 0 ? formatTutorFeeCard(tutor) : '';
  const minutes = minutesOk(tutor) ? lessonDurationLabel(tutor.minutes_per_lesson) : '';
  const weekly = weeklyLabel(tutor);
  const basicOk = tutorBasicOkMap(tutorBasicValuesFromRecord(tutor));
  const basicValues = {
    display_name: tutor?.tutor_display_name,
    primary_region: tutor?.primary_region_label || tutor?.location_label,
    school_level: SCHOOL_LEVEL_FORM_LABELS[tutor?.school_level] || (basicOk.school_level ? '—' : ''),
    main_subject: tutor?.main_subject_note,
    fee,
    lessons_per_week: weekly,
    minutes,
    slogan: tutor?.slogan,
  };

  const basic = {
    id: 'basic',
    title: TRC_COPY.board.sections.basic,
    collapsedDefault: false,
    editSection: 'basic',
    rows: TRC_BOARD_BASIC_FIELDS.map((f) =>
      row(f.id, f.label, basicValues[f.id], basicOk[f.id] ? 'filled' : 'empty'),
    ),
  };

  const detailRow = (field) => {
    const value = field.value(tutor);
    const weeklySchedule = field.id === 'schedule' && tutor?.fee_basis_type !== 'monthly_by_total_sessions';
    const focus = weeklySchedule ? 'lessons_per_week' : tutorDetailFieldFocus(field, tutor);
    const section = weeklySchedule ? 'basic' : field.tab;
    const extra = { editHref: tutorRegistrationCheckTabHref(tutor.id, section, focus) };
    if (field.id === 'intro_long') extra.note = TRC_COPY.board.introNote;
    return row(field.id, tutorDetailFieldText(field, tutor), value, field.filled(tutor) ? 'filled' : 'empty', extra);
  };
  const rowsFor = (tab, group) =>
    TUTOR_DETAIL_FIELDS.filter((field) => field.tab === tab && field.group === group).map(detailRow);

  const detail1 = {
    id: 'detail1',
    title: TUTOR_DETAIL_GROUP_LESSON,
    rows: rowsFor('detail', TUTOR_DETAIL_GROUP_LESSON),
  };
  const detailCareer = {
    id: 'detail-career',
    title: TUTOR_DETAIL_GROUP_CAREER,
    rows: rowsFor('detail2', TUTOR_DETAIL_GROUP_CAREER),
  };
  const detailPromo = {
    id: 'detail-promo',
    title: TUTOR_DETAIL_GROUP_PROMO,
    rows: rowsFor('detail2', TUTOR_DETAIL_GROUP_PROMO),
  };
  const detailPhoto = {
    id: 'detail-photo',
    title: TUTOR_DETAIL_GROUP_PHOTO,
    rows: rowsFor('detail2', TUTOR_DETAIL_GROUP_PHOTO),
  };

  const detail = {
    id: 'detail',
    title: TRC_COPY.board.sections.detail,
    collapsedDefault: true,
    editSection: 'detail',
    children: [detail1, detailCareer, detailPromo, detailPhoto],
  };

  return [basic, detail].map(withSummary);
}

function fillAction(tutor, miss) {
  return { id: miss.id, label: TRC_COPY.next.fill(miss.label), href: defHref(tutor, miss) };
}

function nextAction(okMap, tutor, canPublish, basicIds) {
  const status = tutor?.profile_status;
  const publishMiss = canPublish ? null : firstMissing(okMap, basicIds);
  if (status === 'hidden') {
    return publishMiss ? fillAction(tutor, publishMiss) : null;
  }
  if (publishMiss) return fillAction(tutor, publishMiss);
  const pickMiss = firstMissing(okMap, TRC_PICK_FIELD_IDS);
  if (pickMiss) return fillAction(tutor, pickMiss);
  const primeMiss = firstMissing(okMap, TRC_PRIME_FIELD_IDS);
  if (primeMiss) return fillAction(tutor, primeMiss);
  if (status === 'published') {
    return { id: 'exposure', label: TRC_COPY.next.live, href: '' };
  }
  return null;
}

/**
 * @param {import('./store.js').TutorRecord} tutor
 * @param {{ canPublish?: boolean, missing?: string[], profileStatus?: string }} [readiness]
 */
export function buildTutorRegistrationCheckModel(tutor, readiness = {}) {
  const t = tutor && typeof tutor === 'object' ? tutor : { id: 0 };
  const okMap = tutorFieldOkMap(t);
  const basicIds = basicIdsForTutor(t);
  const basicLeft = remainingCount(okMap, basicIds);
  const pickLeft = remainingCount(okMap, TRC_PICK_FIELD_IDS);
  const primeLeft = remainingCount(okMap, TRC_PRIME_FIELD_IDS);
  /** 헤더 노출 배지는 getPublishReadiness. Basic 배지는 필드 집계. */
  const publishReady = readiness.canPublish === true;
  const board = buildBoard(t);
  const status = readiness.profileStatus || t.profile_status || 'draft';
  const next = nextAction(okMap, t, publishReady, basicIds);

  const badges = [];
  if (status === 'published') {
    badges.push({ id: 'publish', value: TRC_COPY.badges.publishLive, tone: 'ok' });
  }
  badges.push(
    {
      id: 'basic',
      value: basicLeft ? TRC_COPY.badges.basicNeed(basicLeft) : TRC_COPY.badges.basicOk,
      tone: basicLeft ? 'warn' : 'ok',
    },
    {
      id: 'pick',
      value: pickLeft ? TRC_COPY.badges.pickNeed(pickLeft) : TRC_COPY.badges.pickOk,
      tone: pickLeft ? 'warn' : 'ok',
    },
    {
      id: 'prime',
      value: primeLeft ? TRC_COPY.badges.primeNeed(primeLeft) : TRC_COPY.badges.primeOk,
      tone: primeLeft ? 'warn' : 'ok',
    },
  );

  return {
    tutorId: t.id,
    copy: TRC_COPY,
    previewItem: tutorToExposureRow(t),
    readiness: { ...readiness, canPublish: publishReady, profileStatus: status, basicLeft },
    hubPath: tutorHubPath(t.id),
    nextAction: next,
    header: {
      title: TRC_COPY.title,
      lead: TRC_COPY.lead,
      badges,
    },
    promo: {
      ...TRC_COPY.promo,
      pickMissing: missingForTier(okMap, TRC_PICK_FIELD_IDS, t),
      primeMissing: missingForTier(okMap, TRC_PRIME_FIELD_IDS, t),
    },
    board,
    counts: { basicLeft, pickLeft, primeLeft, canPublish: publishReady },
    okMap,
  };
}

export { TRC_BASIC_FIELD_IDS, TRC_PICK_FIELD_IDS, TRC_PRIME_FIELD_IDS };
