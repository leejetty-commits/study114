<?php

declare(strict_types=1);

namespace Study114\Paid;

use PDO;

/** 18d — PG 더미 주문 (+ PR-A 카탈로그 스냅샷 컬럼 선택적 기록) */
final class ProviderCheckoutRepository
{
    public function __construct(private readonly PDO $pdo)
    {
    }

    private function hasColumn(string $column): bool
    {
        static $cache = [];
        if (array_key_exists($column, $cache)) {
            return $cache[$column];
        }
        $stmt = $this->pdo->prepare(
            'SELECT 1 FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE()
               AND TABLE_NAME = ?
               AND COLUMN_NAME = ?
             LIMIT 1'
        );
        $stmt->execute(['provider_payment_orders', $column]);
        $cache[$column] = (bool) $stmt->fetchColumn();

        return $cache[$column];
    }

    private function hasProviderColumns(): bool
    {
        return $this->hasColumn('provider_type');
    }

    private function hasCatalogColumns(): bool
    {
        return $this->hasColumn('catalog_version');
    }

    /**
     * @param 'study_room'|'tutor'|null $providerType
     * @param array<string, mixed>|null $priceSnapshot
     */
    public function insertPending(
        int $userId,
        string $orderRef,
        string $productId,
        string $variant,
        string $kind,
        int $amountWon,
        ?string $providerType = null,
        ?int $providerId = null,
        ?string $catalogVersion = null,
        ?int $listPriceWon = null,
        ?int $discountWon = null,
        ?array $priceSnapshot = null,
    ): void {
        $hasProvider = $this->hasProviderColumns();
        $hasCatalog = $this->hasCatalogColumns();
        $snapshotJson = $priceSnapshot !== null
            ? json_encode($priceSnapshot, JSON_UNESCAPED_UNICODE)
            : null;

        if ($hasProvider && $hasCatalog) {
            $stmt = $this->pdo->prepare(
                'INSERT INTO provider_payment_orders
                 (user_id, order_ref, product_id, variant_label, product_kind,
                  provider_type, provider_id, amount_won,
                  catalog_version, list_price_won, discount_won, price_snapshot_json,
                  status, pg_provider)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
            );
            $stmt->execute([
                $userId,
                $orderRef,
                $productId,
                $variant,
                $kind,
                $providerType,
                $providerId,
                $amountWon,
                $catalogVersion,
                $listPriceWon,
                $discountWon,
                $snapshotJson,
                'pending',
                'dev_mock',
            ]);

            return;
        }

        if ($hasProvider) {
            $stmt = $this->pdo->prepare(
                'INSERT INTO provider_payment_orders
                 (user_id, order_ref, product_id, variant_label, product_kind,
                  provider_type, provider_id, amount_won, status, pg_provider)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
            );
            $stmt->execute([
                $userId,
                $orderRef,
                $productId,
                $variant,
                $kind,
                $providerType,
                $providerId,
                $amountWon,
                'pending',
                'dev_mock',
            ]);

            return;
        }

        if ($hasCatalog) {
            $stmt = $this->pdo->prepare(
                'INSERT INTO provider_payment_orders
                 (user_id, order_ref, product_id, variant_label, product_kind, amount_won,
                  catalog_version, list_price_won, discount_won, price_snapshot_json,
                  status, pg_provider)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
            );
            $stmt->execute([
                $userId,
                $orderRef,
                $productId,
                $variant,
                $kind,
                $amountWon,
                $catalogVersion,
                $listPriceWon,
                $discountWon,
                $snapshotJson,
                'pending',
                'dev_mock',
            ]);

            return;
        }

        $stmt = $this->pdo->prepare(
            'INSERT INTO provider_payment_orders
             (user_id, order_ref, product_id, variant_label, product_kind, amount_won, status, pg_provider)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([$userId, $orderRef, $productId, $variant, $kind, $amountWon, 'pending', 'dev_mock']);
    }

    /** @return array<string, mixed>|null */
    public function getByRef(string $orderRef): ?array
    {
        $stmt = $this->pdo->prepare(
            'SELECT * FROM provider_payment_orders WHERE order_ref = ? LIMIT 1'
        );
        $stmt->execute([$orderRef]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return is_array($row) ? $row : null;
    }

    /** @return array<string, mixed>|null */
    public function getByRefForUpdate(string $orderRef): ?array
    {
        $stmt = $this->pdo->prepare(
            'SELECT * FROM provider_payment_orders WHERE order_ref = ? LIMIT 1 FOR UPDATE'
        );
        $stmt->execute([$orderRef]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return is_array($row) ? $row : null;
    }

    public function markPaid(string $orderRef): void
    {
        $stmt = $this->pdo->prepare(
            'UPDATE provider_payment_orders SET status = ?, paid_at = NOW() WHERE order_ref = ? AND status = ?'
        );
        $stmt->execute(['paid', $orderRef, 'pending']);
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function listByUser(int $userId, int $limit = 50): array
    {
        $limit = max(1, min(100, $limit));
        $cols = 'order_ref, product_id, variant_label, product_kind, amount_won, status, pg_provider, created_at, paid_at';
        if ($this->hasProviderColumns()) {
            $cols = 'order_ref, product_id, variant_label, product_kind, provider_type, provider_id, amount_won, status, pg_provider, created_at, paid_at';
        }
        if ($this->hasCatalogColumns()) {
            $cols .= ', catalog_version, list_price_won, discount_won';
        }
        $stmt = $this->pdo->prepare(
            "SELECT {$cols}
             FROM provider_payment_orders
             WHERE user_id = ?
             ORDER BY COALESCE(paid_at, created_at) DESC, id DESC
             LIMIT {$limit}"
        );
        $stmt->execute([$userId]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return is_array($rows) ? $rows : [];
    }
}
