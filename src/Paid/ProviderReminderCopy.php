<?php

declare(strict_types=1);

namespace Study114\Paid;

/** 18b§4 · 22§7-1 — 노출 흐름 톤 */
final class ProviderReminderCopy
{
    /**
     * @param array<string, mixed> $ctx
     * @return array{title: string, body: string, email_subject: string, sms: string, action_href: string}
     */
    public function build(string $kind, array $ctx): array
    {
        $paidUrl = (string) ($ctx['paid_url'] ?? '#/mypage/paid');
        $days = (int) ($ctx['days_left'] ?? 0);
        $sku = strtoupper((string) ($ctx['sku'] ?? 'Prime/Pick'));
        $ticketLabel = (string) ($ctx['ticket_label'] ?? '횟수권');
        $remaining = (int) ($ctx['remaining'] ?? 0);
        $expiryDate = (string) ($ctx['expiry_date'] ?? '');

        return match (true) {
            str_starts_with($kind, 'position_expiry_') => [
                'title' => "{$sku} 노출이 {$days}일 후 마무리됩니다",
                'body' => "유료 노출 기간이 곧 끝납니다. 기간이 끝나면 Basic으로 돌아가며 프로필은 유지됩니다. 같은 조건으로 연장하거나 다른 방식을 선택할 수 있어요.",
                'email_subject' => "[우동공과] {$sku} 노출 D-{$days}",
                'sms' => "[우동공과] {$sku} 노출이 {$days}일 남았습니다. 연장·안내: {$paidUrl}",
                'action_href' => '/mypage/paid',
            ],
            str_starts_with($kind, 'ticket_pack_expiry_') => [
                'title' => "{$ticketLabel} 사용 기한이 {$days}일 남았습니다",
                'body' => "잔여 {$remaining}회 · {$expiryDate}까지 사용 가능합니다. 기한 내 미사용 시 소멸됩니다.",
                'email_subject' => "[우동공과] {$ticketLabel} 사용 기한 D-{$days}",
                'sms' => "[우동공과] {$ticketLabel} D-{$days} · 잔여{$remaining}회",
                'action_href' => '/mypage/paid',
            ],
            str_ends_with($kind, '_remaining_1') => [
                'title' => "{$ticketLabel} 1회 남았습니다",
                'body' => "선제 쪽지·요청문 열람 등에 사용할 수 있는 {$ticketLabel}이 1회 남았습니다. 필요 시 추가 구매를 검토해 주세요.",
                'email_subject' => "[우동공과] {$ticketLabel} 1회 남음",
                'sms' => "[우동공과] {$ticketLabel} 1회 남음 · {$paidUrl}",
                'action_href' => '/mypage/paid',
            ],
            str_ends_with($kind, '_depleted_0') => [
                'title' => "{$ticketLabel}을(를) 모두 사용했습니다",
                'body' => "{$ticketLabel} 잔여가 0회입니다. 선제 쪽지·paid_only 요청문 열람 등은 추가 구매 후 이용할 수 있습니다.",
                'email_subject' => "[우동공과] {$ticketLabel} 소진 안내",
                'sms' => "[우동공과] {$ticketLabel} 소진 · {$paidUrl}",
                'action_href' => '/mypage/paid',
            ],
            default => [
                'title' => '유료 서비스 안내',
                'body' => '마이페이지에서 이용 현황을 확인해 주세요.',
                'email_subject' => '[우동공과] 유료 서비스 안내',
                'sms' => '[우동공과] 유료 서비스 안내',
                'action_href' => '/mypage/paid',
            ],
        };
    }

    public function ticketLabel(string $ticketType): string
    {
        return $ticketType === 'request_view' ? '요청문 열람권' : '쪽지권';
    }
}
