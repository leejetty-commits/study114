/** 학교급·학년 입력 공통. 가입 PHP(basic-student.php)는 이 파일을 쓰지 않는다. */

export const SCHOOL_LEVEL_FORM_OPTIONS = [
  { value: 'preschool', label: '미취학' },
  { value: 'elementary', label: '초등' },
  { value: 'middle', label: '중등' },
  { value: 'high', label: '고등' },
  { value: 'n_su', label: 'N수' },
];

const YEAR_GRADES = [1, 2, 3, 4, 5, 6].map((n) => ({ value: `${n}학년`, label: `${n}학년` }));
const MID_HIGH_GRADES = YEAR_GRADES.slice(0, 3);
const NSU_GRADES = ['재수', '삼수', '사수', '오수', 'N수'].map((label) => ({ value: label, label }));

/** @type {Record<string, string>} */
export const SCHOOL_LEVEL_FORM_LABELS = Object.fromEntries(
  SCHOOL_LEVEL_FORM_OPTIONS.map((o) => [o.value, o.label]),
);

/**
 * @param {string} level
 * @returns {{ value: string, label: string }[]}
 */
export function gradeOptionsForSchoolLevel(level) {
  if (level === 'elementary') return YEAR_GRADES;
  if (level === 'middle' || level === 'high') return MID_HIGH_GRADES;
  if (level === 'n_su') return NSU_GRADES;
  return [];
}

/** 미취학·미선택은 학년을 고르지 않는다. */
export function isGradeSelectDisabled(level) {
  return !level || level === 'preschool';
}

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
}

/**
 * @param {string} level
 * @param {string} selected
 * @param {string} [emptyLabel]
 * @returns {{ disabled: boolean, html: string }}
 */
export function gradeOptionHtml(level, selected, emptyLabel = '학년 선택') {
  const options = gradeOptionsForSchoolLevel(level);
  const value = options.some((o) => o.value === selected) ? String(selected) : '';
  const html = [
    `<option value="">${esc(emptyLabel)}</option>`,
    ...options.map(
      (o) => `<option value="${esc(o.value)}"${value === o.value ? ' selected' : ''}>${esc(o.label)}</option>`,
    ),
  ].join('');
  return { disabled: isGradeSelectDisabled(level), html };
}

/**
 * 학교급이 바뀌면 학년에 없는 값(중·고의 4–6학년 등)은 비운다.
 * @param {ParentNode} root
 * @param {{ pair?: string, level?: string, grade?: string }} [opts]
 */
export function bindSchoolGradePairs(root, opts = {}) {
  const pairSel = opts.pair || '[data-school-grade-pair]';
  const levelSel = opts.level || '[data-field="school_level"], [name="school_level"]';
  const gradeSel = opts.grade || '[data-field="grade_band"], [name="grade_level"], [name="grade_band"]';
  root.querySelectorAll(pairSel).forEach((row) => {
    const level = row.querySelector(levelSel);
    const grade = row.querySelector(gradeSel);
    if (!(level instanceof HTMLSelectElement) || !(grade instanceof HTMLSelectElement)) return;
    level.addEventListener('change', () => {
      const next = gradeOptionHtml(level.value, '');
      grade.disabled = next.disabled;
      grade.innerHTML = next.html;
    });
  });
}
