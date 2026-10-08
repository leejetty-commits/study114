/**
 * 공부방 쪽지설정 — 상태·수정·저장 프레임. 카드 샘플 블록 없음(2026-10-09 견본카드 제거).
 */
import './verify-dom-storage-shim.mjs';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { P20_INQUIRY_COPY } from '../preview/home-ui/src/study-room-reg/study-room-reg-copy.js';

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

const screens = read('preview/home-ui/src/study-room-reg/screens.js');
const store = read('preview/home-ui/src/study-room-reg/store.js');
const hubService = read('src/Registration/StudyRoomHubService.php');
assert(store.includes('hydrateRegistrationsCache'), 'store: inquiry save hydrates cache');
assert(store.includes("apiStudyRoomAction(id, 'inquiry_status'"), 'store: PATCH inquiry_status');
assert(!hubService.includes('PhoneVerifyRequiredException'), 'api: study-room open does not require phone');
const css = read('preview/home-ui/src/styles/home-member-flows.css');
const rcRender = read('preview/home-ui/src/study-room-reg/registration-check-render.js');
const rcModel = read('preview/home-ui/src/study-room-reg/registration-check-model.js');

assert(!screens.includes('renderInquirySamplePair'), 'screens: no inquiry sample pair');
assert(!screens.includes('bindInquirySampleGuides'), 'screens: no sample arrow guides');
assert(!screens.includes('home-card-samples'), 'screens: no home-card-samples import');
for (const rel of [
  'preview/home-ui/src/home-card-samples/render.js',
  'preview/home-ui/src/home-card-samples/presets.js',
  'preview/home-ui/src/home-card-samples/guides.js',
  'preview/home-ui/src/study-room-reg/inquiries-sample.js',
  'preview/home-ui/src/styles/home-card-samples.css',
]) {
  assert(!existsSync(resolve(root, rel)), `sample module removed: ${rel}`);
}
assert(!screens.includes('renderStudyRoomInquirySample'), 'screens: local sample renderer removed');
assert(!screens.includes('renderInquiryBasicPreview'), 'screens: live owner preview removed');
assert(!screens.includes('inquiryCoverImageSrc'), 'screens: owner cover fallback removed');
assert(!screens.includes('p20-inquiries-guide'), 'screens: old aside guide removed');
assert(!screens.includes('p20-inquiries-summary-card'), 'screens: old summary cards removed');
assert(!screens.includes('data-p20-inquiry-toggle'), 'screens: checkbox toggle removed');
assert(!screens.includes('카드 미리보기'), 'screens: no 카드 미리보기 title');
assert(!screens.includes('P20_INQUIRY_COPY.sample'), 'screens: no sample copy binding');
for (const key of ['previewTitle', 'sampleTitle', 'sampleLead', 'sampleOpenKicker', 'sampleClosedKicker', 'sampleOpenCallout', 'sampleClosedCallout']) {
  assert(!(key in P20_INQUIRY_COPY), `copy: ${key} key removed`);
}
assert(P20_INQUIRY_COPY.editHeading === '현재상태 수정', 'copy: 현재상태 수정');
assert(!('contactHeading' in P20_INQUIRY_COPY), 'copy: contactHeading key removed');
assert(!('verifyFirstHint' in P20_INQUIRY_COPY), 'copy: verifyFirstHint key removed');
assert(!screens.includes('p21-inq-block--contact'), 'screens: contact verify block removed');
assert(!screens.includes('showPhoneVerifyGateModal'), 'screens: no OTP modal');
assert(!screens.includes('isPhoneVerifiedLocal'), 'screens: no local phone gate');
assert(!screens.includes('phone_verify_required'), 'screens: no phone_verify_required handling');

const orderMarks = [
  'p21-inq__lead',
  'p21-inq-block--status',
  'p21-inq-block--edit',
  'data-p20-inquiry-save',
];
let last = -1;
for (const mark of orderMarks) {
  const idx = screens.indexOf(mark);
  assert(idx > last, `structure order: ${mark} after previous`);
  last = idx;
}

assert(!screens.includes('p21-inq-block--samples'), 'structure: no card sample block');
assert(!screens.includes('강남 수학 공부방'), 'screens: no sample room name');
assert(!css.includes('inq-home-width-probe'), 'member css: width probe removed');
assert(!css.includes('--p20-listing-w'), 'css: preview listing-w removed');
assert(!css.includes('inq-sample'), 'css: inquiry sample styles removed');
assert(!css.includes('p21-inq-block--samples'), 'css: sample block style removed');

assert(rcRender.includes('renderRegistrationCheck'), 'RC render untouched marker');
assert(rcModel.includes("id: 'detail'"), 'RC model untouched');

if (failed > 0) {
  console.error(`\nstudy-room inquiries samples FAILED (${failed})`);
  process.exit(1);
}
console.log('\nstudy-room inquiries samples OK');
