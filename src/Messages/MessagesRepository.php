<?php

declare(strict_types=1);

namespace Study114\Messages;

use PDO;

/** 16장 P16 — thread · message persistence (DDL 014) */
final class MessagesRepository
{
    private ?bool $hasImportantColumn = null;

    public function __construct(private readonly PDO $pdo)
    {
    }

    /** 058 미적용 운영 DB에서도 쪽지 목록이 500 나지 않게 */
    private function hasImportantColumn(): bool
    {
        if ($this->hasImportantColumn !== null) {
            return $this->hasImportantColumn;
        }
        try {
            $stmt = $this->pdo->query(
                "SHOW COLUMNS FROM message_thread_participant_state LIKE 'is_important'"
            );
            $this->hasImportantColumn = $stmt !== false && $stmt->fetch() !== false;
        } catch (\PDOException) {
            $this->hasImportantColumn = false;
        }

        return $this->hasImportantColumn;
    }

    private function participantSelectExpr(): string
    {
        if ($this->hasImportantColumn()) {
            return 'ps.is_archived, ps.is_blocked, ps.is_important, ps.block_reason, ps.reported_at, ps.report_reason';
        }

        return 'ps.is_archived, ps.is_blocked, 0 AS is_important, ps.block_reason, ps.reported_at, ps.report_reason';
    }

    public function getUserDisplayName(int $userId): ?string
    {
        $stmt = $this->pdo->prepare(
            'SELECT real_name FROM user_profiles WHERE user_id = ? LIMIT 1'
        );
        $stmt->execute([$userId]);
        $val = $stmt->fetchColumn();

        return $val !== false ? (string) $val : null;
    }

    public function getStudyRoomOwnerUserId(int $studyRoomId): ?int
    {
        $stmt = $this->pdo->prepare('SELECT user_id FROM study_rooms WHERE id = ? LIMIT 1');
        $stmt->execute([$studyRoomId]);
        $val = $stmt->fetchColumn();

        return $val !== false ? (int) $val : null;
    }

    public function getTutorOwnerUserId(int $tutorId): ?int
    {
        $stmt = $this->pdo->prepare('SELECT user_id FROM tutors WHERE id = ? LIMIT 1');
        $stmt->execute([$tutorId]);
        $val = $stmt->fetchColumn();

        return $val !== false ? (int) $val : null;
    }

    public function getStudentGuardianUserId(int $studentId): ?int
    {
        $stmt = $this->pdo->prepare('SELECT guardian_user_id FROM students WHERE id = ? LIMIT 1');
        $stmt->execute([$studentId]);
        $val = $stmt->fetchColumn();

        return $val !== false ? (int) $val : null;
    }

  /**
   * @return array<string, mixed>|null
   */
    public function findThreadByContext(
        string $contextKind,
        int $contextId,
        int $participantLow,
        int $participantHigh,
    ): ?array {
        $stmt = $this->pdo->prepare(
            'SELECT * FROM message_threads
             WHERE context_kind = ? AND context_id = ?
               AND participant_low_user_id = ? AND participant_high_user_id = ?
             LIMIT 1'
        );
        $stmt->execute([$contextKind, $contextId, $participantLow, $participantHigh]);
        $row = $stmt->fetch();

        return $row !== false ? $row : null;
    }

    /**
     * @param array<string, mixed> $data
     */
    public function createThread(array $data): int
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO message_threads (
               participant_low_user_id, participant_high_user_id,
               context_kind, context_id,
               context_label, peer_display_name,
               scope_badge, scope_hint,
               show_request_in_panel, request_summary, structured_line,
               initiated_by_user_id, last_message_preview
             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $data['participant_low_user_id'],
            $data['participant_high_user_id'],
            $data['context_kind'],
            $data['context_id'],
            $data['context_label'],
            $data['peer_display_name'],
            $data['scope_badge'],
            $data['scope_hint'],
            $data['show_request_in_panel'] ? 1 : 0,
            $data['request_summary'] ?? null,
            $data['structured_line'],
            $data['initiated_by_user_id'],
            $data['last_message_preview'],
        ]);

        return (int) $this->pdo->lastInsertId();
    }

    public function insertMessage(int $threadId, int $senderUserId, string $body, ?string $preview = null): int
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO messages (thread_id, sender_user_id, body) VALUES (?, ?, ?)'
        );
        $stmt->execute([$threadId, $senderUserId, $body]);
        $id = (int) $this->pdo->lastInsertId();

        $previewText = trim((string) ($preview ?? $body));
        if ($previewText === '') {
            $previewText = '첨부 파일';
        }
        $upd = $this->pdo->prepare(
            'UPDATE message_threads SET last_message_preview = ?, updated_at = NOW() WHERE id = ?'
        );
        $upd->execute([mb_substr($previewText, 0, 120), $threadId]);

        return $id;
    }

    public function upsertThreadRead(int $threadId, int $userId): void
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO message_thread_reads (thread_id, user_id, read_at) VALUES (?, ?, NOW())
             ON DUPLICATE KEY UPDATE read_at = NOW()'
        );
        $stmt->execute([$threadId, $userId]);
    }

    /** @return list<array<string, mixed>> */
    public function listThreadsForUser(int $userId): array
    {
        $psCols = $this->participantSelectExpr();
        $order = $this->hasImportantColumn()
            ? 'ORDER BY COALESCE(ps.is_important, 0) DESC, t.updated_at DESC'
            : 'ORDER BY t.updated_at DESC';
        $stmt = $this->pdo->prepare(
            "SELECT t.*,
                    (SELECT MAX(m.created_at) FROM messages m WHERE m.thread_id = t.id) AS last_message_at,
                    (SELECT m.sender_user_id FROM messages m WHERE m.thread_id = t.id
                     ORDER BY m.created_at DESC, m.id DESC LIMIT 1) AS last_sender_user_id,
                    r.read_at,
                    (SELECT pr.read_at FROM message_thread_reads pr
                      WHERE pr.thread_id = t.id AND pr.user_id <> ? LIMIT 1) AS peer_read_at,
                    {$psCols},
                    (SELECT m.body FROM messages m WHERE m.thread_id = t.id
                     ORDER BY m.created_at ASC, m.id ASC LIMIT 1) AS first_message_body
             FROM message_threads t
             LEFT JOIN message_thread_reads r ON r.thread_id = t.id AND r.user_id = ?
             LEFT JOIN message_thread_participant_state ps ON ps.thread_id = t.id AND ps.user_id = ?
             WHERE t.participant_low_user_id = ? OR t.participant_high_user_id = ?
             {$order}"
        );
        $stmt->execute([$userId, $userId, $userId, $userId, $userId]);

        return $stmt->fetchAll();
    }

    /** @return array<string, mixed>|null */
    public function getThreadRow(int $threadId, int $userId): ?array
    {
        $psCols = $this->participantSelectExpr();
        $stmt = $this->pdo->prepare(
            "SELECT t.*, r.read_at,
                    (SELECT MAX(m.created_at) FROM messages m WHERE m.thread_id = t.id) AS last_message_at,
                    (SELECT m.sender_user_id FROM messages m WHERE m.thread_id = t.id
                     ORDER BY m.created_at DESC, m.id DESC LIMIT 1) AS last_sender_user_id,
                    (SELECT pr.read_at FROM message_thread_reads pr
                      WHERE pr.thread_id = t.id AND pr.user_id <> ? LIMIT 1) AS peer_read_at,
                    {$psCols},
                    (SELECT m.body FROM messages m WHERE m.thread_id = t.id
                     ORDER BY m.created_at ASC, m.id ASC LIMIT 1) AS first_message_body
             FROM message_threads t
             LEFT JOIN message_thread_reads r ON r.thread_id = t.id AND r.user_id = ?
             LEFT JOIN message_thread_participant_state ps ON ps.thread_id = t.id AND ps.user_id = ?
             WHERE t.id = ? AND (t.participant_low_user_id = ? OR t.participant_high_user_id = ?)
             LIMIT 1"
        );
        $stmt->execute([$userId, $userId, $userId, $threadId, $userId, $userId]);
        $row = $stmt->fetch();

        return $row !== false ? $row : null;
    }

    /** @return list<array<string, mixed>> */
    public function listMessages(int $threadId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT id, sender_user_id, body, created_at FROM messages
             WHERE thread_id = ? ORDER BY created_at ASC, id ASC'
        );
        $stmt->execute([$threadId]);

        return $stmt->fetchAll();
    }

    /**
     * @param list<int> $messageIds
     * @return array<int, list<array<string, mixed>>>
     */
    public function listAttachmentsByMessageIds(array $messageIds): array
    {
        if ($messageIds === []) {
            return [];
        }
        $placeholders = implode(',', array_fill(0, count($messageIds), '?'));
        $stmt = $this->pdo->prepare(
            "SELECT id, message_id, original_name, mime_type, size_bytes
             FROM message_attachments
             WHERE message_id IN ($placeholders)
             ORDER BY id ASC"
        );
        $stmt->execute(array_map(static fn (int $id): int => $id, $messageIds));
        $map = [];
        foreach ($stmt->fetchAll() as $row) {
            $mid = (int) $row['message_id'];
            $map[$mid][] = $row;
        }

        return $map;
    }

    /**
     * @return array<string, mixed>
     */
    public function insertAttachment(
        int $messageId,
        int $threadId,
        string $originalName,
        string $storagePath,
        string $mimeType,
        int $sizeBytes,
    ): array {
        $stmt = $this->pdo->prepare(
            'INSERT INTO message_attachments
               (message_id, thread_id, original_name, storage_path, mime_type, size_bytes)
             VALUES (?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([$messageId, $threadId, $originalName, $storagePath, $mimeType, $sizeBytes]);
        $id = (int) $this->pdo->lastInsertId();

        return [
            'id' => $id,
            'message_id' => $messageId,
            'thread_id' => $threadId,
            'original_name' => $originalName,
            'storage_path' => $storagePath,
            'mime_type' => $mimeType,
            'size_bytes' => $sizeBytes,
        ];
    }

    /** @return array<string, mixed>|null */
    public function findAttachmentForUser(int $attachmentId, int $userId): ?array
    {
        $stmt = $this->pdo->prepare(
            'SELECT a.*
             FROM message_attachments a
             JOIN message_threads t ON t.id = a.thread_id
             WHERE a.id = ?
               AND (t.participant_low_user_id = ? OR t.participant_high_user_id = ?)
             LIMIT 1'
        );
        $stmt->execute([$attachmentId, $userId, $userId]);
        $row = $stmt->fetch();

        return $row !== false ? $row : null;
    }

    public function threadHasPeerMessage(int $threadId, int $viewerUserId): bool
    {
        $stmt = $this->pdo->prepare(
            'SELECT 1 FROM messages WHERE thread_id = ? AND sender_user_id != ? LIMIT 1'
        );
        $stmt->execute([$threadId, $viewerUserId]);

        return (bool) $stmt->fetchColumn();
    }

    public function getUserPrimaryRole(int $userId): ?string
    {
        $stmt = $this->pdo->prepare(
            'SELECT role_type FROM user_roles WHERE user_id = ? AND is_primary = 1 LIMIT 1'
        );
        $stmt->execute([$userId]);
        $val = $stmt->fetchColumn();

        return $val !== false ? (string) $val : null;
    }

    /** @return array<string, mixed>|null */
    public function getParticipantState(int $threadId, int $userId): ?array
    {
        $cols = $this->hasImportantColumn()
            ? 'is_archived, is_blocked, is_important, block_reason, reported_at, report_reason'
            : 'is_archived, is_blocked, 0 AS is_important, block_reason, reported_at, report_reason';
        $stmt = $this->pdo->prepare(
            "SELECT {$cols}
             FROM message_thread_participant_state
             WHERE thread_id = ? AND user_id = ?
             LIMIT 1"
        );
        $stmt->execute([$threadId, $userId]);
        $row = $stmt->fetch();

        return $row !== false ? $row : null;
    }

    public function countImportantForUser(int $userId): int
    {
        if (!$this->hasImportantColumn()) {
            return 0;
        }
        $stmt = $this->pdo->prepare(
            'SELECT COUNT(*) FROM message_thread_participant_state
             WHERE user_id = ? AND is_important = 1'
        );
        $stmt->execute([$userId]);

        return (int) $stmt->fetchColumn();
    }

    /**
     * @param array<string, mixed> $fields
     */
    public function upsertParticipantState(int $threadId, int $userId, array $fields): void
    {
        $current = $this->getParticipantState($threadId, $userId) ?? [
            'is_archived' => 0,
            'is_blocked' => 0,
            'is_important' => 0,
            'block_reason' => null,
            'reported_at' => null,
            'report_reason' => null,
        ];
        $merged = array_merge($current, $fields);
        if ($this->hasImportantColumn()) {
            $stmt = $this->pdo->prepare(
                'INSERT INTO message_thread_participant_state
                   (thread_id, user_id, is_archived, is_blocked, is_important, block_reason, reported_at, report_reason)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE
                   is_archived = VALUES(is_archived),
                   is_blocked = VALUES(is_blocked),
                   is_important = VALUES(is_important),
                   block_reason = VALUES(block_reason),
                   reported_at = COALESCE(VALUES(reported_at), reported_at),
                   report_reason = COALESCE(VALUES(report_reason), report_reason),
                   updated_at = NOW()'
            );
            $stmt->execute([
                $threadId,
                $userId,
                (int) ($merged['is_archived'] ?? 0),
                (int) ($merged['is_blocked'] ?? 0),
                (int) ($merged['is_important'] ?? 0),
                $merged['block_reason'] ?? null,
                $merged['reported_at'] ?? null,
                $merged['report_reason'] ?? null,
            ]);
            return;
        }
        $stmt = $this->pdo->prepare(
            'INSERT INTO message_thread_participant_state
               (thread_id, user_id, is_archived, is_blocked, block_reason, reported_at, report_reason)
             VALUES (?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
               is_archived = VALUES(is_archived),
               is_blocked = VALUES(is_blocked),
               block_reason = VALUES(block_reason),
               reported_at = COALESCE(VALUES(reported_at), reported_at),
               report_reason = COALESCE(VALUES(report_reason), report_reason),
               updated_at = NOW()'
        );
        $stmt->execute([
            $threadId,
            $userId,
            (int) ($merged['is_archived'] ?? 0),
            (int) ($merged['is_blocked'] ?? 0),
            $merged['block_reason'] ?? null,
            $merged['reported_at'] ?? null,
            $merged['report_reason'] ?? null,
        ]);
    }

    public function countUnreadForUser(int $userId): int
    {
        $stmt = $this->pdo->prepare(
            'SELECT COUNT(*) FROM message_threads t
             WHERE (t.participant_low_user_id = ? OR t.participant_high_user_id = ?)
               AND EXISTS (
                 SELECT 1 FROM messages m
                 WHERE m.thread_id = t.id AND m.sender_user_id != ?
                   AND (t.id NOT IN (
                     SELECT thread_id FROM message_thread_reads WHERE user_id = ? AND read_at >= m.created_at
                   ) OR NOT EXISTS (
                     SELECT 1 FROM message_thread_reads r2 WHERE r2.thread_id = t.id AND r2.user_id = ?
                   ))
               )'
        );
        $stmt->execute([$userId, $userId, $userId, $userId, $userId]);

        return (int) $stmt->fetchColumn();
    }

    public function countActiveForUser(int $userId, int $activeDays): int
    {
        $stmt = $this->pdo->prepare(
            'SELECT COUNT(*) FROM message_threads t
             WHERE (t.participant_low_user_id = ? OR t.participant_high_user_id = ?)
               AND t.updated_at >= DATE_SUB(NOW(), INTERVAL ? DAY)'
        );
        $stmt->execute([$userId, $userId, $activeDays]);

        return (int) $stmt->fetchColumn();
    }
}
