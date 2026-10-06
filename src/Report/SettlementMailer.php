<?php

declare(strict_types=1);

namespace Study114\Report;

use Study114\Mail\MailAddressMasker;
use Study114\Mail\MailMessageSanitizer;
use Study114\Mail\MailSendResult;
use Study114\Mail\MailTransportFactory;

final class SettlementMailer
{
    /** @param array<string, mixed> $config */
    public function __construct(private array $config)
    {
    }

    /** @param array<string, mixed> $row @return list<string> */
    public static function lines(array $row): array
    {
        $won = static fn (int $n): string => number_format($n);
        $unknown = (int) ($row['pay_unknown_count'] ?? 0) > 0
            ? sprintf(
                ' · 역할 미확인 %s건 %s원',
                $won((int) $row['pay_unknown_count']),
                $won((int) $row['pay_unknown_amount_won'])
            )
            : '';
        $pay = sprintf(
            '① 결제 %s건 %s원 (공부방 %s건 %s원 · 과외쌤 %s건 %s원 · 학생 %s건 %s원%s)',
            $won((int) $row['pay_count']),
            $won((int) $row['pay_amount_won']),
            $won((int) $row['pay_study_room_count']),
            $won((int) $row['pay_study_room_amount_won']),
            $won((int) $row['pay_tutor_count']),
            $won((int) $row['pay_tutor_amount_won']),
            $won((int) $row['pay_student_count']),
            $won((int) $row['pay_student_amount_won']),
            $unknown
        );
        $kind = (string) ($row['period_kind'] ?? 'day');
        if ($row['inquiry_count'] === null || $row['report_count'] === null) {
            $queue = '② 이 날은 그때 기록이 남아 있지 않아요.';
        } elseif ($kind === 'day') {
            $queue = sprintf('② 남은 응대 문의 %d · 신고 %d', (int) $row['inquiry_count'], (int) $row['report_count']);
        } else {
            $queue = sprintf('② 새 응대 문의 %d · 신고 %d', (int) $row['inquiry_count'], (int) $row['report_count']);
        }
        $reg = sprintf(
            '③ 등록 공부방 %d · 과외쌤 %d · 학생 %d',
            (int) $row['reg_study_room_count'],
            (int) $row['reg_tutor_count'],
            (int) $row['reg_student_count']
        );
        $deleteUnknown = (int) ($row['delete_unknown_count'] ?? 0) > 0
            ? sprintf(' · 역할 미확인 %d', (int) $row['delete_unknown_count'])
            : '';
        $leave = sprintf(
            '④ 탈퇴 공부방 %d · 과외쌤 %d · 학생 %d / 관리자 삭제 공부방 %d · 과외쌤 %d · 학생 %d%s',
            (int) $row['withdraw_study_room_count'],
            (int) $row['withdraw_tutor_count'],
            (int) $row['withdraw_student_count'],
            (int) $row['delete_study_room_count'],
            (int) $row['delete_tutor_count'],
            (int) $row['delete_student_count'],
            $deleteUnknown
        );
        if ($row['home_popup_count'] === null) {
            $popup = '⑤ 이 날은 그때 기록이 남아 있지 않아요.';
        } elseif ($kind === 'day') {
            $popup = sprintf('⑤ 홈 팝업 %d개', (int) $row['home_popup_count']);
        } else {
            $popup = sprintf('⑤ 기간 마지막 홈 팝업 %d개', (int) $row['home_popup_count']);
        }

        return [$pay, $queue, $reg, $leave, $popup];
    }

    /** @param array<string, mixed> $row */
    public static function subject(array $row): string
    {
        $kind = (string) $row['period_kind'];
        $start = (string) $row['period_start'];
        $end = (string) $row['period_end'];
        if ($kind === 'week') {
            return '[우동공과] 주간 보고서 ' . $start . ' ~ ' . $end;
        }
        if ($kind === 'month') {
            return '[우동공과] 월간 보고서 ' . substr($start, 0, 7);
        }

        return '[우동공과] 일간 보고서 ' . $start;
    }

    /** @param array<string, mixed> $row */
    public static function printTitle(array $row): string
    {
        $kind = (string) $row['period_kind'];
        $start = (string) $row['period_start'];
        $end = (string) $row['period_end'];
        if ($kind === 'week') {
            return '주간 보고서 ' . $start . ' ~ ' . $end;
        }
        if ($kind === 'month') {
            return '월간 보고서 ' . substr($start, 0, 7);
        }

        return '일일정산서 ' . $start;
    }

    /** @param array<string, mixed> $row */
    public function body(array $row): string
    {
        $lines = implode("\n", self::lines($row));
        $home = rtrim((string) ($this->config['home_ui'] ?? ''), '/');
        $link = $home . '/#/admin/settlement?period=' . rawurlencode((string) $row['period_kind'])
            . '&date=' . rawurlencode((string) $row['period_start']);

        return $lines . "\n\n" . $link;
    }

    /** @param list<string> $recipients */
    public function send(array $row, array $recipients): MailSendResult
    {
        $from = trim((string) ($this->config['mail_from'] ?? ''));
        if (!$this->isAllowedFrom($from)) {
            return MailSendResult::failure('from_rejected', 'From address is not allowed');
        }
        if ($recipients === []) {
            return MailSendResult::failure('no_recipient', 'No recipient');
        }
        $transport = MailTransportFactory::create($this->config);
        $subject = self::subject($row);
        $body = $this->body($row);
        $last = MailSendResult::failure('no_recipient', 'No recipient');
        foreach ($recipients as $to) {
            $to = trim($to);
            if ($to === '' || filter_var($to, FILTER_VALIDATE_EMAIL) === false) {
                continue;
            }
            error_log('[settlement-mail] to=' . MailAddressMasker::mask($to) . ' subject_len=' . strlen($subject));
            $last = $transport->send([
                'to' => $to,
                'subject' => $subject,
                'body' => $body,
                'html_body' => null,
                'from_email' => $from,
                'from_header' => $this->fromHeader($from),
            ]);
            if (!$last->ok) {
                return $last;
            }
        }

        return $last;
    }

    /** @return list<string> */
    public function recipients(): array
    {
        $raw = '';
        if (function_exists('study114_env')) {
            $raw = trim(study114_env('STUDY114_REPORT_MAIL_TO', ''));
        }
        if ($raw !== '') {
            $out = [];
            foreach (explode(',', $raw) as $part) {
                $email = trim($part);
                if ($email !== '' && filter_var($email, FILTER_VALIDATE_EMAIL) !== false) {
                    $out[] = $email;
                }
            }

            return $out;
        }
        try {
            $stmt = \Study114\Database\Connection::get()->query(
                "SELECT email FROM users WHERE admin_level = 'super_admin' AND status = 'active' ORDER BY id"
            );
        } catch (\Throwable) {
            return [];
        }
        $out = [];
        foreach ($stmt->fetchAll() as $row) {
            $email = trim((string) ($row['email'] ?? ''));
            if ($email !== '') {
                $out[] = $email;
            }
        }

        return $out;
    }

    private function isAllowedFrom(string $fromEmail): bool
    {
        if ($fromEmail === '' || !filter_var($fromEmail, FILTER_VALIDATE_EMAIL)) {
            return false;
        }
        $lower = strtolower($fromEmail);
        if (str_ends_with($lower, '@study114.net')) {
            return true;
        }
        $transport = strtolower((string) ($this->config['mail_transport'] ?? 'resend'));
        if (in_array($transport, ['fake', 'disabled', 'off', 'none'], true)
            && str_ends_with($lower, '@study114.local')) {
            return true;
        }

        return false;
    }

    private function fromHeader(string $fromEmail): string
    {
        $name = MailMessageSanitizer::encodeHeader('우동공과');

        return $name . ' <' . $fromEmail . '>';
    }
}
