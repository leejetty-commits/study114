/**
 * 로그인 후 pending deep intent 1회 복원.
 * 실패해도 재저장하지 않는다.
 */

import { parseHashQuery } from '../../shared/preview-links.js';
import {
  consumePendingDeepIntent,
  parseResumeIntentParam,
  peekPendingDeepIntent,
} from '../../shared/pending-deep-intent.js';
import { isLoggedIn } from './auth-session.js';
import { getNavRole } from './state.js';
import { openDetailDecision, resolveDetailItem } from './detail-decision/index.js';
import { openReviewSheet } from './provider-reviews/sheet.js';
import { openCompareModal } from './compare-modal.js';
import { getCompareItems, isInCompare, isWishlisted, toggleCompare, toggleWishlist } from './user-actions-state.js';
import { startFirstMemoFlow } from './messages/compose-flow.js';
import { openPublicMyshop } from './myshop/navigate.js';
import { showP24Toast } from './detail-decision/detail-utils.js';
import { closeDeepAccessLoginGate } from '../../shared/guest-gate-ui.js';

let resumeAttempted = false;

function stripResumeIntentFromHash() {
  const hash = window.location.hash.slice(1);
  const qIdx = hash.indexOf('?');
  if (qIdx === -1) return;
  const path = hash.slice(0, qIdx);
  const params = new URLSearchParams(hash.slice(qIdx + 1));
  if (!params.has('resume_intent')) return;
  params.delete('resume_intent');
  const next = params.toString() ? `${path}?${params}` : path;
  const url = `${window.location.pathname}${window.location.search}#${next}`;
  history.replaceState(null, '', url);
}

function takeIntent() {
  const fromQuery = parseResumeIntentParam(parseHashQuery().resume_intent || '');
  stripResumeIntentFromHash();
  const fromStore = consumePendingDeepIntent();
  return fromQuery || fromStore;
}

function targetName(providerType, providerId) {
  const item = resolveDetailItem(providerType, providerId);
  if (!item) return providerType === 'tutor' ? '과외쌤' : '공부방';
  return item.tutor_display_name || item.study_room_name || (providerType === 'tutor' ? '과외쌤' : '공부방');
}

/**
 * @returns {boolean} 복귀를 시도했으면 true (성공/실패 무관, 재시도 없음)
 */
export function hasPendingDeepIntent() {
  return Boolean(parseHashQuery().resume_intent || peekPendingDeepIntent());
}

export function resumePendingDeepIntent() {
  if (resumeAttempted || !isLoggedIn()) return false;
  resumeAttempted = true;
  closeDeepAccessLoginGate();

  const intent = takeIntent();
  if (!intent) return false;

  const { source, providerType, providerId } = intent;
  const idOk = providerType && providerId > 0;

  try {
    if (source === 'review_sheet' && idOk) {
      showP24Toast('보려던 정보로 이어서 보여드릴게요');
      void openReviewSheet({
        providerType,
        providerId,
        view: intent.extra?.view === 'write' ? 'write' : 'consume',
      });
      return true;
    }
    if (source === 'public_myshop' && idOk) {
      showP24Toast('보려던 정보로 이어서 보여드릴게요');
      if (providerType === 'study_room') {
        openPublicMyshop({
          studyRoomId: providerId,
          sourceRoute: 'resume',
          viewerRole: getNavRole(),
        });
      } else {
        openDetailDecision({ kind: providerType, id: providerId, sourceRoute: 'resume' });
      }
      return true;
    }
    if (source === 'compare') {
      if (idOk) {
        const item = resolveDetailItem(providerType, providerId);
        if (!item) return false;
        if (!isInCompare(providerType, providerId)) {
          const result = toggleCompare(providerType, providerId);
          if (!result?.inCompare) return false;
        }
      }
      const items = providerType ? getCompareItems(providerType) : [];
      if (!items.length) return false;
      showP24Toast('보려던 정보로 이어서 보여드릴게요');
      openCompareModal(providerType, items);
      return true;
    }
    if (source === 'wishlist' && idOk) {
      const item = resolveDetailItem(providerType, providerId);
      if (!item) return false;
      if (!isWishlisted(providerType, providerId)) toggleWishlist(providerType, providerId);
      showP24Toast('보려던 정보로 이어서 보여드릴게요');
      openDetailDecision({ kind: providerType, id: providerId, sourceRoute: 'resume' });
      return true;
    }
    if (source === 'message' && idOk) {
      const item = resolveDetailItem(providerType, providerId);
      if (!item) return false;
      showP24Toast('보려던 정보로 이어서 보여드릴게요');
      startFirstMemoFlow({
        kind: providerType,
        targetId: providerId,
        targetName: targetName(providerType, providerId),
      });
      return true;
    }
    if (idOk) {
      const item = resolveDetailItem(providerType, providerId);
      if (!item) return false;
      showP24Toast('보려던 정보로 이어서 보여드릴게요');
      openDetailDecision({ kind: providerType, id: providerId, sourceRoute: 'resume' });
      return true;
    }
  } catch (err) {
    console.warn('[resume-deep-intent]', err);
  }
  return false;
}

/** 테스트/재부팅용 — 일반 경로에서는 쓰지 않음 */
export function resetDeepIntentResumeFlag() {
  resumeAttempted = false;
}
