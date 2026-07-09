<?php



declare(strict_types=1);



require_once dirname(__DIR__, 3) . '/src/bootstrap.php';



use Study114\Paid\PaidApi;

use Study114\Paid\ProviderCheckoutService;



PaidApi::bootstrap();



PaidApi::run(static function (): void {

    $auth = PaidApi::requireProvider();

    $userId = (int) $auth['user_id'];

    $method = PaidApi::method();



    if ($method !== 'POST') {

        PaidApi::fail(405, 'method_not_allowed', 'POST만 허용됩니다.');

    }



    $input = PaidApi::readJson();

    $action = (string) ($input['action'] ?? 'create');

    $service = new ProviderCheckoutService();



    if ($action === 'complete') {

        $orderRef = trim((string) ($input['order_ref'] ?? ''));

        if ($orderRef === '') {

            PaidApi::fail(422, 'validation', 'order_ref가 필요합니다.');

        }

        PaidApi::ok($service->completeOrder($userId, $orderRef));

    }



    $productId = trim((string) ($input['product_id'] ?? ''));

    $variant = trim((string) ($input['variant'] ?? ''));

    if ($productId === '' || $variant === '') {

        PaidApi::fail(422, 'validation', 'product_id · variant가 필요합니다.');

    }



    PaidApi::ok($service->createOrder($userId, $productId, $variant));

});

