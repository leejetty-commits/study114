<?php

declare(strict_types=1);

namespace Study114\Reviews;

use InvalidArgumentException;
use Study114\Database\Connection;

final class ProviderReviewService
{
    public const BODY_MIN = 20;
    public const BODY_MAX = 300;
    public const REPLY_MAX = 200;
    public const TAGS_MIN = 1;
    public const TAGS_MAX = 3;
    public const LIST_LIMIT = 3;

    /** @var list<string> */
    public const COMMON_TAGS = [
        '설명이 쉬워요',
        '상담이 편해요',
        '응답이 빨라요',
        '아이와 잘 맞아요',
    ];

    /** @var list<string> */
    public const STUDY_ROOM_TAGS = [
        '동선이 편해요',
        '분위기가 안정적이에요',
        '관리가 꼼꼼해요',
    ];

    /** @var list<string> */
    public const TUTOR_TAGS = [
        '개념 설명이 잘해요',
        '숙제 관리가 좋아요',
        '시간 약속이 정확해요',
    ];

    private ProviderReviewRepository $repo;

    public function __construct(?ProviderReviewRepository $repo = null)
    {
        $this->repo = $repo ?? new ProviderReviewRepository(Connection::get());
    }

    /** @return list<string> */
    public function allowedTags(string $providerType): array
    {
        $extra = $providerType === 'tutor' ? self::TUTOR_TAGS : self::STUDY_ROOM_TAGS;

        return array_values(array_unique([...self::COMMON_TAGS, ...$extra]));
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
        $tags = $this->repo->aggregateTags($providerType, $providerId, 4);
        $viewer = $this->resolveViewer($auth, $providerType, $providerId);
        $canReadBody = $viewer['can_read_body'];
        $reviews = [];
        if ($canReadBody) {
            foreach ($this->repo->listVisible($providerType, $providerId, self::LIST_LIMIT) as $row) {
                $reviews[] = $this->mapReview($row, $viewer);
            }
        }

        $consultation = 0;
        $experience = 0;
        if ($canReadBody) {
            foreach ($reviews as $r) {
                if (($r['review_origin_type'] ?? '') === 'consultation') {
                    $consultation++;
                } else {
                    $experience++;
                }
            }
        }

        return [
            'provider_type' => $providerType,
            'provider_id' => $providerId,
            'review_count' => $count,
            'summary_tags' => $tags,
            'origin_hint' => [
                'consultation' => $consultation,
                'experience' => $experience,
            ],
            'can_read_body' => $canReadBody,
            'can_write' => $viewer['can_write'],
            'write_blocked_reason' => $viewer['write_blocked_reason'],
            'is_owner' => $viewer['is_owner'],
            'allowed_tags' => $this->allowedTags($providerType),
            'reviews' => $reviews,
            'guest_teaser' => !$canReadBody
                ? '로그인 후 후기를 확인할 수 있습니다.'
                : null,
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
    ): array {
        $this->assertProviderType($providerType);
        if ($providerId <= 0) {
            throw new InvalidArgumentException('provider_id가 필요합니다.');
        }
        if (!in_array($originType, ['consultation', 'experience'], true)) {
            throw new InvalidArgumentException('접점 유형: consultation | experience');
        }
        $role = (string) ($auth['role_type'] ?? '');
        if ($role !== 'guardian_student') {
            throw new InvalidArgumentException('학부모/학생 역할만 후기를 남길 수 있습니다.');
        }
        $userId = (int) $auth['user_id'];
        $ownerId = $this->repo->getProviderOwnerUserId($providerType, $providerId);
        if ($ownerId === null) {
            throw new InvalidArgumentException('대상을 찾을 수 없습니다.');
        }
        if ($ownerId === $userId) {
            throw new InvalidArgumentException('본인 프로필에는 후기를 남길 수 없습니다.');
        }
        if ($this->repo->findByAuthor($providerType, $providerId, $userId) !== null) {
            throw new InvalidArgumentException('이미 이 대상에 후기를 남겼습니다.');
        }
        if (!$this->repo->hasMessageThread($providerType, $providerId, $userId)) {
            throw new InvalidArgumentException('쪽지로 상담한 뒤에 후기를 남길 수 있습니다.');
        }

        $body = trim($body);
        $len = mb_strlen($body);
        if ($len < self::BODY_MIN || $len > self::BODY_MAX) {
            throw new InvalidArgumentException('후기 본문은 ' . self::BODY_MIN . '~' . self::BODY_MAX . '자로 작성해 주세요.');
        }

        $allowed = $this->allowedTags($providerType);
        $cleanTags = [];
        foreach ($tags as $tag) {
            $t = trim((string) $tag);
            if (in_array($t, $allowed, true) && !in_array($t, $cleanTags, true)) {
                $cleanTags[] = $t;
            }
        }
        if (count($cleanTags) < self::TAGS_MIN || count($cleanTags) > self::TAGS_MAX) {
            throw new InvalidArgumentException('좋았던 점을 ' . self::TAGS_MIN . '~' . self::TAGS_MAX . '개 골라 주세요.');
        }

        $id = $this->repo->insertReview($providerType, $providerId, $userId, $originType, $body, $cleanTags);

        return $this->getSummary($providerType, $providerId, $auth) + ['created_id' => $id];
    }

    /**
     * @param array{user_id: int, role_type: string} $auth
     * @return array<string, mixed>
     */
    public function createReply(array $auth, int $reviewId, string $body): array
    {
        $review = $this->repo->getReviewById($reviewId);
        if ($review === null || (string) $review['review_status'] !== 'visible') {
            throw new InvalidArgumentException('후기를 찾을 수 없습니다.');
        }
        $providerType = (string) $review['provider_type'];
        $providerId = (int) $review['provider_id'];
        $ownerId = $this->repo->getProviderOwnerUserId($providerType, $providerId);
        if ($ownerId === null || $ownerId !== (int) $auth['user_id']) {
            throw new InvalidArgumentException('본인 프로필의 후기에만 답글할 수 있습니다.');
        }
        if ($this->repo->hasReply($reviewId)) {
            throw new InvalidArgumentException('이미 답글을 남겼습니다.');
        }
        $body = trim($body);
        if ($body === '' || mb_strlen($body) > self::REPLY_MAX) {
            throw new InvalidArgumentException('답글은 1~' . self::REPLY_MAX . '자로 작성해 주세요.');
        }
        if ($this->containsContactSpam($body)) {
            throw new InvalidArgumentException('연락처·외부 링크·직접 영업 문구는 답글에 넣을 수 없습니다.');
        }
        $this->repo->insertReply($reviewId, (int) $auth['user_id'], $body);

        return $this->getSummary($providerType, $providerId, $auth);
    }

    /**
     * @param array{user_id: int, role_type: string} $auth
     * @return array<string, mixed>
     */
    public function mypageSnapshot(array $auth): array
    {
        $role = (string) ($auth['role_type'] ?? '');
        $userId = (int) $auth['user_id'];
        if ($role === 'guardian_student') {
            $items = array_map(fn (array $row) => $this->mapReview($row, [
                'can_reply' => false,
                'is_owner' => false,
            ]), $this->repo->listWrittenByAuthor($userId, 10));

            return [
                'lane' => 'written',
                'label' => '내가 남긴 후기',
                'count' => count($items),
                'items' => $items,
            ];
        }
        if ($role === 'study_room_owner' || $role === 'tutor') {
            $type = $role === 'tutor' ? 'tutor' : 'study_room';
            $items = array_map(fn (array $row) => $this->mapReview($row, [
                'can_reply' => empty($row['reply_body']),
                'is_owner' => true,
            ]), $this->repo->listReceivedByOwner($userId, $type, 10));

            return [
                'lane' => 'received',
                'label' => '받은 후기',
                'count' => $this->repo->countReceivedByOwner($userId, $type),
                'items' => $items,
                'hint' => '답글은 상세 화면에서 후기마다 1회만 남길 수 있습니다.',
            ];
        }

        return [
            'lane' => 'none',
            'label' => '후기',
            'count' => 0,
            'items' => [],
        ];
    }

    /**
     * @param array{user_id?: int, role_type?: string}|null $auth
     * @return array{can_read_body: bool, can_write: bool, write_blocked_reason: string|null, is_owner: bool, can_reply: bool}
     */
    private function resolveViewer(?array $auth, string $providerType, int $providerId): array
    {
        if ($auth === null) {
            return [
                'can_read_body' => false,
                'can_write' => false,
                'write_blocked_reason' => 'login',
                'is_owner' => false,
                'can_reply' => false,
            ];
        }
        $userId = (int) ($auth['user_id'] ?? 0);
        $role = (string) ($auth['role_type'] ?? '');
        $ownerId = $this->repo->getProviderOwnerUserId($providerType, $providerId);
        $isOwner = $ownerId !== null && $ownerId === $userId;

        if ($isOwner) {
            return [
                'can_read_body' => true,
                'can_write' => false,
                'write_blocked_reason' => 'owner',
                'is_owner' => true,
                'can_reply' => true,
            ];
        }

        // 로그인 회원(학부모·다른 공급자)은 본문 열람 가능, 작성은 학부모+쪽지 접점만
        $canWrite = false;
        $reason = null;
        if ($role !== 'guardian_student') {
            $reason = 'role';
        } elseif ($this->repo->findByAuthor($providerType, $providerId, $userId) !== null) {
            $reason = 'already_written';
        } elseif (!$this->repo->hasMessageThread($providerType, $providerId, $userId)) {
            $reason = 'no_thread';
        } else {
            $canWrite = true;
        }

        return [
            'can_read_body' => true,
            'can_write' => $canWrite,
            'write_blocked_reason' => $reason,
            'is_owner' => false,
            'can_reply' => false,
        ];
    }

    /** @param array<string, mixed> $row @param array<string, mixed> $viewer */
    private function mapReview(array $row, array $viewer): array
    {
        $tags = json_decode((string) ($row['point_tags_json'] ?? '[]'), true);
        if (!is_array($tags)) {
            $tags = [];
        }
        $replyBody = isset($row['reply_body']) && $row['reply_body'] !== null
            ? (string) $row['reply_body']
            : null;

        return [
            'id' => (int) $row['id'],
            'provider_type' => (string) ($row['provider_type'] ?? ''),
            'provider_id' => (int) ($row['provider_id'] ?? 0),
            'review_origin_type' => (string) $row['review_origin_type'],
            'review_body' => (string) $row['review_body'],
            'point_tags' => array_values(array_map('strval', $tags)),
            'created_at' => (string) $row['created_at'],
            'reply' => $replyBody !== null
                ? [
                    'body' => $replyBody,
                    'created_at' => isset($row['reply_created_at']) ? (string) $row['reply_created_at'] : null,
                ]
                : null,
            'can_reply' => !empty($viewer['is_owner']) && $replyBody === null,
        ];
    }

    private function assertProviderType(string $providerType): void
    {
        if (!in_array($providerType, ['study_room', 'tutor'], true)) {
            throw new InvalidArgumentException('provider_type: study_room | tutor');
        }
    }

    private function containsContactSpam(string $body): bool
    {
        if (preg_match('/https?:\\/\\/|www\\.|[0-9]{2,3}-[0-9]{3,4}-[0-9]{4}|@[\\w.-]+\\.[a-z]{2,}/iu', $body)) {
            return true;
        }
        $banned = ['카톡', '텔레그램', '문자주세요', '전화주세요', '연락처', '오픈채팅'];
        foreach ($banned as $word) {
            if (mb_stripos($body, $word) !== false) {
                return true;
            }
        }

        return false;
    }
}
