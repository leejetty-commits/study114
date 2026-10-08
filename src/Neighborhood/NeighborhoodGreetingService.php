<?php

declare(strict_types=1);

namespace Study114\Neighborhood;

use Study114\Database\Connection;
use Study114\Region\TutorRegionUnit;
use Study114\StudyRoom\StudyRoomPublicReadService;
use Study114\Visibility\WithdrawnOwnerSql;

/** 동네 인사 1차. 파일 저장. 랭킹 가산 없음. */
final class NeighborhoodGreetingService
{
    private const MAX = 80;
    private const TEASER = 20;

    /** 과외쌤 과외지역 1 → 과외 단위 이름(TutorRegionUnit::labelFromRow). regions 별칭은 r. */
    private const TUTOR_UNIT_COLUMNS = 'r.sido_code, r.sido_name, r.sigungu_code, r.sigungu_name, r.unit_level, r.official_code, r.is_active';

    public function __construct(private readonly string $file)
    {
    }

    public static function fromDefaultPath(): self
    {
        return new self(dirname(__DIR__, 2) . '/storage/neighborhood-greetings.json');
    }

    /** @return list<array<string, mixed>> */
    public function listPublic(bool $full): array
    {
        $items = [];
        foreach ($this->read() as $row) {
            if (($row['status'] ?? '') !== 'up') {
                continue;
            }
            $body = (string) ($row['body'] ?? '');
            $name = (string) ($row['display_name'] ?? '');
            $item = [
                'provider_type' => $row['provider_type'],
                'registration_id' => (int) $row['registration_id'],
                'neighborhood' => (string) ($row['neighborhood'] ?? ''),
                'status' => 'up',
                'updated_at' => (int) ($row['updated_at'] ?? 0),
                'masked_name' => self::maskName($name),
                'teaser' => self::teaser($body),
            ];
            if ($full) {
                $item['display_name'] = $name;
                $item['body'] = $body;
            }
            $items[] = $item;
        }
        $items = $this->withoutWithdrawnOwners($items);
        $items = $this->withoutMissingPrimaryRegion($items);
        $welcomeItems = $this->listWelcomeItems($full);
        $items = array_merge($items, $welcomeItems);
        usort($items, static fn (array $a, array $b): int => ($b['updated_at'] <=> $a['updated_at']));
        return $items;
    }

    /**
     * @param array<string, mixed> $input
     * @return array<string, mixed>
     */
    public function save(int $userId, string $roleType, array $input): array
    {
        $action = (string) ($input['action'] ?? '');
        if ($action === 'delete') {
            return $this->delete($userId, $roleType, $input);
        }

        $providerType = ($input['provider_type'] ?? '') === 'tutor' ? 'tutor' : 'study_room';
        $expected = $providerType === 'tutor' ? 'tutor' : 'study_room_owner';
        if ($roleType !== $expected) {
            throw new \InvalidArgumentException('공부방·과외쌤만 인사를 올릴 수 있어요.');
        }
        $registrationId = (int) ($input['registration_id'] ?? 0);
        if ($registrationId < 1) {
            throw new \InvalidArgumentException('기본등록이 연결된 뒤에 올릴 수 있어요.');
        }
        $this->assertOwns($userId, $providerType, $registrationId);
        $statusInput = (string) ($input['status'] ?? 'up');
        $existing = $this->find($providerType, $registrationId);
        if ($statusInput === 'welcome_off') {
            if ($existing !== null) {
                return $existing;
            }
            $pdo = Connection::get();
            $neighborhood = $this->lookupPrimaryDongName($pdo, $providerType, $registrationId);
            $displayName = $this->lookupDisplayName($pdo, $providerType, $registrationId);
            $now = (int) round(microtime(true) * 1000);
            $row = [
                'provider_type' => $providerType,
                'registration_id' => $registrationId,
                'user_id' => $userId,
                'body' => '',
                'neighborhood' => $neighborhood,
                'display_name' => $displayName,
                'status' => 'down',
                'origin' => 'welcome_off',
                'updated_at' => $now,
                'history' => [],
            ];
            $this->upsert($row);
            return $row;
        }

        $status = $statusInput === 'down' ? 'down' : 'up';
        $neighborhood = trim((string) ($input['neighborhood'] ?? ''));
        $displayName = trim((string) ($input['display_name'] ?? ''));
        if ($status === 'down') {
            if ($existing === null) {
                throw new \InvalidArgumentException('올릴 인사가 없어요.');
            }
            $existing['status'] = 'down';
            $existing['updated_at'] = (int) round(microtime(true) * 1000);
            $existing['history'] = self::extractHistory($existing);
            $this->upsert($existing);
            return $existing;
        }
        $body = self::normalize((string) ($input['body'] ?? ''));
        $error = self::validate($body);
        if ($error !== '') {
            throw new \InvalidArgumentException($error);
        }
        if ($neighborhood === '') {
            throw new \InvalidArgumentException('등록된 동네가 있어야 올릴 수 있어요.');
        }

        $historyId = trim((string) ($input['history_id'] ?? ''));
        $now = (int) round(microtime(true) * 1000);
        $history = $existing !== null ? self::extractHistory($existing) : [];

        // 1. 입력에 history_id가 있고 목록에 있으면 그 항목 제거 후 고친 body 로 맨 앞에 삽입 (id 유지)
        $targetId = '';
        if ($historyId !== '') {
            foreach ($history as $idx => $item) {
                if ($item['id'] === $historyId) {
                    $targetId = $item['id'];
                    array_splice($history, $idx, 1);
                    break;
                }
            }
        }

        // 2. 같은 본문이 이미 목록에 있으면 중복 만들지 말고 그 항목 제거 (id 재사용)
        foreach ($history as $idx => $item) {
            if ($item['body'] === $body) {
                if ($targetId === '') {
                    $targetId = $item['id'];
                }
                array_splice($history, $idx, 1);
                break;
            }
        }

        // 3. 없으면 새 id 생성
        if ($targetId === '') {
            $targetId = 'h_' . $now . '_' . bin2hex(random_bytes(3));
        }

        // 맨 앞에 삽입
        array_unshift($history, [
            'id' => $targetId,
            'body' => $body,
            'updated_at' => $now,
        ]);

        // 최대 3개 유지
        $history = array_slice($history, 0, 3);

        $row = [
            'provider_type' => $providerType,
            'registration_id' => $registrationId,
            'user_id' => $userId,
            'body' => $history[0]['body'],
            'neighborhood' => $neighborhood,
            'display_name' => $displayName !== '' ? $displayName : ($providerType === 'tutor' ? '과외쌤' : '공부방'),
            'status' => 'up',
            'updated_at' => $now,
            'history' => $history,
        ];
        $this->upsert($row);
        return $row;
    }

    /**
     * @param array<string, mixed> $input
     * @return array<string, mixed>
     */
    public function delete(int $userId, string $roleType, array $input): array
    {
        $providerType = ($input['provider_type'] ?? '') === 'tutor' ? 'tutor' : 'study_room';
        $expected = $providerType === 'tutor' ? 'tutor' : 'study_room_owner';
        if ($roleType !== $expected) {
            throw new \InvalidArgumentException('공부방·과외쌤만 인사를 지울 수 있어요.');
        }
        $registrationId = (int) ($input['registration_id'] ?? 0);
        if ($registrationId < 1) {
            throw new \InvalidArgumentException('기본등록이 연결된 뒤에 지울 수 있어요.');
        }
        $this->assertOwns($userId, $providerType, $registrationId);
        $historyId = trim((string) ($input['history_id'] ?? ''));
        if ($historyId === '') {
            throw new \InvalidArgumentException('삭제할 인사를 지정해 주세요.');
        }
        $existing = $this->find($providerType, $registrationId);
        if ($existing === null) {
            throw new \InvalidArgumentException('올릴 인사가 없어요.');
        }
        $history = self::extractHistory($existing);
        $foundIndex = -1;
        foreach ($history as $idx => $item) {
            if ($item['id'] === $historyId) {
                $foundIndex = $idx;
                break;
            }
        }
        if ($foundIndex === -1) {
            throw new \InvalidArgumentException('삭제할 인사를 찾을 수 없어요.');
        }

        $wasTop = ($foundIndex === 0);
        $wasUp = ($existing['status'] ?? 'down') === 'up';
        array_splice($history, $foundIndex, 1);

        $now = (int) round(microtime(true) * 1000);
        // 삭제한 항목이 history[0] 이고 status up 이었다면 status 'down'(공개 내림)으로 바꾸고 나머지는 유지
        $newStatus = ($wasTop && $wasUp) ? 'down' : (string) ($existing['status'] ?? 'down');
        $newBody = count($history) > 0 ? (string) $history[0]['body'] : '';

        $row = [
            'provider_type' => $providerType,
            'registration_id' => $registrationId,
            'user_id' => $userId,
            'body' => $newBody,
            'neighborhood' => (string) ($existing['neighborhood'] ?? ''),
            'display_name' => (string) ($existing['display_name'] ?? ''),
            'status' => $newStatus,
            'updated_at' => $now,
            'history' => $history,
        ];
        $this->upsert($row);
        return $row;
    }

    /**
     * @param array<string, mixed> $row
     * @return list<array{id: string, body: string, updated_at: int}>
     */
    public static function extractHistory(array $row): array
    {
        $history = $row['history'] ?? null;
        if (is_array($history) && $history !== []) {
            $result = [];
            foreach ($history as $h) {
                if (!is_array($h)) {
                    continue;
                }
                $body = trim((string) ($h['body'] ?? ''));
                if ($body === '') {
                    continue;
                }
                $id = trim((string) ($h['id'] ?? ''));
                if ($id === '') {
                    $id = 'h_' . ((int) ($h['updated_at'] ?? round(microtime(true) * 1000))) . '_' . substr(md5($body), 0, 6);
                }
                $result[] = [
                    'id' => $id,
                    'body' => $body,
                    'updated_at' => (int) ($h['updated_at'] ?? 0),
                ];
            }
            if ($result !== []) {
                return array_slice($result, 0, 3);
            }
        }

        $body = trim((string) ($row['body'] ?? ''));
        if ($body !== '') {
            $updatedAt = (int) ($row['updated_at'] ?? round(microtime(true) * 1000));
            return [
                [
                    'id' => 'h_' . $updatedAt . '_' . substr(md5($body), 0, 6),
                    'body' => $body,
                    'updated_at' => $updatedAt,
                ],
            ];
        }

        return [];
    }

    /**
     * @return array<string, mixed>|null
     */
    public function getMine(int $userId, string $roleType, string $providerType, int $registrationId): ?array
    {
        $providerType = $providerType === 'tutor' ? 'tutor' : 'study_room';
        $expected = $providerType === 'tutor' ? 'tutor' : 'study_room_owner';
        if ($roleType !== $expected) {
            throw new \InvalidArgumentException('공부방·과외쌤만 인사를 조회할 수 있어요.');
        }
        if ($registrationId < 1) {
            throw new \InvalidArgumentException('기본등록이 연결된 뒤에 조회할 수 있어요.');
        }
        $this->assertOwns($userId, $providerType, $registrationId);
        $existing = $this->find($providerType, $registrationId);
        if ($existing === null) {
            $welcome = $this->welcomeInfoForMine($userId, $providerType, $registrationId);
            if ($welcome !== null) {
                return [
                    'provider_type' => $providerType,
                    'registration_id' => $registrationId,
                    'status' => 'welcome',
                    'body' => '',
                    'neighborhood' => $welcome['neighborhood'],
                    'display_name' => $welcome['display_name'],
                    'updated_at' => $welcome['updated_at'],
                    'history' => [],
                    'origin' => 'welcome',
                    'welcome' => [
                        'active' => true,
                        'd_day' => 'D-' . $welcome['days_left'],
                        'days_left' => $welcome['days_left'],
                    ],
                ];
            }
            return null;
        }
        $history = self::extractHistory($existing);
        return [
            'provider_type' => $existing['provider_type'],
            'registration_id' => (int) $existing['registration_id'],
            'status' => (string) ($existing['status'] ?? 'down'),
            'body' => (string) ($existing['body'] ?? ($history[0]['body'] ?? '')),
            'neighborhood' => (string) ($existing['neighborhood'] ?? ''),
            'display_name' => (string) ($existing['display_name'] ?? ''),
            'updated_at' => (int) ($existing['updated_at'] ?? 0),
            'history' => $history,
            'origin' => (string) ($existing['origin'] ?? ''),
            'welcome' => [
                'active' => false,
            ],
        ];
    }

    public static function normalize(string $text): string
    {
        $text = preg_replace("/[\r\n]+/u", ' ', $text) ?? $text;
        $text = preg_replace('/[ \t]{2,}/u', ' ', $text) ?? $text;
        return trim($text);
    }

    public static function validate(string $body): string
    {
        if ($body === '') {
            return '한 줄을 입력해 주세요.';
        }
        if (mb_strlen($body) > self::MAX) {
            return '80자 이내로 적어 주세요.';
        }
        if (preg_match('/카카오|카톡|오픈채팅|kakao/iu', $body) === 1) {
            return '전화, 카톡, 주소는 넣을 수 없어요.';
        }
        if (preg_match('/https?:\/\/|www\./iu', $body) === 1) {
            return '전화, 카톡, 주소는 넣을 수 없어요.';
        }
        if (preg_match('/\b[\w-]+\.(com|kr|net|me|io|co)\b/iu', $body) === 1) {
            return '전화, 카톡, 주소는 넣을 수 없어요.';
        }
        $compact = preg_replace('/[\s().\-]/u', '', $body) ?? $body;
        if (preg_match('/01[016789]\d{7,8}/', $compact) === 1) {
            return '전화, 카톡, 주소는 넣을 수 없어요.';
        }
        if (preg_match('/0(?:2|[3-6]\d)\d{7,8}/', $compact) === 1) {
            return '전화, 카톡, 주소는 넣을 수 없어요.';
        }
        return '';
    }

    public static function maskName(string $name): string
    {
        $chars = preg_split('//u', trim($name), -1, PREG_SPLIT_NO_EMPTY) ?: [];
        if ($chars === []) {
            return '○○';
        }
        if (count($chars) === 1) {
            return $chars[0] . '○';
        }
        return $chars[0] . str_repeat('○', min(count($chars) - 1, 2));
    }

    public static function teaser(string $body): string
    {
        $chars = preg_split('//u', self::normalize($body), -1, PREG_SPLIT_NO_EMPTY) ?: [];
        if (count($chars) <= self::TEASER) {
            return implode('', $chars);
        }
        return implode('', array_slice($chars, 0, self::TEASER)) . '…';
    }

    /**
     * 베이직카드. 없거나 비공개(hidden)·삭제면 null.
     * draft·published 는 연다.
     *
     * @return array<string, mixed>|null
     */
    public function basicCard(string $providerType, int $registrationId): ?array
    {
        if ($registrationId < 1) {
            return null;
        }
        $pdo = Connection::get();
        if ($providerType === 'tutor') {
            return $this->tutorBasicCard($pdo, $registrationId);
        }
        if (!$this->roomHasPromoSlot1($pdo, $registrationId)) {
            return null;
        }
        return (new StudyRoomPublicReadService($pdo))->getPublishedById($registrationId);
    }

    /** @return array<string, mixed>|null */
    private function tutorBasicCard(\PDO $pdo, int $registrationId): ?array
    {
        $cond = self::tutorCardCondition('t');
        $stmt = $pdo->prepare(
            "SELECT t.id, t.tutor_display_name, t.main_subject_note, t.profile_status,
                    t.preferred_fee_amount, t.lessons_per_week, t.minutes_per_lesson,
                    t.feature_1, t.feature_2, t.feature_3, t.university_name, t.major_name,
                    t.career_year_band, t.intro_short,
                    " . self::TUTOR_UNIT_COLUMNS . "
               FROM tutors t
               LEFT JOIN tutor_regions tr ON tr.tutor_id = t.id AND tr.is_primary = 1
               LEFT JOIN regions r ON r.id = tr.region_id
              WHERE t.id = ?
                AND {$cond}
              LIMIT 1"
        );
        $stmt->execute([$registrationId]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);
        if (!$row) {
            return null;
        }
        $place = TutorRegionUnit::labelFromRow($row);
        return [
            'id' => (int) $row['id'],
            'tutor_display_name' => (string) ($row['tutor_display_name'] ?? ''),
            'main_subject_note' => (string) ($row['main_subject_note'] ?? ''),
            'profile_status' => (string) ($row['profile_status'] ?? ''),
            'preferred_fee_amount' => $row['preferred_fee_amount'] !== null ? (int) $row['preferred_fee_amount'] : null,
            'lessons_per_week' => $row['lessons_per_week'] !== null ? (int) $row['lessons_per_week'] : null,
            'minutes_per_lesson' => $row['minutes_per_lesson'] !== null ? (int) $row['minutes_per_lesson'] : null,
            'feature_1' => (string) ($row['feature_1'] ?? ''),
            'feature_2' => (string) ($row['feature_2'] ?? ''),
            'feature_3' => (string) ($row['feature_3'] ?? ''),
            'university_name' => (string) ($row['university_name'] ?? ''),
            'major_name' => (string) ($row['major_name'] ?? ''),
            'career_year_band' => $row['career_year_band'] ?? null,
            'intro_short' => (string) ($row['intro_short'] ?? ''),
            'location_label' => $place,
        ];
    }

    /**
     * @param list<array<string, mixed>> $items
     * @return list<array<string, mixed>>
     */
    private function withoutMissingPrimaryRegion(array $items): array
    {
        if ($items === []) {
            return [];
        }
        $pdo = Connection::get();
        $kept = [];
        foreach ($items as $item) {
            $id = (int) ($item['registration_id'] ?? 0);
            if ($id < 1) {
                continue;
            }
            $ok = ($item['provider_type'] ?? '') === 'tutor'
                ? $this->tutorHasSlot1($pdo, $id)
                : $this->roomHasPromoSlot1($pdo, $id);
            if ($ok) {
                $kept[] = $item;
            }
        }

        return $kept;
    }

    private function tutorHasSlot1(\PDO $pdo, int $tutorId): bool
    {
        $stmt = $pdo->prepare(
            'SELECT 1 FROM tutor_regions
             WHERE tutor_id = ? AND priority_order = 0
               AND region_id IS NOT NULL AND region_id <> 0
             LIMIT 1'
        );
        $stmt->execute([$tutorId]);

        return $stmt->fetchColumn() !== false;
    }

    private function roomHasPromoSlot1(\PDO $pdo, int $roomId): bool
    {
        $stmt = $pdo->prepare(
            'SELECT 1 FROM study_room_regions
             WHERE study_room_id = ? AND slot = 1
               AND region_id IS NOT NULL AND region_id <> 0
             LIMIT 1'
        );
        $stmt->execute([$roomId]);

        return $stmt->fetchColumn() !== false;
    }

    /**
     * @param list<array<string, mixed>> $items
     * @return list<array<string, mixed>>
     */
    private function withoutWithdrawnOwners(array $items): array
    {
        if ($items === []) {
            return [];
        }
        $roomIds = [];
        $tutorIds = [];
        foreach ($items as $item) {
            $id = (int) ($item['registration_id'] ?? 0);
            if ($id < 1) {
                continue;
            }
            if (($item['provider_type'] ?? '') === 'tutor') {
                $tutorIds[] = $id;
            } else {
                $roomIds[] = $id;
            }
        }
        $aliveRooms = $this->idsWithActiveOwner('study_rooms', 'sr', 'sr.user_id', $roomIds);
        $aliveTutors = $this->idsWithActiveOwner('tutors', 't', 't.user_id', $tutorIds);
        $kept = [];
        foreach ($items as $item) {
            $id = (int) ($item['registration_id'] ?? 0);
            $alive = ($item['provider_type'] ?? '') === 'tutor' ? $aliveTutors : $aliveRooms;
            if (isset($alive[$id])) {
                $kept[] = $item;
            }
        }
        return $kept;
    }

    /**
     * @param list<int> $ids
     * @return array<int, true>
     */
    private function idsWithActiveOwner(string $table, string $alias, string $userIdColumn, array $ids): array
    {
        $ids = array_values(array_unique(array_filter(
            array_map(static fn ($id): int => (int) $id, $ids),
            static fn (int $id): bool => $id > 0,
        )));
        if ($ids === [] || !in_array($table, ['study_rooms', 'tutors'], true)) {
            return [];
        }
        $ownerSql = WithdrawnOwnerSql::notWithdrawn($userIdColumn);
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $stmt = Connection::get()->prepare(
            "SELECT {$alias}.id FROM {$table} {$alias} WHERE {$alias}.id IN ({$placeholders}) AND {$ownerSql}"
        );
        $stmt->execute($ids);
        $alive = [];
        foreach ($stmt->fetchAll(\PDO::FETCH_COLUMN) as $id) {
            $alive[(int) $id] = true;
        }
        return $alive;
    }

    private function assertOwns(int $userId, string $providerType, int $registrationId): void
    {
        $pdo = Connection::get();
        $sql = $providerType === 'tutor'
            ? 'SELECT user_id FROM tutors WHERE id = ? LIMIT 1'
            : 'SELECT user_id FROM study_rooms WHERE id = ? AND deleted_at IS NULL LIMIT 1';
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$registrationId]);
        $owner = $stmt->fetchColumn();
        if ($owner === false || (int) $owner !== $userId) {
            throw new \InvalidArgumentException('이 등록에는 인사를 올릴 수 없어요.');
        }
    }

    /** @return array<string, mixed>|null */
    private function find(string $providerType, int $registrationId): ?array
    {
        foreach ($this->read() as $row) {
            if (($row['provider_type'] ?? '') === $providerType && (int) ($row['registration_id'] ?? 0) === $registrationId) {
                return $row;
            }
        }
        return null;
    }

    /** @param array<string, mixed> $row */
    private function upsert(array $row): void
    {
        $items = array_values(array_filter(
            $this->read(),
            static fn (array $item): bool => !(
                ($item['provider_type'] ?? '') === $row['provider_type']
                && (int) ($item['registration_id'] ?? 0) === (int) $row['registration_id']
            ),
        ));
        $items[] = $row;
        $this->write($items);
    }

    /** @return list<array<string, mixed>> */
    private function read(): array
    {
        if (!is_file($this->file)) {
            return [];
        }
        $raw = file_get_contents($this->file);
        if (!is_string($raw) || $raw === '') {
            return [];
        }
        $data = json_decode($raw, true);
        return is_array($data) ? array_values(array_filter($data, 'is_array')) : [];
    }

    /** @param list<array<string, mixed>> $items */
    private function write(array $items): void
    {
        $dir = dirname($this->file);
        if (!is_dir($dir) && !mkdir($dir, 0775, true) && !is_dir($dir)) {
            throw new \RuntimeException('저장 폴더를 만들지 못했습니다.');
        }
        $json = json_encode(array_values($items), JSON_UNESCAPED_UNICODE);
        if ($json === false) {
            throw new \RuntimeException('저장에 실패했습니다.');
        }
        file_put_contents($this->file, $json, LOCK_EX);
    }

    public static function tutorCardCondition(string $alias = 't'): string
    {
        $ownerSql = WithdrawnOwnerSql::notWithdrawn("{$alias}.user_id");
        return "{$alias}.profile_status <> 'hidden'
            AND {$ownerSql}
            AND EXISTS (
              SELECT 1 FROM tutor_regions tr_gate
               WHERE tr_gate.tutor_id = {$alias}.id
                 AND tr_gate.priority_order = 0
                 AND tr_gate.region_id IS NOT NULL
                 AND tr_gate.region_id <> 0
            )";
    }

    public static function studyRoomCardCondition(string $alias = 'sr'): string
    {
        $ownerSql = WithdrawnOwnerSql::notWithdrawn("{$alias}.user_id");
        return "{$alias}.profile_status <> 'hidden'
            AND {$alias}.deleted_at IS NULL
            AND {$ownerSql}
            AND EXISTS (
              SELECT 1 FROM study_room_regions srr_gate
               WHERE srr_gate.study_room_id = {$alias}.id
                 AND srr_gate.slot = 1
                 AND srr_gate.region_id IS NOT NULL
                 AND srr_gate.region_id <> 0
            )";
    }

    public static function welcomeDaysLeft(string $createdAtStr, int $now = 0): ?int
    {
        $createdEpoch = strtotime($createdAtStr);
        if ($createdEpoch === false) {
            return null;
        }
        if ($now <= 0) {
            $now = time();
        }
        $diff = ($createdEpoch + 7 * 86400) - $now;
        if ($diff <= 0) {
            return null;
        }
        return (int) ceil($diff / 86400);
    }

    /**
     * @return array{neighborhood: string, display_name: string, updated_at: int, days_left: int}|null
     */
    private function welcomeInfoForMine(int $userId, string $providerType, int $registrationId): ?array
    {
        try {
            $pdo = Connection::get();
            $since = date('Y-m-d H:i:s', time() - 7 * 86400);

            if ($providerType === 'tutor') {
                $cond = self::tutorCardCondition('t');
                $stmt = $pdo->prepare(
                    "SELECT t.id, t.user_id, t.tutor_display_name, t.created_at,
                            " . self::TUTOR_UNIT_COLUMNS . "
                       FROM tutors t
                       JOIN tutor_regions tr ON tr.tutor_id = t.id AND tr.priority_order = 0
                       JOIN regions r ON r.id = tr.region_id
                      WHERE t.id = ?
                        AND t.user_id = ?
                        AND t.created_at >= ?
                        AND {$cond}
                        AND NOT EXISTS (
                          SELECT 1 FROM tutors t_old
                           WHERE t_old.user_id = t.user_id
                             AND (t_old.created_at < t.created_at OR (t_old.created_at = t.created_at AND t_old.id < t.id))
                        )
                      LIMIT 1"
                );
                $stmt->execute([$registrationId, $userId, $since]);
                $row = $stmt->fetch(\PDO::FETCH_ASSOC);
                if (!$row) {
                    return null;
                }
                $unitLabel = TutorRegionUnit::labelFromRow($row);
                if ($unitLabel === '') {
                    return null;
                }
                $createdAt = (string) $row['created_at'];
                $daysLeft = self::welcomeDaysLeft($createdAt);
                if ($daysLeft === null) {
                    return null;
                }
                $name = trim((string) ($row['tutor_display_name'] ?? ''));
                $cEpoch = strtotime($createdAt);
                return [
                    'neighborhood' => $unitLabel,
                    'display_name' => $name !== '' ? $name : '과외쌤',
                    'updated_at' => $cEpoch !== false ? (int) ($cEpoch * 1000) : 0,
                    'days_left' => $daysLeft,
                ];
            }

            $cond = self::studyRoomCardCondition('sr');
            $stmt = $pdo->prepare(
                "SELECT sr.id, sr.user_id, sr.study_room_name, sr.created_at, r.dong_name
                   FROM study_rooms sr
                   LEFT JOIN study_room_regions srr ON srr.study_room_id = sr.id AND srr.slot = 1
                   LEFT JOIN regions r ON r.id = srr.region_id
                  WHERE sr.id = ?
                    AND sr.user_id = ?
                    AND sr.created_at >= ?
                    AND {$cond}
                    AND NOT EXISTS (
                      SELECT 1 FROM study_rooms sr_old
                       WHERE sr_old.user_id = sr.user_id
                         AND (sr_old.created_at < sr.created_at OR (sr_old.created_at = sr.created_at AND sr_old.id < sr.id))
                    )
                    AND r.dong_name IS NOT NULL
                    AND TRIM(r.dong_name) <> ''
                  LIMIT 1"
            );
            $stmt->execute([$registrationId, $userId, $since]);
            $row = $stmt->fetch(\PDO::FETCH_ASSOC);
            if (!$row) {
                return null;
            }
            $createdAt = (string) $row['created_at'];
            $daysLeft = self::welcomeDaysLeft($createdAt);
            if ($daysLeft === null) {
                return null;
            }
            $name = trim((string) ($row['study_room_name'] ?? ''));
            $cEpoch = strtotime($createdAt);
            return [
                'neighborhood' => trim((string) ($row['dong_name'] ?? '')),
                'display_name' => $name !== '' ? $name : '공부방',
                'updated_at' => $cEpoch !== false ? (int) ($cEpoch * 1000) : 0,
                'days_left' => $daysLeft,
            ];
        } catch (\Throwable $e) {
            error_log('[neighborhood-welcome] welcomeInfoForMine error: ' . $e->getMessage());
            return null;
        }
    }

    private function lookupPrimaryDongName(\PDO $pdo, string $providerType, int $registrationId): string
    {
        if ($providerType === 'tutor') {
            $stmt = $pdo->prepare(
                'SELECT ' . self::TUTOR_UNIT_COLUMNS . '
                   FROM tutor_regions tr
                   JOIN regions r ON r.id = tr.region_id
                  WHERE tr.tutor_id = ? AND tr.priority_order = 0
                  LIMIT 1'
            );
            $stmt->execute([$registrationId]);
            $row = $stmt->fetch(\PDO::FETCH_ASSOC);
            return is_array($row) ? TutorRegionUnit::labelFromRow($row) : '';
        }

        $stmt = $pdo->prepare(
            'SELECT r.dong_name
               FROM study_room_regions srr
               JOIN regions r ON r.id = srr.region_id
              WHERE srr.study_room_id = ? AND srr.slot = 1
              LIMIT 1'
        );
        $stmt->execute([$registrationId]);
        $val = $stmt->fetchColumn();
        return is_string($val) ? trim($val) : '';
    }

    private function lookupDisplayName(\PDO $pdo, string $providerType, int $registrationId): string
    {
        if ($providerType === 'tutor') {
            $stmt = $pdo->prepare('SELECT tutor_display_name FROM tutors WHERE id = ? LIMIT 1');
            $stmt->execute([$registrationId]);
            $val = $stmt->fetchColumn();
            return is_string($val) && trim($val) !== '' ? trim($val) : '과외쌤';
        }

        $stmt = $pdo->prepare('SELECT study_room_name FROM study_rooms WHERE id = ? LIMIT 1');
        $stmt->execute([$registrationId]);
        $val = $stmt->fetchColumn();
        return is_string($val) && trim($val) !== '' ? trim($val) : '공부방';
    }

    /** @return list<array<string, mixed>> */
    private function listWelcomeItems(bool $full): array
    {
        try {
            $pdo = Connection::get();
        } catch (\Throwable) {
            return [];
        }

        $since = date('Y-m-d H:i:s', time() - 7 * 86400);

        $recordedKeys = [];
        foreach ($this->read() as $r) {
            $pType = (string) ($r['provider_type'] ?? '');
            $rId = (int) ($r['registration_id'] ?? 0);
            if ($rId > 0) {
                $recordedKeys[$pType . ':' . $rId] = true;
            }
        }

        $items = [];

        try {
            $tutorCond = self::tutorCardCondition('t');
            $tutorStmt = $pdo->prepare(
                "SELECT t.id, t.user_id, t.tutor_display_name, t.created_at,
                        " . self::TUTOR_UNIT_COLUMNS . "
                   FROM tutors t
                   JOIN tutor_regions tr ON tr.tutor_id = t.id AND tr.priority_order = 0
                   JOIN regions r ON r.id = tr.region_id
                  WHERE t.created_at >= ?
                    AND {$tutorCond}
                    AND NOT EXISTS (
                      SELECT 1 FROM tutors t_old
                       WHERE t_old.user_id = t.user_id
                         AND (t_old.created_at < t.created_at OR (t_old.created_at = t.created_at AND t_old.id < t.id))
                    )
                  ORDER BY t.created_at DESC"
            );
            $tutorStmt->execute([$since]);
            while ($row = $tutorStmt->fetch(\PDO::FETCH_ASSOC)) {
                $id = (int) $row['id'];
                if (isset($recordedKeys['tutor:' . $id])) {
                    continue;
                }
                $sigungu = TutorRegionUnit::labelFromRow($row);
                if ($sigungu === '') {
                    continue;
                }
                $body = "{$sigungu}에 새로 오신 과외쌤이에요. 반갑게 맞아 주세요!";
                if (self::validate($body) !== '') {
                    continue;
                }
                $name = trim((string) ($row['tutor_display_name'] ?? ''));
                if ($name === '') {
                    $name = '과외쌤';
                }
                $createdAt = strtotime((string) $row['created_at']);
                $updatedAt = $createdAt !== false ? (int) ($createdAt * 1000) : 0;
                $item = [
                    'provider_type' => 'tutor',
                    'registration_id' => $id,
                    'neighborhood' => $sigungu,
                    'status' => 'up',
                    'updated_at' => $updatedAt,
                    'origin' => 'welcome',
                    'masked_name' => self::maskName($name),
                    'teaser' => self::teaser($body),
                ];
                if ($full) {
                    $item['display_name'] = $name;
                    $item['body'] = $body;
                }
                $items[] = $item;
            }
        } catch (\Throwable $e) {
            error_log('[neighborhood-welcome] Tutor welcome error: ' . $e->getMessage());
        }

        try {
            $roomCond = self::studyRoomCardCondition('sr');
            $roomStmt = $pdo->prepare(
                "SELECT sr.id, sr.user_id, sr.study_room_name, sr.created_at, r.dong_name
                   FROM study_rooms sr
                   LEFT JOIN study_room_regions srr ON srr.study_room_id = sr.id AND srr.slot = 1
                   LEFT JOIN regions r ON r.id = srr.region_id
                  WHERE sr.created_at >= ?
                    AND {$roomCond}
                    AND NOT EXISTS (
                      SELECT 1 FROM study_rooms sr_old
                       WHERE sr_old.user_id = sr.user_id
                         AND (sr_old.created_at < sr.created_at OR (sr_old.created_at = sr.created_at AND sr_old.id < sr.id))
                    )
                    AND r.dong_name IS NOT NULL
                    AND TRIM(r.dong_name) <> ''
                  ORDER BY sr.created_at DESC"
            );
            $roomStmt->execute([$since]);
            while ($row = $roomStmt->fetch(\PDO::FETCH_ASSOC)) {
                $id = (int) $row['id'];
                if (isset($recordedKeys['study_room:' . $id])) {
                    continue;
                }
                $dong = trim((string) ($row['dong_name'] ?? ''));
                if ($dong === '') {
                    continue;
                }
                $body = "{$dong}에 새 공부방이 문을 열었어요. 반갑게 맞아 주세요!";
                if (self::validate($body) !== '') {
                    continue;
                }
                $name = trim((string) ($row['study_room_name'] ?? ''));
                if ($name === '') {
                    $name = '공부방';
                }
                $createdAt = strtotime((string) $row['created_at']);
                $updatedAt = $createdAt !== false ? (int) ($createdAt * 1000) : 0;
                $item = [
                    'provider_type' => 'study_room',
                    'registration_id' => $id,
                    'neighborhood' => $dong,
                    'status' => 'up',
                    'updated_at' => $updatedAt,
                    'origin' => 'welcome',
                    'masked_name' => self::maskName($name),
                    'teaser' => self::teaser($body),
                ];
                if ($full) {
                    $item['display_name'] = $name;
                    $item['body'] = $body;
                }
                $items[] = $item;
            }
        } catch (\Throwable $e) {
            error_log('[neighborhood-welcome] Room welcome error: ' . $e->getMessage());
        }

        return $items;
    }
}
