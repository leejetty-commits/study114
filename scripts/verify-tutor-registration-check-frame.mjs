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
assert(screens.includes('p19-required'), 'screens: 필수 mark like study-room');
assert(screens.includes('renderReturnToRegistrationCheckBanner'), 'screens: return banner');
assert(screens.includes('data-trc-field'), 'screens: focus fields');
assert(screens.includes('scrollToTutorRcFocus'), 'screens: focus scroll');
assert(screens.includes('isReturnToRegistrationCheck'), 'screens: save return to RC');

assert(render.includes('rc-block--action'), 'render: action blocks');
assert(render.includes('rc-block--compare'), 'render: compare block separate');
assert(render.includes('rc-compare__row--basic'), 'render: BASIC row');
assert(render.includes('rc-compare__row--upgrade'), 'render: PICK+PRIME row');
assert(render.includes("renderBrowseList('tutor'"), 'render: real BASIC tutor list card');
assert(render.includes("renderExposureBox('tutor', 'pick'"), 'render: real PICK card');
assert(render.includes("renderExposureBox('tutor', 'prime'"), 'render: real PRIME card');
assert(render.includes('buildTutorSamplePreviewItem'), 'render: virtual sample cards');
assert(render.includes('rc-sample__card'), 'render: pick sample cell');
assert(render.includes('rc-fold-btn'), 'render: explicit fold button');
assert(render.includes('data-trc-fold'), 'render: fold control');
assert(!render.includes('rc-section--accordion'), 'render: detail1/2 not sibling accordion');
assert(copy.includes("detail: '상세정보'"), 'copy: 상세정보 parent section');
assert(copy.includes("detail1: '수업 · 가격'"), 'copy: detail1 = 수업 · 가격');
assert(copy.includes("detail2: '학력 · 소개 · 연락'"), 'copy: detail2 = 학력 · 소개 · 연락');
assert(render.includes('rc-publish'), 'render: publish wrap');
assert(render.includes('rc-next'), 'render: next action');
assert(render.includes('data-trc-expand'), 'render: tutor expand namespace');
const pageFn = render.slice(render.indexOf('export function renderTutorRegistrationCheck'));
assert(pageFn.includes('pickMissingTitle'), 'page: pick action');
assert(pageFn.includes('primeMissingTitle'), 'page: prime action');
assert(pageFn.includes('${renderCards(vm)}'), 'page: independent cards');
assert(
  pageFn.indexOf('primeMissingTitle') < pageFn.indexOf('${renderCards(vm)}'),
  'page: cards after prime action block',
);
assert(pageFn.indexOf('${renderBoard(vm)}') < pageFn.indexOf('${renderPublishActions(vm)}'), 'page: CTA after board');

assert(model.includes('buildTutorRegistrationCheckModel'), 'model export');
assert(model.includes('missingForTier(okMap, TRC_PICK_FIELD_IDS'), 'model: pick extras only');
assert(model.includes('missingForTier(okMap, TRC_PRIME_FIELD_IDS'), 'model: prime extras only');
assert(model.includes('tutor && typeof tutor === \'object\''), 'model: null-safe tutor');
assert(model.includes("id: 'detail'"), 'model: 상세정보 parent');
assert(model.includes('children: [detail1, detail2]'), 'model: 상세정보1/2 as children');
assert(!model.includes("row('teaching_style'"), 'model: no teaching_style ghost row');
assert(!model.includes("row('education_doc'"), 'model: no education_doc ghost row');
assert(!model.includes("row('grade_band'"), 'model: grade_band not on basic form');
assert(model.includes("row('fee_description'"), 'model: 가격 설명');
assert(model.includes("row('major_name'"), 'model: 전공 단독');
assert(model.includes("'monthly_session_count'"), 'model: 월 총 횟수 단독');
assert(copy.includes("basicKicker: '내 현재 BASIC'"), 'copy: BASIC kicker');
assert(copy.includes("pickMissingTitle: '[픽] 추가 입력'"), 'copy: pick title');
assert(copy.includes("primeMissingTitle: '[프라임] 추가 입력'"), 'copy: prime title');
assert(!copy.includes('베이직 검색은 기본정보만으로도 가능합니다'), 'copy: no study-room basic-only claim');
assert(css.includes('rc-compare--stack'), 'css: stack layout');
assert(css.includes('[data-trc-page] .rc-sample__card--pick'), 'css: pick home-cell width');
assert(css.includes('[data-trc-page] .rc-fold-btn'), 'css: fold button');
assert(css.includes('[data-trc-page] .rc-publish'), 'css: tutor publish scoped');

assert(router.includes('stripHashQuery'), 'router: strip query');
assert(TRC_PICK_FIELD_IDS.every((id) => !TRC_BASIC_FIELD_IDS.includes(id)), 'pick extras disjoint from basic');
assert(TRC_PRIME_FIELD_IDS.every((id) => !TRC_BASIC_FIELD_IDS.includes(id)), 'prime extras disjoint from basic');
assert(TRC_PRIME_FIELD_IDS.every((id) => !TRC_PICK_FIELD_IDS.includes(id)), 'prime extras disjoint from pick');
assert(TRC_PICK_FIELD_IDS.includes('feature_1'), 'pick: feature_1');
assert(TRC_PRIME_FIELD_IDS.includes('intro_long'), 'prime: intro_long');
assert(!TRC_PICK_FIELD_IDS.includes('display_name'), 'pick does not repeat display_name');

const boardIds = [
  ...TRC_BOARD_BASIC_FIELDS,
  ...TRC_BOARD_DETAIL1_FIELDS,
  ...TRC_BOARD_DETAIL2_FIELDS,
].map((f) => f.id);
assert(boardIds.length === new Set(boardIds).size, 'board field ids unique');
assert(TRC_BOARD_BASIC_FIELDS.map((f) => f.id).join(',') === 'display_name,main_subject,primary_region', 'basic tab 1:1');
assert(
  TRC_BOARD_DETAIL1_FIELDS.map((f) => f.id).join(',') ===
    'fee,fee_basis,lessons_per_week,monthly_session_count,minutes,student_gender_group,student_count_group,lesson_places,fee_description',
  'detail1 = 수업 · 가격 1:1',
);
assert(
  TRC_BOARD_DETAIL2_FIELDS.map((f) => f.id).join(',') ===
    'university_name,major_name,university_status,feature_1,feature_2,feature_3,intro_short,profile_image,intro_long,contact_time_note',
  'detail2 = 학력 · 소개 · 연락 1:1',
);

const sample = read('preview/home-ui/src/tutor-reg/registration-check-sample.js');
assert(sample.includes('tutor-card-sample.jpg'), 'sample: virtual portrait asset');
assert(sample.includes("tutor_display_name: '김하린'"), 'sample: filled name');
assert(
  existsSync(resolve(root, 'preview/home-ui/public/assets/brand/tutor-card-sample.jpg')),
  'sample image in home-ui public',
);
assert(screens.includes('data-trc-field="fee_description"'), 'screens: 가격 설명 focus');
assert(screens.includes('data-trc-field="major_name"'), 'screens: 전공 focus');
assert(screens.includes('data-trc-field="monthly_session_count"'), 'screens: 월 총 횟수 focus');

const html = renderTutorRegistrationCheck(
  buildTutorRegistrationCheckModel({ id: 1, tutor_display_name: '내프로필쌤' }, {}),
);
assert(html.includes('data-rc-section="basic"'), 'html: 기본정보 section');
assert(html.includes('data-rc-section="detail"'), 'html: 상세정보 same-level section');
assert(html.includes('data-rc-subsection="detail1"'), 'html: 수업 · 가격 subsection');
assert(html.includes('data-rc-subsection="detail2"'), 'html: 학력 · 소개 · 연락 subsection');
assert(html.includes('수업 · 가격'), 'html: detail1 label');
assert(html.includes('학력 · 소개 · 연락'), 'html: detail2 label');
assert(html.includes('펼치기'), 'html: detail fold button');
assert(html.includes('접기'), 'html: basic fold button');
assert(html.includes('김하린'), 'html: virtual sample name');
assert(html.includes('내프로필쌤'), 'html: board uses live tutor');
assert(html.includes('tutor-card-sample.jpg'), 'html: virtual sample image');
assert(html.includes('expo-basic--tutor'), 'html: BASIC home card');
assert(html.includes('expo-card--pick'), 'html: PICK home card');
assert(html.includes('expo-card--prime'), 'html: PRIME home card');

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
