/**
 * 전 SPA 공통 사이트 푸터 (게스트 홈과 동일 구성)
 */

import { HOME_UI_BASE } from './preview-links.js';

export const SITE_FOOTER_NOTICE =
  '우동공과는 회원 간 정보 탐색과 접촉을 돕는 플랫폼이며, 수업 계약이나 과외비 지급을 직접 중개하지 않습니다.';

/**
 * @param {{ homeBase?: string, linkMode?: 'hash' | 'absolute' }} [opts]
 *   hash — home-ui 내부 `#/path` + data-nav
 *   absolute — 다른 SPA에서 home-ui 절대 URL
 */
export function renderSiteFooter(opts = {}) {
  const homeBase = (opts.homeBase || HOME_UI_BASE).replace(/\/$/, '');
  const absolute = opts.linkMode === 'absolute';

  const link = (path, label, extraAttr = '') => {
    if (absolute) {
      const href = `${homeBase}/#${path}`;
      return `<a href="${href}" data-util-href="${href}"${extraAttr}>${label}</a>`;
    }
    return `<a href="#${path}" data-nav="${path}"${extraAttr}>${label}</a>`;
  };

  return `
    <footer class="home-footer">
      <div class="home-footer__links">
        ${link('/policy/terms', '약관')}
        ${link('/policy/privacy', '개인정보')}
        ${link('/policy/platform', '플랫폼 고지')}
        ${
          absolute
            ? `<a href="${homeBase}/#/support" data-util-href="${homeBase}/#/support">고객센터</a>`
            : `<a href="#/support" data-action="util-support">고객센터</a>`
        }
      </div>
      <p class="home-footer__notice">${SITE_FOOTER_NOTICE}</p>
      <p>© 2026 우동공과 · study114</p>
    </footer>
  `;
}
