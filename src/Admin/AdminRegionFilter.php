<?php

declare(strict_types=1);

namespace Study114\Admin;

use InvalidArgumentException;
use PDO;
use Study114\Region\TutorRegionUnit;

/**
 * 회원 목록·등록 목록이 같이 쓰는 지역 조건.
 * 카드의 대표 지역 id 식($regionIdExpr)이 고른 시군구 또는 시도에 맞는지 SQL로 만든다.
 */
final class AdminRegionFilter
{
    public const MISMATCH_MESSAGE = '시군구가 고른 광역시/도에 속하지 않습니다.';

    /**
     * @return array{sido: ?string, regionId: ?int}
     */
    public static function parse(PDO $pdo, ?string $sidoRaw, ?string $regionRaw): array
    {
        $sido = trim((string) $sidoRaw);
        $regionRaw = trim((string) $regionRaw);
        if ($sido === '') {
            $sido = null;
        } elseif (preg_match('/^[0-9]{2}$/', $sido) !== 1) {
            throw new InvalidArgumentException('sido는 숫자 2자리여야 합니다.');
        }

        $regionId = null;
        if ($regionRaw !== '') {
            if (preg_match('/^[1-9][0-9]*$/', $regionRaw) !== 1) {
                throw new InvalidArgumentException('region은 시·군·구 번호여야 합니다.');
            }
            $regionId = (int) $regionRaw;
            $stmt = $pdo->prepare(
                'SELECT id, sido_code, is_selectable FROM regions WHERE id = ? LIMIT 1'
            );
            $stmt->execute([$regionId]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!is_array($row) || (int) ($row['is_selectable'] ?? 0) !== 1) {
                throw new InvalidArgumentException('시군구를 목록에서 선택해 주세요.');
            }
            if ($sido !== null && (string) ($row['sido_code'] ?? '') !== $sido) {
                throw new InvalidArgumentException(self::MISMATCH_MESSAGE);
            }
        }

        return ['sido' => $sido, 'regionId' => $regionId];
    }

    /**
     * 시군구가 있으면 그 조건만 남긴다. 시도만 있으면 시도 코드를 돌려준다.
     * 둘이 어긋나면 422로 올라가는 예외를 낸다.
     */
    public static function effectiveSido(PDO $pdo, ?int $regionId, ?string $sido): ?string
    {
        $sido = trim((string) $sido);
        if ($sido === '') {
            return null;
        }
        if (preg_match('/^[0-9]{2}$/', $sido) !== 1) {
            throw new InvalidArgumentException('sido는 숫자 2자리여야 합니다.');
        }
        if ($regionId === null || $regionId < 1) {
            return $sido;
        }
        $stmt = $pdo->prepare('SELECT sido_code FROM regions WHERE id = ? LIMIT 1');
        $stmt->execute([$regionId]);
        $code = $stmt->fetchColumn();
        if ($code === false || (string) $code !== $sido) {
            throw new InvalidArgumentException(self::MISMATCH_MESSAGE);
        }

        return null;
    }

    /**
     * @return array{0: string, 1: array<string, int|string>}
     */
    public static function namedExists(string $regionIdExpr, ?int $regionId, ?string $sido): array
    {
        /** @var array<string, int|string> $params */
        $params = [];
        $sql = self::existsSql(
            $regionIdExpr,
            $regionId,
            $sido,
            static function (string $key, int|string $value) use (&$params): string {
                $params[$key] = $value;

                return ':' . $key;
            }
        );

        return [$sql, $params];
    }

    /**
     * @return array{0: string, 1: list<int|string>}
     */
    public static function positionalExists(string $regionIdExpr, ?int $regionId, ?string $sido): array
    {
        /** @var list<int|string> $params */
        $params = [];
        $sql = self::existsSql(
            $regionIdExpr,
            $regionId,
            $sido,
            static function (string $key, int|string $value) use (&$params): string {
                unset($key);
                $params[] = $value;

                return '?';
            }
        );

        return [$sql, $params];
    }

    /**
     * @param callable(string, int|string): string $bind
     */
    private static function existsSql(string $regionIdExpr, ?int $regionId, ?string $sido, callable $bind): string
    {
        if ($regionId !== null && $regionId > 0) {
            $picked = $bind('region_picked', $regionId);

            return 'EXISTS (
                SELECT 1 FROM regions cr
                INNER JOIN regions picked ON picked.id = ' . $picked . '
                WHERE cr.id = ' . $regionIdExpr . '
                  AND ' . self::matchSql($bind) . '
            )';
        }

        $sido = trim((string) $sido);
        if ($sido === '') {
            return '';
        }
        $direct = $bind('sido_direct', $sido);
        $units = $bind('sido_units', $sido);

        return 'EXISTS (
            SELECT 1 FROM regions cr
            WHERE cr.id = ' . $regionIdExpr . '
              AND (
                cr.sido_code = ' . $direct . '
                OR EXISTS (
                    SELECT 1 FROM regions sel
                    INNER JOIN regions picked ON picked.id = sel.id
                    WHERE sel.sido_code = ' . $units . '
                      AND sel.is_selectable = 1
                      AND sel.is_active = 1
                      AND ' . self::matchSql($bind) . '
                )
              )
        )';
    }

    /**
     * 고른 시군구 행(picked)과 카드 지역 행(cr)이 맞는 조건.
     *
     * @param callable(string, int|string): string $bind
     */
    private static function matchSql(callable $bind): string
    {
        $gwangju = $bind('gw_code', TutorRegionUnit::GWANGJU_SIGUNGU_CODE);
        $guIn = [];
        foreach (TutorRegionUnit::GWANGJU_GU_CODES as $i => $code) {
            $guIn[] = $bind('gw_gu_' . $i, $code);
        }

        return '(
            cr.id = picked.id
            OR (
                cr.unit_level = \'dong\'
                AND CHAR_LENGTH(cr.sigungu_code) >= 5
                AND CHAR_LENGTH(picked.official_code) >= 5
                AND LEFT(cr.sigungu_code, 5) = LEFT(picked.official_code, 5)
            )
            OR (
                picked.unit_level = \'sido\'
                AND cr.sido_code = picked.sido_code
            )
            OR (
                cr.unit_level = \'sido\'
                AND cr.sido_code = picked.sido_code
            )
            OR (
                cr.unit_level = \'sigungu\'
                AND cr.sido_code = picked.sido_code
                AND picked.sigungu_name LIKE CONCAT(cr.sigungu_name, \' %\')
            )
            OR (
                cr.sigungu_code = ' . $gwangju . '
                AND CHAR_LENGTH(picked.official_code) >= 5
                AND LEFT(picked.official_code, 5) IN (' . implode(', ', $guIn) . ')
            )
        )';
    }
}
