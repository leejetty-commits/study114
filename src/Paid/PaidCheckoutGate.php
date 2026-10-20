<?php

declare(strict_types=1);

namespace Study114\Paid;

/**
 * 실결제 확인이 생기기 전까지 구매 완료·지급을 막는다.
 * 출처는 getenv 하나다. $_ENV·$_SERVER·study114_env·config/app.php 의 env 는 보지 않는다.
 * 값이 없거나 '1'이 아니면 거절(fail closed). '0'·'true'·빈 문자열도 거절.
 */
final class PaidCheckoutGate
{
    public const CLOSED_MESSAGE = '결제 기능을 준비하고 있어요. 곧 열릴 예정이에요';

    public static function mockCompleteAllowed(): bool
    {
        return getenv('STUDY114_PAID_MOCK_COMPLETE') === '1';
    }
}
