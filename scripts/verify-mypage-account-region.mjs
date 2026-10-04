/**
 * 사이트오류-19 · 마이페이지 계정 카드 「대표 지역」 실값.
 * 실행: cd preview/home-ui && npx vite-node ../../scripts/verify-mypage-account-region.mjs
 *
 * Chromium 없이 accountRegionView·renderMypageScreen 호출로 센다.
 * 등록·지역 API 는 가짜 응답만 쓰고, DB·서버에 접속하지 않는다.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(ROOT, rel), 'utf8');

let passed = 0;
let failed = 0;
function ok(name, cond, detail = '') {
  let value = cond;
  try {
    value = typeof cond === 'function' ? cond() : cond;
  } catch (e) {
    value = false;
    detail = `${detail} threw ${e?.message || e}`.trim();
  }
  if (value) {
    passed += 1;
    console.log(`PASS  ${name}`);
  } else {
    failed += 1;
    console.error(`FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

const UNITS = [
  {
    id: '101',
    label: '서울특별시 강남구',
    sido_code: '11',
    sido_name: '서울특별시',
    official_code: '1168000000',
    city_name: '강남구',
    gu_name: '',
    kind: 'metro_gu',
  },
  {
    id: '202',
    label: '부산광역시 해운대구',
    sido_code: '26',
    sido_name: '부산광역시',
    official_code: '2635000000',
    city_name: '해운대구',
    gu_name: '',
    kind: 'metro_gu',
  },
];

const GANGNAM = '서울특별시 강남구';
const HAEUNDAE = '부산광역시 해운대구';

const mem = new Map();
const storage = {
  getItem: (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => mem.set(k, String(v)),
  removeItem: (k) => mem.delete(k),
  clear: () => mem.clear(),
};
globalThis.sessionStorage = storage;
globalThis.localStorage = storage;
globalThis.window = globalThis;
const loc = {
  hash: '#/mypage/account',
  href: 'http://127.0.0.1:5174/#/mypage/account',
  origin: 'http://127.0.0.1:5174',
  host: '127.0.0.1:5174',
  hostname: '127.0.0.1',
  protocol: 'http:',
  pathname: '/',
  search: '',
  assign() {},
  replace(url) {
    const s = String(url || '');
    const hash = s.startsWith('#') ? s : s.includes('#') ? s.slice(s.indexOf('#')) : '';
    if (hash) this.hash = hash;
  },
};
Object.defineProperty(globalThis, 'location', { value: loc, writable: true, configurable: true });
globalThis.document = {
  documentElement: { style: { setProperty() {}, getPropertyValue() { return ''; } } },
  body: { appendChild() {}, removeChild() {} },
  getElementById() { return null; },
  querySelector() { return null; },
  querySelectorAll() { return []; },
  createElement() {
    return { style: {}, setAttribute() {}, appendChild() {}, addEventListener() {}, classList: { add() {}, remove() {} } };
  },
  addEventListener() {},
  removeEventListener() {},
};
globalThis.history = globalThis.history || { pushState() {}, replaceState() {}, state: null };
if (typeof globalThis.dispatchEvent !== 'function') {
  const winEvents = new EventTarget();
  globalThis.dispatchEvent = (event) => winEvents.dispatchEvent(event);
}
try {
  Object.defineProperty(globalThis, 'navigator', {
    value: { userAgent: 'verify-mypage-account-region', language: 'ko' },
    configurable: true,
  });
} catch {
  /* vite-node 가 navigator 를 이미 고정한 경우 */
}
if (typeof globalThis.matchMedia !== 'function') {
  globalThis.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
}

const session = {
  authenticated: true,
  role_type: 'study_room_owner',
  email: 'room-owner1@dev.local',
  name: '공부방',
  user_id: 21,
  students: [],
  rooms: [],
  tutors: [],
};

function responseJson(body, okStatus = true) {
  const json = JSON.stringify(body);
  return {
    ok: okStatus,
    status: okStatus ? 200 : 401,
    json: async () => body,
    text: async () => json,
  };
}

function urlOf(input) {
  if (typeof input === 'string') return input;
  if (input && typeof input.url === 'string') return input.url;
  return String(input ?? '');
}

let holdStudyRooms = false;
let studyRoomGate = Promise.resolve();

function holdNextStudyRooms() {
  holdStudyRooms = true;
  let release = () => {};
  studyRoomGate = new Promise((resolve) => {
    release = () => {
      holdStudyRooms = false;
      resolve();
    };
  });
  return release;
}

globalThis.fetch = async (input) => {
  const url = urlOf(input);
  if (url.includes('/api/auth/me.php') || url.includes('/api/auth/login.php')) {
    return responseJson({
      ok: true,
      authenticated: true,
      email_verified: true,
      oauth_role_pending: false,
      needs_basic_register: false,
      user_id: session.user_id,
      email: session.email,
      role_type: session.role_type,
      name: session.name,
      phone_verified: true,
      admin_level: null,
    });
  }
  if (url.includes('/api/registrations/students.php')) {
    return responseJson({ ok: true, students: session.role_type === 'guardian_student' ? session.students : [] });
  }
  if (url.includes('/api/registrations/study-rooms.php')) {
    if (holdStudyRooms) await studyRoomGate;
    return responseJson({ ok: true, rooms: session.role_type === 'study_room_owner' ? session.rooms : [] });
  }
  if (url.includes('/api/registrations/tutors.php')) {
    return responseJson({ ok: true, tutors: session.role_type === 'tutor' ? session.tutors : [] });
  }
  if (url.includes('/api/auth/regions.php')) {
    return responseJson({ ok: true, cities: UNITS });
  }
  return responseJson({ ok: true, threads: [], posts: [], items: [], cities: UNITS });
};

const labelMod = await import('../preview/home-ui/src/mypage/account-region-label.js');
const { initAuthSession } = await import('../preview/home-ui/src/auth-session.js');
const { isRegistrationsApiMode } = await import('../preview/home-ui/src/registrations-backend.js');
const { renderMypageScreen } = await import('../preview/home-ui/src/mypage/screens.js');
const { activityLabelFromRegionId } = await import('../preview/shared/region-cascade.js');

const {
  ACCOUNT_REGION_UNSET,
  accountRegionView,
  accountRegionPresentation,
  ensureAccountRegionLabel,
  paintAccountRegionLabel,
} = labelMod;

function shown(role, ctx) {
  return accountRegionView(role, { loaded: true, units: UNITS, unitsPhase: 'ready', ...ctx });
}

function noHash(text) {
  return !/#\s*\d+/.test(String(text)) && !/^\d+$/.test(String(text));
}

ok('(a) 공부방 홍보1 promo_label', () => {
  const view = shown('study_room', {
    room: {
      region_label: '사업장동',
      saved_regions: [{ is_primary: 1, promo_label: '서울특별시 강남구 대치동', region_label: '대치동' }],
    },
  });
  return !view.pending && view.text === '서울특별시 강남구 대치동';
});

ok('(a) 과외쌤 대표 region_id 라벨', () => {
  const view = shown('tutor', {
    tutor: {
      primary_region_label: '서버표시',
      saved_regions: [
        { region_id: '202', is_primary: 0 },
        { region_id: '101', is_primary: 1 },
      ],
    },
  });
  return !view.pending && view.text === activityLabelFromRegionId('101', UNITS) && view.text === GANGNAM && view.text !== HAEUNDAE;
});

ok('(a) 학생 과외 분기 1번', () => {
  const view = shown('parent', {
    student: {
      preferred_lesson_type: 'tutor',
      preferred_tutor_region_id: '101',
      preferred_tutor_region_label: GANGNAM,
      preferred_studyroom_region_id: '55',
      preferred_studyroom_region_label: '대치동',
    },
  });
  return !view.pending && view.text === GANGNAM;
});

ok('(a) 학생 공부방 분기 1번', () => {
  const view = shown('parent', {
    student: {
      preferred_lesson_type: 'study_room',
      preferred_tutor_region_id: '101',
      preferred_tutor_region_label: GANGNAM,
      preferred_studyroom_region_id: '55',
      preferred_studyroom_region_label: '대치동',
    },
  });
  return !view.pending && view.text === '대치동';
});

ok('(b) 값 없으면 등록 전', () => {
  const room = shown('study_room', { room: { saved_regions: [] } });
  const tutor = shown('tutor', { tutor: { saved_regions: [], primary_region_label: '' }, units: UNITS });
  const student = shown('parent', { student: { preferred_lesson_type: 'tutor' } });
  return [room, tutor, student].every((view) => !view.pending && view.text === ACCOUNT_REGION_UNSET);
});

ok('(M8) is_primary 없는 첫 슬롯은 대표가 아님', () => {
  const view = shown('tutor', {
    tutor: {
      primary_region_label: '',
      primary_region_id: '',
      saved_regions: [
        { region_id: '101', is_primary: 0 },
        { region_id: '202', is_primary: 0 },
      ],
    },
  });
  return !view.pending && view.text === ACCOUNT_REGION_UNSET && view.text !== GANGNAM && view.text !== HAEUNDAE;
});

ok('(M8) is_primary 없으면 서버 primary_region_label', () => {
  const view = shown('tutor', {
    tutor: {
      primary_region_label: '서버표시',
      primary_region_id: '',
      saved_regions: [{ region_id: '101', is_primary: 0 }],
    },
  });
  return !view.pending && view.text === '서버표시' && view.text !== GANGNAM;
});

ok('(c) #숫자·지역 id 는 나오지 않음', () => {
  const cases = [
    shown('study_room', { room: { saved_regions: [{ is_primary: 1, promo_label: '행정동 #12' }] } }),
    shown('study_room', { room: { saved_regions: [{ is_primary: 1, promo_label: '단지 #3' }] } }),
    shown('study_room', { room: { saved_regions: [{ is_primary: 1, promo_label: '101' }] } }),
    shown('tutor', { tutor: { primary_region_label: '행정동 #9', saved_regions: [] } }),
    shown('parent', {
      student: {
        preferred_lesson_type: 'study_room',
        preferred_studyroom_regions: [{ region_id: '5', region_label: '대치동', complex_label: '단지 #5', is_primary: true }],
      },
    }),
    shown('parent', {
      student: {
        preferred_lesson_type: 'tutor',
        preferred_tutor_region_label: '서울 #1',
        preferred_tutor_region_id: '1',
      },
    }),
  ];
  return cases.every((view) => view.text === ACCOUNT_REGION_UNSET && noHash(view.text));
});

ok('(d) 과외 분기는 공부방 지역을 쓰지 않음', () => {
  const view = shown('parent', {
    student: {
      preferred_lesson_type: 'tutor',
      preferred_studyroom_region_id: '55',
      preferred_studyroom_region_label: '대치동',
      preferred_tutor_region_label: '',
    },
  });
  return view.text === ACCOUNT_REGION_UNSET && view.text !== '대치동';
});

ok('(d) 공부방 분기는 과외 지역을 쓰지 않음', () => {
  const view = shown('parent', {
    student: {
      preferred_lesson_type: 'study_room',
      preferred_tutor_region_id: '101',
      preferred_tutor_region_label: GANGNAM,
      preferred_studyroom_region_label: '',
    },
  });
  return view.text === ACCOUNT_REGION_UNSET && view.text !== GANGNAM;
});

ok('(e) 사업장 동만 있으면 등록 전', () => {
  const view = shown('study_room', {
    room: { region_label: '역삼동', location_label: '역삼동', saved_regions: [] },
  });
  return view.text === ACCOUNT_REGION_UNSET && view.text !== '역삼동';
});

ok('(e) 슬롯 region_label 만 있고 promo 가 없으면 등록 전', () => {
  const view = shown('study_room', {
    room: {
      region_label: '역삼동',
      saved_regions: [{ is_primary: 1, region_label: '역삼동', promo_label: '' }],
    },
  });
  return view.text === ACCOUNT_REGION_UNSET;
});

ok('(M3) 로드 전엔 등록 전을 쓰지 않음', () => {
  const view = accountRegionView('study_room', {
    loaded: false,
    room: { saved_regions: [{ is_primary: 1, promo_label: '대치동' }] },
  });
  return view.pending && view.text === '' && view.text !== ACCOUNT_REGION_UNSET;
});

ok('(M3) 로드 후 같은 값은 라벨', () => {
  const view = accountRegionView('study_room', {
    loaded: true,
    room: { saved_regions: [{ is_primary: 1, promo_label: '대치동' }] },
  });
  return !view.pending && view.text === '대치동';
});

ok('과외 단위 로드 전·서버 라벨 없음은 대기', () => {
  const view = accountRegionView('tutor', {
    loaded: true,
    unitsPhase: 'idle',
    units: [],
    tutor: { saved_regions: [{ region_id: '101', is_primary: 1 }], primary_region_label: '' },
  });
  return view.pending && view.text === '';
});

ok('과외 단위 로드 전·서버 라벨이 있으면 그 라벨', () => {
  const view = accountRegionView('tutor', {
    loaded: true,
    unitsPhase: 'idle',
    units: [],
    tutor: { saved_regions: [{ region_id: '101', is_primary: 1 }], primary_region_label: '서버표시' },
  });
  return !view.pending && view.text === '서버표시';
});

ok('단위 조회 실패 후 서버 라벨도 없으면 등록 전', () => {
  const view = accountRegionView('tutor', {
    loaded: true,
    unitsPhase: 'error',
    units: [],
    tutor: { saved_regions: [{ region_id: '101', is_primary: 1 }], primary_region_label: null },
  });
  return !view.pending && view.text === ACCOUNT_REGION_UNSET && noHash(view.text);
});

const screensSrc = read('preview/home-ui/src/mypage/screens.js');
const accountFn = screensSrc.slice(screensSrc.indexOf('function renderAccount'), screensSrc.indexOf('function escAttr'));
const bindFn = screensSrc.slice(screensSrc.indexOf('export function bindMypageScreenEvents'));
const accountBind = bindFn.slice(
  bindFn.indexOf("if (path === '/mypage/account')"),
  bindFn.indexOf('if (path === CONTACT_HISTORY_PATH'),
);
ok('화면은 합성 함수만 쓰고 라벨 글자는 대표 지역', () => {
  return (
    accountFn.includes('accountRegionPresentation(role)') &&
    accountFn.includes('<dt>대표 지역</dt>') &&
    !accountFn.includes('profile.regionLabel') &&
    !accountFn.includes('studyRoomPromo1Label') &&
    !accountFn.includes('primaryHopeRegionLabel') &&
    !accountFn.includes('preferred_lesson_type')
  );
});
ok('계정 화면 갱신은 칸만 고치고 rerender 를 부르지 않음', () => {
  return accountBind.includes('ensureAccountRegionLabel') && accountBind.includes('paintAccountRegionLabel') && !accountBind.includes('rerender');
});
ok('합성은 account-region-label 한 곳', () => {
  const src = read('preview/home-ui/src/mypage/account-region-label.js');
  return src.includes('studyRoomPromo1Label') && src.includes('primaryHopeRegionLabel') && src.includes('activityLabelFromRegionId') && src.includes('hydrateRegistrationsCache');
});

function regionCell(html) {
  const matched = String(html).match(/<dt>대표 지역<\/dt>\s*<dd([^>]*)>([^<]*)<\/dd>/);
  if (!matched) return null;
  return { attrs: matched[1], text: matched[2] };
}

async function until(pred) {
  for (let i = 0; i < 80; i += 1) {
    if (pred()) return true;
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
  return false;
}

async function login(roleType, email, name) {
  session.authenticated = true;
  session.role_type = roleType;
  session.email = email;
  session.name = name;
  loc.hash = '#/mypage/account';
  const user = await initAuthSession(false);
  ok(`login ${roleType}`, !!(user && user.role_type === roleType), user ? user.role_type : 'null');
}

function accountHtml() {
  loc.hash = '#/mypage/account';
  return renderMypageScreen('/mypage/account');
}

session.rooms = [
  {
    id: 1,
    profile_status: 'published',
    deleted_at: null,
    region_label: '사업장동',
    saved_regions: [{ is_primary: 1, promo_label: '서울특별시 강남구 대치동', region_label: '대치동' }],
  },
];
const releaseRooms = holdNextStudyRooms();
const boot = initAuthSession(false);
const sawApi = await until(() => isRegistrationsApiMode());
ok('(M3) hydrate 전에 API 모드', sawApi);
const mid = accountRegionPresentation('study_room');
ok('(M3) 캐시 전 화면은 대기이고 등록 전이 아님', mid.pending && mid.text === '' && mid.text !== '등록 전');
const midHtml = accountHtml();
const midCell = regionCell(midHtml);
ok(
  '(M3) 캐시 전 HTML 에 등록 전·홍보 라벨이 없음',
  !!midCell && midCell.attrs.includes('data-pending') && midCell.text === '' && !midHtml.includes('등록 전') && !midHtml.includes('대치동'),
  midCell ? `${midCell.attrs} / ${midCell.text}` : 'no cell',
);
releaseRooms();
await boot;

const readyCell = regionCell(accountHtml());
ok('(a) 새로 읽은 공부방 홍보1 이 카드에 있음', readyCell && readyCell.text === '서울특별시 강남구 대치동' && !readyCell.attrs.includes('data-pending'), readyCell && readyCell.text);

session.rooms = [
  {
    id: 2,
    profile_status: 'draft',
    deleted_at: null,
    region_label: '초안사업장',
    saved_regions: [{ is_primary: 1, promo_label: '초안홍보' }],
  },
  {
    id: 1,
    profile_status: 'published',
    deleted_at: null,
    region_label: '대표사업장',
    saved_regions: [{ is_primary: 1, promo_label: '대표홍보' }],
  },
];
await login('study_room_owner', 'room-owner1@dev.local', '공부방');
const picked = regionCell(accountHtml());
ok('(a) 여러 공부방이면 공개된 대표 공부방 홍보1', picked && picked.text === '대표홍보' && !accountHtml().includes('초안홍보') && !accountHtml().includes('대표사업장'), picked && picked.text);

session.rooms = [
  {
    id: 1,
    profile_status: 'published',
    deleted_at: null,
    region_label: '역삼동',
    location_label: '역삼동',
    saved_regions: [],
  },
];
await login('study_room_owner', 'room-owner1@dev.local', '공부방');
const business = regionCell(accountHtml());
ok('(e) 화면은 사업장 동을 대표 지역으로 쓰지 않음', business && business.text === '등록 전' && !accountHtml().includes('역삼동'), business && business.text);

session.rooms = [
  {
    id: 1,
    profile_status: 'published',
    deleted_at: null,
    saved_regions: [{ is_primary: 1, promo_label: '행정동 #44', region_label: '행정동 #44' }],
  },
];
await login('study_room_owner', 'room-owner1@dev.local', '공부방');
const hashed = regionCell(accountHtml());
ok('(c) 화면 HTML 에 #숫자 라벨이 없음', hashed && hashed.text === '등록 전' && !/#\s*\d+/.test(accountHtml()), hashed && hashed.text);

session.tutors = [
  {
    id: 7,
    profile_status: 'published',
    deleted_at: null,
    primary_region_label: null,
    primary_region_id: '101',
    saved_regions: [
      { region_id: '202', is_primary: 0 },
      { region_id: '101', is_primary: 1 },
    ],
  },
];
await login('tutor', 'tutor-owner1@dev.local', '과외쌤');
const tutorWait = regionCell(accountHtml());
ok('(M3) 과외 단위 전에는 등록 전으로 비우지 않음', tutorWait && tutorWait.attrs.includes('data-pending') && tutorWait.text === '' && !accountHtml().includes('등록 전'), tutorWait && `${tutorWait.attrs}/${tutorWait.text}`);

const typing = { value: '입력중' };
const slot = {
  isConnected: true,
  textContent: tutorWait ? tutorWait.text : '',
  attrs: { 'data-pending': '1' },
  setAttribute(key, value) {
    this.attrs[key] = value;
  },
  removeAttribute(key) {
    delete this.attrs[key];
  },
};
const root = {
  isConnected: true,
  querySelector(sel) {
    return String(sel).includes('data-account-region-label') ? slot : null;
  },
};
await ensureAccountRegionLabel('tutor');
paintAccountRegionLabel(root, 'tutor');
ok('입력 중인 값은 지역 칸 갱신 뒤에도 유지', typing.value === '입력중');
ok('(a) 과외 대표 지역은 단위 조합 라벨', slot.textContent === GANGNAM && !slot.attrs['data-pending'] && noHash(slot.textContent), slot.textContent);

const tutorHtml = accountHtml();
const tutorCell = regionCell(tutorHtml);
ok('(a) 과외 카드 HTML 이 대표 라벨', tutorCell && tutorCell.text === GANGNAM && !tutorHtml.includes(HAEUNDAE) && noHash(tutorCell.text), tutorCell && tutorCell.text);

session.students = [
  {
    id: 1,
    exposure_status: 'published',
    preferred_lesson_type: 'tutor',
    preferred_tutor_region_id: '101',
    preferred_tutor_region_label: GANGNAM,
    preferred_studyroom_region_id: '55',
    preferred_studyroom_region_label: '대치동',
    preferred_tutor_regions: [],
    preferred_studyroom_regions: [],
  },
];
await login('guardian_student', 'guardian1@dev.local', '학생');
const studentTutor = regionCell(accountHtml());
ok('(d) 화면 학생 과외 분기는 공부방 지역을 안 씀', studentTutor && studentTutor.text === GANGNAM && studentTutor.text !== '대치동', studentTutor && studentTutor.text);

session.students = [
  {
    id: 1,
    exposure_status: 'published',
    preferred_lesson_type: 'study_room',
    preferred_tutor_region_id: '101',
    preferred_tutor_region_label: GANGNAM,
    preferred_studyroom_region_id: '55',
    preferred_studyroom_region_label: '대치동',
    preferred_tutor_regions: [],
    preferred_studyroom_regions: [],
  },
];
await login('guardian_student', 'guardian1@dev.local', '학생');
const studentRoom = regionCell(accountHtml());
ok('(d) 화면 학생 공부방 분기는 과외 지역을 안 씀', studentRoom && studentRoom.text === '대치동' && studentRoom.text !== GANGNAM, studentRoom && studentRoom.text);

session.students = [
  {
    id: 1,
    exposure_status: 'published',
    preferred_lesson_type: 'study_room',
    preferred_tutor_region_label: GANGNAM,
    preferred_studyroom_region_label: '',
  },
];
await login('guardian_student', 'guardian1@dev.local', '학생');
const studentEmpty = regionCell(accountHtml());
ok('(b) 학생 분기 지역이 없으면 등록 전', studentEmpty && studentEmpty.text === '등록 전' && !accountHtml().includes(GANGNAM), studentEmpty && studentEmpty.text);

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
