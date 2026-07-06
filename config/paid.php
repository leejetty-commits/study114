<?php

declare(strict_types=1);

$root = dirname(__DIR__);

return [
    'cron_key'     => getenv('STUDY114_CRON_KEY') ?: 'dev-cron-key',
    'sms_log_path' => $root . '/storage/logs/sms.log',
    'home_ui'      => rtrim(getenv('STUDY114_HOME_UI') ?: 'http://127.0.0.1:5174', '/'),
];
