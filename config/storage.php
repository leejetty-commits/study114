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
    /**
     * 쪽지 첨부 (선택). 확장자 = 상세정보1 홍보사진 ∪ 제출·증빙 서류.
     * 5MB: 사업자·교육청 등록증 스캔/사진에 충분하고, 닷홈 업로드·디스크에 무리가 적다.
     * (홍보사진 4MB · 제출함 10MB 사이의 상담 채널 한도)
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
