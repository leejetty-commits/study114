import {
  listCommunityBoards,
  CONCERN_COMPOSE_HINT,
  CONCERN_HUB_LEAD,
  CONCERN_POST_TYPES,
  CONCERN_POST_TYPE_KEYS,
  CONCERN_DEFAULT_POST_TYPE,
  COMMUNITY_BOARD_VISUAL,
} from './copy.js';
import { concernBoardNav, getConcernView, getDefaultCommunityPath } from './router.js';
import {
  fetchConcernPosts,
  fetchMoreConcernPosts,
  fetchConcernPost,
  findConcernPost,
  getConcernList,
  normalizeListQuery,
  invalidateConcernList,
  applyPostReaction,
  saveConcernPost,
  deleteConcernPost,
  fetchComments,
  addComment,
  deleteComment,
  toggleReaction,
  reportContent,
  reactionTotal,
} from './store.js';
import { getNavRole, navigate, getCommunityPath } from '../state.js';
import { getAuthUser, isLoggedIn } from '../auth-session.js';
import {
  boardLoginHref,
  canComposeBoard,
  canDiscoverBoard,
  getBoardAccess,
  getChannelIntro,
  boardIntroLevel,
  roleGateCopy,
} from '../board-channel-acl.js';
import { renderStateCard } from '../empty-state-copy.js';

/* ── 유틸리티 ── */

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
}

function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('ko-KR', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function typeLabel(type) {
  return (CONCERN_POST_TYPES[type] || CONCERN_POST_TYPES[CONCERN_DEFAULT_POST_TYPE]).label;
}

function typeBadge(type) {
  return `<span class="concern-type concern-type--${esc(CONCERN_POST_TYPES[type] ? type : CONCERN_DEFAULT_POST_TYPE)}">${esc(typeLabel(type))}</span>`;
}

function authorLine(post) {
  const name = post.authorDisplayName || '회원';
  const time = formatTime(post.createdAt);
  return `${esc(name)} · ${esc(time)}`;
}

function pathOnlyOf(path) {
  return String(path || '').split('?')[0];
}

function currentPathOnly() {
  return pathOnlyOf(getCommunityPath());
}

function isAdminUser(user) {
  return Boolean(user && (user.role_type === 'admin' || user.admin_level));
}

/** 서버 반응 키 3종 */
const REACTION_KINDS = [
  { key: 'empathy', emoji: '❤️', label: '공감해요' },
  { key: 'helpful', emoji: '👍', label: '도움됐어요' },
  { key: 'cheer', emoji: '🎉', label: '응원해요' },
];

const SORT_OPTIONS = [
  { key: 'recent', label: '최신' },
  { key: 'hot', label: '공감·HOT' },
  { key: 'comments', label: '댓글많은' },
];

/* ── 화면 안 안내 영역 (같은 경로에 머무는 동안 유지) ── */

/** @type {{ path: string, tone: 'success'|'error'|'info', text: string }|null} */
let _flash = null;

function setFlash(path, tone, text) {
  _flash = { path: pathOnlyOf(path), tone, text };
}

function clearFlash() {
  _flash = null;
}

function renderFlash(pathOnly) {
  if (!_flash) return '';
  if (_flash.path !== pathOnly) {
    _flash = null;
    return '';
  }
  const role = _flash.tone === 'error' ? 'alert' : 'status';
  return `
    <div class="concern-flash concern-flash--${esc(_flash.tone)}" role="${role}">
      <p class="concern-flash__text">${esc(_flash.text)}</p>
      <button type="button" class="concern-flash__close" data-concern-flash-close aria-label="안내 닫기">닫기</button>
    </div>`;
}

/* ── 화면 안 확인 패널 (삭제·신고) ── */

/**
 * @param {Element|null} slot
 * @param {{ id: string, title: string, body?: string, confirmLabel: string, danger?: boolean, withReason?: boolean, errorText: string, onConfirm: (reason: string) => Promise<void> }} opts
 */
function openInlineConfirm(slot, opts) {
  if (!slot) return;
  if (slot.getAttribute('data-open') === opts.id) {
    slot.innerHTML = '';
    slot.removeAttribute('data-open');
    return;
  }
  slot.setAttribute('data-open', opts.id);
  slot.innerHTML = `
    <div class="concern-confirm${opts.danger ? ' concern-confirm--danger' : ''}" role="group" aria-label="${esc(opts.title)}">
      <p class="concern-confirm__title">${esc(opts.title)}</p>
      ${opts.body ? `<p class="concern-confirm__body">${esc(opts.body)}</p>` : ''}
      ${
        opts.withReason
          ? `<label class="concern-field concern-confirm__field">
              <span>신고 사유 (선택)</span>
              <textarea name="reason" rows="2" maxlength="500" placeholder="어떤 점이 문제인지 짧게 적어 주세요"></textarea>
            </label>`
          : ''
      }
      <p class="concern-confirm__error" data-confirm-error hidden></p>
      <div class="concern-confirm__actions">
        <button type="button" class="btn ${opts.danger ? 'btn--danger' : 'btn--primary'} btn--sm" data-confirm-ok>${esc(opts.confirmLabel)}</button>
        <button type="button" class="btn btn--ghost btn--sm" data-confirm-cancel>취소</button>
      </div>
    </div>`;
  const okBtn = slot.querySelector('[data-confirm-ok]');
  const cancelBtn = slot.querySelector('[data-confirm-cancel]');
  const errorEl = slot.querySelector('[data-confirm-error]');
  const reasonEl = slot.querySelector('textarea[name="reason"]');
  cancelBtn?.addEventListener('click', () => {
    slot.innerHTML = '';
    slot.removeAttribute('data-open');
  });
  okBtn?.addEventListener('click', async () => {
    okBtn.disabled = true;
    if (cancelBtn) cancelBtn.disabled = true;
    if (errorEl) errorEl.hidden = true;
    try {
      await opts.onConfirm(reasonEl ? reasonEl.value.trim() : '');
    } catch (err) {
      if (errorEl) {
        errorEl.textContent = err?.message || opts.errorText;
        errorEl.hidden = false;
      }
      okBtn.disabled = false;
      if (cancelBtn) cancelBtn.disabled = false;
    }
  });
  (reasonEl || okBtn)?.focus();
}

/* ── 글 목록 행 ── */

function renderPostRow(post, board) {
  const href = `${board?.path || getDefaultCommunityPath()}/${post.id}`;
  const name = post.authorDisplayName || '회원';
  const initial = name.slice(0, 1);
  const body = String(post.description || '').replace(/\s+/g, ' ');
  const excerpt = body.slice(0, 88);
  return `
    <a class="if-post" href="#${esc(href)}" data-concern-nav="${esc(href)}">
      <span class="if-post__avatar" aria-hidden="true">${esc(initial)}</span>
      <span>
        <strong class="if-post__title">${typeBadge(post.type)}${esc(post.title)}</strong>
        ${excerpt ? `<span class="if-post__sub">${esc(excerpt)}${excerpt.length >= 88 ? '…' : ''}</span>` : ''}
        <span class="if-post__stats">${authorLine(post)}${post.edited ? ' · 수정됨' : ''} · 댓글 ${post.commentCount || 0} · 반응 ${reactionTotal(post)}</span>
      </span>
    </a>`;
}

/* ── 게시판 비주얼 ── */

function boardVisual(board) {
  return (
    COMMUNITY_BOARD_VISUAL[board?.id || board?.slug] || {
      kicker: '게시판',
      icon: '/assets/info-refresh/motif-support.svg',
      desc: board?.roleHint || '',
      cta: '입장하기',
      art: 'board-entry__art--room',
      accent: '',
      halo: '',
      tile: '',
      kickerColor: '',
    }
  );
}

/* ── 커뮤니티 허브 ── */

function renderCommunityHub(navRole) {
  const boards = listCommunityBoards().filter((board) => canDiscoverBoard(board.boardKey, navRole));
  const browsePath = getDefaultCommunityPath();
  return `
    <section class="hero-band" aria-label="커뮤니티 히어로">
      <div class="hero-band__grid" aria-hidden="true"></div>
      <span class="blob blob--a" style="top:-36px;right:32px" aria-hidden="true"></span>
      <div class="hero-band__inner">
        <div class="hero-band__copy">
          <span class="section-chip">현장형 커뮤니티</span>
          <h1>남기고 · 답하고 · 해결후기로 이어가기</h1>
          <p>${esc(CONCERN_HUB_LEAD)}</p>
          <div style="display:flex;gap:10px;flex-wrap:wrap">
            <a class="btn btn--primary" href="#${esc(browsePath)}" data-concern-nav="${esc(browsePath)}">게시판 둘러보기</a>
            <a class="btn btn--secondary" href="#/community/solved" data-concern-nav="/community/solved">해결후기 보기</a>
          </div>
        </div>
        <div class="hero-band__art" aria-hidden="true">
          <img src="/assets/info-refresh/motif-support.svg" alt="" />
        </div>
      </div>
    </section>
    <div class="pattern-band" aria-hidden="true"></div>
    <div class="section-head">
      <div>
        <span class="section-chip">게시판 4곳</span>
        <h2>역할별 게시판으로 바로 들어가기</h2>
        <div class="section-underline"></div>
      </div>
    </div>
    <div class="board-grid">
      ${boards
        .map((board) => {
          const vis = boardVisual(board);
          const color = vis.kickerColor ? ` style="color:${esc(vis.kickerColor)}"` : '';
          return `
            <a class="board-entry card card--accent ${esc(vis.accent)}" href="#${esc(board.path)}" data-concern-nav="${esc(board.path)}">
              <div class="board-entry__art ${esc(vis.art)}">
                <span class="icon-halo ${esc(vis.halo)}"><span class="icon-tile ${esc(vis.tile)}"><img src="${esc(vis.icon)}" alt="" /></span></span>
              </div>
              <p class="board-entry__label"${color}>${esc(vis.kicker)}</p>
              <h2>${esc(board.label)}</h2>
              <p>${esc(vis.desc)}</p>
              <span class="board-entry__cta"${color}>${esc(vis.cta)} →</span>
            </a>`;
        })
        .join('')}
    </div>
    <aside class="tip-card">
      <h3>게스트 안내</h3>
      <p>로그인 전에는 글 제목만 볼 수 있어요. 본문과 댓글은 로그인 후 역할에 맞는 게시판에서 열립니다.</p>
    </aside>`;
}

/* ── 게스트 벽 ── */

function renderGuestBoardWall(board, role) {
  const intro = getChannelIntro(board.boardKey);
  const gate = roleGateCopy(board.boardKey, role);
  const loginHref = boardLoginHref('community');
  return `
    <div class="section-head">
      <div>
        <span class="section-chip">로그인 안내</span>
        <h2>${esc(board.label)}</h2>
        <div class="section-underline"></div>
      </div>
    </div>
    <section class="login-wall" aria-label="로그인 안내">
      <span class="blob blob--a" style="left:-28px;top:-18px" aria-hidden="true"></span>
      <div class="login-wall__art"><img src="/assets/info-refresh/motif-login.svg" alt="" /></div>
      <h1>${esc(gate.title || intro.title)}</h1>
      <p>${esc(gate.body)}</p>
      <div class="login-wall__steps" aria-label="이용 단계">
        <span class="step-pill"><span class="step-pill__n">1</span>로그인</span>
        <span class="step-pill"><span class="step-pill__n">2</span>역할 확인</span>
        <span class="step-pill"><span class="step-pill__n">3</span>글 읽고 답하기</span>
      </div>
      <a class="btn btn--primary" href="${esc(loginHref)}">로그인하고 게시판 열기</a>
      <p style="margin:12px 0 0;font-size:13px;color:var(--uds-muted);position:relative;z-index:1">
        또는 <a href="#/community" data-concern-nav="/community" style="color:var(--uds-primary);font-weight:600">커뮤니티 홈으로 돌아가기</a>
      </p>
    </section>`;
}

/* ── 채널 소개 카드 ── */

function renderChannelIntroCard(board, role) {
  const intro = getChannelIntro(board.boardKey);
  const gate = roleGateCopy(board.boardKey, role);
  const menuOnly = boardIntroLevel(board.boardKey, role) === 'menu_only';
  if (role === 'guest') {
    return renderGuestBoardWall(board, role);
  }
  const links = [{ label: '다른 게시판', href: `#${getDefaultCommunityPath()}` }];
  const lead = menuOnly
    ? ''
    : `
    <section class="if-hero">
      <span class="if-chip">${esc(board.roleHint)}</span>
      <h2 class="if-hero__title">${esc(board.label)}</h2>
      <p class="if-hero__body">${esc(intro.body)}</p>
    </section>`;
  return `
    ${lead}
    ${renderStateCard({
      title: gate.title,
      body: gate.body,
      links,
    })}`;
}

function renderBoardBlocked(board, role) {
  if (role === 'guest') {
    return renderGuestBoardWall(board, role);
  }
  const gate = roleGateCopy(board.boardKey, role);
  const intro = getChannelIntro(board.boardKey);
  return renderStateCard({
    title: intro.title,
    body: gate.body,
    links: [{ label: '다른 게시판', href: `#${getDefaultCommunityPath()}` }],
  });
}

/* ── 해결후기 ── */

function storyParts(post) {
  const fallbackResult = '자세한 과정은 본문에서 확인할 수 있어요.';
  const raw = String(post.description || '').trim();
  const chunks = raw
    .split(/\n{2,}|\n|→/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (chunks.length >= 2) {
    return { problem: chunks[0], result: chunks.slice(1).join(' ') };
  }
  const excerpt = (chunks[0] || raw).replace(/\s+/g, ' ').trim();
  if (!excerpt) {
    return { problem: String(post.title || ''), result: fallbackResult };
  }
  const sentences = excerpt
    .split(/(?<=[.!?。！？])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (sentences.length >= 2) {
    return { problem: sentences[0], result: sentences.slice(1).join(' ') };
  }
  return { problem: excerpt, result: fallbackResult };
}

function renderSolvedStories(board, posts, emptyText) {
  const vis = boardVisual(board);
  if (!posts.length) {
    return `<p class="concern-empty">${esc(emptyText)}</p>`;
  }
  return `
    <div class="story-grid">
      ${posts
        .map((post) => {
          const href = `${board.path}/${post.id}`;
          const parts = storyParts(post);
          return `
            <a class="story-card" href="#${esc(href)}" data-concern-nav="${esc(href)}">
              <div class="story-card__head">
                <span class="icon-halo icon-halo--green" style="width:56px;height:56px">
                  <span class="icon-tile icon-tile--green" style="width:40px;height:40px;border-radius:10px"><img src="${esc(vis.icon)}" alt="" style="width:24px;height:24px" /></span>
                </span>
                <span class="chip chip--green">${esc(typeLabel(post.type))}</span>
              </div>
              <div class="story-card__body">
                <h2>${esc(post.title)}</h2>
                <div class="story-flow">
                  <div class="story-flow__box">
                    <span class="story-flow__label">문제</span>
                    <p>${esc(parts.problem)}</p>
                  </div>
                  <span class="story-flow__arrow" aria-hidden="true">→</span>
                  <div class="story-flow__box story-flow__box--out">
                    <span class="story-flow__label">결과</span>
                    <p>${esc(parts.result)}</p>
                  </div>
                </div>
                <div class="story-card__foot">
                  <span>댓글 ${post.commentCount || 0} · 반응 ${reactionTotal(post)}${post.edited ? ' · 수정됨' : ''}</span>
                </div>
              </div>
            </a>`;
        })
        .join('')}
    </div>`;
}

/* ── 제목만 보기 행 ── */

function renderTitleOnlyRow(post, board) {
  const href = `${board?.path || getDefaultCommunityPath()}/${post.id}`;
  return `
    <a class="if-post if-post--title-only" href="#${esc(href)}" data-concern-title-only="${esc(href)}" data-concern-board="${esc(board.boardKey)}">
      <span>
        <strong class="if-post__title">${typeBadge(post.type)}${esc(post.title)}</strong>
        <span class="if-post__stats">${esc(formatTime(post.createdAt))} · 반응 ${reactionTotal(post)} · 댓글 ${post.commentCount || 0}</span>
      </span>
    </a>`;
}

function titleOnlyNotice(role, board) {
  const intro = getChannelIntro(board.boardKey);
  if (role === 'guest') {
    return `<p class="concern-note">로그인하면 전체 내용을 볼 수 있어요. <a class="concern-note__link" href="${esc(boardLoginHref('community'))}">로그인</a></p>`;
  }
  return `<p class="concern-note">이 게시판은 ${esc(intro.allowedRolesLabel)} 회원에게 열려 있어요. 지금은 제목만 볼 수 있어요.</p>`;
}

/* ── 목록 도구 (종류 필터·정렬) ── */

function listHref(board, q) {
  const params = new URLSearchParams();
  if (q.sort && q.sort !== 'recent') params.set('sort', q.sort);
  if (q.type) params.set('type', q.type);
  const s = params.toString();
  return s ? `${board.path}?${s}` : board.path;
}

function renderListToolbar(board, q) {
  const typeItems = [{ key: '', label: '전체' }, ...CONCERN_POST_TYPE_KEYS.map((key) => ({ key, label: typeLabel(key) }))];
  const typeLinks = typeItems
    .map(({ key, label }) => {
      const href = listHref(board, { sort: q.sort, type: key });
      const active = q.type === key;
      return `<a class="concern-filter${active ? ' is-active' : ''}" href="#${esc(href)}" data-concern-nav="${esc(href)}"${active ? ' aria-current="true"' : ''}>${esc(label)}</a>`;
    })
    .join('');
  const sortLinks = SORT_OPTIONS.map(({ key, label }) => {
    const href = listHref(board, { sort: key, type: q.type });
    const active = q.sort === key;
    return `<a class="concern-sort__link${active ? ' is-active' : ''}" href="#${esc(href)}" data-concern-nav="${esc(href)}"${active ? ' aria-current="true"' : ''}>${esc(label)}</a>`;
  }).join('');
  return `
    <div class="concern-filters" role="group" aria-label="글 종류">${typeLinks}</div>
    <div class="concern-sort" role="group" aria-label="정렬">${sortLinks}</div>`;
}

function renderMore(board, entry) {
  if (!entry.total) return '';
  const count = `<span class="concern-more__count">${entry.total}개 중 ${entry.posts.length}개</span>`;
  if (!entry.hasMore) return `<div class="concern-more">${count}</div>`;
  return `
    <div class="concern-more">
      ${count}
      <button type="button" class="btn btn--secondary btn--sm" data-concern-more="${esc(board.boardKey)}">더 보기</button>
      <p class="concern-more__error" data-concern-more-error hidden></p>
    </div>`;
}

/* ── 목록 화면 ── */

function renderList(board, query) {
  const role = getNavRole();
  if (!canDiscoverBoard(board.boardKey, role)) {
    return renderBoardBlocked(board, role);
  }

  const q = normalizeListQuery({ sort: query.get('sort'), type: query.get('type') });
  const entry = getConcernList(board.boardKey, q);

  if (entry === null) {
    return `<div class="concern-loading" data-concern-board-load="${esc(board.boardKey)}" data-concern-sort="${esc(q.sort)}" data-concern-type="${esc(q.type)}">
      <p class="concern-loading__msg">불러오는 중…</p>
    </div>`;
  }

  const { posts, access } = entry;
  if (access === 'intro' || access === 'blocked') {
    return renderChannelIntroCard(board, role);
  }

  const localAccess = getBoardAccess(board.boardKey, role);
  const vis = boardVisual(board);
  const isTitlesOnly = access === 'titles';
  const emptyText = q.type
    ? `아직 「${typeLabel(q.type)}」 글이 없습니다.`
    : '아직 올라온 글이 없습니다. 첫 글을 남겨 보세요.';

  const writeBtn = !isTitlesOnly && localAccess.canCompose
    ? `<a class="btn btn--primary" href="#${esc(board.path)}/new" data-concern-nav="${esc(board.path)}/new">글쓰기</a>`
    : role === 'guest'
      ? `<a class="btn btn--secondary" href="${esc(boardLoginHref('community-compose'))}">로그인 후 글쓰기</a>`
      : '';
  const hero = `
    <section class="hero-band" style="padding:22px 24px">
      <div class="hero-band__grid" aria-hidden="true"></div>
      <div class="hero-band__inner">
        <div class="hero-band__copy">
          <span class="section-chip">${esc(vis.kicker)}</span>
          <h1 style="font-size:24px">${esc(board.label)}</h1>
          <p style="margin:0">${esc(board.roleHint)}</p>
        </div>
        ${writeBtn}
      </div>
    </section>`;

  if (isTitlesOnly) {
    const listHtml = posts.length
      ? `<div class="concern-list">${posts.map((p) => renderTitleOnlyRow(p, board)).join('')}</div>`
      : q.type
        ? `<p class="concern-empty">${esc(emptyText)}</p>`
        : '';
    return `
      ${hero}
      ${titleOnlyNotice(role, board)}
      ${renderListToolbar(board, q)}
      ${listHtml}
      ${renderMore(board, entry)}
      ${!posts.length && !q.type ? renderChannelIntroCard(board, role) : ''}`;
  }

  const readonlyNote =
    localAccess.canDetail && !localAccess.canCompose
      ? `<p class="concern-note">${esc(roleGateCopy(board.boardKey, role).body)}</p>`
      : '';
  const isSolved = board.slug === 'solved' || board.defaultTypes?.includes('solved');
  const listHtml = isSolved
    ? renderSolvedStories(board, posts, q.type ? emptyText : '아직 해결후기가 없습니다. 문제와 결과를 짧게 남겨보세요.')
    : `<div class="concern-list">${
        posts.length
          ? posts.map((p) => renderPostRow(p, board)).join('')
          : `<p class="concern-empty">${esc(emptyText)}</p>`
      }</div>`;
  return `
    ${hero}
    ${readonlyNote}
    ${renderListToolbar(board, q)}
    ${listHtml}
    ${renderMore(board, entry)}`;
}

/* ── 상세 화면 ── */

function renderDetail(board, postId, query) {
  const role = getNavRole();
  if (!canDiscoverBoard(board.boardKey, role)) {
    return renderBoardBlocked(board, role);
  }

  const back = `<a class="concern-back" href="#${esc(board.path)}" data-concern-nav="${esc(board.path)}">← ${esc(board.label)}</a>`;
  const found = findConcernPost(board.boardKey, postId);
  if (!found) {
    return `<div class="concern-loading" data-concern-detail-load="${esc(board.boardKey)}" data-concern-detail-post="${esc(postId)}">
      <p class="concern-loading__msg">불러오는 중…</p>
    </div>`;
  }
  const { post, access: serverAccess } = found;

  if (serverAccess === 'titles') {
    return `
      <article class="concern-detail">
        ${back}
        ${
          post
            ? `<div class="concern-detail__meta">${typeBadge(post.type)}</div>
               <h2 class="concern-detail__title">${esc(post.title)}</h2>
               <p class="concern-detail__author">${esc(formatTime(post.createdAt))} · 반응 ${reactionTotal(post)} · 댓글 ${post.commentCount || 0}</p>`
            : ''
        }
        ${titleOnlyNotice(role, board)}
      </article>`;
  }

  const access = getBoardAccess(board.boardKey, role);
  if (serverAccess === 'intro' || serverAccess === 'blocked' || !access.canList || !access.canDetail) {
    return `
      <article class="concern-detail">
        ${back}
        ${renderChannelIntroCard(board, role)}
      </article>`;
  }
  if (!post || post.titlesOnly) {
    return `
      <article class="concern-detail">
        ${back}
        ${renderStateCard({
          title: '글을 찾을 수 없어요',
          body: '삭제되었거나 더 이상 볼 수 없는 글입니다.',
          links: [{ label: '목록으로', href: `#${board.path}` }],
        })}
      </article>`;
  }

  const detailPath = `${board.path}/${post.id}`;
  const user = getAuthUser();
  const isOwner = Boolean(user && post.authorUserId && Number(user.user_id) === Number(post.authorUserId));
  const canEdit = isOwner && access.canList && access.canCompose;
  const canDelete = isOwner || isAdminUser(user);

  if (query.get('edit') === '1' && canEdit) {
    return renderEditForm(board, post);
  }

  const canReact = access.canComment && !isOwner;
  const reactionsHtml = renderPostReactions(post, board.boardKey, canReact, isOwner);

  const editBtn = canEdit
    ? `<a class="btn btn--secondary btn--sm" href="#${esc(detailPath)}?edit=1" data-concern-nav="${esc(detailPath)}?edit=1">수정</a>`
    : '';
  const deleteBtn = canDelete
    ? `<button type="button" class="btn btn--danger btn--sm" data-concern-delete-post="${esc(post.id)}" data-concern-board="${esc(board.boardKey)}">삭제</button>`
    : '';
  const reportBtn = isLoggedIn() && !isOwner
    ? `<button type="button" class="btn btn--ghost btn--sm" data-concern-report-post="${esc(String(post._numericId))}" data-concern-post-key="${esc(post.id)}" data-concern-board="${esc(board.boardKey)}">신고</button>`
    : '';
  const editedNote = post.edited
    ? ` · <span class="concern-edited" title="${esc(formatTime(post.updatedAt))}에 수정">수정됨 ${esc(formatTime(post.updatedAt))}</span>`
    : '';

  return `
    <article class="concern-detail">
      ${back}
      <div class="concern-detail__meta">${typeBadge(post.type)}</div>
      <h2 class="concern-detail__title">${esc(post.title)}</h2>
      <p class="concern-detail__author">${authorLine(post)}${editedNote}</p>
      <div class="concern-detail__body">${esc(post.description || '')}</div>
      ${reactionsHtml}
      <div class="concern-detail__actions">${editBtn} ${deleteBtn} ${reportBtn}</div>
      <div class="concern-confirm-slot" data-concern-post-confirm-slot></div>
      <section class="concern-comments" data-concern-comments-zone="${esc(String(post._numericId))}" data-concern-board-key="${esc(board.boardKey)}">
        <h3 class="concern-comments__title">댓글</h3>
        <div class="concern-comments__body">
          <p class="concern-loading__msg">댓글을 불러오는 중…</p>
        </div>
      </section>
    </article>`;
}

/* ── 글 수정 화면 (본인 글, 제목·본문) ── */

function renderEditForm(board, post) {
  const detailPath = `${board.path}/${post.id}`;
  return `
    <section class="concern-compose">
      <a class="concern-back" href="#${esc(detailPath)}" data-concern-nav="${esc(detailPath)}">← 글로 돌아가기</a>
      <h2 class="concern-compose__title">글 수정</h2>
      <p class="concern-compose__hint">제목과 본문을 고칠 수 있어요. 저장하면 글에 「수정됨」이 표시됩니다.</p>
      <form class="concern-compose-form" data-concern-edit="${esc(board.boardKey)}" data-concern-edit-post="${esc(post.id)}" data-concern-path="${esc(board.path)}">
        <p class="concern-compose__type">글 종류 ${typeBadge(post.type)}</p>
        <label class="concern-field">
          <span>제목</span>
          <input name="title" maxlength="100" required value="${esc(post.title)}" />
        </label>
        <label class="concern-field">
          <span>본문</span>
          <textarea name="body" rows="8" maxlength="5000" required>${esc(post.description || '')}</textarea>
        </label>
        <div class="concern-compose__error" data-concern-compose-error role="alert" hidden></div>
        <div class="concern-compose__actions">
          <button type="submit" class="btn btn--primary">저장</button>
          <a class="btn btn--ghost" href="#${esc(detailPath)}" data-concern-nav="${esc(detailPath)}">취소</a>
        </div>
      </form>
    </section>`;
}

/* ── 반응 렌더링 (글) ── */

function renderPostReactions(post, boardKey, canReact, isOwner) {
  const numericId = post._numericId || 0;
  const myReaction = post.myReaction || null;
  const items = REACTION_KINDS.map(({ key, emoji, label }) => {
    const count = Number(post.reactions?.[key] || 0);
    const active = myReaction === key ? ' is-active' : '';
    const disabledAttr = canReact ? '' : ' disabled';
    const title = isOwner ? '본인 글에는 반응할 수 없습니다' : '';
    const titleAttr = title ? ` title="${esc(title)}"` : '';
    return `<button type="button" class="concern-reaction${active}" data-concern-react-post="${numericId}" data-concern-post-key="${esc(post.id)}" data-concern-board="${esc(boardKey)}" data-concern-react-kind="${esc(key)}" aria-pressed="${myReaction === key ? 'true' : 'false'}"${disabledAttr}${titleAttr}>${esc(emoji)} ${esc(label)} <strong>${count}</strong></button>`;
  }).join('');
  return `<div class="concern-reactions">${items}</div>`;
}

/* ── 댓글 트리 렌더링 ── */

function renderCommentsTree(comments, access, currentUserId, numericPostId, boardKey) {
  if (!comments.length) {
    return '<p class="concern-empty">아직 댓글이 없습니다.</p>';
  }
  return `<ul class="concern-comments__list">
    ${comments.map((c) => renderCommentItem(c, access, currentUserId, numericPostId, boardKey)).join('')}
  </ul>`;
}

function renderCommentItem(comment, access, currentUserId, numericPostId, boardKey) {
  const isDeleted = comment.status === 'deleted';
  const isHidden = comment.status === 'hidden';
  const isOwner = currentUserId && Number(comment.authorUserId) === currentUserId;
  const canDeleteComment = isOwner && !isDeleted && !isHidden;

  const deleteBtn = canDeleteComment
    ? ` <button type="button" class="concern-comment__delete" data-concern-delete-comment="${comment.id}">삭제</button>`
    : '';

  const myReaction = comment.myReaction || null;
  const helpfulCount = Number(comment.reactions?.helpful || 0);
  const canReactComment = access.canComment && !isOwner && !isDeleted && !isHidden;
  const reactionBtn = !isDeleted && !isHidden
    ? `<button type="button" class="concern-reaction concern-reaction--sm${myReaction === 'helpful' ? ' is-active' : ''}" data-concern-react-comment="${comment.id}" data-concern-react-comment-post="${numericPostId}" data-concern-react-kind="helpful"${canReactComment ? '' : ' disabled'}${isOwner ? ' title="본인 댓글에는 반응할 수 없습니다"' : ''}>👍 도움됐어요 <strong>${helpfulCount}</strong></button>`
    : '';

  const reportBtn = !isDeleted && !isHidden && currentUserId && !isOwner
    ? ` <button type="button" class="concern-comment__report" data-concern-report-comment="${comment.id}" data-concern-report-comment-post="${numericPostId}">신고</button>`
    : '';

  const replies = (comment.replies || [])
    .map((r) => renderCommentItem(r, access, currentUserId, numericPostId, boardKey))
    .join('');

  const replyBtn = access.canComment && !isDeleted && !isHidden && !comment.parentCommentId
    ? ` <button type="button" class="concern-comment__reply-btn" data-concern-reply-to="${comment.id}" data-concern-reply-post="${numericPostId}">답글</button>`
    : '';

  return `
    <li class="concern-comment${isDeleted ? ' concern-comment--deleted' : ''}${comment.parentCommentId ? ' concern-comment--reply' : ''}">
      <div class="concern-comment__head">
        <strong>${esc(comment.authorDisplayName || '회원')}</strong>
        <span>${esc(formatTime(comment.createdAt))}</span>
        ${deleteBtn}${reportBtn}
      </div>
      <p>${esc(comment.body)}</p>
      <div class="concern-comment__foot">${reactionBtn}${replyBtn}</div>
      <div class="concern-confirm-slot" data-comment-confirm-slot="${comment.id}"></div>
      <div class="concern-reply-form-slot" data-reply-slot="${comment.id}"></div>
      ${replies ? `<ul class="concern-comments__replies">${replies}</ul>` : ''}
    </li>`;
}

/* ── 글쓰기 화면 ── */

function renderCompose(board) {
  const role = getNavRole();
  if (!canComposeBoard(board.boardKey, role)) {
    const gate = roleGateCopy(board.boardKey, role);
    if (role === 'guest') {
      return `
        <section class="concern-compose">
          <a class="concern-back" href="#${esc(board.path)}" data-concern-nav="${esc(board.path)}">← ${esc(board.label)}</a>
          ${renderStateCard({
            title: '로그인이 필요합니다',
            body: '로그인 후 글을 작성할 수 있어요.',
            links: [{ label: '로그인', href: boardLoginHref('community-compose') }],
          })}
        </section>`;
    }
    return `
      <section class="concern-compose">
        <a class="concern-back" href="#${esc(board.path)}" data-concern-nav="${esc(board.path)}">← ${esc(board.label)}</a>
        ${renderStateCard({
          title: gate.title,
          body: '이 게시판에 글을 쓸 권한이 없습니다.',
          links: [{ label: '목록으로', href: `#${board.path}` }],
        })}
      </section>`;
  }
  const defaultType = board.defaultTypes?.includes('solved') ? 'solved' : CONCERN_DEFAULT_POST_TYPE;
  const typeOptions = CONCERN_POST_TYPE_KEYS.map(
    (key) => `<option value="${esc(key)}"${key === defaultType ? ' selected' : ''}>${esc(typeLabel(key))}</option>`,
  ).join('');
  return `
    <section class="concern-compose">
      <a class="concern-back" href="#${esc(board.path)}" data-concern-nav="${esc(board.path)}">← ${esc(board.label)}</a>
      <p class="concern-compose__hint">${esc(CONCERN_COMPOSE_HINT)}</p>
      <form class="concern-compose-form" data-concern-compose="${esc(board.boardKey)}" data-concern-path="${esc(board.path)}">
        <label class="concern-field">
          <span>글 종류</span>
          <select name="type" required>${typeOptions}</select>
        </label>
        <label class="concern-field">
          <span>제목</span>
          <input name="title" maxlength="100" required placeholder="말 걸고 싶은 제목" />
        </label>
        <label class="concern-field">
          <span>본문</span>
          <textarea name="body" rows="8" maxlength="5000" required placeholder="짧은 경험이나 고민을 적어주세요"></textarea>
        </label>
        <div class="concern-compose__error" data-concern-compose-error role="alert" hidden></div>
        <button type="submit" class="btn btn--primary">올리기</button>
      </form>
    </section>`;
}

/* ── 메인 렌더 함수 ── */

export function renderConcernScreen(path) {
  const pathOnly = pathOnlyOf(path);
  const query = new URLSearchParams(path.includes('?') ? path.slice(path.indexOf('?') + 1) : '');
  const view = getConcernView(pathOnly);
  let body;
  if (view.kind === 'hub') body = renderCommunityHub(getNavRole());
  else if (view.kind === 'compose') body = renderCompose(view.board);
  else if (view.kind === 'detail') body = renderDetail(view.board, view.postId, query);
  else if (!view.board) body = '<p class="concern-empty">게시판을 찾을 수 없습니다.</p>';
  else body = renderList(view.board, query);
  return `${renderFlash(pathOnly)}${body}`;
}

export function renderConcernSideNav(currentPath) {
  const pathOnly = currentPath.split('?')[0];
  const role = getNavRole();
  const items = concernBoardNav(pathOnly)
    .filter((b) => b.id === 'hub' || canDiscoverBoard(b.boardKey, role))
    .map((b) => ({
      label: b.label,
      path: b.path,
      active: b.active,
    }));
  const selectOptions = items
    .map((item) => `<option value="${esc(item.path)}"${item.active ? ' selected' : ''}>${esc(item.label)}</option>`)
    .join('');
  return `
    <nav class="concern-nav" aria-label="커뮤니티 메뉴">
      <div class="if-nav-mobile">
        <label class="if-nav-mobile__label" for="concern-nav-select">커뮤니티 메뉴</label>
        <select id="concern-nav-select" class="if-nav-mobile__select" data-concern-nav-select>
          ${selectOptions}
        </select>
      </div>
      ${items
        .map(
          (item) => `
        <a class="concern-nav__item${item.active ? ' is-active' : ''}"
           href="#${esc(item.path)}"
           data-concern-nav="${esc(item.path)}">${esc(item.label)}</a>`,
        )
        .join('')}
    </nav>`;
}

/* ── 이벤트 바인딩 ── */

function composeErrorText(msg) {
  return msg.includes('표시 이름') ? `${msg} 마이페이지에서 표시 이름을 설정한 후 다시 시도해 주세요.` : msg;
}

export function bindConcernScreenEvents(root, rerender) {
  // 네비게이션 링크
  root.querySelectorAll('[data-concern-nav]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const target = el.getAttribute('data-concern-nav') || getDefaultCommunityPath();
      navigate(target.startsWith('/') ? target : `/${target}`);
    });
  });
  root.querySelectorAll('[data-concern-nav-select]').forEach((el) => {
    el.addEventListener('change', () => {
      const target = el.value || '/community';
      navigate(target.startsWith('/') ? target : `/${target}`);
    });
  });

  // 안내 닫기
  root.querySelectorAll('[data-concern-flash-close]').forEach((btn) => {
    btn.addEventListener('click', () => {
      clearFlash();
      rerender();
    });
  });

  // 제목만 보기 — 클릭 시 상세로 이동 (상세 화면에서 안내 표시)
  root.querySelectorAll('[data-concern-title-only]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const target = el.getAttribute('data-concern-title-only') || '';
      if (target) navigate(target.startsWith('/') ? target : `/${target}`);
    });
  });

  // 목록 첫 페이지 (서버 정렬·종류 필터)
  root.querySelectorAll('[data-concern-board-load]').forEach((el) => {
    const boardKey = el.getAttribute('data-concern-board-load');
    if (!boardKey) return;
    const query = {
      sort: el.getAttribute('data-concern-sort') || 'recent',
      type: el.getAttribute('data-concern-type') || '',
    };
    fetchConcernPosts(boardKey, query)
      .then(() => rerender())
      .catch((err) => {
        el.innerHTML = `<p class="concern-error" role="alert">${esc(err.message || '글 목록을 불러오지 못했어요.')}</p>`;
      });
  });

  // 더 보기 (다음 페이지)
  root.querySelectorAll('[data-concern-more]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const boardKey = btn.getAttribute('data-concern-more');
      if (!boardKey) return;
      const errorEl = btn.parentElement?.querySelector('[data-concern-more-error]');
      btn.disabled = true;
      btn.textContent = '불러오는 중…';
      if (errorEl) errorEl.hidden = true;
      try {
        await fetchMoreConcernPosts(boardKey);
        rerender();
      } catch (err) {
        btn.disabled = false;
        btn.textContent = '더 보기';
        if (errorEl) {
          errorEl.textContent = err.message || '다음 글을 불러오지 못했어요. 잠시 후 다시 눌러 주세요.';
          errorEl.hidden = false;
        }
      }
    });
  });

  // 상세 단건 로딩
  root.querySelectorAll('[data-concern-detail-load]').forEach((el) => {
    const boardKey = el.getAttribute('data-concern-detail-load');
    const postId = el.getAttribute('data-concern-detail-post');
    if (!boardKey || !postId) return;
    fetchConcernPost(boardKey, postId)
      .then(() => rerender())
      .catch((err) => {
        el.innerHTML = `<p class="concern-error" role="alert">${esc(err.message || '글을 불러오지 못했어요.')}</p>`;
      });
  });

  // 댓글 영역 비동기 로딩
  root.querySelectorAll('[data-concern-comments-zone]').forEach((zone) => {
    const numericId = Number(zone.getAttribute('data-concern-comments-zone'));
    const boardKey = zone.getAttribute('data-concern-board-key') || '';
    if (!numericId) return;
    const body = zone.querySelector('.concern-comments__body');
    if (!body) return;

    const role = getNavRole();
    const access = getBoardAccess(boardKey, role);
    const user = getAuthUser();
    const currentUserId = user ? Number(user.user_id) : 0;

    fetchComments(numericId)
      .then((comments) => {
        const title = zone.querySelector('.concern-comments__title');
        const total = countAllComments(comments);
        if (title) title.textContent = `댓글 ${total}`;

        body.innerHTML = renderCommentsTree(comments, access, currentUserId, numericId, boardKey);

        if (access.canComment) {
          body.insertAdjacentHTML('beforeend', renderCommentForm(numericId));
        } else if (role === 'guest') {
          body.insertAdjacentHTML('beforeend', `<p class="concern-note">로그인 후 댓글을 남길 수 있습니다.</p>`);
        } else {
          body.insertAdjacentHTML('beforeend', `<p class="concern-note">${esc(roleGateCopy(boardKey, role).body)}</p>`);
        }

        bindCommentEvents(zone, numericId, boardKey, access, currentUserId, rerender);
      })
      .catch((err) => {
        body.innerHTML = `<p class="concern-error" role="alert">${esc(err.message || '댓글을 불러오지 못했습니다.')}</p>`;
      });
  });

  // 글 반응
  root.querySelectorAll('[data-concern-react-post]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (btn.hasAttribute('disabled')) return;
      const postId = Number(btn.getAttribute('data-concern-react-post'));
      const postKey = btn.getAttribute('data-concern-post-key') || '';
      const boardKey = btn.getAttribute('data-concern-board') || '';
      const kind = btn.getAttribute('data-concern-react-kind');
      if (!postId || !kind) return;
      btn.disabled = true;
      clearFlash();
      try {
        const result = await toggleReaction(postId, kind);
        if (boardKey && postKey) applyPostReaction(boardKey, postKey, result);
        rerender();
      } catch (err) {
        setFlash(currentPathOnly(), 'error', err.message || '반응 처리에 실패했습니다.');
        rerender();
      }
    });
  });

  // 글 삭제 (화면 안 확인)
  root.querySelectorAll('[data-concern-delete-post]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const postKey = btn.getAttribute('data-concern-delete-post');
      const boardKey = btn.getAttribute('data-concern-board');
      if (!postKey || !boardKey) return;
      const listPath = currentPathOnly().split('/').slice(0, 3).join('/');
      openInlineConfirm(root.querySelector('[data-concern-post-confirm-slot]'), {
        id: 'delete-post',
        title: '이 글을 삭제할까요?',
        body: '삭제한 글과 달린 댓글은 다시 볼 수 없어요.',
        confirmLabel: '삭제하기',
        danger: true,
        errorText: '삭제에 실패했습니다.',
        onConfirm: async () => {
          await deleteConcernPost(boardKey, postKey);
          setFlash(listPath, 'success', '글을 삭제했어요.');
          navigate(listPath);
        },
      });
    });
  });

  // 글 신고 (화면 안 확인 + 사유)
  root.querySelectorAll('[data-concern-report-post]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const postId = Number(btn.getAttribute('data-concern-report-post'));
      const postKey = btn.getAttribute('data-concern-post-key') || '';
      const boardKey = btn.getAttribute('data-concern-board') || '';
      if (!postId) return;
      const detailPath = currentPathOnly();
      const listPath = detailPath.split('/').slice(0, 3).join('/');
      openInlineConfirm(root.querySelector('[data-concern-post-confirm-slot]'), {
        id: 'report-post',
        title: '이 글을 신고할까요?',
        body: '같은 글은 한 번만 신고할 수 있어요.',
        confirmLabel: '신고하기',
        withReason: true,
        errorText: '신고 처리에 실패했습니다.',
        onConfirm: async (reason) => {
          const result = await reportContent(postId, reason);
          if (result.autoHidden) {
            if (boardKey) invalidateConcernList(boardKey);
            if (boardKey && postKey) await fetchConcernPost(boardKey, postKey).catch(() => {});
            setFlash(listPath, 'success', '신고가 접수되었어요. 신고가 여러 건 모여 이 글은 목록에서 내려갔어요.');
            navigate(listPath);
            return;
          }
          setFlash(detailPath, 'success', '신고가 접수되었어요.');
          rerender();
        },
      });
    });
  });

  // 글쓰기 폼
  root.querySelectorAll('[data-concern-compose]').forEach((form) => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const boardKey = form.getAttribute('data-concern-compose');
      const basePath = form.getAttribute('data-concern-path') || getDefaultCommunityPath();
      if (!boardKey) return;
      const fd = new FormData(form);
      const title = String(fd.get('title') || '').trim();
      const body = String(fd.get('body') || '').trim();
      const type = String(fd.get('type') || CONCERN_DEFAULT_POST_TYPE);
      const errorEl = form.querySelector('[data-concern-compose-error]');
      if (!title || !body) {
        if (errorEl) {
          errorEl.textContent = '제목과 본문을 모두 적어 주세요.';
          errorEl.hidden = false;
        }
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;
      if (errorEl) { errorEl.hidden = true; errorEl.textContent = ''; }

      try {
        const post = await saveConcernPost({ boardKey, title, body, type });
        const detailPath = `${basePath}/${post.id}`;
        setFlash(detailPath, 'success', '글을 올렸어요.');
        navigate(detailPath);
      } catch (err) {
        if (errorEl) {
          errorEl.textContent = composeErrorText(err.message || '글 저장에 실패했습니다.');
          errorEl.hidden = false;
        }
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  });

  // 글 수정 폼
  root.querySelectorAll('[data-concern-edit]').forEach((form) => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const boardKey = form.getAttribute('data-concern-edit');
      const postKey = form.getAttribute('data-concern-edit-post');
      const basePath = form.getAttribute('data-concern-path') || getDefaultCommunityPath();
      if (!boardKey || !postKey) return;
      const fd = new FormData(form);
      const title = String(fd.get('title') || '').trim();
      const body = String(fd.get('body') || '').trim();
      const errorEl = form.querySelector('[data-concern-compose-error]');
      if (!title || !body) {
        if (errorEl) {
          errorEl.textContent = '제목과 본문을 모두 적어 주세요.';
          errorEl.hidden = false;
        }
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;
      if (errorEl) { errorEl.hidden = true; errorEl.textContent = ''; }

      try {
        const post = await saveConcernPost({ boardKey, postKey, title, body });
        const detailPath = `${basePath}/${post.id}`;
        setFlash(detailPath, 'success', '글을 수정했어요.');
        navigate(detailPath);
      } catch (err) {
        if (errorEl) {
          errorEl.textContent = composeErrorText(err.message || '글 수정에 실패했습니다.');
          errorEl.hidden = false;
        }
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  });
}

/* ── 댓글 폼 ── */

function renderCommentForm(postId, parentCommentId) {
  const parentAttr = parentCommentId ? ` data-concern-parent-comment="${parentCommentId}"` : '';
  return `
    <form class="concern-comment-form" data-concern-comment-form="${postId}"${parentAttr}>
      <label class="concern-field">
        <span>${parentCommentId ? '답글' : '댓글'}</span>
        <textarea name="body" rows="3" maxlength="2000" placeholder="짧은 조언이나 경험을 남겨주세요" required></textarea>
      </label>
      <div class="concern-comment-form__error" data-concern-comment-error role="alert" hidden></div>
      <button type="submit" class="btn btn--primary btn--sm">${parentCommentId ? '답글 남기기' : '댓글 남기기'}</button>
    </form>`;
}

function countAllComments(comments) {
  let n = 0;
  for (const c of comments) {
    n += 1;
    if (c.replies) n += c.replies.length;
  }
  return n;
}

/* ── 댓글 영역 내부 이벤트 ── */

function bindCommentEvents(zone, numericPostId, boardKey, access, currentUserId, rerender) {
  // 댓글 작성
  zone.querySelectorAll('[data-concern-comment-form]').forEach((form) => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const parentId = form.getAttribute('data-concern-parent-comment') || null;
      const fd = new FormData(form);
      const body = String(fd.get('body') || '').trim();
      const errorEl = form.querySelector('[data-concern-comment-error]');
      if (!body) {
        if (errorEl) {
          errorEl.textContent = '내용을 적어 주세요.';
          errorEl.hidden = false;
        }
        return;
      }
      const btn = form.querySelector('button[type="submit"]');
      if (btn) btn.disabled = true;
      if (errorEl) { errorEl.hidden = true; errorEl.textContent = ''; }
      try {
        await addComment(numericPostId, {
          body,
          parentCommentId: parentId ? Number(parentId) : undefined,
        });
        invalidateConcernList(boardKey);
        setFlash(currentPathOnly(), 'success', parentId ? '답글을 남겼어요.' : '댓글을 남겼어요.');
        rerender();
      } catch (err) {
        if (errorEl) {
          errorEl.textContent = composeErrorText(err.message || '댓글 작성에 실패했습니다.');
          errorEl.hidden = false;
        }
        if (btn) btn.disabled = false;
      }
    });
  });

  // 댓글 삭제 (본인 댓글, 화면 안 확인)
  zone.querySelectorAll('[data-concern-delete-comment]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const commentId = Number(btn.getAttribute('data-concern-delete-comment'));
      if (!commentId) return;
      openInlineConfirm(zone.querySelector(`[data-comment-confirm-slot="${commentId}"]`), {
        id: 'delete-comment',
        title: '이 댓글을 삭제할까요?',
        body: '삭제하면 「삭제된 댓글입니다」로 바뀌고 되돌릴 수 없어요.',
        confirmLabel: '삭제하기',
        danger: true,
        errorText: '댓글 삭제에 실패했습니다.',
        onConfirm: async () => {
          await deleteComment(commentId);
          invalidateConcernList(boardKey);
          setFlash(currentPathOnly(), 'success', '댓글을 삭제했어요.');
          rerender();
        },
      });
    });
  });

  // 댓글 반응
  zone.querySelectorAll('[data-concern-react-comment]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (btn.hasAttribute('disabled')) return;
      const commentId = Number(btn.getAttribute('data-concern-react-comment'));
      const postId = Number(btn.getAttribute('data-concern-react-comment-post'));
      const kind = btn.getAttribute('data-concern-react-kind');
      if (!commentId || !postId || !kind) return;
      btn.disabled = true;
      clearFlash();
      try {
        await toggleReaction(postId, kind, commentId);
        rerender();
      } catch (err) {
        setFlash(currentPathOnly(), 'error', err.message || '반응 처리에 실패했습니다.');
        rerender();
      }
    });
  });

  // 댓글 신고 (화면 안 확인 + 사유)
  zone.querySelectorAll('[data-concern-report-comment]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const commentId = Number(btn.getAttribute('data-concern-report-comment'));
      const postId = Number(btn.getAttribute('data-concern-report-comment-post'));
      if (!commentId || !postId) return;
      openInlineConfirm(zone.querySelector(`[data-comment-confirm-slot="${commentId}"]`), {
        id: 'report-comment',
        title: '이 댓글을 신고할까요?',
        body: '같은 댓글은 한 번만 신고할 수 있어요.',
        confirmLabel: '신고하기',
        withReason: true,
        errorText: '신고 처리에 실패했습니다.',
        onConfirm: async (reason) => {
          const result = await reportContent(postId, reason, commentId);
          setFlash(
            currentPathOnly(),
            'success',
            result.autoHidden
              ? '신고가 접수되었어요. 신고가 여러 건 모여 이 댓글은 가려졌어요.'
              : '신고가 접수되었어요.',
          );
          rerender();
        },
      });
    });
  });

  // 답글 버튼
  zone.querySelectorAll('[data-concern-reply-to]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const parentId = btn.getAttribute('data-concern-reply-to');
      const postId = btn.getAttribute('data-concern-reply-post');
      if (!parentId || !postId) return;
      const slot = zone.querySelector(`[data-reply-slot="${parentId}"]`);
      if (!slot) return;
      if (slot.querySelector('form')) {
        slot.innerHTML = '';
        return;
      }
      slot.innerHTML = renderCommentForm(postId, parentId);
      bindCommentEvents(slot, Number(postId), boardKey, access, currentUserId, rerender);
    });
  });
}
