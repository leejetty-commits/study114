<?php

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/src/bootstrap.php';

use Study114\Database\Connection;
use Study114\Paid\PaidApi;
use Study114\Paid\PaidCheckoutGate;
use Study114\Paid\Pg\PgProvider;
use Study114\Paid\ProviderCheckoutRepository;
use Study114\Paid\ProviderCheckoutService;

PaidApi::bootstrap();

PaidApi::run(static function (): void {
    $auth = PaidApi::requireProvider();
    $userId = (int) $auth['user_id'];
    $method = PaidApi::method();

    if ($method === 'GET') {
        PaidApi::ok(['payments_enabled' => PaidCheckoutGate::paymentsEnabled()]);
    }

    if ($method !== 'POST') {
        PaidApi::fail(405, 'method_not_allowed', 'POST만 허용됩니다.');
    }

    if (!PaidCheckoutGate::paymentsEnabled()) {
        PaidApi::fail(403, 'payment_not_available', PaidCheckoutGate::CLOSED_MESSAGE);
    }

    $input = PaidApi::readJson();
    $action = (string) ($input['action'] ?? 'create');
    $service = new ProviderCheckoutService();

    if ($action === 'complete') {
        $orderRef = trim((string) ($input['order_ref'] ?? ''));
        if ($orderRef === '') {
            PaidApi::fail(422, 'validation', 'order_ref가 필요합니다.');
        }

        $orders = new ProviderCheckoutRepository(Connection::get());
        $existing = $orders->getByRef($orderRef);
        if ($existing === null || (int) ($existing['user_id'] ?? 0) !== $userId) {
            PaidApi::fail(404, 'not_found', '주문을 찾을 수 없습니다.');
        }

        $orderPg = (string) ($existing['pg_provider'] ?? PgProvider::DEV_MOCK);
        if (PgProvider::usesPortOne($orderPg)) {
            $claimedPaymentId = isset($input['payment_id']) ? trim((string) $input['payment_id']) : null;
            try {
                PaidApi::ok($service->completePortOneOrder($userId, $orderRef, $claimedPaymentId));
            } catch (InvalidArgumentException $e) {
                PaidApi::fail(422, 'payment_verify_failed', $e->getMessage());
            } catch (Throwable $e) {
                error_log('[portone] complete failed order_ref=' . $orderRef . ' err=' . $e->getMessage());
                PaidApi::fail(502, 'payment_verify_failed', '결제 확인에 실패했습니다. 잠시 후 다시 시도해 주세요.');
            }
        }

        if (!PaidCheckoutGate::mockCompleteAllowed()) {
            PaidApi::fail(403, 'payment_not_available', PaidCheckoutGate::CLOSED_MESSAGE);
        }
        PaidApi::ok($service->completeOrder($userId, $orderRef));
    }

    $productId = trim((string) ($input['product_id'] ?? ''));
    $variant = trim((string) ($input['variant'] ?? ''));
    if ($productId === '' || $variant === '') {
        PaidApi::fail(422, 'validation', 'product_id · variant가 필요합니다.');
    }

    $providerType = isset($input['provider_type']) ? trim((string) $input['provider_type']) : null;
    if ($providerType === '') {
        $providerType = null;
    }
    $providerIdRaw = $input['provider_id'] ?? null;
    $providerId = $providerIdRaw !== null && $providerIdRaw !== '' ? (int) $providerIdRaw : null;

    $memoIntent = [];
    if (isset($input['student_id']) || isset($input['body'])) {
        $memoIntent = [
            'student_id' => (int) ($input['student_id'] ?? 0),
            'body' => (string) ($input['body'] ?? ''),
            'context_label' => (string) ($input['context_label'] ?? ''),
            'peer_display_name' => (string) ($input['peer_display_name'] ?? ''),
        ];
    }

    $badgeCodes = [];
    if (isset($input['badge_codes']) && is_array($input['badge_codes'])) {
        foreach ($input['badge_codes'] as $code) {
            $badgeCodes[] = (string) $code;
        }
    }

    $regionInput = [];
    foreach (['region_basis_type', 'region_basis', 'region_id', 'complex_id', 'slot_group', 'region_label', 'city_id', 'primary_subject_id'] as $rk) {
        if (array_key_exists($rk, $input)) {
            $regionInput[$rk] = $input[$rk];
        }
    }

    PaidApi::ok($service->createOrder(
        $userId,
        $productId,
        $variant,
        $providerType,
        $providerId,
        $memoIntent,
        $badgeCodes,
        $regionInput,
    ));
});
