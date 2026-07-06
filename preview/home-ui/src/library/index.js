import { getLibraryPath } from '../state.js';
import { renderLibraryShell, bindLibraryShellEvents } from './library-shell.js';
import { renderLibraryScreen, bindLibraryScreenEvents } from './library-screens.js';
import { parseLibraryPath } from './library-router.js';

export function renderLibrary() {
  const path = getLibraryPath();
  const { screenId } = parseLibraryPath(path);
  return renderLibraryShell(screenId, renderLibraryScreen(path));
}

/** @param {HTMLElement} root @param {() => void} rerender */
export function bindLibraryEvents(root, rerender) {
  bindLibraryShellEvents(root, rerender);
  bindLibraryScreenEvents(root, rerender);
}

export { getDefaultLibraryPath } from './library-router.js';
