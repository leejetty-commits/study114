/** 결제 영수증/상세 골격 (인쇄용 HTML) */

import { formatKrw } from './runtime-config.js';
import { paymentMethodLabel, orderStatusLabel } from './history-mock.js';

/**
 * @param {import('./history-mock.js').HistoryRow} row
 */
export function renderReceiptPanel(row) {
  const paidAt = String(row.paidAt || '').slice(0, 19).replace('T', ' ');
  return `
    <aside class="plans-receipt" data-plans-receipt role="dialog" aria-label="결제 상세">
      <div class="plans-receipt__head">
        <h2 class="mypage-subhead">결제 상세 · 영수증</h2>
        <button type="button" class="btn btn--secondary btn--sm" data-plans-receipt-close>닫기</button>
      </div>
      <div class="plans-receipt__body" id="plans-receipt-print">
        <p class="plans-receipt__brand">우동공과 · study114</p>
        <dl class="plans-receipt__dl">
          <div><dt>주문번호</dt><dd><code>${esc(row.orderRef)}</code></dd></div>
          <div><dt>상품</dt><dd>${esc(row.productName)}</dd></div>
          <div><dt>적용 프로필</dt><dd>${esc(row.providerLabel)}</dd></div>
          <div><dt>결제금액</dt><dd>${formatKrw(row.amountKrw)}</dd></div>
          <div><dt>결제수단</dt><dd>${esc(paymentMethodLabel(row.paymentMethod))}</dd></div>
          <div><dt>결제일시</dt><dd>${esc(paidAt)}</dd></div>
          <div><dt>상태</dt><dd>${esc(orderStatusLabel(row.status))}</dd></div>
          ${row.startedAt ? `<div><dt>적용 시작</dt><dd>${esc(row.startedAt)}</dd></div>` : ''}
          ${row.endedAt ? `<div><dt>적용 종료</dt><dd>${esc(row.endedAt)}</dd></div>` : ''}
        </dl>
        <p class="mypage-muted plans-receipt__note">세금계산서·현금영수증 발행은 후속 연동 예정입니다. 본 화면은 주문 확인용 영수증 골격입니다.</p>
      </div>
      <div class="plans-receipt__actions">
        <button type="button" class="btn btn--primary btn--sm" data-plans-receipt-print>인쇄</button>
      </div>
    </aside>`;
}

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

/** @param {HTMLElement} root */
export function bindReceiptEvents(root) {
  root.querySelector('[data-plans-receipt-print]')?.addEventListener('click', () => {
    const body = root.querySelector('#plans-receipt-print');
    if (!body) return;
    const w = window.open('', '_blank', 'width=480,height=640');
    if (!w) return;
    w.document.write(`<!doctype html><html><head><title>영수증</title>
      <style>body{font-family:sans-serif;padding:1.5rem} dl{display:grid;gap:.5rem} dt{color:#64748b;font-size:.8rem} dd{margin:0;font-weight:600}</style>
      </head><body>${body.innerHTML}</body></html>`);
    w.document.close();
    w.focus();
    w.print();
  });
}
