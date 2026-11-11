<?php

declare(strict_types=1);

/**
 * 357 테스트 카드 숨김 — 허용목록·SQL 조각·env 무동작 검증.
 * 실메일·운영 DB 없음. 예시 이메일만. pdo_sqlite 불필요(인메모리 Fake PDO).
 *
 * 실행: php scripts/verify-test-card-hide.php
 */

$root = dirname(__DIR__);

$env = [
    'STUDY114_APP_ENV' => 'local',
    'STUDY114_TEST_ACCOUNT_EMAILS' => '',
];
foreach ($env as $k => $v) {
    putenv($k . '=' . $v);
    $_ENV[$k] = $v;
    $_SERVER[$k] = $v;
}

require_once $root . '/src/bootstrap.php';

use Study114\Auth\TestAccountAllowlist;
use Study114\Visibility\TestOwnerVisibility;

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

function setTestEmails(string $raw): void
{
    putenv('STUDY114_TEST_ACCOUNT_EMAILS=' . $raw);
    $_ENV['STUDY114_TEST_ACCOUNT_EMAILS'] = $raw;
    $_SERVER['STUDY114_TEST_ACCOUNT_EMAILS'] = $raw;
    TestOwnerVisibility::reset();
}

/**
 * users(id, email) 조회만 흉내 내는 Fake PDO — 드라이버 불필요.
 *
 * @param list<array{id:int,email:string}> $users
 */
function fakeUsersPdo(array $users): PDO
{
    return new class ($users) extends PDO {
        /** @var list<array{id:int,email:string}> */
        private array $users;

        /** @param list<array{id:int,email:string}> $users */
        public function __construct(array $users)
        {
            // PDO parent construct 생략 (드라이버 없는 CI/로컬용)
            $this->users = $users;
        }

        public function prepare(string $query, array $options = []): PDOStatement|false
        {
            $matched = [];
            if (preg_match('/LOWER\(TRIM\(email\)\)\s+IN\s*\(([^)]+)\)/i', $query, $m)) {
                $placeholderCount = substr_count($m[1], '?');
                $matched['in_count'] = $placeholderCount;
            }

            $users = $this->users;

            return new class ($users, $matched) extends PDOStatement {
                /** @var list<array{id:int,email:string}> */
                private array $users;
                /** @var array{in_count?:int} */
                private array $meta;
                /** @var list<string> */
                private array $emails = [];
                /** @var list<int> */
                private array $result = [];

                /** @param list<array{id:int,email:string}> $users */
                public function __construct(array $users, array $meta)
                {
                    $this->users = $users;
                    $this->meta = $meta;
                }

                public function execute(?array $params = null): bool
                {
                    $this->emails = array_map(
                        static fn ($e): string => strtolower(trim((string) $e)),
                        $params ?? []
                    );
                    $this->result = [];
                    foreach ($this->users as $row) {
                        $email = strtolower(trim((string) $row['email']));
                        if (in_array($email, $this->emails, true)) {
                            $this->result[] = (int) $row['id'];
                        }
                    }

                    return true;
                }

                public function fetchAll(int $mode = PDO::FETCH_DEFAULT, ...$args): array
                {
                    if ($mode === PDO::FETCH_COLUMN) {
                        return $this->result;
                    }

                    return array_map(
                        static fn (int $id): array => ['id' => $id],
                        $this->result
                    );
                }
            };
        }
    };
}

function samplePdo(): PDO
{
    return fakeUsersPdo([
        ['id' => 10, 'email' => 'test1@example.com'],
        ['id' => 11, 'email' => 'Test2@Example.com'],
        ['id' => 20, 'email' => 'member@example.com'],
    ]);
}

// ── env 비면 무동작 ──
setTestEmails('');
check(TestAccountAllowlist::emails() === [], 'env empty → emails []');
$pdo = samplePdo();
TestOwnerVisibility::bindViewer(null);
check(TestOwnerVisibility::sql($pdo, 'sr.user_id') === '1=1', 'env empty → sql 1=1 (guest)');
TestOwnerVisibility::bindViewer(['email' => 'test1@example.com']);
check(TestOwnerVisibility::sql($pdo, 'sr.user_id') === '1=1', 'env empty → sql 1=1 (even test viewer)');

// ── 허용목록 파싱 (정확한 이메일, 소문자) ──
setTestEmails('test1@example.com, Test2@Example.com ,not-an-email, ');
$emails = TestAccountAllowlist::emails();
check($emails === ['test1@example.com', 'test2@example.com'], 'emails normalized lowercase unique-ish');
check(TestAccountAllowlist::contains('TEST1@example.com'), 'contains case-insensitive');
check(!TestAccountAllowlist::contains('member@example.com'), 'non-allowlist false');

// ── user id 해석 ──
$ids = TestAccountAllowlist::userIds($pdo);
sort($ids);
check($ids === [10, 11], 'userIds resolves allowlist emails only');

// ── 비회원·일반: 숨김 SQL ──
setTestEmails('test1@example.com,test2@example.com');
TestOwnerVisibility::reset();
TestOwnerVisibility::bindViewer(null);
$sqlGuest = TestOwnerVisibility::sql($pdo, 'sr.user_id');
check(
    $sqlGuest === 'sr.user_id NOT IN (10,11)' || $sqlGuest === 'sr.user_id NOT IN (11,10)',
    'guest hides test owners'
);
TestOwnerVisibility::reset();
TestOwnerVisibility::bindViewer(['email' => 'member@example.com']);
$sqlMember = TestOwnerVisibility::sql($pdo, 't.user_id');
check(
    str_contains($sqlMember, 't.user_id NOT IN (') && str_contains($sqlMember, '10') && str_contains($sqlMember, '11'),
    'member hides test owners'
);

// ── 테스트 계정 로그인: 거르지 않음 ──
TestOwnerVisibility::reset();
TestOwnerVisibility::bindViewer(['email' => 'test1@example.com']);
check(TestOwnerVisibility::viewerIsTest() === true, 'viewerIsTest true');
check(TestOwnerVisibility::sql($pdo, 'sr.user_id') === '1=1', 'test viewer sees all');

// ── 컬럼 검증 ──
$threw = false;
try {
    TestOwnerVisibility::sql($pdo, 'user_id');
} catch (InvalidArgumentException) {
    $threw = true;
}
check($threw, 'rejects bare column name');

// ── 관리자·상세·통계 경로에 TestOwner 미적용 (파일 문자열) ──
$admin = file_get_contents($root . '/src/Admin/AdminExposureRepository.php');
$recompute = file_get_contents($root . '/src/Admin/TutorDetailRecomputeService.php');
$publicRead = file_get_contents($root . '/src/StudyRoom/StudyRoomPublicReadService.php');
$promo = file_get_contents($root . '/src/Promo/PromoChannelPublicRead.php');
$regionStats = file_get_contents($root . '/public/api/search/region-stats.php');
check(!str_contains($admin, 'TestOwnerVisibility'), 'AdminExposureRepository untouched');
check(!str_contains($recompute, 'TestOwnerVisibility'), 'TutorDetailRecomputeService untouched');
check(!str_contains($publicRead, 'TestOwnerVisibility'), 'StudyRoomPublicReadService detail untouched');
check(!str_contains($promo, 'TestOwnerVisibility'), 'PromoChannelPublicRead detail untouched');
check(!str_contains($regionStats, 'TestOwnerVisibility'), 'region-stats.php untouched');

$search = file_get_contents($root . '/src/Search/SearchService.php');
check(substr_count($search, 'TestOwnerVisibility::sql') >= 3, 'SearchService list paths use TestOwnerVisibility');
$countPos = strpos($search, 'function countGuestStudentsAtGu');
check($countPos !== false, 'countGuestStudentsAtGu exists');
if ($countPos !== false) {
    $countBlock = substr($search, $countPos, 800);
    check(!str_contains($countBlock, 'TestOwnerVisibility'), 'countGuestStudentsAtGu no TestOwner (counter)');
}

// ── 하드코딩 실이메일 금지 ──
$allowSrc = file_get_contents($root . '/src/Auth/TestAccountAllowlist.php');
check(!preg_match('/test_account_emails\'\s*=>\s*\'[^\']+@/', $allowSrc), 'no hardcoded emails in allowlist class');
check(
    !preg_match("/STUDY114_TEST_ACCOUNT_EMAILS',\s*'[^']+@/", file_get_contents($root . '/config/auth.php')),
    'config default empty string only'
);

echo "\nverify-test-card-hide: {$passed} passed, {$failed} failed\n";
exit($failed > 0 ? 1 : 0);
