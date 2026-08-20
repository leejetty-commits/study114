/**
 * 공개 마이샵 진입 — 스냅샷 저장 후 `#/myshop/study-room/:id` 로 이동
 * (모달 닫기는 호출측에서 — detail-shell 순환 import 방지)
 */

import { navigate } from '../state.js';
import { myshopStudyRoomPath } from './router.js';
import {
  buildMyshopReturnSnapshot,
  saveMyshopReturnSnapshot,
  peekMyshopReturnSnapshot,
  applyMyshopReturnSnapshotToState,
  markMyshopReturnPending,
} from './return-snapshot.js';

/**
 * @param {{
 *   studyRoomId: number,
 *   sourceRoute?: string,
 *   viewerRole?: string,
 * }} opts
 */
export function openPublicMyshop(opts) {
  const studyRoomId = Number(opts.studyRoomId);
  if (!Number.isFinite(studyRoomId) || studyRoomId <= 0) return;

  const sourceRoute = opts.sourceRoute || 'search';
  const viewerRole = opts.viewerRole || 'guest';
  const snapshot = buildMyshopReturnSnapshot({
    sourceRoute,
    viewerRole,
    focusId: studyRoomId,
  });
  const path = myshopStudyRoomPath(studyRoomId, { from: sourceRoute });
  if (!path) return;
  saveMyshopReturnSnapshot(snapshot);
  navigate(path);
}

/**
 * 복귀 버튼 — 상태 복원 후 목록 해시로 이동 (스크롤은 목록 bind 후 pending 처리)
 * @returns {boolean}
 */
export function returnFromPublicMyshop() {
  const snap = peekMyshopReturnSnapshot();
  if (!snap?.returnHash) return false;
  applyMyshopReturnSnapshotToState(snap);
  markMyshopReturnPending();
  const hash = snap.returnHash.startsWith('/') ? snap.returnHash : `/${snap.returnHash}`;
  navigate(hash);
  return true;
}
