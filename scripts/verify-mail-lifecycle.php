<?php

declare(strict_types=1);

/**
 * 우동공과 편지 B단계 — 카드 게시 환영 · Prime/Pick 구매 감사 · 탈퇴 완료 메일 검증 (실메일·운영 DB 없음)
 *
 * 실행: php -d extension=pdo_sqlite scripts/verify-mail-lifecycle.php
 * 미리보기: 시스템 임시 폴더/study114-mail-preview/lifecycle-*.html (저장소 밖)
 */

$root = dirname(__DIR__);
$tmp = rtrim(sys_get_temp_dir(), '/\\');
$logPath = $tmp . '/study114-mail-lifecycle-test.log';
$outboxPath = $tmp . '/study114-mail-lifecycle-outbox.jsonl';

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
use Study114\Mail\FakeMailTransport;
use Study114\Mail\MailSendResult;
use Study114\Mail\MailTransport;
use Study114\Mail\MemberLifecycleMailer;
use Study114\Mail\MemberLifecycleMailTemplate as T;
use Study114\Mail\MemberMailRole;
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

$forbidden = ['승인', '인증', '보증', '할인', '이벤트', '광고', '공개', '7일', '일주일', '자리 수는 늘리지',
    '{name}', '{{', 'real_name', '%s', '님님', '고객님', '로그인하기', 'demo', '데모'];

/** @param array{subject: string, plain: string, html: string} $mail */
function commonChecks(string $id, array $mail, string $badge, ?string $buttonUrl, string $supportUrl, array $forbidden): void
{
    check($mail['subject'] !== '' && $mail['plain'] !== '' && $mail['html'] !== '', "{$id}: subject·text·html 모두 있음");
    check(str_starts_with($mail['subject'], '[우동공과] '), "{$id}: 제목 머리 [우동공과]");
    check(!preg_match('/[\r\n]/', $mail['subject']), "{$id}: 제목 개행 없음");
    foreach (['plain', 'html'] as $part) {
        check(str_contains($mail[$part], '보내기 전용 메일이라 답장을 받을 수 없어요'), "{$id}: {$part} 보내기 전용 고지");
        check(str_contains($mail[$part], '— 우동공과 드림'), "{$id}: {$part} 서명");
    }
    check(str_ends_with($mail['plain'], "\n고객센터 1:1 문의하기: " . $supportUrl), "{$id}: text 고객센터 링크");
    $all = $mail['subject'] . "\n" . $mail['plain'] . "\n" . $mail['html'];
    foreach ($forbidden as $word) {
        check(!str_contains($all, $word), "{$id}: 금지어 없음 「{$word}」");
    }
    check(str_starts_with($mail['plain'], '[' . $badge . ']'), "{$id}: 배지 「{$badge}」");
    if ($buttonUrl !== null) {
        check(str_contains($mail['plain'], "\n" . $buttonUrl . "\n"), "{$id}: text 버튼 주소 {$buttonUrl}");
        check(str_contains($mail['html'], 'href="' . $buttonUrl . '"'), "{$id}: html 버튼 주소");
    } else {
        check(!str_contains($mail['plain'], '▶ '), "{$id}: 버튼 없음");
    }
    check(!preg_match('/<script|<link|<style|stylesheet|<iframe/i', $mail['html']), "{$id}: 외부 CSS/JS 없음");
    preg_match_all('/<img\b[^>]*src="([^"]+)"/i', $mail['html'], $imgs);
    check($imgs[1] === [MemberMailTemplate::LOGO_URL], "{$id}: 이미지는 로고 1개뿐(추적 픽셀 없음)");
}

$previews = [];

// ── 1. 카드 게시 환영 ──
$room = T::cardPosted(MemberMailRole::STUDY_ROOM, ['home_ui' => $home, 'room_name' => '해솔공부방']);
$previews['lifecycle-card-study-room'] = $room;
check($room['subject'] === '[우동공과] 해솔공부방, 오늘부터 우리 동네 지도에 올랐어요', 'card-room: 제목에 공부방 이름');
commonChecks('card-room', $room, '공부방 원장님 · 카드 게시', $registrationsUrl, $supportUrl, $forbidden);
check(str_contains($room['plain'], '해솔공부방의 카드가 우동공과에 게시되었어요.'), 'card-room: 본문');
check(str_contains($room['plain'], '첫인상을 한 단계 올리는 세 가지'), 'card-room: 안내 목록 제목');
$roomNoName = T::cardPosted(MemberMailRole::STUDY_ROOM, ['home_ui' => $home, 'room_name' => " \n "]);
check(str_contains($roomNoName['subject'], '원장님의 공부방, 오늘부터'), 'card-room: 이름 없으면 「원장님의 공부방」');
$roomEvil = T::cardPosted(MemberMailRole::STUDY_ROOM, ['home_ui' => $home, 'room_name' => "<b>x</b>\r\nBcc: a@b.c"]);
check(!preg_match('/[\r\n]/', $roomEvil['subject']), 'card-room: 이름의 줄바꿈 제거(헤더 주입 방지)');
check(!str_contains($roomEvil['html'], '<b>x</b>') && str_contains($roomEvil['html'], '&lt;b&gt;x&lt;/b&gt;'), 'card-room: 이름 HTML escape');

$tutor = T::cardPosted(MemberMailRole::TUTOR, ['home_ui' => $home, 'region_label' => '서울특별시']);
$previews['lifecycle-card-tutor'] = $tutor;
check($tutor['subject'] === '[우동공과] 과외쌤 선생님, 첫 수업의 문이 열렸어요', 'card-tutor: 제목');
commonChecks('card-tutor', $tutor, '과외쌤 선생님 · 카드 게시', $registrationsUrl, $supportUrl, $forbidden);
check(str_contains($tutor['plain'], '오늘부터 서울특별시의 학생과 학부모님이'), 'card-tutor: 과외 지역 단위 이름');
check(!str_contains($tutor['subject'] . $tutor['plain'], '지도'), 'card-tutor: 「지도」 없음(과외쌤은 지도 노출 아님)');
$tutorNoRegion = T::cardPosted(MemberMailRole::TUTOR, ['home_ui' => $home]);
check(str_contains($tutorNoRegion['plain'], '오늘부터 학생과 학부모님이'), 'card-tutor: 지역 없으면 생략');

$student = T::cardPosted(MemberMailRole::STUDENT, ['home_ui' => $home]);
$previews['lifecycle-card-student'] = $student;
check($student['subject'] === '[우동공과] 학생·학부모님, 공부 카드가 올라갔어요', 'card-student: 제목');
commonChecks('card-student', $student, '학생·학부모님 · 카드 게시', $registrationsUrl, $supportUrl, $forbidden);
check(str_contains($student['plain'], '전화번호와 상세 주소는 다른 회원에게 보이지 않아요.'), 'card-student: 개인정보 안심 안내');

// ── 2. Prime·Pick 구매 감사 ──
$base = ['home_ui' => $home, 'period_label' => '1개월', 'started_on' => '2026-10-09', 'ends_on' => '2026-11-08', 'amount_won' => 50000];
$roomPrime = T::purchaseThanks(MemberMailRole::STUDY_ROOM, $base + ['product' => 'prime', 'room_name' => '해솔공부방', 'scope_label' => '역삼동']);
$previews['lifecycle-prime-study-room'] = $roomPrime;
check($roomPrime['subject'] === '[우동공과] 원장님, Prime 자리에 오르셨어요. 진심으로 고맙습니다', 'prime-room: 제목');
commonChecks('prime-room', $roomPrime, '공부방 원장님 · Prime 노출', $plansUrl, $supportUrl, $forbidden);
check(str_contains($roomPrime['plain'], 'Prime 노출 1개월 · 2026년 10월 9일 ~ 2026년 11월 8일 · 50,000원 결제 완료'), 'prime-room: 기간·금액 요약');
check(str_contains($roomPrime['plain'], '■ Prime, 이 동네 단 3자리'), 'prime-room: 3자리 강조 상자(text)');
check(str_contains($roomPrime['plain'], '역삼동에서 단 3곳만'), 'prime-room: 홍보 지역 이름');
check(str_contains($roomPrime['html'], 'Prime, 이 동네 단 3자리'), 'prime-room: 3자리 강조 상자(html)');
check(strpos($roomPrime['html'], 'Prime, 이 동네 단 3자리') < strpos($roomPrime['html'], 'href="' . $plansUrl . '"'), 'prime-room: 강조 상자가 버튼보다 위');
check(str_contains($roomPrime['plain'], '이제 해솔공부방이에요.'), 'prime-room: 공부방 이름');
check(T::ROOM_PRIME_SLOTS === \Study114\Paid\PrimeRegionScope::CAPACITY, 'prime-room: 문안 3자리 = PrimeRegionScope::CAPACITY');

$tutorPrime = T::purchaseThanks(MemberMailRole::TUTOR, $base + ['product' => 'prime', 'city_label' => '서울특별시', 'subject_label' => '수학']);
$previews['lifecycle-prime-tutor'] = $tutorPrime;
commonChecks('prime-tutor', $tutorPrime, '과외쌤 선생님 · Prime 노출', $plansUrl, $supportUrl, $forbidden);
check(!str_contains($tutorPrime['plain'] . $tutorPrime['html'], '3자리') && !str_contains($tutorPrime['plain'], '■ '), 'prime-tutor: 3자리 상자 없음(과외쌤 Prime은 자리 제한 없음)');
check(str_contains($tutorPrime['plain'], 'Prime은 서울특별시 · 수학 과외쌤 찾기에서 가장 앞쪽에'), 'prime-tutor: 지역·과목');
check(!str_contains($tutorPrime['subject'] . $tutorPrime['plain'], '지도'), 'prime-tutor: 「지도」 없음');

$roomPick = T::purchaseThanks(MemberMailRole::STUDY_ROOM, $base + ['product' => 'pick', 'room_name' => '해솔공부방', 'amount_won' => 30000]);
$previews['lifecycle-pick-study-room'] = $roomPick;
check($roomPick['subject'] === '[우동공과] 원장님, 한 걸음 앞에 서셨어요. 고맙습니다', 'pick-room: 제목');
commonChecks('pick-room', $roomPick, '공부방 원장님 · Pick 노출', $plansUrl, $supportUrl, $forbidden);
check(str_contains($roomPick['plain'], '해솔공부방의 카드가 한 걸음 앞에 서요.'), 'pick-room: 본문');
check(!str_contains($roomPick['plain'], '3자리'), 'pick-room: 3자리 상자 없음');

$tutorPick = T::purchaseThanks(MemberMailRole::TUTOR, $base + ['product' => 'pick', 'city_label' => '경기도 수원시', 'subject_label' => '영어']);
$previews['lifecycle-pick-tutor'] = $tutorPick;
commonChecks('pick-tutor', $tutorPick, '과외쌤 선생님 · Pick 노출', $plansUrl, $supportUrl, $forbidden);
check(str_contains($tutorPick['plain'], '경기도 수원시 · 영어에서 비슷한 카드들 사이에서 선생님의 카드가'), 'pick-tutor: 지역·과목');

$extend = T::purchaseThanks(MemberMailRole::STUDY_ROOM, $base + ['product' => 'prime', 'extend' => true, 'room_name' => '해솔공부방']);
$previews['lifecycle-prime-extend-study-room'] = $extend;
check($extend['subject'] === '[우동공과] 원장님, Prime 기간을 이어 가 주셔서 고맙습니다', 'extend: 제목');
check(str_contains($extend['plain'], '원장님, 계속 함께해 주셔서 고맙습니다.'), 'extend: 본문');
commonChecks('extend', $extend, '공부방 원장님 · Prime 노출', $plansUrl, $supportUrl, $forbidden);

// ── 3. 탈퇴 완료 ──
foreach ([MemberMailRole::STUDY_ROOM => '공부방 원장님 · 탈퇴 완료', MemberMailRole::TUTOR => '과외쌤 선생님 · 탈퇴 완료', '' => '탈퇴 완료'] as $role => $badge) {
    $bye = T::withdrawn($role, ['home_ui' => $home, 'withdrawn_at' => '2026-10-09 20:05:00']);
    $id = 'withdraw-' . ($role === '' ? 'neutral' : $role);
    $previews['lifecycle-' . $id] = $bye;
    check($bye['subject'] === '[우동공과] 그동안 우동공과와 함께해 주셔서 고맙습니다', "{$id}: 제목");
    commonChecks($id, $bye, $badge, null, $supportUrl, $forbidden);
    check(str_contains($bye['plain'], '2026년 10월 9일 오후 8시 5분에 탈퇴가 완료되었어요.'), "{$id}: 탈퇴 시각");
    check(str_contains($bye['plain'], '같은 이메일로 새로 가입할 수 있어요.'), "{$id}: 재가입 안내");
    check(str_contains($bye['plain'], '직접 탈퇴하지 않으셨다면, 같은 이메일로 다시 가입한 뒤 고객센터 1:1 문의로'), "{$id}: 본인 아님 연락 경로");
    check(str_contains($bye['plain'], '오늘 자로 끝났어요'), "{$id}: Prime·Pick 종료 안내");
}
check(T::dateTimeLabel('2026-10-09 00:00:00') === '2026년 10월 9일 오전 12시', 'dateTimeLabel 자정');
check(T::dateTimeLabel('2026-10-09 12:30:00') === '2026년 10월 9일 오후 12시 30분', 'dateTimeLabel 정오');
check(T::dateLabel('bad') === '', 'dateLabel 형식 오류 → 빈 값');

// ── 4. 발송 규칙 (sqlite) ──
final class CountingTransport implements MailTransport
{
    /** @var list<array<string, mixed>> */
    public array $sent = [];

    public function __construct(public string $mode = 'success')
    {
    }

    public function send(array $message): MailSendResult
    {
        if ($this->mode === 'throw') {
            throw new RuntimeException('transport exploded');
        }
        if ($this->mode !== 'success') {
            return MailSendResult::failure('resend_error', 'fail');
        }
        $this->sent[] = $message;

        return MailSendResult::success('ok', 'm' . count($this->sent));
    }
}

if (!in_array('sqlite', PDO::getAvailableDrivers(), true)) {
    check(false, 'pdo_sqlite 필요 — php -d extension=pdo_sqlite 로 실행');
} else {
    $now = (new DateTimeImmutable('now', PositionPeriodCalculator::timezone()));
    $fresh = $now->modify('-10 minutes')->format('Y-m-d H:i:s');
    $old = $now->modify('-3 days')->format('Y-m-d H:i:s');
    $pdo = new PDO('sqlite::memory:');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->exec('CREATE TABLE users (id INTEGER PRIMARY KEY, email TEXT, status TEXT, email_verified_at TEXT)');
    $pdo->exec('CREATE TABLE user_roles (id INTEGER PRIMARY KEY, user_id INTEGER, role_type TEXT, is_primary INTEGER, status TEXT)');
    $pdo->exec("CREATE TABLE provider_reminder_dispatches (id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL,
        channel TEXT NOT NULL, reminder_kind TEXT NOT NULL, dedupe_key TEXT NOT NULL UNIQUE, sent_at TEXT DEFAULT CURRENT_TIMESTAMP)");
    $pdo->exec('CREATE TABLE study_rooms (id INTEGER PRIMARY KEY, user_id INTEGER, study_room_name TEXT, profile_status TEXT, published_at TEXT)');
    $pdo->exec('CREATE TABLE tutors (id INTEGER PRIMARY KEY, user_id INTEGER, profile_status TEXT, published_at TEXT)');
    $pdo->exec('CREATE TABLE students (id INTEGER PRIMARY KEY, guardian_user_id INTEGER, exposure_status TEXT, published_at TEXT)');
    $pdo->exec('CREATE TABLE regions (id INTEGER PRIMARY KEY, dong_name TEXT)');
    $pdo->exec('CREATE TABLE complexes (id INTEGER PRIMARY KEY, name TEXT)');
    $ins = $pdo->prepare('INSERT INTO users (id, email, status, email_verified_at) VALUES (?, ?, ?, ?)');
    foreach ([
        [1, 'room@example.com', 'active', $fresh],
        [2, 'tutor@example.com', 'active', $fresh],
        [3, 'parent@example.com', 'active', $fresh],
        [4, 'unverified@example.com', 'active', null],
        [5, 'withdrawn.5.ab12@users.study114.local', 'active', $fresh],
        [6, 'oauth_kakao_123@example.com', 'active', $fresh],
        [7, 'gone@example.com', 'withdrawn', $fresh],
        [8, 'old@example.com', 'active', $fresh],
    ] as $u) {
        $ins->execute($u);
    }
    $pdo->exec("INSERT INTO user_roles (user_id, role_type, is_primary, status) VALUES (1, 'study_room_owner', 1, 'active'), (2, 'tutor', 1, 'active')");
    $pdo->prepare('INSERT INTO study_rooms VALUES (?, ?, ?, ?, ?)')->execute([11, 1, '해솔공부방', 'published', $fresh]);
    $pdo->prepare('INSERT INTO study_rooms VALUES (?, ?, ?, ?, ?)')->execute([12, 1, '초안방', 'draft', null]);
    $pdo->prepare('INSERT INTO study_rooms VALUES (?, ?, ?, ?, ?)')->execute([13, 4, '미확인방', 'published', $fresh]);
    $pdo->prepare('INSERT INTO study_rooms VALUES (?, ?, ?, ?, ?)')->execute([18, 8, '오래된방', 'published', $old]);
    $pdo->prepare('INSERT INTO tutors VALUES (?, ?, ?, ?)')->execute([21, 2, 'published', $fresh]);
    $pdo->prepare('INSERT INTO tutors VALUES (?, ?, ?, ?)')->execute([25, 5, 'published', $fresh]);
    $pdo->prepare('INSERT INTO tutors VALUES (?, ?, ?, ?)')->execute([26, 6, 'published', $fresh]);
    $pdo->prepare('INSERT INTO students VALUES (?, ?, ?, ?)')->execute([31, 3, 'published', $fresh]);
    $pdo->exec("INSERT INTO regions (id, dong_name) VALUES (100, '역삼동')");
    $pdo->exec("INSERT INTO complexes (id, name) VALUES (200, '래미안')");

    $transport = new CountingTransport();
    $mk = static fn (array $cfg = [], ?CountingTransport $t = null) => new MemberLifecycleMailer(
        $pdo,
        new AuthMailer($t ?? $transport),
        $cfg + ['home_ui' => 'https://study114.net', 'lifecycle_mail_enabled' => true],
    );
    $m = $mk();

    check($m->afterBasicRegister(1, 'study_room', 11) === 'sent', 'rule: 공부방 게시 → 발송');
    check($transport->sent[0]['to'] === 'room@example.com' && str_contains((string) $transport->sent[0]['subject'], '해솔공부방'), 'rule: 받는 사람·공부방 이름');
    check(!empty($transport->sent[0]['html_body']), 'rule: HTML 본문 같이 전달');
    check($m->afterBasicRegister(1, 'study_room', 11) === 'skipped:duplicate', 'rule: 같은 카드 두 번째 → 중복 차단');
    check(count($transport->sent) === 1, 'rule: 실제 발송 1통');
    check($m->afterBasicRegister(1, 'study_room', 12) === 'skipped:not_published', 'rule: 초안 카드 → 안 보냄');
    check($m->afterBasicRegister(2, 'study_room', 11) === 'skipped:not_published', 'rule: 남의 카드 id → 안 보냄');
    check($m->afterBasicRegister(8, 'study_room', 18) === 'skipped:not_published', 'rule: 3일 전 게시 카드 재저장 → 안 보냄');
    check($m->afterBasicRegister(4, 'study_room', 13) === 'skipped:recipient', 'rule: 이메일 미확인 → 안 보냄');
    check($m->afterBasicRegister(5, 'tutor', 25) === 'skipped:recipient', 'rule: 탈퇴 대체 주소 → 안 보냄');
    check($m->afterBasicRegister(6, 'tutor', 26) === 'skipped:recipient', 'rule: oauth_ 내부 주소 → 안 보냄');
    check($m->afterBasicRegister(2, 'tutor', 21) === 'sent', 'rule: 과외쌤 게시 → 발송(지역 조회 실패해도 발송)');
    check($m->afterBasicRegister(3, 'student', 31) === 'sent', 'rule: 학생 게시 → 발송');
    check($m->afterBasicRegister(3, 'admin', 31) === 'skipped:kind', 'rule: 알 수 없는 역할 → 안 보냄');
    $kinds = $pdo->query('SELECT reminder_kind, dedupe_key, channel FROM provider_reminder_dispatches ORDER BY id')->fetchAll(PDO::FETCH_ASSOC);
    check(count($kinds) === 3 && $kinds[0]['dedupe_key'] === 'lifecycle:card_posted:study_room:11'
        && $kinds[0]['reminder_kind'] === MemberLifecycleMailer::KIND_CARD_POSTED && $kinds[0]['channel'] === 'email', 'rule: 발송 기록 키·종류');

    $off = $mk(['lifecycle_mail_enabled' => false]);
    $before = count($transport->sent);
    check($off->afterBasicRegister(3, 'student', 31) === 'skipped:disabled', 'switch: 꺼짐 → 안 보냄');
    check($off->captureWithdrawSnapshot(1) === null, 'switch: 꺼짐 → 탈퇴 메일 준비 안 함');
    check(count($transport->sent) === $before, 'switch: 꺼짐 → 발송 0');

    $payload = ['order_ref' => 'dev-abc', 'product_id' => 'prime', 'provider_type' => 'study_room', 'provider_id' => 11,
        'variant_label' => '1개월', 'amount_won' => 50000, 'started_on' => '2026-10-09', 'ends_on' => '2026-11-08',
        'grant_mode' => 'new', 'fulfilled' => true];
    $snap = ['prime_region' => ['region_basis_type' => 'complex', 'region_id' => 100, 'complex_id' => 200]];
    check($m->afterPositionPurchase(1, $payload, $snap) === 'sent', 'purchase: Prime 공부방 → 발송');
    $last = end($transport->sent);
    check(str_contains((string) $last['body'], '래미안에서 단 3곳만'), 'purchase: 단지 홍보 지역 이름');
    check($m->afterPositionPurchase(1, $payload, $snap) === 'skipped:duplicate', 'purchase: 같은 주문 → 중복 차단');
    $snapDong = ['prime_region' => ['region_basis_type' => 'dong', 'region_id' => 100, 'complex_id' => null]];
    check($m->afterPositionPurchase(1, ['order_ref' => 'dev-dong'] + $payload, $snapDong) === 'sent', 'purchase: 동 기준 Prime → 발송');
    check(str_contains((string) end($transport->sent)['body'], '역삼동에서 단 3곳만'), 'purchase: 동 이름');
    check($m->afterPositionPurchase(1, ['order_ref' => 'dev-x', 'product_id' => 'memo_ticket'] + $payload, []) === 'skipped:order', 'purchase: 쪽지권 → 안 보냄');
    check($m->afterPositionPurchase(1, ['order_ref' => 'dev-y', 'fulfilled' => false] + $payload, []) === 'skipped:order', 'purchase: 지급 실패 → 안 보냄');
    $tutorPayload = ['order_ref' => 'dev-t', 'provider_type' => 'tutor', 'provider_id' => 21, 'product_id' => 'pick'] + $payload;
    check($m->afterPositionPurchase(2, $tutorPayload, ['tutor_axis' => ['city_label' => '서울특별시', 'subject_label' => '수학']]) === 'sent', 'purchase: 과외쌤 Pick → 발송');
    check(str_contains((string) end($transport->sent)['body'], '서울특별시 · 수학에서'), 'purchase: 과외 지역·과목');

    $failT = new CountingTransport('fail');
    $mf = $mk([], $failT);
    check($mf->afterPositionPurchase(1, ['order_ref' => 'dev-fail'] + $payload, $snap) === 'failed', 'fail: 발송 실패 → failed');
    check((int) $pdo->query("SELECT COUNT(*) FROM provider_reminder_dispatches WHERE dedupe_key = 'lifecycle:purchase_thanks:dev-fail'")->fetchColumn() === 0, 'fail: 실패하면 발송 기록 지움(다음에 다시 보낼 수 있음)');
    $mt = $mk([], new CountingTransport('throw'));
    check($mt->afterPositionPurchase(1, ['order_ref' => 'dev-throw'] + $payload, $snap) === 'error', 'fail: 전송 예외 → 밖으로 안 던짐');
    check((int) $pdo->query("SELECT COUNT(*) FROM provider_reminder_dispatches WHERE dedupe_key = 'lifecycle:purchase_thanks:dev-throw'")->fetchColumn() === 0, 'fail: 예외여도 발송 기록 지움');

    $noTable = new PDO('sqlite::memory:');
    $noTable->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $noTable->exec('CREATE TABLE users (id INTEGER PRIMARY KEY, email TEXT, status TEXT, email_verified_at TEXT)');
    $noTable->exec('CREATE TABLE students (id INTEGER PRIMARY KEY, guardian_user_id INTEGER, exposure_status TEXT, published_at TEXT)');
    $noTable->prepare('INSERT INTO users VALUES (?, ?, ?, ?)')->execute([3, 'parent@example.com', 'active', $fresh]);
    $noTable->prepare('INSERT INTO students VALUES (?, ?, ?, ?)')->execute([31, 3, 'published', $fresh]);
    $nt = new CountingTransport();
    $mn = new MemberLifecycleMailer($noTable, new AuthMailer($nt), ['home_ui' => $home, 'lifecycle_mail_enabled' => true]);
    check($mn->afterBasicRegister(3, 'student', 31) === 'error' && $nt->sent === [], 'fail-closed: 발송 기록 표가 없으면 안 보냄');

    $snapW = $m->captureWithdrawSnapshot(1);
    check(is_array($snapW) && $snapW['email'] === 'room@example.com' && $snapW['role'] === MemberMailRole::STUDY_ROOM, 'withdraw: 정리 전 주소·역할 확보');
    $pdo->exec("UPDATE users SET email = 'withdrawn.1.ff@users.study114.local', status = 'withdrawn', email_verified_at = NULL WHERE id = 1");
    check($m->sendWithdrawFarewell($snapW) === 'sent', 'withdraw: 정리 뒤에도 확보한 주소로 발송');
    check(end($transport->sent)['to'] === 'room@example.com', 'withdraw: 받는 사람 = 탈퇴 전 주소');
    check($m->sendWithdrawFarewell($snapW) === 'skipped:duplicate', 'withdraw: 두 번째 → 중복 차단');
    check($m->captureWithdrawSnapshot(7) === null, 'withdraw: 이미 탈퇴 상태 → 준비 안 함');
    check($m->sendWithdrawFarewell(null) === 'skipped:recipient', 'withdraw: 준비 없음 → 안 보냄');
}

// ── 5. 연결 지점(정적) ──
$basic = (string) file_get_contents($root . '/src/Auth/BasicRegisterService.php');
$checkout = (string) file_get_contents($root . '/src/Paid/ProviderCheckoutService.php');
$withdraw = (string) file_get_contents($root . '/src/Auth/AccountWithdrawService.php');
$admin = (string) file_get_contents($root . '/src/Admin/AdminMemberService.php');
check(str_contains($basic, '$this->notifyCardPosted($userId, $result[\'kind\'], $result[\'id\']);'), 'hook: 기본등록 성공 뒤 카드 게시 메일');
check((bool) preg_match('/function notifyCardPosted[\s\S]{0,400}catch \(\\\\Throwable/', $basic), 'hook: 기본등록 메일 예외 격리');
check(substr_count($checkout, '$this->notifyPositionPurchase(') === 1, 'hook: 결제 완료 연결 1곳');
$posBranch = strpos($checkout, '$isPosition = (string) $order[\'product_kind\'] === \'position\';');
$commitPos = strpos($checkout, '$paymentCommitted = true;', (int) $posBranch);
$hookPos = strpos($checkout, '$this->notifyPositionPurchase(');
check($posBranch !== false && $commitPos !== false && $hookPos > $commitPos, 'hook: 구매 메일은 Prime·Pick 지급 커밋 뒤');
check((bool) preg_match('/function notifyPositionPurchase[\s\S]{0,500}catch \(\\\\Throwable/', $checkout), 'hook: 구매 메일 예외 격리');
$capPos = strpos($withdraw, 'captureWithdrawSnapshot($userId)');
$purgePos = strpos($withdraw, '$this->runPurge($pdo, $userId);');
$sendPos = strpos($withdraw, 'sendWithdrawFarewell($snapshot)');
check($capPos !== false && $purgePos !== false && $sendPos !== false && $capPos < $purgePos && $purgePos < $sendPos, 'hook: 탈퇴 = 주소 확보 → 정리 → 발송 순서');
check(!str_contains(substr($withdraw, (int) strpos($withdraw, 'public function purgeWithdrawnAccount')), 'sendWithdrawFarewell'), 'hook: 관리자 강제 탈퇴 경로(purgeWithdrawnAccount)에는 메일 없음');
check(!str_contains($admin, 'MemberLifecycleMailer'), 'hook: 관리자 회원 서비스에 생활 메일 없음');
$cfg = (string) file_get_contents($root . '/config/auth.php');
check(str_contains($cfg, "'lifecycle_mail_enabled'     => study114_env('STUDY114_LIFECYCLE_MAIL', '1') !== '0'"), 'config: STUDY114_LIFECYCLE_MAIL 스위치(기본 켜짐)');
check(!preg_match('/real_name|display_name/', (string) file_get_contents($root . '/src/Mail/MemberLifecycleMailer.php')), 'mailer: 실명·표시명 조회 없음');

// ── 6. 로그에 본문 없음 ──
@unlink($logPath);
@unlink($outboxPath);
$sent = (new AuthMailer(new FakeMailTransport('success')))->send('user@example.com', $roomPrime['subject'], $roomPrime['plain'], $roomPrime['html']);
check($sent === true, 'AuthMailer(fake) 발송 성공');
$log = is_file($logPath) ? (string) file_get_contents($logPath) : '';
check($log !== '' && !str_contains($log, '50,000원') && !str_contains($log, '내 노출 현황 보기') && !str_contains($log, 'user@example.com'), 'mail.log 본문·주소 원문 없음');
@unlink($logPath);
@unlink($outboxPath);

// ── 미리보기 ──
$previewDir = $tmp . DIRECTORY_SEPARATOR . 'study114-mail-preview';
if (!is_dir($previewDir)) {
    mkdir($previewDir, 0775, true);
}
$index = "<!DOCTYPE html><html lang=\"ko\"><head><meta charset=\"UTF-8\"><title>우동공과 생활 메일 미리보기</title></head>"
    . "<body style=\"font-family:sans-serif;padding:24px;\"><h1>우동공과 생활 메일 미리보기</h1><ul>";
foreach ($previews as $id => $mail) {
    file_put_contents($previewDir . DIRECTORY_SEPARATOR . $id . '.html', $mail['html']);
    file_put_contents($previewDir . DIRECTORY_SEPARATOR . $id . '.txt', 'Subject: ' . $mail['subject'] . "\n\n" . $mail['plain']);
    $index .= '<li><a href="' . $id . '.html">' . htmlspecialchars($id . ' — ' . $mail['subject'], ENT_QUOTES, 'UTF-8')
        . '</a> · <a href="' . $id . '.txt">text</a></li>';
}
$index .= '</ul></body></html>';
file_put_contents($previewDir . DIRECTORY_SEPARATOR . 'lifecycle-index.html', $index);
echo 'PREVIEW_DIR=' . $previewDir . PHP_EOL;

echo "\nSUMMARY passed={$passed} failed={$failed}\n";
exit($failed > 0 ? 1 : 0);
