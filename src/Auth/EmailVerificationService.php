<?php

declare(strict_types=1);

namespace Study114\Auth;

use PDO;
use Study114\Database\Connection;

/** §16-2 — 행동 전 이메일 인증 */
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

    public function sendVerification(int $userId): void
    {
        $stmt = Connection::get()->prepare(
            'SELECT email, email_verified_at FROM users WHERE id = ? AND status = ? LIMIT 1'
        );
        $stmt->execute([$userId, 'active']);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!is_array($row)) {
            throw new \InvalidArgumentException('계정을 찾을 수 없습니다.');
        }
        if ($row['email_verified_at'] !== null) {
            return;
        }

        $email = (string) $row['email'];
        $this->tokens->invalidatePurpose($userId, 'email_verify');
        $raw = $this->tokens->create($userId, 'email_verify', (int) $this->config['email_verify_ttl_minutes']);

        $link = $this->config['api_base'] . '/api/auth/email/verify.php?token=' . rawurlencode($raw);
        $this->mailer->send(
            $email,
            '[우동공과] 이메일 인증',
            "안녕하세요.\n\n아래 링크를 눌러 이메일 인증을 완료해 주세요.\n\n{$link}\n\n공개·쪽지·결제 등 일부 기능은 인증 후 이용할 수 있습니다."
        );
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
