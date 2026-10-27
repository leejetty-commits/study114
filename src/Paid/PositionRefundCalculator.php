<?php

declare(strict_types=1);

namespace Study114\Paid;

use DateTimeImmutable;

/**
 * 327 — 노출상품(프라임·픽) 환불액 계산기 (순수 계산)
 *
 * DB 접근 0 · API 0 · PG 호출 0.
 * 정본: docs/ssot/18d-position-refund-lock.md
 *
 * 달력: PositionPeriodCalculator::BUSINESS_TZ = Asia/Seoul
 * 구간: [seg_start, seg_end_exclusive) 반개구간
 * 공식: 시작 전 전액 · 시작 후 요청일 다음 날부터 남은 날 일할(floor) · 종료 후 불가
 * amount_won = 실제 결제금액(배지 포함). table_won = refund_won (노출엔 별도 표 없음).
 */
final class PositionRefundCalculator
{
    /**
     * @param array{
     *   paid_at: string,
     *   amount_won: int,
     *   variant: string,
     *   grant_mode: string,
     *   segment_started_on: string,
     *   segment_end_exclusive_on: string,
     *   has_live_later_extension?: bool,
     *   linked_badge_addons?: list<array{order_ref: string, amount_won: int, segment_started_on: string, segment_end_exclusive_on: string}>,
     *   bundle_order_ref?: string|null
     * } $in
     * @return array{
     *   refundable: bool,
     *   refund_won: int,
     *   table_won: int,
     *   reason_code: string,
     *   seg_start: string,
     *   seg_end_exclusive: string,
     *   seg_days: int,
     *   remaining_days: int,
     *   breakdown: list<array{label: string, amount_won: int, refund_won: int}>
     * }
     */
    public static function calculate(array $in, DateTimeImmutable $now): array
    {
        $tz = PositionPeriodCalculator::timezone();
        $today = $now->setTimezone($tz)->format('Y-m-d');

        $amountWon = (int) ($in['amount_won'] ?? 0);
        $segStart = trim($in['segment_started_on'] ?? '');
        $segEndExcl = trim($in['segment_end_exclusive_on'] ?? '');

        if ($segStart === '' || $segEndExcl === '') {
            return self::result(0, 'not_paid', $segStart, $segEndExcl, 0, 0, []);
        }

        $segStartDt = self::parseDate($segStart, $tz);
        $segEndDt = self::parseDate($segEndExcl, $tz);
        $todayDt = self::parseDate($today, $tz);

        /* 종료된 구간 — 환불 불가 */
        if ($todayDt >= $segEndDt) {
            return self::result(0, 'period_ended', $segStart, $segEndExcl, 0, 0, []);
        }

        $segDays = (int) $segStartDt->diff($segEndDt)->format('%a');
        if ($segDays <= 0) {
            return self::result(0, 'period_ended', $segStart, $segEndExcl, 0, 0, []);
        }

        /* 시작 전 → 전액 */
        if ($todayDt < $segStartDt) {
            $breakdown = self::buildBreakdown($amountWon, $amountWon, $in);
            return self::result($amountWon, 'before_start_full', $segStart, $segEndExcl, $segDays, $segDays, $breakdown);
        }

        /* 시작 후 → remaining_days = days(today+1 → seg_end_exclusive) */
        $tomorrow = $todayDt->modify('+1 day');
        $remainingDays = max(0, (int) $tomorrow->diff($segEndDt)->format('%a'));

        /* 마지막 날 (요청 다음 날 = seg_end → remaining 0) */
        if ($remainingDays <= 0) {
            return self::result(0, 'last_day', $segStart, $segEndExcl, $segDays, 0, []);
        }

        /* 일할 계산 */
        $refundWon = (int) floor($amountWon * $remainingDays / $segDays);
        $breakdown = self::buildBreakdown($amountWon, $refundWon, $in);

        return self::result($refundWon, 'after_start_prorata', $segStart, $segEndExcl, $segDays, $remainingDays, $breakdown);
    }

    /**
     * @param list<array{label: string, amount_won: int, refund_won: int}> $breakdown
     * @return array{refundable: bool, refund_won: int, table_won: int, reason_code: string, seg_start: string, seg_end_exclusive: string, seg_days: int, remaining_days: int, breakdown: list<array{label: string, amount_won: int, refund_won: int}>}
     */
    private static function result(int $refundWon, string $reasonCode, string $segStart, string $segEnd, int $segDays, int $remainingDays, array $breakdown): array
    {
        return [
            'refundable' => $refundWon > 0,
            'refund_won' => $refundWon,
            'table_won' => $refundWon,
            'reason_code' => $reasonCode,
            'seg_start' => $segStart,
            'seg_end_exclusive' => $segEnd,
            'seg_days' => $segDays,
            'remaining_days' => $remainingDays,
            'breakdown' => $breakdown,
        ];
    }

    /**
     * breakdown: UI 아코디언용 줄 — 금액은 서버가 계산, 프론트는 표시만.
     * @param array<string, mixed> $in
     * @return list<array{label: string, amount_won: int, refund_won: int}>
     */
    private static function buildBreakdown(int $totalAmountWon, int $totalRefundWon, array $in): array
    {
        $lines = [];

        /* 배지 추가 주문(badge_addon)은 노출 환불에 포함 */
        $badgeAddons = is_array($in['linked_badge_addons'] ?? null) ? $in['linked_badge_addons'] : [];
        $badgeAddonAmountSum = 0;
        foreach ($badgeAddons as $addon) {
            $badgeAddonAmountSum += (int) ($addon['amount_won'] ?? 0);
        }

        $positionAmount = max(0, $totalAmountWon - $badgeAddonAmountSum);
        $positionRefund = $totalAmountWon > 0
            ? (int) floor($totalRefundWon * $positionAmount / $totalAmountWon)
            : 0;

        $lines[] = ['label' => '노출분', 'amount_won' => $positionAmount, 'refund_won' => $positionRefund];

        /* 배지분 (노출에 번들된 배지) */
        $badgeBundledAmount = $totalAmountWon - $positionAmount - $badgeAddonAmountSum;
        if ($badgeBundledAmount > 0) {
            $badgeBundledRefund = $totalAmountWon > 0
                ? (int) floor($totalRefundWon * $badgeBundledAmount / $totalAmountWon)
                : 0;
            $lines[] = ['label' => '배지분', 'amount_won' => $badgeBundledAmount, 'refund_won' => $badgeBundledRefund];
        }

        /* 배지 추가 주문분 */
        foreach ($badgeAddons as $addon) {
            $addonAmount = (int) ($addon['amount_won'] ?? 0);
            $addonRefund = $totalAmountWon > 0
                ? (int) floor($totalRefundWon * $addonAmount / $totalAmountWon)
                : 0;
            $lines[] = [
                'label' => '배지 추가주문분',
                'amount_won' => $addonAmount,
                'refund_won' => $addonRefund,
            ];
        }

        /* 번들 회수 (금액 차감 없음, 회수 예정 표시) */
        if (isset($in['bundle_order_ref']) && $in['bundle_order_ref'] !== null && $in['bundle_order_ref'] !== '') {
            $lines[] = ['label' => '무료 쪽지 번들 회수 예정', 'amount_won' => 0, 'refund_won' => 0];
        }

        return $lines;
    }

    private static function parseDate(string $ymd, \DateTimeZone $tz): DateTimeImmutable
    {
        $dt = DateTimeImmutable::createFromFormat('!Y-m-d', substr($ymd, 0, 10), $tz);
        if ($dt === false) {
            throw new \InvalidArgumentException('날짜 형식 오류: ' . $ymd);
        }
        return $dt;
    }
}
