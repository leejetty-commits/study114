<?php

declare(strict_types=1);

// 임시 진단용 — Google 토큰 교환 아웃바운드 확인 후 삭제한다.
require_once dirname(__DIR__, 4) . '/src/bootstrap.php';

header('Content-Type: application/json; charset=utf-8');

function diag_curl(string $method, string $url, array $fields = [], array $headers = []): array
{
    $ch = curl_init($url);
    $opts = [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 15,
        CURLOPT_HTTPHEADER     => $headers,
    ];
    if ($method === 'POST') {
        $opts[CURLOPT_POST] = true;
        $opts[CURLOPT_POSTFIELDS] = http_build_query($fields);
    }
    curl_setopt_array($ch, $opts);
    $raw = curl_exec($ch);
    $result = [
        'http_code'  => curl_getinfo($ch, CURLINFO_HTTP_CODE),
        'curl_errno' => curl_errno($ch),
        'curl_error' => curl_error($ch),
        'body'       => is_string($raw) ? substr($raw, 0, 400) : null,
    ];
    curl_close($ch);
    return $result;
}

$config = study114_config('oauth');
$g = $config['providers']['google'] ?? [];

echo json_encode([
    'env' => [
        'client_id_set'     => ($g['client_id'] ?? '') !== '',
        'client_secret_set' => ($g['client_secret'] ?? '') !== '',
        'redirect_uri'      => $g['redirect_uri'] ?? '',
        'api_base'          => $config['api_base'] ?? '',
    ],
    'reach_userinfo' => diag_curl('GET', 'https://www.googleapis.com/oauth2/v2/userinfo', [], ['Authorization: Bearer invalid-token-test']),
    'reach_token'    => diag_curl('POST', 'https://oauth2.googleapis.com/token', [
        'grant_type'    => 'authorization_code',
        'client_id'     => $g['client_id'] ?? '',
        'client_secret' => $g['client_secret'] ?? '',
        'code'          => 'diag-invalid-code',
        'redirect_uri'  => $g['redirect_uri'] ?? '',
    ]),
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
