<?php

declare(strict_types=1);

/**
 * 우동공과 편지 A단계 — 가입 확인·비밀번호 재설정 메일 문안 검증 (실메일·DB 없음)
 *
 * 실행: php scripts/verify-auth-mail-warm.php
 *       (역할 조회까지: php -d extension=pdo_sqlite scripts/verify-auth-mail-warm.php)
 * 미리보기: 시스템 임시 폴더/study114-mail-preview/*.html (저장소 밖)
 */

$root = dirname(__DIR__);
$tmp = rtrim(sys_get_temp_dir(), '/\\');
$logPath = $tmp . '/study114-mail-warm-test.log';
$outboxPath = $tmp . '/study114-mail-warm-outbox.jsonl';

$env = [
    'STUDY114_APP_ENV' => 'local',
    'STUDY114_MAIL_FROM' => 'no-reply@study114.net',
    'STUDY114_MAIL_TRANSPORT' => 'fake',
    'STUDY114_MAIL_FAKE_MODE' => 'success',
    'STUDY114_MAIL_LOG_PATH' => $logPath,
    'STUDY114_MAIL_FAKE_OUTBOX' => $outboxPath,
];
foreach ($env as $k => $v) {
    putenv($k . '=' . $v);
    $_ENV[$k] = $v;
    $_SERVER[$k] = $v;
}

require_once $root . '/src/bootstrap.php';

use Study114\Auth\AuthMailer;
use Study114\Auth\EmailVerifyMailTemplate;
use Study114\Auth\PasswordResetMailTemplate;
use Study114\Mail\MemberMailRole;
use Study114\Mail\MemberMailTemplate;

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

$mailKind = (new ReflectionClass(AuthMailer::class))->getMethod('mailKind');
$mailKind->setAccessible(true);
$mailer = (new ReflectionClass(AuthMailer::class))->newInstanceWithoutConstructor();
$kindOf = static fn (string $subject): string => (string) $mailKind->invoke($mailer, $subject);

$supportUrl = MemberMailTemplate::supportUrl('https://study114.net');
$verifyLink = 'https://study114.net/api/auth/email/verify.php?token=abc<def>&x="1"';
$verifyLinkEsc = htmlspecialchars($verifyLink, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
$resetLink = 'https://study114.net/auth/#/reset-password?token=r3s3t<tok>&y=2';
$resetLinkEsc = htmlspecialchars($resetLink, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
$loginUrl = 'https://study114.net/auth/#/login';

// ── TTL 표시 ──
check(MemberMailTemplate::ttlLabel(30) === '30분', 'ttlLabel 30 → 30분');
check(MemberMailTemplate::ttlLabel(24 * 60) === '24시간', 'ttlLabel 1440 → 24시간');
check(MemberMailTemplate::ttlLabel(90) === '1시간 30분', 'ttlLabel 90 → 1시간 30분');
check(MemberMailTemplate::ttlLabel(0) === '1분', 'ttlLabel 0 → 1분(하한)');

// ── 역할 정규화 ──
check(MemberMailRole::normalize('study_room_owner') === MemberMailRole::STUDY_ROOM, 'study_room_owner → study_room');
check(MemberMailRole::normalize('tutor') === MemberMailRole::TUTOR, 'tutor → tutor');
check(MemberMailRole::normalize('guardian_student') === MemberMailRole::STUDENT, 'guardian_student → student');
check(MemberMailRole::normalize('admin') === '', 'admin → 중립');
check(MemberMailRole::normalize('') === '', '빈 역할 → 중립');
check(MemberMailTemplate::supportUrl('') === 'https://study114.net/support/contact', 'supportUrl 기본값 = 운영 고객센터');
check($supportUrl === 'https://study114.net/support/contact', 'supportUrl = /support/contact');
check(is_file($root . '/public/assets/brand/logo-wordmark.png'), '로고 파일 public/assets/brand/logo-wordmark.png 존재');

$forbidden = ['승인', '인증', '보증', '할인', '이벤트', '광고', '{name}', '{{', 'real_name', '%s', '님님', '고객님'];

/**
 * @param array{subject: string, plain: string, html: string} $mail
 */
function commonChecks(string $id, array $mail, ?string $badge, string $link, string $linkEsc, string $supportUrl, array $forbidden): void
{
    check($mail['subject'] !== '' && $mail['plain'] !== '' && $mail['html'] !== '', "{$id}: subject·text·html 모두 비어 있지 않음");
    check(str_starts_with($mail['subject'], '[우동공과] '), "{$id}: 제목 머리 [우동공과]");
    check(!preg_match('/[\r\n]/', $mail['subject']), "{$id}: 제목 개행 없음");
    foreach (['plain', 'html'] as $part) {
        check(str_contains($mail[$part], '보내기 전용 메일이라 답장을 받을 수 없어요'), "{$id}: {$part} 보내기 전용 고지");
        check(str_contains($mail[$part], '고객센터 1:1 문의'), "{$id}: {$part} 고객센터 1:1 문의 안내");
        check(str_contains($mail[$part], '— 우동공과 드림'), "{$id}: {$part} 서명");
    }
    check(str_ends_with($mail['plain'], "\n고객센터 1:1 문의하기: " . $supportUrl), "{$id}: text 고객센터 링크 정확히 일치");
    check(str_contains($mail['html'], 'href="' . htmlspecialchars($supportUrl, ENT_QUOTES, 'UTF-8') . '"'), "{$id}: html 고객센터 링크 정확히 일치");
    $all = $mail['subject'] . "\n" . $mail['plain'] . "\n" . $mail['html'];
    foreach ($forbidden as $word) {
        check(!str_contains($all, $word), "{$id}: 금지어 없음 「{$word}」");
    }
    if ($link !== '') {
        check(str_contains($mail['plain'], $link), "{$id}: text에 원본 링크");
        check(str_contains($mail['html'], 'href="' . $linkEsc . '"'), "{$id}: html 버튼 링크 escape");
        check(substr_count($mail['html'], $linkEsc) >= 3, "{$id}: html 버튼 아래 원본 주소 노출");
        check(!str_contains($mail['html'], '<def>') && !str_contains($mail['html'], '<tok>'), "{$id}: html에 escape 안 된 링크 없음");
    }
    check(!preg_match('/<script|<link|<style|stylesheet|<iframe/i', $mail['html']), "{$id}: 외부 CSS/JS 없음");
    preg_match_all('/<img\b[^>]*src="([^"]+)"/i', $mail['html'], $imgs);
    check($imgs[1] === [MemberMailTemplate::LOGO_URL], "{$id}: 이미지는 로고 1개뿐(추적 픽셀 없음)");
    check(str_contains($mail['html'], 'max-width:560px'), "{$id}: 본문 폭 560px");

    if ($badge !== null) {
        check(str_starts_with($mail['plain'], '[' . $badge . ']'), "{$id}: text 첫 줄 배지 「{$badge}」");
        $badgePos = strpos($mail['html'], '>' . $badge . '</td>');
        $h1Pos = strpos($mail['html'], '<h1');
        check($badgePos !== false && $h1Pos !== false && $badgePos < $h1Pos, "{$id}: html 배지가 제목·본문보다 위");
        check($badgePos !== false && str_contains(substr($mail['html'], max(0, $badgePos - 300), 300), 'font-size:20px'), "{$id}: 배지 글자 20px");
    } else {
        check(!str_contains($mail['html'], 'border-left:6px'), "{$id}: 배지 없음(역할 모름)");
    }
}

$previews = [];

// ── 가입 확인 메일 ──
$verifyCases = [
    'verify-study-room' => ['study_room_owner', '공부방 원장님', '원장님, 우동공과에 오신 것을 진심으로 환영해요.'],
    'verify-tutor'      => ['tutor', '과외쌤 선생님', '선생님, 우동공과에 오신 것을 진심으로 환영해요.'],
    'verify-student'    => ['guardian_student', '학생·학부모님', '전화번호와 상세 주소는 다른 회원에게 공개되지 않아요.'],
    'verify-neutral'    => ['', '', '안녕하세요, 우동공과에 오신 것을 환영해요.'],
];
foreach ($verifyCases as $id => [$roleType, $label, $bodyNeedle]) {
    $mail = EmailVerifyMailTemplate::build($roleType, $verifyLink, 24 * 60, $supportUrl);
    $previews[$id] = $mail;
    $badge = $label !== '' ? $label . ' 가입' : '우동공과 가입';
    $expectedSubject = $label !== ''
        ? '[우동공과] ' . $label . ', 이메일 확인만 남았어요'
        : '[우동공과] 이메일 확인만 남았어요';
    check($mail['subject'] === $expectedSubject, "{$id}: 제목 「{$expectedSubject}」");
    check($kindOf($mail['subject']) === 'email_verify', "{$id}: mailKind = email_verify");
    commonChecks($id, $mail, $badge, $verifyLink, $verifyLinkEsc, $supportUrl, $forbidden);
    check(str_contains($mail['plain'], $bodyNeedle) && str_contains($mail['html'], htmlspecialchars($bodyNeedle, ENT_QUOTES, 'UTF-8')), "{$id}: 역할 본문");
    check(str_contains($mail['plain'], '이메일 확인하고 계속하기') && str_contains($mail['html'], '이메일 확인하고 계속하기'), "{$id}: 버튼 문구");
    check(str_contains($mail['plain'], '이 링크는 24시간 동안 쓸 수 있어요.'), "{$id}: TTL 24시간 안내");
    check(str_contains($mail['plain'], '「확인 메일 다시 보내기」'), "{$id}: 다시 보내기 안내");
    check(str_contains($mail['plain'], '스팸 아님'), "{$id}: 스팸함 안내");
    check(str_contains($mail['plain'], '아무 일도 일어나지 않아요'), "{$id}: 직접 가입 안 한 경우 안내");
}

// ── 비밀번호 재설정 메일 ──
$resetCases = [
    'reset-study-room' => ['study_room_owner', '공부방 원장님', '원장님,', []],
    'reset-tutor'      => ['tutor', '과외쌤 선생님', '선생님,', []],
    'reset-student'    => ['guardian_student', '학생·학부모님', '학생·학부모님,', []],
    'reset-neutral'    => ['', '', '안녕하세요,', []],
    'reset-tutor-social-linked' => ['tutor', '과외쌤 선생님', '선생님,', ['구글']],
];
foreach ($resetCases as $id => [$roleType, $label, $greet, $providers]) {
    $mail = PasswordResetMailTemplate::build($resetLink, 30, $providers, $roleType, $supportUrl);
    $previews[$id] = $mail;
    check($mail['subject'] === '[우동공과] 비밀번호 재설정 안내드려요', "{$id}: 제목");
    check($kindOf($mail['subject']) === 'password_reset', "{$id}: mailKind = password_reset");
    commonChecks($id, $mail, $label !== '' ? $label . ' 계정' : null, $resetLink, $resetLinkEsc, $supportUrl, $forbidden);
    check(str_contains($mail['plain'], $greet . ' 비밀번호 재설정 요청을 받았어요.'), "{$id}: 역할 호칭 「{$greet}」");
    check(str_contains($mail['html'], '새 비밀번호 만들기'), "{$id}: 버튼 문구");
    check(str_contains($mail['plain'], '이 링크는 30분 동안 쓸 수 있어요.'), "{$id}: TTL 30분 안내");
    check(str_contains($mail['plain'], '비밀번호는 바뀌지 않아요. 걱정되면 고객센터로 알려 주세요.'), "{$id}: 요청 안 한 경우 안내");
    if ($providers !== []) {
        check(str_contains($mail['plain'], '구글 로그인과도 연결되어 있어요'), "{$id}: 연결 소셜 안내");
    }
}

$social = PasswordResetMailTemplate::buildSocialOnly(['카카오'], 'guardian_student', $loginUrl, $supportUrl);
$previews['reset-social-only-student'] = $social;
check($social['subject'] === PasswordResetMailTemplate::SUBJECT_SOCIAL_ONLY, 'social-only: 제목');
check($kindOf($social['subject']) === 'password_reset', 'social-only: mailKind = password_reset');
commonChecks('social-only', $social, '학생·학부모님 계정', $loginUrl, htmlspecialchars($loginUrl, ENT_QUOTES, 'UTF-8'), $supportUrl, $forbidden);
check(str_contains($social['plain'], '카카오 버튼을 눌러 들어와 주세요'), 'social-only: 소셜 안내');
check(!str_contains($social['plain'], 'reset-password'), 'social-only: 재설정 링크 없음');

// 소셜 표시명에 HTML이 섞여도 escape (표시명은 서버 고정값이지만 방어)
$xss = PasswordResetMailTemplate::buildSocialOnly(['<b>x</b>'], '', '', $supportUrl);
check(!str_contains($xss['html'], '<b>x</b>') && str_contains($xss['html'], '&lt;b&gt;x&lt;/b&gt;'), 'social-only: 동적 값 escape');
check(str_contains(PasswordResetMailTemplate::build($resetLink)['plain'], "\n고객센터 1:1 문의하기: https://study114.net/support/contact"), 'reset: 고객센터 주소 생략 시 운영 기본값');

// ── 서비스 연결(정적) ──
$verifySvc = (string) file_get_contents($root . '/src/Auth/EmailVerificationService.php');
$resetSvc = (string) file_get_contents($root . '/src/Auth/PasswordResetService.php');
check(str_contains($verifySvc, 'EmailVerifyMailTemplate::build(') && str_contains($verifySvc, "\$mail['html']"), 'EmailVerificationService: 템플릿 + HTML 본문 전달');
check(str_contains($verifySvc, 'MemberMailRole::lookup('), 'EmailVerificationService: 역할 조회');
check(!str_contains($verifySvc, 'real_name'), 'EmailVerificationService: 실명 조회 없음');
check(substr_count($resetSvc, "\$mail['html']") === 2, 'PasswordResetService: 두 경로 모두 HTML 본문 전달');
check(str_contains($resetSvc, 'MemberMailRole::lookup('), 'PasswordResetService: 역할 조회');

// ── 역할 조회 (sqlite 있으면) ──
if (class_exists(PDO::class) && in_array('sqlite', PDO::getAvailableDrivers(), true)) {
    $pdo = new PDO('sqlite::memory:');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->exec('CREATE TABLE user_roles (id INTEGER PRIMARY KEY, user_id INTEGER, role_type TEXT, is_primary INTEGER, status TEXT)');
    $pdo->exec("INSERT INTO user_roles (user_id, role_type, is_primary, status) VALUES
        (1, 'study_room_owner', 1, 'active'),
        (2, 'tutor', 0, 'active'), (2, 'guardian_student', 1, 'active'),
        (3, 'tutor', 1, 'inactive'),
        (4, 'admin', 1, 'active')");
    check(MemberMailRole::lookup($pdo, 1) === MemberMailRole::STUDY_ROOM, 'lookup: 공부방');
    check(MemberMailRole::lookup($pdo, 2) === MemberMailRole::STUDENT, 'lookup: 대표 역할 우선');
    check(MemberMailRole::lookup($pdo, 3) === '', 'lookup: 비활성 역할 → 중립');
    check(MemberMailRole::lookup($pdo, 4) === '', 'lookup: admin → 중립');
    check(MemberMailRole::lookup($pdo, 99) === '', 'lookup: 역할 없음 → 중립');
    $broken = new PDO('sqlite::memory:');
    $broken->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    check(MemberMailRole::lookup($broken, 1) === '', 'lookup: 표 없음(오류) → 중립');
} else {
    echo "SKIP: pdo_sqlite 없음 — 역할 조회 검사 생략 (-d extension=pdo_sqlite)\n";
}

// ── AuthMailer 로그에 본문·토큰 없음 ──
@unlink($logPath);
@unlink($outboxPath);
$sample = $previews['verify-tutor'];
$sent = (new AuthMailer())->send('user@example.com', $sample['subject'], $sample['plain'], $sample['html']);
check($sent === true, 'AuthMailer(fake) 발송 성공');
$log = is_file($logPath) ? (string) file_get_contents($logPath) : '';
check(str_contains($log, 'KIND=email_verify'), 'mail.log KIND=email_verify');
check(!str_contains($log, 'token=') && !str_contains($log, 'abc') && !str_contains($log, '이메일 확인하고 계속하기'), 'mail.log 본문·토큰 없음');
@unlink($logPath);
@unlink($outboxPath);

// ── 미리보기 파일 ──
$previewDir = $tmp . DIRECTORY_SEPARATOR . 'study114-mail-preview';
if (!is_dir($previewDir)) {
    mkdir($previewDir, 0775, true);
}
$index = "<!DOCTYPE html><html lang=\"ko\"><head><meta charset=\"UTF-8\"><title>우동공과 메일 미리보기</title></head>"
    . "<body style=\"font-family:sans-serif;padding:24px;\"><h1>우동공과 메일 미리보기</h1><ul>";
foreach ($previews as $id => $mail) {
    file_put_contents($previewDir . DIRECTORY_SEPARATOR . $id . '.html', $mail['html']);
    file_put_contents($previewDir . DIRECTORY_SEPARATOR . $id . '.txt', 'Subject: ' . $mail['subject'] . "\n\n" . $mail['plain']);
    $index .= '<li><a href="' . $id . '.html">' . htmlspecialchars($id . ' — ' . $mail['subject'], ENT_QUOTES, 'UTF-8')
        . '</a> · <a href="' . $id . '.txt">text</a></li>';
}
$index .= '</ul></body></html>';
file_put_contents($previewDir . DIRECTORY_SEPARATOR . 'index.html', $index);
echo 'PREVIEW_DIR=' . $previewDir . PHP_EOL;

echo "\nSUMMARY passed={$passed} failed={$failed}\n";
exit($failed > 0 ? 1 : 0);
