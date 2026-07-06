<?php

declare(strict_types=1);

namespace Study114\Admin;

use PDO;

/** A28-07 — 노출·권한 수동 보정 대상 조회 */
final class AdminExposureRepository
{
    private const BOARD_SUBMISSION = 'submission';

    public function __construct(private readonly PDO $pdo)
    {
    }

    /** @return list<array<string, mixed>> */
    public function listStudyRooms(?string $status = null): array
    {
        $sql = 'SELECT id, study_room_name, profile_status, inquiry_status, published_at, updated_at
                FROM study_rooms
                WHERE deleted_at IS NULL';
        $params = [];

        if ($status !== null && $status !== '' && $status !== 'all') {
            if ($status === 'pending') {
                $sql .= ' AND profile_status IN ("draft", "pending")';
            } else {
                $sql .= ' AND profile_status = ?';
                $params[] = $status;
            }
        }

        $sql .= ' ORDER BY updated_at DESC, id DESC LIMIT 200';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);

        return array_map(fn (array $row) => $this->mapStudyRoom($row), $stmt->fetchAll());
    }

    /** @return list<array<string, mixed>> */
    public function listTutors(?string $status = null): array
    {
        $sql = 'SELECT id, tutor_display_name, profile_status, published_at, updated_at
                FROM tutors WHERE 1=1';
        $params = [];

        if ($status !== null && $status !== '' && $status !== 'all') {
            if ($status === 'pending') {
                $sql .= ' AND profile_status IN ("draft", "pending")';
            } else {
                $sql .= ' AND profile_status = ?';
                $params[] = $status;
            }
        }

        $sql .= ' ORDER BY updated_at DESC, id DESC LIMIT 200';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);

        return array_map(fn (array $row) => $this->mapTutor($row), $stmt->fetchAll());
    }

    /** @return list<array<string, mixed>> */
    public function listSubmissions(?string $status = null): array
    {
        $sql = 'SELECT post_key, author_role, status, title, internal_memo, updated_at
                FROM board_posts
                WHERE board_key = ?';
        $params = [self::BOARD_SUBMISSION];

        if ($status !== null && $status !== '' && $status !== 'all') {
            $sql .= ' AND status = ?';
            $params[] = $status;
        }

        $sql .= ' ORDER BY updated_at DESC, id DESC LIMIT 200';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);

        return array_map(fn (array $row) => $this->mapSubmission($row), $stmt->fetchAll());
    }

    /** @return array<string, mixed>|null */
    public function findStudyRoom(int $id): ?array
    {
        $stmt = $this->pdo->prepare(
            'SELECT id, study_room_name, profile_status, inquiry_status, published_at, updated_at
             FROM study_rooms WHERE id = ? AND deleted_at IS NULL LIMIT 1'
        );
        $stmt->execute([$id]);
        $row = $stmt->fetch();

        return $row !== false ? $this->mapStudyRoom($row) : null;
    }

    /** @return array<string, mixed>|null */
    public function findTutor(int $id): ?array
    {
        $stmt = $this->pdo->prepare(
            'SELECT id, tutor_display_name, profile_status, published_at, updated_at
             FROM tutors WHERE id = ? LIMIT 1'
        );
        $stmt->execute([$id]);
        $row = $stmt->fetch();

        return $row !== false ? $this->mapTutor($row) : null;
    }

    /** @return array<string, mixed>|null */
    public function findSubmission(string $postKey): ?array
    {
        $stmt = $this->pdo->prepare(
            'SELECT post_key, author_role, status, title, internal_memo, updated_at
             FROM board_posts WHERE board_key = ? AND post_key = ? LIMIT 1'
        );
        $stmt->execute([self::BOARD_SUBMISSION, $postKey]);
        $row = $stmt->fetch();

        return $row !== false ? $this->mapSubmission($row) : null;
    }

    /** @param array<string, mixed> $row @return array<string, mixed> */
    private function mapStudyRoom(array $row): array
    {
        $profileStatus = $this->normalizeProfileStatus((string) $row['profile_status']);
        $inquiryStatus = (string) ($row['inquiry_status'] ?? 'open');

        return [
            'targetType' => 'study_room',
            'targetId' => (string) $row['id'],
            'label' => (string) $row['study_room_name'],
            'status' => $profileStatus,
            'statusLabel' => $this->profileStatusLabel($profileStatus),
            'secondaryStatus' => $inquiryStatus,
            'secondaryLabel' => $this->inquiryStatusLabel($inquiryStatus),
            'searchVisible' => $profileStatus === 'published',
            'internalMemo' => '',
            'updatedAt' => substr((string) $row['updated_at'], 0, 10),
        ];
    }

    /** @param array<string, mixed> $row @return array<string, mixed> */
    private function mapTutor(array $row): array
    {
        $profileStatus = $this->normalizeProfileStatus((string) $row['profile_status']);

        return [
            'targetType' => 'tutor',
            'targetId' => (string) $row['id'],
            'label' => (string) $row['tutor_display_name'],
            'status' => $profileStatus,
            'statusLabel' => $this->profileStatusLabel($profileStatus),
            'secondaryStatus' => null,
            'secondaryLabel' => null,
            'searchVisible' => $profileStatus === 'published',
            'internalMemo' => '',
            'updatedAt' => substr((string) $row['updated_at'], 0, 10),
        ];
    }

    /** @param array<string, mixed> $row @return array<string, mixed> */
    private function mapSubmission(array $row): array
    {
        $status = (string) $row['status'];

        return [
            'targetType' => 'submission',
            'targetId' => (string) $row['post_key'],
            'label' => (string) $row['title'],
            'status' => $status,
            'statusLabel' => $this->submissionStatusLabel($status),
            'secondaryStatus' => (string) $row['author_role'],
            'secondaryLabel' => (string) $row['author_role'],
            'searchVisible' => $status === 'published',
            'internalMemo' => (string) ($row['internal_memo'] ?? ''),
            'updatedAt' => substr((string) $row['updated_at'], 0, 10),
        ];
    }

    private function normalizeProfileStatus(string $status): string
    {
        return $status === 'pending' ? 'draft' : $status;
    }

    private function profileStatusLabel(string $status): string
    {
        return match ($status) {
            'published' => '공개중',
            'hidden' => '숨김',
            'draft' => '비공개',
            default => $status,
        };
    }

    private function submissionStatusLabel(string $status): string
    {
        return match ($status) {
            'published' => '게시중',
            'hidden' => '비공개',
            'submitted' => '제출됨',
            'draft' => '저장중',
            default => $status,
        };
    }

    private function inquiryStatusLabel(string $status): string
    {
        return match ($status) {
            'open' => '상담 수용',
            'paused' => '상담 일시중지',
            'capacity_full' => '정원 마감',
            'waiting_only' => '대기만',
            default => $status,
        };
    }
}
