import { getGuidePageId } from './router.js';
import { STUDY_ROOM_REGISTER_URL, TUTOR_REGISTER_URL, searchUiUrl } from '../nav-config.js';
import { getNavRole, navigate } from '../state.js';
import { getDefaultMessagesPath } from '../messages/router.js';

const A = '/assets/guide-refresh';

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

function searchHref(kind) {
  return searchUiUrl(kind, getNavRole());
}

function hashLink(path, className, label) {
  return `<a class="${className}" href="#${esc(path)}" data-guide-nav="${esc(path)}">${label}</a>`;
}

function extLink(href, className, label) {
  return `<a class="${className}" href="${esc(href)}" data-same-tab-href="${esc(href)}">${label}</a>`;
}

function sectionHead(chip, title) {
  return `
    <div class="section-head">
      <div>
        <span class="section-chip">${esc(chip)}</span>
        <h2>${esc(title)}</h2>
        <div class="section-underline"></div>
      </div>
    </div>`;
}

function guideHero({ label, title, p1, p2, art }) {
  return `
    <section class="guide-hero" aria-label="${esc(label)}">
      <div class="guide-hero__grid" aria-hidden="true"></div>
      <div class="guide-hero__row">
        <div class="guide-hero__inner">
          <p class="guide-eyebrow">이용안내</p>
          <h1>${esc(title)}</h1>
          <p>${esc(p1)}</p>
          <p>${esc(p2)}</p>
        </div>
        <div class="guide-hero__art" aria-hidden="true">
          <img src="${esc(art)}" alt="" width="168" height="118" />
        </div>
      </div>
    </section>
    <div class="pattern-band" aria-hidden="true"></div>`;
}

function stepList(steps) {
  return `
    <ol class="step-list" style="list-style:none;padding:0;margin:0">
      ${steps
        .map(
          (step, i) => `
        <li class="step-item">
          <span class="step-item__n">${i + 1}</span>
          <span class="step-item__ill" aria-hidden="true"><img src="${esc(step.icon)}" alt="" width="40" height="40" /></span>
          <div class="step-item__body">
            <h3>${esc(step.title)}</h3>
            <p>${esc(step.body)}</p>
          </div>
        </li>`,
        )
        .join('')}
    </ol>`;
}

function renderGuideHome() {
  return `
    ${guideHero({
      label: '이용안내 소개',
      title: '이용안내',
      p1: '우동공과를 처음 쓰시나요? 찾는 분과 등록하는 분, 각각 필요한 흐름만 짧게 안내해 드릴게요.',
      p2: '이용 중 막히는 부분이 있다면 고객센터에서 공지, FAQ, 운영문의를 이어서 확인할 수 있어요.',
      art: `${A}/motif-guide.svg`,
    })}
    ${sectionHead('Start here', '어디에 해당하나요?')}
    <div class="situation-grid">
      <a class="situation-card card card--accent" href="#/guide/start" data-guide-nav="/guide/start">
        <span class="icon-halo"><span class="icon-tile" aria-hidden="true"><img src="${A}/tile-search.svg" alt="" width="56" height="56" /></span></span>
        <h3>찾는 중이에요</h3>
        <p>공부방·과외쌤을 찾는 분의 첫 이용 순서입니다.</p>
        <span class="situation-card__cta">찾기·첫 이용 보기 →</span>
      </a>
      <a class="situation-card card card--accent card--accent-teal" href="#/guide/register" data-guide-nav="/guide/register">
        <span class="icon-halo icon-halo--teal"><span class="icon-tile icon-tile--teal" aria-hidden="true"><img src="${A}/tile-register.svg" alt="" width="56" height="56" /></span></span>
        <h3>등록하려고요</h3>
        <p>공부방·과외쌤으로 등록하고 노출하는 방법을 안내합니다.</p>
        <span class="situation-card__cta">등록·노출 보기 →</span>
      </a>
      <a class="situation-card card card--accent card--accent-violet" href="#/guide/compare" data-guide-nav="/guide/compare">
        <span class="icon-halo icon-halo--violet"><span class="icon-tile icon-tile--violet" aria-hidden="true"><img src="${A}/tile-compare.svg" alt="" width="56" height="56" /></span></span>
        <h3>비교·찜·쪽지가 궁금해요</h3>
        <p>후보를 모으고 비교한 뒤, 쪽지로 첫 인사를 건네는 법입니다.</p>
        <span class="situation-card__cta">비교·찜·쪽지 보기 →</span>
      </a>
    </div>
    <div class="aux-links" role="navigation" aria-label="보조 링크">
      <span class="aux-links__label">더 알아보기</span>
      <a href="#/guide/safe" data-guide-nav="/guide/safe">안전이용 보기</a>
      <span class="aux-links__sep" aria-hidden="true">·</span>
      <a href="#/support" data-guide-nav="/support">고객센터 보기</a>
    </div>
    ${sectionHead('Go use', '바로 이용하기')}
    <div class="slim-cta">
      <span class="slim-cta__label">실이용으로</span>
      ${extLink(searchHref('room'), 'btn btn--primary', '공부방 찾기 시작')}
      ${extLink(searchHref('tutor'), 'btn btn--secondary', '과외쌤 찾기 시작')}
    </div>`;
}

function renderGuideStart() {
  return `
    ${guideHero({
      label: '찾기·첫 이용 소개',
      title: '찾기·첫 이용',
      p1: '공부방·과외쌤을 찾는 분들을 위한 첫 이용 안내입니다.',
      p2: '검색부터 비교·찜, 상세 확인, 첫 쪽지까지 순서대로 따라가 보세요.',
      art: `${A}/motif-search.svg`,
    })}
    ${sectionHead('Playbook', '이용 순서')}
    <p class="section-lead">한 번에 다 외울 필요 없어요. 아래 다섯 단계만 따라가면 됩니다.</p>
    ${stepList([
      {
        icon: `${A}/step-pick.svg`,
        title: '찾는 대상 고르기',
        body: '공부방인지, 과외쌤인지 먼저 정해요. 메뉴의 「공부방찾기」「과외쌤찾기」로 들어가면 됩니다.',
      },
      {
        icon: `${A}/step-filter.svg`,
        title: '조건으로 검색하기',
        body: '지역·과목·대상 학년 등 필터로 후보를 좁혀 보세요. 너무 좁히면 결과가 적을 수 있어요.',
      },
      {
        icon: `${A}/step-bookmark.svg`,
        title: '마음에 드는 후보를 비교·찜으로 모아두기',
        body: '마음에 드는 곳을 찜해 두고, 필요한 만큼 비교해 보세요. 자세한 방법은 「비교·찜·쪽지」에서 이어집니다.',
      },
      {
        icon: `${A}/step-detail.svg`,
        title: '상세 정보 확인하기',
        body: '소개·수업 방식·위치·시간대 등을 천천히 읽어 보세요. 궁금한 점은 쪽지로 물어보면 됩니다.',
      },
      {
        icon: `${A}/step-message.svg`,
        title: '로그인 후 첫 쪽지 보내기',
        body: '쪽지는 로그인 후 이용할 수 있으며, 운영팀에 보내는 운영문의와는 다릅니다.',
      },
    ])}
    ${sectionHead('Next', '다음으로')}
    <div class="cta-row">
      ${extLink(searchHref('room'), 'btn btn--primary', '공부방 찾기 시작')}
      ${extLink(searchHref('tutor'), 'btn btn--secondary', '과외쌤 찾기 시작')}
      ${hashLink('/guide/compare', 'btn btn--ghost', '비교·찜·쪽지 안내 보기 →')}
    </div>`;
}

function renderGuideRegister() {
  return `
    ${guideHero({
      label: '등록·노출 소개',
      title: '등록·노출',
      p1: '가입 필수정보를 입력하면 기본 노출이 시작됩니다. 상세등록은 카드와 상세 페이지에 보여줄 추가 정보를 보완하는 단계입니다.',
      p2: '노출을 위한 운영자 심사·승인 절차는 없습니다.',
      art: `${A}/motif-register.svg`,
    })}
    ${sectionHead('Playbook', '등록 순서')}
    <p class="section-lead">가입 필수정보 입력 후 기본 노출이 시작되는 흐름입니다.</p>
    ${stepList([
      { icon: `${A}/step-login.svg`, title: '회원가입·로그인', body: '등록하려면 먼저 회원으로 로그인해 주세요.' },
      { icon: `${A}/step-form.svg`, title: '필수정보 입력', body: '이름(상호)·지역 등 가입 필수정보를 입력하면 기본 노출이 시작됩니다.' },
      { icon: `${A}/step-publish.svg`, title: '기본 노출', body: '필수정보를 입력하면 검색·리스트에 기본 노출됩니다. 운영자 심사·승인 절차는 없습니다.' },
      { icon: `${A}/step-edit.svg`, title: '상세 등록', body: '카드와 상세 페이지에 보여줄 추가 정보를 보완합니다. 기본 노출의 필수 조건은 아닙니다.' },
      {
        icon: `${A}/step-paid.svg`,
        title: '(선택) 유료상품 살펴보기',
        body: '기본 노출이 시작된 뒤, 더 눈에 띄게 하고 싶다면 유료상품을 살펴볼 수 있어요. 필수는 아니며 자동 결제되지 않습니다.',
      },
    ])}
    ${sectionHead('Checklist', '역할별 체크')}
    <p class="section-lead">공부방과 과외쌤은 세부 항목이 조금 달라요. 탭을 바꿔 확인해 보세요.</p>
    <div class="role-tabs" role="tablist" aria-label="역할 선택">
      <button type="button" class="role-tab" role="tab" id="tab-room" aria-selected="true" aria-controls="panel-room">공부방</button>
      <button type="button" class="role-tab" role="tab" id="tab-tutor" aria-selected="false" aria-controls="panel-tutor">과외쌤</button>
    </div>
    <ul class="checklist" id="panel-room" role="tabpanel" aria-labelledby="tab-room">
      <li>상호</li>
      <li>운영 지역</li>
      <li>대상 학년</li>
      <li>과목</li>
      <li>시설/운영 형태</li>
      <li>대표 사진 — 대표 사진이 있으면 프로필을 더 쉽게 이해할 수 있어요</li>
      <li>소개</li>
      <li>가입 필수정보가 입력되어 기본 노출 중인지 확인</li>
    </ul>
    <ul class="checklist" id="panel-tutor" role="tabpanel" aria-labelledby="tab-tutor" hidden>
      <li>표시명</li>
      <li>활동 지역</li>
      <li>대상 학생군</li>
      <li>과목</li>
      <li>수업 방식</li>
      <li>경력/소개</li>
      <li>대표 사진 — 대표 사진이 있으면 프로필을 더 쉽게 이해할 수 있어요</li>
      <li>가입 필수정보가 입력되어 기본 노출 중인지 확인</li>
    </ul>
    ${sectionHead('After', '기본 노출 이후 선택')}
    <div class="cta-row">
      ${extLink(STUDY_ROOM_REGISTER_URL, 'btn btn--primary', '공부방 등록')}
      ${extLink(TUTOR_REGISTER_URL, 'btn btn--secondary', '과외쌤 등록')}
      ${hashLink('/plans', 'btn btn--ghost', '유료상품 안내 →')}
    </div>`;
}

function renderGuideCompare() {
  const wishlistPath = '/mypage/wishlist';
  const messagesPath = getDefaultMessagesPath();
  return `
    ${guideHero({
      label: '비교·찜·쪽지 소개',
      title: '비교·찜·쪽지',
      p1: '마음에 드는 상대를 모아 비교하고, 쪽지로 첫 인사를 건네는 방법을 안내합니다.',
      p2: '쪽지는 회원끼리 연결되는 통로예요. 사이트 운영팀에 보내는 운영문의와는 다른 기능입니다.',
      art: `${A}/motif-compare.svg`,
    })}
    <div class="note-callout" role="note">
      <strong>채널 구분:</strong> 쪽지 = 회원(공급↔수요) 간 메시지 · 운영문의 = 운영자에게 보내는 문의(폼/메일). 같은 “문의”로 묶지 마세요.
    </div>
    ${sectionHead('Features', '세 가지 기능')}
    <div class="chip-row" aria-label="비교 · 찜 · 쪽지">
      <div class="feat-chip">
        <span class="feat-chip__icon" aria-hidden="true"><img src="${A}/step-compare.svg" alt="" width="40" height="40" /></span>
        <div>
          <strong>비교</strong>
          <span>후보를 나란히 놓고 조건 확인</span>
        </div>
      </div>
      <div class="feat-chip">
        <span class="feat-chip__icon feat-chip__icon--teal" aria-hidden="true"><img src="${A}/step-bookmark.svg" alt="" width="40" height="40" /></span>
        <div>
          <strong>찜</strong>
          <span>나중에 다시 볼 곳을 저장</span>
        </div>
      </div>
      <div class="feat-chip">
        <span class="feat-chip__icon feat-chip__icon--violet" aria-hidden="true"><img src="${A}/step-message.svg" alt="" width="40" height="40" /></span>
        <div>
          <strong>쪽지</strong>
          <span>회원끼리 첫 연락 (≠ 운영문의)</span>
        </div>
      </div>
    </div>
    ${sectionHead('Playbook', '이용 순서')}
    <p class="section-lead">비교 → 찜 → 쪽지 순으로 한 번만 따라가 보세요.</p>
    ${stepList([
      { icon: `${A}/step-pick.svg`, title: '검색 결과에서 후보 고르기', body: '공부방·과외쌤 목록에서 관심 있는 곳을 골라 둡니다.' },
      { icon: `${A}/step-compare.svg`, title: '비교로 조건 맞춰 보기', body: '지역·과목·시간·비용 등 내가 중요하게 보는 기준으로 나란히 확인합니다.' },
      { icon: `${A}/step-bookmark.svg`, title: '마음에 드는 곳을 찜', body: '당장 연락하지 않아도 괜찮아요. 찜 목록에 모아 두면 나중에 다시 볼 수 있어요.' },
      { icon: `${A}/step-message.svg`, title: '상세를 읽은 뒤 쪽지 보내기', body: '짧은 인사와 궁금한 점만 적어서 보내 보세요. 쪽지는 회원 간 연결 통로입니다.' },
      { icon: `${A}/step-inbox.svg`, title: '쪽지함에서 이어가기', body: '받은·보낸 쪽지는 쪽지함에서 확인할 수 있어요. (로그인 필요)' },
    ])}
    ${sectionHead('Tip', '쪽지 보내기 전')}
    <ul class="checklist">
      <li>상대 상세 소개를 한 번 더 읽어 보세요</li>
      <li>첫 쪽지에서는 긴 자기소개보다, 궁금한 조건을 짧게 정리해 물어보세요.</li>
      <li>이름·연락처·결제 정보를 쪽지에 먼저 보내지 마세요</li>
      <li>운영·신고·계정 문제는 쪽지가 아니라 고객센터·운영문의로</li>
    </ul>
    <div class="cta-row" style="margin-top:8px">
      ${hashLink(wishlistPath, 'btn btn--primary', '찜 목록 보기')}
      ${hashLink(messagesPath, 'btn btn--secondary', '쪽지함 보기')}
    </div>`;
}

function renderGuideSafe() {
  return `
    ${guideHero({
      label: '안전이용 소개',
      title: '안전이용',
      p1: '처음 연락하기 전, 개인정보를 주고받기 전, 꼭 읽어 두면 좋은 안전 이용 안내입니다.',
      p2: '공식 기준과 신고·분쟁은 고객센터 정책에서 확인할 수 있어요.',
      art: `${A}/motif-safe.svg`,
    })}
    ${sectionHead('Do & Don\'t', '이렇게 하세요 · 하지 마세요')}
    <p class="section-lead">가이드는 행동 수칙입니다. 정책 전문·신고 접수는 고객센터에 있습니다.</p>
    <div class="do-dont">
      <div class="do-dont__panel do-dont__panel--do">
        <h3><img src="${A}/icon-do.svg" alt="" width="32" height="32" aria-hidden="true" /> 이렇게 하세요</h3>
        <ul>
          <li>첫 연락은 쪽지로 시작하고, 상대 프로필을 확인하세요</li>
          <li>수업 조건, 비용, 장소, 환불 기준은 먼저 충분히 확인해 두세요.</li>
          <li>의심되면 진행을 멈추고 고객센터·운영문의로 도움을 요청하세요</li>
          <li>공식 안전과외 정책도 함께 읽어 두세요</li>
        </ul>
      </div>
      <div class="do-dont__panel do-dont__panel--dont">
        <h3><img src="${A}/icon-dont.svg" alt="" width="32" height="32" aria-hidden="true" /> 이렇게 하지 마세요</h3>
        <ul>
          <li>선입금·외부 결제·개인 계좌 요구에 바로 응하지 마세요</li>
          <li>주민번호·통장·비밀번호 등 민감 정보를 쪽지로 보내지 마세요</li>
          <li>플랫폼 밖 연락만으로 계약을 서두르지 마세요</li>
          <li>운영 문제나 신고가 필요한 상황은 회원 간 쪽지로 해결하려 하지 마세요.</li>
        </ul>
      </div>
    </div>
    ${sectionHead('Help', '도움이 필요할 때')}
    <div class="help-block">
      <h3><img src="${A}/icon-help.svg" alt="" width="32" height="32" aria-hidden="true" /> 고객센터로 이어가기</h3>
      <p>안내 본문에 정책·FAQ를 반복하지 않습니다. 필요한 지점에서만 연결합니다.</p>
      <div class="help-links">
        <a class="help-link help-link--primary" href="#/support/contact" data-guide-nav="/support/contact">
          <span>
            <strong>운영문의</strong>
            <span>사이트 운영팀에 보내는 문의 (쪽지와 다름)</span>
          </span>
          <span class="help-link__arrow" aria-hidden="true">→</span>
        </a>
        <a class="help-link" href="#/support/policies/reporting" data-guide-nav="/support/policies/reporting">
          <span>
            <strong>신고·도움 안내</strong>
            <span>정본 라우트 · 신고·분쟁 접수</span>
          </span>
          <span class="help-link__arrow" aria-hidden="true">→</span>
        </a>
        <a class="help-link" href="#/support/policies/safety" data-guide-nav="/support/policies/safety">
          <span>
            <strong>안전과외 정책 보기</strong>
            <span>고객센터 정책 · 공식 기준 (가이드와 별도 유지)</span>
          </span>
          <span class="help-link__arrow" aria-hidden="true">→</span>
        </a>
        <a class="help-link" href="#/support" data-guide-nav="/support">
          <span>
            <strong>고객센터</strong>
            <span>공지 · FAQ · 정책 · 운영문의 허브</span>
          </span>
          <span class="help-link__arrow" aria-hidden="true">→</span>
        </a>
      </div>
    </div>
    <div class="cta-row" style="margin-top:4px">
      ${hashLink('/support/contact', 'btn btn--primary', '운영문의')}
      ${hashLink('/support', 'btn btn--secondary', '고객센터 가기')}
      ${hashLink('/support/policies/reporting', 'btn btn--ghost', '신고·도움 안내 →')}
    </div>`;
}

const GUIDE_SCREENS = {
  home: renderGuideHome,
  start: renderGuideStart,
  register: renderGuideRegister,
  compare: renderGuideCompare,
  safe: renderGuideSafe,
};

export function renderGuideScreen(path) {
  const id = getGuidePageId(path);
  return (GUIDE_SCREENS[id] || renderGuideHome)();
}

export function bindGuideScreenEvents(root) {
  root.querySelectorAll('[data-guide-nav]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      navigate(el.getAttribute('data-guide-nav') || '/guide');
    });
  });

  const room = root.querySelector('#tab-room');
  const tutor = root.querySelector('#tab-tutor');
  const panelRoom = root.querySelector('#panel-room');
  const panelTutor = root.querySelector('#panel-tutor');
  if (room && tutor && panelRoom && panelTutor) {
    const select = (which) => {
      const isRoom = which === 'room';
      room.setAttribute('aria-selected', isRoom ? 'true' : 'false');
      tutor.setAttribute('aria-selected', isRoom ? 'false' : 'true');
      panelRoom.hidden = !isRoom;
      panelTutor.hidden = isRoom;
    };
    room.addEventListener('click', () => select('room'));
    tutor.addEventListener('click', () => select('tutor'));
  }
}
