<?php

declare(strict_types=1);

/**
 * 관리자-162 집계·경계·저장·메일.
 * 실행: php scripts/verify-admin-162-settlement.php
 */

$env = [
    'STUDY114_DB_HOST' => '127.0.0.1',
    'STUDY114_DB_PORT' => '3306',
    'STUDY114_DB_NAME' => 'study114',
    'STUDY114_DB_USER' => 'study114',
    'STUDY114_DB_PASS' => 'study114dev',
    'STUDY114_APP_ENV' => 'local',
    'STUDY114_MAIL_TRANSPORT' => 'fake',
    'STUDY114_MAIL_FROM' => 'no-reply@study114.local',
    'STUDY114_MAIL_FAKE_OUTBOX' => '/tmp/study114-162-outbox.jsonl',
    'STUDY114_REPORT_MAIL_TO' => 'report162@t162.test',
    'STUDY114_HOME_UI' => 'http://127.0.0.1:5174',
    'STUDY114_REPORT_CRON_KEY' => 'report-cron-key-0123456789abcdef',
];
foreach ($env as $key => $value) {
    putenv($key . '=' . $value);
    $_ENV[$key] = $value;
    $_SERVER[$key] = $value;
}

date_default_timezone_set('Asia/Seoul');
ob_start();

require_once dirname(__DIR__) . '/src/bootstrap.php';

use Study114\Auth\AuthSession;
use Study114\Database\Connection;
use Study114\Mail\FakeMailOutbox;
use Study114\Report\ReportPeriod;
use Study114\Report\SettlementLinesQuery;
use Study114\Report\SettlementMailer;
use Study114\Report\SettlementReportRepository;
use Study114\Report\SettlementReportService;

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

function kst(string $ymdHis): DateTimeImmutable
{
    return new DateTimeImmutable($ymdHis, new DateTimeZone('Asia/Seoul'));
}

function svc(): SettlementReportService
{
    return new SettlementReportService();
}

function outboxRows(): array
{
    $path = FakeMailOutbox::path();
    if (!is_file($path)) {
        return [];
    }
    $lines = array_filter(array_map('trim', file($path) ?: []));
    $rows = [];
    foreach ($lines as $line) {
        $decoded = json_decode($line, true);
        if (is_array($decoded)) {
            $rows[] = $decoded;
        }
    }

    return $rows;
}

$pdo = Connection::get();
$pdo->exec("SET time_zone = '+09:00'");

$schemaFiles = [
    '056_provider_account_context.sql',
    '061_payment_catalog_snapshot.sql',
    '063_student_memo_fulfillment.sql',
    '068_support_ticket_admin_reply.sql',
    '069_home_popups.sql',
    '071_member_delete_payment_anon.sql',
    '075_concern_comments_reactions.sql',
    '077_admin_settlement_reports.sql',
];
foreach ($schemaFiles as $file) {
    $path = dirname(__DIR__) . '/sql/schema/' . $file;
    $cmd = 'mysql -ustudy114 -pstudy114dev -h127.0.0.1 study114 < ' . escapeshellarg($path) . ' 2>&1';
    exec($cmd, $out, $code);
    ok('schema ' . $file, $code === 0, implode("\n", array_slice($out, -3)));
    $out = [];
}

ok('table-077', (new SettlementReportRepository())->tableExists());

$pdo->exec('DELETE FROM admin_settlement_reports');
$pdo->exec('DELETE FROM support_tickets');
$pdo->exec('DELETE FROM admin_reports');
$pdo->exec('DELETE FROM home_popups');
$pdo->exec("DELETE FROM admin_operation_logs WHERE log_key LIKE 't162-%'");
$pdo->exec("DELETE FROM provider_payment_orders WHERE order_ref LIKE 't162-%'");
$ids = $pdo->query("SELECT id FROM users WHERE email LIKE '%@t162.test'")->fetchAll(PDO::FETCH_COLUMN);
if ($ids) {
    $in = implode(',', array_map('intval', $ids));
    $pdo->exec("DELETE FROM study_room_regions WHERE study_room_id IN (SELECT id FROM study_rooms WHERE user_id IN ($in))");
    $pdo->exec("DELETE FROM study_rooms WHERE user_id IN ($in)");
    $pdo->exec("DELETE FROM tutor_regions WHERE tutor_id IN (SELECT id FROM tutors WHERE user_id IN ($in))");
    $pdo->exec("DELETE FROM tutors WHERE user_id IN ($in)");
    $pdo->exec("DELETE FROM students WHERE guardian_user_id IN ($in)");
    $pdo->exec("DELETE FROM user_roles WHERE user_id IN ($in)");
    $pdo->exec("DELETE FROM user_profiles WHERE user_id IN ($in)");
    $pdo->exec("DELETE FROM provider_payment_orders WHERE user_id IN ($in)");
    $pdo->exec("DELETE FROM users WHERE id IN ($in)");
}

$regionId = (int) $pdo->query('SELECT id FROM regions ORDER BY id LIMIT 1')->fetchColumn();
if ($regionId < 1) {
    $pdo->exec("INSERT INTO regions (sido_code, sido_name, sigungu_code, sigungu_name, dong_code, dong_name) VALUES ('11','서울','110','강남','t162dong','테스트동')");
    $regionId = (int) $pdo->lastInsertId();
}
ok('region-ready', $regionId > 0);

function userId(PDO $pdo, string $email, string $status = 'active', ?string $level = null): int
{
    $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
    $stmt->execute([$email]);
    $id = $stmt->fetchColumn();
    if ($id) {
        $pdo->prepare('UPDATE users SET status = ?, admin_level = ?, email_verified_at = ?, deleted_at = NULL WHERE id = ?')
            ->execute([$status, $level, '2026-01-01 00:00:00', $id]);

        return (int) $id;
    }
    $pdo->prepare('INSERT INTO users (email, password_hash, status, email_verified_at, admin_level) VALUES (?,?,?,?,?)')
        ->execute([$email, password_hash('t162', PASSWORD_DEFAULT), $status, '2026-01-01 00:00:00', $level]);

    return (int) $pdo->lastInsertId();
}

function addRole(PDO $pdo, int $userId, string $role): void
{
    $pdo->prepare('INSERT IGNORE INTO user_roles (user_id, role_type, is_primary, status) VALUES (?,?,1,\'active\')')
        ->execute([$userId, $role]);
}

function addPay(PDO $pdo, int $userId, string $role, int $amount, string $status, string $paidAt): void
{
    $provider = in_array($role, ['study_room', 'tutor'], true) ? $role : null;
    $pdo->prepare(
        'INSERT INTO provider_payment_orders
         (user_id, order_ref, product_id, variant_label, product_kind, amount_won, status, provider_type, paid_at, pg_provider)
         VALUES (?,?,?,?,?,?,?,?,?,\'dev_mock\')'
    )->execute([
        $userId,
        't162-' . bin2hex(random_bytes(8)),
        'position',
        '기본',
        'position',
        $amount,
        $status,
        $provider,
        $status === 'paid' ? $paidAt : null,
    ]);
}

$payerRoom = userId($pdo, 'room162@t162.test');
addRole($pdo, $payerRoom, 'study_room_owner');
$payerTutor = userId($pdo, 'tutor162@t162.test');
addRole($pdo, $payerTutor, 'tutor');
$guardian = userId($pdo, 'guard162@t162.test');
addRole($pdo, $guardian, 'guardian_student');

$parsed = SettlementReportService::parseDeleteRoles('삭제 전 이메일 a@b.c · 이름 홍 · 역할 학생 · 공부방 0 · 과외쌤 0 · 학생 1 · 결제 0건 · 계정 삭제');
ok('parse-one-student', $parsed['unknown'] === false && $parsed['roles'] === ['학생']);
$parsed = SettlementReportService::parseDeleteRoles('역할 학생 · 공부방 · 공부방 1 · 과외쌤 0 · 학생 1 · 결제 0건 · 끝');
ok('parse-two-roles', $parsed['unknown'] === false && $parsed['roles'] === ['학생', '공부방'], implode(',', $parsed['roles']));
$parsed = SettlementReportService::parseDeleteRoles('역할 역할 없음 · 공부방 0 · 과외쌤 0 · 학생 0 · 결제 0건 · 끝');
ok('parse-none', $parsed['unknown'] === false && $parsed['roles'] === []);
$parsed = SettlementReportService::parseDeleteRoles('역할 운영자 · 공부방 0 · 과외쌤 0 · 학생 0 · 결제 0건 · 끝');
ok('parse-admin-skip', $parsed['unknown'] === false && $parsed['roles'] === []);
$parsed = SettlementReportService::parseDeleteRoles('형식이 깨진 메모');
ok('parse-broken', $parsed['unknown'] === true && $parsed['roles'] === []);

$period = new ReportPeriod();
$midnight = kst('2026-10-07 00:00:00');
ok('storage-db-seoul', $period->toStorage($midnight, 'db') === '2026-10-07 00:00:00', $period->toStorage($midnight, 'db'));
ok('storage-php-seoul', $period->toStorage($midnight, 'php') === '2026-10-07 00:00:00', $period->toStorage($midnight, 'php'));
$week = $period->weekRange('2026-10-07');
ok('week-mon', $week['startDate'] === '2026-10-05' && $week['endDate'] === '2026-10-11');
ok('week-prev', $period->weekRange('2026-10-04')['startDate'] === '2026-09-28');
$feb = $period->monthRange('2026-02-15');
ok('month-feb-2026', $feb['startDate'] === '2026-02-01' && $feb['endDate'] === '2026-02-28');
$leap = $period->monthRange('2028-02-10');
ok('month-feb-2028', $leap['startDate'] === '2028-02-01' && $leap['endDate'] === '2028-02-29');
$dec = $period->monthRange('2026-12-31');
ok('month-dec', $dec['startDate'] === '2026-12-01' && $dec['endDate'] === '2026-12-31' && $dec['end']->format('Y-m-d') === '2027-01-01');
ok('mail-window-in', $period->inMailWindow(kst('2026-10-07 00:30:59'), '2026-10-06'));
ok('mail-window-out', !$period->inMailWindow(kst('2026-10-07 00:31:00'), '2026-10-06'));

$example = SettlementMailer::lines([
    'period_kind' => 'day',
    'pay_count' => 5, 'pay_amount_won' => 500000,
    'pay_study_room_count' => 3, 'pay_study_room_amount_won' => 200000,
    'pay_tutor_count' => 2, 'pay_tutor_amount_won' => 300000,
    'pay_student_count' => 0, 'pay_student_amount_won' => 0,
    'pay_unknown_count' => 0, 'pay_unknown_amount_won' => 0,
    'inquiry_count' => 4, 'report_count' => 1,
    'reg_study_room_count' => 1, 'reg_tutor_count' => 0, 'reg_student_count' => 2,
    'withdraw_study_room_count' => 0, 'withdraw_tutor_count' => 0, 'withdraw_student_count' => 1,
    'delete_study_room_count' => 0, 'delete_tutor_count' => 1, 'delete_student_count' => 0,
    'delete_unknown_count' => 0, 'home_popup_count' => 2,
]);
ok('example-pay', $example[0] === '① 결제 5건 500,000원 (공부방 3건 200,000원 · 과외쌤 2건 300,000원 · 학생 0건 0원)');
ok('example-queue', $example[1] === '② 남은 응대 문의 4 · 신고 1');
ok('example-reg', $example[2] === '③ 등록 공부방 1 · 과외쌤 0 · 학생 2');
ok('example-leave', $example[3] === '④ 탈퇴 공부방 0 · 과외쌤 0 · 학생 1 / 관리자 삭제 공부방 0 · 과외쌤 1 · 학생 0');
ok('example-popup', $example[4] === '⑤ 홈 팝업 2개');
ok('example-week-words', str_contains(SettlementMailer::lines(['period_kind' => 'week', 'pay_count' => 0, 'pay_amount_won' => 0, 'pay_study_room_count' => 0, 'pay_study_room_amount_won' => 0, 'pay_tutor_count' => 0, 'pay_tutor_amount_won' => 0, 'pay_student_count' => 0, 'pay_student_amount_won' => 0, 'pay_unknown_count' => 0, 'pay_unknown_amount_won' => 0, 'inquiry_count' => 1, 'report_count' => 2, 'reg_study_room_count' => 0, 'reg_tutor_count' => 0, 'reg_student_count' => 0, 'withdraw_study_room_count' => 0, 'withdraw_tutor_count' => 0, 'withdraw_student_count' => 0, 'delete_study_room_count' => 0, 'delete_tutor_count' => 0, 'delete_student_count' => 0, 'delete_unknown_count' => 0, 'home_popup_count' => 3])[1], '새 응대') && str_contains(SettlementMailer::subject(['period_kind' => 'month', 'period_start' => '2026-09-01', 'period_end' => '2026-09-30']), '2026-09'));

foreach ([100000, 50000, 50000] as $amount) {
    addPay($pdo, $payerRoom, 'study_room', $amount, 'paid', '2026-08-15 12:00:00');
}
foreach ([150000, 150000] as $amount) {
    addPay($pdo, $payerTutor, 'tutor', $amount, 'paid', '2026-08-15 12:00:00');
}
addPay($pdo, $payerRoom, 'study_room', 9, 'failed', '2026-08-15 12:00:00');
addPay($pdo, $payerRoom, 'study_room', 9, 'cancelled', '2026-08-15 12:00:00');
addPay($pdo, $payerTutor, 'tutor', 9, 'pending', '2026-08-15 12:00:00');

$ticketNo = 1;
foreach (['open', 'open', 'in_progress', 'closed', 'closed', 'closed'] as $status) {
    $pdo->prepare('INSERT INTO support_tickets (ticket_no, email, category, role_type, body, status, created_at) VALUES (?,?,\'bug\',\'parent\',\'본문\',?,\'2026-08-15 09:00:00\')')
        ->execute(['T162-' . $ticketNo, 'q@t162.test', $status]);
    $ticketNo++;
}
foreach ([['open', 'R162-1'], ['protect', 'R162-2'], ['resolved', 'R162-3'], ['dismissed', 'R162-4']] as [$status, $key]) {
    $pdo->prepare('INSERT INTO admin_reports (report_key, kind, target_type, target_id, reason, status, created_at) VALUES (?,?,\'tutor\',\'1\',\'이유\',?,\'2026-08-15 09:00:00\')')
        ->execute([$key, '허위', $status]);
}

FakeMailOutbox::clear();
$run = svc()->runAt(kst('2026-08-16 00:05:00'));
$row = (new SettlementReportRepository())->find('day', '2026-08-15');
ok('pay-count', $row && (int) $row['pay_count'] === 5 && (int) $row['pay_amount_won'] === 500000, json_encode($row['pay_count'] ?? null));
ok('pay-roles', $row && (int) $row['pay_study_room_count'] === 3 && (int) $row['pay_study_room_amount_won'] === 200000 && (int) $row['pay_tutor_count'] === 2 && (int) $row['pay_tutor_amount_won'] === 300000 && (int) $row['pay_student_count'] === 0);
ok('pay-sum', $row && (int) $row['pay_study_room_count'] + (int) $row['pay_tutor_count'] + (int) $row['pay_student_count'] + (int) $row['pay_unknown_count'] === (int) $row['pay_count']);
ok('pay-amount-sum', $row && (int) $row['pay_study_room_amount_won'] + (int) $row['pay_tutor_amount_won'] + (int) $row['pay_student_amount_won'] + (int) $row['pay_unknown_amount_won'] === (int) $row['pay_amount_won']);
ok('queue-day', $row && (int) $row['inquiry_count'] === 3 && (int) $row['report_count'] === 2);
ok('aug16-mail-one', count(outboxRows()) === 1 && str_contains((string) outboxRows()[0]['subject'], '2026-08-15'));
$before = json_encode(svc()->readReport('day', '2026-08-15', kst('2026-08-16 10:00:00')), JSON_UNESCAPED_UNICODE);
$again = json_encode(svc()->readReport('day', '2026-08-15', kst('2026-08-16 10:00:00')), JSON_UNESCAPED_UNICODE);
ok('get-twice', $before === $again);
addPay($pdo, $payerRoom, 'study_room', 777, 'paid', '2026-08-15 18:00:00');
$pdo->exec("UPDATE support_tickets SET status = 'closed' WHERE ticket_no = 'T162-1'");
$after = json_encode(svc()->readReport('day', '2026-08-15', kst('2026-08-16 11:00:00')), JSON_UNESCAPED_UNICODE);
ok('immutable-after-edit', $before === $after);
FakeMailOutbox::clear();
svc()->runAt(kst('2026-08-16 00:20:00'));
ok('mail-rerun-zero', count(outboxRows()) === 0);

function readTotal(string $kind, string $date, string $line): int
{
    $page = svc()->readLines($kind, $date, $line, 1, kst('2026-08-16 12:00:00'));

    return (int) $page['total'];
}
ok('lines-pay', readTotal('day', '2026-08-15', 'pay') === 5);
ok('lines-inquiry', readTotal('day', '2026-08-15', 'inquiry') === 3);
ok('lines-report', readTotal('day', '2026-08-15', 'report') === 2);

$pdo->prepare('INSERT INTO students (guardian_user_id, student_name, public_display_name, published_at, exposure_status) VALUES (?,?,?,?,?)')
    ->execute([$guardian, '실명숨김', '공개학생', '2026-08-20 10:00:00', 'published']);
$pdo->prepare('INSERT INTO students (guardian_user_id, student_name, published_at, exposure_status) VALUES (?,?,NULL,\'draft\')')
    ->execute([$guardian, '초안']);
$pdo->prepare('INSERT INTO students (guardian_user_id, student_name, public_display_name, published_at, exposure_status, deleted_at) VALUES (?,?,?,?,\'hidden\',?)')
    ->execute([$guardian, '지운학생', '지운표시', '2026-08-20 11:00:00', '2026-08-21 01:00:00']);
$roomUser = userId($pdo, 'owner162@t162.test');
addRole($pdo, $roomUser, 'study_room_owner');
$pdo->prepare('INSERT INTO study_rooms (user_id, study_room_name, profile_status, created_at) VALUES (?,?,\'draft\',?)')
    ->execute([$roomUser, '초안방', '2026-08-20 09:00:00']);
$draftRoom = (int) $pdo->lastInsertId();
$pdo->prepare('INSERT INTO study_room_regions (study_room_id, slot, region_id) VALUES (?,1,?)')->execute([$draftRoom, $regionId]);
$pdo->prepare('INSERT INTO study_rooms (user_id, study_room_name, profile_status, created_at) VALUES (?,?,\'hidden\',?)')
    ->execute([$roomUser, '숨김방', '2026-08-20 09:30:00']);
$hiddenRoom = (int) $pdo->lastInsertId();
$pdo->prepare('INSERT INTO study_room_regions (study_room_id, slot, region_id) VALUES (?,1,?)')->execute([$hiddenRoom, $regionId]);
$pdo->prepare('INSERT INTO study_rooms (user_id, study_room_name, profile_status, created_at) VALUES (?,?,\'published\',?)')
    ->execute([$roomUser, '지역없음', '2026-08-20 09:40:00']);
$tutorUser = userId($pdo, 'tutorcard162@t162.test');
addRole($pdo, $tutorUser, 'tutor');
$pdo->prepare('INSERT INTO tutors (user_id, tutor_display_name, profile_status, created_at) VALUES (?,?,\'draft\',?)')
    ->execute([$tutorUser, '초안쌤', '2026-08-20 08:00:00']);
$draftTutor = (int) $pdo->lastInsertId();
$pdo->prepare('INSERT INTO tutor_regions (tutor_id, region_id, priority_order) VALUES (?,?,0)')->execute([$draftTutor, $regionId]);
$pdo->prepare('INSERT INTO tutors (user_id, tutor_display_name, profile_status, created_at) VALUES (?,?,\'published\',?)')
    ->execute([$tutorUser, '지역없음쌤', '2026-08-20 08:10:00']);

$pdo->prepare("INSERT INTO home_popups (type, audience, content, start_at, end_at, published) VALUES ('a','all','본문',NULL,NULL,1)")->execute();
$pdo->prepare("INSERT INTO home_popups (type, audience, content, start_at, end_at, published) VALUES ('b','all','본문','2026-08-21','2026-08-21',1)")->execute();
$pdo->prepare("INSERT INTO home_popups (type, audience, content, start_at, end_at, published) VALUES ('c','all','본문',NULL,NULL,0)")->execute();
$pdo->prepare("INSERT INTO home_popups (type, audience, content, start_at, end_at, published) VALUES ('d','all','본문','2026-08-22',NULL,1)")->execute();
$pdo->prepare("INSERT INTO home_popups (type, audience, content, start_at, end_at, published) VALUES ('e','all','본문',NULL,'2026-08-20',1)")->execute();

svc()->runAt(kst('2026-08-21 00:05:00'));
$regRow = (new SettlementReportRepository())->find('day', '2026-08-20');
ok('reg-student', $regRow && (int) $regRow['reg_student_count'] === 2, (string) ($regRow['reg_student_count'] ?? ''));
ok('reg-room', $regRow && (int) $regRow['reg_study_room_count'] === 2, (string) ($regRow['reg_study_room_count'] ?? ''));
ok('reg-tutor', $regRow && (int) $regRow['reg_tutor_count'] === 1, (string) ($regRow['reg_tutor_count'] ?? ''));
ok('popup-now', $regRow && (int) $regRow['home_popup_count'] === 2, (string) ($regRow['home_popup_count'] ?? ''));
ok('lines-reg', readTotal('day', '2026-08-20', 'reg') === 5);
ok('lines-popup', readTotal('day', '2026-08-20', 'popup') === 2);

$leftStudent = userId($pdo, 'left162@t162.test', 'withdrawn');
addRole($pdo, $leftStudent, 'guardian_student');
$pdo->prepare('UPDATE users SET deleted_at = ? WHERE id = ?')->execute(['2026-08-22 13:00:00', $leftStudent]);
$pdo->prepare('INSERT INTO user_profiles (user_id, real_name) VALUES (?,?)')->execute([$leftStudent, '김탈퇴']);
$leftBoth = userId($pdo, 'both162@t162.test', 'withdrawn');
addRole($pdo, $leftBoth, 'study_room_owner');
addRole($pdo, $leftBoth, 'tutor');
$pdo->prepare('UPDATE users SET deleted_at = ? WHERE id = ?')->execute(['2026-08-22 14:00:00', $leftBoth]);
$adminOnly = userId($pdo, 'opswd162@t162.test', 'withdrawn');
addRole($pdo, $adminOnly, 'admin');
$pdo->prepare('UPDATE users SET deleted_at = ? WHERE id = ?')->execute(['2026-08-22 15:00:00', $adminOnly]);
$pdo->exec('UPDATE user_roles SET status = \'inactive\' WHERE user_id IN (' . $leftStudent . ',' . $leftBoth . ',' . $adminOnly . ')');

$memos = [
    ['one', '역할 학생 · 공부방 0 · 과외쌤 0 · 학생 1 · 결제 0건 · 끝'],
    ['two', '역할 학생 · 공부방 · 공부방 1 · 과외쌤 0 · 학생 1 · 결제 0건 · 끝'],
    ['none', '역할 역할 없음 · 공부방 0 · 과외쌤 0 · 학생 0 · 결제 0건 · 끝'],
    ['bad', '메모가 깨짐'],
];
foreach ($memos as [$key, $memo]) {
    $pdo->prepare('INSERT INTO admin_operation_logs (log_key, acted_at, operator_id, target_type, target_id, action_kind, detail_memo) VALUES (?,?,\'1\',\'user\',?,?,?)')
        ->execute(['t162-' . $key, '2026-08-22 16:00:00', $key, 'account_delete', $memo]);
}
$pdo->prepare('INSERT INTO admin_operation_logs (log_key, acted_at, operator_id, target_type, target_id, action_kind, detail_memo) VALUES (?,?,\'1\',\'user\',?,?,?)')
    ->execute(['t162-hide', '2026-08-22 16:10:00', 'h1', '숨김', 'hide_profile']);
$pdo->prepare("UPDATE admin_operation_logs SET action_kind = 'hide_profile' WHERE log_key = 't162-hide'")->execute();
$pdo->prepare('INSERT INTO admin_operation_logs (log_key, acted_at, operator_id, target_type, target_id, action_kind, detail_memo) VALUES (?,?,\'1\',\'study_room\',\'9\',\'exposure_correction\',\'보정\')')
    ->execute(['t162-expo', '2026-08-22 16:20:00']);

svc()->runAt(kst('2026-08-23 00:05:00'));
$leave = (new SettlementReportRepository())->find('day', '2026-08-22');
ok('withdraw-total', $leave && (int) $leave['withdraw_total'] === 3, (string) ($leave['withdraw_total'] ?? ''));
ok('withdraw-roles', $leave && (int) $leave['withdraw_student_count'] === 1 && (int) $leave['withdraw_study_room_count'] === 1 && (int) $leave['withdraw_tutor_count'] === 1);
ok('delete-accounts', $leave && (int) $leave['delete_total'] === 4, (string) ($leave['delete_total'] ?? ''));
ok('delete-roles', $leave && (int) $leave['delete_student_count'] === 2 && (int) $leave['delete_study_room_count'] === 1 && (int) $leave['delete_unknown_count'] === 1, json_encode([
    $leave['delete_student_count'] ?? null,
    $leave['delete_study_room_count'] ?? null,
    $leave['delete_unknown_count'] ?? null,
]));
ok('hide-ignored', $leave && (int) $leave['delete_total'] === 4);
ok('lines-withdraw', readTotal('day', '2026-08-22', 'withdraw') === 3);
ok('lines-delete', readTotal('day', '2026-08-22', 'delete') === 4);

addPay($pdo, $payerRoom, 'study_room', 1, 'paid', '2026-10-04 23:59:59');
addPay($pdo, $payerRoom, 'study_room', 10, 'paid', '2026-10-05 00:00:00');
addPay($pdo, $payerTutor, 'tutor', 20, 'paid', '2026-10-11 23:59:59');
addPay($pdo, $payerTutor, 'tutor', 1, 'paid', '2026-10-12 00:00:00');
$pdo->prepare('INSERT INTO students (guardian_user_id, student_name, public_display_name, published_at) VALUES (?,?,?,?)')
    ->execute([$guardian, '주간학생', '주간표시', '2026-10-06 12:00:00']);
$pdo->prepare("INSERT INTO support_tickets (ticket_no, email, category, role_type, body, status, created_at) VALUES ('T162-W','w@t162.test','other','study_room','본문','closed','2026-10-06 12:00:00')")->execute();
$pdo->prepare("INSERT INTO support_tickets (ticket_no, email, category, role_type, body, status, created_at) VALUES ('T162-OUT','o@t162.test','other','tutor','본문','open','2026-10-04 12:00:00')")->execute();
$pdo->prepare("INSERT INTO admin_reports (report_key, kind, target_type, target_id, reason, status, created_at) VALUES ('R162-W','기타','tutor','2','이유','resolved','2026-10-07 12:00:00')")->execute();
svc()->runAt(kst('2026-10-12 00:05:00'));
$weekRow = (new SettlementReportRepository())->find('week', '2026-10-05');
$weekSum = $pdo->query("SELECT COALESCE(SUM(pay_count),0) pay_count, COALESCE(SUM(pay_amount_won),0) pay_amount, COALESCE(SUM(reg_student_count),0) reg_student, COALESCE(SUM(withdraw_total),0) withdraw_total, COALESCE(SUM(delete_total),0) delete_total FROM admin_settlement_reports WHERE period_kind = 'day' AND period_start >= '2026-10-05' AND period_start <= '2026-10-11'")->fetch();
ok('week-pay', $weekRow && (int) $weekRow['pay_count'] === 2 && (int) $weekRow['pay_amount_won'] === 30, json_encode($weekRow['pay_amount_won'] ?? null));
ok('week-sum-pay', $weekRow && (int) $weekRow['pay_count'] === (int) $weekSum['pay_count'] && (int) $weekRow['pay_amount_won'] === (int) $weekSum['pay_amount']);
ok('week-sum-reg', $weekRow && (int) $weekRow['reg_student_count'] === (int) $weekSum['reg_student'] && (int) $weekSum['reg_student'] >= 1);
ok('week-new-queue', $weekRow && (int) $weekRow['inquiry_count'] === 1 && (int) $weekRow['report_count'] === 1, json_encode([$weekRow['inquiry_count'] ?? null, $weekRow['report_count'] ?? null]));
ok('week-word', $weekRow && str_contains(SettlementMailer::lines($weekRow)[1], '새 응대') && str_contains(SettlementMailer::lines($weekRow)[4], '기간 마지막'));

addPay($pdo, $payerRoom, 'study_room', 28, 'paid', '2026-02-28 12:00:00');
addPay($pdo, $payerRoom, 'study_room', 1, 'paid', '2026-03-01 00:00:00');
svc()->runAt(kst('2026-03-01 00:05:00'));
$febRow = (new SettlementReportRepository())->find('month', '2026-02-01');
ok('month-feb-pay', $febRow && (int) $febRow['pay_count'] === 1 && (int) $febRow['pay_amount_won'] === 28 && $febRow['period_end'] === '2026-02-28');
$febDays = (int) $pdo->query("SELECT COUNT(*) FROM admin_settlement_reports WHERE period_kind='day' AND period_start >= '2026-02-01' AND period_start <= '2026-02-28'")->fetchColumn();
$febSum = (int) $pdo->query("SELECT COALESCE(SUM(pay_count),0) FROM admin_settlement_reports WHERE period_kind='day' AND period_start >= '2026-02-01' AND period_start <= '2026-02-28'")->fetchColumn();
ok('month-feb-days', $febDays === 28 && $febRow && (int) $febRow['pay_count'] === $febSum);

addPay($pdo, $payerTutor, 'tutor', 29, 'paid', '2028-02-29 12:00:00');
addPay($pdo, $payerTutor, 'tutor', 1, 'paid', '2028-03-01 00:00:00');
svc()->runAt(kst('2028-03-01 00:05:00'));
$leapRow = (new SettlementReportRepository())->find('month', '2028-02-01');
ok('month-leap-pay', $leapRow && (int) $leapRow['pay_count'] === 1 && $leapRow['period_end'] === '2028-02-29');

addPay($pdo, $payerRoom, 'study_room', 31, 'paid', '2026-12-31 23:00:00');
addPay($pdo, $payerRoom, 'study_room', 1, 'paid', '2027-01-01 00:00:00');
svc()->runAt(kst('2027-01-01 00:05:00'));
$decRow = (new SettlementReportRepository())->find('month', '2026-12-01');
ok('month-dec-pay', $decRow && (int) $decRow['pay_count'] === 1 && (int) $decRow['pay_amount_won'] === 31 && $decRow['period_end'] === '2026-12-31');

$pdo->exec("SET time_zone = '+00:00'");
date_default_timezone_set('UTC');
addPay($pdo, $payerRoom, 'study_room', 5, 'paid', '2026-10-06 14:59:59');
addPay($pdo, $payerTutor, 'tutor', 7, 'paid', '2026-10-06 15:00:00');
$pdo->prepare("DELETE FROM admin_settlement_reports WHERE period_kind = 'day' AND period_start IN ('2026-10-06','2026-10-07')")->execute();
$utcRun = new SettlementReportService();
$utcRun->runAt(kst('2026-10-08 00:05:00'));
$d6 = (new SettlementReportRepository())->find('day', '2026-10-06');
$d7 = (new SettlementReportRepository())->find('day', '2026-10-07');
ok('tz-utc-1006', $d6 && (int) $d6['pay_amount_won'] === 5, (string) ($d6['pay_amount_won'] ?? ''));
ok('tz-utc-1007', $d7 && (int) $d7['pay_amount_won'] === 7, (string) ($d7['pay_amount_won'] ?? ''));
$pdo->exec("SET time_zone = '+09:00'");
date_default_timezone_set('Asia/Seoul');
$pdo->exec("DELETE FROM provider_payment_orders WHERE order_ref LIKE 't162-%' AND paid_at IN ('2026-10-06 14:59:59','2026-10-06 15:00:00')");
addPay($pdo, $payerRoom, 'study_room', 5, 'paid', '2026-10-06 23:59:59');
addPay($pdo, $payerTutor, 'tutor', 7, 'paid', '2026-10-07 00:00:00');
$pdo->prepare("DELETE FROM admin_settlement_reports WHERE period_kind = 'day' AND period_start IN ('2026-10-06','2026-10-07')")->execute();
svc()->runAt(kst('2026-10-08 00:05:00'));
$d6 = (new SettlementReportRepository())->find('day', '2026-10-06');
$d7 = (new SettlementReportRepository())->find('day', '2026-10-07');
ok('tz-kst-1006', $d6 && (int) $d6['pay_amount_won'] === 5, (string) ($d6['pay_amount_won'] ?? ''));
ok('tz-kst-1007', $d7 && (int) $d7['pay_amount_won'] === 7, (string) ($d7['pay_amount_won'] ?? ''));

$repo = new SettlementReportRepository();
$stale = $repo->find('day', '2026-08-20');
$pdo->prepare("UPDATE admin_settlement_reports SET mail_status = 'pending', mail_claimed_at = NULL, mail_error = NULL WHERE id = ?")->execute([(int) $stale['id']]);
ok('claim-first', $repo->claimMail((int) $stale['id']) === true);
ok('claim-second', $repo->claimMail((int) $stale['id']) === false);
$pdo->prepare("UPDATE admin_settlement_reports SET mail_status = 'skipped', mail_error = 'window_passed' WHERE id = ?")->execute([(int) $stale['id']]);

putenv('STUDY114_REPORT_MAIL_TO');
unset($_ENV['STUDY114_REPORT_MAIL_TO'], $_SERVER['STUDY114_REPORT_MAIL_TO']);
$pdo->exec("UPDATE users SET admin_level = NULL WHERE admin_level = 'super_admin'");
$pdo->prepare("DELETE FROM admin_settlement_reports WHERE period_kind = 'day' AND period_start = '2026-01-15'")->execute();
FakeMailOutbox::clear();
svc()->runAt(kst('2026-01-16 00:05:00'));
$none = (new SettlementReportRepository())->find('day', '2026-01-15');
ok('no-recipient', $none && $none['mail_status'] === 'failed' && $none['mail_error'] === 'no_recipient', (string) ($none['mail_error'] ?? ''));
ok('no-recipient-mail', count(outboxRows()) === 0);
putenv('STUDY114_REPORT_MAIL_TO=report162@t162.test');
$_ENV['STUDY114_REPORT_MAIL_TO'] = 'report162@t162.test';
$_SERVER['STUDY114_REPORT_MAIL_TO'] = 'report162@t162.test';

$pdo->prepare("DELETE FROM admin_settlement_reports WHERE period_start IN ('2026-05-25','2026-05-01','2026-05-31')")->execute();
$pdo->exec("DELETE FROM admin_settlement_reports WHERE period_kind = 'day' AND period_start >= '2026-05-02' AND period_start <= '2026-05-31'");
FakeMailOutbox::clear();
svc()->runAt(kst('2026-06-01 00:05:00'));
$subjects = array_map(static fn (array $row): string => (string) $row['subject'], outboxRows());
ok('overlap-three', count($subjects) === 3, implode(' | ', $subjects));
ok('overlap-order', isset($subjects[0], $subjects[1], $subjects[2]) && str_contains($subjects[0], '일간') && str_contains($subjects[1], '주간') && str_contains($subjects[2], '월간'), implode(' | ', $subjects));
FakeMailOutbox::clear();
svc()->runAt(kst('2026-06-01 00:20:00'));
ok('overlap-rerun', count(outboxRows()) === 0);

$pdo->prepare("DELETE FROM admin_settlement_reports WHERE period_kind = 'day' AND period_start = '2026-04-15'")->execute();
FakeMailOutbox::clear();
svc()->runAt(kst('2026-04-16 00:31:00'));
$late = (new SettlementReportRepository())->find('day', '2026-04-15');
ok('window-passed-mail', count(outboxRows()) === 0);
ok('window-passed-row', $late && $late['mail_status'] === 'skipped' && $late['mail_error'] === 'window_passed', (string) ($late['mail_error'] ?? ''));

foreach (['2026-08-10', '2026-08-11', '2026-08-12'] as $day) {
    $pdo->prepare("DELETE FROM admin_settlement_reports WHERE period_kind = 'day' AND period_start = ?")->execute([$day]);
}
FakeMailOutbox::clear();
$beforeRows = (int) $pdo->query('SELECT COUNT(*) FROM admin_settlement_reports')->fetchColumn();
svc()->runAt(kst('2026-09-01 00:05:00'));
$backfillMails = 0;
foreach (['2026-08-10', '2026-08-11', '2026-08-12'] as $day) {
    $item = (new SettlementReportRepository())->find('day', $day);
    ok('backfill-' . $day, $item && (int) $item['is_backfill'] === 1 && $item['inquiry_count'] === null && $item['report_count'] === null && $item['home_popup_count'] === null && $item['mail_status'] === 'skipped');
}
ok('backfill-no-mail-for-old', !array_filter(outboxRows(), static fn (array $row): bool => str_contains((string) $row['subject'], '2026-08-10')));
unset($beforeRows, $backfillMails);

$open = svc()->readReport('day', '2026-08-16', kst('2026-08-16 12:00:00'));
ok('in-progress', ($open['state'] ?? '') === 'in_progress');
$missing = svc()->readReport('day', '2024-01-02', kst('2026-08-16 12:00:00'));
ok('missing-row', ($missing['state'] ?? '') === 'missing');

function reportCount(PDO $pdo): int
{
    return (int) $pdo->query('SELECT COUNT(*) FROM admin_settlement_reports')->fetchColumn();
}

function startApi(array $extraEnv): void
{
    stopApi();
    $env = [
        'PATH' => (string) getenv('PATH'),
        'HOME' => (string) (getenv('HOME') ?: '/home/ubuntu'),
        'STUDY114_DB_HOST' => '127.0.0.1',
        'STUDY114_DB_PORT' => '3306',
        'STUDY114_DB_NAME' => 'study114',
        'STUDY114_DB_USER' => 'study114',
        'STUDY114_DB_PASS' => 'study114dev',
        'STUDY114_APP_ENV' => 'local',
        'STUDY114_MAIL_TRANSPORT' => 'fake',
        'STUDY114_MAIL_FROM' => 'no-reply@study114.local',
        'STUDY114_MAIL_FAKE_OUTBOX' => '/tmp/study114-162-outbox.jsonl',
        'STUDY114_HOME_UI' => 'http://127.0.0.1:5174',
        'STUDY114_REPORT_MAIL_TO' => 'report162@t162.test',
    ];
    foreach ($extraEnv as $key => $value) {
        if ($value === null) {
            unset($env[$key]);
        } else {
            $env[$key] = $value;
        }
    }
    $spec = [
        0 => ['file', '/dev/null', 'r'],
        1 => ['file', '/tmp/study114-162-php-s.log', 'a'],
        2 => ['file', '/tmp/study114-162-php-s.err', 'a'],
    ];
    $proc = proc_open('php -S 127.0.0.1:8091 -t public', $spec, $pipes, dirname(__DIR__), $env);
    $GLOBALS['api_proc'] = $proc;
    $ready = false;
    for ($i = 0; $i < 40; $i++) {
        $socket = @fsockopen('127.0.0.1', 8091, $errno, $err, 0.2);
        if (is_resource($socket)) {
            fclose($socket);
            $ready = true;
            break;
        }
        usleep(100000);
    }
    if (!$ready) {
        echo "FAIL  php-s-ready\n";
    }
}

function stopApi(): void
{
    if (isset($GLOBALS['api_proc']) && is_resource($GLOBALS['api_proc'])) {
        proc_terminate($GLOBALS['api_proc']);
        proc_close($GLOBALS['api_proc']);
        unset($GLOBALS['api_proc']);
    }
    exec("pkill -f 'php -S 127.0.0.1:8091' >/dev/null 2>&1");
    for ($i = 0; $i < 30; $i++) {
        $socket = @fsockopen('127.0.0.1', 8091, $errno, $err, 0.1);
        if (!is_resource($socket)) {
            return;
        }
        fclose($socket);
        usleep(100000);
    }
}

function httpCall(string $method, string $url, array $headers = []): array
{
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_TIMEOUT => 20,
    ]);
    $body = (string) curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    $json = json_decode($body, true);

    return ['status' => $status, 'body' => $body, 'json' => is_array($json) ? $json : []];
}

$goodKey = 'report-cron-key-0123456789abcdef';
$base = 'http://127.0.0.1:8091';

startApi(['STUDY114_REPORT_CRON_KEY' => null]);
$beforeN = reportCount($pdo);
$res = httpCall('POST', $base . '/api/cron/settlement-report.php');
ok('cron-unset-503', $res['status'] === 503 && reportCount($pdo) === $beforeN, (string) $res['status']);

startApi(['STUDY114_REPORT_CRON_KEY' => 'dev-cron-key']);
$beforeN = reportCount($pdo);
$res = httpCall('POST', $base . '/api/cron/settlement-report.php', ['X-Cron-Key: dev-cron-key']);
ok('cron-dev-503', $res['status'] === 503 && reportCount($pdo) === $beforeN, (string) $res['status']);

startApi(['STUDY114_REPORT_CRON_KEY' => '__STUDY114_REPORT_CRON_KEY__']);
$beforeN = reportCount($pdo);
$res = httpCall('POST', $base . '/api/cron/settlement-report.php', ['X-Cron-Key: __STUDY114_REPORT_CRON_KEY__']);
ok('cron-prefix-503', $res['status'] === 503 && reportCount($pdo) === $beforeN);

startApi(['STUDY114_REPORT_CRON_KEY' => str_repeat('a', 31)]);
$beforeN = reportCount($pdo);
$res = httpCall('POST', $base . '/api/cron/settlement-report.php', ['X-Cron-Key: ' . str_repeat('a', 31)]);
ok('cron-short-503', $res['status'] === 503 && reportCount($pdo) === $beforeN);

startApi(['STUDY114_REPORT_CRON_KEY' => $goodKey]);
$res = httpCall('GET', $base . '/api/cron/settlement-report.php', ['X-Cron-Key: ' . $goodKey]);
ok('cron-get-405', $res['status'] === 405, (string) $res['status']);
$beforeN = reportCount($pdo);
$res = httpCall('POST', $base . '/api/cron/settlement-report.php');
ok('cron-missing-key-403', $res['status'] === 403 && reportCount($pdo) === $beforeN, (string) $res['status']);
$res = httpCall('POST', $base . '/api/cron/settlement-report.php', ['X-Cron-Key: not-the-right-key-0123456789abcd']);
ok('cron-wrong-key-403', $res['status'] === 403 && reportCount($pdo) === $beforeN);
$res = httpCall('POST', $base . '/api/cron/settlement-report.php?key=' . rawurlencode($goodKey));
ok('cron-query-key-403', $res['status'] === 403 && reportCount($pdo) === $beforeN);
$res = httpCall('POST', $base . '/api/cron/settlement-report.php', ['X-Cron-Key: ' . $goodKey]);
ok('cron-good-200', $res['status'] === 200 && ($res['json']['ok'] ?? false) === true, $res['body']);

$adminId = userId($pdo, 'admin162@t162.test', 'active', 'super_admin');
addRole($pdo, $adminId, 'admin');
AuthSession::login($adminId, 'admin162@t162.test', 'admin', '운영', ['admin_level' => 'super_admin']);
$sid = session_id();
session_write_close();
$cookie = 'Cookie: PHPSESSID=' . $sid;

$res = httpCall('GET', $base . '/api/admin/settlement-report.php?period=day&date=2026-08-15');
ok('admin-anon-401', $res['status'] === 401 || $res['status'] === 403, (string) $res['status']);
$res = httpCall('GET', $base . '/api/admin/settlement-report.php?period=day&date=2026-08-15', [$cookie]);
ok('admin-get-200', $res['status'] === 200 && ($res['json']['report']['pay_count'] ?? null) === 5, $res['body']);
$firstBody = $res['body'];
$res = httpCall('GET', $base . '/api/admin/settlement-report.php?period=day&date=2026-08-15', [$cookie]);
ok('admin-get-bytes', $res['body'] === $firstBody);
$res = httpCall('POST', $base . '/api/admin/settlement-report.php', [$cookie]);
ok('admin-post-405', $res['status'] === 405, (string) $res['status']);
$res = httpCall('PATCH', $base . '/api/admin/settlement-lines.php?period=day&date=2026-08-15&line=pay', [$cookie]);
ok('admin-patch-405', $res['status'] === 405, (string) $res['status']);

$lineQuery = new SettlementLinesQuery($pdo);
$guestPage = $lineQuery->page([
    'snapshot_json' => [
        'tz' => ['db_offset_min' => 540, 'php_tz' => 'Asia/Seoul'],
        'inquiry' => [[
            'ticket_no' => 'G1',
            'created_at' => '2026-08-15 01:00:00',
            'category' => 'bug',
            'status' => 'open',
            'role_type' => 'guest',
        ]],
    ],
], 'inquiry', 1);
ok('lines-role-guest', ($guestPage['items'][0]['role'] ?? '') === '비회원', (string) ($guestPage['items'][0]['role'] ?? ''));
$parentPage = $lineQuery->page([
    'snapshot_json' => [
        'inquiry' => [[
            'ticket_no' => 'P1',
            'created_at' => '2026-08-15 01:00:00',
            'category' => 'bug',
            'status' => 'open',
            'role_type' => 'parent',
        ]],
    ],
], 'inquiry', 1);
ok('lines-role-parent', ($parentPage['items'][0]['role'] ?? '') === '학생', (string) ($parentPage['items'][0]['role'] ?? ''));
$popupPage = $lineQuery->page([
    'snapshot_json' => [
        'popup' => [
            ['id' => 1, 'type' => 'notice', 'start_at' => '2026-08-01', 'end_at' => '2026-08-31'],
            ['id' => 2, 'type' => 'event', 'start_at' => '2026-08-01', 'end_at' => '2026-08-31'],
            ['id' => 3, 'type' => 'ad', 'start_at' => '2026-08-01', 'end_at' => '2026-08-31'],
        ],
    ],
], 'popup', 1);
$popupTypes = array_map(static fn (array $item): string => (string) ($item['type'] ?? ''), $popupPage['items']);
ok('lines-popup-ko', $popupTypes === ['공지', '이벤트', '광고'], implode(',', $popupTypes));

foreach ([
    'abc' => 'abc',
    '2026-13-45' => 'badcal',
    '2026-02-30' => 'feb30',
] as $badDate => $tag) {
    $res = httpCall('GET', $base . '/api/admin/settlement-report.php?period=day&date=' . rawurlencode($badDate), [$cookie]);
    ok(
        'report-date-' . $tag . '-422',
        $res['status'] === 422 && ($res['json']['error'] ?? '') === 'validation' && !str_contains($res['body'], 'Failed to parse'),
        $res['status'] . ' ' . $res['body']
    );
    $res = httpCall('GET', $base . '/api/admin/settlement-lines.php?period=day&date=' . rawurlencode($badDate) . '&line=pay', [$cookie]);
    ok(
        'lines-date-' . $tag . '-422',
        $res['status'] === 422 && ($res['json']['error'] ?? '') === 'validation' && !str_contains($res['body'], 'Failed to parse'),
        $res['status'] . ' ' . $res['body']
    );
}
$res = httpCall('GET', $base . '/api/admin/settlement-report.php?period=month&date=2026-02', [$cookie]);
ok('report-month-ym-200', $res['status'] === 200 && ($res['json']['report']['pay_count'] ?? null) === 1, $res['body']);

$pdo->exec('RENAME TABLE admin_settlement_reports TO admin_settlement_reports_off');
try {
    $res = httpCall('GET', $base . '/api/admin/settlement-report.php?period=day&date=2026-08-15', [$cookie]);
    ok('schema-missing', $res['status'] === 503 && ($res['json']['error'] ?? '') === 'schema_missing', $res['body']);
} finally {
    $pdo->exec('RENAME TABLE admin_settlement_reports_off TO admin_settlement_reports');
}

stopApi();

echo "\n" . ($fail === 0 ? 'OK' : 'FAIL') . "  pass={$pass} fail={$fail}\n";
exit($fail === 0 ? 0 : 1);
