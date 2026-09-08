<?php

declare(strict_types=1);

namespace Study114\Mail;

/** 로그·응답용 이메일 마스킹 (원문 미기록) */
final class MailAddressMasker
{
    public static function mask(string $email): string
    {
        $email = trim($email);
        $at = strpos($email, '@');
        if ($at === false || $at < 1) {
            return '***';
        }
        $local = substr($email, 0, $at);
        $domain = substr($email, $at);
        $keep = substr($local, 0, min(2, strlen($local)));

        return $keep . '***' . $domain;
    }
}
