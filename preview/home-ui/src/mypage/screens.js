import { AUTH_UI_BASE, STUDY_ROOM_REGISTER_URL, TUTOR_REGISTER_URL, searchUiUrl } from '../nav-config.js';
import { getNavRole } from '../state.js';
import {
  getPreviewProfile,
  getRegistrationData,
  getSummaryCounts,
  getPrimaryCta,
  statusLabel,
} from './preview-data.js';
import { getRecentViews } from './recent-store.js';
import {
  getWishlistItems,
  removeWishlist,
  addCompareFromWishlist,
} from '../user-actions-state.js';
import { formatMonthlyWon, formatTutorFeeCard } from '../exposure-format.js';
import { COMPARE_MAX } from '../exposure-schema.js';
import { MYPAGE_NAV } from './router.js';
import { getMessagesSummaryCounts } from '../messages/screens.js';

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

function roleLabel(role) {
  const map = { parent: '학생(학부모)', study_room: '공부방', tutor: '과외쌤' };
  return map[role] || role;
}

function renderCtaBlock(cta) {
  if (cta.externalRegister) {
    const url = cta.kind === 'tutor' ? TUTOR_REGISTER_URL : STUDY_ROOM_REGISTER_URL;
    return `
      <div class="mypage-cta">
        <p class="mypage-cta__hint">${esc(cta.hint)}</p>
        <a href="${url}" class="btn btn--primary" target="_blank" rel="noopener">${esc(cta.text)}</a>
      </div>`;
  }
  if (cta.path) {
    return `
      <div class="mypage-cta">
        <p class="mypage-cta__hint">${esc(cta.hint || '')}</p>
        <a href="#${cta.path}" class="btn btn--primary" data-mypage-nav="${cta.path}">${esc(cta.text)}</a>
      </div>`;
  }
  return `
    <div class="mypage-cta">
      <p class="mypage-cta__hint">${esc(cta.hint || '')}</p>
      <span class="mypage-cta__text">${esc(cta.text)}</span>
    </div>`;
}

/** @param {string} path */
export function renderMypageScreen(path) {
  const role = getNavRole();
  /** @type {'parent'|'study_room'|'tutor'} */
  const r = role === 'guest' ? 'parent' : role;
  const profile = getPreviewProfile(r);
  const counts = getSummaryCounts(r);
  const cta = getPrimaryCta(r);

  if (path === '/mypage/home') return renderHome(r, profile, counts, cta);
  if (path === '/mypage/registrations') return renderRegistrationsIndex(r);
  if (path === '/mypage/registrations/students') return renderStudents(r);
  if (path === '/mypage/registrations/study-rooms') return renderStudyRooms(r);
  if (path === '/mypage/registrations/tutors') return renderTutors(r);
  if (path === '/mypage/wishlist') return renderWishlist();
  if (path === '/mypage/recent') return renderRecent(r);
  if (path === '/mypage/messages') return renderMessages();
  if (path === '/mypage/plans') return renderPlans(r);
  if (path === '/mypage/verification') return renderVerification(r);
  if (path === '/mypage/account') return renderAccount(r, profile);
  return renderHome(r, profile, counts, cta);
}

function renderHome(role, profile, counts, cta) {
  const cards = MYPAGE_NAV.filter((n) => n.path !== '/mypage/home').map(
    (n) => `
    <a href="#${n.path}" class="mypage-card" data-mypage-nav="${n.path}">
      <span class="mypage-card__label">${esc(n.label)}</span>
      <span class="mypage-card__id">${n.screenId}</span>
    </a>`,
  );

  const paidStat =
    role === 'parent'
      ? `<span class="mypage-stat is-muted" title="15장 §7">공급자용</span>`
      : `<span class="mypage-stat"><strong>${counts.paidDaysLeft ?? '—'}</strong>일 남음</span>`;

  return `
    <section class="mypage-panel">
      <div class="mypage-status">
        <span class="mypage-badge">${esc(roleLabel(role))}</span>
        <span>${esc(profile.regionLabel)}</span>
        <span class="mypage-muted">${esc(profile.email)}</span>
      </div>
      ${renderCtaBlock(cta)}
      <div class="mypage-shortcuts">${cards.join('')}</div>
      <div class="mypage-stats" aria-label="숫자 요약">
        <div class="mypage-stat"><span>공개중</span><strong>${counts.published}</strong></div>
        <div class="mypage-stat"><span>임시저장</span><strong>${counts.draft}</strong></div>
        <div class="mypage-stat"><span>찜</span><strong>${counts.wishlist}</strong></div>
        <div class="mypage-stat"><span>읽지 않은 쪽지</span><strong>${counts.unreadMessages}</strong></div>
        <div class="mypage-stat">${paidStat}</div>
      </div>
      <p class="mypage-note">15장 §4 · 숫자는 다음 CTA의 입력값입니다.</p>
    </section>`;
}

function renderRegistrationsIndex(role) {
  const links = [];
  if (role === 'parent') {
    links.push({ path: '/mypage/registrations/students', label: '자녀(학생)', id: 'P15-03' });
  }
  if (role === 'study_room') {
    links.push({ path: '/mypage/registrations/study-rooms', label: '공부방', id: 'P15-04' });
  }
  if (role === 'tutor') {
    links.push({ path: '/mypage/registrations/tutors', label: '과외 프로필', id: 'P15-05' });
  }
  if (role === 'parent') {
    links.push({ path: '/mypage/registrations/students', label: '자녀 관리 (학부모)', id: 'P15-03' });
  }

  const unique = [...new Map(links.map((l) => [l.path, l])).values()];

  return `
    <section class="mypage-panel">
      <p class="mypage-lead">역할에 맞는 등록 유형으로 이동합니다. (19~21장 본문은 register-ui)</p>
      <div class="mypage-card-grid">
        ${unique
          .map(
            (l) => `
          <a href="#${l.path}" class="mypage-card mypage-card--wide" data-mypage-nav="${l.path}">
            <span class="mypage-card__label">${esc(l.label)}</span>
            <span class="mypage-card__id">${l.id}</span>
          </a>`,
          )
          .join('')}
      </div>
    </section>`;
}

function renderStudents(role) {
  const students = getRegistrationData(role).students;
  if (!students.length) {
    return `
      <section class="mypage-panel mypage-empty">
        <p>등록된 자녀가 없습니다.</p>
        <p class="mypage-muted">15장 §11 · 자녀 등록 CTA 우선</p>
        <a href="${AUTH_UI_BASE}/#/signup/basic" class="btn btn--primary" target="_blank" rel="noopener">자녀 기본등록</a>
      </section>`;
  }
  return `
    <section class="mypage-panel">
      <ul class="mypage-entity-list">
        ${students
          .map(
            (s) => `
          <li class="mypage-entity">
            <div>
              <strong>${esc(s.public_display_name)}</strong>
              <span class="mypage-muted">${esc(s.grade_level)} · students.exposure_status</span>
            </div>
            <span class="mypage-badge mypage-badge--${s.exposure_status}">${statusLabel(s.exposure_status)}</span>
            <button type="button" class="btn btn--secondary btn--sm" disabled>관리 (19장)</button>
          </li>`,
          )
          .join('')}
      </ul>
    </section>`;
}

function renderStudyRooms(role) {
  const rooms = getRegistrationData(role).studyRooms;
  return `
    <section class="mypage-panel">
      <p class="mypage-lead"><a href="${STUDY_ROOM_REGISTER_URL}" target="_blank" rel="noopener">study-room-ui</a>에서 수정</p>
      <ul class="mypage-entity-list">
        ${rooms
          .map(
            (r) => `
          <li class="mypage-entity">
            <div>
              <strong>${esc(r.study_room_name)}</strong>
              <span class="mypage-muted">${esc(r.detail_completion_status)}</span>
            </div>
            <span class="mypage-badge mypage-badge--${r.profile_status}">${statusLabel(r.profile_status)}</span>
          </li>`,
          )
          .join('')}
      </ul>
    </section>`;
}

function renderTutors(role) {
  const tutors = getRegistrationData(role).tutors;
  return `
    <section class="mypage-panel">
      <p class="mypage-lead"><a href="${TUTOR_REGISTER_URL}" target="_blank" rel="noopener">tutor-ui</a> · <a href="#/mypage/verification" data-mypage-nav="/mypage/verification">P15-10 검증</a></p>
      <ul class="mypage-entity-list">
        ${tutors
          .map(
            (t) => `
          <li class="mypage-entity">
            <div>
              <strong>${esc(t.tutor_display_name)}</strong>
              <span class="mypage-muted">검증: ${esc(t.verification_status)}</span>
            </div>
            <span class="mypage-badge mypage-badge--${t.profile_status}">${statusLabel(t.profile_status)}</span>
          </li>`,
          )
          .join('')}
      </ul>
    </section>`;
}

function renderWishlistSection(kind, label) {
  const items = getWishlistItems(kind);
  if (!items.length) {
    return `<p class="mypage-empty-inline">${label} 찜이 없습니다. <a href="${searchUiUrl(kind === 'tutor' ? 'tutor' : 'room', getNavRole())}" target="_blank" rel="noopener">검색에서 찾기</a></p>`;
  }
  return `
    <ul class="mypage-entity-list">
      ${items
        .map((item) => {
          const title = kind === 'tutor' ? item.tutor_display_name : item.study_room_name;
          const meta =
            kind === 'tutor'
              ? `${item.main_subject_note} · ${formatTutorFeeCard(item)}`
              : `${item.main_subject_note} · ${formatMonthlyWon(item.price_amount)}`;
          return `
          <li class="mypage-entity">
            <div>
              <strong>${esc(title)}</strong>
              <span class="mypage-muted">${esc(meta)}</span>
            </div>
            <div class="mypage-entity__actions">
              <button type="button" class="btn btn--secondary btn--sm" data-mypage-wish-compare data-kind="${kind}" data-id="${item.id}">비교(≤${COMPARE_MAX})</button>
              <button type="button" class="btn btn--secondary btn--sm" data-mypage-wish-remove data-kind="${kind}" data-id="${item.id}">찜 해제</button>
            </div>
          </li>`;
        })
        .join('')}
    </ul>`;
}

function renderWishlist() {
  return `
    <section class="mypage-panel">
      <p class="mypage-note">15장 §5 · 주 사용 맥락: 학부모 탐색 후속 · 공급자는 부기능</p>
      <h2 class="mypage-subhead">공부방</h2>
      ${renderWishlistSection('study_room', '공부방')}
      <h2 class="mypage-subhead">과외쌤</h2>
      ${renderWishlistSection('tutor', '과외쌤')}
    </section>`;
}

function renderRecent(role) {
  const items = getRecentViews(role);
  if (role === 'parent' && items.length === 0) {
    return `<section class="mypage-panel mypage-empty"><p>최근열람 기록이 없습니다.</p></section>`;
  }
  return `
    <section class="mypage-panel">
      <p class="mypage-note">15장 §6 [임시] · 학부모: 공부방/과외 위주</p>
      ${
        items.length
          ? `<ul class="mypage-entity-list">
        ${items
          .map(
            (e) => `
          <li class="mypage-entity">
            <div>
              <strong>${esc(e.title)}</strong>
              <span class="mypage-muted">${esc(e.kind)} · ${new Date(e.viewedAt).toLocaleString('ko-KR')}</span>
            </div>
          </li>`,
          )
          .join('')}
      </ul>`
          : '<p class="mypage-empty-inline">기록 없음</p>'
      }
    </section>`;
}

function renderMessages() {
  const { unread, active } = getMessagesSummaryCounts();
  return `
    <section class="mypage-panel">
      <p class="mypage-lead">P15-08 요약 → <strong>16장</strong> 쪽지함 본문</p>
      <div class="mypage-stats">
        <div class="mypage-stat"><span>읽지 않음</span><strong>${unread}</strong></div>
        <div class="mypage-stat"><span>진행중</span><strong>${active}</strong></div>
      </div>
      <a href="#/messages/inbox" class="btn btn--primary" data-nav="/messages/inbox">쪽지함 열기</a>
    </section>`;
}

function renderPlans(role) {
  if (role === 'parent') {
    return `
      <section class="mypage-panel">
        <p class="mypage-lead">15장 §7 · 학부모는 <strong>상품 설명 열람</strong>만 · 구매 UI 없음</p>
        <div class="mypage-info-box">
          <p>Prime/Pick 노출 · 학생 열람권/메모권은 <strong>공부방·과외쌤</strong>이 이용하는 유료 서비스입니다.</p>
          <p class="mypage-muted">18장에서 상품 카탈로그 · 17장 고객센터 연계</p>
        </div>
        <button type="button" class="btn btn--secondary" disabled>유료 서비스 안내 보기</button>
      </section>`;
  }
  return `
    <section class="mypage-panel">
      <p class="mypage-lead">18장 · 이용중 상품 · 만료 D-day</p>
      <ul class="mypage-entity-list">
        <li class="mypage-entity">
          <div><strong>Pick 노출 (30일)</strong><span class="mypage-muted">12일 남음</span></div>
          <span class="mypage-badge">이용중</span>
        </li>
        <li class="mypage-entity">
          <div><strong>학생 메모권</strong><span class="mypage-muted">유료등록 필요 시</span></div>
          <span class="mypage-badge mypage-badge--draft">미가입</span>
        </li>
      </ul>
    </section>`;
}

function renderVerification(role) {
  if (role !== 'tutor') {
    return `<section class="mypage-panel"><p class="mypage-muted">과외쌤 전용 (P15-10)</p></section>`;
  }
  return `
    <section class="mypage-panel">
      <p class="mypage-lead">21장 · 증빙 제출 · 검토 상태</p>
      <span class="mypage-badge mypage-badge--pending">검토중</span>
      <p class="mypage-muted">재제출 · tutor-ui 연동 예정</p>
    </section>`;
}

function renderAccount(role, profile) {
  return `
    <section class="mypage-panel">
      <dl class="mypage-dl">
        <dt>이름</dt><dd>${esc(profile.name)}</dd>
        <dt>이메일</dt><dd>${esc(profile.email)}</dd>
        <dt>대표 지역</dt><dd>${esc(profile.regionLabel)}</dd>
        <dt>역할</dt><dd>${esc(roleLabel(role))} · 9장 역할 전환</dd>
      </dl>
      <div class="mypage-form-actions">
        <button type="button" class="btn btn--secondary" data-action="role-switch">역할 전환</button>
        <button type="button" class="btn btn--secondary" disabled>비밀번호 변경</button>
        <button type="button" class="btn btn--secondary" data-action="util-logout">로그아웃</button>
      </div>
    </section>`;
}

/** @param {HTMLElement} root @param {() => void} rerender */
export function bindMypageScreenEvents(root, rerender) {
  root.querySelectorAll('[data-mypage-wish-remove]').forEach((btn) => {
    btn.addEventListener('click', () => {
      removeWishlist(btn.dataset.kind, btn.dataset.id);
      rerender();
    });
  });
  root.querySelectorAll('[data-mypage-wish-compare]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const result = addCompareFromWishlist(btn.dataset.kind, btn.dataset.id);
      if (result.full) alert(`비교는 최대 ${COMPARE_MAX}개입니다.`);
      else if (result.ineligible) alert('비교 자격이 없는 항목입니다.');
      else rerender();
    });
  });
}
