/**
 * shared 전용 짧은 상태 안내. home-ui toast / s114Alert 금지.
 * @param {string} message
 * @param {{ ms?: number }} [opts]
 */
export function showBriefStatusToast(message, opts = {}) {
  const ms = typeof opts.ms === 'number' ? opts.ms : 2200;
  const text = String(message || '').trim();
  if (!text) return;

  let el = document.getElementById('study114-brief-status-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'study114-brief-status-toast';
    el.className = 'brief-status-toast';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    el.hidden = true;
    document.body.appendChild(el);
  }

  el.textContent = text;
  el.hidden = false;
  el.classList.add('is-visible');

  window.clearTimeout(window.__study114BriefStatusToastTimer);
  window.__study114BriefStatusToastTimer = window.setTimeout(() => {
    el.classList.remove('is-visible');
    el.hidden = true;
  }, ms);
}
