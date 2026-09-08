<?php

declare(strict_types=1);

namespace Study114\Auth;

use Study114\Mail\MailAddressMasker;
use Study114\Mail\MailMessageSanitizer;
use Study114\Mail\MailSendResult;
use Study114\Mail\MailTransport;
use Study114\Mail\MailTransportFactory;

/**
 * 인증·계정 메일 발송 — Resend HTTPS API (PHP native mail API 미사용).
 * 운영 로그에는 본문·토큰·URL을 남기지 않는다.
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
        $this->writeMetaLog($to, $subject, $fromEmail);

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
        if (str_ends_with($lower, '@study114.net')) {
            return true;
        }
        $transport = strtolower((string) ($this->config['mail_transport'] ?? 'resend'));
        if (in_array($transport, ['fake', 'disabled', 'off', 'none'], true)
            && str_ends_with($lower, '@study114.local')) {
            return true;
        }

        return false;
    }

    private function fromHeader(string $fromEmail): string
    {
        $name = MailMessageSanitizer::encodeHeader('우동공과');

        return $name . ' <' . $fromEmail . '>';
    }

    /** 본문·토큰·URL 미기록 — 메타만 */
    private function writeMetaLog(string $to, string $subject, string $fromEmail): void
    {
        $path = (string) $this->config['mail_log_path'];
        $dir = dirname($path);
        if (!is_dir($dir)) {
            mkdir($dir, 0775, true);
        }

        $line = sprintf(
            "[%s] TO=%s FROM=%s KIND=%s SUBJECT=%s\n",
            date('Y-m-d H:i:s'),
            MailAddressMasker::mask($to),
            $fromEmail,
            $this->mailKind($subject),
            $this->safeSubject($subject)
        );
        file_put_contents($path, $line, FILE_APPEND | LOCK_EX);
        error_log(
            '[mail] queued TO=' . MailAddressMasker::mask($to)
            . ' FROM=' . $fromEmail
            . ' KIND=' . $this->mailKind($subject)
        );
    }

    private function appendResultLog(string $to, MailSendResult $result): void
    {
        $path = (string) $this->config['mail_log_path'];
        $dir = dirname($path);
        if (!is_dir($dir)) {
            mkdir($dir, 0775, true);
        }
        $ref = $result->providerMessageId !== null && $result->providerMessageId !== ''
            ? (' MSG_ID=' . $result->providerMessageId)
            : '';
        $line = sprintf(
            "[%s] MAIL_RESULT=%s CODE=%s TO=%s SUMMARY=%s%s\n",
            date('Y-m-d H:i:s'),
            $result->ok ? 'true' : 'false',
            $result->code,
            MailAddressMasker::mask($to),
            $result->safeSummary,
            $ref
        );
        file_put_contents($path, $line, FILE_APPEND | LOCK_EX);
        if (!$result->ok) {
            error_log('[mail] MAIL_RESULT=false CODE=' . $result->code . ' TO=' . MailAddressMasker::mask($to));
        }
    }

    private function mailKind(string $subject): string
    {
        if (str_contains($subject, '이메일 확인') || str_contains($subject, '확인 메일')) {
            return 'email_verify';
        }
        if (str_contains($subject, '비밀번호') || str_contains($subject, '재설정')) {
            return 'password_reset';
        }
        if (str_contains($subject, '테스트') || str_contains($subject, 'probe')) {
            return 'probe';
        }

        return 'other';
    }

    /** 제목에 토큰/쿼리가 섞이지 않도록 길이만 제한 */
    private function safeSubject(string $subject): string
    {
        $subject = preg_replace('/[^\P{C}\t]/u', '', $subject) ?? '';
        $subject = trim($subject);
        if (strlen($subject) > 120) {
            $subject = substr($subject, 0, 117) . '...';
        }

        return $subject;
    }
}
