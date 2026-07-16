import { renderHomeShell, bindLayoutEvents } from '../layout.js';
import {
  renderGuestTempNotice,
  renderGuestHero,
  renderGuestExposureBoxes,
  renderGuestBrowseLists,
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
    ${renderGuestExposureBoxes()}
    ${renderGuestAdInline()}
    ${renderGuestBrowseLists()}
  `;

  return renderHomeShell('guest', content, {
    showAuth: !loggedIn,
    showRoleSwitch: false,
    slotKey: 'home_right_rail',
    loginStrip: loggedIn ? '' : renderGuestLoginStrip(),
  });
}

export function bindGuestEvents(root, rerender) {
  bindLayoutEvents(root, rerender);
  bindGuestSectionEvents(root, rerender);
  bindDetailDecisionEvents(root, { onRerender: rerender, viewer: 'guest' });
}
