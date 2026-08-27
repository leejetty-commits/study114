import {
  LIFECYCLE_FOOTNOTE_SUBMISSION,
  SUBMISSION_DOCS_LEAD,
  TRUST_PLATFORM_DISCLAIMER,
} from '../lifecycle-copy.js';
import { TUTOR_REGISTER_URL, STUDY_ROOM_REGISTER_URL } from '../nav-config.js';
import { getNavRole } from '../state.js';
import {
  getPreviewProfile,
  getRegistrationData,
  getSummaryCounts,
  getPrimaryCta,
  getSubmissionDocs,
  submissionDocStatusLabel,
  submissionDocVisibilityLabel,
  formatSubmissionDocSummary,
} from './preview-data.js';
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
  getWishlistItems,
  removeWishlist,
  addCompareFromWishlist,
} from '../user-actions-state.js';
import { formatMonthlyWon, formatTutorFeeCard } from '../exposure-format.js';
import { COMPARE_MAX } from '../exposure-schema.js';
import { notifyCompareToggle } from '../handoff-utils.js';
import { renderEmptyStateCard } from '../empty-state-copy.js';
import { renderMessagesScreen } from '../messages/screens.js';
import { isMessagesDetailPath, MESSAGES_BASE } from '../messages/router.js';
import { isStudentRegPath } from '../student-reg/router.js';
import { renderStudentRegScreen } from '../student-reg/screens.js';
import { isStudyRoomRegPath } from '../study-room-reg/router.js';
import { renderStudyRoomRegScreen } from '../study-room-reg/screens.js';
import { getStudyRoomEntryPath } from './router.js';
import { isTutorRegPath } from '../tutor-reg/router.js';
import { setAuthDisplayName, logout } from '../auth-session.js';
import {
  formatLoginAccountLabel,
  isInternalAuthEmail,
  resolveAccountDisplayName,
} from '../auth/display-identity.js';
import { renderTutorRegScreen } from '../tutor-reg/screens.js';
import { renderSubmissionBoardScreen } from '../submission-board/index.js';
import { P18_EXPOSURE_STATUS } from './plans-catalog.js';
import { getPaidOperationalStatus } from '../paid-backend.js';
import { renderPaidGuide, renderPaidUsage } from './paid-screens.js';
import { renderPlansHistory } from '../plans/screens.js';
import { getHistoryRows } from '../plans/history-mock.js';
import { bindPaidCatalogEvents } from '../paid-checkout.js';
import { bindProviderNoticeEvents } from '../provider-notices.js';
import { PASSWORD_RULE_HINT, validatePassword } from '../../../shared/password-policy.js';
import {
  HOME_EMPHASIS,
  EMPTY_ONBOARDING,
  GUARDIAN_PLANS_COPY,
  WISHLIST_NOTE,
  REGISTRATIONS_LEAD,
} from './mypage-copy.js';

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

function roleLabel(role) {
  const map = { parent: '학생(학부모)', study_room: '공부방', tutor: '과외쌤' };
  return map[role] || role;
}

function renderCtaBlock(cta) {
  if (cta.externalRegister) {
    const url = cta.kind === 'tutor' ? TUTOR_REGISTER_URL : STUDY_ROOM_REGISTER_URL;
    return `
      <div class="mypage-next-action">
        <div>
          <span class="mypage-next-action__eyebrow">지금 하면 좋아요</span>
          <strong class="mypage-next-action__title">${esc(cta.text)}</strong>
          <p class="mypage-next-action__hint">${esc(cta.hint || '등록 내용을 차근차근 이어서 완성해 보세요.')}</p>
        </div>
        <a href="${url}" class="btn btn--primary" data-same-tab-href="${url}">이어하기</a>
      </div>`;
  }
  if (cta.path) {
    return `
      <div class="mypage-next-action">
        <div>
          <span class="mypage-next-action__eyebrow">지금 하면 좋아요</span>
          <strong class="mypage-next-action__title">${esc(cta.text)}</strong>
          <p class="mypage-next-action__hint">${esc(cta.hint || '필요한 내용을 확인하고 다음 단계로 이어가세요.')}</p>
        </div>
        <a href="#${cta.path}" class="btn btn--primary" data-mypage-nav="${cta.path}">바로 확인</a>
      </div>`;
  }
  return `
    <div class="mypage-next-action">
      <div>
        <span class="mypage-next-action__eyebrow">오늘의 안내</span>
        <strong class="mypage-next-action__title">${esc(cta.text)}</strong>
        <p class="mypage-next-action__hint">${esc(cta.hint || '')}</p>
      </div>
    </div>`;
}

/** @param {string} path */
export function renderMypageScreen(path) {
  const role = getNavRole();
  /** @type {'parent'|'study_room'|'tutor'} */
  const r = role === 'guest' ? 'parent' : role;
  const profile = getPreviewProfile(r);
  const counts = getSummaryCounts(r);
  const cta = getPrimaryCta(r);

  // 공부방: 홈·내 등록 중간페이지 → 대표 공부방 직행
  if (r === 'study_room' && (path === '/mypage/home' || path === '/mypage/registrations')) {
    const entry = getStudyRoomEntryPath();
    queueMicrotask(() => {
      if (window.location.hash === '#/mypage/home' || window.location.hash === '#/mypage/registrations') {
        window.location.hash = entry;
      }
    });
    if (isStudyRoomRegPath(entry)) return renderStudyRoomRegScreen(entry);
    return renderStudyRoomRegScreen('/mypage/registrations/study-rooms');
  }

  if (isStudentRegPath(path)) return renderStudentRegScreen(path);
  if (isStudyRoomRegPath(path)) return renderStudyRoomRegScreen(path);
  if (isTutorRegPath(path)) return renderTutorRegScreen(path);

  if (path === '/mypage/home') return renderHome(r, profile, counts, cta);
  if (path === '/mypage/registrations') return renderRegistrationsIndex(r);
  if (path === '/mypage/wishlist') return renderWishlist();
  if (path === '/mypage/recent') return renderRecent(r);
  if (path === '/mypage/student-review') return renderStudentReview(r);
  if (path === MESSAGES_BASE || isMessagesDetailPath(path)) return renderMessagesScreen(path);
  if (path === '/mypage/plans') return renderPlans(r);
  if (path === '/mypage/plans/my') return renderPlans(r);
  if (path === '/mypage/plans/history') return renderPlansHistory();
  if (path === '/mypage/paid') return renderPaidGuide(r);
  if (path === '/mypage/paid/usage') return renderPaidUsage(r);
  if (path === '/mypage/submission-docs' || path === '/mypage/verification') return renderSubmissionDocs(r);
  if (path === '/mypage/submission-board' || path.startsWith('/mypage/submission-board/')) {
    if (r === 'study_room' || r === 'parent') return renderSubmissionDocs(r);
    return renderSubmissionBoardScreen(path);
  }
  if (path === '/mypage/account') return renderAccount(r, profile);
  return renderHome(r, profile, counts, cta);
}

function getHomeGreeting(role) {
  if (role === 'parent') return '아이에게 맞는 배움, 천천히 살펴보세요';
  if (role === 'study_room') return '우리 공부방의 오늘을 편안하게 관리하세요';
  return '과외 활동과 학생 소식을 한곳에서 살펴보세요';
}

function getHomeHighlights(role, counts) {
  const registrationState =
    counts.published > 0 ? `${counts.published}개 공개 중` : counts.draft > 0 ? '작성 이어가기' : '첫 등록 필요';
  if (role === 'parent') {
    return [
      { icon: '♡', label: '찜한 곳', value: `${counts.wishlist}개`, note: '나중에 다시 볼 수 있어요', path: '/mypage/wishlist' },
      { icon: '◷', label: '최근열람', value: `${counts.recentCount}개`, note: '보던 곳부터 이어보세요', path: '/mypage/recent' },
      { icon: '✉', label: '새 쪽지', value: `${counts.unreadMessages}개`, note: '답장이 필요한 소식이에요', path: '/mypage/messages' },
    ];
  }
  if (role === 'study_room') {
    return [
      { icon: '✓', label: '내 등록 상태', value: registrationState, note: '공개 정보와 부족한 내용을 확인하세요', path: '/mypage/registrations' },
      { icon: '☆', label: '찜한학생', value: `${counts.studentReviewCount}명`, note: '관심 학생 저장', path: '/mypage/student-review' },
      { icon: '✉', label: '새 쪽지', value: `${counts.unreadMessages}개`, note: '새로운 문의와 답장을 확인하세요', path: '/mypage/messages' },
    ];
  }
  return [
    { icon: '✓', label: '내 등록 상태', value: registrationState, note: '공개 정보와 부족한 내용을 확인하세요', path: '/mypage/registrations' },
    { icon: '☆', label: '학생 검토함', value: `${counts.studentReviewCount}명`, note: '관심 학생 저장', path: '/mypage/student-review' },
    { icon: '✉', label: '새 쪽지', value: `${counts.unreadMessages}개`, note: '새로운 문의와 답장을 확인하세요', path: '/mypage/messages' },
  ];
}

function renderHome(role, profile, counts, cta) {
  const homeIdentity = profile.displayName || profile.name || '회원';
  const highlights = getHomeHighlights(role, counts);

  return `
    <div class="mypage-home">
      <section class="mypage-home-hero">
        <div class="mypage-home-hero__copy">
          <span class="mypage-home-hero__role">${esc(roleLabel(role))}</span>
          <h2>${esc(homeIdentity)}님, ${esc(getHomeGreeting(role))}</h2>
          <p>${esc(profile.regionLabel)} 기준으로 쪽지·후기함·최근열람을 한곳에서 관리합니다.</p>
        </div>
      </section>

      <section class="mypage-home-section" aria-labelledby="mypage-today-title">
        <div class="mypage-home-section__head">
          <div>
            <span class="mypage-home-section__eyebrow">현황</span>
            <h2 id="mypage-today-title">내 상태</h2>
          </div>
          <p>${esc(HOME_EMPHASIS[role] || '')}</p>
        </div>
        <div class="mypage-status-strip" aria-label="현황 요약">
          ${highlights
            .map(
              (item) => `
            <a href="#${item.path}" class="mypage-status-strip__item" data-mypage-nav="${item.path}">
              <em>${esc(item.label)}</em>
              <strong>${esc(item.value)}</strong>
            </a>`,
            )
            .join('')}
        </div>
      </section>

      ${renderCtaBlock(cta)}
    </div>`;
}

/** 마이페이지 홈 후기 패널 hydrate (별도 관리센터 아님) */
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
    links.push({ path: '/mypage/registrations/students', label: '자녀(학생)', id: 'P15-03' });
  }
  if (role === 'study_room') {
    links.push({ path: '/mypage/registrations/study-rooms', label: '공부방', id: 'P15-04' });
  }
  if (role === 'tutor') {
    links.push({ path: '/mypage/registrations/tutors', label: '과외 프로필', id: 'P15-05' });
    links.push({ path: '/mypage/submission-docs', label: '제출자료 상태', id: 'P15-10' });
    links.push({ path: '/mypage/submission-board', label: '제출함', id: 'P23-04' });
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

function renderWishlistSection(kind, label) {
  const items = getWishlistItems(kind);
  if (!items.length) {
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
    <ul class="mypage-entity-list">
      ${items
        .map((item) => {
          const title = kind === 'tutor' ? item.tutor_display_name : item.study_room_name;
          const meta =
            kind === 'tutor'
              ? `${item.main_subject_note} · ${formatTutorFeeCard(item)}`
              : `${item.main_subject_note} · ${formatMonthlyWon(item.price_amount)}`;
          const lifecycleBadge = renderBasketLifecycleBadge(kind, item);
          const stickers = renderDecisionStickers(kind, item.id);
          const muted = isBasketLifecycleMuted(item, kind);
          return `
          <li class="mypage-entity${muted ? ' is-muted' : ''}">
            <div>
              <strong>${esc(title)}</strong>
              ${stickers}
              ${lifecycleBadge}
              <span class="mypage-muted">${esc(meta)}</span>
            </div>
            <div class="mypage-entity__actions">
              <button type="button" class="btn btn--secondary btn--sm" data-mypage-wish-compare data-kind="${kind}" data-id="${item.id}">비교(≤${COMPARE_MAX})</button>
              <button type="button" class="btn btn--secondary btn--sm" data-mypage-wish-remove data-kind="${kind}" data-id="${item.id}">찜 해제</button>
            </div>
          </li>`;
        })
        .join('')}
    </ul>`;
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
    return `<section class="mypage-panel mypage-empty"><p>${EMPTY_ONBOARDING.submissionParent}</p></section>`;
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
        ctaHref: '#/mypage/home',
        links: [{ label: '마이페이지 홈', href: '#/mypage/home' }],
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
  const tickets = ops?.tickets;
  const positions = exposure?.positions ?? [];
  const historyRows = getHistoryRows().slice(0, 8);

  return `
    <div class="mypage-home">
      <section class="mypage-panel mypage-panel--bare mypage-usage-overview">
        <h3 class="mypage-subhead">이용중인 노출광고</h3>
        ${
          positions.length
            ? `<ul class="plans-tier-list">${positions
                .map(
                  (p) =>
                    `<li><strong>${esc(String(p.sku || '').toUpperCase())}</strong> · ${p.days_left}일 남음 (~${esc(String(p.ends_on || p.ends_at || '').slice(0, 10))})</li>`,
                )
                .join('')}</ul>`
            : `<div class="mypage-info-box"><p>${esc(P18_EXPOSURE_STATUS.basic)}</p></div>`
        }
        <h3 class="mypage-subhead">잔여 쪽지권</h3>
        ${
          tickets
            ? `<div class="mypage-stats roi-metrics">
                <div class="mypage-stat"><span>${esc(tickets.memo.label)}</span><strong>${tickets.memo.remaining}</strong></div>
              </div>`
            : `<p class="mypage-muted">이용권 정보를 불러오면 표시됩니다.</p>`
        }
      </section>

      <section class="mypage-history-box">
        <h2>구매 결제 내역</h2>
        <table class="plans-table" aria-label="구매 결제 내역">
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
                : `<tr><td colspan="4" class="mypage-muted">구매내역이 없습니다.</td></tr>`
            }
          </tbody>
        </table>
      </section>
    </div>`;
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
        <span class="mypage-badge">${esc(formatSubmissionDocSummary(docs))}</span>
        <a href="#/mypage/submission-board" class="btn btn--primary btn--sm" data-mypage-nav="/mypage/submission-board">제출함</a>
        <a href="${TUTOR_REGISTER_URL}" class="btn btn--secondary btn--sm" data-same-tab-href="${TUTOR_REGISTER_URL}">과외쌤 등록 화면에서 자료 등록</a>
      </div>
      <table class="p15-submission__table" aria-label="제출자료 상태">
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
      </table>
      <p class="mypage-note">${esc(LIFECYCLE_FOOTNOTE_SUBMISSION)}</p>
      <p class="mypage-note p22-trust-disclaimer">${esc(TRUST_PLATFORM_DISCLAIMER)}</p>
    </section>`;
}

function renderAccount(role, profile) {
  const authRole =
    profile.authRole === 'admin'
      ? '마스터 관리자'
      : `${roleLabel(role)} · 계정설정에서 역할 전환`;
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
        <p class="account-settings__lead">표시명·로그인·역할·보안을 한곳에서 관리합니다.</p>
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
          <p class="account-card__desc">로그인·연동·역할 요약입니다.</p>
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
              <dd>${esc(profile.regionLabel)}</dd>
            </div>
            <div class="account-meta__item">
              <dt>역할</dt>
              <dd>${esc(authRole)}</dd>
            </div>
          </dl>
        </div>
      </article>

      <article class="account-card" data-role-switch-panel>
        <div class="account-card__head">
          <h3 class="account-card__title">역할 전환</h3>
          <p class="account-card__desc">현재 세션 역할은 <strong>${esc(roleLabel(role))}</strong>입니다. 다른 역할로 쓰려면 해당 계정으로 다시 로그인해 주세요.</p>
        </div>
        <div class="account-card__body account-card__body--actions">
          <button type="button" class="btn btn--secondary btn--sm" data-action="util-logout">다른 계정으로 로그인</button>
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

/** @param {HTMLElement} root @param {() => void} rerender */
export function bindMypageScreenEvents(root, rerender) {
  bindPasswordChangeEvents(root);
  bindDisplayNameEvents(root, rerender);
  bindWithdrawEvents(root);
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
