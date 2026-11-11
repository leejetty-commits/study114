<?php

declare(strict_types=1);

namespace Study114\Auth;

use InvalidArgumentException;

/** 같은 휴대폰 번호 계정 상한 초과 */
final class PhoneAccountLimitException extends InvalidArgumentException
{
    public function __construct()
    {
        parent::__construct(PhoneAccountLimit::MESSAGE);
    }

    public function errorCode(): string
    {
        return PhoneAccountLimit::ERROR_CODE;
    }
}
