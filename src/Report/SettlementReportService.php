<?php

declare(strict_types=1);

namespace Study114\Report;

use DateTimeImmutable;
use Study114\Registration\BasicCardRegisteredQuery;

final class SettlementReportService
{
    private SettlementReportRepository $repo;

    private ReportPeriod $period;

    private BasicCardRegisteredQuery $cards;

    private SettlementMailer $mailer;

    public function __construct(
        ?SettlementReportRepository $repo = null,
        ?ReportPeriod $period = null,
        ?BasicCardRegisteredQuery $cards = null,
        ?SettlementMailer $mailer = null,
    ) {
        $this->period = $period ?? new ReportPeriod();
        $this->repo = $repo ?? new SettlementReportRepository();
        $this->cards = $cards ?? new BasicCardRegisteredQuery(null, $this->period);
        $this->mailer = $mailer ?? new SettlementMailer(study114_config('auth'));
    }

    /** @return array{rows_created: int, mails_sent: int, mails_skipped: int} */
    public function runAt(DateTimeImmutable $now): array
    {
        if (!$this->repo->tableExists()) {
            throw new \RuntimeException('schema_missing');
        }
        $now = $this->period->now($now);
        $created = 0;
        $yesterday = $now->modify('-1 day')->format('Y-m-d');
        if ($this->createDaily($yesterday, true, $now)) {
            $created++;
        }
        if ((int) $now->format('N') === 1) {
            $week = $this->period->weekRange($yesterday);
            $created += $this->backfillBetween($week['startDate'], $week['endDate'], $now);
            if ($this->createAggregate('week', $week, $now)) {
                $created++;
            }
        }
        if ($now->format('d') === '01') {
            $month = $this->period->monthRange($yesterday);
            $created += $this->backfillBetween($month['startDate'], $month['endDate'], $now);
            if ($this->createAggregate('month', $month, $now)) {
                $created++;
            }
        }
        $from = $now->modify('-1 day')->modify('-34 days')->format('Y-m-d');
        $created += $this->backfillBetween($from, $yesterday, $now);
        $mail = $this->dispatchMail($now);

        return [
            'rows_created' => $created,
            'mails_sent' => $mail['sent'],
            'mails_skipped' => $mail['skipped'],
        ];
    }

    /** @return array<string, mixed> */
    public function readReport(string $kind, ?string $date, DateTimeImmutable $now): array
    {
        if (!$this->repo->tableExists()) {
            throw new \RuntimeException('schema_missing');
        }
        $now = $this->period->now($now);
        $ymd = ($date === null || $date === '') ? $this->period->defaultStart($kind, $now) : $date;
        $range = $this->period->rangeFor($kind, $ymd);
        if ($this->period->isOpen($kind, $range['startDate'], $now)) {
            return [
                'state' => 'in_progress',
                'period' => $kind,
                'date' => $range['startDate'],
                'report' => null,
            ];
        }
        $row = $this->repo->find($kind, $range['startDate']);
        if ($row === null) {
            return [
                'state' => 'missing',
                'period' => $kind,
                'date' => $range['startDate'],
                'report' => null,
            ];
        }

        return [
            'state' => 'ready',
            'period' => $kind,
            'date' => $range['startDate'],
            'report' => $this->publicReport($row),
        ];
    }

    /** @return array<string, mixed> */
    public function readLines(string $kind, string $date, string $line, int $page, DateTimeImmutable $now): array
    {
        if (!$this->repo->tableExists()) {
            throw new \RuntimeException('schema_missing');
        }
        $range = $this->period->rangeFor($kind, $date);
        $row = $this->repo->find($kind, $range['startDate']);
        if ($row === null) {
            return [
                'line' => $line,
                'page' => 1,
                'per_page' => 50,
                'total' => 0,
                'items' => [],
                'link' => '/admin/members',
            ];
        }

        return (new SettlementLinesQuery($this->repo->pdo()))->page($row, $line, $page);
    }

    /**
     * @return array{roles: list<string>, unknown: bool}
     */
    public static function parseDeleteRoles(?string $memo): array
    {
        $memo = (string) $memo;
        if (preg_match('/역할 (.+?)(?=공부방 \d+ · 과외쌤 \d+ · 학생 \d+)/u', $memo, $match) !== 1) {
            return ['roles' => [], 'unknown' => true];
        }
        $parts = preg_split('/ · /u', $match[1]) ?: [];
        $roles = [];
        foreach ($parts as $part) {
            $part = trim($part);
            if ($part === '' || $part === '운영자' || $part === '역할 없음') {
                continue;
            }
            if (in_array($part, ['학생', '공부방', '과외쌤'], true)) {
                $roles[] = $part;
            }
        }

        return ['roles' => $roles, 'unknown' => false];
    }

    /** @param array{start: DateTimeImmutable, end: DateTimeImmutable, startDate: string, endDate: string} $range */
    private function createAggregate(string $kind, array $range, DateTimeImmutable $now): bool
    {
        if ($this->repo->find($kind, $range['startDate']) !== null) {
            return false;
        }
        $days = $this->repo->listDays($range['startDate'], $range['endDate']);
        $sumKeys = [
            'pay_count', 'pay_amount_won',
            'pay_study_room_count', 'pay_study_room_amount_won',
            'pay_tutor_count', 'pay_tutor_amount_won',
            'pay_student_count', 'pay_student_amount_won',
            'pay_unknown_count', 'pay_unknown_amount_won',
            'reg_study_room_count', 'reg_tutor_count', 'reg_student_count',
            'withdraw_total', 'withdraw_study_room_count', 'withdraw_tutor_count', 'withdraw_student_count',
            'delete_total', 'delete_study_room_count', 'delete_tutor_count', 'delete_student_count', 'delete_unknown_count',
        ];
        $sums = array_fill_keys($sumKeys, 0);
        $pay = [];
        $reg = [];
        $withdraw = [];
        $delete = [];
        foreach ($days as $day) {
            foreach ($sumKeys as $key) {
                $sums[$key] += (int) $day[$key];
            }
            $snap = is_array($day['snapshot_json'] ?? null) ? $day['snapshot_json'] : [];
            foreach (is_array($snap['pay'] ?? null) ? $snap['pay'] : [] as $item) {
                $pay[] = $item;
            }
            foreach (is_array($snap['reg'] ?? null) ? $snap['reg'] : [] as $item) {
                $reg[] = $item;
            }
            foreach (is_array($snap['withdraw'] ?? null) ? $snap['withdraw'] : [] as $item) {
                $withdraw[] = $item;
            }
            foreach (is_array($snap['delete'] ?? null) ? $snap['delete'] : [] as $item) {
                $delete[] = $item;
            }
        }
        $queue = $this->collectQueue($range['start'], $range['end'], false);
        $popups = $this->collectPopups($now);
        $row = array_merge($sums, [
            'period_kind' => $kind,
            'period_start' => $range['startDate'],
            'period_end' => $range['endDate'],
            'inquiry_count' => $queue['inquiry_count'],
            'report_count' => $queue['report_count'],
            'home_popup_count' => $popups['count'],
            'is_backfill' => 0,
            'mail_status' => 'pending',
            'snapshot_json' => [
                'tz' => $this->period->measuredTz(),
                'pay' => $pay,
                'inquiry' => $queue['inquiry'],
                'report' => $queue['report'],
                'reg' => $reg,
                'withdraw' => $withdraw,
                'delete' => $delete,
                'popup' => $popups['items'],
            ],
        ]);

        return $this->repo->insertIfAbsent($row);
    }

    private function createDaily(string $ymd, bool $live, DateTimeImmutable $now): bool
    {
        $range = $this->period->dayRange($ymd);
        if ($this->repo->find('day', $range['startDate']) !== null) {
            return false;
        }
        $pay = $this->collectPay($range['start'], $range['end']);
        $reg = $this->collectReg($range['start'], $range['end']);
        $leave = $this->collectWithdraw($range['start'], $range['end']);
        $deleted = $this->collectDelete($range['start'], $range['end']);
        if ($live) {
            $queue = $this->collectQueue($range['start'], $range['end'], true);
            $popups = $this->collectPopups($now);
            $inquiryCount = $queue['inquiry_count'];
            $reportCount = $queue['report_count'];
            $popupCount = $popups['count'];
            $inquiry = $queue['inquiry'];
            $reports = $queue['report'];
            $popupItems = $popups['items'];
            $backfill = 0;
            $mail = 'pending';
        } else {
            $inquiryCount = null;
            $reportCount = null;
            $popupCount = null;
            $inquiry = [];
            $reports = [];
            $popupItems = [];
            $backfill = 1;
            $mail = 'skipped';
        }
        $row = [
            'period_kind' => 'day',
            'period_start' => $range['startDate'],
            'period_end' => $range['endDate'],
            'pay_count' => $pay['count'],
            'pay_amount_won' => $pay['amount'],
            'pay_study_room_count' => $pay['study_room_count'],
            'pay_study_room_amount_won' => $pay['study_room_amount'],
            'pay_tutor_count' => $pay['tutor_count'],
            'pay_tutor_amount_won' => $pay['tutor_amount'],
            'pay_student_count' => 0,
            'pay_student_amount_won' => 0,
            'pay_unknown_count' => $pay['unknown_count'],
            'pay_unknown_amount_won' => $pay['unknown_amount'],
            'inquiry_count' => $inquiryCount,
            'report_count' => $reportCount,
            'reg_study_room_count' => $reg['study_room'],
            'reg_tutor_count' => $reg['tutor'],
            'reg_student_count' => $reg['student'],
            'withdraw_total' => $leave['total'],
            'withdraw_study_room_count' => $leave['study_room'],
            'withdraw_tutor_count' => $leave['tutor'],
            'withdraw_student_count' => $leave['student'],
            'delete_total' => $deleted['total'],
            'delete_study_room_count' => $deleted['study_room'],
            'delete_tutor_count' => $deleted['tutor'],
            'delete_student_count' => $deleted['student'],
            'delete_unknown_count' => $deleted['unknown'],
            'home_popup_count' => $popupCount,
            'is_backfill' => $backfill,
            'mail_status' => $mail,
            'snapshot_json' => [
                'tz' => $this->period->measuredTz(),
                'pay' => $pay['items'],
                'inquiry' => $inquiry,
                'report' => $reports,
                'reg' => $reg['items'],
                'withdraw' => $leave['items'],
                'delete' => $deleted['items'],
                'popup' => $popupItems,
            ],
        ];

        return $this->repo->insertIfAbsent($row);
    }

    private function backfillBetween(string $startDate, string $endDate, DateTimeImmutable $now): int
    {
        $created = 0;
        $cursor = new DateTimeImmutable($startDate . ' 00:00:00', $this->period->tz());
        $end = new DateTimeImmutable($endDate . ' 00:00:00', $this->period->tz());
        $yesterday = $now->setTimezone($this->period->tz())->modify('-1 day')->format('Y-m-d');
        while ($cursor <= $end) {
            $ymd = $cursor->format('Y-m-d');
            if ($ymd <= $yesterday && $this->createDaily($ymd, false, $now)) {
                $created++;
            }
            $cursor = $cursor->modify('+1 day');
        }

        return $created;
    }

    /** @return array{sent: int, skipped: int} */
    private function dispatchMail(DateTimeImmutable $now): array
    {
        $sent = 0;
        $skipped = 0;
        foreach ($this->repo->listStaleSending() as $row) {
            if ($this->period->inMailWindow($now, (string) $row['period_end'])) {
                $this->repo->markSendingFailed((int) $row['id'], 'claim_stale');
            } else {
                $this->repo->markSkipped((int) $row['id'], 'window_passed');
                $skipped++;
            }
        }
        $rows = $this->repo->listMailCandidates();
        usort($rows, static function (array $a, array $b): int {
            $order = ['day' => 0, 'week' => 1, 'month' => 2];
            $c = ($order[$a['period_kind']] ?? 9) <=> ($order[$b['period_kind']] ?? 9);
            if ($c !== 0) {
                return $c;
            }

            return strcmp((string) $a['period_start'], (string) $b['period_start']);
        });
        foreach ($rows as $row) {
            if (!$this->period->inMailWindow($now, (string) $row['period_end'])) {
                $this->repo->markSkipped((int) $row['id'], 'window_passed');
                $skipped++;
                continue;
            }
            if (!$this->repo->claimMail((int) $row['id'])) {
                continue;
            }
            $recipients = $this->mailer->recipients();
            if ($recipients === []) {
                $this->repo->markFailed((int) $row['id'], 'no_recipient');
                continue;
            }
            try {
                $result = $this->mailer->send($row, $recipients);
            } catch (\Throwable) {
                $this->repo->markFailed((int) $row['id'], 'send_exception');
                continue;
            }
            if ($result->ok) {
                $this->repo->markSent((int) $row['id']);
                $sent++;
            } else {
                $code = $result->code !== '' ? $result->code : 'send_failed';
                $this->repo->markFailed((int) $row['id'], $code);
            }
        }

        return ['sent' => $sent, 'skipped' => $skipped];
    }

    /** @return array<string, mixed> */
    private function collectPay(DateTimeImmutable $start, DateTimeImmutable $end): array
    {
        $pdo = $this->repo->pdo();
        $stmt = $pdo->prepare(
            'SELECT id, paid_at, variant_label, amount_won, provider_type, user_id
             FROM provider_payment_orders
             WHERE status = \'paid\' AND paid_at >= ? AND paid_at < ?
             ORDER BY paid_at, id'
        );
        $stmt->execute([
            $this->period->toStorage($start, 'db'),
            $this->period->toStorage($end, 'db'),
        ]);
        $rows = $stmt->fetchAll();
        $userIds = [];
        foreach ($rows as $row) {
            if (($row['provider_type'] ?? null) === null && $row['user_id'] !== null) {
                $userIds[] = (int) $row['user_id'];
            }
        }
        $rolesByUser = $this->rolesForUsers($userIds);
        $out = [
            'count' => 0,
            'amount' => 0,
            'study_room_count' => 0,
            'study_room_amount' => 0,
            'tutor_count' => 0,
            'tutor_amount' => 0,
            'unknown_count' => 0,
            'unknown_amount' => 0,
            'items' => [],
        ];
        foreach ($rows as $row) {
            $amount = (int) $row['amount_won'];
            $role = $this->payRole(
                $row['provider_type'] !== null ? (string) $row['provider_type'] : null,
                $rolesByUser[(int) ($row['user_id'] ?? 0)] ?? []
            );
            $out['count']++;
            $out['amount'] += $amount;
            if ($role === 'study_room') {
                $out['study_room_count']++;
                $out['study_room_amount'] += $amount;
            } elseif ($role === 'tutor') {
                $out['tutor_count']++;
                $out['tutor_amount'] += $amount;
            } else {
                $out['unknown_count']++;
                $out['unknown_amount'] += $amount;
            }
            $out['items'][] = [
                'id' => (int) $row['id'],
                'paid_at' => (string) $row['paid_at'],
                'role' => $role,
                'variant_label' => (string) $row['variant_label'],
                'amount_won' => $amount,
            ];
        }

        return $out;
    }

    /** @param list<int> $userIds @return array<int, list<string>> */
    private function rolesForUsers(array $userIds): array
    {
        $userIds = array_values(array_unique(array_filter($userIds)));
        if ($userIds === []) {
            return [];
        }
        $place = implode(',', array_fill(0, count($userIds), '?'));
        $stmt = $this->repo->pdo()->prepare(
            "SELECT user_id, role_type FROM user_roles WHERE status = 'active' AND user_id IN ($place)"
        );
        $stmt->execute($userIds);
        $map = [];
        foreach ($stmt->fetchAll() as $row) {
            $map[(int) $row['user_id']][] = (string) $row['role_type'];
        }

        return $map;
    }

    /** @param list<string> $roleTypes */
    private function payRole(?string $providerType, array $roleTypes): string
    {
        if ($providerType === 'study_room' || $providerType === 'tutor') {
            return $providerType;
        }
        $hits = array_values(array_intersect($roleTypes, ['study_room_owner', 'tutor']));
        if (count($hits) === 1) {
            return $hits[0] === 'study_room_owner' ? 'study_room' : 'tutor';
        }

        return 'unknown';
    }

    /** @return array{inquiry_count: int, report_count: int, inquiry: list<array<string, mixed>>, report: list<array<string, mixed>>} */
    private function collectQueue(DateTimeImmutable $start, DateTimeImmutable $end, bool $openSnapshot): array
    {
        $pdo = $this->repo->pdo();
        if ($openSnapshot) {
            $tickets = $pdo->query(
                "SELECT id, ticket_no, status, category, role_type, created_at
                 FROM support_tickets WHERE status IN ('open', 'in_progress') ORDER BY id"
            )->fetchAll();
            $reports = $pdo->query(
                "SELECT id, report_key, status, kind, target_type, target_id, target_label, created_at
                 FROM admin_reports WHERE status IN ('open', 'protect') ORDER BY id"
            )->fetchAll();
        } else {
            $bounds = [$this->period->toStorage($start, 'db'), $this->period->toStorage($end, 'db')];
            $stmt = $pdo->prepare(
                'SELECT id, ticket_no, status, category, role_type, created_at
                 FROM support_tickets WHERE created_at >= ? AND created_at < ? ORDER BY id'
            );
            $stmt->execute($bounds);
            $tickets = $stmt->fetchAll();
            $stmt = $pdo->prepare(
                'SELECT id, report_key, status, kind, target_type, target_id, target_label, created_at
                 FROM admin_reports WHERE created_at >= ? AND created_at < ? ORDER BY id'
            );
            $stmt->execute($bounds);
            $reports = $stmt->fetchAll();
        }
        $inquiry = [];
        foreach ($tickets as $row) {
            $inquiry[] = [
                'id' => (int) $row['id'],
                'ticket_no' => (string) $row['ticket_no'],
                'status' => (string) $row['status'],
                'category' => (string) $row['category'],
                'role_type' => (string) $row['role_type'],
                'created_at' => (string) $row['created_at'],
            ];
        }
        $reportItems = [];
        foreach ($reports as $row) {
            $target = trim((string) ($row['target_label'] ?? ''));
            if ($target === '') {
                $target = (string) $row['target_type'] . ' ' . (string) $row['target_id'];
            }
            $reportItems[] = [
                'id' => (int) $row['id'],
                'report_key' => (string) $row['report_key'],
                'status' => (string) $row['status'],
                'kind' => (string) $row['kind'],
                'target' => $target,
                'created_at' => (string) $row['created_at'],
            ];
        }

        return [
            'inquiry_count' => count($inquiry),
            'report_count' => count($reportItems),
            'inquiry' => $inquiry,
            'report' => $reportItems,
        ];
    }

    /** @return array{study_room: int, tutor: int, student: int, items: list<array<string, mixed>>} */
    private function collectReg(DateTimeImmutable $start, DateTimeImmutable $end): array
    {
        $counts = $this->cards->countByRole($start, $end, true);
        $items = [];
        foreach (['study_room', 'tutor', 'student'] as $role) {
            $page = 1;
            $got = 0;
            do {
                $listed = $this->cards->listByRole($role, $start, $end, true, $page, 500);
                foreach ($listed['items'] as $item) {
                    $items[] = [
                        'role' => $role,
                        'id' => (int) $item['id'],
                        'registered_at' => (string) $item['registered_at'],
                    ];
                    $got++;
                }
                $page++;
            } while ($got < $listed['total'] && $listed['items'] !== []);
        }

        return [
            'study_room' => $counts['study_room'],
            'tutor' => $counts['tutor'],
            'student' => $counts['student'],
            'items' => $items,
        ];
    }

    /** @return array{total: int, study_room: int, tutor: int, student: int, items: list<array<string, mixed>>} */
    private function collectWithdraw(DateTimeImmutable $start, DateTimeImmutable $end): array
    {
        $stmt = $this->repo->pdo()->prepare(
            "SELECT id, deleted_at FROM users
             WHERE status = 'withdrawn' AND deleted_at IS NOT NULL AND deleted_at >= ? AND deleted_at < ?
             ORDER BY deleted_at, id"
        );
        $stmt->execute([
            $this->period->toStorage($start, 'php'),
            $this->period->toStorage($end, 'php'),
        ]);
        $rows = $stmt->fetchAll();
        $ids = array_map(static fn (array $row): int => (int) $row['id'], $rows);
        $rolesByUser = $this->rolesForUsers($ids);
        $out = ['total' => 0, 'study_room' => 0, 'tutor' => 0, 'student' => 0, 'items' => []];
        foreach ($rows as $row) {
            $out['total']++;
            $labels = [];
            foreach ($rolesByUser[(int) $row['id']] ?? [] as $role) {
                if ($role === 'study_room_owner') {
                    $out['study_room']++;
                    $labels[] = '공부방';
                } elseif ($role === 'tutor') {
                    $out['tutor']++;
                    $labels[] = '과외쌤';
                } elseif ($role === 'guardian_student') {
                    $out['student']++;
                    $labels[] = '학생';
                }
            }
            $out['items'][] = [
                'user_id' => (int) $row['id'],
                'roles' => $labels,
                'deleted_at' => (string) $row['deleted_at'],
            ];
        }

        return $out;
    }

    /** @return array{total: int, study_room: int, tutor: int, student: int, unknown: int, items: list<array<string, mixed>>} */
    private function collectDelete(DateTimeImmutable $start, DateTimeImmutable $end): array
    {
        $stmt = $this->repo->pdo()->prepare(
            "SELECT id, acted_at, target_id, detail_memo FROM admin_operation_logs
             WHERE action_kind = 'account_delete' AND target_type = 'user'
               AND acted_at >= ? AND acted_at < ?
             ORDER BY acted_at, id"
        );
        $stmt->execute([
            $this->period->toStorage($start, 'db'),
            $this->period->toStorage($end, 'db'),
        ]);
        $out = ['total' => 0, 'study_room' => 0, 'tutor' => 0, 'student' => 0, 'unknown' => 0, 'items' => []];
        foreach ($stmt->fetchAll() as $row) {
            $parsed = self::parseDeleteRoles(isset($row['detail_memo']) ? (string) $row['detail_memo'] : null);
            $out['total']++;
            if ($parsed['unknown']) {
                $out['unknown']++;
            }
            foreach ($parsed['roles'] as $label) {
                if ($label === '공부방') {
                    $out['study_room']++;
                } elseif ($label === '과외쌤') {
                    $out['tutor']++;
                } elseif ($label === '학생') {
                    $out['student']++;
                }
            }
            $out['items'][] = [
                'log_id' => (int) $row['id'],
                'target_id' => (string) $row['target_id'],
                'roles' => $parsed['roles'],
                'unknown' => $parsed['unknown'],
                'acted_at' => (string) $row['acted_at'],
            ];
        }

        return $out;
    }

    /** @return array{count: int, items: list<array<string, mixed>>} */
    private function collectPopups(DateTimeImmutable $now): array
    {
        $today = $now->setTimezone($this->period->tz())->format('Y-m-d');
        $stmt = $this->repo->pdo()->prepare(
            'SELECT id, type, start_at, end_at FROM home_popups
             WHERE published = 1
               AND (start_at IS NULL OR start_at <= ?)
               AND (end_at IS NULL OR end_at >= ?)
             ORDER BY id'
        );
        $stmt->execute([$today, $today]);
        $items = [];
        foreach ($stmt->fetchAll() as $row) {
            $items[] = [
                'id' => (int) $row['id'],
                'type' => (string) $row['type'],
                'start_at' => $row['start_at'] !== null ? (string) $row['start_at'] : '',
                'end_at' => $row['end_at'] !== null ? (string) $row['end_at'] : '',
            ];
        }

        return ['count' => count($items), 'items' => $items];
    }

    /** @param array<string, mixed> $row @return array<string, mixed> */
    private function publicReport(array $row): array
    {
        return [
            'period_kind' => (string) $row['period_kind'],
            'period_start' => (string) $row['period_start'],
            'period_end' => (string) $row['period_end'],
            'pay_count' => (int) $row['pay_count'],
            'pay_amount_won' => (int) $row['pay_amount_won'],
            'pay_study_room_count' => (int) $row['pay_study_room_count'],
            'pay_study_room_amount_won' => (int) $row['pay_study_room_amount_won'],
            'pay_tutor_count' => (int) $row['pay_tutor_count'],
            'pay_tutor_amount_won' => (int) $row['pay_tutor_amount_won'],
            'pay_student_count' => (int) $row['pay_student_count'],
            'pay_student_amount_won' => (int) $row['pay_student_amount_won'],
            'pay_unknown_count' => (int) $row['pay_unknown_count'],
            'pay_unknown_amount_won' => (int) $row['pay_unknown_amount_won'],
            'inquiry_count' => $row['inquiry_count'],
            'report_count' => $row['report_count'],
            'reg_study_room_count' => (int) $row['reg_study_room_count'],
            'reg_tutor_count' => (int) $row['reg_tutor_count'],
            'reg_student_count' => (int) $row['reg_student_count'],
            'withdraw_total' => (int) $row['withdraw_total'],
            'withdraw_study_room_count' => (int) $row['withdraw_study_room_count'],
            'withdraw_tutor_count' => (int) $row['withdraw_tutor_count'],
            'withdraw_student_count' => (int) $row['withdraw_student_count'],
            'delete_total' => (int) $row['delete_total'],
            'delete_study_room_count' => (int) $row['delete_study_room_count'],
            'delete_tutor_count' => (int) $row['delete_tutor_count'],
            'delete_student_count' => (int) $row['delete_student_count'],
            'delete_unknown_count' => (int) $row['delete_unknown_count'],
            'home_popup_count' => $row['home_popup_count'],
            'is_backfill' => (int) $row['is_backfill'],
            'mail_status' => (string) $row['mail_status'],
            'body_lines' => SettlementMailer::lines($row),
            'print_title' => SettlementMailer::printTitle($row),
        ];
    }
}
