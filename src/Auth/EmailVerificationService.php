<?php

declare(strict_types=1);

namespace Study114\Auth;

use PDO;
use Study114\Database\Connection;

/** 9장 C-2 — 가입 완료 조건 + 공개·쪽지 2차 게이트 */
final class EmailVerificationService
{
    private AuthTokenRepository $tokens;
    private AuthMailer $mailer;
    /** @var array<string, mixed> */
    private array $config;

    public function __construct()
    {
        $this->config = study114_config('auth');
        $this->tokens = new AuthTokenRepository(Connection::get());
        $this->mailer = new AuthMailer();
    }

    /**
     * @return array{sent: bool, resend_available_in: int, already_verified: bool}
     */
    public function sendVerification(int $userId): array
    {
        $cooldown = (int) ($this->config['email_verify_resend_cooldown_seconds'] ?? 300);
        if ($cooldown < 1) {
            $cooldown = 300;
        }

        $stmt = Connection::get()->prepare(
            'SELECT email, email_verified_at FROM users WHERE id = ? AND status = ? LIMIT 1'
        );
        $stmt->execute([$userId, 'active']);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!is_array($row)) {
            throw new \InvalidArgumentException('계정을 찾을 수 없습니다.');
        }
        if ($row['email_verified_at'] !== null) {
            return ['sent' => false, 'resend_available_in' => 0, 'already_verified' => true];
        }

        $email = (string) $row['email'];
        if ((new AccountContactService())->isInternalEmail($email)) {
            throw new \InvalidArgumentException('실제 사용 중인 이메일을 먼저 입력해 주세요.');
        }

        $remaining = $this->tokens->resendSecondsRemaining($userId, 'email_verify', $cooldown);
        if ($remaining > 0) {
            return ['sent' => false, 'resend_available_in' => $remaining, 'already_verified' => false];
        }

        $this->tokens->invalidatePurpose($userId, 'email_verify');
        $raw = $this->tokens->create($userId, 'email_verify', (int) $this->config['email_verify_ttl_minutes']);

        $link = $this->config['api_base'] . '/api/auth/email/verify.php?token=' . rawurlencode($raw);
        $this->mailer->send(
            $email,
            '[우동공과] 이메일 확인',
            "안녕하세요.\n\n가입을 완료하려면 아래 링크를 눌러 이메일을 확인해 주세요.\n\n{$link}\n\n이 메일은 로그인 및 계정 확인에 사용됩니다."
        );

        return ['sent' => true, 'resend_available_in' => $cooldown, 'already_verified' => false];
    }

    public function clearVerifiedAt(int $userId): void
    {
        Connection::get()->prepare(
            'UPDATE users SET email_verified_at = NULL, updated_at = NOW() WHERE id = ?'
        )->execute([$userId]);
        $this->tokens->invalidatePurpose($userId, 'email_verify');
    }

    public function verifyToken(string $rawToken): int
    {
        $consumed = $this->tokens->consumeValid($rawToken, 'email_verify');
        if ($consumed === null) {
            throw new \InvalidArgumentException('인증 링크가 만료되었거나 유효하지 않습니다.');
        }

        $userId = $consumed['user_id'];
        Connection::get()->prepare(
            'UPDATE users SET email_verified_at = COALESCE(email_verified_at, NOW()), updated_at = NOW() WHERE id = ?'
        )->execute([$userId]);
        $this->tokens->invalidatePurpose($userId, 'email_verify');

        return $userId;
    }
}
