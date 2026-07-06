/**
 * 공부방찾기 — 지도형 첫 화면 (지도 → 검색 → 결과)
 * activeResultItems와 동일 집합 계약 (핀은 추후 API 연동)
 *
 * 후속 연결 계약 (API 미구현 단계):
 * - 핀: `[data-map-pin][data-provider-id][data-provider-kind="study_room"]`
 * - 카드: `[data-provider-id][data-provider-kind="study_room"]` (exposure-render)
 * - `data-map-item-id` = `data-provider-id` 별칭 (하위 호환)
 * - `bindSearchMapPinLinks`: 핀 클릭 → 카드 강조 · 카드 hover → 핀 강조
 * - 상세 열기: 카드 내 기존 상세 CTA/handoff 재사용 (핀 더블클릭 등은 API 단계에서)
 */

import { MOCK_REGIONS } from './search-schema.js';

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;');
}

const PIN_LAYOUT = [
  { top: '30%', left: '36%' },
  { top: '46%', left: '58%' },
  { top: '62%', left: '42%' },
  { top: '38%', left: '68%' },
  { top: '54%', left: '28%' },
  { top: '72%', left: '52%' },
  { top: '24%', left: '48%' },
  { top: '66%', left: '64%' },
];

/**
 * @param {object[]} [activeResultItems]
 * @param {{ searched?: boolean, regionLabel?: string, resultSource?: 'region'|'search'|null }} [options]
 */
export function renderSearchMapBlock(activeResultItems = [], options = {}) {
  const searched = options.searched === true;
  const region = options.regionLabel || MOCK_REGIONS.room;
  const dong = region.split('·')[0]?.trim() || region;
  const items = Array.isArray(activeResultItems) ? activeResultItems : [];
  const pinItems = items.slice(0, PIN_LAYOUT.length);
  const resultSource = options.resultSource || (searched ? 'search' : 'region');

  const pinsHtml = pinItems
    .map((item, i) => {
      const layout = PIN_LAYOUT[i];
      const id = item.id ?? '';
      const name = item.study_room_name || item.title || `공부방 ${id || i + 1}`;
      return `<button type="button" class="map-block__pin map-block__pin--sm map-block__pin--orange" style="top:${layout.top};left:${layout.left}" title="${esc(name)}" aria-label="${esc(name)}" data-map-pin data-map-pin-action="focus-card" data-provider-id="${esc(id)}" data-provider-kind="study_room" data-map-item-id="${esc(id)}"></button>`;
    })
    .join('');

  const countNote = items.length
    ? `${items.length}곳 · 하단 목록과 동일`
    : '표시할 공부방이 없습니다';

  return `
    <section class="hero-map hero-map--search" aria-label="공부방 지도" data-result-source="${esc(resultSource)}" data-result-items="activeResultItems">
      <aside class="hero-map__rail" aria-label="지역 요약">
        <p class="hero-map__eyebrow">우리동네</p>
        <h2 class="hero-map__dong">${esc(dong)}</h2>
        <p class="hero-map__sub">${esc(region)}</p>
        <p class="hero-map__hint">${searched ? '검색 결과 · ' : '내 지역 · '}${esc(countNote)}</p>
      </aside>
      <div class="hero-map__canvas">
        <div class="hero-map__surface" role="img" aria-label="${esc(region)} 공부방 지도" data-map-surface>
          <div class="map-block__grid" aria-hidden="true"></div>
          <span class="map-block__center-pin" title="${esc(dong)}"></span>
          ${pinsHtml}
          <span class="map-block__placeholder">[임시] 지도 API · ${esc(region)}</span>
        </div>
      </div>
    </section>`;
}

/** @param {HTMLElement} root */
export function bindSearchMapPinLinks(root) {
  const map = root.querySelector('.hero-map--search');
  if (!map) return;

  const clearFocus = () => {
    map.querySelectorAll('.is-map-focused').forEach((el) => el.classList.remove('is-map-focused'));
    root.querySelectorAll('.search-results [data-provider-id].is-map-focused').forEach((el) => {
      el.classList.remove('is-map-focused');
    });
  };

  map.querySelectorAll('[data-map-pin]').forEach((pin) => {
    pin.addEventListener('click', () => {
      const id = pin.getAttribute('data-provider-id') || pin.getAttribute('data-map-item-id');
      if (!id) return;
      clearFocus();
      pin.classList.add('is-map-focused');
      const card = root.querySelector(
        `.search-results [data-provider-id="${CSS.escape(id)}"][data-provider-kind="study_room"]`,
      );
      if (card) {
        card.classList.add('is-map-focused');
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  });

  root.querySelectorAll('.search-results [data-provider-kind="study_room"][data-provider-id]').forEach((card) => {
    card.addEventListener('mouseenter', () => {
      const id = card.getAttribute('data-provider-id');
      if (!id) return;
      const pin = map.querySelector(`[data-map-pin][data-provider-id="${CSS.escape(id)}"]`);
      pin?.classList.add('is-map-focused');
    });
    card.addEventListener('mouseleave', () => {
      const id = card.getAttribute('data-provider-id');
      if (!id) return;
      const pin = map.querySelector(`[data-map-pin][data-provider-id="${CSS.escape(id)}"]`);
      if (pin && !pin.classList.contains('is-map-focused')) {
        pin.classList.remove('is-map-focused');
      }
    });
  });
}
