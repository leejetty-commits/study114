/**
 * 과외쌤 쪽지설정 — SSOT · 상태 의미 · OTP 후 PATCH · 064 배포 전제
 */
import './verify-dom-storage-shim.mjs';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  TUTOR_REG_TOP_TABS,
  parseTutorRegPath,
  tutorSectionPath,
  tutorHubPath,
  stripHashQuery,
  tutorHashSearchParams,
  BASE,
} from '../preview/home-ui/src/tutor-reg/router.js';
import { P21_INQUIRY_COPY, P21_INQUIRY_OFF_REASONS } from '../preview/home-ui/src/tutor-reg/inquiries-copy.js';
import {
  foldTutorInquiryStatus,
  normalizeTutorInquiryStatus,
  tutorInquiryPrefFromStatus,
  tutorInquiryStatusFromPref,
  tutorInquiryStoredLine,
} from '../preview/home-ui/src/tutor-reg/inquiries-pref.js';
import { renderTutorInquiries } from '../preview/home-ui/src/tutor-reg/inquiries-render.js';

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
const routerSrc = read('preview/home-ui/src/tutor-reg/router.js');
const stateSrc = read('preview/home-ui/src/state.js');
const render = read('preview/home-ui/src/tutor-reg/inquiries-render.js');
const edit = read('preview/home-ui/src/tutor-reg/inquiries-edit.js');
const pref = read('preview/home-ui/src/tutor-reg/inquiries-pref.js');
const store = read('preview/home-ui/src/tutor-reg/store.js');
const css = read('preview/home-ui/src/styles/home-member-flows.css');
const regsApi = read('preview/home-ui/src/registrations-api.js');
const rcRender = read('preview/home-ui/src/tutor-reg/registration-check-render.js');
const rcModel = read('preview/home-ui/src/tutor-reg/registration-check-model.js');
const hubService = read('src/Registration/TutorHubService.php');
const hubRepo = read('src/Registration/TutorHubRepository.php');
const tutorsApi = read('public/api/registrations/tutors.php');
const regApi = read('src/Registration/RegistrationApi.php');
const ddl = read('sql/schema/064_tutor_inquiry_status.sql');
const deployYml = read('.github/workflows/deploy.yml');

assert(screens.includes('renderTutorInquiries'), 'screens: uses renderTutorInquiries');
assert(screens.includes('bindTutorInquiriesEvents'), 'screens: binds inquiries events');
assert(TUTOR_REG_TOP_TABS.some((t) => t.key === 'inquiries' && t.label === '쪽지설정'), 'tab: 쪽지설정 unchanged');
assert(parseTutorRegPath(`${BASE}/7/inquiries`)?.screenId === 'P21-05', 'route: inquiries → P21-05');
assert(tutorSectionPath(7, 'inquiries').endsWith('/inquiries'), 'path: /inquiries');

assert(!pref.includes('sessionStorage'), 'pref: no sessionStorage');
assert(!pref.includes('study114-tutor-inquiry-pref'), 'pref: local pref key removed');
assert(tutorInquiryStatusFromPref(true, 'not_accepting') === 'open', 'map: receiving → open');
assert(tutorInquiryStatusFromPref(false, 'paused') === 'paused', 'map: closed+paused → paused');
assert(tutorInquiryStatusFromPref(false, 'not_accepting') === 'not_accepting', 'map: closed+reason → not_accepting');
assert(tutorInquiryStatusFromPref(false, null) === null, 'map: closed+no reason → null (no silent paused)');
assert(tutorInquiryStatusFromPref(false, '') === null, 'map: closed+empty reason → null');
assert(tutorInquiryStatusFromPref(false, 'capacity_full') === null, 'map: study-room reason rejected');
assert(tutorInquiryPrefFromStatus('open').receiving === true, 'map: open → receiving');
assert(tutorInquiryPrefFromStatus('paused').receiving === false, 'map: paused → closed');
assert(tutorInquiryPrefFromStatus('not_accepting').reason === 'not_accepting', 'map: not_accepting reason');
assert(tutorInquiryPrefFromStatus(undefined).receiving === false, 'map: missing → paused/closed');
['open', 'paused', 'not_accepting'].forEach((status) => {
  assert(foldTutorInquiryStatus(status) === status, `roundtrip: ${status} ↔ UI ↔ ${status}`);
  assert(normalizeTutorInquiryStatus(status) === status, `normalize keeps ${status}`);
});
assert(P21_INQUIRY_OFF_REASONS.some((o) => o.value === 'not_accepting' && o.hint.includes('잠시 쉼이 아닙니다')), 'copy: not_accepting ≠ paused');

assert(edit.includes('setTutorInquiryStatus'), 'edit: save calls store API');
assert(edit.includes('persistInquiryStatus'), 'edit: persistInquiryStatus named path');
assert(/onVerified:\s*persistInquiryStatus/.test(edit), 'edit: OTP success continues persistInquiryStatus');
assert(/const persistInquiryStatus = async \(\) => \{[\s\S]*setTutorInquiryStatus\(id, nextStatus\)/.test(edit), 'edit: persist body PATCHes inquiry_status');
assert(edit.includes('phone_verify_required'), 'edit: API phone gate retry');
assert(edit.includes('offReasonRequired'), 'edit: closed save requires reason');
assert(!/el\?\.value === 'not_accepting' \? 'not_accepting' : 'paused'/.test(edit), 'edit: selectedReason does not fold to paused');
assert(edit.includes("err?.code === 'schema_missing'"), 'edit: schema_missing handled');
assert(edit.includes("err?.code === 'phone_verify_required'"), 'edit: phone_verify_required handled');
assert(edit.includes('P21_INQUIRY_COPY.schemaMissing'), 'edit: schema_missing copy');
assert(edit.includes('rerender()'), 'edit: failure restores last saved render');
assert(!edit.includes('setTutorInquiryPref'), 'edit: sessionStorage setter removed');
assert(!edit.includes('apiTutorAction'), 'edit: goes through store, not raw patch');
assert(!edit.includes('location.hash'), 'edit: save does not overwrite tab URL');

assert(store.includes("apiTutorAction(id, 'inquiry_status'"), 'store: PATCH inquiry_status');
assert(store.includes('hydrateRegistrationsCache'), 'store: PATCH 후 응답 불일치면 GET hydrate');
assert(store.includes('saved !== inquiry_status'), 'store: 성공 응답 inquiry_status 일치 확인');
assert(hubService.includes("'inquiry_status' => $this->setInquiry"), 'service: inquiry_status action');
assert(hubService.includes('PhoneVerifyRequiredException'), 'service: open requires phone');
assert(hubRepo.includes('function setInquiryStatus'), 'repo: UPDATE inquiry_status');
assert(hubRepo.includes('SchemaPrerequisiteException'), 'repo: 064 missing is explicit');
assert(regApi.includes("'schema_missing'"), 'api: schema_missing error code');
assert(tutorsApi.includes('applyAction($userId, $id, $action, $input)'), 'api: PATCH passes body');
assert(ddl.includes("ENUM('open','paused','not_accepting')") || ddl.includes("ENUM(''open'',''paused'',''not_accepting'')"), 'ddl: tutor-only enum');
assert(ddl.includes('배포 전 필수'), 'ddl: marked deploy prerequisite');
assert(!ddl.includes('capacity_full'), 'ddl: does not copy study-room enum');
assert(deployYml.includes('064_tutor_inquiry_status.sql'), 'deploy.yml: 064 file guard');
assert(deployYml.includes('verify:tutor-inquiries-settings'), 'deploy.yml: inquiries verify job');

assert(render.includes('normalizeTutorInquiryStatus(tutor.inquiry_status)'), 'render: SSOT from tutor.inquiry_status');
assert(render.includes('data-inquiry-status'), 'render: raw status on root');
assert(render.includes('data-p21-inquiry-stored'), 'render: stored line from same status');
assert(render.includes('data-p21-inquiry-save'), 'render: save button');
assert(render.includes("renderBrowseList('tutor'"), 'render: comparison samples stay');

const html = renderTutorInquiries({ id: 9, tutor_display_name: '테스트쌤' });
assert(html.includes('data-inquiry-status="paused"'), 'default status attr: paused');
assert(html.includes(P21_INQUIRY_COPY.badgeClosed), 'default badge: 안받음');
assert(html.includes(P21_INQUIRY_COPY.storedPaused), 'default stored line: paused');
assert(!html.includes('is-inactive'), 'default closed: reasons stay active');

const htmlOn = renderTutorInquiries({ id: 9, tutor_display_name: '테스트쌤', inquiry_status: 'open' });
assert(htmlOn.includes('data-inquiry-status="open"'), 'open status attr');
assert(htmlOn.includes(P21_INQUIRY_COPY.badgeReceiving), 'badge: 받는 중 from server status');
assert(htmlOn.includes(P21_INQUIRY_COPY.storedOpen), 'stored line: open');
assert(htmlOn.includes('is-inactive'), 'reasons inactive when open');
assert(/name="p21_inquiry_receiving" value="1"[^>]*checked/.test(htmlOn), 'radio: receiving checked');

const htmlOffReason = renderTutorInquiries({
  id: 9,
  tutor_display_name: '테스트쌤',
  inquiry_status: 'not_accepting',
});
assert(htmlOffReason.includes('data-inquiry-status="not_accepting"'), 'not_accepting status attr');
assert(htmlOffReason.includes(P21_INQUIRY_COPY.badgeClosed), 'not_accepting badge: 안받음');
assert(htmlOffReason.includes(P21_INQUIRY_COPY.storedNotAccepting), 'stored line: not_accepting');
assert(htmlOffReason.includes(tutorInquiryStoredLine('not_accepting')), 'stored line helper matches render');
assert(/name="p21_inquiry_receiving" value="0"[^>]*checked/.test(htmlOffReason), 'radio: closed checked');
assert(/name="p21_inquiry_reason" value="not_accepting"[^>]*checked/.test(htmlOffReason), 'reason: not_accepting checked');
assert(!/name="p21_inquiry_reason" value="paused"[^>]*checked/.test(htmlOffReason), 'reason: paused not checked');

assert(css.includes('[data-p21-inquiries]'), 'css: inquiries scoped');
assert(rcRender.includes('renderTutorRegistrationCheck'), 'RC render untouched marker');
assert(rcModel.includes("id: 'detail'"), 'RC model untouched');
assert(!read('src/Registration/StudyRoomHubService.php').includes('not_accepting'), 'study-room service untouched');

// —— 화면 순서: 설명 → 현재상태+배지 → 수정 → 연락처 검증 → 저장 → 카드 샘플
const htmlOrder = renderTutorInquiries({ id: 9, tutor_display_name: '테스트쌤', inquiry_status: 'paused' });
const orderMarks = [
  'p21-inq__lead',
  'p21-inq-block--status',
  'p21-inq-block--edit',
  'p21-inq-block--contact',
  'data-p21-inquiry-save',
  'p21-inq-block--samples',
];
let lastPos = -1;
for (const mark of orderMarks) {
  const pos = htmlOrder.indexOf(mark);
  assert(pos > lastPos, `layout order: ${mark} after previous`);
  lastPos = pos;
}

// —— 라우팅 5항
const inquiriesPath = `${BASE}/7/inquiries`;
const direct = parseTutorRegPath(inquiriesPath);
assert(direct?.screenId === 'P21-05' && direct?.section === 'inquiries' && direct?.tutorId === 7, 'route A direct: canonical inquiries → P21-05 / inquiries / id');
assert(screens.includes("case 'P21-05':"), 'route A direct: screens switch P21-05');
assert(screens.includes('return renderInquiries(tutor)'), 'route A direct: renderInquiries');
assert(/renderTutorShell\(tutor, 'inquiries'/.test(screens), 'route A direct: shell active inquiries');

assert(stateSrc.includes('path.split(\'?\')[0]'), 'route B refresh: getMypagePath strips query before normalize');
assert(screens.includes('const route = parseTutorRegPath(path)'), 'route B refresh: same parse on reload');
assert(routerSrc.includes('export function stripHashQuery'), 'route B refresh: hash query strip exists');

const expectedTabs = [
  { key: 'hub', path: tutorHubPath(7), screenId: 'P21-02', section: 'hub' },
  { key: 'basic', path: tutorSectionPath(7, 'basic'), screenId: 'P21-03a', section: 'basic' },
  { key: 'detail', path: tutorSectionPath(7, 'detail'), screenId: 'P21-03b', section: 'detail' },
  { key: 'inquiries', path: tutorSectionPath(7, 'inquiries'), screenId: 'P21-05', section: 'inquiries' },
  { key: 'publish', path: tutorSectionPath(7, 'publish'), screenId: 'P21-04', section: 'publish' },
];
assert(TUTOR_REG_TOP_TABS.map((t) => t.key).join(',') === 'hub,basic,detail,inquiries,publish', 'route C active key: tab order');
for (const exp of expectedTabs) {
  const route = parseTutorRegPath(exp.path);
  assert(route?.screenId === exp.screenId && route?.section === exp.section, `route C active key: ${exp.key}`);
}
assert(screens.includes("activeSection === 'access' || activeSection === 'inquiries'"), 'route C: access shell maps to inquiries');

assert(stripHashQuery(`${inquiriesPath}?return=registration-check`) === inquiriesPath, 'route D: stripHashQuery return=');
assert(parseTutorRegPath(`${inquiriesPath}?return=registration-check`)?.section === 'inquiries', 'route D: ?return= does not break inquiries');
assert(parseTutorRegPath(`${inquiriesPath}?focus=contact`)?.section === 'inquiries', 'route D: ?focus= does not break inquiries');
assert(parseTutorRegPath(`${inquiriesPath}?return=x&focus=y`)?.screenId === 'P21-05', 'route D: hash-trailing query keeps P21-05');
assert(tutorHashSearchParams(`${inquiriesPath}?return=registration-check`).get('return') === 'registration-check', 'route D: return param readable');
assert(parseTutorRegPath(`${BASE}/7/access?return=registration-check`)?.screenId === 'P21-05', 'route D: legacy /access + query → P21-05');
assert(tutorSectionPath(7, 'access') === inquiriesPath, 'route D: access path canonicalizes to /inquiries');
assert(screens.includes("route.section === 'access'"), 'route D: screens canonicalize /access');

const navHandler = screens.match(
  /root\.querySelectorAll\('\[data-p21-nav\]'\)\.forEach\(\(el\) => \{[\s\S]*?\}\);/,
);
assert(!!navHandler, 'route E tab: data-p21-nav handler present');
assert(navHandler && navHandler[0].includes('window.location.hash = next'), 'route E tab: hash set immediately');
assert(navHandler && !navHandler[0].includes('persistTutorBasicForm'), 'route E tab: no persist gate');
assert(navHandler && !navHandler[0].includes('setTutorInquiryStatus'), 'route E tab: inquiries save does not hijack nav');
assert(!screens.includes("renderReturnToRegistrationCheckBanner") || !/function renderInquiries[\s\S]{0,200}renderReturnToRegistrationCheckBanner/.test(screens), 'route E tab: inquiries does not consume return banner');

// —— API 5항
assert(regsApi.includes("tutors: '/api/registrations/tutors.php'"), 'api B: PATCH endpoint tutors.php');
assert(regsApi.includes("JSON.stringify({ id, action, ...body })"), 'api B: payload id + action + body');
assert(hubService.includes("$status === 'open'"), 'api E: server open requires verify');
assert(hubService.includes('PhoneVerifyRequiredException'), 'api E: server throws phone_verify_required');
assert(regApi.includes("'phone_verify_required'"), 'api E: API maps PhoneVerifyRequiredException');
assert(regApi.includes("'schema_missing'"), 'api C: API maps schema_missing');
assert(regApi.includes("'validation'"), 'api C: API maps validation');
assert(hubRepo.includes("'inquiry_status'           => $this->normalizeInquiryStatus"), 'api D: GET hydrate inquiry_status');
assert(edit.includes('onVerified: persistInquiryStatus'), 'api E: OTP success → persistInquiryStatus');
assert(/const persistInquiryStatus = async \(\) => \{[\s\S]*setTutorInquiryStatus\(id, nextStatus\)/.test(edit), 'api E: persist path is PATCH');

if (failed > 0) {
  console.error(`\ntutor inquiries settings FAILED (${failed})`);
  process.exit(1);
}
console.log('\ntutor inquiries settings OK');
