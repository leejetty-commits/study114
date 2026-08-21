/**
 * 후기 시트 — 카드 후기 N 클릭 시 레이어.
 * 제목 필드 없음. 본문 snippet + 태그 + 시점. 펼침. CTA는 cta_kind 잠금값.
 */

import { esc } from '../detail-decision/detail-utils.js';
import { getAuthUser } from '../auth-session.js';
import { getNavRole } from '../state.js';
import { guardGuestDeepAccess } from '../guest-deep-access.js';
import {
  PROVIDER_REVIEW_COPY,
  REVIEW_ORIGIN_LABELS,
  REVIEW_POLICY,
  ctaLabel,
  reviewSnippet,
} from './copy.js';
import {
  fetchReviewSummary,
  createProviderReview,
  updateProviderReview,
  hideProviderReview,
  unhideProviderReview,
  deleteProviderReview,
  reviewsArchivePath,
} from './store.js';

let sheetEl = null;

function viewerOpts(isOwner = false) {
  const auth = getAuthUser();
  return {
    role: getNavRole(),
    userId: auth?.user_id ?? null,
    isOwner,
  };
}

function formatWhen(iso) {
  if (!iso) return '';
  const d = new Date(String(iso).replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return String(iso).slice(0, 10);
  const diff = Date.now() - d.getTime();
  const day = Math.floor(diff / 86400000);
  if (day < 1) return '오늘';
  if (day < 7) return `${day}일 전`;
  return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`;
}

function closeSheet() {
  sheetEl?.remove();
  sheetEl = null;
}

function renderCta(summary) {
  const kind = summary.cta_kind || 'ineligible';
  if (kind === 'none') return '';
  if (kind === 'write') {
    return `<button type="button" class="btn btn--primary" data-review-sheet-act="write">${esc(PROVIDER_REVIEW_COPY.writeCta)}</button>`;
  }
  if (kind === 'manage') {
    return `<button type="button" class="btn btn--primary" data-review-sheet-act="manage">${esc(PROVIDER_REVIEW_COPY.manageCta)}</button>`;
  }
  return `<p class="review-sheet__cta-note">${esc(ctaLabel(kind))}</p>`;
}

function renderItem(r, expandedId) {
  const tags = (r.point_tags || []).map((t) => `<span class="p24-review-tag p24-review-tag--sm">${esc(t)}</span>`).join('');
  const origin = REVIEW_ORIGIN_LABELS[r.review_origin_type] || '';
  const open = Number(expandedId) === Number(r.id);
  const body = open ? r.review_body : reviewSnippet(r.review_body);
  return `
    <li class="review-sheet__item${open ? ' is-open' : ''}" data-review-id="${r.id}">
      <button type="button" class="review-sheet__item-btn" data-review-expand="${r.id}">
        <p class="review-sheet__headline">${esc(body)}</p>
        <p class="review-sheet__meta">${esc([origin, formatWhen(r.created_at)].filter(Boolean).join(' · '))}</p>
        ${tags ? `<div class="p24-review-tags">${tags}</div>` : ''}
      </button>
    </li>`;
}

function renderList(summary, expandedId) {
  const reviews = summary.reviews || [];
  if (!reviews.length) {
    const empty =
      summary.cta_kind === 'write' ? PROVIDER_REVIEW_COPY.emptyEligible : PROVIDER_REVIEW_COPY.empty;
    return `<p class="review-sheet__empty">${esc(empty)}</p>`;
  }
  return `<ul class="review-sheet__list">${reviews.map((r) => renderItem(r, expandedId)).join('')}</ul>`;
}

function renderForm(summary, { editId = null } = {}) {
  const allowed = summary.allowed_tags || [];
  const editing = (summary.my_reviews || []).find((r) => Number(r.id) === Number(editId));
  const selected = new Set(editing?.point_tags || []);
  const origin = editing?.review_origin_type || 'consultation';
  return `
    <form class="p24-review-form" data-review-form>
      <h4>${esc(editing ? '후기 수정' : PROVIDER_REVIEW_COPY.writeTitle)}</h4>
      <p class="p24-review-form__hint">${esc(PROVIDER_REVIEW_COPY.quotaHint)}</p>
      <fieldset class="p24-review-form__field">
        <legend>${esc(PROVIDER_REVIEW_COPY.originQuestion)}</legend>
        <label><input type="radio" name="origin" value="consultation"${origin === 'consultation' ? ' checked' : ''} /> ${esc(REVIEW_ORIGIN_LABELS.consultation)}</label>
        <label><input type="radio" name="origin" value="experience"${origin === 'experience' ? ' checked' : ''} /> ${esc(REVIEW_ORIGIN_LABELS.experience)}</label>
      </fieldset>
      <fieldset class="p24-review-form__field">
        <legend>${esc(PROVIDER_REVIEW_COPY.tagsQuestion)}</legend>
        <div class="p24-review-form__tags">
          ${allowed
            .map(
              (t) =>
                `<label class="p24-review-chip${selected.has(t) ? ' is-selected' : ''}"><input type="checkbox" name="tag" value="${esc(t)}"${selected.has(t) ? ' checked' : ''} /> <span>${esc(t)}</span></label>`,
            )
            .join('')}
        </div>
      </fieldset>
      <label class="p24-review-form__field">
        <span>${esc(PROVIDER_REVIEW_COPY.bodyLabel)} (${REVIEW_POLICY.bodyMin}~${REVIEW_POLICY.bodyMax}자)</span>
        <textarea name="body" rows="4" maxlength="${REVIEW_POLICY.bodyMax}" placeholder="${esc(PROVIDER_REVIEW_COPY.bodyPlaceholder)}" required>${esc(editing?.review_body || '')}</textarea>
      </label>
      ${
        editing
          ? ''
          : `<label class="p24-review-form__consent"><input type="checkbox" name="public_consent" required /> ${esc(PROVIDER_REVIEW_COPY.publicConsent)}</label>`
      }
      <p class="p24-review-form__error" data-review-error hidden></p>
      <div class="p24-review-form__actions">
        <button type="button" class="btn btn--secondary btn--sm" data-review-sheet-act="back">뒤로</button>
        <button type="submit" class="btn btn--primary btn--sm">${esc(editing ? PROVIDER_REVIEW_COPY.saveEdit : PROVIDER_REVIEW_COPY.submit)}</button>
      </div>
    </form>`;
}

function renderManage(summary) {
  const mine = summary.my_reviews || [];
  if (!mine.length) {
    return `
      <div class="review-sheet__manage">
        <h4>${esc(PROVIDER_REVIEW_COPY.manageTitle)}</h4>
        <p class="review-sheet__empty">화면에 보이는 후기는 없지만, 작성 횟수는 유지됩니다. (누적 ${summary.created_count || 0}/3)</p>
        ${
          summary.can_write
            ? `<button type="button" class="btn btn--primary btn--sm" data-review-sheet-act="write">${esc(PROVIDER_REVIEW_COPY.writeCta)}</button>`
            : `<p class="review-sheet__cta-note">${esc(ctaLabel(summary.write_blocked_reason === 'quota' ? 'ineligible' : summary.cta_kind))}</p>`
        }
        <button type="button" class="btn btn--secondary btn--sm" data-review-sheet-act="back">뒤로</button>
      </div>`;
  }
  return `
    <div class="review-sheet__manage">
      <h4>${esc(PROVIDER_REVIEW_COPY.manageTitle)}</h4>
      <p class="p24-review-form__hint">누적 작성 ${summary.created_count || 0}/3 · 남은 횟수 ${summary.remaining_creates ?? 0}</p>
      <ul class="review-sheet__list">
        ${mine
          .map((r) => {
            const hidden = r.review_status === 'hidden';
            return `<li class="review-sheet__item">
              <p class="review-sheet__headline">${esc(reviewSnippet(r.review_body))}</p>
              <p class="review-sheet__meta">${esc(hidden ? '비공개' : '공개')} · ${esc(formatWhen(r.created_at))}</p>
              <div class="review-sheet__item-actions">
                ${r.can_edit ? `<button type="button" class="btn btn--secondary btn--sm" data-review-edit="${r.id}">수정</button>` : ''}
                ${r.can_hide ? `<button type="button" class="btn btn--secondary btn--sm" data-review-hide="${r.id}">${esc(PROVIDER_REVIEW_COPY.hideCta)}</button>` : ''}
                ${r.can_unhide ? `<button type="button" class="btn btn--secondary btn--sm" data-review-unhide="${r.id}">${esc(PROVIDER_REVIEW_COPY.unhideCta)}</button>` : ''}
                <button type="button" class="btn btn--secondary btn--sm" data-review-delete="${r.id}">${esc(PROVIDER_REVIEW_COPY.deleteCta)}</button>
              </div>
            </li>`;
          })
          .join('')}
      </ul>
      <div class="review-sheet__footer-row">
        ${
          summary.can_write
            ? `<button type="button" class="btn btn--primary btn--sm" data-review-sheet-act="write">${esc(PROVIDER_REVIEW_COPY.writeCta)}</button>`
            : ''
        }
        <button type="button" class="btn btn--secondary btn--sm" data-review-sheet-act="back">뒤로</button>
      </div>
    </div>`;
}

function paint(host, summary, view, extra = {}) {
  const count = Number(summary.review_count) || 0;
  const tags = (summary.summary_tags || [])
    .map((t) => `<span class="p24-review-tag">${esc(t)}</span>`)
    .join('');
  let body = '';
  if (view === 'write' || view === 'edit') body = renderForm(summary, { editId: extra.editId });
  else if (view === 'manage') body = renderManage(summary);
  else {
    body = `
      ${tags ? `<div class="p24-review-tags review-sheet__tags">${tags}</div>` : ''}
      ${renderList(summary, extra.expandedId)}
      ${
        count > REVIEW_POLICY.sheetLimit
          ? `<a class="review-sheet__more" href="#${reviewsArchivePath({
              providerType: summary.provider_type,
              providerId: summary.provider_id,
            })}">${esc(PROVIDER_REVIEW_COPY.moreCta)}</a>`
          : count > 0
            ? `<a class="review-sheet__more" href="#${reviewsArchivePath({
                providerType: summary.provider_type,
                providerId: summary.provider_id,
              })}">${esc(PROVIDER_REVIEW_COPY.moreCta)}</a>`
            : ''
      }`;
  }
  const footer = view === 'consume' ? `<div class="review-sheet__cta">${renderCta(summary)}</div>` : '';
  host.innerHTML = `
    <div class="review-sheet" role="dialog" aria-modal="true" aria-labelledby="review-sheet-title">
      <div class="review-sheet__panel">
        <header class="review-sheet__head">
          <div>
            <h2 id="review-sheet-title">후기 ${count}</h2>
            <p>${esc(PROVIDER_REVIEW_COPY.sheetSubtitle)}</p>
          </div>
          <button type="button" class="review-sheet__close" data-review-sheet-act="close" aria-label="닫기">×</button>
        </header>
        <div class="review-sheet__body">${body}</div>
        ${footer}
      </div>
    </div>`;
  bindSheet(host, summary, view, extra);
}

function bindSheet(host, summary, view, extra) {
  const providerType = summary.provider_type;
  const providerId = summary.provider_id;
  const isOwner = !!summary.is_owner;

  host.querySelector('[data-review-sheet-act="close"]')?.addEventListener('click', closeSheet);
  host.querySelector('.review-sheet')?.addEventListener('click', (e) => {
    if (e.target === host.querySelector('.review-sheet')) closeSheet();
  });

  host.querySelectorAll('[data-review-expand]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = Number(btn.getAttribute('data-review-expand'));
      const next = Number(extra.expandedId) === id ? null : id;
      paint(host, summary, 'consume', { expandedId: next });
    });
  });

  host.querySelectorAll('[data-review-sheet-act]').forEach((btn) => {
    const act = btn.getAttribute('data-review-sheet-act');
    if (act === 'close') return;
    btn.addEventListener('click', () => {
      if (act === 'write') paint(host, summary, 'write');
      if (act === 'manage') paint(host, summary, 'manage');
      if (act === 'back') paint(host, summary, 'consume');
    });
  });

  host.querySelectorAll('[data-review-edit]').forEach((btn) => {
    btn.addEventListener('click', () => {
      paint(host, summary, 'edit', { editId: Number(btn.getAttribute('data-review-edit')) });
    });
  });

  const reload = async (nextView = 'consume') => {
    const fresh = await fetchReviewSummary(providerType, providerId, viewerOpts(isOwner));
    paint(host, fresh, nextView);
  };

  host.querySelectorAll('[data-review-hide]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      await hideProviderReview(Number(btn.getAttribute('data-review-hide')), { userId: getAuthUser()?.user_id });
      await reload('manage');
    });
  });
  host.querySelectorAll('[data-review-unhide]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      await unhideProviderReview(Number(btn.getAttribute('data-review-unhide')), { userId: getAuthUser()?.user_id });
      await reload('manage');
    });
  });
  host.querySelectorAll('[data-review-delete]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm('이 후기를 삭제할까요? 삭제해도 작성 횟수는 줄어들지 않습니다.')) return;
      await deleteProviderReview(Number(btn.getAttribute('data-review-delete')), { userId: getAuthUser()?.user_id });
      await reload('manage');
    });
  });

  const form = host.querySelector('[data-review-form]');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errEl = host.querySelector('[data-review-error]');
    const origin = form.origin?.value || 'consultation';
    const selected = [...form.querySelectorAll('input[name="tag"]:checked')].map((el) => el.value);
    const body = String(form.body?.value || '').trim();
    if (selected.length < 1 || selected.length > 3) {
      if (errEl) {
        errEl.hidden = false;
        errEl.textContent = '좋았던 점을 1~3개 골라 주세요.';
      }
      return;
    }
    if (body.length < REVIEW_POLICY.bodyMin || body.length > REVIEW_POLICY.bodyMax) {
      if (errEl) {
        errEl.hidden = false;
        errEl.textContent = `본문은 ${REVIEW_POLICY.bodyMin}~${REVIEW_POLICY.bodyMax}자로 작성해 주세요.`;
      }
      return;
    }
    try {
      if (view === 'edit' && extra.editId) {
        await updateProviderReview(
          { review_id: extra.editId, review_body: body, point_tags: selected },
          { userId: getAuthUser()?.user_id },
        );
        await reload('manage');
      } else {
        await createProviderReview(
          {
            provider_type: providerType,
            provider_id: providerId,
            review_origin_type: origin,
            review_body: body,
            point_tags: selected,
            public_consent: !!form.public_consent?.checked,
          },
          { userId: getAuthUser()?.user_id },
        );
        await reload('consume');
      }
    } catch (err) {
      if (errEl) {
        errEl.hidden = false;
        errEl.textContent = err instanceof Error ? err.message : '저장에 실패했습니다.';
      }
    }
  });

  form?.querySelectorAll('.p24-review-chip input[name="tag"]').forEach((input) => {
    const sync = () => input.closest('.p24-review-chip')?.classList.toggle('is-selected', input.checked);
    sync();
    input.addEventListener('change', sync);
  });
}

/**
 * @param {{ providerType: 'study_room'|'tutor', providerId: number, isOwner?: boolean, view?: 'consume'|'write'|'manage' }} opts
 */
export async function openReviewSheet({ providerType, providerId, isOwner = false, view = 'consume' }) {
  if (!guardGuestDeepAccess('review_sheet', { providerType, providerId })) return;
  closeSheet();
  const host = document.createElement('div');
  host.className = 'review-sheet-root';
  document.body.appendChild(host);
  sheetEl = host;
  host.innerHTML = `<div class="review-sheet"><div class="review-sheet__panel"><p class="review-sheet__empty">후기를 불러오는 중…</p></div></div>`;
  const summary = await fetchReviewSummary(providerType, providerId, viewerOpts(isOwner));
  paint(host, summary, view);
}

let delegatedSheetClicks = false;

/**
 * 카드·확대카드·검색 어디서든 후기 CTA가 시트를 열도록 document 위임.
 * @param {ParentNode} [_root]
 * @param {{ isOwner?: boolean }} [_extra]
 */
export function bindReviewSheetTriggers(_root = document, _extra = {}) {
  if (delegatedSheetClicks) return;
  delegatedSheetClicks = true;
  document.addEventListener(
    'click',
    (e) => {
      const btn = e.target instanceof Element ? e.target.closest('[data-action="open-review-sheet"]') : null;
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();
      const kind = btn.getAttribute('data-item-kind');
      const id = Number(btn.getAttribute('data-item-id') || 0);
      if (kind !== 'study_room' && kind !== 'tutor') return;
      if (!id) return;
      if (!guardGuestDeepAccess('review_sheet', { providerType: kind, providerId: id })) return;
      void openReviewSheet({ providerType: kind, providerId: id });
    },
    true,
  );
}
