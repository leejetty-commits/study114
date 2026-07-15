<?php

declare(strict_types=1);

namespace Study114\Auth;

final class OAuthProviderLabels
{
    /** @var array<string, string> */
    private const LABELS = [
        'naver'  => '네이버',
        'kakao'  => '카카오',
        'google' => '구글',
    ];

    public static function label(string $provider): string
    {
        return self::LABELS[$provider] ?? $provider;
    }

    /**
     * @param list<string> $providers
     * @return list<string>
     */
    public static function labels(array $providers): array
    {
        $out = [];
        foreach ($providers as $p) {
            $out[] = self::label((string) $p);
        }

        return $out;
    }
}
