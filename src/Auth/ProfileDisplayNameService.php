<?php

declare(strict_types=1);

namespace Study114\Auth;

use InvalidArgumentException;
use PDO;
use Study114\Database\Connection;

/**
 * 사이트 표시명(display identity) — user_profiles.real_name 재사용
 * auth email · OAuth provider binding 은 변경하지 않는다.
 */
final class ProfileDisplayNameService
{
    public const MIN_LEN = 2;
    public const MAX_LEN = 50;

    /**
     * @return array{name: string}
     */
    public function updateDisplayName(int $userId, string $displayName): array
    {
        if ($userId < 1) {
            throw new InvalidArgumentException('로그인이 필요합니다.');
        }

        $name = $this->normalize($displayName);
        $pdo = Connection::get();

        $stmt = $pdo->prepare('SELECT id FROM users WHERE id = ? AND status = ? LIMIT 1');
        $stmt->execute([$userId, 'active']);
        if (!$stmt->fetchColumn()) {
            throw new InvalidArgumentException('계정을 찾을 수 없습니다.');
        }

        $upd = $pdo->prepare('UPDATE user_profiles SET real_name = ? WHERE user_id = ?');
        $upd->execute([$name, $userId]);
        if ($upd->rowCount() < 1) {
            $exists = $pdo->prepare('SELECT 1 FROM user_profiles WHERE user_id = ? LIMIT 1');
            $exists->execute([$userId]);
            if (!$exists->fetchColumn()) {
                throw new InvalidArgumentException('프로필이 없습니다.');
            }
            // 동일 값이면 rowCount 0 — 허용
        }

        return ['name' => $name];
    }

    public function normalize(string $raw): string
    {
        $name = trim(preg_replace('/\s+/u', ' ', $raw) ?? '');
        if ($name === '') {
            throw new InvalidArgumentException('사이트 표시명을 입력해 주세요.');
        }
        $len = mb_strlen($name);
        if ($len < self::MIN_LEN) {
            throw new InvalidArgumentException('사이트 표시명은 ' . self::MIN_LEN . '자 이상이어야 합니다.');
        }
        if ($len > self::MAX_LEN) {
            throw new InvalidArgumentException('사이트 표시명은 ' . self::MAX_LEN . '자 이하여야 합니다.');
        }
        if (str_contains($name, '@')) {
            throw new InvalidArgumentException('사이트 표시명에 이메일을 넣을 수 없습니다. 읽기 쉬운 이름을 입력해 주세요.');
        }
        if (preg_match('/oauth_/i', $name)) {
            throw new InvalidArgumentException('내부 계정 식별자 형태의 이름은 사용할 수 없습니다.');
        }

        return $name;
    }

    /** @return list<string> */
    public function oauthProviders(int $userId): array
    {
        if ($userId < 1) {
            return [];
        }
        try {
            $pdo = Connection::get();
            $stmt = $pdo->prepare(
                'SELECT provider FROM user_oauth_accounts WHERE user_id = ? ORDER BY linked_at ASC'
            );
            $stmt->execute([$userId]);
            $out = [];
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $p = (string) ($row['provider'] ?? '');
                if ($p !== '') {
                    $out[] = $p;
                }
            }

            return $out;
        } catch (\Throwable) {
            return [];
        }
    }
}
