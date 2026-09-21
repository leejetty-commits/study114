/**
 * CUR-007 · 공급자 가입단계 본인인증 게이트
 * 라우팅 함수를 실제로 호출하고, 학생 분기·우회·쪽지설정 비변경을 확인한다.
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
};

function href(me) {
  return String(redirect.resolveAfterAuthUrl(me));
}

assert(redirect.needsProviderIdentityGate({
  ...base,
  role_type: 'study_room_owner',
  phone_verified: false,
}) === true, '공부방 미검증 → 게이트');
assert(redirect.needsProviderIdentityGate({
  ...base,
  role_type: 'tutor',
  phone_verified: false,
}) === true, '과외쌤 미검증 → 게이트');
assert(redirect.needsProviderIdentityGate({
  ...base,
  role_type: 'tutor',
  phone_verified: true,
}) === false, '과외쌤 같은 번호 검증 완료 → 반복 안 함');
assert(redirect.needsProviderIdentityGate({
  ...base,
  role_type: 'guardian_student',
  phone_verified: false,
}) === false, '학생은 게이트 아님');
assert(redirect.needsProviderIdentityGate({
  ...base,
  role_type: 'study_room_owner',
  phone_verified: false,
  needs_basic_register: false,
}) === false, '기본등록 끝난 공급자는 가입 게이트 반복 안 함');
assert(redirect.needsProviderIdentityGate({
  ...base,
  role_type: 'tutor',
  email_verified: false,
  phone_verified: false,
}) === false, '이메일 확인 전에는 본인인증 게이트 아님');

assert(
  href({ ...base, role_type: 'study_room_owner', phone_verified: false }).includes('/signup/provider-identity'),
  '공부방 계속 → 본인인증',
);
assert(
  href({ ...base, role_type: 'tutor', phone_verified: false }).includes('/signup/provider-identity'),
  '과외쌤 계속 → 본인인증',
);
assert(
  href({ ...base, role_type: 'tutor', phone_verified: true }).includes('/signup/basic') &&
    href({ ...base, role_type: 'tutor', phone_verified: true }).includes('role=tutor'),
  '과외쌤 인증 후 → 과외쌤 기본등록',
);
assert(
  href({ ...base, role_type: 'study_room_owner', phone_verified: true }).includes('role=study_room'),
  '공부방 인증 후 → 공부방 기본등록',
);
assert(
  href({ ...base, role_type: 'guardian_student', phone_verified: false }).includes('/signup/basic') &&
    href({ ...base, role_type: 'guardian_student', phone_verified: false }).includes('role=student') &&
    !href({ ...base, role_type: 'guardian_student', phone_verified: false }).includes('provider-identity'),
  '학생은 기본등록으로 유지',
);
assert(
  href({
    ...base,
    role_type: 'tutor',
    email_verified: false,
    phone_verified: false,
  }).includes('verify-email') &&
    !href({
      ...base,
      role_type: 'tutor',
      email_verified: false,
      phone_verified: false,
    }).includes('provider-identity'),
  '이메일 미확인 공급자는 확인 대기로 (홈·본인인증 아님)',
);
assert(
  !href({
    ...base,
    role_type: 'tutor',
    needs_basic_register: false,
    phone_verified: true,
  }).includes('/signup/basic'),
  '기본등록 완료 공급자는 기본등록으로 다시 보내지 않음',
);

const identity = read('preview/auth-ui/src/screens/signup-provider-identity.js');
assert(identity.includes('본인인증'), '단계 제목');
assert(
  identity.includes(
    '공급자 가입은 휴대폰 번호 기준으로 처음 1회 본인인증을 진행합니다. 인증이 끝나면 이후 공개, 쪽지, 유료상품 이용에서 다시 반복하지 않습니다.',
  ),
  '기본 설명',
);
assert(identity.includes('번호가 바뀌면 계정설정에서 다시 확인합니다.'), '보조 설명');
assert(identity.includes('인증하기') && identity.includes('다시 시도'), 'CTA');
assert(identity.includes('본인인증이 완료되었습니다. 다음 단계로 이동합니다.'), '완료 문구');
assert(identity.includes('인증을 완료하지 않아 다음 단계로 이동할 수 없습니다.'), '실패 문구');
assert(identity.includes('다시 시도한 뒤 계속 진행해 주세요.'), '재시도 문구');
assert(!identity.includes('localStorage'), 'identity localStorage 우회 없음');
assert(!identity.includes('sessionStorage'), 'identity sessionStorage 우회 없음');
assert(!/123456|000000/.test(identity), '더미 인증번호 없음');
assert(!/skip=|bypass|phone_verified\s*=\s*true/.test(identity), '쿼리·플래그 우회 없음');
assert(identity.includes('fetchMeApi'), '성공 이동 전 서버 me 재조회');
assert(identity.includes('/api/auth/phone/verify-otp.php'), '기존 OTP 검증 재사용');
assert(!identity.includes('phone-verify-gate'), '쪽지 게이트 모듈을 가입 화면에 붙이지 않음');

const verifyEmail = read('preview/auth-ui/src/screens/signup-verify-email.js');
assert(verifyEmail.includes('needsProviderIdentityGate'), '확인 후 공급자 게이트');
assert(verifyEmail.includes('basicRegisterPathForMe'), '인증 후·학생은 기본등록 경로 유지');
assert(verifyEmail.includes('consumePostVerifyRole()'), '확인 후 stale role 제거');
assert(!/window\.location\.href\s*=\s*['"]\/['"]/.test(verifyEmail), '계속이 사이트 루트 홈으로 고정되지 않음');

const basic = read('preview/auth-ui/src/screens/signup-basic.js');
assert(basic.includes('needsProviderIdentityGate'), '기본등록 화면이 미인증 공급자를 되돌림');
assert(basic.includes('data-provider-basic-body'), '인증 전 공급자 기본등록 본문 숨김');
assert(basic.includes('phone_verify_required'), 'API 거부 시 기본등록에 머물지 않음');

const api = read('public/api/auth/basic-register.php');
assert(api.includes('phone_verify_required'), 'basic-register 서버 거부');
assert(api.includes("roleUi === 'study_room' || $roleUi === 'tutor'"), '서버 게이트는 공급자 role만');
assert(!api.includes('localStorage'), 'API에 클라 저장값 우회 없음');

const inquiry = read('preview/home-ui/src/study-room-reg/study-room-reg-copy.js');
assert(inquiry.includes('기본 연락처 검증이 필요합니다'), '쪽지설정 기본 연락처 검증 문구 유지');
const inquiryGate = read('preview/home-ui/src/study-room-reg/phone-verify-gate.js');
assert(inquiryGate.includes('/api/auth/phone/send-otp.php'), '쪽지 OTP 게이트 유지');

const login = read('preview/auth-ui/src/screens/login.js');
assert(login.includes('ensurePostVerifyTargetForUnverifiedLogin'), '미확인 재로그인 목표 보존');
assert(!/setPostVerifyTarget\(\s*['"]home['"]\s*\)/.test(login), '로그인이 home으로 목표를 덮지 않음');

const role = read('preview/auth-ui/src/screens/signup-role.js');
assert(/setPostVerifyTarget\(\s*['"]basic['"]\s*,\s*selected\s*\)/.test(role), '가입 시 역할 보존');
assert(role.includes('needsProviderIdentityGate'), 'OAuth 공급자도 본인인증 경유');

if (failed > 0) {
  console.error(`\nCUR-007 provider identity gate FAILED (${failed})`);
  process.exit(1);
}
console.log('\nCUR-007 provider identity gate OK');
