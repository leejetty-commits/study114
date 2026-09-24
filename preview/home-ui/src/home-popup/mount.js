import { LOCKUP_SRC, POPUP_FAMILIES, POPUP_TYPES, SET_A, WORDMARK_SRC } from './content.js';
import {
  hidePopupForToday,
  markHomePopupClosed,
  noteHomePopupRoot,
  resolveHomePopup,
  setHomePopupRemount,
  writePopupDemo,
  writePopupFamily,
} from './gate.js';

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
}

function lockup(className) {
  return `<img class="${className}" src="${LOCKUP_SRC}" alt="우동공과" />`;
}

function dayHide() {
  return `
    <label class="home-popup__day">
      <input type="checkbox" data-home-popup-day />
      <span>오늘 하루 보지 않기</span>
    </label>`;
}

function closeButton() {
  return `<button type="button" class="home-popup__x" data-home-popup-close aria-label="닫기">×</button>`;
}

function watermark(family) {
  if (family !== 'b') return '';
  return `<img class="home-popup__watermark" src="${WORDMARK_SRC}" alt="" aria-hidden="true" />`;
}

function renderNotice(card, family) {
  const bullets = card.bullets.map((line) => `<li>${esc(line)}</li>`).join('');
  return `
    <article class="home-popup__card home-popup__card--notice" role="dialog" aria-modal="true" aria-labelledby="home-popup-title">
      ${closeButton()}
      <header class="home-popup__head">
        <span class="home-popup__badge">공지</span>
        ${lockup('home-popup__lockup home-popup__lockup--notice')}
      </header>
      <p class="home-popup__date">${esc(card.date)}</p>
      <h2 id="home-popup-title" class="home-popup__title">${esc(card.title)}</h2>
      <div class="home-popup__indent">
        <p class="home-popup__text">${esc(card.body)}</p>
        <ul class="home-popup__list">${bullets}</ul>
        <div class="home-popup__actions">
          <a class="home-popup__cta home-popup__cta--amber" href="${esc(card.ctaHref)}">${esc(card.cta)}</a>
          <button type="button" class="home-popup__text-close" data-home-popup-close>닫기</button>
        </div>
      </div>
      ${watermark(family)}
      ${dayHide()}
    </article>`;
}

function renderEvent(card, family) {
  return `
    <article class="home-popup__card home-popup__card--event" role="dialog" aria-modal="true" aria-labelledby="home-popup-title">
      <div class="home-popup__hero">
        <span class="home-popup__orb home-popup__orb--a" aria-hidden="true"></span>
        <span class="home-popup__orb home-popup__orb--b" aria-hidden="true"></span>
        ${closeButton()}
        ${lockup('home-popup__lockup home-popup__lockup--event')}
        <p class="home-popup__kicker">${esc(card.kicker)}</p>
      </div>
      <div class="home-popup__event-body">
        <h2 id="home-popup-title" class="home-popup__title">${esc(card.title)}</h2>
        <div class="home-popup__indent">
          <span class="home-popup__chip home-popup__chip--event">${esc(card.chip)}</span>
          <p class="home-popup__text">${esc(card.body)}</p>
          <span class="home-popup__chip home-popup__chip--period">${esc(card.period)}</span>
          <p class="home-popup__note">${esc(card.note)}</p>
          <a class="home-popup__cta home-popup__cta--coral" href="${esc(card.ctaHref)}">${esc(card.cta)}</a>
        </div>
        ${watermark(family)}
        ${dayHide()}
      </div>
    </article>`;
}

function renderAd(card, family) {
  const body = esc(card.body).replace(/\n/g, '<br>');
  const aside = esc(card.aside).replace(/\n/g, '<br>');
  return `
    <article class="home-popup__card home-popup__card--ad" role="dialog" aria-modal="true" aria-labelledby="home-popup-title">
      <div class="home-popup__ad-aside">
        <span class="home-popup__deco" aria-hidden="true"></span>
        ${lockup('home-popup__lockup home-popup__lockup--ad')}
        <p class="home-popup__aside-copy">${aside}</p>
      </div>
      <div class="home-popup__ad-main">
        ${closeButton()}
        <span class="home-popup__chip home-popup__chip--guide">${esc(card.chip)}</span>
        <h2 id="home-popup-title" class="home-popup__title">${esc(card.title)}</h2>
        <div class="home-popup__indent">
          <p class="home-popup__text">${body}</p>
          <div class="home-popup__actions">
            <a class="home-popup__cta home-popup__cta--teal" href="${esc(card.primaryHref)}">${esc(card.primary)}</a>
            <a class="home-popup__cta home-popup__cta--ghost" href="${esc(card.secondaryHref)}">${esc(card.secondary)}</a>
          </div>
        </div>
        ${watermark(family)}
      </div>
      ${dayHide()}
    </article>`;
}

function fillCard(type, content) {
  const base = SET_A[type] || SET_A.notice;
  const src = content && typeof content === 'object' ? content : {};
  const card = { ...base };
  for (const key of Object.keys(base)) {
    if (key === 'id' || key === 'bullets') continue;
    const value = src[key];
    if (typeof value === 'string' && value.trim() !== '') card[key] = value;
  }
  if (Array.isArray(base.bullets)) {
    const lines = Array.isArray(src.bullets)
      ? src.bullets.filter((line) => String(line ?? '').trim() !== '')
      : [];
    card.bullets = lines.length ? lines : base.bullets;
  }
  return card;
}

function renderCard(type, family, content) {
  const card = fillCard(type, content);
  if (type === 'event') return renderEvent(card, family);
  if (type === 'ad') return renderAd(card, family);
  return renderNotice(card, family);
}

function renderSwitch(type, family) {
  const families = POPUP_FAMILIES.map((item) => {
    const pressed = item.id === family ? 'true' : 'false';
    const current = item.id === family ? ' is-current' : '';
    return `<button type="button" class="home-popup__switch-btn${current}" data-home-popup-family="${item.id}" aria-pressed="${pressed}">${item.label}</button>`;
  }).join('');
  const buttons = POPUP_TYPES.map((item) => {
    const pressed = item.id === type ? 'true' : 'false';
    const current = item.id === type ? ' is-current' : '';
    return `<button type="button" class="home-popup__switch-btn${current}" data-home-popup-demo="${item.id}" aria-pressed="${pressed}">${item.label}</button>`;
  }).join('');
  return `<div class="home-popup__switch" role="group" aria-label="팝업 패밀리와 유형">${families}<span class="home-popup__switch-gap" aria-hidden="true"></span>${buttons}</div>`;
}

/** @type {((event: KeyboardEvent) => void) | null} */
let onKey = null;

function detachKey() {
  if (!onKey) return;
  document.removeEventListener('keydown', onKey);
  onKey = null;
}

/**
 * @param {{ mode: 'preview' | 'public', type: string, family: 'a' | 'b', id: string | null }} choice
 * @param {HTMLElement} root
 */
function closePopup(choice, root) {
  const checked = Boolean(root.querySelector('[data-home-popup-day]')?.checked);
  if (choice.mode === 'public' && checked && choice.id) hidePopupForToday(choice.id);
  markHomePopupClosed(choice);
  root.remove();
  detachKey();
}

/**
 * @param {HTMLElement | null} appRoot
 */
setHomePopupRemount((root) => {
  mountHomePopup(root);
});

export function mountHomePopup(appRoot) {
  noteHomePopupRoot(appRoot || null);
  document.querySelectorAll('[data-home-popup]').forEach((el) => el.remove());
  detachKey();
  if (!appRoot) return;

  const choice = resolveHomePopup();
  if (!choice) return;
  const { type, family } = choice;

  const root = document.createElement('div');
  root.className = 'home-popup';
  root.setAttribute('data-home-popup', type);
  root.setAttribute('data-home-popup-family', family);
  root.setAttribute('data-home-popup-mode', choice.mode);
  root.innerHTML = `
    <div class="home-popup__backdrop" data-home-popup-close></div>
    <div class="home-popup__frame">
      ${choice.mode === 'preview' ? renderSwitch(type, family) : ''}
      ${renderCard(type, family, choice.content)}
    </div>`;
  appRoot.appendChild(root);

  root.querySelectorAll('[data-home-popup-close]').forEach((el) => {
    el.addEventListener('click', () => closePopup(choice, root));
  });
  root.querySelectorAll('[data-home-popup-demo]').forEach((el) => {
    el.addEventListener('click', () => {
      const next = el.getAttribute('data-home-popup-demo');
      if (next !== 'notice' && next !== 'event' && next !== 'ad') return;
      if (next === type) return;
      writePopupDemo(next);
      mountHomePopup(appRoot);
    });
  });
  root.querySelectorAll('[data-home-popup-family]').forEach((el) => {
    el.addEventListener('click', () => {
      const next = el.getAttribute('data-home-popup-family');
      if (next !== 'a' && next !== 'b') return;
      if (next === family) return;
      writePopupFamily(next);
      mountHomePopup(appRoot);
    });
  });

  onKey = (event) => {
    if (event.key !== 'Escape') return;
    closePopup(choice, root);
  };
  document.addEventListener('keydown', onKey);
}
