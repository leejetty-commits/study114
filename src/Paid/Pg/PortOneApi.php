<?php

declare(strict_types=1);

namespace Study114\Paid\Pg;

/**
 * 339 — 포트원 API 추상화 (실클라이언트·모의 주입용).
 */
interface PortOneApi
{
    /** @return array<string, mixed> */
    public function getPayment(string $paymentId): array;

    /**
     * @return array{cancel_id: string, cancelled_at: string|null, cancel_amount_won: int, remaining_won: int, raw: array<string, mixed>}
     */
    public function cancelPayment(
        string $paymentId,
        int $amountWon,
        string $reason,
        ?int $currentCancellableAmount = null,
    ): array;

    /** @param array<string, mixed> $payment */
    public function extractTotalAmount(array $payment): int;

    /** @param array<string, mixed> $payment */
    public function extractCurrency(array $payment): string;

    /** @param array<string, mixed> $payment */
    public function extractCancellableAmount(array $payment): int;
}
