import {
  LIFECYCLE_FOOTNOTE_REG,
  LIFECYCLE_PUBLISH_CONFIRM_DIRECT,
  LIFECYCLE_PUBLISH_CONFIRM_NOTE,
} from '../lifecycle-copy.js';
import { renderBrowseList } from '../exposure-render.js';
import { STUDY_ROOM_REGISTER_URL } from '../nav-config.js';
import {
  P20_LIST_TABS,
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
  STUDY_ROOM_TOP_TABS,
  BASE as STUDY_ROOM_BASE,
} from './router.js';
import {
  formatRoomSummaryLine,
  profileStatusLabel,
  inquiryStatusLabel,
  detailStatusLabel,
  roomToExposureRow,
  getExposureMatrix,
  getExposureDetailBlocks,
  getHubCtas,
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
import { showEmailVerifyOverlay } from '../email-verify-overlay.js';
import { getStudentReviewIds } from '../student-review-store.js';
import { HANDOFF_DEEPLINK } from '../handoff-copy.js';
import { studentReviewPath, getHandoffFromQuery } from '../handoff-link.js';
import { renderMainSubjectSelect } from '../../../shared/main-subjects.js';
import { KOREA_SIDOS } from '../../../shared/korea-sidos.js';
import { formatMonthlyWon } from '../exposure-format.js';
import { renderSubmissionBoardScreen } from '../submission-board/index.js';

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

/** @param {import('./store.js').StudyRoomRecord} room */
function renderRoomSwitcher(room) {
  const rooms = getStudyRooms().slice(0, 3);
  if (rooms.length <= 1) {
    return `
      <div class="mp-room__switcher" role="tablist" aria-label="내 공부방">
        <span class="mp-room__switcher-item is-active" aria-current="page">${esc(room.study_room_name)}</span>
      </div>`;
  }
  return `
    <div class="mp-room__switcher" role="tablist" aria-label="내 공부방">
      ${rooms
        .map((r) => {
          const active = r.id === room.id;
          const href = studyRoomHubPath(r.id);
          return active
            ? `<span class="mp-room__switcher-item is-active" aria-current="page">${esc(r.study_room_name)}</span>`
            : `<a href="#${href}" class="mp-room__switcher-item" data-p20-nav="${href}">${esc(r.study_room_name)}</a>`;
        })
        .join('')}
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
    { label: '상담 상태', value: inquiryStatusLabel(room.inquiry_status), section: 'exposure' },
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
    { label: '시설 요약', value: room.facility_summary, section: 'detail' },
    {
      label: '옵션',
      value: [room.weekend_available ? '주말 가능' : '', room.one_on_one_available ? '1:1 가능' : '']
        .filter(Boolean)
        .join(' · '),
      section: 'detail',
    },
    { label: '대표 이미지', value: room.has_representative_image ? '등록됨' : '', section: 'detail' },
    { label: '문의·쪽지 방식', value: room.contact_method_set ? '설정됨' : '', section: 'detail' },
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
  const readiness = getPublishReadiness(room);
  return `
    <div class="mp-room">
      <header class="mp-room__head">
        ${renderRoomSwitcher(room)}
        <div class="mp-room__meta">
          <span class="mypage-badge mypage-badge--${room.profile_status}">${esc(profileStatusLabel(room.profile_status))}</span>
          <span class="mp-room__meta-line">${esc(formatRoomSummaryLine(room))}</span>
          <span class="mp-room__meta-line">${esc(inquiryStatusLabel(room.inquiry_status))} · 공개준비 ${readiness.doneCount}/${readiness.totalCount}</span>
        </div>
        ${renderTopTabs(room, activeSection)}
      </header>
      <div class="mp-room__body">${bodyHtml}</div>
    </div>`;
}

/** @param {string} path */
export function renderStudyRoomRegScreen(path) {
  const route = parseStudyRoomRegPath(path);
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
      return renderBasicBridge(room);
    case 'P20-03b':
      return renderDetailBridge(room);
    case 'P20-04':
      return renderPublish(room);
    case 'P20-05':
      return renderExposure(room);
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
      <h3 class="p20-hub-block__title">학생 검토함</h3>
      <p class="p19-form-section__lead">${esc(HANDOFF_DEEPLINK.reviewBridgeLead)}</p>
      <div class="p19-summary-grid" style="margin-top:var(--space-3)">
        <dl class="p19-summary-card"><dt>찜</dt><dd>${reviewCount}건</dd></dl>
        <dl class="p19-summary-card"><dt>상담</dt><dd>${esc(inquiryStatusLabel(room.inquiry_status))}</dd></dl>
      </div>
      <div class="p19-form-actions" style="margin-top:var(--space-3)">
        <a href="#${studentReviewPath({ from: 'exposure' })}" class="btn btn--primary" data-mypage-nav="${studentReviewPath({ from: 'exposure' })}">${esc(P20_HUB_CTA.studentReview)}${reviewCount ? ` · ${reviewCount}건` : ''}</a>
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

  const body = `
    <div class="mp-room__hub">
      ${renderProgressCta(room)}

      <div class="p19-alert p19-alert--${tone}">
        <p class="p19-alert__text">${esc(diagnosis)}</p>
      </div>

      <div class="mp-room__status-strip" aria-label="현황 요약">
        <span><em>공개</em>${esc(profileStatusLabel(room.profile_status))}</span>
        <span><em>상담</em>${esc(inquiryStatusLabel(room.inquiry_status))}</span>
        <span><em>상세</em>${esc(detailStatusLabel(room.detail_completion_status))}</span>
        <span><em>준비</em>${readiness.doneCount}/${readiness.totalCount}</span>
      </div>

      ${renderFullChecklist(readiness, room.id)}
      ${renderProfileOverview(room)}

      <div class="p20-hub-block">
        <h3 class="p20-hub-block__title">${esc(P20_HUB_BLOCK_TITLES.exposureMatrix)}</h3>
        <div class="p20-matrix">${renderMatrixRows(matrix)}</div>
        ${
          readiness.qualityHints.length
            ? `<p class="p20-hint">${esc(readiness.qualityHints.join(' · '))}</p>`
            : ''
        }
      </div>

      ${renderReviewBridgeBlock(room)}
      <div class="p20-hub-cta">${renderHubCtaBlock(room)}</div>
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
  return renderBasicForm(room);
}

function renderDetailBridge(room) {
  return renderDetailForm(room);
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
        <p class="p19-form-section__lead">원장이 직접 선택합니다 (22장)</p>
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
        <p class="p19-form-section__lead">노출 강화 상품은 구매상품(이용현황)에서 확인합니다.</p>
        <a href="#/mypage/plans" class="btn btn--secondary" data-mypage-nav="/mypage/plans">구매상품 · 이용현황</a>
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

  return `<section class="mypage-panel mp-room-panel">${renderRoomShell(room, 'exposure', body)}</section>`;
}

/** @param {import('./store.js').StudyRoomRecord} room */
function renderSubmissionTab(room) {
  const board = renderSubmissionBoardScreen('/mypage/submission-board');
  const body = `
    <div class="mp-room__submission">
      <p class="mypage-lead">${esc(room.study_room_name)} 제출함</p>
      ${board}
    </div>`;
  return `<section class="mypage-panel mp-room-panel">${renderRoomShell(room, 'submission', body)}</section>`;
}

/** @param {HTMLElement} root @param {() => void} rerender */
export function bindStudyRoomRegEvents(root, rerender) {
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
