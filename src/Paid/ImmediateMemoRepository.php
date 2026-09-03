<?php

declare(strict_types=1);

namespace Study114\Paid;

use PDO;

final class ImmediateMemoRepository
{
    public function __construct(private readonly PDO $pdo)
    {
    }

    public function tableReady(): bool
    {
        $stmt = $this->pdo->prepare(
            'SELECT 1 FROM information_schema.TABLES
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? LIMIT 1'
        );
        $stmt->execute(['provider_immediate_memo_intents']);

        return (bool) $stmt->fetchColumn();
    }

    /**
     * @param array{
     *   order_ref: string,
     *   user_id: int,
     *   provider_type: string,
     *   provider_id: int,
     *   student_id: int,
     *   body: string,
     *   context_label?: string,
     *   peer_display_name?: string
     * } $row
     */
    public function insertPending(array $row): void
    {
        $stmt = $this->pdo->prepare(
            "INSERT INTO provider_immediate_memo_intents
             (order_ref, user_id, provider_type, provider_id, student_id, context_kind, body,
              context_label, peer_display_name, dispatch_status)
             VALUES (?, ?, ?, ?, ?, 'student', ?, ?, ?, 'pending')"
        );
        $stmt->execute([
            $row['order_ref'],
            $row['user_id'],
            $row['provider_type'],
            $row['provider_id'],
            $row['student_id'],
            $row['body'],
            $row['context_label'] ?? null,
            $row['peer_display_name'] ?? null,
        ]);
    }

    /** @return array<string, mixed>|null */
    public function getByOrderRef(string $orderRef): ?array
    {
        $stmt = $this->pdo->prepare(
            'SELECT * FROM provider_immediate_memo_intents WHERE order_ref = ? LIMIT 1'
        );
        $stmt->execute([$orderRef]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return is_array($row) ? $row : null;
    }

    public function markSent(string $orderRef, int $threadId): void
    {
        $stmt = $this->pdo->prepare(
            "UPDATE provider_immediate_memo_intents
             SET dispatch_status = 'sent', thread_id = ?, sent_at = NOW(), fail_reason = NULL, retryable = 0
             WHERE order_ref = ? AND dispatch_status <> 'sent'"
        );
        $stmt->execute([$threadId, $orderRef]);
    }

    public function markFailed(string $orderRef, string $reason, bool $retryable): void
    {
        $stmt = $this->pdo->prepare(
            "UPDATE provider_immediate_memo_intents
             SET dispatch_status = 'failed', fail_reason = ?, retryable = ?
             WHERE order_ref = ?"
        );
        $stmt->execute([$reason, $retryable ? 1 : 0, $orderRef]);
    }
}
