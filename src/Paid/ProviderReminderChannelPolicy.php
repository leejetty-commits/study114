<?php

declare(strict_types=1);

namespace Study114\Paid;

/** 18§4 — 채널 분기 (메일 · 문자 · 온사이트) */
final class ProviderReminderChannelPolicy
{
    /**
     * Prime·Pick 만료 안내 메일은 MemberLifecycleMailer「마무리 3일 전」 하나뿐이다(정본 74) — 여기서 메일을 내면 두 번 간다.
     *
     * @return list<'email'|'sms'|'onsite'>
     */
    public function channelsFor(string $reminderKind): array
    {
        if (str_starts_with($reminderKind, 'position_expiry_')) {
            return ['sms', 'onsite'];
        }
        if (str_starts_with($reminderKind, 'ticket_pack_expiry_')) {
            return ['email', 'onsite'];
        }
        if (str_ends_with($reminderKind, '_remaining_1')) {
            return ['email', 'onsite'];
        }
        if (str_ends_with($reminderKind, '_depleted_0')) {
            return ['onsite'];
        }

        return ['onsite'];
    }
}
