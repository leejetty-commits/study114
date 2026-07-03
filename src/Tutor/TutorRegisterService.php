<?php



declare(strict_types=1);



namespace Study114\Tutor;



use InvalidArgumentException;

use PDO;

use PDOException;

use RuntimeException;

use Study114\Database\Connection;



final class TutorRegisterService

{

    /** @return array{regions: list<array{id: int, label: string}>} */

    public function getMasters(): array

    {

        $pdo = Connection::get();

        $regions = $pdo->query(

            'SELECT id, CONCAT(sido_name, " ", sigungu_name, " ", dong_name) AS label

             FROM regions WHERE is_active = 1 ORDER BY id ASC'

        )->fetchAll(PDO::FETCH_ASSOC);



        return ['regions' => $this->intIdRows($regions)];

    }



    /** @return array<string, mixed>|null */

    public function loadForUser(int $userId): ?array

    {

        $pdo = Connection::get();

        $stmt = $pdo->prepare(

            'SELECT * FROM tutors

             WHERE user_id = ? AND profile_status IN ("draft", "pending")

             ORDER BY updated_at DESC, id DESC

             LIMIT 1'

        );

        $stmt->execute([$userId]);

        /** @var array<string, mixed>|false $row */

        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($row === false) {

            return null;

        }



        return $this->hydrateTutor((int) $row['id'], $row);

    }



    /**

     * @param array<string, mixed> $input

     * @return array{tutor_id: int, detail_completion_status: string, profile_status: string}

     */

    public function saveStep(int $userId, ?int $tutorId, string $step, array $input): array

    {

        $allowed = ['basic', 'regions', 'lesson', 'career', 'contact'];

        if (!in_array($step, $allowed, true)) {

            throw new InvalidArgumentException('step: 유효하지 않은 단계입니다.');

        }



        $this->assertTutorRole($userId);



        $pdo = Connection::get();

        $pdo->beginTransaction();

        try {

            if ($tutorId === null) {

                if ($step !== 'basic') {

                    throw new InvalidArgumentException('tutor_id: 먼저 기본정보를 저장해 주세요.');

                }

                $tutorId = $this->insertDraft($pdo, $userId, $input);

            } else {

                $this->assertOwnership($pdo, $userId, $tutorId);

            }



            match ($step) {

                'basic'    => $this->saveBasic($pdo, $tutorId, $input),

                'regions'  => $this->saveRegions($pdo, $tutorId, $input),

                'lesson'   => $this->saveLesson($pdo, $tutorId, $input),

                'career'   => $this->saveCareer($pdo, $tutorId, $input),

                'contact'  => $this->saveContact($pdo, $tutorId, $input),

            };

            if ($step === 'basic') {
                \Study114\Auth\ProfileGenderSync::sync($userId, $input);
            }



            $this->refreshDetailStatus($pdo, $tutorId, $step);



            $statusStmt = $pdo->prepare(

                'SELECT profile_status, detail_completion_status FROM tutors WHERE id = ?'

            );

            $statusStmt->execute([$tutorId]);

            /** @var array{profile_status: string, detail_completion_status: string}|false $status */

            $status = $statusStmt->fetch(PDO::FETCH_ASSOC);

            if ($status === false) {

                throw new RuntimeException('저장 후 상태 조회 실패');

            }



            $pdo->commit();

        } catch (PDOException $e) {

            $pdo->rollBack();

            throw new RuntimeException('과외쌤 등록 저장 실패: ' . $e->getMessage(), 0, $e);

        }



        return [

            'tutor_id'                 => $tutorId,

            'profile_status'           => $status['profile_status'],

            'detail_completion_status' => $status['detail_completion_status'],

        ];

    }



    private function assertTutorRole(int $userId): void

    {

        $pdo = Connection::get();

        $stmt = $pdo->prepare(

            'SELECT 1 FROM user_roles

             WHERE user_id = ? AND role_type = "tutor" AND status = "active" LIMIT 1'

        );

        $stmt->execute([$userId]);

        if (!$stmt->fetchColumn()) {

            throw new InvalidArgumentException('과외쌤 계정으로 로그인해 주세요.');

        }

    }



    private function assertOwnership(PDO $pdo, int $userId, int $tutorId): void

    {

        $stmt = $pdo->prepare('SELECT 1 FROM tutors WHERE id = ? AND user_id = ?');

        $stmt->execute([$tutorId, $userId]);

        if (!$stmt->fetchColumn()) {

            throw new InvalidArgumentException('tutor_id: 접근 권한이 없습니다.');

        }

    }



    /** @param array<string, mixed> $input */

    private function insertDraft(PDO $pdo, int $userId, array $input): int

    {

        $name = $this->requireString($input, 'tutor_display_name');

        $stmt = $pdo->prepare(

            'INSERT INTO tutors (user_id, tutor_display_name, profile_status, detail_completion_status)

             VALUES (?, ?, "draft", "basic_only")'

        );

        $stmt->execute([$userId, $name]);



        return (int) $pdo->lastInsertId();

    }



    /** @param array<string, mixed> $input */

    private function saveBasic(PDO $pdo, int $tutorId, array $input): void

    {

        $stmt = $pdo->prepare(

            'UPDATE tutors SET

                tutor_display_name = ?,

                slogan = ?,

                intro_short = ?,

                intro_long = ?,

                student_gender_group = ?,

                student_count_group = ?,

                age_band = ?

             WHERE id = ?'

        );

        $stmt->execute([

            $this->requireString($input, 'tutor_display_name'),

            $this->optionalString($input, 'slogan'),

            $this->optionalString($input, 'intro_short'),

            $this->optionalString($input, 'intro_long'),

            $this->requireEnum($input, 'student_gender_group', ['male', 'female', 'mixed']),

            $this->requireEnum($input, 'student_count_group', ['solo', 'two', 'three', 'four_plus']),

            $this->optionalEnum($input, 'age_band', [

                'early_20s', 'late_20s', 'early_30s', 'late_30s', 'early_40s', 'late_40s', 'over_50',

            ]),

            $tutorId,

        ]);

    }



    /** @param array<string, mixed> $input */

    private function saveRegions(PDO $pdo, int $tutorId, array $input): void

    {

        $slots = $input['saved_regions'] ?? [];

        if (!is_array($slots)) {

            $slots = [];

        }



        $pdo->prepare('DELETE FROM tutor_regions WHERE tutor_id = ?')->execute([$tutorId]);



        $order = 0;

        $primaryAssigned = false;

        foreach ($slots as $slot) {

            if (!is_array($slot) || $order >= 3) {

                continue;

            }

            $regionId = isset($slot['region_id']) && $slot['region_id'] !== '' ? (int) $slot['region_id'] : 0;

            if ($regionId <= 0) {

                continue;

            }

            $scope = $this->optionalEnum($slot, 'scope_type', ['city', 'district', 'metro']) ?? 'city';

            $isPrimary = !empty($slot['is_primary']) ? 1 : 0;

            if ($isPrimary) {

                $primaryAssigned = true;

            }



            $pdo->prepare(

                'INSERT INTO tutor_regions (tutor_id, region_id, scope_type, priority_order, is_primary)

                 VALUES (?, ?, ?, ?, ?)'

            )->execute([$tutorId, $regionId, $scope, $order, $isPrimary]);

            $order++;

        }



        if (!$primaryAssigned && $order > 0) {

            $pdo->prepare(

                'UPDATE tutor_regions SET is_primary = 1 WHERE tutor_id = ? AND priority_order = 0'

            )->execute([$tutorId]);

        }

    }



    /** @param array<string, mixed> $input */

    private function saveLesson(PDO $pdo, int $tutorId, array $input): void

    {

        $stmt = $pdo->prepare(

            'UPDATE tutors SET

                main_subject_note = ?,

                preferred_fee_amount = ?,

                fee_basis_type = ?,

                lessons_per_week = ?,

                monthly_session_count = ?,

                minutes_per_lesson = ?,

                fee_description = ?

             WHERE id = ?'

        );

        $stmt->execute([

            $this->requireString($input, 'main_subject_note'),

            $this->requirePositiveInt($input, 'preferred_fee_amount'),

            $this->requireEnum($input, 'fee_basis_type', ['monthly_by_weekly_schedule', 'monthly_by_total_sessions']),

            $this->optionalInt($input, 'lessons_per_week'),

            $this->optionalInt($input, 'monthly_session_count'),

            $this->optionalInt($input, 'minutes_per_lesson'),

            $this->optionalString($input, 'fee_description'),

            $tutorId,

        ]);



        $this->syncSubjects($pdo, $tutorId, $input);

        $this->syncLessonPlaces($pdo, $tutorId, $input);

    }



    /** @param array<string, mixed> $input */

    private function saveCareer(PDO $pdo, int $tutorId, array $input): void

    {

        $stmt = $pdo->prepare(

            'UPDATE tutors SET

                university_name = ?,

                major_name = ?,

                university_status = ?,

                career_year_band = ?,

                main_material_note = ?,

                feature_1 = ?,

                feature_2 = ?,

                feature_3 = ?,

                proof_document_available = ?

             WHERE id = ?'

        );

        $stmt->execute([

            $this->optionalString($input, 'university_name'),

            $this->optionalString($input, 'major_name'),

            $this->optionalEnum($input, 'university_status', ['enrolled', 'leave', 'completed', 'graduated']),

            $this->optionalEnum($input, 'career_year_band', ['y1_3', 'y4_6', 'y7_10', 'y10_plus']),

            $this->optionalString($input, 'main_material_note'),

            $this->optionalString($input, 'feature_1'),

            $this->optionalString($input, 'feature_2'),

            $this->optionalString($input, 'feature_3'),

            !empty($input['proof_document_available']) ? 1 : 0,

            $tutorId,

        ]);



        $this->syncStyleBadges($pdo, $tutorId, $input);

    }



    /** @param array<string, mixed> $input */

    private function saveContact(PDO $pdo, int $tutorId, array $input): void

    {

        $profileStatus = $this->requireEnum($input, 'profile_status', ['draft', 'pending', 'published']);



        $stmt = $pdo->prepare(

            'UPDATE tutors SET contact_time_note = ?, youtube_url = ?, profile_status = ? WHERE id = ?'

        );

        $stmt->execute([

            $this->optionalString($input, 'contact_time_note'),

            $this->optionalString($input, 'youtube_url'),

            $profileStatus,

            $tutorId,

        ]);



        $this->syncImages($pdo, $tutorId, $input);

    }



    /** @param array<string, mixed> $input */

    private function syncSubjects(PDO $pdo, int $tutorId, array $input): void

    {

        $subjects = $input['subjects'] ?? [];

        if (!is_array($subjects) || $subjects === []) {

            $main = $this->requireString($input, 'main_subject_note');

            $subjects = [['subject_name' => $main, 'school_level' => 'middle', 'is_primary' => true]];

        }



        $pdo->prepare('DELETE FROM tutor_subject_targets WHERE tutor_id = ?')->execute([$tutorId]);



        foreach ($subjects as $sub) {

            if (!is_array($sub)) {

                continue;

            }

            $name = $this->requireString($sub, 'subject_name');

            $level = $this->requireEnum($sub, 'school_level', $this->schoolLevelCodes());

            $masterId = isset($sub['subject_master_id']) && $sub['subject_master_id'] !== ''

                ? (int) $sub['subject_master_id']

                : $this->findSubjectMasterId($pdo, $name);



            $pdo->prepare(

                'INSERT INTO tutor_subject_targets

                 (tutor_id, subject_name, school_level, grade_band, subject_master_id, is_primary)

                 VALUES (?, ?, ?, ?, ?, ?)'

            )->execute([

                $tutorId,

                $name,

                $level,

                $this->optionalString($sub, 'grade_band'),

                $masterId,

                !empty($sub['is_primary']) ? 1 : 0,

            ]);

        }

    }



    /** @param array<string, mixed> $input */

    private function syncLessonPlaces(PDO $pdo, int $tutorId, array $input): void

    {

        $places = $input['lesson_places'] ?? [];

        if (!is_array($places)) {

            $places = $places === '' || $places === null ? [] : [$places];

        }



        $pdo->prepare('DELETE FROM tutor_lesson_places WHERE tutor_id = ?')->execute([$tutorId]);



        foreach ($places as $place) {

            $place = (string) $place;

            if (!in_array($place, ['student_home_visit', 'public_place', 'tutor_home'], true)) {

                continue;

            }

            $pdo->prepare('INSERT INTO tutor_lesson_places (tutor_id, place_type) VALUES (?, ?)')

                ->execute([$tutorId, $place]);

        }

    }



    /** @param array<string, mixed> $input */

    private function syncStyleBadges(PDO $pdo, int $tutorId, array $input): void

    {

        $badges = $input['teaching_style_badges'] ?? [];

        if (!is_array($badges)) {

            $badges = $badges === '' || $badges === null ? [] : [$badges];

        }



        $pdo->prepare('DELETE FROM tutor_teaching_style_badges WHERE tutor_id = ?')->execute([$tutorId]);



        $i = 0;

        foreach ($badges as $badge) {

            $badge = (string) $badge;

            if (!in_array($badge, $this->teachingStyleCodes(), true)) {

                continue;

            }

            $pdo->prepare(

                'INSERT INTO tutor_teaching_style_badges (tutor_id, badge_name, display_order) VALUES (?, ?, ?)'

            )->execute([$tutorId, $badge, $i]);

            $i++;

        }

    }



    /** @param array<string, mixed> $input */

    private function syncImages(PDO $pdo, int $tutorId, array $input): void

    {

        $images = $input['images'] ?? [];

        if (!is_array($images) || $images === []) {

            return;

        }



        $pdo->prepare('DELETE FROM tutor_images WHERE tutor_id = ?')->execute([$tutorId]);



        $order = 1;

        foreach ($images as $img) {

            if (!is_array($img) || $order > 5) {

                continue;

            }

            $path = trim((string) ($img['image_path'] ?? $img['name'] ?? ''));

            if ($path === '') {

                continue;

            }

            $type = (string) ($img['image_type'] ?? 'other');

            if (!in_array($type, ['profile', 'intro', 'proof_aux', 'other'], true)) {

                $type = 'other';

            }

            $sortOrder = isset($img['sort_order']) ? (int) $img['sort_order'] : $order;



            $pdo->prepare(

                'INSERT INTO tutor_images (tutor_id, image_type, image_path, sort_order) VALUES (?, ?, ?, ?)'

            )->execute([$tutorId, $type, $path, $sortOrder]);

            $order++;

        }

    }



    private function refreshDetailStatus(PDO $pdo, int $tutorId, string $step): void

    {

        $stmt = $pdo->prepare('SELECT detail_completion_status FROM tutors WHERE id = ?');

        $stmt->execute([$tutorId]);

        $current = (string) ($stmt->fetchColumn() ?: 'basic_only');



        $next = $current;

        if ($step === 'regions' && $current === 'basic_only') {

            $next = 'basic_only';

        } elseif (in_array($step, ['lesson', 'career'], true) && $current !== 'expanded_complete') {

            $next = 'expanded_in_progress';

        } elseif ($step === 'contact') {

            $next = 'expanded_complete';

        }



        if ($next !== $current) {

            $pdo->prepare('UPDATE tutors SET detail_completion_status = ? WHERE id = ?')

                ->execute([$next, $tutorId]);

        }

    }



    /** @param array<string, mixed> $row */

    private function hydrateTutor(int $tutorId, array $row): array

    {

        $pdo = Connection::get();



        $regionStmt = $pdo->prepare(

            'SELECT region_id, scope_type, is_primary, priority_order

             FROM tutor_regions WHERE tutor_id = ? ORDER BY priority_order ASC'

        );

        $regionStmt->execute([$tutorId]);

        $savedRegions = [];

        foreach ($regionStmt->fetchAll(PDO::FETCH_ASSOC) as $r) {

            $savedRegions[] = [

                'region_id'  => (string) $r['region_id'],

                'scope_type' => (string) $r['scope_type'],

                'is_primary' => (bool) $r['is_primary'],

            ];

        }

        while (count($savedRegions) < 3) {

            $savedRegions[] = ['region_id' => '', 'scope_type' => 'city', 'is_primary' => false];

        }



        $subjectStmt = $pdo->prepare(

            'SELECT school_level, grade_band, subject_master_id, subject_name, is_primary

             FROM tutor_subject_targets WHERE tutor_id = ? ORDER BY is_primary DESC, id ASC'

        );

        $subjectStmt->execute([$tutorId]);

        $subjects = [];

        foreach ($subjectStmt->fetchAll(PDO::FETCH_ASSOC) as $s) {

            $subjects[] = [

                'school_level'      => (string) $s['school_level'],

                'grade_band'        => (string) ($s['grade_band'] ?? ''),

                'subject_master_id' => $s['subject_master_id'] !== null ? (string) $s['subject_master_id'] : '',

                'subject_name'      => (string) $s['subject_name'],

                'is_primary'        => (bool) $s['is_primary'],

            ];

        }



        $placeStmt = $pdo->prepare('SELECT place_type FROM tutor_lesson_places WHERE tutor_id = ?');

        $placeStmt->execute([$tutorId]);

        $lessonPlaces = $placeStmt->fetchAll(PDO::FETCH_COLUMN);



        $badgeStmt = $pdo->prepare(

            'SELECT badge_name FROM tutor_teaching_style_badges WHERE tutor_id = ? ORDER BY display_order ASC'

        );

        $badgeStmt->execute([$tutorId]);

        $badges = $badgeStmt->fetchAll(PDO::FETCH_COLUMN);



        $imageStmt = $pdo->prepare(

            'SELECT image_type, image_path, sort_order FROM tutor_images WHERE tutor_id = ? ORDER BY sort_order ASC'

        );

        $imageStmt->execute([$tutorId]);

        $images = [];

        foreach ($imageStmt->fetchAll(PDO::FETCH_ASSOC) as $img) {

            $images[] = [

                'image_type' => (string) $img['image_type'],

                'sort_order' => (int) $img['sort_order'],

                'name'       => (string) $img['image_path'],

                'image_path' => (string) $img['image_path'],

            ];

        }



        return [

            'tutor_id'                   => $tutorId,

            'gender'                     => \Study114\Auth\ProfileGenderSync::get((int) $row['user_id']) ?? 'male',

            'tutor_display_name'         => (string) ($row['tutor_display_name'] ?? ''),

            'slogan'                     => (string) ($row['slogan'] ?? ''),

            'intro_short'                => (string) ($row['intro_short'] ?? ''),

            'intro_long'                 => (string) ($row['intro_long'] ?? ''),

            'student_gender_group'       => (string) ($row['student_gender_group'] ?? 'mixed'),

            'student_count_group'        => (string) ($row['student_count_group'] ?? 'solo'),

            'age_band'                   => (string) ($row['age_band'] ?? ''),

            'saved_regions'              => $savedRegions,

            'main_subject_note'          => (string) ($row['main_subject_note'] ?? ''),

            'preferred_fee_amount'       => $row['preferred_fee_amount'] !== null ? (string) $row['preferred_fee_amount'] : '',

            'fee_basis_type'             => (string) ($row['fee_basis_type'] ?? 'monthly_by_weekly_schedule'),

            'lessons_per_week'           => $row['lessons_per_week'] !== null ? (string) $row['lessons_per_week'] : '',

            'monthly_session_count'      => $row['monthly_session_count'] !== null ? (string) $row['monthly_session_count'] : '',

            'minutes_per_lesson'         => $row['minutes_per_lesson'] !== null ? (string) $row['minutes_per_lesson'] : '',

            'fee_description'            => (string) ($row['fee_description'] ?? ''),

            'subjects'                   => $subjects,

            'lesson_places'              => array_map('strval', $lessonPlaces),

            'university_name'            => (string) ($row['university_name'] ?? ''),

            'major_name'                 => (string) ($row['major_name'] ?? ''),

            'university_status'          => (string) ($row['university_status'] ?? ''),

            'career_year_band'           => (string) ($row['career_year_band'] ?? ''),

            'main_material_note'         => (string) ($row['main_material_note'] ?? ''),

            'feature_1'                  => (string) ($row['feature_1'] ?? ''),

            'feature_2'                  => (string) ($row['feature_2'] ?? ''),

            'feature_3'                  => (string) ($row['feature_3'] ?? ''),

            'proof_document_available'   => (bool) ($row['proof_document_available'] ?? false),

            'teaching_style_badges'      => array_map('strval', $badges),

            'contact_time_note'          => (string) ($row['contact_time_note'] ?? ''),

            'youtube_url'                => (string) ($row['youtube_url'] ?? ''),

            'images'                     => $images,

            'profile_status'             => (string) ($row['profile_status'] ?? 'draft'),

            'detail_completion_status'     => (string) ($row['detail_completion_status'] ?? 'basic_only'),

        ];

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



    /** @param list<array<string, mixed>> $rows @return list<array<string, mixed>> */

    private function intIdRows(array $rows): array

    {

        $out = [];

        foreach ($rows as $row) {

            $row['id'] = (int) $row['id'];

            $out[] = $row;

        }

        return $out;

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

