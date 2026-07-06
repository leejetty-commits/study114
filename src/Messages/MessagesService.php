<?php

declare(strict_types=1);

namespace Study114\Messages;

use InvalidArgumentException;
use Study114\Database\Connection;

/**
 * 16장 P16 — 쪽지 thread API surface
 * 프리뷰 대응: preview/home-ui/src/messages/thread-store.js
 */
final class MessagesService
{
    public const ACTIVE_DAYS = 7;

    private MessagesRepository $repo;
    private ProviderEntitlementService $entitlements;

    public function __construct(
        ?MessagesRepository $repo = null,
        ?ProviderEntitlementService $entitlements = null,
    ) {
        $this->repo = $repo ?? new MessagesRepository(Connection::get());
        $this->entitlements = $entitlements ?? new ProviderEntitlementService();
    }

    /** @return list<array<string, mixed>> */
    public function listThreads(int $userId): array
    {
        $rows = $this->repo->listThreadsForUser($userId);

        return array_map(fn (array $row) => $this->mapThreadSummary($row, $userId), $rows);
    }

    /** @return array<string, mixed>|null */
    public function getThread(int $userId, int $threadId): ?array
    {
        $row = $this->repo->getThreadRow($threadId, $userId);
        if ($row === null) {
            return null;
        }
        $messages = $this->repo->listMessages($threadId);

        return $this->mapThreadDetail($row, $messages, $userId);
    }

    /**
     * P16-03 첫 메모 · §6-3 thread 재사용
     *
     * @param array<string, mixed> $input
     * @return array<string, mixed>
     */
    public function composeMessage(int $userId, array $input): array
    {
        (new \Study114\Auth\EmailVerificationGate())->assertVerified($userId);

        $contextKind = (string) ($input['context_kind'] ?? '');
        $contextId = (int) ($input['context_id'] ?? 0);
        $body = trim((string) ($input['body'] ?? ''));

        MessagesApi::assertContextKind($contextKind);
        if ($contextId <= 0) {
            throw new InvalidArgumentException('context_id가 필요합니다.');
        }
        if ($body === '') {
            throw new InvalidArgumentException('본문이 필요합니다.');
        }

        $peerUserId = $this->resolvePeerUserId($contextKind, $contextId);
        if ($peerUserId === null) {
            throw new InvalidArgumentException('연결 대상을 찾을 수 없습니다.');
        }
        if ($peerUserId === $userId) {
            throw new InvalidArgumentException('자기 자신에게는 보낼 수 없습니다.');
        }

        $this->assertComposeDirection($contextKind, $userId, $peerUserId);

        [$low, $high] = $this->canonicalParticipants($userId, $peerUserId);
        $existing = $this->repo->findThreadByContext($contextKind, $contextId, $low, $high);

        if ($existing !== null) {
            $threadId = (int) $existing['id'];
            $this->assertCanSendMessage($userId, $existing, $contextKind);
            $this->repo->insertMessage($threadId, $userId, $body);
            $this->repo->upsertThreadRead($threadId, $userId);
        } else {
            $this->assertColdMemoAllowed($userId, $contextKind);
            $threadId = $this->repo->createThread([
                'participant_low_user_id'  => $low,
                'participant_high_user_id' => $high,
                'context_kind'             => $contextKind,
                'context_id'               => $contextId,
                'context_label'            => (string) ($input['context_label'] ?? ''),
                'peer_display_name'        => (string) ($input['peer_display_name'] ?? ''),
                'scope_badge'              => (string) ($input['scope_badge'] ?? ''),
                'scope_hint'               => (string) ($input['scope_hint'] ?? ''),
                'show_request_in_panel'    => (bool) ($input['show_request_in_panel'] ?? false),
                'request_summary'          => $input['request_summary'] ?? null,
                'structured_line'          => (string) ($input['structured_line'] ?? ''),
                'initiated_by_user_id'     => $userId,
                'last_message_preview'     => mb_substr($body, 0, 120),
            ]);
            $this->repo->insertMessage($threadId, $userId, $body);
            $this->repo->upsertThreadRead($threadId, $userId);
            if ($contextKind === 'student') {
                $this->entitlements->consumeColdMemoTicket($userId);
            }
        }

        $thread = $this->getThread($userId, $threadId);
        if ($thread === null) {
            throw new InvalidArgumentException('thread 생성에 실패했습니다.');
        }

        return $thread;
    }

    public function replyMessage(int $userId, int $threadId, string $body): array
    {
        $body = trim($body);
        if ($body === '') {
            throw new InvalidArgumentException('본문이 필요합니다.');
        }

        $row = $this->repo->getThreadRow($threadId, $userId);
        if ($row === null) {
            throw new InvalidArgumentException('대화를 찾을 수 없습니다.');
        }

        $this->assertCanSendMessage($userId, $row, (string) $row['context_kind']);

        $this->repo->insertMessage($threadId, $userId, $body);
        $this->repo->upsertThreadRead($threadId, $userId);

        $thread = $this->getThread($userId, $threadId);
        if ($thread === null) {
            throw new InvalidArgumentException('답장 저장에 실패했습니다.');
        }

        return $thread;
    }

    public function markThreadRead(int $userId, int $threadId): void
    {
        $row = $this->repo->getThreadRow($threadId, $userId);
        if ($row === null) {
            throw new InvalidArgumentException('대화를 찾을 수 없습니다.');
        }
        $this->repo->upsertThreadRead($threadId, $userId);
    }

    public function archiveThread(int $userId, int $threadId, bool $archived = true): void
    {
        $this->assertThreadAccess($userId, $threadId);
        $this->repo->upsertParticipantState($threadId, $userId, ['is_archived' => $archived ? 1 : 0]);
    }

    public function blockThread(int $userId, int $threadId, string $reason = '차단됨'): void
    {
        $this->assertThreadAccess($userId, $threadId);
        $this->repo->upsertParticipantState($threadId, $userId, [
            'is_blocked'    => 1,
            'block_reason'  => mb_substr(trim($reason), 0, 120),
        ]);
    }

    public function reportThread(int $userId, int $threadId, string $reason): void
    {
        $this->assertThreadAccess($userId, $threadId);
        $reason = trim($reason);
        if ($reason === '') {
            throw new InvalidArgumentException('신고 사유가 필요합니다.');
        }
        $this->repo->upsertParticipantState($threadId, $userId, [
            'reported_at'   => date('Y-m-d H:i:s'),
            'report_reason' => mb_substr($reason, 0, 50),
        ]);
    }

    /** @return array{unread: int, active: int} */
    public function summaryCounts(int $userId): array
    {
        $threads = $this->listThreads($userId);
        $unread = 0;
        $active = 0;
        $cutoff = time() - self::ACTIVE_DAYS * 86400;
        foreach ($threads as $t) {
            if ($t['unread']) {
                $unread++;
            }
            if (strtotime((string) $t['updatedAt']) >= $cutoff) {
                $active++;
            }
        }

        return ['unread' => $unread, 'active' => $active];
    }

    private function resolvePeerUserId(string $contextKind, int $contextId): ?int
    {
        return match ($contextKind) {
            'study_room' => $this->repo->getStudyRoomOwnerUserId($contextId),
            'tutor'      => $this->repo->getTutorOwnerUserId($contextId),
            'student'    => $this->repo->getStudentGuardianUserId($contextId),
            default      => null,
        };
    }

    private function assertComposeDirection(string $contextKind, int $senderUserId, int $peerUserId): void
    {
        unset($senderUserId, $peerUserId);
        if ($contextKind === 'student' || $contextKind === 'study_room' || $contextKind === 'tutor') {
            return;
        }
    }

    /**
     * @param array<string, mixed> $row
     */
    private function assertCanSendMessage(int $userId, array $row, string $contextKind): void
    {
        if ((bool) ($row['is_blocked'] ?? false)) {
            throw new InvalidArgumentException('차단된 대화입니다.');
        }
        $threadId = (int) $row['id'];
        if ($contextKind === 'student' && !$this->repo->threadHasPeerMessage($threadId, $userId)) {
            $this->assertColdMemoAllowed($userId, $contextKind);
        }
    }

    private function assertColdMemoAllowed(int $userId, string $contextKind): void
    {
        if ($contextKind !== 'student') {
            return;
        }
        $role = $this->repo->getUserPrimaryRole($userId);
        if (!in_array($role, ['tutor', 'study_room_owner'], true)) {
            return;
        }
        if (!$this->entitlements->canColdMemo($userId)) {
            throw new PaidGateException('이 학생에게 먼저 쪽지를 내려면 쪽지권이 필요합니다.');
        }
    }

    private function assertThreadAccess(int $userId, int $threadId): void
    {
        if ($this->repo->getThreadRow($threadId, $userId) === null) {
            throw new InvalidArgumentException('대화를 찾을 수 없습니다.');
        }
    }

    /** @return array{0: int, 1: int} */
    private function canonicalParticipants(int $a, int $b): array
    {
        return $a < $b ? [$a, $b] : [$b, $a];
    }

    /**
     * @param array<string, mixed> $row
     * @return array<string, mixed>
     */
    private function mapThreadSummary(array $row, int $userId): array
    {
        $initiatedByMe = (int) $row['initiated_by_user_id'] === $userId;
        $lastSender = isset($row['last_sender_user_id']) ? (int) $row['last_sender_user_id'] : $userId;
        $readAt = $row['read_at'] ?? null;
        $lastAt = $row['last_message_at'] ?? $row['updated_at'];
        $unread = $lastSender !== $userId && ($readAt === null || strtotime((string) $readAt) < strtotime((string) $lastAt));
        $peerName = $this->resolvePeerDisplayName($row, $userId);

        return [
            'id'                  => (int) $row['id'],
            'contextKind'         => (string) $row['context_kind'],
            'contextId'           => (int) $row['context_id'],
            'contextLabel'        => (string) $row['context_label'],
            'peerDisplayName'     => $peerName,
            'scopeBadge'          => (string) $row['scope_badge'],
            'scopeHint'           => (string) $row['scope_hint'],
            'showRequestInPanel'  => (bool) $row['show_request_in_panel'],
            'requestSummary'      => $row['request_summary'] !== null ? (string) $row['request_summary'] : null,
            'structuredLine'      => (string) $row['structured_line'],
            'lastPreview'         => (string) $row['last_message_preview'],
            'updatedAt'           => gmdate('c', strtotime((string) $row['updated_at'])),
            'unread'              => $unread,
            'initiatedByMe'       => $initiatedByMe,
            'initiatedByPeer'     => !$initiatedByMe,
            'isArchived'          => (bool) ($row['is_archived'] ?? false),
            'isBlocked'           => (bool) ($row['is_blocked'] ?? false),
            'blockReason'         => isset($row['block_reason']) ? (string) $row['block_reason'] : null,
            'reportedAt'          => isset($row['reported_at']) && $row['reported_at'] !== null
                ? gmdate('c', strtotime((string) $row['reported_at'])) : null,
            'messages'            => [],
        ];
    }

    /**
     * @param array<string, mixed> $row
     * @param list<array<string, mixed>> $messages
     * @return array<string, mixed>
     */
    private function mapThreadDetail(array $row, array $messages, int $userId): array
    {
        $summary = $this->mapThreadSummary($row, $userId);
        $mappedMessages = [];
        $hasPeerMessage = false;
        foreach ($messages as $m) {
            $senderUserId = (int) $m['sender_user_id'];
            if ($senderUserId !== $userId) {
                $hasPeerMessage = true;
            }
            $mappedMessages[] = [
                'id'        => (int) $m['id'],
                'sender'    => $senderUserId === $userId ? 'me' : 'peer',
                'body'      => (string) $m['body'],
                'createdAt' => gmdate('c', strtotime((string) $m['created_at'])),
            ];
        }
        $summary['messages'] = $mappedMessages;
        $summary['initiatedByPeer'] = $hasPeerMessage || !$summary['initiatedByMe'];

        return $summary;
    }

    /**
     * @param array<string, mixed> $row
     */
    private function resolvePeerDisplayName(array $row, int $userId): string
    {
        $initiatedByMe = (int) $row['initiated_by_user_id'] === $userId;
        if ($initiatedByMe) {
            return (string) $row['peer_display_name'];
        }
        $otherUserId = (int) $row['participant_low_user_id'] === $userId
            ? (int) $row['participant_high_user_id']
            : (int) $row['participant_low_user_id'];

        return $this->repo->getUserDisplayName($otherUserId) ?? '상대';
    }
}
