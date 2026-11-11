<?php

declare(strict_types=1);

namespace Study114\Auth;

use PDO;

/**
 * 테스트 계정 허용목록 — env STUDY114_TEST_ACCOUNT_EMAILS (쉼표 구분, 정확한 이메일, 소문자 비교).
 * 357 카드 숨김 · 358·351 등과 이름·함수를 공유한다.
 */
final class TestAccountAllowlist
{
    /**
     * @return list<string> 소문자·trim된 이메일. 빈 env → []
     */
    public static function emails(): array
    {
        $raw = '';
        try {
            $cfg = study114_config('auth');
            if (isset($cfg['test_account_emails']) && is_string($cfg['test_account_emails'])) {
                $raw = $cfg['test_account_emails'];
            }
        } catch (\Throwable) {
            $raw = '';
        }
        if ($raw === '') {
            $raw = study114_env('STUDY114_TEST_ACCOUNT_EMAILS', '');
        }

        $out = [];
        foreach (explode(',', $raw) as $part) {
            $email = strtolower(trim($part));
            if ($email !== '' && filter_var($email, FILTER_VALIDATE_EMAIL)) {
                $out[$email] = $email;
            }
        }

        return array_values($out);
    }

    public static function contains(?string $email): bool
    {
        $normalized = strtolower(trim((string) $email));
        if ($normalized === '') {
            return false;
        }

        return in_array($normalized, self::emails(), true);
    }

    /**
     * 허용목록 이메일에 해당하는 user id. 요청당 호출측에서 캐시한다.
     *
     * @return list<int>
     */
    public static function userIds(PDO $pdo): array
    {
        $emails = self::emails();
        if ($emails === []) {
            return [];
        }
        $placeholders = implode(',', array_fill(0, count($emails), '?'));
        $stmt = $pdo->prepare(
            "SELECT id FROM users WHERE LOWER(TRIM(email)) IN ({$placeholders})"
        );
        $stmt->execute($emails);
        $ids = [];
        foreach ($stmt->fetchAll(PDO::FETCH_COLUMN) as $id) {
            $id = (int) $id;
            if ($id > 0) {
                $ids[] = $id;
            }
        }

        return array_values(array_unique($ids));
    }
}
