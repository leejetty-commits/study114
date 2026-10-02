<?php

declare(strict_types=1);

namespace Study114\Paid;

use PDO;

/**
 * 학생 요청문·특이요청 원문 수신 판단 (단일 기준)
 * 유료 공급자 판정은 PaidProviderGate 한 곳.
 */
final class StudentRequestTextAccess
{
    private PaidProviderGate $gate;

    public function __construct(?PDO $pdo = null)
    {
        $this->gate = new PaidProviderGate($pdo);
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
        return $this->gate->isPaidProvider($userId);
    }
}
