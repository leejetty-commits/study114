import { getMypagePath, getNavRole } from '../state.js';
import { isLoggedIn } from '../auth-session.js';
import { guardMypageAccess } from '../../../shared/route-access.js';
import { renderGuestLoginGatePanel, bindGuestGateLinks } from '../../../shared/guest-gate-ui.js';
import { renderPreviewToolbar, renderHeader, renderFooter, renderAppShellWithPromo } from '../layout.js';
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

function renderMypageLoginGate(message) {
  const role = 'guest';
  const panel = renderGuestLoginGatePanel({
    title: '마이페이지',
    lead: message,
    bullets: [
      '쪽지함·최근열람·찜·등록관리·계정설정은 로그인 후 이용합니다.',
      '비회원은 홈·찾기·고객센터·상품 안내까지 이용할 수 있습니다.',
    ],
    from: 'mypage',
    primaryLabel: '로그인하고 마이페이지 열기',
  });
  const mainHtml = `
    <div class="site-gate-wrap">
      ${panel}
      <p class="site-gate-wrap__foot">
        <a href="#/guest" class="btn btn--secondary" data-nav="/guest">홈으로</a>
      </p>
    </div>
  `;
  return renderAppShellWithPromo({
    toolbar: renderPreviewToolbar(),
    headerHtml: renderHeader(role),
    mainHtml,
    footerHtml: renderFooter(),
  });
}

/** @param {() => void} rerender */
export function renderMypage() {
  const gate = guardMypageAccess(isLoggedIn());
  if (!gate.ok) {
    return renderMypageLoginGate(gate.message);
  }

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
  const gate = guardMypageAccess(isLoggedIn());
  if (!gate.ok) {
    bindGuestGateLinks(root);
    root.querySelectorAll('[data-nav]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.hash = el.getAttribute('data-nav') || '/guest';
      });
    });
    return;
  }

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
