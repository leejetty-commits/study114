<?php

declare(strict_types=1);

namespace Study114\Paid;

use DateTimeImmutable;
use Throwable;

/**
 * New 자동배지 — 판매 상품 아님 (paid_badges[] 금지).
 *
 * 앵커: 첫 공개일 published_at (COALESCE로 재게시해도 리셋되지 않음).
 * 창: 앵커 시각부터 7일 미만. 7일 정각부터 종료.
 */
final class AutoNewBadge
{
    public const WINDOW_DAYS = 7;

    public static function isActive(
        ?string $publishedAt,
        ?string $createdAt = null,
        ?DateTimeImmutable $now = null,
    ): bool {
        $anchorRaw = self::firstNonEmpty($publishedAt, $createdAt);
        if ($anchorRaw === null) {
            return false;
        }
        $anchor = self::parse($anchorRaw);
        if ($anchor === null) {
            return false;
        }
        $now = $now ?? new DateTimeImmutable('now');
        if ($anchor > $now) {
            return false;
        }
        $ends = $anchor->modify('+' . self::WINDOW_DAYS . ' days');

        return $now < $ends;
    }

    private static function firstNonEmpty(?string $a, ?string $b): ?string
    {
        $a = $a !== null ? trim($a) : '';
        if ($a !== '') {
            return $a;
        }
        $b = $b !== null ? trim($b) : '';

        return $b !== '' ? $b : null;
    }

    private static function parse(string $raw): ?DateTimeImmutable
    {
        try {
            return new DateTimeImmutable($raw);
        } catch (Throwable) {
            $ts = strtotime($raw);

            return $ts !== false ? (new DateTimeImmutable())->setTimestamp($ts) : null;
        }
    }
}
