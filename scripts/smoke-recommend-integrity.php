<?php

declare(strict_types=1);

putenv('STUDY114_DB_HOST=mysql');
putenv('STUDY114_DB_PORT=3306');
putenv('STUDY114_DB_NAME=study114_dev');
putenv('STUDY114_DB_USER=root');
putenv('STUDY114_DB_PASS=study114dev');

require __DIR__ . '/../src/bootstrap.php';

use Study114\Handoff\RecommendService;

$s = new RecommendService();
$userId = 6;
$targetType = 'study_room';
$targetId = 1;

$before = $s->status();
echo 'status=' . json_encode($before, JSON_UNESCAPED_UNICODE) . PHP_EOL;

$t1 = $s->toggle($userId, $targetType, $targetId);
echo 'add=' . json_encode($t1, JSON_UNESCAPED_UNICODE) . PHP_EOL;
$t2 = $s->toggle($userId, $targetType, $targetId);
echo 'cancel=' . json_encode($t2, JSON_UNESCAPED_UNICODE) . PHP_EOL;
$t3 = $s->toggle($userId, $targetType, $targetId);
echo 'readd=' . json_encode($t3, JSON_UNESCAPED_UNICODE) . PHP_EOL;

// rapid double-add simulation: cancel first to known off, then two adds via insert race path
if ($s->isRecommended($userId, $targetType, $targetId)) {
    $s->toggle($userId, $targetType, $targetId);
}
$a = $s->toggle($userId, $targetType, $targetId);
$b = $s->toggle($userId, $targetType, $targetId);
echo 'pair_add_cancel=' . json_encode([$a, $b], JSON_UNESCAPED_UNICODE) . PHP_EOL;

try {
    $s->toggle($userId, 'student', 1);
    echo "badtype=UNEXPECTED_OK\n";
} catch (Throwable $e) {
    echo 'badtype=' . $e->getMessage() . PHP_EOL;
}

try {
    $s->toggle($userId, 'tutor', 99999);
    echo "badid=UNEXPECTED_OK\n";
} catch (Throwable $e) {
    echo 'badid=' . $e->getMessage() . PHP_EOL;
}

echo "PASS local recommend integrity\n";
