<?php

declare(strict_types=1);

namespace Study114\Registration;

use PDO;

/** 21장 P21 — tutors 등록 허브 */
final class TutorHubRepository
{
    public function __construct(private readonly PDO $pdo)
    {
    }

    /** @return list<array<string, mixed>> */
    public function listForOwner(int $userId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT t.* FROM tutors t WHERE t.user_id = ? ORDER BY t.updated_at DESC, t.id DESC'
        );
        $stmt->execute([$userId]);

        return array_map(fn (array $row) => $this->hydrateTutorRow((int) $row['id'], $row), $stmt->fetchAll());
    }

    /** @return array<string, mixed>|null */
    public function getForOwner(int $userId, int $tutorId): ?array
    {
        $stmt = $this->pdo->prepare(
            'SELECT t.* FROM tutors t WHERE t.id = ? AND t.user_id = ? LIMIT 1'
        );
        $stmt->execute([$tutorId, $userId]);
        $row = $stmt->fetch();

        return $row !== false ? $this->hydrateTutorRow($tutorId, $row) : null;
    }

    public function setProfileStatus(int $tutorId, string $status, ?string $publishedAt = null): void
    {
        $stmt = $this->pdo->prepare(
            'UPDATE tutors SET profile_status = ?, published_at = COALESCE(?, published_at), updated_at = NOW()
             WHERE id = ?'
        );
        $stmt->execute([$status, $publishedAt, $tutorId]);
    }

    public function softDelete(int $tutorId): void
    {
        $stmt = $this->pdo->prepare(
            'UPDATE tutors SET profile_status = "hidden", updated_at = NOW() WHERE id = ?'
        );
        $stmt->execute([$tutorId]);
    }

    /** @param array<string, mixed> $row @return array<string, mixed> */
    private function hydrateTutorRow(int $tutorId, array $row): array
    {
        $primaryRegion = $this->primaryRegionLabel($tutorId);
        $lessonPlaces = $this->lessonPlaces($tutorId);
        $badges = $this->styleBadges($tutorId);
        $profileStatus = (string) $row['profile_status'];
        if ($profileStatus === 'pending') {
            $profileStatus = 'draft';
        }

        return [
            'id'                       => $tutorId,
            'tutor_display_name'       => (string) ($row['tutor_display_name'] ?? ''),
            'profile_status'           => $profileStatus,
            'detail_completion_status' => (string) ($row['detail_completion_status'] ?? 'basic_only'),
            'location_label'           => $primaryRegion !== '' ? $primaryRegion : '—',
            'primary_region_label'     => $primaryRegion,
            'main_subject_note'        => $this->primarySubject($tutorId),
            'grade_band'               => $this->gradeBand($tutorId),
            'preferred_fee_amount'     => $row['preferred_fee_amount'] !== null ? (int) $row['preferred_fee_amount'] : null,
            'lessons_per_week'         => $row['lessons_per_week'] !== null ? (int) $row['lessons_per_week'] : null,
            'minutes_per_lesson'       => $row['minutes_per_lesson'] !== null ? (int) $row['minutes_per_lesson'] : null,
            'intro_short'              => $row['intro_short'] !== null ? (string) $row['intro_short'] : null,
            'intro_long'               => $row['intro_long'] !== null ? (string) $row['intro_long'] : null,
            'feature_1'                => $row['feature_1'] !== null ? (string) $row['feature_1'] : null,
            'university_name'          => $row['university_name'] !== null ? (string) $row['university_name'] : null,
            'major_name'               => $row['major_name'] !== null ? (string) $row['major_name'] : null,
            'university_status'        => $row['university_status'] !== null ? (string) $row['university_status'] : null,
            'proof_document_available' => (bool) ($row['proof_document_available'] ?? false),
            'has_primary_region'       => $primaryRegion !== '',
            'has_primary_subject'      => $this->primarySubject($tutorId) !== '',
            'has_lesson_places'        => $lessonPlaces !== [],
            'has_profile_image'        => $this->hasProfileImage($tutorId),
            'education_doc_submitted'    => (bool) ($row['proof_document_available'] ?? false),
            'education_doc_public'       => (bool) ($row['proof_document_available'] ?? false),
            'career_doc_submitted'       => !empty($row['career_year_band']),
            'compare_eligible'           => $profileStatus === 'published',
            'student_gender_group'       => $row['student_gender_group'] !== null ? (string) $row['student_gender_group'] : null,
            'student_count_group'        => $row['student_count_group'] !== null ? (string) $row['student_count_group'] : null,
            'lesson_places'              => $lessonPlaces,
            'teaching_style_badges'      => $badges,
            'updated_at'                 => gmdate('c', strtotime((string) $row['updated_at'])),
            'published_at'               => !empty($row['published_at'])
                ? gmdate('c', strtotime((string) $row['published_at'])) : null,
            'deleted_at'                 => null,
        ];
    }

    private function primaryRegionLabel(int $tutorId): string
    {
        $stmt = $this->pdo->prepare(
            'SELECT r.sido_name FROM tutor_regions tr
             JOIN regions r ON tr.region_id = r.id
             WHERE tr.tutor_id = ? AND tr.is_primary = 1 LIMIT 1'
        );
        $stmt->execute([$tutorId]);
        $val = $stmt->fetchColumn();

        return $val !== false ? (string) $val : '';
    }

    private function primarySubject(int $tutorId): string
    {
        $stmt = $this->pdo->prepare(
            'SELECT subject_name FROM tutor_subject_targets
             WHERE tutor_id = ? ORDER BY is_primary DESC, id ASC LIMIT 1'
        );
        $stmt->execute([$tutorId]);
        $val = $stmt->fetchColumn();

        return $val !== false ? (string) $val : '';
    }

    private function gradeBand(int $tutorId): ?string
    {
        $stmt = $this->pdo->prepare(
            'SELECT school_level FROM tutor_subject_targets WHERE tutor_id = ? LIMIT 1'
        );
        $stmt->execute([$tutorId]);
        $val = $stmt->fetchColumn();
        if ($val === false) {
            return null;
        }

        return match ((string) $val) {
            'elementary' => '초등',
            'middle'     => '중등',
            'high'       => '고등',
            default      => (string) $val,
        };
    }

    /** @return list<string> */
    private function lessonPlaces(int $tutorId): array
    {
        $stmt = $this->pdo->prepare('SELECT place_type FROM tutor_lesson_places WHERE tutor_id = ?');
        $stmt->execute([$tutorId]);

        return array_map('strval', $stmt->fetchAll(PDO::FETCH_COLUMN));
    }

    /** @return list<string> */
    private function styleBadges(int $tutorId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT badge_name FROM tutor_teaching_style_badges WHERE tutor_id = ? ORDER BY display_order ASC'
        );
        $stmt->execute([$tutorId]);

        return array_map('strval', $stmt->fetchAll(PDO::FETCH_COLUMN));
    }

    private function hasProfileImage(int $tutorId): bool
    {
        $stmt = $this->pdo->prepare('SELECT 1 FROM tutor_images WHERE tutor_id = ? LIMIT 1');
        $stmt->execute([$tutorId]);

        return (bool) $stmt->fetchColumn();
    }
}
