/**
 * 팝업이 생기면 끌기를 한 곳에서 붙인다.
 * data-no-drag: 이 팝업은 자동 끌기를 하지 않는다.
 * data-drag-box: 이 요소를 움직인다(바탕이 아니라 안쪽 상자).
 * data-drag-handle: 여기를 잡고 끈다.
 */
import { bindDraggableDialog } from './draggable-dialog.js';

const POPUP_SELECTOR = '[role="dialog"], [data-drag-box], dialog';

/** @type {WeakMap<HTMLElement, { popup: HTMLElement, box: HTMLElement, api: { reset: () => void, destroy: () => void }, visible: boolean }>} */
const bound = new WeakMap();
/** @type {Set<{ popup: HTMLElement, box: HTMLElement, api: { reset: () => void, destroy: () => void }, visible: boolean }>} */
const tracked = new Set();
/** @type {Set<Node>} */
const queue = new Set();
let queued = false;

/**
 * @param {Element} el
 */
function hasHeadClass(el) {
  for (const name of el.classList) {
    if (name.endsWith('__header') || name.endsWith('__head')) return true;
  }
  return false;
}

/**
 * @param {HTMLElement} box
 * @returns {HTMLElement | null}
 */
function findHandle(box) {
  const marked = box.querySelector('[data-drag-handle]');
  if (marked instanceof HTMLElement) return marked;

  for (const el of box.querySelectorAll('*')) {
    if (el.tagName === 'HEADER' || hasHeadClass(el)) return /** @type {HTMLElement} */ (el);
  }

  const id = box.getAttribute('aria-labelledby');
  if (!id) return null;
  const title = box.querySelector(`#${CSS.escape(id)}`);
  if (!(title instanceof HTMLElement) || !box.contains(title)) return null;
  if (title.parentElement === box) return title;
  let node = /** @type {HTMLElement | null} */ (title);
  while (node && node.parentElement !== box) node = node.parentElement;
  return node && node.parentElement === box ? node : null;
}

/**
 * @param {HTMLElement} el
 */
function coversViewport(el) {
  const rect = el.getBoundingClientRect();
  if (rect.width < 1 || rect.height < 1) return false;
  const view = document.documentElement;
  return rect.width >= view.clientWidth - 2 && rect.height >= view.clientHeight - 2;
}

/**
 * @param {HTMLElement} popup
 * @returns {HTMLElement | null}
 */
function resolveBox(popup) {
  if (popup.hasAttribute('data-drag-box')) return popup;
  const inner = popup.querySelector('[data-drag-box]');
  if (inner instanceof HTMLElement) return inner;
  if (coversViewport(popup)) return null;
  return popup;
}

/**
 * @param {HTMLElement} el
 */
function isVisible(el) {
  if (!el.isConnected) return false;
  let node = /** @type {HTMLElement | null} */ (el);
  while (node) {
    if (node.hidden) return false;
    if (node instanceof HTMLDialogElement && !node.open) return false;
    node = node.parentElement;
  }
  const style = getComputedStyle(el);
  if (style.display === 'none' || style.visibility === 'hidden') return false;
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

/**
 * @param {HTMLElement} popup
 */
function consider(popup) {
  if (popup.closest('[data-no-drag]')) return;
  if (popup.matches('[data-p24-drag-handle]') || popup.querySelector('[data-p24-drag-handle]')) return;
  if (!isVisible(popup)) return;
  const box = resolveBox(popup);
  if (!box) return;
  if (bound.has(box) || box.dataset.dragBound === '1') return;
  const handle = findHandle(box);
  if (!handle) return;
  const api = bindDraggableDialog(box, handle);
  const entry = { popup, box, api, visible: true };
  bound.set(box, entry);
  tracked.add(entry);
}

function syncTracked() {
  for (const entry of tracked) {
    if (!entry.popup.isConnected || !entry.box.isConnected) {
      entry.api.destroy();
      bound.delete(entry.box);
      tracked.delete(entry);
      continue;
    }
    const visible = isVisible(entry.popup);
    if (visible !== entry.visible) {
      entry.api.reset();
      entry.visible = visible;
    }
  }
}

/**
 * @param {Element} node
 * @param {Set<HTMLElement>} popups
 */
function collect(node, popups) {
  if (node.matches(POPUP_SELECTOR)) popups.add(/** @type {HTMLElement} */ (node));
  node.querySelectorAll(POPUP_SELECTOR).forEach((el) => {
    if (el instanceof HTMLElement) popups.add(el);
  });
  const parent = node.closest(POPUP_SELECTOR);
  if (parent instanceof HTMLElement) popups.add(parent);
}

function flush() {
  queued = false;
  const nodes = [...queue];
  queue.clear();
  syncTracked();
  /** @type {Set<HTMLElement>} */
  const popups = new Set();
  for (const node of nodes) {
    if (node instanceof Element) collect(node, popups);
  }
  popups.forEach(consider);
}

/**
 * @param {Node | null | undefined} node
 */
function schedule(node) {
  if (node) queue.add(node);
  if (queued) return;
  queued = true;
  requestAnimationFrame(flush);
}

function start() {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;
  if (!document.body) {
    document.addEventListener('DOMContentLoaded', start, { once: true });
    return;
  }
  const observer = new MutationObserver((records) => {
    for (const record of records) {
      if (record.type === 'childList') {
        record.addedNodes.forEach((node) => schedule(node));
        if (record.removedNodes.length) schedule(record.target);
      } else {
        schedule(record.target);
      }
    }
  });
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['hidden', 'class', 'open'],
  });
  window.addEventListener('resize', () => schedule(document.body));
  schedule(document.body);
}

start();
