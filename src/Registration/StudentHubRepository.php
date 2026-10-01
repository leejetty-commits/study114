<?php

declare(strict_types=1);

namespace Study114\Registration;

use PDO;
use Study114\Region\SidoRegionEnsure;

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

    /** 보호자 확인 없이 id로 읽는다. 관리자·CLI·기본정보 완료 판정용. @return array<string, mixed>|null */
    public function findById(int $studentId): ?array
    {
        $stmt = $this->pdo->prepare(
            'SELECT s.* FROM students s WHERE s.id = ? AND s.deleted_at IS NULL LIMIT 1'
        );
        $stmt->execute([$studentId]);
        $row = $stmt->fetch();

        return $row !== false ? $this->hydrateStudentRow($studentId, $row) : null;
    }

    /** 보호자 계정의 첫 학생(기본등록이 쓰는 행과 같은 정렬). @return array<string, mixed>|null */
    public function findFirstForGuardian(int $guardianUserId): ?array
    {
        $stmt = $this->pdo->prepare(
            'SELECT s.* FROM students s
             WHERE s.guardian_user_id = ? AND s.deleted_at IS NULL
             ORDER BY s.id ASC LIMIT 1'
        );
        $stmt->execute([$guardianUserId]);
        $row = $stmt->fetch();

        return $row !== false ? $this->hydrateStudentRow((int) $row['id'], $row) : null;
    }

    /** @return list<int> */
    public function listDraftIds(): array
    {
        $stmt = $this->pdo->query(
            "SELECT id FROM students WHERE exposure_status = 'draft' AND deleted_at IS NULL ORDER BY id ASC"
        );

        return array_map('intval', $stmt->fetchAll(PDO::FETCH_COLUMN));
    }

    public function updateExposureStatus(int $studentId, string $status, ?string $publishedAt = null): void
    {
        $stmt = $this->pdo->prepare(
            'UPDATE students SET exposure_status = ?, published_at = COALESCE(?, published_at), updated_at = NOW()
             WHERE id = ?'
        );
        $stmt->execute([$status, $publishedAt, $studentId]);
    }

    /**
     * 현재 상태가 $from 일 때만 바꾼다. 관리자가 그사이 hidden 으로 내린 행은 건드리지 않는다.
     */
    public function transitionExposureStatus(int $studentId, string $from, string $to, ?string $publishedAt = null): bool
    {
        $stmt = $this->pdo->prepare(
            'UPDATE students SET exposure_status = ?, published_at = COALESCE(?, published_at), updated_at = NOW()
             WHERE id = ? AND exposure_status = ? AND deleted_at IS NULL'
        );
        $stmt->execute([$to, $publishedAt, $studentId, $from]);

        return $stmt->rowCount() > 0;
    }

    /**
     * @template T
     * @param callable(): T $fn
     * @return T
     */
    public function transaction(callable $fn): mixed
    {
        if ($this->pdo->inTransaction()) {
            return $fn();
        }
        $this->pdo->beginTransaction();
        try {
            $result = $fn();
            $this->pdo->commit();

            return $result;
        } catch (\Throwable $e) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            throw $e;
        }
    }

    private const PATCH_COLUMNS = [
        'public_display_name', 'grade_level', 'gender', 'birth_year',
        'preferred_lesson_type', 'preferred_region_note',
        'preferred_tutor_region_id', 'preferred_studyroom_region_id',
        'preferred_studyroom_complex_id', 'preferred_studyroom_region_basis',
        'preferred_fee_amount', 'preferred_studyroom_fee_amount',
        'lessons_per_week', 'minutes_per_lesson', 'lesson_format',
        'student_gender_group', 'preferred_student_count_group',
        'preferred_tutor_gender', 'memo_status', 'request_summary', 'special_request_note',
    ];

    /** students 컬럼이 아닌 연결 테이블·보조 입력 */
    private const PATCH_RELATION_KEYS = [
        'lesson_places', 'teaching_style_badges', 'subject_label', 'subject_names', 'school_level',
    ];

    private const SCHOOL_LEVELS = ['preschool', 'elementary', 'middle', 'high', 'n_su', 'general', 'other'];

    /**
     * @param array<string, mixed> $patch
     */
    public function patchStudent(int $studentId, array $patch): void
    {
        foreach (array_keys($patch) as $key) {
            if (!in_array($key, self::PATCH_COLUMNS, true) && !in_array($key, self::PATCH_RELATION_KEYS, true)) {
                throw new \InvalidArgumentException("{$key}: 저장할 수 없는 항목입니다.");
            }
        }
        foreach (['lesson_places', 'teaching_style_badges'] as $listKey) {
            if (array_key_exists($listKey, $patch) && !is_array($patch[$listKey])) {
                throw new \InvalidArgumentException("{$listKey}: 값을 확인해 주세요.");
            }
        }
        foreach (['subject_label', 'subject_names', 'school_level'] as $textKey) {
            if (array_key_exists($textKey, $patch) && $patch[$textKey] !== null && !is_string($patch[$textKey])) {
                throw new \InvalidArgumentException("{$textKey}: 값을 확인해 주세요.");
            }
        }
        $patchSchoolLevel = isset($patch['school_level']) ? trim((string) $patch['school_level']) : '';
        if ($patchSchoolLevel !== '' && !in_array($patchSchoolLevel, self::SCHOOL_LEVELS, true)) {
            throw new \InvalidArgumentException('school_level: 값을 확인해 주세요.');
        }

        $ownTx = !$this->pdo->inTransaction();
        if ($ownTx) {
            $this->pdo->beginTransaction();
        }
        try {
            $sets = [];
            $params = [];
            $values = [];
            foreach (self::PATCH_COLUMNS as $col) {
                if (!array_key_exists($col, $patch)) {
                    continue;
                }
                $values[$col] = $this->normalizeStudentColumn($col, $patch[$col]);
            }
            // 단지 기준이면 단지가 속한 행정동을 공부방 희망지역으로 함께 저장한다(가입 기본정보와 같은 규칙).
            if (isset($values['preferred_studyroom_complex_id']) && !array_key_exists('preferred_studyroom_region_id', $values)) {
                $values['preferred_studyroom_region_id'] = $this->complexRegionId((int) $values['preferred_studyroom_complex_id']);
            }
            foreach ($values as $col => $value) {
                $sets[] = "{$col} = ?";
                $params[] = $value;
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
            if (array_key_exists('subject_label', $patch) || array_key_exists('subject_names', $patch)) {
                $subjectName = trim((string) ($patch['subject_label'] ?? $patch['subject_names'] ?? ''));
                $schoolLevel = $patchSchoolLevel;
                if ($schoolLevel === '') {
                    $schoolLevel = (string) ($this->inferSchoolLevel(
                        isset($patch['grade_level']) ? (string) $patch['grade_level'] : null
                    ) ?? '');
                }
                $this->replacePrimarySubject($studentId, $subjectName, $schoolLevel);
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

    private const PATCH_ENUMS = [
        'preferred_lesson_type'          => ['tutor', 'study_room'],
        'lesson_format'                  => ['one_on_one', 'group'],
        'preferred_student_count_group'  => ['solo', 'two', 'three', 'four_plus'],
        'student_gender_group'           => ['male', 'female', 'mixed'],
    ];

    /** DB NOT NULL 이라 비울 수 없는 컬럼 */
    private const PATCH_NOT_NULL = ['memo_status'];

    private function normalizeStudentColumn(string $col, mixed $value): mixed
    {
        if ($value !== null && !is_string($value) && !is_int($value)) {
            throw new \InvalidArgumentException("{$col}: 값을 확인해 주세요.");
        }
        if (is_string($value)) {
            $value = trim($value);
        }
        if ($value === '') {
            $value = null;
        }
        if ($value === null && in_array($col, self::PATCH_NOT_NULL, true)) {
            throw new \InvalidArgumentException("{$col}: 값을 확인해 주세요.");
        }
        if (isset(self::PATCH_ENUMS[$col])) {
            if ($value !== null && !in_array($value, self::PATCH_ENUMS[$col], true)) {
                throw new \InvalidArgumentException("{$col}: 값을 확인해 주세요.");
            }

            return $value;
        }
        if ($col === 'public_display_name') {
            if ($value !== null && mb_strlen((string) $value) > 40) {
                throw new \InvalidArgumentException('public_display_name: 40자 이하로 입력해 주세요.');
            }

            return $value === null ? null : (string) $value;
        }
        if ($col === 'grade_level') {
            if ($value !== null && mb_strlen((string) $value) > 20) {
                throw new \InvalidArgumentException('grade_level: 값을 확인해 주세요.');
            }

            return $value === null ? null : (string) $value;
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
            $text = (string) $value;
            // TEXT 컬럼 한도(65,535바이트)
            if (strlen($text) > 65535) {
                throw new \InvalidArgumentException('special_request_note: 내용이 너무 깁니다.');
            }

            return $text;
        }
        if (in_array($col, ['birth_year', 'lessons_per_week', 'minutes_per_lesson', 'preferred_fee_amount', 'preferred_studyroom_fee_amount'], true)) {
            if ($value === null) {
                return null;
            }
            if (!is_int($value) && !(is_string($value) && preg_match('/^\d+$/', $value))) {
                throw new \InvalidArgumentException("{$col}: 숫자로 입력해 주세요.");
            }
            $number = (int) $value;
            $max = $col === 'birth_year'
                ? 32767
                : (in_array($col, ['preferred_fee_amount', 'preferred_studyroom_fee_amount'], true) ? 4294967295 : 65535);
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
        if ($col === 'memo_status' && !in_array($value, ['open', 'paused'], true)) {
            throw new \InvalidArgumentException('memo_status: 값을 확인해 주세요.');
        }
        if ($col === 'preferred_tutor_region_id') {
            if ($value === null) {
                return null;
            }
            if (!is_int($value) && !(is_string($value) && preg_match('/^\d+$/', $value))) {
                throw new \InvalidArgumentException('preferred_tutor_region_id: 값을 확인해 주세요.');
            }
            $regionId = (int) $value;
            SidoRegionEnsure::assertSelectable($this->pdo, $regionId);

            return $regionId;
        }
        if (in_array($col, ['preferred_studyroom_region_id', 'preferred_studyroom_complex_id'], true)) {
            if ($value === null) {
                return null;
            }
            if (!is_int($value) && !(is_string($value) && preg_match('/^\d+$/', $value))) {
                throw new \InvalidArgumentException("{$col}: 값을 확인해 주세요.");
            }
            $id = (int) $value;
            $table = $col === 'preferred_studyroom_region_id' ? 'regions' : 'complexes';
            $stmt = $this->pdo->prepare("SELECT 1 FROM {$table} WHERE id = ? AND is_active = 1 LIMIT 1");
            $stmt->execute([$id]);
            if ($id <= 0 || !$stmt->fetchColumn()) {
                throw new \InvalidArgumentException('희망지역을 목록에서 다시 선택해 주세요.');
            }

            return $id;
        }
        if ($col === 'preferred_studyroom_region_basis' && $value !== null && !in_array($value, ['dong', 'complex'], true)) {
            throw new \InvalidArgumentException('preferred_studyroom_region_basis: 값을 확인해 주세요.');
        }
        if ($col === 'request_summary' && $value !== null && mb_strlen((string) $value) > 200) {
            throw new \InvalidArgumentException('request_summary: 200자 이하로 입력해 주세요.');
        }

        return $value;
    }

    private function complexRegionId(int $complexId): int
    {
        $stmt = $this->pdo->prepare('SELECT region_id FROM complexes WHERE id = ? AND is_active = 1 LIMIT 1');
        $stmt->execute([$complexId]);
        $regionId = $stmt->fetchColumn();
        if (!$regionId) {
            throw new \InvalidArgumentException('희망지역을 목록에서 다시 선택해 주세요.');
        }

        return (int) $regionId;
    }

    private function replacePrimarySubject(int $studentId, string $name, string $schoolLevel): void
    {
        $levels = ['preschool', 'elementary', 'middle', 'high', 'n_su', 'general', 'other'];
        if (!in_array($schoolLevel, $levels, true)) {
            $schoolLevel = 'middle';
        }
        $existing = $this->pdo->prepare(
            'SELECT id FROM student_subject_targets WHERE student_id = ? AND is_primary = 1 ORDER BY id ASC LIMIT 1'
        );
        $existing->execute([$studentId]);
        $id = $existing->fetchColumn();
        if ($name === '') {
            if ($id !== false) {
                $this->pdo->prepare('DELETE FROM student_subject_targets WHERE id = ?')->execute([(int) $id]);
            }

            return;
        }
        if (mb_strlen($name) > 50) {
            throw new \InvalidArgumentException('subject_label: 과목명을 확인해 주세요.');
        }
        if ($id !== false) {
            $this->pdo->prepare(
                'UPDATE student_subject_targets SET subject_name = ?, school_level = ? WHERE id = ?'
            )->execute([$name, $schoolLevel, (int) $id]);

            return;
        }
        $this->pdo->prepare(
            'INSERT INTO student_subject_targets (student_id, subject_name, school_level, is_primary) VALUES (?, ?, ?, 1)'
        )->execute([$studentId, $name, $schoolLevel]);
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
        $subject = $this->primarySubject($studentId);
        $subjectLabel = $subject['name'];
        // 학교급은 students 컬럼이 없어 희망과목 행에 저장된다. 없을 때만 학년 글자로 추정한다.
        $schoolLevel = in_array($subject['school_level'], self::SCHOOL_LEVELS, true)
            ? $subject['school_level']
            : $this->inferSchoolLevel($row['grade_level'] ?? null);

        $out = [
            'id'                            => $studentId,
            'student_name'                  => (string) $row['student_name'],
            'public_display_name'           => (string) ($row['public_display_name'] ?? ''),
            'grade_level'                   => $row['grade_level'] !== null ? (string) $row['grade_level'] : null,
            'school_level'                  => $schoolLevel,
            'gender'                        => $row['gender'] !== null ? (string) $row['gender'] : null,
            'birth_year'                    => $row['birth_year'] !== null ? (int) $row['birth_year'] : null,
            'exposure_status'               => (string) $row['exposure_status'],
            'memo_status'                   => isset($row['memo_status'])
                ? (string) $row['memo_status']
                : 'open',
            'preferred_lesson_type'         => $row['preferred_lesson_type'] !== null ? (string) $row['preferred_lesson_type'] : null,
            'preferred_tutor_region_id'     => $row['preferred_tutor_region_id'] !== null ? (int) $row['preferred_tutor_region_id'] : null,
            'preferred_studyroom_region_id' => $row['preferred_studyroom_region_id'] !== null ? (int) $row['preferred_studyroom_region_id'] : null,
            'preferred_studyroom_complex_id'=> $row['preferred_studyroom_complex_id'] !== null ? (int) $row['preferred_studyroom_complex_id'] : null,
            'preferred_studyroom_region_basis' => $row['preferred_studyroom_region_basis'] !== null ? (string) $row['preferred_studyroom_region_basis'] : null,
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
            'special_request_note'          => $row['special_request_note'] !== null ? (string) $row['special_request_note'] : null,
            'updated_at'                    => gmdate('c', strtotime((string) $row['updated_at'])),
            'published_at'                  => $row['published_at'] !== null
                ? gmdate('c', strtotime((string) $row['published_at'])) : null,
            'api_student_id'                => $studentId,
            'api_registered'                => true,
        ];
        $out['basic_missing'] = StudentBasicCompleteness::missingLabels($out);

        return $out;
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

    /** @return array{name: string, school_level: string} */
    private function primarySubject(int $studentId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT subject_name, school_level FROM student_subject_targets
             WHERE student_id = ? ORDER BY is_primary DESC, id ASC LIMIT 1'
        );
        $stmt->execute([$studentId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!is_array($row)) {
            return ['name' => '', 'school_level' => ''];
        }

        return [
            'name'         => (string) ($row['subject_name'] ?? ''),
            'school_level' => (string) ($row['school_level'] ?? ''),
        ];
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
