/**
 * 마이페이지 내 등록 — 공부방상세정보(study-room-ui) 바디 이식
 * 조회(현황) → 상단 수정 → 저장 후 현황 복귀
 *
 * SSOT: `/api/study-room/register.php` → StudyRoomRegisterService → study_rooms DB
 * (공부방상세정보 앱과 동일 API·동일 테이블)
 */

import { registerState, apiMasters, isRoomBasicComplete, PERSONAL_GENDER_OPTIONS, getRegions } from '@study-room-ui/state.js';
import { fetchMasters, loadRoom } from '@study-room-ui/register-api.js';
import { applyRoomToState } from '@study-room-ui/form-collect.js';
import { saveAndNavigate, withSaving } from '@study-room-ui/save-flow.js';
import {
  renderStudyRoomBasicFields,
  bindStudyRoomBasicFields,
  collectStudyRoomBasicFields,
  validateStudyRoomBasicFields,
  applyStudyRoomBasicToState,
  lessonPlaceNameLabel,
  formatPrimaryAudienceLabel,
} from '../../../shared/study-room-basic-form.js';
import { bindDraggableDialog } from '../../../shared/draggable-dialog.js';
import { renderLessonFormHtml, bindLessonEvents } from '@study-room-ui/screens/step-lesson.js';
import { renderFacilityFormHtml, bindFacilityEvents } from '@study-room-ui/screens/step-facility.js';
import {
  LESSON_OPERATION_TYPES,
  CAPACITY_PER_TIME_OPTIONS,
} from '@study-room-ui/state.js';
import { hydrateRegistrationsCache, isRegistrationsApiMode } from '../registrations-backend.js';
import { studyRoomSectionPath } from './router.js';

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

/** @param {string} basePath */
export function withEditQuery(basePath, on) {
  const path = basePath.split('?')[0];
  return on ? `${path}?edit=1` : path;
}

function setEditMode(roomId, section, on) {
  const base = studyRoomSectionPath(roomId, section);
  window.location.hash = withEditQuery(base, on);
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
  setEditMode(roomId, section, false);
}

function genderLabel(value) {
  return PERSONAL_GENDER_OPTIONS.find((o) => o.value === value)?.label || blank(value);
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
          return `
        <div class="register-overview__row${empty ? ' is-empty' : ''}">
          <dt>${esc(row.label)}</dt>
          <dd><span>${valueHtml || '—'}</span></dd>
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

function basicOverviewRows() {
  const s = registerState;
  return [
    { label: '교습형태', value: s.lesson_place_type === 'academy' ? '교습소' : s.lesson_place_type === 'study_room' ? '공부방' : '' },
    { label: lessonPlaceNameLabel(s.lesson_place_type), value: s.study_room_name },
    { label: '주대상', value: formatPrimaryAudienceLabel(s.primary_school_levels) },
    { label: '주력과목', value: s.main_subject_note },
    { label: '원장성별', value: genderLabel(s.gender) },
    { label: '슬로건', value: s.slogan },
    { label: '집주소', value: [s.home_address, s.home_address_line2].filter((x) => String(x || '').trim()).join(' ') },
    { label: '사업장주소', value: [s.address_text, s.address_line2].filter((x) => String(x || '').trim()).join(' ') },
  ];
}

function detail1OverviewRows() {
  const s = registerState;
  const photoCount = Array.isArray(s.images) ? s.images.length : 0;
  return [
    { label: '수업운영방식', value: opLabel(s.lesson_operation_type) },
    { label: '타임별 원생수', value: capacityLabel(s.capacity_per_time) },
    { label: '월 평균 수업료', value: s.monthly_fee_manwon ? `${s.monthly_fee_manwon}만원` : '' },
    { label: '한 줄 소개', value: s.intro_short },
    { label: '상세 소개', value: s.intro_long, multiline: true },
    { label: '홍보사진', value: photoCount ? `${photoCount}장` : '' },
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
    { label: '경력특징', value: [s.feature_1, s.feature_2, s.feature_3].filter(Boolean).join(' · ') },
    { label: '교육청등록', value: s.education_office_registered ? '등록' : '' },
    { label: '시설 설명', value: s.facility_note, multiline: true },
  ];
}

function renderBasicEditModal() {
  return `
    <div class="register-edit-overlay" data-basic-edit-overlay>
      <div class="register-edit-dialog" role="dialog" aria-modal="true" aria-labelledby="embed-basic-edit-title">
        <div class="register-edit-dialog__head">
          <h2 id="embed-basic-edit-title" class="register-edit-dialog__title">기본정보 수정</h2>
          <button type="button" class="register-edit-dialog__close" data-action="cancel-edit" aria-label="닫기">×</button>
        </div>
        <form data-form="basic-all" class="register-edit-dialog__body">
          ${renderStudyRoomBasicFields({
            values: registerState,
            genderOptions: PERSONAL_GENDER_OPTIONS,
          })}
        </form>
        <div class="register-edit-dialog__foot">
          <button type="button" class="btn btn--secondary" data-action="cancel-edit">취소</button>
          <button type="button" class="btn btn--primary" data-action="save-basic-all">저장</button>
        </div>
      </div>
    </div>`;
}

/**
 * @param {import('./store.js').StudyRoomRecord} room
 * @param {'basic'|'detail'|'detail2'} section
 */
export function renderEmbeddedPanel(room, section) {
  const editing = isEmbedEditMode();
  document.body.classList.toggle('register-edit-open', editing && section === 'basic');

  if (section === 'basic') {
    if (editing) {
      return `
        <div class="register-flow mp-room-embed" data-embed-section="basic" data-embed-room-id="${room.id}">
          ${overviewToolbar('기본정보 수정')}
          ${overviewDl(basicOverviewRows())}
          ${renderBasicEditModal()}
        </div>`;
    }
    return `
      <div class="register-flow mp-room-embed" data-embed-section="basic" data-embed-room-id="${room.id}">
        <div class="register-overview">
          ${overviewToolbar('기본정보 수정')}
          ${overviewDl(basicOverviewRows())}
        </div>
      </div>`;
  }

  if (section === 'detail') {
    if (editing) {
      return `
        <div class="register-flow mp-room-embed" data-embed-section="detail" data-embed-room-id="${room.id}">
          ${renderLessonFormHtml({ includeStepNav: false })}
        </div>`;
    }
    return `
      <div class="register-flow mp-room-embed" data-embed-section="detail" data-embed-room-id="${room.id}">
        <div class="register-overview">
          ${overviewToolbar('상세정보1 수정')}
          ${overviewDl(detail1OverviewRows())}
        </div>
      </div>`;
  }

  // detail2
  if (editing) {
    return `
      <div class="register-flow mp-room-embed" data-embed-section="detail2" data-embed-room-id="${room.id}">
        ${renderFacilityFormHtml({ includeStepNav: false, includePublishBlock: false })}
      </div>`;
  }
  return `
    <div class="register-flow mp-room-embed" data-embed-section="detail2" data-embed-room-id="${room.id}">
      <div class="register-overview">
        ${overviewToolbar('상세정보2 수정')}
        ${overviewDl(detail2OverviewRows())}
      </div>
    </div>`;
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

  wrap.querySelector('[data-embed-edit]')?.addEventListener('click', () => {
    setEditMode(roomId, section, true);
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
  }
}
