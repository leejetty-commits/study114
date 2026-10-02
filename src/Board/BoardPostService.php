<?php

declare(strict_types=1);

namespace Study114\Board;

use InvalidArgumentException;
use Study114\Database\Connection;

final class BoardPostService
{
    private const TARGET_ROLE_LABELS = [
        'all' => '전체',
        'study_room' => '공부방',
        'tutor' => '과외쌤',
        'student' => '학생',
    ];

    /** @var list<string> */
    private const ALLOWED_BOARD_KEYS = [
        'notice',
        'faq',
        'safe-guide',
        'library',
        'library-template',
        'library-guide-pdf',
        'submission',
        'concern-director',
        'concern-tutor',
        'concern-parent',
        'concern-solved',
        'info-room',
        'info-tutor',
        'info-student',
    ];

    /** @var list<string> */
    private const OPERATIONAL_BOARD_KEYS = ['notice', 'faq', 'safe-guide'];

    /** @var list<string> */
    private const AUTHOR_ROLES = ['guest', 'parent', 'study_room', 'tutor', 'admin', 'system'];

    private BoardPostRepository $repo;
    private BoardAttachmentService $attachments;
    private ?InfoBoardService $info;

    public function __construct(
        ?BoardPostRepository $repo = null,
        ?BoardAttachmentService $attachments = null,
        ?InfoBoardService $info = null,
    ) {
        $this->repo = $repo ?? new BoardPostRepository(Connection::get());
        $this->attachments = $attachments ?? new BoardAttachmentService($this->repo);
        $this->info = $info;
    }

    private function infoService(): InfoBoardService
    {
        return $this->info ??= new InfoBoardService();
    }

    /**
     * @param string|null $viewMode  null=전체(관리자), 'center'=고객센터, 'home'=홈 3줄
     * @param int|null    $limit     home 뷰일 때 최대 건수
     * @param array{sort: string, type: string|null, limit: int, offset: int}|null $concernQuery 고민방 정렬·종류·페이징
     * @param array{category: string|null, limit: int, offset: int}|null $infoQuery 정보 게시판 분류·페이징
     * @return array<string, mixed> posts·access·intro (+ 고민방이면 total·limit·offset·sort·type·hasMore)
     */
    public function list(
        string $boardKey,
        ?string $authorRole = null,
        ?string $postKey = null,
        ?array $auth = null,
        ?string $viewMode = null,
        ?int $limit = null,
        ?array $concernQuery = null,
        ?array $infoQuery = null,
    ): array {
        $boardKey = BoardChannelAcl::normalizeBoardKey($boardKey);
        $this->assertBoardKey($boardKey);
        if (BoardChannelAcl::isInfoBoard($boardKey)) {
            return $this->infoService()->list($boardKey, $auth, $postKey, $infoQuery);
        }
        $boardRole = BoardChannelAcl::boardRoleFromAuth($auth);
        $access = BoardChannelAcl::accessKind($boardKey, $boardRole);

        if ($access === 'blocked') {
            throw new BoardAccessException(
                $auth === null ? 401 : 403,
                $auth === null ? 'unauthorized' : 'forbidden',
                $auth === null ? '로그인이 필요합니다.' : '이 게시판을 볼 권한이 없습니다.',
            );
        }

        $isConcern = BoardChannelAcl::isConcern($boardKey);
        if ($isConcern && $concernQuery === null) {
            $concernQuery = ConcernService::parseListQuery(null, null, null, null);
        }

        if ($access === 'titles' && $isConcern) {
            return $this->listConcernTitles($boardKey, $boardRole, $postKey, $concernQuery);
        }

        if ($access === 'intro' || !BoardChannelAcl::canList($boardKey, $boardRole)) {
            return [
                'posts' => [],
                'access' => 'intro',
                'intro' => BoardChannelAcl::introPayload($boardKey, $boardRole),
            ];
        }

        if ($authorRole !== null && $authorRole !== '') {
            $this->assertAuthorRole($authorRole);
        }

        if ($isConcern) {
            $isAdmin = $auth !== null
                && (($auth['role_type'] ?? '') === 'admin' || !empty($auth['admin_level']));
            $currentUserId = $auth !== null ? (int) ($auth['user_id'] ?? 0) : null;
            $page = (new ConcernService())->listPage(
                $boardKey,
                $isAdmin ? ['published', 'hidden'] : ['published'],
                $postKey,
                $concernQuery,
                $currentUserId,
                false,
            );

            return $page + ['access' => 'full', 'intro' => null];
        }

        $rows = $this->repo->listByBoard($boardKey, $authorRole, $postKey);
        if ($this->isOperationalBoard($boardKey)) {
            $rows = array_values(array_filter(
                $rows,
                static fn (array $row): bool => (string) ($row['status'] ?? '') === 'published',
            ));
        }

        $posts = array_map(fn (array $row): array => $this->mapPost($row), $rows);

        if ($boardKey === 'notice') {
            $effectiveView = $viewMode;
            if ($effectiveView === null) {
                $isAdmin = $auth !== null
                    && (($auth['role_type'] ?? '') === 'admin' || !empty($auth['admin_level']));
                $effectiveView = $isAdmin ? null : 'center';
            }
            if ($effectiveView !== null) {
                $posts = $this->filterNoticesByRole($posts, $auth, $effectiveView);
                if ($limit !== null && $limit > 0) {
                    $posts = array_slice($posts, 0, $limit);
                }
            }
        }

        return [
            'posts' => $posts,
            'access' => 'full',
            'intro' => null,
        ];
    }

    /**
     * 세션 역할 기반 공지 필터.
     * center: 공부방·과외쌤·관리자→전부, 학생/학부모→all+student, 게스트→all.
     * home:   공부방→all+study_room, 과외쌤→all+tutor, 학부모→all+student, 게스트→all, 관리자→전부.
     *
     * @param list<array<string, mixed>> $posts
     * @return list<array<string, mixed>>
     */
    private function filterNoticesByRole(array $posts, ?array $auth, string $viewMode): array
    {
        $navRole = $this->noticeNavRole($auth);

        if ($viewMode === 'center') {
            $allowed = match ($navRole) {
                'admin', 'study_room', 'tutor' => null,
                'parent'                       => ['all', 'student'],
                default                        => ['all'],
            };
        } else {
            $allowed = match ($navRole) {
                'admin'      => null,
                'study_room' => ['all', 'study_room'],
                'tutor'      => ['all', 'tutor'],
                'parent'     => ['all', 'student'],
                default      => ['all'],
            };
        }

        if ($allowed === null) {
            return $posts;
        }

        $set = array_flip($allowed);
        return array_values(array_filter(
            $posts,
            static fn (array $p): bool => isset($set[$p['targetRole'] ?? 'all']),
        ));
    }

    /** @param array<string, mixed> $input */
    public function save(array $input, ?array $auth = null): array
    {
        $requestedKey = BoardChannelAcl::normalizeBoardKey(trim((string) ($input['board_key'] ?? $input['boardKey'] ?? '')));
        $postKey = isset($input['post_key']) ? trim((string) $input['post_key']) : (isset($input['id']) ? trim((string) $input['id']) : '');
        $existing = $this->resolveExistingPost($requestedKey, $postKey);

        if ($existing !== null) {
            $boardKey = BoardChannelAcl::normalizeBoardKey((string) $existing['board_key']);
            if ($requestedKey !== '' && $requestedKey !== $boardKey) {
                throw new BoardAccessException(403, 'forbidden', '요청 게시판과 실제 게시글 채널이 다릅니다.');
            }
        } else {
            $boardKey = $requestedKey;
        }

        $this->assertBoardKey($boardKey);
        $boardRole = BoardChannelAcl::boardRoleFromAuth($auth);

        if (BoardChannelAcl::isInfoBoard($boardKey)) {
            $input['board_key'] = $boardKey;
            if ($existing !== null) {
                $input['post_key'] = (string) $existing['post_key'];
            }

            return $this->infoService()->save($input, $auth);
        }

        if ($this->isOperationalBoard($boardKey)) {
            if ($auth === null) {
                throw new BoardAccessException(401, 'unauthorized', '로그인이 필요합니다.');
            }
            $isAdmin = ($auth['role_type'] ?? '') === 'admin' || !empty($auth['admin_level']);
            if (!$isAdmin && !BoardChannelAcl::canCompose($boardKey, $boardRole)) {
                throw new BoardAccessException(403, 'forbidden', '운영형 채널 쓰기는 운영자만 허용됩니다.');
            }
            $input['author_role'] = 'admin';
            $input['board_key'] = $boardKey;
            $input['post_key'] = $existing !== null ? (string) $existing['post_key'] : ($postKey !== '' ? $postKey : null);

            return $this->saveOperational($input, $boardKey);
        }

        if ($boardKey === 'submission') {
            if ($auth === null) {
                throw new BoardAccessException(401, 'unauthorized', '로그인이 필요합니다.');
            }
            if (!BoardChannelAcl::canCompose($boardKey, $boardRole)) {
                throw new BoardAccessException(403, 'forbidden', '제출함은 과외쌤만 이용할 수 있습니다.');
            }
            $sessionNav = $this->navRoleFromAuth($auth);
            if ($existing !== null) {
                $this->assertExistingPostOwnership($existing, $auth, $sessionNav);
            }
            $input['author_role'] = $sessionNav;
            $input['board_key'] = $boardKey;
            if ($existing !== null) {
                $input['post_key'] = (string) $existing['post_key'];
            }

            return $this->saveSubmission($input, $boardKey, $auth);
        }

        if ($auth === null) {
            throw new BoardAccessException(401, 'unauthorized', '로그인이 필요합니다.');
        }
        if (!BoardChannelAcl::canCompose($boardKey, $boardRole)) {
            throw new BoardAccessException(403, 'forbidden', '이 게시판에 글을 쓸 권한이 없습니다.');
        }

        if (BoardChannelAcl::isConcern($boardKey)) {
            $concernService = new ConcernService();
            return $concernService->savePost($input, $auth);
        }

        throw new InvalidArgumentException('현재 쓰기는 submission·운영형·고민방 채널만 지원합니다.');
    }

    public function delete(string $boardKey, string $postKey, string $authorRole, ?array $auth = null): void
    {
        $requestedKey = BoardChannelAcl::normalizeBoardKey($boardKey);
        if ($auth === null) {
            throw new BoardAccessException(401, 'unauthorized', '로그인이 필요합니다.');
        }
        $existing = $this->resolveExistingPost($requestedKey, $postKey);
        if ($existing === null) {
            throw new InvalidArgumentException('게시물을 찾을 수 없습니다.');
        }
        $actualKey = BoardChannelAcl::normalizeBoardKey((string) $existing['board_key']);
        if ($requestedKey !== '' && $requestedKey !== $actualKey) {
            throw new BoardAccessException(403, 'forbidden', '요청 게시판과 실제 게시글 채널이 다릅니다.');
        }
        $this->assertBoardKey($actualKey);
        if (BoardChannelAcl::isInfoBoard($actualKey)) {
            $this->infoService()->delete($actualKey, (string) $existing['post_key'], $auth);

            return;
        }
        if (!BoardChannelAcl::canDelete($actualKey, BoardChannelAcl::boardRoleFromAuth($auth))) {
            throw new BoardAccessException(403, 'forbidden', '이 게시판에서 삭제할 권한이 없습니다.');
        }
        $sessionNav = $this->navRoleFromAuth($auth);
        $actualPostKey = (string) $existing['post_key'];

        if ($this->isOperationalBoard($actualKey)) {
            $isAdmin = ($auth['role_type'] ?? '') === 'admin' || !empty($auth['admin_level']);
            if (!$isAdmin) {
                throw new BoardAccessException(403, 'forbidden', '운영형 채널 삭제는 admin만 허용됩니다.');
            }
            $this->repo->delete($actualKey, $actualPostKey);

            return;
        }

        if (BoardChannelAcl::isConcern($actualKey)) {
            $concernService = new ConcernService();
            $concernService->deletePost($actualKey, $actualPostKey, $auth);
            return;
        }

        if ($actualKey !== 'submission') {
            throw new InvalidArgumentException('현재 삭제는 submission·운영형·고민방 채널만 지원합니다.');
        }
        $authorRole = $sessionNav;
        $this->assertAuthorRole($authorRole);
        $this->assertExistingPostOwnership($existing, $auth, $authorRole);
        $status = (string) $existing['status'];
        if ($status !== 'draft' && $status !== 'submitted') {
            throw new InvalidArgumentException('삭제할 수 없는 상태입니다.');
        }

        $this->attachments->deleteForPost($actualKey, $actualPostKey);
        $this->repo->delete($actualKey, $actualPostKey);
    }

    /**
     * 요청 board_key 가 아니라 DB 행의 실제 채널을 찾는다.
     *
     * @return array<string, mixed>|null
     */
    private function resolveExistingPost(string $requestedBoardKey, string $postKey): ?array
    {
        if ($postKey === '') {
            return null;
        }
        if (ctype_digit($postKey)) {
            $byId = $this->repo->findByNumericId((int) $postKey);
            if ($byId !== null) {
                return $byId;
            }
        }
        $rows = $this->repo->findAllByPostKey($postKey);
        if ($rows === []) {
            return null;
        }
        if (count($rows) > 1) {
            throw new BoardAccessException(409, 'conflict', '동일한 post_key가 여러 채널에 있습니다.');
        }
        $row = $rows[0];
        $actual = BoardChannelAcl::normalizeBoardKey((string) $row['board_key']);
        if ($requestedBoardKey !== '' && $requestedBoardKey !== $actual) {
            throw new BoardAccessException(403, 'forbidden', '요청 게시판과 실제 게시글 채널이 다릅니다.');
        }

        return $row;
    }

    /**
     * 기존 글 소유권. admin 만 예외.
     * author_user_id 가 없는 레거시 글은 소유자를 확정할 수 없으므로 일반 사용자에게 fail-closed.
     * 같은 역할이라는 이유로 남의 글을 수정·삭제하게 두지 않는다. 추측 backfill 도 하지 않는다.
     *
     * @param array<string, mixed> $existing
     * @param array{role_type?: string, user_id?: int|string, id?: int|string, admin_level?: mixed} $auth
     */
    private function assertExistingPostOwnership(array $existing, array $auth, string $navRole): void
    {
        unset($navRole);
        $isAdmin = ($auth['role_type'] ?? '') === 'admin' || !empty($auth['admin_level']);
        if ($isAdmin) {
            return;
        }
        $ownerId = (int) ($existing['author_user_id'] ?? 0);
        if ($ownerId <= 0) {
            throw new BoardAccessException(
                403,
                'forbidden',
                '작성자 정보가 없는 글입니다. 운영자에게 문의해 주세요.',
            );
        }
        $sessionId = (int) ($auth['user_id'] ?? $auth['id'] ?? 0);
        if ($sessionId <= 0 || $ownerId !== $sessionId) {
            throw new BoardAccessException(403, 'forbidden', '작성자만 수정·삭제할 수 있습니다.');
        }
    }

    /** @param array{role_type?: string} $auth */
    private function navRoleFromAuth(array $auth): string
    {
        $roleType = (string) ($auth['role_type'] ?? '');
        if ($roleType === 'guardian_student' || $roleType === 'parent' || $roleType === 'student') {
            return 'parent';
        }
        if ($roleType === 'study_room_owner' || $roleType === 'study_room') {
            return 'study_room';
        }
        if ($roleType === 'tutor') {
            return 'tutor';
        }
        if ($roleType === 'admin') {
            return 'admin';
        }

        return 'guest';
    }

    /**
     * 공지 필터 전용 역할 판별.
     * 비로그인(null)·이메일 미인증(빈 auth)·알 수 없는 role_type → 'guest'.
     * navRoleFromAuth()와 달리 submission 경로에 쓰이지 않는다.
     */
    private function noticeNavRole(?array $auth): string
    {
        if ($auth === null || $auth === []) {
            return 'guest';
        }
        $roleType = (string) ($auth['role_type'] ?? '');
        return match ($roleType) {
            'guardian_student', 'parent', 'student' => 'parent',
            'study_room_owner', 'study_room'        => 'study_room',
            'tutor'                                  => 'tutor',
            'admin'                                  => 'admin',
            default                                  => 'guest',
        };
    }

    /** @param array<string, mixed> $input @param array{user_id?: int|string}|null $auth */
    private function saveSubmission(array $input, string $boardKey, ?array $auth = null): array
    {
        $postKey = isset($input['post_key']) ? trim((string) $input['post_key']) : (isset($input['id']) ? trim((string) $input['id']) : null);
        $authorRole = trim((string) ($input['author_role'] ?? $input['authorRole'] ?? ''));
        $this->assertAuthorRole($authorRole);

        $status = trim((string) ($input['status'] ?? 'draft'));
        if (!in_array($status, ['draft', 'submitted'], true)) {
            throw new InvalidArgumentException('status는 draft 또는 submitted만 허용됩니다.');
        }

        $title = trim((string) ($input['title'] ?? ''));
        if ($title === '') {
            throw new InvalidArgumentException('제목이 필요합니다.');
        }

        $description = trim((string) ($input['description'] ?? ''));
        $memo = trim((string) ($input['memo'] ?? ''));
        $categoryId = trim((string) ($input['category_id'] ?? $input['categoryId'] ?? ''));
        if ($categoryId === '') {
            throw new InvalidArgumentException('category_id가 필요합니다.');
        }
        $fileLabel = trim((string) ($input['file_label'] ?? $input['fileLabel'] ?? ''));
        if ($fileLabel === '' && $postKey !== null && $postKey !== '') {
            $existing = $this->repo->findByKey($boardKey, $postKey);
            $attachment = $existing ? $this->attachments->getPrimaryMeta($boardKey, $postKey) : null;
            if ($attachment !== null) {
                $fileLabel = (string) $attachment['originalName'];
            } elseif ($existing !== null) {
                $fileLabel = (string) ($existing['file_label'] ?? '');
            }
        }
        if ($fileLabel === '') {
            throw new InvalidArgumentException('file_label이 필요합니다.');
        }

        if ($postKey !== null && $postKey !== '') {
            $existing = $this->repo->findByKey($boardKey, $postKey);
            if ($existing === null) {
                throw new InvalidArgumentException('게시물을 찾을 수 없습니다.');
            }
            if ((string) $existing['author_role'] !== $authorRole) {
                throw new InvalidArgumentException('작성자 역할이 일치하지 않습니다.');
            }
            $prevStatus = (string) $existing['status'];
            if ($prevStatus !== 'draft' && $prevStatus !== 'submitted') {
                throw new InvalidArgumentException('수정할 수 없는 상태입니다.');
            }
        }

        return $this->mapPost($this->repo->save(
            $boardKey,
            $postKey,
            $authorRole,
            $status,
            $title,
            $description,
            $memo,
            $categoryId,
            $fileLabel,
            null,
            (int) ($auth['user_id'] ?? 0) > 0 ? (int) $auth['user_id'] : null,
        ));
    }

    /** @param array<string, mixed> $input */
    private function saveOperational(array $input, string $boardKey): array
    {
        $authorRole = trim((string) ($input['author_role'] ?? $input['authorRole'] ?? ''));
        if ($authorRole !== 'admin') {
            throw new InvalidArgumentException('운영형 채널 쓰기는 admin만 허용됩니다.');
        }

        $postKey = isset($input['post_key']) ? trim((string) $input['post_key']) : (isset($input['id']) ? trim((string) $input['id']) : null);
        $status = trim((string) ($input['status'] ?? 'published'));
        if (!in_array($status, ['draft', 'published', 'hidden'], true)) {
            throw new InvalidArgumentException('status는 draft · published · hidden만 허용됩니다.');
        }

        $title = trim((string) ($input['title'] ?? ''));
        if ($title === '') {
            throw new InvalidArgumentException('제목이 필요합니다.');
        }

        $description = trim((string) ($input['description'] ?? ''));
        $memo = trim((string) ($input['memo'] ?? ''));
        $categoryId = trim((string) ($input['category_id'] ?? $input['categoryId'] ?? 'general'));
        if ($categoryId === '') {
            $categoryId = 'general';
        }

        $meta = $this->buildOperationalMeta($boardKey, $input);

        if ($postKey !== null && $postKey !== '') {
            $existing = $this->repo->findByKey($boardKey, $postKey);
            // 시드 FAQ(faq-숫자)는 DB에 행이 없어도 그 post_key로 새로 만든다.
            // 그 외 보드·키는 없는 글을 지정하면 거절한다.
            $seedFaqInsert = $boardKey === 'faq'
                && $authorRole === 'admin'
                && preg_match('/^faq-[0-9]+$/', $postKey) === 1;
            if ($existing === null && !$seedFaqInsert) {
                throw new InvalidArgumentException('게시물을 찾을 수 없습니다.');
            }
        }

        return $this->mapPost($this->repo->save(
            $boardKey,
            $postKey,
            $authorRole,
            $status,
            $title,
            $description,
            $memo,
            $categoryId,
            '',
            $meta,
        ));
    }

    /** @param array<string, mixed> $input @return array<string, mixed> */
    private function buildOperationalMeta(string $boardKey, array $input): array
    {
        $metaInput = $input['meta'] ?? $input['meta_json'] ?? [];
        $meta = is_array($metaInput) ? $metaInput : [];

        if ($boardKey === 'notice') {
            $body = $input['body'] ?? $meta['body'] ?? [];
            if (is_string($body)) {
                $body = array_values(array_filter(array_map('trim', preg_split('/\r\n|\r|\n/', $body) ?: [])));
            }
            $targetRole = (string) ($input['target_role'] ?? $input['targetRole'] ?? $meta['targetRole'] ?? 'all');
            if (!isset(self::TARGET_ROLE_LABELS[$targetRole])) {
                $targetRole = 'all';
            }
            return [
                'body' => is_array($body) ? array_values(array_map('strval', $body)) : [],
                'displayDate' => (string) ($input['date'] ?? $input['displayDate'] ?? $meta['displayDate'] ?? date('Y-m-d')),
                'pinned' => (bool) ($input['pinned'] ?? $meta['pinned'] ?? false),
                'targetRole' => $targetRole,
            ];
        }

        if ($boardKey === 'faq') {
            $answer = trim((string) ($input['answer'] ?? $input['a'] ?? $meta['answer'] ?? $input['description'] ?? ''));
            return [
                'answer' => $answer,
                'sortOrder' => (int) ($input['sortOrder'] ?? $meta['sortOrder'] ?? 0),
            ];
        }

        if ($boardKey === 'safe-guide') {
            $body = $input['body'] ?? $meta['body'] ?? [];
            if (is_string($body)) {
                $body = array_values(array_filter(array_map('trim', preg_split('/\r\n|\r|\n/', $body) ?: [])));
            }
            $checklist = $input['checklist'] ?? $meta['checklist'] ?? [];
            return [
                'slug' => (string) ($input['slug'] ?? $meta['slug'] ?? $input['post_key'] ?? $input['id'] ?? ''),
                'priority' => (string) ($input['priority'] ?? $meta['priority'] ?? 'primary'),
                'audience' => (string) ($input['audience'] ?? $meta['audience'] ?? '전체'),
                'body' => is_array($body) ? array_values(array_map('strval', $body)) : [],
                'checklist' => is_array($checklist) ? $checklist : [],
            ];
        }

        return $meta;
    }

    /**
     * 고민방 제목만 보기: canList=false이지만 canDiscover=true인 호출자용.
     * description·authorDisplayName·authorUserId·meta·myReaction 절대 포함하지 않는다.
     * 정렬·종류 필터·페이징은 full 목록과 같다.
     *
     * @param array{sort: string, type: string|null, limit: int, offset: int} $concernQuery
     * @return array<string, mixed>
     */
    private function listConcernTitles(string $boardKey, string $boardRole, ?string $postKey, array $concernQuery): array
    {
        $page = (new ConcernService())->listPage($boardKey, ['published'], $postKey, $concernQuery, null, true);

        return $page + [
            'access' => 'titles',
            'intro' => BoardChannelAcl::introPayload($boardKey, $boardRole),
        ];
    }

    private function isOperationalBoard(string $boardKey): bool
    {
        return in_array($boardKey, self::OPERATIONAL_BOARD_KEYS, true);
    }

    private function assertBoardKey(string $boardKey): void
    {
        if ($boardKey === '') {
            throw new InvalidArgumentException('유효하지 않은 board_key입니다.');
        }
        if (in_array($boardKey, self::ALLOWED_BOARD_KEYS, true)) {
            return;
        }
        // 관리자가 추가한 커뮤니티(고민방) 채널: concern-*
        if (preg_match('/^concern-[a-z0-9]+(?:-[a-z0-9]+)*$/', $boardKey) === 1) {
            return;
        }
        throw new InvalidArgumentException('유효하지 않은 board_key입니다.');
    }

    private function assertAuthorRole(string $authorRole): void
    {
        if ($authorRole === '' || !in_array($authorRole, self::AUTHOR_ROLES, true)) {
            throw new InvalidArgumentException('유효하지 않은 author_role입니다.');
        }
    }

    /** @param array<string, mixed> $row @return array<string, mixed> */
    private function mapPost(array $row): array
    {
        $meta = json_decode((string) ($row['meta_json'] ?? ''), true);
        $meta = is_array($meta) ? $meta : [];

        $created = (string) $row['created_at'];
        $updated = (string) $row['updated_at'];

        $boardKey = (string) $row['board_key'];
        $postKey = (string) $row['post_key'];

        if ($this->isOperationalBoard($boardKey)) {
            return $this->mapOperationalPost($row, $meta, $created, $updated, $boardKey, $postKey);
        }

        $attachment = $boardKey === 'submission'
            ? $this->attachments->getPrimaryMeta($boardKey, $postKey)
            : null;

        return [
            'id' => $postKey,
            '_numericId' => (int) $row['id'],
            'boardKey' => $boardKey,
            'title' => (string) $row['title'],
            'description' => (string) ($row['description'] ?? ''),
            'memo' => (string) ($row['memo'] ?? ''),
            'internalMemo' => (string) ($row['internal_memo'] ?? ''),
            'categoryId' => (string) ($row['category_id'] ?? ''),
            'fileLabel' => (string) ($row['file_label'] ?? ''),
            'attachment' => $attachment,
            'hasAttachment' => $attachment !== null,
            'status' => (string) $row['status'],
            'authorRole' => (string) $row['author_role'],
            'authorUserId' => (int) ($row['author_user_id'] ?? 0),
            'meta' => $meta,
            'createdAt' => substr($created, 0, 10),
            'updatedAt' => substr($updated, 0, 10),
            'format' => isset($meta['format']) ? (string) $meta['format'] : null,
            'section' => isset($meta['section']) ? (string) $meta['section'] : null,
            'audience' => isset($meta['audience']) && is_array($meta['audience'])
                ? array_values(array_map('strval', $meta['audience']))
                : [],
        ];
    }

    /**
     * @param array<string, mixed> $row
     * @param array<string, mixed> $meta
     * @return array<string, mixed>
     */
    private function mapOperationalPost(
        array $row,
        array $meta,
        string $created,
        string $updated,
        string $boardKey,
        string $postKey,
    ): array {
        $base = [
            'id' => $postKey,
            'boardKey' => $boardKey,
            'title' => (string) $row['title'],
            'description' => (string) ($row['description'] ?? ''),
            'categoryId' => (string) ($row['category_id'] ?? ''),
            'status' => (string) $row['status'],
            'authorRole' => (string) $row['author_role'],
            'createdAt' => substr($created, 0, 10),
            'updatedAt' => substr($updated, 0, 10),
            'meta' => $meta,
        ];

        if ($boardKey === 'notice') {
            $displayDate = (string) ($meta['displayDate'] ?? substr($created, 0, 10));
            $body = isset($meta['body']) && is_array($meta['body'])
                ? array_values(array_map('strval', $meta['body']))
                : [];
            $targetRole = (string) ($meta['targetRole'] ?? 'all');

            return $base + [
                'date' => $displayDate,
                'body' => $body,
                'pinned' => (bool) ($meta['pinned'] ?? false),
                'targetRole' => $targetRole,
                'targetLabel' => self::TARGET_ROLE_LABELS[$targetRole] ?? '전체',
            ];
        }

        if ($boardKey === 'faq') {
            $answer = (string) ($meta['answer'] ?? $row['description'] ?? '');

            return $base + [
                'q' => (string) $row['title'],
                'a' => $answer,
                'answer' => $answer,
                'sortOrder' => (int) ($meta['sortOrder'] ?? 0),
            ];
        }

        $slug = (string) ($meta['slug'] ?? $postKey);
        $body = isset($meta['body']) && is_array($meta['body'])
            ? array_values(array_map('strval', $meta['body']))
            : [];
        $checklist = isset($meta['checklist']) && is_array($meta['checklist']) ? $meta['checklist'] : [];
        $related = isset($meta['related']) && is_array($meta['related'])
            ? array_values(array_map('strval', $meta['related']))
            : [];

        return $base + [
            'slug' => $slug,
            'priority' => (string) ($meta['priority'] ?? $row['category_id'] ?? 'primary'),
            'audience' => (string) ($meta['audience'] ?? $row['description'] ?? '전체'),
            'body' => $body,
            'checklist' => $checklist,
            'related' => $related,
        ];
    }
}
