<?php

declare(strict_types=1);

namespace Study114\Paid;

/**
 * 과외쌤 Prime/Pick 구매 시 쪽지권 사은 지급 정본.
 * 공부방 포지션에는 지급하지 않는다.
 *
 * 화면 카탈로그(runtime-config.js TUTOR_POSITION_MEMO_BUNDLE)와 숫자를 맞출 것.
 */
final class TutorPositionMemoBundle
{
    /** @var array<string, array<string, int>> */
    public const MAP = [
        'pick' => [
            '2주' => 1,
            '1개월' => 2,
            '2개월' => 4,
        ],
        'prime' => [
            '1개월' => 5,
            '2개월' => 10,
        ],
    ];

    /**
     * @param 'study_room'|'tutor'|string|null $providerType
     */
    public static function memoCount(string $productId, string $variant, ?string $providerType): int
    {
        if ($providerType !== 'tutor') {
            return 0;
        }
        $n = self::MAP[$productId][$variant] ?? 0;

        return $n > 0 ? $n : 0;
    }
}
