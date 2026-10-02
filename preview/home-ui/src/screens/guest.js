import { renderHomeShell, bindLayoutEvents } from '../layout.js';
import {
  renderGuestHero,
  renderGuestExposureBoxes,
  renderGuestBrowseLists,
  renderGuestLoginStrip,
  bindGuestSectionEvents,
} from '../guest-sections.js';
import { bindDetailDecisionEvents } from '../detail-decision/index.js';
import { isLoggedIn } from '../auth-session.js';
import { hydrateHomeBasicFromSearch, isHomeBasicLive } from '../home-basic-live.js';
import { withGuestPlanOverride } from '../plans/runtime-config.js';
import { restoreMyshopScrollAndFocusIfPending } from '../myshop/return-snapshot.js';
import { renderHomeMarketingBanner } from '../home-marketing-banner.js';
import { bindHomeNewsRow, renderHomeNewsRow } from '../home-news-row.js';
import { loadGuestBaseline, guestScopeFilters } from '../../../shared/location-display.js';

let homeBasicHydrateStarted = false;

/** 비로그인은 대치동(공부방)·서울시 강남구(과외쌤·학생) 기준 행으로만 부른다. 다른 지역으로 채우지 않는다. */
function hydrateHomeBasicForViewer() {
  if (isLoggedIn()) return hydrateHomeBasicFromSearch();
  return loadGuestBaseline().then(() =>
    hydrateHomeBasicFromSearch(
      {},
      {
        scope: {
          study_room: guestScopeFilters('room'),
          tutor: guestScopeFilters('tutor'),
          student: guestScopeFilters('student'),
        },
      },
    ),
  );
}

export function renderGuest() {
  const loggedIn = isLoggedIn();
  const content = withGuestPlanOverride(() => `
    ${renderHomeMarketingBanner('guest')}
    ${renderHomeNewsRow('guest')}
    ${renderGuestHero()}
    ${renderGuestExposureBoxes()}
    ${renderGuestBrowseLists()}
  `);

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
  bindDetailDecisionEvents(root, { onRerender: rerender, viewer: 'guest', sourceRoute: 'guest' });
  bindHomeNewsRow(root, { viewer: 'guest', onRerender: rerender, sourceRoute: 'guest' });

  restoreMyshopScrollAndFocusIfPending();

  if (!homeBasicHydrateStarted && !isHomeBasicLive()) {
    homeBasicHydrateStarted = true;
    hydrateHomeBasicForViewer().then(() => {
      rerender();
    });
  }
}
