<?php

declare(strict_types=1);

/**
 * 로그인 학생의 가입 분기.
 * 학생(guardian_student)이고 삭제되지 않은 학생 행이 있을 때만 tutor|study_room.
 * 행이 여러 개면 클라이언트 pickStudentRecord 와 같이 id 오름차순 첫 행.
 * 그 외(다른 역할, 행 없음, 유형 없음)는 null.
 */
function study114_auth_me_student_branch(PDO $pdo, string $roleType, int $userId): ?string
{
    if ($roleType !== 'guardian_student' || $userId < 1) {
        return null;
    }
    $stmt = $pdo->prepare(
        'SELECT id, preferred_lesson_type, exposure_status, deleted_at
         FROM students
         WHERE guardian_user_id = ?'
    );
    $stmt->execute([$userId]);
    $rows = $stmt->fetchAll();
    if (!is_array($rows)) {
        return null;
    }
    $list = [];
    foreach ($rows as $row) {
        if (!is_array($row)) {
            continue;
        }
        if (($row['exposure_status'] ?? null) === 'deleted') {
            continue;
        }
        if (!empty($row['deleted_at'])) {
            continue;
        }
        $list[] = $row;
    }
    usort(
        $list,
        static fn (array $a, array $b): int => ((int) ($a['id'] ?? 0)) <=> ((int) ($b['id'] ?? 0))
    );
    if ($list === []) {
        return null;
    }
    $type = $list[0]['preferred_lesson_type'] ?? null;

    return $type === 'tutor' || $type === 'study_room' ? $type : null;
}

if (defined('STUDY114_AUTH_ME_LIBRARY')) {
    return;
}

require_once dirname(__DIR__, 3) . '/src/bootstrap.php';

use Study114\Auth\AuthSession;

header('Content-Type: application/json; charset=utf-8');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    study114_send_cors_headers();
    header('Access-Control-Allow-Methods: GET, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    http_response_code(204);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'method_not_allowed', 'message' => 'GET만 허용됩니다.'], JSON_UNESCAPED_UNICODE);
    exit;
}

study114_send_cors_headers();

$user = AuthSession::userIfActive();
if ($user === null) {
    echo json_encode(['ok' => true, 'authenticated' => false], JSON_UNESCAPED_UNICODE);
    exit;
}
AuthSession::close();

$roles = new \Study114\Admin\AdminRoleService();
$flags = $roles->fetchAuthFlags((int) $user['user_id']);
$adminLevel = $flags['admin_level'] ?? ($user['admin_level'] ?? null);
$mustChange = $flags['must_change_password'] ?? !empty($user['must_change_password']);

// 시장 역할 유지 — admin_level이 있어도 role_type을 admin으로 덮지 않음
$adminLevel = $roles->resolveLevel([
    'user_id' => (int) $user['user_id'],
    'email' => (string) $user['email'],
    'role_type' => (string) ($user['role_type'] ?? ''),
    'admin_level' => $adminLevel,
]);

$oauthRolePending = false;
$emailVerified = false;
$oauthProviders = [];
$oauthProviderLabels = [];
$needsAccountContact = false;
$phoneVerified = false;
$needsBasicRegister = false;
try {
    $oauthRolePending = ($user['role_type'] === 'admin')
        ? false
        : (new \Study114\Auth\OAuthRoleService())->isRolePendingForUser((int) $user['user_id']);
    $emailVerified = (new \Study114\Auth\EmailVerificationGate())->isVerified((int) $user['user_id']);
    $profileSvc = new \Study114\Auth\ProfileDisplayNameService();
    $oauthProviders = $profileSvc->oauthProviders((int) $user['user_id']);
    $oauthProviderLabels = \Study114\Auth\OAuthProviderLabels::labels($oauthProviders);
    $needsAccountContact = (new \Study114\Auth\AccountContactService())
        ->status((int) $user['user_id'])['needs_account_contact'];
    $phoneVerified = (new \Study114\Auth\PhoneVerificationService())
        ->isVerified((int) $user['user_id']);
    if ($emailVerified && !$oauthRolePending && !$needsAccountContact) {
        $needsBasicRegister = (new \Study114\Auth\BasicRegisterService())->needsBasicRegister(
            (int) $user['user_id'],
            (string) ($user['role_type'] ?? '')
        );
    }
} catch (Throwable $e) {
    error_log('[me] auth flags: ' . $e->getMessage());
}

$studentBranch = null;
if ((string) ($user['role_type'] ?? '') === 'guardian_student') {
    try {
        $studentBranch = study114_auth_me_student_branch(
            \Study114\Database\Connection::get(),
            'guardian_student',
            (int) $user['user_id']
        );
    } catch (Throwable $e) {
        error_log('[me] student_branch: ' . $e->getMessage());
        $studentBranch = null;
    }
}

echo json_encode([
    'ok' => true,
    'authenticated' => true,
    'user_id' => $user['user_id'],
    'email' => $user['email'],
    'role_type' => $user['role_type'],
    'name' => $user['name'],
    'admin_level' => $adminLevel,
    'must_change_password' => (bool) $mustChange,
    'oauth_role_pending' => $oauthRolePending,
    'email_verified' => $emailVerified,
    'oauth_providers' => $oauthProviders,
    'oauth_provider_labels' => $oauthProviderLabels,
    'needs_account_contact' => $needsAccountContact,
    'phone_verified' => $phoneVerified,
    'needs_basic_register' => $needsBasicRegister,
    'student_branch' => $studentBranch,
], JSON_UNESCAPED_UNICODE);
