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
     * @param array<string, mixed> $input
     */
    private function registerStudent(int $userId, array $input): int
    {
        $preferredLessonType = $this->requireEnum($input, 'preferred_lesson_type', ['tutor', 'study_room']);
        $regionId = $this->requireRegionId($input, $userId);
        $gradeLevel = $this->requireString($input, 'grade_level');
        $schoolLevel = $this->requireEnum($input, 'school_level', $this->schoolLevelCodes());
        $lessonFormat = $this->requireEnum($input, 'lesson_format', ['one_on_one', 'group']);
        $lessonsPerWeek = $this->requirePositiveInt($input, 'lessons_per_week');
        $minutesPerLesson = $this->requirePositiveInt($input, 'minutes_per_lesson');
        $preferredFee = $this->optionalInt($input, 'preferred_fee_amount');
        $preferredStudyroomFee = $this->optionalInt($input, 'preferred_studyroom_fee_amount');

        $studentGenderGroup = null;
        $preferredCountGroup = 'solo';
        if ($lessonFormat === 'group') {
            $studentGenderGroup = $this->requireEnum($input, 'student_gender_group', ['male', 'female', 'mixed']);
            $preferredCountGroup = $this->requireEnum($input, 'preferred_student_count_group', ['solo', 'two', 'three', 'four_plus']);
            if ($preferredCountGroup === 'solo') {
                throw new InvalidArgumentException('preferred_student_count_group: 그룹과외는 2명 이상을 선택해 주세요.');
            }
        }

        $publicName = $this->optionalString($input, 'public_display_name')
            ?: ($this->optionalString($input, 'student_name') ?: '학생');
        $studentName = $this->optionalString($input, 'student_name') ?: $publicName;
        $childGender = $this->requireEnum($input, 'gender', ['male', 'female']);
        $birthYear = $this->requireBirthYear($input);

        $studyroomRegionId = $preferredLessonType === 'study_room' ? $regionId : null;
        $tutorRegionId = $preferredLessonType === 'tutor' ? $regionId : null;
        if ($preferredLessonType === 'study_room') {
            $tutorRegionId = null;
        }

        $regionNote = $this->optionalString($input, 'preferred_region_note');
        $requestSummary = $this->optionalString($input, 'request_summary');
        $requestVisibility = $this->optionalEnum($input, 'request_summary_visibility', ['private', 'paid_only']) ?? 'private';

        $subjectNames = $this->parseSubjectNames($input);
        $lessonPlaces = $this->parseStringList($input, 'lesson_places', ['student_home', 'study_room', 'public_place']);
        $styleBadges = $this->parseStringList($input, 'teaching_style_badges', $this->teachingStyleCodes());

        if ($lessonPlaces === []) {
            throw new InvalidArgumentException('lesson_places: 희망 수업장소를 1개 이상 선택해 주세요.');
        }
        if ($styleBadges === []) {
            throw new InvalidArgumentException('teaching_style_badges: 희망 강의스타일을 1개 이상 선택해 주세요.');
        }

        $pdo = Connection::get();
        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare(
                'INSERT INTO students (
                    guardian_user_id, student_name, public_display_name, gender, birth_year, grade_level,
                    preferred_lesson_type,
                    preferred_studyroom_region_id, preferred_tutor_region_id, preferred_region_note,
                    preferred_fee_amount, preferred_studyroom_fee_amount,
                    lessons_per_week, minutes_per_lesson,
                    lesson_format, student_gender_group, preferred_student_count_group,
                    request_summary, request_summary_visibility,
                    exposure_status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
            );
            $stmt->execute([
                $userId,
                $studentName,
                $publicName,
                $childGender,
                $birthYear,
                $gradeLevel,
                $preferredLessonType,
                $studyroomRegionId,
                $tutorRegionId,
                $regionNote,
                $preferredFee,
                $preferredStudyroomFee,
                $lessonsPerWeek,
                $minutesPerLesson,
                $lessonFormat,
                $studentGenderGroup,
                $preferredCountGroup,
                $requestSummary,
                $requestVisibility,
                'draft',
            ]);
            $studentId = (int) $pdo->lastInsertId();

            $this->insertStudentSubjects($pdo, $studentId, $subjectNames, $schoolLevel);
            $this->insertStudentPlaces($pdo, $studentId, $lessonPlaces);
            $this->insertStudentStyleBadges($pdo, $studentId, $styleBadges);

            $pdo->commit();
        } catch (PDOException $e) {
            $pdo->rollBack();
            throw new RuntimeException('학생 기본등록 저장 실패: ' . $e->getMessage(), 0, $e);
        }

        return $studentId;
    }

    /**
     * @param array<string, mixed> $input
     */
    private function registerStudyRoom(int $userId, array $input): int
    {
        $name = $this->requireString($input, 'study_room_name');
        $regionId = $this->requireRegionId($input, $userId);
        $mainSubject = $this->requireString($input, 'main_subject_note');
        $priceAmount = $this->requirePositiveInt($input, 'price_amount');
        $lessonPlace = $this->requireEnum($input, 'lesson_place_type', ['academy', 'study_room']);
        $lessonOperation = $this->requireEnum($input, 'lesson_operation_type', [
            'group_by_time_slot', 'time_slot_mixed_grade', 'individual_visit',
        ]);
        $capacity = $this->requireEnum($input, 'capacity_per_time', ['one_to_four', 'five_to_eight', 'nine_plus']);
        $educationOffice = !empty($input['education_office_registered']) ? 1 : 0;

        $schoolLevels = $this->parseStringList($input, 'school_levels', $this->schoolLevelCodes());
        if ($schoolLevels === []) {
            throw new InvalidArgumentException('school_levels: 대상 학교급을 1개 이상 선택해 주세요.');
        }

        ProfileGenderSync::requireFromInput($input);

        $pdo = Connection::get();
        $pdo->beginTransaction();
        try {
            ProfileGenderSync::sync($userId, $input);

            $stmt = $pdo->prepare(
                'INSERT INTO study_rooms (
                    user_id, study_room_name, main_subject_note, region_id,
                    price_amount, lesson_place_type, lesson_operation_type,
                    capacity_per_time, education_office_registered, profile_status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
            );
            $stmt->execute([
                $userId,
                $name,
                $mainSubject,
                $regionId,
                $priceAmount,
                $lessonPlace,
                $lessonOperation,
                $capacity,
                $educationOffice,
                'draft',
            ]);
            $roomId = (int) $pdo->lastInsertId();

            $pdo->prepare(
                'INSERT INTO study_room_regions (study_room_id, slot, region_id, is_primary) VALUES (?, 1, ?, 1)'
            )->execute([$roomId, $regionId]);

            $subjectId = $this->findSubjectMasterId($pdo, $this->firstSubjectName($mainSubject));
            foreach ($schoolLevels as $level) {
                $pdo->prepare(
                    'INSERT INTO study_room_subject_targets (study_room_id, subject_name, school_level, subject_master_id, is_main)
                     VALUES (?, ?, ?, ?, ?)'
                )->execute([$roomId, $this->firstSubjectName($mainSubject), $level, $subjectId, $level === $schoolLevels[0] ? 1 : 0]);
            }

            $pdo->commit();
        } catch (PDOException $e) {
            $pdo->rollBack();
            throw new RuntimeException('공부방 기본등록 저장 실패: ' . $e->getMessage(), 0, $e);
        }

        return $roomId;
    }

    /**
     * @param array<string, mixed> $input
     */
    private function registerTutor(int $userId, array $input): int
    {
        $displayName = $this->requireString($input, 'tutor_display_name');
        $regionId = $this->requireRegionId($input, $userId);
        $mainSubject = $this->requireString($input, 'main_subject_note');
        $genderGroup = $this->requireEnum($input, 'student_gender_group', ['male', 'female', 'mixed']);
        $countGroup = $this->requireEnum($input, 'student_count_group', ['solo', 'two', 'three', 'four_plus']);
        $preferredFee = $this->requirePositiveInt($input, 'preferred_fee_amount');
        $feeBasis = $this->requireEnum($input, 'fee_basis_type', ['monthly_by_weekly_schedule', 'monthly_by_total_sessions']);
        $lessonsPerWeek = $this->optionalInt($input, 'lessons_per_week');
        $monthlySessions = $this->optionalInt($input, 'monthly_session_count');
        $minutesPerLesson = $this->optionalInt($input, 'minutes_per_lesson');
        $universityName = $this->optionalString($input, 'university_name');
        $majorName = $this->optionalString($input, 'major_name');
        $universityStatus = $this->optionalEnum($input, 'university_status', ['enrolled', 'leave', 'completed', 'graduated']);
        $careerBand = $this->optionalEnum($input, 'career_year_band', ['y1_3', 'y4_6', 'y7_10', 'y10_plus']);
        $ageBand = $this->optionalEnum($input, 'age_band', [
            'early_20s', 'late_20s', 'early_30s', 'late_30s', 'early_40s', 'late_40s', 'over_50',
        ]);

        $lessonPlaces = $this->parseStringList($input, 'lesson_places', [
            'student_home_visit', 'public_place', 'tutor_home',
        ]);
        $styleBadges = $this->parseStringList($input, 'teaching_style_badges', $this->teachingStyleCodes());
        if ($lessonPlaces === []) {
            throw new InvalidArgumentException('lesson_places: 강의장소를 1개 이상 선택해 주세요.');
        }

        ProfileGenderSync::requireFromInput($input);

        $pdo = Connection::get();
        $pdo->beginTransaction();
        try {
            ProfileGenderSync::sync($userId, $input);

            $stmt = $pdo->prepare(
                'INSERT INTO tutors (
                    user_id, tutor_display_name, main_subject_note,
                    student_gender_group, student_count_group,
                    preferred_fee_amount, fee_basis_type,
                    lessons_per_week, monthly_session_count, minutes_per_lesson,
                    university_name, major_name, university_status,
                    career_year_band, age_band, profile_status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
            );
            $stmt->execute([
                $userId,
                $displayName,
                $mainSubject,
                $genderGroup,
                $countGroup,
                $preferredFee,
                $feeBasis,
                $lessonsPerWeek,
                $monthlySessions,
                $minutesPerLesson,
                $universityName,
                $majorName,
                $universityStatus,
                $careerBand,
                $ageBand,
                'draft',
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

            foreach ($lessonPlaces as $place) {
                $pdo->prepare(
                    'INSERT INTO tutor_lesson_places (tutor_id, place_type) VALUES (?, ?)'
                )->execute([$tutorId, $place]);
            }

            foreach ($styleBadges as $i => $badge) {
                $pdo->prepare(
                    'INSERT INTO tutor_teaching_style_badges (tutor_id, badge_name, display_order) VALUES (?, ?, ?)'
                )->execute([$tutorId, $badge, $i]);
            }

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
    private function requireRegionId(array $input, int $userId): int
    {
        if (isset($input['region_id']) && $input['region_id'] !== '') {
            return (int) $input['region_id'];
        }

        $pdo = Connection::get();
        $stmt = $pdo->prepare('SELECT default_region_id FROM user_profiles WHERE user_id = ?');
        $stmt->execute([$userId]);
        $id = $stmt->fetchColumn();
        if ($id) {
            return (int) $id;
        }

        throw new InvalidArgumentException('region_id: 지역을 선택해 주세요.');
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
