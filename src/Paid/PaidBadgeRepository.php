<?php

declare(strict_types=1);

namespace Study114\Paid;

use InvalidArgumentException;
use PDO;

/**
 * provider_paid_badges 적재 · 회수
 * SSOT: docs/internal/57-paid-badges-api-contract.md
 */
final class PaidBadgeRepository
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
        $stmt->execute(['provider_paid_badges']);

        return (bool) $stmt->fetchColumn();
    }

    /**
     * @param 'study_room'|'tutor' $providerType
     * @return array{action: string, id: int, badge_code: string, starts_on: string, end_exclusive_on: string}
     */
    public function grantFromOrder(
        string $providerType,
        int $providerId,
        string $badgeCode,
        string $startsOn,
        string $endExclusiveOn,
        string $orderRef,
    ): array {
        if (!$this->tableReady()) {
            throw new InvalidArgumentException('provider_paid_badges 테이블이 없습니다. schema 055를 적용하세요.');
        }
        $normalized = (new PaidBadgeResolver($this->pdo))->normalizeCode($badgeCode, $providerType);
        if ($normalized === null) {
            throw new InvalidArgumentException('허용되지 않는 배지 코드: ' . $badgeCode);
        }
        if ($providerId <= 0) {
            throw new InvalidArgumentException('provider_id가 필요합니다.');
        }

        $existingOrder = $this->pdo->prepare(
            'SELECT id, starts_on, end_exclusive_on FROM provider_paid_badges
             WHERE source_order_ref = ? AND badge_code = ? LIMIT 1'
        );
        $existingOrder->execute([$orderRef, $normalized]);
        $byOrder = $existingOrder->fetch(PDO::FETCH_ASSOC);
        if (is_array($byOrder)) {
            return [
                'action' => 'idempotent',
                'id' => (int) $byOrder['id'],
                'badge_code' => $normalized,
                'starts_on' => (string) $byOrder['starts_on'],
                'end_exclusive_on' => (string) $byOrder['end_exclusive_on'],
            ];
        }

        $active = $this->pdo->prepare(
            "SELECT id, starts_on, end_exclusive_on FROM provider_paid_badges
             WHERE provider_type = ? AND provider_id = ? AND badge_code = ?
               AND status = 'active' AND end_exclusive_on > CURDATE()
             ORDER BY end_exclusive_on DESC LIMIT 1"
        );
        $active->execute([$providerType, $providerId, $normalized]);
        $row = $active->fetch(PDO::FETCH_ASSOC);
        if (is_array($row)) {
            $newEnd = max((string) $row['end_exclusive_on'], $endExclusiveOn);
            $upd = $this->pdo->prepare(
                'UPDATE provider_paid_badges
                 SET end_exclusive_on = ?, source_order_ref = COALESCE(source_order_ref, ?)
                 WHERE id = ?'
            );
            $upd->execute([$newEnd, $orderRef, (int) $row['id']]);

            return [
                'action' => 'extended',
                'id' => (int) $row['id'],
                'badge_code' => $normalized,
                'starts_on' => (string) $row['starts_on'],
                'end_exclusive_on' => $newEnd,
            ];
        }

        $ins = $this->pdo->prepare(
            "INSERT INTO provider_paid_badges
              (provider_type, provider_id, badge_code, status, starts_on, end_exclusive_on, source_order_ref)
             VALUES (?, ?, ?, 'active', ?, ?, ?)"
        );
        $ins->execute([
            $providerType,
            $providerId,
            $normalized,
            $startsOn,
            $endExclusiveOn,
            $orderRef,
        ]);

        return [
            'action' => 'inserted',
            'id' => (int) $this->pdo->lastInsertId(),
            'badge_code' => $normalized,
            'starts_on' => $startsOn,
            'end_exclusive_on' => $endExclusiveOn,
        ];
    }

    public function revokeByOrderRef(string $orderRef): int
    {
        if (!$this->tableReady()) {
            return 0;
        }
        $stmt = $this->pdo->prepare(
            "UPDATE provider_paid_badges
             SET status = 'revoked', revoked_at = NOW()
             WHERE source_order_ref = ? AND status = 'active'"
        );
        $stmt->execute([$orderRef]);

        return $stmt->rowCount();
    }

    /**
     * 상품 코드 → 공급자 프로필 매핑
     * subject_track → study_room only
     * jjokjipge|sky → tutor only
     * hot → study_room 우선, 없으면 tutor
     *
     * @return array{provider_type: 'study_room'|'tutor', provider_id: int}|null
     */
    public function resolveProviderForUser(int $userId, string $badgeCode): ?array
    {
        $code = strtolower(trim($badgeCode));
        if ($code === 'picked') {
            $code = 'jjokjipge';
        }

        $roomId = $this->firstStudyRoomId($userId);
        $tutorId = $this->firstTutorId($userId);

        if ($code === 'subject_track') {
            return $roomId ? ['provider_type' => 'study_room', 'provider_id' => $roomId] : null;
        }
        if ($code === 'jjokjipge' || $code === 'sky') {
            return $tutorId ? ['provider_type' => 'tutor', 'provider_id' => $tutorId] : null;
        }
        if ($code === 'hot') {
            if ($roomId) {
                return ['provider_type' => 'study_room', 'provider_id' => $roomId];
            }
            if ($tutorId) {
                return ['provider_type' => 'tutor', 'provider_id' => $tutorId];
            }
        }

        return null;
    }

    private function firstStudyRoomId(int $userId): ?int
    {
        $stmt = $this->pdo->prepare(
            'SELECT id FROM study_rooms WHERE user_id = ? AND deleted_at IS NULL ORDER BY id ASC LIMIT 1'
        );
        $stmt->execute([$userId]);
        $id = $stmt->fetchColumn();

        return $id ? (int) $id : null;
    }

    private function firstTutorId(int $userId): ?int
    {
        $stmt = $this->pdo->prepare(
            'SELECT id FROM tutors WHERE user_id = ? ORDER BY id ASC LIMIT 1'
        );
        $stmt->execute([$userId]);
        $id = $stmt->fetchColumn();

        return $id ? (int) $id : null;
    }
}
