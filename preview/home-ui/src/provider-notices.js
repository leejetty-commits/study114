/**
 * 18d — 시스템 안내 (만료·소진) 온사이트 배너
 */

import { fetchProviderNotices, markProviderNoticeRead } from './paid-api.js';

/** @type {Array<{ id: number, notice_kind: string, title: string, body: string, action_href: string|null, created_at: string }>} */
let noticesCache = [];

export async function hydrateProviderNotices() {
  try {
    const data = await fetchProviderNotices();
    noticesCache = (data.notices ?? []).map((n) => ({ ...n }));
    return noticesCache;
  } catch (err) {
    console.warn('[provider-notices]', err);
    noticesCache = [];
    return [];
  }
}

export function resetProviderNotices() {
  noticesCache = [];
}

export function getProviderNotices() {
  return noticesCache.map((n) => ({ ...n }));
}

export async function dismissProviderNotice(noticeId) {
  await markProviderNoticeRead(noticeId);
  noticesCache = noticesCache.filter((n) => Number(n.id) !== Number(noticeId));
}

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

/** @returns {string} */
export function renderProviderNoticeBanners() {
  if (!noticesCache.length) return '';
  return noticesCache
    .map(
      (n) => `
    <div class="mypage-info-box provider-notice" data-provider-notice-id="${Number(n.id)}">
      <p class="provider-notice__kind">시스템 안내 · ${esc(n.notice_kind)}</p>
      <strong class="provider-notice__title">${esc(n.title)}</strong>
      <p class="provider-notice__body">${esc(n.body)}</p>
      <div class="provider-notice__actions">
        ${
          n.action_href
            ? `<a href="#${esc(n.action_href)}" class="btn btn--secondary btn--sm" data-mypage-nav="${esc(n.action_href)}">유료 서비스 안내</a>`
            : ''
        }
        <button type="button" class="btn btn--secondary btn--sm" data-provider-notice-dismiss="${Number(n.id)}">확인</button>
      </div>
    </div>`,
    )
    .join('');
}

/** @param {HTMLElement} root @param {() => void} [rerender] */
export function bindProviderNoticeEvents(root, rerender) {
  root.querySelectorAll('[data-provider-notice-dismiss]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = Number(btn.getAttribute('data-provider-notice-dismiss'));
      if (!id) return;
      try {
        await dismissProviderNotice(id);
        rerender?.();
      } catch (err) {
        console.warn('[provider-notices] dismiss', err);
      }
    });
  });
}
