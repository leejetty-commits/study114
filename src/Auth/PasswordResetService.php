<?php

declare(strict_types=1);

namespace Study114\Auth;

use PDO;
use Study114\Database\Connection;

/** 9장 부록 §17 — 이메일 링크 비밀번호 재설정 */
final class PasswordResetService
{
    private AuthTokenRepository $tokens;
    private AuthMailer $mailer;
    /** @var array<string, mixed> */
    private array $config;

    public function __construct()
    {
        $this->config = study114_config('auth');
        $pdo = Connection::get();
        $this->tokens = new AuthTokenRepository($pdo);
        $this->mailer = new AuthMailer();
    }

    /**
     * @return array{sent: bool, resend_available_in: int}
     *   sent — mail actually dispatched (internal; not exposed to client)
     *   resend_available_in — seconds until next send allowed (always returned for valid email format)
     */
    public function requestReset(string $email): array
    {
        $cooldown = (int) ($this->config['password_reset_resend_cooldown_seconds'] ?? 180);
        if ($cooldown < 1) {
            $cooldown = 180;
        }

        $email = EmailNormalizer::normalize($email);
        if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return ['sent' => false, 'resend_available_in' => 0];
        }

        $stmt = Connection::get()->prepare(
            'SELECT u.id, u.email, p.real_name AS name, p.phone
             FROM users u
             INNER JOIN user_profiles p ON p.user_id = u.id
             WHERE u.email = ? AND u.status = ?
             LIMIT 1'
        );
        $stmt->execute([$email, 'active']);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!is_array($row)) {
            // Account enumeration protection: same cooldown surface as a real send.
            return ['sent' => false, 'resend_available_in' => $cooldown];
        }

        $userId = (int) $row['id'];
        $remaining = $this->tokens->resendSecondsRemaining($userId, 'password_reset', $cooldown);
        if ($remaining > 0) {
            return ['sent' => false, 'resend_available_in' => $remaining];
        }

        $this->tokens->invalidatePurpose($userId, 'password_reset');
        $raw = $this->tokens->create($userId, 'password_reset', (int) $this->config['password_reset_ttl_minutes']);

        $link = $this->config['auth_ui'] . '/#/reset-password?token=' . rawurlencode($raw);
        $mail = PasswordResetMailTemplate::build(
            $link,
            (int) $this->config['password_reset_ttl_minutes']
        );
        $this->mailer->send($email, $mail['subject'], $mail['plain'], $mail['html']);

        return ['sent' => true, 'resend_available_in' => $cooldown];
    }

    /** @return 'valid'|'expired'|'used'|'invalid' */
    public function inspectResetToken(string $rawToken): string
    {
        return $this->tokens->inspect($rawToken, 'password_reset');
    }

    public function resetWithToken(string $rawToken, string $password, string $confirm): void
    {
        $status = $this->inspectResetToken($rawToken);
        if ($status === 'expired') {
            throw new PasswordResetTokenException('expired', '비밀번호 재설정 링크의 유효 시간이 지났습니다.');
        }
        if ($status === 'used') {
            throw new PasswordResetTokenException('used', '이 링크는 이미 사용되어 다시 사용할 수 없습니다.');
        }
        if ($status === 'invalid') {
            throw new PasswordResetTokenException('invalid', '링크가 올바르지 않거나 더 이상 사용할 수 없습니다.');
        }

        $consumed = $this->tokens->consumeValid($rawToken, 'password_reset');
        if ($consumed === null) {
            throw new PasswordResetTokenException('invalid', '링크가 올바르지 않거나 더 이상 사용할 수 없습니다.');
        }

        $userId = $consumed['user_id'];
        $stmt = Connection::get()->prepare(
            'SELECT u.email, p.real_name AS name, p.phone
             FROM users u
             INNER JOIN user_profiles p ON p.user_id = u.id
             WHERE u.id = ?
             LIMIT 1'
        );
        $stmt->execute([$userId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        $email = is_array($row) ? (string) $row['email'] : '';

        try {
            (new PasswordPolicy())->validate($password, $confirm, [
                'email' => $email,
                'name'  => is_array($row) ? (string) ($row['name'] ?? '') : '',
                'phone' => is_array($row) ? (string) ($row['phone'] ?? '') : '',
            ]);
        } catch (\InvalidArgumentException $e) {
            $msg = $e->getMessage();
            if (str_contains($msg, '일치')) {
                throw new \InvalidArgumentException('비밀번호가 서로 일치하지 않습니다.', 0, $e);
            }
            if (str_contains($msg, '8~14')) {
                throw new \InvalidArgumentException('8~14자 이내로 입력해 주세요.', 0, $e);
            }
            if (str_contains($msg, '영문') || str_contains($msg, '숫자') || str_contains($msg, '특수')) {
                throw new \InvalidArgumentException('영문, 숫자, 특수문자를 모두 포함해 주세요.', 0, $e);
            }
            throw new \InvalidArgumentException(
                '사용할 수 없는 비밀번호입니다. 더 안전한 비밀번호로 다시 입력해 주세요.',
                0,
                $e
            );
        }

        $hash = password_hash($password, PASSWORD_BCRYPT);
        if ($hash === false) {
            throw new \RuntimeException('비밀번호 저장에 실패했습니다.');
        }

        $pdo = Connection::get();
        $pdo->prepare('UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?')
            ->execute([$hash, $userId]);
        $this->tokens->invalidatePurpose($userId, 'password_reset');
    }
}
