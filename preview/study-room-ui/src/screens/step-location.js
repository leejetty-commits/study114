import { bindGlobalEvents, navigate, basicOverviewPath } from '../layout.js';

/** 위치 단독 화면은 기본정보 현황(팝업 수정)으로 합침 */
export function renderLocation() {
  return `
      <div class="site-gate-wrap">
        <p class="auth-subheading">기본정보 현황으로 이동합니다…</p>
      </div>`;
}

export function bindLocationEvents(root) {
  bindGlobalEvents(root);
  navigate(basicOverviewPath());
}
