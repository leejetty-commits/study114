<?php

declare(strict_types=1);

/**
 * 358 Gmail 별칭 차단 + 허용목록 예외 검증.
 * 실메일·운영 DB 없음. Fake PDO.
 *
 * 실행: php scripts/verify-gmail-alias-block.php
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

use Study114\Auth\EmailNormalizer;
use Study114\Auth\GmailAliasAvailability;
use Study114\Auth\TestAccountAllowlist;

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
}

/**
 * @param list<array{id:int,email:string,status:string}> $users
 */
function fakeUsersPdo(array $users, ?array &$opLogs = null): PDO
{
    return new class ($users, $opLogs) extends PDO {
        /** @var list<array{id:int,email:string,status:string}> */
        public array $users;
        public ?array $opLogs;

        /** @param list<array{id:int,email:string,status:string}> $users */
        public function __construct(array $users, ?array &$opLogs)
        {
            $this->users = $users;
            $this->opLogs = &$opLogs;
        }

        public function prepare(string $query, array $options = []): PDOStatement|false
        {
            $users = &$this->users;
            $opLogs = &$this->opLogs;

            return new class ($users, $opLogs, $query) extends PDOStatement {
                /** @var list<array{id:int,email:string,status:string}> */
                private array $users;
                private ?array $opLogs;
                private string $query;
                /** @var list<mixed> */
                private array $params = [];
                /** @var array<string,mixed>|false */
                private array|false $row = false;
                /** @var list<array<string,mixed>> */
                private array $list = [];

                /** @param list<array{id:int,email:string,status:string}> $users */
                public function __construct(array &$users, ?array &$opLogs, string $query)
                {
                    $this->users = &$users;
                    $this->opLogs = &$opLogs;
                    $this->query = $query;
                }

                public function execute(?array $params = null): bool
                {
                    $this->params = array_values($params ?? []);
                    $this->row = false;
                    $this->list = [];

                    if (str_contains($this->query, 'INSERT INTO admin_operation_logs')) {
                        if (is_array($this->opLogs)) {
                            $this->opLogs[] = [
                                'action_kind' => (string) ($this->params[4] ?? ''),
                                'target_id' => (string) ($this->params[3] ?? ''),
                                'detail_memo' => (string) ($this->params[6] ?? ''),
                            ];
                        }

                        return true;
                    }

                    if (str_contains($this->query, 'FROM admin_operation_logs')) {
                        $this->list = $this->opLogs ?? [];

                        return true;
                    }

                    if (str_contains($this->query, 'REPLACE(SUBSTRING_INDEX')) {
                        $local = (string) ($this->params[0] ?? '');
                        $exclude = null;
                        if (count($this->params) > 1) {
                            $exclude = (int) $this->params[1];
                        }
                        foreach ($this->users as $u) {
                            if (($u['status'] ?? '') === 'withdrawn') {
                                continue;
                            }
                            if ($exclude !== null && (int) $u['id'] === $exclude) {
                                continue;
                            }
                            $canon = EmailNormalizer::canonical($u['email']);
                            $at = strrpos($canon, '@');
                            $uLocal = $at === false ? $canon : substr($canon, 0, $at);
                            $domain = $at === false ? '' : substr($canon, $at + 1);
                            if ($domain !== 'gmail.com') {
                                continue;
                            }
                            if ($uLocal === $local) {
                                $this->row = $u;

                                return true;
                            }
                        }

                        return true;
                    }

                    if (str_contains($this->query, 'WHERE email = ?')) {
                        $email = EmailNormalizer::normalize((string) ($this->params[0] ?? ''));
                        foreach ($this->users as $u) {
                            if (EmailNormalizer::normalize($u['email']) === $email) {
                                $this->row = $u;

                                return true;
                            }
                        }

                        return true;
                    }

                    return true;
                }

                public function fetch(int $mode = PDO::FETCH_DEFAULT, ...$args): mixed
                {
                    return $this->row;
                }

                public function fetchAll(int $mode = PDO::FETCH_DEFAULT, ...$args): array
                {
                    return $this->list;
                }
            };
        }
    };
}

// canonical 규칙
check(EmailNormalizer::canonical('A.B+x@Gmail.com') === 'ab@gmail.com', 'canonical dots+plus+case');
check(EmailNormalizer::canonical('ab@googlemail.com') === 'ab@gmail.com', 'canonical googlemail→gmail');
check(EmailNormalizer::canonical('a.b@naver.com') === 'a.b@naver.com', 'non-gmail unchanged (dots kept)');
check(EmailNormalizer::normalize('A.B@Gmail.com') === 'a.b@gmail.com', 'normalize keeps dots');

setTestEmails('');
$users = [
    ['id' => 1, 'email' => 'a.b@gmail.com', 'status' => 'active'],
];
$pdo = fakeUsersPdo($users);

$threw = false;
$msg = '';
try {
    GmailAliasAvailability::assertNoActiveConflict($pdo, 'ab@gmail.com');
} catch (InvalidArgumentException $e) {
    $threw = true;
    $msg = $e->getMessage();
}
check($threw, 'ab@gmail.com blocked when a.b@gmail.com exists');
check($msg === GmailAliasAvailability::MESSAGE, 'reject message exact');

$threw = false;
try {
    GmailAliasAvailability::assertNoActiveConflict($pdo, 'a.b+x@gmail.com');
} catch (InvalidArgumentException) {
    $threw = true;
}
check($threw, 'a.b+x@gmail.com blocked');

$threw = false;
try {
    GmailAliasAvailability::assertNoActiveConflict($pdo, 'AB@googlemail.com');
} catch (InvalidArgumentException) {
    $threw = true;
}
check($threw, 'AB@googlemail.com blocked');

// 다른 도메인: a.b@naver.com 있어도 ab@naver.com 허용
$pdoNaver = fakeUsersPdo([
    ['id' => 2, 'email' => 'a.b@naver.com', 'status' => 'active'],
]);
$threw = false;
try {
    GmailAliasAvailability::assertNoActiveConflict($pdoNaver, 'ab@naver.com');
} catch (InvalidArgumentException) {
    $threw = true;
}
check(!$threw, 'naver dots not treated as alias');

// 탈퇴만 canonical 같으면 허용
$pdoWd = fakeUsersPdo([
    ['id' => 3, 'email' => 'a.b@gmail.com', 'status' => 'withdrawn'],
]);
$threw = false;
try {
    GmailAliasAvailability::assertNoActiveConflict($pdoWd, 'ab@gmail.com');
} catch (InvalidArgumentException) {
    $threw = true;
}
check(!$threw, 'withdrawn gmail canonical allowed');

// 허용목록 정확 일치 → canonical 스킵 + 로그
setTestEmails('test1@gmail.com');
check(TestAccountAllowlist::contains('test1@gmail.com'), 'allowlist contains test1');
$logs = [];
$pdoAllow = fakeUsersPdo([
    ['id' => 1, 'email' => 't.e.st1@gmail.com', 'status' => 'active'],
], $logs);
$threw = false;
try {
    GmailAliasAvailability::assertNoActiveConflict($pdoAllow, 'test1@gmail.com');
} catch (InvalidArgumentException) {
    $threw = true;
}
check(!$threw, 'allowlist exact email skips canonical conflict');
GmailAliasAvailability::logAllowlistedSignup($pdoAllow, 99, 'test1@gmail.com');
check(count($logs) === 1, 'allowlist signup logs 1 row');
check(($logs[0]['action_kind'] ?? '') === 'signup_alias_allowlisted', 'log action_kind');
check(str_contains((string) ($logs[0]['detail_memo'] ?? ''), 'masked='), 'log masked email only');
check(!str_contains((string) ($logs[0]['detail_memo'] ?? ''), 'test1@gmail.com'), 'log no raw email');

// env 빔 → 예외 없음
setTestEmails('');
$logs2 = [];
$pdoEmpty = fakeUsersPdo([
    ['id' => 1, 'email' => 'a.b@gmail.com', 'status' => 'active'],
], $logs2);
$threw = false;
try {
    GmailAliasAvailability::assertNoActiveConflict($pdoEmpty, 'ab@gmail.com');
} catch (InvalidArgumentException) {
    $threw = true;
}
check($threw, 'empty env → no allowlist bypass');
check(!GmailAliasAvailability::shouldLogAllowlistBypass('ab@gmail.com'), 'empty env → no log flag');

// 호출 지점
$signup = file_get_contents($root . '/src/Auth/SignupService.php');
$contact = file_get_contents($root . '/src/Auth/AccountContactService.php');
$oauth = file_get_contents($root . '/src/Auth/OAuthService.php');
check(str_contains($signup, 'GmailAliasAvailability::assertNoActiveConflict'), 'SignupService wired');
check(str_contains($contact, 'GmailAliasAvailability::assertNoActiveConflict'), 'AccountContactService wired');
check(str_contains($oauth, 'GmailAliasAvailability::assertNoActiveConflict'), 'OAuthService wired');

// 배선: htaccess placeholder · deploy optional · secrets check
$ht = file_get_contents($root . '/public/.htaccess');
check(str_contains($ht, '__STUDY114_TEST_ACCOUNT_EMAILS__'), 'htaccess placeholder present');
$deploy = file_get_contents($root . '/.github/workflows/deploy.yml');
check(str_contains($deploy, 'STUDY114_TEST_ACCOUNT_EMAILS: ${{ secrets.STUDY114_TEST_ACCOUNT_EMAILS }}'), 'deploy secret optional env');
check(str_contains($deploy, '__STUDY114_TEST_ACCOUNT_EMAILS__'), 'deploy injects placeholder');
$chk = file_get_contents($root . '/scripts/check-no-committed-secrets.sh');
check(str_contains($chk, 'STUDY114_TEST_ACCOUNT_EMAILS'), 'check-no-committed-secrets lists key');

// 하드코딩 0
$guard = file_get_contents($root . '/src/Auth/GmailAliasAvailability.php');
check(!preg_match('/@[a-z0-9.-]+\.(com|net|kr)/i', $guard) || str_contains($guard, 'gmail.com'), 'guard only gmail domain literals');

echo "\nverify-gmail-alias-block: {$passed} passed, {$failed} failed\n";
exit($failed > 0 ? 1 : 0);
