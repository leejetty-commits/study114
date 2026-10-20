/**
 * 272-2 과외쌤 상세 칸 공용 정의.
 * 화면 data-trc-field, 등록점검 행, 월 총 횟수·주 회수 옵션이 한 목록과 맞는지 본다.
 */
import './verify-dom-storage-shim.mjs';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { lessonMonthlyOptions } from '../preview/shared/lesson-monthly-options.js';
import { lessonWeeklyOptions } from '../preview/shared/lesson-weekly-options.js';
import {
  TUTOR_DETAIL_FIELDS,
  tutorDetailFocusIds,
} from '../preview/shared/tutor-detail-fields.js';
import {
  TRC_BOARD_DETAIL1_FIELDS,
  TRC_BOARD_DETAIL2_FIELDS,
} from '../preview/home-ui/src/tutor-reg/registration-check-copy.js';

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

const screenSrc = [
  'preview/tutor-ui/src/screens/step-lesson.js',
  'preview/tutor-ui/src/screens/step-contact.js',
  'preview/home-ui/src/tutor-reg/embedded-panels.js',
].map(read).join('\n');

const screenFields = [...screenSrc.matchAll(/data-trc-field="([^"]+)"/g)].map((m) => m[1]);
const focusIds = tutorDetailFocusIds();
for (const id of focusIds) {
  assert(screenFields.includes(id), `screen data-trc-field: ${id}`);
}

const boardIds = [...TRC_BOARD_DETAIL1_FIELDS, ...TRC_BOARD_DETAIL2_FIELDS].map((f) => f.id);
const sharedIds = TUTOR_DETAIL_FIELDS.map((f) => f.id);
assert(boardIds.join(',') === sharedIds.join(','), 'board rows = shared definition order');
assert(!sharedIds.includes('intro_short') && !boardIds.includes('intro_short'), 'intro_short definitions 0');
assert(!screenSrc.includes('intro_short'), 'screens: no intro_short field');

const monthlyValues = lessonMonthlyOptions().map((o) => o.value).filter(Boolean);
assert(monthlyValues.join(',') === ['2','3','4','5','6','7','8','9','10','11','12','13','14','15','16'].join(','), 'monthly options 2-16');
assert(lessonMonthlyOptions().some((o) => o.value === '16' && o.label === '월16회 이상'), 'monthly 16 label');

const weeklySrc = read('preview/shared/lesson-weekly-options.js');
const weeklyValues = lessonWeeklyOptions().map((o) => o.value);
assert(weeklyValues.join(',') === '1,2,3,4,5,6,7,8', 'weekly options match lesson-weekly-options.js');
assert(weeklySrc.includes('export function lessonWeeklyOptions'), 'weekly source still exports options');

if (failed > 0) {
  console.error(`\ntutor detail fields ssot FAILED (${failed})`);
  process.exit(1);
}
console.log('\ntutor detail fields ssot OK');
