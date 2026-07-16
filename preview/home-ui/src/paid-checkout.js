/**
 * 18d — dev mock PG 결제 플로우
 * 표준 구매는 #/plans/checkout — 이 모듈은 레거시 카탈로그 버튼 호환용
 */

import { createPaidCheckout, completePaidCheckout } from './paid-api.js';
import { hydrateProviderStatus } from './provider-status.js';
import { hydrateProviderNotices } from './provider-notices.js';
import { getProductConfig } from './plans/runtime-config.js';

/**
 * @param {string} productId
 * @param {string} variantLabel
 */
function resolveApiVariant(productId, variantLabel) {
  const cfg = getProductConfig(productId);
  const opt = cfg?.options?.find((o) => o.label === variantLabel || o.apiVariant === variantLabel);
  return opt?.apiVariant || variantLabel;
}

/**
 * @param {string} productId
 * @param {string} variant
 * @param {string} label
 */
export async function runDevCheckout(productId, variant, label) {
  const apiVariant = resolveApiVariant(productId, variant);
  const summary = `${label} · ${variant} → ${apiVariant} (dev PG)`;
  const ok = window.confirm(`${summary}\n\n더미 결제를 진행할까요?`);
  if (!ok) return { cancelled: true };

  const created = await createPaidCheckout(productId, apiVariant);
  const completed = await completePaidCheckout(created.order_ref);

  await hydrateProviderStatus();
  await hydrateProviderNotices();

  return { cancelled: false, order: completed };
}

/** @param {HTMLElement} root @param {() => void} [rerender] */
export function bindPaidCatalogEvents(root, rerender) {
  root.querySelectorAll('[data-paid-buy]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const productId = btn.getAttribute('data-product-id') || '';
      const itemEl = btn.closest('.plans-catalog__item');
      const select = itemEl?.querySelector('[data-paid-variant]');
      const variant = select instanceof HTMLSelectElement ? select.value : '';
      const label = btn.getAttribute('data-product-label') || productId;
      if (!productId || !variant) return;

      btn.disabled = true;
      try {
        const result = await runDevCheckout(productId, variant, label);
        if (!result.cancelled) {
          alert('결제가 완료되었습니다. (dev mock PG)');
          rerender?.();
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : '결제에 실패했습니다.';
        alert(msg);
      } finally {
        btn.disabled = false;
      }
    });
  });
}
