/**
 * 동네 인사 (티켓 173). 공부방·과외쌤 한 줄. 이미지·전화·카톡·URL 없음.
 * 랭킹 가산 없음.
 */

export const GREETING_MAX = 80;
export const GREETING_TEASER = 20;

/** @param {unknown} text */
export function normalizeGreetingBody(text) {
  return String(text ?? '')
    .replace(/[\r\n]+/g, ' ')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

/** @param {string} text @returns {'phone'|'kakao'|'url'|''} */
export function greetingBlockedReason(text) {
  const raw = String(text ?? '');
  if (/카카오|카톡|오픈채팅|kakao/i.test(raw)) return 'kakao';
  if (/https?:\/\/|www\./i.test(raw)) return 'url';
  if (/\b[\w-]+\.(com|kr|net|me|io|co)\b/i.test(raw)) return 'url';
  const compact = raw.replace(/[\s().\-]/g, '');
  if (/01[016789]\d{7,8}/.test(compact)) return 'phone';
  if (/0(?:2|[3-6]\d)\d{7,8}/.test(compact)) return 'phone';
  return '';
}

/** @param {unknown} text @returns {string} 비어 있으면 통과 */
export function greetingError(text) {
  const body = normalizeGreetingBody(text);
  if (!body) return '한 줄을 입력해 주세요.';
  if (Array.from(body).length > GREETING_MAX) return '80자 이내로 적어 주세요.';
  if (greetingBlockedReason(body)) return '전화, 카톡, 주소는 넣을 수 없어요.';
  return '';
}

/** @param {unknown} name */
export function maskGreetingName(name) {
  const chars = Array.from(String(name ?? '').trim());
  if (!chars.length) return '○○';
  if (chars.length === 1) return `${chars[0]}○`;
  return chars[0] + '○'.repeat(Math.min(chars.length - 1, 2));
}

/** @param {unknown} text */
export function greetingTeaser(text) {
  const chars = Array.from(normalizeGreetingBody(text));
  if (chars.length <= GREETING_TEASER) return chars.join('');
  return `${chars.slice(0, GREETING_TEASER).join('')}…`;
}

/** @param {unknown} a @param {unknown} b */
export function sameNeighborhood(a, b) {
  const na = normDong(a);
  const nb = normDong(b);
  if (!na || !nb) return false;
  return na === nb || na.includes(nb) || nb.includes(na);
}

/** @param {unknown} value */
function normDong(value) {
  return String(value ?? '')
    .replace(/\s+/g, '')
    .replace(/동$/u, '');
}

/**
 * @param {object} input
 * @param {'study_room'|'tutor'} input.providerType
 * @param {number} input.registrationId
 * @param {string} input.body
 * @param {string} input.neighborhood
 * @param {string} input.displayName
 */
export function buildGreetingRecord(input) {
  const providerType = input.providerType === 'tutor' ? 'tutor' : 'study_room';
  const registrationId = Number(input.registrationId);
  const body = normalizeGreetingBody(input.body);
  const error = greetingError(body);
  if (error) return { ok: false, error };
  if (!Number.isInteger(registrationId) || registrationId < 1) {
    return { ok: false, error: '기본등록이 연결된 뒤에 올릴 수 있어요.' };
  }
  const neighborhood = String(input.neighborhood ?? '').trim();
  if (!neighborhood) return { ok: false, error: '등록된 동네가 있어야 올릴 수 있어요.' };
  const displayName = String(input.displayName ?? '').trim() || (providerType === 'tutor' ? '과외쌤' : '공부방');
  const historyId = input.historyId || input.history_id ? String(input.historyId || input.history_id).trim() : undefined;
  return {
    ok: true,
    record: {
      id: `${providerType}:${registrationId}`,
      providerType,
      registrationId,
      body,
      neighborhood,
      displayName,
      status: 'up',
      updatedAt: Date.now(),
      ...(historyId ? { historyId } : {}),
    },
  };
}
