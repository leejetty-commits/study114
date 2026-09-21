/**
 * CUR-007 재시작 · 본인확인은 SMS OTP가 아니다.
 * 라우팅 함수를 실제로 호출하고, 신규 파일이 OTP 축을 끌어쓰지 않는지 본다.
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

const provider = {
  authenticated: true,
  email_verified: true,
  needs_account_contact: false,
  oauth_role_pending: false,
  needs_basic_register: true,
  role_type: 'tutor',
  phone_verified: true,
  phone_identity: { mode: 'warn', prompt: true, verified: false },
};

assert(redirect.needsProviderIdentityPrompt(provider), 'warn prompt routes tutor');
assert(
  String(redirect.resolveAfterAuthUrl(provider)).includes('/signup/provider-identity'),
  'tutor warn goes to identity before basic',
);

const studyRoom = { ...provider, role_type: 'study_room_owner' };
assert(redirect.needsProviderIdentityPrompt(studyRoom), 'warn prompt routes study room');

const student = { ...provider, role_type: 'guardian_student' };
assert(!redirect.needsProviderIdentityPrompt(student), 'student is not prompted');
assert(
  String(redirect.resolveAfterAuthUrl(student)).includes('/signup/basic') &&
    String(redirect.resolveAfterAuthUrl(student)).includes('role=student'),
  'student still goes to basic',
);

const otpOnly = { ...provider, phone_identity: { mode: 'off', prompt: false, verified: false } };
assert(!redirect.needsProviderIdentityPrompt(otpOnly), 'phone_verified OTP does not open identity');
assert(
  String(redirect.resolveAfterAuthUrl(otpOnly)).includes('/signup/basic'),
  'mode off tutor still goes to basic',
);

const unverified = { ...provider, email_verified: false };
assert(!redirect.needsProviderIdentityPrompt(unverified), 'email unverified is not prompted');
assert(
  String(redirect.resolveAfterAuthUrl(unverified)).includes('verify-email'),
  'email unverified stays on email step',
);

const done = { ...provider, needs_basic_register: false, phone_identity: { prompt: true } };
assert(!redirect.needsProviderIdentityPrompt(done), 'completed basic is not prompted');

const screen = readFileSync(
  resolve(root, 'preview/auth-ui/src/screens/signup-provider-identity.js'),
  'utf8',
);
assert(screen.includes('본인인증'), 'title copy');
assert(screen.includes('인증하기'), 'start CTA');
assert(screen.includes('다시 시도'), 'retry CTA');
assert(screen.includes('본인인증이 완료되었습니다. 다음 단계로 이동합니다.'), 'success copy');
assert(!screen.includes('인증번호'), 'no code entry copy');
assert(!screen.includes('send-otp'), 'screen does not call send-otp');
assert(!screen.includes('sms.log'), 'screen does not read sms.log');
assert(!/maxlength=["']6["']/.test(screen), 'no 6-digit field');
assert(!screen.includes('localStorage'), 'no localStorage bypass');

const start = readFileSync(resolve(root, 'public/api/auth/phone-identity/start.php'), 'utf8');
const callback = readFileSync(resolve(root, 'public/api/auth/phone-identity/callback.php'), 'utf8');
const service = readFileSync(resolve(root, 'src/Auth/PhoneIdentityService.php'), 'utf8');
for (const [name, src] of [
  ['start', start],
  ['callback', callback],
  ['service', service],
]) {
  assert(!src.includes('PhoneOtpSmsSender'), `${name} does not use OTP sender`);
  assert(!src.includes('send-otp.php'), `${name} does not call send-otp`);
  assert(!src.includes('verify-otp.php'), `${name} does not call verify-otp`);
  assert(!src.includes('sms.log'), `${name} does not read sms.log`);
}
assert(start.includes('vendor_not_configured'), 'start reports missing vendor');
assert(callback.includes('HTTP_X_STUDY114_IDENTITY_SIGNATURE'), 'callback requires signature header');
assert(service.includes("'sms_otp'") === false, 'identity method list has no sms_otp string');
assert(service.includes('METHOD_NICEID'), 'identity methods are vendor ids');
assert(service.includes('return \'warn\''), 'required is downgraded');

const schema = readFileSync(resolve(root, 'sql/schema/069_provider_phone_identity.sql'), 'utf8');
assert(schema.includes('phone_identity_tx_id'), 'tx id column');
assert(!schema.includes('phone_identity_ci'), 'CI is not stored yet');
assert(schema.includes('sms_otp 금지'), 'method comment rejects sms_otp');

const basic = readFileSync(resolve(root, 'public/api/auth/basic-register.php'), 'utf8');
assert(!basic.includes('phone_verify_required'), 'basic register is not an identity hard gate');
assert(!basic.includes('phone_identity'), 'basic register does not block on identity');

const me = readFileSync(resolve(root, 'public/api/auth/me.php'), 'utf8');
assert(me.includes('phone_identity'), 'me exposes identity state separate from OTP');
assert(me.includes('phone_verified'), 'me still exposes OTP flag for the other axis');

if (failed > 0) {
  console.error(`\nCUR-007 phone identity prep FAILED (${failed})`);
  process.exit(1);
}
console.log('\nCUR-007 phone identity prep OK');
