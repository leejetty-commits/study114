<?php

declare(strict_types=1);

/**
 * 사이트오류-2b · 고민방 인기·최신·베스트(concern-hot.php) 응답에서 학생에게 공부방·과외쌤 고민방 제외
 * (a) 학생(demand) 응답에 concern-director·concern-tutor 글이 없다 (조회 단계에서 빠진다)
 * (b) 게스트·공부방·과외쌤·관리자 응답은 세 방 글이 그대로 있다
 * (c) 제외 뒤 limit 이 적용되어 학생이 받을 수 있는 만큼 받는다
 * Connection 에 메모리 가짜 PDO 를 주입한다. 실제 DB 에 접속하지 않는다.
 * 실행: D:\php8.2\php.exe scripts/verify-concern-feed-demand-exclusion.php
 */

require_once dirname(__DIR__) . '/src/bootstrap.php';

use Study114\Board\ConcernService;
use Study114\Database\Connection;

final class CfStmt
{
    /** @var list<array<string, mixed>> */
    private array $rows = [];
    private mixed $column = false;
    private int $cursor = 0;

    public function __construct(private CfPdo $pdo, private string $sql)
    {
    }

    public function bindValue(string|int $param, mixed $value, int $type = PDO::PARAM_STR): bool
    {
        return true;
    }

    public function execute(?array $params = null): bool
    {
        $params ??= [];
        $this->pdo->log[] = ['sql' => preg_replace('/\s+/', ' ', trim($this->sql)), 'params' => $params];
        $answer = ($this->pdo->resolver)($this->sql, $params);
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
        return $this->rows;
    }

    public function rowCount(): int
    {
        return count($this->rows);
    }
}

final class CfPdo extends PDO
{
    /** @var list<array{sql: string, params: list<mixed>}> */
    public array $log = [];
    /** @var callable(string, array): array */
    public $resolver;

    public function __construct(callable $resolver)
    {
        $this->resolver = $resolver;
    }

    #[\ReturnTypeWillChange]
    public function prepare(string $query, array $options = []): CfStmt
    {
        return new CfStmt($this, $query);
    }
}

const ROOMS = ['concern-director', 'concern-tutor', 'concern-parent'];
const PROVIDER_ROOMS = ['concern-director', 'concern-tutor'];

/**
 * 방별 글 4·4·4·2. 반응은 공부방·과외쌤 글이 가장 높아 인기순 앞자리를 차지한다(제외 뒤 limit 검사용).
 * @return list<array<string, mixed>>
 */
function postRows(): array
{
    $spec = [
        'concern-director' => [101, 4],
        'concern-tutor' => [201, 4],
        'concern-parent' => [301, 4],
        'concern-solved' => [401, 2],
    ];
    $rows = [];
    $minute = 0;
    foreach ($spec as $boardKey => [$base, $count]) {
        for ($i = 0; $i < $count; $i++) {
            $id = $base + $i;
            $minute++;
            $rows[] = [
                'id' => $id,
                'board_key' => $boardKey,
                'post_key' => "{$boardKey}-{$id}",
                'title' => "TITLE_{$boardKey}_{$id}",
                'description' => "BODY_{$boardKey}_{$id}",
                'author_user_id' => 9,
                'author_role' => 'x',
                'meta_json' => json_encode(['authorDisplayName' => "AUTHOR_{$id}"]),
                'status' => 'published',
                'created_at' => date('Y-m-d H:i:s', strtotime("-1 day +{$minute} minutes")),
                'updated_at' => date('Y-m-d H:i:s', strtotime("-1 day +{$minute} minutes")),
            ];
        }
    }

    return $rows;
}

/** 글 id → 반응 종류별 수. 합계: 공부방 10 · 과외쌤 8 · 학생학부모 5 · 해결후기 6 */
function reactionsFor(int $postId): array
{
    return match (intdiv($postId, 100)) {
        1 => ['helpful' => 10],
        2 => ['helpful' => 8],
        3 => ['empathy' => 5],
        4 => ['cheer' => 6],
        default => [],
    };
}

function makeResolver(): callable
{
    $all = postRows();

    return static function (string $sql, array $p) use ($all): array {
        if (preg_match('/FROM board_posts bp/', $sql)) {
            if (preg_match('/bp\.board_key IN \(/', $sql)) {
                $keys = array_slice($p, 0, -1);
                $rows = array_values(array_filter($all, static fn (array $r): bool => in_array($r['board_key'], $keys, true)));
            } else {
                $rows = array_values(array_filter($all, static fn (array $r): bool => $r['board_key'] === ($p[0] ?? '')));
            }
            usort($rows, static fn (array $a, array $b): int => strcmp($b['created_at'], $a['created_at']) ?: $b['id'] <=> $a['id']);
            if (preg_match('/LIMIT (\d+)/', $sql, $m)) {
                $rows = array_slice($rows, 0, (int) $m[1]);
            }

            return ['rows' => $rows];
        }
        if (preg_match('/SELECT post_id, kind, COUNT\(\*\) AS cnt FROM board_post_reactions/', $sql)) {
            $rows = [];
            foreach ($p as $pid) {
                foreach (reactionsFor((int) $pid) as $kind => $cnt) {
                    $rows[] = ['post_id' => (int) $pid, 'kind' => $kind, 'cnt' => $cnt];
                }
            }

            return ['rows' => $rows];
        }

        return [];
    };
}

function freshService(): array
{
    $pdo = new CfPdo(makeResolver());
    (new ReflectionProperty(Connection::class, 'pdo'))->setValue(null, $pdo);

    return [new ConcernService(), $pdo];
}

$results = [];
function ok(string $name, bool $cond, string $detail = ''): void
{
    global $results;
    $results[] = $cond;
    echo ($cond ? 'PASS ' : 'FAIL ') . $name . ($cond || $detail === '' ? '' : ' — ' . $detail) . "\n";
}

/** @param list<array<string, mixed>> $items @return array<string, int> */
function countByBoard(array $items): array
{
    $out = [];
    foreach ($items as $item) {
        $key = (string) ($item['boardKey'] ?? '');
        $out[$key] = ($out[$key] ?? 0) + 1;
    }
    ksort($out);

    return $out;
}

/** @param array<string, int> $counts */
function fmt(array $counts): string
{
    return json_encode($counts, JSON_UNESCAPED_UNICODE);
}

/** 이 호출에서 공부방·과외쌤 고민방을 조회했는지(WHERE 파라미터 기준) */
function queriedProviderRooms(CfPdo $pdo): array
{
    $hit = [];
    foreach ($pdo->log as $entry) {
        if (!str_contains($entry['sql'], 'FROM board_posts bp')) {
            continue;
        }
        foreach ($entry['params'] as $param) {
            if (in_array($param, PROVIDER_ROOMS, true)) {
                $hit[$param] = true;
            }
        }
    }

    return array_keys($hit);
}

$students = [
    '학생(보호자 계정)' => ['user_id' => 70, 'role_type' => 'guardian_student', 'email' => 's@x', 'name' => 's'],
    '학생(student 역할)' => ['user_id' => 71, 'role_type' => 'student', 'email' => 's2@x', 'name' => 's2'],
];
$others = [
    '게스트' => null,
    '공부방' => ['user_id' => 30, 'role_type' => 'study_room_owner', 'email' => 'r@x', 'name' => 'r'],
    '과외쌤' => ['user_id' => 20, 'role_type' => 'tutor', 'email' => 't@x', 'name' => 't'],
    '관리자' => ['user_id' => 90, 'role_type' => 'admin', 'email' => 'a@x', 'name' => 'a'],
];

// ── (a)(c) 학생 ──
foreach ($students as $label => $auth) {
    [$svc, $pdo] = freshService();
    $hot = $svc->listHot($auth, 10);
    ok("a {$label} HOT 에 두 방 글 없음", !array_intersect(array_keys(countByBoard($hot)), PROVIDER_ROOMS), fmt(countByBoard($hot)));
    ok("a {$label} HOT 조회에 두 방 없음", queriedProviderRooms($pdo) === [], implode(',', queriedProviderRooms($pdo)));
    ok("c {$label} HOT limit 10 → 학생학부모 4 + 해결후기 2", countByBoard($hot) === ['concern-parent' => 4, 'concern-solved' => 2], fmt(countByBoard($hot)));

    [$svc] = freshService();
    $hot3 = $svc->listHot($auth, 3);
    ok("c {$label} HOT limit 3 → 제외 뒤 3개 모두 받음", count($hot3) === 3 && countByBoard($hot3) === ['concern-parent' => 3], fmt(countByBoard($hot3)));

    [$svc, $pdo] = freshService();
    $latest = $svc->listLatest($auth, 3);
    ok("a {$label} 최신에 두 방 글 없음", !array_intersect(array_keys(countByBoard($latest)), PROVIDER_ROOMS), fmt(countByBoard($latest)));
    ok("a {$label} 최신 조회에 두 방 없음", queriedProviderRooms($pdo) === [], implode(',', queriedProviderRooms($pdo)));
    ok("c {$label} 최신 limit 3 → 학생학부모 3 + 해결후기 2", countByBoard($latest) === ['concern-parent' => 3, 'concern-solved' => 2], fmt(countByBoard($latest)));

    [$svc, $pdo] = freshService();
    $best = $svc->listBest($auth);
    ok("a {$label} 베스트에 두 방 없음", !array_intersect(array_keys($best), PROVIDER_ROOMS), implode(',', array_keys($best)));
    ok("a {$label} 베스트 조회에 두 방 없음", queriedProviderRooms($pdo) === [], implode(',', queriedProviderRooms($pdo)));
    ok(
        "c {$label} 베스트 학생학부모 3 · 해결후기 2",
        count($best['concern-parent'] ?? []) === 3 && count($best['concern-solved'] ?? []) === 2,
        json_encode(array_map('count', $best)),
    );
}

// ── (b) 게스트·공급자·관리자: 세 방 그대로 ──
foreach ($others as $label => $auth) {
    [$svc] = freshService();
    $hot = $svc->listHot($auth, 20);
    ok(
        "b {$label} HOT 세 방 그대로",
        countByBoard($hot) === ['concern-director' => 4, 'concern-parent' => 4, 'concern-solved' => 2, 'concern-tutor' => 4],
        fmt(countByBoard($hot)),
    );
    [$svc] = freshService();
    $hot3 = $svc->listHot($auth, 3);
    ok("b {$label} HOT limit 3 은 반응 높은 공부방 고민방 3개", countByBoard($hot3) === ['concern-director' => 3], fmt(countByBoard($hot3)));

    [$svc] = freshService();
    $latest = $svc->listLatest($auth, 3);
    ok(
        "b {$label} 최신 세 방 그대로",
        countByBoard($latest) === ['concern-director' => 3, 'concern-parent' => 3, 'concern-solved' => 2, 'concern-tutor' => 3],
        fmt(countByBoard($latest)),
    );

    [$svc] = freshService();
    $best = $svc->listBest($auth);
    ok(
        "b {$label} 베스트 세 방 그대로",
        count($best['concern-director'] ?? []) === 3 && count($best['concern-tutor'] ?? []) === 3 && count($best['concern-parent'] ?? []) === 3,
        json_encode(array_map('count', $best)),
    );

    if ($auth === null) {
        $leak = array_filter(
            array_merge($hot, $latest, ...array_values($best)),
            static fn (array $i): bool => isset($i['description']) || isset($i['authorDisplayName']) || isset($i['authorUserId']),
        );
        ok('b 게스트 항목은 제목 항목(본문·작성자 없음) 유지', $leak === []);
    }
}

$passed = count(array_filter($results));
$failed = count($results) - $passed;
echo "\n{$passed}/" . count($results) . " PASS · {$failed} FAIL\n";
exit($failed ? 1 : 0);
