/**
 * 과외쌤 등록점검 — 공통 RC 프레임 이식 게이트
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

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

assert(screens.includes('renderTutorRegistrationCheck'), 'screens: uses renderTutorRegistrationCheck');
assert(screens.includes('buildTutorRegistrationCheckModel'), 'screens: builds tutor RC model');
assert(screens.includes('bindTutorRegistrationCheckEvents'), 'screens: binds tutor RC events');
assert(!screens.includes('renderPublishPreviewModes'), 'screens: old preview modes removed');
assert(!screens.includes('공개 필수 체크리스트'), 'screens: old checklist title removed');

assert(render.includes('rc-block--action'), 'render: action blocks');
assert(render.includes('rc-block--compare'), 'render: compare block separate');
assert(render.includes('rc-compare__row--basic'), 'render: BASIC row');
assert(render.includes('rc-compare__row--upgrade'), 'render: PICK+PRIME row');
assert(render.includes("renderBrowseList('tutor'"), 'render: real BASIC tutor list card');
assert(render.includes("renderExposureBox('tutor', 'pick'"), 'render: real PICK card');
assert(render.includes("renderExposureBox('tutor', 'prime'"), 'render: real PRIME card');
assert(render.includes('rc-section--accordion'), 'render: detail accordion');
assert(render.includes('완료 ') && render.includes('부족 '), 'render: accordion summary counts');
const pageFn = render.slice(render.indexOf('export function renderTutorRegistrationCheck'));
assert(pageFn.includes('pickMissingTitle'), 'page: pick action');
assert(pageFn.includes('primeMissingTitle'), 'page: prime action');
assert(pageFn.includes('${renderCards(vm)}'), 'page: independent cards');
assert(
  pageFn.indexOf('primeMissingTitle') < pageFn.indexOf('${renderCards(vm)}'),
  'page: cards after prime action block',
);

assert(model.includes('buildTutorRegistrationCheckModel'), 'model export');
assert(copy.includes("basicKicker: '내 현재 BASIC'"), 'copy: BASIC kicker');
assert(copy.includes('pickMissingTitle'), 'copy: pick missing title');
assert(css.includes('rc-compare--stack'), 'css: stack layout');
assert(/grid-template-columns:\s*minmax\(0,\s*0\.85fr\)\s*minmax\(0,\s*1\.25fr\)/.test(css), 'css: PRIME wider');
assert(css.includes('rc-section--accordion'), 'css: accordion');

if (failed > 0) {
  console.error(`\ntutor registration-check frame FAILED (${failed})`);
  process.exit(1);
}
console.log('\ntutor registration-check frame OK');
