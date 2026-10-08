/**
 * 사이트오류-25 · tutorId 없이 basic 저장할 때 기존 행을 재사용하고 INSERT 는 한 번만.
 * 실행(루트): node scripts/verify-tutor-draft-reuse.mjs
 *
 * 가짜 PDO 가 TutorRegisterService::saveStep · insertDraft 실경로를 탄다.
 */
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const PHP_CODE = String.raw`<?php
declare(strict_types=1);
require_once getcwd() . '/src/bootstrap.php';

use Study114\Database\Connection;
use Study114\Tutor\TutorRegisterService;

final class DraftStmt
{
    private array $rows = [];
    private mixed $column = false;
    private int $cursor = 0;
    public function __construct(private DraftPdo $pdo, private string $sql) {}
    public function execute(?array $params = null): bool
    {
        $sql = preg_replace('/\s+/', ' ', trim($this->sql));
        $p = array_values($params ?? []);
        $this->pdo->log[] = $sql;
        $a = $this->pdo->answer($sql, $p);
        $this->rows = $a['rows'] ?? [];
        $this->column = array_key_exists('column', $a) ? $a['column'] : false;
        $this->cursor = 0;
        return true;
    }
    public function fetch(mixed ...$a): mixed { return $this->rows[$this->cursor++] ?? false; }
    public function fetchColumn(mixed ...$a): mixed { return $this->column; }
    public function fetchAll(mixed ...$a): array { return $this->rows; }
}

final class DraftPdo extends PDO
{
    public array $log = [];
    /** @var list<array<string, mixed>> */
    public array $tutors = [];
    public int $inserts = 0;
    public int $nextId = 100;
    private bool $inTx = false;

    public function __construct() {}
    #[\ReturnTypeWillChange] public function prepare(string $q, array $o = []): DraftStmt { return new DraftStmt($this, $q); }
    public function beginTransaction(): bool { $this->inTx = true; return true; }
    public function commit(): bool { $this->inTx = false; return true; }
    public function rollBack(): bool { $this->inTx = false; return true; }
    public function inTransaction(): bool { return $this->inTx; }
    public function lastInsertId(?string $name = null): string { return (string) $this->nextId; }

    /** @param list<mixed> $p @return array{rows?: list<array<string, mixed>>, column?: mixed} */
    public function answer(string $sql, array $p): array
    {
        if (str_contains($sql, 'INSERT INTO tutors (')) {
            $this->inserts++;
            $id = ++$this->nextId;
            $this->tutors[] = [
                'id' => $id,
                'user_id' => (int) ($p[0] ?? 0),
                'tutor_display_name' => (string) ($p[1] ?? ''),
                'profile_status' => 'draft',
                'detail_completion_status' => 'basic_only',
                'preferred_fee_amount' => null,
                'lessons_per_week' => null,
                'monthly_session_count' => null,
                'minutes_per_lesson' => null,
                'updated_at' => 1000 + $id,
            ];
            return [];
        }
        if (str_contains($sql, 'UPDATE tutors SET') && str_contains($sql, 'tutor_display_name')) {
            $id = (int) ($p[count($p) - 1] ?? 0);
            foreach ($this->tutors as &$row) {
                if ((int) $row['id'] === $id) {
                    $row['tutor_display_name'] = (string) ($p[0] ?? '');
                    $row['updated_at'] = 2000 + $id;
                }
            }
            unset($row);
            return [];
        }
        if (str_contains($sql, 'UPDATE tutors SET detail_completion_status')) {
            return [];
        }
        if (str_contains($sql, 'FROM user_roles')) {
            return ['column' => 1];
        }
        if (str_contains($sql, 'SELECT gender FROM user_profiles')) {
            return ['column' => 'male'];
        }
        if (str_contains($sql, 'SELECT 1 FROM user_profiles')) {
            return ['column' => 1];
        }
        if (str_contains($sql, 'SELECT id FROM tutors') && str_contains($sql, 'user_id = ?')) {
            $userId = (int) ($p[0] ?? 0);
            $best = null;
            foreach ($this->tutors as $row) {
                if ((int) $row['user_id'] !== $userId) {
                    continue;
                }
                if ($best === null
                    || (int) $row['updated_at'] > (int) $best['updated_at']
                    || ((int) $row['updated_at'] === (int) $best['updated_at'] && (int) $row['id'] > (int) $best['id'])) {
                    $best = $row;
                }
            }
            return ['column' => $best === null ? false : (int) $best['id']];
        }
        if (str_contains($sql, 'SELECT 1 FROM tutors WHERE id = ? AND user_id = ?')) {
            $id = (int) ($p[0] ?? 0);
            $userId = (int) ($p[1] ?? 0);
            foreach ($this->tutors as $row) {
                if ((int) $row['id'] === $id && (int) $row['user_id'] === $userId) {
                    return ['column' => 1];
                }
            }
            return ['column' => false];
        }
        if (str_contains($sql, 'SELECT * FROM tutors WHERE id = ?')) {
            $id = (int) ($p[0] ?? 0);
            foreach ($this->tutors as $row) {
                if ((int) $row['id'] === $id) {
                    return ['rows' => [$row], 'column' => false];
                }
            }
            return ['rows' => [], 'column' => false];
        }
        if (str_contains($sql, 'SELECT detail_completion_status FROM tutors WHERE id = ?')) {
            return ['column' => 'basic_only'];
        }
        if (str_contains($sql, 'SELECT profile_status, detail_completion_status FROM tutors WHERE id = ?')) {
            $id = (int) ($p[0] ?? 0);
            foreach ($this->tutors as $row) {
                if ((int) $row['id'] === $id) {
                    return ['rows' => [[
                        'profile_status' => (string) $row['profile_status'],
                        'detail_completion_status' => (string) $row['detail_completion_status'],
                    ]]];
                }
            }
            return ['rows' => []];
        }
        if (str_contains($sql, 'SELECT 1 FROM regions')) {
            return ['column' => 1];
        }
        if (str_contains($sql, 'FROM regions WHERE id = ? LIMIT 1') && str_contains($sql, 'sido_code')) {
            // 과외 단위 행(경기도 수원시) — TutorRegionUnit::fetchRow
            return ['rows' => [[
                'id' => (int) ($p[0] ?? 0), 'sido_code' => '41', 'sido_name' => '경기도', 'sigungu_code' => '41110',
                'sigungu_name' => '수원시', 'unit_level' => 'sigungu', 'official_code' => '4111000000', 'is_active' => 1,
            ]]];
        }
        if (str_contains($sql, 'FROM tutor_regions') || str_contains($sql, 'FROM tutor_subject_targets') || str_contains($sql, 'FROM tutor_lesson_places')) {
            return ['column' => false, 'rows' => []];
        }
        return ['column' => false, 'rows' => []];
    }
}

function inject(DraftPdo $pdo): void
{
    (new ReflectionProperty(Connection::class, 'pdo'))->setValue(null, $pdo);
}

function ok(string $name, bool $cond, string $detail = ''): void
{
    echo ($cond ? 'PASS  ' : 'FAIL  ') . $name . ($cond || $detail === '' ? '' : ' — ' . $detail) . "\n";
}

function basicPayload(string $name): array
{
    return [
        'tutor_display_name' => $name,
        'gender' => 'male',
        'student_gender_group' => 'mixed',
        'student_count_group' => 'solo',
        'saved_regions' => [
            ['region_id' => 11, 'scope_type' => 'city'],
        ],
    ];
}

$svc = new TutorRegisterService();

$fresh = new DraftPdo();
inject($fresh);
$first = $svc->saveStep(1, null, 'basic', basicPayload('김수학'));
$second = $svc->saveStep(1, null, 'basic', basicPayload('김수학수정'));
ok('(a) 행 없을 때 첫 basic 은 INSERT', $fresh->inserts === 1 && ($first['tutor_id'] ?? 0) > 0, 'inserts=' . $fresh->inserts);
ok('(a) 같은 user 두 번째 basic(tutorId null)은 같은 id · INSERT 1', $fresh->inserts === 1 && ($second['tutor_id'] ?? 0) === ($first['tutor_id'] ?? -1), 'inserts=' . $fresh->inserts . ' ids=' . ($first['tutor_id'] ?? 0) . ',' . ($second['tutor_id'] ?? 0));
$renamed = false;
foreach ($fresh->tutors as $row) {
    if ((int) $row['id'] === (int) $first['tutor_id'] && $row['tutor_display_name'] === '김수학수정') {
        $renamed = true;
    }
}
ok('(a) 재사용한 행의 활동명이 갱신됨', $renamed && count($fresh->tutors) === 1, 'rows=' . count($fresh->tutors));

$seeded = new DraftPdo();
inject($seeded);
$blank = ['preferred_fee_amount' => null, 'lessons_per_week' => null, 'monthly_session_count' => null, 'minutes_per_lesson' => null];
$seeded->tutors = [
    ['id' => 5, 'user_id' => 1, 'tutor_display_name' => '옛이름', 'profile_status' => 'draft', 'detail_completion_status' => 'basic_only', 'updated_at' => 1] + $blank,
    ['id' => 9, 'user_id' => 1, 'tutor_display_name' => '최신', 'profile_status' => 'published', 'detail_completion_status' => 'basic_only', 'updated_at' => 2] + $blank,
    ['id' => 8, 'user_id' => 2, 'tutor_display_name' => '다른사람', 'profile_status' => 'draft', 'detail_completion_status' => 'basic_only', 'updated_at' => 9] + $blank,
];
$reused = $svc->saveStep(1, null, 'basic', basicPayload('재사용쌤'));
$otherUntouched = false;
foreach ($seeded->tutors as $row) {
    if ((int) $row['id'] === 8 && $row['tutor_display_name'] === '다른사람') {
        $otherUntouched = true;
    }
}
ok('(b) 기존 행이 있으면 최신 id 재사용 · INSERT 0', $seeded->inserts === 0 && ($reused['tutor_id'] ?? 0) === 9, 'inserts=' . $seeded->inserts . ' id=' . ($reused['tutor_id'] ?? 0));
ok('(b) 다른 user 행은 그대로', $otherUntouched && count($seeded->tutors) === 3);

$none = new DraftPdo();
inject($none);
$slotMsg = null;
try {
    $svc->saveStep(1, null, 'basic', ['tutor_display_name' => '지역없는쌤', 'gender' => 'male']);
} catch (InvalidArgumentException $e) {
    $slotMsg = $e->getMessage();
}
ok('(c) 지역 없이 새 행은 만들지 않음', $slotMsg === '과외지역 1을 선택해 주세요.' && $none->inserts === 0 && count($none->tutors) === 0, (string) $slotMsg);

$keep = new DraftPdo();
inject($keep);
$keep->tutors = [
    ['id' => 4, 'user_id' => 1, 'tutor_display_name' => '유지', 'profile_status' => 'draft', 'detail_completion_status' => 'basic_only', 'updated_at' => 1],
];
foreach (['lesson', 'contact'] as $step) {
    $msg = null;
    try {
        $svc->saveStep(1, null, $step, basicPayload('무시'));
    } catch (InvalidArgumentException $e) {
        $msg = $e->getMessage();
    } catch (Throwable $e) {
        $msg = get_class($e) . ': ' . $e->getMessage();
    }
    ok('(d) ' . $step . ' 은 tutorId 없이 기존 오류', $msg === 'tutor_id: 먼저 기본정보를 저장해 주세요.', (string) $msg);
}
ok('(d) lesson/contact 는 행을 늘리지 않음', $keep->inserts === 0 && count($keep->tutors) === 1 && $keep->tutors[0]['tutor_display_name'] === '유지');

$draft = new DraftPdo();
inject($draft);
$ref = new ReflectionMethod(TutorRegisterService::class, 'insertDraft');
$ref->setAccessible(true);
$idA = $ref->invoke($svc, $draft, 3, ['tutor_display_name' => '첫번째']);
$idB = $ref->invoke($svc, $draft, 3, ['tutor_display_name' => '두번째']);
ok('(e) insertDraft 도 기존 행이 있으면 INSERT 하지 않음', $draft->inserts === 1 && $idA === $idB && $idA > 0, 'inserts=' . $draft->inserts . ' ids=' . $idA . ',' . $idB);
`;

function phpBin() {
  if (process.env.PHP_BIN) return process.env.PHP_BIN;
  if (existsSync('D:\\php8.2\\php.exe')) return 'D:\\php8.2\\php.exe';
  return 'php';
}

const php = spawnSync(phpBin(), ['-d', 'display_errors=1'], {
  cwd: ROOT,
  input: PHP_CODE,
  encoding: 'utf8',
  maxBuffer: 8 * 1024 * 1024,
});
const out = `${php.stdout || ''}`;
const err = `${php.stderr || ''}`;
process.stdout.write(out);
if (err.trim()) process.stderr.write(err);
const failed = (out.match(/^FAIL  /gm) || []).length;
const passed = (out.match(/^PASS  /gm) || []).length;
if (php.status !== 0 && failed === 0) {
  console.error(`FAIL  php 실행 status=${php.status}`);
  process.exit(1);
}
console.log(`\n${passed} passed, ${failed} failed`);
if (failed || php.status !== 0) process.exit(1);
