<?php

declare(strict_types=1);

namespace Study114\Registration;

/**
 * 학생 기본정보 완료 판정 — 학생 카드 노출의 단일 기준.
 * 아홉 칸 중 「한 줄 요청문」만 선택이고 나머지 여덟 칸이 차야 노출한다.
 * 상세등록 항목(성별·출생연도·희망 과외쌤 성별·강의스타일 등)은 조건이 아니다.
 *
 * 입력 배열 키는 StudentHubRepository 의 학생 행과 같다.
 */
final class StudentBasicCompleteness
{
    /** 화면 안내 문구 정본. 키 순서 = 기본정보 화면 순서. */
    public const LABELS = [
        'public_display_name'           => '표시명',
        'grade_level'                   => '학교급·학년',
        'preferred_lesson_type'         => '희망 유형',
        'preferred_region'              => '희망지역',
        'subject'                       => '희망과목',
        'lesson_format'                 => '수업형태',
        'preferred_student_count_group' => '수업인원',
        'budget'                        => '예산',
    ];

    private const LESSON_TYPES = ['tutor', 'study_room'];
    private const LESSON_FORMATS = ['one_on_one', 'group'];
    private const COUNT_GROUPS = ['solo', 'two', 'three', 'four_plus'];

    /**
     * @param array<string, mixed> $s
     * @return list<string> 비어 있는 항목 키 (LABELS 순서)
     */
    public static function missingKeys(array $s): array
    {
        $type = $s['preferred_lesson_type'] ?? null;
        $typeOk = in_array($type, self::LESSON_TYPES, true);
        $format = $s['lesson_format'] ?? null;

        // 미취학은 학년 선택칸이 없다. 학교급(희망과목 행의 school_level)으로 채운 것으로 본다.
        $gradeOk = self::text($s['grade_level'] ?? null) !== ''
            || ($s['school_level'] ?? null) === 'preschool';

        if ($type === 'study_room') {
            // 지역 메모(preferred_region_note·region_label)는 인정하지 않는다.
            $regionOk = self::positiveId($s['preferred_studyroom_region_id'] ?? null)
                || (($s['preferred_studyroom_region_basis'] ?? null) === 'complex'
                    && self::positiveId($s['preferred_studyroom_complex_id'] ?? null));
            $budgetOk = self::amount($s['preferred_studyroom_fee_amount'] ?? null);
        } elseif ($type === 'tutor') {
            $regionOk = self::positiveId($s['preferred_tutor_region_id'] ?? null);
            $budgetOk = self::amount($s['preferred_fee_amount'] ?? null);
        } else {
            $regionOk = false;
            $budgetOk = false;
        }

        $ok = [
            'public_display_name'           => self::text($s['public_display_name'] ?? null) !== '',
            'grade_level'                   => $gradeOk,
            'preferred_lesson_type'         => $typeOk,
            'preferred_region'              => $regionOk,
            'subject'                       => self::text($s['subject_label'] ?? null) !== '',
            'lesson_format'                 => in_array($format, self::LESSON_FORMATS, true),
            'preferred_student_count_group' => $format === 'one_on_one'
                || in_array($s['preferred_student_count_group'] ?? null, self::COUNT_GROUPS, true),
            'budget'                        => $budgetOk,
        ];

        $missing = [];
        foreach (array_keys(self::LABELS) as $key) {
            if (!$ok[$key]) {
                $missing[] = $key;
            }
        }

        return $missing;
    }

    /**
     * @param array<string, mixed> $s
     * @return list<string> 비어 있는 항목 이름
     */
    public static function missingLabels(array $s): array
    {
        return self::labelsFor(self::missingKeys($s));
    }

    /** @param array<string, mixed> $s */
    public static function isComplete(array $s): bool
    {
        return self::missingKeys($s) === [];
    }

    /**
     * @param list<string> $keys
     * @return list<string>
     */
    public static function labelsFor(array $keys): array
    {
        $out = [];
        foreach ($keys as $key) {
            $out[] = self::LABELS[$key] ?? $key;
        }

        return $out;
    }

    private static function text(mixed $value): string
    {
        return is_string($value) ? trim($value) : '';
    }

    private static function positiveId(mixed $value): bool
    {
        if (is_int($value)) {
            return $value > 0;
        }

        return is_string($value) && preg_match('/^[1-9]\d*$/', $value) === 1;
    }

    /** 예산은 1 이상 정수만 입력으로 본다. 0·빈칸·음수는 미입력. */
    private static function amount(mixed $value): bool
    {
        if (is_int($value)) {
            return $value >= 1;
        }

        return is_string($value) && preg_match('/^0*[1-9]\d*$/', $value) === 1;
    }
}
