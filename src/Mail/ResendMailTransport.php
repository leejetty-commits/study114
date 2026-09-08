<?php

declare(strict_types=1);

namespace Study114\Mail;

/**
 * Resend HTTPS API — POST https://api.resend.com/emails (cURL).
 * API Key는 로그·결과 요약에 넣지 않는다. mail() 미사용.
 */
final class ResendMailTransport implements MailTransport
{
    private const ENDPOINT = 'https://api.resend.com/emails';

    /** @var null|callable(string $url, array $curlOpts): array{ok:bool,status:int,body:string,errno:int,error:string} */
    private $http;

    /**
     * @param null|callable(string $url, array $curlOpts): array{ok:bool,status:int,body:string,errno:int,error:string} $http
     */
    public function __construct(
        private readonly string $apiKey,
        private readonly int $timeoutSeconds = 20,
        ?callable $http = null,
    ) {
        $this->http = $http;
    }

    public function send(array $message): MailSendResult
    {
        $to = (string) ($message['to'] ?? '');
        $fromEmail = (string) ($message['from_email'] ?? '');
        $fromHeader = (string) ($message['from_header'] ?? $fromEmail);
        $subject = (string) ($message['subject'] ?? '');
        $body = (string) ($message['body'] ?? '');
        $htmlBody = $message['html_body'] ?? null;

        foreach (
            [
                MailMessageSanitizer::assertSafeMailbox($to, 'to'),
                MailMessageSanitizer::assertSafeMailbox($fromEmail, 'from'),
                MailMessageSanitizer::assertSafeHeaderText($subject, 'subject'),
                MailMessageSanitizer::assertSafeHeaderText($fromHeader, 'from_header'),
            ] as $err
        ) {
            if ($err !== null) {
                return MailSendResult::failure('header_injection', $err);
            }
        }

        if ($this->apiKey === '' || str_starts_with($this->apiKey, '__')) {
            return MailSendResult::failure('api_key_missing', 'Resend API key is not configured');
        }

        $payload = [
            'from' => $fromHeader,
            'to' => [$to],
            'subject' => $subject,
            'text' => $body,
        ];
        if (is_string($htmlBody) && $htmlBody !== '') {
            $payload['html'] = $htmlBody;
        }

        $json = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($json === false) {
            return MailSendResult::failure('resend_error', 'Failed to encode Resend payload');
        }

        $timeout = max(1, $this->timeoutSeconds);
        $opts = [
            CURLOPT_POST => true,
            CURLOPT_HTTPHEADER => [
                'Authorization: Bearer ' . $this->apiKey,
                'Content-Type: application/json',
                'Accept: application/json',
            ],
            CURLOPT_POSTFIELDS => $json,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => $timeout,
            CURLOPT_CONNECTTIMEOUT => min(10, $timeout),
        ];

        $response = $this->request(self::ENDPOINT, $opts);

        // CURLE_OPERATION_TIMEDOUT = 28
        if ($response['errno'] === 28
            || (defined('CURLE_OPERATION_TIMEDOUT') && $response['errno'] === CURLE_OPERATION_TIMEDOUT)
            || str_contains(strtolower($response['error']), 'timed out')) {
            return MailSendResult::failure('timeout', 'Resend API request timed out');
        }

        if (!$response['ok'] && $response['status'] === 0) {
            return MailSendResult::failure('resend_error', 'Resend API connection failed');
        }

        $status = $response['status'];
        if ($status >= 200 && $status < 300) {
            return MailSendResult::success('Resend accepted the message');
        }

        if ($status === 401 || $status === 403) {
            return MailSendResult::failure('auth_failed', 'Resend API authentication failed');
        }

        return MailSendResult::failure(
            'resend_error',
            'Resend API rejected the message (HTTP ' . $status . ')'
        );
    }

    /**
     * @param array<int, mixed> $curlOpts
     * @return array{ok:bool,status:int,body:string,errno:int,error:string}
     */
    private function request(string $url, array $curlOpts): array
    {
        if ($this->http !== null) {
            return ($this->http)($url, $curlOpts);
        }

        if (!function_exists('curl_init')) {
            return [
                'ok' => false,
                'status' => 0,
                'body' => '',
                'errno' => 0,
                'error' => 'curl extension missing',
            ];
        }

        $ch = curl_init($url);
        if ($ch === false) {
            return [
                'ok' => false,
                'status' => 0,
                'body' => '',
                'errno' => 0,
                'error' => 'curl_init failed',
            ];
        }

        curl_setopt_array($ch, $curlOpts);
        $body = curl_exec($ch);
        $errno = curl_errno($ch);
        $error = (string) curl_error($ch);
        $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        return [
            'ok' => $body !== false && $errno === 0,
            'status' => $status,
            'body' => is_string($body) ? $body : '',
            'errno' => $errno,
            'error' => $error,
        ];
    }
}
