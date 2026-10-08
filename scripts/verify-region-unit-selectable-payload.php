<?php

declare(strict_types=1);

/**
 * 과외쌤 활동지역 region_selectable 페이로드 검증 (정본 72)
 *
 * 검증 항목:
 * - is_selectable=1 AND is_active=1 → region_selectable: true
 * - is_selectable=0 AND is_active=1 (옛 구·시·군 미통일 데이터) → region_selectable: false
 * - is_selectable=1 AND is_active=0 (비활성 지역) → region_selectable: false
 * - regions 테이블에 없는 region_id → region_selectable: false
 * - 미선택 빈 슬롯 → region_selectable: false
 *
 * 실행:
 *   D:\php8.2\php.exe -d extension=pdo_sqlite scripts/verify-region-unit-selectable-payload.php
 */

require_once dirname(__DIR__) . '/src/bootstrap.php';

use Study114\Registration\TutorHubRepository;

$failed = 0;
function ok(string $name, bool $cond, string $detail = ''): void
{
    global $failed;
    if ($cond) {
        echo "PASS  {$name}\n";
        return;
    }
    $failed++;
    fwrite(STDERR, "FAIL  {$name}" . ($detail !== '' ? " — {$detail}" : '') . "\n");
}

if (!extension_loaded('pdo_sqlite')) {
    fwrite(STDERR, "SKIP  pdo_sqlite extension not loaded\n");
    exit(0);
}

$pdo = new PDO('sqlite::memory:');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$pdo->exec('CREATE TABLE regions (
    id INTEGER PRIMARY KEY,
    sido_name TEXT NOT NULL,
    sigungu_name TEXT NOT NULL,
    dong_name TEXT NULL,
    is_selectable INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1
)');

$pdo->exec('CREATE TABLE tutor_regions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tutor_id INTEGER NOT NULL,
    region_id INTEGER NOT NULL,
    scope_type TEXT NOT NULL DEFAULT \'city\',
    is_primary INTEGER NOT NULL DEFAULT 0,
    priority_order INTEGER NOT NULL DEFAULT 0
)');

// 지역 1: 구/시/군 선택단위 (정상)
$pdo->exec("INSERT INTO regions (id, sido_name, sigungu_name, dong_name, is_selectable, is_active)
    VALUES (101, '서울특별시', '강남구', '', 1, 1)");

// 지역 2: 옛 값 - 시 대표 / 동 단위 (is_selectable=0)
$pdo->exec("INSERT INTO regions (id, sido_name, sigungu_name, dong_name, is_selectable, is_active)
    VALUES (102, '서울특별시', '서울특별시', '', 0, 1)");

// 지역 3: 비활성화된 지역 (is_active=0)
$pdo->exec("INSERT INTO regions (id, sido_name, sigungu_name, dong_name, is_selectable, is_active)
    VALUES (103, '경기도', '양주시', '', 1, 0)");

// 과외선생님 1의 활동지역 등록 (정상, 옛 값, 비활성)
$pdo->exec("INSERT INTO tutor_regions (tutor_id, region_id, scope_type, is_primary, priority_order) VALUES (1, 101, 'city', 1, 0)");
$pdo->exec("INSERT INTO tutor_regions (tutor_id, region_id, scope_type, is_primary, priority_order) VALUES (1, 102, 'city', 0, 1)");
$pdo->exec("INSERT INTO tutor_regions (tutor_id, region_id, scope_type, is_primary, priority_order) VALUES (1, 103, 'city', 0, 2)");

// 과외선생님 2의 활동지역 등록 (존재하지 않는 region_id)
$pdo->exec("INSERT INTO tutor_regions (tutor_id, region_id, scope_type, is_primary, priority_order) VALUES (2, 999, 'city', 1, 0)");

$repo = new TutorHubRepository($pdo);
$ref = new ReflectionMethod(TutorHubRepository::class, 'savedRegions');
$ref->setAccessible(true);

/** @var list<array{region_id: string, scope_type: string, is_primary: bool, region_selectable: bool}> $slots1 */
$slots1 = $ref->invoke($repo, 1);

ok('과외 1 슬롯 총 3개 반환 (최대 3개 고정)', count($slots1) === 3, 'count: ' . count($slots1));

// 슬롯 1 (101): selectable=1, active=1
ok('슬롯 1: region_id 101', (int)$slots1[0]['region_id'] === 101);
ok('슬롯 1: region_selectable === true', $slots1[0]['region_selectable'] === true);
ok('슬롯 1: is_primary === true', $slots1[0]['is_primary'] === true);

// 슬롯 2 (102): selectable=0, active=1 (옛 값)
ok('슬롯 2: region_id 102', (int)$slots1[1]['region_id'] === 102);
ok('슬롯 2: region_selectable === false (옛 값 신호)', $slots1[1]['region_selectable'] === false);

// 슬롯 3 (103): selectable=1, active=0 (비활성)
ok('슬롯 3: region_id 103', (int)$slots1[2]['region_id'] === 103);
ok('슬롯 3: region_selectable === false (비활성 신호)', $slots1[2]['region_selectable'] === false);

/** @var list<array{region_id: string, scope_type: string, is_primary: bool, region_selectable: bool}> $slots2 */
$slots2 = $ref->invoke($repo, 2);

// 과외 2 슬롯 1 (999): 존재하지 않는 region_id
ok('과외 2 슬롯 1: region_id 999', (int)$slots2[0]['region_id'] === 999);
ok('과외 2 슬롯 1: region_selectable === false (존재하지 않는 지역)', $slots2[0]['region_selectable'] === false);

// 과외 2 빈 슬롯 2: region_selectable === false
ok('과외 2 빈 슬롯 2: region_id 빈문자열', $slots2[1]['region_id'] === '');
ok('과외 2 빈 슬롯 2: region_selectable === false', $slots2[1]['region_selectable'] === false);

if ($failed > 0) {
    echo "\nFailed {$failed} checks\n";
    exit(1);
}

echo "\nAll SQLite region_selectable payload tests passed!\n";
exit(0);
