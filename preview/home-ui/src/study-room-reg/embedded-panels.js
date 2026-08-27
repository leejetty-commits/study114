/**
 * 마이페이지 내 등록 — 공부방상세정보(study-room-ui) 바디·카드 틀 그대로 사용
 * 조회(현황) → 상단 수정 → 저장 후 현황 복귀
 *
 * SSOT: `/api/study-room/register.php` → StudyRoomRegisterService → study_rooms DB
 */

import { registerState, apiMasters, isRoomBasicComplete, getRegions } from '@study-room-ui/state.js';
import { fetchMasters, loadRoom } from '@study-room-ui/register-api.js';
import { applyRoomToState } from '@study-room-ui/form-collect.js';
import { saveAndNavigate, withSaving } from '@study-room-ui/save-flow.js';
import {
  bindStudyRoomBasicFields,
  collectStudyRoomBasicFields,
  validateStudyRoomBasicFields,
  applyStudyRoomBasicToState,
} from '../../../shared/study-room-basic-form.js';
import { bindDraggableDialog } from '../../../shared/draggable-dialog.js';
import { renderRegisterCardInner } from '@study-room-ui/layout.js';
import { renderBasicOverviewBoard, renderBasicEditModal } from '@study-room-ui/screens/step-basic.js';
import { renderLessonFormHtml, bindLessonEvents } from '@study-room-ui/screens/step-lesson.js';
import { renderFacilityFormHtml, bindFacilityEvents } from '@study-room-ui/screens/step-facility.js';
import {
  LESSON_OPERATION_TYPES,
  CAPACITY_PER_TIME_OPTIONS,
} from '@study-room-ui/state.js';
import { hydrateRegistrationsCache, isRegistrationsApiMode } from '../registrations-backend.js';
import { studyRoomSectionPath } from './router.js';
import { RC_COPY } from './registration-check-copy.js';

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

function blank(v) {
  return String(v ?? '').trim();
}

/** @type {Promise<void>|null} */
let loadPromise = null;
/** @type {number|null} */
let loadedRoomId = null;
/** 마지막 현황 로드 키 — 탭 재진입·저장 후 DB 재조회용 */
let lastViewKey = '';

export function isEmbeddedRegisterReady(roomId) {
  return loadedRoomId === roomId && Number(registerState.study_room_id) === roomId;
}

/** 메모리 캐시 무효화 — 다음 진입 시 register API로 다시 load */
export function invalidateEmbeddedRegister() {
  loadedRoomId = null;
  lastViewKey = '';
}

async function syncHubCacheFromDb() {
  if (!isRegistrationsApiMode()) return;
  try {
    await hydrateRegistrationsCache();
  } catch {
    /* hub 갱신 실패해도 등록 저장은 유지 */
  }
}

export function isEmbedEditMode() {
  const hash = window.location.hash.slice(1);
  const q = hash.indexOf('?');
  const params = new URLSearchParams(q >= 0 ? hash.slice(q + 1) : '');
  return params.get('edit') === '1';
}

/** 등록점검 → 원본 탭 이동 시 return=registration-check */
export function isReturnToRegistrationCheck() {
  const hash = window.location.hash.slice(1);
  const q = hash.indexOf('?');
  const params = new URLSearchParams(q >= 0 ? hash.slice(q + 1) : '');
  const ret = params.get('return') || params.get('backTo');
  return ret === 'registration-check' || ret === 'publish';
}

/** @deprecated 이름만 유지 — isReturnToRegistrationCheck 사용 */
export function isReturnToPublish() {
  return isReturnToRegistrationCheck();
}

/** @param {string} basePath */
export function withEditQuery(basePath, on) {
  const path = basePath.split('?')[0];
  return on ? `${path}?edit=1` : path;
}

/**
 * @param {string} basePath
 * @param {{ edit?: boolean, returnRegistrationCheck?: boolean, focus?: string }} [opts]
 */
export function withEmbedQuery(basePath, opts = {}) {
  const path = basePath.split('?')[0];
  const params = new URLSearchParams();
  if (opts.edit) params.set('edit', '1');
  if (opts.returnRegistrationCheck) params.set('return', 'registration-check');
  if (opts.focus) params.set('focus', String(opts.focus));
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

function embedFocusParam() {
  const hash = window.location.hash.slice(1);
  const q = hash.indexOf('?');
  const params = new URLSearchParams(q >= 0 ? hash.slice(q + 1) : '');
  return params.get('focus') || '';
}

const RC_FOCUS_SELECTORS = {
  cover: '[data-rc-field="cover"]',
  intro_short: '#intro_short',
  intro_long: '#intro_long',
  teaching_style: '[data-rc-field="teaching_style"]',
  teaching_style_note: '#teaching_style_note',
  classes: '[data-rc-field="classes"]',
  fee: '#monthly_fee_manwon',
  lessons_per_week: '#lessons_per_week',
  feature_1: '#feature_1',
};

function scrollToRegistrationCheckFocus(root) {
  const id = embedFocusParam();
  if (!id) return;
  const sel = RC_FOCUS_SELECTORS[id];
  const el = sel ? root.querySelector(sel) : root.querySelector(`#${CSS.escape(id)}`);
  if (!el) return;
  requestAnimationFrame(() => {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.add('is-rc-focus');
    const focusable = el.matches('input, textarea, select')
      ? el
      : el.querySelector('input, textarea, select, button');
    if (focusable && typeof focusable.focus === 'function') {
      try {
        focusable.focus({ preventScroll: true });
      } catch {
        focusable.focus();
      }
    }
  });
}

function setEditMode(roomId, section, on) {
  const base = studyRoomSectionPath(roomId, section);
  const returnRegistrationCheck = isReturnToRegistrationCheck();
  window.location.hash = withEmbedQuery(base, { edit: on, returnRegistrationCheck });
}

function goRegistrationCheck(roomId) {
  window.location.hash = studyRoomSectionPath(roomId, 'publish');
}

function renderReturnToRegistrationCheckBanner(roomId) {
  if (!isReturnToRegistrationCheck()) return '';
  const href = studyRoomSectionPath(roomId, 'publish');
  return `
    <div class="rc-return-banner" data-rc-return-banner>
      <a href="#${esc(href)}" class="rc-return-banner__link" data-p20-nav="${esc(href)}">${esc(RC_COPY.returnBanner.label)}</a>
      <p class="rc-return-banner__hint">${esc(RC_COPY.returnBanner.hint)}</p>
    </div>`;
}

/**
 * @param {number} roomId
 * @param {{ force?: boolean }} [opts]
 */
export async function ensureEmbeddedRegister(roomId, opts = {}) {
  if (!opts.force && loadedRoomId === roomId && Number(registerState.study_room_id) === roomId) {
    return registerState;
  }
  if (loadPromise) return loadPromise.then(() => registerState);

  loadPromise = (async () => {
    try {
      const masters = await fetchMasters();
      apiMasters.regions = masters.regions ?? [];
      apiMasters.complexes = masters.complexes ?? [];
      apiMasters.facilities = masters.facilities ?? [];
      apiMasters.subjects = masters.subjects ?? [];
    } catch {
      /* masters optional */
    }
    const room = await loadRoom(roomId);
    if (room) {
      applyRoomToState(registerState, room);
      const st = String(room.detail_completion_status || '');
      if (st === 'expanded_in_progress' || st === 'expanded_complete') {
        registerState.detailLessonSaved = true;
      }
      if (st === 'expanded_complete') {
        registerState.detailFacilitySaved = true;
      }
    }
    registerState.study_room_id = roomId;
    registerState.basicComplete = isRoomBasicComplete(registerState);
    loadedRoomId = roomId;
    sessionStorage.setItem('study114_study_room_id', String(roomId));
  })().finally(() => {
    loadPromise = null;
  });

  await loadPromise;
  return registerState;
}

/**
 * 탭 현황 진입 시 DB 재조회가 필요한지.
 * 수정 모드(?edit=1)에서는 방금 불러온 registerState를 유지한다.
 * @param {number} roomId
 * @param {string} section
 */
export function shouldReloadEmbeddedView(roomId, section) {
  if (isEmbedEditMode()) return !isEmbeddedRegisterReady(roomId);
  const key = `${roomId}:${section}`;
  if (lastViewKey !== key) return true;
  return !isEmbeddedRegisterReady(roomId);
}

/** @param {number} roomId @param {string} section */
export function markEmbeddedViewLoaded(roomId, section) {
  lastViewKey = `${roomId}:${section}`;
}

/** @param {number} roomId @param {'basic'|'detail'|'detail2'} section */
async function afterRegisterSave(roomId, section) {
  try {
    const room = await loadRoom(roomId);
    if (room) applyRoomToState(registerState, room);
  } catch {
    /* keep state */
  }
  registerState.basicComplete = isRoomBasicComplete(registerState);
  loadedRoomId = roomId;
  await syncHubCacheFromDb();
  lastViewKey = '';
  if (isReturnToRegistrationCheck()) {
    goRegistrationCheck(roomId);
    return;
  }
  setEditMode(roomId, section, false);
}

function opLabel(value) {
  return LESSON_OPERATION_TYPES.find((o) => o.value === value)?.label || blank(value);
}

function capacityLabel(value) {
  return CAPACITY_PER_TIME_OPTIONS.find((o) => o.value === value)?.label || blank(value);
}

function overviewDl(rows) {
  return `
    <dl class="register-overview__dl">
      ${rows
        .map((row) => {
          const empty = !String(row.value ?? '').trim();
          const valueHtml = row.multiline
            ? esc(blank(row.value)).replace(/\n/g, '<br />')
            : esc(blank(row.value));
          const req = row.required
            ? '<em class="register-required-mark">필수</em>'
            : '';
          return `
        <div class="register-overview__row${empty ? ' is-empty' : ''}">
          <dt>${esc(row.label)}${req}</dt>
          <dd><span>${valueHtml}</span></dd>
        </div>`;
        })
        .join('')}
    </dl>`;
}

function overviewToolbar(editLabel) {
  return `
    <div class="register-overview__toolbar">
      <button type="button" class="register-phase__tag is-active register-overview__edit-badge" data-embed-edit>${esc(editLabel)}</button>
      <p class="register-overview__lead">수정이 필요하면 눌러 주세요.</p>
    </div>`;
}

function detail1OverviewRows() {
  const s = registerState;
  const photoCount = Array.isArray(s.images) ? s.images.length : 0;
  const classCount = Array.isArray(s.classes)
    ? s.classes.filter((c) => String(c?.class_name || c?.name || '').trim()).length
    : 0;
  const styles = Array.isArray(s.teaching_style_ids) ? s.teaching_style_ids.filter(Boolean) : [];
  return [
    { label: '수업운영방식', value: opLabel(s.lesson_operation_type) },
    { label: '타임별 원생수', value: capacityLabel(s.capacity_per_time) },
    { label: '월 평균 수업료', value: s.monthly_fee_manwon ? `${s.monthly_fee_manwon}만원` : '', required: true },
    { label: '주당 평균 수업회수', value: s.lessons_per_week, required: true },
    { label: '한 줄 소개', value: s.intro_short, required: true },
    { label: '공부방 소개 / 자랑', value: s.intro_long, multiline: true, required: true },
    { label: '홍보사진', value: photoCount ? `${photoCount}장` : '', required: true },
    { label: '지도 스타일', value: styles.length ? `${styles.length}개 선택` : '', required: true },
    { label: '지도 스타일 추가설명', value: s.teaching_style_note, required: true },
    { label: '수업상세', value: classCount ? `${classCount}개 등록` : '', required: true },
    {
      label: '옵션',
      value: [s.weekend_available ? '주말 가능' : '', s.one_on_one_available ? '1:1 가능' : ''].filter(Boolean).join(' · '),
    },
  ];
}

function detail2OverviewRows() {
  const s = registerState;
  return [
    { label: '출신대학', value: s.university_name },
    { label: '전공학과', value: s.major_name },
    { label: '교습경력', value: s.career_years !== '' && s.career_years != null ? `${s.career_years}년` : '' },
    { label: '경력특징 1', value: s.feature_1, required: true },
    { label: '경력특징 2', value: s.feature_2 },
    { label: '경력특징 3', value: s.feature_3 },
    { label: '교육청등록', value: s.education_office_registered ? '등록' : '' },
    { label: '시설 설명', value: s.facility_note, multiline: true },
  ];
}

/** 마이페이지 본문 전폭 — 공부방상세정보 카드 안쪽만 (가짜 사이드바 그리드 없음) */
function embedFrame(section, roomId, content, frameOpts) {
  return renderRegisterCardInner(content, {
    ...frameOpts,
    showSteps: false,
    cardAttrs: `data-embed-section="${section}" data-embed-room-id="${roomId}"`,
  });
}

/**
 * @param {import('./store.js').StudyRoomRecord} room
 * @param {'basic'|'detail'|'detail2'} section
 */
export function renderEmbeddedPanel(room, section) {
  const editing = isEmbedEditMode();
  document.body.classList.toggle('register-edit-open', editing && section === 'basic');

  if (section === 'basic') {
    const content = `
      ${renderReturnToRegistrationCheckBanner(room.id)}
      ${renderBasicOverviewBoard({ editAction: 'embed-edit' })}
      ${editing ? renderBasicEditModal() : ''}
    `;
    return embedFrame('basic', room.id, content, {
      stepKey: 'basic',
      title: '공부방 기본정보 현황',
    });
  }

  if (section === 'detail') {
    if (editing) {
      return embedFrame(
        'detail',
        room.id,
        `${renderReturnToRegistrationCheckBanner(room.id)}${renderLessonFormHtml({ includeStepNav: false, includeFooterActions: true })}`,
        {
          stepKey: 'lesson',
          title: '공부방·교습소 상세',
          subtitle: '필수정보는 입력을 꼭 해주세요',
        },
      );
    }
    return embedFrame(
      'detail',
      room.id,
      `${renderReturnToRegistrationCheckBanner(room.id)}<div class="register-overview">${overviewToolbar('상세정보1 수정')}${overviewDl(detail1OverviewRows())}</div>`,
      {
        stepKey: 'lesson',
        title: '공부방·교습소 상세',
        subtitle: '현황을 확인한 뒤 필요하면 수정하세요',
      },
    );
  }

  if (editing) {
    return embedFrame(
      'detail2',
      room.id,
      `${renderReturnToRegistrationCheckBanner(room.id)}${renderFacilityFormHtml({
        includeStepNav: false,
        includePublishBlock: false,
        includeFooterActions: true,
      })}`,
      {
        stepKey: 'facility',
        title: '경력 · 신뢰 · 시설',
      },
    );
  }
  return embedFrame(
    'detail2',
    room.id,
    `${renderReturnToRegistrationCheckBanner(room.id)}<div class="register-overview">${overviewToolbar('상세정보2 수정')}${overviewDl(detail2OverviewRows())}</div>`,
    {
      stepKey: 'facility',
      title: '경력 · 신뢰 · 시설',
      subtitle: '현황을 확인한 뒤 필요하면 수정하세요',
    },
  );
}

/**
 * @param {HTMLElement} root
 * @param {() => void} rerender
 */
export function bindEmbeddedPanelEvents(root, rerender) {
  const wrap = root.querySelector('[data-embed-section]');
  if (!wrap) return;
  const section = /** @type {'basic'|'detail'|'detail2'} */ (wrap.getAttribute('data-embed-section'));
  const roomId = Number(wrap.getAttribute('data-embed-room-id'));

  wrap.querySelector('[data-embed-edit], [data-action="embed-edit"]')?.addEventListener('click', () => {
    setEditMode(roomId, section, true);
  });

  wrap.querySelectorAll('[data-p20-nav]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.hash = el.getAttribute('data-p20-nav') || '';
    });
  });

  if (section === 'basic' && isEmbedEditMode()) {
    const overlay = wrap.querySelector('[data-basic-edit-overlay]');
    const close = () => setEditMode(roomId, 'basic', false);

    overlay?.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });
    overlay?.querySelectorAll('[data-action="cancel-edit"]').forEach((btn) => {
      btn.addEventListener('click', close);
    });

    const form = overlay?.querySelector('[data-form="basic-all"]');
    bindDraggableDialog(
      overlay?.querySelector('.register-edit-dialog'),
      overlay?.querySelector('.register-edit-dialog__head'),
    );
    bindStudyRoomBasicFields(form || overlay, {
      getRegions,
      onRegion(region) {
        if (!apiMasters.regions.some((r) => String(r.id) === String(region.id))) {
          apiMasters.regions.push(region);
        }
      },
    });

    const saveBtn = overlay?.querySelector('[data-action="save-basic-all"]');
    saveBtn?.addEventListener('click', () => {
      withSaving(/** @type {HTMLButtonElement} */ (saveBtn), async () => {
        const formEl = overlay.querySelector('[data-form="basic-all"]');
        const data = collectStudyRoomBasicFields(formEl);
        const err = validateStudyRoomBasicFields(data);
        if (err) {
          alert(err);
          return;
        }
        applyStudyRoomBasicToState(registerState, data);
        await saveAndNavigate(registerState, 'basic_all', null);
        await afterRegisterSave(roomId, 'basic');
      }).catch(() => {});
    });
    return;
  }

  if (section === 'detail' && isEmbedEditMode()) {
    bindLessonEvents(wrap, {
      embed: true,
      onSaved: () => {
        afterRegisterSave(roomId, 'detail').catch(() => setEditMode(roomId, 'detail', false));
      },
      onCancel: () => setEditMode(roomId, 'detail', false),
      onRefresh: rerender,
    });
    scrollToRegistrationCheckFocus(wrap);
    return;
  }

  if (section === 'detail2' && isEmbedEditMode()) {
    bindFacilityEvents(wrap, {
      embed: true,
      onSaved: () => {
        afterRegisterSave(roomId, 'detail2').catch(() => setEditMode(roomId, 'detail2', false));
      },
      onCancel: () => setEditMode(roomId, 'detail2', false),
      onRefresh: rerender,
    });
    scrollToRegistrationCheckFocus(wrap);
  }
}
