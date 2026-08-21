<?php

declare(strict_types=1);

namespace Study114\Search;

use InvalidArgumentException;
use PDO;
use Study114\Database\Connection;
use Study114\Paid\PaidBadgeResolver;

final class SearchService
{
    private const VALID_TABS = ['room', 'tutor', 'student'];

    private ?PaidBadgeResolver $paidBadges = null;

    private function paidBadgeResolver(): PaidBadgeResolver
    {
        return $this->paidBadges ??= new PaidBadgeResolver();
    }

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

    /** @var list<string> */
    private const SORT_PROVIDER = ['latest', 'recommend', 'review', 'price_asc', 'price_desc'];

    /** @var list<string> */
    private const SORT_TUTOR = ['latest', 'recommend', 'review', 'price_asc', 'price_desc', 'sky'];

    /** @var list<string> */
    private const SORT_STUDENT = ['latest', 'budget_asc', 'budget_desc', 'price_asc', 'price_desc'];

    /**
     * @param array<string, mixed> $filters
     * @return array{tab: string, total: int, rows: list<array{left: string, center: string, right: string}>, items: list<array<string, mixed>>, sort: string}
     */
    public function search(string $tab, array $filters, int $page = 1, int $limit = 20, string $sort = 'latest'): array
    {
        if (!in_array($tab, self::VALID_TABS, true)) {
            throw new InvalidArgumentException('tab: room, tutor, student 중 하나여야 합니다.');
        }

        $page = max(1, $page);
        $limit = min(50, max(1, $limit));
        $offset = ($page - 1) * $limit;
        $sort = $this->normalizeSort($tab, $sort);

        $pdo = Connection::get();

        $result = match ($tab) {
            'room'    => $this->searchRooms($pdo, $filters, $limit, $offset, $sort),
            'tutor'   => $this->searchTutors($pdo, $filters, $limit, $offset, $sort),
            'student' => $this->searchStudents($pdo, $filters, $limit, $offset, $sort),
        };
        $result['sort'] = $sort;

        return $result;
    }

    private function normalizeSort(string $tab, string $sort): string
    {
        $key = strtolower(trim($sort));
        if ($key === '') {
            return 'latest';
        }
        if ($tab === 'student') {
            if ($key === 'price_asc') {
                return 'budget_asc';
            }
            if ($key === 'price_desc') {
                return 'budget_desc';
            }
            return in_array($key, self::SORT_STUDENT, true) ? $key : 'latest';
        }

        if ($tab === 'tutor') {
            return in_array($key, self::SORT_TUTOR, true) ? $key : 'latest';
        }

        return in_array($key, self::SORT_PROVIDER, true) ? $key : 'latest';
    }

    /**
     * 카드 「위치」= 홍보지역 1(대표). 사업장주소는 핀만.
     *
     * @param array<string, mixed> $row
     */
    private function promoRegionLabel(array $row): string
    {
        $dong = trim((string) ($row['promo_dong_name'] ?? ''));
        $sigungu = trim((string) ($row['promo_sigungu_name'] ?? ''));
        $complex = trim((string) ($row['promo_complex_name'] ?? ''));
        $basis = (string) ($row['promo_basis'] ?? '');
        if ($basis === 'complex' && $complex !== '') {
            return $dong !== '' ? ($dong . ' · ' . $complex) : $complex;
        }
        if ($dong === '') {
            return $sigungu;
        }
        if ($sigungu !== '' && !str_contains($dong, $sigungu)) {
            return $sigungu . ' ' . $dong;
        }
        return $dong;
    }

    /** @return array<string, bool> */
    private function columnCache(PDO $pdo, string $table, string $column): bool
    {
        static $cache = [];
        $key = $table . '.' . $column;
        if (array_key_exists($key, $cache)) {
            return $cache[$key];
        }
        $stmt = $pdo->prepare(
            'SELECT 1 FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1'
        );
        $stmt->execute([$table, $column]);
        $cache[$key] = (bool) $stmt->fetchColumn();

        return $cache[$key];
    }

    private function tableExists(PDO $pdo, string $table): bool
    {
        static $cache = [];
        if (array_key_exists($table, $cache)) {
            return $cache[$table];
        }
        $stmt = $pdo->prepare(
            'SELECT 1 FROM information_schema.TABLES
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? LIMIT 1'
        );
        $stmt->execute([$table]);
        $cache[$table] = (bool) $stmt->fetchColumn();

        return $cache[$table];
    }

    private function recommendCountExpr(PDO $pdo, string $table, string $alias): string
    {
        if ($this->columnCache($pdo, $table, 'recommend_count')) {
            return "COALESCE({$alias}.recommend_count, 0)";
        }

        return '0';
    }

    private function reviewCountExpr(PDO $pdo, string $providerType, string $idAlias): string
    {
        if (!$this->tableExists($pdo, 'provider_reviews')) {
            return '0';
        }

        return "(SELECT COUNT(*) FROM provider_reviews pr
            WHERE pr.provider_type = '{$providerType}' AND pr.provider_id = {$idAlias} AND pr.review_status = 'visible')";
    }

    /**
     * 최신키: published_at ?? created_at
     */
    private function latestKeyExpr(string $alias): string
    {
        return "COALESCE({$alias}.published_at, {$alias}.created_at)";
    }

    /**
     * SKY 우선 — tutors.university_name 만 (note/대학원 파싱 금지)
     */
    private function skyRankExpr(string $alias): string
    {
        return "(CASE
            WHEN TRIM({$alias}.university_name) IN (
                '서울대학교', '연세대학교', '고려대학교',
                '서울대', '연세대', '고려대'
            ) THEN 0
            ELSE 1
        END)";
    }

    /**
     * 가격/예산 NULL·0 은 정렬 맨 뒤
     */
    private function orderByForProvider(
        string $sort,
        string $alias,
        string $priceCol,
        string $recommendExpr,
        string $reviewExpr,
        bool $allowSky = false,
    ): string {
        $latest = $this->latestKeyExpr($alias);
        $idDesc = "{$alias}.id DESC";
        $priceMissing = "(CASE WHEN {$priceCol} IS NULL OR {$priceCol} = 0 THEN 1 ELSE 0 END) ASC";

        if ($allowSky && $sort === 'sky') {
            $sky = $this->skyRankExpr($alias);

            return "{$sky} ASC, {$recommendExpr} DESC, {$latest} DESC, {$idDesc}";
        }

        return match ($sort) {
            'recommend' => "{$recommendExpr} DESC, {$latest} DESC, {$idDesc}",
            'review' => "{$reviewExpr} DESC, {$latest} DESC, {$idDesc}",
            'price_asc' => "{$priceMissing}, {$priceCol} ASC, {$latest} DESC, {$idDesc}",
            'price_desc' => "{$priceMissing}, {$priceCol} DESC, {$latest} DESC, {$idDesc}",
            default => "{$latest} DESC, {$idDesc}",
        };
    }

    private function orderByForStudent(string $sort, string $alias, string $budgetExpr): string
    {
        $latest = $this->latestKeyExpr($alias);
        $idDesc = "{$alias}.id DESC";
        $missing = "(CASE WHEN {$budgetExpr} IS NULL OR {$budgetExpr} = 0 THEN 1 ELSE 0 END) ASC";

        return match ($sort) {
            'budget_asc', 'price_asc' => "{$missing}, {$budgetExpr} ASC, {$latest} DESC, {$idDesc}",
            'budget_desc', 'price_desc' => "{$missing}, {$budgetExpr} DESC, {$latest} DESC, {$idDesc}",
            default => "{$latest} DESC, {$idDesc}",
        };
    }

    /**
     * @param array<string, mixed> $filters
     * @return array{tab: string, total: int, rows: list<array{left: string, center: string, right: string}>, items: list<array<string, mixed>>}
     */
    private function searchRooms(PDO $pdo, array $filters, int $limit, int $offset, string $sort): array
    {
        // 일반 리스트/검색 = 상세등록 완료 후 (Notion 14장 §7-2)
        $where = [
            'sr.profile_status = :status',
            'sr.deleted_at IS NULL',
            "sr.detail_completion_status = 'expanded_complete'",
        ];
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
            if ($this->tableExists($pdo, 'study_room_primary_audiences')) {
                $where[] = '(EXISTS (
                    SELECT 1 FROM study_room_primary_audiences srpa
                    WHERE srpa.study_room_id = sr.id AND srpa.school_level = :school_level
                ) OR EXISTS (
                    SELECT 1 FROM study_room_subject_targets srst2
                    WHERE srst2.study_room_id = sr.id AND srst2.school_level = :school_level
                ))';
            } else {
                $where[] = 'EXISTS (
                    SELECT 1 FROM study_room_subject_targets srst2
                    WHERE srst2.study_room_id = sr.id AND srst2.school_level = :school_level
                )';
            }
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
        $recommendExpr = $this->recommendCountExpr($pdo, 'study_rooms', 'sr');
        $reviewExpr = $this->reviewCountExpr($pdo, 'study_room', 'sr.id');
        $orderBy = $this->orderByForProvider($sort, 'sr', 'sr.price_amount', $recommendExpr, $reviewExpr);

        $countSql = "SELECT COUNT(DISTINCT sr.id) FROM study_rooms sr WHERE {$whereSql}";
        $stmt = $pdo->prepare($countSql);
        $stmt->execute($params);
        $total = (int) $stmt->fetchColumn();

        $latExpr = $this->columnCache($pdo, 'study_rooms', 'latitude') ? 'sr.latitude' : 'NULL';
        $lngExpr = $this->columnCache($pdo, 'study_rooms', 'longitude') ? 'sr.longitude' : 'NULL';
        $gradeExpr = $this->columnCache($pdo, 'study_rooms', 'grade_band') ? 'sr.grade_band' : 'NULL';
        $audienceExpr = $this->tableExists($pdo, 'study_room_primary_audiences')
            ? "(SELECT GROUP_CONCAT(
                    CASE srpa.school_level
                      WHEN 'preschool' THEN '미취학'
                      WHEN 'elementary' THEN '초등'
                      WHEN 'middle' THEN '중등'
                      WHEN 'high' THEN '고등'
                      WHEN 'n_su' THEN 'N수'
                    END
                    ORDER BY FIELD(srpa.school_level, 'preschool','elementary','middle','high','n_su')
                    SEPARATOR ' ')
               FROM study_room_primary_audiences srpa WHERE srpa.study_room_id = sr.id)"
            : 'NULL';
        $primeImgExpr = $this->roomCoverImageExpr($pdo, 'prime');
        $basicImgExpr = $this->roomCoverImageExpr($pdo, 'basic');
        $careerExpr = $this->columnCache($pdo, 'study_rooms', 'career_years') ? 'sr.career_years' : 'NULL';
        $bizExpr = $this->columnCache($pdo, 'study_rooms', 'business_registration_available')
            ? 'sr.business_registration_available'
            : 'NULL';

        $sql = "
            SELECT DISTINCT sr.id, sr.study_room_name, sr.price_amount, sr.intro_short, sr.intro_long,
                   sr.main_subject_note, sr.teaching_style, {$gradeExpr} AS grade_band,
                   {$audienceExpr} AS audience_label,
                   sr.feature_1, sr.feature_2, sr.feature_3, sr.slogan,
                   sr.lesson_place_type, sr.capacity_per_time, sr.lesson_operation_type,
                   sr.facility_note, sr.inquiry_status,
                   sr.education_office_registered, sr.detail_completion_status,
                   {$careerExpr} AS career_years,
                   {$bizExpr} AS business_registration_available,
                   {$latExpr} AS latitude, {$lngExpr} AS longitude,
                   sr.published_at, sr.created_at,
                   {$recommendExpr} AS recommend_count,
                   {$reviewExpr} AS review_count,
                   r.dong_name, r.sigungu_name, c.name AS complex_name,
                   pr.dong_name AS promo_dong_name, pr.sigungu_name AS promo_sigungu_name,
                   pc.name AS promo_complex_name, srr.region_basis_type AS promo_basis,
                   {$primeImgExpr} AS image_path_prime,
                   {$basicImgExpr} AS image_path_basic
            FROM study_rooms sr
            LEFT JOIN regions r ON sr.region_id = r.id
            LEFT JOIN complexes c ON sr.complex_id = c.id
            LEFT JOIN study_room_regions srr ON srr.study_room_id = sr.id AND srr.is_primary = 1
            LEFT JOIN regions pr ON srr.region_id = pr.id
            LEFT JOIN complexes pc ON srr.complex_id = pc.id
            WHERE {$whereSql}
            ORDER BY {$orderBy}
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
            $regionLabel = $this->promoRegionLabel($row);

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
                'grade_band'                 => (string) (($row['audience_label'] ?? '') !== ''
                    ? $row['audience_label']
                    : ($row['grade_band'] ?? '')),
                'intro_short'                => (string) ($row['intro_short'] ?? ''),
                'intro_long'                 => (string) ($row['intro_long'] ?? ''),
                'feature_1'                  => (string) ($row['feature_1'] ?? ''),
                'feature_2'                  => (string) ($row['feature_2'] ?? ''),
                'feature_3'                  => (string) ($row['feature_3'] ?? ''),
                'slogan'                     => (string) ($row['slogan'] ?? ''),
                'teaching_style'             => (string) ($row['teaching_style'] ?? ''),
                'lesson_place_type'          => $row['lesson_place_type'] ?? null,
                'capacity_per_time'          => $row['capacity_per_time'] ?? null,
                'lesson_operation_type'      => $row['lesson_operation_type'] ?? null,
                'facility_summary'           => trim((string) ($row['facility_note'] ?? '')),
                'inquiry_status'             => (string) ($row['inquiry_status'] ?? ''),
                'education_office_registered'=> (bool) ($row['education_office_registered'] ?? false),
                'career_years'               => $row['career_years'] !== null ? (int) $row['career_years'] : null,
                'business_registration_available' => (bool) ($row['business_registration_available'] ?? false),
                'detail_completion_status'   => $detailStatus,
                'prime_eligible'             => $detailStatus === 'expanded_complete',
                'exposure_tier'              => $exposureTier,
                'latitude'                   => $row['latitude'] !== null ? (float) $row['latitude'] : null,
                'longitude'                  => $row['longitude'] !== null ? (float) $row['longitude'] : null,
                'published_at'               => $row['published_at'] ?? null,
                'created_at'                 => $row['created_at'] ?? null,
                'recommend_count'            => (int) ($row['recommend_count'] ?? 0),
                'review_count'               => (int) ($row['review_count'] ?? 0),
                'paid_badges'                => $this->paidBadgeResolver()->forProvider(
                    'study_room',
                    (int) $row['id'],
                ),
                'image_path_prime'           => (string) ($row['image_path_prime'] ?? ''),
                'image_path_basic'           => (string) ($row['image_path_basic'] ?? ''),
                'image_path'                 => $exposureTier === 'prime'
                    ? (string) ($row['image_path_prime'] ?? $row['image_path_basic'] ?? '')
                    : (string) ($row['image_path_basic'] ?? $row['image_path_prime'] ?? ''),
            ];

            $items[] = $item;
            $rows[] = [
                'left'   => $item['title'] . ($regionLabel !== '' ? "\n" . $regionLabel : ''),
                'center' => $center,
                'right'  => $item['price_label'] . "\n" . strtoupper($exposureTier),
            ];
            $i++;
        }

        $galleryMap = $this->loadRoomGalleryMap($pdo, array_map(static fn (array $it): int => (int) $it['id'], $items));
        foreach ($items as &$item) {
            $id = (int) $item['id'];
            $item['images'] = $galleryMap[$id] ?? [];
            if ($item['images'] !== [] && ($item['image_path'] ?? '') === '') {
                $item['image_path'] = (string) ($item['images'][0]['image_path'] ?? '');
            }
        }
        unset($item);

        return ['tab' => 'room', 'total' => $total, 'rows' => $rows, 'items' => $items];
    }

    /**
     * @param array<string, mixed> $filters
     * @return array{tab: string, total: int, rows: list<array{left: string, center: string, right: string}>, items: list<array<string, mixed>>}
     */
    private function searchTutors(PDO $pdo, array $filters, int $limit, int $offset, string $sort): array
    {
        // 일반 리스트/검색 = 상세등록 완료 후 (Notion 14장 §7-2)
        $where = [
            't.profile_status = :status',
            "t.detail_completion_status = 'expanded_complete'",
        ];
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
        $recommendExpr = $this->recommendCountExpr($pdo, 'tutors', 't');
        $reviewExpr = $this->reviewCountExpr($pdo, 'tutor', 't.id');
        $orderBy = $this->orderByForProvider($sort, 't', 't.preferred_fee_amount', $recommendExpr, $reviewExpr, true);

        $countSql = "SELECT COUNT(DISTINCT t.id) FROM tutors t WHERE {$whereSql}";
        $stmt = $pdo->prepare($countSql);
        $stmt->execute($params);
        $total = (int) $stmt->fetchColumn();

        $sql = "
            SELECT DISTINCT t.id, t.tutor_display_name, t.preferred_fee_amount,
                   t.university_name, t.major_name, t.career_year_band,
                   t.university_status, t.proof_document_available,
                   t.lessons_per_week, t.minutes_per_lesson, t.detail_completion_status,
                   t.published_at, t.created_at,
                   {$recommendExpr} AS recommend_count,
                   {$reviewExpr} AS review_count,
                   tst.subject_name, r.sigungu_name, r.sido_name
            FROM tutors t
            LEFT JOIN tutor_regions tr ON tr.tutor_id = t.id AND tr.is_primary = 1
            LEFT JOIN regions r ON tr.region_id = r.id
            LEFT JOIN tutor_subject_targets tst ON tst.tutor_id = t.id AND tst.is_primary = 1
            WHERE {$whereSql}
            ORDER BY {$orderBy}
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
                'university_status'      => $row['university_status'] ?? null,
                'proof_document_available' => (bool) ($row['proof_document_available'] ?? false),
                'career_year_band'       => $row['career_year_band'] ?? null,
                'lessons_per_week'       => $row['lessons_per_week'] !== null ? (int) $row['lessons_per_week'] : null,
                'minutes_per_lesson'     => $row['minutes_per_lesson'] !== null ? (int) $row['minutes_per_lesson'] : null,
                'detail_completion_status' => $detailStatus,
                'prime_eligible'         => $detailStatus === 'expanded_complete',
                'exposure_tier'          => $exposureTier,
                'published_at'           => $row['published_at'] ?? null,
                'created_at'             => $row['created_at'] ?? null,
                'recommend_count'        => (int) ($row['recommend_count'] ?? 0),
                'review_count'           => (int) ($row['review_count'] ?? 0),
                'paid_badges'            => $this->paidBadgeResolver()->forProvider(
                    'tutor',
                    (int) $row['id'],
                ),
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
    private function searchStudents(PDO $pdo, array $filters, int $limit, int $offset, string $sort): array
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
        $budgetExpr = 'COALESCE(s.preferred_fee_amount, s.preferred_studyroom_fee_amount)';
        $orderBy = $this->orderByForStudent($sort, 's', $budgetExpr);

        $countSql = "SELECT COUNT(DISTINCT s.id) FROM students s WHERE {$whereSql}";
        $stmt = $pdo->prepare($countSql);
        $stmt->execute($params);
        $total = (int) $stmt->fetchColumn();

        $sql = "
            SELECT DISTINCT s.id, s.public_display_name, s.grade_level, s.gender,
                   s.lesson_format, s.student_gender_group, s.preferred_student_count_group,
                   s.preferred_fee_amount, s.preferred_studyroom_fee_amount,
                   s.preferred_lesson_type,
                   s.published_at, s.created_at,
                   {$budgetExpr} AS budget_amount,
                   r.dong_name, r.sigungu_name, c.name AS complex_name,
                   sst.subject_name
            FROM students s
            LEFT JOIN regions r ON COALESCE(s.preferred_studyroom_region_id, s.preferred_tutor_region_id) = r.id
            LEFT JOIN complexes c ON s.preferred_studyroom_complex_id = c.id
            LEFT JOIN student_subject_targets sst ON sst.student_id = s.id AND sst.is_primary = 1
            WHERE {$whereSql}
            ORDER BY {$orderBy}
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
                'budget_amount' => $row['budget_amount'] !== null ? (int) $row['budget_amount'] : null,
                'published_at' => $row['published_at'] ?? null,
                'created_at' => $row['created_at'] ?? null,
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

    /** 전화번호·이메일은 검색 SELECT에 넣지 않는다. 홍보사진 파생본만. */
    private function roomCoverImageExpr(PDO $pdo, string $kind): string
    {
        if (!$this->tableExists($pdo, 'study_room_images')) {
            return 'NULL';
        }
        $prime1600 = $this->columnCache($pdo, 'study_room_images', 'prime_1600_path');
        $prime1280 = $this->columnCache($pdo, 'study_room_images', 'prime_1280_path');
        $basic720 = $this->columnCache($pdo, 'study_room_images', 'basic_720_path');
        $basic360 = $this->columnCache($pdo, 'study_room_images', 'basic_360_path');
        $parts = $kind === 'prime'
            ? array_values(array_filter([
                $prime1600 ? "NULLIF(sri.prime_1600_path,'')" : null,
                $prime1280 ? "NULLIF(sri.prime_1280_path,'')" : null,
                'NULLIF(sri.image_path,\'\')',
            ]))
            : array_values(array_filter([
                $basic720 ? "NULLIF(sri.basic_720_path,'')" : null,
                $basic360 ? "NULLIF(sri.basic_360_path,'')" : null,
                'NULLIF(sri.image_path,\'\')',
            ]));
        $coalesce = 'COALESCE(' . implode(', ', $parts) . ')';

        return "(SELECT {$coalesce}
                  FROM study_room_images sri
                 WHERE sri.study_room_id = sr.id
                 ORDER BY (sri.image_type = 'cover') DESC, sri.sort_order ASC, sri.id ASC
                 LIMIT 1)";
    }

    /**
     * @param list<int> $roomIds
     * @return array<int, list<array{image_type: string, image_path: string}>>
     */
    private function loadRoomGalleryMap(PDO $pdo, array $roomIds): array
    {
        $roomIds = array_values(array_filter(array_map('intval', $roomIds), static fn (int $id): bool => $id > 0));
        if ($roomIds === [] || !$this->tableExists($pdo, 'study_room_images')) {
            return [];
        }

        $placeholders = implode(',', array_fill(0, count($roomIds), '?'));
        $hasPrime = $this->columnCache($pdo, 'study_room_images', 'prime_1280_path');
        $hasBasic = $this->columnCache($pdo, 'study_room_images', 'basic_720_path');
        $hasSys = $this->columnCache($pdo, 'study_room_images', 'is_system_default');
        $pathExpr = $hasPrime && $hasBasic
            ? "COALESCE(NULLIF(prime_1280_path,''), NULLIF(basic_720_path,''), NULLIF(image_path,''))"
            : 'NULLIF(image_path,\'\')';
        $sysExpr = $hasSys ? 'COALESCE(is_system_default, 0)' : '0';

        try {
            $stmt = $pdo->prepare(
                "SELECT study_room_id, image_type, {$pathExpr} AS image_path, original_filename, {$sysExpr} AS is_system_default
                   FROM study_room_images
                  WHERE study_room_id IN ({$placeholders})
                  ORDER BY study_room_id ASC, (image_type = 'cover') DESC, sort_order ASC, id ASC"
            );
            $stmt->execute($roomIds);
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (\Throwable) {
            return [];
        }

        $map = [];
        foreach ($rows as $row) {
            $id = (int) ($row['study_room_id'] ?? 0);
            if ($id <= 0) {
                continue;
            }
            if ((int) ($row['is_system_default'] ?? 0) === 1) {
                continue;
            }
            if ((string) ($row['original_filename'] ?? '') === '__system_default__') {
                continue;
            }
            $path = trim((string) ($row['image_path'] ?? ''));
            if ($path === '') {
                continue;
            }
            if (!isset($map[$id])) {
                $map[$id] = [];
            }
            if (count($map[$id]) >= 6) {
                continue;
            }
            $map[$id][] = [
                'image_type' => (string) ($row['image_type'] ?? 'other'),
                'image_path' => $path,
            ];
        }

        return $map;
    }
}
