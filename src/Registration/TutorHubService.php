<?php

declare(strict_types=1);

namespace Study114\Registration;

use InvalidArgumentException;
use Study114\Database\Connection;
use Study114\Tutor\TutorBasicFields;
use Study114\Tutor\TutorDetailCompletionEvaluator;

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
     * @param array<string, mixed> $input
     * @return array<string, mixed>
     */
    public function applyAction(int $userId, int $tutorId, string $action, array $input = []): array
    {
        $tutor = $this->repo->getForOwner($userId, $tutorId);
        if ($tutor === null) {
            throw new InvalidArgumentException('과외 프로필을 찾을 수 없습니다.');
        }

        return match ($action) {
            'publish'        => $this->publish($userId, $tutorId, $tutor),
            'inquiry_status' => $this->setInquiry($userId, $tutorId, $input),
            'delete'         => throw new InvalidArgumentException('지원하지 않는 요청입니다.'),
            default          => throw new InvalidArgumentException('지원하지 않는 요청입니다.'),
        };
    }

    /** @param array<string, mixed> $tutor */
    private function publish(int $userId, int $tutorId, array $tutor): array
    {
        (new \Study114\Auth\EmailVerificationGate())->assertVerified($userId);

        // hydrate(TutorHubRepository)는 pending만 draft로 읽고 hidden은 그대로 둔다.
        if ((string) ($tutor['profile_status'] ?? '') === 'hidden') {
            return ['ok' => false, 'reason' => 'not_allowed'];
        }

        // 공개 직전 필드 SSOT 재계산 — 스텝 통과로 남은 stale expanded_complete / basic_only 제거
        (new TutorDetailCompletionEvaluator())->apply(Connection::get(), $tutorId);
        $tutor = $this->repo->getForOwner($userId, $tutorId) ?? $tutor;

        $missing = $this->publishMissing($tutor);
        if ($missing !== []) {
            return [
                'ok' => false,
                'reason' => 'incomplete',
                'missing' => $missing,
                'detail_missing' => $tutor['detail_missing'] ?? [],
            ];
        }
        $this->repo->setProfileStatus($tutorId, 'published', date('Y-m-d H:i:s'));

        return ['tutor' => $this->repo->getForOwner($userId, $tutorId) ?? $tutor];
    }

    /** @param array<string, mixed> $input */
    private function setInquiry(int $userId, int $tutorId, array $input): array
    {
        $status = (string) ($input['inquiry_status'] ?? '');
        if (!in_array($status, ['open', 'paused', 'not_accepting'], true)) {
            throw new InvalidArgumentException('inquiry_status: open | paused | not_accepting');
        }
        $this->repo->setInquiryStatus($tutorId, $status);

        return ['tutor' => $this->repo->getForOwner($userId, $tutorId) ?? []];
    }

    /**
     * @param array<string, mixed> $tutor
     * @return list<string>
     */
    private function publishMissing(array $tutor): array
    {
        $missing = TutorBasicFields::missingForTutor(Connection::get(), (int) $tutor['id']);
        $need = static function (bool $ok, string $label) use (&$missing): void {
            if (!$ok) {
                $missing[] = $label;
            }
        };

        $need($tutor['detail_completion_status'] === 'expanded_complete', '상세등록 완료');
        $need(!empty($tutor['intro_short']) || !empty($tutor['intro_long']), '소개문');

        return $missing;
    }
}
