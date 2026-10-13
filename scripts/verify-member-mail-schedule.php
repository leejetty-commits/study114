<?php

declare(strict_types=1);

/**
 * 정해진 시각 생활 메일 검증 — 첫 일주일 안부 · Prime/Pick 마무리 3일 전 (실메일·운영 DB 없음)
 *
 * 실행: php -d extension=pdo_sqlite scripts/verify-member-mail-schedule.php
 * 미리보기: 시스템 임시 폴더/study114-mail-preview/schedule-*.html (저장소 밖)
 */

$root = dirname(__DIR__);
$tmp = rtrim(sys_get_temp_dir(), '/\\');

$env = [
    'STUDY114_APP_ENV' => 'local',
    'STUDY114_MAIL_FROM' => 'no-reply@study114.net',
    'STUDY114_MAIL_TRANSPORT' => 'fake',
    'STUDY114_MAIL_FAKE_MODE' => 'success',
    'STUDY114_MAIL_LOG_PATH' => $tmp . '/study114-mail-schedule-test.log',
    'STUDY114_MAIL_FAKE_OUTBOX' => $tmp . '/study114-mail-schedule-outbox.jsonl',
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
use Study114\Mail\MemberLifecycleMailTemplate as T;
use Study114\Mail\MemberMailScheduler as S;
use Study114\Mail\MemberMailTemplate;
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

$home = 'https://study114.net';
$supportUrl = MemberMailTemplate::supportUrl($home);
$registrationsUrl = $home . '/mypage/registrations';
$plansUrl = $home . '/mypage/plans';

/** 성과 숫자·부정적인 말·재촉·광고성 표현 금지 (2026-10-14 종현) */
$forbidden = ['승인', '인증', '보증', '할인', '이벤트', '광고', '공개', '조회', '열어 봤', '눈길', '조용', '만날 수 없',
    '자리가 열려', '마감', '서둘러', '놓치', '{', '}', '%s', '님님', '고객님', 'demo', '데모'];

/** @param array{subject: string, plain: string, html: string} $mail */
function commonChecks(string $id, array $mail, string $badge, string $buttonUrl, string $supportUrl, array $forbidden): void
{
    check($mail['subject'] !== '' && $mail['plain'] !== '' && $mail['html'] !== '', "{$id}: subject·text·html 모두 있음");
    check(str_starts_with($mail['subject'], '[우동공과] '), "{$id}: 제목 머리 [우동공과]");
    check(!preg_match('/[\r\n]/', $mail['subject']), "{$id}: 제목 개행 없음");
    foreach (['plain', 'html'] as $part) {
        check(str_contains($mail[$part], '보내기 전용 메일이라 답장을 받을 수 없어요'), "{$id}: {$part} 보내기 전용 고지");
        check(str_contains($mail[$part], '— 우동공과 드림'), "{$id}: {$part} 서명");
    }
    check(str_ends_with($mail['plain'], "\n고객센터 1:1 문의하기: " . $supportUrl), "{$id}: text 고객센터 링크");
    $all = $mail['subject'] . "\n" . $mail['plain'];
    foreach ($forbidden as $word) {
        check(!str_contains($all, $word), "{$id}: 금지어 없음 「{$word}」");
    }
    check(!preg_match('/\d+\s*(번|명|회|건|통)/u', $all), "{$id}: 성과 숫자(N번·N명 등) 없음");
    check(str_starts_with($mail['plain'], '[' . $badge . ']'), "{$id}: 배지 「{$badge}」");
    check(str_contains($mail['plain'], "\n" . $buttonUrl . "\n"), "{$id}: text 버튼 주소 {$buttonUrl}");
    check(str_contains($mail['html'], 'href="' . $buttonUrl . '"'), "{$id}: html 버튼 주소");
    check(!preg_match('/<script|<link|<style|stylesheet|<iframe/i', $mail['html']), "{$id}: 외부 CSS/JS 없음");
    preg_match_all('/<img[^>]+src="([^"]+)"/', $mail['html'], $imgs);
    check($imgs[1] === [MemberMailTemplate::LOGO_URL], "{$id}: 이미지는 로고 1개뿐(추적 픽셀 없음)");
}

$previews = [];

// ── 1. 첫 일주일 안부 문안 ──
$wRoom = T::welcomeWeek('study_room', ['home_ui' => $home, 'has_card' => true, 'room_name' => '해솔공부방']);
$previews['schedule-welcome-room'] = $wRoom;
check($wRoom['subject'] === '[우동공과] 해솔공부방, 우리 동네에서 맞은 첫 일주일 어떠셨어요?', 'welcome-room: 제목');
commonChecks('welcome-room', $wRoom, '공부방 원장님 · 첫 일주일', $registrationsUrl, $supportUrl, $forbidden);
check(str_contains($wRoom['plain'], "우리 동네에서 보낸 첫 일주일\n"), 'welcome-room: 큰 제목');
check(str_contains($wRoom['plain'], '원장님, 우동공과에 오신 지 꼭 일주일이 되었어요.'), 'welcome-room: 첫 문장');
check(str_contains($wRoom['plain'], '해솔공부방의 카드는 지금 우리 동네 학부모님과 학생에게 소개되고 있어요.'), 'welcome-room: 소개 문장');
check(str_contains($wRoom['plain'], '처음이 가장 어렵다는 거, 저희도 알아요. 다음 일주일도 곁에서 함께할게요.'), 'welcome-room: 응원 문장');
check(str_contains($wRoom['plain'], '▶ 내 공부방 카드 보기'), 'welcome-room: 버튼 이름');
check(str_contains($wRoom['plain'], "다음 일주일을 위한 작은 손질\n"), 'welcome-room: 안내 제목');
foreach (['대표 사진 — 교실이 가장 밝을 때 찍은 한 장이면 충분해요.', '동네 인사 — 한마디 남기면 이웃 목록에 원장님 얼굴이 보여요.',
    '쪽지설정 — 받는 상태인지 한 번만 확인해 주세요.', '첫 쪽지에는 하루 안에 답장해 주세요. 답이 빠를수록 믿음이 쌓여요.'] as $i => $note) {
    check(str_contains($wRoom['plain'], '· ' . $note), 'welcome-room: 안내 ' . ($i + 1) . '번째 줄');
}
$wRoomNoName = T::welcomeWeek('study_room', ['home_ui' => $home, 'has_card' => true, 'room_name' => '']);
check($wRoomNoName['subject'] === '[우동공과] 원장님, 우리 동네에서 맞은 첫 일주일 어떠셨어요?', 'welcome-room: 이름 없으면 「원장님」');
check(str_contains($wRoomNoName['plain'], '원장님의 공부방 카드는 지금 우리 동네'), 'welcome-room: 이름 없으면 본문 「원장님의 공부방 카드는」');
$wRoomEvil = T::welcomeWeek('study_room', ['home_ui' => $home, 'has_card' => true, 'room_name' => "해솔\r\nBcc: x@y.z<b>x</b>"]);
check(!preg_match('/[\r\n]/', $wRoomEvil['subject']), 'welcome-room: 이름 줄바꿈 제거(헤더 주입 방지)');
check(!str_contains($wRoomEvil['html'], '<b>x</b>'), 'welcome-room: 이름 HTML escape');

$wTutor = T::welcomeWeek('tutor', ['home_ui' => $home, 'has_card' => true, 'region_label' => '서울특별시']);
$previews['schedule-welcome-tutor'] = $wTutor;
check($wTutor['subject'] === '[우동공과] 선생님, 우동공과에서의 첫 일주일 어떠셨어요?', 'welcome-tutor: 제목');
commonChecks('welcome-tutor', $wTutor, '과외쌤 선생님 · 첫 일주일', $registrationsUrl, $supportUrl, $forbidden);
check(str_contains($wTutor['plain'], '선생님의 카드는 지금 서울특별시의 학생과 학부모님에게 소개되고 있어요.'), 'welcome-tutor: 지역 문장');
check(str_contains($wTutor['plain'], '가르치는 일의 설렘이 오래 가도록, 저희도 계속 응원할게요.'), 'welcome-tutor: 응원 문장');
check(str_contains($wTutor['plain'], "먼저 연락받는 선생님의 작은 습관\n"), 'welcome-tutor: 안내 제목');
check(!preg_match('/(?<!쪽)지도/u', $wTutor['subject'] . $wTutor['plain']), 'welcome-tutor: 「지도」 없음');
$wTutorNoRegion = T::welcomeWeek('tutor', ['home_ui' => $home, 'has_card' => true, 'region_label' => '']);
check(str_contains($wTutorNoRegion['plain'], '선생님의 카드는 지금 근처 학생과 학부모님에게 소개되고 있어요.'), 'welcome-tutor: 지역 없으면 「근처」');

$wStudent = T::welcomeWeek('student', ['home_ui' => $home, 'has_card' => true]);
$previews['schedule-welcome-student'] = $wStudent;
check($wStudent['subject'] === '[우동공과] 우동공과와 함께한 첫 일주일, 안부 전해요', 'welcome-student: 제목');
commonChecks('welcome-student', $wStudent, '학생·학부모님 · 첫 일주일', $registrationsUrl, $supportUrl, $forbidden);
check(str_contains($wStudent['plain'], "첫 일주일, 잘 지내셨어요?\n"), 'welcome-student: 큰 제목');
check(str_contains($wStudent['plain'], '천천히 둘러보고, 마음이 가는 곳에 쪽지 한 통이면 시작이에요.'), 'welcome-student: 본문');
check(str_contains($wStudent['plain'], '· 전화번호와 상세 주소는 다른 회원에게 보이지 않아요.'), 'welcome-student: 개인정보 안내');
check(T::welcomeWeek('student', ['home_ui' => $home, 'has_card' => false])['subject'] === $wStudent['subject'], 'welcome-student: 카드 없어도 같은 안부');

foreach (['study_room' => '공부방 원장님', 'tutor' => '과외쌤 선생님'] as $role => $label) {
    $noCard = T::welcomeWeek($role, ['home_ui' => $home, 'has_card' => false, 'room_name' => '해솔공부방']);
    $previews['schedule-welcome-nocard-' . $role] = $noCard;
    check($noCard['subject'] === '[우동공과] 카드 한 장이면 우리 동네에 소개돼요', "welcome-nocard-{$role}: 제목");
    commonChecks("welcome-nocard-{$role}", $noCard, $label . ' · 첫 일주일', $registrationsUrl, $supportUrl, $forbidden);
    check(str_contains($noCard['plain'], "가입하신 지 일주일이 되었어요.\n\n기본 항목만 채우면 바로 우리 동네에 카드가 노출돼요."), "welcome-nocard-{$role}: 본문 두 문장");
    check(str_contains($noCard['plain'], '▶ 카드 등록 이어서 하기'), "welcome-nocard-{$role}: 버튼 이름");
}

// ── 2. 마무리 3일 전 문안 ──
$endBase = ['home_ui' => $home, 'started_on' => '2026-09-18', 'ends_on' => '2026-10-17'];
$eRoomPrime = T::positionEnding('study_room', $endBase + ['product' => 'prime', 'room_name' => '해솔공부방']);
$previews['schedule-ending-room-prime'] = $eRoomPrime;
check($eRoomPrime['subject'] === '[우동공과] 원장님, Prime 기간이 3일 남았어요', 'ending-room-prime: 제목');
commonChecks('ending-room-prime', $eRoomPrime, '공부방 원장님 · Prime 마무리 안내', $plansUrl, $supportUrl, $forbidden);
check(str_contains($eRoomPrime['plain'], "Prime과 함께한 시간, 고맙습니다\n"), 'ending-room-prime: 큰 제목');
check(str_contains($eRoomPrime['plain'], '원장님, Prime 자리에서 함께해 주셔서 고맙습니다.'), 'ending-room-prime: 감사 문장');
check(str_contains($eRoomPrime['plain'], 'Prime 노출 · 2026년 9월 18일 ~ 2026년 10월 17일'), 'ending-room-prime: 기간 요약');
check(str_contains($eRoomPrime['plain'], '2026년 10월 17일까지는 지금처럼 우리 동네 가장 앞자리에서 해솔공부방을 소개해요.'), 'ending-room-prime: 자리 문장(을)');
check(str_contains($eRoomPrime['plain'], '기간이 끝나면 카드는 베이직으로 이어서 노출돼요. 카드 내용, 찜, 받은 쪽지도 모두 그대로예요.'), 'ending-room-prime: 끝나도 그대로');
check(str_contains($eRoomPrime['plain'], '▶ 구매이력에서 확인하기'), 'ending-room-prime: 버튼 이름');
check(str_contains($eRoomPrime['plain'], "남은 3일을 알차게\n"), 'ending-room-prime: 안내 제목');
check(str_contains($eRoomPrime['plain'], '· 이어서 이용하고 싶으시면 마이페이지 「구매이력」에서 같은 조건으로 고를 수 있어요.'), 'ending-room-prime: 이어서 이용 안내');
check(str_contains($eRoomPrime['html'], '2026년 10월 17일까지 지금 자리에서 그대로 소개돼요.'), 'ending-room-prime: 미리보기 줄');

$eRoomPick = T::positionEnding('study_room', $endBase + ['product' => 'pick', 'room_name' => '늘봄스터디']);
$previews['schedule-ending-room-pick'] = $eRoomPick;
check($eRoomPick['subject'] === '[우동공과] 원장님, Pick 기간이 3일 남았어요', 'ending-room-pick: 제목');
commonChecks('ending-room-pick', $eRoomPick, '공부방 원장님 · Pick 마무리 안내', $plansUrl, $supportUrl, $forbidden);
check(str_contains($eRoomPick['plain'], "Pick과 함께한 시간, 고맙습니다\n"), 'ending-room-pick: 큰 제목');
check(str_contains($eRoomPick['plain'], '지금처럼 학부모님이 먼저 골라 보는 자리에서 늘봄스터디를 소개해요.'), 'ending-room-pick: 자리 문장(를)');
$eRoomNoName = T::positionEnding('study_room', $endBase + ['product' => 'pick', 'room_name' => '']);
check(str_contains($eRoomNoName['plain'], '자리에서 원장님의 공부방을 소개해요.'), 'ending-room: 이름 없으면 「원장님의 공부방을」');

$eTutorPrime = T::positionEnding('tutor', $endBase + ['product' => 'prime']);
$previews['schedule-ending-tutor-prime'] = $eTutorPrime;
check($eTutorPrime['subject'] === '[우동공과] 선생님, Prime 기간이 3일 남았어요', 'ending-tutor-prime: 제목');
commonChecks('ending-tutor-prime', $eTutorPrime, '과외쌤 선생님 · Prime 마무리 안내', $plansUrl, $supportUrl, $forbidden);
check(str_contains($eTutorPrime['plain'], '지금처럼 과외쌤 찾기 가장 앞자리에서 선생님을 소개해요.'), 'ending-tutor-prime: 과외쌤 Prime 자리 = 과외쌤 찾기');
check(!str_contains($eTutorPrime['plain'], '우리 동네 가장 앞자리') && !preg_match('/(?<!쪽)지도/u', $eTutorPrime['plain']), 'ending-tutor-prime: 동네·지도 표현 없음(「쪽지도」는 제외)');
$eTutorPick = T::positionEnding('tutor', $endBase + ['product' => 'pick']);
commonChecks('ending-tutor-pick', $eTutorPick, '과외쌤 선생님 · Pick 마무리 안내', $plansUrl, $supportUrl, $forbidden);

check(T::objectParticle('해솔공부방') === '을' && T::objectParticle('늘봄스터디') === '를', 'josa: 받침 있음 을 · 없음 를');
check(T::objectParticle('선생님') === '을' && T::objectParticle('원장님의 공부방') === '을', 'josa: 호칭');
check(T::objectParticle('공부방2') === '를' && T::objectParticle('공부방1') === '을', 'josa: 숫자 끝');
check(T::objectParticle('ABC') === '을(를)' && T::objectParticle('') === '을(를)', 'josa: 한글·숫자 아님 → 을(를)');

// ── 3. 발송 규칙 (sqlite) ──
final class CountingTransport implements MailTransport
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

$tz = PositionPeriodCalculator::timezone();
$now = new DateTimeImmutable((new DateTimeImmutable('now', $tz))->format('Y-m-d') . ' 10:00:00', $tz);
$today = $now->format('Y-m-d');
$daysAgo = static fn (int $d): string => $now->modify("-{$d} days")->format('Y-m-d H:i:s');
$dayPlus = static fn (int $d): string => $now->modify("+{$d} days")->format('Y-m-d');

/** @return PDO */
function scheduleDb(): PDO
{
    $pdo = new PDO('sqlite::memory:');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->exec('CREATE TABLE users (id INTEGER PRIMARY KEY, email TEXT, status TEXT, email_verified_at TEXT, created_at TEXT)');
    $pdo->exec('CREATE TABLE user_roles (id INTEGER PRIMARY KEY, user_id INTEGER, role_type TEXT, is_primary INTEGER, status TEXT)');
    $pdo->exec("CREATE TABLE provider_reminder_dispatches (id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL,
        channel TEXT NOT NULL, reminder_kind TEXT NOT NULL, dedupe_key TEXT NOT NULL UNIQUE, sent_at TEXT DEFAULT CURRENT_TIMESTAMP)");
    $pdo->exec('CREATE TABLE study_rooms (id INTEGER PRIMARY KEY, user_id INTEGER, study_room_name TEXT, profile_status TEXT, published_at TEXT)');
    $pdo->exec('CREATE TABLE tutors (id INTEGER PRIMARY KEY, user_id INTEGER, profile_status TEXT, published_at TEXT)');
    $pdo->exec('CREATE TABLE students (id INTEGER PRIMARY KEY, guardian_user_id INTEGER, exposure_status TEXT, published_at TEXT)');
    $pdo->exec('CREATE TABLE provider_position_subscriptions (id INTEGER PRIMARY KEY, user_id INTEGER, sku_code TEXT,
        provider_type TEXT, provider_id INTEGER, started_on TEXT, end_exclusive_on TEXT)');

    return $pdo;
}

function addUser(PDO $pdo, int $id, string $email, string $created, string $role, string $status = 'active', ?string $verified = 'yes'): void
{
    $pdo->prepare('INSERT INTO users (id, email, status, email_verified_at, created_at) VALUES (?, ?, ?, ?, ?)')
        ->execute([$id, $email, $status, $verified === null ? null : $created, $created]);
    $pdo->prepare('INSERT INTO user_roles (user_id, role_type, is_primary, status) VALUES (?, ?, 1, ?)')->execute([$id, $role, 'active']);
}

if (!in_array('sqlite', PDO::getAvailableDrivers(), true)) {
    check(false, 'pdo_sqlite 필요 — php -d extension=pdo_sqlite 로 실행');
} else {
    $pdo = scheduleDb();
    addUser($pdo, 1, 'room@example.com', $daysAgo(8), 'study_room_owner');
    addUser($pdo, 2, 'tutor@example.com', $daysAgo(8), 'tutor');
    addUser($pdo, 3, 'parent@example.com', $daysAgo(8), 'guardian_student');
    addUser($pdo, 4, 'draftroom@example.com', $daysAgo(8), 'study_room_owner');
    addUser($pdo, 5, 'hiddenroom@example.com', $daysAgo(8), 'study_room_owner');
    addUser($pdo, 6, 'nocardtutor@example.com', $daysAgo(8), 'tutor');
    addUser($pdo, 7, 'six@example.com', $daysAgo(6), 'study_room_owner');
    addUser($pdo, 8, 'eleven@example.com', $daysAgo(11), 'study_room_owner');
    addUser($pdo, 9, 'unverified@example.com', $daysAgo(8), 'study_room_owner', 'active', null);
    addUser($pdo, 10, 'gone@example.com', $daysAgo(8), 'study_room_owner', 'withdrawn');
    addUser($pdo, 11, 'oauth_kakao_1@example.com', $daysAgo(8), 'tutor');
    addUser($pdo, 12, 'admin@example.com', $daysAgo(8), 'admin');
    addUser($pdo, 13, 'seven@example.com', $daysAgo(7), 'guardian_student');
    addUser($pdo, 14, 'ten@example.com', $daysAgo(10), 'guardian_student');
    addUser($pdo, 15, 'adminfirst@example.com', $daysAgo(8), 'admin');
    addUser($pdo, 16, 'memberfirst@example.com', $daysAgo(8), 'guardian_student');
    addUser($pdo, 17, 'withdrawn.17.ab12cd34@users.study114.local', $daysAgo(8), 'guardian_student');
    $extraRole = $pdo->prepare('INSERT INTO user_roles (user_id, role_type, is_primary, status) VALUES (?, ?, 0, ?)');
    $extraRole->execute([15, 'guardian_student', 'active']);
    $extraRole->execute([16, 'admin', 'active']);
    $pdo->prepare('INSERT INTO study_rooms VALUES (?, ?, ?, ?, ?)')->execute([11, 1, '해솔공부방', 'published', $daysAgo(8)]);
    $pdo->prepare('INSERT INTO study_rooms VALUES (?, ?, ?, ?, ?)')->execute([14, 4, '초안방', 'draft', null]);
    $pdo->prepare('INSERT INTO study_rooms VALUES (?, ?, ?, ?, ?)')->execute([15, 5, '숨김방', 'hidden', $daysAgo(8)]);
    $pdo->prepare('INSERT INTO tutors VALUES (?, ?, ?, ?)')->execute([21, 2, 'published', $daysAgo(8)]);
    $pdo->prepare('INSERT INTO students VALUES (?, ?, ?, ?)')->execute([31, 3, 'published', $daysAgo(8)]);
    $sub = $pdo->prepare('INSERT INTO provider_position_subscriptions VALUES (?, ?, ?, ?, ?, ?, ?)');
    $sub->execute([101, 1, 'prime', 'study_room', 11, $now->modify('-27 days')->format('Y-m-d'), $dayPlus(3)]);
    $sub->execute([102, 2, 'pick', 'tutor', 21, $now->modify('-11 days')->format('Y-m-d'), $dayPlus(3)]);
    $sub->execute([103, 1, 'pick', 'study_room', 11, $today, $dayPlus(4)]);
    $sub->execute([104, 5, 'prime', 'study_room', 15, $today, $dayPlus(3)]);
    $sub->execute([105, 1, 'prime', null, null, $today, $dayPlus(3)]);
    $sub->execute([106, 2, 'prime', 'tutor', 99, $today, $dayPlus(3)]);
    $sub->execute([107, 2, 'pick', 'tutor', 21, $today, $dayPlus(2)]);
    $sub->execute([108, 11, 'pick', 'tutor', 22, $today, $dayPlus(3)]);
    $sub->execute([109, 10, 'prime', 'study_room', 16, $today, $dayPlus(3)]);

    $transport = new CountingTransport();
    $cfg = ['home_ui' => $home, 'lifecycle_mail_enabled' => true];
    $mailer = new MemberLifecycleMailer($pdo, new AuthMailer($transport), $cfg);
    $sched = new S($pdo, $mailer);

    check($sched->run($now->setTime(8, 59))['reason'] === 'quiet_hours', 'time: 8시 59분 → 안 보냄');
    check($sched->run($now->setTime(21, 0))['reason'] === 'quiet_hours', 'time: 21시 → 안 보냄');
    check($transport->sent === [], 'time: 밤에는 발송 0');
    $off = new S($pdo, new MemberLifecycleMailer($pdo, new AuthMailer($transport), ['lifecycle_mail_enabled' => false] + $cfg));
    check($off->run($now)['reason'] === 'disabled', 'switch: 생활 메일 꺼짐 → 안 보냄');

    $r1 = $sched->run($now);
    $to = array_map(static fn (array $m): string => (string) $m['to'], $transport->sent);
    check($r1['ran'] === true && $r1['sent'] === 10, 'run1: 10통 발송 (마무리 3 + 안부 7) — 실제 ' . $r1['sent']);
    check(array_slice($to, 0, 3) === ['room@example.com', 'tutor@example.com', 'room@example.com'], 'run1: 마무리 3일 전 메일을 먼저 보냄');
    check(($r1['by_kind']['position_ending']['skipped:card'] ?? 0) === 2, 'ending: 숨김 카드·남의 카드 이용권 → 안 보냄');
    check(!in_array('six@example.com', $to, true) && !in_array('eleven@example.com', $to, true), 'welcome: 가입 6일·11일 → 대상 아님');
    check(in_array('seven@example.com', $to, true), 'welcome: 가입 정확히 7일 → 보냄');
    check(!in_array('ten@example.com', $to, true), 'welcome: 가입 정확히 10일 → 대상 아님(7일 이상 10일 미만)');
    check(!in_array('unverified@example.com', $to, true) && !in_array('gone@example.com', $to, true), 'welcome: 이메일 미확인·탈퇴 → 대상 아님');
    check(!in_array('admin@example.com', $to, true), 'welcome: 회원 역할 없음(관리자) → 대상 아님');
    check(!in_array('oauth_kakao_1@example.com', $to, true) && !in_array('withdrawn.17.ab12cd34@users.study114.local', $to, true),
        'welcome: oauth_·내부 주소 → 안 보냄');
    check(!in_array('adminfirst@example.com', $to, true), 'welcome: 대표 역할이 관리자 → 대상 아님(회원 역할이 따로 있어도)');
    check(in_array('memberfirst@example.com', $to, true), 'welcome: 대표 역할이 회원 → 보냄(관리자 역할이 따로 있어도)');
    check(!isset($r1['by_kind']['welcome_week']['skipped:recipient']) && !isset($r1['by_kind']['welcome_week']['skipped:kind'])
        && !isset($r1['by_kind']['position_ending']['skipped:recipient']),
        'select: 받을 수 없는 회원은 고를 때 빠짐(매시간 후보 자리를 차지하지 않음)');
    check(($r1['by_kind']['welcome_week']['skipped:card'] ?? 0) === 1, 'welcome: 숨김 카드뿐인 공부방 → 안 보냄');

    $bySubject = [];
    foreach ($transport->sent as $m) {
        $bySubject[(string) $m['to']][] = (string) $m['subject'];
    }
    check(in_array('[우동공과] 해솔공부방, 우리 동네에서 맞은 첫 일주일 어떠셨어요?', $bySubject['room@example.com'] ?? [], true), 'welcome: 노출 중 공부방 → 이름 넣은 안부');
    check(($bySubject['draftroom@example.com'] ?? []) === ['[우동공과] 카드 한 장이면 우리 동네에 소개돼요'], 'welcome: 초안뿐인 공부방 → 등록 안내');
    check(($bySubject['nocardtutor@example.com'] ?? []) === ['[우동공과] 카드 한 장이면 우리 동네에 소개돼요'], 'welcome: 카드 없는 과외쌤 → 등록 안내');
    check(($bySubject['tutor@example.com'] ?? [])[1] === '[우동공과] 선생님, 우동공과에서의 첫 일주일 어떠셨어요?', 'welcome: 노출 중 과외쌤 → 안부(지역 조회 실패해도 발송)');
    check(($bySubject['parent@example.com'] ?? []) === ['[우동공과] 우동공과와 함께한 첫 일주일, 안부 전해요'], 'welcome: 학생·학부모 → 안부');
    $endMail = $transport->sent[0];
    check(str_contains((string) $endMail['body'], 'Prime 노출 · ' . T::dateLabel($now->modify('-27 days')->format('Y-m-d')) . ' ~ ' . T::dateLabel($dayPlus(2))),
        'ending: 기간 요약 = 시작일 ~ 마지막 이용일(end_exclusive 하루 전)');
    check(str_contains((string) $endMail['body'], '해솔공부방을 소개해요.'), 'ending: 공부방 이름');
    check(in_array('[우동공과] 선생님, Pick 기간이 3일 남았어요', $bySubject['tutor@example.com'] ?? [], true), 'ending: 과외쌤 Pick');
    check(count(array_filter($bySubject['room@example.com'] ?? [], static fn (string $s): bool => $s === '[우동공과] 원장님, Prime 기간이 3일 남았어요')) === 2,
        'ending: provider 값 없는 옛 이용권(105)도 본인 노출 카드로 보냄');
    $keys = $pdo->query("SELECT dedupe_key FROM provider_reminder_dispatches WHERE reminder_kind = 'lifecycle_position_ending' ORDER BY id")->fetchAll(PDO::FETCH_COLUMN);
    check($keys === ['lifecycle:position_ending:101:' . $dayPlus(3), 'lifecycle:position_ending:102:' . $dayPlus(3), 'lifecycle:position_ending:105:' . $dayPlus(3)], 'ending: 중복 방지 키 = 이용권 id + 끝나는 날');
    $wk = $pdo->query("SELECT COUNT(*) FROM provider_reminder_dispatches WHERE reminder_kind = 'lifecycle_welcome_week' AND dedupe_key LIKE 'lifecycle:welcome_week:%'")->fetchColumn();
    check((int) $wk === 7, 'welcome: 발송 기록 7건(lifecycle:welcome_week:{회원})');

    $before = count($transport->sent);
    $r2 = $sched->run($now->setTime(11, 0));
    check($r2['sent'] === 0 && count($transport->sent) === $before, 'run2: 같은 날 다시 불러도 두 번 안 보냄');

    $pdo->prepare('UPDATE provider_position_subscriptions SET end_exclusive_on = ? WHERE id = 101')->execute([$dayPlus(33)]);
    $later = $now->modify('+30 days');
    $r3 = $sched->run($later);
    $last = end($transport->sent);
    check($r3['sent'] === 1 && $last['subject'] === '[우동공과] 원장님, Prime 기간이 3일 남았어요', 'extend: 연장 뒤 새 끝나는 날 3일 전에 다시 안내');
    check($sched->run($later->setTime(15, 0))['sent'] === 0, 'extend: 그날 두 번째 호출 → 안 보냄');

    // 실패 → 기록 지움 → 다음 호출이 다시 시도
    $pdoF = scheduleDb();
    addUser($pdoF, 1, 'parent1@example.com', $daysAgo(8), 'guardian_student');
    $failT = new CountingTransport('fail');
    $rf = (new S($pdoF, new MemberLifecycleMailer($pdoF, new AuthMailer($failT), $cfg)))->run($now);
    check($rf['failed'] === 1 && (int) $pdoF->query('SELECT COUNT(*) FROM provider_reminder_dispatches')->fetchColumn() === 0, 'fail: 발송 실패 → 기록 지움');
    $okT = new CountingTransport();
    $rr = (new S($pdoF, new MemberLifecycleMailer($pdoF, new AuthMailer($okT), $cfg)))->run($now->setTime(11, 7));
    check($rr['sent'] === 1 && count($okT->sent) === 1, 'fail: 다음 호출에서 다시 보내 성공');

    // 나눠 보내기 · 하루 한도 · 시간 한도
    $pdoB = scheduleDb();
    for ($i = 1; $i <= 35; $i++) {
        addUser($pdoB, $i, "p{$i}@example.com", $daysAgo(8), 'guardian_student');
    }
    $bT = new CountingTransport();
    $bS = new S($pdoB, new MemberLifecycleMailer($pdoB, new AuthMailer($bT), $cfg));
    $b1 = $bS->run($now);
    check($b1['sent'] === S::BATCH && $b1['stopped'] === 'batch', 'batch: 한 번에 ' . S::BATCH . '통까지만');
    $b2 = $bS->run($now->setTime(11, 7));
    check($b2['sent'] === 5 && $b2['stopped'] === 'done', 'batch: 남은 5통은 다음 호출이 이어 보냄');

    $pdoC = scheduleDb();
    for ($i = 1; $i <= 20; $i++) {
        addUser($pdoC, $i, "c{$i}@example.com", $daysAgo(8), 'guardian_student');
    }
    $ins = $pdoC->prepare("INSERT INTO provider_reminder_dispatches (user_id, channel, reminder_kind, dedupe_key, sent_at) VALUES (900, 'email', ?, ?, ?)");
    for ($i = 1; $i <= 50; $i++) {
        $ins->execute(['lifecycle_card_posted', 'seed:' . $i, $today . ' 09:30:00']);
    }
    $ins->execute(['lifecycle_card_posted', 'seed:yesterday', $now->modify('-1 day')->format('Y-m-d') . ' 23:59:59']);
    $pdoC->prepare("INSERT INTO provider_reminder_dispatches (user_id, channel, reminder_kind, dedupe_key, sent_at) VALUES (900, 'sms', 'position_expiry_d3', 'seed:sms', ?)")->execute([$today . ' 09:30:00']);
    $cT = new CountingTransport();
    $cS = new S($pdoC, new MemberLifecycleMailer($pdoC, new AuthMailer($cT), $cfg));
    $c1 = $cS->run($now);
    check($c1['sent_today_before'] === 50, 'cap: 오늘 생활 메일만 셈(어제·문자 제외) = 50');
    check($c1['sent'] === S::DAILY_CAP - 50 && $c1['stopped'] === 'daily_cap', 'cap: 하루 ' . S::DAILY_CAP . '통에서 멈춤(이번 10통)');
    $c2 = $cS->run($now->setTime(12, 7));
    check($c2['sent'] === 0 && $c2['stopped'] === 'daily_cap', 'cap: 한도 찬 뒤 호출 → 0통');
    $c3 = $cS->run($now->modify('+1 day'));
    check($c3['sent'] === 10, 'cap: 다음 날 남은 10통 이어 보냄(가입 9일째, 범위 안)');

    $pdoT = scheduleDb();
    for ($i = 1; $i <= 10; $i++) {
        addUser($pdoT, $i, "t{$i}@example.com", $daysAgo(8), 'guardian_student');
    }
    $tick = 0.0;
    $clock = static function () use (&$tick): float {
        $v = $tick;
        $tick += 5.0;

        return $v;
    };
    $tT = new CountingTransport();
    $t1 = (new S($pdoT, new MemberLifecycleMailer($pdoT, new AuthMailer($tT), $cfg), $clock))->run($now);
    check($t1['sent'] === 3 && $t1['stopped'] === 'time', 'time-budget: ' . S::TIME_BUDGET_SECONDS . '초가 차면 멈춤');

    // 받을 수 없는 회원이 후보 한도보다 많아도 받을 회원이 밀리지 않음
    $pdoS = scheduleDb();
    $n = S::CANDIDATE_LIMIT + 50;
    for ($i = 1; $i <= $n; $i++) {
        addUser($pdoS, $i, "oauth_naver_{$i}@example.com", $daysAgo(9), 'guardian_student');
    }
    addUser($pdoS, $n + 1, 'real@example.com', $daysAgo(8), 'guardian_student');
    $sT = new CountingTransport();
    $s1 = (new S($pdoS, new MemberLifecycleMailer($pdoS, new AuthMailer($sT), $cfg)))->run($now);
    check($s1['sent'] === 1 && ($sT->sent[0]['to'] ?? '') === 'real@example.com', 'select: 내부 주소 ' . $n . '명 뒤의 회원도 그날 받음');
}

// ── 4. 자동 작업 주소·GitHub 일정(정적) ──
$cron = (string) file_get_contents($root . '/public/api/cron/member-mail.php');
check(str_contains($cron, "!== 'POST'"), 'cron: POST만');
check(str_contains($cron, "study114_env('STUDY114_REPORT_CRON_KEY', '')"), 'cron: 보고서 cron 키 재사용');
check(str_contains($cron, "\$expected === 'dev-cron-key'") && str_contains($cron, 'strlen($expected) < 32'), 'cron: 키 미설정·약한 키면 실행 안 함');
check(str_contains($cron, "\$_SERVER['HTTP_X_CRON_KEY']") && !str_contains($cron, '$_GET'), 'cron: 키는 헤더로만(주소에 키 금지)');
check(str_contains($cron, 'hash_equals($expected, $given)'), 'cron: 키 비교 hash_equals');
check(str_contains($cron, 'new MemberMailScheduler('), 'cron: 스케줄러 실행');
$wf = (string) file_get_contents($root . '/.github/workflows/member-mail-cron.yml');
check(str_contains($wf, 'cron: "7 0-11 * * *"'), 'workflow: KST 9시 7분~20시 7분 매시간');
check(str_contains($wf, '${{ secrets.STUDY114_REPORT_CRON_KEY }}') && str_contains($wf, '-H "X-Cron-Key: ${CRON_KEY}"'), 'workflow: Secret을 헤더로 전달');
check(!preg_match('/member-mail\.php\?/', $wf), 'workflow: 주소에 키 없음');
check(str_contains($wf, 'https://study114.net/api/cron/member-mail.php'), 'workflow: 정본 도메인 주소');
check(S::SEND_FROM_HOUR === 9 && S::SEND_UNTIL_HOUR === 21, 'workflow·서버 시간대 일치(9~21시)');

// ── 미리보기 ──
$previewDir = $tmp . DIRECTORY_SEPARATOR . 'study114-mail-preview';
if (!is_dir($previewDir)) {
    mkdir($previewDir, 0775, true);
}
$index = "<!DOCTYPE html><html lang=\"ko\"><head><meta charset=\"UTF-8\"><title>우동공과 정해진 시각 메일 미리보기</title></head>"
    . "<body style=\"font-family:sans-serif;padding:24px;\"><h1>우동공과 정해진 시각 메일 미리보기</h1><ul>";
foreach ($previews as $id => $mail) {
    file_put_contents($previewDir . DIRECTORY_SEPARATOR . $id . '.html', $mail['html']);
    file_put_contents($previewDir . DIRECTORY_SEPARATOR . $id . '.txt', 'Subject: ' . $mail['subject'] . "\n\n" . $mail['plain']);
    $index .= '<li><a href="' . $id . '.html">' . htmlspecialchars($id . ' — ' . $mail['subject'], ENT_QUOTES, 'UTF-8')
        . '</a> · <a href="' . $id . '.txt">text</a></li>';
}
$index .= '</ul></body></html>';
file_put_contents($previewDir . DIRECTORY_SEPARATOR . 'schedule-index.html', $index);
echo 'PREVIEW_DIR=' . $previewDir . PHP_EOL;

echo "\nSUMMARY passed={$passed} failed={$failed}\n";
exit($failed > 0 ? 1 : 0);
