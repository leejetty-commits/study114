<?php

declare(strict_types=1);

namespace Study114\Registration;

use RuntimeException;

/** 필수 DDL이 운영 DB에 없을 때. 배포 전 스키마 적용이 막히지 않게 구분한다. */
final class SchemaPrerequisiteException extends RuntimeException
{
}
