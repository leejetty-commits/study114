import { getMessagesPath } from '../state.js';
import { renderMessagesShell, bindMessagesShellEvents } from './shell.js';
import { renderMessagesScreen, bindMessagesScreenEvents } from './screens.js';
import { ensureDemoThreads } from './thread-store.js';

export function renderMessages() {
  ensureDemoThreads();
  const path = getMessagesPath();
  const body = renderMessagesScreen(path);
  return renderMessagesShell(path, body);
}

/** @param {HTMLElement} root @param {() => void} rerender */
export function bindMessagesEvents(root, rerender) {
  bindMessagesShellEvents(root, rerender);
  bindMessagesScreenEvents(root, rerender);
}

export { startFirstMemoFlow, showPaidGateOverlay } from './compose-flow.js';
export { getMessagesSummaryCounts } from './screens.js';
