<?php

declare(strict_types=1);

namespace Study114\Paid;

use PDO;
use Study114\Database\Connection;

/**
 * 카드 paid_badges[] 서버 정본.
 * 클라이언트는 entitlement를 추론하지 않고 API 배열만 신뢰한다.
 *
 * @see docs/internal/57-paid-badges-api-contract.md
 */
final class PaidBadgeResolver
{
    /** @var list<string> */
    public const STUDY_ROOM_CODES = ['hot', 'subject_track'];

    /** @var list<string> */
    public const TUTOR_CODES = ['hot', 'jjokjipge', 'sky'];

    /** @var list<string> */
    public const FORBIDDEN_CODES = ['recommend', 'new', '전문', 'specialty'];

    private PDO $pdo;

    /** @var array<string, bool> */
    private array $tableCache = [];

    public function __construct(?PDO $pdo = null)
    {
        $this->pdo = $pdo ?? Connection::get();
    }

    /**
     * @param 'study_room'|'tutor' $providerType
     * @return list<string>
     */
    public function forProvider(string $providerType, int $providerId): array
    {
        if ($providerId <= 0) {
            return [];
        }
        if ($providerType !== 'study_room' && $providerType !== 'tutor') {
            return [];
        }
        if (!$this->tableExists('provider_paid_badges')) {
            return [];
        }

        $allowed = $providerType === 'study_room' ? self::STUDY_ROOM_CODES : self::TUTOR_CODES;
        $stmt = $this->pdo->prepare(
            'SELECT badge_code FROM provider_paid_badges
             WHERE provider_type = ?
               AND provider_id = ?
               AND starts_on <= CURDATE()
               AND end_exclusive_on > CURDATE()
             ORDER BY id ASC'
        );
        $stmt->execute([$providerType, $providerId]);

        $out = [];
        $seen = [];
        while ($code = $stmt->fetchColumn()) {
            $normalized = $this->normalizeCode((string) $code, $providerType);
            if ($normalized === null || isset($seen[$normalized])) {
                continue;
            }
            if (!in_array($normalized, $allowed, true)) {
                continue;
            }
            $seen[$normalized] = true;
            $out[] = $normalized;
        }

        return $out;
    }

    /**
     * @param 'study_room'|'tutor' $providerType
     */
    public function normalizeCode(string $raw, string $providerType): ?string
    {
        $id = strtolower(trim($raw));
        if ($id === '' || in_array($id, self::FORBIDDEN_CODES, true)) {
            return null;
        }
        if ($id === '전문' || $id === 'specialty') {
            return null;
        }
        if ($id === '단과' || $id === 'subject' || $id === 'specialty_track') {
            $id = 'subject_track';
        }
        if ($id === 'picked' || $id === '쪽집게' || $id === 'jjokjipgae') {
            $id = 'jjokjipge';
        }
        $allowed = $providerType === 'study_room' ? self::STUDY_ROOM_CODES : self::TUTOR_CODES;

        return in_array($id, $allowed, true) ? $id : null;
    }

    private function tableExists(string $table): bool
    {
        if (isset($this->tableCache[$table])) {
            return $this->tableCache[$table];
        }
        $stmt = $this->pdo->prepare(
            'SELECT 1 FROM information_schema.TABLES
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? LIMIT 1'
        );
        $stmt->execute([$table]);
        $this->tableCache[$table] = (bool) $stmt->fetchColumn();

        return $this->tableCache[$table];
    }
}
