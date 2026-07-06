<?php

declare(strict_types=1);

namespace Study114\Support;

use PDO;

final class SupportTicketRepository
{
    public function __construct(private readonly PDO $pdo)
    {
    }

    /** @return list<array<string, mixed>> */
    public function listAll(): array
    {
        $stmt = $this->pdo->query(
            'SELECT id, ticket_no, email, category, role_type, body, status, created_at, updated_at
             FROM support_tickets
             ORDER BY created_at DESC, id DESC'
        );

        return $stmt->fetchAll();
    }

    /** @return list<array<string, mixed>> */
    public function listByEmail(string $email): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT id, ticket_no, email, category, role_type, body, status, created_at, updated_at
             FROM support_tickets
             WHERE LOWER(email) = LOWER(?)
             ORDER BY created_at DESC, id DESC'
        );
        $stmt->execute([$email]);

        return $stmt->fetchAll();
    }

    /** @return array<string, mixed>|null */
    public function findByTicketNo(string $ticketNo): ?array
    {
        $stmt = $this->pdo->prepare(
            'SELECT id, ticket_no, email, category, role_type, body, status, created_at, updated_at
             FROM support_tickets
             WHERE ticket_no = ? LIMIT 1'
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

    public function create(string $email, string $category, string $roleType, string $body): array
    {
        $ticketNo = $this->nextTicketNo();
        $stmt = $this->pdo->prepare(
            'INSERT INTO support_tickets (ticket_no, email, category, role_type, body, status)
             VALUES (?, ?, ?, ?, ?, "open")'
        );
        $stmt->execute([$ticketNo, $email, $category, $roleType, $body]);

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
}
