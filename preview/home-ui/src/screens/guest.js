import { renderHomeShell, bindLayoutEvents } from '../layout.js';
import {
  renderGuestTempNotice,
  renderGuestHero,
  renderGuestExposureBoxes,
  renderGuestBrowseLists,
  renderGuestAdSidebar,
  renderGuestAdInline,
  renderGuestLoginStrip,
  bindGuestSectionEvents,
} from '../guest-sections.js';
import { bindDetailDecisionEvents } from '../detail-decision/index.js';
import { isLoggedIn } from '../auth-session.js';

export function renderGuest() {
  const loggedIn = isLoggedIn();
  const content = `
    ${renderGuestTempNotice()}
    ${renderGuestHero()}
    ${renderGuestAdInline()}
    ${renderGuestExposureBoxes()}
    ${renderGuestBrowseLists()}
  `;

  return renderHomeShell('guest', content, {
    showAuth: !loggedIn,
    showRoleSwitch: loggedIn,
    sidebarHtml: renderGuestAdSidebar(),
    loginStrip: loggedIn ? '' : renderGuestLoginStrip(),
  });
}

export function bindGuestEvents(root, rerender) {
  bindLayoutEvents(root, rerender);
  bindGuestSectionEvents(root, rerender);
  bindDetailDecisionEvents(root, { onRerender: rerender, viewer: 'guest' });
}
