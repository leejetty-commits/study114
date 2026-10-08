<?php

declare(strict_types=1);

/**
 * 과외쌤 기본정보 필수 서버 검사 (DB 없이 TutorBasicFields::normalizeInput 만).
 *   php scripts/verify-tutor-basic-required.php
 */

require_once dirname(__DIR__) . '/src/bootstrap.php';

use Study114\Tutor\TutorBasicFields;

$failed = 0;
$assert = static function (bool $ok, string $msg) use (&$failed): void {
    if (!$ok) {
        $failed++;
    }
    echo ($ok ? 'PASS' : 'FAIL') . "  PHP {$msg}\n";
};

$full = [
    'tutor_display_name'   => '김쌤',
    'school_level'         => 'middle',
    'main_subject_note'    => '수학',
    'preferred_fee_amount' => '400000',
    'lessons_per_week'     => '2',
    'minutes_per_lesson'   => '90',
    'lesson_places'        => ['student_home_visit'],
    'student_gender_group' => 'mixed',
    'student_count_group'  => 'solo',
    'feature_1'            => '내신 대비',
    'slogan'               => '꾸준히 함께',
];

$errorOf = static function (array $input, bool $region = true, bool $photo = true): ?string {
    try {
        TutorBasicFields::normalizeInput($input, $region, $photo);
        return null;
    } catch (InvalidArgumentException $e) {
        return $e->getMessage();
    }
};

$assert(count(TutorBasicFields::LABELS) === 13, 'LABELS 13항목');
$assert(!array_key_exists('gender', TutorBasicFields::LABELS), '성별 제외');
$assert($errorOf($full) === null, '다 채움 → 통과');
$assert($errorOf($full + ['gender' => '']) === null, '성별 비어도 통과');

$v = TutorBasicFields::normalizeInput($full, true, true);
$assert($v['preferred_fee_amount'] === 400000 && $v['lessons_per_week'] === 2, '숫자 정규화');

$drops = [
    'tutor_display_name'   => '표시명',
    'school_level'         => '대상(학교급)',
    'main_subject_note'    => '주력과목',
    'preferred_fee_amount' => '월 과외비',
    'lessons_per_week'     => '주 회수',
    'minutes_per_lesson'   => '1회 수업시간',
    'lesson_places'        => '강의장소',
    'student_gender_group' => '지도 대상 성별',
    'student_count_group'  => '수업인원',
    'feature_1'            => '특징 1',
    'slogan'               => '슬로건',
];
foreach ($drops as $key => $label) {
    $input = $full;
    unset($input[$key]);
    $msg = (string) $errorOf($input);
    $assert(str_contains($msg, $label) && str_starts_with($msg, '기본정보를 모두 채워 주세요'), "{$key} 없음 → '{$label}' 거절");
}
$assert(str_contains((string) $errorOf($full, false, true), '과외지역 1'), '과외지역 1 없음 → 거절');
$assert(str_contains((string) $errorOf($full, true, false), '프로필 사진'), '프로필 사진 없음 → 거절');
$assert(str_contains((string) $errorOf(['lessons_per_week' => '0'] + $full), '주 회수'), '주 회수 0 → 거절');
$assert(str_contains((string) $errorOf(['lessons_per_week' => '1.5'] + $full), '주 회수'), '주 회수 소수 → 거절');
$assert(str_contains((string) $errorOf(['lessons_per_week' => '65536'] + $full), '주 회수'), '주 회수 SMALLINT 초과 → 거절');
$assert(str_contains((string) $errorOf(['student_gender_group' => 'x'] + $full), '지도 대상 성별'), '목록 밖 성별군 → 거절');
$assert(str_contains((string) $errorOf(['lesson_places' => ['x']] + $full), '강의장소'), '목록 밖 강의장소 → 거절');
$assert(str_contains((string) $errorOf(['feature_1' => str_repeat('가', 101)] + $full), '100자'), '특징 1 101자 → 거절');
$assert(str_contains((string) $errorOf(['slogan' => str_repeat('가', 256)] + $full), '255자'), '슬로건 256자 → 거절');
$assert(str_contains((string) $errorOf(['tutor_display_name' => str_repeat('가', 51)] + $full), '50자'), '표시명 51자 → 거절');

if ($failed > 0) {
    echo "\nverify-tutor-basic-required.php FAILED ({$failed})\n";
    exit(1);
}
echo "\nverify-tutor-basic-required.php OK\n";
