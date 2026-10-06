<?php

declare(strict_types=1);

namespace Study114\Support;

use PDO;
use RuntimeException;

final class SupportTicketRepository
{
    private const BASE_COLUMNS = 'id, ticket_no, email, category, role_type, body, status, created_at, updated_at';
    private const REPLY_COLUMNS = 'admin_reply_text, admin_replied_at';

    private ?bool $hasReplyColumns = null;
    private ?bool $hasUserIdColumn = null;

    public function __construct(private readonly PDO $pdo)
    {
    }

    public function hasReplyColumns(): bool
    {
        if ($this->hasReplyColumns !== null) {
            return $this->hasReplyColumns;
        }
        $stmt = $this->pdo->query("SHOW COLUMNS FROM support_tickets LIKE 'admin_reply_text'");
        $this->hasReplyColumns = $stmt !== false && $stmt->fetch() !== false;

        return $this->hasReplyColumns;
    }

    public function hasUserIdColumn(): bool
    {
        if ($this->hasUserIdColumn !== null) {
            return $this->hasUserIdColumn;
        }
        $stmt = $this->pdo->query("SHOW COLUMNS FROM support_tickets LIKE 'user_id'");
        $this->hasUserIdColumn = $stmt !== false && $stmt->fetch() !== false;

        return $this->hasUserIdColumn;
    }

    private function selectColumns(): string
    {
        $cols = $this->hasReplyColumns()
            ? self::BASE_COLUMNS . ', ' . self::REPLY_COLUMNS
            : self::BASE_COLUMNS;
        if ($this->hasUserIdColumn()) {
            $cols .= ', user_id';
        }

        return $cols;
    }

    /** @return list<array<string, mixed>> */
    public function listAll(): array
    {
        $cols = $this->selectColumns();
        $stmt = $this->pdo->query(
            "SELECT {$cols}
             FROM support_tickets
             ORDER BY updated_at DESC, created_at DESC, id DESC"
        );

        return $stmt->fetchAll();
    }

    /** @return list<array<string, mixed>> */
    public function listByEmail(string $email): array
    {
        $cols = $this->selectColumns();
        $stmt = $this->pdo->prepare(
            "SELECT {$cols}
             FROM support_tickets
             WHERE LOWER(email) = LOWER(?)
             ORDER BY updated_at DESC, created_at DESC, id DESC"
        );
        $stmt->execute([$email]);

        return $stmt->fetchAll();
    }

    /**
     * 076 전 배포에서도 이메일 조회로 떨어진다.
     *
     * @return list<array<string, mixed>>
     */
    public function listMine(int $userId, string $accountEmail): array
    {
        if (!$this->hasUserIdColumn()) {
            return $this->listByEmail($accountEmail);
        }
        $cols = $this->selectColumns();
        $stmt = $this->pdo->prepare(
            "SELECT {$cols}
             FROM support_tickets
             WHERE user_id = ? OR (user_id IS NULL AND LOWER(TRIM(email)) = LOWER(TRIM(?)))
             ORDER BY updated_at DESC, created_at DESC, id DESC"
        );
        $stmt->execute([$userId, $accountEmail]);

        return $stmt->fetchAll();
    }

    /**
     * @return array{rows: list<array<string, mixed>>, total: int}
     */
    public function listAdmin(string $group, string $q, int $page, int $perPage = 20): array
    {
        $perPage = 20;
        $page = max(1, $page);
        [$where, $params] = $this->adminWhere($group, $q);
        $countStmt = $this->pdo->prepare('SELECT COUNT(*) FROM support_tickets' . $where);
        $countStmt->execute($params);
        $total = (int) $countStmt->fetchColumn();

        $cols = $this->selectColumns();
        $offset = ($page - 1) * $perPage;
        $stmt = $this->pdo->prepare(
            "SELECT {$cols}
             FROM support_tickets
             {$where}
             ORDER BY updated_at DESC, created_at DESC, id DESC
             LIMIT {$perPage} OFFSET {$offset}"
        );
        $stmt->execute($params);

        return [
            'rows' => $stmt->fetchAll(),
            'total' => $total,
        ];
    }

    /** @return list<array<string, mixed>> */
    public function listByUserId(int $userId): array
    {
        if (!$this->hasUserIdColumn() || $userId <= 0) {
            return [];
        }
        $cols = $this->selectColumns();
        $stmt = $this->pdo->prepare(
            "SELECT {$cols}
             FROM support_tickets
             WHERE user_id = ?
             ORDER BY created_at DESC, id DESC"
        );
        $stmt->execute([$userId]);

        return $stmt->fetchAll();
    }

    /**
     * @return array{0: string, 1: list<mixed>}
     */
    private function adminWhere(string $group, string $q): array
    {
        $clauses = [];
        $params = [];
        if ($group === 'closed') {
            $clauses[] = "status = 'closed'";
        } elseif ($group !== 'all') {
            $clauses[] = "status IN ('open', 'in_progress')";
        }
        $q = trim($q);
        if ($q !== '') {
            $like = '%' . $this->escapeLike($q) . '%';
            if ($this->hasUserIdColumn() && preg_match('/^[0-9]+$/', $q) === 1) {
                $clauses[] = "(email LIKE ? ESCAPE '\\\\' OR user_id = ?)";
                $params[] = $like;
                $params[] = (int) $q;
            } else {
                $clauses[] = "email LIKE ? ESCAPE '\\\\'";
                $params[] = $like;
            }
        }
        $where = $clauses === [] ? '' : ' WHERE ' . implode(' AND ', $clauses);

        return [$where, $params];
    }

    private function escapeLike(string $value): string
    {
        return str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $value);
    }

    /** @return array<string, mixed>|null */
    public function findByTicketNo(string $ticketNo): ?array
    {
        $cols = $this->selectColumns();
        $stmt = $this->pdo->prepare(
            "SELECT {$cols}
             FROM support_tickets
             WHERE ticket_no = ? LIMIT 1"
        );
        $stmt->execute([$ticketNo]);
        $row = $stmt->fetch();

        return $row === false ? null : $row;
    }

    public function nextTicketNo(): string
    {
        $prefix = 'TKT-' . date('Ymd') . '-';
        $stmt = $this->pdo->prepare(
            'SELECT ticket_no
             FROM support_tickets
             WHERE ticket_no LIKE ?
             ORDER BY ticket_no DESC
             LIMIT 1'
        );
        $stmt->execute([$prefix . '%']);
        $last = $stmt->fetchColumn();
        if ($last === false) {
            return $prefix . '001';
        }

        $seq = (int) substr((string) $last, -3) + 1;
        return $prefix . str_pad((string) $seq, 3, '0', STR_PAD_LEFT);
    }

    public function create(string $email, string $category, string $roleType, string $body, ?int $userId = null): array
    {
        $ticketNo = $this->nextTicketNo();
        if ($this->hasUserIdColumn()) {
            $stmt = $this->pdo->prepare(
                'INSERT INTO support_tickets (ticket_no, email, user_id, category, role_type, body, status)
                 VALUES (?, ?, ?, ?, ?, ?, "open")'
            );
            $stmt->execute([$ticketNo, $email, $userId, $category, $roleType, $body]);
        } else {
            $stmt = $this->pdo->prepare(
                'INSERT INTO support_tickets (ticket_no, email, category, role_type, body, status)
                 VALUES (?, ?, ?, ?, ?, "open")'
            );
            $stmt->execute([$ticketNo, $email, $category, $roleType, $body]);
        }

        /** @var array<string, mixed> */
        return $this->findByTicketNo($ticketNo);
    }

    public function updateStatus(string $ticketNo, string $status): ?array
    {
        $stmt = $this->pdo->prepare(
            'UPDATE support_tickets SET status = ?, updated_at = NOW() WHERE ticket_no = ?'
        );
        $stmt->execute([$status, $ticketNo]);

        return $this->findByTicketNo($ticketNo);
    }

    public function updateReply(string $ticketNo, string $replyText): ?array
    {
        if (!$this->hasReplyColumns()) {
            throw new RuntimeException('schema_missing: sql/schema/068_support_ticket_admin_reply.sql');
        }
        $stmt = $this->pdo->prepare(
            'UPDATE support_tickets
             SET admin_reply_text = ?, admin_replied_at = NOW(), updated_at = NOW()
             WHERE ticket_no = ?'
        );
        $stmt->execute([$replyText, $ticketNo]);

        return $this->findByTicketNo($ticketNo);
    }
}
