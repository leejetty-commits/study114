<?php

declare(strict_types=1);

namespace Study114\Admin;

use PDO;
use Study114\Visibility\WithdrawnOwnerSql;

/** A28-07 — 노출·권한 수동 보정 대상 조회 */
final class AdminExposureRepository
{
    private const BOARD_SUBMISSION = 'submission';

    public function __construct(private readonly PDO $pdo)
    {
    }

    /** 동 이름이 있으면 동, 없으면 시도+시·군(구). */
    private function regionDisplayExpr(string $alias): string
    {
        return 'CASE
            WHEN NULLIF(TRIM(' . $alias . '.dong_name), \'\') IS NOT NULL THEN ' . $alias . '.dong_name
            ELSE TRIM(CONCAT_WS(\' \', NULLIF(TRIM(' . $alias . '.sido_name), \'\'), NULLIF(TRIM(' . $alias . '.sigungu_name), \'\')))
        END';
    }

    /** @return list<array<string, mixed>> */
    public function listStudyRooms(?string $status = null, ?int $userId = null): array
    {
        $regionExpr = $this->regionDisplayExpr('r');
        $sql = 'SELECT id, user_id, study_room_name, profile_status, inquiry_status, published_at, updated_at,
                       (SELECT ' . $regionExpr . '
                          FROM study_room_regions srr
                          INNER JOIN regions r ON r.id = srr.region_id
                         WHERE srr.study_room_id = study_rooms.id
                         ORDER BY srr.slot ASC
                         LIMIT 1) AS region_label
                FROM study_rooms
                WHERE deleted_at IS NULL AND '
            . WithdrawnOwnerSql::notWithdrawn('study_rooms.user_id');
        $params = [];
        if ($userId !== null && $userId > 0) {
            $sql .= ' AND user_id = ?';
            $params[] = $userId;
        }

        $this->appendProfileStatusFilter($sql, $params, $status);

        $sql .= ' ORDER BY updated_at DESC, id DESC LIMIT 200';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);

        return array_map(fn (array $row) => $this->mapStudyRoom($row), $stmt->fetchAll());
    }

    /** @return list<array<string, mixed>> */
    public function listTutors(?string $status = null, ?int $userId = null): array
    {
        $regionExpr = $this->regionDisplayExpr('r');
        $sql = 'SELECT id, user_id, tutor_display_name, profile_status, published_at, updated_at,
                       (SELECT ' . $regionExpr . '
                          FROM tutor_regions tr
                          INNER JOIN regions r ON r.id = tr.region_id
                         WHERE tr.tutor_id = tutors.id
                         ORDER BY tr.is_primary DESC, tr.priority_order ASC
                         LIMIT 1) AS region_label
                FROM tutors WHERE ' . WithdrawnOwnerSql::notWithdrawn('tutors.user_id');
        $params = [];
        if ($userId !== null && $userId > 0) {
            $sql .= ' AND user_id = ?';
            $params[] = $userId;
        }

        $this->appendProfileStatusFilter($sql, $params, $status);

        $sql .= ' ORDER BY updated_at DESC, id DESC LIMIT 200';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);

        return array_map(fn (array $row) => $this->mapTutor($row), $stmt->fetchAll());
    }

    /** @return list<array<string, mixed>> */
    public function listStudents(?string $status = null, ?int $userId = null): array
    {
        $regionExpr = $this->regionDisplayExpr('r');
        $sql = 'SELECT s.id, s.guardian_user_id, s.public_display_name, s.student_name,
                       s.exposure_status, s.updated_at,
                       COALESCE(
                         (SELECT ' . $regionExpr . ' FROM regions r WHERE r.id = s.preferred_studyroom_region_id LIMIT 1),
                         (SELECT ' . $regionExpr . ' FROM regions r WHERE r.id = s.preferred_tutor_region_id LIMIT 1),
                         NULLIF(TRIM(s.preferred_region_note), \'\')
                       ) AS region_label
                FROM students s
                WHERE s.deleted_at IS NULL
                  AND s.exposure_status <> \'deleted\'
                  AND ' . WithdrawnOwnerSql::notWithdrawn('s.guardian_user_id');
        $params = [];
        if ($userId !== null && $userId > 0) {
            $sql .= ' AND s.guardian_user_id = ?';
            $params[] = $userId;
        }
        if ($status !== null && $status !== '' && $status !== 'all') {
            $sql .= ' AND s.exposure_status = ?';
            $params[] = $status === 'pending' ? 'draft' : $status;
        }

        $sql .= ' ORDER BY s.updated_at DESC, s.id DESC LIMIT 200';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);

        return array_map(fn (array $row) => $this->mapStudent($row), $stmt->fetchAll());
    }

    /** @return list<array<string, mixed>> */
    public function listSubmissions(?string $status = null): array
    {
        $sql = 'SELECT post_key, author_role, status, title, internal_memo, updated_at
                FROM board_posts
                WHERE board_key = ? AND '
            . WithdrawnOwnerSql::unlessWithdrawn('board_posts.author_user_id');
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
    public function findStudent(int $id): ?array
    {
        $regionExpr = $this->regionDisplayExpr('r');
        $stmt = $this->pdo->prepare(
            'SELECT s.id, s.guardian_user_id, s.public_display_name, s.student_name,
                    s.exposure_status, s.updated_at,
                    COALESCE(
                      (SELECT ' . $regionExpr . ' FROM regions r WHERE r.id = s.preferred_studyroom_region_id LIMIT 1),
                      (SELECT ' . $regionExpr . ' FROM regions r WHERE r.id = s.preferred_tutor_region_id LIMIT 1),
                      NULLIF(TRIM(s.preferred_region_note), \'\')
                    ) AS region_label
             FROM students s
             WHERE s.id = ?
               AND s.deleted_at IS NULL
               AND s.exposure_status <> \'deleted\'
               AND ' . WithdrawnOwnerSql::notWithdrawn('s.guardian_user_id') . '
             LIMIT 1'
        );
        $stmt->execute([$id]);
        $row = $stmt->fetch();

        return $row !== false ? $this->mapStudent($row) : null;
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
            'regionLabel' => (string) ($row['region_label'] ?? ''),
            'ownerUserId' => (int) ($row['user_id'] ?? 0),
            'searchVisible' => $profileStatus !== 'hidden',
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
            'regionLabel' => (string) ($row['region_label'] ?? ''),
            'ownerUserId' => (int) ($row['user_id'] ?? 0),
            'searchVisible' => $profileStatus !== 'hidden',
            'internalMemo' => '',
            'updatedAt' => substr((string) $row['updated_at'], 0, 10),
        ];
    }

    /** @param array<string, mixed> $row @return array<string, mixed> */
    private function mapStudent(array $row): array
    {
        $status = (string) ($row['exposure_status'] ?? 'draft');
        $publicName = trim((string) ($row['public_display_name'] ?? ''));
        $label = $publicName !== ''
            ? $publicName
            : \Study114\Auth\AccountWithdrawService::maskDisplayName((string) ($row['student_name'] ?? ''));

        return [
            'targetType' => 'student',
            'targetId' => (string) $row['id'],
            'label' => $label,
            'regionLabel' => (string) ($row['region_label'] ?? ''),
            'ownerUserId' => (int) ($row['guardian_user_id'] ?? 0),
            'status' => $status,
            'statusLabel' => $this->profileStatusLabel($status),
            'secondaryStatus' => null,
            'secondaryLabel' => null,
            'searchVisible' => $status === 'published',
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

    /** @param list<mixed> $params */
    private function appendProfileStatusFilter(string &$sql, array &$params, ?string $status): void
    {
        if ($status === null || $status === '' || $status === 'all') {
            return;
        }
        if ($status === 'pending' || $status === 'draft') {
            $sql .= ' AND profile_status IN ("draft", "pending")';
            return;
        }
        $sql .= ' AND profile_status = ?';
        $params[] = $status;
    }

    private function profileStatusLabel(string $status): string
    {
        return match ($status) {
            'published' => '보임',
            'hidden' => '홈·찾기에서 숨김',
            'draft', 'pending' => '작성 중',
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
