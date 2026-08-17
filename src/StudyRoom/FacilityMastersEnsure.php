<?php

declare(strict_types=1);

namespace Study114\StudyRoom;

use PDO;

/** 시설 마스터 멱등 시드 — SQL 045를 수동 적용하지 않아도 마스터 API에서 채운다. */
final class FacilityMastersEnsure
{
    /** @var list<array{0: string, 1: string, 2: int}> */
    private const ROWS = [
        ['aircon', '냉난방', 1],
        ['ventilation', '환기', 2],
        ['restroom', '화장실/위생', 3],
        ['parking', '통학/주차 편의', 4],
        ['safety', 'CCTV/안전관리', 5],
        ['wifi', 'Wi-Fi', 6],
        ['air_purifier', '공기청정기', 7],
        ['water_purifier', '정수기', 8],
        ['whiteboard', '화이트보드', 9],
    ];

    public static function ensure(PDO $pdo): void
    {
        try {
            $stmt = $pdo->prepare(
                'INSERT INTO facility_masters (facility_code, facility_name, sort_order, is_active)
                 VALUES (?, ?, ?, 1)
                 ON DUPLICATE KEY UPDATE
                   facility_name = VALUES(facility_name),
                   sort_order = VALUES(sort_order),
                   is_active = 1'
            );
            foreach (self::ROWS as [$code, $name, $order]) {
                $stmt->execute([$code, $name, $order]);
            }
        } catch (\Throwable $e) {
            error_log('[facility-masters] ensure: ' . $e->getMessage());
        }
    }
}
