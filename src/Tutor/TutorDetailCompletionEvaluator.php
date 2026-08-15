<?php

declare(strict_types=1);

namespace Study114\Tutor;

use PDO;

/**
 * tutors.detail_completion_status SSOT.
 *
 * 스텝 통과가 아니라 DB에 저장된 필수 필드로 판정한다.
 * - basic_only: 기본등록 수준만
 * - expanded_in_progress: 상세 필드 일부
 * - expanded_complete: 검색·공개 게이트용 상세 필수 충족
 *
 * published(공개)와 직교: 공개는 허브/contact에서 별도 처리.
 * 검색 노출 = published ∩ expanded_complete (SearchService).
 */
final class TutorDetailCompletionEvaluator
{
    public const STATUS_BASIC = 'basic_only';
    public const STATUS_PROGRESS = 'expanded_in_progress';
    public const STATUS_COMPLETE = 'expanded_complete';

    /**
     * @return array{
     *   status: string,
     *   missing: list<string>,
     *   checks: array<string, bool>,
     *   progress_signals: int
     * }
     */
    public function evaluate(PDO $pdo, int $tutorId): array
    {
        $stmt = $pdo->prepare('SELECT * FROM tutors WHERE id = ? LIMIT 1');
        $stmt->execute([$tutorId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($row === false) {
            return [
                'status' => self::STATUS_BASIC,
                'missing' => ['프로필 없음'],
                'checks' => [],
                'progress_signals' => 0,
            ];
        }

        $displayName = trim((string) ($row['tutor_display_name'] ?? ''));
        $mainSubject = trim((string) ($row['main_subject_note'] ?? ''));
        $fee = $row['preferred_fee_amount'] !== null ? (int) $row['preferred_fee_amount'] : 0;
        $feeBasis = trim((string) ($row['fee_basis_type'] ?? ''));
        $lessonsPerWeek = $row['lessons_per_week'] !== null ? (int) $row['lessons_per_week'] : 0;
        $monthlySessions = $row['monthly_session_count'] !== null ? (int) $row['monthly_session_count'] : 0;
        $minutes = $row['minutes_per_lesson'] !== null ? (int) $row['minutes_per_lesson'] : 0;
        $introShort = trim((string) ($row['intro_short'] ?? ''));
        $introLong = trim((string) ($row['intro_long'] ?? ''));
        $university = trim((string) ($row['university_name'] ?? ''));
        $major = trim((string) ($row['major_name'] ?? ''));
        $univStatus = trim((string) ($row['university_status'] ?? ''));
        $careerBand = trim((string) ($row['career_year_band'] ?? ''));

        $hasPrimaryRegion = $this->hasPrimaryRegion($pdo, $tutorId);
        $hasPrimarySubject = $mainSubject !== '' || $this->hasPrimarySubjectRow($pdo, $tutorId);
        $hasLessonPlaces = $this->lessonPlaceCount($pdo, $tutorId) > 0;
        $hasIntro = $introShort !== '' || $introLong !== '';
        $hasSchedule = $this->scheduleOk($feeBasis, $lessonsPerWeek, $monthlySessions);

        $checks = [
            'tutor_display_name' => $displayName !== '',
            'primary_region' => $hasPrimaryRegion,
            'primary_subject' => $hasPrimarySubject,
            'lesson_places' => $hasLessonPlaces,
            'preferred_fee_amount' => $fee > 0,
            'fee_basis_type' => $feeBasis === 'monthly_by_weekly_schedule'
                || $feeBasis === 'monthly_by_total_sessions',
            'schedule_count' => $hasSchedule,
            'minutes_per_lesson' => $minutes > 0,
            'intro' => $hasIntro,
            'university_name' => $university !== '',
        ];

        $labels = [
            'tutor_display_name' => '표시명',
            'primary_region' => '대표 활동 시',
            'primary_subject' => '주력과목',
            'lesson_places' => '강의장소',
            'preferred_fee_amount' => '과외비',
            'fee_basis_type' => '과외비 산정방식',
            'schedule_count' => '주 횟수/월 총 횟수',
            'minutes_per_lesson' => '1회 수업 시간',
            'intro' => '소개문',
            'university_name' => '학교명',
        ];

        $missing = [];
        foreach ($checks as $key => $ok) {
            if (!$ok) {
                $missing[] = $labels[$key];
            }
        }

        $progressSignals = 0;
        foreach (
            [
                $fee > 0,
                $feeBasis !== '',
                $lessonsPerWeek > 0,
                $monthlySessions > 0,
                $minutes > 0,
                $hasLessonPlaces,
                $hasIntro,
                $university !== '',
                $major !== '',
                $univStatus !== '',
                $careerBand !== '',
            ] as $signal
        ) {
            if ($signal) {
                $progressSignals++;
            }
        }

        if ($missing === []) {
            $status = self::STATUS_COMPLETE;
        } elseif ($progressSignals > 0) {
            $status = self::STATUS_PROGRESS;
        } else {
            $status = self::STATUS_BASIC;
        }

        return [
            'status' => $status,
            'missing' => $missing,
            'checks' => $checks,
            'progress_signals' => $progressSignals,
        ];
    }

    /**
     * 판정 결과를 DB에 반영.
     *
     * @return array{
     *   status: string,
     *   missing: list<string>,
     *   checks: array<string, bool>,
     *   progress_signals: int,
     *   changed: bool
     * }
     */
    public function apply(PDO $pdo, int $tutorId): array
    {
        $result = $this->evaluate($pdo, $tutorId);
        $stmt = $pdo->prepare('SELECT detail_completion_status FROM tutors WHERE id = ?');
        $stmt->execute([$tutorId]);
        $current = (string) ($stmt->fetchColumn() ?: self::STATUS_BASIC);
        $changed = $current !== $result['status'];
        if ($changed) {
            $pdo->prepare('UPDATE tutors SET detail_completion_status = ?, updated_at = NOW() WHERE id = ?')
                ->execute([$result['status'], $tutorId]);
        }

        return [...$result, 'changed' => $changed];
    }

    /**
     * 운영/로컬: 전수 재계산 (필드 기준 — 상태값 임의 승격 아님).
     *
     * @return array{scanned: int, changed: int, by_status: array<string, int>, samples: list<array<string, mixed>>}
     */
    public function recomputeAll(PDO $pdo, int $sampleLimit = 20): array
    {
        $ids = $pdo->query('SELECT id FROM tutors ORDER BY id ASC')->fetchAll(PDO::FETCH_COLUMN);
        $changed = 0;
        $byStatus = [
            self::STATUS_BASIC => 0,
            self::STATUS_PROGRESS => 0,
            self::STATUS_COMPLETE => 0,
        ];
        $samples = [];

        foreach ($ids as $idRaw) {
            $tutorId = (int) $idRaw;
            $result = $this->apply($pdo, $tutorId);
            $byStatus[$result['status']] = ($byStatus[$result['status']] ?? 0) + 1;
            if ($result['changed']) {
                $changed++;
            }
            if (count($samples) < $sampleLimit) {
                $samples[] = [
                    'tutor_id' => $tutorId,
                    'status' => $result['status'],
                    'changed' => $result['changed'],
                    'missing' => $result['missing'],
                ];
            }
        }

        return [
            'scanned' => count($ids),
            'changed' => $changed,
            'by_status' => $byStatus,
            'samples' => $samples,
        ];
    }

    private function scheduleOk(string $feeBasis, int $lessonsPerWeek, int $monthlySessions): bool
    {
        if ($feeBasis === 'monthly_by_weekly_schedule') {
            return $lessonsPerWeek > 0;
        }
        if ($feeBasis === 'monthly_by_total_sessions') {
            return $monthlySessions > 0;
        }

        return false;
    }

    private function hasPrimaryRegion(PDO $pdo, int $tutorId): bool
    {
        $stmt = $pdo->prepare(
            'SELECT 1 FROM tutor_regions WHERE tutor_id = ? AND is_primary = 1 LIMIT 1'
        );
        $stmt->execute([$tutorId]);

        return (bool) $stmt->fetchColumn();
    }

    private function hasPrimarySubjectRow(PDO $pdo, int $tutorId): bool
    {
        $stmt = $pdo->prepare(
            'SELECT 1 FROM tutor_subject_targets
             WHERE tutor_id = ? AND (is_primary = 1 OR TRIM(subject_name) <> "")
             LIMIT 1'
        );
        $stmt->execute([$tutorId]);

        return (bool) $stmt->fetchColumn();
    }

    private function lessonPlaceCount(PDO $pdo, int $tutorId): int
    {
        $stmt = $pdo->prepare('SELECT COUNT(*) FROM tutor_lesson_places WHERE tutor_id = ?');
        $stmt->execute([$tutorId]);

        return (int) $stmt->fetchColumn();
    }
}
