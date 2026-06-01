/** 비회원 메인 섹션 타이틀 — 좌측 정렬 · 보조설명은 타이틀 옆 */

export const SECTION_HEADINGS = {
  primeStudyRoom: { icon: '🏆', iconType: 'emoji', title: '프라임 공부방', desc: '대치동 · 설득형 상단 노출' },
  pickStudyRoom: { icon: '⭐', iconType: 'emoji', title: '픽 공부방', desc: '핵심 비교 · 고정 슬롯' },
  basicStudyRoom: { icon: '/assets/brand/logo-wordmark.png', iconType: 'logo', title: '공부방', desc: '리스트형 · 최근 등록순' },
  primeTutor: { icon: '🏆', iconType: 'emoji', title: '프라임 과외쌤', desc: '8장 설계 더미 · 상단 노출' },
  pickTutor: { icon: '⭐', iconType: 'emoji', title: '픽 과외쌤', desc: '경량 비교 · 고정 슬롯' },
  basicTutor: { icon: '/assets/brand/logo-wordmark.png', iconType: 'logo', title: '과외쌤', desc: '리스트형 · 최근 등록순' },
  students: { icon: '/assets/brand/logo-wordmark.png', iconType: 'logo', title: '학생', desc: '학습 의뢰 · 비교 대상 아님' },
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
