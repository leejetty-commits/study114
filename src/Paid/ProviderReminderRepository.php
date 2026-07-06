<?php

declare(strict_types=1);

namespace Study114\Paid;

use PDO;

final class ProviderReminderRepository
{
    public function __construct(private readonly PDO $pdo)
    {
    }

    /** @return list<array<string, mixed>> */
    public function listPositionExpiryCandidates(array $dayThresholds): array
    {
        if ($dayThresholds === []) {
            return [];
        }
        $placeholders = implode(',', array_fill(0, count($dayThresholds), '?'));
        $stmt = $this->pdo->prepare(
            "SELECT id, user_id, sku_code, ends_at,
                    DATEDIFF(DATE(ends_at), CURDATE()) AS days_left
             FROM provider_position_subscriptions
             WHERE ends_at > NOW()
               AND DATEDIFF(DATE(ends_at), CURDATE()) IN ({$placeholders})"
        );
        $stmt->execute($dayThresholds);
        $rows = $stmt->fetchAll();

        return is_array($rows) ? $rows : [];
    }

    /** @return list<array<string, mixed>> */
    public function listTicketPackExpiryCandidates(array $dayThresholds): array
    {
        if ($dayThresholds === []) {
            return [];
        }
        $placeholders = implode(',', array_fill(0, count($dayThresholds), '?'));
        $stmt = $this->pdo->prepare(
            "SELECT id, user_id, ticket_type, remaining, expires_at,
                    DATEDIFF(DATE(expires_at), CURDATE()) AS days_left
             FROM provider_ticket_packs
             WHERE remaining > 0
               AND expires_at > NOW()
               AND DATEDIFF(DATE(expires_at), CURDATE()) IN ({$placeholders})"
        );
        $stmt->execute($dayThresholds);
        $rows = $stmt->fetchAll();

        return is_array($rows) ? $rows : [];
    }

    /** @return array{email: string, phone: string|null, name: string}|null */
    public function getUserContact(int $userId): ?array
    {
        $stmt = $this->pdo->prepare(
            'SELECT u.email, p.phone, p.real_name AS name
             FROM users u
             INNER JOIN user_profiles p ON p.user_id = u.id
             WHERE u.id = ? AND u.status = ?
             LIMIT 1'
        );
        $stmt->execute([$userId, 'active']);
        $row = $stmt->fetch();
        if ($row === false) {
            return null;
        }

        return [
            'email' => (string) $row['email'],
            'phone' => $row['phone'] !== null ? (string) $row['phone'] : null,
            'name' => (string) $row['name'],
        ];
    }

    public function hasDispatch(string $dedupeKey, string $channel): bool
    {
        $stmt = $this->pdo->prepare(
            'SELECT 1 FROM provider_reminder_dispatches
             WHERE dedupe_key = ? AND channel = ? LIMIT 1'
        );
        $stmt->execute([$dedupeKey, $channel]);

        return (bool) $stmt->fetchColumn();
    }

    public function recordDispatch(int $userId, string $channel, string $reminderKind, string $dedupeKey): void
    {
        $stmt = $this->pdo->prepare(
            'INSERT IGNORE INTO provider_reminder_dispatches
             (user_id, channel, reminder_kind, dedupe_key)
             VALUES (?, ?, ?, ?)'
        );
        $stmt->execute([$userId, $channel, $reminderKind, $dedupeKey]);
    }

    public function upsertSystemNotice(
        int $userId,
        string $noticeKind,
        string $dedupeKey,
        string $title,
        string $body,
        ?string $actionHref,
    ): void {
        $stmt = $this->pdo->prepare(
            'INSERT INTO provider_system_notices
             (user_id, notice_kind, dedupe_key, title, body, action_href)
             VALUES (?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
               title = VALUES(title),
               body = VALUES(body),
               action_href = VALUES(action_href)'
        );
        $stmt->execute([$userId, $noticeKind, $dedupeKey, $title, $body, $actionHref]);
    }

    /** @return list<array<string, mixed>> */
    public function listUnreadNotices(int $userId, int $limit = 20): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT id, notice_kind, title, body, action_href, created_at
             FROM provider_system_notices
             WHERE user_id = ? AND is_read = 0
             ORDER BY created_at DESC
             LIMIT ?'
        );
        $stmt->bindValue(1, $userId, PDO::PARAM_INT);
        $stmt->bindValue(2, $limit, PDO::PARAM_INT);
        $stmt->execute();
        $rows = $stmt->fetchAll();

        return is_array($rows) ? $rows : [];
    }

    public function markNoticeRead(int $userId, int $noticeId): bool
    {
        $stmt = $this->pdo->prepare(
            'UPDATE provider_system_notices
             SET is_read = 1
             WHERE id = ? AND user_id = ? AND is_read = 0'
        );
        $stmt->execute([$noticeId, $userId]);

        return $stmt->rowCount() > 0;
    }

    public function markAllNoticesRead(int $userId): int
    {
        $stmt = $this->pdo->prepare(
            'UPDATE provider_system_notices SET is_read = 1 WHERE user_id = ? AND is_read = 0'
        );
        $stmt->execute([$userId]);

        return $stmt->rowCount();
    }
}
