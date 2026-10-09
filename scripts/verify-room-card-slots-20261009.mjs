/**
 * 2026-10-09 공부방 카드 = 과외쌤 카드 규칙(정본 73) 맞추기
 * 실행: cd preview/home-ui && npx vite-node ../../scripts/verify-room-card-slots-20261009.mjs
 *       VERIFY_ROOT=<다른 작업 폴더> 를 주면 그 폴더의 코드로 같은 검사를 한다(수정 전 비교용).
 *
 * (1) 홈·찜·확대카드 변환이 검색 응답의 공부방 카드 값(대상·교습형태·슬로건·원생수·수업운영방식·특징)을 그대로 넘긴다.
 * (2) summary 줄로 과목·소개를 대신 채우지 않는다(홈·확대카드·검색 페이지 변환).
 * (3) 공부방·과외쌤 베이직·픽·프라임·확대카드: 값이 없어도 항목제목은 보이고 값 자리는 「—」. 「(선택)」 표시 없음.
 * (4) 원생수는 1~4명 / 5~8명 / 9명 이상 으로 보인다(영어 코드 그대로 안 보임).
 * (5) 칸 이름은 「수업운영방식」 하나(「수업형태」 안 씀).
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

if (typeof globalThis.sessionStorage === 'undefined') {
  const mem = new Map();
  globalThis.sessionStorage = {
    getItem: (k) => (mem.has(k) ? mem.get(k) : null),
    setItem: (k, v) => mem.set(k, String(v)),
    removeItem: (k) => mem.delete(k),
    clear: () => mem.clear(),
  };
}
if (typeof globalThis.localStorage === 'undefined') globalThis.localStorage = globalThis.sessionStorage;
if (typeof globalThis.window === 'undefined') globalThis.window = globalThis;
globalThis.window.location = globalThis.window.location || {
  hash: '',
  href: 'http://localhost/',
  origin: 'http://localhost',
  pathname: '/',
  search: '',
};
if (typeof globalThis.document === 'undefined') {
  globalThis.document = { body: {}, querySelector: () => null, querySelectorAll: () => [] };
}

const ROOT = process.env.VERIFY_ROOT || join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => (existsSync(join(ROOT, rel)) ? readFileSync(join(ROOT, rel), 'utf8') : '');
const load = (rel) => import(pathToFileURL(join(ROOT, rel)).href);

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
    console.error(`FAIL  ${name}${detail ? ` - ${detail}` : ''}`);
  }
}

console.log(`--- 기준 폴더: ${ROOT} ---`);

/* ══════════════ 1부 정적 ══════════════ */
console.log('##### 1부 정적 #####');

const liveSrc = read('preview/home-ui/src/home-basic-live.js');
const bridgeSrc = read('preview/home-ui/src/exposure-bridge.js');
const searchMapperSrc = read('preview/search-ui/src/search-exposure-mapper.js');
const renderSrc = read('preview/home-ui/src/exposure-render.js');
const roomDetailSrc = read('preview/home-ui/src/detail-decision/studyroom-detail.js');
const shopVmSrc = read('preview/home-ui/src/study-room-reg/shop-view-model.js');

const fnBody = (src, name) => {
  const i = src.indexOf(`function ${name}(`);
  if (i < 0) return '';
  const ends = ['\nfunction ', '\nexport ', '\n/**', '\n//']
    .map((m) => src.indexOf(m, i + 10))
    .filter((n) => n > 0);
  return src.slice(i, ends.length ? Math.min(...ends) : undefined);
};

ok('(1) 홈 변환: 공부방 카드 값 함수(studyRoomSearchCardFields) 사용', /export function studyRoomSearchCardFields/.test(liveSrc) && /\.\.\.studyRoomSearchCardFields\(item\)/.test(fnBody(liveSrc, 'mapRoom')));
ok('(1) 확대카드 대체 변환(exposure-bridge): 같은 함수 사용', /studyRoomSearchCardFields\(item\)/.test(fnBody(bridgeSrc, 'mapRoomItem')));
ok('(2) 홈 변환: summary 로 대신 채우지 않음', !/summary/.test(fnBody(liveSrc, 'mapRoom')) && !/summary/.test(fnBody(liveSrc, 'studyRoomSearchCardFields')));
ok('(2) 확대카드 대체 변환: summary 로 대신 채우지 않음', !/summary/.test(fnBody(bridgeSrc, 'mapRoomItem')));
{
  const roomBranch = searchMapperSrc.slice(searchMapperSrc.indexOf("if (tab === 'room')"), searchMapperSrc.indexOf("if (tab === 'tutor')"));
  ok('(2) 검색 페이지 변환: 공부방 summary 줄 대체 없음', roomBranch.length > 0 && !/summaryLines/.test(roomBranch));
}
ok('(3) 공부방 교습형태 「(선택)」 함수 삭제', !/optionalStudyRoomPlace/.test(renderSrc));
ok('(3) 과외쌤 수업장소 「(선택)」 표시 없음', !/'\(선택\)'/.test(fnBody(renderSrc, 'optionalTutorPlaces')));
ok('(5) 카드 렌더에 「수업형태」 칸 이름 없음', !/'수업형태'/.test(renderSrc));
ok('(5) 확대카드: 「수업운영방식」', /<dt>수업운영방식<\/dt>/.test(roomDetailSrc) && !/<dt>수업형태<\/dt>/.test(roomDetailSrc));
ok('(5) 마이샵 칸: 「수업운영방식」', /label: '수업운영방식'/.test(shopVmSrc) && !/label: '수업형태'/.test(shopVmSrc));
{
  const doc47 = read('docs/internal/47-study-room-home-card-map.md');
  ok('정본 47: 베이직 9칸 최종 표 + 빈 값 「—」', /9칸/.test(doc47) && /수업운영방식/.test(doc47) && /「—」/.test(doc47));
  ok('정본 47: 옛 공개 게이트 문장 정리', !/지금 등록 완료가 막는 것/.test(doc47));
}

/* ══════════════ 2부 실행 ══════════════ */
console.log('\n##### 2부 실행 #####');

const { renderBrowseList, renderExposureBox } = await load('preview/home-ui/src/exposure-render.js');
const { renderStudyRoomDetailBody } = await load('preview/home-ui/src/detail-decision/studyroom-detail.js');
const live = await load('preview/home-ui/src/home-basic-live.js');

const strip = (s) => String(s).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

/** 카드 html → { 항목제목: 값 } */
function slots(html) {
  const out = {};
  for (const m of html.matchAll(/class="expo-tbl__label">([^<]*)<\/span><span class="expo-tbl__val">([^<]*)</g)) out[m[1]] = m[2].trim();
  for (const m of html.matchAll(/class="expo-hcard__k">([^<]*)<\/span><span class="expo-hcard__v">([^<]*)</g)) out[m[1]] = m[2].trim();
  for (const m of html.matchAll(/class="expo-hcard__k">슬로건<\/span>([^<]*)</g)) out['슬로건'] = m[1].trim();
  for (const m of html.matchAll(/class="expo-hcard__k">특징<\/span>([\s\S]*?)<\/div>/g)) out['특징'] = strip(m[1]);
  return out;
}
function details(html) {
  const out = {};
  for (const m of html.matchAll(/<dt>([^<]*)<\/dt><dd>([\s\S]*?)<\/dd>/g)) out[m[1]] = strip(m[2]);
  return out;
}

/** 서버 SearchService::searchRooms item 모양(계동공부방1 처럼 상세 미입력) */
const SERVER_ROOM = {
  id: 7001,
  title: '계동공부방1',
  region_label: '서울특별시 종로구 계동',
  summary: '수학\n잘 가르쳐요',
  price_amount: null,
  main_subject_note: '수학',
  grade_band: '초등',
  intro_short: '',
  feature_1: '',
  feature_2: '',
  feature_3: '',
  slogan: '잘 가르쳐요',
  teaching_style: '',
  lesson_place_type: 'study_room',
  capacity_per_time: null,
  lesson_operation_type: null,
  inquiry_status: 'open',
  detail_completion_status: 'basic_only',
  position_sku: null,
  image_path: '',
  image_path_basic: '',
  image_path_prime: '',
};

const mapped = live.mapSearchRoomItem(SERVER_ROOM);
ok('(1) 홈·찜 변환: 대상 그대로', mapped.grade_band === '초등', mapped.grade_band);
ok('(1) 홈·찜 변환: 교습형태 그대로', mapped.lesson_place_type === 'study_room', mapped.lesson_place_type);
ok('(1) 홈·찜 변환: 슬로건 그대로', mapped.slogan === '잘 가르쳐요', mapped.slogan);
{
  const full = live.mapSearchRoomItem({ ...SERVER_ROOM, capacity_per_time: 'five_to_eight', lesson_operation_type: 'individual_visit', feature_1: 'F1', feature_2: 'F2', feature_3: 'F3', intro_short: '소개' });
  ok('(1) 홈·찜 변환: 원생수·수업운영방식·특징·소개 그대로', full.capacity_per_time === 'five_to_eight' && full.lesson_operation_type === 'individual_visit' && full.feature_1 === 'F1' && full.feature_3 === 'F3' && full.intro_short === '소개');
}
{
  const noSubject = live.mapSearchRoomItem({ ...SERVER_ROOM, main_subject_note: '', summary: '소개가과목칸에\n두번째' });
  ok('(2) 홈·찜 변환: 과목이 비면 비워 둠(summary 대체 없음)', noSubject.main_subject_note === '', noSubject.main_subject_note);
  ok('(2) 홈·찜 변환: 소개가 비면 비워 둠', noSubject.intro_short === '', noSubject.intro_short);
}

{
  const html = renderBrowseList('study_room', [mapped], { guest: false });
  const s = slots(html);
  ok('(1) 계동공부방1 베이직: 교습형태 = 공부방', s['교습형태'] === '공부방', JSON.stringify(s));
  ok('(1) 계동공부방1 베이직: 대상 = 초등', s['대상'] === '초등', s['대상']);
  ok('(1) 계동공부방1 베이직: 슬로건 = 잘 가르쳐요', s['슬로건'] === '잘 가르쳐요', s['슬로건']);
  ok('(3) 계동공부방1 베이직: 원생수 칸 있음 · 「—」', s['원생수'] === '—', s['원생수']);
  ok('(3) 계동공부방1 베이직: 수업운영방식 칸 있음 · 「—」', s['수업운영방식'] === '—', s['수업운영방식']);
  ok('(3) 계동공부방1 베이직: 가격 자리 「—」', /expo-hcard__price">—</.test(html));
}

const ROOM_LABELS_BASIC = ['교습형태', '대상', '과목', '원생수', '수업운영방식', '슬로건'];
const ROOM_LABELS_PICK = [...ROOM_LABELS_BASIC, '특징'];
const ROOM_LABELS_PRIME = [...ROOM_LABELS_PICK, '소개'];
const EMPTY_ROOM = { id: 7101, study_room_name: '빈공부방', location_label: '' };
const ROOM_RENDERS = {
  basic: [(it) => renderBrowseList('study_room', [it], { guest: false }), ROOM_LABELS_BASIC],
  basic_guest: [(it) => renderBrowseList('study_room', [it], { guest: true }), ROOM_LABELS_BASIC],
  basic_table: [(it) => renderBrowseList('study_room', [it], { guest: false, layout: 'table' }), ROOM_LABELS_BASIC],
  pick: [(it) => renderExposureBox('study_room', 'pick', { ...it, exposure_tier: 'pick', position_sku: 'pick' }, '', {}), ROOM_LABELS_PICK],
  prime: [(it) => renderExposureBox('study_room', 'prime', { ...it, exposure_tier: 'prime', position_sku: 'prime' }, '', {}), ROOM_LABELS_PRIME],
};
for (const [tier, [render, labels]] of Object.entries(ROOM_RENDERS)) {
  const html = render(EMPTY_ROOM);
  const s = slots(html);
  const missing = labels.filter((l) => !(l in s));
  const notDash = labels.filter((l) => l in s && s[l] !== '—');
  ok(`(3) 공부방 ${tier} 빈 값: 항목제목 ${labels.length}개 모두 보임`, missing.length === 0, `빠짐: ${missing.join(', ')}`);
  ok(`(3) 공부방 ${tier} 빈 값: 값 자리 「—」`, notDash.length === 0, notDash.map((l) => `${l}=${s[l]}`).join(', '));
  ok(`(3) 공부방 ${tier}: 「(선택)」 없음`, !html.includes('(선택)'));
  ok(`(5) 공부방 ${tier}: 「수업형태」 없음`, !html.includes('수업형태'));
}

const CAP = { one_to_four: '1~4명', five_to_eight: '5~8명', nine_plus: '9명 이상' };
for (const [code, label] of Object.entries(CAP)) {
  const it = { ...EMPTY_ROOM, capacity_per_time: code };
  for (const [tier, [render]] of Object.entries(ROOM_RENDERS)) {
    const html = render(it);
    ok(`(4) 공부방 ${tier}: ${code} → ${label}`, slots(html)['원생수'] === label && !html.includes(code), slots(html)['원생수']);
  }
  const d = details(renderStudyRoomDetailBody(it, 'parent'));
  ok(`(4) 확대카드: ${code} → ${label}`, d['원생수'] === label, d['원생수']);
}
ok('(4) 모르는 영어 코드는 「—」', slots(ROOM_RENDERS.basic[0]({ ...EMPTY_ROOM, capacity_per_time: 'unknown_code' }))['원생수'] === '—');
ok('(4) 예전 자유 입력 문구는 그대로', slots(ROOM_RENDERS.basic[0]({ ...EMPTY_ROOM, capacity_per_time: '4명' }))['원생수'] === '4명');

{
  const d = details(renderStudyRoomDetailBody({ ...EMPTY_ROOM, lesson_operation_type: 'group_by_time_slot' }, 'parent'));
  ok('(5) 확대카드: 수업운영방식 = 타임별 그룹', d['수업운영방식'] === '타임별 그룹', JSON.stringify(d));
  const e = details(renderStudyRoomDetailBody(EMPTY_ROOM, 'parent'));
  const want = ['교습형태', '대상', '과목', '원생수', '수업운영방식', '슬로건', '특징', '소개', '월 수강료'];
  ok('(3) 확대카드 빈 값: 칸 모두 있고 「—」', want.every((l) => e[l] === '—'), want.map((l) => `${l}=${e[l]}`).join(', '));
}

const TUTOR_LABELS = ['과목', '원생수', '수업장소', '특징', '슬로건'];
const EMPTY_TUTOR = { id: 7201, tutor_display_name: '빈과외쌤', location_label: '' };
for (const guest of [false, true]) {
  const html = renderBrowseList('tutor', [EMPTY_TUTOR], { guest });
  const s = slots(html);
  const missing = TUTOR_LABELS.filter((l) => !(l in s));
  const notDash = TUTOR_LABELS.filter((l) => l in s && s[l] !== '—');
  ok(`(3) 과외쌤 베이직(${guest ? '손님' : '로그인'}) 빈 값: 항목제목 모두 보임`, missing.length === 0, `빠짐: ${missing.join(', ')}`);
  ok(`(3) 과외쌤 베이직(${guest ? '손님' : '로그인'}) 빈 값: 값 자리 「—」`, notDash.length === 0, notDash.map((l) => `${l}=${s[l]}`).join(', '));
  ok(`(3) 과외쌤 베이직(${guest ? '손님' : '로그인'}): 「(선택)」 없음`, !html.includes('(선택)'));
}
{
  const html = renderBrowseList('tutor', [{ ...EMPTY_TUTOR, feature_1: '꼼꼼', slogan: '열심히' }], { guest: false });
  ok('(3) 과외쌤 베이직: 값이 있으면 특징·슬로건 그대로', /expo-hcard__tag">꼼꼼</.test(html) && slots(html)['슬로건'] === '열심히');
}
for (const tier of ['pick', 'prime']) {
  const html = renderExposureBox('tutor', tier, { ...EMPTY_TUTOR, exposure_tier: tier, position_sku: tier }, '', {});
  const s = slots(html);
  const want = ['대상', '과목', '수업장소', '원생수', '주교재', '특징', '강의스타일', '슬로건'];
  const bad = want.filter((l) => s[l] !== '—');
  ok(`(3) 과외쌤 ${tier} 빈 값: 항목제목 보이고 「—」`, bad.length === 0, bad.map((l) => `${l}=${s[l]}`).join(', '));
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
