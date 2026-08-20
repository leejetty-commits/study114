/**
 * 공개 마이샵 풀페이지 셸
 * — 마이페이지 레일·상세 모달로 열지 않음. 바디 전체 독립 본편.
 */

import { renderHomeShell, bindLayoutEvents } from '../layout.js';
import { parseMyshopPath } from './router.js';
import { returnFromPublicMyshop } from './navigate.js';
import { peekMyshopReturnSnapshot, myshopReturnLabel } from './return-snapshot.js';
import { resolvePublicStudyRoomItem, buildPublicMyshopModel } from './public-model.js';
import { renderPublicMyshopBody, bindPublicMyshopBodyEvents } from './public-body.js';
import { fetchPublicStudyRoom } from './public-api.js';
import { esc } from '../detail-decision/detail-utils.js';

export function renderPublicMyshop() {
  const hash = window.location.hash.slice(1) || '';
  const parsed = parseMyshopPath(hash);
  const id = parsed?.studyRoomId || 0;
  const snap = peekMyshopReturnSnapshot();
  const backLabel = myshopReturnLabel(snap);
  const cached = id ? resolvePublicStudyRoomItem(id) : null;
  const model = cached ? buildPublicMyshopModel(cached) : null;

  const body = `
    <div class="myshop-public" data-myshop-public data-study-room-id="${id}">
      <header class="myshop-public__top">
        <button type="button" class="btn btn--secondary btn--sm myshop-public__back" data-myshop-back>
          ← ${esc(backLabel)}
        </button>
      </header>
      <div data-myshop-public-mount>
        ${
          model
            ? renderPublicMyshopBody(model)
            : `<div class="pm-empty pm-empty--loading" data-pm-loading><p>소개를 불러오는 중…</p></div>`
        }
      </div>
    </div>
  `;

  const role =
    snap?.viewerRole === 'parent' || snap?.viewerRole === 'study_room' || snap?.viewerRole === 'tutor'
      ? snap.viewerRole
      : 'guest';
  return renderHomeShell(role, body, {
    showAuth: false,
    showRoleSwitch: false,
  });
}

/** @param {HTMLElement} root @param {() => void} rerender */
export function bindPublicMyshopEvents(root, rerender) {
  bindLayoutEvents(root, rerender);
  bindPublicMyshopBodyEvents(root);

  root.querySelector('[data-myshop-back]')?.addEventListener('click', () => {
    if (!returnFromPublicMyshop()) {
      history.back();
    }
  });

  const wrap = root.querySelector('[data-myshop-public]');
  const mount = root.querySelector('[data-myshop-public-mount]');
  const id = Number(wrap?.getAttribute('data-study-room-id') || 0);
  if (!mount || !id) return;

  fetchPublicStudyRoom(id).then((item) => {
    if (!item) {
      if (mount.querySelector('[data-pm-loading]')) {
        const fallback = resolvePublicStudyRoomItem(id);
        mount.innerHTML = renderPublicMyshopBody(fallback ? buildPublicMyshopModel(fallback) : null);
        bindPublicMyshopBodyEvents(root);
      }
      return;
    }
    mount.innerHTML = renderPublicMyshopBody(buildPublicMyshopModel(item));
    bindPublicMyshopBodyEvents(root);
  });
}
