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

        // 기본등록 완료 = 카드 노출(rejudgeExposure). 회원 공개·숨김 동작은 없다(숨김은 관리자 페이지만).
        return match ($action) {
            'update'  => $this->update($guardianUserId, $studentId, $input),
            default   => throw new InvalidArgumentException('지원하지 않는 요청입니다.'),
        };
    }

    /** @param array<string, mixed> $input */
    private function update(int $guardianUserId, int $studentId, array $input): array
    {
        if (isset($input['patch']) && is_array($input['patch'])) {
            /** @var array<string, mixed> $patch */
            $patch = $input['patch'];
        } else {
            $patch = $input;
            unset($patch['id'], $patch['action']);
        }

        $this->repo->transaction(function () use ($guardianUserId, $studentId, $patch): void {
            $this->repo->patchStudent($studentId, $patch);
            $this->rejudgeExposure($guardianUserId, $studentId);
        });
        $updated = $this->repo->getForGuardian($guardianUserId, $studentId);

        return ['student' => $updated ?? []];
    }

    /**
     * 수정 직후 기본정보 완료 기준으로 노출 상태를 다시 맞춘다.
     * published + 빈칸 → draft, draft + 완료 → published. hidden·deleted 는 그대로 둔다.
     */
    private function rejudgeExposure(int $guardianUserId, int $studentId): void
    {
        $current = $this->repo->getForGuardian($guardianUserId, $studentId);
        if ($current === null) {
            return;
        }
        $status = (string) ($current['exposure_status'] ?? '');
        $complete = StudentBasicCompleteness::isComplete($current);
        if ($status === 'published' && !$complete) {
            $this->repo->transitionExposureStatus($studentId, 'published', 'draft');
        } elseif ($status === 'draft' && $complete) {
            $this->repo->transitionExposureStatus($studentId, 'draft', 'published', date('Y-m-d H:i:s'));
        }
    }
}
