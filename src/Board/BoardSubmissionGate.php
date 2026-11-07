<?php

declare(strict_types=1);

namespace Study114\Board;

/**
 * 마이페이지 제출함(board_key=submission) — 2026-11-07 제품 미사용 · 숨김.
 * 코드·테이블은 남기고 화면·API만 닫는다. 완전 삭제는 별도 과제.
 */
final class BoardSubmissionGate
{
    public const RETIRED_MESSAGE = '제출함은 현재 서비스하지 않습니다.';

    public static function isSubmissionBoard(?string $boardKey): bool
    {
        return BoardChannelAcl::normalizeBoardKey((string) $boardKey) === 'submission';
    }

    /** API 입구 — 404로 기능 없음을 알린다 (401=미로그인과 구분). */
    public static function rejectIfSubmission(?string $boardKey = 'submission'): never
    {
        unset($boardKey);
        BoardApi::fail(404, 'not_found', self::RETIRED_MESSAGE);
    }
}
