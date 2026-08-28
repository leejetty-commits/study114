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
    public function listActivePositions(int $userId, ?string $providerType = null, ?int $providerId = null): array
    {
        $hasProvider = $this->positionHasProviderColumns();
        $sql = 'SELECT id, sku_code, duration_type, duration_value, period_days,
                    started_on, end_exclusive_on, starts_at, ends_at,
                    DATE_SUB(end_exclusive_on, INTERVAL 1 DAY) AS ends_on,
                    GREATEST(0, DATEDIFF(end_exclusive_on, CURDATE())) AS days_left';
        if ($hasProvider) {
            $sql .= ', provider_type, provider_id';
        }
        $sql .= ' FROM provider_position_subscriptions
             WHERE user_id = ? AND CURDATE() < end_exclusive_on';
        $params = [$userId];
        if ($hasProvider && $providerType !== null && $providerId !== null && $providerId > 0) {
            $sql .= ' AND provider_type = ? AND provider_id = ?';
            $params[] = $providerType;
            $params[] = $providerId;
        }
        $sql .= ' ORDER BY end_exclusive_on DESC';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
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
             WHERE sku_code = ? AND CURDATE() < end_exclusive_on'
        );
        $stmt->execute([$skuCode]);

        return (int) $stmt->fetchColumn();
    }

    /**
     * 공부방 is_primary / 과외쌤 is_primary 필수 1번 지역 표시명
     */
    public function primaryRegionLabel(string $providerType, int $providerId): string
    {
        if ($providerId <= 0) {
            return '';
        }
        try {
            if ($providerType === 'tutor') {
                $stmt = $this->pdo->prepare(
                    'SELECT r.sido_name FROM tutor_regions tr
                     JOIN regions r ON tr.region_id = r.id
                     WHERE tr.tutor_id = ? AND tr.is_primary = 1 LIMIT 1'
                );
                $stmt->execute([$providerId]);
                $val = $stmt->fetchColumn();

                return $val !== false ? (string) $val : '';
            }
            $stmt = $this->pdo->prepare(
                'SELECT CONCAT(r.dong_name, IFNULL(CONCAT(" · ", c.name), ""))
                 FROM study_room_regions srr
                 JOIN regions r ON srr.region_id = r.id
                 LEFT JOIN complexes c ON srr.complex_id = c.id
                 WHERE srr.study_room_id = ? AND srr.is_primary = 1 LIMIT 1'
            );
            $stmt->execute([$providerId]);
            $val = $stmt->fetchColumn();
            if ($val !== false && $val !== '') {
                return (string) $val;
            }
            $stmt = $this->pdo->prepare(
                'SELECT CONCAT(r.dong_name, IFNULL(CONCAT(" · ", c.name), ""))
                 FROM study_rooms sr
                 LEFT JOIN regions r ON sr.region_id = r.id
                 LEFT JOIN complexes c ON sr.complex_id = c.id
                 WHERE sr.id = ? LIMIT 1'
            );
            $stmt->execute([$providerId]);
            $val = $stmt->fetchColumn();

            return $val !== false ? (string) $val : '';
        } catch (\PDOException) {
            return '';
        }
    }

    /** 해당 포지션의 최근 결제일을 YYYY-MM-DD 로 */
    public function latestPaidOn(int $userId, string $skuCode, ?string $providerType, ?int $providerId): ?string
    {
        try {
            $sql = 'SELECT DATE(COALESCE(paid_at, created_at))
                    FROM provider_payment_orders
                    WHERE user_id = ? AND product_id = ? AND status = ?';
            $params = [$userId, $skuCode, 'paid'];
            if ($this->orderHasProviderColumns() && $providerType && $providerId && $providerId > 0) {
                $sql .= ' AND provider_type = ? AND provider_id = ?';
                $params[] = $providerType;
                $params[] = $providerId;
            }
            $sql .= ' ORDER BY COALESCE(paid_at, created_at) DESC LIMIT 1';
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            $val = $stmt->fetchColumn();
            if ($val === false || $val === null || $val === '') {
                return null;
            }

            return (string) $val;
        } catch (\PDOException) {
            return null;
        }
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

    /**
     * @param array{
     *   duration_type: string,
     *   duration_value: int,
     *   started_on: string,
     *   end_exclusive_on: string,
     *   period_days: int,
     *   starts_at: string,
     *   ends_at: string
     * } $period PositionPeriodCalculator::compute|fromVariant 결과
     * @param 'study_room'|'tutor'|null $providerType
     */
    public function addPositionSubscription(
        int $userId,
        string $skuCode,
        array $period,
        string $source = 'payment',
        ?string $providerType = null,
        ?int $providerId = null,
    ): void {
        if (!in_array($skuCode, ['prime', 'pick'], true)) {
            throw new \InvalidArgumentException('sku_code: prime | pick');
        }
        $type = (string) ($period['duration_type'] ?? '');
        $value = (int) ($period['duration_value'] ?? 0);
        if ($type !== PositionPeriodCalculator::TYPE_DAY && $type !== PositionPeriodCalculator::TYPE_MONTH) {
            throw new \InvalidArgumentException('duration_type: day | month');
        }
        if ($value <= 0) {
            throw new \InvalidArgumentException('duration_value는 1 이상이어야 합니다.');
        }
        if ($this->positionHasProviderColumns()) {
            if ($providerType === null || $providerId === null || $providerId <= 0) {
                throw new \InvalidArgumentException(
                    'Prime/Pick은 provider_type·provider_id(공부방|과외쌤 계정 문맥)가 필요합니다.',
                );
            }
            $stmt = $this->pdo->prepare(
                'INSERT INTO provider_position_subscriptions
                 (user_id, provider_type, provider_id, sku_code, duration_type, duration_value, period_days,
                  started_on, end_exclusive_on, starts_at, ends_at, source)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
            );
            $stmt->execute([
                $userId,
                $providerType,
                $providerId,
                $skuCode,
                $type,
                $value,
                (int) $period['period_days'],
                (string) $period['started_on'],
                (string) $period['end_exclusive_on'],
                (string) $period['starts_at'],
                (string) $period['ends_at'],
                $source,
            ]);

            return;
        }

        $stmt = $this->pdo->prepare(
            'INSERT INTO provider_position_subscriptions
             (user_id, sku_code, duration_type, duration_value, period_days,
              started_on, end_exclusive_on, starts_at, ends_at, source)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $userId,
            $skuCode,
            $type,
            $value,
            (int) $period['period_days'],
            (string) $period['started_on'],
            (string) $period['end_exclusive_on'],
            (string) $period['starts_at'],
            (string) $period['ends_at'],
            $source,
        ]);
    }

    private function positionHasProviderColumns(): bool
    {
        static $cache = null;
        if ($cache !== null) {
            return $cache;
        }
        $stmt = $this->pdo->prepare(
            'SELECT 1 FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE()
               AND TABLE_NAME = ?
               AND COLUMN_NAME = ?
             LIMIT 1'
        );
        $stmt->execute(['provider_position_subscriptions', 'provider_type']);
        $cache = (bool) $stmt->fetchColumn();

        return $cache;
    }

    private function orderHasProviderColumns(): bool
    {
        static $cache = null;
        if ($cache !== null) {
            return $cache;
        }
        $stmt = $this->pdo->prepare(
            'SELECT 1 FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE()
               AND TABLE_NAME = ?
               AND COLUMN_NAME = ?
             LIMIT 1'
        );
        $stmt->execute(['provider_payment_orders', 'provider_type']);
        $cache = (bool) $stmt->fetchColumn();

        return $cache;
    }

    private function assertTicketType(string $ticketType): void
    {
        if (!in_array($ticketType, ['memo', 'request_view'], true)) {
            throw new \InvalidArgumentException('ticket_type: memo | request_view');
        }
    }
}
