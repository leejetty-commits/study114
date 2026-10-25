/**
 * 277-7a — 브라우저 confirm/prompt 대체 공용 확인창.
 * role="dialog" + .s114-confirm__head → dialog-drag-auto.js 가 끌기를 자동 부착한다.
 */

let styleInjected = false;

function injectStyle() {
  if (styleInjected) return;
  if (typeof document === 'undefined') return;
  styleInjected = true;
  const style = document.createElement('style');
  style.setAttribute('data-s114-confirm', '');
  style.textContent = `
.s114-confirm-backdrop {
  position: fixed; inset: 0;
  background: rgba(0,0,0,.45);
  z-index: 1300;
  display: flex; align-items: center; justify-content: center;
}
.s114-confirm {
  background: #fff; border: 1px solid #E5E7EB; border-radius: 12px;
  min-width: 320px; max-width: 460px; width: 90vw;
  box-shadow: 0 8px 32px rgba(0,0,0,.25);
  display: flex; flex-direction: column;
}
.s114-confirm__head {
  padding: 16px 20px 0;
  font-weight: 700; font-size: 16px;
  cursor: grab; user-select: none;
}
.s114-confirm__body {
  padding: 16px 20px;
  white-space: pre-line;
  line-height: 1.55;
  font-size: 14px;
  color: #1C1917;
}
.s114-confirm__input {
  display: block; width: 100%; box-sizing: border-box;
  margin-top: 10px; padding: 8px 10px;
  border: 1px solid #ccc; border-radius: 6px;
  font-size: 0.95rem;
}
.s114-confirm__input:focus { outline: 2px solid #729FD9; border-color: #729FD9; }
.s114-confirm__foot {
  display: flex; justify-content: flex-end; gap: 8px;
  padding: 8px 20px 16px;
}
.s114-confirm__btn {
  height: 30px; padding: 0 20px; border-radius: 6px;
  font-size: 14px; font-weight: 600;
  cursor: pointer; border: 1px solid #E5E7EB;
  background: #fff; color: #334155;
  transition: background .15s;
}
.s114-confirm__btn:hover { background: #f5f5f5; }
.s114-confirm__btn--ok {
  background: #729FD9; color: #0B2545; border-color: #729FD9;
}
.s114-confirm__btn--ok:hover { background: #6797D6; }
.s114-confirm__btn--danger {
  background: #e53935; color: #fff; border-color: #e53935;
}
.s114-confirm__btn--danger:hover { background: #c62828; }
`;
  document.head.appendChild(style);
}

/** @type {Array<() => void>} */
const queue = [];
let active = false;

function runNext() {
  if (active || queue.length === 0) return;
  active = true;
  queue.shift()();
}

function done() {
  active = false;
  runNext();
}

/**
 * @param {{ message: string, title?: string, okLabel?: string, cancelLabel?: string, danger?: boolean, promptDefault?: string|null, alertOnly?: boolean }} cfg
 * @returns {Promise<{ confirmed: boolean, value: string }>}
 */
function showDialog(cfg) {
  injectStyle();
  return new Promise((resolve) => {
    const run = () => {
      const prev = /** @type {Element|null} */ (document.activeElement);
      const isPrompt = cfg.promptDefault !== undefined && cfg.promptDefault !== null;

      const backdrop = document.createElement('div');
      backdrop.className = 's114-confirm-backdrop';

      const box = document.createElement('div');
      box.className = 's114-confirm';
      box.setAttribute('role', 'dialog');
      box.setAttribute('aria-modal', 'true');

      const head = document.createElement('div');
      head.className = 's114-confirm__head';
      head.textContent = cfg.title || '확인';
      if (cfg.alertOnly && !cfg.title) head.textContent = '알림';
      box.appendChild(head);

      const body = document.createElement('div');
      body.className = 's114-confirm__body';
      body.textContent = cfg.message;
      box.appendChild(body);

      /** @type {HTMLInputElement|null} */
      let input = null;
      if (isPrompt) {
        input = document.createElement('input');
        input.type = 'text';
        input.className = 's114-confirm__input';
        input.value = cfg.promptDefault || '';
        body.appendChild(input);
      }

      const foot = document.createElement('div');
      foot.className = 's114-confirm__foot';

      const cancelBtn = document.createElement('button');
      cancelBtn.type = 'button';
      cancelBtn.className = 's114-confirm__btn';
      cancelBtn.textContent = cfg.cancelLabel || '취소';

      const okBtn = document.createElement('button');
      okBtn.type = 'button';
      const okClass = cfg.danger ? 's114-confirm__btn s114-confirm__btn--danger' : 's114-confirm__btn s114-confirm__btn--ok';
      okBtn.className = okClass;
      okBtn.textContent = cfg.okLabel || '확인';

      foot.appendChild(cancelBtn);
      if (cfg.alertOnly) cancelBtn.hidden = true;
      foot.appendChild(okBtn);
      box.appendChild(foot);
      backdrop.appendChild(box);

      function close(confirmed) {
        backdrop.remove();
        const value = input ? input.value : '';
        if (prev instanceof HTMLElement) {
          try { prev.focus(); } catch { /* 무시 */ }
        }
        resolve({ confirmed, value });
        done();
      }

      cancelBtn.addEventListener('click', () => close(false));
      okBtn.addEventListener('click', () => close(true));
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) close(false);
      });
      box.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') { e.preventDefault(); close(false); }
        if (e.key === 'Enter' && !isPrompt) { e.preventDefault(); close(true); }
      });
      if (input) {
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') { e.preventDefault(); close(true); }
        });
      }

      document.body.appendChild(backdrop);

      if (input) {
        input.focus();
        input.select();
      } else {
        okBtn.focus();
      }
    };

    queue.push(run);
    runNext();
  });
}

/**
 * 브라우저 confirm() 대체.
 * @param {string} message
 * @param {{ title?: string, okLabel?: string, cancelLabel?: string, danger?: boolean }} [options]
 * @returns {Promise<boolean>}
 */
export function s114Confirm(message, options = {}) {
  return showDialog({ message, ...options }).then((r) => r.confirmed);
}

/**
 * 브라우저 prompt() 대체 (7b용 미리 준비).
 * @param {string} message
 * @param {string} [defaultValue]
 * @param {{ title?: string, okLabel?: string, cancelLabel?: string }} [options]
 * @returns {Promise<string|null>}
 */
export function s114Prompt(message, defaultValue = '', options = {}) {
  return showDialog({ message, promptDefault: defaultValue, ...options }).then((r) => r.confirmed ? r.value : null);
}

/**
 * 브라우저 alert() 대체. 확인 버튼만 있는 알림창.
 * @param {string} message
 * @param {{ title?: string }} [options]
 * @returns {Promise<void>}
 */
export function s114Alert(message, options = {}) {
  return showDialog({ message, alertOnly: true, title: options.title }).then(() => {});
}
