/**
 * 비밀번호 보이기/감추기. 기본은 type=password(감추기).
 */

/**
 * @param {{
 *   id: string,
 *   name: string,
 *   autocomplete?: string,
 *   placeholder?: string,
 *   required?: boolean,
 *   value?: string,
 *   className?: string,
 * }} opts
 */
export function renderPasswordField(opts) {
  const id = String(opts.id || '');
  const name = String(opts.name || 'password');
  const autocomplete = opts.autocomplete || 'current-password';
  const placeholder = opts.placeholder || '비밀번호';
  const required = opts.required !== false;
  const value = opts.value != null ? String(opts.value) : '';
  const className = opts.className || 'form-input';
  const esc = (s) =>
    String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/"/g, '&quot;');

  return `
    <div class="password-field">
      <input
        class="${esc(className)} password-field__input"
        type="password"
        id="${esc(id)}"
        name="${esc(name)}"
        placeholder="${esc(placeholder)}"
        autocomplete="${esc(autocomplete)}"
        ${required ? 'required' : ''}
        ${value ? `value="${esc(value)}"` : ''}
      />
      <button
        type="button"
        class="password-field__toggle"
        data-password-toggle
        aria-controls="${esc(id)}"
        aria-pressed="false"
        aria-label="비밀번호 보이기"
      >보이기</button>
    </div>
  `;
}

/** @param {ParentNode} root */
export function bindPasswordToggles(root) {
  root.querySelectorAll('[data-password-toggle]').forEach((btn) => {
    if (btn.dataset.boundPasswordToggle === '1') return;
    btn.dataset.boundPasswordToggle = '1';
    btn.addEventListener('click', () => {
      const controls = btn.getAttribute('aria-controls') || '';
      const input =
        (controls && root.querySelector(`#${CSS.escape(controls)}`)) ||
        btn.closest('.password-field')?.querySelector('input');
      if (!(input instanceof HTMLInputElement)) return;
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      btn.setAttribute('aria-pressed', show ? 'true' : 'false');
      btn.setAttribute('aria-label', show ? '비밀번호 감추기' : '비밀번호 보이기');
      btn.textContent = show ? '감추기' : '보이기';
    });
  });
}
