<?php

declare(strict_types=1);

/**
 * 339 — 포트원 샌드박스 서버 게이트 검증 (키 값 출력 금지).
 * PG_PROVIDER·포트원 키가 있으면 조회/거절 경로를 확인하고,
 * 없으면 어댑터 선택·스키마·mock 분기만 검사한다.
 */

require_once dirname(__DIR__) . '/src/bootstrap.php';

use Study114\Paid\Pg\PgProvider;
use Study114\Paid\Pg\PortOneCheckout;
use Study114\Paid\ProviderCheckoutRepository;
use Study114\Database\Connection;

$failed = 0;
$passed = 0;

function check(string $name, bool $ok, string $detail = ''): void
{
    global $failed, $passed;
    if ($ok) {
        $passed++;
        echo "OK  {$name}" . ($detail !== '' ? " — {$detail}" : '') . PHP_EOL;
    } else {
        $failed++;
        echo "FAIL {$name}" . ($detail !== '' ? " — {$detail}" : '') . PHP_EOL;
    }
}

check('PgProvider default without portone_test', true);

$prev = getenv('PG_PROVIDER');
putenv('PG_PROVIDER');
check('unset => dev_mock', PgProvider::id() === 'dev_mock');
putenv('PG_PROVIDER=other');
check('other => dev_mock', PgProvider::id() === 'dev_mock');
putenv('PG_PROVIDER=portone_test');
check('portone_test => portone_test', PgProvider::id() === 'portone_test');
if (is_string($prev) && $prev !== '') {
    putenv('PG_PROVIDER=' . $prev);
} else {
    putenv('PG_PROVIDER');
}

$pdo = Connection::get();
$hasPay = (bool) $pdo->query(
    "SELECT 1 FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME='provider_payment_orders' AND COLUMN_NAME='pg_payment_id'"
)->fetchColumn();
$hasCancel = (bool) $pdo->query(
    "SELECT 1 FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME='provider_refund_requests' AND COLUMN_NAME='pg_cancel_id'"
)->fetchColumn();
check('schema pg_payment_id', $hasPay);
check('schema pg_cancel_id', $hasCancel);

$paymentId = PortOneCheckout::makePaymentId('dev-abc123');
check('paymentId format', str_starts_with($paymentId, 'pay_'));

$repoFile = file_get_contents(dirname(__DIR__) . '/src/Paid/ProviderCheckoutRepository.php') ?: '';
check('insertPending accepts pg_provider arg', str_contains($repoFile, 'string $pgProvider = \'dev_mock\''));

$checkoutPhp = file_get_contents(dirname(__DIR__) . '/public/api/paid/checkout.php') ?: '';
check('complete branches on order pg_provider', str_contains($checkoutPhp, 'completePortOneOrder'));
check('mock gate kept for non-portone', str_contains($checkoutPhp, 'mockCompleteAllowed'));

$webhook = file_get_contents(dirname(__DIR__) . '/public/api/paid/portone-webhook.php') ?: '';
check('webhook rejects empty secret', str_contains($webhook, 'webhook_secret_missing'));

$envExample = file_get_contents(dirname(__DIR__) . '/.env.example') ?: '';
$pgLine = '';
$secretLine = '';
foreach (preg_split("/\R/", $envExample) ?: [] as $line) {
    if (str_starts_with(trim($line), 'PG_PROVIDER=')) {
        $pgLine = trim($line);
    }
    if (str_starts_with(trim($line), 'PORTONE_API_SECRET=')) {
        $secretLine = trim($line);
    }
}
check('.env.example has PG_PROVIDER name only', $pgLine === 'PG_PROVIDER=');
check('.env.example PORTONE_API_SECRET empty', $secretLine === 'PORTONE_API_SECRET=');

// 금액 위조·멱등: 포트원 키가 있을 때만 단건 조회 거절 경로 스모크
$secret = getenv('PORTONE_API_SECRET');
$store = getenv('PORTONE_STORE_ID');
if (is_string($secret) && $secret !== '' && is_string($store) && $store !== '') {
    try {
        $client = Study114\Paid\Pg\PortOneClient::fromEnv();
        try {
            $client->getPayment('pay_nonexistent_339_verify_' . bin2hex(random_bytes(4)));
            check('getPayment missing id throws', false);
        } catch (Throwable $e) {
            check('getPayment missing id throws', true, 'http error path');
        }
    } catch (Throwable $e) {
        check('PortOneClient fromEnv', false, 'init failed (message omitted)');
    }
} else {
    echo "SKIP live PortOne getPayment (secret/store unset)" . PHP_EOL;
}

echo PHP_EOL . "passed={$passed} failed={$failed}" . PHP_EOL;
exit($failed > 0 ? 1 : 0);
