<?php

declare(strict_types=1);

namespace Study114\Report;

use PDO;
use Study114\Auth\AccountWithdrawService;
use Study114\Database\Connection;

/** 스냅샷 id로 자세히 보기 목록을 만든다. 페이지 50건. */
final class SettlementLinesQuery
{
    private const PER_PAGE = 50;

    private PDO $pdo;

    public function __construct(?PDO $pdo = null)
    {
        $this->pdo = $pdo ?? Connection::get();
    }

    /**
     * @param array<string, mixed> $report
     * @return array{line: string, page: int, per_page: int, total: int, items: list<array<string, string>>, link: string}
     */
    public function page(array $report, string $line, int $page): array
    {
        $page = max(1, $page);
        $snap = is_array($report['snapshot_json'] ?? null) ? $report['snapshot_json'] : [];
        $tz = is_array($snap['tz'] ?? null) ? $snap['tz'] : ['db_offset_min' => 540, 'php_tz' => 'Asia/Seoul'];
        $offset = (int) ($tz['db_offset_min'] ?? 540);
        $phpTz = (string) ($tz['php_tz'] ?? 'Asia/Seoul');
        $period = new ReportPeriod();
        $key = $this->snapshotKey($line);
        $list = is_array($snap[$key] ?? null) ? array_values($snap[$key]) : [];
        $total = count($list);
        $slice = array_slice($list, ($page - 1) * self::PER_PAGE, self::PER_PAGE);
        $items = [];
        foreach ($slice as $entry) {
            if (!is_array($entry)) {
                continue;
            }
            $items[] = $this->present($line, $entry, $period, $offset, $phpTz);
        }

        return [
            'line' => $line,
            'page' => $page,
            'per_page' => self::PER_PAGE,
            'total' => $total,
            'items' => $items,
            'link' => $this->linkFor($line),
        ];
    }

    private function snapshotKey(string $line): string
    {
        return match ($line) {
            'pay' => 'pay',
            'inquiry' => 'inquiry',
            'report' => 'report',
            'reg' => 'reg',
            'withdraw' => 'withdraw',
            'delete' => 'delete',
            'popup' => 'popup',
            default => $line,
        };
    }

    /** @param array<string, mixed> $entry @return array<string, string> */
    private function present(string $line, array $entry, ReportPeriod $period, int $offset, string $phpTz): array
    {
        if ($line === 'pay') {
            $paidAt = (string) ($entry['paid_at'] ?? '');
            $member = $this->payMember((int) ($entry['id'] ?? 0));

            return [
                'time' => $period->storageToKst($paidAt, 'db', $offset, $phpTz),
                'member' => $member,
                'role' => $this->roleLabel((string) ($entry['role'] ?? '')),
                'product' => (string) ($entry['variant_label'] ?? ''),
                'amount' => number_format((int) ($entry['amount_won'] ?? 0)) . '원',
            ];
        }
        if ($line === 'inquiry') {
            return [
                'ticket_no' => (string) ($entry['ticket_no'] ?? ''),
                'time' => $period->storageToKst((string) ($entry['created_at'] ?? ''), 'db', $offset, $phpTz),
                'category' => $this->categoryLabel((string) ($entry['category'] ?? '')),
                'status' => $this->ticketStatus((string) ($entry['status'] ?? '')),
                'role' => $this->ticketRole((string) ($entry['role_type'] ?? '')),
            ];
        }
        if ($line === 'report') {
            return [
                'report_key' => (string) ($entry['report_key'] ?? ''),
                'time' => $period->storageToKst((string) ($entry['created_at'] ?? ''), 'db', $offset, $phpTz),
                'kind' => (string) ($entry['kind'] ?? ''),
                'target' => (string) ($entry['target'] ?? ''),
                'status' => $this->reportStatus((string) ($entry['status'] ?? '')),
            ];
        }
        if ($line === 'reg') {
            $role = (string) ($entry['role'] ?? '');
            $source = $role === 'student' ? 'php' : 'db';

            return [
                'role' => $this->roleLabel($role),
                'name' => $this->regName($role, (int) ($entry['id'] ?? 0)),
                'time' => $period->storageToKst((string) ($entry['registered_at'] ?? ''), $source, $offset, $phpTz),
            ];
        }
        if ($line === 'withdraw') {
            $roles = is_array($entry['roles'] ?? null) ? $entry['roles'] : [];

            return [
                'time' => $period->storageToKst((string) ($entry['deleted_at'] ?? ''), 'php', $offset, $phpTz),
                'roles' => implode(' · ', array_map('strval', $roles)),
                'name' => $this->maskedUser((int) ($entry['user_id'] ?? 0)),
            ];
        }
        if ($line === 'delete') {
            $roles = is_array($entry['roles'] ?? null) ? $entry['roles'] : [];
            if (!empty($entry['unknown'])) {
                $roles[] = '역할 미확인';
            }

            return [
                'time' => $period->storageToKst((string) ($entry['acted_at'] ?? ''), 'db', $offset, $phpTz),
                'target' => (string) ($entry['target_id'] ?? ''),
                'roles' => implode(' · ', array_map('strval', $roles)),
            ];
        }

        return [
            'id' => (string) ($entry['id'] ?? ''),
            'type' => $this->popupTypeLabel((string) ($entry['type'] ?? '')),
            'start_at' => (string) ($entry['start_at'] ?? ''),
            'end_at' => (string) ($entry['end_at'] ?? ''),
        ];
    }

    private function payMember(int $orderId): string
    {
        $stmt = $this->pdo->prepare(
            'SELECT o.user_id, o.deleted_display_name, u.email
             FROM provider_payment_orders o
             LEFT JOIN users u ON u.id = o.user_id
             WHERE o.id = ? LIMIT 1'
        );
        $stmt->execute([$orderId]);
        $row = $stmt->fetch();
        if (!is_array($row)) {
            return '삭제된 회원';
        }
        $email = trim((string) ($row['email'] ?? ''));
        if ($email !== '' && $row['user_id'] !== null) {
            return $email;
        }
        $display = trim((string) ($row['deleted_display_name'] ?? ''));

        return trim($display . ' 삭제된 회원');
    }

    private function regName(string $role, int $id): string
    {
        if ($role === 'student') {
            $stmt = $this->pdo->prepare('SELECT public_display_name FROM students WHERE id = ? LIMIT 1');
            $stmt->execute([$id]);
            $name = trim((string) $stmt->fetchColumn());

            return $name !== '' ? $name : ('학생 #' . $id);
        }
        if ($role === 'study_room') {
            $stmt = $this->pdo->prepare('SELECT study_room_name FROM study_rooms WHERE id = ? LIMIT 1');
            $stmt->execute([$id]);
            $name = trim((string) $stmt->fetchColumn());

            return $name !== '' ? $name : ('공부방 #' . $id);
        }
        $stmt = $this->pdo->prepare('SELECT tutor_display_name FROM tutors WHERE id = ? LIMIT 1');
        $stmt->execute([$id]);
        $name = trim((string) $stmt->fetchColumn());

        return $name !== '' ? $name : ('과외쌤 #' . $id);
    }

    private function maskedUser(int $userId): string
    {
        $stmt = $this->pdo->prepare('SELECT real_name FROM user_profiles WHERE user_id = ? LIMIT 1');
        $stmt->execute([$userId]);
        $name = $stmt->fetchColumn();

        return AccountWithdrawService::maskDisplayName(is_string($name) ? $name : '');
    }

    private function roleLabel(string $role): string
    {
        return match ($role) {
            'study_room', 'study_room_owner' => '공부방',
            'tutor' => '과외쌤',
            'student', 'guardian_student' => '학생',
            'unknown' => '역할 미확인',
            default => $role === '' ? '역할 미확인' : $role,
        };
    }

    private function ticketRole(string $role): string
    {
        return match ($role) {
            'guest' => '비회원',
            'parent' => '학생',
            'study_room' => '공부방',
            'tutor' => '과외쌤',
            default => '역할 미확인',
        };
    }

    private function popupTypeLabel(string $type): string
    {
        return match ($type) {
            'notice' => '공지',
            'event' => '이벤트',
            'ad' => '광고',
            default => $type,
        };
    }

    private function categoryLabel(string $category): string
    {
        return match ($category) {
            'bug' => '오류·장애',
            'policy' => '정책·이용 문의',
            'account' => '계정·로그인',
            default => '기타',
        };
    }

    private function ticketStatus(string $status): string
    {
        return match ($status) {
            'open' => '접수',
            'in_progress' => '확인 중',
            'closed' => '종료',
            default => $status,
        };
    }

    private function reportStatus(string $status): string
    {
        return match ($status) {
            'open' => '접수',
            'protect' => '임시 보호',
            'resolved' => '조치 완료',
            'dismissed' => '종결',
            default => $status,
        };
    }

    private function linkFor(string $line): string
    {
        return match ($line) {
            'pay' => '/admin/commerce',
            'inquiry' => '/admin/tickets',
            'report' => '/admin/reports',
            'popup' => '/admin/settings/popups',
            default => '/admin/members',
        };
    }
}
