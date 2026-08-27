<?php

declare(strict_types=1);

namespace Study114\Reviews;

use InvalidArgumentException;
use Study114\Database\Connection;
use Throwable;

final class ProviderReviewService
{
    public const BODY_MIN = ReviewPolicy::BODY_MIN;
    public const BODY_MAX = ReviewPolicy::BODY_MAX;
    public const REPLY_MAX = 200;
    public const TAGS_MIN = ReviewPolicy::TAGS_MIN;
    public const TAGS_MAX = ReviewPolicy::TAGS_MAX;
    public const LIST_LIMIT = ReviewPolicy::SHEET_LIMIT;

    /** @var list<string> */
    public const COMMON_TAGS = [];

    /** @var list<string> */
    public const STUDY_ROOM_TAGS = ReviewPolicy::STUDY_ROOM_TAGS;

    /** @var list<string> */
    public const TUTOR_TAGS = ReviewPolicy::TUTOR_TAGS;

    private ProviderReviewRepository $repo;

    public function __construct(?ProviderReviewRepository $repo = null)
    {
        $this->repo = $repo ?? new ProviderReviewRepository(Connection::get());
    }

    /** @return list<string> */
    public function allowedTags(string $providerType): array
    {
        return ReviewPolicy::allowedTags($providerType);
    }

    /**
     * @param array{user_id?: int, role_type?: string}|null $auth
     * @return array<string, mixed>
     */
    public function getSummary(string $providerType, int $providerId, ?array $auth): array
    {
        $this->assertProviderType($providerType);
        if ($providerId <= 0) {
            throw new InvalidArgumentException('provider_id가 필요합니다.');
        }

        $count = $this->repo->countVisible($providerType, $providerId);
        $viewer = $this->resolveViewer($auth, $providerType, $providerId);
        $reviews = [];
        foreach ($this->repo->listVisible($providerType, $providerId, ReviewPolicy::SHEET_LIMIT) as $row) {
            $reviews[] = $this->mapReview($row, $viewer);
        }

        $mine = [];
        if (!empty($viewer['user_id'])) {
            foreach ($this->repo->listByAuthorOnTarget($providerType, $providerId, (int) $viewer['user_id']) as $row) {
                $mine[] = $this->mapReview($row, $viewer + ['include_status' => true]);
            }
        }

        return [
            'provider_type' => $providerType,
            'provider_id' => $providerId,
            'provider_label' => $this->repo->getProviderLabel($providerType, $providerId),
            'review_count' => $count,
            'review_write_status' => $viewer['review_write_status'],
            'summary_tags' => $this->repo->aggregateTags($providerType, $providerId),
            'can_read_body' => true,
            'can_write' => $viewer['can_write'],
            'can_manage' => $viewer['has_written'],
            'has_written' => $viewer['has_written'],
            'created_count' => $viewer['created_count'],
            'remaining_creates' => $viewer['remaining_creates'],
            'is_review_blocked' => $viewer['is_review_blocked'],
            'write_blocked_reason' => $viewer['write_blocked_reason'],
            'cta_kind' => $viewer['cta_kind'],
            'is_owner' => $viewer['is_owner'],
            'allowed_tags' => $this->allowedTags($providerType),
            'reviews' => $reviews,
            'my_reviews' => $mine,
            'guest_teaser' => null,
        ];
    }

    /**
     * @param array{user_id?: int, role_type?: string}|null $auth
     * @return array<string, mixed>
     */
    public function listPublic(
        string $providerType,
        int $providerId,
        int $page,
        int $limit,
        ?array $auth,
    ): array {
        $this->assertProviderType($providerType);
        if ($providerId <= 0) {
            throw new InvalidArgumentException('provider_id가 필요합니다.');
        }
        $limit = max(1, min(ReviewPolicy::PAGE_SIZE_MAX, $limit > 0 ? $limit : ReviewPolicy::PAGE_SIZE));
        $page = max(1, $page);
        $offset = ($page - 1) * $limit;
        $total = $this->repo->countVisible($providerType, $providerId);
        $viewer = $this->resolveViewer($auth, $providerType, $providerId);
        $items = array_map(
            fn (array $row) => $this->mapReview($row, $viewer),
            $this->repo->listVisible($providerType, $providerId, $limit, $offset),
        );

        return [
            'mode' => 'target',
            'provider_type' => $providerType,
            'provider_id' => $providerId,
            'provider_label' => $this->repo->getProviderLabel($providerType, $providerId),
            'review_count' => $total,
            'page' => $page,
            'page_size' => $limit,
            'total' => $total,
            'cta_kind' => $viewer['cta_kind'],
            'can_write' => $viewer['can_write'],
            'has_written' => $viewer['has_written'],
            'is_owner' => $viewer['is_owner'],
            'items' => $items,
        ];
    }

    /**
     * @param array{user_id: int, role_type: string} $auth
     * @param list<string> $tags
     * @return array<string, mixed>
     */
    public function createReview(
        array $auth,
        string $providerType,
        int $providerId,
        string $originType,
        string $body,
        array $tags,
        bool $publicConsent = true,
    ): array {
        $this->assertProviderType($providerType);
        if ($providerId <= 0) {
            throw new InvalidArgumentException('provider_id가 필요합니다.');
        }
        if (!in_array($originType, ['consultation', 'experience'], true)) {
            throw new InvalidArgumentException('접점 유형: consultation | experience');
        }
        if (!$publicConsent) {
            throw new ReviewPolicyException(ReviewPolicy::ERR_CONSENT, '공개 동의 후 후기를 남길 수 있습니다.');
        }

        $gate = $this->assertCanCreate($auth, $providerType, $providerId);
        $body = $this->normalizeBody($body);
        $cleanTags = $this->normalizeTags($providerType, $tags);

        $this->repo->begin();
        try {
            $this->repo->consumeQuotaOrFail($providerType, $providerId, $gate['user_id']);
            $id = $this->repo->insertReview(
                $providerType,
                $providerId,
                $gate['user_id'],
                $originType,
                $body,
                $cleanTags,
                ReviewPolicy::STATUS_VISIBLE,
            );
            $this->repo->commit();
        } catch (Throwable $e) {
            $this->repo->rollBack();
            throw $e;
        }

        return $this->getSummary($providerType, $providerId, $auth) + ['created_id' => $id];
    }

    /**
     * @param array{user_id: int, role_type: string} $auth
     * @param list<string> $tags
     * @return array<string, mixed>
     */
    public function updateReview(array $auth, int $reviewId, string $body, array $tags): array
    {
        $this->assertConsumerAuthor($auth);
        $review = $this->requireOwnLiveReview($auth, $reviewId);
        $this->assertNotReviewBlocked(
            (string) $review['provider_type'],
            (int) $review['provider_id'],
            (int) $auth['user_id'],
            'edit',
        );
        $body = $this->normalizeBody($body);
        $cleanTags = $this->normalizeTags((string) $review['provider_type'], $tags);
        $this->repo->updateReview($reviewId, $body, $cleanTags);

        return $this->getSummary((string) $review['provider_type'], (int) $review['provider_id'], $auth);
    }

    /**
     * @param array{user_id: int, role_type: string} $auth
     * @return array<string, mixed>
     */
    public function hideReview(array $auth, int $reviewId): array
    {
        $review = $this->requireOwnLiveReview($auth, $reviewId);
        $this->repo->setVisibility($reviewId, ReviewPolicy::STATUS_HIDDEN);

        return $this->getSummary((string) $review['provider_type'], (int) $review['provider_id'], $auth);
    }

    /**
     * @param array{user_id: int, role_type: string} $auth
     * @return array<string, mixed>
     */
    public function unhideReview(array $auth, int $reviewId): array
    {
        $this->assertConsumerAuthor($auth);
        $review = $this->requireOwnLiveReview($auth, $reviewId);
        if ((string) $review['review_status'] !== ReviewPolicy::STATUS_HIDDEN) {
            throw new ReviewPolicyException(ReviewPolicy::ERR_VALIDATION, '비공개 후기만 다시 공개할 수 있습니다.');
        }
        $this->assertNotReviewBlocked(
            (string) $review['provider_type'],
            (int) $review['provider_id'],
            (int) $auth['user_id'],
            'edit',
        );
        $this->repo->setVisibility($reviewId, ReviewPolicy::STATUS_VISIBLE);

        return $this->getSummary((string) $review['provider_type'], (int) $review['provider_id'], $auth);
    }

    /**
     * @param array{user_id: int, role_type: string} $auth
     * @return array<string, mixed>
     */
    public function deleteReview(array $auth, int $reviewId): array
    {
        $review = $this->requireOwnLiveReview($auth, $reviewId);
        $this->repo->softDelete($reviewId);

        return $this->getSummary((string) $review['provider_type'], (int) $review['provider_id'], $auth);
    }

    /**
     * @param array{user_id: int, role_type: string} $auth
     * @return array<string, mixed>
     */
    public function blockAuthor(array $auth, string $providerType, int $providerId, int $authorUserId): array
    {
        $this->assertProviderType($providerType);
        $this->assertOwner($auth, $providerType, $providerId);
        if ($authorUserId <= 0) {
            throw new InvalidArgumentException('blocked_author_user_id가 필요합니다.');
        }
        if ($authorUserId === (int) $auth['user_id']) {
            throw new InvalidArgumentException('본인을 후기차단할 수 없습니다.');
        }
        $this->repo->insertReviewBlock($providerType, $providerId, $authorUserId, (int) $auth['user_id']);

        return $this->getSummary($providerType, $providerId, $auth);
    }

    /**
     * @param array{user_id: int, role_type: string} $auth
     * @return array<string, mixed>
     */
    public function unblockAuthor(array $auth, string $providerType, int $providerId, int $authorUserId): array
    {
        $this->assertProviderType($providerType);
        $this->assertOwner($auth, $providerType, $providerId);
        $this->repo->deleteReviewBlock($providerType, $providerId, $authorUserId);

        return $this->getSummary($providerType, $providerId, $auth);
    }

    /**
     * @param array{user_id: int, role_type: string} $auth
     * @return array<string, mixed>
     */
    public function setWriteStatus(array $auth, string $providerType, int $providerId, string $status): array
    {
        $this->assertProviderType($providerType);
        $this->assertOwner($auth, $providerType, $providerId);
        if (!in_array($status, [ReviewPolicy::WRITE_OPEN, ReviewPolicy::WRITE_CLOSED], true)) {
            throw new InvalidArgumentException('review_write_status: open | closed');
        }
        $this->repo->setReviewWriteStatus($providerType, $providerId, $status);

        return $this->getSummary($providerType, $providerId, $auth);
    }

    /**
     * @param array{user_id: int, role_type: string} $auth
     * @return array<string, mixed>
     */
    public function inbox(array $auth, string $lane, int $page, int $limit): array
    {
        $role = (string) ($auth['role_type'] ?? '');
        $userId = (int) $auth['user_id'];
        $limit = max(1, min(ReviewPolicy::PAGE_SIZE_MAX, $limit > 0 ? $limit : ReviewPolicy::PAGE_SIZE));
        $page = max(1, $page);
        $offset = ($page - 1) * $limit;
        $isProvider = $role === 'study_room_owner' || $role === 'tutor';

        if ($lane === 'targets') {
            return $this->inboxTargets($auth);
        }

        if ($lane === 'all' || $lane === '') {
            return $this->inboxAll($auth, $page, $limit);
        }

        if ($lane === 'received') {
            if (!$isProvider) {
                return [
                    'mode' => 'account',
                    'lane' => 'received',
                    'label' => '내가 관리하는 후기',
                    'page' => $page,
                    'page_size' => $limit,
                    'total' => 0,
                    'count' => 0,
                    'items' => [],
                ];
            }
            $type = $role === 'tutor' ? 'tutor' : 'study_room';
            $total = $this->repo->countReceivedByOwner($userId, $type);
            $items = array_map(
                fn (array $row) => $this->mapReview($row, [
                    'is_owner' => true,
                    'include_author' => true,
                    'is_review_blocked' => $this->repo->hasReviewBlock(
                        (string) $row['provider_type'],
                        (int) $row['provider_id'],
                        (int) $row['author_user_id'],
                    ),
                ]),
                $this->repo->listReceivedByOwner($userId, $type, $limit, $offset),
            );

            return [
                'mode' => 'account',
                'lane' => 'received',
                'label' => '내가 관리하는 후기',
                'page' => $page,
                'page_size' => $limit,
                'total' => $total,
                'count' => $total,
                'items' => $items,
            ];
        }

        $total = $this->repo->countWrittenByAuthor($userId, true);
        $items = array_map(
            fn (array $row) => $this->mapReview($row, [
                'is_owner' => false,
                'include_status' => true,
                'is_review_blocked' => $this->repo->hasReviewBlock(
                    (string) $row['provider_type'],
                    (int) $row['provider_id'],
                    $userId,
                ),
            ]),
            $this->repo->listWrittenByAuthor($userId, $limit, $offset, true),
        );

        return [
            'mode' => 'account',
            'lane' => 'written',
            'label' => '내가 쓴 후기',
            'page' => $page,
            'page_size' => $limit,
            'total' => $total,
            'count' => $total,
            'items' => $items,
        ];
    }

    /**
     * @param array{user_id: int, role_type: string} $auth
     * @return array<string, mixed>
     */
    public function mypageSnapshot(array $auth): array
    {
        $role = (string) ($auth['role_type'] ?? '');
        $lane = ($role === 'study_room_owner' || $role === 'tutor') ? 'received' : 'written';

        return $this->inbox($auth, $lane, 1, 10);
    }

    /**
     * 후기함 단일 리스트 — 내가 쓴 후기 + 내가 관리하는 후기(소유 프로필에 달린 글)
     * @param array{user_id: int, role_type: string} $auth
     * @return array<string, mixed>
     */
    private function inboxAll(array $auth, int $page, int $limit): array
    {
        $role = (string) ($auth['role_type'] ?? '');
        $userId = (int) $auth['user_id'];
        $isProvider = $role === 'study_room_owner' || $role === 'tutor';
        $fetchLimit = 50;

        $written = $this->repo->listWrittenByAuthor($userId, $fetchLimit, 0, true);
        $received = [];
        if ($isProvider) {
            $type = $role === 'tutor' ? 'tutor' : 'study_room';
            $received = $this->repo->listReceivedByOwner($userId, $type, ReviewPolicy::PAGE_SIZE_MAX, 0);
        }

        $byId = [];
        foreach (array_merge($written, $received) as $row) {
            $byId[(int) $row['id']] = $row;
        }
        $rows = array_values($byId);
        usort(
            $rows,
            static fn (array $a, array $b): int => strcmp((string) ($b['created_at'] ?? ''), (string) ($a['created_at'] ?? '')),
        );

        $total = count($rows);
        $offset = ($page - 1) * $limit;
        $slice = array_slice($rows, $offset, $limit);
        $items = [];
        foreach ($slice as $row) {
            $authorId = (int) ($row['author_user_id'] ?? 0);
            $isMine = $authorId === $userId;
            $ownerId = $this->repo->getProviderOwnerUserId(
                (string) $row['provider_type'],
                (int) $row['provider_id'],
            );
            $isOwner = $ownerId !== null && $ownerId === $userId;
            $mapped = $this->mapReview($row, [
                'user_id' => $userId,
                'role_type' => $role,
                'is_owner' => $isOwner && !$isMine,
                'include_status' => $isMine,
                'include_author' => $isOwner && !$isMine,
                'is_review_blocked' => $this->repo->hasReviewBlock(
                    (string) $row['provider_type'],
                    (int) $row['provider_id'],
                    $authorId,
                ),
            ]);
            $mapped['provider_label'] = $this->repo->getProviderLabel(
                (string) $row['provider_type'],
                (int) $row['provider_id'],
            );
            $mapped['is_mine'] = $isMine;
            $mapped['is_owner'] = $isOwner && !$isMine;
            $items[] = $mapped;
        }

        return [
            'mode' => 'account',
            'lane' => 'all',
            'label' => '후기함',
            'page' => $page,
            'page_size' => $limit,
            'total' => $total,
            'count' => $total,
            'items' => $items,
        ];
    }

    /**
     * 후기함 대상별 보기 — 소유 프로필 + 내가 쓴 후기의 대상을 모은다.
     * @param array{user_id: int, role_type: string} $auth
     * @return array<string, mixed>
     */
    private function inboxTargets(array $auth): array
    {
        $role = (string) ($auth['role_type'] ?? '');
        $userId = (int) $auth['user_id'];
        /** @var array<string, array<string, mixed>> $map */
        $map = [];

        $put = function (string $type, int $id, string $label, bool $owned, int $count) use (&$map): void {
            if (($type !== 'study_room' && $type !== 'tutor') || $id <= 0) {
                return;
            }
            $key = $type . ':' . $id;
            $prev = $map[$key] ?? [
                'provider_type' => $type,
                'provider_id' => $id,
                'label' => $label,
                'owned' => false,
                'review_count' => 0,
            ];
            if ($label !== '') {
                $prev['label'] = $label;
            }
            $prev['owned'] = $prev['owned'] || $owned;
            if ($count > (int) $prev['review_count']) {
                $prev['review_count'] = $count;
            }
            $map[$key] = $prev;
        };

        if ($role === 'study_room_owner') {
            foreach ($this->repo->listOwnedProviders($userId, 'study_room') as $row) {
                $put('study_room', (int) $row['id'], (string) $row['label'], true, $this->repo->countVisible('study_room', (int) $row['id']));
            }
        }
        if ($role === 'tutor') {
            foreach ($this->repo->listOwnedProviders($userId, 'tutor') as $row) {
                $put('tutor', (int) $row['id'], (string) $row['label'], true, $this->repo->countVisible('tutor', (int) $row['id']));
            }
        }

        foreach ($this->repo->listWrittenTargets($userId) as $row) {
            $type = (string) $row['provider_type'];
            $id = (int) $row['provider_id'];
            $put($type, $id, $this->repo->getProviderLabel($type, $id), false, (int) $row['review_count']);
        }

        $items = array_values($map);

        return [
            'mode' => 'targets',
            'lane' => 'targets',
            'label' => '대상별 보기',
            'page' => 1,
            'page_size' => max(1, count($items)),
            'total' => count($items),
            'count' => count($items),
            'items' => $items,
        ];
    }

    /**
     * @deprecated 답글은 MVP 제외. 기존 엔드포인트 호환만 유지.
     * @param array{user_id: int, role_type: string} $auth
     * @return array<string, mixed>
     */
    public function createReply(array $auth, int $reviewId, string $body): array
    {
        throw new ReviewPolicyException(
            ReviewPolicy::ERR_VALIDATION,
            '후기 댓글·답글은 지원하지 않습니다.',
        );
    }

    /**
     * @param array{user_id: int, role_type: string} $auth
     */
    private function assertConsumerAuthor(array $auth): void
    {
        $role = (string) ($auth['role_type'] ?? '');
        if (!ReviewPolicy::canAuthorReviews($role)) {
            throw new ReviewPolicyException(
                ReviewPolicy::ERR_ROLE,
                '학부모/학생 역할만 후기를 남기거나 수정할 수 있습니다.',
            );
        }
    }

    /**
     * @param array{user_id: int, role_type: string} $auth
     * @return array{user_id: int}
     */
    private function assertCanCreate(array $auth, string $providerType, int $providerId): array
    {
        $role = (string) ($auth['role_type'] ?? '');
        if (!ReviewPolicy::canAuthorReviews($role)) {
            throw new ReviewPolicyException(ReviewPolicy::ERR_ROLE, '학부모/학생 역할만 후기를 남길 수 있습니다.');
        }
        $userId = (int) $auth['user_id'];
        $ownerId = $this->repo->getProviderOwnerUserId($providerType, $providerId);
        if ($ownerId === null) {
            throw new ReviewPolicyException(ReviewPolicy::ERR_NOT_FOUND, '대상을 찾을 수 없습니다.');
        }
        if ($ownerId === $userId) {
            throw new ReviewPolicyException(ReviewPolicy::ERR_OWNER, '본인 프로필에는 후기를 남길 수 없습니다.');
        }
        if ($this->repo->hasReviewBlock($providerType, $providerId, $userId)) {
            throw new ReviewPolicyException(
                ReviewPolicy::ERR_BLOCKED,
                '이 대상에는 더 이상 후기를 남길 수 없어요.',
            );
        }
        if ($this->repo->getReviewWriteStatus($providerType, $providerId) === ReviewPolicy::WRITE_CLOSED) {
            throw new ReviewPolicyException(
                ReviewPolicy::ERR_CLOSED,
                '현재는 새 후기를 받지 않아요.',
            );
        }
        if ($this->repo->getCreatedCount($providerType, $providerId, $userId) >= ReviewPolicy::MAX_CREATES_PER_TARGET) {
            throw new ReviewPolicyException(
                ReviewPolicy::ERR_QUOTA,
                '이 대상에는 후기를 더 남길 수 없습니다. (최대 3회)',
            );
        }
        if (!$this->repo->hasMessageThread($providerType, $providerId, $userId)) {
            throw new ReviewPolicyException(
                ReviewPolicy::ERR_NO_THREAD,
                '후기 작성은 쪽지(상담/문의) 경험 후 가능해요.',
            );
        }

        return ['user_id' => $userId];
    }

    /**
     * @param array{user_id: int, role_type: string} $auth
     * @return array<string, mixed>
     */
    private function requireOwnLiveReview(array $auth, int $reviewId): array
    {
        $review = $this->repo->getReviewById($reviewId);
        if ($review === null || (string) $review['review_status'] === ReviewPolicy::STATUS_DELETED) {
            throw new ReviewPolicyException(ReviewPolicy::ERR_NOT_FOUND, '후기를 찾을 수 없습니다.');
        }
        if ((int) $review['author_user_id'] !== (int) $auth['user_id']) {
            throw new ReviewPolicyException(ReviewPolicy::ERR_FORBIDDEN, '본인이 쓴 후기만 처리할 수 있습니다.');
        }

        return $review;
    }

    private function assertNotReviewBlocked(string $providerType, int $providerId, int $authorUserId, string $action): void
    {
        if (!$this->repo->hasReviewBlock($providerType, $providerId, $authorUserId)) {
            return;
        }
        if (ReviewPolicy::blockedActionAllowed($action)) {
            return;
        }
        throw new ReviewPolicyException(
            ReviewPolicy::ERR_BLOCKED,
            '후기차단 이후에는 수정할 수 없고 비공개 또는 삭제만 할 수 있어요.',
        );
    }

    /**
     * @param array{user_id: int, role_type: string} $auth
     */
    private function assertOwner(array $auth, string $providerType, int $providerId): void
    {
        $ownerId = $this->repo->getProviderOwnerUserId($providerType, $providerId);
        if ($ownerId === null || $ownerId !== (int) $auth['user_id']) {
            throw new ReviewPolicyException(ReviewPolicy::ERR_FORBIDDEN, '대상 소유자만 할 수 있습니다.');
        }
    }

    /**
     * @param array{user_id?: int, role_type?: string}|null $auth
     * @return array{
     *   user_id: int|null,
     *   can_write: bool,
     *   write_blocked_reason: string|null,
     *   is_owner: bool,
     *   has_written: bool,
     *   created_count: int,
     *   remaining_creates: int,
     *   is_review_blocked: bool,
     *   review_write_status: string,
     *   cta_kind: string
     * }
     */
    private function resolveViewer(?array $auth, string $providerType, int $providerId): array
    {
        $writeStatus = $this->repo->getReviewWriteStatus($providerType, $providerId);
        $empty = [
            'user_id' => null,
            'role_type' => '',
            'can_write' => false,
            'write_blocked_reason' => 'login',
            'is_owner' => false,
            'has_written' => false,
            'created_count' => 0,
            'remaining_creates' => ReviewPolicy::MAX_CREATES_PER_TARGET,
            'is_review_blocked' => false,
            'review_write_status' => $writeStatus,
            'cta_kind' => ReviewPolicy::CTA_INELIGIBLE,
        ];
        if ($auth === null) {
            return $empty;
        }

        $userId = (int) ($auth['user_id'] ?? 0);
        $role = (string) ($auth['role_type'] ?? '');
        $ownerId = $this->repo->getProviderOwnerUserId($providerType, $providerId);
        $isOwner = $ownerId !== null && $ownerId === $userId;
        $createdCount = $this->repo->getCreatedCount($providerType, $providerId, $userId);
        $remaining = max(0, ReviewPolicy::MAX_CREATES_PER_TARGET - $createdCount);
        $hasLive = $this->repo->listByAuthorOnTarget($providerType, $providerId, $userId) !== [];
        $hasWritten = $createdCount > 0;
        $blocked = $this->repo->hasReviewBlock($providerType, $providerId, $userId);

        if ($isOwner) {
            return [
                'user_id' => $userId,
                'role_type' => $role,
                'can_write' => false,
                'write_blocked_reason' => 'owner',
                'is_owner' => true,
                'has_written' => false,
                'created_count' => 0,
                'remaining_creates' => 0,
                'is_review_blocked' => false,
                'review_write_status' => $writeStatus,
                'cta_kind' => ReviewPolicy::CTA_NONE,
            ];
        }

        $reason = null;
        $canWrite = false;
        if (!ReviewPolicy::canAuthorReviews($role)) {
            $reason = 'role';
        } elseif ($blocked) {
            $reason = 'blocked';
        } elseif ($writeStatus === ReviewPolicy::WRITE_CLOSED) {
            $reason = 'closed';
        } elseif ($remaining <= 0) {
            $reason = 'quota';
        } elseif (!$this->repo->hasMessageThread($providerType, $providerId, $userId)) {
            $reason = 'no_thread';
        } else {
            $canWrite = true;
        }

        $cta = ReviewPolicy::CTA_INELIGIBLE;
        if ($hasWritten) {
            $cta = ReviewPolicy::CTA_MANAGE;
        } elseif ($canWrite) {
            $cta = ReviewPolicy::CTA_WRITE;
        } elseif ($reason === 'closed') {
            $cta = ReviewPolicy::CTA_CLOSED;
        } elseif ($reason === 'blocked') {
            $cta = ReviewPolicy::CTA_BLOCKED;
        }

        return [
            'user_id' => $userId,
            'role_type' => $role,
            'can_write' => $canWrite,
            'write_blocked_reason' => $reason,
            'is_owner' => false,
            'has_written' => $hasWritten,
            'created_count' => $createdCount,
            'remaining_creates' => $remaining,
            'is_review_blocked' => $blocked,
            'review_write_status' => $writeStatus,
            'cta_kind' => $cta,
            'has_live_reviews' => $hasLive,
        ];
    }

    /** @param array<string, mixed> $row @param array<string, mixed> $viewer */
    private function mapReview(array $row, array $viewer): array
    {
        $tags = json_decode((string) ($row['point_tags_json'] ?? '[]'), true);
        if (!is_array($tags)) {
            $tags = [];
        }
        $body = (string) $row['review_body'];
        $mapped = [
            'id' => (int) $row['id'],
            'provider_type' => (string) ($row['provider_type'] ?? ''),
            'provider_id' => (int) ($row['provider_id'] ?? 0),
            'review_origin_type' => (string) $row['review_origin_type'],
            'review_body' => $body,
            'snippet' => ReviewPolicy::snippet($body),
            'point_tags' => array_values(array_map('strval', $tags)),
            'created_at' => (string) $row['created_at'],
            'is_mine' => isset($viewer['user_id']) && (int) $viewer['user_id'] === (int) ($row['author_user_id'] ?? 0),
        ];
        if (!empty($viewer['include_status'])) {
            $mapped['review_status'] = (string) ($row['review_status'] ?? ReviewPolicy::STATUS_VISIBLE);
            $mapped['can_edit'] = ReviewPolicy::canAuthorReviews((string) ($viewer['role_type'] ?? ''))
                && empty($viewer['is_review_blocked'])
                && ($mapped['review_status'] !== ReviewPolicy::STATUS_DELETED);
            $mapped['can_delete'] = true;
            $mapped['can_hide'] = $mapped['review_status'] === ReviewPolicy::STATUS_VISIBLE;
            $mapped['can_unhide'] = $mapped['review_status'] === ReviewPolicy::STATUS_HIDDEN
                && empty($viewer['is_review_blocked'])
                && ReviewPolicy::canAuthorReviews((string) ($viewer['role_type'] ?? ''));
        }
        if (!empty($viewer['include_author']) || !empty($viewer['is_owner'])) {
            $mapped['author_user_id'] = (int) ($row['author_user_id'] ?? 0);
            $mapped['is_review_blocked'] = !empty($viewer['is_review_blocked']);
        }

        return $mapped;
    }

    private function normalizeBody(string $body): string
    {
        $body = trim($body);
        $len = mb_strlen($body);
        if ($len < ReviewPolicy::BODY_MIN || $len > ReviewPolicy::BODY_MAX) {
            throw new InvalidArgumentException(
                '후기 본문은 ' . ReviewPolicy::BODY_MIN . '~' . ReviewPolicy::BODY_MAX . '자로 작성해 주세요.',
            );
        }

        return $body;
    }

    /**
     * @param list<mixed> $tags
     * @return list<string>
     */
    private function normalizeTags(string $providerType, array $tags): array
    {
        $allowed = $this->allowedTags($providerType);
        $cleanTags = [];
        foreach ($tags as $tag) {
            $t = trim((string) $tag);
            if (in_array($t, $allowed, true) && !in_array($t, $cleanTags, true)) {
                $cleanTags[] = $t;
            }
        }
        if (count($cleanTags) < ReviewPolicy::TAGS_MIN || count($cleanTags) > ReviewPolicy::TAGS_MAX) {
            throw new InvalidArgumentException(
                '좋았던 점을 ' . ReviewPolicy::TAGS_MIN . '~' . ReviewPolicy::TAGS_MAX . '개 골라 주세요.',
            );
        }

        return $cleanTags;
    }

    private function assertProviderType(string $providerType): void
    {
        if (!in_array($providerType, ['study_room', 'tutor'], true)) {
            throw new InvalidArgumentException('provider_type: study_room | tutor');
        }
    }
}
