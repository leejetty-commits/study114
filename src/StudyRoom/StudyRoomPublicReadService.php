<?php

declare(strict_types=1);

namespace Study114\StudyRoom;

use PDO;
use Study114\Media\StudyRoomDefaultImageService;

/**
 * 공개 마이샵용 공부방 읽기 — 기본정보·상세1·상세2 입력값만.
 * 쪽지 설정 UI·등록점검·노출등급·진행률 제외. inquiry_status는 상태 표시용만.
 */
final class StudyRoomPublicReadService
{
    public function __construct(private readonly PDO $pdo)
    {
    }

    /**
     * @return array<string, mixed>|null
     */
    public function getPublishedById(int $roomId): ?array
    {
        if ($roomId <= 0) {
            return null;
        }

        $latExpr = $this->columnExists('study_rooms', 'latitude') ? 'sr.latitude' : 'NULL';
        $lngExpr = $this->columnExists('study_rooms', 'longitude') ? 'sr.longitude' : 'NULL';
        // 검색 노출과 동일: published + expanded_complete (+ deleted_at NULL)
        $completeClause = $this->columnExists('study_rooms', 'detail_completion_status')
            ? "AND sr.detail_completion_status = 'expanded_complete'"
            : '';

        $stmt = $this->pdo->prepare(
            "SELECT sr.id, sr.study_room_name, sr.slogan, sr.intro_short, sr.intro_long,
                    sr.main_subject_note, sr.feature_1, sr.feature_2, sr.feature_3,
                    sr.teaching_style, sr.lesson_place_type, sr.capacity_per_time,
                    sr.lesson_operation_type, sr.price_amount, sr.facility_note,
                    sr.inquiry_status, sr.profile_status, sr.price_description,
                    {$latExpr} AS latitude, {$lngExpr} AS longitude,
                    r.dong_name, r.sigungu_name, c.name AS complex_name,
                    pr.dong_name AS promo_dong_name, pr.sigungu_name AS promo_sigungu_name,
                    pc.name AS promo_complex_name, srr.region_basis_type AS promo_basis
               FROM study_rooms sr
               LEFT JOIN regions r ON sr.region_id = r.id
               LEFT JOIN complexes c ON sr.complex_id = c.id
               LEFT JOIN study_room_regions srr ON srr.study_room_id = sr.id AND srr.is_primary = 1
               LEFT JOIN regions pr ON srr.region_id = pr.id
               LEFT JOIN complexes pc ON srr.complex_id = pc.id
              WHERE sr.id = ?
                AND sr.profile_status = 'published'
                AND sr.deleted_at IS NULL
                {$completeClause}
              LIMIT 1"
        );
        $stmt->execute([$roomId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) {
            return null;
        }

        $gradeBand = $this->audienceLabel($roomId);
        $facilitySummary = $this->facilitySummary($roomId);
        $images = $this->publicImages($roomId);
        $cover = $images[0]['image_path'] ?? '';
        $extra = $this->decodeLessonExtra((string) ($row['price_description'] ?? ''));
        $classes = $this->publicClasses($extra);
        $styleNote = '';
        $styleIds = [];
        if (is_array($extra)) {
            $styleNote = trim((string) ($extra['teaching_style_note'] ?? ''));
            if (is_array($extra['teaching_style_ids'] ?? null)) {
                $styleIds = array_values(array_map('strval', $extra['teaching_style_ids']));
            }
        }
        if ($styleNote === '' && $this->columnExists('study_rooms', 'teaching_style_note')) {
            $styleNote = trim((string) ($this->scalarTeachingStyleNote($roomId) ?? ''));
        }
        $monthlyFee = '';
        if (is_array($extra) && isset($extra['monthly_fee_manwon'])) {
            $monthlyFee = (string) $extra['monthly_fee_manwon'];
        }

        return [
            'id'                    => (int) $row['id'],
            'study_room_name'       => (string) ($row['study_room_name'] ?? ''),
            'slogan'                => (string) ($row['slogan'] ?? ''),
            'intro_short'           => (string) ($row['intro_short'] ?? ''),
            'intro_long'            => (string) ($row['intro_long'] ?? ''),
            'main_subject_note'     => (string) ($row['main_subject_note'] ?? ''),
            'grade_band'            => $gradeBand,
            'location_label'        => $this->promoRegionLabel($row),
            'feature_1'             => (string) ($row['feature_1'] ?? ''),
            'feature_2'             => (string) ($row['feature_2'] ?? ''),
            'feature_3'             => (string) ($row['feature_3'] ?? ''),
            'teaching_style'        => (string) ($row['teaching_style'] ?? ''),
            'teaching_style_ids'    => $styleIds,
            'teaching_style_note'   => $styleNote,
            'lesson_place_type'     => $row['lesson_place_type'] ?? null,
            'capacity_per_time'     => $row['capacity_per_time'] ?? null,
            'lesson_operation_type' => $row['lesson_operation_type'] ?? null,
            'price_amount'          => $row['price_amount'] !== null ? (int) $row['price_amount'] : null,
            'monthly_fee_manwon'    => $monthlyFee,
            'facility_summary'      => $facilitySummary !== ''
                ? $facilitySummary
                : trim((string) ($row['facility_note'] ?? '')),
            'facility_note'         => (string) ($row['facility_note'] ?? ''),
            'inquiry_status'        => (string) ($row['inquiry_status'] ?? ''),
            'latitude'              => $row['latitude'] !== null ? (float) $row['latitude'] : null,
            'longitude'             => $row['longitude'] !== null ? (float) $row['longitude'] : null,
            'image_path'            => $cover,
            'image_path_prime'      => $cover,
            'image_path_basic'      => $cover,
            'images'                => $images,
            'gallery'               => array_map(
                static fn (array $img): string => (string) $img['image_path'],
                $images
            ),
            'classes'               => $classes,
        ];
    }

    private function audienceLabel(int $roomId): string
    {
        try {
            $stmt = $this->pdo->prepare(
                "SELECT GROUP_CONCAT(
                    CASE srpa.school_level
                      WHEN 'preschool' THEN '미취학'
                      WHEN 'elementary' THEN '초등'
                      WHEN 'middle' THEN '중등'
                      WHEN 'high' THEN '고등'
                      WHEN 'n_su' THEN 'N수'
                    END
                    ORDER BY FIELD(srpa.school_level, 'preschool','elementary','middle','high','n_su')
                    SEPARATOR ' '
                 )
                 FROM study_room_primary_audiences srpa
                 WHERE srpa.study_room_id = ?"
            );
            $stmt->execute([$roomId]);
            $val = $stmt->fetchColumn();

            return $val !== false ? trim((string) $val) : '';
        } catch (\Throwable) {
            return '';
        }
    }

    private function facilitySummary(int $roomId): string
    {
        try {
            $stmt = $this->pdo->prepare(
                'SELECT fm.facility_name FROM study_room_facilities srf
                 JOIN facility_masters fm ON fm.id = srf.facility_id
                 WHERE srf.study_room_id = ? ORDER BY fm.sort_order ASC LIMIT 5'
            );
            $stmt->execute([$roomId]);
            $names = $stmt->fetchAll(PDO::FETCH_COLUMN);

            return implode('·', array_map('strval', $names));
        } catch (\Throwable) {
            return '';
        }
    }

    /**
     * @return list<array{image_type: string, image_path: string, sort_order: int}>
     */
    private function publicImages(int $roomId): array
    {
        try {
            $stmt = $this->pdo->prepare(
                "SELECT image_type, image_path, sort_order,
                        original_filename,
                        COALESCE(prime_1280_path, '') AS prime_1280_path,
                        COALESCE(basic_720_path, '') AS basic_720_path,
                        COALESCE(is_system_default, 0) AS is_system_default
                   FROM study_room_images
                  WHERE study_room_id = ?
                  ORDER BY (image_type = 'cover') DESC, sort_order ASC, id ASC
                  LIMIT 12"
            );
            $stmt->execute([$roomId]);
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (\Throwable) {
            try {
                $stmt = $this->pdo->prepare(
                    "SELECT image_type, image_path, sort_order, original_filename
                       FROM study_room_images
                      WHERE study_room_id = ?
                      ORDER BY (image_type = 'cover') DESC, sort_order ASC, id ASC
                      LIMIT 12"
                );
                $stmt->execute([$roomId]);
                $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            } catch (\Throwable) {
                return [];
            }
        }

        $out = [];
        foreach ($rows as $img) {
            if ((int) ($img['is_system_default'] ?? 0) === 1) {
                continue;
            }
            if ((string) ($img['original_filename'] ?? '') === StudyRoomDefaultImageService::MARKER_FILENAME) {
                continue;
            }
            $path = trim((string) ($img['prime_1280_path'] ?? ''));
            if ($path === '') {
                $path = trim((string) ($img['basic_720_path'] ?? ''));
            }
            if ($path === '') {
                $path = trim((string) ($img['image_path'] ?? ''));
            }
            if ($path === '') {
                continue;
            }
            $out[] = [
                'image_type'  => (string) ($img['image_type'] ?? 'other'),
                'image_path'  => $path,
                'sort_order'  => (int) ($img['sort_order'] ?? 0),
            ];
        }

        return $out;
    }

    /**
     * @param array<string, mixed>|null $extra
     * @return list<array{class_name: string, subject_label: string, monthly_fee: string}>
     */
    private function publicClasses(?array $extra): array
    {
        if (!is_array($extra)) {
            return [];
        }
        $classes = [];
        if (is_array($extra['classes'] ?? null)) {
            foreach ($extra['classes'] as $cls) {
                if (!is_array($cls)) {
                    continue;
                }
                $name = trim((string) ($cls['class_name'] ?? $cls['name'] ?? ''));
                $subject = trim((string) ($cls['subject_label'] ?? $cls['subject'] ?? ''));
                $fee = trim((string) ($cls['monthly_fee'] ?? $cls['fee'] ?? ''));
                if ($name === '' && $subject === '' && $fee === '') {
                    continue;
                }
                $classes[] = [
                    'class_name'     => $name,
                    'subject_label'  => $subject,
                    'monthly_fee'    => $fee,
                ];
            }
        }

        return $classes;
    }

    /**
     * @return array<string, mixed>|null
     */
    private function decodeLessonExtra(string $raw): ?array
    {
        $raw = trim($raw);
        if ($raw === '' || $raw[0] !== '{') {
            return null;
        }
        try {
            $decoded = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
        } catch (\Throwable) {
            return null;
        }

        return is_array($decoded) ? $decoded : null;
    }

    /** @param array<string, mixed> $row */
    private function promoRegionLabel(array $row): string
    {
        $parts = array_filter([
            (string) ($row['promo_sigungu_name'] ?? ''),
            (string) ($row['promo_dong_name'] ?? ''),
            (string) ($row['promo_complex_name'] ?? ''),
        ], static fn (string $v): bool => $v !== '');
        if ($parts !== []) {
            return implode(' · ', $parts);
        }
        $fallback = array_filter([
            (string) ($row['sigungu_name'] ?? ''),
            (string) ($row['dong_name'] ?? ''),
            (string) ($row['complex_name'] ?? ''),
        ], static fn (string $v): bool => $v !== '');

        return implode(' · ', $fallback);
    }

    private function scalarTeachingStyleNote(int $roomId): ?string
    {
        try {
            $stmt = $this->pdo->prepare('SELECT teaching_style_note FROM study_rooms WHERE id = ? LIMIT 1');
            $stmt->execute([$roomId]);
            $val = $stmt->fetchColumn();

            return $val !== false ? (string) $val : null;
        } catch (\Throwable) {
            return null;
        }
    }

    private function columnExists(string $table, string $column): bool
    {
        try {
            $stmt = $this->pdo->prepare(
                'SELECT 1 FROM information_schema.COLUMNS
                  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1'
            );
            $stmt->execute([$table, $column]);

            return (bool) $stmt->fetchColumn();
        } catch (\Throwable) {
            return false;
        }
    }
}
