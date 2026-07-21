import {
  P21_LIST_TABS,
  P21_GAUGE_TITLES,
  P21_ACCESS_CTA,
} from './tutor-reg-copy.js';
import {
  LIFECYCLE_FOOTNOTE_REG,
  LIFECYCLE_PUBLISH_CONFIRM_DIRECT,
  LIFECYCLE_PUBLISH_CONFIRM_NOTE,
  publishReadinessLabel,
} from '../lifecycle-copy.js';
import { renderBrowseList, renderExposureBox } from '../exposure-render.js';
import { TUTOR_REGISTER_URL } from '../nav-config.js';
import { getStudentReviewIds } from '../student-review-store.js';
import { studentReviewPath, getHandoffFromQuery } from '../handoff-link.js';
import { HANDOFF_DEEPLINK } from '../handoff-copy.js';
import { formatSubmissionDocSummary, getSubmissionDocs } from '../mypage/preview-data.js';
import {
  parseTutorRegPath,
  tutorHubPath,
  tutorSectionPath,
  tutorListTabPath,
  TUTOR_REG_MENUS,
} from './router.js';
import {
  formatTutorSummaryLine,
  profileStatusLabel,
  detailStatusLabel,
  tutorToExposureRow,
  tutorUiDeepLink,
  getExposureMatrix,
  getAccessMatrix,
  getMatchingVisibility,
  getThreeGauges,
  getHubCtas,
  getUnlockCards,
  getStudentSearchUrl,
  getProductApplyHint,
} from './format.js';
import {
  getTutorsByTab,
  getTutor,
  getPublishReadiness,
  publishTutor,
  hideTutor,
  deleteTutor,
  getTutorSummaryCounts,
  isPaidProvider,
  getMemoCreditsRemaining,
} from './store.js';
import { showEmailVerifyOverlay } from '../email-verify-overlay.js';
import { previewState } from '../state.js';

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

const PHASE_STEPS = [
  { key: 'basic', label: '기본정보' },
  { key: 'detail', label: '상세정보' },
  { key: 'publish', label: '미리보기·공개' },
  { key: 'access', label: '학생 접근·쪽지' },
];

/** @param {import('./store.js').TutorRecord} tutor @param {string} activeSection */
function renderPhaseStepper(tutor, activeSection) {
  if (activeSection === 'hub') return '';
  const stepIndex = PHASE_STEPS.findIndex((s) => s.key === activeSection);
  const progressPct = stepIndex >= 0 ? Math.round(((stepIndex + 1) / PHASE_STEPS.length) * 100) : 0;

  const items = PHASE_STEPS.map((step, i) => {
    const href = tutorSectionPath(tutor.id, /** @type {any} */ (step.key));
    const isActive = activeSection === step.key;
    const readiness = getPublishReadiness(tutor);
    const isDone =
      (step.key === 'basic' && tutor.has_primary_subject && tutor.tutor_display_name) ||
      (step.key === 'detail' && tutor.detail_completion_status === 'expanded_complete') ||
      (step.key === 'publish' && tutor.profile_status === 'published') ||
      (step.key === 'access' && tutor.profile_status === 'published');
    const state = isActive ? 'is-active' : isDone ? 'is-done' : '';
    const arrow = i < PHASE_STEPS.length - 1 ? '<span class="p19-stepper__arrow" aria-hidden="true">›</span>' : '';
    return `
      <a href="#${href}" class="p19-stepper__step ${state}" data-p21-nav="${href}">
        <span class="p19-stepper__index">${isDone && !isActive ? '✓' : i + 1}</span>
        <span class="p19-stepper__label">${esc(step.label)}</span>
      </a>${arrow}`;
  }).join('');

  const currentLabel = PHASE_STEPS.find((s) => s.key === activeSection)?.label || '';

  return `
    <div class="p19-stepper-wrap">
      <div class="p19-progress-mobile" role="progressbar" aria-valuenow="${progressPct}" aria-valuemin="0" aria-valuemax="100">
        <div class="p19-progress-mobile__track">
          <div class="p19-progress-mobile__fill" style="width: ${progressPct}%"></div>
        </div>
        <span class="p19-progress-mobile__label">${esc(currentLabel)} · ${stepIndex + 1}/${PHASE_STEPS.length}</span>
      </div>
      <nav class="p19-stepper" aria-label="운영 단계">${items}</nav>
    </div>`;
}

/** @param {import('./store.js').TutorRecord} tutor @param {string} activeSection @param {string} bodyHtml */
function renderTutorShell(tutor, activeSection, bodyHtml) {
  const readiness = getPublishReadiness(tutor);
  const navItems = TUTOR_REG_MENUS.map((m) => {
    const href = tutorSectionPath(tutor.id, /** @type {any} */ (m.key));
    const active = activeSection === m.key ? ' is-active' : '';
    return `<a href="#${href}" class="p19-sidebar-nav__link${active}" data-p21-nav="${href}">${esc(m.label)}</a>`;
  }).join('');

  const hubActive = activeSection === 'hub' ? ' is-active' : '';
  const readinessText = publishReadinessLabel(readiness.canPublish, readiness.missing.length);
  const paidBadge = isPaidProvider() ? 'paid' : 'free';
  const memos = getMemoCreditsRemaining();

  return `
    <div class="p19-frame">
      <aside class="p19-sidebar" aria-label="과외쌤 운영">
        <div class="p19-sidebar__top">
          <a href="#/mypage/registrations/tutors" class="p19-back" data-p21-nav="/mypage/registrations/tutors">← 목록</a>
          <span class="p19-sidebar__readiness mypage-badge${readiness.canPublish ? ' p19-readiness--ok' : ' p19-readiness--pending'}">${esc(readinessText)}</span>
        </div>
        <div class="p19-student-card">
          <div class="p19-student-card__avatar" aria-hidden="true">${esc((tutor.tutor_display_name || '?').charAt(0))}</div>
          <div class="p19-student-card__body">
            <strong class="p19-student-card__name">${esc(tutor.tutor_display_name)}</strong>
            <span class="mypage-badge mypage-badge--${tutor.profile_status}">${esc(profileStatusLabel(tutor.profile_status))}</span>
            <p class="p19-student-card__meta">${esc(formatTutorSummaryLine(tutor))}</p>
            <p class="p19-student-card__meta p21-access-badge">${esc(paidBadge)} · 메모권 ${memos}회</p>
          </div>
        </div>
        <nav class="p19-sidebar-nav" aria-label="과외쌤 운영 메뉴">
          <a href="#${tutorHubPath(tutor.id)}" class="p19-sidebar-nav__link p19-sidebar-nav__link--overview${hubActive}" data-p21-nav="${tutorHubPath(tutor.id)}">운영 홈</a>
          ${navItems}
          <a href="#/plans/positions?provider_type=tutor&provider_id=${tutor.id}" class="p19-sidebar-nav__link" data-nav="/plans/positions?provider_type=tutor&provider_id=${tutor.id}">유료·상품</a>
        </nav>
        <div class="p19-sidebar-status">
          <span class="p19-sidebar-status__label">공개 준비</span>
          <span class="p19-sidebar-status__value${readiness.canPublish ? ' is-ready' : ''}">${readiness.doneCount}/${readiness.totalCount}</span>
        </div>
      </aside>
      <div class="p19-frame__body">
        ${renderPhaseStepper(tutor, activeSection)}
        ${bodyHtml}
      </div>
    </div>`;
}

/** @param {string} path */
export function renderTutorRegScreen(path) {
  const route = parseTutorRegPath(path);
  if (!route) return '';

  if (route.screenId === 'P21-01') return renderList(route.listTab || 'all');
  if (!route.tutorId) return renderNotFound();

  const tutor = getTutor(route.tutorId);
  if (!tutor || tutor.deleted_at) return renderNotFound();

  switch (route.screenId) {
    case 'P21-02':
      return renderHub(tutor);
    case 'P21-03a':
      return renderBasicBridge(tutor);
    case 'P21-03b':
      return renderDetailBridge(tutor);
    case 'P21-04':
      return renderPublish(tutor);
    case 'P21-05':
      return renderAccess(tutor);
    case 'P21-06':
      return renderExposure(tutor);
    default:
      return renderHub(tutor);
  }
}

function renderNotFound() {
  return `<section class="mypage-panel p19-panel mypage-empty">
    <p>과외 프로필을 찾을 수 없습니다.</p>
    <a href="#/mypage/registrations/tutors" class="btn btn--secondary" data-p21-nav="/mypage/registrations/tutors">목록으로</a>
  </section>`;
}

/** @param {'all'|'draft'|'published'|'hidden'|'not_ready'} tab */
function renderList(tab) {
  const tutors = getTutorsByTab(tab);
  const counts = getTutorSummaryCounts();
  const docSummary = formatSubmissionDocSummary(getSubmissionDocs('tutor'));
  const tabs = P21_LIST_TABS.map((t) => ({
    ...t,
    count:
      t.key === 'all'
        ? counts.published + counts.draft + counts.hidden
        : t.key === 'draft'
          ? counts.draft
          : t.key === 'published'
            ? counts.published
            : t.key === 'hidden'
              ? counts.hidden
              : counts.notReady,
  }));

  const tabHtml = tabs
    .map(
      (t) =>
        `<a href="#${tutorListTabPath(/** @type {any} */ (t.key))}" class="p19-tab${t.key === tab ? ' is-active' : ''}" data-p21-nav="${tutorListTabPath(/** @type {any} */ (t.key))}">${esc(t.label)} <span class="p19-tab__count">${t.count}</span></a>`,
    )
    .join('');

  const cards =
    tutors.length === 0
      ? `<p class="mypage-empty">해당 상태의 과외 프로필이 없습니다.</p>`
      : `<div class="p19-card-grid">
        ${tutors
          .map((t) => {
            const readiness = getPublishReadiness(t);
            const badge = readiness.canPublish
              ? profileStatusLabel(t.profile_status)
              : '공개 준비 미완료';
            const badgeClass = readiness.canPublish ? t.profile_status : 'draft';
            const boostHint = getProductApplyHint(t);
            return `
          <a href="#${tutorHubPath(t.id)}" class="p19-child-card" data-p21-nav="${tutorHubPath(t.id)}">
            <div class="p19-child-card__head">
              <strong>${esc(t.tutor_display_name)}</strong>
              <span class="mypage-badge mypage-badge--${badgeClass}">${esc(badge)}</span>
            </div>
            <p class="p19-child-card__meta">${esc(formatTutorSummaryLine(t))}</p>
            <p class="p19-child-card__meta p21-card-sub">${esc(docSummary)} · ${esc(boostHint)}</p>
            <span class="p19-child-card__cta">운영하기 →</span>
          </a>`;
          })
          .join('')}
      </div>`;

  return `
    <section class="mypage-panel p19-panel p19-panel--list">
      <header class="p19-list-head">
        <div>
          <h2 class="p19-list-head__title">과외쌤 운영</h2>
          <p class="p19-list-head__lead">프로필별로 공개·학생 접근·노출 상태를 관리합니다. 입력은 tutor-ui에서 합니다.</p>
        </div>
        <a href="${TUTOR_REGISTER_URL}" class="btn btn--primary btn--sm" data-same-tab-href="${TUTOR_REGISTER_URL}">+ 과외 등록</a>
      </header>
      <div class="p19-tabs" role="tablist">${tabHtml}</div>
      ${cards}
      <p class="p19-list-footnote">${LIFECYCLE_FOOTNOTE_REG}</p>
    </section>`;
}

/** @param {{ done: number, total: number, items: { ok: boolean, label: string }[] }} g @param {string} title */
function renderGaugeBlock(g, title) {
  const pct = g.total ? Math.round((g.done / g.total) * 100) : 0;
  const items = g.items
    .map(
      (i) =>
        `<li class="p21-gauge__item${i.ok ? ' is-ok' : ''}"><span>${i.ok ? '✓' : '△'}</span> ${esc(i.label)}</li>`,
    )
    .join('');
  return `
    <div class="p21-gauge">
      <div class="p21-gauge__head">
        <span class="p21-gauge__title">${esc(title)}</span>
        <span class="p21-gauge__count">${g.done}/${g.total}</span>
      </div>
      <div class="p21-gauge__bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100">
        <div class="p21-gauge__fill" style="width: ${pct}%"></div>
      </div>
      <ul class="p21-gauge__list">${items}</ul>
    </div>`;
}

/** @param {ReturnType<typeof getAccessMatrix>[number][]} rows */
function renderMatrixRows(rows, lockedClass = 'p20-matrix') {
  return rows
    .map(
      (m) => `
    <div class="${lockedClass}__row${m.ok ? ' is-ok' : ' is-locked'}">
      <span class="${lockedClass}__label">${m.ok ? '✓' : '🔒'} ${esc(m.label)}</span>
      <span class="${lockedClass}__status">${m.ok ? '가능' : esc(m.reason || '불가')}</span>
    </div>`,
    )
    .join('');
}

/** @param {ReturnType<typeof getExposureMatrix>} rows */
function renderExposureMatrixRows(rows) {
  return rows
    .map((m) => {
      const status = m.statusText ?? (m.ok ? '가능' : m.reason || '불가');
      return `
    <div class="p20-matrix__row${m.ok ? ' is-ok' : ''}">
      <span class="p20-matrix__label">${esc(m.label)}</span>
      <span class="p20-matrix__status">${esc(status)}</span>
    </div>`;
    })
    .join('');
}

/** @param {NonNullable<ReturnType<typeof getUnlockCards>[number]>} card @param {number} tutorId */
function renderUnlockCard(card, tutorId) {
  const steps = card.conditions
    .map(
      (c) =>
        `<li class="p21-unlock-step${c.ok ? ' is-done' : ''}"><span>${c.ok ? '✓' : '△'}</span> ${esc(c.label)}</li>`,
    )
    .join('');
  let cta = '';
  if (card.ctaExternal) {
    cta = `<a href="${card.ctaExternal}" class="btn btn--secondary btn--sm" data-mypage-nav="${card.ctaExternal.replace('#', '')}">${esc(card.ctaLabel)}</a>`;
  } else if (card.ctaPath) {
    const href = tutorSectionPath(tutorId, /** @type {any} */ (card.ctaPath));
    cta = `<a href="#${href}" class="btn btn--secondary btn--sm" data-p21-nav="${href}">${esc(card.ctaLabel)}</a>`;
  }
  return `
    <div class="p21-unlock-card">
      <strong class="p21-unlock-card__title">${esc(card.label)}</strong>
      <p class="p21-unlock-card__remain">조건 ${card.missingCount}개 남음</p>
      <ul class="p21-unlock-steps">${steps}</ul>
      ${cta}
    </div>`;
}

function renderProviderSubToggle() {
  const freeActive = previewState.providerSubscription === 'free' ? ' is-active' : '';
  const paidActive = previewState.providerSubscription === 'paid' ? ' is-active' : '';
  return `
    <div class="p21-sub-toggle msg-toolbar-demo" role="group" aria-label="유료 등급 프리뷰">
      <span class="p21-sub-toggle__label">공급자 구독 (프리뷰)</span>
      <button type="button" class="preview-toolbar__btn${freeActive}" data-provider-subscription="free">무료</button>
      <button type="button" class="preview-toolbar__btn${paidActive}" data-provider-subscription="paid">유료</button>
      <span class="p21-sub-toggle__hint">학생에게 먼저 보내는 쪽지 권한 체험</span>
    </div>`;
}

/** @param {import('./store.js').TutorRecord} tutor */
function renderHubDiagnosis(tutor, readiness) {
  const paid = isPaidProvider();
  const memos = getMemoCreditsRemaining();
  if (tutor.profile_status === 'draft' && !readiness.canPublish) {
    return {
      text: `저장중 · 공개 준비 ${readiness.doneCount}/${readiness.totalCount} · 학생에게 먼저 메모하려면 유료 권한 필요`,
      tone: 'warn',
    };
  }
  if (tutor.profile_status === 'draft' && readiness.canPublish) {
    return { text: '공개 준비가 완료되었습니다. 미리보기 후 공개할 수 있습니다.', tone: 'success' };
  }
  if (tutor.profile_status === 'published') {
    const match = getMatchingVisibility(tutor);
    return {
      text: `공개중 · ${match.status}${paid ? ` · 메모권 ${memos}회 남음` : ' · 콜드 메모는 유료 권한 필요'}`,
      tone: 'success',
    };
  }
  if (tutor.profile_status === 'hidden') {
    return { text: '숨김 상태입니다. 언제든 다시 공개할 수 있습니다.', tone: 'muted' };
  }
  return { text: '과외 프로필 상태를 확인해 주세요.', tone: 'info' };
}

/** @param {import('./store.js').TutorRecord} tutor */
function renderHubCtaBlock(tutor) {
  const ctas = getHubCtas(tutor);
  return ctas
    .map((c) => {
      if (c.external) {
        const isMypage = c.external.startsWith('#/mypage');
        const navAttr = isMypage ? ` data-mypage-nav="${c.external.replace('#', '')}"` : '';
        return `<a href="${c.external}" class="btn ${c.primary ? 'btn--primary' : 'btn--secondary'}"${navAttr}>${esc(c.label)}</a>`;
      }
      const href = tutorSectionPath(tutor.id, /** @type {any} */ (c.path));
      return `<a href="#${href}" class="btn ${c.primary ? 'btn--primary' : 'btn--secondary'}" data-p21-nav="${href}">${esc(c.label)}</a>`;
    })
    .join('');
}

/** @param {import('./store.js').TutorRecord} tutor */
function renderHub(tutor) {
  const readiness = getPublishReadiness(tutor);
  const gauges = getThreeGauges(tutor);
  const accessMatrix = getAccessMatrix(tutor);
  const exposureMatrix = getExposureMatrix(tutor, readiness);
  const matching = getMatchingVisibility(tutor);
  const diag = renderHubDiagnosis(tutor, readiness);

  const readinessList = readiness.missing.length
    ? `<ul class="p19-alert__list">${readiness.missing
        .slice(0, 5)
        .map((m) => `<li>${esc(m)}</li>`)
        .join('')}</ul>`
    : '';

  const body = `
    <div class="p19-hub-body p21-hub-body">
      <div class="p19-alert p19-alert--${diag.tone} p21-hub-alert">
        <p class="p19-alert__text">${esc(diag.text)}</p>
        ${!readiness.canPublish && tutor.profile_status !== 'published' ? readinessList : ''}
      </div>

      <div class="p21-hub-block" data-hub="readiness">
        <h3 class="p21-block__title">공개 준비 ${readiness.doneCount}/${readiness.totalCount}</h3>
        ${
          readiness.missing.length
            ? `<ul class="p19-alert__list">${readiness.missing.map((m) => `<li>${esc(m)}</li>`).join('')}</ul>`
            : '<p class="p20-hint">필수 항목이 모두 충족되었습니다.</p>'
        }
      </div>

      <div class="p21-gauge-grid p21-hub-block" data-hub="gauges">
        ${renderGaugeBlock(gauges.completion, P21_GAUGE_TITLES.completion)}
        ${renderGaugeBlock(gauges.trustInfo, P21_GAUGE_TITLES.trustInfo)}
        ${renderGaugeBlock(gauges.exposureAccess, P21_GAUGE_TITLES.exposureAccess)}
      </div>

      <div class="p21-hub-block" data-hub="access">
        <h3 class="p21-block__title">접근·쪽지 매트릭스</h3>
        <div class="p20-matrix">${renderMatrixRows(accessMatrix)}</div>
      </div>

      <div class="p21-hub-block" data-hub="matching">
        <h3 class="p21-block__title">매칭 가시성</h3>
        <ul class="p21-match-conditions">${matching.conditions.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>
        <p class="p21-match-status${matching.limited ? ' is-limited' : ' is-ok'}">${esc(matching.status)}</p>
        <a href="${getStudentSearchUrl()}" class="btn btn--secondary btn--sm">학생찾기 보기 →</a>
      </div>

      <div class="p21-hub-block" data-hub="exposure">
        <h3 class="p21-block__title">노출 상품 현황</h3>
        <div class="p20-matrix">${renderExposureMatrixRows(exposureMatrix)}</div>
        ${
          readiness.qualityHints.length
            ? `<p class="p20-hint">${esc(readiness.qualityHints.join(' · '))}</p>`
            : ''
        }
      </div>

      <div class="p21-hub-cta p21-hub-block" data-hub="cta">${renderHubCtaBlock(tutor)}</div>

      <div class="p19-summary-grid p21-hub-block" data-hub="summary">
        <dl class="p19-summary-card"><dt>공개 상태</dt><dd>${esc(profileStatusLabel(tutor.profile_status))}</dd></dl>
        <dl class="p19-summary-card"><dt>상세등록</dt><dd>${esc(detailStatusLabel(tutor.detail_completion_status))}</dd></dl>
        <dl class="p19-summary-card"><dt>유료</dt><dd>${isPaidProvider() ? '이용 중' : '이용 안 함'}</dd></dl>
        <dl class="p19-summary-card"><dt>메모권</dt><dd>${getMemoCreditsRemaining()}회</dd></dl>
      </div>
    </div>`;

  return `<section class="mypage-panel p19-panel p19-panel--hub">${renderTutorShell(tutor, 'hub', body)}</section>`;
}

/** @param {import('./store.js').TutorRecord} tutor @param {'basic'|'detail'} kind */
function renderBridgeBody(tutor, kind) {
  const readiness = getPublishReadiness(tutor);
  const isBasic = kind === 'basic';
  const title = isBasic ? '기본정보' : '상세정보';
  const steps = isBasic
    ? [
        { step: 'basic', label: '기본 프로필', ok: !!tutor.tutor_display_name },
        { step: 'regions', label: '활동 시·지역', ok: tutor.has_primary_region },
      ]
    : [
        { step: 'lesson', label: '수업·과목', ok: tutor.has_primary_subject && tutor.has_lesson_places },
        { step: 'career', label: '경력·학력', ok: tutor.education_doc_submitted },
        { step: 'contact', label: '소개·연락', ok: !!(tutor.intro_short || tutor.intro_long) },
      ];

  const items = steps
    .map(
      (s) => `
    <li class="p20-bridge__item${s.ok ? ' is-ok' : ' is-miss'}">
      <span class="p20-bridge__icon">${s.ok ? '✓' : '△'}</span>
      <span class="p20-bridge__label">${esc(s.label)}</span>
      <a href="${tutorUiDeepLink(/** @type {any} */ (s.step), tutor.id)}" class="btn btn--secondary btn--sm" data-same-tab-href="${tutorUiDeepLink(/** @type {any} */ (s.step), tutor.id)}">수정하기</a>
    </li>`,
    )
    .join('');

  return `
    <div class="p20-bridge">
      <h3 class="p19-form-section__title">${title}</h3>
      <p class="p19-form-section__lead">과외쌤 등록 화면에서 정보를 수정합니다. 여기서는 요약과 부족한 항목만 보여드려요.</p>
      <ul class="p20-bridge__list">${items}</ul>
      <dl class="p20-bridge__summary">
        <div><dt>표시명</dt><dd>${esc(tutor.tutor_display_name)}</dd></div>
        <div><dt>활동 시</dt><dd>${esc(tutor.primary_region_label || tutor.location_label || '—')}</dd></div>
        <div><dt>주력과목</dt><dd>${esc(tutor.main_subject_note || '—')}</dd></div>
        <div><dt>상세등록</dt><dd>${esc(detailStatusLabel(tutor.detail_completion_status))}</dd></div>
      </dl>
      ${
        !readiness.canPublish
          ? `<p class="p20-hint">공개 준비 미완료: ${esc(readiness.missing.slice(0, 3).join(', '))}${readiness.missing.length > 3 ? '…' : ''}</p>`
          : ''
      }
      <div class="p19-form-actions">
        <a href="#${tutorSectionPath(tutor.id, 'publish')}" class="btn btn--primary" data-p21-nav="${tutorSectionPath(tutor.id, 'publish')}">미리보기·공개 →</a>
      </div>
    </div>`;
}

function renderBasicBridge(tutor) {
  return `<section class="mypage-panel p19-panel p19-panel--form">${renderTutorShell(tutor, 'basic', renderBridgeBody(tutor, 'basic'))}</section>`;
}

function renderDetailBridge(tutor) {
  return `<section class="mypage-panel p19-panel p19-panel--form">${renderTutorShell(tutor, 'detail', renderBridgeBody(tutor, 'detail'))}</section>`;
}

/** @param {import('./store.js').TutorRecord} tutor */
function renderPublishPreviewModes(tutor) {
  const row = tutorToExposureRow(tutor);
  const modes = [
    {
      key: 'basic',
      label: '기본 노출 목록',
      html: renderBrowseList('tutor', [row], { guest: false, showCompare: false }),
    },
    {
      key: 'pick',
      label: '추천 노출 카드',
      html: `<div class="expo-grid--5">${renderExposureBox('tutor', 'pick', row, '추천 노출 미리보기', { guest: false })}</div>`,
    },
    {
      key: 'detail',
      label: '상세페이지',
      html: `<div class="expo-grid--5">${renderExposureBox('tutor', 'prime', row, '상세 미리보기', { guest: false })}</div>`,
    },
    {
      key: 'compare',
      label: '비교검색 행',
      html: renderBrowseList('tutor', [row], { guest: false, showCompare: true }),
    },
  ];

  const tabs = modes
    .map(
      (m, i) =>
        `<button type="button" class="p21-preview-tab${i === 0 ? ' is-active' : ''}" data-p21-preview-tab="${m.key}">${esc(m.label)}</button>`,
    )
    .join('');

  const panels = modes
    .map(
      (m, i) =>
        `<div class="p21-preview-panel${i === 0 ? ' is-active' : ''}" data-p21-preview-panel="${m.key}">
        <p class="p19-search-preview__label">${esc(m.label)} (11·13장)</p>
        <div class="p19-search-preview__frame">${m.html}</div>
      </div>`,
    )
    .join('');

  return `<div class="p21-preview-modes" data-p21-preview-wrap><div class="p21-preview-tabs" role="tablist">${tabs}</div>${panels}</div>`;
}

/** @param {import('./store.js').TutorRecord} tutor */
function renderPublish(tutor) {
  const r = getPublishReadiness(tutor);
  const preview = renderPublishPreviewModes(tutor);

  const checklist = r.missing.length
    ? r.missing
        .map(
          (m) => `<li class="p19-checklist__item p19-checklist__miss">
        <span class="p19-checklist__icon">△</span><span>${esc(m)}</span>
        <a href="#${tutorSectionPath(tutor.id, m.includes('상세') ? 'detail' : 'basic')}" data-p21-nav="${tutorSectionPath(tutor.id, 'detail')}">브리지 →</a>
      </li>`,
        )
        .join('')
    : '<li class="p19-checklist__item p19-checklist__ok"><span class="p19-checklist__icon">✓</span><span>필수 항목이 모두 충족되었습니다.</span></li>';

  const body = `
    <div class="p19-publish-body" data-p21-tutor-id="${tutor.id}">
      ${preview}
      <div class="p19-checklist-card">
        <h3 class="p19-checklist-card__title">공개 필수 체크리스트</h3>
        <ul class="p19-checklist">${checklist}</ul>
      </div>
      <div class="p20-confirm-card" data-p21-tutor-id="${tutor.id}">
        <h3 class="p20-confirm-card__title">자기확인 — 학부모에게 이렇게 보입니다</h3>
        <label class="p20-confirm-check"><input type="checkbox" data-p21-confirm="region" /> 활동 지역·과목·대상 학생군 노출을 확인했습니다</label>
        <label class="p20-confirm-check"><input type="checkbox" data-p21-confirm="fee" /> 과외비·수업 방식 표시를 확인했습니다</label>
        <label class="p20-confirm-check"><input type="checkbox" data-p21-confirm="trust" /> 소개문·신뢰정보(공개 선택 범위) 노출을 확인했습니다</label>
        <label class="p20-confirm-check"><input type="checkbox" data-p21-confirm="direct" /> 외부 연락처 직접 노출 없음 · ${LIFECYCLE_PUBLISH_CONFIRM_DIRECT}</label>
      </div>
      <div class="p19-form-actions p19-form-actions--publish">
        <button type="button" class="btn btn--primary btn--lg" data-p21-publish ${r.canPublish ? '' : 'disabled'}>공개하기 (published)</button>
        ${
          tutor.profile_status === 'hidden'
            ? '<button type="button" class="btn btn--secondary" data-p21-publish>다시 공개</button>'
            : ''
        }
      </div>
      <p class="p19-publish-footnote">${LIFECYCLE_PUBLISH_CONFIRM_NOTE}</p>
    </div>`;

  return `<section class="mypage-panel p19-panel p19-panel--publish">${renderTutorShell(tutor, 'publish', body)}</section>`;
}

/** @param {import('./store.js').TutorRecord} tutor */
function renderAccess(tutor) {
  const accessMatrix = getAccessMatrix(tutor);
  const matching = getMatchingVisibility(tutor);
  const unlockCards = getUnlockCards(tutor);
  const paid = isPaidProvider();
  const memos = getMemoCreditsRemaining();
  const reviewCount = getStudentReviewIds().length;
  const fromReview = getHandoffFromQuery() === 'review';

  const unlockHtml = unlockCards.length
    ? `<section class="p20-exposure-section"><h3>잠금 해제 (§7-3)</h3><div class="p21-unlock-grid">${unlockCards.map((c) => renderUnlockCard(c, tutor.id)).join('')}</div></section>`
    : `<section class="p20-exposure-section"><h3>잠금 해제 (§7-3)</h3><p class="p20-hint">현재 잠긴 접근 기능이 없습니다.</p></section>`;

  const reviewBridge = `
      <section class="p20-exposure-section p21-review-bridge">
        <h3>관심 학생</h3>
        <p class="p19-form-section__lead">${esc(HANDOFF_DEEPLINK.reviewBridgeLead)}</p>
        <p class="p20-hint">${esc(HANDOFF_DEEPLINK.reviewFlow)}</p>
        <div class="p19-summary-grid" style="margin-top:var(--space-3)">
          <dl class="p19-summary-card"><dt>검토함</dt><dd>${reviewCount}건</dd></dl>
          <dl class="p19-summary-card"><dt>남은 메모</dt><dd>${memos}회</dd></dl>
        </div>
        <div class="p19-form-actions" style="margin-top:var(--space-3)">
          <a href="#${studentReviewPath({ from: 'access' })}" class="btn btn--primary" data-mypage-nav="${studentReviewPath({ from: 'access' })}">${esc(P21_ACCESS_CTA.studentReview)}${reviewCount ? ` · ${reviewCount}건` : ''}</a>
        </div>
      </section>`;

  const body = `
    <div class="p21-access-body" data-p21-tutor-id="${tutor.id}">
      ${fromReview ? `<div class="handoff-deeplink-banner" role="status">${esc(HANDOFF_DEEPLINK.accessFromReview)}</div>` : ''}
      ${renderProviderSubToggle()}
      <section class="p20-exposure-section">
        <h3>현재 이용 가능한 범위</h3>
        <p class="p19-form-section__lead">과외쌤 운영 핵심 — 쪽지·학생 접근 권한</p>
        <div class="p20-matrix">${renderMatrixRows(accessMatrix)}</div>
      </section>
      <section class="p20-exposure-section">
        <h3>잔여 권한</h3>
        <div class="p19-summary-grid">
          <dl class="p19-summary-card"><dt>유료 이용</dt><dd>${paid ? '이용 중' : '이용 안 함'}</dd></dl>
          <dl class="p19-summary-card"><dt>남은 메모</dt><dd>${memos}회</dd></dl>
          <dl class="p19-summary-card"><dt>매칭</dt><dd>${esc(matching.status)}</dd></dl>
        </div>
      </section>
      ${unlockHtml}
      ${reviewBridge}
      <section class="p20-exposure-section p21-access-links">
        <h3>다음 행동 (§7-5)</h3>
        <div class="p19-form-actions">
          <a href="${getStudentSearchUrl()}" class="btn btn--primary">학생찾기 보기 (9·13장)</a>
          <a href="#/mypage/messages/inbox" class="btn btn--secondary" data-mypage-nav="/mypage/messages/inbox">쪽지함 열기</a>
          <a href="#/plans/access?provider_type=tutor&provider_id=${tutor.id}" class="btn btn--secondary" data-nav="/plans/access?provider_type=tutor&provider_id=${tutor.id}">접근권·쪽지권</a>
        </div>
      </section>
      <p class="p19-form-section__lead">
        <a href="#/mypage/submission-docs" data-mypage-nav="/mypage/submission-docs">제출자료 상태</a>
        · 학부모가 먼저 보낸 연락의 답장은 무료 · 학생에게 먼저 보내는 쪽지는 유료
      </p>
    </div>`;

  return `<section class="mypage-panel p19-panel p19-panel--form">${renderTutorShell(tutor, 'access', body)}</section>`;
}

/** @param {import('./store.js').TutorRecord} tutor */
function renderExposure(tutor) {
  const readiness = getPublishReadiness(tutor);
  const matrix = getExposureMatrix(tutor, readiness);
  const pickRow = matrix.find((m) => m.key === 'pick');
  const primeRow = matrix.find((m) => m.key === 'prime');

  const body = `
    <div class="p20-exposure-body" data-p21-tutor-id="${tutor.id}">
      <section class="p20-exposure-section">
        <h3>노출 가능 조건 (§4-5)</h3>
        <div class="p20-matrix">${renderExposureMatrixRows(matrix)}</div>
      </section>
      <section class="p20-exposure-section p20-plans-cta">
        <h3>추천·대표 노출</h3>
        <p class="p19-form-section__lead">대표·추천 노출은 기간형 상품 · 쪽지권/열람권은 횟수형 상품</p>
        <div class="p19-form-actions">
          <button type="button" class="btn btn--secondary" ${pickRow?.ok ? '' : 'disabled'}>${esc(pickRow?.statusText || '추천 노출')}</button>
          <button type="button" class="btn btn--secondary" ${primeRow?.ok ? '' : 'disabled'}>${esc(primeRow?.statusText || '대표 노출')}</button>
          <a href="#/plans/positions?provider_type=tutor&provider_id=${tutor.id}" class="btn btn--primary" data-nav="/plans/positions?provider_type=tutor&provider_id=${tutor.id}">유료상품 · 노출</a>
        </div>
      </section>
      <div class="p19-danger-zone" data-p21-tutor-id="${tutor.id}">
        <h3 class="p19-danger-zone__title">공개 중단·삭제</h3>
        <p class="p19-danger-zone__lead">숨김은 검색 미노출 · 삭제는 복구 불가(soft delete)</p>
        <div class="p19-danger-zone__actions">
          <button type="button" class="btn btn--secondary btn--sm" data-p21-hide ${tutor.profile_status === 'hidden' ? 'disabled' : ''}>숨김</button>
          <button type="button" class="btn btn--ghost btn--sm p19-btn-danger" data-p21-delete>삭제</button>
        </div>
      </div>
    </div>`;

  return `<section class="mypage-panel p19-panel p19-panel--form">${renderTutorShell(tutor, 'exposure', body)}</section>`;
}

/** @param {HTMLElement} root @param {() => void} rerender */
export function bindTutorRegEvents(root, rerender) {
  root.querySelectorAll('[data-p21-nav]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.hash = el.getAttribute('data-p21-nav') || '/mypage/registrations/tutors';
    });
  });

  root.querySelectorAll('[data-p21-preview-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-p21-preview-tab');
      const wrap = btn.closest('[data-p21-preview-wrap]');
      if (!wrap || !key) return;
      wrap.querySelectorAll('[data-p21-preview-tab]').forEach((t) => t.classList.toggle('is-active', t === btn));
      wrap.querySelectorAll('[data-p21-preview-panel]').forEach((p) => {
        p.classList.toggle('is-active', p.getAttribute('data-p21-preview-panel') === key);
      });
    });
  });

  root.querySelectorAll('[data-p21-publish]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const wrap = btn.closest('[data-p21-tutor-id]') || btn.closest('.p19-publish-body');
      const id = Number(wrap?.dataset.p21TutorId || root.querySelector('[data-p21-tutor-id]')?.dataset.p21TutorId);
      const confirms = root.querySelectorAll('[data-p21-confirm]');
      const allChecked = [...confirms].every((c) => /** @type {HTMLInputElement} */ (c).checked);
      if (!allChecked) {
        alert('자기확인 항목을 모두 체크해 주세요.');
        return;
      }
      try {
        const result = await publishTutor(id);
        if (!result.ok) {
          alert(`공개 불가:\n${result.missing?.join('\n') || result.reason}`);
          return;
        }
        alert('공개되었습니다. (profile_status: published)');
        rerender();
      } catch (err) {
        console.warn('[p21]', err);
        if (err?.code === 'email_verify_required') {
          showEmailVerifyOverlay();
          return;
        }
        alert('공개 처리에 실패했습니다.');
      }
    });
  });

  root.querySelectorAll('[data-p21-hide]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = Number(btn.closest('[data-p21-tutor-id]')?.dataset.p21TutorId);
      if (!confirm('과외 프로필을 숨김 처리하시겠습니까?')) return;
      try {
        await hideTutor(id);
        rerender();
      } catch (err) {
        console.warn('[p21]', err);
        alert('숨김 처리에 실패했습니다.');
      }
    });
  });

  root.querySelectorAll('[data-p21-delete]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = Number(btn.closest('[data-p21-tutor-id]')?.dataset.p21TutorId);
      if (!confirm('삭제하시겠습니까? (deleted_at)')) return;
      try {
        await deleteTutor(id);
        window.location.hash = '/mypage/registrations/tutors';
        rerender();
      } catch (err) {
        console.warn('[p21]', err);
        alert('삭제에 실패했습니다.');
      }
    });
  });

  root.querySelectorAll('[data-provider-subscription]').forEach((btn) => {
    btn.addEventListener('click', () => {
      previewState.providerSubscription = /** @type {'free'|'paid'} */ (btn.getAttribute('data-provider-subscription'));
      rerender();
    });
  });
}
