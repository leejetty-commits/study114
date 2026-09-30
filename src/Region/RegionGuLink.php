<?php

declare(strict_types=1);

namespace Study114\Region;

use Study114\Database\Connection;

/**
 * 동 행을 공식 구 행에 묶는다.
 * 기준은 sigungu_code 앞 5자리 = official_code 앞 5자리. 시·도 이름은 비교하지 않는다.
 */
final class RegionGuLink
{
    public const GUEST_BASE_DONG_CODE = '11680101';

    public const GUEST_BASE_GU_OFFICIAL_CODE = '1168000000';

    public static function guIdByOfficialCode(string $officialCode): ?int
    {
        $code = trim($officialCode);
        if ($code === '') {
            return null;
        }

        $stmt = Connection::get()->prepare(
            'SELECT id FROM regions
             WHERE official_code = ? AND is_selectable = 1
             LIMIT 1'
        );
        $stmt->execute([$code]);
        $id = $stmt->fetchColumn();
        if ($id === false || $id === null) {
            return null;
        }

        return (int) $id;
    }

    /**
     * @return list<int>
     */
    public static function dongIdsUnderGu(int $guId): array
    {
        if ($guId <= 0) {
            return [];
        }

        $stmt = Connection::get()->prepare(
            'SELECT d.id
             FROM regions d
             INNER JOIN regions g ON g.id = ?
             WHERE d.unit_level = \'dong\'
               AND CHAR_LENGTH(g.official_code) >= 5
               AND CHAR_LENGTH(d.sigungu_code) >= 5
               AND LEFT(d.sigungu_code, 5) = LEFT(g.official_code, 5)
             ORDER BY d.id'
        );
        $stmt->execute([$guId]);
        $ids = [];
        while (($id = $stmt->fetchColumn()) !== false) {
            $ids[] = (int) $id;
        }

        return $ids;
    }

    public static function dongIdByDongCode(string $dongCode): ?int
    {
        $code = trim($dongCode);
        if ($code === '') {
            return null;
        }

        $stmt = Connection::get()->prepare(
            'SELECT id FROM regions
             WHERE dong_code = ? AND unit_level = \'dong\'
             LIMIT 1'
        );
        $stmt->execute([$code]);
        $id = $stmt->fetchColumn();
        if ($id === false || $id === null) {
            return null;
        }

        return (int) $id;
    }
}
