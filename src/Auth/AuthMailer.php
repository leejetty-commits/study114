<?php

declare(strict_types=1);

namespace Study114\Auth;

/**
 * 닷홈 등 공유호스팅: PHP mail() + 올바른 From/봉투발신자(-f).
 * SMTP Relay는 닷홈에서 미지원 — From는 SetEnv STUDY114_MAIL_FROM (호스팅 메일함과 일치).
 */
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
        $fromEmail = $this->fromEmail();
        $fromHeader = $this->fromHeader($fromEmail);

        $this->writeLog($to, $subject, $body, $htmlBody, $fromEmail);

        if (!function_exists('mail')) {
            error_log('[mail] mail() unavailable');
            return;
        }

        $encodedSubject = $this->encodeHeader($subject);

        if ($htmlBody !== null && $htmlBody !== '') {
            $ok = $this->sendMultipart($to, $encodedSubject, $body, $htmlBody, $fromEmail, $fromHeader);
        } else {
            $headers = implode("\r\n", [
                'From: ' . $fromHeader,
                'Reply-To: ' . $fromEmail,
                'Return-Path: ' . $fromEmail,
                'MIME-Version: 1.0',
                'Content-Type: text/plain; charset=UTF-8',
                'Content-Transfer-Encoding: 8bit',
                'X-Mailer: study114-AuthMailer',
            ]);
            $ok = $this->dispatch($to, $encodedSubject, $body, $headers, $fromEmail);
        }

        if (!$ok) {
            error_log('[mail] mail() returned false TO=' . $to . ' FROM=' . $fromEmail);
            $this->appendLogLine('MAIL_RESULT=false TO=' . $to . ' FROM=' . $fromEmail);
        } else {
            $this->appendLogLine('MAIL_RESULT=true TO=' . $to . ' FROM=' . $fromEmail);
        }
    }

    private function fromEmail(): string
    {
        $from = trim((string) ($this->config['mail_from'] ?? ''));
        if ($from === '' || !filter_var($from, FILTER_VALIDATE_EMAIL)) {
            return 'noreply@study114.local';
        }

        return $from;
    }

    private function fromHeader(string $fromEmail): string
    {
        $name = $this->encodeHeader('우동공과');

        return $name . ' <' . $fromEmail . '>';
    }

    private function encodeHeader(string $value): string
    {
        return '=?UTF-8?B?' . base64_encode($value) . '?=';
    }

    private function sendMultipart(
        string $to,
        string $encodedSubject,
        string $plain,
        string $html,
        string $fromEmail,
        string $fromHeader
    ): bool {
        $boundary = 'b_' . bin2hex(random_bytes(12));
        $headers = implode("\r\n", [
            'From: ' . $fromHeader,
            'Reply-To: ' . $fromEmail,
            'Return-Path: ' . $fromEmail,
            'MIME-Version: 1.0',
            'Content-Type: multipart/alternative; boundary="' . $boundary . '"',
            'X-Mailer: study114-AuthMailer',
        ]);

        $message = "--{$boundary}\r\n"
            . "Content-Type: text/plain; charset=UTF-8\r\n"
            . "Content-Transfer-Encoding: 8bit\r\n\r\n"
            . $plain . "\r\n\r\n"
            . "--{$boundary}\r\n"
            . "Content-Type: text/html; charset=UTF-8\r\n"
            . "Content-Transfer-Encoding: 8bit\r\n\r\n"
            . $html . "\r\n\r\n"
            . "--{$boundary}--";

        return $this->dispatch($to, $encodedSubject, $message, $headers, $fromEmail);
    }

    private function dispatch(
        string $to,
        string $encodedSubject,
        string $message,
        string $headers,
        string $fromEmail
    ): bool {
        // 닷홈/sendmail: 봉투 발신자(-f)가 From와 일치해야 Gmail 등에서 덜 막힘
        $params = '-f' . $fromEmail;
        $result = @mail($to, $encodedSubject, $message, $headers, $params);

        return $result === true;
    }

    private function writeLog(
        string $to,
        string $subject,
        string $body,
        ?string $htmlBody,
        string $fromEmail
    ): void {
        $path = (string) $this->config['mail_log_path'];
        $dir = dirname($path);
        if (!is_dir($dir)) {
            mkdir($dir, 0775, true);
        }

        $format = $htmlBody !== null && $htmlBody !== '' ? 'multipart/alternative' : 'text/plain';
        $line = sprintf(
            "[%s] TO=%s FROM=%s SUBJECT=%s FORMAT=%s\n--- plain ---\n%s\n",
            date('Y-m-d H:i:s'),
            $to,
            $fromEmail,
            $subject,
            $format,
            $body
        );

        if ($htmlBody !== null && $htmlBody !== '') {
            $line .= "--- html ---\n{$htmlBody}\n";
        }

        $line .= "---\n";
        file_put_contents($path, $line, FILE_APPEND | LOCK_EX);
        error_log('[mail] queued TO=' . $to . ' FROM=' . $fromEmail . ' SUBJECT=' . $subject);
    }

    private function appendLogLine(string $line): void
    {
        $path = (string) $this->config['mail_log_path'];
        $dir = dirname($path);
        if (!is_dir($dir)) {
            mkdir($dir, 0775, true);
        }
        file_put_contents(
            $path,
            '[' . date('Y-m-d H:i:s') . '] ' . $line . "\n",
            FILE_APPEND | LOCK_EX
        );
    }
}
