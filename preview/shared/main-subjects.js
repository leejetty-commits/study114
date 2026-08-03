/** 주력과목 선택 목록 — 가입·기본등록·상세등록 공통 */

export const MAIN_SUBJECT_OPTIONS = [
  { value: '국어', label: '국어' },
  { value: '영어', label: '영어' },
  { value: '수학', label: '수학' },
  { value: '과학', label: '과학' },
  { value: '사회', label: '사회' },
  { value: '국영수', label: '국영수' },
  { value: '국영수사과', label: '국영수사과' },
  { value: '과학탐구', label: '과학탐구' },
  { value: '사회탐구', label: '사회탐구' },
  { value: '물리', label: '물리' },
  { value: '화학', label: '화학' },
  { value: '생명과학', label: '생명과학' },
  { value: '지구과학', label: '지구과학' },
  { value: '한국사', label: '한국사' },
  { value: '한문', label: '한문' },
  { value: '일본어', label: '일본어' },
  { value: '중국어', label: '중국어' },
  { value: '독일어', label: '독일어' },
  { value: '프랑스어', label: '프랑스어' },
  { value: '스페인어', label: '스페인어' },
  { value: '코딩', label: '코딩' },
  { value: '논술', label: '논술' },
  { value: '예체능', label: '예체능' },
  { value: '기타', label: '기타' },
];

/**
 * @param {string} selected
 * @param {{ includeEmpty?: boolean, emptyLabel?: string }} [opts]
 */
export function renderMainSubjectSelect(selected, opts = {}) {
  const { includeEmpty = true, emptyLabel = '과목 선택' } = opts;
  const value = String(selected || '').trim();
  const known = MAIN_SUBJECT_OPTIONS.some((o) => o.value === value);
  const options = [
    includeEmpty ? `<option value="">${emptyLabel}</option>` : '',
    ...MAIN_SUBJECT_OPTIONS.map(
      (o) =>
        `<option value="${o.value}" ${value === o.value ? 'selected' : ''}>${o.label}</option>`,
    ),
    !known && value
      ? `<option value="${escapeAttr(value)}" selected>${escapeHtml(value)}</option>`
      : '',
  ]
    .filter(Boolean)
    .join('');
  return options;
}

function escapeAttr(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
