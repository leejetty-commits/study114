<?php

declare(strict_types=1);

/**
 * 쪽지 첫 메모 방향 판정(16§1-2) — composeMessage 전체 경로를 DB 없이 돌려
 * 방향별 통과/차단과 쪽지권 차감 SQL 실행 여부를 확인한다.
 * 기존 대화 후속(composeMessage 재사용 분기 · replyMessage)의 관리자→학생 차단도 함께 본다.
 * Connection 에 메모리 가짜 PDO 를 주입한다. 실제 DB 에 접속하지 않는다.
 * 실행: D:\php8.2\php.exe scripts/verify-message-compose-direction.php
 */

namespace Study114\Messages {
    if (!\function_exists('mb_substr')) {
        function mb_substr(string $string, int $start, ?int $length = null): string
        {
            $chars = \preg_split('//u', $string, -1, PREG_SPLIT_NO_EMPTY) ?: [];

            return \implode('', \array_slice($chars, $start, $length));
        }
    }
}

namespace {
    require_once dirname(__DIR__) . '/src/bootstrap.php';

    use Study114\Database\Connection;
    use Study114\Messages\MessagesRepository;
    use Study114\Messages\MessagesService;
    use Study114\Messages\PaidGateException;

    final class DirStmt
    {
        private mixed $row = false;
        private mixed $column = false;
        private array $all = [];
        private int $rowCount = 0;

        public function __construct(private DirPdo $pdo, private string $sql)
        {
        }

        public function execute(?array $params = null): bool
        {
            $this->pdo->log[] = preg_replace('/\s+/', ' ', trim($this->sql));
            $answer = ($this->pdo->resolver)($this->sql, $params ?? []);
            $this->row = $answer['row'] ?? false;
            $this->column = $answer['column'] ?? false;
            $this->all = $answer['all'] ?? [];
            $this->rowCount = $answer['rowCount'] ?? 0;

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

    final class DirPdo extends PDO
    {
        /** @var list<string> */
        public array $log = [];
        /** @var callable(string, array): array */
        public $resolver;
        private bool $txn = false;
        private int $nextId = 100;

        public function __construct(callable $resolver)
        {
            $this->resolver = $resolver;
        }

        #[\ReturnTypeWillChange]
        public function prepare(string $query, array $options = []): DirStmt
        {
            return new DirStmt($this, $query);
        }

        #[\ReturnTypeWillChange]
        public function query(string $query, ?int $fetchMode = null, mixed ...$fetchModeArgs): DirStmt
        {
            $stmt = new DirStmt($this, $query);
            $stmt->execute();

            return $stmt;
        }

        public function beginTransaction(): bool
        {
            $this->txn = true;

            return true;
        }

        public function commit(): bool
        {
            $this->txn = false;

            return true;
        }

        public function rollBack(): bool
        {
            $this->txn = false;

            return true;
        }

        public function inTransaction(): bool
        {
            return $this->txn;
        }

        #[\ReturnTypeWillChange]
        public function lastInsertId(?string $name = null): string
        {
            return (string) $this->nextId++;
        }
    }

    /**
     * 사용자 픽스처
     * role: user_roles.role_type(is_primary) · tutors/rooms: 소유 프로필 id · tickets: 프로필별 쪽지권 잔여 · bypass: provider_entitlements.cold_memo_allowed
     */
    $users = [
        10 => ['role' => 'parent'],
        11 => ['role' => 'student'],
        20 => ['role' => 'tutor', 'tutors' => [200], 'tickets' => ['tutor:200' => 0]],
        21 => ['role' => 'tutor', 'tutors' => [210], 'tickets' => ['tutor:210' => 3]],
        30 => ['role' => 'study_room_owner', 'rooms' => [300], 'tickets' => ['study_room:300' => 0]],
        90 => ['role' => 'admin'],
        91 => ['role' => 'admin', 'bypass' => true],
        92 => ['role' => 'admin', 'tutors' => [920], 'tickets' => ['tutor:920' => 5]],
        50 => ['role' => 'tutor', 'tutors' => [500]],
        60 => ['role' => 'study_room_owner', 'rooms' => [600]],
        70 => ['role' => 'parent'],
    ];
    $tutorOwner = [500 => 50, 200 => 20, 210 => 21, 920 => 92];
    $roomOwner = [600 => 60, 300 => 30];
    $studentGuardian = [700 => 70];

    /**
     * @param array{kind: string, cid: int, low: int, high: int}|null $thread 기존 대화(없으면 null)
     */
    function makeResolver(array $users, array $tutorOwner, array $roomOwner, array $studentGuardian, int $senderId, ?array $thread): callable
    {
        return static function (string $sql, array $p) use ($users, $tutorOwner, $roomOwner, $studentGuardian, $senderId, $thread): array {
            $uid = (int) ($p[0] ?? 0);
            $u = $users[$uid] ?? [];

            return match (true) {
                (bool) preg_match('/email_verified_at FROM users/', $sql) => ['row' => ['email_verified_at' => '2026-01-01 00:00:00']],
                (bool) preg_match('/SELECT user_id FROM tutors WHERE id/', $sql) => ['column' => $tutorOwner[$uid] ?? false],
                (bool) preg_match('/SELECT user_id FROM study_rooms WHERE id/', $sql) => ['column' => $roomOwner[$uid] ?? false],
                (bool) preg_match('/SELECT guardian_user_id FROM students/', $sql) => ['column' => $studentGuardian[$uid] ?? false],
                (bool) preg_match('/SELECT \* FROM message_threads/', $sql) => ['row' => $thread !== null ? [
                    'id' => 77, 'is_blocked' => 0, 'context_kind' => $thread['kind'], 'context_id' => $thread['cid'],
                    'participant_low_user_id' => $thread['low'], 'participant_high_user_id' => $thread['high'],
                ] : false],
                (bool) preg_match('/role_type FROM user_roles/', $sql) => ['column' => $u['role'] ?? false],
                (bool) preg_match('/cold_memo_allowed FROM provider_entitlements/', $sql) => ['column' => !empty($u['bypass']) ? 1 : false],
                (bool) preg_match('/SELECT id FROM tutors WHERE user_id/', $sql) => ['all' => array_map(static fn (int $id): array => ['id' => $id], $u['tutors'] ?? [])],
                (bool) preg_match('/SELECT id FROM study_rooms WHERE user_id/', $sql) => ['all' => array_map(static fn (int $id): array => ['id' => $id], $u['rooms'] ?? [])],
                (bool) preg_match('/information_schema\.COLUMNS/', $sql) => ['column' => 1],
                (bool) preg_match('/SELECT exposure_status/', $sql) => ['row' => ['exposure_status' => 'published', 'memo_status' => 'open']],
                (bool) preg_match('/COALESCE\(SUM\(remaining\), 0\) FROM provider_ticket_packs/', $sql) => ['column' => ownerTickets($users, (string) $p[0], (int) $p[1])],
                (bool) preg_match('/SELECT id, remaining FROM provider_ticket_packs/', $sql) => ownerTickets($users, (string) $p[0], (int) $p[1]) > 0
                    ? ['row' => ['id' => 1, 'remaining' => ownerTickets($users, (string) $p[0], (int) $p[1])]]
                    : ['row' => false],
                (bool) preg_match('/UPDATE provider_ticket_packs SET remaining = remaining - 1/', $sql) => ['rowCount' => 1],
                (bool) preg_match('/FROM message_threads t\s/', $sql) => ['row' => threadRow($senderId, $thread)],
                default => [],
            };
        };
    }

    function ownerTickets(array $users, string $type, int $id): int
    {
        foreach ($users as $u) {
            if (isset($u['tickets'][$type . ':' . $id])) {
                return (int) $u['tickets'][$type . ':' . $id];
            }
        }

        return 0;
    }

    /**
     * @param array{kind: string, cid: int, low: int, high: int}|null $thread
     * @return array<string, mixed>
     */
    function threadRow(int $senderId, ?array $thread = null): array
    {
        return [
            'id' => 77,
            'participant_low_user_id' => $thread['low'] ?? $senderId, 'participant_high_user_id' => $thread['high'] ?? 999,
            'context_kind' => $thread['kind'] ?? 'tutor', 'context_id' => $thread['cid'] ?? 1, 'context_label' => '상세', 'peer_display_name' => '상대',
            'scope_badge' => '', 'scope_hint' => '', 'structured_line' => '', 'last_message_preview' => '안녕하세요',
            'updated_at' => '2026-10-02 00:00:00', 'last_message_at' => '2026-10-02 00:00:00',
            'initiated_by_user_id' => $senderId, 'last_sender_user_id' => $senderId, 'read_at' => null, 'peer_read_at' => null,
            'is_archived' => 0, 'is_blocked' => 0, 'is_important' => 0, 'block_reason' => null, 'reported_at' => null,
            'first_message_body' => '안녕하세요', 'student_request_summary' => null, 'any_participant_blocked' => 0,
            'participant_low_status' => 'active', 'participant_high_status' => 'active',
            'participant_low_real_name' => '나', 'participant_high_real_name' => '상대',
        ];
    }

    /** @return array{error: ?Throwable, log: list<string>} */
    function runCompose(array $users, array $tutorOwner, array $roomOwner, array $studentGuardian, int $sender, string $kind, int $contextId, array $extra = [], bool $existingThread = false): array
    {
        $thread = null;
        if ($existingThread) {
            $peer = match ($kind) {
                'tutor' => $tutorOwner[$contextId],
                'study_room' => $roomOwner[$contextId],
                'student' => $studentGuardian[$contextId],
            };
            $thread = ['kind' => $kind, 'cid' => $contextId, 'low' => min($sender, $peer), 'high' => max($sender, $peer)];
        }
        $pdo = new DirPdo(makeResolver($users, $tutorOwner, $roomOwner, $studentGuardian, $sender, $thread));
        (new ReflectionProperty(Connection::class, 'pdo'))->setValue(null, $pdo);
        $svc = new MessagesService(new MessagesRepository($pdo));
        $error = null;
        try {
            $svc->composeMessage($sender, ['context_kind' => $kind, 'context_id' => $contextId, 'body' => '안녕하세요'] + $extra);
        } catch (Throwable $e) {
            $error = $e;
        }

        return ['error' => $error, 'log' => $pdo->log];
    }

    /** @return array{error: ?Throwable, log: list<string>} */
    function runReply(array $users, array $tutorOwner, array $roomOwner, array $studentGuardian, int $sender, int $peer, string $kind, int $contextId): array
    {
        $thread = ['kind' => $kind, 'cid' => $contextId, 'low' => min($sender, $peer), 'high' => max($sender, $peer)];
        $pdo = new DirPdo(makeResolver($users, $tutorOwner, $roomOwner, $studentGuardian, $sender, $thread));
        (new ReflectionProperty(Connection::class, 'pdo'))->setValue(null, $pdo);
        $svc = new MessagesService(new MessagesRepository($pdo));
        $error = null;
        try {
            $svc->replyMessage($sender, 77, '답장입니다');
        } catch (Throwable $e) {
            $error = $e;
        }

        return ['error' => $error, 'log' => $pdo->log];
    }

    function countSql(array $log, string $pattern): int
    {
        return count(preg_grep($pattern, $log));
    }

    $results = [];
    function ok(string $name, bool $cond, string $detail = ''): void
    {
        global $results;
        $results[] = $cond;
        echo ($cond ? 'PASS ' : 'FAIL ') . $name . ($cond || $detail === '' ? '' : ' — ' . $detail) . "\n";
    }

    const CONSUME = '/UPDATE provider_ticket_packs SET remaining = remaining - 1/';
    const CONSUME_LOCK = '/SELECT id, remaining FROM provider_ticket_packs .*FOR UPDATE/';
    const TICKET_ANY = '/provider_ticket_packs|provider_entitlements/';
    const THREAD_INSERT = '/INSERT INTO message_threads/';
    const MESSAGE_INSERT = '/INSERT INTO messages /';

    $cases = [
        ['학생→공급자(과외쌤) 첫 쪽지', 10, 'tutor', 500, [], false, 'pass', 0],
        ['학생→공급자(공부방) 첫 쪽지', 10, 'study_room', 600, [], false, 'pass', 0],
        ['공급자(과외쌤)→공급자(공부방) 첫 쪽지', 20, 'study_room', 600, [], false, 'pass', 0],
        ['공급자(공부방)→공급자(과외쌤) 첫 쪽지', 30, 'tutor', 500, [], false, 'pass', 0],
        ['무료 공급자→학생 콜드', 20, 'student', 700, ['provider_type' => 'tutor', 'provider_id' => 200], false, 'paid_gate', 0],
        ['유료 공급자→학생 콜드(쪽지권 1회 차감)', 21, 'student', 700, ['provider_type' => 'tutor', 'provider_id' => 210], false, 'pass', 1],
        ['학생(parent)→학생', 10, 'student', 700, [], false, 'student_denied', 0],
        ['학생(student)→학생', 11, 'student', 700, [], false, 'student_denied', 0],
        ['관리자→학생', 90, 'student', 700, [], false, 'admin_denied', 0],
        ['관리자(cold_memo 우회 보유)→학생', 91, 'student', 700, [], false, 'admin_denied', 0],
        ['관리자(과외쌤 프로필·쪽지권 5 보유)→학생', 92, 'student', 700, ['provider_type' => 'tutor', 'provider_id' => 920], false, 'admin_denied', 0],
        ['관리자→공급자(과외쌤)', 90, 'tutor', 500, [], false, 'pass', 0],
        ['관리자→공급자(공부방)', 90, 'study_room', 600, [], false, 'pass', 0],
        ['기존 대화: 관리자→학생 후속', 90, 'student', 700, [], true, 'admin_denied', 0],
        ['기존 대화: 관리자(과외쌤 프로필·쪽지권 5 보유)→학생 후속', 92, 'student', 700, ['provider_type' => 'tutor', 'provider_id' => 920], true, 'admin_denied', 0],
        ['기존 대화: 관리자→공급자(과외쌤) 후속', 90, 'tutor', 500, [], true, 'pass', 0],
        ['기존 대화: 관리자→공급자(공부방) 후속', 90, 'study_room', 600, [], true, 'pass', 0],
        ['기존 대화: 학생→공급자(과외쌤) 후속', 10, 'tutor', 500, [], true, 'pass', 0],
        ['기존 대화: 유료 공급자→학생 후속(차감 없음)', 21, 'student', 700, ['provider_type' => 'tutor', 'provider_id' => 210], true, 'pass', 0],
        ['기존 대화: 무료 공급자→학생 후속(쪽지권 없이 허용)', 20, 'student', 700, ['provider_type' => 'tutor', 'provider_id' => 200], true, 'pass', 0],
        ['기존 대화: 공급자(과외쌤)→공급자(공부방) 후속', 20, 'study_room', 600, [], true, 'pass', 0],
    ];

    $expectMsg = [
        'paid_gate' => '이 학생에게 먼저 쪽지를 내려면 쪽지권이 필요합니다.',
        'student_denied' => '학생은 공급자에게만 쪽지를 보낼 수 있습니다.',
        'admin_denied' => '관리자 계정은 학생에게 쪽지를 보낼 수 없습니다. 운영 안내는 공지를 이용해 주세요.',
    ];

    foreach ($cases as [$label, $sender, $kind, $cid, $extra, $existing, $expect, $consumes]) {
        echo "=== {$label} ===\n";
        $r = runCompose($users, $tutorOwner, $roomOwner, $studentGuardian, $sender, $kind, $cid, $extra, $existing);
        $err = $r['error'];
        $log = $r['log'];
        if ($expect === 'pass') {
            ok('통과', $err === null, $err ? get_class($err) . ': ' . $err->getMessage() : '');
            if (!$existing) {
                ok('새 대화 생성', countSql($log, THREAD_INSERT) === 1);
            }
        } else {
            $cls = $expect === 'paid_gate' ? PaidGateException::class : InvalidArgumentException::class;
            ok('차단: ' . $expectMsg[$expect], $err instanceof $cls && $err->getMessage() === $expectMsg[$expect], $err ? get_class($err) . ': ' . $err->getMessage() : '예외 없음');
            if ($expect !== 'paid_gate') {
                ok('PaidGateException 아님(422 validation)', !($err instanceof PaidGateException));
            }
            ok('새 대화 생성 안 함', countSql($log, THREAD_INSERT) === 0);
        }
        ok("쪽지권 차감 UPDATE {$consumes}회", countSql($log, CONSUME) === $consumes, (string) countSql($log, CONSUME));
        if ($consumes === 0) {
            ok('쪽지권 잠금 SELECT(FOR UPDATE) 없음', countSql($log, CONSUME_LOCK) === 0);
        }
        if ($expect === 'admin_denied' || $expect === 'student_denied') {
            ok('쪽지권·entitlement 테이블 조회 0회(차감 이전 차단)', countSql($log, TICKET_ANY) === 0, implode(' | ', preg_grep(TICKET_ANY, $log)));
            ok('학생 수신 게이트 조회 전 차단', countSql($log, '/SELECT exposure_status/') === 0);
        }
        if ($existing) {
            $n = countSql($log, MESSAGE_INSERT);
            ok('후속 쪽지 INSERT ' . ($expect === 'pass' ? '1' : '0') . '회', $n === ($expect === 'pass' ? 1 : 0), (string) $n);
        }
    }

    /** [라벨, 보내는 사람, 상대, context_kind, context_id, 기대] — replyMessage 경로 */
    $replyCases = [
        ['답장: 관리자→학생(parent) · student 대화', 90, 70, 'student', 700, 'admin_denied'],
        ['답장: 관리자→학생(student 역할) · student 대화', 90, 11, 'student', 700, 'admin_denied'],
        ['답장: 관리자(과외쌤 프로필 보유)→학생 · student 대화', 92, 70, 'student', 700, 'admin_denied'],
        ['답장: 관리자→공급자(과외쌤) · tutor 대화', 90, 50, 'tutor', 500, 'pass'],
        ['답장: 관리자→공급자(공부방) · study_room 대화', 90, 60, 'study_room', 600, 'pass'],
        ['답장: 관리자→공급자 · student 대화(관리자가 등록 보호자)', 90, 21, 'student', 700, 'pass'],
        ['답장: 학생→관리자 · student 대화(과거 관리자 발신 기록)', 70, 90, 'student', 700, 'pass'],
        ['답장: 학생→관리자 소유 과외쌤 · tutor 대화', 10, 92, 'tutor', 920, 'pass'],
        ['답장: 유료 공급자→학생 · student 대화', 21, 70, 'student', 700, 'pass'],
        ['답장: 무료 공급자→학생 · student 대화', 20, 70, 'student', 700, 'pass'],
        ['답장: 학생→공급자 · tutor 대화', 10, 50, 'tutor', 500, 'pass'],
        ['답장: 공급자→공급자 · study_room 대화', 20, 60, 'study_room', 600, 'pass'],
    ];

    foreach ($replyCases as [$label, $sender, $peer, $kind, $cid, $expect]) {
        echo "=== {$label} ===\n";
        $r = runReply($users, $tutorOwner, $roomOwner, $studentGuardian, $sender, $peer, $kind, $cid);
        $err = $r['error'];
        $log = $r['log'];
        if ($expect === 'pass') {
            ok('통과', $err === null, $err ? get_class($err) . ': ' . $err->getMessage() : '');
        } else {
            ok('차단: ' . $expectMsg[$expect], $err instanceof InvalidArgumentException && !($err instanceof PaidGateException) && $err->getMessage() === $expectMsg[$expect], $err ? get_class($err) . ': ' . $err->getMessage() : '예외 없음');
        }
        $n = countSql($log, MESSAGE_INSERT);
        ok('답장 INSERT ' . ($expect === 'pass' ? '1' : '0') . '회', $n === ($expect === 'pass' ? 1 : 0), (string) $n);
        ok('쪽지권·entitlement 조회 0회', countSql($log, TICKET_ANY) === 0, implode(' | ', preg_grep(TICKET_ANY, $log)));
    }

    $failed = count(array_filter($results, static fn (bool $r): bool => !$r));
    echo "\n" . (count($results) - $failed) . '/' . count($results) . " PASS\n";
    exit($failed === 0 ? 0 : 1);
}
