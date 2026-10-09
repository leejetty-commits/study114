<?php

declare(strict_types=1);

namespace Study114\Mail;

use PDO;

/**
 * 회원 메일 호칭·역할 배지 — 실명 대신 역할로 부른다 (원장님 / 선생님 / 학생·학부모님).
 * 역할을 모르면 '' (중립 문구).
 */
final class MemberMailRole
{
    public const STUDY_ROOM = 'study_room';
    public const TUTOR = 'tutor';
    public const STUDENT = 'student';

    /** @return ''|'study_room'|'tutor'|'student' */
    public static function normalize(string $roleType): string
    {
        return match (strtolower(trim($roleType))) {
            'study_room_owner', 'study_room' => self::STUDY_ROOM,
            'tutor' => self::TUTOR,
            'guardian_student', 'student', 'parent' => self::STUDENT,
            default => '',
        };
    }

    /** 본문 호칭 */
    public static function address(string $role): string
    {
        return match ($role) {
            self::STUDY_ROOM => '원장님',
            self::TUTOR => '선생님',
            self::STUDENT => '학생·학부모님',
            default => '',
        };
    }

    /** 배지·제목용 역할 이름 */
    public static function label(string $role): string
    {
        return match ($role) {
            self::STUDY_ROOM => '공부방 원장님',
            self::TUTOR => '과외쌤 선생님',
            self::STUDENT => '학생·학부모님',
            default => '',
        };
    }

    /**
     * 배지 색 — tokens.css Role Accent (CTA 버튼은 항상 브랜드 파랑).
     *
     * @return array{fg: string, bg: string}
     */
    public static function accent(string $role): array
    {
        return match ($role) {
            self::STUDY_ROOM => ['fg' => '#266bc4', 'bg' => '#eaf2fc'],
            self::TUTOR => ['fg' => '#0f766e', 'bg' => '#e7f6f3'],
            self::STUDENT => ['fg' => '#6d5bd0', 'bg' => '#f0edff'],
            default => ['fg' => '#4b5563', 'bg' => '#f1f5f9'],
        };
    }

    /** 대표(primary) 활성 역할. 조회 실패·없음이면 '' */
    public static function lookup(PDO $pdo, int $userId): string
    {
        try {
            $stmt = $pdo->prepare(
                'SELECT role_type FROM user_roles
                  WHERE user_id = ? AND status = ?
                  ORDER BY is_primary DESC, id ASC
                  LIMIT 1'
            );
            $stmt->execute([$userId, 'active']);
            $roleType = $stmt->fetchColumn();
        } catch (\Throwable) {
            return '';
        }

        return is_string($roleType) ? self::normalize($roleType) : '';
    }
}
