<?php

declare(strict_types=1);

namespace Study114\Paid;

use PDO;
use PDOException;

/**
 * 픽·프라임 구매 필수 항목. id·판정은 preview/shared/pickprime-requirements.js 와 같다.
 */
final class TierRequirement
{
    /** @var list<string> */
    public const TUTOR_PICK_IDS = ['school_or_career', 'main_material_note', 'teaching_style_badges'];

    /** @var list<string> */
    public const TUTOR_PRIME_IDS = [
        'school_or_career',
        'main_material_note',
        'teaching_style_badges',
        'intro_long',
        'feature_2',
        'feature_3',
    ];

    /** @var list<string> */
    public const ROOM_PICK_IDS = ['cover', 'intro_short', 'fee', 'teaching_style'];

    /** @var list<string> */
    public const ROOM_PRIME_IDS = [
        'cover',
        'intro_short',
        'intro_long',
        'teaching_style',
        'teaching_style_note',
        'fee',
        'lessons_per_week',
        'feature_1',
    ];

    /** @var array<string, string> */
    private const TUTOR_LABELS = [
        'school_or_career' => '학교·학과 또는 경력',
        'main_material_note' => '주교재',
        'teaching_style_badges' => '강의스타일',
        'intro_long' => '상세 소개',
        'feature_2' => '특징 2',
        'feature_3' => '특징 3',
    ];

    /** @var array<string, string> */
    private const ROOM_LABELS = [
        'cover' => '대표사진',
        'intro_short' => '한 줄 소개',
        'fee' => '월 평균 수업료',
        'teaching_style' => '수업 스타일',
        'intro_long' => '공부방 소개 / 자랑',
        'teaching_style_note' => '수업 스타일 추가설명',
        'lessons_per_week' => '주 회수',
        'feature_1' => '경력특징 1',
    ];

    /** @var array<string, string> */
    private const TUTOR_STYLES = [
        'passion' => '열정',
        'meticulous' => '꼼꼼',
        'kind' => '친절',
        'from_basics' => '기초부터',
        'advanced_focus' => '고난이도',
        'concept_focus' => '개념중심',
        'solution_focus' => '풀이중심',
    ];

    /** @var array<string, string> */
    private const ROOM_STYLES = [
        'kind' => '친절',
        'meticulous' => '꼼꼼',
        'taciturn' => '과묵',
        'comprehension' => '이해력',
        'problem_solving' => '문제풀이형',
        'concept_focus' => '개념중심',
        'advanced_focus' => '고난이도',
        'pinpoint' => '족집게',
        'patient' => '인내형',
        'attentive' => '경청형',
        'solution_notes' => '풀이필기중점',
        'textbook_focus' => '교과서중심',
        'mock_exam' => '모의고사풀이',
    ];

    /** @var list<string> */
    private const CAREER_BANDS = ['y1_3', 'y4_6', 'y7_10', 'y10_plus'];

    public static function blockMessage(string $tier): string
    {
        $name = $tier === 'prime' ? '프라임' : '픽';

        return $name . ' 정보 부족 · 등록점검에서 남은 항목을 채우면 구매가 열립니다';
    }

    /**
     * @param 'tutor'|'study_room' $providerType
     * @param 'pick'|'prime' $tier
     * @return list<array{id: string, label: string}>
     */
    public static function missingFor(PDO $pdo, string $providerType, int $id, string $tier): array
    {
        if ($providerType === 'tutor') {
            return self::missingFromRecord('tutor', $tier, self::loadTutor($pdo, $id));
        }
        if ($providerType === 'study_room') {
            return self::missingFromRecord('study_room', $tier, self::loadRoom($pdo, $id));
        }

        return [];
    }

    /**
     * @param 'tutor'|'study_room' $providerType
     * @param 'pick'|'prime' $tier
     * @param array<string, mixed> $record
     * @return list<array{id: string, label: string}>
     */
    public static function missingFromRecord(string $providerType, string $tier, array $record): array
    {
        $ids = self::idsFor($providerType, $tier);
        $labels = $providerType === 'tutor' ? self::TUTOR_LABELS : self::ROOM_LABELS;
        $missing = [];
        foreach ($ids as $fieldId) {
            if (self::filled($providerType, $fieldId, $record)) {
                continue;
            }
            $missing[] = [
                'id' => $fieldId,
                'label' => $labels[$fieldId] ?? $fieldId,
            ];
        }

        return $missing;
    }

    /**
     * @param 'tutor'|'study_room' $providerType
     * @param 'pick'|'prime' $tier
     * @return list<string>
     */
    public static function idsFor(string $providerType, string $tier): array
    {
        if ($providerType === 'tutor') {
            return $tier === 'prime' ? self::TUTOR_PRIME_IDS : self::TUTOR_PICK_IDS;
        }

        return $tier === 'prime' ? self::ROOM_PRIME_IDS : self::ROOM_PICK_IDS;
    }

    /**
     * @param array<string, mixed> $record
     */
    private static function filled(string $providerType, string $fieldId, array $record): bool
    {
        if ($providerType === 'tutor') {
            return self::tutorFilled($fieldId, $record);
        }

        return self::roomFilled($fieldId, $record);
    }

    /** @param array<string, mixed> $record */
    private static function tutorFilled(string $fieldId, array $record): bool
    {
        if ($fieldId === 'school_or_career') {
            return self::text($record['university_name'] ?? '') !== ''
                || in_array(self::text($record['career_year_band'] ?? ''), self::CAREER_BANDS, true);
        }
        if ($fieldId === 'teaching_style_badges') {
            return self::knownCount($record['teaching_style_badges'] ?? [], self::TUTOR_STYLES) >= 1;
        }

        return self::text($record[$fieldId] ?? '') !== '';
    }

    /** @param array<string, mixed> $record */
    private static function roomFilled(string $fieldId, array $record): bool
    {
        return match ($fieldId) {
            'cover' => self::roomCoverFilled($record),
            'intro_short', 'intro_long', 'teaching_style_note', 'feature_1' => self::text($record[$fieldId] ?? '') !== '',
            'teaching_style' => self::roomStyles($record) !== [],
            'fee' => self::roomFeeFilled($record),
            'lessons_per_week' => self::weeklyLabel($record['lessons_per_week'] ?? '') !== '',
            default => false,
        };
    }

    /** @param array<string, mixed> $record */
    private static function roomCoverFilled(array $record): bool
    {
        $images = is_array($record['images'] ?? null) ? $record['images'] : [];
        foreach ($images as $img) {
            if (!is_array($img)) {
                continue;
            }
            if (self::text($img['image_type'] ?? '') !== 'cover') {
                continue;
            }
            if (self::isBrandOrSystemDefault($img)) {
                continue;
            }
            if (self::photoSrc($img) !== '') {
                return true;
            }
        }

        return false;
    }

    /** @param array<string, mixed> $img */
    private static function isBrandOrSystemDefault(array $img): bool
    {
        $flag = $img['is_system_default'] ?? null;
        if ($flag === true || $flag === 1 || $flag === '1') {
            return true;
        }
        $src = self::photoSrc($img);
        if ($src === '') {
            return true;
        }
        if (preg_match('/room-card-default-(basic|pick|prime)/i', $src) === 1) {
            return true;
        }
        if (preg_match('/study114[_-]default/i', $src) === 1) {
            return true;
        }
        $marker = self::text($img['original_filename'] ?? ($img['name'] ?? ''));
        if ($marker !== '' && preg_match('/default/i', $marker) === 1 && preg_match('/system|brand|room-card/i', $marker) === 1) {
            return true;
        }

        return false;
    }

    /** @param array<string, mixed> $img */
    private static function photoSrc(array $img): string
    {
        foreach (['basic_720_path', 'prime_1280_path', 'image_path', 'name', 'src'] as $key) {
            $value = self::text($img[$key] ?? '');
            if ($value !== '') {
                return $value;
            }
        }

        return '';
    }

    /**
     * @param array<string, mixed> $record
     * @return list<string>
     */
    private static function roomStyles(array $record): array
    {
        $ids = $record['teaching_style_ids'] ?? [];
        if (is_string($ids)) {
            $ids = $ids === '' ? [] : explode(',', $ids);
        }
        if (!is_array($ids)) {
            $ids = [];
        }
        $ids = array_values(array_filter(array_map(static fn ($id): string => trim((string) $id), $ids), static fn (string $id): bool => $id !== ''));
        if ($ids !== []) {
            $labels = [];
            foreach ($ids as $id) {
                if (isset(self::ROOM_STYLES[$id])) {
                    $labels[] = self::ROOM_STYLES[$id];
                }
            }

            return $labels;
        }
        $raw = self::text($record['teaching_style'] ?? '');
        if ($raw === '') {
            return [];
        }
        $parts = preg_split('/[,|\/]/', $raw) ?: [];
        $labels = [];
        foreach ($parts as $part) {
            $token = trim((string) $part);
            if ($token === '') {
                continue;
            }
            $labels[] = self::ROOM_STYLES[$token] ?? $token;
        }

        return $labels;
    }

    /** @param array<string, mixed> $record */
    private static function roomFeeFilled(array $record): bool
    {
        $price = (int) ($record['price_amount'] ?? 0);
        if ($price > 0 && (int) round($price / 1000) > 0) {
            return true;
        }
        $fee = self::text($record['monthly_fee_manwon'] ?? '');
        if ($fee === '') {
            return false;
        }
        if (preg_match('/(\d+(?:\.\d+)?)\s*만/u', $fee) === 1) {
            return true;
        }
        $n = preg_replace('/천원.*$/u', '', $fee);
        $n = preg_replace('/[^\d.]/', '', (string) $n);

        return $n !== '';
    }

    private static function weeklyLabel(mixed $value): string
    {
        $v = self::text($value);
        if ($v === '') {
            return '';
        }
        if ($v === 'other' || $v === '8') {
            return '기타';
        }
        if (preg_match('/^\d+$/', $v) === 1) {
            $n = (int) $v;
            if ($n >= 1 && $n <= 7) {
                return $n . '회';
            }

            return $n . '회';
        }

        return $v;
    }

    /**
     * @param mixed $badges
     * @param array<string, string> $known
     */
    private static function knownCount(mixed $badges, array $known): int
    {
        if (is_string($badges)) {
            $badges = $badges === '' ? [] : explode(',', $badges);
        }
        if (!is_array($badges)) {
            return 0;
        }
        $n = 0;
        foreach ($badges as $badge) {
            if (isset($known[trim((string) $badge)])) {
                $n++;
            }
        }

        return $n;
    }

    /** @return array<string, mixed> */
    private static function loadTutor(PDO $pdo, int $id): array
    {
        $stmt = $pdo->prepare(
            'SELECT university_name, career_year_band, main_material_note, intro_long, feature_2, feature_3
             FROM tutors WHERE id = ?'
        );
        $stmt->execute([$id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!is_array($row)) {
            $row = [];
        }
        $badges = [];
        try {
            $badgeStmt = $pdo->prepare(
                'SELECT badge_name FROM tutor_teaching_style_badges WHERE tutor_id = ? ORDER BY display_order ASC'
            );
            $badgeStmt->execute([$id]);
            $badges = array_map('strval', $badgeStmt->fetchAll(PDO::FETCH_COLUMN));
        } catch (PDOException) {
            $badges = [];
        }
        $row['teaching_style_badges'] = $badges;

        return $row;
    }

    /** @return array<string, mixed> */
    private static function loadRoom(PDO $pdo, int $id): array
    {
        $stmt = $pdo->prepare(
            'SELECT intro_short, intro_long, feature_1, teaching_style, price_amount,
                    lessons_per_week, teaching_style_ids, teaching_style_note, monthly_fee_manwon
             FROM study_rooms WHERE id = ?'
        );
        $stmt->execute([$id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!is_array($row)) {
            return ['images' => []];
        }
        $row['images'] = self::loadRoomImages($pdo, $id);

        return $row;
    }

    /** @return list<array<string, mixed>> */
    private static function loadRoomImages(PDO $pdo, int $id): array
    {
        try {
            $stmt = $pdo->prepare(
                'SELECT image_type, image_path, original_filename, prime_1280_path, basic_720_path,
                        COALESCE(is_system_default, 0) AS is_system_default
                 FROM study_room_images WHERE study_room_id = ?'
            );
            $stmt->execute([$id]);
        } catch (PDOException) {
            $stmt = $pdo->prepare(
                'SELECT image_type, image_path, original_filename, prime_1280_path, basic_720_path
                 FROM study_room_images WHERE study_room_id = ?'
            );
            $stmt->execute([$id]);
        }
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return is_array($rows) ? $rows : [];
    }

    private static function text(mixed $value): string
    {
        return trim((string) ($value ?? ''));
    }
}

final class TierFieldsMissingException extends \InvalidArgumentException
{
    /** @param list<string> $labels */
    public function __construct(private readonly array $labels, string $message)
    {
        parent::__construct($message);
    }

    /** @return list<string> */
    public function labels(): array
    {
        return $this->labels;
    }
}
