/**
 * 학생 카드·티저 블라인드 포맷 (10-6 · 운영 결정 2번 B-완화형)
 *
 * - 공개 표시명: 로그인 여부와 무관하게 항상 일부 마스킹
 * - 비로그인 티저: 조건은 보이되 사람·세부는 특정되지 않게
 */

/**
 * 공개 표시명 마스킹 — 김○○ / 이○ / 박○학생 / 맑○○
 * @param {string | null | undefined} raw
 */
export function maskPublicDisplayName(raw) {
  const s = String(raw || '').trim();
  if (!s) return '○○학생';
  const hasStudentSuffix = /학생$/.test(s);
  const base = hasStudentSuffix ? s.replace(/학생$/, '') : s;
  const chars = [...base];
  if (!chars.length) return hasStudentSuffix ? '○학생' : '○○';
  const first = chars[0];
  const rest = chars.length - 1;
  const mask = rest <= 1 ? '○' : '○○';
  return `${first}${mask}${hasStudentSuffix ? '학생' : ''}`;
}

/**
 * 정확 학년 → 학교급만 (중2 → 중등)
 * @param {string | null | undefined} gradeLevel
 */
export function schoolBandFromGrade(gradeLevel) {
  const g = String(gradeLevel || '').trim();
  if (!g) return '—';
  if (/^초|preschool|elementary/i.test(g)) return '초등';
  if (/^중|middle/i.test(g)) return '중등';
  if (/^고|high/i.test(g)) return '고등';
  if (/유|초등/.test(g)) return '초등';
  return '—';
}

/**
 * 대표 희망 과목 1개
 * @param {string | null | undefined} subjectLabel
 */
export function primarySubjectOne(subjectLabel) {
  const s = String(subjectLabel || '').trim();
  if (!s || s === '—') return '—';
  const first = s.split(/[·,、/|]/)[0].trim();
  if (!first) return '—';
  if (first === '종합') return '종합';
  return first;
}

/**
 * 비로그인: 단지명 제외 · 동/권역만
 * @param {string | null | undefined} locationLabel
 */
export function coarseRegionForGuest(locationLabel) {
  const s = String(locationLabel || '').trim();
  if (!s) return '—';
  const noComplex = s.split('·')[0].trim();
  const dong = noComplex.match(/([가-힣]{1,8}동)/);
  if (dong) return dong[1];
  const gwon = noComplex.match(/([가-힣]{1,8}권)/);
  if (gwon) return gwon[1];
  let cleaned = noComplex
    .replace(/^서울(특별)?시\s*/, '')
    .replace(/([가-힣]+)구\s*/, '')
    .trim();
  cleaned = cleaned.split(/\s+/).filter(Boolean).pop() || cleaned;
  if (!cleaned) return '—';
  if (/동$|권$/.test(cleaned)) return cleaned;
  if (cleaned.length <= 4) return `${cleaned}권`;
  return cleaned;
}

/**
 * 예산 구간형 (만원) — 예: 40~60만원
 * @param {number | null | undefined} amountWon
 */
export function budgetBandLabel(amountWon) {
  const n = Number(amountWon);
  if (!Number.isFinite(n) || n <= 0) return '—';
  const man = Math.round(n / 10000);
  const low = Math.floor(man / 20) * 20;
  const high = low + 20;
  if (low <= 0) return `~${high}만원`;
  return `${low}~${high}만원`;
}

/**
 * 희망 유형
 * @param {string | null | undefined} preferredLessonType
 */
export function hopeTypeLabel(preferredLessonType) {
  if (preferredLessonType === 'study_room') return '공부방 희망';
  if (preferredLessonType === 'tutor') return '과외 희망';
  return '';
}

/**
 * 수업형태·인원·횟수 중 카드에 올릴 한 조각
 * @param {object} item
 */
export function oneLessonHopeChip(item) {
  if (item.lesson_format === 'one_on_one') return '1:1 희망';
  if (item.lesson_format === 'group') return '그룹 희망';
  if (item.lessons_per_week) return `주 ${item.lessons_per_week}회 희망`;
  return '';
}

/**
 * 비로그인 티저 한 줄
 * 예: 김○○ · 중등 · 수학 · 대치동 · 40~60만원
 * @param {object} item
 */
export function formatGuestStudentTeaserLine(item) {
  const t = guestStudentTeaserFields(item);
  const core = [t.name, t.band, t.subject, t.region, t.budget].filter((p) => p && p !== '—');
  const tail = t.hope || t.chip;
  if (tail) core.push(tail);
  return core.join(' · ');
}

/**
 * @param {object} item
 * @returns {{ name: string, band: string, subject: string, region: string, budget: string, hope: string, chip: string }}
 */
export function guestStudentTeaserFields(item) {
  const amount =
    item.preferred_lesson_type === 'study_room'
      ? item.preferred_studyroom_fee_amount
      : item.preferred_fee_amount;
  return {
    name: maskPublicDisplayName(item.public_display_name),
    band: schoolBandFromGrade(item.grade_level),
    subject: primarySubjectOne(item.subject_label),
    region: coarseRegionForGuest(item.location_label),
    budget: budgetBandLabel(amount),
    hope: hopeTypeLabel(item.preferred_lesson_type),
    chip: oneLessonHopeChip(item),
  };
}
