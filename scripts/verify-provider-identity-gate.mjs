/**
 * 공급자 가입단계 본인인증 + 쪽지설정 연락처 검증 제거 게이트
 * 라우팅·API를 문자열 존재만이 아니라 resolveAfterAuthUrl 실행으로 잠근다.
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

function read(rel) {
  return readFileSync(resolve(root, rel), 'utf8');
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
  };
}

globalThis.sessionStorage = mockSessionStorage();

const redirect = await import('../preview/shared/auth-redirect.js');

const baseMe = {
  authenticated: true,
  email_verified: true,
  needs_account_contact: false,
  oauth_role_pending: false,
  needs_basic_register: true,
  needs_provider_identity: false,
  provider_identity_required: false,
};

assert(redirect.isProviderRoleType('tutor') === true, 'map tutor is provider');
assert(redirect.isProviderRoleType('study_room_owner') === true, 'map study_room_owner is provider');
assert(redirect.isProviderRoleType('guardian_student') === false, 'map student is not provider');
assert(redirect.isProviderRoleType('admin') === false, 'map admin is not provider');

for (const [roleType, label] of [
  ['tutor', '과외쌤'],
  ['study_room_owner', '공부방'],
]) {
  const identityUrl = redirect.resolveAfterAuthUrl({
    ...baseMe,
    role_type: roleType,
    needs_provider_identity: true,
    needs_basic_register: true,
  });
  assert(
    String(identityUrl).includes('/signup/identity'),
    `${label}: warn/needs_identity 가 basic보다 앞선다`,
  );
  assert(
    !String(identityUrl).includes('/signup/basic'),
    `${label}: identity 중 basic URL을 주지 않는다`,
  );

  const requiredUrl = redirect.resolveAfterAuthUrl({
    ...baseMe,
    role_type: roleType,
    needs_basic_register: false,
    provider_identity_required: true,
  });
  assert(
    String(requiredUrl).includes('/signup/identity'),
    `${label}: required는 기본등록 완료 후에도 identity`,
  );

  const verifiedUrl = redirect.resolveAfterAuthUrl({
    ...baseMe,
    role_type: roleType,
    needs_provider_identity: false,
    provider_identity_required: false,
    needs_basic_register: true,
  });
  assert(
    String(verifiedUrl).includes('/signup/basic'),
    `${label}: 인증 후 같은 번호로는 basic만`,
  );
}

const studentPoison = redirect.resolveAfterAuthUrl({
  ...baseMe,
  role_type: 'guardian_student',
  needs_provider_identity: true,
  provider_identity_required: true,
  needs_basic_register: true,
});
assert(
  String(studentPoison).includes('/signup/basic') && !String(studentPoison).includes('/signup/identity'),
  '학생: me 오염값이 있어도 identity로 보내지 않는다',
);

const emailFirst = redirect.resolveAfterAuthUrl({
  ...baseMe,
  role_type: 'tutor',
  email_verified: false,
  needs_provider_identity: true,
  provider_identity_required: true,
});
assert(String(emailFirst).includes('verify-email'), '이메일 미확인은 identity보다 앞선다');

const contactFirst = redirect.resolveAfterAuthUrl({
  ...baseMe,
  role_type: 'tutor',
  needs_account_contact: true,
  needs_provider_identity: true,
});
assert(String(contactFirst).includes('account-contact'), '계정연락처는 identity보다 앞선다');

assert(redirect.isOnProviderIdentity !== undefined, 'isOnProviderIdentity export');
assert(String(redirect.providerIdentityUrl()).includes('/signup/identity'), 'providerIdentityUrl path');

// --- 서버 판정 · 운영 모드 ---
const gate = read('src/Auth/ProviderIdentityGate.php');
assert(gate.includes("MODE_OFF = 'off'"), 'gate: off');
assert(gate.includes("MODE_WARN = 'warn'"), 'gate: warn');
assert(gate.includes("MODE_REQUIRED = 'required'"), 'gate: required');
assert(gate.includes("PROVIDER_ROLES = ['study_room_owner', 'tutor']"), 'gate: provider roles only');
assert(!gate.includes('guardian_student'), 'gate: student role not in provider list');
assert(gate.includes('phone_verified_at'), 'gate: server phone_verified_at');
assert(gate.includes('phone_verified_phone'), 'gate: server phone_verified_phone');
assert(gate.includes('provider_identity_allowlist'), 'gate: allowlist from config');
assert(gate.includes('isMockEnvironment'), 'gate: mock env isolated');
assert(gate.includes('assertMutationsAllowed'), 'gate: mutation assert');
assert(!/localStorage\.(get|set)Item/.test(gate), 'gate: no localStorage API');
assert(gate.includes("STUDY114_APP_ENV"), 'gate: mock via APP_ENV');

const authCfg = read('config/auth.php');
assert(authCfg.includes("'provider_identity_mode'"), 'config: mode env');
assert(authCfg.includes("study114_env('STUDY114_PROVIDER_IDENTITY_MODE', 'warn')"), 'config: default warn not required');
assert(authCfg.includes("'provider_identity_mock'"), 'config: mock flag');
assert(authCfg.includes("'provider_identity_allowlist'"), 'config: allowlist env');

const htaccess = read('public/.htaccess');
assert(htaccess.includes('SetEnv STUDY114_PROVIDER_IDENTITY_MODE warn'), 'htaccess: prod mode warn');
assert(!/SetEnv STUDY114_PROVIDER_IDENTITY_MODE required/.test(htaccess), 'htaccess: not hard required');
assert(!htaccess.includes('STUDY114_PROVIDER_IDENTITY_ALLOWLIST'), 'htaccess: no committed allowlist emails');

const phoneSvc = read('src/Auth/PhoneVerificationService.php');
assert(phoneSvc.includes('function isVerified'), 'phone: isVerified');
assert(phoneSvc.includes('phone_verified_phone'), 'phone: compare verified phone');
assert(phoneSvc.includes('function changePhone'), 'phone: account change');
assert(phoneSvc.includes('function invalidateOnPhoneChange'), 'phone: invalidate on change');
assert(phoneSvc.includes("'sms_otp'"), 'phone: current method sms_otp stub');

const mePhp = read('public/api/auth/me.php');
assert(mePhp.includes('needs_provider_identity'), 'me: needs_provider_identity');
assert(mePhp.includes('provider_identity_required'), 'me: provider_identity_required');
assert(mePhp.includes('provider_identity_can_skip'), 'me: can_skip');
assert(mePhp.includes('provider_identity_mode'), 'me: mode');
assert(mePhp.includes('phone_verified'), 'me: phone_verified');
assert(mePhp.includes('masked_phone'), 'me: masked_phone');
assert(mePhp.includes('ProviderIdentityGate'), 'me: server gate');

const basicApi = read('public/api/auth/basic-register.php');
assert(basicApi.includes('assertMutationsAllowed'), 'basic-register: identity assert');
assert(basicApi.includes('provider_identity_required'), 'basic-register: 403 code');

const roomsApi = read('public/api/registrations/study-rooms.php');
const tutorsApi = read('public/api/registrations/tutors.php');
const studentsApi = read('public/api/registrations/students.php');
assert(roomsApi.includes('assertMutationsAllowed'), 'study-rooms PATCH: identity assert');
assert(tutorsApi.includes('assertMutationsAllowed'), 'tutors PATCH: identity assert');
assert(roomsApi.includes('$method !== \'GET\''), 'study-rooms: GET is not blocked');
assert(tutorsApi.includes('$method !== \'GET\''), 'tutors: GET is not blocked');
assert(!studentsApi.includes('ProviderIdentityGate'), 'students API: no identity gate');
assert(!studentsApi.includes('assertMutationsAllowed'), 'students API: no identity assert');

const updatePhp = read('public/api/auth/phone/update.php');
assert(updatePhp.includes('function changePhone') || updatePhp.includes('changePhone('), 'phone/update: changePhone');
assert(updatePhp.includes('isProviderRole'), 'phone/update POST: provider only');
assert(updatePhp.includes('EmailVerificationGate'), 'phone/update: email verified');
assert(updatePhp.includes("'forbidden'"), 'phone/update: student 403');

const sendOtp = read('public/api/auth/phone/send-otp.php');
const verifyOtp = read('public/api/auth/phone/verify-otp.php');
assert(sendOtp.includes('PhoneVerificationService'), 'send-otp: server service');
assert(verifyOtp.includes('verifyOtp'), 'verify-otp: server verify');
assert(!sendOtp.includes('$_GET'), 'send-otp: no query bypass');
assert(!verifyOtp.includes('localStorage'), 'verify-otp: no localStorage');

const hubTutor = read('src/Registration/TutorHubService.php');
const hubRoom = read('src/Registration/StudyRoomHubService.php');
assert(!hubTutor.includes('PhoneVerifyRequiredException'), 'tutor hub: inquiry not OTP gated');
assert(!hubRoom.includes('PhoneVerifyRequiredException'), 'room hub: inquiry not OTP gated');
assert(!hubTutor.includes('ProviderIdentityGate'), 'tutor hub: identity is API entry, not inquiry action');
assert(!hubRoom.includes('ProviderIdentityGate'), 'room hub: identity is API entry, not inquiry action');

const regApi = read('src/Registration/RegistrationApi.php');
assert(regApi.includes("'provider_identity_required'"), 'RegistrationApi maps identity 403');

// --- 가입 UI 라우트 ---
const layout = read('preview/auth-ui/src/layout.js');
const main = read('preview/auth-ui/src/main.js');
const identityUi = read('preview/auth-ui/src/screens/signup-identity.js');
const verifyEmail = read('preview/auth-ui/src/screens/signup-verify-email.js');
const signupBasic = read('preview/auth-ui/src/screens/signup-basic.js');
assert(layout.includes("'/signup/identity': 'signupIdentity'"), 'auth-ui route /signup/identity');
assert(main.includes('renderSignupIdentity'), 'auth-ui main binds identity');
assert(identityUi.includes('sendPhoneOtpApi'), 'identity screen sends OTP');
assert(identityUi.includes('verifyPhoneOtpApi'), 'identity screen verifies OTP');
assert(identityUi.includes('provider_identity_can_skip'), 'identity skip is server flag');
assert(identityUi.includes("roleUi !== 'study_room' && roleUi !== 'tutor'"), 'identity bounces non-providers');
assert(!identityUi.includes('localStorage'), 'identity: no localStorage bypass');
assert(!/\bsearchParams\b|\bURLSearchParams\b/.test(identityUi) || identityUi.includes('provider_identity_can_skip'), 'identity: skip not from query');
assert(!identityUi.includes('hidden button') && !identityUi.includes('data-dev-bypass'), 'identity: no hidden bypass');
assert(verifyEmail.includes("navigate('/signup/identity')"), 'verify-email continues to identity');
assert(signupBasic.includes('provider_identity_required'), 'basic blocks required unverified');
assert(!signupBasic.includes('needs_provider_identity'), 'basic: warn skip equivalent allowed');

const chrome = read('preview/shared/chrome-session.js');
const homeSession = read('preview/home-ui/src/auth-session.js');
assert(chrome.includes('provider_identity_required'), 'chrome redirects required only');
assert(chrome.includes("role_type === 'tutor'"), 'chrome required is provider-only');
assert(homeSession.includes("data.role_type === 'tutor'"), 'home-ui required is provider-only');
assert(!chrome.includes('needs_provider_identity'), 'chrome does not hard-block warn');

const redirectSrc = read('preview/shared/auth-redirect.js');
assert(redirectSrc.includes('isProviderRoleType'), 'redirect: provider role helper');
assert(!/skip_identity|bypass_identity|identity=0/.test(redirectSrc), 'redirect: no query bypass tokens');

// --- 쪽지설정에서 연락처 검증 제거 ---
const tutorRender = read('preview/home-ui/src/tutor-reg/inquiries-render.js');
const tutorEdit = read('preview/home-ui/src/tutor-reg/inquiries-edit.js');
const tutorCopy = read('preview/home-ui/src/tutor-reg/inquiries-copy.js');
const roomScreens = read('preview/home-ui/src/study-room-reg/screens.js');
const roomCopy = read('preview/home-ui/src/study-room-reg/study-room-reg-copy.js');
assert(!tutorRender.includes('p21-inq-block--contact'), 'tutor inquiries: contact block gone');
assert(!tutorEdit.includes('showPhoneVerifyGateModal'), 'tutor inquiries: no OTP CTA');
assert(!tutorEdit.includes('phone_verify_required'), 'tutor inquiries: no OTP error path');
assert(!tutorCopy.includes('contactHeading'), 'tutor copy: no contact heading');
assert(!roomScreens.includes('p21-inq-block--contact'), 'room inquiries: contact block gone');
assert(!roomScreens.includes('showPhoneVerifyGateModal'), 'room inquiries: no OTP CTA');
assert(!roomCopy.includes('contactNeededLead'), 'room copy: no contact lead');
assert(tutorRender.includes('data-p21-inquiry-save'), 'tutor inquiries: save remains');
assert(roomScreens.includes('data-p20-inquiry-save'), 'room inquiries: save remains');

const accountUi = read('preview/home-ui/src/mypage/screens.js');
assert(accountUi.includes('function renderProviderPhoneCard'), 'account: phone change card');
assert(accountUi.includes('/api/auth/phone/update.php'), 'account: phone update API');
assert(accountUi.includes("role !== 'study_room' && role !== 'tutor'"), 'account: phone card providers only');
assert(accountUi.includes('showPhoneVerifyGateModal'), 'account: re-verify on number change');
assert(accountUi.includes('bindPhoneChangeEvents'), 'account: bind phone change');

assert(!identityUi.includes('STUDY114_PROVIDER_IDENTITY_MODE'), 'client does not pick operating mode');
assert(existsSync(resolve(root, 'src/Auth/ProviderIdentityRequiredException.php')), 'exception class exists');
assert(existsSync(resolve(root, 'public/api/auth/phone/update.php')), 'phone update endpoint exists');
assert(existsSync(resolve(root, 'preview/auth-ui/src/screens/signup-identity.js')), 'identity screen exists');

if (failed > 0) {
  console.error(`\nprovider identity gate FAILED (${failed})`);
  process.exit(1);
}
console.log('\nprovider identity gate OK');
