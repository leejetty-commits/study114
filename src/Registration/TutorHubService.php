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
     * @param array<string, mixed> $input
     * @return array<string, mixed>
     */
    public function applyAction(int $userId, int $tutorId, string $action, array $input = []): array
    {
        $tutor = $this->repo->getForOwner($userId, $tutorId);
        if ($tutor === null) {
            throw new InvalidArgumentException('과외 프로필을 찾을 수 없습니다.');
        }

        // 기본등록 완료 = 카드 노출. 회원 공개·숨김 동작은 없다(숨김은 관리자 페이지만).
        return match ($action) {
            'inquiry_status' => $this->setInquiry($userId, $tutorId, $input),
            default          => throw new InvalidArgumentException('지원하지 않는 요청입니다.'),
        };
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
}
