<?php

declare(strict_types=1);

namespace Study114\Region;

use PDO;

/**
 * 시·도 단위 과외지역 선택용 — regions에 시·도 대표 행이 없으면 보강한다.
 */
final class SidoRegionEnsure
{
    /** @var list<array{0:string,1:string}> */
    private const SIDOS = [
        ['11', '서울특별시'],
        ['26', '부산광역시'],
        ['27', '대구광역시'],
        ['28', '인천광역시'],
        ['29', '광주광역시'],
        ['30', '대전광역시'],
        ['31', '울산광역시'],
        ['36', '세종특별자치시'],
        ['41', '경기도'],
        ['51', '강원특별자치도'],
        ['43', '충청북도'],
        ['44', '충청남도'],
        ['52', '전북특별자치도'],
        ['46', '전라남도'],
        ['47', '경상북도'],
        ['48', '경상남도'],
        ['50', '제주특별자치도'],
    ];

    /**
     * @return list<array{id: int, label: string}>
     */
    public static function ensureAndListCities(PDO $pdo): array
    {
        self::ensure($pdo);

        $rows = $pdo->query(
            'SELECT MIN(id) AS id, sido_name AS label
             FROM regions
             WHERE is_active = 1
             GROUP BY sido_code, sido_name
             ORDER BY MIN(sido_code) ASC'
        )->fetchAll(PDO::FETCH_ASSOC);

        $out = [];
        foreach ($rows as $row) {
            $out[] = [
                'id' => (int) $row['id'],
                'label' => (string) $row['label'],
            ];
        }

        return $out;
    }

    public static function ensure(PDO $pdo): void
    {
        static $done = false;
        if ($done) {
            return;
        }
        $done = true;

        $find = $pdo->prepare(
            'SELECT id FROM regions WHERE sido_code = ? AND is_active = 1 ORDER BY id ASC LIMIT 1'
        );
        $insert = $pdo->prepare(
            'INSERT INTO regions (
                sido_code, sido_name, sigungu_code, sigungu_name, dong_code, dong_name, is_active
             ) VALUES (?, ?, ?, ?, ?, ?, 1)'
        );

        foreach (self::SIDOS as [$code, $name]) {
            $find->execute([$code]);
            $id = $find->fetchColumn();
            if ($id !== false) {
                continue;
            }

            // dong_code UNIQUE — 시·도 대표용 합성 코드
            $dongCode = str_pad($code, 10, '0', STR_PAD_RIGHT);
            try {
                $insert->execute([
                    $code,
                    $name,
                    $code . '00',
                    '시 단위',
                    $dongCode,
                    '시 대표',
                ]);
            } catch (\PDOException $e) {
                // 이미 존재하거나 동시성 — 무시하고 다음
            }
        }
    }
}
