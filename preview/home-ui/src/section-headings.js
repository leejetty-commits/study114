/** 섹션 타이틀 SSOT — 프라임/픽 단독행 · 베이직은 제목+현재위치+정렬 한 행 */

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
}

const LOGO_SRC = '/assets/brand/logo-wordmark.png';

/**
 * tier: prime(금·중앙·장식) | pick(은·중앙·장식) | basic(블루·좌측) | plain
 * showLogo: 우동공과 로고 + 고유명사 (프라임/픽/베이직/학생 공통)
 */
export const SECTION_HEADINGS = {
  primeStudyRoom: {
    tier: 'prime',
    showLogo: true,
    title: '프라임공부방',
    ariaTitle: '우동공과 프라임공부방',
  },
  pickStudyRoom: {
    tier: 'pick',
    showLogo: true,
    title: '픽공부방',
    ariaTitle: '우동공과 픽공부방',
  },
  basicStudyRoom: {
    tier: 'basic',
    showLogo: true,
    title: '베이직공부방',
    ariaTitle: '우동공과 베이직공부방',
  },
  primeTutor: {
    tier: 'prime',
    showLogo: true,
    title: '프라임과외쌤',
    ariaTitle: '우동공과 프라임과외쌤',
  },
  pickTutor: {
    tier: 'pick',
    showLogo: true,
    title: '픽과외쌤',
    ariaTitle: '우동공과 픽과외쌤',
  },
  basicTutor: {
    tier: 'basic',
    showLogo: true,
    title: '베이직과외쌤',
    ariaTitle: '우동공과 베이직과외쌤',
  },
  students: {
    tier: 'basic',
    showLogo: true,
    title: '학생',
    ariaTitle: '우동공과 학생',
  },
};

/**
 * 제목 우측이 아닌, 정렬 바와용 현재위치
 * @param {string} [locationLabel]
 */
export function renderLocationBesideTitle(locationLabel) {
  const loc = String(locationLabel || '').trim();
  if (!loc) return '';
  return `
    <span class="section-heading__loc" aria-label="현재위치 ${esc(loc)}">
      <span class="section-heading__loc-label">현재위치</span>
      <span class="section-heading__loc-value">${esc(loc)}</span>
    </span>`;
}

/**
 * 현재위치 + 정렬을 한 덩어리로 (정렬 바로 앞 · 같은 행 우측)
 * @param {{ locationLabel?: string, sortHtml?: string }} opts
 */
export function renderSectionToolbar(opts = {}) {
  const locHtml = renderLocationBesideTitle(opts.locationLabel);
  const sortHtml = String(opts.sortHtml || '').trim();
  if (!locHtml && !sortHtml) return '';
  return `
    <div class="section-toolbar">
      <div class="section-toolbar__cluster">
        ${locHtml}
        ${sortHtml ? `<div class="section-toolbar__sort">${sortHtml}</div>` : ''}
      </div>
    </div>`;
}

/**
 * 베이직: 제목 + 현재위치 + 정렬을 한 행 (제목 맨 앞)
 * 프라임/픽: 제목 단독행 + 아래 toolbar
 * @param {Parameters<typeof renderSectionHeading>[0]} headingCfg
 * @param {{ locationLabel?: string, sortHtml?: string, inline?: boolean }} [opts]
 */
export function renderSectionTitleBar(headingCfg, opts = {}) {
  const tier = headingCfg?.tier || 'plain';
  const locationLabel = opts.locationLabel ?? headingCfg?.locationLabel;
  const sortHtml = opts.sortHtml || '';
  const heading = renderSectionHeading({ ...headingCfg, locationLabel: undefined });
  const toolbar = renderSectionToolbar({ locationLabel, sortHtml });
  const forceInline = opts.inline === true || tier === 'basic';
  if (forceInline) {
    return `
    <div class="section-title-bar section-title-bar--basic">
      ${heading}
      ${toolbar}
    </div>`;
  }
  return `${heading}${toolbar}`;
}

/**
 * @param {{
 *   tier?: 'prime'|'pick'|'basic'|'plain',
 *   showLogo?: boolean,
 *   brandText?: string,
 *   title: string,
 *   ariaTitle?: string,
 *   desc?: string,
 *   locationLabel?: string,
 *   id?: string,
 *   icon?: string,
 *   iconType?: 'emoji'|'logo',
 *   inlineLocation?: boolean,
 * }} cfg
 */
export function renderSectionHeading(cfg) {
  const tier = cfg.tier || 'plain';
  // 프라임/픽: 중앙 · 베이직(학생 포함): 좌측
  const alignClass =
    tier === 'prime' || tier === 'pick' ? 'section-heading--center' : 'section-heading--start';
  const tierClass = tier !== 'plain' ? ` section-heading--${tier}` : '';
  const aria = esc(cfg.ariaTitle || (cfg.brandText ? `${cfg.brandText} ${cfg.title}` : cfg.title));

  let brandInner = '';
  if (cfg.showLogo || cfg.iconType === 'logo') {
    const src = cfg.iconType === 'logo' && cfg.icon ? cfg.icon : LOGO_SRC;
    brandInner = `
      <img class="section-heading__logo" src="${src}" alt="우동공과" width="88" height="22" />
      <h2 class="section-heading__title">${esc(cfg.title)}</h2>`;
  } else if (cfg.brandText) {
    // 로고 미지정 시에도 동일 로고 사용 (전역 통일)
    brandInner = `
      <img class="section-heading__logo" src="${LOGO_SRC}" alt="${esc(cfg.brandText)}" width="88" height="22" />
      <h2 class="section-heading__title">${esc(cfg.title)}</h2>`;
  } else if (cfg.iconType === 'emoji' && cfg.icon) {
    brandInner = `
      <span class="section-heading__emoji" aria-hidden="true">${cfg.icon}</span>
      <h2 class="section-heading__title">${esc(cfg.title)}</h2>`;
  } else {
    brandInner = `<h2 class="section-heading__title">${esc(cfg.title)}</h2>`;
  }

  const ornaments =
    tier === 'prime' || tier === 'pick'
      ? `
      <span class="section-heading__ornament section-heading__ornament--left" aria-hidden="true"></span>
      <span class="section-heading__brand">${brandInner}</span>
      <span class="section-heading__ornament section-heading__ornament--right" aria-hidden="true"></span>`
      : `<span class="section-heading__brand">${brandInner}</span>`;

  const locFromDesc =
    !cfg.locationLabel &&
    cfg.desc &&
    !/[·|]/.test(cfg.desc) &&
    !/프라임|픽|베이직|노출|블라인드|검색/.test(cfg.desc)
      ? cfg.desc
      : '';
  const locationLabel = cfg.locationLabel || locFromDesc;

  // 기본: 위치는 제목에서 분리(toolbar). 구호출만 inlineLocation
  const locHtml = cfg.inlineLocation ? renderLocationBesideTitle(locationLabel) : '';

  const descHtml =
    cfg.desc && cfg.desc !== locationLabel
      ? `<span class="section-heading__desc">${esc(cfg.desc)}</span>`
      : '';

  return `
    <header class="section-heading${tierClass} ${alignClass}" ${cfg.id ? `id="${cfg.id}"` : ''} aria-label="${aria}">
      <div class="section-heading__main">
        ${ornaments}
      </div>
      ${locHtml}
      ${descHtml}
    </header>
  `;
}
