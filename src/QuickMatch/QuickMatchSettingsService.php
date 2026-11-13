<?php

declare(strict_types=1);

namespace Study114\QuickMatch;

use PDO;
use Study114\Database\Connection;
use Study114\Paid\PositionPeriodCalculator;
use Study114\Paid\ProviderTicketRepository;

/** 선택 조건 스위치 저장. 필수 조건은 받지 않는다. */
final class QuickMatchSettingsService
{
    public const DAILY_CAP = 20;

    /** 본문에 오면 400. 필수 조건은 등록 정보에서만 읽는다. */
    private const REJECT_BODY_KEYS = [
        'school_level',
        'subject_names',
        'subject_label',
        'preferred_tutor_gender',
        'preferred_fee_amount',
        'preferred_studyroom_fee_amount',
        'preferred_tutor_region_id',
        'preferred_studyroom_region_id',
        'director_age_band',
        'preferred_tutor_age_bands',
        'preferred_director_age_bands',
        'teaching_style_badges',
    ];

    private PDO $pdo;
    private QuickMatchPrimeGate $prime;

    public function __construct(?PDO $pdo = null, ?QuickMatchPrimeGate $prime = null)
    {
        $this->pdo = $pdo ?? Connection::get();
        $this->prime = $prime ?? new QuickMatchPrimeGate(new ProviderTicketRepository($this->pdo));
    }

    /**
     * @return array{type: string, id: int}
     */
    public function ownProvider(int $userId, string $roleType, ?int $requestedId): array
    {
        if ($roleType === 'tutor') {
            $type = 'tutor';
            $sql = 'SELECT id FROM tutors WHERE user_id = ?';
        } elseif ($roleType === 'study_room_owner') {
            $type = 'study_room';
            $sql = 'SELECT id FROM study_rooms WHERE user_id = ?';
        } else {
            throw new QuickMatchHttpException(403, 'forbidden', '공급자 계정만 열 수 있어요.');
        }
        $params = [$userId];
        if ($requestedId !== null && $requestedId > 0) {
            $sql .= ' AND id = ?';
            $params[] = $requestedId;
        }
        $sql .= ' ORDER BY id ASC LIMIT 1';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        $id = $stmt->fetchColumn();
        if ($id === false) {
            throw new QuickMatchHttpException(404, 'not_found', '등록된 프로필이 없어요.');
        }

        return ['type' => $type, 'id' => (int) $id];
    }

    /**
     * @return array<string, mixed>
     */
    public function read(int $userId, string $roleType, ?int $requestedId): array
    {
        $provider = $this->ownProvider($userId, $roleType, $requestedId);
        $prime = $this->prime->isPrimeActive($userId, $provider['type'], $provider['id']);
        $ready = QuickMatchSchema::ready($this->pdo);
        $settings = $ready ? $this->loadSettings($provider['type'], $provider['id']) : null;
        $next = $this->nextChangeAt($settings);
        $canSave = $prime && $ready && $this->saveAllowed($settings);
        $toggles = is_array($settings) ? $settings['toggles'] : [];

        return [
            'prime_active' => $prime,
            'schema_ready' => $ready,
            'provider_type' => $provider['type'],
            'provider_id' => $provider['id'],
            'today_count' => $ready ? $this->todayCount($provider['type'], $provider['id']) : 0,
            'daily_cap' => self::DAILY_CAP,
            'optional_toggles' => $toggles === [] ? new \stdClass() : $toggles,
            'next_change_at' => $next,
            'can_save' => $canSave,
            'notice' => $prime
                ? '프라임 회원 전용 혜택'
                : '프라임에서 함께 제공되고 있는 서비스입니다',
        ];
    }

    /**
     * @param array<string, mixed> $body
     * @return array<string, mixed>
     */
    public function save(int $userId, string $roleType, array $body): array
    {
        foreach (self::REJECT_BODY_KEYS as $key) {
            if (array_key_exists($key, $body)) {
                throw new QuickMatchHttpException(400, 'required_field', '필수 조건은 이 화면에서 바꾸지 않아요.');
            }
        }
        $requested = isset($body['provider_id']) ? (int) $body['provider_id'] : null;
        $provider = $this->ownProvider($userId, $roleType, $requested);
        if (!$this->prime->isPrimeActive($userId, $provider['type'], $provider['id'])) {
            throw new QuickMatchHttpException(403, 'not_prime', '프라임에서 함께 제공되고 있는 서비스입니다.');
        }
        if (!QuickMatchSchema::ready($this->pdo)) {
            throw new QuickMatchHttpException(503, 'schema_missing', '아직 이 기능을 쓸 수 없어요.');
        }
        $toggles = $body['optional_toggles'] ?? [];
        if (!is_array($toggles)) {
            throw new QuickMatchHttpException(400, 'invalid_toggles', '선택 조건 형식을 확인해 주세요.');
        }
        $clean = [];
        foreach ($toggles as $key => $value) {
            $name = (string) $key;
            if (!preg_match('/^[a-z0-9_]{1,40}$/', $name)) {
                throw new QuickMatchHttpException(400, 'invalid_toggles', '선택 조건 이름을 확인해 주세요.');
            }
            if (in_array($name, self::REJECT_BODY_KEYS, true)) {
                throw new QuickMatchHttpException(400, 'required_field', '필수 조건은 이 화면에서 바꾸지 않아요.');
            }
            $clean[$name] = $value ? 1 : 0;
        }
        if ($clean === []) {
            throw new QuickMatchHttpException(400, 'no_toggles', '선택 조건이 없으면 저장하지 않아요.');
        }
        $current = $this->loadSettings($provider['type'], $provider['id']);
        if (!$this->saveAllowed($current)) {
            throw new QuickMatchHttpException(
                409,
                'weekly_lock',
                '이번 주는 이미 저장했어요.',
                ['next_change_at' => $this->nextChangeAt($current)],
            );
        }
        $json = json_encode($clean, JSON_UNESCAPED_UNICODE);
        $now = $this->seoulNow()->format('Y-m-d H:i:s');
        if ($current === null) {
            $stmt = $this->pdo->prepare(
                'INSERT INTO quick_match_provider_settings
                   (provider_type, provider_id, user_id, optional_toggles, first_saved_at, last_changed_at)
                 VALUES (?, ?, ?, ?, ?, ?)'
            );
            $stmt->execute([$provider['type'], $provider['id'], $userId, $json, $now, $now]);
        } else {
            $stmt = $this->pdo->prepare(
                'UPDATE quick_match_provider_settings
                 SET optional_toggles = ?, user_id = ?,
                     first_saved_at = COALESCE(first_saved_at, ?),
                     last_changed_at = ?
                 WHERE provider_type = ? AND provider_id = ?'
            );
            $stmt->execute([$json, $userId, $now, $now, $provider['type'], $provider['id']]);
        }

        return $this->read($userId, $roleType, $provider['id']);
    }

    /** @param array{toggles: array<string, int>, first_saved_at: ?string, last_changed_at: ?string}|null $settings */
    private function saveAllowed(?array $settings): bool
    {
        if ($settings === null || $settings['first_saved_at'] === null || $settings['first_saved_at'] === '') {
            return true;
        }
        $next = $this->nextChangeAt($settings);
        if ($next === null) {
            return true;
        }

        return $this->seoulNow()->format('Y-m-d H:i:s') >= $next;
    }

    private function seoulNow(): \DateTimeImmutable
    {
        return new \DateTimeImmutable('now', PositionPeriodCalculator::timezone());
    }

    /** @param array{toggles: array<string, int>, first_saved_at: ?string, last_changed_at: ?string}|null $settings */
    private function nextChangeAt(?array $settings): ?string
    {
        if ($settings === null || $settings['first_saved_at'] === null || $settings['last_changed_at'] === null) {
            return null;
        }
        try {
            $at = new \DateTimeImmutable((string) $settings['last_changed_at'], PositionPeriodCalculator::timezone());
        } catch (\Exception) {
            return null;
        }

        return $at->modify('+7 days')->format('Y-m-d H:i:s');
    }

    /**
     * @return array{toggles: array<string, int>, first_saved_at: ?string, last_changed_at: ?string}|null
     */
    private function loadSettings(string $type, int $id): ?array
    {
        $stmt = $this->pdo->prepare(
            'SELECT optional_toggles, first_saved_at, last_changed_at
             FROM quick_match_provider_settings
             WHERE provider_type = ? AND provider_id = ? LIMIT 1'
        );
        $stmt->execute([$type, $id]);
        $row = $stmt->fetch();
        if ($row === false) {
            return null;
        }
        $decoded = json_decode((string) $row['optional_toggles'], true);

        return [
            'toggles' => is_array($decoded) ? $decoded : [],
            'first_saved_at' => $row['first_saved_at'] !== null ? (string) $row['first_saved_at'] : null,
            'last_changed_at' => $row['last_changed_at'] !== null ? (string) $row['last_changed_at'] : null,
        ];
    }

    private function todayCount(string $type, int $id): int
    {
        $day = \Study114\Paid\PositionPeriodCalculator::calendarDate();
        $stmt = $this->pdo->prepare(
            'SELECT COUNT(*) FROM quick_match_dispatches
             WHERE provider_type = ? AND provider_id = ? AND sent_on = ?'
        );
        $stmt->execute([$type, $id, $day]);

        return (int) $stmt->fetchColumn();
    }
}
