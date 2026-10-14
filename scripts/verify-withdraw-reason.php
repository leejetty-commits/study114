<?php

declare(strict_types=1);

/**
 * 탈퇴 사유 받기 검증 (정본 74 §1-4 · SQL 080) — 누가 남겼는지 모르게 저장 · 메일 링크 한 번만 · 30일 · 표 없을 때 · 메일 덧붙임 · 관리자 모음
 * 실메일·운영 DB 없음.
 *
 * 실행: php -d extension=pdo_sqlite scripts/verify-withdraw-reason.php
 */

$root = dirname(__DIR__);
$tmp = rtrim(sys_get_temp_dir(), '/\\');

$env = [
    'STUDY114_APP_ENV' => 'local',
    'STUDY114_MAIL_FROM' => 'no-reply@study114.net',
    'STUDY114_MAIL_TRANSPORT' => 'fake',
    'STUDY114_MAIL_FAKE_MODE' => 'success',
    'STUDY114_MAIL_LOG_PATH' => $tmp . '/study114-withdraw-reason-test.log',
    'STUDY114_MAIL_FAKE_OUTBOX' => $tmp . '/study114-withdraw-reason-outbox.jsonl',
];
foreach ($env as $k => $v) {
    putenv($k . '=' . $v);
    $_ENV[$k] = $v;
    $_SERVER[$k] = $v;
}

require_once $root . '/src/bootstrap.php';

use Study114\Auth\AuthMailer;
use Study114\Auth\WithdrawReasonService as W;
use Study114\Mail\MailSendResult;
use Study114\Mail\MailTransport;
use Study114\Mail\MemberLifecycleMailer;
use Study114\Mail\MemberLifecycleMailTemplate as T;
use Study114\Mail\MemberMailAdminService as A;
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

    public function send(array $message): MailSendResult
    {
        $this->sent[] = $message;

        return MailSendResult::success('ok', 'm' . count($this->sent));
    }
}

function reasonDb(bool $withReasonTables = true): PDO
{
    $pdo = new PDO('sqlite::memory:');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    if ($withReasonTables) {
        $pdo->exec("CREATE TABLE withdraw_reasons (id INTEGER PRIMARY KEY, role_type TEXT NOT NULL DEFAULT '', reason_code TEXT NOT NULL,
            reason_note TEXT, source TEXT NOT NULL, answered_on TEXT NOT NULL)");
        $pdo->exec("CREATE TABLE withdraw_reason_links (id INTEGER PRIMARY KEY, token_hash TEXT NOT NULL UNIQUE,
            role_type TEXT NOT NULL DEFAULT '', expires_at TEXT NOT NULL)");
    }
    $pdo->exec('CREATE TABLE site_settings (setting_key TEXT PRIMARY KEY, value_json TEXT NOT NULL, updated_at TEXT, updated_by TEXT)');
    $pdo->exec('CREATE TABLE users (id INTEGER PRIMARY KEY, email TEXT, status TEXT, email_verified_at TEXT, created_at TEXT)');
    $pdo->exec('CREATE TABLE user_roles (id INTEGER PRIMARY KEY, user_id INTEGER, role_type TEXT, is_primary INTEGER, status TEXT)');
    $pdo->exec("CREATE TABLE provider_reminder_dispatches (id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL,
        channel TEXT NOT NULL, reminder_kind TEXT NOT NULL, dedupe_key TEXT NOT NULL UNIQUE, sent_at TEXT DEFAULT CURRENT_TIMESTAMP)");

    return $pdo;
}

$tz = PositionPeriodCalculator::timezone();
$now = new DateTimeImmutable((new DateTimeImmutable('now', $tz))->format('Y-m-d') . ' 10:00:00', $tz);
$today = $now->format('Y-m-d');
$cfg = ['home_ui' => 'https://study114.net', 'lifecycle_mail_enabled' => true];

// ── 1. 선택지 · 받은 값 정리 ──
check(W::codesFor('student') === ['found_teacher', 'no_match', 'inconvenient', 'other_service', 'taking_break', 'other'], 'codes: 학생·학부모 2 + 공통 4');
check(W::codesFor('study_room') === ['enough_students', 'no_inquiry', 'cost', 'inconvenient', 'other_service', 'taking_break', 'other'], 'codes: 공부방 3 + 공통 4');
check(W::codesFor('tutor') === W::codesFor('study_room'), 'codes: 과외쌤 = 공부방과 같은 선택지(문구만 다름)');
check(W::codesFor('') === W::COMMON_CODES, 'codes: 역할 모름 → 공통만');
check(count(W::allCodes()) === 9 && count(array_unique(W::allCodes())) === 9, 'codes: 모두 9개, 겹침 없음');

check(W::normalizeAnswer('cost', 'x') === ['code' => 'cost', 'note' => null], 'answer: 기타가 아니면 한 줄은 버림');
check(W::normalizeAnswer('other', "  첫 줄\n둘째\t줄  ") === ['code' => 'other', 'note' => '첫 줄 둘째 줄'], 'answer: 기타 한 줄 — 줄바꿈·탭 → 공백, 앞뒤 공백 제거');
check(W::normalizeAnswer('other', '   ') === ['code' => 'other', 'note' => null], 'answer: 기타만 고르고 비우면 한 줄 없음');
$long = W::normalizeAnswer('other', str_repeat('가', 130));
check($long !== null && $long['note'] === str_repeat('가', 100), 'answer: 한 줄은 100자까지(한글 글자 단위)');
check(W::normalizeAnswer('', null) === null && W::normalizeAnswer(null, null) === null, 'answer: 안 고름 → null');
check(W::normalizeAnswer('hack', 'x') === null && W::normalizeAnswer(['cost'], null) === null, 'answer: 모르는 선택지·배열 → null(고르지 않은 것으로)');

// ── 2. 탈퇴 화면 사유 저장 — 누가 남겼는지 모르게 ──
$pdo = reasonDb();
$svc = new W($pdo, $now);
check($svc->record('study_room', 'cost', null, W::SOURCE_WITHDRAW), 'record: 저장');
check($svc->record('tutor', 'other', '시간이 없어요', W::SOURCE_WITHDRAW), 'record: 기타 한 줄 저장');
$row = $pdo->query('SELECT * FROM withdraw_reasons ORDER BY id LIMIT 1')->fetch();
check(array_keys($row) === ['id', 'role_type', 'reason_code', 'reason_note', 'source', 'answered_on'], 'record: 회원 번호·이메일 칸 없음');
check($row['answered_on'] === $today && strlen((string) $row['answered_on']) === 10, 'record: 날짜(KST)만 — 시각 없음');
check($svc->record('admin', 'cost', null, W::SOURCE_WITHDRAW) && $pdo->query('SELECT role_type FROM withdraw_reasons ORDER BY id DESC LIMIT 1')->fetchColumn() === '',
    'record: 회원 역할이 아니면 역할 빈 값');
check(!$svc->record('study_room', 'hack', null, W::SOURCE_WITHDRAW) && !$svc->record('study_room', 'cost', null, 'web'), 'record: 모르는 선택지·경로 → 저장 안 함(false)');
check((new W(reasonDb(false), $now))->record('study_room', 'cost', null, W::SOURCE_WITHDRAW) === false, 'record: 표 없음(080 전) → false, 예외 없음');

// ── 3. 메일 링크 — 30일 · 한 번만 · 원래 값은 DB에 없음 ──
$pdoL = reasonDb();
$svcL = new W($pdoL, $now);
$token = $svcL->issueLink('tutor');
check(is_string($token) && W::isToken($token), 'link: 64자 링크 값');
$link = $pdoL->query('SELECT * FROM withdraw_reason_links')->fetch();
check($link['token_hash'] === hash('sha256', (string) $token) && !str_contains(json_encode($link), (string) $token), 'link: DB에는 sha256만(원래 값 없음)');
check(array_keys($link) === ['id', 'token_hash', 'role_type', 'expires_at'], 'link: 회원 번호·이메일 칸 없음');
check($link['expires_at'] === $now->modify('+30 days')->format('Y-m-d H:i:s'), 'link: 만든 때 + 30일');
check($svcL->peekLink((string) $token) === ['role' => 'tutor'], 'link: 열면 역할(선택지 고르기용)');
check($svcL->peekLink(str_repeat('a', 64)) === null && $svcL->peekLink('short') === null, 'link: 없는 값·형식 틀림 → null');
check($svcL->answerLink((string) $token, 'hack', null) === null && $svcL->peekLink((string) $token) !== null, 'link: 선택지가 틀리면 링크를 쓰지 않음');
check($svcL->answerLink((string) $token, 'no_inquiry', null) === true, 'link: 사유 저장');
$saved = $pdoL->query('SELECT * FROM withdraw_reasons')->fetch();
check($saved['role_type'] === 'tutor' && $saved['reason_code'] === 'no_inquiry' && $saved['source'] === W::SOURCE_MAIL && $saved['answered_on'] === $today,
    'link: 역할은 링크에서, 경로 = mail');
check((int) $pdoL->query('SELECT COUNT(*) FROM withdraw_reason_links')->fetchColumn() === 0, 'link: 쓰면 링크 행을 지움');
check($svcL->answerLink((string) $token, 'cost', null) === false && $svcL->peekLink((string) $token) === null, 'link: 두 번째는 쓸 수 없음');
check((int) $pdoL->query('SELECT COUNT(*) FROM withdraw_reasons')->fetchColumn() === 1, 'link: 두 번째 답은 저장 안 됨');

$old = $svcL->issueLink('student');
$later = new W($pdoL, $now->modify('+30 days'));
check($later->peekLink((string) $old) !== null, 'link: 30일째(만료 시각)까지는 열림');
$after = new W($pdoL, $now->modify('+30 days +1 second'));
check($after->peekLink((string) $old) === null && $after->answerLink((string) $old, 'cost', null) === false, 'link: 30일이 지나면 열리지 않고 저장 안 됨');
$after->issueLink('student');
check((int) $pdoL->query('SELECT COUNT(*) FROM withdraw_reason_links')->fetchColumn() === 1, 'link: 새 링크를 만들 때 지난 링크를 지움');

$noTable = new W(reasonDb(false), $now);
check($noTable->issueLink('tutor') === null, 'link: 표 없음 → 링크 안 만듦(null)');
check($noTable->peekLink(str_repeat('b', 64)) === null && $noTable->answerLink(str_repeat('b', 64), 'cost', null) === false, 'link: 표 없음 → 열기·저장 false, 예외 없음');
check(throwsMessage(static fn () => $noTable->summary(30)) === 'RuntimeException:' . W::SCHEMA_MISSING, 'summary: 표 없음 → schema_missing');

// ── 4. 관리자 모음 ──
$pdoS = reasonDb();
$ins = $pdoS->prepare('INSERT INTO withdraw_reasons (role_type, reason_code, reason_note, source, answered_on) VALUES (?, ?, ?, ?, ?)');
$day = static fn (int $d): string => $now->modify("-{$d} days")->format('Y-m-d');
$ins->execute(['study_room', 'cost', null, 'withdraw', $day(0)]);
$ins->execute(['tutor', 'cost', null, 'mail', $day(3)]);
$ins->execute(['', 'cost', null, 'withdraw', $day(5)]);
$ins->execute(['student', 'found_teacher', null, 'withdraw', $day(29)]);
$ins->execute(['student', 'other', '아이가 졸업했어요', 'mail', $day(10)]);
$ins->execute(['tutor', 'other', null, 'withdraw', $day(1)]);
$ins->execute(['study_room', 'no_inquiry', null, 'withdraw', $day(30)]);
$ins->execute(['study_room', 'other', '이사해요', 'withdraw', $day(60)]);
$s30 = (new W($pdoS, $now))->summary(30);
$byCode = array_column($s30['rows'], null, 'code');
check($s30['days'] === 30 && $s30['since'] === $day(29), 'summary: 최근 30일 = 오늘 포함 30일');
check($s30['total'] === 6 && $s30['by_source'] === ['withdraw' => 4, 'mail' => 2], 'summary: 합계 · 탈퇴 화면/메일 나눔(30일 밖 제외)');
check($byCode['cost'] === ['code' => 'cost', 'study_room' => 1, 'tutor' => 1, 'student' => 0, 'unknown' => 1, 'total' => 3], 'summary: 역할별 수 · 역할 모름은 합계에');
check(array_column($s30['rows'], 'code') === W::allCodes(), 'summary: 모든 선택지 줄(0건 포함, 정해진 순서)');
check($s30['notes'] === [['on' => $day(10), 'role' => 'student', 'note' => '아이가 졸업했어요']], 'summary: 기타 한 줄은 적은 것만, 기간 안만');
$s90 = (new W($pdoS, $now))->summary(90);
check($s90['total'] === 8 && count($s90['notes']) === 2 && $s90['notes'][0]['note'] === '아이가 졸업했어요', 'summary: 90일 — 최근 한 줄 먼저');
check((new W($pdoS, $now))->summary(7)['days'] === 30, 'summary: 정해진 기간(30·90·365)이 아니면 30일');

// ── 5. 탈퇴 완료 메일 덧붙임 ──
$plainOf = static fn (array $m): string => $m['plain'];
$given = T::withdrawn('student', ['home_ui' => 'https://study114.net', 'withdrawn_at' => '2026-10-14 15:00:00', 'reason' => 'given']);
check(str_contains($given['plain'], '떠나시는 이유를 알려 주셔서 고마워요. 꼭 살펴볼게요.') && !str_contains($given['plain'], '떠나는 이유 알려 주기'),
    'template: 고른 경우 — 승인 문구, 버튼 없음');
$url = T::withdrawReasonUrl('https://study114.net/', str_repeat('c', 64));
check($url === 'https://study114.net/#/support/leave-reason?t=' . str_repeat('c', 64), 'template: 링크 = 고객센터 아래 공개 화면');
$ask = T::withdrawn('tutor', ['home_ui' => 'https://study114.net', 'withdrawn_at' => '2026-10-14 15:00:00', 'reason' => 'ask', 'reason_url' => $url]);
check(str_contains($ask['plain'], '혹시 떠나시는 이유를 알려 주실 수 있을까요? 하나만 골라 주시면 돼요. 로그인은 필요 없어요.')
    && str_contains($ask['plain'], '▶ 떠나는 이유 알려 주기') && str_contains($ask['plain'], $url) && str_contains($ask['html'], htmlspecialchars($url, ENT_QUOTES)),
    'template: 안 고른 경우 — 승인 문구 + 버튼 「떠나는 이유 알려 주기」 + 링크');
check(str_contains($ask['plain'], '30일 동안 한 번 쓸 수 있어요'), 'template: 30일 한 번 안내');
$noUrl = T::withdrawn('tutor', ['home_ui' => 'https://study114.net', 'withdrawn_at' => '2026-10-14 15:00:00', 'reason' => 'ask']);
$plain = T::withdrawn('tutor', ['home_ui' => 'https://study114.net', 'withdrawn_at' => '2026-10-14 15:00:00']);
check($noUrl['plain'] === $plain['plain'] && !str_contains($plain['plain'], '이유'), 'template: 링크가 없으면 / 사유 기능 전 — 덧붙이지 않음(기존 메일 그대로)');
foreach ([$given, $ask] as $mail) {
    check(!preg_match('/(?<!쪽)지도|공개|조용한|만날 수 없/u', $mail['plain']), 'template: 금지어 없음');
}

// ── 6. 메일러 — 보낼 때만 링크를 만든다 ──
$snapshot = ['user_id' => 7, 'email' => 'bye@example.com', 'role' => 'study_room'];
$pdoF = reasonDb();
$tF = new RecordingTransport();
check((new MemberLifecycleMailer($pdoF, new AuthMailer($tF), $cfg))->sendWithdrawFarewell($snapshot, false) === 'sent', 'mailer: 안 고름 → 보냄');
$body = (string) ($tF->sent[0]['body'] ?? '');
check(preg_match('~/#/support/leave-reason\?t=([a-f0-9]{64})~', $body, $mm) === 1, 'mailer: 메일에 사유 받기 링크');
check((new W($pdoF))->peekLink($mm[1] ?? '') === ['role' => 'study_room'], 'mailer: 그 링크로 열면 공부방 선택지');

$pdoG = reasonDb();
$tG = new RecordingTransport();
(new MemberLifecycleMailer($pdoG, new AuthMailer($tG), $cfg))->sendWithdrawFarewell($snapshot, true);
check(str_contains((string) $tG->sent[0]['body'], '꼭 살펴볼게요') && (int) $pdoG->query('SELECT COUNT(*) FROM withdraw_reason_links')->fetchColumn() === 0,
    'mailer: 고름 → 고맙다는 한 줄, 링크 안 만듦');

$tN = new RecordingTransport();
(new MemberLifecycleMailer(reasonDb(false), new AuthMailer($tN), $cfg))->sendWithdrawFarewell($snapshot, false);
check(count($tN->sent) === 1 && !str_contains((string) $tN->sent[0]['body'], '이유'), 'mailer: 표 없음(080 전) → 메일은 그대로, 사유 문장 없음');

$pdoP = reasonDb();
(new M($pdoP))->setEnabled(M::WITHDRAW_FAREWELL, false, 'master@example.com');
$tP = new RecordingTransport();
check((new MemberLifecycleMailer($pdoP, new AuthMailer($tP), $cfg))->sendWithdrawFarewell($snapshot, false) === 'skipped:paused'
    && (int) $pdoP->query('SELECT COUNT(*) FROM withdraw_reason_links')->fetchColumn() === 0, 'mailer: 탈퇴 완료 메일을 멈추면 링크도 안 만듦');
check((new MemberLifecycleMailer(reasonDb(), new AuthMailer(new RecordingTransport()), $cfg))->sendWithdrawFarewell(null, false) === 'skipped:recipient', 'mailer: 받을 주소 없음 → 링크 안 만듦');

// ── 7. 관리자 미리보기 견본 ──
$admin = new A(reasonDb(), new M(reasonDb()), $cfg, null, $now);
check(A::VARIANTS[M::WITHDRAW_FAREWELL] === ['study_room', 'tutor', 'student', 'reason_given'], 'preview: 탈퇴 완료 견본 4개(사유 고른 회원 포함)');
check(str_contains($admin->preview(M::WITHDRAW_FAREWELL, '')['plain'], '/#/support/leave-reason?t=' . A::SAMPLE_REASON_TOKEN), 'preview: 기본 견본은 사유 받기 링크(견본 값)');
check(!W::isToken(A::SAMPLE_REASON_TOKEN), 'preview: 견본 링크 값은 진짜 링크로 쓰일 수 없음');
check(str_contains($admin->preview(M::WITHDRAW_FAREWELL, 'reason_given')['plain'], '꼭 살펴볼게요'), 'preview: 사유 고른 회원 견본');

// ── 8. 탈퇴 흐름·API·화면 (정적) ──
$withdrawSvc = (string) file_get_contents($root . '/src/Auth/AccountWithdrawService.php');
$lookupPos = strpos($withdrawSvc, 'MemberMailRole::lookup($pdo, $userId)');
$purgePos = strpos($withdrawSvc, '$this->runPurge($pdo, $userId);');
$recordPos = strpos($withdrawSvc, '->record($role');
$farewellPos = strpos($withdrawSvc, 'sendWithdrawFarewell($snapshot, $reasonGiven)');
check($lookupPos !== false && $purgePos !== false && $lookupPos < $purgePos, 'withdraw: 역할은 정리(역할 끔) 전에 읽음');
check($recordPos !== false && $recordPos > $purgePos && $farewellPos > $recordPos, 'withdraw: 탈퇴가 끝난 뒤 사유 저장 → 메일');
check(str_contains($withdrawSvc, 'WithdrawReasonService::normalizeAnswer($reasonCode, $reasonNote)'), 'withdraw: 모르는 선택지는 고르지 않은 것으로(탈퇴는 진행)');
$withdrawApi = (string) file_get_contents($root . '/public/api/auth/withdraw.php');
check(str_contains($withdrawApi, "\$input['reason_code'] ?? null, \$input['reason_note'] ?? null"), 'api: 탈퇴 API가 사유를 넘김');
$reasonApi = (string) file_get_contents($root . '/public/api/auth/withdraw-reason.php');
check(!str_contains($reasonApi, 'AuthSession') && str_contains($reasonApi, "\$send(200, ['ok' => true, 'valid' => \$link !== null")
    && str_contains($reasonApi, "\$send(200, ['ok' => true, 'saved' => \$saved])"), 'api: 링크 화면은 로그인 없음 · 쓸 수 없는 링크도 200(닷홈 4xx 대비)');
check(str_contains($reasonApi, "\$send(422, ['ok' => false, 'error' => 'validation'"), 'api: 선택지가 틀릴 때만 422');
$adminApi = (string) file_get_contents($root . '/public/api/admin/withdraw-reasons.php');
check(str_contains($adminApi, 'AdminApi::requireAdmin()') && str_contains($adminApi, "AdminApi::fail(503, 'schema_missing'"), 'api: 관리자 모음은 운영자만 · 표 없음 503');

$sql = (string) file_get_contents($root . '/sql/schema/080_withdraw_reasons.sql');
check(str_contains($sql, 'CREATE TABLE withdraw_reasons') && str_contains($sql, 'CREATE TABLE withdraw_reason_links')
    && !preg_match('/\b(user_id|email)\b/i', $sql) && str_contains($sql, 'answered_on DATE NOT NULL'), 'sql 080: 새 표 2개 · 회원 번호·이메일 칸 없음 · 날짜만');
check(!preg_match('/\b(ALTER|DROP|DELETE|UPDATE|INSERT)\b(?![^\n]*되돌리기)/', preg_replace('/^--.*$/m', '', $sql) ?? ''), 'sql 080: 기존 표를 바꾸지 않음(만들기만)');

$copy = (string) file_get_contents($root . '/preview/home-ui/src/withdraw-reason-copy.js');
foreach ([
    '떠나시는 이유를 알려 주시겠어요? (선택)',
    '고르지 않아도 탈퇴할 수 있어요. 알려 주신 이유는 누가 남겼는지 알 수 없게 모아, 더 좋은 동네를 만드는 데만 써요.',
    '좋은 선생님을 찾았어요', '원하는 선생님·공부방이 없었어요', '원생이 충분히 모였어요', '학생을 충분히 만났어요',
    '쪽지(문의)가 오지 않았어요', '비용이 부담돼요', '쓰기가 불편했어요', '다른 서비스를 쓰기로 했어요', '잠시 쉬어 가려고요',
    '기타 (한 줄로 적어 주세요)', '알려 주셔서 고마워요. 남겨 주신 한마디로 우리 동네를 더 좋게 만들게요.',
] as $phrase) {
    check(str_contains($copy, $phrase), 'copy: 승인 문구 「' . $phrase . '」');
}
foreach (['student', 'study_room', 'tutor'] as $role) {
    preg_match("/  {$role}: \\[([^\\]]*)\\]/", $copy, $m);
    $js = array_map(static fn (string $s): string => trim($s, " '"), explode(',', $m[1] ?? ''));
    check($js === W::ROLE_CODES[$role], "copy: {$role} 선택지가 서버와 같음");
}
preg_match('/WITHDRAW_REASON_COMMON_CODES = \[([^\]]*)\]/', $copy, $m);
check(str_replace([' ', "'"], '', $m[1] ?? '') === 'inconvenient,other_service,taking_break,WITHDRAW_REASON_OTHER', 'copy: 공통 선택지가 서버와 같음');

$mypage = (string) file_get_contents($root . '/preview/home-ui/src/mypage/screens.js');
check(str_contains($mypage, 'renderWithdrawReasonChoices(role === \'parent\' ? \'student\' : role')
    && str_contains($mypage, 'reason_code: reason.code, reason_note: reason.note'), 'mypage: 탈퇴 칸에 사유(선택) · 탈퇴 API로 보냄');
$supRouter = (string) file_get_contents($root . '/preview/home-ui/src/support/router.js');
$supScreens = (string) file_get_contents($root . '/preview/home-ui/src/support/screens.js');
$leave = (string) file_get_contents($root . '/preview/home-ui/src/support/leave-reason.js');
check(str_contains($supRouter, "if (p === '/support/leave-reason') return p;"), 'support: 링크 화면 경로');
check(strpos($supScreens, 'if (path === LEAVE_REASON_PATH)') < strpos($supScreens, 'if (contactPath && !isLoggedIn())'), 'support: 로그인 안내보다 먼저(로그인 없음)');
check(str_contains($leave, "credentials: 'omit'") && str_contains($leave, '/^[a-f0-9]{64}$/'), 'support: 쿠키 안 보냄 · 링크 값 형식 확인');
$menu = (string) file_get_contents($root . '/preview/home-ui/src/admin/a28-copy.js');
check(str_contains($menu, "path: '/admin/members/withdraw-reasons'") && strpos($menu, "label: '탈퇴 사유'") > strpos($menu, "label: '등록 목록'"), 'menu: 회원관리 › 탈퇴 사유');
$screens = (string) file_get_contents($root . '/preview/home-ui/src/admin/a28-screens.js');
$bind = (string) file_get_contents($root . '/preview/home-ui/src/admin/a28-screens-bind.js');
check(str_contains($screens, 'path === WITHDRAW_REASONS_PATH') && str_contains($bind, 'if (path === WITHDRAW_REASONS_PATH) bindWithdrawReasons(root);'), 'menu: 화면·이벤트 연결');

$doc = (string) @file_get_contents($root . '/docs/internal/74-member-mail-lock.md');
check(str_contains($doc, '080_withdraw_reasons.sql') && str_contains($doc, 'WithdrawReasonService') && str_contains($doc, '/admin/members/withdraw-reasons'), '정본 74: 탈퇴 사유 규칙 기록');

echo "\nSUMMARY passed={$passed} failed={$failed}\n";
exit($failed > 0 ? 1 : 0);
