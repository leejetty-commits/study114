<?php

declare(strict_types=1);

namespace Study114\Auth;

use PDO;
use Study114\Database\Connection;

/**
 * 공급자(공부방·과외쌤) 가입단계 본인확인 게이트.
 * 판정은 user_profiles.phone_verified_at / phone_verified_phone 서버 저장값만 본다.
 * 클라이언트 state · query · localStorage 우회 없음.
 *
 * 현재 검증 수단은 SMS OTP (PG/제휴형 본인확인 연동 전 stub).
 * 운영 모드: off | warn | required — STUDY114_PROVIDER_IDENTITY_MODE
 */
final class ProviderIdentityGate
{
    public const MODE_OFF = 'off';
    public const MODE_WARN = 'warn';
    public const MODE_REQUIRED = 'required';

    /** @var list<string> */
    public const PROVIDER_ROLES = ['study_room_owner', 'tutor'];

    /** @var array<string, mixed> */
    private array $config;

    public function __construct()
    {
        $this->config = study114_config('auth');
    }

    public function mode(): string
    {
        $raw = strtolower(trim((string) ($this->config['provider_identity_mode'] ?? self::MODE_WARN)));
        if (!in_array($raw, [self::MODE_OFF, self::MODE_WARN, self::MODE_REQUIRED], true)) {
            return self::MODE_WARN;
        }

        return $raw;
    }

    public function isProviderRole(string $roleType): bool
    {
        return in_array($roleType, self::PROVIDER_ROLES, true);
    }

    /**
     * QA/preview/mock 격리 환경. 운영 사용자 필드에 우회값을 쓰지 않는다.
     * OTP 자체는 같은 API를 쓰며, 발송은 SmsLogSender 로그로 남는다.
     */
    public function isMockEnvironment(): bool
    {
        if (!empty($this->config['provider_identity_mock'])) {
            return true;
        }
        $env = strtolower(trim(study114_env('STUDY114_APP_ENV', '')));

        return in_array($env, ['local', 'preview', 'qa', 'development', 'dev'], true);
    }

    public function isAllowlisted(int $userId): bool
    {
        /** @var list<string> $emails */
        $emails = $this->config['provider_identity_allowlist'] ?? [];
        if ($emails === []) {
            return false;
        }
        $stmt = Connection::get()->prepare('SELECT email FROM users WHERE id = ? LIMIT 1');
        $stmt->execute([$userId]);
        $email = strtolower(trim((string) ($stmt->fetchColumn() ?: '')));
        if ($email === '' || !in_array($email, $emails, true)) {
            return false;
        }
        error_log('[provider-identity] allowlist skip user_id=' . $userId);

        return true;
    }

    public function isVerified(int $userId): bool
    {
        return (new PhoneVerificationService())->isVerified($userId);
    }

    /**
     * 가입 선형 흐름에서 본인확인 화면을 보여줄지.
     * warn: 기본등록 전 공급자만. required: 미검증 공급자 전원.
     */
    public function needsIdentityStep(int $userId, string $roleType, bool $needsBasicRegister): bool
    {
        if (!$this->isProviderRole($roleType)) {
            return false;
        }
        if ($this->mode() === self::MODE_OFF) {
            return false;
        }
        if ($this->isAllowlisted($userId)) {
            return false;
        }
        if ($this->isVerified($userId)) {
            return false;
        }
        if ($this->mode() === self::MODE_REQUIRED) {
            return true;
        }

        return $needsBasicRegister;
    }

    /** required 미검증이면 차단. warn/off 와 학생은 통과. allowlist는 프로필 필드를 건드리지 않고 통과. */
    public function isRequiredBlocking(int $userId, string $roleType): bool
    {
        if (!$this->isProviderRole($roleType)) {
            return false;
        }
        if ($this->mode() !== self::MODE_REQUIRED) {
            return false;
        }
        if ($this->isAllowlisted($userId)) {
            return false;
        }

        return !$this->isVerified($userId);
    }

    public function canSkip(int $userId, string $roleType): bool
    {
        if (!$this->isProviderRole($roleType)) {
            return true;
        }
        if ($this->isAllowlisted($userId)) {
            return true;
        }

        return $this->mode() !== self::MODE_REQUIRED;
    }

    public function assertMutationsAllowed(int $userId, string $roleType): void
    {
        if (!$this->isRequiredBlocking($userId, $roleType)) {
            return;
        }
        throw new ProviderIdentityRequiredException(
            '공급자 본인확인이 필요합니다. 가입 단계에서 휴대폰 인증을 완료해 주세요.'
        );
    }

    /**
     * /api/auth/me 응답용.
     *
     * @return array{
     *   provider_identity_mode: string,
     *   needs_provider_identity: bool,
     *   provider_identity_required: bool,
     *   provider_identity_can_skip: bool
     * }
     */
    public function meFlags(int $userId, string $roleType, bool $needsBasicRegister): array
    {
        $needs = $this->needsIdentityStep($userId, $roleType, $needsBasicRegister);
        $required = $this->isRequiredBlocking($userId, $roleType);

        return [
            'provider_identity_mode' => $this->mode(),
            'needs_provider_identity' => $needs,
            'provider_identity_required' => $required,
            'provider_identity_can_skip' => $needs && $this->canSkip($userId, $roleType),
        ];
    }
}
