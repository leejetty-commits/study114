/**
 * 234c-3c · 찾기 첫 진입의 roi.php 를 목록 뒤로.
 * 실행: cd preview/search-ui && npx vite-node ../../scripts/verify-find-roi-later.mjs
 *
 * DB·서버에 접속하지 않는다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const mem = new Map();
globalThis.sessionStorage = {
  getItem: (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => mem.set(k, String(v)),
  removeItem: (k) => mem.delete(k),
  clear: () => mem.clear(),
};
globalThis.localStorage = globalThis.sessionStorage;
globalThis.window = globalThis;
const winEvents = new EventTarget();
globalThis.addEventListener = winEvents.addEventListener.bind(winEvents);
globalThis.removeEventListener = winEvents.removeEventListener.bind(winEvents);
globalThis.dispatchEvent = winEvents.dispatchEvent.bind(winEvents);
Object.defineProperty(globalThis, 'location', {
  value: {
    hash: '#/search/room',
    href: 'http://127.0.0.1:5176/#/search/room',
    origin: 'http://127.0.0.1:5176',
    host: '127.0.0.1:5176',
    hostname: '127.0.0.1',
    protocol: 'http:',
    pathname: '/',
    search: '',
    assign() {},
    replace() {},
  },
  writable: true,
  configurable: true,
});

/** @type {'member'|'guest'|'fail'} */
let meMode = 'guest';
let searchInFlight = 0;
let roiInFlight = 0;
let bothInFlight = false;
let roiStartedBeforeSearchEnd = false;
let searchEnds = 0;
let roiStarts = 0;

function json(status, body) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

const CARDS = [
  { id: 11, title: '베이직', position_sku: 'basic', region_label: '대치동' },
  { id: 12, title: '픽', position_sku: 'pick', region_label: '대치동' },
  { id: 13, title: '프라임', position_sku: 'prime', region_label: '대치동' },
];

globalThis.fetch = async (input, init = {}) => {
  const url = new URL(String(input), 'http://127.0.0.1:5176');
  if (url.pathname.endsWith('/api/auth/me.php')) {
    if (meMode === 'fail') throw new Error('offline');
    if (meMode === 'guest') return json(200, { ok: true, authenticated: false });
    return json(200, {
      ok: true,
      authenticated: true,
      email_verified: true,
      user_id: 7,
      email: 'room@example.com',
      role_type: 'study_room_owner',
      name: '공부방',
      admin_level: null,
      needs_basic_register: false,
      oauth_role_pending: false,
    });
  }
  if (url.pathname.endsWith('/api/registrations/study-rooms.php')) {
    return json(200, { ok: true, rooms: [roomRecord(3)] });
  }
  if (url.pathname.endsWith('/api/search/search.php')) {
    searchInFlight += 1;
    if (roiInFlight > 0) bothInFlight = true;
    await new Promise((r) => setTimeout(r, 30));
    searchInFlight -= 1;
    searchEnds += 1;
    return json(200, { ok: true, items: CARDS });
  }
  if (url.pathname.endsWith('/api/paid/roi.php')) {
    roiStarts += 1;
    roiInFlight += 1;
    if (searchInFlight > 0) bothInFlight = true;
    if (searchEnds === 0) roiStartedBeforeSearchEnd = true;
    await new Promise((r) => setTimeout(r, 30));
    roiInFlight -= 1;
    return json(200, { ok: true, lifetime_views: 128 });
  }
  return json(200, { ok: true, posts: [], items: [], threads: [] });
};

function roomRecord(id) {
  return {
    id,
    profile_status: 'published',
    study_room_name: '내 공부방',
    created_at: '2026-01-02',
    saved_regions: [
      {
        is_primary: 1,
        region_id: '1168010800',
        promo_label: '대치동',
        region_label: '대치동',
      },
    ],
  };
}

function seedRoom(id) {
  sessionStorage.setItem('study114-preview-study-rooms-v1', JSON.stringify({ rooms: [roomRecord(id)] }));
}

function resetMeters() {
  searchInFlight = 0;
  roiInFlight = 0;
  bothInFlight = false;
  roiStartedBeforeSearchEnd = false;
  searchEnds = 0;
  roiStarts = 0;
}

const auth = await import('../preview/home-ui/src/auth-session.js');
const seed = await import('../preview/home-ui/src/study-room-home-seed.js');
const page = await import('../preview/search-ui/src/screens/search-page.js');
const state = await import('../preview/search-ui/src/state.js');

let passed = 0;
let failed = 0;
function ok(name, cond, detail = '') {
  if (cond) {
    passed += 1;
    console.log(`PASS  ${name}`);
  } else {
    failed += 1;
    console.error(`FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

function cardKey() {
  return (seed.getStudyRoomHomeLiveItems() || []).map((row) => `${row.id}:${row.exposure_tier}`).join(',');
}

const here = path.dirname(fileURLToPath(import.meta.url));
const searchPageSrc = fs.readFileSync(path.join(here, '../preview/search-ui/src/screens/search-page.js'), 'utf8');
const homeSrc = fs.readFileSync(path.join(here, '../preview/home-ui/src/screens/study-room.js'), 'utf8');
const tutorSrc = fs.readFileSync(path.join(here, '../preview/home-ui/src/screens/tutor.js'), 'utf8');
ok('find_flag', searchPageSrc.includes('bootStudyRoomHome(rerender, { viewsAfterList: true })'));
ok('home_same_call', homeSrc.includes('bootStudyRoomHome(rerender);'));
ok('tutor_home_same_call', tutorSrc.includes('bootTutorHome(rerender);'));
ok('find_skips_tutor_roi', !searchPageSrc.includes('bootTutorHome'));

await auth.logout();
meMode = 'guest';
resetMeters();
state.previewState.role = 'guest';
await page.afterSearchPageMount(() => {});
ok('guest_roi_0', roiStarts === 0);
console.log('COUNT guest roi', roiStarts);

seedRoom(1);
resetMeters();
await seed.bootStudyRoomHome(() => {});
ok('home_parallel', bothInFlight === true && roiStarts === 1 && searchEnds === 1, `both ${bothInFlight}`);
ok('home_views', seed.readStudyRoomMemberBox().views === 128);
const homeCards = cardKey();
ok('home_cards', homeCards === '11:basic,12:pick,13:prime', homeCards);
console.log('COUNT home together search', searchEnds, 'roi', roiStarts, 'both', bothInFlight);

seedRoom(2);
resetMeters();
await seed.bootStudyRoomHome(() => {}, { viewsAfterList: true });
ok(
  'find_roi_after_list',
  bothInFlight === false && roiStartedBeforeSearchEnd === false && roiStarts === 1 && searchEnds === 1,
  `both ${bothInFlight} early ${roiStartedBeforeSearchEnd}`,
);
ok('find_views', seed.readStudyRoomMemberBox().views === 128);
const findCards = cardKey();
ok('find_cards_same', findCards === homeCards, `${findCards} vs ${homeCards}`);
let homeRenders = 0;
await seed.bootStudyRoomHome(() => {
  homeRenders += 1;
});
ok('home_followup_no_second_roi', roiStarts === 1 && homeRenders === 0, `roi ${roiStarts} renders ${homeRenders}`);
console.log('COUNT find after list search', searchEnds, 'roi', roiStarts, 'both', bothInFlight);

meMode = 'member';
await auth.initAuthSession(false);

seedRoom(4);
resetMeters();
state.previewState.role = 'tutor';
state.previewState._gpsBootedTab = 'tutor';
state.previewState._needsSearchRestore = false;
location.hash = '#/search/tutor';
await page.afterSearchPageMount(() => {});
ok('tutor_find_roi_0', roiStarts === 0 && searchEnds === 0, `search ${searchEnds} roi ${roiStarts}`);

resetMeters();
state.previewState.role = 'parent';
state.previewState._gpsBootedTab = 'student';
location.hash = '#/search/student';
await page.afterSearchPageMount(() => {});
ok('student_find_roi_0', roiStarts === 0 && searchEnds === 0, `search ${searchEnds} roi ${roiStarts}`);

resetMeters();
state.previewState.role = 'study_room';
state.previewState._gpsBootedTab = 'student';
location.hash = '#/search/student';
await page.afterSearchPageMount(() => {});
await new Promise((r) => setTimeout(r, 80));
ok('room_member_student_tab_roi_0', roiStarts === 0, `roi ${roiStarts}`);

meMode = 'member';
await auth.initAuthSession(false);
meMode = 'fail';
const t0 = Date.now();
await auth.initAuthSession(false);
ok('unconfirmed_status', auth.getSessionConfirmStatus() === 'unconfirmed');
ok('unconfirmed_bounded', Date.now() - t0 < 8000, `${Date.now() - t0}ms`);
seedRoom(3);
resetMeters();
state.previewState.role = 'study_room';
state.previewState._needsSearchRestore = false;
state.previewState._gpsBootedTab = 'room';
location.hash = '#/search/room';
await page.afterSearchPageMount(() => {});
await new Promise((r) => setTimeout(r, 120));
ok(
  'unconfirmed_roi_after_list',
  bothInFlight === false && roiStartedBeforeSearchEnd === false && roiStarts === 1 && searchEnds === 1,
  `both ${bothInFlight} early ${roiStartedBeforeSearchEnd} search ${searchEnds} roi ${roiStarts}`,
);
ok('unconfirmed_cards_same', cardKey() === homeCards, cardKey());
console.log('COUNT unconfirmed search', searchEnds, 'roi', roiStarts, 'both', bothInFlight, 'in', Date.now() - t0, 'ms');

console.log(failed ? `FAIL ${failed} / ${passed + failed}` : `OK ${passed}`);
process.exit(failed ? 1 : 0);
