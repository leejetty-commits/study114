/**
 * 후기 시트 — 카드 후기 N 클릭 시 레이어.
 * 제목 필드 없음. 본문 snippet + 태그 + 시점. 펼침. CTA는 cta_kind 잠금값.
 */

import { esc, confirmLeaveDetailCard } from '../detail-decision/detail-utils.js';
import { getAuthUser } from '../auth-session.js';
import { getNavRole } from '../state.js';
import { guardGuestDeepAccess } from '../guest-deep-access.js';
import {
  PROVIDER_REVIEW_COPY,
  REVIEW_ORIGIN_LABELS,
  REVIEW_POLICY,
  ctaLabel,
  reviewSnippet,
  writeBlockedMessage,
  canOfferWriteCta,
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
import { startFirstMemoFlow } from '../messages/compose-flow.js';
import { goHomeHashPath } from '../spa-navigation.js';
import { s114Confirm } from '../../../shared/confirm-dialog.js';

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

export function resolveRequestedView(summary, view) {
  if (view !== 'write') return view || 'consume';
  if (summary.can_write) return 'write';
  if (summary.cta_kind === 'manage') return 'manage';
  return 'write_gate';
}

function renderWriteGate(summary) {
  const reason = summary.write_blocked_reason;
  const memoOk = reason === 'no_thread' || reason === 'login';
  return `
    <div class="p24-review-gate">
      <p>${esc(writeBlockedMessage(reason))}</p>
      ${
        memoOk
          ? `<button type="button" class="btn btn--primary" data-review-sheet-act="memo">${esc(PROVIDER_REVIEW_COPY.writeGateMemoCta)}</button>`
          : ''
      }
      <button type="button" class="btn btn--secondary" data-review-sheet-act="back">후기 읽기</button>
    </div>`;
}

export function renderCta(summary) {
  const kind = summary.cta_kind || 'ineligible';
  if (kind === 'none') return '';
  if (kind === 'manage') {
    return `<button type="button" class="btn btn--primary" data-review-sheet-act="manage">${esc(PROVIDER_REVIEW_COPY.manageCta)}</button>`;
  }
  if (canOfferWriteCta(summary)) {
    return `<button type="button" class="btn btn--primary" data-review-sheet-act="write">${esc(PROVIDER_REVIEW_COPY.writeCta)}</button>`;
  }
  if (summary.write_blocked_reason === 'role') {
    return `<p class="review-sheet__cta-note">${esc(writeBlockedMessage('role'))}</p>`;
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

export function renderForm(summary, { editId = null } = {}) {
  const allowed = summary.allowed_tags || [];
  const editing = (summary.my_reviews || []).find((r) => Number(r.id) === Number(editId));
  const selected = new Set(editing?.point_tags || []);
  const origin = editing?.review_origin_type || 'consultation';
  const bodyVal = editing?.review_body || '';
  const remaining = Number(summary.remaining_creates ?? 0);
  const quotaLine = `최대 ${REVIEW_POLICY.maxCreates}회 · 남은 횟수 ${remaining} · 삭제한 후기도 포함`;
  return `
    <form class="p24-review-form p24-review-form--flat" data-review-form novalidate>
      <h4 class="p24-review-form__title">${esc(editing ? '후기 수정' : PROVIDER_REVIEW_COPY.writeTitle)}</h4>
      <p class="p24-review-form__quota">${esc(quotaLine)}</p>

      <section class="p24-review-form__section">
        <p class="p24-review-form__label">${esc(PROVIDER_REVIEW_COPY.originQuestion)}</p>
        <div class="p24-review-origin" role="radiogroup" aria-label="${esc(PROVIDER_REVIEW_COPY.originQuestion)}">
          <label class="p24-review-origin__card${origin === 'consultation' ? ' is-selected' : ''}">
            <input type="radio" name="origin" value="consultation"${origin === 'consultation' ? ' checked' : ''} />
            <span>${esc(REVIEW_ORIGIN_LABELS.consultation)}</span>
          </label>
          <label class="p24-review-origin__card${origin === 'experience' ? ' is-selected' : ''}">
            <input type="radio" name="origin" value="experience"${origin === 'experience' ? ' checked' : ''} />
            <span>${esc(REVIEW_ORIGIN_LABELS.experience)}</span>
          </label>
        </div>
        <p class="p24-review-form__field-error" data-error-for="origin" hidden></p>
      </section>

      <section class="p24-review-form__section">
        <p class="p24-review-form__label">
          ${esc(PROVIDER_REVIEW_COPY.tagsQuestion)}
          <span class="p24-review-form__label-hint">${esc(PROVIDER_REVIEW_COPY.tagsCountHint)}</span>
        </p>
        <div class="p24-review-form__tags">
          ${allowed
            .map(
              (t) =>
                `<label class="p24-review-chip${selected.has(t) ? ' is-selected' : ''}"><input type="checkbox" name="tag" value="${esc(t)}"${selected.has(t) ? ' checked' : ''} /> <span>${esc(t)}</span></label>`,
            )
            .join('')}
        </div>
        <p class="p24-review-form__chip-tip" data-chip-tip hidden>${esc(PROVIDER_REVIEW_COPY.tagsOverLimit)}</p>
        <p class="p24-review-form__field-error" data-error-for="tags" hidden></p>
      </section>

      <section class="p24-review-form__section">
        <p class="p24-review-form__label">${esc(PROVIDER_REVIEW_COPY.bodyLabel)}</p>
        <textarea class="p24-review-form__textarea" name="body" rows="5" maxlength="${REVIEW_POLICY.bodyMax}" placeholder="${esc(PROVIDER_REVIEW_COPY.bodyPlaceholder)}">${esc(bodyVal)}</textarea>
        <div class="p24-review-form__body-meta">
          <p class="p24-review-form__body-hint" data-body-hint hidden>${esc(PROVIDER_REVIEW_COPY.bodyShortHint)}</p>
          <p class="p24-review-form__counter" data-body-counter>0 / ${REVIEW_POLICY.bodyMax}</p>
        </div>
        <p class="p24-review-form__field-error" data-error-for="body" hidden></p>
      </section>

      ${
        editing
          ? ''
          : `<section class="p24-review-form__section">
        <label class="p24-review-form__consent"><input type="checkbox" name="public_consent" /> ${esc(PROVIDER_REVIEW_COPY.publicConsent)}</label>
        <p class="p24-review-form__field-error" data-error-for="consent" hidden></p>
      </section>`
      }

      <div class="p24-review-form__actions">
        <button type="button" class="btn btn--secondary btn--sm" data-review-sheet-act="back">뒤로</button>
        <button type="submit" class="btn btn--primary btn--sm" data-review-submit disabled>${esc(editing ? PROVIDER_REVIEW_COPY.saveEdit : PROVIDER_REVIEW_COPY.submit)}</button>
      </div>
    </form>`;
}

function renderManage(summary) {
  const mine = summary.my_reviews || [];
  const remaining = Number(summary.remaining_creates ?? 0);
  const quotaLine = `최대 ${REVIEW_POLICY.maxCreates}회 · 남은 횟수 ${remaining} · 삭제한 후기도 포함`;
  const writeBtn = summary.can_write
    ? `<button type="button" class="btn btn--primary btn--sm" data-review-sheet-act="write">${esc(PROVIDER_REVIEW_COPY.writeCta)}</button>`
    : `<button type="button" class="btn btn--primary btn--sm" disabled title="${esc(PROVIDER_REVIEW_COPY.writeDisabledQuota)}">${esc(PROVIDER_REVIEW_COPY.writeCta)}</button>
       <p class="review-sheet__cta-note">${esc(PROVIDER_REVIEW_COPY.writeDisabledQuota)}</p>`;

  if (!mine.length) {
    return `
      <div class="review-sheet__manage">
        <h4 class="p24-review-form__title">${esc(PROVIDER_REVIEW_COPY.manageTitle)}</h4>
        <p class="p24-review-form__quota">${esc(quotaLine)}</p>
        <p class="review-sheet__empty">화면에 보이는 후기는 없지만, 작성 횟수는 유지됩니다.</p>
        <div class="review-sheet__footer-row review-sheet__footer-row--end">
          <button type="button" class="btn btn--secondary btn--sm" data-review-sheet-act="back">뒤로</button>
          ${writeBtn}
        </div>
      </div>`;
  }
  return `
    <div class="review-sheet__manage">
      <h4 class="p24-review-form__title">${esc(PROVIDER_REVIEW_COPY.manageTitle)}</h4>
      <p class="p24-review-form__quota">${esc(quotaLine)}</p>
      <ul class="review-sheet__manage-list">
        ${mine
          .map((r) => {
            const hidden = r.review_status === 'hidden';
            const tags = (r.point_tags || [])
              .map((t) => `<span class="p24-review-tag p24-review-tag--sm">${esc(t)}</span>`)
              .join('');
            return `<li class="review-manage-card" data-review-id="${r.id}">
              <div class="review-manage-card__top">
                <div class="review-manage-card__tags">${tags || ''}</div>
                <div class="review-manage-card__actions">
                  ${r.can_edit ? `<button type="button" class="review-manage-card__text-btn" data-review-edit="${r.id}">수정</button>` : ''}
                  ${r.can_hide ? `<button type="button" class="review-manage-card__text-btn" data-review-hide="${r.id}">${esc(PROVIDER_REVIEW_COPY.hideCta)}</button>` : ''}
                  ${r.can_unhide ? `<button type="button" class="review-manage-card__text-btn" data-review-unhide="${r.id}">${esc(PROVIDER_REVIEW_COPY.unhideCta)}</button>` : ''}
                  <button type="button" class="review-manage-card__text-btn review-manage-card__text-btn--danger" data-review-delete="${r.id}">${esc(PROVIDER_REVIEW_COPY.deleteCta)}</button>
                </div>
              </div>
              <p class="review-manage-card__body" data-review-body>${esc(r.review_body || '')}</p>
              <button type="button" class="review-manage-card__expand" data-review-body-toggle hidden>${esc(PROVIDER_REVIEW_COPY.expandBody)}</button>
              <p class="review-manage-card__meta">
                <span class="review-manage-card__badge${hidden ? ' is-hidden' : ''}">${esc(hidden ? PROVIDER_REVIEW_COPY.hiddenBadge : PROVIDER_REVIEW_COPY.publicBadge)}</span>
                <span>${esc(formatWhen(r.created_at))}</span>
              </p>
            </li>`;
          })
          .join('')}
      </ul>
      <div class="review-sheet__footer-row review-sheet__footer-row--end">
        <button type="button" class="btn btn--secondary btn--sm" data-review-sheet-act="back">뒤로</button>
        ${writeBtn}
      </div>
    </div>`;
}

function paint(host, summary, view, extra = {}) {
  const count = Number(summary.review_count) || 0;
  const tags = (summary.summary_tags || [])
    .map((t) => `<span class="p24-review-tag">${esc(t)}</span>`)
    .join('');
  let body = '';
  if (summary.load_failed) body = `<p class="review-sheet__empty">${esc(PROVIDER_REVIEW_COPY.loadFailed)}</p>`;
  else if (view === 'write' || view === 'edit') body = renderForm(summary, { editId: extra.editId });
  else if (view === 'manage') body = renderManage(summary);
  else if (view === 'write_gate') body = renderWriteGate(summary);
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
  const footer = view === 'consume' && !summary.load_failed ? `<div class="review-sheet__cta">${renderCta(summary)}</div>` : '';
  const countBadge =
    summary.load_failed || view === 'write' || view === 'edit' || view === 'manage'
      ? ''
      : `<span class="review-sheet__count-badge" aria-label="후기 ${count}개">${count}</span>`;
  host.innerHTML = `
    <div class="review-sheet" role="dialog" aria-modal="true" aria-labelledby="review-sheet-title">
      <div class="review-sheet__panel" data-drag-box>
        <header class="review-sheet__head">
          <div>
            <h2 id="review-sheet-title" class="review-sheet__title">후기${countBadge}</h2>
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
  host.querySelectorAll('.review-sheet__more').forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const href = a.getAttribute('href') || '';
      const path = href.replace(/^#/, '');
      void confirmLeaveDetailCard().then((ok) => {
        if (!ok) return;
        closeSheet();
        const modal = document.getElementById('p24-detail-modal');
        modal?.querySelectorAll('[data-naver-map-mount]').forEach((mount) => {
          /** @type {{ destroy?: () => void }|undefined} */ (mount)._mapController?.destroy?.();
        });
        modal?.remove();
        document.body.style.overflow = '';
        document.body.classList.remove('p24-detail-open', 'p24-detail-open--floating');
        if (path) goHomeHashPath(path.startsWith('/') ? path : `/${path}`);
      });
    });
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
      if (act === 'write') paint(host, summary, resolveRequestedView(summary, 'write'));
      if (act === 'manage') paint(host, summary, 'manage');
      if (act === 'back') paint(host, summary, 'consume');
      if (act === 'memo') {
        closeSheet();
        startFirstMemoFlow({
          kind: providerType,
          targetId: providerId,
          targetName: providerType === 'tutor' ? '과외쌤' : '공부방',
        });
      }
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
      if (!(await s114Confirm('이 후기를 삭제할까요? 삭제해도 작성 횟수는 줄어들지 않습니다.', { danger: true }))) return;
      await deleteProviderReview(Number(btn.getAttribute('data-review-delete')), { userId: getAuthUser()?.user_id });
      await reload('manage');
    });
  });

  host.querySelectorAll('[data-review-body-toggle]').forEach((btn) => {
    const card = btn.closest('.review-manage-card');
    const bodyEl = card?.querySelector('[data-review-body]');
    if (!(bodyEl instanceof HTMLElement)) return;
    const needsToggle = bodyEl.scrollHeight > bodyEl.clientHeight + 1;
    if (needsToggle) btn.hidden = false;
    btn.addEventListener('click', () => {
      const open = card.classList.toggle('is-expanded');
      btn.textContent = open ? PROVIDER_REVIEW_COPY.collapseBody : PROVIDER_REVIEW_COPY.expandBody;
    });
  });

  const form = host.querySelector('[data-review-form]');
  if (form) {
    const submitBtn = form.querySelector('[data-review-submit]');
    const counter = form.querySelector('[data-body-counter]');
    const bodyHint = form.querySelector('[data-body-hint]');
    const chipTip = form.querySelector('[data-chip-tip]');
    const bodyInput = form.querySelector('textarea[name="body"]');
    const clearFieldErrors = () => {
      form.querySelectorAll('[data-error-for]').forEach((el) => {
        el.hidden = true;
        el.textContent = '';
      });
    };
    const setFieldError = (key, msg) => {
      const el = form.querySelector(`[data-error-for="${key}"]`);
      if (!el) return;
      el.hidden = !msg;
      el.textContent = msg || '';
    };
    const selectedTags = () =>
      [...form.querySelectorAll('input[name="tag"]:checked')].map((el) => el.value);
    const syncOriginCards = () => {
      form.querySelectorAll('.p24-review-origin__card').forEach((card) => {
        const input = card.querySelector('input[type="radio"]');
        card.classList.toggle('is-selected', !!input?.checked);
      });
    };
    const syncValidity = () => {
      const tags = selectedTags();
      const body = String(bodyInput?.value || '').trim();
      const len = body.length;
      if (counter) counter.textContent = `${len} / ${REVIEW_POLICY.bodyMax}`;
      if (bodyHint) bodyHint.hidden = !(len > 0 && len < REVIEW_POLICY.bodyMin);
      const consentOk = view === 'edit' || !!form.public_consent?.checked;
      const ok =
        tags.length >= REVIEW_POLICY.tagsMin &&
        tags.length <= REVIEW_POLICY.tagsMax &&
        len >= REVIEW_POLICY.bodyMin &&
        len <= REVIEW_POLICY.bodyMax &&
        consentOk;
      if (submitBtn instanceof HTMLButtonElement) submitBtn.disabled = !ok;
    };

    form.querySelectorAll('input[name="origin"]').forEach((input) => {
      input.addEventListener('change', () => {
        syncOriginCards();
        syncValidity();
      });
    });
    syncOriginCards();

    form.querySelectorAll('.p24-review-chip input[name="tag"]').forEach((input) => {
      const syncChip = () =>
        input.closest('.p24-review-chip')?.classList.toggle('is-selected', input.checked);
      syncChip();
      input.addEventListener('click', (ev) => {
        if (input.checked) return;
        const nextCount = selectedTags().length + 1;
        if (nextCount > REVIEW_POLICY.tagsMax) {
          ev.preventDefault();
          if (chipTip) chipTip.hidden = false;
        }
      });
      input.addEventListener('change', () => {
        syncChip();
        if (selectedTags().length <= REVIEW_POLICY.tagsMax && chipTip) chipTip.hidden = true;
        syncValidity();
      });
    });

    bodyInput?.addEventListener('input', syncValidity);
    form.public_consent?.addEventListener('change', syncValidity);
    syncValidity();

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearFieldErrors();
      const origin = form.origin?.value || 'consultation';
      const selected = selectedTags();
      const body = String(form.body?.value || '').trim();
      let invalid = false;
      if (selected.length < REVIEW_POLICY.tagsMin || selected.length > REVIEW_POLICY.tagsMax) {
        setFieldError('tags', '좋았던 점을 1~3개 골라 주세요.');
        invalid = true;
      }
      if (body.length < REVIEW_POLICY.bodyMin || body.length > REVIEW_POLICY.bodyMax) {
        setFieldError('body', `본문은 ${REVIEW_POLICY.bodyMin}~${REVIEW_POLICY.bodyMax}자로 작성해 주세요.`);
        invalid = true;
      }
      if (view !== 'edit' && !form.public_consent?.checked) {
        setFieldError('consent', '공개 동의에 체크해 주세요.');
        invalid = true;
      }
      if (invalid) return;

      if (submitBtn instanceof HTMLButtonElement) {
        submitBtn.disabled = true;
        submitBtn.textContent = '저장 중…';
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
        setFieldError(
          'body',
          err instanceof Error ? err.message : '저장에 실패했습니다.',
        );
        if (submitBtn instanceof HTMLButtonElement) {
          submitBtn.disabled = false;
          submitBtn.textContent =
            view === 'edit' ? PROVIDER_REVIEW_COPY.saveEdit : PROVIDER_REVIEW_COPY.submit;
        }
        syncValidity();
      }
    });
  }
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
  paint(host, summary, resolveRequestedView(summary, view));
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
      if (!guardGuestDeepAccess(
        btn.getAttribute('data-review-view') === 'write' ? 'review_write' : 'review_sheet',
        { providerType: kind, providerId: id, extra: btn.getAttribute('data-review-view') === 'write' ? { view: 'write' } : {} },
      )) return;
      void openReviewSheet({
        providerType: kind,
        providerId: id,
        view: btn.getAttribute('data-review-view') === 'write' ? 'write' : 'consume',
      });
    },
    true,
  );
}
