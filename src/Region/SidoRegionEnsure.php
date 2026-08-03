<?php

declare(strict_types=1);

namespace Study114\Region;

use PDO;

/**
 * 과외지역 기본 단위 = 「시」
 * - 광역시·특별시·세종: 그 자체
 * - 도: 도 안의 시까지 선택
 */
final class SidoRegionEnsure
{
    /** @var list<array{0:string,1:string}> */
    private const METROS = [
        ['11', '서울특별시'],
        ['26', '부산광역시'],
        ['27', '대구광역시'],
        ['28', '인천광역시'],
        ['29', '광주광역시'],
        ['30', '대전광역시'],
        ['31', '울산광역시'],
        ['36', '세종특별자치시'],
    ];

    /** @var array<string, array{0:string,1:list<string>}> code => [도명, 시목록] */
    private const PROVINCE_CITIES = [
        '41' => ['경기도', [
            '수원시', '성남시', '의정부시', '안양시', '부천시', '광명시', '평택시', '동두천시',
            '안산시', '고양시', '과천시', '구리시', '남양주시', '오산시', '시흥시', '군포시',
            '의왕시', '하남시', '용인시', '파주시', '이천시', '안성시', '김포시', '화성시',
            '광주시', '양주시', '포천시', '여주시',
        ]],
        '51' => ['강원특별자치도', [
            '춘천시', '원주시', '강릉시', '동해시', '태백시', '속초시', '삼척시',
        ]],
        '43' => ['충청북도', ['청주시', '충주시', '제천시']],
        '44' => ['충청남도', [
            '천안시', '공주시', '보령시', '아산시', '서산시', '논산시', '계룡시', '당진시',
        ]],
        '52' => ['전북특별자치도', [
            '전주시', '군산시', '익산시', '정읍시', '남원시', '김제시',
        ]],
        '46' => ['전라남도', ['목포시', '여수시', '순천시', '나주시', '광양시']],
        '47' => ['경상북도', [
            '포항시', '경주시', '김천시', '안동시', '구미시', '영주시', '영천시', '상주시',
            '문경시', '경산시',
        ]],
        '48' => ['경상남도', [
            '창원시', '진주시', '통영시', '사천시', '김해시', '밀양시', '거제시', '양산시',
        ]],
        '50' => ['제주특별자치도', ['제주시', '서귀포시']],
    ];

    /**
     * @return list<array{id: int, label: string, sido_code: string, sido_name: string, kind: string}>
     */
    public static function ensureAndListCities(PDO $pdo): array
    {
        self::ensure($pdo);

        $out = [];

        foreach (self::METROS as [$code, $name]) {
            $id = self::findRegionId($pdo, $code, $name, '시 대표');
            if ($id === null) {
                $id = self::findAnySidoId($pdo, $code);
            }
            if ($id === null) {
                continue;
            }
            $out[] = [
                'id' => $id,
                'label' => $name,
                'sido_code' => $code,
                'sido_name' => $name,
                'kind' => 'metro',
            ];
        }

        foreach (self::PROVINCE_CITIES as $code => [$sidoName, $cities]) {
            foreach ($cities as $city) {
                $id = self::findRegionId($pdo, $code, $city, '시 대표');
                if ($id === null) {
                    // 라벨이 "경기도 수원시 …" 형태인 기존 행 폴백
                    $id = self::findBySigunguName($pdo, $code, $city);
                }
                if ($id === null) {
                    continue;
                }
                $out[] = [
                    'id' => $id,
                    'label' => $city,
                    'sido_code' => $code,
                    'sido_name' => $sidoName,
                    'kind' => 'city',
                ];
            }
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

        foreach (self::METROS as [$code, $name]) {
            self::ensureRow($pdo, $code, $name, $code . '00', $name, self::dongCode($code, 'metro'), '시 대표');
        }

        foreach (self::PROVINCE_CITIES as $code => [$sidoName, $cities]) {
            $i = 1;
            foreach ($cities as $city) {
                $sigunguCode = $code . str_pad((string) $i, 2, '0', STR_PAD_LEFT);
                self::ensureRow(
                    $pdo,
                    $code,
                    $sidoName,
                    $sigunguCode,
                    $city,
                    self::dongCode($code, 'c' . $i . $city),
                    '시 대표'
                );
                $i++;
            }
        }
    }

    private static function dongCode(string $sidoCode, string $salt): string
    {
        $hex = substr(hash('crc32b', $sidoCode . '|' . $salt), 0, 8);
        return substr(str_pad($sidoCode, 2, '0', STR_PAD_LEFT) . $hex, 0, 10);
    }

    private static function ensureRow(
        PDO $pdo,
        string $sidoCode,
        string $sidoName,
        string $sigunguCode,
        string $sigunguName,
        string $dongCode,
        string $dongName
    ): void {
        $find = $pdo->prepare(
            'SELECT id FROM regions
             WHERE sido_code = ? AND sigungu_name = ? AND dong_name = ? AND is_active = 1
             ORDER BY id ASC LIMIT 1'
        );
        $find->execute([$sidoCode, $sigunguName, $dongName]);
        if ($find->fetchColumn() !== false) {
            return;
        }

        $insert = $pdo->prepare(
            'INSERT INTO regions (
                sido_code, sido_name, sigungu_code, sigungu_name, dong_code, dong_name, is_active
             ) VALUES (?, ?, ?, ?, ?, ?, 1)'
        );
        try {
            $insert->execute([$sidoCode, $sidoName, $sigunguCode, $sigunguName, $dongCode, $dongName]);
        } catch (\PDOException $e) {
            // 이미 존재하거나 동시성
        }
    }

    private static function findRegionId(PDO $pdo, string $sidoCode, string $sigunguName, string $dongName): ?int
    {
        $stmt = $pdo->prepare(
            'SELECT id FROM regions
             WHERE sido_code = ? AND sigungu_name = ? AND dong_name = ? AND is_active = 1
             ORDER BY id ASC LIMIT 1'
        );
        $stmt->execute([$sidoCode, $sigunguName, $dongName]);
        $id = $stmt->fetchColumn();
        return $id === false ? null : (int) $id;
    }

    private static function findAnySidoId(PDO $pdo, string $sidoCode): ?int
    {
        $stmt = $pdo->prepare(
            'SELECT id FROM regions WHERE sido_code = ? AND is_active = 1 ORDER BY id ASC LIMIT 1'
        );
        $stmt->execute([$sidoCode]);
        $id = $stmt->fetchColumn();
        return $id === false ? null : (int) $id;
    }

    private static function findBySigunguName(PDO $pdo, string $sidoCode, string $city): ?int
    {
        $stmt = $pdo->prepare(
            'SELECT id FROM regions
             WHERE sido_code = ? AND sigungu_name = ? AND is_active = 1
             ORDER BY id ASC LIMIT 1'
        );
        $stmt->execute([$sidoCode, $city]);
        $id = $stmt->fetchColumn();
        return $id === false ? null : (int) $id;
    }
}
