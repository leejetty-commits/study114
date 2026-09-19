<?php

declare(strict_types=1);

namespace Study114\Support;

use InvalidArgumentException;
use Study114\Database\Connection;

final class SupportTicketService
{
    private const ALLOWED_CATEGORIES = ['bug', 'policy', 'account', 'other'];
    private const ALLOWED_ROLES = ['guest', 'parent', 'study_room', 'tutor'];
    private const ALLOWED_STATUSES = ['open', 'in_progress', 'closed'];

    private SupportTicketRepository $repo;

    public function __construct(?SupportTicketRepository $repo = null)
    {
        $this->repo = $repo ?? new SupportTicketRepository(Connection::get());
    }

    /** @return list<array<string, mixed>> */
    public function list(?string $email = null): array
    {
        $rows = $email !== null && trim($email) !== ''
            ? $this->repo->listByEmail(trim($email))
            : $this->repo->listAll();

        return array_map(fn (array $row) => $this->mapTicket($row), $rows);
    }

    /** @param array<string, mixed> $input */
    public function create(array $input): array
    {
        $email = trim((string) ($input['email'] ?? ''));
        $category = trim((string) ($input['category'] ?? ''));
        $body = trim((string) ($input['body'] ?? ''));
        $role = trim((string) ($input['role'] ?? 'guest'));

        if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new InvalidArgumentException('유효한 이메일이 필요합니다.');
        }
        if (!in_array($category, self::ALLOWED_CATEGORIES, true)) {
            throw new InvalidArgumentException('category가 올바르지 않습니다.');
        }
        if (!in_array($role, self::ALLOWED_ROLES, true)) {
            $role = 'guest';
        }
        if ($body === '') {
            throw new InvalidArgumentException('문의 내용이 필요합니다.');
        }

        return $this->mapTicket($this->repo->create($email, $category, $role, $body));
    }

    public function updateStatus(string $ticketId, string $status): ?array
    {
        if ($ticketId === '') {
            throw new InvalidArgumentException('ticket id가 필요합니다.');
        }
        if (!in_array($status, self::ALLOWED_STATUSES, true)) {
            throw new InvalidArgumentException('status가 올바르지 않습니다.');
        }

        $row = $this->repo->updateStatus($ticketId, $status);
        return $row !== null ? $this->mapTicket($row) : null;
    }

    /**
     * 기존 PATCH 확장 — status와 운영자 답변을 각각 선택적으로 저장한다.
     * 답변 저장 시 상태는 자동 변경하지 않는다.
     *
     * @param array<string, mixed> $input
     */
    public function patch(string $ticketId, array $input): ?array
    {
        if ($ticketId === '') {
            throw new InvalidArgumentException('ticket id가 필요합니다.');
        }

        $status = trim((string) ($input['status'] ?? ''));
        $hasStatus = $status !== '';
        $hasReply = array_key_exists('admin_reply_text', $input) || array_key_exists('adminReplyText', $input);
        if (!$hasStatus && !$hasReply) {
            throw new InvalidArgumentException('status 또는 답변이 필요합니다.');
        }

        $row = null;
        if ($hasStatus) {
            if (!in_array($status, self::ALLOWED_STATUSES, true)) {
                throw new InvalidArgumentException('status가 올바르지 않습니다.');
            }
            $row = $this->repo->updateStatus($ticketId, $status);
            if ($row === null) {
                return null;
            }
        }
        if ($hasReply) {
            $reply = trim((string) ($input['admin_reply_text'] ?? $input['adminReplyText'] ?? ''));
            if ($reply === '') {
                throw new InvalidArgumentException('답변 내용이 필요합니다.');
            }
            $row = $this->repo->updateReply($ticketId, $reply);
            if ($row === null) {
                return null;
            }
        }

        return $row !== null ? $this->mapTicket($row) : null;
    }

    /** @param array<string, mixed> $row @return array<string, mixed> */
    private function mapTicket(array $row): array
    {
        $replyText = trim((string) ($row['admin_reply_text'] ?? ''));
        $repliedAt = $this->isoDate($row['admin_replied_at'] ?? null);
        $createdAt = $this->isoDate($row['created_at'] ?? null) ?? gmdate('c');
        $updatedAt = $this->isoDate($row['updated_at'] ?? null) ?? $createdAt;
        $lastActivity = $repliedAt ?? $updatedAt;

        return [
            'id' => (string) $row['ticket_no'],
            'email' => (string) $row['email'],
            'category' => (string) $row['category'],
            'type' => (string) $row['category'],
            'body' => (string) $row['body'],
            'message' => (string) $row['body'],
            'role' => (string) $row['role_type'],
            'status' => (string) $row['status'],
            'createdAt' => $createdAt,
            'updatedAt' => $updatedAt,
            'created_at' => $createdAt,
            'updated_at' => $updatedAt,
            'adminReplyText' => $replyText !== '' ? $replyText : null,
            'adminRepliedAt' => $repliedAt,
            'admin_reply_text' => $replyText !== '' ? $replyText : null,
            'admin_replied_at' => $repliedAt,
            'hasAdminReply' => $replyText !== '',
            'lastActivityAt' => $lastActivity,
        ];
    }

    private function isoDate(mixed $value): ?string
    {
        $raw = trim((string) ($value ?? ''));
        if ($raw === '' || str_starts_with($raw, '0000-00-00')) {
            return null;
        }
        $ts = strtotime($raw);

        return $ts === false ? null : gmdate('c', $ts);
    }
}
