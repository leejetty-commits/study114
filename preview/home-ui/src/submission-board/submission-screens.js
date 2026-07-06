import { getNavRole, navigate } from '../state.js';
import {
  BOARD_ENGINE_LOCK,
  BOARD_TYPES,
  canBoardAction,
  getBoardPolicy,
  mapNavRoleToBoardRole,
} from '../board-engine-copy.js';
import { SUBMISSION_DOC_USER_NOTICE } from '../admin-red-line-copy.js';
import {
  SUBMISSION_BOARD,
  SUBMISSION_CATEGORIES,
  SUBMISSION_DETAIL,
  SUBMISSION_FILE_POLICY,
  SUBMISSION_FORM,
  SUBMISSION_LIST,
  SUBMISSION_PERMISSION_DENIED,
  SUBMISSION_STATUS_LABELS,
  submissionVisibilityLabel,
} from './submission-copy.js';
import {
  createSubmissionPost,
  deleteSubmissionPost,
  getCategoryLabel,
  getSubmissionPost,
  listSubmissionPosts,
  updateSubmissionPost,
  apiOpenSubmissionAttachment,
} from './submission-store.js';
import { parseSubmissionBoardPath, SUBMISSION_BOARD_BASE } from './submission-router.js';

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

function renderEngineNote(compact = false) {
  if (compact) {
    return `<p class="sub-board-banner sub-board-banner--compact"><code>submission</code> · ${esc(BOARD_TYPES.upload.label)}</p>`;
  }
  return `
    <div class="sub-board-banner" role="note">
      <span class="sub-board-banner__tag">${esc(BOARD_ENGINE_LOCK.topConcept)} · <code>submission</code></span>
      <span class="sub-board-banner__type">${esc(BOARD_TYPES.upload.label)}</span>
      <p class="sub-board-banner__text">${esc(SUBMISSION_BOARD.whatIs)}</p>
      <ul class="sub-board-banner__list">
        <li><strong>업로드 가능:</strong> ${esc(SUBMISSION_BOARD.whoCanUpload)}</li>
        <li><strong>열람:</strong> ${esc(SUBMISSION_BOARD.whoCanRead)}</li>
      </ul>
    </div>`;
}

function renderPolicyChips(navRole) {
  const boardRole = mapNavRoleToBoardRole(navRole);
  const policy = getBoardPolicy('submission');
  if (!policy) return '';
  return `
    <div class="lib-policy-chips" aria-label="boardKey 권한">
      <span class="lib-chip lib-chip--type">${esc(BOARD_TYPES.upload.label)}</span>
      <span class="lib-chip">read: ${canBoardAction('submission', 'read', boardRole) ? '✓' : '✕'}</span>
      <span class="lib-chip">upload: ${canBoardAction('submission', 'upload', boardRole) ? '✓' : '✕'}</span>
    </div>`;
}

function renderBridge() {
  return `
    <div class="sub-board-bridge">
      <a href="#/mypage/submission-docs" class="btn btn--secondary btn--sm" data-mypage-nav="/mypage/submission-docs">P15-10 제출자료 상태</a>
      <span class="mypage-muted">${esc(SUBMISSION_BOARD.bridgeP15)}</span>
    </div>`;
}

function renderPermissionDenied() {
  return `
    <section class="mypage-panel">
      ${renderEngineNote()}
      <h2 class="mypage-panel__title">${esc(SUBMISSION_PERMISSION_DENIED.title)}</h2>
      <p class="mypage-muted">${esc(SUBMISSION_PERMISSION_DENIED.body)}</p>
      ${renderBridge()}
    </section>`;
}

function formatBytes(bytes) {
  const n = Number(bytes) || 0;
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function renderAttachmentLabel(post) {
  if (post.hasAttachment || post.attachment?.hasFile) {
    const name = post.attachment?.originalName || post.fileLabel;
    const size = post.attachment?.sizeBytes ? ` · ${formatBytes(post.attachment.sizeBytes)}` : '';
    return `<span class="sub-board-attach" title="${esc(name)}">📎 ${esc(name)}${esc(size)}</span>`;
  }
  if (post.fileLabel) {
    return `<span class="mypage-muted" title="파일명만 등록됨">📄 ${esc(post.fileLabel)}</span>`;
  }
  return '<span class="mypage-muted">—</span>';
}

function renderFilePolicy() {
  return `
    <div class="sub-board-file-policy">
      <strong>${esc(SUBMISSION_FORM.filePolicyTitle)}</strong>
      <ul>
        <li>형식: ${esc(SUBMISSION_FILE_POLICY.formats)}</li>
        <li>개수: ${SUBMISSION_FILE_POLICY.maxFiles}개</li>
        <li>용량: 최대 ${SUBMISSION_FILE_POLICY.maxSizeMb}MB</li>
      </ul>
      <p class="sup-note">${esc(SUBMISSION_FILE_POLICY.hint)}</p>
    </div>`;
}

/**
 * @param {object} [opts]
 * @param {import('./submission-store.js').SubmissionPost} [opts.post]
 * @param {boolean} opts.canUpload
 * @param {boolean} [opts.isEdit]
 */
function renderComposeForm({ post = null, canUpload, isEdit = false } = {}) {
  if (!canUpload) return `<p class="mypage-muted">업로드 권한이 없습니다.</p>`;
  const options = SUBMISSION_CATEGORIES.map(
    (c) =>
      `<option value="${esc(c.id)}"${post?.categoryId === c.id ? ' selected' : ''}>${esc(c.label)}</option>`,
  ).join('');
  return `
    <form class="sub-board-form" data-sub-form${post ? ` data-sub-edit="${esc(post.id)}"` : ''}>
      <h3 class="sub-board-form__title">${isEdit ? '제출 수정' : '새 자료 제출'}</h3>
      <label class="sup-field">
        <span>${esc(SUBMISSION_FORM.titleLabel)}</span>
        <input type="text" name="title" required maxlength="80" value="${esc(post?.title || '')}" placeholder="예: 학력 증명서 사본" />
      </label>
      <label class="sup-field">
        <span>${esc(SUBMISSION_FORM.descriptionLabel)}</span>
        <textarea name="description" rows="3" maxlength="500" placeholder="자료에 대한 간단한 설명">${esc(post?.description || '')}</textarea>
      </label>
      <label class="sup-field">
        <span>${esc(SUBMISSION_FORM.categoryLabel)}</span>
        <select name="category">${options}</select>
      </label>
      <label class="sup-field">
        <span>${esc(SUBMISSION_FORM.fileLabel)}</span>
        <input type="file" name="file" accept=".pdf,.jpg,.jpeg,.png" ${post ? '' : 'required'} />
        ${post?.hasAttachment || post?.attachment?.hasFile ? `<span class="sup-note">현재: ${esc(post.attachment?.originalName || post.fileLabel)} · 변경 시에만 선택</span>` : post ? `<span class="sup-note">현재: <code>${esc(post.fileLabel)}</code> · 파일 없음 · 변경 시 선택</span>` : ''}
      </label>
      ${renderFilePolicy()}
      <label class="sup-field">
        <span>${esc(SUBMISSION_FORM.memoLabel)}</span>
        <textarea name="memo" rows="2" maxlength="200" placeholder="본인만 보는 메모">${esc(post?.memo || '')}</textarea>
      </label>
      <div class="mypage-form-actions">
        <a href="#${SUBMISSION_BOARD_BASE}" class="btn btn--secondary" data-sub-nav="${SUBMISSION_BOARD_BASE}">취소</a>
        <button type="submit" class="btn btn--secondary" data-sub-action="draft">${esc(SUBMISSION_FORM.draftCta)}</button>
        <button type="submit" class="btn btn--primary" data-sub-action="submit">${esc(SUBMISSION_FORM.submitCta)}</button>
      </div>
    </form>`;
}

function renderPostActions(post, canUpload) {
  const view = `<a href="#${SUBMISSION_BOARD_BASE}/${esc(post.id)}" class="btn btn--secondary btn--sm" data-sub-nav="${SUBMISSION_BOARD_BASE}/${esc(post.id)}">${esc(SUBMISSION_LIST.viewCta)}</a>`;
  if (!canUpload) return view;
  const editable = post.status === 'draft' || post.status === 'submitted';
  const edit = editable
    ? ` <a href="#${SUBMISSION_BOARD_BASE}/${esc(post.id)}/edit" class="btn btn--secondary btn--sm" data-sub-nav="${SUBMISSION_BOARD_BASE}/${esc(post.id)}/edit">${esc(SUBMISSION_LIST.editCta)}</a>`
    : '';
  const del =
    post.status === 'draft' || post.status === 'submitted'
      ? ` <button type="button" class="btn btn--secondary btn--sm" data-sub-delete="${esc(post.id)}">${esc(SUBMISSION_LIST.deleteCta)}</button>`
      : '';
  return `${view}${edit}${del}`;
}

function renderPostRow(post, canUpload) {
  return `
    <tr data-sub-row="${esc(post.id)}">
      <td><a href="#${SUBMISSION_BOARD_BASE}/${esc(post.id)}" class="sub-board-link" data-sub-nav="${SUBMISSION_BOARD_BASE}/${esc(post.id)}">${esc(post.title)}</a></td>
      <td>${esc(getCategoryLabel(post.categoryId))}</td>
      <td>${renderAttachmentLabel(post)}</td>
      <td><span class="sub-board-status sub-board-status--${esc(post.status)}">${esc(SUBMISSION_STATUS_LABELS[post.status] || post.status)}</span></td>
      <td>${esc(submissionVisibilityLabel(post.status))}</td>
      <td>${esc(post.updatedAt)}</td>
      <td class="sub-board-actions">${renderPostActions(post, canUpload)}</td>
    </tr>`;
}

function renderHub(navRole, canUpload) {
  const posts = listSubmissionPosts(navRole === 'guest' ? 'tutor' : navRole);
  const rows = posts.length
    ? posts.map((p) => renderPostRow(p, canUpload)).join('')
    : `<tr><td colspan="7" class="mypage-muted">${esc(SUBMISSION_LIST.empty)}</td></tr>`;

  return `
    <section class="mypage-panel sub-board-panel">
      ${renderEngineNote()}
      <header class="sub-board-head">
        <div>
          <h2 class="mypage-panel__title">${esc(SUBMISSION_BOARD.title)}</h2>
          <p class="mypage-lead">${esc(SUBMISSION_BOARD.footnote)}</p>
          ${renderPolicyChips(navRole)}
        </div>
        <span class="mypage-badge">${esc(SUBMISSION_BOARD.screenId)} · <code>${esc(SUBMISSION_BOARD.boardKey)}</code></span>
      </header>
      <p class="mypage-note p22-trust-disclaimer">${esc(SUBMISSION_DOC_USER_NOTICE.lead)} ${esc(SUBMISSION_DOC_USER_NOTICE.body)}</p>
      ${renderBridge()}
      <div class="sub-board-list-head">
        <h3 class="sub-board-form__title">내 제출 목록</h3>
        ${canUpload ? `<a href="#${SUBMISSION_BOARD_BASE}/new" class="btn btn--primary btn--sm" data-sub-nav="${SUBMISSION_BOARD_BASE}/new">${esc(SUBMISSION_LIST.newCta)}</a>` : ''}
      </div>
      <table class="sub-board-table" aria-label="내 제출 목록">
        <thead>
          <tr>
            <th scope="col">제목</th>
            <th scope="col">유형</th>
            <th scope="col">첨부</th>
            <th scope="col">상태</th>
            <th scope="col">공개</th>
            <th scope="col">수정일</th>
            <th scope="col"></th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </section>`;
}

function renderDetail(post, navRole) {
  return `
    <section class="mypage-panel sub-board-panel">
      ${renderEngineNote(true)}
      <p class="mypage-note"><a href="#${SUBMISSION_BOARD_BASE}" data-sub-nav="${SUBMISSION_BOARD_BASE}">${esc(SUBMISSION_DETAIL.back)}</a></p>
      <header class="sub-board-head">
        <div>
          <h2 class="mypage-panel__title">${esc(post.title)}</h2>
          <p class="mypage-lead">${esc(post.description || '—')}</p>
        </div>
        <span class="mypage-badge">P23-04b · <code>submission</code></span>
      </header>
      <dl class="sub-board-dl">
        <dt>${esc(SUBMISSION_DETAIL.status)}</dt>
        <dd><span class="sub-board-status sub-board-status--${esc(post.status)}">${esc(SUBMISSION_STATUS_LABELS[post.status])}</span></dd>
        <dt>${esc(SUBMISSION_DETAIL.visibility)}</dt>
        <dd>${esc(submissionVisibilityLabel(post.status))}</dd>
        <dt>유형</dt>
        <dd>${esc(getCategoryLabel(post.categoryId))}</dd>
        <dt>${esc(SUBMISSION_DETAIL.attachment)}</dt>
        <dd>
          ${renderAttachmentLabel(post)}
          ${post.hasAttachment || post.attachment?.hasFile ? `<button type="button" class="btn btn--secondary btn--sm" data-sub-dl="${esc(post.id)}">다운로드</button>` : ''}
        </dd>
        <dt>${esc(SUBMISSION_DETAIL.memo)}</dt>
        <dd>${post.memo ? esc(post.memo) : '<span class="mypage-muted">—</span>'}</dd>
        <dt>등록일</dt>
        <dd>${esc(post.createdAt)}</dd>
        <dt>수정일</dt>
        <dd>${esc(post.updatedAt)}</dd>
      </dl>
      <div class="sub-board-actions sub-board-actions--foot">
        ${renderPostActions(post, canBoardAction('submission', 'upload', mapNavRoleToBoardRole(navRole)))}
      </div>
    </section>`;
}

function renderNotFound() {
  return `
    <section class="mypage-panel">
      <p class="mypage-muted">제출을 찾을 수 없습니다.</p>
      <a href="#${SUBMISSION_BOARD_BASE}" data-sub-nav="${SUBMISSION_BOARD_BASE}">${esc(SUBMISSION_DETAIL.back)}</a>
    </section>`;
}

/** @param {string} path */
export function renderSubmissionBoardScreen(path = SUBMISSION_BOARD_BASE) {
  const navRole = getNavRole();
  const boardRole = mapNavRoleToBoardRole(navRole);
  const canRead = canBoardAction('submission', 'read', boardRole);
  const canUpload = canBoardAction('submission', 'upload', boardRole);
  const parsed = parseSubmissionBoardPath(path);

  if (!canRead) return renderPermissionDenied();

  const role = navRole === 'guest' ? 'tutor' : navRole;

  if (parsed.view === 'new') {
    return `
      <section class="mypage-panel sub-board-panel">
        ${renderEngineNote(true)}
        <p class="mypage-note"><a href="#${SUBMISSION_BOARD_BASE}" data-sub-nav="${SUBMISSION_BOARD_BASE}">${esc(SUBMISSION_DETAIL.back)}</a></p>
        <span class="mypage-badge">P23-04a · 작성</span>
        ${renderComposeForm({ canUpload })}
      </section>`;
  }

  if (parsed.view === 'edit' && parsed.id) {
    const post = getSubmissionPost(parsed.id, role);
    if (!post) return renderNotFound();
    if (post.status !== 'draft' && post.status !== 'submitted') {
      return renderDetail(post, navRole);
    }
    return `
      <section class="mypage-panel sub-board-panel">
        ${renderEngineNote(true)}
        <p class="mypage-note"><a href="#${SUBMISSION_BOARD_BASE}/${esc(post.id)}" data-sub-nav="${SUBMISSION_BOARD_BASE}/${esc(post.id)}">← 상세</a></p>
        <span class="mypage-badge">P23-04a · 수정</span>
        ${renderComposeForm({ post, canUpload, isEdit: true })}
      </section>`;
  }

  if (parsed.view === 'detail' && parsed.id) {
    const post = getSubmissionPost(parsed.id, role);
    if (!post) return renderNotFound();
    return renderDetail(post, navRole);
  }

  return renderHub(navRole, canUpload);
}

function readFormPayload(form) {
  const fd = new FormData(form);
  const title = String(fd.get('title') || '').trim();
  const fileInput = form.querySelector('input[name="file"]');
  const file = fileInput?.files?.[0];
  return {
    title,
    description: String(fd.get('description') || ''),
    categoryId: String(fd.get('category') || 'other'),
    fileLabel: file?.name,
    file,
    memo: String(fd.get('memo') || ''),
    status: /** @type {'draft'|'submitted'} */ ('draft'),
  };
}

/** @param {HTMLElement} root @param {() => void} rerender */
export function bindSubmissionBoardEvents(root, rerender) {
  root.querySelectorAll('[data-sub-nav]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      navigate(el.getAttribute('data-sub-nav') || SUBMISSION_BOARD_BASE);
    });
  });

  const form = root.querySelector('[data-sub-form]');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitter = e.submitter;
      const action = submitter?.getAttribute('data-sub-action') || 'submit';
      const payload = readFormPayload(form);
      if (!payload.title) {
        window.alert('제목을 입력해 주세요.');
        return;
      }
      const editId = form.getAttribute('data-sub-edit');
      const status = action === 'draft' ? 'draft' : 'submitted';
      const file = payload.file;
      if (!editId && !file) {
        window.alert('첨부 파일을 선택해 주세요.');
        return;
      }

      const navRole = getNavRole();
      try {
        if (editId) {
          const existing = getSubmissionPost(editId, navRole);
          await updateSubmissionPost(
            editId,
            {
              ...payload,
              status,
              fileLabel: file?.name || existing?.fileLabel,
            },
            navRole,
            file || null,
          );
          navigate(`${SUBMISSION_BOARD_BASE}/${editId}`);
        } else {
          const post = await createSubmissionPost(
            { ...payload, status, fileLabel: file?.name || 'attachment.pdf' },
            navRole,
            file || null,
          );
          navigate(`${SUBMISSION_BOARD_BASE}/${post.id}`);
        }
        rerender();
      } catch (err) {
        window.alert(err instanceof Error ? err.message : '저장에 실패했습니다.');
      }
    });
  }

  root.querySelectorAll('[data-sub-delete]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-sub-delete');
      if (!id) return;
      if (window.confirm('이 제출을 삭제할까요?')) {
        try {
          await deleteSubmissionPost(id, getNavRole());
          navigate(SUBMISSION_BOARD_BASE);
          rerender();
        } catch (err) {
          window.alert(err instanceof Error ? err.message : '삭제에 실패했습니다.');
        }
      }
    });
  });

  root.querySelectorAll('[data-sub-dl]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-sub-dl');
      if (!id) return;
      try {
        await apiOpenSubmissionAttachment(id, { authorRole: getNavRole() });
      } catch (err) {
        window.alert(err instanceof Error ? err.message : '첨부를 열 수 없습니다.');
      }
    });
  });
}
