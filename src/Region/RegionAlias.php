<?php

declare(strict_types=1);

namespace Study114\Region;

/**
 * 서울시와 서울특별시는 같은 지역이다.
 * 다른 화면·검색 호출은 이 티켓에서 바꾸지 않는다.
 */
final class RegionAlias
{
    public static function canonicalSido(string $value): string
    {
        $compact = preg_replace('/\s+/u', '', trim($value)) ?? trim($value);
        if ($compact === '서울시' || $compact === '서울특별시') {
            return '서울특별시';
        }

        return trim($value);
    }
}
