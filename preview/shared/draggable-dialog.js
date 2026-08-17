/**
 * 페이지 안 대화상자를 제목 줄로 드래그해 옮긴다.
 * @param {HTMLElement} dialog
 * @param {HTMLElement|null} handle
 */
export function bindDraggableDialog(dialog, handle) {
  const bar = handle || dialog;
  if (!dialog || !bar) return;

  bar.classList.add('is-dialog-drag-handle');
  let dragging = false;
  let startX = 0;
  let startY = 0;
  let origLeft = 0;
  let origTop = 0;

  const pin = () => {
    const rect = dialog.getBoundingClientRect();
    dialog.style.position = 'fixed';
    dialog.style.margin = '0';
    dialog.style.left = `${rect.left}px`;
    dialog.style.top = `${rect.top}px`;
    dialog.style.width = `${rect.width}px`;
    dialog.style.maxHeight = 'calc(100vh - 1rem)';
    dialog.style.zIndex = '1300';
    return rect;
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
    const left = Math.max(8, Math.min(window.innerWidth - 96, origLeft + (e.clientX - startX)));
    const top = Math.max(8, Math.min(window.innerHeight - 48, origTop + (e.clientY - startY)));
    dialog.style.left = `${left}px`;
    dialog.style.top = `${top}px`;
  });

  const stop = () => {
    dragging = false;
  };
  bar.addEventListener('pointerup', stop);
  bar.addEventListener('pointercancel', stop);
}
