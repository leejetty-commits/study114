<?php

declare(strict_types=1);

namespace Study114\Auth;

use InvalidArgumentException;
use PDO;
use Study114\Database\Connection;

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
     */
    public function save(int $userId, array $input): void
    {
        $status = $this->status($userId);
        $phone = PhoneNormalizer::digits((string) ($input['phone'] ?? ''));
        if (!PhoneNormalizer::isValidMobile($phone)) {
            throw new InvalidArgumentException('휴대폰 번호를 정확히 입력해 주세요.');
        }

        $pdo = Connection::get();
        $pdo->prepare('UPDATE user_profiles SET phone = ? WHERE user_id = ?')->execute([$phone, $userId]);

        if ($status['needs_email']) {
            $email = EmailNormalizer::normalize((string) ($input['email'] ?? ''));
            if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
                throw new InvalidArgumentException('로그인에 쓸 이메일을 입력해 주세요.');
            }
            if ($this->isInternalEmail($email)) {
                throw new InvalidArgumentException('실제 사용 중인 이메일을 입력해 주세요.');
            }
            $dup = $pdo->prepare('SELECT 1 FROM users WHERE email = ? AND id <> ? LIMIT 1');
            $dup->execute([$email, $userId]);
            if ($dup->fetchColumn()) {
                throw new InvalidArgumentException('이미 사용 중인 이메일입니다.');
            }
            $pdo->prepare('UPDATE users SET email = ? WHERE id = ?')->execute([$email, $userId]);
        }
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
}
