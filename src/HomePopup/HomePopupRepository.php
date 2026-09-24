<?php

declare(strict_types=1);

namespace Study114\HomePopup;

use PDO;
use Study114\Database\Connection;

final class HomePopupRepository
{
    public function __construct(private readonly PDO $pdo)
    {
    }

    public static function connect(): self
    {
        return new self(Connection::get());
    }

    /** @return list<array<string, mixed>> */
    public function listAll(): array
    {
        $stmt = $this->pdo->query(
            "SELECT id, type, family, audience, content, start_at, end_at,
                    published, sort_order, created_at, updated_at
             FROM home_popups
             ORDER BY published DESC,
                      CASE type WHEN 'notice' THEN 0 WHEN 'event' THEN 1 WHEN 'ad' THEN 2 ELSE 9 END,
                      sort_order ASC,
                      updated_at DESC,
                      id DESC"
        );

        return $stmt->fetchAll();
    }

    /** @return array<string, mixed>|null */
    public function find(int $id): ?array
    {
        $stmt = $this->pdo->prepare(
            'SELECT id, type, family, audience, content, start_at, end_at,
                    published, sort_order, created_at, updated_at
             FROM home_popups WHERE id = ? LIMIT 1'
        );
        $stmt->execute([$id]);
        $row = $stmt->fetch();

        return $row === false ? null : $row;
    }

    /**
     * @param array{
     *   type: string, family: string, audience: string, content: string,
     *   start_at: ?string, end_at: ?string, published: int, sort_order: int
     * } $row
     */
    public function insert(array $row): int
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO home_popups
                (type, family, audience, content, start_at, end_at, published, sort_order)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $row['type'],
            $row['family'],
            $row['audience'],
            $row['content'],
            $row['start_at'],
            $row['end_at'],
            $row['published'],
            $row['sort_order'],
        ]);

        return (int) $this->pdo->lastInsertId();
    }

    /**
     * @param array{
     *   type: string, family: string, audience: string, content: string,
     *   start_at: ?string, end_at: ?string, published: int, sort_order: int
     * } $row
     */
    public function update(int $id, array $row): void
    {
        $stmt = $this->pdo->prepare(
            'UPDATE home_popups
             SET type = ?, family = ?, audience = ?, content = ?,
                 start_at = ?, end_at = ?, published = ?, sort_order = ?
             WHERE id = ?'
        );
        $stmt->execute([
            $row['type'],
            $row['family'],
            $row['audience'],
            $row['content'],
            $row['start_at'],
            $row['end_at'],
            $row['published'],
            $row['sort_order'],
            $id,
        ]);
    }

    public function delete(int $id): void
    {
        $stmt = $this->pdo->prepare('DELETE FROM home_popups WHERE id = ?');
        $stmt->execute([$id]);
    }

    /** @return list<array<string, mixed>> */
    public function listPublishedInWindow(string $today): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT id, type, family, audience, content, start_at, end_at,
                    sort_order, updated_at
             FROM home_popups
             WHERE published = 1
               AND (start_at IS NULL OR start_at <= ?)
               AND (end_at IS NULL OR end_at >= ?)
             ORDER BY sort_order ASC, updated_at DESC, id DESC'
        );
        $stmt->execute([$today, $today]);

        return $stmt->fetchAll();
    }
}
