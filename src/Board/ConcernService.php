<?php

declare(strict_types=1);

namespace Study114\Board;

use InvalidArgumentException;
use Study114\Database\Connection;

/**
 * 고민방 글쓰기·삭제·댓글·반응·신고 + 인기 조회.
 * 화면(preview/)은 157-9c, 레일은 157-9d. 이 클래스는 서버 저장만 담당한다.
 */
final class ConcernService
{
    private const CONCERN_BOARD_KEYS = [
        'concern-director',
        'concern-tutor',
        'concern-parent',
        'concern-solved',
    ];

    /** 인기·최신·베스트 묶음(concern-hot.php)에서 학생·학부모(demand)에게 내려보내지 않는 방. 게시판 접근 규칙과 별개. */
    private const DEMAND_HIDDEN_FEED_KEYS = ['concern-director', 'concern-tutor'];

    /** 글 종류. board_posts.meta_json.type 에 저장. 값이 없던 기존 글은 DEFAULT_POST_TYPE 로 읽는다. */
    public const POST_TYPES = ['worry', 'advice', 'solved', 'request'];
    public const DEFAULT_POST_TYPE = 'worry';

    public const LIST_SORTS = ['recent', 'hot', 'comments'];
    public const LIST_LIMIT_DEFAULT = 20;
    public const LIST_LIMIT_MAX = 50;
    public const LATEST_LIMIT_DEFAULT = 3;
    public const LATEST_LIMIT_MAX = 10;

    private const EMPTY_AGG = ['empathy' => 0, 'helpful' => 0, 'cheer' => 0, 'score' => 0];

    private const TITLE_MAX_LENGTH = 100;
    private const BODY_MAX_LENGTH  = 5000;
    private const COMMENT_MAX_LENGTH = 2000;
    private const REASON_MAX_LENGTH  = 500;

    private BoardPostRepository $postRepo;
    private ConcernCommentRepository $commentRepo;
    private ConcernReactionRepository $reactionRepo;
    private ConcernReportRepository $reportRepo;
    private AuthorDisplayNameResolver $nameResolver;

    public function __construct()
    {
        $pdo = Connection::get();
        $this->postRepo = new BoardPostRepository($pdo);
        $this->commentRepo = new ConcernCommentRepository($pdo);
        $this->reactionRepo = new ConcernReactionRepository($pdo);
        $this->reportRepo = new ConcernReportRepository($pdo);
        $this->nameResolver = new AuthorDisplayNameResolver($pdo);
    }

    // ─── 글쓰기·수정 ───

    /**
     * @param array<string, mixed> $input
     * @param array{user_id: int|string, role_type: string} $auth
     * @return array<string, mixed>
     */
    public function savePost(array $input, array $auth): array
    {
        $boardKey = BoardChannelAcl::normalizeBoardKey(trim((string) ($input['board_key'] ?? $input['boardKey'] ?? '')));
        $this->assertConcernBoard($boardKey);

        $boardRole = BoardChannelAcl::boardRoleFromAuth($auth);
        if (!BoardChannelAcl::canList($boardKey, $boardRole) || !BoardChannelAcl::canCompose($boardKey, $boardRole)) {
            throw new BoardAccessException(403, 'forbidden', '이 게시판에 글을 쓸 권한이 없습니다.');
        }

        $navRole = $this->nameResolver->navRole($auth);
        $displayName = $this->nameResolver->resolve($auth);
        if ($displayName === '') {
            throw new BoardAccessException(422, 'display_name_required', '표시 이름을 먼저 입력해 주세요.');
        }

        $userId = (int) ($auth['user_id'] ?? 0);
        $postKey = isset($input['post_key']) ? trim((string) $input['post_key'])
                 : (isset($input['id']) ? trim((string) $input['id']) : '');

        $title = $this->sanitize(trim((string) ($input['title'] ?? '')));
        if ($title === '') {
            throw new InvalidArgumentException('제목이 필요합니다.');
        }
        if (mb_strlen($title) > self::TITLE_MAX_LENGTH) {
            throw new InvalidArgumentException('제목은 ' . self::TITLE_MAX_LENGTH . '자 이내로 입력해 주세요.');
        }

        $bodyRaw = (string) ($input['body'] ?? $input['description'] ?? '');
        $body = $this->sanitize($this->normalizeLineBreaks(trim($bodyRaw)));
        if (mb_strlen($body) > self::BODY_MAX_LENGTH) {
            throw new InvalidArgumentException('본문은 ' . self::BODY_MAX_LENGTH . '자 이내로 입력해 주세요.');
        }

        $hasType = array_key_exists('type', $input) && $input['type'] !== null;
        $type = $hasType ? self::assertPostType(is_string($input['type']) ? $input['type'] : '') : null;

        $existing = null;
        if ($postKey !== '') {
            $existing = $this->postRepo->findByNumericId(ctype_digit($postKey) ? (int) $postKey : 0)
                     ?? ($this->postRepo->findByKey($boardKey, $postKey));
            if ($existing === null) {
                throw new InvalidArgumentException('게시물을 찾을 수 없습니다.');
            }
            $actualKey = (string) $existing['board_key'];
            if ($actualKey !== $boardKey) {
                throw new BoardAccessException(403, 'forbidden', '요청 게시판과 실제 게시글 채널이 다릅니다.');
            }
            $this->assertPostOwnership($existing, $userId);
            $status = (string) ($existing['status'] ?? '');
            if ($status === 'deleted') {
                throw new BoardAccessException(404, 'not_found', '삭제된 글은 수정할 수 없습니다.');
            }
            if ($status !== 'published') {
                throw new BoardAccessException(422, 'validation', '지금은 수정할 수 없는 글입니다.');
            }
            $postKey = (string) $existing['post_key'];
        }

        if ($existing !== null) {
            $meta = self::decodeMeta($existing);
            $meta['bodyText'] = $body;
            if ($type !== null) {
                $meta['type'] = $type;
            } elseif (!isset($meta['type']) || !in_array($meta['type'], self::POST_TYPES, true)) {
                $meta['type'] = self::DEFAULT_POST_TYPE;
            }
            if (!isset($meta['authorDisplayName']) || (string) $meta['authorDisplayName'] === '') {
                $meta['authorDisplayName'] = $displayName;
            }
            $meta['editedAt'] = date('Y-m-d H:i:s');
        } else {
            $meta = [
                'authorDisplayName' => $displayName,
                'bodyText' => $body,
                'type' => $type ?? self::DEFAULT_POST_TYPE,
            ];
            // 같은 초에 두 글이 들어와도 기존 글을 덮어쓰지 않도록 키에 난수를 붙인다.
            $postKey = $boardKey . '-' . time() . '-' . bin2hex(random_bytes(3));
        }

        $saved = $this->postRepo->save(
            $boardKey,
            $postKey,
            $navRole,
            'published',
            $title,
            $body,
            '',
            null,
            '',
            $meta,
            $userId,
        );

        $numId = (int) $saved['id'];

        return $this->mapListItem(
            $saved,
            $this->reactionRepo->aggregateForPost($numId),
            $this->commentRepo->countByPost($numId),
            $this->reactionRepo->myReactionForPost($numId, $userId),
        );
    }

    // ─── 목록 (정렬·종류 필터·페이징) ───

    /**
     * GET 쿼리 → 목록 조건. sort·type 이 허용값 밖이면 422.
     *
     * @return array{sort: string, type: string|null, limit: int, offset: int}
     */
    public static function parseListQuery(?string $sort, ?string $type, ?string $limit, ?string $offset): array
    {
        $sort = ($sort === null || $sort === '') ? 'recent' : $sort;
        if (!in_array($sort, self::LIST_SORTS, true)) {
            throw new InvalidArgumentException('정렬은 recent · hot · comments만 허용됩니다.');
        }
        $type = ($type === null || $type === '' || $type === 'all') ? null : self::assertPostType($type);

        $limitN = ($limit === null || $limit === '') ? self::LIST_LIMIT_DEFAULT : (int) $limit;
        $limitN = max(1, min($limitN, self::LIST_LIMIT_MAX));
        $offsetN = ($offset === null || $offset === '') ? 0 : max(0, (int) $offset);

        return ['sort' => $sort, 'type' => $type, 'limit' => $limitN, 'offset' => $offsetN];
    }

    /**
     * 고민방 한 방의 목록 한 페이지. full·titles 둘 다 같은 정렬·필터·페이징을 쓴다.
     * titles 면 mapTitleOnly 필드만 내보낸다(본문·작성자·내 반응·meta 없음).
     *
     * @param list<string> $statuses
     * @param array{sort: string, type: string|null, limit: int, offset: int} $query
     * @return array{posts: list<array<string, mixed>>, total: int, limit: int, offset: int, sort: string, type: string|null, hasMore: bool}
     */
    public function listPage(
        string $boardKey,
        array $statuses,
        ?string $postKey,
        array $query,
        ?int $currentUserId,
        bool $titlesOnly,
    ): array {
        $sort = $query['sort'];
        $type = $query['type'];
        $limit = $query['limit'];
        $offset = $query['offset'];

        $rows = $this->postRepo->listConcernRows($boardKey, $statuses, $postKey);
        if ($type !== null) {
            $rows = array_values(array_filter(
                $rows,
                static fn (array $r): bool => self::postTypeOf($r) === $type,
            ));
        }
        $total = count($rows);

        if ($sort === 'recent') {
            $pageRows = array_slice($rows, $offset, $limit);
            $ids = array_map(static fn (array $r): int => (int) $r['id'], $pageRows);
            $reactAgg = $this->reactionRepo->aggregateForPosts($ids);
            $commentCounts = $this->bulkCommentCounts($ids);
        } else {
            $ids = array_map(static fn (array $r): int => (int) $r['id'], $rows);
            $reactAgg = $this->reactionRepo->aggregateForPosts($ids);
            $commentCounts = $this->bulkCommentCounts($ids);
            usort($rows, static function (array $a, array $b) use ($sort, $reactAgg, $commentCounts): int {
                $ia = (int) $a['id'];
                $ib = (int) $b['id'];
                if ($sort === 'hot') {
                    $aggA = $reactAgg[$ia] ?? self::EMPTY_AGG;
                    $aggB = $reactAgg[$ib] ?? self::EMPTY_AGG;
                    $primary = ($aggB['score'] <=> $aggA['score'])
                        ?: (self::reactionTotalOf($aggB) <=> self::reactionTotalOf($aggA));
                } else {
                    $primary = ($commentCounts[$ib] ?? 0) <=> ($commentCounts[$ia] ?? 0);
                }

                return $primary
                    ?: (strcmp((string) $b['created_at'], (string) $a['created_at']) ?: ($ib <=> $ia));
            });
            $pageRows = array_slice($rows, $offset, $limit);
        }

        $posts = [];
        foreach ($pageRows as $row) {
            $pid = (int) $row['id'];
            $agg = $reactAgg[$pid] ?? self::EMPTY_AGG;
            $commentCount = $commentCounts[$pid] ?? 0;
            if ($titlesOnly) {
                $posts[] = $this->mapTitleOnly($row, $agg, $commentCount);
                continue;
            }
            $myReaction = ($currentUserId !== null && $currentUserId > 0)
                ? $this->reactionRepo->myReactionForPost($pid, $currentUserId)
                : null;
            $posts[] = $this->mapListItem($row, $agg, $commentCount, $myReaction);
        }

        return [
            'posts' => $posts,
            'total' => $total,
            'limit' => $limit,
            'offset' => $offset,
            'sort' => $sort,
            'type' => $type,
            'hasMore' => $offset + count($posts) < $total,
        ];
    }

    // ─── 글 삭제 (논리) ───

    /**
     * 고민방 글 논리 삭제. 댓글·반응이 딸려 있으므로 물리 DELETE 대신 status='deleted'.
     *
     * @param array{user_id: int|string, role_type: string} $auth
     */
    public function deletePost(string $boardKey, string $postKey, array $auth): void
    {
        $boardKey = BoardChannelAcl::normalizeBoardKey($boardKey);
        $this->assertConcernBoard($boardKey);

        $boardRole = BoardChannelAcl::boardRoleFromAuth($auth);
        if (!BoardChannelAcl::canDelete($boardKey, $boardRole) && !BoardChannelAcl::canCompose($boardKey, $boardRole)) {
            throw new BoardAccessException(403, 'forbidden', '이 게시판에서 삭제할 권한이 없습니다.');
        }

        $existing = $this->resolvePost($boardKey, $postKey);
        $userId = (int) ($auth['user_id'] ?? 0);
        $isAdmin = ($auth['role_type'] ?? '') === 'admin' || !empty($auth['admin_level']);

        if (!$isAdmin) {
            $this->assertPostOwnership($existing, $userId);
        }

        $this->postRepo->updateAdminReview(
            (string) $existing['board_key'],
            (string) $existing['post_key'],
            'deleted',
            null,
        );
    }

    // ─── 댓글 ───

    /**
     * @param array{user_id: int|string, role_type: string} $auth
     * @return array<string, mixed>
     */
    public function addComment(int $postId, array $input, array $auth): array
    {
        $post = $this->assertPostAccessible($postId, $auth);
        $boardKey = (string) $post['board_key'];

        $boardRole = BoardChannelAcl::boardRoleFromAuth($auth);
        if (!BoardChannelAcl::canComment($boardKey, $boardRole)) {
            throw new BoardAccessException(403, 'forbidden', '이 게시판에 댓글을 쓸 권한이 없습니다.');
        }

        $displayName = $this->nameResolver->resolve($auth);
        if ($displayName === '') {
            throw new BoardAccessException(422, 'display_name_required', '표시 이름을 먼저 입력해 주세요.');
        }

        $body = $this->sanitize($this->normalizeLineBreaks(trim((string) ($input['body'] ?? ''))));
        if ($body === '') {
            throw new InvalidArgumentException('댓글 내용이 필요합니다.');
        }
        if (mb_strlen($body) > self::COMMENT_MAX_LENGTH) {
            throw new InvalidArgumentException('댓글은 ' . self::COMMENT_MAX_LENGTH . '자 이내로 입력해 주세요.');
        }

        $parentCommentId = isset($input['parent_comment_id']) ? (int) $input['parent_comment_id'] : null;
        if ($parentCommentId !== null) {
            $parent = $this->commentRepo->findById($parentCommentId);
            if ($parent === null || (int) $parent['post_id'] !== $postId) {
                throw new InvalidArgumentException('상위 댓글을 찾을 수 없습니다.');
            }
            if ($parent['parent_comment_id'] !== null) {
                throw new InvalidArgumentException('대댓글에는 답글을 달 수 없습니다 (2단계까지).');
            }
        }

        $navRole = $this->nameResolver->navRole($auth);
        $userId = (int) ($auth['user_id'] ?? 0);

        $row = $this->commentRepo->insert($postId, $parentCommentId, $userId, $navRole, $displayName, $body);

        return $this->mapComment($row, $userId);
    }

    /**
     * 본인 댓글 삭제.
     *
     * @param array{user_id: int|string, role_type: string} $auth
     */
    public function deleteComment(int $commentId, array $auth): void
    {
        $comment = $this->commentRepo->findById($commentId);
        if ($comment === null) {
            throw new InvalidArgumentException('댓글을 찾을 수 없습니다.');
        }

        $userId = (int) ($auth['user_id'] ?? 0);
        $isAdmin = ($auth['role_type'] ?? '') === 'admin' || !empty($auth['admin_level']);
        if (!$isAdmin && (int) $comment['author_user_id'] !== $userId) {
            throw new BoardAccessException(403, 'forbidden', '본인 댓글만 삭제할 수 있습니다.');
        }

        $this->commentRepo->softDelete($commentId);
    }

    /**
     * 글별 댓글 목록 (2단계 트리).
     *
     * @return list<array<string, mixed>>
     */
    public function listComments(int $postId, ?array $auth = null, ?int $currentUserId = null): array
    {
        $this->assertPostAccessible($postId, $auth);
        $rows = $this->commentRepo->listByPost($postId);
        $mapped = array_map(fn (array $r) => $this->mapComment($r, $currentUserId), $rows);

        $topLevel = [];
        $childrenMap = [];
        foreach ($mapped as $c) {
            $parentId = $c['parentCommentId'];
            if ($parentId === null) {
                $topLevel[] = $c;
            } else {
                $childrenMap[$parentId][] = $c;
            }
        }

        $result = [];
        foreach ($topLevel as $top) {
            $top['replies'] = $childrenMap[$top['id']] ?? [];
            $result[] = $top;
        }

        return $result;
    }

    // ─── 반응 ───

    /**
     * 반응 토글. 같은 kind → 취소, 다른 kind → 교체, 없으면 추가.
     *
     * @param array{user_id: int|string, role_type: string} $auth
     * @return array{action: string, kind: string|null, reactions: array<string, int>}
     */
    public function toggleReaction(int $postId, ?int $commentId, string $kind, array $auth): array
    {
        $post = $this->assertPostAccessible($postId, $auth);
        $boardKey = (string) $post['board_key'];

        $boardRole = BoardChannelAcl::boardRoleFromAuth($auth);
        if (!BoardChannelAcl::canReact($boardKey, $boardRole)) {
            throw new BoardAccessException(403, 'forbidden', '이 게시판에서 반응할 권한이 없습니다.');
        }

        $userId = (int) ($auth['user_id'] ?? 0);

        if ($commentId !== null) {
            if (!in_array($kind, ConcernReactionRepository::COMMENT_KINDS, true)) {
                throw new InvalidArgumentException('댓글에는 도움됐어요만 허용됩니다.');
            }
            $comment = $this->commentRepo->findById($commentId);
            if ($comment === null || (int) $comment['post_id'] !== $postId) {
                throw new InvalidArgumentException('댓글을 찾을 수 없습니다.');
            }
            if ((int) $comment['author_user_id'] === $userId) {
                throw new BoardAccessException(403, 'forbidden', '본인 댓글에는 반응할 수 없습니다.');
            }
        } else {
            if (!in_array($kind, ConcernReactionRepository::POST_KINDS, true)) {
                throw new InvalidArgumentException('허용되지 않는 반응 종류입니다.');
            }
            if ((int) ($post['author_user_id'] ?? 0) === $userId) {
                throw new BoardAccessException(403, 'forbidden', '본인 글에는 반응할 수 없습니다.');
            }
        }

        $existing = $this->reactionRepo->findExisting($postId, $commentId, $userId);

        if ($existing !== null) {
            if ((string) $existing['kind'] === $kind) {
                $this->reactionRepo->delete((int) $existing['id']);
                $action = 'removed';
                $resultKind = null;
            } else {
                $this->reactionRepo->updateKind((int) $existing['id'], $kind);
                $action = 'replaced';
                $resultKind = $kind;
            }
        } else {
            $this->reactionRepo->insert($postId, $commentId, $userId, $kind);
            $action = 'added';
            $resultKind = $kind;
        }

        $reactions = $commentId !== null
            ? $this->reactionRepo->aggregateForComment($commentId)
            : $this->reactionRepo->aggregateForPost($postId);

        return ['action' => $action, 'kind' => $resultKind, 'reactions' => $reactions];
    }

    // ─── 신고 ───

    /**
     * @param array{user_id: int|string, role_type: string} $auth
     * @return array{reported: bool, autoHidden: bool}
     */
    public function report(int $postId, ?int $commentId, string $reason, array $auth): array
    {
        $post = $this->assertPostAccessible($postId, $auth);
        $boardKey = (string) $post['board_key'];

        $userId = (int) ($auth['user_id'] ?? 0);

        if ($commentId !== null) {
            $comment = $this->commentRepo->findById($commentId);
            if ($comment === null || (int) $comment['post_id'] !== $postId) {
                throw new InvalidArgumentException('댓글을 찾을 수 없습니다.');
            }
            if ((int) $comment['author_user_id'] === $userId) {
                throw new BoardAccessException(403, 'forbidden', '본인 댓글은 신고할 수 없습니다.');
            }
        } else {
            if ((int) ($post['author_user_id'] ?? 0) === $userId) {
                throw new BoardAccessException(403, 'forbidden', '본인 글은 신고할 수 없습니다.');
            }
        }

        $reason = $this->sanitize(trim((string) $reason));
        if (mb_strlen($reason) > self::REASON_MAX_LENGTH) {
            $reason = mb_substr($reason, 0, self::REASON_MAX_LENGTH);
        }

        $existing = $this->reportRepo->findExisting($postId, $commentId, $userId);
        if ($existing !== null) {
            throw new InvalidArgumentException('이미 신고한 대상입니다.');
        }

        $this->reportRepo->insert($postId, $commentId, $userId, $reason);

        $autoHidden = false;
        if ($this->reportRepo->shouldAutoHide($postId, $commentId)) {
            if ($commentId !== null) {
                $this->commentRepo->autoHide($commentId);
            } else {
                $this->postRepo->updateAdminReview(
                    (string) $post['board_key'],
                    (string) $post['post_key'],
                    'hidden',
                    null,
                );
            }
            $autoHidden = true;
        }

        return ['reported' => true, 'autoHidden' => $autoHidden];
    }

    // ─── 인기 조회 ───

    /**
     * 최근 7일 HOT (점수순).
     *
     * @return list<array<string, mixed>>
     */
    public function listHot(?array $auth = null, int $limit = 10): array
    {
        $boardRole = $auth !== null ? BoardChannelAcl::boardRoleFromAuth($auth) : 'guest';
        $isGuest = $boardRole === 'guest';
        $userId = $isGuest ? null : (int) ($auth['user_id'] ?? 0);
        $since = date('Y-m-d H:i:s', strtotime('-7 days'));

        $fullKeys = [];
        $titleOnlyKeys = [];
        foreach (self::CONCERN_BOARD_KEYS as $k) {
            if (self::isHiddenFromFeed($k, $boardRole)) {
                continue;
            }
            if (BoardChannelAcl::canList($k, $boardRole)) {
                $fullKeys[] = $k;
            } elseif (BoardChannelAcl::canDiscover($k, $boardRole)) {
                $titleOnlyKeys[] = $k;
            }
        }
        $allKeys = array_merge($fullKeys, $titleOnlyKeys);
        if ($allKeys === []) {
            return [];
        }
        $titleOnlySet = array_flip($titleOnlyKeys);

        $placeholders = implode(',', array_fill(0, count($allKeys), '?'));

        $pdo = Connection::get();
        $stmt = $pdo->prepare(
            "SELECT bp.id, bp.board_key, bp.post_key, bp.title, bp.description, bp.author_user_id,
                    bp.author_role, bp.meta_json, bp.status, bp.created_at, bp.updated_at
             FROM board_posts bp
             WHERE bp.board_key IN ({$placeholders})
               AND bp.status = 'published'
               AND bp.created_at >= ?
             ORDER BY bp.created_at DESC"
        );
        $params = [...$allKeys, $since];
        $stmt->execute($params);
        $rows = $stmt->fetchAll();

        if ($rows === []) {
            return [];
        }

        $postIds = array_map(fn ($r) => (int) $r['id'], $rows);
        $reactAgg = $this->reactionRepo->aggregateForPosts($postIds);
        $commentCounts = $this->bulkCommentCounts($postIds);

        $items = [];
        foreach ($rows as $row) {
            $pid = (int) $row['id'];
            $agg = $reactAgg[$pid] ?? ['empathy' => 0, 'helpful' => 0, 'cheer' => 0, 'score' => 0];
            $items[] = [
                'row' => $row,
                'reactions' => $agg,
                'commentCount' => $commentCounts[$pid] ?? 0,
                'score' => $agg['score'],
            ];
        }

        usort($items, fn ($a, $b) => $b['score'] <=> $a['score'] ?: $b['row']['id'] <=> $a['row']['id']);
        $items = array_slice($items, 0, $limit);

        return array_map(function ($item) use ($titleOnlySet, $isGuest, $userId) {
            $bk = (string) $item['row']['board_key'];

            return $this->mapHotItem($item, $isGuest || isset($titleOnlySet[$bk]), $userId);
        }, $items);
    }

    /**
     * 이번 달 베스트 (방별 3개, 반응 합계 ≥ 5).
     *
     * @return array<string, list<array<string, mixed>>>
     */
    public function listBest(?array $auth = null): array
    {
        $boardRole = $auth !== null ? BoardChannelAcl::boardRoleFromAuth($auth) : 'guest';
        $isGuest = $boardRole === 'guest';
        $userId = $isGuest ? null : (int) ($auth['user_id'] ?? 0);
        $monthStart = date('Y-m-01 00:00:00');

        $fullKeys = [];
        $titleOnlyKeys = [];
        foreach (self::CONCERN_BOARD_KEYS as $k) {
            if (self::isHiddenFromFeed($k, $boardRole)) {
                continue;
            }
            if (BoardChannelAcl::canList($k, $boardRole)) {
                $fullKeys[] = $k;
            } elseif (BoardChannelAcl::canDiscover($k, $boardRole)) {
                $titleOnlyKeys[] = $k;
            }
        }
        $titleOnlySet = array_flip($titleOnlyKeys);
        $visibleKeys = array_merge($fullKeys, $titleOnlyKeys);

        $result = [];
        foreach (self::CONCERN_BOARD_KEYS as $boardKey) {
            if (!in_array($boardKey, $visibleKeys, true)) {
                continue;
            }
            $pdo = Connection::get();
            $stmt = $pdo->prepare(
                "SELECT bp.id, bp.board_key, bp.post_key, bp.title, bp.description, bp.author_user_id,
                        bp.author_role, bp.meta_json, bp.status, bp.created_at, bp.updated_at
                 FROM board_posts bp
                 WHERE bp.board_key = ?
                   AND bp.status = 'published'
                   AND bp.created_at >= ?
                 ORDER BY bp.created_at DESC"
            );
            $stmt->execute([$boardKey, $monthStart]);
            $rows = $stmt->fetchAll();

            if ($rows === []) {
                $result[$boardKey] = [];
                continue;
            }

            $postIds = array_map(fn ($r) => (int) $r['id'], $rows);
            $reactAgg = $this->reactionRepo->aggregateForPosts($postIds);
            $commentCounts = $this->bulkCommentCounts($postIds);

            $items = [];
            foreach ($rows as $row) {
                $pid = (int) $row['id'];
                $agg = $reactAgg[$pid] ?? ['empathy' => 0, 'helpful' => 0, 'cheer' => 0, 'score' => 0];
                $total = $agg['empathy'] + $agg['helpful'] + $agg['cheer'];
                if ($total < 5) {
                    continue;
                }
                $items[] = [
                    'row' => $row,
                    'reactions' => $agg,
                    'commentCount' => $commentCounts[$pid] ?? 0,
                    'score' => $agg['score'],
                    'totalReactions' => $total,
                ];
            }

            usort($items, fn ($a, $b) => $b['totalReactions'] <=> $a['totalReactions'] ?: $b['score'] <=> $a['score']);
            $items = array_slice($items, 0, 3);

            $isTitleOnly = $isGuest || isset($titleOnlySet[$boardKey]);
            $result[$boardKey] = array_map(
                fn ($item) => $this->mapHotItem($item, $isTitleOnly, $userId),
                $items,
            );
        }

        return $result;
    }

    /**
     * 방별 최신 글(읽을 수 있는 방은 목록 항목, 제목만 방은 제목 항목). 방마다 최대 $limit개, 전체는 최신순.
     *
     * @return list<array<string, mixed>>
     */
    public function listLatest(?array $auth = null, int $limit = 3): array
    {
        $limit = max(1, min(self::LATEST_LIMIT_MAX, $limit));
        $boardRole = $auth !== null ? BoardChannelAcl::boardRoleFromAuth($auth) : 'guest';
        $isGuest = $boardRole === 'guest';
        $userId = $isGuest ? null : (int) ($auth['user_id'] ?? 0);

        $titleOnlySet = [];
        $visibleKeys = [];
        foreach (self::CONCERN_BOARD_KEYS as $k) {
            if (self::isHiddenFromFeed($k, $boardRole)) {
                continue;
            }
            if (BoardChannelAcl::canList($k, $boardRole)) {
                $visibleKeys[] = $k;
            } elseif (BoardChannelAcl::canDiscover($k, $boardRole)) {
                $visibleKeys[] = $k;
                $titleOnlySet[$k] = true;
            }
        }
        if ($visibleKeys === []) {
            return [];
        }

        $pdo = Connection::get();
        $stmt = $pdo->prepare(
            "SELECT bp.id, bp.board_key, bp.post_key, bp.title, bp.description, bp.author_user_id,
                    bp.author_role, bp.meta_json, bp.status, bp.created_at, bp.updated_at
             FROM board_posts bp
             WHERE bp.board_key = ?
               AND bp.status = 'published'
             ORDER BY bp.created_at DESC, bp.id DESC
             LIMIT {$limit}"
        );
        $rows = [];
        foreach ($visibleKeys as $boardKey) {
            $stmt->execute([$boardKey]);
            foreach ($stmt->fetchAll() as $row) {
                $rows[] = $row;
            }
        }
        if ($rows === []) {
            return [];
        }
        usort(
            $rows,
            fn ($a, $b) => strcmp((string) $b['created_at'], (string) $a['created_at']) ?: (int) $b['id'] <=> (int) $a['id'],
        );

        $postIds = array_map(fn ($r) => (int) $r['id'], $rows);
        $reactAgg = $this->reactionRepo->aggregateForPosts($postIds);
        $commentCounts = $this->bulkCommentCounts($postIds);

        return array_map(function (array $row) use ($reactAgg, $commentCounts, $titleOnlySet, $isGuest, $userId) {
            $pid = (int) $row['id'];
            $item = [
                'row' => $row,
                'reactions' => $reactAgg[$pid] ?? self::EMPTY_AGG,
                'commentCount' => $commentCounts[$pid] ?? 0,
            ];

            return $this->mapHotItem($item, $isGuest || isset($titleOnlySet[(string) $row['board_key']]), $userId);
        }, $rows);
    }

    // ─── 응답 항목 매퍼 (목록·단건·HOT·BEST 공통 필드명) ───

    /**
     * 제목 목록 항목(canList=false 호출자). 본문·작성자·authorUserId·meta·myReaction 절대 포함하지 않는다.
     * 필드: id, boardKey, boardLabel, title, type, createdAt, reactionTotal, commentCount
     *
     * @param array<string, mixed> $row board_posts 행
     * @param array<string, int> $agg
     * @return array<string, mixed>
     */
    private function mapTitleOnly(array $row, array $agg, int $commentCount): array
    {
        $boardKey = (string) $row['board_key'];

        return [
            'id' => (string) $row['post_key'],
            'boardKey' => $boardKey,
            'boardLabel' => BoardChannelAcl::channelIntro($boardKey)['title'],
            'title' => (string) $row['title'],
            'type' => self::postTypeOf($row),
            'createdAt' => self::isoTime((string) $row['created_at']),
            'reactionTotal' => self::reactionTotalOf($agg),
            'commentCount' => $commentCount,
        ];
    }

    /**
     * 전체 목록 항목(canList=true 호출자). mapTitleOnly 필드 + 본문·작성자·반응 상세.
     *
     * @param array<string, mixed> $row board_posts 행
     * @param array<string, int> $agg
     * @return array<string, mixed>
     */
    private function mapListItem(array $row, array $agg, int $commentCount, ?string $myReaction): array
    {
        $meta = self::decodeMeta($row);
        $createdAt = self::isoTime((string) $row['created_at']);
        $editedAt = isset($meta['editedAt']) ? (string) $meta['editedAt'] : '';

        return $this->mapTitleOnly($row, $agg, $commentCount) + [
            '_numericId' => (int) $row['id'],
            'description' => (string) ($row['description'] ?? ''),
            'status' => (string) ($row['status'] ?? ''),
            'authorRole' => (string) ($row['author_role'] ?? ''),
            'authorDisplayName' => (string) ($meta['authorDisplayName'] ?? ''),
            'authorUserId' => (int) ($row['author_user_id'] ?? 0),
            'reactions' => $agg,
            'myReaction' => $myReaction,
            'score' => (int) ($agg['score'] ?? 0),
            'updatedAt' => $editedAt !== '' ? self::isoTime($editedAt) : $createdAt,
            'edited' => $editedAt !== '',
        ];
    }

    /** HOT·BEST 항목. 목록과 같은 매퍼를 쓴다. */
    private function mapHotItem(array $item, bool $titleOnly, ?int $userId): array
    {
        $row = $item['row'];
        $agg = $item['reactions'];
        $commentCount = (int) ($item['commentCount'] ?? 0);
        if ($titleOnly) {
            return $this->mapTitleOnly($row, $agg, $commentCount);
        }
        $myReaction = ($userId !== null && $userId > 0)
            ? $this->reactionRepo->myReactionForPost((int) $row['id'], $userId)
            : null;

        return $this->mapListItem($row, $agg, $commentCount, $myReaction);
    }

    /** @return array<string, mixed> */
    private static function decodeMeta(array $row): array
    {
        $meta = json_decode((string) ($row['meta_json'] ?? ''), true);

        return is_array($meta) ? $meta : [];
    }

    private static function postTypeOf(array $row): string
    {
        $type = self::decodeMeta($row)['type'] ?? null;

        return is_string($type) && in_array($type, self::POST_TYPES, true) ? $type : self::DEFAULT_POST_TYPE;
    }

    private static function assertPostType(string $type): string
    {
        $type = trim($type);
        if (!in_array($type, self::POST_TYPES, true)) {
            throw new InvalidArgumentException('글 종류는 고민 · 조언 · 해결 · 부탁 중에서 골라 주세요.');
        }

        return $type;
    }

    /** @param array<string, int> $agg */
    private static function reactionTotalOf(array $agg): int
    {
        return (int) ($agg['empathy'] ?? 0) + (int) ($agg['helpful'] ?? 0) + (int) ($agg['cheer'] ?? 0);
    }

    /** DB DATETIME → 'YYYY-MM-DDTHH:MM:SS' (브라우저 Date 파싱용) */
    private static function isoTime(string $value): string
    {
        $value = substr(trim($value), 0, 19);

        return $value === '' ? '' : str_replace(' ', 'T', $value);
    }

    // ─── 내부 헬퍼 ───

    private function assertConcernBoard(string $boardKey): void
    {
        if (!in_array($boardKey, self::CONCERN_BOARD_KEYS, true)) {
            throw new InvalidArgumentException('고민방 게시판이 아닙니다.');
        }
    }

    /** @return array<string, mixed> */
    private function findPostById(int $id): array
    {
        $post = $this->postRepo->findByNumericId($id);
        if ($post === null || (string) ($post['status'] ?? '') === 'deleted') {
            throw new InvalidArgumentException('게시물을 찾을 수 없습니다.');
        }

        return $post;
    }

    private static function isHiddenFromFeed(string $boardKey, string $boardRole): bool
    {
        return $boardRole === 'demand' && in_array($boardKey, self::DEMAND_HIDDEN_FEED_KEYS, true);
    }

    /**
     * 글 접근 검사: published만 허용 + canList 검사.
     * 댓글 목록·댓글 작성·반응·신고 공통 게이트.
     *
     * @return array<string, mixed>
     */
    private function assertPostAccessible(int $postId, ?array $auth): array
    {
        $post = $this->postRepo->findByNumericId($postId);
        if ($post === null) {
            throw new InvalidArgumentException('게시물을 찾을 수 없습니다.');
        }
        $status = (string) ($post['status'] ?? '');
        if ($status !== 'published') {
            throw new InvalidArgumentException('게시물을 찾을 수 없습니다.');
        }
        $boardKey = (string) $post['board_key'];
        $this->assertConcernBoard($boardKey);

        $boardRole = $auth !== null ? BoardChannelAcl::boardRoleFromAuth($auth) : 'guest';
        if (!BoardChannelAcl::canList($boardKey, $boardRole)) {
            throw new BoardAccessException(
                $auth === null ? 401 : 403,
                $auth === null ? 'unauthorized' : 'forbidden',
                $auth === null ? '로그인이 필요합니다.' : '이 게시판을 볼 권한이 없습니다.',
            );
        }

        return $post;
    }

    /** @return array<string, mixed> */
    private function resolvePost(string $boardKey, string $postKey): array
    {
        $post = ctype_digit($postKey)
            ? $this->postRepo->findByNumericId((int) $postKey)
            : $this->postRepo->findByKey($boardKey, $postKey);

        if ($post === null) {
            throw new InvalidArgumentException('게시물을 찾을 수 없습니다.');
        }
        if ((string) $post['status'] === 'deleted') {
            throw new InvalidArgumentException('삭제된 게시물입니다.');
        }
        $actualKey = BoardChannelAcl::normalizeBoardKey((string) $post['board_key']);
        if ($boardKey !== '' && $boardKey !== $actualKey) {
            throw new BoardAccessException(403, 'forbidden', '요청 게시판과 실제 게시글 채널이 다릅니다.');
        }

        return $post;
    }

    private function assertPostOwnership(array $existing, int $userId): void
    {
        $ownerId = (int) ($existing['author_user_id'] ?? 0);
        if ($ownerId <= 0 || $ownerId !== $userId) {
            throw new BoardAccessException(403, 'forbidden', '작성자만 수정·삭제할 수 있습니다.');
        }
    }

    /** @return array<string, mixed> */
    private function mapComment(array $row, ?int $currentUserId): array
    {
        $status = (string) $row['status'];
        $commentId = (int) $row['id'];

        $isDeleted = $status === 'deleted';
        $isHidden = $status === 'hidden';

        $reactionAgg = $this->reactionRepo->aggregateForComment($commentId);
        $myReaction = ($currentUserId !== null && $currentUserId > 0)
            ? $this->reactionRepo->myReactionForComment($commentId, $currentUserId)
            : null;

        return [
            'id' => $commentId,
            'postId' => (int) $row['post_id'],
            'parentCommentId' => $row['parent_comment_id'] !== null ? (int) $row['parent_comment_id'] : null,
            'authorUserId' => (int) $row['author_user_id'],
            'authorRole' => (string) $row['author_role'],
            'authorDisplayName' => $isDeleted ? '' : ($isHidden ? '' : (string) $row['author_display_name']),
            'body' => $isDeleted ? '삭제된 댓글입니다.' : ($isHidden ? '신고가 여러 건 접수되어 가려진 댓글입니다.' : (string) $row['body']),
            'status' => $status,
            'reactions' => $reactionAgg,
            'myReaction' => $myReaction,
            'createdAt' => (string) $row['created_at'],
        ];
    }

    /** @return array<int, int> */
    private function bulkCommentCounts(array $postIds): array
    {
        if ($postIds === []) {
            return [];
        }
        $pdo = Connection::get();
        $placeholders = implode(',', array_fill(0, count($postIds), '?'));
        $stmt = $pdo->prepare(
            "SELECT post_id, COUNT(*) AS cnt FROM board_post_comments
             WHERE post_id IN ({$placeholders}) AND status = 'visible'
             GROUP BY post_id"
        );
        $stmt->execute($postIds);
        $result = [];
        while ($row = $stmt->fetch()) {
            $result[(int) $row['post_id']] = (int) $row['cnt'];
        }

        return $result;
    }

    /**
     * 제어문자·널바이트 제거. 줄바꿈(\n)·탭(\t)은 허용.
     * htmlspecialchars는 하지 않는다 — 출력 이스케이프는 화면(9c)의 esc() 담당.
     */
    private function sanitize(string $value): string
    {
        return (string) preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $value);
    }

    private function normalizeLineBreaks(string $value): string
    {
        return str_replace(["\r\n", "\r"], "\n", $value);
    }
}
