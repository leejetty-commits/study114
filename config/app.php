<?php

declare(strict_types=1);

return [
    'name'    => 'study114',
    'env'     => getenv('STUDY114_APP_ENV') ?: 'local',
    'debug'   => (getenv('STUDY114_DEBUG') ?: '1') === '1',
    'charset' => 'UTF-8',
    'url'     => rtrim(getenv('STUDY114_API_BASE') ?: 'http://localhost', '/'),
];
