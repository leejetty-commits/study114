/**
 * 과외쌤 검색 응답 = 카드 칸 (2026-10-09 · 정본 73 0-3 5번 · 7-6)
 * 실행(저장소 루트): node scripts/verify-tutor-search-fields.mjs   |  npm run verify:tutor-search-fields
 *
 * (1) PHP: searchTutors 응답에 카드 칸(사진·성별·대상·주회·분·수업장소·원생수·특징·슬로건·소개·주교재·강의스타일)이 있고
 *     값이 없으면 빈값, 비공개 칸(실명·연락처·주소·이메일 등) 없음, 숨김·탈퇴·지역1 없음 미노출
 *     → scripts/verify-tutor-search-fields.php (가짜 PDO)
 * (2) 정적: searchTutors 의 WHERE·COUNT·FROM~LIMIT(정렬) 글자 = 기준 커밋, searchRooms 본문 = 기준 커밋,
 *     search.php(손님 지역 제한·학생 요청문 게이트) = 기준 커밋, 확대카드 손님 「로그인 후 확인」 유지,
 *     홈·찾기·노출 브리지 매퍼가 summary 줄로 소개·과목을 대신 채우지 않음
 * (3) 화면 매퍼(vite-node, preview/home-ui): (1)의 실제 응답을 홈 mapTutor·찾기 mapToExposureItem 에 넣으면
 *     카드 칸이 그대로 넘어오고, 베이직·픽·프라임 카드와 확대카드에 값이 그려진다
 * DB·운영 서버·운영 계정에 접속하지 않는다.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
/** 이 작업 직전 origin/main(찜 확대카드·확대카드 전 항목 반영). WHERE·정렬 무변경 비교 기준. */
const BASE_REF = '3f03aaa';

const CARD_KEYS = [
  'image_path', 'image_path_basic', 'image_path_prime', 'gender', 'grade_band', 'main_subject_note',
  'lessons_per_week', 'minutes_per_lesson', 'lesson_places', 'student_gender_group', 'student_count_group',
  'feature_1', 'feature_2', 'feature_3', 'slogan', 'intro_short', 'main_material_note', 'teaching_style_badges',
];

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

if (process.env.TSF_MAPPER_INPUT) {
  await runMapperPart(JSON.parse(readFileSync(process.env.TSF_MAPPER_INPUT, 'utf8')));
  console.log(`\nmapper ${passed} PASS / ${failed} FAIL`);
  process.exit(failed ? 1 : 0);
}

function phpBin() {
  if (process.env.PHP_BIN) return process.env.PHP_BIN;
  if (existsSync('D:\\php8.2\\php.exe')) return 'D:\\php8.2\\php.exe';
  return 'php';
}

function summary(out, tag) {
  const m = String(out || '').match(new RegExp(`${tag} (\\d+) PASS / (\\d+) FAIL`));
  return m ? { pass: Number(m[1]), fail: Number(m[2]) } : { pass: 0, fail: 1 };
}

const read = (rel) => readFileSync(join(ROOT, rel), 'utf8').replace(/\r\n/g, '\n');
function readBase(rel) {
  const r = spawnSync('git', ['show', `${BASE_REF}:${rel}`], { cwd: ROOT, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  if (r.status !== 0) throw new Error(`git show ${BASE_REF}:${rel} — ${r.stderr}`);
  return r.stdout.replace(/\r\n/g, '\n');
}
function fnBody(src, name, kind = 'private') {
  const at = src.indexOf(`${kind} function ${name}(`);
  if (at < 0) return '';
  const ends = ['\n    private function ', '\n    public function ', '\n}\n']
    .map((m) => src.indexOf(m, at + 10))
    .filter((n) => n > 0);
  return src.slice(at, ends.length ? Math.min(...ends) : undefined);
}
function between(src, from, to) {
  const a = src.indexOf(from);
  if (a < 0) return null;
  const b = src.indexOf(to, a + from.length);
  if (b < 0) return null;
  return src.slice(a, b + to.length);
}
/** 함수 본문에서 `function name(` 부터 같은 들여쓰기의 닫는 `}` 까지(JS). */
function jsFn(src, name) {
  const at = src.search(new RegExp(`(export )?function ${name}\\(`));
  if (at < 0) return '';
  const end = src.indexOf('\n}\n', at);
  return src.slice(at, end < 0 ? undefined : end + 3);
}

/* ── (1) PHP ── */
console.log('── (1) PHP 검색 응답 ──');
const outFile = join(tmpdir(), `tsf-items-${process.pid}.json`);
const php = spawnSync(phpBin(), [join(ROOT, 'scripts', 'verify-tutor-search-fields.php')], {
  cwd: ROOT,
  encoding: 'utf8',
  env: { ...process.env, TSF_OUT: outFile },
});
process.stdout.write(php.stdout || '');
process.stderr.write(php.stderr || '');
const phpSum = summary(php.stdout, 'php');
if (php.status !== 0 && phpSum.fail === 0) phpSum.fail = 1;

/* ── (2) 정적 ── */
console.log('\n── (2) 정적: 노출 조건·정렬·손님 경로 무변경 · 매퍼 대체값 없음 ──');
{
  const cur = read('src/Search/SearchService.php');
  const base = readBase('src/Search/SearchService.php');
  const curT = fnBody(cur, 'searchTutors');
  const baseT = fnBody(base, 'searchTutors');
  const whereFrom = '$where = [';
  const whereTo = '$total = (int) $stmt->fetchColumn();';
  const cw = between(curT, whereFrom, whereTo);
  const bw = between(baseT, whereFrom, whereTo);
  ok('searchTutors WHERE·필터·COUNT·정렬식(orderBy) = 기준 커밋 글자 그대로', cw !== null && bw !== null && cw === bw,
    `${cw?.length ?? 'null'}/${bw?.length ?? 'null'}`);
  const fromTo = ['FROM tutors t\n            LEFT JOIN', 'LIMIT :limit OFFSET :offset'];
  const cf = between(curT, ...fromTo);
  const bf = between(baseT, ...fromTo);
  ok('searchTutors 조회 FROM·JOIN·WHERE·ORDER BY·LIMIT = 기준 커밋 글자 그대로', cf !== null && bf !== null && cf === bf,
    `${cf?.length ?? 'null'}/${bf?.length ?? 'null'}`);
  ok('searchTutors 바인딩·실행부(params·limit·offset) = 기준 커밋', (() => {
    const seg = ['$stmt = $pdo->prepare($sql);', '$stmt->execute();\n'];
    const a = between(curT, ...seg);
    const b = between(baseT, ...seg);
    return a !== null && a === b;
  })());
  ok('searchRooms 본문 = 기준 커밋(공부방 응답 무변경)', fnBody(cur, 'searchRooms') !== '' && fnBody(cur, 'searchRooms') === fnBody(base, 'searchRooms'));
  ok('guestScopedFilters 본문 = 기준 커밋', fnBody(cur, 'guestScopedFilters', 'public') !== ''
    && fnBody(cur, 'guestScopedFilters', 'public') === fnBody(base, 'guestScopedFilters', 'public'));
  ok('search.php(손님 지역 제한 · 학생 요청문 게이트) = 기준 커밋', read('public/api/search/search.php') === readBase('public/api/search/search.php'));
  const detail = read('preview/home-ui/src/detail-decision/tutor-detail.js');
  ok('확대카드 손님 「로그인 후 확인」 4칸(일정·강의스타일·학적상태·학교·학과) 유지 · 파일 = 기준 커밋',
    (detail.match(/isGuest \? '로그인 후 확인'/g) || []).length === 4
      && detail === readBase('preview/home-ui/src/detail-decision/tutor-detail.js'));

  const live = read('preview/home-ui/src/home-basic-live.js');
  const mapTutorSrc = jsFn(live, 'mapTutor');
  const cardFieldsSrc = jsFn(live, 'tutorSearchCardFields');
  ok('홈 mapTutor: summary 줄을 쓰지 않음 · tutorSearchCardFields 로 카드 칸을 넘김',
    mapTutorSrc !== '' && !mapTutorSrc.includes('summary') && mapTutorSrc.includes('...tutorSearchCardFields(item)'));
  ok('tutorSearchCardFields: 카드 칸 전부 · summary 대체 없음',
    cardFieldsSrc !== '' && !cardFieldsSrc.includes('summary') && CARD_KEYS.every((k) => cardFieldsSrc.includes(`${k}:`)),
    CARD_KEYS.filter((k) => !cardFieldsSrc.includes(`${k}:`)).join(','));
  const bridge = read('preview/home-ui/src/exposure-bridge.js');
  const bridgeTutor = jsFn(bridge, 'mapTutorItem');
  ok('노출 브리지 mapTutorItem: tutorSearchCardFields 사용 · summary 대체 없음',
    bridgeTutor.includes('tutorSearchCardFields(item)') && !bridgeTutor.includes('summary'));
  const finder = read('preview/search-ui/src/search-exposure-mapper.js');
  const tutorBranch = between(finder, "if (tab === 'tutor') {", 'return merged;');
  ok('찾기 mapToExposureItem 과외쌤: summary 줄을 쓰지 않음 · 응답 칸 펼침(...apiItem)',
    tutorBranch !== null && !tutorBranch.includes('summaryLines') && tutorBranch.includes('...apiItem'));
}

/* ── (3) 화면 매퍼 ── */
console.log('\n── (3) 화면 매퍼 (vite-node · preview/home-ui) ──');
let mapSum = { pass: 0, fail: 1 };
if (existsSync(outFile)) {
  const screen = spawnSync('npx', ['--yes', 'vite-node', join(ROOT, 'scripts', 'verify-tutor-search-fields.mjs')], {
    cwd: join(ROOT, 'preview', 'home-ui'),
    encoding: 'utf8',
    shell: true,
    env: { ...process.env, TSF_MAPPER_INPUT: outFile },
    maxBuffer: 32 * 1024 * 1024,
  });
  process.stdout.write(screen.stdout || '');
  process.stderr.write(screen.stderr || '');
  mapSum = summary(screen.stdout, 'mapper');
  if (screen.status !== 0 && mapSum.fail === 0) mapSum.fail = 1;
  rmSync(outFile, { force: true });
} else {
  console.error('FAIL  PHP 응답 파일이 없어 화면 매퍼 검사를 못 함');
}

const pass = phpSum.pass + passed + mapSum.pass;
const fail = phpSum.fail + failed + mapSum.fail;
console.log(`\n합계 ${pass} PASS / ${fail} FAIL (php ${phpSum.pass}/${phpSum.fail} · static ${passed}/${failed} · mapper ${mapSum.pass}/${mapSum.fail})`);
process.exit(fail > 0 ? 1 : 0);

async function runMapperPart(items) {
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
    hash: '', href: 'http://localhost/', origin: 'http://localhost', pathname: '/', search: '',
  };
  if (typeof globalThis.document === 'undefined') {
    globalThis.document = { body: {}, querySelector: () => null, querySelectorAll: () => [] };
  }

  const { mapSearchTutorItem } = await import('../preview/home-ui/src/home-basic-live.js');
  const { mapToExposureItem } = await import('../preview/search-ui/src/search-exposure-mapper.js');
  const { renderBrowseList, renderExposureBox } = await import('../preview/home-ui/src/exposure-render.js');
  const { renderTutorDetailBody } = await import('../preview/home-ui/src/detail-decision/tutor-detail.js');
  const { formatTutorLessonPlaces, formatTeachingStyleBadges } = await import('../preview/home-ui/src/exposure-format.js');

  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const t7 = items.find((it) => Number(it.id) === 7);
  const t10 = items.find((it) => Number(it.id) === 10);
  ok('PHP 응답에서 과외쌤 7·10 받음', Boolean(t7 && t10));
  if (!t7 || !t10) return;

  // 노출 브리지 mapTutorItem 은 내보내지 않으므로(로그인 세션 모듈과 묶임) 함수 글자만 떼어 같은 입력으로 돌린다.
  const { tutorSearchCardFields } = await import('../preview/home-ui/src/home-basic-live.js');
  const { tutorBadges } = await import('../preview/home-ui/src/exposure-format.js');
  const bridgeSrc = jsFn(
    readFileSync(join(ROOT, 'preview/home-ui/src/exposure-bridge.js'), 'utf8').replace(/\r\n/g, '\n'),
    'mapTutorItem',
  );
  // eslint-disable-next-line no-new-func
  const mapTutorItem = new Function('tutorSearchCardFields', 'tutorBadges', `${bridgeSrc}\nreturn mapTutorItem;`)(
    tutorSearchCardFields,
    tutorBadges,
  );

  for (const [label, map] of [
    ['홈 mapTutor', (it) => mapSearchTutorItem(it)],
    ['찾기 mapToExposureItem', (it) => mapToExposureItem('tutor', it, 0)],
    ['노출 브리지 mapTutorItem', (it) => mapTutorItem(it)],
  ]) {
    const m7 = map(t7);
    const lost = CARD_KEYS.filter((k) => !same(m7[k], t7[k]));
    ok(`${label}: 응답 카드 칸이 값 그대로 넘어감 (${CARD_KEYS.length}칸)`, lost.length === 0,
      lost.map((k) => `${k}=${JSON.stringify(m7[k])}≠${JSON.stringify(t7[k])}`).join(', '));
    const m10 = map(t10);
    ok(`${label}: 빈 과외쌤은 소개·특징·슬로건·사진 빈값`, m10.intro_short === '' && m10.slogan === ''
      && m10.feature_1 === '' && m10.image_path === '' && same(m10.lesson_places, []) && m10.gender == null);
    const legacy = map({ id: 99, title: '옛 응답', summary: '수학 · 한국대학교 수학과\n경력 y4_6', region_label: '서울특별시' });
    ok(`${label}: summary 줄(「경력 y4_6」 등)로 소개·과목을 대신 채우지 않음`,
      legacy.intro_short === '' && legacy.main_subject_note === '',
      `intro_short=${JSON.stringify(legacy.intro_short)} main_subject_note=${JSON.stringify(legacy.main_subject_note)}`);
  }

  const home7 = mapSearchTutorItem(t7);
  const prime = renderExposureBox('tutor', 'prime', home7, '', {});
  const pick = renderExposureBox('tutor', 'pick', { ...home7, exposure_tier: 'pick' }, '', {});
  const basic = renderBrowseList('tutor', [home7], {});
  const basicTable = renderBrowseList('tutor', [home7], { layout: 'table' });
  const placeLabel = formatTutorLessonPlaces(t7.lesson_places);
  const styleLabel = formatTeachingStyleBadges(t7.teaching_style_badges, 3);
  const expectIn = (html, values) => values.filter((v) => !html.includes(v));
  const primeMiss = expectIn(prime, [t7.image_path, t7.grade_band, placeLabel, t7.main_material_note, t7.feature_1, t7.feature_3, styleLabel, t7.intro_short, t7.slogan, '주 2회', '회당 90분']);
  ok('프라임 카드: 사진·대상·수업장소·주교재·특징3·강의스타일·소개·슬로건·주회·분이 그려짐', primeMiss.length === 0, primeMiss.join(' | '));
  const pickMiss = expectIn(pick, [t7.grade_band, placeLabel, t7.main_material_note, t7.feature_1, t7.slogan]);
  ok('픽 카드: 대상·수업장소·주교재·특징·슬로건이 그려짐', pickMiss.length === 0, pickMiss.join(' | '));
  const basicMiss = expectIn(basic, [t7.image_path, t7.grade_band, placeLabel, '주2·90분', t7.feature_1, t7.slogan]);
  ok('베이직 가로카드: 사진·대상·수업장소·주○·○분·특징·슬로건이 그려짐', basicMiss.length === 0, basicMiss.join(' | '));
  const tableMiss = expectIn(basicTable, [t7.grade_band, placeLabel, '주2·90분', t7.feature_1, t7.slogan]);
  ok('베이직 표: 대상·수업장소·주○·○분·특징·슬로건이 그려짐', tableMiss.length === 0, tableMiss.join(' | '));
  ok('베이직 가로카드: 성별 표시(여)', basic.includes('expo-hcard__gender'));

  const member = renderTutorDetailBody(home7, 'parent');
  const guest = renderTutorDetailBody(home7, 'guest');
  ok('확대카드(회원): 강의스타일·소개·주교재 값이 그려짐', [styleLabel, t7.intro_short, t7.main_material_note].every((v) => member.includes(v)));
  ok('확대카드(손님): 강의스타일·학교는 「로그인 후 확인」, 값은 안 그려짐',
    (guest.match(/로그인 후 확인/g) || []).length === 4 && !guest.includes(styleLabel) && !guest.includes(t7.university_name));
  const empty = renderTutorDetailBody(mapSearchTutorItem(t10), 'parent');
  ok('확대카드(빈 과외쌤): 소개 칸 「—」 · 「경력 y4_6」 같은 요약줄 없음', !empty.includes('경력 y4_6'));
}
