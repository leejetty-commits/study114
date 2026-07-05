/**
 * 25장 §6 2차 — resume token · Entry Context Ribbon
 */

import { RESUME_ROUTE_LABELS, RESUME_ACTION_LABELS } from './handoff-copy.js';

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

/**
 * @param {string} [lastRoute]
 * @param {string} [lastAction]
 */
export function formatResumeToken(lastRoute, lastAction) {
  const route = RESUME_ROUTE_LABELS[/** @type {keyof typeof RESUME_ROUTE_LABELS} */ (lastRoute)] || lastRoute || '탐색에서';
  const action =
    RESUME_ACTION_LABELS[/** @type {keyof typeof RESUME_ACTION_LABELS} */ (lastAction)] || lastAction || '열람';
  return `${route} · ${action}`;
}

/**
 * @param {string} [lastRoute]
 * @param {string} [lastAction]
 */
export function renderResumeToken(lastRoute, lastAction) {
  if (!lastRoute && !lastAction) return '';
  return `<span class="handoff-resume-token">${esc(formatResumeToken(lastRoute, lastAction))}</span>`;
}

/** @param {string} [sourceRoute] */
export function renderEntryContextRibbon(sourceRoute) {
  if (!sourceRoute || sourceRoute === 'search') return '';
  const label = formatResumeToken(sourceRoute, 'view_detail');
  return `<p class="p24-entry-ribbon" role="note">${esc(label)}</p>`;
}
