<?php

declare(strict_types=1);

namespace Study114\Paid;

use Study114\Database\Connection;
use Study114\Messages\ProviderEntitlementRepository;

/**
 * 18§ 통합 — 기간형 · 쪽지권 · 열람권 · bypass · 재열람 예외 단일 조회 모델
 * (SSOT 문서 ticket_ledger → 구현체 provider_ticket_packs)
 */
final class ProviderStatusService
{
    private ProviderEntitlementRepository $entitlements;
    private ProviderTicketService $tickets;

    public function __construct(
        ?ProviderEntitlementRepository $entitlements = null,
        ?ProviderTicketService $tickets = null,
    ) {
        $pdo = Connection::get();
        $this->entitlements = $entitlements ?? new ProviderEntitlementRepository($pdo);
        $this->tickets = $tickets ?? new ProviderTicketService();
    }

    /**
     * @return array{
     *   is_provider: bool,
     *   subscription_tier: string,
     *   cold_memo: array{can_send: bool, bypass: bool, remaining: int, legacy_credits: int, nearest_expiry: string|null},
     *   request_view: array{remaining: int, nearest_expiry: string|null, unlocked_student_ids: list<int>},
     *   exposure: array{state: string, label: string, positions: list<array<string, mixed>>},
     *   cold_memo_allowed: bool,
     *   memo_credits: int,
     *   memo_tickets: int,
     *   memo_nearest_expiry: string|null,
     *   request_view_tickets: int,
     *   can_cold_memo: bool
     * }
     */
    public function build(int $userId, bool $isProvider): array
    {
        $row = $this->entitlements->getForUser($userId);
        $tier = $row !== null ? (string) $row['subscription_tier'] : 'free';
        $legacyCredits = $row !== null ? (int) $row['memo_credits'] : 0;
        $bypass = $row !== null && (bool) $row['cold_memo_allowed'];

        $memoSummary = $this->tickets->getMemoTicketSummary($userId);
        $viewSummary = $this->tickets->getRequestViewTicketSummary($userId);
        $canColdMemo = $isProvider && $this->tickets->canColdMemo($userId);
        $unlockedIds = $isProvider ? $this->tickets->listUnlockedStudentIds($userId) : [];
        $exposure = $isProvider
            ? $this->tickets->getOperationalStatus($userId)['exposure']
            : $this->emptyExposure();

        $coldMemo = [
            'can_send' => $canColdMemo,
            'bypass' => $bypass,
            'remaining' => $memoSummary['remaining'],
            'legacy_credits' => $legacyCredits,
            'nearest_expiry' => $memoSummary['nearest_expiry'],
        ];

        $requestView = [
            'remaining' => $viewSummary['remaining'],
            'nearest_expiry' => $viewSummary['nearest_expiry'],
            'unlocked_student_ids' => $unlockedIds,
        ];

        return [
            'is_provider' => $isProvider,
            'subscription_tier' => $tier,
            'cold_memo' => $coldMemo,
            'request_view' => $requestView,
            'exposure' => $exposure,
            'cold_memo_allowed' => $bypass,
            'memo_credits' => $legacyCredits,
            'memo_tickets' => $memoSummary['remaining'],
            'memo_nearest_expiry' => $memoSummary['nearest_expiry'],
            'request_view_tickets' => $viewSummary['remaining'],
            'can_cold_memo' => $canColdMemo,
        ];
    }

    /** @return array{tickets: array<string, array{label: string, remaining: int, nearest_expiry: string|null}>} */
    public function ticketBlocksFromStatus(array $status): array
    {
        return [
            'tickets' => [
                'memo' => [
                    'label' => '쪽지권',
                    'remaining' => (int) $status['cold_memo']['remaining'],
                    'nearest_expiry' => $status['cold_memo']['nearest_expiry'],
                ],
                'request_view' => [
                    'label' => '요청문 열람권',
                    'remaining' => (int) $status['request_view']['remaining'],
                    'nearest_expiry' => $status['request_view']['nearest_expiry'],
                ],
            ],
        ];
    }

    /** @return array{state: string, label: string, positions: list<mixed>} */
    private function emptyExposure(): array
    {
        return [
            'state' => 'basic',
            'label' => 'Basic — 유료 노출 기간 없음',
            'positions' => [],
        ];
    }
}
