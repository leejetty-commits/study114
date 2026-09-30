/**
 * 홈 레일·마이 수정. 게스트는 이름 가림·20자·로그인 게이트만.
 */

import { greetingError, greetingTeaser, maskGreetingName, sameNeighborhood } from '../../shared/neighborhood-greeting.js';
import {
  greetingForRegistration,
  importGreetingHandoff,
  publishGreeting,
  pullGreetingsFromApi,
  readGreetings,
  unpublishGreeting,
} from '../../shared/neighborhood-greeting-store.js';
import { getAuthUser, isLoggedIn } from './auth-session.js';
import { readGuestBaseline } from '../../shared/location-display.js';
import { openDetailModal, resolveDetailItem } from './detail-decision/index.js';
import { primarySavedRegion, studyRoomPromo1Label } from './study-room-home-seed.js';
import { getStudyRooms } from './study-room-reg/store.js';
import { getStudents } from './student-reg/store.js';
import { getTutors } from './tutor-reg/store.js';
import { primaryHopeRegionLabel } from '../../shared/student-hope-regions.js';

export function importNeighborhoodGreetingHandoff() {
  return importGreetingHandoff();
}

export function pullNeighborhoodGreetings() {
  return pullGreetingsFromApi();
}

/** @param {string[]} labels @param {unknown} value */
function pushArea(labels, value) {
  const text = String(value ?? '').trim();
  if (!text || text === '—' || text === '-' || text === '미설정') return;
  if (!labels.includes(text)) labels.push(text);
}

/** 학생 희망지역. 없으면 빈 목록. 데모동으로 대체하지 않는다. */
function parentHopeLabels() {
  /** @type {string[]} */
  const labels = [];
  try {
    for (const student of getStudents()) {
      pushArea(labels, primaryHopeRegionLabel(student) || student?.region_label || '');
    }
  } catch {
    /* 희망지역이 없으면 레일을 데모동에 묶지 않는다 */
  }
  return labels;
}

/** 과외쌤 활동·대표 지역. */
function tutorActivityLabels() {
  /** @type {string[]} */
  const labels = [];
  try {
    for (const tutor of getTutors()) {
      if (!tutor || tutor.deleted_at) continue;
      pushArea(labels, tutor.primary_region_label);
      pushArea(labels, tutor.location_label);
      const saved = Array.isArray(tutor.saved_regions) ? tutor.saved_regions : [];
      for (const slot of saved) {
        pushArea(labels, slot?.region_label);
        pushArea(labels, slot?.promo_label);
      }
    }
  } catch {
    /* 등록 캐시가 없으면 동네 목록은 비운다 */
  }
  return labels;
}

/** 공부방 등록 주소·대표 동네. */
function studyRoomAreaLabels() {
  /** @type {string[]} */
  const labels = [];
  try {
    for (const room of getStudyRooms()) {
      if (!room || room.deleted_at) continue;
      pushArea(labels, studyRoomPromo1Label(room));
      pushArea(labels, room.region_label);
      pushArea(labels, room.location_label);
      const slot = primarySavedRegion(room);
      pushArea(labels, slot?.promo_label);
      pushArea(labels, slot?.region_label);
    }
  } catch {
    /* 등록 캐시가 없으면 동네 목록은 비운다 */
  }
  return labels;
}

/**
 * 게스트만 데모동. 공급자·학생 홈은 각자 동네. 없으면 빈 문자열.
 * @param {'guest'|'parent'|'study_room'|'tutor'} viewer
 */
export function viewerNeighborhood(viewer) {
  if (viewer === 'guest') return readGuestBaseline().room || '';
  const labels =
    viewer === 'parent' ? parentHopeLabels() : viewer === 'tutor' ? tutorActivityLabels() : viewer === 'study_room' ? studyRoomAreaLabels() : [];
  return labels[0] || '';
}

/** @param {'guest'|'parent'|'study_room'|'tutor'} viewer @returns {string[]} */
function viewerAreas(viewer) {
  if (viewer === 'guest') {
    const room = readGuestBaseline().room;
    return room ? [room] : [];
  }
  if (viewer === 'parent') return parentHopeLabels();
  if (viewer === 'tutor') return tutorActivityLabels();
  if (viewer === 'study_room') return studyRoomAreaLabels();
  return [];
}

const PAGE_SIZE = 5;

/**
 * @param {'guest'|'parent'|'study_room'|'tutor'} viewer
 * @returns {Array<{ providerType: 'study_room'|'tutor', registrationId: number, name: string, summary: string, full: string, kindLabel: string }>}
 */
function greetingRows(viewer) {
  const areas = viewerAreas(viewer);
  const loggedIn = isLoggedIn();
  return readGreetings()
    .filter((row) => {
      if (row.status !== 'up' || !(row.body || row.teaser)) return false;
      if (!areas.length) return false;
      const area = String(row.neighborhood || '').trim();
      if (!area) return false;
      return areas.some((label) => sameNeighborhood(area, label));
    })
    .sort((a, b) => Number(b.updatedAt) - Number(a.updatedAt))
    .map((row) => {
      const full = loggedIn ? row.body || row.teaser || '' : row.teaser || greetingTeaser(row.body);
      return {
        providerType: row.providerType === 'tutor' ? 'tutor' : 'study_room',
        registrationId: Number(row.registrationId),
        name: loggedIn
          ? row.displayName || maskGreetingName(row.maskedName)
          : row.maskedName || maskGreetingName(row.displayName),
        summary: greetingTeaser(full),
        full,
        kindLabel: row.providerType === 'tutor' ? '과외쌤' : '공부방',
      };
    });
}

/** @param {'guest'|'parent'|'study_room'|'tutor'} viewer */
export function renderNeighborhoodGreetingRail(viewer) {
  const rows = greetingRows(viewer);
  if (!rows.length) return '';
  const lines = rows
    .slice(0, PAGE_SIZE)
    .map(
      (row, index) => `
        <li class="ng-rail__item">
          <div class="ng-rail__line">
            <span class="ng-rail__kind">${esc(row.kindLabel)}</span>
            <button type="button" class="ng-rail__name" data-ng-name data-ng-kind="${esc(row.providerType)}" data-ng-reg="${row.registrationId}">${esc(row.name)}</button>
            <button type="button" class="ng-rail__text" data-ng-line data-ng-index="${index}">${esc(row.summary)}</button>
          </div>
        </li>`,
    )
    .join('');
  const more =
    rows.length > PAGE_SIZE
      ? '<button type="button" class="btn btn--secondary btn--sm ng-rail__more" data-ng-more>더보기</button>'
      : '';
  return `
    <section class="ng-rail" data-ng-rail aria-label="우리 동네에 새로 왔어요">
      <h2 class="ng-rail__title">우리 동네에 새로 왔어요</h2>
      <ul class="ng-rail__list">${lines}</ul>
      ${more}
    </section>`;
}

/**
 * @param {HTMLElement} root
 * @param {{ viewer?: string, onRerender?: () => void, sourceRoute?: string }} [opts]
 */
export function bindNeighborhoodGreetingRail(root, opts = {}) {
  const rail = root.querySelector('[data-ng-rail]');
  if (!rail) return;
  const viewer = opts.viewer || 'guest';
  /** @param {string | null} kind @param {number} id */
  const openCard = (kind, id) => {
    void openGreetingTarget({
      loggedIn: isLoggedIn(),
      kind: kind === 'tutor' ? 'tutor' : 'study_room',
      id,
      viewer,
      onRerender: opts.onRerender,
      sourceRoute: opts.sourceRoute || 'home',
    });
  };
  rail.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    const nameBtn = target.closest('[data-ng-name]');
    if (nameBtn && rail.contains(nameBtn)) {
      openCard(nameBtn.getAttribute('data-ng-kind'), Number(nameBtn.getAttribute('data-ng-reg') || 0));
      return;
    }
    const lineBtn = target.closest('[data-ng-line]');
    if (lineBtn && rail.contains(lineBtn)) {
      const index = Number(lineBtn.getAttribute('data-ng-index') || 0);
      openGreetingFeed({ viewer, page: Math.floor(index / PAGE_SIZE), openCard });
      return;
    }
    if (target.closest('[data-ng-more]')) openGreetingFeed({ viewer, page: 0, openCard });
  });
}

/**
 * @param {{ viewer: string, page: number, openCard: (kind: string | null, id: number) => void }} opts
 */
function openGreetingFeed(opts) {
  const rows = greetingRows(opts.viewer);
  if (!rows.length) return;
  const pages = Math.ceil(rows.length / PAGE_SIZE);
  let current = Math.min(Math.max(0, opts.page), pages - 1);
  document.getElementById('ng-feed')?.dispatchEvent(new Event('ng-feed-dismiss'));
  const el = document.createElement('div');
  el.id = 'ng-feed';
  el.className = 'ng-feed';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.setAttribute('aria-labelledby', 'ng-feed-title');

  const close = () => {
    document.removeEventListener('keydown', onKey);
    el.remove();
  };
  el.addEventListener('ng-feed-dismiss', close);
  const paint = () => {
    const slice = rows.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE);
    const items = slice
      .map(
        (row) => `
        <li class="ng-feed__item">
          <p class="ng-feed__who">
            <span class="ng-feed__kind">${esc(row.kindLabel)}</span>
            <button type="button" class="ng-feed__name" data-ng-feed-name data-ng-kind="${esc(row.providerType)}" data-ng-reg="${row.registrationId}">${esc(row.name)}</button>
          </p>
          <p class="ng-feed__body">${esc(row.full)}</p>
        </li>`,
      )
      .join('');
    const pager =
      pages > 1
        ? `<div class="ng-feed__pager">
            <button type="button" class="btn btn--secondary btn--sm" data-ng-feed-prev ${current === 0 ? 'disabled' : ''}>이전</button>
            <span>${current + 1} / ${pages}</span>
            <button type="button" class="btn btn--secondary btn--sm" data-ng-feed-next ${current === pages - 1 ? 'disabled' : ''}>다음</button>
          </div>`
        : '';
    el.innerHTML = `
      <div class="ng-feed__card" role="document">
        <h2 id="ng-feed-title" class="ng-feed__title">우리 동네에 새로 왔어요</h2>
        <ul class="ng-feed__list">${items}</ul>
        ${pager}
        <button type="button" class="btn btn--secondary" data-ng-feed-close>닫기</button>
      </div>`;
  };
  const onKey = (event) => {
    if (event.key !== 'Escape') return;
    if (document.querySelector('.p24-overlay, #ng-login-gate, #ng-card-unavailable')) return;
    close();
  };
  el.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    if (target === el || target.closest('[data-ng-feed-close]')) {
      close();
      return;
    }
    if (target.closest('[data-ng-feed-prev]')) {
      if (current <= 0) return;
      current -= 1;
      paint();
      return;
    }
    if (target.closest('[data-ng-feed-next]')) {
      if (current >= pages - 1) return;
      current += 1;
      paint();
      return;
    }
    const nameBtn = target.closest('[data-ng-feed-name]');
    if (!nameBtn) return;
    opts.openCard(nameBtn.getAttribute('data-ng-kind'), Number(nameBtn.getAttribute('data-ng-reg') || 0));
  });
  document.addEventListener('keydown', onKey);
  paint();
  document.body.appendChild(el);
}

/**
 * @param {{ loggedIn: boolean, kind: 'study_room'|'tutor', id: number, viewer?: string, onRerender?: () => void, sourceRoute?: string }} opts
 */
export async function openGreetingTarget(opts) {
  if (!opts.loggedIn) {
    openGreetingLoginGate();
    return 'gate';
  }
  const looked = await fetchBasicCard(opts.kind, opts.id);
  if (looked.status === 'closed') {
    showCardUnavailable();
    return 'unavailable';
  }
  let item = looked.status === 'open' ? looked.item : null;
  if (!item) {
    const local = resolveDetailItem(opts.kind, opts.id);
    if (!local || isClosedCard(local)) {
      showCardCheckFailed();
      return 'error';
    }
    item = local;
  }
  openDetailModal({
    kind: opts.kind,
    item,
    viewer: loggedInViewer(opts.viewer),
    onRerender: opts.onRerender,
    sourceRoute: opts.sourceRoute || 'home',
  });
  return 'card';
}

/**
 * @param {{ providerType: 'study_room'|'tutor', registrationId: number, neighborhood: string, displayName: string }} opts
 */
export function renderNeighborhoodGreetingEditor(opts) {
  const current = greetingForRegistration(opts.providerType, opts.registrationId);
  const up = current?.status === 'up';
  const body = up ? current.body : '';
  return `
    <section class="ng-editor" data-ng-editor data-ng-type="${esc(opts.providerType)}" data-ng-id="${Number(opts.registrationId)}" data-ng-area="${esc(opts.neighborhood)}" data-ng-name="${esc(opts.displayName)}">
      <h3 class="ng-editor__title">동네 인사</h3>
      <p class="ng-editor__note">한 줄, 80자. 전화·카톡·주소는 넣지 않아요.</p>
      <textarea class="form-input ng-editor__input" maxlength="80" rows="2" data-ng-body>${esc(body)}</textarea>
      <p class="ng-editor__status" data-ng-status role="status" hidden></p>
      <p class="ng-editor__error" data-ng-error hidden></p>
      <div class="ng-editor__actions">
        <button type="button" class="btn btn--secondary" data-ng-save>${up ? '수정' : '올리기'}</button>
        ${up ? '<button type="button" class="btn btn--secondary" data-ng-down>내리기</button>' : ''}
      </div>
    </section>`;
}

const STATUS_HIDE_MS = 4000;

/** @param {HTMLElement} root @param {() => void} [_rerender] 성공 뒤에는 호출하지 않는다. 폼을 갈아끼우면 안내가 사라진다. */
export function bindNeighborhoodGreetingEditor(root, _rerender) {
  const editor = root.querySelector('[data-ng-editor]');
  if (!editor) return;
  const errorEl = editor.querySelector('[data-ng-error]');
  const statusEl = editor.querySelector('[data-ng-status]');
  /** @type {number} */
  let statusTimer = 0;

  const hideStatus = () => {
    if (statusTimer) {
      window.clearTimeout(statusTimer);
      statusTimer = 0;
    }
    if (!statusEl) return;
    statusEl.hidden = true;
    statusEl.textContent = '';
  };

  const showError = (message) => {
    hideStatus();
    if (!errorEl) return;
    errorEl.hidden = !message;
    errorEl.textContent = message || '';
  };

  const showStatus = (message) => {
    if (errorEl) {
      errorEl.hidden = true;
      errorEl.textContent = '';
    }
    if (!statusEl) return;
    statusEl.hidden = false;
    statusEl.textContent = message;
    if (statusTimer) window.clearTimeout(statusTimer);
    statusTimer = window.setTimeout(() => {
      statusTimer = 0;
      if (!statusEl.isConnected) return;
      statusEl.hidden = true;
      statusEl.textContent = '';
    }, STATUS_HIDE_MS);
  };

  editor.querySelector('[data-ng-body]')?.addEventListener('input', () => {
    hideStatus();
  });

  /** @param {boolean} up */
  const syncActions = (up) => {
    const saveBtn = editor.querySelector('[data-ng-save]');
    if (saveBtn) saveBtn.textContent = up ? '수정' : '올리기';
    const downBtn = editor.querySelector('[data-ng-down]');
    if (up) {
      if (downBtn) return;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn btn--secondary';
      btn.setAttribute('data-ng-down', '');
      btn.textContent = '내리기';
      editor.querySelector('.ng-editor__actions')?.appendChild(btn);
      return;
    }
    downBtn?.remove();
    const bodyEl = editor.querySelector('[data-ng-body]');
    if (bodyEl instanceof HTMLTextAreaElement) bodyEl.value = '';
  };

  editor.addEventListener('click', async (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    const providerType = editor.getAttribute('data-ng-type') === 'tutor' ? 'tutor' : 'study_room';
    const registrationId = Number(editor.getAttribute('data-ng-id') || 0);
    if (target.closest('[data-ng-save]')) {
      const text = editor.querySelector('[data-ng-body]')?.value || '';
      const error = greetingError(text);
      if (error) {
        showError(error);
        return;
      }
      const saved = await publishGreeting({
        providerType,
        registrationId,
        body: text,
        neighborhood: editor.getAttribute('data-ng-area') || '',
        displayName: editor.getAttribute('data-ng-name') || '',
      });
      if (!saved.ok) {
        showError(saved.error);
        return;
      }
      syncActions(true);
      showStatus('저장되었습니다');
      return;
    }
    if (!target.closest('[data-ng-down]')) return;
    const saved = await unpublishGreeting(providerType, registrationId);
    if (!saved.ok) {
      showError(saved.error);
      return;
    }
    syncActions(false);
    showStatus('내렸습니다');
  });
}

function openGreetingLoginGate() {
  document.getElementById('ng-login-gate')?.remove();
  const el = document.createElement('div');
  el.id = 'ng-login-gate';
  el.className = 'ng-unavailable';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.innerHTML = `
    <div class="ng-unavailable__card">
      <p>로그인하면 카드를 볼 수 있어요</p>
    </div>`;
  const close = () => el.remove();
  el.addEventListener('click', (event) => {
    if (event.target === el) close();
  });
  const onKey = (event) => {
    if (event.key !== 'Escape') return;
    document.removeEventListener('keydown', onKey);
    close();
  };
  document.addEventListener('keydown', onKey);
  document.body.appendChild(el);
}

/** @param {object | null | undefined} item */
function isClosedCard(item) {
  if (!item) return true;
  if (item.deleted_at) return true;
  const status = String(item.profile_status || '');
  return status === 'hidden' || status === 'deleted';
}

/**
 * @param {'study_room'|'tutor'} kind
 * @param {number} id
 * @returns {Promise<{ status: 'open', item: object } | { status: 'closed' } | { status: 'error' }>}
 */
async function fetchBasicCard(kind, id) {
  try {
    const params = new URLSearchParams({
      provider_type: kind,
      registration_id: String(id),
    });
    const res = await fetch(`/api/neighborhood-greeting-card.php?${params}`, { credentials: 'include' });
    const data = await res.json().catch(() => ({}));
    if (res.status === 404 || data.error === 'unavailable') return { status: 'closed' };
    if (!res.ok || !data.item || isClosedCard(data.item)) {
      return !res.ok ? { status: 'error' } : { status: 'closed' };
    }
    return { status: 'open', item: data.item };
  } catch {
    return { status: 'error' };
  }
}

function showCardCheckFailed() {
  showNotice('카드를 확인하지 못했어요');
}

function showCardUnavailable() {
  showNotice('카드를 볼 수 없어요');
}

/** @param {string} message */
function showNotice(message) {
  document.getElementById('ng-card-unavailable')?.remove();
  const el = document.createElement('div');
  el.id = 'ng-card-unavailable';
  el.className = 'ng-unavailable';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.innerHTML = `
    <div class="ng-unavailable__card">
      <p>${esc(message)}</p>
      <button type="button" class="btn btn--secondary" data-ng-unavailable-close>닫기</button>
    </div>`;
  el.querySelector('[data-ng-unavailable-close]')?.addEventListener('click', () => el.remove());
  el.addEventListener('click', (event) => {
    if (event.target === el) el.remove();
  });
  document.body.appendChild(el);
}

/** @param {string} [viewer] */
function loggedInViewer(viewer) {
  const role = getAuthUser()?.role_type;
  if (role === 'tutor') return 'tutor';
  if (role === 'study_room_owner') return 'study_room';
  if (role === 'guardian_student') return 'parent';
  return viewer && viewer !== 'guest' ? viewer : 'parent';
}

/** @param {unknown} value */
function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
