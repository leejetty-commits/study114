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

    /** @return list<array<string, mixed>> */
    public function list(string $boardKey, ?string $authorRole = null, ?string $postKey = null): array
    {
        $this->assertBoardKey($boardKey);
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

        return array_map(fn (array $row) => $this->mapPost($row), $rows);
    }

    /** @param array<string, mixed> $input */
    public function save(array $input): array
    {
        $boardKey = trim((string) ($input['board_key'] ?? $input['boardKey'] ?? ''));
        $this->assertBoardKey($boardKey);

        if ($this->isOperationalBoard($boardKey)) {
            return $this->saveOperational($input, $boardKey);
        }

        if ($boardKey !== 'submission') {
            throw new InvalidArgumentException('현재 쓰기는 submission·운영형 채널만 지원합니다.');
        }

        return $this->saveSubmission($input, $boardKey);
    }

    public function delete(string $boardKey, string $postKey, string $authorRole): void
    {
        $this->assertBoardKey($boardKey);
        $this->assertAuthorRole($authorRole);

        if ($this->isOperationalBoard($boardKey)) {
            if ($authorRole !== 'admin') {
                throw new InvalidArgumentException('운영형 채널 삭제는 admin만 허용됩니다.');
            }
            $existing = $this->repo->findByKey($boardKey, $postKey);
            if ($existing === null) {
                throw new InvalidArgumentException('게시물을 찾을 수 없습니다.');
            }
            $this->repo->delete($boardKey, $postKey);

            return;
        }

        if ($boardKey !== 'submission') {
            throw new InvalidArgumentException('현재 삭제는 submission·운영형 채널만 지원합니다.');
        }

        $existing = $this->repo->findByKey($boardKey, $postKey);
        if ($existing === null) {
            throw new InvalidArgumentException('게시물을 찾을 수 없습니다.');
        }
        if ((string) $existing['author_role'] !== $authorRole) {
            throw new InvalidArgumentException('작성자 역할이 일치하지 않습니다.');
        }
        $status = (string) $existing['status'];
        if ($status !== 'draft' && $status !== 'submitted') {
            throw new InvalidArgumentException('삭제할 수 없는 상태입니다.');
        }

        $this->attachments->deleteForPost($boardKey, $postKey);
        $this->repo->delete($boardKey, $postKey);
    }

    /** @param array<string, mixed> $input */
    private function saveSubmission(array $input, string $boardKey): array
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
        if ($boardKey === '' || !in_array($boardKey, self::ALLOWED_BOARD_KEYS, true)) {
            throw new InvalidArgumentException('유효하지 않은 board_key입니다.');
        }
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

        return $base + [
            'slug' => $slug,
            'priority' => (string) ($meta['priority'] ?? $row['category_id'] ?? 'primary'),
            'audience' => (string) ($meta['audience'] ?? $row['description'] ?? '전체'),
            'body' => $body,
            'checklist' => $checklist,
        ];
    }
}
