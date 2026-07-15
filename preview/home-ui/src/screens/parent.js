import { previewState, setParentTab, resetParentFind } from '../state.js';
import {
  renderHomeShell,
  renderAdInline,
  bindLayoutEvents,
} from '../layout.js';
import { renderCompareBar, bindUserActionEvents } from '../user-actions-ui.js';
import { bindCompareEvents } from '../compare-modal.js';
import { bindDetailDecisionEvents } from '../detail-decision/index.js';
import {
  renderProviderHomeTabs,
  renderProviderHomeBody,
  bindProviderHomeTabEvents,
  getProviderHomeMode,
} from '../provider-home.js';
import { bindFindSurfaceEvents } from '@search-ui/search-find-surface.js';

export function renderParent() {
  const tab = previewState.parentTab;
  const content = `
    ${renderProviderHomeTabs('parent', tab, 'data-parent-tab')}
    ${renderProviderHomeBody('parent', tab, previewState.parentFind)}
    ${renderAdInline()}
    ${renderCompareBar()}
  `;
  return renderHomeShell('parent', content, { showAuth: false, showRoleSwitch: false });
}

export function bindParentEvents(root, rerender) {
  bindLayoutEvents(root, rerender);

  bindProviderHomeTabEvents(root, rerender, {
    role: 'parent',
    getTab: () => previewState.parentTab,
    setTab: setParentTab,
    resetFind: resetParentFind,
    tabAttr: 'data-parent-tab',
  });

  bindCompareEvents(root, true);
  bindUserActionEvents(root, rerender, { sourceRoute: 'parent' });

  bindFindSurfaceEvents(root, rerender, {
    getTab: () => getProviderHomeMode('parent', previewState.parentTab).searchTab,
    getState: () => previewState.parentFind,
    role: 'parent',
  });

  bindDetailDecisionEvents(root, {
    onRerender: rerender,
    viewer: 'parent',
    sourceRoute: 'parent',
    getStudentItem: (id) => previewState.parentFind.activeResultItems?.find((x) => x.id === id),
  });
}
