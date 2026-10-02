<?php

declare(strict_types=1);

/**
 * 사이트오류-6B · 「학생 꿀팁 가이드」(info-student) 서버 검사
 * (a) ACL 표: 역할 × discover/list/detail/compose/delete/react/comment. 공급자 정보 게시판 2개 표는 그대로
 * (b) 계정 7종(게스트·학생·무료 공부방·유료 공부방·무료 과외쌤·유료 과외쌤·관리자) × 읽기·쓰기·수정·삭제 (서버 서비스 호출)
 * (c) 작성자 가리기: 3자 이상 「최진○」, 2자 「최○」, 1자 「○」. 응답 어디에도 이름 원문 없음, 학교·학년·연락처 키 없음
 * (d) 「응원해요」: 계정당 글마다 1회 토글, 게스트·member 불가, 고민방 반응 API·이달의 베스트 합계와 분리
 * (e) 연락처·외부 링크 차단(서버 판정, 422)
 * (e2) 사이트오류-7: 공급자 정보 게시판(info-room · info-tutor)도 같은 함수·같은 422 로 작성·수정을 막는다.
 *      정상 글은 저장·재조회 후 남고, 기존 저장 글은 목록·상세에서 그대로 읽히며 삭제도 막지 않는다. 권한 응답(403)은 그대로
 * (e3) 사이트오류-7b: 정부·교육기관 주소(*.go.kr · *.ac.kr)만 인용 허용(세 게시판 공통). 일반 도메인·위장 호스트·섞임·이메일·메신저·전화는 422
 * (f) 시드·샘플 글 없음, DB 스키마 변경 없음(기존 ENUM 값만 사용)
 * Connection 에 메모리 가짜 PDO(board_posts · board_post_reactions · students 흉내)를 주입한다. 실제 DB 에 접속하지 않는다.
 * 실행: D:\php8.2\php.exe scripts/verify-student-tips-board.php
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
use Study114\Board\InfoBoardService;
use Study114\Database\Connection;
use Study114\Paid\PaidProviderGate;

final class StStmt
{
    /** @var list<array<string, mixed>> */
    private array $rows = [];
    private mixed $column = false;
    private int $cursor = 0;

    public function __construct(private StPdo $pdo, private string $sql)
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

/** board_posts · board_post_reactions · students 를 흉내 내는 가짜 PDO. 모르는 SQL 은 예외로 드러낸다. */
final class StPdo extends PDO
{
    /** @var array<int, array<string, mixed>> */
    public array $posts = [];
    /** @var array<int, array<string, mixed>> */
    public array $reactions = [];
    /** @var array<int, string> guardian_user_id → student_name */
    public array $students = [];
    /** @var list<string> */
    public array $log = [];
    private int $nextId = 1;
    private int $nextReactionId = 1;
    private int $lastId = 0;
    private int $clock = 0;
    private int $base;

    public function __construct()
    {
        $this->base = (int) strtotime(date('Y-m-01 00:00:00')) + 60;
    }

    #[\ReturnTypeWillChange]
    public function prepare(string $query, array $options = []): StStmt
    {
        return new StStmt($this, $query);
    }

    #[\ReturnTypeWillChange]
    public function lastInsertId(?string $name = null): string|false
    {
        return (string) $this->lastId;
    }

    private function now(): string
    {
        $this->clock++;

        return date('Y-m-d H:i:s', $this->base + $this->clock);
    }

    /** @param list<mixed> $p @return array{rows?: list<array<string, mixed>>, column?: mixed} */
    public function run(string $sql, array $p): array
    {
        $s = preg_replace('/\s+/', ' ', trim($sql)) ?? '';
        $this->log[] = $s;

        // ── students ──
        if ($s === 'SELECT student_name FROM students WHERE guardian_user_id = ? ORDER BY id ASC LIMIT 1') {
            return ['column' => $this->students[(int) $p[0]] ?? false];
        }

        // ── board_post_reactions ──
        if ($s === 'SELECT * FROM board_post_reactions WHERE post_id = ? AND comment_id = ? AND user_id = ? LIMIT 1') {
            foreach ($this->reactions as $r) {
                if ($r['post_id'] === (int) $p[0] && $r['comment_id'] === (int) $p[1] && $r['user_id'] === (int) $p[2]) {
                    return ['rows' => [$r]];
                }
            }

            return ['rows' => []];
        }
        if ($s === 'SELECT * FROM board_post_reactions WHERE id = ? LIMIT 1') {
            $r = $this->reactions[(int) $p[0]] ?? null;

            return ['rows' => $r === null ? [] : [$r]];
        }
        if ($s === 'DELETE FROM board_post_reactions WHERE id = ?') {
            unset($this->reactions[(int) $p[0]]);

            return [];
        }
        if ($s === 'UPDATE board_post_reactions SET kind = ?, created_at = NOW() WHERE id = ?') {
            if (isset($this->reactions[(int) $p[1]])) {
                $this->reactions[(int) $p[1]]['kind'] = (string) $p[0];
            }

            return [];
        }
        if ($s === 'INSERT INTO board_post_reactions (post_id, comment_id, user_id, kind) VALUES (?, ?, ?, ?)') {
            foreach ($this->reactions as $r) {
                if ($r['post_id'] === (int) $p[0] && $r['comment_id'] === (int) $p[1] && $r['user_id'] === (int) $p[2]) {
                    throw new PDOException("Duplicate entry 'uq_reaction_target_user'", 23000);
                }
            }
            $id = $this->nextReactionId++;
            $this->reactions[$id] = [
                'id' => $id, 'post_id' => (int) $p[0], 'comment_id' => (int) $p[1], 'user_id' => (int) $p[2], 'kind' => (string) $p[3],
            ];
            $this->lastId = $id;

            return [];
        }
        if (preg_match("/^SELECT post_id, COUNT\(\*\) AS cnt FROM board_post_reactions WHERE post_id IN \(([?, ]+)\) AND comment_id = 0 AND kind = 'cheer' GROUP BY post_id$/", $s)) {
            $ids = array_map('intval', $p);
            $counts = [];
            foreach ($this->reactions as $r) {
                if ($r['comment_id'] === 0 && $r['kind'] === 'cheer' && in_array($r['post_id'], $ids, true)) {
                    $counts[$r['post_id']] = ($counts[$r['post_id']] ?? 0) + 1;
                }
            }

            return ['rows' => array_map(static fn (int $k, int $v): array => ['post_id' => $k, 'cnt' => $v], array_keys($counts), $counts)];
        }
        if (preg_match("/^SELECT post_id FROM board_post_reactions WHERE post_id IN \(([?, ]+)\) AND comment_id = 0 AND kind = 'cheer' AND user_id = \?$/", $s)) {
            $user = (int) array_pop($p);
            $ids = array_map('intval', $p);
            $rows = [];
            foreach ($this->reactions as $r) {
                if ($r['comment_id'] === 0 && $r['kind'] === 'cheer' && $r['user_id'] === $user && in_array($r['post_id'], $ids, true)) {
                    $rows[] = ['post_id' => $r['post_id']];
                }
            }

            return ['rows' => $rows];
        }
        if (preg_match('/^SELECT post_id, kind, COUNT\(\*\) AS cnt FROM board_post_reactions WHERE post_id IN \(([?, ]+)\) AND comment_id = 0 GROUP BY post_id, kind$/', $s)) {
            $ids = array_map('intval', $p);
            $counts = [];
            foreach ($this->reactions as $r) {
                if ($r['comment_id'] === 0 && in_array($r['post_id'], $ids, true)) {
                    $key = $r['post_id'] . '|' . $r['kind'];
                    $counts[$key] = ($counts[$key] ?? 0) + 1;
                }
            }
            $rows = [];
            foreach ($counts as $key => $cnt) {
                [$pid, $kind] = explode('|', $key);
                $rows[] = ['post_id' => (int) $pid, 'kind' => $kind, 'cnt' => $cnt];
            }

            return ['rows' => $rows];
        }
        if (preg_match("/^SELECT post_id, COUNT\(\*\) AS cnt FROM board_post_comments WHERE post_id IN \(([?, ]+)\) AND status = 'visible' GROUP BY post_id$/", $s)) {
            return ['rows' => []];
        }

        // ── board_posts (ConcernService::listBest) ──
        if (preg_match("/^SELECT bp\.id, .+ FROM board_posts bp WHERE bp\.board_key = \? AND bp\.status = 'published' AND bp\.created_at >= \? ORDER BY bp\.created_at DESC$/", $s)) {
            [$bk, $since] = $p;
            $rows = array_values(array_filter(
                $this->posts,
                static fn (array $r): bool => $r['board_key'] === $bk && $r['status'] === 'published' && strcmp((string) $r['created_at'], (string) $since) >= 0,
            ));
            usort($rows, static fn (array $a, array $b): int => strcmp((string) $b['created_at'], (string) $a['created_at']));

            return ['rows' => $rows];
        }

        // ── board_posts ──
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
            $this->lastId = $row['id'];

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

/** BoardApi::run 과 같은 변환(BoardAccessException → httpStatus, InvalidArgumentException → 422). */
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

const KEY = 'info-student';
const ROOT = __DIR__ . '/..';

$auth = [
    'guest' => null,
    'student' => ['user_id' => 31, 'role_type' => 'guardian_student', 'admin_level' => null],
    'student2' => ['user_id' => 32, 'role_type' => 'guardian_student', 'admin_level' => null],
    'student3' => ['user_id' => 33, 'role_type' => 'guardian_student', 'admin_level' => null],
    'student4' => ['user_id' => 34, 'role_type' => 'guardian_student', 'admin_level' => null],
    'student5' => ['user_id' => 35, 'role_type' => 'guardian_student', 'admin_level' => null],
    'room_free' => ['user_id' => 12, 'role_type' => 'study_room_owner', 'admin_level' => null],
    'room_paid' => ['user_id' => 11, 'role_type' => 'study_room_owner', 'admin_level' => null],
    'tutor_free' => ['user_id' => 22, 'role_type' => 'tutor', 'admin_level' => null],
    'tutor_paid' => ['user_id' => 21, 'role_type' => 'tutor', 'admin_level' => null],
    'admin' => ['user_id' => 1, 'role_type' => 'admin', 'admin_level' => 'super'],
    'member' => ['user_id' => 41, 'role_type' => '', 'admin_level' => null],
];
const PAID = [11, 21];
const RAW_NAMES = ['최진호', '김민', '이', '남궁민수'];

// ── (a) ACL 표 (BoardChannelAcl 정적) ──
$expected = [
    //               discover list  detail compose delete react comment access
    'guest' => [true, false, false, false, false, false, false, 'titles'],
    'member' => [true, false, false, false, false, false, false, 'titles'],
    'demand' => [true, true, true, true, true, true, false, 'full'],
    'supply-room' => [true, true, true, true, true, true, false, 'full'],
    'supply-tutor' => [true, true, true, true, true, true, false, 'full'],
    'admin' => [true, true, true, true, true, true, false, 'full'],
];
foreach ($expected as $role => $want) {
    $got = [
        BoardChannelAcl::canDiscover(KEY, $role),
        BoardChannelAcl::canList(KEY, $role),
        BoardChannelAcl::canDetail(KEY, $role),
        BoardChannelAcl::canCompose(KEY, $role),
        BoardChannelAcl::canDelete(KEY, $role),
        BoardChannelAcl::canReact(KEY, $role),
        BoardChannelAcl::canComment(KEY, $role),
        BoardChannelAcl::accessKind(KEY, $role),
    ];
    ok("acl_{$role}", $got === $want, json_encode($got) ?: '');
}
ok('acl_no_download_upload', static function () use ($expected): bool {
    foreach (array_keys($expected) as $role) {
        if (BoardChannelAcl::canDownload(KEY, $role) || BoardChannelAcl::canUpload(KEY, $role)) {
            return false;
        }
    }

    return true;
});
ok('acl_fail_closed_and_info_board', BoardChannelAcl::isAccessFailClosed(KEY) && BoardChannelAcl::isInfoBoard(KEY) && InfoBoardService::isInfoBoard(KEY));
ok('acl_intro_title', BoardChannelAcl::channelIntro(KEY)['title'] === '학생 꿀팁 가이드');
ok('acl_matrix_has_rows', count(array_filter(BoardChannelAcl::dumpMatrix(), static fn (array $r): bool => $r['alias'] === KEY)) === 5);
$providerExpected = [
    'guest' => [true, false, false, false, false, false, 'titles'],
    'member' => [false, false, false, false, false, false, 'blocked'],
    'demand' => [false, false, false, false, false, false, 'blocked'],
    'supply-room' => [true, true, true, true, true, false, 'full'],
    'supply-tutor' => [true, true, true, true, true, false, 'full'],
    'admin' => [true, true, true, true, true, false, 'full'],
];
ok('acl_provider_boards_unchanged', static function () use ($providerExpected): bool {
    foreach (['info-room', 'info-tutor'] as $key) {
        foreach ($providerExpected as $role => $want) {
            $got = [
                BoardChannelAcl::canDiscover($key, $role),
                BoardChannelAcl::canList($key, $role),
                BoardChannelAcl::canDetail($key, $role),
                BoardChannelAcl::canCompose($key, $role),
                BoardChannelAcl::canDelete($key, $role),
                BoardChannelAcl::canReact($key, $role),
                BoardChannelAcl::accessKind($key, $role),
            ];
            if ($got !== $want) {
                return false;
            }
        }
    }

    return true;
});

// ── 서비스 준비 ──
$pdo = new StPdo();
$pdo->students = [31 => '최진호', 32 => '김민', 33 => '이', 34 => '남궁민수'];
(new ReflectionProperty(Connection::class, 'pdo'))->setValue(null, $pdo);

function infoSvc(StPdo $pdo, array $paid = PAID): InfoBoardService
{
    return new InfoBoardService($pdo, new PaidProviderGate(null, static fn (int $u): array => in_array($u, $paid, true) ? [['id' => $u]] : []));
}
function boardSvc(StPdo $pdo, array $paid = PAID): BoardPostService
{
    return new BoardPostService(new BoardPostRepository($pdo), null, infoSvc($pdo, $paid));
}
/** posts.php GET 과 같은 진입 */
function listVia(?array $auth, ?string $postKey = null, ?array $query = null): array
{
    global $pdo;

    return boardSvc($pdo)->list(KEY, null, $postKey, $auth, null, null, null, $query);
}
function saveVia(?array $auth, array $input): array
{
    global $pdo;

    return boardSvc($pdo)->save($input + ['board_key' => KEY], $auth);
}
function deleteVia(?array $auth, string $postKey): void
{
    global $pdo;
    boardSvc($pdo)->delete(KEY, $postKey, '', $auth);
}
function rowOf(StPdo $pdo, string $postKey): ?array
{
    return array_values(array_filter($pdo->posts, static fn (array $r): bool => $r['post_key'] === $postKey))[0] ?? null;
}
$tip = static fn (string $title, string $cat = 'study-howto', string $body = '오답노트는 주말에 한 번 더 봐요.'): array => ['title' => $title, 'body' => $body, 'category' => $cat];

// ── (b) 계정 7종 × 쓰기 ──
$writeExpected = [
    'guest' => 401, 'student' => 200, 'room_free' => 403, 'room_paid' => 200, 'tutor_free' => 403, 'tutor_paid' => 200, 'admin' => 200,
];
$own = [];
foreach ($writeExpected as $who => $status) {
    ok("write_{$who}_{$status}", static function () use ($who, $status, $auth, $tip, &$own): bool {
        $got = statusOf(static function () use ($who, $auth, $tip, &$own): void {
            $own[$who] = saveVia($auth[$who], $tip("{$who} 꿀팁"));
        });

        return $got === $status;
    });
}
ok('write_member_403', static fn (): bool => statusOf(static fn () => saveVia($auth['member'], $tip('member'))) === 403);
ok('write_student_author_from_session', static function () use ($pdo, &$own): bool {
    $row = rowOf($pdo, (string) ($own['student']['id'] ?? ''));

    return $row !== null && (int) $row['author_user_id'] === 31 && $row['author_role'] === 'parent'
        && $row['board_key'] === KEY && $row['status'] === 'published';
});
ok('write_client_author_fields_ignored', static function () use ($auth, $pdo): bool {
    $p = saveVia($auth['student'], ['title' => '세션만 믿는다', 'body' => '본문', 'category' => 'habit-mind', 'author_user_id' => 1, 'author_role' => 'admin', 'author_name' => '가짜']);
    $row = rowOf($pdo, (string) ($p['id'] ?? ''));

    return $row !== null && (int) $row['author_user_id'] === 31 && $row['author_role'] === 'parent';
});
ok('write_six_categories_only', static function () use ($auth, $tip): bool {
    foreach (['study-howto', 'exam-school', 'admission-career', 'habit-mind', 'choose-provider', 'senior-story'] as $cat) {
        if (statusOf(static fn () => saveVia($auth['student'], $tip("분류 {$cat}", $cat))) !== 200) {
            return false;
        }
    }

    return statusOf(static fn () => saveVia($auth['student'], $tip('다른 게시판 분류', 'know-how'))) === 422
        && statusOf(static fn () => saveVia($auth['student'], $tip('없는 분류', 'free-talk'))) === 422;
});
ok('write_categories_constant', InfoBoardService::CATEGORIES[KEY] === ['study-howto', 'exam-school', 'admission-career', 'habit-mind', 'choose-provider', 'senior-story']);
ok('write_student_cannot_post_provider_boards', static fn (): bool =>
    statusOf(static fn () => boardSvc($GLOBALS['pdo'])->save(['board_key' => 'info-room', 'title' => 't', 'body' => 'b', 'category' => 'know-how'], $auth['student'])) === 403
    && statusOf(static fn () => boardSvc($GLOBALS['pdo'])->save(['board_key' => 'info-tutor', 'title' => 't', 'body' => 'b', 'category' => 'lesson'], $auth['student'])) === 403);

// ── (b) 읽기 ──
$readers = ['student', 'room_free', 'room_paid', 'tutor_free', 'tutor_paid', 'admin'];
ok('read_guest_titles_only', static function (): bool {
    $res = listVia(null);
    if (($res['access'] ?? '') !== 'titles' || ($res['posts'] ?? []) === [] || ($res['canCompose'] ?? null) !== false) {
        return false;
    }
    foreach ($res['posts'] as $p) {
        $keys = array_keys($p);
        sort($keys);
        if ($keys !== ['categoryId', 'createdAt', 'id', 'title']) {
            return false;
        }
    }

    return true;
});
ok('read_guest_detail_no_body_no_author', static function () use (&$own): bool {
    $res = listVia(null, (string) ($own['student']['id'] ?? ''));
    $json = json_encode($res, JSON_UNESCAPED_UNICODE) ?: '';

    return ($res['access'] ?? '') === 'titles' && !array_key_exists('body', $res['post'] ?? [])
        && !str_contains($json, '오답노트') && !str_contains($json, '최진') && !array_key_exists('cheerCount', $res['post'] ?? []);
});
ok('read_member_titles_only', static fn (): bool => (listVia($auth['member'])['access'] ?? '') === 'titles');
foreach ($readers as $who) {
    ok("read_{$who}_full", static function () use ($who, $auth, &$own): bool {
        $list = listVia($auth[$who]);
        $detail = listVia($auth[$who], (string) ($own['student']['id'] ?? ''));

        return ($list['access'] ?? '') === 'full'
            && ($detail['access'] ?? '') === 'full'
            && ($detail['post']['body'] ?? '') === '오답노트는 주말에 한 번 더 봐요.';
    });
}
ok('read_can_compose_flag_per_account', static function () use ($auth): bool {
    $flag = static fn (string $who): ?bool => listVia($auth[$who])['canCompose'] ?? null;

    return $flag('student') === true && $flag('room_paid') === true && $flag('tutor_paid') === true && $flag('admin') === true
        && $flag('room_free') === false && $flag('tutor_free') === false;
});
ok('read_paging_20', static function () use ($auth, $tip): bool {
    for ($i = 1; $i <= 21; $i++) {
        saveVia($auth['student2'], $tip("페이지 {$i}", 'exam-school'));
    }
    $first = listVia($auth['student']);
    $second = listVia($auth['student'], null, ['category' => null, 'limit' => 20, 'offset' => 20]);
    $cat = listVia($auth['student'], null, ['category' => 'exam-school', 'limit' => 20, 'offset' => 0]);

    return count($first['posts']) === 20 && $first['hasMore'] === true && ($first['posts'][0]['title'] ?? '') === '페이지 21'
        && count($second['posts']) === $first['total'] - 20 && $second['hasMore'] === false
        && array_unique(array_column($cat['posts'], 'categoryId')) === ['exam-school'];
});

// ── (b) 수정 · 삭제 (작성자 본인·관리자만) ──
$sp = static fn () => (string) ($own['student']['id'] ?? '');
$editInput = static fn (string $pk): array => ['post_key' => $pk, 'title' => '고친 꿀팁', 'body' => '고친 본문', 'category' => 'habit-mind'];
ok('edit_guest_401', static fn (): bool => statusOf(static fn () => saveVia(null, $editInput($sp()))) === 401);
ok('edit_other_student_403', static fn (): bool => statusOf(static fn () => saveVia($auth['student2'], $editInput($sp()))) === 403);
ok('edit_paid_room_on_student_post_403', static fn (): bool => statusOf(static fn () => saveVia($auth['room_paid'], $editInput($sp()))) === 403);
ok('edit_paid_tutor_on_student_post_403', static fn (): bool => statusOf(static fn () => saveVia($auth['tutor_paid'], $editInput($sp()))) === 403);
ok('edit_free_room_403', static fn (): bool => statusOf(static fn () => saveVia($auth['room_free'], $editInput($sp()))) === 403);
ok('edit_free_tutor_403', static fn (): bool => statusOf(static fn () => saveVia($auth['tutor_free'], $editInput($sp()))) === 403);
ok('edit_author_student_ok', static function () use ($auth, $editInput, $sp, $pdo): bool {
    $p = saveVia($auth['student'], $editInput($sp()));
    $row = rowOf($pdo, $sp());

    return ($p['edited'] ?? false) === true && ($row['title'] ?? '') === '고친 꿀팁' && (int) ($row['author_user_id'] ?? 0) === 31
        && ($p['canEdit'] ?? false) === true && ($p['canDelete'] ?? false) === true;
});
ok('edit_admin_on_student_post_ok', static fn (): bool => statusOf(static fn () => saveVia($auth['admin'], $editInput($sp()))) === 200);
ok('edit_author_paid_room_own_ok', static fn (): bool => statusOf(static fn () => saveVia($auth['room_paid'], $editInput((string) ($own['room_paid']['id'] ?? '')))) === 200);
ok('edit_flags_for_non_author', static function () use ($auth, $sp): bool {
    $p = listVia($auth['student2'], $sp())['post'] ?? [];

    return ($p['canEdit'] ?? null) === false && ($p['canDelete'] ?? null) === false;
});
ok('delete_guest_401', static fn (): bool => statusOf(static fn () => deleteVia(null, $sp())) === 401);
ok('delete_other_student_403', static fn (): bool => statusOf(static fn () => deleteVia($auth['student2'], $sp())) === 403);
ok('delete_paid_tutor_on_student_post_403', static fn (): bool => statusOf(static fn () => deleteVia($auth['tutor_paid'], $sp())) === 403);
ok('delete_free_room_on_student_post_403', static fn (): bool => statusOf(static fn () => deleteVia($auth['room_free'], $sp())) === 403);
ok('delete_board_mismatch_403', static fn (): bool => statusOf(static fn () => boardSvc($GLOBALS['pdo'])->delete('info-room', $sp(), '', $auth['student'])) === 403);

// ── (c) 작성자 가리기 ──
ok('mask_three_chars', InfoBoardService::maskAuthorName('최진호') === '최진○');
ok('mask_two_chars', InfoBoardService::maskAuthorName('최진') === '최○');
ok('mask_one_char', InfoBoardService::maskAuthorName('최') === '○');
ok('mask_four_chars_keeps_two', InfoBoardService::maskAuthorName('남궁민수') === '남궁○');
ok('mask_empty', InfoBoardService::maskAuthorName('  ') === '');
$byName = [];
foreach (['student' => '최진○', 'student2' => '김○', 'student3' => '○', 'student4' => '남궁○', 'student5' => '학생'] as $who => $label) {
    ok("mask_response_{$who}", static function () use ($who, $label, $auth, $tip, &$byName): bool {
        $saved = saveVia($auth[$who], $tip("{$who} 이름 확인", 'senior-story'));
        $byName[$who] = (string) ($saved['id'] ?? '');
        $detail = listVia($auth['room_paid'], $byName[$who])['post'] ?? [];

        return ($saved['authorLabel'] ?? '') === $label && ($detail['authorLabel'] ?? '') === $label;
    });
}
ok('mask_provider_posts_role_label', static function () use ($auth, &$own): bool {
    $label = static fn (string $who): string => (string) (listVia($auth['student'], (string) ($own[$who]['id'] ?? ''))['post']['authorLabel'] ?? '');

    return $label('room_paid') === '공부방' && $label('tutor_paid') === '과외쌤' && $label('admin') === '운영자';
});
ok('mask_raw_name_never_in_any_response', static function () use ($auth, $pdo): bool {
    $dump = '';
    foreach (array_keys($auth) as $who) {
        $res = statusOf(static function () use ($who, $auth, &$dump): void {
            $dump .= json_encode(listVia($auth[$who], null, ['category' => null, 'limit' => 20, 'offset' => 0]), JSON_UNESCAPED_UNICODE);
            $dump .= json_encode(listVia($auth[$who], null, ['category' => 'senior-story', 'limit' => 20, 'offset' => 0]), JSON_UNESCAPED_UNICODE);
        });
        if ($res !== 200) {
            return false;
        }
    }
    foreach ($pdo->posts as $row) {
        if ($row['board_key'] === KEY && $row['status'] === 'published') {
            $dump .= json_encode(listVia($auth['admin'], (string) $row['post_key']), JSON_UNESCAPED_UNICODE);
        }
    }
    foreach (RAW_NAMES as $raw) {
        if ($raw !== '이' && str_contains($dump, $raw)) {
            return false;
        }
    }

    return str_contains($dump, '최진○') && !str_contains($dump, '"authorName"') && !str_contains($dump, 'student_name');
});
ok('mask_raw_name_not_stored_in_post', static function () use ($pdo): bool {
    foreach ($pdo->posts as $row) {
        $blob = json_encode($row, JSON_UNESCAPED_UNICODE) ?: '';
        if (str_contains($blob, '최진호') || str_contains($blob, '남궁민수')) {
            return false;
        }
    }

    return true;
});
ok('mask_no_school_grade_contact_keys', static function () use ($auth, &$byName): bool {
    $p = listVia($auth['student'], $byName['student'] ?? '')['post'] ?? [];
    $keys = array_keys($p);
    sort($keys);

    return $keys === ['authorLabel', 'body', 'canCheer', 'canDelete', 'canEdit', 'categoryId', 'cheerCount', 'cheered', 'createdAt', 'edited', 'id', 'title', 'updatedAt'];
});
ok('mask_name_source_is_students_table', static function () use ($pdo): bool {
    $q = array_values(array_filter($pdo->log, static fn (string $s): bool => str_contains($s, 'FROM students')));

    return $q !== [] && array_unique($q) === ['SELECT student_name FROM students WHERE guardian_user_id = ? ORDER BY id ASC LIMIT 1']
        && !array_filter($pdo->log, static fn (string $s): bool => (bool) preg_match('/FROM users\b/', $s));
});
$infoSrc = (string) file_get_contents(ROOT . '/src/Board/InfoBoardService.php');
ok('mask_single_function', substr_count($infoSrc, 'self::maskAuthorName(') === 1 && str_contains($infoSrc, "'authorLabel' => \$this->authorLabel(\$row)"));

// ── (d) 「응원해요」 ──
$target = static fn () => (string) ($byName['student2'] ?? '');
$cheer = static fn (?array $a, string $board = KEY, ?string $pk = null): array => infoSvc($GLOBALS['pdo'])->toggleCheer($board, $pk ?? $target(), $a);
ok('cheer_guest_401', static fn (): bool => statusOf(static fn () => $cheer(null)) === 401);
ok('cheer_member_403', static fn (): bool => statusOf(static fn () => $cheer($auth['member'])) === 403);
ok('cheer_provider_board_403', static fn (): bool => statusOf(static fn () => $cheer($auth['room_paid'], 'info-room', (string) ($own['room_paid']['id'] ?? ''))) === 403);
ok('cheer_cross_board_post_403', static fn (): bool => statusOf(static fn () => infoSvc($GLOBALS['pdo'])->toggleCheer('info-room', $target(), $auth['admin'])) === 403);
ok('cheer_toggle_on', static function () use ($cheer, $auth): bool {
    $r = $cheer($auth['student']);

    return $r['cheered'] === true && $r['cheerCount'] === 1;
});
ok('cheer_once_per_account', static function () use ($cheer, $auth, $pdo, $target): bool {
    $r = $cheer($auth['student']);
    $post = rowOf($pdo, $target());
    $mine = array_filter($pdo->reactions, static fn (array $x): bool => $x['post_id'] === (int) $post['id'] && $x['user_id'] === 31);

    return $r['cheered'] === false && $r['cheerCount'] === 0 && $mine === [];
});
ok('cheer_many_accounts_count', static function () use ($cheer, $auth): bool {
    foreach (['student', 'student3', 'room_free', 'tutor_free', 'tutor_paid', 'admin'] as $who) {
        $cheer($auth[$who]);
    }
    $r = $cheer($auth['student4']);

    return $r['cheered'] === true && $r['cheerCount'] === 7;
});
ok('cheer_kind_and_comment_zero', static function () use ($pdo): bool {
    foreach ($pdo->reactions as $r) {
        if ($r['kind'] !== 'cheer' || $r['comment_id'] !== 0) {
            return false;
        }
    }

    return $pdo->reactions !== [];
});
ok('cheer_state_in_detail_per_viewer', static function () use ($auth, $target): bool {
    $mine = listVia($auth['student'], $target())['post'] ?? [];
    $other = listVia($auth['student2'], $target())['post'] ?? [];

    return ($mine['cheered'] ?? null) === true && ($other['cheered'] ?? null) === false
        && ($mine['cheerCount'] ?? 0) === 7 && ($other['canCheer'] ?? null) === true;
});
ok('cheer_count_in_list', static function () use ($auth, $target): bool {
    $res = listVia($auth['tutor_free'], null, ['category' => 'senior-story', 'limit' => 20, 'offset' => 0]);
    foreach ($res['posts'] as $p) {
        if ($p['id'] === $target()) {
            return $p['cheerCount'] === 7 && $p['cheered'] === true;
        }
    }

    return false;
});
ok('cheer_absent_on_provider_board_items', static function () use ($pdo, $auth): bool {
    infoSvc($pdo)->save(['board_key' => 'info-room', 'title' => '공급자 글', 'body' => '본문', 'category' => 'know-how'], $auth['room_paid']);
    $p = boardSvc($pdo)->list('info-room', null, null, $auth['room_paid'], null, null, null, null)['posts'][0] ?? [];

    return $p !== [] && !array_key_exists('cheerCount', $p) && !array_key_exists('canCheer', $p);
});
// 고민방 반응·이달의 베스트와 분리
$concernPostId = 0;
ok('cheer_concern_api_rejects_student_tips_post', static function () use ($pdo, $auth, $target): bool {
    $post = rowOf($pdo, $target());

    return statusOf(static fn () => (new ConcernService())->toggleReaction((int) $post['id'], null, 'cheer', $auth['student'])) === 422;
});
ok('cheer_not_in_best_totals', static function () use ($pdo, &$concernPostId, $target): bool {
    $pdo->run(
        'INSERT INTO board_posts (board_key, post_key, author_user_id, author_role, status, title, description, memo, category_id, file_label, meta_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        ['concern-parent', 'concern-parent-best1', 31, 'parent', 'published', 'CONCERN_BEST', '본문', '', null, '', null],
    );
    $concernPostId = (int) rowOf($pdo, 'concern-parent-best1')['id'];
    foreach ([101, 102, 103, 104, 105] as $u) {
        $pdo->run('INSERT INTO board_post_reactions (post_id, comment_id, user_id, kind) VALUES (?, ?, ?, ?)', [$concernPostId, 0, $u, 'empathy']);
    }
    $best = (new ConcernService())->listBest(null);
    $json = json_encode($best, JSON_UNESCAPED_UNICODE) ?: '';
    $tipTitle = (string) rowOf($pdo, $target())['title'];
    $parent = $best['concern-parent'][0] ?? [];

    return !array_key_exists(KEY, $best)
        && !str_contains($json, $tipTitle)
        && ($parent['title'] ?? '') === 'CONCERN_BEST'
        && ($parent['reactionTotal'] ?? 0) === 5;
});
ok('cheer_does_not_change_concern_totals', static function () use ($pdo, $auth, &$concernPostId, $target): bool {
    $cheer = infoSvc($pdo)->toggleCheer(KEY, $target(), $auth['student5']);
    $best = (new ConcernService())->listBest(null);

    return $cheer['cheerCount'] === 8 && (($best['concern-parent'][0]['reactionTotal'] ?? 0) === 5);
});
$concernSrc = (string) file_get_contents(ROOT . '/src/Board/ConcernService.php');
ok('cheer_concern_keys_exclude_student_tips', static function () use ($concernSrc): bool {
    $keys = (new ReflectionClassConstant(ConcernService::class, 'CONCERN_BOARD_KEYS'))->getValue();

    return !in_array(KEY, $keys, true) && !str_contains($concernSrc, KEY);
});
$reactionsSrc = (string) file_get_contents(ROOT . '/public/api/board/reactions.php');
ok('cheer_endpoint_routes_info_board_separately', str_contains($reactionsSrc, 'InfoBoardService::isInfoBoard($boardKey)')
    && str_contains($reactionsSrc, '->toggleCheer(') && str_contains($reactionsSrc, '->toggleReaction('));
ok('cheer_no_comments', !BoardChannelAcl::canComment(KEY, 'demand') && !str_contains($infoSrc, 'board_post_comments'));

// ── (b) 삭제 (작성자 본인·관리자) — 응원 검사 뒤에 지운다 ──
ok('delete_author_student_ok', static function () use ($auth, $sp, $pdo): bool {
    deleteVia($auth['student'], $sp());

    return (rowOf($pdo, $sp())['status'] ?? '') === 'deleted' && statusOf(static fn () => listVia($auth['student'], $sp())) === 404;
});
ok('delete_admin_other_ok', static fn (): bool => statusOf(static fn () => deleteVia($auth['admin'], (string) ($own['tutor_paid']['id'] ?? ''))) === 200);
ok('delete_author_provider_after_paid_ended_ok', static fn (): bool => statusOf(static fn () => boardSvc($GLOBALS['pdo'], [])->delete(KEY, (string) ($own['room_paid']['id'] ?? ''), '', $auth['room_paid'])) === 200);

// ── (e) 연락처·외부 링크 차단 ──
$blocked = [
    'phone_dash' => '연락 주세요 010-1234-5678',
    'phone_plain' => '01012345678 로 문자',
    'phone_space' => '공일공 말고 010 1234 5678',
    'landline' => '학원 02-123-4567',
    'kakao_en' => 'kakao id: tipking',
    'kakaotalk' => '카톡 주세요',
    'openchat' => '오픈채팅방 들어와요',
    'telegram' => '텔레그램으로 연락',
    'url_https' => '자료는 https://example.com/a 에',
    'url_www' => 'www.example.org 참고',
    'domain' => 'mytips.kr 에 정리해 둠',
    'email' => '메일 tips@example.com',
];
foreach ($blocked as $name => $text) {
    ok("contact_block_body_{$name}", static fn (): bool => statusOf(static fn () => saveVia($auth['student'], $tip('차단 확인', 'study-howto', $text))) === 422);
}
ok('contact_block_title', static fn (): bool => statusOf(static fn () => saveVia($auth['student'], $tip('카톡 010-9999-8888', 'study-howto', '본문'))) === 422);
ok('contact_block_on_edit', static function () use ($auth, &$byName): bool {
    return statusOf(static fn () => saveVia($auth['student3'], ['post_key' => $byName['student3'] ?? '', 'title' => '고침', 'body' => 'https://x.co', 'category' => 'habit-mind'])) === 422;
});
ok('contact_block_message', static function () use ($auth, $tip): bool {
    try {
        saveVia($auth['student'], $tip('t', 'study-howto', '카톡 주세요'));
    } catch (InvalidArgumentException $e) {
        return $e->getMessage() === InfoBoardService::BLOCKED_CONTACT_MESSAGE;
    }

    return false;
});
foreach ([
    'grade' => '수학 3등급에서 1등급까지 올린 방법',
    'date_score' => '2026년 3월 모의고사 82점 → 6월 91점',
    'hours' => '하루 10시간 공부 루틴 1. 2. 3.',
    'ratio' => '국영수 비율 4:3:3 으로 나눠요',
] as $name => $text) {
    ok("contact_allow_{$name}", static fn (): bool => statusOf(static fn () => saveVia($auth['student'], $tip('허용 확인', 'study-howto', $text))) === 200);
}
ok('contact_filter_single_function', substr_count($infoSrc, 'self::findBlockedContact(') === 2 && str_contains($infoSrc, 'public static function findBlockedContact('));
// 사이트오류-7: 공급자 정보 게시판도 막는다(이전 기대값 200 → 정책 변경으로 422)
ok('contact_provider_boards_blocked_too', static fn (): bool =>
    statusOf(static fn () => infoSvc($GLOBALS['pdo'])->save(['board_key' => 'info-room', 'title' => '문의', 'body' => '010-1234-5678', 'category' => 'recruit'], $auth['room_paid'])) === 422);
ok('contact_block_admin_student_tips', static fn (): bool => statusOf(static fn () => saveVia($auth['admin'], $tip('운영 안내', 'study-howto', '문의는 help@example.com'))) === 422);

// ── (e2) 사이트오류-7 · 공급자 정보 게시판 2곳 연락처·외부 링크 차단 ──
$providerBoards = [
    'info-room' => ['who' => 'room_paid', 'uid' => 11, 'role' => 'study_room', 'cat' => 'recruit', 'cat2' => 'know-how', 'other' => 'tutor_paid'],
    'info-tutor' => ['who' => 'tutor_paid', 'uid' => 21, 'role' => 'tutor', 'cat' => 'lesson', 'cat2' => 'consult-match', 'other' => 'room_paid'],
];
$providerBlocked = [
    'phone_dash' => '상담 문의 010-1234-5678',
    'phone_plain' => '01098765432 로 연락 주세요',
    'landline' => '학원 대표번호 031-123-4567',
    'url_https' => '자세한 건 https://example.com/room 참고',
    'url_www' => 'www.myroom.org 에 정리',
    'domain' => 'myroom.kr 에서 확인',
    'email' => '문의 room@example.com',
    'kakao' => '카카오 채널로 문의 주세요',
    'kakaotalk' => '카톡 아이디 남겨요',
    'openchat' => '오픈채팅방 링크 드려요',
    'telegram' => 'telegram 으로 연락',
];
$pSave = static fn (string $board, ?array $who, array $input): array => boardSvc($GLOBALS['pdo'])->save($input + ['board_key' => $board], $who);
$pList = static fn (string $board, ?array $who, ?string $postKey = null): array => boardSvc($GLOBALS['pdo'])->list($board, null, $postKey, $who, null, null, null, null);
$boardRows = static fn (string $board): array => array_values(array_filter($GLOBALS['pdo']->posts, static fn (array $r): bool => $r['board_key'] === $board));
$blockedMessageOf = static function (callable $fn): string {
    try {
        $fn();
    } catch (InvalidArgumentException $e) {
        return $e->getMessage();
    }

    return '';
};

foreach ($providerBoards as $board => $cfg) {
    $writer = $auth[$cfg['who']];
    $post = static fn (string $title, string $body, ?string $cat = null): array => ['title' => $title, 'body' => $body, 'category' => $cat ?? $cfg['cat']];

    // 작성: 본문·제목 차단, 사유 = info-student 와 같은 메시지, 저장 행 없음
    $before = count($boardRows($board));
    foreach ($providerBlocked as $name => $text) {
        ok("provider_{$board}_block_body_{$name}", static fn (): bool => statusOf(static fn () => $pSave($board, $writer, $post('운영 팁', $text))) === 422);
    }
    ok("provider_{$board}_block_title", static fn (): bool => statusOf(static fn () => $pSave($board, $writer, $post('카톡 010-9999-8888', '본문'))) === 422);
    ok("provider_{$board}_block_no_row_written", static fn (): bool => count($boardRows($board)) === $before);
    ok("provider_{$board}_block_same_message", static fn (): bool =>
        $blockedMessageOf(static fn () => $pSave($board, $writer, $post('t', '카카오 문의'))) === InfoBoardService::BLOCKED_CONTACT_MESSAGE
        && $blockedMessageOf(static fn () => saveVia($writer, $tip('t', 'study-howto', '카카오 문의'))) === InfoBoardService::BLOCKED_CONTACT_MESSAGE);
    ok("provider_{$board}_block_admin", static fn (): bool => statusOf(static fn () => $pSave($board, $auth['admin'], $post('운영 안내', 'https://study114.net/notice'))) === 422);

    // 정상 글: 저장 → 새 서비스로 재조회(목록·상세) 후 남음, 수정도 저장·재조회
    $clean = [];
    ok("provider_{$board}_clean_saved_and_reloaded", static function () use ($board, $writer, $post, $pSave, $pList, $cfg, $auth, &$clean): bool {
        $clean = $pSave($board, $writer, $post('첫 상담 체크리스트', "1. 목표 듣기\n2. 주 2회 일정 맞추기", $cfg['cat2']));
        $list = $pList($board, $writer);
        $detail = $pList($board, $auth['admin'], (string) ($clean['id'] ?? ''));
        $row = rowOf($GLOBALS['pdo'], (string) ($clean['id'] ?? ''));

        return ($clean['id'] ?? '') !== ''
            && in_array($clean['id'], array_column($list['posts'] ?? [], 'id'), true)
            && ($detail['post']['body'] ?? '') === "1. 목표 듣기\n2. 주 2회 일정 맞추기"
            && ($row['status'] ?? '') === 'published' && (int) ($row['author_user_id'] ?? 0) === $cfg['uid'];
    });
    ok("provider_{$board}_clean_edit_saved_and_reloaded", static function () use ($board, $writer, $post, $pSave, $pList, &$clean): bool {
        $pk = (string) ($clean['id'] ?? '');
        $p = $pSave($board, $writer, ['post_key' => $pk] + $post('첫 상담 체크리스트(보강)', '목표·일정·숙제량 순서로 묻기'));
        $detail = $pList($board, $writer, $pk);

        return ($p['edited'] ?? false) === true && ($detail['post']['title'] ?? '') === '첫 상담 체크리스트(보강)'
            && ($detail['post']['body'] ?? '') === '목표·일정·숙제량 순서로 묻기';
    });
    ok("provider_{$board}_block_on_edit_keeps_row", static function () use ($board, $writer, $post, $pSave, &$clean): bool {
        $pk = (string) ($clean['id'] ?? '');
        $status = statusOf(static fn () => $pSave($board, $writer, ['post_key' => $pk] + $post('고침', '문의 010-2222-3333')));
        $row = rowOf($GLOBALS['pdo'], $pk);

        return $status === 422 && ($row['title'] ?? '') === '첫 상담 체크리스트(보강)' && ($row['description'] ?? '') === '목표·일정·숙제량 순서로 묻기';
    });

    // 차단 도입 전에 저장된 글(연락처 포함): 목록·상세 그대로, 게스트 제목만, 수정은 막고, 삭제는 막지 않는다
    $legacyKey = "{$board}-legacy-contact";
    $legacyBody = '예전 글: 상담은 010-5555-6666 / https://old.example.com';
    $GLOBALS['pdo']->run(
        'INSERT INTO board_posts (board_key, post_key, author_user_id, author_role, status, title, description, memo, category_id, file_label, meta_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [$board, $legacyKey, $cfg['uid'], $cfg['role'], 'published', '예전 카톡 상담 안내', $legacyBody, '', $cfg['cat'], '', null],
    );
    ok("provider_{$board}_legacy_list_detail_readable", static function () use ($board, $pList, $auth, $cfg, $legacyKey, $legacyBody): bool {
        foreach ([$cfg['who'], $cfg['other'], 'room_free', 'tutor_free', 'admin'] as $who) {
            $list = $pList($board, $auth[$who]);
            $detail = $pList($board, $auth[$who], $legacyKey);
            $hit = array_values(array_filter($list['posts'] ?? [], static fn (array $p): bool => $p['id'] === $legacyKey))[0] ?? [];
            if (($hit['body'] ?? '') !== $legacyBody || ($detail['post']['body'] ?? '') !== $legacyBody || ($detail['post']['title'] ?? '') !== '예전 카톡 상담 안내') {
                return false;
            }
        }

        return true;
    });
    ok("provider_{$board}_legacy_guest_titles", static function () use ($board, $pList, $legacyKey): bool {
        $list = $pList($board, null);
        $hit = array_values(array_filter($list['posts'] ?? [], static fn (array $p): bool => $p['id'] === $legacyKey))[0] ?? [];

        return ($list['access'] ?? '') === 'titles' && ($hit['title'] ?? '') === '예전 카톡 상담 안내' && !array_key_exists('body', $hit);
    });
    ok("provider_{$board}_legacy_edit_with_contact_blocked", static function () use ($board, $writer, $post, $pSave, $legacyKey, $legacyBody): bool {
        $status = statusOf(static fn () => $pSave($board, $writer, ['post_key' => $legacyKey] + $post('예전 카톡 상담 안내', $legacyBody)));

        return $status === 422 && (rowOf($GLOBALS['pdo'], $legacyKey)['description'] ?? '') === $legacyBody;
    });
    ok("provider_{$board}_legacy_delete_not_blocked", static function () use ($board, $writer, $legacyKey): bool {
        $status = statusOf(static fn () => boardSvc($GLOBALS['pdo'])->delete($board, $legacyKey, '', $writer));

        return $status === 200 && (rowOf($GLOBALS['pdo'], $legacyKey)['status'] ?? '') === 'deleted';
    });

    // 권한 응답은 그대로: 학생·무료 공급자는 연락처가 있어도 403(내용 판정보다 먼저)
    ok("provider_{$board}_student_still_403", static fn (): bool =>
        statusOf(static fn () => $pSave($board, $auth['student'], $post('t', '010-1234-5678'))) === 403
        && statusOf(static fn () => $pSave($board, $auth['student'], $post('t', '본문'))) === 403
        && statusOf(static fn () => $pList($board, $auth['student'])) === 403);
    ok("provider_{$board}_free_provider_still_403", static fn (): bool =>
        statusOf(static fn () => $pSave($board, $auth['room_free'], $post('t', 'https://x.com'))) === 403
        && statusOf(static fn () => $pSave($board, $auth['tutor_free'], $post('t', '본문'))) === 403);
}
$apiSrc = (string) file_get_contents(ROOT . '/src/Board/BoardApi.php');
$postsSrc = (string) file_get_contents(ROOT . '/public/api/board/posts.php');
ok('provider_block_same_422_validation_key', (bool) preg_match("/catch \\(InvalidArgumentException \\\$e\\) \\{\\s*self::fail\\(422, 'validation', \\\$e->getMessage\\(\\)\\);/", $apiSrc)
    && str_contains($postsSrc, 'BoardApi::run(') && str_contains($postsSrc, '$service->save(BoardApi::readJson(), $auth)'));
ok('provider_block_only_in_save_path', static function () use ($infoSrc): bool {
    $saveAt = strpos($infoSrc, 'public function save(');
    $nextAt = strpos($infoSrc, 'public function toggleCheer(');
    $first = strpos($infoSrc, 'self::findBlockedContact(');
    $last = strrpos($infoSrc, 'self::findBlockedContact(');

    return $saveAt !== false && $nextAt !== false && $first > $saveAt && $last < $nextAt
        && !preg_match('/isStudentTipsBoard\(\$boardKey\)\s*&&\s*\(self::findBlockedContact/', $infoSrc);
});

// ── (e3) 사이트오류-7b · 정부·교육기관 주소(.go.kr · .ac.kr) 인용 허용. 세 게시판 공통, url·domain 판정에만 ──
$citeAllowed = [
    'hometax_paren' => '홈택스(hometax.go.kr)에서 신고',
    'sen_www' => '교육청 공지 www.sen.go.kr',
    'hometax_https' => 'https://www.hometax.go.kr/ 참고',
    'snu_ac' => 'snu.ac.kr 입시요강',
];
$citeBlocked = [
    'adiga' => ['adiga.kr', 'domain'],
    'blog_naver' => ['blog.naver.com', 'domain'],
    'co_kr' => ['abc.co.kr', 'domain'],
    'example_org' => ['example.org', 'domain'],
    'spoof_suffix' => ['hometax.go.kr.evil.com', 'domain'],
    'spoof_glued' => ['evilgo.kr', 'domain'],
    'email_gov' => ['a@hometax.go.kr', 'domain'],
    'kakaomap' => ['카카오맵으로 위치 확인', 'messenger'],
    'tax_office_phone' => ['세무서 02-123-4567', 'phone'],
    'mixed' => ['hometax.go.kr 그리고 adiga.kr', 'domain'],
];
ok('cite_fn_allowed_null', static function () use ($citeAllowed): bool {
    foreach ($citeAllowed as $text) {
        if (InfoBoardService::findBlockedContact($text) !== null) {
            return false;
        }
    }

    return true;
});
ok('cite_fn_blocked_reason_keys', static function () use ($citeBlocked): bool {
    foreach ($citeBlocked as [$text, $reason]) {
        if (InfoBoardService::findBlockedContact($text) !== $reason) {
            return false;
        }
    }

    return true;
});
ok('cite_fn_host_spoofs_blocked', static function (): bool {
    foreach ([
        'go.kr.example.com', 'xgo.kr', 'go.kr', 'hometax.go.kr.한국', 'https://sen.go.kr한글.xyz',
        'https://hometax.go.kr@evil.xyz', 'https://hometax.go.kr&@evil.xyz', 'https://www.hometax.go.kr/?r=evil.com',
        'www.sen.go.kr 와 www.example.org', 'https://www.hometax.go.kr/ 그리고 https://x.co',
    ] as $text) {
        if (!in_array(InfoBoardService::findBlockedContact($text), ['url', 'domain'], true)) {
            return false;
        }
    }

    return true;
});
ok('cite_fn_other_rules_unchanged', static fn (): bool =>
    InfoBoardService::findBlockedContact('https://x.co') === 'url'
    && InfoBoardService::findBlockedContact('www.example.org 참고') === 'url'
    && InfoBoardService::findBlockedContact('mytips.kr 에 정리해 둠') === 'domain'
    && InfoBoardService::findBlockedContact('메일 tips@example.com') === 'domain'
    && InfoBoardService::findBlockedContact('a@b.xyz') === 'email'
    && InfoBoardService::findBlockedContact('hometax.go.kr 메일 tax@b.xyz') === 'email'
    && InfoBoardService::findBlockedContact('hometax.go.kr 010-1234-5678') === 'phone'
    && InfoBoardService::findBlockedContact('snu.ac.kr 카톡 주세요') === 'messenger'
    && InfoBoardService::findBlockedContact('kakao www.sen.go.kr') === 'messenger');
ok('cite_single_impl_no_board_branch', static function () use ($infoSrc): bool {
    $fn = new ReflectionMethod(InfoBoardService::class, 'findBlockedContact');

    return $fn->getNumberOfParameters() === 1 && substr_count($infoSrc, '(?:go|ac)\.kr') === 1
        && substr_count($infoSrc, 'self::findBlockedContact(') === 2;
});

$citeBoards = [
    KEY => ['who' => 'student', 'cat' => 'study-howto'],
    'info-room' => ['who' => 'room_paid', 'cat' => 'know-how'],
    'info-tutor' => ['who' => 'tutor_paid', 'cat' => 'lesson'],
];
foreach ($citeBoards as $board => $cfg) {
    $writer = $auth[$cfg['who']];
    $in = static fn (string $title, string $body, ?string $pk = null): array => ($pk !== null ? ['post_key' => $pk] : []) + ['title' => $title, 'body' => $body, 'category' => $cfg['cat']];
    $savedCite = [];

    // 허용: 저장 → 새 서비스로 목록·상세 재조회 후 그대로 남음
    foreach ($citeAllowed as $name => $text) {
        ok("cite_{$board}_allow_{$name}_saved_and_reloaded", static function () use ($board, $writer, $in, $text, $name, $pSave, $pList, $auth, &$savedCite): bool {
            $p = $pSave($board, $writer, $in('공식 안내 인용', $text));
            $pk = (string) ($p['id'] ?? '');
            $savedCite[$name] = $pk;
            $list = $pList($board, $writer);
            $detail = $pList($board, $auth['admin'], $pk);
            $row = rowOf($GLOBALS['pdo'], $pk);

            return $pk !== '' && in_array($pk, array_column($list['posts'] ?? [], 'id'), true)
                && ($detail['post']['body'] ?? '') === $text
                && ($row['description'] ?? '') === $text && ($row['status'] ?? '') === 'published';
        });
    }
    ok("cite_{$board}_allow_in_title", static function () use ($board, $writer, $in, $pSave, $pList): bool {
        $p = $pSave($board, $writer, $in('홈택스(hometax.go.kr) 신고 순서', '메뉴에서 신고를 고르면 돼요.'));

        return ($pList($board, $writer, (string) ($p['id'] ?? ''))['post']['title'] ?? '') === '홈택스(hometax.go.kr) 신고 순서';
    });

    // 차단: 422 · 같은 메시지 · 저장 행 없음
    $before = count($boardRows($board));
    foreach ($citeBlocked as $name => [$text]) {
        ok("cite_{$board}_block_{$name}_422", static fn (): bool => statusOf(static fn () => $pSave($board, $writer, $in('운영 팁', $text))) === 422);
    }
    ok("cite_{$board}_block_in_title_422", static fn (): bool => statusOf(static fn () => $pSave($board, $writer, $in('adiga.kr 정리', '본문'))) === 422);
    ok("cite_{$board}_block_no_row_written", static fn (): bool => count($boardRows($board)) === $before);
    ok("cite_{$board}_block_same_message", static fn (): bool =>
        $blockedMessageOf(static fn () => $pSave($board, $writer, $in('t', 'hometax.go.kr 그리고 adiga.kr'))) === InfoBoardService::BLOCKED_CONTACT_MESSAGE);

    // 수정 경로도 같은 판정
    ok("cite_{$board}_edit_allow_saved_and_reloaded", static function () use ($board, $writer, $in, $pSave, $pList, &$savedCite): bool {
        $pk = (string) ($savedCite['snu_ac'] ?? '');
        $body = '교육청 공지 www.sen.go.kr 와 https://www.hometax.go.kr/ 참고';
        $p = $pSave($board, $writer, $in('입시요강 인용(보강)', $body, $pk));
        $detail = $pList($board, $writer, $pk);

        return $pk !== '' && ($p['edited'] ?? false) === true && ($detail['post']['body'] ?? '') === $body;
    });
    ok("cite_{$board}_edit_block_keeps_row", static function () use ($board, $writer, $in, $pSave, $citeBlocked, &$savedCite): bool {
        $pk = (string) ($savedCite['hometax_paren'] ?? '');
        foreach ($citeBlocked as [$text]) {
            if (statusOf(static fn () => $pSave($board, $writer, $in('고침', $text, $pk))) !== 422) {
                return false;
            }
        }
        $row = rowOf($GLOBALS['pdo'], $pk);

        return $pk !== '' && ($row['title'] ?? '') === '공식 안내 인용' && ($row['description'] ?? '') === '홈택스(hometax.go.kr)에서 신고';
    });
}

// ── (f) 시드 없음 · DB 스키마 변경 없음 ──
ok('no_seed_in_sql_dir', static function (): bool {
    $it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator(ROOT . '/sql', FilesystemIterator::SKIP_DOTS));
    foreach ($it as $f) {
        if ($f->isFile() && str_contains((string) file_get_contents($f->getPathname()), KEY)) {
            return false;
        }
    }

    return true;
});
ok('no_seed_in_service', !preg_match('/INSERT INTO|SEED|sample/i', $infoSrc));
$sql021 = (string) file_get_contents(ROOT . '/sql/schema/021_board_engine.sql');
$sql075 = (string) file_get_contents(ROOT . '/sql/schema/075_concern_comments_reactions.sql');
ok('schema_board_key_varchar', (bool) preg_match('/board_key\s+VARCHAR\(50\)/i', $sql021));
ok('schema_author_role_has_parent', (bool) preg_match("/author_role\s+ENUM\([^)]*'parent'/i", $sql021));
ok('schema_reaction_kind_has_cheer', (bool) preg_match("/kind\s+ENUM\([^)]*'cheer'/i", $sql075));
ok('schema_reaction_unique_per_user', (bool) preg_match('/UNIQUE[^;]*\(\s*post_id\s*,\s*comment_id\s*,\s*user_id\s*\)/i', $sql075));
ok('service_allowed_key', (new ReflectionClassConstant(BoardPostService::class, 'ALLOWED_BOARD_KEYS'))->getValue() !== [] && in_array(KEY, (new ReflectionClassConstant(BoardPostService::class, 'ALLOWED_BOARD_KEYS'))->getValue(), true));

echo "\n{$passed} passed / {$failed} failed\n";
exit($failed > 0 ? 1 : 0);
