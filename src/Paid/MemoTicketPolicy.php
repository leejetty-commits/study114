<?php

declare(strict_types=1);

namespace Study114\Paid;

use DateTimeImmutable;

/** PR-B 쪽지권 정책 상수 */
final class MemoTicketPolicy
{
    public const PAID_EXPIRE_DAYS = 120;
    public const SOURCE_PAYMENT = 'payment';
    public const SOURCE_BUNDLE = 'position_bundle';
    public const GRANT_PAYMENT_PACK = 'payment_pack';
    public const GRANT_POSITION_BUNDLE = 'position_bundle';
    public const GRANT_MANUAL = 'manual';

    public static function isPaidPackVariant(string $variant): bool
    {
        return in_array($variant, ['5회권', '10회권', '5회', '10회'], true);
    }

    public static function isImmediateVariant(string $variant): bool
    {
        return $variant === '1회';
    }

    public static function expireAtFromFulfill(?DateTimeImmutable $paidAt = null): DateTimeImmutable
    {
        $from = $paidAt ?? new DateTimeImmutable('now');

        return $from->modify('+' . self::PAID_EXPIRE_DAYS . ' days');
    }

    public static function packLockKey(string $providerType, int $providerId): string
    {
        return substr('s114_memo_' . $providerType . '_' . $providerId, 0, 64);
    }

    public static function immediateLockKey(string $orderRef): string
    {
        return substr('s114_imm_' . $orderRef, 0, 64);
    }

    public static function grantLabel(string $grantKind): string
    {
        return match ($grantKind) {
            self::GRANT_PAYMENT_PACK, self::SOURCE_PAYMENT => '유료 구매',
            self::GRANT_POSITION_BUNDLE, self::SOURCE_BUNDLE => '노출상품 무료 혜택',
            self::GRANT_MANUAL => '운영 보정',
            'migration' => '이전 잔액',
            default => '기타',
        };
    }

    public static function packStatus(int $remaining, string $expiresAt, ?DateTimeImmutable $now = null): string
    {
        $now = $now ?? new DateTimeImmutable('now');
        if ($now >= new DateTimeImmutable($expiresAt)) {
            return '만료';
        }
        if ($remaining <= 0) {
            return '모두 사용';
        }

        return '사용 중';
    }
}
