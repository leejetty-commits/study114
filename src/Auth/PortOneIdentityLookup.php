<?php

declare(strict_types=1);

namespace Study114\Auth;

/**
 * 365 — 포트원 본인인증 단건 조회 계약 (테스트 더블 주입용).
 */
interface PortOneIdentityLookup
{
    /**
     * @return array<string, mixed>
     */
    public function getIdentityVerification(string $identityVerificationId): array;
}
