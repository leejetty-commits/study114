<?php

declare(strict_types=1);

namespace Study114\Paid;

use PDO;

/**
 * 학생 공개(exposure_status)와 쪽지 수신(memo_status)을 분리한다.
 * 공부방 inquiry_status와 같은 축. exposure_status를 쪽지닫음으로 쓰지 않는다.
 */
final class StudentMemoGate
{
    public function __construct(private readonly PDO $pdo)
    {
    }

    public function hasMemoStatusColumn(): bool
    {
        static $cache = null;
        if ($cache !== null) {
            return $cache;
        }
        $stmt = $this->pdo->prepare(
            'SELECT 1 FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE()
               AND TABLE_NAME = ?
               AND COLUMN_NAME = ?
             LIMIT 1'
        );
        $stmt->execute(['students', 'memo_status']);
        $cache = (bool) $stmt->fetchColumn();

        return $cache;
    }

    /**
     * @return array{
     *   found: bool,
     *   published: bool,
     *   memo_open: bool,
     *   can_contact: bool,
     *   block: string|null
     * }
     */
    public function inspect(int $studentId): array
    {
        if ($studentId <= 0) {
            return [
                'found' => false,
                'published' => false,
                'memo_open' => false,
                'can_contact' => false,
                'block' => '수신 학생을 찾을 수 없습니다.',
            ];
        }
        $sql = 'SELECT exposure_status';
        if ($this->hasMemoStatusColumn()) {
            $sql .= ', memo_status';
        }
        $sql .= ' FROM students WHERE id = ? LIMIT 1';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$studentId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!is_array($row)) {
            return [
                'found' => false,
                'published' => false,
                'memo_open' => false,
                'can_contact' => false,
                'block' => '수신 학생을 찾을 수 없습니다.',
            ];
        }
        $published = ($row['exposure_status'] ?? '') === 'published';
        if (!$this->hasMemoStatusColumn()) {
            return [
                'found' => true,
                'published' => $published,
                'memo_open' => false,
                'can_contact' => false,
                'block' => '학생 쪽지 수신 스키마(063)가 필요합니다.',
            ];
        }
        $memoOpen = ($row['memo_status'] ?? '') === 'open';
        if (!$published) {
            return [
                'found' => true,
                'published' => false,
                'memo_open' => $memoOpen,
                'can_contact' => false,
                'block' => '공개 중이 아닌 학생입니다.',
            ];
        }
        if (!$memoOpen) {
            return [
                'found' => true,
                'published' => true,
                'memo_open' => false,
                'can_contact' => false,
                'block' => '학생이 지금은 쪽지를 받지 않습니다.',
            ];
        }

        return [
            'found' => true,
            'published' => true,
            'memo_open' => true,
            'can_contact' => true,
            'block' => null,
        ];
    }

    public function assertCanContact(int $studentId): void
    {
        $info = $this->inspect($studentId);
        if (!$info['can_contact']) {
            throw new \InvalidArgumentException((string) $info['block']);
        }
    }
}
