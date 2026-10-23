globalThis.window = {
  location: { hash: '', pathname: '/', search: '' },
  addEventListener() {},
  removeEventListener() {},
};
globalThis.document = { cookie: '' };
globalThis.localStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };
globalThis.sessionStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };

const { renderPrimeSlotGrid, renderPickPaginatedBlock } = await import('../preview/home-ui/src/exposure-render.js');
const { PLAN_RUNTIME_DEFAULTS } = await import('../preview/home-ui/src/plans/runtime-config.js');
const { renderSearchTierResults } = await import('../preview/search-ui/src/search-tier-render.js');

let failed = 0;
function ok(name, cond, detail = '') {
  if (cond) console.log(`PASS  ${name}`);
  else {
    failed += 1;
    console.error(`FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
  }
}
const n = (html, re) => (String(html).match(re) || []).length;
const prime = (id, kind) => ({
  id,
  position_sku: 'prime',
  study_room_name: `방${id}`,
  tutor_display_name: `쌤${id}`,
});
const pick = (id) => ({
  id,
  position_sku: 'pick',
  study_room_name: `픽${id}`,
  tutor_display_name: `픽쌤${id}`,
});
const basic = (id) => ({
  id,
  position_sku: '',
  study_room_name: `기본${id}`,
  tutor_display_name: `기본쌤${id}`,
});
const heading = { title: '픽', locationLabel: '민락동' };

const tutorOneRoom = renderPrimeSlotGrid('tutor', [prime(1)], {
  viewerRole: 'study_room',
  guest: false,
  vacantFill: false,
  surfaceMode: 'region',
});
ok('공부방 모드 과외쌤 프라임 1장 → 빈 칸 2장(합 3)', n(tutorOneRoom, /data-prime-empty="1"/g) === 2, String(n(tutorOneRoom, /data-prime-empty="1"/g)));

const tutorTwo = renderPrimeSlotGrid('tutor', [prime(1), prime(2)], {
  viewerRole: 'tutor',
  guest: false,
  vacantFill: false,
  surfaceMode: 'region',
});
ok('과외쌤 모드 프라임 2장 → 빈 칸 1장', n(tutorTwo, /data-prime-empty="1"/g) === 1);

const tutorStudent = renderPrimeSlotGrid('tutor', [prime(1), prime(2)], {
  viewerRole: 'parent',
  guest: false,
  vacantFill: false,
  surfaceMode: 'region',
});
ok('학생 과외쌤 프라임 2장 → 빈 칸 없음', n(tutorStudent, /data-prime-empty="1"/g) === 0);

const tutorGuest = renderPrimeSlotGrid('tutor', [prime(1)], {
  guest: true,
  vacantFill: false,
  surfaceMode: 'region',
});
ok('비회원 과외쌤 프라임 1장 → 빈 칸 2장', n(tutorGuest, /data-prime-empty="1"/g) === 2);

const tutorSearch = renderPrimeSlotGrid('tutor', [prime(1)], {
  viewerRole: 'study_room',
  guest: false,
  vacantFill: false,
  surfaceMode: 'search',
});
ok('찾기 과외쌤 프라임 1장(비회원 아님) → 빈 칸 없음', n(tutorSearch, /data-prime-empty="1"/g) === 0);

const roomPrime = renderPrimeSlotGrid('study_room', [prime(1, 'study_room')], {
  viewerRole: 'study_room',
  vacantFill: true,
  surfaceMode: 'region',
});
ok('공부방 프라임 1장 → 빈 칸 2장', n(roomPrime, /data-prime-empty="1"/g) === 2 && n(roomPrime, /expo-card--prime/g) === 3);

const roomPick0 = renderPickPaginatedBlock('study_room', 'p', heading, [], {
  viewerRole: 'study_room',
  guest: false,
  surfaceMode: 'region',
  vacantFill: true,
});
ok('공부방 모드 픽 0장 → 홍보 1장', n(roomPick0, /data-pick-empty="1"/g) === 1);
ok('공부방 모드 픽 0장 버튼', roomPick0.includes('유료상품 보기'));
ok('공부방 모드 픽 제목 유지', roomPick0.includes('section-heading') || roomPick0.includes('list-subsection'));

const parentPick0 = renderPickPaginatedBlock('study_room', 'p', heading, [], {
  viewerRole: 'parent',
  guest: false,
  surfaceMode: 'region',
});
ok('학생 픽 0장 공부방 안내', parentPick0.includes('아직 추천 공부방이 없어요') && n(parentPick0, /data-pick-empty="1"/g) === 0);
ok('학생 안내문에 학부모 없음', !parentPick0.includes('학부모'));

const guestTutorPick0 = renderPickPaginatedBlock('tutor', 'p', heading, [], {
  guest: true,
  vacantFill: true,
  surfaceMode: 'region',
});
ok('비회원 픽 0장 과외쌤 안내', guestTutorPick0.includes('아직 추천 과외쌤이 없어요') && n(guestTutorPick0, /data-pick-empty="1"/g) === 0);

const roomPick1 = renderPickPaginatedBlock('study_room', 'p', heading, [pick(9)], {
  viewerRole: 'study_room',
  guest: false,
  surfaceMode: 'region',
  vacantFill: true,
  primeOccupied: [],
});
ok('공부방 모드 픽 1장 → 빈 카드 없음', n(roomPick1, /data-pick-empty="1"/g) === 0 && n(roomPick1, /expo-card--pick(?! expo-card--empty)/g) >= 1);

const searchPick0 = renderPickPaginatedBlock('study_room', 'p', heading, [basic(3)], {
  viewerRole: 'study_room',
  guest: false,
  surfaceMode: 'search',
  vacantFill: true,
  primeOccupied: [],
});
ok('찾기 픽 0장 → 빈 카드 5장 유지', n(searchPick0, /data-pick-empty="1"/g) === 5, String(n(searchPick0, /data-pick-empty="1"/g)));

const homeTier = renderSearchTierResults('room', [basic(4)], { role: 'study_room' }, {
  mode: 'region',
  regionLabel: '민락동',
  surfaceType: 'home',
});
ok('공부방 홈 실카드 있고 픽 0 → 프라임 3·픽 홍보 1', n(homeTier, /data-prime-empty="1"/g) === 3 && n(homeTier, /data-pick-empty="1"/g) === 1, `prime ${n(homeTier, /data-prime-empty="1"/g)} pick ${n(homeTier, /data-pick-empty="1"/g)}`);

const studentZero = renderSearchTierResults('room', [], { role: 'parent', studentHomeReady: true }, {
  mode: 'region',
  regionLabel: '민락동',
  surfaceType: 'home',
});
ok('학생 홈 0건 픽 안내', studentZero.includes('아직 추천 공부방이 없어요') && n(studentZero, /data-pick-empty="1"/g) === 0);
ok('학생 홈 0건 프라임 빈 칸·제목', n(studentZero, /data-prime-empty="1"/g) === 3 && studentZero.includes('민락동'));

const tutorZero = renderSearchTierResults('tutor', [], { role: 'tutor', tutorHomeReady: true }, {
  mode: 'region',
  regionLabel: '민락동',
  surfaceType: 'home',
});
ok('과외쌤 홈 0건 픽 홍보 1·프라임 3', n(tutorZero, /data-pick-empty="1"/g) === 1 && n(tutorZero, /data-prime-empty="1"/g) === 3, `pick ${n(tutorZero, /data-pick-empty="1"/g)} prime ${n(tutorZero, /data-prime-empty="1"/g)}`);

const searchExec = renderSearchTierResults('room', [basic(5), pick(6)], { role: 'parent' }, {
  mode: 'search',
  regionLabel: '민락동',
  surfaceType: 'search',
  step3Prime: true,
});
ok('찾기 검색에 픽 카드가 있으면 빈 카드 없음', n(searchExec, /data-pick-empty="1"/g) === 0);

const prev = PLAN_RUNTIME_DEFAULTS.pick_set_size;
PLAN_RUNTIME_DEFAULTS.pick_set_size = 7;
const sizedZero = renderPickPaginatedBlock('study_room', 'p', heading, [], {
  viewerRole: 'study_room',
  guest: false,
  surfaceMode: 'region',
});
const sizedMany = renderPickPaginatedBlock(
  'study_room',
  'p',
  heading,
  Array.from({ length: 12 }, (_, i) => pick(100 + i)),
  { viewerRole: 'study_room', guest: false, surfaceMode: 'region', primeOccupied: [] },
);
const sizedSearch = renderPickPaginatedBlock('study_room', 'p', heading, [basic(8)], {
  viewerRole: 'study_room',
  guest: false,
  surfaceMode: 'search',
  vacantFill: true,
  primeOccupied: [],
});
ok('pick_set_size 7이어도 홈 픽 0장은 1장', n(sizedZero, /data-pick-empty="1"/g) === 1);
ok('카드가 있을 때 페이지 크기는 pick_set_size', n(sizedMany, /expo-card--pick(?! expo-card--empty)/g) === 7, String(n(sizedMany, /expo-card--pick(?! expo-card--empty)/g)));
ok('찾기 0장은 pick_set_size와 무관하게 5장', n(sizedSearch, /data-pick-empty="1"/g) === 5);
PLAN_RUNTIME_DEFAULTS.pick_set_size = prev;

console.log(failed ? `\n${failed} failed` : '\nall passed');
process.exit(failed ? 1 : 0);
