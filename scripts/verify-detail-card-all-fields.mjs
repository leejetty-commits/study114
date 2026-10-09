/**
 * 확대카드 = 베이직·픽·프라임 미니카드 항목 합집합 (2026-10-09)
 * 실행: npm run verify:detail-card-all-fields
 *       npm run verify:detail-card-all-fields -- --ref 90cc0f0   (해당 커밋의 확대카드 본문으로 같은 검사 → 수정 전이면 실패)
 *
 * 1) 과외쌤·공부방 × 베이직(목록·표)/픽/프라임 미니카드를 실제 렌더 → 보이는 항목을 모은다.
 *    각 항목이 확대카드 본문(p24-dl)에 칸으로 있고, 값이 찬 검사 입력이면 칸도 차 있다.
 *    배지는 확대카드 상단(buildTrustStrip), 이름은 확대카드 제목, 통계·행동은 확대카드 레일.
 * 2) 등급(exposure_tier)과 관계없이 확대카드 칸 목록이 같다.
 * 3) 빈 item: 깨지지 않고 칸은 「—」(사진은 기존 기본 이미지)만, 견본 문구 없음.
 * 4) 손님: 지역 넓게 · 「로그인 후 확인」 유지. 실명·연락처는 어느 viewer 에서도 본문에 없음.
 * 검사 입력은 이 파일 안 고정값이다(화면 노출 풀·서버와 무관).
 */
import { spawnSync } from 'node:child_process';
import { readFileSync, rmSync, writeFileSync } from 'node:fs';
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

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DETAIL_DIR = 'preview/home-ui/src/detail-decision';
const argv = process.argv.slice(2);
const refIdx = argv.indexOf('--ref');
const REF = refIdx >= 0 ? argv[refIdx + 1] : process.env.DETAIL_CARD_REF || '';

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

/** @param {string} file */
async function loadDetail(file) {
  if (!REF) return import(pathToFileURL(join(ROOT, DETAIL_DIR, file)).href);
  const src = spawnSync('git', ['show', `${REF}:${DETAIL_DIR}/${file}`], { cwd: ROOT, encoding: 'utf8' });
  if (src.status !== 0) throw new Error(`git show ${REF}:${file} 실패 — ${src.stderr}`);
  const tmp = join(ROOT, DETAIL_DIR, `zz-ref-${file.replace(/\.js$/, '')}.tmp.js`);
  writeFileSync(tmp, src.stdout);
  try {
    return await import(pathToFileURL(tmp).href);
  } finally {
    rmSync(tmp, { force: true });
  }
}

const { renderBrowseList, renderExposureBox } = await import('../preview/home-ui/src/exposure-render.js');
const { buildTrustStrip, studyRoomParentInquiryLine } = await import('../preview/home-ui/src/detail-decision/detail-utils.js');
const { coarseRegionForGuest } = await import('../preview/home-ui/src/student-blind-teaser.js');
const { renderTutorDetailBody } = await loadDetail('tutor-detail.js');
const { renderStudyRoomDetailBody } = await loadDetail('studyroom-detail.js');
const shellSrc = REF
  ? spawnSync('git', ['show', `${REF}:${DETAIL_DIR}/detail-shell.js`], { cwd: ROOT, encoding: 'utf8' }).stdout
  : readFileSync(join(ROOT, DETAIL_DIR, 'detail-shell.js'), 'utf8');

console.log(REF ? `--- 기준: ${REF} 의 확대카드 본문 ---` : '--- 기준: 작업 트리 ---');

const PRIVATE = { real_name: '실명비노출값', phone: '010-9876-5432', email: 'hidden-contact@example.test', kakao_id: 'kakao-hidden-id' };
const NOW = new Date().toISOString();

const FULL_TUTOR = {
  id: 9101,
  tutor_display_name: '검사용과외쌤',
  gender: 'female',
  image_path: '/uploads/verify/tutor-photo.jpg',
  location_label: '경기도 수원시',
  grade_band: '중등',
  main_subject_note: '검사과목',
  lesson_places: ['student_home'],
  student_gender_group: 'mixed',
  student_count_group: 'two',
  preferred_fee_amount: 400000,
  lessons_per_week: 2,
  minutes_per_lesson: 90,
  feature_1: '특징하나',
  feature_2: '특징둘',
  feature_3: '특징셋',
  slogan: '슬로건문구',
  verification_doc_count: 2,
  main_material_note: '주교재문구',
  teaching_style_badges: ['꼼꼼함'],
  university_status: 'graduated',
  university_name: '검사대학교',
  major_name: '검사학과',
  career_year_band: 'y4_6',
  intro_short: '소개문구',
  paid_badges: ['sky'],
  published_at: NOW,
  recommend_count: 1,
  review_count: 1,
  ...PRIVATE,
};

const FULL_ROOM = {
  id: 9201,
  study_room_name: '검사용공부방',
  image_path: '/uploads/verify/room-basic.jpg',
  image_path_basic: '/uploads/verify/room-basic.jpg',
  image_path_prime: '/uploads/verify/room-prime.jpg',
  location_label: '서울특별시 강남구 대치동',
  grade_band: '초등',
  main_subject_note: '검사과목',
  lesson_place_type: 'study_room',
  capacity_per_time: '4명',
  lesson_operation_type: 'group_by_time_slot',
  price_amount: 300000,
  feature_1: '특징하나',
  feature_2: '특징둘',
  feature_3: '특징셋',
  slogan: '슬로건문구',
  intro_short: '소개문구',
  inquiry_status: 'open',
  education_office_registered: true,
  career_years: 5,
  paid_badges: ['hot'],
  published_at: NOW,
  recommend_count: 1,
  review_count: 1,
  ...PRIVATE,
};

/** 미니카드 라벨 → 확대카드 칸. HEADER = 확대카드 제목. 모르는 라벨이 나오면 실패(미니카드에 항목이 늘면 여기도 늘린다). */
const LABEL_MAP = {
  tutor: {
    성명: 'HEADER',
    대상: '대상',
    과목: '과목',
    수업장소: '수업장소',
    원생수: '원생수',
    주교재: '주교재',
    특징: '특징',
    강의스타일: '강의스타일',
    소개: '소개',
    슬로건: '슬로건',
    제출자료: '제출자료',
  },
  study_room: {
    공부방명: 'HEADER',
    대상: '대상',
    과목: '과목',
    교습형태: '교습형태',
    원생수: '원생수',
    수업운영방식: '수업운영방식',
    특징: '특징',
    소개: '소개',
    슬로건: '슬로건',
  },
};

const strip = (s) => String(s).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

/** 라벨 없는 칸(사진·성별·지역·가격·일정·태그·슬로건·오버레이) 판별 */
function unlabeledItems(kind, html, item) {
  const out = new Set();
  const region = kind === 'tutor' ? '과외지역' : '위치';
  const price = kind === 'tutor' ? '수업료' : '월 수강료';
  if (/class="expo-media/.test(html)) out.add('사진');
  if (/expo-hcard__loc|expo-overlay-val|expo-tbl__cell--val-only">[^<]*(시|구|동|도)/.test(html)) out.add(region);
  if (/expo-hcard__price|expo-tbl__cell--price/.test(html)) out.add(price);
  if (/expo-hcard__tag/.test(html)) out.add('특징');
  if (/expo-hcard__slogan/.test(html)) out.add('슬로건');
  if (kind === 'tutor') {
    if (/expo-hcard__gender|expo-tbl__val-only/.test(html)) out.add('성별');
    if (/expo-hcard__badge/.test(html)) out.add('대상');
    if (item.lessons_per_week && html.includes(`주${item.lessons_per_week}`)) out.add('일정');
    if (item.lessons_per_week && html.includes(`주 ${item.lessons_per_week}회`)) out.add('일정');
    if (/expo-overlay-bl-grid/.test(html)) ['학적상태', '학교·학과', '경력', '수업료', '일정'].forEach((l) => out.add(l));
  }
  return out;
}

function miniLabels(html) {
  return [
    ...[...html.matchAll(/class="expo-tbl__label">([^<]*)</g)].map((m) => m[1]),
    ...[...html.matchAll(/class="expo-hcard__k">([^<]*)</g)].map((m) => m[1]),
  ];
}

function miniBadges(html) {
  return [...html.matchAll(/class="card-visual__(?:promo|trust)-badge[^"]*">([^<]*)</g)].map((m) => m[1]);
}

/** @returns {Map<string, string>} dt → dd(html) */
function detailRows(html) {
  const rows = new Map();
  for (const m of html.matchAll(/<dt>([^<]*)<\/dt><dd>([\s\S]*?)<\/dd>/g)) rows.set(m[1], m[2]);
  return rows;
}

const MINIS = {
  tutor: {
    basic: (it, guest = false) => renderBrowseList('tutor', [it], { guest }),
    basic_table: (it, guest = false) => renderBrowseList('tutor', [it], { guest, layout: 'table' }),
    pick: (it, guest = false) => renderExposureBox('tutor', 'pick', it, '', { guest }),
    prime: (it, guest = false) => renderExposureBox('tutor', 'prime', it, '', { guest }),
  },
  study_room: {
    basic: (it, guest = false) => renderBrowseList('study_room', [it], { guest }),
    basic_table: (it, guest = false) => renderBrowseList('study_room', [it], { guest, layout: 'table' }),
    pick: (it, guest = false) => renderExposureBox('study_room', 'pick', it, '', { guest }),
    prime: (it, guest = false) => renderExposureBox('study_room', 'prime', it, '', { guest }),
  },
};
const DETAIL = {
  tutor: (it, viewer) => renderTutorDetailBody(it, viewer),
  study_room: (it, viewer) => renderStudyRoomDetailBody(it, viewer),
};
const FULL = { tutor: FULL_TUTOR, study_room: FULL_ROOM };
/** 확대카드 칸 → 미니카드가 같은 라벨로 보여 주는 값(필드) */
const VALUE_OF = {
  tutor: (it) => ({
    성별: '여',
    대상: it.grade_band,
    원생수: '혼성 · 2명',
    슬로건: it.slogan,
    제출자료: `${it.verification_doc_count}개`,
    주교재: it.main_material_note,
    학적상태: '졸업',
    '학교·학과': `${it.university_name} ${it.major_name}`,
    소개: it.intro_short,
  }),
  study_room: (it) => ({
    대상: it.grade_band,
    원생수: it.capacity_per_time,
    슬로건: it.slogan,
    소개: it.intro_short,
  }),
};
const NAME_KEY = { tutor: 'tutor_display_name', study_room: 'study_room_name' };
const KIND_KO = { tutor: '과외쌤', study_room: '공부방' };
const TIER_TO_EXPOSURE = { basic: 'basic', basic_table: 'basic', pick: 'pick', prime: 'prime' };

/** @type {Record<string, Set<string>>} */
const union = { tutor: new Set(), study_room: new Set() };

console.log('--- 1) 미니카드 항목 → 확대카드 칸 ---');
for (const kind of /** @type {const} */ (['tutor', 'study_room'])) {
  for (const [tier, render] of Object.entries(MINIS[kind])) {
    const item = { ...FULL[kind], exposure_tier: TIER_TO_EXPOSURE[tier], position_sku: tier === 'pick' || tier === 'prime' ? tier : '' };
    const mini = render(item);
    const labels = miniLabels(mini);
    const unknown = labels.filter((l) => !LABEL_MAP[kind][l]);
    ok(`${KIND_KO[kind]} ${tier}: 미니카드 라벨이 모두 대응표에 있음`, unknown.length === 0, `모름: ${unknown.join(', ')}`);
    const need = new Set([...labels.map((l) => LABEL_MAP[kind][l]).filter(Boolean), ...unlabeledItems(kind, mini, item)]);
    const detailHtml = DETAIL[kind](item, 'parent');
    const rows = detailRows(detailHtml);
    const missing = [];
    const emptyFilled = [];
    for (const want of need) {
      if (want === 'HEADER') continue;
      union[kind].add(want);
      if (!rows.has(want)) missing.push(want);
      else if (want !== '사진' && ['', '—'].includes(strip(rows.get(want)))) emptyFilled.push(want);
    }
    ok(`${KIND_KO[kind]} ${tier} 항목 ${need.size}개 → 확대카드 칸 있음`, missing.length === 0, `빠짐: ${missing.join(', ')}`);
    ok(`${KIND_KO[kind]} ${tier}: 값 있는 입력이면 확대카드 칸도 값 있음`, emptyFilled.length === 0, `비어 보임: ${emptyFilled.join(', ')}`);
    const wrongVal = Object.entries(VALUE_OF[kind](item))
      .filter(([label]) => need.has(label))
      .filter(([label, v]) => !strip(rows.get(label) || '').includes(v))
      .map(([label, v]) => `${label}≠${v}(${strip(rows.get(label) || '칸 없음')})`);
    ok(`${KIND_KO[kind]} ${tier}: 확대카드 칸 값 = 미니카드와 같은 필드`, wrongVal.length === 0, wrongVal.join(', '));
    if (rows.has('사진')) {
      const src = kind === 'tutor' ? item.image_path : item.image_path_prime;
      ok(`${KIND_KO[kind]} ${tier}: 확대카드 사진 = 등록 사진`, rows.get('사진').includes(`src="${src}"`), rows.get('사진').slice(0, 120));
    }
    const badges = miniBadges(mini);
    const trust = buildTrustStrip(kind, item);
    const noBadge = badges.filter((b) => !trust.includes(`>${b}<`));
    ok(`${KIND_KO[kind]} ${tier}: 미니카드 배지 ${badges.length}개 → 확대카드 상단 배지에 있음`, (tier === 'basic_table' || badges.length > 0) && noBadge.length === 0, `없음: ${noBadge.join(', ')}`);
    ok(`${KIND_KO[kind]} ${tier}: 이름 = 확대카드 제목`, !labels.some((l) => LABEL_MAP[kind][l] === 'HEADER') || shellSrc.includes(`item.${NAME_KEY[kind]}`));
  }
}
ok('확대카드 레일 = 미니카드와 같은 통계·행동(renderItemActions)', /renderItemActions\(\{/.test(shellSrc) && /buildTrustStrip\(kind, item\)/.test(shellSrc));
console.log(`  과외쌤 합집합(${union.tutor.size}): ${[...union.tutor].join(' · ')}`);
console.log(`  공부방 합집합(${union.study_room.size}): ${[...union.study_room].join(' · ')}`);

console.log('--- 2) 등급과 무관한 하나의 확대카드 ---');
for (const kind of /** @type {const} */ (['tutor', 'study_room'])) {
  const keys = ['basic', 'pick', 'prime'].map((t) => [...detailRows(DETAIL[kind]({ ...FULL[kind], exposure_tier: t, position_sku: t === 'basic' ? '' : t }, 'parent')).keys()].join('|'));
  ok(`${KIND_KO[kind]}: 베이직·픽·프라임 item 확대카드 칸 목록 동일`, keys.every((k) => k === keys[0]), keys.join(' / '));
  const basicRows = [...detailRows(DETAIL[kind]({ ...FULL[kind], exposure_tier: 'basic' }, 'parent')).keys()];
  const fromPrime = [...union[kind]].filter((l) => !basicRows.includes(l));
  ok(`${KIND_KO[kind]}: 베이직 item 확대카드에도 픽·프라임 항목 전부`, fromPrime.length === 0, `빠짐: ${fromPrime.join(', ')}`);
}

console.log('--- 3) 빈 item ---');
const SAMPLE_WORDS = /예시 과외쌤|예시 공부방|expo-sample-stamp|샘플|견본|예시|홍길동|OO대|00대/;
for (const kind of /** @type {const} */ (['tutor', 'study_room'])) {
  for (const viewer of ['parent', 'guest']) {
    for (const tier of ['basic', 'pick', 'prime']) {
      const empty = { id: 9300, exposure_tier: tier };
      let html = '';
      ok(`${KIND_KO[kind]} ${tier} 빈 item(${viewer}): 확대카드 렌더 성공`, () => {
        html = DETAIL[kind](empty, viewer);
        return typeof html === 'string' && html.includes('p24-dl');
      });
      if (!html) continue;
      const rows = detailRows(html);
      const allowed = new Set(['—', '', '로그인 후 확인', strip(studyRoomParentInquiryLine(undefined))]);
      const bad = [...rows.entries()].filter(([k, v]) => k !== '사진' && !allowed.has(strip(v))).map(([k, v]) => `${k}=${strip(v)}`);
      ok(`${KIND_KO[kind]} ${tier} 빈 item(${viewer}): 칸 값은 「—」/로그인 후 확인뿐(견본 값 없음)`, bad.length === 0, bad.join(', '));
      ok(`${KIND_KO[kind]} ${tier} 빈 item(${viewer}): 견본 문구 없음`, !SAMPLE_WORDS.test(html), (html.match(SAMPLE_WORDS) || [])[0]);
      const missingRows = [...union[kind]].filter((l) => !rows.has(l));
      ok(`${KIND_KO[kind]} ${tier} 빈 item(${viewer}): 값이 없어도 칸은 모두 있음`, missingRows.length === 0, `빠짐: ${missingRows.join(', ')}`);
      if (rows.has('사진')) {
        const photo = rows.get('사진');
        const fallbackOk = kind === 'tutor'
          ? /expo-media--placeholder/.test(photo) && !/<img/.test(photo)
          : /\/assets\/brand\/room-card-default-/.test(photo);
        ok(`${KIND_KO[kind]} ${tier} 빈 item(${viewer}): 사진 = 미니카드와 같은 기본 표시`, fallbackOk, photo.slice(0, 160));
      }
    }
  }
}

console.log('--- 4) 손님 가림 · 실명·연락처 ---');
{
  const g = detailRows(renderTutorDetailBody(FULL_TUTOR, 'guest'));
  ok('손님 과외쌤: 과외지역 = coarseRegionForGuest(…, tutor)', strip(g.get('과외지역') || '') === coarseRegionForGuest(FULL_TUTOR.location_label, 'tutor'), strip(g.get('과외지역') || ''));
  for (const l of ['일정', '강의스타일', '학적상태', '학교·학과']) {
    ok(`손님 과외쌤: ${l} = 로그인 후 확인`, strip(g.get(l) || '') === '로그인 후 확인', strip(g.get(l) || '(칸 없음)'));
  }
  const gTutorHtml = renderTutorDetailBody(FULL_TUTOR, 'guest');
  ok('손님 과외쌤: 학교명·학과 값 본문에 없음', !gTutorHtml.includes(FULL_TUTOR.university_name) && !gTutorHtml.includes(FULL_TUTOR.major_name));
  const rGuestHtml = renderStudyRoomDetailBody(FULL_ROOM, 'guest');
  const r = detailRows(rGuestHtml);
  const coarse = coarseRegionForGuest(FULL_ROOM.location_label, 'study_room');
  ok('손님 공부방: 위치 = coarseRegionForGuest(…, study_room)', strip(r.get('위치') || '') === coarse, strip(r.get('위치') || ''));
  ok('손님 공부방: 상세 주소 원문 본문에 없음', coarse === FULL_ROOM.location_label || !rGuestHtml.includes(FULL_ROOM.location_label));
  ok('손님 공부방: 위치 핀은 로그인 후', rGuestHtml.includes('위치 핀은 로그인 후') && !rGuestHtml.includes('data-member-map="true"'));
  for (const kind of /** @type {const} */ (['tutor', 'study_room'])) {
    for (const viewer of ['guest', 'parent', 'tutor', 'study_room', 'student', 'admin']) {
      const html = DETAIL[kind](FULL[kind], viewer);
      const leak = Object.values(PRIVATE).filter((v) => html.includes(v));
      ok(`${KIND_KO[kind]} ${viewer}: 실명·연락처 비노출`, leak.length === 0, leak.join(', '));
    }
  }
}

console.log(`\n${passed} passed, ${failed} failed${REF ? ` (기준 ${REF})` : ''}`);
process.exit(failed ? 1 : 0);
