<?php

declare(strict_types=1);

namespace Study114\Paid;

use PDO;
use PDOException;
use Study114\Database\Connection;

/**
 * 학생 요청문·특이요청 원문 수신 판단 (단일 기준)
 * 유료 공급자 = 18§ exposure.state 'active' (기간 내 Prime/Pick 포지션 ≥ 1, ProviderTicketService::getOperationalStatus 와 동일)
 */
final class StudentRequestTextAccess
{
    /** @var array<int, bool> */
    private array $cache = [];

    private ProviderTicketRepository $repo;

    public function __construct(?PDO $pdo = null)
    {
        $this->repo = new ProviderTicketRepository($pdo ?? Connection::get());
    }

    public function canReceive(int $userId, string $roleType): bool
    {
        if ($userId <= 0) {
            return false;
        }
        if ($roleType === 'admin') {
            return true;
        }
        if ($roleType !== 'tutor' && $roleType !== 'study_room_owner') {
            return false;
        }

        return $this->isPaidProvider($userId);
    }

    public function isPaidProvider(int $userId): bool
    {
        if (!array_key_exists($userId, $this->cache)) {
            try {
                $this->cache[$userId] = $this->repo->listActivePositions($userId) !== [];
            } catch (PDOException) {
                $this->cache[$userId] = false;
            }
        }

        return $this->cache[$userId];
    }
}
