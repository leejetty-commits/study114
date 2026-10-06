<?php

declare(strict_types=1);

ob_start();

/**
 * 관리자-159-c 등록 목록 쿼리·API.
 * 실행: php scripts/verify-admin-registration-list.php
 * 로컬 시험 DB만 사용한다.
 */

$env = [
    'STUDY114_DB_HOST' => '127.0.0.1',
    'STUDY114_DB_PORT' => '3306',
    'STUDY114_DB_NAME' => 'study114_dev',
    'STUDY114_DB_USER' => 'study114',
    'STUDY114_DB_PASS' => 'study114dev',
    'STUDY114_APP_ENV' => 'local',
];
foreach ($env as $key => $value) {
    putenv($key . '=' . $value);
    $_ENV[$key] = $value;
    $_SERVER[$key] = $value;
}

date_default_timezone_set('Asia/Seoul');
$sessionDir = '/tmp/study114-159c-sessions';
if (!is_dir($sessionDir)) {
    mkdir($sessionDir, 0777, true);
}
ini_set('session.save_path', $sessionDir);

require_once dirname(__DIR__) . '/src/bootstrap.php';

use Study114\Admin\AdminRegistrationListRepository;
use Study114\Auth\AuthSession;
use Study114\Database\Connection;
use Study114\Registration\BasicCardRegisteredQuery;
use Study114\Report\ReportPeriod;

$pass = 0;
$fail = 0;

function ok(string $name, bool $cond, string $detail = ''): void
{
    global $pass, $fail;
    if ($cond) {
        $pass++;
        echo "PASS  {$name}\n";
    } else {
        $fail++;
        echo "FAIL  {$name}" . ($detail !== '' ? " — {$detail}" : '') . "\n";
    }
}

function methodBody(string $src, string $name): string
{
    $needle = 'function ' . $name . '(';
    $pos = strpos($src, $needle);
    if ($pos === false) {
        return '';
    }
    $brace = strpos($src, '{', $pos);
    if ($brace === false) {
        return '';
    }
    $depth = 0;
    $len = strlen($src);
    for ($i = $brace; $i < $len; $i++) {
        if ($src[$i] === '{') {
            $depth++;
        } elseif ($src[$i] === '}') {
            $depth--;
            if ($depth === 0) {
                return substr($src, $pos, $i - $pos + 1);
            }
        }
    }

    return '';
}

$origQuery = (string) shell_exec('git show 0a7005c:src/Registration/BasicCardRegisteredQuery.php');
$origPeriod = (string) shell_exec('git show 0a7005c:src/Report/ReportPeriod.php');
$nowQuery = (string) file_get_contents(dirname(__DIR__) . '/src/Registration/BasicCardRegisteredQuery.php');
$nowPeriod = (string) file_get_contents(dirname(__DIR__) . '/src/Report/ReportPeriod.php');
ok('period-bytes', $nowPeriod === $origPeriod);
foreach (['countByRole', 'listByRole', 'countRole', 'where', 'selectList', 'bounds', 'from', 'assertRole'] as $name) {
    ok(
        'contract-' . $name,
        methodBody($origQuery, $name) !== '' && methodBody($origQuery, $name) === methodBody($nowQuery, $name)
    );
}
$listAdmin = methodBody($nowQuery, 'listByRoleForAdmin');
$wherePos = strpos($listAdmin, 'WHERE ');
$limitPos = strpos($listAdmin, 'LIMIT ');
ok('region-before-limit', $wherePos !== false && $limitPos !== false && $wherePos < $limitPos);
ok('admin-where-reuses', str_contains(methodBody($nowQuery, 'adminWhere'), '$this->where('));
ok('no-week-range', !str_contains(file_get_contents(dirname(__DIR__) . '/src/Admin/AdminRegistrationListRepository.php'), 'weekRange'));

$pdo = Connection::get();
$pdo->exec("SET time_zone = '+09:00'");

$pdo->exec('DROP TABLE IF EXISTS study_room_regions');
$pdo->exec('DROP TABLE IF EXISTS tutor_regions');
$pdo->exec('DROP TABLE IF EXISTS study_rooms');
$pdo->exec('DROP TABLE IF EXISTS tutors');
$pdo->exec('DROP TABLE IF EXISTS students');
$pdo->exec('DROP TABLE IF EXISTS regions');
$pdo->exec('DROP TABLE IF EXISTS users');

$pdo->exec(
    'CREATE TABLE users (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        email VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        status VARCHAR(32) NOT NULL,
        email_verified_at DATETIME NULL,
        admin_level VARCHAR(32) NULL,
        PRIMARY KEY (id),
        UNIQUE KEY uk_users_email (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4'
);
$pdo->exec(
    'CREATE TABLE regions (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        sido_name VARCHAR(50) NOT NULL,
        sigungu_name VARCHAR(50) NOT NULL,
        sigungu_code VARCHAR(20) NOT NULL,
        dong_name VARCHAR(50) NOT NULL,
        unit_level ENUM(\'sido\',\'sigungu\',\'dong\') NOT NULL,
        official_code VARCHAR(10) NULL,
        is_selectable TINYINT(1) NOT NULL DEFAULT 0,
        PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4'
);
$pdo->exec(
    'CREATE TABLE study_rooms (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        user_id BIGINT UNSIGNED NOT NULL,
        study_room_name VARCHAR(100) NOT NULL,
        profile_status VARCHAR(32) NOT NULL,
        created_at DATETIME NOT NULL,
        deleted_at DATETIME NULL,
        PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4'
);
$pdo->exec(
    'CREATE TABLE study_room_regions (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        study_room_id BIGINT UNSIGNED NOT NULL,
        slot TINYINT UNSIGNED NOT NULL,
        region_id BIGINT UNSIGNED NOT NULL,
        PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4'
);
$pdo->exec(
    'CREATE TABLE tutors (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        user_id BIGINT UNSIGNED NOT NULL,
        tutor_display_name VARCHAR(100) NOT NULL,
        profile_status VARCHAR(32) NOT NULL,
        created_at DATETIME NOT NULL,
        PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4'
);
$pdo->exec(
    'CREATE TABLE tutor_regions (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        tutor_id BIGINT UNSIGNED NOT NULL,
        region_id BIGINT UNSIGNED NOT NULL,
        priority_order SMALLINT UNSIGNED NOT NULL,
        PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4'
);
$pdo->exec(
    'CREATE TABLE students (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        guardian_user_id BIGINT UNSIGNED NOT NULL,
        public_display_name VARCHAR(100) NULL,
        preferred_lesson_type VARCHAR(32) NULL,
        preferred_studyroom_region_id BIGINT UNSIGNED NULL,
        preferred_tutor_region_id BIGINT UNSIGNED NULL,
        exposure_status VARCHAR(32) NOT NULL,
        published_at DATETIME NULL,
        deleted_at DATETIME NULL,
        PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4'
);

$tutorCols = $pdo->query("SHOW COLUMNS FROM tutors LIKE 'deleted_at'")->fetchAll();
ok('tutor-no-deleted-column', $tutorCols === []);

function userId(PDO $pdo, string $email, ?string $level, string $status = 'active'): int
{
    $pdo->prepare('INSERT INTO users (email, password_hash, status, email_verified_at, admin_level) VALUES (?,?,?,?,?)')
        ->execute([$email, 'x', $status, '2026-01-01 00:00:00', $level]);

    return (int) $pdo->lastInsertId();
}

function regionId(PDO $pdo, string $sido, string $gu, string $code, string $dong, string $level, ?string $official, int $selectable): int
{
    $pdo->prepare(
        'INSERT INTO regions (sido_name, sigungu_name, sigungu_code, dong_name, unit_level, official_code, is_selectable)
         VALUES (?,?,?,?,?,?,?)'
    )->execute([$sido, $gu, $code, $dong, $level, $official, $selectable]);

    return (int) $pdo->lastInsertId();
}

$owner = userId($pdo, 'owner159c@t159c.test', null);
$super = userId($pdo, 'super159c@t159c.test', 'super_admin');
$sub = userId($pdo, 'sub159c@t159c.test', 'sub_master');
$plain = userId($pdo, 'plain159c@t159c.test', null);

$guA = regionId($pdo, '서울특별시', '강남구', '11680', '', 'sigungu', '1168000000', 1);
$dongA = regionId($pdo, '서울특별시', '강남구', '1168010100', '역삼동', 'dong', null, 0);
$guB = regionId($pdo, '부산광역시', '해운대구', '26350', '', 'sigungu', '2635000000', 1);
ok('regions-ready', $guA > 0 && $dongA > 0 && $guB > 0 && $guA !== $guB);

$period = new ReportPeriod();
$now = $period->now();
$today = $now->format('Y-m-d');
$at = $period->dayRange($today)['start']->modify('+5 minutes');
$storedDb = $period->toStorage($at, 'db');
$storedPhp = $period->toStorage($at, 'php');
$old = $now->modify('-8 days')->setTime(12, 0, 0);
$storedOldDb = $period->toStorage($old, 'db');
$storedOldPhp = $period->toStorage($old, 'php');
$far = $now->modify('-30 days')->setTime(12, 0, 0);
$storedFarDb = $period->toStorage($far, 'db');
$farDay = $far->format('Y-m-d');

function addRoom(PDO $pdo, int $userId, string $name, string $status, string $createdAt, ?int $regionId, ?string $deletedAt = null): int
{
    $pdo->prepare('INSERT INTO study_rooms (user_id, study_room_name, profile_status, created_at, deleted_at) VALUES (?,?,?,?,?)')
        ->execute([$userId, $name, $status, $createdAt, $deletedAt]);
    $id = (int) $pdo->lastInsertId();
    if ($regionId !== null) {
        $pdo->prepare('INSERT INTO study_room_regions (study_room_id, slot, region_id) VALUES (?,?,?)')
            ->execute([$id, 1, $regionId]);
    }

    return $id;
}

function addTutor(PDO $pdo, int $userId, string $name, string $status, string $createdAt, ?int $regionId): int
{
    $pdo->prepare('INSERT INTO tutors (user_id, tutor_display_name, profile_status, created_at) VALUES (?,?,?,?)')
        ->execute([$userId, $name, $status, $createdAt]);
    $id = (int) $pdo->lastInsertId();
    if ($regionId !== null) {
        $pdo->prepare('INSERT INTO tutor_regions (tutor_id, region_id, priority_order) VALUES (?,?,0)')
            ->execute([$id, $regionId]);
    }

    return $id;
}

function addStudent(
    PDO $pdo,
    int $userId,
    string $name,
    string $status,
    ?string $publishedAt,
    string $lesson,
    ?int $roomRegion,
    ?int $tutorRegion,
    ?string $deletedAt = null,
): int {
    $pdo->prepare(
        'INSERT INTO students (
            guardian_user_id, public_display_name, exposure_status, published_at, preferred_lesson_type,
            preferred_studyroom_region_id, preferred_tutor_region_id, deleted_at
         ) VALUES (?,?,?,?,?,?,?,?)'
    )->execute([$userId, $name, $status, $publishedAt, $lesson, $roomRegion, $tutorRegion, $deletedAt]);

    return (int) $pdo->lastInsertId();
}

addRoom($pdo, $owner, '숨김공부방', 'hidden', $storedDb, $dongA);
addRoom($pdo, $owner, '게시공부방', 'published', $storedDb, $dongA);
addRoom($pdo, $owner, '작성공부방', 'draft', $storedDb, $dongA);
addRoom($pdo, $owner, '검토공부방', 'pending', $storedDb, $dongA);
addRoom($pdo, $owner, '삭제공부방', 'published', $storedDb, $dongA, $storedDb);
addRoom($pdo, $owner, '미완성공부방', 'draft', $storedDb, null);
addRoom($pdo, $owner, '옛공부방', 'published', $storedOldDb, $dongA);
addRoom($pdo, $owner, '먼공부방', 'published', $storedFarDb, $dongA);
$dropTutor = addTutor($pdo, $owner, '지울과외', 'published', $storedDb, $dongA);
addTutor($pdo, $owner, '숨김과외', 'hidden', $storedDb, $dongA);
addTutor($pdo, $owner, '지역없는과외', 'published', $storedDb, null);
addStudent($pdo, $owner, '숨김학생', 'hidden', $storedPhp, 'tutor', null, $dongA);
addStudent($pdo, $owner, '게시학생', 'published', $storedPhp, 'study_room', $dongA, null);
addStudent($pdo, $owner, '작성학생', 'draft', $storedPhp, 'tutor', null, $dongA);
addStudent($pdo, $owner, '미완성학생', 'draft', null, 'tutor', null, $dongA);
addStudent($pdo, $owner, '삭제학생', 'published', $storedPhp, 'tutor', null, $dongA, $storedPhp);
addStudent($pdo, $owner, '엇갈린학생', 'published', $storedPhp, 'tutor', $dongA, null);
addStudent($pdo, $owner, '옛학생', 'published', $storedOldPhp, 'tutor', null, $dongA);

$query = new BasicCardRegisteredQuery($pdo, $period);
$repo = new AdminRegistrationListRepository($query, $period);
$start = $period->dayRange($now->modify('-6 days')->format('Y-m-d'))['start'];
$end = $period->dayRange($today)['end'];

$trueCounts = $query->countByRole($start, $end, true);
$falseCounts = $query->countByRole($start, $end, false);
$adminCounts = $query->countByRoleForAdmin($start, $end, false, null);
ok('contract-true-has-deleted', $trueCounts['study_room'] === $falseCounts['study_room'] + 1, json_encode($trueCounts) . ' / ' . json_encode($falseCounts));
ok('contract-admin-matches-false', $adminCounts === $falseCounts, json_encode($adminCounts));
$trueList = $query->listByRole('study_room', $start, $end, true, 1, 50);
$falseList = $query->listByRole('study_room', $start, $end, false, 1, 50);
ok('contract-list-true', $trueList['total'] === $trueCounts['study_room'] && isset($trueList['items'][0]['display_name']));
ok('contract-list-false', $falseList['total'] === $falseCounts['study_room']);

$rooms = $repo->page('study_room', null, null, null, 1, 50);
$roomNames = array_column($rooms['items'], 'name');
ok('default-from', $rooms['from'] === $now->modify('-6 days')->format('Y-m-d'), $rooms['from']);
ok('default-to', $rooms['to'] === $today, $rooms['to']);
ok('today-005-included', in_array('숨김공부방', $roomNames, true));
ok('eight-days-out', !in_array('옛공부방', $roomNames, true));
ok('far-out', !in_array('먼공부방', $roomNames, true));
ok('deleted-room-out', !in_array('삭제공부방', $roomNames, true));
ok('draft-without-region-out', !in_array('미완성공부방', $roomNames, true));
ok('hidden-room-in', in_array('숨김공부방', $roomNames, true));
$statusByName = [];
foreach ($rooms['items'] as $item) {
    $statusByName[$item['name']] = $item['status'];
}
ok('status-hidden', ($statusByName['숨김공부방'] ?? '') === '숨김');
ok('status-published', ($statusByName['게시공부방'] ?? '') === '게시중');
ok('status-draft', ($statusByName['작성공부방'] ?? '') === '작성중');
ok('status-pending', ($statusByName['검토공부방'] ?? '') === '검토중');
ok('item-keys', $rooms['items'] !== [] && array_keys($rooms['items'][0]) === ['name', 'region', 'registered_at', 'status']);
ok('item-date', isset($rooms['items'][0]['registered_at']) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $rooms['items'][0]['registered_at']) === 1, (string) ($rooms['items'][0]['registered_at'] ?? ''));
ok('item-date-today', ($statusByName['숨김공부방'] ?? '') === '숨김' && in_array($today, array_column($rooms['items'], 'registered_at'), true));

$byGuA = $repo->page('study_room', null, null, $guA, 1, 50);
$byGuB = $repo->page('study_room', null, null, $guB, 1, 50);
$byDong = $repo->page('study_room', null, null, $dongA, 1, 50);
ok('region-match', count($byGuA['items']) >= 1 && in_array('숨김공부방', array_column($byGuA['items'], 'name'), true));
ok('region-other-zero', $byGuB['total'] === 0, (string) $byGuB['total']);
ok('region-exact-dong', in_array('게시공부방', array_column($byDong['items'], 'name'), true));
ok('region-label', str_contains((string) ($byGuA['items'][0]['region'] ?? ''), '강남구'), (string) ($byGuA['items'][0]['region'] ?? ''));

$tutors = $repo->page('tutor', null, null, null, 1, 50);
$tutorNames = array_column($tutors['items'], 'name');
ok('tutor-hidden-in', in_array('숨김과외', $tutorNames, true) && (array_column($tutors['items'], 'status', 'name')['숨김과외'] ?? '') === '숨김');
ok('tutor-without-region-out', !in_array('지역없는과외', $tutorNames, true));
ok('tutor-delete-before', in_array('지울과외', $tutorNames, true));
$pdo->prepare('DELETE FROM tutors WHERE id = ?')->execute([$dropTutor]);
$tutorsAfter = $repo->page('tutor', null, null, null, 1, 50);
ok('tutor-delete-after', !in_array('지울과외', array_column($tutorsAfter['items'], 'name'), true));
$tutorGuB = $repo->page('tutor', null, null, $guB, 1, 50);
ok('tutor-other-region-zero', $tutorGuB['total'] === 0);

$students = $repo->page('student', null, null, null, 1, 50);
$studentNames = array_column($students['items'], 'name');
ok('student-hidden-in', in_array('숨김학생', $studentNames, true));
ok('student-null-published-out', !in_array('미완성학생', $studentNames, true));
ok('student-deleted-out', !in_array('삭제학생', $studentNames, true));
ok('student-eight-days-out', !in_array('옛학생', $studentNames, true));
$studentStatus = array_column($students['items'], 'status', 'name');
ok('student-hidden-label', ($studentStatus['숨김학생'] ?? '') === '숨김');
ok('student-published-label', ($studentStatus['게시학생'] ?? '') === '게시중');
ok('student-draft-label', ($studentStatus['작성학생'] ?? '') === '작성중');
$studentGuA = $repo->page('student', null, null, $guA, 1, 50);
$studentGuANames = array_column($studentGuA['items'], 'name');
ok('student-region-match', in_array('숨김학생', $studentGuANames, true) && in_array('게시학생', $studentGuANames, true));
ok('student-wrong-column-out', !in_array('엇갈린학생', $studentGuANames, true));
$studentGuB = $repo->page('student', null, null, $guB, 1, 50);
ok('student-other-region-zero', $studentGuB['total'] === 0);

$narrow = $repo->page('study_room', $farDay, $farDay, null, 1, 50);
$narrowNames = array_column($narrow['items'], 'name');
ok('narrow-has-far', $narrowNames === ['먼공부방'], implode(',', $narrowNames));
ok('narrow-today-out', !in_array('숨김공부방', $narrowNames, true));

$hiddenRoles = 0;
foreach (['study_room' => '숨김공부방', 'tutor' => '숨김과외', 'student' => '숨김학생'] as $role => $name) {
    $page = $repo->page($role, null, null, null, 1, 50);
    $hit = false;
    foreach ($page['items'] as $item) {
        if ($item['name'] === $name && $item['status'] === '숨김') {
            $hit = true;
        }
    }
    if ($hit) {
        $hiddenRoles++;
    }
}
ok('hidden-three-roles', $hiddenRoles === 3, (string) $hiddenRoles);

function startApi(): void
{
    stopApi();
    $sessionDir = '/tmp/study114-159c-sessions';
    $env = [
        'PATH' => (string) getenv('PATH'),
        'HOME' => (string) (getenv('HOME') ?: '/tmp'),
        'STUDY114_DB_HOST' => '127.0.0.1',
        'STUDY114_DB_PORT' => '3306',
        'STUDY114_DB_NAME' => 'study114_dev',
        'STUDY114_DB_USER' => 'study114',
        'STUDY114_DB_PASS' => 'study114dev',
        'STUDY114_APP_ENV' => 'local',
    ];
    $spec = [
        0 => ['file', '/dev/null', 'r'],
        1 => ['file', '/tmp/study114-159c-php-s.log', 'a'],
        2 => ['file', '/tmp/study114-159c-php-s.err', 'a'],
    ];
    $cmd = 'php -d session.save_path=' . escapeshellarg($sessionDir) . ' -S 127.0.0.1:8092 -t public';
    $proc = proc_open($cmd, $spec, $pipes, dirname(__DIR__), $env);
    $GLOBALS['api_proc'] = $proc;
    $ready = false;
    for ($i = 0; $i < 40; $i++) {
        $socket = @fsockopen('127.0.0.1', 8092, $errno, $err, 0.2);
        if (is_resource($socket)) {
            fclose($socket);
            $ready = true;
            break;
        }
        usleep(100000);
    }
    ok('php-s-ready', $ready);
}

function stopApi(): void
{
    if (isset($GLOBALS['api_proc']) && is_resource($GLOBALS['api_proc'])) {
        proc_terminate($GLOBALS['api_proc']);
        proc_close($GLOBALS['api_proc']);
        unset($GLOBALS['api_proc']);
    }
    exec("pkill -f 'php -S 127.0.0.1:8092' >/dev/null 2>&1");
}

function httpCall(string $method, string $url, array $headers = []): array
{
    $ctx = stream_context_create([
        'http' => [
            'method' => $method,
            'header' => implode("\r\n", $headers),
            'ignore_errors' => true,
            'timeout' => 20,
        ],
    ]);
    $body = @file_get_contents($url, false, $ctx);
    $status = 0;
    foreach ($http_response_header ?? [] as $line) {
        if (preg_match('#^HTTP/\S+\s+(\d+)#', $line, $m) === 1) {
            $status = (int) $m[1];
        }
    }
    $json = json_decode(is_string($body) ? $body : '', true);

    return ['status' => $status, 'body' => is_string($body) ? $body : '', 'json' => is_array($json) ? $json : []];
}

function loginCookie(int $id, string $email, string $role, ?string $level): string
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        session_write_close();
    }
    session_id(bin2hex(random_bytes(16)));
    $extra = $level !== null ? ['admin_level' => $level] : [];
    AuthSession::login($id, $email, $role, '시험', $extra);
    $sid = session_id();
    session_write_close();

    return 'Cookie: PHPSESSID=' . $sid;
}

$base = 'http://127.0.0.1:8092/api/admin/registrations.php';
startApi();
$superCookie = loginCookie($super, 'super159c@t159c.test', 'admin', 'super_admin');
$subCookie = loginCookie($sub, 'sub159c@t159c.test', 'admin', 'sub_master');
$plainCookie = loginCookie($plain, 'plain159c@t159c.test', 'guardian_student', null);

$anon = httpCall('GET', $base);
ok('anon-not-200', $anon['status'] === 401 || $anon['status'] === 403, (string) $anon['status']);
$plainRes = httpCall('GET', $base, [$plainCookie]);
ok('plain-403', $plainRes['status'] === 403, $plainRes['status'] . ' ' . $plainRes['body']);
$superRes = httpCall('GET', $base, [$superCookie]);
ok('super-200', $superRes['status'] === 200 && ($superRes['json']['ok'] ?? false) === true, $superRes['body']);
$subRes = httpCall('GET', $base, [$subCookie]);
ok('sub-200', $subRes['status'] === 200 && ($subRes['json']['total'] ?? null) === ($superRes['json']['total'] ?? null), $subRes['body']);
$again = httpCall('GET', $base, [$superCookie]);
ok('refresh-same-total', ($again['json']['total'] ?? null) === ($superRes['json']['total'] ?? null) && $again['body'] === $superRes['body'], (string) ($again['json']['total'] ?? ''));
ok('refresh-count', (int) ($superRes['json']['total'] ?? -1) === (int) $rooms['total']);
echo 'REFRESH url=' . $base . ' first=' . (int) ($superRes['json']['total'] ?? -1) . ' second=' . (int) ($again['json']['total'] ?? -1) . "\n";
foreach (['POST', 'PATCH', 'DELETE'] as $method) {
    $res = httpCall($method, $base, [$superCookie]);
    ok('method-' . $method . '-405', $res['status'] === 405, (string) $res['status'] . ' ' . $res['body']);
}
$apiItem = $superRes['json']['items'][0] ?? null;
ok('api-item-keys', is_array($apiItem) && array_keys($apiItem) === ['name', 'region', 'registered_at', 'status'], json_encode($apiItem, JSON_UNESCAPED_UNICODE));
$filtered = httpCall('GET', $base . '?role=study_room&region=' . $guB, [$superCookie]);
ok('api-other-region-zero', $filtered['status'] === 200 && ($filtered['json']['total'] ?? null) === 0, $filtered['body']);
$matched = httpCall('GET', $base . '?role=tutor&region=' . $guA, [$superCookie]);
ok('api-tutor-region', $matched['status'] === 200 && (int) ($matched['json']['total'] ?? 0) >= 1, $matched['body']);
ok('api-tutor-word-source', str_contains((string) file_get_contents(dirname(__DIR__) . '/preview/home-ui/src/admin/a28-registration-list-copy.js'), '과외지역'));

stopApi();

echo "\n" . ($fail === 0 ? 'OK' : 'FAIL') . "  pass={$pass} fail={$fail}\n";
exit($fail === 0 ? 0 : 1);
