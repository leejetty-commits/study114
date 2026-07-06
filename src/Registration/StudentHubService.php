<?php

declare(strict_types=1);

namespace Study114\Registration;

use InvalidArgumentException;
use Study114\Database\Connection;

/** 19장 P19 — students 허브 API */
final class StudentHubService
{
    private StudentHubRepository $repo;

    public function __construct(?StudentHubRepository $repo = null)
    {
        $this->repo = $repo ?? new StudentHubRepository(Connection::get());
    }

    /** @return list<array<string, mixed>> */
    public function listForGuardian(int $guardianUserId): array
    {
        return $this->repo->listForGuardian($guardianUserId);
    }

    /** @return array<string, mixed>|null */
    public function get(int $guardianUserId, int $studentId): ?array
    {
        return $this->repo->getForGuardian($guardianUserId, $studentId);
    }

    /**
     * @param array<string, mixed> $input
     * @return array{student: array<string, mixed>}|array{ok: false, reason: string, missing?: list<string>}
     */
    public function applyAction(int $guardianUserId, int $studentId, string $action, array $input = []): array
    {
        $student = $this->repo->getForGuardian($guardianUserId, $studentId);
        if ($student === null) {
            throw new InvalidArgumentException('학생 의뢰를 찾을 수 없습니다.');
        }

        return match ($action) {
            'publish' => $this->publish($guardianUserId, $studentId, $student),
            'hide'    => $this->hide($guardianUserId, $studentId),
            'delete'  => $this->delete($guardianUserId, $studentId),
            'update'  => $this->update($guardianUserId, $studentId, $input),
            default   => throw new InvalidArgumentException('action: publish | hide | delete | update'),
        };
    }

    /** @param array<string, mixed> $student */
    private function publish(int $guardianUserId, int $studentId, array $student): array
    {
        (new \Study114\Auth\EmailVerificationGate())->assertVerified($guardianUserId);

        $missing = $this->publishMissing($student);
        if ($missing !== []) {
            return ['ok' => false, 'reason' => 'incomplete', 'missing' => $missing];
        }
        $this->repo->updateExposureStatus($studentId, 'published', date('Y-m-d H:i:s'));
        $updated = $this->repo->getForGuardian($guardianUserId, $studentId);

        return ['student' => $updated ?? $student];
    }

    private function hide(int $guardianUserId, int $studentId): array
    {
        $this->repo->updateExposureStatus($studentId, 'hidden');
        $updated = $this->repo->getForGuardian($guardianUserId, $studentId);

        return ['student' => $updated ?? []];
    }

    private function delete(int $guardianUserId, int $studentId): array
    {
        $this->repo->softDelete($studentId);

        return ['deleted' => true];
    }

    /** @param array<string, mixed> $input */
    private function update(int $guardianUserId, int $studentId, array $input): array
    {
        /** @var array<string, mixed> $patch */
        $patch = isset($input['patch']) && is_array($input['patch']) ? $input['patch'] : $input;
        $this->repo->patchStudent($studentId, $patch);
        $updated = $this->repo->getForGuardian($guardianUserId, $studentId);

        return ['student' => $updated ?? []];
    }

    /**
     * @param array<string, mixed> $s
     * @return list<string>
     */
    private function publishMissing(array $s): array
    {
        $missing = [];
        $need = static function (bool $ok, string $label) use (&$missing): void {
            if (!$ok) {
                $missing[] = $label;
            }
        };

        $need(!empty($s['public_display_name']), '공개 표시명 (기본등록)');
        $need(!empty($s['grade_level']), '학년 (기본등록)');
        $need(!empty($s['gender']), '학생 성별 (기본등록)');
        $need(!empty($s['birth_year']), '출생연도 (기본등록)');
        $need(!empty($s['preferred_lesson_type']), '희망 유형 (기본등록)');
        $need(!empty($s['region_label']), '희망 지역 (기본등록)');
        $need(!empty($s['subject_label']), '희망 과목 (기본등록)');
        $need(is_array($s['lesson_places']) && $s['lesson_places'] !== [], '희망 수업장소 (기본등록)');
        $need(!empty($s['lesson_format']), '수업형태 (기본등록)');
        $need(!empty($s['lessons_per_week']), '주 횟수 (기본등록)');
        $need(!empty($s['minutes_per_lesson']), '1회 시간 (기본등록)');
        $need(is_array($s['teaching_style_badges']) && $s['teaching_style_badges'] !== [], '희망 강의스타일 (기본등록)');
        if (($s['preferred_lesson_type'] ?? '') === 'study_room') {
            $need(!empty($s['preferred_studyroom_fee_amount']), '수업예산 공부방 (기본등록)');
        } else {
            $need(!empty($s['preferred_fee_amount']), '수업예산 과외 (기본등록)');
        }
        $need(!empty($s['preferred_tutor_gender']), '희망 과외쌤 성별 (상세등록)');

        return $missing;
    }
}
