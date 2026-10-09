/**
 * T1 · 마이페이지·유료센터 화면에 개발자 용어(내부 영문 키)가 찍히지 않는지 확인.
 * 실행: cd preview/home-ui && npx vite-node ../../scripts/verify-mypage-no-dev-terms.mjs
 *
 * 라벨 함수만 호출한다. DB·서버에 접속하지 않는다.
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

const { formatResumeToken } = await import('../preview/home-ui/src/handoff-resume.js');
const { orderStatusLabel, paymentMethodLabel } = await import('../preview/home-ui/src/plans/history-mock.js');
const { memoPackProviderLabel, memoPackStatusLabel, waitlistStatusLabel, GUARDIAN_PLANS_COPY } = await import(
  '../preview/home-ui/src/mypage/mypage-copy.js'
);
const { STUDENT_REVIEW } = await import('../preview/home-ui/src/handoff-copy.js');

const DEV_WORD = /[a-z_]{3,}/;

// 05 §A-1 키 12개 (12번 = 표에 없는 값) × §A-2 키 5개 (5번 = 표에 없는 값)
const routes = ['search', 'parent', 'study_room', 'tutor', 'guest', 'home', 'resume', 'detail', 'wishlist', 'mypage', 'student-review', 'unknown_route'];
const actions = ['view_detail', 'wish_add', 'compare_add', 'review_add', 'unknown_action'];
const combos = routes.flatMap((r) => actions.map((a) => [r, a, formatResumeToken(r, a)]));
const devHits = combos.filter(([, , t]) => DEV_WORD.test(t));
const parentHits = combos.filter(([, , t]) => t.includes('학부모'));
ok('A 최근열람 60조합', combos.length === 60, String(combos.length));
ok('A 60조합 영문 소문자 3자 이상 0건', devHits.length === 0, devHits.map((c) => c.join('→')).join(', '));
ok('A 60조합 「학부모」 0건', parentHits.length === 0, parentHits.map((c) => c.join('→')).join(', '));
ok('A 빈 값도 원문 없음', !DEV_WORD.test(formatResumeToken('', '')) && !DEV_WORD.test(formatResumeToken(undefined, undefined)));
ok('A study_room → 공부방 홈에서 · 자세히 봤어요', formatResumeToken('study_room', 'view_detail') === '공부방 홈에서 · 자세히 봤어요');
ok('A 모르는 값 → 둘러보다가 · 봤어요', formatResumeToken('zzz', 'yyy') === '둘러보다가 · 봤어요');

const statusTable = [
  ['paid', '결제 완료'],
  ['pending', '결제 대기'],
  ['failed', '결제 실패'],
  ['canceled', '결제 취소'],
  ['cancelled', '결제 취소'],
  ['refunded', '환불 완료'],
  ['weird_status', '확인 중'],
];
const statusOk = statusTable.filter(([k, v]) => orderStatusLabel(k) === v).length;
ok(`B orderStatusLabel ${statusOk}/7`, statusOk === 7);

const methodTable = [
  ['card', '카드'],
  ['transfer', '계좌이체'],
  ['vbank', '무통장 입금'],
  ['dev_mock', '카드(시험 결제)'],
  ['weird_pg', '기타'],
];
const methodOk = methodTable.filter(([k, v]) => paymentMethodLabel(k) === v).length;
ok(`B paymentMethodLabel ${methodOk}/5`, methodOk === 5);

ok('C 쪽지권 프로필 study_room → 공부방', memoPackProviderLabel('study_room') === '공부방');
ok('C 쪽지권 프로필 tutor → 과외쌤', memoPackProviderLabel('tutor') === '과외쌤');
ok('C 쪽지권 프로필 빈 값 → 모든 프로필 공통', memoPackProviderLabel('') === '모든 프로필 공통');
ok('C 쪽지권 프로필 모르는 값 → 확인 중', memoPackProviderLabel('student') === '확인 중');
ok('C 쪽지권 상태 한글은 그대로', memoPackStatusLabel('사용 중') === '사용 중');
ok('C 쪽지권 상태 영문 → 확인 중', memoPackStatusLabel('active') === '확인 중');
ok('C 예약대기 status_label 우선', waitlistStatusLabel({ status_label: '대기 등록', status: 'registered' }) === '대기 등록');
const waitTable = [
  ['registered', '대기 등록'],
  ['notified', '결제 가능'],
  ['paid', '구매 완료'],
  ['cancelled', '취소'],
  ['expired', '만료'],
  ['weird', '확인 중'],
];
const waitOk = waitTable.filter(([k, v]) => waitlistStatusLabel({ status: k }) === v).length;
ok(`C 예약대기 status_label 없을 때 ${waitOk}/6`, waitOk === 6);

ok('G 관심 학생 안내 「학부모」 없음', !STUDENT_REVIEW.note.includes('학부모'));
ok('G 학생 계정 상품 안내 「학부모」 없음', !GUARDIAN_PLANS_COPY.lead.includes('학부모'));

const mypageScreens = read('preview/home-ui/src/mypage/screens.js');
const plansScreens = read('preview/home-ui/src/plans/screens.js');
const resume = read('preview/home-ui/src/handoff-resume.js');
for (const needle of ['<td>${esc(r.status', '<td>${esc(p.status', 'esc(p.provider_type', '#${esc(String(p.provider_id', 'w.status_label || w.status']) {
  ok(`소스 mypage/screens.js 「${needle}」 0건`, !mypageScreens.includes(needle));
  ok(`소스 plans/screens.js 「${needle}」 0건`, !plansScreens.includes(needle));
}
ok('소스 handoff-resume.js 원문 반환 0건', !resume.includes('|| lastRoute') && !resume.includes('|| lastAction'));
ok('소스 exposureKindLabel toUpperCase 0건', !/function exposureKindLabel[\s\S]{0,300}toUpperCase/.test(mypageScreens));
ok('소스 「Prime 예약대기」 0건', !mypageScreens.includes('Prime 예약대기'));
ok('소스 「학생(학부모)」 0건', !mypageScreens.includes('학생(학부모)'));
ok('소스 「학부모 계정은」 0건', !mypageScreens.includes('학부모 계정은'));
ok('소스 「학부모·학생에게」 0건', !plansScreens.includes('학부모·학생에게'));

console.log(`\nverify-mypage-no-dev-terms: ${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
