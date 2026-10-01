/**
 * 무결성-8 · 역할 홈 직접 접근 가드 표 (실제 함수 호출)
 * npx --yes vite-node scripts/verify-role-home-guard.mjs
 *
 * - 각 역할은 자기 홈만. 비로그인·역할 대기(oauth_role_pending)는 #/guest.
 * - 관리자는 역할 홈 대신 #/admin.
 * - 보낸 곳이 다시 가드에 걸리지 않는다(루프 없음).
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { guardRoleHomeAccess } from '../preview/shared/route-access.js';
import { navRoleFromAuthUser, roleHomeHashPath } from '../preview/shared/site-nav-config.js';

const root = process.cwd();
let failed = 0;
let passed = 0;

function assert(cond, msg) {
  if (cond) {
    passed += 1;
    console.log('PASS:', msg);
  } else {
    failed += 1;
    console.error('FAIL:', msg);
  }
}

/** home-ui state.js ROUTES 와 같은 해시 → 화면 키 */
const HASH_SCREEN = {
  '#/guest': 'guest',
  '#/parent': 'parent',
  '#/study-room': 'studyRoom',
  '#/tutor': 'tutor',
};
const HOMES = ['parent', 'studyRoom', 'tutor'];
const HOME_HASH = { parent: '#/parent', studyRoom: '#/study-room', tutor: '#/tutor' };

const ACTORS = [
  { label: '비로그인', user: null, loggedIn: false, expect: { parent: '#/guest', studyRoom: '#/guest', tutor: '#/guest' } },
  { label: '학부모', user: { role_type: 'guardian_student' }, loggedIn: true, expect: { parent: 'ok', studyRoom: '#/parent', tutor: '#/parent' } },
  { label: '공부방', user: { role_type: 'study_room_owner' }, loggedIn: true, expect: { parent: '#/study-room', studyRoom: 'ok', tutor: '#/study-room' } },
  { label: '과외쌤', user: { role_type: 'tutor' }, loggedIn: true, expect: { parent: '#/tutor', studyRoom: '#/tutor', tutor: 'ok' } },
  { label: '관리자', user: { role_type: 'admin', admin_level: 'master' }, loggedIn: true, expect: { parent: '#/admin', studyRoom: '#/admin', tutor: '#/admin' } },
  {
    label: '대기 가입자',
    user: { role_type: 'guardian_student', oauth_role_pending: true },
    loggedIn: true,
    expect: { parent: '#/guest', studyRoom: '#/guest', tutor: '#/guest' },
  },
];

/** @param {{ ok: boolean, redirectHash?: string }} r */
function outcome(r) {
  return r.ok ? 'ok' : String(r.redirectHash);
}

const table = [];
for (const a of ACTORS) {
  const navRole = navRoleFromAuthUser(a.user);
  const row = [a.label, navRole];
  for (const home of HOMES) {
    const r = guardRoleHomeAccess(home, a.loggedIn, navRole);
    const got = outcome(r);
    row.push(got === 'ok' ? '허용' : `거부→${got}`);
    assert(got === a.expect[home], `${a.label} × ${HOME_HASH[home]} = ${a.expect[home]} (got ${got})`);

    if (!r.ok && a.loggedIn) {
      assert(
        r.redirectHash === `#${roleHomeHashPath(a.user)}`,
        `${a.label} × ${HOME_HASH[home]} 거부 대상이 roleHomeHashPath(#${roleHomeHashPath(a.user)})와 같다`,
      );
    }
    if (!r.ok) {
      const nextKey = HASH_SCREEN[r.redirectHash];
      if (nextKey) {
        const again = guardRoleHomeAccess(nextKey, a.loggedIn, navRole);
        assert(again.ok, `${a.label}: ${r.redirectHash} 로 보낸 뒤 다시 가드 통과(루프 없음)`);
      } else {
        assert(r.redirectHash === '#/admin', `${a.label}: 역할 홈 밖 대상은 #/admin 뿐 (got ${r.redirectHash})`);
      }
    }
  }
  const guestHome = guardRoleHomeAccess('guest', a.loggedIn, navRole);
  assert(guestHome.ok, `${a.label} × #/guest 항상 허용`);
  table.push(row);
}

assert(
  guardRoleHomeAccess('tutor', true).ok === false,
  'navRole 생략 시 guest 로 보아 로그인만으로는 역할 홈을 열지 않는다',
);

// main.js 호출부 — 6b 관리자 한 줄이 가드로 흡수됐는지, 세션 전 판정이 없는지
const mainSrc = readFileSync(resolve(root, 'preview/home-ui/src/main.js'), 'utf8');
assert(
  /guardRoleHomeAccess\(key, isLoggedIn\(\), navRoleFromAuthUser\(getAuthUser\(\)\)\)/.test(mainSrc),
  'main.js 가 navRoleFromAuthUser(getAuthUser()) 로 가드를 부른다',
);
assert(
  !/key === 'parent' && getAuthUser\(\)\?\.role_type === 'admin'/.test(mainSrc),
  'main.js 의 관리자 → #/admin 별도 분기가 없다(가드로 통합)',
);
assert(
  /if \(!sessionChecked && SCREENS\[key\] && key !== 'guest'\) return;/.test(mainSrc),
  'main.js 는 세션 확인 전 역할 홈을 그리거나 판정하지 않는다',
);
assert(
  /return screen !== 'parent' && screen !== 'studyRoom' && screen !== 'tutor';/.test(mainSrc),
  'main.js shouldPaintBeforeSession 은 역할 홈을 세션 전에 그리지 않는다',
);

console.log('\n역할 \\ 홈            navRole      #/parent        #/study-room    #/tutor');
for (const row of table) {
  console.log(row.map((c, i) => String(c).padEnd(i === 0 ? 12 : 15)).join(' '));
}
console.log(`\n통과 ${passed} / 실패 ${failed}`);
if (failed) process.exit(1);
