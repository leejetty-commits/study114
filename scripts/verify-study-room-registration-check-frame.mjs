/**
 * 공부방 등록점검 — 과외쌤과 같은 공통 프레임 (카드 샘플 없음, 2026-10-09 견본카드 제거)
 * publish CTA 제거 이후: 현황판(Pick/Prime)만 검증. 삭제된 RC_COPY.publish / data-p20-publish 경로 금지.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { RC_COPY } from '../preview/home-ui/src/study-room-reg/registration-check-copy.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
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

const screens = read('preview/home-ui/src/study-room-reg/screens.js');
const render = read('preview/home-ui/src/study-room-reg/registration-check-render.js');
const model = read('preview/home-ui/src/study-room-reg/registration-check-model.js');
const copy = read('preview/home-ui/src/study-room-reg/registration-check-copy.js');
const css = read('preview/home-ui/src/styles/registration-check.css');
const edit = read('preview/home-ui/src/study-room-reg/registration-check-edit.js');
const store = read('preview/home-ui/src/study-room-reg/store.js');
const tutorRender = read('preview/home-ui/src/tutor-reg/registration-check-render.js');
const tutorModel = read('preview/home-ui/src/tutor-reg/registration-check-model.js');
const tutorCopy = read('preview/home-ui/src/tutor-reg/registration-check-copy.js');
const tutorEdit = read('preview/home-ui/src/tutor-reg/registration-check-edit.js');

assert(screens.includes('buildRegistrationCheckModel(registerState, room,'), 'screens: passes readiness into RC');
assert(!screens.includes('getPublishReadiness'), 'screens: no publish-readiness CTA wiring');
assert(screens.includes('profileStatus: room.profile_status'), 'screens: passes profileStatus only');
assert(screens.includes('bindRegistrationCheckEvents'), 'screens: binds RC events');
assert(screens.includes('renderRegistrationCheck(vm)'), 'screens: uses RC renderer');
assert(!screens.includes('공개 필수 체크리스트'), 'screens: old checklist title removed');

assert(render.includes('rc-next'), 'render: next action');
assert(render.includes('rc-block--action'), 'render: pick/prime action blocks');
assert(!render.includes('renderCards'), 'render: no card sample block');
assert(!render.includes('renderRegistrationCheckCardSamples'), 'render: no shared home-card samples');
assert(!render.includes('home-card-samples'), 'render: no home-card-samples import');
assert(!render.includes('data-rc-expand'), 'render: no expand on samples');
assert(!render.includes('rc-block--compare'), 'render: no compare sample block');
for (const rel of [
  'preview/home-ui/src/home-card-samples/render.js',
  'preview/home-ui/src/home-card-samples/presets.js',
  'preview/home-ui/src/home-card-samples/guides.js',
  'preview/home-ui/src/styles/home-card-samples.css',
]) {
  assert(!existsSync(resolve(root, rel)), `sample module removed: ${rel}`);
}
assert(!render.includes('rc-compare__grid'), 'render: old 3-col grid removed');
assert(!render.includes('rc-tier rc-tier--'), 'render: old rc-tier sample removed');
assert(render.includes('data-rc-fold'), 'render: fold control');
assert(!render.includes('rc-publish'), 'render: publish wrap removed');
assert(!render.includes('rc-publish__summary'), 'render: publish summary removed');
assert(!render.includes('data-p20-publish'), 'render: publish CTA removed');
assert(!render.includes('data-p20-confirm'), 'render: self-check removed');
assert(render.includes('data-rc-subsection="${esc(child.id)}"'), 'render: subsection from board children');
assert(render.includes('data-rc-section="${esc(sec.id)}"'), 'render: section ids');
const mainJs = read('preview/home-ui/src/main.js');
assert(!mainJs.includes('home-card-samples'), 'main: home-card-samples.css not linked');
assert(!css.includes('0.85fr') && !css.includes('1.25fr'), 'rc css: no artificial pick/prime stretch');
assert(!css.includes('[data-trc-page] .rc-sample__card--prime'), 'rc css: no legacy trc rc-sample prime width');
assert(!css.includes('minmax(0, 28rem)'), 'rc css: no 28rem basic cap');

const tokens = read('preview/home-ui/src/styles/tokens.css');
assert(tokens.includes('--expo-prime-media-height-scale: 1.3'), 'tokens: prime media height ×1.3');
assert(!tokens.includes('--expo-prime-media-ratio'), 'tokens: no aspect-ratio swap token');

const listings = read('preview/home-ui/src/styles/home-listings.css');
assert(listings.includes('aspect-ratio: 160 / 117'), 'listings: prime 16:9×1.3 via aspect-ratio (no cqw collapse)');
assert(!listings.includes('--expo-prime-media-ratio'), 'listings: no aspect-ratio swap token');
assert(!listings.includes('100cqw * 9 / 16'), 'listings: no cqw prime height');
assert(!listings.includes('container-name: expo-prime-media'), 'listings: no expo-prime-media cqw container');

const pageFn = render.slice(render.indexOf('export function renderRegistrationCheck'));
assert(pageFn.includes('pickMissingTitle'), 'page: pick action');
assert(pageFn.includes('primeMissingTitle'), 'page: prime action');
assert(pageFn.indexOf('primeMissingTitle') < pageFn.indexOf('${renderBoard(vm)}'), 'page: board right after pick/prime (no cards)');
assert(!pageFn.includes('renderPublishActions'), 'page: publish CTA removed');
assert(pageFn.indexOf('renderHeader(vm)') < pageFn.indexOf('renderPromoCopy(vm)'), 'page: header first');

assert(model.includes('children: [detail1, detail2]'), 'model: 상세정보 parent with children');
assert(model.includes("id: 'detail1'"), 'model: 상세정보1 child id');
assert(model.includes("id: 'detail2'"), 'model: 상세정보2 child id');
assert(model.includes('collapsedDefault: true'), 'model: detail collapsed');
assert(model.includes('collapsedDefault: false'), 'model: basic open');
assert(model.includes('nextAction('), 'model: single next action');
assert(model.includes('function nextAction('), 'model: nextAction helper');
assert(!model.includes("id: 'publish'"), 'model: no publish badge');
assert(model.includes("id: 'basic'"), 'model: basic board section');
assert(model.includes("id: 'pick'"), 'model: pick badge');
assert(model.includes("id: 'prime'"), 'model: prime badge');
assert(!model.includes("label: RC_COPY.badges.basicReg"), 'model: no fake 기본정보 등록완료');
assert(!model.includes("id: 'progress'"), 'model: no % progress badge');
assert(!model.includes('rc-stat--sentence'), 'model: no long sentence badges');

assert(!copy.includes('publishOk') && !/publish\s*:\s*\{/.test(copy), 'copy: no publish CTA block');
assert(copy.includes("pickMissingTitle: '[픽] 추가 입력"), 'copy: pick title');
assert(copy.includes("detail: '상세정보'"), 'copy: 상세정보 parent');
assert(copy.includes("detail1: '상세정보1'"), 'copy: 상세정보1 child');
assert(copy.includes("detail2: '상세정보2'"), 'copy: 상세정보2 child');
assert(copy.includes("done: '현황만 확인하면 됩니다'"), 'copy: next done');
assert(!copy.includes('자기확인'), 'copy: no self-check publish copy');
assert(!copy.includes('베이직 검색은 기본정보만으로도 가능합니다'), 'copy: no basic-only claim');
assert(typeof RC_COPY.next.fill === 'function', 'copy: next.fill helper');
assert(RC_COPY.next.fill('대표 이미지 1장 이상') === '대표 이미지 1장 이상 입력하러 가기', 'copy: next fill label');
assert(typeof RC_COPY.publish === 'undefined', 'copy: RC_COPY.publish undefined (CTA removed)');
assert(RC_COPY.badges.pickNeed(2) === '픽 추가 2개', 'copy: pick remaining chip');
assert(RC_COPY.badges.primeNeed(2) === '프라임 추가 2개', 'copy: prime remaining chip');

assert(css.includes('[data-rc-page] .rc-next'), 'css: study-room next');
assert(css.includes('[data-rc-page] .rc-fold-btn'), 'css: study-room fold');
assert(css.includes('[data-rc-page] .rc-subsection'), 'css: study-room subsection');
assert(css.includes('rc-compare--stack'), 'css: stack layout available');
assert(css.includes('[data-trc-page] .rc-fold-btn'), 'css: tutor fold untouched');

assert(!edit.includes('[data-rc-expand]'), 'edit: no expand sample');
assert(!edit.includes('buildStudyRoomSampleItem'), 'edit: no virtual sample item');
assert(edit.includes('[data-rc-fold]'), 'edit: fold handler');
assert(!edit.includes('[data-p20-publish]'), 'edit: no publish CTA handler');
assert(!edit.includes('[data-p20-confirm]'), 'edit: no self-check gate');
assert(!edit.includes('publishStudyRoom'), 'edit: no publishStudyRoom action');

assert(store.includes('export function getPublishChecklistItems'), 'store: publish checklist SSOT');
assert(store.includes('export function getPublishReadiness'), 'store: publish readiness SSOT');
assert(store.includes("id: 'name', label: '공부방명'"), 'store: publish policy fields kept');
assert(store.includes("id: 'region', label: '대표 홍보지역'"), 'store: region item kept');
assert(!store.includes("id: 'contact', label: '문의·쪽지 방식'"), 'store: contact publish item removed');

assert(tutorRender.includes('renderTutorRegistrationCheck'), 'tutor render untouched marker');
assert(tutorModel.includes('buildTutorRegistrationCheckModel'), 'tutor model untouched marker');
assert(tutorCopy.includes("detail1: '수업 · 가격'"), 'tutor copy labels untouched');
assert(!tutorEdit.includes('data-trc-expand'), 'tutor edit: no expand sample');
assert(!tutorModel.includes('study-room-reg'), 'tutor model not mixed with study-room copy');
assert(!tutorRender.includes('data-rc-page'), 'tutor render stays on data-trc-page');

if (failed > 0) {
  console.error(`\nstudy-room registration-check frame FAILED (${failed})`);
  process.exit(1);
}
console.log('\nstudy-room registration-check frame OK');
