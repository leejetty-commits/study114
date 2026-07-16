<?php

declare(strict_types=1);

namespace Study114\Paid;

use PDO;

/** 18b — 횟수권 · 기간형 포지션 */
final class ProviderTicketRepository
{
    public function __construct(private readonly PDO $pdo)
    {
    }

    public function countTickets(int $userId, string $ticketType): int
    {
        $this->assertTicketType($ticketType);
        $stmt = $this->pdo->prepare(
            'SELECT COALESCE(SUM(remaining), 0) FROM provider_ticket_packs
             WHERE user_id = ? AND ticket_type = ? AND remaining > 0 AND expires_at > NOW()'
        );
        $stmt->execute([$userId, $ticketType]);

        return (int) $stmt->fetchColumn();
    }

    public function hasTicketPacks(int $userId, string $ticketType): bool
    {
        $this->assertTicketType($ticketType);
        $stmt = $this->pdo->prepare(
            'SELECT 1 FROM provider_ticket_packs
             WHERE user_id = ? AND ticket_type = ? LIMIT 1'
        );
        $stmt->execute([$userId, $ticketType]);

        return (bool) $stmt->fetchColumn();
    }

    /** @return array{remaining: int, nearest_expiry: string|null} */
    public function ticketSummary(int $userId, string $ticketType): array
    {
        $this->assertTicketType($ticketType);
        $stmt = $this->pdo->prepare(
            'SELECT COALESCE(SUM(remaining), 0) AS remaining,
                    MIN(CASE WHEN remaining > 0 THEN expires_at END) AS nearest_expiry
             FROM provider_ticket_packs
             WHERE user_id = ? AND ticket_type = ? AND expires_at > NOW()'
        );
        $stmt->execute([$userId, $ticketType]);
        $row = $stmt->fetch();

        return [
            'remaining' => (int) ($row['remaining'] ?? 0),
            'nearest_expiry' => $row['nearest_expiry'] !== null ? (string) $row['nearest_expiry'] : null,
        ];
    }

    public function consumeTicket(int $userId, string $ticketType): bool
    {
        $this->assertTicketType($ticketType);
        $this->pdo->beginTransaction();
        try {
            $stmt = $this->pdo->prepare(
                'SELECT id, remaining FROM provider_ticket_packs
                 WHERE user_id = ? AND ticket_type = ? AND remaining > 0 AND expires_at > NOW()
                 ORDER BY expires_at ASC, id ASC
                 LIMIT 1 FOR UPDATE'
            );
            $stmt->execute([$userId, $ticketType]);
            $row = $stmt->fetch();
            if ($row === false) {
                $this->pdo->rollBack();

                return false;
            }
            $newRemaining = (int) $row['remaining'] - 1;
            $upd = $this->pdo->prepare(
                'UPDATE provider_ticket_packs SET remaining = ? WHERE id = ?'
            );
            $upd->execute([$newRemaining, (int) $row['id']]);
            $this->pdo->commit();

            return true;
        } catch (\Throwable $e) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            throw $e;
        }
    }

    /** @return list<array<string, mixed>> */
    public function listActivePositions(int $userId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT id, sku_code, period_days, starts_at, ends_at,
                    GREATEST(0, DATEDIFF(ends_at, NOW())) AS days_left
             FROM provider_position_subscriptions
             WHERE user_id = ? AND ends_at > NOW()
             ORDER BY ends_at DESC'
        );
        $stmt->execute([$userId]);
        $rows = $stmt->fetchAll();

        return is_array($rows) ? $rows : [];
    }

    /**
     * 전역 활성 포지션 수 (슬롯 재고 계산용)
     * @param 'prime'|'pick' $skuCode
     */
    public function countActivePositionsBySku(string $skuCode): int
    {
        if (!in_array($skuCode, ['prime', 'pick'], true)) {
            return 0;
        }
        $stmt = $this->pdo->prepare(
            'SELECT COUNT(*) FROM provider_position_subscriptions
             WHERE sku_code = ? AND ends_at > NOW()'
        );
        $stmt->execute([$skuCode]);

        return (int) $stmt->fetchColumn();
    }

    public function decrementLegacyMemoCredits(int $userId): bool
    {
        $stmt = $this->pdo->prepare(
            'UPDATE provider_entitlements
             SET memo_credits = memo_credits - 1
             WHERE user_id = ? AND memo_credits > 0'
        );
        $stmt->execute([$userId]);

        return $stmt->rowCount() > 0;
    }

    public function legacyMemoCredits(int $userId): int
    {
        $stmt = $this->pdo->prepare(
            'SELECT memo_credits FROM provider_entitlements WHERE user_id = ? LIMIT 1'
        );
        $stmt->execute([$userId]);
        $val = $stmt->fetchColumn();

        return $val !== false ? (int) $val : 0;
    }

    public function isColdMemoBypass(int $userId): bool
    {
        $stmt = $this->pdo->prepare(
            'SELECT cold_memo_allowed FROM provider_entitlements WHERE user_id = ? LIMIT 1'
        );
        $stmt->execute([$userId]);
        $val = $stmt->fetchColumn();

        return $val !== false && (bool) $val;
    }

    public function hasRequestUnlock(int $providerUserId, int $studentId): bool
    {
        $stmt = $this->pdo->prepare(
            'SELECT 1 FROM provider_request_unlocks
             WHERE provider_user_id = ? AND student_id = ? LIMIT 1'
        );
        $stmt->execute([$providerUserId, $studentId]);

        return (bool) $stmt->fetchColumn();
    }

    /** @return list<int> */
    public function listUnlockedStudentIds(int $providerUserId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT student_id FROM provider_request_unlocks WHERE provider_user_id = ? ORDER BY student_id'
        );
        $stmt->execute([$providerUserId]);
        $rows = $stmt->fetchAll(PDO::FETCH_COLUMN);

        return array_map('intval', is_array($rows) ? $rows : []);
    }

    public function recordRequestUnlock(int $providerUserId, int $studentId): void
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO provider_request_unlocks (provider_user_id, student_id)
             VALUES (?, ?)
             ON DUPLICATE KEY UPDATE unlocked_at = unlocked_at'
        );
        $stmt->execute([$providerUserId, $studentId]);
    }

    /** @return array{request_summary_visibility: string, special_request_visibility: string}|null */
    public function getStudentVisibility(int $studentId): ?array
    {
        $stmt = $this->pdo->prepare(
            'SELECT request_summary_visibility, special_request_visibility
             FROM students WHERE id = ? LIMIT 1'
        );
        $stmt->execute([$studentId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return is_array($row) ? $row : null;
    }

    public function studentHasPaidOnlyFields(int $studentId): bool
    {
        $row = $this->getStudentVisibility($studentId);
        if ($row === null) {
            return false;
        }

        return ($row['request_summary_visibility'] ?? '') === 'paid_only'
            || ($row['special_request_visibility'] ?? '') === 'paid_only';
    }

    public function addTicketPack(int $userId, string $ticketType, int $count, string $source = 'payment'): void
    {
        $this->assertTicketType($ticketType);
        if ($count <= 0) {
            throw new \InvalidArgumentException('pack_size는 1 이상이어야 합니다.');
        }
        $stmt = $this->pdo->prepare(
            'INSERT INTO provider_ticket_packs
             (user_id, ticket_type, pack_size, remaining, purchased_at, expires_at, source)
             VALUES (?, ?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 6 MONTH), ?)'
        );
        $stmt->execute([$userId, $ticketType, $count, $count, $source]);
    }

    public function addPositionSubscription(int $userId, string $skuCode, int $periodDays, string $source = 'payment'): void
    {
        if (!in_array($skuCode, ['prime', 'pick'], true)) {
            throw new \InvalidArgumentException('sku_code: prime | pick');
        }
        if ($periodDays <= 0) {
            throw new \InvalidArgumentException('period_days는 1 이상이어야 합니다.');
        }
        $stmt = $this->pdo->prepare(
            'INSERT INTO provider_position_subscriptions
             (user_id, sku_code, period_days, starts_at, ends_at, source)
             VALUES (?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL ? DAY), ?)'
        );
        $stmt->execute([$userId, $skuCode, $periodDays, $periodDays, $source]);
    }

    private function assertTicketType(string $ticketType): void
    {
        if (!in_array($ticketType, ['memo', 'request_view'], true)) {
            throw new \InvalidArgumentException('ticket_type: memo | request_view');
        }
    }
}
