<?php

declare(strict_types=1);

namespace Study114\Auth;

use PDO;

final class AuthTokenRepository
{
    public function __construct(private readonly PDO $pdo)
    {
    }

    public function create(int $userId, string $purpose, int $ttlMinutes): string
    {
        $raw = bin2hex(random_bytes(32));
        $hash = hash('sha256', $raw);
        $stmt = $this->pdo->prepare(
            'INSERT INTO auth_tokens (user_id, token_hash, purpose, expires_at)
             VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE))'
        );
        $stmt->execute([$userId, $hash, $purpose, $ttlMinutes]);

        return $raw;
    }

    /** @return 'valid'|'expired'|'used'|'invalid' */
    public function inspect(string $rawToken, string $purpose): string
    {
        if ($rawToken === '') {
            return 'invalid';
        }

        $hash = hash('sha256', $rawToken);
        $stmt = $this->pdo->prepare(
            'SELECT used_at, expires_at FROM auth_tokens
             WHERE token_hash = ? AND purpose = ?
             LIMIT 1'
        );
        $stmt->execute([$hash, $purpose]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!is_array($row)) {
            return 'invalid';
        }
        if ($row['used_at'] !== null) {
            return 'used';
        }
        if (strtotime((string) $row['expires_at']) <= time()) {
            return 'expired';
        }

        return 'valid';
    }

    /** Most recent request for purpose; 0 = resend allowed now. */
    public function resendSecondsRemaining(int $userId, string $purpose, int $cooldownSeconds): int
    {
        if ($cooldownSeconds <= 0) {
            return 0;
        }

        $stmt = $this->pdo->prepare(
            'SELECT created_at FROM auth_tokens
             WHERE user_id = ? AND purpose = ?
             ORDER BY id DESC
             LIMIT 1'
        );
        $stmt->execute([$userId, $purpose]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!is_array($row) || !isset($row['created_at'])) {
            return 0;
        }

        $createdAt = strtotime((string) $row['created_at']);
        if ($createdAt === false) {
            return 0;
        }

        $elapsed = time() - $createdAt;

        return max(0, $cooldownSeconds - $elapsed);
    }

    /** @return array{user_id: int, purpose: string}|null */
    public function consumeValid(string $rawToken, string $purpose): ?array
    {
        $hash = hash('sha256', $rawToken);
        $stmt = $this->pdo->prepare(
            'SELECT id, user_id, purpose FROM auth_tokens
             WHERE token_hash = ? AND purpose = ? AND used_at IS NULL AND expires_at > NOW()
             LIMIT 1'
        );
        $stmt->execute([$hash, $purpose]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!is_array($row)) {
            return null;
        }

        $mark = $this->pdo->prepare('UPDATE auth_tokens SET used_at = NOW() WHERE id = ?');
        $mark->execute([(int) $row['id']]);

        return [
            'user_id' => (int) $row['user_id'],
            'purpose' => (string) $row['purpose'],
        ];
    }

    public function invalidatePurpose(int $userId, string $purpose): void
    {
        $stmt = $this->pdo->prepare(
            'UPDATE auth_tokens SET used_at = NOW()
             WHERE user_id = ? AND purpose = ? AND used_at IS NULL'
        );
        $stmt->execute([$userId, $purpose]);
    }
}
