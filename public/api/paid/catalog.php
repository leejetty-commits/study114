<?php

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/src/bootstrap.php';

use Study114\Paid\PaidApi;
use Study114\Paid\PaidCatalog;

PaidApi::bootstrap();

// 읽기 전용 공개 카탈로그. requireProvider()를 호출하지 않는다.
// 응답은 상품 이름·가격·기간과 화면 카피에 필요한 카탈로그 필드만 담고, 회원·결제 정보는 없다.
PaidApi::run(static function (): void {
    $method = PaidApi::method();
    if ($method !== 'GET') {
        PaidApi::fail(405, 'method_not_allowed', 'GET만 허용됩니다.');
    }

    $role = isset($_GET['provider_type']) ? trim((string) $_GET['provider_type']) : '';
    $payload = PaidCatalog::export();

    if ($role === 'study_room' || $role === 'tutor') {
        $payload['products'] = array_values(array_filter(
            $payload['products'],
            static function (array $p) use ($role): bool {
                $pt = (string) ($p['provider_type'] ?? '');

                return $pt === 'both' || $pt === $role;
            },
        ));
        $payload['provider_type'] = $role;
    }

    PaidApi::ok($payload);
});
