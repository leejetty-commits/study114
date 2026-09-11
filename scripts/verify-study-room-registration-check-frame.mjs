/**
 * 공부방 등록점검 — 과외쌤과 같은 공통 프레임 (카드 샘플 유지)
 */
import { readFileSync } from 'node:fs';
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
assert(screens.includes('getPublishReadiness(room)'), 'screens: publish readiness SSOT unchanged');
assert(screens.includes('bindRegistrationCheckEvents'), 'screens: binds RC events');
assert(screens.includes('renderRegistrationCheck(vm)'), 'screens: uses RC renderer');
assert(!screens.includes('공개 필수 체크리스트'), 'screens: old checklist title removed');

assert(render.includes('rc-next'), 'render: next action');
assert(render.includes('rc-block--action'), 'render: pick/prime action blocks');
assert(render.includes('${renderCards(vm)}'), 'render: cards independent');
assert(render.includes('rc-block--compare'), 'render: compare block separate from missing');
assert(render.includes('rc-tier rc-tier--'), 'render: existing card sample kept');
assert(render.includes('data-rc-expand'), 'render: existing expand kept');
assert(render.includes('rc-compare__grid'), 'render: existing sample grid kept');
assert(!render.includes('rc-sample__card'), 'render: does not switch to tutor sample markup');
assert(render.includes('data-rc-fold'), 'render: fold control');
assert(render.includes('rc-publish'), 'render: publish wrap');
assert(render.includes('rc-publish__summary'), 'render: publish summary above CTA');
assert(render.includes('data-p20-publish'), 'render: publish CTA');
assert(render.includes('data-p20-confirm'), 'render: self-check');
assert(render.includes('data-rc-subsection="${esc(child.id)}"'), 'render: subsection from board children');
assert(render.includes('data-rc-section="${esc(sec.id)}"'), 'render: section ids');

const pageFn = render.slice(render.indexOf('export function renderRegistrationCheck'));
assert(pageFn.includes('pickMissingTitle'), 'page: pick action');
assert(pageFn.includes('primeMissingTitle'), 'page: prime action');
assert(pageFn.indexOf('pickMissingTitle') < pageFn.indexOf('${renderCards(vm)}'), 'page: cards after pick/prime');
assert(pageFn.indexOf('${renderBoard(vm)}') < pageFn.indexOf('${renderPublishActions(vm)}'), 'page: CTA after board');
assert(pageFn.indexOf('renderHeader(vm)') < pageFn.indexOf('renderPromoCopy(vm)'), 'page: header first');

assert(model.includes('children: [detail1, detail2]'), 'model: 상세정보 parent with children');
assert(model.includes("id: 'detail1'"), 'model: 상세정보1 child id');
assert(model.includes("id: 'detail2'"), 'model: 상세정보2 child id');
assert(model.includes('collapsedDefault: true'), 'model: detail collapsed');
assert(model.includes('collapsedDefault: false'), 'model: basic open');
assert(model.includes('nextAction('), 'model: single next action');
assert(model.includes('function nextAction('), 'model: nextAction helper');
assert(model.includes("id: 'publish'"), 'model: publish badge');
assert(model.includes("id: 'basic'"), 'model: basic badge');
assert(model.includes("id: 'pick'"), 'model: pick badge');
assert(model.includes("id: 'prime'"), 'model: prime badge');
assert(!model.includes("label: RC_COPY.badges.basicReg"), 'model: no fake 기본정보 등록완료');
assert(!model.includes("id: 'progress'"), 'model: no % progress badge');
assert(!model.includes('rc-stat--sentence'), 'model: no long sentence badges');

assert(copy.includes("publishOk: '공개 가능'"), 'copy: publish badge');
assert(copy.includes("pickMissingTitle: '[픽] 추가 입력'"), 'copy: pick title');
assert(copy.includes("detail: '상세정보'"), 'copy: 상세정보 parent');
assert(copy.includes("detail1: '상세정보1'"), 'copy: 상세정보1 child');
assert(copy.includes("detail2: '상세정보2'"), 'copy: 상세정보2 child');
assert(copy.includes('자기확인 후 공개하기'), 'copy: next publish');
assert(copy.includes('공개 전 자기확인'), 'copy: self-check title');
assert(!copy.includes('베이직 검색은 기본정보만으로도 가능합니다'), 'copy: no basic-only claim');
assert(typeof RC_COPY.next.fill === 'function', 'copy: next.fill helper');
assert(RC_COPY.next.fill('대표 이미지 1장 이상') === '대표 이미지 1장 이상 입력하러 가기', 'copy: next fill label');
assert(RC_COPY.publish.summaryNeed(2).includes('2개'), 'copy: publish summary uses count');
assert(RC_COPY.badges.basicNeed(2) === 'Basic 2개 부족', 'copy: basic remaining chip');

assert(css.includes('[data-rc-page] .rc-next'), 'css: study-room next');
assert(css.includes('[data-rc-page] .rc-fold-btn'), 'css: study-room fold');
assert(css.includes('[data-rc-page] .rc-publish'), 'css: study-room publish');
assert(css.includes('[data-rc-page] .rc-subsection'), 'css: study-room subsection');
assert(css.includes('.rc-tier--preview'), 'css: existing sample tiers kept');
assert(css.includes('.rc-compare__grid'), 'css: existing sample grid kept');
assert(css.includes('[data-trc-page] .rc-fold-btn'), 'css: tutor fold untouched');
assert(css.includes('[data-trc-page] .rc-sample__card--pick'), 'css: tutor sample width untouched');

assert(edit.includes('[data-rc-expand]'), 'edit: expand sample kept');
assert(edit.includes('[data-rc-fold]'), 'edit: fold handler');
assert(edit.includes('[data-p20-publish]'), 'edit: publish CTA handler');
assert(edit.includes('[data-p20-confirm]'), 'edit: self-check gate');
assert(edit.includes('publishStudyRoom(roomId)'), 'edit: existing publish action');

assert(store.includes('export function getPublishChecklistItems'), 'store: publish checklist SSOT');
assert(store.includes('export function getPublishReadiness'), 'store: publish readiness SSOT');
assert(store.includes("id: 'name', label: '공부방명'"), 'store: publish policy fields kept');
assert(store.includes("id: 'contact', label: '문의·쪽지 방식'"), 'store: contact item kept');

assert(tutorRender.includes('renderTutorRegistrationCheck'), 'tutor render untouched marker');
assert(tutorModel.includes('buildTutorRegistrationCheckModel'), 'tutor model untouched marker');
assert(tutorCopy.includes("detail1: '수업 · 가격'"), 'tutor copy labels untouched');
assert(tutorEdit.includes('data-trc-expand'), 'tutor edit expand untouched');
assert(!tutorModel.includes('study-room-reg'), 'tutor model not mixed with study-room copy');
assert(!tutorRender.includes('data-rc-page'), 'tutor render stays on data-trc-page');

if (failed > 0) {
  console.error(`\nstudy-room registration-check frame FAILED (${failed})`);
  process.exit(1);
}
console.log('\nstudy-room registration-check frame OK');
