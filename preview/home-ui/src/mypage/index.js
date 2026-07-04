import { getMypagePath } from '../state.js';
import { renderMypageShell, bindMypageShellEvents } from './shell.js';
import { renderMypageScreen, bindMypageScreenEvents } from './screens.js';
import { ensureRecentDemo } from './recent-store.js';
import { ensureStudentStore, bindStudentRegEvents } from '../student-reg/index.js';
import { consumeStudentImportFromHash } from '../student-reg/store.js';
import { ensureDemoThreads } from '../messages/thread-store.js';
import { bindMessagesScreenEvents } from '../messages/screens.js';
import { bindMessagesProviderToolbar } from '../messages/shell.js';

/** @param {() => void} rerender */
export function renderMypage() {
  ensureRecentDemo();
  ensureStudentStore();
  consumeStudentImportFromHash();
  ensureDemoThreads();
  const path = getMypagePath();
  const body = renderMypageScreen(path);
  return renderMypageShell(path, body);
}

/** @param {HTMLElement} root @param {() => void} rerender */
export function bindMypageEvents(root, rerender) {
  bindMypageShellEvents(root, rerender);
  bindMypageScreenEvents(root, rerender);
  bindStudentRegEvents(root, rerender);
  bindMessagesScreenEvents(root, rerender);
  bindMessagesProviderToolbar(root, rerender);
}
