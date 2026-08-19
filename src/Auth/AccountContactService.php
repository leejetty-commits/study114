<?php

declare(strict_types=1);

namespace Study114\Auth;

use InvalidArgumentException;
use PDO;
use Study114\Database\Connection;
use Throwable;

/** 가입 시 이메일·휴대폰 필수. 값은 내부 보관만 하고 회원 간 공개하지 않는다. */
final class AccountContactService
{
    /** @return array{has_phone: bool, needs_email: bool, needs_account_contact: bool, email_is_internal: bool} */
    public function status(int $userId): array
    {
        $pdo = Connection::get();
        $stmt = $pdo->prepare(
            'SELECT u.email, p.phone
               FROM users u
               LEFT JOIN user_profiles p ON p.user_id = u.id
              WHERE u.id = ? LIMIT 1'
        );
        $stmt->execute([$userId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC) ?: [];
        $phone = PhoneNormalizer::digits((string) ($row['phone'] ?? ''));
        $email = (string) ($row['email'] ?? '');
        $internal = $this->isInternalEmail($email);
        $hasPhone = PhoneNormalizer::isValidMobile($phone);

        return [
            'has_phone' => $hasPhone,
            'needs_email' => $internal,
            'email_is_internal' => $internal,
            'needs_account_contact' => !$hasPhone || $internal,
        ];
    }

    /**
     * @param array<string, mixed> $input
     * @return array{user_id: int, linked: bool}
     */
    public function save(int $userId, array $input): array
    {
        $status = $this->status($userId);
        $phone = PhoneNormalizer::digits((string) ($input['phone'] ?? ''));
        if (!PhoneNormalizer::isValidMobile($phone)) {
            throw new InvalidArgumentException(
                '휴대폰 번호를 정확히 입력해 주세요. 010-0000-0000 형식이거나 숫자만 넣어 주세요.'
            );
        }

        $pdo = Connection::get();
        $pdo->beginTransaction();
        $finalUserId = $userId;
        $linked = false;
        $replacedStubEmail = false;
        try {
            $this->upsertPhone($pdo, $userId, $phone);

            if ($status['needs_email']) {
                $email = EmailNormalizer::normalize((string) ($input['email'] ?? ''));
                if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
                    throw new InvalidArgumentException('로그인에 쓸 이메일을 입력해 주세요.');
                }
                if ($this->isInternalEmail($email)) {
                    throw new InvalidArgumentException('실제 사용 중인 이메일을 입력해 주세요.');
                }
                $dup = $pdo->prepare('SELECT id, status FROM users WHERE email = ? AND id <> ? LIMIT 1');
                $dup->execute([$email, $userId]);
                $existing = $dup->fetch(PDO::FETCH_ASSOC);
                if (is_array($existing) && (string) ($existing['status'] ?? '') === 'withdrawn') {
                    (new AccountWithdrawService())->releaseLoginIdentifiers($pdo, (int) $existing['id']);
                    $existing = false;
                }
                if (is_array($existing)) {
                    $finalUserId = $this->linkStubToExisting($pdo, $userId, (int) $existing['id'], $phone);
                    $linked = true;
                } else {
                    $pdo->prepare('UPDATE users SET email = ? WHERE id = ?')
                        ->execute([$email, $userId]);
                    $replacedStubEmail = true;
                }
            }

            $pdo->commit();
        } catch (InvalidArgumentException $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $e;
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $e;
        }

        if ($replacedStubEmail) {
            try {
                $verify = new EmailVerificationService();
                $verify->clearVerifiedAt($finalUserId);
                $verify->sendVerification($finalUserId);
            } catch (Throwable $e) {
                error_log('[account-contact] verify mail: ' . $e->getMessage());
            }
        }

        return [
            'user_id' => $finalUserId,
            'linked' => $linked,
        ];
    }

    /** @return array{user_id: int, email: string, role_type: string, name: string} */
    public function sessionUser(int $userId): array
    {
        $pdo = Connection::get();
        $stmt = $pdo->prepare(
            'SELECT u.id, u.email, IFNULL(p.real_name, \'\') AS name, IFNULL(r.role_type, \'guardian_student\') AS role_type
               FROM users u
               LEFT JOIN user_profiles p ON p.user_id = u.id
               LEFT JOIN user_roles r ON r.user_id = u.id AND r.is_primary = 1 AND r.status = ?
              WHERE u.id = ? LIMIT 1'
        );
        $stmt->execute(['active', $userId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!is_array($row)) {
            throw new InvalidArgumentException('계정을 찾을 수 없습니다.');
        }

        return [
            'user_id' => (int) $row['id'],
            'email' => (string) $row['email'],
            'role_type' => (string) $row['role_type'],
            'name' => (string) $row['name'],
        ];
    }

    public function isInternalEmail(string $email): bool
    {
        $e = strtolower(trim($email));
        if ($e === '') {
            return true;
        }
        $local = explode('@', $e)[0] ?? '';

        return str_ends_with($e, '@users.study114.local') || str_starts_with($local, 'oauth_');
    }

    private function upsertPhone(PDO $pdo, int $userId, string $phone): void
    {
        $exists = $pdo->prepare('SELECT 1 FROM user_profiles WHERE user_id = ? LIMIT 1');
        $exists->execute([$userId]);
        if ($exists->fetchColumn()) {
            $pdo->prepare('UPDATE user_profiles SET phone = ? WHERE user_id = ?')->execute([$phone, $userId]);
            return;
        }
        $pdo->prepare(
            'INSERT INTO user_profiles (user_id, real_name, phone, gender, address_line1) VALUES (?, ?, ?, NULL, ?)'
        )->execute([$userId, '', $phone, '']);
    }

    /**
     * 소셜이 이메일을 안 준 뒤, 기존 가입 이메일을 입력하면 공통 계정에 연결한다 (9장 C-7).
     */
    private function linkStubToExisting(PDO $pdo, int $stubId, int $existingId, string $phone): int
    {
        $st = $pdo->prepare('SELECT status FROM users WHERE id = ? LIMIT 1');
        $st->execute([$existingId]);
        $status = (string) ($st->fetchColumn() ?: '');
        if ($status !== 'active') {
            throw new InvalidArgumentException('이미 사용 중인 이메일입니다. 기존 계정으로 로그인해 주세요.');
        }

        $oauthStmt = $pdo->prepare(
            'SELECT id, provider, provider_user_id FROM user_oauth_accounts WHERE user_id = ?'
        );
        $oauthStmt->execute([$stubId]);
        $oauthRows = $oauthStmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

        foreach ($oauthRows as $row) {
            $conflict = $pdo->prepare(
                'SELECT provider_user_id FROM user_oauth_accounts
                  WHERE user_id = ? AND provider = ? LIMIT 1'
            );
            $conflict->execute([$existingId, $row['provider']]);
            $existingProviderUid = $conflict->fetchColumn();
            if (
                $existingProviderUid !== false
                && (string) $existingProviderUid !== (string) $row['provider_user_id']
            ) {
                throw new InvalidArgumentException(
                    '이 이메일은 이미 다른 소셜 계정과 연결되어 있습니다. 기존 계정으로 로그인해 주세요.'
                );
            }
            $pdo->prepare('UPDATE user_oauth_accounts SET user_id = ? WHERE id = ?')
                ->execute([$existingId, (int) $row['id']]);
        }

        $this->upsertPhone($pdo, $existingId, $phone);

        $pdo->prepare('DELETE FROM user_roles WHERE user_id = ?')->execute([$stubId]);
        $pdo->prepare('DELETE FROM user_profiles WHERE user_id = ?')->execute([$stubId]);
        try {
            $pdo->prepare('DELETE FROM users WHERE id = ?')->execute([$stubId]);
        } catch (Throwable $e) {
            $pdo->prepare('UPDATE users SET status = ?, deleted_at = NOW() WHERE id = ?')
                ->execute(['withdrawn', $stubId]);
        }

        return $existingId;
    }
}
