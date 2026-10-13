<?php

declare(strict_types=1);

namespace Study114\Mail;

use DateTimeImmutable;
use InvalidArgumentException;
use PDO;
use PDOException;
use RuntimeException;
use Study114\Paid\PositionPeriodCalculator;

/**
 * 생활 메일 종류별 켜고 끄기 (정본 74 §4). 원본은 site_settings 의 member_mail 한 행.
 *
 * - 저장한 적이 없는 종류는 켜짐.
 * - 다시 켤 때 enabled_at(KST)을 남긴다 → 꺼져 있던 동안 대상이 된 회원에게 몰아서 보내지 않는다.
 * - site_settings 테이블이 없으면 모두 켜짐으로 읽고, 저장은 schema_missing.
 */
final class MemberMailSettings
{
    public const KEY = 'member_mail';

    public const CARD_POSTED = 'card_posted';
    public const PURCHASE_THANKS = 'purchase_thanks';
    public const WELCOME_WEEK = 'welcome_week';
    public const POSITION_ENDING = 'position_ending';
    public const WITHDRAW_FAREWELL = 'withdraw_farewell';

    public const KINDS = [
        self::CARD_POSTED,
        self::PURCHASE_THANKS,
        self::WELCOME_WEEK,
        self::POSITION_ENDING,
        self::WITHDRAW_FAREWELL,
    ];

    public const SCHEMA_MISSING = 'schema_missing';

    /** @var array<string, array<string, mixed>>|null */
    private ?array $cache = null;

    public function __construct(private readonly PDO $pdo)
    {
    }

    public static function isKind(string $kind): bool
    {
        return in_array($kind, self::KINDS, true);
    }

    public function isEnabled(string $kind): bool
    {
        return $this->all()[$kind]['enabled'] ?? true;
    }

    /** 마지막으로 다시 켠 시각(Y-m-d H:i:s, KST). 한 번도 끈 적 없으면 null */
    public function enabledSince(string $kind): ?string
    {
        return $this->all()[$kind]['enabled_at'] ?? null;
    }

    /**
     * @return array<string, array{enabled: bool, enabled_at: ?string, changed_at: ?string, changed_by: ?string}>
     */
    public function all(): array
    {
        if ($this->cache === null) {
            $this->cache = $this->normalize($this->readStored());
        }

        return $this->cache;
    }

    /**
     * @return array<string, array{enabled: bool, enabled_at: ?string, changed_at: ?string, changed_by: ?string}>
     */
    public function setEnabled(string $kind, bool $enabled, string $operator): array
    {
        if (!self::isKind($kind)) {
            throw new InvalidArgumentException('알 수 없는 메일 종류입니다.');
        }
        $mysql = $this->pdo->getAttribute(PDO::ATTR_DRIVER_NAME) !== 'sqlite';
        $this->pdo->beginTransaction();
        try {
            $stored = $this->readStored($mysql ? ' FOR UPDATE' : '', true);
            $kinds = is_array($stored['kinds'] ?? null) ? $stored['kinds'] : [];
            $prev = is_array($kinds[$kind] ?? null) ? $kinds[$kind] : [];
            $wasEnabled = ($prev['enabled'] ?? true) === true;
            $now = (new DateTimeImmutable('now', PositionPeriodCalculator::timezone()))->format('Y-m-d H:i:s');
            if ($wasEnabled !== $enabled) {
                $kinds[$kind] = [
                    'enabled' => $enabled,
                    'enabled_at' => $enabled ? $now : ($prev['enabled_at'] ?? null),
                    'changed_at' => $now,
                    'changed_by' => $operator !== '' ? $operator : null,
                ];
                $stored['kinds'] = $kinds;
                $this->write($stored, $operator, $mysql);
            }
            $this->pdo->commit();
        } catch (\Throwable $e) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            throw $e;
        }
        $this->cache = null;

        return $this->all();
    }

    /** @return array<string, mixed> */
    private function readStored(string $lock = '', bool $forWrite = false): array
    {
        try {
            $stmt = $this->pdo->prepare('SELECT value_json FROM site_settings WHERE setting_key = ? LIMIT 1' . $lock);
            $stmt->execute([self::KEY]);
            $raw = $stmt->fetchColumn();
        } catch (PDOException $e) {
            if ($this->isMissingTable($e)) {
                if ($forWrite) {
                    throw new RuntimeException(self::SCHEMA_MISSING, 0, $e);
                }

                return [];
            }
            throw $e;
        }
        if ($raw === false || $raw === null) {
            return [];
        }
        $decoded = json_decode((string) $raw, true);

        return is_array($decoded) ? $decoded : [];
    }

    /** @param array<string, mixed> $stored */
    private function write(array $stored, string $operator, bool $mysql): void
    {
        $json = json_encode($stored, JSON_UNESCAPED_UNICODE);
        if ($json === false) {
            throw new RuntimeException('member_mail 설정을 저장할 수 없습니다.');
        }
        $sql = $mysql
            ? 'INSERT INTO site_settings (setting_key, value_json, updated_by) VALUES (?, ?, ?)
               ON DUPLICATE KEY UPDATE value_json = VALUES(value_json), updated_by = VALUES(updated_by)'
            : 'INSERT INTO site_settings (setting_key, value_json, updated_by) VALUES (?, ?, ?)
               ON CONFLICT(setting_key) DO UPDATE SET value_json = excluded.value_json, updated_by = excluded.updated_by';
        $this->pdo->prepare($sql)->execute([self::KEY, $json, $operator !== '' ? $operator : null]);
    }

    /**
     * @param array<string, mixed> $stored
     * @return array<string, array{enabled: bool, enabled_at: ?string, changed_at: ?string, changed_by: ?string}>
     */
    private function normalize(array $stored): array
    {
        $kinds = is_array($stored['kinds'] ?? null) ? $stored['kinds'] : [];
        $out = [];
        foreach (self::KINDS as $kind) {
            $row = is_array($kinds[$kind] ?? null) ? $kinds[$kind] : [];
            $out[$kind] = [
                'enabled' => ($row['enabled'] ?? true) !== false,
                'enabled_at' => self::dateTimeOrNull($row['enabled_at'] ?? null),
                'changed_at' => self::dateTimeOrNull($row['changed_at'] ?? null),
                'changed_by' => is_string($row['changed_by'] ?? null) ? $row['changed_by'] : null,
            ];
        }

        return $out;
    }

    private static function dateTimeOrNull(mixed $v): ?string
    {
        return is_string($v) && preg_match('/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/', $v) === 1 ? $v : null;
    }

    private function isMissingTable(PDOException $e): bool
    {
        $msg = $e->getMessage();

        return str_contains($msg, 'site_settings')
            && (str_contains($msg, '1146') || str_contains($msg, '42S02') || str_contains($msg, 'no such table') || str_contains($msg, 'exist'));
    }
}
