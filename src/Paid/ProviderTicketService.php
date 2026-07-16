<?php

declare(strict_types=1);

namespace Study114\Paid;

use Study114\Database\Connection;
use Study114\Messages\PaidGateException;

/** 18b — 횟수권 FIFO · 기간형 조회 */
final class ProviderTicketService
{
    private ProviderTicketRepository $repo;

    public function __construct(?ProviderTicketRepository $repo = null)
    {
        $this->repo = $repo ?? new ProviderTicketRepository(Connection::get());
    }

    public function countMemoTickets(int $userId): int
    {
        $fromPacks = $this->repo->countTickets($userId, 'memo');
        if ($fromPacks > 0 || $this->repo->hasTicketPacks($userId, 'memo')) {
            return $fromPacks;
        }

        return $this->repo->legacyMemoCredits($userId);
    }

    /** @return array{remaining: int, nearest_expiry: string|null} */
    public function getMemoTicketSummary(int $userId): array
    {
        $memo = $this->repo->ticketSummary($userId, 'memo');
        if ($this->repo->hasTicketPacks($userId, 'memo')) {
            return $memo;
        }
        $memo['remaining'] += $this->repo->legacyMemoCredits($userId);

        return $memo;
    }

    /** @return array{remaining: int, nearest_expiry: string|null} */
    public function getRequestViewTicketSummary(int $userId): array
    {
        return $this->repo->ticketSummary($userId, 'request_view');
    }

    public function countRequestViewTickets(int $userId): int
    {
        return $this->repo->countTickets($userId, 'request_view');
    }

    public function canColdMemo(int $userId): bool
    {
        if ($this->repo->isColdMemoBypass($userId)) {
            return true;
        }

        return $this->countMemoTickets($userId) > 0;
    }

    /** 선제 쪽지 1건 차감 — bypass 시 소비 없음 */
    public function consumeMemoTicket(int $userId): bool
    {
        if ($this->repo->isColdMemoBypass($userId)) {
            return true;
        }
        if ($this->repo->consumeTicket($userId, 'memo')) {
            $this->notifyTicketBalanceIfNeeded($userId, 'memo');

            return true;
        }

        if ($this->repo->decrementLegacyMemoCredits($userId)) {
            $this->notifyTicketBalanceIfNeeded($userId, 'memo');

            return true;
        }

        return false;
    }

    public function canViewPaidRequest(int $userId, int $studentId): bool
    {
        if (!$this->repo->studentHasPaidOnlyFields($studentId)) {
            return false;
        }

        return $this->repo->hasRequestUnlock($userId, $studentId);
    }

    /** @return array{student_id: int, unlocked: bool, consumed: bool, request_view_tickets: int} */
    public function unlockPaidRequest(int $userId, int $studentId): array
    {
        if ($studentId <= 0) {
            throw new \InvalidArgumentException('student_id가 필요합니다.');
        }
        if (!$this->repo->studentHasPaidOnlyFields($studentId)) {
            throw new \InvalidArgumentException('이 학생에게 열람 가능한 paid_only 요청문이 없습니다.');
        }
        if ($this->repo->hasRequestUnlock($userId, $studentId)) {
            $view = $this->getRequestViewTicketSummary($userId);

            return [
                'student_id' => $studentId,
                'unlocked' => true,
                'consumed' => false,
                'request_view_tickets' => $view['remaining'],
                'request_view' => $this->formatRequestViewBlock($view),
            ];
        }
        if (!$this->repo->consumeTicket($userId, 'request_view')) {
            throw new PaidGateException('요청문을 보려면 열람권이 필요합니다.');
        }
        $this->repo->recordRequestUnlock($userId, $studentId);
        $view = $this->getRequestViewTicketSummary($userId);
        $this->notifyTicketBalanceIfNeeded($userId, 'request_view');

        return [
            'student_id' => $studentId,
            'unlocked' => true,
            'consumed' => true,
            'request_view_tickets' => $view['remaining'],
            'request_view' => $this->formatRequestViewBlock($view),
        ];
    }

    /** @return array{student_id: int, unlocked: bool, can_unlock: bool, request_view_tickets: int, has_paid_only_fields: bool, request_view: array{remaining: int, nearest_expiry: string|null}} */
    public function getRequestAccessStatus(int $userId, int $studentId): array
    {
        $unlocked = $this->repo->hasRequestUnlock($userId, $studentId);
        $view = $this->getRequestViewTicketSummary($userId);
        $hasPaidOnly = $this->repo->studentHasPaidOnlyFields($studentId);

        return [
            'student_id' => $studentId,
            'unlocked' => $unlocked,
            'can_unlock' => $hasPaidOnly && !$unlocked && $view['remaining'] > 0,
            'request_view_tickets' => $view['remaining'],
            'has_paid_only_fields' => $hasPaidOnly,
            'request_view' => $this->formatRequestViewBlock($view),
        ];
    }

    /** @return list<int> */
    public function listUnlockedStudentIds(int $userId): array
    {
        return $this->repo->listUnlockedStudentIds($userId);
    }

    /** @return array<string, mixed> */
    public function getOperationalStatus(int $userId): array
    {
        $memo = $this->getMemoTicketSummary($userId);
        $view = $this->getRequestViewTicketSummary($userId);
        $positions = $this->repo->listActivePositions($userId);

        $exposureState = count($positions) > 0 ? 'active' : 'basic';

        // seed 기본값 — 이후 plan_runtime_settings / 관리자 설정으로 치환
        $primeCap = 3;
        $pickCap = 10;
        $primeUsed = $this->repo->countActivePositionsBySku('prime');
        $pickUsed = $this->repo->countActivePositionsBySku('pick');

        return [
            'exposure' => [
                'state' => $exposureState,
                'label' => $exposureState === 'active' ? '유료 노출 이용 중' : 'Basic — 유료 노출 기간 없음',
                'positions' => array_map(static function (array $row): array {
                    return [
                        'sku' => (string) $row['sku_code'],
                        'period_days' => (int) $row['period_days'],
                        'starts_at' => (string) $row['starts_at'],
                        'ends_at' => (string) $row['ends_at'],
                        'days_left' => (int) $row['days_left'],
                    ];
                }, $positions),
            ],
            'slots' => [
                'prime' => [
                    'capacity' => $primeCap,
                    'used' => $primeUsed,
                    'remaining' => max(0, $primeCap - $primeUsed),
                ],
                'pick' => [
                    'capacity' => $pickCap,
                    'used' => $pickUsed,
                    'remaining' => max(0, $pickCap - $pickUsed),
                ],
            ],
            'tickets' => [
                'memo' => [
                    'label' => '쪽지권',
                    'remaining' => $memo['remaining'],
                    'nearest_expiry' => $memo['nearest_expiry'],
                ],
                'request_view' => [
                    'label' => '요청문 열람권',
                    'remaining' => $view['remaining'],
                    'nearest_expiry' => $view['nearest_expiry'],
                ],
            ],
        ];
    }

    /** @param array{remaining: int, nearest_expiry: string|null} $view */
    private function formatRequestViewBlock(array $view): array
    {
        return [
            'remaining' => $view['remaining'],
            'nearest_expiry' => $view['nearest_expiry'],
        ];
    }

    /** @return array<string, mixed> */
    public function getRequestAccessList(int $userId): array
    {
        $view = $this->getRequestViewTicketSummary($userId);

        return [
            'request_view' => array_merge(
                $this->formatRequestViewBlock($view),
                ['unlocked_student_ids' => $this->listUnlockedStudentIds($userId)],
            ),
            'unlocked_student_ids' => $this->listUnlockedStudentIds($userId),
            'request_view_tickets' => $view['remaining'],
        ];
    }

    private function notifyTicketBalanceIfNeeded(int $userId, string $ticketType): void
    {
        try {
            $remaining = $ticketType === 'memo'
                ? $this->countMemoTickets($userId)
                : $this->countRequestViewTickets($userId);
            (new ProviderReminderService())->onTicketBalance($userId, $ticketType, $remaining);
        } catch (\Throwable $e) {
            error_log('[paid-reminder] ' . $e->getMessage());
        }
    }
}
