<?php

declare(strict_types=1);

namespace Study114\Paid;

use InvalidArgumentException;
use PDO;
use Study114\Database\Connection;

/**
 * 과외쌤 노출상품 축 SSOT.
 * 키 = 구매 단계 선택 city_id + 기본등록 주력과목 primary_subject_id.
 * 재고·매진·예약대기·카드 소개 완성도로 판정하지 않는다.
 */
final class TutorPositionAxis
{
    private PDO $pdo;

    public function __construct(?PDO $pdo = null)
    {
        $this->pdo = $pdo ?? Connection::get();
    }

    public function columnsReady(): bool
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
        $stmt->execute(['provider_position_subscriptions', 'city_id']);
        $cache = (bool) $stmt->fetchColumn();

        return $cache;
    }

    /**
     * @param array<string, mixed> $input
     * @return array{city_id: int, primary_subject_id: int, city_label: string, subject_label: string}
     */
    public function requireForTutor(int $tutorId, array $input): array
    {
        if (!$this->columnsReady()) {
            throw new InvalidArgumentException(
                'provider_position_subscriptions 과외쌤 축 미적용 — schema 066을 먼저 적용하세요.',
            );
        }
        $cityId = $this->positiveIntOrNull($input['city_id'] ?? null);
        if ($cityId === null) {
            throw new InvalidArgumentException(
                '활동지역 시 1개를 선택해 주세요. (city_id)',
            );
        }
        $this->assertOwnedCity($tutorId, $cityId);
        $subject = $this->resolvePrimarySubject($tutorId);
        $clientSubject = $this->positiveIntOrNull($input['primary_subject_id'] ?? null);
        if ($clientSubject !== null && $clientSubject !== $subject['primary_subject_id']) {
            throw new InvalidArgumentException(
                '주력과목은 기본등록 값으로 자동 연결됩니다. 다른 과목 id는 허용되지 않습니다.',
            );
        }

        return [
            'city_id' => $cityId,
            'primary_subject_id' => $subject['primary_subject_id'],
            'city_label' => $this->cityLabel($cityId),
            'subject_label' => $subject['subject_label'],
        ];
    }

    /**
     * @return array{id: int, sku_code: string, started_on: string, end_exclusive_on: string, duration_type: string, duration_value: int, period_days: int}|null
     */
    public function findActiveOwn(int $tutorId, string $skuCode, int $cityId, int $primarySubjectId): ?array
    {
        return $this->loadActiveOwn($tutorId, $skuCode, $cityId, $primarySubjectId, false);
    }

    /**
     * @return array{id: int, sku_code: string, started_on: string, end_exclusive_on: string, duration_type: string, duration_value: int, period_days: int}|null
     */
    public function lockActiveOwn(int $tutorId, string $skuCode, int $cityId, int $primarySubjectId): ?array
    {
        return $this->loadActiveOwn($tutorId, $skuCode, $cityId, $primarySubjectId, true);
    }

    /**
     * @return array{id: int, sku_code: string, started_on: string, end_exclusive_on: string, duration_type: string, duration_value: int, period_days: int}|null
     */
    private function loadActiveOwn(
        int $tutorId,
        string $skuCode,
        int $cityId,
        int $primarySubjectId,
        bool $forUpdate,
    ): ?array {
        $lock = $forUpdate ? ' FOR UPDATE' : '';
        $stmt = $this->pdo->prepare(
            "SELECT id, sku_code, started_on, end_exclusive_on, duration_type, duration_value, period_days
             FROM provider_position_subscriptions
             WHERE sku_code = ? AND provider_type = 'tutor' AND provider_id = ?
               AND city_id = ? AND primary_subject_id = ?
               AND CURDATE() < end_exclusive_on
             ORDER BY end_exclusive_on DESC, id DESC
             LIMIT 1{$lock}"
        );
        $stmt->execute([$skuCode, $tutorId, $cityId, $primarySubjectId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return is_array($row) ? $row : null;
    }

    private function assertOwnedCity(int $tutorId, int $cityId): void
    {
        $stmt = $this->pdo->prepare(
            'SELECT 1 FROM tutor_regions
             WHERE tutor_id = ? AND region_id = ?
             ORDER BY priority_order ASC, is_primary DESC, id ASC
             LIMIT 1'
        );
        $stmt->execute([$tutorId, $cityId]);
        if (!$stmt->fetchColumn()) {
            throw new InvalidArgumentException(
                '선택한 시는 이 과외쌤의 활동지역 1·2·3에 없습니다.',
            );
        }
    }

    /**
     * @return array{primary_subject_id: int, subject_label: string}
     */
    private function resolvePrimarySubject(int $tutorId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT subject_master_id, subject_name
             FROM tutor_subject_targets
             WHERE tutor_id = ? AND is_primary = 1 AND subject_master_id IS NOT NULL
             ORDER BY id ASC
             LIMIT 1'
        );
        $stmt->execute([$tutorId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        $masterId = is_array($row) ? (int) ($row['subject_master_id'] ?? 0) : 0;
        if ($masterId <= 0) {
            throw new InvalidArgumentException(
                '기본등록 주력과목 1개가 없습니다. 선택형 주력과목을 저장한 뒤 구매해 주세요.',
            );
        }

        return [
            'primary_subject_id' => $masterId,
            'subject_label' => is_array($row) ? (string) ($row['subject_name'] ?? '') : '',
        ];
    }

    private function cityLabel(int $cityId): string
    {
        $stmt = $this->pdo->prepare(
            'SELECT COALESCE(NULLIF(sido_name, ""), NULLIF(sigungu_name, ""), NULLIF(dong_name, ""), CAST(id AS CHAR))
             FROM regions WHERE id = ? LIMIT 1'
        );
        $stmt->execute([$cityId]);
        $val = $stmt->fetchColumn();

        return $val !== false ? (string) $val : ('시 #' . $cityId);
    }

    private function positiveIntOrNull(mixed $raw): ?int
    {
        if ($raw === null || $raw === '') {
            return null;
        }
        $n = (int) $raw;

        return $n > 0 ? $n : null;
    }
}
