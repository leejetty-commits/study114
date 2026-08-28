import { LIFECYCLE_FOOTNOTE_REG } from '../lifecycle-copy.js';
import { STUDY_ROOM_REGISTER_URL } from '../nav-config.js';
import {
  P20_LIST_TABS,
  P20_LIST_HEAD,
  P20_INQUIRY_COPY,
  INQUIRY_OFF_REASONS,
} from './study-room-reg-copy.js';
import {
  parseInquiryFormState,
  inquiryStatusFromForm,
  homeCardDisplaySummary,
} from './inquiry-display.js';
import { isPhoneVerifiedLocal, showPhoneVerifyGateModal } from './phone-verify-gate.js';
import { renderBrowseList } from '../exposure-render.js';
import { getAuthUser } from '../auth-session.js';
import {
  parseStudyRoomRegPath,
  studyRoomHubPath,
  studyRoomSectionPath,
  studyRoomListTabPath,
  STUDY_ROOM_TOP_TABS,
  studyRoomLegacyExposureRedirect,
  BASE as STUDY_ROOM_BASE,
  stripHashQuery,
} from './router.js';
import {
  formatRoomSummaryLine,
  profileStatusLabel,
  inquiryStatusLabel,
  roomToExposureRow,
} from './format.js';
import {
  getStudyRooms,
  getStudyRoomsByTab,
  getStudyRoom,
  getPublishReadiness,
  hideStudyRoom,
  deleteStudyRoom,
  setInquiryStatus,
  getStudyRoomSummaryCounts,
} from './store.js';
import { saveStudyRoomBasicInline, saveStudyRoomDetailInline } from './inline-save.js';
import {
  ensureEmbeddedRegister,
  shouldReloadEmbeddedView,
  markEmbeddedViewLoaded,
  renderEmbeddedPanel,
  bindEmbeddedPanelEvents,
} from './embedded-panels.js';
import { renderMyshopShowcase, bindMyshopEvents } from './myshop-render.js';
import { getShopCompletenessSummary } from './shop-completeness.js';
import { registerState } from '@study-room-ui/state.js';
import { buildRegistrationCheckModel } from './registration-check-model.js';
import { renderRegistrationCheck } from './registration-check-render.js';
import { bindRegistrationCheckEvents } from './registration-check-edit.js';
import { renderMainSubjectSelect } from '../../../shared/main-subjects.js';
import { KOREA_SIDOS } from '../../../shared/korea-sidos.js';

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

/** @param {import('./store.js').StudyRoomRecord} room @param {string} activeSection */
function renderTopTabs(room, activeSection) {
  return `
    <nav class="mp-room__tabs" aria-label="공부방 메뉴">
      ${STUDY_ROOM_TOP_TABS.map((tab) => {
        const href =
          tab.key === 'hub' ? studyRoomHubPath(room.id) : studyRoomSectionPath(room.id, /** @type {any} */ (tab.key));
        const active = activeSection === tab.key;
        return `<a href="#${href}" class="mp-room__tab${active ? ' is-active' : ''}" data-p20-nav="${href}">${esc(tab.label)}</a>`;
      }).join('')}
    </nav>`;
}

function renderRoomShell(room, activeSection, bodyHtml) {
  return `
    <div class="mp-room">
      <header class="mp-room__head">
        ${renderTopTabs(room, activeSection)}
      </header>
      <div class="mp-room__body">${bodyHtml}</div>
    </div>`;
}

/** @param {string} path */
export function renderStudyRoomRegScreen(path) {
  const pathOnly = stripHashQuery(path);
  const legacyRedirect = studyRoomLegacyExposureRedirect(pathOnly);
  if (legacyRedirect) {
    const query = path.includes('?') ? path.slice(path.indexOf('?')) : '';
    queueMicrotask(() => {
      const hashPath = stripHashQuery(window.location.hash.slice(1) || '');
      if (studyRoomLegacyExposureRedirect(hashPath)) {
        window.location.replace(`#${legacyRedirect}${query}`);
      }
    });
  }

  const route = parseStudyRoomRegPath(pathOnly);
  if (!route) return '';

  if (route.screenId === 'P20-01') {
    const rooms = getStudyRooms();
    if (rooms.length) {
      // 중간 목록 depth 제거 — 대표 공부방으로 직행
      queueMicrotask(() => {
        if (window.location.hash.includes(STUDY_ROOM_BASE) && !/\/\d+/.test(window.location.hash)) {
          window.location.hash = studyRoomHubPath(rooms[0].id);
        }
      });
      return renderHub(rooms[0]);
    }
    return renderList(route.listTab || 'all');
  }
  if (!route.roomId) return renderNotFound();

  const room = getStudyRoom(route.roomId);
  if (!room || room.deleted_at) return renderNotFound();

  switch (route.screenId) {
    case 'P20-02':
      return renderHub(room);
    case 'P20-03a':
      return renderEmbeddedSection(room, 'basic');
    case 'P20-03b':
      return renderEmbeddedSection(room, 'detail');
    case 'P20-03c':
      return renderEmbeddedSection(room, 'detail2');
    case 'P20-04':
      return renderPublish(room);
    case 'P20-05':
      return renderInquiries(room);
    case 'P23-04':
      return renderSubmissionTab(room);
    default:
      return renderHub(room);
  }
}

function renderNotFound() {
  return `<section class="mypage-panel mp-room mypage-empty">
    <p>공부방 정보를 찾을 수 없습니다.</p>
    <a href="${STUDY_ROOM_REGISTER_URL}" class="btn btn--secondary" data-same-tab-href="${STUDY_ROOM_REGISTER_URL}">공부방 등록하기</a>
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
      ? `<p class="mypage-empty">등록된 공부방이 없습니다. 아래에서 첫 공부방을 등록하세요.</p>`
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
            <p class="p19-child-card__meta p20-inquiry-badge">쪽지: ${esc(inquiryStatusLabel(r.inquiry_status))}</p>
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


function renderHub(room) {
  if (shouldReloadEmbeddedView(room.id, 'hub')) {
    queueMicrotask(() => {
      ensureEmbeddedRegister(room.id, { force: true })
        .then(() => {
          markEmbeddedViewLoaded(room.id, 'hub');
          window.dispatchEvent(new Event('hashchange'));
        })
        .catch((err) => console.error('[myshop]', err));
    });
    const loading = `
      <div class="shop shop--loading" data-myshop>
        <p class="shop-prose">샵 페이지를 준비하고 있어요…</p>
      </div>`;
    return `<section class="mypage-panel mp-room-panel">${renderRoomShell(room, 'hub', loading)}</section>`;
  }

  markEmbeddedViewLoaded(room.id, 'hub');
  const shop = getShopCompletenessSummary(registerState, room);
  const nudge = shop.weak
    ? `<div class="mp-room__shop-nudge" data-shop-completeness-nudge>
        <p class="mp-room__shop-nudge__text">${esc(shop.reasonLine)}</p>
        <a href="#${studyRoomSectionPath(room.id, 'publish')}" class="mp-room__checklist-link" data-p20-nav="${studyRoomSectionPath(room.id, 'publish')}">등록점검에서 채우기</a>
      </div>`
    : '';
  const body = `${nudge}${renderMyshopShowcase(registerState, room)}`;
  return `<section class="mypage-panel mp-room-panel">${renderRoomShell(room, 'hub', body)}</section>`;
}

/** @param {string} title @param {string} [lead] @param {string} body */
function renderFormSection(title, lead, body) {
  return `
    <section class="p19-form-section">
      <header class="p19-form-section__head">
        <h3 class="p19-form-section__title">${esc(title)}</h3>
        ${lead ? `<p class="p19-form-section__lead">${lead}</p>` : ''}
      </header>
      <div class="p19-form-section__body">${body}</div>
    </section>`;
}

/** @param {string} [hint] @param {string} buttonsHtml */
function renderFormFooter(hint, buttonsHtml) {
  return `
    <footer class="p19-form-footer">
      ${hint ? `<p class="p19-form-footer__hint">${hint}</p>` : ''}
      <div class="p19-form-actions">${buttonsHtml}</div>
    </footer>`;
}

function sidoOptions(selectedLabel) {
  const sel = String(selectedLabel || '').trim().split(/\s+/)[0];
  return [
    '<option value="">시·도 선택</option>',
    ...KOREA_SIDOS.map((s) => {
      const match = sel && (s.label === sel || s.label.startsWith(sel) || sel.startsWith(s.label));
      return `<option value="${esc(s.label)}" ${match ? 'selected' : ''}>${esc(s.label)}</option>`;
    }),
  ].join('');
}

/** @param {import('./store.js').StudyRoomRecord} room */
function renderBasicForm(room) {
  const formBody = `
    <form class="p19-form p20-inline-form" data-p20-form="basic" data-p20-room-id="${room.id}">
      ${renderFormSection(
        '기본정보',
        '공부방명 · 노출지역 · 주력과목을 마이페이지 가운데 칸에서 바로 수정합니다.',
        `
        <div class="p19-field-grid p19-field-grid--2">
          <label class="p19-field p19-field--full">
            <span class="p19-field__label">공부방명 <em class="p19-required">필수</em></span>
            <input class="p19-input" name="study_room_name" value="${esc(room.study_room_name || '')}" required />
          </label>
          <label class="p19-field">
            <span class="p19-field__label">노출지역 (시·도) <em class="p19-required">필수</em></span>
            <select class="p19-input" name="region_label" required>${sidoOptions(room.region_label || '')}</select>
          </label>
          <label class="p19-field">
            <span class="p19-field__label">주력과목 <em class="p19-required">필수</em></span>
            <select class="p19-input" name="main_subject_note" required>
              ${renderMainSubjectSelect(room.main_subject_note || '')}
            </select>
          </label>
        </div>`,
      )}
      ${renderFormFooter(
        '저장해도 바로 공개되지 않습니다.',
        `<button type="submit" class="btn btn--primary">기본정보 저장</button>
         <a href="#${studyRoomSectionPath(room.id, 'detail')}" class="btn btn--secondary" data-p20-nav="${studyRoomSectionPath(room.id, 'detail')}">상세정보로</a>
         <a href="#${studyRoomHubPath(room.id)}" class="btn btn--ghost" data-p20-nav="${studyRoomHubPath(room.id)}">마이샵</a>`,
      )}
    </form>`;

  return `<section class="mypage-panel mp-room-panel">${renderRoomShell(room, 'basic', formBody)}</section>`;
}

/** @param {import('./store.js').StudyRoomRecord} room */
function renderDetailForm(room) {
  const formBody = `
    <form class="p19-form p20-inline-form" data-p20-form="detail" data-p20-room-id="${room.id}">
      ${renderFormSection(
        '상세정보',
        '수업·소개·시설을 마이페이지 가운데 칸에서 수정합니다.',
        `
        <div class="p19-field-grid p19-field-grid--2">
          <label class="p19-field">
            <span class="p19-field__label">주력과목 <em class="p19-required">필수</em></span>
            <select class="p19-input" name="main_subject_note" required>
              ${renderMainSubjectSelect(room.main_subject_note || '')}
            </select>
          </label>
          <label class="p19-field">
            <span class="p19-field__label">월 대표 가격 <em class="p19-required">필수</em></span>
            <input class="p19-input" type="number" name="price_amount" value="${esc(room.price_amount || '')}" required min="1" />
          </label>
          <label class="p19-field">
            <span class="p19-field__label">슬로건</span>
            <input class="p19-input" name="slogan" value="${esc(room.slogan || '')}" />
          </label>
          <label class="p19-field">
            <span class="p19-field__label">특징 1</span>
            <input class="p19-input" name="feature_1" value="${esc(room.feature_1 || '')}" />
          </label>
          <label class="p19-field">
            <span class="p19-field__label">정원/타임</span>
            <input class="p19-input" name="capacity_per_time" value="${esc(room.capacity_per_time || '')}" placeholder="예: 1~4명" />
          </label>
          <label class="p19-field">
            <span class="p19-field__label">옵션</span>
            <div class="p19-chip-group" style="margin-top:0.35rem;">
              <label class="p19-chip${room.weekend_available ? ' is-checked' : ''}">
                <input type="checkbox" name="weekend_available" value="1" ${room.weekend_available ? 'checked' : ''} />
                <span>주말 가능</span>
              </label>
              <label class="p19-chip${room.one_on_one_available ? ' is-checked' : ''}">
                <input type="checkbox" name="one_on_one_available" value="1" ${room.one_on_one_available ? 'checked' : ''} />
                <span>1:1 가능</span>
              </label>
            </div>
          </label>
          <label class="p19-field p19-field--full">
            <span class="p19-field__label">짧은 소개</span>
            <textarea class="p19-input p19-textarea" name="intro_short" rows="2">${esc(room.intro_short || '')}</textarea>
          </label>
          <label class="p19-field p19-field--full">
            <span class="p19-field__label">상세 소개</span>
            <textarea class="p19-input p19-textarea" name="intro_long" rows="4">${esc(room.intro_long || '')}</textarea>
          </label>
          <label class="p19-field p19-field--full">
            <span class="p19-field__label">시설 요약</span>
            <textarea class="p19-input p19-textarea" name="facility_summary" rows="2">${esc(room.facility_summary || '')}</textarea>
          </label>
        </div>`,
      )}
      ${renderFormFooter(
        '저장 후 등록점검에서 공개 상태를 확인하세요.',
        `<button type="submit" class="btn btn--primary">상세정보 저장</button>
         <a href="#${studyRoomSectionPath(room.id, 'publish')}" class="btn btn--secondary" data-p20-nav="${studyRoomSectionPath(room.id, 'publish')}">등록점검</a>
         <a href="#${studyRoomHubPath(room.id)}" class="btn btn--ghost" data-p20-nav="${studyRoomHubPath(room.id)}">마이샵</a>`,
      )}
    </form>`;

  return `<section class="mypage-panel mp-room-panel">${renderRoomShell(room, 'detail', formBody)}</section>`;
}

function renderBasicBridge(room) {
  return renderEmbeddedSection(room, 'basic');
}

function renderDetailBridge(room) {
  return renderEmbeddedSection(room, 'detail');
}

/** @param {import('./store.js').StudyRoomRecord} room @param {'basic'|'detail'|'detail2'} section */
function renderEmbeddedSection(room, section) {
  if (shouldReloadEmbeddedView(room.id, section)) {
    queueMicrotask(() => {
      ensureEmbeddedRegister(room.id, { force: true })
        .then(() => {
          markEmbeddedViewLoaded(room.id, section);
          window.dispatchEvent(new Event('hashchange'));
        })
        .catch((err) => console.error('[embed register]', err));
    });
    const loading = `
      <div class="mp-room-embed is-loading">
        <p class="p19-form-section__lead">등록 정보를 불러오는 중…</p>
      </div>`;
    return `<section class="mypage-panel mp-room-panel">${renderRoomShell(room, section, loading)}</section>`;
  }

  markEmbeddedViewLoaded(room.id, section);
  const body = renderEmbeddedPanel(room, section);
  return `<section class="mypage-panel mp-room-panel">${renderRoomShell(room, section, body)}</section>`;
}

/** @param {import('./store.js').StudyRoomRecord} room */
function renderPublish(room) {
  if (shouldReloadEmbeddedView(room.id, 'publish')) {
    queueMicrotask(() => {
      ensureEmbeddedRegister(room.id, { force: true })
        .then(() => {
          markEmbeddedViewLoaded(room.id, 'publish');
          window.dispatchEvent(new Event('hashchange'));
        })
        .catch((err) => console.error('[registration-check]', err));
    });
    const loading = `
      <div class="rc-page" data-p20-room-id="${room.id}">
        <p class="p19-form-section__lead">등록 현황을 불러오는 중…</p>
      </div>`;
    return `<section class="mypage-panel mp-room-panel">${renderRoomShell(room, 'publish', loading)}</section>`;
  }

  markEmbeddedViewLoaded(room.id, 'publish');
  const vm = buildRegistrationCheckModel(registerState, room);
  return `<section class="mypage-panel mp-room-panel">${renderRoomShell(room, 'publish', renderRegistrationCheck(vm))}</section>`;
}

/** @returns {string} */
function inquiryCoverImageSrc() {
  const imgs = Array.isArray(registerState.images) ? registerState.images : [];
  const real = imgs.filter((img) => {
    if (!img || img.is_system_default) return false;
    const src = String(img.basic_720_path || img.prime_1280_path || img.image_path || img.name || img.src || '');
    if (!src) return false;
    if (/room-card-default-(basic|pick|prime)/i.test(src)) return false;
    if (/study114[_-]default/i.test(src)) return false;
    return true;
  });
  const cover =
    real.find((img) => String(img?.image_type || img?.type || '') === 'cover') || real[0] || null;
  if (!cover) return '';
  return (
    cover.basic_720_path ||
    cover.prime_1280_path ||
    cover.image_path ||
    cover.name ||
    cover.src ||
    ''
  );
}

/**
 * @param {import('./store.js').StudyRoomRecord} room
 * @param {string} inquiryStatus
 */
function renderInquiryBasicPreview(room, inquiryStatus) {
  const s = Number(registerState.study_room_id) === Number(room.id) ? registerState : null;
  const row = roomToExposureRow(room, {
    image_path: inquiryCoverImageSrc(),
    slogan: s?.slogan || room.slogan || s?.intro_short || room.intro_short || '',
  });
  if (s) {
    if (s.study_room_name) row.study_room_name = s.study_room_name;
    if (s.main_subject_note) row.main_subject_note = s.main_subject_note;
    if (s.grade_band) row.grade_band = s.grade_band;
    if (s.capacity_per_time) row.capacity_per_time = s.capacity_per_time;
    if (s.price_amount != null && s.price_amount !== '') row.price_amount = Number(s.price_amount);
    if (s.lesson_place_type) {
      row.lesson_place_type = s.lesson_place_type === 'academy' ? 'office' : s.lesson_place_type;
    }
    if (s.lesson_operation_type) row.lesson_operation_type = s.lesson_operation_type;
  }
  row.inquiry_status = inquiryStatus;
  return `
    <div class="p20-inquiries-card-preview__frame" data-p20-inquiry-preview-card>
      <div class="p20-inquiries-card-preview__browse" aria-hidden="true">
        ${renderBrowseList('study_room', [row], { showCompare: false, showWish: false })}
      </div>
    </div>`;
}

/** @param {import('./store.js').StudyRoomRecord} room */
function renderInquiries(room) {
  if (shouldReloadEmbeddedView(room.id, 'inquiries')) {
    queueMicrotask(() => {
      ensureEmbeddedRegister(room.id, { force: true })
        .then(() => {
          markEmbeddedViewLoaded(room.id, 'inquiries');
          window.dispatchEvent(new Event('hashchange'));
        })
        .catch((err) => console.error('[p20 inquiries]', err));
    });
    const loading = `<p class="mypage-muted">쪽지설정을 준비하고 있어요…</p>`;
    return `<section class="mypage-panel mp-room-panel">${renderRoomShell(room, 'inquiries', loading)}</section>`;
  }
  markEmbeddedViewLoaded(room.id, 'inquiries');

  const form = parseInquiryFormState(room.inquiry_status);
  const cardSummary = homeCardDisplaySummary(room.inquiry_status);
  const phoneOk = isPhoneVerifiedLocal(room);
  const contactStatus = phoneOk ? P20_INQUIRY_COPY.contactVerified : P20_INQUIRY_COPY.contactNeeded;

  const reasonRadios = INQUIRY_OFF_REASONS.map(
    (o) => `
    <label class="p20-inquiry-reason${form.reason === o.value ? ' is-selected' : ''}${form.receiving ? ' is-disabled' : ''}">
      <input type="radio" name="inquiry_off_reason" value="${esc(o.value)}" ${form.reason === o.value ? 'checked' : ''} ${form.receiving ? 'disabled' : ''} />
      <span>${esc(o.label)}</span>
    </label>`,
  ).join('');

  const body = `
    <div class="p20-inquiries-body" data-p20-room-id="${room.id}" data-inquiry-receiving="${form.receiving ? '1' : '0'}">
      <aside class="p20-inquiries-guide" aria-label="안내">
        <h3 class="p20-inquiries-guide__title">${esc(P20_INQUIRY_COPY.pageTitle)}</h3>
        <p class="p20-inquiries-guide__lead">${esc(P20_INQUIRY_COPY.pageLead)}</p>
        <ul class="p20-inquiries-footnotes">
          ${P20_INQUIRY_COPY.footnotes.map((line) => `<li>${esc(line)}</li>`).join('')}
        </ul>
      </aside>

      <div class="p20-inquiries-settings" aria-label="기능 설정">
        <section class="p20-inquiries-summary" aria-label="${esc(P20_INQUIRY_COPY.currentStatusHeading)}">
          <h3 class="p20-inquiries-settings__heading">${esc(P20_INQUIRY_COPY.currentStatusHeading)}</h3>
          <div class="p20-inquiries-summary-grid">
            <article class="p20-inquiries-summary-card" data-p20-inquiry-card-display>
              <h4 class="p20-inquiries-summary-card__title">${esc(P20_INQUIRY_COPY.cardDisplayTitle)}</h4>
              <p class="p20-inquiries-summary-card__state" data-p20-inquiry-summary-state>${esc(cardSummary.line)}</p>
              <p class="p20-inquiries-summary-card__reason${cardSummary.reasonLine ? '' : ' is-hidden'}" data-p20-inquiry-summary-reason>${esc(cardSummary.reasonLine || '')}</p>
            </article>
            <article class="p20-inquiries-summary-card p20-inquiries-summary-card--contact${phoneOk ? ' is-ok' : ' is-warn'}">
              <h4 class="p20-inquiries-summary-card__title">${esc(P20_INQUIRY_COPY.contactBlockTitle)}</h4>
              <p class="p20-inquiries-summary-card__state" data-p20-inquiry-summary-contact>${esc(contactStatus)}</p>
              <p class="p20-inquiries-contact-notice">${esc(P20_INQUIRY_COPY.contactNotice)}</p>
              ${
                phoneOk
                  ? ''
                  : `<button type="button" class="btn btn--primary btn--sm" data-p20-phone-verify-start>${esc(P20_INQUIRY_COPY.contactVerifyCta)}</button>`
              }
            </article>
          </div>
        </section>

        <section class="p20-inquiries-controls" aria-label="쪽지 설정">
          <div class="p20-inquiries-controls-grid">
            <div class="p20-inquiries-control-block">
              <h3 class="p20-inquiries-section__title">${esc(P20_INQUIRY_COPY.switchLabel)}</h3>
              <p class="p20-inquiries-control-lead">${esc(P20_INQUIRY_COPY.switchLead)}</p>
              <label class="p20-inquiries-switch">
                <input type="checkbox" name="inquiry_receiving" data-p20-inquiry-toggle ${form.receiving ? 'checked' : ''} />
                <span>${esc(P20_INQUIRY_COPY.switchLabel)}</span>
              </label>
            </div>
            <div class="p20-inquiries-control-block p20-inquiries-off-reason${form.receiving ? ' is-inactive' : ''}" data-p20-inquiry-off-wrap>
              <h3 class="p20-inquiries-section__title">${esc(P20_INQUIRY_COPY.offReasonTitle)}</h3>
              <div class="p20-inquiry-reasons">${reasonRadios}</div>
            </div>
          </div>
        </section>

        <section class="p20-inquiries-section p20-inquiries-section--preview">
          <h3 class="p20-inquiries-section__title">${esc(P20_INQUIRY_COPY.previewTitle)}</h3>
          <div class="p20-inquiries-card-preview" data-p20-inquiry-preview>
            ${renderInquiryBasicPreview(room, room.inquiry_status)}
          </div>
        </section>

        <div class="p19-form-actions p20-inquiries-actions">
          <button type="button" class="btn btn--primary" data-p20-inquiry-save>${esc(P20_INQUIRY_COPY.saveCta)}</button>
        </div>
      </div>
    </div>`;

  return `<section class="mypage-panel mp-room-panel">${renderRoomShell(room, 'inquiries', body)}</section>`;
}

/** @param {HTMLElement|null|undefined} wrap */
function syncInquiryFormPreview(wrap) {
  if (!wrap) return;
  const receiving = wrap.querySelector('[data-p20-inquiry-toggle]')?.checked ?? false;
  const reasonEl = wrap.querySelector('input[name="inquiry_off_reason"]:checked');
  const reason = receiving
    ? null
    : /** @type {'capacity_full'|'paused'} */ (reasonEl?.value || 'paused');
  const nextStatus = inquiryStatusFromForm(receiving, reason);
  const cardSummary = homeCardDisplaySummary(nextStatus);

  const summaryStateEl = wrap.querySelector('[data-p20-inquiry-summary-state]');
  const summaryReasonEl = wrap.querySelector('[data-p20-inquiry-summary-reason]');
  const previewHost = wrap.querySelector('[data-p20-inquiry-preview]');
  const roomId = Number(wrap.dataset.p20RoomId);
  const room = getStudyRoom(roomId);

  if (summaryStateEl) summaryStateEl.textContent = cardSummary.line;
  if (summaryReasonEl) {
    summaryReasonEl.textContent = cardSummary.reasonLine || '';
    summaryReasonEl.classList.toggle('is-hidden', !cardSummary.reasonLine);
  }
  if (previewHost && room) {
    previewHost.innerHTML = renderInquiryBasicPreview(room, nextStatus);
  }
  wrap.dataset.inquiryReceiving = receiving ? '1' : '0';
}

/** @param {import('./store.js').StudyRoomRecord} room */
function renderSubmissionTab(room) {
  const body = `
    <div class="mp-room__submission">
      <p class="mypage-lead">${esc(room.study_room_name)}</p>
      <p class="mypage-muted">공부방은 제출함을 쓰지 않습니다. 교육청 등록은 상세정보에서 체크합니다. 파일 제출함은 과외쌤 마이페이지에서 다룹니다.</p>
    </div>`;
  return `<section class="mypage-panel mp-room-panel">${renderRoomShell(room, 'submission', body)}</section>`;
}

/** @param {HTMLElement} root @param {() => void} rerender */
export function bindStudyRoomRegEvents(root, rerender) {
  bindEmbeddedPanelEvents(root, rerender);
  bindMyshopEvents(root);
  bindRegistrationCheckEvents(root, rerender);

  root.querySelectorAll('[data-p20-nav]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.hash = el.getAttribute('data-p20-nav') || '/mypage/registrations/study-rooms';
    });
  });

  root.querySelectorAll('[data-p20-form]').forEach((form) => {
    form.querySelectorAll('.p19-chip input[type="checkbox"]').forEach((input) => {
      input.addEventListener('change', () => {
        input.closest('.p19-chip')?.classList.toggle('is-checked', input.checked);
      });
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = Number(form.dataset.p20RoomId);
      const kind = form.getAttribute('data-p20-form');
      const fd = new FormData(form);
      const btn = form.querySelector('button[type="submit"]');
      if (btn) btn.disabled = true;
      try {
        if (kind === 'basic') {
          await saveStudyRoomBasicInline(id, {
            study_room_name: String(fd.get('study_room_name') || ''),
            main_subject_note: String(fd.get('main_subject_note') || ''),
            region_label: String(fd.get('region_label') || ''),
          });
        } else if (kind === 'detail') {
          await saveStudyRoomDetailInline(id, {
            main_subject_note: String(fd.get('main_subject_note') || ''),
            price_amount: Number(fd.get('price_amount') || 0),
            slogan: String(fd.get('slogan') || ''),
            feature_1: String(fd.get('feature_1') || ''),
            capacity_per_time: String(fd.get('capacity_per_time') || ''),
            intro_short: String(fd.get('intro_short') || ''),
            intro_long: String(fd.get('intro_long') || ''),
            facility_summary: String(fd.get('facility_summary') || ''),
            weekend_available: fd.get('weekend_available') === '1',
            one_on_one_available: fd.get('one_on_one_available') === '1',
          });
        }
        alert('저장되었습니다.');
        rerender();
      } catch (err) {
        alert(err instanceof Error ? err.message : '저장에 실패했습니다.');
      } finally {
        if (btn) btn.disabled = false;
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
        window.location.hash = '/mypage/registrations';
        rerender();
      } catch (err) {
        console.warn('[p20]', err);
        alert('삭제에 실패했습니다.');
      }
    });
  });

  root.querySelectorAll('[data-p20-phone-verify-start]').forEach((btn) => {
    btn.addEventListener('click', () => {
      showPhoneVerifyGateModal({
        onVerified: () => {
          const user = getAuthUser();
          if (user) user.phone_verified = true;
          const section = btn.closest('[data-p20-room-id]');
          const id = Number(section?.dataset.p20RoomId);
          const room = getStudyRoom(id);
          if (room) room.owner_phone_verified = true;
          rerender();
        },
      });
    });
  });

  root.querySelectorAll('[data-p20-inquiry-save]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const section = btn.closest('[data-p20-room-id]');
      const id = Number(section?.dataset.p20RoomId);
      const receiving = section?.querySelector('[data-p20-inquiry-toggle]')?.checked ?? false;
      const reasonEl = section?.querySelector('input[name="inquiry_off_reason"]:checked');
      if (!receiving && !reasonEl) {
        alert('안 받는 이유를 선택해 주세요.');
        return;
      }
      const reason = receiving ? null : /** @type {'capacity_full'|'paused'} */ (reasonEl.value);
      const nextStatus = inquiryStatusFromForm(receiving, reason);
      const room = getStudyRoom(id);
      const needsPhone = receiving && !isPhoneVerifiedLocal(room);

      if (needsPhone) {
        alert(P20_INQUIRY_COPY.verifyFirstHint);
        return;
      }

      const persist = async () => {
        try {
          await setInquiryStatus(id, nextStatus);
          alert('저장되었습니다.');
          rerender();
        } catch (err) {
          console.warn('[p20]', err);
          if (err?.code === 'phone_verify_required') {
            showPhoneVerifyGateModal({
              onVerified: persist,
              onCancel: rerender,
            });
            return;
          }
          alert('저장에 실패했습니다.');
        }
      };

      await persist();
    });
  });

  root.querySelectorAll('[data-p20-inquiry-toggle]').forEach((input) => {
    input.addEventListener('change', () => {
      const wrap = input.closest('[data-p20-room-id]');
      const offWrap = wrap?.querySelector('[data-p20-inquiry-off-wrap]');
      const checked = /** @type {HTMLInputElement} */ (input).checked;
      offWrap?.classList.toggle('is-inactive', checked);
      wrap?.querySelectorAll('input[name="inquiry_off_reason"]').forEach((r) => {
        /** @type {HTMLInputElement} */ (r).disabled = checked;
      });
      wrap?.querySelectorAll('.p20-inquiry-reason').forEach((el) => {
        el.classList.toggle('is-disabled', checked);
      });
      if (!checked) {
        const selected = wrap?.querySelector('input[name="inquiry_off_reason"]:checked');
        if (!selected) {
          const first = wrap?.querySelector('input[name="inquiry_off_reason"]');
          if (first) /** @type {HTMLInputElement} */ (first).checked = true;
        }
      }
      wrap?.querySelectorAll('.p20-inquiry-reason').forEach((el) => {
        const radio = el.querySelector('input');
        el.classList.toggle('is-selected', Boolean(radio?.checked));
      });
      syncInquiryFormPreview(wrap);
    });
  });

  root.querySelectorAll('.p20-inquiry-reason input').forEach((input) => {
    input.addEventListener('change', () => {
      const wrap = input.closest('[data-p20-room-id]');
      input.closest('.p20-inquiry-reasons')?.querySelectorAll('.p20-inquiry-reason').forEach((el) => {
        el.classList.toggle('is-selected', el.querySelector('input')?.checked);
      });
      syncInquiryFormPreview(wrap);
    });
  });
}
