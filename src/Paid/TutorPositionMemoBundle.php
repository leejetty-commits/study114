<?php

declare(strict_types=1);

namespace Study114\Paid;

/**
 * 과외쌤 Prime/Pick 구매 시 쪽지권 사은 지급.
 * 정본: PaidCatalog (PR-A). 공부방에는 지급하지 않는다.
 */
final class TutorPositionMemoBundle
{
    /**
     * @param 'study_room'|'tutor'|string|null $providerType
     */
    public static function memoCount(string $productId, string $variant, ?string $providerType): int
    {
        return PaidCatalog::memoBundle($productId, $variant, $providerType);
    }

    /**
     * 테스트·호환용 맵 (PaidCatalog 재수출)
     *
     * @return array<string, array<string, int>>
     */
    public static function map(): array
    {
        $out = ['pick' => [], 'prime' => []];
        foreach (PaidCatalog::PERIODS as $period) {
            $out['pick'][$period] = PaidCatalog::memoBundle('pick', $period, 'tutor');
            $out['prime'][$period] = PaidCatalog::memoBundle('prime', $period, 'tutor');
        }

        return $out;
    }
}
