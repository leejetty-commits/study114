<?php

declare(strict_types=1);

namespace Study114\Handoff;

use InvalidArgumentException;
use Study114\Database\Connection;
use Study114\Paid\ProviderRoiService;

/**
 * 25장 부록 B — Handoff basket API surface (서버 영속)
 * 프리뷰 대응: user-actions-state.js · recent-store.js · student-review-store.js
 */
final class HandoffService
{
    public const COMPARE_MAX = 3;
    public const RECENT_MAX = 30;
    public const STUDENT_REVIEW_MAX = 50;

    private const PROVIDER_TARGET_TYPES = ['study_room', 'tutor'];
    private const RECENT_TARGET_TYPES = ['study_room', 'tutor', 'student'];
    private const PROVIDER_ROLES = ['tutor', 'study_room'];

    private HandoffRepository $repo;
    private ProviderRoiService $roi;

    public function __construct(?HandoffRepository $repo = null, ?ProviderRoiService $roi = null)
    {
        $this->repo = $repo ?? new HandoffRepository(Connection::get());
        $this->roi = $roi ?? new ProviderRoiService();
    }

    /** @return list<array<string, mixed>> */
    public function listFavorites(int $userId, ?string $targetType = null): array
    {
        if ($targetType !== null) {
            $this->assertProviderTargetType($targetType);
        }

        return $this->repo->listFavorites($userId, $targetType);
    }

    public function toggleFavorite(int $userId, string $targetType, int $targetId): bool
    {
        $this->assertProviderTargetType($targetType);
        if ($this->repo->isFavorite($userId, $targetType, $targetId)) {
            $this->repo->removeFavorite($userId, $targetType, $targetId);

            return false;
        }
        $this->repo->addFavorite($userId, $targetType, $targetId);

        return true;
    }

    public function removeFavorite(int $userId, string $targetType, int $targetId): void
    {
        $this->assertProviderTargetType($targetType);
        $this->repo->removeFavorite($userId, $targetType, $targetId);
    }

    /**
     * @return array{in_compare: bool, full?: bool}
     */
    public function toggleCompare(int $userId, string $targetType, int $targetId): array
    {
        $this->assertProviderTargetType($targetType);
        if ($this->repo->isInCompare($userId, $targetType, $targetId)) {
            $this->repo->removeCompare($userId, $targetType, $targetId);

            return ['in_compare' => false];
        }
        if ($this->repo->countCompare($userId, $targetType) >= self::COMPARE_MAX) {
            return ['in_compare' => false, 'full' => true];
        }
        $sortOrder = $this->repo->countCompare($userId, $targetType);
        $this->repo->addCompare($userId, $targetType, $targetId, $sortOrder);

        return ['in_compare' => true];
    }

    public function clearCompare(int $userId, string $targetType): void
    {
        $this->assertProviderTargetType($targetType);
        $this->repo->clearCompare($userId, $targetType);
    }

    public function removeCompare(int $userId, string $targetType, int $targetId): void
    {
        $this->assertProviderTargetType($targetType);
        $this->repo->removeCompare($userId, $targetType, $targetId);
    }

    public function countCompare(int $userId, string $targetType): int
    {
        $this->assertProviderTargetType($targetType);

        return $this->repo->countCompare($userId, $targetType);
    }

    /** @return list<array<string, mixed>> */
    public function listCompare(int $userId, string $targetType): array
    {
        $this->assertProviderTargetType($targetType);

        return $this->repo->listCompare($userId, $targetType);
    }

    public function recordRecentView(
        int $userId,
        string $targetType,
        int $targetId,
        string $titleSnapshot,
        ?string $lastRoute = null,
        string $lastAction = 'view_detail',
    ): void {
        $this->assertRecentTargetType($targetType);
        $this->repo->upsertRecent($userId, $targetType, $targetId, $titleSnapshot, $lastRoute, $lastAction);
        $this->repo->pruneRecent($userId, self::RECENT_MAX);
        if (
            in_array($targetType, self::PROVIDER_TARGET_TYPES, true)
            && $lastAction === 'view_detail'
        ) {
            $this->roi->recordProfileView($targetType, $targetId, $userId);
        }
    }

    public function patchRecentHandoff(
        int $userId,
        string $targetType,
        int $targetId,
        ?string $lastRoute,
        string $lastAction,
    ): void {
        $this->assertRecentTargetType($targetType);
        $rows = $this->repo->listRecent($userId, self::RECENT_MAX);
        foreach ($rows as $row) {
            if ($row['target_type'] === $targetType && (int) $row['target_id'] === $targetId) {
                $this->repo->upsertRecent(
                    $userId,
                    $targetType,
                    $targetId,
                    (string) $row['title_snapshot'],
                    $lastRoute ?? $row['last_route'],
                    $lastAction,
                );

                return;
            }
        }
    }

    /** @return list<array<string, mixed>> */
    public function listRecent(int $userId): array
    {
        return $this->repo->listRecent($userId, self::RECENT_MAX);
    }

    /** @return list<array<string, mixed>> */
    public function listStudentReviews(int $providerUserId): array
    {
        return $this->repo->listStudentReviews($providerUserId, self::STUDENT_REVIEW_MAX);
    }

    public function toggleStudentReview(int $providerUserId, int $studentId, string $providerRole): bool
    {
        $this->assertProviderRole($providerRole);
        if ($this->repo->isInStudentReview($providerUserId, $studentId)) {
            $this->repo->removeStudentReview($providerUserId, $studentId);

            return false;
        }
        $this->repo->addStudentReview($providerUserId, $studentId, $providerRole);
        $this->repo->pruneStudentReviews($providerUserId, self::STUDENT_REVIEW_MAX);

        return true;
    }

    public function removeStudentReview(int $providerUserId, int $studentId): void
    {
        $this->repo->removeStudentReview($providerUserId, $studentId);
    }

    private function assertProviderTargetType(string $targetType): void
    {
        if (!in_array($targetType, self::PROVIDER_TARGET_TYPES, true)) {
            throw new InvalidArgumentException('target_type: study_room | tutor');
        }
    }

    private function assertRecentTargetType(string $targetType): void
    {
        if (!in_array($targetType, self::RECENT_TARGET_TYPES, true)) {
            throw new InvalidArgumentException('target_type: study_room | tutor | student');
        }
    }

    private function assertProviderRole(string $role): void
    {
        if (!in_array($role, self::PROVIDER_ROLES, true)) {
            throw new InvalidArgumentException('provider_role: tutor | study_room');
        }
    }
}
