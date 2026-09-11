/**
 * 과외쌤 등록점검 view model — TutorRecord SSOT만 읽는다.
 * Basic / Pick 추가 / Prime 추가는 입력 화면 배지가 아니라 여기서만 가른다.
 */

import { formatTutorFeeCard } from '../exposure-format.js';
import { TUTOR_PLACE_LABELS, UNIVERSITY_STATUS_LABELS } from '../tutor-enums.js';
import { tutorSectionPath, tutorHubPath } from './router.js';
import { tutorToExposureRow } from './format.js';
import {
  TRC_COPY,
  TRC_BASIC_FIELD_IDS,
  TRC_PICK_FIELD_IDS,
  TRC_PRIME_FIELD_IDS,
  TRC_BOARD_REQUIRED_IDS,
  TRC_PROMO_MISSING_DEFS,
} from './registration-check-copy.js';

const GENDER_GROUP_LABELS = { male: '남학생', female: '여학생', mixed: '혼성' };
const STUDENT_COUNT_LABELS = { solo: '단독', two: '2명', three: '3명', four_plus: '4명 이상' };

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
    required: TRC_BOARD_REQUIRED_IDS.has(id),
  };
}

function lessonPlacesLabel(tutor) {
  const places = Array.isArray(tutor?.lesson_places) ? tutor.lesson_places : [];
  return places.map((p) => TUTOR_PLACE_LABELS[p] || p).filter(Boolean).join(' · ');
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

function introOk(tutor) {
  return !!(blank(tutor?.intro_short) || blank(tutor?.intro_long));
}

function feeBasisLabel(tutor) {
  if (blank(tutor?.fee_basis_type) === 'monthly_by_total_sessions') return '월 총 횟수 기준';
  if (blank(tutor?.fee_basis_type) === 'monthly_by_weekly_schedule') return '주 횟수 기준';
  return '';
}

/** @param {import('./store.js').TutorRecord} tutor */
export function tutorFieldOkMap(tutor) {
  const t = tutor && typeof tutor === 'object' ? tutor : {};
  return {
    display_name: !!blank(t.tutor_display_name),
    main_subject: !!(t.has_primary_subject && blank(t.main_subject_note)),
    primary_region: !!(t.has_primary_region && blank(t.primary_region_label)),
    lesson_places: !!t.has_lesson_places || (Array.isArray(t.lesson_places) && t.lesson_places.length > 0),
    fee: Number(t.preferred_fee_amount) > 0,
    fee_basis: feeBasisOk(t),
    schedule: scheduleOk(t),
    minutes: minutesOk(t),
    intro: introOk(t),
    university: !!blank(t.university_name),
    profile_image: !!t.has_profile_image,
    feature_1: !!blank(t.feature_1),
    student_target: !!(blank(t.student_gender_group) || blank(t.student_count_group)),
    intro_long: !!blank(t.intro_long),
    feature_2: !!blank(t.feature_2),
    feature_3: !!blank(t.feature_3),
  };
}

const BASIC_VIA_COMPLETE = new Set(['fee_basis', 'schedule', 'minutes', 'university']);

function basicIdsForTutor(tutor) {
  if (tutor?.detail_completion_status === 'expanded_complete') {
    return TRC_BASIC_FIELD_IDS.filter((id) => !BASIC_VIA_COMPLETE.has(id));
  }
  return TRC_BASIC_FIELD_IDS;
}

function remainingCount(okMap, ids) {
  return ids.filter((id) => !okMap[id]).length;
}

/**
 * @param {Record<string, boolean>} okMap
 * @param {string[]} ids
 * @param {number} tutorId
 */
function missingForTier(okMap, ids, tutorId) {
  return ids
    .filter((id) => !okMap[id])
    .map((id) => {
      const def = TRC_PROMO_MISSING_DEFS.find((d) => d.id === id);
      if (!def) return null;
      return {
        id,
        label: def.label,
        hint: def.hint,
        href: tutorRegistrationCheckTabHref(tutorId, def.section === 'basic' ? 'basic' : 'detail', def.id),
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

/** @param {number} tutorId @param {'basic'|'detail'} section @param {string} [focusId] */
export function tutorRegistrationCheckTabHref(tutorId, section, focusId) {
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
  const missLabels = (requiredMissing.length ? requiredMissing : missingRows).slice(0, 2).map((r) => r.label);
  return {
    filled,
    total,
    missing: missingRows.length,
    requiredMissing: requiredMissing.length,
    missLabels,
    line: TRC_COPY.board.filledLine(filled, total, missingRows.length),
    sub:
      requiredMissing.length === 0 && rows.some((r) => r.required)
        ? TRC_COPY.board.allRequiredOk
        : missLabels.length
          ? `${TRC_COPY.board.missPrefix}: ${missLabels.join(', ')}`
          : '',
  };
}

function weeklyLabel(tutor) {
  return Number(tutor?.lessons_per_week) > 0 ? `주 ${tutor.lessons_per_week}회` : '';
}

function monthlyLabel(tutor) {
  return Number(tutor?.monthly_session_count) > 0 ? `월 ${tutor.monthly_session_count}회` : '';
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
  const places = lessonPlacesLabel(tutor);
  const fee = Number(tutor?.preferred_fee_amount) > 0 ? formatTutorFeeCard(tutor) : '';
  const uniStatus = UNIVERSITY_STATUS_LABELS[tutor?.university_status] || '';
  const basis = feeBasisLabel(tutor);
  const minutes = minutesOk(tutor) ? `${tutor.minutes_per_lesson}분` : '';
  const gender = GENDER_GROUP_LABELS[tutor?.student_gender_group] || '';
  const count = STUDENT_COUNT_LABELS[tutor?.student_count_group] || '';
  const weekly = weeklyLabel(tutor);
  const monthly = monthlyLabel(tutor);

  const basic = {
    id: 'basic',
    title: TRC_COPY.board.sections.basic,
    collapsedDefault: false,
    editSection: 'basic',
    rows: [
      row('display_name', '표시명', tutor?.tutor_display_name, textStatus(tutor?.tutor_display_name)),
      row('main_subject', '주력과목', tutor?.main_subject_note, textStatus(tutor?.main_subject_note)),
      row(
        'primary_region',
        '과외지역',
        tutor?.primary_region_label || tutor?.location_label,
        tutor?.has_primary_region && blank(tutor?.primary_region_label) ? 'filled' : 'empty',
      ),
    ],
  };

  const detail1 = {
    id: 'detail1',
    title: TRC_COPY.board.sections.detail1,
    rows: [
      row('fee', '월 과외비', fee, textStatus(fee)),
      row('fee_basis', '산정방식', basis, textStatus(basis)),
      row('lessons_per_week', '주 횟수', weekly, Number(tutor?.lessons_per_week) > 0 ? 'filled' : 'empty'),
      row(
        'monthly_session_count',
        '월 총 횟수',
        monthly,
        Number(tutor?.monthly_session_count) > 0 ? 'filled' : 'empty',
      ),
      row('minutes', '1회(분)', minutes, textStatus(minutes)),
      row('student_gender_group', '지도 대상 성별', gender, textStatus(gender)),
      row('student_count_group', '수업인원', count, textStatus(count)),
      row('lesson_places', '강의장소', places, textStatus(places)),
      row('fee_description', '가격 설명', tutor?.fee_description, textStatus(tutor?.fee_description)),
    ],
  };

  const detail2 = {
    id: 'detail2',
    title: TRC_COPY.board.sections.detail2,
    rows: [
      row('university_name', '출신대학', tutor?.university_name, textStatus(tutor?.university_name)),
      row('major_name', '전공', tutor?.major_name, textStatus(tutor?.major_name)),
      row('university_status', '학적상태', uniStatus, textStatus(uniStatus)),
      row('feature_1', '특징 1', tutor?.feature_1, textStatus(tutor?.feature_1)),
      row('feature_2', '특징 2', tutor?.feature_2, textStatus(tutor?.feature_2)),
      row('feature_3', '특징 3', tutor?.feature_3, textStatus(tutor?.feature_3)),
      row('intro_short', '짧은 소개', tutor?.intro_short, textStatus(tutor?.intro_short)),
      row(
        'profile_image',
        '프로필 사진',
        tutor?.has_profile_image ? '등록됨' : '',
        tutor?.has_profile_image ? 'filled' : 'empty',
      ),
      row('intro_long', '상세 소개', tutor?.intro_long, textStatus(tutor?.intro_long)),
      row('contact_time_note', '연락 가능 시간', tutor?.contact_time_note, textStatus(tutor?.contact_time_note)),
    ],
  };

  const detail = {
    id: 'detail',
    title: TRC_COPY.board.sections.detail,
    collapsedDefault: true,
    editSection: 'detail',
    children: [detail1, detail2],
  };

  return [basic, detail].map(withSummary);
}

function nextAction(okMap, tutor, canPublish, basicIds) {
  const status = tutor?.profile_status;
  if (!canPublish) {
    const miss = firstMissing(okMap, basicIds);
    if (miss) {
      return {
        id: miss.id,
        label: TRC_COPY.next.fill(miss.label),
        href: tutorRegistrationCheckTabHref(
          tutor.id,
          miss.section === 'basic' ? 'basic' : 'detail',
          miss.id,
        ),
      };
    }
  }
  const pickMiss = firstMissing(okMap, TRC_PICK_FIELD_IDS);
  if (pickMiss) {
    return {
      id: pickMiss.id,
      label: TRC_COPY.next.fill(pickMiss.label),
      href: tutorRegistrationCheckTabHref(tutor.id, 'detail', pickMiss.id),
    };
  }
  const primeMiss = firstMissing(okMap, TRC_PRIME_FIELD_IDS);
  if (primeMiss) {
    return {
      id: primeMiss.id,
      label: TRC_COPY.next.fill(primeMiss.label),
      href: tutorRegistrationCheckTabHref(tutor.id, 'detail', primeMiss.id),
    };
  }
  if (status === 'hidden') {
    return { id: 'republish', label: TRC_COPY.next.hidden, href: '' };
  }
  if (status === 'published') {
    return { id: 'live', label: TRC_COPY.next.live, href: '' };
  }
  return { id: 'publish', label: TRC_COPY.next.publish, href: '' };
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
  /** 공개 CTA 정본은 getPublishReadiness. 헤더 Basic 배지는 필드 집계. */
  const publishReady = readiness.canPublish === true;
  const board = buildBoard(t);
  const status = readiness.profileStatus || t.profile_status || 'draft';
  const next = nextAction(okMap, t, publishReady, basicIds);

  let publishBadge = { id: 'publish', value: TRC_COPY.badges.publishNeed, tone: 'warn' };
  if (status === 'published') {
    publishBadge = { id: 'publish', value: TRC_COPY.badges.publishLive, tone: 'ok' };
  } else if (status === 'hidden' && publishReady) {
    publishBadge = { id: 'publish', value: TRC_COPY.badges.publishHidden, tone: 'warn' };
  } else if (publishReady) {
    publishBadge = { id: 'publish', value: TRC_COPY.badges.publishOk, tone: 'ok' };
  }

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
      badges: [
        publishBadge,
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
      ],
    },
    promo: {
      ...TRC_COPY.promo,
      pickMissing: missingForTier(okMap, TRC_PICK_FIELD_IDS, t.id),
      primeMissing: missingForTier(okMap, TRC_PRIME_FIELD_IDS, t.id),
    },
    board,
    counts: { basicLeft, pickLeft, primeLeft, canPublish: publishReady },
    okMap,
  };
}

export { TRC_BASIC_FIELD_IDS, TRC_PICK_FIELD_IDS, TRC_PRIME_FIELD_IDS };
