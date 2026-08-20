import {
  LIFECYCLE_FOOTNOTE_REG,
  LIFECYCLE_PUBLISH_CONFIRM_DIRECT,
  LIFECYCLE_PUBLISH_CONFIRM_NOTE,
} from '../lifecycle-copy.js';
import { renderBrowseList } from '../exposure-render.js';
import { STUDY_ROOM_REGISTER_URL } from '../nav-config.js';
import {
  P20_LIST_TABS,
  P20_LIST_HEAD,
  P20_PREVIEW_MODES,
  P20_HUB_CTA,
  P20_INQUIRY_COPY,
  P20_PICK_PRIME_NUDGE,
  INQUIRY_OFF_REASONS,
} from './study-room-reg-copy.js';
import {
  parseInquiryFormState,
  inquiryStatusFromForm,
  resolveStudyRoomCardCta,
  isInquiryReceiving,
} from './inquiry-display.js';
import { isPhoneVerifiedLocal, showPhoneVerifyGateModal } from './phone-verify-gate.js';
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
  detailStatusLabel,
  roomToExposureRow,
} from './format.js';
import {
  getStudyRooms,
  getStudyRoomsByTab,
  getStudyRoom,
  getPublishReadiness,
  publishStudyRoom,
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
import { showEmailVerifyOverlay } from '../email-verify-overlay.js';
import { getStudentReviewIds } from '../student-review-store.js';
import { HANDOFF_DEEPLINK } from '../handoff-copy.js';
import { studentReviewPath, getHandoffFromQuery } from '../handoff-link.js';
import { renderMainSubjectSelect } from '../../../shared/main-subjects.js';
import { KOREA_SIDOS } from '../../../shared/korea-sidos.js';
import { formatMonthlyWon } from '../exposure-format.js';

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

function blank(v) {
  const s = String(v ?? '').trim();
  return s || '—';
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

/** @deprecated 하단 CTA 제거 — 호환용 빈 구현 */
function renderHubCtaBlock(_room) {
  return '';
}

/** 픽·프라임 유도 — CTA 없음 (미리보기·공개 상단) */
function renderPickPrimeNudge() {
  const c = P20_PICK_PRIME_NUDGE;
  return `
    <div class="p20-hub-block p20-pick-prime-nudge">
      <h3 class="p20-hub-block__title">${esc(c.title)}</h3>
      <p class="p19-form-section__lead">${esc(c.lead)}</p>
      <p class="p19-form-section__lead p20-pick-prime-nudge__hint">${esc(c.leadHint)}</p>
      <div class="p20-pick-prime-nudge__cols">
        <div>
          <h4 class="p20-pick-prime-nudge__sub">${esc(c.detail1Title)}</h4>
          <ul class="p20-pick-prime-nudge__list">
            ${c.detail1Items.map((item) => `<li>${esc(item)}</li>`).join('')}
          </ul>
        </div>
        <div>
          <h4 class="p20-pick-prime-nudge__sub">${esc(c.detail2Title)}</h4>
          <ul class="p20-pick-prime-nudge__list">
            ${c.detail2Items.map((item) => `<li>${esc(item)}</li>`).join('')}
          </ul>
        </div>
      </div>
    </div>`;
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

/** @param {import('./store.js').PublishReadiness} readiness @param {number} roomId */
function renderFullChecklist(readiness, roomId) {
  const items = readiness.items || [];
  return `
    <div class="mp-room__checklist">
      <div class="mp-room__checklist-head">
        <h3>공개 필수 체크리스트</h3>
        <span>${readiness.doneCount}/${readiness.totalCount}</span>
      </div>
      <ul class="mp-room__checklist-list">
        ${items
          .map((item) => {
            const href = studyRoomSectionPath(roomId, item.section === 'publish' ? 'basic' : item.section);
            return `
          <li class="mp-room__checklist-item${item.ok ? ' is-ok' : ' is-miss'}">
            <span class="mp-room__checklist-mark" aria-hidden="true">${item.ok ? '✓' : '○'}</span>
            <span>${esc(item.label)}</span>
            ${
              item.ok
                ? '<span class="mp-room__checklist-state">완료</span>'
                : `<a href="#${href}" class="mp-room__checklist-link" data-p20-nav="${href}">채우기</a>`
            }
          </li>`;
          })
          .join('')}
      </ul>
    </div>`;
}

/** @param {import('./store.js').StudyRoomRecord} room */
function renderProgressCta(room) {
  const readiness = getPublishReadiness(room);
  const pct = Math.round((readiness.doneCount / readiness.totalCount) * 100);
  const firstMiss = (readiness.items || []).find((i) => !i.ok);
  const href = firstMiss
    ? studyRoomSectionPath(room.id, firstMiss.section === 'publish' ? 'basic' : firstMiss.section)
    : studyRoomSectionPath(room.id, 'publish');
  const title = readiness.canPublish
    ? '공개 준비가 끝났습니다'
    : `프로필 ${readiness.doneCount}/${readiness.totalCount} 채워짐`;
  const hint = readiness.canPublish
    ? '미리보기 후 공개할 수 있습니다.'
    : firstMiss
      ? `다음: ${firstMiss.label}`
      : '부족한 항목을 이어서 채우세요.';

  return `
    <a href="#${href}" class="mp-room__progress" data-p20-nav="${href}">
      <div class="mp-room__progress-copy">
        <span class="mp-room__progress-eyebrow">지금 하면 좋아요</span>
        <strong>${esc(title)}</strong>
        <p>${esc(hint)}</p>
      </div>
      <div class="mp-room__progress-meter" aria-hidden="true">
        <span class="mp-room__progress-bar"><i style="width:${pct}%"></i></span>
        <span class="mp-room__progress-pct">${pct}%</span>
      </div>
    </a>`;
}

/** @param {import('./store.js').StudyRoomRecord} room */
function renderProfileOverview(room) {
  const rows = [
    { label: '공부방명', value: room.study_room_name, section: 'basic' },
    { label: '공개 상태', value: profileStatusLabel(room.profile_status), section: 'publish' },
    { label: '쪽지 상태', value: inquiryStatusLabel(room.inquiry_status), section: 'inquiries' },
    { label: '상세정보', value: detailStatusLabel(room.detail_completion_status), section: 'detail' },
    { label: '지역', value: room.region_label, section: 'basic' },
    { label: '주력과목', value: room.main_subject_note, section: 'basic' },
    { label: '대상 학년', value: room.grade_band, section: 'detail' },
    { label: '월 대표 가격', value: room.price_amount ? formatMonthlyWon(room.price_amount) : '', section: 'detail' },
    { label: '수업 방식', value: room.lesson_place_type === 'academy' ? '학원·공부방' : room.lesson_place_type === 'study_room' ? '공부방' : '', section: 'basic' },
    { label: '슬로건', value: room.slogan, section: 'detail' },
    { label: '특징', value: room.feature_1, section: 'detail' },
    { label: '정원/타임', value: room.capacity_per_time, section: 'detail' },
    { label: '짧은 소개', value: room.intro_short, section: 'detail' },
    { label: '상세 소개', value: room.intro_long, section: 'detail' },
    { label: '시설 요약', value: room.facility_summary, section: 'detail2' },
    {
      label: '옵션',
      value: [room.weekend_available ? '주말 가능' : '', room.one_on_one_available ? '1:1 가능' : '']
        .filter(Boolean)
        .join(' · '),
      section: 'detail',
    },
    { label: '대표 이미지', value: room.has_representative_image ? '등록됨' : '', section: 'detail' },
    { label: '문의·쪽지 방식', value: room.contact_method_set ? '설정됨' : '', section: 'inquiries' },
  ];

  return `
    <div class="mp-room__overview">
      <div class="mp-room__overview-head">
        <h3>프로필 한눈에</h3>
        <a href="#${studyRoomSectionPath(room.id, 'basic')}" class="btn btn--secondary btn--sm" data-p20-nav="${studyRoomSectionPath(room.id, 'basic')}">수정</a>
      </div>
      <dl class="mp-room__dl">
        ${rows
          .map((row) => {
            const empty = !String(row.value ?? '').trim();
            const href = studyRoomSectionPath(room.id, /** @type {any} */ (row.section));
            return `
          <div class="mp-room__dl-row${empty ? ' is-empty' : ''}">
            <dt>${esc(row.label)}</dt>
            <dd>
              <span>${esc(blank(row.value))}</span>
              ${empty ? `<a href="#${href}" data-p20-nav="${href}">채우기</a>` : `<a href="#${href}" data-p20-nav="${href}">수정</a>`}
            </dd>
          </div>`;
          })
          .join('')}
      </dl>
    </div>`;
}

/** @param {import('./store.js').StudyRoomRecord} room @param {string} activeSection @param {string} bodyHtml */
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


/** @param {import('./store.js').StudyRoomRecord} room */
function renderReviewBridgeBlock(room) {
  if (room.profile_status !== 'published') return '';
  const reviewCount = getStudentReviewIds().length;
  return `
    <div class="p20-hub-block p21-review-bridge">
      <h3 class="p20-hub-block__title">학생 검토함</h3>
      <p class="p19-form-section__lead">${esc(HANDOFF_DEEPLINK.reviewBridgeLead)}</p>
      <div class="p19-summary-grid" style="margin-top:var(--space-3)">
        <dl class="p19-summary-card"><dt>찜</dt><dd>${reviewCount}건</dd></dl>
        <dl class="p19-summary-card"><dt>쪽지</dt><dd>${esc(inquiryStatusLabel(room.inquiry_status))}</dd></dl>
      </div>
      <div class="p19-form-actions" style="margin-top:var(--space-3)">
        <a href="#${studentReviewPath({ from: 'exposure' })}" class="btn btn--primary" data-mypage-nav="${studentReviewPath({ from: 'exposure' })}">${esc(P20_HUB_CTA.studentReview)}${reviewCount ? ` · ${reviewCount}건` : ''}</a>
      </div>
    </div>`;
}

/** @param {import('./store.js').StudyRoomRecord} room */
function renderHub(room) {
  const body = `
    <div class="mp-room__hub">
      ${renderProfileOverview(room)}
      ${renderReviewBridgeBlock(room)}
    </div>`;

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
         <a href="#${studyRoomHubPath(room.id)}" class="btn btn--ghost" data-p20-nav="${studyRoomHubPath(room.id)}">운영홈</a>`,
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
        '저장 후 미리보기·공개에서 공개 상태를 확인하세요.',
        `<button type="submit" class="btn btn--primary">상세정보 저장</button>
         <a href="#${studyRoomSectionPath(room.id, 'publish')}" class="btn btn--secondary" data-p20-nav="${studyRoomSectionPath(room.id, 'publish')}">미리보기·공개</a>
         <a href="#${studyRoomHubPath(room.id)}" class="btn btn--ghost" data-p20-nav="${studyRoomHubPath(room.id)}">운영홈</a>`,
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

  const body = `
    <div class="p19-publish-body" data-p20-room-id="${room.id}">
      ${renderPickPrimeNudge()}
      ${preview}
      ${renderFullChecklist(r, room.id)}
      <div class="p20-confirm-card" data-p20-room-id="${room.id}">
        <h3 class="p20-confirm-card__title">자기확인 — 학부모에게 이렇게 보입니다</h3>
        <label class="p20-confirm-check"><input type="checkbox" data-p20-confirm="location" /> 위치·주소 공개 범위를 확인했습니다</label>
        <label class="p20-confirm-check"><input type="checkbox" data-p20-confirm="contact" /> 쪽지·문의 방식 표시를 확인했습니다</label>
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

  return `<section class="mypage-panel mp-room-panel">${renderRoomShell(room, 'publish', body)}</section>`;
}

/** @param {import('./store.js').StudyRoomRecord} room */
function renderInquiries(room) {
  const form = parseInquiryFormState(room.inquiry_status);
  const cardCta = resolveStudyRoomCardCta(room.inquiry_status);
  const phoneOk = isPhoneVerifiedLocal(room);
  const summaryState = isInquiryReceiving(room.inquiry_status)
    ? P20_INQUIRY_COPY.summaryReceiving
    : `${P20_INQUIRY_COPY.summaryClosed}${cardCta.reasonLine ? ` · ${cardCta.reasonLine}` : ''}`;
  const contactStatus = phoneOk ? P20_INQUIRY_COPY.contactVerified : P20_INQUIRY_COPY.contactNeeded;

  const reasonRadios = INQUIRY_OFF_REASONS.map(
    (o) => `
    <label class="p20-inquiry-reason${form.reason === o.value ? ' is-selected' : ''}">
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
        <section class="p20-inquiries-summary" aria-label="상태 요약">
          <h3 class="p20-inquiries-settings__heading">현재 상태 요약</h3>
          <dl class="p19-summary-grid">
            <dl class="p19-summary-card">
              <dt>현재 문의 상태</dt>
              <dd data-p20-inquiry-summary-state>${esc(summaryState)}</dd>
            </dl>
            <dl class="p19-summary-card">
              <dt>카드 버튼</dt>
              <dd data-p20-inquiry-summary-cta>${esc(cardCta.label)}</dd>
            </dl>
            <dl class="p19-summary-card">
              <dt>연락처 검증</dt>
              <dd data-p20-inquiry-summary-contact>${esc(contactStatus)}</dd>
            </dl>
          </dl>
        </section>

        <section class="p20-inquiries-section p20-inquiries-section--control">
          <h3 class="p20-inquiries-section__title">${esc(P20_INQUIRY_COPY.switchLabel)}</h3>
          <label class="p20-inquiries-switch">
            <input type="checkbox" name="inquiry_receiving" data-p20-inquiry-toggle ${form.receiving ? 'checked' : ''} />
            <span>${esc(P20_INQUIRY_COPY.switchLabel)}</span>
          </label>
        </section>

        <section class="p20-inquiries-section p20-inquiries-section--control p20-inquiries-off-reason${form.receiving ? ' is-hidden' : ''}" data-p20-inquiry-off-wrap>
          <h3 class="p20-inquiries-section__title">${esc(P20_INQUIRY_COPY.offReasonTitle)}</h3>
          <div class="p20-inquiry-reasons">${reasonRadios}</div>
        </section>

        <section class="p20-inquiries-section p20-inquiries-section--control">
          <h3 class="p20-inquiries-section__title">${esc(P20_INQUIRY_COPY.contactBlockTitle)}</h3>
          <p class="p20-inquiries-contact-status${phoneOk ? ' is-ok' : ' is-warn'}" data-p20-inquiry-contact-status>
            ${esc(contactStatus)}
          </p>
          <p class="p20-inquiries-contact-notice">${esc(P20_INQUIRY_COPY.contactNotice)}</p>
        </section>

        <section class="p20-inquiries-section p20-inquiries-section--preview">
          <h3 class="p20-inquiries-section__title">${esc(P20_INQUIRY_COPY.previewTitle)}</h3>
          <div class="p20-inquiries-card-preview" data-p20-inquiry-preview>
            <button type="button" class="btn btn--primary btn--sm" disabled data-p20-inquiry-preview-btn>${esc(cardCta.label)}</button>
            <p class="p20-inquiries-card-preview__hint${cardCta.reasonLine ? '' : ' is-hidden'}" data-p20-inquiry-preview-hint>${esc(cardCta.reasonLine || '')}</p>
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
  const cardCta = resolveStudyRoomCardCta(nextStatus);
  const summaryState = isInquiryReceiving(nextStatus)
    ? P20_INQUIRY_COPY.summaryReceiving
    : `${P20_INQUIRY_COPY.summaryClosed}${cardCta.reasonLine ? ` · ${cardCta.reasonLine}` : ''}`;

  const summaryStateEl = wrap.querySelector('[data-p20-inquiry-summary-state]');
  const summaryCtaEl = wrap.querySelector('[data-p20-inquiry-summary-cta]');
  const previewBtn = wrap.querySelector('[data-p20-inquiry-preview-btn]');
  const previewHint = wrap.querySelector('[data-p20-inquiry-preview-hint]');

  if (summaryStateEl) summaryStateEl.textContent = summaryState;
  if (summaryCtaEl) summaryCtaEl.textContent = cardCta.label;
  if (previewBtn) previewBtn.textContent = cardCta.label;
  if (previewHint) {
    previewHint.textContent = cardCta.reasonLine || '';
    previewHint.classList.toggle('is-hidden', !cardCta.reasonLine);
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
        window.location.hash = '/mypage/registrations';
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

      if (needsPhone) {
        showPhoneVerifyGateModal({
          onVerified: persist,
          onCancel: rerender,
        });
        return;
      }
      await persist();
    });
  });

  root.querySelectorAll('[data-p20-inquiry-toggle]').forEach((input) => {
    input.addEventListener('change', () => {
      const wrap = input.closest('[data-p20-room-id]');
      const offWrap = wrap?.querySelector('[data-p20-inquiry-off-wrap]');
      const checked = /** @type {HTMLInputElement} */ (input).checked;
      offWrap?.classList.toggle('is-hidden', checked);
      wrap?.querySelectorAll('input[name="inquiry_off_reason"]').forEach((r) => {
        /** @type {HTMLInputElement} */ (r).disabled = checked;
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
