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

/** 플랫폼 소개 영상 URL은 UDX-M02 도착 후에만 채운다. 빈 값이면 재생 affordance를 만들지 않는다. */
const RAIL_MEDIA_TEASER = {
  eyebrow: '브랜드 소개',
  title: '우동공과는 어떤 분위기의 서비스일까요',
  caption: '서비스 분위기를 짧게 먼저 느껴보세요',
  landingPath: '/promo/study-room',
  landingLabel: '소개 페이지에서 보기',
  videoUrl: '',
};

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
 * 노션 잠금안: 3층 슬롯(현장·안내·영상). Quiet Rails.
 * channel ACL: visibilityRule · roleTarget · guestFilter · sourceBoardKeys 런타임 적용
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
  const title = esc(slot?.sectionTitle || '안내');
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
    )}" aria-label="${visible ? '현장 고민과 안내' : '안내'}">
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
    `<span class="live-rail-notice-top__label">공지</span>
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
  if (role === 'study_room') return { href: '#/community/director', label: '원장 고민방 더 보기' };
  if (role === 'tutor') return { href: '#/community/tutor', label: '과외쌤 고민방 더 보기' };
  return { href: '#/community', label: '커뮤니티 더 보기' };
}

function liveFieldCopy(slotKey, ctx) {
  const hub = communityHubForRole(ctx.navRole);
  if (slotKey === 'search_right_rail') {
    return {
      eyebrow: '탐색 도움',
      title: '많이 보는 고민',
      ctaLabel: hub.label,
      ctaHref: hub.href,
    };
  }
  if (slotKey === 'detail_right_rail') {
    return {
      eyebrow: '',
      title: '비슷한 고민 / 사례',
      ctaLabel: hub.label,
      ctaHref: hub.href,
    };
  }
  if (slotKey === 'register_right_rail' || slotKey === 'plans_right_rail') {
    return {
      eyebrow: '운영 현장',
      title: '지금 현장 고민',
      ctaLabel: hub.label,
      ctaHref: hub.href,
    };
  }
  return {
    eyebrow: '오늘의 현장',
    title: '지금 현장 고민 HOT',
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
        `<span class="live-rail-card__board">${esc(board?.label || '커뮤니티')}</span>
          <strong class="live-rail-card__title">${esc(post.title)}</strong>
          <span class="live-rail-card__meta">댓글 ${post.comments?.length || 0} · 반응 ${reactionTotal(post)}</span>`,
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
          <span class="live-rail-card__meta">이 공간의 소개만 볼 수 있어요</span>`,
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
      <div class="live-rail-slot__items">${items || '<p class="live-rail-empty">아직 올라온 고민이 없습니다.</p>'}</div>
      ${railAnchor(copy.ctaHref, 'live-rail-slot__cta', ctx, esc(copy.ctaLabel))}
    </section>`;
}

function actionCtasForContext(slotKey, ctx) {
  const role = ctx.navRole;
  if (slotKey === 'detail_right_rail') {
    return [
      { title: '첫 연락 전 체크', desc: '공개 정보·가격·위치를 다시 확인하세요', href: '#/guide/saved-contact', cta: '쪽지 안내' },
      { title: '안전과외 가이드', desc: '개인정보 공유 전 행동 요령', href: '#/guide/safety', cta: '가이드 보기' },
    ];
  }
  if (slotKey === 'search_right_rail') {
    return [
      { title: '조건 좁히는 법', desc: '찜·비교로 후보를 줄여보세요', href: '#/guide/saved-contact', cta: '찜·비교·쪽지' },
      { title: '안전 가이드', desc: '문의 전 꼭 볼 체크', href: '#/guide/safety', cta: '안전 안내' },
    ];
  }
  if (slotKey === 'register_right_rail') {
    if (role === 'tutor') {
      return [
        { title: '프로필 보완', desc: '문의 전환을 높이는 소개 흐름', href: '#/guide/registration', cta: '등록방법' },
        { title: '학생 접근 흐름', desc: '요청문·쪽지 전 확인', href: '#/community/tutor', cta: '과외쌤 고민방' },
      ];
    }
    return [
      { title: '작성 전 체크', desc: '공개 정보와 쪽지 설정을 확인하세요', href: '#/guide/registration', cta: '등록방법' },
      { title: '시즌 모집 준비', desc: '소개문·사진 보완 포인트', href: '#/community/director', cta: '공부방 고민방' },
    ];
  }
  if (role === 'study_room') {
    const paid = slotKey === 'plans_right_rail';
    return [
      paid
        ? { title: '유료 노출 안내', desc: '상세등록 이후 Prime/Pick', href: '#/plans', cta: '유료상품', tone: 'paid' }
        : { title: '3분 등록부터', desc: '기본등록으로 가볍게 시작', href: '#/guide/registration', cta: '등록방법' },
      { title: '시즌 모집 준비', desc: '소개문·사진 보완 포인트', href: '#/community/director', cta: '공부방 고민방' },
    ];
  }
  if (role === 'tutor') {
    return [
      { title: '프로필 보완', desc: '문의 전환을 높이는 소개 흐름', href: '#/guide/registration', cta: '등록방법' },
      { title: '학생 접근 흐름', desc: '요청문·쪽지 전 확인', href: '#/community/tutor', cta: '과외쌤 고민방' },
    ];
  }
  const promo = STUDY_ROOM_PROMO.railCard;
  if (slotKey === 'home_right_rail') {
    return [
      { title: promo.title, desc: promo.desc, href: `#${promo.path}`, cta: promo.cta },
      { title: '찜·비교·쪽지', desc: '첫 연락은 쪽지로 안전하게', href: '#/guide/saved-contact', cta: '이용 흐름' },
    ];
  }
  return [
    { title: '찜·비교·쪽지', desc: '첫 연락은 쪽지로 안전하게', href: '#/guide/saved-contact', cta: '이용 흐름' },
    { title: '안전과외 가이드', desc: '개인정보 공유 전 행동 요령', href: '#/guide/safety', cta: '가이드 보기' },
  ];
}

function actionGuideCopy(slotKey) {
  if (slotKey === 'detail_right_rail') return { eyebrow: '사용 팁', title: '지금 필요한 안내' };
  if (slotKey === 'search_right_rail') return { eyebrow: '초보 가이드', title: '처음 찾는 분께' };
  if (slotKey === 'plans_right_rail') return { eyebrow: '상품 안내', title: '지금 필요한 안내' };
  if (slotKey === 'register_right_rail') return { eyebrow: '작성 도움', title: '지금 필요한 안내' };
  return { eyebrow: '지금 필요한 안내', title: '이번 시즌 추천 행동' };
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
  const media = RAIL_MEDIA_TEASER;
  const videoUrl = String(media.videoUrl || '').trim();
  const landing = railAnchor(media.landingPath, 'live-rail-slot__cta', ctx, esc(media.landingLabel));
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
        <span class="live-rail-slot__eyebrow">브랜드 영상</span>
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
          <button type="button" class="live-rail-media-dialog__close" data-rail-media-close>닫기</button>
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
        btn.getAttribute('data-rail-media-title') || '소개 영상',
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

/** @param {string} slotKey — 상세 모달·검색 하단 등 인라인 보조 블록 */
export function renderRightRailBlock(slotKey = 'detail_right_rail', opts = {}) {
  return renderPromoWithRightRail(slotKey, { ...opts, variant: 'inline', tone: opts.tone || 'full' });
}

/** 공부방/과외쌤 등록 SPA — entry 밀도, home-ui 절대 링크 */
export function renderRegisterRightRail(opts = {}) {
  return renderPromoWithRightRail('register_right_rail', {
    tone: 'entry',
    linkMode: 'absolute',
    ...opts,
  });
}
