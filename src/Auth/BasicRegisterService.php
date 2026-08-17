<?php

declare(strict_types=1);

namespace Study114\Auth;

use InvalidArgumentException;
use PDO;
use PDOException;
use RuntimeException;
use Study114\Database\Connection;
use Study114\Region\AddressRegionMatch;
use Study114\Region\ComplexEnsure;
use Study114\Region\SidoRegionEnsure;

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
        SidoRegionEnsure::ensure($pdo);
        $stmt = $pdo->query(
            'SELECT id, sido_name, sigungu_name, dong_name,
                    CONCAT(sido_name, " ", sigungu_name, " ", dong_name) AS label
             FROM regions WHERE is_active = 1 ORDER BY id ASC'
        );
        /** @var list<array{id: int, label: string}> $rows */
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return $rows;
    }

    /** @return list<array{id: int, label: string}> */
    public function listCities(): array
    {
        return SidoRegionEnsure::ensureAndListCities(Connection::get());
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
     * 기본등록: 공부방명 · 주력과목 · 성별 · 사업장주소 · 홍보 1곳 (필수).
     * 집주소·홍보 2·3은 선택. 주소는 검색 결과이며 단지 시드가 없어도 저장한다.
     *
     * @param array<string, mixed> $input
     */
    private function registerStudyRoom(int $userId, array $input): int
    {
        $name = $this->requireString($input, 'study_room_name');
        $mainSubject = $this->resolveMainSubjectNote($input);
        ProfileGenderSync::sync($userId, $input);

        $addressText = trim((string) ($input['address_text'] ?? ''));
        if ($addressText === '') {
            throw new InvalidArgumentException('사업장주소를 검색해 주세요.');
        }
        $regionId = $this->resolveStudyRoomRegionId($input);
        $basis = $this->optionalEnum($input, 'region_basis_type', ['dong', 'complex'])
            ?? $this->optionalEnum($input, 'region_basis', ['dong', 'complex'])
            ?? 'dong';

        $pdo = Connection::get();
        $complexId = $this->resolveStudyRoomComplexId($pdo, $input, $regionId, $addressText);
        if ($basis === 'complex' && ($complexId === null || $complexId <= 0)) {
            $basis = 'dong';
        }
        if ($basis !== 'complex') {
            $complexId = null;
            $basis = 'dong';
        }

        $slots = $this->normalizeSignupPromoSlots($pdo, $input, $regionId, $complexId, $basis);

        if (array_key_exists('home_address', $input) || array_key_exists('home_address_zip', $input)
            || array_key_exists('home_address_line2', $input)) {
            $home = $this->optionalString($input, 'home_address');
            $zip = $this->optionalString($input, 'home_address_zip');
            $line2 = $this->optionalString($input, 'home_address_line2');
            try {
                $pdo->prepare(
                    'UPDATE user_profiles SET address_line1 = COALESCE(?, address_line1), address_zip = COALESCE(?, address_zip), address_line2 = COALESCE(?, address_line2) WHERE user_id = ?'
                )->execute([$home, $zip, $line2, $userId]);
            } catch (PDOException $e) {
                $pdo->prepare(
                    'UPDATE user_profiles SET address_line1 = COALESCE(?, address_line1), address_zip = COALESCE(?, address_zip) WHERE user_id = ?'
                )->execute([$home, $zip, $userId]);
            }
        }

        $pdo->beginTransaction();
        try {
            $hasBasisCol = $this->columnExists($pdo, 'study_rooms', 'region_basis_type');
            if ($hasBasisCol) {
                $stmt = $pdo->prepare(
                    'INSERT INTO study_rooms (
                        user_id, study_room_name, main_subject_note, region_id, complex_id, region_basis_type,
                        address_text, profile_status, detail_completion_status
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
                );
                $stmt->execute([
                    $userId,
                    $name,
                    $mainSubject,
                    $regionId,
                    $complexId,
                    $basis,
                    $addressText,
                    'draft',
                    'basic_only',
                ]);
            } else {
                $stmt = $pdo->prepare(
                    'INSERT INTO study_rooms (
                        user_id, study_room_name, main_subject_note, region_id, complex_id, address_text,
                        profile_status, detail_completion_status
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
                );
                $stmt->execute([
                    $userId,
                    $name,
                    $mainSubject,
                    $regionId,
                    $complexId,
                    $addressText,
                    'draft',
                    'basic_only',
                ]);
            }
            $roomId = (int) $pdo->lastInsertId();

            $bizLine2 = $this->optionalString($input, 'address_line2');
            if ($bizLine2 !== null) {
                try {
                    $pdo->prepare('UPDATE study_rooms SET address_line2 = ? WHERE id = ?')->execute([$bizLine2, $roomId]);
                } catch (PDOException $e) {
                    /* 컬럼 미적용 */
                }
            }

            $hasSlotBasis = $this->columnExists($pdo, 'study_room_regions', 'region_basis_type');
            foreach ($slots as $slot) {
                if ($hasSlotBasis) {
                    $pdo->prepare(
                        'INSERT INTO study_room_regions (study_room_id, slot, region_id, complex_id, region_basis_type, is_primary)
                         VALUES (?, ?, ?, ?, ?, ?)'
                    )->execute([
                        $roomId,
                        $slot['slot'],
                        $slot['region_id'],
                        $slot['complex_id'],
                        $slot['region_basis_type'],
                        $slot['is_primary'],
                    ]);
                } else {
                    $pdo->prepare(
                        'INSERT INTO study_room_regions (study_room_id, slot, region_id, complex_id, is_primary)
                         VALUES (?, ?, ?, ?, ?)'
                    )->execute([
                        $roomId,
                        $slot['slot'],
                        $slot['region_id'],
                        $slot['complex_id'],
                        $slot['is_primary'],
                    ]);
                }
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

    /** @param array<string, mixed> $input */
    private function resolveStudyRoomRegionId(array $input): int
    {
        if (isset($input['region_id']) && (string) $input['region_id'] !== '') {
            return $this->requireExplicitRegionId($input);
        }
        $pdo = Connection::get();
        $matched = AddressRegionMatch::match(
            $pdo,
            (string) ($input['address_sido'] ?? ''),
            (string) ($input['address_sigungu'] ?? ''),
            (string) ($input['address_bname'] ?? '')
        );
        if ($matched === null) {
            throw new InvalidArgumentException('사업장주소의 행정동을 찾지 못했습니다. 주소 검색으로 다시 선택해 주세요.');
        }

        return $matched;
    }

    /** @param array<string, mixed> $input */
    private function resolveStudyRoomComplexId(PDO $pdo, array $input, int $regionId, string $addressText): ?int
    {
        if (isset($input['complex_id']) && (string) $input['complex_id'] !== '') {
            try {
                return $this->requireComplexId($input);
            } catch (InvalidArgumentException $e) {
                /* 시드에 없는 id면 이름으로 생성 */
            }
        }
        $name = $this->optionalString($input, 'complex_name');
        if ($name === null) {
            return null;
        }
        $addr = $this->optionalString($input, 'complex_address') ?? $addressText;

        return ComplexEnsure::ensure($pdo, $regionId, $name, $addr);
    }

    /**
     * @param array<string, mixed> $input
     * @return list<array{slot:int,region_id:int,complex_id:?int,region_basis_type:string,is_primary:int}>
     */
    private function normalizeSignupPromoSlots(PDO $pdo, array $input, int $fallbackRegionId, ?int $fallbackComplexId, string $fallbackBasis): array
    {
        $raw = $input['saved_regions'] ?? null;
        $out = [];
        if (is_array($raw) && $raw !== []) {
            $primaryAssigned = false;
            foreach (array_values($raw) as $idx => $slot) {
                $slotNum = $idx + 1;
                if ($slotNum > 3 || !is_array($slot)) {
                    continue;
                }
                $regionId = isset($slot['region_id']) && $slot['region_id'] !== '' ? (int) $slot['region_id'] : 0;
                $complexId = isset($slot['complex_id']) && $slot['complex_id'] !== '' ? (int) $slot['complex_id'] : null;
                $slotBasis = isset($slot['region_basis_type']) && in_array($slot['region_basis_type'], ['dong', 'complex'], true)
                    ? $slot['region_basis_type']
                    : $fallbackBasis;
                if ($regionId <= 0) {
                    continue;
                }
                if ($slotBasis === 'complex') {
                    $cname = trim((string) ($slot['complex_name'] ?? ''));
                    if (($complexId === null || $complexId <= 0) && $cname !== '') {
                        $caddr = trim((string) ($slot['complex_address'] ?? $slot['address_text'] ?? ''));
                        $complexId = ComplexEnsure::ensure($pdo, $regionId, $cname, $caddr !== '' ? $caddr : null);
                    }
                    if ($complexId === null || $complexId <= 0) {
                        continue;
                    }
                } else {
                    $complexId = null;
                    $slotBasis = 'dong';
                }
                $isPrimary = !empty($slot['is_primary']) ? 1 : 0;
                if ($isPrimary) {
                    if ($primaryAssigned) {
                        $isPrimary = 0;
                    } else {
                        $primaryAssigned = true;
                    }
                }
                $out[] = [
                    'slot' => $slotNum,
                    'region_id' => $regionId,
                    'complex_id' => $complexId,
                    'region_basis_type' => $slotBasis,
                    'is_primary' => $isPrimary,
                ];
            }
            if ($out !== [] && !$primaryAssigned) {
                $out[0]['is_primary'] = 1;
            }
        }

        if ($out === []) {
            $out[] = [
                'slot' => 1,
                'region_id' => $fallbackRegionId,
                'complex_id' => $fallbackBasis === 'complex' ? $fallbackComplexId : null,
                'region_basis_type' => $fallbackBasis === 'complex' ? 'complex' : 'dong',
                'is_primary' => 1,
            ];
        }

        return $out;
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
