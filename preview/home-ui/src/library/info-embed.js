/**
 * 공부방 쏙쏙정보 안내 탭. 본문은 /info/ 정적 페이지가 정본이고, 탭을 눌렀을 때만 가져온다.
 * 스타일은 이 모듈 안의 문자열이라 첫 열기 때 한 번만 넣는다. 공통 CSS는 건드리지 않는다.
 */

import { renderStateCard } from '../empty-state-copy.js';

const EMBED_STYLE = `
.info-embed { max-width: 100%; min-width: 0; }
.info-embed__body { max-width: 100%; min-width: 0; }
.info-embed__status { margin: 12px 0; }
.info-embed__out { margin: 16px 0 0; }
.info-embed a { overflow-wrap: anywhere; }
.info-embed .section { margin: 22px 0; max-width: 100%; }
.info-embed h2 { margin: 0 0 8px; color: inherit; font-size: 1.125rem; font-weight: 700; overflow-wrap: anywhere; }
.info-embed .panel {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px;
  max-width: 100%;
}
.info-embed .fold { display: flex; flex-direction: column; gap: 8px; max-width: 100%; }
.info-embed .fold details {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  max-width: 100%;
}
.info-embed .fold summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 48px;
  padding: 14px 16px;
  font-weight: 700;
  cursor: pointer;
  list-style: none;
  overflow-wrap: anywhere;
}
.info-embed .fold summary::-webkit-details-marker { display: none; }
.info-embed .fold summary::after { content: "▾"; flex-shrink: 0; font-weight: 700; }
.info-embed .fold details[open] summary::after { content: "▴"; }
.info-embed .fold__body { padding: 4px 16px 16px; overflow-wrap: anywhere; }
.info-embed .fold__body > p,
.info-embed .fold__body > ul { margin: 0 0 12px; }
.info-embed .fold__body > :last-child { margin-bottom: 0; }
.info-embed .note {
  color: #6b7280;
  font-size: 14px;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 14px 16px;
  max-width: 100%;
}
.info-embed .note p { margin: 0 0 8px; color: #6b7280; font-size: 14px; }
.info-embed .note p:last-child { margin-bottom: 0; }
`;

/** @type {Record<string, string>} */
const PATHS = {
  'edu-office': '/info/edu-office/',
  franchise: '/info/franchise/',
};

/** @type {Map<string, string>} */
const cache = new Map();

/** @type {Map<string, Promise<string>>} */
const inflight = new Map();

function ensureStyle() {
  if (document.querySelector('style[data-info-embed]')) return;
  const style = document.createElement('style');
  style.setAttribute('data-info-embed', '');
  style.textContent = EMBED_STYLE;
  document.head.appendChild(style);
}

function stripUnsafe(root) {
  root.querySelectorAll('script').forEach((node) => node.remove());
  root.querySelectorAll('*').forEach((el) => {
    [...el.attributes].forEach((attr) => {
      if (attr.name.toLowerCase().startsWith('on')) el.removeAttribute(attr.name);
    });
  });
}

async function loadEmbed(kind) {
  const path = PATHS[kind];
  if (!path) return '';
  try {
    const res = await fetch(path, { credentials: 'same-origin' });
    if (!res.ok) return '';
    const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
    const main = doc.querySelector('main.page');
    if (!main) return '';
    stripUnsafe(main);
    return main.innerHTML;
  } catch {
    return '';
  }
}

function paintReady(host, kind, html) {
  const path = PATHS[kind];
  host.innerHTML = `<div class="info-embed__body">${html}</div><p class="info-embed__out"><a href="${path}" target="_blank" rel="noopener noreferrer">새 탭에서 보기</a></p>`;
}

function paintError(host, kind) {
  const path = PATHS[kind];
  host.innerHTML = renderStateCard({
    title: '불러오지 못했어요. 다시 시도',
    cta: '다시 시도',
    ctaAction: 'info-embed-retry',
    links: [{ href: path, label: path }],
  });
  host.querySelector('[data-action="info-embed-retry"]')?.addEventListener('click', () => {
    mountInfoEmbed(host, kind);
  });
}

/**
 * @param {HTMLElement} host
 * @param {string} kind
 */
export function mountInfoEmbed(host, kind) {
  if (!host || !PATHS[kind]) return;
  ensureStyle();
  const token = {};
  host._infoEmbedToken = token;
  const cached = cache.get(kind);
  if (cached) {
    paintReady(host, kind, cached);
    return;
  }
  host.innerHTML = '<p class="info-embed__status" role="status">불러오는 중이에요.</p>';
  const job = inflight.get(kind) || loadEmbed(kind);
  inflight.set(kind, job);
  job.then((html) => {
    inflight.delete(kind);
    if (host._infoEmbedToken !== token || !host.isConnected) return;
    if (!html) {
      paintError(host, kind);
      return;
    }
    cache.set(kind, html);
    paintReady(host, kind, html);
  });
}
