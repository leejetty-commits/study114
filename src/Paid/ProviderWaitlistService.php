<?php

declare(strict_types=1);

namespace Study114\Paid;

use InvalidArgumentException;
use PDO;

/**
 * 공부방 Prime 예약대기 서비스.
 * Pick·과외쌤 요청은 거부. 순번·경쟁 목록 미반환.
 */
final class ProviderWaitlistService
{
    private ProviderWaitlistRepository $waitlists;
    private PaidBadgeRepository $badges;
    private ProviderTicketRepository $tickets;

    public function __construct(
        private readonly PDO $pdo,
        ?ProviderWaitlistRepository $waitlists = null,
        ?PaidBadgeRepository $badges = null,
        ?ProviderTicketRepository $tickets = null,
    ) {
        $this->waitlists = $waitlists ?? new ProviderWaitlistRepository($this->pdo);
        $this->badges = $badges ?? new PaidBadgeRepository($this->pdo);
        $this->tickets = $tickets ?? new ProviderTicketRepository($this->pdo);
    }

    /**
     * @param array{
     *   region_basis_type?: string,
     *   region_id?: int|null,
     *   complex_id?: int|null,
     *   slot_group?: string,
     *   region_label?: string
     * } $input
     * @return array<string, mixed>
     */
    public function register(int $userId, int $studyRoomId, array $input): array
    {
        $this->badges->assertOwnedProvider($userId, 'study_room', $studyRoomId);
        if (!$this->waitlists->tableReady()) {
            throw new InvalidArgumentException(
                '예약대기 테이블이 없습니다. schema 009를 적용하세요.',
            );
        }

        $scopeHelper = new PrimeRegionScope($this->pdo);
        $scope = $scopeHelper->normalizeFromInput($input);
        $scopeHelper->assertOwnedByStudyRoom($studyRoomId, $scope);

        // 만석이 아니면 대기가 아니라 구매를 유도 (스키마 065 적용 시)
        if ($scopeHelper->positionScopeColumnsReady()) {
            $inv = $scopeHelper->inventoryForScope($scope);
            if ($inv['remaining'] > 0) {
                throw new InvalidArgumentException(
                    '선택한 지역에 아직 구매 가능한 Prime 자리가 있습니다. 예약대기 대신 바로 구매해 주세요.',
                );
            }
        }

        $row = $this->waitlists->register(
            $studyRoomId,
            $scope['region_basis_type'],
            $scope['region_id'],
            $scope['complex_id'],
            $scope['slot_group'],
        );

        return [
            'waitlist' => $this->publicRow($row),
            'message' => '예약대기가 등록되었습니다. 빈자리가 열리면 알려드리며, 결제가 완료되어야 확정됩니다.',
            'prime_region' => [
                'region_basis_type' => $scope['region_basis_type'],
                'region_id' => $scope['region_id'],
                'complex_id' => $scope['complex_id'],
                'slot_group' => $scope['slot_group'],
                'inventory_key' => $scope['inventory_key'],
            ],
        ];
    }

    /** @return array{items: list<array<string, mixed>>} */
    public function listMine(int $userId, int $studyRoomId): array
    {
        $this->badges->assertOwnedProvider($userId, 'study_room', $studyRoomId);
        $rows = $this->waitlists->listForStudyRoom($studyRoomId);
        $items = [];
        foreach ($rows as $row) {
            $items[] = $this->publicRow($row);
        }

        return ['items' => $items];
    }

    /** @return array{cancelled: bool} */
    public function cancel(int $userId, int $studyRoomId, int $waitlistId): array
    {
        $this->badges->assertOwnedProvider($userId, 'study_room', $studyRoomId);
        $ok = $this->waitlists->cancel($studyRoomId, $waitlistId);
        if (!$ok) {
            throw new InvalidArgumentException('취소할 예약대기를 찾을 수 없습니다.');
        }

        return ['cancelled' => true];
    }

    /**
     * 공개 응답 — 순번·경쟁업체·대기 인원 제외.
     *
     * @param array<string, mixed> $row
     * @return array<string, mixed>
     */
    private function publicRow(array $row): array
    {
        $status = (string) ($row['payment_status'] ?? 'registered');
        $statusLabel = match ($status) {
            'registered' => '대기 등록',
            'notified' => '결제 가능',
            'paid' => '구매 완료',
            'cancelled' => '취소',
            'expired' => '만료',
            default => $status,
        };

        return [
            'id' => (int) ($row['id'] ?? 0),
            'product' => 'Prime 노출',
            'region' => (string) ($row['slot_group'] ?? ''),
            'registered_at' => (string) ($row['registered_at'] ?? ''),
            'status' => $status,
            'status_label' => $statusLabel,
            'can_pay' => $status === 'notified',
            'can_cancel' => in_array($status, ['registered', 'notified'], true),
        ];
    }
}
