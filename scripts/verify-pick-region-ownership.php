<?php

declare(strict_types=1);

/**
 * 사이트오류-30 · 공부방 Pick create/complete 도 홍보지역 1·2·3 소유.
 * 사업장(study_rooms.region_id / complex_id)만 같으면 거절.
 * 가짜 PDO. 사용: php scripts/verify-pick-region-ownership.php
 */

require_once dirname(__DIR__) . '/src/bootstrap.php';

use Study114\Paid\ProviderCheckoutService;

final class PickOwnStmt
{
    private mixed $column = false;

    /** @var array<string, mixed>|null */
    private ?array $row = null;

    private int $rowCount = 0;

    public function __construct(private PickOwnPdo $pdo, private string $sql) {}

    public function execute(?array $params = null): bool
    {
        $sql = preg_replace('/\s+/', ' ', trim($this->sql)) ?? '';
        $p = array_values($params ?? []);
        $this->pdo->log[] = $sql;
        $a = $this->pdo->answer($sql, $p);
        $this->column = array_key_exists('column', $a) ? $a['column'] : false;
        $this->row = array_key_exists('row', $a) && is_array($a['row']) ? $a['row'] : null;
        $this->rowCount = (int) ($a['rowCount'] ?? 0);

        return true;
    }

    public function fetchColumn(mixed ...$a): mixed
    {
        return $this->column;
    }

    public function fetch(mixed ...$a): mixed
    {
        return $this->row ?? false;
    }

    public function fetchAll(mixed ...$a): array
    {
        return $this->row !== null ? [$this->row] : [];
    }

    public function rowCount(): int
    {
        return $this->rowCount;
    }
}

final class PickOwnPdo extends PDO
{
    /** @var list<string> */
    public array $log = [];

    public int $roomRegionSelects = 0;

    public int $primeSql = 0;

    /** @var list<array{study_room_id: int, region_id: int, complex_id: int|null, is_primary: int}> */
    public array $promo = [];

    /** @var list<array{id: int, user_id: int, region_id: int, complex_id: int|null}> */
    public array $rooms = [];

    /** @var array<string, array<string, mixed>> */
    public array $orders = [];

    /** @var list<array{sql: string, params: list<mixed>}> */
    public array $subs = [];

    private bool $inTx = false;

    /** @var array<string, array<string, mixed>>|null */
    private ?array $txOrders = null;

    /** @var list<array{sql: string, params: list<mixed>}>|null */
    private ?array $txSubs = null;

    public function __construct() {}

    #[\ReturnTypeWillChange]
    public function prepare(string $q, array $o = []): PickOwnStmt
    {
        return new PickOwnStmt($this, $q);
    }

    public function beginTransaction(): bool
    {
        $this->txOrders = $this->orders;
        $this->txSubs = $this->subs;
        $this->inTx = true;

        return true;
    }

    public function commit(): bool
    {
        $this->txOrders = null;
        $this->txSubs = null;
        $this->inTx = false;

        return true;
    }

    public function rollBack(): bool
    {
        if ($this->txOrders !== null) {
            $this->orders = $this->txOrders;
        }
        if ($this->txSubs !== null) {
            $this->subs = $this->txSubs;
        }
        $this->inTx = false;

        return true;
    }

    public function inTransaction(): bool
    {
        return $this->inTx;
    }

    /**
     * @param list<mixed> $p
     * @return array{column?: mixed, row?: array<string, mixed>|null, rowCount?: int}
     */
    public function answer(string $sql, array $p): array
    {
        if (str_contains($sql, "sku_code = 'prime'")) {
            $this->primeSql++;
            if (str_contains($sql, 'COUNT')) {
                return ['column' => 99, 'rowCount' => 1];
            }

            return [
                'row' => ['id' => 1, 'provider_id' => 9, 'sku_code' => 'prime'],
                'rows' => [['id' => 1, 'provider_id' => 9, 'sku_code' => 'prime']],
            ];
        }

        if (str_contains($sql, 'information_schema')) {
            if (str_contains($sql, 'TABLES')) {
                return ['column' => false];
            }
            $table = (string) ($p[0] ?? '');
            $col = (string) ($p[1] ?? '');
            $orders = ['provider_type', 'catalog_version', 'fulfillment_status', 'price_snapshot_json'];
            $subs = ['region_basis_type', 'provider_type', 'region_id', 'complex_id', 'slot_group'];
            if ($table === 'provider_payment_orders' && in_array($col, $orders, true)) {
                return ['column' => 1];
            }
            if ($table === 'provider_position_subscriptions' && in_array($col, $subs, true)) {
                return ['column' => 1];
            }

            return ['column' => false];
        }

        if (str_contains($sql, 'FROM study_rooms')) {
            if (str_contains($sql, 'region_id') || str_contains($sql, 'complex_id')) {
                $this->roomRegionSelects++;

                return ['column' => false];
            }
            $id = (int) ($p[0] ?? 0);
            $userId = (int) ($p[1] ?? 0);
            foreach ($this->rooms as $row) {
                if ((int) $row['id'] === $id && (int) $row['user_id'] === $userId) {
                    return ['column' => 1];
                }
            }

            return ['column' => false];
        }

        if (str_contains($sql, 'FROM study_room_regions')) {
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

        if (str_contains($sql, 'INSERT INTO provider_payment_orders')) {
            $ref = (string) ($p[1] ?? '');
            $this->orders[$ref] = [
                'user_id' => (int) ($p[0] ?? 0),
                'order_ref' => $ref,
                'product_id' => (string) ($p[2] ?? ''),
                'variant_label' => (string) ($p[3] ?? ''),
                'product_kind' => (string) ($p[4] ?? ''),
                'provider_type' => (string) ($p[5] ?? ''),
                'provider_id' => (int) ($p[6] ?? 0),
                'amount_won' => (int) ($p[7] ?? 0),
                'catalog_version' => (string) ($p[8] ?? ''),
                'list_price_won' => (int) ($p[9] ?? 0),
                'discount_won' => (int) ($p[10] ?? 0),
                'price_snapshot_json' => (string) ($p[11] ?? ''),
                'status' => (string) ($p[12] ?? 'pending'),
                'pg_provider' => (string) ($p[13] ?? ''),
                'paid_at' => null,
                'fulfillment_status' => null,
                'fulfillment_error' => null,
            ];

            return ['rowCount' => 1];
        }

        if (str_contains($sql, 'FROM provider_payment_orders') && str_contains($sql, 'order_ref')) {
            $ref = (string) ($p[0] ?? '');
            $row = $this->orders[$ref] ?? null;

            return ['row' => $row];
        }

        if (str_contains($sql, 'UPDATE provider_payment_orders SET status')) {
            $ref = (string) ($p[1] ?? '');
            $from = (string) ($p[2] ?? '');
            $ok = isset($this->orders[$ref]) && (string) $this->orders[$ref]['status'] === $from;
            if ($ok) {
                $this->orders[$ref]['status'] = (string) ($p[0] ?? '');
                $this->orders[$ref]['paid_at'] = '2026-10-05 12:00:00';
            }

            return ['rowCount' => $ok ? 1 : 0];
        }

        if (str_contains($sql, 'SET fulfillment_status')) {
            $ref = (string) ($p[2] ?? '');
            if (isset($this->orders[$ref])) {
                $this->orders[$ref]['fulfillment_status'] = (string) ($p[0] ?? '');
                $this->orders[$ref]['fulfillment_error'] = $p[1];
            }

            return ['rowCount' => 1];
        }

        if (str_contains($sql, 'INSERT INTO provider_position_subscriptions')) {
            $this->subs[] = ['sql' => $sql, 'params' => $p];

            return ['rowCount' => 1];
        }

        return ['column' => false, 'rowCount' => 0];
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

$root = dirname(__DIR__);
$checkoutSrc = (string) file_get_contents($root . '/src/Paid/ProviderCheckoutService.php');
$ticketSrc = (string) file_get_contents($root . '/src/Paid/ProviderTicketRepository.php');
$scopeSrc = (string) file_get_contents($root . '/src/Paid/PrimeRegionScope.php');
$screens = (string) file_get_contents($root . '/preview/home-ui/src/plans/screens.js');
$waitlistApi = (string) file_get_contents($root . '/public/api/paid/waitlist.php');

ok(
    '(src) create·fulfill requireRoomPrimeRegionScope 2곳',
    substr_count($checkoutSrc, '$this->requireRoomPrimeRegionScope(') === 2,
    (string) substr_count($checkoutSrc, '$this->requireRoomPrimeRegionScope('),
);
ok(
    '(src) 공부방 pick create·fulfill 이 지역 스코프',
    substr_count($checkoutSrc, "\$providerType === 'study_room' && (\$productId === 'prime' || \$productId === 'pick')") === 2,
);
ok(
    '(src) 만석 검사는 prime 분기 안',
    (bool) preg_match("/if \\(\\\$productId === 'prime'\\) \\{[\\s\\S]*?assertRoomPrimeAvailableInScope/", $checkoutSrc)
    && (bool) preg_match("/if \\(\\\$productId === 'prime'\\) \\{[\\s\\S]*?lockActiveInScope/", $checkoutSrc),
);
ok('(src) 과외쌤 축 분기 유지', substr_count($checkoutSrc, "elseif (\$providerType === 'tutor')") === 2);
ok(
    '(src) writeRegion 이 pick 허용',
    str_contains($ticketSrc, "in_array(\$skuCode, ['prime', 'pick'], true)"),
);
ok('(src) 소유 검사에 study_rooms SELECT 없음', !str_contains($scopeSrc, 'FROM study_rooms'));
ok(
    '(fe) 픽 구매 클릭이 regionBasisType 없으면 중단',
    (bool) preg_match(
        "/role === 'study_room' &&\\s*\\(productCode === 'prime' \\|\\| productCode === 'pick'\\) &&\\s*\\(!region \\|\\| !region\\.regionBasisType\\)/",
        $screens,
    ),
);
ok(
    '(fe) 주문 CTA 도 픽 선택 지역',
    str_contains($screens, "selectedProduct?.productCode === 'prime' || selectedProduct?.productCode === 'pick'"),
);
ok(
    '(fe) getEligibility 가 pick regionReady',
    str_contains($screens, "if (productCode === 'prime' || productCode === 'pick')")
    && str_contains($screens, '!apply.regionReady'),
);
ok('(waitlist) Pick 422 유지', substr_count($waitlistApi, '예약대기는 공부방 Prime에만 사용할 수 있습니다.') >= 2);
ok('(waitlist) exposure_type prime 만', str_contains($waitlistApi, "\$exposureType !== '' && \$exposureType !== 'prime'"));

$pdo = new PickOwnPdo();
$pdo->rooms = [['id' => 9, 'user_id' => 3, 'region_id' => 100, 'complex_id' => 200]];
$pdo->promo = [
    ['study_room_id' => 9, 'region_id' => 11, 'complex_id' => null, 'is_primary' => 1],
    ['study_room_id' => 9, 'region_id' => 22, 'complex_id' => null, 'is_primary' => 0],
    ['study_room_id' => 9, 'region_id' => 33, 'complex_id' => 44, 'is_primary' => 0],
];
$svc = new ProviderCheckoutService(null, null, null, $pdo, null);

function expectCreateReject(ProviderCheckoutService $svc, array $region, string $needle, string $name): void
{
    try {
        $svc->createOrder(3, 'pick', '1개월', 'study_room', 9, [], [], $region);
        ok($name, false, '예외 없음');
    } catch (InvalidArgumentException $e) {
        ok($name, str_contains($e->getMessage(), $needle), $e->getMessage());
    } catch (Throwable $e) {
        ok($name, false, $e::class . ': ' . $e->getMessage());
    }
}

expectCreateReject($svc, [], '적용 지역을 먼저 선택해 주세요', '(create) 지역 없음 거절');
expectCreateReject(
    $svc,
    ['region_basis_type' => 'dong', 'region_id' => 100],
    REJECT,
    '(create) 사업장 동만 거절',
);
expectCreateReject(
    $svc,
    ['region_basis_type' => 'complex', 'complex_id' => 200],
    REJECT,
    '(create) 사업장 단지만 거절',
);
expectCreateReject(
    $svc,
    ['region_basis_type' => 'dong', 'region_id' => 77],
    REJECT,
    '(create) 홍보 미매칭 동 거절',
);

function seedPickOrder(PickOwnPdo $pdo, string $ref, array $region): void
{
    $pdo->orders[$ref] = [
        'user_id' => 3,
        'order_ref' => $ref,
        'product_id' => 'pick',
        'variant_label' => '1개월',
        'product_kind' => 'position',
        'provider_type' => 'study_room',
        'provider_id' => 9,
        'amount_won' => 10000,
        'catalog_version' => 'test',
        'list_price_won' => 10000,
        'discount_won' => 0,
        'price_snapshot_json' => json_encode(['prime_region' => $region], JSON_UNESCAPED_UNICODE),
        'status' => 'pending',
        'pg_provider' => 'dev_mock',
        'paid_at' => null,
        'fulfillment_status' => null,
        'fulfillment_error' => null,
    ];
}

function expectCompleteReject(ProviderCheckoutService $svc, PickOwnPdo $pdo, string $ref, array $region, string $name): void
{
    seedPickOrder($pdo, $ref, $region);
    $before = count($pdo->subs);
    try {
        $svc->completeOrder(3, $ref);
        ok($name, false, '예외 없음');
    } catch (InvalidArgumentException $e) {
        ok($name, str_contains($e->getMessage(), REJECT) && count($pdo->subs) === $before, $e->getMessage());
    } catch (Throwable $e) {
        ok($name, false, $e::class . ': ' . $e->getMessage());
    }
}

expectCompleteReject(
    $svc,
    $pdo,
    'pick-biz-dong',
    ['region_basis_type' => 'dong', 'region_id' => 100, 'complex_id' => null, 'slot_group' => '사업장'],
    '(complete) 사업장 동만 거절',
);
expectCompleteReject(
    $svc,
    $pdo,
    'pick-biz-complex',
    ['region_basis_type' => 'complex', 'region_id' => null, 'complex_id' => 200, 'slot_group' => '사업장단지'],
    '(complete) 사업장 단지만 거절',
);
expectCompleteReject(
    $svc,
    $pdo,
    'pick-miss',
    ['region_basis_type' => 'dong', 'region_id' => 77, 'complex_id' => null, 'slot_group' => '없음'],
    '(complete) 홍보 미매칭 거절',
);

/**
 * @param array<string, mixed> $region
 */
function expectPickPass(
    ProviderCheckoutService $svc,
    PickOwnPdo $pdo,
    array $region,
    string $basis,
    ?int $regionId,
    ?int $complexId,
    string $name,
): void {
    $primeBefore = $pdo->primeSql;
    $subBefore = count($pdo->subs);
    try {
        $created = $svc->createOrder(3, 'pick', '1개월', 'study_room', 9, [], [], $region);
    } catch (Throwable $e) {
        ok($name . ' create', false, $e::class . ': ' . $e->getMessage());

        return;
    }
    $snap = is_array($created['price_snapshot']['prime_region'] ?? null) ? $created['price_snapshot']['prime_region'] : [];
    ok(
        $name . ' 스냅샷',
        ($snap['region_basis_type'] ?? '') === $basis
        && (($regionId === null && ($snap['region_id'] ?? null) === null) || (int) ($snap['region_id'] ?? 0) === (int) $regionId)
        && (($complexId === null && ($snap['complex_id'] ?? null) === null) || (int) ($snap['complex_id'] ?? 0) === (int) $complexId),
        json_encode($snap, JSON_UNESCAPED_UNICODE) ?: '',
    );
    try {
        $done = $svc->completeOrder(3, (string) $created['order_ref']);
    } catch (Throwable $e) {
        ok($name . ' complete', false, $e::class . ': ' . $e->getMessage());

        return;
    }
    ok($name . ' complete', ($done['fulfilled'] ?? false) === true && ($done['product_id'] ?? '') === 'pick');
    $sub = $pdo->subs[count($pdo->subs) - 1] ?? null;
    $params = is_array($sub) ? $sub['params'] : [];
    $sql = is_array($sub) ? $sub['sql'] : '';
    ok(
        $name . ' 구독 스코프',
        count($pdo->subs) === $subBefore + 1
        && str_contains($sql, 'region_basis_type')
        && ($params[1] ?? '') === 'study_room'
        && ($params[3] ?? '') === $basis
        && ($regionId === null ? ($params[4] ?? null) === null : (int) ($params[4] ?? 0) === $regionId)
        && ($complexId === null ? ($params[5] ?? null) === null : (int) ($params[5] ?? 0) === $complexId)
        && ($params[7] ?? '') === 'pick'
        && $pdo->primeSql === $primeBefore,
        $sql . ' ' . json_encode($params, JSON_UNESCAPED_UNICODE),
    );
}

expectPickPass(
    $svc,
    $pdo,
    ['region_basis_type' => 'dong', 'region_id' => 22, 'slot_group' => '홍보2'],
    'dong',
    22,
    null,
    '(홍보2)',
);
expectPickPass(
    $svc,
    $pdo,
    ['region_basis_type' => 'complex', 'region_id' => 33, 'complex_id' => 44, 'slot_group' => '홍보3'],
    'complex',
    33,
    44,
    '(홍보3)',
);

ok('(sql) 사업장 region SELECT 0', $pdo->roomRegionSelects === 0, (string) $pdo->roomRegionSelects);

echo "verify:pick-region-ownership — PASS {$pass} / FAIL {$fail}\n";
exit($fail > 0 ? 1 : 0);
