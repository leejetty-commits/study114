<?php

declare(strict_types=1);

namespace Study114\Messages;

use InvalidArgumentException;
use Study114\Database\Connection;
use Study114\Paid\StudentRequestTextAccess;

/**
 * 16장 P16 — 쪽지 thread API surface
 * 프리뷰 대응: preview/home-ui/src/messages/thread-store.js
 */
final class MessagesService
{
    public const ACTIVE_DAYS = 7;
    public const IMPORTANT_MAX = 5;
    private const COMPOSE_TARGET_DENIED = '보낼 수 없는 대상입니다';

    private MessagesRepository $repo;
    private ProviderEntitlementService $entitlements;

    private MessageAttachmentService $attachments;

    private ?StudentRequestTextAccess $requestTextAccess = null;

    public function __construct(
        ?MessagesRepository $repo = null,
        ?ProviderEntitlementService $entitlements = null,
        ?MessageAttachmentService $attachments = null,
    ) {
        $this->repo = $repo ?? new MessagesRepository(Connection::get());
        $this->entitlements = $entitlements ?? new ProviderEntitlementService();
        $this->attachments = $attachments ?? new MessageAttachmentService();
    }

    private function assertSignupComplete(int $userId): void
    {
        (new \Study114\Auth\EmailVerificationGate())->assertVerified($userId);
    }

    /** @return list<array<string, mixed>> */
    public function listThreads(int $userId): array
    {
        $this->assertSignupComplete($userId);
        $rows = $this->repo->listThreadsForUser($userId);

        return array_map(fn (array $row) => $this->mapThreadSummary($row, $userId), $rows);
    }

    /** @return array<string, mixed>|null */
    public function getThread(int $userId, int $threadId): ?array
    {
        $this->assertSignupComplete($userId);
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
     * @param array<string, mixed> $input skip_ticket_consume·show_request_in_panel·request_summary 키는 읽지 않는다
     * @param list<array<string, mixed>> $files
     * @param bool $skipTicketConsume 서버 내부 호출(결제 직후 즉시권 발송)만 true
     * @return array<string, mixed>
     */
    public function composeMessage(int $userId, array $input, array $files = [], bool $skipTicketConsume = false): array
    {
        $this->assertSignupComplete($userId);

        $contextKind = (string) ($input['context_kind'] ?? '');
        $contextId = (int) ($input['context_id'] ?? 0);
        $body = trim((string) ($input['body'] ?? ''));

        MessagesApi::assertContextKind($contextKind);
        if ($contextId <= 0) {
            throw new InvalidArgumentException('context_id가 필요합니다.');
        }
        if ($body === '' && $files === []) {
            throw new InvalidArgumentException('본문 또는 첨부 파일이 필요합니다.');
        }

        $peerUserId = $this->resolvePeerUserId($contextKind, $contextId);
        if ($peerUserId === null) {
            throw new InvalidArgumentException('연결 대상을 찾을 수 없습니다.');
        }
        if ($peerUserId === $userId) {
            throw new InvalidArgumentException('자기 자신에게는 보낼 수 없습니다.');
        }

        [$low, $high] = $this->canonicalParticipants($userId, $peerUserId);
        $existing = $this->repo->findThreadByContext($contextKind, $contextId, $low, $high);

        if ($existing !== null) {
            $threadId = (int) $existing['id'];
            $this->assertCanSendMessage($userId, $existing, $contextKind);
            $this->insertMessageWithFiles($threadId, $userId, $body, $files);
            $this->repo->upsertThreadRead($threadId, $userId);
        } else {
            $this->assertComposeDirection($contextKind, $userId);
            if (!$skipTicketConsume) {
                $this->assertColdMemoAllowed($userId, $contextKind, $input);
            }
            if ($contextKind === 'student') {
                (new \Study114\Paid\StudentMemoGate(Connection::get()))->assertCanContact($contextId);
            }
            $requestSummary = null;
            if ($contextKind === 'student') {
                $requestSummary = $this->repo->getStudentRequestSummary($contextId);
                if ($requestSummary !== null && trim($requestSummary) === '') {
                    $requestSummary = null;
                }
            }
            $providerType = isset($input['provider_type']) ? (string) $input['provider_type'] : null;
            $providerId = isset($input['provider_id']) ? (int) $input['provider_id'] : null;
            $scope = $this->resolveScopeBadge(
                $userId,
                $contextKind,
                $requestSummary !== null,
                $skipTicketConsume || $this->entitlements->canColdMemo($userId, $providerType, $providerId),
            );

            $pdo = Connection::get();
            $ownTxn = !$pdo->inTransaction();
            if ($ownTxn) {
                $pdo->beginTransaction();
            }
            $storedPaths = [];
            try {
                if (self::requiresColdMemoTicket(true, $contextKind) && !$skipTicketConsume) {
                    if (!$this->entitlements->consumeColdMemoTicket($userId, $providerType, $providerId, true)) {
                        throw new PaidGateException('이 학생에게 먼저 쪽지를 내려면 쪽지권이 필요합니다.');
                    }
                }
                $threadId = $this->repo->createThread([
                    'participant_low_user_id'  => $low,
                    'participant_high_user_id' => $high,
                    'context_kind'             => $contextKind,
                    'context_id'               => $contextId,
                    'context_label'            => $contextKind === 'student' ? '등록' : '상세',
                    'peer_display_name'        => (string) ($input['peer_display_name'] ?? ''),
                    'scope_badge'              => $scope['label'],
                    'scope_hint'               => $scope['hint'],
                    'show_request_in_panel'    => $requestSummary !== null,
                    'request_summary'          => $requestSummary,
                    'structured_line'          => self::sanitizeDisplayLine((string) ($input['structured_line'] ?? ''), 255),
                    'initiated_by_user_id'     => $userId,
                    'last_message_preview'     => mb_substr($this->previewFromBodyOrFiles($body, $files), 0, 120),
                ]);
                $this->insertMessageWithFiles($threadId, $userId, $body, $files, $storedPaths);
                $this->repo->upsertThreadRead($threadId, $userId);
                if ($ownTxn) {
                    $pdo->commit();
                }
            } catch (\Throwable $e) {
                $this->entitlements->discardColdMemoBalanceNotice($userId);
                if ($ownTxn && $pdo->inTransaction()) {
                    $pdo->rollBack();
                }
                if ($ownTxn) {
                    $this->attachments->deleteStoredFiles($storedPaths);
                }
                throw $e;
            }
            if ($ownTxn) {
                $this->entitlements->notifyColdMemoBalance($userId);
            } else {
                $this->entitlements->discardColdMemoBalanceNotice($userId);
            }
        }

        $thread = $this->getThread($userId, $threadId);
        if ($thread === null) {
            throw new InvalidArgumentException('thread 생성에 실패했습니다.');
        }

        return $thread;
    }

    /**
     * @param list<array<string, mixed>> $files
     * @return array<string, mixed>
     */
    public function replyMessage(int $userId, int $threadId, string $body, array $files = []): array
    {
        $this->assertSignupComplete($userId);
        $body = trim($body);
        if ($body === '' && $files === []) {
            throw new InvalidArgumentException('본문 또는 첨부 파일이 필요합니다.');
        }

        $row = $this->repo->getThreadRow($threadId, $userId);
        if ($row === null) {
            throw new InvalidArgumentException('대화를 찾을 수 없습니다.');
        }

        $this->assertCanSendMessage($userId, $row, (string) $row['context_kind']);

        $this->insertMessageWithFiles($threadId, $userId, $body, $files);
        $this->repo->upsertThreadRead($threadId, $userId);

        $thread = $this->getThread($userId, $threadId);
        if ($thread === null) {
            throw new InvalidArgumentException('답장 저장에 실패했습니다.');
        }

        return $thread;
    }

    public function markThreadRead(int $userId, int $threadId): void
    {
        $this->assertSignupComplete($userId);
        $row = $this->repo->getThreadRow($threadId, $userId);
        if ($row === null) {
            throw new InvalidArgumentException('대화를 찾을 수 없습니다.');
        }
        $this->repo->upsertThreadRead($threadId, $userId);
    }

    public function archiveThread(int $userId, int $threadId, bool $archived = true): void
    {
        $this->assertSignupComplete($userId);
        $this->assertThreadAccess($userId, $threadId);
        $this->repo->upsertParticipantState($threadId, $userId, ['is_archived' => $archived ? 1 : 0]);
    }

    public function setThreadImportant(int $userId, int $threadId, bool $important): void
    {
        $this->assertSignupComplete($userId);
        $this->assertThreadAccess($userId, $threadId);
        if ($important) {
            $current = $this->repo->getParticipantState($threadId, $userId);
            $already = (int) ($current['is_important'] ?? 0) === 1;
            if (!$already && $this->repo->countImportantForUser($userId) >= self::IMPORTANT_MAX) {
                throw new InvalidArgumentException('중요 표시는 최대 5개까지 할 수 있습니다.');
            }
        }
        $this->repo->upsertParticipantState($threadId, $userId, ['is_important' => $important ? 1 : 0]);
    }

    public function blockThread(int $userId, int $threadId, string $reason = '차단됨'): void
    {
        $this->assertSignupComplete($userId);
        $this->assertThreadAccess($userId, $threadId);
        $this->repo->upsertParticipantState($threadId, $userId, [
            'is_blocked'    => 1,
            'block_reason'  => mb_substr(trim($reason), 0, 120),
        ]);
    }

    public function reportThread(int $userId, int $threadId, string $reason): void
    {
        $this->assertSignupComplete($userId);
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
        $this->assertSignupComplete($userId);
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

    /**
     * 공개 범위 배지·힌트 — preview/home-ui/src/messages/messages-copy.js getScopeBadge 규칙·문구 그대로
     *
     * @return array{label: string, hint: string}
     */
    private function resolveScopeBadge(int $userId, string $contextKind, bool $hasRequestText, bool $canColdMemo): array
    {
        $role = (string) ($this->repo->getUserPrimaryRole($userId) ?? '');
        $isProvider = $role === 'tutor' || $role === 'study_room_owner';

        if ($contextKind === 'student' && $isProvider) {
            if (!$canColdMemo) {
                return ['label' => '구조화 항목만', 'hint' => '요청문 비공개 · 콜드 메모 차단'];
            }
            $paidOnlyVisible = $hasRequestText && $this->canReceiveStudentRequestText($userId);

            return [
                'label' => '구조화 항목 + 유료 전용 요청문',
                'hint' => $paidOnlyVisible ? '요청문 일부 공개' : '요청문 비공개',
            ];
        }
        if ($contextKind === 'study_room' || $contextKind === 'tutor') {
            return [
                'label' => '공개 프로필',
                'hint' => $isProvider ? '먼저 온 쪽지의 답장은 무료' : '공급자 상세 공개 범위',
            ];
        }

        return ['label' => '—', 'hint' => ''];
    }

    /** 태그·줄바꿈·제어문자 제거 후 컬럼 길이로 자름 */
    private static function sanitizeDisplayLine(string $value, int $maxLength): string
    {
        $text = strip_tags($value);
        $text = (string) preg_replace('/[\x00-\x1F\x7F]+/u', ' ', $text);
        $text = trim((string) preg_replace('/\s{2,}/u', ' ', $text));

        return mb_substr($text, 0, $maxLength);
    }

    private function canReceiveStudentRequestText(int $userId): bool
    {
        $this->requestTextAccess ??= new StudentRequestTextAccess();

        return $this->requestTextAccess->canReceive($userId, (string) ($this->repo->getUserPrimaryRole($userId) ?? ''));
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

    /**
     * 새 대화 첫 쪽지 방향 (16§1-2 · 18§4) — 기존 대화 후속·replyMessage 에는 적용하지 않는다.
     * 공급자→공급자(study_room·tutor 대상)는 정본에 없으나 현재 화면 흐름이 허용하므로 막지 않는다.
     */
    private function assertComposeDirection(string $contextKind, int $senderUserId): void
    {
        $role = (string) ($this->repo->getUserPrimaryRole($senderUserId) ?? '');
        $isGuardian = in_array($role, ['guardian_student', 'parent', 'student'], true);
        $isProviderOrAdmin = in_array($role, ['tutor', 'study_room_owner', 'admin'], true);
        if ($contextKind === 'student') {
            if ($isProviderOrAdmin) {
                return;
            }
            if ($isGuardian) {
                throw new InvalidArgumentException('학부모는 공급자에게만 쪽지를 보낼 수 있습니다.');
            }
            throw new InvalidArgumentException(self::COMPOSE_TARGET_DENIED);
        }
        if (($contextKind === 'study_room' || $contextKind === 'tutor') && ($isGuardian || $isProviderOrAdmin)) {
            return;
        }
        throw new InvalidArgumentException(self::COMPOSE_TARGET_DENIED);
    }

    /**
     * 쪽지권은 공급자→학생 **신규** 대화 생성에만 1회 차감.
     * 기존 thread 후속·답장은 잔여권과 무관하게 무료.
     */
    public static function requiresColdMemoTicket(bool $isNewThread, string $contextKind): bool
    {
        return $isNewThread && $contextKind === 'student';
    }

    /**
     * @param array<string, mixed> $row
     */
    private function assertCanSendMessage(int $userId, array $row, string $contextKind): void
    {
        unset($userId, $contextKind);
        if ((bool) ($row['is_blocked'] ?? false) || $this->repo->isThreadBlockedByAnyParticipant((int) $row['id'])) {
            throw new InvalidArgumentException('차단된 대화입니다.');
        }
    }

    /**
     * @param array<string, mixed> $input
     */
    private function assertColdMemoAllowed(int $userId, string $contextKind, array $input = []): void
    {
        if ($contextKind !== 'student') {
            return;
        }
        $role = $this->repo->getUserPrimaryRole($userId);
        if (!in_array($role, ['tutor', 'study_room_owner'], true)) {
            return;
        }
        $providerType = isset($input['provider_type']) ? (string) $input['provider_type'] : null;
        $providerId = isset($input['provider_id']) ? (int) $input['provider_id'] : null;
        if (!$this->entitlements->canColdMemo($userId, $providerType, $providerId)) {
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
        $peerReadAt = $row['peer_read_at'] ?? null;
        $peerUnread = $lastSender === $userId && (
            $peerReadAt === null || $peerReadAt === ''
            || strtotime((string) $peerReadAt) < strtotime((string) $lastAt)
        );
        $peerName = $this->resolvePeerDisplayName($row, $userId);
        $requestSummary = null;
        if ((string) $row['context_kind'] === 'student') {
            $studentText = $row['student_request_summary'] ?? null;
            $requestSummary = $studentText !== null && trim((string) $studentText) !== '' ? (string) $studentText : null;
            if ($requestSummary !== null && $initiatedByMe && !$this->canReceiveStudentRequestText($userId)) {
                $requestSummary = '';
            }
        }

        return [
            'id'                  => (int) $row['id'],
            'contextKind'         => (string) $row['context_kind'],
            'contextId'           => (int) $row['context_id'],
            'contextLabel'        => (string) $row['context_label'],
            'peerDisplayName'     => $peerName,
            'scopeBadge'          => (string) $row['scope_badge'],
            'scopeHint'           => (string) $row['scope_hint'],
            'showRequestInPanel'  => $requestSummary !== null && $requestSummary !== '',
            'requestSummary'      => $requestSummary,
            'structuredLine'      => (string) $row['structured_line'],
            'lastPreview'         => (string) $row['last_message_preview'],
            'firstPreview'        => mb_substr(
                trim((string) ($row['first_message_body'] ?? '')) !== ''
                    ? (string) $row['first_message_body']
                    : (string) ($row['last_message_preview'] ?? ''),
                0,
                120,
            ),
            'updatedAt'           => gmdate('c', strtotime((string) $row['updated_at'])),
            'unread'              => $unread,
            'peerUnread'          => $peerUnread,
            'initiatedByMe'       => $initiatedByMe,
            'initiatedByPeer'     => !$initiatedByMe,
            'isArchived'          => (bool) ($row['is_archived'] ?? false),
            'isImportant'         => (bool) ($row['is_important'] ?? false),
            'isBlocked'           => (bool) ($row['is_blocked'] ?? false) || (bool) ($row['any_participant_blocked'] ?? false),
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
        $ids = array_map(static fn (array $m): int => (int) $m['id'], $messages);
        $attMap = [];
        try {
            $attMap = $this->repo->listAttachmentsByMessageIds($ids);
        } catch (\PDOException) {
            $attMap = [];
        }
        $peerReadAt = $row['peer_read_at'] ?? null;
        $peerTs = ($peerReadAt !== null && $peerReadAt !== '') ? strtotime((string) $peerReadAt) : false;
        foreach ($messages as $m) {
            $senderUserId = (int) $m['sender_user_id'];
            if ($senderUserId !== $userId) {
                $hasPeerMessage = true;
            }
            $createdTs = strtotime((string) $m['created_at']);
            $readByPeer = $senderUserId === $userId
                && $peerTs !== false
                && $createdTs !== false
                && $peerTs >= $createdTs;
            $atts = $attMap[(int) $m['id']] ?? [];
            $mappedMessages[] = [
                'id'          => (int) $m['id'],
                'sender'      => $senderUserId === $userId ? 'me' : 'peer',
                'body'        => (string) $m['body'],
                'createdAt'   => gmdate('c', strtotime((string) $m['created_at'])),
                'readByPeer'  => $readByPeer,
                'attachments' => array_map(
                    fn (array $r) => $this->attachments->mapAttachment($r),
                    $atts,
                ),
            ];
        }
        $summary['messages'] = $mappedMessages;
        $summary['initiatedByPeer'] = $hasPeerMessage || !$summary['initiatedByMe'];

        return $summary;
    }

    /**
     * @param list<array<string, mixed>> $files
     * @param list<string> $storedPaths 성공 시 이번 호출이 디스크에 쓴 첨부 경로. 실패 시 이미 지우고 비운다.
     */
    private function insertMessageWithFiles(
        int $threadId,
        int $userId,
        string $body,
        array $files,
        array &$storedPaths = [],
    ): int {
        $storedPaths = [];
        $pdo = Connection::get();
        $ownTxn = !$pdo->inTransaction();
        if ($ownTxn) {
            $pdo->beginTransaction();
        }
        try {
            $messageId = $this->repo->insertMessage(
                $threadId,
                $userId,
                $body,
                $this->previewFromBodyOrFiles($body, $files),
            );
            if ($files !== []) {
                try {
                    $this->attachments->storeForMessage($threadId, $messageId, $files);
                    $storedPaths = $this->attachments->lastStoredPaths();
                } catch (\PDOException $e) {
                    if (str_contains($e->getMessage(), 'message_attachments')) {
                        throw new InvalidArgumentException(
                            '쪽지 첨부용 DB 테이블이 없습니다. sql/schema/059_message_attachments.sql 을 적용해 주세요.',
                        );
                    }
                    throw $e;
                }
            }
            if ($ownTxn) {
                $pdo->commit();
            }

            return $messageId;
        } catch (\Throwable $e) {
            if ($ownTxn && $pdo->inTransaction()) {
                $pdo->rollBack();
            }
            $this->attachments->deleteStoredFiles($storedPaths);
            $storedPaths = [];
            throw $e;
        }
    }

    /**
     * @param list<array<string, mixed>> $files
     */
    private function previewFromBodyOrFiles(string $body, array $files): string
    {
        $trimmed = trim($body);
        if ($trimmed !== '') {
            return $trimmed;
        }
        $name = basename(str_replace('\\', '/', (string) ($files[0]['name'] ?? '첨부 파일')));

        return '첨부 ' . ($name !== '' ? $name : '파일');
    }

    /**
     * @param array<string, mixed> $row
     */
    private function resolvePeerDisplayName(array $row, int $userId): string
    {
        $otherIsHigh = (int) $row['participant_low_user_id'] === $userId;
        $otherUserId = $otherIsHigh
            ? (int) $row['participant_high_user_id']
            : (int) $row['participant_low_user_id'];

        if ($this->otherUserStatus($row, $otherIsHigh, $otherUserId) === 'withdrawn') {
            $live = trim((string) ($this->otherUserRealName($row, $otherIsHigh, $otherUserId) ?? ''));

            return $live !== '' ? $live : '○○○';
        }

        if ((int) $row['initiated_by_user_id'] === $userId) {
            return (string) ($row['peer_display_name'] ?? '');
        }

        return $this->otherUserRealName($row, $otherIsHigh, $otherUserId) ?? '상대';
    }

    /** @param array<string, mixed> $row */
    private function otherUserStatus(array $row, bool $otherIsHigh, int $otherUserId): string
    {
        $key = $otherIsHigh ? 'participant_high_status' : 'participant_low_status';
        if (array_key_exists($key, $row)) {
            return (string) ($row[$key] ?? '');
        }

        return (string) ($this->repo->getUserStatus($otherUserId) ?? '');
    }

    /** @param array<string, mixed> $row */
    private function otherUserRealName(array $row, bool $otherIsHigh, int $otherUserId): ?string
    {
        $key = $otherIsHigh ? 'participant_high_real_name' : 'participant_low_real_name';
        if (array_key_exists($key, $row)) {
            $value = $row[$key];

            return $value === null ? null : (string) $value;
        }

        return $this->repo->getUserDisplayName($otherUserId);
    }
}
