<?php

declare(strict_types=1);

/**
 * 쪽지 첨부 — DB 롤백 시 이번 요청에서 쓴 첨부 파일이 디스크에서 지워지는지 확인한다.
 * DB에 접속하지 않는다: Connection 에 메모리 가짜 PDO 를 주입하고, 첨부 루트는 임시 디렉터리를 쓴다.
 * 실행: D:\php8.2\php.exe scripts/verify-message-attachment-cleanup.php
 */

namespace Study114\Messages {
    // CLI 에는 HTTP 업로드가 없으므로 이 네임스페이스 안의 비한정 호출만 대체한다.
    function is_uploaded_file(string $filename): bool
    {
        return \is_file($filename);
    }

    if (!\function_exists('mime_content_type')) {
        function mime_content_type($file): string|false
        {
            return match (\strtolower(\pathinfo((string) $file, PATHINFO_EXTENSION))) {
                'png' => 'image/png',
                'pdf' => 'application/pdf',
                default => false,
            };
        }
    }

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

    use Study114\Board\AttachmentStorage;
    use Study114\Database\Connection;
    use Study114\Messages\MessageAttachmentService;
    use Study114\Messages\MessagesRepository;
    use Study114\Messages\MessagesService;

    final class FakeStmt
    {
        private mixed $row = false;
        private mixed $column = false;

        public function __construct(private FakePdo $pdo, private string $sql)
        {
        }

        public function execute(?array $params = null): bool
        {
            $this->pdo->log[] = $this->sql;
            foreach ($this->pdo->failRules as $pattern => $message) {
                if (preg_match($pattern, $this->sql)) {
                    throw new PDOException($message);
                }
            }
            if (preg_match('/INSERT INTO message_attachments/', $this->sql)) {
                $this->pdo->pendingAttachments[] = (string) ($params[3] ?? '');
            }
            foreach ($this->pdo->selectRules as $pattern => $answer) {
                if (preg_match($pattern, $this->sql)) {
                    $this->row = $answer['row'] ?? false;
                    $this->column = $answer['column'] ?? false;
                }
            }

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
            return [];
        }
    }

    final class FakePdo extends PDO
    {
        /** @var list<string> */
        public array $log = [];
        /** @var array<string, string> 정규식 => PDOException 메시지 */
        public array $failRules = [];
        /** @var array<string, array{row?: mixed, column?: mixed}> */
        public array $selectRules = [];
        public bool $failCommit = false;
        public int $rollbacks = 0;
        /** @var list<string> */
        public array $pendingAttachments = [];
        /** @var list<string> */
        public array $committedAttachments = [];
        private bool $txn = false;
        private int $nextId = 100;

        public function __construct()
        {
        }

        #[\ReturnTypeWillChange]
        public function prepare(string $query, array $options = []): FakeStmt
        {
            return new FakeStmt($this, $query);
        }

        #[\ReturnTypeWillChange]
        public function query(string $query, ?int $fetchMode = null, mixed ...$fetchModeArgs): FakeStmt
        {
            $stmt = new FakeStmt($this, $query);
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
            if ($this->failCommit) {
                throw new PDOException('fake commit failure');
            }
            $this->txn = false;
            array_push($this->committedAttachments, ...$this->pendingAttachments);
            $this->pendingAttachments = [];

            return true;
        }

        public function rollBack(): bool
        {
            $this->txn = false;
            $this->rollbacks++;
            $this->pendingAttachments = [];

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

    $results = [];
    function ok(string $name, bool $cond, string $detail = ''): void
    {
        global $results;
        $results[] = $cond;
        echo ($cond ? 'PASS ' : 'FAIL ') . $name . ($cond || $detail === '' ? '' : ' — ' . $detail) . "\n";
    }

    /** @return list<string> */
    function filesUnder(string $dir): array
    {
        if (!is_dir($dir)) {
            return [];
        }
        $out = [];
        $it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($dir, FilesystemIterator::SKIP_DOTS));
        foreach ($it as $f) {
            if ($f->isFile()) {
                $out[] = $f->getPathname();
            }
        }

        return $out;
    }

    function rrmdir(string $dir): void
    {
        if (!is_dir($dir)) {
            return;
        }
        $it = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($dir, FilesystemIterator::SKIP_DOTS),
            RecursiveIteratorIterator::CHILD_FIRST,
        );
        foreach ($it as $f) {
            $f->isDir() ? rmdir($f->getPathname()) : unlink($f->getPathname());
        }
        rmdir($dir);
    }

    $base = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'study114-msg-cleanup-' . bin2hex(random_bytes(4));
    $uploadDir = $base . DIRECTORY_SEPARATOR . 'upload';
    $storeRoot = $base . DIRECTORY_SEPARATOR . 'attachments';
    mkdir($uploadDir, 0775, true);

    /** @return list<array<string, mixed>> */
    function makeUploads(string $uploadDir, int $count): array
    {
        $files = [];
        for ($i = 0; $i < $count; $i++) {
            $tmp = $uploadDir . DIRECTORY_SEPARATOR . 'u' . bin2hex(random_bytes(4)) . '.png';
            file_put_contents($tmp, str_repeat('x', 64));
            $files[] = ['name' => "photo{$i}.png", 'type' => 'image/png', 'tmp_name' => $tmp, 'error' => UPLOAD_ERR_OK, 'size' => 64];
        }

        return $files;
    }

    /** @return array{0: FakePdo, 1: MessagesService} */
    function freshService(string $storeRoot): array
    {
        $pdo = new FakePdo();
        $pdo->selectRules = [
            '/email_verified_at FROM users/' => ['row' => ['email_verified_at' => '2026-01-01 00:00:00']],
            '/SELECT user_id FROM tutors/' => ['column' => 200],
            '/role_type FROM user_roles/' => ['column' => 'parent'],
            '/FROM message_threads t\s+LEFT JOIN/' => ['row' => ['id' => 7, 'is_blocked' => 0, 'context_kind' => 'tutor']],
        ];
        (new ReflectionProperty(Connection::class, 'pdo'))->setValue(null, $pdo);
        $svc = new MessagesService(
            new MessagesRepository($pdo),
            null,
            new MessageAttachmentService(new AttachmentStorage($storeRoot)),
        );

        return [$pdo, $svc];
    }

    $insert = new ReflectionMethod(MessagesService::class, 'insertMessageWithFiles');

    try {
        echo "=== A. insertMessageWithFiles: 첨부 저장 성공 후 commit 실패 ===\n";
        [$pdo, $svc] = freshService($storeRoot);
        $pdo->failCommit = true;
        $caught = null;
        try {
            $insert->invoke($svc, 7, 100, '본문', makeUploads($uploadDir, 2));
        } catch (Throwable $e) {
            $caught = $e;
        }
        ok('원래 예외(commit 실패)를 그대로 다시 던짐', $caught instanceof PDOException && $caught->getMessage() === 'fake commit failure', (string) $caught?->getMessage());
        ok('첨부 INSERT 가 실행됐음(저장 성공 후 실패)', count(preg_grep('/INSERT INTO message_attachments/', $pdo->log)) === 2);
        ok('rollBack 호출', $pdo->rollbacks === 1);
        ok('디스크에 남은 첨부 파일 0개', filesUnder($storeRoot) === [], implode(', ', filesUnder($storeRoot)));

        echo "=== B. insertMessageWithFiles: 정상 경로 ===\n";
        [$pdo, $svc] = freshService($storeRoot);
        $insert->invoke($svc, 7, 100, '본문', makeUploads($uploadDir, 2));
        $onDisk = filesUnder($storeRoot);
        ok('commit 된 첨부 2건', count($pdo->committedAttachments) === 2);
        ok('디스크 파일 2개 유지', count($onDisk) === 2, (string) count($onDisk));
        $allPresent = true;
        foreach ($pdo->committedAttachments as $rel) {
            $allPresent = $allPresent && is_file($storeRoot . '/' . $rel);
        }
        ok('DB storage_path 와 디스크 파일 일치', $allPresent);
        rrmdir($storeRoot);

        echo "=== C. composeMessage(새 대화, 자체 트랜잭션): insertMessageWithFiles 성공 후 upsertThreadRead 실패 ===\n";
        [$pdo, $svc] = freshService($storeRoot);
        $pdo->failRules = ['/INSERT INTO message_thread_reads/' => 'fake upsertThreadRead failure'];
        $caught = null;
        try {
            $svc->composeMessage(100, ['context_kind' => 'tutor', 'context_id' => 5, 'body' => '안녕하세요'], makeUploads($uploadDir, 1), true);
        } catch (Throwable $e) {
            $caught = $e;
        }
        ok('원래 예외를 그대로 다시 던짐', $caught instanceof PDOException && $caught->getMessage() === 'fake upsertThreadRead failure', (string) $caught?->getMessage());
        ok('첨부 INSERT 실행됨', count(preg_grep('/INSERT INTO message_attachments/', $pdo->log)) === 1);
        ok('rollBack 호출', $pdo->rollbacks === 1);
        ok('디스크에 남은 첨부 파일 0개', filesUnder($storeRoot) === [], implode(', ', filesUnder($storeRoot)));

        echo "=== D. composeMessage(바깥 트랜잭션 ownTxn=false): upsertThreadRead 실패 — 한계 확인 ===\n";
        [$pdo, $svc] = freshService($storeRoot);
        $pdo->failRules = ['/INSERT INTO message_thread_reads/' => 'fake upsertThreadRead failure'];
        $pdo->beginTransaction();
        $caught = null;
        try {
            $svc->composeMessage(100, ['context_kind' => 'tutor', 'context_id' => 5, 'body' => '안녕하세요'], makeUploads($uploadDir, 1), true);
        } catch (Throwable $e) {
            $caught = $e;
        }
        ok('예외 전파, 롤백은 호출자 몫(서비스는 rollBack 안 함)', $caught instanceof PDOException && $pdo->rollbacks === 0);
        ok('파일은 남음(호출자 롤백은 추적하지 않는 한계)', count(filesUnder($storeRoot)) === 1);
        $pdo->rollBack();
        rrmdir($storeRoot);

        echo "=== E. replyMessage: insertMessageWithFiles 내부 commit 실패 ===\n";
        [$pdo, $svc] = freshService($storeRoot);
        $pdo->failCommit = true;
        $caught = null;
        try {
            $svc->replyMessage(100, 7, '답장', makeUploads($uploadDir, 2));
        } catch (Throwable $e) {
            $caught = $e;
        }
        ok('원래 예외를 그대로 다시 던짐', $caught instanceof PDOException && $caught->getMessage() === 'fake commit failure', (string) $caught?->getMessage());
        ok('rollBack 호출', $pdo->rollbacks === 1);
        ok('디스크에 남은 첨부 파일 0개', filesUnder($storeRoot) === [], implode(', ', filesUnder($storeRoot)));

        echo "=== F. storeForMessage 내부 실패(첨부 INSERT) — 기존 정리 유지 ===\n";
        [$pdo] = freshService($storeRoot);
        $attachments = new MessageAttachmentService(new AttachmentStorage($storeRoot));
        $uploads = makeUploads($uploadDir, 2);
        $caught = null;
        try {
            $attachments->storeForMessage(7, 300, [$uploads[0]]);
            $firstPaths = $attachments->lastStoredPaths();
            ok('성공 호출 후 lastStoredPaths 1건', count($firstPaths) === 1);
            $pdo->failRules = ['/INSERT INTO message_attachments/' => 'fake attachment insert failure'];
            $attachments->storeForMessage(7, 301, [$uploads[1]]);
        } catch (Throwable $e) {
            $caught = $e;
        }
        ok('내부 실패 예외 전파', $caught instanceof PDOException);
        ok('실패 호출 후 lastStoredPaths 비어 있음', $attachments->lastStoredPaths() === []);
        ok('실패 호출이 쓴 파일만 지워지고 이전 성공 파일 1개는 유지', count(filesUnder($storeRoot)) === 1);

        echo "=== G. deleteStoredFiles: 없는 경로·잘못된 경로는 무시 ===\n";
        $threw = false;
        try {
            $attachments->deleteStoredFiles(['messages/7/not-exist.png', '../escape.png', '']);
        } catch (Throwable) {
            $threw = true;
        }
        ok('예외 없이 통과', !$threw);
    } finally {
        rrmdir($base);
    }

    $failed = count(array_filter($results, static fn (bool $r): bool => !$r));
    echo "\n" . (count($results) - $failed) . '/' . count($results) . " PASS\n";
    exit($failed === 0 ? 0 : 1);
}
