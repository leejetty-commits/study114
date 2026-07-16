/**
 * 맨 위 플로팅 버튼 — 문서가 1뷰포트보다 길 때만 표시
 */

const BTN_ID = 'study114-back-to-top';

function pageOverflows() {
  const doc = document.documentElement;
  return doc.scrollHeight > window.innerHeight + 48;
}

function syncVisibility(btn) {
  const overflows = pageOverflows();
  if (!overflows) {
    btn.hidden = true;
    btn.classList.remove('is-visible');
    return;
  }
  // 오버플로 페이지에서 조금 스크롤하면 표시 (맨 위에서는 숨김)
  const show = window.scrollY > 96;
  btn.hidden = false;
  btn.classList.toggle('is-visible', show);
}

/**
 * @param {ParentNode} [_root] 렌더 루트(미사용, 호출 호환용)
 */
export function ensureBackToTop(_root) {
  let btn = document.getElementById(BTN_ID);
  if (!btn) {
    btn = document.createElement('button');
    btn.id = BTN_ID;
    btn.type = 'button';
    btn.className = 'back-to-top';
    btn.setAttribute('aria-label', '맨 위로');
    btn.setAttribute('title', '맨 위로');
    btn.innerHTML = '<span aria-hidden="true">↑</span><span class="back-to-top__label">맨위</span>';
    btn.hidden = true;
    document.body.appendChild(btn);
    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    const onScroll = () => syncVisibility(btn);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(onScroll);
      ro.observe(document.documentElement);
      btn._ro = ro;
    }
  }
  requestAnimationFrame(() => syncVisibility(btn));
  return btn;
}
