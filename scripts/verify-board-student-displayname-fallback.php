<?php

declare(strict_types=1);

/**
 * 학생/학부모 고민방 표시 이름 fallback 검증
 *
 * 해결책:
 * - students 행이 있고 public_display_name 이 채워져 있으면 trim 한 값 반환
 * - students 행이 있고 public_display_name 이 NULL 이거나 공백이면 '학생' fallback 반환
 * - students 행이 없으면 (미등록/비정상 사용자) 기존처럼 '' 반환 (권한 확장 방지)
 * - student_name(실명)은 어떤 경우에도 반환되지 않음
 * - 공부방·튜터 기존 동작 불변 유지
 *
 * 검증 항목:
 * - (a) public_display_name 값 있음 → 그 값
 * - (b) public_display_name NULL → '학생'
 * - (c) public_display_name 공백 문자열 → '학생'
 * - (d) 행 없음 (미등록 사용자) → '' (결정한 값: 권한 확장 방지)
 * - (e) student_name 이 있어도 절대 반환되지 않음 (실명 노출 방지)
 * - (f) 공부방·튜터 기존 동작 불변
 * - (g) role_type alias: guardian_student, parent, student 3가지 모두 지원
 * - (h) 복수 행 존재 시 ORDER BY id ASC LIMIT 1 첫번째 행 채택
 * - (i) user_id <= 0 이거나 미인증 시 ''
 *
 * 실행:
 *   D:\php8.2\php.exe -d extension=pdo_sqlite scripts/verify-board-student-displayname-fallback.php
 *   또는 php scripts/verify-board-student-displayname-fallback.php
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

function createStudentTestPdo(): PDO
{
    if (extension_loaded('pdo_sqlite')) {
        echo "INFO  Using SQLite in-memory PDO\n";
        $pdo = new PDO('sqlite::memory:');
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        // students 테이블 (student_name 실명 컬럼 포함)
        $pdo->exec('CREATE TABLE students (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            guardian_user_id INTEGER NOT NULL,
            student_name TEXT NOT NULL,
            public_display_name TEXT NULL
        )');

        // study_rooms 테이블 (기존 동작 불변 검증용)
        $pdo->exec('CREATE TABLE study_rooms (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            operator_display_name TEXT NULL,
            study_room_name TEXT NULL
        )');

        // tutors 테이블 (기존 동작 불변 검증용)
        $pdo->exec('CREATE TABLE tutors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            tutor_display_name TEXT NULL
        )');

        // students 데이터
        $studentRows = [
            // (a) public_display_name 있음
            [1, 201, '김철수', '맑은하늘'],
            // (b) public_display_name NULL (student_name 은 실명)
            [2, 202, '이영희', null],
            // (c) public_display_name 공백 문자열
            [3, 203, '박민수', '   '],
            // (e) student_name 실명이 존재하지만 public_display_name NULL
            [4, 204, '홍길동', null],
            // (h) 복수 행 존재 시 ORDER BY id ASC LIMIT 1
            [5, 205, '첫째아이', '첫째별명'],
            [6, 205, '둘째아이', '둘째별명'],
            // (h-2) 복수 행 첫 행이 public_display_name NULL
            [7, 206, '첫째아이', null],
            [8, 206, '둘째아이', '둘째별명'],
            // (trim 검증) 앞뒤 공백 있는 별명
            [9, 207, '최수현', '  공부짱  '],
        ];

        $stmt = $pdo->prepare('INSERT INTO students (id, guardian_user_id, student_name, public_display_name) VALUES (?, ?, ?, ?)');
        foreach ($studentRows as $row) {
            $stmt->execute($row);
        }

        // study_rooms 데이터 (기존 동작 불변 검증)
        $roomRows = [
            [1, 301, '원장선생님', '대치공부방'],
            [2, 302, null, '서초공부방'],
            [3, 303, null, null],
        ];
        $roomStmt = $pdo->prepare('INSERT INTO study_rooms (id, user_id, operator_display_name, study_room_name) VALUES (?, ?, ?, ?)');
        foreach ($roomRows as $row) {
            $roomStmt->execute($row);
        }

        // tutors 데이터 (기존 동작 불변 검증)
        $tutorRows = [
            [1, 401, '영어전문튜터'],
            [2, 402, null],
        ];
        $tutorStmt = $pdo->prepare('INSERT INTO tutors (id, user_id, tutor_display_name) VALUES (?, ?, ?)');
        foreach ($tutorRows as $row) {
            $tutorStmt->execute($row);
        }

        return $pdo;
    }

    echo "INFO  Using Mock PDO (pdo_sqlite extension not loaded in default php.ini)\n";
    return new class extends PDO {
        private array $students = [
            201 => ['id' => 1, 'guardian_user_id' => 201, 'student_name' => '김철수', 'public_display_name' => '맑은하늘'],
            202 => ['id' => 2, 'guardian_user_id' => 202, 'student_name' => '이영희', 'public_display_name' => null],
            203 => ['id' => 3, 'guardian_user_id' => 203, 'student_name' => '박민수', 'public_display_name' => '   '],
            204 => ['id' => 4, 'guardian_user_id' => 204, 'student_name' => '홍길동', 'public_display_name' => null],
            205 => ['id' => 5, 'guardian_user_id' => 205, 'student_name' => '첫째아이', 'public_display_name' => '첫째별명'],
            206 => ['id' => 7, 'guardian_user_id' => 206, 'student_name' => '첫째아이', 'public_display_name' => null],
            207 => ['id' => 9, 'guardian_user_id' => 207, 'student_name' => '최수현', 'public_display_name' => '  공부짱  '],
        ];

        private array $studyRooms = [
            301 => ['id' => 1, 'user_id' => 301, 'operator_display_name' => '원장선생님', 'study_room_name' => '대치공부방'],
            302 => ['id' => 2, 'user_id' => 302, 'operator_display_name' => null, 'study_room_name' => '서초공부방'],
            303 => ['id' => 3, 'user_id' => 303, 'operator_display_name' => null, 'study_room_name' => null],
        ];

        private array $tutors = [
            401 => ['id' => 1, 'user_id' => 401, 'tutor_display_name' => '영어전문튜터'],
            402 => ['id' => 2, 'user_id' => 402, 'tutor_display_name' => null],
        ];

        public function __construct() {}

        #[\ReturnTypeWillChange]
        public function prepare(string $query, array $options = []): mixed
        {
            return new class($this->students, $this->studyRooms, $this->tutors, $query) {
                private array $students;
                private array $studyRooms;
                private array $tutors;
                private string $query;
                private mixed $result = false;

                public function __construct(array $students, array $studyRooms, array $tutors, string $query)
                {
                    $this->students = $students;
                    $this->studyRooms = $studyRooms;
                    $this->tutors = $tutors;
                    $this->query = $query;
                }

                public function execute(?array $params = null): bool
                {
                    $id = (int) ($params[0] ?? 0);
                    if (str_contains($this->query, 'FROM students')) {
                        $this->result = $this->students[$id] ?? false;
                    } elseif (str_contains($this->query, 'FROM study_rooms')) {
                        $this->result = $this->studyRooms[$id] ?? false;
                    } elseif (str_contains($this->query, 'FROM tutors')) {
                        $this->result = $this->tutors[$id] ?? false;
                    } else {
                        $this->result = false;
                    }
                    return true;
                }

                public function fetch(int $mode = PDO::FETCH_DEFAULT, int $cursorOrientation = PDO::FETCH_ORI_NEXT, int $cursorOffset = 0): mixed
                {
                    return $this->result;
                }

                public function fetchColumn(int $column = 0): mixed
                {
                    if (is_array($this->result)) {
                        if (isset($this->result['tutor_display_name'])) {
                            return $this->result['tutor_display_name'];
                        }
                        if (isset($this->result['public_display_name'])) {
                            return $this->result['public_display_name'];
                        }
                        return reset($this->result);
                    }
                    return false;
                }
            };
        }
    };
}

$pdo = createStudentTestPdo();
$resolver = new AuthorDisplayNameResolver($pdo);

// ─── (a) 별명 있음 → 그 값 ───
$valA = $resolver->resolve(['user_id' => 201, 'role_type' => 'student']);
ok(
    'case_a_public_display_name_present',
    $valA === '맑은하늘',
    "expected '맑은하늘', got '{$valA}'"
);

// ─── (b) NULL → '학생' ───
$valB = $resolver->resolve(['user_id' => 202, 'role_type' => 'student']);
ok(
    'case_b_public_display_name_null_fallback_to_student',
    $valB === '학생',
    "expected '학생', got '{$valB}'"
);

// ─── (c) 공백 문자열 → '학생' ───
$valC = $resolver->resolve(['user_id' => 203, 'role_type' => 'student']);
ok(
    'case_c_public_display_name_whitespace_fallback_to_student',
    $valC === '학생',
    "expected '학생', got '{$valC}'"
);

// ─── (d) 행 없음 (미등록 사용자) → '' (결정한 값: 권한 확장 방지) ───
$valD = $resolver->resolve(['user_id' => 999, 'role_type' => 'student']);
ok(
    'case_d_no_row_returns_empty',
    $valD === '',
    "expected '', got '{$valD}'"
);

// ─── (e) student_name 실명이 있어도 절대 반환되지 않음 ───
$valE = $resolver->resolve(['user_id' => 204, 'role_type' => 'student']);
ok(
    'case_e_student_name_never_returned',
    $valE === '학생' && $valE !== '홍길동',
    "expected '학생' (never '홍길동'), got '{$valE}'"
);

// ─── (f-1) 공부방 기존 동작 불변 ───
$valF1 = $resolver->resolve(['user_id' => 301, 'role_type' => 'study_room_owner']);
$valF2 = $resolver->resolve(['user_id' => 302, 'role_type' => 'study_room_owner']);
$valF3 = $resolver->resolve(['user_id' => 303, 'role_type' => 'study_room_owner']);
$valF4 = $resolver->resolve(['user_id' => 888, 'role_type' => 'study_room_owner']);
ok(
    'case_f1_study_room_preserved',
    $valF1 === '원장선생님' && $valF2 === '서초공부방' && $valF3 === '' && $valF4 === '',
    "study_room regression: F1='{$valF1}', F2='{$valF2}', F3='{$valF3}', F4='{$valF4}'"
);

// ─── (f-2) 튜터 기존 동작 불변 ───
$valF5 = $resolver->resolve(['user_id' => 401, 'role_type' => 'tutor']);
$valF6 = $resolver->resolve(['user_id' => 402, 'role_type' => 'tutor']);
$valF7 = $resolver->resolve(['user_id' => 777, 'role_type' => 'tutor']);
ok(
    'case_f2_tutor_preserved',
    $valF5 === '영어전문튜터' && $valF6 === '' && $valF7 === '',
    "tutor regression: F5='{$valF5}', F6='{$valF6}', F7='{$valF7}'"
);

// ─── (g) role_type alias 3종 지원: guardian_student, parent, student ───
$valG1 = $resolver->resolve(['user_id' => 202, 'role_type' => 'guardian_student']);
$valG2 = $resolver->resolve(['user_id' => 202, 'role_type' => 'parent']);
$valG3 = $resolver->resolve(['user_id' => 202, 'role_type' => 'student']);
ok(
    'case_g_role_type_aliases_all_work',
    $valG1 === '학생' && $valG2 === '학생' && $valG3 === '학생',
    "role aliases: G1='{$valG1}', G2='{$valG2}', G3='{$valG3}'"
);

// ─── (h) 복수 행 시 ORDER BY id ASC LIMIT 1 적용 ───
$valH1 = $resolver->resolve(['user_id' => 205, 'role_type' => 'student']);
$valH2 = $resolver->resolve(['user_id' => 206, 'role_type' => 'student']);
ok(
    'case_h_order_by_id_asc_first_row',
    $valH1 === '첫째별명' && $valH2 === '학생',
    "multi-row order: H1='{$valH1}' (expected '첫째별명'), H2='{$valH2}' (expected '학생')"
);

// ─── (trim) 별명 앞뒤 공백 trim ───
$valTrim = $resolver->resolve(['user_id' => 207, 'role_type' => 'student']);
ok(
    'case_trim_public_display_name',
    $valTrim === '공부짱',
    "expected '공부짱', got '{$valTrim}'"
);

// ─── (i) user_id <= 0 이거나 빈 auth 시 '' ───
$valI1 = $resolver->resolve(['user_id' => 0, 'role_type' => 'student']);
$valI2 = $resolver->resolve(['role_type' => 'student']);
$valI3 = $resolver->resolve([]);
ok(
    'case_i_invalid_auth_returns_empty',
    $valI1 === '' && $valI2 === '' && $valI3 === '',
    "invalid auth: I1='{$valI1}', I2='{$valI2}', I3='{$valI3}'"
);

echo "\n{$failed} failed\n";
exit($failed > 0 ? 1 : 0);
