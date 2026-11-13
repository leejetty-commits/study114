<?php

declare(strict_types=1);

namespace Study114\QuickMatch;

use Study114\Paid\ProviderTicketRepository;

/** 프라임 활성은 기존 구독 조회만 재사용한다. 결제·환불 계산은 바꾸지 않는다. */
final class QuickMatchPrimeGate
{
    public function __construct(private readonly ProviderTicketRepository $tickets)
    {
    }

    public function isPrimeActive(int $userId, ?string $providerType = null, ?int $providerId = null): bool
    {
        foreach ($this->tickets->listActivePositions($userId, $providerType, $providerId) as $row) {
            if ((string) ($row['sku_code'] ?? '') === 'prime') {
                return true;
            }
        }

        return false;
    }

    /**
     * 지금 광고 중인 프라임 지역.
     *
     * @return list<array<string, mixed>>
     */
    public function activePrimeRegions(int $userId, ?string $providerType = null, ?int $providerId = null): array
    {
        $out = [];
        foreach ($this->tickets->listActivePositions($userId, $providerType, $providerId) as $row) {
            if ((string) ($row['sku_code'] ?? '') !== 'prime') {
                continue;
            }
            $out[] = $row;
        }

        return $out;
    }
}
