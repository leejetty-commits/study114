<?php

declare(strict_types=1);

namespace Study114\Registration;

use InvalidArgumentException;
use Study114\Database\Connection;

/** 21장 P21 — tutors 허브 API */
final class TutorHubService
{
    private TutorHubRepository $repo;

    public function __construct(?TutorHubRepository $repo = null)
    {
        $this->repo = $repo ?? new TutorHubRepository(Connection::get());
    }

    /** @return list<array<string, mixed>> */
    public function listForOwner(int $userId): array
    {
        return $this->repo->listForOwner($userId);
    }

    /** @return array<string, mixed>|null */
    public function get(int $userId, int $tutorId): ?array
    {
        return $this->repo->getForOwner($userId, $tutorId);
    }

    /**
     * @return array<string, mixed>
     */
    public function applyAction(int $userId, int $tutorId, string $action): array
    {
        $tutor = $this->repo->getForOwner($userId, $tutorId);
        if ($tutor === null) {
            throw new InvalidArgumentException('과외 프로필을 찾을 수 없습니다.');
        }

        return match ($action) {
            'publish' => $this->publish($userId, $tutorId, $tutor),
            'hide'    => $this->hide($userId, $tutorId),
            'delete'  => $this->delete($tutorId),
            default   => throw new InvalidArgumentException('action: publish | hide | delete'),
        };
    }

    /** @param array<string, mixed> $tutor */
    private function publish(int $userId, int $tutorId, array $tutor): array
    {
        (new \Study114\Auth\EmailVerificationGate())->assertVerified($userId);

        $missing = $this->publishMissing($tutor);
        if ($missing !== []) {
            return ['ok' => false, 'reason' => 'incomplete', 'missing' => $missing];
        }
        $this->repo->setProfileStatus($tutorId, 'published', date('Y-m-d H:i:s'));

        return ['tutor' => $this->repo->getForOwner($userId, $tutorId) ?? $tutor];
    }

    private function hide(int $userId, int $tutorId): array
    {
        $this->repo->setProfileStatus($tutorId, 'hidden');

        return ['tutor' => $this->repo->getForOwner($userId, $tutorId) ?? []];
    }

    private function delete(int $tutorId): array
    {
        $this->repo->softDelete($tutorId);

        return ['deleted' => true];
    }

    /**
     * @param array<string, mixed> $tutor
     * @return list<string>
     */
    private function publishMissing(array $tutor): array
    {
        $missing = [];
        $need = static function (bool $ok, string $label) use (&$missing): void {
            if (!$ok) {
                $missing[] = $label;
            }
        };

        $need(!empty($tutor['tutor_display_name']), '표시명');
        $need($tutor['has_primary_region'] && !empty($tutor['primary_region_label']), '대표 활동 시');
        $need($tutor['has_primary_subject'] && !empty($tutor['main_subject_note']), '주력과목');
        $need($tutor['has_lesson_places'], '강의장소');
        $need(!empty($tutor['preferred_fee_amount']), '과외비');
        $need($tutor['detail_completion_status'] === 'expanded_complete', '상세등록 완료');
        $need($tutor['has_profile_image'], '프로필 이미지');
        $need(!empty($tutor['intro_short']) || !empty($tutor['intro_long']), '소개문');

        return $missing;
    }
}
