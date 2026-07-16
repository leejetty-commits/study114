/** 비회원 메인 섹션 타이틀 — 좌측 정렬 · 보조설명은 타이틀 옆 */

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
 * @param {{ icon: string, iconType?: 'emoji'|'logo', title: string, desc?: string, id?: string }} cfg
 */
export function renderSectionHeading(cfg) {
  const iconHtml =
    cfg.iconType === 'logo'
      ? `<img class="section-heading__logo" src="${cfg.icon}" alt="" width="72" height="18" />`
      : `<span class="section-heading__emoji" aria-hidden="true">${cfg.icon}</span>`;

  const descHtml = cfg.desc
    ? `<span class="section-heading__desc">${cfg.desc}</span>`
    : '';

  return `
    <header class="section-heading" ${cfg.id ? `id="${cfg.id}"` : ''}>
      ${iconHtml}
      <h2 class="section-heading__title">${cfg.title}</h2>
      ${descHtml}
    </header>
  `;
}
