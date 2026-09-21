<?php

declare(strict_types=1);

namespace Study114\Auth;

use InvalidArgumentException;

/** 공급자 가입단계 본인확인이 required 인데 서버 저장값이 없는 경우 */
final class ProviderIdentityRequiredException extends InvalidArgumentException
{
}
