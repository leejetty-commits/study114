<?php

declare(strict_types=1);

namespace Study114\Admin;

use InvalidArgumentException;
use Study114\Database\Connection;

final class AdminReportService
{
    /** @var list<string> */
    private const STATUSES = ['open', 'protect', 'resolved', 'dismissed'];

    private AdminReportRepository $reports;
    private AdminOperationLogRepository $logs;

    public function __construct(
        ?AdminReportRepository $reports = null,
        ?AdminOperationLogRepository $logs = null,
    ) {
        $pdo = Connection::get();
        $this->reports = $reports ?? new AdminReportRepository($pdo);
        $this->logs = $logs ?? new AdminOperationLogRepository($pdo);
    }

    /** @return list<array<string, mixed>> */
    public function list(?string $status = null): array
    {
        return array_map(fn (array $row) => $this->mapReport($row), $this->reports->listAll($status));
    }

    /** @param array<string, mixed> $input */
    public function update(array $input, string $operatorId): array
    {
        $reportKey = trim((string) ($input['id'] ?? $input['report_key'] ?? ''));
        $status = trim((string) ($input['status'] ?? ''));
        $operatorId = trim($operatorId);
        $internalMemo = trim((string) ($input['internal_memo'] ?? $input['internalMemo'] ?? ''));

        if ($reportKey === '') {
            throw new InvalidArgumentException('id가 필요합니다.');
        }
        if ($status === '' || !in_array($status, self::STATUSES, true)) {
            throw new InvalidArgumentException('status가 올바르지 않습니다.');
        }
        if ($operatorId === '') {
            throw new InvalidArgumentException('operator_id가 필요합니다.');
        }

        $existing = $this->reports->findByKey($reportKey);
        if ($existing === null) {
            throw new InvalidArgumentException('신고를 찾을 수 없습니다.');
        }

        $row = $this->reports->update(
            $reportKey,
            $status,
            $internalMemo !== '' ? $internalMemo : null,
        );

        $log = $this->logs->insert(
            $operatorId,
            'admin_report',
            $reportKey,
            'report_status_change',
            $status,
            $internalMemo !== '' ? $internalMemo : null,
            true,
            false,
        );

        return [
            'report' => $this->mapReport($row),
            'log' => $this->mapLog($log),
        ];
    }

    /** @param array<string, mixed> $row @return array<string, mixed> */
    private function mapReport(array $row): array
    {
        $targetLabel = (string) ($row['target_label'] ?? '');
        if ($targetLabel === '') {
            $targetLabel = (string) $row['target_type'] . ' #' . (string) $row['target_id'];
        }

        return [
            'id' => (string) $row['report_key'],
            'kind' => (string) $row['kind'],
            'target' => $targetLabel,
            'targetType' => (string) $row['target_type'],
            'targetId' => (string) $row['target_id'],
            'reason' => (string) $row['reason'],
            'status' => (string) $row['status'],
            'internalMemo' => (string) ($row['internal_memo'] ?? ''),
            'createdAt' => substr((string) $row['created_at'], 0, 10),
            'updatedAt' => substr((string) $row['updated_at'], 0, 10),
        ];
    }

    /** @param array<string, mixed> $row @return array<string, mixed> */
    private function mapLog(array $row): array
    {
        return [
            'id' => (string) $row['log_key'],
            'action' => (string) $row['action_kind'],
            'target' => (string) $row['target_id'],
            'operator' => (string) $row['operator_id'],
            'at' => (string) $row['acted_at'],
            'reasonCategory' => (string) ($row['reason_category'] ?? ''),
            'detailMemo' => (string) ($row['detail_memo'] ?? ''),
            'reversible' => (bool) $row['reversible'],
            'userNotified' => (bool) $row['user_notified'],
        ];
    }
}
