<?php

declare(strict_types=1);

namespace Study114\Admin;

use InvalidArgumentException;
use Study114\Board\BoardAttachmentService;
use Study114\Board\BoardPostRepository;
use Study114\Database\Connection;

final class AdminSubmissionQueueService
{
    private const BOARD_KEY = 'submission';

    private BoardPostRepository $posts;
    private AdminOperationLogRepository $logs;
    private BoardAttachmentService $attachments;

    public function __construct(
        ?BoardPostRepository $posts = null,
        ?AdminOperationLogRepository $logs = null,
        ?BoardAttachmentService $attachments = null,
    ) {
        $pdo = Connection::get();
        $this->posts = $posts ?? new BoardPostRepository($pdo);
        $this->logs = $logs ?? new AdminOperationLogRepository($pdo);
        $this->attachments = $attachments ?? new BoardAttachmentService($this->posts);
    }

    /** @return list<array<string, mixed>> */
    public function listQueue(?string $status = 'submitted'): array
    {
        $status = $status !== null && $status !== '' ? $status : 'submitted';
        $rows = $this->posts->listSubmissionQueue(self::BOARD_KEY, $status);

        return array_map(fn (array $row) => $this->mapQueueItem($row), $rows);
    }

    /** @param array<string, mixed> $input */
    public function applyAction(array $input, string $operatorId): array
    {
        $postKey = trim((string) ($input['id'] ?? $input['post_key'] ?? ''));
        $action = trim((string) ($input['action'] ?? ''));
        $operatorId = trim($operatorId);
        $internalMemo = trim((string) ($input['internal_memo'] ?? $input['internalMemo'] ?? ''));
        $reasonCategory = trim((string) ($input['reason_category'] ?? $input['reasonCategory'] ?? 'internal_review'));

        if ($postKey === '') {
            throw new InvalidArgumentException('id가 필요합니다.');
        }
        if ($operatorId === '') {
            throw new InvalidArgumentException('operator_id가 필요합니다.');
        }

        $nextStatus = match ($action) {
            'expose', 'publish' => 'published',
            'hide' => 'hidden',
            default => throw new InvalidArgumentException('action은 expose 또는 hide만 허용됩니다.'),
        };

        $existing = $this->posts->findByKey(self::BOARD_KEY, $postKey);
        if ($existing === null) {
            throw new InvalidArgumentException('제출 항목을 찾을 수 없습니다.');
        }

        $currentStatus = (string) $existing['status'];
        if ($currentStatus !== 'submitted' && !($currentStatus === 'published' && $action === 'hide')) {
            throw new InvalidArgumentException('현재 상태에서는 해당 조치를 할 수 없습니다.');
        }

        $row = $this->posts->updateAdminReview(
            self::BOARD_KEY,
            $postKey,
            $nextStatus,
            $internalMemo !== '' ? $internalMemo : null,
        );

        $actionKind = $action === 'hide' ? 'submission_hide' : 'submission_expose';
        $log = $this->logs->insert(
            $operatorId,
            'board_post',
            self::BOARD_KEY . ':' . $postKey,
            $actionKind,
            $reasonCategory !== '' ? $reasonCategory : null,
            $internalMemo !== '' ? $internalMemo : null,
            true,
            false,
        );

        return [
            'item' => $this->mapQueueItem($row),
            'log' => $this->mapLog($log),
        ];
    }

    /** @return list<array<string, mixed>> */
    public function listLogs(int $limit = 50): array
    {
        return array_map(fn (array $row) => $this->mapLog($row), $this->logs->listRecent($limit));
    }

    /** @param array<string, mixed> $row @return array<string, mixed> */
    private function mapQueueItem(array $row): array
    {
        $created = (string) $row['created_at'];
        $updated = (string) $row['updated_at'];

        $postKey = (string) $row['post_key'];
        $attachment = $this->attachments->getPrimaryMeta(self::BOARD_KEY, $postKey);

        return [
            'id' => $postKey,
            'boardKey' => (string) $row['board_key'],
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
        ];
    }

    /** @param array<string, mixed> $row @return array<string, mixed> */
    private function mapLog(array $row): array
    {
        return [
            'id' => (string) $row['log_key'],
            'action' => (string) $row['action_kind'],
            'targetType' => (string) $row['target_type'],
            'target' => (string) $row['target_id'],
            'operator' => (string) $row['operator_id'],
            'at' => (string) $row['acted_at'],
            'reasonCategory' => (string) ($row['reason_category'] ?? ''),
            'detailMemo' => (string) ($row['detail_memo'] ?? ''),
            'reversible' => (bool) $row['reversible'],
            'userNotified' => (bool) $row['user_notified'],
        ];
    }
}
