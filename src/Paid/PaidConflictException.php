<?php

declare(strict_types=1);

namespace Study114\Paid;

use InvalidArgumentException;

/** 활성 유료 묶음권이 있어 새 5·10회권 구매를 거절한다. HTTP 409 conflict */
final class PaidConflictException extends InvalidArgumentException
{
}
