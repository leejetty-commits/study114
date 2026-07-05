/** P21 — 과외 레코드 라벨 · tutor-ui 딥링크 · 접근·노출 행 */

import { profileStatusLabel } from '../lifecycle-copy.js';
import { PRODUCT_APPLY } from './tutor-reg-copy.js';
import { TUTOR_REGISTER_URL, HOME_UI_BASE } from '../nav-config.js';
import { formatTutorFeeCard } from '../exposure-format.js';
import { tutorHubPath } from './router.js';
import { getPublishReadiness, isPaidProvider, getMemoCreditsRemaining } from './store.js';

/** @typedef {import('./store.js').TutorRecord} TutorRecord */

const DETAIL_STATUS_LABELS = {
  basic_only: '기본만',
  expanded_in_progress: '상세 진행중',
  expanded_complete: '상세 완료',
};

export { profileStatusLabel };

/** @param {string} status */
export function detailStatusLabel(status) {
  return DETAIL_STATUS_LABELS[status] || status || '—';
}

/** @param {TutorRecord} tutor */
export function formatTutorSummaryLine(tutor) {
  const parts = [tutor.main_subject_note, tutor.location_label].filter(Boolean);
  if (tutor.preferred_fee_amount) parts.push(formatTutorFeeCard(tutor));
  return parts.join(' · ') || '—';
}

/** @param {TutorRecord} tutor */
export function tutorToExposureRow(tutor) {
  return {
    id: tutor.id,
    tutor_display_name: tutor.tutor_display_name,
    location_label: tutor.location_label || '—',
    main_subject_note: tutor.main_subject_note || '—',
    grade_band: tutor.grade_band || '—',
    preferred_fee_amount: tutor.preferred_fee_amount,
    lessons_per_week: tutor.lessons_per_week,
    minutes_per_lesson: tutor.minutes_per_lesson,
    intro_short: tutor.intro_short || '',
    feature_1: tutor.feature_1 || '',
    university_name: tutor.university_name || '',
    major_name: tutor.major_name || '',
    university_status: tutor.university_status,
    proof_document_available: tutor.proof_document_available,
    student_gender_group: tutor.student_gender_group,
    student_count_group: tutor.student_count_group,
    lesson_places: tutor.lesson_places || [],
    teaching_style_badges: tutor.teaching_style_badges || [],
    profile_status: tutor.profile_status,
    compare_eligible: tutor.compare_eligible,
  };
}

/**
 * tutor-ui 딥링크 (21장 부록 C)
 * @param {'basic'|'regions'|'lesson'|'career'|'contact'} step
 * @param {number} tutorId
 */
export function tutorUiDeepLink(step, tutorId) {
  const returnTo = encodeURIComponent(`${HOME_UI_BASE}#${tutorHubPath(tutorId)}`);
  const base = TUTOR_REGISTER_URL.replace(/#\/register\/basic$/, '');
  return `${base}#/register/${step}?tutor_id=${tutorId}&return_to=${returnTo}`;
}

/** @param {TutorRecord} tutor */
export function getThreeGauges(tutor) {
  const completionItems = [
    { ok: !!tutor.tutor_display_name, label: '표시명' },
    { ok: tutor.has_primary_subject, label: '주력과목' },
    { ok: tutor.has_primary_region, label: '활동 시' },
    { ok: tutor.has_lesson_places, label: '강의장소' },
    { ok: !!tutor.preferred_fee_amount, label: '과외비' },
    { ok: !!(tutor.intro_short?.trim() || tutor.intro_long?.trim()), label: '소개문' },
    { ok: tutor.has_profile_image, label: '프로필 사진' },
  ];
  const trustItems = [
    { ok: !!tutor.university_name, label: '학교명' },
    { ok: !!tutor.major_name, label: '학과명' },
    { ok: !!tutor.university_status, label: '학적상태' },
    { ok: tutor.education_doc_submitted, label: '학력 제출자료' },
    { ok: tutor.education_doc_public, label: '학력 공개 선택' },
    { ok: tutor.career_doc_submitted, label: '경력 제출자료' },
  ];
  const paid = isPaidProvider();
  const accessItems = [
    { ok: tutor.profile_status === 'published', label: '공개중' },
    { ok: tutor.has_primary_subject, label: '주력과목 1순위' },
    { ok: tutor.has_primary_region, label: '대표 활동 시' },
    { ok: tutor.compare_eligible, label: '비교검색 필수값' },
    { ok: paid, label: '유료·메모 권한' },
    { ok: tutor.detail_completion_status === 'expanded_complete', label: '상세등록 완료' },
  ];

  const pack = (items) => ({
    done: items.filter((i) => i.ok).length,
    total: items.length,
    items,
  });

  return {
    completion: pack(completionItems),
    trustInfo: pack(trustItems),
    exposureAccess: pack(accessItems),
  };
}

/** @param {TutorRecord} tutor */
function countProductConditions(tutor) {
  let n = 0;
  if (tutor.profile_status !== 'published') n++;
  if (tutor.detail_completion_status !== 'expanded_complete') n++;
  return n;
}

/** @param {TutorRecord} tutor */
export function getProductApplyHint(tutor) {
  const n = countProductConditions(tutor);
  const paid = isPaidProvider();
  if (n === 0 && tutor.profile_status === 'published') {
    return paid ? PRODUCT_APPLY.pickPrimeEligiblePaid : PRODUCT_APPLY.pickEligibleUnpaid;
  }
  return PRODUCT_APPLY.pickPrimeMissing(n);
}

/**
 * P21-05 §7-3 잠금 해제형 카드 (잠긴 항목만)
 * @param {TutorRecord} tutor
 */
export function getUnlockCards(tutor) {
  const paid = isPaidProvider();
  const memos = getMemoCreditsRemaining();
  const published = tutor.profile_status === 'published';
  const expanded = tutor.detail_completion_status === 'expanded_complete';
  const matching = getMatchingVisibility(tutor);

  /** @param {string} key @param {string} label @param {{ label: string, ok: boolean }[]} conditions @param {{ label: string, external?: string, path?: string }} cta */
  const build = (key, label, conditions, cta) => {
    const missing = conditions.filter((c) => !c.ok);
    if (missing.length === 0) return null;
    return {
      key,
      label,
      conditions,
      missingCount: missing.length,
      ctaLabel: cta.label,
      ctaExternal: cta.external,
      ctaPath: cta.path,
    };
  };

  return [
    build(
      'matching',
      '학생찾기 노출',
      [
        { label: '프로필 공개', ok: published },
        { label: '대표 활동 시', ok: tutor.has_primary_region },
        { label: '공개 준비·필수값', ok: matching.ok },
      ],
      { label: '학생찾기 보기', external: '#/tutor' },
    ),
    build(
      'cold_memo',
      '학생에게 먼저 메모',
      [
        { label: '프로필 공개', ok: published },
        { label: '유료 등록', ok: paid },
        { label: '메모권 잔여', ok: memos > 0 },
      ],
      { label: '메모권·유료 (P16-04)', external: '#/mypage/plans' },
    ),
    build(
      'request_doc',
      '요청문 열람',
      [
        { label: '유료 등급', ok: paid },
        { label: '프로필 공개', ok: published },
      ],
      { label: '유료 확인', external: '#/mypage/plans' },
    ),
    build(
      'pick',
      'Pick 신청',
      [
        { label: '프로필 공개', ok: published },
        { label: '상세등록 완료', ok: expanded },
      ],
      { label: '상세정보 보강', path: 'detail' },
    ),
    build(
      'prime',
      'Prime 신청',
      [
        { label: '유료 등급', ok: paid },
        { label: '프로필 공개', ok: published },
        { label: '상세등록 완료', ok: expanded },
      ],
      { label: 'Prime 자격 확인', external: '#/mypage/plans' },
    ),
  ].filter(Boolean);
}

/** 학생찾기 CTA (9·13장) — 프리뷰는 과외쌤 메인 학생 리스트 */
export function getStudentSearchUrl() {
  return '#/tutor';
}

/** @param {TutorRecord} tutor */
export function getMatchingVisibility(tutor) {
  const readiness = getPublishReadiness(tutor);
  const published = tutor.profile_status === 'published';
  const hasPrimary = tutor.has_primary_region && !!tutor.primary_region_label;

  const conditions = [
    tutor.primary_region_label || '대표 활동 시 미설정',
    tutor.main_subject_note || '주력과목 미설정',
    tutor.grade_band || '대상 학생군',
    tutor.has_lesson_places ? '강의장소 설정됨' : '강의장소 미설정',
  ];

  let status = '학생찾기 노출 불가';
  let limited = true;
  if (published && hasPrimary && readiness.canPublish) {
    status = `${tutor.primary_region_label} · ${tutor.main_subject_note} · ${tutor.grade_band || '학생'} 학생찾기 노출 가능`;
    limited = false;
  } else if (!hasPrimary) {
    status = '대표 활동 시 미설정 — 학생찾기 기본 노출 제한';
  } else if (!published) {
    status = '미공개 — 학생찾기 미노출';
  }

  return { conditions, status, limited, ok: !limited };
}

/** @param {TutorRecord} tutor */
export function getAccessMatrix(tutor) {
  const paid = isPaidProvider();
  const memos = getMemoCreditsRemaining();
  const published = tutor.profile_status === 'published';

  return [
    {
      key: 'reply',
      label: '학부모 선연락 답장',
      ok: true,
      reason: null,
    },
    {
      key: 'basic',
      label: '내 프로필 Basic 노출',
      ok: published,
      reason: !published ? '공개 후 노출' : null,
    },
    {
      key: 'student_struct',
      label: '학생 구조화 정보 열람',
      ok: published,
      reason: !published ? '공개 필요' : null,
    },
    {
      key: 'cold_memo',
      label: '학생에게 먼저 메모',
      ok: paid && memos > 0,
      reason: !paid ? '유료·메모권 필요 (P16-04)' : memos <= 0 ? '메모권 소진' : null,
    },
    {
      key: 'request_doc',
      label: '요청문(paid_only) 열람',
      ok: paid,
      reason: !paid ? 'paid 권한 필요' : null,
    },
    {
      key: 'pick',
      label: 'Pick 부oost',
      ok: published && tutor.detail_completion_status === 'expanded_complete',
      reason: tutor.detail_completion_status !== 'expanded_complete' ? '상세등록 완료 필요' : !published ? '미공개' : null,
    },
    {
      key: 'prime',
      label: 'Prime 신청',
      ok: paid && published,
      reason: !paid ? 'paid 자격 필요' : !published ? '미공개' : null,
    },
  ];
}

/** @param {TutorRecord} tutor @param {import('./store.js').PublishReadiness} readiness */
export function getExposureMatrix(tutor, readiness) {
  const published = tutor.profile_status === 'published';
  const expanded = tutor.detail_completion_status === 'expanded_complete';
  const paid = isPaidProvider();
  const pickN = countProductConditions(tutor);
  const primeMissing = [
    !paid && '유료',
    !published && '미공개',
    !expanded && '상세 미완료',
  ].filter(Boolean);

  return [
    {
      key: 'search',
      label: 'Basic 검색',
      ok: published && readiness.canPublish,
      reason: !published ? '공개 후 노출' : readiness.canPublish ? null : '필수 항목 미완료',
      statusText: null,
    },
    {
      key: 'compare',
      label: '비교검색',
      ok: published && tutor.compare_eligible && readiness.canPublish,
      reason: !tutor.compare_eligible ? '비교 자격 미충족' : !published ? '미공개' : null,
      statusText: null,
    },
    {
      key: 'pick',
      label: 'Pick',
      ok: published && expanded,
      reason: pickN ? `조건 ${pickN}개 부족` : null,
      statusText: pickN === 0 ? PRODUCT_APPLY.eligible : PRODUCT_APPLY.missing(pickN),
    },
    {
      key: 'prime',
      label: 'Prime',
      ok: paid && published && expanded,
      reason: primeMissing.length ? `조건 ${primeMissing.length}개 부족` : null,
      statusText: primeMissing.length === 0 ? PRODUCT_APPLY.eligible : PRODUCT_APPLY.missing(primeMissing.length),
    },
  ];
}

/** @param {TutorRecord} tutor */
export function getHubCtas(tutor) {
  const readiness = getPublishReadiness(tutor);
  const incomplete = tutor.profile_status === 'draft' || !readiness.canPublish;

  if (incomplete) {
    return [
      { label: '기본정보 보강', path: 'basic', primary: true },
      { label: '상세정보 보강', path: 'detail', primary: false },
      { label: '미리보기·공개', path: 'publish', primary: false },
    ];
  }
  if (tutor.profile_status === 'hidden') {
    return [
      { label: '다시 공개', path: 'publish', primary: true },
      { label: '학생 접근·쪽지', path: 'access', primary: false },
      { label: '학생찾기 보기', external: '#/tutor', primary: false },
    ];
  }
  return [
    { label: '학생 접근·쪽지', path: 'access', primary: true },
    { label: '학생 검토함', path: 'student_review', external: '#/mypage/student-review?from=access', primary: false },
    { label: '학생찾기 보기', path: 'student_search', external: '#/tutor', primary: false },
    { label: '메모권·유료', path: 'plans', external: '#/mypage/plans', primary: false },
  ];
}

/** @param {{ done: number, total: number, label: string }} g */
export function gaugeLabel(g) {
  return `${g.label || ''} ${g.done}/${g.total}`.trim();
}
