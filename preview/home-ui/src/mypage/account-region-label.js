/**
 * 마이페이지 계정 카드 「대표 지역」.
 * 공부방 = 대표 홍보지역 promo_label, 과외쌤 = 과외지역 1(대표), 학생 = 가입 분기 1번.
 * 사업장 주소(region_label)로는 대체하지 않는다.
 */

import { studyRoomPromo1Label, pickOwnStudyRoom } from '../study-room-home-seed.js';
import { tutorHomePrimaryLabel, tutorHomeRegionsReady } from '../tutor-home-seed.js';
import { primaryHopeRegionLabel } from '../../../shared/student-hope-regions.js';
import { tutorUnitLabelFromId } from '../../../shared/tutor-unit-cascade.js';
import { ensureTutorCityUnits, getTutorCityUnits, tutorCityUnitsError, tutorCityUnitsReady } from '../tutor-reg/city-units.js';
import { getStudents } from '../student-reg/store.js';
import { getTutors } from '../tutor-reg/store.js';
import { getStudyRooms } from '../study-room-reg/store.js';
import { hydrateRegistrationsCache, isRegistrationsApiMode } from '../registrations-backend.js';

export const ACCOUNT_REGION_UNSET = '등록 전';

/** 세션 부트의 hydrate가 끝나기 전엔 false. 빈 캐시를 「등록 전」으로 단정하지 않는다. */
let registrationsSettled = false;

/** @param {string} role */
function roleKind(role) {
  if (role === 'parent' || role === 'student' || role === 'guardian_student') return 'student';
  if (role === 'study_room' || role === 'study_room_owner') return 'study_room';
  if (role === 'tutor') return 'tutor';
  return '';
}

function isPrimaryFlag(slot) {
  return !!slot && (slot.is_primary === true || slot.is_primary === 1 || slot.is_primary === '1');
}

/**
 * 행정동 #번호, 단지 #번호, 지역 id 숫자는 표시하지 않는다.
 * @param {unknown} raw
 */
export function sanitizeAccountRegionLabel(raw) {
  const text = String(raw ?? '').replace(/\s+/g, ' ').trim();
  if (!text || text === '—' || text === '-') return '';
  if (/^\d+$/.test(text)) return '';
  if (/#\s*\d+/.test(text)) return '';
  return text;
}

/** @param {object|null|undefined} tutor */
export function primaryTutorRegionId(tutor) {
  const saved = Array.isArray(tutor?.saved_regions) ? tutor.saved_regions : [];
  const flagged = saved.find((slot) => isPrimaryFlag(slot) && /^\d+$/.test(String(slot?.region_id || '').trim()));
  if (flagged) return String(flagged.region_id).trim();
  const fallback = String(tutor?.primary_region_id || '').trim();
  return /^\d+$/.test(fallback) ? fallback : '';
}

/** 클라이언트 조합. 홈 칩이 이미 있으면 그 라벨, 아니면 대표 region_id → 과외 단위 이름. */
function tutorClientLabel(tutor, units) {
  if (tutorHomeRegionsReady()) {
    const home = sanitizeAccountRegionLabel(tutorHomePrimaryLabel());
    if (home) return home;
  }
  const id = primaryTutorRegionId(tutor);
  if (!id) return '';
  return sanitizeAccountRegionLabel(tutorUnitLabelFromId(id, units || []));
}

function finish(raw) {
  const text = sanitizeAccountRegionLabel(raw);
  return { pending: false, text: text || ACCOUNT_REGION_UNSET };
}

/**
 * @param {string} role
 * @param {{
 *   loaded?: boolean,
 *   room?: object|null,
 *   tutor?: object|null,
 *   student?: object|null,
 *   units?: object[],
 *   unitsPhase?: 'idle'|'loading'|'ready'|'error',
 * }} [ctx]
 * @returns {{ pending: boolean, text: string }}
 */
export function accountRegionView(role, ctx = {}) {
  if (ctx.loaded === false) return { pending: true, text: '' };
  const kind = roleKind(role);
  if (kind === 'study_room') return finish(studyRoomPromo1Label(ctx.room));
  if (kind === 'student') return finish(ctx.student ? primaryHopeRegionLabel(ctx.student) : '');
  if (kind === 'tutor') {
    const phase = ctx.unitsPhase || 'ready';
    const client = tutorClientLabel(ctx.tutor, ctx.units || []);
    const server = sanitizeAccountRegionLabel(ctx.tutor?.primary_region_label);
    const id = primaryTutorRegionId(ctx.tutor);
    if (!client && !server && id && (phase === 'idle' || phase === 'loading')) {
      return { pending: true, text: '' };
    }
    return { pending: false, text: client || server || ACCOUNT_REGION_UNSET };
  }
  return finish('');
}

function hasRoleRows(role) {
  const kind = roleKind(role);
  if (kind === 'study_room') return getStudyRooms().some((row) => row && !row.deleted_at);
  if (kind === 'tutor') return getTutors().some((row) => row && !row.deleted_at);
  if (kind === 'student') return getStudents().some((row) => row && row.id && row.exposure_status !== 'deleted');
  return false;
}

function pickAccountTutor() {
  const tutors = getTutors().filter((row) => row && !row.deleted_at);
  return tutors.find((row) => row.profile_status === 'published') || tutors[0] || null;
}

function pickAccountStudent() {
  const students = getStudents().filter((row) => row && row.id && row.exposure_status !== 'deleted');
  return students[0] || null;
}

function liveUnitsPhase() {
  if (tutorCityUnitsReady()) return 'ready';
  if (tutorCityUnitsError()) return 'error';
  return 'idle';
}

function liveContext(role) {
  const kind = roleKind(role);
  const loaded = !isRegistrationsApiMode() || registrationsSettled || hasRoleRows(role);
  if (kind === 'study_room') return { loaded, room: pickOwnStudyRoom() };
  if (kind === 'tutor') {
    return {
      loaded,
      tutor: pickAccountTutor(),
      units: getTutorCityUnits(),
      unitsPhase: liveUnitsPhase(),
    };
  }
  return { loaded, student: pickAccountStudent() };
}

/** 화면이 쓰는 현재 값. 역할 분기는 이 모듈 안에만 있다. */
export function accountRegionPresentation(role) {
  return accountRegionView(role, liveContext(role));
}

let chain = Promise.resolve();

/**
 * 등록 캐시와(과외쌤이면) 지역 단위를 채운 뒤 끝난다.
 * 새로고침 시 initAuthSession → activateRegistrationsApi → list API 가 같은 캐시를 다시 채운다.
 * @param {string} role
 */
export function ensureAccountRegionLabel(role) {
  const job = chain.then(async () => {
    if (isRegistrationsApiMode()) {
      try {
        await hydrateRegistrationsCache();
      } catch {
        /* 이미 있는 캐시를 그대로 표시한다 */
      }
    }
    registrationsSettled = true;
    if (roleKind(role) === 'tutor') {
      try {
        await ensureTutorCityUnits();
      } catch {
        /* 조합이 안 되면 primary_region_label */
      }
    }
  });
  chain = job.catch(() => {});
  return job;
}

/** 계정 카드의 대표 지역 칸만 고친다. 표시명·비밀번호 입력은 건드리지 않는다. */
export function paintAccountRegionLabel(root, role) {
  if (!root || root.isConnected === false) return;
  const slot = root.querySelector?.('[data-account-region-label]');
  if (!slot || slot.isConnected === false) return;
  const view = accountRegionPresentation(role);
  if (view.pending) {
    slot.setAttribute('data-pending', '1');
    slot.textContent = '';
    return;
  }
  slot.removeAttribute('data-pending');
  slot.textContent = view.text;
}
