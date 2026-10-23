import { getBoardPolicy } from './board-engine-copy.js';
import { getRightRailSlot } from './right-rail-store.js';
import { listNoticePosts } from './operational-board-store.js';
import { getNavRole } from './state.js';
import { getBoardChannel, isConcernBoardKey } from './board-channel-store.js';
import { getConcernBoardByKey } from './concern/copy.js';
import { getHotConcernSamples, getLatestConcernSamples, reactionTotal } from './concern/store.js';
import { STUDY_ROOM_PROMO } from './promo/study-room-content.js';
import { HOME_UI_BASE } from '../../shared/preview-links.js';
import {
  canShowBoardInRail,
  canShowBoardPostsInRail,
  getChannelIntro,
  isRailSlotVisible,
  normalizeBoardKey,
} from './board-channel-acl.js';

/** ?뚮옯???뚭컻 ?곸긽 URL? UDX-M02 ?꾩갑 ?꾩뿉留?梨꾩슫?? 鍮?媛믪씠硫??ъ깮 affordance瑜?留뚮뱾吏 ?딅뒗?? */
const RAIL_MEDIA_TEASER = {
  eyebrow: '釉뚮옖???뚭컻',
  title: '?곕룞怨듦낵???대뼡 遺꾩쐞湲곗쓽 ?쒕퉬?ㅼ씪源뚯슂',
  caption: '?쒕퉬??遺꾩쐞湲곕? 吏㏐쾶 癒쇱? ?먭뺨蹂댁꽭??,
  videoUrl: '',
};

/** 怨듬?諛??뚭컻??怨듬?諛㈑룰쾶?ㅽ듃留? 怨쇱쇅?ㅒ룻븰?앹뿉??遺숈씠吏 ?딅뒗?? */
function studyRoomTeaserLanding(role) {
  if (role === 'tutor' || role === 'parent') return null;
  return { path: '/promo/study-room', label: '怨듬?諛??뚭컻 蹂닿린' };
}

/**
 * @typedef {{
 *   navRole: string,
 *   guestFilter: string,
 *   linkMode: 'hash' | 'absolute',
 *   homeBase: string,
 * }} RailCtx
 */

function resolveNavRole(opts = {}) {
  const role = opts.navRole;
  if (role === 'study_room' || role === 'tutor' || role === 'parent' || role === 'guest') return role;
  return getNavRole();
}

function createRailCtx(slotKey, opts = {}) {
  const slot = getRightRailSlot(slotKey);
  const navRole = resolveNavRole(opts);
  return {
    navRole,
    guestFilter: opts.guestFilter || slot?.guestFilter || 'allow',
    linkMode: opts.linkMode === 'absolute' ? 'absolute' : 'hash',
    homeBase: String(opts.homeBase || HOME_UI_BASE).replace(/\/$/, ''),
  };
}

function railPath(hrefOrPath) {
  const raw = String(hrefOrPath || '').trim();
  if (!raw) return '/support';
  return raw.replace(/^#/, '').startsWith('/') ? raw.replace(/^#/, '') : `/${raw.replace(/^#/, '')}`;
}

function railAnchor(hrefOrPath, className, ctx, inner) {
  const path = railPath(hrefOrPath);
  const cls = className ? ` class="${className}"` : '';
  if (ctx.linkMode === 'absolute') {
    const href = `${ctx.homeBase}/#${path}`;
    return `<a href="${esc(href)}" data-util-href="${esc(href)}"${cls}>${inner}</a>`;
  }
  return `<a href="#${esc(path)}" data-nav="${esc(path)}"${cls}>${inner}</a>`;
}

/**
 * ?몄뀡 ?좉툑?? 3痢??щ’(?꾩옣쨌?덈궡쨌?곸긽). Quiet Rails.
 * channel ACL: visibilityRule 쨌 roleTarget 쨌 guestFilter 쨌 sourceBoardKeys ?고????곸슜
 * @param {string} [slotKey]
 * @param {{ guestFilter?: string, tone?: 'full'|'quiet'|'entry', variant?: 'sidebar'|'inline', navRole?: string, linkMode?: 'hash'|'absolute', homeBase?: string }} [opts]
 */
export function renderPromoWithRightRail(slotKey = 'home_right_rail', opts = {}) {
  const ctx = createRailCtx(slotKey, opts);
  const slot = getRightRailSlot(slotKey);
  const collapse = String(slot?.mobileBehavior || '') === 'collapse';
  const visible = Boolean(slot && isRailSlotVisible(slot, ctx.navRole));
  const tone = opts.tone || defaultRailTone(slotKey);
  const variant = opts.variant || 'sidebar';
  const inner = renderRailLayers(slotKey, { ...ctx, tone, visible });
  const title = esc(slot?.sectionTitle || '?덈궡');
  const body =
    collapse && variant !== 'inline'
      ? `<details class="plans-rail-fold">
        <summary class="plans-rail-fold__summary">
          <strong>${title}</strong>
        </summary>
        <div class="plans-rail-fold__panel">${inner}</div>
      </details>`
      : inner;
  const tag = variant === 'inline' ? 'section' : 'aside';
  const shellClass =
    variant === 'inline'
      ? 'right-rail right-rail--inline right-rail--live-inline'
      : `home-sidebar home-sidebar--guest home-sidebar--live-rail right-rail${
          collapse ? ' right-rail--mobile-collapse' : ' right-rail--mobile-stack'
        }`;
  return `
    <${tag} class="${shellClass} live-rail--${esc(tone)}" data-right-rail-slot="${esc(slotKey)}" data-rail-tone="${esc(
      tone,
    )}" aria-label="${visible ? '?꾩옣 怨좊?怨??덈궡' : '?덈궡'}">
      ${body}
    </${tag}>`;
}

function defaultRailTone(slotKey) {
  if (slotKey === 'support_right_rail') return 'quiet';
  if (slotKey === 'register_right_rail') return 'entry';
  return 'full';
}

function renderRailLayers(slotKey, ctx) {
  const { tone, visible } = ctx;
  if (tone === 'entry') {
    return `${renderActionGuideSlot(slotKey, { ...ctx, featuredOnly: true })}${renderMediaTeaserSlot(ctx)}`;
  }
  if (tone === 'quiet') {
    return `${renderNoticeTopBanner(ctx)}${renderActionGuideSlot(slotKey, { ...ctx, featuredOnly: true })}`;
  }
  const field = visible ? renderLiveFieldSlot(slotKey, ctx) : '';
  return `${field}${renderActionGuideSlot(slotKey, ctx)}${renderMediaTeaserSlot(ctx)}`;
}

function renderNoticeTopBanner(ctx) {
  const notice = listNoticePosts()[0];
  if (!notice) return '';
  return railAnchor(
    '/support/notice',
    'live-rail-notice-top',
    ctx,
    `<span class="live-rail-notice-top__label">怨듭?</span>
      <span class="live-rail-notice-top__title">${esc(notice.title)}</span>`,
  );
}

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

function boardRoute(boardKey) {
  const channel = getBoardChannel(boardKey);
  if (channel?.routeSlug) return channel.routeSlug;
  const policy = getBoardPolicy(boardKey);
  if (policy?.routeSlug) return policy.routeSlug;
  const community = getConcernBoardByKey(boardKey);
  if (community) return `#${community.path}`;
  return '#/support';
}

function orderBoardKeysForRole(keys, role) {
  const prefer =
    role === 'study_room' ? 'concern-director' : role === 'tutor' ? 'concern-tutor' : 'concern-parent';
  const head = keys.filter((key) => key === prefer);
  const rest = keys.filter((key) => key !== prefer);
  return [...head, ...rest];
}

function resolveConcernBoardKeysForSlot(slotKey, ctx) {
  const slot = getRightRailSlot(slotKey);
  const configured = [];
  if (slot?.sourceBoardKey) configured.push(slot.sourceBoardKey);
  if (Array.isArray(slot?.sourceBoardKeys)) configured.push(...slot.sourceBoardKeys);
  const unique = [...new Set(configured.map(normalizeBoardKey).filter(Boolean))];
  const guestFilter = ctx.guestFilter || slot?.guestFilter || 'allow';
  const visible = unique.filter(
    (key) => isConcernBoardKey(key) && canShowBoardInRail(key, ctx.navRole, { guestFilter }),
  );
  return orderBoardKeysForRole(visible, ctx.navRole);
}

function communityHubForRole(role) {
  if (role === 'study_room') return { href: '#/community/director', label: '?먯옣 怨좊?諛???蹂닿린' };
  if (role === 'tutor') return { href: '#/community/tutor', label: '怨쇱쇅??怨좊?諛???蹂닿린' };
  return { href: '#/community', label: '而ㅻ??덊떚 ??蹂닿린' };
}

function liveFieldCopy(slotKey, ctx) {
  const hub = communityHubForRole(ctx.navRole);
  if (slotKey === 'search_right_rail') {
    return {
      eyebrow: '?먯깋 ?꾩?',
      title: '留롮씠 蹂대뒗 怨좊?',
      ctaLabel: hub.label,
      ctaHref: hub.href,
    };
  }
  if (slotKey === 'detail_right_rail') {
    return {
      eyebrow: '',
      title: '鍮꾩듂??怨좊? / ?щ?',
      ctaLabel: hub.label,
      ctaHref: hub.href,
    };
  }
  if (slotKey === 'register_right_rail' || slotKey === 'plans_right_rail') {
    return {
      eyebrow: '?댁쁺 ?꾩옣',
      title: '吏湲??꾩옣 怨좊?',
      ctaLabel: hub.label,
      ctaHref: hub.href,
    };
  }
  return {
    eyebrow: '?ㅻ뒛???꾩옣',
    title: '吏湲??꾩옣 怨좊? HOT',
    ctaLabel: hub.label,
    ctaHref: hub.href,
  };
}

function renderLiveFieldSlot(slotKey, ctx) {
  const copy = liveFieldCopy(slotKey, ctx);
  const navRole = ctx.navRole;
  const boardKeys = resolveConcernBoardKeysForSlot(slotKey, ctx);
  const latestMode = slotKey === 'detail_right_rail';
  const limit = 2;
  const postCards = (
    latestMode
      ? getLatestConcernSamples({ limit, boardKeys: boardKeys.filter((key) => canShowBoardPostsInRail(key, navRole)) })
      : getHotConcernSamples({ limit, boardKeys: boardKeys.filter((key) => canShowBoardPostsInRail(key, navRole)) })
  ).filter((post) => canShowBoardPostsInRail(post.boardKey, navRole));

  const postHtml = postCards
    .map((post) => {
      const board = getConcernBoardByKey(post.boardKey);
      const href = `${board?.path || '/community'}/${post.id}`;
      return railAnchor(
        href,
        'live-rail-card',
        ctx,
        `<span class="live-rail-card__board">${esc(board?.label || '而ㅻ??덊떚')}</span>
          <strong class="live-rail-card__title">${esc(post.title)}</strong>
          <span class="live-rail-card__meta">?볤? ${post.comments?.length || 0} 쨌 諛섏쓳 ${reactionTotal(post)}</span>`,
      );
    })
    .join('');

  const introHtml = boardKeys
    .filter((key) => !canShowBoardPostsInRail(key, navRole) && canShowBoardInRail(key, navRole, ctx))
    .slice(0, Math.max(0, limit - postCards.length))
    .map((key) => {
      const intro = getChannelIntro(key);
      const board = getConcernBoardByKey(key);
      const href = board?.path || boardRoute(key).replace(/^#/, '');
      return railAnchor(
        href,
        'live-rail-card',
        ctx,
        `<span class="live-rail-card__board">${esc(intro.title)}</span>
          <strong class="live-rail-card__title">${esc(intro.title)}</strong>
          <span class="live-rail-card__meta">??怨듦컙???뚭컻留?蹂????덉뼱??/span>`,
      );
    })
    .join('');

  const items = `${postHtml}${introHtml}`;

  return `
    <section class="live-rail-slot live-rail-slot--field">
      <div class="live-rail-slot__head">
        ${copy.eyebrow ? `<span class="live-rail-slot__eyebrow">${esc(copy.eyebrow)}</span>` : ''}
        <strong class="live-rail-slot__title">${esc(copy.title)}</strong>
      </div>
      <div class="live-rail-slot__items">${items || '<p class="live-rail-empty">?꾩쭅 ?щ씪??怨좊????놁뒿?덈떎.</p>'}</div>
      ${railAnchor(copy.ctaHref, 'live-rail-slot__cta', ctx, esc(copy.ctaLabel))}
    </section>`;
}

function actionCtasForContext(slotKey, ctx) {
  const role = ctx.navRole;
  if (slotKey === 'detail_right_rail') {
    return [
      { title: '泥??곕씫 ??泥댄겕', desc: '怨듦컻 ?뺣낫쨌媛寃㈑룹쐞移섎? ?ㅼ떆 ?뺤씤?섏꽭??, href: '#/guide/saved-contact', cta: '履쎌? ?덈궡' },
      { title: '?덉쟾怨쇱쇅 媛?대뱶', desc: '媛쒖씤?뺣낫 怨듭쑀 ???됰룞 ?붾졊', href: '#/guide/safety', cta: '媛?대뱶 蹂닿린' },
    ];
  }
  if (slotKey === 'search_right_rail') {
    return [
      { title: '議곌굔 醫곹엳??踰?, desc: '李쑣룸퉬援먮줈 ?꾨낫瑜?以꾩뿬蹂댁꽭??, href: '#/guide/saved-contact', cta: '李쑣룸퉬援먃룹そ吏' },
      { title: '?덉쟾 媛?대뱶', desc: '臾몄쓽 ??瑗?蹂?泥댄겕', href: '#/guide/safety', cta: '?덉쟾 ?덈궡' },
    ];
  }
  if (slotKey === 'register_right_rail') {
    if (role === 'tutor') {
      return [
        { title: '?꾨줈??蹂댁셿', desc: '臾몄쓽 ?꾪솚???믪씠???뚭컻 ?먮쫫', href: '#/guide/registration', cta: '?깅줉諛⑸쾿' },
        { title: '?숈깮 ?묎렐 ?먮쫫', desc: '?붿껌臾맞룹そ吏 ???뺤씤', href: '#/community/tutor', cta: '怨쇱쇅??怨좊?諛? },
      ];
    }
    return [
      { title: '?묒꽦 ??泥댄겕', desc: '怨듦컻 ?뺣낫? 履쎌? ?ㅼ젙???뺤씤?섏꽭??, href: '#/guide/registration', cta: '?깅줉諛⑸쾿' },
      { title: '?쒖쫵 紐⑥쭛 以鍮?, desc: '?뚭컻臾맞룹궗吏?蹂댁셿 ?ъ씤??, href: '#/community/director', cta: '怨듬?諛?怨좊?諛? },
    ];
  }
  if (role === 'study_room') {
    const paid = slotKey === 'plans_right_rail';
    return [
      paid
        ? { title: '?좊즺 ?몄텧 ?덈궡', desc: '?곸꽭?깅줉 ?댄썑 ?꾨씪????, href: '#/plans', cta: '?좊즺?곹뭹', tone: 'paid' }
        : { title: '3遺??깅줉遺??, desc: '湲곕낯?깅줉?쇰줈 媛蹂띻쾶 ?쒖옉', href: '#/guide/registration', cta: '?깅줉諛⑸쾿' },
      { title: '?쒖쫵 紐⑥쭛 以鍮?, desc: '?뚭컻臾맞룹궗吏?蹂댁셿 ?ъ씤??, href: '#/community/director', cta: '怨듬?諛?怨좊?諛? },
    ];
  }
  if (role === 'tutor') {
    return [
      { title: '?꾨줈??蹂댁셿', desc: '臾몄쓽 ?꾪솚???믪씠???뚭컻 ?먮쫫', href: '#/guide/registration', cta: '?깅줉諛⑸쾿' },
      { title: '?숈깮 ?묎렐 ?먮쫫', desc: '?붿껌臾맞룹そ吏 ???뺤씤', href: '#/community/tutor', cta: '怨쇱쇅??怨좊?諛? },
    ];
  }
  if (role === 'parent') {
    return [
      { title: '李쑣룸퉬援먃룹そ吏', desc: '泥??곕씫? 履쎌?濡??덉쟾?섍쾶', href: '#/guide/saved-contact', cta: '?댁슜 ?먮쫫' },
      { title: '?덉쟾怨쇱쇅 媛?대뱶', desc: '媛쒖씤?뺣낫 怨듭쑀 ???됰룞 ?붾졊', href: '#/guide/safety', cta: '媛?대뱶 蹂닿린' },
    ];
  }
  const promo = STUDY_ROOM_PROMO.railCard;
  if (slotKey === 'home_right_rail') {
    return [
      { title: promo.title, desc: promo.desc, href: `#${promo.path}`, cta: promo.cta },
      { title: '李쑣룸퉬援먃룹そ吏', desc: '泥??곕씫? 履쎌?濡??덉쟾?섍쾶', href: '#/guide/saved-contact', cta: '?댁슜 ?먮쫫' },
    ];
  }
  return [
    { title: '李쑣룸퉬援먃룹そ吏', desc: '泥??곕씫? 履쎌?濡??덉쟾?섍쾶', href: '#/guide/saved-contact', cta: '?댁슜 ?먮쫫' },
    { title: '?덉쟾怨쇱쇅 媛?대뱶', desc: '媛쒖씤?뺣낫 怨듭쑀 ???됰룞 ?붾졊', href: '#/guide/safety', cta: '媛?대뱶 蹂닿린' },
  ];
}

function actionGuideCopy(slotKey) {
  if (slotKey === 'detail_right_rail') return { eyebrow: '?ъ슜 ??, title: '吏湲??꾩슂???덈궡' };
  if (slotKey === 'search_right_rail') return { eyebrow: '珥덈낫 媛?대뱶', title: '泥섏쓬 李얜뒗 遺꾧퍡' };
  if (slotKey === 'plans_right_rail') return { eyebrow: '?곹뭹 ?덈궡', title: '吏湲??꾩슂???덈궡' };
  if (slotKey === 'register_right_rail') return { eyebrow: '?묒꽦 ?꾩?', title: '吏湲??꾩슂???덈궡' };
  return { eyebrow: '吏湲??꾩슂???덈궡', title: '?대쾲 ?쒖쫵 異붿쿇 ?됰룞' };
}

function renderActionGuideSlot(slotKey, ctx) {
  const copy = actionGuideCopy(slotKey);
  const ctas = actionCtasForContext(slotKey, ctx);
  const featured = ctas[0];
  const rest = ctx.featuredOnly ? [] : ctas.slice(1, 2);
  if (!featured) return '';
  return `
    <section class="live-rail-slot live-rail-slot--action">
      <div class="live-rail-slot__head">
        ${copy.eyebrow ? `<span class="live-rail-slot__eyebrow">${esc(copy.eyebrow)}</span>` : ''}
        <strong class="live-rail-slot__title">${esc(copy.title)}</strong>
      </div>
      <div class="live-rail-slot__items">
        ${renderActionItem(featured, true, ctx)}
        ${rest.map((item) => renderActionItem(item, false, ctx)).join('')}
      </div>
    </section>`;
}

function renderActionItem(item, featured, ctx) {
  const tone = item.tone === 'paid' ? ' paid' : '';
  const cls = featured ? `live-rail-action live-rail-action--signal${tone}` : 'live-rail-action live-rail-action--quiet';
  return railAnchor(
    item.href,
    cls,
    ctx,
    `<strong>${esc(item.title)}</strong>
      <span>${esc(item.desc)}</span>
      <em>${esc(item.cta)}</em>`,
  );
}

function renderMediaTeaserSlot(ctx) {
  const landingSpec = studyRoomTeaserLanding(ctx.navRole);
  if (!landingSpec) return '';
  const media = RAIL_MEDIA_TEASER;
  const videoUrl = String(media.videoUrl || '').trim();
  const landing = railAnchor(landingSpec.path, 'live-rail-slot__cta', ctx, esc(landingSpec.label));
  if (!videoUrl) {
    return `
    <section class="live-rail-slot live-rail-slot--media" data-rail-media="idle">
      <div class="live-rail-slot__head">
        <span class="live-rail-slot__eyebrow">${esc(media.eyebrow)}</span>
        <strong class="live-rail-slot__title">${esc(media.title)}</strong>
      </div>
      <p class="live-rail-media__caption live-rail-media__caption--idle">${esc(media.caption)}</p>
      ${landing}
    </section>`;
  }
  return `
    <section class="live-rail-slot live-rail-slot--media" data-rail-media="ready">
      <div class="live-rail-slot__head">
        <span class="live-rail-slot__eyebrow">釉뚮옖???곸긽</span>
        <strong class="live-rail-slot__title">${esc(media.title)}</strong>
      </div>
      <button type="button" class="live-rail-media" data-rail-media-open data-rail-media-src="${esc(videoUrl)}" data-rail-media-title="${esc(media.title)}">
        <span class="live-rail-media__thumb" aria-hidden="true">
          <span class="live-rail-media__play"></span>
        </span>
        <span class="live-rail-media__caption">${esc(media.caption)}</span>
      </button>
      ${landing}
      <div class="live-rail-media-dialog" hidden role="dialog" aria-modal="true" aria-label="${esc(media.title)}">
        <div class="live-rail-media-dialog__backdrop" data-rail-media-close></div>
        <div class="live-rail-media-dialog__panel">
          <button type="button" class="live-rail-media-dialog__close" data-rail-media-close>?リ린</button>
          <p class="live-rail-media-dialog__lead">${esc(media.caption)}</p>
          <div class="live-rail-media-dialog__frame" data-rail-media-frame></div>
          ${landing}
        </div>
      </div>
    </section>`;
}

export function bindRightRailEvents(root) {
  if (!root) return;
  const dialog = root.querySelector('.live-rail-media-dialog');
  const openers = root.querySelectorAll('[data-rail-media-open]');
  if (!dialog || !openers.length) return;

  const close = () => {
    dialog.hidden = true;
    const frame = dialog.querySelector('[data-rail-media-frame]');
    if (frame) frame.innerHTML = '';
    document.body.classList.remove('is-rail-media-open');
  };

  openers.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const src = String(btn.getAttribute('data-rail-media-src') || '').trim();
      const frame = dialog.querySelector('[data-rail-media-frame]');
      if (!src || !frame) return;
      const id = src.match(/[?&]v=([^&]+)/)?.[1] || src.split('/').pop();
      frame.innerHTML = `<iframe src="https://www.youtube.com/embed/${esc(id)}?rel=0" title="${esc(
        btn.getAttribute('data-rail-media-title') || '?뚭컻 ?곸긽',
      )}" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
      dialog.hidden = false;
      document.body.classList.add('is-rail-media-open');
    });
  });

  dialog.querySelectorAll('[data-rail-media-close]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      close();
    });
  });
}

export function renderRightRailSidebar(slotKey = 'home_right_rail', opts = {}) {
  return renderPromoWithRightRail(slotKey, opts);
}

/** @param {string} slotKey ???곸꽭 紐⑤떖쨌寃???섎떒 ???몃씪??蹂댁“ 釉붾줉 */
export function renderRightRailBlock(slotKey = 'detail_right_rail', opts = {}) {
  return renderPromoWithRightRail(slotKey, { ...opts, variant: 'inline', tone: opts.tone || 'full' });
}

/** 怨듬?諛?怨쇱쇅???깅줉 SPA ??entry 諛?? home-ui ?덈? 留곹겕 */
export function renderRegisterRightRail(opts = {}) {
  return renderPromoWithRightRail('register_right_rail', {
    tone: 'entry',
    linkMode: 'absolute',
    ...opts,
  });
}
