/**
 * 한국 대학교명 SSOT — 과외쌤 등록/수정/검색 공통
 * - 학부 대학명 1개 → tutors.university_name
 * - 학과명(서술형) → tutors.major_name (이 모듈 범위 밖)
 * - 대학원/추가 학력·university_note 는 학교 판정/정렬 기준에 사용하지 않음
 */

/** @type {readonly string[]} */
export const KOREAN_UNIVERSITY_NAMES = Object.freeze([
  '서울대학교',
  '연세대학교',
  '고려대학교',
  '서강대학교',
  '성균관대학교',
  '한양대학교',
  '중앙대학교',
  '경희대학교',
  '한국외국어대학교',
  '서울시립대학교',
  '이화여자대학교',
  '숙명여자대학교',
  '홍익대학교',
  '건국대학교',
  '동국대학교',
  '국민대학교',
  '숭실대학교',
  '세종대학교',
  '단국대학교',
  '인하대학교',
  '아주대학교',
  '가톨릭대학교',
  '한국과학기술원(KAIST)',
  '포항공과대학교(POSTECH)',
  '울산과학기술원(UNIST)',
  '광주과학기술원(GIST)',
  '대구경북과학기술원(DGIST)',
  '부산대학교',
  '경북대학교',
  '전남대학교',
  '전북대학교',
  '충남대학교',
  '충북대학교',
  '강원대학교',
  '제주대학교',
  '서울교육대학교',
  '기타',
]);

/** 검색·선택 UI용 { value, label } */
export const KOREAN_UNIVERSITY_OPTIONS = KOREAN_UNIVERSITY_NAMES.map((label) => ({
  value: label,
  label,
}));

/** SKY 우선 — 학부 정식명 + 짧은 표기만 (university_note·대학원 문구 파싱 금지) */
export const SKY_UNIVERSITY_NAMES = Object.freeze(['서울대학교', '연세대학교', '고려대학교']);

/** @type {ReadonlySet<string>} */
const SKY_NAME_SET = new Set([
  ...SKY_UNIVERSITY_NAMES.map((n) => n.replace(/\s+/g, '')),
  '서울대',
  '연세대',
  '고려대',
]);

/**
 * 비교용 최소 정규화 — 앞뒤 공백·중간 공백만 (괄호 학교명 전체는 유지)
 * @param {string | null | undefined} name
 */
export function normalizeUniversityNameForCompare(name) {
  return String(name ?? '')
    .trim()
    .replace(/\s+/g, '');
}

/**
 * SKY 여부 — tutors.university_name 만. note/대학원 문자열 파싱 금지.
 * @param {string | null | undefined} name
 * @returns {boolean}
 */
export function isSkyUniversityName(name) {
  const n = normalizeUniversityNameForCompare(name);
  if (!n) return false;
  return SKY_NAME_SET.has(n);
}

/**
 * @param {string | null | undefined} raw
 * @returns {string}
 */
export function normalizeUniversityNameInput(raw) {
  return String(raw ?? '').trim();
}

/**
 * 목록에 있는 정식명인지 (기타 제외)
 * @param {string | null | undefined} raw
 */
export function isListedUniversityName(raw) {
  const n = normalizeUniversityNameInput(raw);
  if (!n || n === '기타') return false;
  return KOREAN_UNIVERSITY_NAMES.includes(n);
}

function escAttr(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

/**
 * 대학명 자동완성(datalist) 필드 HTML
 * @param {{
 *   name?: string,
 *   value?: string,
 *   id?: string,
 *   listId?: string,
 *   className?: string,
 *   label?: string,
 *   required?: boolean,
 *   hint?: string,
 *   variant?: 'form'|'p19'|'search',
 * }} [opts]
 */
export function renderUniversityNameField(opts = {}) {
  const name = opts.name || 'university_name';
  const value = normalizeUniversityNameInput(opts.value);
  const id = opts.id || `univ_${name}`;
  const listId = opts.listId || `${id}_list`;
  const className = opts.className || '';
  const variant = opts.variant || 'form';
  const required = opts.required ? 'required' : '';
  const hint =
    opts.hint ||
    '한국 대학교명 목록에서 선택·검색하세요. 학부 대학명 1개만 저장됩니다.';

  const optionsHtml = KOREAN_UNIVERSITY_NAMES.map(
    (u) => `<option value="${escAttr(u)}"></option>`,
  ).join('');

  if (variant === 'search') {
    const labelInner = opts.labelHtml || escAttr(opts.label || '학교명');
    return `
      <label class="search-field${className ? ` ${className}` : ''}">
        <span class="search-field__label">${labelInner}</span>
        <input
          type="text"
          class="search-field__control"
          name="${escAttr(name)}"
          id="${escAttr(id)}"
          list="${escAttr(listId)}"
          value="${escAttr(value)}"
          placeholder="대학명 검색·선택"
          autocomplete="off"
          data-university-autocomplete="1"
        />
        <datalist id="${escAttr(listId)}">${optionsHtml}</datalist>
      </label>`;
  }

  if (variant === 'p19') {
    const inputClass = ['p19-input', className].filter(Boolean).join(' ');
    return `
      <label class="p19-field">
        <span class="p19-field__label">${escAttr(opts.label || '출신대학')}${opts.required ? ' <em class="p19-required">필수</em>' : ''}</span>
        <input
          class="${escAttr(inputClass)}"
          type="text"
          name="${escAttr(name)}"
          id="${escAttr(id)}"
          list="${escAttr(listId)}"
          value="${escAttr(value)}"
          placeholder="대학명 검색·선택"
          autocomplete="off"
          data-university-autocomplete="1"
          ${required}
        />
        <datalist id="${escAttr(listId)}">${optionsHtml}</datalist>
        <span class="p19-field__hint">${escAttr(hint)}</span>
      </label>`;
  }

  const inputClass = ['form-input', className].filter(Boolean).join(' ');
  return `
    <div class="form-group">
      <label class="form-label" for="${escAttr(id)}">${escAttr(opts.label || '출신대학')}</label>
      <input
        class="${escAttr(inputClass)}"
        type="text"
        name="${escAttr(name)}"
        id="${escAttr(id)}"
        list="${escAttr(listId)}"
        value="${escAttr(value)}"
        placeholder="대학명 검색·선택"
        autocomplete="off"
        data-university-autocomplete="1"
        ${required}
      />
      <datalist id="${escAttr(listId)}">${optionsHtml}</datalist>
      <p class="form-hint">${escAttr(hint)}</p>
    </div>`;
}
