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
    public function getOperationalStatus(int $userId, array $primeRegionInput = [], ?int $studyRoomId = null): array
    {
        $memo = $this->getMemoTicketSummary($userId);
        $view = $this->getRequestViewTicketSummary($userId);
        $positions = $this->repo->listActivePositions($userId);

        $exposureState = count($positions) > 0 ? 'active' : 'basic';

        $primeCap = PrimeRegionScope::CAPACITY;
        $primeUsed = 0;
        $primeRemaining = $primeCap;
        $primeMeta = [
            'scope' => 'study_room_prime_region',
            'region_scoped' => true,
            'inventory_key' => null,
            'needs_region' => true,
        ];

        $scopeHelper = new PrimeRegionScope();
        if ($primeRegionInput !== [] && $scopeHelper->positionScopeColumnsReady()) {
            try {
                $scope = $scopeHelper->normalizeFromInput($primeRegionInput);
                $inv = $scopeHelper->inventoryForScope($scope);
                $primeUsed = $inv['used'];
                $primeRemaining = $inv['remaining'];
                $primeMeta['inventory_key'] = $inv['inventory_key'];
                $primeMeta['needs_region'] = false;
                $primeMeta['region_basis_type'] = $scope['region_basis_type'];
                $primeMeta['region_id'] = $scope['region_id'];
                $primeMeta['complex_id'] = $scope['complex_id'];
            } catch (\InvalidArgumentException) {
                $primeMeta['needs_region'] = true;
            }
        } elseif (!$scopeHelper->positionScopeColumnsReady()) {
            $primeMeta = [
                'scope' => 'legacy_global_until_065',
                'region_scoped' => false,
                'inventory_key' => null,
                'needs_region' => true,
                'schema_missing' => '065_provider_position_region_scope',
            ];
            $primeUsed = $this->repo->countActiveStudyRoomPrimes();
            $primeRemaining = max(0, $primeCap - $primeUsed);
        }

        $primeScopes = [];
        if ($studyRoomId !== null && $studyRoomId > 0 && $scopeHelper->positionScopeColumnsReady()) {
            $primeScopes = $this->primeInventoriesForStudyRoom($studyRoomId, $scopeHelper);
        }

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
                    $slotGroup = (string) ($row['slot_group'] ?? '');

                    return [
                        'sku' => $sku,
                        'provider_type' => $providerType,
                        'provider_id' => $providerId,
                        'region_label' => $slotGroup !== ''
                            ? $slotGroup
                            : $this->repo->primaryRegionLabel($providerType, $providerId),
                        'region_basis_type' => (string) ($row['region_basis_type'] ?? ''),
                        'region_id' => isset($row['region_id']) ? (int) $row['region_id'] : null,
                        'complex_id' => isset($row['complex_id']) ? (int) $row['complex_id'] : null,
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
                'region_scope_type' => $primeMeta['region_basis_type'] ?? 'dong',
                'prime' => array_merge([
                    'capacity' => $primeCap,
                    'used' => $primeUsed,
                    'remaining' => $primeRemaining,
                ], $primeMeta),
                'prime_scopes' => $primeScopes,
                'pick' => [
                    'capacity' => 0,
                    'used' => 0,
                    'remaining' => 0,
                    'scope' => 'circulation',
                    'inventory' => false,
                    'set_size' => 10,
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

    /**
     * @return list<array{label: string, region_basis_type: string, region_id: int|null, complex_id: int|null, inventory_key: string, capacity: int, used: int, remaining: int}>
     */
    private function primeInventoriesForStudyRoom(int $studyRoomId, PrimeRegionScope $scopeHelper): array
    {
        $pdo = Connection::get();
        $stmt = $pdo->prepare(
            'SELECT srr.region_id, srr.complex_id, srr.region_basis_type,
                    r.dong_name, c.name AS complex_name
             FROM study_room_regions srr
             LEFT JOIN regions r ON srr.region_id = r.id
             LEFT JOIN complexes c ON srr.complex_id = c.id
             WHERE srr.study_room_id = ?
             ORDER BY srr.is_primary DESC, srr.slot ASC, srr.id ASC
             LIMIT 3'
        );
        $stmt->execute([$studyRoomId]);
        $scopes = [];
        while ($row = $stmt->fetch(\PDO::FETCH_ASSOC)) {
            if (!is_array($row)) {
                continue;
            }
            $regionId = isset($row['region_id']) && (int) $row['region_id'] > 0 ? (int) $row['region_id'] : null;
            $complexId = isset($row['complex_id']) && (int) $row['complex_id'] > 0 ? (int) $row['complex_id'] : null;
            $basis = (string) ($row['region_basis_type'] ?? '') === 'complex' && $complexId
                ? 'complex'
                : 'dong';
            $label = $basis === 'complex'
                ? (string) ($row['complex_name'] ?? '')
                : (string) ($row['dong_name'] ?? '');
            if ($label === '') {
                $label = $basis === 'complex'
                    ? ('단지 #' . (string) $complexId)
                    : ('행정동 #' . (string) $regionId);
            }
            $scopes[] = [
                'region_basis_type' => $basis,
                'region_id' => $regionId,
                'complex_id' => $complexId,
                'region_label' => $label,
            ];
        }
        if ($scopes === []) {
            $top = $pdo->prepare(
                'SELECT region_id, complex_id, region_basis_type FROM study_rooms WHERE id = ? AND deleted_at IS NULL LIMIT 1'
            );
            $top->execute([$studyRoomId]);
            $row = $top->fetch(\PDO::FETCH_ASSOC);
            if (is_array($row)) {
                $scopes[] = [
                    'region_basis_type' => (string) ($row['region_basis_type'] ?? 'dong'),
                    'region_id' => isset($row['region_id']) ? (int) $row['region_id'] : null,
                    'complex_id' => isset($row['complex_id']) ? (int) $row['complex_id'] : null,
                    'region_label' => '',
                ];
            }
        }

        return $scopeHelper->inventoriesForScopes($scopes);
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
