/** 비회원·찾기 섹션 타이틀 — 좌측 정렬 · 현재위치는 제목 우측 */

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
}

export const SECTION_HEADINGS = {
  primeStudyRoom: { icon: '🏆', iconType: 'emoji', title: '프라임 공부방' },
  pickStudyRoom: { icon: '⭐', iconType: 'emoji', title: '픽 공부방' },
  basicStudyRoom: { icon: '/assets/brand/logo-wordmark.png', iconType: 'logo', title: '공부방' },
  primeTutor: { icon: '🏆', iconType: 'emoji', title: '프라임 과외쌤' },
  pickTutor: { icon: '⭐', iconType: 'emoji', title: '픽 과외쌤' },
  basicTutor: { icon: '/assets/brand/logo-wordmark.png', iconType: 'logo', title: '과외쌤' },
  students: { icon: '/assets/brand/logo-wordmark.png', iconType: 'logo', title: '학생' },
};

/**
 * 제목 우측 현재위치 — '현재위치' 작은글씨 + 지역명 일반크기
 * @param {string} [locationLabel]
 */
export function renderLocationBesideTitle(locationLabel) {
  const loc = String(locationLabel || '').trim();
  if (!loc) return '';
  // "서울 강남구 대치동" → 표시는 전체, 라벨만 작게
  return `
    <span class="section-heading__loc" aria-label="현재위치 ${esc(loc)}">
      <span class="section-heading__loc-label">현재위치</span>
      <span class="section-heading__loc-value">${esc(loc)}</span>
    </span>`;
}

/**
 * @param {{
 *   icon: string,
 *   iconType?: 'emoji'|'logo',
 *   title: string,
 *   desc?: string,
 *   locationLabel?: string,
 *   id?: string,
 * }} cfg
 * - locationLabel: 제목 우측 현재위치 (권장)
 * - desc: 레거시 보조문구. 지역 문자열이면 locationLabel로 승격
 */
export function renderSectionHeading(cfg) {
  const iconHtml =
    cfg.iconType === 'logo'
      ? `<img class="section-heading__logo" src="${cfg.icon}" alt="" width="72" height="18" />`
      : `<span class="section-heading__emoji" aria-hidden="true">${cfg.icon}</span>`;

  const locFromDesc =
    !cfg.locationLabel && cfg.desc && !/[·|]/.test(cfg.desc) && !/Prime|Pick|Basic|블라인드|검색/.test(cfg.desc)
      ? cfg.desc
      : '';
  const locationLabel = cfg.locationLabel || locFromDesc;
  const locHtml = renderLocationBesideTitle(locationLabel);

  // 지역은 우측 현재위치로만 — 제목 아래/desc로 중복 출력하지 않음
  // 지역·보조문구는 제목 우측에만 — 제목 아래 위치 라벨 금지
  const descHtml =
    cfg.desc && cfg.desc !== locationLabel
      ? `<span class="section-heading__desc">${esc(cfg.desc)}</span>`
      : '';

  return `
    <header class="section-heading" ${cfg.id ? `id="${cfg.id}"` : ''}>
      ${iconHtml}
      <h2 class="section-heading__title">${esc(cfg.title)}</h2>
      ${locHtml}
      ${descHtml}
    </header>
  `;
}
