<?php

declare(strict_types=1);

namespace Study114\Auth;

use PDO;
use PDOException;
use Study114\Database\Connection;

/**
 * 공급자 가입단계 휴대폰 본인확인.
 * SMS OTP(PhoneVerificationService / phone_verified_*)와 별도 축이다.
 * sms_otp 완료값을 본인확인 완료로 보지 않는다.
 * 브라우저가 완료를 선언해도 기록하지 않는다. 서명된 업체 콜백만 기록한다.
 */
final class PhoneIdentityService
{
    public const METHOD_NICEID = 'niceid';
    public const METHOD_KMC = 'kmc';
    public const METHOD_PASS = 'pass';
    public const METHOD_PG = 'pg_partner';

    /** @var list<string> */
    public const METHODS = [
        self::METHOD_NICEID,
        self::METHOD_KMC,
        self::METHOD_PASS,
        self::METHOD_PG,
    ];

    public static function isProviderRole(string $roleType): bool
    {
        return $roleType === 'study_room_owner' || $roleType === 'tutor';
    }

    public static function normalizeMode(string $raw): string
    {
        $mode = strtolower(trim($raw));

        return in_array($mode, ['off', 'warn', 'required'], true) ? $mode : 'off';
    }

    /**
     * 업체 콜백이 운영에서 확인되기 전에는 required를 차단 모드로 올리지 않는다.
     * $vendorReady 가 true여도 이번 단계의 required는 warn이다.
     */
    public static function effectiveMode(string $requested, bool $vendorReady): string
    {
        $mode = self::normalizeMode($requested);
        if ($mode === 'off') {
            return 'off';
        }
        if ($mode === 'required' && $vendorReady) {
            return 'warn';
        }

        return 'warn';
    }

    public function configuredMode(): string
    {
        return self::normalizeMode(study114_env('STUDY114_PHONE_IDENTITY_MODE', 'off'));
    }

    public function vendorReady(): bool
    {
        $vendor = strtolower(trim(study114_env('STUDY114_PHONE_IDENTITY_VENDOR', '')));
        $secret = study114_env('STUDY114_PHONE_IDENTITY_CALLBACK_SECRET', '');
        $startUrl = study114_env('STUDY114_PHONE_IDENTITY_START_URL', '');

        return in_array($vendor, self::METHODS, true)
            && $secret !== ''
            && str_starts_with($startUrl, 'https://');
    }

    public function mode(): string
    {
        return self::effectiveMode($this->configuredMode(), $this->vendorReady());
    }

    /**
     * @return array{mode: string, prompt: bool, verified: bool, method: ?string}
     */
    public function publicState(
        int $userId,
        string $roleType,
        bool $emailVerified,
        bool $needsAccountContact,
        bool $oauthRolePending,
        bool $needsBasicRegister,
    ): array {
        $mode = $this->mode();
        if ($mode === 'off') {
            return [
                'mode' => 'off',
                'prompt' => false,
                'verified' => false,
                'method' => null,
            ];
        }

        $verified = false;
        $method = null;
        try {
            $row = $this->profileIdentity($userId);
            if (self::rowIsVerified($row)) {
                $verified = true;
                $method = (string) $row['phone_identity_method'];
            }
        } catch (PDOException $e) {
            if (!self::isMissingColumn($e)) {
                throw $e;
            }
            error_log('[phone-identity] schema missing');
        }

        $prompt = $mode === 'warn'
            && $emailVerified
            && !$needsAccountContact
            && !$oauthRolePending
            && $needsBasicRegister
            && self::isProviderRole($roleType)
            && !$verified;

        return [
            'mode' => $mode,
            'prompt' => $prompt,
            'verified' => $verified,
            'method' => $method,
        ];
    }

    /**
     * 서명된 업체 콜백만 완료로 기록한다.
     * CI/DI가 본문에 있어도 저장하지 않는다.
     *
     * @param array<string, mixed> $payload
     * @return array{verified: bool, already_verified: bool}
     */
    public function recordSignedResult(string $rawBody, string $signature, array $payload): array
    {
        $this->assertSignature($rawBody, $signature);
        if (($payload['success'] ?? false) !== true) {
            throw new PhoneIdentityException('identity_failed', '본인인증이 완료되지 않았습니다.', 422);
        }

        $userId = (int) ($payload['user_id'] ?? 0);
        $method = strtolower(trim((string) ($payload['method'] ?? '')));
        $txId = trim((string) ($payload['tx_id'] ?? ''));
        $phone = PhoneNormalizer::digits((string) ($payload['phone'] ?? ''));

        if ($userId < 1) {
            throw new PhoneIdentityException('invalid_payload', '본인인증 결과를 확인할 수 없습니다.', 422);
        }
        if (!in_array($method, self::METHODS, true)) {
            throw new PhoneIdentityException('invalid_method', '본인인증 방식을 확인할 수 없습니다.', 422);
        }
        if (!preg_match('/^[A-Za-z0-9_-]{8,64}$/', $txId)) {
            throw new PhoneIdentityException('invalid_tx', '본인인증 거래 식별자를 확인할 수 없습니다.', 422);
        }
        if (!PhoneNormalizer::isValidMobile($phone)) {
            throw new PhoneIdentityException('invalid_phone', '본인인증 휴대폰 번호를 확인할 수 없습니다.', 422);
        }

        $account = $this->accountForCallback($userId);
        if ($account === null || (string) ($account['status'] ?? '') !== 'active') {
            throw new PhoneIdentityException('not_found', '본인인증 대상을 찾을 수 없습니다.', 404);
        }
        if (($account['email_verified_at'] ?? null) === null) {
            throw new PhoneIdentityException('email_unverified', '이메일 확인 후 본인인증을 진행합니다.', 403);
        }
        $role = (string) ($account['role_type'] ?? '');
        if (!self::isProviderRole($role)) {
            throw new PhoneIdentityException('not_provider', '공급자 가입 단계에서만 본인인증을 기록합니다.', 403);
        }
        $current = PhoneNormalizer::digits((string) ($account['phone'] ?? ''));
        if ($current === '' || $current !== $phone) {
            throw new PhoneIdentityException('phone_mismatch', '계정 휴대폰 번호와 본인인증 번호가 다릅니다.', 422);
        }
        if (self::rowIsVerified($account)) {
            return ['verified' => true, 'already_verified' => true];
        }

        $stmt = Connection::get()->prepare(
            'UPDATE user_profiles
             SET phone_identity_verified_at = NOW(),
                 phone_identity_phone = ?,
                 phone_identity_method = ?,
                 phone_identity_tx_id = ?
             WHERE user_id = ?'
        );
        $stmt->execute([$phone, $method, $txId, $userId]);

        return ['verified' => true, 'already_verified' => false];
    }

    public function assertSignature(string $rawBody, string $signature): void
    {
        $secret = study114_env('STUDY114_PHONE_IDENTITY_CALLBACK_SECRET', '');
        $vendor = strtolower(trim(study114_env('STUDY114_PHONE_IDENTITY_VENDOR', '')));
        if ($secret === '' || !in_array($vendor, self::METHODS, true)) {
            throw new PhoneIdentityException(
                'vendor_not_configured',
                '본인인증 연결이 아직 준비되지 않았습니다.',
                503,
            );
        }
        $expected = hash_hmac('sha256', $rawBody, $secret);
        $given = strtolower(trim($signature));
        if ($given === '' || !hash_equals($expected, $given)) {
            throw new PhoneIdentityException('invalid_signature', '본인인증 콜백을 확인할 수 없습니다.', 401);
        }
    }

    /**
     * @param array<string, mixed>|null $row
     */
    public static function rowIsVerified(?array $row): bool
    {
        if ($row === null) {
            return false;
        }
        $at = $row['phone_identity_verified_at'] ?? null;
        if ($at === null || $at === '') {
            return false;
        }
        $method = strtolower(trim((string) ($row['phone_identity_method'] ?? '')));
        if (!in_array($method, self::METHODS, true)) {
            return false;
        }
        $current = PhoneNormalizer::digits((string) ($row['phone'] ?? ''));
        $verifiedPhone = PhoneNormalizer::digits((string) ($row['phone_identity_phone'] ?? ''));
        if (!PhoneNormalizer::isValidMobile($current) || $current !== $verifiedPhone) {
            return false;
        }

        return true;
    }

    /**
     * @return array<string, mixed>|null
     */
    private function profileIdentity(int $userId): ?array
    {
        $stmt = Connection::get()->prepare(
            'SELECT phone, phone_identity_verified_at, phone_identity_phone, phone_identity_method
             FROM user_profiles WHERE user_id = ? LIMIT 1'
        );
        $stmt->execute([$userId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return is_array($row) ? $row : null;
    }

    /**
     * @return array<string, mixed>|null
     */
    private function accountForCallback(int $userId): ?array
    {
        $stmt = Connection::get()->prepare(
            'SELECT u.status, u.email_verified_at, p.phone,
                    p.phone_identity_verified_at, p.phone_identity_phone, p.phone_identity_method,
                    (
                      SELECT ur.role_type FROM user_roles ur
                      WHERE ur.user_id = u.id AND ur.status = ?
                        AND ur.role_type IN (\'study_room_owner\', \'tutor\', \'guardian_student\')
                      ORDER BY ur.is_primary DESC, ur.id ASC
                      LIMIT 1
                    ) AS role_type
             FROM users u
             JOIN user_profiles p ON p.user_id = u.id
             WHERE u.id = ?
             LIMIT 1'
        );
        $stmt->execute(['active', $userId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return is_array($row) ? $row : null;
    }

    private static function isMissingColumn(PDOException $e): bool
    {
        $info = $e->errorInfo;
        $sqlState = is_array($info) ? (string) ($info[0] ?? '') : '';

        return $sqlState === '42S22' || str_contains($e->getMessage(), 'Unknown column');
    }
}
