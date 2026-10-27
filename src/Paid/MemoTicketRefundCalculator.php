<?php

declare(strict_types=1);

namespace Study114\Paid;

use DateTimeImmutable;
use DateTimeZone;

/**
 * 쪽지권 환불액 계산기 (324 · 2026-10-27 잠금)
 *
 * 순수 계산 전용. PDO·API·PG 호출 금지.
 * 정본: docs/ssot/18c-memo-ticket-refund-lock.md
 */
final class MemoTicketRefundCalculator
{
    /** 환불 가능 기한: paid_at 로부터 7×24시간 */
    private const REFUND_WINDOW_SECONDS = 7 * 24 * 60 * 60;

    /**
     * 환불표 — 상품별 (사용횟수 → 환불액)
     * 키: variant (정규화 후)
     * 값: [조건 함수(used, isWithin7, isExpired, dispatchSent) → [refund_won, reason_code]] 형태 대신
     *      명시적 테이블로 구현한다.
     */
    private const REFUND_TABLE = [
        '1회' => [
            'sale_price' => 500,
            'type' => 'immediate',
        ],
        '5회권' => [
            'sale_price' => 2250,
            'type' => 'pack',
            'within7' => [
                0 => 2250,  // 사용 0
                1 => 1125,  // 사용 1
                2 => 750,   // 사용 2
                // 3+ → 0
            ],
            'max_refundable_used' => 2,
        ],
        '10회권' => [
            'sale_price' => 4000,
            'type' => 'pack',
            'within7' => [
                0 => 4000,  // 사용 0
                1 => 2000,  // 사용 1~3
                2 => 2000,
                3 => 2000,
                4 => 1300,  // 사용 4
                // 5+ → 0
            ],
            'max_refundable_used' => 4,
        ],
    ];

    private const VARIANT_ALIASES = [
        '5회' => '5회권',
        '10회' => '10회권',
    ];

    /**
     * @param array{
     *   variant: string,
     *   order_status: string,
     *   amount_won: int,
     *   paid_at: string|\DateTimeInterface,
     *   pack_size?: int|null,
     *   remaining?: int|null,
     *   expires_at?: string|\DateTimeInterface|null,
     *   dispatch_status?: string|null
     * } $in
     * @return array{
     *   refundable: bool,
     *   refund_won: int,
     *   table_won: int,
     *   used_count: int,
     *   days_elapsed_seconds: int,
     *   reason_code: string
     * }
     */
    public static function calculate(array $in, DateTimeImmutable $now): array
    {
        $variant = self::normalizeVariant(trim($in['variant'] ?? ''));
        if ($variant === null) {
            return self::result(0, 0, 0, 0, 'unknown_variant');
        }

        $orderStatus = trim($in['order_status'] ?? '');
        if ($orderStatus !== 'paid') {
            return self::result(0, 0, 0, 0, 'not_paid');
        }

        $amountWon = (int) ($in['amount_won'] ?? 0);
        $paidAt = self::toDatetime($in['paid_at'] ?? '');
        if ($paidAt === null) {
            return self::result(0, 0, 0, 0, 'invalid_paid_at');
        }

        $elapsed = $now->getTimestamp() - $paidAt->getTimestamp();
        $isWithin7 = $elapsed <= self::REFUND_WINDOW_SECONDS;
        $table = self::REFUND_TABLE[$variant];

        if ($table['type'] === 'immediate') {
            return self::calculateImmediate($in, $amountWon, $isWithin7, $elapsed);
        }

        return self::calculatePack($variant, $in, $amountWon, $isWithin7, $elapsed, $now);
    }

    /**
     * 1회 즉시권 환불 판정
     */
    private static function calculateImmediate(array $in, int $amountWon, bool $isWithin7, int $elapsed): array
    {
        $dispatchStatus = trim($in['dispatch_status'] ?? '');

        if ($dispatchStatus === 'sent') {
            return self::result(0, 0, 0, $elapsed, 'sent');
        }

        if (!$isWithin7) {
            return self::result(0, 0, 0, $elapsed, 'over_7days');
        }

        $tableWon = self::REFUND_TABLE['1회']['sale_price'];
        $refundWon = min($tableWon, $amountWon);

        return self::result($refundWon, $tableWon, 0, $elapsed, 'within7_used0');
    }

    /**
     * 5회권·10회권 팩 환불 판정
     */
    private static function calculatePack(
        string $variant,
        array $in,
        int $amountWon,
        bool $isWithin7,
        int $elapsed,
        DateTimeImmutable $now,
    ): array {
        $packSize = (int) ($in['pack_size'] ?? 0);
        $remaining = (int) ($in['remaining'] ?? 0);
        $used = max(0, $packSize - $remaining);

        $expiresAt = self::toDatetime($in['expires_at'] ?? null);
        if ($expiresAt !== null && $now >= $expiresAt) {
            return self::result(0, 0, $used, $elapsed, 'expired');
        }

        if (!$isWithin7) {
            return self::result(0, 0, $used, $elapsed, 'over_7days');
        }

        $table = self::REFUND_TABLE[$variant];
        $maxUsed = $table['max_refundable_used'];

        if ($used > $maxUsed) {
            return self::result(0, 0, $used, $elapsed, 'used_over');
        }

        $tableWon = $table['within7'][$used] ?? 0;
        if ($tableWon <= 0) {
            return self::result(0, 0, $used, $elapsed, 'used_over');
        }

        $refundWon = min($tableWon, $amountWon);
        $reasonCode = self::packReasonCode($variant, $used);

        return self::result($refundWon, $tableWon, $used, $elapsed, $reasonCode);
    }

    private static function packReasonCode(string $variant, int $used): string
    {
        if ($variant === '10회권' && $used >= 1 && $used <= 3) {
            return 'within7_used1to3';
        }
        if ($variant === '10회권' && $used === 4) {
            return 'within7_used4';
        }

        return 'within7_used' . $used;
    }

    private static function normalizeVariant(string $variant): ?string
    {
        if (isset(self::REFUND_TABLE[$variant])) {
            return $variant;
        }
        if (isset(self::VARIANT_ALIASES[$variant])) {
            return self::VARIANT_ALIASES[$variant];
        }
        if ($variant === '20회' || $variant === '20회권') {
            return null;
        }

        return null;
    }

    private static function toDatetime(mixed $value): ?DateTimeImmutable
    {
        if ($value instanceof \DateTimeInterface) {
            return DateTimeImmutable::createFromInterface($value);
        }
        if (is_string($value) && $value !== '') {
            try {
                return new DateTimeImmutable($value, new DateTimeZone('Asia/Seoul'));
            } catch (\Throwable) {
                return null;
            }
        }

        return null;
    }

    /**
     * @return array{refundable: bool, refund_won: int, table_won: int, used_count: int, days_elapsed_seconds: int, reason_code: string}
     */
    private static function result(int $refundWon, int $tableWon, int $usedCount, int $elapsed, string $reasonCode): array
    {
        return [
            'refundable' => $refundWon > 0,
            'refund_won' => $refundWon,
            'table_won' => $tableWon,
            'used_count' => $usedCount,
            'days_elapsed_seconds' => max(0, $elapsed),
            'reason_code' => $reasonCode,
        ];
    }
}
