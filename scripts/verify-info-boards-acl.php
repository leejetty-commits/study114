<?php

declare(strict_types=1);

/**
 * 사이트오류-3 · 정보 게시판(info-room 「공부방 쏙쏙정보」 · info-tutor 「과외쌤 따끈 팁가이드」) 서버 검사
 * (a) 역할(게스트/학생/member/공부방/과외쌤/관리자) × 기능(discover/list/detail/compose/delete) 표가 정책과 같다
 * (b) 유료 판정은 PaidProviderGate 한 곳. 거짓이면 쓰기 거절, 참이면 허용. 관리자는 게이트 없이 허용
 * (c) 분류 허용값·제목/본문 길이 검증(422), 게스트 응답에 본문·작성자 없음, 학생·member 목록/상세 거절
 * (d) 작성자·역할은 세션에서 정함, 타인 글 수정/삭제 403, 게시판 불일치 거절, 다른 게시판 글을 이 경로로 못 읽음
 * Connection 에 메모리 가짜 PDO(board_posts 흉내)를 주입한다. 실제 DB 에 접속하지 않는다.
 * 실행: D:\php8.2\php.exe scripts/verify-info-boards-acl.php
 */

require_once dirname(__DIR__) . '/src/bootstrap.php';

// 로컬 CLI(D:\php8.2)에 mbstring 이 없을 때만 쓰는 글자 수 대체. 운영 PHP 는 mbstring 을 쓴다.
if (!function_exists('mb_strlen')) {
    function mb_strlen(string $string, ?string $encoding = null): int
    {
        return (int) preg_match_all('/./us', $string);
    }
}

use Study114\Board\BoardAccessException;
use Study114\Board\BoardChannelAcl;
use Study114\Board\BoardPostRepository;
use Study114\Board\BoardPostService;
use Study114\Board\ConcernService;
use Study114\Database\Connection;

final class IbStmt
{
    /** @var list<array<string, mixed>> */
    private array $rows = [];
    private mixed $column = false;
    private int $cursor = 0;

    public function __construct(private IbPdo $pdo, private string $sql)
    {
    }

    public function bindValue(string|int $param, mixed $value, int $type = PDO::PARAM_STR): bool
    {
        return true;
    }

    public function execute(?array $params = null): bool
    {
        $answer = $this->pdo->run($this->sql, array_values($params ?? []));
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

/** board_posts 한 표만 흉내 내는 가짜 PDO. 모르는 SQL 은 예외로 드러낸다. */
final class IbPdo extends PDO
{
    /** @var array<int, array<string, mixed>> */
    public array $posts = [];
    /** @var list<string> */
    public array $log = [];
    private int $nextId = 1;
    private int $clock = 0;

    public function __construct()
    {
    }

    #[\ReturnTypeWillChange]
    public function prepare(string $query, array $options = []): IbStmt
    {
        return new IbStmt($this, $query);
    }

    private function now(): string
    {
        $this->clock++;

        return date('Y-m-d H:i:s', 1790000000 + $this->clock * 60);
    }

    /** @param list<mixed> $p @return array{rows?: list<array<string, mixed>>, column?: mixed} */
    public function run(string $sql, array $p): array
    {
        $s = preg_replace('/\s+/', ' ', trim($sql)) ?? '';
        $this->log[] = $s;

        if (str_starts_with($s, 'INSERT INTO board_posts')) {
            preg_match('/\(([^)]*)\) VALUES/', $s, $m);
            $cols = array_map('trim', explode(',', $m[1] ?? ''));
            $row = array_fill_keys(
                ['board_key', 'post_key', 'author_user_id', 'author_role', 'status', 'title', 'description', 'memo', 'internal_memo', 'category_id', 'file_label', 'meta_json'],
                null,
            );
            foreach ($cols as $i => $col) {
                $row[$col] = $p[$i] ?? null;
            }
            $row['id'] = $this->nextId++;
            $row['created_at'] = $this->now();
            $row['updated_at'] = $row['created_at'];
            $this->posts[$row['id']] = $row;

            return [];
        }
        if (preg_match('/^UPDATE board_posts SET status = \?, title = \?/', $s)) {
            [$status, $title, $desc, $memo, $cat, $file, $meta, $bk, $pk] = $p;
            foreach ($this->posts as $id => $row) {
                if ($row['board_key'] === $bk && $row['post_key'] === $pk) {
                    $this->posts[$id] = array_merge($row, [
                        'status' => $status, 'title' => $title, 'description' => $desc, 'memo' => $memo,
                        'category_id' => $cat, 'file_label' => $file,
                        'meta_json' => $meta ?? $row['meta_json'], 'updated_at' => $this->now(),
                    ]);
                }
            }

            return [];
        }
        if (preg_match('/^UPDATE board_posts SET status = \?, internal_memo/', $s)) {
            [$status, $memo, $bk, $pk] = $p;
            foreach ($this->posts as $id => $row) {
                if ($row['board_key'] === $bk && $row['post_key'] === $pk) {
                    $this->posts[$id]['status'] = $status;
                    $this->posts[$id]['internal_memo'] = $memo ?? $row['internal_memo'];
                    $this->posts[$id]['updated_at'] = $this->now();
                }
            }

            return [];
        }
        if (str_starts_with($s, 'DELETE FROM board_posts')) {
            [$bk, $pk] = $p;
            foreach ($this->posts as $id => $row) {
                if ($row['board_key'] === $bk && $row['post_key'] === $pk) {
                    unset($this->posts[$id]);
                }
            }

            return [];
        }
        if (preg_match('/^SELECT (.+?) FROM board_posts WHERE (.+?)(?: ORDER BY (.+?))?(?: LIMIT (\d+)(?: OFFSET (\d+))?)?$/', $s, $m)) {
            $rows = $this->filter($m[2], $p);
            if (str_starts_with($m[1], 'COUNT(*)')) {
                return ['column' => count($rows), 'rows' => [[count($rows)]]];
            }
            if (($m[3] ?? '') !== '') {
                $rows = $this->order($rows, $m[3]);
            }
            if (isset($m[4]) && $m[4] !== '') {
                $rows = array_slice($rows, (int) ($m[5] ?? 0), (int) $m[4]);
            }

            return ['rows' => array_values($rows)];
        }

        throw new RuntimeException('unexpected sql: ' . $s);
    }

    /** @param list<mixed> $p @return list<array<string, mixed>> */
    private function filter(string $where, array $p): array
    {
        $conds = [];
        $i = 0;
        foreach (explode(' AND ', $where) as $c) {
            $c = trim($c);
            if (preg_match('/^(\w+) = \?$/', $c, $m)) {
                $conds[] = [$m[1], [$p[$i++]]];
            } elseif (preg_match("/^(\w+) = '([^']*)'$/", $c, $m)) {
                $conds[] = [$m[1], [$m[2]]];
            } elseif (preg_match('/^(\w+) IN \(([?, ]+)\)$/', $c, $m)) {
                $n = substr_count($m[2], '?');
                $conds[] = [$m[1], array_slice($p, $i, $n)];
                $i += $n;
            } else {
                throw new RuntimeException('unexpected where: ' . $c);
            }
        }

        return array_values(array_filter($this->posts, static function (array $row) use ($conds): bool {
            foreach ($conds as [$col, $vals]) {
                if (!in_array((string) ($row[$col] ?? ''), array_map('strval', $vals), true)) {
                    return false;
                }
            }

            return true;
        }));
    }

    /** @param list<array<string, mixed>> $rows @return list<array<string, mixed>> */
    private function order(array $rows, string $orderBy): array
    {
        $keys = array_map(static fn (string $k): array => array_pad(explode(' ', trim($k)), 2, 'ASC'), explode(',', $orderBy));
        usort($rows, static function (array $a, array $b) use ($keys): int {
            foreach ($keys as [$col, $dir]) {
                $cmp = is_int($a[$col]) ? $a[$col] <=> $b[$col] : strcmp((string) $a[$col], (string) $b[$col]);
                if ($cmp !== 0) {
                    return strtoupper($dir) === 'DESC' ? -$cmp : $cmp;
                }
            }

            return 0;
        });

        return $rows;
    }
}

$passed = 0;
$failed = 0;
/** @param bool|callable(): bool $cond */
function ok(string $name, bool|callable $cond, string $detail = ''): void
{
    global $passed, $failed;
    try {
        $result = is_callable($cond) ? (bool) $cond() : $cond;
    } catch (Throwable $e) {
        $result = false;
        $detail = $detail !== '' ? $detail : get_class($e) . ': ' . $e->getMessage();
    }
    if ($result) {
        $passed++;
        echo "PASS  {$name}\n";
        return;
    }
    $failed++;
    fwrite(STDERR, "FAIL  {$name}" . ($detail !== '' ? " — {$detail}" : '') . "\n");
}

/** 호출 결과를 HTTP 상태로. BoardApi::run 과 같은 변환(BoardAccessException → httpStatus, InvalidArgumentException → 422). */
function statusOf(callable $fn): int
{
    try {
        $fn();
    } catch (BoardAccessException $e) {
        return $e->httpStatus;
    } catch (InvalidArgumentException) {
        return 422;
    }

    return 200;
}

const INFO_KEYS = ['info-room', 'info-tutor'];
const SERVICE_CLASS = 'Study114\\Board\\InfoBoardService';
const GATE_CLASS = 'Study114\\Paid\\PaidProviderGate';

$auth = [
    'room1' => ['user_id' => 11, 'role_type' => 'study_room_owner', 'admin_level' => null],
    'room2' => ['user_id' => 12, 'role_type' => 'study_room_owner', 'admin_level' => null],
    'tutor1' => ['user_id' => 21, 'role_type' => 'tutor', 'admin_level' => null],
    'tutor2' => ['user_id' => 22, 'role_type' => 'tutor', 'admin_level' => null],
    'student' => ['user_id' => 31, 'role_type' => 'guardian_student', 'admin_level' => null],
    'member' => ['user_id' => 41, 'role_type' => '', 'admin_level' => null],
    'admin' => ['user_id' => 1, 'role_type' => 'admin', 'admin_level' => 'super'],
];

// ── (a) 역할 × 기능 표 (BoardChannelAcl 정적) ──
$expected = [
    //               discover list  detail compose delete access
    'guest' => [true, false, false, false, false, 'titles'],
    'member' => [false, false, false, false, false, 'blocked'],
    'demand' => [false, false, false, false, false, 'blocked'],
    'supply-room' => [true, true, true, true, true, 'full'],
    'supply-tutor' => [true, true, true, true, true, 'full'],
    'admin' => [true, true, true, true, true, 'full'],
];
foreach (INFO_KEYS as $key) {
    foreach ($expected as $role => [$discover, $list, $detail, $compose, $delete, $access]) {
        $got = [
            BoardChannelAcl::canDiscover($key, $role),
            BoardChannelAcl::canList($key, $role),
            BoardChannelAcl::canDetail($key, $role),
            BoardChannelAcl::canCompose($key, $role),
            BoardChannelAcl::canDelete($key, $role),
            BoardChannelAcl::accessKind($key, $role),
        ];
        ok(
            "acl_{$key}_{$role}",
            $got === [$discover, $list, $detail, $compose, $delete, $access],
            json_encode($got) ?: '',
        );
    }
    ok(
        "acl_{$key}_no_comment_react_download_upload",
        static function () use ($key, $expected): bool {
            foreach (array_keys($expected) as $role) {
                if (
                    BoardChannelAcl::canComment($key, $role)
                    || BoardChannelAcl::canReact($key, $role)
                    || BoardChannelAcl::canDownload($key, $role)
                    || BoardChannelAcl::canUpload($key, $role)
                ) {
                    return false;
                }
            }

            return true;
        },
    );
}
ok('acl_info_fail_closed', BoardChannelAcl::isAccessFailClosed('info-room') && BoardChannelAcl::isAccessFailClosed('info-tutor'));
ok('acl_matrix_has_info_rows', static function (): bool {
    $rows = array_filter(BoardChannelAcl::dumpMatrix(), static fn (array $r): bool => in_array($r['alias'], INFO_KEYS, true));

    return count($rows) === 10;
});
ok('acl_channel_intro_names', BoardChannelAcl::channelIntro('info-room')['title'] === '공부방 쏙쏙정보'
    && BoardChannelAcl::channelIntro('info-tutor')['title'] === '과외쌤 따끈 팁가이드');

// ── (b) 유료 판정 한 곳 ──
$gateExists = class_exists(GATE_CLASS);
ok('gate_class_exists', $gateExists);
ok('gate_false_when_no_positions', static fn (): bool => !(new (GATE_CLASS)(null, static fn (int $u): array => []))->isPaidProvider(11));
ok('gate_true_when_positions', static fn (): bool => (new (GATE_CLASS)(null, static fn (int $u): array => [['id' => 1]]))->isPaidProvider(11));
ok('gate_pdo_error_is_false', static fn (): bool => !(new (GATE_CLASS)(null, static function (int $u): array {
    throw new PDOException('db down');
}))->isPaidProvider(11));
ok('gate_caches_per_user', static function (): bool {
    $calls = 0;
    $gate = new (GATE_CLASS)(null, static function (int $u) use (&$calls): array {
        $calls++;

        return [];
    });
    $gate->isPaidProvider(11);
    $gate->isPaidProvider(11);

    return $calls === 1;
});
$sraSrc = (string) file_get_contents(dirname(__DIR__) . '/src/Paid/StudentRequestTextAccess.php');
ok('student_request_text_access_delegates_to_gate', str_contains($sraSrc, 'PaidProviderGate') && !str_contains($sraSrc, 'listActivePositions'));
$infoSrc = is_file(dirname(__DIR__) . '/src/Board/InfoBoardService.php')
    ? (string) file_get_contents(dirname(__DIR__) . '/src/Board/InfoBoardService.php')
    : '';
ok('info_service_uses_gate_only', $infoSrc !== '' && str_contains($infoSrc, 'PaidProviderGate')
    && !str_contains($infoSrc, 'listActivePositions') && !str_contains($infoSrc, 'StudentRequestTextAccess'));

// ── (c)(d) 서비스 · 가짜 저장소 ──
$pdo = new IbPdo();
(new ReflectionProperty(Connection::class, 'pdo'))->setValue(null, $pdo);

/** @param list<int> $paidIds */
function infoService(IbPdo $pdo, array $paidIds): object
{
    $gate = new (GATE_CLASS)(null, static fn (int $u): array => in_array($u, $paidIds, true) ? [['id' => $u]] : []);

    return new (SERVICE_CLASS)($pdo, $gate);
}

/** @param list<int> $paidIds */
function boardService(IbPdo $pdo, array $paidIds): BoardPostService
{
    return new BoardPostService(new BoardPostRepository($pdo), null, infoService($pdo, $paidIds));
}

$paid = [11, 21];
$svc = static fn () => boardService($pdo, $paid);

/** posts.php GET 과 같은 진입(BoardPostService::list) */
function listVia(string $key, ?array $auth, ?string $postKey, ?array $query): array
{
    global $pdo, $paid;

    return boardService($pdo, $paid)->list($key, null, $postKey, $auth, null, null, null, $query);
}

function parseQuery(string $key, ?string $category, ?string $limit, ?string $offset): array
{
    $cls = SERVICE_CLASS;

    return $cls::parseListQuery($key, $category, $limit, $offset);
}

// 다른 게시판 글(고민방·공지) — 이 경로로 읽히면 안 된다
$pdo->run(
    'INSERT INTO board_posts (board_key, post_key, author_user_id, author_role, status, title, description, memo, category_id, file_label, meta_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    ['concern-director', 'concern-director-x1', 11, 'study_room', 'published', 'CONCERN_TITLE', 'CONCERN_BODY', '', null, '', null],
);
$pdo->run(
    'INSERT INTO board_posts (board_key, post_key, author_user_id, author_role, status, title, description, memo, category_id, file_label, meta_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    ['notice', 'notice-x1', 1, 'admin', 'published', 'NOTICE_TITLE', 'NOTICE_BODY', '', 'general', '', null],
);

$posted = [];
$save = static function (string $who, array $input) use ($svc, $auth, &$posted): array {
    $post = $svc()->save($input, $auth[$who] ?? null);
    $posted[] = $post;

    return $post;
};

ok('compose_guest_401', static fn (): bool => statusOf(static fn () => $svc()->save(['board_key' => 'info-room', 'title' => 't', 'body' => 'b', 'category' => 'know-how'], null)) === 401);
ok('compose_student_403', static fn (): bool => statusOf(static fn () => $svc()->save(['board_key' => 'info-room', 'title' => 't', 'body' => 'b', 'category' => 'know-how'], $auth['student'])) === 403);
ok('compose_member_403', static fn (): bool => statusOf(static fn () => $svc()->save(['board_key' => 'info-tutor', 'title' => 't', 'body' => 'b', 'category' => 'lesson'], $auth['member'])) === 403);
ok('compose_free_room_403', static fn (): bool => statusOf(static fn () => $svc()->save(['board_key' => 'info-room', 'title' => 't', 'body' => 'b', 'category' => 'know-how'], $auth['room2'])) === 403);
ok('compose_free_tutor_403', static fn (): bool => statusOf(static fn () => $svc()->save(['board_key' => 'info-tutor', 'title' => 't', 'body' => 'b', 'category' => 'lesson'], $auth['tutor2'])) === 403);

$roomPost = null;
ok('compose_paid_room_saves_with_session_author', static function () use ($save, &$roomPost, $pdo): bool {
    $roomPost = $save('room1', [
        'board_key' => 'info-room', 'title' => "운영 팁\x07", 'body' => "첫 줄\r\n둘째 줄", 'category' => 'know-how',
        'author_user_id' => 999, 'author_role' => 'admin', 'status' => 'hidden',
    ]);
    $row = array_values(array_filter($pdo->posts, static fn (array $r): bool => $r['post_key'] === ($roomPost['id'] ?? '')))[0] ?? null;

    return $row !== null
        && $row['board_key'] === 'info-room'
        && (int) $row['author_user_id'] === 11
        && $row['author_role'] === 'study_room'
        && $row['status'] === 'published'
        && $row['category_id'] === 'know-how'
        && $row['title'] === '운영 팁'
        && $row['description'] === "첫 줄\n둘째 줄"
        && ($roomPost['authorLabel'] ?? '') === '공부방';
});
$tutorPostInRoom = null;
ok('compose_paid_tutor_can_write_room_board', static function () use ($save, &$tutorPostInRoom): bool {
    $tutorPostInRoom = $save('tutor1', ['board_key' => 'info-room', 'title' => '과외쌤이 쓴 운영 정보', 'body' => '본문', 'category' => 'edu-news']);

    return ($tutorPostInRoom['authorLabel'] ?? '') === '과외쌤';
});
$tutorPost = null;
ok('compose_paid_tutor_writes_tutor_board', static function () use ($save, &$tutorPost): bool {
    $tutorPost = $save('tutor1', ['board_key' => 'info-tutor', 'title' => '수업 팁', 'body' => '본문', 'category' => 'lesson']);

    return ($tutorPost['categoryId'] ?? '') === 'lesson';
});
ok('compose_admin_without_gate', static function () use ($save, $pdo): bool {
    $p = $save('admin', ['board_key' => 'info-tutor', 'title' => '운영자 안내', 'body' => '본문', 'category' => 'edu-news']);
    $row = array_values(array_filter($pdo->posts, static fn (array $r): bool => $r['post_key'] === ($p['id'] ?? '')))[0] ?? null;

    return $row !== null && $row['author_role'] === 'admin' && ($p['authorLabel'] ?? '') === '운영자';
});

$bad = static fn (array $input): int => statusOf(static fn () => $svc()->save($input + ['board_key' => 'info-room'], $auth['room1']));
ok('validate_category_missing_422', static fn (): bool => $bad(['title' => 't', 'body' => 'b']) === 422);
ok('validate_category_unknown_422', static fn (): bool => $bad(['title' => 't', 'body' => 'b', 'category' => 'free-talk']) === 422);
ok('validate_category_other_board_422', static fn (): bool => $bad(['title' => 't', 'body' => 'b', 'category' => 'lesson']) === 422);
ok('validate_title_empty_422', static fn (): bool => $bad(['title' => '  ', 'body' => 'b', 'category' => 'recruit']) === 422);
ok('validate_title_101_422', static fn (): bool => $bad(['title' => str_repeat('가', 101), 'body' => 'b', 'category' => 'recruit']) === 422);
ok('validate_title_100_ok', static fn (): bool => $bad(['title' => str_repeat('가', 100), 'body' => 'b', 'category' => 'recruit']) === 200);
ok('validate_body_5001_422', static fn (): bool => $bad(['title' => 't', 'body' => str_repeat('나', 5001), 'category' => 'admin-tax']) === 422);
ok('validate_body_empty_422', static fn (): bool => $bad(['title' => 't', 'body' => '', 'category' => 'admin-tax']) === 422);

// 목록·상세 — 게스트 제목만, 학생·member 거절
ok('list_guest_titles_only', static function () use ($svc): bool {
    $res = listVia('info-room', null, null, null);
    if (($res['access'] ?? '') !== 'titles' || ($res['posts'] ?? []) === []) {
        return false;
    }
    foreach ($res['posts'] as $p) {
        $keys = array_keys($p);
        sort($keys);
        if ($keys !== ['categoryId', 'createdAt', 'id', 'title']) {
            return false;
        }
    }

    return ($res['canCompose'] ?? null) === false;
});
ok('detail_guest_title_no_body', static function () use ($svc, &$roomPost): bool {
    $res = listVia('info-room', null, (string) ($roomPost['id'] ?? ''), null);
    $json = json_encode($res, JSON_UNESCAPED_UNICODE) ?: '';

    return ($res['access'] ?? '') === 'titles'
        && ($res['post']['title'] ?? '') === '운영 팁'
        && !str_contains($json, '둘째 줄')
        && !str_contains($json, '공부방')
        && !array_key_exists('body', $res['post'] ?? []);
});
ok('list_student_403', static fn (): bool => statusOf(static fn () => listVia('info-room', $auth['student'], null, null)) === 403);
ok('detail_student_403', static fn (): bool => statusOf(static fn () => listVia('info-tutor', $auth['student'], (string) ($tutorPost['id'] ?? 'x'), null)) === 403);
ok('list_member_403', static fn (): bool => statusOf(static fn () => listVia('info-tutor', $auth['member'], null, null)) === 403);
ok('list_room_full_with_body_and_label', static function () use ($svc, $auth): bool {
    $res = listVia('info-room', $auth['room2'], null, null);
    $first = $res['posts'][0] ?? [];

    return ($res['access'] ?? '') === 'full'
        && array_key_exists('body', $first)
        && in_array($first['authorLabel'] ?? '', ['공부방', '과외쌤', '운영자'], true)
        && !array_key_exists('authorUserId', $first)
        && ($res['canCompose'] ?? null) === false;
});
ok('list_paid_room_can_compose_flag', static fn (): bool => (listVia('info-tutor', $auth['room1'], null, null)['canCompose'] ?? null) === true);
ok('list_admin_full', static fn (): bool => (listVia('info-tutor', $auth['admin'], null, null)['access'] ?? '') === 'full');
ok('detail_other_board_post_not_readable', static function () use ($svc, $auth): bool {
    return statusOf(static fn () => listVia('info-room', $auth['admin'], 'concern-director-x1', null)) === 404
        && statusOf(static fn () => listVia('info-room', null, 'notice-x1', null)) === 404;
});
ok('detail_cross_info_board_not_readable', static fn (): bool => statusOf(static fn () => listVia('info-tutor', $auth['room1'], (string) ($roomPost['id'] ?? 'x'), null)) === 404);

// 수정·삭제
ok('edit_by_other_paid_403', static fn (): bool => statusOf(static fn () => $svc()->save(['board_key' => 'info-room', 'post_key' => (string) ($roomPost['id'] ?? ''), 'title' => '가로채기', 'body' => 'x', 'category' => 'recruit'], $auth['tutor1'])) === 403);
ok('edit_board_mismatch_403', static fn (): bool => statusOf(static fn () => $svc()->save(['board_key' => 'info-tutor', 'post_key' => (string) ($roomPost['id'] ?? ''), 'title' => 'x', 'body' => 'x', 'category' => 'lesson'], $auth['room1'])) === 403);
ok('edit_concern_post_via_info_board_403', static fn (): bool => statusOf(static fn () => $svc()->save(['board_key' => 'info-room', 'post_key' => 'concern-director-x1', 'title' => 'x', 'body' => 'x', 'category' => 'recruit'], $auth['admin'])) === 403);
ok('edit_owner_paid_ok', static function () use ($svc, $auth, &$roomPost, $pdo): bool {
    $p = $svc()->save(['board_key' => 'info-room', 'post_key' => (string) ($roomPost['id'] ?? ''), 'title' => '운영 팁 (보강)', 'body' => '고친 본문', 'category' => 'recruit'], $auth['room1']);
    $row = array_values(array_filter($pdo->posts, static fn (array $r): bool => $r['post_key'] === ($roomPost['id'] ?? '')))[0] ?? [];

    return ($p['edited'] ?? false) === true && ($row['category_id'] ?? '') === 'recruit' && (int) ($row['author_user_id'] ?? 0) === 11;
});
ok('edit_owner_no_longer_paid_403', static fn (): bool => statusOf(static fn () => boardService($pdo, [21])->save(['board_key' => 'info-room', 'post_key' => (string) ($roomPost['id'] ?? ''), 'title' => 'x', 'body' => 'x', 'category' => 'recruit'], $auth['room1'])) === 403);
ok('edit_admin_other_ok', static fn (): bool => statusOf(static fn () => $svc()->save(['board_key' => 'info-room', 'post_key' => (string) ($tutorPostInRoom['id'] ?? ''), 'title' => '운영자 정리', 'body' => '본문', 'category' => 'edu-news'], $auth['admin'])) === 200);
ok('delete_by_other_403', static fn (): bool => statusOf(static fn () => $svc()->delete('info-room', (string) ($roomPost['id'] ?? ''), '', $auth['room2'])) === 403);
ok('delete_student_403', static fn (): bool => statusOf(static fn () => $svc()->delete('info-room', (string) ($roomPost['id'] ?? ''), '', $auth['student'])) === 403);
ok('delete_board_mismatch_403', static fn (): bool => statusOf(static fn () => $svc()->delete('info-tutor', (string) ($roomPost['id'] ?? ''), '', $auth['room1'])) === 403);
ok('delete_owner_after_paid_ended_ok', static function () use ($pdo, $auth, &$roomPost, $svc): bool {
    boardService($pdo, [])->delete('info-room', (string) ($roomPost['id'] ?? ''), '', $auth['room1']);
    $ids = array_column(listVia('info-room', $auth['room1'], null, null)['posts'] ?? [], 'id');

    return !in_array($roomPost['id'] ?? '', $ids, true)
        && statusOf(static fn () => listVia('info-room', $auth['room1'], (string) ($roomPost['id'] ?? ''), null)) === 404;
});
ok('delete_admin_other_ok', static fn (): bool => statusOf(static fn () => $svc()->delete('info-tutor', (string) ($tutorPost['id'] ?? ''), '', $auth['admin'])) === 200);

// 페이징·분류 필터 (최신순 20개씩)
ok('paging_latest_20_then_rest', static function () use ($svc, $auth): bool {
    for ($i = 1; $i <= 24; $i++) {
        $svc()->save(['board_key' => 'info-tutor', 'title' => "팁 {$i}", 'body' => '본문', 'category' => $i % 2 === 0 ? 'consult-match' : 'contract-tax'], $auth['tutor1']);
    }
    $first = listVia('info-tutor', $auth['room1'], null, null);
    $second = listVia('info-tutor', $auth['room1'], null, ['category' => null, 'limit' => 20, 'offset' => 20]);

    return count($first['posts']) === 20
        && $first['hasMore'] === true
        && ($first['posts'][0]['title'] ?? '') === '팁 24'
        && count($second['posts']) === $first['total'] - 20
        && $second['hasMore'] === false;
});
ok('paging_category_filter', static function () use ($svc, $auth): bool {
    $res = listVia('info-tutor', $auth['tutor1'], null, ['category' => 'consult-match', 'limit' => 20, 'offset' => 0]);

    return $res['total'] === 12 && array_unique(array_column($res['posts'], 'categoryId')) === ['consult-match'];
});
ok('parse_query_rejects_unknown_category', static fn (): bool => statusOf(static fn () => parseQuery('info-room', 'lesson', null, null)) === 422);
ok('parse_query_all_and_limit_cap', static function (): bool {
    $q = parseQuery('info-room', 'all', '99', '-3');

    return $q['category'] === null && $q['limit'] === 20 && $q['offset'] === 0;
});

// (라) 다른 서버 경로 — 고민방 댓글·반응·신고 게이트는 info 글을 거절한다
ok('concern_comment_path_rejects_info_post', static function () use ($pdo, $auth): bool {
    $info = array_values(array_filter($pdo->posts, static fn (array $r): bool => $r['board_key'] === 'info-tutor' && $r['status'] === 'published'))[0] ?? null;
    if ($info === null) {
        return false;
    }

    return statusOf(static fn () => (new ConcernService())->listComments((int) $info['id'], $auth['room1'])) === 422
        && statusOf(static fn () => (new ConcernService())->listComments((int) $info['id'], null)) === 422;
});
$postsSrc = (string) file_get_contents(dirname(__DIR__) . '/public/api/board/posts.php');
ok('posts_php_routes_info_query', str_contains($postsSrc, 'InfoBoardService::isInfoBoard') && str_contains($postsSrc, "queryString('category')"));
ok('no_client_trusted_author_fields', $infoSrc !== '' && !preg_match('/\$input\[\'author_(user_id|role)\'\]/', $infoSrc));

echo "\n{$passed} passed / {$failed} failed\n";
exit($failed > 0 ? 1 : 0);
