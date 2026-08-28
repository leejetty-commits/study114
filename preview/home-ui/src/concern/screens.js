import {
  listCommunityBoards,
  CONCERN_COMPOSE_HINT,
  CONCERN_HUB_LEAD,
  CONCERN_POST_TYPES,
  CONCERN_REACTIONS,
  getConcernBoardByKey,
} from './copy.js';
import { concernBoardNav, getConcernView, getDefaultCommunityPath } from './router.js';
import {
  addConcernComment,
  createConcernPost,
  getConcernPost,
  hasMyReaction,
  listConcernPosts,
  reactionTotal,
  toggleConcernReaction,
} from './store.js';
import { getNavRole, navigate } from '../state.js';
import {
  boardLoginHref,
  canCommentBoard,
  canComposeBoard,
  canDiscoverBoard,
  canListBoard,
  getBoardAccess,
  getChannelIntro,
  roleGateCopy,
} from '../board-channel-acl.js';
import { renderStateCard } from '../empty-state-copy.js';

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
}

function formatTime(iso) {
  try {
    return new Date(iso).toLocaleString('ko-KR', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

function typeBadge(type) {
  const meta = CONCERN_POST_TYPES[type] || CONCERN_POST_TYPES.worry;
  return `<span class="concern-type">${esc(meta.label)}</span>`;
}

function authorLine(post) {
  return `${esc(post.authorName)} · ${esc(post.authorRoleLabel)} · ${esc(formatTime(post.createdAt))}`;
}

function renderPostRow(post) {
  const board = getConcernBoardByKey(post.boardKey);
  const href = `${board?.path || getDefaultCommunityPath()}/${post.id}`;
  return `
    <a class="concern-row" href="#${esc(href)}" data-concern-nav="${esc(href)}">
      <div class="concern-row__head">
        ${typeBadge(post.type)}${post.pinned ? '<span class="concern-pin">고정</span>' : ''}
        <strong class="concern-row__title">${esc(post.title)}</strong>
      </div>
      <span class="concern-row__sub">${authorLine(post)}</span>
      <span class="concern-row__stats">댓글 ${post.comments?.length || 0} · 반응 ${reactionTotal(post)}</span>
    </a>`;
}

function renderCommunityAlerts(navRole) {
  const alerts = listCommunityBoards()
    .filter((board) => canListBoard(board.boardKey, navRole))
    .flatMap((board) => listConcernPosts(board.boardKey))
    .filter((p) => p.type === 'community_alert' && p.pinned)
    .slice(0, 2);
  if (!alerts.length) return '';
  return `
    <section class="concern-alert-strip" aria-label="커뮤니티 알림">
      ${alerts
        .map((post) => {
          const board = getConcernBoardByKey(post.boardKey);
          const href = `${board?.path || getDefaultCommunityPath()}/${post.id}`;
          return `
            <a class="concern-alert-card" href="#${esc(href)}" data-concern-nav="${esc(href)}">
              <span class="concern-alert-card__label">커뮤니티 알림</span>
              <strong class="concern-alert-card__title">${esc(post.title)}</strong>
            </a>`;
        })
        .join('')}
    </section>`;
}

function renderCommunityIntro(navRole) {
  return `
    ${renderCommunityAlerts(navRole)}
    <section class="concern-hero">
      <p class="concern-eyebrow">현장형 커뮤니티</p>
      <p class="concern-hero__lead">${esc(CONCERN_HUB_LEAD)}</p>
    </section>`;
}

function renderChannelIntroCard(board, role) {
  const intro = getChannelIntro(board.boardKey);
  const gate = roleGateCopy(board.boardKey, role);
  const links =
    role === 'guest'
      ? [
          { label: '로그인', href: boardLoginHref('community') },
          { label: '다른 게시판', href: `#${getDefaultCommunityPath()}` },
        ]
      : [{ label: '다른 게시판', href: `#${getDefaultCommunityPath()}` }];
  return `
    <section class="concern-hero">
      <p class="concern-eyebrow">${esc(board.roleHint)}</p>
      <p class="concern-hero__lead">${esc(intro.body)}</p>
    </section>
    ${renderStateCard({
      title: gate.title,
      body: gate.body,
      links,
    })}`;
}

function renderList(board, query) {
  const role = getNavRole();
  if (!canDiscoverBoard(board.boardKey, role)) {
    return renderBoardBlocked(board, role);
  }
  const access = getBoardAccess(board.boardKey, role);
  if (!access.canList) {
    return `
      ${renderCommunityIntro(role)}
      ${renderChannelIntroCard(board, role)}`;
  }
  const type = query.get('type') || 'all';
  const sort = query.get('sort') || 'recent';
  const posts = listConcernPosts(board.boardKey, { type, sort });
  const filters = [
    { id: 'all', label: '전체' },
    ...Object.entries(CONCERN_POST_TYPES).map(([id, meta]) => ({ id, label: meta.label })),
  ];
  const writeBtn = access.canCompose
    ? `<a class="guide-btn guide-btn--primary" href="#${esc(board.path)}/new" data-concern-nav="${esc(board.path)}/new">글쓰기</a>`
    : role === 'guest'
      ? `<a class="guide-btn guide-btn--secondary" href="${esc(boardLoginHref('community-compose'))}">로그인 후 글쓰기</a>`
      : '';
  const readonlyNote =
    access.canDetail && !access.canCompose
      ? `<p class="concern-note">${esc(roleGateCopy(board.boardKey, role).body)}</p>`
      : '';
  return `
    ${renderCommunityIntro(role)}
    <section class="concern-list-head">
      <p class="concern-eyebrow">${esc(board.roleHint)}</p>
      ${writeBtn}
    </section>
    ${readonlyNote}
    <div class="concern-filters" role="tablist" aria-label="글 유형">
      ${filters
        .map(
          (f) => `
        <a class="concern-filter${type === f.id ? ' is-active' : ''}"
           href="#${esc(board.path)}?type=${esc(f.id)}&sort=${esc(sort)}"
           data-concern-nav="${esc(board.path)}?type=${esc(f.id)}&sort=${esc(sort)}">${esc(f.label)}</a>`,
        )
        .join('')}
    </div>
    <div class="concern-sort">
      <a class="concern-sort__link${sort === 'recent' ? ' is-active' : ''}" href="#${esc(board.path)}?type=${esc(type)}&sort=recent" data-concern-nav="${esc(board.path)}?type=${esc(type)}&sort=recent">최신</a>
      <a class="concern-sort__link${sort === 'hot' ? ' is-active' : ''}" href="#${esc(board.path)}?type=${esc(type)}&sort=hot" data-concern-nav="${esc(board.path)}?type=${esc(type)}&sort=hot">공감·HOT</a>
      <a class="concern-sort__link${sort === 'comments' ? ' is-active' : ''}" href="#${esc(board.path)}?type=${esc(type)}&sort=comments" data-concern-nav="${esc(board.path)}?type=${esc(type)}&sort=comments">댓글많은</a>
    </div>
    <div class="concern-list">
      ${
        posts.length
          ? posts.map((p) => renderPostRow(p)).join('')
          : '<p class="concern-empty">아직 글이 없습니다. 첫 고민을 남겨보세요.</p>'
      }
    </div>`;
}

function renderReactions(post, enabled) {
  return `
    <div class="concern-reactions" data-concern-post="${esc(post.id)}">
      ${Object.entries(CONCERN_REACTIONS)
        .map(([key, meta]) => {
          const active = hasMyReaction(post.id, key) ? ' is-active' : '';
          const count = Number(post.reactions?.[key] || 0);
          const disabled = enabled ? '' : ' disabled';
          return `<button type="button" class="concern-reaction${active}" data-concern-reaction="${esc(key)}" aria-pressed="${active ? 'true' : 'false'}"${disabled}>${esc(meta.emoji)} ${esc(meta.label)} <strong>${count}</strong></button>`;
        })
        .join('')}
    </div>`;
}

function renderBoardBlocked(board, role) {
  const gate = roleGateCopy(board.boardKey, role);
  const intro = getChannelIntro(board.boardKey);
  if (role === 'guest') {
    return renderStateCard({
      title: intro.title,
      body: gate.body,
      links: [
        { label: '로그인', href: boardLoginHref('community') },
        { label: '다른 게시판', href: `#${getDefaultCommunityPath()}` },
      ],
    });
  }
  return renderStateCard({
    title: intro.title,
    body: gate.body,
    links: [{ label: '다른 게시판', href: `#${getDefaultCommunityPath()}` }],
  });
}

function renderDetail(board, postId) {
  const role = getNavRole();
  if (!canDiscoverBoard(board.boardKey, role)) {
    return renderBoardBlocked(board, role);
  }
  const access = getBoardAccess(board.boardKey, role);
  if (!access.canList || !access.canDetail) {
    return `
      <article class="concern-detail">
        <a class="concern-back" href="#${esc(board.path)}" data-concern-nav="${esc(board.path)}">← ${esc(board.label)}</a>
        ${renderChannelIntroCard(board, role)}
      </article>`;
  }
  const post = getConcernPost(postId);
  if (!post || post.boardKey !== board.boardKey) {
    return `<p class="concern-empty">글을 찾을 수 없습니다. <a href="#${esc(board.path)}" data-concern-nav="${esc(board.path)}">목록으로</a></p>`;
  }

  const bodyHtml = `<div class="concern-detail__body">${esc(post.body)}</div>`;
  const reactionsHtml = renderReactions(post, access.canComment);
  const commentsHtml = `
      <section class="concern-comments">
        <h3 class="concern-comments__title">댓글 ${post.comments?.length || 0}</h3>
        <ul class="concern-comments__list">
          ${(post.comments || [])
            .map(
              (c) => `
            <li class="concern-comment">
              <strong>${esc(c.authorName)}</strong>
              <span>${esc(formatTime(c.createdAt))}</span>
              <p>${esc(c.body)}</p>
            </li>`,
            )
            .join('') || '<li class="concern-empty">아직 댓글이 없습니다.</li>'}
        </ul>
        ${
          access.canComment
            ? `<form class="concern-comment-form" data-concern-comment-form="${esc(post.id)}">
          <label class="concern-field">
            <span>댓글</span>
            <textarea name="body" rows="3" maxlength="500" placeholder="짧은 조언이나 경험을 남겨주세요" required></textarea>
          </label>
          <button type="submit" class="guide-btn guide-btn--primary">댓글 남기기</button>
        </form>`
            : `<p class="concern-note">${esc(roleGateCopy(board.boardKey, role).body)}</p>`
        }
      </section>`;

  return `
    <article class="concern-detail">
      <a class="concern-back" href="#${esc(board.path)}" data-concern-nav="${esc(board.path)}">← ${esc(board.label)}</a>
      <div class="concern-detail__meta">${typeBadge(post.type)}${post.pinned ? ' <span class="concern-pin">고정</span>' : ''}</div>
      <h2 class="concern-detail__title">${esc(post.title)}</h2>
      <p class="concern-detail__author">${authorLine(post)}</p>
      ${bodyHtml}
      ${reactionsHtml}
      ${commentsHtml}
    </article>`;
}

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
  const defaultType = board.defaultTypes?.[0] || 'worry';
  return `
    <section class="concern-compose">
      <a class="concern-back" href="#${esc(board.path)}" data-concern-nav="${esc(board.path)}">← ${esc(board.label)}</a>
      <p class="concern-compose__hint">${esc(CONCERN_COMPOSE_HINT)}</p>
      <form class="concern-compose-form" data-concern-compose="${esc(board.boardKey)}" data-concern-path="${esc(board.path)}">
        <label class="concern-field">
          <span>글 타입</span>
          <select name="type">
            ${Object.entries(CONCERN_POST_TYPES)
              .filter(([id]) => id !== 'community_alert')
              .map(([id, meta]) => `<option value="${esc(id)}"${id === defaultType ? ' selected' : ''}>${esc(meta.label)}</option>`)
              .join('')}
          </select>
        </label>
        <label class="concern-field">
          <span>제목</span>
          <input name="title" maxlength="80" required placeholder="말 걸고 싶은 제목" />
        </label>
        <label class="concern-field">
          <span>본문</span>
          <textarea name="body" rows="8" maxlength="2000" required placeholder="짧은 경험이나 고민을 적어주세요"></textarea>
        </label>
        <p class="concern-compose__image-note">이미지 첨부(1~3장)는 상세에서만 크게 보이도록 후속 연결 예정입니다.</p>
        <button type="submit" class="guide-btn guide-btn--primary">올리기</button>
      </form>
    </section>`;
}

export function renderConcernScreen(path) {
  const pathOnly = path.split('?')[0];
  const query = new URLSearchParams(path.includes('?') ? path.slice(path.indexOf('?') + 1) : '');
  const view = getConcernView(pathOnly);
  if (view.kind === 'compose') return renderCompose(view.board);
  if (view.kind === 'detail') return renderDetail(view.board, view.postId);
  if (!view.board) return '<p class="concern-empty">게시판을 찾을 수 없습니다.</p>';
  return renderList(view.board, query);
}

export function renderConcernSideNav(currentPath) {
  const pathOnly = currentPath.split('?')[0];
  const role = getNavRole();
  const items = concernBoardNav(pathOnly)
    .filter((b) => canDiscoverBoard(b.boardKey, role))
    .map((b) => ({
      label: b.label,
      path: b.path,
      active: b.active,
    }));
  return `
    <nav class="concern-nav" aria-label="커뮤니티 메뉴">
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

function roleAuthorMeta() {
  const role = getNavRole();
  if (role === 'study_room') return { authorName: '공부방회원', authorRoleLabel: '공부방' };
  if (role === 'tutor') return { authorName: '과외쌤회원', authorRoleLabel: '과외쌤' };
  if (role === 'parent') return { authorName: '학부모회원', authorRoleLabel: '학부모' };
  return { authorName: '방문회원', authorRoleLabel: '게스트' };
}

export function bindConcernScreenEvents(root, rerender) {
  root.querySelectorAll('[data-concern-nav]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const target = el.getAttribute('data-concern-nav') || getDefaultCommunityPath();
      navigate(target.startsWith('/') ? target : `/${target}`);
    });
  });

  root.querySelectorAll('[data-concern-reaction]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.hasAttribute('disabled')) return;
      const wrap = btn.closest('[data-concern-post]');
      const postId = wrap?.getAttribute('data-concern-post');
      const key = btn.getAttribute('data-concern-reaction');
      if (!postId || !key) return;
      const post = getConcernPost(postId);
      const role = getNavRole();
      if (!post || !canCommentBoard(post.boardKey, role)) return;
      toggleConcernReaction(postId, key);
      rerender();
    });
  });

  root.querySelectorAll('[data-concern-comment-form]').forEach((form) => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const postId = form.getAttribute('data-concern-comment-form');
      const fd = new FormData(form);
      const body = String(fd.get('body') || '').trim();
      if (!postId || !body) return;
      const post = getConcernPost(postId);
      const role = getNavRole();
      if (!post || !canCommentBoard(post.boardKey, role)) return;
      const meta = roleAuthorMeta();
      addConcernComment(postId, { authorName: meta.authorName, body });
      rerender();
    });
  });

  root.querySelectorAll('[data-concern-compose]').forEach((form) => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const boardKey = form.getAttribute('data-concern-compose');
      const basePath = form.getAttribute('data-concern-path') || getDefaultCommunityPath();
      const role = getNavRole();
      if (!boardKey || !canComposeBoard(boardKey, role)) return;
      const fd = new FormData(form);
      const title = String(fd.get('title') || '').trim();
      const body = String(fd.get('body') || '').trim();
      const type = String(fd.get('type') || 'worry');
      if (!title || !body) return;
      const meta = roleAuthorMeta();
      const post = createConcernPost({
        boardKey,
        type,
        title,
        body,
        authorName: meta.authorName,
        authorRoleLabel: meta.authorRoleLabel,
      });
      navigate(`${basePath}/${post.id}`);
    });
  });
}
