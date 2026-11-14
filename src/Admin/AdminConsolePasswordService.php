<?php

declare(strict_types=1);

namespace Study114\Admin;

use DateTimeImmutable;
use DateTimeZone;
use PDO;
use Study114\Auth\AuthSession;
use Study114\Database\Connection;

/** 콘솔 2차 비밀번호. 판정·해시·실패·잠금·세션 시각은 이 파일만. */
final class AdminConsolePasswordService
{
    private PDO $pdo;

    public function __construct(?PDO $pdo = null)
    {
        $this->pdo = $pdo ?? Connection::get();
    }

    public function sessionIsActive(): bool
    {
        $at = AuthSession::consoleUnlockedAt();
        if ($at === null) {
            return false;
        }
        if ((time() - $at) > AdminConsolePolicy::IDLE_SECONDS) {
            AuthSession::clearConsoleUnlock();

            return false;
        }

        return true;
    }

    public function touchSession(): void
    {
        if ($this->sessionIsActive()) {
            AuthSession::markConsoleUnlocked();
        }
    }

    /** @return array<string, mixed> */
    public function publicStatus(int $userId): array
    {
        $row = $this->findRow($userId);
        $locked = $this->isLocked($row);
        $configured = $row !== null;

        return [
            'unlocked' => $this->sessionIsActive(),
            'configured' => $configured,
            'locked' => $locked,
            'remaining_attempts' => $configured && !$locked
                ? max(0, AdminConsolePolicy::MAX_FAILS - (int) $row['fail_count'])
                : 0,
            'locked_until_kst' => $locked ? $this->kstClock($row['locked_until'] ?? null) : null,
            'message' => $this->statusMessage($row, $locked),
        ];
    }

    /** 다른 관리자 API가 해제 전일 때 돌려줄 거절. */
    public function assertApiAllowed(int $userId): void
    {
        if ($this->sessionIsActive()) {
            $this->touchSession();

            return;
        }
        $row = $this->findRow($userId);
        if ($row === null) {
            throw new ConsoleGateException(403, 'console_password_unset', $this->unsetMessage());
        }
        if ($this->isLocked($row)) {
            throw new ConsoleGateException(403, 'console_locked', $this->lockedMessage($row));
        }
        throw new ConsoleGateException(403, 'console_unlock_required', '콘솔 잠금해제가 필요합니다.');
    }

    public function unlock(int $userId, string $password): void
    {
        if (!AdminConsolePolicy::accepts($password)) {
            throw new \InvalidArgumentException('비밀번호가 맞지 않아요.');
        }
        $this->pdo->beginTransaction();
        try {
            $row = $this->lockRow($userId);
            if ($row === null) {
                $this->pdo->commit();
                $this->writeLog($userId, 'console_unlock_fail', 'unset');
                throw new ConsoleGateException(403, 'console_password_unset', $this->unsetMessage());
            }
            if ($this->isLocked($row)) {
                $this->pdo->commit();
                throw new ConsoleGateException(403, 'console_locked', $this->lockedMessage($row));
            }
            if ($this->lockExpired($row)) {
                $this->clearFailure($userId);
                $row['fail_count'] = 0;
                $row['locked_until'] = null;
            }
            if (!password_verify($password, (string) $row['password_hash'])) {
                $error = $this->registerFailure($userId, (int) $row['fail_count']);
                $this->pdo->commit();
                throw $error;
            }
            $this->clearFailure($userId);
            $this->pdo->commit();
        } catch (\Throwable $e) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            throw $e;
        }
        $this->writeLog($userId, 'console_unlock_ok', null);
    }

    public function change(int $userId, string $current, string $next, string $confirm): void
    {
        if (!$this->sessionIsActive()) {
            throw new ConsoleGateException(403, 'console_unlock_required', '콘솔 잠금해제가 필요합니다.');
        }
        if ($next !== $confirm) {
            throw new \InvalidArgumentException('새 비밀번호 확인이 일치하지 않아요.');
        }
        $this->assertShape($next);
        $this->pdo->beginTransaction();
        try {
            $row = $this->lockRow($userId);
            if ($row === null) {
                $this->pdo->commit();
                throw new ConsoleGateException(403, 'console_password_unset', $this->unsetMessage());
            }
            if ($this->isLocked($row)) {
                $this->pdo->commit();
                AuthSession::clearConsoleUnlock();
                throw new ConsoleGateException(403, 'console_locked', $this->lockedMessage($row));
            }
            if (!password_verify($current, (string) $row['password_hash'])) {
                $error = $this->registerFailure($userId, (int) $row['fail_count']);
                $this->pdo->commit();
                throw $error;
            }
            $this->storeHash($userId, $next, true);
            $this->pdo->commit();
        } catch (\Throwable $e) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            throw $e;
        }
        $this->writeLog($userId, 'console_password_change', null);
    }

    public function setInitial(int $userId, string $password): void
    {
        $this->assertShape($password);
        $this->storeHash($userId, $password, true);
        $this->writeLog($userId, 'console_password_set', null);
    }

    private function registerFailure(int $userId, int $previousFails): ConsoleGateException
    {
        $next = $previousFails + 1;
        if ($next >= AdminConsolePolicy::MAX_FAILS) {
            $until = $this->utcNow()->modify('+' . AdminConsolePolicy::LOCK_SECONDS . ' seconds');
            $stmt = $this->pdo->prepare(
                'UPDATE admin_console_auth SET fail_count = ?, locked_until = ? WHERE user_id = ?'
            );
            $stmt->execute([$next, $this->formatUtc($until), $userId]);
            $this->writeLog($userId, 'console_locked', null);
            AuthSession::clearConsoleUnlock();
            $row = $this->findRow($userId);

            return new ConsoleGateException(403, 'console_locked', $this->lockedMessage($row ?? []));
        }
        $stmt = $this->pdo->prepare(
            'UPDATE admin_console_auth SET fail_count = ?, locked_until = NULL WHERE user_id = ?'
        );
        $stmt->execute([$next, $userId]);
        $this->writeLog($userId, 'console_unlock_fail', null);
        $left = AdminConsolePolicy::MAX_FAILS - $next;

        return new ConsoleGateException(
            403,
            'console_password_mismatch',
            '비밀번호가 맞지 않아요. 남은 횟수 ' . $left . '회.'
        );
    }

    private function storeHash(int $userId, string $password, bool $resetFailure): void
    {
        $hash = password_hash($password, PASSWORD_DEFAULT);
        $now = $this->formatUtc($this->utcNow());
        if ($resetFailure) {
            $stmt = $this->pdo->prepare(
                'INSERT INTO admin_console_auth (user_id, password_hash, fail_count, locked_until, updated_at)
                 VALUES (?, ?, 0, NULL, ?)
                 ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), fail_count = 0, locked_until = NULL, updated_at = VALUES(updated_at)'
            );
            $stmt->execute([$userId, $hash, $now]);

            return;
        }
        $stmt = $this->pdo->prepare(
            'UPDATE admin_console_auth SET password_hash = ?, updated_at = ? WHERE user_id = ?'
        );
        $stmt->execute([$hash, $now, $userId]);
    }

    private function clearFailure(int $userId): void
    {
        $stmt = $this->pdo->prepare(
            'UPDATE admin_console_auth SET fail_count = 0, locked_until = NULL WHERE user_id = ?'
        );
        $stmt->execute([$userId]);
    }

    /** @return array<string, mixed>|null */
    private function findRow(int $userId): ?array
    {
        $stmt = $this->pdo->prepare(
            'SELECT user_id, password_hash, fail_count, locked_until FROM admin_console_auth WHERE user_id = ? LIMIT 1'
        );
        $stmt->execute([$userId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return is_array($row) ? $row : null;
    }

    /** @return array<string, mixed>|null */
    private function lockRow(int $userId): ?array
    {
        $stmt = $this->pdo->prepare(
            'SELECT user_id, password_hash, fail_count, locked_until FROM admin_console_auth WHERE user_id = ? LIMIT 1 FOR UPDATE'
        );
        $stmt->execute([$userId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return is_array($row) ? $row : null;
    }

    /** @param array<string, mixed>|null $row */
    private function isLocked(?array $row): bool
    {
        if ($row === null) {
            return false;
        }
        $until = $this->parseUtc(isset($row['locked_until']) ? (string) $row['locked_until'] : null);
        if ($until === null) {
            return false;
        }

        return $until > $this->utcNow();
    }

    /** @param array<string, mixed>|null $row */
    private function lockExpired(?array $row): bool
    {
        if ($row === null || $row['locked_until'] === null || $row['locked_until'] === '') {
            return false;
        }

        return !$this->isLocked($row);
    }

    private function assertShape(string $password): void
    {
        if (!AdminConsolePolicy::accepts($password)) {
            throw new \InvalidArgumentException(
                '2차 비밀번호는 6자(영문 대문자 1, 소문자 1, 숫자 2, 특수문자 2)여야 해요.'
            );
        }
    }

    /** @param array<string, mixed>|null $row */
    private function statusMessage(?array $row, bool $locked): string
    {
        if ($row === null) {
            return $this->unsetMessage();
        }
        if ($locked) {
            return $this->lockedMessage($row);
        }
        if ($this->sessionIsActive()) {
            return '';
        }

        return '';
    }

    private function unsetMessage(): string
    {
        return '2차 비밀번호가 아직 등록되지 않았어요. 종현에게 문의해 주세요.';
    }

    /** @param array<string, mixed> $row */
    private function lockedMessage(array $row): string
    {
        $clock = $this->kstClock(isset($row['locked_until']) ? (string) $row['locked_until'] : null);

        return '5번 틀려 잠시 잠겼어요. ' . $clock . '(Asia/Seoul)에 다시 시도해 주세요. 풀리지 않으면 종현에게 문의해 주세요.';
    }

    private function kstClock(?string $utc): string
    {
        $dt = $this->parseUtc($utc);
        if ($dt === null) {
            return '--:--';
        }

        return $dt->setTimezone(new DateTimeZone('Asia/Seoul'))->format('H:i');
    }

    private function writeLog(int $userId, string $action, ?string $memo): void
    {
        try {
            (new AdminOperationLogRepository($this->pdo))->insert(
                (string) $userId,
                'admin_console',
                (string) $userId,
                $action,
                null,
                $memo,
                false,
                false,
            );
        } catch (\Throwable $e) {
            error_log('[admin-console] log failed action=' . $action);
        }
    }

    private function utcNow(): DateTimeImmutable
    {
        return new DateTimeImmutable('now', new DateTimeZone('UTC'));
    }

    private function formatUtc(DateTimeImmutable $dt): string
    {
        return $dt->setTimezone(new DateTimeZone('UTC'))->format('Y-m-d H:i:s');
    }

    private function parseUtc(?string $value): ?DateTimeImmutable
    {
        if ($value === null) {
            return null;
        }
        $value = trim($value);
        if ($value === '') {
            return null;
        }
        $value = substr($value, 0, 19);
        $dt = DateTimeImmutable::createFromFormat('Y-m-d H:i:s', $value, new DateTimeZone('UTC'));

        return $dt instanceof DateTimeImmutable ? $dt : null;
    }
}
