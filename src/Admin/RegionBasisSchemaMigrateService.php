<?php

declare(strict_types=1);

namespace Study114\Admin;

use PDO;
use Study114\Database\Connection;
use Throwable;

/**
 * 037 멱등 적용 — 지역등록 기준 타입 + complexes.address 백필
 * 닷홈은 원격 MySQL이 없어 서버 PDO로 적용한다.
 */
final class RegionBasisSchemaMigrateService
{
    private PDO $pdo;

    public function __construct(?PDO $pdo = null)
    {
        $this->pdo = $pdo ?? Connection::get();
    }

    /** @return array<string, mixed> */
    public function status(): array
    {
        $complexCount = 0;
        $withAddress = 0;
        try {
            $complexCount = (int) $this->pdo->query(
                'SELECT COUNT(*) FROM complexes WHERE is_active = 1'
            )->fetchColumn();
            $withAddress = (int) $this->pdo->query(
                "SELECT COUNT(*) FROM complexes
                 WHERE is_active = 1 AND address IS NOT NULL AND TRIM(address) <> ''
                   AND address NOT LIKE '(주소 미등록)%'"
            )->fetchColumn();
        } catch (Throwable) {
            /* table missing */
        }

        return [
            'has_student_basis' => $this->columnExists('students', 'preferred_studyroom_region_basis'),
            'has_study_room_basis' => $this->columnExists('study_rooms', 'region_basis_type'),
            'has_study_room_regions_basis' => $this->columnExists('study_room_regions', 'region_basis_type'),
            'complexes_total' => $complexCount,
            'complexes_with_address' => $withAddress,
            'ready' => $this->columnExists('students', 'preferred_studyroom_region_basis')
                && $this->columnExists('study_rooms', 'region_basis_type')
                && $this->columnExists('study_room_regions', 'region_basis_type')
                && $withAddress > 0,
        ];
    }

    /** @return array<string, mixed> */
    public function apply(): array
    {
        $before = $this->status();
        $steps = [];
        $this->pdo->exec('SET NAMES utf8mb4');

        $steps[] = $this->step('backfill_complex_addresses', function (): string {
            $updated = $this->pdo->exec(
                "UPDATE complexes SET address = CASE name
                  WHEN '은마아파트' THEN '서울특별시 강남구 대치동 316'
                  WHEN '센텀자이' THEN '부산광역시 해운대구 센텀동로 99'
                  WHEN '대치래미안' THEN '서울특별시 강남구 대치동 888'
                  WHEN '잠실주공' THEN '서울특별시 송파구 잠실동 22'
                  WHEN '해운대아이파크' THEN '부산광역시 해운대구 우동 1408'
                  WHEN '래미안대치팰리스' THEN '서울특별시 강남구 대치동 1027'
                  WHEN '대치아이파크' THEN '서울특별시 강남구 대치동 950'
                  WHEN '해운대두산위브' THEN '부산광역시 해운대구 우동 1514'
                  ELSE COALESCE(NULLIF(TRIM(address), ''), CONCAT('(주소 미등록) ', name))
                END
                WHERE address IS NULL OR TRIM(address) = '' OR address LIKE '(주소 미등록)%'"
            );
            return 'updated:' . (string) $updated;
        });

        $steps[] = $this->step('add_student_region_basis', function (): string {
            if ($this->columnExists('students', 'preferred_studyroom_region_basis')) {
                return 'skip';
            }
            $this->pdo->exec(
                "ALTER TABLE students
                 ADD COLUMN preferred_studyroom_region_basis ENUM('dong', 'complex') NULL
                   COMMENT '공부방찾기 지역 기준: 행정동|아파트단지'
                   AFTER preferred_studyroom_complex_id"
            );
            return 'added';
        });

        $steps[] = $this->step('backfill_student_region_basis', function (): string {
            if (!$this->columnExists('students', 'preferred_studyroom_region_basis')) {
                return 'skip';
            }
            $n = $this->pdo->exec(
                "UPDATE students
                 SET preferred_studyroom_region_basis = CASE
                   WHEN preferred_studyroom_complex_id IS NOT NULL THEN 'complex'
                   WHEN preferred_studyroom_region_id IS NOT NULL THEN 'dong'
                   ELSE preferred_studyroom_region_basis
                 END
                 WHERE preferred_studyroom_region_basis IS NULL
                   AND (preferred_studyroom_region_id IS NOT NULL OR preferred_studyroom_complex_id IS NOT NULL)"
            );
            return 'updated:' . (string) $n;
        });

        $steps[] = $this->step('add_study_rooms_basis', function (): string {
            if ($this->columnExists('study_rooms', 'region_basis_type')) {
                return 'skip';
            }
            $this->pdo->exec(
                "ALTER TABLE study_rooms
                 ADD COLUMN region_basis_type ENUM('dong', 'complex') NOT NULL DEFAULT 'dong'
                   COMMENT '노출·기본위치 기준: 행정동|아파트단지'
                   AFTER complex_id"
            );
            return 'added';
        });

        $steps[] = $this->step('backfill_study_rooms_basis', function (): string {
            if (!$this->columnExists('study_rooms', 'region_basis_type')) {
                return 'skip';
            }
            $n = $this->pdo->exec(
                "UPDATE study_rooms
                 SET region_basis_type = 'complex'
                 WHERE complex_id IS NOT NULL AND region_basis_type = 'dong'"
            );
            return 'updated:' . (string) $n;
        });

        $steps[] = $this->step('add_study_room_regions_basis', function (): string {
            if ($this->columnExists('study_room_regions', 'region_basis_type')) {
                return 'skip';
            }
            $this->pdo->exec(
                "ALTER TABLE study_room_regions
                 ADD COLUMN region_basis_type ENUM('dong', 'complex') NOT NULL DEFAULT 'dong'
                   COMMENT '슬롯 기준: 행정동|아파트단지'
                   AFTER complex_id"
            );
            return 'added';
        });

        $steps[] = $this->step('backfill_study_room_regions_basis', function (): string {
            if (!$this->columnExists('study_room_regions', 'region_basis_type')) {
                return 'skip';
            }
            $n = $this->pdo->exec(
                "UPDATE study_room_regions
                 SET region_basis_type = 'complex'
                 WHERE complex_id IS NOT NULL AND region_basis_type = 'dong'"
            );
            return 'updated:' . (string) $n;
        });

        return [
            'before' => $before,
            'after' => $this->status(),
            'steps' => $steps,
        ];
    }

    private function columnExists(string $table, string $column): bool
    {
        $stmt = $this->pdo->prepare(
            'SELECT COUNT(*) FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?'
        );
        $stmt->execute([$table, $column]);
        return (int) $stmt->fetchColumn() > 0;
    }

    /** @param callable(): string $fn */
    private function step(string $name, callable $fn): array
    {
        try {
            return ['name' => $name, 'result' => $fn()];
        } catch (Throwable $e) {
            return ['name' => $name, 'result' => 'error', 'message' => $e->getMessage()];
        }
    }
}
