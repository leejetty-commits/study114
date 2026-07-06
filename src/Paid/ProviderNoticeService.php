<?php

declare(strict_types=1);

namespace Study114\Paid;

use Study114\Database\Connection;

final class ProviderNoticeService
{
    private ProviderReminderRepository $repo;

    public function __construct(?ProviderReminderRepository $repo = null)
    {
        $this->repo = $repo ?? new ProviderReminderRepository(Connection::get());
    }

    /** @return list<array<string, mixed>> */
    public function listUnread(int $userId, int $limit = 20): array
    {
        return $this->repo->listUnreadNotices($userId, $limit);
    }

    public function markRead(int $userId, int $noticeId): bool
    {
        return $this->repo->markNoticeRead($userId, $noticeId);
    }

    public function markAllRead(int $userId): int
    {
        return $this->repo->markAllNoticesRead($userId);
    }
}
