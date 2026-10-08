<?php

declare(strict_types=1);

namespace Study114\Board;

use PDO;
use Study114\Database\Connection;

/**
 * 역할별 표시 이름 조회.
 * users.name(실명)은 절대 사용하지 않는다.
 */
final class AuthorDisplayNameResolver
{
    private PDO $pdo;

    public function __construct(?PDO $pdo = null)
    {
        $this->pdo = $pdo ?? Connection::get();
    }

    /**
     * @param array{user_id?: int|string, role_type?: string} $auth
     * @return string 빈 문자열이면 표시 이름 미등록
     */
    public function resolve(array $auth): string
    {
        $userId = (int) ($auth['user_id'] ?? $auth['id'] ?? 0);
        if ($userId <= 0) {
            return '';
        }
        $navRole = $this->navRole($auth);

        return match ($navRole) {
            'study_room' => $this->fromStudyRoom($userId),
            'tutor'      => $this->fromTutor($userId),
            'parent'     => $this->fromStudent($userId),
            default      => '',
        };
    }

    /**
     * navRole 판별 — noticeNavRole 방식. 비로그인·미인증 → 'guest'.
     */
    public function navRole(array $auth): string
    {
        if ($auth === []) {
            return 'guest';
        }
        $roleType = (string) ($auth['role_type'] ?? '');

        return match ($roleType) {
            'guardian_student', 'parent', 'student' => 'parent',
            'study_room_owner', 'study_room'        => 'study_room',
            'tutor'                                  => 'tutor',
            'admin'                                  => 'admin',
            default                                  => 'guest',
        };
    }

    private function fromStudyRoom(int $userId): string
    {
        $stmt = $this->pdo->prepare(
            'SELECT operator_display_name, study_room_name FROM study_rooms WHERE user_id = ? ORDER BY id ASC LIMIT 1'
        );
        $stmt->execute([$userId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!is_array($row)) {
            return '';
        }

        $operator = isset($row['operator_display_name']) && is_string($row['operator_display_name'])
            ? trim($row['operator_display_name'])
            : '';
        if ($operator !== '') {
            return $operator;
        }

        $studyRoomName = isset($row['study_room_name']) && is_string($row['study_room_name'])
            ? trim($row['study_room_name'])
            : '';

        return $studyRoomName;
    }

    private function fromTutor(int $userId): string
    {
        $stmt = $this->pdo->prepare(
            'SELECT tutor_display_name FROM tutors WHERE user_id = ? ORDER BY id ASC LIMIT 1'
        );
        $stmt->execute([$userId]);
        $val = $stmt->fetchColumn();

        return is_string($val) ? trim($val) : '';
    }

    private function fromStudent(int $userId): string
    {
        $stmt = $this->pdo->prepare(
            'SELECT public_display_name FROM students WHERE guardian_user_id = ? ORDER BY id ASC LIMIT 1'
        );
        $stmt->execute([$userId]);
        $val = $stmt->fetchColumn();

        return is_string($val) ? trim($val) : '';
    }
}
