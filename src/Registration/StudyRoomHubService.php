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

        // 기본등록 완료 = 카드 노출. 회원 공개·숨김 동작은 없다(숨김은 관리자 페이지만).
        return match ($action) {
            'inquiry_status' => $this->setInquiry($userId, $roomId, $input),
            default          => throw new InvalidArgumentException('지원하지 않는 요청입니다.'),
        };
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
