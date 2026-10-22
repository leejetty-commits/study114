/**
 * 페이지 안 대화상자를 제목 줄로 드래그해 옮긴다.
 * 데스크톱(너비 721px 이상이고 정밀 포인터)에서만 움직인다.
 * 팝업 전체는 창 안쪽 8px 안에 두고, 창보다 크면 위·왼쪽 8px에 붙인다.
 * @param {HTMLElement} dialog
 * @param {HTMLElement|null} handle
 * @param {{ zIndex?: number }=} options
 * @returns {{ reset: () => void, destroy: () => void }}
 */
const DESKTOP_DRAG_QUERY = '(min-width: 721px) and (pointer: fine)';
const EDGE = 8;

export function isDesktopDragEnabled() {
  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia(DESKTOP_DRAG_QUERY).matches;
}

export function bindDraggableDialog(dialog, handle, options = {}) {
  const bar = handle || dialog;
  if (!dialog || !bar) {
    return { reset() {}, destroy() {} };
  }

  bar.classList.add('is-dialog-drag-handle');

  let dragging = false;
  let positioned = false;
  let destroyed = false;
  let startX = 0;
  let startY = 0;
  let origLeft = 0;
  let origTop = 0;
  const zIndex = String(Math.max(1300, Number(options.zIndex) || parseInt(dialog.style.zIndex || '0', 10) || 1300));

  const reset = () => {
    dragging = false;
    positioned = false;
    dialog.style.left = '';
    dialog.style.top = '';
    dialog.style.transform = '';
    dialog.style.position = '';
    dialog.style.margin = '';
    dialog.style.width = '';
    dialog.style.maxHeight = '';
    dialog.style.zIndex = '';
  };

  const place = (left, top) => {
    const width = dialog.offsetWidth;
    const height = dialog.offsetHeight;
    const viewWidth = window.innerWidth;
    const viewHeight = window.innerHeight;
    const nextLeft = width + EDGE * 2 > viewWidth
      ? EDGE
      : Math.min(Math.max(EDGE, left), viewWidth - width - EDGE);
    const nextTop = height + EDGE * 2 > viewHeight
      ? EDGE
      : Math.min(Math.max(EDGE, top), viewHeight - height - EDGE);
    dialog.style.left = `${nextLeft}px`;
    dialog.style.top = `${nextTop}px`;
    return { left: nextLeft, top: nextTop };
  };

  const pin = () => {
    const rect = dialog.getBoundingClientRect();
    dialog.style.position = 'fixed';
    dialog.style.margin = '0';
    dialog.style.width = `${rect.width}px`;
    dialog.style.maxHeight = `${Math.max(160, window.innerHeight - EDGE * 2)}px`;
    dialog.style.zIndex = zIndex;
    dialog.style.transform = '';
    positioned = true;
    return place(rect.left, rect.top);
  };

  const onPointerDown = (event) => {
    if (destroyed || !isDesktopDragEnabled()) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const target = event.target;
    if (target instanceof Element && target.closest('button, a, input, select, textarea, label')) return;
    const pos = pin();
    dragging = true;
    startX = event.clientX;
    startY = event.clientY;
    origLeft = pos.left;
    origTop = pos.top;
    try {
      bar.setPointerCapture(event.pointerId);
    } catch {
      /* ignore */
    }
    event.preventDefault();
  };

  const onPointerMove = (event) => {
    if (!dragging || destroyed || !isDesktopDragEnabled()) return;
    place(origLeft + (event.clientX - startX), origTop + (event.clientY - startY));
  };

  const stop = () => {
    dragging = false;
  };

  const onResize = () => {
    if (destroyed) return;
    if (!dialog.isConnected) {
      destroy();
      return;
    }
    if (!isDesktopDragEnabled()) {
      if (positioned) reset();
      return;
    }
    if (!positioned) return;
    const left = Number.parseFloat(dialog.style.left);
    const top = Number.parseFloat(dialog.style.top);
    place(Number.isFinite(left) ? left : EDGE, Number.isFinite(top) ? top : EDGE);
  };

  const observer = new MutationObserver(() => {
    if (!dialog.isConnected) destroy();
  });

  bar.addEventListener('pointerdown', onPointerDown);
  bar.addEventListener('pointermove', onPointerMove);
  bar.addEventListener('pointerup', stop);
  bar.addEventListener('pointercancel', stop);
  window.addEventListener('resize', onResize);
  if (document.body) observer.observe(document.body, { childList: true, subtree: true });

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    dragging = false;
    bar.removeEventListener('pointerdown', onPointerDown);
    bar.removeEventListener('pointermove', onPointerMove);
    bar.removeEventListener('pointerup', stop);
    bar.removeEventListener('pointercancel', stop);
    window.removeEventListener('resize', onResize);
    observer.disconnect();
    bar.classList.remove('is-dialog-drag-handle');
  }

  return { reset, destroy };
}
