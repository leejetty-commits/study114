<?php

declare(strict_types=1);

/**
 * 공부방 원장 표시 이름 fallback 검증
 *
 * 해결책:
 * - operator_display_name 이 NULL 이거나 공백이면 같은 행의 study_room_name(trim)을 대신 표시
 * - 둘 다 비면 기존처럼 ''
 *
 * 검증 항목:
 * - (a) operator_display_name 값 있음 → 그 값
 * - (b) operator_display_name NULL → study_room_name
 * - (c) operator_display_name 공백 문자열 → study_room_name
 * - (d) 둘 다 빈값/공백/NULL → ''
 * - (e) 행 없음 (미등록 사용자) → ''
 * - (f) study_room_name 앞뒤 공백 trim 처리
 * - (g) user_id당 복수 행 존재 시 ORDER BY id ASC LIMIT 1 적용
 * - (h) auth role_type: study_room_owner, study_room 둘 다 지원
 * - (i) user_id <= 0 이거나 미인증 시 ''
 *
 * 실행:
 *   php -d extension=pdo_sqlite scripts/verify-board-studyroom-displayname-fallback.php
 *   또는 php scripts/verify-board-studyroom-displayname-fallback.php
 */

require_once dirname(__DIR__) . '/src/bootstrap.php';

use Study114\Board\AuthorDisplayNameResolver;

$failed = 0;
function ok(string $name, bool $cond, string $detail = ''): void
{
    global $failed;
    if ($cond) {
        echo "PASS  {$name}\n";
        return;
    }
    $failed++;
    fwrite(STDERR, "FAIL  {$name}" . ($detail !== '' ? " — {$detail}" : '') . "\n");
}

function createTestPdo(): PDO
{
    if (extension_loaded('pdo_sqlite')) {
        echo "INFO  Using SQLite in-memory PDO\n";
        $pdo = new PDO('sqlite::memory:');
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->exec('CREATE TABLE study_rooms (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            operator_display_name TEXT NULL,
            study_room_name TEXT NULL
        )');

        $rows = [
            // (a) operator_display_name 있음
            [1, 101, '원장선생님', '대치수학공부방'],
            // (b) operator_display_name NULL
            [2, 102, null, '서초영어공부방'],
            // (c) operator_display_name 공백 문자열
            [3, 103, '   ', '송파과학공부방'],
            // (d-1) 둘 다 NULL
            [4, 104, null, null],
            // (d-2) operator_display_name 공백, study_room_name NULL
            [5, 105, '  ', null],
            // (d-3) operator_display_name NULL, study_room_name 공백
            [6, 106, null, '   '],
            // (d-4) 둘 다 공백
            [7, 107, '  ', '   '],
            // (f) study_room_name 앞뒤 공백 trim 검증
            [8, 108, null, '  역삼국어공부방  '],
            // (g) 복수 행 있을 때 ORDER BY id ASC LIMIT 1 첫번째 행 채택
            [9, 109, null, '1호점공부방'],
            [10, 109, null, '2호점공부방'],
        ];

        $stmt = $pdo->prepare('INSERT INTO study_rooms (id, user_id, operator_display_name, study_room_name) VALUES (?, ?, ?, ?)');
        foreach ($rows as $row) {
            $stmt->execute($row);
        }

        return $pdo;
    }

    echo "INFO  Using Mock PDO (pdo_sqlite extension not loaded in default php.ini)\n";
    return new class extends PDO {
        private array $rows = [
            101 => ['id' => 1, 'operator_display_name' => '원장선생님', 'study_room_name' => '대치수학공부방'],
            102 => ['id' => 2, 'operator_display_name' => null, 'study_room_name' => '서초영어공부방'],
            103 => ['id' => 3, 'operator_display_name' => '   ', 'study_room_name' => '송파과학공부방'],
            104 => ['id' => 4, 'operator_display_name' => null, 'study_room_name' => null],
            105 => ['id' => 5, 'operator_display_name' => '  ', 'study_room_name' => null],
            106 => ['id' => 6, 'operator_display_name' => null, 'study_room_name' => '   '],
            107 => ['id' => 7, 'operator_display_name' => '  ', 'study_room_name' => '   '],
            108 => ['id' => 8, 'operator_display_name' => null, 'study_room_name' => '  역삼국어공부방  '],
            109 => ['id' => 9, 'operator_display_name' => null, 'study_room_name' => '1호점공부방'],
        ];

        public function __construct() {}

        #[\ReturnTypeWillChange]
        public function prepare(string $query, array $options = []): mixed
        {
            return new class($this->rows, $query) {
                private array $rows;
                private string $query;
                private ?array $result = null;

                public function __construct(array $rows, string $query)
                {
                    $this->rows = $rows;
                    $this->query = $query;
                }

                public function execute(?array $params = null): bool
                {
                    $userId = (int) ($params[0] ?? 0);
                    $this->result = $this->rows[$userId] ?? null;
                    return true;
                }

                public function fetch(int $mode = PDO::FETCH_DEFAULT, int $cursorOrientation = PDO::FETCH_ORI_NEXT, int $cursorOffset = 0): mixed
                {
                    return $this->result ?: false;
                }
            };
        }
    };
}

$pdo = createTestPdo();
$resolver = new AuthorDisplayNameResolver($pdo);

// (a) operator_display_name 값 있음 → 그 값
$valA = $resolver->resolve(['user_id' => 101, 'role_type' => 'study_room_owner']);
ok(
    'case_a_operator_display_name_present',
    $valA === '원장선생님',
    "expected '원장선생님', got '{$valA}'"
);

// (b) operator_display_name NULL → study_room_name
$valB = $resolver->resolve(['user_id' => 102, 'role_type' => 'study_room_owner']);
ok(
    'case_b_operator_display_name_null_fallback_to_room_name',
    $valB === '서초영어공부방',
    "expected '서초영어공부방', got '{$valB}'"
);

// (c) operator_display_name 공백 문자열 → study_room_name
$valC = $resolver->resolve(['user_id' => 103, 'role_type' => 'study_room_owner']);
ok(
    'case_c_operator_display_name_whitespace_fallback_to_room_name',
    $valC === '송파과학공부방',
    "expected '송파과학공부방', got '{$valC}'"
);

// (d-1) 둘 다 NULL → ''
$valD1 = $resolver->resolve(['user_id' => 104, 'role_type' => 'study_room_owner']);
ok(
    'case_d1_both_null_returns_empty',
    $valD1 === '',
    "expected '', got '{$valD1}'"
);

// (d-2) operator_display_name 공백, study_room_name NULL → ''
$valD2 = $resolver->resolve(['user_id' => 105, 'role_type' => 'study_room_owner']);
ok(
    'case_d2_operator_whitespace_name_null_returns_empty',
    $valD2 === '',
    "expected '', got '{$valD2}'"
);

// (d-3) operator_display_name NULL, study_room_name 공백 → ''
$valD3 = $resolver->resolve(['user_id' => 106, 'role_type' => 'study_room_owner']);
ok(
    'case_d3_operator_null_name_whitespace_returns_empty',
    $valD3 === '',
    "expected '', got '{$valD3}'"
);

// (d-4) 둘 다 공백 → ''
$valD4 = $resolver->resolve(['user_id' => 107, 'role_type' => 'study_room_owner']);
ok(
    'case_d4_both_whitespace_returns_empty',
    $valD4 === '',
    "expected '', got '{$valD4}'"
);

// (e) 행 없음 (미등록 사용자) → ''
$valE = $resolver->resolve(['user_id' => 999, 'role_type' => 'study_room_owner']);
ok(
    'case_e_no_row_returns_empty',
    $valE === '',
    "expected '', got '{$valE}'"
);

// (f) study_room_name 앞뒤 공백 trim 처리
$valF = $resolver->resolve(['user_id' => 108, 'role_type' => 'study_room_owner']);
ok(
    'case_f_room_name_trimmed',
    $valF === '역삼국어공부방',
    "expected '역삼국어공부방', got '{$valF}'"
);

// (g) 복수 행 존재 시 ORDER BY id ASC LIMIT 1 적용 (첫 번째 등록 공부방명)
$valG = $resolver->resolve(['user_id' => 109, 'role_type' => 'study_room_owner']);
ok(
    'case_g_order_by_id_asc_first_row',
    $valG === '1호점공부방',
    "expected '1호점공부방', got '{$valG}'"
);

// (h) role_type: 'study_room' 도 동일하게 동작
$valH = $resolver->resolve(['user_id' => 102, 'role_type' => 'study_room']);
ok(
    'case_h_role_type_study_room_alias',
    $valH === '서초영어공부방',
    "expected '서초영어공부방', got '{$valH}'"
);

// (i) user_id <= 0 이거나 미인증 시 ''
$valI1 = $resolver->resolve(['user_id' => 0, 'role_type' => 'study_room_owner']);
$valI2 = $resolver->resolve([]);
ok(
    'case_i_invalid_auth_returns_empty',
    $valI1 === '' && $valI2 === '',
    "expected empty string for invalid auth"
);

echo "\n{$failed} failed\n";
exit($failed > 0 ? 1 : 0);
