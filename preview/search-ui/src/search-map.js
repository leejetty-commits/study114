/**
 * 공부방찾기 — 지도형 첫 화면 (지도 → 검색 → 결과)
 * activeResultItems와 동일 집합 · 네이버 지도 1차 연동
 *
 * 계약:
 * - 핀/카드: `[data-provider-id][data-provider-kind="study_room"]`
 * - `bindSearchMapPinLinks`: 핀 클릭 → 카드 강조 · 카드 hover → 핀 강조
 */

import { MOCK_REGIONS } from './search-schema.js';
import { bindStudyRoomMapSection } from '../../shared/naver-map.js';

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;');
}

/**
 * @param {object[]} [activeResultItems]
 * @param {{ searched?: boolean, regionLabel?: string, resultSource?: 'region'|'search'|null }} [options]
 */
export function renderSearchMapBlock(activeResultItems = [], options = {}) {
  const searched = options.searched === true;
  const region = options.regionLabel || MOCK_REGIONS.room;
  const dong = region.split('·')[0]?.trim() || region;
  const items = Array.isArray(activeResultItems) ? activeResultItems : [];
  const resultSource = options.resultSource || (searched ? 'search' : 'region');

  const countNote = items.length
    ? `${items.length}곳 · 하단 목록과 동일`
    : '표시할 공부방이 없습니다';

  return `
    <section class="hero-map hero-map--search" aria-label="공부방 지도" data-study-room-map data-map-variant="search" data-region-label="${esc(region)}" data-result-source="${esc(resultSource)}" data-result-items="activeResultItems">
      <aside class="hero-map__rail" aria-label="지역 요약">
        <p class="hero-map__eyebrow">우리동네</p>
        <h2 class="hero-map__dong">${esc(dong)}</h2>
        <p class="hero-map__sub">${esc(region)}</p>
        <p class="hero-map__hint">${searched ? '검색 결과 · ' : '내 지역 · '}${esc(countNote)}</p>
      </aside>
      <div class="hero-map__canvas">
        <div class="hero-map__surface hero-map__surface--naver" aria-label="${esc(region)} 공부방 지도">
          <div class="naver-map-mount-host" data-naver-map-mount></div>
        </div>
      </div>
    </section>`;
}

/**
 * @param {HTMLElement} root
 * @param {object[]} [activeResultItems]
 */
export function bindSearchMapPinLinks(root, activeResultItems = []) {
  const map = root.querySelector('.hero-map--search');
  if (!map) return;

  const clearFocus = () => {
    map.querySelectorAll('.is-map-focused').forEach((el) => el.classList.remove('is-map-focused'));
    root.querySelectorAll('.search-results [data-provider-id].is-map-focused').forEach((el) => {
      el.classList.remove('is-map-focused');
    });
  };

  const focusCard = (id) => {
    if (!id) return;
    clearFocus();
    const card = root.querySelector(
      `.search-results [data-provider-id="${CSS.escape(id)}"][data-provider-kind="study_room"]`,
    );
    if (card) {
      card.classList.add('is-map-focused');
      card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  bindStudyRoomMapSection(root, activeResultItems, {
    onPinClick: (id) => {
      focusCard(id);
    },
  }).then((controller) => {
    if (!controller) return;

    root.querySelectorAll('.search-results [data-provider-kind="study_room"][data-provider-id]').forEach((card) => {
      card.addEventListener('mouseenter', () => {
        const id = card.getAttribute('data-provider-id');
        if (!id) return;
        controller.focusPin(id);
      });
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-provider-id');
        if (!id) return;
        controller.focusPin(id);
      });
    });
  });
}
