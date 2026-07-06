/**
 * 29장 — 공통 Empty · Error · 권한 부족 UX 상태 copy
 * SSOT: docs/ssot/29-empty-error-permission-ux.md (2026-07-06 정책 잠금)
 *
 * 역할: 문구 원칙·상태 구조 정본. P-ID/route/구현은 30장.
 * 화면별 copy(mypage-copy, messages-copy, handoff-copy)는 점진 이전.
 */

/** §10 최종 원칙 */
export const EMPTY_STATE_PRINCIPLE =
  '상태 문구는 사용자를 혼내거나 압박하지 않고, 현재 상태를 짧게 설명한 뒤 다음 행동으로 자연스럽게 이어지게 만든다.';

/** §2 상태 카드 5요소 */
export const STATE_CARD_ELEMENTS = ['title', 'lead', 'cta', 'secondaryLinks', 'tone'];

/** §2 문구 작성 순서 */
export const COPY_WRITE_ORDER = [
  '무엇이 비어 있거나 제한되어 있는지',
  '왜 그런 상태인지 짧게',
  '다음 행동',
  '필요 시 보호/정책 안내',
];

/** @typedef {'guest'|'role'|'paid'|'student_protection'|'not_public'} PermissionDeniedKind */

/** §3 권한 부족 5종 */
export const PERMISSION_DENIED_COPY = {
  guest: {
    kind: 'guest',
    title: '로그인이 필요합니다',
    body: '로그인 후 자세한 정보를 볼 수 있습니다.',
    cta: '로그인',
  },
  role: {
    kind: 'role',
    title: '역할 제한',
    body: '이 기능은 과외쌤 역할에서 이용할 수 있습니다.',
    cta: null,
  },
  paid: {
    kind: 'paid',
    title: '쪽지권·열람권 안내',
    body: '이 기능은 쪽지권 또는 요청문 열람권이 필요합니다.',
    cta: '유료 서비스 안내',
  },
  student_protection: {
    kind: 'student_protection',
    title: '학생 정보 보호',
    body: '학생 정보는 보호를 위해 제한적으로만 공개됩니다.',
    cta: null,
  },
  not_public: {
    kind: 'not_public',
    title: '비공개 정보',
    body: '이 정보는 아직 공개되지 않았습니다.',
    cta: null,
  },
};

/** §6 학생 보호 — 보호 안내 톤 (권한 부족과 분리) */
export const STUDENT_PROTECTION_COPY = {
  summary: '학생 정보는 보호를 위해 제한적으로만 공개됩니다.',
  detailLimited: '학생 상세 정보는 공개 범위 안에서만 확인할 수 있습니다.',
};

/** @typedef {'load'|'save'|'status_change'|'server'} ErrorKind */

/** §4 Error 4종 */
export const ERROR_COPY = {
  load: {
    body: '불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
    cta: '다시 시도',
  },
  save: {
    body: '저장하지 못했습니다. 입력한 내용을 확인한 뒤 다시 시도해 주세요.',
    cta: '다시 저장',
    preserveInput: true,
  },
  status_change: {
    body: '상태를 변경하지 못했습니다. 잠시 후 다시 시도해 주세요.',
    cta: '다시 시도',
  },
  server: {
    body: '일시적인 문제가 발생했습니다. 잠시 후 다시 이용해 주세요.',
    cta: '새로고침',
  },
};

/** §5 Empty — 사용자 데이터 아직 없음 */
export const EMPTY_COPY = {
  wishlist: {
    screenId: 'P15-06',
    title: '아직 찜한 대상이 없습니다',
    body: '검색에서 관심 대상을 저장해 보세요.',
    cta: '검색하기',
  },
  recent: {
    screenId: 'P15-07',
    title: '최근열람 기록이 없습니다',
    body: '공부방·과외 탐색 후 자동으로 기록됩니다.',
    cta: '탐색하기',
  },
  messages: {
    screenId: 'P16-01',
    title: '쪽지가 없습니다',
    body: '상세·검색에서 첫 메모를 보내 보세요.',
    cta: null,
  },
  compare: {
    screenId: 'P25-xx',
    title: '비교할 후보가 없습니다',
    body: '비교할 공부방이나 과외쌤을 추가해 주세요.',
    cta: '탐색하기',
  },
  compareNeedMore: {
    screenId: 'P25-04',
    title: '비교할 후보가 더 필요합니다',
    body: '비교하려면 후보를 하나 더 담아주세요.',
    cta: '탐색하기',
  },
  studentReview: {
    screenId: 'P25-S10',
    title: '검토함이 비어 있습니다',
    body: '학생찾기에서 조건에 맞는 의뢰를 저장해 보세요.',
    cta: '학생찾기',
  },
  students: {
    screenId: 'P19-01',
    title: '등록된 자녀가 없습니다',
    body: '자녀별로 희망 조건을 등록하고 학생찾기에 공개할 수 있습니다.',
    cta: '+ 자녀 추가',
  },
  studentsTab: {
    screenId: 'P19-01',
    title: '해당 상태의 자녀가 없습니다',
    body: '다른 탭을 선택하거나 자녀를 추가해 보세요.',
    cta: null,
  },
  library: {
    screenId: 'P23-01',
    title: '등록된 자료가 없습니다',
    body: '다른 카테고리를 선택하거나 나중에 다시 확인해 주세요.',
    cta: null,
  },
};

/** §5 0건 — 검색·지역 피드 결과 없음 (13장 · 29장 톤) */
export const ZERO_RESULT_COPY = {
  search: {
    title: '조건에 맞는 결과가 없습니다',
    body: '지역이나 조건을 넓혀보세요.',
    cta: '조건 변경',
  },
};

/**
 * @param {'room'|'tutor'|'student'} tab
 * @param {'region'|'search'} mode
 */
export function getSearchZeroResultCopy(tab, mode = 'search') {
  const regionCopy = {
    room: {
      title: '이 지역에 등록된 공부방이 없습니다',
      body: '지역을 넓히거나 아래 조건 검색으로 범위를 조정해 보세요.',
      cta: '조건 검색',
    },
    tutor: {
      title: '선택한 지역에 과외쌤이 없습니다',
      body: '다른 지역 탭을 선택하거나 검색 조건을 넓혀 보세요.',
      cta: '조건 검색',
    },
    student: {
      title: '이 지역에 학습 요청이 없습니다',
      body: '지역을 확인하거나 수업 형태·조건을 넓혀 보세요.',
      cta: '조건 변경',
    },
  };
  const searchCopy = {
    room: {
      title: '조건에 맞는 공부방이 없습니다',
      body: '필터를 넓혀 보세요. 초기화하면 내 지역 목록으로 돌아갑니다.',
      cta: '조건 초기화',
      ctaAction: 'reset-filters',
    },
    tutor: {
      title: '조건에 맞는 과외쌤이 없습니다',
      body: '다른 활동 지역 탭을 선택하거나 필터를 넓혀 보세요.',
      cta: '조건 초기화',
      ctaAction: 'reset-filters',
    },
    student: {
      title: '조건에 맞는 학습 요청이 없습니다',
      body: '수업 형태나 지역 조건을 넓혀 보세요.',
      cta: '조건 초기화',
      ctaAction: 'reset-filters',
    },
  };
  const bucket = mode === 'region' ? regionCopy : searchCopy;
  return bucket[tab] || ZERO_RESULT_COPY.search;
}

/**
 * @param {'room'|'tutor'|'student'} tab
 * @param {'region'|'search'} mode
 */
export function renderSearchZeroState(tab, mode = 'search') {
  const copy = getSearchZeroResultCopy(tab, mode);
  return renderStateCard({
    title: copy.title,
    body: copy.body,
    cta: copy.cta,
    ctaAction: copy.ctaAction,
    variant: 'empty',
    screenId: 'P13-zero',
  });
}

/** §5 Max — 상한 도달 */
export const MAX_COPY = {
  compare: {
    screenId: 'P25-xx',
    max: 3,
    title: '비교 후보를 더 담을 수 없습니다',
    body: '비교 후보는 최대 3개까지 담을 수 있습니다.',
    cta: '비교함 열기',
  },
};

/** §7 CTA 원칙 (문서용) */
export const CTA_PRINCIPLES = {
  avoid: ['결제하세요', '가입해야만 볼 수 있음', '권한 없음', '실패했습니다'],
  prefer: ['쪽지권·열람권이 필요합니다', '로그인 후 자세한 정보를 볼 수 있습니다', '다시 시도해 주세요'],
};

/** §8 금지어 → 대체 (22·28장 연동) */
export const FORBIDDEN_STATE_TERM_MAP = {
  '승인 대기': '공개 준비 미완료',
  반려: '수정 필요 / 입력 필요',
  '검증 완료': '제출자료 공개',
  인증됨: '신뢰정보 공개',
  '심사 중': '저장중 / 공개 전 확인 필요',
  '검수 대기': '저장중 / 공개 전 확인 필요',
  '운영자 확인 완료': '표시하지 않음',
  '공식 인증': '표시하지 않음',
  '신뢰도 점수': '표시하지 않음 / 신뢰정보 N개 공개',
};

export const FORBIDDEN_STATE_TERMS = Object.keys(FORBIDDEN_STATE_TERM_MAP);

/** §9 P-ID 바인딩 · 30장 부록 B 적용 지도 */
export const STATE_SCREEN_BINDINGS = {
  'P15-06': { state: 'empty|error|permission', keys: ['wishlist'], permission: ['guest'] },
  'P15-07': { state: 'empty|error|permission', keys: ['recent'], permission: ['guest'] },
  'P16-01': { state: 'empty|error|permission', keys: ['messages'], permission: ['guest'] },
  'P19-01': { state: 'empty|error|permission', keys: ['students', 'studentsTab'], permission: ['role'] },
  'P20-02': { state: 'error|permission', permission: ['role'] },
  'P21-05': { state: 'error|permission|max', permission: ['role', 'paid', 'student_protection'], max: ['memo'] },
  'P24-03': { state: 'error|permission', permission: ['guest', 'paid'] },
  'P24-04': { state: 'error|permission', permission: ['student_protection', 'paid'] },
  'P25-04': { state: 'empty|error|permission|max', keys: ['compare'], permission: ['guest'] },
  'P25-S10': { state: 'empty|error|permission', keys: ['studentReview'], permission: ['role'] },
};

/**
 * @param {PermissionDeniedKind} kind
 * @param {{ roleLabel?: string }} [opts]
 */
export function getPermissionDeniedCopy(kind, opts = {}) {
  const base = PERMISSION_DENIED_COPY[kind];
  if (!base) return PERMISSION_DENIED_COPY.guest;
  if (kind === 'role' && opts.roleLabel) {
    return {
      ...base,
      body: `이 기능은 ${opts.roleLabel} 역할에서 이용할 수 있습니다.`,
    };
  }
  return base;
}

/** @param {ErrorKind} kind */
export function getErrorCopy(kind) {
  return ERROR_COPY[kind] || ERROR_COPY.load;
}

/**
 * @param {'wishlist'|'recent'|'messages'|'compare'|'compareNeedMore'|'studentReview'|'students'|'studentsTab'} key
 */
export function getEmptyCopy(key) {
  return EMPTY_COPY[key] || { title: '항목이 없습니다', body: '', cta: null };
}

/**
 * @param {number} [max]
 */
export function getCompareMaxCopy(max = MAX_COPY.compare.max) {
  return {
    ...MAX_COPY.compare,
    body: `비교 후보는 최대 ${max}개까지 담을 수 있습니다.`,
  };
}

/** @param {'parent'|'study_room'|'tutor'|'guest'} role */
export function getMessagesEmptyCopy(role) {
  if (role === 'parent') {
    return {
      ...EMPTY_COPY.messages,
      body: '관심 있는 공부방·과외쌤에게 메모를 보내 보세요.',
    };
  }
  return {
    ...EMPTY_COPY.messages,
    body: '학생찾기에서 의뢰를 확인하고 메모를 보내 보세요.',
    cta: '학생찾기',
  };
}

/**
 * §2 Empty 상태 카드
 * @param {'wishlist'|'recent'|'messages'|'compare'|'compareNeedMore'|'studentReview'|'students'|'studentsTab'} key
 * @param {{ ctaHref?: string, links?: Array<{label:string,href:string}> }} [opts]
 */
export function renderEmptyStateCard(key, opts = {}) {
  const copy = getEmptyCopy(key);
  return renderStateCard({
    title: copy.title,
    body: copy.body,
    cta: copy.cta,
    ctaHref: opts.ctaHref,
    links: opts.links,
    screenId: copy.screenId,
  });
}

/**
 * §3·§6 권한/보호 상태 카드
 * @param {PermissionDeniedKind} kind
 * @param {{ roleLabel?: string, loginHref?: string, plansHref?: string, links?: Array<{label:string,href:string}> }} [opts]
 */
export function renderPermissionStateCard(kind, opts = {}) {
  const copy = getPermissionDeniedCopy(kind, opts);
  const links = opts.links ? [...opts.links] : [];
  if (kind === 'guest' && opts.loginHref) {
    links.push({ label: copy.cta || '로그인', href: opts.loginHref });
  } else if (kind === 'paid' && opts.plansHref) {
    links.push({ label: copy.cta || '유료 서비스 보기', href: opts.plansHref });
  }
  return renderStateCard({
    title: copy.title,
    body: copy.body,
    cta: links.length ? null : copy.cta,
    links,
    variant: kind === 'student_protection' ? 'protection' : 'permission',
  });
}

/** §5 Max — 비교 상한 */
export function renderCompareMaxState(max = MAX_COPY.compare.max) {
  const copy = getCompareMaxCopy(max);
  return renderStateCard({
    title: copy.title,
    body: copy.body,
    cta: copy.cta,
    variant: 'max',
    screenId: copy.screenId,
  });
}

/**
 * §2 상태 카드 HTML 조각 (프리뷰 공통)
 * @param {{ title: string, body?: string, cta?: string|null, ctaHref?: string, ctaAction?: string, links?: Array<{label:string,href:string}>, screenId?: string, variant?: string }} opts
 */
export function renderStateCard(opts) {
  const esc = (s) =>
    String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;');
  const links = (opts.links || [])
    .map((l) => `<a href="${esc(l.href)}" class="state-card__link">${esc(l.label)}</a>`)
    .join('');
  const cta =
    opts.cta && opts.ctaAction
      ? `<button type="button" class="btn btn--secondary btn--sm state-card__cta" data-action="${esc(opts.ctaAction)}">${esc(opts.cta)}</button>`
      : opts.cta && opts.ctaHref
      ? `<a href="${esc(opts.ctaHref)}" class="btn btn--secondary btn--sm state-card__cta">${esc(opts.cta)}</a>`
      : opts.cta
        ? `<span class="state-card__cta-hint">${esc(opts.cta)}</span>`
        : '';
  const variant = opts.variant ? ` state-card--${opts.variant}` : '';
  const meta = opts.screenId ? `<span class="state-card__id">${esc(opts.screenId)}</span>` : '';
  return `
    <div class="state-card${variant}" role="status">
      ${meta}
      <p class="state-card__title">${esc(opts.title)}</p>
      ${opts.body ? `<p class="state-card__body">${esc(opts.body)}</p>` : ''}
      ${cta}
      ${links ? `<div class="state-card__links">${links}</div>` : ''}
    </div>`;
}

/**
 * @param {string} text
 * @returns {string|null}
 */
export function findForbiddenStateTerm(text) {
  const s = String(text ?? '');
  for (const term of FORBIDDEN_STATE_TERMS) {
    if (s.includes(term)) return term;
  }
  return null;
}
