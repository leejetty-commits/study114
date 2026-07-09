<?php

declare(strict_types=1);

namespace Study114\Search;

use InvalidArgumentException;
use PDO;
use Study114\Database\Connection;

final class SearchService
{
    private const VALID_TABS = ['room', 'tutor', 'student'];

    private const SCHOOL_LEVEL_LABELS = [
        'preschool'  => '유치',
        'elementary' => '초등',
        'middle'     => '중등',
        'high'       => '고등',
        'n_su'       => 'N수',
        'general'    => '일반',
        'other'      => '기타',
    ];

    private const GENDER_LABELS = [
        'male'   => '남',
        'female' => '여',
    ];

    private const LESSON_FORMAT_LABELS = [
        'one_on_one' => '단독과외',
        'group'      => '그룹과외',
    ];

    private const STUDENT_COUNT_LABELS = [
        'solo'       => '단독',
        'two'        => '2명',
        'three'      => '3명',
        'four_plus'  => '4명 이상',
    ];

    private const GENDER_GROUP_LABELS = [
        'male'   => '남',
        'female' => '여',
        'mixed'  => '남여',
    ];

    /**
     * @param array<string, mixed> $filters
     * @return array{tab: string, total: int, rows: list<array{left: string, center: string, right: string}>, items: list<array<string, mixed>>}
     */
    public function search(string $tab, array $filters, int $page = 1, int $limit = 20): array
    {
        if (!in_array($tab, self::VALID_TABS, true)) {
            throw new InvalidArgumentException('tab: room, tutor, student 중 하나여야 합니다.');
        }

        $page = max(1, $page);
        $limit = min(50, max(1, $limit));
        $offset = ($page - 1) * $limit;

        $pdo = Connection::get();

        return match ($tab) {
            'room'    => $this->searchRooms($pdo, $filters, $limit, $offset),
            'tutor'   => $this->searchTutors($pdo, $filters, $limit, $offset),
            'student' => $this->searchStudents($pdo, $filters, $limit, $offset),
        };
    }

    /**
     * @param array<string, mixed> $filters
     * @return array{tab: string, total: int, rows: list<array{left: string, center: string, right: string}>, items: list<array<string, mixed>>}
     */
    private function searchRooms(PDO $pdo, array $filters, int $limit, int $offset): array
    {
        $where = ['sr.profile_status = :status', 'sr.deleted_at IS NULL'];
        $params = ['status' => 'published'];

        if ($regionId = $this->intFilter($filters, 'region_id')) {
            $where[] = '(sr.region_id = :region_id OR EXISTS (
                SELECT 1 FROM study_room_regions srr
                WHERE srr.study_room_id = sr.id AND srr.region_id = :region_id
            ))';
            $params['region_id'] = $regionId;
        }

        if ($subjectId = $this->intFilter($filters, 'subject_master_id')) {
            $where[] = 'EXISTS (
                SELECT 1 FROM study_room_subject_targets srst
                WHERE srst.study_room_id = sr.id
                  AND srst.subject_master_id = :subject_master_id
                  AND srst.is_main = 1
            )';
            $params['subject_master_id'] = $subjectId;
        }

        if ($schoolLevel = $this->stringFilter($filters, 'school_level')) {
            $where[] = 'EXISTS (
                SELECT 1 FROM study_room_subject_targets srst2
                WHERE srst2.study_room_id = sr.id AND srst2.school_level = :school_level
            )';
            $params['school_level'] = $schoolLevel;
        }

        $this->applyRange($where, $params, $filters, 'price_amount', 'sr.price_amount');
        $this->applyEnum($where, $params, $filters, 'lesson_place_type', 'sr.lesson_place_type');
        $this->applyEnum($where, $params, $filters, 'lesson_operation_type', 'sr.lesson_operation_type');
        $this->applyBool($where, $params, $filters, 'education_office_registered', 'sr.education_office_registered');
        $this->applyBool($where, $params, $filters, 'one_on_one_available', 'sr.one_on_one_available');
        $this->applyBool($where, $params, $filters, 'weekend_available', 'sr.weekend_available');
        $this->applyEnum($where, $params, $filters, 'capacity_per_time', 'sr.capacity_per_time');
        $this->applyEnum($where, $params, $filters, 'detail_completion_status', 'sr.detail_completion_status');

        if ($careerYears = $this->intFilter($filters, 'career_years')) {
            $where[] = 'sr.career_years >= :career_years';
            $params['career_years'] = $careerYears;
        }

        $this->applyBool($where, $params, $filters, 'franchise_flag', 'sr.franchise_flag');

        $facilityCodes = $this->stringListFilter($filters, 'facility_codes');
        foreach ($facilityCodes as $i => $code) {
            $key = 'facility_code_' . $i;
            $where[] = "EXISTS (
                SELECT 1 FROM study_room_facilities srf
                INNER JOIN facility_masters fm ON fm.id = srf.facility_id
                WHERE srf.study_room_id = sr.id AND fm.facility_code = :{$key}
            )";
            $params[$key] = $code;
        }

        $whereSql = implode(' AND ', $where);

        $countSql = "SELECT COUNT(DISTINCT sr.id) FROM study_rooms sr WHERE {$whereSql}";
        $stmt = $pdo->prepare($countSql);
        $stmt->execute($params);
        $total = (int) $stmt->fetchColumn();

        $sql = "
            SELECT DISTINCT sr.id, sr.study_room_name, sr.price_amount, sr.intro_short,
                   sr.main_subject_note, sr.teaching_style, sr.grade_band, sr.feature_1, sr.slogan,
                   sr.lesson_place_type, sr.capacity_per_time, sr.lesson_operation_type,
                   sr.education_office_registered, sr.detail_completion_status,
                   sr.latitude, sr.longitude,
                   r.dong_name, r.sigungu_name, c.name AS complex_name
            FROM study_rooms sr
            LEFT JOIN regions r ON sr.region_id = r.id
            LEFT JOIN complexes c ON sr.complex_id = c.id
            WHERE {$whereSql}
            ORDER BY sr.id DESC
            LIMIT :limit OFFSET :offset
        ";

        $stmt = $pdo->prepare($sql);
        foreach ($params as $key => $value) {
            $stmt->bindValue(':' . $key, $value);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        $items = [];
        $rows = [];

        $i = 0;
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $regionLabel = $row['complex_name']
                ? $row['dong_name'] . ' · ' . $row['complex_name']
                : ($row['dong_name'] ?: $row['sigungu_name'] ?: '');

            $centerParts = array_filter([
                $row['main_subject_note'],
                $row['intro_short'],
                $row['teaching_style'],
            ]);
            $center = implode("\n", $centerParts);

            $detailStatus = (string) ($row['detail_completion_status'] ?? '');
            $exposureTier = $this->resolveExposureTier($i, $detailStatus);

            $item = [
                'id'                         => (int) $row['id'],
                'title'                      => (string) $row['study_room_name'],
                'region_label'               => $regionLabel,
                'summary'                    => $center,
                'price_amount'               => $row['price_amount'] !== null ? (int) $row['price_amount'] : null,
                'price_label'                => $this->formatMonthlyPrice($row['price_amount']),
                'main_subject_note'          => (string) ($row['main_subject_note'] ?? ''),
                'grade_band'                 => (string) ($row['grade_band'] ?? ''),
                'feature_1'                  => (string) ($row['feature_1'] ?? ''),
                'slogan'                     => (string) ($row['slogan'] ?? ''),
                'lesson_place_type'          => $row['lesson_place_type'] ?? null,
                'capacity_per_time'          => $row['capacity_per_time'] ?? null,
                'lesson_operation_type'      => $row['lesson_operation_type'] ?? null,
                'education_office_registered'=> (bool) ($row['education_office_registered'] ?? false),
                'detail_completion_status'   => $detailStatus,
                'prime_eligible'             => $detailStatus === 'expanded_complete',
                'exposure_tier'              => $exposureTier,
                'latitude'                   => $row['latitude'] !== null ? (float) $row['latitude'] : null,
                'longitude'                  => $row['longitude'] !== null ? (float) $row['longitude'] : null,
            ];

            $items[] = $item;
            $rows[] = [
                'left'   => $item['title'] . ($regionLabel !== '' ? "\n" . $regionLabel : ''),
                'center' => $center,
                'right'  => $item['price_label'] . "\n" . strtoupper($exposureTier),
            ];
            $i++;
        }

        return ['tab' => 'room', 'total' => $total, 'rows' => $rows, 'items' => $items];
    }

    /**
     * @param array<string, mixed> $filters
     * @return array{tab: string, total: int, rows: list<array{left: string, center: string, right: string}>, items: list<array<string, mixed>>}
     */
    private function searchTutors(PDO $pdo, array $filters, int $limit, int $offset): array
    {
        $where = ['t.profile_status = :status'];
        $params = ['status' => 'published'];

        if ($regionId = $this->intFilter($filters, 'tutor_region_id')) {
            $where[] = 'EXISTS (
                SELECT 1 FROM tutor_regions tr
                WHERE tr.tutor_id = t.id AND tr.region_id = :tutor_region_id
            )';
            $params['tutor_region_id'] = $regionId;
        }

        if ($subjectId = $this->intFilter($filters, 'subject_master_id')) {
            $where[] = 'EXISTS (
                SELECT 1 FROM tutor_subject_targets tst
                WHERE tst.tutor_id = t.id
                  AND tst.subject_master_id = :subject_master_id
                  AND tst.is_primary = 1
            )';
            $params['subject_master_id'] = $subjectId;
        }

        if ($schoolLevel = $this->stringFilter($filters, 'school_level')) {
            $where[] = 'EXISTS (
                SELECT 1 FROM tutor_subject_targets tst2
                WHERE tst2.tutor_id = t.id AND tst2.school_level = :school_level
            )';
            $params['school_level'] = $schoolLevel;
        }

        $this->applyRange($where, $params, $filters, 'preferred_fee_amount', 't.preferred_fee_amount');
        $this->applyEnum($where, $params, $filters, 'career_year_band', 't.career_year_band');
        $this->applyEnum($where, $params, $filters, 'university_status', 't.university_status');
        $this->applyEnum($where, $params, $filters, 'age_band', 't.age_band');
        $this->applyEnum($where, $params, $filters, 'student_gender_group', 't.student_gender_group');
        $this->applyEnum($where, $params, $filters, 'student_count_group', 't.student_count_group');

        if ($universityName = $this->stringFilter($filters, 'university_name')) {
            $where[] = 't.university_name LIKE :university_name';
            $params['university_name'] = '%' . $universityName . '%';
        }

        if ($majorName = $this->stringFilter($filters, 'major_name')) {
            $where[] = 't.major_name LIKE :major_name';
            $params['major_name'] = '%' . $majorName . '%';
        }

        $placeTypes = $this->stringListFilter($filters, 'place_type');
        foreach ($placeTypes as $i => $placeType) {
            $key = 'place_type_' . $i;
            $where[] = "EXISTS (
                SELECT 1 FROM tutor_lesson_places tlp
                WHERE tlp.tutor_id = t.id AND tlp.place_type = :{$key}
            )";
            $params[$key] = $placeType;
        }

        $badges = $this->stringListFilter($filters, 'teaching_style');
        foreach ($badges as $i => $badge) {
            $key = 'teaching_style_' . $i;
            $where[] = "EXISTS (
                SELECT 1 FROM tutor_teaching_style_badges ttsb
                WHERE ttsb.tutor_id = t.id AND ttsb.badge_name = :{$key}
            )";
            $params[$key] = $badge;
        }

        $whereSql = implode(' AND ', $where);

        $countSql = "SELECT COUNT(DISTINCT t.id) FROM tutors t WHERE {$whereSql}";
        $stmt = $pdo->prepare($countSql);
        $stmt->execute($params);
        $total = (int) $stmt->fetchColumn();

        $sql = "
            SELECT DISTINCT t.id, t.tutor_display_name, t.preferred_fee_amount,
                   t.university_name, t.major_name, t.career_year_band,
                   t.lessons_per_week, t.minutes_per_lesson, t.detail_completion_status,
                   tst.subject_name, r.sigungu_name, r.sido_name
            FROM tutors t
            LEFT JOIN tutor_regions tr ON tr.tutor_id = t.id AND tr.is_primary = 1
            LEFT JOIN regions r ON tr.region_id = r.id
            LEFT JOIN tutor_subject_targets tst ON tst.tutor_id = t.id AND tst.is_primary = 1
            WHERE {$whereSql}
            ORDER BY t.id DESC
            LIMIT :limit OFFSET :offset
        ";

        $stmt = $pdo->prepare($sql);
        foreach ($params as $key => $value) {
            $stmt->bindValue(':' . $key, $value);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        $items = [];
        $rows = [];

        $i = 0;
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $regionLabel = trim(($row['sido_name'] ?? '') . ' ' . ($row['sigungu_name'] ?? ''));
            $subjectLine = $row['subject_name'] ?: '';
            if ($row['university_name']) {
                $subjectLine .= ($subjectLine !== '' ? ' · ' : '') . $row['university_name'];
                if ($row['major_name']) {
                    $subjectLine .= ' ' . $row['major_name'];
                }
            }

            $center = $subjectLine;
            if ($row['career_year_band']) {
                $center .= ($center !== '' ? "\n" : '') . '경력 ' . $row['career_year_band'];
            }

            $detailStatus = (string) ($row['detail_completion_status'] ?? '');
            $exposureTier = $this->resolveExposureTier($i, $detailStatus);

            $schedule = [];
            if ($row['lessons_per_week']) {
                $schedule[] = '주' . $row['lessons_per_week'];
            }
            if ($row['minutes_per_lesson']) {
                $schedule[] = $row['minutes_per_lesson'] . '분';
            }

            $right = $this->formatMonthlyPrice($row['preferred_fee_amount']);
            if ($schedule !== []) {
                $right .= ' · ' . implode(' · ', $schedule);
            }
            $right .= "\n" . strtoupper($exposureTier);

            $item = [
                'id'                     => (int) $row['id'],
                'title'                  => (string) $row['tutor_display_name'],
                'region_label'           => $regionLabel,
                'summary'                => $center,
                'price_label'            => $this->formatMonthlyPrice($row['preferred_fee_amount']),
                'preferred_fee_amount'   => $row['preferred_fee_amount'] !== null ? (int) $row['preferred_fee_amount'] : null,
                'main_subject_note'      => (string) ($row['subject_name'] ?? ''),
                'university_name'        => (string) ($row['university_name'] ?? ''),
                'major_name'             => (string) ($row['major_name'] ?? ''),
                'career_year_band'       => $row['career_year_band'] ?? null,
                'lessons_per_week'       => $row['lessons_per_week'] !== null ? (int) $row['lessons_per_week'] : null,
                'minutes_per_lesson'     => $row['minutes_per_lesson'] !== null ? (int) $row['minutes_per_lesson'] : null,
                'detail_completion_status' => $detailStatus,
                'prime_eligible'         => $detailStatus === 'expanded_complete',
                'exposure_tier'          => $exposureTier,
            ];

            $items[] = $item;
            $rows[] = [
                'left'   => $item['title'] . ($regionLabel !== '' ? "\n" . $regionLabel : ''),
                'center' => $center,
                'right'  => $right,
            ];
            $i++;
        }

        return ['tab' => 'tutor', 'total' => $total, 'rows' => $rows, 'items' => $items];
    }

    /**
     * @param array<string, mixed> $filters
     * @return array{tab: string, total: int, rows: list<array{left: string, center: string, right: string}>, items: list<array<string, mixed>>}
     */
    private function searchStudents(PDO $pdo, array $filters, int $limit, int $offset): array
    {
        $where = ['s.exposure_status = :status', 's.deleted_at IS NULL'];
        $params = ['status' => 'published'];

        if ($lessonType = $this->stringFilter($filters, 'preferred_lesson_type')) {
            $where[] = 's.preferred_lesson_type = :preferred_lesson_type';
            $params['preferred_lesson_type'] = $lessonType;
        }

        if ($regionId = $this->intFilter($filters, 'preferred_region')) {
            $where[] = '(s.preferred_studyroom_region_id = :preferred_region
                OR s.preferred_tutor_region_id = :preferred_region)';
            $params['preferred_region'] = $regionId;
        }

        if ($subjectId = $this->intFilter($filters, 'subject_master_id')) {
            $where[] = 'EXISTS (
                SELECT 1 FROM student_subject_targets sst
                WHERE sst.student_id = s.id AND sst.subject_master_id = :subject_master_id
            )';
            $params['subject_master_id'] = $subjectId;
        }

        if ($gradeLevel = $this->stringFilter($filters, 'grade_level')) {
            $where[] = 's.grade_level LIKE :grade_level';
            $params['grade_level'] = '%' . $gradeLevel . '%';
        }

        $budgetMin = $this->intFilter($filters, 'budget_amount_min');
        $budgetMax = $this->intFilter($filters, 'budget_amount_max');
        if ($budgetMin !== null || $budgetMax !== null) {
            $budgetParts = [];
            if ($budgetMin !== null) {
                $budgetParts[] = '(COALESCE(s.preferred_fee_amount, s.preferred_studyroom_fee_amount) >= :budget_min)';
                $params['budget_min'] = $budgetMin;
            }
            if ($budgetMax !== null) {
                $budgetParts[] = '(COALESCE(s.preferred_fee_amount, s.preferred_studyroom_fee_amount) <= :budget_max)';
                $params['budget_max'] = $budgetMax;
            }
            $where[] = '(' . implode(' AND ', $budgetParts) . ')';
        }

        $this->applyEnum($where, $params, $filters, 'preferred_student_count_group', 's.preferred_student_count_group');
        $this->applyEnum($where, $params, $filters, 'lesson_format', 's.lesson_format');
        $this->applyEnum($where, $params, $filters, 'student_gender_group', 's.student_gender_group');

        if ($lessonsPerWeek = $this->intFilter($filters, 'lessons_per_week')) {
            $where[] = 's.lessons_per_week = :lessons_per_week';
            $params['lessons_per_week'] = $lessonsPerWeek;
        }

        if ($minutesPerLesson = $this->intFilter($filters, 'minutes_per_lesson')) {
            $where[] = 's.minutes_per_lesson = :minutes_per_lesson';
            $params['minutes_per_lesson'] = $minutesPerLesson;
        }

        $placeTypes = $this->stringListFilter($filters, 'place_type');
        foreach ($placeTypes as $i => $placeType) {
            $key = 'student_place_' . $i;
            $where[] = "EXISTS (
                SELECT 1 FROM student_preferred_lesson_places splp
                WHERE splp.student_id = s.id AND splp.place_type = :{$key}
            )";
            $params[$key] = $placeType;
        }

        $badges = $this->stringListFilter($filters, 'teaching_style');
        foreach ($badges as $i => $badge) {
            $key = 'student_style_' . $i;
            $where[] = "EXISTS (
                SELECT 1 FROM student_preferred_teaching_style_badges sptsb
                WHERE sptsb.student_id = s.id AND sptsb.badge_name = :{$key}
            )";
            $params[$key] = $badge;
        }

        $whereSql = implode(' AND ', $where);

        $countSql = "SELECT COUNT(DISTINCT s.id) FROM students s WHERE {$whereSql}";
        $stmt = $pdo->prepare($countSql);
        $stmt->execute($params);
        $total = (int) $stmt->fetchColumn();

        $sql = "
            SELECT DISTINCT s.id, s.public_display_name, s.grade_level, s.gender,
                   s.lesson_format, s.student_gender_group, s.preferred_student_count_group,
                   s.preferred_fee_amount, s.preferred_studyroom_fee_amount,
                   s.preferred_lesson_type,
                   r.dong_name, r.sigungu_name, c.name AS complex_name,
                   sst.subject_name
            FROM students s
            LEFT JOIN regions r ON COALESCE(s.preferred_studyroom_region_id, s.preferred_tutor_region_id) = r.id
            LEFT JOIN complexes c ON s.preferred_studyroom_complex_id = c.id
            LEFT JOIN student_subject_targets sst ON sst.student_id = s.id AND sst.is_primary = 1
            WHERE {$whereSql}
            ORDER BY s.id ASC
            LIMIT :limit OFFSET :offset
        ";

        $stmt = $pdo->prepare($sql);
        foreach ($params as $key => $value) {
            $stmt->bindValue(':' . $key, $value);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        $items = [];
        $rows = [];

        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $genderLabel = self::GENDER_LABELS[$row['gender'] ?? ''] ?? '';
            $leftTitle = $row['public_display_name'] ?: '학생';
            $leftMeta = trim(($row['grade_level'] ?? '') . ($genderLabel !== '' ? ' · ' . $genderLabel : ''));

            $centerParts = [];
            if ($row['subject_name']) {
                $centerParts[] = $row['subject_name'];
            }

            $placeRegion = $row['complex_name']
                ? ($row['dong_name'] . ' · ' . $row['complex_name'])
                : ($row['dong_name'] ?: $row['sigungu_name'] ?: '');
            if ($placeRegion !== '') {
                $centerParts[] = $placeRegion;
            }

            $formatLabel = self::LESSON_FORMAT_LABELS[$row['lesson_format'] ?? ''] ?? '';
            if ($formatLabel !== '') {
                $formatExtra = $formatLabel;
                if ($row['lesson_format'] === 'group') {
                    $groupParts = array_filter([
                        self::GENDER_GROUP_LABELS[$row['student_gender_group'] ?? ''] ?? null,
                        self::STUDENT_COUNT_LABELS[$row['preferred_student_count_group'] ?? ''] ?? null,
                    ]);
                    if ($groupParts !== []) {
                        $formatExtra .= ' · ' . implode(' · ', $groupParts);
                    }
                }
                $centerParts[] = $formatExtra;
            }

            $budget = $row['preferred_fee_amount'] ?? $row['preferred_studyroom_fee_amount'];
            $right = '수업예산 ' . $this->formatBudget($budget) . "\n메모 보내기";

            $item = [
                'id'           => (int) $row['id'],
                'title'        => $leftTitle,
                'grade_level'  => $row['grade_level'],
                'gender'       => $row['gender'],
                'summary'      => implode(' · ', $centerParts),
                'budget_label' => $this->formatBudget($budget),
                'subject_name' => $row['subject_name'] ?? null,
                'region_label' => $placeRegion,
                'lesson_format' => $row['lesson_format'] ?? null,
                'student_gender_group' => $row['student_gender_group'] ?? null,
                'preferred_student_count_group' => $row['preferred_student_count_group'] ?? null,
                'preferred_lesson_type' => $row['preferred_lesson_type'] ?? null,
                'preferred_fee_amount' => $row['preferred_fee_amount'] !== null ? (int) $row['preferred_fee_amount'] : null,
                'preferred_studyroom_fee_amount' => $row['preferred_studyroom_fee_amount'] !== null ? (int) $row['preferred_studyroom_fee_amount'] : null,
                'exposure_tier' => 'basic',
            ];

            $items[] = $item;
            $rows[] = [
                'left'   => $leftTitle . ($leftMeta !== '' ? "\n" . $leftMeta : ''),
                'center' => implode("\n", $centerParts),
                'right'  => $right,
            ];
        }

        return ['tab' => 'student', 'total' => $total, 'rows' => $rows, 'items' => $items];
    }

    /**
     * @param list<string> $where
     * @param array<string, mixed> $params
     * @param array<string, mixed> $filters
     */
    private function applyRange(array &$where, array &$params, array $filters, string $key, string $column): void
    {
        $min = $this->intFilter($filters, $key . '_min');
        $max = $this->intFilter($filters, $key . '_max');

        if ($min !== null) {
            $paramKey = $key . '_min';
            $where[] = "{$column} >= :{$paramKey}";
            $params[$paramKey] = $min;
        }

        if ($max !== null) {
            $paramKey = $key . '_max';
            $where[] = "{$column} <= :{$paramKey}";
            $params[$paramKey] = $max;
        }
    }

    /**
     * @param list<string> $where
     * @param array<string, mixed> $params
     * @param array<string, mixed> $filters
     */
    private function applyEnum(array &$where, array &$params, array $filters, string $key, string $column): void
    {
        $value = $this->stringFilter($filters, $key);
        if ($value === null) {
            return;
        }

        $where[] = "{$column} = :{$key}";
        $params[$key] = $value;
    }

    /**
     * @param list<string> $where
     * @param array<string, mixed> $params
     * @param array<string, mixed> $filters
     */
    private function applyBool(array &$where, array &$params, array $filters, string $key, string $column): void
    {
        if (!array_key_exists($key, $filters) || $filters[$key] === '' || $filters[$key] === null) {
            return;
        }

        $value = filter_var($filters[$key], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
        if ($value === null) {
            return;
        }

        $where[] = "{$column} = :{$key}";
        $params[$key] = $value ? 1 : 0;
    }

    /** @param array<string, mixed> $filters */
    private function intFilter(array $filters, string $key): ?int
    {
        if (!isset($filters[$key]) || $filters[$key] === '') {
            return null;
        }

        return (int) $filters[$key];
    }

    /** @param array<string, mixed> $filters */
    private function stringFilter(array $filters, string $key): ?string
    {
        if (!isset($filters[$key]) || $filters[$key] === '') {
            return null;
        }

        return trim((string) $filters[$key]);
    }

    /**
     * @param array<string, mixed> $filters
     * @return list<string>
     */
    private function stringListFilter(array $filters, string $key): array
    {
        if (!isset($filters[$key])) {
            return [];
        }

        $value = $filters[$key];
        if (is_array($value)) {
            return array_values(array_filter(array_map('strval', $value), static fn (string $v): bool => $v !== ''));
        }

        $single = trim((string) $value);
        return $single === '' ? [] : [$single];
    }

    private function formatMonthlyPrice(mixed $amount): string
    {
        if ($amount === null || $amount === '') {
            return '가격 협의';
        }

        $won = (int) $amount;
        if ($won >= 10000) {
            $man = (int) round($won / 10000);
            return '월 ' . number_format($man) . '만원';
        }

        return '월 ' . number_format($won) . '원';
    }

    private function formatBudget(mixed $amount): string
    {
        if ($amount === null || $amount === '') {
            return '협의';
        }

        $won = (int) $amount;
        if ($won >= 10000) {
            return number_format((int) round($won / 10000)) . '만';
        }

        return number_format($won) . '원';
    }

    private function resolveExposureTier(int $index, string $detailStatus): string
    {
        if ($index < 3 && $detailStatus === 'expanded_complete') {
            return 'prime';
        }
        if ($index < 8) {
            return 'pick';
        }

        return 'basic';
    }
}
