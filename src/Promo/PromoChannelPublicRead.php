<?php

declare(strict_types=1);

namespace Study114\Promo;

use PDO;
use Study114\Visibility\WithdrawnOwnerSql;

/**
 * 확대카드용 홍보 채널. 검색 목록에는 넣지 않는다.
 * facebook_url 은 응답에 포함하지 않는다.
 */
final class PromoChannelPublicRead
{
    /** @var list<string> */
    private const FIELDS = [
        'youtube_url',
        'youtube_url_2',
        'youtube_url_3',
        'youtube_url_4',
        'blog_url_1',
        'blog_title_1',
        'blog_url_2',
        'blog_title_2',
        'instagram_url',
        'tiktok_url',
        'naver_clip_url',
    ];

    public function __construct(private readonly PDO $pdo)
    {
    }

    /**
     * @return array<string, string>|null
     */
    public function forCard(string $kind, int $id): ?array
    {
        if ($id <= 0) {
            return null;
        }
        if ($kind === 'study_room') {
            return $this->read('study_rooms', 'sr', $id, true);
        }
        if ($kind === 'tutor') {
            return $this->read('tutors', 't', $id, false);
        }
        return null;
    }

    /**
     * @return array<string, string>|null
     */
    private function read(string $table, string $alias, int $id, bool $hasDeletedAt): ?array
    {
        $select = [];
        foreach (self::FIELDS as $col) {
            if ($this->columnExists($table, $col)) {
                $select[] = "{$alias}.{$col}";
            } else {
                $select[] = "NULL AS {$col}";
            }
        }
        $where = [
            "{$alias}.id = ?",
            "{$alias}.profile_status <> 'hidden'",
            WithdrawnOwnerSql::notWithdrawn("{$alias}.user_id"),
        ];
        if ($hasDeletedAt) {
            $where[] = "{$alias}.deleted_at IS NULL";
        }
        $sql = 'SELECT ' . implode(', ', $select)
            . " FROM {$table} {$alias} WHERE " . implode(' AND ', $where)
            . ' LIMIT 1';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) {
            return null;
        }
        $out = [];
        foreach (self::FIELDS as $col) {
            $out[$col] = trim((string) ($row[$col] ?? ''));
        }
        return $out;
    }

    private function columnExists(string $table, string $column): bool
    {
        try {
            $stmt = $this->pdo->prepare(
                'SELECT 1 FROM information_schema.COLUMNS
                  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1'
            );
            $stmt->execute([$table, $column]);
            return (bool) $stmt->fetchColumn();
        } catch (\Throwable) {
            return false;
        }
    }
}
