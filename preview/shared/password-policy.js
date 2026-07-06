/** 9장 부록 §16-4 — 비밀번호 정책 (클라이언트, 서버와 동일 규칙) */

const MIN_LEN = 8;
const MAX_LEN = 14;

const WEAK_EXACT = ['12345678', '1234abcd!', 'qwer1234!', 'asdf1234!', 'password1!'];

const KEYBOARD_FRAGMENTS = ['qwerty', 'asdfgh', 'zxcvbn', 'qwer', 'asdf', '123456', 'abcdef'];

export const PASSWORD_RULE_HINT = '8~14자 · 영문, 숫자, 특수문자 포함 · 쉬운 비밀번호 사용 불가';

export const PASSWORD_RULE_LINES = ['8~14자', '영문, 숫자, 특수문자 포함', '쉬운 비밀번호 사용 불가'];

/**
 * @param {string} password
 * @param {string} confirm
 * @param {{ email?: string, name?: string, phone?: string }} [context]
 * @returns {string|null} error message or null if ok
 */
export function validatePassword(password, confirm, context = {}) {
  if (password !== confirm) {
    return '비밀번호가 서로 일치하지 않습니다.';
  }

  const len = password.length;
  if (len < MIN_LEN || len > MAX_LEN) {
    return '8~14자 이내로 입력해 주세요.';
  }

  if (/\s/.test(password)) {
    return '사용할 수 없는 비밀번호입니다. 더 안전한 비밀번호로 다시 입력해 주세요.';
  }

  if (!/[A-Za-z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
    return '영문, 숫자, 특수문자를 모두 포함해 주세요.';
  }

  const lower = password.toLowerCase();
  if (WEAK_EXACT.some((w) => lower === w.toLowerCase())) {
    return '사용할 수 없는 비밀번호입니다. 더 안전한 비밀번호로 다시 입력해 주세요.';
  }

  if (/(.)\1{3,}/.test(password)) {
    return '사용할 수 없는 비밀번호입니다. 더 안전한 비밀번호로 다시 입력해 주세요.';
  }

  for (const frag of KEYBOARD_FRAGMENTS) {
    if (lower.includes(frag)) {
      return '사용할 수 없는 비밀번호입니다. 더 안전한 비밀번호로 다시 입력해 주세요.';
    }
  }

  if (/0123|1234|2345|3456|4567|5678|6789/.test(password)) {
    return '사용할 수 없는 비밀번호입니다. 더 안전한 비밀번호로 다시 입력해 주세요.';
  }

  const email = String(context.email ?? '')
    .trim()
    .toLowerCase();
  if (email.includes('@')) {
    const local = email.split('@')[0];
    if (local.length >= 3 && lower.includes(local)) {
      return '사용할 수 없는 비밀번호입니다. 더 안전한 비밀번호로 다시 입력해 주세요.';
    }
  }

  const name = String(context.name ?? '').trim();
  if (name.length >= 2 && password.toLowerCase().includes(name.toLowerCase())) {
    return '사용할 수 없는 비밀번호입니다. 더 안전한 비밀번호로 다시 입력해 주세요.';
  }

  const digits = String(context.phone ?? '').replace(/\D/g, '');
  if (digits.length >= 4) {
    const tail = digits.slice(-4);
    if (password.includes(tail)) {
      return '사용할 수 없는 비밀번호입니다. 더 안전한 비밀번호로 다시 입력해 주세요.';
    }
  }

  return null;
}
