<?php

declare(strict_types=1);

namespace Study114\Report;

use PDO;
use PDOException;
use Study114\Database\Connection;

final class SettlementReportRepository
{
    private PDO $pdo;

    public function __construct(?PDO $pdo = null)
    {
        $this->pdo = $pdo ?? Connection::get();
    }

    public function pdo(): PDO
    {
        return $this->pdo;
    }

    public function tableExists(): bool
    {
        $stmt = $this->pdo->prepare(
            'SELECT COUNT(*) FROM information_schema.TABLES
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?'
        );
        $stmt->execute(['admin_settlement_reports']);

        return (int) $stmt->fetchColumn() > 0;
    }

    /** @return array<string, mixed>|null */
    public function find(string $kind, string $periodStart): ?array
    {
        $stmt = $this->pdo->prepare(
            'SELECT * FROM admin_settlement_reports WHERE period_kind = ? AND period_start = ? LIMIT 1'
        );
        $stmt->execute([$kind, $periodStart]);
        $row = $stmt->fetch();

        return is_array($row) ? $this->hydrate($row) : null;
    }

    /** @return list<array<string, mixed>> */
    public function listDays(string $startDate, string $endDate): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT * FROM admin_settlement_reports
             WHERE period_kind = \'day\' AND period_start >= ? AND period_start <= ?
             ORDER BY period_start'
        );
        $stmt->execute([$startDate, $endDate]);
        $out = [];
        foreach ($stmt->fetchAll() as $row) {
            $out[] = $this->hydrate($row);
        }

        return $out;
    }

    /** @param array<string, mixed> $row @return bool true when a new row was inserted */
    public function insertIfAbsent(array $row): bool
    {
        $sql = 'INSERT INTO admin_settlement_reports (
            period_kind, period_start, period_end,
            pay_count, pay_amount_won,
            pay_study_room_count, pay_study_room_amount_won,
            pay_tutor_count, pay_tutor_amount_won,
            pay_student_count, pay_student_amount_won,
            pay_unknown_count, pay_unknown_amount_won,
            inquiry_count, report_count,
            reg_study_room_count, reg_tutor_count, reg_student_count,
            withdraw_total, withdraw_study_room_count, withdraw_tutor_count, withdraw_student_count,
            delete_total, delete_study_room_count, delete_tutor_count, delete_student_count, delete_unknown_count,
            home_popup_count, snapshot_json, is_backfill, mail_status
        ) VALUES (
            :period_kind, :period_start, :period_end,
            :pay_count, :pay_amount_won,
            :pay_study_room_count, :pay_study_room_amount_won,
            :pay_tutor_count, :pay_tutor_amount_won,
            :pay_student_count, :pay_student_amount_won,
            :pay_unknown_count, :pay_unknown_amount_won,
            :inquiry_count, :report_count,
            :reg_study_room_count, :reg_tutor_count, :reg_student_count,
            :withdraw_total, :withdraw_study_room_count, :withdraw_tutor_count, :withdraw_student_count,
            :delete_total, :delete_study_room_count, :delete_tutor_count, :delete_student_count, :delete_unknown_count,
            :home_popup_count, :snapshot_json, :is_backfill, :mail_status
        )';
        try {
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($this->bindRow($row));

            return true;
        } catch (PDOException $e) {
            $state = (string) $e->getCode();
            if ($state === '23000' || str_contains($e->getMessage(), '1062')) {
                return false;
            }
            throw $e;
        }
    }

    /** @return list<array<string, mixed>> */
    public function listMailCandidates(): array
    {
        $stmt = $this->pdo->query(
            'SELECT * FROM admin_settlement_reports
             WHERE mail_status IN (\'pending\', \'failed\')
             ORDER BY period_start, id'
        );
        $out = [];
        foreach ($stmt->fetchAll() as $row) {
            $out[] = $this->hydrate($row);
        }

        return $out;
    }

    /** @return list<array<string, mixed>> */
    public function listStaleSending(): array
    {
        $stmt = $this->pdo->query(
            'SELECT * FROM admin_settlement_reports
             WHERE mail_status = \'sending\'
               AND mail_claimed_at IS NOT NULL
               AND mail_claimed_at < DATE_SUB(NOW(), INTERVAL 10 MINUTE)'
        );
        $out = [];
        foreach ($stmt->fetchAll() as $row) {
            $out[] = $this->hydrate($row);
        }

        return $out;
    }

    public function claimMail(int $id): bool
    {
        $stmt = $this->pdo->prepare(
            'UPDATE admin_settlement_reports
             SET mail_status = \'sending\', mail_claimed_at = NOW()
             WHERE id = ? AND mail_status IN (\'pending\', \'failed\')'
        );
        $stmt->execute([$id]);

        return $stmt->rowCount() === 1;
    }

    public function markSent(int $id): void
    {
        $stmt = $this->pdo->prepare(
            'UPDATE admin_settlement_reports
             SET mail_status = \'sent\', mail_sent_at = NOW(), mail_error = NULL
             WHERE id = ? AND mail_status = \'sending\''
        );
        $stmt->execute([$id]);
    }

    public function markFailed(int $id, string $code): void
    {
        $stmt = $this->pdo->prepare(
            'UPDATE admin_settlement_reports
             SET mail_status = \'failed\', mail_error = ?
             WHERE id = ? AND mail_status = \'sending\''
        );
        $stmt->execute([substr($code, 0, 255), $id]);
    }

    public function markSkipped(int $id, string $code): void
    {
        $stmt = $this->pdo->prepare(
            'UPDATE admin_settlement_reports
             SET mail_status = \'skipped\', mail_error = ?
             WHERE id = ? AND mail_status IN (\'pending\', \'failed\', \'sending\')'
        );
        $stmt->execute([substr($code, 0, 255), $id]);
    }

    public function markSendingFailed(int $id, string $code): void
    {
        $stmt = $this->pdo->prepare(
            'UPDATE admin_settlement_reports
             SET mail_status = \'failed\', mail_error = ?
             WHERE id = ? AND mail_status = \'sending\''
        );
        $stmt->execute([substr($code, 0, 255), $id]);
    }

    /** @param array<string, mixed> $row @return array<string, mixed> */
    private function bindRow(array $row): array
    {
        $snapshot = $row['snapshot_json'] ?? null;
        if (is_array($snapshot)) {
            $snapshot = json_encode($snapshot, JSON_UNESCAPED_UNICODE);
        }

        return [
            'period_kind' => $row['period_kind'],
            'period_start' => $row['period_start'],
            'period_end' => $row['period_end'],
            'pay_count' => (int) $row['pay_count'],
            'pay_amount_won' => (int) $row['pay_amount_won'],
            'pay_study_room_count' => (int) $row['pay_study_room_count'],
            'pay_study_room_amount_won' => (int) $row['pay_study_room_amount_won'],
            'pay_tutor_count' => (int) $row['pay_tutor_count'],
            'pay_tutor_amount_won' => (int) $row['pay_tutor_amount_won'],
            'pay_student_count' => (int) $row['pay_student_count'],
            'pay_student_amount_won' => (int) $row['pay_student_amount_won'],
            'pay_unknown_count' => (int) $row['pay_unknown_count'],
            'pay_unknown_amount_won' => (int) $row['pay_unknown_amount_won'],
            'inquiry_count' => $row['inquiry_count'],
            'report_count' => $row['report_count'],
            'reg_study_room_count' => (int) $row['reg_study_room_count'],
            'reg_tutor_count' => (int) $row['reg_tutor_count'],
            'reg_student_count' => (int) $row['reg_student_count'],
            'withdraw_total' => (int) $row['withdraw_total'],
            'withdraw_study_room_count' => (int) $row['withdraw_study_room_count'],
            'withdraw_tutor_count' => (int) $row['withdraw_tutor_count'],
            'withdraw_student_count' => (int) $row['withdraw_student_count'],
            'delete_total' => (int) $row['delete_total'],
            'delete_study_room_count' => (int) $row['delete_study_room_count'],
            'delete_tutor_count' => (int) $row['delete_tutor_count'],
            'delete_student_count' => (int) $row['delete_student_count'],
            'delete_unknown_count' => (int) $row['delete_unknown_count'],
            'home_popup_count' => $row['home_popup_count'],
            'snapshot_json' => $snapshot,
            'is_backfill' => (int) $row['is_backfill'],
            'mail_status' => (string) $row['mail_status'],
        ];
    }

    /** @param array<string, mixed> $row @return array<string, mixed> */
    private function hydrate(array $row): array
    {
        $ints = [
            'id', 'pay_count', 'pay_amount_won',
            'pay_study_room_count', 'pay_study_room_amount_won',
            'pay_tutor_count', 'pay_tutor_amount_won',
            'pay_student_count', 'pay_student_amount_won',
            'pay_unknown_count', 'pay_unknown_amount_won',
            'reg_study_room_count', 'reg_tutor_count', 'reg_student_count',
            'withdraw_total', 'withdraw_study_room_count', 'withdraw_tutor_count', 'withdraw_student_count',
            'delete_total', 'delete_study_room_count', 'delete_tutor_count', 'delete_student_count',
            'delete_unknown_count', 'is_backfill',
        ];
        foreach ($ints as $key) {
            $row[$key] = (int) ($row[$key] ?? 0);
        }
        foreach (['inquiry_count', 'report_count', 'home_popup_count'] as $key) {
            $row[$key] = $row[$key] === null ? null : (int) $row[$key];
        }
        $row['period_start'] = substr((string) $row['period_start'], 0, 10);
        $row['period_end'] = substr((string) $row['period_end'], 0, 10);
        $snap = $row['snapshot_json'] ?? null;
        if (is_string($snap) && $snap !== '') {
            $decoded = json_decode($snap, true);
            $row['snapshot_json'] = is_array($decoded) ? $decoded : [];
        } elseif (!is_array($snap)) {
            $row['snapshot_json'] = [];
        }

        return $row;
    }
}
