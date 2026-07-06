<?php

declare(strict_types=1);

namespace Study114\Admin;

use PDO;

final class AdminReportRepository
{
    public function __construct(private readonly PDO $pdo)
    {
    }

    /** @return list<array<string, mixed>> */
    public function listAll(?string $status = null): array
    {
        $sql = 'SELECT report_key, kind, target_type, target_id, target_label, reason, status,
                       internal_memo, created_at, updated_at
                FROM admin_reports';
        $params = [];
        if ($status !== null && $status !== '' && $status !== 'all') {
            $sql .= ' WHERE status = ?';
            $params[] = $status;
        }
        $sql .= ' ORDER BY created_at DESC, id DESC';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);

        return $stmt->fetchAll();
    }

    /** @return array<string, mixed>|null */
    public function findByKey(string $reportKey): ?array
    {
        $stmt = $this->pdo->prepare(
            'SELECT report_key, kind, target_type, target_id, target_label, reason, status,
                    internal_memo, created_at, updated_at
             FROM admin_reports WHERE report_key = ? LIMIT 1'
        );
        $stmt->execute([$reportKey]);
        $row = $stmt->fetch();

        return $row === false ? null : $row;
    }

    /** @return array<string, mixed> */
    public function update(string $reportKey, string $status, ?string $internalMemo): array
    {
        $stmt = $this->pdo->prepare(
            'UPDATE admin_reports
             SET status = ?, internal_memo = COALESCE(?, internal_memo), updated_at = NOW()
             WHERE report_key = ?'
        );
        $stmt->execute([$status, $internalMemo, $reportKey]);

        /** @var array<string, mixed> */
        return $this->findByKey($reportKey);
    }
}
