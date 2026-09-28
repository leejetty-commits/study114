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
import { GUEST_DEMO_REGION } from './data.js';
import { openDetailModal, resolveDetailItem } from './detail-decision/index.js';
import { getStudents } from './student-reg/store.js';
import { primaryHopeRegionLabel } from '../../shared/student-hope-regions.js';

export function importNeighborhoodGreetingHandoff() {
  return importGreetingHandoff();
}

export function pullNeighborhoodGreetings() {
  return pullGreetingsFromApi();
}

/** @param {'guest'|'parent'|'study_room'|'tutor'} viewer */
export function viewerNeighborhood(viewer) {
  if (viewer === 'parent') {
    try {
      const label = getStudents()
        .map((student) => primaryHopeRegionLabel(student) || student.region_label || '')
        .find(Boolean);
      if (label) return String(label);
    } catch {
      /* 희망지역이 없으면 게스트 데모 동네 */
    }
  }
  return GUEST_DEMO_REGION.dong;
}

/** @param {'guest'|'parent'|'study_room'|'tutor'} viewer */
export function renderNeighborhoodGreetingRail(viewer) {
  const neighborhood = viewerNeighborhood(viewer);
  const loggedIn = isLoggedIn();
  const items = readGreetings()
    .filter((row) => row.status === 'up' && sameNeighborhood(row.neighborhood, neighborhood) && (row.body || row.teaser))
    .sort((a, b) => Number(b.updatedAt) - Number(a.updatedAt));
  if (!items.length) return '';
  const cards = items
    .map((row) => {
      const name = loggedIn ? row.displayName || maskGreetingName(row.maskedName) : row.maskedName || maskGreetingName(row.displayName);
      const text = loggedIn ? row.body || row.teaser || '' : row.teaser || greetingTeaser(row.body);
      const kindLabel = row.providerType === 'tutor' ? '과외쌤' : '공부방';
      return `
        <li class="ng-rail__item">
          <button type="button" class="ng-rail__btn" data-ng-open data-ng-kind="${esc(row.providerType)}" data-ng-reg="${Number(row.registrationId)}">
            <span class="ng-rail__kind">${kindLabel}</span>
            <span class="ng-rail__name">${esc(name)}</span>
            <span class="ng-rail__text">${esc(text)}</span>
          </button>
        </li>`;
    })
    .join('');
  return `
    <section class="ng-rail" aria-label="우리 동네에 새로 왔어요">
      <h2 class="ng-rail__title">우리 동네에 새로 왔어요</h2>
      <ul class="ng-rail__list">${cards}</ul>
    </section>`;
}

/**
 * @param {HTMLElement} root
 * @param {{ viewer?: string, onRerender?: () => void, sourceRoute?: string }} [opts]
 */
export function bindNeighborhoodGreetingRail(root, opts = {}) {
  root.querySelectorAll('[data-ng-open]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const kind = btn.getAttribute('data-ng-kind') === 'tutor' ? 'tutor' : 'study_room';
      const id = Number(btn.getAttribute('data-ng-reg') || 0);
      void openGreetingTarget({
        loggedIn: isLoggedIn(),
        kind,
        id,
        viewer: opts.viewer || 'guest',
        onRerender: opts.onRerender,
        sourceRoute: opts.sourceRoute || 'home',
      });
    });
  });
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
      <p class="ng-editor__error" data-ng-error hidden></p>
      <div class="ng-editor__actions">
        <button type="button" class="btn btn--secondary" data-ng-save>${up ? '수정' : '올리기'}</button>
        ${up ? '<button type="button" class="btn btn--secondary" data-ng-down>내리기</button>' : ''}
      </div>
    </section>`;
}

/** @param {HTMLElement} root @param {() => void} rerender */
export function bindNeighborhoodGreetingEditor(root, rerender) {
  const editor = root.querySelector('[data-ng-editor]');
  if (!editor) return;
  const errorEl = editor.querySelector('[data-ng-error]');
  const showError = (message) => {
    if (!errorEl) return;
    errorEl.hidden = !message;
    errorEl.textContent = message || '';
  };
  editor.querySelector('[data-ng-save]')?.addEventListener('click', async () => {
    const text = editor.querySelector('[data-ng-body]')?.value || '';
    const error = greetingError(text);
    if (error) {
      showError(error);
      return;
    }
    const saved = await publishGreeting({
      providerType: editor.getAttribute('data-ng-type') === 'tutor' ? 'tutor' : 'study_room',
      registrationId: Number(editor.getAttribute('data-ng-id') || 0),
      body: text,
      neighborhood: editor.getAttribute('data-ng-area') || '',
      displayName: editor.getAttribute('data-ng-name') || '',
    });
    if (!saved.ok) {
      showError(saved.error);
      return;
    }
    rerender();
  });
  editor.querySelector('[data-ng-down]')?.addEventListener('click', async () => {
    const saved = await unpublishGreeting(
      editor.getAttribute('data-ng-type') === 'tutor' ? 'tutor' : 'study_room',
      Number(editor.getAttribute('data-ng-id') || 0),
    );
    if (!saved.ok) {
      showError(saved.error);
      return;
    }
    rerender();
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
