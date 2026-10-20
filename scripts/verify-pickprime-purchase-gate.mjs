/**
 * 273 — 픽·프라임 구매 필수 항목. 결제 완료는 보지 않는다.
 */
import './verify-dom-storage-shim.mjs';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { TUTOR_DETAIL_FIELDS } from '../preview/shared/tutor-detail-fields.js';
import {
  ROOM_PICK_IDS,
  ROOM_PRIME_IDS,
  TUTOR_PICK_IDS,
  TUTOR_PRIME_IDS,
  TIER_MARK_NOTE,
  teachingStylePickAllowed,
  tutorTierMissing,
} from '../preview/shared/pickprime-requirements.js';
import { TRC_PICK_FIELD_IDS, TRC_PRIME_FIELD_IDS } from '../preview/home-ui/src/tutor-reg/registration-check-copy.js';
import { RC_PICK_FIELD_IDS, RC_PRIME_FIELD_IDS } from '../preview/home-ui/src/study-room-reg/registration-check-copy.js';
import { formatTeachingStyleBadges } from '../preview/home-ui/src/exposure-format.js';
import { renderContactFormHtml } from '../preview/tutor-ui/src/screens/step-contact.js';
import { renderLessonFormHtml, lessonSaveGuard } from '../preview/study-room-ui/src/screens/step-lesson.js';
import { renderFacilityFormHtml } from '../preview/study-room-ui/src/screens/step-facility.js';
import { getEligibility, rememberTierCheck } from '../preview/home-ui/src/plans/screens.js';

const root = process.cwd();
let failed = 0;

function assert(cond, msg) {
  if (!cond) {
    failed += 1;
    console.error('FAIL:', msg);
  } else {
    console.log('PASS:', msg);
  }
}

function read(rel) {
  return readFileSync(resolve(root, rel), 'utf8');
}

function sameIds(a, b) {
  return a.join(',') === b.join(',');
}

const php = read('src/Paid/TierRequirement.php');
function phpIds(name) {
  const match = php.match(new RegExp(`const ${name} = \\[([\\s\\S]*?)\\];`));
  if (!match) return [];
  return [...match[1].matchAll(/'([^']+)'/g)].map((item) => item[1]);
}

assert(sameIds(phpIds('TUTOR_PICK_IDS'), TUTOR_PICK_IDS), 'php tutor pick ids');
assert(sameIds(phpIds('TUTOR_PRIME_IDS'), TUTOR_PRIME_IDS), 'php tutor prime ids');
assert(sameIds(phpIds('ROOM_PICK_IDS'), ROOM_PICK_IDS), 'php room pick ids');
assert(sameIds(phpIds('ROOM_PRIME_IDS'), ROOM_PRIME_IDS), 'php room prime ids');

const tutorCopy = read('preview/home-ui/src/tutor-reg/registration-check-copy.js');
const roomCopy = read('preview/home-ui/src/study-room-reg/registration-check-copy.js');
assert(tutorCopy.includes('TUTOR_PICK_IDS') && !tutorCopy.includes("['feature_1', 'student_target']"), 'trc uses shared pick ids');
assert(roomCopy.includes('ROOM_PICK_IDS') && !roomCopy.includes("['cover', 'intro_short', 'fee', 'teaching_style']"), 'rc uses shared pick ids');
assert(sameIds(TRC_PICK_FIELD_IDS, TUTOR_PICK_IDS) && sameIds(TRC_PRIME_FIELD_IDS, TUTOR_PRIME_IDS), 'trc id values');
assert(sameIds(RC_PICK_FIELD_IDS, ROOM_PICK_IDS) && sameIds(RC_PRIME_FIELD_IDS, ROOM_PRIME_IDS), 'rc id values');

for (const id of ['teaching_style_badges', 'intro_long', 'feature_2', 'feature_3']) {
  const field = TUTOR_DETAIL_FIELDS.find((item) => item.id === id);
  const label = typeof field.label === 'function' ? field.label({}) : field.label;
  const hit = tutorTierMissing({}, 'prime').find((item) => item.id === id);
  assert(hit && hit.label === label, `label ${id} = ${label}`);
}
assert(
  tutorTierMissing({}, 'pick').find((item) => item.id === 'school_or_career')?.label === '학교·학과 또는 경력',
  'school bundle label',
);

const screens = read('preview/home-ui/src/plans/screens.js');
const eligibilitySrc = screens.slice(screens.indexOf('export function getEligibility'), screens.indexOf('function renderPositionCard'));
assert(!eligibilitySrc.includes('성과 불이익'), 'eligibility: old tutor comment gone');
assert(!eligibilitySrc.includes('expanded_complete'), 'eligibility: no expanded_complete');
assert(!eligibilitySrc.includes('tutorTierMissing') && !eligibilitySrc.includes('roomTierMissing') && eligibilitySrc.includes('tierPurchaseGate'), 'eligibility reads tier-check cache');
const blocks = read('preview/home-ui/src/plans/order-blocks.js');
const roomState = blocks.slice(blocks.indexOf('export function studyRoomRegionPurchaseState'), blocks.indexOf('function tutorRegionPurchaseState'));
assert(!roomState.includes('expanded_complete'), 'order block: no expanded_complete');
assert(!roomState.includes('roomTierMissing') && roomState.includes('tierPurchaseGate'), 'order block reads tier-check cache');
const tutorState = blocks.slice(blocks.indexOf('function tutorRegionPurchaseState'), blocks.indexOf('export function listTutorApplyCities'));
assert(!tutorState.includes('tutorTierMissing') && tutorState.includes('tierPurchaseGate'), 'tutor order block reads tier-check cache');
assert(screens.includes('fetchTierCheck') && screens.includes('scheduleTierCheckHydrate'), 'plans fills tier-check cache');
const exposure = read('preview/home-ui/src/exposure-render.js');
const styleLines = exposure.split('\n').filter((line) => line.includes('formatTeachingStyleBadges(item.teaching_style_badges'));
assert(styleLines.filter((line) => line.includes('featureMax === 1 ? 1 : 3')).length === 2, 'pick and prime style counts follow featureMax');
assert(styleLines.filter((line) => line.includes(', 2)')).length === 2, 'student cards stay at 2');

sessionStorage.setItem(
  'study114-preview-tutors-v1',
  JSON.stringify({
    tutors: [
      { id: 11, profile_status: 'published' },
      {
        id: 12,
        profile_status: 'published',
        university_name: '서울대',
        main_material_note: '수학의 정석',
        teaching_style_badges: ['passion'],
      },
    ],
  }),
);
const pendingTutor = getEligibility({ providerType: 'tutor', id: 11 }, 'pick');
assert(pendingTutor.canBuy === false && pendingTutor.missing.includes('구매 조건을 확인하고 있어요'), 'tier cache pending blocks');
rememberTierCheck('tutor', 11, {
  pick: {
    can_buy: false,
    missing: [
      { id: 'school_or_career', label: '학교·학과 또는 경력' },
      { id: 'teaching_style_badges', label: '강의스타일' },
    ],
    message: '픽 정보 부족 · 등록점검에서 남은 항목을 채우면 구매가 열립니다',
  },
  prime: { can_buy: false, missing: [], message: '' },
});
const emptyTutor = getEligibility({ providerType: 'tutor', id: 11 }, 'pick');
assert(emptyTutor.canBuy === false && emptyTutor.missing.some((line) => line.includes('등록점검에서 남은 항목을 채우면 구매가 열립니다')), 'empty tutor pick blocked');
assert(emptyTutor.missing.includes('학교·학과 또는 경력') && emptyTutor.missing.includes('강의스타일') && !emptyTutor.missing.includes('주교재'), 'empty tutor names');
rememberTierCheck('tutor', 12, {
  pick: { can_buy: true, missing: [], message: '' },
  prime: {
    can_buy: false,
    missing: [
      { id: 'intro_long', label: '상세 소개' },
      { id: 'feature_2', label: '특징 2' },
      { id: 'feature_3', label: '특징 3' },
    ],
    message: '프라임 정보 부족 · 등록점검에서 남은 항목을 채우면 구매가 열립니다',
  },
});
const pickTutor = getEligibility({ providerType: 'tutor', id: 12 }, 'pick');
const primeTutor = getEligibility({ providerType: 'tutor', id: 12 }, 'prime');
assert(pickTutor.canBuy === true, 'pick fields open pick');
assert(primeTutor.canBuy === false && primeTutor.missing.includes('상세 소개') && primeTutor.missing.includes('특징 2') && primeTutor.missing.includes('특징 3'), 'prime still blocked');

sessionStorage.setItem(
  'study114-preview-study-rooms-v1',
  JSON.stringify({
    rooms: [
      {
        id: 21,
        profile_status: 'published',
        detail_completion_status: 'expanded_complete',
        saved_regions: [{ region_id: '9', region_label: '서울 강남구 역삼동', region_basis_type: 'dong' }],
      },
      {
        id: 22,
        profile_status: 'published',
        detail_completion_status: 'basic_only',
        intro_short: '한 줄',
        monthly_fee_manwon: '30',
        teaching_style_ids: ['kind'],
        lessons_per_week: '',
        images: [{ image_type: 'cover', image_path: '/uploads/room-cover.jpg' }],
        saved_regions: [{ region_id: '9', region_label: '서울 강남구 역삼동', region_basis_type: 'dong' }],
      },
    ],
  }),
);
rememberTierCheck('study_room', 21, {
  pick: {
    can_buy: false,
    missing: [{ id: 'cover', label: '대표사진' }],
    message: '픽 정보 부족 · 등록점검에서 남은 항목을 채우면 구매가 열립니다',
  },
  prime: { can_buy: false, missing: [{ id: 'cover', label: '대표사진' }], message: '' },
});
rememberTierCheck('study_room', 22, {
  pick: { can_buy: true, missing: [], message: '' },
  prime: { can_buy: false, missing: [{ id: 'intro_long', label: '공부방 소개 / 자랑' }], message: '' },
});
const emptyRoom = getEligibility({ providerType: 'study_room', id: 21 }, 'pick');
assert(emptyRoom.canBuy === false && emptyRoom.missing.some((line) => line.includes('등록점검에서 남은 항목을 채우면 구매가 열립니다')), 'expanded_complete alone does not open pick');
const roomPick = getEligibility({ providerType: 'study_room', id: 22 }, 'pick');
assert(roomPick.canBuy === true, 'pick fields open without expanded_complete');

const contact = renderContactFormHtml({ includeStepNav: true });
const lesson = renderLessonFormHtml({ includeStepNav: true });
const facility = renderFacilityFormHtml({ includeStepNav: true });
assert((contact.match(/form-label--tier/g) || []).length === 6, 'tutor tier marks = 6 labels / 5 bundles');
assert(contact.includes('>주교재</label>') && !contact.includes('form-label--tier">주교재'), '주교재 star removed');
assert(contact.includes(TIER_MARK_NOTE), 'tutor note');
assert(contact.includes('둘 중 하나'), 'school or career hint');
assert(contact.includes('최대 4개') && contact.includes('강의스타일은 4개까지 고를 수 있어요'), 'style limit copy');
assert(!contact.includes('validateCareerState'), 'contact render does not add a save block');
assert((lesson.match(/form-label--tier/g) || []).length === 7, 'room lesson marks');
assert((facility.match(/form-label--tier/g) || []).length === 1, 'room facility mark');
assert(lesson.includes(TIER_MARK_NOTE) && facility.includes(TIER_MARK_NOTE), 'room notes');
assert(!lesson.includes('form-label--tier">수업운영방식') && !lesson.includes('form-label--required'), 'operation and capacity marks removed');
assert(lesson.includes('>수업운영방식</span>'), 'operation label remains');
assert(lesson.includes('for="capacity_per_time">타임별 원생수</label>'), 'capacity label remains');
assert(!lesson.includes('form-label--tier" for="capacity_per_time"'), 'capacity is not a tier mark');
assert(lessonSaveGuard() === '', 'room lesson save not blocked');
assert(teachingStylePickAllowed(4) === true && teachingStylePickAllowed(5) === false, 'fifth style blocked, four allowed');
assert(read('preview/tutor-ui/src/screens/step-contact.js').includes('box.checked = false'), 'ui unchecks the fifth style');

assert(formatTeachingStyleBadges([], 3) === '—', 'styles empty');
assert(formatTeachingStyleBadges(['passion', 'meticulous', 'kind'], 3) === '열정 · 꼼꼼 · 친절', 'styles 3 max 3');
assert(!formatTeachingStyleBadges(['passion', 'meticulous', 'kind'], 3).includes('외'), 'styles 3 has no extra');
assert(formatTeachingStyleBadges(['passion', 'meticulous', 'kind', 'from_basics'], 3) === '열정 · 꼼꼼 · 친절 외 1', 'styles 4 max 3');
assert(formatTeachingStyleBadges(['passion', 'meticulous', 'kind', 'from_basics', 'concept_focus'], 2) === '열정 · 꼼꼼 외 3', 'styles 5 max 2');
assert(tutorTierMissing({ teaching_style_badges: ['passion'] }, 'pick').every((item) => item.id !== 'teaching_style_badges'), 'one style satisfies pick');

if (failed) {
  console.error(`verify-pickprime-purchase-gate: ${failed} failed`);
  process.exit(1);
}
console.log('verify-pickprime-purchase-gate: ok');
