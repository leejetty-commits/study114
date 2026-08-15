<?php

declare(strict_types=1);

putenv('STUDY114_DB_HOST=mysql');
putenv('STUDY114_DB_PORT=3306');
putenv('STUDY114_DB_NAME=study114_dev');
putenv('STUDY114_DB_USER=root');
putenv('STUDY114_DB_PASS=study114dev');

require __DIR__ . '/../src/bootstrap.php';

use Study114\Handoff\RecommendService;
use Study114\Search\SearchService;

$s = new SearchService();

$sky = $s->search('tutor', [], 1, 10, 'sky');
echo "SKY sort={$sky['sort']} total={$sky['total']}\n";
foreach ($sky['items'] as $i) {
    echo "  id={$i['id']} uni={$i['university_name']} rec={$i['recommend_count']}\n";
}

$rec = $s->search('tutor', [], 1, 10, 'recommend');
echo "RECOMMEND sort={$rec['sort']}\n";
foreach ($rec['items'] as $i) {
    echo "  id={$i['id']} rec={$i['recommend_count']}\n";
}

$roomSky = $s->search('room', [], 1, 5, 'sky');
echo "room sky normalized={$roomSky['sort']}\n";
$stuSky = $s->search('student', [], 1, 5, 'sky');
echo "student sky normalized={$stuSky['sort']}\n";

$room = $s->search('room', [], 1, 5, 'latest');
echo "room latest total={$room['total']} ok\n";

$rs = new RecommendService();
echo 'recommend_status=' . json_encode($rs->status(), JSON_UNESCAPED_UNICODE) . "\n";
$toggle = $rs->toggle(6, 'tutor', 1);
echo 'toggle=' . json_encode($toggle, JSON_UNESCAPED_UNICODE) . "\n";
$sky2 = $s->search('tutor', [], 1, 10, 'sky');
foreach ($sky2['items'] as $i) {
    if ((int) $i['id'] === 1) {
        echo "after_toggle id=1 rec={$i['recommend_count']}\n";
    }
}
