<?php

declare(strict_types=1);

namespace Study114\Admin;

use InvalidArgumentException;
use PDO;
use Study114\Auth\AccountWithdrawService;
use Study114\Database\Connection;
use Throwable;

/**
 * 관리자 회원 삭제. 탈퇴(applyAction withdraw)와 별도.
 * 결제 없음: 회원 행까지 삭제. 결제 있음: 행을 남기고 숨김.
 */
final class AdminMemberDeleteService
{
    private PDO $pdo;
    private AdminMemberRepository $repo;
    private AdminOperationLogRepository $logs;
    private AdminRoleService $roles;

    public function __construct(
        ?PDO $pdo = null,
        ?AdminMemberRepository $repo = null,
        ?AdminOperationLogRepository $logs = null,
        ?AdminRoleService $roles = null,
    ) {
        $this->pdo = $pdo ?? Connection::get();
        $this->repo = $repo ?? new AdminMemberRepository($this->pdo);
        $this->logs = $logs ?? new AdminOperationLogRepository($this->pdo);
        $this->roles = $roles ?? new AdminRoleService();
    }

    /**
     * @param array{user_id?: int, email?: string, role_type?: string, admin_level?: ?string} $auth
     * @param array<string, mixed> $input
     * @return array{user_id: int, mode: string, has_payment: bool, message: string, log: array<string, mixed>}
     */
    public function delete(array $auth, array $input): array
    {
        if (!$this->roles->isMaster($auth)) {
            throw new InvalidArgumentException('회원 삭제는 마스터만 할 수 있습니다.');
        }

        $userId = (int) ($input['user_id'] ?? $input['id'] ?? 0);
        if ($userId <= 0) {
            throw new InvalidArgumentException('user_id가 필요합니다.');
        }
        if ($userId === (int) ($auth['user_id'] ?? 0)) {
            throw new InvalidArgumentException('자기 자신은 삭제할 수 없습니다.');
        }

        $confirmEmail = (string) ($input['confirmEmail'] ?? $input['confirm_email'] ?? '');
        $uploadPaths = [];
        $uploadRooms = [];
        $uploadTutors = [];

        $this->pdo->beginTransaction();
        try {
            $row = $this->lockUser($userId);
            if ($row === null) {
                throw new InvalidArgumentException('회원을 찾을 수 없습니다.');
            }
            $email = (string) ($row['email'] ?? '');
            if ($this->roles->isMasterEmail($email)) {
                throw new InvalidArgumentException('마스터 계정은 삭제할 수 없습니다.');
            }
            if ((string) ($row['status'] ?? '') === 'withdrawn') {
                throw new InvalidArgumentException('이미 탈퇴 처리된 계정입니다.');
            }
            if ($confirmEmail !== $email) {
                throw new InvalidArgumentException('확인 이메일이 일치하지 않습니다.');
            }

            $hasPayment = $this->lockHasPayment($userId);
            $roomIds = $this->idsFor('SELECT id FROM study_rooms WHERE user_id = ?', $userId);
            $tutorIds = $this->idsFor('SELECT id FROM tutors WHERE user_id = ?', $userId);
            $studentIds = $this->idsFor('SELECT id FROM students WHERE guardian_user_id = ?', $userId);
            $name = trim((string) ($row['real_name'] ?? ''));
            $memo = sprintf(
                '삭제 전 이메일 %s · 이름 %s · 역할 %s · 공부방 %d · 과외쌤 %d · 학생 %d · %s · %s',
                $email,
                $name !== '' ? $name : '—',
                $this->roleLabel($userId),
                count($roomIds),
                count($tutorIds),
                count($studentIds),
                $hasPayment ? '결제 있음' : '결제 없음',
                $hasPayment ? '홈·찾기에서 숨김' : '완전 삭제',
            );

            $this->deleteImmediate($userId, $roomIds, $tutorIds, $studentIds);

            if ($hasPayment) {
                $log = $this->logs->insert(
                    (string) ($auth['email'] ?? 'admin'),
                    'user',
                    (string) $userId,
                    'account_delete',
                    'member_ops',
                    $memo,
                    false,
                    false,
                );
                $this->pdo->prepare(
                    'UPDATE users
                     SET status = \'withdrawn\', deleted_at = COALESCE(deleted_at, NOW()), updated_at = NOW()
                     WHERE id = ?'
                )->execute([$userId]);
                $this->pdo->prepare(
                    'UPDATE user_roles SET status = \'inactive\' WHERE user_id = ?'
                )->execute([$userId]);
                (new AccountWithdrawService())->releaseLoginIdentifiers($this->pdo, $userId);
                $mode = 'hidden_hold';
                $message = '홈·찾기에서 사라졌고, 결제 기록은 남아요';
            } else {
                $uploadPaths = $this->collectCardUploadPaths($roomIds, $tutorIds);
                $uploadRooms = $roomIds;
                $uploadTutors = $tutorIds;
                $this->deleteCards($userId, $roomIds);
                $log = $this->logs->insert(
                    (string) ($auth['email'] ?? 'admin'),
                    'user',
                    (string) $userId,
                    'account_delete',
                    'member_ops',
                    $memo,
                    false,
                    false,
                );
                $this->pdo->prepare('DELETE FROM users WHERE id = ?')->execute([$userId]);
                $mode = 'full_delete';
                $message = '모든 정보가 삭제됐어요';
            }

            $this->pdo->commit();
        } catch (Throwable $e) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            throw $e;
        }

        $mapped = $this->mapLog($log);
        if ($mode === 'full_delete') {
            $mapped['detailMemo'] = $this->appendUploadResult(
                (string) ($log['log_key'] ?? ''),
                (string) ($mapped['detailMemo'] ?? ''),
                $uploadPaths,
                $uploadRooms,
                $uploadTutors,
            );
        }

        return [
            'user_id' => $userId,
            'mode' => $mode,
            'has_payment' => $hasPayment,
            'message' => $message,
            'log' => $mapped,
        ];
    }

    /**
     * 카드 행을 지우기 전에 경로만 모은다. 파일은 커밋 뒤에 지운다.
     *
     * @param list<int> $roomIds
     * @param list<int> $tutorIds
     * @return list<string>
     */
    private function collectCardUploadPaths(array $roomIds, array $tutorIds): array
    {
        $paths = [];
        if ($roomIds !== []) {
            $paths = array_merge($paths, $this->columnValues(
                'study_room_images',
                'study_room_id',
                $roomIds,
                ['image_path', 'original_path', 'prime_1280_path', 'prime_1600_path', 'basic_360_path', 'basic_720_path'],
            ));
            $paths = array_merge($paths, $this->columnValues(
                'study_room_verification_documents',
                'study_room_id',
                $roomIds,
                ['file_path', 'masked_file_path'],
            ));
        }
        if ($tutorIds !== []) {
            $paths = array_merge($paths, $this->columnValues(
                'tutor_images',
                'tutor_id',
                $tutorIds,
                ['image_path', 'original_path', 'prime_1280_path', 'prime_1600_path', 'basic_360_path', 'basic_720_path'],
            ));
            $paths = array_merge($paths, $this->columnValues(
                'tutor_verification_documents',
                'tutor_id',
                $tutorIds,
                ['document_path'],
            ));
        }

        return $paths;
    }

    /**
     * @param list<int> $ids
     * @param list<string> $columns
     * @return list<string>
     */
    private function columnValues(string $table, string $idColumn, array $ids, array $columns): array
    {
        $allowedTables = [
            'study_room_images' => 'study_room_id',
            'study_room_verification_documents' => 'study_room_id',
            'tutor_images' => 'tutor_id',
            'tutor_verification_documents' => 'tutor_id',
        ];
        if (($allowedTables[$table] ?? '') !== $idColumn || $ids === []) {
            return [];
        }
        $present = [];
        foreach ($columns as $column) {
            if ($this->pathColumnExists($table, $column)) {
                $present[] = $column;
            }
        }
        if ($present === []) {
            return [];
        }
        $stmt = $this->pdo->prepare(
            'SELECT ' . implode(', ', $present) . ' FROM ' . $table
            . ' WHERE ' . $idColumn . ' IN (' . $this->placeholders($ids) . ')'
        );
        $stmt->execute($ids);
        $paths = [];
        foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) ?: [] as $row) {
            foreach ($present as $column) {
                $paths[] = trim((string) ($row[$column] ?? ''));
            }
        }

        return $paths;
    }

    /**
     * @param list<string> $paths
     * @param list<int> $roomIds
     * @param list<int> $tutorIds
     */
    private function appendUploadResult(string $logKey, string $memo, array $paths, array $roomIds, array $tutorIds): string
    {
        try {
            $result = (new MemberUploadPurge())->purge($paths, $roomIds, $tutorIds);
            $note = '파일 건너뜀 ' . (int) $result['skipped'];
            $failed = $result['failed'];
            if ($failed !== []) {
                $note .= ' · 못 지움 ' . implode(', ', $failed);
            }
            if ($logKey !== '') {
                $this->pdo->prepare(
                    'UPDATE admin_operation_logs SET detail_memo = CONCAT(IFNULL(detail_memo, \'\'), \' · \', ?) WHERE log_key = ?'
                )->execute([$note, $logKey]);
            }

            return $memo === '' ? $note : $memo . ' · ' . $note;
        } catch (Throwable $e) {
            error_log('[member-delete] upload purge: ' . $e->getMessage());

            return $memo;
        }
    }

    /** @return array<string, mixed>|null */
    private function lockUser(int $userId): ?array
    {
        $stmt = $this->pdo->prepare(
            'SELECT u.id, u.email, u.status, p.real_name
             FROM users u
             LEFT JOIN user_profiles p ON p.user_id = u.id
             WHERE u.id = ?
             FOR UPDATE'
        );
        $stmt->execute([$userId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return is_array($row) ? $row : null;
    }

    /** AdminMemberRepository::hasPayment 과 같은 조건. 트랜잭션 안에서 행을 잠근 뒤 계산한다. */
    private function lockHasPayment(int $userId): bool
    {
        $stmt = $this->pdo->prepare(
            'SELECT status FROM provider_payment_orders WHERE user_id = ? FOR UPDATE'
        );
        $stmt->execute([$userId]);
        foreach ($stmt->fetchAll(PDO::FETCH_COLUMN) as $status) {
            if (in_array((string) $status, ['paid', 'refunded'], true)) {
                return true;
            }
        }

        return false;
    }

    /** @return list<int> */
    private function idsFor(string $sql, int $userId): array
    {
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$userId]);
        $ids = [];
        foreach ($stmt->fetchAll(PDO::FETCH_COLUMN) as $id) {
            $n = (int) $id;
            if ($n > 0) {
                $ids[] = $n;
            }
        }

        return $ids;
    }

    private function roleLabel(int $userId): string
    {
        $map = [
            'guardian_student' => '학생',
            'study_room_owner' => '공부방',
            'tutor' => '과외쌤',
            'admin' => '운영자',
        ];
        $labels = [];
        foreach ($this->repo->listRoles($userId) as $role) {
            $type = (string) ($role['role_type'] ?? '');
            $labels[] = $map[$type] ?? $type;
        }

        return $labels === [] ? '역할 없음' : implode(' · ', $labels);
    }

    /**
     * @param list<int> $roomIds
     * @param list<int> $tutorIds
     * @param list<int> $studentIds
     */
    private function deleteImmediate(int $userId, array $roomIds, array $tutorIds, array $studentIds): void
    {
        $this->pdo->prepare('DELETE FROM provider_review_replies WHERE provider_user_id = ?')->execute([$userId]);

        $reviewSql = 'DELETE FROM provider_reviews WHERE author_user_id = ?';
        $reviewParams = [$userId];
        if ($roomIds !== []) {
            $reviewSql .= ' OR (provider_type = \'study_room\' AND provider_id IN (' . $this->placeholders($roomIds) . '))';
            array_push($reviewParams, ...$roomIds);
        }
        if ($tutorIds !== []) {
            $reviewSql .= ' OR (provider_type = \'tutor\' AND provider_id IN (' . $this->placeholders($tutorIds) . '))';
            array_push($reviewParams, ...$tutorIds);
        }
        $this->pdo->prepare($reviewSql)->execute($reviewParams);

        $this->pdo->prepare('DELETE FROM provider_student_reviews WHERE provider_user_id = ?')->execute([$userId]);
        $this->pdo->prepare(
            'DELETE FROM message_threads
             WHERE participant_low_user_id = ? OR participant_high_user_id = ? OR initiated_by_user_id = ?'
        )->execute([$userId, $userId, $userId]);

        $this->deleteTargeted('user_favorites', $userId, $roomIds, $tutorIds, []);
        $this->deleteTargeted('user_compare_items', $userId, $roomIds, $tutorIds, []);
        $this->deleteTargeted('user_recent_views', $userId, $roomIds, $tutorIds, $studentIds);
        $this->deleteRecommendations($userId, $roomIds, $tutorIds);
    }

    /**
     * @param list<int> $roomIds
     * @param list<int> $tutorIds
     * @param list<int> $studentIds
     */
    private function deleteTargeted(string $table, int $userId, array $roomIds, array $tutorIds, array $studentIds): void
    {
        if (!in_array($table, ['user_favorites', 'user_recent_views', 'user_compare_items'], true)) {
            throw new InvalidArgumentException('삭제할 수 없는 테이블입니다.');
        }
        $sql = "DELETE FROM {$table} WHERE user_id = ?";
        $params = [$userId];
        if ($roomIds !== []) {
            $sql .= ' OR (target_type = \'study_room\' AND target_id IN (' . $this->placeholders($roomIds) . '))';
            array_push($params, ...$roomIds);
        }
        if ($tutorIds !== []) {
            $sql .= ' OR (target_type = \'tutor\' AND target_id IN (' . $this->placeholders($tutorIds) . '))';
            array_push($params, ...$tutorIds);
        }
        if ($studentIds !== []) {
            $sql .= ' OR (target_type = \'student\' AND target_id IN (' . $this->placeholders($studentIds) . '))';
            array_push($params, ...$studentIds);
        }
        $this->pdo->prepare($sql)->execute($params);
    }

    /**
     * @param list<int> $roomIds
     * @param list<int> $tutorIds
     */
    private function deleteRecommendations(int $userId, array $roomIds, array $tutorIds): void
    {
        $sql = 'SELECT id, target_type, target_id FROM user_recommendations WHERE user_id = ?';
        $params = [$userId];
        if ($roomIds !== []) {
            $sql .= ' OR (target_type = \'study_room\' AND target_id IN (' . $this->placeholders($roomIds) . '))';
            array_push($params, ...$roomIds);
        }
        if ($tutorIds !== []) {
            $sql .= ' OR (target_type = \'tutor\' AND target_id IN (' . $this->placeholders($tutorIds) . '))';
            array_push($params, ...$tutorIds);
        }
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
        $ids = [];
        foreach ($rows as $row) {
            $ids[] = (int) $row['id'];
            $type = (string) ($row['target_type'] ?? '');
            $targetId = (int) ($row['target_id'] ?? 0);
            $countTable = $type === 'tutor' ? 'tutors' : ($type === 'study_room' ? 'study_rooms' : '');
            if ($countTable === '' || $targetId < 1 || !$this->hasColumn($countTable, 'recommend_count')) {
                continue;
            }
            $this->pdo->prepare(
                "UPDATE {$countTable}
                 SET recommend_count = IF(recommend_count > 0, recommend_count - 1, 0)
                 WHERE id = ?"
            )->execute([$targetId]);
        }
        if ($ids !== []) {
            $this->pdo->prepare(
                'DELETE FROM user_recommendations WHERE id IN (' . $this->placeholders($ids) . ')'
            )->execute($ids);
        }
    }

    /** @param list<int> $roomIds */
    private function deleteCards(int $userId, array $roomIds): void
    {
        if ($roomIds !== []) {
            $this->pdo->prepare(
                'DELETE FROM study_room_badges WHERE study_room_id IN (' . $this->placeholders($roomIds) . ')'
            )->execute($roomIds);
        }
        $this->pdo->prepare('DELETE FROM students WHERE guardian_user_id = ?')->execute([$userId]);
        $this->pdo->prepare('DELETE FROM study_rooms WHERE user_id = ?')->execute([$userId]);
        $this->pdo->prepare('DELETE FROM tutors WHERE user_id = ?')->execute([$userId]);
        $this->pdo->prepare('DELETE FROM user_roles WHERE user_id = ?')->execute([$userId]);
        $this->pdo->prepare('DELETE FROM user_profiles WHERE user_id = ?')->execute([$userId]);
    }

    private function pathColumnExists(string $table, string $column): bool
    {
        $allowed = [
            'study_room_images' => ['image_path', 'original_path', 'prime_1280_path', 'prime_1600_path', 'basic_360_path', 'basic_720_path'],
            'study_room_verification_documents' => ['file_path', 'masked_file_path'],
            'tutor_images' => ['image_path', 'original_path', 'prime_1280_path', 'prime_1600_path', 'basic_360_path', 'basic_720_path'],
            'tutor_verification_documents' => ['document_path'],
        ];
        if (!in_array($column, $allowed[$table] ?? [], true)) {
            return false;
        }
        $stmt = $this->pdo->prepare(
            'SELECT 1 FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?'
        );
        $stmt->execute([$table, $column]);

        return $stmt->fetchColumn() !== false;
    }

    private function hasColumn(string $table, string $column): bool
    {
        if (!in_array($table, ['study_rooms', 'tutors'], true) || $column !== 'recommend_count') {
            return false;
        }
        $stmt = $this->pdo->prepare(
            'SELECT 1 FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?'
        );
        $stmt->execute([$table, $column]);

        return $stmt->fetchColumn() !== false;
    }

    /** @param list<int> $ids */
    private function placeholders(array $ids): string
    {
        return implode(',', array_fill(0, count($ids), '?'));
    }

    /** @param array<string, mixed> $row @return array<string, mixed> */
    private function mapLog(array $row): array
    {
        return [
            'id' => (string) ($row['log_key'] ?? ''),
            'targetType' => (string) ($row['target_type'] ?? ''),
            'action' => (string) ($row['action_kind'] ?? ''),
            'target' => (string) ($row['target_id'] ?? ''),
            'operator' => (string) ($row['operator_id'] ?? ''),
            'at' => (string) ($row['acted_at'] ?? ''),
            'reasonCategory' => (string) ($row['reason_category'] ?? ''),
            'detailMemo' => (string) ($row['detail_memo'] ?? ''),
            'reversible' => (bool) ($row['reversible'] ?? false),
            'userNotified' => (bool) ($row['user_notified'] ?? false),
        ];
    }
}
