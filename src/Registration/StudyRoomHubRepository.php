<?php

declare(strict_types=1);

namespace Study114\Registration;

use PDO;
use Study114\Auth\PhoneVerificationService;

/** 20장 P20 — study_rooms 등록 허브 */
final class StudyRoomHubRepository
{
    public function __construct(private readonly PDO $pdo)
    {
    }

    /** @return list<array<string, mixed>> */
    public function listForOwner(int $userId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT sr.* FROM study_rooms sr
             WHERE sr.user_id = ? AND sr.deleted_at IS NULL
             ORDER BY sr.updated_at DESC, sr.id DESC'
        );
        $stmt->execute([$userId]);
        $phoneVerified = $this->phoneVerifiedForUser($userId);

        return array_map(
            fn (array $row) => $this->hydrateRoomRow((int) $row['id'], $row, $phoneVerified),
            $stmt->fetchAll()
        );
    }

    /** @return array<string, mixed>|null */
    public function getForOwner(int $userId, int $roomId): ?array
    {
        $stmt = $this->pdo->prepare(
            'SELECT sr.* FROM study_rooms sr
             WHERE sr.id = ? AND sr.user_id = ? AND sr.deleted_at IS NULL LIMIT 1'
        );
        $stmt->execute([$roomId, $userId]);
        $row = $stmt->fetch();

        return $row !== false
            ? $this->hydrateRoomRow($roomId, $row, $this->phoneVerifiedForUser($userId))
            : null;
    }

    private function phoneVerifiedForUser(int $userId): bool
    {
        return (new PhoneVerificationService())->isVerified($userId);
    }

    public function setProfileStatus(int $roomId, string $status, ?string $publishedAt = null): void
    {
        $stmt = $this->pdo->prepare(
            'UPDATE study_rooms SET profile_status = ?, published_at = COALESCE(?, published_at), updated_at = NOW()
             WHERE id = ?'
        );
        $stmt->execute([$status, $publishedAt, $roomId]);
    }

    public function setInquiryStatus(int $roomId, string $status): void
    {
        $stmt = $this->pdo->prepare(
            'UPDATE study_rooms SET inquiry_status = ?, updated_at = NOW() WHERE id = ?'
        );
        $stmt->execute([$status, $roomId]);
    }

    public function softDelete(int $roomId): void
    {
        $stmt = $this->pdo->prepare(
            'UPDATE study_rooms SET deleted_at = NOW(), profile_status = "hidden", updated_at = NOW() WHERE id = ?'
        );
        $stmt->execute([$roomId]);
    }

    /** @param array<string, mixed> $row @return array<string, mixed> */
    private function hydrateRoomRow(int $roomId, array $row, bool $ownerPhoneVerified = false): array
    {
        $regionLabel = $this->regionLabel($roomId, $row);
        $hasSubjects = $this->exists(
            'SELECT 1 FROM study_room_subject_targets WHERE study_room_id = ? LIMIT 1',
            [$roomId]
        );
        $hasRegions = $this->exists(
            'SELECT 1 FROM study_room_regions WHERE study_room_id = ? LIMIT 1',
            [$roomId]
        ) || !empty($row['region_id']);
        $hasImage = $this->exists(
            'SELECT 1 FROM study_room_images WHERE study_room_id = ? LIMIT 1',
            [$roomId]
        );
        $profileStatus = (string) $row['profile_status'];
        if ($profileStatus === 'pending') {
            $profileStatus = 'draft';
        }

        return [
            'id'                       => $roomId,
            'study_room_name'          => (string) ($row['study_room_name'] ?? ''),
            'profile_status'           => $profileStatus,
            'inquiry_status'           => (string) ($row['inquiry_status'] ?? 'open'),
            'owner_phone_verified'     => $ownerPhoneVerified,
            'detail_completion_status' => (string) ($row['detail_completion_status'] ?? 'basic_only'),
            'region_label'             => $regionLabel,
            'region_id'                => !empty($row['region_id']) ? (string) (int) $row['region_id'] : '',
            'complex_id'               => !empty($row['complex_id']) ? (string) (int) $row['complex_id'] : '',
            'region_basis_type'        => isset($row['region_basis_type']) && in_array((string) $row['region_basis_type'], ['dong', 'complex'], true)
                ? (string) $row['region_basis_type']
                : (!empty($row['complex_id']) ? 'complex' : 'dong'),
            'saved_regions'            => $this->savedRegions($roomId, $row),
            'main_subject_note'        => (string) ($row['main_subject_note'] ?? ''),
            'grade_band'               => $this->gradeBand($roomId),
            'price_amount'             => $row['price_amount'] !== null ? (int) $row['price_amount'] : null,
            'intro_short'              => $row['intro_short'] !== null ? (string) $row['intro_short'] : null,
            'intro_long'               => $row['intro_long'] !== null ? (string) $row['intro_long'] : null,
            'slogan'                   => $row['slogan'] !== null ? (string) $row['slogan'] : null,
            'feature_1'                => $row['feature_1'] !== null ? (string) $row['feature_1'] : null,
            'career_years'             => $row['career_years'] !== null ? (int) $row['career_years'] : null,
            'education_office_registered' => (bool) ($row['education_office_registered'] ?? false),
            'weekend_available'        => (bool) ($row['weekend_available'] ?? false),
            'one_on_one_available'     => (bool) ($row['one_on_one_available'] ?? false),
            'lesson_place_type'        => $row['lesson_place_type'] !== null ? (string) $row['lesson_place_type'] : null,
            'capacity_per_time'        => $row['capacity_per_time'] !== null ? (string) $row['capacity_per_time'] : null,
            'facility_summary'         => $this->facilitySummary($roomId),
            'has_representative_image' => $hasImage,
            'has_subject_targets'      => $hasSubjects,
            'has_regions'              => $hasRegions,
            'lesson_place_set'         => !empty($row['lesson_place_type']),
            // 쪽지·연락 방식은 공개 게이트가 아님. 하위 호환용 플래그만 유지.
            'contact_method_set'       => true,
            // 비교/목록 자격 = 숨김만 제외. 공개(published) 게이트 없음.
            'compare_eligible'         => $profileStatus !== 'hidden',
            'prime_eligible'           => (string) ($row['detail_completion_status'] ?? '') === 'expanded_complete',
            'created_at'               => !empty($row['created_at'])
                ? substr((string) $row['created_at'], 0, 10)
                : null,
            'updated_at'               => gmdate('c', strtotime((string) $row['updated_at'])),
            'published_at'             => $row['published_at'] !== null
                ? gmdate('c', strtotime((string) $row['published_at'])) : null,
            'deleted_at'               => null,
        ];
    }

    /**
     * 공부방 Prime/Pick 적용 시 후보 — region_id / complex_id 선택값.
     * study_room_regions 가 비어 있고 study_rooms.region_id|complex_id 만 있으면 1슬롯으로 합성한다.
     *
     * @param array<string, mixed> $roomRow
     * @return list<array{region_id: string, complex_id: string, region_basis_type: string, region_label: string, is_primary: bool}>
     */
    private function savedRegions(int $roomId, array $roomRow = []): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT srr.region_id, srr.complex_id, srr.region_basis_type, srr.is_primary,
                    r.dong_name, r.sigungu_name, r.sido_name, c.name AS complex_name
             FROM study_room_regions srr
             LEFT JOIN regions r ON srr.region_id = r.id
             LEFT JOIN complexes c ON srr.complex_id = c.id
             WHERE srr.study_room_id = ?
             ORDER BY srr.is_primary DESC, srr.slot ASC, srr.id ASC'
        );
        $stmt->execute([$roomId]);
        $out = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            if (!is_array($row)) {
                continue;
            }
            $regionId = isset($row['region_id']) && (int) $row['region_id'] > 0 ? (string) (int) $row['region_id'] : '';
            $complexId = isset($row['complex_id']) && (int) $row['complex_id'] > 0 ? (string) (int) $row['complex_id'] : '';
            $basis = (string) ($row['region_basis_type'] ?? '') === 'complex' && $complexId !== '' ? 'complex' : 'dong';
            if ($basis === 'dong' && $regionId === '') {
                continue;
            }
            if ($basis === 'complex' && $complexId === '') {
                continue;
            }
            $dong = (string) ($row['dong_name'] ?? '');
            $label = $basis === 'complex'
                ? (string) ($row['complex_name'] ?? '')
                : $dong;
            if ($label === '') {
                $label = $basis === 'complex' ? ('단지 #' . $complexId) : ('행정동 #' . $regionId);
            }
            $out[] = [
                'region_id' => $regionId,
                'complex_id' => $complexId,
                'region_basis_type' => $basis,
                'region_label' => $label,
                'promo_label' => $this->promoLabel(
                    (string) ($row['sido_name'] ?? ''),
                    (string) ($row['sigungu_name'] ?? ''),
                    $dong,
                    (string) ($row['complex_name'] ?? ''),
                    $basis,
                ),
                'is_primary' => (int) ($row['is_primary'] ?? 0) === 1,
            ];
        }

        if ($out !== []) {
            return $out;
        }

        $topRegionId = !empty($roomRow['region_id']) ? (string) (int) $roomRow['region_id'] : '';
        $topComplexId = !empty($roomRow['complex_id']) ? (string) (int) $roomRow['complex_id'] : '';
        if ($topRegionId === '' && $topComplexId === '') {
            return [];
        }
        $basis = $topComplexId !== ''
            && (string) ($roomRow['region_basis_type'] ?? '') === 'complex'
            ? 'complex'
            : ($topComplexId !== '' ? 'complex' : 'dong');
        $this->seedPrimaryRegionIfMissing($roomId, $roomRow, $basis, $topRegionId, $topComplexId);
        $label = $this->regionLabel($roomId, $roomRow);
        if ($label === '') {
            $label = $basis === 'complex' ? ('단지 #' . $topComplexId) : ('행정동 #' . $topRegionId);
        }

        $promo = $this->promoLabelFromRoom($roomId, $basis);

        return [[
            'region_id' => $topRegionId,
            'complex_id' => $basis === 'complex' ? $topComplexId : '',
            'region_basis_type' => $basis,
            'region_label' => $label,
            'promo_label' => $promo !== '' ? $promo : $label,
            'is_primary' => true,
        ]];
    }

    /**
     * Hub 조회 시 study_rooms 대표지역만 있고 study_room_regions 가 비면 1슬롯 INSERT.
     * createOrder assertOwnedByStudyRoom 과 UI 후보를 DB 기준으로 맞춘다.
     *
     * @param array<string, mixed> $roomRow
     */
    private function seedPrimaryRegionIfMissing(
        int $roomId,
        array $roomRow,
        string $basis,
        string $topRegionId,
        string $topComplexId,
    ): void {
        $countStmt = $this->pdo->prepare('SELECT COUNT(*) FROM study_room_regions WHERE study_room_id = ?');
        $countStmt->execute([$roomId]);
        if ((int) $countStmt->fetchColumn() > 0) {
            return;
        }
        $regionId = $topRegionId !== '' ? (int) $topRegionId : null;
        $complexId = ($basis === 'complex' && $topComplexId !== '') ? (int) $topComplexId : null;
        if (($basis === 'dong' && ($regionId === null || $regionId <= 0))
            || ($basis === 'complex' && ($complexId === null || $complexId <= 0))) {
            return;
        }
        try {
            $this->pdo->prepare(
                'INSERT INTO study_room_regions (study_room_id, slot, region_id, complex_id, region_basis_type, is_primary)
                 VALUES (?, 1, ?, ?, ?, 1)'
            )->execute([$roomId, $basis === 'dong' ? $regionId : $regionId, $complexId, $basis]);
        } catch (\PDOException $e) {
            try {
                $this->pdo->prepare(
                    'INSERT INTO study_room_regions (study_room_id, slot, region_id, complex_id, is_primary)
                     VALUES (?, 1, ?, ?, 1)'
                )->execute([$roomId, $regionId, $complexId]);
            } catch (\PDOException $e2) {
                /* race / schema */
            }
        }
    }

    private function promoLabel(string $sido, string $sigungu, string $dong, string $complex, string $basis): string
    {
        $parts = [];
        foreach ([$sido, $sigungu, $dong] as $part) {
            $part = trim($part);
            if ($part !== '') {
                $parts[] = $part;
            }
        }
        $base = implode(' ', $parts);
        $complex = trim($complex);
        if ($basis === 'complex' && $complex !== '') {
            return $base !== '' ? ($base . ' · ' . $complex) : $complex;
        }

        return $base;
    }

    private function promoLabelFromRoom(int $roomId, string $basis): string
    {
        $stmt = $this->pdo->prepare(
            'SELECT r.sido_name, r.sigungu_name, r.dong_name, c.name AS complex_name
             FROM study_rooms sr
             LEFT JOIN regions r ON sr.region_id = r.id
             LEFT JOIN complexes c ON sr.complex_id = c.id
             WHERE sr.id = ? LIMIT 1'
        );
        $stmt->execute([$roomId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!is_array($row)) {
            return '';
        }

        return $this->promoLabel(
            (string) ($row['sido_name'] ?? ''),
            (string) ($row['sigungu_name'] ?? ''),
            (string) ($row['dong_name'] ?? ''),
            (string) ($row['complex_name'] ?? ''),
            $basis,
        );
    }

    /** @param array<string, mixed> $row */
    private function regionLabel(int $roomId, array $row): string
    {
        if (!empty($row['region_id'])) {
            $stmt = $this->pdo->prepare(
                'SELECT CONCAT(r.dong_name, IFNULL(CONCAT(" · ", c.name), ""))
                 FROM study_rooms sr
                 LEFT JOIN regions r ON sr.region_id = r.id
                 LEFT JOIN complexes c ON sr.complex_id = c.id
                 WHERE sr.id = ? LIMIT 1'
            );
            $stmt->execute([$roomId]);
            $val = $stmt->fetchColumn();
            if ($val !== false && $val !== '') {
                return (string) $val;
            }
        }
        $stmt = $this->pdo->prepare(
            'SELECT CONCAT(r.dong_name, IFNULL(CONCAT(" · ", c.name), ""))
             FROM study_room_regions srr
             JOIN regions r ON srr.region_id = r.id
             LEFT JOIN complexes c ON srr.complex_id = c.id
             WHERE srr.study_room_id = ? AND srr.is_primary = 1 LIMIT 1'
        );
        $stmt->execute([$roomId]);
        $val = $stmt->fetchColumn();

        return $val !== false ? (string) $val : '';
    }

    private function gradeBand(int $roomId): ?string
    {
        $stmt = $this->pdo->prepare(
            'SELECT grade_band FROM study_room_subject_targets WHERE study_room_id = ? AND grade_band IS NOT NULL LIMIT 1'
        );
        $stmt->execute([$roomId]);
        $val = $stmt->fetchColumn();

        return $val !== false ? (string) $val : null;
    }

    private function facilitySummary(int $roomId): string
    {
        $stmt = $this->pdo->prepare(
            'SELECT fm.facility_name FROM study_room_facilities srf
             JOIN facility_masters fm ON fm.id = srf.facility_id
             WHERE srf.study_room_id = ? ORDER BY fm.sort_order ASC LIMIT 3'
        );
        $stmt->execute([$roomId]);
        $names = $stmt->fetchAll(PDO::FETCH_COLUMN);

        return implode('·', array_map('strval', $names));
    }

    /** @param list<mixed> $params */
    private function exists(string $sql, array $params): bool
    {
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);

        return (bool) $stmt->fetchColumn();
    }
}
