/**
 * 한국 대학 SSOT — 등록·검색·결과가 같은 목록을 쓴다.
 * ① 시·도  ② 그 지역 대학(4년제+전문대). 정적 번들. 런타임 외부 API 없음.
 * - 목록에 있는 학부명 → university_name
 * - 대학원·목록 밖 → 등록은 서술(기타 + 직접 입력). 검색은 「기타」
 * - 학과명·university_note 는 이 모듈 밖. SKY 판정은 학부 정식명만.
 */

/** 목록 밖·대학원 검색용 표시명. 화면 코드값으로 쓰지 않는다. */
export const UNIVERSITY_NAME_OTHER = '기타';

/**
 * 본교(또는 캠퍼스) 기준. 명지대학교는 서울 인문·경기 자연 양쪽 목록에 둔다.
 * @type {readonly (readonly [string, readonly string[]])[]}
 */
const REGION_SOURCE = [
  [
    '서울특별시',
    [
      '감리교신학대학교',
      '건국대학교',
      '경희대학교',
      '경희사이버대학교',
      '고려대학교',
      '고려사이버대학교',
      '광운대학교',
      '국민대학교',
      '국제예술대학교',
      '덕성여자대학교',
      '동국대학교',
      '동덕여자대학교',
      '동양미래대학교',
      '명지대학교',
      '명지전문대학',
      '배화여자대학교',
      '백석예술대학교',
      '삼육대학교',
      '삼육보건대학교',
      '상명대학교',
      '서강대학교',
      '서경대학교',
      '서울과학기술대학교',
      '서울교육대학교',
      '서울대학교',
      '서울디지털대학교',
      '서울사이버대학교',
      '서울시립대학교',
      '서울여자간호대학교',
      '서울여자대학교',
      '서울한영대학교',
      '서일대학교',
      '성공회대학교',
      '성균관대학교',
      '성신여자대학교',
      '세종대학교',
      '세종사이버대학교',
      '숙명여자대학교',
      '숭실대학교',
      '숭실사이버대학교',
      '숭의여자대학교',
      '사이버한국외국어대학교',
      '연세대학교',
      '육군사관학교',
      '이화여자대학교',
      '인덕대학교',
      '장로회신학대학교',
      '정화예술대학교',
      '중앙대학교',
      '총신대학교',
      '추계예술대학교',
      '한국방송통신대학교',
      '한국열린사이버대학교',
      '한국예술종합학교',
      '한국외국어대학교',
      '한국체육대학교',
      '한성대학교',
      '한양대학교',
      '한양사이버대학교',
      '한양여자대학교',
      '홍익대학교',
      'KC대학교',
      '서울기독대학교',
    ],
  ],
  [
    '부산광역시',
    [
      '경성대학교',
      '경남정보대학교',
      '고신대학교',
      '대동대학교',
      '동명대학교',
      '동서대학교',
      '동아대학교',
      '동의과학대학교',
      '동의대학교',
      '부경대학교',
      '부산가톨릭대학교',
      '부산경상대학교',
      '부산과학기술대학교',
      '부산교육대학교',
      '부산대학교',
      '부산디지털대학교',
      '부산여자대학교',
      '부산예술대학교',
      '부산외국어대학교',
      '신라대학교',
      '한국해양대학교',
      '화신사이버대학교',
    ],
  ],
  [
    '대구광역시',
    [
      '경북대학교',
      '계명대학교',
      '계명문화대학교',
      '대구경북과학기술원(DGIST)',
      '대구공업대학교',
      '대구과학대학교',
      '대구교육대학교',
      '대구보건대학교',
      '수성대학교',
      '영남이공대학교',
      '영진사이버대학교',
      '영진전문대학교',
    ],
  ],
  [
    '인천광역시',
    [
      '경인교육대학교',
      '경인여자대학교',
      '인천가톨릭대학교',
      '인천대학교',
      '인천재능대학교',
      '인하공업전문대학',
      '인하대학교',
    ],
  ],
  [
    '광주광역시',
    [
      '광신대학교',
      '광주과학기술원(GIST)',
      '광주교육대학교',
      '광주대학교',
      '광주보건대학교',
      '광주여자대학교',
      '기독간호대학교',
      '남부대학교',
      '동강대학교',
      '서영대학교',
      '송원대학교',
      '전남대학교',
      '조선간호대학교',
      '조선대학교',
      '조선이공대학교',
      '호남대학교',
      '호남신학대학교',
    ],
  ],
  [
    '대전광역시',
    [
      '건양사이버대학교',
      '국군간호사관학교',
      '대덕대학교',
      '대전대학교',
      '대전보건대학교',
      '대전신학대학교',
      '목원대학교',
      '배재대학교',
      '우송대학교',
      '우송정보대학',
      '을지대학교',
      '침례신학대학교',
      '충남대학교',
      '한남대학교',
      '한밭대학교',
      '한국과학기술원(KAIST)',
    ],
  ],
  [
    '울산광역시',
    [
      '울산과학기술원(UNIST)',
      '울산과학대학교',
      '울산대학교',
      '춘해보건대학교',
    ],
  ],
  [
    '세종특별자치시',
    ['대전가톨릭대학교', '한국영상대학교'],
  ],
  [
    '경기도',
    [
      '가천대학교',
      '가톨릭대학교',
      '강남대학교',
      '경기대학교',
      '경민대학교',
      '경복대학교',
      '국제대학교',
      '국제사이버대학교',
      '김포대학교',
      '농협대학교',
      '단국대학교',
      '대림대학교',
      '대진대학교',
      '동남보건대학교',
      '동서울대학교',
      '동아방송예술대학교',
      '동원대학교',
      '두원공과대학교',
      '루터대학교',
      '명지대학교',
      '부천대학교',
      '서정대학교',
      '서울신학대학교',
      '서울예술대학교',
      '서울장신대학교',
      '성결대학교',
      '수원가톨릭대학교',
      '수원과학대학교',
      '수원대학교',
      '수원여자대학교',
      '신경대학교',
      '신구대학교',
      '신안산대학교',
      '신한대학교',
      '아주대학교',
      '안산대학교',
      '안양대학교',
      '여주대학교',
      '연성대학교',
      '오산대학교',
      '용인대학교',
      '용인예술과학대학교',
      '유한대학교',
      '장안대학교',
      '중앙승가대학교',
      '차의과학대학교',
      '청강문화산업대학교',
      '칼빈대학교',
      '평택대학교',
      '한경국립대학교',
      '한국공학대학교',
      '한국관광대학교',
      '한국복지대학교',
      '한국항공대학교',
      '한세대학교',
      '한신대학교',
      '협성대학교',
      '아세아연합신학대학교',
    ],
  ],
  [
    '강원특별자치도',
    [
      '가톨릭관동대학교',
      '강릉원주대학교',
      '강원대학교',
      '강원도립대학교',
      '경동대학교',
      '상지대학교',
      '상지영서대학교',
      '세경대학교',
      '송곡대학교',
      '춘천교육대학교',
      '한국골프대학교',
      '한라대학교',
      '한림대학교',
      '한림성심대학교',
    ],
  ],
  [
    '충청북도',
    [
      '강동대학교',
      '공군사관학교',
      '극동대학교',
      '꽃동네대학교',
      '대원대학교',
      '서원대학교',
      '세명대학교',
      '유원대학교',
      '중원대학교',
      '청주교육대학교',
      '청주대학교',
      '충북대학교',
      '충북도립대학교',
      '충북보건과학대학교',
      '충청대학교',
      '한국교원대학교',
      '한국교통대학교',
    ],
  ],
  [
    '충청남도',
    [
      '건양대학교',
      '경찰대학',
      '공주교육대학교',
      '공주대학교',
      '글로벌사이버대학교',
      '금강대학교',
      '나사렛대학교',
      '남서울대학교',
      '백석대학교',
      '백석문화대학교',
      '선문대학교',
      '순천향대학교',
      '신성대학교',
      '아주자동차대학교',
      '연암대학교',
      '중부대학교',
      '청운대학교',
      '충남도립대학교',
      '한국기술교육대학교',
      '한국전통문화대학교',
      '한서대학교',
      '혜전대학교',
      '호서대학교',
    ],
  ],
  [
    '전북특별자치도',
    [
      '군산간호대학교',
      '군산대학교',
      '군장대학교',
      '백제예술대학교',
      '예수대학교',
      '예원예술대학교',
      '우석대학교',
      '원광대학교',
      '원광디지털대학교',
      '원광보건대학교',
      '전북과학대학교',
      '전북대학교',
      '전주교육대학교',
      '전주대학교',
      '전주비전대학교',
      '한국농수산대학교',
      '한일장신대학교',
      '호원대학교',
    ],
  ],
  [
    '전라남도',
    [
      '광양보건대학교',
      '고구려대학교',
      '동신대학교',
      '동아보건대학교',
      '목포가톨릭대학교',
      '목포과학대학교',
      '목포대학교',
      '목포해양대학교',
      '세한대학교',
      '순천대학교',
      '순천제일대학교',
      '영산선학대학교',
      '전남과학대학교',
      '전남도립대학교',
      '청암대학교',
      '초당대학교',
      '한국에너지공과대학교',
      '한영대학교',
    ],
  ],
  [
    '경상북도',
    [
      '가톨릭상지대학교',
      '경북과학대학교',
      '경북도립대학교',
      '경북보건대학교',
      '경북전문대학교',
      '경운대학교',
      '경일대학교',
      '경주대학교',
      '구미대학교',
      '금오공과대학교',
      '김천대학교',
      '대구가톨릭대학교',
      '대구대학교',
      '대구예술대학교',
      '대구한의대학교',
      '대경대학교',
      '동양대학교',
      '문경대학교',
      '선린대학교',
      '성운대학교',
      '서라벌대학교',
      '안동과학대학교',
      '안동대학교',
      '영남대학교',
      '영남신학대학교',
      '위덕대학교',
      '포항공과대학교(POSTECH)',
      '한동대학교',
      '호산대학교',
      '육군3사관학교',
    ],
  ],
  [
    '경상남도',
    [
      '가야대학교',
      '거제대학교',
      '경남대학교',
      '경남도립거창대학',
      '경남도립남해대학',
      '경상국립대학교',
      '김해대학교',
      '동원과학기술대학교',
      '마산대학교',
      '부산장신대학교',
      '연암공과대학교',
      '영산대학교',
      '인제대학교',
      '진주교육대학교',
      '진주보건대학교',
      '창신대학교',
      '창원문성대학교',
      '창원대학교',
      '한국승강기대학교',
      '해군사관학교',
    ],
  ],
  [
    '제주특별자치도',
    ['제주관광대학교', '제주국제대학교', '제주대학교', '제주한라대학교'],
  ],
];

function sortKo(names) {
  return Object.freeze([...new Set(names)].sort((a, b) => a.localeCompare(b, 'ko')));
}

/** @type {readonly { region: string, schools: readonly string[] }[]} */
export const KOREAN_UNIVERSITIES_BY_REGION = Object.freeze(
  REGION_SOURCE.map(([region, schools]) =>
    Object.freeze({
      region,
      schools: sortKo(schools),
    }),
  ),
);

/** @type {readonly string[]} */
export const KOREAN_UNIVERSITY_REGIONS = Object.freeze(
  KOREAN_UNIVERSITIES_BY_REGION.map((group) => group.region),
);

/** 목록 학부명. 기타·대학원 서술은 넣지 않는다. */
export const KOREAN_UNIVERSITY_NAMES = Object.freeze(
  sortKo(KOREAN_UNIVERSITIES_BY_REGION.flatMap((group) => [...group.schools])),
);

/** 검색·선택 UI용 { value, label }. 값은 화면 학교명과 같다. */
export const KOREAN_UNIVERSITY_OPTIONS = KOREAN_UNIVERSITY_NAMES.map((label) => ({
  value: label,
  label,
}));

/** @type {Map<string, string>} 처음 등장하는 시·도. 명지대 복원은 서울. */
const SCHOOL_REGION = new Map();
for (const group of KOREAN_UNIVERSITIES_BY_REGION) {
  for (const school of group.schools) {
    if (!SCHOOL_REGION.has(school)) SCHOOL_REGION.set(school, group.region);
  }
}

/** 주요 대학 출신 우선 — 학부 정식명 + 짧은 표기만 (university_note·대학원 문구 파싱 금지) */
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
 * 목록에 있는 정식명인지 (기타·서술 제외)
 * @param {string | null | undefined} raw
 */
export function isListedUniversityName(raw) {
  const n = normalizeUniversityNameInput(raw);
  if (!n || n === UNIVERSITY_NAME_OTHER) return false;
  return KOREAN_UNIVERSITY_NAMES.includes(n);
}

/**
 * @param {string} region
 * @returns {readonly string[]}
 */
export function universitiesInRegion(region) {
  const found = KOREAN_UNIVERSITIES_BY_REGION.find((group) => group.region === region);
  return found ? found.schools : [];
}

/**
 * @param {string | null | undefined} raw
 * @returns {string}
 */
export function regionForUniversityName(raw) {
  const n = normalizeUniversityNameInput(raw);
  if (!n) return '';
  return SCHOOL_REGION.get(n) || '';
}

/**
 * @param {string | null | undefined} raw
 * @returns {{ region: string, visible: string, note: string }}
 */
export function resolveUniversityPicker(raw) {
  const name = normalizeUniversityNameInput(raw);
  if (!name) return { region: '', visible: '', note: '' };
  const region = regionForUniversityName(name);
  if (region) return { region, visible: name, note: '' };
  if (name === UNIVERSITY_NAME_OTHER) return { region: '', visible: UNIVERSITY_NAME_OTHER, note: '' };
  return { region: '', visible: UNIVERSITY_NAME_OTHER, note: name };
}

function escAttr(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

function regionOptionsHtml(selected) {
  const head = '<option value="">시·도 선택</option>';
  const body = KOREAN_UNIVERSITY_REGIONS.map((region) => {
    const sel = region === selected ? ' selected' : '';
    return `<option value="${escAttr(region)}"${sel}>${escAttr(region)}</option>`;
  }).join('');
  return head + body;
}

function datalistOptionsHtml(region) {
  const schools = universitiesInRegion(region);
  const listed = schools.map((name) => `<option value="${escAttr(name)}"></option>`).join('');
  return `${listed}<option value="${UNIVERSITY_NAME_OTHER}"></option>`;
}

const REGISTER_HINT =
  '시·도를 고른 뒤 그 지역 대학을 선택하세요. 대학원이나 목록에 없는 학교는 기타를 고르고 직접 입력합니다.';
const SEARCH_HINT = '대학원·목록 밖은 기타입니다.';

/**
 * 대학/대학원 2단 필드. 저장값은 name 입력 하나.
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
  const variant = opts.variant || 'form';
  const mode = variant === 'search' ? 'search' : 'register';
  const name = opts.name || 'university_name';
  const stored = normalizeUniversityNameInput(opts.value);
  const resolved = resolveUniversityPicker(stored);
  const id = opts.id || `univ_${name}`;
  const listId = opts.listId || `${id}_list`;
  const label = opts.label || '대학/대학원';
  const hint = opts.hint || (mode === 'search' ? SEARCH_HINT : REGISTER_HINT);
  const required = opts.required ? 'required' : '';
  const controlClass =
    variant === 'p19' ? 'p19-input' : variant === 'search' ? 'search-field__control' : 'form-input';
  const selectClass = variant === 'p19' ? `${controlClass} p19-select` : controlClass;
  const showNote = mode === 'register' && resolved.visible === UNIVERSITY_NAME_OTHER;
  const tier = `
    <div data-university-tier style="display:flex;flex-direction:column;gap:8px">
      <select class="${escAttr(selectClass)}" data-university-sido aria-label="시·도">
        ${regionOptionsHtml(resolved.region)}
      </select>
      <input
        class="${escAttr(controlClass)}"
        type="text"
        id="${escAttr(id)}"
        list="${escAttr(listId)}"
        value="${escAttr(resolved.visible)}"
        placeholder="대학 검색·선택"
        autocomplete="off"
        data-university-autocomplete="1"
        aria-label="대학"
        ${required}
      />
      <datalist id="${escAttr(listId)}">${datalistOptionsHtml(resolved.region)}</datalist>
      ${
        mode === 'register'
          ? `<input
        class="${escAttr(controlClass)}"
        type="text"
        data-university-note
        value="${escAttr(resolved.note)}"
        placeholder="대학원 또는 목록에 없는 학교"
        autocomplete="off"
        aria-label="대학원 또는 기타 학교"
        ${showNote ? '' : 'hidden'}
      />`
          : ''
      }
      <input type="hidden" name="${escAttr(name)}" value="${escAttr(stored)}" data-university-value />
    </div>`;

  if (variant === 'search') {
    const extra = opts.className ? ` ${opts.className}` : '';
    return `
      <div class="search-field${extra}" data-university-picker data-university-mode="search">
        <span class="search-field__label">${escAttr(label)}</span>
        ${tier}
        <span class="search-field__label" style="font-weight:400;color:#64748b">${escAttr(hint)}</span>
      </div>`;
  }

  if (variant === 'p19') {
    const req = opts.required ? ' <em class="p19-required">필수</em>' : '';
    return `
      <div class="p19-field" data-university-picker data-university-mode="register">
        <span class="p19-field__label">${escAttr(label)}${req}</span>
        ${tier}
        <span class="p19-field__hint">${escAttr(hint)}</span>
      </div>`;
  }

  return `
    <div class="form-group" data-university-picker data-university-mode="register">
      <label class="form-label" for="${escAttr(id)}">${escAttr(label)}</label>
      ${tier}
      <p class="form-hint">${escAttr(hint)}</p>
    </div>`;
}

/**
 * 시·도 → 그 지역 대학 datalist.
 * 188: 값이 있으면 누르면 비우고, 고르지 않고 빠지면 이전 값을 되돌린다. readonly/disabled 금지.
 * @param {ParentNode} root
 */
export function bindUniversityNameField(root) {
  root.querySelectorAll('[data-university-picker]').forEach((picker) => {
    if (!(picker instanceof HTMLElement)) return;
    if (picker.dataset.universityBound === '1') return;
    picker.dataset.universityBound = '1';

    const mode = picker.dataset.universityMode === 'search' ? 'search' : 'register';
    const sido = picker.querySelector('[data-university-sido]');
    const visible = picker.querySelector('[data-university-autocomplete]');
    const hidden = picker.querySelector('[data-university-value]');
    const list = picker.querySelector('datalist');
    const note = picker.querySelector('[data-university-note]');
    if (!(sido instanceof HTMLSelectElement)) return;
    if (!(visible instanceof HTMLInputElement)) return;
    if (!(hidden instanceof HTMLInputElement)) return;
    if (!(list instanceof HTMLDataListElement)) return;

    sido.disabled = false;
    visible.disabled = false;
    visible.readOnly = false;
    hidden.disabled = false;
    sido.removeAttribute('disabled');
    visible.removeAttribute('readonly');
    visible.removeAttribute('disabled');
    if (note instanceof HTMLInputElement) {
      note.disabled = false;
      note.readOnly = false;
      note.removeAttribute('readonly');
      note.removeAttribute('disabled');
    }

    const fillList = (region) => {
      const schools = universitiesInRegion(region);
      list.replaceChildren();
      for (const school of schools) {
        const opt = document.createElement('option');
        opt.value = school;
        list.appendChild(opt);
      }
      const other = document.createElement('option');
      other.value = UNIVERSITY_NAME_OTHER;
      list.appendChild(other);
    };

    const syncNote = () => {
      if (!(note instanceof HTMLInputElement) || mode === 'search') return;
      note.hidden = visible.value.trim() !== UNIVERSITY_NAME_OTHER;
    };

    const publish = () => {
      const current = visible.value.trim();
      if (mode === 'register' && current === UNIVERSITY_NAME_OTHER && note instanceof HTMLInputElement) {
        note.hidden = false;
        const typed = note.value.trim();
        hidden.value = typed || UNIVERSITY_NAME_OTHER;
        return;
      }
      if (note instanceof HTMLInputElement && current !== UNIVERSITY_NAME_OTHER) {
        note.hidden = true;
        if (current && isListedUniversityName(current)) note.value = '';
      }
      hidden.value = current;
    };

    sido.addEventListener('change', () => {
      const current = visible.value.trim();
      const schools = universitiesInRegion(sido.value);
      if (sido.value && current && current !== UNIVERSITY_NAME_OTHER && !schools.includes(current)) {
        visible.value = '';
        if (note instanceof HTMLInputElement) note.value = '';
      }
      fillList(sido.value);
      publish();
    });

    let held = '';
    visible.addEventListener('pointerdown', () => {
      visible.readOnly = false;
      visible.disabled = false;
      if (!visible.value) return;
      held = visible.value;
      visible.value = '';
    });
    visible.addEventListener('input', () => {
      held = '';
      publish();
    });
    visible.addEventListener('change', () => {
      held = '';
      publish();
      if (mode === 'register' && visible.value.trim() === UNIVERSITY_NAME_OTHER && note instanceof HTMLInputElement) {
        note.focus();
      }
    });
    visible.addEventListener('blur', () => {
      if (!visible.value.trim() && held) visible.value = held;
      held = '';
      publish();
    });

    if (note instanceof HTMLInputElement) {
      note.addEventListener('input', publish);
      note.addEventListener('change', publish);
      note.addEventListener('blur', publish);
    }

    syncNote();
  });
}
