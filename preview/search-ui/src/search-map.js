/**
 * 공부방찾기 — 지도형 첫 화면 (지도 → 검색 → 결과)
 * 비로그인: 게스트 홈 hero-map 과 동일 구성
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

/** @param {string} regionLabel */
function parseRegionParts(regionLabel) {
  const raw = String(regionLabel || '').trim();
  const parts = raw.split(/\s+/).filter(Boolean);
  if (parts.length >= 3) {
    return { city: parts[0], gu: parts[1], dong: parts.slice(2).join(' '), full: raw };
  }
  if (parts.length === 2) {
    return { city: parts[0], gu: parts[1], dong: parts[1], full: raw };
  }
  return { city: '', gu: '', dong: raw || '우리동네', full: raw };
}

/**
 * @param {object[]} [activeResultItems]
 * @param {{ searched?: boolean, regionLabel?: string, resultSource?: 'region'|'search'|null, guestHomeStyle?: boolean }} [options]
 */
export function renderSearchMapBlock(activeResultItems = [], options = {}) {
  const searched = options.searched === true;
  const region = options.regionLabel || MOCK_REGIONS.room;
  const parts = parseRegionParts(region);
  const items = Array.isArray(activeResultItems) ? activeResultItems : [];
  const resultSource = options.resultSource || (searched ? 'search' : 'region');
  const guestHomeStyle = options.guestHomeStyle !== false;

  const countNote = items.length
    ? `${items.length}곳 · 하단 목록과 동일`
    : '표시할 공부방이 없습니다';

  // 게스트 홈 hero-map 과 동일 레일 구조 (dong 히어로 + sub + stats)
  if (guestHomeStyle) {
    const sub = [parts.gu, '공부방·과외쌤을 한눈에 비교하세요'].filter(Boolean).join(' · ');
    return `
    <section class="hero-map" aria-label="공부방 지도" data-study-room-map data-map-variant="hero" data-region-label="${esc(region)}" data-result-source="${esc(resultSource)}" data-result-items="activeResultItems" data-allow-fallback="true">
      <aside class="hero-map__rail" aria-label="지역 요약">
        <h2 class="hero-map__dong">${esc(parts.dong)}</h2>
        <p class="hero-map__sub">${esc(sub)}</p>
        <dl class="hero-map__stats">
          <div><dt>목록</dt><dd>${items.length}</dd></div>
          <div><dt>상태</dt><dd>${searched ? '검색' : '지역'}</dd></div>
        </dl>
        <p class="hero-map__hint">${esc(countNote)}</p>
      </aside>
      <div class="hero-map__canvas">
        <div class="hero-map__surface hero-map__surface--naver" aria-label="${esc(region)} 공부방 지도">
          <div class="naver-map-mount-host" data-naver-map-mount></div>
        </div>
      </div>
    </section>`;
  }

  return `
    <section class="hero-map hero-map--search" aria-label="공부방 지도" data-study-room-map data-map-variant="search" data-region-label="${esc(region)}" data-result-source="${esc(resultSource)}" data-result-items="activeResultItems">
      <aside class="hero-map__rail" aria-label="지역 요약">
        <p class="hero-map__eyebrow">우리동네</p>
        <h2 class="hero-map__dong">${esc(parts.dong)}</h2>
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
  const map = root.querySelector('[data-study-room-map]');
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
