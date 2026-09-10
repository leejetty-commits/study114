/**
 * 과외쌤 마이페이지 2차 — 탭/메뉴 라우팅 무결성
 * (정적 계약 + parseTutorRegPath 동적 매트릭스)
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  parseTutorRegPath,
  tutorHubPath,
  tutorSectionPath,
  TUTOR_REG_TOP_TABS,
  BASE,
} from '../preview/home-ui/src/tutor-reg/router.js';
import { MYPAGE_NAV } from '../preview/home-ui/src/mypage/router.js';

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
const shell = read('preview/home-ui/src/mypage/shell.js');
const state = read('preview/home-ui/src/state.js');
const mypageScreens = read('preview/home-ui/src/mypage/screens.js');
const mypageRouter = read('preview/home-ui/src/mypage/router.js');

// —— A. 탭 클릭이 저장 게이트로 막히지 않음 (공부방과 동일: 즉시 hash 이동)
const navHandler = screens.match(
  /root\.querySelectorAll\('\[data-p21-nav\]'\)\.forEach\(\(el\) => \{[\s\S]*?\}\);/,
);
assert(!!navHandler, 'bind: data-p21-nav handler present');
assert(navHandler && !navHandler[0].includes('persistTutorBasicForm'), 'bind: tab nav must not gate on persistTutorBasicForm');
assert(navHandler && !navHandler[0].includes('alert('), 'bind: tab nav must not alert/block leave');
assert(navHandler && navHandler[0].includes('window.location.hash = next'), 'bind: tab nav sets hash immediately');

// —— B. 목록/레거시 redirect는 replace (history 오염 최소화)
assert(screens.includes('window.location.replace(`#${dest}`)'), 'screens: hub/list redirects use replace');
assert(
  /getNavRole\(\) === 'tutor'[\s\S]*?window\.location\.replace\(`#\$\{getTutorEntryPath\(\)\}`\)/.test(state),
  'bootstrap: tutor home/registrations → entry via replace',
);
assert(mypageScreens.includes('window.location.replace(`#${entry}`)'), 'mypage screens: tutor entry uses replace');

// —— C. 좌측 메뉴 라벨·경로 계약
const tutorNavLabels = ['내 등록', '쪽지·후기함', '최근열람', '찜한학생', '구매이력', '계정설정'];
for (const label of tutorNavLabels) {
  assert(MYPAGE_NAV.some((n) => n.label === label), `nav label: ${label}`);
}
assert(shell.includes('getTutorEntryPath()'), 'shell: 내 등록 href → getTutorEntryPath');
assert(mypageRouter.includes('export function getTutorEntryPath'), 'router: getTutorEntryPath exported');

const expectedMenuPaths = {
  '내 등록': '/mypage/registrations',
  '쪽지·후기함': '/mypage/messages',
  최근열람: '/mypage/recent',
  찜한학생: '/mypage/student-review',
  구매이력: '/mypage/plans',
  계정설정: '/mypage/account',
};
for (const [label, path] of Object.entries(expectedMenuPaths)) {
  const item = MYPAGE_NAV.find((n) => n.label === label);
  assert(item?.path === path, `nav path: ${label} → ${path}`);
}

// —— D. 상단 탭 키·라벨·경로 1:1
const expectedTabs = [
  { key: 'hub', label: '마이프로필', screenId: 'P21-02', pathOf: (id) => tutorHubPath(id) },
  { key: 'basic', label: '기본정보', screenId: 'P21-03a', pathOf: (id) => tutorSectionPath(id, 'basic') },
  { key: 'detail', label: '상세정보', screenId: 'P21-03b', pathOf: (id) => tutorSectionPath(id, 'detail') },
  { key: 'inquiries', label: '쪽지설정', screenId: 'P21-05', pathOf: (id) => tutorSectionPath(id, 'inquiries') },
  { key: 'publish', label: '등록점검', screenId: 'P21-04', pathOf: (id) => tutorSectionPath(id, 'publish') },
];
assert(TUTOR_REG_TOP_TABS.length === expectedTabs.length, 'top tabs count = 5');
for (let i = 0; i < expectedTabs.length; i += 1) {
  const exp = expectedTabs[i];
  const got = TUTOR_REG_TOP_TABS[i];
  assert(got?.key === exp.key && got?.label === exp.label, `tab[${i}]: ${exp.label} (${exp.key})`);
}

const tid = 42;
for (const exp of expectedTabs) {
  const path = exp.pathOf(tid);
  const route = parseTutorRegPath(path);
  assert(!!route, `parse: ${path}`);
  assert(route?.screenId === exp.screenId, `screenId: ${path} → ${exp.screenId}`);
  assert(route?.tutorId === tid, `tutorId preserved: ${path}`);
  if (exp.key === 'hub') {
    assert(route?.section === 'hub', `section hub: ${path}`);
  } else {
    assert(route?.section === exp.key, `section: ${path} → ${exp.key}`);
  }
}

// access 레거시 → 동일 화면, tutorSectionPath는 inquiries로 정규화
assert(parseTutorRegPath(`${BASE}/42/access`)?.screenId === 'P21-05', 'legacy /access → P21-05');
assert(tutorSectionPath(42, 'access') === `${BASE}/42/inquiries`, 'tutorSectionPath(access) → /inquiries');
assert(screens.includes("route.section === 'access'"), 'screens: access URL canonicalize');

// 목록 → P21-01
assert(parseTutorRegPath(BASE)?.screenId === 'P21-01', 'list BASE → P21-01');
assert(parseTutorRegPath(`${BASE}/tab/draft`)?.screenId === 'P21-01', 'list tab → P21-01');

// 없는 page key
assert(parseTutorRegPath(`${BASE}/42/unknown`) == null, 'unknown section → null (no false match)');

if (failed > 0) {
  console.error(`\ntutor mypage route integrity FAILED (${failed})`);
  process.exit(1);
}
console.log('\ntutor mypage route integrity OK');
