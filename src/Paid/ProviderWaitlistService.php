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

        $basis = trim((string) ($input['region_basis_type'] ?? 'dong'));
        if ($basis !== 'complex' && $basis !== 'dong') {
            $basis = 'dong';
        }
        $slotGroup = trim((string) ($input['slot_group'] ?? $input['region_label'] ?? ''));
        if ($slotGroup === '') {
            $slotGroup = $this->tickets->primaryRegionLabel('study_room', $studyRoomId);
        }
        if ($slotGroup === '') {
            throw new InvalidArgumentException(
                '적용 지역이 없어 예약대기를 등록할 수 없습니다. 상세등록에서 대표 홍보지역을 설정하세요.',
            );
        }

        $regionId = isset($input['region_id']) && $input['region_id'] !== '' && $input['region_id'] !== null
            ? (int) $input['region_id']
            : null;
        $complexId = isset($input['complex_id']) && $input['complex_id'] !== '' && $input['complex_id'] !== null
            ? (int) $input['complex_id']
            : null;
        if ($regionId !== null && $regionId <= 0) {
            $regionId = null;
        }
        if ($complexId !== null && $complexId <= 0) {
            $complexId = null;
        }

        $row = $this->waitlists->register($studyRoomId, $basis, $regionId, $complexId, $slotGroup);

        return [
            'waitlist' => $this->publicRow($row),
            'message' => '예약대기가 등록되었습니다. 빈자리가 열리면 알려드리며, 결제가 완료되어야 확정됩니다.',
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
