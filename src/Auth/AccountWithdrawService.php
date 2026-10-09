<?php

declare(strict_types=1);

namespace Study114\Auth;

use InvalidArgumentException;
use PDO;
use RuntimeException;
use Study114\Database\Connection;
use Study114\Mail\MemberLifecycleMailer;

final class AccountWithdrawService
{
    public const CONFIRM_TEXT = '탈퇴합니다';

    /** @var array<string, array<string, array{nullable: bool}>> */
    private array $columnCache = [];

    /**
     * @return array{user_id: int, status: string}
     */
    public function withdraw(int $userId, string $confirmText): array
    {
        if ($userId < 1) {
            throw new InvalidArgumentException('로그인이 필요합니다.');
        }
        if (trim($confirmText) !== self::CONFIRM_TEXT) {
            throw new InvalidArgumentException('확인 문구가 올바르지 않습니다. 「탈퇴합니다」를 입력해 주세요.');
        }

        $pdo = Connection::get();
        $stmt = $pdo->prepare('SELECT id, status FROM users WHERE id = ? LIMIT 1');
        $stmt->execute([$userId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) {
            throw new RuntimeException('계정을 찾을 수 없습니다.');
        }

        $farewell = $this->lifecycleMailer($pdo);
        $snapshot = $farewell?->captureWithdrawSnapshot($userId);

        $this->runPurge($pdo, $userId);

        $farewell?->sendWithdrawFarewell($snapshot);

        return [
            'user_id' => $userId,
            'status' => 'withdrawn',
        ];
    }

    /**
     * 자진 탈퇴·관리자 탈퇴가 같이 부르는 정리.
     * 호출한 쪽이 트랜잭션을 연다.
     */
    public function purgeWithdrawnAccount(PDO $pdo, int $userId): void
    {
        if ($userId < 1) {
            throw new InvalidArgumentException('회원을 찾을 수 없습니다.');
        }

        $maskedName = $this->maskDisplayName($this->readProfileName($pdo, $userId));
        $this->markWithdrawn($pdo, $userId);
        $this->releaseLoginIdentifiers($pdo, $userId);
        $this->anonymizeProfile($pdo, $userId, $maskedName);
        $this->deactivateRoles($pdo, $userId);
        $this->anonymizeStudents($pdo, $userId);
        $this->deletePersonalRows($pdo, $userId);
        $this->endActivePositionSubscriptions($pdo, $userId);
    }

    /**
     * 활성 노출 구독(Prime/Pick)을 오늘 자로 종료한다. 행은 지우지 않는다.
     * 활성은 CURDATE() < end_exclusive_on. 종료는 그 반개구간을 오늘로 당긴다.
     */
    public function endActivePositionSubscriptions(PDO $pdo, int $userId): void
    {
        if ($userId < 1) {
            return;
        }
        $pdo->prepare(
            'UPDATE provider_position_subscriptions
             SET end_exclusive_on = CURDATE(), ends_at = TIMESTAMP(CURDATE())
             WHERE user_id = ? AND CURDATE() < end_exclusive_on'
        )->execute([$userId]);
    }

    /**
     * 탈퇴 행이 로그인 ID(이메일)·소셜 연동을 붙잡고 있지 않게 한다.
     * UNIQUE(email) 때문에 같은 메일로 재가입이 막히던 상태를 푼다.
     */
    public function releaseLoginIdentifiers(PDO $pdo, int $userId): void
    {
        if ($userId < 1) {
            return;
        }
        $tombstone = sprintf(
            'withdrawn.%d.%s@users.study114.local',
            $userId,
            bin2hex(random_bytes(4))
        );
        $pdo->prepare(
            'UPDATE users SET email = ?, email_verified_at = NULL, updated_at = NOW() WHERE id = ? LIMIT 1'
        )->execute([$tombstone, $userId]);

        try {
            $pdo->prepare('DELETE FROM user_oauth_accounts WHERE user_id = ?')->execute([$userId]);
        } catch (\Throwable $e) {
            error_log('[withdraw] oauth unlink: ' . $e->getMessage());
        }
        try {
            (new AuthTokenRepository($pdo))->invalidateAll($userId);
        } catch (\Throwable $e) {
            error_log('[withdraw] tokens: ' . $e->getMessage());
        }
    }

    public static function maskDisplayName(?string $name): string
    {
        $name = trim((string) $name);
        if ($name === '') {
            return '○○○';
        }
        $first = mb_substr($name, 0, 1, 'UTF-8');
        if ($first === '' || $first === '○') {
            return '○○○';
        }

        return $first . '○○';
    }

    /** 본인 탈퇴 완료 메일. 관리자 강제 탈퇴(purgeWithdrawnAccount 직접 호출)에서는 보내지 않는다. */
    private function lifecycleMailer(PDO $pdo): ?MemberLifecycleMailer
    {
        try {
            return new MemberLifecycleMailer($pdo);
        } catch (\Throwable $e) {
            error_log('[lifecycle-mail] withdraw hook: ' . $e->getMessage());

            return null;
        }
    }

    private function runPurge(PDO $pdo, int $userId): void
    {
        $pdo->beginTransaction();
        try {
            $this->purgeWithdrawnAccount($pdo, $userId);
            $pdo->commit();
        } catch (\Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $e;
        }
    }

    private function markWithdrawn(PDO $pdo, int $userId): void
    {
        $cols = $this->columnMeta($pdo, 'users');
        $sets = [
            'status = ?',
            'deleted_at = COALESCE(deleted_at, ?)',
            'password_hash = ?',
            'updated_at = NOW()',
        ];
        $params = ['withdrawn', date('Y-m-d H:i:s'), $this->invalidPasswordHash()];
        if (isset($cols['email_verified_at'])) {
            $sets[] = 'email_verified_at = NULL';
        }
        if (isset($cols['oauth_role_pending'])) {
            $sets[] = 'oauth_role_pending = 0';
        }
        if (isset($cols['must_change_password'])) {
            $sets[] = 'must_change_password = 0';
        }
        $params[] = $userId;
        $sql = 'UPDATE users SET ' . implode(', ', $sets) . ' WHERE id = ? LIMIT 1';
        $ok = $pdo->prepare($sql)->execute($params);
        if (!$ok) {
            throw new RuntimeException('탈퇴 처리에 실패했습니다.');
        }
    }

    /** bcrypt가 아닌 값이라 password_verify가 실패한다. */
    private function invalidPasswordHash(): string
    {
        return 'withdrawn:' . bin2hex(random_bytes(16));
    }

    private function readProfileName(PDO $pdo, int $userId): string
    {
        $cols = $this->columnMeta($pdo, 'user_profiles');
        $nameCol = isset($cols['real_name']) ? 'real_name' : (isset($cols['name']) ? 'name' : '');
        if ($nameCol === '') {
            return '';
        }
        $stmt = $pdo->prepare("SELECT {$nameCol} FROM user_profiles WHERE user_id = ? LIMIT 1");
        $stmt->execute([$userId]);
        $name = $stmt->fetchColumn();

        return $name === false ? '' : (string) $name;
    }

    private function anonymizeProfile(PDO $pdo, int $userId, string $maskedName): void
    {
        $cols = $this->columnMeta($pdo, 'user_profiles');
        if ($cols === []) {
            return;
        }
        $sets = [];
        $params = [];
        $put = function (string $column, mixed $value) use (&$sets, &$params, $cols): void {
            if (!isset($cols[$column])) {
                return;
            }
            $sets[] = $column . ' = ?';
            $params[] = $value;
        };
        $clear = function (string $column) use ($put, $cols): void {
            if (!isset($cols[$column])) {
                return;
            }
            $put($column, $cols[$column]['nullable'] ? null : '');
        };

        $put(isset($cols['real_name']) ? 'real_name' : 'name', $maskedName);
        foreach ([
            'phone',
            'phone_verified_at',
            'phone_verified_method',
            'phone_verified_phone',
            'phone_verification_code_hash',
            'phone_verification_expires_at',
            'phone_verification_requested_at',
            'gender',
            'birth_date',
            'address_line1',
            'address',
            'address_zip',
            'address_line2',
            'home_address_detail',
            'activity_address_detail',
        ] as $column) {
            $clear($column);
        }
        foreach (['default_region_id', 'default_complex_id', 'home_region_id', 'home_complex_id', 'activity_region_id', 'activity_complex_id'] as $column) {
            $clear($column);
        }
        foreach (['phone_verification_attempts', 'sms_opt_in', 'email_opt_in', 'safe_number_opt_in', 'sms_consent', 'email_consent', 'safe_number_use'] as $column) {
            $put($column, 0);
        }
        if ($sets === []) {
            return;
        }
        $params[] = $userId;
        $pdo->prepare(
            'UPDATE user_profiles SET ' . implode(', ', $sets) . ' WHERE user_id = ? LIMIT 1'
        )->execute($params);
    }

    private function deactivateRoles(PDO $pdo, int $userId): void
    {
        $cols = $this->columnMeta($pdo, 'user_roles');
        if (!isset($cols['status'])) {
            return;
        }
        $pdo->prepare(
            "UPDATE user_roles SET status = 'inactive' WHERE user_id = ?"
        )->execute([$userId]);
    }

    private function anonymizeStudents(PDO $pdo, int $userId): void
    {
        $cols = $this->columnMeta($pdo, 'students');
        $ownerCol = isset($cols['guardian_user_id']) ? 'guardian_user_id' : (isset($cols['user_id']) ? 'user_id' : '');
        $nameCol = isset($cols['student_name']) ? 'student_name' : (isset($cols['name']) ? 'name' : '');
        if ($ownerCol === '' || $nameCol === '') {
            return;
        }
        $stmt = $pdo->prepare("SELECT id, {$nameCol} AS student_name FROM students WHERE {$ownerCol} = ?");
        $stmt->execute([$userId]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
        foreach ($rows as $row) {
            $masked = self::maskDisplayName((string) ($row['student_name'] ?? ''));
            $sets = [$nameCol . ' = ?'];
            $params = [$masked];
            if (isset($cols['public_display_name'])) {
                $sets[] = 'public_display_name = ?';
                $params[] = $masked;
            }
            foreach (['gender', 'birth_year', 'contact_time_note', 'school_name'] as $column) {
                if (!isset($cols[$column])) {
                    continue;
                }
                $sets[] = $column . ' = ?';
                $params[] = $cols[$column]['nullable'] ? null : '';
            }
            $params[] = (int) $row['id'];
            $pdo->prepare(
                'UPDATE students SET ' . implode(', ', $sets) . ' WHERE id = ? LIMIT 1'
            )->execute($params);
        }
    }

    private function deletePersonalRows(PDO $pdo, int $userId): void
    {
        $this->deleteByUser($pdo, 'user_favorites', $userId);
        $this->deleteByUser($pdo, 'user_recent_views', $userId);
        $this->deleteByUser($pdo, 'user_compare_items', $userId);
        $this->deleteRecommendations($pdo, $userId);
    }

    private function deleteRecommendations(PDO $pdo, int $userId): void
    {
        if ($this->columnMeta($pdo, 'user_recommendations') === []) {
            return;
        }
        try {
            $stmt = $pdo->prepare(
                'SELECT target_type, target_id FROM user_recommendations WHERE user_id = ?'
            );
            $stmt->execute([$userId]);
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
            foreach ($rows as $row) {
                $type = (string) ($row['target_type'] ?? '');
                $table = $type === 'tutor' ? 'tutors' : ($type === 'study_room' ? 'study_rooms' : '');
                $targetId = (int) ($row['target_id'] ?? 0);
                if ($table === '' || $targetId < 1 || !isset($this->columnMeta($pdo, $table)['recommend_count'])) {
                    continue;
                }
                $pdo->prepare(
                    "UPDATE {$table}
                     SET recommend_count = IF(recommend_count > 0, recommend_count - 1, 0)
                     WHERE id = ?"
                )->execute([$targetId]);
            }
            $pdo->prepare('DELETE FROM user_recommendations WHERE user_id = ?')->execute([$userId]);
        } catch (\Throwable $e) {
            error_log('[withdraw] recommendations: ' . $e->getMessage());
        }
    }

    private function deleteByUser(PDO $pdo, string $table, int $userId): void
    {
        if (!in_array($table, ['user_favorites', 'user_recent_views', 'user_compare_items'], true)) {
            return;
        }
        if ($this->columnMeta($pdo, $table) === []) {
            return;
        }
        try {
            $pdo->prepare("DELETE FROM {$table} WHERE user_id = ?")->execute([$userId]);
        } catch (\Throwable $e) {
            error_log('[withdraw] ' . $table . ': ' . $e->getMessage());
        }
    }

    /**
     * @return array<string, array{nullable: bool}>
     */
    private function columnMeta(PDO $pdo, string $table): array
    {
        if (isset($this->columnCache[$table])) {
            return $this->columnCache[$table];
        }
        $allowed = [
            'users',
            'user_profiles',
            'user_roles',
            'students',
            'user_favorites',
            'user_recent_views',
            'user_compare_items',
            'user_recommendations',
            'study_rooms',
            'tutors',
        ];
        if (!in_array($table, $allowed, true)) {
            return $this->columnCache[$table] = [];
        }
        try {
            $stmt = $pdo->query('SHOW COLUMNS FROM ' . $table);
            $meta = [];
            foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) ?: [] as $col) {
                $name = (string) ($col['Field'] ?? '');
                if ($name === '') {
                    continue;
                }
                $meta[$name] = ['nullable' => strtoupper((string) ($col['Null'] ?? '')) === 'YES'];
            }

            return $this->columnCache[$table] = $meta;
        } catch (\Throwable $e) {
            error_log('[withdraw] columns ' . $table . ': ' . $e->getMessage());

            return $this->columnCache[$table] = [];
        }
    }
}
