<?php

declare(strict_types=1);

namespace Study114\Board;

use InvalidArgumentException;
use Study114\Database\Connection;

final class BoardPostService
{
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
    ];

    /** @var list<string> */
    private const OPERATIONAL_BOARD_KEYS = ['notice', 'faq', 'safe-guide'];

    /** @var list<string> */
    private const AUTHOR_ROLES = ['guest', 'parent', 'study_room', 'tutor', 'admin', 'system'];

    private BoardPostRepository $repo;
    private BoardAttachmentService $attachments;

    public function __construct(?BoardPostRepository $repo = null, ?BoardAttachmentService $attachments = null)
    {
        $this->repo = $repo ?? new BoardPostRepository(Connection::get());
        $this->attachments = $attachments ?? new BoardAttachmentService($this->repo);
    }

    /** @return array{posts: list<array<string, mixed>>, access: 'full'|'intro', intro: array<string, mixed>|null} */
    public function list(
        string $boardKey,
        ?string $authorRole = null,
        ?string $postKey = null,
        ?array $auth = null,
    ): array {
        $boardKey = BoardChannelAcl::normalizeBoardKey($boardKey);
        $this->assertBoardKey($boardKey);
        $boardRole = BoardChannelAcl::boardRoleFromAuth($auth);
        $access = BoardChannelAcl::accessKind($boardKey, $boardRole);

        if ($access === 'blocked') {
            throw new BoardAccessException(
                $auth === null ? 401 : 403,
                $auth === null ? 'unauthorized' : 'forbidden',
                $auth === null ? '로그인이 필요합니다.' : '이 게시판을 볼 권한이 없습니다.',
            );
        }

        if ($access === 'intro' || !BoardChannelAcl::canList($boardKey, $boardRole)) {
            // intro: 단건 ?id= / post_key 도 DB를 조회하지 않고 posts=[] 만 반환
            return [
                'posts' => [],
                'access' => 'intro',
                'intro' => BoardChannelAcl::introPayload($boardKey, $boardRole),
            ];
        }

        if ($authorRole !== null && $authorRole !== '') {
            $this->assertAuthorRole($authorRole);
        }

        $rows = $this->repo->listByBoard($boardKey, $authorRole, $postKey);
        if ($this->isOperationalBoard($boardKey)) {
            $rows = array_values(array_filter(
                $rows,
                static fn (array $row): bool => (string) ($row['status'] ?? '') === 'published',
            ));
        }

        return [
            'posts' => array_map(fn (array $row): array => $this->mapPost($row), $rows),
            'access' => 'full',
            'intro' => null,
        ];
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
        throw new InvalidArgumentException('현재 쓰기는 submission·운영형 채널만 지원합니다.');
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

        if ($actualKey !== 'submission') {
            throw new InvalidArgumentException('현재 삭제는 submission·운영형 채널만 지원합니다.');
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

        return 'parent';
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
            if ($existing === null) {
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
            return [
                'body' => is_array($body) ? array_values(array_map('strval', $body)) : [],
                'displayDate' => (string) ($input['date'] ?? $input['displayDate'] ?? $meta['displayDate'] ?? date('Y-m-d')),
                'pinned' => (bool) ($input['pinned'] ?? $meta['pinned'] ?? false),
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

            return $base + [
                'date' => $displayDate,
                'body' => $body,
                'pinned' => (bool) ($meta['pinned'] ?? false),
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
