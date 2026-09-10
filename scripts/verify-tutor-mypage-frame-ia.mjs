/**
 * 과외쌤 마이페이지 1차 프레임 IA — 공부방 셸·탭·진입·1프로필 정책
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
let failed = 0;

function assert(cond, msg) {
  if (!cond) {
    failed += 1;
    console.error('FAIL:', msg);
  } else {
    console.log('PASS:', msg);
  }
}

function read(rel) {
  return readFileSync(resolve(root, rel), 'utf8');
}

const screens = read('preview/home-ui/src/tutor-reg/screens.js');
const tutorRouter = read('preview/home-ui/src/tutor-reg/router.js');
const mypageRouter = read('preview/home-ui/src/mypage/router.js');
const mypageScreens = read('preview/home-ui/src/mypage/screens.js');
const shell = read('preview/home-ui/src/mypage/shell.js');

assert(screens.includes('class="mp-room"'), 'shell: mp-room wrapper');
assert(screens.includes('mp-room__tabs'), 'shell: mp-room__tabs');
assert(screens.includes('mp-room-panel'), 'shell: mp-room-panel section');
assert(!screens.includes('p21-reg-frame'), 'shell: p21-reg-frame removed');
assert(!screens.includes('+ 과외 등록'), 'no multi-profile CTA + 과외 등록');
assert(screens.includes('renderEmptyNoProfile'), 'empty state without multi list');
assert(screens.includes('tutorHubPath(tutors[0].id)'), 'list path redirects to first hub');

assert(tutorRouter.includes("label: '마이프로필'"), 'tab: 마이프로필');
assert(!tutorRouter.includes("label: '마이샵'"), 'tab: 마이샵 not used for tutor');
assert(tutorRouter.includes("label: '쪽지설정'"), 'tab: 쪽지설정');
assert(tutorRouter.includes("label: '등록점검'"), 'tab: 등록점검');
assert(!tutorRouter.includes("label: '등록 현황'"), 'tab: 등록 현황 removed');
assert(!tutorRouter.includes("label: '공개하기'"), 'tab: 공개하기 renamed');

assert(mypageRouter.includes('getTutorEntryPath'), 'entry: getTutorEntryPath');
assert(/if \(role === 'tutor'\) return getTutorEntryPath\(\)/.test(mypageRouter), 'default path uses tutor entry');
assert(mypageRouter.includes("return '내 과외 프로필'"), 'H1 fallback when display name empty');
assert(mypageRouter.includes('tutor_display_name'), 'H1 prefers display name');
assert(mypageRouter.includes("label: '찜한학생'"), 'nav: 찜한학생');
assert(mypageRouter.includes("label: '구매이력'"), 'nav: 구매이력');
assert(!mypageRouter.includes("label: '학생 검토함'"), 'nav: 학생 검토함 removed');
assert(!mypageRouter.includes("label: '구매상품'"), 'nav: 구매상품 removed');

assert(mypageScreens.includes('getTutorEntryPath()'), 'screens: tutor hub redirect');
assert(!mypageScreens.includes("label: '과외 프로필'"), 'index: no 과외 프로필 multi card');
assert(shell.includes('getTutorEntryPath()'), 'shell: 내 등록 → tutor entry');

// deep links still parse
assert(/access\|inquiries\|exposure/.test(tutorRouter), 'legacy access/inquiries/exposure paths still parsed');
assert(tutorRouter.includes("access: 'P21-05'") && tutorRouter.includes("inquiries: 'P21-05'"), 'access+inquiries → same screen');

if (failed > 0) {
  console.error(`\ntutor mypage frame IA FAILED (${failed})`);
  process.exit(1);
}
console.log('\ntutor mypage frame IA OK');
