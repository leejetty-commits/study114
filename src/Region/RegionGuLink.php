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
    /** 개발 시드(012·rest-schema) 동 코드 */
    public const GUEST_BASE_DONG_CODE = '11680101';

    /** 법정동코드. 운영 동 행은 카카오 주소검색(RegionEnsure)이 bcode 10자리로 넣는다. */
    public const GUEST_BASE_DONG_OFFICIAL_CODE = '1168010600';

    public const GUEST_BASE_DONG_NAME = '대치동';

    public const GUEST_BASE_GU_NAME = '강남구';

    /** 카카오 주소검색 시도 표기는 「서울」이다. */
    public const GUEST_BASE_SIDO_NAMES = ['서울특별시', '서울시', '서울'];

    public const GUEST_BASE_GU_OFFICIAL_CODE = '1168000000';

    /**
     * 게스트 공부방 기준 행. 서울 + 강남구 + 대치동 이름 또는 두 동 코드 중 하나로 찾는다.
     * 이름이 맞는 행을 먼저 쓴다. 대치1동 등 다른 동으로 대체하지 않는다. 없으면 null.
     */
    public static function guestBaseDongId(): ?int
    {
        $stmt = Connection::get()->prepare(
            'SELECT id FROM regions
             WHERE unit_level = \'dong\' AND is_active = 1
               AND (
                 (dong_name = :dong_name AND sigungu_name = :gu_name
                   AND sido_name IN (:sido_a, :sido_b, :sido_c))
                 OR dong_code IN (:code_dev, :code_official)
               )
             ORDER BY (dong_name = :dong_name_order) DESC, id ASC
             LIMIT 1'
        );
        [$sidoA, $sidoB, $sidoC] = self::GUEST_BASE_SIDO_NAMES;
        $stmt->execute([
            'dong_name' => self::GUEST_BASE_DONG_NAME,
            'gu_name' => self::GUEST_BASE_GU_NAME,
            'sido_a' => $sidoA,
            'sido_b' => $sidoB,
            'sido_c' => $sidoC,
            'code_dev' => self::GUEST_BASE_DONG_CODE,
            'code_official' => self::GUEST_BASE_DONG_OFFICIAL_CODE,
            'dong_name_order' => self::GUEST_BASE_DONG_NAME,
        ]);
        $id = $stmt->fetchColumn();
        if ($id === false || $id === null) {
            return null;
        }

        return (int) $id;
    }

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
               AND (
                 LEFT(d.sigungu_code, 5) = LEFT(g.official_code, 5)
                 OR (LEFT(g.official_code, 5) = \'36000\' AND LEFT(d.sigungu_code, 5) = \'36110\')
               )
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
