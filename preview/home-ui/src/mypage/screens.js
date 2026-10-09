import {
  LIFECYCLE_FOOTNOTE_SUBMISSION,
  SUBMISSION_DOCS_LEAD,
  TRUST_PLATFORM_DISCLAIMER,
} from '../lifecycle-copy.js';
import { TUTOR_REGISTER_URL, navRoleFromAuthUser, roleHomeHashPath } from '../nav-config.js';
import { getNavRole, getMypagePath } from '../state.js';
import { isStudyRoomAuth } from '../auth-role.js';
import {
  getPreviewProfile,
  getSubmissionDocs,
  submissionDocStatusLabel,
  submissionDocVisibilityLabel,
  formatSubmissionDocSummary,
} from './preview-data.js';
import {
  accountRegionPresentation,
  ensureAccountRegionLabel,
  paintAccountRegionLabel,
} from './account-region-label.js';
import { getRecentViews } from './recent-store.js';
import { getStudentReviewItems, removeStudentReview } from '../student-review-store.js';
import { getHandoffFromQuery } from '../handoff-link.js';
import { HANDOFF_DEEPLINK } from '../handoff-copy.js';
import { STUDENT_REVIEW, studentReviewItemLabel } from '../handoff-copy.js';
import { fetchMypageReviewSnapshot, reviewsArchivePath } from '../provider-reviews/store.js';
import { REVIEW_ORIGIN_LABELS, reviewSnippet } from '../provider-reviews/copy.js';
import {
  renderBasketLifecycleBadge,
  isBasketLifecycleMuted,
  resolveBasketItem,
} from '../handoff-lifecycle.js';
import { renderResumeToken } from '../handoff-resume.js';
import { renderDecisionStickers } from '../handoff-sticker.js';
import { openDetailDecision } from '../detail-decision/index.js';
import { startFirstMemoFlow } from '../messages/compose-flow.js';
import { exposureStatusLabel } from '../lifecycle-copy.js';
import {
  getWishlistEntries,
  removeWishlist,
  addCompareFromWishlist,
} from '../user-actions-state.js';
import { isHandoffApiMode, refreshFavorites } from '../handoff-backend.js';
import { renderBasicRow } from '../exposure-render.js';
import { bindUserActionEvents } from '../user-actions-ui.js';
import { COMPARE_MAX } from '../exposure-schema.js';
import { notifyCompareToggle } from '../handoff-utils.js';
import { renderEmptyStateCard } from '../empty-state-copy.js';
import { renderMessagesScreen } from '../messages/screens.js';
import { isMessagesDetailPath, MESSAGES_BASE, threadPath } from '../messages/router.js';
import { isStudentRegPath } from '../student-reg/router.js';
import { renderStudentRegScreen, renderStudentCountHalt } from '../student-reg/screens.js';
import { isStudyRoomRegPath } from '../study-room-reg/router.js';
import { renderStudyRoomRegScreen } from '../study-room-reg/screens.js';
import {
  getStudyRoomEntryPath,
  getTutorEntryPath,
  getParentStudentProfilePath,
  getDefaultMypagePath,
  isParentLockedMypagePath,
  CONTACT_HISTORY_PATH,
} from './router.js';
import { isTutorRegPath } from '../tutor-reg/router.js';
import { setAuthDisplayName, logout, getAuthUser } from '../auth-session.js';
import {
  formatLoginAccountLabel,
  isInternalAuthEmail,
  resolveAccountDisplayName,
} from '../auth/display-identity.js';
import { renderTutorRegScreen } from '../tutor-reg/screens.js';
import { renderSubmissionBoardScreen } from '../submission-board/index.js';
import { P18_EXPOSURE_STATUS } from './plans-catalog.js';
import { getPaidOperationalStatus, hydratePaidCaches } from '../paid-backend.js';
import { isMessagesApiMode, hydrateMessagesCache } from '../messages-backend.js';
import { isSupportApiMode, hydrateMyTickets, getTicketLoadError } from '../support/support-backend.js';
import { listMyTickets } from '../support/ticket-store.js';
import { TICKET_CATEGORIES, TICKET_STATUS_LABELS } from '../support/support-copy.js';
import { getMemoUsedTargets } from '../messages/thread-store.js';
import { getStudyRoom, getStudyRooms } from '../study-room-reg/store.js';
import { getTutor, getTutors } from '../tutor-reg/store.js';
import { getPlanSetting, hydratePaidCatalog } from '../plans/runtime-config.js';
import { hydrateProviderNotices, renderProviderNoticeBanners, bindProviderNoticeEvents } from '../provider-notices.js';
import { renderPaidGuide, renderPaidUsage } from './paid-screens.js';
import { renderPlansHistory, schedulePlansStatusHydrate, resetPlansStatusSync, plansStatusFlags } from '../plans/screens.js';
import { parsePlansQuery } from '../plans/router.js';
import { getPlansEffectiveRole, resolveSelectedProfile } from '../plans/profiles.js';
import { getHistoryRows, loadHistoryRows } from '../plans/history-mock.js';
import { bindPaidCatalogEvents } from '../paid-checkout.js';
import { PASSWORD_RULE_HINT, validatePassword } from '../../../shared/password-policy.js';
import { bindInputFill, refreshInputFill } from '../../../shared/input-fill.js';
import {
  EMPTY_ONBOARDING,
  GUARDIAN_PLANS_COPY,
  WISHLIST_NOTE,
  WISHLIST_CARD_UNAVAILABLE,
  WISHLIST_CARD_UNKNOWN,
  REGISTRATIONS_LEAD,
  CONTACT_HISTORY_COPY,
} from './mypage-copy.js';

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

function roleLabel(role) {
  const map = { parent: '학생(학부모)', study_room: '공부방', tutor: '과외쌤' };
  return map[role] || role;
}

/** @returns {'parent'|'study_room'|'tutor'|''} */
function sessionMypageRole() {
  const sessionRole = navRoleFromAuthUser(getAuthUser());
  if (sessionRole !== 'study_room' && sessionRole !== 'tutor' && sessionRole !== 'parent' && !isStudyRoomAuth()) {
    return '';
  }
  return sessionRole === 'study_room' || isStudyRoomAuth() ? 'study_room' : sessionRole;
}

/** @param {string} path */
export function renderMypageScreen(path) {
  const r = sessionMypageRole();
  if (!r) {
    const home = roleHomeHashPath(getAuthUser());
    queueMicrotask(() => {
      if ((window.location.hash.slice(1) || '').startsWith('/mypage')) window.location.replace(`#${home}`);
    });
    return '';
  }
  const profile = getPreviewProfile(r);

  if (path === '/mypage/home') {
    return renderMypageScreen(getDefaultMypagePath(r));
  }
  if (
    r === 'study_room' &&
    (path === '/mypage/home' ||
      path === '/mypage/registrations' ||
      path === '/mypage/registrations/students')
  ) {
    const entry = getStudyRoomEntryPath();
    const cur = (window.location.hash.slice(1) || '').split('?')[0];
    const p = cur.startsWith('/') ? cur : `/${cur}`;
    if (p !== entry) window.location.replace(`#${entry}`);
    if (isStudyRoomRegPath(entry)) return renderStudyRoomRegScreen(entry);
    return renderStudyRoomRegScreen('/mypage/registrations/study-rooms');
  }

  // 과외쌤: 홈·내 등록 중간페이지 → 마이프로필(hub) 직행
  if (r === 'tutor' && (path === '/mypage/home' || path === '/mypage/registrations')) {
    const entry = getTutorEntryPath();
    queueMicrotask(() => {
      if (window.location.hash === '#/mypage/home' || window.location.hash === '#/mypage/registrations') {
        window.location.replace(`#${entry}`);
      }
    });
    if (isTutorRegPath(entry)) return renderTutorRegScreen(entry);
    return renderTutorRegScreen('/mypage/registrations/tutors');
  }

  if (r === 'parent' && path === '/mypage/registrations') {
    const dest = getDefaultMypagePath('parent');
    if (dest !== path) return renderMypageScreen(dest);
  }

  if (r === 'parent' && isParentLockedMypagePath(path)) {
    const dest = getParentStudentProfilePath();
    if (!dest) return renderStudentCountHalt();
    queueMicrotask(() => {
      const hashPath = (window.location.hash.slice(1) || '').split('?')[0];
      const p = hashPath.startsWith('/') ? hashPath : `/${hashPath}`;
      if (isParentLockedMypagePath(p)) window.location.replace(`#${dest}`);
    });
    return renderStudentRegScreen(dest);
  }

  // 등록 화면은 자기 역할 것만. 주소로 다른 역할 등록 화면에 들어오면 내 등록으로 돌려보낸다.
  const studentReg = isStudentRegPath(path);
  const studyRoomReg = isStudyRoomRegPath(path);
  const tutorReg = isTutorRegPath(path);
  if (studentReg || studyRoomReg || tutorReg) {
    const own =
      (r === 'parent' && studentReg) || (r === 'study_room' && studyRoomReg) || (r === 'tutor' && tutorReg);
    if (!own) {
      const dest = getDefaultMypagePath(r);
      queueMicrotask(() => {
        const hashPath = (window.location.hash.slice(1) || '').split('?')[0];
        if (hashPath === path) window.location.replace(`#${dest}`);
      });
      return renderMypageScreen(dest);
    }
  }
  if (studentReg) return renderStudentRegScreen(path);
  if (studyRoomReg) return renderStudyRoomRegScreen(path);
  if (tutorReg) return renderTutorRegScreen(path);

  if (path === '/mypage/registrations') return renderRegistrationsIndex(r);
  if (path === '/mypage/wishlist') return renderWishlist();
  if (path === '/mypage/recent') return renderRecent(r);
  if (path === '/mypage/student-review') return renderStudentReview(r);
  if (path === CONTACT_HISTORY_PATH) return renderContactHistory();
  if (path === MESSAGES_BASE || isMessagesDetailPath(path)) return renderMessagesScreen(path);
  if (path === '/mypage/plans') return renderPlans(r);
  if (path === '/mypage/plans/my') return renderPlansMyInventory(r);
  if (path === '/mypage/plans/history') return renderPlansHistory();
  if (path === '/mypage/paid') return renderPaidGuide(r);
  if (path === '/mypage/paid/usage') return renderPaidUsage(r);
  if (path === '/mypage/submission-docs' || path === '/mypage/verification') return renderSubmissionDocs(r);
  if (path === '/mypage/submission-board' || path.startsWith('/mypage/submission-board/')) {
    if (r === 'study_room' || r === 'parent') return renderSubmissionDocs(r);
    return renderSubmissionBoardScreen(path);
  }
  if (path === '/mypage/account') return renderAccount(r, profile);
  const dest = getDefaultMypagePath(r);
  if (dest && dest !== path) return renderMypageScreen(dest);
  return renderRegistrationsIndex(r);
}

/** 쪽지·후기함 후기 요약. 마이페이지 첫 화면이 아니다. */
export async function hydrateMypageReviewPanel(root) {
  const box = root?.querySelector?.('[data-mypage-review-list]');
  if (!box) return;
  try {
    const snap = await fetchMypageReviewSnapshot();
    const items = snap.items || [];
    if (!items.length) {
      box.innerHTML = `<p class="mypage-muted">${
        snap.lane === 'received'
          ? '아직 받은 후기가 없습니다. 쪽지·후기함의 후기함에서 모아서 볼 수 있어요.'
          : '아직 남긴 후기가 없습니다. 카드의 후기 수에서 읽고, 자격이 되면 남길 수 있어요.'
      }</p>
      <p><a href="#${reviewsArchivePath()}" data-mypage-nav="${reviewsArchivePath()}">후기함 열기</a></p>`;
      return;
    }
    box.innerHTML = `
      <ul class="mypage-review-list">
        ${items
          .slice(0, 5)
          .map((r) => {
            const origin = REVIEW_ORIGIN_LABELS[r.review_origin_type] || '';
            const openKind = r.provider_type || '';
            const openId = r.provider_id || 1;
            return `<li class="mypage-review-list__item">
              <button type="button" class="mypage-review-list__open" data-mypage-open-review="${esc(openKind)}" data-id="${openId}">
                <strong>${esc(origin || '후기')}</strong>
                <span>${esc(reviewSnippet(r.review_body || r.snippet || ''))}</span>
              </button>
            </li>`;
          })
          .join('')}
      </ul>
      <p><a href="#${reviewsArchivePath()}" data-mypage-nav="${reviewsArchivePath()}">후기함에서 전체 보기</a></p>`;
    box.querySelectorAll('[data-mypage-open-review]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const kind = btn.getAttribute('data-mypage-open-review');
        const id = Number(btn.getAttribute('data-id'));
        if (kind !== 'study_room' && kind !== 'tutor') return;
        window.location.hash = reviewsArchivePath();
      });
    });
  } catch {
    box.innerHTML = `<p class="mypage-muted">후기 요약을 불러오지 못했습니다.</p>`;
  }
}

function renderRegistrationsIndex(role) {
  const links = [];
  if (role === 'parent') {
    links.push({ path: '/mypage/registrations/students', label: '학생', id: 'P15-03' });
  }
  if (role === 'study_room') {
    links.push({ path: '/mypage/registrations/study-rooms', label: '공부방', id: 'P15-04' });
  }
  if (role === 'tutor') {
    links.push({ path: '/mypage/registrations/tutors', label: '내 과외 프로필', id: 'P15-05' });
    links.push({ path: '/mypage/submission-docs', label: '제출자료 상태', id: 'P15-10' });
    links.push({ path: '/mypage/submission-board', label: '신뢰·증빙자료 제출', id: 'P23-04' });
  }

  const unique = [...new Map(links.map((l) => [l.path, l])).values()];

  return `
    <section class="mypage-panel">
      <p class="mypage-lead">${REGISTRATIONS_LEAD}</p>
      <div class="mypage-card-grid">
        ${unique
          .map(
            (l) => `
          <a href="#${l.path}" class="mypage-card mypage-card--wide" data-mypage-nav="${l.path}">
            <span class="mypage-card__label">${esc(l.label)}</span>
          </a>`,
          )
          .join('')}
      </div>
    </section>`;
}

/** @param {{ kind: 'study_room'|'tutor', id: number, status: string, item: object|null }} entry */
function renderWishlistEntry(entry) {
  const { kind, id, item, status } = entry;
  const removeBtn = `<button type="button" class="btn btn--secondary btn--sm" data-mypage-wish-remove data-kind="${kind}" data-id="${id}">찜 해제</button>`;
  if (status !== 'visible' || !item) {
    const copy = status === 'unavailable' ? WISHLIST_CARD_UNAVAILABLE : WISHLIST_CARD_UNKNOWN;
    return `
      <div class="mypage-wish-card is-muted" data-wish-status="${esc(status)}">
        <article class="expo-basic expo-card--empty" data-wish-unavailable="${kind}" data-id="${id}">
          <div class="expo-empty-prime">
            <p class="expo-empty-prime__title">${esc(copy)}</p>
          </div>
        </article>
        <div class="mypage-wish-card__foot">
          <div class="mypage-entity__actions">${removeBtn}</div>
        </div>
      </div>`;
  }
  const lifecycleBadge = renderBasketLifecycleBadge(kind, item);
  const stickers = renderDecisionStickers(kind, item.id);
  const muted = isBasketLifecycleMuted(item, kind);
  return `
    <div class="mypage-wish-card${muted ? ' is-muted' : ''}" data-wish-status="visible">
      ${renderBasicRow(kind, item, { guest: false, sourceRoute: 'wishlist' })}
      <div class="mypage-wish-card__foot">
        ${stickers}
        ${lifecycleBadge}
        <div class="mypage-entity__actions">
          <button type="button" class="btn btn--secondary btn--sm" data-mypage-wish-compare data-kind="${kind}" data-id="${id}">비교(≤${COMPARE_MAX})</button>
          ${removeBtn}
        </div>
      </div>
    </div>`;
}

function renderWishlistSection(kind, label) {
  const entries = getWishlistEntries(kind);
  if (!entries.length) {
    return renderEmptyStateCard('wishlist', {
      ctaHref: '#/mypage/recent',
      links: [
        {
          label: '최근 본 목록',
          href: '#/mypage/recent',
        },
      ],
    });
  }
  return `
    <div class="browse-list browse-list--table mypage-wish-cards" role="list" data-mypage-wishlist="${kind}" aria-label="찜한 ${esc(label)}">
      ${entries.map(renderWishlistEntry).join('')}
    </div>`;
}

let wishlistRefreshKey = '';
if (typeof window !== 'undefined') {
  window.addEventListener?.('hashchange', () => {
    wishlistRefreshKey = '';
  });
}

/** 카드가 없는 찜이 있으면 찜 목록을 한 번 다시 읽는다. 한 번 들어온 동안 같은 번호 묶음으로는 다시 부르지 않는다. */
function scheduleWishlistRefresh(rerender) {
  if (!isHandoffApiMode()) return;
  const unknown = ['study_room', 'tutor'].flatMap((kind) =>
    getWishlistEntries(kind)
      .filter((e) => e.status === 'unknown')
      .map((e) => `${kind}:${e.id}`),
  );
  if (!unknown.length) return;
  const key = unknown.sort().join(',');
  if (key === wishlistRefreshKey) return;
  wishlistRefreshKey = key;
  refreshFavorites()
    .then((changed) => {
      if (changed) rerender();
    })
    .catch((err) => console.warn('[mypage/wishlist] refresh failed', err));
}

/** 찜 카드 탭·상세 → 홈·찾기와 같은 확대카드. 마이샵은 확대카드 안 버튼으로만. */
function bindWishlistCardEvents(root, rerender) {
  root.querySelectorAll('[data-mypage-wishlist]').forEach((list) => {
    const kind = list.getAttribute('data-mypage-wishlist');
    if (kind !== 'study_room' && kind !== 'tutor') return;
    const open = (id) => {
      const entry = getWishlistEntries(kind).find((e) => e.id === id);
      if (!entry || entry.status !== 'visible' || !entry.item) return;
      openDetailDecision({ kind, id, item: entry.item, viewer: getNavRole(), onRerender: rerender, sourceRoute: 'wishlist' });
    };
    list.querySelectorAll('[data-provider-id][data-provider-kind]').forEach((article) => {
      article.classList.add('p24-card--clickable');
      article.addEventListener('click', (e) => {
        if (e.target?.closest?.('button, a, [data-action], .item-actions, .expo-compare-chip')) return;
        open(Number(article.getAttribute('data-provider-id')));
      });
    });
    bindUserActionEvents(list, rerender, { sourceRoute: 'wishlist' });
  });
}

function renderWishlist() {
  return `
    <section class="mypage-panel">
      <p class="mypage-note">${WISHLIST_NOTE}</p>
      <h2 class="mypage-subhead">공부방</h2>
      ${renderWishlistSection('study_room', '공부방')}
      <h2 class="mypage-subhead">과외쌤</h2>
      ${renderWishlistSection('tutor', '과외쌤')}
    </section>`;
}

function renderStudentReview(role) {
  if (role === 'parent') {
    return `<section class="mypage-panel mypage-empty">
      <p>학생 검토함은 공부방·과외쌤 전용입니다. 공부방·과외쌤은 찜한 공부방·과외쌤에 저장할 수 있어요.</p>
      <p><a href="#/mypage/wishlist" data-mypage-nav="/mypage/wishlist">찜한 공부방·과외쌤 보기</a></p>
    </section>`;
  }

  const items = getStudentReviewItems();
  const itemLabel = studentReviewItemLabel(role);
  const fromHandoff = getHandoffFromQuery();
  const fromBanner =
    fromHandoff === 'exposure'
      ? HANDOFF_DEEPLINK.reviewFromExposure
      : fromHandoff === 'access'
        ? HANDOFF_DEEPLINK.reviewFromAccess
        : null;

  if (!items.length) {
    return `
      <section class="mypage-panel mypage-panel--bare mypage-empty">
        ${fromBanner ? `<div class="handoff-deeplink-banner" role="status">${esc(fromBanner)}</div>` : ''}
        ${renderEmptyStateCard('studentReview')}
      </section>`;
  }

  return `
    <section class="mypage-panel mypage-panel--bare">
      ${fromBanner ? `<div class="handoff-deeplink-banner" role="status">${esc(fromBanner)}</div>` : ''}
      <ul class="mypage-entity-list">
        ${items
          .map((item) => {
            const meta = `${item.grade_level || '—'} · ${item.subject_label || '—'} · ${item.location_label || '—'}`;
            const lifecycleBadge = renderBasketLifecycleBadge('student', item);
            const stickers = renderDecisionStickers('student', item.id);
            const muted = isBasketLifecycleMuted(item, 'student');
            const roleBadge = !lifecycleBadge
              ? `<span class="mypage-badge">${esc(itemLabel)}</span>`
              : '';
            return `
          <li class="mypage-entity${muted ? ' is-muted' : ''}">
            <div>
              <strong>${esc(item.public_display_name || '학습 요청')}</strong>
              ${stickers}
              ${lifecycleBadge || roleBadge}
              <span class="mypage-muted">${esc(meta)} · ${new Date(item.savedAt).toLocaleString('ko-KR')}</span>
              ${muted ? `<span class="mypage-muted">${esc(exposureStatusLabel(item.exposure_status))}</span>` : ''}
            </div>
            <div class="mypage-entity__actions">
              <button type="button" class="btn btn--secondary btn--sm" data-mypage-review-detail data-student-id="${item.id}">상세</button>
              <button type="button" class="btn btn--secondary btn--sm" data-mypage-review-memo data-student-id="${item.id}"
                ${muted ? 'disabled title="공개 중지된 의뢰"' : ''}>쪽지</button>
              <button type="button" class="btn btn--secondary btn--sm" data-mypage-review-remove data-student-id="${item.id}">${STUDENT_REVIEW.removeCta}</button>
            </div>
          </li>`;
          })
          .join('')}
      </ul>
    </section>`;
}

function renderRecent(role) {
  const items = getRecentViews(role);
  if (!items.length) {
    return `
    <section class="mypage-panel mypage-panel--bare">
      ${renderEmptyStateCard('recent', {
        ctaHref: `#${getDefaultMypagePath(role)}`,
        links: [{ label: '내 등록', href: `#${getDefaultMypagePath(role)}` }],
      })}
    </section>`;
  }
  return `
    <section class="mypage-panel mypage-panel--bare">
      <ul class="mypage-entity-list">
        ${items
          .map((e) => {
            const item = resolveBasketItem(e);
            const lifecycleBadge = item ? renderBasketLifecycleBadge(e.kind, item) : '';
            const stickers = item ? renderDecisionStickers(e.kind, e.id) : '';
            const resumeToken = renderResumeToken(e.lastRoute, e.lastAction);
            const muted = item ? isBasketLifecycleMuted(item, e.kind) : false;
            const kindLabel =
              e.kind === 'study_room' ? '공부방' : e.kind === 'tutor' ? '과외쌤' : '학생';
            return `
          <li class="mypage-entity${muted ? ' is-muted' : ''}">
            <div>
              <strong>${esc(e.title)}</strong>
              ${stickers}
              ${lifecycleBadge}
              ${resumeToken}
              <span class="mypage-muted">${esc(kindLabel)} · ${new Date(e.viewedAt).toLocaleString('ko-KR')}</span>
            </div>
            <div class="mypage-entity__actions">
              <button type="button" class="btn btn--secondary btn--sm" data-mypage-recent-detail
                data-kind="${e.kind}" data-id="${e.id}" data-last-route="${esc(e.lastRoute || 'mypage')}">다시 보기</button>
            </div>
          </li>`;
          })
          .join('')}
      </ul>
    </section>`;
}

function formatContactDate(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw.slice(0, 16).replace('T', ' ');
  return d.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function contactTitle(body) {
  const text = String(body || '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) return '운영문의';
  return text.length > 48 ? `${text.slice(0, 48)}…` : text;
}

function contactCategoryLabel(value) {
  return TICKET_CATEGORIES.find((c) => c.value === value)?.label || value || '기타';
}

function contactLastActivity(ticket) {
  return ticket.lastActivityAt || ticket.adminRepliedAt || ticket.updatedAt || ticket.createdAt;
}

function renderContactHistory() {
  const tickets = listMyTickets();
  const copy = CONTACT_HISTORY_COPY;
  const header = `
    <div class="mypage-contact-head">
      <p class="mypage-lead">${esc(copy.lead)}</p>
      <a href="#${copy.newHref}" class="btn btn--secondary btn--sm" data-nav="${copy.newHref}">${esc(copy.newCta)}</a>
    </div>`;
  const footer = `
    <div class="mypage-contact-foot">
      <a href="#${copy.newHref}" class="btn btn--secondary btn--sm" data-nav="${copy.newHref}">${esc(copy.newCta)}</a>
    </div>`;

  const loadError = getTicketLoadError();
  if (!tickets.length && loadError) {
    return `
    <section class="mypage-panel mypage-panel--bare mypage-contact">
      ${header}
      <p class="mypage-lead" role="alert">${esc(loadError)}</p>
    </section>`;
  }

  if (!tickets.length) {
    return `
    <section class="mypage-panel mypage-panel--bare mypage-contact">
      ${header}
      ${renderEmptyStateCard('contactHistory', {
        ctaHref: `#${copy.newHref}`,
      })}
    </section>`;
  }

  const recentNote =
    tickets.some((t) => t.adminReplyText || t.status === 'in_progress' || t.status === 'closed')
      ? `<p class="mypage-contact-note" role="status">${esc(copy.recentNote)}</p>`
      : '';

  const items = tickets
    .map((ticket) => {
      const statusLabel = TICKET_STATUS_LABELS[ticket.status] || ticket.status;
      const hasReply = Boolean(String(ticket.adminReplyText || '').trim());
      const replyFlag = hasReply ? copy.replyYes : copy.replyNo;
      const lastAt = contactLastActivity(ticket);
      const replyAt = ticket.adminRepliedAt || '';
      return `
        <li>
          <details class="mypage-contact-item">
            <summary class="mypage-contact-item__summary">
              <div class="mypage-contact-item__main">
                <strong class="mypage-contact-item__title">${esc(contactTitle(ticket.body))}</strong>
                <span class="mypage-contact-item__meta">
                  <span>${esc(contactCategoryLabel(ticket.category))}</span>
                  <span>${esc(copy.receivedLabel)} ${esc(formatContactDate(ticket.createdAt))}</span>
                  <span>${esc(copy.updatedLabel)} ${esc(formatContactDate(lastAt))}</span>
                </span>
              </div>
              <span class="mypage-badge mypage-badge--contact-${esc(ticket.status)}">${esc(statusLabel)}</span>
              <span class="mypage-contact-item__flag">${esc(replyFlag)}</span>
            </summary>
            <div class="mypage-contact-item__body">
              <dl class="mypage-contact-facts">
                <div>
                  <dt>${esc(copy.typeLabel)}</dt>
                  <dd>${esc(contactCategoryLabel(ticket.category))}</dd>
                </div>
                <div>
                  <dt>${esc(copy.receivedLabel)}</dt>
                  <dd>${esc(formatContactDate(ticket.createdAt))}</dd>
                </div>
                <div>
                  <dt>${esc(copy.statusLabel)}</dt>
                  <dd>${esc(statusLabel)}</dd>
                </div>
                <div>
                  <dt>${esc(copy.updatedLabel)}</dt>
                  <dd>${esc(formatContactDate(lastAt))}</dd>
                </div>
              </dl>
              <p class="mypage-muted">${esc(copy.mineLabel)}</p>
              <p class="mypage-contact-item__text">${esc(ticket.body)}</p>
              <div class="mypage-contact-reply">
                <p class="mypage-contact-reply__label">${esc(copy.replyLabel)}</p>
                ${
                  hasReply
                    ? `<p class="mypage-contact-item__text">${esc(ticket.adminReplyText)}</p>${
                        replyAt
                          ? `<p class="mypage-contact-reply__time">${esc(formatContactDate(replyAt))}</p>`
                          : ''
                      }`
                    : `<p class="mypage-contact-reply__empty">${esc(copy.replyPending)}</p>`
                }
              </div>
            </div>
          </details>
        </li>`;
    })
    .join('');

  return `
    <section class="mypage-panel mypage-panel--bare mypage-contact">
      ${header}
      ${recentNote}
      <ul class="mypage-contact-list">${items}</ul>
      ${footer}
    </section>`;
}

function formatPlanDate(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  return raw.slice(0, 10);
}

function exposureKindLabel(sku) {
  const code = String(sku || '').toLowerCase();
  if (code.includes('prime')) return '프라임 노출';
  if (code.includes('pick')) return '픽 노출';
  if (code.includes('basic')) return '베이직 노출';
  return code ? `${String(sku).toUpperCase()} 노출` : '유료 노출';
}

function expiryAlertDays(position) {
  if (Array.isArray(position?.expiry_alert_days) && position.expiry_alert_days.length) {
    return position.expiry_alert_days.map(Number).filter((n) => Number.isFinite(n) && n > 0);
  }
  const sku = String(position?.sku || '').toLowerCase();
  const key = sku.includes('pick') ? 'pick_expire_alert_days' : 'prime_expire_alert_days';
  const fromSetting = getPlanSetting(key);
  if (Array.isArray(fromSetting) && fromSetting.length) {
    return fromSetting.map(Number).filter((n) => Number.isFinite(n) && n > 0);
  }
  return sku.includes('pick') ? [7, 1] : [7, 3, 1];
}

function renderExpiryGuide(position) {
  const daysLeft = Number(position?.days_left);
  const alerts = expiryAlertDays(position);
  const schedule = alerts.map((d) => `${d}일`).join('·');
  if (!Number.isFinite(daysLeft)) {
    return `<p>종료 ${esc(schedule)} 전에 메일·문자로 안내합니다. 만료되면 베이직 노출(무료광고)로 돌아갑니다.</p>`;
  }
  if (daysLeft <= 0) {
    return `<p>오늘 종료됩니다. 종료 후 베이직 노출(무료광고)로 돌아가며, 같은 조건으로 재구매할 수 있습니다.</p>`;
  }
  const hit = alerts.find((d) => daysLeft === d);
  if (hit != null) {
    return `<p>종료 ${hit}일 전 안내 대상입니다. 메일·문자로 발송됩니다. 만료되면 베이직 노출(무료광고)로 돌아갑니다.</p>`;
  }
  const upcoming = alerts.filter((d) => daysLeft > d);
  if (upcoming.length) {
    const next = Math.min(...upcoming);
    return `<p>종료 ${esc(schedule)} 전에 메일·문자로 안내합니다. 다음 안내는 종료 ${next}일 전입니다.</p>`;
  }
  return `<p>종료까지 ${daysLeft}일 남았습니다. 사전안내는 ${esc(schedule)} 전에 메일·문자로 발송됩니다. 만료되면 베이직 노출(무료광고)로 돌아갑니다.</p>`;
}

/** 공부방·과외쌤 필수 1번 홍보/활동 지역 — API region_label 우선, 없으면 해당 프로필 */
function getPrimaryPromoRegionLabel(role, position) {
  const fromApi = String(position?.region_label || '').trim();
  if (fromApi) return fromApi;
  const type = position?.provider_type || role;
  const id = Number(position?.provider_id || 0);
  if (type === 'tutor') {
    const tutor = (id ? getTutor(id) : null) || getTutors()[0];
    return tutor?.primary_region_label || tutor?.location_label || '미설정';
  }
  const room = (id ? getStudyRoom(id) : null) || getStudyRooms()[0];
  return room?.region_label || room?.location_label || '미설정';
}

function renderPaidExposureDetail(positions, role) {
  const rows = positions
    .map((p) => {
      const started = formatPlanDate(p.purchased_on || p.started_on || p.starts_at);
      const ends = formatPlanDate(p.ends_on || p.ends_at || p.end_exclusive_on);
      const left = Number(p.days_left);
      const leftText = Number.isFinite(left) ? ` · 남은 ${left}일` : '';
      const region = getPrimaryPromoRegionLabel(role, p);
      return `
        <li class="plans-exposure-item">
          <p><strong>${esc(exposureKindLabel(p.sku))}</strong></p>
          <p>노출 위치(필수 1번 지역): ${esc(region)}</p>
          <p>구매일 ${esc(started || '—')} · 종료일 ${esc(ends || '—')}${esc(leftText)}</p>
          ${renderExpiryGuide(p)}
        </li>`;
    })
    .join('');
  return `
    <ul class="plans-exposure-list">${rows}</ul>
    <div class="plans-renewal-note">
      <p>같은 조건으로 연장하거나 기간을 바꿔 재구매할 수 있습니다.</p>
      <a href="#/plans/positions" class="btn btn--secondary btn--sm" data-nav="/plans/positions">노출상품 재구매</a>
    </div>`;
}

function renderMemoUsedTargets() {
  const targets = getMemoUsedTargets();
  if (!targets.length) {
    return `<p class="mypage-muted">쪽지를 사용한 대상이 없습니다.</p>`;
  }
  return `
    <ul class="memo-used-list">
      ${targets
        .map((t) => {
          const href = threadPath(t.threadId);
          return `
        <li class="memo-used-item">
          <div>
            <strong>${esc(t.name)}</strong>
            ${t.contextLabel ? `<span class="mypage-muted">${esc(t.contextLabel)}</span>` : ''}
          </div>
          <a href="#${href}" class="mypage-badge mypage-badge--action" data-mypage-nav="${href}">쪽지상세</a>
        </li>`;
        })
        .join('')}
    </ul>`;
}

function renderPlans(role) {
  if (role === 'parent') {
    return `
      <section class="mypage-panel">
        <h2 class="mypage-subhead">이용 안내</h2>
        <div class="mypage-info-box">
          <p>학부모 계정은 공부방과 과외쌤을 찾고, 찜하고, 상담하는 기본 기능을 편하게 이용할 수 있어요.</p>
          <p class="mypage-muted">${GUARDIAN_PLANS_COPY.body}</p>
        </div>
        <a href="#/support/faq" class="btn btn--secondary" data-nav="/support/faq">이용 안내 보기</a>
      </section>`;
  }

  const ops = getPaidOperationalStatus();
  const exposure = ops?.exposure;
  const positions = exposure?.positions ?? [];
  const historyRows = (plansHistoryRows ?? getHistoryRows()).slice(0, 8);

  return `
    <div class="mypage-home">
      <section class="mypage-panel mypage-panel--bare mypage-usage-overview">
        ${renderProviderNoticeBanners()}
        <h3 class="mypage-subhead">이용중인 노출광고</h3>
        ${
          positions.length
            ? renderPaidExposureDetail(positions, role)
            : `<p class="mypage-muted">${esc(P18_EXPOSURE_STATUS.basic)}</p>`
        }
        <h3 class="mypage-subhead">쪽지 사용한 대상</h3>
        ${renderMemoUsedTargets()}
      </section>

      <section class="mypage-plans-history">
        <h2 class="mypage-subhead">결제 내역</h2>
        <div class="mypage-history-box">
          <table class="plans-table" aria-label="결제 내역">
            <thead><tr><th>상품</th><th>금액</th><th>일시</th><th>상태</th></tr></thead>
            <tbody>
              ${
                historyRows.length
                  ? historyRows
                      .map(
                        (r) => `
                <tr>
                  <td>${esc(r.productName)}</td>
                  <td>${Number(r.amountKrw || 0).toLocaleString('ko-KR')}원</td>
                  <td>${esc(String(r.paidAt || '').slice(0, 16).replace('T', ' '))}</td>
                  <td>${esc(r.status || '')}</td>
                </tr>`,
                      )
                      .join('')
                  : `<tr><td colspan="4" class="mypage-muted">결제 내역이 없습니다.</td></tr>`
              }
            </tbody>
          </table>
        </div>
      </section>
    </div>`;
}

/** #/mypage/plans/my — 프로필별 쪽지권 재고 (PR-B status 정본) */
function renderPlansMyInventory(role) {
  if (role === 'parent') {
    return renderPlans(role);
  }
  const query = parsePlansQuery();
  const plansRole = getPlansEffectiveRole();
  const profile =
    plansRole === 'tutor' || plansRole === 'study_room'
      ? resolveSelectedProfile(
          query.provider_id
            ? query
            : {
                provider_type: plansRole,
                provider_id:
                  plansRole === 'tutor'
                    ? String(getTutors()[0]?.id || '')
                    : String(getStudyRooms()[0]?.id || ''),
              },
          plansRole,
        )
      : null;
  const providerKey = plansRole === 'tutor' ? 'tutor' : 'study_room';
  const { syncReady, syncLoading, syncError, syncPending } = plansStatusFlags(profile);
  const ops = syncReady ? getPaidOperationalStatus() : null;
  const tickets = ops?.tickets;
  const allPacks = tickets?.memo?.packs ?? [];
  const packs = profile
    ? allPacks.filter(
        (p) => p.provider_type === providerKey && String(p.provider_id) === String(profile.id),
      )
    : [];

  return `
    <section class="mypage-panel">
      <p class="mypage-lead">내 쪽지권 · 상품</p>
      ${renderProviderNoticeBanners()}
      ${
        syncLoading || syncPending
          ? `<p class="mypage-info-box" data-plans-my-status="loading">쪽지권·상품 상태를 확인하는 중입니다.</p>`
          : ''
      }
      ${
        syncError
          ? `<p class="mypage-info-box" role="alert" data-plans-my-status="error">상품 상태를 불러오지 못했습니다. <button type="button" class="btn btn--secondary btn--sm" data-plans-my-retry>다시 시도</button></p>`
          : ''
      }
      ${
        !profile
          ? `<p class="mypage-muted">적용할 공부방·과외쌤 프로필을 선택하세요. · <a href="#/plans/access" data-nav="/plans/access">쪽지권</a></p>`
          : ''
      }
      <h2 class="mypage-subhead">쪽지권</h2>
      ${
        !syncReady
          ? `<p class="mypage-muted" data-plans-my-status="packs-pending">쪽지권 목록은 상태 확인 후 표시됩니다.</p>`
          : packs.length
            ? `<table class="plans-table" aria-label="쪽지권" data-plans-my-status="packs-ready">
              <thead><tr><th>프로필</th><th>상품</th><th>출처</th><th>부여</th><th>남은 횟수</th><th>부여일</th><th>사용기한</th><th>상태</th></tr></thead>
              <tbody>
                ${packs
                  .map(
                    (p) => `
                  <tr data-plans-pack-row data-plans-pack-grant="${esc(String(p.grant_label || ''))}" data-plans-pack-status="${esc(String(p.status || ''))}" data-plans-pack-granted="${esc(String(p.granted_count ?? ''))}" data-plans-pack-remaining="${esc(String(p.remaining ?? ''))}" data-plans-pack-provider="${esc(String(p.provider_id ?? ''))}">
                    <td>${esc(p.provider_type || '미확인')} #${esc(String(p.provider_id ?? ''))}</td>
                    <td>${esc(p.product_name || '')}</td>
                    <td>${esc(p.grant_label || '')}</td>
                    <td>${p.granted_count ?? '—'}</td>
                    <td>${p.remaining ?? '—'}</td>
                    <td>${esc(String(p.purchased_at || '').slice(0, 10))}</td>
                    <td data-plans-pack-expires>${esc(String(p.expires_at || '').slice(0, 10))}</td>
                    <td>${esc(p.status || '')}</td>
                  </tr>`,
                  )
                  .join('')}
              </tbody>
            </table>
            <p class="mypage-muted"><a href="#/plans/access" data-nav="/plans/access">쪽지권 충전하기</a></p>`
            : `<p class="mypage-muted" data-plans-my-status="packs-empty">이 프로필에 표시할 쪽지권이 없습니다. · <a href="#/plans/access" data-nav="/plans/access">쪽지권 충전하기</a></p>`
      }
      ${
        plansRole === 'study_room' && profile
          ? `<h2 class="mypage-subhead">Prime 예약대기</h2>
            <div class="plans-my-waitlist" data-plans-my-waitlist data-study-room-id="${esc(String(profile.id))}">
              <p class="mypage-muted">예약대기 목록을 불러오는 중…</p>
            </div>`
          : ''
      }
      <p class="mypage-note"><a href="#/mypage/plans" data-mypage-nav="/mypage/plans">이용 현황</a> · <a href="#/plans/access" data-nav="/plans/access">쪽지권 구매</a> · <a href="#/plans/positions" data-nav="/plans/positions">노출상품</a></p>
    </section>`;
}

function renderSubmissionDocs(role) {
  if (role === 'parent') {
    return `<section class="mypage-panel"><p class="mypage-muted">${EMPTY_ONBOARDING.submissionParent}</p></section>`;
  }

  if (role === 'study_room') {
    return `<section class="mypage-panel"><p class="mypage-muted">${EMPTY_ONBOARDING.submissionStudyRoom}</p></section>`;
  }

  const docs = getSubmissionDocs(role);
  return `
    <section class="mypage-panel p15-submission">
      <p class="mypage-lead">${esc(SUBMISSION_DOCS_LEAD)}</p>
      <div class="p15-submission__summary">
        ${docs.length ? `<span class="mypage-badge">${esc(formatSubmissionDocSummary(docs))}</span>` : ''}
        <a href="#/mypage/submission-board" class="btn btn--primary btn--sm" data-mypage-nav="/mypage/submission-board">신뢰·증빙자료 제출</a>
        <a href="${TUTOR_REGISTER_URL}" class="btn btn--secondary btn--sm" data-same-tab-href="${TUTOR_REGISTER_URL}">과외쌤 등록 화면에서 자료 등록</a>
      </div>
      ${docs.length ? `<table class="p15-submission__table" aria-label="제출자료 상태">
        <thead>
          <tr>
            <th scope="col">항목</th>
            <th scope="col">제출 상태</th>
            <th scope="col">공개 범위</th>
          </tr>
        </thead>
        <tbody>
          ${docs
            .map(
              (d) => `
            <tr>
              <td>${esc(d.label)}</td>
              <td><span class="p15-submission__status p15-submission__status--${esc(d.status)}">${esc(submissionDocStatusLabel(d.status))}</span></td>
              <td>${esc(submissionDocVisibilityLabel(d.visibility))}</td>
            </tr>`,
            )
            .join('')}
        </tbody>
      </table>` : ''}
      <p class="mypage-note">${esc(LIFECYCLE_FOOTNOTE_SUBMISSION)}</p>
      <p class="mypage-note p22-trust-disclaimer">${esc(TRUST_PLATFORM_DISCLAIMER)}</p>
    </section>`;
}

function renderAccount(role, profile) {
  const regionView = accountRegionPresentation(role);
  const authRole = profile.authRole === 'admin' ? '마스터 관리자' : roleLabel(role);
  const socialLabel =
    Array.isArray(profile.oauthProviderLabels) && profile.oauthProviderLabels.length
      ? profile.oauthProviderLabels.join(', ')
      : '없음(이메일 계정)';
  const loginRaw = profile.loginId || profile.email || '';
  const loginShown = formatLoginAccountLabel(loginRaw, { revealInternal: true });
  const loginNote = isInternalAuthEmail(loginRaw)
    ? '소셜 로그인용 내부 식별자입니다. 사이트에 보이는 이름이 아니며, 여기서 바꿀 수 없습니다.'
    : '로그인 식별자입니다. 이 값은 변경할 수 없습니다.';
  const displayValue = escAttr(profile.displayName || profile.name || '');
  const displayShown = esc(profile.displayName || profile.name || '미설정');
  const justSaved =
    typeof sessionStorage !== 'undefined' &&
    sessionStorage.getItem('study114.displayName.justSaved') === '1';
  if (justSaved) {
    try {
      sessionStorage.removeItem('study114.displayName.justSaved');
    } catch {
      /* ignore */
    }
  }

  return `
    <section class="account-settings">
      <header class="account-settings__hero">
        <p class="account-settings__eyebrow">사이트에 보이는 이름</p>
        <h2 class="account-settings__name" data-display-name-current>${displayShown}</h2>
        <p class="account-settings__lead">표시명·로그인·보안을 한곳에서 관리합니다.</p>
        ${
          justSaved
            ? '<p class="account-settings__toast" role="status">사이트 표시명이 저장되었습니다.</p>'
            : ''
        }
      </header>

      <article class="account-card">
        <div class="account-card__head">
          <h3 class="account-card__title">표시 정보</h3>
          <p class="account-card__desc">마이페이지·헤더에 보이는 이름입니다. 로그인 계정·소셜 연동은 그대로 유지됩니다.</p>
        </div>
        <div class="account-card__body">
          <div class="account-identity" data-display-name-summary>
            <div class="account-identity__row">
              <span class="account-identity__label">사이트 표시명</span>
              <strong class="account-identity__value" data-display-name-current>${displayShown}</strong>
            </div>
            <button type="button" class="btn btn--secondary btn--sm" data-action="toggle-display-name">표시명 수정</button>
          </div>
          <div class="account-identity-edit" data-display-name-edit hidden>
            <form data-form="change-display-name" class="account-form" autocomplete="off">
              <div class="form-group">
                <label class="form-label form-label--required" for="mypage-display-name">사이트 표시명</label>
                <input class="form-input" type="text" id="mypage-display-name" name="display_name" maxlength="50" required value="${displayValue}" />
                <p class="form-hint">예: 카카오 과외쌤, 종현 과외쌤 — 2~50자 · 이메일 형태 불가</p>
              </div>
              <p class="form-error" data-display-name-error hidden role="alert"></p>
              <div class="account-form__actions">
                <button type="submit" class="btn btn--primary btn--sm">표시명 저장</button>
                <button type="button" class="btn btn--ghost btn--sm" data-action="cancel-display-name">취소</button>
              </div>
            </form>
          </div>
        </div>
      </article>

      <article class="account-card">
        <div class="account-card__head">
          <h3 class="account-card__title">계정 정보</h3>
          <p class="account-card__desc">로그인·연동 요약입니다.</p>
        </div>
        <div class="account-card__body">
          <dl class="account-meta">
            <div class="account-meta__item">
              <dt>연동된 소셜</dt>
              <dd>${esc(socialLabel)}</dd>
            </div>
            <div class="account-meta__item">
              <dt>로그인 계정</dt>
              <dd>
                <code class="account-meta__code">${esc(loginShown)}</code>
                <span class="account-meta__hint">${esc(loginNote)}</span>
              </dd>
            </div>
            <div class="account-meta__item">
              <dt>대표 지역</dt>
              <dd data-account-region-label${regionView.pending ? ' data-pending="1"' : ''}>${esc(regionView.pending ? '' : regionView.text)}</dd>
            </div>
            <div class="account-meta__item">
              <dt>역할</dt>
              <dd>${esc(authRole)}</dd>
            </div>
          </dl>
        </div>
      </article>

      <article class="account-card account-card--session">
        <div class="account-card__head">
          <h3 class="account-card__title">로그인 관리</h3>
          <p class="account-card__desc">비밀번호 변경과 로그아웃을 처리합니다.</p>
        </div>
        <div class="account-card__body account-card__body--actions">
          <button type="button" class="btn btn--secondary btn--sm" data-action="toggle-password-change">비밀번호 변경</button>
          <button type="button" class="btn btn--secondary btn--sm" data-action="util-logout">로그아웃</button>
        </div>
        <div class="account-panel" data-password-change hidden>
          <h4 class="account-panel__title">비밀번호 변경</h4>
          <p class="account-panel__desc">현재 비밀번호 확인 후 새 비밀번호로 바꿉니다. 소셜로만 가입한 계정은 이메일 비밀번호가 없을 수 있습니다.</p>
          <form data-form="change-password" class="account-form" autocomplete="off">
            <div class="form-group">
              <label class="form-label form-label--required" for="mypage-pw-current">현재 비밀번호</label>
              <input class="form-input" type="password" id="mypage-pw-current" name="current_password" autocomplete="current-password" required />
            </div>
            <div class="form-group">
              <label class="form-label form-label--required" for="mypage-pw-new">새 비밀번호</label>
              <input class="form-input" type="password" id="mypage-pw-new" name="password" autocomplete="new-password" required />
            </div>
            <div class="form-group">
              <label class="form-label form-label--required" for="mypage-pw-confirm">새 비밀번호 확인</label>
              <input class="form-input" type="password" id="mypage-pw-confirm" name="password_confirm" autocomplete="new-password" required />
            </div>
            <p class="form-hint">${esc(PASSWORD_RULE_HINT)}</p>
            <p class="form-error" data-pw-change-error hidden role="alert"></p>
            <p class="form-success" data-pw-change-success hidden role="status"></p>
            <div class="account-form__actions">
              <button type="submit" class="btn btn--primary btn--sm">변경 저장</button>
              <button type="button" class="btn btn--ghost btn--sm" data-action="cancel-password-change">취소</button>
            </div>
          </form>
        </div>
      </article>

      <article class="account-card account-card--danger">
        <div class="account-card__head">
          <h3 class="account-card__title">회원탈퇴</h3>
          <p class="account-card__desc">탈퇴하면 로그인과 서비스 이용이 중단됩니다.</p>
        </div>
        <div class="account-card__body account-card__body--actions">
          <button type="button" class="btn btn--ghost btn--sm mypage-withdraw-trigger" data-action="toggle-withdraw">
            <span class="mypage-badge mypage-badge--danger">회원탈퇴</span>
          </button>
        </div>
        <div class="account-panel account-panel--danger" data-withdraw-panel hidden>
          <h4 class="account-panel__title">탈퇴 확인</h4>
          <p class="account-panel__desc">탈퇴하면 로그인할 수 없으며, 등록·쪽지·찜 등 이용이 중단됩니다. 운영·법령상 필요한 일부 기록은 일정 기간 보관될 수 있습니다.</p>
          <ul class="account-panel__list">
            <li>탈퇴 후 동일 계정으로 즉시 재가입·복구되지 않을 수 있습니다.</li>
            <li>진행 중인 문의·쪽지 대화는 더 이상 확인할 수 없습니다.</li>
            <li>유료 이용 중이라면 잔여 기간·횟수도 함께 종료됩니다.</li>
            <li>환불은 환불규정에 따라서 조치를 해 드립니다.</li>
          </ul>
          <form data-form="withdraw-account" class="account-form" autocomplete="off">
            <label class="account-check">
              <input type="checkbox" name="ack_irreversible" required />
              <span>위 안내를 확인했으며, 탈퇴가 되돌리기 어렵다는 점에 동의합니다.</span>
            </label>
            <div class="form-group">
              <label class="form-label form-label--required" for="mypage-withdraw-confirm">확인 문구</label>
              <input class="form-input" type="text" id="mypage-withdraw-confirm" name="confirm_text" placeholder="탈퇴합니다" required />
              <p class="form-hint">계속하려면 <strong>탈퇴합니다</strong>를 입력하세요.</p>
            </div>
            <p class="form-error" data-withdraw-error hidden role="alert"></p>
            <div class="account-form__actions">
              <button type="submit" class="btn btn--danger btn--sm">탈퇴 확정</button>
              <button type="button" class="btn btn--ghost btn--sm" data-action="cancel-withdraw">취소</button>
            </div>
          </form>
        </div>
      </article>
    </section>`;
}

function escAttr(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

/**
 * @param {HTMLElement} root
 */
function bindPasswordChangeEvents(root) {
  const panel = root.querySelector('[data-password-change]');
  const form = root.querySelector('[data-form="change-password"]');
  const errorEl = root.querySelector('[data-pw-change-error]');
  const successEl = root.querySelector('[data-pw-change-success]');
  bindInputFill(form);

  root.querySelector('[data-action="toggle-password-change"]')?.addEventListener('click', () => {
    if (!panel) return;
    panel.hidden = !panel.hidden;
    if (!panel.hidden) {
      form?.querySelector('#mypage-pw-current')?.focus();
    }
    if (errorEl) {
      errorEl.hidden = true;
      errorEl.textContent = '';
    }
    if (successEl) {
      successEl.hidden = true;
      successEl.textContent = '';
    }
  });

  root.querySelector('[data-action="cancel-password-change"]')?.addEventListener('click', () => {
    if (panel) panel.hidden = true;
    form?.reset();
    if (errorEl) {
      errorEl.hidden = true;
      errorEl.textContent = '';
    }
    if (successEl) {
      successEl.hidden = true;
      successEl.textContent = '';
    }
  });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (errorEl) {
      errorEl.hidden = true;
      errorEl.textContent = '';
    }
    if (successEl) {
      successEl.hidden = true;
      successEl.textContent = '';
    }

    const fd = new FormData(form);
    const currentPassword = String(fd.get('current_password') ?? '');
    const password = String(fd.get('password') ?? '');
    const passwordConfirm = String(fd.get('password_confirm') ?? '');

    const clientError = validatePassword(password, passwordConfirm, {
      email: '',
      name: '',
      phone: '',
    });
    if (clientError) {
      if (errorEl) {
        errorEl.hidden = false;
        errorEl.textContent = clientError;
      }
      return;
    }
    if (currentPassword === password) {
      if (errorEl) {
        errorEl.hidden = false;
        errorEl.textContent = '새 비밀번호는 현재 비밀번호와 달라야 합니다.';
      }
      return;
    }

    const submitBtn = form.querySelector('[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = '저장 중…';
    }

    try {
      const res = await fetch('/api/auth/password/change.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          current_password: currentPassword,
          password,
          password_confirm: passwordConfirm,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        throw new Error(data.message || `변경 실패 (HTTP ${res.status})`);
      }
      form.reset();
      if (successEl) {
        successEl.hidden = false;
        successEl.textContent = data.message || '비밀번호가 변경되었습니다.';
      }
    } catch (err) {
      if (errorEl) {
        errorEl.hidden = false;
        errorEl.textContent = err instanceof Error ? err.message : '변경에 실패했습니다.';
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = '변경 저장';
      }
    }
  });
}

/**
 * @param {HTMLElement} root
 * @param {() => void} [rerender]
 */
function bindDisplayNameEvents(root, rerender) {
  const editPanel = root.querySelector('[data-display-name-edit]');
  const form = root.querySelector('[data-form="change-display-name"]');
  const errorEl = root.querySelector('[data-display-name-error]');
  bindInputFill(form);

  const closeEdit = () => {
    if (editPanel) editPanel.hidden = true;
    form?.reset();
    if (errorEl) {
      errorEl.hidden = true;
      errorEl.textContent = '';
    }
  };

  root.querySelector('[data-action="toggle-display-name"]')?.addEventListener('click', () => {
    if (!editPanel) return;
    editPanel.hidden = !editPanel.hidden;
    if (!editPanel.hidden) {
      const input = form?.querySelector('#mypage-display-name');
      if (input instanceof HTMLInputElement) {
        input.value = String(
          root.querySelector('[data-display-name-current]')?.textContent || '',
        ).trim();
        refreshInputFill(input);
        input.focus();
        input.select();
      }
    }
    if (errorEl) {
      errorEl.hidden = true;
      errorEl.textContent = '';
    }
  });

  root.querySelector('[data-action="cancel-display-name"]')?.addEventListener('click', () => {
    closeEdit();
  });

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (errorEl) {
      errorEl.hidden = true;
      errorEl.textContent = '';
    }

    const fd = new FormData(form);
    const displayName = String(fd.get('display_name') ?? '').trim();
    if (displayName.length < 2) {
      if (errorEl) {
        errorEl.hidden = false;
        errorEl.textContent = '사이트 표시명은 2자 이상이어야 합니다.';
      }
      return;
    }

    const submitBtn = form.querySelector('[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = '저장 중…';
    }

    try {
      const res = await fetch('/api/auth/profile.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ display_name: displayName }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        throw new Error(data.message || `저장 실패 (HTTP ${res.status})`);
      }
      try {
        sessionStorage.setItem('study114.displayName.justSaved', '1');
      } catch {
        /* ignore */
      }
      setAuthDisplayName(data.name || displayName);
      closeEdit();
      if (typeof rerender === 'function') rerender();
    } catch (err) {
      if (errorEl) {
        errorEl.hidden = false;
        errorEl.textContent = err instanceof Error ? err.message : '저장에 실패했습니다.';
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = '표시명 저장';
      }
    }
  });
}

/**
 * @param {HTMLElement} root
 */
function bindWithdrawEvents(root) {
  const panel = root.querySelector('[data-withdraw-panel]');
  const form = root.querySelector('[data-form="withdraw-account"]');
  const errorEl = root.querySelector('[data-withdraw-error]');

  root.querySelector('[data-action="toggle-withdraw"]')?.addEventListener('click', () => {
    if (!panel) return;
    panel.hidden = !panel.hidden;
    if (!panel.hidden) {
      form?.querySelector('#mypage-withdraw-confirm')?.focus();
    }
    if (errorEl) {
      errorEl.hidden = true;
      errorEl.textContent = '';
    }
  });

  root.querySelector('[data-action="cancel-withdraw"]')?.addEventListener('click', () => {
    if (panel) panel.hidden = true;
    form?.reset();
    if (errorEl) {
      errorEl.hidden = true;
      errorEl.textContent = '';
    }
  });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const confirmText = String(fd.get('confirm_text') || '').trim();
    const ack = fd.get('ack_irreversible');
    if (!ack) {
      if (errorEl) {
        errorEl.hidden = false;
        errorEl.textContent = '안내 동의에 체크해 주세요.';
      }
      return;
    }
    if (confirmText !== '탈퇴합니다') {
      if (errorEl) {
        errorEl.hidden = false;
        errorEl.textContent = '확인 문구에 「탈퇴합니다」를 정확히 입력해 주세요.';
      }
      return;
    }
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = '처리 중…';
    }
    const ac = new AbortController();
    const timer = window.setTimeout(() => ac.abort(), 20000);
    try {
      const res = await fetch('/api/auth/withdraw.php', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm_text: confirmText }),
        signal: ac.signal,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        throw new Error(data.message || '탈퇴 처리에 실패했습니다.');
      }
      try {
        await Promise.race([
          logout(),
          new Promise((_, reject) => {
            window.setTimeout(() => reject(new Error('logout-timeout')), 5000);
          }),
        ]);
      } catch {
        /* 서버가 이미 세션을 지웠으면 무시하고 홈으로 나간다 */
      }
      try {
        sessionStorage.setItem('study114.withdraw.done', '1');
      } catch {
        /* ignore */
      }
      window.location.replace('/');
    } catch (err) {
      const aborted = err && typeof err === 'object' && 'name' in err && err.name === 'AbortError';
      if (errorEl) {
        errorEl.hidden = false;
        errorEl.textContent = aborted
          ? '탈퇴 요청이 시간 안에 끝나지 않았습니다. 새로고침 후 로그인 상태로 다시 확인해 주세요.'
          : err instanceof Error
            ? err.message
            : '탈퇴 처리에 실패했습니다.';
      }
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = '탈퇴 확정';
      }
    } finally {
      window.clearTimeout(timer);
    }
  });
}

let plansStatusHydrateAttempted = false;
/** @type {import('../plans/history-mock.js').HistoryRow[] | null} */
let plansHistoryRows = null;
let contactHistoryHydrateAttempted = false;

/** @param {HTMLElement} root @param {() => void} rerender */
export function bindMypageScreenEvents(root, rerender) {
  const path = getMypagePath();
  if (path === '/mypage/account') {
    const role = sessionMypageRole();
    if (role) {
      ensureAccountRegionLabel(role)
        .then(() => paintAccountRegionLabel(root, role))
        .catch(() => paintAccountRegionLabel(root, role));
    }
  }
  if (path === CONTACT_HISTORY_PATH && !contactHistoryHydrateAttempted && isSupportApiMode()) {
    contactHistoryHydrateAttempted = true;
    hydrateMyTickets()
      .then(() => rerender())
      .catch((err) => console.warn('[mypage/contact] hydrate failed', err));
  }
  if (path === '/mypage/plans/my') {
    const plansRole = getPlansEffectiveRole();
    const query = parsePlansQuery();
    const profile =
      plansRole === 'tutor' || plansRole === 'study_room'
        ? resolveSelectedProfile(
            {
              ...query,
              provider_type: query.provider_type || plansRole,
              provider_id: query.provider_id || (plansRole === 'tutor' ? String(getTutors()[0]?.id || '') : String(getStudyRooms()[0]?.id || '')),
            },
            plansRole,
          )
        : null;
    // URL에 provider가 없으면 기본 프로필로 hydrate (목록 표시용)
    const hydrateProfile =
      profile ||
      (plansRole === 'tutor' || plansRole === 'study_room'
        ? resolveSelectedProfile({}, plansRole)
        : null);
    schedulePlansStatusHydrate(hydrateProfile, rerender, path);
    root.querySelector('[data-plans-my-retry]')?.addEventListener('click', () => {
      resetPlansStatusSync();
      schedulePlansStatusHydrate(hydrateProfile, rerender, path);
    });
  }
  if (!plansStatusHydrateAttempted && path === '/mypage/plans') {
    plansStatusHydrateAttempted = true;
    const jobs = [
      hydratePaidCaches(),
      hydrateProviderNotices(),
      hydratePaidCatalog().catch((err) => console.warn('[mypage/plans] catalog hydrate failed', err)),
      loadHistoryRows().then((result) => {
        plansHistoryRows = result.rows;
      }),
    ];
    if (isMessagesApiMode()) jobs.push(hydrateMessagesCache());
    Promise.allSettled(jobs)
      .then(() => rerender())
      .catch((err) => console.warn('[mypage/plans] hydrate failed', err));
  }
  bindPasswordChangeEvents(root);
  bindDisplayNameEvents(root, rerender);
  bindWithdrawEvents(root);
  if (path === '/mypage/wishlist') {
    bindWishlistCardEvents(root, rerender);
    scheduleWishlistRefresh(rerender);
  }
  root.querySelectorAll('[data-mypage-wish-remove]').forEach((btn) => {
    btn.addEventListener('click', () => {
      removeWishlist(btn.dataset.kind, btn.dataset.id);
      rerender();
    });
  });
  root.querySelectorAll('[data-mypage-review-remove]').forEach((btn) => {
    btn.addEventListener('click', () => {
      removeStudentReview(btn.dataset.studentId);
      rerender();
    });
  });
  root.querySelectorAll('[data-mypage-review-detail]').forEach((btn) => {
    btn.addEventListener('click', () => {
      openDetailDecision({
        kind: 'student',
        id: Number(btn.dataset.studentId),
        viewer: getNavRole(),
        onRerender: rerender,
        sourceRoute: 'mypage',
      });
    });
  });
  root.querySelectorAll('[data-mypage-review-memo]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = getStudentReviewItems().find((s) => s.id === Number(btn.dataset.studentId));
      if (!item || item.exposure_status !== 'published') return;
      startFirstMemoFlow({
        kind: 'student',
        targetId: item.id,
        targetName: item.public_display_name || '학습 요청',
        student: item,
        structuredLine: `${item.grade_level || '—'} · ${item.subject_label || '—'} · ${item.location_label || '—'}`,
      });
    });
  });
  root.querySelectorAll('[data-mypage-recent-detail]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const kind = btn.dataset.kind;
      if (kind !== 'study_room' && kind !== 'tutor' && kind !== 'student') return;
      openDetailDecision({
        kind,
        id: Number(btn.dataset.id),
        viewer: getNavRole(),
        onRerender: rerender,
        sourceRoute: btn.dataset.lastRoute || 'mypage',
      });
    });
  });
  root.querySelectorAll('[data-mypage-wish-compare]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const result = addCompareFromWishlist(btn.dataset.kind, btn.dataset.id);
      if (!notifyCompareToggle(result, btn.dataset.kind, { sourceRoute: 'mypage' })) return;
      rerender();
    });
  });
  bindPaidCatalogEvents(root, rerender);
  bindProviderNoticeEvents(root, rerender);
}
