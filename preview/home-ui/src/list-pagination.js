import { setGuestListPage } from './state.js';

export const GUEST_LIST_PAGE_SIZE = 10;
export const PICK_PAGE_SIZE = 5;

/**
 * @param {Array<object>} items
 * @param {string} dateKey — registered_at | published_at
 */
export function sortByDateDesc(items, dateKey) {
  return [...items].sort((a, b) => String(b[dateKey] || '').localeCompare(String(a[dateKey] || '')));
}

/**
 * @param {Array<object>} items
 * @param {number} page 1-based
 * @param {number} pageSize
 */
export function slicePage(items, page, pageSize = GUEST_LIST_PAGE_SIZE) {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

/**
 * @param {string} listId
 * @param {number} totalItems
 * @param {number} currentPage
 * @param {number} pageSize
 */
export function renderListPagination(listId, totalItems, currentPage, pageSize = GUEST_LIST_PAGE_SIZE) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  if (totalPages <= 1) return '';

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const hasMore = currentPage < totalPages;

  return `
    <nav class="list-pagination" data-list-id="${listId}" aria-label="${listId} 페이지">
      <div class="list-pagination__nums" role="group" aria-label="페이지 번호">
        ${pages
          .map(
            (p) =>
              `<button type="button" class="list-pagination__num${p === currentPage ? ' is-current' : ''}" data-guest-list-page="${listId}" data-page="${p}" aria-current="${p === currentPage ? 'page' : 'false'}">${p}</button>`,
          )
          .join('')}
      </div>
      ${
        hasMore
          ? `<button type="button" class="list-pagination__more" data-guest-list-more="${listId}" data-page="${currentPage + 1}">더보기</button>`
          : ''
      }
    </nav>
  `;
}

/**
 * @param {HTMLElement} root
 * @param {() => void} rerender
 */
export function bindGuestListPagination(root, rerender) {
  root.querySelectorAll('[data-guest-list-page]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const listId = btn.dataset.guestListPage;
      const page = Number(btn.dataset.page);
      if (!listId || !page) return;
      setGuestListPage(listId, page);
      rerender();
    });
  });

  root.querySelectorAll('[data-guest-list-more]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const listId = btn.dataset.guestListMore;
      const page = Number(btn.dataset.page);
      if (!listId || !page) return;
      setGuestListPage(listId, page);
      rerender();
      const section = root.querySelector(`[data-guest-list="${listId}"]`);
      section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}
