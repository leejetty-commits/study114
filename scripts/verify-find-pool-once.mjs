/**
 * 234c-3b · 공부방찾기 첫 진입의 노출 풀 search.php 3건.
 * 실행: cd preview/search-ui && npx vite-node ../../scripts/verify-find-pool-once.mjs
 *
 * DB·서버에 접속하지 않는다.
 */
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
/** @type {{ tab: string, limit: number, page: number, sort: string, filters: object }[]} */
const searches = [];
let inFlight = 0;
let maxInFlight = 0;

function json(status, body) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

function card(tab, id, tier) {
  return { id, title: `${tab}-${id}`, exposure_tier: tier, region_label: '대치동' };
}

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
  if (url.pathname.endsWith('/api/search/search.php')) {
    const body = JSON.parse(String(init.body || '{}'));
    inFlight += 1;
    maxInFlight = Math.max(maxInFlight, inFlight);
    searches.push({
      tab: body.tab,
      limit: body.limit,
      page: body.page,
      sort: body.sort,
      filters: body.filters || {},
    });
    await new Promise((r) => setTimeout(r, 20));
    inFlight -= 1;
    const tier = body.tab === 'room' ? 'prime' : body.tab === 'tutor' ? 'pick' : 'basic';
    const count = Number(body.limit) || 0;
    return json(200, {
      ok: true,
      tab: body.tab,
      items: Array.from({ length: count }, (_, i) => card(body.tab, 100 + i, tier)),
    });
  }
  return json(200, { ok: true, posts: [], items: [], threads: [] });
};

const auth = await import('../preview/home-ui/src/auth-session.js');
const bridge = await import('../preview/home-ui/src/exposure-bridge.js');
const exposureData = await import('../preview/home-ui/src/exposure-data.js');
const feed = await import('../preview/search-ui/src/search-region-feed.js');

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

function resetMeters() {
  searches.length = 0;
  inFlight = 0;
  maxInFlight = 0;
}

async function freshMember() {
  await auth.logout();
  bridge.resetExposureBridge();
  meMode = 'member';
  resetMeters();
}

const LIVE = [
  { id: 11, exposure_tier: 'basic', title: '베이직' },
  { id: 12, exposure_tier: 'pick', title: '픽' },
  { id: 13, exposure_tier: 'prime', title: '프라임' },
];

function cardIds(fillPool) {
  bridge.resetExposureBridge();
  if (fillPool) {
    exposureData.EXPOSURE_STUDY_ROOMS.push(
      { id: 99, exposure_tier: 'prime' },
      { id: 98, exposure_tier: 'pick' },
      { id: 97, exposure_tier: 'basic' },
    );
  }
  const result = feed.getRegionFeed('room', { studyRoomHome: true, liveItems: LIVE, regionLabel: '대치동' });
  return {
    ids: result.items.map((item) => item.id).join(','),
    tiers: result.items.map((item) => item.exposure_tier).join(','),
  };
}

const emptyPool = cardIds(false);
const filledPool = cardIds(true);
ok('cards_same_ids', emptyPool.ids === filledPool.ids && emptyPool.ids === '11,12,13', `${emptyPool.ids} vs ${filledPool.ids}`);
ok('cards_same_tiers', emptyPool.tiers === filledPool.tiers && emptyPool.tiers === 'basic,pick,prime', emptyPool.tiers);
bridge.resetExposureBridge();

await freshMember();
await auth.initAuthSession(false);
ok('before_member_count_3', searches.length === 3, String(searches.length));
ok('before_member_parallel_3', maxInFlight === 3, String(maxInFlight));
console.log(`COUNT before member simultaneous ${maxInFlight} total ${searches.length}`);

await freshMember();
await auth.initAuthSession(false, { deferExposurePool: true });
ok('after_member_during_confirm_0', searches.length === 0, String(searches.length));
resetMeters();
await bridge.hydrateExposureBridge({ sequential: true });
ok('after_member_follow_3', searches.length === 3, String(searches.length));
ok('after_member_not_parallel', maxInFlight === 1, String(maxInFlight));
ok(
  'after_member_bodies',
  searches.map((s) => `${s.tab}:${s.limit}:${s.sort}:${s.page}:${JSON.stringify(s.filters)}`).join('|') ===
    'room:3:latest:1:{}|tutor:2:latest:1:{}|student:2:latest:1:{}',
  searches.map((s) => `${s.tab}:${s.limit}`).join(','),
);
console.log(`COUNT after member first-wave 0 then sequential max ${maxInFlight} total ${searches.length}`);

await freshMember();
meMode = 'guest';
await auth.initAuthSession(false, { deferExposurePool: true });
const guestDuring = searches.length;
await bridge.hydrateExposureBridge({ sequential: true });
ok('guest_pool_0', guestDuring === 0 && searches.length === 0, String(searches.length));
ok('guest_anonymous', auth.getSessionConfirmStatus() === 'anonymous');
console.log('COUNT guest 0');

await freshMember();
await auth.initAuthSession(false, { deferExposurePool: true });
resetMeters();
meMode = 'fail';
const started = Date.now();
await auth.initAuthSession(false, { deferExposurePool: true });
const elapsed = Date.now() - started;
ok('unconfirmed_status', auth.getSessionConfirmStatus() === 'unconfirmed', auth.getSessionConfirmStatus());
ok('unconfirmed_bounded', elapsed < 8000, `${elapsed}ms`);
ok('unconfirmed_pool_0', searches.length === 0, String(searches.length));
if (auth.getSessionConfirmStatus() === 'authenticated') {
  await bridge.hydrateExposureBridge({ sequential: true });
}
ok('unconfirmed_stays_0', searches.length === 0, String(searches.length));
console.log(`COUNT unconfirmed 0 in ${elapsed}ms`);

console.log(failed ? `FAIL ${failed} / ${passed + failed}` : `OK ${passed}`);
process.exit(failed ? 1 : 0);
