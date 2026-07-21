import {
  LIFECYCLE_FOOTNOTE_REG,
  LIFECYCLE_PUBLISH_CONFIRM_DIRECT,
  LIFECYCLE_PUBLISH_CONFIRM_NOTE,
  publishReadinessLabel,
} from '../lifecycle-copy.js';
import { renderBrowseList } from '../exposure-render.js';
import { STUDY_ROOM_REGISTER_URL } from '../nav-config.js';
import {
  P20_LIST_TABS,
  PHASE_STEPS,
  P20_HUB_BLOCK_TITLES,
  P20_EXPOSURE_SECTION_TITLES,
  P20_LIST_HEAD,
  P20_PREVIEW_MODES,
  P20_HUB_CTA,
  INQUIRY_OPTIONS,
} from './study-room-reg-copy.js';
import {
  parseStudyRoomRegPath,
  studyRoomHubPath,
  studyRoomSectionPath,
  studyRoomListTabPath,
  STUDY_ROOM_REG_MENUS,
} from './router.js';
import {
  formatRoomSummaryLine,
  profileStatusLabel,
  inquiryStatusLabel,
  detailStatusLabel,
  roomToExposureRow,
  studyRoomUiDeepLink,
  getExposureMatrix,
  getExposureDetailBlocks,
  getHubCtas,
} from './format.js';
import {
  getStudyRoomsByTab,
  getStudyRoom,
  getPublishReadiness,
  publishStudyRoom,
  hideStudyRoom,
  deleteStudyRoom,
  setInquiryStatus,
  getStudyRoomSummaryCounts,
} from './store.js';
import { showEmailVerifyOverlay } from '../email-verify-overlay.js';
import { getStudentReviewIds } from '../student-review-store.js';
import { HANDOFF_DEEPLINK } from '../handoff-copy.js';
import { studentReviewPath, getHandoffFromQuery } from '../handoff-link.js';
import { getStudentSearchUrl } from '../tutor-reg/format.js';

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

/** @param {{ label: string, ok: boolean, reason?: string | null, statusText?: string | null }[]} rows */
function renderMatrixRows(rows) {
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

/** @param {import('./store.js').StudyRoomRecord} room */
function renderHubCtaBlock(room) {
  return getHubCtas(room)
    .map((c) => {
      if (c.external) {
        return `<a href="${c.external}" class="btn ${c.primary ? 'btn--primary' : 'btn--secondary'}" data-mypage-nav="${c.external.replace('#', '')}">${esc(c.label)}</a>`;
      }
      const href = studyRoomSectionPath(room.id, /** @type {any} */ (c.path));
      return `<a href="#${href}" class="btn ${c.primary ? 'btn--primary' : 'btn--secondary'}" data-p20-nav="${href}">${esc(c.label)}</a>`;
    })
    .join('');
}

/** @param {import('./store.js').StudyRoomRecord} room @param {string} activeSection */
function renderPhaseStepper(room, activeSection) {
  if (activeSection === 'hub') return '';
  const stepIndex = PHASE_STEPS.findIndex((s) => s.key === activeSection);
  const progressPct = stepIndex >= 0 ? Math.round(((stepIndex + 1) / PHASE_STEPS.length) * 100) : 0;

  const items = PHASE_STEPS.map((step, i) => {
    const href = studyRoomSectionPath(room.id, /** @type {any} */ (step.key));
    const isActive = activeSection === step.key;
    const readiness = getPublishReadiness(room);
    const isDone =
      (step.key === 'basic' && room.has_regions && room.study_room_name) ||
      (step.key === 'detail' && room.detail_completion_status === 'expanded_complete') ||
      (step.key === 'publish' && room.profile_status === 'published') ||
      (step.key === 'exposure' && room.profile_status === 'published');
    const state = isActive ? 'is-active' : isDone ? 'is-done' : '';
    const arrow = i < PHASE_STEPS.length - 1 ? '<span class="p19-stepper__arrow" aria-hidden="true">›</span>' : '';
    return `
      <a href="#${href}" class="p19-stepper__step ${state}" data-p20-nav="${href}">
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

/** @param {import('./store.js').StudyRoomRecord} room @param {string} activeSection @param {string} bodyHtml */
function renderRoomShell(room, activeSection, bodyHtml) {
  const readiness = getPublishReadiness(room);
  const navItems = STUDY_ROOM_REG_MENUS.map((m) => {
    const href = studyRoomSectionPath(room.id, /** @type {any} */ (m.key));
    const active = activeSection === m.key ? ' is-active' : '';
    return `<a href="#${href}" class="p19-sidebar-nav__link${active}" data-p20-nav="${href}">${esc(m.label)}</a>`;
  }).join('');

  const hubActive = activeSection === 'hub' ? ' is-active' : '';
  const readinessText = publishReadinessLabel(readiness.canPublish, readiness.missing.length);

  return `
    <div class="p19-frame">
      <aside class="p19-sidebar" aria-label="공부방 운영">
        <div class="p19-sidebar__top">
          <a href="#/mypage/registrations/study-rooms" class="p19-back" data-p20-nav="/mypage/registrations/study-rooms">← 목록</a>
          <span class="p19-sidebar__readiness mypage-badge${readiness.canPublish ? ' p19-readiness--ok' : ' p19-readiness--pending'}">${esc(readinessText)}</span>
        </div>
        <div class="p19-student-card">
          <div class="p19-student-card__avatar" aria-hidden="true">${esc((room.study_room_name || '?').charAt(0))}</div>
          <div class="p19-student-card__body">
            <strong class="p19-student-card__name">${esc(room.study_room_name)}</strong>
            <span class="mypage-badge mypage-badge--${room.profile_status}">${esc(profileStatusLabel(room.profile_status))}</span>
            <p class="p19-student-card__meta">${esc(formatRoomSummaryLine(room))}</p>
            <p class="p19-student-card__meta p20-inquiry-badge">${esc(inquiryStatusLabel(room.inquiry_status))}</p>
          </div>
        </div>
        <nav class="p19-sidebar-nav" aria-label="공부방 운영 메뉴">
          <a href="#${studyRoomHubPath(room.id)}" class="p19-sidebar-nav__link p19-sidebar-nav__link--overview${hubActive}" data-p20-nav="${studyRoomHubPath(room.id)}">운영 홈</a>
          ${navItems}
          <a href="#/plans/positions?provider_type=study_room&provider_id=${room.id}" class="p19-sidebar-nav__link" data-nav="/plans/positions?provider_type=study_room&provider_id=${room.id}">유료·상품</a>
        </nav>
        <div class="p19-sidebar-status">
          <span class="p19-sidebar-status__label">공개 준비</span>
          <span class="p19-sidebar-status__value${readiness.canPublish ? ' is-ready' : ''}">${readiness.doneCount}/${readiness.totalCount}</span>
        </div>
      </aside>
      <div class="p19-frame__body">
        ${renderPhaseStepper(room, activeSection)}
        ${bodyHtml}
      </div>
    </div>`;
}

/** @param {string} path */
export function renderStudyRoomRegScreen(path) {
  const route = parseStudyRoomRegPath(path);
  if (!route) return '';

  if (route.screenId === 'P20-01') return renderList(route.listTab || 'all');
  if (!route.roomId) return renderNotFound();

  const room = getStudyRoom(route.roomId);
  if (!room || room.deleted_at) return renderNotFound();

  switch (route.screenId) {
    case 'P20-02':
      return renderHub(room);
    case 'P20-03a':
      return renderBasicBridge(room);
    case 'P20-03b':
      return renderDetailBridge(room);
    case 'P20-04':
      return renderPublish(room);
    case 'P20-05':
      return renderExposure(room);
    default:
      return renderHub(room);
  }
}

function renderNotFound() {
  return `<section class="mypage-panel p19-panel mypage-empty">
    <p>공부방 정보를 찾을 수 없습니다.</p>
    <a href="#/mypage/registrations/study-rooms" class="btn btn--secondary" data-p20-nav="/mypage/registrations/study-rooms">목록으로</a>
  </section>`;
}

/** @param {'all'|'draft'|'published'|'hidden'|'not_ready'} tab */
function renderList(tab) {
  const rooms = getStudyRoomsByTab(tab);
  const counts = getStudyRoomSummaryCounts();
  const tabs = P20_LIST_TABS.map((t) => ({
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
        `<a href="#${studyRoomListTabPath(/** @type {any} */ (t.key))}" class="p19-tab${t.key === tab ? ' is-active' : ''}" data-p20-nav="${studyRoomListTabPath(/** @type {any} */ (t.key))}">${esc(t.label)} <span class="p19-tab__count">${t.count}</span></a>`,
    )
    .join('');

  const cards =
    rooms.length === 0
      ? `<p class="mypage-empty">해당 상태의 공부방이 없습니다.</p>`
      : `<div class="p19-card-grid">
        ${rooms
          .map((r) => {
            const readiness = getPublishReadiness(r);
            const badge = readiness.canPublish
              ? profileStatusLabel(r.profile_status)
              : P20_LIST_HEAD.notReadyBadge;
            const badgeClass = readiness.canPublish ? r.profile_status : 'draft';
            return `
          <a href="#${studyRoomHubPath(r.id)}" class="p19-child-card" data-p20-nav="${studyRoomHubPath(r.id)}">
            <div class="p19-child-card__head">
              <strong>${esc(r.study_room_name)}</strong>
              <span class="mypage-badge mypage-badge--${badgeClass}">${esc(badge)}</span>
            </div>
            <p class="p19-child-card__meta">${esc(formatRoomSummaryLine(r))}</p>
            <p class="p19-child-card__meta p20-inquiry-badge">상담: ${esc(inquiryStatusLabel(r.inquiry_status))}</p>
            <span class="p19-child-card__cta">${esc(P20_LIST_HEAD.manageCta)}</span>
          </a>`;
          })
          .join('')}
      </div>`;

  return `
    <section class="mypage-panel p19-panel p19-panel--list">
      <header class="p19-list-head">
        <div>
          <h2 class="p19-list-head__title">${esc(P20_LIST_HEAD.title)}</h2>
          <p class="p19-list-head__lead">${esc(P20_LIST_HEAD.lead)}</p>
        </div>
        <a href="${STUDY_ROOM_REGISTER_URL}" class="btn btn--primary btn--sm" data-same-tab-href="${STUDY_ROOM_REGISTER_URL}">${esc(P20_LIST_HEAD.registerCta)}</a>
      </header>
      <div class="p19-tabs" role="tablist">${tabHtml}</div>
      ${cards}
      <p class="p19-list-footnote">${LIFECYCLE_FOOTNOTE_REG}</p>
    </section>`;
}

/** @param {import('./store.js').StudyRoomRecord} room */
function renderReviewBridgeBlock(room) {
  if (room.profile_status !== 'published') return '';
  const reviewCount = getStudentReviewIds().length;
  return `
    <div class="p20-hub-block p21-review-bridge">
      <h3 class="p20-hub-block__title">관심 학생</h3>
      <p class="p19-form-section__lead">${esc(HANDOFF_DEEPLINK.reviewBridgeLead)}</p>
      <p class="p20-hint">${esc(HANDOFF_DEEPLINK.reviewFlow)}</p>
      <div class="p19-summary-grid" style="margin-top:var(--space-3)">
        <dl class="p19-summary-card"><dt>검토함</dt><dd>${reviewCount}건</dd></dl>
        <dl class="p19-summary-card"><dt>상담</dt><dd>${esc(inquiryStatusLabel(room.inquiry_status))}</dd></dl>
      </div>
      <div class="p19-form-actions" style="margin-top:var(--space-3)">
        <a href="#${studentReviewPath({ from: 'exposure' })}" class="btn btn--primary" data-mypage-nav="${studentReviewPath({ from: 'exposure' })}">${esc(P20_HUB_CTA.studentReview)}${reviewCount ? ` · ${reviewCount}건` : ''}</a>
        <a href="${getStudentSearchUrl()}" class="btn btn--secondary" data-same-tab-href="${getStudentSearchUrl()}">${esc(P20_HUB_CTA.studentSearch)}</a>
      </div>
    </div>`;
}

/** @param {import('./store.js').StudyRoomRecord} room */
function renderHub(room) {
  const readiness = getPublishReadiness(room);
  const matrix = getExposureMatrix(room, readiness);

  let diagnosis = '공부방 상태를 확인해 주세요.';
  let tone = 'info';
  if (room.profile_status === 'draft' && readiness.canPublish) {
    diagnosis = '공개 준비가 완료되었습니다. 미리보기 후 공개할 수 있습니다.';
    tone = 'success';
  } else if (room.profile_status === 'draft') {
    diagnosis = `공개 준비 미완료 · ${readiness.missing.length}개 항목이 필요합니다.`;
    tone = 'warn';
  } else if (room.profile_status === 'published') {
    diagnosis = `공개중 · ${inquiryStatusLabel(room.inquiry_status)} · 검색·비교 노출 중`;
    tone = 'success';
  } else if (room.profile_status === 'hidden') {
    diagnosis = '숨김 상태입니다. 언제든 다시 공개할 수 있습니다.';
    tone = 'muted';
  }

  const readinessBlock = `
    <div class="p20-hub-block">
      <h3 class="p20-hub-block__title">${esc(P20_HUB_BLOCK_TITLES.readiness)} ${readiness.doneCount}/${readiness.totalCount}</h3>
      ${
        readiness.missing.length
          ? `<ul class="p19-alert__list">${readiness.missing.map((m) => `<li>${esc(m)}</li>`).join('')}</ul>`
          : '<p class="p20-hint">필수 항목이 모두 충족되었습니다.</p>'
      }
    </div>`;

  const body = `
    <div class="p19-hub-body p20-hub-body">
      <div class="p19-alert p19-alert--${tone}">
        <p class="p19-alert__text">${esc(diagnosis)}</p>
      </div>

      ${readinessBlock}

      <div class="p20-hub-block">
        <h3 class="p20-hub-block__title">${esc(P20_HUB_BLOCK_TITLES.publishStatus)}</h3>
        <p class="p20-hub-status-line">
          <span class="mypage-badge mypage-badge--${room.profile_status}">${esc(profileStatusLabel(room.profile_status))}</span>
          <span class="p20-hub-status-detail">상세등록: ${esc(detailStatusLabel(room.detail_completion_status))}</span>
        </p>
      </div>

      <div class="p20-hub-block">
        <h3 class="p20-hub-block__title">${esc(P20_HUB_BLOCK_TITLES.exposureMatrix)}</h3>
        <div class="p20-matrix">${renderMatrixRows(matrix)}</div>
        ${
          readiness.qualityHints.length
            ? `<p class="p20-hint">${esc(readiness.qualityHints.join(' · '))}</p>`
            : ''
        }
      </div>

      <div class="p20-hub-block p20-inquiry-board">
        <h3 class="p20-hub-block__title">${esc(P20_HUB_BLOCK_TITLES.inquiryBoard)}</h3>
        <p class="p20-inquiry-board__value">${esc(inquiryStatusLabel(room.inquiry_status))}</p>
        <p class="p20-hint">원장이 직접 선택 · 운영자 승인 없음 (20§4-3 · 22장)</p>
        <a href="#${studyRoomSectionPath(room.id, 'exposure')}" class="btn btn--secondary btn--sm" data-p20-nav="${studyRoomSectionPath(room.id, 'exposure')}">상담 상태 변경 →</a>
      </div>

      ${renderReviewBridgeBlock(room)}

      <div class="p20-hub-cta">${renderHubCtaBlock(room)}</div>
    </div>`;

  return `<section class="mypage-panel p19-panel p19-panel--hub">${renderRoomShell(room, 'hub', body)}</section>`;
}

/** @param {import('./store.js').StudyRoomRecord} room @param {'basic'|'detail'} kind */
function renderBridgeBody(room, kind) {
  const readiness = getPublishReadiness(room);
  const isBasic = kind === 'basic';
  const title = isBasic ? '기본정보' : '상세정보';
  const steps = isBasic
    ? [
        { step: 'basic', label: '기본 프로필', ok: !!room.study_room_name },
        { step: 'location', label: '위치·지역', ok: room.has_regions },
      ]
    : [
        { step: 'lesson', label: '수업·과목', ok: room.has_subject_targets && room.lesson_place_set },
        { step: 'career', label: '경력·소개', ok: !!room.intro_short || !!room.intro_long },
        { step: 'facility', label: '시설·이미지', ok: room.has_representative_image },
      ];

  const items = steps
    .map(
      (s) => `
    <li class="p20-bridge__item${s.ok ? ' is-ok' : ' is-miss'}">
      <span class="p20-bridge__icon">${s.ok ? '✓' : '△'}</span>
      <span class="p20-bridge__label">${esc(s.label)}</span>
      <a href="${studyRoomUiDeepLink(s.step, room.id)}" class="btn btn--secondary btn--sm" data-same-tab-href="${studyRoomUiDeepLink(s.step, room.id)}">수정하기</a>
    </li>`,
    )
    .join('');

  return `
    <div class="p20-bridge">
      <h3 class="p19-form-section__title">${title}</h3>
      <p class="p19-form-section__lead">공부방 등록 화면에서 정보를 수정합니다. 여기서는 요약과 부족한 항목만 보여드려요.</p>
      <ul class="p20-bridge__list">${items}</ul>
      <dl class="p20-bridge__summary">
        <div><dt>공부방명</dt><dd>${esc(room.study_room_name)}</dd></div>
        <div><dt>지역</dt><dd>${esc(room.region_label || '—')}</dd></div>
        <div><dt>과목</dt><dd>${esc(room.main_subject_note || '—')}</dd></div>
        <div><dt>상세등록</dt><dd>${esc(detailStatusLabel(room.detail_completion_status))}</dd></div>
      </dl>
      ${
        !readiness.canPublish
          ? `<p class="p20-hint">공개 준비 미완료: ${esc(readiness.missing.slice(0, 3).join(', '))}${readiness.missing.length > 3 ? '…' : ''}</p>`
          : ''
      }
      <div class="p19-form-actions">
        <a href="#${studyRoomSectionPath(room.id, 'publish')}" class="btn btn--primary" data-p20-nav="${studyRoomSectionPath(room.id, 'publish')}">미리보기·공개 →</a>
      </div>
    </div>`;
}

function renderBasicBridge(room) {
  return `<section class="mypage-panel p19-panel p19-panel--form">${renderRoomShell(room, 'basic', renderBridgeBody(room, 'basic'))}</section>`;
}

function renderDetailBridge(room) {
  return `<section class="mypage-panel p19-panel p19-panel--form">${renderRoomShell(room, 'detail', renderBridgeBody(room, 'detail'))}</section>`;
}

/** @param {import('./store.js').StudyRoomRecord} room */
function renderPublishPreviewModes(room) {
  const row = roomToExposureRow(room);
  const modes = P20_PREVIEW_MODES.map((m) => ({
    ...m,
    html: renderBrowseList(
      'study_room',
      [row],
      { guest: false, showCompare: m.key === 'compare' },
    ),
  }));

  const tabs = modes
    .map(
      (m, i) =>
        `<button type="button" class="p21-preview-tab${i === 0 ? ' is-active' : ''}" data-p20-preview-tab="${m.key}">${esc(m.label)}</button>`,
    )
    .join('');

  const panels = modes
    .map(
      (m, i) =>
        `<div class="p21-preview-panel${i === 0 ? ' is-active' : ''}" data-p20-preview-panel="${m.key}">
        <p class="p19-search-preview__label">${esc(m.label)} (11·13장)</p>
        <div class="p19-search-preview__frame">${m.html}</div>
      </div>`,
    )
    .join('');

  return `<div class="p21-preview-modes" data-p20-preview-wrap><div class="p21-preview-tabs" role="tablist">${tabs}</div>${panels}</div>`;
}

/** @param {import('./store.js').StudyRoomRecord} room */
function renderPublish(room) {
  const r = getPublishReadiness(room);
  const preview = renderPublishPreviewModes(room);

  const checklist = r.missing.length
    ? r.missing
        .map(
          (m) => `<li class="p19-checklist__item p19-checklist__miss">
        <span class="p19-checklist__icon">△</span><span>${esc(m)}</span>
        <a href="#${studyRoomSectionPath(room.id, m.includes('상세') ? 'detail' : 'basic')}" data-p20-nav="${studyRoomSectionPath(room.id, 'detail')}">브리지 →</a>
      </li>`,
        )
        .join('')
    : '<li class="p19-checklist__item p19-checklist__ok"><span class="p19-checklist__icon">✓</span><span>필수 항목이 모두 충족되었습니다.</span></li>';

  const body = `
    <div class="p19-publish-body" data-p20-room-id="${room.id}">
      ${preview}
      <div class="p19-checklist-card">
        <h3 class="p19-checklist-card__title">공개 필수 체크리스트</h3>
        <ul class="p19-checklist">${checklist}</ul>
      </div>
      <div class="p20-confirm-card" data-p20-room-id="${room.id}">
        <h3 class="p20-confirm-card__title">자기확인 — 학부모에게 이렇게 보입니다</h3>
        <label class="p20-confirm-check"><input type="checkbox" data-p20-confirm="location" /> 위치·주소 공개 범위를 확인했습니다</label>
        <label class="p20-confirm-check"><input type="checkbox" data-p20-confirm="contact" /> 연락·문의 방식 표시를 확인했습니다</label>
        <label class="p20-confirm-check"><input type="checkbox" data-p20-confirm="content" /> 대상·과목·소개문 노출을 확인했습니다</label>
        <label class="p20-confirm-check"><input type="checkbox" data-p20-confirm="direct" /> ${LIFECYCLE_PUBLISH_CONFIRM_DIRECT}</label>
      </div>
      <div class="p19-form-actions p19-form-actions--publish">
        <button type="button" class="btn btn--primary btn--lg" data-p20-publish ${r.canPublish ? '' : 'disabled'}>공개하기 (published)</button>
        ${
          room.profile_status === 'hidden'
            ? '<button type="button" class="btn btn--secondary" data-p20-publish>다시 공개</button>'
            : ''
        }
      </div>
      <p class="p19-publish-footnote">${LIFECYCLE_PUBLISH_CONFIRM_NOTE}</p>
    </div>`;

  return `<section class="mypage-panel p19-panel p19-panel--publish">${renderRoomShell(room, 'publish', body)}</section>`;
}

/** @param {import('./store.js').StudyRoomRecord} room */
function renderExposure(room) {
  const readiness = getPublishReadiness(room);
  const blocks = getExposureDetailBlocks(room, readiness);
  const fromReview = getHandoffFromQuery() === 'review';

  const inquiryRadios = INQUIRY_OPTIONS.map(
    (o) => `
    <label class="p20-inquiry-option${room.inquiry_status === o.value ? ' is-selected' : ''}">
      <input type="radio" name="inquiry_status" value="${esc(o.value)}" ${room.inquiry_status === o.value ? 'checked' : ''} />
      <span class="p20-inquiry-option__label">${esc(o.label)}</span>
      <span class="p20-inquiry-option__desc">${esc(o.desc)}</span>
    </label>`,
  ).join('');

  const body = `
    <div class="p20-exposure-body" data-p20-room-id="${room.id}">
      ${fromReview ? `<div class="handoff-deeplink-banner" role="status">${esc(HANDOFF_DEEPLINK.accessFromReview)}</div>` : ''}
      ${renderReviewBridgeBlock(room)}
      <section class="p20-exposure-section">
        <h3>${esc(P20_EXPOSURE_SECTION_TITLES.searchCompare)}</h3>
        <div class="p20-matrix">${renderMatrixRows(blocks.slice(0, 3))}</div>
      </section>
      <section class="p20-exposure-section">
        <h3>${esc(P20_EXPOSURE_SECTION_TITLES.inquiry)}</h3>
        <p class="p19-form-section__lead">원장이 직접 선택 · 운영자 승인·심사 없음 (22장)</p>
        <div class="p20-inquiry-options">${inquiryRadios}</div>
        <button type="button" class="btn btn--secondary btn--sm" data-p20-inquiry-save>상담 상태 저장</button>
      </section>
      <section class="p20-exposure-section">
        <h3>${esc(P20_EXPOSURE_SECTION_TITLES.capacity)}</h3>
        <div class="p20-matrix">${renderMatrixRows([blocks[3]])}</div>
      </section>
      <section class="p20-exposure-section p20-plans-cta">
        <h3>${esc(P20_EXPOSURE_SECTION_TITLES.plans)}</h3>
        <div class="p20-matrix">${renderMatrixRows(blocks.slice(4))}</div>
        <p class="p19-form-section__lead">노출 강화 상품은 이용 현황에서 확인합니다.</p>
        <a href="#/plans/positions?provider_type=study_room&provider_id=${room.id}" class="btn btn--secondary" data-nav="/plans/positions?provider_type=study_room&provider_id=${room.id}">유료상품 · 노출</a>
      </section>
      <section class="p20-exposure-section p20-messages-link">
        <h3>${esc(P20_EXPOSURE_SECTION_TITLES.messages)}</h3>
        <p class="p19-form-section__lead">문의·상담은 쪽지함에서 확인합니다. 운영센터 주인공은 상담 수용 상태입니다. (16§1-3)</p>
        <a href="#/mypage/messages/inbox" class="btn btn--secondary btn--sm" data-mypage-nav="/mypage/messages/inbox">쪽지함 열기</a>
      </section>
      <div class="p19-danger-zone" data-p20-room-id="${room.id}">
        <h3 class="p19-danger-zone__title">${esc(P20_EXPOSURE_SECTION_TITLES.danger)}</h3>
        <p class="p19-danger-zone__lead">숨김은 검색 미노출 · 삭제는 복구 불가(soft delete)</p>
        <div class="p19-danger-zone__actions">
          <button type="button" class="btn btn--secondary btn--sm" data-p20-hide ${room.profile_status === 'hidden' ? 'disabled' : ''}>숨김</button>
          <button type="button" class="btn btn--ghost btn--sm p19-btn-danger" data-p20-delete>삭제</button>
        </div>
      </div>
    </div>`;

  return `<section class="mypage-panel p19-panel p19-panel--form">${renderRoomShell(room, 'exposure', body)}</section>`;
}

/** @param {HTMLElement} root @param {() => void} rerender */
export function bindStudyRoomRegEvents(root, rerender) {
  root.querySelectorAll('[data-p20-nav]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.hash = el.getAttribute('data-p20-nav') || '/mypage/registrations/study-rooms';
    });
  });

  root.querySelectorAll('[data-p20-publish]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const wrap = btn.closest('[data-p20-room-id]') || btn.closest('.p19-publish-body');
      const id = Number(wrap?.dataset.p20RoomId || root.querySelector('[data-p20-room-id]')?.dataset.p20RoomId);
      const confirms = root.querySelectorAll('[data-p20-confirm]');
      const allChecked = [...confirms].every((c) => /** @type {HTMLInputElement} */ (c).checked);
      if (!allChecked) {
        alert('자기확인 항목을 모두 체크해 주세요.');
        return;
      }
      try {
        const result = await publishStudyRoom(id);
        if (!result.ok) {
          alert(`공개 불가:\n${result.missing?.join('\n') || result.reason}`);
          return;
        }
        alert('공개되었습니다. (profile_status: published)');
        rerender();
      } catch (err) {
        console.warn('[p20]', err);
        if (err?.code === 'email_verify_required') {
          showEmailVerifyOverlay();
          return;
        }
        alert('공개 처리에 실패했습니다.');
      }
    });
  });

  root.querySelectorAll('[data-p20-hide]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = Number(btn.closest('[data-p20-room-id]')?.dataset.p20RoomId);
      if (!confirm('공부방을 숨김 처리하시겠습니까?')) return;
      try {
        await hideStudyRoom(id);
        rerender();
      } catch (err) {
        console.warn('[p20]', err);
        alert('숨김 처리에 실패했습니다.');
      }
    });
  });

  root.querySelectorAll('[data-p20-delete]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = Number(btn.closest('[data-p20-room-id]')?.dataset.p20RoomId);
      if (!confirm('삭제하시겠습니까? (deleted_at)')) return;
      try {
        await deleteStudyRoom(id);
        window.location.hash = '/mypage/registrations/study-rooms';
        rerender();
      } catch (err) {
        console.warn('[p20]', err);
        alert('삭제에 실패했습니다.');
      }
    });
  });

  root.querySelectorAll('[data-p20-inquiry-save]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const section = btn.closest('[data-p20-room-id]');
      const id = Number(section?.dataset.p20RoomId);
      const selected = section?.querySelector('input[name="inquiry_status"]:checked');
      if (!selected) return;
      try {
        await setInquiryStatus(id, /** @type {any} */ (selected.value));
        alert('상담 상태가 저장되었습니다.');
        rerender();
      } catch (err) {
        console.warn('[p20]', err);
        alert('상담 상태 저장에 실패했습니다.');
      }
    });
  });

  root.querySelectorAll('.p20-inquiry-option input').forEach((input) => {
    input.addEventListener('change', () => {
      input.closest('.p20-inquiry-options')?.querySelectorAll('.p20-inquiry-option').forEach((el) => {
        el.classList.toggle('is-selected', el.querySelector('input')?.checked);
      });
    });
  });

  root.querySelectorAll('[data-p20-preview-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-p20-preview-tab');
      const wrap = btn.closest('[data-p20-preview-wrap]');
      if (!wrap || !key) return;
      wrap.querySelectorAll('[data-p20-preview-tab]').forEach((t) => t.classList.toggle('is-active', t === btn));
      wrap.querySelectorAll('[data-p20-preview-panel]').forEach((p) => {
        p.classList.toggle('is-active', p.getAttribute('data-p20-preview-panel') === key);
      });
    });
  });
}
