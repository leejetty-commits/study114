/** @typedef {'student' | 'study_room' | 'tutor'} MemberRole */

/** @type {{ role: MemberRole | null, termsAgreed: boolean, accountAddress: string, basicRegister: Record<string, object>, lastSignup: { userId: number, email: string, roleType: string } | null }} */
export const signupState = {
  role: null,
  termsAgreed: false,
  accountAddress: '',
  profileGender: null,
  basicRegister: {},
  lastSignup: null,
  /** @type {Array<{id: number, label: string}>} */
  regions: [],
  basicRegisterResult: null,
};

/** 문서 잠금: 회원 구분 3축 */
export const ROLE_LABELS = {
  student: '학생(학부모)',
  study_room: '공부방',
  tutor: '과외쌤',
};

export const ROLE_DESCRIPTIONS = {
  student: '자녀의 학습 정보를 관리하고, 동네 공부방·과외를 찾아보세요.',
  study_room: '우리 동네 공부방을 등록하고 학부모에게 알려보세요.',
  tutor: '과외 선생님으로 프로필을 등록하고 학생을 만나보세요.',
};

export const ROLE_ICONS = {
  student: '🎓',
  study_room: '📚',
  tutor: '✏️',
};

/** 로컬 개발 프리필용 (운영 빌드에서는 이메일·주소 미프리필 — 중복 가입 422 방지) */
export const DUMMY_USER = {
  email: 'parent@example.com',
  name: '김우동',
  gender: 'female',
  phone: '010-1234-5678',
  address: '',
  smsConsent: false,
  emailConsent: false,
};

/** 문서 잠금: 약관동의 항목 — [임시] SSOT 2장 §3.2, 법무 확정 전 변경 가능 */
export const TERMS_TEMP = true;

export const TERMS = [
  { id: 'service', label: '서비스 이용약관', required: true },
  { id: 'privacy', label: '개인정보 수집·이용', required: true },
  { id: 'location', label: '위치기반 서비스 이용약관', required: true },
  { id: 'marketing', label: '마케팅 정보 수신', required: false },
];

export function resetSignupState() {
  signupState.role = null;
  signupState.termsAgreed = false;
  signupState.accountAddress = '';
  signupState.basicRegister = {};
  signupState.basicRegisterResult = null;
  signupState.lastSignup = null;
  signupState.regions = [];
}

export function setRole(role) {
  signupState.role = role;
}

/** 아이디 찾기 — 이름·휴대폰 → 마스킹 이메일 목록 + 소셜 안내 */
export const FIND_ID_TEMP = false;

/** 비밀번호 찾기 — 이메일 매직 링크 (TTL 30분 · 재전송 5분) */
export const FIND_PASSWORD_TEMP = false;

export function markTermsAgreed() {
  signupState.termsAgreed = true;
}
