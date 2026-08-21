<?php

declare(strict_types=1);

namespace Study114\Reviews;

/**
 * 후기 엔진 정책 잠금 (지시문 1).
 * 화면/UX(지시문 2)는 이 상수·에러코드·동작표를 바꾸지 않는다.
 */
final class ReviewPolicy
{
    public const BODY_MIN = 20;
    public const BODY_MAX = 300;
    public const TAGS_MIN = 1;
    public const TAGS_MAX = 3;
    public const MAX_CREATES_PER_TARGET = 3;
    public const SHEET_LIMIT = 5;
    public const SNIPPET_LEN = 48;
    public const PAGE_SIZE = 10;
    public const PAGE_SIZE_MAX = 30;

    public const STATUS_VISIBLE = 'visible';
    public const STATUS_HIDDEN = 'hidden';
    public const STATUS_DELETED = 'deleted';

    public const WRITE_OPEN = 'open';
    public const WRITE_CLOSED = 'closed';

    public const CTA_WRITE = 'write';
    public const CTA_MANAGE = 'manage';
    public const CTA_CLOSED = 'closed';
    public const CTA_INELIGIBLE = 'ineligible';
    public const CTA_BLOCKED = 'blocked';
    public const CTA_NONE = 'none';

    public const ERR_BLOCKED = 'review_blocked';
    public const ERR_CLOSED = 'review_closed';
    public const ERR_QUOTA = 'review_quota';
    public const ERR_NO_THREAD = 'review_no_thread';
    public const ERR_ROLE = 'review_role';
    public const ERR_OWNER = 'review_owner';
    public const ERR_NOT_FOUND = 'review_not_found';
    public const ERR_FORBIDDEN = 'review_forbidden';
    public const ERR_CONSENT = 'review_consent_required';
    public const ERR_VALIDATION = 'validation';

    /** 소비자(학부모/학생)만 공급자 후기를 작성·수정할 수 있다. */
    public static function canAuthorReviews(string $roleType): bool
    {
        return $roleType === 'guardian_student';
    }

    /** @var list<string> */
    public const STUDY_ROOM_TAGS = [
        '공간이 깔끔해요',
        '분위기가 편안해요',
        '상담이 친절해요',
        '답변이 빨라요',
        '정보가 실제와 비슷해요',
        '동네 접근이 편해요',
    ];

    /** @var list<string> */
    public const TUTOR_TAGS = [
        '설명이 쉬워요',
        '꼼꼼해요',
        '숙제 관리가 좋아요',
        '학생을 잘 봐줘요',
        '전문성이 느껴져요',
        '피드백이 빨라요',
    ];

    /** @return list<string> */
    public static function allowedTags(string $providerType): array
    {
        return $providerType === 'tutor' ? self::TUTOR_TAGS : self::STUDY_ROOM_TAGS;
    }

    public static function snippet(string $body): string
    {
        $body = trim($body);
        if (mb_strlen($body) <= self::SNIPPET_LEN) {
            return $body;
        }

        return mb_substr($body, 0, self::SNIPPET_LEN) . '…';
    }

    /**
     * 차단 이후 create / edit / delete 동작표 (지시문 1 §9)
     *
     * | API    | 후기차단 후 | 비고 |
     * | create | 실패        | 추가 생성 불가 |
     * | edit   | 실패        | 본문·태그 수정 불가 |
     * | hide   | 허용        | 작성자 비공개 전환 |
     * | unhide | 실패        | 공개 전환은 수정으로 본다 |
     * | delete | 허용        | 작성자 본인, 쿼터 차감 없음 |
     */
    public static function blockedActionAllowed(string $action): bool
    {
        return $action === 'delete' || $action === 'hide';
    }
}
