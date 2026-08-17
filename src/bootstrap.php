<?php

declare(strict_types=1);

spl_autoload_register(static function (string $class): void {
    $prefix = 'Study114\\';
    if (!str_starts_with($class, $prefix)) {
        return;
    }
    $relative = str_replace('\\', DIRECTORY_SEPARATOR, substr($class, strlen($prefix)));
    $file = dirname(__DIR__) . '/src/' . $relative . '.php';
    if (is_file($file)) {
        require $file;
    }
});

function study114_config(string $name): array
{
    $path = dirname(__DIR__) . '/config/' . $name . '.php';
    if (!is_file($path)) {
        throw new RuntimeException("Config not found: {$name}");
    }
    /** @var array $config */
    $config = require $path;
    return $config;
}

/** SetEnv / putenv / $_SERVER 순으로 환경값을 읽는다. */
function study114_env(string $key, string $default = ''): string
{
    $value = getenv($key);
    if (is_string($value) && $value !== '') {
        return $value;
    }
    if (isset($_ENV[$key]) && is_string($_ENV[$key]) && $_ENV[$key] !== '') {
        return $_ENV[$key];
    }
    if (isset($_SERVER[$key]) && is_string($_SERVER[$key]) && $_SERVER[$key] !== '') {
        return $_SERVER[$key];
    }

    return $default;
}

/**
 * 프록시가 붙인 scheme 헤더를 믿을지.
 * Cloudflare 흔적(CF-Ray / CF-Connecting-IP)이 있거나 STUDY114_TRUST_PROXY=1 일 때만 신뢰.
 * 닷홈 원서버 직접 접근에서 X-Forwarded-Proto 스푸핑을 막는다.
 */
function study114_trust_forwarded_proto(): bool
{
    if ((string) ($_SERVER['HTTP_CF_RAY'] ?? '') !== '') {
        return true;
    }
    if ((string) ($_SERVER['HTTP_CF_CONNECTING_IP'] ?? '') !== '') {
        return true;
    }

    return study114_env('STUDY114_TRUST_PROXY', '0') === '1';
}

function study114_request_is_https(): bool
{
    if ((!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (string) ($_SERVER['SERVER_PORT'] ?? '') === '443') {
        return true;
    }
    if (!study114_trust_forwarded_proto()) {
        return false;
    }
    if (strtolower((string) ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '')) === 'https') {
        return true;
    }
    $cfVisitor = (string) ($_SERVER['HTTP_CF_VISITOR'] ?? '');

    return str_contains($cfVisitor, '"scheme":"https"');
}

/** 현재 요청의 공개 origin (http/https + host). CLI·비웹이면 null. */
function study114_request_origin(): ?string
{
    $host = (string) ($_SERVER['HTTP_HOST'] ?? '');
    if ($host === '') {
        return null;
    }
    $host = preg_replace('/:(80|443)$/', '', $host) ?? $host;

    return (study114_request_is_https() ? 'https' : 'http') . '://' . $host;
}

/** 운영 정본 origin. STUDY114_API_BASE가 있으면 그것을 따른다. */
function study114_canonical_origin(): string
{
    return rtrim(study114_env('STUDY114_API_BASE', 'https://study114.net'), '/');
}

/**
 * 브라우저가 실제로 열 수 있는 운영 호스트.
 * 정본은 https://study114.net. www·닷홈 HTTPS는 임시 호환. http는 구 콘솔 호환만.
 *
 * @return list<string>
 */
function study114_allowed_public_origins(): array
{
    return [
        'https://study114.net',
        'https://www.study114.net',
        'https://study114.dothome.co.kr',
        'http://study114.net',
        'http://www.study114.net',
        'http://study114.dothome.co.kr',
    ];
}

function study114_is_allowed_public_origin(string $origin): bool
{
    return in_array($origin, study114_allowed_public_origins(), true);
}

function study114_is_local_origin(string $origin): bool
{
    $host = strtolower((string) parse_url($origin, PHP_URL_HOST));

    return $host === '127.0.0.1' || $host === 'localhost';
}

/**
 * 공개 origin: 허용된 요청 origin(또는 로컬)을 유지하고, 그 외는 정본.
 * OAuth redirect_uri·세션 쿠키 호스트는 시작 요청과 같아야 한다.
 */
function study114_public_origin(): string
{
    $origin = study114_request_origin();
    if ($origin !== null && study114_is_allowed_public_origin($origin)) {
        return $origin;
    }
    if ($origin !== null && study114_is_local_origin($origin)) {
        return $origin;
    }

    return study114_canonical_origin();
}

function study114_is_cors_allowed_origin(string $origin): bool
{
    if ($origin === '') {
        return false;
    }
    if (study114_is_allowed_public_origin($origin)) {
        return true;
    }

    return study114_is_local_origin($origin);
}

/**
 * credentials와 함께 * 를 쓰지 않는다.
 * Origin이 허용 목록일 때만 그 값을 반사한다. same-origin(Origin 없음)은 헤더 생략.
 */
function study114_send_cors_headers(bool $credentials = true): void
{
    $origin = (string) ($_SERVER['HTTP_ORIGIN'] ?? '');
    if ($origin === '' || !study114_is_cors_allowed_origin($origin)) {
        return;
    }
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
    if ($credentials) {
        header('Access-Control-Allow-Credentials: true');
    }
}
