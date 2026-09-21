/**
 * 공부방 쪽지설정 — 홈 BASIC 1칸 샘플 · SVG 화살표
 */
import './verify-dom-storage-shim.mjs';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { P20_INQUIRY_COPY } from '../preview/home-ui/src/study-room-reg/study-room-reg-copy.js';
import { renderHomeBasicCardHtml } from '../preview/home-ui/src/home-card-samples/render.js';
import {
  STUDY_ROOM_CARD_SAMPLE_IMAGE,
  buildStudyRoomInquirySampleItem,
} from '../preview/home-ui/src/home-card-samples/presets.js';

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
assert(store.includes('hydrateRegistrationsCache'), 'store: inquiry save hydrates cache');
assert(store.includes("apiStudyRoomAction(id, 'inquiry_status'"), 'store: PATCH inquiry_status');
const css = read('preview/home-ui/src/styles/home-member-flows.css');
const hcsCss = read('preview/home-ui/src/styles/home-card-samples.css');
const hcsRender = read('preview/home-ui/src/home-card-samples/render.js');
const guides = read('preview/home-ui/src/home-card-samples/guides.js');
const rcRender = read('preview/home-ui/src/study-room-reg/registration-check-render.js');
const rcModel = read('preview/home-ui/src/study-room-reg/registration-check-model.js');

assert(screens.includes("renderInquirySamplePair('study_room'"), 'screens: shared inquiry sample pair');
assert(hcsRender.includes('renderBrowseList'), 'hcs: home BASIC renderBrowseList');
assert(hcsRender.includes('INQUIRY_SAMPLE_BUILDERS'), 'hcs: inquiry preset builders');
assert(guides.includes('data-inq-guide') || guides.includes('[data-inq-guide]'), 'guides: SVG guide');
assert(guides.includes('item-actions [title^="쪽지"]'), 'guides: measures 쪽지 button');
assert(!guides.includes('inq-home-width-probe'), 'guides: no width probe');
assert(!screens.includes('renderStudyRoomInquirySample'), 'screens: local sample renderer removed');
assert(!screens.includes('renderInquiryBasicPreview'), 'screens: live owner preview removed');
assert(!screens.includes('inquiryCoverImageSrc'), 'screens: owner cover fallback removed');
assert(!screens.includes('p20-inquiries-guide'), 'screens: old aside guide removed');
assert(!screens.includes('p20-inquiries-summary-card'), 'screens: old summary cards removed');
assert(!screens.includes('data-p20-inquiry-toggle'), 'screens: checkbox toggle removed');
assert(!screens.includes('카드 미리보기'), 'screens: no 카드 미리보기 title');
assert(screens.includes('P20_INQUIRY_COPY.sampleTitle'), 'screens: sample title binding');
assert(P20_INQUIRY_COPY.sampleTitle === '쪽지 설정시 카드 샘플', 'copy: sample title text');
assert(P20_INQUIRY_COPY.editHeading === '현재상태 수정', 'copy: 현재상태 수정');
assert(P20_INQUIRY_COPY.contactNeededLead.includes('본인 핸드폰 인증'), 'copy: first ON requires phone');
assert(P20_INQUIRY_COPY.contactNotice.includes('외부에 공개되지 않습니다'), 'copy: phone not public');
assert(P20_INQUIRY_COPY.contactNotice.includes('시스템 신뢰 확인용'), 'copy: trust check');

const orderMarks = [
  'p21-inq__lead',
  'p21-inq-block--status',
  'p21-inq-block--edit',
  'p21-inq-block--contact',
  'data-p20-inquiry-save',
  'p21-inq-block--samples',
];
let last = -1;
for (const mark of orderMarks) {
  const idx = screens.indexOf(mark);
  assert(idx > last, `structure order: ${mark} after previous`);
  last = idx;
}

assert(P20_INQUIRY_COPY.sampleOpenCallout.includes('여기가 쪽지 관련 표시 위치'), 'copy: open callout');
assert(P20_INQUIRY_COPY.sampleClosedCallout.includes('여기가 쪽지 관련 표시 위치'), 'copy: closed callout');

assert(hcsCss.includes('--hcs-basic-w'), 'css: basic 1-cell width token');
assert(hcsCss.includes('hcs-sample__card--basic'), 'css: basic card cell');
assert(!hcsCss.includes('inq-home-width-probe'), 'css: width probe removed');
assert(!css.includes('inq-home-width-probe'), 'member css: width probe removed');
assert(!css.includes('--p20-listing-w'), 'css: preview listing-w removed');
assert(!/transform:\s*scale/.test(hcsCss), 'css: sample card is not scaled');
assert(!/100vw/.test(hcsCss), 'css: no 100vw');
assert(!css.includes('p20-inq-sample__arrow'), 'css: old disconnected arrow removed');

const imgRel = 'preview/home-ui/public/assets/brand/room-card-default-basic.svg';
assert(existsSync(resolve(root, imgRel)), 'sample: room default image exists');
assert(STUDY_ROOM_CARD_SAMPLE_IMAGE.includes('room-card-default-basic.svg'), 'sample: image path is brand asset');

const html = renderHomeBasicCardHtml('study_room', buildStudyRoomInquirySampleItem(true));
assert(html.includes('room-card-default-basic.svg'), 'html: filled image');
assert(!html.includes('expo-media--placeholder'), 'html: no gray placeholder');
assert(html.includes('강남 수학 공부방'), 'html: name filled');
assert(html.includes('서울 강남구'), 'html: location filled');
assert(html.includes('title="추천 22"'), 'html: recommend filled');
assert(html.includes('title="후기 9"'), 'html: review filled');
assert(html.includes('title="찜 14"'), 'html: wish filled');
assert(html.includes('title="쪽지 5"'), 'html: message count filled');
assert(html.includes('expo-basic--study_room'), 'html: BASIC study_room card');
assert(html.includes('expo-hcard'), 'html: home hcard structure');

assert(rcRender.includes('renderRegistrationCheck'), 'RC render untouched marker');
assert(rcModel.includes("id: 'detail'"), 'RC model untouched');

if (failed > 0) {
  console.error(`\nstudy-room inquiries samples FAILED (${failed})`);
  process.exit(1);
}
console.log('\nstudy-room inquiries samples OK');
