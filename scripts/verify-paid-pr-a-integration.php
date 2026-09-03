<?php

declare(strict_types=1);

/**
 * PR-A CI — catalog HTTP · checkout createOrder · 061 전/후 INSERT · history
 * 사용:
 *   php scripts/verify-paid-pr-a-integration.php --phase=pre061
 *   php scripts/verify-paid-pr-a-integration.php --phase=post061
 *   php scripts/verify-paid-pr-a-integration.php --phase=http
 */

require_once dirname(__DIR__) . '/src/bootstrap.php';

use Study114\Database\Connection;
use Study114\Paid\PaidCatalog;
use Study114\Paid\ProviderCheckoutService;

$phase = 'pre061';
foreach (array_slice($argv ?? [], 1) as $arg) {
    if (str_starts_with($arg, '--phase=')) {
        $phase = substr($arg, 8);
    }
}

$failed = 0;

function check(string $name, bool $ok, string $detail = ''): void
{
    global $failed;
    if ($ok) {
        echo "OK  {$name}" . ($detail !== '' ? " — {$detail}" : '') . "\n";

        return;
    }
    $failed++;
    fwrite(STDERR, "FAIL {$name}" . ($detail !== '' ? " — {$detail}" : '') . "\n");
}

function expectThrow(string $name, callable $fn): void
{
    $threw = false;
    try {
        $fn();
    } catch (InvalidArgumentException $e) {
        $threw = true;
    }
    check($name, $threw);
}

function httpJson(string $method, string $url, ?array $body = null): array
{
    $ctx = stream_context_create([
        'http' => [
            'method' => $method,
            'header' => "Content-Type: application/json\r\nAccept: application/json\r\n",
            'content' => $body !== null ? json_encode($body, JSON_UNESCAPED_UNICODE) : '',
            'ignore_errors' => true,
            'timeout' => 10,
        ],
    ]);
    $raw = file_get_contents($url, false, $ctx);
    $status = 0;
    if (isset($http_response_header[0]) && preg_match('/\s(\d{3})\s/', $http_response_header[0], $m)) {
        $status = (int) $m[1];
    }
    $decoded = json_decode(is_string($raw) ? $raw : '{}', true);

    return [
        'status' => $status,
        'json' => is_array($decoded) ? $decoded : [],
        'raw' => is_string($raw) ? $raw : '',
    ];
}

if ($phase === 'http') {
    $base = rtrim((string) getenv('CATALOG_BASE_URL') ?: 'http://127.0.0.1:18080', '/');

    $all = httpJson('GET', $base . '/api/paid/catalog.php');
    check('catalog_http_200', $all['status'] === 200 && ($all['json']['ok'] ?? false) === true);
    check('catalog_http_version', ($all['json']['catalog_version'] ?? '') === PaidCatalog::VERSION);
    $products = $all['json']['products'] ?? [];
    check('catalog_http_products', is_array($products) && count($products) >= 10);

    $room = httpJson('GET', $base . '/api/paid/catalog.php?provider_type=study_room');
    $tutor = httpJson('GET', $base . '/api/paid/catalog.php?provider_type=tutor');
    check('catalog_room_filter', ($room['json']['provider_type'] ?? '') === 'study_room');
    check('catalog_tutor_filter', ($tutor['json']['provider_type'] ?? '') === 'tutor');

    $find = static function (array $payload, string $code, string $role): ?array {
        foreach ($payload['products'] ?? [] as $p) {
            if (($p['product_code'] ?? '') === $code && ($p['provider_type'] ?? '') === $role) {
                return $p;
            }
        }

        return null;
    };
    $primeRoom = $find($room['json'], 'prime', 'study_room');
    $sale = null;
    if (is_array($primeRoom)) {
        foreach ($primeRoom['options'] ?? [] as $opt) {
            if (($opt['variant'] ?? '') === '1개월') {
                $sale = (int) ($opt['sale_price_krw'] ?? 0);
            }
        }
    }
    check('catalog_room_prime_1m', $sale === 50000);

    $bundle = null;
    $primeTutor = $find($tutor['json'], 'prime', 'tutor');
    if (is_array($primeTutor)) {
        foreach ($primeTutor['options'] ?? [] as $opt) {
            if (($opt['variant'] ?? '') === '1개월') {
                $bundle = (int) ($opt['memo_bundle'] ?? -1);
            }
        }
    }
    check('catalog_tutor_free_memo_1m', $bundle === 5);

    $memo = null;
    foreach ($all['json']['products'] ?? [] as $p) {
        if (($p['product_code'] ?? '') === 'memo_ticket') {
            $memo = $p;
            break;
        }
    }
    $variants = [];
    if (is_array($memo)) {
        foreach ($memo['options'] ?? [] as $opt) {
            $variants[] = (string) ($opt['variant'] ?? '');
        }
    }
    check('catalog_memo_no_20', !in_array('20회권', $variants, true) && count($variants) === 3);

    $checkout = httpJson('POST', $base . '/api/paid/checkout.php', [
        'action' => 'create',
        'product_id' => 'memo_ticket',
        'variant' => '5회권',
        'amount_won' => 10,
    ]);
    check('checkout_http_requires_auth', $checkout['status'] === 401);

    $status = httpJson('GET', $base . '/api/paid/status.php');
    $history = httpJson('GET', $base . '/api/paid/history.php');
    $ent = httpJson('GET', $base . '/api/messages/entitlements.php');
    check('status_http_requires_auth', $status['status'] === 401);
    check('history_http_requires_auth', $history['status'] === 401);
    check('messages_entitlements_requires_auth', in_array($ent['status'], [401, 403], true));

    if ($failed > 0) {
        fwrite(STDERR, "{$failed} failed (http)\n");
        exit(1);
    }
    echo "all ok (http)\n";
    exit(0);
}

$pdo = Connection::get();
$svc = new ProviderCheckoutService(null, null, null, $pdo);
$userId = 4;

$hasCatalogCol = (bool) $pdo->query(
    "SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'provider_payment_orders'
       AND COLUMN_NAME = 'catalog_version'"
)->fetchColumn();

if ($phase === 'pre061') {
    check('schema_061_absent', $hasCatalogCol === false);

    $created = $svc->createOrder($userId, 'memo_ticket', '5회권', null, null);
    check('checkout_memo5_amount', (int) $created['amount_won'] === 4500, (string) $created['amount_won']);
    check('checkout_memo5_pending', ($created['status'] ?? '') === 'pending');
    check('checkout_ignores_client_price_contract', !array_key_exists('client_amount', $created));

    $row = $pdo->prepare('SELECT amount_won FROM provider_payment_orders WHERE order_ref = ?');
    $row->execute([$created['order_ref']]);
    check('db_amount_server_sale', (int) $row->fetchColumn() === 4500);

    expectThrow('reject_20회권', static fn () => $svc->createOrder($userId, 'memo_ticket', '20회권'));
    expectThrow('reject_unknown_sku', static fn () => $svc->createOrder($userId, 'unknown_sku', '1개월', 'tutor', 1));
    expectThrow('reject_prime_no_role', static fn () => $svc->createOrder($userId, 'prime', '1개월'));
    expectThrow('reject_unknown_period', static fn () => $svc->createOrder($userId, 'prime', '3주', 'tutor', 1));
    expectThrow('reject_wrong_role_badge', static fn () => $svc->createOrder($userId, 'subject_track', '1개월', 'tutor', 1));

    $badge = $svc->createOrder($userId, 'hot', '포지션종속', 'tutor', 1);
    check('badge_inherited_period', ($badge['variant_label'] ?? '') === '1개월');
    check('badge_inherited_amount', (int) $badge['amount_won'] === 10000, (string) $badge['amount_won']);

    expectThrow(
        'badge_period_mismatch',
        static fn () => $svc->createOrder($userId, 'hot', '2개월', 'tutor', 1),
    );

    $history = $svc->listOrders($userId, 20);
    $refs = array_column($history['orders'], 'order_ref');
    check('history_lists_created', in_array($created['order_ref'], $refs, true));
    $memoRow = null;
    foreach ($history['orders'] as $o) {
        if ($o['order_ref'] === $created['order_ref']) {
            $memoRow = $o;
        }
    }
    check('history_amount_4500', is_array($memoRow) && (int) $memoRow['amount_won'] === 4500);
    check('history_catalog_null_without_061', is_array($memoRow) && $memoRow['catalog_version'] === null);
}

if ($phase === 'post061') {
    check('schema_061_present', $hasCatalogCol === true);
    $created = $svc->createOrder($userId, 'memo_ticket', '10회권', null, null);
    check('post061_amount', (int) $created['amount_won'] === 8000);
    $row = $pdo->prepare(
        'SELECT amount_won, catalog_version, list_price_won FROM provider_payment_orders WHERE order_ref = ?'
    );
    $row->execute([$created['order_ref']]);
    $snap = $row->fetch(PDO::FETCH_ASSOC);
    check('post061_snapshot_version', is_array($snap) && (string) $snap['catalog_version'] === PaidCatalog::VERSION);
    check('post061_snapshot_amount', is_array($snap) && (int) $snap['amount_won'] === 8000);

    $prime = $svc->createOrder($userId, 'prime', '1개월', 'tutor', 1);
    check('post061_prime_recalc', (int) $prime['amount_won'] === 30000);
}

if ($failed > 0) {
    fwrite(STDERR, "{$failed} failed ({$phase})\n");
    exit(1);
}
echo "all ok ({$phase})\n";
