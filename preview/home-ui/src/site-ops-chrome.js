/**
 * 환경설정 → 실제 화면 노출 (점검 배너 · 게스트 배너 · 예약 팝업)
 */
import {
  getActiveMaintenance,
  getActiveGuestBanner,
  listActivePopupsForSurface,
  dismissPopup,
} from './admin/site-settings-store.js';
import { getCurrentScreen, isAdminRoute, isMypageRoute, isMessagesRoute } from './state.js';

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
}

/**
 * @returns {'guest_home'|'search'|'mypage'|'all'|null}
 * null = 관리자 등 노출 안 함
 */
export function resolveOpsSurface() {
  if (isAdminRoute()) return null;

  const hash = (window.location.hash || '').slice(1);
  const path = (hash.startsWith('/') ? hash : `/${hash}`).split('?')[0] || '/guest';
  const screen = getCurrentScreen();

  if (path.startsWith('/mypage') || path.startsWith('/messages') || isMypageRoute() || isMessagesRoute()) {
    return 'mypage';
  }
  if (path === '/guest' || path === '/' || path === '' || screen === 'guest') {
    return 'guest_home';
  }
  // 역할 홈 = 찾기/검색 표면 (팝업 surface=search)
  if (
    path.startsWith('/search') ||
    path.includes('/search') ||
    screen === 'parent' ||
    screen === 'tutor' ||
    screen === 'studyRoom'
  ) {
    return 'search';
  }
  // 고객센터·정책·플랜·자료실 등 — surface=all 팝업 + 점검 배너
  return 'all';
}

function renderMaintenanceBanner(m) {
  const until = m.until ? ` · 종료 예정 ${esc(m.until)}` : '';
  return `
    <div class="ops-chrome__maintenance" role="alert" data-ops-maintenance>
      <strong>점검 안내</strong>
      <span>${esc(m.message)}${until}</span>
    </div>`;
}

function renderGuestBanner(b) {
  return `
    <div class="ops-chrome__guest-banner" role="status" data-ops-guest-banner>
      ${esc(b.text)}
    </div>`;
}

function renderPopupLayer(popup) {
  const hours = Number(popup.dismissHours) || 24;
  return `
    <div class="ops-chrome__popup" role="dialog" aria-modal="true" aria-labelledby="ops-popup-title" data-ops-popup="${esc(popup.id)}">
      <div class="ops-chrome__popup-backdrop" data-ops-popup-dismiss="${esc(popup.id)}" data-ops-popup-hours="${hours}"></div>
      <div class="ops-chrome__popup-panel">
        <h2 id="ops-popup-title" class="ops-chrome__popup-title">${esc(popup.title)}</h2>
        <div class="ops-chrome__popup-body">${esc(popup.body).replace(/\n/g, '<br>')}</div>
        <div class="ops-chrome__popup-actions">
          <button type="button" class="btn btn--secondary btn--sm" data-ops-popup-dismiss="${esc(popup.id)}" data-ops-popup-hours="${hours}">
            ${hours > 0 ? `${hours}시간 동안 다시 안 보기` : '닫기'}
          </button>
          <button type="button" class="btn btn--primary btn--sm" data-ops-popup-close="${esc(popup.id)}">확인</button>
        </div>
      </div>
    </div>`;
}

/**
 * @param {HTMLElement} appRoot
 */
export function mountOpsChrome(appRoot) {
  if (!appRoot) return;

  // 이전 마운트 제거
  appRoot.querySelectorAll('[data-ops-chrome]').forEach((el) => el.remove());

  const surface = resolveOpsSurface();
  if (surface === null) return;

  const maintenance = getActiveMaintenance();
  const guestBanner =
    surface === 'guest_home' || getCurrentScreen() === 'guest' ? getActiveGuestBanner() : null;
  const popups = listActivePopupsForSurface(surface);
  // surface=all 페이지에서도 all 팝업만; guest_home 전용은 guest에서만
  const showPopups = popups.slice(0, 1); // 한 번에 하나

  const bannerParts = [];
  if (maintenance) bannerParts.push(renderMaintenanceBanner(maintenance));
  if (guestBanner) bannerParts.push(renderGuestBanner(guestBanner));

  const wrap = document.createElement('div');
  wrap.setAttribute('data-ops-chrome', '1');
  wrap.className = 'ops-chrome';
  wrap.innerHTML = `
    ${bannerParts.length ? `<div class="ops-chrome__banners">${bannerParts.join('')}</div>` : ''}
    ${showPopups.map((p) => renderPopupLayer(p)).join('')}
  `;

  // 툴바 아래 · 본문 위
  const toolbar = appRoot.querySelector('.preview-toolbar');
  if (toolbar && toolbar.nextSibling) {
    appRoot.insertBefore(wrap, toolbar.nextSibling);
  } else if (toolbar) {
    toolbar.after(wrap);
  } else {
    appRoot.prepend(wrap);
  }

  wrap.querySelectorAll('[data-ops-popup-dismiss]').forEach((el) => {
    el.addEventListener('click', () => {
      const id = el.getAttribute('data-ops-popup-dismiss');
      const hours = Number(el.getAttribute('data-ops-popup-hours') || 24);
      if (!id) return;
      dismissPopup(id, hours);
      wrap.querySelector(`[data-ops-popup="${id.replace(/"/g, '')}"]`)?.remove();
    });
  });
  wrap.querySelectorAll('[data-ops-popup-close]').forEach((el) => {
    el.addEventListener('click', () => {
      const id = el.getAttribute('data-ops-popup-close');
      if (!id) return;
      wrap.querySelector(`[data-ops-popup="${id.replace(/"/g, '')}"]`)?.remove();
    });
  });
}
