<?php

declare(strict_types=1);

namespace Study114\Paid;

use InvalidArgumentException;
use Study114\Database\Connection;
use Study114\Messages\ProviderEntitlementRepository;

/** 18a — P18-02 ROI 무료 3종 요약 */
final class ProviderRoiService
{
    private ProviderRoiRepository $roi;
    private ProviderEntitlementRepository $entitlements;

    public function __construct(
        ?ProviderRoiRepository $roi = null,
        ?ProviderEntitlementRepository $entitlements = null,
    ) {
        $pdo = Connection::get();
        $this->roi = $roi ?? new ProviderRoiRepository($pdo);
        $this->entitlements = $entitlements ?? new ProviderEntitlementRepository($pdo);
    }

    /** @return array<string, mixed> */
    public function getSummary(int $providerUserId, int $days = 7): array
    {
        if ($days < 1 || $days > 90) {
            throw new InvalidArgumentException('days는 1~90이어야 합니다.');
        }

        $ent = $this->entitlements->getForUser($providerUserId);
        $tier = $ent !== null ? (string) $ent['subscription_tier'] : 'free';

        $views = $this->roi->countViewsForProvider($providerUserId, $days);
        $wishlist = $this->roi->countFavoritesForProvider($providerUserId);
        $compare = $this->roi->countCompareForProvider($providerUserId);

        return [
            'tier' => $tier,
            'days' => $days,
            'metrics' => [
                $this->metric('views', '조회', $views, "최근 {$days}일", '상세·검색 카드 열람'),
                $this->metric('wishlist', '찜', $wishlist, '누적', '학부모 찜 목록'),
                $this->metric('compare', '비교 담김', $compare, '누적', '비교 후보함 (≤3)'),
            ],
        ];
    }

    public function recordProfileView(string $targetType, int $targetId, ?int $viewerUserId): void
    {
        if (!in_array($targetType, ['study_room', 'tutor'], true)) {
            return;
        }
        if ($targetId <= 0) {
            return;
        }
        $this->roi->recordProfileView($targetType, $targetId, $viewerUserId);
    }

    /** @return array<string, mixed> */
    private function metric(string $id, string $label, int $value, string $period, string $hint): array
    {
        return [
            'id' => $id,
            'label' => $label,
            'value' => $value,
            'period' => $period,
            'hint' => $hint,
        ];
    }
}
