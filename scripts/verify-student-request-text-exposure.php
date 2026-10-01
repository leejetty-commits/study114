<?php

declare(strict_types=1);

/**
 * 학생 요청문·특이요청 원문 노출(무결성-5d)
 * - 찾기 학생 목록(SearchService)·본인/관리자 학생 행(StudentHubRepository) 응답에
 *   request_summary_visibility / special_request_visibility 가 없다.
 * - 원문은 유료 공급자·관리자·학생 본인만 받는다. 무료 공급자·게스트·학생(타 학생)은 빈 문자열.
 * - 학생 수정(PATCH)으로 두 값을 바꿀 수 없다. 가입 INSERT 는 NOT NULL 컬럼에 'private' 을 계속 넣는다.
 * Connection 에 메모리 가짜 PDO 를 주입한다. 실제 DB 에 접속하지 않는다.
 * 실행: D:\php8.2\php.exe scripts/verify-student-request-text-exposure.php
 */

namespace Study114\Registration {
    if (!\function_exists('mb_strlen')) {
        function mb_strlen(string $string, ?string $encoding = null): int
        {
            return \count(\preg_split('//u', $string, -1, PREG_SPLIT_NO_EMPTY) ?: []);
        }
    }
}

namespace {
    require_once dirname(__DIR__) . '/src/bootstrap.php';

    use Study114\Database\Connection;
    use Study114\Paid\StudentRequestTextAccess;
    use Study114\Registration\StudentHubRepository;
    use Study114\Search\SearchService;

    final class RtStmt
    {
        /** @var list<mixed> */
        private array $rows = [];
        private mixed $column = false;
        private int $cursor = 0;
        /** @var array<string, mixed> */
        private array $bound = [];

        public function __construct(private RtPdo $pdo, private string $sql)
        {
        }

        public function bindValue(string|int $param, mixed $value, int $type = PDO::PARAM_STR): bool
        {
            $this->bound[(string) $param] = $value;

            return true;
        }

        public function execute(?array $params = null): bool
        {
            $this->pdo->log[] = preg_replace('/\s+/', ' ', trim($this->sql));
            $answer = ($this->pdo->resolver)($this->sql, $params ?? $this->bound);
            $this->rows = $answer['rows'] ?? [];
            $this->column = $answer['column'] ?? false;
            $this->cursor = 0;

            return true;
        }

        public function fetch(mixed ...$args): mixed
        {
            return $this->rows[$this->cursor++] ?? false;
        }

        public function fetchColumn(mixed ...$args): mixed
        {
            return $this->column;
        }

        public function fetchAll(mixed ...$args): array
        {
            if (($args[0] ?? null) === PDO::FETCH_COLUMN) {
                return array_map(static fn (array $r): mixed => reset($r), $this->rows);
            }

            return $this->rows;
        }

        public function rowCount(): int
        {
            return count($this->rows);
        }
    }

    final class RtPdo extends PDO
    {
        /** @var list<string> */
        public array $log = [];
        /** @var callable(string, array): array */
        public $resolver;
        private bool $txn = false;

        public function __construct(callable $resolver)
        {
            $this->resolver = $resolver;
        }

        #[\ReturnTypeWillChange]
        public function prepare(string $query, array $options = []): RtStmt
        {
            return new RtStmt($this, $query);
        }

        #[\ReturnTypeWillChange]
        public function query(string $query, ?int $fetchMode = null, mixed ...$fetchModeArgs): RtStmt
        {
            $stmt = new RtStmt($this, $query);
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
    }

    const REQUEST_TEXT = '주 2회 저녁, 내신 대비 희망';
    const SPECIAL_TEXT = '수학 기초가 약해 보충 필요';
    const VISIBILITY_KEYS = ['request_summary_visibility', 'special_request_visibility'];

    /** DB 행(컬럼 자체는 남아 있으므로 SELECT * 는 두 값을 그대로 돌려준다) */
    function studentDbRow(): array
    {
        return [
            'id' => 700, 'guardian_user_id' => 70, 'student_name' => '김하늘', 'public_display_name' => '맑은하늘',
            'grade_level' => '중2', 'gender' => 'female', 'birth_year' => 2012, 'exposure_status' => 'published',
            'memo_status' => 'open', 'preferred_lesson_type' => 'tutor', 'preferred_tutor_region_id' => null,
            'preferred_studyroom_region_id' => null, 'preferred_studyroom_complex_id' => null,
            'preferred_studyroom_region_basis' => null, 'preferred_region_note' => '서울 강남구',
            'lesson_format' => 'one_on_one', 'student_gender_group' => null, 'preferred_student_count_group' => 'solo',
            'lessons_per_week' => 2, 'minutes_per_lesson' => 90, 'preferred_fee_amount' => 550000,
            'preferred_studyroom_fee_amount' => null, 'preferred_tutor_gender' => 'any',
            'request_summary' => REQUEST_TEXT, 'request_summary_visibility' => 'paid_only',
            'special_request_note' => SPECIAL_TEXT, 'special_request_visibility' => 'paid_only',
            'updated_at' => '2026-10-01 00:00:00', 'published_at' => '2026-10-01 00:00:00',
            'budget_amount' => 550000, 'dong_name' => '역삼동', 'sigungu_name' => '강남구', 'sido_name' => '서울특별시',
            'complex_name' => null, 'subject_name' => '수학', 'created_at' => '2026-10-01 00:00:00',
        ];
    }

    /** 유료 공급자 = 기간 내 포지션 ≥ 1 (StudentRequestTextAccess) */
    const PAID_PROVIDERS = [21, 31];

    function makeResolver(): callable
    {
        return static function (string $sql, array $p): array {
            return match (true) {
                (bool) preg_match('/FROM provider_position_subscriptions/', $sql) => [
                    'rows' => in_array((int) ($p[0] ?? 0), PAID_PROVIDERS, true)
                        ? [['id' => 1, 'sku_code' => 'pick', 'end_exclusive_on' => '2099-01-01']]
                        : [],
                ],
                (bool) preg_match('/information_schema\.COLUMNS/', $sql) => ['column' => 1],
                (bool) preg_match('/SELECT COUNT\(DISTINCT s\.id\) FROM students/', $sql) => ['column' => 1],
                (bool) preg_match('/SELECT DISTINCT s\.id/', $sql) => ['rows' => [studentDbRow()]],
                (bool) preg_match('/SELECT s\.\* FROM students/', $sql) => ['rows' => [studentDbRow()]],
                (bool) preg_match('/FROM student_subject_targets/', $sql) => ['rows' => [['subject_name' => '수학', 'school_level' => 'middle']]],
                (bool) preg_match('/FROM student_preferred_lesson_places/', $sql) => ['rows' => [['place_type' => 'student_home']]],
                (bool) preg_match('/FROM student_preferred_teaching_style_badges/', $sql) => ['rows' => [['badge_name' => 'meticulous']]],
                default => [],
            };
        };
    }

    function freshPdo(): RtPdo
    {
        $pdo = new RtPdo(makeResolver());
        (new ReflectionProperty(Connection::class, 'pdo'))->setValue(null, $pdo);

        return $pdo;
    }

    $results = [];
    function ok(string $name, bool $cond, string $detail = ''): void
    {
        global $results;
        $results[] = $cond;
        echo ($cond ? 'PASS ' : 'FAIL ') . $name . ($cond || $detail === '' ? '' : ' — ' . $detail) . "\n";
    }

    /** @param array<string, mixed> $item */
    function assertNoVisibilityKeys(string $where, array $item): void
    {
        foreach (VISIBILITY_KEYS as $key) {
            ok("{$where}: 응답에 {$key} 없음", !array_key_exists($key, $item), 'key present');
        }
    }

    // ── 1. 찾기 학생 목록: 보는 사람별 원문 수신 ──
    // search.php 와 같은 순서: 세션 사용자 → StudentRequestTextAccess::canReceive → SearchService::search
    $viewers = [
        ['게스트(비로그인)', 0, '', false],
        ['학생(보호자 계정 · 타 학생 열람)', 70, 'guardian_student', false],
        ['학생(student 역할)', 71, 'student', false],
        ['무료 공급자(과외쌤)', 20, 'tutor', false],
        ['무료 공급자(공부방)', 30, 'study_room_owner', false],
        ['유료 공급자(과외쌤)', 21, 'tutor', true],
        ['유료 공급자(공부방)', 31, 'study_room_owner', true],
        ['관리자', 90, 'admin', true],
    ];

    foreach ($viewers as [$label, $userId, $role, $expectText]) {
        echo "=== 찾기 학생 목록 · {$label} ===\n";
        freshPdo();
        $include = (new StudentRequestTextAccess())->canReceive($userId, $role);
        ok('원문 수신 판정 ' . ($expectText ? '허용' : '차단'), $include === $expectText);
        $result = (new SearchService())->search('student', [], 1, 20, 'latest', $include);
        $item = $result['items'][0] ?? [];
        ok('학생 1건 응답', $item !== [] && (int) ($item['id'] ?? 0) === 700);
        ok('request_summary ' . ($expectText ? '원문' : '빈 문자열'), ($item['request_summary'] ?? null) === ($expectText ? REQUEST_TEXT : ''), var_export($item['request_summary'] ?? null, true));
        ok('special_request_note ' . ($expectText ? '원문' : '빈 문자열'), ($item['special_request_note'] ?? null) === ($expectText ? SPECIAL_TEXT : ''), var_export($item['special_request_note'] ?? null, true));
        assertNoVisibilityKeys('찾기 목록', $item);
    }

    echo "=== 찾기 학생 목록 · SELECT 컬럼 ===\n";
    $pdo = freshPdo();
    (new SearchService())->search('student', [], 1, 20, 'latest', true);
    $select = implode("\n", preg_grep('/SELECT DISTINCT s\.id/', $pdo->log));
    ok('SELECT 에 request_summary 포함', str_contains($select, 's.request_summary'));
    ok('SELECT 에 special_request_note 포함', str_contains($select, 's.special_request_note'));
    foreach (VISIBILITY_KEYS as $key) {
        ok("SELECT 에 {$key} 없음", !str_contains($select, $key));
    }

    // ── 2. 학생 본인(보호자)·관리자 경로: 원문 그대로, 공개 범위 값 없음 ──
    echo "=== 학생 본인 · getForGuardian ===\n";
    freshPdo();
    $own = (new StudentHubRepository(Connection::get()))->getForGuardian(70, 700) ?? [];
    ok('본인 행 응답', $own !== []);
    ok('본인: request_summary 원문', ($own['request_summary'] ?? null) === REQUEST_TEXT);
    ok('본인: special_request_note 원문', ($own['special_request_note'] ?? null) === SPECIAL_TEXT);
    assertNoVisibilityKeys('본인 상세', $own);

    echo "=== 학생 본인 · listForGuardian ===\n";
    freshPdo();
    $list = (new StudentHubRepository(Connection::get()))->listForGuardian(70);
    ok('본인 목록 1건', count($list) === 1);
    ok('본인 목록: request_summary 원문', ($list[0]['request_summary'] ?? null) === REQUEST_TEXT);
    assertNoVisibilityKeys('본인 목록', $list[0] ?? []);

    echo "=== 관리자 · findById ===\n";
    freshPdo();
    $admin = (new StudentHubRepository(Connection::get()))->findById(700) ?? [];
    ok('관리자: request_summary 원문', ($admin['request_summary'] ?? null) === REQUEST_TEXT);
    ok('관리자: special_request_note 원문', ($admin['special_request_note'] ?? null) === SPECIAL_TEXT);
    assertNoVisibilityKeys('관리자 조회', $admin);

    // ── 3. 학생 수정(PATCH)으로 공개 범위 값을 바꿀 수 없다 ──
    foreach (VISIBILITY_KEYS as $key) {
        foreach (['private', 'paid_only'] as $value) {
            echo "=== PATCH {$key}={$value} ===\n";
            $pdo = freshPdo();
            $error = null;
            try {
                (new StudentHubRepository($pdo))->patchStudent(700, [$key => $value]);
            } catch (Throwable $e) {
                $error = $e;
            }
            ok('거부(InvalidArgumentException)', $error instanceof InvalidArgumentException, $error ? get_class($error) : '예외 없음');
            ok('거부 문구: 저장할 수 없는 항목', $error !== null && $error->getMessage() === "{$key}: 저장할 수 없는 항목입니다.", $error ? $error->getMessage() : '');
            ok('UPDATE students 실행 안 함', preg_grep('/UPDATE students/', $pdo->log) === []);
        }
    }

    echo "=== PATCH 요청문 원문은 계속 저장 ===\n";
    $pdo = freshPdo();
    $error = null;
    try {
        (new StudentHubRepository($pdo))->patchStudent(700, ['request_summary' => '새 요청문', 'special_request_note' => '새 특이요청']);
    } catch (Throwable $e) {
        $error = $e;
    }
    $update = implode("\n", preg_grep('/UPDATE students/', $pdo->log));
    ok('통과', $error === null, $error ? $error->getMessage() : '');
    ok('UPDATE 에 request_summary·special_request_note', str_contains($update, 'request_summary = ?') && str_contains($update, 'special_request_note = ?'));
    foreach (VISIBILITY_KEYS as $key) {
        ok("UPDATE 에 {$key} 없음", !str_contains($update, $key));
    }

    // ── 4. 가입 INSERT 는 NOT NULL 컬럼에 'private' 을 계속 넣는다(소스 확인) ──
    echo "=== 가입 INSERT ===\n";
    $basic = (string) file_get_contents(dirname(__DIR__) . '/src/Auth/BasicRegisterService.php');
    ok("BasicRegisterService INSERT 에 request_summary_visibility => 'private' 유지", (bool) preg_match("/'request_summary_visibility'\s*=>\s*'private'/", $basic));

    $failed = count(array_filter($results, static fn (bool $r): bool => !$r));
    echo "\n" . (count($results) - $failed) . '/' . count($results) . " PASS\n";
    exit($failed === 0 ? 0 : 1);
}
