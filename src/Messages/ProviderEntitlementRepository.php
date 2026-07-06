<?php

declare(strict_types=1);

namespace Study114\Messages;

use PDO;

/** 16§7 · 18장 placeholder — provider entitlement */
final class ProviderEntitlementRepository
{
    public function __construct(private readonly PDO $pdo)
    {
    }

    /** @return array<string, mixed>|null */
    public function getForUser(int $userId): ?array
    {
        $stmt = $this->pdo->prepare(
            'SELECT user_id, subscription_tier, cold_memo_allowed, memo_credits, updated_at
             FROM provider_entitlements WHERE user_id = ? LIMIT 1'
        );
        $stmt->execute([$userId]);
        $row = $stmt->fetch();

        return $row !== false ? $row : null;
    }

    public function ensureRow(int $userId): void
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO provider_entitlements (user_id) VALUES (?)
             ON DUPLICATE KEY UPDATE user_id = user_id'
        );
        $stmt->execute([$userId]);
    }
}
