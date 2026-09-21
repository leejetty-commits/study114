/**
 * CUR-007 · 본인확인 상태모델은 SMS OTP와 분리되고, 가입 흐름은 아직 바꾸지 않는다.
 */
import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
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
  };
}

globalThis.sessionStorage = mockSessionStorage();
const redirect = await import('../preview/shared/auth-redirect.js');

const base = {
  authenticated: true,
  email_verified: true,
  needs_account_contact: false,
  oauth_role_pending: false,
  needs_basic_register: true,
  phone_verified: true,
  phone_identity: { mode: 'warn', needs: true, verified: false, can_enter_basic: true },
};

for (const [roleType, pathPart] of [
  ['tutor', 'role=tutor'],
  ['study_room_owner', 'role=study_room'],
  ['guardian_student', 'role=student'],
]) {
  const url = String(redirect.resolveAfterAuthUrl({ ...base, role_type: roleType }));
  assert(url.includes('/signup/basic') && url.includes(pathPart), `${roleType} still continues to basic`);
  assert(!url.includes('provider-identity'), `${roleType} is not sent to an identity screen`);
}

assert(
  String(
    redirect.resolveAfterAuthUrl({
      ...base,
      role_type: 'tutor',
      email_verified: false,
    }),
  ).includes('verify-email'),
  'unverified email stays on email step',
);

const verifyEmail = readFileSync(
  resolve(root, 'preview/auth-ui/src/screens/signup-verify-email.js'),
  'utf8',
);
assert(verifyEmail.includes('basicRegisterPathForMe'), 'continue uses server basic path');
assert(!verifyEmail.includes('provider-identity'), 'continue does not open identity screen');
assert(verifyEmail.includes('consumePostVerifyTarget()'), 'continue still clears stale home target');

assert(
  !existsSync(resolve(root, 'preview/auth-ui/src/screens/signup-provider-identity.js')),
  'no signup identity screen',
);

const service = readFileSync(resolve(root, 'src/Auth/PhoneIdentityService.php'), 'utf8');
assert(service.includes('function isProviderRole'), 'isProviderRole');
assert(service.includes('function isPhoneIdentityVerified'), 'isPhoneIdentityVerified');
assert(service.includes('function needsProviderPhoneIdentity'), 'needsProviderPhoneIdentity');
assert(service.includes('function canEnterProviderBasicRegistrationNow'), 'canEnter');
assert(service.includes('current !== $identityPhone'), 'same-phone compare');
assert(service.includes('업체 연동 및 운영 검증 완료 후 required 차단 활성화'), 'required stays inactive');
assert(!service.includes('PhoneVerificationService'), 'identity service does not call OTP service');
assert(!service.includes('PhoneOtpSmsSender'), 'identity service does not call OTP sender');
assert(!service.includes('send-otp.php'), 'identity service does not call send-otp');

const enterFn = service.slice(
  service.indexOf('function canEnterProviderBasicRegistrationNow'),
  service.indexOf('function configuredMode'),
);
assert(!enterFn.includes('return false'), 'basic registration is not blocked');

const start = readFileSync(resolve(root, 'public/api/auth/phone-identity/start.php'), 'utf8');
const callback = readFileSync(resolve(root, 'public/api/auth/phone-identity/callback.php'), 'utf8');
assert(start.includes('vendor_not_configured'), 'start does not complete without a vendor');
assert(callback.includes('HTTP_X_STUDY114_IDENTITY_SIGNATURE'), 'callback requires a signature');
assert(!callback.includes('localStorage'), 'callback has no browser completion flag');

const schema = readFileSync(resolve(root, 'sql/schema/069_provider_phone_identity.sql'), 'utf8');
assert(schema.includes('phone_identity_tx_id'), 'tx id column');
assert(!schema.includes('phone_identity_ci'), 'CI column stays closed');

const basic = readFileSync(resolve(root, 'public/api/auth/basic-register.php'), 'utf8');
assert(!basic.includes('phone_identity'), 'basic register does not gate on identity');
assert(!basic.includes('phone_verify_required'), 'basic register has no OTP identity gate');

const METHODS = new Set(['niceid', 'kmc', 'pass', 'pg_partner']);
const digits = (value) => String(value || '').replace(/\D+/g, '');
const validMobile = (value) => /^01[016789]\d{7,8}$/.test(digits(value));
function isProviderRole(roleType) {
  return roleType === 'study_room_owner' || roleType === 'tutor';
}
function isPhoneIdentityVerified(profile) {
  if (!profile?.phone_identity_verified_at) return false;
  const identityPhone = digits(profile.phone_identity_phone);
  const current = digits(profile.phone);
  if (!identityPhone || !current || current !== identityPhone || !validMobile(current)) return false;
  if (!METHODS.has(String(profile.phone_identity_method || '').toLowerCase())) return false;
  return String(profile.phone_identity_tx_id || '').trim() !== '';
}
function needsProviderPhoneIdentity(user, profile, mode) {
  if (!isProviderRole(user.role_type)) return false;
  if (mode === 'off') return false;
  return !isPhoneIdentityVerified(profile);
}
function canEnter(user, profile, mode) {
  if (!isProviderRole(user.role_type)) return true;
  if (mode === 'off' || mode === 'warn' || mode === 'required') return true;
  return true;
}
const provider = { role_type: 'tutor' };
const student = { role_type: 'guardian_student' };
const verified = {
  phone: '01012345678',
  phone_identity_verified_at: '2026-09-22 00:00:00',
  phone_identity_phone: '010-1234-5678',
  phone_identity_method: 'niceid',
  phone_identity_tx_id: 'vendor-tx-1001',
  phone_verified_method: 'sms_otp',
};
const otherPhone = { ...verified, phone: '01099998888' };
const smsOnly = {
  phone: '01012345678',
  phone_verified_at: '2026-09-22 00:00:00',
  phone_verified_phone: '01012345678',
  phone_verified_method: 'sms_otp',
};
for (const mode of ['off', 'warn', 'required']) {
  assert(canEnter(provider, null, mode), `provider ${mode} incomplete can enter basic`);
  assert(canEnter(student, null, mode), `student ${mode} can enter basic`);
}
assert(isPhoneIdentityVerified(verified), 'same phone identity is verified');
assert(!isPhoneIdentityVerified(otherPhone), 'different phone is not verified');
assert(!isPhoneIdentityVerified(smsOnly), 'sms_otp alone is not identity');
assert(!needsProviderPhoneIdentity(provider, null, 'off'), 'off does not need guidance');
assert(needsProviderPhoneIdentity(provider, null, 'warn'), 'warn is guidance only');
assert(!needsProviderPhoneIdentity(student, null, 'warn'), 'student is outside guidance');

const php = spawnSync('php', ['scripts/verify-cur-007-phone-identity-policy.php'], {
  cwd: root,
  encoding: 'utf8',
});
if (php.error && php.error.code === 'ENOENT') {
  console.log('SKIP: php runtime is not on PATH');
} else {
  process.stdout.write(php.stdout || '');
  process.stderr.write(php.stderr || '');
  assert(php.status === 0, 'php policy cases');
}

if (failed > 0) {
  console.error(`\nCUR-007 phone identity prep FAILED (${failed})`);
  process.exit(1);
}
console.log('\nCUR-007 phone identity prep OK');
