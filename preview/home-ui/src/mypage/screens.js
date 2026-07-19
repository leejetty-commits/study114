import {
  LIFECYCLE_FOOTNOTE_SUBMISSION,
  SUBMISSION_DOCS_LEAD,
  TRUST_PLATFORM_DISCLAIMER,
} from '../lifecycle-copy.js';
import { TUTOR_REGISTER_URL, STUDY_ROOM_REGISTER_URL, searchUiUrl } from '../nav-config.js';
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
import { getHandoffFromQuery, getProviderRegDeepLink } from '../handoff-link.js';
import { HANDOFF_DEEPLINK } from '../handoff-copy.js';
import { STUDENT_REVIEW, studentReviewItemLabel } from '../handoff-copy.js';
import {
  renderBasketLifecycleBadge,
  isBasketLifecycleMuted,
  resolveBasketItem,
} from '../handoff-lifecycle.js';
import { renderResumeToken } from '../handoff-resume.js';
import { renderDecisionStickers } from '../handoff-sticker.js';
import { getStudentSearchUrl } from '../tutor-reg/format.js';
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
import { MYPAGE_NAV } from './router.js';
import { getMessagesSummaryCounts, renderMessagesScreen } from '../messages/screens.js';
import { isMessagesDetailPath } from '../messages/router.js';
import { isStudentRegPath } from '../student-reg/router.js';
import { renderStudentRegScreen } from '../student-reg/screens.js';
import { isStudyRoomRegPath } from '../study-room-reg/router.js';
import { renderStudyRoomRegScreen } from '../study-room-reg/screens.js';
import { isTutorRegPath } from '../tutor-reg/router.js';
import { setAuthDisplayName } from '../auth-session.js';
import {
  formatLoginAccountLabel,
  isInternalAuthEmail,
  resolveAccountDisplayName,
} from '../auth/display-identity.js';
import { renderTutorRegScreen } from '../tutor-reg/screens.js';
import { renderSubmissionBoardScreen } from '../submission-board/index.js';
import { previewState } from '../state.js';
import {
  FREE_TIER_COPY,
  PAID_TIER_COPY,
  P18_HEADLINE,
} from './plans-catalog.js';
import { getRoiMetrics } from '../paid-backend.js';
import { renderPaidGuide, renderPaidUsage } from './paid-screens.js';
import { bindPaidCatalogEvents } from '../paid-checkout.js';
import { bindProviderNoticeEvents } from '../provider-notices.js';
import { PASSWORD_RULE_HINT, validatePassword } from '../../../shared/password-policy.js';
import {
  HOME_EMPHASIS,
  HOME_STATS_NOTE,
  EMPTY_ONBOARDING,
  GUARDIAN_PLANS_COPY,
  WISHLIST_NOTE,
  RECENT_NOTE,
  STUDENT_REVIEW_NOTE,
  MESSAGES_SUMMARY_LEAD,
  REGISTRATIONS_LEAD,
  homeEmphasisStatKeys,
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
      <div class="mypage-cta">
        <p class="mypage-cta__hint">${esc(cta.hint)}</p>
        <a href="${url}" class="btn btn--primary" data-same-tab-href="${url}">${esc(cta.text)}</a>
      </div>`;
  }
  if (cta.path) {
    return `
      <div class="mypage-cta">
        <p class="mypage-cta__hint">${esc(cta.hint || '')}</p>
        <a href="#${cta.path}" class="btn btn--primary" data-mypage-nav="${cta.path}">${esc(cta.text)}</a>
      </div>`;
  }
  return `
    <div class="mypage-cta">
      <p class="mypage-cta__hint">${esc(cta.hint || '')}</p>
      <span class="mypage-cta__text">${esc(cta.text)}</span>
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

  if (isStudentRegPath(path)) return renderStudentRegScreen(path);
  if (isStudyRoomRegPath(path)) return renderStudyRoomRegScreen(path);
  if (isTutorRegPath(path)) return renderTutorRegScreen(path);

  if (path === '/mypage/home') return renderHome(r, profile, counts, cta);
  if (path === '/mypage/registrations') return renderRegistrationsIndex(r);
  if (path === '/mypage/wishlist') return renderWishlist();
  if (path === '/mypage/recent') return renderRecent(r);
  if (path === '/mypage/student-review') return renderStudentReview(r);
  if (isMessagesDetailPath(path)) return renderMessagesScreen(path);
  if (path === '/mypage/messages') return renderMessagesSummary();
  if (path === '/mypage/plans') return renderPlans(r);
  if (path === '/mypage/paid') return renderPaidGuide(r);
  if (path === '/mypage/paid/usage') return renderPaidUsage(r);
  if (path === '/mypage/submission-docs' || path === '/mypage/verification') return renderSubmissionDocs(r);
  if (path === '/mypage/submission-board' || path.startsWith('/mypage/submission-board/')) {
    return renderSubmissionBoardScreen(path);
  }
  if (path === '/mypage/account') return renderAccount(r, profile);
  return renderHome(r, profile, counts, cta);
}

function renderHomeStat(key, label, value, emphasis) {
  if (key === 'paidDaysLeft' && value == null) {
    return `<div class="mypage-stat is-muted" title="15장 §7"><span>유료</span><strong>공급자용</strong></div>`;
  }
  const cls = emphasis ? 'mypage-stat is-emphasis' : 'mypage-stat';
  return `<div class="${cls}"><span>${esc(label)}</span><strong>${esc(String(value ?? '—'))}</strong></div>`;
}

function buildHomeStats(role, counts) {
  const emph = new Set(homeEmphasisStatKeys(role));
  /** @type {Array<[string, string, unknown]>} */
  const rows = [
    ['published', '공개중', counts.published],
    ['draft', '임시저장', counts.draft],
    ['wishlist', '찜', counts.wishlist],
    ['unreadMessages', '읽지 않은 쪽지', counts.unreadMessages],
    ['recentCount', '최근열람', counts.recentCount],
  ];
  if (role === 'study_room' && counts.inquiryLabel != null) {
    rows.splice(2, 0, ['inquiryLabel', '상담 수용', counts.inquiryLabel]);
  }
  if (role === 'study_room' || role === 'tutor') {
    rows.splice(role === 'tutor' ? 1 : 3, 0, ['studentReviewCount', '학생 검토함', counts.studentReviewCount]);
  }
  if (role === 'tutor') {
    if (counts.memoCredits != null) {
      rows.splice(1, 0, ['memoCredits', '메모권', `${counts.memoCredits}회`]);
    }
    if (counts.matchingLabel != null) {
      rows.push(['matchingLabel', '매칭', counts.matchingLabel]);
    }
  }
  rows.push(['paidDaysLeft', '유료', counts.paidDaysLeft != null ? `${counts.paidDaysLeft}일` : null]);
  return rows
    .map(([key, label, val]) => renderHomeStat(key, label, val, emph.has(key)))
    .join('');
}

function renderHome(role, profile, counts, cta) {
  const cards = MYPAGE_NAV.filter((n) => n.path !== '/mypage/home').map(
    (n) => `
    <a href="#${n.path}" class="mypage-card" data-mypage-nav="${n.path}">
      <span class="mypage-card__label">${esc(n.label)}</span>
    </a>`,
  );

  const homeIdentity = profile.displayName || profile.name || '회원';

  return `
    <section class="mypage-panel">
      <div class="mypage-status">
        <span class="mypage-badge">${esc(roleLabel(role))}</span>
        <span>${esc(profile.regionLabel)}</span>
        <span class="mypage-muted">${esc(homeIdentity)}</span>
      </div>
      <p class="mypage-emphasis" aria-label="역할별 강조">${esc(HOME_EMPHASIS[role] || '')}</p>
      ${renderCtaBlock(cta)}
      <div class="mypage-shortcuts">${cards.join('')}</div>
      <div class="mypage-stats" aria-label="숫자 요약">${buildHomeStats(role, counts)}</div>
      <p class="mypage-note">${HOME_STATS_NOTE}</p>
    </section>`;
}

function renderRegistrationsIndex(role) {
  const links = [];
  if (role === 'parent') {
    links.push({ path: '/mypage/registrations/students', label: '자녀(학생)', id: 'P15-03' });
  }
  if (role === 'study_room') {
    links.push({ path: '/mypage/registrations/study-rooms', label: '공부방', id: 'P15-04' });
    links.push({ path: '/mypage/submission-board', label: '제출함', id: 'P23-04' });
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
    const searchKind = kind === 'tutor' ? 'tutor' : 'room';
    return renderEmptyStateCard('wishlist', {
      ctaHref: searchUiUrl(searchKind, getNavRole()),
      links: [
        {
          label: `${label} 검색`,
          href: searchUiUrl(searchKind, getNavRole()),
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
  const regLink = getProviderRegDeepLink(role);

  if (!items.length) {
    const links = [{ label: '학생찾기 보기', href: getStudentSearchUrl() }];
    if (regLink) {
      links.push({
        label: `${regLink.label} (${regLink.screenId})`,
        href: `#${regLink.href}`,
      });
    }
    return `
      <section class="mypage-panel mypage-empty">
        ${fromBanner ? `<div class="handoff-deeplink-banner" role="status">${esc(fromBanner)}</div>` : ''}
        ${renderEmptyStateCard('studentReview', { links })}
      </section>`;
  }

  return `
    <section class="mypage-panel">
      ${fromBanner ? `<div class="handoff-deeplink-banner" role="status">${esc(fromBanner)}</div>` : ''}
      <p class="mypage-note">${STUDENT_REVIEW_NOTE}</p>
      ${regLink ? `<p class="mypage-note"><a href="#${regLink.href}" data-mypage-nav="${regLink.href}">${esc(role === 'tutor' ? HANDOFF_DEEPLINK.providerRegCtaTutor : HANDOFF_DEEPLINK.providerRegCtaStudyRoom)}</a> · 메모·쪽지 권한 확인</p>` : ''}
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
                ${muted ? 'disabled title="공개 중지된 의뢰"' : ''}>${role === 'tutor' ? '메모' : '쪽지'}</button>
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
  const homePath = role === 'parent' ? '/parent' : role === 'study_room' ? '/study-room' : '/tutor';
  if (!items.length) {
    return `
    <section class="mypage-panel">
      <p class="mypage-note">${RECENT_NOTE}</p>
      ${renderEmptyStateCard('recent', {
        ctaHref: `#${homePath}`,
        links: [{ label: '탐색하기', href: `#${homePath}` }],
      })}
    </section>`;
  }
  return `
    <section class="mypage-panel">
      <p class="mypage-note">${RECENT_NOTE}</p>
      ${
        items.length
          ? `<ul class="mypage-entity-list">
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
      </ul>`
          : renderEmptyStateCard('recent', {
              ctaHref: `#${homePath}`,
              links: [{ label: '탐색하기', href: `#${homePath}` }],
            })
      }
    </section>`;
}

function renderMessagesSummary() {
  const { unread, active } = getMessagesSummaryCounts();
  return `
    <section class="mypage-panel">
      <p class="mypage-lead">${MESSAGES_SUMMARY_LEAD}</p>
      <div class="mypage-stats">
        <div class="mypage-stat"><span>읽지 않음</span><strong>${unread}</strong></div>
        <div class="mypage-stat"><span>진행중</span><strong>${active}</strong></div>
      </div>
      <a href="#/mypage/messages/inbox" class="btn btn--primary" data-mypage-nav="/mypage/messages/inbox">쪽지함 열기</a>
    </section>`;
}

function renderPlans(role) {
  if (role === 'parent') {
    return `
      <section class="mypage-panel">
        <p class="mypage-lead">${GUARDIAN_PLANS_COPY.lead}</p>
        <div class="mypage-info-box">
          <p>${GUARDIAN_PLANS_COPY.body}</p>
          <p class="mypage-muted">${GUARDIAN_PLANS_COPY.footnote}</p>
        </div>
        <a href="#/support/faq" class="btn btn--secondary" data-nav="/support/faq">유료 FAQ (P17-04)</a>
      </section>`;
  }

  const tier = previewState.providerSubscription;
  const tierCopy = tier === 'paid' ? PAID_TIER_COPY : FREE_TIER_COPY;
  const metrics = getRoiMetrics();

  return `
    <section class="mypage-panel">
      <p class="mypage-lead">P15-09 · ${esc(P18_HEADLINE)} · 데모 tier: <strong>${tier}</strong></p>
      <div class="mypage-info-box plans-tier-box">
        <strong>${esc(tierCopy.title)}</strong>
        <ul class="plans-tier-list">${tierCopy.items.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
      </div>
      <h2 class="mypage-subhead">반응 요약 (ROI 무료 3종)</h2>
      <div class="mypage-stats roi-metrics">
        ${metrics.map(
          (m) => `
          <div class="mypage-stat" title="${esc(m.hint)}">
            <span>${esc(m.label)}</span>
            <strong>${m.value}</strong>
          </div>`,
        ).join('')}
      </div>
      <div class="mypage-actions-row">
        <a href="#/plans" class="btn btn--primary" data-nav="/plans">상품센터 열기</a>
        <a href="#/plans/my" class="btn btn--secondary" data-nav="/plans/my">내 상품 상태</a>
        <a href="#/plans/positions" class="btn btn--secondary" data-nav="/plans/positions">노출상품</a>
      </div>
      <p class="mypage-note">마이페이지는 상태 요약 · 구매·카탈로그는 상품센터(#/plans)</p>
    </section>`;
}

function renderSubmissionDocs(role) {
  if (role === 'parent') {
    return `<section class="mypage-panel"><p class="mypage-muted">${EMPTY_ONBOARDING.submissionParent}</p></section>`;
  }

  if (role === 'study_room') {
    return `
      <section class="mypage-panel p15-submission">
        <p class="mypage-lead">15장 §2-1 · 공부방 제출자료</p>
        <p class="mypage-muted">운영자 심사·승인·반려 없음 · 제출 여부·공개 상태 표시만</p>
        <div class="sub-board-bridge">
          <a href="#/mypage/submission-board" class="btn btn--primary btn--sm" data-mypage-nav="/mypage/submission-board">P23-04 제출함 열기</a>
          <span class="mypage-muted">boardKey <code>submission</code> · 권한형 업로드</span>
        </div>
      </section>`;
  }

  const docs = getSubmissionDocs(role);
  return `
    <section class="mypage-panel p15-submission">
      <p class="mypage-lead">${esc(SUBMISSION_DOCS_LEAD)}</p>
      <div class="p15-submission__summary">
        <span class="mypage-badge">${esc(formatSubmissionDocSummary(docs))}</span>
        <a href="#/mypage/submission-board" class="btn btn--primary btn--sm" data-mypage-nav="/mypage/submission-board">P23-04 제출함</a>
        <a href="${TUTOR_REGISTER_URL}" class="btn btn--secondary btn--sm" data-same-tab-href="${TUTOR_REGISTER_URL}">tutor-ui에서 자료 등록</a>
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
    <section class="mypage-panel">
      <h2 class="mypage-password-change__title">표시 정보</h2>
      <p class="mypage-note">사이트 표시명은 마이페이지·헤더에 보이는 이름입니다. 로그인 계정·소셜 연동은 그대로 유지됩니다.</p>
      ${
        justSaved
          ? '<p class="form-success" role="status">사이트 표시명이 저장되었습니다.</p>'
          : ''
      }
      <div class="mypage-display-name-summary" data-display-name-summary>
        <dl class="mypage-dl">
          <dt>사이트 표시명</dt>
          <dd><strong data-display-name-current>${displayShown}</strong></dd>
        </dl>
        <div class="mypage-form-actions">
          <button type="button" class="btn btn--secondary" data-action="toggle-display-name">표시명 수정</button>
        </div>
      </div>
      <div class="mypage-display-name-edit" data-display-name-edit hidden>
        <form data-form="change-display-name" class="mypage-display-name__form" autocomplete="off">
          <div class="form-group">
            <label class="form-label form-label--required" for="mypage-display-name">사이트 표시명</label>
            <input class="form-input" type="text" id="mypage-display-name" name="display_name" maxlength="50" required value="${displayValue}" />
            <p class="form-hint">예: 카카오 과외쌤, 종현 과외쌤 — 2~50자 · 이메일 형태 불가</p>
          </div>
          <p class="form-error" data-display-name-error hidden role="alert"></p>
          <div class="mypage-form-actions">
            <button type="submit" class="btn btn--primary">표시명 저장</button>
            <button type="button" class="btn btn--ghost" data-action="cancel-display-name">취소</button>
          </div>
        </form>
      </div>
      <dl class="mypage-dl mypage-dl--account-meta">
        <dt>연동된 소셜</dt><dd>${esc(socialLabel)}</dd>
        <dt>로그인 계정</dt>
        <dd>
          <code class="mypage-login-id">${esc(loginShown)}</code>
          <p class="mypage-note" style="margin:0.35rem 0 0;">${esc(loginNote)}</p>
        </dd>
        <dt>대표 지역</dt><dd>${esc(profile.regionLabel)}</dd>
        <dt>역할</dt><dd>${esc(authRole)}</dd>
      </dl>
      <div class="mypage-role-switch" data-role-switch-panel>
        <h2 class="mypage-password-change__title">역할 전환</h2>
        <p class="mypage-note">역할 전환은 GNB가 아니라 이 계정설정에서만 처리합니다. 현재 세션 역할(<strong>${esc(roleLabel(role))}</strong>) 기준으로 메뉴가 노출됩니다.</p>
        <p class="mypage-note">다른 역할로 이용하려면 해당 역할 계정으로 다시 로그인하세요. (복수 역할 보유 시 전환 UI는 후속)</p>
        <div class="mypage-form-actions">
          <button type="button" class="btn btn--secondary" data-action="util-logout">다른 계정으로 로그인</button>
        </div>
      </div>
      <div class="mypage-form-actions">
        <button type="button" class="btn btn--secondary" data-action="toggle-password-change">비밀번호 변경</button>
        <button type="button" class="btn btn--secondary" data-action="util-logout">로그아웃</button>
      </div>
      <div class="mypage-password-change" data-password-change hidden>
        <h2 class="mypage-password-change__title">비밀번호 변경</h2>
        <p class="mypage-note">로그인한 상태에서 현재 비밀번호를 확인한 뒤 새 비밀번호로 바꿉니다. 소셜로만 가입한 계정은 이메일 비밀번호가 없을 수 있습니다.</p>
        <form data-form="change-password" class="mypage-password-change__form" autocomplete="off">
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
          <div class="mypage-form-actions">
            <button type="submit" class="btn btn--primary">변경 저장</button>
            <button type="button" class="btn btn--ghost" data-action="cancel-password-change">취소</button>
          </div>
        </form>
      </div>
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

/** @param {HTMLElement} root @param {() => void} rerender */
export function bindMypageScreenEvents(root, rerender) {
  bindPasswordChangeEvents(root);
  bindDisplayNameEvents(root, rerender);
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
