<?php

declare(strict_types=1);

namespace Study114\Auth;

use InvalidArgumentException;

/** §16-2 — 위험 행동 전 이메일 인증 필요 */
final class EmailVerificationRequiredException extends InvalidArgumentException
{
}
