/**
 * 과외쌤 등록점검 완성 — 프레임 유지 + Basic/Pick/Prime 조건 분리
 */
import './verify-dom-storage-shim.mjs';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  parseTutorRegPath,
  tutorSectionPath,
  BASE,
  TUTOR_REG_TOP_TABS,
  stripHashQuery,
} from '../preview/home-ui/src/tutor-reg/router.js';
import {
  TRC_BASIC_FIELD_IDS,
  TRC_PICK_FIELD_IDS,
  TRC_PRIME_FIELD_IDS,
  TRC_BOARD_BASIC_FIELDS,
  TRC_BOARD_DETAIL1_FIELDS,
  TRC_BOARD_DETAIL2_FIELDS,
} from '../preview/home-ui/src/tutor-reg/registration-check-copy.js';
import { buildTutorRegistrationCheckModel } from '../preview/home-ui/src/tutor-reg/registration-check-model.js';
import { renderTutorRegistrationCheck } from '../preview/home-ui/src/tutor-reg/registration-check-render.js';

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

const screens = read('preview/home-ui/src/tutor-reg/screens.js');
const embed = read('preview/home-ui/src/tutor-reg/embedded-panels.js');
const stepLesson = read('preview/tutor-ui/src/screens/step-lesson.js');
const stepContact = read('preview/tutor-ui/src/screens/step-contact.js');
const detailFields = `${stepLesson}\n${stepContact}\n${embed}`;
const render = read('preview/home-ui/src/tutor-reg/registration-check-render.js');
const model = read('preview/home-ui/src/tutor-reg/registration-check-model.js');
const copy = read('preview/home-ui/src/tutor-reg/registration-check-copy.js');
const css = read('preview/home-ui/src/styles/registration-check.css');
const router = read('preview/home-ui/src/tutor-reg/router.js');

assert(screens.includes('renderTutorRegistrationCheck'), 'screens: uses renderTutorRegistrationCheck');
assert(screens.includes('buildTutorRegistrationCheckModel'), 'screens: builds tutor RC model');
assert(screens.includes('bindTutorRegistrationCheckEvents'), 'screens: binds tutor RC events');
assert(!screens.includes('renderPublishPreviewModes'), 'screens: old preview modes removed');
assert(!screens.includes('공개 필수 체크리스트'), 'screens: old checklist title removed');
assert(!screens.includes('Pick 필수'), 'screens: no Pick 필수 badge');
assert(!screens.includes('Prime 필수'), 'screens: no Prime 필수 badge');
assert(stepLesson.includes('form-label--required'), 'lesson: 산정방식 필수 표시');
assert(screens.includes('renderReturnToRegistrationCheckBanner'), 'screens: return banner');
assert(detailFields.includes('data-trc-field'), 'detail forms: focus fields');
assert(screens.includes('scrollToTutorRcFocus'), 'screens: focus scroll');
assert(screens.includes('isReturnToRegistrationCheck'), 'screens: save return to RC');

assert(render.includes('rc-block--action'), 'render: action blocks');

assert(!render.includes('rc-block--compare'), 'render: no compare sample block');
assert(!render.includes('renderRegistrationCheckCardSamples'), 'render: no shared home-card samples');
assert(!render.includes('home-card-samples'), 'render: no home-card-samples import');
for (const rel of [
  'preview/home-ui/src/home-card-samples/render.js',
  'preview/home-ui/src/home-card-samples/presets.js',
  'preview/home-ui/src/home-card-samples/guides.js',
  'preview/home-ui/src/styles/home-card-samples.css',
]) {
  assert(!existsSync(resolve(root, rel)), `sample module removed: ${rel}`);
}
assert(render.includes('rc-fold-btn'), 'render: explicit fold button');
assert(render.includes('data-trc-fold'), 'render: fold control');
assert(!render.includes('rc-section--accordion'), 'render: detail1/2 not sibling accordion');
assert(copy.includes("detail: '상세정보'"), 'copy: 상세정보 parent section');
assert(copy.includes("detail1: '수업 · 과목 · 가격'"), 'copy: detail1 = 수업 · 과목 · 가격');
assert(copy.includes("detail2: '학력 · 경력 · 특징'"), 'copy: detail2 = 학력 · 경력 · 특징');
assert(!copy.includes('intro_short'), 'copy: intro_short removed');
// 72f0e40·회원 공개 제거: 등록점검에 공개 버튼 영역이 없다(기본등록 완료 = 카드 노출).
assert(!render.includes('rc-publish'), 'render: no publish wrap');
assert(render.includes('rc-next'), 'render: next action');
assert(!render.includes('data-trc-expand'), 'render: no tutor expand sample');
const mainJs = read('preview/home-ui/src/main.js');
assert(!mainJs.includes('home-card-samples'), 'main: home-card-samples.css not linked');
assert(!css.includes('0.85fr') && !css.includes('1.25fr'), 'css: no artificial pick/prime stretch');
assert(!css.includes('[data-trc-page] .rc-sample__card--prime'), 'css: no legacy trc rc-sample prime width');
const pageFn = render.slice(render.indexOf('export function renderTutorRegistrationCheck'));
assert(pageFn.includes('pickMissingTitle'), 'page: pick action');
assert(pageFn.includes('primeMissingTitle'), 'page: prime action');
assert(!pageFn.includes('renderCards'), 'page: no card sample block');
assert(
  pageFn.indexOf('primeMissingTitle') < pageFn.indexOf('${renderBoard(vm)}'),
  'page: board right after prime action block (no cards)',
);
assert(
  pageFn.includes('${renderBoard(vm)}') && !render.includes('renderPublishActions'),
  'page: board without publish CTA',
);

assert(model.includes('buildTutorRegistrationCheckModel'), 'model export');
assert(model.includes('missingForTier(okMap, TRC_PICK_FIELD_IDS'), 'model: pick extras only');
assert(model.includes('missingForTier(okMap, TRC_PRIME_FIELD_IDS'), 'model: prime extras only');
assert(model.includes('tutor && typeof tutor === \'object\''), 'model: null-safe tutor');
assert(model.includes("id: 'detail'"), 'model: 상세정보 parent');
assert(model.includes('children: [detail1, detailCareer, detailPromo, detailPhoto]'), 'model: 상세 그룹 children');
assert(model.includes('TUTOR_DETAIL_FIELDS'), 'model: shared detail fields');
assert(!model.includes("row('teaching_style'"), 'model: no teaching_style ghost row');
assert(!model.includes("row('education_doc'"), 'model: no education_doc ghost row');
assert(!model.includes("row('grade_band'"), 'model: grade_band not on basic form');
assert(model.includes("'monthly_session_count'"), 'model: 월 총 횟수 focus');
assert(!copy.includes('basicKicker'), 'copy: sample kicker removed');
assert(copy.includes("pickMissingTitle: '픽 노출까지 추가 입력'"), 'copy: pick title');
assert(copy.includes("primeMissingTitle: '프라임 노출까지 추가 입력'"), 'copy: prime title');
assert(!copy.includes('베이직 검색은 기본정보만으로도 가능합니다'), 'copy: no study-room basic-only claim');
assert(!css.includes('rc-compare') && !css.includes('rc-block--compare'), 'css: no orphan sample compare rules');
assert(css.includes('[data-trc-page] .rc-fold-btn'), 'css: fold button');
assert(css.includes('[data-trc-page] .rc-publish'), 'css: tutor publish scoped');

assert(router.includes('stripHashQuery'), 'router: strip query');
assert(TRC_PICK_FIELD_IDS.every((id) => !TRC_BASIC_FIELD_IDS.includes(id)), 'pick extras disjoint from basic');
assert(TRC_PRIME_FIELD_IDS.every((id) => !TRC_BASIC_FIELD_IDS.includes(id)), 'prime extras disjoint from basic');
assert(TRC_PICK_FIELD_IDS.every((id) => TRC_PRIME_FIELD_IDS.includes(id)), 'prime includes pick');
assert(
  TRC_PICK_FIELD_IDS.join(',') === 'school_or_career,main_material_note,teaching_style_badges',
  'pick: 학교·학과 또는 경력, 주교재, 강의스타일',
);
assert(TRC_PRIME_FIELD_IDS.includes('intro_long'), 'prime: intro_long');
assert(TRC_PRIME_FIELD_IDS.includes('feature_2') && TRC_PRIME_FIELD_IDS.includes('feature_3'), 'prime: feature 2·3');
assert(!TRC_PICK_FIELD_IDS.includes('display_name'), 'pick does not repeat display_name');
assert(!TRC_PICK_FIELD_IDS.includes('feature_1'), 'pick: feature_1 removed');

const boardIds = [
  ...TRC_BOARD_BASIC_FIELDS,
  ...TRC_BOARD_DETAIL1_FIELDS,
  ...TRC_BOARD_DETAIL2_FIELDS,
].map((f) => f.id);
assert(boardIds.length === new Set(boardIds).size, 'board field ids unique');
assert(
  TRC_BOARD_BASIC_FIELDS.map((f) => f.id).join(',') ===
    'display_name,primary_region,school_level,main_subject,fee,lessons_per_week,minutes,slogan',
  'basic tab 1:1 (정본 73 0-2 기본등록 8개)',
);
assert(
  TRC_BOARD_DETAIL1_FIELDS.map((f) => f.id).join(',') ===
    'student_gender_group,student_count_group,age_band,subjects,fee_basis,schedule,fee_description,lesson_places',
  'detail1 = 수업 · 과목 · 가격 1:1',
);
assert(
  TRC_BOARD_DETAIL2_FIELDS.map((f) => f.id).join(',') ===
    'university_name,major_name,university_status,career_year_band,main_material_note,feature_1,feature_2,feature_3,proof_document_available,teaching_style_badges,intro_long,contact_time_note,promo_channels,profile_image',
  'detail2 = 학력 · 경력 · 특징 / 홍보 / 사진 1:1',
);
assert(!boardIds.includes('intro_short'), 'board: no intro_short');

assert(!existsSync(resolve(root, 'preview/home-ui/src/tutor-reg/registration-check-sample.js')), 'sample: virtual tutor sample module removed');
assert(detailFields.includes('data-trc-field="fee_description"'), 'lesson: 가격 설명 focus');
assert(detailFields.includes('data-trc-field="major_name"'), 'contact: 전공 focus');
assert(detailFields.includes('data-trc-field="monthly_session_count"'), 'lesson: 월 총 횟수 focus');
assert(detailFields.includes('data-trc-field="intro_long"'), 'contact: 상세 소개 focus');
assert(detailFields.includes('data-trc-field="contact_time_note"'), 'contact: 연락 가능 시간 focus');
assert(detailFields.includes('data-trc-field="profile_image"'), 'embed: 프로필 사진 focus');

const html = renderTutorRegistrationCheck(
  buildTutorRegistrationCheckModel({ id: 1, tutor_display_name: '내프로필쌤' }, {}),
);
assert(html.includes('data-rc-section="basic"'), 'html: 기본정보 section');
assert(html.includes('data-rc-section="detail"'), 'html: 상세정보 same-level section');
assert(html.includes('data-rc-subsection="detail1"'), 'html: 수업 · 과목 · 가격 subsection');
assert(html.includes('data-rc-subsection="detail-career"'), 'html: 학력 · 경력 · 특징 subsection');
assert(html.includes('data-rc-subsection="detail-promo"'), 'html: 홍보 채널 subsection');
assert(html.includes('수업 · 과목 · 가격'), 'html: detail1 label');
assert(html.includes('학력 · 경력 · 특징'), 'html: career group label');
assert(!html.includes('학력 · 소개 · 연락'), 'html: old detail2 title gone');
assert(html.includes('>수정</a>'), 'html: row edit link');
assert(html.includes('펼치기'), 'html: detail fold button');
assert(html.includes('접기'), 'html: basic fold button');
assert(!html.includes('김하린'), 'html: no virtual sample name');
assert(html.includes('내프로필쌤'), 'html: board uses live tutor');
assert(!html.includes('tutor-card-sample.jpg'), 'html: no virtual sample image');
assert(!html.includes('expo-basic--tutor'), 'html: no BASIC sample card');
assert(!html.includes('expo-card--pick'), 'html: no PICK sample card');
assert(!html.includes('expo-card--prime'), 'html: no PRIME sample card');

const qPath = `${tutorSectionPath(7, 'detail')}?return=registration-check&focus=intro_long`;
const qRoute = parseTutorRegPath(qPath);
assert(stripHashQuery(qPath) === tutorSectionPath(7, 'detail'), 'stripHashQuery drops return/focus');
assert(qRoute?.screenId === 'P21-03b', 'parse: query does not break detail route');
assert(qRoute?.tutorId === 7, 'parse: tutor id with query');
assert(parseTutorRegPath(`${BASE}/7/publish?return=registration-check`)?.screenId === 'P21-04', 'parse: publish + query');
assert(TUTOR_REG_TOP_TABS.some((t) => t.key === 'publish' && t.label === '등록점검'), 'tab: 등록점검');
assert(TUTOR_REG_TOP_TABS.some((t) => t.key === 'inquiries' && t.label === '쪽지설정'), 'tab: 쪽지설정 still present');

if (failed > 0) {
  console.error(`\ntutor registration-check finish FAILED (${failed})`);
  process.exit(1);
}
console.log('\ntutor registration-check finish OK');
