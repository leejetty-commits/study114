<?php

declare(strict_types=1);

namespace Study114\Mail;

/**
 * 순수 PHP SMTP (Composer 없음 · PHP 8.2 stream sockets).
 * AUTH LOGIN(+ PLAIN 폴백) · STARTTLS/SMTPS · peer 검증 · fail ≠ success.
 */
final class SmtpMailTransport implements MailTransport
{
    /** @var null|callable(string $remote, float $timeout): resource|false */
    private $connector;

    /**
     * @param null|callable(string $remote, float $timeout): resource|false $connector
     */
    public function __construct(
        private readonly string $host,
        private readonly int $port,
        private readonly string $username,
        private readonly string $password,
        private readonly string $encryption = 'tls',
        private readonly int $timeoutSeconds = 20,
        ?callable $connector = null,
    ) {
        $this->connector = $connector;
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
                SmtpMessageSanitizer::assertSafeMailbox($to, 'to'),
                SmtpMessageSanitizer::assertSafeMailbox($fromEmail, 'from'),
                SmtpMessageSanitizer::assertSafeHeaderText($subject, 'subject'),
                SmtpMessageSanitizer::assertSafeHeaderText($fromHeader, 'from_header'),
            ] as $err
        ) {
            if ($err !== null) {
                return MailSendResult::failure('header_injection', $err);
            }
        }

        $remote = $this->remoteAddress();
        $timeout = (float) max(1, $this->timeoutSeconds);
        $socket = $this->openSocket($remote, $timeout);
        if ($socket === false) {
            return MailSendResult::failure('connect_failed', 'Could not connect to SMTP host');
        }

        stream_set_timeout($socket, $this->timeoutSeconds);

        try {
            $greeting = $this->readResponse($socket);
            if ($greeting['code'] !== 220) {
                return $this->classifyReject($greeting['code'], 'SMTP greeting failed');
            }

            $ehlo = $this->readAfterWrite($socket, 'EHLO study114.net');
            if ($ehlo['code'] !== 250) {
                return $this->classifyReject($ehlo['code'], 'SMTP EHLO failed');
            }
            $authMechs = $this->parseAuthMechanisms($ehlo['raw']);

            if ($this->encryption === 'tls') {
                $start = $this->readAfterWrite($socket, 'STARTTLS');
                if ($start['code'] !== 220) {
                    return $this->classifyReject($start['code'], 'SMTP STARTTLS rejected');
                }
                $crypto = @stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
                if ($crypto !== true) {
                    return MailSendResult::failure('tls_failed', 'SMTP STARTTLS negotiation failed');
                }
                $ehlo = $this->readAfterWrite($socket, 'EHLO study114.net');
                if ($ehlo['code'] !== 250) {
                    return $this->classifyReject($ehlo['code'], 'SMTP EHLO after STARTTLS failed');
                }
                $authMechs = $this->parseAuthMechanisms($ehlo['raw']);
            }

            $authResult = $this->authenticate($socket, $authMechs);
            if (!$authResult->ok) {
                return $authResult;
            }

            $mailFrom = $this->readAfterWrite($socket, 'MAIL FROM:<' . $fromEmail . '>');
            if ($mailFrom['code'] !== 250) {
                return $this->classifyReject($mailFrom['code'], 'SMTP MAIL FROM rejected');
            }

            $rcpt = $this->readAfterWrite($socket, 'RCPT TO:<' . $to . '>');
            if ($rcpt['code'] !== 250 && $rcpt['code'] !== 251) {
                return $this->classifyReject($rcpt['code'], 'SMTP recipient was rejected');
            }

            $dataCmd = $this->readAfterWrite($socket, 'DATA');
            if ($dataCmd['code'] !== 354) {
                return $this->classifyReject($dataCmd['code'], 'SMTP DATA command rejected');
            }

            $payload = $this->buildMime($fromHeader, $to, $subject, $body, is_string($htmlBody) ? $htmlBody : null);
            // 헤더/본문 빈 줄은 buildMime 내부. 종료는 CRLF . CRLF
            $dataResult = $this->readAfterWrite($socket, $payload . "\r\n.");
            if ($dataResult['code'] !== 250) {
                return $this->classifyReject($dataResult['code'], 'SMTP server rejected message data');
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

    /** @param resource $socket @param list<string> $mechs */
    private function authenticate($socket, array $mechs): MailSendResult
    {
        $upper = array_map('strtoupper', $mechs);
        if ($upper === [] || in_array('LOGIN', $upper, true)) {
            $this->expect($socket, 'AUTH LOGIN', [334]);
            $this->expect($socket, base64_encode($this->username), [334]);
            $authPass = $this->readAfterWrite($socket, base64_encode($this->password));
            if ($authPass['code'] !== 235) {
                return $this->classifyReject($authPass['code'], 'SMTP authentication failed', 'auth_failed');
            }

            return MailSendResult::success();
        }

        if (in_array('PLAIN', $upper, true)) {
            $token = base64_encode("\0{$this->username}\0{$this->password}");
            $authPass = $this->readAfterWrite($socket, 'AUTH PLAIN ' . $token);
            if ($authPass['code'] !== 235) {
                return $this->classifyReject($authPass['code'], 'SMTP authentication failed', 'auth_failed');
            }

            return MailSendResult::success();
        }

        return MailSendResult::failure('auth_unsupported', 'SMTP server has no supported AUTH mechanism');
    }

    private function classifyReject(int $code, string $summary, ?string $forceCode = null): MailSendResult
    {
        if ($forceCode !== null) {
            return MailSendResult::failure($forceCode, $summary);
        }
        if ($code >= 400 && $code < 500) {
            return MailSendResult::failure('smtp_temp_fail', $summary);
        }
        if ($code >= 500) {
            return MailSendResult::failure('smtp_perm_fail', $summary);
        }

        return MailSendResult::failure('smtp_rejected', $summary);
    }

    /** @return list<string> */
    private function parseAuthMechanisms(string $ehloRaw): array
    {
        $mechs = [];
        foreach (preg_split("/\r\n|\n|\r/", $ehloRaw) ?: [] as $line) {
            if (preg_match('/^250[\s-]AUTH\s+(.+)$/i', trim($line), $m) !== 1) {
                continue;
            }
            foreach (preg_split('/\s+/', trim($m[1])) ?: [] as $token) {
                if ($token !== '') {
                    $mechs[] = strtoupper($token);
                }
            }
        }

        return array_values(array_unique($mechs));
    }

    private function remoteAddress(): string
    {
        if ($this->encryption === 'ssl') {
            return 'ssl://' . $this->host . ':' . $this->port;
        }

        return 'tcp://' . $this->host . ':' . $this->port;
    }

    /** @return resource|false */
    private function openSocket(string $remote, float $timeout)
    {
        if ($this->connector !== null) {
            return ($this->connector)($remote, $timeout);
        }

        $context = stream_context_create([
            'ssl' => [
                'verify_peer' => true,
                'verify_peer_name' => true,
                'peer_name' => $this->host,
                'SNI_enabled' => true,
                'crypto_method' => STREAM_CRYPTO_METHOD_TLS_CLIENT,
            ],
        ]);

        $errno = 0;
        $errstr = '';

        return @stream_socket_client(
            $remote,
            $errno,
            $errstr,
            $timeout,
            STREAM_CLIENT_CONNECT,
            $context
        );
    }

    private function buildMime(
        string $fromHeader,
        string $to,
        string $subject,
        string $plain,
        ?string $html
    ): string {
        $encodedSubject = SmtpMessageSanitizer::encodeHeader($subject);
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

    /** @param resource $socket @param list<int> $okCodes */
    private function expect($socket, string $command, array $okCodes): void
    {
        $result = $this->readAfterWrite($socket, $command);
        if (!in_array($result['code'], $okCodes, true)) {
            $code = $result['code'] >= 400 && $result['code'] < 500 ? 'smtp_temp_fail' : 'smtp_perm_fail';
            if ($result['code'] < 400) {
                $code = 'smtp_rejected';
            }
            throw new SmtpProtocolException($code, 'SMTP command was rejected');
        }
    }

    /** @param resource $socket @return array{code: int, raw: string} */
    private function readAfterWrite($socket, string $command): array
    {
        $this->writeLine($socket, $command);

        return $this->readResponse($socket);
    }

    /** @param resource $socket */
    private function writeLine($socket, string $line): void
    {
        $written = @fwrite($socket, $line . "\r\n");
        if ($written === false) {
            throw new SmtpProtocolException('timeout', 'SMTP connection timed out while writing');
        }
    }

    /** @param resource $socket @return array{code: int, raw: string} */
    private function readResponse($socket): array
    {
        $raw = '';
        while (($line = @fgets($socket, 515)) !== false) {
            $raw .= $line;
            $meta = stream_get_meta_data($socket);
            if (!empty($meta['timed_out'])) {
                throw new SmtpProtocolException('timeout', 'SMTP connection timed out');
            }
            // multiline: 250-... then final 250 <space>
            if (preg_match('/^\d{3}([\s-])/', $line, $m) !== 1) {
                continue;
            }
            if ($m[1] === ' ') {
                break;
            }
        }
        if ($raw === '') {
            $meta = stream_get_meta_data($socket);
            if (!empty($meta['timed_out'])) {
                throw new SmtpProtocolException('timeout', 'SMTP connection timed out');
            }
            throw new SmtpProtocolException('smtp_error', 'Empty SMTP response');
        }

        return ['code' => (int) substr($raw, 0, 3), 'raw' => $raw];
    }
}
