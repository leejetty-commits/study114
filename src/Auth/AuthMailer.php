<?php

declare(strict_types=1);

namespace Study114\Auth;

final class AuthMailer
{
    /** @var array<string, mixed> */
    private array $config;

    public function __construct()
    {
        $this->config = study114_config('auth');
    }

    public function send(string $to, string $subject, string $body, ?string $htmlBody = null): void
    {
        $from = (string) $this->config['mail_from'];
        $this->writeLog($to, $subject, $body, $htmlBody);

        if (!function_exists('mail')) {
            return;
        }

        if ($htmlBody !== null && $htmlBody !== '') {
            $this->sendMultipart($to, $subject, $body, $htmlBody, $from);
            return;
        }

        @mail(
            $to,
            $subject,
            $body,
            'From: ' . $from . "\r\nContent-Type: text/plain; charset=UTF-8"
        );
    }

    private function sendMultipart(string $to, string $subject, string $plain, string $html, string $from): void
    {
        $boundary = 'b_' . bin2hex(random_bytes(12));
        $headers = [
            'From: ' . $from,
            'MIME-Version: 1.0',
            'Content-Type: multipart/alternative; boundary="' . $boundary . '"',
        ];

        $message = "--{$boundary}\r\n"
            . "Content-Type: text/plain; charset=UTF-8\r\n"
            . "Content-Transfer-Encoding: 8bit\r\n\r\n"
            . $plain . "\r\n\r\n"
            . "--{$boundary}\r\n"
            . "Content-Type: text/html; charset=UTF-8\r\n"
            . "Content-Transfer-Encoding: 8bit\r\n\r\n"
            . $html . "\r\n\r\n"
            . "--{$boundary}--";

        @mail($to, $subject, $message, implode("\r\n", $headers));
    }

    private function writeLog(string $to, string $subject, string $body, ?string $htmlBody): void
    {
        $path = (string) $this->config['mail_log_path'];
        $dir = dirname($path);
        if (!is_dir($dir)) {
            mkdir($dir, 0775, true);
        }

        $format = $htmlBody !== null && $htmlBody !== '' ? 'multipart/alternative' : 'text/plain';
        $line = sprintf(
            "[%s] TO=%s SUBJECT=%s FORMAT=%s\n--- plain ---\n%s\n",
            date('Y-m-d H:i:s'),
            $to,
            $subject,
            $format,
            $body
        );

        if ($htmlBody !== null && $htmlBody !== '') {
            $line .= "--- html ---\n{$htmlBody}\n";
        }

        $line .= "---\n";
        file_put_contents($path, $line, FILE_APPEND | LOCK_EX);
        error_log('[mail] ' . trim(str_replace("\n", ' ', substr($line, 0, 240))));
    }
}
