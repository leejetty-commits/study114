<?php

declare(strict_types=1);

namespace Study114\QuickMatch;

use PDO;
use Study114\Database\Connection;
use Study114\Messages\MessagesRepository;
use Study114\Paid\PositionPeriodCalculator;
use Study114\Registration\StudentPublicName;

/**
 * 학생 1명 기준 발송.
 * 유형별 매칭기(1·2단계)가 없으면 AND 매칭이 아니므로 기록도 쪽지도 만들지 않는다.
 * 등록 트랜잭션 밖에서만 호출한다.
 */
final class QuickMatchDispatcher
{
    /**
     * 1·2단계 매칭기가 붙기 전에는 false. true로 바꾸면 아래 흐름이 돈다.
     * 종현 2026-11-14: 공부방 월 수업료가 비어 있으면 그 조건은 건너뛴다(공부방을 빼지 않는다). 비교는 2단계.
     */
    public const MATCHERS_READY = false;

    private const DAILY_CAP = 20;

    /** @var list<string> */
    private const MATCH_KEYS = [
        'preferred_tutor_region_id',
        'preferred_studyroom_region_id',
        'preferred_studyroom_complex_id',
        'preferred_tutor_region_extra_id',
        'preferred_studyroom_region_extra_id',
        'preferred_studyroom_complex_extra_id',
        'school_level',
        'subject_label',
        'subject_names',
        'preferred_tutor_gender',
        'preferred_fee_amount',
        'preferred_studyroom_fee_amount',
        'teaching_style_badges',
        'preferred_director_age_bands',
        'preferred_tutor_age_bands',
        'preferred_lesson_type',
        'prime_match_opt_in',
        'quick_match_prefs',
    ];

    private PDO $pdo;

    public function __construct(?PDO $pdo = null)
    {
        $this->pdo = $pdo ?? Connection::get();
    }

    public function onRegister(int $studentId): void
    {
        try {
            $this->run($studentId, 'register', null);
        } catch (\Throwable $e) {
            error_log('[quick-match] register: ' . $e->getMessage());
        }
    }

    /**
     * @param array<string, mixed>|null $before
     * @param array<string, mixed>|null $after
     * @param list<string> $patchKeys
     */
    public function afterStudentSave(?array $before, ?array $after, array $patchKeys): void
    {
        try {
            if ($after === null) {
                return;
            }
            $studentId = (int) ($after['id'] ?? 0);
            if ($studentId < 1) {
                return;
            }
            $beforeStatus = (string) ($before['exposure_status'] ?? '');
            $afterStatus = (string) ($after['exposure_status'] ?? '');
            if ($beforeStatus !== 'published' && $afterStatus === 'published') {
                $this->run($studentId, 'register', null);

                return;
            }
            if ($afterStatus !== 'published') {
                return;
            }
            if (!$this->patchTouchesMatch($patchKeys, $before, $after)) {
                return;
            }
            $this->run($studentId, 'rematch', $before);
        } catch (\Throwable $e) {
            error_log('[quick-match] student update: ' . $e->getMessage());
        }
    }

    /** @param array<string, mixed>|null $before */
    private function run(int $studentId, string $trigger, ?array $before): void
    {
        if (!self::MATCHERS_READY) {
            return;
        }
        if (!QuickMatchSchema::ready($this->pdo)) {
            return;
        }
        $student = $this->loadStudent($studentId);
        if ($student === null) {
            return;
        }
        if ((string) $student['exposure_status'] !== 'published' || (int) $student['prime_match_opt_in'] !== 1) {
            return;
        }
        $today = PositionPeriodCalculator::calendarDate();
        if ($trigger === 'rematch' && $this->rematchAlreadyRan($studentId, $today)) {
            return;
        }
        $sent = 0;
        $matched = 0;
        foreach ($this->candidates($student) as $provider) {
            $matched += 1;
            if ($sent >= 0 && $this->sentToday((string) $provider['type'], (int) $provider['id'], $today) >= self::DAILY_CAP) {
                continue;
            }
            if ($this->alreadyDispatched($studentId, (string) $provider['type'], (int) $provider['id'])) {
                continue;
            }
            if ($this->sendOne($student, $provider, $trigger, $today)) {
                $sent += 1;
            }
        }
        $this->recordRun($studentId, $trigger, $today, $matched, $sent);
        unset($before);
    }

    /**
     * @param list<string> $patchKeys
     * @param array<string, mixed>|null $before
     * @param array<string, mixed> $after
     */
    private function patchTouchesMatch(array $patchKeys, ?array $before, array $after): bool
    {
        foreach ($patchKeys as $key) {
            if (!in_array($key, self::MATCH_KEYS, true)) {
                continue;
            }
            if ($key === 'prime_match_opt_in') {
                $was = (int) ($before['prime_match_opt_in'] ?? 0);
                $now = (int) ($after['prime_match_opt_in'] ?? 0);
                if ($was === 0 && $now === 1) {
                    return true;
                }
                continue;
            }

            return true;
        }

        return false;
    }

    /** @return array<string, mixed>|null */
    private function loadStudent(int $studentId): ?array
    {
        $stmt = $this->pdo->prepare(
            'SELECT id, guardian_user_id, student_name, exposure_status, prime_match_opt_in,
                    preferred_lesson_type, grade_level, preferred_tutor_gender,
                    preferred_fee_amount, preferred_studyroom_fee_amount,
                    preferred_tutor_region_id, preferred_studyroom_region_id,
                    preferred_studyroom_complex_id,
                    preferred_tutor_region_extra_id, preferred_studyroom_region_extra_id,
                    preferred_studyroom_complex_extra_id
             FROM students WHERE id = ? AND deleted_at IS NULL LIMIT 1'
        );
        $stmt->execute([$studentId]);
        $row = $stmt->fetch();

        return $row === false ? null : $row;
    }

    /**
     * 지역이 겹치는 프라임 공급자. 유형별 조건은 1·2단계.
     *
     * @param array<string, mixed> $student
     * @return list<array{type: string, id: int, user_id: int}>
     */
    private function candidates(array $student): array
    {
        $lesson = (string) ($student['preferred_lesson_type'] ?? '');
        $type = $lesson === 'study_room' ? 'study_room' : 'tutor';
        $regions = array_values(array_filter([
            (int) ($student['preferred_tutor_region_id'] ?? 0),
            (int) ($student['preferred_studyroom_region_id'] ?? 0),
            (int) ($student['preferred_tutor_region_extra_id'] ?? 0),
            (int) ($student['preferred_studyroom_region_extra_id'] ?? 0),
        ]));
        $complexes = array_values(array_filter([
            (int) ($student['preferred_studyroom_complex_id'] ?? 0),
            (int) ($student['preferred_studyroom_complex_extra_id'] ?? 0),
        ]));
        if ($regions === [] && $complexes === []) {
            return [];
        }
        $sql = 'SELECT DISTINCT s.user_id, s.provider_type, s.provider_id
                FROM provider_position_subscriptions s
                WHERE s.sku_code = \'prime\' AND CURDATE() < s.end_exclusive_on
                  AND s.provider_type = ? AND s.provider_id IS NOT NULL';
        $params = [$type];
        $parts = [];
        if ($regions !== []) {
            $holders = implode(',', array_fill(0, count($regions), '?'));
            $parts[] = "s.region_id IN ({$holders})";
            array_push($params, ...$regions);
        }
        if ($complexes !== []) {
            $holders = implode(',', array_fill(0, count($complexes), '?'));
            $parts[] = "s.complex_id IN ({$holders})";
            array_push($params, ...$complexes);
        }
        $sql .= ' AND (' . implode(' OR ', $parts) . ')';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();
        $out = [];
        foreach (is_array($rows) ? $rows : [] as $row) {
            $out[] = [
                'type' => (string) $row['provider_type'],
                'id' => (int) $row['provider_id'],
                'user_id' => (int) $row['user_id'],
            ];
        }

        return $out;
    }

    /**
     * @param array<string, mixed> $student
     * @param array{type: string, id: int, user_id: int} $provider
     */
    private function sendOne(array $student, array $provider, string $trigger, string $today): bool
    {
        $studentUser = (int) $student['guardian_user_id'];
        $providerUser = (int) $provider['user_id'];
        if ($studentUser < 1 || $providerUser < 1 || $studentUser === $providerUser) {
            return false;
        }
        $low = min($studentUser, $providerUser);
        $high = max($studentUser, $providerUser);
        if ($this->pairBlocked($low, $high)) {
            return false;
        }
        $repo = new MessagesRepository($this->pdo);
        $existing = $repo->findThreadByContext('student', (int) $student['id'], $low, $high);
        if ($existing !== null) {
            return false;
        }
        $masked = StudentPublicName::mask((string) ($student['student_name'] ?? ''));
        $notice = $masked . " 님과 조건이 맞아요\n우동공과 조건이 맞아 연결되었어요. 같은 학생에게는 한 번만 알려 드려요. 답장으로 인사를 시작해 보세요.";
        $threadId = $repo->createThread([
            'participant_low_user_id' => $low,
            'participant_high_user_id' => $high,
            'context_kind' => 'student',
            'context_id' => (int) $student['id'],
            'context_label' => '학생',
            'peer_display_name' => $masked,
            'scope_badge' => '실시간 퀵매칭',
            'scope_hint' => '',
            'show_request_in_panel' => 0,
            'request_summary' => null,
            'structured_line' => $this->structuredLine($student),
            'initiated_by_user_id' => $providerUser,
            'last_message_preview' => mb_substr(strtok($notice, "\n") ?: $notice, 0, 120),
        ]);
        $mark = $this->pdo->prepare(
            'UPDATE message_threads SET thread_origin = \'quick_match\' WHERE id = ?'
        );
        $mark->execute([$threadId]);
        $ins = $this->pdo->prepare(
            'INSERT INTO quick_match_dispatches
               (student_id, provider_type, provider_id, provider_user_id, thread_id, trigger_kind, sent_on)
             VALUES (?, ?, ?, ?, ?, ?, ?)'
        );
        $ins->execute([
            (int) $student['id'],
            $provider['type'],
            $provider['id'],
            $providerUser,
            $threadId,
            $trigger,
            $today,
        ]);
        unset($notice);

        return true;
    }

    /** 학교명·스카이는 넣지 않는다. */
    private function structuredLine(array $student): string
    {
        $bits = [];
        $grade = trim((string) ($student['grade_level'] ?? ''));
        if ($grade !== '') {
            $bits[] = $grade;
        }
        $gender = (string) ($student['preferred_tutor_gender'] ?? '');
        $genderLabel = ['male' => '남', 'female' => '여', 'any' => '상관없음'][$gender] ?? '';
        if ($genderLabel !== '') {
            $bits[] = $genderLabel;
        }

        return mb_substr(implode(' · ', $bits), 0, 255);
    }

    private function rematchAlreadyRan(int $studentId, string $today): bool
    {
        $stmt = $this->pdo->prepare(
            'SELECT 1 FROM quick_match_student_runs
             WHERE student_id = ? AND trigger_kind = \'rematch\' AND run_on = ? LIMIT 1'
        );
        $stmt->execute([$studentId, $today]);

        return (bool) $stmt->fetchColumn();
    }

    private function sentToday(string $type, int $id, string $today): int
    {
        $stmt = $this->pdo->prepare(
            'SELECT COUNT(*) FROM quick_match_dispatches
             WHERE provider_type = ? AND provider_id = ? AND sent_on = ?'
        );
        $stmt->execute([$type, $id, $today]);

        return (int) $stmt->fetchColumn();
    }

    private function alreadyDispatched(int $studentId, string $type, int $id): bool
    {
        $stmt = $this->pdo->prepare(
            'SELECT 1 FROM quick_match_dispatches
             WHERE student_id = ? AND provider_type = ? AND provider_id = ? LIMIT 1'
        );
        $stmt->execute([$studentId, $type, $id]);

        return (bool) $stmt->fetchColumn();
    }

    private function pairBlocked(int $low, int $high): bool
    {
        $stmt = $this->pdo->prepare(
            'SELECT 1 FROM message_threads t
             INNER JOIN message_thread_participant_state s ON s.thread_id = t.id AND s.is_blocked = 1
             WHERE t.participant_low_user_id = ? AND t.participant_high_user_id = ?
             LIMIT 1'
        );
        $stmt->execute([$low, $high]);

        return (bool) $stmt->fetchColumn();
    }

    private function recordRun(int $studentId, string $trigger, string $today, int $matched, int $sent): void
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO quick_match_student_runs (student_id, trigger_kind, run_on, matched_count, sent_count)
             VALUES (?, ?, ?, ?, ?)'
        );
        $stmt->execute([$studentId, $trigger, $today, $matched, $sent]);
    }
}
