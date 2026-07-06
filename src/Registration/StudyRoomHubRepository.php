<?php

declare(strict_types=1);

namespace Study114\Registration;

use PDO;

/** 20장 P20 — study_rooms 등록 허브 */
final class StudyRoomHubRepository
{
    public function __construct(private readonly PDO $pdo)
    {
    }

    /** @return list<array<string, mixed>> */
    public function listForOwner(int $userId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT sr.* FROM study_rooms sr
             WHERE sr.user_id = ? AND sr.deleted_at IS NULL
             ORDER BY sr.updated_at DESC, sr.id DESC'
        );
        $stmt->execute([$userId]);

        return array_map(fn (array $row) => $this->hydrateRoomRow((int) $row['id'], $row), $stmt->fetchAll());
    }

    /** @return array<string, mixed>|null */
    public function getForOwner(int $userId, int $roomId): ?array
    {
        $stmt = $this->pdo->prepare(
            'SELECT sr.* FROM study_rooms sr
             WHERE sr.id = ? AND sr.user_id = ? AND sr.deleted_at IS NULL LIMIT 1'
        );
        $stmt->execute([$roomId, $userId]);
        $row = $stmt->fetch();

        return $row !== false ? $this->hydrateRoomRow($roomId, $row) : null;
    }

    public function setProfileStatus(int $roomId, string $status, ?string $publishedAt = null): void
    {
        $stmt = $this->pdo->prepare(
            'UPDATE study_rooms SET profile_status = ?, published_at = COALESCE(?, published_at), updated_at = NOW()
             WHERE id = ?'
        );
        $stmt->execute([$status, $publishedAt, $roomId]);
    }

    public function setInquiryStatus(int $roomId, string $status): void
    {
        $stmt = $this->pdo->prepare(
            'UPDATE study_rooms SET inquiry_status = ?, updated_at = NOW() WHERE id = ?'
        );
        $stmt->execute([$status, $roomId]);
    }

    public function softDelete(int $roomId): void
    {
        $stmt = $this->pdo->prepare(
            'UPDATE study_rooms SET deleted_at = NOW(), profile_status = "hidden", updated_at = NOW() WHERE id = ?'
        );
        $stmt->execute([$roomId]);
    }

    /** @param array<string, mixed> $row @return array<string, mixed> */
    private function hydrateRoomRow(int $roomId, array $row): array
    {
        $regionLabel = $this->regionLabel($roomId, $row);
        $hasSubjects = $this->exists(
            'SELECT 1 FROM study_room_subject_targets WHERE study_room_id = ? LIMIT 1',
            [$roomId]
        );
        $hasRegions = $this->exists(
            'SELECT 1 FROM study_room_regions WHERE study_room_id = ? LIMIT 1',
            [$roomId]
        ) || !empty($row['region_id']);
        $hasImage = $this->exists(
            'SELECT 1 FROM study_room_images WHERE study_room_id = ? LIMIT 1',
            [$roomId]
        );
        $profileStatus = (string) $row['profile_status'];
        if ($profileStatus === 'pending') {
            $profileStatus = 'draft';
        }

        return [
            'id'                       => $roomId,
            'study_room_name'          => (string) ($row['study_room_name'] ?? ''),
            'profile_status'           => $profileStatus,
            'inquiry_status'           => (string) ($row['inquiry_status'] ?? 'open'),
            'detail_completion_status' => (string) ($row['detail_completion_status'] ?? 'basic_only'),
            'region_label'             => $regionLabel,
            'main_subject_note'        => (string) ($row['main_subject_note'] ?? ''),
            'grade_band'               => $this->gradeBand($roomId),
            'price_amount'             => $row['price_amount'] !== null ? (int) $row['price_amount'] : null,
            'intro_short'              => $row['intro_short'] !== null ? (string) $row['intro_short'] : null,
            'intro_long'               => $row['intro_long'] !== null ? (string) $row['intro_long'] : null,
            'slogan'                   => $row['slogan'] !== null ? (string) $row['slogan'] : null,
            'feature_1'                => $row['feature_1'] !== null ? (string) $row['feature_1'] : null,
            'career_years'             => $row['career_years'] !== null ? (int) $row['career_years'] : null,
            'education_office_registered' => (bool) ($row['education_office_registered'] ?? false),
            'weekend_available'        => (bool) ($row['weekend_available'] ?? false),
            'one_on_one_available'     => (bool) ($row['one_on_one_available'] ?? false),
            'lesson_place_type'        => $row['lesson_place_type'] !== null ? (string) $row['lesson_place_type'] : null,
            'capacity_per_time'        => $row['capacity_per_time'] !== null ? (string) $row['capacity_per_time'] : null,
            'facility_summary'         => $this->facilitySummary($roomId),
            'has_representative_image' => $hasImage,
            'has_subject_targets'      => $hasSubjects,
            'has_regions'              => $hasRegions,
            'lesson_place_set'         => !empty($row['lesson_place_type']),
            'contact_method_set'       => !empty($row['contact_time_note']),
            'compare_eligible'         => $profileStatus === 'published',
            'prime_eligible'           => (string) ($row['detail_completion_status'] ?? '') === 'expanded_complete',
            'updated_at'               => gmdate('c', strtotime((string) $row['updated_at'])),
            'published_at'             => $row['published_at'] !== null
                ? gmdate('c', strtotime((string) $row['published_at'])) : null,
            'deleted_at'               => null,
        ];
    }

    /** @param array<string, mixed> $row */
    private function regionLabel(int $roomId, array $row): string
    {
        if (!empty($row['region_id'])) {
            $stmt = $this->pdo->prepare(
                'SELECT CONCAT(r.dong_name, IFNULL(CONCAT(" · ", c.name), ""))
                 FROM study_rooms sr
                 LEFT JOIN regions r ON sr.region_id = r.id
                 LEFT JOIN complexes c ON sr.complex_id = c.id
                 WHERE sr.id = ? LIMIT 1'
            );
            $stmt->execute([$roomId]);
            $val = $stmt->fetchColumn();
            if ($val !== false && $val !== '') {
                return (string) $val;
            }
        }
        $stmt = $this->pdo->prepare(
            'SELECT CONCAT(r.dong_name, IFNULL(CONCAT(" · ", c.name), ""))
             FROM study_room_regions srr
             JOIN regions r ON srr.region_id = r.id
             LEFT JOIN complexes c ON srr.complex_id = c.id
             WHERE srr.study_room_id = ? AND srr.is_primary = 1 LIMIT 1'
        );
        $stmt->execute([$roomId]);
        $val = $stmt->fetchColumn();

        return $val !== false ? (string) $val : '';
    }

    private function gradeBand(int $roomId): ?string
    {
        $stmt = $this->pdo->prepare(
            'SELECT grade_band FROM study_room_subject_targets WHERE study_room_id = ? AND grade_band IS NOT NULL LIMIT 1'
        );
        $stmt->execute([$roomId]);
        $val = $stmt->fetchColumn();

        return $val !== false ? (string) $val : null;
    }

    private function facilitySummary(int $roomId): string
    {
        $stmt = $this->pdo->prepare(
            'SELECT fm.facility_name FROM study_room_facilities srf
             JOIN facility_masters fm ON fm.id = srf.facility_id
             WHERE srf.study_room_id = ? ORDER BY fm.sort_order ASC LIMIT 3'
        );
        $stmt->execute([$roomId]);
        $names = $stmt->fetchAll(PDO::FETCH_COLUMN);

        return implode('·', array_map('strval', $names));
    }

    /** @param list<mixed> $params */
    private function exists(string $sql, array $params): bool
    {
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);

        return (bool) $stmt->fetchColumn();
    }
}
