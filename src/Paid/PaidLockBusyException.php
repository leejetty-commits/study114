<?php

declare(strict_types=1);

namespace Study114\Paid;

use InvalidArgumentException;

/** GET_LOCK 대기 초과. 자동취소하지 않고 다시 시도할 수 있는 실패로 둔다. */
final class PaidLockBusyException extends InvalidArgumentException
{
}
