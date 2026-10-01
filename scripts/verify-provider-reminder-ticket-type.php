<?php

declare(strict_types=1);

/**
 * 이용권 만료·잔여 알림 — 폐지된 요청문 열람권(request_view) 팩이 DB 에 남아 있어도
 * 크론(processScheduledReminders)·잔여 알림(onTicketBalance)이 그 알림을 만들지 않는지 확인한다.
 * DB 에 접속하지 않는다: 가짜 PDO 가 provider_ticket_packs 행을 들고 있고,
 * SQL 에 ticket_type 조건이 있을 때만 그 조건으로 거른다(remaining·기한·D-day 조건은 항상 적용).
 * 메일 메타 로그는 임시 폴더로 보낸다.
 * 실행: D:\php8.2\php.exe scripts/verify-provider-reminder-ticket-type.php
 */

$tmpDir = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'study114-reminder-verify-' . bin2hex(random_bytes(4));
mkdir($tmpDir, 0775, true);
putenv('STUDY114_MAIL_LOG_PATH=' . $tmpDir . DIRECTORY_SEPARATOR . 'mail.log');

require_once dirname(__DIR__) . '/src/bootstrap.php';

use Study114\Paid\ProviderReminderCopy;
use Study114\Paid\ProviderReminderRepository;
use Study114\Paid\ProviderReminderService;

final class ReminderStmt
{
    private array $rows = [];
    private mixed $row = false;
    private mixed $column = false;

    public function __construct(private ReminderPdo $pdo, private string $sql)
    {
    }

    public function bindValue(mixed ...$args): bool
    {
        return true;
    }

    public function execute(?array $params = null): bool
    {
        $params ??= [];
        $this->pdo->log[] = preg_replace('/\s+/', ' ', trim($this->sql));
        if (str_contains($this->sql, 'FROM provider_ticket_packs')) {
            $this->rows = $this->pdo->selectPacks($this->sql, $params);
        } elseif (str_contains($this->sql, 'FROM users u')) {
            $this->row = ['email' => 'provider@example.com', 'phone' => null, 'name' => '공급자'];
        } elseif (str_contains($this->sql, 'INSERT INTO provider_system_notices')) {
            $this->pdo->notices[] = [
                'user_id' => $params[0], 'kind' => $params[1], 'title' => $params[3], 'body' => $params[4],
            ];
        }

        return true;
    }

    public function fetch(mixed ...$args): mixed
    {
        return $this->row;
    }

    public function fetchColumn(mixed ...$args): mixed
    {
        return $this->column;
    }

    public function fetchAll(mixed ...$args): array
    {
        return $this->rows;
    }

    public function rowCount(): int
    {
        return 0;
    }
}

final class ReminderPdo extends PDO
{
    /** @var list<string> */
    public array $log = [];
    /** @var list<array<string, mixed>> */
    public array $notices = [];

    /** @param list<array<string, mixed>> $packs */
    public function __construct(private array $packs)
    {
    }

    #[\ReturnTypeWillChange]
    public function prepare(string $query, array $options = []): ReminderStmt
    {
        return new ReminderStmt($this, $query);
    }

    /** @return list<array<string, mixed>> */
    public function selectPacks(string $sql, array $thresholds): array
    {
        $typeFilter = null;
        if (preg_match("/ticket_type\s*=\s*'([a-z_]+)'/", $sql, $m)) {
            $typeFilter = [$m[1]];
        } elseif (preg_match('/ticket_type\s+IN\s*\(([^)]*)\)/i', $sql, $m)) {
            $typeFilter = array_map(static fn (string $v): string => trim($v, " '\""), explode(',', $m[1]));
        }
        $thresholds = array_map('intval', $thresholds);

        return array_values(array_filter(
            $this->packs,
            static fn (array $p): bool => $p['remaining'] > 0
                && $p['days_left'] > 0
                && in_array($p['days_left'], $thresholds, true)
                && ($typeFilter === null || in_array($p['ticket_type'], $typeFilter, true)),
        ));
    }
}

$results = [];
function ok(string $name, bool $cond, string $detail = ''): void
{
    global $results;
    $results[] = $cond;
    echo ($cond ? 'PASS ' : 'FAIL ') . $name . ($cond || $detail === '' ? '' : ' — ' . $detail) . "\n";
}

$packs = [
    ['id' => 1, 'user_id' => 7, 'ticket_type' => 'memo', 'remaining' => 3, 'expires_at' => '2026-10-09 00:00:00', 'days_left' => 7],
    ['id' => 2, 'user_id' => 7, 'ticket_type' => 'request_view', 'remaining' => 5, 'expires_at' => '2026-10-09 00:00:00', 'days_left' => 7],
    ['id' => 3, 'user_id' => 7, 'ticket_type' => 'request_view', 'remaining' => 2, 'expires_at' => '2026-11-01 00:00:00', 'days_left' => 30],
    ['id' => 4, 'user_id' => 7, 'ticket_type' => 'memo', 'remaining' => 1, 'expires_at' => '2026-11-01 00:00:00', 'days_left' => 30],
    ['id' => 5, 'user_id' => 7, 'ticket_type' => 'memo', 'remaining' => 0, 'expires_at' => '2026-10-09 00:00:00', 'days_left' => 7],
    ['id' => 6, 'user_id' => 7, 'ticket_type' => 'memo', 'remaining' => 4, 'expires_at' => '2026-10-14 00:00:00', 'days_left' => 12],
];

try {
    echo "=== A. listTicketPackExpiryCandidates: request_view 팩 제외 · memo 팩 유지 ===\n";
    $pdo = new ReminderPdo($packs);
    $rows = (new ProviderReminderRepository($pdo))->listTicketPackExpiryCandidates([30, 7]);
    $ids = array_map(static fn (array $r): int => (int) $r['id'], $rows);
    sort($ids);
    $types = array_unique(array_map(static fn (array $r): string => (string) $r['ticket_type'], $rows));
    ok('후보는 memo 팩 1·4번만', $ids === [1, 4], 'ids=' . implode(',', $ids));
    ok('후보에 request_view 없음', !in_array('request_view', $types, true), implode(',', $types));
    ok("SQL 에 ticket_type = 'memo' 조건", (bool) preg_grep("/FROM provider_ticket_packs WHERE ticket_type = 'memo'/", $pdo->log));

    echo "=== B. processScheduledReminders(크론): 요청문 열람권 만료 알림 0건 ===\n";
    $pdo = new ReminderPdo($packs);
    $svc = new ProviderReminderService(new ProviderReminderRepository($pdo));
    $result = $svc->processScheduledReminders();
    $kinds = array_map(static fn (array $n): string => (string) $n['kind'], $pdo->notices);
    sort($kinds);
    ok('처리 건수 2(memo 팩 2개)', $result['processed'] === 2, (string) $result['processed']);
    ok('온사이트 알림 = memo D-7 · D-30', $kinds === ['ticket_pack_expiry_memo_d30', 'ticket_pack_expiry_memo_d7'], implode(',', $kinds));
    ok('request_view 종류 알림 없음', preg_grep('/request_view/', $kinds) === []);
    $titles = implode(' | ', array_map(static fn (array $n): string => (string) $n['title'], $pdo->notices));
    ok('알림 제목에 「요청문 열람권」 없음', !str_contains($titles, '요청문 열람권'), $titles);
    ok('알림 제목은 「쪽지권」', substr_count($titles, '쪽지권') === 2, $titles);

    echo "=== C. onTicketBalance: request_view 는 무시 · memo 는 그대로 ===\n";
    $pdo = new ReminderPdo([]);
    $svc = new ProviderReminderService(new ProviderReminderRepository($pdo));
    $svc->onTicketBalance(7, 'request_view', 0);
    $svc->onTicketBalance(7, 'request_view', 1);
    ok('request_view 잔여 알림 SQL 0건', $pdo->log === [], implode(' | ', $pdo->log));
    $svc->onTicketBalance(7, 'memo', 1);
    $memoKinds = array_map(static fn (array $n): string => (string) $n['kind'], $pdo->notices);
    ok('memo 1회 남음 알림 1건', $memoKinds === ['memo_remaining_1'], implode(',', $memoKinds));
    ok('memo 알림 제목 「쪽지권 1회 남았습니다」', ($pdo->notices[0]['title'] ?? '') === '쪽지권 1회 남았습니다', (string) ($pdo->notices[0]['title'] ?? ''));

    echo "=== D. ProviderReminderCopy: 요청문 열람권 라벨 제거 ===\n";
    $copy = new ProviderReminderCopy();
    ok("ticketLabel('memo') = 쪽지권", $copy->ticketLabel('memo') === '쪽지권');
    $src = (string) file_get_contents(dirname(__DIR__) . '/src/Paid/ProviderReminderCopy.php');
    ok('소스에 「요청문 열람권」 없음', !str_contains($src, '요청문 열람권'));
} finally {
    foreach (glob($tmpDir . DIRECTORY_SEPARATOR . '*') ?: [] as $f) {
        unlink($f);
    }
    rmdir($tmpDir);
}

$failed = count(array_filter($results, static fn (bool $r): bool => !$r));
echo "\n" . (count($results) - $failed) . '/' . count($results) . " PASS\n";
exit($failed === 0 ? 0 : 1);
