<?php

declare(strict_types=1);

/**
 * BoardChannelAcl · 쪽지권 정책 회귀 (DB 불필요)
 * 사용: php scripts/verify-board-channel-acl.php
 */

require_once dirname(__DIR__) . '/src/bootstrap.php';

use Study114\Admin\ContentAclSeedGuard;
use Study114\Board\BoardChannelAcl;
use Study114\Messages\MessagesService;

$failed = 0;
function ok(string $name, bool $cond, string $detail = ''): void
{
    global $failed;
    if ($cond) {
        echo "PASS  {$name}\n";
        return;
    }
    $failed++;
    fwrite(STDERR, "FAIL  {$name}" . ($detail !== '' ? " — {$detail}" : '') . "\n");
}

ok(
    'guest_director_intro',
    BoardChannelAcl::canDiscover('concern-director', 'guest')
    && !BoardChannelAcl::canList('concern-director', 'guest')
    && BoardChannelAcl::accessKind('concern-director', 'guest') === 'intro',
);
ok(
    'guest_solved_intro',
    BoardChannelAcl::canDiscover('concern-solved', 'guest')
    && !BoardChannelAcl::canList('concern-solved', 'guest'),
);
ok(
    'demand_cannot_list_director',
    !BoardChannelAcl::canList('concern-director', 'demand')
    && BoardChannelAcl::canDiscover('concern-director', 'demand'),
);
ok(
    'room_reads_parent_cannot_compose',
    BoardChannelAcl::canDetail('concern-parent', 'supply-room')
    && !BoardChannelAcl::canCompose('concern-parent', 'supply-room')
    && !BoardChannelAcl::canComment('concern-parent', 'supply-room')
    && !BoardChannelAcl::canReact('concern-parent', 'supply-room'),
);
ok(
    'tutor_reads_director_cannot_compose',
    BoardChannelAcl::canDetail('concern-director', 'supply-tutor')
    && !BoardChannelAcl::canCompose('concern-director', 'supply-tutor'),
);
ok(
    'login_solved_detail',
    BoardChannelAcl::canDetail('concern-solved', 'demand')
    && BoardChannelAcl::canDetail('concern-solved', 'supply-room'),
);
ok(
    'library_download_off',
    !BoardChannelAcl::canDownload('library', 'demand')
    && !BoardChannelAcl::LIBRARY_FILE_DOWNLOAD_IMPLEMENTED,
);
ok(
    'submission_tutor_only',
    BoardChannelAcl::canCompose('submission', 'supply-tutor')
    && !BoardChannelAcl::canCompose('submission', 'supply-room')
    && !BoardChannelAcl::canList('submission', 'demand'),
);
ok(
    'family_alias',
    BoardChannelAcl::normalizeBoardKey('concern-family') === 'concern-parent',
);
ok(
    'intro_has_no_post_keys',
    !isset(BoardChannelAcl::channelIntro('concern-director')['title_from_post'])
    && BoardChannelAcl::channelIntro('concern-director')['title'] === '공부방 고민방',
);
ok(
    'ticket_only_new_student_thread',
    MessagesService::requiresColdMemoTicket(true, 'student')
    && !MessagesService::requiresColdMemoTicket(false, 'student')
    && !MessagesService::requiresColdMemoTicket(true, 'study_room'),
);

$guestAuth = null;
ok(
    'guest_auth_is_guest_role',
    BoardChannelAcl::boardRoleFromAuth($guestAuth) === 'guest',
);
ok(
    'auth_study_room_owner_is_supply_room',
    BoardChannelAcl::boardRoleFromAuth(['role_type' => 'study_room_owner']) === 'supply-room'
    && BoardChannelAcl::canDetail('concern-parent', BoardChannelAcl::boardRoleFromAuth(['role_type' => 'study_room_owner']))
    && !BoardChannelAcl::canCompose('concern-parent', BoardChannelAcl::boardRoleFromAuth(['role_type' => 'study_room_owner']))
    && BoardChannelAcl::accessKind('concern-director', BoardChannelAcl::boardRoleFromAuth(['role_type' => 'study_room_owner'])) === 'full',
);
ok(
    'auth_guardian_is_demand',
    BoardChannelAcl::boardRoleFromAuth(['role_type' => 'guardian_student']) === 'demand'
    && BoardChannelAcl::accessKind('concern-director', BoardChannelAcl::boardRoleFromAuth(['role_type' => 'guardian_student'])) === 'intro',
);
ok(
    'intro_only_canonical',
    BoardChannelAcl::normalizeGuestFilter('summary_only') === 'intro_only'
    && BoardChannelAcl::normalizeGuestFilter('intro_only') === 'intro_only',
);
ok(
    'summary_only_not_list',
    !BoardChannelAcl::canList('concern-director', 'guest')
    && BoardChannelAcl::accessKind('concern-director', 'guest') === 'intro',
);

$matrix = BoardChannelAcl::dumpMatrix();
$parentByRole = [];
$familyByRole = [];
foreach ($matrix as $row) {
    if ($row['alias'] === 'concern-parent') {
        $parentByRole[$row['role']] = $row;
    }
    if ($row['alias'] === 'concern-family') {
        $familyByRole[$row['role']] = $row;
    }
}
$aliasMatch = true;
foreach ($parentByRole as $role => $parent) {
    $family = $familyByRole[$role] ?? null;
    if ($family === null) {
        $aliasMatch = false;
        break;
    }
    foreach (['discover', 'list', 'detail', 'compose', 'comment', 'react', 'download', 'access', 'channel'] as $field) {
        if ($parent[$field] !== $family[$field]) {
            $aliasMatch = false;
            break 2;
        }
    }
}
ok('matrix_family_equals_parent', $aliasMatch);

$static = ContentAclSeedGuard::staticPlan();
ok(
    'seed_static_submission_tutor_admin',
    ($static['channels'][0]['target']['allowed_roles_json'] ?? '') === ContentAclSeedGuard::json(['tutor', 'admin']),
);
ok(
    'seed_static_detail_no_submission',
    str_contains((string) ($static['rails'][2]['target']['source_board_keys_json'] ?? ''), 'safe-guide')
    && !str_contains((string) ($static['rails'][2]['target']['source_board_keys_json'] ?? ''), 'submission'),
);
ok(
    'seed_static_guest_filter_intro_only',
    ($static['rails'][0]['target']['guest_filter'] ?? '') === 'intro_only',
);

ok(
    'ticket_s1_new_student',
    MessagesService::requiresColdMemoTicket(true, 'student'),
);
ok(
    'ticket_s2_existing_student_free',
    !MessagesService::requiresColdMemoTicket(false, 'student'),
);
ok(
    'ticket_s3_parent_to_provider_no_ticket',
    !MessagesService::requiresColdMemoTicket(true, 'study_room')
    && !MessagesService::requiresColdMemoTicket(true, 'tutor'),
);
ok(
    'ticket_s4_followup_no_ticket',
    !MessagesService::requiresColdMemoTicket(false, 'study_room')
    && !MessagesService::requiresColdMemoTicket(false, 'tutor'),
);

ok(
    'solved_write_kept_existing',
    BoardChannelAcl::canCompose('concern-solved', 'demand')
    && BoardChannelAcl::canCompose('concern-solved', 'supply-room')
    && !BoardChannelAcl::canCompose('concern-solved', 'guest'),
);
ok(
    'notice_admin_comment_off_moderate_on',
    !BoardChannelAcl::canComment('notice', 'admin')
    && BoardChannelAcl::canCompose('notice', 'admin')
    && BoardChannelAcl::canDelete('notice', 'admin')
    && BoardChannelAcl::canModerate('notice', 'admin'),
);
ok(
    'submission_upload_not_library',
    BoardChannelAcl::canUpload('submission', 'supply-tutor')
    && !BoardChannelAcl::canUpload('library', 'demand')
    && BoardChannelAcl::isAccessFailClosed('concern-director'),
);
ok(
    'family_collision_abort_both_rows',
    ContentAclSeedGuard::planFamilyCollision(true, true, 1, 2, ['home_right_rail'])['action'] === 'abort_unexpected',
);
ok(
    'family_collision_noop_parent_only',
    ContentAclSeedGuard::planFamilyCollision(false, true, 0, 3, [])['action'] === 'noop',
);

$tmp = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'tmp';
if (!is_dir($tmp)) {
    mkdir($tmp, 0777, true);
}
file_put_contents($tmp . DIRECTORY_SEPARATOR . 'board-acl-matrix-php.json', json_encode($matrix, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));

if ($failed > 0) {
    fwrite(STDERR, "\n{$failed} failed\n");
    exit(1);
}
echo "\nboard-channel-acl php verify ok\n";
