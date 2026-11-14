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
    public const SESSION_PENDING_KEY = 'identity_verification_pending';
    public const VERIFIED_AT_MAX_AGE_SEC = 600;

    private PDO $pdo;
    private ?PortOneIdentityLookup $client;

    public function __construct(?PDO $pdo = null, ?PortOneIdentityLookup $client = null)
    {
        $this->pdo = $pdo ?? Connection::get();
        $this->client = $client;
    }

    public static function isProviderRole(string $roleType): bool
    {
        return $roleType === 'study_room_owner' || $roleType === 'tutor';
    }

    /** pepper 없으면 identity_pepper. 포트원 조회 전에 호출. */
    public function assertPepperConfigured(): void
    {
        if (trim(study114_env(self::PEPPER_ENV)) === '') {
            throw new IdentityVerificationException(
                '본인인증 비밀값이 준비되지 않았습니다.',
                'identity_pepper',
            );
        }
    }

    /**
     * 허용목록 → TEST 채널, 그 외 → 실채널.
     *
     * @return array{channel_key: string, is_test: bool, store_id: string}
     */
    public function resolveChannelForEmail(string $email): array
    {
        $storeId = trim(study114_env('PORTONE_STORE_ID'));
        $testKey = trim(study114_env('PORTONE_IDENTITY_TEST_CHANNEL_KEY'));
        $liveKey = trim(study114_env('PORTONE_IDENTITY_CHANNEL_KEY'));
        $isTest = TestAccountAllowlist::contains($email);
        $channelKey = $isTest ? $testKey : $liveKey;
        if ($storeId === '' || $channelKey === '') {
            throw new IdentityVerificationException(
                '본인인증 채널이 준비되지 않았습니다.',
                'identity_channel',
            );
        }

        return [
            'channel_key' => $channelKey,
            'is_test' => $isTest,
            'store_id' => $storeId,
        ];
    }

    /**
     * 서버 발급 identityVerificationId + 세션 저장.
     *
     * @param array{user_id: int, email?: string, role_type?: string} $user
     * @return array{identity_verification_id: string, customer_id: string, channel_key: string, store_id: string, is_test: bool}
     */
    public function issuePendingVerification(array $user): array
    {
        $this->assertPepperConfigured();
        if (!self::isProviderRole((string) ($user['role_type'] ?? ''))) {
            throw new IdentityVerificationException('공급자만 본인인증할 수 있습니다.', 'identity_invalid');
        }
        $userId = (int) ($user['user_id'] ?? 0);
        if ($userId <= 0) {
            throw new IdentityVerificationException('로그인이 필요합니다.', 'identity_invalid');
        }
        $email = (string) ($user['email'] ?? '');
        $channel = $this->resolveChannelForEmail($email);
        $id = 'identity-verification-' . bin2hex(random_bytes(16));
        $customerId = 'u' . $userId;

        AuthSession::start();
        $_SESSION[self::SESSION_PENDING_KEY] = [
            'id' => $id,
            'user_id' => $userId,
            'customer_id' => $customerId,
            'channel_key' => $channel['channel_key'],
            'is_test' => $channel['is_test'],
            'store_id' => $channel['store_id'],
            'issued_at' => time(),
        ];

        return [
            'identity_verification_id' => $id,
            'customer_id' => $customerId,
            'channel_key' => $channel['channel_key'],
            'store_id' => $channel['store_id'],
            'is_test' => $channel['is_test'],
        ];
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
     * 공개·검색용: 미인증 공급자의 open은 paused로 노출.
     * (단건·레거시) DB를 한 번 더 칠 수 있음 — 목록은 JOIN 컬럼 + maskInquiryStatusFromJoin 사용.
     */
    public function publicInquiryStatus(int $ownerUserId, string $rawStatus): string
    {
        $status = trim($rawStatus);
        if ($status !== 'open') {
            return $status !== '' ? $status : 'paused';
        }
        if ($this->isVerifiedForUser($ownerUserId)) {
            return 'open';
        }

        return 'paused';
    }

    /**
     * 목록 SQL LEFT JOIN user_profiles 결과로 마스킹 (추가 쿼리 없음).
     */
    public static function maskInquiryStatusFromJoin(
        string $rawStatus,
        mixed $identityVerifiedAt,
        mixed $identityCiHash,
        mixed $identityTxId,
    ): string {
        $status = trim($rawStatus);
        if ($status !== 'open') {
            return $status !== '' ? $status : 'paused';
        }
        $at = $identityVerifiedAt;
        $hash = trim((string) ($identityCiHash ?? ''));
        $tx = trim((string) ($identityTxId ?? ''));
        if ($at !== null && $at !== '' && $hash !== '' && $tx !== '') {
            return 'open';
        }

        return 'paused';
    }

    /** 목록 SELECT용 — sr/t 별칭 + up_id JOIN 전제. */
    public static function inquiryStatusSelectSql(string $alias): string
    {
        return "CASE
            WHEN {$alias}.inquiry_status <> 'open' THEN {$alias}.inquiry_status
            WHEN up_id.identity_verified_at IS NOT NULL
             AND NULLIF(TRIM(up_id.identity_ci_hash), '') IS NOT NULL
             AND NULLIF(TRIM(up_id.identity_tx_id), '') IS NOT NULL
            THEN 'open'
            ELSE 'paused'
          END";
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
     * @param array{role_type?: string, user_id?: int} $user
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
     * @param array{user_id: int, role_type: string, email?: string} $user
     * @return array{verified: bool, verified_at: string|null, name_masked: string|null}
     */
    public function completeFromPortOne(array $user, string $identityVerificationId): array
    {
        $this->assertPepperConfigured();

        if (!self::isProviderRole((string) ($user['role_type'] ?? ''))) {
            throw new IdentityVerificationException('공급자만 본인인증할 수 있습니다.', 'identity_invalid');
        }
        $userId = (int) ($user['user_id'] ?? 0);
        if ($userId <= 0) {
            throw new IdentityVerificationException('로그인이 필요합니다.', 'identity_invalid');
        }

        // 이미 인증: no-op
        if ($this->isVerifiedForUser($userId, $user)) {
            return $this->publicStatus($userId);
        }

        $id = trim($identityVerificationId);
        if ($id === '' || strlen($id) > 128) {
            throw new IdentityVerificationException('인증 정보가 올바르지 않습니다.', 'identity_invalid');
        }

        $pending = $this->requirePendingForUser($userId, $id);
        $email = (string) ($user['email'] ?? '');
        $expected = $this->resolveChannelForEmail($email);

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

        $this->assertVerifiedAtFresh($payload);
        $this->assertChannelAndStore($payload, $expected, $pending);

        $customer = is_array($payload['verifiedCustomer'] ?? null) ? $payload['verifiedCustomer'] : [];
        $this->assertCustomerIdMatchesPending($payload, $pending);

        $ci = trim((string) ($customer['ci'] ?? ''));
        $name = trim((string) ($customer['name'] ?? ''));
        if ($ci === '' || $name === '') {
            throw new IdentityVerificationException(
                '이 인증 수단에서는 본인확인 값을 받을 수 없어요. PASS 등으로 다시 시도해 주세요.',
                'identity_invalid',
            );
        }

        $ciHash = $this->hashCi($ci);
        $ci = '';
        unset($ci);

        if ($this->ciHashTakenByOther($ciHash, $userId)) {
            throw new IdentityVerificationException(
                '이미 다른 계정에서 인증된 정보예요. 고객센터로 문의해 주세요',
                'identity_duplicate',
            );
        }

        if ($this->txIdTaken($id)) {
            throw new IdentityVerificationException('이미 사용된 인증입니다.', 'identity_replay');
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

        $this->clearPending();

        return $this->publicStatus($userId);
    }

    public function hashCi(string $ci): string
    {
        $this->assertPepperConfigured();
        $pepper = study114_env(self::PEPPER_ENV);

        return hash_hmac('sha256', $ci, $pepper);
    }

    /**
     * @param array{channel_key: string, is_test: bool, store_id: string} $expected
     * @param array<string, mixed> $pending
     * @param array<string, mixed> $payload
     */
    private function assertChannelAndStore(array $payload, array $expected, array $pending): void
    {
        $channelKey = $this->extractChannelKey($payload);
        $channelType = strtoupper($this->extractChannelType($payload));
        $storeId = $this->extractStoreId($payload);

        // SelectedChannelType: TEST | LIVE — 허용목록은 TEST만, 그 외는 LIVE만
        $expectedType = $expected['is_test'] ? 'TEST' : 'LIVE';
        if ($channelType === '' || $channelType !== $expectedType) {
            throw new IdentityVerificationException('인증 채널이 올바르지 않습니다.', 'identity_channel');
        }
        if ($storeId === '') {
            throw new IdentityVerificationException('인증 채널이 올바르지 않습니다.', 'identity_channel');
        }
        if (!hash_equals($expected['store_id'], $storeId)) {
            throw new IdentityVerificationException('인증 채널이 올바르지 않습니다.', 'identity_channel');
        }
        if ($channelKey === '' || !hash_equals($expected['channel_key'], $channelKey)) {
            throw new IdentityVerificationException('인증 채널이 올바르지 않습니다.', 'identity_channel');
        }

        $pendingKey = (string) ($pending['channel_key'] ?? '');
        if ($pendingKey !== '' && !hash_equals($pendingKey, $channelKey)) {
            throw new IdentityVerificationException('인증 채널이 올바르지 않습니다.', 'identity_channel');
        }
    }

    /**
     * 고객 ID 필수 대조.
     * 포트원 단건 조회: requestedCustomer.id(요청 시 보낸 값) · verifiedCustomer.id(선택).
     * 샌드박스 실측에서 값이 오는 필드를 우선 사용하고, 둘 다 비면 거부.
     *
     * @param array<string, mixed> $payload
     * @param array<string, mixed> $pending
     */
    private function assertCustomerIdMatchesPending(array $payload, array $pending): void
    {
        $expectedCustomer = trim((string) ($pending['customer_id'] ?? ''));
        if ($expectedCustomer === '') {
            throw new IdentityVerificationException('인증 정보가 올바르지 않습니다.', 'identity_replay');
        }

        [$field, $customerId] = $this->extractCustomerIdWithField($payload);
        // 값은 남기지 않고 필드 이름만 (실측·운영 로그용)
        error_log('[identity] customer_id_field=' . ($field !== '' ? $field : 'missing'));
        if ($field === '' || $customerId === '' || !hash_equals($expectedCustomer, $customerId)) {
            throw new IdentityVerificationException('인증 정보가 올바르지 않습니다.', 'identity_replay');
        }
    }

    /**
     * @param array<string, mixed> $payload
     * @return array{0: string, 1: string} [fieldName, id]
     */
    private function extractCustomerIdWithField(array $payload): array
    {
        $requested = is_array($payload['requestedCustomer'] ?? null) ? $payload['requestedCustomer'] : [];
        $reqId = trim((string) ($requested['id'] ?? $requested['customerId'] ?? ''));
        if ($reqId !== '') {
            return ['requestedCustomer.id', $reqId];
        }
        $verified = is_array($payload['verifiedCustomer'] ?? null) ? $payload['verifiedCustomer'] : [];
        $verId = trim((string) ($verified['id'] ?? $verified['customerId'] ?? ''));
        if ($verId !== '') {
            return ['verifiedCustomer.id', $verId];
        }

        return ['', ''];
    }

    /** @param array<string, mixed> $payload */
    private function assertVerifiedAtFresh(array $payload): void
    {
        $raw = $payload['verifiedAt'] ?? $payload['verified_at'] ?? null;
        if (!is_string($raw) || trim($raw) === '') {
            throw new IdentityVerificationException('인증 시각을 확인할 수 없습니다.', 'identity_invalid');
        }
        $ts = strtotime($raw);
        if ($ts === false) {
            throw new IdentityVerificationException('인증 시각을 확인할 수 없습니다.', 'identity_invalid');
        }
        if (abs(time() - $ts) > self::VERIFIED_AT_MAX_AGE_SEC) {
            throw new IdentityVerificationException('인증이 만료되었어요. 다시 시도해 주세요.', 'identity_replay');
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function requirePendingForUser(int $userId, string $id): array
    {
        AuthSession::start();
        $pending = $_SESSION[self::SESSION_PENDING_KEY] ?? null;
        if (!is_array($pending)) {
            throw new IdentityVerificationException('인증 세션이 없습니다. 다시 시작해 주세요.', 'identity_replay');
        }
        $pendingUser = (int) ($pending['user_id'] ?? 0);
        $pendingId = (string) ($pending['id'] ?? '');
        if ($pendingUser !== $userId || $pendingId === '' || !hash_equals($pendingId, $id)) {
            throw new IdentityVerificationException('인증 정보가 올바르지 않습니다.', 'identity_replay');
        }
        $issuedAt = (int) ($pending['issued_at'] ?? 0);
        if ($issuedAt <= 0 || (time() - $issuedAt) > self::VERIFIED_AT_MAX_AGE_SEC) {
            throw new IdentityVerificationException('인증이 만료되었어요. 다시 시도해 주세요.', 'identity_replay');
        }

        return $pending;
    }

    private function clearPending(): void
    {
        AuthSession::start();
        unset($_SESSION[self::SESSION_PENDING_KEY]);
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

    /** @param array<string, mixed> $payload */
    private function extractChannelType(array $payload): string
    {
        $channel = $payload['channel'] ?? null;
        if (is_array($channel) && isset($channel['type']) && is_string($channel['type'])) {
            return trim($channel['type']);
        }
        if (isset($payload['channelType']) && is_string($payload['channelType'])) {
            return trim($payload['channelType']);
        }

        return '';
    }

    /** @param array<string, mixed> $payload */
    private function extractStoreId(array $payload): string
    {
        if (isset($payload['storeId']) && is_string($payload['storeId'])) {
            return trim($payload['storeId']);
        }
        $store = $payload['store'] ?? null;
        if (is_array($store) && isset($store['id']) && is_string($store['id'])) {
            return trim($store['id']);
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

    private function txIdTaken(string $txId): bool
    {
        $stmt = $this->pdo->prepare(
            'SELECT user_id FROM user_profiles WHERE identity_tx_id = ? LIMIT 1'
        );
        $stmt->execute([$txId]);

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
