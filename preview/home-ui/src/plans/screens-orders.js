/**
 * 상품센터 결제내역·체크아웃·결과. 바깥은 plans/screens.js만 부른다.
 */
import { s114Alert } from '../../../shared/confirm-dialog.js';
import { createPaidCheckout, fetchRefundEligibility, submitRefund, withdrawRefund } from '../paid-api.js';
import {
  getPlanRuntimeSettings,
  resolveCheckoutAmount,
  formatKrw,
  badgePriceKrw,
} from './runtime-config.js';
import { buildPlansHref, parsePlansQuery } from './router.js';
import { getPlansEffectiveRole } from './profiles.js';
import { setCheckoutDraft, getCheckoutDraft, getCheckoutResult } from './checkout-session.js';
import {
  getHistoryRows,
  loadHistoryRows,
  paymentMethodLabel,
  orderStatusLabel,
  invalidateHistoryCache,
} from './history-mock.js';
import { REFUND_REASON_CHOICES, REFUND_COPY, HISTORY_EMPTY_COPY } from '../mypage/mypage-copy.js';
import {
  MEMO_TICKET_REFUND_SHORT,
  POSITION_REFUND_SHORT,
  refundCheckoutNote,
  refundShort,
  refundDetail,
} from '../refund-policy-copy.js';
import { renderOrderSummaryBlock, buildPositionOrderRows } from './order-blocks.js';
import { sanitizeBadgeCodes, applyBadgeQuery, badgeDisplayName } from './badge-options.js';
import {
  esc,
  roleLabel,
  renderProfileBanner,
  tierPurchaseGate,
  applyTierOrderMissing,
} from './screens-status.js';

/** @type {{ rows: import('./history-mock.js').HistoryRow[], fromApi: boolean, loaded: boolean }} */
let historyCache = { rows: [], fromApi: false, loaded: false };


/** checkout 진입 시 서버 quote만 받고 권리는 선점하지 않는다. */
let checkoutQuoteKey = '';
let checkoutQuotePhase = 'idle';

function checkoutQuoteContext(draft) {
  return {
    providerType: draft.providerType,
    providerId: draft.providerId,
    badgeCodes: Array.isArray(draft.badgeCodes) ? draft.badgeCodes : [],
    regionBasisType: draft.regionBasisType,
    regionId: draft.regionId,
    complexId: draft.complexId,
    slotGroup: draft.slotGroup,
    regionLabel: draft.regionLabel,
    cityId: draft.cityId,
    primarySubjectId: draft.primarySubjectId,
  };
}

/** @param {() => void} rerender */
export function scheduleCheckoutServerQuote(rerender) {
  const draft = getCheckoutDraft();
  if (!draft) return;
  const isPosition = draft.productCode === 'prime' || draft.productCode === 'pick';
  if (!isPosition) return;
  const key = [
    draft.providerType,
    draft.providerId,
    draft.productCode,
    draft.apiVariant,
    (draft.badgeCodes || []).join(','),
    draft.cityId || '',
    draft.regionId || '',
    draft.complexId || '',
  ].join('|');
  if (checkoutQuoteKey === key && checkoutQuotePhase !== 'idle') return;
  checkoutQuoteKey = key;
  checkoutQuotePhase = 'loading';
  createPaidCheckout(draft.productCode, draft.apiVariant, checkoutQuoteContext(draft))
    .then((created) => {
      checkoutQuotePhase = 'ready';
      const cur = getCheckoutDraft();
      if (!cur) return;
      const snap = created.price_snapshot && typeof created.price_snapshot === 'object' ? created.price_snapshot : {};
      setCheckoutDraft({
        ...cur,
        orderRef: created.order_ref,
        serverAmountWon: Number(created.amount_won),
        serverBadgeSaleKrw: Number(created.badge_sale_krw || 0),
        serverPositionSaleKrw: Number(snap.position_sale_krw != null ? snap.position_sale_krw : created.amount_won),
        startedOn: created.started_on || '',
        endsOn: created.ends_on || '',
        cityId: created.city_id || cur.cityId,
        primarySubjectId: created.primary_subject_id || cur.primarySubjectId,
        memoBundle: created.memo_bundle != null ? Number(created.memo_bundle) : cur.memoBundle,
      });
      rerender();
    })
    .catch((err) => {
      checkoutQuoteKey = '';
      checkoutQuotePhase = 'idle';
      if (err && err.code === 'tier_fields_missing') {
        applyTierOrderMissing(
          draft.providerType,
          draft.providerId,
          draft.productCode,
          err.missing,
          err.tierMessage || '',
        );
        rerender();
      }
    });
}


/** 326→329 v3: 결제내역 탭(쪽지권/노출) 상태 */
let historyTab = 'count';

/** 329 v3: 현재 열린 셀 { orderRef, cell } | null */
let openCell = null;

/** @type {{ orderRef: string, data: object }|null} 환불 자격 캐시 */
let refundEligCache = null;

/** P18-05 결제내역 (329 v3: 행 기반 목록, 셀 분할 · 330 빈 상태) */
export function renderPlansHistory() {
  const role = getPlansEffectiveRole();
  if (role === 'parent' || role === 'guest') {
    return `
      <section class="mypage-panel">
        <p class="mypage-lead">구매이력</p>
        ${renderProfileBanner(null, role)}
      </section>`;
  }

  const rows = historyCache.loaded ? historyCache.rows : getHistoryRows();
  /* 330: 정상 fromApi 는 sourceNote 비노출. 「서버」「기기」「임시」 사용자 노출 금지 */
  let sourceNoteHtml = '';
  if (!historyCache.loaded) {
    sourceNoteHtml = `<p class="mypage-muted">${esc(HISTORY_EMPTY_COPY.loading)}</p>`;
  } else if (!historyCache.fromApi) {
    sourceNoteHtml = `<p class="mypage-muted">${esc(HISTORY_EMPTY_COPY.loadPartialFail)}</p>`;
  }

  const countRows = rows.filter((r) => isCountProduct(r));
  const positionRows = rows.filter((r) => !isCountProduct(r));
  const activeRows = historyTab === 'count' ? countRows : positionRows;

  let listHtml;
  if (!historyCache.loaded) {
    listHtml = `<p class="mypage-muted">${esc(HISTORY_EMPTY_COPY.loading)}</p>`;
  } else if (activeRows.length) {
    listHtml = activeRows.map((r) => renderHistV3Row(r)).join('');
  } else {
    listHtml = renderHistEmpty(historyTab);
  }

  return `
    <section class="mypage-panel">
      <p class="mypage-lead">구매이력</p>
      ${sourceNoteHtml}
      <div class="plans-hist-tabs" role="tablist">
        <button type="button" role="tab" class="plans-tab${historyTab === 'count' ? ' is-active' : ''}" data-history-tab="count" aria-selected="${historyTab === 'count'}">쪽지권</button>
        <button type="button" role="tab" class="plans-tab${historyTab === 'position' ? ' is-active' : ''}" data-history-tab="position" aria-selected="${historyTab === 'position'}">노출상품</button>
      </div>
      <div class="plans-history-layout" role="tabpanel">
        ${listHtml}
      </div>
    </section>`;
}

/** 330: 탭별 빈 상태 — 예시 1행 + 안내 */
function renderHistEmpty(tab) {
  return `${renderHistExampleRow(tab)}${renderHistEmptyGuide(tab)}`;
}

/** 330: 흐린 예시 행 (클릭·환불 이벤트 속성 없음) */
function renderHistExampleRow(tab) {
  const pack = tab === 'position' ? HISTORY_EMPTY_COPY.position : HISTORY_EMPTY_COPY.count;
  const disabledActs = ['내역', '환불', '진행상황', '종료', '소멸']
    .map((label) => `<button type="button" disabled tabindex="-1">${esc(label)}</button>`)
    .join('');
  return `
    <div class="plans-hist-example-wrap">
      <span class="plans-hist-row__example-badge">${esc(HISTORY_EMPTY_COPY.exampleBadge)}</span>
      <div class="plans-hist-row plans-hist-row--example" aria-label="${esc(HISTORY_EMPTY_COPY.exampleAria)}">
        <div class="plans-hist-row__bar">
          <div class="plans-hist-row__info">
            <span class="plans-hist-row__name">${esc(pack.productName)}</span><span class="plans-hist-row__meta plans-hist-row__meta--placeholder">${esc(pack.amount)} · ${esc(pack.date)}</span>
          </div>
          <div class="plans-hist-row__acts">
            ${disabledActs}
          </div>
        </div>
      </div>
    </div>`;
}

/** 330: 빈 상태 안내 + CTA */
function renderHistEmptyGuide(tab) {
  const pack = tab === 'position' ? HISTORY_EMPTY_COPY.position : HISTORY_EMPTY_COPY.count;
  return `
    <div class="plans-hist-empty">
      <p class="plans-hist-empty__title">${esc(HISTORY_EMPTY_COPY.title)}</p>
      <p class="plans-hist-empty__body">${esc(pack.body)}</p>
      <a href="${esc(pack.href)}" class="btn btn--primary" data-plans-nav="${esc(pack.nav)}">${esc(pack.cta)}</a>
    </div>`;
}

/** @param {object} r */
function isCountProduct(r) {
  const kind = r.productKind || r.product_kind || '';
  const name = (typeof r.productName === 'string' ? r.productName : '') || '';
  return kind === 'count' || /쪽지/.test(name);
}

/* ── 329 v3 행 렌더 ── */

/**
 * 행 상태 결정: 어떤 셀이 활성(클릭 가능)인지
 * @param {object} r order row
 * @returns {{ detail:boolean, refund:boolean, progress:boolean, ended:boolean, expired:boolean, statusBadge:string, statusClass:string }}
 */
function resolveV3Cells(r) {
  const status = r.status || '';
  const kind = r.productKind || r.product_kind || '';
  const isFromApi = r.source === 'api';
  const remaining = typeof r.remaining === 'number' ? r.remaining : null;
  const refundStatus = r.refundStatus || r.refund_status || '';
  const hasRefundRequest = status === 'refund_requested' || refundStatus === 'requested' || refundStatus === 'approved';
  /* PG HOLD(301): refunded 상태는 아직 UI에 노출하지 않는다 */
  const isRefundRejected = refundStatus === 'rejected';
  const isWithdrawn = refundStatus === 'cancelled';
  const isPaid = status === 'paid';
  const isExpired = status === 'expired' || !!r.expired;
  const isEnded = remaining === 0 && !isExpired && !hasRefundRequest;

  const canRefund = isFromApi && kind !== 'badge_addon'
    && (isPaid || status === 'refund_requested')
    && !isWithdrawn;

  let statusBadge = '';
  let statusClass = '';
  if (hasRefundRequest) {
    statusBadge = '환불 검토 중';
    statusClass = 'plans-hist-row__st--ing';
  } else if (isRefundRejected) {
    statusBadge = '환불 반려';
    statusClass = 'plans-hist-row__st--no';
  }

  return {
    detail: isFromApi,
    refund: canRefund && !hasRefundRequest,
    progress: hasRefundRequest || isRefundRejected,
    ended: isEnded,
    expired: isExpired,
    statusBadge,
    statusClass,
  };
}

/** v3 행 하나 렌더 */
function renderHistV3Row(r) {
  const ref = r.orderRef || '';
  const cells = resolveV3Cells(r);
  const isOpen = openCell?.orderRef === ref;
  const curCell = isOpen ? openCell.cell : '';
  const isRefundActive = cells.refund || cells.progress;

  const nameText = esc(typeof r.productName === 'string' ? r.productName : String(r.productName || ''));
  const amountText = formatKrw(r.amountKrw);
  const dateText = esc(String(r.paidAt || '').slice(0, 10));
  const remainingText = typeof r.remaining === 'number' ? ` · 남은 ${r.remaining}` : '';
  const metaText = `${amountText} · ${dateText}${remainingText}`;

  const badgeHtml = cells.statusBadge
    ? `<span class="plans-hist-row__st ${cells.statusClass}">${esc(cells.statusBadge)}</span>`
    : '';

  const cellBtn = (name, enabled, isPrimary) => {
    if (!enabled) return `<button type="button" disabled>${esc(name)}</button>`;
    const cls = [
      curCell === name ? 'is-cell-active' : '',
      isPrimary ? 'is-primary' : '',
    ].filter(Boolean).join(' ');
    return `<button type="button" class="${cls}" data-v3-cell="${esc(name)}" data-v3-ref="${esc(ref)}">${esc(name)}</button>`;
  };

  const panelHtml = isOpen ? renderV3Panel(r, curCell) : '';

  return `
    <div class="plans-hist-row${isOpen ? ' is-open' : ''}${isRefundActive ? ' is-refund-active' : ''}" data-v3-row="${esc(ref)}">
      <div class="plans-hist-row__bar">
        <div class="plans-hist-row__info">
          <span class="plans-hist-row__name">${nameText}</span>${badgeHtml}<span class="plans-hist-row__meta">${metaText}</span>
        </div>
        <div class="plans-hist-row__acts">
          ${cellBtn('내역', cells.detail, false)}
          ${cellBtn('환불', cells.refund, true)}
          ${cellBtn('진행상황', cells.progress, false)}
          ${cellBtn('종료', cells.ended, false)}
          ${cellBtn('소멸', cells.expired, false)}
        </div>
      </div>
      <div class="plans-hist-row__panel">${panelHtml}</div>
    </div>`;
}

/**
 * v3 패널 내용 (셀별)
 * @param {object} r
 * @param {string} cell  '내역'|'환불'|'진행상황'|'종료'|'소멸'
 */
function renderV3Panel(r, cell) {
  const ref = r.orderRef || '';

  if (cell === '내역') return renderV3DetailPanel(r);
  if (cell === '환불') return renderV3RefundPanel(r);
  if (cell === '진행상황') return renderV3ProgressPanel(r);
  if (cell === '종료') return renderV3EndedPanel(r);
  if (cell === '소멸') return renderV3ExpiredPanel(r);
  return '';
}

function renderV3DetailPanel(r) {
  const name = esc(typeof r.productName === 'string' ? r.productName : String(r.productName || ''));
  const amount = formatKrw(r.amountKrw);
  const dateText = esc(String(r.paidAt || '').slice(0, 10));
  const remaining = typeof r.remaining === 'number' ? r.remaining : '—';
  const used = typeof r.usedCount === 'number' ? r.usedCount : (typeof r.used_count === 'number' ? r.used_count : '—');

  return `<div class="plans-hist-row__panel-inner">
    <b>구성</b>
    <table>
      <tr><td>${name}</td><td>${amount}</td></tr>
      <tr><td>결제일</td><td>${dateText}</td></tr>
      ${typeof r.remaining === 'number' ? `<tr><td>사용</td><td>${used}회 / 남은 ${remaining}회</td></tr>` : ''}
    </table>
  </div>`;
}

function renderV3RefundPanel(r) {
  const elig = refundEligCache?.orderRef === r.orderRef ? refundEligCache.data : null;
  const kind = r.productKind || r.product_kind || '';

  if (!elig) {
    return `<div class="plans-hist-row__panel-inner"><p>환불 가능 여부를 확인하는 중…</p></div>`;
  }

  if (!elig.eligible) {
    return `<div class="plans-hist-row__panel-inner"><p>${esc(elig.message || REFUND_COPY.notEligible)}</p></div>`;
  }

  const breakdownHtml = Array.isArray(elig.breakdown) && elig.breakdown.length
    ? `<ul class="refund-breakdown">${elig.breakdown.map((b) => `<li>${esc(b.label)}: ${formatKrw(b.refund_won)}${b.amount_won ? ` (결제 ${formatKrw(b.amount_won)})` : ''}</li>`).join('')}</ul>`
    : '';
  const usedInfo = typeof elig.used_count === 'number' && elig.used_count > 0
    ? ` (사용 ${elig.used_count}회)`
    : '';

  const family = kind === 'position' ? 'position' : 'access';
  const policyShort = refundShort(family);
  const policyDetail = refundDetail(family);

  return `<div class="plans-hist-row__panel-inner">
    <b>환불 가능</b>
    <div class="refund-formula">환불 예정액: <strong>${formatKrw(elig.refund_won)}</strong>${usedInfo}</div>
    ${breakdownHtml}
    <p class="mypage-muted"><strong>${esc(policyShort)}</strong></p>
    <details class="plans-policy-acc">
      <summary>환불 규정 자세히</summary>
      <p class="mypage-muted">${esc(policyDetail)}</p>
    </details>
    <label class="refund-action-box__label">사유 선택
      <select data-refund-reason-select>
        ${REFUND_REASON_CHOICES.map((c) => `<option value="${esc(c.value)}">${esc(c.label)}</option>`).join('')}
      </select>
    </label>
    <label class="refund-action-box__label">상세 (선택)
      <input type="text" data-refund-detail maxlength="200" placeholder="추가 사유가 있으면 입력" />
    </label>
    <button type="button" class="btn btn--primary btn--sm" data-refund-submit="${esc(r.orderRef)}">환불 신청</button>
  </div>`;
}

function renderV3ProgressPanel(r) {
  const refundStatus = r.refundStatus || r.refund_status || '';
  const kind = r.productKind || r.product_kind || '';
  const status = r.status || '';

  if (status === 'refund_requested' || refundStatus === 'requested' || refundStatus === 'approved') {
    const frozenMsg = kind === 'position' ? REFUND_COPY.positionFrozenNote : REFUND_COPY.frozenNote;
    const withdrawNote = kind === 'position' ? REFUND_COPY.positionWithdrawNote : '';
    const stepsHtml = renderProgressSteps(refundStatus || 'requested');
    return `<div class="plans-hist-row__panel-inner">
      ${stepsHtml}
      <p>${esc(frozenMsg)}</p>
      ${withdrawNote ? `<p class="mypage-muted">${esc(withdrawNote)}</p>` : ''}
      <label class="refund-action-box__label">${esc(REFUND_COPY.withdrawConfirmLabel)}
        <input type="text" data-refund-withdraw-confirm maxlength="10" placeholder="${esc(REFUND_COPY.withdrawConfirmPlaceholder)}" autocomplete="off" />
      </label>
      <button type="button" class="btn btn--secondary btn--sm" data-refund-withdraw="${esc(r.orderRef)}">환불 철회</button>
    </div>`;
  }

  /* PG HOLD(301): refunded 패널은 PG 실환불 해제 전까지 표시하지 않는다 */

  if (refundStatus === 'rejected') {
    return `<div class="plans-hist-row__panel-inner">
      ${renderProgressSteps('rejected')}
      <p class="mypage-muted">${esc(r.refundRejectReason || '환불이 반려되었습니다.')}</p>
    </div>`;
  }

  return `<div class="plans-hist-row__panel-inner"><p class="mypage-muted">진행 정보가 없습니다.</p></div>`;
}

function renderProgressSteps(refundStatus) {
  /* PG HOLD(301): 승인 단계까지만 표시 (실환불 UI는 이후 tip) */
  const steps = [
    { label: '신청', key: 'requested' },
    { label: '검토 중', key: 'reviewing' },
    { label: '승인', key: 'approved' },
  ];
  const isRejected = refundStatus === 'rejected';
  const doneKeys = isRejected
    ? ['requested', 'reviewing']
    : refundStatus === 'approved'
      ? ['requested', 'reviewing', 'approved']
      : ['requested'];
  const curKey = isRejected ? null : (refundStatus === 'requested' ? 'reviewing' : null);

  let html = '<div class="plans-hist-steps">';
  for (const s of steps) {
    const isDone = doneKeys.includes(s.key);
    const isCur = s.key === curKey;
    const cls = isDone ? 'is-done' : isCur ? 'is-current' : '';
    html += `<div class="${cls}">${esc(s.label)}</div>`;
  }
  if (isRejected) {
    html += `<div class="is-rejected">반려</div>`;
  }
  html += '</div>';
  return html;
}

function renderV3EndedPanel(r) {
  const name = esc(typeof r.productName === 'string' ? r.productName : String(r.productName || ''));
  const amount = formatKrw(r.amountKrw);
  return `<div class="plans-hist-row__panel-inner">
    <b>구성</b>
    <table><tr><td>${name}</td><td>${amount}</td></tr></table>
    <div class="refund-formula">남은 0회 → 종료</div>
  </div>`;
}

function renderV3ExpiredPanel(r) {
  const name = esc(typeof r.productName === 'string' ? r.productName : String(r.productName || ''));
  const dateText = esc(r.expiredAt || r.expired_at || '');
  const remaining = typeof r.remaining === 'number' ? r.remaining : 0;
  return `<div class="plans-hist-row__panel-inner">
    <table><tr><td>만료</td><td>${dateText ? `${dateText} · 유효기간 경과` : '유효기간 경과'}</td></tr></table>
    <div class="refund-formula">남은 ${remaining}회 → 소멸 (환불 대상 아님)</div>
  </div>`;
}

/** P18-06 checkout */
export function renderPlansCheckout() {
  const draft = getCheckoutDraft();
  const role = getPlansEffectiveRole();
  if (!draft) {
    return `
      <section class="mypage-panel">
        <div class="mypage-info-box is-warn">
          <p>결제할 상품이 없습니다. 노출상품에서 다시 선택해 주세요.</p>
          <a href="#/plans/positions" class="btn btn--primary" data-plans-nav="/plans/positions">노출상품으로</a>
        </div>
      </section>`;
  }

  if (role !== 'study_room' && role !== 'tutor') {
    return `
      <section class="mypage-panel">
        ${renderProfileBanner(null, role)}
      </section>`;
  }

  const amt = resolveCheckoutAmount(draft.priceKrw);
  const methods = getPlanRuntimeSettings().payment_methods;
  const isPosition = draft.productCode === 'prime' || draft.productCode === 'pick';
  const badgeCodes = isPosition ? sanitizeBadgeCodes(draft.providerType, draft.badgeCodes || []) : [];
  const badgeLines = badgeCodes.map((code) => {
    const price = badgePriceKrw(draft.providerType, undefined, code, draft.optionLabel || draft.apiVariant);
    return {
      label: badgeDisplayName(code),
      value: price != null ? formatKrw(price) : '—',
      priceKrw: price || 0,
    };
  });
  const badgeSum = badgeLines.reduce((n, b) => n + (b.priceKrw || 0), 0);
  const positionDisplay =
    draft.serverPositionSaleKrw != null ? Number(draft.serverPositionSaleKrw) : amt.displayKrw;
  const badgeDisplay =
    draft.serverBadgeSaleKrw != null ? Number(draft.serverBadgeSaleKrw) : badgeSum;
  const previewTotal =
    draft.serverAmountWon != null ? Number(draft.serverAmountWon) : positionDisplay + badgeDisplay;
  const periodRangeText =
    draft.startedOn && draft.endsOn
      ? `${draft.startedOn} ~ ${draft.endsOn}`
      : '결제 완료 시점부터';
  const checkoutRows = isPosition
    ? buildPositionOrderRows({
        profileLabel: draft.providerLabel,
        roleText: roleLabel(draft.providerType),
        productName: draft.productName,
        regionValue: draft.regionLabel || (draft.providerType === 'tutor' ? '시·주력과목' : '—'),
        periodLabel: draft.optionLabel || draft.apiVariant,
        periodRangeText,
        listPriceText:
          Number(draft.discountKrw) > 0 && Number(draft.listPriceKrw) > 0 ? formatKrw(draft.listPriceKrw) : '',
        positionPriceText: formatKrw(positionDisplay),
        discountText: draft.discountLabel || '',
        memoBundleText: Number(draft.memoBundle) > 0 ? `쪽지권 ${draft.memoBundle}회 포함` : '',
        badgeLines,
        badgeSumText: formatKrw(badgeDisplay),
      })
    : [
        { label: '상품', value: `${draft.productName} · ${draft.optionLabel}` },
        { label: '표시가', value: formatKrw(amt.displayKrw) },
        { label: '자동연장', value: '없음' },
      ];
  const tierGate = isPosition
    ? tierPurchaseGate(draft.providerType, draft.providerId, draft.productCode)
    : null;
  const tierBlocked = Boolean(tierGate?.blocked);
  const cancelHref = isPosition
    ? buildPlansHref(
        '/plans/positions',
        applyBadgeQuery(
          {
            product: draft.productCode,
            option: draft.optionId,
            badges: (draft.badgeCodes || []).join(','),
            city_id: draft.cityId ? String(draft.cityId) : '',
          },
          draft.providerType,
        ),
      )
    : buildPlansHref('/plans/access', { option: draft.optionId });

  return `
    <section class="mypage-panel plans-checkout">
      ${renderOrderSummaryBlock({
        family: isPosition ? 'position' : 'access',
        rows: checkoutRows,
        totalLabel: '예상 결제 금액',
        totalValue: formatKrw(previewTotal),
        showCta: false,
        note: refundCheckoutNote(isPosition ? 'position' : 'access'),
      })}
      <ol class="plans-checkout-steps">
        <li class="is-done"><strong>1. 적용 프로필</strong>
          <p>${esc(draft.providerLabel)} · ${esc(roleLabel(draft.providerType))}</p>
        </li>
        <li class="is-done"><strong>2. 상품 옵션</strong>
          <p>${esc(draft.productName)} · ${esc(draft.optionLabel)}</p>
        </li>
        ${
          draft.apiVariant === '1회'
            ? `<li class="is-done"><strong>즉시 발송</strong>
          <p class="mypage-muted">1회 즉시권은 수신 학생과 첫 쪽지 본문이 필요합니다. 대상이 없으면 구매할 수 없습니다.</p>
          <label class="plans-card__pick"><span class="plans-card__pick-label">학생 ID</span>
            <input type="number" data-plans-immediate-student min="1" value="${esc(String(draft.studentId || ''))}" class="student-form__select" /></label>
          <label class="plans-card__pick"><span class="plans-card__pick-label">첫 쪽지</span>
            <textarea data-plans-immediate-body class="student-form__select" rows="3">${esc(draft.body || '')}</textarea></label>
        </li>`
            : ''
        }
        <li class="is-done"><strong>3. 금액 확인</strong>
          <p>표시가 ${formatKrw(previewTotal)}
            ${isPosition && badgeDisplay ? ` · 노출 ${formatKrw(positionDisplay)} · 배지 소계 ${formatKrw(badgeDisplay)}` : ''}
            ${amt.testMode ? ` · <em>테스트 모드</em>` : ''}</p>
        </li>
        <li>
          <strong>4. 약관 동의</strong>
          <label class="plans-check">
            <input type="checkbox" data-plans-agree />
            <span>유료상품 이용약관 및 환불 안내를 확인했습니다.</span>
          </label>
        </li>
        <li>
          <strong>5. 결제수단</strong>
          <div class="plans-pay-methods">
            ${(methods || [])
              .map(
                (m, i) => `
              <label class="plans-check">
                <input type="radio" name="plans_pay_method" value="${esc(m)}" ${i === 0 ? 'checked' : ''} />
                <span>${esc(paymentMethodLabel(m))}</span>
              </label>`,
              )
              .join('')}
          </div>
        </li>
        <li>
          <strong>6. 결제 진행</strong>
          <div class="mypage-actions-row">
            <button type="button" class="btn btn--primary" data-plans-pay ${tierBlocked ? 'disabled' : ''}>결제하기</button>
            <a href="${esc(cancelHref)}" class="btn btn--secondary" data-plans-nav="${isPosition ? '/plans/positions' : '/plans/access'}">취소</a>
          </div>
          <p class="plans-checkout-error mypage-muted" data-plans-checkout-error ${tierBlocked ? '' : 'hidden'}>${tierBlocked ? esc(tierGate.reason) : ''}</p>
          ${tierGate?.phase === 'error' ? `<button type="button" class="btn btn--secondary" data-plans-tier-retry>다시 시도</button>` : ''}
        </li>
      </ol>
    </section>`;
}

/** P18-07 result */
export function renderPlansResult() {
  const result = getCheckoutResult();
  if (!result) {
    return `
      <section class="mypage-panel">
        <div class="mypage-info-box">
          <p>표시할 결과가 없습니다.</p>
          <a href="#/plans" class="btn btn--secondary" data-plans-nav="/plans">상품홈</a>
        </div>
      </section>`;
  }

  if (result.status === 'unavailable') {
    return `
      <section class="mypage-panel">
        <p class="mypage-lead">결제 안내</p>
        <div class="mypage-info-box">
          <p>결제를 진행할 수 없습니다. 잠시 후 다시 시도해 주세요.</p>
        </div>
        <div class="mypage-actions-row">
          <a href="#/plans" class="btn btn--secondary" data-plans-nav="/plans">유료상품으로 돌아가기</a>
        </div>
      </section>`;
  }

  const ok = result.status === 'success';
  const backOp =
    result.providerType === 'tutor'
      ? `#/mypage/registrations/tutors/${result.providerId || ''}/exposure`
      : `#/mypage/registrations/study-rooms/${result.providerId || ''}/inquiries`;
  const resultBadges = sanitizeBadgeCodes(result.providerType || '', result.badgeCodes || []);
  const resultBadgeLines = resultBadges.length
    ? resultBadges
        .map((code) => `<p>홍보 배지 · ${esc(badgeDisplayName(code))}</p>`)
        .join('')
    : '<p>홍보 배지 없음</p>';

  return `
    <section class="mypage-panel">
      <div class="mypage-info-box ${ok ? '' : 'is-warn'}">
        <p><strong>${esc(orderStatusLabel(result.status === 'success' ? 'paid' : result.status))}</strong></p>
        ${result.orderRef ? `<p>주문번호 <code>${esc(result.orderRef)}</code></p>` : ''}
        ${result.productName ? `<p>${esc(result.productName)}${result.optionLabel ? ` · ${esc(result.optionLabel)}` : ''}</p>` : ''}
        ${result.providerLabel ? `<p>적용 프로필: ${esc(result.providerLabel)}</p>` : ''}
        ${result.regionLabel ? `<p>적용 지역: ${esc(result.regionLabel)}</p>` : ''}
        ${result.startedOn || result.endsOn ? `<p>이용 기간 ${esc(result.startedOn || '—')} ~ ${esc(result.endsOn || '—')}</p>` : ''}
        ${resultBadgeLines}
        ${result.badgeSaleKrw != null && resultBadges.length ? `<p>배지 소계 ${formatKrw(result.badgeSaleKrw)}</p>` : ''}
        ${result.chargeKrw != null ? `<p>결제금액 ${formatKrw(result.chargeKrw)}</p>` : ''}
        <p>${esc(
          result.startedOn || result.endsOn || (result.badgeCodes && result.badgeCodes.length)
            ? POSITION_REFUND_SHORT
            : MEMO_TICKET_REFUND_SHORT,
        )}</p>
        ${result.memoBundleGranted > 0 ? `<p>노출상품 무료 쪽지 ${result.memoBundleGranted}회 — 본상품과 같은 기간이며 종료 시 함께 종료됩니다.</p>` : ''}
        ${result.message ? `<p class="mypage-muted">${esc(result.message)}</p>` : ''}
      </div>
      <div class="mypage-actions-row">
        <a href="#/mypage/plans" class="btn btn--primary" data-nav="/mypage/plans">구매이력 보기</a>
        ${ok ? `<a href="${backOp}" class="btn btn--secondary" data-nav="${backOp.slice(1)}">운영 화면으로</a>` : ''}
        ${!ok ? `<a href="#/plans/checkout" class="btn btn--secondary" data-plans-nav="/plans/checkout">다시 결제</a>` : ''}
        <a href="#/plans" class="btn btn--secondary" data-plans-nav="/plans">상품센터</a>
      </div>
    </section>`;
}

export function markHistoryCacheStale() {
  historyCache.loaded = false;
}

/** 구매이력 탭·셀·환불 이벤트. bindPlansScreenEvents가 그대로 부른다. */
export function bindPlansHistoryEvents(root, rerender, path) {
  /* 329 v3: 구매이력 히스토리 로딩 (#/mypage/plans 본화면에서도) */
  if ((path === '/mypage/plans' || path === '/plans/history' || path.endsWith('/history')) && !historyCache.loaded) {
    loadHistoryRows().then((result) => {
      historyCache = { rows: result.rows, fromApi: result.fromApi, loaded: true };
      rerender();
    });
  }

  /* 329 v3: 탭 전환 (쪽지권/노출상품) */
  root.querySelectorAll('[data-history-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      historyTab = btn.getAttribute('data-history-tab') || 'count';
      openCell = null;
      refundEligCache = null;
      rerender();
    });
  });

  /* 329 v3: 셀 토글 */
  root.querySelectorAll('[data-v3-cell]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const ref = btn.getAttribute('data-v3-ref') || '';
      const cell = btn.getAttribute('data-v3-cell') || '';
      const same = openCell?.orderRef === ref && openCell?.cell === cell;
      if (same) {
        openCell = null;
        refundEligCache = null;
        rerender();
        return;
      }
      openCell = { orderRef: ref, cell };
      if (cell !== '환불') {
        refundEligCache = null;
      }
      rerender();
      if (cell === '환불' && ref) {
        fetchRefundEligibility(ref)
          .then((data) => {
            refundEligCache = { orderRef: ref, data };
            if (openCell?.orderRef === ref && openCell?.cell === '환불') rerender();
          })
          .catch(() => {
            refundEligCache = { orderRef: ref, data: { eligible: false, message: '확인에 실패했습니다.' } };
            if (openCell?.orderRef === ref && openCell?.cell === '환불') rerender();
          });
      }
    });
  });

  /* 329 v3: 환불 신청 (326 로직 유지) */
  root.querySelectorAll('[data-refund-submit]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const ref = btn.getAttribute('data-refund-submit');
      if (!ref) return;
      const panel = btn.closest('.plans-hist-row__panel-inner');
      const reasonChoice = panel?.querySelector('[data-refund-reason-select]')?.value || '';
      const detail = panel?.querySelector('[data-refund-detail]')?.value || '';
      const kind = btn.closest('.plans-hist-row')?.getAttribute('data-v3-row') || '';
      if (!confirm(REFUND_COPY.confirmSubmit)) return;
      try {
        await submitRefund(ref, { reason_choice: reasonChoice, detail });
        void s114Alert(REFUND_COPY.submitSuccess);
        historyCache.loaded = false;
        openCell = null;
        refundEligCache = null;
        invalidateHistoryCache();
        rerender();
        loadHistoryRows().then((result) => {
          historyCache = { rows: result.rows, fromApi: result.fromApi, loaded: true };
          rerender();
        });
      } catch (err) {
        void s114Alert(err?.message || '환불 신청에 실패했습니다.');
      }
    });
  });

  /* 329 v3: 환불 철회 (326b 본인확인 유지) */
  root.querySelectorAll('[data-refund-withdraw]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const ref = btn.getAttribute('data-refund-withdraw');
      if (!ref) return;
      const panel = btn.closest('.plans-hist-row__panel-inner');
      const confirmInput = panel?.querySelector('[data-refund-withdraw-confirm]');
      const confirmText = confirmInput?.value?.trim() || '';
      if (confirmText !== REFUND_COPY.withdrawConfirmText) {
        void s114Alert(`「${REFUND_COPY.withdrawConfirmText}」을(를) 정확히 입력해 주세요.`);
        return;
      }
      if (!confirm(REFUND_COPY.confirmWithdraw)) return;
      try {
        await withdrawRefund(ref, confirmText);
        void s114Alert(REFUND_COPY.withdrawSuccess);
        historyCache.loaded = false;
        openCell = null;
        refundEligCache = null;
        invalidateHistoryCache();
        rerender();
        loadHistoryRows().then((result) => {
          historyCache = { rows: result.rows, fromApi: result.fromApi, loaded: true };
          rerender();
        });
      } catch (err) {
        void s114Alert(err?.message || '환불 철회에 실패했습니다.');
      }
    });
  });
}
