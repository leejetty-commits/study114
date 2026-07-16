<?php

declare(strict_types=1);

namespace Study114\Admin;

use InvalidArgumentException;
use Study114\Database\Connection;

final class AdminCommerceService
{
    private AdminCommerceRepository $repo;
    private AdminOperationLogRepository $logs;
    private AdminRoleService $roles;

    public function __construct(
        ?AdminCommerceRepository $repo = null,
        ?AdminOperationLogRepository $logs = null,
        ?AdminRoleService $roles = null,
    ) {
        $pdo = Connection::get();
        $this->repo = $repo ?? new AdminCommerceRepository($pdo);
        $this->logs = $logs ?? new AdminOperationLogRepository($pdo);
        $this->roles = $roles ?? new AdminRoleService();
    }

    /** @param array{email: string, role_type: string} $auth */
    public function overview(array $auth, int $limit = 50): array
    {
        $primeCap = 3;
        $pickCap = 10;
        $primeUsed = $this->repo->countActivePositionsBySku('prime');
        $pickUsed = $this->repo->countActivePositionsBySku('pick');

        return [
            'admin_level' => $this->roles->resolveLevel($auth),
            'slots' => [
                'region_scope_type' => 'dong',
                'prime' => [
                    'capacity' => $primeCap,
                    'used' => $primeUsed,
                    'remaining' => max(0, $primeCap - $primeUsed),
                ],
                'pick' => [
                    'capacity' => $pickCap,
                    'used' => $pickUsed,
                    'remaining' => max(0, $pickCap - $pickUsed),
                    'set_size' => 5,
                    'rotation_minutes' => 15,
                ],
            ],
            'settings_readonly' => [
                'note' => '가격·슬롯·회전간격 등 운영값 편집 UI는 1차 제외 — seed/API 조회만',
                'prime_slots' => $primeCap,
                'pick_set_size' => 5,
                'pick_rotation_minutes' => 15,
                'basic_page_size' => 20,
            ],
            'positions' => $this->repo->listActivePositions($limit),
            'tickets' => $this->repo->listTicketPacks($limit),
            'orders' => $this->repo->listRecentOrders($limit),
        ];
    }

    /**
     * @param array{email: string, role_type: string} $auth
     * @param array<string, mixed> $input
     * @return array{item?: array<string, mixed>, log?: array<string, mixed>}
     */
    public function applyCorrection(array $auth, array $input): array
    {
        $action = (string) ($input['action'] ?? '');
        $operatorId = (string) ($auth['email'] ?? 'admin');
        $memo = isset($input['internal_memo']) ? trim((string) $input['internal_memo']) : null;
        if ($memo === '') {
            $memo = null;
        }

        if ($action === 'position_ends_at') {
            if (!$this->roles->isMaster($auth)) {
                throw new InvalidArgumentException('만료일 보정은 마스터만 가능합니다.');
            }
            $id = (int) ($input['position_id'] ?? 0);
            $endsAt = trim((string) ($input['ends_at'] ?? ''));
            if ($id <= 0 || $endsAt === '') {
                throw new InvalidArgumentException('position_id와 ends_at이 필요합니다.');
            }
            $before = $this->repo->getPositionById($id);
            if ($before === null) {
                throw new InvalidArgumentException('포지션 구독을 찾을 수 없습니다.');
            }
            if (!$this->repo->updatePositionEndsAt($id, $endsAt)) {
                throw new InvalidArgumentException('만료일 보정에 실패했습니다.');
            }
            $log = $this->logs->insert(
                $operatorId,
                'position_subscription',
                (string) $id,
                'commerce_position_ends_at',
                'manual_correction',
                $memo ?? ('ends_at: ' . ($before['ends_at'] ?? '') . ' → ' . $endsAt),
            );

            return ['item' => $this->repo->getPositionById($id), 'log' => $this->mapLog($log)];
        }

        if ($action === 'ticket_remaining') {
            if (!$this->roles->isMaster($auth)) {
                throw new InvalidArgumentException('잔여횟수 보정은 마스터만 가능합니다.');
            }
            $id = (int) ($input['ticket_pack_id'] ?? 0);
            $remaining = (int) ($input['remaining'] ?? -1);
            if ($id <= 0 || $remaining < 0) {
                throw new InvalidArgumentException('ticket_pack_id와 remaining(0+)이 필요합니다.');
            }
            $before = $this->repo->getTicketPackById($id);
            if ($before === null) {
                throw new InvalidArgumentException('횟수권 팩을 찾을 수 없습니다.');
            }
            if (!$this->repo->updateTicketRemaining($id, $remaining)) {
                throw new InvalidArgumentException('잔여횟수 보정에 실패했습니다.');
            }
            $log = $this->logs->insert(
                $operatorId,
                'ticket_pack',
                (string) $id,
                'commerce_ticket_remaining',
                'manual_correction',
                $memo ?? ('remaining: ' . ($before['remaining'] ?? '') . ' → ' . $remaining),
            );

            return ['item' => $this->repo->getTicketPackById($id), 'log' => $this->mapLog($log)];
        }

        throw new InvalidArgumentException('지원하지 않는 보정 action입니다.');
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

    /** @param array{email: string, role_type: string} $auth */
    public function sessionInfo(array $auth): array
    {
        $level = $this->roles->resolveLevel($auth);

        return [
            'admin_level' => $level,
            'email' => $auth['email'] ?? '',
            'is_master' => $level === AdminRoleService::LEVEL_MASTER,
            'master_emails' => $this->roles->listMasterEmails(),
            'sub_master_emails' => $this->roles->listSubMasterEmails(),
        ];
    }
}
