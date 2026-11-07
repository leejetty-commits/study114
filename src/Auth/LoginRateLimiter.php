<?php

declare(strict_types=1);

namespace Study114\Auth;

/**
 * 파일 기반 로그인·소셜 시작 시도 제한 (닷홈 · Redis 없음).
 *
 * 비밀번호 로그인:
 * - 이메일: 15분에 실패 5회 → 15분 잠금
 * - IP: 15분에 실패 15회 → 15분 잠금
 *
 * 소셜 시작:
 * - IP: 2분에 10회 (슬라이딩 · 잠금은 창이 빌 때까지)
 */
final class LoginRateLimiter
{
    private const PASSWORD_WINDOW = 900;
    private const PASSWORD_LOCK = 900;
    private const EMAIL_MAX = 5;
    private const IP_MAX = 15;

    private const OAUTH_WINDOW = 120;
    private const OAUTH_MAX = 10;

    private string $dir;

    public function __construct(?string $dir = null)
    {
        $this->dir = $dir ?? (dirname(__DIR__, 2) . '/storage/rate-limits');
    }

    public function assertPasswordAllowed(string $ip, string $email): void
    {
        $now = time();
        $this->assertBucket(
            $this->emailKey($email),
            self::PASSWORD_WINDOW,
            self::EMAIL_MAX,
            self::PASSWORD_LOCK,
            $now,
            'password',
        );
        $this->assertBucket(
            $this->ipKey('login', $ip),
            self::PASSWORD_WINDOW,
            self::IP_MAX,
            self::PASSWORD_LOCK,
            $now,
            'password',
        );
    }

    public function recordPasswordFailure(string $ip, string $email): void
    {
        $now = time();
        $this->recordHit(
            $this->emailKey($email),
            self::PASSWORD_WINDOW,
            self::EMAIL_MAX,
            self::PASSWORD_LOCK,
            $now,
        );
        $this->recordHit(
            $this->ipKey('login', $ip),
            self::PASSWORD_WINDOW,
            self::IP_MAX,
            self::PASSWORD_LOCK,
            $now,
        );
    }

    public function clearPasswordEmail(string $email): void
    {
        $path = $this->pathFor($this->emailKey($email));
        if (is_file($path)) {
            @unlink($path);
        }
    }

    public function assertOAuthStartAllowed(string $ip): void
    {
        $this->assertBucket(
            $this->ipKey('oauth', $ip),
            self::OAUTH_WINDOW,
            self::OAUTH_MAX,
            0,
            time(),
            'oauth',
        );
    }

    public function recordOAuthStart(string $ip): void
    {
        $this->recordHit(
            $this->ipKey('oauth', $ip),
            self::OAUTH_WINDOW,
            self::OAUTH_MAX,
            0,
            time(),
        );
    }

    private function emailKey(string $email): string
    {
        $normalized = EmailNormalizer::normalize($email);
        if ($normalized === '') {
            $normalized = 'empty';
        }

        return 'login_email:' . hash('sha256', $normalized);
    }

    private function ipKey(string $scope, string $ip): string
    {
        $safe = $ip !== '' ? $ip : 'unknown';

        return $scope . '_ip:' . hash('sha256', $safe);
    }

    private function assertBucket(
        string $key,
        int $windowSeconds,
        int $maxHits,
        int $lockSeconds,
        int $now,
        string $kind = 'password',
    ): void {
        $state = $this->read($key);
        $hits = $this->pruneHits($state['hits'], $windowSeconds, $now);
        $lockedUntil = (int) ($state['locked_until'] ?? 0);

        if ($lockedUntil > $now) {
            $this->throwLimited($lockedUntil - $now, $kind);
        }

        if (count($hits) < $maxHits) {
            return;
        }

        if ($lockSeconds > 0) {
            $lockedUntil = $now + $lockSeconds;
            $this->write($key, ['hits' => $hits, 'locked_until' => $lockedUntil]);
            $this->throwLimited($lockSeconds, $kind);
        }

        $oldest = $hits[0] ?? $now;
        $this->write($key, ['hits' => $hits, 'locked_until' => 0]);
        $this->throwLimited(max(1, ($oldest + $windowSeconds) - $now), $kind);
    }

    private function throwLimited(int $retryAfter, string $kind): void
    {
        throw $kind === 'oauth'
            ? LoginRateLimitException::forOAuth($retryAfter)
            : LoginRateLimitException::forPassword($retryAfter);
    }

    private function recordHit(
        string $key,
        int $windowSeconds,
        int $maxHits,
        int $lockSeconds,
        int $now,
    ): void {
        $state = $this->read($key);
        $hits = $this->pruneHits($state['hits'], $windowSeconds, $now);
        $hits[] = $now;
        $lockedUntil = (int) ($state['locked_until'] ?? 0);
        if ($lockedUntil < $now && count($hits) >= $maxHits) {
            $lockedUntil = $lockSeconds > 0 ? $now + $lockSeconds : 0;
        }
        $this->write($key, [
            'hits' => $hits,
            'locked_until' => $lockedUntil,
        ]);
    }

    /**
     * @param list<int> $hits
     * @return list<int>
     */
    private function pruneHits(array $hits, int $windowSeconds, int $now): array
    {
        $cut = $now - $windowSeconds;
        $out = [];
        foreach ($hits as $ts) {
            $t = (int) $ts;
            if ($t >= $cut) {
                $out[] = $t;
            }
        }

        return $out;
    }

    /** @return array{hits: list<int>, locked_until: int} */
    private function read(string $key): array
    {
        $path = $this->pathFor($key);
        if (!is_file($path)) {
            return ['hits' => [], 'locked_until' => 0];
        }
        $raw = @file_get_contents($path);
        if (!is_string($raw) || $raw === '') {
            return ['hits' => [], 'locked_until' => 0];
        }
        $data = json_decode($raw, true);
        if (!is_array($data)) {
            return ['hits' => [], 'locked_until' => 0];
        }
        $hits = [];
        if (isset($data['hits']) && is_array($data['hits'])) {
            foreach ($data['hits'] as $ts) {
                $hits[] = (int) $ts;
            }
        }

        return [
            'hits' => $hits,
            'locked_until' => (int) ($data['locked_until'] ?? 0),
        ];
    }

    /** @param array{hits: list<int>, locked_until: int} $state */
    private function write(string $key, array $state): void
    {
        if (!$this->ensureDir()) {
            return;
        }
        $path = $this->pathFor($key);
        $json = json_encode([
            'hits' => array_values($state['hits']),
            'locked_until' => (int) $state['locked_until'],
        ], JSON_UNESCAPED_UNICODE);
        if (!is_string($json)) {
            return;
        }
        @file_put_contents($path, $json, LOCK_EX);
    }

    private function pathFor(string $key): string
    {
        return $this->dir . '/' . hash('sha256', $key) . '.json';
    }

    private function ensureDir(): bool
    {
        if (is_dir($this->dir)) {
            return is_writable($this->dir);
        }
        if (!@mkdir($this->dir, 0700, true) && !is_dir($this->dir)) {
            error_log('[login-rate] mkdir failed path=' . $this->dir);

            return false;
        }

        return is_writable($this->dir);
    }
}
