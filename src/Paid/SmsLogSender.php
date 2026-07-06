<?php

declare(strict_types=1);

namespace Study114\Paid;

/** dev — SMS는 로그만 (운영 연동 전) */
final class SmsLogSender
{
    /** @var array<string, mixed> */
    private array $config;

    public function __construct()
    {
        $this->config = study114_config('paid');
    }

    public function send(string $phone, string $body): void
    {
        $path = (string) $this->config['sms_log_path'];
        $dir = dirname($path);
        if (!is_dir($dir)) {
            mkdir($dir, 0775, true);
        }

        $line = sprintf(
            "[%s] TO=%s\n%s\n---\n",
            date('Y-m-d H:i:s'),
            $phone,
            $body
        );
        file_put_contents($path, $line, FILE_APPEND | LOCK_EX);
        error_log('[sms] TO=' . $phone . ' ' . substr(str_replace("\n", ' ', $body), 0, 120));
    }
}
