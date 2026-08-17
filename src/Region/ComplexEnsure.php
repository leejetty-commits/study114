<?php

declare(strict_types=1);

namespace Study114\Region;

use InvalidArgumentException;
use PDO;

final class ComplexEnsure
{
    /**
     * 주소검색으로 고른 아파트단지를 마스터에 없으면 추가한다.
     * 시드(더미) 단지가 없어도 홍보 단지 칸을 저장할 수 있게 한다.
     */
    public static function ensure(PDO $pdo, int $regionId, string $name, ?string $address): int
    {
        $name = trim($name);
        if ($regionId <= 0 || $name === '') {
            throw new InvalidArgumentException('complex: 단지명과 행정동이 필요합니다.');
        }

        $stmt = $pdo->prepare(
            'SELECT id, address FROM complexes WHERE region_id = ? AND name = ? AND is_active = 1 LIMIT 1'
        );
        $stmt->execute([$regionId, $name]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (is_array($row)) {
            $id = (int) $row['id'];
            $current = trim((string) ($row['address'] ?? ''));
            $next = $address !== null ? trim($address) : '';
            if ($next !== '' && ($current === '' || str_starts_with($current, '(주소 미등록)'))) {
                $pdo->prepare('UPDATE complexes SET address = ? WHERE id = ?')->execute([$next, $id]);
            }
            return $id;
        }

        $ins = $pdo->prepare(
            'INSERT INTO complexes (region_id, name, address, is_active) VALUES (?, ?, ?, 1)'
        );
        $ins->execute([$regionId, $name, $address !== null && trim($address) !== '' ? trim($address) : null]);

        return (int) $pdo->lastInsertId();
    }
}
