<?php

declare(strict_types=1);

namespace Study114\Paid;

/**
 * 결제 전체 스위치와 가짜 결제 완료 스위치.
 * 둘 다 getenv 만 본다. $_ENV·$_SERVER·study114_env·config/app.php 의 env 는 보지 않는다.
 * 값이 없거나 '1'이 아니면 거절(fail closed). '0'·'true'·빈 문자열도 거절.
 */
final class PaidCheckoutGate
{
    public const CLOSED_MESSAGE = '결제를 진행할 수 없습니다. 잠시 후 다시 시도해 주세요.';

    /** 운영 기본 꺼짐. 1일 때만 주문 생성·완료·포트원 완료·웹훅 지급을 연다. */
    public static function paymentsEnabled(): bool
    {
        return getenv('STUDY114_PAYMENTS_ENABLED') === '1';
    }

    public static function mockCompleteAllowed(): bool
    {
        return getenv('STUDY114_PAID_MOCK_COMPLETE') === '1';
    }
}
