import {
  AUTH_UI_BASE,
  GUEST_DEMO_REGION,
  GUEST_DEMO_REGIONS_BY_AXIS,
  GUEST_REGION_STATS,
} from './data.js';
import { SEARCH_UI_URL } from './nav-config.js';
import { EXPOSURE_STUDY_ROOMS, EXPOSURE_TUTORS, EXPOSURE_STUDENTS } from './exposure-data.js';
import {
  renderPrimeSlotGrid,
  renderGuestPaginatedListBlock,
  renderPickPaginatedBlock,
  getPrimeOccupied,
  getPrimeCandidatePool,
} from './exposure-render.js';
import { bindGuestListPagination } from './list-pagination.js';
import { bindListSortControls } from '../../shared/list-sort.js';
import { setGuestListPage } from './state.js';
import { SECTION_HEADINGS, renderSectionHeading } from './section-headings.js';
import { bindStudyRoomMapSection } from '../../shared/naver-map.js';
import {
  renderSitePromoSidebar,
  bindSitePromoSidebarEvents,
} from '../../shared/promo-sidebar.js';
import { renderPromoInlineCard } from './promo/screens.js';
import { renderGuestMarketingBanner } from './home-marketing-banner.js';
import {
  getHomeBasicPool,
  isHomeBasicLive,
  refetchHomeBasicKind,
} from './home-basic-live.js';
import { toggleRecommendation } from './search-api.js';
import { isLoggedIn } from './auth-session.js';

const LOGIN_URL = `${AUTH_UI_BASE}/#/login`;
const SIGNUP_URL = `${AUTH_UI_BASE}/#/signup/terms`;

function loginGateAttrs(action, label) {
  return `data-action="login-gate" data-gate="${action}" data-gate-label="${label}" tabindex="0" role="button"`;
}

/** 홈 상단 마케팅 배너 (3안 · cinema) */
export function renderGuestTempNotice() {
  return renderGuestMarketingBanner();
}

export function renderGuestHero() {
  const s = GUEST_REGION_STATS;
  const r = GUEST_DEMO_REGION;
  return `
    <section class="hero-map hero-map--float-rail" aria-label="우리동네 지도" data-study-room-map data-map-variant="hero" data-region-label="${r.full}" data-allow-fallback="true">
      <div class="hero-map__canvas">
        <div class="hero-map__surface hero-map__surface--naver" aria-label="${r.gu} ${r.dong} 공부방 지도">
          <div class="naver-map-mount-host" data-naver-map-mount></div>
        </div>
      </div>
      <aside class="hero-map__banner" aria-label="지역 요약">
        <h1 class="hero-map__dong">${r.dong}</h1>
        <p class="hero-map__sub">${r.gu} · 우리동네 공부방·과외를 쪽지로 연결하세요</p>
        <a href="${SEARCH_UI_URL}" class="btn btn--primary hero-map__cta" data-util-href="${SEARCH_UI_URL}">
          ${r.dong} 공부방·과외쌤 찾기
        </a>
        <dl class="hero-map__stats">
          <div><dt>공부방</dt><dd>${s.studyRooms}</dd></div>
          <div><dt>과외쌤</dt><dd>${s.tutors}</dd></div>
          <div><dt>학생</dt><dd>${s.studentRequests}</dd></div>
        </dl>
      </aside>
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
  const roomLabel = GUEST_DEMO_REGIONS_BY_AXIS.room.full;
  return `
    <div class="content-section content-section--orange">
      ${renderSectionHeading({ ...SECTION_HEADINGS.primeStudyRoom, id: 'guest-prime-room', locationLabel: roomLabel })}
      ${renderPrimeSlotGrid('study_room', occupied, guestOpts)}
      ${renderPickPaginatedBlock('study_room', 'pick_study_room', { ...SECTION_HEADINGS.pickStudyRoom, locationLabel: roomLabel }, pool, {
        ...guestOpts,
        primeOccupied: occupied,
      })}
    </div>
  `;
}

function renderStudyRoomBasicList() {
  const roomLabel = GUEST_DEMO_REGIONS_BY_AXIS.room.full;
  return renderGuestPaginatedListBlock(
    'study_room',
    'study_room',
    { ...SECTION_HEADINGS.basicStudyRoom, locationLabel: roomLabel },
    EXPOSURE_STUDY_ROOMS,
    { guest: true },
  );
}

function renderTutorPrimePick() {
  const pool = EXPOSURE_TUTORS;
  const guestOpts = { guest: true };
  /** 시 단위 후보 풀 전체 — Pick/Basic 제외·Prime 회전·페이지에 동일 사용 */
  const occupied = getPrimeCandidatePool('tutor', pool);
  const tutorRegion = GUEST_DEMO_REGIONS_BY_AXIS.tutor.full;
  return `
    <div class="content-section content-section--blue">
      ${renderSectionHeading({ ...SECTION_HEADINGS.primeTutor, id: 'guest-prime-tutor', locationLabel: tutorRegion })}
      ${renderPrimeSlotGrid('tutor', occupied, { ...guestOpts, listId: 'prime_tutor' })}
      ${renderPickPaginatedBlock('tutor', 'pick_tutor', { ...SECTION_HEADINGS.pickTutor, locationLabel: tutorRegion }, pool, {
        ...guestOpts,
        primeOccupied: occupied,
      })}
    </div>
  `;
}

function renderTutorBasicList() {
  const tutorLabel = GUEST_DEMO_REGIONS_BY_AXIS.tutor.full;
  const occupied = getPrimeCandidatePool('tutor', EXPOSURE_TUTORS);
  return renderGuestPaginatedListBlock(
    'tutor',
    'tutor',
    { ...SECTION_HEADINGS.basicTutor, locationLabel: tutorLabel },
    EXPOSURE_TUTORS,
    { guest: true, primeOccupied: occupied },
  );
}

/** 대표·추천 노출 박스 전체 (공부방 → 과외쌤) */
export function renderGuestExposureBoxes() {
  return `${renderStudyRoomPrimePick()}${renderTutorPrimePick()}`;
}

/** 박스 아래: 우동공과 공부방 → 과외쌤 → 학생(후반) — 축별 기본 지역 라벨 */
export function renderGuestBrowseLists() {
  const roomLabel = GUEST_DEMO_REGIONS_BY_AXIS.room.full;
  const tutorLabel = GUEST_DEMO_REGIONS_BY_AXIS.tutor.full;
  const studentLabel = GUEST_DEMO_REGIONS_BY_AXIS.student.full;
  const live = isHomeBasicLive();
  const guest = !isLoggedIn();
  const rooms = getHomeBasicPool('study_room');
  const tutors = getHomeBasicPool('tutor');
  const students = getHomeBasicPool('student');
  return `
    <section class="guest-browse-lists" aria-label="우동공과 리스트">
      ${renderGuestPaginatedListBlock('study_room', 'study_room', { ...SECTION_HEADINGS.basicStudyRoom, locationLabel: roomLabel }, rooms, { guest, serverSorted: live })}
      ${renderGuestPaginatedListBlock('tutor', 'tutor', { ...SECTION_HEADINGS.basicTutor, locationLabel: tutorLabel }, tutors, { guest, serverSorted: live })}
    </section>
    <section class="guest-browse-lists guest-browse-lists--students" aria-label="학생 학습 의뢰">
      ${renderGuestPaginatedListBlock('student', 'student', { ...SECTION_HEADINGS.students, id: 'guest-students-title', locationLabel: studentLabel }, students, { guest, serverSorted: live })}
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
  return renderPromoInlineCard();
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
  if (rerender) {
    bindListSortControls(root, rerender, {
      onSortChange: (kind, sort, listId) => {
        if (listId) setGuestListPage(listId, 1);
        if (!isHomeBasicLive()) return undefined;
        const k =
          kind === 'room' || kind === 'study_room'
            ? 'study_room'
            : kind === 'tutor'
              ? 'tutor'
              : 'student';
        refetchHomeBasicKind(k, sort).then((ok) => {
          if (ok) rerender();
        });
        return false;
      },
    });
  }

  bindStudyRoomMapSection(root, guestHeroMapItems(), {
    regionLabel: GUEST_DEMO_REGION.full,
  });

  root.querySelectorAll('.item-actions__btn').forEach((btn) => {
    btn.addEventListener('click', (e) => e.stopPropagation());
  });

  root.querySelectorAll('[data-action="recommend-toggle"]').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const kind = btn.getAttribute('data-item-kind');
      const id = Number(btn.getAttribute('data-item-id'));
      if ((kind !== 'study_room' && kind !== 'tutor') || !id) return;
      try {
        const data = await toggleRecommendation(kind, id);
        const countEl = btn.querySelector('.item-actions__count');
        if (countEl) countEl.textContent = String(data.recommend_count ?? 0);
        btn.classList.toggle('is-active', Boolean(data.recommended));
        btn.title = `추천 ${data.recommend_count ?? 0}`;
      } catch (err) {
        console.warn('[recommend]', err);
        window.alert(err instanceof Error ? err.message : '추천 처리에 실패했습니다.');
      }
    });
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
