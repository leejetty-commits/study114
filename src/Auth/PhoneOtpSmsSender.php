<?php

declare(strict_types=1);

namespace Study114\Auth;

use Study114\Paid\SmsLogSender;

/** P20-05 — SMS OTP 발송 (운영 전 SmsLogSender) */
final class PhoneOtpSmsSender
{
    private SmsLogSender $sender;

    public function __construct(?SmsLogSender $sender = null)
    {
        $this->sender = $sender ?? new SmsLogSender();
    }

    public function sendOtp(string $phoneDigits, string $code): void
    {
        $body = "[우동공과] 인증번호 {$code} (3분 내 입력)";
        $this->sender->send($phoneDigits, $body);
    }
}
