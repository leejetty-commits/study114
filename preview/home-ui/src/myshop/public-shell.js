/**
 * 공개 마이샵 풀페이지 셸
 * — 본문은 원장 「내 등록 → 마이샵」과 동일 렌더(renderMyshopShowcase)
 */

import { renderHomeShell, bindLayoutEvents } from '../layout.js';
import { parseMyshopPath } from './router.js';
import { returnFromPublicMyshop } from './navigate.js';
import { peekMyshopReturnSnapshot, myshopReturnLabel } from './return-snapshot.js';
import { resolvePublicStudyRoomItem, toMyshopShowcaseInputs } from './public-resolve.js';
import { fetchPublicStudyRoom } from './public-api.js';
import { renderMyshopShowcase, bindMyshopEvents } from '../study-room-reg/myshop-render.js';
import { esc } from '../detail-decision/detail-utils.js';

function renderShowcaseHtml(item) {
  const pair = toMyshopShowcaseInputs(item);
  if (!pair) {
    return `
      <div class="shop shop--empty" data-myshop>
        <p class="shop-prose" style="padding:1.5rem;text-align:center">이 공부방 소개를 찾을 수 없습니다.</p>
      </div>`;
  }
  return renderMyshopShowcase(pair.state, pair.room);
}

export function renderPublicMyshop() {
  const hash = window.location.hash.slice(1) || '';
  const parsed = parseMyshopPath(hash);
  const id = parsed?.studyRoomId || 0;
  const snap = peekMyshopReturnSnapshot();
  const backLabel = myshopReturnLabel(snap);
  const cached = id ? resolvePublicStudyRoomItem(id) : null;

  const body = `
    <div class="myshop-public" data-myshop-public data-study-room-id="${id}">
      <header class="myshop-public__top">
        <button type="button" class="btn btn--secondary btn--sm myshop-public__back" data-myshop-back>
          ← ${esc(backLabel)}
        </button>
      </header>
      <div data-myshop-public-mount>
        ${
          cached
            ? renderShowcaseHtml(cached)
            : `<div class="shop shop--loading" data-pm-loading data-myshop>
                <p class="shop-prose" style="padding:1.5rem;text-align:center">소개를 불러오는 중…</p>
              </div>`
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
  bindMyshopEvents(root);

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
        mount.innerHTML = renderShowcaseHtml(fallback);
        bindMyshopEvents(root);
      }
      return;
    }
    mount.innerHTML = renderShowcaseHtml(item);
    bindMyshopEvents(root);
  });
}
