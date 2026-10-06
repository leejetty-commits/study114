/**
 * 숨김 후속 + 문의 관리 (076) — 가짜 PDO · 소스 · 렌더 검사
 * 실행: npx vite-node scripts/verify-hide-inquiry-bundle.mjs
 */
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

function memStore() {
  const mem = new Map();
  return {
    getItem: (k) => (mem.has(String(k)) ? mem.get(String(k)) : null),
    setItem: (k, v) => { mem.set(String(k), String(v)); },
    removeItem: (k) => { mem.delete(String(k)); },
    clear: () => { mem.clear(); },
    key: (i) => [...mem.keys()][i] ?? null,
    get length() { return mem.size; },
  };
}
if (typeof globalThis.localStorage === 'undefined') globalThis.localStorage = memStore();
if (typeof globalThis.sessionStorage === 'undefined') globalThis.sessionStorage = memStore();
if (typeof globalThis.window === 'undefined') globalThis.window = globalThis;
if (typeof globalThis.document === 'undefined') {
  globalThis.document = { querySelector: () => null, querySelectorAll: () => [], getElementById: () => null };
}

const { ADMIN_HIDE_OWNER_LINE, renderAdminHideOwnerLine } = await import('../preview/home-ui/src/lifecycle-copy.js');
const { getHubCtas } = await import('../preview/home-ui/src/tutor-reg/format.js');
const { buildTutorRegistrationCheckModel } = await import('../preview/home-ui/src/tutor-reg/registration-check-model.js');
const { renderTutorRegistrationCheck } = await import('../preview/home-ui/src/tutor-reg/registration-check-render.js');
const { studyRoomRegionPurchaseState } = await import('../preview/home-ui/src/plans/order-blocks.js');
const { renderProviderNoticeBanners, hydrateProviderNotices } = await import('../preview/home-ui/src/provider-notices.js');

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const LINE = '이 카드는 지금 홈·찾기에서 숨김 처리되었습니다. 궁금한 점은 고객센터 운영문의로 남겨 주세요.';
let passed = 0;
let failed = 0;

function assert(name, cond, detail = '') {
  if (cond) {
    passed += 1;
    console.log(`ok  ${name}`);
  } else {
    failed += 1;
    console.error(`FAIL ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

function read(rel) {
  return readFileSync(join(ROOT, rel), 'utf8');
}

function fnBody(src, name) {
  const start = src.indexOf(`function ${name}`);
  if (start < 0) return '';
  const exportStart = src.indexOf(`export function ${name}`);
  const at = exportStart >= 0 ? exportStart : start;
  let i = src.indexOf('{', at);
  let depth = 0;
  for (; i < src.length; i += 1) {
    if (src[i] === '{') depth += 1;
    else if (src[i] === '}') {
      depth -= 1;
      if (depth === 0) return src.slice(at, i + 1);
    }
  }
  return '';
}

const php = String.raw`<?php
declare(strict_types=1);
require_once getcwd() . '/src/bootstrap.php';

use Study114\Admin\AdminExposureService;
use Study114\Admin\AdminMemberService;
use Study114\Database\Connection;
use Study114\Registration\StudyRoomHubService;
use Study114\Registration\TutorHubService;
use Study114\StudyRoom\StudyRoomRegisterService;
use Study114\Support\SupportTicketRepository;
use Study114\Support\SupportTicketService;
use Study114\Tutor\TutorRegisterService;

final class BStmt {
    public function __construct(private BPdo $pdo, private string $sql) {}
    private array $rows = [];
    private mixed $column = false;
    private int $cursor = 0;
    public function execute(?array $params = null): bool {
        $sql = preg_replace('/\s+/', ' ', trim($this->sql));
        $p = array_values($params ?? []);
        $this->pdo->log[] = [$sql, $p];
        $a = $this->pdo->answer($sql, $p);
        $this->rows = $a['rows'] ?? [];
        $this->column = array_key_exists('column', $a) ? $a['column'] : false;
        $this->cursor = 0;
        return true;
    }
    public function fetch(mixed ...$a): mixed { return $this->rows[$this->cursor++] ?? false; }
    public function fetchColumn(mixed ...$a): mixed { return $this->column; }
    public function fetchAll(mixed ...$a): array { return $this->rows; }
    public function bindValue(mixed $k, mixed $v, int $t = 2): bool { return true; }
    public function rowCount(): int { return 1; }
}
final class BPdo extends PDO {
    public array $log = [];
    public string $roomStatus = 'published';
    public string $tutorStatus = 'published';
    public bool $roomSlot = true;
    public bool $tutorSlot = true;
    public bool $throwNotice = false;
    public bool $dropTxOnNotice = false;
    public bool $hasUserId = true;
    public bool $inTx = false;
    public array $room = ['study_room_name' => '완성방', 'lesson_place_type' => 'study_room', 'main_subject_note' => '수학', 'slogan' => '슬로건', 'address_text' => '주소'];
    public array $tutor = ['tutor_display_name' => '쌤', 'main_subject_note' => '수학'];
    public ?array $lastLog = null;
    public int $noticeInserts = 0;
    public string $studentStatus = 'published';
    public function __construct() {}
    public function prepare(string $q, array $o = []): BStmt { return new BStmt($this, $q); }
    public function query(string $query, ?int $fetchMode = null, mixed ...$fetchModeArgs): BStmt|false {
        $stmt = new BStmt($this, $query);
        $stmt->execute([]);
        return $stmt;
    }
    public function beginTransaction(): bool { $this->inTx = true; return true; }
    public function commit(): bool { $this->inTx = false; return true; }
    public function rollBack(): bool { $this->inTx = false; return true; }
    public function inTransaction(): bool { return $this->inTx; }
    public function lastInsertId(?string $name = null): string { return '1'; }
    public function answer(string $sql, array $p): array {
        if (str_contains($sql, 'SHOW COLUMNS') && str_contains($sql, 'user_id')) {
            return $this->hasUserId ? ['rows' => [['Field' => 'user_id']]] : ['rows' => []];
        }
        if (str_contains($sql, 'SHOW COLUMNS') && str_contains($sql, 'admin_reply_text')) {
            return ['rows' => [['Field' => 'admin_reply_text']]];
        }
        if (str_contains($sql, 'SELECT profile_status FROM study_rooms')) {
            return ['column' => $this->roomStatus];
        }
        if (str_contains($sql, 'SELECT profile_status FROM tutors')) {
            return ['column' => $this->tutorStatus];
        }
        if (str_contains($sql, 'facility_note')) {
            $this->roomStatus = (string) ($p[4] ?? $this->roomStatus);
            return [];
        }
        if (str_contains($sql, 'UPDATE tutors SET contact_time_note')) {
            $this->tutorStatus = (string) ($p[4] ?? $this->tutorStatus);
            return [];
        }
        if (str_contains($sql, 'UPDATE study_rooms SET profile_status')) {
            $this->roomStatus = (string) ($p[0] ?? '');
            return [];
        }
        if (str_contains($sql, 'UPDATE tutors SET profile_status')) {
            $this->tutorStatus = (string) ($p[0] ?? '');
            return [];
        }
        if (str_contains($sql, 'SELECT email_verified_at FROM users')) {
            return ['rows' => [['email_verified_at' => '2026-01-01']], 'column' => '2026-01-01'];
        }
        if (str_contains($sql, 'SELECT user_id FROM study_rooms') || str_contains($sql, 'SELECT user_id FROM tutors')) {
            return ['column' => 9];
        }
        if (str_contains($sql, 'FROM study_rooms WHERE id') && str_contains($sql, 'study_room_name, profile_status')) {
            return ['rows' => [[
                'id' => 8, 'study_room_name' => '방', 'profile_status' => $this->roomStatus,
                'inquiry_status' => 'open', 'published_at' => null, 'updated_at' => '2026-10-07 00:00:00',
            ]]];
        }
        if (str_contains($sql, 'FROM tutors WHERE id') && str_contains($sql, 'tutor_display_name, profile_status')) {
            return ['rows' => [[
                'id' => 5, 'tutor_display_name' => '쌤', 'profile_status' => $this->tutorStatus,
                'published_at' => null, 'updated_at' => '2026-10-07 00:00:00',
            ]]];
        }
        if (str_contains($sql, 'SELECT study_room_name, lesson_place_type')) {
            return ['rows' => [$this->room]];
        }
        if (str_contains($sql, 'SELECT tutor_display_name, main_subject_note')) {
            return ['rows' => [$this->tutor]];
        }
        if (str_contains($sql, 'FROM study_room_regions')) {
            return ['column' => $this->roomSlot ? 1 : false];
        }
        if (str_contains($sql, 'FROM tutor_regions')) {
            return ['column' => $this->tutorSlot ? 1 : false];
        }
        if (str_contains($sql, 'INSERT INTO provider_system_notices')) {
            if ($this->throwNotice) {
                if ($this->dropTxOnNotice) $this->inTx = false;
                throw new RuntimeException('notice failed');
            }
            $this->noticeInserts++;
            return [];
        }
        if (str_contains($sql, 'INSERT INTO admin_operation_logs')) {
            $this->lastLog = [
                'log_key' => $p[0], 'operator_id' => $p[1], 'target_type' => $p[2], 'target_id' => $p[3],
                'action_kind' => $p[4], 'reason_category' => $p[5], 'detail_memo' => $p[6],
                'reversible' => $p[7], 'user_notified' => $p[8], 'acted_at' => '2026-10-07 00:00:00',
            ];
            return [];
        }
        if (str_contains($sql, 'FROM admin_operation_logs')) {
            return ['rows' => $this->lastLog ? [$this->lastLog] : []];
        }
        if (str_contains($sql, 'FROM students')) {
            return ['rows' => [[
                'id' => 1, 'guardian_user_id' => 6, 'public_display_name' => '학생', 'student_name' => '학생',
                'exposure_status' => $this->studentStatus, 'updated_at' => '2026-10-07', 'region_label' => '',
            ]]];
        }
        if (str_contains($sql, 'UPDATE students SET exposure_status')) {
            $this->studentStatus = (string) ($p[0] ?? '');
            return [];
        }
        if (str_contains($sql, 'FROM board_posts')) {
            return ['rows' => [[
                'post_key' => 'sub-1', 'author_role' => 'tutor', 'status' => 'published', 'title' => '자료',
                'internal_memo' => '', 'updated_at' => '2026-10-07',
            ]]];
        }
        if (str_contains($sql, 'UPDATE board_posts')) return [];
        if (str_contains($sql, 'SELECT email FROM users')) {
            return ['column' => 'owner@study114.test'];
        }
        if (str_contains($sql, 'FROM users u')) {
            return ['rows' => [[
                'id' => 4, 'email' => 'member@study114.test', 'status' => 'active', 'admin_level' => null,
                'email_verified_at' => '2026-01-01', 'oauth_role_pending' => 0, 'last_login_at' => null,
                'created_at' => '2026-01-01', 'updated_at' => '2026-01-01', 'deleted_at' => null,
                'real_name' => '회원', 'phone' => '', 'gender' => null, 'birth_date' => null,
                'address_line1' => '', 'sms_opt_in' => 0, 'email_opt_in' => 0,
            ]]];
        }
        if (str_contains($sql, 'UPDATE users SET status')) return [];
        if (str_contains($sql, 'INSERT INTO support_tickets')) return [];
        if (str_contains($sql, 'SELECT ticket_no')) {
            return ['column' => false, 'rows' => []];
        }
        if (str_contains($sql, 'FROM support_tickets') && str_contains($sql, 'ticket_no =')) {
            return ['rows' => [[
                'id' => 1, 'ticket_no' => 'TKT-1', 'email' => 'owner@study114.test', 'user_id' => 9,
                'category' => 'unhide_request', 'role_type' => 'study_room', 'body' => '본문',
                'status' => 'open', 'created_at' => '2026-10-07 00:00:00', 'updated_at' => '2026-10-07 00:00:00',
                'admin_reply_text' => null, 'admin_replied_at' => null,
            ]]];
        }
        if (str_contains($sql, 'COUNT(*) FROM support_tickets')) {
            return ['column' => 41];
        }
        if (str_contains($sql, 'FROM support_tickets')) {
            return ['rows' => []];
        }
        return ['rows' => []];
    }
}
function inject(BPdo $pdo): void {
    (new ReflectionProperty(Connection::class, 'pdo'))->setValue(null, $pdo);
}
function updates(BPdo $pdo, string $needle): int {
    $n = 0;
    foreach ($pdo->log as [$sql]) {
        if (str_contains($sql, $needle)) $n++;
    }
    return $n;
}
function ok(string $name, bool $cond, string $detail = ''): void {
    echo ($cond ? 'ok  ' : 'FAIL ') . $name . ($cond || $detail === '' ? '' : ' — ' . $detail) . PHP_EOL;
}

$pdo = new BPdo();
inject($pdo);
$roomSvc = new StudyRoomRegisterService();
$saveFacility = new ReflectionMethod($roomSvc, 'saveFacility');
$saveFacility->setAccessible(true);
$pdo->roomStatus = 'hidden';
$pdo->log = [];
$saveFacility->invoke($roomSvc, $pdo, 8, ['profile_status' => 'published']);
ok('(a) hidden+published 요청은 hidden', $pdo->roomStatus === 'hidden', $pdo->roomStatus);
$pdo->roomStatus = 'published';
$pdo->log = [];
$saveFacility->invoke($roomSvc, $pdo, 8, ['facility_note' => '메모']);
ok('(a) 요청 없음+published 유지', $pdo->roomStatus === 'published', $pdo->roomStatus);
$pdo->roomStatus = 'published';
$saveFacility->invoke($roomSvc, $pdo, 8, ['profile_status' => 'draft']);
ok('(a) 요청 draft+published 는 draft', $pdo->roomStatus === 'draft', $pdo->roomStatus);

$tutorSvc = new TutorRegisterService();
$saveContact = new ReflectionMethod($tutorSvc, 'saveContact');
$saveContact->setAccessible(true);
$pdo->tutorStatus = 'hidden';
$saveContact->invoke($tutorSvc, $pdo, 5, ['profile_status' => 'published']);
ok('(b) 과외 hidden+published 요청은 hidden', $pdo->tutorStatus === 'hidden', $pdo->tutorStatus);

$hub = new StudyRoomHubService();
$publish = new ReflectionMethod($hub, 'publish');
$publish->setAccessible(true);
$before = updates($pdo, 'UPDATE study_rooms SET profile_status');
$denied = $publish->invoke($hub, 4, 8, ['profile_status' => 'hidden']);
ok('(c) 공부방 publish hidden은 not_allowed', ($denied['reason'] ?? '') === 'not_allowed' && updates($pdo, 'UPDATE study_rooms SET profile_status') === $before);

$thub = new TutorHubService();
$tpublish = new ReflectionMethod($thub, 'publish');
$tpublish->setAccessible(true);
$beforeT = updates($pdo, 'UPDATE tutors SET profile_status');
$tdenied = $tpublish->invoke($thub, 4, 5, ['profile_status' => 'hidden']);
ok('(c) 과외 publish hidden은 not_allowed', ($tdenied['reason'] ?? '') === 'not_allowed' && updates($pdo, 'UPDATE tutors SET profile_status') === $beforeT);

$admin = new AdminExposureService();
$pdo->roomStatus = 'published';
$pdo->noticeInserts = 0;
$pdo->log = [];
$hide = $admin->applyCorrection(['target_type' => 'study_room', 'target_id' => '8', 'action' => 'hide'], 'ops@dev.local');
$noticeSql = '';
foreach ($pdo->log as [$sql, $params]) {
    if (str_contains($sql, 'INSERT INTO provider_system_notices')) $noticeSql = json_encode($params, JSON_UNESCAPED_UNICODE);
}
ok('(d) 공부방 hide 알림 1', $pdo->noticeInserts === 1 && str_contains($noticeSql, 'admin_hide') && str_contains($noticeSql, $hide['log']['id']) && str_contains($noticeSql, '홈·찾기 숨김') && str_contains($noticeSql, '이 카드는 지금 홈·찾기에서 숨김 처리되었습니다'));
ok('(d) 공부방 hide user_notified 1', ($hide['log']['userNotified'] ?? false) === true && $pdo->roomStatus === 'hidden');

$pdo->throwNotice = true;
$pdo->roomStatus = 'published';
$pdo->noticeInserts = 0;
$broke = $admin->applyCorrection(['target_type' => 'study_room', 'target_id' => '8', 'action' => 'hide'], 'ops@dev.local');
ok('(d) 알림 예외여도 숨김·user_notified 0', $pdo->roomStatus === 'hidden' && ($broke['log']['userNotified'] ?? true) === false);
$pdo->throwNotice = false;

$pdo->noticeInserts = 0;
$again = $admin->applyCorrection(['target_type' => 'study_room', 'target_id' => '8', 'action' => 'hide'], 'ops@dev.local');
ok('(d) 이미 hidden이면 알림 0', $pdo->noticeInserts === 0 && ($again['log']['userNotified'] ?? true) === false);

$pdo->tutorStatus = 'published';
$pdo->noticeInserts = 0;
$tutorHide = $admin->applyCorrection(['target_type' => 'tutor', 'target_id' => '5', 'action' => 'hide'], 'ops@dev.local');
ok('(d) 과외 hide 알림 1 · user_notified 1', $pdo->noticeInserts === 1 && ($tutorHide['log']['userNotified'] ?? false) === true);

$pdo->noticeInserts = 0;
$student = $admin->applyCorrection(['target_type' => 'student', 'target_id' => '1', 'action' => 'hide'], 'ops@dev.local');
ok('(e) 학생 hide user_notified 0 · 알림 0', ($student['log']['userNotified'] ?? true) === false && $pdo->noticeInserts === 0);

$sub = $admin->applyCorrection(['target_type' => 'submission', 'target_id' => 'sub-1', 'action' => 'hide'], 'ops@dev.local');
ok('(e) 제출자료 hide user_notified 0 · 알림 0', ($sub['log']['userNotified'] ?? true) === false && $pdo->noticeInserts === 0);

$member = new AdminMemberService();
$blockedNotified = null;
try {
    $member->applyAction(['email' => 'ops@dev.local', 'role_type' => 'admin'], ['user_id' => 4, 'action' => 'block']);
} catch (Throwable $e) {
}
foreach ($pdo->log as [$sql, $params]) {
    if (str_contains($sql, 'INSERT INTO admin_operation_logs') && ($params[4] ?? '') === 'account_block') {
        $blockedNotified = (int) $params[8];
    }
}
ok('(e) 이용제한 user_notified 0 · 알림 0', $blockedNotified === 0 && $pdo->noticeInserts === 0);

$pdo->roomStatus = 'hidden';
$pdo->roomSlot = false;
$pdo->noticeInserts = 0;
$drafted = $admin->applyCorrection(['target_type' => 'study_room', 'target_id' => '8', 'action' => 'publish'], 'ops@dev.local');
ok('(f) 대표지역1 없으면 draft+missing · 알림 0', $pdo->roomStatus === 'draft' && in_array('대표지역1', $drafted['missing'] ?? [], true) && $pdo->noticeInserts === 0 && ($drafted['log']['userNotified'] ?? true) === false);

$pdo->roomStatus = 'hidden';
$pdo->roomSlot = true;
$published = $admin->applyCorrection(['target_type' => 'study_room', 'target_id' => '8', 'action' => 'publish'], 'ops@dev.local');
ok('(f) 공부방 필수칸이 있으면 published · 알림 0', $pdo->roomStatus === 'published' && !isset($published['missing']) && $pdo->noticeInserts === 0);

$pdo->tutorStatus = 'hidden';
$pdo->tutorSlot = false;
$tutorDraft = $admin->applyCorrection(['target_type' => 'tutor', 'target_id' => '5', 'action' => 'publish'], 'ops@dev.local');
ok('(f) 과외지역1 없으면 draft+missing', $pdo->tutorStatus === 'draft' && in_array('과외지역1', $tutorDraft['missing'] ?? [], true));
$pdo->tutorStatus = 'hidden';
$pdo->tutorSlot = true;
$admin->applyCorrection(['target_type' => 'tutor', 'target_id' => '5', 'action' => 'publish'], 'ops@dev.local');
ok('(f) 과외 필수칸이 있으면 published', $pdo->tutorStatus === 'published');

$repo = new SupportTicketRepository($pdo);
$svc = new SupportTicketService($repo);
$made = $svc->create(
    ['user_id' => 9, 'email' => 'other@example.com', 'role_type' => 'study_room_owner'],
    ['email' => 'evil@example.com', 'role' => 'guest', 'category' => 'unhide_request', 'body' => '풀어 주세요'],
);
$insert = null;
foreach ($pdo->log as [$sql, $params]) {
    if (str_contains($sql, 'INSERT INTO support_tickets')) $insert = $params;
}
ok('(h) 저장 email은 계정 이메일 · user_id는 세션 · unhide_request', is_array($insert) && ($insert[1] ?? '') === 'owner@study114.test' && (int) ($insert[2] ?? 0) === 9 && ($insert[3] ?? '') === 'unhide_request' && ($made['category'] ?? '') === 'unhide_request');

$pdo->log = [];
$repo->listAdmin('open', '', 1, 20);
$openSql = '';
foreach ($pdo->log as [$sql]) {
    if (str_contains($sql, 'COUNT(*)') || str_contains($sql, 'LIMIT 20')) $openSql .= $sql . "\n";
}
ok('(i) group=open 은 open·in_progress 만', str_contains($openSql, "status IN ('open', 'in_progress')") && !str_contains($openSql, "status = 'closed'"));
ok('(i) LIMIT 20 OFFSET 0', str_contains($openSql, 'LIMIT 20 OFFSET 0'));

$pdo->log = [];
$repo->listAdmin('closed', '', 1, 20);
$closedSql = $pdo->log[0][0] ?? '';
ok('(i) group=closed 는 closed 만', str_contains($closedSql, "status = 'closed'") && !str_contains($closedSql, 'in_progress'));

$pdo->log = [];
$repo->listAdmin('open', '15', 2, 20);
$pageSql = '';
$pageParams = [];
foreach ($pdo->log as [$sql, $params]) {
    if (str_contains($sql, 'LIMIT 20')) { $pageSql = $sql; $pageParams = $params; }
}
ok('(i) 2쪽 OFFSET 20 · 숫자 q는 user_id', str_contains($pageSql, 'LIMIT 20 OFFSET 20') && str_contains($pageSql, 'user_id = ?') && in_array(15, $pageParams, true));

$pdo->log = [];
$repo->listAdmin('all', 'a%_b', 1, 20);
$likeParams = [];
foreach ($pdo->log as [$sql, $params]) {
    if (str_contains($sql, 'LIKE')) $likeParams = $params;
}
ok('(i) % · _ 이스케이프', str_contains((string) ($likeParams[0] ?? ''), 'a\\%\\_b'));
$admin = $svc->listAdmin('open', '', 1);
ok('(i) total · page · per_page', ($admin['total'] ?? 0) === 41 && ($admin['per_page'] ?? 0) === 20 && ($admin['page'] ?? 0) === 1 && array_key_exists('tickets', $admin));
`;

const phpRun = spawnSync('php', ['-r', php.replace(/^<\?php\s*/, '')], { cwd: ROOT, encoding: 'utf8' });
const phpOut = `${phpRun.stdout || ''}\n${phpRun.stderr || ''}`;
if (phpRun.status !== 0 && !phpOut.includes('ok')) {
  console.error(phpOut);
}
for (const line of phpOut.split('\n')) {
  if (line.startsWith('ok  ')) {
    passed += 1;
    console.log(line);
  } else if (line.startsWith('FAIL ')) {
    failed += 1;
    console.error(line);
  } else if (line.trim() && !line.startsWith('ok') && phpRun.status !== 0) {
    if (!line.includes('Deprecated') && !line.includes('Warning')) console.error(line);
  }
}

const ticketsPhp = read('public/api/support/tickets.php');
const postAt = ticketsPhp.indexOf("if ($method === 'POST')");
const postBody = ticketsPhp.slice(postAt, ticketsPhp.indexOf("if ($method === 'PATCH')"));
assert('(h) 비로그인 POST는 requireUser가 먼저', postBody.indexOf('requireUser()') >= 0 && postBody.indexOf('requireUser()') < postBody.indexOf('->create('));
const getBare = ticketsPhp.slice(ticketsPhp.indexOf("if ($method === 'GET')"), postAt);
assert('(j) 파라미터 없는 GET은 list(null) 티켓 배열', getBare.includes("$service->list(null)") && getBare.includes("['tickets' => $service->list(null)]"));

const sql076 = read('sql/schema/076_support_ticket_user_and_unhide_category.sql');
assert('(k) 076 information_schema 2곳', (sql076.match(/information_schema/g) || []).length >= 2);
assert('(k) ON DELETE SET NULL', sql076.includes('ON DELETE SET NULL'));
assert('(k) ENUM 5개', sql076.includes("'bug','policy','account','other','unhide_request'"));
assert('(k) Actions는 주석', sql076.includes('Actions는 이 SQL을 실행하지 않는다'));
const backfill = read('sql/schema/076_support_ticket_user_backfill.sql');
assert('(k) backfill HAVING n = 1', backfill.includes('HAVING n = 1'));
assert('(k) 건수 4칸', ['total', 'one_match', 'zero_match', 'many_match'].every((k) => backfill.includes(k)));

assert('(g) 안내 문구', ADMIN_HIDE_OWNER_LINE === LINE);
const shown = renderAdminHideOwnerLine(true);
const hiddenOff = renderAdminHideOwnerLine(false);
assert('(g) hidden 렌더 1번', shown.split(LINE.slice(0, 12)).length === 2 && (shown.match(/<a /g) || []).length === 1);
assert('(g) hidden 아님 0번', hiddenOff === '');
for (const rel of [
  'preview/home-ui/src/study-room-reg/screens.js',
  'preview/home-ui/src/tutor-reg/screens.js',
  'preview/home-ui/src/student-reg/screens.js',
]) {
  const src = read(rel);
  assert(`(g) ${rel} 한 줄`, (src.match(/renderAdminHideOwnerLine\(/g) || []).length === 1);
}
const ctas = getHubCtas({ profile_status: 'hidden', id: 1 }).map((c) => c.label).join(' ');
const model = buildTutorRegistrationCheckModel({ id: 1, profile_status: 'hidden', tutor_display_name: '쌤' }, { canPublish: true });
const regHtml = renderTutorRegistrationCheck(model);
const planReason = studyRoomRegionPurchaseState(
  { has_scope_id: true },
  { room: { profile_status: 'hidden' }, productCode: 'prime' },
).reason;
const plansSrc = read('preview/home-ui/src/plans/screens.js');
const blob = `${ctas}\n${regHtml}\n${planReason}\n${plansSrc}`;
assert('(g) 다시 켜·해제 후·공개 신청 0', !blob.includes('다시 켜') && !blob.includes('해제 후') && !blob.includes('공개 신청'));
assert('(g) plans 문구', planReason === '숨김 상태입니다. 구매는 홈·찾기에 다시 보인 뒤에 가능합니다.' && plansSrc.includes(planReason));

const bind = fnBody(read('preview/home-ui/src/admin/a28-screens-bind.js'), 'bindTicketsScreen');
const reload = fnBody(read('preview/home-ui/src/admin/a28-screens-bind.js'), 'reloadTicketAdmin');
const render = fnBody(read('preview/home-ui/src/admin/a28-screens.js'), 'renderTicketsAdmin');
assert('(l) 필터에 location.hash·navigate 호출 0', !bind.includes('location.hash') && !bind.includes('navigate(') && !reload.includes('location.hash'));
assert('(l) 관리자 목록이 ticketsCache를 쓰지 않음', !bind.includes('ticketsCache') && !render.includes('ticketsCache') && !reload.includes('ticketsCache'));

const css = read('preview/home-ui/src/styles/home-admin.css');
const added = css.slice(css.indexOf('.admin-shell .a28-ticket-filters'));
assert('(m) 추가 CSS는 .admin-shell', added.split('\n').filter((l) => l.trim().startsWith('.') || l.includes('{')).every((l) => !l.trim().startsWith('.') || l.trim().startsWith('.admin-shell')));

const rendered = `${shown}\n${ctas}\n${regHtml}\n${planReason}`;
assert('(n) 이번 렌더에 학부모 0', !rendered.includes('학부모'));
const addedLines = spawnSync('git', ['diff', '-U0', 'HEAD', '--',
  'preview/home-ui/src/lifecycle-copy.js',
  'preview/home-ui/src/study-room-reg/screens.js',
  'preview/home-ui/src/tutor-reg/screens.js',
  'preview/home-ui/src/student-reg/screens.js',
  'preview/home-ui/src/plans/order-blocks.js',
  'preview/home-ui/src/plans/screens.js',
  'preview/home-ui/src/provider-notices.js',
  'preview/home-ui/src/support/screens.js',
  'preview/home-ui/src/support/support-copy.js',
  'preview/home-ui/src/admin/a28-screens.js',
  'preview/home-ui/src/tutor-reg/format.js',
  'preview/home-ui/src/mypage/screens.js',
], { cwd: ROOT, encoding: 'utf8' }).stdout
  .split('\n')
  .filter((line) => line.startsWith('+') && !line.startsWith('+++'));
assert('(n) 이번에 더한 화면 줄에 학부모 0', addedLines.every((line) => !line.includes('학부모')));

globalThis.fetch = async (url) => {
  if (String(url).includes('notices.php')) {
    return {
      ok: true,
      status: 200,
      json: async () => ({
        notices: [{
          id: 7,
          notice_kind: 'admin_hide',
          title: '홈·찾기 숨김',
          body: LINE,
          action_href: '/support/contact?category=unhide_request',
          is_read: 0,
        }, {
          id: 8,
          notice_kind: 'expiry',
          title: '만료',
          body: '곧 끝',
          action_href: '/plans',
          is_read: 0,
        }],
      }),
    };
  }
  return { ok: false, status: 404, json: async () => ({}) };
};
await hydrateProviderNotices();
const noticeHtml = renderProviderNoticeBanners();
assert('(화면) admin_hide 버튼은 고객센터 운영문의 · 종류는 시스템 안내', noticeHtml.includes('고객센터 운영문의') && noticeHtml.includes('>시스템 안내<') && noticeHtml.includes('data-mypage-nav="/support/contact?category=unhide_request"'));
assert('(화면) 다른 종류는 영문 키와 유료 서비스 안내', noticeHtml.includes('시스템 안내 · expiry') && noticeHtml.includes('유료 서비스 안내'));

if (failed > 0) {
  console.error(`\nhide-inquiry bundle FAILED ${failed} (pass ${passed})`);
  process.exit(1);
}
console.log(`\nhide-inquiry bundle OK ${passed}`);
