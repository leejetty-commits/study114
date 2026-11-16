import { renderPreviewToolbar, renderHeader, renderFooter, bindLayoutEvents, renderAppShellWithPromo } from './layout.js';
import { getNavRole, sessionMainHomePath } from './state.js';
import { getAuthUser } from './auth-session.js';

/** 비로그인 공개. 고객센터 셸 클래스를 쓰고, 왼쪽 메뉴에는 넣지 않는다. */
export function renderAbout() {
  const role = getNavRole();
  const home = sessionMainHomePath(getAuthUser());
  const mainHtml = `
    <div class="sup-layout">
      <header class="sup-content__head">
        <h1 class="sup-content__title"><span class="sup-content__title-prefix">서비스 소개</span></h1>
      </header>
      <div class="sup-frame__body">
        <p>우동공과는 공부방·과외쌤과 학생을 쪽지로 연결하는 지역 공부방 포털입니다.</p>
        <p>이용 대상은 공부방, 과외쌤, 학생/학부모입니다.</p>
        <p>지역을 고르면 그 동네의 공부방·과외쌤·학생 수요를 지도와 목록으로 보고, 쪽지로 연락합니다. 상세 정보와 쪽지는 로그인 후 이용할 수 있습니다.</p>
        <p><a href="#/plans" data-nav="/plans">유료상품</a> · <a href="#/support" data-nav="/support">고객센터</a></p>
        <a href="#${home}" class="sup-back-home" data-nav="${home}">← 메인 홈으로</a>
      </div>
    </div>`;

  return renderAppShellWithPromo({
    toolbar: renderPreviewToolbar(),
    headerHtml: renderHeader(role),
    mainHtml,
    footerHtml: renderFooter(),
    slotKey: 'support_right_rail',
    appClass: 'uds-theme',
  });
}

/** @param {HTMLElement} root @param {() => void} rerender */
export function bindAboutEvents(root, rerender) {
  bindLayoutEvents(root, rerender);
}
