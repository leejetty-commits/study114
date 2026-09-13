/** 섹션 타이틀 SSOT — 프라임/픽/베이직 브랜드 고유명사 · 현재위치는 우측 */

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
}

const LOGO_SRC = '/assets/brand/logo-wordmark.png';

/**
 * tier: prime(금·중앙·장식) | pick(은·중앙·장식) | basic(블루·좌측) | plain
 * showLogo: 프라임/픽은 로고 + 고유명사
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
    showLogo: false,
    brandText: '우동공과',
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
    showLogo: false,
    brandText: '우동공과',
    title: '베이직과외쌤',
    ariaTitle: '우동공과 베이직과외쌤',
  },
  students: {
    tier: 'basic',
    showLogo: false,
    brandText: '우동공과',
    title: '학생 학습 의뢰',
    ariaTitle: '우동공과 학생 학습 의뢰',
  },
};

/**
 * 제목 우측 현재위치 — '현재위치' 작은글씨 + 지역명 일반크기 · 우측정렬
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
 * }} cfg
 */
export function renderSectionHeading(cfg) {
  const tier = cfg.tier || 'plain';
  const alignClass =
    tier === 'prime' || tier === 'pick' ? 'section-heading--center' : 'section-heading--start';
  const tierClass = tier !== 'plain' ? ` section-heading--${tier}` : '';
  const aria = esc(cfg.ariaTitle || (cfg.brandText ? `${cfg.brandText} ${cfg.title}` : cfg.title));

  let brandInner = '';
  if (cfg.showLogo) {
    brandInner = `
      <img class="section-heading__logo" src="${LOGO_SRC}" alt="우동공과" width="72" height="18" />
      <h2 class="section-heading__title">${esc(cfg.title)}</h2>`;
  } else if (cfg.brandText) {
    brandInner = `
      <span class="section-heading__brand-text">${esc(cfg.brandText)}</span>
      <h2 class="section-heading__title">${esc(cfg.title)}</h2>`;
  } else if (cfg.iconType === 'logo' && cfg.icon) {
    brandInner = `
      <img class="section-heading__logo" src="${cfg.icon}" alt="" width="72" height="18" />
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
  const locHtml = renderLocationBesideTitle(locationLabel);

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
