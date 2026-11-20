<?php

declare(strict_types=1);

namespace Study114\Auth;

use InvalidArgumentException;
use Study114\Database\Connection;

/**
 * 계정설정 마케팅 수신. 바꿀 때마다 marketing_consent_at을 다시 기록한다.
 */
final class MarketingConsentService
{
    /**
     * @return array{marketing_consent: int, marketing_consent_at: string|null}
     */
    public function get(int $userId): array
    {
        if ($userId < 1) {
            throw new InvalidArgumentException('로그인이 필요합니다.');
        }
        $pdo = Connection::get();
        $stmt = $pdo->prepare(
            'SELECT marketing_consent, marketing_consent_at
             FROM user_profiles WHERE user_id = ? LIMIT 1'
        );
        $stmt->execute([$userId]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);
        if (!is_array($row)) {
            return ['marketing_consent' => 0, 'marketing_consent_at' => null];
        }

        return $this->shape($row);
    }

    /**
     * @param mixed $raw
     * @return array{marketing_consent: int, marketing_consent_at: string|null}
     */
    public function update(int $userId, mixed $raw): array
    {
        if ($userId < 1) {
            throw new InvalidArgumentException('로그인이 필요합니다.');
        }
        $consent = $this->requireConsent($raw);
        $pdo = Connection::get();
        $exists = $pdo->prepare('SELECT 1 FROM user_profiles WHERE user_id = ? LIMIT 1');
        $exists->execute([$userId]);
        if (!$exists->fetchColumn()) {
            throw new InvalidArgumentException('계정 프로필이 없습니다.');
        }
        $stmt = $pdo->prepare(
            'UPDATE user_profiles
             SET marketing_consent = ?, marketing_consent_at = NOW()
             WHERE user_id = ?'
        );
        $stmt->execute([$consent, $userId]);

        return $this->get($userId);
    }

    /**
     * @param mixed $raw
     */
    private function requireConsent(mixed $raw): int
    {
        if ($raw === true || $raw === 1 || $raw === '1') {
            return 1;
        }
        if ($raw === false || $raw === 0 || $raw === '0') {
            return 0;
        }
        throw new InvalidArgumentException('수신 여부를 선택해 주세요.');
    }

    /**
     * @param array<string, mixed> $row
     * @return array{marketing_consent: int, marketing_consent_at: string|null}
     */
    private function shape(array $row): array
    {
        $at = $row['marketing_consent_at'] ?? null;
        $atText = is_string($at) && trim($at) !== '' ? trim($at) : null;

        return [
            'marketing_consent' => (int) ($row['marketing_consent'] ?? 0) === 1 ? 1 : 0,
            'marketing_consent_at' => $atText,
        ];
    }
}
