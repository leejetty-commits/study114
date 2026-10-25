import '../styles/admin-member-mail.css';
import { MEMBER_MAIL_COPY as C, MEMBER_MAIL_KINDS as KINDS, MEMBER_MAIL_VARIANTS as VARIANTS } from './a28-member-mail-copy.js';
import { fetchMemberMail, patchMemberMail, postMemberMail } from './a28-member-mail-api.js';
import { esc, renderDetailDrawer, renderPanel } from './a28-screens-shared.js';
import { s114Alert, s114Confirm } from '../../../shared/confirm-dialog.js';

export const MEMBER_MAIL_PATH = '/admin/notify/member-mail';

/**
 * @typedef {{ id: string, enabled: boolean, changed_at: string|null, changed_by: string|null, sent_7d: number, variants: string[] }} MemberMailKind
 * @typedef {{ kinds: MemberMailKind[], lifecycle_enabled: boolean, can_edit: boolean, daily_cap: number, test_left: number }} MemberMailView
 */

/** @param {MemberMailKind} k @param {MemberMailView} view */
function renderRow(k, view) {
  const meta = KINDS[k.id] || { name: k.id, when: '', who: '' };
  const state = k.enabled ? C.stateOn : C.stateOff;
  const changed = k.changed_at
    ? `<small class="member-mail__changed">${esc(k.changed_at.slice(0, 16))}${k.changed_by ? ` · ${esc(C.changedBy)} ${esc(k.changed_by)}` : ''}</small>`
    : '';
  const toggle = `<button type="button" class="btn btn--secondary btn--sm" data-member-mail-toggle="${esc(k.id)}" data-enabled="${k.enabled ? '1' : '0'}"${view.can_edit ? '' : ' disabled'}>${esc(k.enabled ? C.pause : C.resume)}</button>`;
  return `
    <tr data-member-mail-row="${esc(k.id)}">
      <th scope="row">${esc(meta.name)}</th>
      <td>${esc(meta.when)}</td>
      <td>${esc(meta.who)}</td>
      <td><span class="member-mail__state member-mail__state--${k.enabled ? 'on' : 'off'}">${esc(state)}</span>${changed}</td>
      <td class="member-mail__num">${esc(String(k.sent_7d))}${esc(C.sentUnit)}</td>
      <td class="member-mail__actions">
        <button type="button" class="btn btn--secondary btn--sm" data-member-mail-preview="${esc(k.id)}">${esc(C.preview)}</button>
        <button type="button" class="btn btn--secondary btn--sm" data-member-mail-test="${esc(k.id)}"${view.test_left > 0 ? '' : ' disabled'}>${esc(C.test)}</button>
        ${toggle}
      </td>
    </tr>`;
}

/** @param {MemberMailView|null} view @param {string} [status] */
export function renderMemberMailBody(view, status = '') {
  if (!view) {
    return `<p class="a28-help" role="status" data-member-mail-status>${esc(status || C.loading)}</p>`;
  }
  const notes = [];
  if (!view.lifecycle_enabled) notes.push(`<p class="a28-help" role="alert">${esc(C.lifecycleOff)}</p>`);
  if (!view.can_edit) notes.push(`<p class="a28-help">${esc(C.masterOnly)}</p>`);
  return `
    ${notes.join('')}
    <p class="a28-help" role="status" data-member-mail-status>${esc(status)}</p>
    <div class="member-mail__table-wrap">
      <table class="sup-admin-table member-mail__table">
        <thead><tr>
          <th scope="col">${esc(C.colName)}</th><th scope="col">${esc(C.colWhen)}</th><th scope="col">${esc(C.colWho)}</th>
          <th scope="col">${esc(C.colState)}</th><th scope="col">${esc(C.colSent)}</th><th scope="col">${esc(C.colActions)}</th>
        </tr></thead>
        <tbody>${view.kinds.map((k) => renderRow(k, view)).join('')}</tbody>
      </table>
    </div>
    <p class="a28-help">${esc(C.testLeft(view.test_left))}</p>
    <p class="a28-help">${esc(C.scheduleNote(view.daily_cap))}</p>
    <p class="a28-help">${esc(C.accountNote)}</p>`;
}

function renderPreviewBody() {
  return `
    <div class="member-mail__preview" data-member-mail-preview-box>
      <label class="sup-field"><span>${esc(C.previewWho)}</span><select data-member-mail-variant></select></label>
      <p class="member-mail__subject"><strong>${esc(C.previewSubject)}</strong> <span data-member-mail-subject></span></p>
      <p class="a28-help">${esc(C.previewSample)}</p>
      <p class="a28-help" role="status" data-member-mail-preview-status></p>
      <iframe class="member-mail__frame" title="${esc(C.previewTitle)}" sandbox="" data-member-mail-frame></iframe>
    </div>`;
}

export function renderMemberMail() {
  return renderPanel(
    C.title,
    'A28-09',
    `<div data-member-mail-root>
       <div data-member-mail-body>${renderMemberMailBody(null)}</div>
       <div data-today-drawer-host>${renderDetailDrawer('member-mail-preview', C.previewTitle, renderPreviewBody())}</div>
     </div>`,
    { lead: esc(C.lead) },
  );
}

/**
 * 닷홈은 4xx 응답 본문을 자기 오류 페이지로 바꾸므로 상태 코드로도 고른다.
 * @param {unknown} err @param {string} fallback
 */
function errorText(err, fallback) {
  const code = err && typeof err === 'object' && 'code' in err ? String(err.code) : '';
  const status = err && typeof err === 'object' && 'status' in err ? Number(err.status) : 0;
  if (code === 'schema_missing' || status === 503) return C.schemaMissing;
  if (code === 'test_limit' || status === 429) return C.testLimit;
  if (code === 'forbidden' || status === 403) return C.forbidden;
  if (code === 'validation' && err instanceof Error && err.message) return err.message;
  return fallback;
}

/** @param {ParentNode} root */
export function bindMemberMail(root) {
  const box = root.querySelector('[data-member-mail-root]');
  if (!(box instanceof HTMLElement) || box.dataset.bound === '1') return;
  box.dataset.bound = '1';
  const body = box.querySelector('[data-member-mail-body]');
  const drawer = box.querySelector('[data-admin-drawer="member-mail-preview"]');
  const select = box.querySelector('[data-member-mail-variant]');
  const subject = box.querySelector('[data-member-mail-subject]');
  const frame = box.querySelector('[data-member-mail-frame]');
  const previewStatus = box.querySelector('[data-member-mail-preview-status]');
  /** @type {MemberMailView|null} */
  let view = null;
  let previewKind = '';
  let busy = false;

  /** @param {string} [status] */
  function paint(status = '') {
    if (body) body.innerHTML = renderMemberMailBody(view, status);
  }

  async function load() {
    try {
      view = await fetchMemberMail();
      paint();
    } catch (err) {
      view = null;
      paint(errorText(err, C.loadFailed));
    }
  }

  async function showPreview() {
    if (!(select instanceof HTMLSelectElement) || !(frame instanceof HTMLIFrameElement)) return;
    if (previewStatus) previewStatus.textContent = C.previewLoading;
    try {
      const data = await postMemberMail('preview', previewKind, select.value);
      if (subject) subject.textContent = data.mail?.subject || '';
      frame.srcdoc = data.mail?.html || '';
      if (previewStatus) previewStatus.textContent = '';
    } catch (err) {
      if (subject) subject.textContent = '';
      frame.srcdoc = '';
      if (previewStatus) previewStatus.textContent = errorText(err, C.previewFailed);
    }
  }

  /** @param {string} kind */
  function openPreview(kind) {
    const row = view?.kinds.find((k) => k.id === kind);
    if (!row || !(select instanceof HTMLSelectElement)) return;
    previewKind = kind;
    select.innerHTML = row.variants
      .map((v) => `<option value="${esc(v)}">${esc(VARIANTS[v] || v)}</option>`)
      .join('');
    if (drawer instanceof HTMLElement) drawer.hidden = false;
    showPreview();
  }

  select?.addEventListener('change', () => showPreview());

  body?.addEventListener('click', async (event) => {
    const target = event.target instanceof Element ? event.target.closest('button') : null;
    if (!(target instanceof HTMLButtonElement) || target.disabled || busy) return;

    const previewId = target.getAttribute('data-member-mail-preview');
    if (previewId) {
      openPreview(previewId);
      return;
    }

    const testId = target.getAttribute('data-member-mail-test');
    if (testId) {
      busy = true;
      target.disabled = true;
      try {
        const data = await postMemberMail('test', testId, '');
        if (data.view) view = data.view;
        paint();
        void s114Alert(C.testDone(String(data.to || '')));
      } catch (err) {
        paint();
        void s114Alert(errorText(err, C.testFailed));
      } finally {
        busy = false;
      }
      return;
    }

    const toggleId = target.getAttribute('data-member-mail-toggle');
    if (toggleId) {
      const enable = target.getAttribute('data-enabled') !== '1';
      const name = KINDS[toggleId]?.name || toggleId;
      if (!enable && !(await s114Confirm(C.confirmPause(name), { danger: true }))) return;
      busy = true;
      target.disabled = true;
      try {
        view = await patchMemberMail(toggleId, enable);
        paint();
      } catch (err) {
        paint();
        void s114Alert(errorText(err, C.saveFailed));
      } finally {
        busy = false;
      }
    }
  });

  load();
}
