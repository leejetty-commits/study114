/**
 * 전 SPA 공통 사이트 푸터
 * 정본: FOOTER-SPEC · UDX-20 · 26장 footer 운영 문구
 * 정보형 하단만. CTA·카드·placeholder 회사정보 없음.
 */

import { HOME_UI_BASE } from './preview-links.js';

export const SITE_FOOTER_NOTICE =
  '우동공과는 회원 간 정보 탐색과 접촉을 돕는 플랫폼이며, 수업 계약이나 과외비 지급을 직접 중개하지 않습니다.';

export const SITE_FOOTER_COPYRIGHT = '© 2026 우동공과 · study114';

export const SITE_FOOTER_LINKS = [
  { path: '/support/policies/terms', label: '약관' },
  { path: '/support/policies/privacy', label: '개인정보' },
  { path: '/support/policies/platform', label: '플랫폼 고지' },
  { path: '/support', label: '고객센터', supportHome: true },
];

/**
 * @param {{
 *   name?: string,
 *   ceo?: string,
 *   bizNo?: string,
 *   address?: string,
 *   email?: string,
 *   phone?: string,
 * }} company
 */
function renderCompanyBlock(company) {
  if (!company || typeof company !== 'object') return '';
  const rows = [
    ['상호', company.name],
    ['대표', company.ceo],
    ['사업자등록번호', company.bizNo],
    ['주소', company.address],
    ['이메일', company.email],
    ['전화', company.phone],
  ].filter(([, value]) => String(value || '').trim());
  if (!rows.length) return '';
  return `
    <dl class="site-footer__company">
      ${rows
        .map(
          ([label, value]) => `
        <div class="site-footer__company-row">
          <dt class="site-footer__company-label">${esc(label)}</dt>
          <dd class="site-footer__company-value">${esc(value)}</dd>
        </div>`,
        )
        .join('')}
    </dl>`;
}

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
}

/**
 * @param {{
 *   homeBase?: string,
 *   linkMode?: 'hash' | 'absolute',
 *   company?: Record<string, string> | null,
 * }} [opts]
 *   hash — home-ui 내부 `#/path` + data-nav
 *   absolute — 다른 SPA에서 home-ui 절대 URL
 *   company — 실제 운영값이 있을 때만 전달. placeholder 금지.
 */
export function renderSiteFooter(opts = {}) {
  const homeBase = (opts.homeBase || HOME_UI_BASE).replace(/\/$/, '');
  const absolute = opts.linkMode === 'absolute';

  const link = (item, extraAttr = '') => {
    if (absolute) {
      const href = `${homeBase}/#${item.path}`;
      return `<a href="${href}" data-util-href="${href}"${extraAttr}>${item.label}</a>`;
    }
    if (item.supportHome) {
      return `<a href="#${item.path}" data-action="util-support"${extraAttr}>${item.label}</a>`;
    }
    return `<a href="#${item.path}" data-nav="${item.path}"${extraAttr}>${item.label}</a>`;
  };

  const links = SITE_FOOTER_LINKS.map((item, index) => {
    const sep =
      index < SITE_FOOTER_LINKS.length - 1
        ? `<span class="site-footer__sep" aria-hidden="true">·</span>`
        : '';
    return `${link(item)}${sep}`;
  }).join('');

  return `
    <footer class="site-footer home-footer">
      <div class="site-footer__inner">
        <nav class="site-footer__links home-footer__links" aria-label="정책 및 고객센터">
          ${links}
        </nav>
        <p class="site-footer__notice home-footer__notice">${SITE_FOOTER_NOTICE}</p>
        ${renderCompanyBlock(opts.company)}
        <p class="site-footer__legal">${SITE_FOOTER_COPYRIGHT}</p>
      </div>
    </footer>
  `;
}
