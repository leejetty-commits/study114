/**
 * 사이트오류-23 · 공부방 홈 내 박스 = 과외쌤 박스 형태, 공부방 값 유지
 * 실행: cd preview/home-ui && npx vite-node ../../scripts/verify-study-room-box-shape.mjs
 *
 * 렌더 함수를 실제로 부른다.
 * 변이는 소스 파일을 되돌린 뒤 새 프로세스에서 그 렌더를 실행하고, 원래 단언이 실패하는지 본다.
 */
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, unlinkSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const homeUi = join(root, 'preview', 'home-ui');
const read = (rel) => readFileSync(join(root, rel), 'utf8');

const mem = new Map();
function makeStorage() {
  return {
    getItem: (k) => (mem.has(k) ? mem.get(k) : null),
    setItem: (k, v) => mem.set(k, String(v)),
    removeItem: (k) => mem.delete(k),
    clear: () => mem.clear(),
    key: (i) => [...mem.keys()][i] ?? null,
    get length() {
      return mem.size;
    },
  };
}
globalThis.sessionStorage = makeStorage();
globalThis.localStorage = globalThis.sessionStorage;
globalThis.window = globalThis;
globalThis.fetch = async () => ({ ok: false, status: 404, json: async () => ({ ok: false }) });
if (typeof globalThis.CustomEvent === 'undefined') {
  globalThis.CustomEvent = class extends Event {
    constructor(type, init = {}) {
      super(type);
      this.detail = init.detail;
    }
  };
}
const winEvents = new EventTarget();
globalThis.addEventListener = winEvents.addEventListener.bind(winEvents);
globalThis.removeEventListener = winEvents.removeEventListener.bind(winEvents);
globalThis.dispatchEvent = winEvents.dispatchEvent.bind(winEvents);
Object.defineProperty(globalThis, 'location', {
  value: {
    hash: '#/study-room',
    href: 'http://127.0.0.1:5174/#/study-room',
    origin: 'http://127.0.0.1:5174',
    host: '127.0.0.1:5174',
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

let passed = 0;
let failed = 0;
function ok(name, cond, detail = '') {
  let value = cond;
  try {
    value = typeof cond === 'function' ? cond() : cond;
  } catch (e) {
    value = false;
    detail = `${detail} threw ${e?.message || e}`;
  }
  if (value) {
    passed += 1;
    console.log(`PASS  ${name}`);
  } else {
    failed += 1;
    console.error(`FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

const ROOMS_KEY = 'study114-preview-study-rooms-v1';
function saveRooms(rooms) {
  sessionStorage.setItem(ROOMS_KEY, JSON.stringify({ rooms }));
}
function slot(label, primary, extra = {}) {
  return {
    region_id: primary ? '1168010600' : '1',
    region_basis_type: 'dong',
    region_label: label,
    promo_label: label ? `서울특별시 강남구 ${label}` : '',
    is_primary: primary,
    complex_id: '',
    complex_name: null,
    complex_address: null,
    ...extra,
  };
}
function room(saved) {
  return {
    id: 7,
    study_room_name: '한빛공부방',
    profile_status: 'published',
    inquiry_status: 'open',
    created_at: '2024-05-06T00:00:00Z',
    deleted_at: null,
    saved_regions: saved,
  };
}

const { renderStudyRoom } = await import('../preview/home-ui/src/screens/study-room.js');
const { previewState, setStudyRoomTab } = await import('../preview/home-ui/src/state.js');
const seed = await import('../preview/home-ui/src/study-room-home-seed.js');
const searchMap = await import('../preview/search-ui/src/search-map.js');
const { STUDY_ROOM_HOME_BOX_COPY } = await import('../preview/home-ui/src/study-room-reg/study-room-reg-copy.js');
const { STUDY_ROOM_TOP_TABS } = await import('../preview/home-ui/src/study-room-reg/router.js');
const { memberPlacePrompt } = await import('../preview/shared/location-display.js');
const { getDefaultMypagePath } = await import('../preview/home-ui/src/mypage/router.js');

const COPY = STUDY_ROOM_HOME_BOX_COPY;
const screenSrc = read('preview/home-ui/src/screens/study-room.js');
const mapSrc = read('preview/search-ui/src/search-map.js');
const css = read('preview/home-ui/src/styles/udx-std-apply.css');
const mkt = read('preview/home-ui/src/styles/home-marketing-banner.css');
const listings = read('preview/home-ui/src/styles/home-listings.css');
const visily = read('preview/search-ui/src/styles/search-visily.css');
const surfaceSrc = read('preview/search-ui/src/search-find-surface.js');

function boxSlice(html) {
  const start = html.indexOf(`aria-label="${COPY.badge}"`);
  const end = html.indexOf('data-study-room-area-status');
  return start >= 0 && end > start ? html.slice(start, end) : '';
}
function pillsOf(fragment) {
  return [...fragment.matchAll(/class="my-box__region-pill([^"]*)"/g)].map((m) => m[1]);
}

setStudyRoomTab('study_room');
saveRooms([room([slot('대치동', true)])]);
let html = renderStudyRoom();
let box = boxSlice(html);

ok('(a) 탭이 박스 분할보다 앞', () => {
  const tabs = html.indexOf('provider-home-tabs');
  const split = html.indexOf('tutor-home-split');
  return tabs >= 0 && split > tabs;
});
ok('(a) home-mkt-wrap--with-panel 없음', !html.includes('home-mkt-wrap--with-panel') && !screenSrc.includes('home-mkt-wrap--with-panel'));
ok('(a) 배너 패널 클래스 없음', !html.includes('my-box--banner-panel') && !screenSrc.includes('my-box--banner-panel'));
ok('(a) 래퍼는 남음', html.includes('home-mkt-wrap'));

ok('(b) 배지·4행', box.includes('my-box__badge') && box.includes(COPY.badge) && ['--1', '--2', '--3', '--4'].every((n) => box.includes(`my-box__row${n}`)));
ok('(b) 과목 칸 없음', !box.includes('my-box__stat-label">과목'));
ok('(b) 이름·상태·조회 —·등록', box.includes('한빛공부방') && box.includes('쪽지 받음 · 0개 미확인') && box.includes('my-box__stat-label">조회') && box.includes('my-box__stat-val">—') && box.includes('2024-05-06'));
ok('(b) 홍보지역 안내', box.includes(COPY.regionGuide));
ok('(b) 쪽지설정 메뉴가 있어 3행 전체 안내', STUDY_ROOM_TOP_TABS.some((t) => t.key === 'inquiries' && t.label === '쪽지설정') && box.includes(COPY.inquiryGuide));
ok('(b) 화면은 메뉴를 코드로 가른다', screenSrc.includes('STUDY_ROOM_TOP_TABS.some') && screenSrc.includes('BOX.inquiryGuide') && screenSrc.includes('BOX.messagesGuide'));

const onlyPrimary = pillsOf(box);
ok('(c) 홍보1만 알약 1개·대표', onlyPrimary.length === 1 && onlyPrimary[0].includes('is-primary') && box.includes('대치동') && box.includes('대표'));
ok('(c) 미선택 알약 없음', !box.includes('미선택'));

saveRooms([room([slot('대치동', true), slot('', false), slot('   ', false)])]);
html = renderStudyRoom();
box = boxSlice(html);
ok('(c) 빈 홍보2·3은 알약을 만들지 않음', pillsOf(box).length === 1);

saveRooms([room([slot('대치동', true), slot('', false), slot('삼성동', false)])]);
html = renderStudyRoom();
box = boxSlice(html);
{
  const pills = pillsOf(box);
  ok('(c) 홍보3만 값이 있으면 알약 2개', pills.length === 2 && pills[0].includes('is-primary') && !pills[1].includes('is-primary'));
  ok('(c) 삼성동은 보이고 빈 칸 알약은 없음', box.includes('삼성동') && !box.includes('미선택'));
}

saveRooms([
  room([
    slot('대치동', true),
    slot('역삼동', false),
    slot('래미안대치팰리스', false, { region_basis_type: 'complex', region_label: '래미안대치팰리스' }),
  ]),
]);
html = renderStudyRoom();
box = boxSlice(html);
{
  const pills = pillsOf(box);
  const order = ['대치동', '역삼동', '래미안대치팰리스'].map((label) => box.indexOf(label));
  ok('(c) 홍보1·2·3 알약 3개, 대표는 첫 알약', pills.length === 3 && pills.filter((p) => p.includes('is-primary')).length === 1 && pills[0].includes('is-primary'));
  ok('(c) 알약 순서는 홍보1 다음 비대표', order[0] >= 0 && order[0] < order[1] && order[1] < order[2]);
}
ok(
  '(c) 헬퍼는 비대표·값 있는 슬롯만',
  seed.studyRoomSecondaryPromoRegions(room([slot('대치동', true), slot('', false), slot('삼성동', false)])).map((s) => s.region_label).join('|') === '삼성동',
);

const mypagePath = getDefaultMypagePath('study_room');
ok('(d) 마이페이지는 getDefaultMypagePath(study_room)', mypagePath === '/mypage/registrations/study-rooms/7' && box.includes(`href="#${mypagePath}"`) && box.includes(`data-nav="${mypagePath}"`));
ok('(d) 쪽지 후기함은 /mypage/messages', box.includes('href="#/mypage/messages"') && box.includes('data-nav="/mypage/messages"') && box.includes('btn btn--secondary btn--sm') && !box.includes('/mypage/messages/reviews'));

const areaAt = html.indexOf('data-study-room-area-status');
const mapAt = html.indexOf('data-study-room-map');
const mapHtml = mapAt >= 0 ? html.slice(mapAt, html.indexOf('</section>', mapAt)) : '';
const areaHtml = areaAt >= 0 ? html.slice(areaAt, html.indexOf('</aside>', areaAt)) : '';
const q = seed.resolveStudyRoomMapQuery(previewState.studyRoomFind, 'home');
const status = searchMap.readStudyRoomProviderHomeBanner({
  items: previewState.studyRoomFind.activeResultItems || [],
  regionLabel: q.picked ? q.query : q.promo_label,
  lat: null,
  lng: null,
  viewerRole: 'study_room',
});
ok('(e) 현황 카드는 분할 안·지도보다 앞', html.indexOf('tutor-home-split') < areaAt && areaAt < mapAt && areaAt > 0);
ok('(e) 공부방 홈 지도 안에 배너 없음', mapHtml !== '' && !mapHtml.includes('hero-map__banner'));
ok('(e) 카드 값이 지도 계산과 같음', areaHtml.includes(status.heading) && areaHtml.includes(status.sub) && areaHtml.includes(String(status.roomCount)) && areaHtml.includes(status.hint));

const direct = searchMap.readStudyRoomProviderHomeBanner({
  items: [{ id: 1 }, { id: 2 }, { id: 3 }],
  regionLabel: '서울특별시 강남구 대치동',
  viewerRole: 'study_room',
});
ok('(e) 동·부제', direct.heading === '대치동' && direct.sub === '대치동 공부방 현황입니다', JSON.stringify(direct));

const findMap = searchMap.renderSearchMapBlock([{ id: 1 }, { id: 2 }, { id: 3 }], {
  providerHome: true,
  bannerStyle: 'provider_room',
  hideMapBanner: false,
  viewerRole: 'study_room',
  regionLabel: '서울특별시 강남구 대치동',
});
ok(
  '(f) 찾기(배너 유지)는 같은 부제·수를 지도 안에',
  findMap.includes('hero-map__banner') && findMap.includes(direct.sub) && findMap.includes(`<dd>${direct.roomCount}</dd>`),
  findMap.slice(findMap.indexOf('hero-map__dong'), findMap.indexOf('hero-map__dong') + 280),
);

const guest = searchMap.renderSearchMapBlock([], {
  regionLabel: '대치동',
  viewerRole: 'guest',
  bannerStyle: 'guest',
  guestHomeStyle: true,
});
ok('(f) 게스트 지도 배너 유지', guest.includes('hero-map__banner') && guest.includes('data-guest-axis-count="studyRooms"') && guest.includes('data-guest-axis-count="tutors"') && guest.includes('data-guest-axis-count="studentRequests"') && guest.includes('우리동네 공부방·과외를 쪽지로 연결하세요'));
ok(
  '(f) renderFloatMap 게스트 분기·heading 식',
  /bannerStyle === 'guest'/.test(mapSrc) &&
    /guestMap\s*\?\s*readGuestBaseline\(\)\.room\s*:\s*parts\.dong \|\| \(student \? region : ''\) \|\| memberPlacePrompt\(ctx\.viewerRole\)/.test(mapSrc),
);

const studentMap = searchMap.renderSearchMapBlock([], {
  bannerStyle: 'search',
  guestHomeStyle: false,
  viewerRole: 'parent',
  regionLabel: '경기도 의정부시 신곡동',
});
ok('(f) 학생 지도 배너 유지', studentMap.includes('hero-map__banner') && studentMap.includes('경기도 의정부시 신곡동') && !studentMap.includes('data-study-room-area-status'));

saveRooms([room([])]);
html = renderStudyRoom();
{
  const emptyArea = html.slice(html.indexOf('data-study-room-area-status'), html.indexOf('</aside>', html.indexOf('data-study-room-area-status')));
  const prompt = memberPlacePrompt('study_room');
  const emptyStatus = searchMap.readStudyRoomProviderHomeBanner({
    items: previewState.studyRoomFind.activeResultItems || [],
    regionLabel: '',
    viewerRole: 'study_room',
  });
  ok('(e) 홍보1 없으면 제목은 memberPlacePrompt', emptyArea.includes(prompt) && emptyStatus.heading === prompt && emptyStatus.sub === '');
  ok('(c) 홍보 슬롯이 없으면 알약 없음', pillsOf(boxSlice(html)).length === 0);
}

ok('(g) 화면 파일에 안내 리터럴 없음', !screenSrc.includes(COPY.regionGuide) && !screenSrc.includes(COPY.inquiryGuide) && !screenSrc.includes(COPY.messagesGuide));
ok('(g) 화면 파일에 학부모 문구 없음', !screenSrc.includes('학부모'));
ok('(g) 안내 상수는 문구 파일에', read('preview/home-ui/src/study-room-reg/study-room-reg-copy.js').includes(COPY.regionGuide));

const studyCss = css.slice(css.indexOf('.home-shell--study_room .my-box--status'), css.indexOf('.mypage-home-hero h2'));
ok('(색) 공부방 박스 규칙이 과외쌤과 같은 선택자', ['.my-box--status', '.my-box__badge', '.my-box__region-pill.is-primary', '.my-box__region-pill.is-active'].every((sel) => studyCss.includes(`.home-shell--study_room ${sel}`) || studyCss.includes(sel)));
ok('(색) 액센트는 --role-accent-study 만', studyCss.includes('var(--role-accent-study)') && studyCss.includes('var(--role-accent-study-soft)') && !/#[0-9a-fA-F]{3,8}/.test(studyCss.replace(/#fff\b/g, '')));
ok('(css) with-panel·banner-panel·panel 규칙 제거, 래퍼는 유지', !mkt.includes('with-panel') && !mkt.includes('banner-panel') && !mkt.includes('home-mkt-wrap__panel') && mkt.includes('.home-mkt-wrap {') && mkt.includes('.home-news-row'));
ok('(반응형) 분할은 768px', /@media \(min-width: 768px\)[\s\S]*?\.tutor-home-split/.test(listings) && screenSrc.includes('tutor-home-split'));
ok('(반응형) 719px 배너 relative 는 게스트·찾기용으로 유지', /@media \(max-width: 719px\)[\s\S]*?\.hero-map--float-rail \.hero-map__banner[\s\S]*?position:\s*relative/.test(visily));
ok('(전달) 홈에서만 지도 배너를 뺌', /hideMapBanner: variant === 'home' && studyRoomPromoMap/.test(surfaceSrc));

setStudyRoomTab('student');
const studentHome = renderStudyRoom();
ok('(a) 학생 탭에는 내 박스 분할 없음', !studentHome.includes('tutor-home-split') && !studentHome.includes('data-study-room-area-status'));
setStudyRoomTab('study_room');

const checker = join(homeUi, '_tmp-box-mut-check.mjs');
function runChecker(body) {
  writeFileSync(
    checker,
    `globalThis.window = globalThis;
const mem = new Map();
globalThis.sessionStorage = { getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k), clear() { mem.clear(); } };
globalThis.localStorage = globalThis.sessionStorage;
globalThis.fetch = async () => ({ ok: false, status: 404, json: async () => ({}) });
Object.defineProperty(globalThis, 'location', { value: { hash: '#/study-room', href: 'http://127.0.0.1:5174/#/study-room', origin: 'http://127.0.0.1:5174', host: '127.0.0.1:5174', hostname: '127.0.0.1', protocol: 'http:', pathname: '/', search: '', assign() {}, replace() {} }, configurable: true });
${body}
`,
  );
  return spawnSync('npx', ['vite-node', '_tmp-box-mut-check.mjs'], {
    cwd: homeUi,
    encoding: 'utf8',
    shell: true,
  });
}

const mapPath = join(root, 'preview/search-ui/src/search-map.js');
const screenPath = join(root, 'preview/home-ui/src/screens/study-room.js');
const mapOriginal = readFileSync(mapPath, 'utf8');
const screenOriginal = readFileSync(screenPath, 'utf8');
try {
  const needle = 'hideMapBanner: options.hideMapBanner === true';
  ok('변이 준비: 배너 생략 식이 소스에 있음', mapOriginal.includes(needle));
  writeFileSync(mapPath, mapOriginal.replace(needle, 'hideMapBanner: false'));
  const mapChild = runChecker(`
    const map = await import('../search-ui/src/search-map.js');
    const html = map.renderSearchMapBlock([{ id: 1 }], {
      providerHome: true,
      bannerStyle: 'provider_room',
      hideMapBanner: true,
      viewerRole: 'study_room',
      regionLabel: '서울특별시 강남구 대치동',
    });
    const hidden = !html.includes('hero-map__banner');
    process.stdout.write(hidden ? 'NO_BANNER' : 'HAS_BANNER');
  `);
  const mapOut = `${mapChild.stdout || ''}`;
  ok(
    '변이: 배너 생략을 되돌리면 홈 지도에 배너가 다시 그려져 단언이 실패한다',
    mapChild.status === 0 && mapOut.includes('HAS_BANNER') && !mapOut.includes('NO_BANNER'),
    mapOut.slice(-400) || mapChild.stderr?.slice(-400) || `status ${mapChild.status}`,
  );
} finally {
  writeFileSync(mapPath, mapOriginal);
  if (existsSync(checker)) unlinkSync(checker);
}

try {
  const nl = screenOriginal.includes('\r\n') ? '\r\n' : '\n';
  const from = `\${renderProviderHomeTabs('study_room', tab)}${nl}    \${showMyBox ? renderStudyRoomSelfHero() : ''}`;
  const to = `\${showMyBox ? renderStudyRoomSelfHero() : ''}${nl}    \${renderProviderHomeTabs('study_room', tab)}`;
  ok('변이 준비: 탭 다음 박스 순서가 소스에 있음', screenOriginal.includes(from));
  writeFileSync(screenPath, screenOriginal.replace(from, to));
  const orderChild = runChecker(`
    sessionStorage.setItem('study114-preview-study-rooms-v1', JSON.stringify({ rooms: [{ id: 7, study_room_name: '한빛공부방', profile_status: 'published', inquiry_status: 'open', created_at: '2024-05-06', deleted_at: null, saved_regions: [{ region_label: '대치동', promo_label: '서울특별시 강남구 대치동', is_primary: true }] }] }));
    const screen = await import('./src/screens/study-room.js');
    const html = screen.renderStudyRoom();
    const tabs = html.indexOf('provider-home-tabs');
    const split = html.indexOf('tutor-home-split');
    const tabsThenBox = tabs >= 0 && split > tabs;
    process.stdout.write(tabsThenBox ? 'TABS_THEN_BOX' : 'BOX_THEN_TABS');
  `);
  const orderOut = `${orderChild.stdout || ''}`;
  ok(
    '변이: 박스를 탭 앞으로 되돌리면 「탭 다음 박스」 단언이 실패한다',
    orderChild.status === 0 && orderOut.includes('BOX_THEN_TABS') && !orderOut.includes('TABS_THEN_BOX'),
    orderOut.slice(-500) || orderChild.stderr?.slice(-500) || `status ${orderChild.status}`,
  );
} finally {
  writeFileSync(screenPath, screenOriginal);
  if (existsSync(checker)) unlinkSync(checker);
}

ok('변이 뒤 소스 복구', readFileSync(mapPath, 'utf8') === mapOriginal && readFileSync(screenPath, 'utf8') === screenOriginal);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
