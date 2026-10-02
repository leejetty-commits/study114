import { getLibraryPath } from '../state.js';
import { renderLibraryShell, bindLibraryShellEvents } from './library-shell.js';
import { renderLibraryScreen, bindLibraryScreenEvents } from './library-screens.js';
import { isInfoBoardPath } from './library-router.js';
import { renderInfoBoardScreen, bindInfoBoardEvents } from './info-board-screens.js';

export function renderLibrary() {
  const path = getLibraryPath();
  if (isInfoBoardPath(path)) return renderLibraryShell(path, renderInfoBoardScreen(path));
  return renderLibraryShell(path, renderLibraryScreen(path));
}

/** @param {HTMLElement} root @param {() => void} rerender */
export function bindLibraryEvents(root, rerender) {
  bindLibraryShellEvents(root, rerender);
  bindLibraryScreenEvents(root, rerender);
  const path = getLibraryPath();
  if (isInfoBoardPath(path)) bindInfoBoardEvents(root, rerender, path);
}

export { getDefaultLibraryPath } from './library-router.js';
