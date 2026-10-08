<?php



declare(strict_types=1);



namespace Study114\Tutor;



use InvalidArgumentException;

use PDO;

use PDOException;

use RuntimeException;

use Study114\Database\Connection;
use Study114\Region\TutorRegionUnit;



final class TutorRegisterService

{

    /** @return array{regions: list<array{id: int, label: string}>, tutor_units: list<array{id: int, label: string}>} */

    public function getMasters(): array

    {

        $pdo = Connection::get();
        $tutorUnits = TutorRegionUnit::listUnits($pdo);
        $regions = [];
        try {
            $regions = $this->intIdRows(
                $pdo->query(
                    'SELECT id, CONCAT(sido_name, " ", sigungu_name, " ", dong_name) AS label
                     FROM regions
                     WHERE is_active = 1 AND unit_level = \'dong\' AND dong_name <> \'시 대표\'
                     ORDER BY id ASC'
                )->fetchAll(PDO::FETCH_ASSOC)
            );
        } catch (\Throwable $e) {
            error_log('[tutor masters] regions: ' . $e->getMessage());
        }

        return [
            'regions' => $regions,
            'tutor_units' => $tutorUnits,
        ];

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

            $createdNow = false;

            if ($tutorId === null) {

                if ($step !== 'basic') {

                    throw new InvalidArgumentException('tutor_id: 먼저 기본정보를 저장해 주세요.');

                }

                if (!$this->inputHasTutorSlot1($input)) {

                    throw new InvalidArgumentException('과외지역 1을 선택해 주세요.');

                }

                $tutorId = $this->findLatestTutorId($pdo, $userId);

                if ($tutorId === null) {

                    $tutorId = $this->insertDraft($pdo, $userId, $input);

                    $createdNow = true;

                } else {

                    $this->assertOwnership($pdo, $userId, $tutorId);

                }

            } else {

                $this->assertOwnership($pdo, $userId, $tutorId);

            }



            match ($step) {

                'basic'    => $this->saveBasic($pdo, $tutorId, $input, $createdNow),

                'regions'  => $this->saveRegions($pdo, $tutorId, $input),

                'lesson'   => $this->saveLesson($pdo, $tutorId, $input),

                'career'   => $this->saveCareer($pdo, $tutorId, $input),

                'contact'  => $this->saveContact($pdo, $tutorId, $input),

            };

            if ($step === 'basic' && ($createdNow || array_key_exists('saved_regions', $input))) {

                $this->saveRegions($pdo, $tutorId, $input);

            }

            if ($step === 'basic' && isset($input['gender']) && (string) $input['gender'] !== '') {
                \Study114\Auth\ProfileGenderSync::sync($userId, $input);
            }



            $detailEval = $this->refreshDetailStatus($pdo, $tutorId, $step);



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

        } catch (InvalidArgumentException $e) {

            if ($pdo->inTransaction()) {

                $pdo->rollBack();

            }

            throw $e;

        } catch (PDOException $e) {

            $pdo->rollBack();

            throw new RuntimeException('과외쌤 등록 저장 실패: ' . $e->getMessage(), 0, $e);

        }



        return [

            'tutor_id'                 => $tutorId,

            'profile_status'           => $status['profile_status'],

            'detail_completion_status' => $status['detail_completion_status'],

            'detail_missing'           => $detailEval['missing'] ?? [],

            'detail_checks'            => $detailEval['checks'] ?? [],

        ];

    }



    /**

     * @return array{

     *   tutor_id: int,

     *   detail_completion_status: string,

     *   detail_missing: list<string>,

     *   detail_checks: array<string, bool>

     * }

     */

    public function recomputeDetailStatus(int $userId, int $tutorId): array

    {

        $this->assertTutorRole($userId);

        $pdo = Connection::get();

        $this->assertOwnership($pdo, $userId, $tutorId);

        $eval = (new TutorDetailCompletionEvaluator())->apply($pdo, $tutorId);



        return [

            'tutor_id' => $tutorId,

            'detail_completion_status' => $eval['status'],

            'detail_missing' => $eval['missing'],

            'detail_checks' => $eval['checks'],

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



    private function findLatestTutorId(PDO $pdo, int $userId): ?int

    {

        $stmt = $pdo->prepare(

            'SELECT id FROM tutors

             WHERE user_id = ?

             ORDER BY updated_at DESC, id DESC

             LIMIT 1'

        );

        $stmt->execute([$userId]);

        $id = $stmt->fetchColumn();



        return $id === false ? null : (int) $id;

    }



    /** @param array<string, mixed> $input */

    private function insertDraft(PDO $pdo, int $userId, array $input): int

    {

        $existing = $this->findLatestTutorId($pdo, $userId);

        if ($existing !== null) {

            return $existing;

        }

        $name = $this->requireString($input, 'tutor_display_name');

        $stmt = $pdo->prepare(

            'INSERT INTO tutors (user_id, tutor_display_name, profile_status, detail_completion_status)

             VALUES (?, ?, "draft", "basic_only")'

        );

        $stmt->execute([$userId, $name]);



        return (int) $pdo->lastInsertId();

    }



    /**
     * 기본정보 = TutorBasicFields 필수 항목. 과외지역 1은 이 요청의 saved_regions 또는 저장된 행으로 본다.
     * 프로필 사진은 /api/tutor/profile-image.php 로 올린다. 이 요청으로 행을 처음 만들 때만 사진 없이 저장하고,
     * 화면이 저장 직후 같은 화면에서 올린다. 소개·연령대 등 기본정보가 아닌 칸은 건드리지 않는다.
     *
     * @param array<string, mixed> $input
     */
    private function saveBasic(PDO $pdo, int $tutorId, array $input, bool $createdNow): void
    {
        $hasRegion = array_key_exists('saved_regions', $input)
            ? $this->inputHasTutorSlot1($input)
            : TutorBasicFields::hasPrimaryRegion($pdo, $tutorId);
        $values = TutorBasicFields::normalizeInput(
            $input,
            $hasRegion,
            $createdNow || TutorBasicFields::hasProfileImage($pdo, $tutorId)
        );
        TutorBasicFields::write($pdo, $tutorId, $values);
    }



    /**
     * 신규 행은 과외지역 1이 같은 요청에 있을 때만 만든다.
     *
     * @param array<string, mixed> $input
     */
    private function inputHasTutorSlot1(array $input): bool
    {
        $slots = $input['saved_regions'] ?? null;
        if (!is_array($slots) || !isset($slots[0]) || !is_array($slots[0])) {
            return false;
        }
        $regionId = $slots[0]['region_id'] ?? '';
        if ($regionId === '' || $regionId === null) {
            return false;
        }

        return (int) $regionId > 0;
    }

    /**
     * 과외지역 1(배열 0번)이 비면 저장하지 않는다. 2·3번만 있어도 대표로 올리지 않는다.
     * 대표는 슬롯 1의 is_primary 한 행이다. 거부 시 DELETE 전에 예외를 던져 기존 행을 유지한다.
     *
     * @param array<string, mixed> $input
     */
    private function saveRegions(PDO $pdo, int $tutorId, array $input): void
    {
        $slots = $input['saved_regions'] ?? [];
        if (!is_array($slots)) {
            $slots = [];
        }

        $parsed = [];
        $index = 0;
        foreach ($slots as $slot) {
            if ($index >= 3) {
                break;
            }
            if (is_array($slot)) {
                $regionId = isset($slot['region_id']) && $slot['region_id'] !== '' ? (int) $slot['region_id'] : 0;
                if ($regionId > 0) {
                    $parsed[] = ['slot' => $index, 'region_id' => $regionId, 'raw' => $slot];
                }
            }
            $index++;
        }

        if ($parsed === [] || (int) $parsed[0]['slot'] !== 0) {
            throw new InvalidArgumentException('과외지역 1을 선택해 주세요.');
        }

        foreach ($parsed as $i => $row) {
            $regionId = (int) $row['region_id'];
            TutorRegionUnit::assertUnit($pdo, $regionId);
            $parsed[$i]['scope'] = $this->optionalEnum($row['raw'], 'scope_type', ['city', 'district', 'metro']) ?? 'city';
        }

        $pdo->prepare('DELETE FROM tutor_regions WHERE tutor_id = ?')->execute([$tutorId]);

        $insert = $pdo->prepare(
            'INSERT INTO tutor_regions (tutor_id, region_id, scope_type, priority_order, is_primary)
             VALUES (?, ?, ?, ?, ?)'
        );
        $order = 0;
        foreach ($parsed as $row) {
            $regionId = (int) $row['region_id'];
            $isPrimary = (int) $row['slot'] === 0 ? 1 : 0;
            $insert->execute([$tutorId, $regionId, $row['scope'], $order, $isPrimary]);
            $order++;
        }
    }



    /**
     * 상세 1(수업 상세). 기본정보 항목(과외비·주 회수·1회 수업시간·강의장소·원생수·대표 과목)은 basic 단계만 저장한다.
     * 보낸 칸만 고친다. 보내지 않은 칸은 지우지 않는다.
     *
     * @param array<string, mixed> $input
     */
    private function saveLesson(PDO $pdo, int $tutorId, array $input): void
    {
        $set = [];
        $params = [];
        if (array_key_exists('age_band', $input)) {
            $set[] = 'age_band = ?';
            $params[] = $this->optionalEnum($input, 'age_band', [
                'early_20s', 'late_20s', 'early_30s', 'late_30s', 'early_40s', 'late_40s', 'over_50',
            ]);
        }
        if (array_key_exists('fee_basis_type', $input)) {
            $set[] = 'fee_basis_type = ?';
            $params[] = $this->optionalEnum($input, 'fee_basis_type', ['monthly_by_weekly_schedule', 'monthly_by_total_sessions']);
        }
        if (array_key_exists('monthly_session_count', $input)) {
            $set[] = 'monthly_session_count = ?';
            $params[] = $this->optionalInt($input, 'monthly_session_count');
        }
        if (array_key_exists('fee_description', $input)) {
            $set[] = 'fee_description = ?';
            $params[] = $this->optionalString($input, 'fee_description');
        }
        if ($set !== []) {
            $params[] = $tutorId;
            $pdo->prepare('UPDATE tutors SET ' . implode(', ', $set) . ' WHERE id = ?')->execute($params);
        }

        if (array_key_exists('subjects', $input)) {
            $this->syncSubjects($pdo, $tutorId, $input);
        }
    }



    /**
     * 상세 2(학력·경력·특징 2·3). 특징 1은 basic 단계만 저장한다.
     * 보낸 칸만 고친다. 보내지 않은 칸은 지우지 않는다.
     *
     * @param array<string, mixed> $input
     */
    private function saveCareer(PDO $pdo, int $tutorId, array $input): void
    {
        $columns = [
            'university_name'    => fn () => $this->optionalString($input, 'university_name'),
            'major_name'         => fn () => $this->optionalString($input, 'major_name'),
            'university_status'  => fn () => $this->optionalEnum($input, 'university_status', ['enrolled', 'leave', 'completed', 'graduated']),
            'career_year_band'   => fn () => $this->optionalEnum($input, 'career_year_band', ['y1_3', 'y4_6', 'y7_10', 'y10_plus']),
            'main_material_note' => fn () => $this->optionalString($input, 'main_material_note'),
            'feature_2'          => fn () => $this->optionalString($input, 'feature_2'),
            'feature_3'          => fn () => $this->optionalString($input, 'feature_3'),
            'proof_document_available' => fn () => !empty($input['proof_document_available']) ? 1 : 0,
        ];
        $set = [];
        $params = [];
        foreach ($columns as $column => $value) {
            if (array_key_exists($column, $input)) {
                $set[] = $column . ' = ?';
                $params[] = $value();
            }
        }
        if ($set !== []) {
            $params[] = $tutorId;
            $pdo->prepare('UPDATE tutors SET ' . implode(', ', $set) . ' WHERE id = ?')->execute($params);
        }

        if (array_key_exists('teaching_style_badges', $input)) {
            $this->syncStyleBadges($pdo, $tutorId, $input);
        }
    }



    /** @param array<string, mixed> $input */

    private function saveContact(PDO $pdo, int $tutorId, array $input): void

    {

        $curStmt = $pdo->prepare('SELECT profile_status FROM tutors WHERE id = ?');

        $curStmt->execute([$tutorId]);

        $currentStatus = (string) ($curStmt->fetchColumn() ?: 'draft');

        if ($currentStatus === 'pending') {

            $currentStatus = 'draft';

        }



        if ($currentStatus === 'hidden') {
            $profileStatus = 'hidden';
            $isNewPublish = false;
        } else {
            $requested = isset($input['profile_status'])
                && trim((string) $input['profile_status']) !== ''
                && strtolower(trim((string) $input['profile_status'])) !== 'hidden'

                ? $this->requireEnum($input, 'profile_status', ['draft', 'pending', 'published'])

                : null;

            $profileStatus = $requested ?? $currentStatus;

            $isNewPublish = $profileStatus === 'published' && $currentStatus !== 'published';
        }



        // home-ui 인라인 상세저장이 contact 에 intro 를 실어 보내는 경로 지원

        if (array_key_exists('intro_short', $input) || array_key_exists('intro_long', $input)) {

            $introStmt = $pdo->prepare(

                'UPDATE tutors SET intro_short = COALESCE(?, intro_short), intro_long = COALESCE(?, intro_long) WHERE id = ?'

            );

            $introStmt->execute([

                $this->optionalString($input, 'intro_short'),

                $this->optionalString($input, 'intro_long'),

                $tutorId,

            ]);

        }



        $stmt = $pdo->prepare(

            'UPDATE tutors SET contact_time_note = ?, youtube_url = ?, facebook_url = ?, instagram_url = ?, profile_status = ? WHERE id = ?'

        );

        $stmt->execute([

            $this->optionalString($input, 'contact_time_note'),

            $this->optionalUrl($input, 'youtube_url'),

            $this->optionalUrl($input, 'facebook_url'),

            $this->optionalUrl($input, 'instagram_url'),

            $profileStatus,

            $tutorId,

        ]);



        $this->syncImages($pdo, $tutorId, $input);



        // 이미 공개된 프로필의 상세 수정은 공개 게이트를 다시 타지 않는다.

        // 새로 published 로 올릴 때만 완료·이미지 검사.

        if ($isNewPublish) {

            $eval = (new TutorDetailCompletionEvaluator())->evaluate($pdo, $tutorId);

            if ($eval['status'] !== TutorDetailCompletionEvaluator::STATUS_COMPLETE) {

                throw new InvalidArgumentException(

                    '상세등록이 완료되지 않아 공개할 수 없습니다. 부족: ' . implode(', ', $eval['missing'])

                );

            }

            $countStmt = $pdo->prepare('SELECT COUNT(*) FROM tutor_images WHERE tutor_id = ?');

            $countStmt->execute([$tutorId]);

            if ((int) $countStmt->fetchColumn() < 1) {

                throw new InvalidArgumentException('프로필 이미지가 없어 공개할 수 없습니다.');

            }

            $pdo->prepare(

                'UPDATE tutors SET published_at = COALESCE(published_at, NOW()) WHERE id = ?'

            )->execute([$tutorId]);

        }

    }



    /**
     * 추가 과목 행만 다시 쓴다. 대표 과목 행(주력과목·대상 학교급)은 basic 단계(TutorBasicFields)만 고친다.
     *
     * @param array<string, mixed> $input
     */
    private function syncSubjects(PDO $pdo, int $tutorId, array $input): void
    {
        $subjects = $input['subjects'] ?? [];
        if (!is_array($subjects)) {
            $subjects = [];
        }

        $pdo->prepare('DELETE FROM tutor_subject_targets WHERE tutor_id = ? AND is_primary = 0')->execute([$tutorId]);

        foreach ($subjects as $sub) {
            if (!is_array($sub)) {
                continue;
            }
            $name = isset($sub['subject_name']) ? trim((string) $sub['subject_name']) : '';
            if ($name === '') {
                continue;
            }
            $level = $this->requireEnum($sub, 'school_level', $this->schoolLevelCodes());
            $masterId = isset($sub['subject_master_id']) && $sub['subject_master_id'] !== ''
                ? (int) $sub['subject_master_id']
                : $this->findSubjectMasterId($pdo, $name);

            $pdo->prepare(
                'INSERT INTO tutor_subject_targets
                 (tutor_id, subject_name, school_level, grade_band, subject_master_id, is_primary)
                 VALUES (?, ?, ?, ?, ?, 0)'
            )->execute([
                $tutorId,
                $name,
                $level,
                $this->optionalString($sub, 'grade_band'),
                $masterId,
            ]);
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

            if (!is_array($img) || $order > 3) {

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



    /**

     * @return array{

     *   status: string,

     *   missing: list<string>,

     *   checks: array<string, bool>,

     *   progress_signals: int,

     *   changed: bool

     * }

     */

    private function refreshDetailStatus(PDO $pdo, int $tutorId, string $step): array

    {

        // $step 은 호출 계보 추적용. 판정은 필드 SSOT.

        unset($step);



        return (new TutorDetailCompletionEvaluator())->apply($pdo, $tutorId);

    }



    /** @param list<array{school_level: string, is_primary: bool}> $subjects */
    private function primarySchoolLevel(array $subjects): string
    {
        foreach ($subjects as $s) {
            if ($s['is_primary'] && in_array($s['school_level'], TutorBasicFields::SCHOOL_LEVELS, true)) {
                return $s['school_level'];
            }
        }

        return '';
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

            'student_gender_group'       => (string) ($row['student_gender_group'] ?? ''),

            'student_count_group'        => (string) ($row['student_count_group'] ?? ''),

            'school_level'               => $this->primarySchoolLevel($subjects),

            'age_band'                   => (string) ($row['age_band'] ?? ''),

            'saved_regions'              => $savedRegions,

            'main_subject_note'          => (string) ($row['main_subject_note'] ?? ''),

            'preferred_fee_amount'       => $row['preferred_fee_amount'] !== null ? (string) $row['preferred_fee_amount'] : '',

            'fee_basis_type'             => (string) ($row['fee_basis_type'] ?? ''),

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

            'facebook_url'               => (string) ($row['facebook_url'] ?? ''),

            'instagram_url'              => (string) ($row['instagram_url'] ?? ''),

            'images'                     => $images,

            'profile_status'             => (string) ($row['profile_status'] ?? 'draft'),

            'detail_completion_status'     => (string) ($row['detail_completion_status'] ?? 'basic_only'),

            'detail_missing'               => (new TutorDetailCompletionEvaluator())->evaluate(

                Connection::get(),

                $tutorId

            )['missing'],

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

    private function optionalInt(array $input, string $key): ?int

    {

        if (!isset($input[$key]) || $input[$key] === '') {

            return null;

        }

        return (int) $input[$key];

    }

}

