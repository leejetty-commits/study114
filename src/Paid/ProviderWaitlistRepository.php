<?php

declare(strict_types=1);

namespace Study114\Paid;

use InvalidArgumentException;
use PDO;

/**
 * 공부방 Prime 예약대기 — study_room_exposure_waitlists
 * Pick·과외쌤 금지. 순번·경쟁업체 미노출.
 */
final class ProviderWaitlistRepository
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
        $stmt->execute(['study_room_exposure_waitlists']);

        return (bool) $stmt->fetchColumn();
    }

    /**
     * @param 'complex'|'dong' $regionBasisType
     * @return array<string, mixed>
     */
    public function register(
        int $studyRoomId,
        string $regionBasisType,
        ?int $regionId,
        ?int $complexId,
        string $slotGroup,
    ): array {
        if (!$this->tableReady()) {
            throw new InvalidArgumentException(
                'study_room_exposure_waitlists 테이블이 없습니다. schema 009를 적용하세요.',
            );
        }
        if ($studyRoomId <= 0) {
            throw new InvalidArgumentException('study_room_id가 필요합니다.');
        }
        if ($regionBasisType !== 'complex' && $regionBasisType !== 'dong') {
            throw new InvalidArgumentException('region_basis_type은 complex | dong 만 허용합니다.');
        }
        $slotGroup = trim($slotGroup);
        if ($slotGroup === '') {
            throw new InvalidArgumentException('적용 지역(slot_group)이 필요합니다.');
        }

        $existing = $this->findActive($studyRoomId, $slotGroup);
        if ($existing !== null) {
            return $existing;
        }

        $stmt = $this->pdo->prepare(
            "INSERT INTO study_room_exposure_waitlists
              (study_room_id, exposure_type, region_basis_type, region_id, complex_id, slot_group,
               payment_status, registered_at)
             VALUES (?, 'prime', ?, ?, ?, ?, 'registered', NOW())"
        );
        $stmt->execute([
            $studyRoomId,
            $regionBasisType,
            $regionId,
            $complexId,
            $slotGroup,
        ]);

        $row = $this->findById((int) $this->pdo->lastInsertId());
        if ($row === null) {
            throw new InvalidArgumentException('예약대기 등록에 실패했습니다.');
        }

        return $row;
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function listForStudyRoom(int $studyRoomId): array
    {
        if (!$this->tableReady() || $studyRoomId <= 0) {
            return [];
        }
        $stmt = $this->pdo->prepare(
            "SELECT id, study_room_id, exposure_type, region_basis_type, region_id, complex_id,
                    slot_group, payment_status, registered_at, open_notice_sent_at,
                    waitlist_window_starts_at, waitlist_window_ends_at, payment_completed_at
             FROM study_room_exposure_waitlists
             WHERE study_room_id = ? AND exposure_type = 'prime'
               AND payment_status IN ('registered', 'notified')
             ORDER BY registered_at DESC, id DESC"
        );
        $stmt->execute([$studyRoomId]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return is_array($rows) ? $rows : [];
    }

    public function cancel(int $studyRoomId, int $waitlistId): bool
    {
        if (!$this->tableReady() || $studyRoomId <= 0 || $waitlistId <= 0) {
            return false;
        }
        $stmt = $this->pdo->prepare(
            "UPDATE study_room_exposure_waitlists
             SET payment_status = 'cancelled'
             WHERE id = ? AND study_room_id = ? AND exposure_type = 'prime'
               AND payment_status IN ('registered', 'notified')"
        );
        $stmt->execute([$waitlistId, $studyRoomId]);

        return $stmt->rowCount() > 0;
    }

    /** @return array<string, mixed>|null */
    private function findActive(int $studyRoomId, string $slotGroup): ?array
    {
        $stmt = $this->pdo->prepare(
            "SELECT id, study_room_id, exposure_type, region_basis_type, region_id, complex_id,
                    slot_group, payment_status, registered_at, open_notice_sent_at,
                    waitlist_window_starts_at, waitlist_window_ends_at, payment_completed_at
             FROM study_room_exposure_waitlists
             WHERE study_room_id = ? AND exposure_type = 'prime' AND slot_group = ?
               AND payment_status IN ('registered', 'notified')
             ORDER BY id DESC LIMIT 1"
        );
        $stmt->execute([$studyRoomId, $slotGroup]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return is_array($row) ? $row : null;
    }

    /** @return array<string, mixed>|null */
    private function findById(int $id): ?array
    {
        $stmt = $this->pdo->prepare(
            "SELECT id, study_room_id, exposure_type, region_basis_type, region_id, complex_id,
                    slot_group, payment_status, registered_at, open_notice_sent_at,
                    waitlist_window_starts_at, waitlist_window_ends_at, payment_completed_at
             FROM study_room_exposure_waitlists WHERE id = ? LIMIT 1"
        );
        $stmt->execute([$id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return is_array($row) ? $row : null;
    }
}
