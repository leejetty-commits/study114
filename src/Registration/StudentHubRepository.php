<?php

declare(strict_types=1);

namespace Study114\Registration;

use PDO;

/** 19장 P19 — students 등록 허브 */
final class StudentHubRepository
{
    public function __construct(private readonly PDO $pdo)
    {
    }

    /** @return list<array<string, mixed>> */
    public function listForGuardian(int $guardianUserId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT s.* FROM students s
             WHERE s.guardian_user_id = ? AND s.deleted_at IS NULL
             ORDER BY s.updated_at DESC, s.id DESC'
        );
        $stmt->execute([$guardianUserId]);

        return array_map(fn (array $row) => $this->hydrateStudentRow((int) $row['id'], $row), $stmt->fetchAll());
    }

    /** @return array<string, mixed>|null */
    public function getForGuardian(int $guardianUserId, int $studentId): ?array
    {
        $stmt = $this->pdo->prepare(
            'SELECT s.* FROM students s
             WHERE s.id = ? AND s.guardian_user_id = ? AND s.deleted_at IS NULL
             LIMIT 1'
        );
        $stmt->execute([$studentId, $guardianUserId]);
        $row = $stmt->fetch();

        return $row !== false ? $this->hydrateStudentRow($studentId, $row) : null;
    }

    public function updateExposureStatus(int $studentId, string $status, ?string $publishedAt = null): void
    {
        $stmt = $this->pdo->prepare(
            'UPDATE students SET exposure_status = ?, published_at = COALESCE(?, published_at), updated_at = NOW()
             WHERE id = ?'
        );
        $stmt->execute([$status, $publishedAt, $studentId]);
    }

    public function softDelete(int $studentId): void
    {
        $stmt = $this->pdo->prepare(
            'UPDATE students SET exposure_status = "deleted", deleted_at = NOW(), updated_at = NOW() WHERE id = ?'
        );
        $stmt->execute([$studentId]);
    }

    /**
     * @param array<string, mixed> $patch
     */
    public function patchStudent(int $studentId, array $patch): void
    {
        $allowed = [
            'public_display_name', 'grade_level', 'gender', 'birth_year',
            'preferred_lesson_type', 'preferred_region_note',
            'preferred_fee_amount', 'preferred_studyroom_fee_amount',
            'lessons_per_week', 'minutes_per_lesson', 'lesson_format',
            'student_gender_group', 'preferred_student_count_group',
            'preferred_tutor_gender', 'request_summary', 'request_summary_visibility',
            'special_request_note', 'special_request_visibility',
        ];
        $ownTx = !$this->pdo->inTransaction();
        if ($ownTx) {
            $this->pdo->beginTransaction();
        }
        try {
            $sets = [];
            $params = [];
            foreach ($allowed as $col) {
                if (!array_key_exists($col, $patch)) {
                    continue;
                }
                $sets[] = "{$col} = ?";
                $params[] = $this->normalizeStudentColumn($col, $patch[$col]);
            }
            if ($sets !== []) {
                $sets[] = 'updated_at = NOW()';
                $params[] = $studentId;
                $sql = 'UPDATE students SET ' . implode(', ', $sets) . ' WHERE id = ?';
                $stmt = $this->pdo->prepare($sql);
                $stmt->execute($params);
            }
            if (array_key_exists('lesson_places', $patch)) {
                $this->replaceLessonPlaces($studentId, $patch['lesson_places']);
            }
            if (array_key_exists('teaching_style_badges', $patch)) {
                $this->replaceStyleBadges($studentId, $patch['teaching_style_badges']);
            }
            if ($ownTx) {
                $this->pdo->commit();
            }
        } catch (\Throwable $e) {
            if ($ownTx && $this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            throw $e;
        }
    }

    private function normalizeStudentColumn(string $col, mixed $value): mixed
    {
        if ($value === '') {
            $value = null;
        }
        if ($col === 'preferred_region_note') {
            if ($value === null) {
                return null;
            }
            $text = trim((string) $value);
            if ($text === '') {
                return null;
            }
            if (mb_strlen($text) > 255) {
                throw new \InvalidArgumentException('preferred_region_note: 255자 이하로 입력해 주세요.');
            }

            return $text;
        }
        if ($col === 'special_request_note') {
            if ($value === null) {
                return null;
            }
            $text = trim((string) $value);

            return $text === '' ? null : $text;
        }
        if (in_array($col, ['birth_year', 'lessons_per_week', 'minutes_per_lesson', 'preferred_fee_amount', 'preferred_studyroom_fee_amount'], true)) {
            if ($value === null) {
                return null;
            }
            if (!is_int($value) && !(is_string($value) && preg_match('/^\d+$/', $value))) {
                throw new \InvalidArgumentException("{$col}: 숫자로 입력해 주세요.");
            }
            $number = (int) $value;
            $max = $col === 'birth_year' ? 32767 : 65535;
            if ($number < 0 || $number > $max) {
                throw new \InvalidArgumentException("{$col}: 값을 확인해 주세요.");
            }

            return $number;
        }
        if ($col === 'gender' && $value !== null && !in_array($value, ['male', 'female'], true)) {
            throw new \InvalidArgumentException('gender: 값을 확인해 주세요.');
        }
        if ($col === 'preferred_tutor_gender' && $value !== null && !in_array($value, ['male', 'female', 'any'], true)) {
            throw new \InvalidArgumentException('preferred_tutor_gender: 값을 확인해 주세요.');
        }

        return $value;
    }

    private function replaceLessonPlaces(int $studentId, mixed $places): void
    {
        $allowed = ['student_home', 'study_room', 'public_place'];
        $clean = [];
        foreach ((array) $places as $place) {
            $place = (string) $place;
            if (!in_array($place, $allowed, true)) {
                throw new \InvalidArgumentException('lesson_places: 값을 확인해 주세요.');
            }
            if (!in_array($place, $clean, true)) {
                $clean[] = $place;
            }
        }
        $this->pdo->prepare('DELETE FROM student_preferred_lesson_places WHERE student_id = ?')->execute([$studentId]);
        $insert = $this->pdo->prepare(
            'INSERT INTO student_preferred_lesson_places (student_id, place_type) VALUES (?, ?)'
        );
        foreach ($clean as $place) {
            $insert->execute([$studentId, $place]);
        }
    }

    private function replaceStyleBadges(int $studentId, mixed $badges): void
    {
        $allowed = ['passion', 'meticulous', 'kind', 'from_basics', 'advanced_focus', 'concept_focus', 'solution_focus'];
        $clean = [];
        foreach ((array) $badges as $badge) {
            $badge = (string) $badge;
            if (!in_array($badge, $allowed, true)) {
                throw new \InvalidArgumentException('teaching_style_badges: 값을 확인해 주세요.');
            }
            if (!in_array($badge, $clean, true)) {
                $clean[] = $badge;
            }
        }
        $this->pdo->prepare('DELETE FROM student_preferred_teaching_style_badges WHERE student_id = ?')->execute([$studentId]);
        $insert = $this->pdo->prepare(
            'INSERT INTO student_preferred_teaching_style_badges (student_id, badge_name, display_order) VALUES (?, ?, ?)'
        );
        foreach ($clean as $i => $badge) {
            $insert->execute([$studentId, $badge, $i]);
        }
    }

    /** @param array<string, mixed> $row @return array<string, mixed> */
    private function hydrateStudentRow(int $studentId, array $row): array
    {
        $regionLabel = $this->resolveStudentRegionLabel($row);
        $subjectLabel = $this->primarySubjectName($studentId);

        return [
            'id'                            => $studentId,
            'student_name'                  => (string) $row['student_name'],
            'public_display_name'           => (string) ($row['public_display_name'] ?? ''),
            'grade_level'                   => $row['grade_level'] !== null ? (string) $row['grade_level'] : null,
            'school_level'                  => $this->inferSchoolLevel($row['grade_level'] ?? null),
            'gender'                        => $row['gender'] !== null ? (string) $row['gender'] : null,
            'birth_year'                    => $row['birth_year'] !== null ? (int) $row['birth_year'] : null,
            'exposure_status'               => (string) $row['exposure_status'],
            'memo_status'                   => isset($row['memo_status'])
                ? (string) $row['memo_status']
                : 'open',
            'preferred_lesson_type'         => $row['preferred_lesson_type'] !== null ? (string) $row['preferred_lesson_type'] : null,
            'preferred_region_note'         => $row['preferred_region_note'] !== null ? (string) $row['preferred_region_note'] : null,
            'region_label'                  => $regionLabel,
            'subject_label'                 => $subjectLabel,
            'lesson_places'                 => $this->lessonPlaces($studentId),
            'lesson_format'                 => $row['lesson_format'] !== null ? (string) $row['lesson_format'] : null,
            'student_gender_group'          => $row['student_gender_group'] !== null ? (string) $row['student_gender_group'] : null,
            'preferred_student_count_group' => $row['preferred_student_count_group'] !== null ? (string) $row['preferred_student_count_group'] : null,
            'lessons_per_week'              => $row['lessons_per_week'] !== null ? (int) $row['lessons_per_week'] : null,
            'minutes_per_lesson'            => $row['minutes_per_lesson'] !== null ? (int) $row['minutes_per_lesson'] : null,
            'teaching_style_badges'         => $this->styleBadges($studentId),
            'preferred_fee_amount'          => $row['preferred_fee_amount'] !== null ? (int) $row['preferred_fee_amount'] : null,
            'preferred_studyroom_fee_amount'=> $row['preferred_studyroom_fee_amount'] !== null ? (int) $row['preferred_studyroom_fee_amount'] : null,
            'preferred_tutor_gender'        => $row['preferred_tutor_gender'] !== null ? (string) $row['preferred_tutor_gender'] : null,
            'request_summary'               => $row['request_summary'] !== null ? (string) $row['request_summary'] : null,
            'request_summary_visibility'    => (string) ($row['request_summary_visibility'] ?? 'private'),
            'special_request_note'          => $row['special_request_note'] !== null ? (string) $row['special_request_note'] : null,
            'special_request_visibility'    => (string) ($row['special_request_visibility'] ?? 'private'),
            'updated_at'                    => gmdate('c', strtotime((string) $row['updated_at'])),
            'published_at'                  => $row['published_at'] !== null
                ? gmdate('c', strtotime((string) $row['published_at'])) : null,
            'api_student_id'                => $studentId,
            'api_registered'                => true,
        ];
    }

    /** @param array<string, mixed> $row */
    private function resolveStudentRegionLabel(array $row): string
    {
        $regionId = $row['preferred_studyroom_region_id'] ?? $row['preferred_tutor_region_id'] ?? null;
        if ($regionId === null) {
            return (string) ($row['preferred_region_note'] ?? '');
        }
        $stmt = $this->pdo->prepare(
            'SELECT CONCAT(sido_name, " ", sigungu_name, " ", dong_name) AS label FROM regions WHERE id = ? LIMIT 1'
        );
        $stmt->execute([(int) $regionId]);
        $label = $stmt->fetchColumn();

        return $label !== false ? (string) $label : (string) ($row['preferred_region_note'] ?? '');
    }

    private function primarySubjectName(int $studentId): string
    {
        $stmt = $this->pdo->prepare(
            'SELECT subject_name FROM student_subject_targets
             WHERE student_id = ? ORDER BY is_primary DESC, id ASC LIMIT 1'
        );
        $stmt->execute([$studentId]);
        $val = $stmt->fetchColumn();

        return $val !== false ? (string) $val : '';
    }

    /** @return list<string> */
    private function lessonPlaces(int $studentId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT place_type FROM student_preferred_lesson_places WHERE student_id = ? ORDER BY id ASC'
        );
        $stmt->execute([$studentId]);

        return array_map('strval', $stmt->fetchAll(PDO::FETCH_COLUMN));
    }

    /** @return list<string> */
    private function styleBadges(int $studentId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT badge_name FROM student_preferred_teaching_style_badges
             WHERE student_id = ? ORDER BY display_order ASC, id ASC'
        );
        $stmt->execute([$studentId]);

        return array_map('strval', $stmt->fetchAll(PDO::FETCH_COLUMN));
    }

    private function inferSchoolLevel(?string $gradeLevel): ?string
    {
        if ($gradeLevel === null || $gradeLevel === '') {
            return null;
        }
        if (str_contains($gradeLevel, '초')) {
            return 'elementary';
        }
        if (str_contains($gradeLevel, '중')) {
            return 'middle';
        }
        if (str_contains($gradeLevel, '고')) {
            return 'high';
        }

        return 'middle';
    }
}
