<?php

declare(strict_types=1);

namespace Study114\Auth;

use Study114\Mail\MailAddressMasker;
use Study114\Mail\MailSendResult;
use Study114\Mail\MailTransport;
use Study114\Mail\MailTransportFactory;

/**
 * 인증·계정 메일 발송 — SMTP transport 전용 (PHP native mail API 미사용).
 */
final class AuthMailer
{
    /** @var array<string, mixed> */
    private array $config;
    private MailTransport $transport;
    private ?MailSendResult $lastResult = null;

    public function __construct(?MailTransport $transport = null)
    {
        $this->config = study114_config('auth');
        $this->transport = $transport ?? MailTransportFactory::create($this->config);
    }

    public function send(string $to, string $subject, string $body, ?string $htmlBody = null): bool
    {
        $fromEmail = $this->fromEmail();
        $this->writeLog($to, $subject, $body, $htmlBody, $fromEmail);

        if (!$this->isAllowedFrom($fromEmail)) {
            $this->lastResult = MailSendResult::failure(
                'from_rejected',
                'From address must be an authenticated @study114.net mailbox'
            );
            $this->appendResultLog($to, $this->lastResult);

            return false;
        }

        $result = $this->transport->send([
            'to' => $to,
            'subject' => $subject,
            'body' => $body,
            'html_body' => $htmlBody,
            'from_email' => $fromEmail,
            'from_header' => $this->fromHeader($fromEmail),
        ]);
        $this->lastResult = $result;
        $this->appendResultLog($to, $result);

        return $result->ok;
    }

    public function lastResult(): ?MailSendResult
    {
        return $this->lastResult;
    }

    private function fromEmail(): string
    {
        $from = trim((string) ($this->config['mail_from'] ?? ''));
        if ($from === '' || !filter_var($from, FILTER_VALIDATE_EMAIL)) {
            return '';
        }

        return $from;
    }

    private function isAllowedFrom(string $fromEmail): bool
    {
        if ($fromEmail === '' || !filter_var($fromEmail, FILTER_VALIDATE_EMAIL)) {
            return false;
        }
        $lower = strtolower($fromEmail);
        // 운영·스테이징: 인증된 study114.net 만. 로컬 더미 도메인은 fake/disabled 테스트용.
        if (str_ends_with($lower, '@study114.net')) {
            return true;
        }
        $transport = strtolower((string) ($this->config['mail_transport'] ?? 'smtp'));
        if (in_array($transport, ['fake', 'disabled', 'off', 'none'], true)
            && str_ends_with($lower, '@study114.local')) {
            return true;
        }

        return false;
    }

    private function fromHeader(string $fromEmail): string
    {
        $name = \Study114\Mail\SmtpMessageSanitizer::encodeHeader('우동공과');

        return $name . ' <' . $fromEmail . '>';
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
            MailAddressMasker::mask($to),
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
        error_log('[mail] queued TO=' . MailAddressMasker::mask($to) . ' FROM=' . $fromEmail . ' SUBJECT=' . $subject);
    }

    private function appendResultLog(string $to, MailSendResult $result): void
    {
        $path = (string) $this->config['mail_log_path'];
        $dir = dirname($path);
        if (!is_dir($dir)) {
            mkdir($dir, 0775, true);
        }
        $line = sprintf(
            "[%s] MAIL_RESULT=%s CODE=%s TO=%s SUMMARY=%s\n",
            date('Y-m-d H:i:s'),
            $result->ok ? 'true' : 'false',
            $result->code,
            MailAddressMasker::mask($to),
            $result->safeSummary
        );
        file_put_contents($path, $line, FILE_APPEND | LOCK_EX);
        if (!$result->ok) {
            error_log('[mail] MAIL_RESULT=false CODE=' . $result->code . ' TO=' . MailAddressMasker::mask($to));
        }
    }
}
