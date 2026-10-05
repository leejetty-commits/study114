<?php

declare(strict_types=1);

/**
 * 사이트오류-26 · 목록 티어는 이번 검색의 지역·축과 맞는 구독만.
 * 가짜 PDO. 사용: php scripts/verify-position-region-tier.php
 */

require_once dirname(__DIR__) . '/src/bootstrap.php';

use Study114\Database\Connection;
use Study114\Search\SearchService;

final class TierStmt
{
    private array $rows = [];
    private mixed $column = false;
    private int $cursor = 0;

    public function __construct(private TierPdo $pdo, private string $sql) {}

    public function execute(?array $params = null): bool
    {
        $sql = preg_replace('/\s+/', ' ', trim($this->sql)) ?? '';
        $p = array_values($params ?? []);
        $this->pdo->log[] = $sql;
        $a = $this->pdo->answer($sql, $p);
        $this->rows = $a['rows'] ?? [];
        $this->column = array_key_exists('column', $a) ? $a['column'] : false;
        $this->cursor = 0;

        return true;
    }

    public function fetch(mixed ...$a): mixed
    {
        return $this->rows[$this->cursor++] ?? false;
    }

    public function fetchColumn(mixed ...$a): mixed
    {
        return $this->column;
    }

    public function fetchAll(mixed ...$a): array
    {
        return $this->rows;
    }

    public function bindValue(mixed $k, mixed $v, int $t = 2): bool
    {
        return true;
    }
}

final class TierPdo extends PDO
{
    public array $log = [];

    /** @var list<array<string, mixed>> */
    public array $subs = [];

    public function __construct() {}

    #[\ReturnTypeWillChange]
    public function prepare(string $q, array $o = []): TierStmt
    {
        return new TierStmt($this, $q);
    }

    #[\ReturnTypeWillChange]
    public function query(string $query, ?int $fetchMode = null, mixed ...$fetchModeArgs): TierStmt|false
    {
        $stmt = new TierStmt($this, $query);
        $stmt->execute([]);

        return $stmt;
    }

    /** @param list<mixed> $p @return array{rows?: list<array<string, mixed>>, column?: mixed} */
    public function answer(string $sql, array $p): array
    {
        if (str_contains($sql, 'information_schema.COLUMNS') || str_contains($sql, 'COLUMN_NAME')) {
            $table = (string) ($p[0] ?? '');
            $col = (string) ($p[1] ?? '');
            $yes = $table === 'provider_position_subscriptions' && in_array($col, [
                'provider_type', 'provider_id', 'end_exclusive_on', 'sku_code', 'started_on',
                'region_basis_type', 'region_id', 'complex_id', 'city_id', 'primary_subject_id',
            ], true);

            return ['column' => $yes ? 1 : false];
        }
        if (str_contains($sql, 'information_schema')) {
            $table = (string) ($p[0] ?? '');

            return ['column' => $table === 'provider_position_subscriptions' ? 1 : false];
        }
        if (str_contains($sql, 'FROM regions') && str_contains($sql, 'is_selectable = 1')) {
            return ['column' => ((int) ($p[0] ?? 0)) > 0 ? 1 : false];
        }
        if (str_contains($sql, 'SELECT sku_code FROM provider_position_subscriptions')) {
            return ['column' => $this->matchSku($sql, $p)];
        }
        if (str_contains($sql, 'COUNT(DISTINCT sr.id)')) {
            return ['column' => 2];
        }
        if (str_contains($sql, 'FROM study_rooms sr') && str_contains($sql, 'study_room_name')) {
            return ['rows' => [$this->roomRow(1, 'A동프라임방'), $this->roomRow(2, '단지프라임방')]];
        }
        if (str_contains($sql, 'COUNT(DISTINCT t.id)')) {
            return ['column' => 1];
        }
        if (str_contains($sql, 'FROM tutors t') && str_contains($sql, 'tutor_display_name')) {
            return ['rows' => [$this->tutorRow(7, '시프라임쌤')]];
        }

        return ['column' => false, 'rows' => []];
    }

    /** @param list<mixed> $p */
    private function matchSku(string $sql, array $p): mixed
    {
        $type = (string) ($p[0] ?? '');
        $id = (int) ($p[1] ?? 0);
        $i = 2;
        $complex = null;
        $region = null;
        $city = null;
        $subject = null;
        if (str_contains($sql, "region_basis_type = 'complex'") && str_contains($sql, 'complex_id = ?')) {
            $complex = (int) ($p[$i] ?? 0);
            $i++;
        } elseif (str_contains($sql, 'region_id = ?')) {
            $region = (int) ($p[$i] ?? 0);
            $i++;
        }
        if (str_contains($sql, 'city_id = ?')) {
            $city = (int) ($p[$i] ?? 0);
            $i++;
        }
        if (str_contains($sql, 'primary_subject_id = ?')) {
            $subject = (int) ($p[$i] ?? 0);
        }

        $best = null;
        $rank = 99;
        foreach ($this->subs as $row) {
            if ((string) $row['provider_type'] !== $type || (int) $row['provider_id'] !== $id) {
                continue;
            }
            if ($complex !== null) {
                if (($row['basis'] ?? '') !== 'complex' || (int) ($row['complex_id'] ?? 0) !== $complex) {
                    continue;
                }
            }
            if ($region !== null) {
                if ((int) ($row['region_id'] ?? 0) !== $region) {
                    continue;
                }
                $basis = $row['basis'] ?? null;
                if ($basis !== null && $basis !== '' && $basis !== 'dong') {
                    continue;
                }
                if ((int) ($row['complex_id'] ?? 0) !== 0) {
                    continue;
                }
            }
            if ($city !== null && (int) ($row['city_id'] ?? 0) !== $city) {
                continue;
            }
            if ($subject !== null && (int) ($row['subject_id'] ?? 0) !== $subject) {
                continue;
            }
            $sku = (string) $row['sku'];
            $r = $sku === 'prime' ? 0 : 1;
            if ($r < $rank) {
                $rank = $r;
                $best = $sku;
            }
        }

        return $best ?? false;
    }

    /** @return array<string, mixed> */
    private function roomRow(int $id, string $name): array
    {
        return [
            'id' => $id,
            'study_room_name' => $name,
            'price_amount' => 100000,
            'intro_short' => '',
            'intro_long' => '',
            'main_subject_note' => '',
            'teaching_style' => '',
            'grade_band' => '',
            'audience_label' => '',
            'feature_1' => '',
            'feature_2' => '',
            'feature_3' => '',
            'slogan' => '',
            'lesson_place_type' => null,
            'capacity_per_time' => null,
            'lesson_operation_type' => null,
            'facility_note' => '',
            'inquiry_status' => 'open',
            'profile_status' => 'published',
            'education_office_registered' => 0,
            'detail_completion_status' => 'basic_complete',
            'career_years' => null,
            'business_registration_available' => 0,
            'latitude' => null,
            'longitude' => null,
            'published_at' => null,
            'created_at' => '2026-01-01 00:00:00',
            'recommend_count' => 0,
            'review_count' => 0,
            'dong_name' => '',
            'sigungu_name' => '',
            'complex_name' => '',
            'promo_dong_name' => '',
            'promo_sigungu_name' => '',
            'promo_complex_name' => '',
            'promo_basis' => '',
            'image_path_prime' => '',
            'image_path_basic' => '',
        ];
    }

    /** @return array<string, mixed> */
    private function tutorRow(int $id, string $name): array
    {
        return [
            'id' => $id,
            'tutor_display_name' => $name,
            'preferred_fee_amount' => 200000,
            'university_name' => '',
            'major_name' => '',
            'career_year_band' => null,
            'university_status' => null,
            'proof_document_available' => 0,
            'lessons_per_week' => null,
            'minutes_per_lesson' => null,
            'detail_completion_status' => 'basic_complete',
            'profile_status' => 'published',
            'published_at' => null,
            'created_at' => '2026-01-01 00:00:00',
            'recommend_count' => 0,
            'review_count' => 0,
            'subject_name' => '수학',
            'sigungu_name' => '',
            'sido_name' => '',
        ];
    }
}

function inject(TierPdo $pdo): void
{
    (new ReflectionProperty(Connection::class, 'pdo'))->setValue(null, $pdo);
}

$passed = 0;
$failed = 0;

function check(string $name, bool $cond, string $detail = ''): void
{
    global $passed, $failed;
    if ($cond) {
        $passed++;
        echo "PASS  {$name}\n";
        return;
    }
    $failed++;
    echo 'FAIL  ' . $name . ($detail !== '' ? ' — ' . $detail : '') . "\n";
}

/** @param array<string, mixed> $result */
function skuOf(array $result, int $id): string
{
    foreach ($result['items'] as $item) {
        if ((int) ($item['id'] ?? 0) === $id) {
            $sku = $item['position_sku'] ?? null;
            $tier = (string) ($item['exposure_tier'] ?? '');
            if ($sku === null || $sku === '') {
                return $tier === 'basic' ? 'basic' : 'sku-empty/' . $tier;
            }

            return (string) $sku === $tier ? (string) $sku : (string) $sku . '/' . $tier;
        }
    }

    return 'missing';
}

/** @param list<array<string, mixed>> $log */
function sawSkuSql(array $log, string $needle): bool
{
    foreach ($log as $sql) {
        if (str_contains($sql, 'SELECT sku_code FROM provider_position_subscriptions') && str_contains($sql, $needle)) {
            return true;
        }
    }

    return false;
}

$pdo = new TierPdo();
inject($pdo);
$pdo->subs = [
    ['provider_type' => 'study_room', 'provider_id' => 1, 'sku' => 'prime', 'basis' => 'dong', 'region_id' => 11, 'complex_id' => null],
    ['provider_type' => 'study_room', 'provider_id' => 2, 'sku' => 'prime', 'basis' => 'complex', 'region_id' => 11, 'complex_id' => 9],
    ['provider_type' => 'tutor', 'provider_id' => 7, 'sku' => 'prime', 'city_id' => 100, 'subject_id' => 7],
];
$search = new SearchService();

$dongA = $search->search('room', ['region_id' => 11], 1, 20);
$dongB = $search->search('room', ['region_id' => 22], 1, 20);
$open = $search->search('room', [], 1, 20);
$complex9 = $search->search('room', ['region_id' => 11, 'complex_id' => 9], 1, 20);
$complex8 = $search->search('room', ['region_id' => 11, 'complex_id' => 8], 1, 20);
$cityA = $search->search('tutor', ['tutor_region_id' => 100], 1, 20);
$cityB = $search->search('tutor', ['tutor_region_id' => 200], 1, 20);
$citySubject = $search->search('tutor', ['tutor_region_id' => 100, 'subject_master_id' => 7], 1, 20);
$cityOtherSubject = $search->search('tutor', ['tutor_region_id' => 100, 'subject_master_id' => 8], 1, 20);
$tutorOpen = $search->search('tutor', [], 1, 20);

check('M1 A동 검색에서 A동 프라임은 prime', skuOf($dongA, 1) === 'prime', skuOf($dongA, 1));
check('M1 A동 프라임만 산 방이 B동 검색에 나와도 prime 아님', skuOf($dongB, 1) === 'basic' && count($dongB['items']) === 2, skuOf($dongB, 1));
check('M1 단지 구독은 같은 동 검색에서 prime 아님', skuOf($dongA, 2) === 'basic', skuOf($dongA, 2));
check('M1 그 단지 검색에서는 prime', skuOf($complex9, 2) === 'prime', skuOf($complex9, 2));
check('M1 다른 단지 검색에서는 prime 아님', skuOf($complex8, 2) === 'basic' && count($complex8['items']) === 2, skuOf($complex8, 2));
check('M1 동 구독은 단지 검색에서 prime 아님', skuOf($complex9, 1) === 'basic', skuOf($complex9, 1));
check('M1 지역 키 없는 검색은 기존처럼 prime', skuOf($open, 1) === 'prime' && skuOf($open, 2) === 'prime', skuOf($open, 1) . ',' . skuOf($open, 2));
check('M1 동 검색 SQL은 동 구독만', sawSkuSql($pdo->log, "region_basis_type = 'dong'") && sawSkuSql($pdo->log, 'complex_id IS NULL'));
check('M1 단지 검색 SQL은 단지 구독만', sawSkuSql($pdo->log, "region_basis_type = 'complex' AND complex_id = ?"));
check('M2 같은 시 검색은 prime', skuOf($cityA, 7) === 'prime', skuOf($cityA, 7));
check('M2 다른 시 검색에 나와도 prime 아님', skuOf($cityB, 7) === 'basic' && count($cityB['items']) === 1, skuOf($cityB, 7));
check('M2 시+주력과목이 맞으면 prime', skuOf($citySubject, 7) === 'prime', skuOf($citySubject, 7));
check('M2 시가 같아도 과목이 다르면 prime 아님', skuOf($cityOtherSubject, 7) === 'basic', skuOf($cityOtherSubject, 7));
check('M2 축 없는 검색은 기존처럼 prime', skuOf($tutorOpen, 7) === 'prime', skuOf($tutorOpen, 7));
check('M2 시 검색 SQL은 city_id', sawSkuSql($pdo->log, 'city_id = ?'));
check('M2 과목 검색 SQL은 primary_subject_id', sawSkuSql($pdo->log, 'primary_subject_id = ?'));

$membershipScoped = false;
$membershipUntouched = true;
foreach ($pdo->log as $sql) {
    if (!str_contains($sql, 'COUNT(DISTINCT sr.id)')) {
        continue;
    }
    if (str_contains($sql, 'region_id = :region_id')) {
        $membershipScoped = true;
    }
    if (str_contains($sql, "region_basis_type = 'complex'")) {
        $membershipUntouched = false;
    }
}
check('목록 소속 SQL은 region_id 를 유지', $membershipScoped);
check('목록 소속 SQL은 단지 티어 조건을 넣지 않음', $membershipUntouched);

$pdo->subs[] = [
    'provider_type' => 'study_room', 'provider_id' => 1, 'sku' => 'pick',
    'basis' => 'dong', 'region_id' => 22, 'complex_id' => null,
];
$searchPick = new SearchService();
$dongBPick = $searchPick->search('room', ['region_id' => 22], 1, 20);
$dongAStill = $searchPick->search('room', ['region_id' => 11], 1, 20);
check(
    'M1 B동 픽은 B동에서만 pick',
    skuOf($dongBPick, 1) === 'pick' && skuOf($dongAStill, 1) === 'prime',
    skuOf($dongBPick, 1) . ' / ' . skuOf($dongAStill, 1),
);

echo "\n{$passed} PASS / {$failed} FAIL\n";
exit($failed > 0 ? 1 : 0);
