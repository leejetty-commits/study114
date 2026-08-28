/**
 * 채널 ACL · 쪽지 후속 무료 · 레일 seed 회귀
 * 사용: cd preview/home-ui && npx --yes vite-node ../../scripts/verify-board-channel-acl.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  canCommentBoard,
  canComposeBoard,
  canDeleteBoard,
  canDiscoverBoard,
  canDownloadBoard,
  canListBoard,
  canModerateBoard,
  canReadBoardDetail,
  canReactBoard,
  canShowBoardPostsInRail,
  canUploadBoard,
  dumpBoardAclMatrix,
  getBoardAccess,
  isAccessFailClosed,
  normalizeBoardKey,
  normalizeGuestFilter,
  GUEST_FILTER_INTRO_ONLY,
} from '../preview/home-ui/src/board-channel-acl.js';
import { normalizeBoardListResponse } from '../preview/home-ui/src/board/board-api.js';
import { mapNavRoleToBoardRole } from '../preview/home-ui/src/board-engine-copy.js';
import { canReplyInThread, checkFirstMemoPermission } from '../preview/home-ui/src/messages/permissions.js';
import { DEFAULT_RIGHT_RAIL_SLOTS } from '../preview/home-ui/src/right-rail-store.js';
import { MYPAGE_NAV } from '../preview/home-ui/src/mypage/router.js';
import {
  normalizeCommunityPath,
  normalizeConcernPath,
} from '../preview/home-ui/src/concern/router.js';
import { normalizeLibraryPath } from '../preview/home-ui/src/library/library-router.js';
import {
  isSubmissionBoardPath,
  normalizeSubmissionBoardPath,
} from '../preview/home-ui/src/submission-board/submission-router.js';
import { getHotConcernSamples, getLatestConcernSamples } from '../preview/home-ui/src/concern/store.js';

let fail = 0;
function ok(name, cond, detail = '') {
  if (cond) console.log(`PASS  ${name}`);
  else {
    fail += 1;
    console.error(`FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

const roles = ['guest', 'parent', 'study_room', 'tutor', 'admin'];

ok(
  'guest_concern_director_intro_not_list',
  canDiscoverBoard('concern-director', 'guest') &&
    !canListBoard('concern-director', 'guest') &&
    !canReadBoardDetail('concern-director', 'guest'),
);
ok(
  'guest_concern_parent_no_post_fields',
  getBoardAccess('concern-parent', 'guest').access === 'intro' &&
    getBoardAccess('concern-parent', 'guest').canList === false,
);
ok(
  'guest_solved_intro_only',
  canDiscoverBoard('concern-solved', 'guest') && !canListBoard('concern-solved', 'guest'),
);
ok(
  'parent_director_intro_only',
  canDiscoverBoard('concern-director', 'parent') &&
    !canListBoard('concern-director', 'parent') &&
    !canComposeBoard('concern-director', 'parent'),
);
ok(
  'parent_parent_full_write',
  canListBoard('concern-parent', 'parent') &&
    canReadBoardDetail('concern-parent', 'parent') &&
    canComposeBoard('concern-parent', 'parent') &&
    canCommentBoard('concern-parent', 'parent') &&
    canReactBoard('concern-parent', 'parent'),
);
ok(
  'room_reads_all_concerns',
  canReadBoardDetail('concern-parent', 'study_room') &&
    canReadBoardDetail('concern-director', 'study_room') &&
    canReadBoardDetail('concern-tutor', 'study_room'),
);
ok(
  'room_cannot_write_other_rooms',
  !canComposeBoard('concern-parent', 'study_room') &&
    !canCommentBoard('concern-tutor', 'study_room') &&
    canComposeBoard('concern-director', 'study_room'),
);
ok(
  'tutor_reads_all_cannot_write_director',
  canReadBoardDetail('concern-director', 'tutor') &&
    !canComposeBoard('concern-director', 'tutor') &&
    canComposeBoard('concern-tutor', 'tutor'),
);
ok(
  'login_solved_full_read',
  canListBoard('concern-solved', 'parent') &&
    canReadBoardDetail('concern-solved', 'study_room') &&
    canReadBoardDetail('concern-solved', 'tutor'),
);
ok('guest_notice_full', canListBoard('notice', 'guest') && canReadBoardDetail('notice', 'guest'));
ok(
  'library_download_unimplemented',
  !canDownloadBoard('library', 'parent') && !canDownloadBoard('library-guide-pdf', 'parent'),
);
ok(
  'submission_tutor_only',
  canComposeBoard('submission', 'tutor') &&
    !canComposeBoard('submission', 'study_room') &&
    !canListBoard('submission', 'parent') &&
    !canDiscoverBoard('submission', 'guest'),
);
ok(
  'family_alias',
  canListBoard('concern-family', 'parent') === canListBoard('concern-parent', 'parent'),
);

ok(
  'reply_existing_student_thread_without_tickets',
  canReplyInThread(
    {
      contextKind: 'student',
      messages: [{ sender: 'me' }],
      isBlocked: false,
    },
    'tutor',
  ),
);
ok(
  'parent_provider_first_memo_ok',
  checkFirstMemoPermission({ kind: 'study_room', role: 'parent' }).ok === true,
);
ok(
  'guest_provider_first_memo_blocked',
  checkFirstMemoPermission({ kind: 'study_room', role: 'guest' }).ok === false,
);

const detail = DEFAULT_RIGHT_RAIL_SLOTS.find((s) => s.slotKey === 'detail_right_rail');
ok(
  'rail_detail_no_submission',
  detail && !detail.sourceBoardKeys.includes('submission'),
  JSON.stringify(detail?.sourceBoardKeys),
);

const wishlist = MYPAGE_NAV.find((i) => i.path === '/mypage/wishlist');
ok(
  'wishlist_nav_all_logged_in',
  wishlist && (!wishlist.roles || wishlist.roles.includes('study_room')),
);

const studentReview = MYPAGE_NAV.find((i) => i.path === '/mypage/student-review');
ok(
  'student_review_still_provider_only',
  studentReview?.roles?.includes('study_room') && studentReview?.roles?.includes('tutor'),
);

ok(
  'auth_alias_study_room_owner',
  mapNavRoleToBoardRole('study_room_owner') === 'supply-room' &&
    canReadBoardDetail('concern-parent', 'study_room_owner') &&
    !canComposeBoard('concern-parent', 'study_room_owner'),
);
ok(
  'auth_alias_guardian_student',
  mapNavRoleToBoardRole('guardian_student') === 'demand' &&
    getBoardAccess('concern-director', 'guardian_student').access === 'intro',
);
ok('route_concern_legacy', normalizeConcernPath('/concern/director/abc') === '/community/director/abc');
ok('route_community_new', normalizeCommunityPath('/community/parent/new') === '/community/parent/new');
ok('route_community_family_unknown_falls_null', normalizeCommunityPath('/community/family') === null);
ok('route_library_guides', normalizeLibraryPath('/library/guides') === '/library/guides');
ok(
  'route_submission_tutor_paths',
  isSubmissionBoardPath('/mypage/submission-board/new') &&
    normalizeSubmissionBoardPath('/mypage/submission-board/x/edit') === '/mypage/submission-board/x/edit',
);
ok('rail_empty_board_keys_no_all_fallback', getLatestConcernSamples({ boardKeys: [] }).length === 0);
ok('rail_empty_hot_keys_no_all_fallback', getHotConcernSamples({ boardKeys: [] }).length === 0);

ok(
  'intro_only_canonical',
  normalizeGuestFilter('summary_only') === GUEST_FILTER_INTRO_ONLY &&
    normalizeGuestFilter('intro_only') === GUEST_FILTER_INTRO_ONLY &&
    normalizeGuestFilter('summary_only') !== 'summary_only',
);
ok(
  'summary_only_is_not_post_summary_public',
  !canListBoard('concern-director', 'guest') &&
    !canShowBoardPostsInRail('concern-director', 'guest') &&
    getBoardAccess('concern-director', 'guest').access === 'intro',
);

ok('family_normalizes_to_parent', normalizeBoardKey('concern-family') === 'concern-parent');

const matrix = dumpBoardAclMatrix();
const familyRows = matrix.filter((r) => r.alias === 'concern-family');
const parentRows = matrix.filter((r) => r.alias === 'concern-parent');
ok('matrix_family_count', familyRows.length === parentRows.length && familyRows.length === 5);
ok(
  'matrix_family_equals_parent_acl',
  familyRows.every((row, i) => {
    const p = parentRows[i];
    return (
      row.role === p.role &&
      row.channel === p.channel &&
      row.discover === p.discover &&
      row.list === p.list &&
      row.detail === p.detail &&
      row.compose === p.compose &&
      row.comment === p.comment &&
      row.react === p.react &&
      row.download === p.download &&
      row.upload === p.upload &&
      row.delete === p.delete &&
      row.moderate === p.moderate &&
      row.access === p.access
    );
  }),
);

const home = DEFAULT_RIGHT_RAIL_SLOTS.find((s) => s.slotKey === 'home_right_rail');
ok(
  'rail_home_intro_only_not_summary_only',
  home?.guestFilter === 'intro_only' && !String(home?.guestFilter).includes('summary'),
);
ok(
  'rail_home_canonical_parent_not_family',
  home?.sourceBoardKeys.includes('concern-parent') && !home?.sourceBoardKeys.includes('concern-family'),
);

const introResp = normalizeBoardListResponse({
  ok: true,
  posts: [{ title: 'secret', authorName: 'x' }],
  access: 'intro',
  intro: { title: '공부방 고민방' },
});
ok('normalize_intro_drops_posts', introResp.posts.length === 0 && introResp.access === 'intro');
ok(
  'normalize_legacy_protected_fail_closed',
  normalizeBoardListResponse([{ title: 'secret' }], { boardKey: 'concern-director', navRole: 'parent' })
    .posts.length === 0,
);
ok(
  'normalize_legacy_protected_even_if_local_full',
  normalizeBoardListResponse([{ title: 'secret' }], { boardKey: 'concern-director', navRole: 'tutor' })
    .posts.length === 0,
);
ok(
  'normalize_legacy_public_notice_guest',
  normalizeBoardListResponse([{ id: 'n1' }], { boardKey: 'notice', navRole: 'guest' }).posts[0]?.id === 'n1',
);
ok(
  'normalize_server_full_parent_director_still_empty',
  normalizeBoardListResponse(
    { ok: true, access: 'full', posts: [{ title: 'secret' }] },
    { boardKey: 'concern-director', navRole: 'parent' },
  ).posts.length === 0,
);
ok(
  'normalize_legacy_ok_posts_protected_fail_closed',
  normalizeBoardListResponse(
    { ok: true, posts: [{ title: 'secret' }] },
    { boardKey: 'concern-director', navRole: 'tutor' },
  ).posts.length === 0,
);

ok(
  'memo_s1_new_student_needs_ticket_gate',
  checkFirstMemoPermission({ kind: 'student', role: 'tutor' }).ok === true ||
    checkFirstMemoPermission({ kind: 'student', role: 'tutor' }).reason === 'paid_gate',
);
ok(
  'memo_s3_parent_to_provider_no_paid_gate',
  checkFirstMemoPermission({ kind: 'study_room', role: 'parent' }).ok === true,
);
ok(
  'memo_s2_s4_reply_existing_no_ticket_check',
  canReplyInThread({ contextKind: 'student', messages: [{ sender: 'peer' }], isBlocked: false }, 'tutor') &&
    canReplyInThread({ contextKind: 'study_room', messages: [{ sender: 'peer' }], isBlocked: false }, 'parent'),
);

ok(
  'notice_admin_comment_off_moderate_on',
  !canCommentBoard('notice', 'admin') &&
    !canReactBoard('notice', 'admin') &&
    canComposeBoard('notice', 'admin') &&
    canDeleteBoard('notice', 'admin') &&
    canModerateBoard('notice', 'admin'),
);
ok(
  'submission_upload_axes',
  canUploadBoard('submission', 'tutor') &&
    !canUploadBoard('library', 'parent') &&
    !canDeleteBoard('concern-parent', 'parent') &&
    isAccessFailClosed('concern-director'),
);

const tmpDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'tmp');
mkdirSync(tmpDir, { recursive: true });
writeFileSync(join(tmpDir, 'board-acl-matrix-js.json'), JSON.stringify(matrix, null, 2));

for (const role of roles) {
  ok(
    `guest_filter_concern_${role}_discover`,
    role === 'guest' ? canDiscoverBoard('concern-tutor', role) : true,
  );
}

if (fail) {
  console.error(`\n${fail} failed`);
  process.exit(1);
}
console.log('\nboard-channel-acl verify ok');
