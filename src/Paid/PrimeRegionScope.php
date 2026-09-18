<?php

declare(strict_types=1);

namespace Study114\Paid;

use InvalidArgumentException;
use PDO;
use Study114\Database\Connection;

/**
 * 공부방 Prime 지역 스코프 SSOT.
 * 재고 키 = region_basis_type + (dong→region_id | complex→complex_id).
 * Pick·과외쌤에는 사용하지 않는다. label 문자열만으로는 키를 만들지 않는다.
 */
final class PrimeRegionScope
{
    public const CAPACITY = 3;

    private PDO $pdo;

    public function __construct(?PDO $pdo = null)
    {
        $this->pdo = $pdo ?? Connection::get();
    }

    public function positionScopeColumnsReady(): bool
    {
        static $cache = null;
        if ($cache !== null) {
            return $cache;
        }
        $stmt = $this->pdo->prepare(
            'SELECT 1 FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE()
               AND TABLE_NAME = ?
               AND COLUMN_NAME = ?
             LIMIT 1'
        );
        $stmt->execute(['provider_position_subscriptions', 'region_basis_type']);
        $cache = (bool) $stmt->fetchColumn();

        return $cache;
    }

    /**
     * @param array<string, mixed> $input
     * @return array{
     *   region_basis_type: 'dong'|'complex',
     *   region_id: int|null,
     *   complex_id: int|null,
     *   slot_group: string,
     *   inventory_key: string
     * }
     */
    public function normalizeFromInput(array $input): array
    {
        $basis = trim((string) ($input['region_basis_type'] ?? $input['region_basis'] ?? ''));
        $regionId = $this->positiveIntOrNull($input['region_id'] ?? null);
        $complexId = $this->positiveIntOrNull($input['complex_id'] ?? null);
        $slotGroup = trim((string) ($input['slot_group'] ?? $input['region_label'] ?? ''));

        if ($basis !== 'dong' && $basis !== 'complex') {
            if ($complexId !== null) {
                $basis = 'complex';
            } elseif ($regionId !== null) {
                $basis = 'dong';
            } else {
                throw new InvalidArgumentException(
                    '적용 지역을 먼저 선택해 주세요. (region_basis_type · region_id|complex_id 필요)',
                );
            }
        }

        if ($basis === 'complex') {
            if ($complexId === null) {
                throw new InvalidArgumentException(
                    '적용 지역을 먼저 선택해 주세요. (단지 complex_id 필요)',
                );
            }
            $inventoryKey = 'complex:' . $complexId;
        } else {
            if ($regionId === null) {
                throw new InvalidArgumentException(
                    '적용 지역을 먼저 선택해 주세요. (행정동 region_id 필요)',
                );
            }
            $complexId = null;
            $inventoryKey = 'dong:' . $regionId;
        }

        if ($slotGroup === '') {
            $slotGroup = $inventoryKey;
        }

        return [
            'region_basis_type' => $basis,
            'region_id' => $regionId,
            'complex_id' => $complexId,
            'slot_group' => mb_substr($slotGroup, 0, 80),
            'inventory_key' => $inventoryKey,
        ];
    }

    /**
     * 공부방 홍보지역(study_room_regions)에 속하는지 검증.
     *
     * @param array{
     *   region_basis_type: 'dong'|'complex',
     *   region_id: int|null,
     *   complex_id: int|null
     * } $scope
     */
    public function assertOwnedByStudyRoom(int $studyRoomId, array $scope): void
    {
        if ($studyRoomId <= 0) {
            throw new InvalidArgumentException('study_room_id가 필요합니다.');
        }
        $basis = $scope['region_basis_type'];
        if ($basis === 'complex') {
            $complexId = (int) ($scope['complex_id'] ?? 0);
            $stmt = $this->pdo->prepare(
                'SELECT 1 FROM study_room_regions
                 WHERE study_room_id = ? AND complex_id = ?
                 LIMIT 1'
            );
            $stmt->execute([$studyRoomId, $complexId]);
            if ($stmt->fetchColumn()) {
                return;
            }
            $stmtTop = $this->pdo->prepare(
                'SELECT 1 FROM study_rooms
                 WHERE id = ? AND complex_id = ? AND deleted_at IS NULL
                 LIMIT 1'
            );
            $stmtTop->execute([$studyRoomId, $complexId]);
            if ($stmtTop->fetchColumn()) {
                return;
            }
            throw new InvalidArgumentException(
                '선택한 적용 지역이 이 공부방의 대표 홍보지역이 아닙니다.',
            );
        }

        $regionId = (int) ($scope['region_id'] ?? 0);
        $stmt = $this->pdo->prepare(
            'SELECT 1 FROM study_room_regions
             WHERE study_room_id = ? AND region_id = ?
               AND (complex_id IS NULL OR complex_id = 0)
             LIMIT 1'
        );
        $stmt->execute([$studyRoomId, $regionId]);
        if ($stmt->fetchColumn()) {
            return;
        }
        // 단지 슬롯이라도 동일 행정동 id로 등록된 경우(단지 기준이 아닌 dong 선택) 허용
        $stmt2 = $this->pdo->prepare(
            'SELECT 1 FROM study_room_regions
             WHERE study_room_id = ? AND region_id = ?
             LIMIT 1'
        );
        $stmt2->execute([$studyRoomId, $regionId]);
        if ($stmt2->fetchColumn()) {
            return;
        }
        // study_room_regions 미시드여도 study_rooms 대표지역과 일치하면 허용
        $stmtTop = $this->pdo->prepare(
            'SELECT 1 FROM study_rooms
             WHERE id = ? AND region_id = ? AND deleted_at IS NULL
             LIMIT 1'
        );
        $stmtTop->execute([$studyRoomId, $regionId]);
        if ($stmtTop->fetchColumn()) {
            return;
        }

        throw new InvalidArgumentException(
            '선택한 적용 지역이 이 공부방의 대표 홍보지역이 아닙니다.',
        );
    }

    /**
     * @param array{
     *   region_basis_type: 'dong'|'complex',
     *   region_id: int|null,
     *   complex_id: int|null
     * } $scope
     */
    public function countActiveStudyRoomPrimesInScope(array $scope): int
    {
        if (!$this->positionScopeColumnsReady()) {
            throw new InvalidArgumentException(
                'provider_position_subscriptions 지역 스코프 미적용 — schema 065를 먼저 적용하세요.',
            );
        }
        $basis = $scope['region_basis_type'];
        if ($basis === 'complex') {
            $stmt = $this->pdo->prepare(
                "SELECT COUNT(*) FROM provider_position_subscriptions
                 WHERE sku_code = 'prime' AND provider_type = 'study_room'
                   AND CURDATE() < end_exclusive_on
                   AND region_basis_type = 'complex'
                   AND complex_id = ?"
            );
            $stmt->execute([(int) $scope['complex_id']]);

            return (int) $stmt->fetchColumn();
        }

        $stmt = $this->pdo->prepare(
            "SELECT COUNT(*) FROM provider_position_subscriptions
             WHERE sku_code = 'prime' AND provider_type = 'study_room'
               AND CURDATE() < end_exclusive_on
               AND region_basis_type = 'dong'
               AND region_id = ?"
        );
        $stmt->execute([(int) $scope['region_id']]);

        return (int) $stmt->fetchColumn();
    }

    /**
     * @param array{
     *   region_basis_type: 'dong'|'complex',
     *   region_id: int|null,
     *   complex_id: int|null
     * } $scope
     * @return array{capacity: int, used: int, remaining: int, scope: string, inventory_key: string, region_scoped: true}
     */
    public function inventoryForScope(array $scope): array
    {
        $used = $this->countActiveStudyRoomPrimesInScope($scope);
        $key = $scope['region_basis_type'] === 'complex'
            ? 'complex:' . (int) $scope['complex_id']
            : 'dong:' . (int) $scope['region_id'];

        return [
            'capacity' => self::CAPACITY,
            'used' => $used,
            'remaining' => max(0, self::CAPACITY - $used),
            'scope' => 'study_room_prime_region',
            'inventory_key' => $key,
            'region_scoped' => true,
        ];
    }

    /**
     * 결제 확정 직전 — 스코프 내 활성 Prime 행을 FOR UPDATE 로 잠근다.
     * 경합 시 4번째 INSERT 를 막기 위해 createOrder·grant 경로에서만 사용.
     *
     * @param array{
     *   region_basis_type: 'dong'|'complex',
     *   region_id: int|null,
     *   complex_id: int|null
     * } $scope
     * @return list<array<string, mixed>>
     */
    public function lockActiveInScope(array $scope): array
    {
        if (!$this->positionScopeColumnsReady()) {
            throw new InvalidArgumentException(
                'provider_position_subscriptions 지역 스코프 미적용 — schema 065를 먼저 적용하세요.',
            );
        }
        $basis = $scope['region_basis_type'];
        if ($basis === 'complex') {
            $stmt = $this->pdo->prepare(
                "SELECT id, provider_id, sku_code, started_on, end_exclusive_on,
                        duration_type, duration_value, period_days,
                        region_basis_type, region_id, complex_id, slot_group
                 FROM provider_position_subscriptions
                 WHERE sku_code = 'prime' AND provider_type = 'study_room'
                   AND CURDATE() < end_exclusive_on
                   AND region_basis_type = 'complex'
                   AND complex_id = ?
                 ORDER BY end_exclusive_on DESC, id DESC
                 FOR UPDATE"
            );
            $stmt->execute([(int) $scope['complex_id']]);
        } else {
            $stmt = $this->pdo->prepare(
                "SELECT id, provider_id, sku_code, started_on, end_exclusive_on,
                        duration_type, duration_value, period_days,
                        region_basis_type, region_id, complex_id, slot_group
                 FROM provider_position_subscriptions
                 WHERE sku_code = 'prime' AND provider_type = 'study_room'
                   AND CURDATE() < end_exclusive_on
                   AND region_basis_type = 'dong'
                   AND region_id = ?
                 ORDER BY end_exclusive_on DESC, id DESC
                 FOR UPDATE"
            );
            $stmt->execute([(int) $scope['region_id']]);
        }
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return is_array($rows) ? $rows : [];
    }

    /**
     * 동일 스코프에서 해당 공부방의 활성 Prime (연장 판정).
     *
     * @param array{
     *   region_basis_type: 'dong'|'complex',
     *   region_id: int|null,
     *   complex_id: int|null
     * } $scope
     * @return array<string, mixed>|null
     */
    public function findActiveOwnInScope(int $studyRoomId, array $scope, bool $forUpdate = false): ?array
    {
        if ($studyRoomId <= 0) {
            return null;
        }
        if (!$this->positionScopeColumnsReady()) {
            return null;
        }
        $lock = $forUpdate ? ' FOR UPDATE' : '';
        $basis = $scope['region_basis_type'];
        if ($basis === 'complex') {
            $stmt = $this->pdo->prepare(
                "SELECT id, provider_id, sku_code, started_on, end_exclusive_on,
                        duration_type, duration_value, period_days,
                        region_basis_type, region_id, complex_id, slot_group
                 FROM provider_position_subscriptions
                 WHERE sku_code = 'prime' AND provider_type = 'study_room'
                   AND provider_id = ?
                   AND CURDATE() < end_exclusive_on
                   AND region_basis_type = 'complex'
                   AND complex_id = ?
                 ORDER BY end_exclusive_on DESC, id DESC
                 LIMIT 1{$lock}"
            );
            $stmt->execute([$studyRoomId, (int) $scope['complex_id']]);
        } else {
            $stmt = $this->pdo->prepare(
                "SELECT id, provider_id, sku_code, started_on, end_exclusive_on,
                        duration_type, duration_value, period_days,
                        region_basis_type, region_id, complex_id, slot_group
                 FROM provider_position_subscriptions
                 WHERE sku_code = 'prime' AND provider_type = 'study_room'
                   AND provider_id = ?
                   AND CURDATE() < end_exclusive_on
                   AND region_basis_type = 'dong'
                   AND region_id = ?
                 ORDER BY end_exclusive_on DESC, id DESC
                 LIMIT 1{$lock}"
            );
            $stmt->execute([$studyRoomId, (int) $scope['region_id']]);
        }
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return is_array($row) ? $row : null;
    }

    /**
     * @param list<array{region_basis_type?: string, region_id?: int|string|null, complex_id?: int|string|null, region_label?: string}> $scopes
     * @return list<array{label: string, region_basis_type: string, region_id: int|null, complex_id: int|null, inventory_key: string, capacity: int, used: int, remaining: int}>
     */
    public function inventoriesForScopes(array $scopes): array
    {
        $out = [];
        foreach ($scopes as $raw) {
            if (!is_array($raw)) {
                continue;
            }
            try {
                $scope = $this->normalizeFromInput($raw);
                $inv = $this->inventoryForScope($scope);
                $out[] = [
                    'label' => (string) ($raw['region_label'] ?? $raw['slot_group'] ?? $scope['slot_group']),
                    'region_basis_type' => $scope['region_basis_type'],
                    'region_id' => $scope['region_id'],
                    'complex_id' => $scope['complex_id'],
                    'inventory_key' => $inv['inventory_key'],
                    'capacity' => $inv['capacity'],
                    'used' => $inv['used'],
                    'remaining' => $inv['remaining'],
                ];
            } catch (InvalidArgumentException) {
                continue;
            }
        }

        return $out;
    }

    private function positiveIntOrNull(mixed $raw): ?int
    {
        if ($raw === null || $raw === '') {
            return null;
        }
        $n = (int) $raw;

        return $n > 0 ? $n : null;
    }
}
