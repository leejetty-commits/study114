<?php

declare(strict_types=1);

/**
 * 관리자 「회원 메일」 검증 — 종류별 켜고 끄기 · 다시 켜도 몰아서 안 보냄 · 미리보기 · 시험 발송 · 최근 7일 수 (실메일·운영 DB 없음)
 *
 * 실행: php -d extension=pdo_sqlite scripts/verify-member-mail-admin.php
 */

$root = dirname(__DIR__);
$tmp = rtrim(sys_get_temp_dir(), '/\\');

$env = [
    'STUDY114_APP_ENV' => 'local',
    'STUDY114_MAIL_FROM' => 'no-reply@study114.net',
    'STUDY114_MAIL_TRANSPORT' => 'fake',
    'STUDY114_MAIL_FAKE_MODE' => 'success',
    'STUDY114_MAIL_LOG_PATH' => $tmp . '/study114-mail-admin-test.log',
    'STUDY114_MAIL_FAKE_OUTBOX' => $tmp . '/study114-mail-admin-outbox.jsonl',
];
foreach ($env as $k => $v) {
    putenv($k . '=' . $v);
    $_ENV[$k] = $v;
    $_SERVER[$k] = $v;
}

require_once $root . '/src/bootstrap.php';

use Study114\Auth\AuthMailer;
use Study114\Mail\MailSendResult;
use Study114\Mail\MailTransport;
use Study114\Mail\MemberLifecycleMailer;
use Study114\Mail\MemberMailAdminService as A;
use Study114\Mail\MemberMailScheduler as S;
use Study114\Mail\MemberMailSettings as M;
use Study114\Paid\PositionPeriodCalculator;

$failed = 0;
$passed = 0;

function check(bool $cond, string $msg): void
{
    global $failed, $passed;
    if ($cond) {
        echo "PASS: {$msg}\n";
        $passed++;
    } else {
        echo "FAIL: {$msg}\n";
        $failed++;
        fwrite(STDERR, "ASSERT_FAIL {$msg}\n");
    }
}

/** @param callable(): mixed $fn */
function throwsMessage(callable $fn): string
{
    try {
        $fn();
    } catch (\Throwable $e) {
        return get_class($e) . ':' . $e->getMessage();
    }

    return '';
}

final class RecordingTransport implements MailTransport
{
    /** @var list<array<string, mixed>> */
    public array $sent = [];

    public function __construct(public string $mode = 'success')
    {
    }

    public function send(array $message): MailSendResult
    {
        if ($this->mode !== 'success') {
            return MailSendResult::failure('resend_error', 'fail');
        }
        $this->sent[] = $message;

        return MailSendResult::success('ok', 'm' . count($this->sent));
    }
}

function adminDb(bool $withSettings = true): PDO
{
    $pdo = new PDO('sqlite::memory:');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    if ($withSettings) {
        $pdo->exec('CREATE TABLE site_settings (setting_key TEXT PRIMARY KEY, value_json TEXT NOT NULL,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_by TEXT)');
    }
    $pdo->exec('CREATE TABLE users (id INTEGER PRIMARY KEY, email TEXT, status TEXT, email_verified_at TEXT, created_at TEXT)');
    $pdo->exec('CREATE TABLE user_roles (id INTEGER PRIMARY KEY, user_id INTEGER, role_type TEXT, is_primary INTEGER, status TEXT)');
    $pdo->exec("CREATE TABLE provider_reminder_dispatches (id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL,
        channel TEXT NOT NULL, reminder_kind TEXT NOT NULL, dedupe_key TEXT NOT NULL UNIQUE, sent_at TEXT DEFAULT CURRENT_TIMESTAMP)");
    $pdo->exec('CREATE TABLE study_rooms (id INTEGER PRIMARY KEY, user_id INTEGER, study_room_name TEXT, profile_status TEXT, published_at TEXT)');
    $pdo->exec('CREATE TABLE tutors (id INTEGER PRIMARY KEY, user_id INTEGER, profile_status TEXT, published_at TEXT)');
    $pdo->exec('CREATE TABLE students (id INTEGER PRIMARY KEY, guardian_user_id INTEGER, exposure_status TEXT, published_at TEXT)');
    $pdo->exec('CREATE TABLE provider_position_subscriptions (id INTEGER PRIMARY KEY, user_id INTEGER, sku_code TEXT,
        provider_type TEXT, provider_id INTEGER, started_on TEXT, end_exclusive_on TEXT)');
    $pdo->exec("CREATE TABLE admin_operation_logs (id INTEGER PRIMARY KEY, log_key TEXT, operator_id TEXT, target_type TEXT, target_id TEXT,
        action_kind TEXT, reason_category TEXT, detail_memo TEXT, reversible INTEGER, revert_history TEXT, user_notified INTEGER,
        acted_at TEXT DEFAULT (datetime('now', '+9 hours')))");

    return $pdo;
}

function addMember(PDO $pdo, int $id, string $email, string $created, string $role): void
{
    $pdo->prepare('INSERT INTO users (id, email, status, email_verified_at, created_at) VALUES (?, ?, ?, ?, ?)')
        ->execute([$id, $email, 'active', $created, $created]);
    $pdo->prepare('INSERT INTO user_roles (user_id, role_type, is_primary, status) VALUES (?, ?, 1, ?)')->execute([$id, $role, 'active']);
}

$tz = PositionPeriodCalculator::timezone();
$now = new DateTimeImmutable((new DateTimeImmutable('now', $tz))->format('Y-m-d') . ' 10:00:00', $tz);
$ago = static fn (string $mod): string => $now->modify($mod)->format('Y-m-d H:i:s');
$cfg = ['home_ui' => 'https://study114.net', 'lifecycle_mail_enabled' => true];

// ── 1. 종류별 켜고 끄기 저장 ──
$pdo = adminDb();
$pdo->prepare('INSERT INTO site_settings (setting_key, value_json) VALUES (?, ?)')->execute(['bundle', '{"siteName":"우동공과"}']);
$settings = new M($pdo);
check(array_keys($settings->all()) === M::KINDS, 'settings: 종류 5개(카드 게시·구매 감사·안부·마무리·탈퇴)');
check(array_reduce(M::KINDS, static fn (bool $c, string $k): bool => $c && $settings->isEnabled($k), true), 'settings: 저장한 적 없으면 모두 켜짐');
check($settings->enabledSince(M::WELCOME_WEEK) === null, 'settings: 처음엔 다시 켠 시각 없음');

$settings->setEnabled(M::WELCOME_WEEK, false, 'master@example.com');
$fresh = new M($pdo);
check($fresh->isEnabled(M::WELCOME_WEEK) === false && $fresh->isEnabled(M::POSITION_ENDING), 'settings: 안부만 멈춤(다른 종류는 그대로)');
check($fresh->all()[M::WELCOME_WEEK]['changed_by'] === 'master@example.com' && $fresh->all()[M::WELCOME_WEEK]['changed_at'] !== null, 'settings: 바꾼 사람·시각 남음');
check($fresh->enabledSince(M::WELCOME_WEEK) === null, 'settings: 멈출 때는 다시 켠 시각을 만들지 않음');
$fresh->setEnabled(M::WELCOME_WEEK, true, 'master@example.com');
$again = new M($pdo);
check($again->isEnabled(M::WELCOME_WEEK) && $again->enabledSince(M::WELCOME_WEEK) !== null, 'settings: 다시 켜면 그 시각(KST) 저장');
$since = $again->enabledSince(M::WELCOME_WEEK);
$again->setEnabled(M::WELCOME_WEEK, true, 'other@example.com');
check((new M($pdo))->enabledSince(M::WELCOME_WEEK) === $since && (new M($pdo))->all()[M::WELCOME_WEEK]['changed_by'] === 'master@example.com',
    'settings: 이미 켜진 것을 또 켜면 아무것도 안 바뀜');
check($pdo->query("SELECT value_json FROM site_settings WHERE setting_key = 'bundle'")->fetchColumn() === '{"siteName":"우동공과"}', 'settings: 사이트 기본(bundle) 행은 건드리지 않음');
check(str_contains(throwsMessage(static fn () => $again->setEnabled('sms', false, 'x')), 'InvalidArgumentException'), 'settings: 모르는 종류 → 거절');

$noTable = adminDb(false);
$nt = new M($noTable);
check($nt->isEnabled(M::CARD_POSTED) && $nt->isEnabled(M::WELCOME_WEEK), 'settings: 설정 테이블 없음 → 모두 켜짐으로 읽음');
check(throwsMessage(static fn () => $nt->setEnabled(M::CARD_POSTED, false, 'x')) === 'RuntimeException:' . M::SCHEMA_MISSING, 'settings: 설정 테이블 없음 → 저장은 schema_missing');

// ── 2. 멈춘 종류는 보내지 않음 ──
$pdoM = adminDb();
addMember($pdoM, 1, 'parent1@example.com', $ago('-8 days'), 'guardian_student');
addMember($pdoM, 2, 'room2@example.com', $ago('-40 days'), 'study_room_owner');
$pdoM->prepare('INSERT INTO study_rooms VALUES (?, ?, ?, ?, ?)')->execute([21, 2, '해솔공부방', 'published', $ago('-40 days')]);
$pdoM->prepare('INSERT INTO provider_position_subscriptions VALUES (?, ?, ?, ?, ?, ?, ?)')
    ->execute([501, 2, 'prime', 'study_room', 21, $now->modify('-27 days')->format('Y-m-d'), $now->modify('+3 days')->format('Y-m-d')]);
$setM = new M($pdoM);
$setM->setEnabled(M::WELCOME_WEEK, false, 'master@example.com');
$tM = new RecordingTransport();
$mailerM = new MemberLifecycleMailer($pdoM, new AuthMailer($tM), $cfg);
check($mailerM->sendWelcomeWeek(1) === 'skipped:paused', 'paused: 멈춘 안부 → skipped:paused');
check((int) $pdoM->query('SELECT COUNT(*) FROM provider_reminder_dispatches')->fetchColumn() === 0, 'paused: 발송 기록도 안 남음(다시 켜도 자동으로 다시 보내지 않음)');
$rM = (new S($pdoM, $mailerM))->run($now);
check($rM['sent'] === 1 && ($rM['by_kind']['welcome_week'] ?? []) === [] && ($rM['by_kind']['position_ending']['sent'] ?? 0) === 1,
    'paused: 스케줄러는 멈춘 안부 대상을 고르지 않고 마무리 3일 전만 보냄');
$setM->setEnabled(M::POSITION_ENDING, false, 'master@example.com');
check((new S($pdoM, new MemberLifecycleMailer($pdoM, new AuthMailer($tM), $cfg)))->run($now->setTime(11, 7))['reason'] === 'paused',
    'paused: 둘 다 멈추면 스케줄러는 아무것도 안 함');
$setM->setEnabled(M::CARD_POSTED, false, 'master@example.com');
check((new MemberLifecycleMailer($pdoM, new AuthMailer($tM), $cfg))->afterBasicRegister(2, 'study_room_owner', 21) === 'skipped:paused', 'paused: 카드 게시 환영도 같은 스위치');

// ── 3. 다시 켜도 몰아서 보내지 않음 ──
$pdoR = adminDb();
addMember($pdoR, 1, 'before@example.com', $ago('-9 days'), 'guardian_student');
addMember($pdoR, 2, 'edge@example.com', $ago('-7 days -2 hours'), 'guardian_student');
addMember($pdoR, 3, 'after@example.com', $ago('-7 days'), 'guardian_student');
$enabledAt = $ago('-1 hour');
$pdoR->prepare('INSERT INTO site_settings (setting_key, value_json) VALUES (?, ?)')->execute([M::KEY, json_encode(['kinds' => [
    M::WELCOME_WEEK => ['enabled' => true, 'enabled_at' => $enabledAt, 'changed_at' => $enabledAt, 'changed_by' => 'master@example.com'],
]])]);
$tR = new RecordingTransport();
$rR = (new S($pdoR, new MemberLifecycleMailer($pdoR, new AuthMailer($tR), $cfg)))->run($now);
$toR = array_map(static fn (array $m): string => (string) $m['to'], $tR->sent);
check($toR === ['after@example.com'], 'resume: 다시 켠 뒤에 가입 7일이 된 회원만 보냄(꺼져 있던 동안 7일이 된 회원은 안 보냄) — ' . implode(',', $toR));
check($rR['sent'] === 1, 'resume: 1통');

// ── 4. 관리자 화면 — 최근 7일 수 · 미리보기 · 시험 발송 · 켜고 끄기 기록 ──
$pdoA = adminDb();
$ins = $pdoA->prepare('INSERT INTO provider_reminder_dispatches (user_id, channel, reminder_kind, dedupe_key, sent_at) VALUES (1, ?, ?, ?, ?)');
$ins->execute(['email', MemberLifecycleMailer::KIND_WELCOME_WEEK, 'a1', $ago('-1 day')]);
$ins->execute(['email', MemberLifecycleMailer::KIND_WELCOME_WEEK, 'a2', $ago('-6 days -23 hours')]);
$ins->execute(['email', MemberLifecycleMailer::KIND_WELCOME_WEEK, 'a3', $ago('-8 days')]);
$ins->execute(['email', MemberLifecycleMailer::KIND_CARD_POSTED, 'a4', $ago('-2 hours')]);
$ins->execute(['sms', 'position_expiry_d3', 'a5', $ago('-1 hour')]);
$ins->execute(['email', 'ticket_pack_expiry_d7', 'a6', $ago('-1 hour')]);
$tA = new RecordingTransport();
$setA = new M($pdoA);
$svc = new A($pdoA, $setA, $cfg, new AuthMailer($tA), $now);
$view = $svc->view(true, 'master@example.com');
$byId = array_column($view['kinds'], null, 'id');
check(array_column($view['kinds'], 'id') === M::KINDS, 'view: 5종 순서대로');
check($byId[M::WELCOME_WEEK]['sent_7d'] === 2 && $byId[M::CARD_POSTED]['sent_7d'] === 1 && $byId[M::POSITION_ENDING]['sent_7d'] === 0,
    'view: 최근 7일 보낸 수(7일 지난 것·문자·다른 안내 제외)');
check($view['can_edit'] === true && $view['lifecycle_enabled'] === true && $view['daily_cap'] === S::DAILY_CAP && $view['test_left'] === A::TEST_DAILY_LIMIT,
    'view: 수정 가능·전체 스위치·하루 한도·시험 남은 수');
check($svc->view(false, 'sub@example.com')['can_edit'] === false, 'view: 최고관리자가 아니면 수정 불가 표시');
check((new A($pdoA, $setA, ['lifecycle_mail_enabled' => false] + $cfg, null, $now))->view(true, 'x')['lifecycle_enabled'] === false, 'view: 서버 전체 스위치 꺼짐 표시');

$count = 0;
foreach (A::VARIANTS as $kind => $variants) {
    foreach ($variants as $variant) {
        $mail = $svc->preview($kind, $variant);
        $ok = str_starts_with($mail['subject'], '[우동공과] ') && str_contains($mail['plain'], '— 우동공과 드림')
            && !preg_match('/[{}]|%s/', $mail['subject'] . $mail['plain']) && str_contains($mail['html'], '<html');
        check($ok, "preview: {$kind}/{$variant} 실제 문안 함수로 만듦");
        $count++;
    }
}
check($count === 18, 'preview: 견본 18개');
check($svc->preview(M::POSITION_ENDING, '') === $svc->preview(M::POSITION_ENDING, 'study_room_prime'), 'preview: 견본을 안 고르면 첫 번째');
check(str_contains($svc->preview(M::POSITION_ENDING, 'tutor_prime')['plain'], '과외쌤 찾기 가장 앞자리'), 'preview: 과외쌤 Prime 문구(정본 74 §5)');
check(str_contains($svc->preview(M::WELCOME_WEEK, 'no_card')['subject'], '카드 한 장이면'), 'preview: 카드 없는 견본 = 등록 안내');
check(str_contains(throwsMessage(static fn () => $svc->preview(M::WELCOME_WEEK, 'study_room_prime')), 'InvalidArgumentException'), 'preview: 종류에 없는 견본 → 거절');
check(str_contains(throwsMessage(static fn () => $svc->preview('password_reset', '')), 'InvalidArgumentException'), 'preview: 계정 메일은 이 화면 밖');

$to = $svc->sendTest(M::WELCOME_WEEK, 'tutor', 'Master@Example.com');
check($to === 'Master@Example.com' && count($tA->sent) === 1, 'test: 운영자 본인 주소로 1통');
check(str_starts_with((string) $tA->sent[0]['subject'], '[시험] [우동공과] '), 'test: 제목 앞에 [시험]');
check((string) $tA->sent[0]['subject'] === '[시험] ' . $svc->preview(M::WELCOME_WEEK, 'tutor')['subject'], 'test: 미리보기와 같은 메일');
check((int) $pdoA->query("SELECT COUNT(*) FROM provider_reminder_dispatches WHERE dedupe_key NOT LIKE 'a%'")->fetchColumn() === 0, 'test: 회원 발송 기록·하루 한도에 안 들어감');
check($svc->view(true, 'Master@Example.com')['test_left'] === A::TEST_DAILY_LIMIT - 1, 'test: 오늘 남은 시험 횟수 줄어듦');
check(str_contains(throwsMessage(static fn () => $svc->sendTest(M::WELCOME_WEEK, '', 'oauth_kakao_1@example.com')), 'InvalidArgumentException'), 'test: 내부 주소 운영자 → 거절');
check(str_contains(throwsMessage(static fn () => $svc->sendTest(M::WELCOME_WEEK, '', '')), 'InvalidArgumentException'), 'test: 주소 없음 → 거절');
$logIns = $pdoA->prepare("INSERT INTO admin_operation_logs (operator_id, action_kind, acted_at) VALUES ('busy@example.com', ?, ?)");
for ($i = 0; $i < A::TEST_DAILY_LIMIT; $i++) {
    $logIns->execute([A::LOG_TEST, $now->format('Y-m-d') . ' 09:00:00']);
}
$logIns->execute([A::LOG_TEST, $now->modify('-1 day')->format('Y-m-d') . ' 23:00:00']);
check(throwsMessage(static fn () => $svc->sendTest(M::CARD_POSTED, '', 'busy@example.com')) === 'RuntimeException:test_limit', 'test: 하루 ' . A::TEST_DAILY_LIMIT . '번 넘으면 거절(어제 기록은 안 셈)');
$failSvc = new A($pdoA, $setA, $cfg, new AuthMailer(new RecordingTransport('fail')), $now);
check(throwsMessage(static fn () => $failSvc->sendTest(M::CARD_POSTED, '', 'fail@example.com')) === 'RuntimeException:send_failed', 'test: 발송 실패 → send_failed');
check((int) $pdoA->query("SELECT COUNT(*) FROM admin_operation_logs WHERE operator_id = 'fail@example.com'")->fetchColumn() === 0, 'test: 실패한 시험은 횟수에 안 셈');

$svc->setEnabled(M::POSITION_ENDING, false, 'master@example.com');
$svc->setEnabled(M::POSITION_ENDING, false, 'master@example.com');
$svc->setEnabled(M::POSITION_ENDING, true, 'master@example.com');
$memos = $pdoA->query("SELECT detail_memo FROM admin_operation_logs WHERE action_kind = '" . A::LOG_TOGGLE . "' ORDER BY id")->fetchAll(PDO::FETCH_COLUMN);
check($memos === ['position_ending 멈춤', 'position_ending 보내는 중'], 'toggle: 운영 로그에 바뀐 것만 남김');

// ── 5. API·화면 (정적) ──
$api = (string) file_get_contents($root . '/public/api/admin/member-mail.php');
check(str_contains($api, 'AdminApi::requireAdmin()'), 'api: 운영자만');
$patchPos = strpos($api, "if (\$method === 'PATCH')");
check($patchPos !== false && strpos($api, 'AdminApi::requireMaster($auth)', $patchPos) !== false
    && strpos($api, 'AdminApi::requireMaster($auth)', $patchPos) < strpos($api, '$service->setEnabled', $patchPos), 'api: 켜고 끄기는 최고관리자 확인 뒤');
check(str_contains($api, "'test_limit' => AdminApi::fail(429") && str_contains($api, "MemberMailSettings::SCHEMA_MISSING => AdminApi::fail(503"), 'api: 시험 한도 429 · 테이블 없음 503');

$copy = (string) file_get_contents($root . '/preview/home-ui/src/admin/a28-member-mail-copy.js');
foreach ([
    '우동공과 편지를 종류별로 켜고 끄고, 미리 보고, 내 메일로 시험 발송해요.',
    '보내기를 멈출까요? 멈춘 동안에는 이 메일이 나가지 않고, 다시 켜도 지난 메일을 몰아서 보내지 않아요.',
    '로 보냈어요. 제목 앞에 [시험]이 붙어요.',
    '이메일 확인·비밀번호 재설정 메일은 회원 안전을 위해 끌 수 없어요.',
    "stateOn: '보내는 중'", "stateOff: '멈춤'", "colWhen: '언제 보내나요'", "colWho: '받는 사람'", "colSent: '최근 7일 보낸 수'",
    "test: '내 메일로 시험 보내기'",
] as $phrase) {
    check(str_contains($copy, $phrase), 'copy: 승인 문구 「' . $phrase . '」');
}
foreach (M::KINDS as $kind) {
    check(str_contains($copy, "  {$kind}: {"), "copy: 종류 {$kind} 이름·언제·누구");
}
foreach (array_unique(array_merge(...array_values(A::VARIANTS))) as $variant) {
    check(str_contains($copy, "  {$variant}: '"), "copy: 견본 {$variant} 이름");
}
$menu = (string) file_get_contents($root . '/preview/home-ui/src/admin/a28-copy.js');
check(str_contains($menu, "path: '/admin/notify/member-mail'") && strpos($menu, "label: '회원 메일'") < strpos($menu, "label: '문자 기본설정'"), 'menu: 알림·문자 맨 위 「회원 메일」');
check(!preg_match("/ADMIN_PREVIEW_PATHS = Object\\.freeze\\(\\[[^\\]]*member-mail/s", $menu), 'menu: 연습용 화면 목록에 넣지 않음(실제 화면)');
$screens = (string) file_get_contents($root . '/preview/home-ui/src/admin/a28-screens.js');
$bind = (string) file_get_contents($root . '/preview/home-ui/src/admin/a28-screens-bind.js');
check(strpos($screens, 'path === MEMBER_MAIL_PATH') < strpos($screens, "path.startsWith('/admin/notify/')"), 'screen: 연습용 알림 화면보다 먼저 연결');
check(str_contains($bind, 'if (path === MEMBER_MAIL_PATH) bindMemberMail(root);'), 'screen: 이벤트 연결');
$ui = (string) file_get_contents($root . '/preview/home-ui/src/admin/a28-member-mail.js');
check(str_contains($ui, 'sandbox=""') && str_contains($ui, 'frame.srcdoc'), 'screen: 미리보기는 스크립트 없는 iframe');
check(str_contains($ui, 'window.confirm(C.confirmPause(name))') && str_contains($ui, "if (!enable && !window.confirm"), 'screen: 멈출 때만 확인 창');
check(str_contains($ui, 'status === 429') && str_contains($ui, 'status === 403') && str_contains($ui, 'status === 503'), 'screen: 닷홈이 4xx 본문을 바꿔도 상태 코드로 안내');

$doc = (string) @file_get_contents($root . '/docs/internal/74-member-mail-lock.md');
check(str_contains($doc, 'MemberMailSettings') && str_contains($doc, '/api/admin/member-mail.php')
    && str_contains($doc, 'enabled_at') && str_contains($doc, A::TEST_DAILY_LIMIT . '번'), '정본 74: 종류별 스위치·켠 시각·시험 한도 기록');

echo "\nSUMMARY passed={$passed} failed={$failed}\n";
exit($failed > 0 ? 1 : 0);
