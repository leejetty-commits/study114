<?php

declare(strict_types=1);

namespace Study114\Mail;

/**
 * 순수 PHP SMTP (Composer 없음 · PHP 8.2 stream sockets).
 * AUTH LOGIN + STARTTLS(587) / SMTPS(465) 지원.
 */
final class SmtpMailTransport implements MailTransport
{
    public function __construct(
        private readonly string $host,
        private readonly int $port,
        private readonly string $username,
        private readonly string $password,
        private readonly string $encryption = 'tls',
        private readonly int $timeoutSeconds = 20,
    ) {
    }

    public function send(array $message): MailSendResult
    {
        $to = (string) ($message['to'] ?? '');
        $fromEmail = (string) ($message['from_email'] ?? '');
        $fromHeader = (string) ($message['from_header'] ?? $fromEmail);
        $subject = (string) ($message['subject'] ?? '');
        $body = (string) ($message['body'] ?? '');
        $htmlBody = $message['html_body'] ?? null;

        if ($to === '' || $fromEmail === '' || $subject === '') {
            return MailSendResult::failure('invalid_message', 'Message fields are incomplete');
        }

        $remote = $this->remoteAddress();
        $errno = 0;
        $errstr = '';
        $socket = @stream_socket_client(
            $remote,
            $errno,
            $errstr,
            $this->timeoutSeconds,
            STREAM_CLIENT_CONNECT
        );
        if ($socket === false) {
            return MailSendResult::failure(
                'connect_failed',
                'Could not connect to SMTP host'
            );
        }

        stream_set_timeout($socket, $this->timeoutSeconds);

        try {
            $greeting = $this->readResponse($socket);
            if ($greeting['code'] !== 220) {
                return MailSendResult::failure('smtp_rejected', 'SMTP greeting failed');
            }

            $this->expect($socket, 'EHLO study114.net', [250]);

            if ($this->encryption === 'tls') {
                $this->expect($socket, 'STARTTLS', [220]);
                $crypto = @stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
                if ($crypto !== true) {
                    return MailSendResult::failure('tls_failed', 'SMTP STARTTLS negotiation failed');
                }
                $this->expect($socket, 'EHLO study114.net', [250]);
            }

            $this->expect($socket, 'AUTH LOGIN', [334]);
            $this->expect($socket, base64_encode($this->username), [334]);
            $authPass = $this->readAfterWrite($socket, base64_encode($this->password));
            if ($authPass['code'] !== 235) {
                return MailSendResult::failure('auth_failed', 'SMTP authentication failed');
            }

            $this->expect($socket, 'MAIL FROM:<' . $fromEmail . '>', [250]);
            $rcpt = $this->readAfterWrite($socket, 'RCPT TO:<' . $to . '>');
            if ($rcpt['code'] !== 250 && $rcpt['code'] !== 251) {
                return MailSendResult::failure('rcpt_rejected', 'SMTP recipient was rejected');
            }

            $this->expect($socket, 'DATA', [354]);
            $payload = $this->buildMime($fromHeader, $to, $subject, $body, is_string($htmlBody) ? $htmlBody : null);
            $dataResult = $this->readAfterWrite($socket, $payload . "\r\n.");
            if ($dataResult['code'] !== 250) {
                return MailSendResult::failure('smtp_rejected', 'SMTP server rejected message data');
            }

            @$this->writeLine($socket, 'QUIT');
            return MailSendResult::success('SMTP server accepted the message');
        } catch (SmtpProtocolException $e) {
            return MailSendResult::failure($e->codeKey, $e->getMessage());
        } catch (\Throwable) {
            return MailSendResult::failure('smtp_error', 'SMTP send failed');
        } finally {
            if (is_resource($socket)) {
                fclose($socket);
            }
        }
    }

    private function remoteAddress(): string
    {
        if ($this->encryption === 'ssl') {
            return 'ssl://' . $this->host . ':' . $this->port;
        }

        return 'tcp://' . $this->host . ':' . $this->port;
    }

    private function buildMime(
        string $fromHeader,
        string $to,
        string $subject,
        string $plain,
        ?string $html
    ): string {
        $encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
        $headers = [
            'From: ' . $fromHeader,
            'To: ' . $to,
            'Reply-To: ' . $this->extractEmail($fromHeader),
            'Subject: ' . $encodedSubject,
            'MIME-Version: 1.0',
            'Date: ' . date('r'),
            'Message-ID: <' . bin2hex(random_bytes(12)) . '@study114.net>',
        ];

        if ($html !== null && $html !== '') {
            $boundary = 'b_' . bin2hex(random_bytes(8));
            $headers[] = 'Content-Type: multipart/alternative; boundary="' . $boundary . '"';
            $body = '--' . $boundary . "\r\n"
                . "Content-Type: text/plain; charset=UTF-8\r\n"
                . "Content-Transfer-Encoding: 8bit\r\n\r\n"
                . $this->dotStuff($plain) . "\r\n\r\n"
                . '--' . $boundary . "\r\n"
                . "Content-Type: text/html; charset=UTF-8\r\n"
                . "Content-Transfer-Encoding: 8bit\r\n\r\n"
                . $this->dotStuff($html) . "\r\n\r\n"
                . '--' . $boundary . '--';
        } else {
            $headers[] = 'Content-Type: text/plain; charset=UTF-8';
            $headers[] = 'Content-Transfer-Encoding: 8bit';
            $body = $this->dotStuff($plain);
        }

        return implode("\r\n", $headers) . "\r\n\r\n" . $body;
    }

    private function extractEmail(string $fromHeader): string
    {
        if (preg_match('/<([^>]+)>/', $fromHeader, $m) === 1) {
            return $m[1];
        }

        return $fromHeader;
    }

    private function dotStuff(string $body): string
    {
        $normalized = str_replace(["\r\n", "\r"], "\n", $body);
        $lines = explode("\n", $normalized);
        foreach ($lines as &$line) {
            if (str_starts_with($line, '.')) {
                $line = '.' . $line;
            }
        }
        unset($line);

        return implode("\r\n", $lines);
    }

    /** @param list<int> $okCodes */
    private function expect($socket, string $command, array $okCodes): void
    {
        $result = $this->readAfterWrite($socket, $command);
        if (!in_array($result['code'], $okCodes, true)) {
            throw new SmtpProtocolException(
                'smtp_rejected',
                'SMTP command was rejected'
            );
        }
    }

    /** @return array{code: int, raw: string} */
    private function readAfterWrite($socket, string $command): array
    {
        $this->writeLine($socket, $command);

        return $this->readResponse($socket);
    }

    private function writeLine($socket, string $line): void
    {
        $written = @fwrite($socket, $line . "\r\n");
        if ($written === false) {
            throw new SmtpProtocolException('timeout', 'SMTP connection timed out while writing');
        }
    }

    /** @return array{code: int, raw: string} */
    private function readResponse($socket): array
    {
        $raw = '';
        while (($line = @fgets($socket, 515)) !== false) {
            $raw .= $line;
            if (preg_match('/^\d{3}[\s-]/', $line) !== 1) {
                continue;
            }
            if (isset($line[3]) && $line[3] === ' ') {
                break;
            }
            $meta = stream_get_meta_data($socket);
            if (!empty($meta['timed_out'])) {
                throw new SmtpProtocolException('timeout', 'SMTP connection timed out');
            }
        }
        if ($raw === '') {
            $meta = stream_get_meta_data($socket);
            if (!empty($meta['timed_out'])) {
                throw new SmtpProtocolException('timeout', 'SMTP connection timed out');
            }
            throw new SmtpProtocolException('smtp_error', 'Empty SMTP response');
        }
        $code = (int) substr($raw, 0, 3);

        return ['code' => $code, 'raw' => $raw];
    }
}
