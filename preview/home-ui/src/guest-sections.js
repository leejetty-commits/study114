import {
  AUTH_UI_BASE,
  GUEST_DEMO_REGION,
  GUEST_REGION_STATS,
} from './data.js';
import { SEARCH_UI_URL } from './nav-config.js';
import { EXPOSURE_STUDY_ROOMS, EXPOSURE_TUTORS, EXPOSURE_STUDENTS } from './exposure-data.js';
import {
  renderPrimeSlotGrid,
  renderGuestPaginatedListBlock,
  renderPickPaginatedBlock,
  getPrimeOccupied,
} from './exposure-render.js';
import { bindGuestListPagination } from './list-pagination.js';
import { SECTION_HEADINGS, renderSectionHeading } from './section-headings.js';
import { bindStudyRoomMapSection } from '../../shared/naver-map.js';
import {
  renderSitePromoSidebar,
  renderSitePromoInline,
  bindSitePromoSidebarEvents,
} from '../../shared/promo-sidebar.js';

const LOGIN_URL = `${AUTH_UI_BASE}/#/login`;
const SIGNUP_URL = `${AUTH_UI_BASE}/#/signup/terms`;

function loginGateAttrs(action, label) {
  return `data-action="login-gate" data-gate="${action}" data-gate-label="${label}" tabindex="0" role="button"`;
}

export function renderGuestTempNotice() {
  return '';
}

export function renderGuestHero() {
  const s = GUEST_REGION_STATS;
  const r = GUEST_DEMO_REGION;
  return `
    <section class="hero-map" aria-label="우리동네 지도" data-study-room-map data-map-variant="hero" data-region-label="${r.full}" data-allow-fallback="true">
      <aside class="hero-map__rail" aria-label="지역 요약">
        <h1 class="hero-map__dong">${r.dong}</h1>
        <p class="hero-map__sub">${r.gu} · 공부방·과외쌤을 한눈에 비교하세요</p>
        <a href="${SEARCH_UI_URL}" class="btn btn--primary hero-map__cta" data-util-href="${SEARCH_UI_URL}">
          ${r.dong} 공부방·과외쌤 찾기
        </a>
        <dl class="hero-map__stats">
          <div><dt>공부방</dt><dd>${s.studyRooms}</dd></div>
          <div><dt>과외쌤</dt><dd>${s.tutors}</dd></div>
          <div><dt>학생</dt><dd>${s.studentRequests}</dd></div>
        </dl>
      </aside>
      <div class="hero-map__canvas">
        <div class="hero-map__surface hero-map__surface--naver" aria-label="${r.gu} ${r.dong} 공부방 지도">
          <div class="naver-map-mount-host" data-naver-map-mount></div>
        </div>
      </div>
    </section>
  `;
}

function guestHeroMapItems() {
  return EXPOSURE_STUDY_ROOMS.filter((item) => item.profile_status === 'published').slice(0, 12);
}

function renderStudyRoomPrimePick() {
  const pool = EXPOSURE_STUDY_ROOMS;
  const guestOpts = { guest: true };
  const occupied = getPrimeOccupied(pool);
  return `
    <div class="content-section content-section--orange">
      ${renderSectionHeading({ ...SECTION_HEADINGS.primeStudyRoom, id: 'guest-prime-room' })}
      ${renderPrimeSlotGrid('study_room', occupied, guestOpts)}
      ${renderPickPaginatedBlock('study_room', 'pick_study_room', SECTION_HEADINGS.pickStudyRoom, pool, {
        ...guestOpts,
        primeOccupied: occupied,
      })}
    </div>
  `;
}

function renderStudyRoomBasicList() {
  return renderGuestPaginatedListBlock(
    'study_room',
    'study_room',
    SECTION_HEADINGS.basicStudyRoom,
    EXPOSURE_STUDY_ROOMS,
    { guest: true },
  );
}

function renderTutorPrimePick() {
  const pool = EXPOSURE_TUTORS;
  const guestOpts = { guest: true };
  const occupied = getPrimeOccupied(pool);
  return `
    <div class="content-section content-section--blue">
      ${renderSectionHeading({ ...SECTION_HEADINGS.primeTutor, id: 'guest-prime-tutor' })}
      ${renderPrimeSlotGrid('tutor', occupied, guestOpts)}
      ${renderPickPaginatedBlock('tutor', 'pick_tutor', SECTION_HEADINGS.pickTutor, pool, {
        ...guestOpts,
        primeOccupied: occupied,
      })}
    </div>
  `;
}

function renderTutorBasicList() {
  return renderGuestPaginatedListBlock(
    'tutor',
    'tutor',
    SECTION_HEADINGS.basicTutor,
    EXPOSURE_TUTORS,
    { guest: true },
  );
}

/** 프라임·픽 박스 전체 (공부방 → 과외쌤) */
export function renderGuestExposureBoxes() {
  return `${renderStudyRoomPrimePick()}${renderTutorPrimePick()}`;
}

/** 박스 아래: 우동공과 공부방 → 과외쌤 → 학생(후반) */
export function renderGuestBrowseLists() {
  return `
    <section class="guest-browse-lists" aria-label="우동공과 리스트">
      ${renderStudyRoomBasicList()}
      ${renderTutorBasicList()}
    </section>
    <section class="guest-browse-lists guest-browse-lists--students" aria-label="학생 학습 의뢰">
      ${renderGuestPaginatedListBlock('student', 'student', { ...SECTION_HEADINGS.students, id: 'guest-students-title' }, EXPOSURE_STUDENTS, { guest: true })}
    </section>
  `;
}

/** @deprecated renderGuestBrowseLists 사용 */
export function renderGuestStudentList() {
  return renderGuestBrowseLists();
}

export function renderGuestAdSidebar() {
  return renderSitePromoSidebar();
}

export function renderGuestAdInline() {
  return renderSitePromoInline();
}

export function renderGuestLoginStrip() {
  return `
    <aside class="guest-login-strip">
      <p class="guest-login-strip__text">비교검색은 <strong>로그인 후</strong> 팝업 표로만 이용할 수 있습니다.</p>
      <div class="guest-login-strip__btns">
        <a href="${LOGIN_URL}" class="btn btn--primary btn--sm" data-util-href="${LOGIN_URL}">로그인</a>
        <a href="${SIGNUP_URL}" class="btn btn--secondary btn--sm" data-util-href="${SIGNUP_URL}">회원가입</a>
      </div>
    </aside>
  `;
}

export function renderGuestStudyAndTutorSections() {
  return `${renderGuestExposureBoxes()}${renderGuestBrowseLists()}`;
}

export function bindGuestSectionEvents(root, rerender) {
  if (rerender) bindGuestListPagination(root, rerender);

  bindStudyRoomMapSection(root, guestHeroMapItems(), {
    regionLabel: GUEST_DEMO_REGION.full,
  });

  root.querySelectorAll('.item-actions__btn').forEach((btn) => {
    btn.addEventListener('click', (e) => e.stopPropagation());
  });

  root.querySelectorAll('[data-action="login-gate"]').forEach((el) => {
    const handler = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const gate = el.dataset.gate || 'default';
      window.location.assign(
        `${LOGIN_URL}?${new URLSearchParams({ from: 'guest', action: gate })}`,
      );
    };
    el.addEventListener('click', handler);
  });

  root.querySelectorAll('[data-action="compare-guest-blocked"]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      window.location.assign(`${LOGIN_URL}?from=guest&action=compare`);
    });
  });

  bindSitePromoSidebarEvents(root);
}
