<?php

declare(strict_types=1);

namespace Study114\Messages;

use PDO;

/** 16장 P16 — thread · message persistence (DDL 014) */
final class MessagesRepository
{
    public function __construct(private readonly PDO $pdo)
    {
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

    public function insertMessage(int $threadId, int $senderUserId, string $body): int
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO messages (thread_id, sender_user_id, body) VALUES (?, ?, ?)'
        );
        $stmt->execute([$threadId, $senderUserId, $body]);

        $preview = mb_substr($body, 0, 120);
        $upd = $this->pdo->prepare(
            'UPDATE message_threads SET last_message_preview = ?, updated_at = NOW() WHERE id = ?'
        );
        $upd->execute([$preview, $threadId]);

        return (int) $this->pdo->lastInsertId();
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
        $stmt = $this->pdo->prepare(
            'SELECT t.*,
                    (SELECT MAX(m.created_at) FROM messages m WHERE m.thread_id = t.id) AS last_message_at,
                    (SELECT m.sender_user_id FROM messages m WHERE m.thread_id = t.id
                     ORDER BY m.created_at DESC, m.id DESC LIMIT 1) AS last_sender_user_id,
                    r.read_at,
                    ps.is_archived, ps.is_blocked, ps.block_reason, ps.reported_at, ps.report_reason
             FROM message_threads t
             LEFT JOIN message_thread_reads r ON r.thread_id = t.id AND r.user_id = ?
             LEFT JOIN message_thread_participant_state ps ON ps.thread_id = t.id AND ps.user_id = ?
             WHERE t.participant_low_user_id = ? OR t.participant_high_user_id = ?
             ORDER BY t.updated_at DESC'
        );
        $stmt->execute([$userId, $userId, $userId, $userId]);

        return $stmt->fetchAll();
    }

    /** @return array<string, mixed>|null */
    public function getThreadRow(int $threadId, int $userId): ?array
    {
        $stmt = $this->pdo->prepare(
            'SELECT t.*, r.read_at,
                    ps.is_archived, ps.is_blocked, ps.block_reason, ps.reported_at, ps.report_reason
             FROM message_threads t
             LEFT JOIN message_thread_reads r ON r.thread_id = t.id AND r.user_id = ?
             LEFT JOIN message_thread_participant_state ps ON ps.thread_id = t.id AND ps.user_id = ?
             WHERE t.id = ? AND (t.participant_low_user_id = ? OR t.participant_high_user_id = ?)
             LIMIT 1'
        );
        $stmt->execute([$userId, $userId, $threadId, $userId, $userId]);
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

    /**
     * @param array<string, mixed> $fields
     */
    public function upsertParticipantState(int $threadId, int $userId, array $fields): void
    {
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
            (int) ($fields['is_archived'] ?? 0),
            (int) ($fields['is_blocked'] ?? 0),
            $fields['block_reason'] ?? null,
            $fields['reported_at'] ?? null,
            $fields['report_reason'] ?? null,
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
