/**
 * 페이지 안 대화상자를 제목 줄로 드래그해 옮긴다.
 * @param {HTMLElement} dialog
 * @param {HTMLElement|null} handle
 * @param {{ zIndex?: number }=} options
 */
export function bindDraggableDialog(dialog, handle, options = {}) {
  const bar = handle || dialog;
  if (!dialog || !bar) return;

  bar.classList.add('is-dialog-drag-handle');
  let dragging = false;
  let startX = 0;
  let startY = 0;
  let origLeft = 0;
  let origTop = 0;
  const zIndex = String(Math.max(1300, Number(options.zIndex) || parseInt(dialog.style.zIndex || '0', 10) || 1300));

  const pin = () => {
    const rect = dialog.getBoundingClientRect();
    const maxH = Math.max(160, window.innerHeight - 16);
    dialog.style.position = 'fixed';
    dialog.style.margin = '0';
    dialog.style.width = `${rect.width}px`;
    dialog.style.maxHeight = `${maxH}px`;
    dialog.style.zIndex = zIndex;
    const h = Math.min(dialog.offsetHeight || rect.height, maxH);
    const left = Math.min(Math.max(8, rect.left), Math.max(8, window.innerWidth - rect.width - 8));
    const top = Math.min(Math.max(8, rect.top), Math.max(8, window.innerHeight - h - 8));
    dialog.style.left = `${left}px`;
    dialog.style.top = `${top}px`;
    return { left, top, width: rect.width, height: h };
  };

  bar.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (e.target.closest('button, a, input, select, textarea, label')) return;
    const rect = pin();
    dragging = true;
    startX = e.clientX;
    startY = e.clientY;
    origLeft = rect.left;
    origTop = rect.top;
    try {
      bar.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    e.preventDefault();
  });

  bar.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const headerH = Math.max(40, bar.getBoundingClientRect().height);
    const w = dialog.offsetWidth;
    const h = dialog.offsetHeight;
    const minLeft = 8 - Math.max(0, w - 96);
    const maxLeft = window.innerWidth - 96;
    const minTop = headerH - h;
    const maxTop = window.innerHeight - headerH;
    const left = Math.max(minLeft, Math.min(maxLeft, origLeft + (e.clientX - startX)));
    const top = Math.max(minTop, Math.min(maxTop, origTop + (e.clientY - startY)));
    dialog.style.left = `${left}px`;
    dialog.style.top = `${top}px`;
  });

  const stop = () => {
    dragging = false;
  };
  bar.addEventListener('pointerup', stop);
  bar.addEventListener('pointercancel', stop);
}
