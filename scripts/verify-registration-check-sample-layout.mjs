/**
 * 등록점검 — 샘플카드 블럭 분리 · 1행 BASIC / 2행 PICK+PRIME · 상세 accordion
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

const render = read('preview/home-ui/src/study-room-reg/registration-check-render.js');
const css = read('preview/home-ui/src/styles/registration-check.css');
const copy = read('preview/home-ui/src/study-room-reg/registration-check-copy.js');

assert(render.includes('renderMissingBlock(vm.promo.pickMissingTitle'), 'pick action block present');
assert(render.includes('renderMissingBlock(vm.promo.primeMissingTitle'), 'prime action block present');
assert(render.includes('${renderCards(vm)}'), 'independent renderCards call in page');
assert(
  render.indexOf('renderMissingBlock(vm.promo.primeMissingTitle') < render.indexOf('${renderCards(vm)}'),
  'cards block comes after prime action block',
);
assert(!/primeReadyBody,\s*renderCards\(vm\)/.test(render), 'cards not nested inside prime missing block');
assert(render.includes('rc-compare__row--basic'), 'row1 BASIC markup');
assert(render.includes('rc-compare__row--upgrade'), 'row2 PICK+PRIME markup');
assert(render.includes('renderBrowseList'), 'BASIC uses real browse list card');
assert(render.includes("renderExposureBox('study_room', 'pick'"), 'PICK uses real exposure card');
assert(render.includes("renderExposureBox('study_room', 'prime'"), 'PRIME uses real exposure card');
assert(render.includes('rc-section--accordion'), 'detail accordion applied');
assert(render.includes('완료 ') && render.includes('부족 '), 'accordion summary shows filled/missing counts');
assert(css.includes('rc-compare__row--upgrade'), 'CSS upgrade row');
assert(/grid-template-columns:\s*minmax\(0,\s*0\.85fr\)\s*minmax\(0,\s*1\.25fr\)/.test(css), 'PRIME column wider than PICK');
assert(!css.includes('rc-compare__grid'), 'old 3-column grid removed');
assert(!css.includes('rc-tier__media--basic'), 'fake media thumbnail styles removed');
assert(copy.includes("basicKicker: '내 현재 BASIC'"), 'BASIC kicker label kept/updated');
assert(copy.includes('1행은 지금 내 Basic'), 'cardsLead describes new layout');

if (failed > 0) {
  console.error(`\nregistration-check sample layout FAILED (${failed})`);
  process.exit(1);
}
console.log('\nregistration-check sample layout OK');
