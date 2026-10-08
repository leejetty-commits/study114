<?php

declare(strict_types=1);

namespace Study114\Region;

use PDO;

/**
 * 구 단위 목록 = regions.is_selectable = 1. 공부방 축(찾기 구 검색·공부방 홍보지역)이 쓴다.
 * 과외 단위(광역시 / 도의 시·군)는 TutorRegionUnit 이 따로 판정한다.
 * ensure()는 더 이상 「시 대표」 행을 만들지 않는다. 기존 행은 지우지 않는다.
 */
final class SidoRegionEnsure
{
    public static function ensure(PDO $pdo): void
    {
    }

    /**
     * @return list<array{
     *   id: int,
     *   label: string,
     *   sido_code: string,
     *   sido_name: string,
     *   official_code: string,
     *   city_name: string,
     *   gu_name: ?string,
     *   kind: string
     * }>
     */
    public static function ensureAndListCities(PDO $pdo): array
    {
        $stmt = $pdo->query(
            'SELECT id, sido_code, sido_name, sigungu_name, official_code, unit_level
             FROM regions
             WHERE is_active = 1 AND is_selectable = 1
             ORDER BY official_code ASC'
        );
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $out = [];
        foreach ($rows as $row) {
            if (!is_array($row)) {
                continue;
            }
            $out[] = self::present($row);
        }

        return $out;
    }

    /**
     * @param array<string, mixed> $row
     * @return array{
     *   id: int,
     *   label: string,
     *   sido_code: string,
     *   sido_name: string,
     *   official_code: string,
     *   city_name: string,
     *   gu_name: ?string,
     *   kind: string
     * }
     */
    private static function present(array $row): array
    {
        $sido = (string) ($row['sido_name'] ?? '');
        $sigungu = trim((string) ($row['sigungu_name'] ?? ''));
        $code = (string) ($row['official_code'] ?? '');
        $level = (string) ($row['unit_level'] ?? '');
        $label = $sigungu !== '' ? $sigungu : $sido;
        $kind = 'city';
        $cityName = $label;
        $guName = null;

        if ($code === '3600000000' || ($level === 'sido' && $sido === '세종특별자치시')) {
            $kind = 'sejong';
            $cityName = $sido !== '' ? $sido : $label;
        } elseif (str_contains($sigungu, ' ') && str_ends_with($sigungu, '구')) {
            $parts = preg_split('/\s+/u', $sigungu, 2) ?: [];
            $kind = 'city_gu';
            $cityName = (string) ($parts[0] ?? $sigungu);
            $rest = trim((string) ($parts[1] ?? ''));
            $guName = $rest !== '' ? $rest : null;
        } elseif (self::isMetroSido($sido) && str_ends_with($sigungu, '구')) {
            $kind = 'metro_gu';
            $cityName = $sigungu;
            $guName = $sigungu;
        } elseif (self::isMetroSido($sido) && str_ends_with($sigungu, '군')) {
            $kind = 'metro_gun';
            $cityName = $sigungu;
        } elseif (str_ends_with($sigungu, '군')) {
            $kind = 'county';
            $cityName = $sigungu;
        } else {
            $cityName = $sigungu !== '' ? $sigungu : $sido;
        }

        return [
            'id' => (int) ($row['id'] ?? 0),
            'label' => $label,
            'sido_code' => (string) ($row['sido_code'] ?? ''),
            'sido_name' => $sido,
            'official_code' => $code,
            'city_name' => $cityName,
            'gu_name' => $guName,
            'kind' => $kind,
        ];
    }

    private static function isMetroSido(string $sido): bool
    {
        if (str_ends_with($sido, '광역시') || str_ends_with($sido, '통합특별시')) {
            return true;
        }

        return str_ends_with($sido, '특별시') && !str_ends_with($sido, '자치시');
    }
}
