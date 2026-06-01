import {
  AUTH_UI_BASE,
  GUEST_DEMO_REGION,
  GUEST_REGION_STATS,
  AD_FALLBACKS,
  SLOT_PRIME,
  SLOT_PICK_ROW,
} from './data.js';
import { EXPOSURE_STUDY_ROOMS, EXPOSURE_TUTORS, EXPOSURE_STUDENTS } from './exposure-data.js';
import {
  renderExposureBox,
  renderGuestPaginatedListBlock,
} from './exposure-render.js';
import { bindGuestListPagination } from './list-pagination.js';
import { SECTION_HEADINGS, renderSectionHeading } from './section-headings.js';

const LOGIN_URL = `${AUTH_UI_BASE}/#/login`;
const SIGNUP_URL = `${AUTH_UI_BASE}/#/signup/terms`;

function loginGateAttrs(action, label) {
  return `data-action="login-gate" data-gate="${action}" data-gate-label="${label}" tabindex="0" role="button"`;
}

export function renderGuestTempNotice() {
  return `
    <div class="temp-notice" role="status">
      <span class="temp-notice__badge">프리뷰</span>
      <span>대치동 고정 · 지도 주연 · 비교검색 로그인 후만</span>
    </div>
  `;
}

export function renderGuestHero() {
  const s = GUEST_REGION_STATS;
  const r = GUEST_DEMO_REGION;
  return `
    <section class="hero-map" aria-label="우리동네 지도">
      <aside class="hero-map__rail" aria-label="지역 요약">
        <p class="hero-map__eyebrow">우리동네</p>
        <h2 class="hero-map__dong">${r.dong}</h2>
        <p class="hero-map__sub">${r.gu}</p>
        <dl class="hero-map__stats">
          <div><dt>공부방</dt><dd>${s.studyRooms}</dd></div>
          <div><dt>과외쌤</dt><dd>${s.tutors}</dd></div>
          <div><dt>학생</dt><dd>${s.studentRequests}</dd></div>
        </dl>
      </aside>
      <div class="hero-map__canvas">
        <div class="hero-map__surface" role="img" aria-label="${r.gu} ${r.dong} 공부방 지도">
          <div class="map-block__grid" aria-hidden="true"></div>
          <span class="map-block__center-pin" title="${r.dong}"></span>
          <span class="map-block__pin map-block__pin--sm map-block__pin--orange" style="top:30%;left:36%"></span>
          <span class="map-block__pin map-block__pin--sm map-block__pin--orange" style="top:46%;left:58%"></span>
          <span class="map-block__pin map-block__pin--sm map-block__pin--blue" style="top:62%;left:24%"></span>
          <span class="map-block__pin map-block__pin--sm map-block__pin--purple" style="top:40%;left:72%"></span>
          <span class="map-block__placeholder">[임시] 지도 API · ${r.gu} ${r.dong}</span>
        </div>
      </div>
    </section>
  `;
}

function renderStudyRoomPrimePick() {
  const pool = EXPOSURE_STUDY_ROOMS;
  const guestOpts = { guest: true };
  return `
    <div class="content-section content-section--orange">
      ${renderSectionHeading({ ...SECTION_HEADINGS.primeStudyRoom, id: 'guest-prime-room' })}
      <div class="expo-grid--3">
        ${pool.slice(0, 3).map((item, i) => renderExposureBox('study_room', 'prime', item, SLOT_PRIME[i], guestOpts)).join('')}
      </div>

      ${renderSectionHeading(SECTION_HEADINGS.pickStudyRoom)}
      <div class="expo-grid--5">
        ${pool.slice(3, 8).map((item, i) => renderExposureBox('study_room', 'pick', item, SLOT_PICK_ROW[i], guestOpts)).join('')}
      </div>
      <div class="expo-grid--5 expo-grid--5-second">
        ${pool.slice(8, 13).map((item, i) => renderExposureBox('study_room', 'pick', item, `Pick ${i + 6}`, guestOpts)).join('')}
      </div>
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
  return `
    <div class="content-section content-section--blue">
      ${renderSectionHeading({ ...SECTION_HEADINGS.primeTutor, id: 'guest-prime-tutor' })}
      <div class="expo-grid--3">
        ${pool.slice(0, 3).map((item, i) => renderExposureBox('tutor', 'prime', item, SLOT_PRIME[i], guestOpts)).join('')}
      </div>

      ${renderSectionHeading(SECTION_HEADINGS.pickTutor)}
      <div class="expo-grid--5">
        ${pool.slice(3, 8).map((item, i) => renderExposureBox('tutor', 'pick', item, SLOT_PICK_ROW[i], guestOpts)).join('')}
      </div>
      <div class="expo-grid--5 expo-grid--5-second">
        ${pool.slice(8, 13).map((item, i) => renderExposureBox('tutor', 'pick', item, `Pick ${i + 6}`, guestOpts)).join('')}
      </div>
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

/** 박스 아래: 우동공과 공부방 → 과외쌤 → 학생 */
export function renderGuestBrowseLists() {
  return `
    <section class="guest-browse-lists" aria-label="우동공과 리스트">
      ${renderStudyRoomBasicList()}
      ${renderTutorBasicList()}
      ${renderGuestPaginatedListBlock('student', 'student', { ...SECTION_HEADINGS.students, id: 'guest-students-title' }, EXPOSURE_STUDENTS, { guest: true })}
      <div class="list-subsection list-subsection--students-foot">
        <p class="content-section__foot">
          로그인 후 상세·연락 회원 전용 · <a href="${LOGIN_URL}" target="_blank" rel="noopener">로그인</a>
        </p>
      </div>
    </section>
  `;
}

/** @deprecated renderGuestBrowseLists 사용 */
export function renderGuestStudentList() {
  return renderGuestBrowseLists();
}

function renderPromoCard(item, variant = 'compact') {
  return `
    <div class="promo-card promo-card--${variant}" data-action="${item.action}">
      <span class="promo-card__tag">${item.tag}</span>
      <h3 class="promo-card__title">${item.title}</h3>
      <p class="promo-card__desc">${item.desc}</p>
      <button type="button" class="promo-card__cta">${item.cta} →</button>
    </div>
  `;
}

export function renderGuestAdSidebar() {
  return `
    <aside class="home-sidebar home-sidebar--guest" aria-label="프로모션">
      ${renderPromoCard(AD_FALLBACKS.premium, 'tall')}
      ${renderPromoCard(AD_FALLBACKS.partner)}
      ${renderPromoCard(AD_FALLBACKS.public)}
    </aside>
  `;
}

export function renderGuestAdInline() {
  return `<div class="guest-ad-inline">${renderPromoCard(AD_FALLBACKS.premium, 'compact')}</div>`;
}

export function renderGuestLoginStrip() {
  return `
    <aside class="guest-login-strip">
      <p class="guest-login-strip__text">비교검색은 <strong>로그인 후</strong> 팝업 표로만 이용할 수 있습니다.</p>
      <div class="guest-login-strip__btns">
        <a href="${LOGIN_URL}" class="btn btn--primary btn--sm" target="_blank" rel="noopener">로그인</a>
        <a href="${SIGNUP_URL}" class="btn btn--secondary btn--sm" target="_blank" rel="noopener">회원가입</a>
      </div>
    </aside>
  `;
}

export function renderGuestStudyAndTutorSections() {
  return `${renderGuestExposureBoxes()}${renderGuestBrowseLists()}`;
}

export function bindGuestSectionEvents(root, rerender) {
  if (rerender) bindGuestListPagination(root, rerender);

  root.querySelectorAll('.item-actions__btn').forEach((btn) => {
    btn.addEventListener('click', (e) => e.stopPropagation());
  });

  root.querySelectorAll('[data-action="login-gate"]').forEach((el) => {
    const handler = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const label = el.dataset.gateLabel || '이 기능';
      const gate = el.dataset.gate || 'default';
      const go = confirm(`[프리뷰] ${label}\n\n비회원은 일부 탐색만 가능합니다. 로그인 화면으로 이동할까요?`);
      if (go) {
        window.open(`${LOGIN_URL}?${new URLSearchParams({ from: 'guest', action: gate })}`, '_blank', 'noopener');
      }
    };
    el.addEventListener('click', handler);
  });

  root.querySelectorAll('[data-action="compare-guest-blocked"]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const kind = btn.dataset.compareKind || 'study_room';
      alert(`[11장] 비교검색은 로그인 후에만 이용할 수 있습니다.\n\n학부모 메인(#/parent)에서 표 모달을 확인하세요.`);
    });
  });

  root.querySelectorAll('[data-action^="ad-"]').forEach((el) => {
    el.addEventListener('click', () => alert('[프리뷰] 광고·프리미엄 안내'));
  });
}
