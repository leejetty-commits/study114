/** 한국 휴대폰 숫자만 (비교·검증용). */
export function phoneDigits(phone) {
  return String(phone ?? '').replace(/\D+/g, '');
}

/** 한국 휴대폰 10~11자리(01로 시작). */
export function isValidMobile(phone) {
  return /^01[016789]\d{7,8}$/.test(phoneDigits(phone));
}

export function formatMobile(phone) {
  const d = phoneDigits(phone);
  if (d.length === 11) return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  return String(phone ?? '').trim();
}
