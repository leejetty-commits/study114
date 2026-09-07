<?php

declare(strict_types=1);

namespace Study114\Paid;

use DateTimeImmutable;
use DateTimeInterface;
use Study114\Database\Connection;

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

    public function canColdMemo(int $userId, ?string $providerType = null, ?int $providerId = null): bool
    {
        if ($this->repo->isColdMemoBypass($userId)) {
            return true;
        }
        try {
            $ctx = $this->repo->resolveMemoProvider($userId, $providerType, $providerId);
        } catch (\InvalidArgumentException) {
            return false;
        }

        return $this->repo->countMemoTicketsForProvider($userId, $ctx['provider_type'], $ctx['provider_id']) > 0;
    }

    /** 선제 쪽지 1건 차감 — bypass 시 소비 없음. user 전체 fallback 없음. */
    public function consumeMemoTicket(int $userId, ?string $providerType = null, ?int $providerId = null): bool
    {
        if ($this->repo->isColdMemoBypass($userId)) {
            return true;
        }
        $ctx = $this->repo->resolveMemoProvider($userId, $providerType, $providerId);
        if ($this->repo->consumeTicketForProvider($userId, $ctx['provider_type'], $ctx['provider_id'])) {
            $this->notifyTicketBalanceIfNeeded($userId, 'memo');

            return true;
        }

        return false;
    }

    /** @return list<array<string, mixed>> */
    public function listMemoPacksForApi(int $userId): array
    {
        $rows = $this->repo->listMemoPacks($userId);
        $out = [];
        foreach ($rows as $row) {
            $expires = (string) ($row['expires_at'] ?? '');
            $purchased = (string) ($row['purchased_at'] ?? '');
            $grant = (string) ($row['grant_kind'] ?? $row['source'] ?? '');
            $size = (int) ($row['pack_size'] ?? 0);
            $remaining = (int) ($row['remaining'] ?? 0);
            $out[] = [
                'id' => (int) ($row['id'] ?? 0),
                'provider_type' => isset($row['provider_type']) && $row['provider_type'] !== null && $row['provider_type'] !== ''
                    ? (string) $row['provider_type']
                    : null,
                'provider_id' => isset($row['provider_id']) && $row['provider_id'] !== null
                    ? (int) $row['provider_id']
                    : null,
                'product_name' => $this->memoPackProductName($size, $grant),
                'grant_kind' => $grant,
                'grant_label' => MemoTicketPolicy::grantLabel($grant),
                'granted_count' => $size,
                'remaining' => $remaining,
                'purchased_at' => $this->toIso($purchased),
                'expires_at' => $this->toIso($expires),
                'status' => $expires !== '' ? MemoTicketPolicy::packStatus($remaining, $expires) : '기타',
            ];
        }

        return $out;
    }

    public function hasActivePaidMemoPackFor(string $providerType, int $providerId): bool
    {
        return $this->repo->hasActivePaidMemoPack($providerType, $providerId);
    }

    public function canViewPaidRequest(int $userId, int $studentId): bool
    {
        unset($userId, $studentId);

        return true;
    }

    /** 요청문 열람권 폐지 — 차감 없이 항상 열람 허용 */
    public function unlockPaidRequest(int $userId, int $studentId): array
    {
        if ($studentId <= 0) {
            throw new \InvalidArgumentException('student_id가 필요합니다.');
        }
        $view = $this->getRequestViewTicketSummary($userId);

        return [
            'student_id' => $studentId,
            'unlocked' => true,
            'consumed' => false,
            'request_view_tickets' => $view['remaining'],
            'request_view' => $this->formatRequestViewBlock($view),
        ];
    }

    public function getRequestAccessStatus(int $userId, int $studentId): array
    {
        $view = $this->getRequestViewTicketSummary($userId);

        return [
            'student_id' => $studentId,
            'unlocked' => true,
            'can_unlock' => false,
            'request_view_tickets' => $view['remaining'],
            'has_paid_only_fields' => true,
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
        // Prime: 지역(행정동/단지) 단위 한정. 현재는 전역 집계 seed.
        $primeCap = 3;
        $pickCap = 10;
        $primeUsed = $this->repo->countActivePositionsBySku('prime');
        $pickUsed = $this->repo->countActivePositionsBySku('pick');

        return [
            'exposure' => [
                'state' => $exposureState,
                'label' => $exposureState === 'active' ? '유료 노출 이용 중' : '베이직 노출 이용중 - 무료광고',
                'positions' => array_map(function (array $row) use ($userId): array {
                    $sku = (string) $row['sku_code'];
                    $providerType = (string) ($row['provider_type'] ?? '');
                    $providerId = (int) ($row['provider_id'] ?? 0);
                    $startedOn = (string) ($row['started_on'] ?? substr((string) ($row['starts_at'] ?? ''), 0, 10));
                    $paidOn = $this->repo->latestPaidOn($userId, $sku, $providerType ?: null, $providerId ?: null);

                    return [
                        'sku' => $sku,
                        'provider_type' => $providerType,
                        'provider_id' => $providerId,
                        'region_label' => $this->repo->primaryRegionLabel($providerType, $providerId),
                        'duration_type' => (string) ($row['duration_type'] ?? 'day'),
                        'duration_value' => (int) ($row['duration_value'] ?? $row['period_days'] ?? 0),
                        'period_days' => (int) $row['period_days'],
                        'purchased_on' => $paidOn ?: $startedOn,
                        'started_on' => $startedOn,
                        'end_exclusive_on' => (string) ($row['end_exclusive_on'] ?? ''),
                        'ends_on' => (string) ($row['ends_on'] ?? ''),
                        'starts_at' => (string) $row['starts_at'],
                        'ends_at' => (string) $row['ends_at'],
                        'days_left' => (int) $row['days_left'],
                        'expiry_alert_days' => $sku === 'pick' ? [7, 1] : [7, 3, 1],
                    ];
                }, $positions),
            ],
            'slots' => [
                'region_scope_type' => 'dong',
                'prime' => [
                    'capacity' => $primeCap,
                    'used' => $primeUsed,
                    'remaining' => max(0, $primeCap - $primeUsed),
                    'scope' => 'region',
                ],
                'pick' => [
                    'capacity' => $pickCap,
                    'used' => $pickUsed,
                    'remaining' => max(0, $pickCap - $pickUsed),
                    'set_size' => 5,
                    'rotation_minutes' => 15,
                ],
            ],
            'tickets' => [
                'memo' => [
                    'label' => '쪽지권',
                    'remaining' => $memo['remaining'],
                    'nearest_expiry' => $this->toIso($memo['nearest_expiry'] ?? ''),
                    'packs' => $this->listMemoPacksForApi($userId),
                ],
                'request_view' => [
                    'label' => '요청문 열람권',
                    'remaining' => $view['remaining'],
                    'nearest_expiry' => $this->toIso($view['nearest_expiry'] ?? ''),
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

    private function memoPackProductName(int $packSize, string $grantKind): string
    {
        if (in_array($grantKind, [MemoTicketPolicy::GRANT_POSITION_BUNDLE, MemoTicketPolicy::SOURCE_BUNDLE], true)) {
            return '노출상품 무료 쪽지 혜택';
        }
        if ($packSize === 5) {
            return '쪽지 5회권';
        }
        if ($packSize === 10) {
            return '쪽지 10회권';
        }

        return '쪽지권 ' . $packSize . '회';
    }

    private function toIso(string $datetime): ?string
    {
        $datetime = trim($datetime);
        if ($datetime === '') {
            return null;
        }
        try {
            return (new DateTimeImmutable($datetime))->format(DateTimeInterface::ATOM);
        } catch (\Exception) {
            return null;
        }
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
