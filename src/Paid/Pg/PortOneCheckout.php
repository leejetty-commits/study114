<?php

declare(strict_types=1);

namespace Study114\Paid\Pg;

use InvalidArgumentException;
use RuntimeException;

/**
 * 339 — 포트원 결제 확정·취소 공통 경로 (complete·웹훅·환불이 공유).
 */
final class PortOneCheckout
{
    public function __construct(
        private readonly ?PortOneApi $client = null,
    ) {
    }

    private function client(): PortOneApi
    {
        return $this->client ?? PortOneClient::fromEnv();
    }

    /**
     * 주문 대비 포트원 단건 조회 검증. 통과 시에만 true.
     *
     * @param array<string, mixed> $order provider_payment_orders row
     */
    public function assertPaidMatchesOrder(array $order, ?string $claimedPaymentId = null): void
    {
        $paymentId = trim((string) ($order['pg_payment_id'] ?? ''));
        if ($paymentId === '') {
            throw new InvalidArgumentException('주문에 paymentId가 없습니다.');
        }
        if ($claimedPaymentId !== null && trim($claimedPaymentId) !== '' && trim($claimedPaymentId) !== $paymentId) {
            throw new InvalidArgumentException('paymentId가 주문과 일치하지 않습니다.');
        }

        $payment = $this->client()->getPayment($paymentId);
        $status = (string) ($payment['status'] ?? '');
        if ($status !== 'PAID') {
            throw new InvalidArgumentException('결제가 완료되지 않았습니다. status=' . $status);
        }

        $paidAmount = $this->client()->extractTotalAmount($payment);
        $orderAmount = (int) ($order['amount_won'] ?? 0);
        if ($paidAmount !== $orderAmount) {
            throw new InvalidArgumentException('결제 금액이 주문과 일치하지 않습니다.');
        }

        $currency = $this->client()->extractCurrency($payment);
        // 빈 값·비KRW 거절
        if ($currency !== 'KRW' && $currency !== 'CURRENCY_KRW') {
            throw new InvalidArgumentException('결제 통화가 주문과 일치하지 않습니다.');
        }
    }

    /**
     * @return array{cancel_id: string, cancelled_at: string|null, cancel_amount_won: int, remaining_won: int}
     */
    public function cancel(string $paymentId, int $amountWon, int $remainingBefore, string $reason): array
    {
        if ($amountWon <= 0) {
            throw new InvalidArgumentException('취소 금액이 올바르지 않습니다.');
        }
        if ($amountWon > $remainingBefore) {
            throw new InvalidArgumentException('남은 금액을 넘는 취소는 할 수 없습니다.');
        }

        try {
            return $this->client()->cancelPayment($paymentId, $amountWon, $reason, $remainingBefore);
        } catch (RuntimeException $e) {
            error_log('[portone] cancel failed paymentId=' . $paymentId . ' amount=' . $amountWon . ' err=' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * 프런트 requestPayment용 공개 설정 (시크릿 제외).
     *
     * @return array{store_id: string, channel_key: string}
     */
    public static function publicConfig(): array
    {
        $storeId = getenv('PORTONE_STORE_ID');
        $channelKey = getenv('PORTONE_CHANNEL_KEY');
        if (!is_string($storeId) || trim($storeId) === '') {
            throw new RuntimeException('PORTONE_STORE_ID가 없습니다.');
        }
        if (!is_string($channelKey) || trim($channelKey) === '') {
            throw new RuntimeException('PORTONE_CHANNEL_KEY가 없습니다.');
        }

        return [
            'store_id' => trim($storeId),
            'channel_key' => trim($channelKey),
        ];
    }

    public static function makePaymentId(string $orderRef): string
    {
        // 포트원 paymentId: 영숫자·_- 권장. order_ref 기반 고유값.
        $safe = preg_replace('/[^A-Za-z0-9_-]/', '-', $orderRef) ?? $orderRef;

        return 'pay_' . $safe;
    }

    public static function orderName(string $productId, string $variant): string
    {
        $productId = trim($productId);
        $variant = trim($variant);

        return 'study114 ' . ($productId !== '' ? $productId : 'order')
            . ($variant !== '' ? (' ' . $variant) : '');
    }
}
