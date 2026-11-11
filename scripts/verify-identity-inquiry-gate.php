<?php

declare(strict_types=1);

/**
 * 365-보완2 — 본인인증·inquiry 게이트 자동 검증 (DB 실접속 없음).
 * 위조·리플레이·tx 재사용·재인증 no-op·중복 CI·학생 통과·Hub·Admin·Messages·pepper·TEST 채널 거부.
 * 실행: php scripts/verify-identity-inquiry-gate.php
 */

namespace Study114\Auth {
    if (!\function_exists(__NAMESPACE__ . '\\mb_substr')) {
        function mb_substr(string $string, int $start, ?int $length = null): string
        {
            $chars = \preg_split('//u', $string, -1, PREG_SPLIT_NO_EMPTY) ?: [];

            return \implode('', \array_slice($chars, $start, $length));
        }
    }
    if (!\function_exists(__NAMESPACE__ . '\\mb_strlen')) {
        function mb_strlen(string $string): int
        {
            $chars = \preg_split('//u', $string, -1, PREG_SPLIT_NO_EMPTY) ?: [];

            return \count($chars);
        }
    }
}

namespace Study114\Messages {
    if (!\function_exists(__NAMESPACE__ . '\\mb_substr')) {
        function mb_substr(string $string, int $start, ?int $length = null): string
        {
            $chars = \preg_split('//u', $string, -1, PREG_SPLIT_NO_EMPTY) ?: [];

            return \implode('', \array_slice($chars, $start, $length));
        }
    }
}

namespace {
    error_reporting(E_ALL & ~E_WARNING & ~E_NOTICE & ~E_DEPRECATED);
    ini_set('display_errors', '0');

    require_once dirname(__DIR__) . '/src/bootstrap.php';

    use Study114\Admin\AdminExposureService;
    use Study114\Auth\AuthSession;
    use Study114\Auth\IdentityVerificationException;
    use Study114\Auth\IdentityVerificationService;
    use Study114\Auth\PortOneIdentityLookup;
    use Study114\Database\Connection;
    use Study114\Messages\MessagesRepository;
    use Study114\Messages\MessagesService;
    use Study114\Registration\StudyRoomHubRepository;
    use Study114\Registration\StudyRoomHubService;
    use Study114\Registration\TutorHubRepository;
    use Study114\Registration\TutorHubService;

    final class IdFakeLookup implements PortOneIdentityLookup
    {
        /** @var array<string, mixed> */
        public array $payload = [];
        public int $calls = 0;

        public function getIdentityVerification(string $identityVerificationId): array
        {
            $this->calls++;
            $out = $this->payload;
            $out['id'] = $identityVerificationId;

            return $out;
        }
    }

    final class IdStmt
    {
        private mixed $row = false;
        private mixed $column = false;
        private array $all = [];
        private int $rowCount = 0;

        public function __construct(private IdPdo $pdo, private string $sql)
        {
        }

        public function execute(?array $params = null): bool
        {
            $answer = ($this->pdo->resolver)($this->sql, $params ?? []);
            $this->row = $answer['row'] ?? false;
            $this->column = $answer['column'] ?? false;
            $this->all = $answer['all'] ?? [];
            $this->rowCount = (int) ($answer['rowCount'] ?? 0);

            return true;
        }

        public function fetch(mixed ...$args): mixed
        {
            return $this->row;
        }

        public function fetchColumn(mixed ...$args): mixed
        {
            return $this->column;
        }

        public function fetchAll(mixed ...$args): array
        {
            return $this->all;
        }

        public function rowCount(): int
        {
            return $this->rowCount;
        }
    }

    final class IdPdo extends PDO
    {
        /** @var callable(string, array): array */
        public $resolver;

        public function __construct(callable $resolver)
        {
            $this->resolver = $resolver;
        }

        #[\ReturnTypeWillChange]
        public function prepare(string $query, array $options = []): IdStmt
        {
            return new IdStmt($this, $query);
        }

        public function beginTransaction(): bool
        {
            return true;
        }

        public function commit(): bool
        {
            return true;
        }

        public function rollBack(): bool
        {
            return true;
        }

        public function inTransaction(): bool
        {
            return false;
        }

        #[\ReturnTypeWillChange]
        public function lastInsertId(?string $name = null): string
        {
            return '501';
        }

        #[\ReturnTypeWillChange]
        public function exec(string $statement): int|false
        {
            ($this->resolver)($statement, []);

            return 1;
        }

        #[\ReturnTypeWillChange]
        public function query(string $query, ?int $fetchMode = null, mixed ...$fetchModeArgs): IdStmt
        {
            $stmt = new IdStmt($this, $query);
            $stmt->execute();

            return $stmt;
        }
    }

    /** @var array<int, array<string, mixed>> */
    $profiles = [];
    /** @var array<int, string> */
    $roomInquiry = [101 => 'paused'];
    /** @var array<int, string> */
    $tutorInquiry = [201 => 'paused'];
    $threads = [];

    $put = static function (string $k, string $v): void {
        putenv($k . '=' . $v);
        $_ENV[$k] = $v;
        $_SERVER[$k] = $v;
    };
    $put('STUDY114_IDENTITY_CI_PEPPER', 'verify-identity-pepper-32chars-min!!');
    $put('PORTONE_STORE_ID', 'store-verify');
    $put('PORTONE_IDENTITY_CHANNEL_KEY', 'channel-live-verify');
    $put('PORTONE_IDENTITY_TEST_CHANNEL_KEY', 'channel-test-verify');
    $put('STUDY114_TEST_ACCOUNT_EMAILS', 'allowlisted@example.com');
    $put('PORTONE_API_SECRET', 'verify-api-secret');

    $fail = 0;
    $pass = 0;
    $assert = static function (bool $ok, string $name, string $detail = '') use (&$fail, &$pass): void {
        if ($ok) {
            $pass++;
            echo "PASS {$name}" . ($detail !== '' ? " ({$detail})" : '') . PHP_EOL;
        } else {
            $fail++;
            echo "FAIL {$name}" . ($detail !== '' ? " ({$detail})" : '') . PHP_EOL;
        }
    };

    $resolver = static function (string $sql, array $p) use (&$profiles, &$roomInquiry, &$tutorInquiry, &$threads): array {
        if (preg_match('/identity_ci_hash[\s\S]*FROM user_profiles WHERE user_id/', $sql)) {
            $uid = (int) ($p[0] ?? 0);

            return ['row' => $profiles[$uid] ?? false];
        }
        if (preg_match('/SELECT user_id FROM user_profiles\s+WHERE identity_ci_hash/', $sql)) {
            $hash = (string) ($p[0] ?? '');
            $uid = (int) ($p[1] ?? 0);
            foreach ($profiles as $id => $row) {
                if ((string) ($row['identity_ci_hash'] ?? '') === $hash && $id !== $uid) {
                    return ['column' => $id];
                }
            }

            return ['column' => false];
        }
        if (preg_match('/SELECT user_id FROM user_profiles WHERE identity_tx_id/', $sql)) {
            $tx = (string) ($p[0] ?? '');
            foreach ($profiles as $id => $row) {
                if ((string) ($row['identity_tx_id'] ?? '') === $tx) {
                    return ['column' => $id];
                }
            }

            return ['column' => false];
        }
        if (preg_match('/UPDATE user_profiles SET[\s\S]*identity_ci_hash/', $sql)) {
            $uid = (int) ($p[4] ?? 0);
            $profiles[$uid] = [
                'identity_ci_hash' => (string) $p[0],
                'identity_verified_at' => date('Y-m-d H:i:s'),
                'identity_provider' => (string) $p[1],
                'identity_tx_id' => (string) $p[2],
                'identity_name' => (string) $p[3],
            ];

            return ['rowCount' => 1];
        }
        if (preg_match('/SELECT inquiry_status FROM study_rooms/', $sql)) {
            return ['column' => $roomInquiry[(int) ($p[0] ?? 0)] ?? false];
        }
        if (preg_match('/SELECT inquiry_status FROM tutors/', $sql)) {
            return ['column' => $tutorInquiry[(int) ($p[0] ?? 0)] ?? false];
        }
        if (preg_match('/UPDATE study_rooms SET inquiry_status/', $sql)) {
            $roomInquiry[(int) ($p[1] ?? 0)] = (string) ($p[0] ?? '');

            return ['rowCount' => 1];
        }
        if (preg_match('/UPDATE tutors SET inquiry_status/', $sql)) {
            $tutorInquiry[(int) ($p[1] ?? 0)] = (string) ($p[0] ?? '');

            return ['rowCount' => 1];
        }
        if (preg_match('/SELECT user_id FROM study_rooms WHERE id/', $sql)) {
            return ['column' => ((int) ($p[0] ?? 0) === 101) ? 1001 : false];
        }
        if (preg_match('/SELECT user_id FROM tutors WHERE id/', $sql)) {
            return ['column' => ((int) ($p[0] ?? 0) === 201) ? 2001 : false];
        }
        if (preg_match('/SELECT \* FROM message_threads/', $sql)) {
            $key = implode(':', $p);
            return ['row' => $threads[$key] ?? false];
        }
        if (preg_match('/INSERT INTO message_threads/', $sql)) {
            return ['rowCount' => 1];
        }
        if (preg_match('/INSERT INTO messages/', $sql)) {
            return ['rowCount' => 1];
        }
        if (preg_match('/role_type FROM user_roles/', $sql)) {
            $uid = (int) ($p[0] ?? 0);
            $map = [1001 => 'study_room_owner', 2001 => 'tutor', 3001 => 'parent', 4001 => 'admin'];

            return ['column' => $map[$uid] ?? 'parent'];
        }
        if (preg_match('/email_verified_at FROM users/', $sql)) {
            return ['row' => ['email_verified_at' => '2026-01-01 00:00:00']];
        }
        if (preg_match('/cold_memo_allowed FROM provider_entitlements/', $sql)) {
            return ['column' => 1];
        }
        if (preg_match('/information_schema\.COLUMNS/', $sql)) {
            return ['column' => 1];
        }
        if (preg_match('/SELECT sr\.\* FROM study_rooms sr/', $sql)) {
            $roomId = (int) ($p[0] ?? 101);
            $userId = (int) ($p[1] ?? ($p[0] ?? 1001));
            if (count($p) >= 2) {
                $roomId = (int) $p[0];
                $userId = (int) $p[1];
            }
            if ($roomId === 101 && $userId === 1001) {
                return ['row' => [
                    'id' => 101,
                    'user_id' => 1001,
                    'study_room_name' => 'room',
                    'profile_status' => 'published',
                    'inquiry_status' => $roomInquiry[101] ?? 'paused',
                    'detail_completion_status' => 'basic_only',
                    'region_id' => null,
                    'complex_id' => null,
                    'region_basis_type' => null,
                    'main_subject_note' => '',
                    'price_amount' => null,
                    'intro_short' => null,
                    'intro_long' => null,
                    'slogan' => null,
                    'feature_1' => null,
                    'career_years' => null,
                    'education_office_registered' => 0,
                    'weekend_available' => 0,
                    'one_on_one_available' => 0,
                    'published_at' => '2026-01-01 00:00:00',
                    'updated_at' => '2026-01-01 00:00:00',
                ], 'all' => []];
            }

            return ['row' => false, 'all' => []];
        }
        if (preg_match('/SELECT t\.\* FROM tutors t/', $sql)) {
            $tutorId = (int) ($p[0] ?? 0);
            $userId = (int) ($p[1] ?? 0);
            if ($tutorId === 201 && $userId === 2001) {
                return ['row' => [
                    'id' => 201,
                    'user_id' => 2001,
                    'tutor_display_name' => 'tutor',
                    'profile_status' => 'published',
                    'inquiry_status' => $tutorInquiry[201] ?? 'paused',
                    'detail_completion_status' => 'basic_only',
                    'published_at' => '2026-01-01 00:00:00',
                    'updated_at' => '2026-01-01 00:00:00',
                ]];
            }

            return ['row' => false];
        }
        if (preg_match('/FROM study_rooms WHERE id = \? AND deleted_at IS NULL/', $sql)
            || preg_match('/SELECT id, user_id, study_room_name/', $sql)) {
            return ['row' => [
                'id' => 101,
                'user_id' => 1001,
                'study_room_name' => 'room',
                'profile_status' => 'published',
                'inquiry_status' => $roomInquiry[101] ?? 'paused',
                'published_at' => '2026-01-01 00:00:00',
                'updated_at' => '2026-01-01 00:00:00',
            ]];
        }
        if (preg_match('/study_room_subject_targets|study_room_regions|study_room_images|tutor_regions|tutor_lesson|tutor_subject|tutor_teaching|phone_verified|PhoneVerification|SELECT 1 FROM/', $sql)) {
            return ['column' => false, 'row' => false, 'all' => []];
        }
        if (preg_match('/TutorDetailCompletionEvaluator|detail_completion/', $sql)) {
            return ['column' => false, 'row' => false, 'all' => []];
        }
        if (preg_match('/INSERT INTO admin_operation_logs|admin_operation_log/', $sql)) {
            return ['rowCount' => 1];
        }
        if (preg_match('/SELECT id FROM tutors WHERE user_id|SELECT id FROM study_rooms WHERE user_id/', $sql)) {
            return ['all' => []];
        }
        if (preg_match('/provider_ticket_packs/', $sql)) {
            return ['column' => 0, 'row' => false];
        }
        if (preg_match('/FROM message_threads t/', $sql)) {
            return ['row' => false];
        }

        return [];
    };

    $pdo = new IdPdo($resolver);
    (new ReflectionProperty(Connection::class, 'pdo'))->setValue(null, $pdo);

    $fake = new IdFakeLookup();
    $svc = new IdentityVerificationService($pdo, $fake);

    // 세션은 출력 전에 연다 (issuePending / complete 대조)
    if (session_status() !== PHP_SESSION_ACTIVE) {
        session_save_path(sys_get_temp_dir());
        session_start();
    }
    $_SESSION = [];

    // --- pepper 미설정 ---
    $put('STUDY114_IDENTITY_CI_PEPPER', '');
    try {
        $svc->assertPepperConfigured();
        $assert(false, 'pepper_empty');
    } catch (IdentityVerificationException $e) {
        $assert($e->errorCode === 'identity_pepper', 'pepper_empty', $e->errorCode);
    }
    $put('STUDY114_IDENTITY_CI_PEPPER', 'verify-identity-pepper-32chars-min!!');

    // --- 채널 선택 ---
    $chAllow = $svc->resolveChannelForEmail('allowlisted@example.com');
    $assert($chAllow['is_test'] === true && $chAllow['channel_key'] === 'channel-test-verify', 'channel_allowlist_test');
    $chLive = $svc->resolveChannelForEmail('normal@example.com');
    $assert($chLive['is_test'] === false && $chLive['channel_key'] === 'channel-live-verify', 'channel_live');

    // --- 학생은 inquiry open 검사 통과 ---
    try {
        $svc->assertProviderVerifiedForInquiryOpen(['user_id' => 3001, 'role_type' => 'parent']);
        $assert(true, 'student_pass');
    } catch (Throwable $e) {
        $assert(false, 'student_pass', $e->getMessage());
    }

    // --- Hub: 미인증 open 거부 (오류 코드 identity_required만 PASS) ---
    $hub = new StudyRoomHubService(new StudyRoomHubRepository($pdo), $svc);
    try {
        $hub->applyAction(1001, 101, 'inquiry_status', ['inquiry_status' => 'open']);
        $assert(false, 'hub_open_unverified', 'no_throw');
    } catch (IdentityVerificationException $e) {
        $assert($e->errorCode === 'identity_required', 'hub_open_unverified', $e->errorCode);
    } catch (Throwable $e) {
        $assert(false, 'hub_open_unverified', get_class($e) . ':' . $e->getMessage());
    }

    $tutorHub = new TutorHubService(new TutorHubRepository($pdo), $svc);
    try {
        $tutorHub->applyAction(2001, 201, 'inquiry_status', ['inquiry_status' => 'open']);
        $assert(false, 'tutor_hub_open_unverified', 'no_throw');
    } catch (IdentityVerificationException $e) {
        $assert($e->errorCode === 'identity_required', 'tutor_hub_open_unverified', $e->errorCode);
    } catch (Throwable $e) {
        $assert(false, 'tutor_hub_open_unverified', get_class($e) . ':' . $e->getMessage());
    }

    // --- Admin open 거부 (InvalidArgumentException 메시지로 identity_required 경로) ---
    $admin = new AdminExposureService();
    try {
        $admin->applyCorrection([
            'target_type' => 'study_room',
            'target_id' => '101',
            'action' => 'inquiry_status',
            'inquiry_status' => 'open',
            'reason_category' => 'other',
            'internal_memo' => 'verify',
        ], 'admin@example.com');
        $assert(false, 'admin_open_unverified', 'no_throw');
    } catch (\InvalidArgumentException $e) {
        $assert(str_contains($e->getMessage(), '본인인증'), 'admin_open_unverified', $e->getMessage());
    } catch (Throwable $e) {
        $assert(false, 'admin_open_unverified', get_class($e) . ':' . $e->getMessage());
    }

    // --- issue + complete 성공 ---
    AuthSession::start();
    $_SESSION = [];
    $issued = $svc->issuePendingVerification([
        'user_id' => 1001,
        'email' => 'normal@example.com',
        'role_type' => 'study_room_owner',
    ]);
    $pendingOk = isset($_SESSION[IdentityVerificationService::SESSION_PENDING_KEY]['id']);
    $fake->payload = [
        'status' => 'VERIFIED',
        'verifiedAt' => gmdate('c'),
        'storeId' => 'store-verify',
        'channel' => ['key' => 'channel-live-verify', 'type' => 'LIVE'],
        // 샌드박스 실측 우선: requestedCustomer.id (요청 시 보낸 customerId 에코)
        'requestedCustomer' => ['id' => $issued['customer_id']],
        'verifiedCustomer' => [
            'ci' => 'ci-owner-1001',
            'name' => '홍길동',
        ],
    ];
    try {
        $done = $svc->completeFromPortOne([
            'user_id' => 1001,
            'email' => 'normal@example.com',
            'role_type' => 'study_room_owner',
        ], $issued['identity_verification_id']);
        $assert(($done['verified'] ?? false) === true && $pendingOk, 'complete_ok', ($done['verified'] ?? false) ? 'ok' : 'unverified');
    } catch (Throwable $e) {
        $code = $e instanceof IdentityVerificationException ? $e->errorCode : get_class($e);
        $assert(false, 'complete_ok', $code . ':' . $e->getMessage());
        $done = ['verified' => false];
    }

    // --- 재인증 no-op (포트원 재호출 없음) ---
    $beforeCalls = $fake->calls;
    try {
        $again = $svc->completeFromPortOne([
            'user_id' => 1001,
            'email' => 'normal@example.com',
            'role_type' => 'study_room_owner',
        ], 'identity-verification-forged');
        $assert(($again['verified'] ?? false) === true && $fake->calls === $beforeCalls, 'complete_noop');
    } catch (Throwable $e) {
        $assert(false, 'complete_noop', $e->getMessage());
    }

    // --- 위조 id (세션 불일치) ---
    unset($profiles[1002]);
    $_SESSION = [];
    $issued2 = $svc->issuePendingVerification([
        'user_id' => 1002,
        'email' => 'normal2@example.com',
        'role_type' => 'study_room_owner',
    ]);
    $fake->payload = [
        'status' => 'VERIFIED',
        'verifiedAt' => gmdate('c'),
        'storeId' => 'store-verify',
        'channel' => ['key' => 'channel-live-verify', 'type' => 'LIVE'],
        'requestedCustomer' => ['id' => $issued2['customer_id']],
        'verifiedCustomer' => ['ci' => 'ci-owner-1002', 'name' => '위조'],
    ];
    try {
        $svc->completeFromPortOne([
            'user_id' => 1002,
            'email' => 'normal2@example.com',
            'role_type' => 'study_room_owner',
        ], 'identity-verification-forged-id');
        $assert(false, 'forged_id');
    } catch (IdentityVerificationException $e) {
        $assert($e->errorCode === 'identity_replay', 'forged_id', $e->errorCode);
    }

    // --- 허용목록 밖 TEST 채널 거부 ---
    $_SESSION = [];
    $issued3 = $svc->issuePendingVerification([
        'user_id' => 1003,
        'email' => 'normal3@example.com',
        'role_type' => 'tutor',
    ]);
    // force pending then swap payload to TEST key
    $fake->payload = [
        'status' => 'VERIFIED',
        'verifiedAt' => gmdate('c'),
        'storeId' => 'store-verify',
        // 허용목록 밖 + TEST type → identity_channel
        'channel' => ['key' => 'channel-test-verify', 'type' => 'TEST'],
        'requestedCustomer' => ['id' => $issued3['customer_id']],
        'verifiedCustomer' => [
            'ci' => 'ci-owner-1003',
            'name' => '김테스트',
        ],
    ];
    try {
        $svc->completeFromPortOne([
            'user_id' => 1003,
            'email' => 'normal3@example.com',
            'role_type' => 'tutor',
        ], $issued3['identity_verification_id']);
        $assert(false, 'test_channel_rejected_for_non_allowlist');
    } catch (IdentityVerificationException $e) {
        $assert($e->errorCode === 'identity_channel', 'test_channel_rejected_for_non_allowlist', $e->errorCode);
    }

    // --- storeId 없으면 거부 ---
    $_SESSION = [];
    $issuedStore = $svc->issuePendingVerification([
        'user_id' => 1010,
        'email' => 'normal10@example.com',
        'role_type' => 'tutor',
    ]);
    $fake->payload = [
        'status' => 'VERIFIED',
        'verifiedAt' => gmdate('c'),
        'channel' => ['key' => 'channel-live-verify', 'type' => 'LIVE'],
        'requestedCustomer' => ['id' => $issuedStore['customer_id']],
        'verifiedCustomer' => ['ci' => 'ci-owner-1010', 'name' => '스토어없음'],
    ];
    try {
        $svc->completeFromPortOne([
            'user_id' => 1010,
            'email' => 'normal10@example.com',
            'role_type' => 'tutor',
        ], $issuedStore['identity_verification_id']);
        $assert(false, 'store_id_required');
    } catch (IdentityVerificationException $e) {
        $assert($e->errorCode === 'identity_channel', 'store_id_required', $e->errorCode);
    }

    // --- tx 재사용 ---
    $_SESSION = [];
    $issued4 = $svc->issuePendingVerification([
        'user_id' => 1004,
        'email' => 'normal4@example.com',
        'role_type' => 'tutor',
    ]);
    // plant used tx on another profile
    $profiles[1999] = [
        'identity_ci_hash' => hash_hmac('sha256', 'other', 'verify-identity-pepper-32chars-min!!'),
        'identity_verified_at' => '2026-01-01 00:00:00',
        'identity_provider' => 'inicis_unified',
        'identity_tx_id' => $issued4['identity_verification_id'],
        'identity_name' => '기존',
    ];
    $fake->payload = [
        'status' => 'VERIFIED',
        'verifiedAt' => gmdate('c'),
        'storeId' => 'store-verify',
        'channel' => ['key' => 'channel-live-verify', 'type' => 'LIVE'],
        'requestedCustomer' => ['id' => $issued4['customer_id']],
        'verifiedCustomer' => [
            'ci' => 'ci-owner-1004',
            'name' => '이재사용',
        ],
    ];
    try {
        $svc->completeFromPortOne([
            'user_id' => 1004,
            'email' => 'normal4@example.com',
            'role_type' => 'tutor',
        ], $issued4['identity_verification_id']);
        $assert(false, 'tx_reuse');
    } catch (IdentityVerificationException $e) {
        $assert($e->errorCode === 'identity_replay', 'tx_reuse', $e->errorCode);
    }

    // --- 중복 CI ---
    $_SESSION = [];
    $issued5 = $svc->issuePendingVerification([
        'user_id' => 1005,
        'email' => 'normal5@example.com',
        'role_type' => 'tutor',
    ]);
    $dupCi = 'ci-duplicate-shared';
    $profiles[1888] = [
        'identity_ci_hash' => hash_hmac('sha256', $dupCi, 'verify-identity-pepper-32chars-min!!'),
        'identity_verified_at' => '2026-01-01 00:00:00',
        'identity_provider' => 'inicis_unified',
        'identity_tx_id' => 'identity-verification-other-tx',
        'identity_name' => '기존CI',
    ];
    $fake->payload = [
        'status' => 'VERIFIED',
        'verifiedAt' => gmdate('c'),
        'storeId' => 'store-verify',
        'channel' => ['key' => 'channel-live-verify', 'type' => 'LIVE'],
        'requestedCustomer' => ['id' => $issued5['customer_id']],
        'verifiedCustomer' => [
            'ci' => $dupCi,
            'name' => '중복시도',
        ],
    ];
    try {
        $svc->completeFromPortOne([
            'user_id' => 1005,
            'email' => 'normal5@example.com',
            'role_type' => 'tutor',
        ], $issued5['identity_verification_id']);
        $assert(false, 'duplicate_ci');
    } catch (IdentityVerificationException $e) {
        $assert($e->errorCode === 'identity_duplicate', 'duplicate_ci', $e->errorCode);
    }

    // --- verifiedAt 만료 ---
    $_SESSION = [];
    $issued6 = $svc->issuePendingVerification([
        'user_id' => 1006,
        'email' => 'normal6@example.com',
        'role_type' => 'tutor',
    ]);
    $fake->payload = [
        'status' => 'VERIFIED',
        'verifiedAt' => gmdate('c', time() - 1200),
        'storeId' => 'store-verify',
        'channel' => ['key' => 'channel-live-verify', 'type' => 'LIVE'],
        'requestedCustomer' => ['id' => $issued6['customer_id']],
        'verifiedCustomer' => [
            'ci' => 'ci-owner-1006',
            'name' => '만료',
        ],
    ];
    try {
        $svc->completeFromPortOne([
            'user_id' => 1006,
            'email' => 'normal6@example.com',
            'role_type' => 'tutor',
        ], $issued6['identity_verification_id']);
        $assert(false, 'verified_at_stale');
    } catch (IdentityVerificationException $e) {
        $assert($e->errorCode === 'identity_replay', 'verified_at_stale', $e->errorCode);
    }

    // --- Messages: 새 쪽지만 차단, 기존 대화 답장 허용 ---
    $roomInquiry[101] = 'paused';
    $msgRepo = new MessagesRepository($pdo);
    $msg = new MessagesService($msgRepo);
    try {
        $msg->composeMessage(3001, [
            'context_kind' => 'study_room',
            'context_id' => 101,
            'body' => 'hello new',
        ], [], true);
        $assert(false, 'messages_new_blocked', 'no_throw');
    } catch (\InvalidArgumentException $e) {
        $assert(str_contains($e->getMessage(), '쪽지'), 'messages_new_blocked', $e->getMessage());
    } catch (Throwable $e) {
        $assert(false, 'messages_new_blocked', get_class($e) . ':' . $e->getMessage());
    }

    // 기존 대화가 있으면 답장 compose가 성공해야 함 (inquiry paused여도)
    $messageInserts = 0;
    $prevResolver = $pdo->resolver;
    $threadDetail = [
        'id' => 77,
        'is_blocked' => 0,
        'context_kind' => 'study_room',
        'context_id' => 101,
        'participant_low_user_id' => 1001,
        'participant_high_user_id' => 3001,
        'context_label' => '상세',
        'peer_display_name' => '상대',
        'scope_badge' => '',
        'scope_hint' => '',
        'structured_line' => '',
        'last_message_preview' => 'hello reply',
        'updated_at' => '2026-11-12 00:00:00',
        'last_message_at' => '2026-11-12 00:00:00',
        'initiated_by_user_id' => 3001,
        'last_sender_user_id' => 3001,
        'read_at' => null,
        'peer_read_at' => null,
        'is_archived' => 0,
        'is_important' => 0,
        'block_reason' => null,
        'reported_at' => null,
        'first_message_body' => 'hello',
        'student_request_summary' => null,
        'any_participant_blocked' => 0,
        'participant_low_status' => 'active',
        'participant_high_status' => 'active',
        'participant_low_real_name' => '나',
        'participant_high_real_name' => '상대',
        'show_request_in_panel' => 0,
        'request_summary' => null,
    ];
    $pdo->resolver = static function (string $sql, array $p) use ($prevResolver, &$messageInserts, $threadDetail): array {
        if (preg_match('/SELECT \* FROM message_threads/', $sql)) {
            return ['row' => $threadDetail];
        }
        if (preg_match('/FROM message_threads t/', $sql)) {
            return ['row' => $threadDetail];
        }
        if (preg_match('/message_thread_participant_state/', $sql)) {
            return ['column' => false, 'row' => false];
        }
        if (preg_match('/INSERT INTO messages \(thread_id/', $sql)) {
            $messageInserts++;

            return ['rowCount' => 1];
        }
        if (preg_match('/SELECT id, sender_user_id, body, created_at FROM messages/', $sql)) {
            return ['all' => [
                ['id' => 1, 'sender_user_id' => 3001, 'body' => 'hello reply', 'created_at' => '2026-11-12 00:00:00'],
            ]];
        }
        if (preg_match('/UPDATE message_threads SET last_message_preview/', $sql)) {
            return ['rowCount' => 1];
        }
        if (preg_match('/INSERT INTO message_thread_reads|ON DUPLICATE KEY UPDATE read_at/', $sql)) {
            return ['rowCount' => 1];
        }
        if (preg_match('/information_schema|message_attachments|participant_state|hasImportant/', $sql)) {
            return ['column' => 0, 'row' => false, 'all' => []];
        }

        return $prevResolver($sql, $p);
    };
    try {
        $msg->composeMessage(3001, [
            'context_kind' => 'study_room',
            'context_id' => 101,
            'body' => 'hello reply',
        ], [], true);
        $assert($messageInserts >= 1, 'messages_reply_allowed', 'inserts=' . $messageInserts);
    } catch (Throwable $e) {
        $assert(false, 'messages_reply_allowed', $e->getMessage());
    }
    $pdo->resolver = $prevResolver;

    // --- publicInquiryStatus 마스킹 ---
    $masked = $svc->publicInquiryStatus(1006, 'open');
    $assert($masked === 'paused', 'public_mask_unverified');
    $openOk = $svc->publicInquiryStatus(1001, 'open');
    $assert($openOk === 'open', 'public_mask_verified');

    echo PHP_EOL . "SUMMARY pass={$pass} fail={$fail}" . PHP_EOL;
    exit($fail === 0 ? 0 : 1);
}
