<?php

declare(strict_types=1);

namespace Study114\Messages;

use Study114\Database\Connection;
use Study114\Paid\ProviderTicketService;

/** 16§7 P16-04 · 18b 쪽지권 */
final class ProviderEntitlementService
{
    private ProviderEntitlementRepository $repo;
    private ProviderTicketService $tickets;

    public function __construct(
        ?ProviderEntitlementRepository $repo = null,
        ?ProviderTicketService $tickets = null,
    ) {
        $this->repo = $repo ?? new ProviderEntitlementRepository(Connection::get());
        $this->tickets = $tickets ?? new ProviderTicketService();
    }

    /** @return array{subscription_tier: string, cold_memo_allowed: bool, memo_credits: int, memo_tickets: int} */
    public function getForUser(int $userId): array
    {
        $row = $this->repo->getForUser($userId);
        $memoTickets = $this->tickets->countMemoTickets($userId);
        if ($row === null) {
            return [
                'subscription_tier'  => 'free',
                'cold_memo_allowed'  => false,
                'memo_credits'       => 0,
                'memo_tickets'       => $memoTickets,
            ];
        }

        return [
            'subscription_tier'  => (string) $row['subscription_tier'],
            'cold_memo_allowed'  => (bool) $row['cold_memo_allowed'],
            'memo_credits'       => (int) $row['memo_credits'],
            'memo_tickets'       => $memoTickets,
        ];
    }

    public function canColdMemo(int $userId): bool
    {
        return $this->tickets->canColdMemo($userId);
    }

    /** @return array{remaining: int, nearest_expiry: string|null} */
    public function getMemoTicketSummary(int $userId): array
    {
        return $this->tickets->getMemoTicketSummary($userId);
    }

    public function consumeColdMemoTicket(int $userId): bool
    {
        return $this->tickets->consumeMemoTicket($userId);
    }

    public function getRequestViewTickets(int $userId): int
    {
        return $this->tickets->countRequestViewTickets($userId);
    }

    public function canViewPaidRequest(int $userId, int $studentId): bool
    {
        return $this->tickets->canViewPaidRequest($userId, $studentId);
    }

    /** @return array{student_id: int, unlocked: bool, consumed: bool, request_view_tickets: int} */
    public function unlockPaidRequest(int $userId, int $studentId): array
    {
        return $this->tickets->unlockPaidRequest($userId, $studentId);
    }

    /** @return list<int> */
    public function listUnlockedStudentIds(int $userId): array
    {
        return $this->tickets->listUnlockedStudentIds($userId);
    }
}
