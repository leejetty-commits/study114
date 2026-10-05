<?php

declare(strict_types=1);

/**
 * 사이트오류-27 · 공부방 프라임 소유 검사는 홍보지역(study_room_regions)만.
 * 사업장(study_rooms.region_id / complex_id) 폴백이 남아 있으면 실패한다.
 * 가짜 PDO. 사용: php scripts/verify-prime-region-ownership.php
 */

require_once dirname(__DIR__) . '/src/bootstrap.php';

use Study114\Paid\PrimeRegionScope;

final class OwnStmt
{
    private mixed $column = false;

    public function __construct(private OwnPdo $pdo, private string $sql) {}

    public function execute(?array $params = null): bool
    {
        $sql = preg_replace('/\s+/', ' ', trim($this->sql)) ?? '';
        $p = array_values($params ?? []);
        $this->pdo->log[] = $sql;
        $a = $this->pdo->answer($sql, $p);
        $this->column = array_key_exists('column', $a) ? $a['column'] : false;

        return true;
    }

    public function fetchColumn(mixed ...$a): mixed
    {
        return $this->column;
    }
}

final class OwnPdo extends PDO
{
    public array $log = [];

    public int $roomSelects = 0;

    /** @var list<array{study_room_id: int, region_id: int, complex_id: int|null, is_primary: int}> */
    public array $promo = [];

    /** @var list<array{id: int, region_id: int, complex_id: int|null}> */
    public array $rooms = [];

    public function __construct() {}

    #[\ReturnTypeWillChange]
    public function prepare(string $q, array $o = []): OwnStmt
    {
        return new OwnStmt($this, $q);
    }

    /** @param list<mixed> $p @return array{column?: mixed} */
    public function answer(string $sql, array $p): array
    {
        if (str_contains($sql, 'FROM study_rooms')) {
            $this->roomSelects++;
            $roomId = (int) ($p[0] ?? 0);
            $id = (int) ($p[1] ?? 0);
            foreach ($this->rooms as $row) {
                if ((int) $row['id'] !== $roomId) {
                    continue;
                }
                if (str_contains($sql, 'complex_id = ?')) {
                    if ((int) ($row['complex_id'] ?? 0) === $id) {
                        return ['column' => 1];
                    }
                } elseif ((int) ($row['region_id'] ?? 0) === $id) {
                    return ['column' => 1];
                }
            }

            return ['column' => false];
        }

        if (!str_contains($sql, 'FROM study_room_regions')) {
            return ['column' => false];
        }

        $roomId = (int) ($p[0] ?? 0);
        $id = (int) ($p[1] ?? 0);
        $complexLookup = str_contains($sql, 'AND complex_id = ?');
        $dongOnly = str_contains($sql, 'complex_id IS NULL');

        foreach ($this->promo as $row) {
            if ((int) $row['study_room_id'] !== $roomId) {
                continue;
            }
            if ($complexLookup) {
                if ((int) ($row['complex_id'] ?? 0) === $id) {
                    return ['column' => 1];
                }
                continue;
            }
            if ((int) ($row['region_id'] ?? 0) !== $id) {
                continue;
            }
            if ($dongOnly) {
                $cid = $row['complex_id'] ?? null;
                if ($cid !== null && (int) $cid !== 0) {
                    continue;
                }
            }

            return ['column' => 1];
        }

        return ['column' => false];
    }
}

$pass = 0;
$fail = 0;

function ok(string $name, bool $cond, string $detail = ''): void
{
    global $pass, $fail;
    if ($cond) {
        $pass++;
        echo 'PASS  ' . $name . "\n";

        return;
    }
    $fail++;
    echo 'FAIL  ' . $name . ($detail === '' ? '' : ' — ' . $detail) . "\n";
}

const REJECT = '선택한 적용 지역이 이 공부방의 대표 홍보지역이 아닙니다.';

function expectReject(PrimeRegionScope $scope, int $roomId, string $basis, ?int $regionId, ?int $complexId, string $name): void
{
    try {
        $scope->assertOwnedByStudyRoom($roomId, [
            'region_basis_type' => $basis,
            'region_id' => $regionId,
            'complex_id' => $complexId,
        ]);
        ok($name, false, '예외 없음');
    } catch (InvalidArgumentException $e) {
        ok($name, $e->getMessage() === REJECT, $e->getMessage());
    }
}

function expectPass(PrimeRegionScope $scope, int $roomId, string $basis, ?int $regionId, ?int $complexId, string $name): void
{
    try {
        $scope->assertOwnedByStudyRoom($roomId, [
            'region_basis_type' => $basis,
            'region_id' => $regionId,
            'complex_id' => $complexId,
        ]);
        ok($name, true);
    } catch (InvalidArgumentException $e) {
        ok($name, false, $e->getMessage());
    }
}

$pdo = new OwnPdo();
$scope = new PrimeRegionScope($pdo);

// 1) 홍보 행 없음. 사업장 region/complex 만 일치하면 거절.
$pdo->rooms = [['id' => 1, 'region_id' => 100, 'complex_id' => 200]];
$pdo->promo = [];
expectReject($scope, 1, 'dong', 100, null, '(1) 사업장 region_id만 맞으면 거절');
expectReject($scope, 1, 'complex', null, 200, '(1) 사업장 complex_id만 맞으면 거절');

// 2) 홍보 1·2·3 (is_primary=0 포함) 동/단지 통과. 단지 슬롯의 동 선택도 통과.
$pdo->rooms = [['id' => 1, 'region_id' => 999, 'complex_id' => 888]];
$pdo->promo = [
    ['study_room_id' => 1, 'region_id' => 11, 'complex_id' => null, 'is_primary' => 0],
    ['study_room_id' => 1, 'region_id' => 12, 'complex_id' => 22, 'is_primary' => 0],
    ['study_room_id' => 1, 'region_id' => 13, 'complex_id' => 0, 'is_primary' => 1],
];
expectPass($scope, 1, 'dong', 11, null, '(2) 홍보 동(대표 아님) 통과');
expectPass($scope, 1, 'complex', 12, 22, '(2) 홍보 단지 통과');
expectPass($scope, 1, 'dong', 12, null, '(2) 단지 슬롯의 같은 행정동 통과');
expectPass($scope, 1, 'dong', 13, null, '(2) complex_id 0 홍보 동 통과');
expectReject($scope, 1, 'dong', 999, null, '(2) 사업장만 같은 동은 홍보가 있으면 거절');
expectReject($scope, 1, 'complex', null, 888, '(2) 사업장만 같은 단지는 홍보가 있으면 거절');

// 3) 홍보 id와 사업장 id가 다름. 사업장 id는 거절, 홍보 id는 통과.
$pdo->rooms = [['id' => 1, 'region_id' => 10, 'complex_id' => 20]];
$pdo->promo = [
    ['study_room_id' => 1, 'region_id' => 30, 'complex_id' => 40, 'is_primary' => 0],
];
expectReject($scope, 1, 'dong', 10, null, '(3) 홍보와 다른 사업장 동 거절');
expectReject($scope, 1, 'complex', null, 20, '(3) 홍보와 다른 사업장 단지 거절');
expectPass($scope, 1, 'dong', 30, null, '(3) 홍보 행 region_id 통과');
expectPass($scope, 1, 'complex', null, 40, '(3) 홍보 행 complex_id 통과');
expectReject($scope, 2, 'dong', 30, null, '(3) 다른 공부방 홍보 행은 거절');

ok('(sql) study_rooms SELECT 폴백 호출 0', $pdo->roomSelects === 0, (string) $pdo->roomSelects);

$scopeSrc = (string) file_get_contents(dirname(__DIR__) . '/src/Paid/PrimeRegionScope.php');
$checkout = (string) file_get_contents(dirname(__DIR__) . '/src/Paid/ProviderCheckoutService.php');
$waitlist = (string) file_get_contents(dirname(__DIR__) . '/src/Paid/ProviderWaitlistService.php');
ok('(src) 소유 검사에 study_rooms SELECT 없음', !str_contains($scopeSrc, 'FROM study_rooms'));
ok('(src) 미시드 사업장 허용 주석 없음', !str_contains($scopeSrc, '미시드'));
ok(
    '(src) createOrder·fulfill 가 requireRoomPrimeRegionScope',
    substr_count($checkout, '$this->requireRoomPrimeRegionScope(') === 2,
    (string) substr_count($checkout, '$this->requireRoomPrimeRegionScope('),
);
ok('(src) 대기열이 assertOwnedByStudyRoom', str_contains($waitlist, 'assertOwnedByStudyRoom'));

echo "verify:prime-region-ownership — PASS {$pass} / FAIL {$fail}\n";
exit($fail > 0 ? 1 : 0);
