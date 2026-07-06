<?php

declare(strict_types=1);

namespace Study114\Auth;

final class EmailNormalizer
{
    public static function normalize(string $email): string
    {
        return strtolower(trim($email));
    }
}
