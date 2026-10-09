/**
 * 2026-10-09 모든 카드 경로 × 칸 점검 — 서버 검색 응답 모양 그대로 넣고, 각 변환을 지나 카드에 같은 값이 나오는지 본다.
 * 실행: cd preview/home-ui && npx vite-node ../../scripts/verify-card-field-paths-20261009.mjs
 *       VERIFY_ROOT=<다른 작업 폴더> 를 주면 그 폴더의 코드로 같은 점검을 한다(수정 전 비교용).
 *
 * 입력 = SearchService 의 items 키만 쓴 값(searchRooms 750~800, searchTutors 1001~1062, searchStudents 1288~1313).
 * 경로:
 *   공부방  홈·찜(home-basic-live mapRoom) / 공부방 모드 홈(study-room-home-seed mapLiveRoom) / 확대카드 대체(exposure-bridge) / 찾기·검색(search-exposure-mapper)
 *   과외쌤  홈·찜(mapTutor) / 확대카드 대체(exposure-bridge) / 찾기·검색·과외쌤 모드 홈(search-exposure-mapper)
 *   학생    홈(mapStudent) / 확대카드 대체(exposure-bridge) / 찾기·검색·공부방·과외쌤 모드 홈(search-exposure-mapper)
 * 카드: 베이직(가로) · 픽 · 프라임 · 확대카드. 학생은 베이직 · 확대카드.
 * 하나라도 어긋나면 종료 코드 1. 학생 빈 칸 「—」·요청문 잠금 문구·서버 응답 칸도 본다.
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
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
globalThis.window.location = globalThis.window.location || { hash: '', href: 'http://localhost/', origin: 'http://localhost', pathname: '/', search: '' };
if (typeof globalThis.document === 'undefined') {
  globalThis.document = { body: {}, querySelector: () => null, querySelectorAll: () => [] };
}

const ROOT = process.env.VERIFY_ROOT || join(dirname(fileURLToPath(import.meta.url)), '..');
const load = (rel) => import(pathToFileURL(join(ROOT, rel)).href);

const R = await load('preview/home-ui/src/exposure-render.js');
const F = await load('preview/home-ui/src/exposure-format.js');
const live = await load('preview/home-ui/src/home-basic-live.js');
const bridge = await load('preview/home-ui/src/exposure-bridge.js');
const seed = await load('preview/home-ui/src/study-room-home-seed.js');
const mapper = await load('preview/search-ui/src/search-exposure-mapper.js');
const { renderStudyRoomDetailBody } = await load('preview/home-ui/src/detail-decision/studyroom-detail.js');
const { renderTutorDetailBody } = await load('preview/home-ui/src/detail-decision/tutor-detail.js');
const { renderStudentRequestBody } = await load('preview/home-ui/src/detail-decision/student-request-card.js');

const strip = (s) => String(s ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
function slots(html) {
  const out = {};
  for (const m of html.matchAll(/class="expo-tbl__label">([^<]*)<\/span><span class="expo-tbl__val">([^<]*)</g)) out[m[1]] = m[2].trim();
  for (const m of html.matchAll(/class="expo-hcard__k">([^<]*)<\/span><span class="expo-hcard__v">([^<]*)</g)) out[m[1]] = m[2].trim();
  for (const m of html.matchAll(/class="expo-hcard__k">슬로건<\/span>([^<]*)</g)) out['슬로건'] = m[1].trim();
  for (const m of html.matchAll(/class="expo-hcard__k">특징<\/span>([\s\S]*?)<\/div>/g)) out['특징'] = strip(m[1]);
  const price = html.match(/class="expo-hcard__price">([^<]*)</);
  if (price) out['(가격)'] = price[1].trim();
  const loc = html.match(/class="expo-hcard__loc">([^<]*)</);
  if (loc) out['(위치)'] = loc[1].trim();
  const badge = html.match(/class="expo-hcard__badge">([^<]*)</);
  if (badge) out['(대상 배지)'] = badge[1].trim();
  const gender = html.match(/class="expo-hcard__gender">([^<]*)</);
  if (gender) out['(성별)'] = gender[1].trim();
  return out;
}
function details(html) {
  const out = {};
  for (const m of html.matchAll(/<dt>([^<]*)<\/dt><dd>([\s\S]*?)<\/dd>/g)) out[m[1]] = strip(m[2]);
  return out;
}

/* ── 서버 응답 모양 입력 ── */
const SERVER_ROOM = {
  id: 8101, title: '점검공부방', region_label: '서울특별시 종로구 계동', summary: '수학 영어\n점검소개',
  price_amount: 250000, price_label: '월 250천원~', main_subject_note: '수학 영어', grade_band: '초등 중등',
  intro_short: '점검소개', intro_long: '', feature_1: '특징A', feature_2: '특징B', feature_3: '특징C', slogan: '점검슬로건',
  teaching_style: '', lesson_place_type: 'study_room', capacity_per_time: 'five_to_eight', lesson_operation_type: 'group_by_time_slot',
  facility_summary: '', inquiry_status: 'open', profile_status: 'published', education_office_registered: true, career_years: 3,
  business_registration_available: false, detail_completion_status: 'expanded_complete', prime_eligible: true, position_sku: null,
  exposure_tier: 'basic', latitude: null, longitude: null, published_at: '2026-10-01 10:00:00', created_at: '2026-10-01 10:00:00',
  is_new: false, recommend_count: 0, review_count: 0, paid_badges: [], image_path_prime: '', image_path_basic: '', image_path: '',
};
const SERVER_TUTOR = {
  id: 8201, title: '점검과외쌤', region_label: '경기도 수원시', summary: '국어', price_label: '월 400천원~', preferred_fee_amount: 400000,
  main_subject_note: '국어', gender: 'female', grade_band: '중등', slogan: '과외슬로건', intro_short: '과외소개',
  feature_1: '특징가', feature_2: '특징나', feature_3: '특징다', main_material_note: '주교재X', student_gender_group: 'mixed',
  student_count_group: 'two', university_name: '점검대', major_name: '점검과', university_status: 'graduated',
  proof_document_available: true, career_year_band: 'y4_6', lessons_per_week: 2, minutes_per_lesson: 90,
  detail_completion_status: 'expanded_complete', profile_status: 'published', prime_eligible: true, position_sku: null,
  exposure_tier: 'basic', published_at: '2026-10-01 10:00:00', created_at: '2026-10-01 10:00:00', is_new: false,
  recommend_count: 0, review_count: 0, paid_badges: [], image_path_prime: '', image_path_basic: '', image_path: '',
  lesson_places: ['student_home_visit'], teaching_style_badges: ['passion'],
};
const SERVER_STUDENT = {
  id: 8301, title: '김민수학생', grade_level: '중2', gender: 'male', summary: '수학 · 강남구 · 그룹과외 · 남 · 2명',
  budget_label: '월 300천원', subject_name: '수학', region_label: '강남구', lesson_format: 'group', student_gender_group: 'male',
  preferred_student_count_group: 'two', preferred_lesson_type: 'tutor', preferred_fee_amount: 300000,
  preferred_studyroom_fee_amount: null, budget_amount: null, published_at: '2026-10-01 10:00:00', created_at: '2026-10-01 10:00:00',
  exposure_tier: 'basic', request_summary: '요청문구', special_request_note: '특이문구',
  lessons_per_week: 2, minutes_per_lesson: 60, lesson_places: ['student_home', 'public_place'], teaching_style_badges: ['kind'],
};

/* ── 기대값 = 서버 값을 화면 표시 함수에 넣은 결과 ── */
const ROOM_EXPECT = {
  교습형태: F.formatLessonPlace(SERVER_ROOM.lesson_place_type),
  대상: SERVER_ROOM.grade_band,
  과목: SERVER_ROOM.main_subject_note,
  원생수: '5~8명',
  수업운영방식: F.formatLessonOperationType(SERVER_ROOM.lesson_operation_type),
  슬로건: SERVER_ROOM.slogan,
};
const ROOM_PICK = { ...ROOM_EXPECT, 특징: '특징A' };
const ROOM_PRIME = { ...ROOM_EXPECT, 특징: '특징A · 특징B · 특징C', 소개: '점검소개' };
const ROOM_DETAIL = { ...ROOM_EXPECT, '월 수강료': F.formatMonthlyWon(SERVER_ROOM.price_amount), 특징: '특징A · 특징B · 특징C', 소개: '점검소개' };

const tutorTarget = F.formatTutorStudentTarget(SERVER_TUTOR);
const TUTOR_BASIC = {
  과목: '국어', 원생수: tutorTarget, 수업장소: '학생자택방문', 특징: '특징가 특징나 특징다', 슬로건: '과외슬로건',
  '(대상 배지)': '중등', '(성별)': '여', '(가격)': F.formatTutorFeeCard(SERVER_TUTOR),
};
const TUTOR_TABLE = { 대상: '중등', 과목: '국어', 수업장소: '학생자택방문', 원생수: tutorTarget, 주교재: '주교재X', 슬로건: '과외슬로건' };
const TUTOR_PICK = { ...TUTOR_TABLE, 특징: '특징가', 강의스타일: '열정' };
const TUTOR_PRIME = { ...TUTOR_TABLE, 특징: '특징가 · 특징나 · 특징다', 강의스타일: '열정', 소개: '과외소개' };
const TUTOR_DETAIL = {
  성별: '여', 과목: '국어', 수업장소: '학생자택방문', 대상: '중등', 원생수: tutorTarget, 슬로건: '과외슬로건',
  주교재: '주교재X', 강의스타일: '열정', 특징: '특징가 · 특징나 · 특징다', '학교·학과': '점검대 점검과', 소개: '과외소개',
};

const studentStyle = F.formatTeachingStyleBadges(SERVER_STUDENT.teaching_style_badges, 2);
const STUDENT_BASIC = {
  과목: '수학', 수업장소: '학생자택 · 공공장소', 원생수: F.formatStudentLessonTarget(SERVER_STUDENT), 일정: '주2·60분',
  '한 줄 요청': '요청문구', 특이요청: '특이문구', 강의스타일: studentStyle,
  '(대상 배지)': '중2', '(가격)': F.formatStudentBudgetCard(SERVER_STUDENT),
};
const STUDENT_DETAIL = {
  학년: '중2', '희망 과목': '수학', '희망 수업장소': '학생자택 · 공공장소', 수업형태: '그룹과외', '그룹 구성': '남',
  '희망 수업인원': '2명', 일정: '주2·60분', '희망 강의스타일': studentStyle, 수업예산: '월 300천원',
};

/* ── 경로 ── */
const PATHS = {
  study_room: {
    '홈·찜 (home-basic-live)': () => live.mapSearchRoomItem(SERVER_ROOM),
    '공부방 모드 홈 (study-room-home-seed)': () => seed.mapLiveRoom(SERVER_ROOM),
    '확대카드 대체 (exposure-bridge)': () => bridge.mapBridgeRoomItem(SERVER_ROOM),
    '찾기·검색 (search-exposure-mapper)': () => mapper.mapToExposureItem('room', SERVER_ROOM, 0),
  },
  tutor: {
    '홈·찜 (home-basic-live)': () => live.mapSearchTutorItem(SERVER_TUTOR),
    '확대카드 대체 (exposure-bridge)': () => bridge.mapBridgeTutorItem(SERVER_TUTOR),
    '찾기·검색·과외쌤 모드 홈 (search-exposure-mapper)': () => mapper.mapToExposureItem('tutor', SERVER_TUTOR, 0),
  },
  student: {
    '홈 (home-basic-live)': () => live.mapSearchStudentItem(SERVER_STUDENT),
    '확대카드 대체 (exposure-bridge)': () => bridge.mapBridgeStudentItem(SERVER_STUDENT),
    '찾기·검색·모드 홈 (search-exposure-mapper)': () => mapper.mapToExposureItem('student', SERVER_STUDENT, 0),
  },
};

const tier = (it, t) => ({ ...it, exposure_tier: t, position_sku: t });
const CARDS = {
  study_room: {
    베이직: [(it) => slots(R.renderBrowseList('study_room', [it], { guest: false })), ROOM_EXPECT],
    픽: [(it) => slots(R.renderExposureBox('study_room', 'pick', tier(it, 'pick'), '', {})), ROOM_PICK],
    프라임: [(it) => slots(R.renderExposureBox('study_room', 'prime', tier(it, 'prime'), '', {})), ROOM_PRIME],
    확대카드: [(it) => details(renderStudyRoomDetailBody(it, 'parent')), ROOM_DETAIL],
  },
  tutor: {
    베이직: [(it) => slots(R.renderBrowseList('tutor', [it], { guest: false })), TUTOR_BASIC],
    픽: [(it) => slots(R.renderExposureBox('tutor', 'pick', tier(it, 'pick'), '', {})), TUTOR_PICK],
    프라임: [(it) => slots(R.renderExposureBox('tutor', 'prime', tier(it, 'prime'), '', {})), TUTOR_PRIME],
    확대카드: [(it) => details(renderTutorDetailBody(it, 'parent')), TUTOR_DETAIL],
  },
  student: {
    베이직: [(it) => slots(R.renderBrowseList('student', [it], { guest: false, viewerRole: 'tutor' })), STUDENT_BASIC],
    확대카드: [(it) => details(renderStudentRequestBody(it, 'tutor')), STUDENT_DETAIL],
  },
};

const KO = { study_room: '공부방', tutor: '과외쌤', student: '학생' };
let hardFail = 0;
let pass = 0;
for (const kind of ['study_room', 'tutor', 'student']) {
  console.log(`\n===== ${KO[kind]} =====`);
  for (const [pathName, toItem] of Object.entries(PATHS[kind])) {
    let item;
    try {
      item = toItem();
    } catch (e) {
      console.error(`FAIL  ${KO[kind]} ${pathName}: 변환 실패 ${e?.message || e}`);
      hardFail += 1;
      continue;
    }
    for (const [cardName, [read, expect]] of Object.entries(CARDS[kind])) {
      let got;
      try {
        got = read(item);
      } catch (e) {
        got = { __error: String(e?.message || e) };
      }
      const bad = Object.entries(expect).filter(([k, v]) => got[k] !== v).map(([k, v]) => `${k}: 기대 「${v}」 / 화면 「${got[k] ?? '(칸 없음)'}」`);
      const tag = `${KO[kind]} ${pathName} → ${cardName}`;
      if (!bad.length) {
        pass += 1;
        console.log(`PASS  ${tag} (${Object.keys(expect).length}칸)`);
      } else {
        hardFail += 1;
        console.error(`FAIL  ${tag}\n        ${bad.join('\n        ')}`);
      }
    }
  }
}

function check(name, cond, detail = '') {
  if (cond) {
    pass += 1;
    console.log(`PASS  ${name}`);
  } else {
    hardFail += 1;
    console.error(`FAIL  ${name}${detail ? `\n        ${detail}` : ''}`);
  }
}

console.log('\n===== 서버 학생 응답 칸 (SearchService::searchStudents) =====');
{
  const php = readFileSync(join(ROOT, 'src/Search/SearchService.php'), 'utf8');
  const start = php.indexOf('private function searchStudents(');
  const body = start >= 0 ? php.slice(start, php.indexOf('\n    private function ', start + 10)) : '';
  check('SELECT 에 주회·분', /s\.lessons_per_week/.test(body) && /s\.minutes_per_lesson/.test(body));
  check("응답에 'lessons_per_week'·'minutes_per_lesson'", /'lessons_per_week'\s*=>/.test(body) && /'minutes_per_lesson'\s*=>/.test(body));
  check('응답에 희망 수업장소·강의스타일', /loadStudentCodeMap\(\$pdo, 'lesson_places'/.test(body) && /loadStudentCodeMap\(\$pdo, 'teaching_style_badges'/.test(body) && /\['lesson_places'\]/.test(body) && /\['teaching_style_badges'\]/.test(body));
  check('희망 수업장소·강의스타일 표에서 읽음', /FROM student_preferred_lesson_places/.test(php) && /FROM student_preferred_teaching_style_badges/.test(php));
}

console.log('\n===== 학생 빈 값 · 요청문 잠금 =====');
{
  const vis = await load('preview/home-ui/src/student-visibility.js');
  const isPaidProviderViewer = vis.isPaidProviderViewer;
  const LOCK = vis.STUDENT_REQUEST_CARD_LOCK || { nonProvider: '(잠금 문구 없음)', unpaidProvider: '(잠금 문구 없음)' };
  const EMPTY = { id: 8399, public_display_name: '빈학생', location_label: '' };
  const want = ['과목', '수업장소', '원생수', '일정', '한 줄 요청', '특이요청', '강의스타일'];
  const tutorView = slots(R.renderBrowseList('student', [EMPTY], { guest: false, viewerRole: 'tutor' }));
  check('빈 학생 베이직: 항목제목 7개 모두 보임', want.every((k) => k in tutorView), `빠짐: ${want.filter((k) => !(k in tutorView)).join(', ')}`);
  const plain = ['과목', '수업장소', '원생수', '일정', '강의스타일', '(대상 배지)', '(위치)'];
  check('빈 학생 베이직: 값 자리 「—」(학년 배지·위치 포함)', plain.every((k) => tutorView[k] === '—'), plain.map((k) => `${k}=${tutorView[k]}`).join(', '));
  check('빈 학생 베이직: 「(선택)」 없음', !R.renderBrowseList('student', [EMPTY], { guest: false, viewerRole: 'tutor' }).includes('(선택)'));

  const providerEmpty = isPaidProviderViewer('tutor') ? '—' : LOCK.unpaidProvider;
  check(`과외쌤(이용권 ${isPaidProviderViewer('tutor') ? '있음' : '없음'}) · 요청문 없음 → 「${providerEmpty}」`, tutorView['한 줄 요청'] === providerEmpty && tutorView['특이요청'] === providerEmpty, `${tutorView['한 줄 요청']} / ${tutorView['특이요청']}`);
  const adminView = slots(R.renderBrowseList('student', [EMPTY], { guest: false, viewerRole: 'admin' }));
  check('관리자 · 요청문 없음 → 「—」', adminView['한 줄 요청'] === '—' && adminView['특이요청'] === '—', `${adminView['한 줄 요청']} / ${adminView['특이요청']}`);
  const parentView = slots(R.renderBrowseList('student', [{ ...EMPTY, request_summary: '보이면안됨', special_request_note: '보이면안됨' }], { guest: false, viewerRole: 'parent' }));
  check(`학부모 → 「${LOCK.nonProvider}」 (원문 있어도)`, parentView['한 줄 요청'] === LOCK.nonProvider && parentView['특이요청'] === LOCK.nonProvider, `${parentView['한 줄 요청']} / ${parentView['특이요청']}`);
  const self = slots(R.renderStudentBasicSelfCard({ ...EMPTY, request_summary: '내요청', special_request_note: '내특이' }));
  check('학생 본인 카드 → 자기 요청문 그대로', self['한 줄 요청'] === '내요청' && self['특이요청'] === '내특이', `${self['한 줄 요청']} / ${self['특이요청']}`);

  const dNone = details(renderStudentRequestBody({ ...EMPTY }, 'tutor'));
  check('확대카드 · 수업형태 없음 → 희망 수업인원 「—」(「단독」 지어내지 않음)', dNone['희망 수업인원'] === '—', dNone['희망 수업인원']);
  check('확대카드 · 일정 칸 있음 · 빈 값 「—」', dNone['일정'] === '—', dNone['일정']);
  const dOne = details(renderStudentRequestBody({ ...EMPTY, lesson_format: 'one_on_one' }, 'tutor'));
  check('확대카드 · 1:1 → 희망 수업인원 「단독」', dOne['희망 수업인원'] === '단독', dOne['희망 수업인원']);

  const noSubject = mapper.mapToExposureItem('student', { ...SERVER_STUDENT, subject_name: null }, 0);
  check('찾기 변환 · 과목 없음 → 비워 둠(summary 첫 조각 대체 없음)', noSubject.subject_label === '', noSubject.subject_label);
  const noSubjectHome = live.mapSearchStudentItem({ ...SERVER_STUDENT, subject_name: null });
  check('홈 변환 · 과목 없음 → 비워 둠', noSubjectHome.subject_label === '', noSubjectHome.subject_label);
}

console.log(`\n${pass} passed, ${hardFail} failed`);
process.exit(hardFail ? 1 : 0);
