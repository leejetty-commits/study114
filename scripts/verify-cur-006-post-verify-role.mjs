/**
 * CUR-006 · post-verify 역할·목표 실행 테스트 (문자열 존재 검사만으로 PASS 금지)
 * sessionStorage 모사 후 auth-redirect 함수를 실제로 호출한다.
 */
import { readFileSync, existsSync } from 'node:fs';
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

function mockSessionStorage() {
  /** @type {Record<string, string>} */
  const store = {};
  return {
    getItem(k) {
      return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null;
    },
    setItem(k, v) {
      store[k] = String(v);
    },
    removeItem(k) {
      delete store[k];
    },
    clear() {
      for (const k of Object.keys(store)) delete store[k];
    },
    _raw: store,
  };
}

const storage = mockSessionStorage();
globalThis.sessionStorage = storage;

const redirect = await import('../preview/shared/auth-redirect.js');

// --- mapping ---
assert(redirect.uiRoleFromRoleType('tutor') === 'tutor', 'map tutor');
assert(redirect.uiRoleFromRoleType('study_room_owner') === 'study_room', 'map study_room_owner');
assert(redirect.uiRoleFromRoleType('guardian_student') === 'student', 'map guardian_student');
assert(redirect.uiRoleFromRoleType('evil') === '', 'map invalid empty');

// --- A tutor: signup basic+tutor, re-login preserve, continue path ---
storage.clear();
redirect.setPostVerifyTarget('basic', 'tutor');
assert(redirect.peekPostVerifyTarget() === 'basic', 'A set basic');
assert(redirect.peekPostVerifyRole() === 'tutor', 'A set tutor role');
redirect.ensurePostVerifyTargetForUnverifiedLogin();
assert(redirect.peekPostVerifyTarget() === 'basic', 'A re-login preserves basic');
assert(redirect.peekPostVerifyRole() === 'tutor', 'A re-login preserves tutor');
assert(
  redirect.basicRegisterPathForMe({ role_type: 'tutor' }) === '/signup/basic?role=tutor',
  'A continue → tutor basic path',
);
assert(
  redirect.resolveUiRoleForBasicRegister('study_room', { role_type: 'tutor' }) === 'tutor',
  'A URL study_room hint ignored → tutor',
);
const tA = redirect.consumePostVerifyTarget();
const rA = redirect.consumePostVerifyRole();
assert(tA === 'basic' && rA === 'tutor', 'A consume basic+tutor');
assert(redirect.peekPostVerifyTarget() === '' && redirect.peekPostVerifyRole() === '', 'A stale cleared');

// --- B study_room ---
storage.clear();
redirect.setPostVerifyTarget('basic', 'study_room');
redirect.ensurePostVerifyTargetForUnverifiedLogin();
assert(redirect.peekPostVerifyTarget() === 'basic', 'B preserve basic');
assert(
  redirect.basicRegisterPathForMe({ role_type: 'study_room_owner' }) ===
    '/signup/basic?role=study_room',
  'B continue → study_room basic',
);
assert(
  redirect.resolveUiRoleForBasicRegister('tutor', { role_type: 'study_room_owner' }) === 'study_room',
  'B URL tutor hint ignored',
);

// --- C student ---
storage.clear();
redirect.setPostVerifyTarget('basic', 'student');
assert(
  redirect.basicRegisterPathForMe({ role_type: 'guardian_student' }) ===
    '/signup/basic?role=student',
  'C continue → student basic',
);

// --- D home preserved (not overwritten to basic) ---
storage.clear();
redirect.setPostVerifyTarget('home');
assert(redirect.peekPostVerifyRole() === '', 'D home clears role key');
redirect.ensurePostVerifyTargetForUnverifiedLogin();
assert(redirect.peekPostVerifyTarget() === 'home', 'D home not overwritten by basic');
assert(redirect.consumePostVerifyTarget() === 'home', 'D consume home');

// --- E empty → basic; role from me (no default student invent on path) ---
storage.clear();
redirect.ensurePostVerifyTargetForUnverifiedLogin();
assert(redirect.peekPostVerifyTarget() === 'basic', 'E empty → basic');
assert(redirect.peekPostVerifyRole() === '', 'E empty has no stale role');
assert(
  redirect.basicRegisterPathForMe({ role_type: 'tutor' }) === '/signup/basic?role=tutor',
  'E me.role_type tutor path (not student default)',
);

// --- F role manipulation / invalid ---
assert(
  redirect.resolveUiRoleForBasicRegister('student', { role_type: 'tutor' }) === 'tutor',
  'F tutor+?role=student → tutor',
);
assert(
  redirect.resolveUiRoleForBasicRegister('../evil', { role_type: 'tutor' }) === 'tutor',
  'F invalid string → tutor',
);
assert(
  redirect.resolveUiRoleForBasicRegister('https://evil.example/', {
    role_type: 'study_room_owner',
  }) === 'study_room',
  'F external URL string → study_room',
);
redirect.setPostVerifyTarget('basic', 'not-a-role');
assert(redirect.peekPostVerifyRole() === '', 'F invalid role not stored');
redirect.setPostVerifyTarget('home', 'tutor');
assert(redirect.peekPostVerifyRole() === '', 'F home target strips role');

// --- G resolveAfterAuthUrl: needs_basic_register wins over empty/home postVerify ---
const baseMe = {
  authenticated: true,
  email_verified: true,
  needs_account_contact: false,
  oauth_role_pending: false,
};
for (const [roleType, pathPart] of [
  ['tutor', 'role=tutor'],
  ['study_room_owner', 'role=study_room'],
  ['guardian_student', 'role=student'],
]) {
  const url = redirect.resolveAfterAuthUrl({
    ...baseMe,
    role_type: roleType,
    needs_basic_register: true,
  });
  assert(
    String(url).includes('/signup/basic') && String(url).includes(pathPart),
    `G needs_basic → ${roleType} basic URL`,
  );
  const doneUrl = redirect.resolveAfterAuthUrl({
    ...baseMe,
    role_type: roleType,
    needs_basic_register: false,
  });
  assert(
    !String(doneUrl).includes('/signup/basic'),
    `G completed ${roleType} skips basic`,
  );
}

assert(
  String(
    redirect.resolveAfterAuthUrl({
      ...baseMe,
      role_type: 'tutor',
      email_verified: false,
      needs_basic_register: true,
    }),
  ).includes('verify-email'),
  'G unverified still waits for email (not basic)',
);

// --- static: second box is hope type (B), not member role ---
const basicSrc = readFileSync(resolve(root, 'preview/auth-ui/src/screens/signup-basic.js'), 'utf8');
assert(basicSrc.includes('preferred_lesson_type'), 'student hope field preferred_lesson_type');
assert(basicSrc.includes('어떤 수업을 찾고 있나요?'), 'hope label not member-role copy');
assert(basicSrc.includes('회원 유형이 아닙니다'), 'hope disambiguation hint');
assert(!basicSrc.includes('data-nav="/signup/role"'), 'basic form no back to role reselect');
assert(basicSrc.includes('resolveUiRoleForBasicRegister'), 'basic binds server role align');
assert(basicSrc.includes('needs_basic_register'), 'basic blocks completed re-entry');
assert(basicSrc.includes('roleReady'), 'basic waits for server role before submit');

const enums = readFileSync(resolve(root, 'preview/auth-ui/src/register-enums.js'), 'utf8');
assert(enums.includes('과외쌤 찾기') && enums.includes('공부방 찾기'), 'hope labels are find-intent');

const api = readFileSync(resolve(root, 'public/api/auth/basic-register.php'), 'utf8');
assert(api.includes('role_mismatch'), 'API role_mismatch');
assert(api.includes('study_room_owner'), 'API maps study_room_owner');
assert(api.includes('guardian_student'), 'API maps guardian_student');

const verifyEmail = readFileSync(
  resolve(root, 'preview/auth-ui/src/screens/signup-verify-email.js'),
  'utf8',
);
assert(verifyEmail.includes('basicRegisterPathForMe'), 'verify continue uses server path');
assert(verifyEmail.includes('consumePostVerifyRole()'), 'verify clears stale role before navigate');
assert(verifyEmail.includes('needs_basic_register'), 'verify continue uses server completion flag');

const mePhp = readFileSync(resolve(root, 'public/api/auth/me.php'), 'utf8');
assert(mePhp.includes('needs_basic_register'), 'me exposes needs_basic_register');
assert(mePhp.includes('needsBasicRegister'), 'me calls BasicRegisterService::needsBasicRegister');

const basicSvc = readFileSync(resolve(root, 'src/Auth/BasicRegisterService.php'), 'utf8');
assert(basicSvc.includes('function needsBasicRegister'), 'BasicRegisterService::needsBasicRegister');
assert(basicSvc.includes('FROM tutors WHERE user_id'), 'completion: tutors');
assert(basicSvc.includes('FROM study_rooms WHERE user_id'), 'completion: study_rooms');
assert(basicSvc.includes('FROM students WHERE guardian_user_id'), 'completion: students');

const signupSvc = readFileSync(resolve(root, 'src/Auth/SignupService.php'), 'utf8');
assert(signupSvc.includes("'student'    => 'guardian_student'"), 'signup map student');
assert(signupSvc.includes("'study_room' => 'study_room_owner'"), 'signup map study_room');
assert(signupSvc.includes("'tutor'      => 'tutor'"), 'signup map tutor');

const oauthRole = readFileSync(resolve(root, 'src/Auth/OAuthRoleService.php'), 'utf8');
assert(oauthRole.includes('needsBasicRegister'), 'oauth needs_basic uses table check');
assert(
  !oauthRole.includes("in_array($roleUi, ['study_room', 'tutor'], true)"),
  'oauth no longer skips student basic',
);

const redirectSrc = readFileSync(resolve(root, 'preview/shared/auth-redirect.js'), 'utf8');
assert(
  redirectSrc.includes('me.needs_basic_register') && redirectSrc.includes('basicRegisterPathForMe'),
  'resolveAfterAuthUrl routes by needs_basic_register',
);

assert(existsSync(resolve(root, 'preview/shared/auth-redirect.js')), 'auth-redirect exists');

if (failed > 0) {
  console.error(`\nCUR-006 post-verify role FAILED (${failed})`);
  process.exit(1);
}
console.log('\nCUR-006 post-verify role OK');
