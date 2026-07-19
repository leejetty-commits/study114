<?php

declare(strict_types=1);

namespace Study114\Auth;

use InvalidArgumentException;
use PDO;
use PDOException;
use RuntimeException;
use Study114\Database\Connection;

final class BasicRegisterService
{
    /**
     * @param array<string, mixed> $input
     * @return array{kind: string, id: int}
     */
    public function register(int $userId, string $roleUi, array $input): array
    {
        return match ($roleUi) {
            'student'    => ['kind' => 'student', 'id' => $this->registerStudent($userId, $input)],
            'study_room' => ['kind' => 'study_room', 'id' => $this->registerStudyRoom($userId, $input)],
            'tutor'      => ['kind' => 'tutor', 'id' => $this->registerTutor($userId, $input)],
            default      => throw new InvalidArgumentException('role: 지원하지 않는 역할입니다.'),
        };
    }

    /** @return list<array{id: int, label: string}> */
    public function listRegions(): array
    {
        $pdo = Connection::get();
        $stmt = $pdo->query(
            'SELECT id, CONCAT(sido_name, " ", sigungu_name, " ", dong_name) AS label
             FROM regions WHERE is_active = 1 ORDER BY id ASC'
        );
        /** @var list<array{id: int, label: string}> $rows */
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return $rows;
    }

    /**
     * 아파트단지 마스터 — 주소 포함 (건물 동 단위 아님)
     *
     * @return list<array{id: int, region_id: int, label: string, address: string}>
     */
    public function listComplexes(): array
    {
        $pdo = Connection::get();
        $stmt = $pdo->query(
            'SELECT id, region_id, name AS label, COALESCE(address, "") AS address
             FROM complexes WHERE is_active = 1 ORDER BY region_id ASC, id ASC'
        );
        /** @var list<array{id: int|string, region_id: int|string, label: string, address: string}> $rows */
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $out = [];
        foreach ($rows as $row) {
            $out[] = [
                'id' => (int) $row['id'],
                'region_id' => (int) $row['region_id'],
                'label' => (string) $row['label'],
                'address' => (string) $row['address'],
            ];
        }
        return $out;
    }

    /**
     * 기본등록 = draft seed 최소 (Notion 14장).
     * 검색/공개 본체는 상세등록에서 완성한다.
     *
     * @param array<string, mixed> $input
     */
    private function registerStudent(int $userId, array $input): int
    {
        $preferredLessonType = $this->requireEnum($input, 'preferred_lesson_type', ['tutor', 'study_room']);

        $publicName = $this->optionalString($input, 'public_display_name')
            ?: ($this->optionalString($input, 'student_name') ?: '학생');
        $studentName = $this->optionalString($input, 'student_name') ?: $publicName;

        $studyroomRegionId = null;
        $studyroomComplexId = null;
        $studyroomBasis = null;
        $tutorRegionId = null;

        if ($preferredLessonType === 'study_room') {
            $studyroomBasis = $this->requireEnum($input, 'region_basis', ['dong', 'complex']);
            if ($studyroomBasis === 'dong') {
                $studyroomRegionId = $this->requireExplicitRegionId($input);
                $studyroomComplexId = null;
            } else {
                $studyroomComplexId = $this->requireComplexId($input);
                $studyroomRegionId = $this->regionIdForComplex($studyroomComplexId);
            }
        } else {
            // 과외쌤 찾기 — 시 기준 region_id 필수 (가입 기본주소 폴백 금지)
            $tutorRegionId = $this->requireExplicitRegionId($input);
        }

        $pdo = Connection::get();
        $pdo->beginTransaction();
        try {
            $hasBasisCol = $this->columnExists($pdo, 'students', 'preferred_studyroom_region_basis');
            if ($hasBasisCol) {
                $stmt = $pdo->prepare(
                    'INSERT INTO students (
                        guardian_user_id, student_name, public_display_name,
                        preferred_lesson_type,
                        preferred_studyroom_region_id, preferred_studyroom_complex_id,
                        preferred_studyroom_region_basis,
                        preferred_tutor_region_id,
                        request_summary_visibility,
                        exposure_status
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
                );
                $stmt->execute([
                    $userId,
                    $studentName,
                    $publicName,
                    $preferredLessonType,
                    $studyroomRegionId,
                    $studyroomComplexId,
                    $studyroomBasis,
                    $tutorRegionId,
                    'private',
                    'draft',
                ]);
            } else {
                $stmt = $pdo->prepare(
                    'INSERT INTO students (
                        guardian_user_id, student_name, public_display_name,
                        preferred_lesson_type,
                        preferred_studyroom_region_id, preferred_studyroom_complex_id,
                        preferred_tutor_region_id,
                        request_summary_visibility,
                        exposure_status
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
                );
                $stmt->execute([
                    $userId,
                    $studentName,
                    $publicName,
                    $preferredLessonType,
                    $studyroomRegionId,
                    $studyroomComplexId,
                    $tutorRegionId,
                    'private',
                    'draft',
                ]);
            }
            $studentId = (int) $pdo->lastInsertId();

            $pdo->commit();
        } catch (PDOException $e) {
            $pdo->rollBack();
            throw new RuntimeException('학생 기본등록 저장 실패: ' . $e->getMessage(), 0, $e);
        }

        return $studentId;
    }

    /**
     * 기본등록 seed: 공부방명 + 노출지역 1 + 주력과목 1 (Notion 14장 §3-3-2).
     *
     * @param array<string, mixed> $input
     */
    private function registerStudyRoom(int $userId, array $input): int
    {
        $name = $this->requireString($input, 'study_room_name');
        $basis = $this->requireEnum($input, 'region_basis', ['dong', 'complex']);
        $complexId = null;
        if ($basis === 'dong') {
            $regionId = $this->requireExplicitRegionId($input);
        } else {
            $complexId = $this->requireComplexId($input);
            $regionId = $this->regionIdForComplex($complexId);
        }
        $mainSubject = $this->resolveMainSubjectNote($input);

        if (isset($input['gender']) && (string) $input['gender'] !== '') {
            ProfileGenderSync::sync($userId, $input);
        }

        $pdo = Connection::get();
        $pdo->beginTransaction();
        try {
            $hasBasisCol = $this->columnExists($pdo, 'study_rooms', 'region_basis_type');
            if ($hasBasisCol) {
                $stmt = $pdo->prepare(
                    'INSERT INTO study_rooms (
                        user_id, study_room_name, main_subject_note, region_id, complex_id, region_basis_type,
                        profile_status, detail_completion_status
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
                );
                $stmt->execute([
                    $userId,
                    $name,
                    $mainSubject,
                    $regionId,
                    $complexId,
                    $basis,
                    'draft',
                    'basic_only',
                ]);
            } else {
                $stmt = $pdo->prepare(
                    'INSERT INTO study_rooms (
                        user_id, study_room_name, main_subject_note, region_id, complex_id,
                        profile_status, detail_completion_status
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)'
                );
                $stmt->execute([
                    $userId,
                    $name,
                    $mainSubject,
                    $regionId,
                    $complexId,
                    'draft',
                    'basic_only',
                ]);
            }
            $roomId = (int) $pdo->lastInsertId();

            $hasSlotBasis = $this->columnExists($pdo, 'study_room_regions', 'region_basis_type');
            if ($hasSlotBasis) {
                $pdo->prepare(
                    'INSERT INTO study_room_regions (study_room_id, slot, region_id, complex_id, region_basis_type, is_primary)
                     VALUES (?, 1, ?, ?, ?, 1)'
                )->execute([$roomId, $regionId, $complexId, $basis]);
            } else {
                $pdo->prepare(
                    'INSERT INTO study_room_regions (study_room_id, slot, region_id, complex_id, is_primary)
                     VALUES (?, 1, ?, ?, 1)'
                )->execute([$roomId, $regionId, $complexId]);
            }

            $subjectId = $this->findSubjectMasterId($pdo, $this->firstSubjectName($mainSubject));
            $pdo->prepare(
                'INSERT INTO study_room_subject_targets (study_room_id, subject_name, school_level, subject_master_id, is_main)
                 VALUES (?, ?, ?, ?, 1)'
            )->execute([$roomId, $this->firstSubjectName($mainSubject), 'middle', $subjectId]);

            $pdo->commit();
        } catch (PDOException $e) {
            $pdo->rollBack();
            throw new RuntimeException('공부방 기본등록 저장 실패: ' . $e->getMessage(), 0, $e);
        }

        return $roomId;
    }

    /**
     * 기본등록 seed: 표시명 + 활동 시 1 + 주력과목 1 (Notion 14장 §3-3-3).
     *
     * @param array<string, mixed> $input
     */
    private function registerTutor(int $userId, array $input): int
    {
        $displayName = $this->requireString($input, 'tutor_display_name');
        // 활동 시 1 — 가입 기본주소/default_region_id 폴백 금지
        $regionId = $this->requireExplicitRegionId($input);
        $mainSubject = $this->resolveMainSubjectNote($input);

        if (isset($input['gender']) && (string) $input['gender'] !== '') {
            ProfileGenderSync::sync($userId, $input);
        }

        $pdo = Connection::get();
        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare(
                'INSERT INTO tutors (
                    user_id, tutor_display_name, main_subject_note,
                    profile_status, detail_completion_status
                ) VALUES (?, ?, ?, ?, ?)'
            );
            $stmt->execute([
                $userId,
                $displayName,
                $mainSubject,
                'draft',
                'basic_only',
            ]);
            $tutorId = (int) $pdo->lastInsertId();

            $pdo->prepare(
                'INSERT INTO tutor_regions (tutor_id, region_id, scope_type, priority_order, is_primary)
                 VALUES (?, ?, ?, 0, 1)'
            )->execute([$tutorId, $regionId, 'city']);

            $subjectId = $this->findSubjectMasterId($pdo, $this->firstSubjectName($mainSubject));
            $pdo->prepare(
                'INSERT INTO tutor_subject_targets (tutor_id, subject_name, school_level, subject_master_id, is_primary)
                 VALUES (?, ?, ?, ?, 1)'
            )->execute([$tutorId, $this->firstSubjectName($mainSubject), 'middle', $subjectId]);

            $pdo->commit();
        } catch (PDOException $e) {
            $pdo->rollBack();
            throw new RuntimeException('과외쌤 기본등록 저장 실패: ' . $e->getMessage(), 0, $e);
        }

        return $tutorId;
    }

    /** @param list<string> $subjectNames */
    private function insertStudentSubjects(PDO $pdo, int $studentId, array $subjectNames, string $defaultLevel): void
    {
        if ($subjectNames === []) {
            $subjectNames = ['수학'];
        }

        foreach ($subjectNames as $i => $name) {
            $masterId = $this->findSubjectMasterId($pdo, $name);
            $pdo->prepare(
                'INSERT INTO student_subject_targets (student_id, subject_name, school_level, subject_master_id, is_primary)
                 VALUES (?, ?, ?, ?, ?)'
            )->execute([$studentId, $name, $defaultLevel, $masterId, $i === 0 ? 1 : 0]);
        }
    }

    /** @param list<string> $places */
    private function insertStudentPlaces(PDO $pdo, int $studentId, array $places): void
    {
        foreach ($places as $place) {
            $pdo->prepare(
                'INSERT INTO student_preferred_lesson_places (student_id, place_type) VALUES (?, ?)'
            )->execute([$studentId, $place]);
        }
    }

    /** @param list<string> $badges */
    private function insertStudentStyleBadges(PDO $pdo, int $studentId, array $badges): void
    {
        foreach ($badges as $i => $badge) {
            $pdo->prepare(
                'INSERT INTO student_preferred_teaching_style_badges (student_id, badge_name, display_order)
                 VALUES (?, ?, ?)'
            )->execute([$studentId, $badge, $i]);
        }
    }

    /** @param array<string, mixed> $input */
    private function requireExplicitRegionId(array $input): int
    {
        if (!isset($input['region_id']) || $input['region_id'] === '') {
            throw new InvalidArgumentException('region_id: 지역을 선택해 주세요.');
        }
        $id = (int) $input['region_id'];
        if ($id <= 0) {
            throw new InvalidArgumentException('region_id: 지역을 선택해 주세요.');
        }
        $pdo = Connection::get();
        $stmt = $pdo->prepare('SELECT id FROM regions WHERE id = ? AND is_active = 1');
        $stmt->execute([$id]);
        if (!$stmt->fetchColumn()) {
            throw new InvalidArgumentException('region_id: 유효하지 않은 지역입니다.');
        }
        return $id;
    }

    /** @param array<string, mixed> $input */
    private function requireComplexId(array $input): int
    {
        if (!isset($input['complex_id']) || $input['complex_id'] === '') {
            throw new InvalidArgumentException('complex_id: 아파트단지를 선택해 주세요.');
        }
        $id = (int) $input['complex_id'];
        if ($id <= 0) {
            throw new InvalidArgumentException('complex_id: 아파트단지를 선택해 주세요.');
        }
        $pdo = Connection::get();
        $stmt = $pdo->prepare('SELECT id FROM complexes WHERE id = ? AND is_active = 1');
        $stmt->execute([$id]);
        if (!$stmt->fetchColumn()) {
            throw new InvalidArgumentException('complex_id: 유효하지 않은 단지입니다.');
        }
        return $id;
    }

    private function regionIdForComplex(int $complexId): int
    {
        $pdo = Connection::get();
        $stmt = $pdo->prepare('SELECT region_id FROM complexes WHERE id = ? AND is_active = 1');
        $stmt->execute([$complexId]);
        $regionId = $stmt->fetchColumn();
        if (!$regionId) {
            throw new InvalidArgumentException('complex_id: 단지에 연결된 행정동이 없습니다.');
        }
        return (int) $regionId;
    }

    private function columnExists(PDO $pdo, string $table, string $column): bool
    {
        $stmt = $pdo->prepare(
            'SELECT COUNT(*) FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?'
        );
        $stmt->execute([$table, $column]);
        return (int) $stmt->fetchColumn() > 0;
    }

    /** @param array<string, mixed> $input */
    private function resolveMainSubjectNote(array $input): string
    {
        $note = $this->optionalString($input, 'main_subject_note');
        if ($note !== null) {
            return $note;
        }

        $subjects = $input['main_subjects'] ?? null;
        if (is_array($subjects)) {
            $parts = [];
            foreach ($subjects as $s) {
                $s = trim((string) $s);
                if ($s === '기타') {
                    $other = trim((string) ($input['main_subject_other'] ?? ''));
                    if ($other !== '') {
                        $parts[] = $other;
                    }
                    continue;
                }
                if ($s !== '') {
                    $parts[] = $s;
                }
            }
            if ($parts !== []) {
                return implode(' · ', $parts);
            }
        } elseif (is_string($subjects) && trim($subjects) !== '') {
            return trim($subjects);
        }

        throw new InvalidArgumentException('main_subject_note: 주력과목을 1개 이상 선택해 주세요.');
    }

    private function findSubjectMasterId(PDO $pdo, string $name): ?int
    {
        $stmt = $pdo->prepare(
            'SELECT id FROM subject_masters WHERE subject_name = ? OR subject_name LIKE ? ORDER BY id ASC LIMIT 1'
        );
        $stmt->execute([$name, '%' . $name . '%']);
        $id = $stmt->fetchColumn();
        return $id ? (int) $id : null;
    }

    private function firstSubjectName(string $raw): string
    {
        $parts = preg_split('/[,·\/]/u', $raw) ?: [];
        $first = trim($parts[0] ?? $raw);
        return $first !== '' ? $first : '수학';
    }

    /** @param array<string, mixed> $input @return list<string> */
    private function parseSubjectNames(array $input): array
    {
        $raw = trim((string) ($input['subject_names'] ?? ''));
        if ($raw === '') {
            return ['수학'];
        }
        $parts = preg_split('/[,·\/]/u', $raw) ?: [];
        return array_values(array_filter(array_map('trim', $parts)));
    }

    /**
     * @param array<string, mixed> $input
     * @param list<string> $allowed
     * @return list<string>
     */
    private function parseStringList(array $input, string $key, array $allowed): array
    {
        $value = $input[$key] ?? [];
        if (!is_array($value)) {
            $value = $value === '' || $value === null ? [] : [$value];
        }
        $out = [];
        foreach ($value as $item) {
            $item = (string) $item;
            if (in_array($item, $allowed, true)) {
                $out[] = $item;
            }
        }
        return array_values(array_unique($out));
    }

    /** @return list<string> */
    private function schoolLevelCodes(): array
    {
        return ['preschool', 'elementary', 'middle', 'high', 'n_su', 'general', 'other'];
    }

    /** @return list<string> */
    private function teachingStyleCodes(): array
    {
        return ['passion', 'meticulous', 'kind', 'from_basics', 'advanced_focus', 'concept_focus', 'solution_focus'];
    }

    /** @param array<string, mixed> $input */
    private function requireString(array $input, string $key): string
    {
        if (!isset($input[$key]) || trim((string) $input[$key]) === '') {
            throw new InvalidArgumentException("{$key}: 필수 입력입니다.");
        }
        return trim((string) $input[$key]);
    }

    /** @param array<string, mixed> $input */
    private function optionalString(array $input, string $key): ?string
    {
        if (!isset($input[$key]) || trim((string) $input[$key]) === '') {
            return null;
        }
        return trim((string) $input[$key]);
    }

    /**
     * @param array<string, mixed> $input
     * @param list<string> $allowed
     */
    private function requireEnum(array $input, string $key, array $allowed): string
    {
        $value = (string) ($input[$key] ?? '');
        if (!in_array($value, $allowed, true)) {
            throw new InvalidArgumentException("{$key}: 유효하지 않은 값입니다.");
        }
        return $value;
    }

    /**
     * @param array<string, mixed> $input
     * @param list<string> $allowed
     */
    private function optionalEnum(array $input, string $key, array $allowed): ?string
    {
        $value = (string) ($input[$key] ?? '');
        if ($value === '') {
            return null;
        }
        if (!in_array($value, $allowed, true)) {
            throw new InvalidArgumentException("{$key}: 유효하지 않은 값입니다.");
        }
        return $value;
    }

    /** @param array<string, mixed> $input */
    private function requireBirthYear(array $input): int
    {
        if (!isset($input['birth_year']) || $input['birth_year'] === '') {
            throw new InvalidArgumentException('birth_year: 필수 입력입니다.');
        }
        $year = (int) $input['birth_year'];
        if ($year < 1990 || $year > (int) date('Y')) {
            throw new InvalidArgumentException('birth_year: 1990~현재 연도 사이로 입력해 주세요.');
        }
        return $year;
    }

    /** @param array<string, mixed> $input */
    private function requirePositiveInt(array $input, string $key): int
    {
        if (!isset($input[$key]) || $input[$key] === '') {
            throw new InvalidArgumentException("{$key}: 필수 입력입니다.");
        }
        $n = (int) $input[$key];
        if ($n <= 0) {
            throw new InvalidArgumentException("{$key}: 1 이상 입력해 주세요.");
        }
        return $n;
    }

    /** @param array<string, mixed> $input */
    private function optionalInt(array $input, string $key): ?int
    {
        if (!isset($input[$key]) || $input[$key] === '') {
            return null;
        }
        return (int) $input[$key];
    }
}
