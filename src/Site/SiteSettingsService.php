<?php

declare(strict_types=1);

namespace Study114\Site;

use InvalidArgumentException;
use PDO;
use PDOException;
use Study114\Admin\AdminOperationLogRepository;
use Study114\Database\Connection;
use Throwable;

final class SiteSettingsSchemaException extends \RuntimeException
{
}

final class SiteSettingsMaintenanceException extends \RuntimeException
{
}

/**
 * 사이트 기본. 원본은 site_settings.bundle 한 행.
 * 테이블이 없으면 손님 읽기는 빈 값, 쓰기는 막지 않는다.
 */
final class SiteSettingsService
{
    private const KEY = 'bundle';

    public function __construct(private ?PDO $pdo = null)
    {
    }

    /** 로그인·관리자·상태 확인을 뺀 쓰기 요청을 점검 중이면 503으로 끝낸다. */
    public static function rejectWriteIfActive(): void
    {
        if (PHP_SAPI === 'cli') {
            return;
        }
        $method = strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET'));
        if (!in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE'], true)) {
            return;
        }
        $path = (string) (parse_url((string) ($_SERVER['REQUEST_URI'] ?? ''), PHP_URL_PATH) ?: '');
        if (self::isWriteExempt($path)) {
            return;
        }
        try {
            $active = (new self())->activeMaintenance();
        } catch (Throwable $e) {
            error_log('[site-settings] maintenance check skipped: ' . $e->getMessage());
            return;
        }
        if ($active === null) {
            return;
        }
        if (!headers_sent()) {
            http_response_code(503);
            header('Content-Type: application/json; charset=utf-8');
            if (function_exists('study114_send_cors_headers')) {
                study114_send_cors_headers();
            }
        }
        echo json_encode([
            'ok' => false,
            'error' => 'maintenance',
            'message' => $active['message'],
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    public function assertWritesOpen(): void
    {
        $active = $this->activeMaintenance();
        if ($active !== null) {
            throw new SiteSettingsMaintenanceException($active['message']);
        }
    }

    public function assertSignupEmailAllowed(string $email): void
    {
        $email = strtolower(trim($email));
        if ($email === '' || !str_contains($email, '@')) {
            return;
        }
        try {
            $bundle = $this->readBundle();
        } catch (SiteSettingsSchemaException $e) {
            error_log('[site-settings] signup filter skipped: ' . $e->getMessage());
            return;
        } catch (Throwable $e) {
            error_log('[site-settings] signup filter skipped: ' . $e->getMessage());
            return;
        }
        if (!is_array($bundle)) {
            return;
        }
        $domain = strtolower((string) substr(strrchr($email, '@') ?: '', 1));
        $lines = preg_split('/\r\n|\n|,/', (string) ($bundle['bannedEmails'] ?? '')) ?: [];
        foreach ($lines as $line) {
            $rule = strtolower(trim((string) $line));
            if ($rule === '') {
                continue;
            }
            if (str_starts_with($rule, '@')) {
                $rule = substr($rule, 1);
            }
            $blocked = str_contains($rule, '@') ? ($rule === $email) : ($domain !== '' && $rule === $domain);
            if ($blocked) {
                throw new InvalidArgumentException('이 이메일로는 가입을 진행할 수 없습니다.');
            }
        }
    }

    /** @return array<string, mixed>|null */
    public function activeMaintenance(): ?array
    {
        try {
            $bundle = $this->readBundle();
        } catch (Throwable $e) {
            error_log('[site-settings] maintenance read skipped: ' . $e->getMessage());
            return null;
        }
        if (!is_array($bundle) || empty($bundle['maintenanceEnabled'])) {
            return null;
        }
        $until = trim((string) ($bundle['maintenanceUntil'] ?? ''));
        if ($until !== '') {
            $ts = strtotime(str_replace('T', ' ', $until));
            if ($ts !== false && time() > $ts) {
                return null;
            }
        }
        $message = trim((string) ($bundle['maintenanceMessage'] ?? ''));
        if ($message === '') {
            $message = '시스템 점검 중입니다. 잠시 후 다시 이용해 주세요.';
        }

        return [
            'enabled' => true,
            'message' => $message,
            'until' => $until,
        ];
    }

    /** @return array<string, mixed> */
    public function publicPayload(): array
    {
        $empty = $this->emptyPublicPayload();
        try {
            $bundle = $this->readBundle();
        } catch (Throwable $e) {
            error_log('[site-settings] public read failed: ' . $e->getMessage());
            return $empty;
        }
        if (!is_array($bundle)) {
            return $empty;
        }
        $active = $this->activeMaintenance();
        $terms = $this->legalOrNull($bundle['terms'] ?? null);
        $privacy = $this->legalOrNull($bundle['privacy'] ?? null);

        return [
            'siteName' => trim((string) ($bundle['siteName'] ?? '')),
            'maintenanceEnabled' => $active !== null,
            'maintenanceMessage' => $active !== null ? $active['message'] : '',
            'maintenanceUntil' => $active !== null ? $active['until'] : '',
            'guestBannerEnabled' => !empty($bundle['guestBannerEnabled']) && trim((string) ($bundle['guestBannerText'] ?? '')) !== '',
            'guestBannerText' => !empty($bundle['guestBannerEnabled']) ? trim((string) ($bundle['guestBannerText'] ?? '')) : '',
            'terms' => $terms,
            'privacy' => $privacy,
        ];
    }

    /** @return array<string, mixed> */
    public function emptyPublicPayload(): array
    {
        return [
            'siteName' => '',
            'maintenanceEnabled' => false,
            'maintenanceMessage' => '',
            'maintenanceUntil' => '',
            'guestBannerEnabled' => false,
            'guestBannerText' => '',
            'terms' => null,
            'privacy' => null,
        ];
    }

    /**
     * @return array{settings: array<string, mixed>, logs: list<array<string, string>>}
     */
    public function adminView(): array
    {
        $bundle = $this->readBundle();
        if ($bundle === null && $this->tableMissing) {
            throw new SiteSettingsSchemaException('사이트 기본 저장 테이블이 없습니다. sql/schema/070_site_settings.sql 을 적용해 주세요.');
        }

        return [
            'settings' => $this->presentAdmin(is_array($bundle) ? $bundle : []),
            'logs' => $this->recentLogs(),
        ];
    }

    /**
     * @param array<string, mixed> $patch
     * @return array{settings: array<string, mixed>, logs: list<array<string, string>>}
     */
    public function save(array $patch, string $operatorEmail): array
    {
        if (!empty($patch['reset'])) {
            return $this->reset($operatorEmail);
        }
        $current = $this->readBundle();
        if ($current === null && $this->tableMissing) {
            throw new SiteSettingsSchemaException('사이트 기본 저장 테이블이 없습니다. sql/schema/070_site_settings.sql 을 적용해 주세요.');
        }
        $next = $this->merge(is_array($current) ? $current : $this->defaults(), $patch);
        $this->writeBundle($next, $operatorEmail);
        $this->writeLog($operatorEmail, 'site_settings_save', $this->saveMemo($patch, $next));

        return [
            'settings' => $this->presentAdmin($next),
            'logs' => $this->recentLogs(),
        ];
    }

    /**
     * @return array{settings: array<string, mixed>, logs: list<array<string, string>>}
     */
    public function reset(string $operatorEmail): array
    {
        $next = $this->defaults();
        $this->writeBundle($next, $operatorEmail);
        $this->writeLog($operatorEmail, 'site_settings_reset', '초기값');

        return [
            'settings' => $this->presentAdmin($next),
            'logs' => $this->recentLogs(),
        ];
    }

    private bool $tableMissing = false;

    /** @return array<string, mixed>|null null = 행 없음 또는 테이블 없음 */
    private function readBundle(): ?array
    {
        $this->tableMissing = false;
        try {
            $stmt = $this->pdo()->prepare('SELECT value_json FROM site_settings WHERE setting_key = ? LIMIT 1');
            $stmt->execute([self::KEY]);
            $raw = $stmt->fetchColumn();
        } catch (PDOException $e) {
            if ($this->isMissingTable($e)) {
                $this->tableMissing = true;
                return null;
            }
            throw $e;
        }
        if ($raw === false || $raw === null) {
            return null;
        }
        $decoded = json_decode((string) $raw, true);

        return is_array($decoded) ? $decoded : null;
    }

    /** @param array<string, mixed> $bundle */
    private function writeBundle(array $bundle, string $operatorEmail): void
    {
        $json = json_encode($bundle, JSON_UNESCAPED_UNICODE);
        if ($json === false) {
            throw new InvalidArgumentException('설정을 저장할 수 없습니다.');
        }
        try {
            $stmt = $this->pdo()->prepare(
                'INSERT INTO site_settings (setting_key, value_json, updated_by)
                 VALUES (?, ?, ?)
                 ON DUPLICATE KEY UPDATE value_json = VALUES(value_json), updated_by = VALUES(updated_by)'
            );
            $stmt->execute([self::KEY, $json, $operatorEmail !== '' ? $operatorEmail : null]);
        } catch (PDOException $e) {
            if ($this->isMissingTable($e)) {
                throw new SiteSettingsSchemaException('사이트 기본 저장 테이블이 없습니다. sql/schema/070_site_settings.sql 을 적용해 주세요.');
            }
            throw $e;
        }
    }

    private function writeLog(string $operatorEmail, string $action, string $memo): void
    {
        try {
            (new AdminOperationLogRepository($this->pdo()))->insert(
                $operatorEmail !== '' ? $operatorEmail : 'admin',
                'site_settings',
                'site',
                $action,
                'site_settings',
                $memo,
                false,
                false,
            );
        } catch (Throwable $e) {
            error_log('[site-settings] log skipped: ' . $e->getMessage());
        }
    }

    /** @return list<array<string, string>> */
    private function recentLogs(): array
    {
        try {
            $stmt = $this->pdo()->query(
                "SELECT action_kind, target_id, acted_at
                 FROM admin_operation_logs
                 WHERE action_kind IN ('site_settings_save', 'site_settings_reset')
                 ORDER BY acted_at DESC, id DESC
                 LIMIT 8"
            );
            $rows = $stmt ? $stmt->fetchAll(PDO::FETCH_ASSOC) : [];
        } catch (Throwable $e) {
            error_log('[site-settings] log read skipped: ' . $e->getMessage());
            return [];
        }
        $out = [];
        foreach ($rows as $row) {
            $out[] = [
                'action' => (string) ($row['action_kind'] ?? ''),
                'target' => (string) ($row['target_id'] ?? 'site'),
                'at' => (string) ($row['acted_at'] ?? ''),
            ];
        }

        return $out;
    }

    /** @param array<string, mixed> $base @param array<string, mixed> $patch */
    private function merge(array $base, array $patch): array
    {
        $next = $base;
        foreach ([
            'siteName' => 80,
            'operatorEmail' => 190,
            'operatorPhone' => 40,
            'supportHours' => 80,
            'maintenanceMessage' => 500,
            'maintenanceUntil' => 32,
            'guestBannerText' => 300,
            'bannedEmails' => 4000,
            'bannedWords' => 2000,
            'notifyEmails' => 500,
        ] as $key => $max) {
            if (array_key_exists($key, $patch)) {
                $next[$key] = mb_substr(trim((string) $patch[$key]), 0, $max);
            }
        }
        foreach (['maintenanceEnabled', 'guestBannerEnabled', 'notifyOnReport', 'notifyOnTicket', 'notifyOnNewProvider'] as $key) {
            if (array_key_exists($key, $patch)) {
                $next[$key] = (bool) $patch[$key];
            }
        }
        if (isset($patch['joinPolicy']) && is_array($patch['joinPolicy'])) {
            $encoded = json_encode($patch['joinPolicy'], JSON_UNESCAPED_UNICODE);
            if ($encoded !== false && strlen($encoded) <= 30000) {
                $next['joinPolicy'] = $patch['joinPolicy'];
            }
        }
        if (isset($patch['terms']) && is_array($patch['terms'])) {
            $next['terms'] = $this->clipLegal($patch['terms'], $base['terms'] ?? []);
        }
        if (isset($patch['privacy']) && is_array($patch['privacy'])) {
            $next['privacy'] = $this->clipLegal($patch['privacy'], $base['privacy'] ?? []);
        }
        unset($next['signupOpen'], $next['studyRoomRegisterOpen'], $next['tutorRegisterOpen']);

        return $next;
    }

    /** @param array<string, mixed> $input @param mixed $fallback */
    private function clipLegal(array $input, mixed $fallback): array
    {
        $prev = is_array($fallback) ? $fallback : [];
        $title = array_key_exists('title', $input) ? (string) $input['title'] : (string) ($prev['title'] ?? '');
        $body = array_key_exists('body', $input) ? (string) $input['body'] : (string) ($prev['body'] ?? '');

        return [
            'title' => mb_substr(trim($title), 0, 120),
            'body' => mb_substr(trim($body), 0, 20000),
        ];
    }

    /** @param array<string, mixed> $bundle */
    private function presentAdmin(array $bundle): array
    {
        $merged = array_merge($this->defaults(), $bundle);
        unset($merged['signupOpen'], $merged['studyRoomRegisterOpen'], $merged['tutorRegisterOpen']);

        return $merged;
    }

    /** @return array<string, mixed> */
    private function defaults(): array
    {
        return [
            'siteName' => '우동공과',
            'operatorEmail' => '',
            'operatorPhone' => '',
            'supportHours' => '평일 10:00–18:00',
            'maintenanceEnabled' => false,
            'maintenanceMessage' => '시스템 점검 중입니다. 잠시 후 다시 이용해 주세요.',
            'maintenanceUntil' => '',
            'guestBannerEnabled' => false,
            'guestBannerText' => '',
            'bannedEmails' => '',
            'bannedWords' => '',
            'notifyOnReport' => true,
            'notifyOnTicket' => true,
            'notifyOnNewProvider' => false,
            'notifyEmails' => '',
            'joinPolicy' => null,
            'terms' => ['title' => '', 'body' => ''],
            'privacy' => ['title' => '', 'body' => ''],
        ];
    }

    /** @param array<string, mixed> $patch @param array<string, mixed> $next */
    private function saveMemo(array $patch, array $next): string
    {
        $parts = [];
        if (isset($patch['terms']) || isset($patch['privacy'])) {
            $parts[] = '약관 글';
        }
        if (array_key_exists('maintenanceEnabled', $patch)) {
            $parts[] = !empty($next['maintenanceEnabled']) ? '점검 켬' : '점검 끔';
        }
        if ($parts === []) {
            $parts[] = '사이트 기본';
        }
        $name = trim((string) ($next['siteName'] ?? ''));
        if ($name !== '') {
            $parts[] = $name;
        }

        return implode(' · ', $parts);
    }

    /** @return array{title: string, body: string}|null */
    private function legalOrNull(mixed $doc): ?array
    {
        if (!is_array($doc)) {
            return null;
        }
        $body = trim((string) ($doc['body'] ?? ''));
        if ($body === '') {
            return null;
        }

        return [
            'title' => trim((string) ($doc['title'] ?? '')),
            'body' => $body,
        ];
    }

    private function isMissingTable(PDOException $e): bool
    {
        $msg = $e->getMessage();

        return str_contains($msg, 'site_settings')
            && (str_contains($msg, '1146') || str_contains($msg, '42S02') || str_contains($msg, 'exist'));
    }

    private static function isWriteExempt(string $path): bool
    {
        $path = strtolower($path);
        if (!str_contains($path, '/api/')) {
            return true;
        }
        foreach ([
            '/api/admin/',
            '/api/auth/login.php',
            '/api/auth/logout.php',
            '/api/auth/oauth/start.php',
            '/api/auth/oauth/callback.php',
            '/api/cron/',
            '/api/health/',
            '/api/site/public-settings.php',
        ] as $needle) {
            if (str_contains($path, $needle)) {
                return true;
            }
        }

        return false;
    }

    private function pdo(): PDO
    {
        return $this->pdo ??= Connection::get();
    }
}
