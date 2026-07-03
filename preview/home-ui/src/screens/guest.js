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
import { bindStudentDetailEvents } from '../student-detail-modal.js';

export function renderGuest() {
  const content = `
    ${renderGuestTempNotice()}
    ${renderGuestHero()}
    ${renderGuestAdInline()}
    ${renderGuestExposureBoxes()}
    ${renderGuestBrowseLists()}
  `;

  return renderHomeShell('guest', content, {
    showAuth: true,
    sidebarHtml: renderGuestAdSidebar(),
    loginStrip: renderGuestLoginStrip(),
  });
}

export function bindGuestEvents(root, rerender) {
  bindLayoutEvents(root, rerender);
  bindGuestSectionEvents(root, rerender);
  bindStudentDetailEvents(root, { onRerender: rerender });
}
