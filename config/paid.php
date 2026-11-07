<?php

declare(strict_types=1);

$root = dirname(__DIR__);

return [
    // 운영은 SetEnv + paid-reminders.php fail-closed. 빈 값·dev-cron-key로 열지 않음.
    'cron_key'     => study114_env('STUDY114_CRON_KEY', ''),
    'sms_log_path' => $root . '/storage/logs/sms.log',
    'home_ui'      => rtrim(getenv('STUDY114_HOME_UI') ?: 'http://127.0.0.1:5174', '/'),
];
