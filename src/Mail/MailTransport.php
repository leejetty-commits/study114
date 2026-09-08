<?php

declare(strict_types=1);

namespace Study114\Mail;

interface MailTransport
{
    /**
     * @param array{to: string, subject: string, body: string, html_body?: ?string, from_email: string, from_header: string} $message
     */
    public function send(array $message): MailSendResult;
}
