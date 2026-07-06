<?php

declare(strict_types=1);

namespace Study114\Paid;

use Study114\Auth\AuthMailer;
use Study114\Database\Connection;

/** 18d — 만료·소진 알림 (cron + 차감 이벤트) */
final class ProviderReminderService
{
    private ProviderReminderRepository $repo;
    private ProviderReminderCopy $copy;
    private ProviderReminderChannelPolicy $policy;
    private AuthMailer $mailer;
    private SmsLogSender $sms;
    /** @var array<string, mixed> */
    private array $config;

    public function __construct(
        ?ProviderReminderRepository $repo = null,
        ?ProviderReminderCopy $copy = null,
        ?ProviderReminderChannelPolicy $policy = null,
        ?AuthMailer $mailer = null,
        ?SmsLogSender $sms = null,
    ) {
        $this->repo = $repo ?? new ProviderReminderRepository(Connection::get());
        $this->copy = $copy ?? new ProviderReminderCopy();
        $this->policy = $policy ?? new ProviderReminderChannelPolicy();
        $this->mailer = $mailer ?? new AuthMailer();
        $this->sms = $sms ?? new SmsLogSender();
        $this->config = study114_config('paid');
    }

    /** @return array{processed: int, dispatched: int} */
    public function processScheduledReminders(): array
    {
        $processed = 0;
        $dispatched = 0;

        foreach ($this->repo->listPositionExpiryCandidates([7, 3, 1]) as $row) {
            $days = (int) $row['days_left'];
            $kind = 'position_expiry_d' . $days;
            $refId = (int) $row['id'];
            $userId = (int) $row['user_id'];
            $dedupeBase = "{$userId}:{$kind}:pos{$refId}:{$days}";
            $dispatched += $this->dispatch(
                $userId,
                $kind,
                $dedupeBase,
                [
                    'sku' => (string) $row['sku_code'],
                    'days_left' => $days,
                    'paid_url' => $this->paidUrl(),
                ],
            );
            $processed++;
        }

        foreach ($this->repo->listTicketPackExpiryCandidates([30, 7]) as $row) {
            $days = (int) $row['days_left'];
            $ticketType = (string) $row['ticket_type'];
            $kind = 'ticket_pack_expiry_' . $ticketType . '_d' . $days;
            $refId = (int) $row['id'];
            $userId = (int) $row['user_id'];
            $dedupeBase = "{$userId}:{$kind}:pack{$refId}:{$days}";
            $dispatched += $this->dispatch(
                $userId,
                $kind,
                $dedupeBase,
                [
                    'ticket_label' => $this->copy->ticketLabel($ticketType),
                    'days_left' => $days,
                    'remaining' => (int) $row['remaining'],
                    'expiry_date' => $this->formatDate((string) $row['expires_at']),
                    'paid_url' => $this->paidUrl(),
                ],
            );
            $processed++;
        }

        return ['processed' => $processed, 'dispatched' => $dispatched];
    }

    public function onTicketBalance(int $userId, string $ticketType, int $remaining): void
    {
        if (!in_array($ticketType, ['memo', 'request_view'], true)) {
            return;
        }
        if ($remaining > 1) {
            return;
        }

        $label = $this->copy->ticketLabel($ticketType);
        if ($remaining === 1) {
            $kind = $ticketType . '_remaining_1';
            $dedupeBase = "{$userId}:{$kind}:balance:1";
            $this->dispatch($userId, $kind, $dedupeBase, [
                'ticket_label' => $label,
                'remaining' => 1,
                'paid_url' => $this->paidUrl(),
            ]);
            return;
        }

        $kind = $ticketType . '_depleted_0';
        $dedupeBase = "{$userId}:{$kind}:balance:0:" . date('Y-m');
        $this->dispatch($userId, $kind, $dedupeBase, [
            'ticket_label' => $label,
            'remaining' => 0,
            'paid_url' => $this->paidUrl(),
        ]);
    }

    /**
     * @param array<string, mixed> $ctx
     */
    private function dispatch(int $userId, string $kind, string $dedupeBase, array $ctx): int
    {
        $messages = $this->copy->build($kind, $ctx);
        $contact = $this->repo->getUserContact($userId);
        if ($contact === null) {
            return 0;
        }

        $sent = 0;
        foreach ($this->policy->channelsFor($kind) as $channel) {
            $dedupeKey = $dedupeBase . ':' . $channel;
            if ($this->repo->hasDispatch($dedupeKey, $channel)) {
                continue;
            }

            if ($channel === 'email') {
                $plain = $messages['body'] . "\n\n" . $this->paidUrl();
                $this->mailer->send($contact['email'], $messages['email_subject'], $plain);
            } elseif ($channel === 'sms') {
                $phone = $contact['phone'];
                if ($phone === null || $phone === '') {
                    continue;
                }
                $this->sms->send($phone, $messages['sms']);
            } elseif ($channel === 'onsite') {
                $this->repo->upsertSystemNotice(
                    $userId,
                    $kind,
                    $dedupeBase . ':onsite',
                    $messages['title'],
                    $messages['body'],
                    $messages['action_href'],
                );
            }

            $this->repo->recordDispatch($userId, $channel, $kind, $dedupeKey);
            $sent++;
        }

        return $sent;
    }

    private function paidUrl(): string
    {
        return $this->config['home_ui'] . '/#/mypage/paid';
    }

    private function formatDate(string $iso): string
    {
        $ts = strtotime($iso);

        return $ts !== false
            ? date('Y년 n월 j일', $ts)
            : $iso;
    }
}
