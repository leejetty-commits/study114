/**
 * 공급자 후기 UI — 상세 섹션 · 작성/답글 패널
 */

import { esc } from '../detail-decision/detail-utils.js';
import { getAuthUser } from '../auth-session.js';
import { getNavRole } from '../state.js';
import { AUTH_UI_BASE } from '../data.js';
import {
  PROVIDER_REVIEW_COPY,
  REVIEW_ORIGIN_LABELS,
  writeBlockedMessage,
} from './copy.js';
import {
  fetchReviewSummary,
  createProviderReview,
  createProviderReviewReply,
} from './store.js';

/**
 * @param {'study_room'|'tutor'} providerType
 * @param {number} providerId
 * @param {object} item
 * @param {string} viewer nav role
 */
export async function mountProviderReviewSection(host, providerType, providerId, item, viewer) {
  if (!host) return;
  const auth = getAuthUser();
  const isOwner =
    (viewer === 'study_room' && providerType === 'study_room') ||
    (viewer === 'tutor' && providerType === 'tutor')
      ? Number(item?.user_id || item?.owner_user_id || 0) === Number(auth?.user_id || -1) ||
        // preview demo: same-role viewer treating listing id without owner field
        (Number(providerId) > 0 && !item?.user_id && !item?.owner_user_id && !!auth)
      : false;

  const summary = await fetchReviewSummary(providerType, providerId, {
    role: viewer,
    userId: auth?.user_id ?? null,
    isOwner,
  });

  host.innerHTML = renderReviewSectionMarkup(summary, viewer);
  bindReviewSection(host, providerType, providerId, item, viewer, isOwner);
}

/** @param {object} summary @param {string} viewer */
function renderReviewSectionMarkup(summary, viewer) {
  const count = Number(summary.review_count) || 0;
  const tags = (summary.summary_tags || [])
    .map((t) => `<span class="p24-review-tag">${esc(t)}</span>`)
    .join('');
  const originBits = [];
  if (summary.origin_hint?.consultation) originBits.push(`상담후기 ${summary.origin_hint.consultation}`);
  if (summary.origin_hint?.experience) originBits.push(`이용후기 ${summary.origin_hint.experience}`);
  const hasReply = (summary.reviews || []).some((r) => r.reply);
  if (hasReply) originBits.push('공급자 답글 있음');

  let bodyHtml = '';
  if (!summary.can_read_body) {
    bodyHtml = `
      <div class="p24-review-gate">
        <p>${esc(summary.guest_teaser || PROVIDER_REVIEW_COPY.guestTeaser)}</p>
        <a class="btn btn--secondary btn--sm" href="${esc(AUTH_UI_BASE)}/#/login?from=detail-review">로그인 후 후기 보기</a>
      </div>`;
  } else if (!(summary.reviews || []).length) {
    bodyHtml = `<p class="p24-review-empty">${esc(PROVIDER_REVIEW_COPY.empty)}</p>`;
  } else {
    bodyHtml = `<ul class="p24-review-list">${(summary.reviews || [])
      .map((r) => renderReviewItem(r))
      .join('')}</ul>`;
  }

  const writeBtn =
    summary.can_write
      ? `<button type="button" class="btn btn--secondary btn--sm" data-provider-review-write>${esc(PROVIDER_REVIEW_COPY.writeCta)}</button>`
      : viewer === 'guest'
        ? ''
        : summary.write_blocked_reason && summary.write_blocked_reason !== 'owner'
          ? `<p class="p24-review-hint">${esc(writeBlockedMessage(summary.write_blocked_reason))}</p>`
          : '';

  return `
    <section class="p24-section p24-section--reviews" data-provider-review-root>
      <div class="p24-review-head">
        <h3 class="p24-section__title">${esc(PROVIDER_REVIEW_COPY.sectionTitle)}${count ? ` ${count}개` : ''}</h3>
        ${writeBtn}
      </div>
      <p class="p24-review-summary-line">${esc(count ? `후기 ${count}개` : '후기 없음')}${
        originBits.length ? ` · ${esc(originBits.join(' · '))}` : ''
      }</p>
      ${tags ? `<div class="p24-review-tags">${tags}</div>` : ''}
      ${bodyHtml}
      <div data-provider-review-panel></div>
      <p class="p24-review-footnote">${esc(PROVIDER_REVIEW_COPY.notStudentReviewNote)}</p>
    </section>`;
}

function renderReviewItem(r) {
  const tags = (r.point_tags || []).map((t) => `<span class="p24-review-tag p24-review-tag--sm">${esc(t)}</span>`).join('');
  const origin = REVIEW_ORIGIN_LABELS[r.review_origin_type] || '';
  const reply = r.reply
    ? `<div class="p24-review-reply"><span class="p24-review-reply__label">${esc(PROVIDER_REVIEW_COPY.replyLabel)}</span><p>${esc(r.reply.body)}</p></div>`
    : r.can_reply
      ? `<button type="button" class="btn btn--secondary btn--sm" data-provider-review-reply="${r.id}">${esc(PROVIDER_REVIEW_COPY.replyCta)}</button>`
      : '';
  return `
    <li class="p24-review-item" data-review-id="${r.id}">
      <p class="p24-review-item__meta">${esc(origin)}</p>
      ${tags ? `<div class="p24-review-tags">${tags}</div>` : ''}
      <p class="p24-review-item__body">${esc(r.review_body)}</p>
      ${reply}
    </li>`;
}

function bindReviewSection(host, providerType, providerId, item, viewer, isOwner) {
  host.querySelector('[data-provider-review-write]')?.addEventListener('click', () => {
    openWritePanel(host, providerType, providerId, viewer);
  });
  host.querySelectorAll('[data-provider-review-reply]').forEach((btn) => {
    btn.addEventListener('click', () => {
      openReplyPanel(host, Number(btn.getAttribute('data-provider-review-reply')), providerType, providerId, item, viewer, isOwner);
    });
  });
}

function openWritePanel(host, providerType, providerId, viewer) {
  const panel = host.querySelector('[data-provider-review-panel]');
  if (!panel) return;
  void fetchReviewSummary(providerType, providerId, { role: viewer, userId: getAuthUser()?.user_id }).then((summary) => {
      const allowed = summary.allowed_tags || [];
      panel.innerHTML = `
        <form class="p24-review-form" data-provider-review-form>
          <h4>${esc(PROVIDER_REVIEW_COPY.writeTitle)}</h4>
          <fieldset class="p24-review-form__field">
            <legend>${esc(PROVIDER_REVIEW_COPY.originQuestion)}</legend>
            <label><input type="radio" name="origin" value="consultation" checked /> ${esc(REVIEW_ORIGIN_LABELS.consultation)}</label>
            <label><input type="radio" name="origin" value="experience" /> ${esc(REVIEW_ORIGIN_LABELS.experience)}</label>
          </fieldset>
          <fieldset class="p24-review-form__field">
            <legend>${esc(PROVIDER_REVIEW_COPY.tagsQuestion)}</legend>
            <div class="p24-review-form__tags">
              ${allowed
                .map(
                  (t) =>
                    `<label class="p24-review-chip"><input type="checkbox" name="tag" value="${esc(t)}" /> ${esc(t)}</label>`,
                )
                .join('')}
            </div>
          </fieldset>
          <label class="p24-review-form__field">
            <span>후기 본문 (${PROVIDER_REVIEW_COPY.bodyMin}~${PROVIDER_REVIEW_COPY.bodyMax}자)</span>
            <textarea name="body" rows="4" maxlength="${PROVIDER_REVIEW_COPY.bodyMax}" placeholder="${esc(PROVIDER_REVIEW_COPY.bodyPlaceholder)}" required></textarea>
          </label>
          <p class="p24-review-form__error" data-review-error hidden></p>
          <div class="p24-review-form__actions">
            <button type="button" class="btn btn--secondary btn--sm" data-review-cancel>취소</button>
            <button type="submit" class="btn btn--primary btn--sm">${esc(PROVIDER_REVIEW_COPY.submit)}</button>
          </div>
        </form>`;
      panel.querySelector('[data-review-cancel]')?.addEventListener('click', () => {
        panel.innerHTML = '';
      });
      panel.querySelector('form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = /** @type {HTMLFormElement} */ (e.target);
        const errEl = panel.querySelector('[data-review-error]');
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
        if (body.length < PROVIDER_REVIEW_COPY.bodyMin || body.length > PROVIDER_REVIEW_COPY.bodyMax) {
          if (errEl) {
            errEl.hidden = false;
            errEl.textContent = `본문은 ${PROVIDER_REVIEW_COPY.bodyMin}~${PROVIDER_REVIEW_COPY.bodyMax}자로 작성해 주세요.`;
          }
          return;
        }
        try {
          await createProviderReview(
            {
              provider_type: providerType,
              provider_id: providerId,
              review_origin_type: origin,
              review_body: body,
              point_tags: selected,
            },
            { userId: getAuthUser()?.user_id },
          );
          await mountProviderReviewSection(host, providerType, providerId, {}, viewer);
        } catch (err) {
          if (errEl) {
            errEl.hidden = false;
            errEl.textContent = err instanceof Error ? err.message : '등록에 실패했습니다.';
          }
        }
      });
    });
}

function openReplyPanel(host, reviewId, providerType, providerId, item, viewer, isOwner) {
  const panel = host.querySelector('[data-provider-review-panel]');
  if (!panel) return;
  panel.innerHTML = `
    <form class="p24-review-form" data-provider-reply-form>
      <h4>${esc(PROVIDER_REVIEW_COPY.replyCta)}</h4>
      <label class="p24-review-form__field">
        <span>${esc(PROVIDER_REVIEW_COPY.replyLabel)} (최대 ${PROVIDER_REVIEW_COPY.replyMax}자)</span>
        <textarea name="body" rows="3" maxlength="${PROVIDER_REVIEW_COPY.replyMax}" placeholder="${esc(PROVIDER_REVIEW_COPY.replyPlaceholder)}" required></textarea>
      </label>
      <p class="p24-review-form__error" data-review-error hidden></p>
      <div class="p24-review-form__actions">
        <button type="button" class="btn btn--secondary btn--sm" data-review-cancel>취소</button>
        <button type="submit" class="btn btn--primary btn--sm">${esc(PROVIDER_REVIEW_COPY.replySubmit)}</button>
      </div>
    </form>`;
  panel.querySelector('[data-review-cancel]')?.addEventListener('click', () => {
    panel.innerHTML = '';
  });
  panel.querySelector('form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = /** @type {HTMLFormElement} */ (e.target);
    const errEl = panel.querySelector('[data-review-error]');
    const body = String(form.body?.value || '').trim();
    if (!body) return;
    try {
      await createProviderReviewReply(reviewId, body, {
        role: viewer,
        userId: getAuthUser()?.user_id,
        isOwner,
      });
      await mountProviderReviewSection(host, providerType, providerId, item, viewer);
    } catch (err) {
      if (errEl) {
        errEl.hidden = false;
        errEl.textContent = err instanceof Error ? err.message : '답글 등록에 실패했습니다.';
      }
    }
  });
}

/** 상세 본문 뒤에 꽂을 placeholder */
export function reviewSectionPlaceholder() {
  return `<div class="p24-review-mount" data-provider-review-mount></div>`;
}

export function bindProviderReviewMount(wrap, kind, item, viewer) {
  if (kind !== 'study_room' && kind !== 'tutor') return;
  const mount = wrap.querySelector('[data-provider-review-mount]');
  if (!mount) return;
  const id = Number(item?.id || 0);
  if (!id) return;
  void mountProviderReviewSection(mount, kind, id, item, viewer);
}
