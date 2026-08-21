<?php

declare(strict_types=1);

namespace Study114\Paid;

use InvalidArgumentException;
use PDO;

/**
 * provider_paid_badges 적재 · 회수
 *
 * 잠금: 공부방 계정 ≠ 과외쌤 계정.
 * provider_type + provider_id 가 주문/부여 시점에 명시되어야 하며,
 * user_id 만으로 방/쌤을 추론·fallback 하지 않는다.
 *
 * @see docs/internal/59-account-context-separation-lock.md
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
        $this->assertProviderType($providerType);
        $normalized = (new PaidBadgeResolver($this->pdo))->normalizeCode($badgeCode, $providerType);
        if ($normalized === null) {
            throw new InvalidArgumentException(
                "배지 {$badgeCode} 는 {$providerType} 계정 문맥에서 허용되지 않습니다.",
            );
        }
        if ($providerId <= 0) {
            throw new InvalidArgumentException('provider_id가 필요합니다.');
        }

        $existingOrder = $this->pdo->prepare(
            'SELECT id, starts_on, end_exclusive_on, provider_type, provider_id FROM provider_paid_badges
             WHERE source_order_ref = ? AND badge_code = ? LIMIT 1'
        );
        $existingOrder->execute([$orderRef, $normalized]);
        $byOrder = $existingOrder->fetch(PDO::FETCH_ASSOC);
        if (is_array($byOrder)) {
            if (
                (string) $byOrder['provider_type'] !== $providerType
                || (int) $byOrder['provider_id'] !== $providerId
            ) {
                throw new InvalidArgumentException('동일 주문이 다른 계정 문맥에 재적용될 수 없습니다.');
            }

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
     * 로그인 user가 해당 계정 문맥(공부방/과외쌤 프로필)을 소유하는지 검증.
     * 추론·fallback 없음 — 호출측이 type+id를 반드시 넘긴다.
     *
     * @param 'study_room'|'tutor' $providerType
     */
    public function assertOwnedProvider(int $userId, string $providerType, int $providerId): void
    {
        $this->assertProviderType($providerType);
        if ($providerId <= 0) {
            throw new InvalidArgumentException('provider_id가 필요합니다.');
        }

        if ($providerType === 'study_room') {
            $stmt = $this->pdo->prepare(
                'SELECT 1 FROM study_rooms
                 WHERE id = ? AND user_id = ? AND deleted_at IS NULL LIMIT 1'
            );
            $stmt->execute([$providerId, $userId]);
            if (!$stmt->fetchColumn()) {
                throw new InvalidArgumentException('공부방 계정 문맥이 없거나 소유자가 아닙니다.');
            }

            return;
        }

        $stmt = $this->pdo->prepare(
            'SELECT 1 FROM tutors WHERE id = ? AND user_id = ? LIMIT 1'
        );
        $stmt->execute([$providerId, $userId]);
        if (!$stmt->fetchColumn()) {
            throw new InvalidArgumentException('과외쌤 계정 문맥이 없거나 소유자가 아닙니다.');
        }
    }

    /** @param 'study_room'|'tutor' $providerType */
    public function assertBadgeAllowedForProvider(string $providerType, string $badgeCode): void
    {
        $normalized = (new PaidBadgeResolver($this->pdo))->normalizeCode($badgeCode, $providerType);
        if ($normalized === null) {
            throw new InvalidArgumentException(
                "배지 {$badgeCode} 는 {$providerType} 전용 상품이 아닙니다. (계정 문맥 분리)",
            );
        }
    }

    private function assertProviderType(string $providerType): void
    {
        if ($providerType !== 'study_room' && $providerType !== 'tutor') {
            throw new InvalidArgumentException('provider_type은 study_room | tutor 만 허용합니다.');
        }
    }
}
