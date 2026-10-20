<?php

declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/src/bootstrap.php';

use Study114\Database\Connection;
use Study114\Paid\PaidApi;
use Study114\Paid\TierRequirement;

PaidApi::bootstrap();

PaidApi::run(static function (): void {
    $auth = PaidApi::requireProvider();
    $userId = (int) $auth['user_id'];

    if (PaidApi::method() !== 'GET') {
        PaidApi::fail(405, 'method_not_allowed', 'GET만 허용됩니다.');
    }

    $providerType = trim((string) ($_GET['provider_type'] ?? ''));
    $providerId = PaidApi::queryInt('provider_id', 0);
    if (($providerType !== 'tutor' && $providerType !== 'study_room') || $providerId <= 0) {
        PaidApi::fail(403, 'forbidden', '본인 프로필만 확인할 수 있습니다.');
    }

    $pdo = Connection::get();
    if ($providerType === 'tutor') {
        $stmt = $pdo->prepare('SELECT user_id FROM tutors WHERE id = ? LIMIT 1');
    } else {
        $stmt = $pdo->prepare('SELECT user_id FROM study_rooms WHERE id = ? AND deleted_at IS NULL LIMIT 1');
    }
    $stmt->execute([$providerId]);
    $ownerId = $stmt->fetchColumn();
    if ($ownerId === false || (int) $ownerId !== $userId) {
        PaidApi::fail(403, 'forbidden', '본인 프로필만 확인할 수 있습니다.');
    }

    $pickMissing = TierRequirement::missingFor($pdo, $providerType, $providerId, 'pick');
    $primeMissing = TierRequirement::missingFor($pdo, $providerType, $providerId, 'prime');
    $side = static function (array $missing, string $tier): array {
        return [
            'can_buy' => $missing === [],
            'missing' => $missing,
            'message' => $missing === [] ? '' : TierRequirement::blockMessage($tier),
        ];
    };

    PaidApi::ok([
        'provider_type' => $providerType,
        'provider_id' => $providerId,
        'pick' => $side($pickMissing, 'pick'),
        'prime' => $side($primeMissing, 'prime'),
    ]);
});
