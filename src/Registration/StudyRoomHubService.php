<?php

declare(strict_types=1);

namespace Study114\Registration;

use InvalidArgumentException;
use Study114\Database\Connection;

/** 20장 P20 — study_rooms 허브 API */
final class StudyRoomHubService
{
    private const INQUIRY_STATUSES = ['open', 'paused', 'capacity_full', 'waiting_only'];

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
            'hide'           => $this->hide($userId, $roomId),
            'delete'         => $this->delete($roomId),
            'inquiry_status' => $this->setInquiry($userId, $roomId, $input),
            default          => throw new InvalidArgumentException('action: publish | hide | delete | inquiry_status'),
        };
    }

    /** @param array<string, mixed> $room */
    private function publish(int $userId, int $roomId, array $room): array
    {
        (new \Study114\Auth\EmailVerificationGate())->assertVerified($userId);

        $missing = $this->publishMissing($room);
        if ($missing !== []) {
            return ['ok' => false, 'reason' => 'incomplete', 'missing' => $missing];
        }
        $this->repo->setProfileStatus($roomId, 'published', date('Y-m-d H:i:s'));

        return ['room' => $this->repo->getForOwner($userId, $roomId) ?? $room];
    }

    private function hide(int $userId, int $roomId): array
    {
        $this->repo->setProfileStatus($roomId, 'hidden');

        return ['room' => $this->repo->getForOwner($userId, $roomId) ?? []];
    }

    private function delete(int $roomId): array
    {
        $this->repo->softDelete($roomId);

        return ['deleted' => true];
    }

    /** @param array<string, mixed> $input */
    private function setInquiry(int $userId, int $roomId, array $input): array
    {
        $status = (string) ($input['inquiry_status'] ?? '');
        if (!in_array($status, self::INQUIRY_STATUSES, true)) {
            throw new InvalidArgumentException('inquiry_status: open | paused | capacity_full | waiting_only');
        }
        $this->repo->setInquiryStatus($roomId, $status);

        return ['room' => $this->repo->getForOwner($userId, $roomId) ?? []];
    }

    /**
     * @param array<string, mixed> $room
     * @return list<string>
     */
    private function publishMissing(array $room): array
    {
        $missing = [];
        $need = static function (bool $ok, string $label) use (&$missing): void {
            if (!$ok) {
                $missing[] = $label;
            }
        };

        $need(!empty($room['study_room_name']), '공부방명');
        $need($room['has_regions'] && !empty($room['region_label']), '활동 지역');
        $need($room['has_subject_targets'] && !empty($room['main_subject_note']), '대상·과목');
        $need($room['lesson_place_set'] && !empty($room['lesson_place_type']), '수업 방식');
        $need($room['detail_completion_status'] === 'expanded_complete', '상세등록 완료');
        $need($room['has_representative_image'], '대표 이미지 1장 이상');
        $need(!empty($room['intro_short']) || !empty($room['intro_long']), '소개문');
        $need($room['contact_method_set'], '문의·연락 방식');

        return $missing;
    }
}
