<?php

declare(strict_types=1);

namespace Study114\Auth;

use PDO;
use PDOException;
use Study114\Database\Connection;

/**
 * 365 — 공급자 쪽지 허용 본인인증.
 * 저장: identity_ci_hash · identity_verified_at · identity_provider · identity_tx_id · identity_name
 * SMS OTP(phone_verified_*)와 분리. CI·생년·휴대폰 원문은 메모리에서만 쓰고 버린다.
 */
final class IdentityVerificationService
{
    public const PROVIDER_INICIS_UNIFIED = 'inicis_unified';
    public const PEPPER_ENV = 'STUDY114_IDENTITY_CI_PEPPER';

    private PDO $pdo;
    private ?PortOneIdentityClient $client;

    public function __construct(?PDO $pdo = null, ?PortOneIdentityClient $client = null)
    {
        $this->pdo = $pdo ?? Connection::get();
        $this->client = $client;
    }

    public static function isProviderRole(string $roleType): bool
    {
        return $roleType === 'study_room_owner' || $roleType === 'tutor';
    }

    /** @param array{role_type?: string}|null $user */
    public function isVerifiedForUser(int $userId, ?array $user = null): bool
    {
        if ($user !== null && !self::isProviderRole((string) ($user['role_type'] ?? ''))) {
            return true;
        }
        $row = $this->fetchProfileIdentity($userId);
        if ($row === null) {
            return false;
        }
        $at = $row['identity_verified_at'] ?? null;
        $hash = trim((string) ($row['identity_ci_hash'] ?? ''));
        $tx = trim((string) ($row['identity_tx_id'] ?? ''));

        return $at !== null && $at !== '' && $hash !== '' && $tx !== '';
    }

    /**
     * @return array{verified: bool, verified_at: string|null, name_masked: string|null}
     */
    public function publicStatus(int $userId): array
    {
        $row = $this->fetchProfileIdentity($userId);
        if ($row === null) {
            return ['verified' => false, 'verified_at' => null, 'name_masked' => null];
        }
        $at = $row['identity_verified_at'] ?? null;
        $ok = $at !== null && $at !== '' && trim((string) ($row['identity_ci_hash'] ?? '')) !== '';
        $name = trim((string) ($row['identity_name'] ?? ''));
        $masked = null;
        if ($ok && $name !== '') {
            $masked = $this->maskName($name);
        }

        return [
            'verified' => $ok,
            'verified_at' => $ok ? (string) $at : null,
            'name_masked' => $masked,
        ];
    }

    /**
     * 쪽지 받는 중(ON) 저장 전 가드. 학생·비공급자는 통과.
     *
     * @param array{role_type?: string} $user
     */
    public function assertProviderVerifiedForInquiryOpen(array $user): void
    {
        $role = (string) ($user['role_type'] ?? '');
        if (!self::isProviderRole($role)) {
            return;
        }
        $userId = (int) ($user['user_id'] ?? 0);
        if ($userId <= 0 || !$this->isVerifiedForUser($userId, $user)) {
            throw new IdentityVerificationException(
                '쪽지를 받으려면 본인인증이 한 번 필요해요.',
                'identity_required',
            );
        }
    }

    /**
     * 포트원 단건 조회 후 저장. 프론트 결과는 믿지 않는다.
     *
     * @param array{user_id: int, role_type: string} $user
     * @return array{verified: bool, verified_at: string|null, name_masked: string|null}
     */
    public function completeFromPortOne(array $user, string $identityVerificationId): array
    {
        if (!self::isProviderRole((string) ($user['role_type'] ?? ''))) {
            throw new IdentityVerificationException('공급자만 본인인증할 수 있습니다.', 'identity_invalid');
        }
        $userId = (int) ($user['user_id'] ?? 0);
        if ($userId <= 0) {
            throw new IdentityVerificationException('로그인이 필요합니다.', 'identity_invalid');
        }

        $expectedChannel = trim(study114_env('PORTONE_IDENTITY_CHANNEL_KEY'));
        if ($expectedChannel === '') {
            throw new IdentityVerificationException('본인인증 채널이 준비되지 않았습니다.', 'identity_channel');
        }

        $id = trim($identityVerificationId);
        if ($id === '' || strlen($id) > 128) {
            throw new IdentityVerificationException('인증 정보가 올바르지 않습니다.', 'identity_invalid');
        }

        $client = $this->client ?? PortOneIdentityClient::fromEnv();
        try {
            $payload = $client->getIdentityVerification($id);
        } catch (\Throwable $e) {
            error_log('[identity] portone fetch failed: ' . get_class($e));
            throw new IdentityVerificationException('인증 확인에 실패했습니다. 다시 시도해 주세요.', 'identity_invalid');
        }

        $status = strtoupper((string) ($payload['status'] ?? ''));
        if ($status !== 'VERIFIED') {
            throw new IdentityVerificationException('인증이 완료되지 않았습니다.', 'identity_invalid');
        }

        $channelKey = $this->extractChannelKey($payload);
        if ($channelKey === '' || !hash_equals($expectedChannel, $channelKey)) {
            throw new IdentityVerificationException('인증 채널이 올바르지 않습니다.', 'identity_channel');
        }

        $customer = is_array($payload['verifiedCustomer'] ?? null) ? $payload['verifiedCustomer'] : [];
        $ci = trim((string) ($customer['ci'] ?? ''));
        $name = trim((string) ($customer['name'] ?? ''));
        // 생년·휴대폰은 의도적으로 저장하지 않음. 변수에 담지 않는다.

        if ($ci === '' || $name === '') {
            throw new IdentityVerificationException('인증 결과에 필요한 정보가 없습니다.', 'identity_invalid');
        }

        $ciHash = $this->hashCi($ci);
        // CI 원문 즉시 폐기
        $ci = '';
        unset($ci);

        if ($this->ciHashTakenByOther($ciHash, $userId)) {
            throw new IdentityVerificationException(
                '이미 다른 계정에서 인증된 정보예요. 고객센터로 문의해 주세요',
                'identity_duplicate',
            );
        }

        try {
            $stmt = $this->pdo->prepare(
                'UPDATE user_profiles SET
                    identity_ci_hash = ?,
                    identity_verified_at = NOW(),
                    identity_provider = ?,
                    identity_tx_id = ?,
                    identity_name = ?
                 WHERE user_id = ?'
            );
            $stmt->execute([
                $ciHash,
                self::PROVIDER_INICIS_UNIFIED,
                $id,
                mb_substr($name, 0, 100),
                $userId,
            ]);
        } catch (PDOException $e) {
            if ($this->isDuplicateKey($e)) {
                throw new IdentityVerificationException(
                    '이미 다른 계정에서 인증된 정보예요. 고객센터로 문의해 주세요',
                    'identity_duplicate',
                );
            }
            throw $e;
        }

        // 이름도 응답에는 마스킹만
        return $this->publicStatus($userId);
    }

    public function hashCi(string $ci): string
    {
        $pepper = study114_env(self::PEPPER_ENV);
        if ($pepper === '') {
            throw new IdentityVerificationException('본인인증 비밀값이 준비되지 않았습니다.', 'identity_invalid');
        }

        return hash_hmac('sha256', $ci, $pepper);
    }

    /** @param array<string, mixed> $payload */
    private function extractChannelKey(array $payload): string
    {
        if (isset($payload['channelKey']) && is_string($payload['channelKey'])) {
            return trim($payload['channelKey']);
        }
        $channel = $payload['channel'] ?? null;
        if (is_array($channel) && isset($channel['key']) && is_string($channel['key'])) {
            return trim($channel['key']);
        }
        if (is_array($channel) && isset($channel['channelKey']) && is_string($channel['channelKey'])) {
            return trim($channel['channelKey']);
        }

        return '';
    }

    private function ciHashTakenByOther(string $ciHash, int $userId): bool
    {
        $stmt = $this->pdo->prepare(
            'SELECT user_id FROM user_profiles
             WHERE identity_ci_hash = ? AND user_id <> ? LIMIT 1'
        );
        $stmt->execute([$ciHash, $userId]);

        return (bool) $stmt->fetchColumn();
    }

    private function isDuplicateKey(PDOException $e): bool
    {
        $info = $e->errorInfo ?? [];
        $sqlState = (string) ($info[0] ?? '');
        $driver = (int) ($info[1] ?? 0);

        return $sqlState === '23000' || $driver === 1062;
    }

    /** @return array<string, mixed>|null */
    private function fetchProfileIdentity(int $userId): ?array
    {
        try {
            $stmt = $this->pdo->prepare(
                'SELECT identity_ci_hash, identity_verified_at, identity_provider,
                        identity_tx_id, identity_name
                 FROM user_profiles WHERE user_id = ? LIMIT 1'
            );
            $stmt->execute([$userId]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);

            return is_array($row) ? $row : null;
        } catch (PDOException $e) {
            // 088 미적용
            if (str_contains($e->getMessage(), 'identity_ci_hash') || str_contains($e->getMessage(), 'Unknown column')) {
                return null;
            }
            throw $e;
        }
    }

    private function maskName(string $name): string
    {
        $len = mb_strlen($name);
        if ($len <= 1) {
            return '*';
        }
        if ($len === 2) {
            return mb_substr($name, 0, 1) . '*';
        }

        return mb_substr($name, 0, 1) . str_repeat('*', $len - 2) . mb_substr($name, -1);
    }
}
