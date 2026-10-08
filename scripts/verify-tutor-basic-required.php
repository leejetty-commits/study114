<?php

declare(strict_types=1);

/**
 * 과외쌤 기본등록 필수 8개 서버 검사 (정본 73 0절, DB 없이 TutorBasicFields::normalizeInput 만).
 *   php scripts/verify-tutor-basic-required.php
 *
 * TBR_TAMPER_FILE 에 고친 TutorBasicFields 사본 경로를 주면 그 사본으로 검사한다
 * (verify-tutor-basic-required.mjs 의 변조 검사가 쓴다. 이때는 FAIL 이 나와야 정상).
 */

$tamper = getenv('TBR_TAMPER_FILE');
if (is_string($tamper) && $tamper !== '') {
    require_once $tamper;
}
require_once dirname(__DIR__) . '/src/bootstrap.php';

use Study114\Tutor\TutorBasicFields;

$failed = 0;
$assert = static function (bool $ok, string $msg) use (&$failed): void {
    if (!$ok) {
        $failed++;
    }
    echo ($ok ? 'PASS' : 'FAIL') . "  PHP {$msg}\n";
};

$labels = [
    'display_name'     => '표시명',
    'primary_region'   => '과외지역 1',
    'school_level'     => '대상(학교급)',
    'main_subject'     => '주력과목',
    'fee'              => '월 과외비',
    'lessons_per_week' => '주 회수',
    'minutes'          => '1회 수업시간',
    'slogan'           => '슬로건',
];

$full = [
    'tutor_display_name'   => '김쌤',
    'school_level'         => 'middle',
    'main_subject_note'    => '수학',
    'preferred_fee_amount' => '400000',
    'lessons_per_week'     => '2',
    'minutes_per_lesson'   => '90',
    'slogan'               => '꾸준히 함께',
];

$errorOf = static function (array $input, bool $region = true): ?string {
    try {
        TutorBasicFields::normalizeInput($input, $region);
        return null;
    } catch (InvalidArgumentException $e) {
        return $e->getMessage();
    }
};

$assert(TutorBasicFields::LABELS === $labels, 'LABELS = 정본 73 0-2 기본등록 8개 (키·라벨·순서)');
$assert(
    (new ReflectionMethod(TutorBasicFields::class, 'normalizeInput'))->getNumberOfParameters() === 2,
    'normalizeInput(입력, 과외지역1) — 사진 인자 없음',
);
$assert($errorOf($full) === null, '8개 다 채움 → 통과');

$v = TutorBasicFields::normalizeInput($full, true);
$assert($v['preferred_fee_amount'] === 400000 && $v['lessons_per_week'] === 2 && $v['minutes_per_lesson'] === 90, '숫자 정규화');

// 상세 4개(수업장소·원생수·특징·사진) 없이 통과 — 값이 없어도, 이상한 값이 와도 기본등록은 보지 않는다
$assert($errorOf($full) === null && !array_key_exists('lesson_places', $full), '수업장소·원생수·특징·사진 없이 통과');
$assert(
    $errorOf($full + ['lesson_places' => [], 'student_gender_group' => '', 'student_count_group' => '', 'feature_1' => '']) === null,
    '상세 4개를 빈 값으로 보내도 통과',
);
$assert(
    $errorOf(['lesson_places' => ['student_home_visit'], 'student_gender_group' => 'mixed', 'student_count_group' => 'solo', 'feature_1' => '내신'], false)
        === '기본정보를 모두 채워 주세요: ' . implode(', ', array_values($labels)),
    '상세 4개만 있고 8개 없음 → 8개 모두 거절',
);

$inputKey = [
    'display_name'     => 'tutor_display_name',
    'school_level'     => 'school_level',
    'main_subject'     => 'main_subject_note',
    'fee'              => 'preferred_fee_amount',
    'lessons_per_week' => 'lessons_per_week',
    'minutes'          => 'minutes_per_lesson',
    'slogan'           => 'slogan',
];
foreach ($labels as $key => $label) {
    if ($key === 'primary_region') {
        $msg = (string) $errorOf($full, false);
    } else {
        $input = $full;
        unset($input[$inputKey[$key]]);
        $msg = (string) $errorOf($input);
    }
    $assert($msg === '기본정보를 모두 채워 주세요: ' . $label, "{$key} 빠짐 → '{$label}' 한 항목만 거절");
}

$assert(str_contains((string) $errorOf(['slogan' => '   '] + $full), '슬로건'), '슬로건 공백만 → 거절');
$assert(str_contains((string) $errorOf(['school_level' => 'x'] + $full), '대상(학교급)'), '목록 밖 학교급 → 거절');
$assert(str_contains((string) $errorOf(['lessons_per_week' => '0'] + $full), '주 회수'), '주 회수 0 → 거절');
$assert(str_contains((string) $errorOf(['lessons_per_week' => '1.5'] + $full), '주 회수'), '주 회수 소수 → 거절');
$assert(str_contains((string) $errorOf(['lessons_per_week' => '65536'] + $full), '주 회수'), '주 회수 SMALLINT 초과 → 거절');
$assert(str_contains((string) $errorOf(['preferred_fee_amount' => '0'] + $full), '월 과외비'), '월 과외비 0 → 거절');
$assert(str_contains((string) $errorOf(['slogan' => str_repeat('가', 256)] + $full), '255자'), '슬로건 256자 → 거절');
$assert(str_contains((string) $errorOf(['tutor_display_name' => str_repeat('가', 51)] + $full), '50자'), '표시명 51자 → 거절');

// 저장된 행 판정(missingForTutor)도 상세 4개를 보지 않는다
$src = (string) file_get_contents((new ReflectionClass(TutorBasicFields::class))->getFileName());
$missingFn = substr($src, (int) strpos($src, 'function missingForTutor'), 2000);
$missingFn = substr($missingFn, 0, (int) strpos($missingFn, 'function hasPrimaryRegion'));
foreach (['tutor_images', 'tutor_lesson_places', 'feature_1', 'student_gender_group', 'student_count_group'] as $needle) {
    $assert(!str_contains($missingFn, $needle), "missingForTutor 가 {$needle} 를 보지 않음");
}

if ($failed > 0) {
    echo "\nverify-tutor-basic-required.php FAILED ({$failed})\n";
    exit(1);
}
echo "\nverify-tutor-basic-required.php OK\n";
