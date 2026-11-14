/**
 * 전 SPA 공통 사이트 푸터
 * 정본: FOOTER-SPEC · UDX-20 · 26장 footer 운영 문구
 * 정보형 하단만. CTA·카드 없음. 회사정보는 SITE_FOOTER_COMPANY 단일 상수.
 */

import { HOME_UI_BASE } from './preview-links.js';

export const SITE_FOOTER_NOTICE =
  '우동공과는 통신판매중개자이며 통신판매의 당사자가 아닙니다. 회원 간 거래에 대한 의무와 책임은 각 회원에게 있습니다.';

export const SITE_FOOTER_COPYRIGHT = '© 2026 우동공과 · study114';

/**
 * 사업자·운영 정보 단일 상수.
 * phone 이 비어 있으면 전화는 숨긴다. 값이 생기면 2줄 끝에 붙는다.
 */
export const SITE_FOOTER_COMPANY = {
  name: '제이에이치커머스(서비스명 우동공과)',
  ceo: '이종현',
  address: '경기도 의정부시 능곡로26번길 40, 101동 1101호',
  bizNo: '471-29-01819',
  mailOrder: '제2025-의정부송산-0680호',
  email: 'help@study114.net',
  phone: '',
};

export const SITE_FOOTER_LINKS = [
  { path: '/support/policies/terms', label: '이용약관' },
  { path: '/support/policies/privacy', label: '개인정보 처리방침', strong: true },
  { path: '/support/policies/platform', label: '플랫폼 고지' },
  { path: '/support', label: '고객센터', supportHome: true },
];

/**
 * @param {{ label?: string, valueHtml: string }[]} items
 */
function renderCompanyRow(items) {
  const parts = items.filter((item) => String(item.valueHtml || '').trim());
  if (!parts.length) return '';
  return `
    <p class="site-footer__company-row">
      ${parts
        .map((item, index) => {
          const sep =
            index < parts.length - 1
              ? `<span class="site-footer__company-sep" aria-hidden="true">|</span>`
              : '';
          const label = item.label
            ? `<span class="site-footer__company-label">${esc(item.label)}</span> `
            : '';
          return `<span class="site-footer__company-item">${label}<span class="site-footer__company-value">${item.valueHtml}</span></span>${sep}`;
        })
        .join('')}
    </p>`;
}

/**
 * @param {typeof SITE_FOOTER_COMPANY | null | undefined} company
 */
function renderCompanyBlock(company) {
  if (!company || typeof company !== 'object') return '';

  /** @type {{ label?: string, valueHtml: string }[]} */
  const line1 = [];
  /** @type {{ label?: string, valueHtml: string }[]} */
  const line2 = [];

  if (String(company.name || '').trim()) {
    line1.push({ label: '상호', valueHtml: esc(company.name) });
  }
  if (String(company.ceo || '').trim()) {
    line1.push({ label: '대표', valueHtml: esc(company.ceo) });
  }
  if (String(company.address || '').trim()) {
    line1.push({ label: '주소', valueHtml: esc(company.address) });
  }

  if (String(company.bizNo || '').trim()) {
    line2.push({
      label: '사업자등록번호',
      valueHtml: esc(company.bizNo),
    });
  }
  if (String(company.mailOrder || '').trim()) {
    line2.push({ label: '통신판매업신고', valueHtml: esc(company.mailOrder) });
  }
  if (String(company.email || '').trim()) {
    const mail = String(company.email).trim();
    line2.push({
      label: '이메일',
      valueHtml: `<a class="site-footer__mail" href="mailto:${escAttr(mail)}">${esc(mail)}</a>`,
    });
  }
  if (String(company.phone || '').trim()) {
    line2.push({ label: '전화', valueHtml: esc(company.phone) });
  }

  const rows = [renderCompanyRow(line1), renderCompanyRow(line2)].filter(Boolean);
  if (!rows.length) return '';
  return `<div class="site-footer__company">${rows.join('')}</div>`;
}

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
}

function escAttr(s) {
  return esc(s).replace(/'/g, '&#39;');
}

/**
 * @param {{
 *   homeBase?: string,
 *   linkMode?: 'hash' | 'absolute',
 *   company?: typeof SITE_FOOTER_COMPANY | null,
 * }} [opts]
 *   hash — home-ui 내부 `#/path` + data-nav
 *   absolute — 다른 SPA에서 home-ui 절대 URL
 *   company — 기본 SITE_FOOTER_COMPANY. null 이면 회사정보 숨김(관리자 등 예외용).
 */
export function renderSiteFooter(opts = {}) {
  const homeBase = (opts.homeBase || HOME_UI_BASE).replace(/\/$/, '');
  const absolute = opts.linkMode === 'absolute';
  const company =
    opts.company === null ? null : opts.company || SITE_FOOTER_COMPANY;

  const link = (item, extraAttr = '') => {
    const label = item.strong
      ? `<strong class="site-footer__link-strong">${item.label}</strong>`
      : item.label;
    if (absolute) {
      const href = `${homeBase}/#${item.path}`;
      return `<a href="${href}" data-util-href="${href}"${extraAttr}>${label}</a>`;
    }
    if (item.supportHome) {
      return `<a href="#${item.path}" data-action="util-support"${extraAttr}>${label}</a>`;
    }
    return `<a href="#${item.path}" data-nav="${item.path}"${extraAttr}>${label}</a>`;
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
        ${renderCompanyBlock(company)}
        <p class="site-footer__legal">${SITE_FOOTER_COPYRIGHT}</p>
      </div>
    </footer>
  `;
}
