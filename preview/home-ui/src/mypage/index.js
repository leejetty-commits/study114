import { getMypagePath, getNavRole } from '../state.js';
import { renderMypageShell, bindMypageShellEvents } from './shell.js';
import { renderMypageScreen, bindMypageScreenEvents } from './screens.js';
import { ensureRecentDemo } from './recent-store.js';
import { ensureWishlistDemo } from '../user-actions-state.js';
import { ensureStudentReviewDemo } from '../student-review-store.js';
import { bindStudentReviewEvents } from '../student-review-ui.js';
import { ensureStudentStore, bindStudentRegEvents } from '../student-reg/index.js';
import { consumeStudentImportFromHash } from '../student-reg/store.js';
import { ensureStudyRoomStore, bindStudyRoomRegEvents } from '../study-room-reg/index.js';
import { ensureTutorStore, bindTutorRegEvents } from '../tutor-reg/index.js';
import { ensureDemoThreads } from '../messages/thread-store.js';
import { bindMessagesScreenEvents } from '../messages/screens.js';
import { bindMessagesProviderToolbar } from '../messages/shell.js';
import { bindSubmissionBoardEvents, ensureSubmissionBoardSeed } from '../submission-board/index.js';

/** @param {() => void} rerender */
export function renderMypage() {
  ensureRecentDemo();
  ensureWishlistDemo();
  ensureStudentReviewDemo();
  ensureStudentStore();
  ensureStudyRoomStore();
  ensureTutorStore();
  consumeStudentImportFromHash();
  ensureDemoThreads();
  ensureSubmissionBoardSeed(getNavRole() === 'guest' ? 'tutor' : getNavRole());
  const path = getMypagePath();
  const body = renderMypageScreen(path);
  return renderMypageShell(path, body);
}

/** @param {HTMLElement} root @param {() => void} rerender */
export function bindMypageEvents(root, rerender) {
  bindMypageShellEvents(root, rerender);
  bindMypageScreenEvents(root, rerender);
  const path = getMypagePath();
  const sourceRoute = path === '/mypage/student-review' ? 'student-review' : 'mypage';
  bindStudentReviewEvents(root, rerender, { sourceRoute });
  bindStudentRegEvents(root, rerender);
  bindStudyRoomRegEvents(root, rerender);
  bindTutorRegEvents(root, rerender);
  bindMessagesScreenEvents(root, rerender);
  bindMessagesProviderToolbar(root, rerender);
  bindSubmissionBoardEvents(root, rerender);
}
