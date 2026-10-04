<?php

declare(strict_types=1);

namespace Study114\Registration;

use InvalidArgumentException;
use Study114\Database\Connection;

/** 20장 P20 — study_rooms 허브 API */
final class StudyRoomHubService
{
    private StudyRoomHubRepository $repo;

    public function __construct(?StudyRoomHubRepository $repo = null)
    {
        $this->repo = $repo ?? new StudyRoomHubRepository(Connection::get());
    }

    /** @return list<array<string, mixed>> */
    public function listForOwner(int $userId): array
    {
        return $this->repo->listForOwner($userId);
    }

    /** @return array<string, mixed>|null */
    public function get(int $userId, int $roomId): ?array
    {
        return $this->repo->getForOwner($userId, $roomId);
    }

    /**
     * @param array<string, mixed> $input
     * @return array<string, mixed>
     */
    public function applyAction(int $userId, int $roomId, string $action, array $input = []): array
    {
        $room = $this->repo->getForOwner($userId, $roomId);
        if ($room === null) {
            throw new InvalidArgumentException('공부방을 찾을 수 없습니다.');
        }

        return match ($action) {
            'publish'        => $this->publish($userId, $roomId, $room),
            'inquiry_status' => $this->setInquiry($userId, $roomId, $input),
            'delete'         => throw new InvalidArgumentException('지원하지 않는 요청입니다.'),
            default          => throw new InvalidArgumentException('지원하지 않는 요청입니다.'),
        };
    }

    /** @param array<string, mixed> $room */
    private function publish(int $userId, int $roomId, array $room): array
    {
        (new \Study114\Auth\EmailVerificationGate())->assertVerified($userId);

        if (!$this->hasPromoSlot1($roomId)) {
            throw new InvalidArgumentException('홍보지역 1(대표)을 선택해 주세요.');
        }

        // 공개는 입력 완성도·쪽지 설정과 독립. 베이직 노출은 빈 상세값이 있어도 가능.
        $this->repo->setProfileStatus($roomId, 'published', date('Y-m-d H:i:s'));

        return ['room' => $this->repo->getForOwner($userId, $roomId) ?? $room];
    }

    private function hasPromoSlot1(int $roomId): bool
    {
        $stmt = Connection::get()->prepare(
            'SELECT 1 FROM study_room_regions
             WHERE study_room_id = ? AND slot = 1
               AND region_id IS NOT NULL AND region_id <> 0
             LIMIT 1'
        );
        $stmt->execute([$roomId]);

        return $stmt->fetchColumn() !== false;
    }

    /** @param array<string, mixed> $input */
    private function setInquiry(int $userId, int $roomId, array $input): array
    {
        $status = (string) ($input['inquiry_status'] ?? '');
        $operatorStatuses = ['open', 'paused', 'capacity_full'];
        if (!in_array($status, $operatorStatuses, true)) {
            throw new InvalidArgumentException('inquiry_status: open | paused | capacity_full');
        }
        $this->repo->setInquiryStatus($roomId, $status);

        return ['room' => $this->repo->getForOwner($userId, $roomId) ?? []];
    }

}
