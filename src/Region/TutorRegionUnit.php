<?php

declare(strict_types=1);

namespace Study114\Region;

use InvalidArgumentException;
use PDO;

/**
 * 과외 단위(정본 72 · 2026-10-08 잠금). 과외쌤 과외지역·학생 과외 희망지역·과외쌤 찾기·유료 축이 같이 쓴다.
 *
 * - 특별시·광역시·특별자치시: 시도 행 1개가 한 단위(그 안의 구·군 전부 포함).
 * - 도·전남광주통합특별시: 시·군 행이 각각 한 단위. 일반구가 있는 시는 상위 시 행 하나.
 * - 전남광주 옛 광주 5개 구는 「광주」 한 행(sigungu_code 12200, official_code NULL)이 한 단위.
 * - 도 전체·구 단위는 단위가 아니다.
 *
 * regions.is_selectable 은 공부방 축(구 단위 검색)과 공유하므로 여기서 보지 않는다.
 */
final class TutorRegionUnit
{
    /** 1단계로 끝나는 시도(특별시·광역시·세종). */
    public const METRO_SIDO_CODES = ['11', '26', '27', '28', '30', '31', '36'];

    /** 2단계(시·군)로 고르는 시도. */
    public const PROVINCE_SIDO_CODES = ['12', '41', '43', '44', '47', '48', '50', '51', '52'];

    public const GWANGJU_SIDO_CODE = '12';

    /** 비공식 내부 번호. 073 에 없는 빈 번호다. */
    public const GWANGJU_SIGUNGU_CODE = '12200';

    public const GWANGJU_UNIT_NAME = '광주';

    /** 옛 광주광역시 5개 구. 과외 단위로는 「광주」 하나로 묶는다. */
    public const GWANGJU_GU_CODES = ['12210', '12240', '12270', '12300', '12330'];

    public const INVALID_MESSAGE = '과외지역은 목록에서 광역시 또는 도의 시·군을 선택해 주세요.';

    private const ROW_COLUMNS = 'id, sido_code, sido_name, sigungu_code, sigungu_name, unit_level, official_code, is_active';

    /** @param array<string, mixed> $row */
    public static function isUnitRow(array $row): bool
    {
        if (array_key_exists('is_active', $row) && $row['is_active'] !== null && (int) $row['is_active'] !== 1) {
            return false;
        }
        $sido = trim((string) ($row['sido_code'] ?? ''));
        $level = (string) ($row['unit_level'] ?? '');
        $sigunguCode = trim((string) ($row['sigungu_code'] ?? ''));
        $sigunguName = trim((string) ($row['sigungu_name'] ?? ''));
        $official = trim((string) ($row['official_code'] ?? ''));

        if (in_array($sido, self::METRO_SIDO_CODES, true)) {
            return $level === 'sido' && $official === $sido . '00000000';
        }
        if ($sido === self::GWANGJU_SIDO_CODE && $sigunguCode === self::GWANGJU_SIGUNGU_CODE) {
            return $level === 'sigungu';
        }
        if (!in_array($sido, self::PROVINCE_SIDO_CODES, true) || $level !== 'sigungu') {
            return false;
        }
        if ($sido === self::GWANGJU_SIDO_CODE && in_array($sigunguCode, self::GWANGJU_GU_CODES, true)) {
            return false;
        }
        // 「수원시 영통구」처럼 이름에 공백이 있으면 일반구 행이다.
        if ($official === '' || $sigunguName === '' || preg_match('/\s/u', $sigunguName) === 1) {
            return false;
        }

        return str_starts_with($official, $sido);
    }

    /** 공식 전체 이름. 「서울특별시」「경기도 수원시」「전남광주통합특별시 광주」「세종특별자치시」. @param array<string, mixed> $row */
    public static function labelFromRow(array $row): string
    {
        if (!self::isUnitRow($row)) {
            return '';
        }
        $sidoName = trim((string) ($row['sido_name'] ?? ''));
        if (in_array((string) ($row['sido_code'] ?? ''), self::METRO_SIDO_CODES, true)) {
            return $sidoName;
        }

        return trim($sidoName . ' ' . trim((string) ($row['sigungu_name'] ?? '')));
    }

    /**
     * 선택 목록 한 줄.
     *
     * @param array<string, mixed> $row
     * @return array{id: int, label: string, sido_code: string, sido_name: string, unit_name: string, kind: string, official_code: string}
     */
    public static function present(array $row): array
    {
        $sido = (string) ($row['sido_code'] ?? '');
        $metro = in_array($sido, self::METRO_SIDO_CODES, true);
        $unitName = $metro ? '' : trim((string) ($row['sigungu_name'] ?? ''));
        if ($metro) {
            $kind = 'metro';
        } elseif ((string) ($row['sigungu_code'] ?? '') === self::GWANGJU_SIGUNGU_CODE) {
            $kind = 'gwangju';
        } elseif (str_ends_with($unitName, '군')) {
            $kind = 'county';
        } else {
            $kind = 'city';
        }

        return [
            'id' => (int) ($row['id'] ?? 0),
            'label' => self::labelFromRow($row),
            'sido_code' => $sido,
            'sido_name' => trim((string) ($row['sido_name'] ?? '')),
            'unit_name' => $unitName,
            'kind' => $kind,
            'official_code' => trim((string) ($row['official_code'] ?? '')),
        ];
    }

    /**
     * 과외 단위 전체. 시도 코드 → 시·군 코드 순서.
     *
     * @return list<array{id: int, label: string, sido_code: string, sido_name: string, unit_name: string, kind: string, official_code: string}>
     */
    public static function listUnits(PDO $pdo): array
    {
        $codes = array_merge(self::METRO_SIDO_CODES, self::PROVINCE_SIDO_CODES);
        $holders = implode(', ', array_fill(0, count($codes), '?'));
        $stmt = $pdo->prepare(
            'SELECT ' . self::ROW_COLUMNS . '
             FROM regions
             WHERE is_active = 1
               AND unit_level IN (\'sido\', \'sigungu\')
               AND sido_code IN (' . $holders . ')
             ORDER BY sido_code ASC, sigungu_code ASC, id ASC'
        );
        $stmt->execute($codes);
        $out = [];
        $seen = [];
        foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) ?: [] as $row) {
            if (!is_array($row) || !self::isUnitRow($row)) {
                continue;
            }
            $unit = self::present($row);
            if ($unit['label'] === '' || isset($seen[$unit['label']])) {
                continue;
            }
            $seen[$unit['label']] = true;
            $out[] = $unit;
        }

        return $out;
    }

    /** @return array<string, mixed>|null */
    public static function fetchRow(PDO $pdo, int $regionId): ?array
    {
        if ($regionId <= 0) {
            return null;
        }
        $stmt = $pdo->prepare('SELECT ' . self::ROW_COLUMNS . ' FROM regions WHERE id = ? LIMIT 1');
        $stmt->execute([$regionId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return is_array($row) ? $row : null;
    }

    public static function isUnitId(PDO $pdo, int $regionId): bool
    {
        $row = self::fetchRow($pdo, $regionId);

        return $row !== null && self::isUnitRow($row);
    }

    /** 과외 단위가 아니면 저장하지 않는다. */
    public static function assertUnit(PDO $pdo, int $regionId, string $message = self::INVALID_MESSAGE): void
    {
        if (!self::isUnitId($pdo, $regionId)) {
            throw new InvalidArgumentException($message);
        }
    }

    /** 과외 단위 id 의 공식 전체 이름. 단위가 아니면 null. */
    public static function labelForId(PDO $pdo, mixed $regionId): ?string
    {
        if ($regionId === null || $regionId === '' || (int) $regionId <= 0) {
            return null;
        }
        $row = self::fetchRow($pdo, (int) $regionId);
        if ($row === null) {
            return null;
        }
        $label = self::labelFromRow($row);

        return $label !== '' ? $label : null;
    }

    /**
     * 구·동 행을 그 행이 속한 과외 단위로 올린다(강남구 → 서울특별시, 영통구 → 수원시, 광산구 → 광주).
     * 찾지 못하면 null.
     */
    public static function unitIdForRegion(PDO $pdo, int $regionId): ?int
    {
        $row = self::fetchRow($pdo, $regionId);
        if ($row === null) {
            return null;
        }
        if (self::isUnitRow($row)) {
            return (int) $row['id'];
        }
        $sido = trim((string) ($row['sido_code'] ?? ''));
        $sigunguCode = trim((string) ($row['sigungu_code'] ?? ''));

        if (in_array($sido, self::METRO_SIDO_CODES, true)) {
            return self::findUnit($pdo, 'unit_level = \'sido\' AND sido_code = ?', [$sido]);
        }
        if (!in_array($sido, self::PROVINCE_SIDO_CODES, true) || strlen($sigunguCode) < 5) {
            return null;
        }
        if ($sido === self::GWANGJU_SIDO_CODE && in_array(substr($sigunguCode, 0, 5), self::GWANGJU_GU_CODES, true)) {
            return self::findUnit($pdo, 'sido_code = ? AND sigungu_code = ?', [$sido, self::GWANGJU_SIGUNGU_CODE]);
        }
        foreach (array_unique([substr($sigunguCode, 0, 5), substr($sigunguCode, 0, 4) . '0']) as $code) {
            $id = self::findUnit($pdo, 'unit_level = \'sigungu\' AND sido_code = ? AND sigungu_code = ?', [$sido, $code]);
            if ($id !== null) {
                return $id;
            }
        }

        return null;
    }

    /** @param list<string> $params */
    private static function findUnit(PDO $pdo, string $where, array $params): ?int
    {
        $stmt = $pdo->prepare('SELECT ' . self::ROW_COLUMNS . ' FROM regions WHERE ' . $where . ' ORDER BY id ASC');
        $stmt->execute($params);
        foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) ?: [] as $row) {
            if (is_array($row) && self::isUnitRow($row)) {
                return (int) $row['id'];
            }
        }

        return null;
    }
}
