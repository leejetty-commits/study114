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
import { MYPAGE_NAV } from './router.js';
import { getMessagesSummaryCounts, renderMessagesScreen } from '../messages/screens.js';
import { isMessagesDetailPath } from '../messages/router.js';
import { isStudentRegPath } from '../student-reg/router.js';
import { renderStudentRegScreen } from '../student-reg/screens.js';
import { isStudyRoomRegPath } from '../study-room-reg/router.js';
import { renderStudyRoomRegScreen } from '../study-room-reg/screens.js';
import { isTutorRegPath } from '../tutor-reg/router.js';
import { renderTutorRegScreen } from '../tutor-reg/screens.js';
import { previewState } from '../state.js';
import {
  PAID_CATALOG_PLACEHOLDER,
  FREE_TIER_COPY,
  PAID_TIER_COPY,
} from './plans-catalog.js';
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
        <a href="${url}" class="btn btn--primary" target="_blank" rel="noopener">${esc(cta.text)}</a>
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
  if (path === '/mypage/submission-docs' || path === '/mypage/verification') return renderSubmissionDocs(r);
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
      <span class="mypage-card__id">${n.screenId}</span>
    </a>`,
  );

  return `
    <section class="mypage-panel">
      <div class="mypage-status">
        <span class="mypage-badge">${esc(roleLabel(role))}</span>
        <span>${esc(profile.regionLabel)}</span>
        <span class="mypage-muted">${esc(profile.email)}</span>
      </div>
      <p class="mypage-emphasis" aria-label="역할별 강조">§4-3-1 · ${esc(HOME_EMPHASIS[role] || '')}</p>
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
  }
  if (role === 'tutor') {
    links.push({ path: '/mypage/registrations/tutors', label: '과외 프로필', id: 'P15-05' });
    links.push({ path: '/mypage/submission-docs', label: '제출자료 상태', id: 'P15-10' });
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
            <span class="mypage-card__id">${l.id}</span>
          </a>`,
          )
          .join('')}
      </div>
    </section>`;
}

function renderWishlistSection(kind, label) {
  const items = getWishlistItems(kind);
  if (!items.length) {
    return `<p class="mypage-empty-inline">${label} 찜이 없습니다. <a href="${searchUiUrl(kind === 'tutor' ? 'tutor' : 'room', getNavRole())}" target="_blank" rel="noopener">검색에서 찾기</a></p>`;
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
  const fromAccess = getHandoffFromQuery() === 'access';
  const regLink = getProviderRegDeepLink(role);

  if (!items.length) {
    return `
      <section class="mypage-panel mypage-empty">
        ${fromAccess ? `<div class="handoff-deeplink-banner" role="status">${esc(HANDOFF_DEEPLINK.reviewFromAccess)}</div>` : ''}
        <p>${STUDENT_REVIEW.empty}</p>
        <a href="${getStudentSearchUrl()}" class="btn btn--primary btn--sm" target="_blank" rel="noopener">학생찾기 보기</a>
        ${regLink ? `<a href="#${regLink.href}" class="btn btn--secondary btn--sm" data-mypage-nav="${regLink.href}">${esc(regLink.label)} (${regLink.screenId})</a>` : ''}
      </section>`;
  }

  return `
    <section class="mypage-panel">
      ${fromAccess ? `<div class="handoff-deeplink-banner" role="status">${esc(HANDOFF_DEEPLINK.reviewFromAccess)}</div>` : ''}
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
  if (role === 'parent' && items.length === 0) {
    return `<section class="mypage-panel mypage-empty"><p>${EMPTY_ONBOARDING.recentParent}</p></section>`;
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
          : '<p class="mypage-empty-inline">기록 없음</p>'
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
        <h2 class="mypage-subhead">소비형 SKU (참고)</h2>
        <ul class="mypage-entity-list plans-catalog plans-catalog--readonly">
          ${PAID_CATALOG_PLACEHOLDER.filter((i) => i.kind === 'consumable')
            .slice(0, 3)
            .map(
              (item) => `
            <li class="mypage-entity">
              <div><strong>${esc(item.name)}</strong><span class="mypage-muted">${esc(item.tagline)}</span></div>
              <span class="mypage-badge">${esc(item.priceLabel)}</span>
            </li>`,
            )
            .join('')}
        </ul>
      </section>`;
  }

  const tier = previewState.providerSubscription;
  const tierCopy = tier === 'paid' ? PAID_TIER_COPY : FREE_TIER_COPY;

  return `
    <section class="mypage-panel">
      <p class="mypage-lead">P15-09 · 18장 · 18b placeholder · 데모 구독: <strong>${tier}</strong></p>
      <div class="mypage-info-box plans-tier-box">
        <strong>${esc(tierCopy.title)}</strong>
        <ul class="plans-tier-list">${tierCopy.items.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
      </div>
      <h2 class="mypage-subhead">상품 카탈로그 (18b)</h2>
      <ul class="plans-catalog">
        ${PAID_CATALOG_PLACEHOLDER.map(
          (item) => `
          <li class="plans-catalog__item${item.featured ? ' is-featured' : ''}">
            <div class="plans-catalog__head">
              <strong>${esc(item.name)}</strong>
              <span class="plans-catalog__kind">${esc(item.kind)}</span>
            </div>
            <p class="plans-catalog__tagline">${esc(item.tagline)}</p>
            <p class="plans-catalog__price">${esc(item.priceLabel)}${item.pointsLabel ? ` · ${esc(item.pointsLabel)}` : ''}</p>
            <ul class="plans-catalog__bullets">${item.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>
            <button type="button" class="btn btn--secondary btn--sm" disabled title="PG 연동 후순위">구매 (placeholder)</button>
          </li>`,
        ).join('')}
      </ul>
      <p class="mypage-note">P16-04 게이트 CTA → 이 화면 · 첫 과금=단기 부스트 (18§7)</p>
    </section>`;
}

function renderSubmissionDocs(role) {
  if (role === 'parent') {
    return `<section class="mypage-panel"><p class="mypage-muted">${EMPTY_ONBOARDING.submissionParent}</p></section>`;
  }

  if (role === 'study_room') {
    return `
      <section class="mypage-panel">
        <p class="mypage-lead">15장 §2-1 · ${EMPTY_ONBOARDING.submissionStudyRoom}</p>
        <p class="mypage-muted">동일 원칙: 운영자 심사·승인·반려 없음 · 제출 여부·공개 상태 표시만</p>
      </section>`;
  }

  const docs = getSubmissionDocs(role);
  return `
    <section class="mypage-panel p15-submission">
      <p class="mypage-lead">${esc(SUBMISSION_DOCS_LEAD)}</p>
      <div class="p15-submission__summary">
        <span class="mypage-badge">${esc(formatSubmissionDocSummary(docs))}</span>
        <a href="${TUTOR_REGISTER_URL}" class="btn btn--secondary btn--sm" target="_blank" rel="noopener">tutor-ui에서 자료 등록</a>
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
  return `
    <section class="mypage-panel">
      <dl class="mypage-dl">
        <dt>이름</dt><dd>${esc(profile.name)}</dd>
        <dt>이메일</dt><dd>${esc(profile.email)}</dd>
        <dt>대표 지역</dt><dd>${esc(profile.regionLabel)}</dd>
        <dt>역할</dt><dd>${esc(roleLabel(role))} · 9장 역할 전환</dd>
      </dl>
      <div class="mypage-form-actions">
        <button type="button" class="btn btn--secondary" data-action="role-switch">역할 전환</button>
        <button type="button" class="btn btn--secondary" disabled>비밀번호 변경</button>
        <button type="button" class="btn btn--secondary" data-action="util-logout">로그아웃</button>
      </div>
    </section>`;
}

/** @param {HTMLElement} root @param {() => void} rerender */
export function bindMypageScreenEvents(root, rerender) {
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
}
