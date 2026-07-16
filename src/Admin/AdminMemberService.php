<?php

declare(strict_types=1);

namespace Study114\Admin;

use InvalidArgumentException;
use Study114\Database\Connection;

final class AdminMemberService
{
    private AdminMemberRepository $repo;
    private AdminOperationLogRepository $logs;
    private AdminRoleService $roles;

    public function __construct(
        ?AdminMemberRepository $repo = null,
        ?AdminOperationLogRepository $logs = null,
        ?AdminRoleService $roles = null,
    ) {
        $pdo = Connection::get();
        $this->repo = $repo ?? new AdminMemberRepository($pdo);
        $this->logs = $logs ?? new AdminOperationLogRepository($pdo);
        $this->roles = $roles ?? new AdminRoleService();
    }

    /**
     * @param array{q?: string, status?: string, role_type?: string, limit?: int} $filters
     * @return array{members: list<array<string, mixed>>, total: int}
     */
    public function list(array $filters = []): array
    {
        $rows = $this->repo->listMembers($filters);
        $members = array_map(fn (array $row) => $this->mapListItem($row), $rows);

        return [
            'members' => $members,
            'total' => count($members),
        ];
    }

    /** @return array<string, mixed> */
    public function detail(int $userId): array
    {
        $row = $this->repo->findById($userId);
        if ($row === null) {
            throw new InvalidArgumentException('회원을 찾을 수 없습니다.');
        }

        return $this->mapDetail($row);
    }

    /**
     * @param array{email?: string, role_type?: string} $auth
     * @param array<string, mixed> $input
     * @return array{member: array<string, mixed>, log: array<string, mixed>}
     */
    public function applyAction(array $auth, array $input): array
    {
        $userId = (int) ($input['user_id'] ?? $input['id'] ?? 0);
        $action = trim((string) ($input['action'] ?? ''));
        $memo = trim((string) ($input['internal_memo'] ?? $input['internalMemo'] ?? ''));
        $operatorId = (string) ($auth['email'] ?? 'admin');

        if ($userId <= 0) {
            throw new InvalidArgumentException('user_id가 필요합니다.');
        }
        if (!in_array($action, ['block', 'restore', 'withdraw'], true)) {
            throw new InvalidArgumentException('action은 block, restore, withdraw만 허용됩니다.');
        }

        $before = $this->repo->findById($userId);
        if ($before === null) {
            throw new InvalidArgumentException('회원을 찾을 수 없습니다.');
        }

        $targetEmail = (string) ($before['email'] ?? '');
        if ($this->roles->isMasterEmail($targetEmail)) {
            throw new InvalidArgumentException('마스터 계정은 이용 제한/탈퇴 처리할 수 없습니다.');
        }

        if ($action === 'withdraw' && !$this->roles->isMaster($auth)) {
            throw new InvalidArgumentException('탈퇴 처리는 마스터만 가능합니다.');
        }

        $beforeStatus = (string) ($before['status'] ?? '');
        if ($action === 'block') {
            if ($beforeStatus === 'blocked') {
                throw new InvalidArgumentException('이미 이용 제한된 계정입니다.');
            }
            if (!$this->repo->updateStatus($userId, 'blocked', null)) {
                throw new InvalidArgumentException('이용 제한 처리에 실패했습니다.');
            }
            $actionKind = 'account_block';
            $afterNote = 'status: ' . $beforeStatus . ' → blocked';
        } elseif ($action === 'restore') {
            if ($beforeStatus === 'active') {
                throw new InvalidArgumentException('이미 정상 계정입니다.');
            }
            if (!$this->repo->updateStatus($userId, 'active', null)) {
                throw new InvalidArgumentException('복구 처리에 실패했습니다.');
            }
            $actionKind = 'account_restore';
            $afterNote = 'status: ' . $beforeStatus . ' → active';
        } else {
            if ($beforeStatus === 'withdrawn') {
                throw new InvalidArgumentException('이미 탈퇴 처리된 계정입니다.');
            }
            if (!$this->repo->updateStatus($userId, 'withdrawn', date('Y-m-d H:i:s'))) {
                throw new InvalidArgumentException('탈퇴 처리에 실패했습니다.');
            }
            $actionKind = 'account_withdraw';
            $afterNote = 'status: ' . $beforeStatus . ' → withdrawn';
        }

        $log = $this->logs->insert(
            $operatorId,
            'user',
            (string) $userId,
            $actionKind,
            'member_ops',
            $memo !== '' ? $memo : $afterNote,
            true,
            $action === 'block',
        );

        return [
            'member' => $this->detail($userId),
            'log' => $this->mapLog($log),
        ];
    }

    /** @param array<string, mixed> $row */
    private function mapListItem(array $row): array
    {
        $primary = (string) ($row['primary_role'] ?? '');
        $email = (string) ($row['email'] ?? '');

        return [
            'id' => (int) $row['id'],
            'email' => $email,
            'name' => (string) ($row['real_name'] ?? ''),
            'status' => (string) ($row['status'] ?? ''),
            'primaryRole' => $primary !== '' ? $primary : null,
            'emailVerified' => ($row['email_verified_at'] ?? null) !== null,
            'oauthPending' => (int) ($row['oauth_role_pending'] ?? 0) === 1,
            'oauthLinked' => (int) ($row['oauth_count'] ?? 0) > 0,
            'subscriptionTier' => (string) ($row['subscription_tier'] ?? 'free'),
            'activePositions' => (int) ($row['active_positions'] ?? 0),
            'studyRoomCount' => (int) ($row['study_room_count'] ?? 0),
            'tutorCount' => (int) ($row['tutor_count'] ?? 0),
            'studentCount' => (int) ($row['student_count'] ?? 0),
            'lastLoginAt' => (string) ($row['last_login_at'] ?? ''),
            'createdAt' => (string) ($row['created_at'] ?? ''),
            'isMaster' => $this->roles->isMasterEmail($email),
        ];
    }

    /** @param array<string, mixed> $row */
    private function mapDetail(array $row): array
    {
        $userId = (int) $row['id'];
        $roles = array_map(static function (array $r): array {
            return [
                'id' => (int) $r['id'],
                'roleType' => (string) $r['role_type'],
                'isPrimary' => (int) ($r['is_primary'] ?? 0) === 1,
                'status' => (string) $r['status'],
                'createdAt' => (string) ($r['granted_at'] ?? ''),
            ];
        }, $this->repo->listRoles($userId));

        $oauth = array_map(static function (array $o): array {
            return [
                'provider' => (string) $o['provider'],
                'providerEmail' => (string) ($o['provider_email'] ?? ''),
                'linkedAt' => (string) ($o['linked_at'] ?? ''),
            ];
        }, $this->repo->listOauth($userId));

        $paid = $this->repo->paidSnapshot($userId);
        $listExtra = $this->repo->listMembers(['q' => (string) $userId, 'limit' => 1]);
        $counts = $listExtra[0] ?? [];

        return [
            'id' => $userId,
            'email' => (string) $row['email'],
            'name' => (string) ($row['real_name'] ?? ''),
            'phone' => (string) ($row['phone'] ?? ''),
            'gender' => (string) ($row['gender'] ?? ''),
            'birthDate' => (string) ($row['birth_date'] ?? ''),
            'address' => (string) ($row['address_line1'] ?? ''),
            'status' => (string) $row['status'],
            'emailVerified' => ($row['email_verified_at'] ?? null) !== null,
            'oauthPending' => (int) ($row['oauth_role_pending'] ?? 0) === 1,
            'lastLoginAt' => (string) ($row['last_login_at'] ?? ''),
            'createdAt' => (string) ($row['created_at'] ?? ''),
            'updatedAt' => (string) ($row['updated_at'] ?? ''),
            'deletedAt' => (string) ($row['deleted_at'] ?? ''),
            'smsOptIn' => (int) ($row['sms_opt_in'] ?? 0) === 1,
            'emailOptIn' => (int) ($row['email_opt_in'] ?? 0) === 1,
            'roles' => $roles,
            'oauth' => $oauth,
            'paid' => [
                'subscriptionTier' => (string) ($paid['subscription_tier'] ?? 'free'),
                'positions' => $paid['positions'],
                'tickets' => $paid['tickets'],
                'orders' => $paid['orders'],
            ],
            'profileCounts' => [
                'studyRooms' => (int) ($counts['study_room_count'] ?? 0),
                'tutors' => (int) ($counts['tutor_count'] ?? 0),
                'students' => (int) ($counts['student_count'] ?? 0),
            ],
            'isMaster' => $this->roles->isMasterEmail((string) $row['email']),
        ];
    }

    /** @param array<string, mixed> $row */
    private function mapLog(array $row): array
    {
        return [
            'id' => (string) ($row['log_key'] ?? ''),
            'targetType' => (string) ($row['target_type'] ?? ''),
            'action' => (string) ($row['action_kind'] ?? ''),
            'target' => (string) ($row['target_id'] ?? ''),
            'operator' => (string) ($row['operator_id'] ?? ''),
            'at' => (string) ($row['acted_at'] ?? ''),
            'reasonCategory' => (string) ($row['reason_category'] ?? ''),
            'detailMemo' => (string) ($row['detail_memo'] ?? ''),
            'reversible' => (bool) ($row['reversible'] ?? true),
            'userNotified' => (bool) ($row['user_notified'] ?? false),
        ];
    }
}
