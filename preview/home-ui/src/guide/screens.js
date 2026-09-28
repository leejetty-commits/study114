import { getGuidePageId } from './router.js';
import { STUDY_ROOM_REGISTER_URL, TUTOR_REGISTER_URL, searchUiUrl } from '../nav-config.js';
import { getNavRole, navigate } from '../state.js';
import { isLoggedIn } from '../auth-session.js';
import { openDeepAccessLoginGate, closeDeepAccessLoginGate } from '../../../shared/guest-gate-ui.js';
import { getWishlistItems } from '../user-actions-state.js';
import { getUnreadCount } from '../messages/thread-store.js';

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

/** 공부방 역할은 과외쌤찾기 CTA를 숨긴다. 가이드 본문 역할 분기는 146 후속. */
function finderStartLinks(roomClass, tutorClass) {
  const role = getNavRole();
  const room = extLink(searchHref('room'), roomClass, '공부방 찾기 시작');
  if (role === 'study_room') return room;
  return `${room}${extLink(searchHref('tutor'), tutorClass, '과외쌤 찾기 시작')}`;
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

function faqBlock(items) {
  return `
    <div class="guide-faq-list">
      ${items
        .map(
          (item) => `
        <details class="guide-faq-item">
          <summary class="guide-faq-item__q">${esc(item.q)}</summary>
          <div class="guide-faq-item__a"><p class="guide-faq-item__a-body">${esc(item.a)}</p></div>
        </details>`,
        )
        .join('')}
    </div>`;
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
    ${sectionHead('여기에서 시작', '어디에 해당하나요?')}
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
      <a href="#/guide/start" data-guide-nav="/guide/start">학생·학부모예요. 요청 등록과 학생찾기 흐름을 안내합니다.</a>
      <span class="aux-links__sep" aria-hidden="true">·</span>
      <a href="#/guide/safe" data-guide-nav="/guide/safe">안전이용 보기</a>
      <span class="aux-links__sep" aria-hidden="true">·</span>
      <a href="#/support" data-guide-nav="/support">고객센터 보기</a>
    </div>
    ${sectionHead('질문', '자주 묻는 질문')}
    ${faqBlock([
      {
        q: '이용안내와 고객센터는 같은 곳인가요?',
        a: '아니요. 이용안내는 처음 쓰는 흐름을 안내하고, 고객센터는 공지·FAQ·운영문의·정책을 보는 곳입니다.',
      },
      {
        q: '어디부터 보면 되나요?',
        a: '공부방·과외쌤을 찾으면 「찾기·첫 이용」, 등록하면 「등록·노출」, 찜과 비교와 쪽지는 「비교·찜·쪽지」입니다. 학생·학부모의 요청 등록과 학생찾기는 보조 안내에서 이어집니다.',
      },
      {
        q: '로그인 전에도 볼 수 있나요?',
        a: '목록·상세는 로그인 전에도 볼 수 있고, 찜·쪽지는 로그인 후입니다.',
      },
      {
        q: '쪽지와 운영문의는 같은가요?',
        a: '아니요. 쪽지는 회원끼리 첫 연락이고, 운영문의는 운영자에게 보내는 문의입니다.',
      },
    ])}
    ${sectionHead('바로 이용해 보기', '바로 이용하기')}
    <div class="slim-cta">
      <span class="slim-cta__label">실이용으로</span>
      ${finderStartLinks('btn btn--primary', 'btn btn--secondary')}
    </div>`;
}

function renderGuideStart() {
  return `
    ${guideHero({
      label: '찾기·첫 이용 소개',
      title: '찾기·첫 이용',
      p1: '공부방·과외쌤을 찾는 분들을 위한 첫 이용 안내입니다.',
      p2: '찾기 → 조건 → 상세 → 찜 → 비교 → 로그인 → 쪽지 순서로 따라가 보세요. 비교는 필요할 때 쓰면 됩니다.',
      art: `${A}/motif-search.svg`,
    })}
    ${sectionHead('순서', '이용 순서')}
    <p class="section-lead">한 번에 다 외울 필요 없어요. 찾기 → 조건 → 상세 → 찜 → 비교 → 로그인 → 쪽지 순서로 따라가면 됩니다.</p>
    <p class="section-lead">목록·상세는 로그인 전에도 볼 수 있고, 찜·쪽지는 로그인 후입니다.</p>
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
        icon: `${A}/step-detail.svg`,
        title: '상세 페이지 확인하기',
        body: '소개·수업 방식·위치·시간대와 회원이 올려 둔 신뢰정보를 천천히 읽어 보세요. 신뢰정보는 참고 표시이며, 플랫폼의 인증·보증이 아닙니다.',
      },
      {
        icon: `${A}/step-bookmark.svg`,
        title: '마음에 드는 후보를 찜하기',
        body: '마음에 드는 곳을 찜해 두세요. 지금 바로 결정하지 않아도 나중에 다시 볼 수 있어요.',
      },
      {
        icon: `${A}/step-compare.svg`,
        title: '필요할 때 비교하기',
        body: '후보가 몇 개 모이면 그중 2~3개를 비교해 보세요. 자세한 방법은 「비교·찜·쪽지」에서 이어집니다.',
      },
      {
        icon: `${A}/step-login.svg`,
        title: '로그인하기',
        body: '찜을 이어서 보거나 쪽지를 보내려면 로그인해 주세요. 계정이 없으면 회원가입(계정 만들기)으로 시작해요.',
      },
      {
        icon: `${A}/step-message.svg`,
        title: '쪽지로 회원끼리 첫 연락',
        body: '쪽지는 로그인 후 회원끼리 첫 연락을 하는 통로예요. 운영팀에 보내는 운영문의와는 다릅니다.',
      },
    ])}
    ${sectionHead('학생', '학생찾기 (공부방·과외쌤용)')}
    <p class="section-lead">학생찾기는 공부방·과외쌤이 근처에 올라온 학생·학부모 요청을 찾아보는 화면입니다.</p>
    <p class="section-lead">학부모가 공부방·과외쌤을 찾는 「공부방찾기」「과외쌤찾기」와는 방향이 반대예요.</p>
    <p class="section-lead">기본으로 내 홍보 지역의 요청이 보이고, 조건을 바꿔 더 넓게 검색할 수 있습니다.</p>
    <p class="section-lead">홈의 「우리동네 학생」은 잠깐 훑는 동네 미리보기이고, 자세히 찾으려면 학생찾기로 가면 됩니다.</p>
    ${sectionHead('질문', '자주 묻는 질문')}
    ${faqBlock([
      {
        q: '학생찾기는 누구를 위한 화면인가요?',
        a: '공부방·과외쌤용입니다. 학부모가 공부방·과외쌤을 찾는 「공부방찾기」「과외쌤찾기」와는 방향이 반대예요. 학생은 찜·비교 대상이 아닙니다.',
      },
      {
        q: '게스트도 목록과 상세를 볼 수 있나요?',
        a: '목록·상세는 로그인 전에도 볼 수 있고, 찜·쪽지는 로그인 후입니다.',
      },
      {
        q: '홈의 우리동네 학생과 학생찾기는 같은가요?',
        a: '아니요. 홈의 「우리동네 학생」은 잠깐 훑는 동네 미리보기이고, 자세히 찾으려면 학생찾기로 가면 됩니다.',
      },
      {
        q: '추천 순서는 무엇인가요?',
        a: '찾기 → 조건 → 상세 → 찜 → 비교 → 로그인 → 쪽지입니다. 후보를 고른 뒤에는 찜 → 비교 → 쪽지 순서가 좋습니다.',
      },
    ])}
    ${sectionHead('다음', '다음으로')}
    <div class="cta-row">
      ${finderStartLinks('btn btn--primary', 'btn btn--secondary')}
      ${hashLink('/guide/compare', 'btn btn--ghost', '비교·찜·쪽지 안내 보기 →')}
    </div>`;
}

function renderGuideRegister() {
  const hidePlans = getNavRole() === 'parent';
  const steps = [
    { icon: `${A}/step-login.svg`, title: '회원가입(계정 만들기)', body: '공통가입은 계정을 만드는 단계예요. 계정을 만든 뒤 로그인해 주세요.' },
    { icon: `${A}/step-form.svg`, title: '필수정보 입력', body: '이름(상호)·지역 등 가입 필수정보를 입력하면 기본 노출이 시작됩니다.' },
    { icon: `${A}/step-publish.svg`, title: '기본 노출', body: '필수정보를 입력하면 검색·리스트에 기본 노출됩니다. 운영자 심사·승인 절차는 없습니다.' },
    { icon: `${A}/step-edit.svg`, title: '상세 등록', body: '카드와 상세 페이지에 보여줄 추가 정보를 보완합니다. 기본 노출의 필수 조건은 아닙니다.' },
  ];
  if (!hidePlans) {
    steps.push({
      icon: `${A}/step-paid.svg`,
      title: '(선택) 유료상품 살펴보기',
      body: '기본 노출이 시작된 뒤, 더 눈에 띄게 하고 싶다면 유료상품을 살펴볼 수 있어요. 필수는 아니며 자동 결제되지 않습니다.',
    });
  }
  return `
    ${guideHero({
      label: '등록·노출 소개',
      title: '등록·노출',
      p1: '가입 필수정보를 입력하면 기본 노출이 시작됩니다. 상세등록은 카드와 상세 페이지에 보여줄 추가 정보를 보완하는 단계입니다.',
      p2: '노출을 위한 운영자 심사·승인 절차는 없습니다.',
      art: `${A}/motif-register.svg`,
    })}
    ${sectionHead('순서', '등록 순서')}
    <p class="section-lead">회원가입(계정 만들기) 뒤 필수정보를 입력하면 기본 노출이 시작됩니다. 증빙자료는 심사하거나 보증하지 않습니다. 신뢰정보는 회원이 올려 둔 참고 표시이며, 플랫폼의 인증·보증이 아닙니다.</p>
    ${stepList(steps)}
    ${sectionHead('점검', '역할별 체크')}
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
      <li>활동 시·군 1개</li>
      <li>대상 학생군</li>
      <li>과목</li>
      <li>수업 방식</li>
      <li>경력/소개</li>
      <li>대표 사진 — 대표 사진이 있으면 프로필을 더 쉽게 이해할 수 있어요</li>
      <li>가입 필수정보가 입력되어 기본 노출 중인지 확인</li>
    </ul>
    ${sectionHead('학생', '학생 등록')}
    <p class="section-lead">학생·학부모도 회원가입 후 기본 정보를 입력하면, 요청이 학생찾기 등에 기본으로 노출될 수 있습니다.</p>
    <p class="section-lead">운영자 심사·승인을 기다리지 않습니다.</p>
    <p class="section-lead">상세 정보는 나중에 보완해도 됩니다. (저장을 눌러야 이어집니다 — 창만 닫으면 저장되지 않아요.)</p>
    <p class="section-lead">한 줄 요청문·희망 지역·과목 등 찾는 분이 바로 이해하는 정보를 먼저 채우면 좋습니다.</p>
    ${sectionHead('질문', '자주 묻는 질문')}
    ${faqBlock([
      {
        q: '기본 정보를 입력하면 바로 노출되나요?',
        a: '가입 필수정보를 입력하면 기본 노출이 시작됩니다. 운영자 심사·승인 절차는 없습니다.',
      },
      {
        q: '상세 정보는 언제 보완하나요?',
        a: '상세등록은 카드와 상세 페이지에 보여줄 추가 정보를 보완하는 단계입니다. 기본 노출의 필수 조건은 아닙니다.',
      },
      {
        q: '창을 닫아도 저장되나요?',
        a: '저장을 눌러야 이어집니다. 창만 닫으면 저장되지 않아요.',
      },
      {
        q: '학생 등록은 공부방·과외쌤 등록과 같나요?',
        a: '별도입니다. 학생·학부모도 회원가입 후 기본 정보를 입력하면, 요청이 학생찾기 등에 기본으로 노출될 수 있습니다. 운영자 심사·승인을 기다리지 않습니다. 학생은 찜·비교 대상이 아닙니다.',
      },
    ])}
    ${sectionHead('이후', '기본 노출 이후 선택')}
    <div class="cta-row">
      ${extLink(STUDY_ROOM_REGISTER_URL, 'btn btn--primary', '공부방 등록')}
      ${extLink(TUTOR_REGISTER_URL, 'btn btn--secondary', '과외쌤 등록')}
      ${hidePlans ? '' : hashLink('/plans', 'btn btn--ghost', '유료상품 안내 →')}
    </div>`;
}

function renderGuideCompare() {
  return `
    ${guideHero({
      label: '비교·찜·쪽지 소개',
      title: '비교·찜·쪽지',
      p1: '마음에 드는 상대를 모아 비교하고, 쪽지로 첫 인사를 건네는 방법을 안내합니다.',
      p2: '쪽지는 회원끼리 연결되는 통로예요. 사이트 운영팀에 보내는 운영문의와는 다른 기능입니다.',
      art: `${A}/motif-compare.svg`,
    })}
    <div class="note-callout" role="note">
      <strong>채널 구분:</strong> 쪽지 = 회원끼리 첫 연락 · 운영문의 = 운영자에게 보내는 문의(폼/메일). 같은 “문의”로 묶지 마세요.
    </div>
    ${sectionHead('기능', '세 가지 기능')}
    <div class="chip-row" aria-label="찜 · 비교 · 쪽지">
      <div class="feat-chip">
        <span class="feat-chip__icon feat-chip__icon--teal" aria-hidden="true"><img src="${A}/step-bookmark.svg" alt="" width="40" height="40" /></span>
        <div>
          <strong>찜</strong>
          <span>나중에 다시 볼 곳을 저장</span>
        </div>
      </div>
      <div class="feat-chip">
        <span class="feat-chip__icon" aria-hidden="true"><img src="${A}/step-compare.svg" alt="" width="40" height="40" /></span>
        <div>
          <strong>비교</strong>
          <span>후보를 나란히 놓고 조건 확인</span>
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
    ${sectionHead('순서', '이용 순서')}
    <p class="section-lead">찜 → 비교 → 쪽지 순으로 한 번만 따라가 보세요.</p>
    ${stepList([
      { icon: `${A}/step-pick.svg`, title: '검색 결과에서 후보 고르기', body: '공부방·과외쌤 목록에서 관심 있는 곳을 골라 둡니다.' },
      { icon: `${A}/step-bookmark.svg`, title: '마음에 드는 곳을 찜', body: '당장 연락하지 않아도 괜찮아요. 찜한 공부방·과외쌤에 모아 두면 나중에 다시 볼 수 있어요.' },
      { icon: `${A}/step-compare.svg`, title: '비교로 조건 맞춰 보기', body: '찜해 둔 곳 중 2~3개를, 지역·과목·시간·비용 등 내가 중요하게 보는 기준으로 나란히 확인합니다.' },
      { icon: `${A}/step-message.svg`, title: '상세 페이지를 읽은 뒤 쪽지 보내기', body: '짧은 인사와 궁금한 점만 적어서 보내 보세요. 쪽지는 회원끼리 첫 연락을 하는 통로입니다.' },
      { icon: `${A}/step-inbox.svg`, title: '쪽지함에서 이어가기', body: '받은·보낸 쪽지는 쪽지함에서 확인할 수 있어요. (로그인 필요)' },
    ])}
    ${sectionHead('질문', '자주 묻는 질문')}
    ${faqBlock([
      {
        q: '비교는 최대 몇 개인가요?',
        a: '비교는 공부방끼리 또는 과외쌤끼리, 최대 3개까지 나란히 보는 기능이에요. 찜은 더 담을 수 있어요. 더 비교하려면 지금 담은 것 중 일부를 비교에서 내린 뒤 다른 후보를 담으세요.',
      },
      {
        q: '학생도 찜하거나 비교할 수 있나요?',
        a: '아니요. 학생은 찜·비교 대상이 아니에요.',
      },
      {
        q: '어떤 순서로 쓰면 되나요?',
        a: '찜 → 비교 → 쪽지 순으로 따라가 보세요. 비교는 판단을 돕는 단계예요. 상세 페이지를 본 다음, 쪽지로 회원끼리 첫 연락을 이어가세요.',
      },
    ])}
    ${sectionHead('참고', '쪽지 보내기 전')}
    <ul class="checklist">
      <li>상대 상세 소개를 한 번 더 읽어 보세요</li>
      <li>첫 쪽지에서는 긴 자기소개보다, 궁금한 조건을 짧게 정리해 물어보세요.</li>
      <li>이름·연락처·결제 정보를 쪽지에 먼저 보내지 마세요</li>
      <li>운영·신고·계정 문제는 쪽지가 아니라 고객센터·운영문의로</li>
    </ul>
    <div class="cta-row" style="margin-top:8px">
      <button type="button" class="btn btn--primary" data-guide-peek="wishlist">찜한 공부방·과외쌤 보기</button>
      <button type="button" class="btn btn--secondary" data-guide-peek="messages">쪽지함 보기</button>
    </div>`;
}

const GUIDE_PEEK_ID = 'guide-peek-overlay';

function wishLabel(item) {
  return item?.study_room_name || item?.tutor_display_name || item?.public_display_name || '';
}

function closeGuidePeek() {
  document.getElementById(GUIDE_PEEK_ID)?.remove();
  document.removeEventListener('keydown', onGuidePeekKey);
}

/** @param {KeyboardEvent} e */
function onGuidePeekKey(e) {
  if (e.key !== 'Escape') return;
  closeGuidePeek();
}

function guideReturnTo() {
  try {
    return window.location.href;
  } catch {
    return '';
  }
}

/** @param {'wishlist'|'messages'} kind */
function openGuideMemberPeek(kind) {
  closeDeepAccessLoginGate();
  closeGuidePeek();
  const isWish = kind === 'wishlist';
  const rooms = isWish ? getWishlistItems('study_room') : [];
  const tutors = isWish ? getWishlistItems('tutor') : [];
  const names = [...rooms, ...tutors].map(wishLabel).filter(Boolean).slice(0, 3);
  const unread = isWish ? 0 : getUnreadCount();
  const title = isWish ? '찜해 둔 후보' : '쪽지함';
  const lead = isWish
    ? rooms.length + tutors.length
      ? `공부방 ${rooms.length}곳 · 과외쌤 ${tutors.length}명을 저장해 두었습니다.`
      : '아직 찜한 공부방·과외쌤이 없습니다. 찾기에서 마음에 드는 곳을 저장해 두세요.'
    : unread
      ? `안 읽은 쪽지가 ${unread}통 있습니다.`
      : '안 읽은 쪽지는 없습니다. 받은·보낸 대화는 이 안내에서 나가지 않고 상태만 확인합니다.';
  const list = names.length
    ? `<ul class="guest-gate__list">${names.map((name) => `<li>${esc(name)}</li>`).join('')}</ul>`
    : '';
  const overlay = document.createElement('div');
  overlay.id = GUIDE_PEEK_ID;
  overlay.className = 'guest-deep-gate-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'guide-peek-title');
  overlay.innerHTML = `
    <div class="guest-deep-gate-overlay__backdrop" data-guide-peek-dismiss></div>
    <div class="guest-gate guest-gate--deep">
      <h2 id="guide-peek-title" class="guest-gate__title">${esc(title)}</h2>
      <p class="guest-gate__lead">${esc(lead)}</p>
      ${list}
      <div class="guest-gate__actions">
        <button type="button" class="btn btn--primary" data-guide-peek-dismiss>닫기</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.querySelectorAll('[data-guide-peek-dismiss]').forEach((el) => {
    el.addEventListener('click', closeGuidePeek);
  });
  document.addEventListener('keydown', onGuidePeekKey);
}

/** @param {'wishlist'|'messages'} kind */
function openGuidePeek(kind) {
  if (!isLoggedIn()) {
    closeGuidePeek();
    const wish = kind === 'wishlist';
    openDeepAccessLoginGate({
      source: wish ? 'wishlist' : 'message',
      from: 'guide',
      returnTo: guideReturnTo(),
      title: wish ? '로그인하고 찜 목록 보기' : '로그인하고 쪽지함 보기',
      lead: wish
        ? '로그인 후 저장해 둔 공부방·과외쌤을 이어서 볼 수 있어요.'
        : '로그인 후 받은·보낸 쪽지를 이어서 볼 수 있어요.',
      bullets: wish
        ? ['찜해 둔 후보 확인', '비교에 담기', '쪽지로 첫 연락']
        : ['받은 쪽지 확인', '보낸 쪽지 이어가기', '운영문의와는 다른 회원 연락'],
      primaryLabel: '로그인하기',
    });
    return;
  }
  openGuideMemberPeek(kind);
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
    ${sectionHead('안내', '이렇게 하세요 · 하지 마세요')}
    <p class="section-lead">가이드는 행동 수칙입니다. 정책 전문·신고 접수는 고객센터에 있습니다.</p>
    <p class="section-lead">노출된 신뢰정보는 상대가 프로필에 보여 둔 소개·자료이며, 플랫폼이 확인·인증했다는 뜻이 아닙니다.</p>
    <p class="section-lead">학생·학부모도 첫 연락, 개인정보, 선입금에서 같은 주의를 따르세요.</p>
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
    ${sectionHead('질문', '자주 묻는 질문')}
    ${faqBlock([
      {
        q: '노출된 신뢰정보는 인증인가요?',
        a: '노출된 신뢰정보는 상대가 프로필에 보여 둔 소개·자료이며, 플랫폼이 확인·인증했다는 뜻이 아닙니다.',
      },
      {
        q: '선입금은 어떻게 해야 하나요?',
        a: '비용, 환불 조건, 수업 방식이 충분히 정리되지 않았다면 선입금이나 외부 결제에 바로 응하지 마세요.',
      },
      {
        q: '학생·학부모도 같은 주의를 하나요?',
        a: '네. 학생·학부모도 첫 연락, 개인정보, 선입금에서 같은 주의를 따르세요.',
      },
    ])}
    ${sectionHead('도움', '도움이 필요할 때')}
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
  root.querySelectorAll('[data-guide-peek]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const kind = el.getAttribute('data-guide-peek') === 'messages' ? 'messages' : 'wishlist';
      openGuidePeek(kind);
    });
  });

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
