<?php

declare(strict_types=1);

/**
 * 062 적용 후 레거시 팩 dry-run 숫자. 운영에서 실행하지 않는다.
 */

require_once dirname(__DIR__) . '/src/bootstrap.php';

use Study114\Database\Connection;

$pdo = Connection::get();

$total = (int) $pdo->query('SELECT COUNT(*) FROM provider_ticket_packs')->fetchColumn();
$withProvider = (int) $pdo->query(
    'SELECT COUNT(*) FROM provider_ticket_packs WHERE provider_id IS NOT NULL'
)->fetchColumn();
$nullProvider = (int) $pdo->query(
    'SELECT COUNT(*) FROM provider_ticket_packs WHERE provider_id IS NULL'
)->fetchColumn();

$ambiguous = (int) $pdo->query(
    'SELECT COUNT(*) FROM provider_ticket_packs p
     WHERE p.provider_id IS NULL
       AND (SELECT COUNT(*) FROM tutors t WHERE t.user_id = p.user_id) > 0
       AND (SELECT COUNT(*) FROM study_rooms r WHERE r.user_id = p.user_id AND r.deleted_at IS NULL) > 0'
)->fetchColumn();

$singleStillNull = $nullProvider - $ambiguous;

$bySource = $pdo->query(
    'SELECT source, COUNT(*) AS cnt FROM provider_ticket_packs GROUP BY source ORDER BY source'
)->fetchAll(PDO::FETCH_ASSOC);

echo "legacy_report pack_total={$total}\n";
echo "legacy_report backfilled_or_assigned={$withProvider}\n";
echo "legacy_report still_null={$nullProvider}\n";
echo "legacy_report ambiguous_multi_profile={$ambiguous}\n";
echo "legacy_report single_or_none_still_null={$singleStillNull}\n";
foreach ($bySource as $row) {
    echo 'legacy_report source_' . (string) $row['source'] . '=' . (int) $row['cnt'] . "\n";
}
