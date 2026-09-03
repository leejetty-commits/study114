<?php

declare(strict_types=1);

namespace Study114\Paid;

use DateTimeImmutable;
use InvalidArgumentException;

/**
 * Prime/Pick 기간 계산 — day / calendar month 분리.
 *
 * - 화면 종료일(ends_on): 포함형 (마지막 이용일)
 * - 내부 만료(end_exclusive_on): 반개구간 끝 — today < end_exclusive_on 이면 활성
 */
final class PositionPeriodCalculator
{
    public const TYPE_DAY = 'day';
    public const TYPE_MONTH = 'month';

    /** @var array<string, array{0: self::TYPE_DAY|self::TYPE_MONTH, 1: int}> */
    public const VARIANT_MAP = [
        '2주' => [self::TYPE_DAY, 14],
        '3주' => [self::TYPE_DAY, 21], // 판매 종료 · fromVariant 호환만 유지
        '1개월' => [self::TYPE_MONTH, 1],
        '2개월' => [self::TYPE_MONTH, 2],
        '3개월' => [self::TYPE_MONTH, 3],
        '6개월' => [self::TYPE_MONTH, 6],
    ];

    /** 판매 중인 기간 (PaidCatalog 정본과 동일) */
    public const SELLABLE_VARIANTS = ['2주', '1개월', '2개월', '3개월', '6개월'];

    /**
     * @return array{
     *   duration_type: 'day'|'month',
     *   duration_value: int,
     *   started_on: string,
     *   end_exclusive_on: string,
     *   ends_on: string,
     *   period_days: int,
     *   starts_at: string,
     *   ends_at: string
     * }
     */
    public static function fromVariant(string $variant, ?string $startedOn = null): array
    {
        if (!isset(self::VARIANT_MAP[$variant])) {
            throw new InvalidArgumentException('variant: 2주 · 1·2·3·6개월');
        }
        [$type, $value] = self::VARIANT_MAP[$variant];

        return self::compute($startedOn ?? self::today(), $type, $value);
    }

    /**
     * @param self::TYPE_DAY|self::TYPE_MONTH $durationType
     * @return array{
     *   duration_type: 'day'|'month',
     *   duration_value: int,
     *   started_on: string,
     *   end_exclusive_on: string,
     *   ends_on: string,
     *   period_days: int,
     *   starts_at: string,
     *   ends_at: string
     * }
     */
    public static function compute(string $startedOn, string $durationType, int $durationValue): array
    {
        if ($durationValue < 1) {
            throw new InvalidArgumentException('duration_value는 1 이상이어야 합니다.');
        }
        if ($durationType !== self::TYPE_DAY && $durationType !== self::TYPE_MONTH) {
            throw new InvalidArgumentException('duration_type: day | month');
        }

        $start = self::parseDate($startedOn);
        if ($durationType === self::TYPE_DAY) {
            $endExclusive = $start->modify('+' . $durationValue . ' days');
            $endsOn = $endExclusive->modify('-1 day');
        } else {
            [$anchor, $clamped] = self::addCalendarMonths($start, $durationValue);
            if ($clamped) {
                // 다음 달 같은 일이 없으면 그 달 말일까지 포함
                $endsOn = $anchor;
                $endExclusive = $anchor->modify('+1 day');
            } else {
                $endExclusive = $anchor;
                $endsOn = $anchor->modify('-1 day');
            }
        }

        $started = $start->format('Y-m-d');
        $exclusive = $endExclusive->format('Y-m-d');
        $inclusive = $endsOn->format('Y-m-d');
        $periodDays = (int) $start->diff($endExclusive)->format('%a');

        return [
            'duration_type' => $durationType,
            'duration_value' => $durationValue,
            'started_on' => $started,
            'end_exclusive_on' => $exclusive,
            'ends_on' => $inclusive,
            'period_days' => $periodDays,
            'starts_at' => $started . ' 00:00:00',
            'ends_at' => $exclusive . ' 00:00:00',
        ];
    }

    public static function isActiveOn(string $today, string $endExclusiveOn): bool
    {
        return self::parseDate($today) < self::parseDate($endExclusiveOn);
    }

    public static function today(): string
    {
        return (new DateTimeImmutable('today'))->format('Y-m-d');
    }

    /**
     * @return array{0: DateTimeImmutable, 1: bool} [anchor same-day-or-clamped, clamped?]
     */
    private static function addCalendarMonths(DateTimeImmutable $start, int $months): array
    {
        $year = (int) $start->format('Y');
        $month = (int) $start->format('n') + $months;
        $day = (int) $start->format('j');

        $year += intdiv($month - 1, 12);
        $month = (($month - 1) % 12) + 1;
        if ($month < 1) {
            $month += 12;
            $year--;
        }

        $lastDay = (int) (new DateTimeImmutable(sprintf('%04d-%02d-01', $year, $month)))->format('t');
        $clamped = $day > $lastDay;
        $useDay = min($day, $lastDay);

        return [
            new DateTimeImmutable(sprintf('%04d-%02d-%02d', $year, $month, $useDay)),
            $clamped,
        ];
    }

    private static function parseDate(string $ymd): DateTimeImmutable
    {
        $dt = DateTimeImmutable::createFromFormat('!Y-m-d', substr($ymd, 0, 10));
        if ($dt === false) {
            throw new InvalidArgumentException('날짜 형식이 올바르지 않습니다: ' . $ymd);
        }

        return $dt;
    }
}
