<?php

declare(strict_types=1);

return [
    /** @var string 로컬 첨부 루트 (board submission 1차) */
    'attachments_root' => dirname(__DIR__) . '/storage/attachments',
    // 운영은 SetEnv + 토큰 발급/검증 fail-closed. 공개 기본값으로 열지 않음.
    'download_token_secret' => study114_env('STUDY114_STORAGE_SECRET', ''),
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
    /**
     * 고민방 글 사진. 장당 10MB까지 받고, 저장은 긴 쪽 1600px WebP만 남긴다.
     * 쪽지(message) 규칙과는 따로다.
     */
    'concern' => [
        'max_files' => 3,
        'max_size_bytes' => 10 * 1024 * 1024,
        'max_long_edge' => 1600,
        'target_bytes' => 1024 * 1024,
        'webp_quality' => 82,
        'allowed_extensions' => ['jpg', 'jpeg', 'png', 'webp'],
        'allowed_mimes' => [
            'image/jpeg',
            'image/png',
            'image/webp',
        ],
    ],
    /**
     * 쪽지 첨부. 5MB · PDF/JPG/PNG/WebP.
     * 저장 확장자·MIME은 서버가 내용으로 정한다(클라이언트 이름/type 불신).
     */
    'message' => [
        'max_size_bytes' => 5 * 1024 * 1024,
        'max_files' => 3,
        'allowed_extensions' => ['pdf', 'jpg', 'jpeg', 'png', 'webp'],
        'allowed_mimes' => [
            'application/pdf',
            'application/x-pdf',
            'image/jpeg',
            'image/pjpeg',
            'image/jpg',
            'image/png',
            'image/webp',
        ],
    ],
];

