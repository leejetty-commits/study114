<?php

declare(strict_types=1);

namespace Study114\Admin;

use PDO;

final class AdminOperationLogRepository
{
    public function __construct(private readonly PDO $pdo)
    {
    }

    /** @return list<array<string, mixed>> */
    public function listRecent(int $limit = 50): array
    {
        $limit = max(1, min(200, $limit));
        $stmt = $this->pdo->prepare(
            'SELECT log_key, acted_at, operator_id, target_type, target_id, action_kind,
                    reason_category, detail_memo, reversible, revert_history, user_notified
             FROM admin_operation_logs
             ORDER BY acted_at DESC, id DESC
             LIMIT ' . $limit
        );
        $stmt->execute();

        return $stmt->fetchAll();
    }

    /** @return array<string, mixed> */
    public function insert(
        string $operatorId,
        string $targetType,
        string $targetId,
        string $actionKind,
        ?string $reasonCategory,
        ?string $detailMemo,
        bool $reversible = true,
        bool $userNotified = false,
    ): array {
        $logKey = 'LOG-' . date('YmdHis') . '-' . substr(bin2hex(random_bytes(3)), 0, 6);
        $stmt = $this->pdo->prepare(
            'INSERT INTO admin_operation_logs
             (log_key, operator_id, target_type, target_id, action_kind, reason_category, detail_memo, reversible, user_notified)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $logKey,
            $operatorId,
            $targetType,
            $targetId,
            $actionKind,
            $reasonCategory,
            $detailMemo,
            $reversible ? 1 : 0,
            $userNotified ? 1 : 0,
        ]);

        $rows = $this->listRecent(1);

        return $rows[0] ?? [];
    }
}
