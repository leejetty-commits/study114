<?php

declare(strict_types=1);

namespace Study114\Auth;

use PDO;
use Study114\Database\Connection;

/** user_profiles — 쪽지 수신 ON 내부 신뢰도 점검 (SMS OTP) */
final class PhoneVerificationService
{
    private const CODE_TTL_SECONDS = 180;
    private const RESEND_COOLDOWN_SECONDS = 60;
    private const MAX_ATTEMPTS = 5;

    /** @var array<string, mixed> */
    private array $config;

    private PhoneOtpSmsSender $sms;

    public function __construct(?PhoneOtpSmsSender $sms = null)
    {
        $this->config = study114_config('auth');
        $this->sms = $sms ?? new PhoneOtpSmsSender();
    }

    public function isVerified(int $userId): bool
    {
        $row = $this->profileRow($userId);
        if ($row === null) {
            return false;
        }
        if ($row['phone_verified_at'] === null || $row['phone_verified_at'] === '') {
            return false;
        }
        $current = PhoneNormalizer::digits((string) ($row['phone'] ?? ''));
        if (!PhoneNormalizer::isValidMobile($current)) {
            return false;
        }
        $verifiedPhone = PhoneNormalizer::digits((string) ($row['phone_verified_phone'] ?? ''));
        if ($verifiedPhone !== '' && $verifiedPhone !== $current) {
            return false;
        }

        return true;
    }

    /**
     * @return array{sent: bool, resend_available_in: int, already_verified: bool, masked_phone: string}
     */
    public function sendOtp(int $userId): array
    {
        if ($this->isVerified($userId)) {
            return [
                'sent' => false,
                'resend_available_in' => 0,
                'already_verified' => true,
                'masked_phone' => '',
            ];
        }

        $row = $this->profileRow($userId);
        if ($row === null) {
            throw new PhoneVerificationException('phone_missing', '회원 기본 연락처를 먼저 등록해 주세요.');
        }

        $phone = PhoneNormalizer::digits((string) ($row['phone'] ?? ''));
        if (!PhoneNormalizer::isValidMobile($phone)) {
            throw new PhoneVerificationException('phone_missing', '회원 기본 연락처를 먼저 등록해 주세요.');
        }

        $remaining = $this->resendSecondsRemaining($row);
        if ($remaining > 0) {
            throw new PhoneVerificationException(
                'resend_cooldown',
                '잠시 후 다시 인증번호를 받을 수 있습니다.',
                $remaining
            );
        }

        $code = $this->generateCode();
        $hash = $this->hashCode($userId, $code);
        $expires = date('Y-m-d H:i:s', time() + self::CODE_TTL_SECONDS);
        $now = date('Y-m-d H:i:s');

        $pdo = Connection::get();
        $stmt = $pdo->prepare(
            'UPDATE user_profiles SET
                phone_verification_code_hash = ?,
                phone_verification_expires_at = ?,
                phone_verification_attempts = 0,
                phone_verification_requested_at = ?,
                updated_at = NOW()
             WHERE user_id = ?'
        );
        $stmt->execute([$hash, $expires, $now, $userId]);

        $this->sms->sendOtp($phone, $code);

        return [
            'sent' => true,
            'resend_available_in' => self::RESEND_COOLDOWN_SECONDS,
            'already_verified' => false,
            'masked_phone' => self::maskPhone($phone),
        ];
    }

    /**
     * @return array{phone_verified: bool}
     */
    public function verifyOtp(int $userId, string $rawCode): array
    {
        if ($this->isVerified($userId)) {
            return ['phone_verified' => true];
        }

        $code = preg_replace('/\D+/', '', $rawCode) ?? '';
        if (!preg_match('/^\d{6}$/', $code)) {
            throw new PhoneVerificationException('invalid_code', '인증번호 6자리를 입력해 주세요.');
        }

        $row = $this->profileRow($userId);
        if ($row === null) {
            throw new PhoneVerificationException('phone_missing', '회원 기본 연락처를 먼저 등록해 주세요.');
        }

        $phone = PhoneNormalizer::digits((string) ($row['phone'] ?? ''));
        if (!PhoneNormalizer::isValidMobile($phone)) {
            throw new PhoneVerificationException('phone_missing', '회원 기본 연락처를 먼저 등록해 주세요.');
        }

        $attempts = (int) ($row['phone_verification_attempts'] ?? 0);
        if ($attempts >= self::MAX_ATTEMPTS) {
            throw new PhoneVerificationException(
                'too_many_attempts',
                '입력 횟수를 초과했습니다. 인증번호를 다시 받아 주세요.'
            );
        }

        $expiresAt = (string) ($row['phone_verification_expires_at'] ?? '');
        $storedHash = (string) ($row['phone_verification_code_hash'] ?? '');
        if ($storedHash === '' || $expiresAt === '') {
            throw new PhoneVerificationException('expired', '인증번호가 만료되었습니다. 다시 받아 주세요.');
        }
        if (strtotime($expiresAt) < time()) {
            $this->clearOtpState($userId);
            throw new PhoneVerificationException('expired', '인증번호가 만료되었습니다. 다시 받아 주세요.');
        }

        $expected = $this->hashCode($userId, $code);
        if (!hash_equals($storedHash, $expected)) {
            $nextAttempts = $attempts + 1;
            Connection::get()->prepare(
                'UPDATE user_profiles SET phone_verification_attempts = ?, updated_at = NOW() WHERE user_id = ?'
            )->execute([$nextAttempts, $userId]);

            if ($nextAttempts >= self::MAX_ATTEMPTS) {
                $this->clearOtpState($userId);
                throw new PhoneVerificationException(
                    'too_many_attempts',
                    '입력 횟수를 초과했습니다. 인증번호를 다시 받아 주세요.'
                );
            }

            throw new PhoneVerificationException('invalid_code', '인증번호가 올바르지 않습니다.');
        }

        $pdo = Connection::get();
        $pdo->prepare(
            'UPDATE user_profiles SET
                phone_verified_at = NOW(),
                phone_verified_method = ?,
                phone_verified_phone = ?,
                phone_verification_code_hash = NULL,
                phone_verification_expires_at = NULL,
                phone_verification_attempts = 0,
                phone_verification_requested_at = NULL,
                updated_at = NOW()
             WHERE user_id = ?'
        )->execute(['sms_otp', $phone, $userId]);

        return ['phone_verified' => true];
    }

    /** 휴대폰 번호 변경 시 검증·OTP 상태 초기화 */
    public function invalidateOnPhoneChange(int $userId, ?PDO $pdo = null): void
    {
        $db = $pdo ?? Connection::get();
        $db->prepare(
            'UPDATE user_profiles SET
                phone_verified_at = NULL,
                phone_verified_method = NULL,
                phone_verified_phone = NULL,
                phone_verification_code_hash = NULL,
                phone_verification_expires_at = NULL,
                phone_verification_attempts = 0,
                phone_verification_requested_at = NULL,
                updated_at = NOW()
             WHERE user_id = ?'
        )->execute([$userId]);
    }

    /** @return array<string, mixed>|null */
    private function profileRow(int $userId): ?array
    {
        $stmt = Connection::get()->prepare(
            'SELECT phone, phone_verified_at, phone_verified_phone,
                    phone_verification_code_hash, phone_verification_expires_at,
                    phone_verification_attempts, phone_verification_requested_at
               FROM user_profiles WHERE user_id = ? LIMIT 1'
        );
        $stmt->execute([$userId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return is_array($row) ? $row : null;
    }

    /** @param array<string, mixed> $row */
    private function resendSecondsRemaining(array $row): int
    {
        $requested = (string) ($row['phone_verification_requested_at'] ?? '');
        if ($requested === '') {
            return 0;
        }
        $elapsed = time() - (int) strtotime($requested);
        $cooldown = (int) ($this->config['phone_otp_resend_cooldown_seconds'] ?? self::RESEND_COOLDOWN_SECONDS);
        if ($cooldown < 1) {
            $cooldown = self::RESEND_COOLDOWN_SECONDS;
        }

        return max(0, $cooldown - $elapsed);
    }

    private function generateCode(): string
    {
        return str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    }

    private function hashCode(int $userId, string $code): string
    {
        $pepper = (string) ($this->config['phone_otp_pepper'] ?? 'study114-phone-otp-dev');

        return hash('sha256', $pepper . '|' . $userId . '|' . $code);
    }

    private function clearOtpState(int $userId): void
    {
        Connection::get()->prepare(
            'UPDATE user_profiles SET
                phone_verification_code_hash = NULL,
                phone_verification_expires_at = NULL,
                phone_verification_attempts = 0,
                updated_at = NOW()
             WHERE user_id = ?'
        )->execute([$userId]);
    }

    public static function maskPhone(string $phoneDigits): string
    {
        $d = PhoneNormalizer::digits($phoneDigits);
        if (strlen($d) < 10) {
            return $d;
        }

        return substr($d, 0, 3) . '-****-' . substr($d, -4);
    }
}
