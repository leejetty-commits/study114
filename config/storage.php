<?php

declare(strict_types=1);

return [
    /** @var string 로컬 첨부 루트 (board submission 1차) */
    'attachments_root' => dirname(__DIR__) . '/storage/attachments',
    /** HMAC 서명 비밀 (운영 환경에서는 env로 교체) */
    'download_token_secret' => getenv('STUDY114_STORAGE_SECRET') ?: 'study114-dev-attachment-secret',
    /** 다운로드 토큰 TTL(초) — 직접 URL 노출 방지 */
    'download_token_ttl' => 300,
    'submission' => [
        'max_size_bytes' => 10 * 1024 * 1024,
        'allowed_extensions' => ['pdf', 'jpg', 'jpeg', 'png'],
        'allowed_mimes' => [
            'application/pdf',
            'image/jpeg',
            'image/png',
        ],
    ],
];
