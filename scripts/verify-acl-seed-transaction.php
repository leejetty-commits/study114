<?php

declare(strict_types=1);

/**
 * 로컬 테스트 DB 전용 — ACL seed dry-run · transaction · rollback 확인.
 * 컨테이너 안에서 실행한다: docker exec study114-api-dev php scripts/verify-acl-seed-transaction.php
 * 운영 DB에서 실행하지 말 것. STUDY114_DB_NAME 이 study114_dev 가 아니면 즉시 중단한다.
 */

require_once dirname(__DIR__) . '/src/bootstrap.php';

use Study114\Admin\ContentSchemaMigrateService;
use Study114\Database\Connection;

$dbName = getenv('STUDY114_DB_NAME') ?: '';
if ($dbName !== 'study114_dev') {
    fwrite(STDERR, "안전장치: study114_dev 가 아닙니다 (현재: {$dbName}). 중단합니다.\n");
    exit(2);
}

$pdo = Connection::get();
$svc = new ContentSchemaMigrateService();
$results = [];

function ok(string $name, bool $cond, string $detail = ''): void
{
    global $results;
    $status = $cond ? 'PASS' : 'FAIL';
    $results[] = $status;
    echo $status . ' ' . $name . ($cond ? '' : ' — ' . $detail) . "\n";
}

function hasGuestFilter(PDO $pdo): bool
{
    return (int) $pdo->query(
        "SELECT COUNT(*) FROM information_schema.columns
          WHERE table_schema = DATABASE()
            AND table_name = 'right_rail_slot_definitions'
            AND column_name = 'guest_filter'"
    )->fetchColumn() > 0;
}

function snapshot(PDO $pdo): array
{
    $ch = $pdo->query(
        "SELECT board_key, allowed_roles_json FROM board_channel_definitions ORDER BY board_key"
    )->fetchAll(PDO::FETCH_KEY_PAIR);
    $gf = hasGuestFilter($pdo) ? "COALESCE(guest_filter,'')" : "''";
    $rl = $pdo->query(
        "SELECT slot_key, CONCAT(COALESCE(source_board_keys_json,''), '|', {$gf})
         FROM right_rail_slot_definitions ORDER BY slot_key"
    )->fetchAll(PDO::FETCH_KEY_PAIR);

    return ['channels' => $ch, 'rails' => $rl];
}

echo "=== 0. guest_filter 컬럼 선행 확인 ===\n";
$hadGuestFilter = hasGuestFilter($pdo);
echo 'guest_filter 컬럼 존재 = ' . var_export($hadGuestFilter, true) . "\n";
if (!$hadGuestFilter) {
    // 컬럼이 없으면 planAclSeed() 가 PDOException 을 던진다.
    // 운영에서도 컬럼 추가(DDL)가 seed 보다 먼저 필요하다는 뜻이다.
    try {
        $svc->planAclSeed();
        ok('컬럼 없을 때 plan 이 예외 없이 동작', false, '예외가 나야 하는데 통과함');
    } catch (Throwable $e) {
        ok('컬럼 없으면 plan 이 즉시 실패 (DDL 선행 필요)', true);
    }
    echo "테스트 DB에 guest_filter 컬럼을 추가한다 (운영은 apply() 의 DDL 단계가 담당).\n";
    $pdo->exec(
        "ALTER TABLE right_rail_slot_definitions
           ADD COLUMN guest_filter VARCHAR(32) NULL AFTER source_board_keys_json"
    );
}

echo "\n=== 1. dry-run plan (쓰기 없음) ===\n";
$before = snapshot($pdo);
$plan = $svc->planAclSeed();

echo "plan.ok = " . var_export($plan['ok'], true) . "\n";
foreach ($plan['channels'] as $p) {
    printf(
        "  channel %-14s action=%-18s before=%s after=%s\n",
        $p['board_key'] ?? '?',
        $p['action'] ?? '?',
        json_encode($p['before'] ?? null, JSON_UNESCAPED_UNICODE),
        json_encode($p['after'] ?? null, JSON_UNESCAPED_UNICODE),
    );
}
foreach ($plan['rails'] as $p) {
    printf(
        "  rail    %-18s action=%-18s before=%s after=%s\n",
        $p['slot_key'] ?? '?',
        $p['action'] ?? '?',
        json_encode($p['before'] ?? null, JSON_UNESCAPED_UNICODE),
        json_encode($p['after'] ?? null, JSON_UNESCAPED_UNICODE),
    );
}
printf("  family_collision action=%s\n", $plan['family_collision']['action'] ?? '?');
printf("  abort 건수 = %d\n", count($plan['abort']));

ok('dry-run plan 이 DB를 바꾸지 않음', snapshot($pdo) == $before);

echo "\n=== 2. apply(dry_run=true) ===\n";
$dry = $svc->apply(['dry_run' => true, 'abort_on_unexpected' => true]);
foreach ($dry['steps'] ?? [] as $s) {
    printf("  %-34s %s\n", $s['name'], $s['result']);
}
ok('apply(dry_run=true) 가 DB를 바꾸지 않음', snapshot($pdo) == $before);

echo "\n=== 3. 운영자 임의값 위에서 apply → 쓰기 전 전체 중단 ===\n";
$applied = $svc->apply(['dry_run' => false, 'abort_on_unexpected' => true]);
foreach ($applied['steps'] ?? [] as $s) {
    printf("  %-34s %s\n", $s['name'], substr($s['result'], 0, 60));
}
ok('예상 밖 값이 있으면 apply 가 DB를 바꾸지 않음', snapshot($pdo) == $before);
$aborts = $applied['acl_plan']['abort'] ?? [];
ok('중단된 행마다 rollback_sql 을 제공', $aborts !== [] && array_reduce(
    $aborts,
    static fn (bool $c, array $a): bool => $c && ($a['rollback_sql'] ?? '') !== '',
    true,
), 'abort=' . count($aborts));

echo "\n=== 4. replaceable 값으로 정규화 후 apply → 목표값 반영 ===\n";
// 로컬 테스트 DB 한정. 운영에서는 운영자 임의값을 이렇게 덮어쓰지 않는다.
$pdo->exec("UPDATE board_channel_definitions
               SET menu_label = '신뢰·증빙자료 제출',
                   allowed_roles_json = '[\"study_room\",\"tutor\",\"admin\"]'
             WHERE board_key = 'submission'");
$pdo->exec("UPDATE right_rail_slot_definitions
               SET source_board_keys_json = '[\"notice\",\"concern-director\",\"concern-tutor\",\"concern-family\"]',
                   guest_filter = 'summary_only'
             WHERE slot_key = 'home_right_rail'");
$pdo->exec("UPDATE right_rail_slot_definitions
               SET source_board_keys_json = '[\"faq\",\"concern-family\",\"safe-guide\"]',
                   guest_filter = 'summary_only'
             WHERE slot_key = 'search_right_rail'");
$pdo->exec("UPDATE right_rail_slot_definitions
               SET source_board_keys_json = '[\"safe-guide\",\"notice\",\"submission\"]',
                   guest_filter = 'allow'
             WHERE slot_key = 'detail_right_rail'");

$applied2 = $svc->apply(['dry_run' => false, 'abort_on_unexpected' => true]);
foreach ($applied2['steps'] ?? [] as $s) {
    printf("  %-34s %s\n", $s['name'], substr($s['result'], 0, 60));
}
$after = snapshot($pdo);
$sub = $after['channels']['submission'] ?? '';
ok('적용 후 submission allowed_roles_json = ["tutor","admin"]', $sub === '["tutor", "admin"]' || $sub === '["tutor","admin"]', $sub);
foreach (['home_right_rail' => 'intro_only', 'search_right_rail' => 'intro_only', 'detail_right_rail' => 'allow'] as $slot => $gf) {
    $val = $after['rails'][$slot] ?? '';
    ok("적용 후 {$slot} guestFilter={$gf}", str_ends_with($val, '|' . $gf), $val);
}
foreach (['home_right_rail', 'search_right_rail'] as $slot) {
    $val = $after['rails'][$slot] ?? '';
    ok(
        "적용 후 {$slot} sourceBoardKeys 가 concern-parent 정본",
        !str_contains($val, 'concern-family') && str_contains($val, 'concern-parent'),
        $val,
    );
}

echo "\n=== 5. 재실행 시 noop ===\n";
$again = $svc->planAclSeed();
$actions = array_map(static fn (array $p): string => (string) ($p['action'] ?? ''), [...$again['channels'], ...$again['rails']]);
ok('두 번째 plan 은 전부 noop', array_unique($actions) === ['noop'], implode(',', array_unique($actions)));

echo "\n=== 6. family/parent 충돌 → abort_unexpected, 쓰기 없음 ===\n";
$pdo->exec(
    "INSERT INTO board_channel_definitions
        (board_key, menu_label, board_type, preset_id, section_owner, visibility, allowed_roles_json)
     VALUES ('concern-family', 'ACL-E2E family', 'community', 'concern', 'community', 'role', '[\"parent\"]')
     ON DUPLICATE KEY UPDATE menu_label = VALUES(menu_label)"
);
$snapWithFamily = snapshot($pdo);
$collision = $svc->planAclSeed();
ok(
    'family/parent 동시 존재 시 plan.ok = false',
    $collision['ok'] === false,
    var_export($collision['ok'], true),
);
ok(
    'family_collision action = abort_unexpected',
    ($collision['family_collision']['action'] ?? '') === 'abort_unexpected',
    (string) ($collision['family_collision']['action'] ?? ''),
);
$abortApply = $svc->apply(['dry_run' => false, 'abort_on_unexpected' => true]);
ok('충돌 상태에서 apply 가 DB를 바꾸지 않음 (쓰기 전 전체 중단)', snapshot($pdo) == $snapWithFamily);
$pdo->exec("DELETE FROM board_channel_definitions WHERE board_key = 'concern-family'");

echo "\n=== 7. rollback — 보관한 before 값으로 복원 ===\n";
$pdo->beginTransaction();
try {
    $st = $pdo->prepare('UPDATE board_channel_definitions SET allowed_roles_json = ? WHERE board_key = ?');
    foreach ($before['channels'] as $key => $val) {
        $st->execute([$val, $key]);
    }
    $rs = $pdo->prepare('UPDATE right_rail_slot_definitions SET source_board_keys_json = ?, guest_filter = ? WHERE slot_key = ?');
    foreach ($before['rails'] as $slot => $combined) {
        [$src, $gf] = explode('|', $combined, 2);
        $rs->execute([$src === '' ? null : $src, $gf === '' ? null : $gf, $slot]);
    }
    $pdo->commit();
} catch (Throwable $e) {
    $pdo->rollBack();
    throw $e;
}
ok('before 스냅샷으로 완전 복원됨', snapshot($pdo) == $before);

echo "\n=== 8. transaction rollback 동작 확인 ===\n";
$pdo->beginTransaction();
$pdo->exec("UPDATE board_channel_definitions SET allowed_roles_json = '[\"rollback-probe\"]' WHERE board_key = 'submission'");
$mid = $pdo->query("SELECT allowed_roles_json FROM board_channel_definitions WHERE board_key='submission'")->fetchColumn();
$pdo->rollBack();
$post = $pdo->query("SELECT allowed_roles_json FROM board_channel_definitions WHERE board_key='submission'")->fetchColumn();
ok('트랜잭션 안에서는 변경이 보임', $mid === '["rollback-probe"]', (string) $mid);
ok('rollback 후 원래 값 복귀', $post === ($before['channels']['submission'] ?? ''), (string) $post);

$fail = count(array_filter($results, static fn (string $r): bool => $r === 'FAIL'));
$pass = count($results) - $fail;
echo "\n{$pass} PASS · {$fail} FAIL · total " . count($results) . "\n";
exit($fail > 0 ? 1 : 0);
