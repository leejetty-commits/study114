<?php

declare(strict_types=1);

/**
 * 351 같은 번호 최대 3계정 — 판정·허용목록·탈퇴 제외·문구 검증.
 * 실번호·운영 DB 없음. Fake PDO.
 *
 * 실행: php scripts/verify-phone-account-limit.php
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

use Study114\Auth\PhoneAccountLimit;
use Study114\Auth\PhoneAccountLimitException;
use Study114\Auth\PhoneNormalizer;
use Study114\Auth\PhoneVerificationException;
use Study114\Auth\PhoneVerificationService;

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
 * users + user_profiles 흉내 Fake PDO.
 *
 * @param list<array{id:int,email:string,status:string,phone:string}> $accounts
 */
function fakeAccountsPdo(array $accounts): PDO
{
    return new class ($accounts) extends PDO {
        /** @var list<array{id:int,email:string,status:string,phone:string}> */
        public array $accounts;
        /** @var list<string> */
        public array $queries = [];

        /** @param list<array{id:int,email:string,status:string,phone:string}> $accounts */
        public function __construct(array $accounts)
        {
            $this->accounts = $accounts;
        }

        public function prepare(string $query, array $options = []): PDOStatement|false
        {
            $this->queries[] = $query;
            $accounts = &$this->accounts;

            return new class ($accounts, $query) extends PDOStatement {
                /** @var list<array{id:int,email:string,status:string,phone:string}> */
                private array $accounts;
                private string $query;
                /** @var list<mixed> */
                private array $params = [];
                /** @var list<mixed> */
                private array $result = [];
                private mixed $scalar = false;

                /** @param list<array{id:int,email:string,status:string,phone:string}> $accounts */
                public function __construct(array &$accounts, string $query)
                {
                    $this->accounts = &$accounts;
                    $this->query = $query;
                }

                public function execute(?array $params = null): bool
                {
                    $this->params = array_values($params ?? []);
                    $this->result = [];
                    $this->scalar = false;

                    if (str_contains($this->query, 'FROM user_profiles p')
                        && str_contains($this->query, 'INNER JOIN users u')
                    ) {
                        $phone = PhoneNormalizer::digits((string) ($this->params[0] ?? ''));
                        $idx = 1;
                        $excludeWithdrawn = str_contains($this->query, "status <> 'withdrawn'");
                        $allowEmails = [];
                        if (preg_match('/NOT IN \(([^)]+)\)/', $this->query, $m)) {
                            $n = substr_count($m[1], '?');
                            for ($i = 0; $i < $n; $i++) {
                                $allowEmails[] = strtolower(trim((string) $this->params[$idx++]));
                            }
                        }
                        $excludeId = null;
                        if (str_contains($this->query, 'user_id <> ?')) {
                            $excludeId = (int) $this->params[$idx];
                        }
                        foreach ($this->accounts as $row) {
                            if (PhoneNormalizer::digits($row['phone']) !== $phone) {
                                continue;
                            }
                            if ($excludeWithdrawn && ($row['status'] ?? '') === 'withdrawn') {
                                continue;
                            }
                            $email = strtolower(trim($row['email']));
                            if ($allowEmails !== [] && in_array($email, $allowEmails, true)) {
                                continue;
                            }
                            if ($excludeId !== null && (int) $row['id'] === $excludeId) {
                                continue;
                            }
                            $this->result[] = (int) $row['id'];
                        }

                        return true;
                    }

                    if (str_contains($this->query, 'SELECT email FROM users')) {
                        $id = (int) ($this->params[0] ?? 0);
                        foreach ($this->accounts as $row) {
                            if ((int) $row['id'] === $id) {
                                $this->scalar = $row['email'];

                                return true;
                            }
                        }
                        $this->scalar = false;

                        return true;
                    }

                    return true;
                }

                public function fetchAll(int $mode = PDO::FETCH_DEFAULT, ...$args): array
                {
                    if ($mode === PDO::FETCH_COLUMN) {
                        return $this->result;
                    }

                    return array_map(static fn ($id) => ['user_id' => $id], $this->result);
                }

                public function fetchColumn(int $column = 0): mixed
                {
                    return $this->scalar;
                }
            };
        }
    };
}

$phoneA = '01012345678';
$phoneFmt = '010-1234-5678';
check(PhoneNormalizer::digits($phoneFmt) === $phoneA, 'phone format digits equal');

$base = [
    ['id' => 1, 'email' => 'a1@example.com', 'status' => 'active', 'phone' => $phoneA],
    ['id' => 2, 'email' => 'a2@example.com', 'status' => 'active', 'phone' => $phoneA],
];

// 0·1·2 → under limit
setTestEmails('');
$pdo0 = fakeAccountsPdo([]);
check(PhoneAccountLimit::countActiveAccounts($pdo0, $phoneA) === 0, 'count 0');
$threw = false;
try {
    PhoneAccountLimit::assertUnderLimit($pdo0, $phoneA);
} catch (PhoneAccountLimitException) {
    $threw = true;
}
check(!$threw, '0 accounts → assert ok');

$pdo2 = fakeAccountsPdo($base);
check(PhoneAccountLimit::countActiveAccounts($pdo2, $phoneA) === 2, 'count 2');
$threw = false;
try {
    PhoneAccountLimit::assertUnderLimit($pdo2, $phoneFmt);
} catch (PhoneAccountLimitException) {
    $threw = true;
}
check(!$threw, '2 accounts → assert ok (formatted phone)');

$pdo3 = fakeAccountsPdo(array_merge($base, [
    ['id' => 3, 'email' => 'a3@example.com', 'status' => 'active', 'phone' => $phoneA],
]));
check(PhoneAccountLimit::countActiveAccounts($pdo3, $phoneA) === 3, 'count 3');
$threw = false;
$msg = '';
try {
    PhoneAccountLimit::assertUnderLimit($pdo3, $phoneA);
} catch (PhoneAccountLimitException $e) {
    $threw = true;
    $msg = $e->getMessage();
}
check($threw, '3 accounts → assert rejects');
check($msg === PhoneAccountLimit::MESSAGE, 'reject message exact');
check((new PhoneAccountLimitException())->errorCode() === 'phone_account_limit', 'error code');

// 탈퇴 포함 3개(활성 2 + 탈퇴 1) → 성공(권장안 COUNT_WITHDRAWN=false)
$pdoWithdrawn = fakeAccountsPdo(array_merge($base, [
    ['id' => 9, 'email' => 'gone@example.com', 'status' => 'withdrawn', 'phone' => $phoneA],
]));
check(PhoneAccountLimit::COUNT_WITHDRAWN === false, 'COUNT_WITHDRAWN false (권장안)');
check(PhoneAccountLimit::countActiveAccounts($pdoWithdrawn, $phoneA) === 2, 'withdrawn not counted');
$threw = false;
try {
    PhoneAccountLimit::assertUnderLimit($pdoWithdrawn, $phoneA);
} catch (PhoneAccountLimitException) {
    $threw = true;
}
check(!$threw, '2 active + 1 withdrawn → ok');

// 자기 제외
$pdoSelf = fakeAccountsPdo(array_merge($base, [
    ['id' => 3, 'email' => 'a3@example.com', 'status' => 'active', 'phone' => $phoneA],
]));
check(PhoneAccountLimit::countActiveAccounts($pdoSelf, $phoneA, 3) === 2, 'exclude self → 2');
$threw = false;
try {
    PhoneAccountLimit::assertUnderLimit($pdoSelf, $phoneA, 3);
} catch (PhoneAccountLimitException) {
    $threw = true;
}
check(!$threw, 'phone change self excluded → ok');

// 허용목록: 카운트 제외
setTestEmails('test1@example.com,test2@example.com');
$pdoAllow = fakeAccountsPdo([
    ['id' => 1, 'email' => 'a1@example.com', 'status' => 'active', 'phone' => $phoneA],
    ['id' => 2, 'email' => 'a2@example.com', 'status' => 'active', 'phone' => $phoneA],
    ['id' => 3, 'email' => 'a3@example.com', 'status' => 'active', 'phone' => $phoneA],
    ['id' => 10, 'email' => 'test1@example.com', 'status' => 'active', 'phone' => $phoneA],
    ['id' => 11, 'email' => 'test2@example.com', 'status' => 'active', 'phone' => $phoneA],
]);
check(PhoneAccountLimit::countActiveAccounts($pdoAllow, $phoneA) === 3, 'allowlist emails not in count');
$threw = false;
try {
    PhoneAccountLimit::assertUnderLimit($pdoAllow, $phoneA, null, 'newbie@example.com');
} catch (PhoneAccountLimitException) {
    $threw = true;
}
check($threw, '3 non-test → still reject for normal email');

// 허용목록 actor → 차단 스킵
$threw = false;
try {
    PhoneAccountLimit::assertUnderLimit($pdoAllow, $phoneA, null, 'test1@example.com');
} catch (PhoneAccountLimitException) {
    $threw = true;
}
check(!$threw, 'allowlist actor skips block');

// FOR UPDATE 절 포함
setTestEmails('');
$pdoLock = fakeAccountsPdo($base);
PhoneAccountLimit::countActiveAccounts($pdoLock, $phoneA, null, true);
$lastQ = $pdoLock->queries[array_key_last($pdoLock->queries)] ?? '';
check(str_contains($lastQ, 'FOR UPDATE'), 'forUpdate adds FOR UPDATE');

// OTP 경로: PhoneVerificationException 코드 매핑(문자 미발송 전제 — sendOtp 호출 없이 예외 변환만)
$mapped = new PhoneVerificationException('phone_account_limit', PhoneAccountLimit::MESSAGE);
check($mapped->errorCode() === 'phone_account_limit', 'OTP error code phone_account_limit');

// 호출 지점 파일 문자열
$signup = file_get_contents($root . '/src/Auth/SignupService.php');
$contact = file_get_contents($root . '/src/Auth/AccountContactService.php');
$otp = file_get_contents($root . '/src/Auth/PhoneVerificationService.php');
check(str_contains($signup, 'PhoneAccountLimit::assertUnderLimit'), 'SignupService calls assert');
check(str_contains($contact, 'PhoneAccountLimit::assertUnderLimit'), 'AccountContactService calls assert');
check(str_contains($otp, 'PhoneAccountLimit::assertUnderLimit'), 'PhoneVerificationService calls assert');

// 번호 원문 로그 금지 — PhoneAccountLimit 에 error_log/phone 원문 dump 없음
$limitSrc = file_get_contents($root . '/src/Auth/PhoneAccountLimit.php');
check(!preg_match('/error_log\s*\(/', $limitSrc), 'PhoneAccountLimit no error_log');

echo "\nverify-phone-account-limit: {$passed} passed, {$failed} failed\n";
exit($failed > 0 ? 1 : 0);
