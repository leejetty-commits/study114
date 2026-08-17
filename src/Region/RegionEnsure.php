<?php

declare(strict_types=1);

namespace Study114\Region;

use InvalidArgumentException;
use PDO;
use PDOException;

/**
 * 카카오 우편번호 결과 → regions 행.
 * 전국 행정동/법정동을 미리 시드하지 않고, 주소 검색으로 고른 동만 멱등 추가한다.
 */
final class RegionEnsure
{
    /**
     * @param array<string, mixed> $input
     * @return array{id:int,label:string,sido_name:string,sigungu_name:string,dong_name:string,dong_code:string}
     */
    public static function fromKakao(PDO $pdo, array $input): array
    {
        $sido = trim((string) ($input['sido'] ?? $input['address_sido'] ?? ''));
        $sigungu = trim((string) ($input['sigungu'] ?? $input['address_sigungu'] ?? ''));
        $bname = trim((string) ($input['bname'] ?? $input['address_bname'] ?? ''));
        $hname = trim((string) ($input['hname'] ?? $input['address_hname'] ?? ''));
        $bcode = preg_replace('/\D+/', '', (string) ($input['bcode'] ?? $input['address_bcode'] ?? '')) ?? '';
        $sigunguCodeIn = preg_replace(
            '/\D+/',
            '',
            (string) ($input['sigungu_code'] ?? $input['sigunguCode'] ?? $input['address_sigungu_code'] ?? '')
        ) ?? '';

        $dongName = self::dongNameFromKakao($hname, $bname, (string) ($input['region_label'] ?? ''));
        if ($sido === '' || $dongName === '') {
            throw new InvalidArgumentException('주소에서 시·동을 읽지 못했습니다. 다른 주소를 검색해 주세요.');
        }

        $sidoCode = strlen($bcode) >= 2
            ? substr($bcode, 0, 2)
            : (strlen($sigunguCodeIn) >= 2 ? substr($sigunguCodeIn, 0, 2) : '');
        $sigunguCode = strlen($bcode) >= 5
            ? substr($bcode, 0, 5)
            : (strlen($sigunguCodeIn) >= 5 ? substr($sigunguCodeIn, 0, 5) : '');
        if ($sigunguCode === '' && $sidoCode !== '') {
            $sigunguCode = $sidoCode . '000';
        }
        if ($sidoCode === '') {
            $sidoCode = '00';
        }
        if ($sigunguCode === '') {
            $sigunguCode = '00000';
        }

        $dongCode = self::dongCodeFor($bcode, $sigunguCode, $dongName, $hname, $bname);

        $found = self::findExisting($pdo, $sido, $sigungu, $dongName, $dongCode);
        if ($found !== null) {
            return $found;
        }

        try {
            return self::insertRow($pdo, $sidoCode, $sido, $sigunguCode, $sigungu, $dongCode, $dongName);
        } catch (PDOException $e) {
            $found = self::findExisting($pdo, $sido, $sigungu, $dongName, $dongCode);
            if ($found !== null) {
                return $found;
            }
            $altCode = self::altDongCode($sigunguCode, $dongName);
            $found = self::findExisting($pdo, $sido, $sigungu, $dongName, $altCode);
            if ($found !== null) {
                return $found;
            }
            try {
                return self::insertRow($pdo, $sidoCode, $sido, $sigunguCode, $sigungu, $altCode, $dongName);
            } catch (PDOException $retry) {
                $found = self::findExisting($pdo, $sido, $sigungu, $dongName, $altCode);
                if ($found !== null) {
                    return $found;
                }
                throw new InvalidArgumentException('행정동을 저장하지 못했습니다. 주소 검색으로 다시 선택해 주세요.');
            }
        }
    }

    private static function dongNameFromKakao(string $hname, string $bname, string $regionLabel): string
    {
        $dong = $hname !== '' ? $hname : $bname;
        if ($dong === '') {
            $parts = preg_split('/\s+/u', trim($regionLabel)) ?: [];
            $dong = (string) (end($parts) ?: '');
        }
        $dong = trim((string) (preg_replace('/\s+\d+(-\d+)?$/u', '', $dong) ?? $dong));
        if ($dong === '시 대표') {
            return '';
        }

        return $dong;
    }

    private static function dongCodeFor(
        string $bcode,
        string $sigunguCode,
        string $dongName,
        string $hname,
        string $bname
    ): string {
        if ($hname !== '' && $hname !== $bname) {
            return self::altDongCode($sigunguCode !== '' ? $sigunguCode : substr($bcode, 0, 5), $dongName);
        }
        if (strlen($bcode) >= 8) {
            return substr($bcode, 0, 10);
        }

        return self::altDongCode($sigunguCode, $dongName);
    }

    private static function altDongCode(string $sigunguCode, string $dongName): string
    {
        $prefix = strlen($sigunguCode) >= 5 ? substr($sigunguCode, 0, 5) : str_pad($sigunguCode, 5, '0');

        return substr($prefix . substr(hash('crc32b', $dongName), 0, 5), 0, 10);
    }

    /**
     * @return array{id:int,label:string,sido_name:string,sigungu_name:string,dong_name:string,dong_code:string}
     */
    private static function insertRow(
        PDO $pdo,
        string $sidoCode,
        string $sido,
        string $sigunguCode,
        string $sigungu,
        string $dongCode,
        string $dongName
    ): array {
        $ins = $pdo->prepare(
            'INSERT INTO regions (
                sido_code, sido_name, sigungu_code, sigungu_name, dong_code, dong_name, is_active
             ) VALUES (?, ?, ?, ?, ?, ?, 1)'
        );
        $ins->execute([$sidoCode, $sido, $sigunguCode, $sigungu !== '' ? $sigungu : $sido, $dongCode, $dongName]);
        $id = (int) $pdo->lastInsertId();
        if ($id <= 0) {
            throw new PDOException('regions insert produced no id');
        }

        return self::rowById($pdo, $id) ?? self::pack($id, $sido, $sigungu, $dongName, $dongCode);
    }

    /**
     * @return array{id:int,label:string,sido_name:string,sigungu_name:string,dong_name:string,dong_code:string}|null
     */
    private static function findExisting(
        PDO $pdo,
        string $sido,
        string $sigungu,
        string $dongName,
        string $dongCode
    ): ?array {
        $stmt = $pdo->prepare(
            'SELECT id, sido_name, sigungu_name, dong_name, dong_code
             FROM regions
             WHERE is_active = 1
               AND dong_name = ?
               AND dong_name <> \'시 대표\'
               AND sido_name = ?
               AND (sigungu_name = ? OR ? = \'\')
             ORDER BY id ASC
             LIMIT 1'
        );
        $stmt->execute([$dongName, $sido, $sigungu, $sigungu]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (is_array($row)) {
            return self::hydrate($row);
        }

        if ($dongCode !== '') {
            $stmt = $pdo->prepare(
                'SELECT id, sido_name, sigungu_name, dong_name, dong_code
                 FROM regions
                 WHERE dong_code = ? AND dong_name = ? AND is_active = 1
                 LIMIT 1'
            );
            $stmt->execute([$dongCode, $dongName]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if (is_array($row) && (string) ($row['dong_name'] ?? '') !== '시 대표') {
                return self::hydrate($row);
            }
        }

        return null;
    }

    /**
     * @return array{id:int,label:string,sido_name:string,sigungu_name:string,dong_name:string,dong_code:string}|null
     */
    private static function rowById(PDO $pdo, int $id): ?array
    {
        $stmt = $pdo->prepare(
            'SELECT id, sido_name, sigungu_name, dong_name, dong_code
             FROM regions WHERE id = ? LIMIT 1'
        );
        $stmt->execute([$id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return is_array($row) ? self::hydrate($row) : null;
    }

    /**
     * @param array<string, mixed> $row
     * @return array{id:int,label:string,sido_name:string,sigungu_name:string,dong_name:string,dong_code:string}
     */
    private static function hydrate(array $row): array
    {
        $sido = (string) ($row['sido_name'] ?? '');
        $sigungu = (string) ($row['sigungu_name'] ?? '');
        $dong = (string) ($row['dong_name'] ?? '');

        return self::pack((int) $row['id'], $sido, $sigungu, $dong, (string) ($row['dong_code'] ?? ''));
    }

    /**
     * @return array{id:int,label:string,sido_name:string,sigungu_name:string,dong_name:string,dong_code:string}
     */
    private static function pack(int $id, string $sido, string $sigungu, string $dong, string $code): array
    {
        $label = trim($sido . ' ' . $sigungu . ' ' . $dong);

        return [
            'id' => $id,
            'label' => $label,
            'sido_name' => $sido,
            'sigungu_name' => $sigungu,
            'dong_name' => $dong,
            'dong_code' => $code,
        ];
    }
}
