<?php



declare(strict_types=1);



namespace Study114\StudyRoom;



use InvalidArgumentException;

use PDO;

use PDOException;

use RuntimeException;

use Study114\Database\Connection;
use Study114\Region\AddressRegionMatch;
use Study114\Region\ComplexEnsure;
use Study114\Region\RegionEnsure;
use Study114\Region\SidoRegionEnsure;



final class StudyRoomRegisterService

{

    /** @return array{regions: list<array{id: int, label: string}>, complexes: list<array{id: int, region_id: int, label: string}>, facilities: list<array{id: int, facility_code: string, facility_name: string}>, subjects: list<array{id: int, value: string, label: string}>} */

    public function getMasters(): array

    {

        $pdo = Connection::get();
        $cities = SidoRegionEnsure::ensureAndListCities($pdo);
        $regions = [];
        $complexes = [];
        $facilities = [];
        try {
            $regions = $pdo->query(
                'SELECT id, sido_name, sigungu_name, dong_name,
                        CONCAT(sido_name, " ", sigungu_name, " ", dong_name) AS label
                 FROM regions
                 WHERE is_active = 1 AND dong_name <> \'시 대표\'
                 ORDER BY id ASC'
            )->fetchAll(PDO::FETCH_ASSOC);
        } catch (\Throwable $e) {
            error_log('[study-room masters] regions: ' . $e->getMessage());
        }
        try {
            $complexes = $pdo->query(
                'SELECT id, region_id, name AS label, COALESCE(address, "") AS address
                 FROM complexes WHERE is_active = 1 ORDER BY region_id ASC, id ASC'
            )->fetchAll(PDO::FETCH_ASSOC);
        } catch (\Throwable $e) {
            error_log('[study-room masters] complexes: ' . $e->getMessage());
        }
        try {
            FacilityMastersEnsure::ensure($pdo);
            $facilities = $pdo->query(
                'SELECT id, facility_code, facility_name
                 FROM facility_masters WHERE is_active = 1 ORDER BY sort_order ASC, id ASC'
            )->fetchAll(PDO::FETCH_ASSOC);
        } catch (\Throwable $e) {
            error_log('[study-room masters] facilities: ' . $e->getMessage());
        }

        return [
            'regions'    => $this->intIdRows($regions),
            'cities'     => $cities,
            'complexes'  => $this->intIdRows($complexes, ['region_id']),
            'facilities' => $this->intIdRows($facilities),
            'subjects'   => (new StudyRoomLessonDetailStore())->subjectMasters($pdo),
        ];

    }



    /** @return array<string, mixed>|null */

    public function loadForUser(int $userId, ?int $roomId = null): ?array

    {

        $pdo = Connection::get();

        if ($roomId !== null && $roomId > 0) {
            $stmt = $pdo->prepare(
                'SELECT * FROM study_rooms
                 WHERE id = ? AND user_id = ? AND deleted_at IS NULL
                 LIMIT 1'
            );
            $stmt->execute([$roomId, $userId]);
        } else {
            $stmt = $pdo->prepare(
                'SELECT * FROM study_rooms
                 WHERE user_id = ? AND deleted_at IS NULL
                 ORDER BY updated_at DESC, id DESC
                 LIMIT 1'
            );
            $stmt->execute([$userId]);
        }

        /** @var array<string, mixed>|false $row */

        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($row === false) {

            return null;

        }



        return $this->hydrateRoom((int) $row['id'], $row);

    }

    private function findLatestRoomId(PDO $pdo, int $userId): ?int
    {
        $stmt = $pdo->prepare(
            'SELECT id FROM study_rooms
             WHERE user_id = ? AND deleted_at IS NULL
             ORDER BY updated_at DESC, id DESC
             LIMIT 1'
        );
        $stmt->execute([$userId]);
        $id = $stmt->fetchColumn();
        return $id === false ? null : (int) $id;
    }



    /**

     * @param array<string, mixed> $input

     * @return array{study_room_id: int, detail_completion_status: string, profile_status: string}

     */

    public function saveStep(int $userId, ?int $roomId, string $step, array $input): array

    {

        $allowedSteps = ['basic', 'basic_all', 'location', 'lesson', 'career', 'facility'];

        if (!in_array($step, $allowedSteps, true)) {

            throw new InvalidArgumentException('step: 유효하지 않은 단계입니다.');

        }



        $this->assertStudyRoomOwner($userId);

        $pdo = Connection::get();

        if ($step === 'lesson') {
            (new StudyRoomLessonDetailStore())->ensureSchema($pdo);
        }
        if ($step === 'basic' || $step === 'basic_all' || $step === 'location') {
            $this->ensureBusinessAddressLine2($pdo);
        }

        $pdo->beginTransaction();

        try {

            if ($roomId === null) {
                $roomId = $this->findLatestRoomId($pdo, $userId);
            }

            if ($roomId === null) {

                if ($step !== 'basic' && $step !== 'basic_all') {

                    throw new InvalidArgumentException('study_room_id: 먼저 기본정보를 저장해 주세요.');

                }

                $roomId = $this->insertDraft($pdo, $userId, $input);

            } else {

                $this->assertOwnership($pdo, $userId, $roomId);

            }



            match ($step) {

                'basic'     => $this->saveBasic($pdo, $roomId, $input),

                'basic_all' => $this->saveBasicAndLocation($pdo, $userId, $roomId, $input),

                'location'  => $this->saveLocation($pdo, $userId, $roomId, $input),

                'lesson'    => $this->saveLesson($pdo, $roomId, $input),

                'career'    => $this->saveCareer($pdo, $roomId, $input),

                'facility'  => $this->saveFacility($pdo, $roomId, $input),

            };

            if ($step === 'basic' || $step === 'basic_all') {
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

            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }

            throw new RuntimeException('공부방 등록 저장 실패: ' . $e->getMessage(), 0, $e);

        } catch (\Throwable $e) {

            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }

            throw $e;

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
    private function saveBasicAndLocation(PDO $pdo, int $userId, int $roomId, array $input): void
    {
        $this->saveBasic($pdo, $roomId, $input);
        $this->saveLocation($pdo, $userId, $roomId, $input);
    }

    /** @param array<string, mixed> $input */
    private function saveBasic(PDO $pdo, int $roomId, array $input): void

    {

        $stmt = $pdo->prepare(

            'UPDATE study_rooms SET

                study_room_name = ?,

                main_subject_note = COALESCE(?, main_subject_note),

                slogan = ?,

                operator_display_name = ?,

                intro_short = ?,

                intro_long = ?,

                lesson_place_type = ?

             WHERE id = ?'

        );

        $mainSubject = isset($input['main_subject_note']) && (string) $input['main_subject_note'] !== ''
            ? $this->requireString($input, 'main_subject_note')
            : null;

        $stmt->execute([

            $this->requireString($input, 'study_room_name'),

            $mainSubject,

            $this->optionalString($input, 'slogan'),

            $this->optionalString($input, 'operator_display_name'),

            $this->optionalString($input, 'intro_short'),

            $this->optionalString($input, 'intro_long'),

            $this->requireEnum($input, 'lesson_place_type', ['academy', 'study_room']),

            $roomId,

        ]);

    }



    /** @param array<string, mixed> $input */

    private function saveLocation(PDO $pdo, int $userId, int $roomId, array $input): void
    {
        $addressText = trim((string) ($input['address_text'] ?? ''));
        if ($addressText === '') {
            throw new InvalidArgumentException('사업장주소를 검색해 주세요.');
        }
        $regionId = $this->resolveBusinessRegionId($pdo, $input);
        $basis = $this->optionalEnum($input, 'region_basis_type', ['dong', 'complex'])
            ?? $this->optionalEnum($input, 'region_basis', ['dong', 'complex']);
        $complexId = $this->resolveComplexId($pdo, $input, $regionId, $addressText);

        if ($basis === 'dong') {
            $complexId = null;
        } elseif ($basis === 'complex') {
            if ($complexId === null || $complexId <= 0) {
                $basis = 'dong';
                $complexId = null;
            }
        } else {
            $basis = ($complexId !== null && $complexId > 0) ? 'complex' : 'dong';
            if ($basis === 'dong') {
                $complexId = null;
            }
        }

        $stmt = $pdo->prepare(
            'UPDATE study_rooms SET
                region_id = ?,
                complex_id = ?,
                region_basis_type = ?,
                address_text = ?,
                latitude = ?,
                longitude = ?
             WHERE id = ?'
        );

        try {
            $stmt->execute([
                $regionId,
                $complexId,
                $basis,
                $addressText,
                $this->optionalDecimal($input, 'latitude'),
                $this->optionalDecimal($input, 'longitude'),
                $roomId,
            ]);
        } catch (PDOException $e) {
            $stmt = $pdo->prepare(
                'UPDATE study_rooms SET
                    region_id = ?, complex_id = ?, address_text = ?, latitude = ?, longitude = ?
                 WHERE id = ?'
            );
            $stmt->execute([
                $regionId,
                $complexId,
                $addressText,
                $this->optionalDecimal($input, 'latitude'),
                $this->optionalDecimal($input, 'longitude'),
                $roomId,
            ]);
        }

        if (!isset($input['region_basis_type'])) {
            $input['region_basis_type'] = $basis;
        }
        $this->syncSavedRegions($pdo, $roomId, $input);
        $this->saveHomeAddress($pdo, $userId, $input);
        $this->saveBusinessAddressLine2($pdo, $roomId, $input);
    }

    /** @param array<string, mixed> $input */
    private function resolveBusinessRegionId(PDO $pdo, array $input): int
    {
        $regionId = $this->optionalInt($input, 'region_id');
        if ($regionId !== null && $regionId > 0) {
            $stmt = $pdo->prepare('SELECT id FROM regions WHERE id = ? AND is_active = 1');
            $stmt->execute([$regionId]);
            if ($stmt->fetchColumn()) {
                return $regionId;
            }
        }

        $matched = AddressRegionMatch::match(
            $pdo,
            (string) ($input['address_sido'] ?? ''),
            (string) ($input['address_sigungu'] ?? ''),
            (string) ($input['address_bname'] ?? $input['address_hname'] ?? '')
        );
        if ($matched !== null) {
            return $matched;
        }

        return (int) RegionEnsure::fromKakao($pdo, $input)['id'];
    }

    /** @param array<string, mixed> $input */
    private function resolveComplexId(PDO $pdo, array $input, int $regionId, ?string $address): ?int
    {
        $complexId = $this->optionalInt($input, 'complex_id');
        if ($complexId !== null && $complexId > 0) {
            return $complexId;
        }
        $name = $this->optionalString($input, 'complex_name');
        if ($name === null) {
            return null;
        }
        $addr = $this->optionalString($input, 'complex_address') ?? $address;

        return ComplexEnsure::ensure($pdo, $regionId, $name, $addr);
    }

    /** @param array<string, mixed> $input */
    private function saveHomeAddress(PDO $pdo, int $userId, array $input): void
    {
        if (!array_key_exists('home_address', $input) && !array_key_exists('home_address_zip', $input)
            && !array_key_exists('home_address_line2', $input)) {
            return;
        }
        $line1 = $this->optionalString($input, 'home_address');
        $zip = $this->optionalString($input, 'home_address_zip');
        $line2 = $this->optionalString($input, 'home_address_line2');
        try {
            $pdo->prepare(
                'UPDATE user_profiles SET address_line1 = ?, address_zip = ?, address_line2 = ? WHERE user_id = ?'
            )->execute([$line1, $zip, $line2, $userId]);
        } catch (PDOException $e) {
            $pdo->prepare(
                'UPDATE user_profiles SET address_line1 = ?, address_zip = ? WHERE user_id = ?'
            )->execute([$line1, $zip, $userId]);
        }
    }

    /** @param array<string, mixed> $input */
    private function saveBusinessAddressLine2(PDO $pdo, int $roomId, array $input): void
    {
        if (!array_key_exists('address_line2', $input)) {
            return;
        }
        $line2 = $this->optionalString($input, 'address_line2');
        try {
            $pdo->prepare('UPDATE study_rooms SET address_line2 = ? WHERE id = ?')->execute([$line2, $roomId]);
        } catch (PDOException $e) {
            /* 컬럼 미적용 */
        }
    }

    private function ensureBusinessAddressLine2(PDO $pdo): void
    {
        static $done = false;
        if ($done) {
            return;
        }
        try {
            $chk = $pdo->query("SHOW COLUMNS FROM study_rooms LIKE 'address_line2'");
            if ($chk && $chk->fetch()) {
                $done = true;
                return;
            }
        } catch (PDOException $e) {
            /* SHOW 실패 시 ALTER를 시도하지 않고 넘어간다 */
            $done = true;
            return;
        }
        try {
            $pdo->exec(
                'ALTER TABLE study_rooms ADD COLUMN address_line2 VARCHAR(255) NULL COMMENT \'사업장 상세주소\' AFTER address_text'
            );
        } catch (PDOException $e) {
            /* already exists */
        }
        $done = true;
    }



    /** @param array<string, mixed> $input */

    private function saveLesson(PDO $pdo, int $roomId, array $input): void

    {

        $extra = $this->normalizeLessonExtra($input);
        $store = new StudyRoomLessonDetailStore();
        $schemaOk = $store->ensureSchema($pdo);
        $priceAmount = $this->priceAmountFromLesson($input, $extra);
        $weekend = !empty($input['weekend_available']) || $this->lessonExtraHasWeekend($extra);
        $teachingStyle = $this->teachingStyleFromLesson($input, $extra);
        $readableDesc = $this->composePriceDescriptionText($extra);
        $encodedFallback = $this->encodeLessonExtra($extra);

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

            $teachingStyle,

            $weekend ? 1 : 0,

            !empty($input['one_on_one_available']) ? 1 : 0,

            $priceAmount,

            $schemaOk ? ($readableDesc !== '' ? $readableDesc : null) : $encodedFallback,

            $roomId,

        ]);

        if ($schemaOk) {
            $store->save($pdo, $roomId, $extra);
        }



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

                youtube_url = ?,

                facebook_url = ?,

                instagram_url = ?,

                profile_status = ?,

                published_at = CASE WHEN ? = "published" THEN COALESCE(published_at, NOW()) ELSE published_at END

             WHERE id = ?'

        );

        $stmt->execute([

            $this->optionalString($input, 'facility_note'),

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

        $inserted = 0;
        $primaryAssigned = false;

        foreach (array_values($slots) as $idx => $slot) {
            $slotNum = $idx + 1;
            if ($slotNum > 3) {
                break;
            }
            if (!is_array($slot)) {
                continue;
            }

            $regionId = isset($slot['region_id']) && $slot['region_id'] !== '' ? (int) $slot['region_id'] : 0;
            $complexId = isset($slot['complex_id']) && $slot['complex_id'] !== '' ? (int) $slot['complex_id'] : null;
            $slotBasis = isset($slot['region_basis_type']) && in_array($slot['region_basis_type'], ['dong', 'complex'], true)
                ? $slot['region_basis_type']
                : null;
            if ($slotBasis === null) {
                $slotBasis = isset($input['region_basis_type']) && in_array($input['region_basis_type'], ['dong', 'complex'], true)
                    ? $input['region_basis_type']
                    : (($complexId !== null && $complexId > 0) ? 'complex' : 'dong');
            }
            if ($regionId <= 0) {
                $matched = AddressRegionMatch::match(
                    $pdo,
                    (string) ($slot['address_sido'] ?? $input['address_sido'] ?? ''),
                    (string) ($slot['address_sigungu'] ?? $input['address_sigungu'] ?? ''),
                    (string) ($slot['address_bname'] ?? $slot['address_hname'] ?? $slot['region_label'] ?? '')
                );
                if ($matched !== null) {
                    $regionId = $matched;
                } else {
                    try {
                        $payload = $input;
                        foreach ($slot as $key => $value) {
                            if ($value !== '' && $value !== null) {
                                $payload[$key] = $value;
                            }
                        }
                        $regionId = (int) RegionEnsure::fromKakao($pdo, $payload)['id'];
                    } catch (InvalidArgumentException $e) {
                        $regionId = 0;
                    }
                }
            }
            if ($slotBasis === 'complex' && $regionId > 0 && ($complexId === null || $complexId <= 0)) {
                $cname = trim((string) ($slot['complex_name'] ?? ''));
                $caddr = trim((string) ($slot['complex_address'] ?? $slot['address_text'] ?? ''));
                if ($cname === '') {
                    $cname = $caddr;
                }
                if ($cname !== '') {
                    $complexId = ComplexEnsure::ensure($pdo, $regionId, $cname, $caddr !== '' ? $caddr : null);
                }
            }
            if ($slotBasis === 'dong') {
                $complexId = null;
            }

            $filled = $regionId > 0 && ($slotBasis !== 'complex' || ($complexId !== null && $complexId > 0));
            if (!$filled) {
                continue;
            }

            $isPrimary = !empty($slot['is_primary']) ? 1 : 0;
            if ($isPrimary) {
                if ($primaryAssigned) {
                    $isPrimary = 0;
                } else {
                    $primaryAssigned = true;
                }
            }

            try {
                $pdo->prepare(
                    'INSERT INTO study_room_regions (study_room_id, slot, region_id, complex_id, region_basis_type, is_primary)
                     VALUES (?, ?, ?, ?, ?, ?)'
                )->execute([$roomId, $slotNum, $regionId, $complexId, $slotBasis, $isPrimary]);
            } catch (PDOException $e) {
                $pdo->prepare(
                    'INSERT INTO study_room_regions (study_room_id, slot, region_id, complex_id, is_primary)
                     VALUES (?, ?, ?, ?, ?)'
                )->execute([$roomId, $slotNum, $regionId, $complexId, $isPrimary]);
            }

            $inserted++;
        }

        if ($inserted < 1) {
            throw new InvalidArgumentException('홍보지역을 1곳 이상 선택해 주세요.');
        }

        if (!$primaryAssigned) {
            $minStmt = $pdo->prepare(
                'SELECT MIN(slot) FROM study_room_regions WHERE study_room_id = ?'
            );
            $minStmt->execute([$roomId]);
            $minSlot = $minStmt->fetchColumn();
            if ($minSlot !== false && $minSlot !== null) {
                $pdo->prepare(
                    'UPDATE study_room_regions SET is_primary = 1 WHERE study_room_id = ? AND slot = ?'
                )->execute([$roomId, (int) $minSlot]);
            }
        }

    }



    /** @param array<string, mixed> $input */

    private function syncSubjects(PDO $pdo, int $roomId, array $input): void

    {

        $subjects = $input['subjects'] ?? [];

        if (!is_array($subjects)) {
            $subjects = [];
        }

        $filled = [];
        foreach ($subjects as $sub) {
            if (!is_array($sub)) {
                continue;
            }
            $name = trim((string) ($sub['subject_name'] ?? ''));
            if ($name === '') {
                continue;
            }
            $filled[] = $sub;
        }

        if ($filled === []) {

            throw new InvalidArgumentException('subjects: 대상 과목을 1개 이상 입력해 주세요.');

        }



        $pdo->prepare('DELETE FROM study_room_subject_targets WHERE study_room_id = ?')->execute([$roomId]);



        foreach ($filled as $sub) {

            $schoolLevel = trim((string) ($sub['school_level'] ?? ''));
            if ($schoolLevel === '') {
                throw new InvalidArgumentException('school_level: 학교급을 선택해 주세요.');
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



        $order = 1;

        foreach ($images as $img) {

            if (!is_array($img) || $order > 5) {

                continue;

            }

            $id = isset($img['id']) ? (int) $img['id'] : 0;

            $type = (string) ($img['image_type'] ?? 'other');

            if (!in_array($type, ['cover', 'interior', 'facility', 'other'], true)) {

                $type = 'other';

            }

            if ($id > 0) {

                $pdo->prepare(

                    'UPDATE study_room_images SET image_type = ? WHERE id = ? AND study_room_id = ?'

                )->execute([$type, $id, $roomId]);

            }

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



        $emptySlot = static function (): array {
            return [
                'region_id' => '',
                'complex_id' => '',
                'region_basis_type' => 'dong',
                'is_primary' => false,
                'region_label' => '',
                'complex_name' => '',
                'complex_address' => '',
                'address_text' => '',
            ];
        };
        $savedRegions = [$emptySlot(), $emptySlot(), $emptySlot()];
        $placeSlot = static function (array $r, string $basis) use (&$savedRegions): void {
            $slot = (int) ($r['slot'] ?? 0);
            if ($slot < 1 || $slot > 3) {
                return;
            }
            $savedRegions[$slot - 1] = [
                'region_id' => (string) $r['region_id'],
                'complex_id' => $r['complex_id'] !== null && $r['complex_id'] !== '' ? (string) $r['complex_id'] : '',
                'region_basis_type' => $basis,
                'is_primary' => (bool) $r['is_primary'],
                'region_label' => (string) ($r['region_label'] ?? ''),
                'complex_name' => (string) ($r['complex_name'] ?? ''),
                'complex_address' => (string) ($r['complex_address'] ?? ''),
                'address_text' => (string) ($r['complex_address'] ?? ''),
            ];
        };
        try {
            $regionStmt = $pdo->prepare(
                'SELECT srr.slot, srr.region_id, srr.complex_id, srr.region_basis_type, srr.is_primary,
                        CONCAT(r.sido_name, " ", r.sigungu_name, " ", r.dong_name) AS region_label,
                        c.name AS complex_name, COALESCE(c.address, "") AS complex_address
                 FROM study_room_regions srr
                 LEFT JOIN regions r ON r.id = srr.region_id
                 LEFT JOIN complexes c ON c.id = srr.complex_id
                 WHERE srr.study_room_id = ? ORDER BY srr.slot ASC'
            );
            $regionStmt->execute([$roomId]);
            foreach ($regionStmt->fetchAll(PDO::FETCH_ASSOC) as $r) {
                $basis = isset($r['region_basis_type']) && in_array($r['region_basis_type'], ['dong', 'complex'], true)
                    ? $r['region_basis_type']
                    : (($r['complex_id'] !== null && $r['complex_id'] !== '') ? 'complex' : 'dong');
                $placeSlot($r, $basis);
            }
        } catch (PDOException $e) {
            $regionStmt = $pdo->prepare(
                'SELECT slot, region_id, complex_id, is_primary
                 FROM study_room_regions WHERE study_room_id = ? ORDER BY slot ASC'
            );
            $regionStmt->execute([$roomId]);
            foreach ($regionStmt->fetchAll(PDO::FETCH_ASSOC) as $r) {
                $basis = ($r['complex_id'] !== null && $r['complex_id'] !== '') ? 'complex' : 'dong';
                $placeSlot($r, $basis);
            }
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



        try {

            (new \Study114\Media\PromoImageService())->ensureColumns($pdo);

        } catch (\Throwable $e) {

            error_log('[study-room images] ensure: ' . $e->getMessage());

        }



        $imageStmt = $pdo->prepare(

            'SELECT id, image_type, image_path, sort_order, original_filename,

                    original_path, prime_1280_path, prime_1600_path, basic_360_path, basic_720_path

               FROM study_room_images

             WHERE study_room_id = ? ORDER BY sort_order ASC, id ASC'

        );

        $imageStmt->execute([$roomId]);

        $images = [];

        foreach ($imageStmt->fetchAll(PDO::FETCH_ASSOC) as $img) {

            $images[] = [

                'id' => (int) ($img['id'] ?? 0),

                'image_type' => (string) $img['image_type'],

                'sort_order' => (int) $img['sort_order'],

                'name'       => (string) ($img['original_filename'] ?? $img['image_path'] ?? ''),

                'original_filename' => (string) ($img['original_filename'] ?? ''),

                'image_path' => (string) $img['image_path'],

                'original_path' => (string) ($img['original_path'] ?? ''),

                'prime_1280_path' => (string) ($img['prime_1280_path'] ?? ''),

                'prime_1600_path' => (string) ($img['prime_1600_path'] ?? ''),

                'basic_360_path' => (string) ($img['basic_360_path'] ?? ''),

                'basic_720_path' => (string) ($img['basic_720_path'] ?? ''),

            ];

        }



        $homeAddress = '';
        $homeZip = '';
        $homeLine2 = '';
        try {
            $homeStmt = $pdo->prepare(
                'SELECT address_line1, address_zip, address_line2 FROM user_profiles WHERE user_id = ? LIMIT 1'
            );
            $homeStmt->execute([(int) $row['user_id']]);
            $home = $homeStmt->fetch(PDO::FETCH_ASSOC);
            if (is_array($home)) {
                $homeAddress = (string) ($home['address_line1'] ?? '');
                $homeZip = (string) ($home['address_zip'] ?? '');
                $homeLine2 = (string) ($home['address_line2'] ?? '');
            }
        } catch (PDOException $e) {
            /* 프로필 주소 컬럼 없으면 빈 값 */
        }

        $room = [

            'study_room_id'            => $roomId,

            'gender'                   => \Study114\Auth\ProfileGenderSync::get((int) $row['user_id']) ?? '',

            'home_address'             => $homeAddress,
            'home_address_zip'         => $homeZip,
            'home_address_line2'       => $homeLine2,

            'study_room_name'          => (string) ($row['study_room_name'] ?? ''),

            'slogan'                   => (string) ($row['slogan'] ?? ''),

            'operator_display_name'    => (string) ($row['operator_display_name'] ?? ''),

            'intro_short'              => (string) ($row['intro_short'] ?? ''),

            'intro_long'               => (string) ($row['intro_long'] ?? ''),

            'lesson_place_type'        => (string) ($row['lesson_place_type'] ?? ''),

            'lesson_operation_type'    => (string) ($row['lesson_operation_type'] ?? ''),

            'region_id'                => $row['region_id'] !== null ? (string) $row['region_id'] : '',

            'complex_id'               => $row['complex_id'] !== null ? (string) $row['complex_id'] : '',

            'region_basis_type'        => isset($row['region_basis_type']) && in_array($row['region_basis_type'], ['dong', 'complex'], true)
                ? (string) $row['region_basis_type']
                : (($row['complex_id'] ?? null) !== null ? 'complex' : 'dong'),

            'address_text'             => (string) ($row['address_text'] ?? ''),
            'address_line2'            => (string) ($row['address_line2'] ?? ''),

            'latitude'                 => $row['latitude'] !== null ? (string) $row['latitude'] : '',

            'longitude'                => $row['longitude'] !== null ? (string) $row['longitude'] : '',

            'saved_regions'            => $savedRegions,

            'capacity_per_time'        => (string) ($row['capacity_per_time'] ?? ''),

            'recruitment_count'        => $row['recruitment_count'] !== null ? (string) $row['recruitment_count'] : '',

            'main_subject_note'        => (string) ($row['main_subject_note'] ?? ''),

            'teaching_style'           => (string) ($row['teaching_style'] ?? ''),

            'weekend_available'        => $row['weekend_available'] === null ? null : (bool) $row['weekend_available'],

            'one_on_one_available'     => $row['one_on_one_available'] === null ? null : (bool) $row['one_on_one_available'],

            'price_amount'             => $row['price_amount'] !== null ? (string) $row['price_amount'] : '',

            'price_description'        => (string) ($row['price_description'] ?? ''),

            'subjects'                 => $subjects !== [] ? $subjects : [],

            'career_years'             => $row['career_years'] !== null ? (string) $row['career_years'] : '',

            'academy_career_years'     => $row['academy_career_years'] !== null ? (string) $row['academy_career_years'] : '',

            'franchise_flag'           => $row['franchise_flag'] === null ? null : (bool) $row['franchise_flag'],

            'franchise_name'           => (string) ($row['franchise_name'] ?? ''),

            'education_office_registered' => $row['education_office_registered'] === null ? null : (bool) $row['education_office_registered'],

            'education_office_reg_no'  => (string) ($row['education_office_reg_no'] ?? ''),

            'feature_1'                => (string) ($row['feature_1'] ?? ''),

            'feature_2'                => (string) ($row['feature_2'] ?? ''),

            'feature_3'                => (string) ($row['feature_3'] ?? ''),

            'facility_ids'             => $facilityIds,

            'facility_note'            => (string) ($row['facility_note'] ?? ''),

            'contact_time_note'        => '',

            'contact_phone'            => '',

            'youtube_url'              => (string) ($row['youtube_url'] ?? ''),

            'facebook_url'             => (string) ($row['facebook_url'] ?? ''),

            'instagram_url'            => (string) ($row['instagram_url'] ?? ''),

            'images'                   => $images,

            'profile_status'           => (string) ($row['profile_status'] ?? 'draft'),

            'detail_completion_status' => (string) ($row['detail_completion_status'] ?? 'basic_only'),

        ];

        return $this->withLessonExtra($room, $row);

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

    /**
     * @param array<string, mixed> $room
     * @param array<string, mixed> $row
     * @return array<string, mixed>
     */
    private function withLessonExtra(array $room, array $row): array
    {
        $store = new StudyRoomLessonDetailStore();
        $pdo = Connection::get();
        $extra = $store->load($pdo, (int) $room['study_room_id'], $row);
        if (($extra['_s114'] ?? '') !== StudyRoomLessonDetailStore::EXTRA_MARK
            && empty($extra['price_items'])
            && empty($extra['attendance_days'])
            && empty($extra['teaching_style_ids'])) {
            $decoded = $this->decodeLessonExtra((string) ($row['price_description'] ?? ''));
            if ($decoded !== null) {
                $extra = $decoded;
            }
        }

        $priceItems = [];
        foreach (($extra['price_items'] ?? []) as $itemRow) {
            if (!is_array($itemRow)) {
                continue;
            }
            $priceItems[] = [
                'item' => (string) ($itemRow['item'] ?? ''),
                'fee' => (string) ($itemRow['fee'] ?? ''),
                'note' => (string) ($itemRow['note'] ?? ''),
            ];
        }

        $lines = [];
        foreach ($priceItems as $itemRow) {
            $parts = array_values(array_filter([
                trim($itemRow['item']),
                trim($itemRow['fee']),
                trim($itemRow['note']),
            ], static fn ($v) => $v !== ''));
            $line = implode(' · ', $parts);
            if ($line !== '') {
                $lines[] = $line;
            }
        }

        $days = is_array($extra['attendance_days'] ?? null) ? $extra['attendance_days'] : [];
        $styleIds = is_array($extra['teaching_style_ids'] ?? null) ? $extra['teaching_style_ids'] : [];

        $room['attendance_days'] = array_values(array_map('strval', $days));
        $room['lessons_per_week'] = (string) ($extra['lessons_per_week'] ?? '');
        $room['minutes_per_lesson'] = (string) ($extra['minutes_per_lesson'] ?? '');
        $room['lesson_note'] = (string) ($extra['lesson_note'] ?? '');
        $room['teaching_style_ids'] = array_values(array_map('strval', $styleIds));
        $room['teaching_style_note'] = (string) ($extra['teaching_style_note'] ?? '');
        $room['price_items'] = $priceItems;
        $room['lesson_extra'] = $extra;
        if ($lines !== []) {
            $room['price_description'] = implode("\n", $lines);
        } elseif ($this->decodeLessonExtra((string) ($room['price_description'] ?? '')) !== null) {
            $room['price_description'] = '';
        }

        return $room;
    }

    /**
     * @param array<string, mixed> $extra
     */
    private function composePriceDescriptionText(array $extra): string
    {
        $lines = [];
        foreach (($extra['price_items'] ?? []) as $row) {
            if (!is_array($row)) {
                continue;
            }
            $parts = array_values(array_filter([
                trim((string) ($row['item'] ?? '')),
                trim((string) ($row['fee'] ?? '')),
                trim((string) ($row['note'] ?? '')),
            ], static fn ($v) => $v !== ''));
            if ($parts !== []) {
                $lines[] = implode(' · ', $parts);
            }
        }
        return implode("\n", $lines);
    }

    /**
     * @param array<string, mixed> $input
     * @return array<string, mixed>
     */
    private function normalizeLessonExtra(array $input): array
    {
        $fromPayload = $input['lesson_extra'] ?? null;
        $base = is_array($fromPayload) ? $fromPayload : [];

        $days = $input['attendance_days'] ?? ($base['attendance_days'] ?? []);
        if (!is_array($days)) {
            $days = [];
        }
        $allowedDays = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
        $days = array_values(array_filter($days, static fn ($d) => in_array((string) $d, $allowedDays, true)));

        $styleIds = $input['teaching_style_ids'] ?? ($base['teaching_style_ids'] ?? []);
        if (!is_array($styleIds)) {
            $styleIds = [];
        }
        $allowedStyles = [
            'kind', 'meticulous', 'taciturn', 'comprehension', 'problem_solving',
            'concept_focus', 'advanced_focus', 'pinpoint', 'patient', 'attentive',
            'solution_notes', 'textbook_focus', 'mock_exam',
            'passion', 'from_basics', 'solution_focus',
        ];
        $styleIds = array_values(array_filter($styleIds, static fn ($id) => in_array((string) $id, $allowedStyles, true)));

        $priceItems = $input['price_items'] ?? ($base['price_items'] ?? []);
        if (!is_array($priceItems)) {
            $priceItems = [];
        }
        $normalizedPrices = [];
        foreach ($priceItems as $row) {
            if (!is_array($row)) {
                continue;
            }
            $item = trim((string) ($row['item'] ?? ''));
            $fee = trim((string) ($row['fee'] ?? ''));
            $note = trim((string) ($row['note'] ?? ''));
            if ($item === '' && $fee === '' && $note === '') {
                continue;
            }
            $normalizedPrices[] = ['item' => $item, 'fee' => $fee, 'note' => $note];
        }

        return [
            '_s114' => 'lesson_extra',
            'attendance_days' => $days,
            'lessons_per_week' => trim((string) ($input['lessons_per_week'] ?? ($base['lessons_per_week'] ?? ''))),
            'minutes_per_lesson' => trim((string) ($input['minutes_per_lesson'] ?? ($base['minutes_per_lesson'] ?? ''))),
            'lesson_note' => trim((string) ($input['lesson_note'] ?? ($base['lesson_note'] ?? ''))),
            'teaching_style_ids' => $styleIds,
            'teaching_style_note' => trim((string) ($input['teaching_style_note'] ?? ($base['teaching_style_note'] ?? ''))),
            'price_items' => $normalizedPrices,
        ];
    }

    /**
     * @param array<string, mixed> $extra
     */
    private function encodeLessonExtra(array $extra): string
    {
        $json = json_encode($extra, JSON_UNESCAPED_UNICODE);
        return is_string($json) ? $json : '{"_s114":"lesson_extra"}';
    }

    /**
     * @return array<string, mixed>|null
     */
    private function decodeLessonExtra(string $raw): ?array
    {
        $text = trim($raw);
        if ($text === '' || $text[0] !== '{') {
            return null;
        }
        $parsed = json_decode($text, true);
        if (!is_array($parsed) || ($parsed['_s114'] ?? '') !== 'lesson_extra') {
            return null;
        }
        return $parsed;
    }

    /**
     * @param array<string, mixed> $input
     * @param array<string, mixed> $extra
     */
    private function priceAmountFromLesson(array $input, array $extra): ?int
    {
        $direct = $this->optionalInt($input, 'price_amount');
        if ($direct !== null && $direct > 0) {
            return $direct;
        }
        foreach (($extra['price_items'] ?? []) as $row) {
            if (!is_array($row)) {
                continue;
            }
            $parsed = $this->parseFeeAmount((string) ($row['fee'] ?? ''));
            if ($parsed !== null && $parsed > 0) {
                return $parsed;
            }
        }
        return null;
    }

    private function parseFeeAmount(string $text): ?int
    {
        $text = trim($text);
        if ($text === '') {
            return null;
        }
        if (preg_match('/(\d+(?:\.\d+)?)\s*만/u', $text, $m)) {
            return (int) round((float) $m[1] * 10000);
        }
        $digits = preg_replace('/[^\d]/', '', $text);
        if ($digits === null || $digits === '') {
            return null;
        }
        return (int) $digits;
    }

    /**
     * @param array<string, mixed> $extra
     */
    private function lessonExtraHasWeekend(array $extra): bool
    {
        $days = $extra['attendance_days'] ?? [];
        return in_array('sat', $days, true) || in_array('sun', $days, true);
    }

    /**
     * @param array<string, mixed> $input
     * @param array<string, mixed> $extra
     */
    private function teachingStyleFromLesson(array $input, array $extra): ?string
    {
        $labels = [
            'kind' => '친절',
            'meticulous' => '꼼꼼',
            'taciturn' => '과묵',
            'comprehension' => '이해력',
            'problem_solving' => '문제풀이형',
            'concept_focus' => '개념중심',
            'advanced_focus' => '고난이도',
            'pinpoint' => '족집게',
            'patient' => '인내형',
            'attentive' => '경청형',
            'solution_notes' => '풀이필기중점',
            'textbook_focus' => '교과서중심',
            'mock_exam' => '모의고사풀이',
            'passion' => '열정',
            'from_basics' => '기초부터',
            'solution_focus' => '문제풀이형',
        ];
        $ids = $extra['teaching_style_ids'] ?? [];
        $picked = [];
        foreach ($ids as $id) {
            $key = (string) $id;
            if (isset($labels[$key])) {
                $picked[] = $labels[$key];
            }
        }
        $note = trim((string) ($extra['teaching_style_note'] ?? ''));
        $joined = implode(', ', $picked);
        if ($note !== '') {
            $joined = $joined !== '' ? $joined . ' / ' . $note : $note;
        }
        if ($joined !== '') {
            return mb_substr($joined, 0, 255);
        }
        return $this->optionalString($input, 'teaching_style');
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



    /** @param array<string, mixed> $input */

    private function optionalDecimal(array $input, string $key): ?string

    {

        if (!isset($input[$key]) || trim((string) $input[$key]) === '') {

            return null;

        }

        return trim((string) $input[$key]);

    }

}

