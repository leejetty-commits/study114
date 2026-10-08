<?php

declare(strict_types=1);

namespace Study114\Tutor;

use InvalidArgumentException;
use PDO;
use Study114\Region\TutorRegionUnit;

/**
 * 과외쌤 기본등록 필수 8개 (정본 73 0-2절).
 * preview/shared/tutor-basic-fields.js TUTOR_BASIC_FIELDS 와 같은 키·라벨·순서.
 * 과외지역 2·3번은 선택이라 목록에 없다. 성별은 계정 단계 값이다.
 * 사진·수업장소·원생수·특징은 상세등록 선택 항목이라 여기서 검사하지 않는다.
 */
final class TutorBasicFields
{
    public const LABELS = [
        'display_name'     => '표시명',
        'primary_region'   => '과외지역 1',
        'school_level'     => '대상(학교급)',
        'main_subject'     => '주력과목',
        'fee'              => '월 과외비',
        'lessons_per_week' => '주 회수',
        'minutes'          => '1회 수업시간',
        'slogan'           => '슬로건',
    ];

    public const SCHOOL_LEVELS = ['preschool', 'elementary', 'middle', 'high', 'n_su', 'general', 'other'];

    private const DISPLAY_NAME_MAX = 50;
    private const SLOGAN_MAX = 255;
    private const SMALLINT_UNSIGNED_MAX = 65535;
    private const INT_UNSIGNED_MAX = 4294967295;

    /**
     * 화면이 보낸 기본등록 값을 검사한다. 빈 항목은 라벨을 모아 한 번에 거절한다.
     * 과외지역 1은 저장 위치가 따로라 부르는 쪽이 있음 여부만 넘긴다.
     *
     * @param array<string, mixed> $input
     * @return array{
     *   tutor_display_name: string,
     *   main_subject_note: string,
     *   school_level: string,
     *   preferred_fee_amount: int,
     *   lessons_per_week: int,
     *   minutes_per_lesson: int,
     *   slogan: string
     * }
     */
    public static function normalizeInput(array $input, bool $hasPrimaryRegion): array
    {
        $name = self::text($input['tutor_display_name'] ?? '');
        $subject = self::text($input['main_subject_note'] ?? '');
        $level = self::text($input['school_level'] ?? '');
        $fee = self::positiveInt($input['preferred_fee_amount'] ?? null, self::INT_UNSIGNED_MAX);
        $weekly = self::positiveInt($input['lessons_per_week'] ?? null, self::SMALLINT_UNSIGNED_MAX);
        $minutes = self::positiveInt($input['minutes_per_lesson'] ?? null, self::SMALLINT_UNSIGNED_MAX);
        $slogan = self::text($input['slogan'] ?? '');

        $ok = [
            'display_name'     => $name !== '',
            'primary_region'   => $hasPrimaryRegion,
            'school_level'     => in_array($level, self::SCHOOL_LEVELS, true),
            'main_subject'     => $subject !== '',
            'fee'              => $fee !== null,
            'lessons_per_week' => $weekly !== null,
            'minutes'          => $minutes !== null,
            'slogan'           => $slogan !== '',
        ];
        $missing = self::labelsFor($ok);
        if ($missing !== []) {
            throw new InvalidArgumentException('기본정보를 모두 채워 주세요: ' . implode(', ', $missing));
        }

        if (mb_strlen($name) > self::DISPLAY_NAME_MAX) {
            throw new InvalidArgumentException('표시명: ' . self::DISPLAY_NAME_MAX . '자 이하로 입력해 주세요.');
        }
        if (mb_strlen($slogan) > self::SLOGAN_MAX) {
            throw new InvalidArgumentException('슬로건: ' . self::SLOGAN_MAX . '자 이하로 입력해 주세요.');
        }

        return [
            'tutor_display_name'   => $name,
            'main_subject_note'    => $subject,
            'school_level'         => $level,
            'preferred_fee_amount' => (int) $fee,
            'lessons_per_week'     => (int) $weekly,
            'minutes_per_lesson'   => (int) $minutes,
            'slogan'               => $slogan,
        ];
    }

    /**
     * 검사한 값을 저장한다. 과외지역은 따로 저장한다.
     * 대표 과목 행만 고치고 추가 과목 행은 그대로 둔다.
     *
     * @param array<string, mixed> $v normalizeInput() 결과
     */
    public static function write(PDO $pdo, int $tutorId, array $v): void
    {
        $pdo->prepare(
            'UPDATE tutors SET
                tutor_display_name = ?,
                main_subject_note = ?,
                preferred_fee_amount = ?,
                lessons_per_week = ?,
                minutes_per_lesson = ?,
                slogan = ?
             WHERE id = ?'
        )->execute([
            $v['tutor_display_name'],
            $v['main_subject_note'],
            $v['preferred_fee_amount'],
            $v['lessons_per_week'],
            $v['minutes_per_lesson'],
            $v['slogan'],
            $tutorId,
        ]);

        $subjectName = self::firstSubjectName((string) $v['main_subject_note']);
        $masterId = self::findSubjectMasterId($pdo, $subjectName);
        $primaryStmt = $pdo->prepare(
            'SELECT id FROM tutor_subject_targets WHERE tutor_id = ? AND is_primary = 1 ORDER BY id ASC LIMIT 1'
        );
        $primaryStmt->execute([$tutorId]);
        $primaryId = $primaryStmt->fetchColumn();
        if ($primaryId !== false) {
            $pdo->prepare(
                'UPDATE tutor_subject_targets SET subject_name = ?, school_level = ?, subject_master_id = ? WHERE id = ?'
            )->execute([$subjectName, $v['school_level'], $masterId, (int) $primaryId]);
            $pdo->prepare(
                'UPDATE tutor_subject_targets SET is_primary = 0 WHERE tutor_id = ? AND id <> ?'
            )->execute([$tutorId, (int) $primaryId]);
        } else {
            $pdo->prepare(
                'INSERT INTO tutor_subject_targets (tutor_id, subject_name, school_level, subject_master_id, is_primary)
                 VALUES (?, ?, ?, ?, 1)'
            )->execute([$tutorId, $subjectName, $v['school_level'], $masterId]);
        }
    }

    /**
     * 저장된 행 기준 빈 항목 라벨 (목록 순서). 기본등록 완료 판정·공개 판정이 같이 쓴다.
     *
     * @return list<string>
     */
    public static function missingForTutor(PDO $pdo, int $tutorId): array
    {
        $stmt = $pdo->prepare('SELECT * FROM tutors WHERE id = ? LIMIT 1');
        $stmt->execute([$tutorId]);
        /** @var array<string, mixed>|false $row */
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($row === false) {
            return array_values(self::LABELS);
        }

        $levelStmt = $pdo->prepare(
            'SELECT school_level FROM tutor_subject_targets WHERE tutor_id = ? ORDER BY is_primary DESC, id ASC LIMIT 1'
        );
        $levelStmt->execute([$tutorId]);
        $level = (string) ($levelStmt->fetchColumn() ?: '');

        $ok = [
            'display_name'     => self::text($row['tutor_display_name'] ?? '') !== '',
            'primary_region'   => self::hasPrimaryRegion($pdo, $tutorId),
            'school_level'     => in_array($level, self::SCHOOL_LEVELS, true),
            'main_subject'     => self::text($row['main_subject_note'] ?? '') !== '',
            'fee'              => (int) ($row['preferred_fee_amount'] ?? 0) > 0,
            'lessons_per_week' => (int) ($row['lessons_per_week'] ?? 0) > 0,
            'minutes'          => (int) ($row['minutes_per_lesson'] ?? 0) > 0,
            'slogan'           => self::text($row['slogan'] ?? '') !== '',
        ];

        return self::labelsFor($ok);
    }

    /**
     * 기본등록 완료 = 노출(published), 미완료 = draft. 관리자 숨김(hidden)은 건드리지 않는다.
     * 회원이 노출 상태를 고르는 동작은 없다(정본 22·73).
     */
    public static function syncProfileStatus(PDO $pdo, int $tutorId): void
    {
        $status = self::missingForTutor($pdo, $tutorId) === [] ? 'published' : 'draft';
        $pdo->prepare(
            "UPDATE tutors SET profile_status = ?,
                published_at = CASE WHEN ? = 'published' THEN COALESCE(published_at, NOW()) ELSE published_at END
             WHERE id = ? AND profile_status <> 'hidden'"
        )->execute([$status, $status, $tutorId]);
    }

    /**
     * missingForTutor() 의 과외지역 1을 뺀 7개를 SQL 조건으로. 과외지역 1은 검색의 tutorSlot1Sql 이 본다.
     * 검색 노출이 가입 게이트(needsBasicRegister)와 같은 기준을 쓰게 한다.
     */
    public static function completeSql(string $alias): string
    {
        $levels = "'" . implode("', '", self::SCHOOL_LEVELS) . "'";

        return "(TRIM(COALESCE({$alias}.tutor_display_name, '')) <> ''
            AND TRIM(COALESCE({$alias}.main_subject_note, '')) <> ''
            AND COALESCE({$alias}.preferred_fee_amount, 0) > 0
            AND COALESCE({$alias}.lessons_per_week, 0) > 0
            AND COALESCE({$alias}.minutes_per_lesson, 0) > 0
            AND TRIM(COALESCE({$alias}.slogan, '')) <> ''
            AND (SELECT tbf_st.school_level FROM tutor_subject_targets tbf_st
                 WHERE tbf_st.tutor_id = {$alias}.id
                 ORDER BY tbf_st.is_primary DESC, tbf_st.id ASC LIMIT 1) IN ({$levels}))";
    }

    /** 슬롯 1(priority_order=0)이 과외 단위 지역이면 true. 등록 허브 has_primary_region 과 같은 기준. */
    public static function hasPrimaryRegion(PDO $pdo, int $tutorId): bool
    {
        $stmt = $pdo->prepare(
            'SELECT region_id FROM tutor_regions WHERE tutor_id = ? AND priority_order = 0
               AND region_id IS NOT NULL AND region_id <> 0 LIMIT 1'
        );
        $stmt->execute([$tutorId]);
        $regionId = $stmt->fetchColumn();

        return $regionId !== false && TutorRegionUnit::labelForId($pdo, (int) $regionId) !== null;
    }

    /** @param array<string, bool> $ok @return list<string> */
    private static function labelsFor(array $ok): array
    {
        $missing = [];
        foreach (self::LABELS as $key => $label) {
            if (empty($ok[$key])) {
                $missing[] = $label;
            }
        }

        return $missing;
    }

    private static function text(mixed $v): string
    {
        return is_scalar($v) ? trim((string) $v) : '';
    }

    private static function positiveInt(mixed $v, int $max): ?int
    {
        $raw = self::text($v);
        if ($raw === '' || preg_match('/^\d+$/', $raw) !== 1) {
            return null;
        }
        $n = (int) $raw;

        return $n >= 1 && $n <= $max ? $n : null;
    }

    private static function firstSubjectName(string $raw): string
    {
        $parts = preg_split('/[,·\/]/u', $raw) ?: [];
        $first = trim($parts[0] ?? $raw);

        return mb_substr($first !== '' ? $first : trim($raw), 0, 50);
    }

    private static function findSubjectMasterId(PDO $pdo, string $name): ?int
    {
        $stmt = $pdo->prepare(
            'SELECT id FROM subject_masters WHERE subject_name = ? OR subject_name LIKE ? ORDER BY id ASC LIMIT 1'
        );
        $stmt->execute([$name, '%' . $name . '%']);
        $id = $stmt->fetchColumn();

        return $id ? (int) $id : null;
    }
}
