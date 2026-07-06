<?php



declare(strict_types=1);



namespace Study114\StudyRoom;



use InvalidArgumentException;

use PDO;

use PDOException;

use RuntimeException;

use Study114\Database\Connection;



final class StudyRoomRegisterService

{

    /** @return array{regions: list<array{id: int, label: string}>, complexes: list<array{id: int, region_id: int, label: string}>, facilities: list<array{id: int, facility_code: string, facility_name: string}>} */

    public function getMasters(): array

    {

        $pdo = Connection::get();



        $regions = $pdo->query(

            'SELECT id, CONCAT(sido_name, " ", sigungu_name, " ", dong_name) AS label

             FROM regions WHERE is_active = 1 ORDER BY id ASC'

        )->fetchAll(PDO::FETCH_ASSOC);



        $complexes = $pdo->query(

            'SELECT id, region_id, name AS label FROM complexes ORDER BY region_id ASC, id ASC'

        )->fetchAll(PDO::FETCH_ASSOC);



        $facilities = $pdo->query(

            'SELECT id, facility_code, facility_name

             FROM facility_masters WHERE is_active = 1 ORDER BY sort_order ASC, id ASC'

        )->fetchAll(PDO::FETCH_ASSOC);



        return [

            'regions'    => $this->intIdRows($regions),

            'complexes'  => $this->intIdRows($complexes, ['region_id']),

            'facilities' => $this->intIdRows($facilities),

        ];

    }



    /** @return array<string, mixed>|null */

    public function loadForUser(int $userId): ?array

    {

        $pdo = Connection::get();

        $stmt = $pdo->prepare(
            'SELECT * FROM study_rooms
             WHERE user_id = ? AND deleted_at IS NULL
               AND profile_status IN ("draft", "pending")
             ORDER BY updated_at DESC, id DESC
             LIMIT 1'
        );

        $stmt->execute([$userId]);

        /** @var array<string, mixed>|false $row */

        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($row === false) {

            return null;

        }



        return $this->hydrateRoom((int) $row['id'], $row);

    }



    /**

     * @param array<string, mixed> $input

     * @return array{study_room_id: int, detail_completion_status: string, profile_status: string}

     */

    public function saveStep(int $userId, ?int $roomId, string $step, array $input): array

    {

        $allowedSteps = ['basic', 'location', 'lesson', 'career', 'facility'];

        if (!in_array($step, $allowedSteps, true)) {

            throw new InvalidArgumentException('step: 유효하지 않은 단계입니다.');

        }



        $this->assertStudyRoomOwner($userId);



        $pdo = Connection::get();

        $pdo->beginTransaction();

        try {

            if ($roomId === null) {

                if ($step !== 'basic') {

                    throw new InvalidArgumentException('study_room_id: 먼저 기본정보를 저장해 주세요.');

                }

                $roomId = $this->insertDraft($pdo, $userId, $input);

            } else {

                $this->assertOwnership($pdo, $userId, $roomId);

            }



            match ($step) {

                'basic'    => $this->saveBasic($pdo, $roomId, $input),

                'location' => $this->saveLocation($pdo, $roomId, $input),

                'lesson'   => $this->saveLesson($pdo, $roomId, $input),

                'career'   => $this->saveCareer($pdo, $roomId, $input),

                'facility' => $this->saveFacility($pdo, $roomId, $input),

            };

            if ($step === 'basic') {
                \Study114\Auth\ProfileGenderSync::sync($userId, $input);
            }



            $this->refreshDetailStatus($pdo, $roomId, $step);



            $statusStmt = $pdo->prepare(

                'SELECT profile_status, detail_completion_status FROM study_rooms WHERE id = ?'

            );

            $statusStmt->execute([$roomId]);

            /** @var array{profile_status: string, detail_completion_status: string}|false $status */

            $status = $statusStmt->fetch(PDO::FETCH_ASSOC);

            if ($status === false) {

                throw new RuntimeException('저장 후 상태 조회 실패');

            }



            $pdo->commit();

        } catch (PDOException $e) {

            $pdo->rollBack();

            throw new RuntimeException('공부방 등록 저장 실패: ' . $e->getMessage(), 0, $e);

        }



        return [

            'study_room_id'            => $roomId,

            'profile_status'           => $status['profile_status'],

            'detail_completion_status' => $status['detail_completion_status'],

        ];

    }



    private function assertStudyRoomOwner(int $userId): void

    {

        $pdo = Connection::get();

        $stmt = $pdo->prepare(

            'SELECT 1 FROM user_roles

             WHERE user_id = ? AND role_type = "study_room_owner" AND status = "active" LIMIT 1'

        );

        $stmt->execute([$userId]);

        if (!$stmt->fetchColumn()) {

            throw new InvalidArgumentException('공부방 운영자 계정으로 로그인해 주세요.');

        }

    }



    private function assertOwnership(PDO $pdo, int $userId, int $roomId): void

    {

        $stmt = $pdo->prepare(

            'SELECT 1 FROM study_rooms WHERE id = ? AND user_id = ? AND deleted_at IS NULL'

        );

        $stmt->execute([$roomId, $userId]);

        if (!$stmt->fetchColumn()) {

            throw new InvalidArgumentException('study_room_id: 접근 권한이 없습니다.');

        }

    }



    /** @param array<string, mixed> $input */

    private function insertDraft(PDO $pdo, int $userId, array $input): int

    {

        $name = $this->requireString($input, 'study_room_name');

        $lessonPlace = $this->requireEnum($input, 'lesson_place_type', ['academy', 'study_room']);



        $stmt = $pdo->prepare(

            'INSERT INTO study_rooms (user_id, study_room_name, lesson_place_type, profile_status, detail_completion_status)

             VALUES (?, ?, ?, "draft", "basic_only")'

        );

        $stmt->execute([$userId, $name, $lessonPlace]);



        return (int) $pdo->lastInsertId();

    }



    /** @param array<string, mixed> $input */

    private function saveBasic(PDO $pdo, int $roomId, array $input): void

    {

        $stmt = $pdo->prepare(

            'UPDATE study_rooms SET

                study_room_name = ?,

                slogan = ?,

                operator_display_name = ?,

                intro_short = ?,

                intro_long = ?,

                lesson_place_type = ?

             WHERE id = ?'

        );

        $stmt->execute([

            $this->requireString($input, 'study_room_name'),

            $this->optionalString($input, 'slogan'),

            $this->optionalString($input, 'operator_display_name'),

            $this->optionalString($input, 'intro_short'),

            $this->optionalString($input, 'intro_long'),

            $this->requireEnum($input, 'lesson_place_type', ['academy', 'study_room']),

            $roomId,

        ]);

    }



    /** @param array<string, mixed> $input */

    private function saveLocation(PDO $pdo, int $roomId, array $input): void

    {

        $regionId = $this->requirePositiveInt($input, 'region_id');

        $complexId = $this->optionalInt($input, 'complex_id');



        $stmt = $pdo->prepare(

            'UPDATE study_rooms SET

                region_id = ?,

                complex_id = ?,

                address_text = ?,

                latitude = ?,

                longitude = ?

             WHERE id = ?'

        );

        $stmt->execute([

            $regionId,

            $complexId,

            $this->optionalString($input, 'address_text'),

            $this->optionalDecimal($input, 'latitude'),

            $this->optionalDecimal($input, 'longitude'),

            $roomId,

        ]);



        $this->syncSavedRegions($pdo, $roomId, $input);

    }



    /** @param array<string, mixed> $input */

    private function saveLesson(PDO $pdo, int $roomId, array $input): void

    {

        $stmt = $pdo->prepare(

            'UPDATE study_rooms SET

                lesson_operation_type = ?,

                capacity_per_time = ?,

                recruitment_count = ?,

                main_subject_note = ?,

                teaching_style = ?,

                weekend_available = ?,

                one_on_one_available = ?,

                price_amount = ?,

                price_description = ?

             WHERE id = ?'

        );

        $stmt->execute([

            $this->requireEnum($input, 'lesson_operation_type', [

                'group_by_time_slot', 'time_slot_mixed_grade', 'individual_visit',

            ]),

            $this->requireEnum($input, 'capacity_per_time', ['one_to_four', 'five_to_eight', 'nine_plus']),

            $this->optionalInt($input, 'recruitment_count'),

            $this->requireString($input, 'main_subject_note'),

            $this->optionalString($input, 'teaching_style'),

            !empty($input['weekend_available']) ? 1 : 0,

            !empty($input['one_on_one_available']) ? 1 : 0,

            $this->requirePositiveInt($input, 'price_amount'),

            $this->optionalString($input, 'price_description'),

            $roomId,

        ]);



        $this->syncSubjects($pdo, $roomId, $input);

    }



    /** @param array<string, mixed> $input */

    private function saveCareer(PDO $pdo, int $roomId, array $input): void

    {

        $stmt = $pdo->prepare(

            'UPDATE study_rooms SET

                career_years = ?,

                academy_career_years = ?,

                franchise_flag = ?,

                franchise_name = ?,

                education_office_registered = ?,

                education_office_reg_no = ?,

                feature_1 = ?,

                feature_2 = ?,

                feature_3 = ?

             WHERE id = ?'

        );

        $stmt->execute([

            $this->optionalInt($input, 'career_years'),

            $this->optionalInt($input, 'academy_career_years'),

            !empty($input['franchise_flag']) ? 1 : 0,

            $this->optionalString($input, 'franchise_name'),

            !empty($input['education_office_registered']) ? 1 : 0,

            $this->optionalString($input, 'education_office_reg_no'),

            $this->optionalString($input, 'feature_1'),

            $this->optionalString($input, 'feature_2'),

            $this->optionalString($input, 'feature_3'),

            $roomId,

        ]);

    }



    /** @param array<string, mixed> $input */

    private function saveFacility(PDO $pdo, int $roomId, array $input): void

    {

        $profileStatus = $this->requireEnum($input, 'profile_status', ['draft', 'pending', 'published']);



        $stmt = $pdo->prepare(

            'UPDATE study_rooms SET

                facility_note = ?,

                contact_time_note = ?,

                contact_phone = ?,

                youtube_url = ?,

                facebook_url = ?,

                instagram_url = ?,

                profile_status = ?,

                published_at = CASE WHEN ? = "published" THEN COALESCE(published_at, NOW()) ELSE published_at END

             WHERE id = ?'

        );

        $stmt->execute([

            $this->optionalString($input, 'facility_note'),

            $this->optionalString($input, 'contact_time_note'),

            $this->optionalString($input, 'contact_phone'),

            $this->optionalUrl($input, 'youtube_url'),

            $this->optionalUrl($input, 'facebook_url'),

            $this->optionalUrl($input, 'instagram_url'),

            $profileStatus,

            $profileStatus,

            $roomId,

        ]);



        $this->syncFacilities($pdo, $roomId, $input);

        $this->syncImages($pdo, $roomId, $input);

    }



    /** @param array<string, mixed> $input */

    private function syncSavedRegions(PDO $pdo, int $roomId, array $input): void

    {

        $slots = $input['saved_regions'] ?? [];

        if (!is_array($slots)) {

            $slots = [];

        }



        $pdo->prepare('DELETE FROM study_room_regions WHERE study_room_id = ?')->execute([$roomId]);



        $slotNum = 1;

        $primaryAssigned = false;

        foreach ($slots as $slot) {

            if (!is_array($slot)) {

                continue;

            }

            $regionId = isset($slot['region_id']) && $slot['region_id'] !== '' ? (int) $slot['region_id'] : 0;

            if ($regionId <= 0 || $slotNum > 3) {

                continue;

            }

            $complexId = isset($slot['complex_id']) && $slot['complex_id'] !== '' ? (int) $slot['complex_id'] : null;

            $isPrimary = !empty($slot['is_primary']) ? 1 : 0;

            if ($isPrimary) {

                $primaryAssigned = true;

            }



            $pdo->prepare(

                'INSERT INTO study_room_regions (study_room_id, slot, region_id, complex_id, is_primary)

                 VALUES (?, ?, ?, ?, ?)'

            )->execute([$roomId, $slotNum, $regionId, $complexId, $isPrimary]);

            $slotNum++;

        }



        if (!$primaryAssigned && $slotNum > 1) {

            $pdo->prepare(

                'UPDATE study_room_regions SET is_primary = 1 WHERE study_room_id = ? AND slot = 1'

            )->execute([$roomId]);

        }

    }



    /** @param array<string, mixed> $input */

    private function syncSubjects(PDO $pdo, int $roomId, array $input): void

    {

        $subjects = $input['subjects'] ?? [];

        if (!is_array($subjects) || $subjects === []) {

            throw new InvalidArgumentException('subjects: 대상 과목을 1개 이상 입력해 주세요.');

        }



        $pdo->prepare('DELETE FROM study_room_subject_targets WHERE study_room_id = ?')->execute([$roomId]);



        foreach ($subjects as $sub) {

            if (!is_array($sub)) {

                continue;

            }

            $schoolLevel = $this->requireEnum($sub, 'school_level', $this->schoolLevelCodes());

            $subjectName = $this->requireString($sub, 'subject_name');

            $masterId = isset($sub['subject_master_id']) && $sub['subject_master_id'] !== ''

                ? (int) $sub['subject_master_id']

                : $this->findSubjectMasterId($pdo, $subjectName);



            $pdo->prepare(

                'INSERT INTO study_room_subject_targets

                 (study_room_id, subject_name, school_level, grade_band, subject_master_id, is_main)

                 VALUES (?, ?, ?, ?, ?, ?)'

            )->execute([

                $roomId,

                $subjectName,

                $schoolLevel,

                $this->optionalString($sub, 'grade_band'),

                $masterId,

                !empty($sub['is_main']) ? 1 : 0,

            ]);

        }

    }



    /** @param array<string, mixed> $input */

    private function syncFacilities(PDO $pdo, int $roomId, array $input): void

    {

        $ids = $input['facility_ids'] ?? [];

        if (!is_array($ids)) {

            $ids = $ids === '' || $ids === null ? [] : [$ids];

        }



        $pdo->prepare('DELETE FROM study_room_facilities WHERE study_room_id = ?')->execute([$roomId]);



        foreach ($ids as $rawId) {

            $facilityId = (int) $rawId;

            if ($facilityId <= 0) {

                continue;

            }

            $pdo->prepare(

                'INSERT INTO study_room_facilities (study_room_id, facility_id) VALUES (?, ?)'

            )->execute([$roomId, $facilityId]);

        }

    }



    /** @param array<string, mixed> $input */

    private function syncImages(PDO $pdo, int $roomId, array $input): void

    {

        $images = $input['images'] ?? [];

        if (!is_array($images) || $images === []) {

            return;

        }



        $pdo->prepare('DELETE FROM study_room_images WHERE study_room_id = ?')->execute([$roomId]);



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

            if (!in_array($type, ['cover', 'interior', 'facility', 'other'], true)) {

                $type = 'other';

            }

            $sortOrder = isset($img['sort_order']) ? (int) $img['sort_order'] : $order;



            $pdo->prepare(

                'INSERT INTO study_room_images (study_room_id, image_type, image_path, sort_order)

                 VALUES (?, ?, ?, ?)'

            )->execute([$roomId, $type, $path, $sortOrder]);

            $order++;

        }

    }



    private function refreshDetailStatus(PDO $pdo, int $roomId, string $step): void

    {

        $stmt = $pdo->prepare('SELECT detail_completion_status FROM study_rooms WHERE id = ?');

        $stmt->execute([$roomId]);

        $current = (string) ($stmt->fetchColumn() ?: 'basic_only');



        $next = $current;

        if ($step === 'location' && $current === 'basic_only') {

            $next = 'basic_only';

        } elseif (in_array($step, ['lesson', 'career'], true)) {

            if ($current !== 'expanded_complete') {

                $next = 'expanded_in_progress';

            }

        } elseif ($step === 'facility') {

            $next = 'expanded_complete';

        }



        if ($next !== $current) {

            $pdo->prepare('UPDATE study_rooms SET detail_completion_status = ? WHERE id = ?')

                ->execute([$next, $roomId]);

        }

    }



    /** @param array<string, mixed> $row */

    private function hydrateRoom(int $roomId, array $row): array

    {

        $pdo = Connection::get();



        $regionStmt = $pdo->prepare(

            'SELECT slot, region_id, complex_id, is_primary

             FROM study_room_regions WHERE study_room_id = ? ORDER BY slot ASC'

        );

        $regionStmt->execute([$roomId]);

        $savedRegions = [];

        foreach ($regionStmt->fetchAll(PDO::FETCH_ASSOC) as $r) {

            $savedRegions[] = [

                'region_id'   => (string) $r['region_id'],

                'complex_id'  => $r['complex_id'] !== null ? (string) $r['complex_id'] : '',

                'is_primary'  => (bool) $r['is_primary'],

            ];

        }

        while (count($savedRegions) < 3) {

            $savedRegions[] = ['region_id' => '', 'complex_id' => '', 'is_primary' => false];

        }



        $subjectStmt = $pdo->prepare(

            'SELECT school_level, grade_band, subject_master_id, subject_name, is_main

             FROM study_room_subject_targets WHERE study_room_id = ? ORDER BY is_main DESC, id ASC'

        );

        $subjectStmt->execute([$roomId]);

        $subjects = [];

        foreach ($subjectStmt->fetchAll(PDO::FETCH_ASSOC) as $s) {

            $subjects[] = [

                'school_level'      => (string) $s['school_level'],

                'grade_band'        => (string) ($s['grade_band'] ?? ''),

                'subject_master_id' => $s['subject_master_id'] !== null ? (string) $s['subject_master_id'] : '',

                'subject_name'      => (string) $s['subject_name'],

                'is_main'           => (bool) $s['is_main'],

            ];

        }



        $facilityStmt = $pdo->prepare(

            'SELECT facility_id FROM study_room_facilities WHERE study_room_id = ?'

        );

        $facilityStmt->execute([$roomId]);

        $facilityIds = array_map('intval', $facilityStmt->fetchAll(PDO::FETCH_COLUMN));



        $imageStmt = $pdo->prepare(

            'SELECT image_type, image_path, sort_order FROM study_room_images

             WHERE study_room_id = ? ORDER BY sort_order ASC, id ASC'

        );

        $imageStmt->execute([$roomId]);

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

            'study_room_id'            => $roomId,

            'gender'                   => \Study114\Auth\ProfileGenderSync::get((int) $row['user_id']) ?? 'male',

            'study_room_name'          => (string) ($row['study_room_name'] ?? ''),

            'slogan'                   => (string) ($row['slogan'] ?? ''),

            'operator_display_name'    => (string) ($row['operator_display_name'] ?? ''),

            'intro_short'              => (string) ($row['intro_short'] ?? ''),

            'intro_long'               => (string) ($row['intro_long'] ?? ''),

            'lesson_place_type'        => (string) ($row['lesson_place_type'] ?? 'study_room'),

            'lesson_operation_type'    => (string) ($row['lesson_operation_type'] ?? 'group_by_time_slot'),

            'region_id'                => $row['region_id'] !== null ? (string) $row['region_id'] : '',

            'complex_id'               => $row['complex_id'] !== null ? (string) $row['complex_id'] : '',

            'address_text'             => (string) ($row['address_text'] ?? ''),

            'latitude'                 => $row['latitude'] !== null ? (string) $row['latitude'] : '',

            'longitude'                => $row['longitude'] !== null ? (string) $row['longitude'] : '',

            'saved_regions'            => $savedRegions,

            'capacity_per_time'        => (string) ($row['capacity_per_time'] ?? 'one_to_four'),

            'recruitment_count'        => $row['recruitment_count'] !== null ? (string) $row['recruitment_count'] : '',

            'main_subject_note'        => (string) ($row['main_subject_note'] ?? ''),

            'teaching_style'           => (string) ($row['teaching_style'] ?? ''),

            'weekend_available'        => (bool) ($row['weekend_available'] ?? false),

            'one_on_one_available'     => (bool) ($row['one_on_one_available'] ?? false),

            'price_amount'             => $row['price_amount'] !== null ? (string) $row['price_amount'] : '',

            'price_description'        => (string) ($row['price_description'] ?? ''),

            'subjects'                 => $subjects !== [] ? $subjects : [],

            'career_years'             => $row['career_years'] !== null ? (string) $row['career_years'] : '',

            'academy_career_years'     => $row['academy_career_years'] !== null ? (string) $row['academy_career_years'] : '',

            'franchise_flag'           => (bool) ($row['franchise_flag'] ?? false),

            'franchise_name'           => (string) ($row['franchise_name'] ?? ''),

            'education_office_registered' => (bool) ($row['education_office_registered'] ?? false),

            'education_office_reg_no'  => (string) ($row['education_office_reg_no'] ?? ''),

            'feature_1'                => (string) ($row['feature_1'] ?? ''),

            'feature_2'                => (string) ($row['feature_2'] ?? ''),

            'feature_3'                => (string) ($row['feature_3'] ?? ''),

            'facility_ids'             => $facilityIds,

            'facility_note'            => (string) ($row['facility_note'] ?? ''),

            'contact_time_note'        => (string) ($row['contact_time_note'] ?? ''),

            'contact_phone'            => (string) ($row['contact_phone'] ?? ''),

            'youtube_url'              => (string) ($row['youtube_url'] ?? ''),

            'facebook_url'             => (string) ($row['facebook_url'] ?? ''),

            'instagram_url'            => (string) ($row['instagram_url'] ?? ''),

            'images'                   => $images,

            'profile_status'           => (string) ($row['profile_status'] ?? 'draft'),

            'detail_completion_status' => (string) ($row['detail_completion_status'] ?? 'basic_only'),

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



    /**

     * @param list<array<string, mixed>> $rows

     * @param list<string> $intKeys

     * @return list<array<string, mixed>>

     */

    private function intIdRows(array $rows, array $intKeys = []): array

    {

        $out = [];

        foreach ($rows as $row) {

            $row['id'] = (int) $row['id'];

            foreach ($intKeys as $key) {

                if (isset($row[$key])) {

                    $row[$key] = (int) $row[$key];

                }

            }

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

    private function optionalUrl(array $input, string $key): ?string

    {

        $val = $this->optionalString($input, $key);

        if ($val === null) {

            return null;

        }

        if (!filter_var($val, FILTER_VALIDATE_URL)) {

            throw new InvalidArgumentException("{$key}: URL 형식이 올바르지 않습니다.");

        }

        $scheme = parse_url($val, PHP_URL_SCHEME);

        if (!in_array($scheme, ['http', 'https'], true)) {

            throw new InvalidArgumentException("{$key}: http/https만 허용됩니다.");

        }

        return $val;

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



    /** @param array<string, mixed> $input */

    private function optionalDecimal(array $input, string $key): ?string

    {

        if (!isset($input[$key]) || trim((string) $input[$key]) === '') {

            return null;

        }

        return trim((string) $input[$key]);

    }

}

