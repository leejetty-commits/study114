<?php

declare(strict_types=1);

namespace Study114\Paid;

use Closure;
use PDO;
use PDOException;
use Study114\Database\Connection;

/**
 * 유료 공급자 판정 (단일 기준)
 * 유료 공급자 = 픽·프라임을 구매해 현재 노출 자리를 가진 공부방·과외쌤
 * = 18§ exposure.state 'active' (기간 내 Prime/Pick 포지션 ≥ 1, ProviderTicketService::getOperationalStatus 와 동일)
 * 학생 요청문 원문 수신(StudentRequestTextAccess)·정보 게시판 쓰기(InfoBoardService)가 이 판정만 쓴다.
 */
final class PaidProviderGate
{
    /** @var array<int, bool> */
    private array $cache = [];

    /** @var Closure(int): array<int, mixed> */
    private Closure $activePositions;

    /**
     * @param Closure(int): array<int, mixed>|null $activePositions 기간 내 포지션 목록 조회. 기본은 ProviderTicketRepository::listActivePositions
     */
    public function __construct(?PDO $pdo = null, ?Closure $activePositions = null)
    {
        if ($activePositions === null) {
            $repo = new ProviderTicketRepository($pdo ?? Connection::get());
            $activePositions = static fn (int $userId): array => $repo->listActivePositions($userId);
        }
        $this->activePositions = $activePositions;
    }

    public function isPaidProvider(int $userId): bool
    {
        if (!array_key_exists($userId, $this->cache)) {
            try {
                $this->cache[$userId] = ($this->activePositions)($userId) !== [];
            } catch (PDOException) {
                $this->cache[$userId] = false;
            }
        }

        return $this->cache[$userId];
    }
}
