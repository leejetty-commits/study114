<?php

declare(strict_types=1);

namespace Study114\StudyRoom;

use PDO;
use Study114\Media\StudyRoomDefaultImageService;

/**
 * 공개 샵 페이지용 공부방 읽기 — 기본·상세1·상세2 입력값.
 * 문의는 inquiry_status 상태만. 집주소·운영 UI 제외.
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

        $optional = [
            'latitude', 'longitude', 'weekend_available', 'one_on_one_available',
            'card_payment_available', 'cash_receipt_available', 'correction_available',
            'minutes_per_lesson', 'lessons_per_week', 'monthly_fee_manwon',
            'university_name', 'major_name', 'career_years', 'academy_career_years',
            'franchise_flag', 'franchise_name', 'education_office_registered',
            'education_office_reg_no', 'business_registration_available',
            'other_proof_notes', 'youtube_url', 'facebook_url', 'instagram_url',
            'teaching_style_note',
        ];
        $selectExtra = [];
        foreach ($optional as $col) {
            if ($this->columnExists('study_rooms', $col)) {
                $selectExtra[] = "sr.{$col}";
            } else {
                $selectExtra[] = "NULL AS {$col}";
            }
        }
        $extraSql = $selectExtra !== [] ? ', ' . implode(', ', $selectExtra) : '';

        $completeClause = $this->columnExists('study_rooms', 'detail_completion_status')
            ? "AND sr.detail_completion_status = 'expanded_complete'"
            : '';

        $stmt = $this->pdo->prepare(
            "SELECT sr.id, sr.study_room_name, sr.slogan, sr.intro_short, sr.intro_long,
                    sr.main_subject_note, sr.feature_1, sr.feature_2, sr.feature_3,
                    sr.teaching_style, sr.lesson_place_type, sr.capacity_per_time,
                    sr.lesson_operation_type, sr.price_amount, sr.facility_note,
                    sr.inquiry_status, sr.profile_status, sr.price_description
                    {$extraSql},
                    r.dong_name, r.sigungu_name, c.name AS complex_name
               FROM study_rooms sr
               LEFT JOIN regions r ON sr.region_id = r.id
               LEFT JOIN complexes c ON sr.complex_id = c.id
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

        $extra = $this->decodeLessonExtra((string) ($row['price_description'] ?? ''));
        $classes = $this->publicClasses($extra);
        $styleNote = trim((string) ($row['teaching_style_note'] ?? ''));
        $styleIds = [];
        if (is_array($extra)) {
            if ($styleNote === '') {
                $styleNote = trim((string) ($extra['teaching_style_note'] ?? ''));
            }
            if (is_array($extra['teaching_style_ids'] ?? null)) {
                $styleIds = array_values(array_map('strval', $extra['teaching_style_ids']));
            }
            foreach (['minutes_per_lesson', 'lessons_per_week', 'monthly_fee_manwon'] as $k) {
                if (($row[$k] === null || $row[$k] === '') && isset($extra[$k])) {
                    $row[$k] = $extra[$k];
                }
            }
            foreach (['weekend_available', 'one_on_one_available', 'card_payment_available', 'cash_receipt_available', 'correction_available'] as $k) {
                if (($row[$k] === null) && array_key_exists($k, $extra)) {
                    $row[$k] = $extra[$k];
                }
            }
        }

        $monthlyFee = trim((string) ($row['monthly_fee_manwon'] ?? ''));
        if ($monthlyFee === '' && is_array($extra) && isset($extra['monthly_fee_manwon'])) {
            $monthlyFee = (string) $extra['monthly_fee_manwon'];
        }

        $facilityNames = $this->facilityNames($roomId);
        $facilityNote = trim((string) ($row['facility_note'] ?? ''));
        $images = $this->publicImages($roomId);
        $cover = $images[0]['image_path'] ?? '';
        $promoRegions = $this->promoRegions($roomId);
        $locationLabel = $promoRegions[0] ?? $this->fallbackRegionLabel($row);

        return [
            'id'                              => (int) $row['id'],
            'study_room_name'                 => (string) ($row['study_room_name'] ?? ''),
            'slogan'                          => (string) ($row['slogan'] ?? ''),
            'intro_short'                     => (string) ($row['intro_short'] ?? ''),
            'intro_long'                      => (string) ($row['intro_long'] ?? ''),
            'main_subject_note'               => (string) ($row['main_subject_note'] ?? ''),
            'grade_band'                      => $this->audienceLabel($roomId),
            'location_label'                  => $locationLabel,
            'promo_regions'                   => $promoRegions,
            'feature_1'                       => (string) ($row['feature_1'] ?? ''),
            'feature_2'                       => (string) ($row['feature_2'] ?? ''),
            'feature_3'                       => (string) ($row['feature_3'] ?? ''),
            'teaching_style'                  => (string) ($row['teaching_style'] ?? ''),
            'teaching_style_ids'              => $styleIds,
            'teaching_style_note'             => $styleNote,
            'lesson_place_type'               => $row['lesson_place_type'] ?? null,
            'capacity_per_time'               => $row['capacity_per_time'] ?? null,
            'lesson_operation_type'           => $row['lesson_operation_type'] ?? null,
            'minutes_per_lesson'              => $row['minutes_per_lesson'] !== null ? (string) $row['minutes_per_lesson'] : '',
            'lessons_per_week'                => $row['lessons_per_week'] !== null ? (string) $row['lessons_per_week'] : '',
            'price_amount'                    => $row['price_amount'] !== null ? (int) $row['price_amount'] : null,
            'monthly_fee_manwon'              => $monthlyFee,
            'weekend_available'               => $this->asBool($row['weekend_available'] ?? null),
            'one_on_one_available'            => $this->asBool($row['one_on_one_available'] ?? null),
            'card_payment_available'          => $this->asBool($row['card_payment_available'] ?? null),
            'cash_receipt_available'          => $this->asBool($row['cash_receipt_available'] ?? null),
            'correction_available'            => $this->asBool($row['correction_available'] ?? null),
            'university_name'                 => (string) ($row['university_name'] ?? ''),
            'major_name'                      => (string) ($row['major_name'] ?? ''),
            'career_years'                    => $row['career_years'] !== null ? (string) $row['career_years'] : '',
            'academy_career_years'            => $row['academy_career_years'] !== null ? (string) $row['academy_career_years'] : '',
            'franchise_flag'                  => $this->asBool($row['franchise_flag'] ?? null),
            'franchise_name'                  => (string) ($row['franchise_name'] ?? ''),
            'education_office_registered'     => $this->asBool($row['education_office_registered'] ?? null),
            'education_office_reg_no'         => (string) ($row['education_office_reg_no'] ?? ''),
            'business_registration_available' => $this->asBool($row['business_registration_available'] ?? null),
            'other_proof_notes'               => $this->decodeProofNotes($row['other_proof_notes'] ?? null),
            'facility_names'                  => $facilityNames,
            'facility_summary'                => $facilityNames !== [] ? implode('·', $facilityNames) : $facilityNote,
            'facility_note'                   => $facilityNote,
            'youtube_url'                     => (string) ($row['youtube_url'] ?? ''),
            'facebook_url'                    => (string) ($row['facebook_url'] ?? ''),
            'instagram_url'                   => (string) ($row['instagram_url'] ?? ''),
            'inquiry_status'                  => (string) ($row['inquiry_status'] ?? ''),
            'latitude'                        => $row['latitude'] !== null ? (float) $row['latitude'] : null,
            'longitude'                       => $row['longitude'] !== null ? (float) $row['longitude'] : null,
            'image_path'                      => $cover,
            'image_path_prime'                => $cover,
            'image_path_basic'                => $cover,
            'images'                          => $images,
            'gallery'                         => array_map(
                static fn (array $img): string => (string) $img['image_path'],
                $images
            ),
            'classes'                         => $classes,
        ];
    }

    private function asBool(mixed $v): ?bool
    {
        if ($v === null || $v === '') {
            return null;
        }

        return (bool) $v;
    }

    /** @return list<string> */
    private function decodeProofNotes(mixed $raw): array
    {
        if (is_array($raw)) {
            return array_values(array_filter(array_map('strval', $raw)));
        }
        $s = trim((string) $raw);
        if ($s === '') {
            return [];
        }
        if ($s[0] === '[') {
            try {
                $decoded = json_decode($s, true, 512, JSON_THROW_ON_ERROR);

                return is_array($decoded)
                    ? array_values(array_filter(array_map(static fn ($x) => trim((string) $x), $decoded)))
                    : [];
            } catch (\Throwable) {
                return [];
            }
        }

        return [$s];
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

    /** @return list<string> */
    private function facilityNames(int $roomId): array
    {
        try {
            $stmt = $this->pdo->prepare(
                'SELECT fm.facility_name FROM study_room_facilities srf
                 JOIN facility_masters fm ON fm.id = srf.facility_id
                 WHERE srf.study_room_id = ? ORDER BY fm.sort_order ASC LIMIT 12'
            );
            $stmt->execute([$roomId]);

            return array_values(array_map('strval', $stmt->fetchAll(PDO::FETCH_COLUMN)));
        } catch (\Throwable) {
            return [];
        }
    }

    /** @return list<string> */
    private function promoRegions(int $roomId): array
    {
        try {
            $stmt = $this->pdo->prepare(
                "SELECT srr.is_primary, srr.region_basis_type,
                        r.sigungu_name, r.dong_name, c.name AS complex_name
                   FROM study_room_regions srr
                   LEFT JOIN regions r ON srr.region_id = r.id
                   LEFT JOIN complexes c ON srr.complex_id = c.id
                  WHERE srr.study_room_id = ?
                  ORDER BY srr.is_primary DESC, srr.id ASC
                  LIMIT 3"
            );
            $stmt->execute([$roomId]);
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (\Throwable) {
            return [];
        }

        $out = [];
        foreach ($rows as $row) {
            $parts = array_filter([
                (string) ($row['sigungu_name'] ?? ''),
                (string) ($row['dong_name'] ?? ''),
                (string) ($row['complex_name'] ?? ''),
            ], static fn (string $v): bool => $v !== '');
            if ($parts === []) {
                continue;
            }
            $label = implode(' · ', $parts);
            if (!in_array($label, $out, true)) {
                $out[] = $label;
            }
        }

        return $out;
    }

    /** @param array<string, mixed> $row */
    private function fallbackRegionLabel(array $row): string
    {
        $parts = array_filter([
            (string) ($row['sigungu_name'] ?? ''),
            (string) ($row['dong_name'] ?? ''),
            (string) ($row['complex_name'] ?? ''),
        ], static fn (string $v): bool => $v !== '');

        return implode(' · ', $parts);
    }

    /**
     * @return list<array{image_type: string, image_path: string, sort_order: int, title: string}>
     */
    private function publicImages(int $roomId): array
    {
        $hasCaption = $this->columnExists('study_room_images', 'caption');
        $captionCol = $hasCaption ? 'caption' : "'' AS caption";
        try {
            $stmt = $this->pdo->prepare(
                "SELECT image_type, image_path, sort_order,
                        original_filename, {$captionCol},
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
                    "SELECT image_type, image_path, sort_order, original_filename, {$captionCol}
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
                'title'       => trim((string) ($img['caption'] ?? '')),
            ];
        }

        return $out;
    }

    /**
     * @param array<string, mixed>|null $extra
     * @return list<array<string, mixed>>
     */
    private function publicClasses(?array $extra): array
    {
        if (!is_array($extra) || !is_array($extra['classes'] ?? null)) {
            return [];
        }
        $classes = [];
        foreach ($extra['classes'] as $cls) {
            if (!is_array($cls)) {
                continue;
            }
            $name = trim((string) ($cls['class_name'] ?? $cls['name'] ?? ''));
            $subject = trim((string) ($cls['subject_label'] ?? $cls['subject_name'] ?? $cls['subject'] ?? $cls['subject_custom'] ?? ''));
            $fee = trim((string) ($cls['monthly_fee'] ?? $cls['fee'] ?? ''));
            $note = trim((string) ($cls['lesson_note'] ?? ''));
            if ($name === '' && $subject === '' && $fee === '' && $note === '') {
                continue;
            }
            $days = $cls['attendance_days'] ?? [];
            if (!is_array($days)) {
                $days = [];
            }
            $classes[] = [
                'class_name'       => $name,
                'school_level'     => (string) ($cls['school_level'] ?? ''),
                'grade_band'       => (string) ($cls['grade_band'] ?? ''),
                'subject_label'    => $subject,
                'attendance_days'  => array_values(array_map('strval', $days)),
                'lessons_per_week' => (string) ($cls['lessons_per_week'] ?? ''),
                'monthly_fee'      => $fee,
                'fee_note'         => trim((string) ($cls['fee_note'] ?? '')),
                'lesson_note'      => $note,
            ];
        }

        return $classes;
    }

    /** @return array<string, mixed>|null */
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
