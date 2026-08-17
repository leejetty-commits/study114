<?php

declare(strict_types=1);

namespace Study114\Region;

use PDO;

final class AddressRegionMatch
{
    public static function compactSido(string $value): string
    {
        $out = preg_replace('/특별자치시|특별자치도|특별시|광역시|자치도/u', '', $value) ?? $value;
        $out = preg_replace('/도$/u', '', $out) ?? $out;

        return preg_replace('/\s+/u', '', $out) ?? $out;
    }

    /**
     * @return int|null region id
     */
    public static function match(PDO $pdo, string $sido, string $sigungu, string $bname): ?int
    {
        $dong = trim($bname);
        if ($dong === '') {
            return null;
        }

        $stmt = $pdo->prepare(
            'SELECT id, sido_name, sigungu_name, dong_name
             FROM regions
             WHERE is_active = 1 AND dong_name = ?
             ORDER BY id ASC'
        );
        $stmt->execute([$dong]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        if ($rows === []) {
            $stmt = $pdo->prepare(
                'SELECT id, sido_name, sigungu_name, dong_name
                 FROM regions
                 WHERE is_active = 1 AND (dong_name LIKE ? OR ? LIKE CONCAT(dong_name, "%"))
                 ORDER BY id ASC
                 LIMIT 20'
            );
            $stmt->execute([$dong . '%', $dong]);
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        }
        if ($rows === []) {
            return null;
        }

        $sidoKey = self::compactSido($sido);
        $sigunguKey = preg_replace('/\s+/u', '', $sigungu) ?? $sigungu;

        $bestId = null;
        $bestScore = -1;
        foreach ($rows as $row) {
            $score = 10;
            $sidoName = self::compactSido((string) ($row['sido_name'] ?? ''));
            if ($sidoKey !== '' && $sidoName === $sidoKey) {
                $score += 5;
            }
            $sigunguName = preg_replace('/\s+/u', '', (string) ($row['sigungu_name'] ?? '')) ?? '';
            if ($sigunguKey !== '' && $sigunguName !== '') {
                if ($sigunguName === $sigunguKey) {
                    $score += 5;
                } elseif (str_contains($sigunguName, $sigunguKey) || str_contains($sigunguKey, $sigunguName)) {
                    $score += 3;
                }
            }
            if ($score > $bestScore) {
                $bestScore = $score;
                $bestId = (int) $row['id'];
            }
        }

        if ($sidoKey !== '' && $bestScore < 15) {
            return null;
        }

        return $bestId;
    }
}
