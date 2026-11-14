<?php

declare(strict_types=1);

namespace Study114\Paid\Pg;

use Study114\Database\Connection;
use Throwable;

/**
 * 339 — 포트원 취소 성공 후 메타 저장 실패·후속 롤백 대비 내구성 로그.
 * 별도 PDO 연결로 기록해 주변 트랜잭션 롤백에 지워지지 않는다.
 * 키·카드정보 금지. paymentId · cancel_id · 금액만.
 */
final class PortOneCancelOpsLog
{
    public static function tableReady(): bool
    {
        try {
            $pdo = Connection::get();
            $stmt = $pdo->prepare(
                'SELECT 1 FROM information_schema.TABLES
                 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
                 LIMIT 1'
            );
            $stmt->execute(['provider_pg_cancel_ops_log']);

            return (bool) $stmt->fetchColumn();
        } catch (Throwable) {
            return false;
        }
    }

    public static function record(
        string $paymentId,
        string $cancelId,
        int $amountWon,
        ?string $orderRef = null,
        string $note = 'orphan',
    ): void {
        $paymentId = trim($paymentId);
        $cancelId = trim($cancelId);
        if ($paymentId === '' || $cancelId === '' || $amountWon < 0) {
            return;
        }
        if (!self::tableReady()) {
            error_log(sprintf(
                '[portone] ops_log_table_missing paymentId=%s cancel_id=%s amount=%d',
                $paymentId,
                $cancelId,
                $amountWon,
            ));

            return;
        }
        try {
            $pdo = Connection::openIndependent();
            $stmt = $pdo->prepare(
                'INSERT INTO provider_pg_cancel_ops_log
                 (payment_id, cancel_id, amount_won, order_ref, note, created_at)
                 VALUES (?, ?, ?, ?, ?, NOW())'
            );
            $stmt->execute([
                $paymentId,
                $cancelId,
                $amountWon,
                $orderRef !== null && $orderRef !== '' ? $orderRef : null,
                $note !== '' ? substr($note, 0, 128) : null,
            ]);
        } catch (Throwable $e) {
            error_log(sprintf(
                '[portone] ops_log_write_failed paymentId=%s cancel_id=%s amount=%d err=%s',
                $paymentId,
                $cancelId,
                $amountWon,
                $e->getMessage(),
            ));
        }
    }
}
