<?php

declare(strict_types=1);

require_once dirname(__DIR__) . '/src/bootstrap.php';

use Study114\Auth\PhoneIdentityService;

$failed = 0;

function check(bool $cond, string $msg): void
{
    global $failed;
    if (!$cond) {
        $failed += 1;
        fwrite(STDERR, "FAIL: {$msg}\n");
        return;
    }
    fwrite(STDOUT, "PASS: {$msg}\n");
}

$provider = ['role_type' => 'tutor'];
$studyRoom = ['role_type' => 'study_room_owner'];
$student = ['role_type' => 'guardian_student'];
$verified = [
    'phone' => '01012345678',
    'phone_identity_verified_at' => '2026-09-22 00:00:00',
    'phone_identity_phone' => '010-1234-5678',
    'phone_identity_method' => 'niceid',
    'phone_identity_tx_id' => 'vendor-tx-1001',
    'phone_verified_at' => '2026-01-01 00:00:00',
    'phone_verified_method' => 'sms_otp',
];
$otherPhone = $verified;
$otherPhone['phone'] = '01099998888';
$smsOnly = [
    'phone' => '01012345678',
    'phone_verified_at' => '2026-09-22 00:00:00',
    'phone_verified_phone' => '01012345678',
    'phone_verified_method' => 'sms_otp',
];

check(PhoneIdentityService::isProviderRole('tutor'), 'tutor is provider');
check(PhoneIdentityService::isProviderRole('study_room_owner'), 'study room is provider');
check(!PhoneIdentityService::isProviderRole('guardian_student'), 'student is not provider');

foreach (['off', 'warn', 'required'] as $mode) {
    check(
        PhoneIdentityService::canEnterProviderBasicRegistrationNow($provider, null, $mode),
        "provider {$mode} incomplete can enter basic",
    );
    check(
        PhoneIdentityService::canEnterProviderBasicRegistrationNow($student, null, $mode),
        "student {$mode} can enter basic",
    );
}
check(
    PhoneIdentityService::canEnterProviderBasicRegistrationNow($studyRoom, $otherPhone, 'required'),
    'study room required mismatched phone can still enter basic',
);

check(PhoneIdentityService::isPhoneIdentityVerified($verified), 'same phone identity is verified');
check(!PhoneIdentityService::isPhoneIdentityVerified($otherPhone), 'different phone is not verified');
check(!PhoneIdentityService::isPhoneIdentityVerified($smsOnly), 'sms_otp alone is not identity');
check(!PhoneIdentityService::needsProviderPhoneIdentity($provider, null, 'off'), 'off does not need guidance');
check(PhoneIdentityService::needsProviderPhoneIdentity($provider, null, 'warn'), 'warn needs guidance only');
check(!PhoneIdentityService::needsProviderPhoneIdentity($student, null, 'warn'), 'student warn is not in scope');
check(!PhoneIdentityService::needsProviderPhoneIdentity($provider, $verified, 'warn'), 'verified provider does not need again');

if ($failed > 0) {
    fwrite(STDERR, "CUR-007 phone identity policy FAILED ({$failed})\n");
    exit(1);
}

fwrite(STDOUT, "CUR-007 phone identity policy OK\n");
